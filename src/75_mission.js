// ======================================================================
//  MISSIONS — data-driven (JSON-like) scripts + tiny interpreter, comms, objectives, debrief, persistent crew
//  Persistent crew state is the seed for the later "crews with memory" / LLM dialogue layer (see docs/VISION.md):
//  every pilot is a record that outlives a sortie (kills, status, notes) and can be fed to a dialogue model.
// ======================================================================
const game = { mode: 'free', mission: null, mstate: null, anchor: null };
const $id = id => document.getElementById(id);

// ---- persistent crew ----------------------------------------------------------------------------------
const PILOT_DEFS = {
  player: { name: 'Lt. Tom Cat', callsign: 'MEOW', trait: 'new to Eagle flight', skill: 3 },
  hawk: { name: 'Lt. Maya Okafor', callsign: 'HAWK', trait: 'flight lead, dry humour, hates the FROGGs for personal reasons', skill: 4 },
  sparrow: { name: 'Ens. Tomás Vidal', callsign: 'SPARROW', trait: 'rookie, talks when nervous', skill: 2 },
};
function freshCrew() {
  const c = {};
  for (const k in PILOT_DEFS) c[k] = { kills: 0, sorties: 0, status: 'active', notes: [] };
  return c;
}
let CREW = freshCrew();
try {
  if (!params.has('newcrew')) { const j = JSON.parse(localStorage.getItem('gs_crew') || 'null'); if (j) for (const k in CREW) if (j[k]) CREW[k] = { ...CREW[k], ...j[k] }; }
} catch (e) { /* storage unavailable: crew just lives for this session */ }
function saveCrew() { try { localStorage.setItem('gs_crew', JSON.stringify(CREW)); } catch (e) { /* ignore */ } }
function newCampaign() { CREW = freshCrew(); saveCrew(); }

// ---- comms + objectives (HUD feeds) -------------------------------------------------------------------
const comms = [];
function comm(from, text, color) {
  const mine = from !== 'FROGG';
  comms.push({ from, text, color: color || (from === 'CONTROL' ? '#ffd080' : '#7fe0ff'), t: time });
  if (comms.length > 5) comms.shift();
  if (mine) sfx('blip');
}
const objectives = [];       // {id, text, state:'open'|'done'|'failed'}
function objective(id, text, st = 'open') {
  const o = objectives.find(x => x.id === id);
  if (o) { if (text) o.text = text; o.state = st; } else objectives.push({ id, text, state: st });
}

// ---- mission 1 ----------------------------------------------------------------------------------------
const MISSIONS = [{
  id: 'm01', look: 'lilypad', title: 'OPERATION LILYPAD', subtitle: 'Cover the CSS HALBERD',
  briefing:
`The escort corvette CSS HALBERD is holding station at the Lily relay while the convoy spools its jump drives. Eight minutes of exposure.

Intelligence expects a FROGG raiding party: fast fighters first to strip our screen, then torpedo bombers for the Halberd, then, if they find us soft, an escort corvette of their own.

Eagle flight (MEOW, HAWK, SPARROW) flies cover. The Halberd's point-defence will help inside 900 m, but bombers must not reach torpedo range. Kill them on the approach.

ROE: weapons free. Missiles are scarce, fly the guns first.`,
  objectivesAtStart: [],
  setup: {
    anchor: { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' },
    player: { pos: [95, 18, 120], speed: 60 },
    wingmen: [
      { pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [130, 22, 150] },
      { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [60, 8, 160] },
    ],
  },
  stages: [
    { when: { t: 4 }, do: [
      { comm: ['CONTROL', 'Eagle flight, Halberd CIC. Long-range contacts, bearing zero-zero-zero, FROGG strike group closing. Intercept before they reach the screen.'] },
      { obj: ['o1', 'Destroy the FROGG strike wave', 'open'] },
      { spawn: { grp: 'A', ships: [['leaper', 3], ['darter', 2]], bearing: [0.15, 0.05, -1], dist: 2300, spread: 220 } },
    ] },
    { when: { after: 2 }, do: [{ comm: ['HAWK', 'Eagle two, copy. Guns first, save the Swifts for the hard cases. Stay on my wing, Echo.'] }] },
    { when: { dead: 'A', delay: 3 }, do: [
      { obj: ['o1', null, 'done'] },
      { comm: ['CONTROL', 'Strike wave down. Wait, new contacts, starboard side, heavy signatures. Torpedo bombers with a gunship escort. They are going for the Halberd.'] },
      { obj: ['o2', 'Stop the torpedo bombers before they launch', 'open'] },
      { spawn: { grp: 'B', ships: [['toad', 2], ['spitter', 1], ['leaper', 1]], bearing: [1, 0.05, -0.1], dist: 2900, spread: 260 } },
    ] },
    { when: { dead: 'B', delay: 3 }, do: [
      { obj: ['o2', null, 'done'] },
      { comm: ['HAWK', 'That is the lot, I think... no. Jump flash, dead astern. Oh, that is a big one.'] },
      { jumpIn: true },
      { obj: ['o3', 'Destroy the FROGG corvette', 'open'] },
      { spawn: { grp: 'C', ships: [['gulper', 1], ['reaver', 2], ['darter', 2]], bearing: [-0.2, 0.1, 1], dist: 1900, spread: 120, jump: true } },
      { comm: ['CONTROL', 'FROGG corvette, close aboard. Burn through its screen, then go for the engines and the lash cannons. All hands, weapons free.'] },
    ] },
    { when: { dead: 'C', delay: 3 }, do: [
      { obj: ['o3', null, 'done'] },
      { comm: ['CONTROL', 'All contacts destroyed. Outstanding flying, Eagle flight. Return to the Halberd.'] },
      { end: 'win' },
    ] },
  ],
}];

MISSIONS.push({
  id: 'm02', look: 'reed', title: 'OPERATION REEDBED', subtitle: 'Fleet sweep: Bog Relay and the FROGG outpost',
  grades: [3300, 2900, 2500, 2000],
  briefing:
`Task Group Eagle (CSS HALBERD and CSS TALON, with your flight) sorties through two areas of operation. The autopilot flies the fleet between them; you take the stick again on arrival.

NAV 2, BOG RELAY: FROGG pickets are screening a relay we need. Expect fighters first, then torpedo bombers going for the escorts.

NAV 3, THE OUTPOST: a FROGG corvette, GULPER, covers the outpost with an escort of Reavers and Spitters. Break the screen, then kill the corvette: engines and lash cannons first. Subsystems can be targeted with N.

ROE: weapons free. Keep both corvettes alive; lose the Halberd and the sortie is lost.`,
  areas: {
    ao2: { name: 'BOG RELAY', look: 'ao2', arrive: 'Drives down. Bog Relay, deep space, no planet cover. Contacts on the scope soon.' },
    ao3: { name: 'FROGG OUTPOST', look: 'ao3', arrive: 'Drives down at the outpost. Gas giant on the starboard side. Expect heavy resistance.' },
  },
  setup: {
    anchor: { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' },
    fleet: [{ ship: 'halberd', id: 'talon', callsign: 'CSS TALON', pos: [-420, -30, 180] }],
    player: { pos: [140, 20, 260], speed: 60 },
    wingmen: [
      { pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [190, 26, 290] },
      { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [100, 10, 300] },
    ],
  },
  stages: [
    { when: { t: 3 }, do: [
      { comm: ['CONTROL', 'Task Group Eagle, Halberd CIC. All ships formed. Autopilot to NAV 2, Bog Relay. Sit back, Eagle flight.'] },
      { obj: ['o0', 'Autopilot to NAV 2: Bog Relay', 'open'] },
      { transit: { to: 'NAV 2 · BOG RELAY', dur: 28, area: 'ao2', lines: [
        [3, 'HAWK', 'Eagle two. Nice to see the fleet from outside for once, Echo.'],
        [10, 'SPARROW', 'Is it true the relay was dark for a week before anyone noticed?'],
        [16, 'HAWK', 'Eyes open, Sparrow. Dark does not mean empty.'],
        [23, 'CONTROL', 'Dropping out of cruise in five. Arm up, all fighters.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o0', null, 'done'] },
      { obj: ['o1', 'Destroy the FROGG pickets', 'open'] },
      { comm: ['CONTROL', 'Contacts! FROGG pickets, bearing zero-one-five. They have seen us.'] },
      { spawn: { grp: 'A', ships: [['leaper', 3], ['darter', 2]], bearing: [0.15, 0.05, -1], dist: 2300, spread: 240 } },
    ] },
    { when: { dead: 'A', delay: 4 }, do: [
      { obj: ['o1', null, 'done'] },
      { comm: ['CONTROL', 'Pickets down. More contacts, port side, heavy: torpedo bombers with a gunship. They want the Talon.'] },
      { obj: ['o2', 'Stop the torpedo bombers', 'open'] },
      { spawn: { grp: 'B', ships: [['toad', 2], ['spitter', 1], ['leaper', 2]], bearing: [-1, 0.05, -0.2], dist: 2800, spread: 260 } },
    ] },
    { when: { dead: 'B', delay: 4 }, do: [
      { obj: ['o2', null, 'done'] },
      { comm: ['CONTROL', 'Relay secure. Autopilot to NAV 3, the FROGG outpost. Rearm and rest while you can.'] },
      { obj: ['o3', 'Autopilot to NAV 3: Outpost', 'open'] },
      { transit: { to: 'NAV 3 · FROGG OUTPOST', dur: 30, area: 'ao3', lines: [
        [3, 'CONTROL', 'Intel expects a corvette-class vessel at the outpost, plus escorts. This is the big one.'],
        [11, 'SPARROW', 'Echo, if I do not make it, tell my mother I was a good pilot.'],
        [15, 'HAWK', 'You will tell her yourself, Sparrow. Stay on my wing.'],
        [25, 'CONTROL', 'Drop-out in five. Weapons free on arrival.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o3', null, 'done'] },
      { obj: ['o4', 'Destroy the FROGG corvette GULPER', 'open'] },
      { comm: ['CONTROL', 'There it is. GULPER, with a heavy screen. Burn through, then engines and lash cannons. Use N to select subsystems.'] },
      { spawn: { grp: 'C', ships: [['gulper', 1], ['reaver', 2], ['spitter', 2], ['darter', 2]], bearing: [0.2, 0.05, -1], dist: 2600, spread: 200 } },
    ] },
    { when: { dead: 'C', delay: 4 }, do: [
      { obj: ['o4', null, 'done'] },
      { comm: ['CONTROL', 'Outpost silenced. Outstanding work, Eagle flight. Bring the fleet home.'] },
      { end: 'win' },
    ] },
  ],
});

// ---- campaign mission 3: THE SEVERED NODE (docs/CAMPAIGN.md) ------------------------------------------
MISSIONS.push({
  id: 'm03', look: 'reed', title: 'THE SEVERED NODE', subtitle: 'Hold the Bog Relay while the Exeter pulls the tug logs',
  grades: [6200, 5400, 4600, 3600],
  briefing:
`Task Group Eagle, now with the frigate EXETER, has a dead Vanderbilt-Astra security tug on the Bog Relay scope. Its transponder is silent but its data core is warm. Exeter's recovery team needs about four minutes at the hulk; the FROGG pickets that stripped the tug have not left. Hold the relay, then escort the Exeter to the outpost jump point, where a Gulper has been reported. Do not fire on the tug. Intelligence will not say what is on its logs. ROE: weapons free on FROGG contacts.`,
  debriefWin: 'Logs recovered, 9.4 minutes of telemetry tagged Oasis-9 in VAC corporate format. The Exeter\'s captain has sealed them. For the record the tug\'s crew died to FROGG lasers, not to an accident. Eagle flight is not to discuss what was on the core.',
  debriefLose: 'Relay lost, logs lost. The Hive keeps moving.',
  areas: {
    ao2: { name: 'BOG RELAY', look: 'ao2', arrive: 'Drives down. Bog Relay, deep space, no planet cover. Contacts on the scope soon.' },
    ao3: { name: 'OUTPOST APPROACH', look: 'ao3', arrive: 'Drives down at the outpost jump point. Gas giant on the starboard side. The Gulper is out there.' },
  },
  setup: {
    anchor: { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' },
    fleet: [{ ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [-520, -40, 160] }],
    player: { pos: [140, 20, 260], speed: 60 },
    wingmen: [
      { pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [190, 26, 290] },
      { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [100, 10, 300] },
    ],
  },
  stages: [
    { when: { t: 3 }, do: [
      { comm: ['CONTROL', 'Task Group Eagle formed, and the Exeter is with us. Autopilot to NAV 2, Bog Relay. Recovery team to stand by.'] },
      { obj: ['o0', 'Autopilot to NAV 2: Bog Relay', 'open'] },
      { transit: { to: 'NAV 2 · BOG RELAY', dur: 28, area: 'ao2', lines: [
        [3, 'HAWK', 'A Vanderbilt-Astra tug, dead out here? Nobody strips a tug and leaves it warm, Echo.'],
        [10, 'SPARROW', 'Sir, what is a corporation tug doing at a dark relay?'],
        [16, 'HAWK', 'Not our question to ask, Sparrow. Ours is the picket screen around it.'],
        [23, 'CONTROL', 'Dropping out of cruise in five. Arm up, all fighters.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o0', null, 'done'] },
      { obj: ['o1', 'Destroy the FROGG pickets', 'open'] },
      { comm: ['CONTROL', 'Contacts! The pickets that stripped the tug, bearing zero-one-five. They have seen us.'] },
      { spawn: { grp: 'A', ships: [['leaper', 4], ['darter', 2]], bearing: [0.15, 0.05, -1], dist: 2300, spread: 240 } },
    ] },
    { when: { dead: 'A', delay: 3 }, do: [
      { obj: ['o1', null, 'done'] },
      { comm: ['CONTROL', 'Pickets down. The Exeter is going alongside the hulk. Recovery team needs four minutes at the data core. Hold them off, Eagle.'] },
      { obj: ['o2', 'Hold the relay while the Exeter recovers the logs', 'open', 240] },
    ] },
    { when: { after: 60 }, do: [
      { comm: ['CONTROL', 'More contacts, port side, heavy signatures: torpedo bombers. They are going for the Exeter.'] },
      { spawn: { grp: 'B', ships: [['toad', 2], ['spitter', 1], ['darter', 2]], bearing: [-1, 0.05, -0.2], dist: 2800, spread: 260 } },
    ] },
    { when: { after: 90 }, do: [
      { comm: ['HAWK', 'Second wave, off the bow: Reavers. Stay between them and the Exeter, Echo.'] },
      { spawn: { grp: 'C', ships: [['reaver', 3], ['leaper', 2]], bearing: [0.6, 0.05, -0.8], dist: 2600, spread: 220 } },
    ] },
    { when: { after: 90, dead: 'C', delay: 3 }, do: [
      { obj: ['o2', 'Hold the relay while the Exeter recovers the logs', 'done'] },
      { comm: ['CONTROL', 'Data core aboard and sealed. The Exeter is clear to pull. Autopilot to NAV 3, the outpost jump point.'] },
      { obj: ['o3', 'Autopilot to NAV 3: Outpost', 'open'] },
      { transit: { to: 'NAV 3 · OUTPOST APPROACH', dur: 30, area: 'ao3', lines: [
        [3, 'CONTROL', 'Long-range sweep puts a FROGG corvette at the jump point. Gulper class, with a full screen.'],
        [11, 'SPARROW', 'Four minutes of logs and now a Gulper. This relay gets better and better.'],
        [16, 'HAWK', 'Steady, Sparrow. One corvette is one corvette.'],
        [25, 'CONTROL', 'Drop-out in five. Weapons free on arrival.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o3', null, 'done'] },
      { obj: ['o4', 'Destroy the FROGG corvette GULPER and its screen', 'open'] },
      { comm: ['CONTROL', 'There it is. GULPER, with a heavy escort screen. Burn through, then engines and lash cannons.'] },
      { spawn: { grp: 'D', ships: [['gulper', 1], ['reaver', 2], ['spitter', 2], ['darter', 3]], bearing: [0.2, 0.05, -1], dist: 2600, spread: 200 } },
    ] },
    { when: { dead: 'D', delay: 4 }, do: [
      { obj: ['o4', null, 'done'] },
      { comm: ['CONTROL', 'Jump point clear and the logs are aboard. Bring the task group home, Eagle flight.'] },
      { end: 'win' },
    ] },
  ],
});

// ---- campaign mission 4: SHORT LEASH (docs/CAMPAIGN.md) -----------------------------------------------
MISSIONS.push({
  id: 'm04', look: 'ao3', title: 'SHORT LEASH', subtitle: 'Defend the Exeter through her jump window',
  grades: [4200, 3400, 2600, 1800],
  briefing:
`The Exeter has two jump cycles left before Fold stress forces a refit, and the second leaves in six minutes. Until then she sits at the outpost with her drive hot and her screen thin. The Merlin has no armour to speak of and no magazine to waste; use speed and stay inside her point-defence envelope. FROGG strike groups are inbound in three waves. Fighters that stray beyond 1.5 km are on their own. If the Exeter dies, so does the way home.`,
  debriefWin: 'Exeter cleared the Fold with two squadrons docked: yours and the Halberd\'s. The Gulper came late, which tells us the Hive reads our jump windows. Merlin flights are staying in the rotation.',
  debriefLose: 'The Exeter is gone. Everything outside her bay is marooned. Eagle flight\'s logs end here.',
  setup: {
    anchor: { ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [0, 0, 0], vital: true, ai: 'capital' },
    fleet: [{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [-380, -20, 140] }],
    player: { ship: 'merlin', pos: [160, 30, 420], speed: 60 },
    wingmen: [
      { pilot: 'hawk', ship: 'merlin', callsign: 'HAWK', pos: [210, 36, 470] },
      { pilot: 'sparrow', ship: 'merlin', callsign: 'SPARROW', pos: [110, 18, 480] },
    ],
  },
  stages: [
    { when: { t: 4 }, do: [
      { comm: ['CONTROL', 'Exeter CIC to Eagle flight. Drive is hot, jump window opens in six minutes. Hold the screen until then.'] },
      { obj: ['o1', 'Defend the Exeter until her jump drive is ready', 'open', 360] },
    ] },
    { when: { after: 4 }, do: [
      { comm: ['CONTROL', 'Contacts! First FROGG strike group inbound. Intercept and kill them on the approach.'] },
      { spawn: { grp: 'A', ships: [['darter', 4], ['leaper', 3]], bearing: [0.15, 0.05, -1], dist: 2300, spread: 240 } },
    ] },
    { when: { after: 56 }, do: [
      { comm: ['CONTROL', 'Drive spool at four minutes. Keep the bombers off her flanks.'] },
    ] },
    { when: { after: 56 }, do: [
      { comm: ['CONTROL', 'Second wave: torpedo bombers with a gunship escort. They want the Exeter. All fighters on them.'] },
      { spawn: { grp: 'B', ships: [['toad', 2], ['spitter', 2], ['reaver', 2]], bearing: [-1, 0.05, -0.2], dist: 2800, spread: 260 } },
    ] },
    { when: { after: 64 }, do: [
      { comm: ['HAWK', 'Three minutes on the drive. Stay inside the point-defence envelope, Echo. The Merlin does not tank anything.'] },
    ] },
    { when: { after: 76 }, do: [
      { jumpIn: true },
      { comm: ['CONTROL', 'Jump flash, long range! A Gulper with a strike escort. That is the third wave, all ships engage.'] },
      { spawn: { grp: 'C', ships: [['reaver', 3], ['spitter', 3], ['toad', 2], ['gulper', 1]], bearing: [-0.2, 0.1, 1], dist: 2600, spread: 180, jump: true } },
    ] },
    { when: { after: 44 }, do: [
      { comm: ['CONTROL', 'One minute on the drive. Hold the line, Eagle.'] },
    ] },
    { when: { after: 60 }, do: [
      { obj: ['o1', 'Defend the Exeter until her jump drive is ready', 'done'] },
      { comm: ['CONTROL', 'Drive is spooled and the window is open. Exeter is jumping. Well flown, Eagle flight.'] },
      { end: 'win' },
    ] },
  ],
});

// ---- campaign mission 5: THE SPINE (docs/CAMPAIGN.md) -------------------------------------------------
MISSIONS.push({
  id: 'm05', look: 'reed', title: 'THE SPINE', subtitle: 'Kill the Bullfrog before the vanguard jumps',
  grades: [8300, 7200, 6000, 4500],
  briefing:
`The Hive vanguard has stopped. A Bullfrog, a spine carrier six hundred metres long, is bringing its hangar online in the lee of the outpost, and every analyst agrees it is waiting for something to catch up. We cannot meet that something. We can meet the Bullfrog. Exeter will carry the heavy fire, but she cannot approach until the screen is broken. Fight through the outpost lane, jump to the anchorage, strip the Bullfrog's escorts, then kill the spine. This is the whole of the task group's strength. Do not expect a second pass.`,
  debriefWin: 'The spine is broken and the Bullfrog\'s hangar went with it. Sensors report a second jump flash at 40 km: a hive carrier, two to three kilometres long, with no escort yet. We have taken one node out of a migration, not ended it. Whatever severed the first node at Oasis-9 is still pulling the rest this way.',
  debriefLose: 'The Bullfrog completed its jump. The vanguard is through. Eagle flight is not coming home.',
  areas: {
    ao3: { name: 'OUTPOST LANE', look: 'ao3', arrive: 'Drives down in the outpost lane. The FROGG screen is between us and the anchorage.' },
    oasis: { name: 'THE ANCHORAGE', look: 'oasis', arrive: 'Drives down at the anchorage. No beacons, no planets: a node in the dark. The Bullfrog is here.' },
  },
  setup: {
    anchor: { ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [0, 0, 0], vital: true, ai: 'capital' },
    fleet: [
      { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [-380, -20, 140] },
      { ship: 'halberd', id: 'talon', callsign: 'CSS TALON', pos: [420, -30, -180] },
    ],
    player: { pos: [140, 20, 260], speed: 60 },
    wingmen: [
      { pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [190, 26, 290] },
      { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [100, 10, 300] },
    ],
  },
  stages: [
    { when: { t: 3 }, do: [
      { comm: ['CONTROL', 'Task Group Eagle formed. This is the whole of our strength. Autopilot to NAV 3, the outpost lane.'] },
      { obj: ['o0', 'Autopilot to NAV 3: Outpost lane', 'open'] },
      { transit: { to: 'NAV 3 · OUTPOST LANE', dur: 30, area: 'ao3', lines: [
        [3, 'HAWK', 'A spine carrier with its hangar hot. Whatever it is waiting for, Echo, we are not staying to meet it.'],
        [11, 'SPARROW', 'Six hundred metres. That is five Halberds, nose to tail.'],
        [16, 'HAWK', 'Then do not get in front of its lance, Sparrow.'],
        [25, 'CONTROL', 'Drop-out in five. Break their forward screen, then we jump to the anchorage.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o0', null, 'done'] },
      { obj: ['o1', 'Break the outpost lane screen', 'open'] },
      { comm: ['CONTROL', 'Contacts! FROGG forward screen, and a Gulper in the van. Clear the lane.'] },
      { spawn: { grp: 'A', ships: [['leaper', 4], ['darter', 3], ['spitter', 2], ['gulper', 1]], bearing: [0.2, 0.05, -1], dist: 2600, spread: 220 } },
    ] },
    { when: { dead: 'A', delay: 4 }, do: [
      { obj: ['o1', null, 'done'] },
      { comm: ['CONTROL', 'Lane clear. The Exeter cannot approach until the anchorage is quiet. Jump when ready, Echo.'] },
      { obj: ['o2', 'Autopilot to the anchorage', 'open'] },
      { transit: { to: 'THE ANCHORAGE', dur: 34, area: 'oasis', lines: [
        [3, 'CONTROL', 'The anchorage is a dark node off every chart. No cover for them either.'],
        [12, 'SPARROW', 'Sir, the scope is empty. I mean completely empty.'],
        [18, 'HAWK', 'It is not empty, Sparrow. It is quiet. There is a difference.'],
        [28, 'CONTROL', 'Drop-out in five. The Bullfrog and its escorts are waiting.'],
      ] } },
    ] },
    { when: { after: 3 }, do: [
      { obj: ['o2', null, 'done'] },
      { obj: ['o3', 'Clear the Bullfrog\'s fighter wing', 'open'] },
      { comm: ['CONTROL', 'The hangar is launching. Clear the fighter wing before we go for the spine.'] },
      { spawn: { grp: 'B1', ships: [['darter', 4], ['reaver', 3], ['toad', 2]], bearing: [-0.6, 0.05, -0.8], dist: 2600, spread: 260 } },
    ] },
    { when: { after: 60 }, do: [
      { comm: ['CONTROL', 'Second launch from the hangar. Keep them off the Exeter.'] },
      { spawn: { grp: 'B2', ships: [['reaver', 3], ['spitter', 3], ['leaper', 2]], bearing: [0.8, 0.05, -0.6], dist: 2600, spread: 260 } },
    ] },
    { when: { dead: 'B2', delay: 4 }, do: [
      { obj: ['o3', null, 'done'] },
      { jumpIn: true },
      { comm: ['CONTROL', 'There it is. BULLFROG, spine carrier, with two Gulpers as escort. All ships: weapons free. Kill the spine.'] },
      { obj: ['o4', 'Destroy the BULLFROG spine carrier', 'open'] },
      { spawn: { grp: 'C', ships: [['bullfrog', 1], ['gulper', 2]], bearing: [-0.2, 0.1, 1], dist: 3200, spread: 400, jump: true } },
    ] },
    { when: { dead: 'C', delay: 4 }, do: [
      { obj: ['o4', null, 'done'] },
      { spawn: { grp: 'D', ships: [['hivecarrier', 1]], bearing: [-0.4, 0.15, 0.9], dist: 40000, spread: 0, jump: true } },
      { comm: ['CONTROL', 'Spine carrier destroyed. Sensors... second jump flash at forty kilometres. A hive carrier. Do not engage. Recover all fighters.'] },
    ] },
    { when: { after: 6 }, do: [
      { end: 'win' },
    ] },
  ],
});

function bearingVec(b) { return new THREE.Vector3(b[0], b[1], b[2]).normalize(); }

function restoreCrew() { if (game.crewSnap) { CREW = JSON.parse(game.crewSnap); saveCrew(); } }
function startMission(M, seg) {
  if (!seg) game.crewSnap = JSON.stringify(CREW);     // restarts restore the roster as it was at mission start
  if (cine) cancelTransit();
  plogReset(M.title);
  clearWorld();
  comms.length = 0; objectives.length = 0;
  game.mode = 'mission'; game.mission = M;
  applyLook(M.look || 'lilypad'); cine = null; document.body.classList.remove('cine');
  game.mstate = { t: 0, stage: 0, stageT: 0, spawned: {}, ended: false, endT: 0, result: null, jumpDone: false, stats: {} };
  const su = M.setup;
  const hal = makeShip(su.anchor.ship, 0, new THREE.Vector3(...su.anchor.pos), new THREE.Quaternion(), { id: su.anchor.id, callsign: su.anchor.callsign, vital: true, ai: 'capital' });
  hal.vel.set(0, 0, -4);
  game.anchor = hal;
  const p = makeShip(su.player.ship || 'kestrel', 0, new THREE.Vector3(...su.player.pos), new THREE.Quaternion(), { player: true, callsign: 'MEOW', id: 'player', pilot: 'player' });
  p.modBase = { take: diffCfg().take }; recalcMods(p);
  p.vel.set(0, 0, -su.player.speed); p.throttle = 0.4;
  p.shots = 0; p.hitsLanded = 0;
  for (const f of su.fleet || []) makeShip(f.ship, 0, new THREE.Vector3(...f.pos), new THREE.Quaternion(), { callsign: f.callsign, id: f.id, ai: 'capital', hold: true }).vel.set(0, 0, -4);
  for (const w of su.wingmen) {
    if (CREW[w.pilot].status !== 'active') continue;
    const s = makeShip(w.ship, 0, new THREE.Vector3(...w.pos), new THREE.Quaternion(), { callsign: w.callsign, id: w.pilot, pilot: w.pilot, ai: 'fighter', skill: CREW[w.pilot].skill });
    s.vel.set(0, 0, -su.player.speed); s.ai.aggr = 0.9;
  }
  game.seg = null;
  if (seg) {                       // resume at a checkpoint: the start of the current segment (after the last transit)
    const S = game.mstate;
    S.stage = seg.stage; S.area = seg.area; S.t = seg.t || 0;
    const area = M.areas && M.areas[seg.area]; if (area) applyArea(area);
    const prev = M.stages[seg.stage - 1];
    if (prev) runActions(prev.do.filter(a => !a.transit && !a.comm));
    game.seg = seg;
    $id('brief').style.display = 'none'; state = 'play'; touchStarted = true;
    if (!isTouch) lockPointer();
    comm('CONTROL', 'Segment restart. Eagle flight, you are cleared hot.');
    return;
  }
  state = 'brief'; beamsClear();
  showBriefing(M);
}

function groupAlive(g) { return ships.some(s => s.alive && s.grp === g); }
function condMet(w, S) {
  if (w.t !== undefined && S.t < w.t) return false;
  if (w.after !== undefined && S.stageT < w.after) return false;
  if (w.dead !== undefined) { if (!S.spawned[w.dead] || groupAlive(w.dead) || S.stageT < (w.delay || 0)) return false; }
  return true;
}
function runActions(list) {
  const S = game.mstate;
  for (const a of list) {
    if (a.comm) comm(a.comm[0], a.comm[1]);
    if (a.obj) {
      if (a.obj[1] || objectives.some(o => o.id === a.obj[0])) objective(a.obj[0], a.obj[1], a.obj[2]);
      if (a.obj[3] !== undefined) {                  // {obj:[id, text, 'open', N]}: "hold N seconds" -> live countdown line
        const o = objectives.find(x => x.id === a.obj[0]);
        if (o) { o.base = o.text; o.holdEnd = S.t + a.obj[3]; }
      }
    }
    if (a.jumpIn) { sfx('jump'); }
    if (a.transit) startTransit(a.transit);
    if (a.spawn) spawnGroup(a.spawn);
    if (a.end) endMission(a.end);
  }
  const ob = list.find(a => a.obj && a.obj[2] === 'open' && a.obj[1] && a.obj[3] === undefined), spw = list.find(a => a.spawn);
  if (ob && spw) { const o = objectives.find(x => x.id === ob.obj[0]); if (o) { o.grp = spw.spawn.grp; o.total = ships.filter(s => s.grp === o.grp && s.alive).length; } }
}
function spawnGroup(sp) {
  const S = game.mstate, anchor = game.anchor.group.position;
  S.spawned[sp.grp] = true;
  const dir = bearingVec(sp.bearing);
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  let n = 0;
  const D = diffCfg();
  for (const [kind, count0] of sp.ships) for (let i = 0, count = SHIPS[kind].cls === 'fighter' ? Math.max(1, Math.round(count0 * D.count)) : count0; i < count; i++, n++) {   // difficulty scales fighter counts (normal = as authored)
    const pos = anchor.clone().addScaledVector(dir, sp.dist + (kind === 'gulper' ? 0 : n * 40))
      .addScaledVector(side, (Math.random() - 0.5) * sp.spread * 2).add(new THREE.Vector3(0, (Math.random() - 0.5) * sp.spread, 0));
    const e = spawnShip(kind, 1, pos, anchor.clone().add(new THREE.Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100)), D.skill ? { grp: sp.grp, skill: clamp((SHIPS[kind].ai?.skill ?? 3) + D.skill, 1, 5) } : { grp: sp.grp });
    if (sp.jump) { flashAt(pos, e.def.radius * 2.2, 0.8); }
  }
  if (sp.jump) sfx('jump');
}

// ---- "ready to jump" prompt: shown once an area is cleared; X (or a tap on the box) starts the transit ----
let jumpEl = null;
function showJumpPrompt(to) {
  if (!jumpEl) {
    jumpEl = document.createElement('div'); jumpEl.id = 'jumpPrompt';
    jumpEl.style.cssText = 'position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:8;padding:14px 22px;text-align:center;font:600 15px/1.5 monospace;letter-spacing:.08em;color:#bff;background:rgba(5,25,35,.82);border:1px solid #4cf;border-radius:6px;display:none;cursor:pointer;touch-action:manipulation';
    jumpEl.onclick = () => jumpConfirm();
    document.body.appendChild(jumpEl);
  }
  const key = isTouch ? 'TAP HERE' : 'PRESS X';
  jumpEl.innerHTML = `AREA CLEAR<br><span style="color:#fff">${to}</span><br><span style="color:#9fd">${key} TO BEGIN JUMP</span>`;
  if (jumpEl.style.display !== 'block') { jumpEl.style.display = 'block'; comm('CONTROL', 'Area is clear. Say when, Echo, and the fleet will jump.'); }
}
function hideJumpPrompt() { if (jumpEl) jumpEl.style.display = 'none'; }
function jumpConfirm() { const S = game.mstate; if (S && jumpEl && jumpEl.style.display === 'block') S.jumpGo = true; }
addEventListener('keydown', e => { if (e.code === 'KeyX' && !e.repeat) jumpConfirm(); });

function missionUpdate(dt) {
  const M = game.mission, S = game.mstate;
  if (M && S && !S.ended) tipsTick(M, S);
  if (!M || !S || S.ended) hideJumpPrompt();
  if (!M || !S) return;
  if (state === 'cine') { cineUpdate(dt); return; }
  if (S.ended) { S.endT += dt; if (S.endT > 3.5 && !S.debriefShown) { S.debriefShown = true; showDebrief(); } return; }
  S.t += dt; S.stageT += dt;
  for (const o of objectives) if (o.holdEnd !== undefined && o.state === 'open') {   // live countdown for hold objectives
    const rem = Math.max(0, Math.ceil(o.holdEnd - S.t));
    o.text = `${o.base} · ${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`;
  }
  const st = M.stages[S.stage];
  if (st && condMet(st.when, S)) {
    const tr0 = S.stage > 0 && st.do.find(a => a.transit);
    if (tr0 && !S.jumpGo) { showJumpPrompt(tr0.transit.to); return; }     // objectives done: the player starts the jump to the next AO (owner 2026-10-24)
    hideJumpPrompt(); S.jumpGo = false;
    S.stage++; S.stageT = 0;
    const tr = st.do.find(a => a.transit);
    if (tr) game.seg = { stage: S.stage, area: tr.transit.area, t: S.t };     // checkpoint: arrival in the new area
    runActions(st.do);
  }
  if (game.anchor && !game.anchor.alive) { const an = anchorName(game.anchor); comm('CONTROL', `${an} is lost. All ships, abort. Abort.`); objective('o1', null, 'failed'); endMission('lose', `THE ${an} WAS DESTROYED`); }
  if (state === 'dead') endMission('lose', 'MEOW DOWN');
  // optional chatter: missile warnings
  if (player && player.alive) {
    if (warnState.incoming.length && time - (S.lastMslCall || -99) > 9) {
      S.lastMslCall = time;
      const w = ships.find(s => s.callsign === 'HAWK' && s.alive);
      if (w) comm('HAWK', 'Echo, missile on you! Flares, flares!');
    }
  }
}
function endMission(result, why) {
  const S = game.mstate; if (!S || S.ended) return;
  S.ended = true; S.result = result; S.why = why || ''; S.endT = 0;
  if (result === 'lose' && state !== 'dead') state = 'done';
  if (result === 'win') state = 'done';
  // persist crew outcome
  const involved = { player: true };
  for (const s of ships) if (s.pilot) involved[s.pilot] = true;
  for (const k in CREW) {
    if (!(k in involved) && CREW[k].status === 'active') continue;
    CREW[k].sorties++;
  }
  saveCrew();
}
function onShipDestroyed(s) {
  const S = game.mstate;
  if (s.team === 1) {
    const a = s.lastAttacker;
    if (a && a.pilot) {
      CREW[a.pilot].kills++;
      if (a !== player && Math.random() < 0.6) comm(a.callsign, ['Splash one!', 'Tally one down.', 'Got him!', 'FROGG down.'][Math.floor(Math.random() * 4)]);
      else if (a === player && Math.random() < 0.3) { const w = ships.find(x => x.pilot === 'hawk' && x.alive); if (w) comm('HAWK', ['Nice shooting, Echo.', 'Good kill.', 'That is how it is done.'][Math.floor(Math.random() * 3)]); }
    }
    if (S && s.def.cls === 'corvette') comm('CONTROL', 'Corvette is breaking up! Good kill!');
  } else if (s.pilot && s !== player) {
    comm('CONTROL', `${s.callsign} is down.`, '#ff8a6a');
    if (CREW[s.pilot]) {                    // death is decided by how the ship died, not a flat roll (owner 2026-10-21)
      const dc = s.deathCause || { dtype: 'kin', overkill: 0.3, reactor: false };
      let p = 0.75 - dc.overkill * 1.2 - (dc.reactor ? 0.25 : 0) - (dc.dtype === 'nuke' ? 0.3 : 0) + 0.05 * ((PILOT_DEFS[s.pilot]?.skill || 3) - 3);
      p = clamp(p, 0.05, 0.9);
      const out = Math.random() < p;
      CREW[s.pilot].status = out ? 'recovering' : 'KIA';
      CREW[s.pilot].notes.push(out ? `ejected, recovered (${Math.round(p * 100)}% chance)` : `lost in action (${dc.reactor ? 'reactor breach' : 'cockpit destroyed'}, ${Math.round(p * 100)}% eject chance)`);
      saveCrew();
    }
  }
}
function onTorpLaunch(s) { if (game.mission && s.team === 1) comm('CONTROL', 'Torpedo launch! Point defence, take them down!', '#ff8a6a'); }
function onCompDestroyed() { }

// ---- scoring + overlays -----------------------------------------------------------------------------
const SCORE = { darter: 100, leaper: 100, spitter: 150, toad: 200, reaver: 200, gulper: 800, bullfrog: 2500, hivecarrier: 5000 };
function anchorName(a) { return (a && a.callsign ? a.callsign.replace(/^CSS\s*/, '') : 'FLAGSHIP'); }
function missionStats() {
  let score = 0, n = 0;
  for (const k in killLog) { score += (SCORE[k] || 100) * killLog[k]; n += killLog[k]; }
  const hal = game.anchor, halPct = hal && hal.alive ? Math.round(100 * hal.structure / hal.def.structure) : 0;
  const acc = player && player.shots ? Math.round(100 * (player.hitsLanded || 0) / player.shots) : 0;
  const S = game.mstate;
  const win = S && S.result === 'win';
  const total = Math.round(score + (win ? 300 + halPct * 3 + (player && player.alive ? 200 : 0) : 0));
  const G = (game.mission && game.mission.grades) || [2100, 1800, 1500, 1200];
  const grade = !win ? 'F' : total > G[0] ? 'S' : total > G[1] ? 'A' : total > G[2] ? 'B' : total > G[3] ? 'C' : 'D';
  return { score, n, halPct, acc, total, grade };
}
function showBriefing(M) {
  const el = $id('brief');
  const ship = M.setup.player.ship || 'kestrel';
  const LOADOUTS = {   // per-ship briefing loadout block (weapons/stores from data/db.json)
    kestrel: '<div>2× MK-20 cannon · 2× PL-4 plasma bolter</div><div>4× SW-9 Swift (IR) · 2× LN-3 Lance (radar) · 1× HM-1 Hammer</div><div>24× flares/chaff</div>',
    merlin: '<div>2× MK-20 cannon</div><div>2× SW-9 Swift (IR)</div><div>12× flares/chaff</div>',
    bittern: '<div>2× MK-30 HE cannon · 2× PD-30 turrets</div><div>4× torpedo · 2× SW-9 Swift (IR)</div><div>32× flares/chaff</div>',
    falchion: '<div>2× MK-20 cannon · 2× MD-9 mag driver · 3× PD-30 turrets</div><div>6× SW-9 Swift (IR) · 2× LN-3 Lance (radar) · 2× HM-1 Hammer · 2× drones</div><div>32× flares/chaff</div>',
    liner: '<div>unarmed evacuation liner (jump-capable refit)</div><div>6× PD-30 turrets</div><div>24× flares/chaff</div>',
    destroyer: '<div>2× RG-90 railgun · 4× MD-55 mass driver · 8× LS-8 laser</div><div>8× PD-30 turrets · 8× HM-1 Hammer</div>',
    sar: '<div>unarmed SAR cutter (crew 3): grapple winch, pod bay</div><div>pilot recovery · no weapons</div><div>24× flares/chaff</div>',
    tern: '<div>unarmed resupply shuttle</div><div>cargo: ammunition, missiles, torpedoes, drones</div><div>12× flares/chaff</div>',
  };
  const crew = ['hawk', 'sparrow'].map(k => `<div>${PILOT_DEFS[k].callsign} <span class="dim">${PILOT_DEFS[k].name}</span> <b class="${CREW[k].status === 'active' ? 'ok' : 'bad'}">${CREW[k].status.toUpperCase()}</b> <span class="dim">${CREW[k].kills} kills / ${CREW[k].sorties} sorties</span></div>`).join('');
  el.innerHTML = `<div class="panel"><div class="sub">${GAME_TITLE.toUpperCase()} · COLONIAL DEFENCE FORCE · EAGLE FLIGHT</div><h1>${M.title}</h1><h2>${M.subtitle}</h2>
    <p>${M.briefing.replace(/\n\n/g, '</p><p>')}</p>
    <div class="cols"><div><div class="sub">YOUR WING</div>${crew}</div>
    <div><div class="sub">LOADOUT · ${SHIPS[ship].name}</div>${LOADOUTS[ship] || LOADOUTS.kestrel}</div></div>
    <div class="sub">DIFFICULTY</div><div class="skrow"><span class="seg">${Object.keys(DIFFS).map(k => `<button data-d="${k}" class="${diffName === k ? 'on' : ''}">${DIFFS[k].name}</button>`).join('')}</span></div><div class="dim">${diffCfg().blurb}. Changes apply when you launch.</div>
    <div class="sub">FLIGHT MODEL</div><div class="skrow"><span class="seg">${FM_ORDER.map(k => `<button data-fm="${k}" class="${flightMode === k ? 'on' : ''}">${FM_NAMES[k]}</button>`).join('')}</span></div><div class="dim">SIM: TIE Fighter style. Speed follows the throttle at real acceleration, the velocity vector trails the nose a little. F switches in flight.</div>
    <div class="btns"><button id="bgo">LAUNCH</button>${MISSIONS.map((m, i) => `<button class="alt bm${m === M ? ' cur' : ''}" data-i="${i}">MISSION ${i + 1}: ${m.title.replace('OPERATION ', '')}</button>`).join('')}<button id="bfree" class="alt">FREE FLIGHT</button><button id="bnew" class="alt">NEW CAMPAIGN</button><button id="bcred" class="alt">CREDITS</button><button id="bmenu" class="alt">MAIN MENU</button></div>
    <div class="dim keys">W/S throttle · mouse stick · SPACE guns · RMB/ENTER missile · G select · T/Y target · Z flares · V view · H help</div></div>`;
  el.style.display = 'flex';
  el.querySelectorAll('[data-fm]').forEach(b => { b.onclick = () => { fmSet(b.dataset.fm, true); showBriefing(M); }; });
  el.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => { diffSet(b.dataset.d); startMission(M); }; });
  $id('bgo').onclick = () => { el.style.display = 'none'; state = 'play'; if (!isTouch) lockPointer(); touchStarted = true; audioInit(); comm('CONTROL', 'Eagle flight, you are cleared hot. Good hunting.'); };
  $id('bfree').onclick = () => { el.style.display = 'none'; resetGame(); if (!isTouch) lockPointer(); touchStarted = true; audioInit(); };
  el.querySelectorAll('.bm').forEach(b => { b.onclick = () => startMission(MISSIONS[+b.dataset.i]); });
  $id('bnew').onclick = () => { newCampaign(); showBriefing(M); };
  $id('bcred').onclick = () => showCredits(true);
  $id('bmenu').onclick = () => showMainMenu();
}
function showDebrief() {
  const S = game.mstate, st = missionStats(), M = game.mission;
  const el = $id('brief');
  if (!S.careerDone) { S.careerDone = true; const rb = careerRank(careerGet().xp), ca = careerAdd((st.total + juice.bonus) / 10 * (S.result === 'win' ? 1 : 0.4), kills), ra = careerRank(ca.xp); S.careerTxt = `+${Math.round((st.total + juice.bonus) / 10 * (S.result === 'win' ? 1 : 0.4))} XP · <b>${ra.name}</b>${ra.level > rb.level ? ' <span class="ok">PROMOTED</span>' : ''} · difficulty ${diffCfg().name}`; }
  const career = S.careerTxt;
  const rows = Object.keys(killLog).map(k => `<div>${SHIPS[k].name} <b>× ${killLog[k]}</b> <span class="dim">${(SCORE[k] || 100) * killLog[k]}</span></div>`).join('') || '<div class="dim">none</div>';
  const crew = ['hawk', 'sparrow'].map(k => `<div>${PILOT_DEFS[k].callsign} <b class="${CREW[k].status === 'active' ? 'ok' : 'bad'}">${CREW[k].status.toUpperCase()}</b> <span class="dim">${CREW[k].kills} kills total</span></div>`).join('');
  el.innerHTML = `<div class="panel"><div class="sub">DEBRIEF</div><h1 class="${S.result === 'win' ? 'ok' : 'bad'}">${S.result === 'win' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}</h1>
    <h2>${S.why || M.title}</h2>
    ${(S.result === 'win' ? M.debriefWin : M.debriefLose) ? `<p>${S.result === 'win' ? M.debriefWin : M.debriefLose}</p>` : ''}
    <div class="cols"><div><div class="sub">KILLS</div>${rows}</div>
    <div><div class="sub">REPORT</div><div>Time <b>${Math.floor(S.t / 60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}</b></div><div>Accuracy <b>${st.acc}%</b></div><div>Hull damage taken <b>${Math.round(player.dmgTaken || 0)}</b></div><div>${anchorName(game.anchor)} hull <b>${st.halPct}%</b></div><div class="grade">${st.grade}<span class="dim"> ${st.total} pts</span></div></div>
    <div><div class="sub">WING</div>${crew}${juiceDebriefHtml(st.acc, player ? player.shots || 0 : 0, kills)}<div class="sub">CAREER</div><div>${career}</div></div></div>
    <div class="btns"><button id="bgo">${S.result === 'win' ? 'FLY AGAIN' : 'RETRY'}</button>${S.result === 'win' && MISSIONS[MISSIONS.indexOf(M) + 1] ? '<button id="bnext">NEXT MISSION</button>' : ''}<button id="bfree" class="alt">FREE FLIGHT</button><button id="bmenu" class="alt">MAIN MENU</button></div></div>`;
  el.style.display = 'flex';
  document.exitPointerLock?.();
  $id('bgo').onclick = () => { startMission(game.mission); };
  if ($id('bnext')) $id('bnext').onclick = () => startMission(MISSIONS[MISSIONS.indexOf(M) + 1]);
  $id('bfree').onclick = () => { el.style.display = 'none'; resetGame(); if (!isTouch) lockPointer(); };
  $id('bmenu').onclick = () => openMenu();
}

// ---- onboarding beats (UX_REVIEW S5/R4): four short CONTROL lines in mission 1, first launch only (localStorage gs_tips), touch wording on touch.
// ?tips forces them. No tutorial mission, no new UI: they ride the existing comm feed, timed around the first wave.
const TIPS_M1 = [
  [2.5, 'Throttle: W / S to speed up and slow down, SHIFT is the afterburner (it runs dry, watch the AB gauge).', 'Throttle: drag the slider on the right, BOOST is the afterburner (it runs dry).'],
  [9, 'Guns: SPACE or the left mouse button. Lead the target: aim at the small ring ahead of it.', 'Guns: hold FIRE. Aim at the small ring ahead of the target, not at the target.'],
  [17, 'Missiles: T picks the nearest bogey, keep it inside the dashed ring until the tone goes solid, then ENTER or the right mouse button.', 'Missiles: TGT picks the nearest bogey, keep it in the dashed ring until the lock chip says LOCKED, then MSL.'],
  [27, 'Missile on your tail: Z drops flares. IR missiles fall for flares, radar missiles for chaff. Press J any time to give your wingmen orders.', 'Missile on your tail: FLARE drops decoys. COMMS gives your wingmen orders.'],
];
function tipsTick(M, S) {
  if (M.id !== 'm01' || state !== 'play') return;
  let done = {}; try { done = JSON.parse(localStorage.getItem('gs_tips') || '{}'); } catch (e) { /* storage unavailable */ }
  if (done.m01 && !params.has('tips')) return;
  S.tipN = S.tipN || 0;
  const t = TIPS_M1[S.tipN];
  if (t && S.t >= t[0]) { comm('CONTROL', isTouch ? t[2] : t[1], '#9adcff'); S.tipN++; }
  if (S.tipN >= TIPS_M1.length) { done.m01 = true; try { localStorage.setItem('gs_tips', JSON.stringify(done)); } catch (e) { /* ignore */ } }
}

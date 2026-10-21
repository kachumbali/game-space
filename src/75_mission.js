// ======================================================================
//  MISSIONS — data-driven (JSON-like) scripts + tiny interpreter, comms, objectives, debrief, persistent crew
//  Persistent crew state is the seed for the later "crews with memory" / LLM dialogue layer (see docs/VISION.md):
//  every pilot is a record that outlives a sortie (kills, status, notes) and can be fed to a dialogue model.
// ======================================================================
const game = { mode: 'free', mission: null, mstate: null, anchor: null };
const $id = id => document.getElementById(id);

// ---- persistent crew ----------------------------------------------------------------------------------
const PILOT_DEFS = {
  player: { name: 'Lt. J. Koll', callsign: 'ECHO', trait: 'new to Eagle flight', skill: 3 },
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

Eagle flight (ECHO, HAWK, SPARROW) flies cover. The Halberd's point-defence will help inside 900 m, but bombers must not reach torpedo range. Kill them on the approach.

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

function bearingVec(b) { return new THREE.Vector3(b[0], b[1], b[2]).normalize(); }

function startMission(M) {
  clearWorld();
  comms.length = 0; objectives.length = 0;
  game.mode = 'mission'; game.mission = M;
  applyLook(M.look || 'lilypad'); cine = null; document.body.classList.remove('cine');
  game.mstate = { t: 0, stage: 0, stageT: 0, spawned: {}, ended: false, endT: 0, result: null, jumpDone: false, stats: {} };
  const su = M.setup;
  const hal = makeShip(su.anchor.ship, 0, new THREE.Vector3(...su.anchor.pos), new THREE.Quaternion(), { id: su.anchor.id, callsign: su.anchor.callsign, vital: true, ai: 'capital' });
  hal.vel.set(0, 0, -4);
  game.anchor = hal;
  const p = makeShip('kestrel', 0, new THREE.Vector3(...su.player.pos), new THREE.Quaternion(), { player: true, callsign: 'ECHO', id: 'player', pilot: 'player' });
  p.vel.set(0, 0, -su.player.speed); p.throttle = 0.4;
  p.shots = 0; p.hitsLanded = 0;
  for (const f of su.fleet || []) makeShip(f.ship, 0, new THREE.Vector3(...f.pos), new THREE.Quaternion(), { callsign: f.callsign, id: f.id, ai: 'capital', hold: true }).vel.set(0, 0, -4);
  for (const w of su.wingmen) {
    if (CREW[w.pilot].status !== 'active') continue;
    const s = makeShip(w.ship, 0, new THREE.Vector3(...w.pos), new THREE.Quaternion(), { callsign: w.callsign, id: w.pilot, pilot: w.pilot, ai: 'fighter', skill: CREW[w.pilot].skill });
    s.vel.set(0, 0, -su.player.speed); s.ai.aggr = 0.9;
  }
  state = 'brief';
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
    if (a.obj) objective(a.obj[0], a.obj[1], a.obj[2]);
    if (a.jumpIn) { sfx('jump'); }
    if (a.transit) startTransit(a.transit);
    if (a.spawn) spawnGroup(a.spawn);
    if (a.end) endMission(a.end);
  }
}
function spawnGroup(sp) {
  const S = game.mstate, anchor = game.anchor.group.position;
  S.spawned[sp.grp] = true;
  const dir = bearingVec(sp.bearing);
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  let n = 0;
  for (const [kind, count] of sp.ships) for (let i = 0; i < count; i++, n++) {
    const pos = anchor.clone().addScaledVector(dir, sp.dist + (kind === 'gulper' ? 0 : n * 40))
      .addScaledVector(side, (Math.random() - 0.5) * sp.spread * 2).add(new THREE.Vector3(0, (Math.random() - 0.5) * sp.spread, 0));
    const e = spawnShip(kind, 1, pos, anchor.clone().add(new THREE.Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100)), { grp: sp.grp });
    if (sp.jump) { flashAt(pos, e.def.radius * 2.2, 0.8); }
  }
  if (sp.jump) sfx('jump');
}

function missionUpdate(dt) {
  const M = game.mission, S = game.mstate;
  if (!M || !S) return;
  if (state === 'cine') { cineUpdate(dt); return; }
  if (S.ended) { S.endT += dt; if (S.endT > 3.5 && !S.debriefShown) { S.debriefShown = true; showDebrief(); } return; }
  S.t += dt; S.stageT += dt;
  const st = M.stages[S.stage];
  if (st && condMet(st.when, S)) { S.stage++; S.stageT = 0; runActions(st.do); }
  if (game.anchor && !game.anchor.alive) { comm('CONTROL', 'Halberd is lost. All ships, abort. Abort.'); objective('o1', null, 'failed'); endMission('lose', 'THE HALBERD WAS DESTROYED'); }
  if (state === 'dead') endMission('lose', 'ECHO DOWN');
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
    if (CREW[s.pilot]) { CREW[s.pilot].status = Math.random() < 0.7 ? 'recovering' : 'KIA'; CREW[s.pilot].notes.push(CREW[s.pilot].status === 'KIA' ? 'lost in action' : 'ejected, recovered'); saveCrew(); }
  }
}
function onTorpLaunch(s) { if (game.mission && s.team === 1) comm('CONTROL', 'Torpedo launch! Point defence, take them down!', '#ff8a6a'); }
function onCompDestroyed() { }

// ---- scoring + overlays -----------------------------------------------------------------------------
const SCORE = { darter: 100, leaper: 100, spitter: 150, toad: 200, reaver: 200, gulper: 800 };
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
  const crew = ['hawk', 'sparrow'].map(k => `<div>${PILOT_DEFS[k].callsign} <span class="dim">${PILOT_DEFS[k].name}</span> <b class="${CREW[k].status === 'active' ? 'ok' : 'bad'}">${CREW[k].status.toUpperCase()}</b> <span class="dim">${CREW[k].kills} kills / ${CREW[k].sorties} sorties</span></div>`).join('');
  el.innerHTML = `<div class="panel"><div class="sub">COLONIAL DEFENCE FORCE · EAGLE FLIGHT</div><h1>${M.title}</h1><h2>${M.subtitle}</h2>
    <p>${M.briefing.replace(/\n\n/g, '</p><p>')}</p>
    <div class="cols"><div><div class="sub">YOUR WING</div>${crew}</div>
    <div><div class="sub">LOADOUT · KESTREL</div><div>2× MK-20 cannon · 2× PL-4 plasma bolter</div><div>4× SW-9 Swift (IR) · 2× LN-3 Lance (radar) · 1× HM-1 Hammer</div><div>24× flares/chaff</div></div></div>
    <div class="btns"><button id="bgo">LAUNCH</button>${MISSIONS.map((m, i) => `<button class="alt bm${m === M ? ' cur' : ''}" data-i="${i}">MISSION ${i + 1}: ${m.title.replace('OPERATION ', '')}</button>`).join('')}<button id="bfree" class="alt">FREE FLIGHT</button><button id="bnew" class="alt">NEW CAMPAIGN</button></div>
    <div class="dim keys">W/S throttle · mouse stick · SPACE guns · RMB/ENTER missile · G select · T/Y target · Z flares · V view · H help</div></div>`;
  el.style.display = 'flex';
  $id('bgo').onclick = () => { el.style.display = 'none'; state = 'play'; if (!isTouch) canvas.requestPointerLock?.(); touchStarted = true; audioInit(); comm('CONTROL', 'Eagle flight, you are cleared hot. Good hunting.'); };
  $id('bfree').onclick = () => { el.style.display = 'none'; resetGame(); if (!isTouch) canvas.requestPointerLock?.(); touchStarted = true; audioInit(); };
  el.querySelectorAll('.bm').forEach(b => { b.onclick = () => startMission(MISSIONS[+b.dataset.i]); });
  $id('bnew').onclick = () => { newCampaign(); showBriefing(M); };
}
function showDebrief() {
  const S = game.mstate, st = missionStats(), M = game.mission;
  const el = $id('brief');
  const rows = Object.keys(killLog).map(k => `<div>${SHIPS[k].name} <b>× ${killLog[k]}</b> <span class="dim">${(SCORE[k] || 100) * killLog[k]}</span></div>`).join('') || '<div class="dim">none</div>';
  const crew = ['hawk', 'sparrow'].map(k => `<div>${PILOT_DEFS[k].callsign} <b class="${CREW[k].status === 'active' ? 'ok' : 'bad'}">${CREW[k].status.toUpperCase()}</b> <span class="dim">${CREW[k].kills} kills total</span></div>`).join('');
  el.innerHTML = `<div class="panel"><div class="sub">DEBRIEF</div><h1 class="${S.result === 'win' ? 'ok' : 'bad'}">${S.result === 'win' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}</h1>
    <h2>${S.why || M.title}</h2>
    <div class="cols"><div><div class="sub">KILLS</div>${rows}</div>
    <div><div class="sub">REPORT</div><div>Time <b>${Math.floor(S.t / 60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}</b></div><div>Accuracy <b>${st.acc}%</b></div><div>Hull damage taken <b>${Math.round(player.dmgTaken || 0)}</b></div><div>Halberd hull <b>${st.halPct}%</b></div><div class="grade">${st.grade}<span class="dim"> ${st.total} pts</span></div></div>
    <div><div class="sub">WING</div>${crew}</div></div>
    <div class="btns"><button id="bgo">${S.result === 'win' ? 'FLY AGAIN' : 'RETRY'}</button>${S.result === 'win' && MISSIONS[MISSIONS.indexOf(M) + 1] ? '<button id="bnext">NEXT MISSION</button>' : ''}<button id="bfree" class="alt">FREE FLIGHT</button></div></div>`;
  el.style.display = 'flex';
  document.exitPointerLock?.();
  $id('bgo').onclick = () => { startMission(game.mission); };
  if ($id('bnext')) $id('bnext').onclick = () => startMission(MISSIONS[MISSIONS.indexOf(M) + 1]);
  $id('bfree').onclick = () => { el.style.display = 'none'; resetGame(); if (!isTouch) canvas.requestPointerLock?.(); };
}

// The Long Retreat: scripted missions use existing campaign actions only.
const RETREAT_MISSIONS = [
  {
    id: 'r01', look: 'reed', title: 'LAST FREIGHT OUT', subtitle: 'Cover the outer-belt departure',
    briefing: 'The last scheduled freight is leaving the outer-belt Hollow. Cover the HALBERD while two TERN shuttles take the lane. Break the incoming pickets, bombers and corvette. The HALBERD and Eagle Flight must survive.',
    debriefWin: 'Freight crews report that the FROGGs ignored ore and targeted the lane beacon itself.',
    debriefLose: 'The screen has collapsed. Freight traffic must find another route.',
    setup: { anchor: { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0,0,0] }, fleet: [{ ship: 'tern', id: 'freight1', callsign: 'TERN ONE', pos: [-220,0,180] }, { ship: 'tern', id: 'freight2', callsign: 'TERN TWO', pos: [220,0,180] }], player: { ship: 'kestrel', pos: [90,15,110], speed: 60 }, wingmen: [{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [120,20,140] }, { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [60,10,140] }] },
    stages: [
      { when: { t: 4 }, do: [{ convoy: { id: 'r1convoy', duration: 120, ships: [{id:'freight1'}, {id:'freight2'}] } }, { obj: ['r1a','Destroy the lane pickets','open'] }, { spawn: { grp: 'A', ships: [['darter',3],['leaper',2]], bearing: [0.2,0,-1], dist: 2600, spread: 220 } }] },
      { when: { dead: 'A', delay: 3 }, do: [{ obj: ['r1a',null,'done'] }, { obj: ['r1b','Stop the bomber strike','open'] }, { spawn: { grp: 'B', ships: [['toad',2],['spitter',1],['leaper',2]], bearing: [-1,0,-0.2], dist: 2800, spread: 240 } }] },
      { when: { dead: 'B', delay: 3 }, do: [{ obj: ['r1b',null,'done'] }, { obj: ['r1c','Destroy the corvette screen','open'] }, { spawn: { grp: 'C', ships: [['gulper',1],['reaver',2]], bearing: [0,0,1], dist: 2500, spread: 200 } }] },
      { when: { dead: 'C', delay: 10 }, do: [{ obj: ['r1c',null,'done'] }, { comm: ['CONTROL','Departure window open. Eagle, return to the Halberd.'] }, { end: 'convoy' }] },
    ],
  },
  {
    id: 'r02', look: 'ao2', title: 'GHOST RELAY', subtitle: 'Recover the navigation burst',
    briefing: 'Clear the Bog Relay pickets and cover EXETER while her crew copies the navigation burst. Then jump to the dark relay spur and break the Gulper screen.',
    debriefWin: 'The burst is a repeating route-selection pattern pointing toward Lily, not a destination list.', debriefLose: 'The burst is lost with the relay screen.',
    areas: { spur: { name: 'DARK RELAY SPUR', look: 'ao3', arrive: 'Spur reached. Watch for the Gulper screen.' } },
    setup: { anchor: { ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0,0,0] }, fleet: [{ ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [-500,0,160] }], player: { ship: 'kestrel', pos: [90,15,110], speed: 60 }, wingmen: [{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [120,20,140] }, { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [60,10,140] }] },
    stages: [
      { when: { t: 4 }, do: [{ obj: ['r2a','Clear the relay pickets','open'] }, { spawn: { grp: 'A', ships: [['leaper',4],['darter',2]], bearing: [0.2,0,-1], dist: 2600, spread: 220 } }] },
      { when: { dead: 'A', delay: 3 }, do: [{ obj: ['r2a',null,'done'] }, { obj: ['r2b','Cover the burst copy','open',90] }, { spawn: { grp: 'B', ships: [['toad',2],['spitter',1],['darter',2]], bearing: [-1,0,-0.2], dist: 2800, spread: 240 } }] },
      { when: { after: 90 }, do: [{ obj: ['r2b',null,'done'] }, { comm: ['CONTROL','Copy complete. Form up for the spur.'] }, { transit: { to: 'DARK RELAY SPUR', dur: 22, area: 'spur', lines: [[5,'HAWK','Watch your fuel and missile count.'],[16,'CONTROL','Contacts ahead.']] } }] },
      { when: { after: 3 }, do: [{ obj: ['r2c','Break the Gulper screen','open'] }, { spawn: { grp: 'C', ships: [['gulper',1],['reaver',2],['spitter',2]], bearing: [0.2,0,-1], dist: 2600, spread: 220 } }] },
      { when: { dead: 'C', delay: 3 }, do: [{ obj: ['r2c',null,'done'] }, { end: 'win' }] },
    ],
  },
  {
    id: 'r03', look: 'ao2', title: 'HOLLOW NINE', subtitle: 'Defend the evacuation window',
    briefing: 'Evacuation traffic is leaving Hollow Nine. Fly Merlins and defend EXETER for six minutes while the convoy prepares its jump. HALBERD screens the frigate.',
    debriefWin: 'The evacuation left, but a habitat unable to reach the lane was abandoned.', debriefLose: 'The jump screen failed before the evacuation could leave.',
    setup: { anchor: { ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [0,0,0] }, fleet: [{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [-450,0,150] }, { ship: 'liner', id: 'evac1', callsign: 'EVAC ONE', pos: [600,0,500] }, { ship: 'liner', id: 'evac2', callsign: 'EVAC TWO', pos: [-600,0,500] }], player: { ship: 'merlin', pos: [150,30,250], speed: 60 }, wingmen: [{ pilot: 'hawk', ship: 'merlin', callsign: 'HAWK', pos: [190,30,280] }, { pilot: 'sparrow', ship: 'merlin', callsign: 'SPARROW', pos: [110,20,280] }] },
    stages: [
      { when: { t: 4 }, do: [{ convoy: {id:'r3convoy', duration:360, ships:[{id:'evac1',capacity:1000},{id:'evac2',capacity:1000}]} }, { obj: ['r3a','Defend EXETER until the evacuation window','open',360] }, { spawn: { grp: 'A', ships: [['darter',4],['leaper',3]], bearing: [0.2,0,-1], dist: 2800, spread: 240 } }] },
      { when: { after: 100 }, do: [{ comm: ['CONTROL','Second strike wave. Bombers inbound.'] }, { spawn: { grp: 'B', ships: [['toad',2],['spitter',2],['reaver',2]], bearing: [-1,0,-0.2], dist: 3000, spread: 250 } }] },
      { when: { after: 120 }, do: [{ comm: ['CONTROL','Jump flash: corvette and strike craft.'] }, { spawn: { grp: 'C', ships: [['gulper',1],['toad',2],['reaver',3]], bearing: [0,0,1], dist: 3000, spread: 250, jump: true } }] },
      { when: { after: 140 }, do: [{ obj: ['r3a',null,'done'] }, { comm: ['CONTROL','The convoy has its window. All ships withdraw.'] }, { end: 'convoy' }] },
    ],
  },
  {
    id: 'r04', look: 'ao3', title: 'NO SAFE VECTOR', subtitle: 'Withdraw through the dark anchorage',
    briefing: 'Break the forward screen and escort EXETER to the dark anchorage. Survive the Bullfrog launch cycle and withdraw on the jump window. Destroying the carrier is not required. One sealed nuclear reserve may be released by command.',
    debriefWin: 'A distant hive carrier arrives after the task group leaves. The retreat delays the advance but cannot stop it.', debriefLose: 'The task group did not clear the anchorage.',
    areas: { anchorage: { name: 'DARK ANCHORAGE', look: 'oasis', arrive: 'Anchorage reached. Stand by for launch signatures.' } },
    setup: { anchor: { ship: 'exeter', id: 'exeter', callsign: 'CSS EXETER', pos: [0,0,0] }, fleet: [{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [-450,0,150] }, { ship: 'halberd', id: 'talon', callsign: 'CSS TALON', pos: [450,0,150] }, { ship:'tern', id:'convoy1', callsign:'CONVOY ONE', pos:[600,0,500] }, { ship:'liner', id:'convoy2', callsign:'CONVOY TWO', pos:[-600,0,500] }], player: { ship: 'kestrel', pos: [150,30,250], speed: 60 }, wingmen: [{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [190,30,280] }, { pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [110,20,280] }] },
    stages: [
      { when: { t: 4 }, do: [{ obj: ['r4a','Break the forward screen','open'] }, { spawn: { grp: 'A', ships: [['leaper',4],['darter',3],['spitter',2],['gulper',1]], bearing: [0.2,0,-1], dist: 2900, spread: 260 } }] },
      { when: { dead: 'A', delay: 3 }, do: [{ obj: ['r4a',null,'done'] }, { transit: { to: 'DARK ANCHORAGE', dur: 24, area: 'anchorage', lines: [[6,'SPARROW','Are we leaving them behind?'],[13,'HAWK','We are keeping the route open.'],[20,'CONTROL','Contacts ahead.']] } }] },
      { when: { after: 3 }, do: [{ convoy: {id:'r4convoy', duration:120, ships:[{id:'convoy1'}, {id:'convoy2'}]} }, { obj: ['r4b','Survive until EXETER can withdraw','open',120] }, { spawn: { grp: 'C', ships: [['bullfrog',1]], bearing: [0.1,0,-1], dist: 3600, spread: 0, jump: true } }, { spawn: { grp: 'B1', ships: [['darter',4],['reaver',3],['toad',2]], bearing: [-0.4,0,-1], dist: 2700, spread: 260 } }] },
      { when: { after: 60 }, do: [{ nuclearRelease: true }, { comm: ['CONTROL','Another launch. Keep them off EXETER.'] }, { spawn: { grp: 'B2', ships: [['reaver',3],['spitter',3]], bearing: [0.7,0,-1], dist: 2700, spread: 260 } }] },
      { when: { after: 60 }, do: [{ obj: ['r4b',null,'done'] }, { comm: ['CONTROL','Jump window open. All ships withdraw.'] }, { end: 'convoy' }] },
    ],
  },
];
CAMPAIGNS.splice(1, 0, { id: 'long_retreat', title: 'THE LONG RETREAT', subtitle: 'Four sorties covering the withdrawal', missions: RETREAT_MISSIONS });

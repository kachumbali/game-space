// Optional SAR sorties: appended to the Long Retreat only when the feature is enabled.
const SAR_MISSIONS = [
  {
    id:'sar01', title:'BEACONS IN THE DARK', subtitle:'Cover the cutter', look:'reed', music:'rescue',
    briefing:'Two Eagle pilots are adrift beyond the departure lane. Cover the Petrel SAR cutter while it locates and recovers both beacons. It cannot pick up survivors while under attack; draw fire away and keep it alive.',
    debriefWin:'The cutter returned with both survivors.', debriefLose:'The rescue window closed before the survivors could be brought aboard.',
    sar:{ cutter:'sar1', deadline:220, survivors:[[-450,0,-700],[450,0,-900]] },
    setup:{anchor:{ship:'halberd',id:'halberd',callsign:'CSS HALBERD',pos:[0,0,300]},fleet:[{ship:'sar',id:'sar1',callsign:'RESCUE ONE',pos:[0,0,0]}],player:{ship:'kestrel',pos:[100,0,140],speed:30},wingmen:[]},
    stages:[
      {when:{t:4},do:[{comm:['CONTROL','Eagle, defend RESCUE ONE. Two beacons are active.']},{spawn:{grp:'SAR_A',ships:[['darter',2],['leaper',2]],bearing:[0,0,-1],dist:2200,spread:180}}]},
      {when:{after:50},do:[{comm:['SAR','Second group inbound. Keep them off our approach.']},{spawn:{grp:'SAR_B',ships:[['reaver',2],['spitter',1]],bearing:[-1,0,-1],dist:2400,spread:180}}]},
    ]
  },
  {
    id:'sar02', title:'LAST LIGHT', subtitle:'Recover the rear guard', look:'ao3', music:'rescue',
    briefing:'Three capsules remain after the withdrawal. Escort the Petrel SAR cutter through a hostile screen and recover the rear guard before life support expires.',
    debriefWin:'All three survivors reached the trauma bay.', debriefLose:'The rear guard was lost during the recovery attempt.',
    sar:{cutter:'sar1',deadline:230,survivors:[[-550,40,-850],[50,-40,-1100],[600,0,-900]]},
    setup:{anchor:{ship:'halberd',id:'halberd',callsign:'CSS HALBERD',pos:[0,0,350]},fleet:[{ship:'sar',id:'sar1',callsign:'RESCUE ONE',pos:[0,0,0]}],player:{ship:'falchion',pos:[100,0,140],speed:30},wingmen:[]},
    stages:[
      {when:{t:4},do:[{comm:['CONTROL','Protect RESCUE ONE and recover the three beacons.']},{spawn:{grp:'SAR_A',ships:[['darter',3],['leaper',2]],bearing:[0,0,-1],dist:2400,spread:220}}]},
      {when:{after:55},do:[{comm:['SAR','Incoming strike craft. We need cover.']},{spawn:{grp:'SAR_B',ships:[['reaver',2],['spitter',2]],bearing:[1,0,-1],dist:2400,spread:200}}]},
    ]
  },
];
if (rescueEnabled()) RETREAT_MISSIONS.push(...SAR_MISSIONS);

function sarScenarioInit(M, S) {
  if (!rescueEnabled() || !M.sar) return;
  S.sar = {cutter:ships.find(s => s.id === M.sar.cutter), records:[], deadline:M.sar.deadline};
  for (const [i, pos] of M.sar.survivors.entries()) {
    const c = rescueSpawnCapsule(game.anchor, {callsign:`SURVIVOR ${i+1}`});
    if (c) { c.group.position.set(...pos); c.vel.set(0,0,0); S.sar.records.push(c.rescueCapsule); }
  }
  objective('sar-recovery', `Recover survivors: 0/${M.sar.survivors.length}`, 'open');
}
function sarScenarioOutcome(S, required) {
  const sar = S.sar;
  if (!sar || !sar.cutter || !sar.cutter.alive || sar.cutter.dying) return 'lose';
  const recovered = sar.records.filter(r => r.outcome === 'recovered').length;
  if (recovered >= required) return 'win';
  if (sar.records.length < required || sar.records.some(r => !['adrift','recovered'].includes(r.outcome)) || S.t >= sar.deadline) return 'lose';
  return null;
}
function sarScenarioTick(M, S) {
  if (!M.sar || !S.sar) return;
  const recovered = S.sar.records.filter(r => r.outcome === 'recovered').length;
  const threatened = !!S.sar.cutter?.alive && !!rescueThreat(S.sar.cutter);
  if (threatened && !S.sar.warned) comm('SAR', 'Hostile engaging — cover the cutter! Pickup is on hold.', '#ffd080');
  S.sar.warned = threatened;
  const recentlyHit = time - (S.sar.cutter?.lastHit ?? -Infinity) < TUNE.rescue.safeAfterHit;
  const cover = threatened ? ' · HOSTILE ENGAGING — COVER THE CUTTER' : recentlyHit ? ' · RECENT DAMAGE — WAITING FOR SAFE PICKUP' : '';
  objective('sar-recovery', `Recover survivors: ${recovered}/${M.sar.survivors.length} · ${Math.ceil(Math.max(0,S.sar.deadline-S.t))}s${cover}`, 'open');
  const result = sarScenarioOutcome(S, M.sar.survivors.length);
  if (result) { objective('sar-recovery', null, result === 'win' ? 'done' : 'failed'); endMission(result, result === 'win' ? 'SURVIVORS RECOVERED' : 'RESCUE FAILED'); }
}

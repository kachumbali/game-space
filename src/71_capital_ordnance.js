// Human capital ordnance doctrine. Per-cell ammunition and clocks live in 57_launchers.
// This deliberately does not modify the Bullfrog or other FROGG launchers.
function capitalPdStats(target, cfg) {
  let original = 0, live = 0, capacity = 0;
  for (const t of target.turrets || []) {
    const weight = cfg.pdCapacity[t.wid] || 0;
    if (!(weight > 0) || t.w.kind === 'beam' || t.w.noPD) continue;
    original++;
    const c = target.comps.find(x => x.id === t.comp);
    if ((!c || c.hp > 0) && !t.dead && t.ammo > 0) { live++; capacity += weight; }
  }
  return {original, live, capacity};
}
function capitalSalvoAllowed(ready, pd, cfg) {
  return ready >= cfg.pdSalvoMultiplier * pd.capacity || (pd.original > 0 && pd.live / pd.original < cfg.pdDamagedFraction);
}
function capitalCellReady(s, c) {
  const comp = s.comps.find(x => x.id === c.comp);
  return c.ready >= 1 && c.timer <= 0 && c.wid && !WEAPONS[c.wid]?.nuclear && comp && comp.hp > comp.max * 0.5;
}
function capitalClearShot(s, cell, t, epsilon) {
  s.group.updateMatrixWorld(true);
  const from = s.group.localToWorld(new THREE.Vector3(...cell.pos));
  const delta = t.group.position.clone().sub(from), distance = delta.length();
  if (distance <= epsilon) return false;
  const start = from.clone().addScaledVector(delta.clone().normalize(), epsilon);
  if (traceShip(s, start, t.group.position)) return false;
  for (const f of ships) if (f !== s && f.alive && !f.dying && f.team === s.team &&
      segSphere(from, t.group.position, f.group.position, f.def.radius)) return false;
  return true;
}
function capitalPrepare(s) {
  const p = s.def.ordnancePlan, cfg = TUNE.ordnance.ai;
  const C = s.capitalOrdnance = {missile:{target:null,lock:0,wait:0},torpedo:{target:null,lock:0,wait:0,queue:null}, droneWait:0, contact:false, hangar:null};
  if (!p) return C;
  if (p.stores?.drone !== undefined) s.stores.drone = p.stores.drone;
  s.dlimit = p.droneLimit;
  // Split initial reloadable missile cells across the allowed types; never create rounds.
  const missile = s.launcherRuntime.filter(c => c.role === 'missile' && c.allowed.includes('rf'));
  missile.forEach((c,i) => {
    if (!(i % 2) || c.wid !== 'ir' || !(s.launcherMagazine.rf > 0)) return;
    const n = Math.min(c.cap, s.launcherMagazine.rf);
    c.wid = 'rf'; c.ready = n; launcherReconcile(s);
  });
  const h = p.hangar;
  if (h?.total > 0) {
    for (const c of h.extraComponents || []) if (!s.comps.some(x => x.id === c.id)) s.comps.push({...c, pos:c.pos.slice(), max:c.hp});
    C.hangar = {remaining:{...h.manifest}, out:[], timers:h.bayComponents.map(() => 0)};
  }
  return C;
}
function capitalHangarAI(s, C, dt) {
  const h = s.def.ordnancePlan?.hangar, H = C.hangar, cfg = TUNE.ordnance.ai;
  if (!H || !C.contact) return;
  H.out = H.out.filter(f => f.alive && !f.dying);
  for (let i = 0; i < H.timers.length; i++) {
    H.timers[i] -= dt;
    const bay = s.comps.find(c => c.id === h.bayComponents[i]);
    if (H.timers[i] > 0 || !bay || bay.hp <= 0 || H.out.length >= h.airborneCap) continue;
    const type = Object.keys(H.remaining).find(k => H.remaining[k] > 0 && SHIPS[k]);
    if (!type) continue;
    s.group.updateMatrixWorld(true);
    const pos = s.group.localToWorld(new THREE.Vector3(bay.pos[0], -s.def.half[1] - cfg.hangarClearance, bay.pos[2]));
    const f = makeShip(type, s.team, pos, s.group.quaternion.clone(), {grp:s.grp, skill:s.skill, callsign:`${s.callsign || s.def.name} ${type}`});
    f.vel.copy(s.vel); f.hitCool = cfg.hangarHitCool; H.remaining[type]--; H.out.push(f); H.timers[i] = h.interval;
    plogN('capital.hangar.launch');
  }
}
function capitalTarget(s, role, cfg) {
  const candidates = ships.filter(t => t.alive && !t.dying && t.team !== s.team && ((role === 'missile') === (t.def.cls === 'fighter')));
  candidates.sort((a,b) => s.group.position.distanceToSquared(a.group.position) - s.group.position.distanceToSquared(b.group.position));
  for (const t of candidates) {
    const d = s.group.position.distanceTo(t.group.position);
    if (d < cfg.minRange) continue;
    if (role === 'missile' && missiles.some(m => !m.dead && m.team === s.team && m.target === t && !m.w.torp)) continue;
    if (role === 'torpedo' && torpsStillNeeded(s,t) <= 0) continue;
    const available = s.launcherRuntime.some(c => c.role === role && capitalCellReady(s,c) && d <= WEAPONS[c.wid].range * cfg.rangeFraction);
    if (available) return t;
  }
  return null;
}
function capitalFireRole(s, C, role, dt) {
  const cfg = TUNE.ordnance.ai, A = C[role];
  A.wait = Math.max(0, A.wait - dt);
  if (A.queue && (!A.target?.alive || A.target.dying)) { A.queue = null; A.target = null; A.lock = 0; }
  if (!A.queue) {
    const t = capitalTarget(s, role, cfg);
    if (t !== A.target) { A.target = t; A.lock = 0; }
    if (!t) return;
    const cells = s.launcherRuntime.filter(c => c.role === role && capitalCellReady(s,c) &&
      s.group.position.distanceTo(t.group.position) <= WEAPONS[c.wid].range * cfg.rangeFraction &&
      capitalClearShot(s,c,t,cfg.selfClearanceEpsilon));
    if (!cells.length) return;
    if (role === 'torpedo') {
      const forward = new THREE.Vector3(0,0,-1).applyQuaternion(s.group.quaternion);
      if (forward.angleTo(t.group.position.clone().sub(s.group.position)) > cfg.torpedoArc) { A.lock = 0; return; }
      if (!capitalSalvoAllowed(cells.length, capitalPdStats(t,cfg), cfg)) { A.lock = 0; return; }
    }
    A.lock += dt;
    const lockTime = Math.min(...cells.map(c => WEAPONS[c.wid].lockTime)) * cfg.lockScale;
    if (A.lock < lockTime || A.wait > 0) return;
    if (role === 'torpedo') A.queue = cells.map(c => c.id);
    else {
      const cell = cells.find(c => A.lock >= WEAPONS[c.wid].lockTime * cfg.lockScale);
      if (cell && fireLauncher(s,cell,cell.wid,t)) { A.wait=cfg.missileRipple; A.lock=0; }
      return;
    }
  }
  if (A.wait > 0 || !A.queue?.length) return;
  const cell = s.launcherRuntime.find(c => c.id === A.queue[0]);
  if (!cell || !capitalCellReady(s,cell)) { A.queue.shift(); if (!A.queue.length) { A.queue=null; A.lock=0; } return; }
  if (!capitalClearShot(s,cell,A.target,cfg.selfClearanceEpsilon)) { A.queue.shift(); if (!A.queue.length) { A.queue=null; A.lock=0; } return; }
  if (fireLauncher(s,cell,cell.wid,A.target)) { A.queue.shift(); A.wait=cfg.torpedoRipple; }
  if (!A.queue.length) { A.queue=null; A.lock=0; }
}
function capitalOrdnanceAI(s, dt) {
  if (!TUNE.ordnance?.enabled || !s.launcherRuntime || s.def.fac !== 'human' || s === player) return;
  const C = s.capitalOrdnance || capitalPrepare(s), cfg = TUNE.ordnance.ai;
  if (!C.contact) C.contact = ships.some(t => t.alive && !t.dying && t.team !== s.team && s.group.position.distanceTo(t.group.position) <= cfg.contactRange);
  if (!C.contact) return;
  C.droneWait -= dt;
  if (C.droneWait <= 0 && s.stores.drone > 0) {
    const need = Math.max(0, Math.min(cfg.droneInitial, s.dlimit || 0) - dronesOf(s).length);
    if (need) launchDrones(s, C.droneWait === -dt ? need : 1);
    C.droneWait = cfg.droneInterval;
  }
  capitalHangarAI(s,C,dt);
  capitalFireRole(s,C,'missile',dt); capitalFireRole(s,C,'torpedo',dt);
}

// ======================================================================
//  DRONES — unmanned 6 m wingmen slaved to one controller (docs/FLEET_LOGIC.md 9, 9a)
//  Controller side: ctrl.drones[] (live drones), ctrl.stores.drone (stock aboard), control limit per class, ctrl.droneKills / dronesLost.
//  Drone side: s.ctrl, s.dOrder ('engage'|'all'|'protect'|'return'|'scout'|'ram'|'orphan'), s.dTgt, s.dIdx.
//  API (also on globalThis.__game): dronesOf(ctrl), launchDrones(ctrl, n), droneOrder(ctrl, order, tgt).
//  AI runs through fighterAI (70_ai.js) for the shooting orders; scout, return and ram are drone-only flight laws below.
// ======================================================================
const DRONE_ORDERS = ['engage', 'all', 'protect', 'return', 'scout', 'ram'];
const DRONE_LIMIT = { fighter: 1, corvette: 6, frigate: 6, capital: 6 };   // heavy fighter 2 = def.droneLimit; frigate: assumed 6 slaved (stock 48)
const RAM_K = 0.002, RAM_VMAX = 250;      // ram damage = K x closing speed^2 (drone mass 1): ~72 at the 190 m/s top speed (6 rams ~ one Halberd), see docs/FLEET_LOGIC.md
const SCOUT_RANGE = 2500, SCOUT_SENSE = 1800;
const DRONE_LABEL = { engage: 'ENGAGE TARGET', all: 'ENGAGE ALL', protect: 'PROTECT ME', return: 'RETURN', scout: 'SCOUT', ram: 'RAM', orphan: 'NO CONTROLLER' };
const _dqq = new THREE.Quaternion(), _dv = new THREE.Vector3(), _dw = new THREE.Vector3(), _dz = new THREE.Vector3();

const droneLimitOf = c => (c.dlimit ?? c.def.droneLimit ?? DRONE_LIMIT[c.def.cls] ?? 0);
function dronesOf(ctrl) {
  if (!ctrl || !ctrl.drones) return [];
  if (ctrl.drones.some(d => !d.alive || d.dying)) ctrl.drones = ctrl.drones.filter(d => d.alive && !d.dying);
  return ctrl.drones;
}
const validHostile = (s, t) => !!t && t.alive && !t.dying && t.team !== s.team;

// spawn up to n drones from ctrl.stores.drone, never beyond the control limit; returns the new drones
function launchDrones(ctrl, n = 1) {
  if (!ctrl || !ctrl.alive || ctrl.dying) return [];
  const live = dronesOf(ctrl);
  const k = Math.max(0, Math.min(Math.floor(n), ctrl.stores.drone | 0, droneLimitOf(ctrl) - live.length));
  const out = [];
  ctrl.group.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ctrl.group.quaternion);
  const side = new THREE.Vector3(1, 0, 0).applyQuaternion(ctrl.group.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(ctrl.group.quaternion);
  for (let i = 0; i < k; i++) {
    const idx = live.length + i;
    const pos = ctrl.group.position.clone().addScaledVector(fwd, ctrl.def.half[2] + 14 + (idx >> 3) * 12)
      .addScaledVector(side, ((idx % 8) - 3.5) * 11).addScaledVector(up, (idx % 2 ? 1 : -1) * 4);
    const d = makeShip('drone', ctrl.team, pos, ctrl.group.quaternion.clone(), { callsign: `${ctrl.callsign || ctrl.def.name} D${idx + 1}` });
    d.vel.copy(ctrl.vel);
    d.ctrl = ctrl; d.dOrder = 'protect'; d.dIdx = idx; d.dTgt = null; d.hitCool = 1;
    ctrl.drones.push(d); out.push(d);
  }
  if (k) {
    ctrl.stores.drone -= k;
    plogN('drone.launch', k); plogEvent('drones launched ×' + k);
    if (ctrl === player) log(`DRONES LAUNCHED ×${k}`, '#9ad7ff');
  }
  return out;
}

// order = 'engage'|'all'|'protect'|'return'|'scout'|'ram'; tgt = ship for engage/ram (default: the controller's target),
// for scout a range in m (or {range}); returns the number of drones tasked
function droneOrder(ctrl, order, tgt) {
  if (!DRONE_ORDERS.includes(order) || !ctrl || !ctrl.alive || ctrl.dying) return 0;
  const ds = dronesOf(ctrl);
  if (!ds.length) return 0;
  if (order === 'engage' || order === 'ram') {
    tgt = tgt || ctrl.target;
    if (!validHostile(ctrl, tgt)) return 0;
  }
  const range = order === 'scout' ? (typeof tgt === 'number' ? tgt : tgt?.range ?? SCOUT_RANGE) : 0;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(ctrl.group.quaternion);
  ds.forEach(d => {
    d.dOrder = order; d.dTgt = (order === 'engage' || order === 'ram') ? tgt : null;
    d.target = d.dTgt; d.ai.tgtT = 0;
    if (order === 'scout') { d.dDir = dir.clone(); d.dOrg = ctrl.group.position.clone(); d.dRange = range; }
  });
  plogN('drone.order.' + order); plogEvent(`drone order ${order} ×${ds.length}`);
  if (ctrl === player) log(`DRONES: ${DRONE_LABEL[order]}${tgt && tgt.def ? ' ' + tgt.def.name : ''}`, '#9ad7ff');
  return ds.length;
}

const droneHudLine = p => {
  const live = dronesOf(p).length, stock = p.stores.drone | 0;
  if (!live && !stock) return '';
  const o = live ? DRONE_LABEL[p.drones[0].dOrder] || '' : '';
  return `<div class="${live ? 'sel' : 'dim'}">DRONES ${live}/${stock}${o ? ' ' + o : ''}</div>`;
};

// ---- bookkeeping when a drone dies: credit its kills to the controller, count the loss (it stays lost) ----
function droneOnDestroy(s) {
  if (s.def.drone) {
    if (s.ctrl) s.ctrl.dronesLost = (s.ctrl.dronesLost | 0) + 1;
    plogN('drone.lost');
  }
  const la = s.lastAttacker;
  if (la && la.def.drone && la.team !== s.team && la !== s) {
    if (la.ctrl) la.ctrl.droneKills = (la.ctrl.droneKills | 0) + 1;
    la.droneKills = (la.droneKills | 0) + 1;
    plogN('drone.kills');
  }
}

// ---- AI -------------------------------------------------------------------------------------------------
function nearestHostile(s, from, maxD, pref) {
  let best = null, bs = 1e12;
  for (const e of hostilesOf(s)) {
    const d = e.group.position.distanceTo(from);
    if (d > maxD) continue;
    const sc = d * (pref && isCapital(e) ? 2.5 : 1);
    if (sc < bs) { bs = sc; best = e; }
  }
  return best;
}
function droneFormation(s, c, dt) {            // loose ring around the controller, matching its speed
  const ep = s.group.position, n = Math.max(1, dronesOf(c).length);
  const a = ((s.dIdx || 0) / n) * Math.PI * 2 + time * 0.25, R = 70 + c.def.radius * 0.5;
  _dv.set(Math.cos(a) * R, Math.sin(a * 0.7) * R * 0.25, Math.sin(a) * R).add(c.group.position);
  const dist = ep.distanceTo(_dv);
  if (dist < 40) { _dw.set(0, 0, -100).applyQuaternion(c.group.quaternion).add(ep); turnToward(s, _dw, dt, 1); }
  else turnToward(s, _dv, dt, 1.2);
  aiFly(s, { throttle: clamp((c.vel.length() + (dist - 30) * 0.6) / s.def.maxSpeed, 0.12, 1) }, dt);
}
function scoutReport(s, c) {
  if (time < (s.scT || 0)) return;
  s.scT = time + 0.4;
  for (const e of hostilesOf(s)) {
    if (e.group.position.distanceTo(s.group.position) > SCOUT_SENSE) continue;
    if (e.detectedBy) { e.detectedT = time; continue; }
    e.detectedBy = c || s; e.detectedT = time;
    if (c) (c.contacts ||= []).push(e);
    plogN('drone.contacts'); plogEvent('scout contact ' + e.def.name);
    if (c === player) log(`SCOUT: ${e.def.name} at ${Math.round(e.group.position.distanceTo(c.group.position))} m`, '#9ad7ff');
  }
}
function droneAI(s, dt) {
  const ai = s.ai;
  ai.t -= dt; ai.tgtT -= dt; ai.mslT -= dt; ai.cmT -= dt; ai.evadeT -= dt;
  (s.pPrev ||= new THREE.Vector3()).copy(s.group.position);     // start-of-step position: ram contact is swept from here
  sense(s);
  let c = s.ctrl;
  if (c && (!c.alive || c.dying)) {       // controller dead: autonomous, cannot be re-tasked (decision: defend, then fall back to the nearest friendly hull)
    s.ctrl = c = null; s.dOrder = 'orphan'; s.dTgt = null; plogN('drone.orphan');
  }
  const o = s.dOrder || 'protect', ep = s.group.position;
  if (o === 'orphan') {
    const t = nearestHostile(s, ep, 700);
    if (t) { s.target = t; return fighterAI(s, dt); }
    s.target = null;
    let home = null, hd = 1e12;
    for (const f of ships) if (f.alive && !f.dying && f.team === s.team && isCapital(f)) { const d = f.group.position.distanceTo(ep); if (d < hd) { hd = d; home = f; } }
    if (!home) { aiFly(s, { throttle: 0.05 }, dt); return; }       // nothing to return to: hold
    const a = (s.dIdx || 0) * 0.9 + time * 0.2, R = home.def.radius * 1.3 + 60;
    _dv.set(Math.cos(a) * R, 20, Math.sin(a) * R).add(home.group.position);
    turnToward(s, _dv, dt, 1); aiFly(s, { throttle: ep.distanceTo(_dv) > 200 ? 0.8 : 0.2 }, dt);
    return;
  }
  if (o === 'return') { s.target = null; return droneFormation(s, c, dt); }
  if (o === 'scout') {
    s.target = null;
    _dv.copy(s.dDir).multiplyScalar(s.dRange).add(s.dOrg);
    _dz.crossVectors(s.dDir, _up); if (_dz.lengthSq() < 1e-4) _dz.set(1, 0, 0);
    _dv.addScaledVector(_dz.normalize(), (((s.dIdx || 0) % 5) - 2) * 120);
    const dist = ep.distanceTo(_dv);
    if (dist > 60) { turnToward(s, _dv, dt, 1); aiFly(s, { throttle: 1 }, dt); }
    else { _dw.copy(s.dDir).multiplyScalar(100).add(ep); turnToward(s, _dw, dt, 1); aiFly(s, { throttle: 0.12 }, dt); }
    return scoutReport(s, c);
  }
  if (o === 'ram') {
    const t = s.dTgt;
    if (!validHostile(s, t)) { s.dOrder = 'protect'; s.dTgt = null; return droneFormation(s, c, dt); }
    s.target = t;
    const lead = leadPoint(s, t, s.def.maxSpeed).clone();
    turnToward(s, lead, dt, 1.2); aiFly(s, { throttle: 1 }, dt);
    const dist = ep.distanceTo(t.group.position);
    if (dist < 500 && aimError(s, lead) < 0.06) fireGuns(s, 3);
    return;
  }
  if (o === 'engage') {
    const t = s.dTgt;
    if (!validHostile(s, t)) { s.dOrder = 'protect'; s.dTgt = null; if (c === player) log('DRONES: TARGET LOST, PROTECTING', '#9ad7ff'); return; }
    s.target = t; return fighterAI(s, dt);
  }
  if (o === 'all') {
    if (ai.tgtT <= 0 || !validHostile(s, s.target)) { s.target = nearestHostile(s, ep, 1e9, true); ai.tgtT = 3 + Math.random() * 2; }
    if (s.target) return fighterAI(s, dt);
    return droneFormation(s, c, dt);
  }
  // protect: stay with the controller, hit whatever attacks it or comes within 800 m of it, leash 1600 m
  const la = c.lastAttacker;
  let t = (la && validHostile(s, la) && time - (c.lastHit || -99) < 6 && la.group.position.distanceTo(c.group.position) < 1500) ? la : null;
  t = t || nearestHostile(s, c.group.position, 800, false);
  if (t && ep.distanceTo(c.group.position) < 1600) { s.target = t; return fighterAI(s, dt); }
  s.target = null;
  return droneFormation(s, c, dt);
}

// ---- ramming: swept contact test from the 65_combat collision loop. Damage = RAM_K x closing speed^2 delivered as near-unshieldable
// kinetic damage (pierce 0.9) at the contact point, so the subsystem under it takes the hit. Only a drone that survives to contact gets here
// (point defence and enemy guns kill it on the way in); the drone is consumed.
function droneRamCheck(a, b) {
  const reach = b.def.radius + 14;
  if (a.group.position.distanceTo(b.group.position) > reach + a.vel.length() * 0.1) return false;
  const hit = traceShip(b, a.pPrev || a.group.position, a.group.position);
  if (!hit) return false;
  const rel = _dv.copy(a.vel).sub(b.vel), v = Math.min(RAM_VMAX, rel.length());
  const D = RAM_K * v * v;
  // the drone punches in along its line of travel: the damage point sits up to 8 m inside the skin, so the subsystem behind the contact point is the one hit
  const pen = Math.min(8, b.def.radius * 0.2);
  _dw.copy(rel).normalize().applyQuaternion(_dqq.copy(b.group.quaternion).invert());
  const inner = hit.clone().addScaledVector(_dw, pen);
  let bc = null, bd = 1e9;                      // a subsystem within reach of the penetrator takes the hit squarely
  for (const c of b.comps) {
    if (c.hp <= 0) continue;
    const d = _dz.set(c.pos[0], c.pos[1], c.pos[2]).distanceTo(hit);
    if (d < c.r * 3 + 12 && d < bd) { bd = d; bc = c; }
  }
  if (bc) inner.set(bc.pos[0], bc.pos[1], bc.pos[2]);
  const wp = b.group.localToWorld(hit.clone());
  b.lastAttacker = a;
  applyHit(b, inner, D, wp, 'kin', 0.9);
  chip(b, hit, 1.4 + D * 0.01, 3 + D * 0.02, false);
  flashAt(wp, 5, 0.3); sparksAt(wp, 40, 28); fireAt(wp, 10, 10);
  sfx('boom', b === player ? 0 : wp.distanceTo(camera.position), 0.8);
  if (b === player) shake = 1;
  plogN('drone.ram'); plogN('drone.ramdmg', D); plogEvent(`drone ram ${b.def.name} ${Math.round(D)}`);
  if (a.ctrl === player) log(`DRONE RAM: ${b.def.name} -${Math.round(D)}`, '#9ad7ff');
  killShip(a);
  return true;
}

// ======================================================================
//  AI — roles: fighter / gunship (standoff) / bomber (torpedo runs) / corvette (broadsides + PD) / capital (hold + guns)
//  Same code flies FROGGs and friendly wingmen; teams decide who shoots whom.
// ======================================================================
const _m4 = new THREE.Matrix4();
const _tq = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _pt = new THREE.Vector3();
const _af = new THREE.Vector3(), _ad = new THREE.Vector3(), _ap = new THREE.Vector3(), _ao = new THREE.Vector3();

const hostilesOf = s => ships.filter(e => e.alive && !e.dying && e.team !== s.team);
const isCapital = e => e.def.cls !== 'fighter';

function pickTarget(s) {
  const role = s.ai.role;
  let best = null, bs = 1e12;
  const pp = player && player.alive ? player.group.position : null;
  for (const e of hostilesOf(s)) {
    const d = e.group.position.distanceTo(s.group.position);
    let sc = d;
    if (role === 'bomber') sc *= isCapital(e) ? 0.25 : 2.5;
    else if (role === 'corvette' || role === 'capital') sc *= isCapital(e) ? 0.6 : 1;
    else {
      sc *= isCapital(e) ? 3 : 1;
      if (e === player) sc *= 0.8;
      if (s.team === 0 && pp) sc += e.group.position.distanceTo(pp) * 0.6;     // wingmen protect the player
      if (e.def.ai?.role === 'bomber' && s.team === 0) sc *= 0.7;
    }
    if (e.lock && 0) sc *= 1;
    if (sc < bs) { bs = sc; best = e; }
  }
  return best;
}

function turnToward(s, point, dt, mul = 1) {
  const ep = s.group.position;
  if (point.distanceToSquared(ep) < 1e-4) return 1;
  _m4.lookAt(ep, point, _up);
  _tq.setFromRotationMatrix(_m4);
  const ang = s.group.quaternion.angleTo(_tq);
  s.group.quaternion.rotateTowards(_tq, s.def.turn * turnMul(s) * mul * dt);
  return ang;
}
function aimError(s, point) {
  _af.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  return _af.angleTo(_ad.copy(point).sub(s.group.position).normalize());
}
function leadPoint(s, t, speed) {
  const rel = _ap.copy(t.vel).sub(s.vel);
  const d = t.group.position.distanceTo(s.group.position);
  const tt = d / Math.max(50, speed);
  return _ao.copy(t.group.position).addScaledVector(rel, tt).addScaledVector(s.vel, 0);
}
function primaryRange(s) {
  let r = 0;
  for (const m of s.mounts) { const w = WEAPONS[m.w]; if (!m.store) r = Math.max(r, w.v * w.life * 0.55); }
  return r || 400;
}
function primarySpeed(s) {
  for (const m of s.mounts) if (!m.store) return WEAPONS[m.w].v;
  return 500;
}
function gunsAlive(s) { return s.mounts.some(m => !m.store && (!compOf(s, m.comp) || compOf(s, m.comp).hp > 0)); }

// threat awareness: incoming missiles + enemy locks
function sense(s) {
  let inc = null, bd = 1e9;
  for (const m of missiles) {
    if (m.dead || m.team === s.team || m.target !== s) continue;
    const d = m.pos.distanceTo(s.group.position);
    if (d < bd) { bd = d; inc = m; }
  }
  s.ai.inc = inc; s.ai.incD = bd;
}

function avoidance(s, aim) {
  // steer away from big hulls
  const ep = s.group.position;
  for (const b of ships) {
    if (b === s || !b.alive || !isCapital(b)) continue;
    const d = ep.distanceTo(b.group.position);
    if (d < b.def.radius * 1.2 + 30 && !(s.ai.role === 'bomber' && s.target === b && s.ai.mode === 'run' && d > b.def.radius * 0.9)) {
      aim.copy(ep).sub(b.group.position).normalize().multiplyScalar(400).add(ep);
      return true;
    }
  }
  return false;
}

function aiUpdate(s, dt) {
  const ai = s.ai;
  ai.t -= dt; ai.tgtT -= dt; ai.mslT -= dt; ai.cmT -= dt; ai.evadeT -= dt;
  if (ai.tgtT <= 0 || !s.target || !s.target.alive || s.target.dying) { s.target = pickTarget(s); ai.tgtT = 3 + Math.random() * 3; }
  sense(s);
  if (isCapital(s)) return capitalAI(s, dt);
  if (ai.role === 'bomber') return bomberAI(s, dt);
  return fighterAI(s, dt);
}

function missileLogic(s, dt, wantIds) {
  const ai = s.ai;
  const ids = missileIds(s).filter(id => wantIds.includes(id) && s.stores[id] > 0);
  if (!ids.length || !s.target) return;
  s.sel = missileIds(s).indexOf(ids[0]);
  lockUpdate(s, dt);
  if (s.lock.state === 'locked' && ai.mslT <= 0 && s.lock.tgt === s.target) {
    launchMissile(s, ids[0]);
    ai.mslT = (WEAPONS[ids[0]].torp ? 5 : 7) + Math.random() * 4;
  }
}

function fighterAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  const gun = gunsAlive(s);
  const minD = ai.role === 'gunship' ? 230 : 70;
  let aim = _pt, thr = s.def.aiSpeed / s.def.maxSpeed, ab = false, aimed = false;
  const hurt = s.structure / s.def.structure < 0.25;
  if (!gun || (hurt && ai.aggr < 0.7)) ai.mode = 'flee';
  else if (ai.mode === 'flee') ai.mode = 'attack';
  // missile defence
  if (ai.inc && ai.incD < 600 && ai.mode !== 'flee') { if (ai.mode !== 'evade') { ai.mode = 'evade'; ai.evadeT = 2.2 + Math.random(); ai.dir = Math.random() < 0.5 ? 1 : -1; } }
  if (ai.mode === 'evade' && ai.evadeT <= 0 && !ai.inc) ai.mode = 'attack';
  if (ai.inc && ai.incD < 520 && ai.incD > 70 && ai.cmT <= 0 && s.stores.flare > 0) { deployCM(s); ai.cmT = 0.9 + Math.random(); }

  if (!t) {                       // nothing to fight: loiter around the anchor / player
    const c = (s.team === 0 && player && player.alive) ? player.group.position : (game.anchor ? game.anchor.group.position : ep);
    aim.copy(c).add(_ad.set(Math.sin(time * 0.1 + ep.x) * 180, 25, Math.cos(time * 0.1 + ep.z) * 180));
    turnToward(s, aim, dt, 0.7); flightModels.arcade(s, { throttle: 0.5 }, dt); return;
  }
  const dist = ep.distanceTo(t.group.position);
  if (ai.mode === 'attack') {
    aim.copy(leadPoint(s, t, primarySpeed(s)));
    if (dist < minD + t.def.radius * 0.4 || (ai.t <= 0 && dist < 160 && Math.random() < dt * 0.6)) { ai.mode = 'break'; ai.t = 1.8 + Math.random() * 1.5; ai.aimB = ep.clone().sub(t.group.position).normalize().multiplyScalar(300).add(new THREE.Vector3().randomDirection().multiplyScalar(160)).add(ep); }
  }
  if (ai.mode === 'break') { aim.copy(ai.aimB); thr = 1; if (ai.t <= 0) { ai.mode = 'attack'; ai.t = 4 + Math.random() * 3; } }
  if (ai.mode === 'evade') {                 // break perpendicular to the incoming missile and corkscrew
    const m = ai.inc;
    if (m) { _ad.copy(m.pos).sub(ep).normalize(); _ap.crossVectors(_ad, _up).normalize().multiplyScalar(ai.dir); aim.copy(ep).addScaledVector(_ap, 300).addScaledVector(_up, Math.sin(time * 3) * 120); }
    else aim.copy(ep).addScaledVector(_af.set(0, 0, -1).applyQuaternion(s.group.quaternion), 300);
    thr = 1; ab = true;
  }
  if (ai.mode === 'flee') { aim.copy(ep).sub(t.group.position).normalize().multiplyScalar(600).add(ep); thr = 1; ab = ai.aggr > 0.5; }
  const av = avoidance(s, aim);
  const ang = turnToward(s, aim, dt, ai.mode === 'evade' ? 1.15 : 1);
  flightModels.arcade(s, { throttle: thr, ab }, dt);
  // fire
  if (ai.mode === 'attack' && !av && gun) {
    const err = aimError(s, leadPoint(s, t, primarySpeed(s)));
    const rng = primaryRange(s);
    const tol = (ai.role === 'gunship' ? 0.045 : 0.07) / Math.max(0.6, ai.aggr + 0.3);
    if (err < tol && dist < rng) fireGuns(s, 0b11);
    else if (err < tol * 1.6 && dist < rng * 0.8) fireGuns(s, 0b10);
  }
  missileLogic(s, dt, ['ir', 'rf', 'tick']);
}

function bomberAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  if (!t) return fighterAI(s, dt);
  const cap = isCapital(t);
  if (!(s.stores.tad > 0 || s.stores.torp > 0) || !cap) { ai.role = 'fighter'; ai.aggr = 0.5; return fighterAI(s, dt); }
  const dist = ep.distanceTo(t.group.position);
  let aim = _pt, thr = 1;
  if (ai.mode === 'attack') ai.mode = 'run';
  if (ai.inc && ai.incD < 520 && ai.incD > 70 && ai.cmT <= 0 && s.stores.flare > 0) { deployCM(s); ai.cmT = 1; }
  if (ai.mode === 'run') {
    aim.copy(t.group.position);
    if (dist < t.def.radius * 0.5 + 220 || s.stores.tad + (s.stores.torp | 0) <= 0) { ai.mode = 'egress'; ai.t = 6; ai.aimB = ep.clone().sub(t.group.position).normalize().multiplyScalar(500).add(new THREE.Vector3().randomDirection().multiplyScalar(150)).add(ep); }
    // torpedo release
    const wid = s.stores.tad > 0 ? 'tad' : 'torp';
    s.sel = missileIds(s).indexOf(wid);
    lockUpdate(s, dt);
    if (s.lock.state === 'locked' && ai.mslT <= 0 && dist < WEAPONS[wid].range * 0.8) { launchMissile(s, wid); ai.mslT = 1.6; log(s.def.fac === 'frogg' ? 'FROGG TORPEDO LAUNCH' : '', '#ff8a5a'); if (typeof onTorpLaunch === 'function') onTorpLaunch(s); }
  } else {           // egress
    aim.copy(ai.aimB); if (ai.t <= 0) ai.mode = (s.stores.tad > 0) ? 'run' : 'attack';
  }
  const av = avoidance(s, aim);
  if (av) thr = 1;
  turnToward(s, aim, dt, 1);
  flightModels.arcade(s, { throttle: ai.mode === 'run' ? Math.max(0.7, s.def.aiSpeed / s.def.maxSpeed) : 1 }, dt);
  // defend with guns if a fighter is on the nose
  const p = hostilesOf(s).find(e => !isCapital(e) && e.group.position.distanceTo(ep) < 450 && aimError(s, e.group.position) < 0.07);
  if (p) fireGuns(s, 0b11);
}

function capitalAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  if (!t) { flightModels.arcade(s, { throttle: 0.1 }, dt); return; }
  const dist = ep.distanceTo(t.group.position);
  const hold = game.mission && s.vital;           // friendly flagship holds station
  const want = isCapital(t) ? 1100 : 900;
  const rng = primaryRange(s);
  const lp = leadPoint(s, t, primarySpeed(s));
  turnToward(s, lp, dt, 1);
  const thr = hold ? 0.12 : dist > want ? 0.7 : 0.15;
  flightModels.arcade(s, { throttle: thr }, dt);
  const err = aimError(s, lp);
  if (err < 0.03 && dist < rng * 1.4) fireGuns(s, 0b1);
  // torpedoes at capital targets
  if (s.stores.tad > 0 || s.stores.torp > 0) {
    const wid = s.stores.tad > 0 ? 'tad' : 'torp';
    if (isCapital(t)) { s.sel = missileIds(s).indexOf(wid); lockUpdate(s, dt); if (s.lock.state === 'locked' && ai.mslT <= 0) { launchMissile(s, wid); ai.mslT = 5; } }
  }
}

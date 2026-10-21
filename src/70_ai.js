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

// ---- squad tactics: a squad (same team + group; the player's wing is one squad) agrees on one focus target and
// holds the call for ~8 s; a pilot that is being shot to pieces breaks off and answers its attacker first ----
const SQUAD = {};
function squadFocus(s) {
  const k = s.team + ':' + (s.grp || '-'), q = SQUAD[k] || (SQUAD[k] = { t: -99, tgt: null });
  if (q.t > time) q.t = -99;                                      // clock was reset (restart)
  if (q.tgt && q.tgt.alive && !q.tgt.dying && time - q.t < 8) return q.tgt;
  const mates = ships.filter(m => m.alive && !m.dying && m.team === s.team && (m.grp || '-') === (s.grp || '-') && !isCapital(m) && m.ai?.role !== 'bomber');
  if (!mates.length) return null;
  const c = new THREE.Vector3(); for (const m of mates) c.add(m.group.position); c.multiplyScalar(1 / mates.length);
  const pp = player && player.alive ? player.group.position : null;
  let best = null, bs = 1e12;
  for (const e of hostilesOf(s)) {
    if (isCapital(e)) continue;
    let sc = e.group.position.distanceTo(c);
    sc *= 0.55 + 0.45 * (e.structure / e.def.structure);                 // finish the wounded
    if (e.def.ai?.role === 'bomber') sc *= 0.6;                         // bombers first: they kill capitals
    if (s.team === 0 && pp) sc += e.group.position.distanceTo(pp) * 0.5;  // wing protects the player
    if (sc < bs) { bs = sc; best = e; }
  }
  q.tgt = best; q.t = time;
  return best;
}
function pickTarget(s) {
  const role = s.ai.role;
  if (role !== 'bomber' && role !== 'corvette' && role !== 'capital' && !isCapital(s)) {
    const la = s.lastAttacker, hp = s.structure / s.def.structure;
    const pounded = time - (s.lastHit || -99) < 3 && la && la.alive && !la.dying && la.team !== s.team && (hp < 0.6 || s.shield.fore + s.shield.aft < 8);
    if (pounded) return la;                                              // break off the squad target and defend
    const f = squadFocus(s);
    if (f && f.alive && f.group.position.distanceTo(s.group.position) < 3500) return f;
  }
  let best = null, bs = 1e12;
  const pp = player && player.alive ? player.group.position : null;
  for (const e of hostilesOf(s)) {
    const d = e.group.position.distanceTo(s.group.position);
    let sc = d;
    if (role === 'bomber') sc *= isCapital(e) ? 0.25 : 2.5;
    else if (role === 'corvette' || role === 'capital') sc *= isCapital(e) ? 0.6 : 1;
    else {
      sc *= isCapital(e) ? 3 : 1;
      // no player preference: enemies pick the closest target
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
  for (const m of s.mounts) { const w = WEAPONS[m.w]; if (!m.store) r = Math.max(r, w.kind === 'beam' ? w.range * 0.8 : w.v * w.life * 0.55); }
  return r || 400;
}
function primarySpeed(s) {
  for (const m of s.mounts) if (!m.store && WEAPONS[m.w].v) return WEAPONS[m.w].v;
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
  if (s.lastHit && time - s.lastHit < 0.12 && s.target !== s.lastAttacker) ai.tgtT = Math.min(ai.tgtT, 0);
  if (ai.tgtT <= 0 || !s.target || !s.target.alive || s.target.dying) { s.target = pickTarget(s); ai.tgtT = 3 + Math.random() * 3; }
  sense(s);
  // crippled ships that run far enough away break contact and are removed (so waves can end)
  if (ai.mode === 'flee' && s.team === 1 && game.anchor && s.group.position.distanceTo(game.anchor.group.position) > 2600) {
    ai.fleeT = (ai.fleeT || 0) + dt;
    if (ai.fleeT > 5) { s.alive = false; if (game.mission) comm('CONTROL', 'Damaged FROGG broke contact.', '#aab8c0'); return; }
  }
  if (isCapital(s)) return capitalAI(s, dt);
  if (ai.role === 'bomber') return bomberAI(s, dt);
  return fighterAI(s, dt);
}

// ---- pilot skill 1..5 (5 = elite): aim wobble (rad), turn-rate factor, missile-lock speed, missile-warning range ----
const SKILL = { noise: [0.05, 0.032, 0.018, 0.009, 0.003], turn: [0.8, 0.9, 1, 1.08, 1.16], react: [0.35, 0.45, 0.55, 0.7, 0.9], evade: [300, 420, 560, 650, 720] };
const skillV = (s, k) => SKILL[k][clamp(Math.round(s.skill || 3), 1, 5) - 1];
const _an = new THREE.Vector3();
function aimNoise(s, dist) {          // slowly wandering aim offset: low-skill pilots lead badly and wander off the target
  const ai = s.ai;
  if (!ai.nV) { ai.nV = new THREE.Vector3(); ai.nT = 0; }
  if (time > ai.nT) { ai.nT = time + 0.4 + Math.random() * 0.3; ai.nV.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(skillV(s, 'noise')); }
  return _an.copy(ai.nV).multiplyScalar(dist);
}
function missileLogic(s, dt, wantIds) {
  const ai = s.ai;
  const ids = missileIds(s).filter(id => wantIds.includes(id) && s.stores[id] > 0);
  if (!ids.length || !s.target) return;
  s.sel = missileIds(s).indexOf(ids[0]);
  lockUpdate(s, dt * skillV(s, 'react'));          // AI pilots are slower to get a tone than a human
  const d = s.lock.d;
  if (s.lock.state === 'locked' && ai.mslT <= 0 && s.lock.tgt === s.target && d < WEAPONS[ids[0]].range * 0.7 && Math.random() < dt * 0.8) {
    launchMissile(s, ids[0]);
    ai.mslT = (WEAPONS[ids[0]].torp ? 6 : 12) + Math.random() * 8;
  }
}

function fighterAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  const gun = gunsAlive(s);
  const minD = ai.role === 'gunship' ? 230 : 70;
  let aim = _pt, thr = (s.def.aiSpeed || s.def.maxSpeed * 0.8) / s.def.maxSpeed, ab = false, aimed = false;
  const hurt = s.structure / s.def.structure < 0.25;
  if (!gun || (hurt && ai.aggr < 0.7)) ai.mode = 'flee';
  else if (ai.mode === 'flee') ai.mode = 'attack';
  // missile defence
  if (ai.inc && ai.incD < skillV(s, 'evade') && ai.mode !== 'flee') { if (ai.mode !== 'evade') { ai.mode = 'evade'; ai.evadeT = 2.2 + Math.random(); ai.dir = Math.random() < 0.5 ? 1 : -1; } }
  if (ai.mode === 'evade' && ai.evadeT <= 0 && !ai.inc) ai.mode = 'attack';
  if (ai.inc && ai.incD < 520 && ai.incD > 70 && ai.cmT <= 0 && s.stores.flare > 0) { deployCM(s); ai.cmT = 0.9 + Math.random(); }

  if (!t) {                       // nothing to fight: loiter around the anchor / player
    const c = (s.team === 0 && player && player.alive) ? player.group.position : (game.anchor ? game.anchor.group.position : ep);
    aim.copy(c).add(_ad.set(Math.sin(time * 0.1 + ep.x) * 180, 25, Math.cos(time * 0.1 + ep.z) * 180));
    turnToward(s, aim, dt, 0.7); aiFly(s, { throttle: 0.5 }, dt); return;
  }
  const dist = ep.distanceTo(t.group.position);
  const lead = leadPoint(s, t, primarySpeed(s)).clone().add(aimNoise(s, dist));
  // last-minute swerve: if a collision is imminent, break sideways instead of ramming
  if (ai.mode === 'attack' && dist < 450) {
    _ad.copy(t.group.position).sub(ep);
    const closing = _ap.copy(s.vel).sub(t.vel).dot(_ad) / Math.max(dist, 1);
    const ttc = closing > 8 ? (dist - t.def.radius - s.def.radius) / closing : 99;
    if (ttc < 1.6 + ai.aggr * 0.5) {
      _ad.normalize();
      const sd = _af.crossVectors(_ad, _up);
      if (sd.lengthSq() < 1e-4) sd.set(1, 0, 0);
      sd.normalize().multiplyScalar(ai.dir || 1);
      ai.mode = 'break'; ai.t = 1.3 + Math.random() * 1.2; ai.dir = -(ai.dir || 1);
      ai.aimB = ep.clone().addScaledVector(sd, 380).addScaledVector(_up, (Math.random() - 0.5) * 260).addScaledVector(_ad, 120);
    }
  }
  if (ai.mode === 'attack') {
    aim.copy(lead);
    if (dist < minD + t.def.radius * 0.4 || (ai.t <= 0 && dist < 160 && Math.random() < dt * 0.6)) { ai.mode = 'break'; ai.t = 1.1 + Math.random() * 1.0; ai.aimB = ep.clone().sub(t.group.position).normalize().multiplyScalar(300).add(new THREE.Vector3().randomDirection().multiplyScalar(160)).add(ep); }
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
  const ang = turnToward(s, aim, dt, (ai.mode === 'evade' ? 1.15 : 1) * skillV(s, 'turn'));
  aiFly(s, { throttle: thr, ab }, dt);
  // fire
  if (ai.mode === 'attack' && !av && gun) {
    const err = aimError(s, lead);
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
  aiFly(s, { throttle: ai.mode === 'run' ? Math.max(0.7, s.def.aiSpeed / s.def.maxSpeed) : 1 }, dt);
  // defend with guns if a fighter is on the nose
  const p = hostilesOf(s).find(e => !isCapital(e) && e.group.position.distanceTo(ep) < 450 && aimError(s, e.group.position) < 0.07);
  if (p) fireGuns(s, 0b11);
}

function capitalAI(s, dt) {
  const ai = s.ai, t = s.target, ep = s.group.position;
  if (!t) { aiFly(s, { throttle: 0.1 }, dt); return; }
  const dist = ep.distanceTo(t.group.position);
  const hold = game.mission && (s.vital || s.hold);           // friendly flagship holds station
  const want = isCapital(t) ? 1100 : 900;
  const rng = primaryRange(s);
  const lp = leadPoint(s, t, primarySpeed(s));
  turnToward(s, lp, dt, 1);
  const thr = hold ? 0.12 : dist > want ? 0.7 : 0.15;
  aiFly(s, { throttle: thr }, dt);
  const err = aimError(s, lp);
  if (err < 0.03 && dist < rng * 1.4) fireGuns(s, 0b1);
  // torpedoes at capital targets
  if (s.stores.tad > 0 || s.stores.torp > 0) {
    const wid = s.stores.tad > 0 ? 'tad' : 'torp';
    if (isCapital(t)) { s.sel = missileIds(s).indexOf(wid); lockUpdate(s, dt); if (s.lock.state === 'locked' && ai.mslT <= 0) { launchMissile(s, wid); ai.mslT = 5; } }
  }
}

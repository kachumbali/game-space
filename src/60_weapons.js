// ======================================================================
//  WEAPONS — ballistic + energy guns, guided missiles, torpedoes, countermeasures, turrets
//  Damage types: kin (kinetic) / en (energy, plasma, acid) / exp (blast). Each hits shield / armour / structure differently.
// ======================================================================
const DMGX = { kin: [0.7, 1.0, 1.0], en: [1.25, 1.0, 1.0], exp: [1.0, 1.0, 1.1], nuke: [1.0, 1.0, 1.0] };   // [shield, (armour column retired: see ARMOR), structure]

// ---- ARMOUR (FS2-style damage transform, never depletes) ----
// A ship carries { type, rating }: rating = average fraction of damage stopped; the type's profile redistributes it by damage type.
//   prof    multiplier on rating per damage type (kin / en / exp)
//   thresh  hits smaller than thresh x class scale are mostly stopped (soft quadratic cut-off): hard armour shrugs off PD and light guns
//   rate    ablative only: max damage absorbed per second as a fraction of structure (burst capacity 1.5 s); beyond it hits pass through
//   spall   share of the blocked damage that reaches a nearby internal component when the armour is breached
// Whipple (spaced) plating is documented in docs/ARMOR.md but not implemented yet.
const ARMOR = DB.armor;
// ---- friendly damage (owner request 2026-10-21): own-team bolts and blasts hurt, at a reduced multiplier ----
const FF = { bolt: 0.5, blast: 0.5 };
const _ff = new THREE.Vector3(), _fw = new THREE.Vector3();
function friendlyInLine(s, maxD = 700) {           // AI holds fire when a friendly ship sits in its gun line
  _fw.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  for (const f of ships) {
    if (f === s || !f.alive || f.dying || f.team !== s.team) continue;
    _ff.copy(f.group.position).sub(s.group.position);
    const along = _ff.dot(_fw);
    if (along < 0 || along > maxD) continue;
    if (_ff.addScaledVector(_fw, -along).length() < f.def.radius * 0.9 + 3) return true;
  }
  return false;
}
const ARMOR_THRESH_CLS = DB.armorThreshCls;

const FMX = 1.3;      // FROGG missile effectiveness vs the human equivalent (owner 2026-10-22): +30% warhead damage
const WEAPONS = DB.weapons;
const MSL_ORDER = ['ir', 'rf', 'torp', 'tick', 'tad', 'nuke'];

// ---- shared scratch + rendering of projectiles (one InstancedMesh per weapon type) -----------------
const _w1 = new THREE.Vector3(), _w2 = new THREE.Vector3(), _w3 = new THREE.Vector3(), _w4 = new THREE.Vector3(), _wq = new THREE.Quaternion();
const NEGZ = new THREE.Vector3(0, 0, -1), ONE3 = new THREE.Vector3(1, 1, 1);
const boltViz = {};
function boltVizFor(wid) {
  let v = boltViz[wid];
  if (v) return v;
  const w = WEAPONS[wid];
  const geo = w.glob ? new THREE.SphereGeometry(w.sz, 8, 6).scale(1, 1, w.len / (w.sz * 2)) : new THREE.BoxGeometry(w.sz, w.sz, w.len);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color).multiplyScalar(2.4) });
  const mesh = new THREE.InstancedMesh(geo, mat, 700);
  mesh.frustumCulled = false; mesh.count = 0; scene.add(mesh);
  return (boltViz[wid] = { mesh });
}
function renderBolts() {
  for (const k in boltViz) boltViz[k].n = 0;
  for (const b of bolts) {
    const v = boltVizFor(b.wid);
    if (v.n >= 700) continue;
    _w1.copy(b.vel).normalize();
    _wq.setFromUnitVectors(NEGZ, _w1);
    _m.compose(b.pos, _wq, ONE3);
    v.mesh.setMatrixAt(v.n++, _m);
  }
  for (const k in boltViz) { const v = boltViz[k]; v.mesh.count = v.n; v.mesh.instanceMatrix.needsUpdate = true; }
}

// ---- ammo / energy ----------------------------------------------------------------------------------
function initArmament(s) {
  const def = s.def;
  s.mounts = (def.mounts || []).map(m => ({ ...m, cool: Math.random() * 0.1 }));
  s.stores = { ...(def.stores || {}) };
  s.ammo = {};
  s.ammoMax = {};
  for (const m of s.mounts) { const w = WEAPONS[m.w]; if (w.ammo) { s.ammo[m.w] = (s.ammo[m.w] || 0) + w.ammo; s.ammoMax[m.w] = (s.ammoMax[m.w] || 0) + w.ammo; } }
  s.energy = s.energyMax || 100; s.fireMask = 3; s.sel = 0;
  s.bfocus = { tgt: null, t: 0, last: -9 };
  s.lock = { tgt: null, wid: null, p: 0, state: 'none', d: 0, ang: 9 };
  s.cm = 0;
  s.turrets = (def.turrets || []).map(t => makeTurret(s, t));
}
function missileIds(s) { return MSL_ORDER.filter(id => id in s.stores); }
function selectedMissile(s) {
  const ids = missileIds(s);
  if (!ids.length) return null;
  s.sel = ((s.sel % ids.length) + ids.length) % ids.length;
  if ((s.stores[ids[s.sel]] | 0) <= 0) {       // auto-skip empty racks
    for (let i = 1; i <= ids.length; i++) { const j = (s.sel + i) % ids.length; if (s.stores[ids[j]] > 0) { s.sel = j; return ids[j]; } }
    return ids[s.sel];
  }
  return ids[s.sel];
}
function cycleMissile(s, d = 1) {
  const ids = missileIds(s); if (!ids.length) return;
  s.sel = (s.sel + d + ids.length) % ids.length; sfx('click');
}

// ---- guns ---------------------------------------------------------------------------------------------
const CONVERGE = 450;      // fixed fighter guns converge here (m)
function spawnBolt(s, wid, wpos, dirW, spreadMul = 1, owner = s) {
  const w = WEAPONS[wid];
  const sp = w.spread * spreadMul;
  _w2.copy(dirW);
  if (sp) _w2.add(_w3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2 * sp)).normalize();
  const pos = wpos.clone();
  bolts.push({
    wid, w, team: s.team, owner, pos, prev: pos.clone(), life: w.life, dmg: w.dmg * (owner.mod?.dmg ?? 1), dt: w.dt,
    vel: _w2.clone().multiplyScalar(w.v).addScaledVector(s.vel, 0.9),
  });
}
// instant-hit beam: first ship along the ray is the one being tracked (no travel time, so no lead needed).
// Focus rule: F = {tgt,t,last} of the shooter (one per ship for fixed guns, one per turret). Damage multiplier is 0 until the beam
// has stayed on the same ship for w.acq sim-seconds, then 0.25 -> w.peak over w.ramp. A gap in contact longer than w.gap resets it.
const playerTrack = { last: -99, prog: 0, live: false, by: null };
function beamFocus(F, w, tgt) {
  if (!F || !w.acq) return 1;
  const gap = w.gap || Math.max(0.25, w.cd * 2.5);
  if (F.tgt !== tgt || time - F.last > gap) { F.tgt = tgt; F.t = 0; } else F.t += time - F.last;
  F.last = time;
  if (F.t < w.acq) return 0;
  return 0.25 + ((w.peak || 1) - 0.25) * Math.min(1, (F.t - w.acq) / w.ramp);
}
function fireBeam(s, w, wp, dirW, F, key, srcObj, srcLocal) {
  const end = wp.clone().addScaledVector(dirW, w.range);
  let bestS = null, bestHit = null, bestD = 1e9;
  for (const o of ships) {
    if (!o.alive || o === s || o.dying) continue;
    if (!segSphere(wp, end, o.group.position, o.def.radius)) continue;
    const hit = traceShip(o, wp, end); if (!hit) continue;
    const d = o.group.localToWorld(hit.clone()).distanceTo(wp);
    if (d < bestD) { bestD = d; bestS = o; bestHit = hit; }
  }
  const len = bestS ? bestD : w.range;
  const mult = bestS ? beamFocus(F, w, bestS) : 0;            // no contact: the focus is not advanced, it decays by the gap rule
  const bcol = new THREE.Color(w.color || 0xff5040);
  const live = !w.acq || mult > 0, k = live ? 3 : 0.7;            // a tracking beam is drawn thin and dim, a damaging beam bright
  const bc = [bcol.r * k, bcol.g * k, bcol.b * k, 1];
  // the visible beam is drawn by 61_beams.js (ribbon + flares); `key` identifies the firing mount/turret so one record is refreshed per shot
  const shieldUp = !!bestS && (bestS.shield.fore > 0 || bestS.shield.aft > 0);
  beamNote(key || F || s, s, w, { obj: srcObj || s.group, local: srcLocal || s.group.worldToLocal(wp.clone()) },
    bestS ? { obj: bestS.group, local: bestHit, ship: bestS } : { world: end.copy(wp).addScaledVector(dirW, len) },
    live || (!!F && F.t >= w.acq && time - F.last < 1.2), w.acq ? Math.min(1, (F ? F.t : 0) / w.acq) : 1, shieldUp);      // a focused beam that just missed is still drawn as a firing beam
  if (!bestS) { if (F && F.tgt && time - F.last > 0.5) F.tgt = null; return; }
  const fr = bestS.team === s.team;
  if (!fr && bestS === player) { playerTrack.last = time; playerTrack.prog = w.acq ? Math.min(1, F.t / w.acq) : 1; playerTrack.live = mult > 0; playerTrack.by = s; }
  plogN(live ? 'beam.live' : 'beam.track');
  if (!live) return;
  const wpH = bestS.group.localToWorld(bestHit.clone()), dmg = w.dmg * mult * (fr ? FF.bolt : 1) * (s.mod?.dmg ?? 1);
  if (!fr) { bestS.lastAttacker = s; if (s === player) player.hitsLanded = (player.hitsLanded || 0) + 1; }
  else if (bestS === player || s === player) friendlyNote(s, bestS);
  plogBoltHit({ owner: s, team: s.team }, bestS, dmg, fr);
  hitSrc = s; hitKind = 'beam';
  applyHit(bestS, bestHit, dmg, wpH, w.dt, 0);
  sfx(bestS.shield.fore > 0 || bestS.shield.aft > 0 ? 'shield' : 'hit', bestS === player ? 0 : wpH.distanceTo(camera.position), 0.5);
  if (Math.random() < 0.5) sparksAt(wpH, 3, 10, bc);
}
function fireMount(s, m) {
  const w = WEAPONS[m.w], comp = compOf(s, m.comp);
  if (comp && comp.hp <= 0) return false;
  if (m.cool > 0) return false;
  if (w.ammo && !(s.ammo[m.w] > 0)) return false;
  if (w.energy && s.energy < w.energy) return false;
  if (m.store) { if (!(s.stores[m.store] > 0)) return false; }
  s.group.updateMatrixWorld(true);
  const wp = s.group.localToWorld(_w1.set(m.pos[0], m.pos[1], m.pos[2]).clone());
  const fixedConv = s.def.cls === 'fighter';
  const dl = _w2.set(0, 0, fixedConv ? -CONVERGE : -1000).sub(_w1.set(m.pos[0], m.pos[1], m.pos[2])).normalize();
  const dirW = dl.clone().applyQuaternion(s.group.quaternion);
  if (w.kind === 'beam') fireBeam(s, w, wp, dirW, s.bfocus, m, s.group, new THREE.Vector3(m.pos[0], m.pos[1], m.pos[2])); else spawnBolt(s, m.w, wp, dirW, s.def.cls === 'fighter' ? 1 : 0.6);
  if (w.ammo) s.ammo[m.w]--;
  if (s === player) s.shots = (s.shots || 0) + 1;
  plogShot(s);
  if (w.energy) s.energy -= w.energy * (s.mod?.eff ?? 1);
  m.cool = w.cd / ((0.6 + 0.4 * powerMul(s)) * (s.mod?.rof ?? 1));
  sparksAt(wp, 1, 6, [2.4, 2.0, 1.0, 1]);
  const dist = s === player ? 0 : wp.distanceTo(camera.position);
  sfx(w.sfx, dist, s === player ? 0.9 : 0.7);
  return true;
}
// fire every ready mount in the groups of mask (bit1 = group 1, bit2 = group 2, bit4 = group 3)
function fireGuns(s, mask) {
  if (s !== player && s.ai && s.ai.hold) return false;          // comms order: weapons hold
  if (s !== player) plogTry(s);
  if (s !== player && friendlyInLine(s, Math.max(700, ...s.mounts.map(m => WEAPONS[m.w].range || 0)))) { plogHold(s); return false; }
  let n = 0, any = false;
  for (const m of s.mounts) {
    if (m.store) continue;
    if (!(mask & (1 << (m.grp - 1)))) continue;
    any = true;
    if (fireMount(s, m)) n++;
  }
  return { n, any };
}

// ---- lock-on ------------------------------------------------------------------------------------------
function lockUpdate(s, dt) {
  const L = s.lock, wid = selectedMissile(s), t = s.target;
  if (!wid || (s.stores[wid] | 0) <= 0 || !t || !t.alive || t.dying) { L.p = 0; L.tgt = null; L.wid = wid; L.state = 'none'; return; }
  const w = WEAPONS[wid];
  if (L.tgt !== t || L.wid !== wid) { L.tgt = t; L.wid = wid; L.p = 0; }
  _w1.copy(t.group.position).sub(s.group.position);
  const d = _w1.length();
  _w2.set(0, 0, -1).applyQuaternion(s.group.quaternion);
  const ang = _w2.angleTo(_w1.normalize());
  const sizeAdj = t.def.cls === 'fighter' ? 1 : 1.9;
  const radarOk = w.seeker !== 'rf' || compFactor(s, 'radar') > 0.01;
  const ok = d < w.range && ang < w.lockCone * sizeAdj && radarOk;
  L.d = d; L.ang = ang;
  if (ok) L.p = Math.min(1, L.p + dt * (s.mod?.lock ?? 1) / (w.lockTime / Math.max(1, t.def.sig * 0.7)));
  else L.p = Math.max(0, L.p - dt * 1.5);
  L.state = L.p >= 1 ? 'locked' : (ok ? 'locking' : (d < w.range ? 'seek' : 'range'));
}

// ---- missiles -----------------------------------------------------------------------------------------
const missileGeos = {};
function missileMesh(w) {
  const g = new THREE.Group();
  const s = w.size;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.26 * s, 2.6 * s), new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color).multiplyScalar(0.9) }));
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 0.5 * s), new THREE.MeshBasicMaterial({ color: w.frogg ? 0xb4ff40 : 0xd04a3a }));
  tip.position.z = -1.5 * s;
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 2.2 * s, 6).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(w.flame).multiplyScalar(2.2) }));
  fl.position.z = 2.0 * s;
  g.add(body, tip, fl); g.userData.fl = fl;
  return g;
}
function launchMissile(s, wid) {
  const w = WEAPONS[wid];
  if (s !== player && s.ai && s.ai.hold) return false;
  if (!(s.stores[wid] > 0)) return false;
  const L = s.lock;
  const guided = L.p >= 1 && L.wid === wid && L.tgt && L.tgt.alive;
  s.stores[wid]--;
  s.group.updateMatrixWorld(true);
  const side = (s.launchAlt = -(s.launchAlt || 1));
  const half = s.def.half;
  const lp = s.def.launch ? [side * Math.abs(s.def.launch[0]), s.def.launch[1], s.def.launch[2]] : [side * Math.min(half[0] * 0.3, 2.5), -0.4, w.torp ? -half[2] * 0.2 : 0.5];
  const pos = s.group.localToWorld(new THREE.Vector3(lp[0], lp[1], lp[2]));
  const q = s.group.quaternion.clone();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  const mesh = missileMesh(w); mesh.position.copy(pos); mesh.quaternion.copy(q); scene.add(mesh);
  missiles.push({
    wid, w, team: s.team, owner: s, pos, vel: dir.clone().multiplyScalar(w.v0).add(s.vel), dir, mesh, age: 0,
    target: guided ? L.tgt : null, hp: w.hp, dead: false, lostT: 0,
  });
  if (guided) L.p = 0;
  sfx('msl', s === player ? 0 : pos.distanceTo(camera.position), 0.9);
  if (s.team !== player?.team && guided && L.tgt === player) { warnState.launchT = time; sfx('launchwarn'); log('MISSILE LAUNCH', '#ff5a4a'); }
  return true;
}
function steerMissile(m, dt) {
  const w = m.w, t = m.target;
  const sp = m.vel.length();
  if (t && !(t.alive !== false)) m.target = null;
  if (m.target) {
    const tp = m.target.group ? m.target.group.position : m.target.pos;
    const tv = m.target.vel;
    _w1.copy(tp).sub(m.pos);
    const d = _w1.length();
    const tgo = d / Math.max(80, sp);
    _w2.copy(tp).addScaledVector(tv, Math.min(tgo, 3)).sub(m.pos).normalize();
    const ang = m.dir.angleTo(_w2);
    if (ang > w.seekCone) { m.lostT += dt; if (m.lostT > 0.25) m.target = null; }      // seeker gimbal limit
    else {
      m.lostT = 0;
      const maxTurn = w.turn * dt * (0.4 + 0.6 * Math.min(1, sp / w.vmax));
      if (ang <= maxTurn) m.dir.copy(_w2); else m.dir.lerp(_w2, maxTurn / ang).normalize();
    }
  }
  const burning = m.age < w.burn;
  const v = burning ? Math.min(w.vmax, sp + w.acc * dt) : sp;      // vacuum: no drag after burnout
  m.vel.copy(m.dir).multiplyScalar(v);
}
let _ffLog = -99;
function friendlyNote(by, victim) {
  if (by) by.ffHits = (by.ffHits || 0) + 1;
  if (time - _ffLog > 1.5) { _ffLog = time; log(by === player ? `FRIENDLY FIRE: ${victim.callsign || victim.def.name}` : `HIT BY FRIENDLY FIRE (${by?.callsign || by?.def.name || '?'})`, '#ffb040'); }
}
const _hg = new THREE.Vector3(), _hd = new THREE.Vector3();
// distance from a world point to the nearest hull voxel (probes toward the centre and along the 6 axes, up to maxD); Infinity if none
function hullGap(s, pos, maxD) {
  s.group.worldToLocal(_hg.copy(pos));
  const lp = _hg.clone();
  let best = Infinity;
  for (const d of [_hd.copy(lp).negate().normalize().clone(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)]) {
    const h = traceShipLocal(s, lp, d, maxD + 1);
    if (h) best = Math.min(best, h.distanceTo(lp));
  }
  return best;
}
function blastAt(pos, w, team, owner, direct, skip) {
  flashAt(pos, w.blast * 0.55, 0.45);
  sparksAt(pos, 40, 30); fireAt(pos, 14, 14); smokeAt(pos, 8, 6);
  sfx('boom', pos.distanceTo(camera.position), w.torp ? 1.6 : 1);
  for (const s of ships) {
    if (!s.alive || s.dying || s === skip) continue;      // skip: HE bolts already dealt their direct hit to that ship
    const fr = s.team === team;
    s.group.updateMatrixWorld(true);
    const dc = s.group.position.distanceTo(pos);
    let surf = Math.max(0, dc - s.def.radius * 0.62);
    if (surf > w.blast && s.def.radius > 150 && dc < s.def.radius + w.blast) surf = hullGap(s, pos, w.blast);      // long hulls (Exeter, Bullfrog, Hive Carrier): measure from the hull, not a 0.62 R sphere around the centre
    if (surf > w.blast) continue;
    const f = (direct === s ? 1 : Math.max(0.2, 1 - surf / w.blast)) * (fr ? FF.blast : 1);
    const lp = s.group.worldToLocal(pos.clone());
    // pull the contact point onto the hull
    const dir = lp.clone().negate().normalize();
    const hit = traceShipLocal(s, lp, dir, Math.min(dc, 60));
    if (hit) lp.copy(hit);
    else {
      lp.x = clamp(lp.x, -s.def.half[0] * 0.8, s.def.half[0] * 0.8); lp.y = clamp(lp.y, -s.def.half[1] * 0.8, s.def.half[1] * 0.8); lp.z = clamp(lp.z, -s.def.half[2] * 0.8, s.def.half[2] * 0.8);
    }
    if (!fr) s.lastAttacker = owner;
    else if (s === player || owner === player) friendlyNote(owner, s);
    hitSrc = owner; hitKind = w.nuclear ? 'nuke' : 'missile';
    applyHit(s, lp, w.dmg * f * (owner?.mod?.dmg ?? 1), s.group.localToWorld(lp.clone()), 'exp');
    if (s.alive && !s.dying) {      // blast also chips hull around the contact
      chip(s, lp, 0.6 + w.blast * 0.12 * f, 1.8 + w.blast * 0.2 * f, false);
    }
  }
}
// ---- nuclear burst (first cut, placeholder numbers; docs/CAPITAL_COMBAT.md) ------------------------------------
// X-ray fluence F = 0.8 * yield / (4 pi r^2) in J/cm2 (1 kT = 4.18e12 J): hull damage as a fraction of the class kill fluence (hardening is a guess);
// crew dose from neutrons/gamma (80 Gy at 900 m for 1 kT, 1/r^2), reduced by shields up to NUKE.shieldCut; flash blinds radar and PD optics for a while.
const NUKE = { kill: { fighter: 1500, corvette: 2500, frigate: 4000, capital: 8000 }, crewDead: 30, shieldCut: 0.5, blindF: 0.04 };
function nukeAt(pos, kt, owner) {
  flashAt(pos, 90, 1.6); sparksAt(pos, 120, 80); fireAt(pos, 30, 30); sfx('boom', pos.distanceTo(camera.position), 3);
  const rep = [];
  for (const s of ships) {
    if (!s.alive || s.dying) continue;
    s.group.updateMatrixWorld(true);
    const dc = s.group.position.distanceTo(pos);
    const r = Math.max(3, dc - s.def.radius * 0.62);
    const F = 0.8 * kt * 4.18e12 / (4 * Math.PI * r * r * 1e4);                  // J/cm2
    const lp = s.group.worldToLocal(pos.clone());
    const hit = traceShipLocal(s, lp, lp.clone().negate().normalize(), Math.min(dc, 400));
    if (hit) lp.copy(hit); else lp.multiplyScalar(Math.min(1, s.def.radius * 0.6 / Math.max(1, lp.length())));
    const Fk = NUKE.kill[s.def.cls] || 1500;
    const hp = s.def.structure + (s.def.shield.fore + s.def.shield.aft) / 2;
    s.lastAttacker = owner;
    const before = s.structure;
    applyHit(s, lp, hp * F / Fk, s.group.localToWorld(lp.clone()), 'nuke');
    // flash blind
    if (F > NUKE.blindF) s.blindUntil = Math.max(s.blindUntil || 0, time + Math.min(12, 2 + 3 * Math.log10(F / NUKE.blindF)));
    // crew dose
    let dose = 80 * kt * (900 / r) * (900 / r);
    const sh = (s.def.shield.fore + s.def.shield.aft) ? (s.shield.fore + s.shield.aft) / (s.def.shield.fore + s.def.shield.aft) : 0;
    dose *= 1 - NUKE.shieldCut * sh;
    if (s.alive && !s.dying && !s.def.drone && dose >= NUKE.crewDead) { s.crewLost = true; log(`${s.callsign || s.def.name}: CREW INCAPACITATED (${Math.round(dose)} Gy)`, s === player ? '#ff5a4a' : '#ffb080'); killShip(s); }
    rep.push({ id: s.def.id, team: s.team, r: Math.round(r), F: +F.toFixed(1), dose: Math.round(dose), dead: !s.alive || !!s.dying, str: Math.round(100 * Math.max(0, s.structure) / s.def.structure) });
  }
  nukeLog.push({ t: time, kt, rep });
}
const nukeLog = [];
function killMissile(m, blast) {
  if (m.dead) return;
  m.dead = true;
  if (blast && m.w.nuclear) nukeAt(m.pos, (m.owner && m.owner.nukeKt) || m.w.yield, m.owner);   // per-ship yield dial (owner 2026-10-22)
  else if (blast) blastAt(m.pos, m.w, m.team, m.owner, null);
  else { flashAt(m.pos, 2.5, 0.25); sparksAt(m.pos, 14, 18); }
}
function updateMissiles(dt) {
  for (const m of missiles) {
    if (m.dead) continue;
    m.age += dt;
    steerMissile(m, dt);
    m.prev = m.prev || m.pos.clone(); m.prev.copy(m.pos);
    m.pos.addScaledVector(m.vel, dt);
    m.mesh.position.copy(m.pos);
    _wq.setFromUnitVectors(NEGZ, m.dir); m.mesh.quaternion.copy(_wq);
    const burning = m.age < m.w.burn;
    m.mesh.userData.fl.visible = burning;
    if (burning) { m.mesh.userData.fl.scale.z = 0.8 + Math.random() * 0.5; fire.emit(m.pos, rv(1), 0.3, [2, 1.2, 0.4, 0.8], [0.4, 0.1, 0, 0]); }
    if (Math.random() < dt * 40) smoke.emit(m.pos, rv(1.5), 1.1, [0.5, 0.5, 0.5, 0.35], [0.1, 0.1, 0.1, 0]);
    if (m.age > m.w.life) { killMissile(m, false); continue; }
    if (m.age < 0.35) continue;                     // arming delay
    for (const s of ships) {
      if (!s.alive || s.dying) continue;
      const fr = s.team === m.team;
      if (fr && s === m.owner && m.age < 3) continue;                 // clear the launcher; friendly hulls are otherwise solid (blast and hit damage scaled by FF)
      const dc = s.group.position.distanceTo(m.pos);
      if (dc > s.def.radius + m.w.fuze + 12) continue;
      const hit = segSphere(m.prev, m.pos, s.group.position, s.def.radius) ? traceShip(s, m.prev, m.pos) : null;
      if (hit) { m.pos.copy(s.group.localToWorld(hit.clone())); killMissile(m, true); blastDirect(m, s); break; }
      if (!fr && dc < s.def.radius * 0.55 + (m.fuze ?? m.w.fuze)) { killMissile(m, true); break; }       // proximity fuze (hostile ships only)
    }
  }
  for (const m of missiles) if (m.dead) { scene.remove(m.mesh); m.mesh.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
  missiles = missiles.filter(m => !m.dead);
}
function blastDirect() { /* direct hits are handled by blastAt's distance falloff (full damage at the hull) */ }

// ---- countermeasures ----------------------------------------------------------------------------------
function deployCM(s) {
  if (!(s.stores.flare > 0) || s.cmCool > 0) return false;
  s.stores.flare--; s.cmCool = 0.8;
  s.group.updateMatrixWorld(true);
  for (let i = 0; i < 3; i++) {
    const p = s.group.localToWorld(new THREE.Vector3((i - 1) * 0.6, -0.5, s.def.half[2] * 0.6));
    const v = s.vel.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(12 + Math.random() * 10));      // co-moving, drifts off slowly
    decoys.push({ pos: p, vel: v, life: 4.5, kind: i === 1 ? 'chaff' : 'flare', team: s.team, alive: true, owner: s });
  }
  sfx('flare', s === player ? 0 : s.group.position.distanceTo(camera.position), 0.8);
  // missiles tracking this ship may be seduced; closer missiles are harder to fool
  for (const m of missiles) {
    if (m.dead || m.target !== s) continue;
    const d = m.pos.distanceTo(s.group.position);
    const base = Math.max(m.w.flareS, 0) * 1 + 0;      // flares
    const chaff = m.w.chaffS;
    const plume = s.ab ? 0.4 : 1.15 - 0.4 * (s.throttle ?? 0.5);      // a burning drive outshines the flare
    const p = (1 - Math.min(0.6, 60 / (d + 60))) * (m.w.seeker === 'ir' ? base * plume : chaff) * (0.55 + 0.45 * compFactor(s, 'engine'));
    if (Math.random() < p) { m.target = decoys[decoys.length - (m.w.seeker === 'ir' ? 3 : 2)]; m.lostT = 0; }
  }
  return true;
}
function updateDecoys(dt) {
  for (const d of decoys) {
    d.life -= dt;      // vacuum: decoys keep their ejection velocity, no drag
    d.pos.addScaledVector(d.vel, dt);
    if (d.kind === 'flare') { sparks.emit(d.pos, rv(2), 0.18, [3.5, 2.4, 1.0, 1], [1, 0.3, 0, 0]); if (Math.random() < 0.6) fire.emit(d.pos, rv(1), 0.4, [2.4, 1.4, 0.6, 0.8], [0.4, 0.1, 0, 0]); }
    else if (Math.random() < 0.5) smoke.emit(d.pos, rv(5), 1.2, [0.7, 0.7, 0.8, 0.25], [0.5, 0.5, 0.6, 0]);
    if (d.life <= 0) d.alive = false;
  }
  decoys = decoys.filter(d => d.alive);
}

// ---- flashes (missile blasts etc.) ---------------------------------------------------------------------
const flashGeo = new THREE.SphereGeometry(1, 12, 9);
function flashAt(pos, size, dur) {
  const m = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb050).multiplyScalar(3), transparent: true, depthWrite: false }));
  m.position.copy(pos); m.scale.setScalar(size * 0.3); scene.add(m);
  flashes.push({ m, t: 0, dur, size });
}
function updateFlashes(dt) {
  for (const f of flashes) {
    f.t += dt; const k = f.t / f.dur;
    f.m.scale.setScalar(f.size * (0.3 + k)); f.m.material.opacity = Math.max(0, 1 - k);
  }
  flashes = flashes.filter(f => f.t < f.dur || (scene.remove(f.m), f.m.material.dispose(), false));
}

// ---- turrets (point defence / anti-fighter) -------------------------------------------------------------
// Turret classes by absolute diameter of the visible assembly (owner spec 2026-10-22): S about 5 m, M 10-15 m, L 20-40 m; barrels 1.2x (S) to 1.7-1.8x (M, L) the diameter.
// `cls` on the turret data entry; default by weapon: pd/sting = S, everything else = M. Clamp: never more than 12% of the hull length (small hulls).
const TUR_DIA = { S: 5, M: 11, L: 30 }, TUR_BARREL = { S: 1.2, M: 1.7, L: 1.8 };
function turretCls(t) { return t.cls || ((t.w === 'pd' || t.w === 'sting') ? 'S' : 'M'); }
function turretDia(s, t) { return Math.min(TUR_DIA[turretCls(t)] || 5, 0.12 * s.def.length); }
function makeTurret(s, t) {
  const w = WEAPONS[t.w], cls = turretCls(t), D = turretDia(s, t), bl = (TUR_BARREL[cls] || 1.5) * D;
  const g = new THREE.Group();
  const fr = s.def.fac === 'frogg';
  const mat = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const mBase = mat(fr ? 0x4a3a24 : 0x8b949f, 0.6, 0.25), mHead = mat(fr ? 0x5a4630 : 0xa4acb6, 0.5, 0.3), mBar = mat(fr ? 0x24190f : 0x2c3138, 0.5, 0.4);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * D, 0.56 * D, 0.3 * D, 14), mBase);
  base.position.y = 0.08 * D; g.add(base);                                  // pos = hull surface: the ring sits mostly proud of it
  const head = new THREE.Group(); head.position.y = 0.3 * D * t.side; g.add(head);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.72 * D, 0.38 * D, 0.82 * D), mHead); head.add(hb);
  const beam = w.kind === 'beam', xs = beam ? [0] : [-0.17, 0.17];
  const muzzles = [];
  for (const x of xs) {
    const th = (beam ? 0.2 : cls === 'S' ? 0.1 : 0.14) * D;
    const b = new THREE.Mesh(new THREE.BoxGeometry(th, th, bl), mBar);
    b.position.set(x * D, 0, -(0.3 * D + bl / 2)); head.add(b);
    const brake = new THREE.Mesh(new THREE.BoxGeometry(th * 1.5, th * 1.5, 0.1 * D), mBar);
    brake.position.set(x * D, 0, -(0.3 * D + bl)); head.add(brake);
    muzzles.push(new THREE.Vector3(x * D, 0, -(0.3 * D + bl + 0.05 * D)));
  }
  if (beam) { const lens = new THREE.Mesh(new THREE.BoxGeometry(0.1 * D, 0.1 * D, 0.1 * D), new THREE.MeshBasicMaterial({ color: new THREE.Color(w.color).multiplyScalar(1.6) })); lens.position.copy(muzzles[0]).z += 0.02 * D; head.add(lens); }
  g.position.set(t.pos[0], t.pos[1], t.pos[2]);
  if (t.side < 0) g.rotation.z = Math.PI;
  s.group.add(g);
  return { def: t, w, wid: t.w, comp: t.comp, cls, dia: D, group: g, head, mats: [mBase, mHead, mBar], ammo: w.ammo || Infinity, cool: Math.random() * 0.3, tgt: null, thinkT: Math.random() * 0.3, muzzles, mi: 0, muzzle: bl / 1.4 + 0.3 * D / 1.4, q: new THREE.Quaternion(), fired: 0, lastErr: 0, dead: false, dry: false };
}
function turretMuzzle(T, out) {                 // world position of the next barrel tip (alternates between twin barrels)
  const m = T.muzzles[T.mi++ % T.muzzles.length];
  T.head.updateWorldMatrix(true, false);
  return T.head.localToWorld(out.copy(m));
}
function updateTurrets(s, dt) {
  if (!s.turrets.length) return;
  const sg = s.group;
  const hostileMissiles = missiles.filter(m => !m.dead && m.team !== s.team);
  for (const T of s.turrets) {
    const comp = compOf(s, T.comp);
    const dead = comp && comp.hp <= 0;
    T.group.visible = true;
    if (dead) {                                                                 // dead turret: barrel droops onto the hull, assembly goes dark, no fire
      if (!T.dead) { T.dead = true; for (const m of T.mats) m.color.multiplyScalar(0.3); }
      T.head.quaternion.slerp(_wq.setFromAxisAngle(_w1.set(1, 0, 0), -0.7), Math.min(1, dt * 1.5));
      continue;
    }
    T.cool -= dt; T.thinkT -= dt;
    const tp = T.head.getWorldPosition(_w1.clone());
    if (T.thinkT <= 0) {
      T.thinkT = 0.2 + Math.random() * 0.1;
      let best = null, bs = 1e9;
      const beamT = T.w.kind === 'beam';
      if (beamT && T.tgt && T.tgt.alive && !T.tgt.dying && T.tgt.group && T.tgt.group.position.distanceTo(tp) < T.w.range) best = T.tgt;   // a laser turret holds its target: focus is lost on every switch
      else if (!beamT && !T.w.noPD) for (const m of hostileMissiles) {   // noPD (acid cannon) never shoots missiles                 // missiles first
        const d = m.pos.distanceTo(tp);
        if (d < T.w.range * 0.75 && (m.target === s || d < 500) && d < bs) { bs = d; best = m; }
      }
      if (!best) {
        bs = 1e9;
        for (const e of ships) {
          if (!e.alive || e.team === s.team || e.dying) continue;
          const d = e.group.position.distanceTo(tp);
          if ((T.w.pdOnly && d > 300) || (T.w.bigOnly && e.def.cls === 'fighter' && d > 900)) continue;      // Bullfrog roles: thorn = missiles (ships only inside 300 m), heavy lance = big targets
          const pr = T.w.noPD ? (e.def.cls === 'fighter' && e.def.ai?.role !== 'bomber' ? d * 3 : d) : beamT ? (e.def.cls === 'fighter' ? d * 1.6 : d) : (e.def.cls === 'fighter' ? d : d * 2.2);   // lasers favour big, steady targets; PD handles fighters
          if (d < T.w.range && pr < bs) { bs = pr; best = e; }
        }
      }
      T.tgt = best;
    }
    const tg = T.tgt;
    if (!tg || tg.dead || tg.alive === false) { T.tgt = null; continue; }
    const tpos = tg.group ? tg.group.position : tg.pos, tvel = tg.vel;
    const dist = tpos.distanceTo(tp);
    const tt = T.w.kind === 'beam' ? 0 : dist / T.w.v;
    _w2.copy(tpos).addScaledVector(tvel, tt).addScaledVector(s.vel, -tt);        // lead in ship-relative terms
    _w3.copy(_w2).sub(tp).normalize();
    // desired orientation in the ship's local space
    const ld = _w3.clone().applyQuaternion(_wq.copy(sg.quaternion).invert());
    const sideOk = ld.y * T.def.side > -0.05;
    if (!sideOk) continue;
    const up = new THREE.Vector3(0, T.def.side, 0);
    const mat = new THREE.Matrix4().lookAt(new THREE.Vector3(), ld, up);   // Matrix4.lookAt(eye,target): the mesh -Z axis points at target = along ld
    const want = new THREE.Quaternion().setFromRotationMatrix(mat);
    // base is fixed; the head tracks (convert to head-local: parent group may be flipped for ventral mounts)
    const parentInv = T.group.quaternion.clone().invert();
    want.premultiply(parentInv);
    T.head.quaternion.rotateTowards(want, T.w.track * dt);
    // aim error
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(T.head.quaternion).applyQuaternion(T.group.quaternion).applyQuaternion(sg.quaternion);
    const err = fwd.angleTo(_w3);
    if (T.w.kind === 'beam') {
      const tol = clamp(0.8 * (tg.def ? tg.def.radius : 5) / Math.max(dist, 1), 0.004, 0.05);
      if (err < tol && T.cool <= 0 && dist < T.w.range && s.energy >= T.w.energy) {
        const mp = turretMuzzle(T, new THREE.Vector3()), mLocal = T.muzzles[(T.mi - 1) % T.muzzles.length];
        let blocked = false;
        for (const f of ships) { if (f === s || !f.alive || f.dying || f.team !== s.team) continue; if (segSphere(mp, _w4.copy(mp).addScaledVector(fwd, T.w.range), f.group.position, f.def.radius * 0.9)) { blocked = true; break; } }
        if (!blocked) {
          T.cool = T.w.cd / (0.6 + 0.4 * powerMul(s)); s.energy -= T.w.energy;
          fireBeam(s, T.w, mp, fwd, T.focus ||= { tgt: null, t: 0, last: -9 }, T, T.head, mLocal);
          T.fired++; T.lastErr = err;
          plogN('shots.turretbeam');
          if (Math.random() < 0.3) sfx(T.w.sfx, mp.distanceTo(camera.position), 0.5);
        }
      }
    } else if (err < 0.07 && T.cool <= 0 && dist < T.w.range && T.ammo > 0) {
      T.cool = T.w.cd;
      T.ammo--;
      if (T.ammo <= 0 && !T.dry) { T.dry = true; for (const m of T.mats) m.color.multiplyScalar(0.55); }      // drum empty: the assembly goes dark like a dead turret, but it still tracks
      const mp = turretMuzzle(T, new THREE.Vector3());
      T.fired++; T.lastErr = err;
      spawnBolt(s, T.wid, mp, fwd, 1);
      if (Math.random() < 0.35) sparksAt(mp, 1, 5, [2.4, 2.0, 1.0, 1]);
      if (Math.random() < 0.25) sfx(T.w.sfx, mp.distanceTo(camera.position), 0.5);
    }
  }
}

// ---- projectiles: flight + hits -----------------------------------------------------------------------
function updateBolts(dt) {
  for (const b of bolts) {
    b.prev.copy(b.pos);
    b.pos.addScaledVector(b.vel, dt);
    b.life -= dt;
    // missiles can be shot down - swept in the missile's frame (owner P0 2026-10-22: the old test used
    // the end-of-step position against a 1.6 m box and intercepted 0 of 7 torpedoes), and PD guns are
    // proximity-burst flak: anything inside `w.flak` of the shell's path detonates it
    for (const m of missiles) {
      if (m.dead || m.team === b.team) continue;
      const R = b.w.flak || 1.6;
      _w4.copy(m.pos).addScaledVector(m.vel, dt);   // where the missile will be by the end of this step
      if (segSeg(b.prev, b.pos, m.pos, _w4) > R) continue;
      m.hp -= b.dmg * (b.w.big ? 10 : 1);
      b.life = 0;
      if (b.w.flak) {   // proximity burst: every missile inside the flak radius takes the hit
        flashAt(b.pos, 5, 0.2); sparksAt(b.pos, 8, 6);
        for (const o of missiles) {
          if (o.dead || o === m || o.team === b.team) continue;
          if (o.pos.distanceTo(b.pos) <= b.w.flak) { o.hp -= b.dmg; if (o.hp <= 0) killMissile(o, o.w.torp ? true : false); }
        }
      }
      if (m.hp <= 0) killMissile(m, m.w.torp ? true : false);
      break;
    }
    if (b.life <= 0) continue;
    for (const s of ships) {
      if (!s.alive || s === b.owner || s.dying) continue;
      const fr = s.team === b.team;
      if (!segSphere(b.prev, b.pos, s.group.position, s.def.radius)) continue;
      const hit = traceShip(s, b.prev, b.pos);
      if (!hit) continue;
      const wp = s.group.localToWorld(hit.clone());
      if (!fr) { s.lastAttacker = b.owner; if (b.owner === player) player.hitsLanded = (player.hitsLanded || 0) + 1; }
      else if (s === player || b.owner === player) friendlyNote(b.owner, s);
      plogBoltHit(b, s, b.dmg * (fr ? FF.bolt : 1), fr);
      hitSrc = b.owner; hitKind = 'gun';
      applyHit(s, hit, b.dmg * (fr ? FF.bolt : 1), wp, b.dt, b.w.pierce || 0);
      if (b.w.blast) blastAt(wp, b.w, b.team, b.owner, null, s);      // HE shells: splash to everything else within `blast`; the direct target already took the full hit
      if (b.w.big) { chip(s, hit, 1.2, 3, false); fireAt(wp, 6, 10); }
      sfx(s.shield[hit.z < 0 ? 'fore' : 'aft'] > 0 ? 'shield' : 'hit', s === player ? 0 : wp.distanceTo(camera.position), 0.5);
      b.life = 0; break;
    }
  }
  bolts = bolts.filter(b => b.life > 0);
}

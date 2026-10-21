// ======================================================================
//  WEAPONS — ballistic + energy guns, guided missiles, torpedoes, countermeasures, turrets
//  Damage types: kin (kinetic) / en (energy, plasma, acid) / exp (blast). Each hits shield / armour / structure differently.
// ======================================================================
const DMGX = { kin: [0.7, 1.15, 1.0], en: [1.25, 0.8, 1.0], exp: [1.0, 1.0, 1.1] };   // [shield, armour, structure]

const WEAPONS = {
  // ---- human ----
  cannon: { kind: 'proj', name: 'MK-20 CANNON', cd: 0.085, v: 900, dmg: 3.0, dt: 'kin', life: 1.8, spread: 0.004, ammo: 600, color: 0xffd9a0, len: 3.4, sz: 0.14, sfx: 'cannon' },
  pulse: { kind: 'proj', name: 'PL-4 PLASMA BOLTER', cd: 0.22, v: 650, dmg: 7, dt: 'en', life: 2.0, spread: 0.0015, energy: 9, color: 0x66ffcc, len: 7, sz: 0.22, sfx: 'pulse' },
  rail: { kind: 'proj', name: 'RG-90 RAILGUN', cd: 2.4, v: 2000, dmg: 70, dt: 'kin', life: 2.2, spread: 0.0003, color: 0xcfe8ff, len: 22, sz: 0.55, sfx: 'rail', big: true, pierce: 0.6 },
  pd: { kind: 'proj', name: 'PD-30 POINT DEFENCE', cd: 0.075, v: 1100, dmg: 1.3, dt: 'kin', life: 0.85, spread: 0.012, color: 0xffe0b0, len: 3.2, sz: 0.13, sfx: 'pd', range: 900, track: 4.5, turret: true },
  // ---- FROGG ----
  fang: { kind: 'proj', name: 'FANG SPITTER', cd: 0.16, v: 560, dmg: 3.6, dt: 'kin', life: 2.0, spread: 0.01, color: 0xc8ff40, len: 2.4, sz: 0.14, sfx: 'fang' },
  spit: { kind: 'proj', name: 'ACID SPITTER', cd: 0.5, v: 330, dmg: 7, dt: 'en', life: 2.6, spread: 0.006, color: 0x9dff3a, len: 1.7, sz: 0.42, sfx: 'spit', glob: true },
  spitcannon: { kind: 'proj', name: 'ACID CANNON', cd: 1.3, v: 430, dmg: 24, dt: 'en', life: 3.0, spread: 0.002, color: 0xb6ff20, len: 2.6, sz: 0.75, sfx: 'spitbig', glob: true },
  lash: { kind: 'proj', name: 'LASH CANNON', cd: 2.0, v: 540, dmg: 34, dt: 'en', life: 3.2, spread: 0.002, color: 0xaaff40, len: 7, sz: 0.9, sfx: 'lash', glob: true, big: true },
  sting: { kind: 'proj', name: 'STING', cd: 0.09, v: 900, dmg: 1.5, dt: 'en', life: 0.9, spread: 0.012, color: 0xb0ff50, len: 2.4, sz: 0.16, sfx: 'pd', range: 800, track: 3.6, turret: true },
  // ---- missiles ----  seeker: ir (flares fool it) / rf (chaff fools it)
  ir: { kind: 'msl', name: 'SW-9 SWIFT (IR)', seeker: 'ir', v0: 70, vmax: 420, acc: 300, turn: 3.4, burn: 6.5, life: 9, dmg: 26, blast: 10, fuze: 6, lockCone: 0.22, seekCone: 0.75, lockTime: 1.2, range: 1700, hp: 1, flareS: 0.7, chaffS: 0, color: 0xeeeeee, flame: 0xffe0a0, size: 1 },
  rf: { kind: 'msl', name: 'LN-3 LANCE (RADAR)', seeker: 'rf', v0: 70, vmax: 380, acc: 240, turn: 2.7, burn: 9, life: 12, dmg: 34, blast: 11, fuze: 7, lockCone: 0.55, seekCone: 0.95, lockTime: 2.4, range: 3400, hp: 1, flareS: 0.05, chaffS: 0.65, color: 0xe8e8d8, flame: 0xffd090, size: 1.15 },
  torp: { kind: 'msl', name: 'HM-1 HAMMER TORPEDO', seeker: 'ir', v0: 40, vmax: 260, acc: 80, turn: 0.9, burn: 16, life: 22, dmg: 170, blast: 30, fuze: 12, lockCone: 0.45, seekCone: 0.8, lockTime: 1.8, range: 2000, hp: 7, flareS: 0.15, chaffS: 0.15, color: 0xc8c8c0, flame: 0xffc070, size: 2.2, torp: true },
  tick: { kind: 'msl', name: 'TICK (IR)', seeker: 'ir', v0: 60, vmax: 380, acc: 260, turn: 3.0, burn: 6, life: 8, dmg: 22, blast: 9, fuze: 6, lockCone: 0.24, seekCone: 0.7, lockTime: 1.5, range: 1500, hp: 1, flareS: 0.6, chaffS: 0, color: 0x7a6a3a, flame: 0xb4ff40, size: 1, frogg: true },
  tad: { kind: 'msl', name: 'TADPOLE TORPEDO', seeker: 'ir', v0: 35, vmax: 240, acc: 75, turn: 0.8, burn: 16, life: 22, dmg: 140, blast: 28, fuze: 12, lockCone: 0.45, seekCone: 0.8, lockTime: 2.0, range: 1800, hp: 7, flareS: 0.1, chaffS: 0.1, color: 0x9a4a22, flame: 0xb4ff40, size: 2.0, torp: true, frogg: true },
  flare: { kind: 'cm', name: 'FLARES / CHAFF' },
};
const MSL_ORDER = ['ir', 'rf', 'torp', 'tick', 'tad'];

// ---- shared scratch + rendering of projectiles (one InstancedMesh per weapon type) -----------------
const _w1 = new THREE.Vector3(), _w2 = new THREE.Vector3(), _w3 = new THREE.Vector3(), _wq = new THREE.Quaternion();
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
  for (const m of s.mounts) { const w = WEAPONS[m.w]; if (w.ammo) s.ammo[m.w] = (s.ammo[m.w] || 0) + w.ammo; }
  s.energy = 100; s.fireMask = 3; s.sel = 0;
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
    wid, w, team: s.team, owner, pos, prev: pos.clone(), life: w.life, dmg: w.dmg, dt: w.dt,
    vel: _w2.clone().multiplyScalar(w.v).addScaledVector(s.vel, 0.9),
  });
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
  spawnBolt(s, m.w, wp, dirW, s.def.cls === 'fighter' ? 1 : 0.6);
  if (w.ammo) s.ammo[m.w]--;
  if (s === player) s.shots = (s.shots || 0) + 1;
  if (w.energy) s.energy -= w.energy;
  m.cool = w.cd / (0.6 + 0.4 * powerMul(s));
  sparksAt(wp, 1, 6, [2.4, 2.0, 1.0, 1]);
  const dist = s === player ? 0 : wp.distanceTo(camera.position);
  sfx(w.sfx, dist, s === player ? 0.9 : 0.7);
  return true;
}
// fire every ready mount in the groups of mask (bit1 = group 1, bit2 = group 2, bit4 = group 3)
function fireGuns(s, mask) {
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
  if (ok) L.p = Math.min(1, L.p + dt / (w.lockTime / Math.max(1, t.def.sig * 0.7)));
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
  if (!(s.stores[wid] > 0)) return false;
  const L = s.lock;
  const guided = L.p >= 1 && L.wid === wid && L.tgt && L.tgt.alive;
  s.stores[wid]--;
  s.group.updateMatrixWorld(true);
  const side = (s.launchAlt = -(s.launchAlt || 1));
  const half = s.def.half;
  const lp = s.def.launch ? s.def.launch : [side * Math.min(half[0] * 0.3, 2.5), -0.4, w.torp ? -half[2] * 0.2 : 0.5];
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
function blastAt(pos, w, team, owner, direct) {
  flashAt(pos, w.blast * 0.55, 0.45);
  sparksAt(pos, 40, 30); fireAt(pos, 14, 14); smokeAt(pos, 8, 6);
  sfx('boom', pos.distanceTo(camera.position), w.torp ? 1.6 : 1);
  for (const s of ships) {
    if (!s.alive || s.team === team || s.dying) continue;
    s.group.updateMatrixWorld(true);
    const dc = s.group.position.distanceTo(pos);
    const surf = Math.max(0, dc - s.def.radius * 0.62);
    if (surf > w.blast) continue;
    const f = direct === s ? 1 : Math.max(0.2, 1 - surf / w.blast);
    const lp = s.group.worldToLocal(pos.clone());
    // pull the contact point onto the hull
    const dir = lp.clone().negate().normalize();
    const hit = traceShipLocal(s, lp, dir, Math.min(dc, 60));
    if (hit) lp.copy(hit);
    else {
      lp.x = clamp(lp.x, -s.def.half[0] * 0.8, s.def.half[0] * 0.8); lp.y = clamp(lp.y, -s.def.half[1] * 0.8, s.def.half[1] * 0.8); lp.z = clamp(lp.z, -s.def.half[2] * 0.8, s.def.half[2] * 0.8);
    }
    s.lastAttacker = owner;
    applyHit(s, lp, w.dmg * f, s.group.localToWorld(lp.clone()), 'exp');
    if (s.alive && !s.dying) {      // blast also chips hull around the contact
      chip(s, lp, 0.6 + w.blast * 0.12 * f, 1.8 + w.blast * 0.2 * f, false);
    }
  }
}
function killMissile(m, blast) {
  if (m.dead) return;
  m.dead = true;
  if (blast) blastAt(m.pos, m.w, m.team, m.owner, null);
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
      if (!s.alive || s.team === m.team || s.dying) continue;
      const dc = s.group.position.distanceTo(m.pos);
      if (dc > s.def.radius + m.w.fuze + 12) continue;
      const hit = segSphere(m.prev, m.pos, s.group.position, s.def.radius) ? traceShip(s, m.prev, m.pos) : null;
      if (hit) { m.pos.copy(s.group.localToWorld(hit.clone())); killMissile(m, true); blastDirect(m, s); break; }
      if (dc < s.def.radius * 0.55 + m.w.fuze) { killMissile(m, true); break; }       // proximity fuze
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
function makeTurret(s, t) {
  const w = WEAPONS[t.w];
  const g = new THREE.Group();
  const col = s.def.fac === 'frogg' ? 0x4a3a24 : 0x8b949f, dark = s.def.fac === 'frogg' ? 0x24190f : 0x2c3138;
  const sc = s.def.cls === 'corvette' ? 1 : 0.5;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5 * sc, 0.7 * sc, 1.5 * sc), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.25 }));
  g.add(base);
  const head = new THREE.Group(); head.position.y = 0.4 * sc * t.side; g.add(head);
  head.add(new THREE.Mesh(new THREE.BoxGeometry(1.0 * sc, 0.5 * sc, 1.1 * sc), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.3 })));
  for (const x of [-0.28, 0.28]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.16 * sc, 0.16 * sc, 1.9 * sc), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.5 }));
    b.position.set(x * sc, 0, -1.2 * sc); head.add(b);
  }
  g.position.set(t.pos[0], t.pos[1], t.pos[2]);
  if (t.side < 0) g.rotation.z = Math.PI;
  s.group.add(g);
  head.visible = true;
  return { def: t, w, wid: t.w, comp: t.comp, group: g, head, cool: Math.random() * 0.3, tgt: null, thinkT: Math.random() * 0.3, muzzle: 1.6 * sc, q: new THREE.Quaternion() };
}
function updateTurrets(s, dt) {
  if (!s.turrets.length) return;
  const sg = s.group;
  const hostileMissiles = missiles.filter(m => !m.dead && m.team !== s.team);
  for (const T of s.turrets) {
    const comp = compOf(s, T.comp);
    const dead = comp && comp.hp <= 0;
    T.group.visible = true;
    if (dead) { T.head.rotation.x = 0.5; continue; }
    T.cool -= dt; T.thinkT -= dt;
    const tp = T.group.getWorldPosition(_w1.clone());
    if (T.thinkT <= 0) {
      T.thinkT = 0.2 + Math.random() * 0.1;
      let best = null, bs = 1e9;
      for (const m of hostileMissiles) {                 // missiles first
        const d = m.pos.distanceTo(tp);
        if (d < T.w.range * 0.75 && (m.target === s || d < 500) && d < bs) { bs = d; best = m; }
      }
      if (!best) {
        bs = 1e9;
        for (const e of ships) {
          if (!e.alive || e.team === s.team || e.dying) continue;
          const d = e.group.position.distanceTo(tp);
          const pr = e.def.cls === 'fighter' ? d : d * 2.2;
          if (d < T.w.range && pr < bs) { bs = pr; best = e; }
        }
      }
      T.tgt = best;
    }
    const tg = T.tgt;
    if (!tg || tg.dead || tg.alive === false) { T.tgt = null; continue; }
    const tpos = tg.group ? tg.group.position : tg.pos, tvel = tg.vel;
    const dist = tpos.distanceTo(tp);
    const tt = dist / T.w.v;
    _w2.copy(tpos).addScaledVector(tvel, tt).addScaledVector(s.vel, -tt);        // lead in ship-relative terms
    _w3.copy(_w2).sub(tp).normalize();
    // desired orientation in the ship's local space
    const ld = _w3.clone().applyQuaternion(_wq.copy(sg.quaternion).invert());
    const sideOk = ld.y * T.def.side > -0.05;
    if (!sideOk) continue;
    const up = new THREE.Vector3(0, T.def.side, 0);
    const mat = new THREE.Matrix4().lookAt(new THREE.Vector3(), ld.clone().negate(), up);   // -Z of mesh points along ld
    const want = new THREE.Quaternion().setFromRotationMatrix(mat);
    // base is fixed; the head tracks (convert to head-local: parent group may be flipped for ventral mounts)
    const parentInv = T.group.quaternion.clone().invert();
    want.premultiply(parentInv);
    T.head.quaternion.rotateTowards(want, T.w.track * dt);
    // aim error
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(T.head.quaternion).applyQuaternion(T.group.quaternion).applyQuaternion(sg.quaternion);
    const err = fwd.angleTo(_w3);
    if (err < 0.07 && T.cool <= 0 && dist < T.w.range) {
      T.cool = T.w.cd;
      const mp = T.head.localToWorld(new THREE.Vector3(0, 0, -T.muzzle * 1.4));
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
    // missiles can be shot down
    for (const m of missiles) {
      if (m.dead || m.team === b.team) continue;
      if (segSphere(b.prev, b.pos, m.pos, 1.6)) { m.hp -= b.dmg * (b.w.big ? 10 : 1); b.life = 0; if (m.hp <= 0) killMissile(m, m.w.torp ? true : false); break; }
    }
    if (b.life <= 0) continue;
    for (const s of ships) {
      if (!s.alive || s.team === b.team || s.dying) continue;
      if (!segSphere(b.prev, b.pos, s.group.position, s.def.radius)) continue;
      const hit = traceShip(s, b.prev, b.pos);
      if (!hit) continue;
      const wp = s.group.localToWorld(hit.clone());
      s.lastAttacker = b.owner;
      if (b.owner === player) player.hitsLanded = (player.hitsLanded || 0) + 1;
      applyHit(s, hit, b.dmg, wp, b.dt, b.w.pierce || 0);
      if (b.w.big) { chip(s, hit, 1.2, 3, false); fireAt(wp, 6, 10); }
      sfx(s.shield[hit.z < 0 ? 'fore' : 'aft'] > 0 ? 'shield' : 'hit', s === player ? 0 : wp.distanceTo(camera.position), 0.5);
      b.life = 0; break;
    }
  }
  bolts = bolts.filter(b => b.life > 0);
}

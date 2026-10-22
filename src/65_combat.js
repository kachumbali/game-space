// ======================================================================
//  COMBAT & DAMAGE — shields -> armour -> structure (typed damage), components, voxel chipping, death
// ======================================================================
const _v = new THREE.Vector3();
const _cp = new THREE.Vector3();
const warnState = { launchT: -99, lockT: -99, incoming: [], lockedBy: 0 };

function shieldFlash(s, lp, facing) {
  if (!s.shieldFx) return;
  const pct = s.def.shield[facing] ? s.shield[facing] / s.def.shield[facing] : 0;
  s.shieldFx.material.color.setRGB(0.25 + 0.75 * (1 - pct), 0.6 - 0.3 * (1 - pct), 0.9 - 0.7 * (1 - pct));
  s.shieldFx.material.opacity = 0.2;
}
function compState(c) { const r = Math.max(0, c.hp) / c.max; return r <= 0 ? 2 : r <= 0.5 ? 1 : 0; }

// reach multiplier of a subsystem's radius within which a hull impact damages it directly
// parts that stick out of the hull can be hit directly through the armour (reach = radius x factor); SOFT = extra damage taken
const EXPOSED = { turret: 1.6, gun: 1.6, engine: 2.2, radar: 1.5, shield: 1.3, radiator: 1.8 };
const SOFT = { radar: 1.5, radiator: 1.3, shield: 1.2 };
function hitMark(s, c) { if (s === target) subHit = { id: c.id, t: time }; }

function applyHit(s, lp, dmg, wp, dtype = 'kin', pierce = 0) {
  if (!s.alive || s.dying) return;
  s.lastHit = time;
  s.hitsTaken = (s.hitsTaken || 0) + 1;
  const def = s.def, X = DMGX[dtype] || DMGX.kin;
  if (s === player) { shake = Math.min(1, shake + 0.16 + dmg * 0.02); hitFlash = Math.min(1, hitFlash + 0.4 + dmg * 0.03); s.dmgTaken = (s.dmgTaken || 0) + dmg; }
  const nz = lp.z / def.half[2], nx = lp.x / def.half[0];
  const facing = nz < 0 ? 'fore' : 'aft';
  const side = Math.abs(nz) >= Math.abs(nx) * 0.9 ? facing : (nx < 0 ? 'left' : 'right');
  let d = dmg;
  const pdmg = dmg * pierce; d -= pdmg;      // piercing share ignores shields and armour
  if (s.shield[facing] > 0 && compFactor(s, 'shield') > 0) {
    const raw = d * X[0], a = Math.min(s.shield[facing], raw);
    s.shield[facing] -= a; d *= 1 - a / raw;
    shieldFlash(s, lp, facing);
    sparksAt(wp, 3, 9, [0.6, 1.4, 3, 1]);
    if (d + pdmg <= 0.01) return;
  }
  // exposed subsystems (turrets, guns, engines) can be hit directly through the armour plating
  if (d > 0.01) {
    let ex = null, ed = 1e9;
    for (const c of s.comps) {
      if (c.hp <= 0 || !EXPOSED[c.role]) continue;
      const dist = _cp.set(c.pos[0], c.pos[1], c.pos[2]).distanceTo(lp);
      const reach = c.r * EXPOSED[c.role];
      if (dist < reach && dist < ed) { ed = dist; ex = c; }
    }
    if (ex) {
      const before = compState(ex), dc = d * 0.55 * X[2] * (SOFT[ex.role] || 1);
      ex.hp -= dc; d -= d * 0.55;
      s.structure -= dc * 0.1;
      sparksAt(wp, 5, 14); fireAt(wp, 1, 3);
      const after = compState(ex);
      if (after > before) compEvent(s, ex, after);
      if (s === player || s === target) hitMark(s, ex);
      if (d <= 0.01) return;
    }
  }
  // armour: type profile x ship rating, soft size threshold, ablative rate cap; spall goes to a nearby component on breach
  const AR = ARMOR[def.armor.type];
  let spall = 0;
  if (AR && d > 0.01) {
    const din = d;
    let stop = Math.min(0.92, def.armor.rating * AR.prof[dtype]);
    const th = AR.thresh * (ARMOR_THRESH_CLS[def.cls] || 1);
    if (th > 0 && din < th) stop += (1 - stop) * (1 - (din / th) * (din / th));
    let absorbed = din * stop;
    if (AR.rate) {
      const R = AR.rate * def.structure, bk = (s.abl ||= {})[side] ||= { v: 0, t: time };
      bk.v = Math.max(0, bk.v - R * (time - bk.t)); bk.t = time;
      bk.v += absorbed;
      const cap = R * 1.5;
      if (bk.v > cap) { absorbed -= bk.v - cap; bk.v = cap; }
    }
    d = din - absorbed;
    spall = absorbed * AR.spall;
    chip(s, lp, 0, 0.9 + 0.05 * Math.min(absorbed, 20), false);
    sparksAt(wp, 4, 11);
    if (d + pdmg <= 0.01) return;
  }
  d = (d + pdmg) * X[2];
  // armour breached: hull damage + internal hit
  chip(s, lp, 0.35 + 0.08 * d, 1.1 + 0.1 * d, false);
  sparksAt(wp, 8, 18); fireAt(wp, 2, 5); smokeAt(wp, 2, 3);
  let best = null, bd = 1e9;
  for (const c of s.comps) {
    if (c.hp <= 0) continue;
    const dist = _cp.set(c.pos[0], c.pos[1], c.pos[2]).distanceTo(lp);
    if (dist < c.r * 2.2 + 0.8 && dist < bd) { bd = dist; best = c; }
  }
  if (best) {
    const before = compState(best);
    best.hp -= d * 0.7 + spall; s.structure -= d * 0.3;
    const after = compState(best);
    if (after > before) compEvent(s, best, after);
  } else s.structure -= d;
  const pw = compOf(s, 'power');
  if (s.structure <= 0 || (pw && pw.hp <= 0)) {
    if (!s.deathCause) s.deathCause = { dtype, overkill: Math.max(0, -s.structure) / s.def.structure, reactor: !!(pw && pw.hp <= 0) };   // decides whether the pilot got out
    killShip(s);
  }
}

function compEvent(s, c, st) {
  const mine = s === player, tgt = s === target;
  if (mine || tgt) {
    const who = mine ? '' : 'TARGET ';
    log(`${who}${c.name} ${st === 2 ? 'DESTROYED' : 'DAMAGED'}`, mine ? (st === 2 ? '#ff5a4a' : '#ffd24a') : '#ffb080');
    if (mine && st === 2) sfx('alarm');
  }
  if (st === 2 && s.vox) {
    chip(s, _cp.set(c.pos[0], c.pos[1], c.pos[2]).clone(), c.r * 0.85, c.r * 1.7, false);
    s.group.updateMatrixWorld(true);
    const wp = s.group.localToWorld(_cp.set(c.pos[0], c.pos[1], c.pos[2]).clone());
    const k = Math.max(1, c.r / 1.2);
    sparksAt(wp, 30, 24); fireAt(wp, 8, 8); smokeAt(wp, 6, 5);
    flashAt(wp, c.r * 1.2, 0.3); sfx('boom', mine ? 0 : wp.distanceTo(camera.position), 0.5 * Math.min(2, k));
    if (c.role === 'power') killShip(s);
  }
  if (typeof onCompDestroyed === 'function' && st === 2) onCompDestroyed(s, c);
}

function killShip(s) {
  if (!s.alive || s.dying) return;
  if (s.def.cls !== 'fighter') { s.dying = 3.2 + Math.random(); s.dyT = 0; log(`${s.def.name} IS BREAKING UP`, s.team === 1 ? '#9dff7a' : '#ff5a4a'); return; }
  destroy(s);
}
function updateDying(s, dt) {
  s.dying -= dt; s.dyT -= dt;
  if (s.dyT <= 0 && s.vox) {
    s.dyT = 0.18 + Math.random() * 0.25;
    const D = s.vox.data, v = D.voxels[Math.floor(Math.random() * D.voxels.length)];
    const lp = new THREE.Vector3(v.x, v.y, v.z);
    chip(s, lp, 1.0 + Math.random() * 1.6, 3 + Math.random() * 2.5, false);
    s.group.updateMatrixWorld(true);
    const wp = s.group.localToWorld(lp.clone());
    flashAt(wp, 4 + Math.random() * 4, 0.4); sparksAt(wp, 30, 26); fireAt(wp, 10, 10); smokeAt(wp, 6, 6);
    sfx('boom', wp.distanceTo(camera.position), 0.7);
    shake = Math.max(shake, Math.min(0.6, 80 / (wp.distanceTo(camera.position) + 60)));
  }
  if (s.dying <= 0) destroy(s);
}

function destroy(s) {
  if (!s.alive) return;
  s.alive = false; s.dying = 0;
  droneOnDestroy(s);
  explode(s);
  scene.remove(s.group);
  sfx('boom', s === player ? 0 : s.group.position.distanceTo(camera.position), s.def.cls === 'fighter' ? 1 : 2.2);
  if (s.team === 1) { kills++; killLog[s.def.id] = (killLog[s.def.id] || 0) + 1; log(`${s.def.name} DESTROYED`, '#9dff7a'); }
  if (s === player) { state = 'dead'; log('HULL BREACH', '#ff4a3a'); }
  if (typeof onShipDestroyed === 'function') onShipDestroyed(s);
}

function explode(s) {
  const D = s.vox.data, vs = D.vs;
  const big = s.def.cls !== 'fighter';
  const count = Math.min(D.voxels.length, big ? 900 : 180);
  const mesh = new THREE.InstancedMesh(boxGeo(vs * (big ? 2.0 : 2.4)), voxMat, count);
  mesh.frustumCulled = false;
  s.group.updateMatrixWorld(true);
  const center = s.group.position.clone();
  const pos = [], vel = [];
  for (let n = 0; n < count; n++) {
    const v = D.voxels[Math.floor(Math.random() * D.voxels.length)];
    const p = s.group.localToWorld(new THREE.Vector3(v.x, v.y, v.z));
    pos.push(p);
    vel.push(p.clone().sub(center).normalize().multiplyScalar((big ? 6 : 8) + Math.random() * (big ? 22 : 28)).addScaledVector(s.vel, 0.6));
    mesh.setColorAt(n, _col.setRGB(v.cr * (v.g ? 0.5 : 1), v.cg * (v.g ? 0.5 : 1), v.cb * (v.g ? 0.5 : 1)));
  }
  scene.add(mesh);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb050).multiplyScalar(3), transparent: true, depthWrite: false }));
  flash.position.copy(center);
  scene.add(flash);
  debris.push({ mesh, flash, pos, vel, life: 0, size: s.def.radius * (big ? 0.8 : 1), dur: big ? 3.4 : 2.4 });
  const k = big ? 4 : 1;
  sparksAt(center, 120 * Math.min(k, 3), 50); fireAt(center, 50 * Math.min(k, 3), big ? 30 : 22); smokeAt(center, 30 * Math.min(k, 3), 10);
}

function segSphere(a, b, c, r) {   // does segment a->b hit sphere (c,r)?
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const l2 = dx * dx + dy * dy + dz * dz || 1e-9;
  let t = ((c.x - a.x) * dx + (c.y - a.y) * dy + (c.z - a.z) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + dx * t - c.x, py = a.y + dy * t - c.y, pz = a.z + dz * t - c.z;
  return px * px + py * py + pz * pz < r * r;
}

// march a path through the ship's voxel grid; returns local hit point or null
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function traceShip(s, p0, p1) {
  s.group.updateMatrixWorld(true);
  _a.copy(p0); s.group.worldToLocal(_a);
  _b.copy(p1); s.group.worldToLocal(_b);
  return traceLocal(s, _a.x, _a.y, _a.z, _b.x, _b.y, _b.z);
}
function traceLocal(s, ax, ay, az, bx, by, bz) {
  const V = s.vox, D = V.data;
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const n = Math.max(1, Math.ceil(len / (D.vs * 0.8)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = ax + dx * t, y = ay + dy * t, z = az + dz * t;
    const ci = Math.floor((x + D.hx) / D.vs), cj = Math.floor((y + D.hy) / D.vs), ck = Math.floor((z + D.hz) / D.vs);
    if (ci < 0 || cj < 0 || ck < 0 || ci >= D.nx || cj >= D.ny || ck >= D.nz) continue;
    if (V.solid[(ci * D.ny + cj) * D.nz + ck]) return new THREE.Vector3(x, y, z);
  }
  return null;
}
function traceShipLocal(s, p, dir, maxD) {
  return traceLocal(s, p.x, p.y, p.z, p.x + dir.x * maxD, p.y + dir.y * maxD, p.z + dir.z * maxD);
}
function solidAtWorld(s, wp) {
  const V = s.vox; if (!V) return false;
  const D = V.data;
  s.group.updateMatrixWorld(true);
  _a.copy(wp); s.group.worldToLocal(_a);
  const ci = Math.floor((_a.x + D.hx) / D.vs), cj = Math.floor((_a.y + D.hy) / D.vs), ck = Math.floor((_a.z + D.hz) / D.vs);
  if (ci < 0 || cj < 0 || ck < 0 || ci >= D.nx || cj >= D.ny || ck >= D.nz) return false;
  return V.solid[(ci * D.ny + cj) * D.nz + ck] === 1;
}

// ---- ship / ship collisions: crash damage for every class, friend or foe -------------------------------
// Mass classes are placeholders. Damage to each body = base(speed) x size factor x its share of the impact (the lighter ship takes more).
const MASS = { fighter: 1, corvette: 25, frigate: 150, capital: 2000 };
function collideShips(dt) {
  for (let i = 0; i < ships.length; i++) for (let j = 0; j < ships.length; j++) {
    const a = ships[i], b = ships[j];
    if (i === j || !a.alive || !b.alive || a.dying || b.dying) continue;
    if (a.def.drone && a.dOrder === 'ram') { if (b.team !== a.team) droneRamCheck(a, b); continue; }   // ramming drones: see 56_drones.js (replaces the generic crash branch)
    const ma = MASS[a.def.cls] || 1, mb = MASS[b.def.cls] || 1;
    if (ma > mb) continue;                                  // a = the lighter body (equal masses are handled from both sides)
    if (a.hitCool > 0) continue;
    const d = a.group.position.distanceTo(b.group.position);
    if (d > b.def.radius + 3 || (mb === ma && d > (a.def.radius + b.def.radius) * 0.6)) continue;
    if (!solidAtWorld(b, a.group.position)) continue;
    const rel = a.vel.clone().sub(b.vel);
    const sp = rel.length();
    a.hitCool = 0.6;
    const n = a.group.position.clone().sub(b.group.position); if (n.lengthSq() < 1e-6) n.set(0, 1, 0); n.normalize();
    const mu = ma * mb / (ma + mb);
    const base = (2 + sp * 0.22) * (1 + 0.35 * Math.sqrt(mu));
    const cap = 60 * (1 + 0.6 * Math.sqrt(mu));
    const dmgA = Math.min(cap, base * 2 * mb / (ma + mb)), dmgB = Math.min(cap, base * 2 * ma / (ma + mb));
    const wpA = a.group.position.clone();
    const lpA = new THREE.Vector3(0, 0, -a.def.half[2] * 0.5);
    a.lastAttacker = b; b.lastAttacker = a;
    applyHit(a, lpA, dmgA, wpA, 'kin');
    if (mb === ma) b.hitCool = 0.6;
    if (dmgB >= 1) applyHit(b, b.group.worldToLocal(wpA.clone()), dmgB, wpA, 'kin');
    if (a.team === b.team && (a === player || b === player)) log(`COLLISION WITH ${(a === player ? b : a).callsign || (a === player ? b : a).def.name}`, '#ffb040');
    a.vel.reflect(n).multiplyScalar(0.6);
    a.group.position.addScaledVector(n, 3);
    sparksAt(wpA, 30, 25); sfx('hit', a === player ? 0 : wpA.distanceTo(camera.position));
    if (a === player || b === player) { shake = 1; }
  }
}

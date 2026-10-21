// ======================================================================
//  COMBAT & DAMAGE
// ======================================================================
const _v = new THREE.Vector3();
function fire_(s) {
  const q = s.group.quaternion;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  s.group.updateMatrixWorld(true);
  let shots = 0;
  for (const g of s.def.guns) {
    if (compOf(s, g.comp).hp <= 0) continue;
    const pos = s.group.localToWorld(_v.set(g.pos[0], g.pos[1], g.pos[2]).clone());
    const mesh = new THREE.Mesh(boltGeo, boltMat(s.def.boltColor));
    mesh.position.copy(pos); mesh.quaternion.copy(q);
    scene.add(mesh);
    bolts.push({ mesh, team: s.team, dmg: s.def.damage, life: 2.2, pos, prev: pos.clone(),
      vel: dir.clone().multiplyScalar(s.def.boltSpeed).add(s.vel) });
    shots++;
  }
  s.cool = s.def.fireRate / powerMul(s);
  return shots;
}

function shieldFlash(s, lp, facing) {
  if (!s.shieldFx) return;
  const pct = s.shield[facing] / s.def.shield[facing];
  s.shieldFx.material.color.setRGB(0.25 + 0.75 * (1 - pct), 0.6 - 0.3 * (1 - pct), 0.9 - 0.7 * (1 - pct));
  s.shieldFx.material.opacity = 0.2;
}

function compState(c) { const r = Math.max(0, c.hp) / c.max; return r <= 0 ? 2 : r <= 0.5 ? 1 : 0; }
const _cp = new THREE.Vector3();

function applyHit(s, lp, dmg, wp) {
  s.lastHit = time;
  const def = s.def;
  if (s === player) { shake = Math.min(1, shake + 0.12 + dmg * 0.02); hitFlash = Math.min(1, hitFlash + 0.35); }
  const nz = lp.z / def.half[2], nx = lp.x / def.half[0];
  const facing = nz < 0 ? 'fore' : 'aft';
  const side = Math.abs(nz) >= Math.abs(nx) * 0.9 ? facing : (nx < 0 ? 'left' : 'right');
  let d = dmg;
  if (s.shield[facing] > 0 && compFactor(s, 'shield') > 0) {
    const a = Math.min(s.shield[facing], d);
    s.shield[facing] -= a; d -= a;
    shieldFlash(s, lp, facing);
    sparksAt(wp, 3, 9, [0.6, 1.4, 3, 1]);
    if (d <= 0) return;
  }
  if (s.armor[side] > 0) {
    const a = Math.min(s.armor[side], d);
    s.armor[side] -= a; d -= a;
    chip(s, lp, 0, 0.9 + 0.05 * a, false);
    sparksAt(wp, 4, 11);
    if (d <= 0) return;
  }
  // armour breached: hull damage + internal hit
  chip(s, lp, 0.45 + 0.1 * d, 1.3 + 0.12 * d, false);
  sparksAt(wp, 8, 18); fireAt(wp, 2, 5); smokeAt(wp, 2, 3);
  let best = null, bd = 1e9;
  for (const c of s.comps) {
    if (c.hp <= 0) continue;
    const dist = _cp.set(c.pos[0], c.pos[1], c.pos[2]).distanceTo(lp);
    if (dist < c.r * 2.4 + 0.8 && dist < bd) { bd = dist; best = c; }
  }
  if (best) {
    const before = compState(best);
    best.hp -= d * 0.7; s.structure -= d * 0.3;
    const after = compState(best);
    if (after > before) compEvent(s, best, after);
  } else s.structure -= d;
  if (s.structure <= 0 || compOf(s, 'power') && compOf(s, 'power').hp <= 0) destroy(s);
}

function compEvent(s, c, st) {
  const mine = s === player, tgt = s === target;
  if (mine || tgt) {
    const who = mine ? '' : 'TARGET ';
    log(`${who}${c.name} ${st === 2 ? 'DESTROYED' : 'DAMAGED'}`, mine ? (st === 2 ? '#ff5a4a' : '#ffd24a') : '#ffb080');
  }
  if (st === 2 && s.vox) {
    chip(s, _cp.set(c.pos[0], c.pos[1], c.pos[2]).clone(), c.r * 0.85, c.r * 1.7, false);
    s.group.updateMatrixWorld(true);
    const wp = s.group.localToWorld(_cp.set(c.pos[0], c.pos[1], c.pos[2]).clone());
    sparksAt(wp, 30, 24); fireAt(wp, 8, 8); smokeAt(wp, 6, 5);
    if (c.role === 'power') destroy(s);
  }
}

function destroy(s) {
  if (!s.alive) return;
  s.alive = false;
  explode(s);
  scene.remove(s.group);
  if (s.team === 1) { kills++; log(`${s.def.name} DESTROYED`, '#9dff7a'); }
  if (s === player) { state = 'dead'; log('HULL BREACH', '#ff4a3a'); }
}

function explode(s) {
  const D = s.vox.data, vs = D.vs;
  const count = Math.min(D.voxels.length, 180);
  const mesh = new THREE.InstancedMesh(boxGeo(vs * 2.4), voxMat, count);
  mesh.frustumCulled = false;
  s.group.updateMatrixWorld(true);
  const center = s.group.position.clone();
  const pos = [], vel = [];
  for (let n = 0; n < count; n++) {
    const v = D.voxels[Math.floor(Math.random() * D.voxels.length)];
    const p = s.group.localToWorld(new THREE.Vector3(v.x, v.y, v.z));
    pos.push(p);
    vel.push(p.clone().sub(center).normalize().multiplyScalar(8 + Math.random() * 28).addScaledVector(s.vel, 0.6));
    mesh.setColorAt(n, _col.setRGB(v.cr * (v.g ? 0.5 : 1), v.cg * (v.g ? 0.5 : 1), v.cb * (v.g ? 0.5 : 1)));
  }
  scene.add(mesh);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb050).multiplyScalar(3), transparent: true, depthWrite: false }));
  flash.position.copy(center);
  scene.add(flash);
  debris.push({ mesh, flash, pos, vel, life: 0, size: s.def.radius });
  sparksAt(center, 120, 50); fireAt(center, 50, 22); smokeAt(center, 30, 10);
}

function segSphere(a, b, c, r) {   // does segment a->b hit sphere (c,r)?
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const l2 = dx * dx + dy * dy + dz * dz || 1e-9;
  let t = ((c.x - a.x) * dx + (c.y - a.y) * dy + (c.z - a.z) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + dx * t - c.x, py = a.y + dy * t - c.y, pz = a.z + dz * t - c.z;
  return px * px + py * py + pz * pz < r * r;
}

// march the bolt's path through the ship's voxel grid; returns local hit point or null
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function traceShip(s, p0, p1) {
  const V = s.vox, D = V.data;
  s.group.updateMatrixWorld(true);
  _a.copy(p0); s.group.worldToLocal(_a);
  _b.copy(p1); s.group.worldToLocal(_b);
  const dx = _b.x - _a.x, dy = _b.y - _a.y, dz = _b.z - _a.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const n = Math.max(1, Math.ceil(len / (D.vs * 0.8)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = _a.x + dx * t, y = _a.y + dy * t, z = _a.z + dz * t;
    const ci = Math.floor((x + D.hx) / D.vs), cj = Math.floor((y + D.hy) / D.vs), ck = Math.floor((z + D.hz) / D.vs);
    if (ci < 0 || cj < 0 || ck < 0 || ci >= D.nx || cj >= D.ny || ck >= D.nz) continue;
    if (V.solid[(ci * D.ny + cj) * D.nz + ck]) return new THREE.Vector3(x, y, z);
  }
  return null;
}

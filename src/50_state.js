// ======================================================================
//  FLIGHT MODELS  (swap point: integrate(ship, cmd, dt) -> updates ship.vel)
// ======================================================================
const compOf = (s, id) => s.comps.find(c => c.id === id);
function compFactor(s, role) {
  if (s.blindUntil > time && (role === 'radar' || role === 'turret')) return 0;     // nuclear flash: sensors and PD optics blind for a while
  const cs = s.comps.filter(c => c.role === role);
  if (!cs.length) return 1;
  let t = 0; for (const c of cs) t += Math.max(0, c.hp) / c.max;
  return t / cs.length;
}
// ---- power allocation (FreeSpace 2 style ETS): 12 points over weapons / shields / engines, balanced = 4/4/4 = factor 1.0 ----
// factor per system: 0 pts -> 0.2, 4 -> 1.0, 12 -> 1.96. Weapons: capacitor recharge. Shields: shield recharge. Engines: top speed, turn, afterburner pool and refill.
const PW_KEYS = ['w', 's', 'e'], PW_NAMES = { w: 'WEAPONS', s: 'SHIELDS', e: 'ENGINES' };
const pwF = (s, k) => { const l = s.pw ? s.pw[k] : 4; return l <= 4 ? 0.2 + 0.2 * l : 1 + 0.12 * (l - 4); };
function powerShift(s, to) {                     // +1 point to `to`, taken from the larger of the other two (alternating on a tie)
  const o = PW_KEYS.filter(k => k !== to).filter(k => s.pw[k] > 0);
  if (s.pw[to] >= 12 || !o.length) return false;
  o.sort((a, b) => s.pw[b] - s.pw[a] || ((s.pwFlip = !s.pwFlip) ? 1 : -1));
  s.pw[o[0]]--; s.pw[to]++; return true;
}
const powerReset = s => { s.pw = { w: 4, s: 4, e: 4 }; };
const speedMul = s => (0.3 + 0.7 * compFactor(s, 'engine')) * (0.8 + 0.2 * pwF(s, 'e')) * (s.mod?.speed ?? 1);
const turnMul = s => (0.45 + 0.55 * compFactor(s, 'engine')) * (0.9 + 0.1 * pwF(s, 'e')) * (s.mod?.turn ?? 1);
const powerMul = s => 0.5 + 0.5 * compFactor(s, 'power');

// ---- afterburner pool: drains while burning, refills otherwise; empty = locked out until 25% ----
function abTick(s, want, dt) {
  const d = s.def, mx = abMaxOf(s);
  if (!d.abMax) { s.ab = false; return false; }
  if (s.abFuel > mx) s.abFuel = mx;                    // a damaged engine shrinks the pool
  const on = want && !s.abLock && s.abFuel > 0;
  if (on) { s.abFuel = Math.max(0, s.abFuel - dt); if (s.abFuel <= 0) s.abLock = true; }
  else s.abFuel = Math.min(mx, s.abFuel + d.abRegen * pwF(s, 'e') * subEff(s, 'engine', 'abRegen') * dt);
  if (s.abLock && s.abFuel > mx * 0.25) s.abLock = false;
  s.ab = on; return on;
}

const _fwd = new THREE.Vector3(), _simD = new THREE.Vector3(), _simQ = new THREE.Quaternion(), _simI = new THREE.Quaternion();
const SIMF = TUNE.simFlight;   // data: data/db.json tuning.simFlight (docs/DATABASE.md)      // SIM model: velocity-vector slew (rad per sim-second, fighters), capital-ship factor, braking vs accelerating
const aiFly = (s, cmd, dt) => (s.fm === 'newton' ? flightModels.newtonAI : s.fm === 'sim' ? flightModels.sim : flightModels.arcade)(s, cmd, dt);
const flightModels = {
  arcade(s, cmd, dt) {
    _fwd.set(0, 0, -1).applyQuaternion(s.group.quaternion);
    const ab = abTick(s, !!cmd.ab, dt);
    const target = s.def.maxSpeed * speedMul(s) * cmd.throttle * (ab ? abSpdOf(s) : 1);
    s.vel.lerp(_fwd.multiplyScalar(target), 1 - Math.exp(-(s.def.cls === 'fighter' ? 3 : 0.5) * dt));
  },
  // SIM (TIE Fighter style, owner request 2026-10-30): throttle sets a wanted speed, but speed changes at the ship's real acceleration (so a throttle
  // slam takes seconds, not a third of one), and the velocity VECTOR trails the nose at a limited slew rate: a hard turn at speed skids a little before
  // the ship is flying where it points. No drift once it catches up, no strafing, no coasting at zero throttle (speed always follows the throttle).
  sim(s, cmd, dt) {
    _fwd.set(0, 0, -1).applyQuaternion(s.group.quaternion);
    const ab = abTick(s, !!cmd.ab, dt), fighter = s.def.cls === 'fighter';
    const want = s.def.maxSpeed * speedMul(s) * (ab ? abSpdOf(s) : 1) * cmd.throttle;
    const a = (s.def.accel || 40) * speedMul(s) * (ab ? abAccOf(s) : 1);
    const sp = s.vel.length();
    const v = Math.max(0, sp + clamp(want - sp, -a * SIMF.decel * dt, a * dt));
    if (sp < 2) { s.vel.copy(_fwd).multiplyScalar(v); return; }
    _simD.copy(s.vel).divideScalar(sp);
    const ang = _simD.angleTo(_fwd), k = (fighter ? SIMF.slew : SIMF.slew * SIMF.capital) * dt;
    if (ang > 1e-4) { _simQ.setFromUnitVectors(_simD, _fwd); _simI.identity().slerp(_simQ, Math.min(1, k / ang)); _simD.applyQuaternion(_simI).normalize(); }
    s.vel.copy(_simD).multiplyScalar(v);
  },
  newtonAI(s, cmd, dt) {            // AI under Newtonian rules: thrust along the nose toward a wanted forward speed, no velocity vectoring
    _fwd.set(0, 0, -1).applyQuaternion(s.group.quaternion);
    const ab = abTick(s, !!cmd.ab, dt);
    const a = s.def.accel * speedMul(s) * (ab ? abAccOf(s) : 1);
    const want = s.def.maxSpeed * speedMul(s) * cmd.throttle * (ab ? abSpdOf(s) : 1);
    const thrust = Math.max(-0.5, Math.min(1, (want - s.vel.dot(_fwd)) / (a * 0.6)));
    s.vel.addScaledVector(_fwd, thrust * a * dt);
    const cap = s.def.maxSpeed * 2.2 * (ab ? abSpdOf(s) / 1.8 : 1);
    if (s.vel.length() > cap) s.vel.setLength(cap);
  },
  newton(s, cmd, dt) {
    _fwd.set(0, 0, -1).applyQuaternion(s.group.quaternion);
    const ab = abTick(s, !!cmd.ab, dt);
    const a = s.def.accel * speedMul(s) * (ab ? abAccOf(s) : 1);
    s.vel.addScaledVector(_fwd, cmd.thrust * a * dt);
    if (cmd.brake) s.vel.multiplyScalar(Math.exp(-1.8 * dt));
    const cap = s.def.maxSpeed * 2.2 * (ab ? abSpdOf(s) / 1.8 : 1);
    if (s.vel.length() > cap) s.vel.setLength(cap);
  },
};
// flight model preference (F key, OPTIONS, mission briefing): ARCADE (default), SIM (TIE style), NEWTONIAN. Persisted; skirmish setup overrides per run.
const FM_ORDER = ['arcade', 'sim', 'newton'], FM_NAMES = { arcade: 'ARCADE', sim: 'SIM (TIE)', newton: 'NEWTONIAN' };
function fmLoad() { try { const v = localStorage.getItem('gs_fm'); if (FM_ORDER.includes(v)) return v; } catch (e) { /* storage unavailable */ } return 'arcade'; }
let flightMode = fmLoad();
function fmSet(name, quiet) {
  if (!FM_ORDER.includes(name)) return;
  flightMode = name;
  try { localStorage.setItem('gs_fm', name); } catch (e) { /* ignore */ }
  for (const s of ships) if (s !== player) s.fm = name === 'sim' ? 'sim' : (s.fm === 'sim' ? 'arcade' : s.fm);     // AI flies the same rules in SIM; Newtonian AI stays opt-in (skirmish)
  if (!quiet) log('FLIGHT MODEL: ' + FM_NAMES[name], '#9adcff');
}
// match the target's speed (TIE Fighter: BACKSPACE): sets the throttle so the speed gauge reads the target's speed; not in Newtonian (no throttle there)
function matchSpeed(p) {
  const t = target;
  if (!p || !p.alive || !t || !t.alive || flightMode === 'newton') { log(flightMode === 'newton' ? 'NO THROTTLE IN NEWTONIAN' : 'NO TARGET TO MATCH', '#ff5a4a'); return; }
  p.throttle = clamp(t.vel.length() / Math.max(1, p.def.maxSpeed * speedMul(p)), 0, 1);
  log(`MATCHING ${t.vel.length().toFixed(0)} m/s`, '#9adcff'); sfx('click');
}

// ======================================================================
//  WORLD STATE
// ======================================================================
let ships = [], bolts = [], debris = [], missiles = [], decoys = [], flashes = [];
const killLog = {};
let player = null, target = null, manualTarget = false;
let wave = 0, kills = 0, state = 'play', view = 'cockpit';
let time = 0, shake = 0, hitFlash = 0;
const logs = [];

const flameGeo = new THREE.ConeGeometry(0.42, 1, 7).rotateX(Math.PI / 2);   // apex trails toward +Z
const flameMats = {};
const flameMat = c => flameMats[c] ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.7) });
const shieldGeo = new THREE.SphereGeometry(1, 20, 14);

function log(text, color = '#8fffd0') { reportLog(text); logs.push({ text, color, t: time }); if (logs.length > 6) logs.shift(); }

// ---- voxel mesh build ------------------------------------------------
// Merged surface mesh (2026-11-12): the body is one mesh per z slab holding only the cube faces that
// border empty space. Instanced boxes drew all 6 faces (12 triangles) of every surface voxel; a hull
// voxel shows 1-2. Damage marks the touched slabs dirty and flushVox() rebuilds them before the next
// frame. Glow voxels stay instanced (few, own material). ?vox=inst keeps the old instanced body.
const VOX_MODE = ['inst', 'cube'].includes(params.get('vox')) ? params.get('vox') : 'smooth';
const VOX_INST = VOX_MODE === 'inst';
const VOX_SMOOTH_DROP = VOX_MODE === 'smooth' ? (params.has('vdrop') ? +params.get('vdrop') : 1) : 0;   // smoothing hides the coarser grid, so smooth hulls use one detail step less
const voxMeshMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22, vertexColors: true });
const VFACE = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(n => {
  const ax = n.findIndex(v => v !== 0), u = (ax + 1) % 3, w = (ax + 2) % 3;
  let q = [[0,0],[1,0],[1,1],[0,1]].map(([a, b]) => { const c = [0,0,0]; c[ax] = n[ax] > 0 ? 1 : 0; c[u] = a; c[w] = b; return c; });
  const e1 = q[1].map((v, i) => v - q[0][i]), e2 = q[2].map((v, i) => v - q[0][i]);
  const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
  if (cr[0]*n[0] + cr[1]*n[1] + cr[2]*n[2] < 0) q = [q[0], q[3], q[2], q[1]];
  return { n, q };
});
const voxDirtySet = new Set();               // ships with slabs waiting for flushVox
function disposeVox(s) {
  const V = s.vox; if (!V) return;
  for (const m of [V.body, V.glow, V.patch]) { if (!m) continue; s.group.remove(m); if (m.dispose) m.dispose(); }
  if (V.slabMesh) for (const m of V.slabMesh) if (m) m.geometry.dispose();
  voxDirtySet.delete(s);
  s.vox = null;
}
function voxCellRGB(V, cell, out) {
  const D = V.data, vi = D.cellToVox[cell];
  if (vi >= 0) { const v = D.voxels[vi], f = V.scorch[vi]; out[0] = v.cr * f; out[1] = v.cg * f; out[2] = v.cb * f; }
  else { const p = V.patchCol.get(cell); out[0] = p ? p[0] : 0.05; out[1] = p ? p[1] : 0.04; out[2] = p ? p[2] : 0.03; }
  return out;
}
const _rgb = [0, 0, 0];
function buildSlab(V, si) { if (VOX_MODE === 'smooth') buildSlabSmooth(V, si); else buildSlabCube(V, si); }
function buildSlabCube(V, si) {
  const D = V.data, { nx, ny, nz, grid } = D, solid = V.solid, hasInst = V.hasInst;
  const cells = V.slabCells[si] = V.slabCells[si].filter(c => hasInst[c]);
  const mask = new Uint8Array(cells.length);
  let F = 0;
  for (let q = 0; q < cells.length; q++) {
    const c = cells[q], i = (c / (ny * nz)) | 0, j = ((c / nz) | 0) % ny, k = c % nz;
    let m = 0;
    for (let d = 0; d < 6; d++) {
      const o = VFACE[d].n, a = i + o[0], b = j + o[1], e = k + o[2];
      if (a < 0 || b < 0 || e < 0 || a >= nx || b >= ny || e >= nz || !solid[(a * ny + b) * nz + e]) { m |= 1 << d; F++; }
    }
    mask[q] = m;
  }
  const mesh = V.slabMesh[si];
  mesh.geometry.dispose();
  const geo = new THREE.BufferGeometry();
  mesh.geometry = geo; mesh.visible = F > 0;
  const vtx = V.slabVtx[si] = new Map();
  if (!F) return;
  const pos = new Uint16Array(F * 12), nor = new Int8Array(F * 12), col = new Float32Array(F * 12);
  const idx = F * 4 > 65535 ? new Uint32Array(F * 6) : new Uint16Array(F * 6);
  let f = 0;
  for (let q = 0; q < cells.length; q++) {
    const m = mask[q]; if (!m) continue;
    const c = cells[q], i = (c / (ny * nz)) | 0, j = ((c / nz) | 0) % ny, k = c % nz;
    voxCellRGB(V, c, _rgb);
    const v0 = f * 4;
    for (let d = 0; d < 6; d++) {
      if (!(m & (1 << d))) continue;
      const { n, q: Q } = VFACE[d];
      for (let t = 0; t < 4; t++) {
        const o = (f * 4 + t) * 3;
        pos[o] = i + Q[t][0]; pos[o + 1] = j + Q[t][1]; pos[o + 2] = k + Q[t][2];
        nor[o] = n[0] * 127; nor[o + 1] = n[1] * 127; nor[o + 2] = n[2] * 127;
        col[o] = _rgb[0]; col[o + 1] = _rgb[1]; col[o + 2] = _rgb[2];
      }
      const b = f * 4, x = f * 6;
      idx[x] = b; idx[x + 1] = b + 1; idx[x + 2] = b + 2; idx[x + 3] = b; idx[x + 4] = b + 2; idx[x + 5] = b + 3;
      f++;
    }
    vtx.set(c, v0 * 65536 + (f * 4 - v0));                       // first vertex and vertex count of this cell
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3, true));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  V.faces[si] = F;
}
// Smooth hull (owner 2026-11-12, "all smoother"): naive surface nets over a lightly blurred occupancy field,
// one vertex per straddling dual cube, one quad per inside/outside sample edge. Every vertex is a pure function
// of the field around it (no iterative smoothing across the mesh), so slabs rebuilt on their own meet without
// cracks. Normals come from the field gradient for soft shading; colours average the solid corner voxels.
// Same triangle count as the merged cubes at the same detail.
const VS_ISO = 0.39;
function buildSlabSmooth(V, si) {
  const D = V.data, { nx, ny, nz } = D, solid = V.solid, hasInst = V.hasInst, c2v = D.cellToVox;
  const k0 = si * V.slabT, k1 = Math.min(nz, k0 + V.slabT);
  const ka = Math.max(-1, k0 - 4), kb = Math.min(nz, k1 + 3);       // field range (samples)
  // padded solid block: i -2..nx+1, j -2..ny+1, k ka-1..kb+1
  const PX = nx + 4, PY = ny + 4, PZ = kb - ka + 3, pyz = PY * PZ;
  const sol = new Uint8Array(PX * PY * PZ);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const src = (i * ny + j) * nz, dst = ((i + 2) * PY + (j + 2)) * PZ;
    for (let k = Math.max(0, ka - 1); k <= Math.min(nz - 1, kb + 1); k++) sol[dst + k - ka + 1] = solid[src + k];
  }
  // field on the same padded index space (pad cells stay 0)
  const fld = new Float32Array(PX * PY * PZ);
  for (let i = 1; i < PX - 1; i++) for (let j = 1; j < PY - 1; j++) {
    const row = (i * PY + j) * PZ;
    for (let k = 1; k < PZ - 1; k++) {
      const c = row + k, n6 = sol[c + pyz] + sol[c - pyz] + sol[c + PZ] + sol[c - PZ] + sol[c + 1] + sol[c - 1];
      if (sol[c] || n6) fld[c] = (4 * sol[c] + n6) * 0.1;
    }
  }
  const at = (i, j, k) => ((i + 2) * PY + (j + 2)) * PZ + (k - ka + 1);   // sample -> padded index
  const OFF8 = [0, pyz, PZ, pyz + PZ, 1, pyz + 1, PZ + 1, pyz + PZ + 1];  // corner a: x=a&1, y=a>>1&1, z=a>>2&1
  const EA = [0,2,4,6,0,1,4,5,0,1,2,3], EB = [1,3,5,7,2,3,6,7,4,5,6,7];
  // raw dual vertices for cubes i -1..nx-1, j -1..ny-1, k ca..cb, stored at the padded index of their lower corner
  const ca = Math.max(-1, k0 - 2), cb = Math.min(nz - 1, k1);
  const raw = new Float32Array(PX * PY * PZ * 3), act = new Uint8Array(PX * PY * PZ);
  const cf = new Float32Array(8);
  for (let i = -1; i < nx; i++) for (let j = -1; j < ny; j++) {
    const base = at(i, j, 0);
    for (let k = ca; k <= cb; k++) {
      const c = base + k;
      let mask = 0;
      for (let a = 0; a < 8; a++) { const f = fld[c + OFF8[a]]; cf[a] = f; if (f >= VS_ISO) mask |= 1 << a; }
      if (mask === 0 || mask === 255) continue;
      let x = 0, y = 0, z = 0, n = 0;
      for (let e = 0; e < 12; e++) {
        const A = EA[e], B = EB[e];
        if (((mask >> A) & 1) === ((mask >> B) & 1)) continue;
        const t = (VS_ISO - cf[A]) / (cf[B] - cf[A]);
        const ax = A & 1, ay = (A >> 1) & 1, az = A >> 2;
        x += ax + ((B & 1) - ax) * t; y += ay + (((B >> 1) & 1) - ay) * t; z += az + ((B >> 2) - az) * t; n++;
      }
      act[c] = 1; raw[c * 3] = i + x / n; raw[c * 3 + 1] = j + y / n; raw[c * 3 + 2] = k + z / n;
    }
  }
  const va = Math.max(-1, k0 - 1), vb = Math.min(nz - 1, k1 - 1);
  const vid = new Int32Array(PX * PY * PZ).fill(-1);
  const P = [], N = [], C = [], rgb = [0, 0, 0];
  const NB = [pyz, -pyz, PZ, -PZ, 1, -1];
  const vert = (i, j, k) => {
    const c = at(i, j, k);
    if (vid[c] >= 0) return vid[c];
    let x = raw[c * 3], y = raw[c * 3 + 1], z = raw[c * 3 + 2], sx = 0, sy = 0, sz = 0, m = 0;
    for (let q = 0; q < 6; q++) {
      if ((q === 4 && k + 1 > cb) || (q === 5 && k - 1 < ca)) continue;
      const r = c + NB[q]; if (!act[r]) continue;
      sx += raw[r * 3]; sy += raw[r * 3 + 1]; sz += raw[r * 3 + 2]; m++;
    }
    if (m) { x = 0.5 * x + 0.5 * sx / m; y = 0.5 * y + 0.5 * sy / m; z = 0.5 * z + 0.5 * sz / m; }
    let gx = 0, gy = 0, gz = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const cx = c + a * PZ + b, cy = c + a * pyz + b, cz = c + a * pyz + b * PZ;
      gx += fld[cx + 2 * pyz] + fld[cx + pyz] - fld[cx] - fld[cx - pyz];
      gy += fld[cy + 2 * PZ] + fld[cy + PZ] - fld[cy] - fld[cy - PZ];
      gz += fld[cz + 2] + fld[cz + 1] - fld[cz] - fld[cz - 1];
    }
    let gl = Math.hypot(gx, gy, gz);
    if (gl < 1e-6) { gx = 0; gy = -1; gz = 0; gl = 1; }   // flat field (thin symmetric part): a zero normal turns into NaN in the shader and bloom smears it over the frame
    let r = 0, g = 0, bl = 0, w = 0;
    for (let pass = 0; pass < 2 && !w; pass++) {
      const lo = pass ? -1 : 0, hi = pass ? 2 : 1;
      for (let a = lo; a <= hi; a++) for (let b = lo; b <= hi; b++) for (let d = lo; d <= hi; d++) {
        const ii = i + a, jj = j + b, kk = k + d;
        if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
        const cell = (ii * ny + jj) * nz + kk;
        if (!solid[cell] || (!hasInst[cell] && c2v[cell] < 0)) continue;
        voxCellRGB(V, cell, rgb); r += rgb[0]; g += rgb[1]; bl += rgb[2]; w++;
      }
    }
    if (!w) { r = 0.05; g = 0.04; bl = 0.03; w = 1; }
    const v = P.length / 3;
    P.push(x + 0.5, y + 0.5, z + 0.5); N.push(-gx / gl, -gy / gl, -gz / gl); C.push(r / w, g / w, bl / w);
    vid[c] = v;
    return v;
  };
  const I = [];
  const quad = (a, b, c, d, nx_, ny_, nz_) => {
    const pa = a * 3, pb = b * 3, pc = c * 3;
    const ux = P[pb] - P[pa], uy = P[pb + 1] - P[pa + 1], uz = P[pb + 2] - P[pa + 2];
    const wx = P[pc] - P[pa], wy = P[pc + 1] - P[pa + 1], wz = P[pc + 2] - P[pa + 2];
    if ((uy * wz - uz * wy) * nx_ + (uz * wx - ux * wz) * ny_ + (ux * wy - uy * wx) * nz_ >= 0) I.push(a, b, c, a, c, d); else I.push(a, c, b, a, d, c);
  };
  const kStart = si ? k0 : -1;
  for (let i = -1; i < nx; i++) for (let j = -1; j < ny; j++) {
    const base = at(i, j, 0);
    for (let k = kStart; k < k1; k++) {
      const c = base + k, s0 = fld[c] >= VS_ISO;
      if (j >= 0 && k >= k0 && s0 !== (fld[c + pyz] >= VS_ISO))
        quad(vert(i, j - 1, k - 1), vert(i, j, k - 1), vert(i, j, k), vert(i, j - 1, k), s0 ? 1 : -1, 0, 0);
      if (i >= 0 && k >= k0 && s0 !== (fld[c + PZ] >= VS_ISO))
        quad(vert(i - 1, j, k - 1), vert(i - 1, j, k), vert(i, j, k), vert(i, j, k - 1), 0, s0 ? 1 : -1, 0);
      if (i >= 0 && j >= 0 && k <= vb && s0 !== (fld[c + 1] >= VS_ISO))
        quad(vert(i - 1, j - 1, k), vert(i, j - 1, k), vert(i, j, k), vert(i - 1, j, k), 0, 0, s0 ? 1 : -1);
    }
  }
  const mesh = V.slabMesh[si];
  mesh.geometry.dispose();
  const geo = new THREE.BufferGeometry();
  mesh.geometry = geo; mesh.visible = I.length > 0;
  V.slabVtx[si] = null;
  V.faces[si] = I.length / 6;
  if (!I.length) return;
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  geo.setIndex(new THREE.BufferAttribute(P.length / 3 > 65535 ? new Uint32Array(I) : new Uint16Array(I), 1));
  geo.computeBoundingSphere();
}
const voxSlabOf = (V, cell) => Math.floor((cell % V.data.nz) / V.slabT);
function voxMarkDirty(s, cell) {
  const V = s.vox, k = cell % V.data.nz, n = V.slabMesh.length;
  const reach = VOX_MODE === 'smooth' ? 4 : 1;                    // the smooth surface reads the field up to 4 samples away
  for (let kk = k - reach; kk <= k + reach; kk++) { const si = Math.floor(kk / V.slabT); if (si >= 0 && si < n) V.dirty.add(si); }
  voxDirtySet.add(s);
}
// deadline (performance.now() ms): stop after the slab that crosses it; the rest stay dirty for the next frame.
function flushVox(s, deadline = Infinity) {
  const V = s.vox; if (!V || !V.dirty) return;
  for (const si of V.dirty) {
    buildSlab(V, si); V.built[si] = performance.now(); V.colDirty.delete(si); V.dirty.delete(si);
    if (performance.now() > deadline) return;
  }
  if (VOX_MODE === 'smooth') {
    // scorch-only changes rebuild a slab at most every 150 ms (beams scorch every frame)
    for (const si of V.colDirty) {
      const now = performance.now();
      if (now - V.built[si] < 150) continue;
      buildSlab(V, si); V.built[si] = now; V.colDirty.delete(si);
      if (performance.now() > deadline) return;
    }
    if (V.colDirty.size) return;                                     // stay in voxDirtySet until the rest are due
  } else {
    for (const si of V.colDirty) { const a = V.slabMesh[si].geometry.getAttribute('color'); if (a) a.needsUpdate = true; }
    V.colDirty.clear();
  }
  voxDirtySet.delete(s);
}
// Per frame: at most about 4 ms of slab rebuilds (at least one slab); holes may show a frame or two late.
function flushAllVox() { const deadline = performance.now() + 4; for (const s of [...voxDirtySet]) { flushVox(s, deadline); if (performance.now() > deadline) break; } }
const voxFaces = s => s.vox && s.vox.faces ? s.vox.faces.reduce((a, b) => a + b, 0) : 0;
// Slab set for a hull: thickness gives one slab for a small fighter, about ten (cubes) or sixteen (smooth) along a capital.
function voxInitSlabs(V, bodyV) {
  const D = V.data;
  V.slabT = VOX_MODE === 'smooth' ? Math.max(16, Math.ceil(D.nz / 16)) : Math.max(24, Math.ceil(D.nz / 10));
  const n = Math.ceil(D.nz / V.slabT);
  V.slabCells = Array.from({ length: n }, () => []);
  V.slabVtx = []; V.built = new Array(n).fill(0); V.faces = new Array(n).fill(0); V.dirty = new Set(); V.colDirty = new Set(); V.patchCol = new Map();
  for (const vi of bodyV) V.slabCells[voxSlabOf(V, D.voxels[vi].cell)].push(D.voxels[vi].cell);
  V.body = new THREE.Group();
  V.body.count = bodyV.length;               // surface voxel count (tests and diagnostics read body.count + glow.count)
  V.body.position.set(-D.hx, -D.hy, -D.hz); V.body.scale.setScalar(D.vs);
  V.slabMesh = V.slabCells.map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), voxMeshMat); V.body.add(m); return m; });
  for (let si = 0; si < n; si++) buildSlab(V, si);
}
// Undamaged hull body for viewers (the yard): the same slab meshes as in game, as a group placed in model space.
function voxStaticBody(D) {
  const solid = new Uint8Array(D.grid.length), hasInst = new Uint8Array(D.cellToVox.length);
  for (let i = 0; i < solid.length; i++) solid[i] = D.grid[i] >= 0 ? 1 : 0;
  for (let i = 0; i < hasInst.length; i++) hasInst[i] = D.cellToVox[i] >= 0 ? 1 : 0;
  const V = { data: D, solid, hasInst, scorch: new Float32Array(D.voxels.length).fill(1) };
  const bodyV = []; D.voxels.forEach((v, i) => { if (!v.g) bodyV.push(i); });
  voxInitSlabs(V, bodyV);
  return V.body;
}
function buildVox(s) {
  disposeVox(s);
  const di = Math.max(0, detailIdx - (s.lodDrop | 0) - (s.def.cls === 'fighter' ? 0 : VOX_SMOOTH_DROP));   // distance LOD lowers the detail step of far ships; smooth non-fighter hulls build one step lower (fighters keep thin parts)
  const D = voxelize(s.def, resFor(s.def, di), di);
  const cap = s.def.cls === 'fighter' ? (di >= 6 ? 20000 : 5000) : (di >= 6 ? 60000 : 30000);
  const bodyV = [], glowV = [];
  D.voxels.forEach((v, i) => (v.g ? glowV : bodyV).push(i));
  const glow = new THREE.InstancedMesh(boxGeo(D.vs * 1.03), glowMat, Math.max(1, glowV.length));
  const instOf = new Int32Array(D.voxels.length);
  const fill = (mesh, list) => {
    list.forEach((vi, n) => {
      const v = D.voxels[vi];
      instOf[vi] = n;
      _m.makeTranslation(v.x, v.y, v.z);
      mesh.setMatrixAt(n, _m);
      mesh.setColorAt(n, _col.setRGB(v.cr, v.cg, v.cb));
    });
    mesh.count = list.length;
  };
  fill(glow, glowV);
  // TypedArray.from invokes a JS callback for every grid cell, millions of times
  // per high-detail ship. Fill the same masks with tight loops on the spawn path.
  const solid = new Uint8Array(D.grid.length), hasInst = new Uint8Array(D.cellToVox.length);
  for (let i = 0; i < solid.length; i++) solid[i] = D.grid[i] >= 0 ? 1 : 0;
  for (let i = 0; i < hasInst.length; i++) hasInst[i] = D.cellToVox[i] >= 0 ? 1 : 0;
  s.vox = {
    data: D, cap, glow, patchN: 0, instOf, patchOf: new Map(),
    solid, hasInst, scorch: new Float32Array(D.voxels.length).fill(1),
  };
  const V = s.vox;
  if (VOX_INST) {
    V.body = new THREE.InstancedMesh(boxGeo(D.vs), voxMat, Math.max(1, bodyV.length));
    V.patch = new THREE.InstancedMesh(boxGeo(D.vs), voxMat, cap);
    fill(V.body, bodyV); fill(glow, glowV);
    V.patch.setColorAt(0, _col.setRGB(0, 0, 0)); V.patch.count = 0;
  } else {
    voxInitSlabs(V, bodyV);
  }
  for (const m of [V.body, glow, V.patch]) { if (!m) continue; m.frustumCulled = false; s.group.add(m); }
  if (s.shieldFx) sizeShield(s);
  for (const ev of s.dmgEvents) chip(s, ev.p, ev.r, ev.sr, true, ev.shallow);
  flushVox(s);
}

// Fit an ellipsoid around the corners of every rendered voxel, then add the
// configured clearance. The same axes are used by the collision test.
function sizeShield(s) {
  const D=s.vox.data, h=D.vs*0.515, axes=[h,h,h];
  for (const v of D.voxels) { axes[0]=Math.max(axes[0],Math.abs(v.x)+h); axes[1]=Math.max(axes[1],Math.abs(v.y)+h); axes[2]=Math.max(axes[2],Math.abs(v.z)+h); }
  let max=1;
  for (const v of D.voxels) max=Math.max(max,Math.hypot((Math.abs(v.x)+h)/axes[0],(Math.abs(v.y)+h)/axes[1],(Math.abs(v.z)+h)/axes[2]));
  const margin=1+TUNE.damageVisuals.shieldMargin;
  s.shieldFx.scale.set(axes[0]*max*margin,axes[1]*max*margin,axes[2]*max*margin);
}

const _lv = new THREE.Vector3();
// A shallow dent removes only an original surface cell with enough material
// behind it. Repeated hits cannot deepen the dent or perforate thin features.
function dentCell(D, i, j, k) {
  const {nx, ny, nz, grid, cellToVox} = D;
  const cell = (i * ny + j) * nz + k;
  if (cellToVox[cell] < 0) return false;
  const need = Math.ceil(1 / TUNE.damageVisuals.dentThicknessFraction);
  for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    const outside = (i+dx < 0 || i+dx >= nx || j+dy < 0 || j+dy >= ny || k+dz < 0 || k+dz >= nz) || grid[((i+dx)*ny+j+dy)*nz+k+dz] < 0;
    if (!outside) continue;
    let depth = 1;
    for (; depth < need; depth++) {
      const x=i-dx*depth, y=j-dy*depth, z=k-dz*depth;
      if (x<0 || x>=nx || y<0 || y>=ny || z<0 || z>=nz || grid[(x*ny+y)*nz+z]<0) break;
    }
    if (depth >= need) return true;
  }
  return false;
}
function chip(s, lp, r, sr, replay, shallowOverride) {
  const V = s.vox, D = V.data, vs = D.vs, { nx, ny, nz } = D;
  // A carve radius that scales with raw damage (hit: 0.35+0.08*d) reached 14 m for a 210-damage missile, wider than a whole fighter, so one hit deleted every voxel of the hull (only exhaust and hit boxes stayed). Cap it relative to the ship.
  if (!replay) { const rad = s.def.radius; r = Math.min(r, 0.2 * rad + 0.5); sr = Math.min(sr, 0.35 * rad + 1); }
  const shallow = shallowOverride ?? (s.structure >= s.def.structure * TUNE.damageVisuals.holeHullFraction);
  if (!replay) { s.dmgEvents.push({ p: lp.clone(), r, sr, shallow }); if (s.dmgEvents.length > 250) s.dmgEvents.shift(); }
  const R = Math.max(r, sr);
  const ci = Math.floor((lp.x + D.hx) / vs), cj = Math.floor((lp.y + D.hy) / vs), ck = Math.floor((lp.z + D.hz) / vs);
  const rr = Math.ceil(R / vs) + 1;
  const removed = [];
  let dirty = false;
  for (let i = Math.max(0, ci - rr); i <= Math.min(nx - 1, ci + rr); i++) {
    const dx = -D.hx + (i + 0.5) * vs - lp.x;
    for (let j = Math.max(0, cj - rr); j <= Math.min(ny - 1, cj + rr); j++) {
      const dy = -D.hy + (j + 0.5) * vs - lp.y;
      for (let k = Math.max(0, ck - rr); k <= Math.min(nz - 1, ck + rr); k++) {
        const cell = (i * ny + j) * nz + k;
        if (!V.solid[cell]) continue;
        const dz = -D.hz + (k + 0.5) * vs - lp.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (r > 0 && d2 <= r * r && ((!shallow && s.def.cls === 'fighter') || dentCell(D, i, j, k))) {
          V.solid[cell] = 0;
          if (V.hasInst[cell]) {
            V.hasInst[cell] = 0;
            const vi = D.cellToVox[cell];
            if (vi >= 0 && D.voxels[vi].g) V.glow.setMatrixAt(V.instOf[vi], ZERO);
            else if (!VOX_INST) voxMarkDirty(s, cell);
            else if (vi >= 0) V.body.setMatrixAt(V.instOf[vi], ZERO);
            else { const pi = V.patchOf.get(cell); if (pi !== undefined) V.patch.setMatrixAt(pi, ZERO); }
          }
          if (!VOX_INST) voxMarkDirty(s, cell);               // neighbours across the hole now show faces
          removed.push(cell); dirty = true;
        } else if (sr > 0 && d2 <= sr * sr && V.hasInst[cell]) {
          const vi = D.cellToVox[cell];
          if (vi >= 0) {
            const v = D.voxels[vi];
            const f = (v.g ? 0.15 : 0.28) + 0.72 * Math.sqrt(d2 / (sr * sr));
            if (f < V.scorch[vi]) {
              V.scorch[vi] = f;
              if (v.g || VOX_INST) (v.g ? V.glow : V.body).setColorAt(V.instOf[vi], _col.setRGB(v.cr * f, v.cg * f, v.cb * f));
              else {
                const si = voxSlabOf(V, cell), e = V.slabVtx[si] && V.slabVtx[si].get(cell);
                if (VOX_MODE === 'smooth') { V.colDirty.add(si); voxDirtySet.add(s); }
                else if (e !== undefined) {
                  const a = V.slabMesh[si].geometry.getAttribute('color').array, v0 = Math.floor(e / 65536), nv = e % 65536;
                  for (let t = v0; t < v0 + nv; t++) { a[t * 3] = v.cr * f; a[t * 3 + 1] = v.cg * f; a[t * 3 + 2] = v.cb * f; }
                  V.colDirty.add(si); voxDirtySet.add(s);
                }
              }
              dirty = true;
            }
          }
        }
      }
    }
  }
  // expose interior voxels behind removed cells
  for (const cell of removed) {
    const k = cell % nz, j = Math.floor(cell / nz) % ny, i = Math.floor(cell / (ny * nz));
    for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const ni = i + a, nj = j + b, nk = k + c;
      if (ni < 0 || nj < 0 || nk < 0 || ni >= nx || nj >= ny || nk >= nz) continue;
      const nc = (ni * ny + nj) * nz + nk;
      if (!V.solid[nc] || V.hasInst[nc] || V.patchN >= V.cap) continue;
      const idx = V.patchN++;
      const q = Math.random();
      const rgb = q < 0.1 ? [2.4, 0.75, 0.15] : [(0.03 + q * 0.06) * 1.25, 0.03 + q * 0.06, (0.03 + q * 0.06) * 0.8];   // glowing ember or charred interior
      if (VOX_INST) {
        _m.makeTranslation(-D.hx + (ni + 0.5) * vs, -D.hy + (nj + 0.5) * vs, -D.hz + (nk + 0.5) * vs);
        V.patch.setMatrixAt(idx, _m); V.patch.setColorAt(idx, _col.setRGB(rgb[0], rgb[1], rgb[2]));
      } else { V.patchCol.set(nc, rgb); V.slabCells[voxSlabOf(V, nc)].push(nc); voxMarkDirty(s, nc); }
      V.hasInst[nc] = 1; V.patchOf.set(nc, idx);
      dirty = true;
    }
  }
  if (VOX_INST) V.patch.count = V.patchN;
  if (dirty) {
    for (const m of [V.body, V.glow, V.patch]) {
      if (!m || !m.isInstancedMesh) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  if (!replay && removed.length) {
    s.group.updateMatrixWorld(true);
    const n = Math.min(removed.length, 14);
    for (let q = 0; q < n; q++) {
      const cell = removed[Math.floor(Math.random() * removed.length)];
      const k = cell % nz, j = Math.floor(cell / nz) % ny, i = Math.floor(cell / (ny * nz));
      const wp = s.group.localToWorld(_lv.set(-D.hx + (i + 0.5) * vs, -D.hy + (j + 0.5) * vs, -D.hz + (k + 0.5) * vs).clone());
      const c = D.grid[cell] >= 0 ? _col.setHex(D.grid[cell]) : _col.setRGB(0.1, 0.08, 0.06);
      frag.emit(wp, rv(14).addScaledVector(s.vel, 0.7), 0.8 + Math.random() * 0.9,
        [c.r * 1.4, c.g * 1.4, c.b * 1.4, 1], [c.r * 0.5, c.g * 0.5, c.b * 0.5, 0]);
    }
  }
}

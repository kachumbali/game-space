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
const SIMF = { slew: 2.2, capital: 0.35, decel: 1.5 };      // SIM model: velocity-vector slew (rad per sim-second, fighters), capital-ship factor, braking vs accelerating
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

function log(text, color = '#8fffd0') { logs.push({ text, color, t: time }); if (logs.length > 6) logs.shift(); }

// ---- voxel mesh build ------------------------------------------------
function disposeVox(s) {
  const V = s.vox; if (!V) return;
  for (const m of [V.body, V.glow, V.patch]) { s.group.remove(m); m.dispose(); }
  s.vox = null;
}
function buildVox(s) {
  disposeVox(s);
  const di = Math.max(0, detailIdx - (s.lodDrop | 0));       // distance LOD lowers the detail step of far ships
  const D = voxelize(s.def, resFor(s.def, di), di);
  const cap = s.def.cls === 'fighter' ? (di >= 6 ? 20000 : 5000) : (di >= 6 ? 60000 : 30000);
  const bodyV = [], glowV = [];
  D.voxels.forEach((v, i) => (v.g ? glowV : bodyV).push(i));
  const body = new THREE.InstancedMesh(boxGeo(D.vs), voxMat, Math.max(1, bodyV.length));
  const glow = new THREE.InstancedMesh(boxGeo(D.vs * 1.03), glowMat, Math.max(1, glowV.length));
  const patch = new THREE.InstancedMesh(boxGeo(D.vs), voxMat, cap);
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
  fill(body, bodyV); fill(glow, glowV);
  patch.setColorAt(0, _col.setRGB(0, 0, 0)); patch.count = 0;
  for (const m of [body, glow, patch]) { m.frustumCulled = false; s.group.add(m); }
  s.vox = {
    data: D, cap, body, glow, patch, patchN: 0, instOf, patchOf: new Map(),
    solid: Uint8Array.from(D.grid, g => (g >= 0 ? 1 : 0)),
    hasInst: Uint8Array.from(D.cellToVox, v => (v >= 0 ? 1 : 0)),
    scorch: new Float32Array(D.voxels.length).fill(1),
  };
  for (const ev of s.dmgEvents) chip(s, ev.p, ev.r, ev.sr, true);
}

const _lv = new THREE.Vector3();
function chip(s, lp, r, sr, replay) {
  const V = s.vox, D = V.data, vs = D.vs, { nx, ny, nz } = D;
  if (!replay) { s.dmgEvents.push({ p: lp.clone(), r, sr }); if (s.dmgEvents.length > 250) s.dmgEvents.shift(); }
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
        if (r > 0 && d2 <= r * r) {
          V.solid[cell] = 0;
          if (V.hasInst[cell]) {
            V.hasInst[cell] = 0;
            const vi = D.cellToVox[cell];
            if (vi >= 0) (D.voxels[vi].g ? V.glow : V.body).setMatrixAt(V.instOf[vi], ZERO);
            else { const pi = V.patchOf.get(cell); if (pi !== undefined) V.patch.setMatrixAt(pi, ZERO); }
          }
          removed.push(cell); dirty = true;
        } else if (sr > 0 && d2 <= sr * sr && V.hasInst[cell]) {
          const vi = D.cellToVox[cell];
          if (vi >= 0) {
            const v = D.voxels[vi];
            const f = (v.g ? 0.15 : 0.28) + 0.72 * Math.sqrt(d2 / (sr * sr));
            if (f < V.scorch[vi]) {
              V.scorch[vi] = f;
              (v.g ? V.glow : V.body).setColorAt(V.instOf[vi], _col.setRGB(v.cr * f, v.cg * f, v.cb * f));
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
      _m.makeTranslation(-D.hx + (ni + 0.5) * vs, -D.hy + (nj + 0.5) * vs, -D.hz + (nk + 0.5) * vs);
      V.patch.setMatrixAt(idx, _m);
      const q = Math.random();
      if (q < 0.1) V.patch.setColorAt(idx, _col.setRGB(2.4, 0.75, 0.15));        // glowing ember
      else { const g = 0.03 + q * 0.06; V.patch.setColorAt(idx, _col.setRGB(g * 1.25, g, g * 0.8)); }
      V.hasInst[nc] = 1; V.patchOf.set(nc, idx);
      dirty = true;
    }
  }
  V.patch.count = V.patchN;
  if (dirty) {
    for (const m of [V.body, V.glow, V.patch]) {
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

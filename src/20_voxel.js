// ======================================================================
//  VOXELISER v2
//  prim types:  tap  tapered extrusion along Z (ax:'x' wing / 'y' fin: h=[chord,thickness], sweep = z shift per unit along), cross-section sh: r(ect) e(llipse) d(iamond) h(chamfered rect)
//               ell  ellipsoid            seg  tapered capsule between two points (horns, legs, barrels, spines)
//  common opts: rot[rx,ry,rz]  col2+mot (mottled skin)  rib[period,depth]  seam[sx,sz]  dots{col,p}  glow  noMirror
// ======================================================================
// ---- detail-prim kit (shared by 30/31 ship files). Pass {lod:2} (or 3) in opts so the prim is only built at high detail.
//   ringSegs: n thin rods around a circle (nozzle petals, barrel shrouds, heat fins) along Z
//   rungs:    n thin boxes across (x0..x1) at evenly spaced z (ladders, vent slats, radiator ribs, armour plates)
//   paintGrid: lattice of painted squares (VLS cells, hatch arrays); paint prims are resolution-gated (need >= 1 voxel)
const ringSegs = (x, y, z0, z1, r, n, th, col, o = {}) => Array.from({ length: n }, (_, i) => {
  const a = i / n * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
  return seg([px, py, z0], [px, py, z1], th, th, col, o);
});
const rungs = (x, y, z0, z1, n, hx, hy, hzr, col, o = {}) => Array.from({ length: n }, (_, i) => tap([x, y, z0 + (z1 - z0) * (n > 1 ? i / (n - 1) : 0)], hzr, [hx, hy], [hx, hy], col, o));
const paintGrid = (x0, y, z0, nx, nz, dx, dz, sx, sz, col, o = {}) => {
  const out = [];
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) out.push({ t: 'paint', box: [x0 + a * dx, y - 0.6, z0 + b * dz, x0 + a * dx + sx, y + 0.6, z0 + b * dz + sz], col, side: 'top', ...o });
  return out;
};

const hash3 = (i, j, k) => (((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) >>> 0) % 1000 / 1000;
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(0, 0, 0), h(1, 0, 0), fx), l(h(0, 1, 0), h(1, 1, 0), fx), fy),
           l(l(h(0, 0, 1), h(1, 0, 1), fx), l(h(0, 1, 1), h(1, 1, 1), fx), fy), fz);
}

function prepPrim(p) {
  if (p._) return p._;
  const P = { rm: null };
  if (p.t === 'seg') {
    p.fy = p.fy ?? 1;
    const a = p.a, b = p.b;
    P.cx = (a[0] + b[0]) / 2; P.cy = (a[1] + b[1]) / 2; P.cz = (a[2] + b[2]) / 2;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    P.R = L / 2 + Math.max(p.ra, p.rb) * Math.max(1, p.fy) + 0.01;
    P.ax = b[0] - a[0]; P.ay = b[1] - a[1]; P.az = b[2] - a[2]; P.L2 = L * L || 1e-9;
  } else {
    P.cx = p.c[0]; P.cy = p.c[1]; P.cz = p.c[2];
    if (p.t === 'ell') P.R = Math.max(p.r[0], p.r[1], p.r[2]) + 0.01;
    else {
      const hx = Math.max(p.h0[0], p.h1[0]) + Math.abs(p.sweep || 0) * p.hz;
      const hy = Math.max(p.h0[1], p.h1[1]) + Math.abs(p.sweepY || 0) * p.hz;
      P.R = Math.sqrt(p.hz * p.hz + hx * hx + hy * hy) + 0.01;
    }
    const r = p.rot || (p.rz ? [0, 0, p.rz] : null);
    if (r) {
      const e = new THREE.Euler(r[0], r[1], r[2], 'XYZ');
      P.rm = new THREE.Matrix4().makeRotationFromEuler(e).invert().elements;
    }
  }
  P.R2 = P.R * P.R;
  // tight axis-aligned bounds (relative to the prim centre) so long thin prims do not scan a cube of side 2R
  let bx = P.R, by = P.R, bz = P.R;
  if (p.t === 'seg') {
    const rm = Math.max(p.ra, p.rb) + 0.01;
    bx = Math.abs(p.b[0] - p.a[0]) / 2 + rm; by = Math.abs(p.b[1] - p.a[1]) / 2 + rm * Math.max(1, p.fy); bz = Math.abs(p.b[2] - p.a[2]) / 2 + rm;
  } else if (!P.rm) {
    if (p.t === 'ell') { bx = p.r[0] + 0.01; by = p.r[1] + 0.01; bz = p.r[2] + 0.01; }
    else {
      const w1 = Math.max(p.h0[0], p.h1[0]) + Math.abs(p.sweep || 0) * p.hz + 0.01, w2 = Math.max(p.h0[1], p.h1[1]) + Math.abs(p.sweepY || 0) * p.hz + 0.01, al = p.hz + 0.01;
      if (p.ax === 'x') { bx = al; bz = w1; by = w2; } else if (p.ax === 'y') { by = al; bz = w1; bx = w2; } else { bz = al; bx = w1; by = w2; }
    }
  }
  P.bx = Math.min(bx, P.R); P.by = Math.min(by, P.R); P.bz = Math.min(bz, P.R);
  p._ = P;
  return P;
}

function primInside(p, x, y, z) {
  const P = p._;
  let dx = x - P.cx, dy = y - P.cy, dz = z - P.cz;
  if (dx * dx + dy * dy + dz * dz > P.R2) return false;
  if (p.t === 'seg') {
    const a = p.a;
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    let t = (px * P.ax + py * P.ay + pz * P.az) / P.L2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const r = p.ra + (p.rb - p.ra) * t;
    const ex = px - P.ax * t, ey = (py - P.ay * t) / p.fy, ez = pz - P.az * t;
    return ex * ex + ey * ey + ez * ez <= r * r;
  }
  if (P.rm) {
    const m = P.rm;
    const lx = m[0] * dx + m[4] * dy + m[8] * dz, ly = m[1] * dx + m[5] * dy + m[9] * dz, lz = m[2] * dx + m[6] * dy + m[10] * dz;
    dx = lx; dy = ly; dz = lz;
  }
  if (p.t === 'ell') {
    dx /= p.r[0]; dy /= p.r[1]; dz /= p.r[2];
    return dx * dx + dy * dy + dz * dz <= 1;
  }
  let al, w1, w2;                       // along-axis coord, cross-section coords
  if (p.ax === 'x') { al = dx; w1 = dz; w2 = dy; }          // wing: chord=z, thickness=y
  else if (p.ax === 'y') { al = dy; w1 = dz; w2 = dx; }     // fin: chord=z, thickness=x
  else { al = dz; w1 = dx; w2 = dy; }
  if (al < -p.hz || al > p.hz) return false;
  w1 -= p.sweep * al; w2 -= p.sweepY * al;
  const t = (al + p.hz) / (2 * p.hz);
  const hx = p.h0[0] + (p.h1[0] - p.h0[0]) * t, hy = p.h0[1] + (p.h1[1] - p.h0[1]) * t;
  const ax = Math.abs(w1) / hx, ay = Math.abs(w2) / hy;
  switch (p.sh) {
    case 'e': return ax * ax + ay * ay <= 1;
    case 'd': return ax + ay <= 1;
    case 'h': return ax <= 1 && ay <= 1 && ax + ay <= 1.45;
    default: return ax <= 1 && ay <= 1;
  }
}

const _col = new THREE.Color(), _col2 = new THREE.Color();
const voxCache = new Map();
const resFor = (def, idx) => Math.min(RES_CAP, Math.round(DETAIL_STEPS[idx] * Math.pow(Math.max(1, def.length / 12), 0.4) * (def.resMul || 1)));

// ======================================================================
//  SURFACE DETAIL (procedural, deterministic, resolution-gated; see docs/SHIP_MANUAL.md "Surface detail")
//  tier 0 = off (detail index <= 4: unchanged models, no extra cost)
//  tier 1 = detail index 5 (160): panel plating (seams, tint, accents), edge wear, soot, scratches, windows, paint/text decals
//  tier 2 = detail index 6 (224): + relief plating, recessed seams, greebles (blocks, vents, hatches, domes, tanks, antennas, spikes),
//           grooves/conduits/veins, contact shading, prims flagged lod:2
//  tier 3 = detail index 7 (288): + denser/smaller panels and greebles, trenches, prims flagged lod:3
//  Extra prim kinds in def.prims:  lod:n (any prim, only built at tier >= n);  win:{col,p} (lit windows on side faces);
//  noDetail:true (no greebles/relief on that prim);  {t:'paint',box,col,side,mix,glow};  {t:'text',c,face,text,px,col}
// ======================================================================
const detailTier = (res, def) => (res < 120 || def.noDetail) ? 0 : detailIdx >= 7 ? 3 : detailIdx >= 6 ? 2 : detailIdx >= 5 ? 1 : 0;
const ihash = (a, b, c, s) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) + Math.imul(s | 0, -2048144777)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const cmul = (c, f) => (Math.min(255, ((c >> 16) & 255) * f) << 16) | (Math.min(255, ((c >> 8) & 255) * f) << 8) | Math.min(255, (c & 255) * f);
const cmix = (a, b, t) => {
  const r = (a >> 16) & 255, g = (a >> 8) & 255, bl = a & 255;
  return (((r + (((b >> 16) & 255) - r) * t) | 0) << 16) | (((g + (((b >> 8) & 255) - g) * t) | 0) << 8) | ((bl + ((b & 255) - bl) * t) | 0);
};
const DSTYLE = {
  human: { dark: 0x1d2227, light: 0xdfe3e7, accent: [0xd9772b, 0x2f4a7a], glass: 0x2b4a63, lamp: 0xffc060, vent: 0x15181c, raise: 0.3, greeb: 1, scratch: 0xc0c6cc, pan: [11, 15, 22], human: true },
  frogg: { dark: 0x0f1415, light: 0x5d6b66, accent: [0x6b4a30, 0x35524b], glass: 0x7fd6c4, lamp: 0xff7a2a, lamp2: 0x9dff3a, vent: 0x0a0d0e, raise: 0.45, greeb: 1, scratch: 0x7d8a84, pan: [9, 13, 19], human: false },
};
const FONT = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
  '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', '-': '000000111000000', ' ': '000000000000000',
  A: '010101111101101', B: '110101110101110', C: '111100100100111', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '111100101101111',
  H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '111101101101101', O: '111101101101111',
  P: '111101111100100', R: '110101110101101', S: '111100111001111', T: '111010010010010', U: '101101101101111', V: '101101101101010', X: '101101010101101', Y: '101101010010010',
};
const FACE = { '+x': [0, 1], '-x': [1, 1], '+y': [2, 1], '-y': [3, 1], '+z': [4, 1], '-z': [5, 1] };
const TXF = { '+x': [[0, 0, -1], [0, 1, 0], [1, 0, 0]], '-x': [[0, 0, 1], [0, 1, 0], [-1, 0, 0]], '+y': [[1, 0, 0], [0, 0, -1], [0, 1, 0]], '-y': [[1, 0, 0], [0, 0, 1], [0, -1, 0]] };

function surfaceDetail(def, tier, G) {
  const { grid, pgrid, nx, ny, nz, vs, hx, hy, hz, prims, res, mir } = G;
  const N = grid.length, si = ny * nz, sj = nz;
  const st = { ...DSTYLE[def.fac === 'frogg' ? 'frogg' : 'human'], ...(def.detail || {}) };
  let S = 0; for (let q = 0; q < def.id.length; q++) S = (S * 31 + def.id.charCodeAt(q)) | 0;
  const U0 = Math.max(1, Math.pow(res / 190, 0.8)) * (tier >= 3 ? 0.85 : 1);
  const DP = prims.length;                                   // pseudo prim index for added voxels
  const xg = new Uint8Array(N), tn = new Uint8Array(N).fill(128), ng = new Int8Array(N), nn = new Uint8Array(N);
  const DX = [], DY = [], DZ = [], OFF = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) if (a || b || d) { DX.push(a); DY.push(b); DZ.push(d); OFF.push(a * si + b * sj + d); }
  const empty = (i, j, k) => i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz || grid[(i * ny + j) * nz + k] < 0;
  const solid = (i, j, k) => !empty(i, j, k);
  // ---- pass 0: surface cells, outward normals (26-neighbourhood gradient, snapped to an axis whose neighbour is empty)
  const surfL = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const cell = (i * ny + j) * nz + k;
    if (grid[cell] < 0) continue;
    const e0 = empty(i + 1, j, k), e1 = empty(i - 1, j, k), e2 = empty(i, j + 1, k), e3 = empty(i, j - 1, k), e4 = empty(i, j, k + 1), e5 = empty(i, j, k - 1);
    if (!(e0 || e1 || e2 || e3 || e4 || e5)) continue;
    let vx = 0, vy = 0, vz = 0, n26 = 0;
    for (let q = 0; q < 26; q++) { if (solid(i + DX[q], j + DY[q], k + DZ[q])) n26++; else { vx -= DX[q]; vy -= DY[q]; vz -= DZ[q]; } }
    const e6 = [e0, e1, e2, e3, e4, e5];
    const ax = [Math.abs(vx), Math.abs(vy), Math.abs(vz)], sg = [vx, vy, vz];
    let code = -1, best = -1;
    for (let a = 0; a < 3; a++) {
      const c = a * 2 + (sg[a] < 0 ? 1 : 0);
      if (ax[a] > best && e6[c]) { best = ax[a]; code = c; }
    }
    if (code < 0) code = e6.indexOf(true);
    ng[cell] = code + 1; nn[cell] = n26; surfL.push(cell);
  }
  const surf = Int32Array.from(surfL);
  // ---- exclusion zones (engine nozzles, muzzles, anything the ship lists as noDetail zones)
  const toV = (x, y, z) => [(x + hx) / vs - 0.5, (y + hy) / vs - 0.5, (z + hz) / vs - 0.5];
  const exz = [];
  for (const e of def.engines || []) { const c = toV(...e.pos); exz.push([c[0], c[1], c[2], Math.pow(Math.max(3, e.r * 1.6 / vs), 2)]); }
  for (const m of def.mounts || []) { const c = toV(...m.pos); exz.push([c[0], c[1], c[2], 25]); }
  for (const z of def.noDetailZones || []) { const c = toV(...z.c); exz.push([c[0], c[1], c[2], Math.pow(z.r / vs, 2)]); }
  const inEx = (i, j, k) => { for (const z of exz) { const dx = i - z[0], dy = j - z[1], dz = k - z[2]; if (dx * dx + dy * dy + dz * dz < z[3]) return true; } return false; };
  const eng = (def.engines || []).map(e => { const c = toV(e.pos[0], e.pos[1], e.pos[2] - e.r * 1.2); return [c[0], c[1], c[2], Math.max(4, e.r * 4.5 / vs)]; });
  const relOK = p => !p.glow && !p.dots && p.t !== 'seg' && !p.noDetail && !p.win;
  const greebOK = p => !p.glow && !p.dots && p.t !== 'seg' && !p.noDetail;
  const rm = st.raise * (res >= 380 ? 0.7 : 1);

  // placement frame (set per anchor)
  let ci = 0, cj = 0, ck = 0, Nx = 0, Ny = 0, Nz = 0, Ux = 0, Uy = 0, Uz = 0, Vx = 0, Vy = 0, Vz = 0, base = 0;
  const frame = (i, j, k, code) => {
    ci = i; cj = j; ck = k;
    const a = code >> 1, s = (code & 1) ? -1 : 1;
    Nx = Ny = Nz = Ux = Uy = Uz = Vx = Vy = Vz = 0;
    if (a === 0) { Nx = s; Uy = 1; Vz = 1; } else if (a === 1) { Ny = s; Uz = 1; Vx = 1; } else { Nz = s; Ux = 1; Vy = 1; }
  };
  const q = (a, b, h) => {
    const i = ci + Ux * a + Vx * b + Nx * h, j = cj + Uy * a + Vy * b + Ny * h, k = ck + Uz * a + Vz * b + Nz * h;
    return (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? -1 : (i * ny + j) * nz + k;
  };
  const put = (c, col, t, gl) => {
    if (c < 0 || grid[c] >= 0) return false;
    grid[c] = col; pgrid[c] = DP; tn[c] = t; xg[c] = gl || 0; return true;
  };
  const flat = (a0, b0, w, d, h) => {                          // footprint solid at h=0, free above
    for (let a = a0; a < a0 + w; a++) for (let b = b0; b < b0 + d; b++) {
      const c0 = q(a, b, 0); if (c0 < 0 || grid[c0] < 0 || !greebOK(prims[pgrid[c0]] || { noDetail: true })) return false;
      for (let t = 1; t <= h; t++) { const c1 = q(a, b, t); if (c1 < 0 || grid[c1] >= 0) return false; }
    }
    return true;
  };
  const baseCol = () => grid[(ci * ny + cj) * nz + ck];
  const walk = (i, j, k, code, dirU, len, fn) => {             // follow the hull surface along U (or V); fn(cellIndex, stepIdx) returns false to stop
    frame(i, j, k, code);
    let a = 0, b = 0, h = 0;
    for (let s = 0; s < len; s++) {
      if (dirU) a++; else b++;
      let c = q(a, b, h);
      if (c < 0) return;
      if (grid[c] >= 0) { const c2 = q(a, b, h + 1); if (c2 >= 0 && grid[c2] >= 0) { h++; c = c2; const c3 = q(a, b, h + 1); if (c3 < 0 || grid[c3] >= 0) return; } }
      else { h--; c = q(a, b, h); if (c < 0 || grid[c] < 0) return; }
      if (fn(c, s) === false) return;
    }
  };

  // ---- pass 1: panels, tint, seams, edge wear, soot, windows, relief plating
  const rasePlan = [];                                         // cells to raise (after the loop, so neighbours' flatness tests stay stable)
  const seamPlan = [];
  const PW = st.pan;
  for (let n = 0; n < surf.length; n++) {
    const cell = surf[n];
    const i = (cell / (ny * nz)) | 0, j = ((cell / nz) | 0) % ny, k = cell % nz;
    const code = ng[cell] - 1, a = code >> 1, sg = (code & 1);
    const p = prims[pgrid[cell]];
    let u, v;
    if (a === 0) { u = j; v = k; } else if (a === 1) { u = k; v = i; } else { u = i; v = j; }
    const rb = ihash(a, (u / 56) | 0, (v / 56) | 0, S);
    const pw = Math.max(5, Math.round(PW[(rb * 3) | 0] * U0));
    const ph = Math.max(4, Math.round(pw * (0.55 + 0.5 * ihash(a, (u / 56) | 0, (v / 56) | 0, S + 7))));
    const row = (v / ph) | 0, off = (ihash(a, row, sg, S + 1) * pw) | 0;
    const cu = ((u + off) / pw) | 0, ue = (u + off) % pw, ve = v % ph;
    const isSeam = ue === 0 || ve === 0;
    let col = grid[cell], t = 128;
    const pt = ihash(a * 2 + sg, cu, row, S + 2);
    t *= 0.9 + 0.2 * pt;
    if (pt > 0.965) col = cmix(col, st.accent[0], 0.5); else if (pt > 0.93) col = cmix(col, st.accent[1], 0.45);
    t *= 0.9 + 0.2 * vnoise(i * 0.07, j * 0.07, k * 0.07);                // slow dirt/shade variation
    const n26 = nn[cell];
    if (isSeam) t *= 0.6;
    else if (n26 <= 12) {                                                    // convex edge: highlight + wear
      t *= 1.12;
      if (ihash(i, j, k, S + 3) < 0.3) col = cmix(col, st.scratch, st.human ? 0.45 : 0.3);
    }
    // exhaust soot
    for (const e of eng) {
      const dx = i - e[0], dy = j - e[1], dz = k - e[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) / e[3];
      if (d < 1) { const s = (1 - d) * (1 - d); t *= 1 - 0.55 * s; col = cmix(col, st.human ? 0x2a211c : 0x3a2a1c, s * 0.5); }
    }
    // lit windows on flagged prims
    if (p.win && a !== 1 && !isSeam) {
      const w = p.win, pu = w.pu || 6, pv = w.pv || 5;
      if ((u % pu) < (w.wu || 3) && (v % pv) === (w.o || 0) && ihash((u / pu) | 0, (v / pv) | 0, a, S + 5) < (w.p ?? 0.7)) { col = w.col; xg[cell] = (w.f || 1.7) * 50; }
    }
    grid[cell] = col; tn[cell] = Math.min(255, t) | 0;
    if (!(xg[cell])) {
      if (tier >= 2 && p && !p.glow) {
        if (isSeam && n26 >= 15 && ihash(a, cu, row, S + 12) < 0.85) seamPlan.push(cell);
        else if (!isSeam && ue >= 2 && ve >= 2 && n26 >= 14 && relOK(p) && ihash(a * 2 + sg, cu, row, S + 4) < rm) rasePlan.push(cell);
      }
    }
  }
  // decals / paint (tier >= 1)
  const sideMatch = (side, c, flip) => {
    if (!side) return true;
    if (side === 'side') return c < 2;
    let sc = side === 'top' ? 2 : side === 'bottom' ? 3 : FACE[side][0];
    if (flip && sc < 2) sc ^= 1;
    return c === sc;
  };
  const vr = (lo, hi, n) => [Math.max(0, Math.floor(lo)), Math.min(n - 1, Math.ceil(hi))];
  for (const p of prims) {
    if (p.lod > tier) continue;
    if (p.t === 'paint') {
      for (const m of (mir && !p.noMirror ? [1, -1] : [1])) {
        const xa = p.box[0] * m, xb = p.box[3] * m;
        const [i0, i1] = vr((Math.min(xa, xb) + hx) / vs - 0.5, (Math.max(xa, xb) + hx) / vs - 0.5, nx);
        const [j0, j1] = vr((p.box[1] + hy) / vs - 0.5, (p.box[4] + hy) / vs - 0.5, ny);
        const [k0, k1] = vr((p.box[2] + hz) / vs - 0.5, (p.box[5] + hz) / vs - 0.5, nz);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
          const cell = (i * ny + j) * nz + k;
          if (grid[cell] < 0 || !ng[cell] || !sideMatch(p.side, ng[cell] - 1, m < 0)) continue;
          grid[cell] = cmix(grid[cell], p.col, p.mix ?? 0.92);
          if (p.glow) xg[cell] = p.glow * 50;
        }
      }
    } else if (p.t === 'text') {
      const px = p.px, vp = px / vs;
      if (vp < 0.9) continue;
      const F = TXF[p.face]; if (!F) continue;
      const txt = String(p.text).toUpperCase();
      const wTot = (txt.length * 4 - 1) * px;
      for (const m of (p.mir ?? (p.face[1] === 'x')) ? [1, -1] : [1]) {
        const face = m < 0 ? (p.face[0] === '+' ? '-' : '+') + p.face[1] : p.face;
        const R = m < 0 ? TXF[face][0] : F[0], Up = m < 0 ? TXF[face][1] : F[1], O = m < 0 ? TXF[face][2] : F[2];
        const cx = p.c[0] * (m < 0 ? -1 : 1);
        for (let ch = 0; ch < txt.length; ch++) {
          const gl = FONT[txt[ch]]; if (!gl) continue;
          for (let r = 0; r < 5; r++) for (let cc = 0; cc < 3; cc++) {
            if (gl[r * 3 + cc] !== '1') continue;
            const rr = -wTot / 2 + (ch * 4 + cc + 0.5) * px, uu = -(r - 2) * px;
            const pxm = cx + R[0] * rr + Up[0] * uu, pym = p.c[1] + R[1] * rr + Up[1] * uu, pzm = p.c[2] + R[2] * rr + Up[2] * uu;
            const c0 = toV(pxm, pym, pzm), hw = vp / 2;
            const ai = Math.abs(O[0]) ? 0 : Math.abs(O[1]) ? 1 : 2, sgn = O[ai];
            const lo = [c0[0] - (ai === 0 ? 0 : hw), c0[1] - (ai === 1 ? 0 : hw), c0[2] - (ai === 2 ? 0 : hw)];
            const hi = [c0[0] + (ai === 0 ? 0 : hw), c0[1] + (ai === 1 ? 0 : hw), c0[2] + (ai === 2 ? 0 : hw)];
            const rg = [0, 1, 2].map(d => {
              if (d === ai) return [Math.round(c0[d]), Math.round(c0[d])];
              const a0 = Math.ceil(lo[d] - 1e-6), a1 = Math.floor(hi[d] + 1e-6);
              return a1 < a0 ? [Math.round(c0[d]), Math.round(c0[d])] : [a0, a1];
            });
            for (let i = rg[0][0]; i <= rg[0][1]; i++) for (let j = rg[1][0]; j <= rg[1][1]; j++) for (let k = rg[2][0]; k <= rg[2][1]; k++) {
              // march inward along the face axis from 3 voxels outside to find the surface
              for (let s = 3; s >= -6; s--) {
                const ii = i + (ai === 0 ? sgn * s : 0), jj = j + (ai === 1 ? sgn * s : 0), kk = k + (ai === 2 ? sgn * s : 0);
                if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
                const cell = (ii * ny + jj) * nz + kk;
                if (grid[cell] >= 0) { if (!xg[cell]) { grid[cell] = cmix(grid[cell], p.col, p.mix ?? 0.95); tn[cell] = 140; } break; }
              }
            }
          }
        }
      }
    }
  }
  // scratches (colour only) along the surface
  const sc = tier >= 2 ? 0.0016 : 0.0009;
  for (let n = 0; n < surf.length; n++) {
    const cell = surf[n];
    if (ihash(cell, 1, 2, S + 30) >= sc) continue;
    const i = (cell / (ny * nz)) | 0, j = ((cell / nz) | 0) % ny, k = cell % nz;
    const len = 4 + ((ihash(cell, 3, 4, S + 31) * 9 * U0) | 0);
    walk(i, j, k, ng[cell] - 1, ihash(cell, 5, 6, S + 32) < 0.5, len, c => { if (!xg[c]) { grid[c] = cmix(grid[c], st.scratch, 0.4); tn[c] = Math.min(255, tn[c] * 1.18) | 0; } });
  }
  if (tier >= 2) {
    // recessed seams (real relief): only where at least 3 voxels of material are underneath
    for (const cell of seamPlan) {
      const i = (cell / (ny * nz)) | 0, j = ((cell / nz) | 0) % ny, k = cell % nz;
      frame(i, j, k, ng[cell] - 1);
      const f1 = q(0, 0, -1), f2 = q(0, 0, -2);
      if (f1 < 0 || f2 < 0 || grid[f1] < 0 || grid[f2] < 0) continue;
      grid[cell] = -1; pgrid[cell] = -1; tn[f1] = 62;
    }
    // raised plates
    for (const cell of rasePlan) {
      if (grid[cell] < 0) continue;
      const i = (cell / (ny * nz)) | 0, j = ((cell / nz) | 0) % ny, k = cell % nz;
      frame(i, j, k, ng[cell] - 1);
      const c1 = q(0, 0, 1); if (c1 < 0 || grid[c1] >= 0) continue;
      grid[c1] = grid[cell]; pgrid[c1] = pgrid[cell]; tn[c1] = Math.min(255, tn[cell] * 1.1) | 0; xg[c1] = 0;
    }
  }

  // ---- pass 2 (tier >= 2): greebles, grooves, conduits, veins
  if (tier >= 2) {
    const g3 = tier >= 3 ? 1.6 : 1;
    const pBase = (st.human ? 0.01 : 0.009) * (st.greeb || 1) * g3;
    const pPath = 0.0006 * g3 * (st.greeb || 1);
    const PB = Math.max(8, Math.round(16 * U0));
    const sz = (lo, hi, h) => Math.max(1, Math.round((lo + (hi - lo) * h) * Math.min(U0, 2)));
    for (let n = 0; n < surf.length; n++) {
      const cell = surf[n];
      if (grid[cell] < 0 || xg[cell]) continue;
      const p = prims[pgrid[cell]];
      if (!p || !greebOK(p)) continue;
      const i = (cell / (ny * nz)) | 0, j = ((cell / nz) | 0) % ny, k = cell % nz;
      const code = ng[cell] - 1, a = code >> 1;
      let u, v; if (a === 0) { u = j; v = k; } else if (a === 1) { u = k; v = i; } else { u = i; v = j; }
      const pf = ihash(a, (u / PB) | 0, (v / PB) | 0, S + 9);
      const dens = pf < 0.5 ? 0.12 : pf < 0.82 ? 1.5 : 4.2;
      const h0 = ihash(i, j, k, S + 10);
      if (h0 < pBase * dens) {
        if (inEx(i, j, k)) continue;
        const r = ihash(i, j, k, S + 11), r2 = ihash(i, j, k, S + 12), r3 = ihash(i, j, k, S + 13);
        frame(i, j, k, code);
        const bc = grid[cell];
        if (st.human) {
          if (r < 0.32) {                                                    // block stack
            const w = sz(2, 5, r2), d = sz(2, 5, r3), h = sz(1, 3, ihash(i, k, j, S + 14));
            const a0 = -(w >> 1), b0 = -(d >> 1);
            if (flat(a0, b0, w, d, h)) {
              const cc = cmul(bc, 0.85 + 0.35 * r2);
              for (let aa = a0; aa < a0 + w; aa++) for (let bb = b0; bb < b0 + d; bb++) for (let t = 1; t <= h; t++) put(q(aa, bb, t), cc, t === h ? 150 : 124);
              if (w > 2 && d > 2 && r3 > 0.5) put(q(0, 0, h + 1), cmul(bc, 1.1), 150);
            }
          } else if (r < 0.5) {                                              // vent (recessed slats)
            const w = sz(4, 7, r2), d = sz(3, 5, r3), a0 = -(w >> 1), b0 = -(d >> 1);
            if (flat(a0, b0, w, d, 0)) {
              for (let aa = a0; aa < a0 + w; aa++) for (let bb = b0; bb < b0 + d; bb++) {
                const c0 = q(aa, bb, 0), c1 = q(aa, bb, -1), c2 = q(aa, bb, -2);
                if (c1 < 0 || c2 < 0 || grid[c1] < 0 || grid[c2] < 0) continue;
                if ((bb - b0) % 2 === 0) { grid[c0] = -1; pgrid[c0] = -1; grid[c1] = st.vent; tn[c1] = 70; } else { grid[c0] = cmul(bc, 1.05); tn[c0] = 118; }
              }
            }
          } else if (r < 0.62) {                                             // hatch ring
            const s = sz(5, 8, r2) | 1, a0 = -(s >> 1), b0 = a0;
            if (flat(a0, b0, s, s, 1)) {
              for (let aa = a0; aa < a0 + s; aa++) for (let bb = b0; bb < b0 + s; bb++) {
                const edge = aa === a0 || aa === a0 + s - 1 || bb === b0 || bb === b0 + s - 1;
                const c0 = q(aa, bb, 0);
                if (edge) put(q(aa, bb, 1), cmul(bc, 1.2), 150); else { grid[c0] = cmul(bc, 0.55); tn[c0] = 100; }
              }
              if (r3 > 0.5) put(q(0, 0, 1), st.accent[0], 140);
            }
          } else if (r < 0.72) {                                             // sensor dome
            const rr = sz(2, 3, r2);
            if (flat(-rr, -rr, 2 * rr + 1, 2 * rr + 1, rr)) {
              for (let aa = -rr; aa <= rr; aa++) for (let bb = -rr; bb <= rr; bb++) {
                const hgt = Math.floor(Math.sqrt(Math.max(0, rr * rr + 0.5 - aa * aa - bb * bb)));
                for (let t = 1; t <= hgt; t++) if (aa * aa + bb * bb <= rr * rr) put(q(aa, bb, t), t === hgt && r3 > 0.6 ? st.glass : cmul(bc, 0.7), 132);
              }
            }
          } else if (r < 0.8) {                                              // tank / cylinder
            const rr = sz(1, 2, r2), h = sz(2, 4, r3);
            if (flat(-rr, -rr, 2 * rr + 1, 2 * rr + 1, h)) {
              for (let aa = -rr; aa <= rr; aa++) for (let bb = -rr; bb <= rr; bb++) if (aa * aa + bb * bb <= rr * rr + 1) for (let t = 1; t <= h; t++) put(q(aa, bb, t), t === h ? cmul(bc, 0.6) : cmul(bc, 0.95), t === h ? 100 : 128);
            }
          } else if (r < 0.87) {                                             // antenna mast
            const L = sz(5, 14, r2);
            if (flat(0, 0, 1, 1, L)) {
              for (let t = 1; t <= L; t++) put(q(0, 0, t), st.dark, 120);
              put(q(0, 0, L + 1), r3 < 0.5 ? 0xff3030 : 0xfff0d0, 100, 110);
            }
          } else if (r < 0.93) {                                             // light row
            const L = 3 + ((r2 * 3) | 0);
            for (let s = 0; s < L; s++) { const c0 = q(s * 3, 0, 0); if (c0 >= 0 && grid[c0] >= 0 && !xg[c0]) { const c1 = q(s * 3, 0, 1); put(c1, 0xffd890, 130, 90); } }
          } else {                                                           // accent plate
            const w = sz(5, 11, r2), d = sz(3, 7, r3), a0 = -(w >> 1), b0 = -(d >> 1);
            if (flat(a0, b0, w, d, 1)) {
              const cc = cmix(bc, st.accent[r3 > 0.5 ? 0 : 1], 0.7);
              for (let aa = a0; aa < a0 + w; aa++) for (let bb = b0; bb < b0 + d; bb++) put(q(aa, bb, 1), cc, 135);
            }
          }
        } else {
          // FROGG: armour scales, spikes, gill vents with glowing slits, knobs, glow veins
          if (r < 0.38) {                                                    // overlapping armour scale
            const w = sz(4, 9, r2), d = sz(3, 6, r3), h = sz(1, 2, ihash(i, k, j, S + 14)), a0 = -(w >> 1), b0 = -(d >> 1);
            if (flat(a0, b0, w, d, h)) {
              const cc = cmix(bc, st.light, 0.28 + 0.3 * r2);
              for (let aa = a0; aa < a0 + w; aa++) for (let bb = b0; bb < b0 + d; bb++) for (let t = 1; t <= h; t++) {
                const lead = bb === b0 || aa === a0 || aa === a0 + w - 1;
                put(q(aa, bb, t), lead ? cmul(cc, 0.6) : cc, lead ? 105 : 140);
              }
            }
          } else if (r < 0.43) {                                             // spike (only on dorsal / ventral faces: keeps silhouettes clean)
            if (a !== 1) continue;
            const L = sz(4, 9, r2), r0 = sz(1, 2, r3);
            if (flat(-r0, -r0, 2 * r0 + 1, 2 * r0 + 1, 1)) {
              for (let t = 1; t <= L; t++) {
                const rr = r0 * (1 - (t - 1) / L);
                const ri = Math.round(rr);
                for (let aa = -ri; aa <= ri; aa++) for (let bb = -ri; bb <= ri; bb++) if (aa * aa + bb * bb <= rr * rr + 0.6) put(q(aa, bb, t), cmul(cmix(bc, st.light, 0.2), 1 - 0.3 * t / L), 120);
              }
            }
          } else if (r < 0.6) {                                              // gill vent with glowing slits
            const w = sz(5, 8, r2), d = sz(4, 6, r3), a0 = -(w >> 1), b0 = -(d >> 1);
            if (flat(a0, b0, w, d, 0)) {
              const gc = r3 > 0.45 ? st.lamp : st.lamp2;
              for (let aa = a0; aa < a0 + w; aa++) for (let bb = b0; bb < b0 + d; bb++) {
                const c0 = q(aa, bb, 0), c1 = q(aa, bb, -1);
                if (c1 < 0 || grid[c1] < 0) continue;
                if ((bb - b0) % 2 === 0) { grid[c0] = -1; pgrid[c0] = -1; grid[c1] = gc; xg[c1] = 70; } else { grid[c0] = st.dark; tn[c0] = 90; }
              }
            }
          } else if (r < 0.7) {                                              // knob cluster
            const rr = sz(1, 2, r2);
            if (flat(-rr, -rr, 2 * rr + 1, 2 * rr + 1, rr + 1)) {
              for (let aa = -rr; aa <= rr; aa++) for (let bb = -rr; bb <= rr; bb++) {
                const hgt = Math.floor(Math.sqrt(Math.max(0, rr * rr + 0.8 - aa * aa - bb * bb)));
                for (let t = 1; t <= hgt; t++) put(q(aa, bb, t), cmix(bc, st.light, 0.2), 130);
              }
              if (r3 > 0.9) put(q(0, 0, rr + 1), st.glass, 120, 60);
            }
          } else if (r < 0.93) {                                             // raised ridge crest
            const L = sz(8, 22, r2);
            const dirU = r3 < 0.5;
            frame(i, j, k, code);
            for (let s = 1; s <= L; s++) {
              const c0 = dirU ? q(s, 0, 0) : q(0, s, 0), c1 = dirU ? q(s, 0, 1) : q(0, s, 1);
              if (c0 < 0 || grid[c0] < 0 || c1 < 0) break;
              put(c1, cmul(cmix(bc, st.light, 0.25), s % 4 === 0 ? 0.7 : 1), 135);
              if (s % 5 === 2) put(dirU ? q(s, 0, 2) : q(0, s, 2), cmix(bc, st.light, 0.35), 150);
            }
          } else {                                                           // small sensor pearl (rare)
            if (r2 > 0.6 && flat(0, 0, 1, 1, 1)) { put(q(0, 0, 1), st.glass, 120, 70); }
          }
        }
      }
      // grooves / conduits / veins
      if (ihash(i, j, k, S + 20) < pPath * dens) {
        if (inEx(i, j, k)) continue;
        const r = ihash(i, j, k, S + 21), r2 = ihash(i, j, k, S + 22);
        const len = Math.round((10 + r2 * 30) * U0), dirU = r < 0.5;
        const kind = st.human ? (r2 < 0.4 ? 0 : r2 < 0.8 ? 1 : 2) : (r2 < 0.5 ? 0 : 3);       // 0 groove, 1 conduit, 2 twin conduit, 3 glow vein groove
        const bc = grid[cell];
        const veinCol = ihash(i, j, k, S + 23) < 0.6 ? st.lamp : st.lamp2;
        const wide = tier >= 3 && kind === 0 && res >= 250 ? 1 : 0;
        walk(i, j, k, code, dirU, len, (c, s) => {
          const ci2 = (c / (ny * nz)) | 0, cj2 = ((c / nz) | 0) % ny, ck2 = c % nz;
          if (inEx(ci2, cj2, ck2) || xg[c]) return false;
          if (kind === 0 || kind === 3) {
            for (let w = -wide; w <= wide; w++) {
              // lateral offset w applied in the frame's other axis
              const o = (dirU ? Vx * w : Ux * w) * si + (dirU ? Vy * w : Uy * w) * sj + (dirU ? Vz * w : Uz * w);
              const cc = c + o;
              if (cc < 0 || cc >= N || grid[cc] < 0) continue;
              const d1 = cc - (Nx * si + Ny * sj + Nz), d2 = cc - 2 * (Nx * si + Ny * sj + Nz);
              if (d1 < 0 || d2 < 0 || grid[d1] < 0 || grid[d2] < 0) continue;
              grid[cc] = -1; pgrid[cc] = -1;
              if (kind === 3 && (s % 6) < 4) { grid[d1] = veinCol; xg[d1] = 75; } else { tn[d1] = 58; }
            }
          } else {
            const up = c + (Nx * si + Ny * sj + Nz);
            if (up >= 0 && up < N && grid[up] < 0) { grid[up] = (s % 7 === 3) ? st.accent[0] : cmul(bc, 0.55); pgrid[up] = DP; tn[up] = 125; }
            if (kind === 2) {
              const o = (dirU ? Vx : Ux) * 2 * si + (dirU ? Vy : Uy) * 2 * sj + (dirU ? Vz : Uz) * 2;
              const u2 = up + o;
              if (u2 >= 0 && u2 < N && grid[u2] < 0 && grid[c + o] >= 0) { grid[u2] = cmul(bc, 0.5); pgrid[u2] = DP; tn[u2] = 120; }
            }
          }
        });
      }
    }
  }
  return { xg, tn };
}

function voxelize(def, res) {
  const tier = detailTier(res, def);
  const key = def.id + ':' + res + (tier ? ':t' + tier : '');
  if (voxCache.has(key)) return voxCache.get(key);
  const vs = def.length / res;
  const [hx, hy, hz] = def.half;
  const nx = Math.ceil(2 * hx / vs), ny = Math.ceil(2 * hy / vs), nz = Math.ceil(2 * hz / vs);
  const N = nx * ny * nz;
  const grid = new Int32Array(N).fill(-1);       // hex colour of the owning prim (>=0 means solid)
  const pgrid = new Int16Array(N).fill(-1);      // owning prim index
  const mir = !!def.mirror;
  const prims = def.prims;
  for (let pi = 0; pi < prims.length; pi++) {
    const p = prims[pi];
    if (p.t === 'paint' || p.t === 'text' || p.lod > tier) continue;
    const P = prepPrim(p);
    const spans = [[P.cx - P.bx, P.cx + P.bx]];
    if (mir && !p.noMirror) spans.push([-P.cx - P.bx, -P.cx + P.bx]);
    const j0 = Math.max(0, Math.floor((P.cy - P.by + hy) / vs)), j1 = Math.min(ny - 1, Math.ceil((P.cy + P.by + hy) / vs));
    const k0 = Math.max(0, Math.floor((P.cz - P.bz + hz) / vs)), k1 = Math.min(nz - 1, Math.ceil((P.cz + P.bz + hz) / vs));
    const done = new Set();
    for (const [xa, xb] of spans) {
      const i0 = Math.max(0, Math.floor((xa + hx) / vs)), i1 = Math.min(nx - 1, Math.ceil((xb + hx) / vs));
      for (let i = i0; i <= i1; i++) {
        if (done.has(i)) continue; done.add(i);
        const x = -hx + (i + 0.5) * vs, ax = mir && !p.noMirror ? Math.abs(x) : x;
        for (let j = j0; j <= j1; j++) {
          const y = -hy + (j + 0.5) * vs;
          for (let k = k0; k <= k1; k++) {
            const z = -hz + (k + 0.5) * vs;
            if (primInside(p, ax, y, z)) { const c = (i * ny + j) * nz + k; grid[c] = p.col; pgrid[c] = pi; }
          }
        }
      }
    }
  }
  const X = tier ? surfaceDetail(def, tier, { grid, pgrid, nx, ny, nz, vs, hx, hy, hz, prims, res, mir }) : null;
  const xg = X && X.xg, tn = X && X.tn;
  const DPRIM = { col: 0 };
  const si = ny * nz, sj = nz;
  const OFF26 = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) if (a || b || d) OFF26.push(a * si + b * sj + d);
  const O6 = [si, -si, sj, -sj, 1, -1];
  const filled = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && grid[(i * ny + j) * nz + k] >= 0;
  const voxels = [];
  const cellToVox = new Int32Array(N).fill(-1);
  const mf = 1.6 / Math.max(0.5, def.length / 12 * 0.18 + 0.82);    // mottle frequency (per metre), a bit lower on big ships
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const cell = (i * ny + j) * nz + k;
    const c = grid[cell];
    if (c < 0) continue;
    const inner = i > 2 && j > 2 && k > 2 && i < nx - 3 && j < ny - 3 && k < nz - 3;
    let n26 = 0;
    if (inner) {
      if (grid[cell + si] >= 0 && grid[cell - si] >= 0 && grid[cell + sj] >= 0 && grid[cell - sj] >= 0 && grid[cell + 1] >= 0 && grid[cell - 1] >= 0) continue;
      for (let o = 0; o < 26; o++) if (grid[cell + OFF26[o]] >= 0) n26++;
    } else {
      if (filled(i + 1, j, k) && filled(i - 1, j, k) && filled(i, j + 1, k) &&
          filled(i, j - 1, k) && filled(i, j, k + 1) && filled(i, j, k - 1)) continue;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++)
        if ((a || b || d) && filled(i + a, j + b, k + d)) n26++;
    }
    const pi = pgrid[cell];
    const p = pi >= prims.length || pi < 0 ? DPRIM : prims[pi];
    const x = -hx + (i + 0.5) * vs, y = -hy + (j + 0.5) * vs, z = -hz + (k + 0.5) * vs;
    const ax = mir ? Math.abs(x) : x;
    const xgv = xg ? xg[cell] : 0;
    const glow = !!p.glow || xgv > 0;
    _col.setHex(c);
    let f = 1, stf = 1;
    if (!glow) {
      if (p.col2 !== undefined) {
        const n = vnoise(ax * mf * (p.mot || 1), y * mf * (p.mot || 1), z * mf * (p.mot || 1)) * 0.65 +
                  vnoise(ax * mf * 3.1, y * mf * 3.1, z * mf * 3.1) * 0.35;
        if (n > 0.52) _col.lerp(_col2.setHex(p.col2), Math.min(1, (n - 0.52) * 7));
      }
      // streak: rust runs along the hull (noise stretched along z); strata: stacked-plate banding (y + slope*z)
      if (p.streak && p.rust !== undefined) {
        const n = vnoise(ax * mf * 2.2, y * mf * 2.2, z * mf * 0.28 * p.streak);
        if (n > 0.6) _col.lerp(_col2.setHex(p.rust), Math.min(0.6, (n - 0.6) * 3) * (def.rustK ?? 1));
      }
      if (p.strata && p.rust !== undefined) {
        const ph = (((y + z * (p.strata[1] || 0)) / p.strata[0]) % 1 + 1) % 1;
        if (ph < 0.22) { _col.lerp(_col2.setHex(p.edge ?? p.rust ?? c), 0.28); stf = 1.12; }
        else if (ph < 0.34) stf = 0.62;
      }
      let ao = Math.max(0.42, Math.min(1.15, 1.25 - (n26 - 8) * 0.035));
      if (tier >= 2 && inner) {                                                  // contact shading: narrow gaps and walls just beyond the neighbour
        let occ = 0;
        for (let o = 0; o < 6; o++) {
          const d = O6[o];
          if (grid[cell + d] < 0) { if (grid[cell + 2 * d] >= 0) occ += 1; else if (grid[cell + 3 * d] >= 0) occ += 0.5; }
        }
        ao *= Math.max(0.55, 1 - 0.09 * occ);
      }
      const h = hash3(i, j, k);
      let seam = 1;
      const sm = tier ? null : (p.seam || def.seam);
      if (sm) {
        const gx = Math.floor((ax + 50) / sm[0]), gz = Math.floor((z + 50) / sm[1]);
        const ex = (ax + 50) / sm[0] - gx, ez = (z + 50) / sm[1] - gz;
        if (ex < vs / sm[0] * 0.9 || ez < vs / sm[1] * 0.9) seam = 0.72;
        else seam = ((gx + gz) & 1) ? 0.95 : 1.03;
      }
      let rib = 1;
      if (p.rib) { const ph = ((z / p.rib[0]) % 1 + 1) % 1; rib = ph < 0.34 ? 1 - p.rib[1] : 1 + p.rib[1] * 0.3; }
      if (tier) stf = 1 + (stf - 1) * 0.5;                                      // plating supplies the structure at high detail
      f = ao * (0.94 + 0.12 * h) * seam * rib * stf;
      if (tn) f *= tn[cell] / 128;
      if (p.dots && (tier ? (i % 3 === 0 && k % 4 === 0 && hash3(i * 7, j * 3, k * 5) < Math.min(1, p.dots.p * 4)) : hash3(i * 7, j * 3, k * 5) < p.dots.p)) {
        _col.setHex(p.dots.col); f = p.dots.f || 2.2;
        const vi = voxels.length;
        cellToVox[cell] = vi;
        voxels.push({ x, y, z, g: true, cr: _col.r * f, cg: _col.g * f, cb: _col.b * f, cell });
        continue;
      }
    } else f = xgv > 0 ? xgv / 50 : (p.glowF || 1.8);
    cellToVox[cell] = voxels.length;
    voxels.push({ x, y, z, g: glow, cr: _col.r * f, cg: _col.g * f, cb: _col.b * f, cell });
  }
  const out = { vs, voxels, nx, ny, nz, hx, hy, hz, grid, cellToVox, tier };
  voxCache.set(key, out);
  return out;
}

const boxGeoCache = new Map();
const boxGeo = s => {
  const k = s.toFixed(5);
  if (!boxGeoCache.has(k)) boxGeoCache.set(k, new THREE.BoxGeometry(s, s, s));
  return boxGeoCache.get(k);
};
const voxMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 });
const glowMat = new THREE.MeshBasicMaterial();
const _m = new THREE.Matrix4();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

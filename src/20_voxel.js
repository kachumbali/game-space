// ======================================================================
//  VOXELISER v2
//  prim types:  tap  tapered extrusion along Z (ax:'x' wing / 'y' fin: h=[chord,thickness], sweep = z shift per unit along), cross-section sh: r(ect) e(llipse) d(iamond) h(chamfered rect)
//               ell  ellipsoid            seg  tapered capsule between two points (horns, legs, barrels, spines)
//  common opts: rot[rx,ry,rz]  col2+mot (mottled skin)  rib[period,depth]  seam[sx,sz]  dots{col,p}  glow  noMirror
// ======================================================================
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
const resFor = (def, idx) => Math.round(DETAIL_STEPS[idx] * Math.pow(Math.max(1, def.length / 12), 0.4) * (def.resMul || 1));

function voxelize(def, res) {
  const key = def.id + ':' + res;
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
    const p = prims[pi], P = prepPrim(p);
    const spans = [[P.cx - P.R, P.cx + P.R]];
    if (mir && !p.noMirror) spans.push([-P.cx - P.R, -P.cx + P.R]);
    const j0 = Math.max(0, Math.floor((P.cy - P.R + hy) / vs)), j1 = Math.min(ny - 1, Math.ceil((P.cy + P.R + hy) / vs));
    const k0 = Math.max(0, Math.floor((P.cz - P.R + hz) / vs)), k1 = Math.min(nz - 1, Math.ceil((P.cz + P.R + hz) / vs));
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
  const filled = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && grid[(i * ny + j) * nz + k] >= 0;
  const voxels = [];
  const cellToVox = new Int32Array(N).fill(-1);
  const mf = 1.6 / Math.max(0.5, def.length / 12 * 0.18 + 0.82);    // mottle frequency (per metre), a bit lower on big ships
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const cell = (i * ny + j) * nz + k;
    const c = grid[cell];
    if (c < 0) continue;
    if (filled(i + 1, j, k) && filled(i - 1, j, k) && filled(i, j + 1, k) &&
        filled(i, j - 1, k) && filled(i, j, k + 1) && filled(i, j, k - 1)) continue;
    let n26 = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++)
      if ((a || b || d) && filled(i + a, j + b, k + d)) n26++;
    const p = prims[pgrid[cell]];
    const x = -hx + (i + 0.5) * vs, y = -hy + (j + 0.5) * vs, z = -hz + (k + 0.5) * vs;
    const ax = mir ? Math.abs(x) : x;
    const glow = !!p.glow;
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
        if (n > 0.6) _col.lerp(_col2.setHex(p.rust), Math.min(0.6, (n - 0.6) * 3));
      }
      if (p.strata && p.rust !== undefined) {
        const ph = (((y + z * (p.strata[1] || 0)) / p.strata[0]) % 1 + 1) % 1;
        if (ph < 0.22) { _col.lerp(_col2.setHex(p.rust ?? c), 0.28); stf = 1.12; }
        else if (ph < 0.34) stf = 0.62;
      }
      const ao = Math.max(0.42, Math.min(1.15, 1.25 - (n26 - 8) * 0.035));
      const h = hash3(i, j, k);
      let seam = 1;
      const sm = p.seam || def.seam;
      if (sm) {
        const gx = Math.floor((ax + 50) / sm[0]), gz = Math.floor((z + 50) / sm[1]);
        const ex = (ax + 50) / sm[0] - gx, ez = (z + 50) / sm[1] - gz;
        if (ex < vs / sm[0] * 0.9 || ez < vs / sm[1] * 0.9) seam = 0.72;
        else seam = ((gx + gz) & 1) ? 0.95 : 1.03;
      }
      let rib = 1;
      if (p.rib) { const ph = ((z / p.rib[0]) % 1 + 1) % 1; rib = ph < 0.34 ? 1 - p.rib[1] : 1 + p.rib[1] * 0.3; }
      f = ao * (0.94 + 0.12 * h) * seam * rib * stf;
      if (p.dots && hash3(i * 7, j * 3, k * 5) < p.dots.p) {
        _col.setHex(p.dots.col); f = p.dots.f || 2.2;
        const vi = voxels.length;
        cellToVox[cell] = vi;
        voxels.push({ x, y, z, g: true, cr: _col.r * f, cg: _col.g * f, cb: _col.b * f, cell });
        continue;
      }
    } else f = p.glowF || 1.8;
    cellToVox[cell] = voxels.length;
    voxels.push({ x, y, z, g: glow, cr: _col.r * f, cg: _col.g * f, cb: _col.b * f, cell });
  }
  const out = { vs, voxels, nx, ny, nz, hx, hy, hz, grid, cellToVox };
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

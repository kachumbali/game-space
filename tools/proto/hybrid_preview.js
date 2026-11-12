// Preview only: render a ship's authored prims as real meshes; optionally voxelise the small prims at a fine grid.
// args: [mode ('mesh' | 'hybrid'), thinFactor (prim counts as small if its thinnest half-extent < thinFactor * fine voxel), fineMul]
([mode, thinK, fineMul]) => {
  const g = __game, T = g.THREE, e = window.__e, def = e.def;
  const prims = def.prims.filter(p => p.t === 'tap' || p.t === 'ell' || p.t === 'seg');
  const mir = !!def.mirror;
  const baseRes = g.resFor(def, 2);                       // tablet detail step
  const fvs = def.length / (baseRes * fineMul);           // fine voxel size
  const thin = p => {
    if (p.t === 'seg') return Math.max(p.ra, p.rb);
    if (p.t === 'ell') return Math.min(p.r[0], p.r[1], p.r[2]);
    return Math.min(Math.max(p.h0[0], p.h1[0]), Math.max(p.h0[1], p.h1[1]), p.hz);
  };
  const small = p => mode === 'hybrid' && thin(p) < thinK * fvs;
  // ---------- triangle soup builders (world coords, then mirrored copies) ----------
  const flatP = [], flatC = [], smP = [], smC = [], glP = [], glC = [];
  const col = new T.Color();
  const addTri = (P, C, a, b, c, rgb) => { P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) C.push(rgb[0], rgb[1], rgb[2]); };
  const rotOf = p => { const r = p.rot || (p.rz ? [0, 0, p.rz] : null); return r ? new T.Matrix4().makeRotationFromEuler(new T.Euler(r[0], r[1], r[2], 'XYZ')) : null; };
  const v3 = new T.Vector3();
  function emit(p, tris, smooth) {          // tris: array of [a,b,c] local->world already
    const glow = !!p.glow;
    col.setHex(p.col); const k = glow ? (p.glowF || 1.8) : 1;
    const rgb = [col.r * k, col.g * k, col.b * k];
    const [P, C] = glow ? [glP, glC] : smooth ? [smP, smC] : [flatP, flatC];
    const copies = mir && !p.noMirror ? [1, -1] : [1];
    for (const sx of copies) for (const [a, b, c] of tris) {
      const A = [a[0] * sx, a[1], a[2]], B = [b[0] * sx, b[1], b[2]], Cc = [c[0] * sx, c[1], c[2]];
      if (sx < 0) addTri(P, C, A, Cc, B, rgb); else addTri(P, C, A, B, Cc, rgb);
    }
  }
  // cross-section outline in (w1, w2) units for a tap shape
  const outline = sh => {
    if (sh === 'e') return Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return [Math.cos(a), Math.sin(a)]; });
    if (sh === 'd') return [[1, 0], [0, 1], [-1, 0], [0, -1]];
    if (sh === 'h') return [[1, 0.45], [0.45, 1], [-0.45, 1], [-1, 0.45], [-1, -0.45], [-0.45, -1], [0.45, -1], [1, -0.45]];
    return [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  };
  function tapTris(p) {
    const ring = outline(p.sh), R = rotOf(p), out = [];
    const pt = (al, u, v) => {        // al along axis, u/v unit outline coords
      const t = (al + p.hz) / (2 * p.hz);
      const hx = p.h0[0] + (p.h1[0] - p.h0[0]) * t, hy = p.h0[1] + (p.h1[1] - p.h0[1]) * t;
      const w1 = u * hx + (p.sweep || 0) * al, w2 = v * hy + (p.sweepY || 0) * al;
      let x, y, z;
      if (p.ax === 'x') { x = al; z = w1; y = w2; } else if (p.ax === 'y') { y = al; z = w1; x = w2; } else { z = al; x = w1; y = w2; }
      v3.set(x, y, z); if (R) v3.applyMatrix4(R);
      return [v3.x + p.c[0], v3.y + p.c[1], v3.z + p.c[2]];
    };
    const n = ring.length, F = ring.map(([u, v]) => pt(-p.hz, u, v)), B = ring.map(([u, v]) => pt(p.hz, u, v));
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; out.push([F[i], B[i], B[j]], [F[i], B[j], F[j]]); }
    const cf = pt(-p.hz, 0, 0), cb = pt(p.hz, 0, 0);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; out.push([cf, F[j], F[i]], [cb, B[i], B[j]]); }
    return out;
  }
  function sphereTris(cx, cy, cz, rx, ry, rz, R, seg = 14) {
    const out = [], rows = seg, cols = seg * 2;
    const P = (i, j) => { const th = i / rows * Math.PI, ph = j / cols * Math.PI * 2; v3.set(Math.sin(th) * Math.cos(ph) * rx, Math.cos(th) * ry, Math.sin(th) * Math.sin(ph) * rz); if (R) v3.applyMatrix4(R); return [v3.x + cx, v3.y + cy, v3.z + cz]; };
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); out.push([a, c, b], [a, d, c]); }
    return out;
  }
  function segTris(p) {           // tapered capsule a->b with y scaled by fy
    const a = new T.Vector3(...p.a), b = new T.Vector3(...p.b), ax = b.clone().sub(a), L = ax.length(); ax.normalize();
    const up = Math.abs(ax.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0);
    const u = new T.Vector3().crossVectors(ax, up).normalize(), w = new T.Vector3().crossVectors(ax, u).normalize();
    const fy = p.fy ?? 1, out = [], cols = 14, rows = 10;
    // profile: hemisphere at a (radius ra), cone, hemisphere at b (radius rb)
    const prof = [];
    for (let i = 0; i <= rows; i++) { const th = Math.PI - i / rows * Math.PI / 2; prof.push([Math.cos(th) * p.ra, Math.sin(th) * p.ra]); }
    for (let i = 0; i <= rows; i++) { const th = Math.PI / 2 - i / rows * Math.PI / 2; prof.push([L + Math.cos(th) * p.rb, Math.sin(th) * p.rb]); }
    const P = (k, j) => { const [al, r] = prof[k], ph = j / cols * Math.PI * 2; const o = u.clone().multiplyScalar(Math.cos(ph) * r).addScaledVector(w, Math.sin(ph) * r); o.y *= fy; const q = a.clone().addScaledVector(ax, al).add(o); return [q.x, q.y, q.z]; };
    for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < cols; j++) { const p0 = P(k, j), p1 = P(k + 1, j), p2 = P(k + 1, j + 1), p3 = P(k, j + 1); out.push([p0, p1, p2], [p0, p2, p3]); }
    return out;
  }
  const smallPrims = [];
  for (const p of prims) {
    g.prepPrim(p);
    if (small(p)) { smallPrims.push(p); continue; }
    if (p.t === 'tap') emit(p, tapTris(p), p.sh === 'e');
    else if (p.t === 'ell') emit(p, sphereTris(p.c[0], p.c[1], p.c[2], p.r[0], p.r[1], p.r[2], rotOf(p)), true);
    else emit(p, segTris(p), true);
  }
  // ---------- fine voxels for the small prims: sparse cells, faces toward empty fine cells ----------
  let vox = 0, vP = [], vC = [];
  if (smallPrims.length) {
    const D = g.voxelize(def, baseRes * fineMul, 2);   // fine grid of the whole ship (prototype; the real version would be sparse)
    const big = prims.filter(p => !small(p));
    const { nx, ny, nz, grid, hx, hy, hz, vs } = D;
    const isSmallCell = new Uint8Array(nx * ny * nz);
    const smallSet = new Set(smallPrims);
    // cells owned by a small prim and not inside any big prim
    for (const p of smallPrims) {
      const P = p._, spans = [[P.cx - P.bx, P.cx + P.bx]]; if (mir && !p.noMirror) spans.push([-P.cx - P.bx, -P.cx + P.bx]);
      for (const [xa, xb] of spans) for (let i = Math.max(0, Math.floor((xa + hx) / vs)); i <= Math.min(nx - 1, Math.ceil((xb + hx) / vs)); i++)
        for (let j = Math.max(0, Math.floor((P.cy - P.by + hy) / vs)); j <= Math.min(ny - 1, Math.ceil((P.cy + P.by + hy) / vs)); j++)
          for (let k = Math.max(0, Math.floor((P.cz - P.bz + hz) / vs)); k <= Math.min(nz - 1, Math.ceil((P.cz + P.bz + hz) / vs)); k++) {
            const x = -hx + (i + 0.5) * vs, y = -hy + (j + 0.5) * vs, z = -hz + (k + 0.5) * vs, axx = mir && !p.noMirror ? Math.abs(x) : x;
            if (!g.primInside(p, axx, y, z)) continue;
            let hidden = false;
            for (const q of big) { const ax2 = mir && !q.noMirror ? Math.abs(x) : x; if (g.primInside(q, ax2, y, z)) { hidden = true; break; } }
            if (!hidden) isSmallCell[(i * ny + j) * nz + k] = 1;
          }
    }
    const N6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (let c = 0; c < isSmallCell.length; c++) {
      if (!isSmallCell[c]) continue;
      const i = (c / (ny * nz)) | 0, j = ((c / nz) | 0) % ny, k = c % nz;
      const vi = D.cellToVox[c]; col.setHex(grid[c]); let r = col.r, gg = col.g, b = col.b;
      if (vi >= 0) { const v = D.voxels[vi]; r = v.cr; gg = v.cg; b = v.cb; }
      vox++;
      for (const [a, bb, d] of N6) {
        const ii = i + a, jj = j + bb, kk = k + d;
        if (ii >= 0 && jj >= 0 && kk >= 0 && ii < nx && jj < ny && kk < nz && grid[(ii * ny + jj) * nz + kk] >= 0) continue;   // neighbour solid (small or big)
        const x0 = -hx + i * vs, y0 = -hy + j * vs, z0 = -hz + k * vs;
        const ax = N6.findIndex(n => n[0] === a && n[1] === bb && n[2] === d) >> 1, s = (a + bb + d) > 0 ? 1 : 0;
        const U = (ax + 1) % 3, W = (ax + 2) % 3;
        const corner = (uu, ww) => { const q = [x0, y0, z0]; q[ax] += s * vs; q[U] += uu * vs; q[W] += ww * vs; return q; };
        let A = corner(0, 0), B = corner(1, 0), C = corner(1, 1), Dd = corner(0, 1);
        if (!s) [B, Dd] = [Dd, B];
        vP.push(...A, ...B, ...C, ...A, ...C, ...Dd); for (let t = 0; t < 6; t++) vC.push(r, gg, b);
      }
    }
  }
  // ---------- assemble ----------
  const grp = new T.Group();
  const mk = (P, C, mat) => { if (!P.length) return 0; const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 3)); geo.computeVertexNormals(); const m = new T.Mesh(geo, mat); m.frustumCulled = false; grp.add(m); return P.length / 9; };
  const tris = mk(flatP, flatC, new T.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22, vertexColors: true, flatShading: true }))
    + mk(smP, smC, new T.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22, vertexColors: true }))
    + mk(glP, glC, new T.MeshBasicMaterial({ vertexColors: true }))
    + mk(vP, vC, new T.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22, vertexColors: true, flatShading: true }));
  for (const o of [e.vox.body, e.vox.glow, e.vox.patch]) if (o) o.visible = false;
  if (window.__hyb) e.group.remove(window.__hyb);
  e.group.add(grp); window.__hyb = grp;
  return { tris: Math.round(tris), bigPrims: prims.length - smallPrims.length, smallPrims: smallPrims.length, fineVoxels: vox, fineVs: +fvs.toFixed(2) };
}

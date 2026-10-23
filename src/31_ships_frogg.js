// ======================================================================
//  FROGG fleet — organic bio-mech, sharp edges.
//  Visual language: wide diamond-section skull, bulging eye domes with glowing slits, fanged lip,
//  dorsal spine row, bat-web wings with bone spars, folded hind-leg engines, rust-red venom sacs,
//  v3 (2026-10-21, owner reference art docs/img/frogg_reference_art.jpg): graphite carapace, open toothed maw, rib arches with
//  cyan light seams, dorsal spike rows, cyan drive plumes; weapons stay venom-green (acid). Built by fRef (always on) + fDetail (detail 6/7).
// ======================================================================
const F = {
  skin: 0x5a4830, skin2: 0x5c6a38, olive: 0x6b5c3a, olive2: 0x7d6a3c, plate: 0x3b2b1c, plate2: 0x54402a,
  belly: 0xb09a60, belly2: 0x8a6a3a, bone: 0xd9cfa6, sac: 0x9a4a22, sac2: 0x6b2f18, eye: 0x39421f,
  eyeGlow: 0xc8ff2a, amber: 0xffa030, venom: 0x9dff3a, dark: 0x24190f,
};
const skinO = { col2: F.skin2, mot: 1 };
// kit parts (written for the +x side; the voxeliser mirrors them)
const fEye = (x, y, z, s = 1) => [
  ell([x, y, z], [0.55 * s, 0.45 * s, 0.7 * s], F.eye, { col2: F.skin, mot: 2 }),
  ell([x * 1.04, y + 0.1 * s, z - 0.42 * s], [0.34 * s, 0.1 * s, 0.26 * s], F.eyeGlow, { glow: true, rot: [0, 0.35, 0.45] }),
];
const fFangs = (z0, x0, n, len, r, y = -0.3) => Array.from({ length: n }, (_, i) => {
  const x = 0.15 + (x0 - 0.15) * (i / Math.max(1, n - 1)), z = z0 + (x / x0) ** 2 * 1.1;
  return seg([x, y, z], [x * 0.96, y - 0.1 * len, z - len * (0.8 + 0.4 * (i % 2))], r, 0.015, F.bone);
});
const fSpines = (z0, z1, n, yb, yt, r = 0.1) => Array.from({ length: n }, (_, i) => {
  const t = i / Math.max(1, n - 1), z = z0 + (z1 - z0) * t, h = yt * (1 - 0.55 * t);
  return seg([0, yb, z], [0, yb + h, z + 0.5 + h * 0.4], r * (1 - 0.3 * t), 0.015, F.plate2);
});
const fWing = (x0, x1, cz, ch0, ch1, th, sweep, y, col = F.plate, o = {}) => [
  tap([(x0 + x1) / 2, y, cz], (x1 - x0) / 2, [ch0, th], [ch1, th * 0.35], col, { ax: 'x', sweep, col2: F.plate2, mot: 1.5, ...o }),
  // bone leading-edge spar + web spars
  seg([x0, y, cz - ch0 * 0.9], [x1, y, cz + sweep * (x1 - (x0 + x1) / 2) - ch1 * 0.95 + 0.0], th * 1.2, th * 0.6, F.bone),
  seg([x0 + 0.3, y, cz + ch0 * 0.5], [x1 * 0.93, y, cz + sweep * (x1 * 0.93 - (x0 + x1) / 2) + ch1 * 0.6], th * 0.9, th * 0.4, F.plate2),
];
// hind leg engine: thigh out/back, shin back/in, foot nozzle with amber glow. returns prims + engine position
const fLeg = (hip, knee, ankle, r0, r1, rn, col = F.skin) => [
  seg(hip, knee, r0, r0 * 0.85, col, skinO),
  ell(knee, [r0 * 0.9, r0 * 0.9, r0 * 0.9], F.plate),
  seg(knee, ankle, r0 * 0.85, r1, col, skinO),
  tap([ankle[0], ankle[1], ankle[2] + rn * 0.7], rn * 0.8, [rn * 1.05, rn * 0.95], [rn * 1.35, rn * 1.2], F.plate, { sh: 'e' }),
  ell([ankle[0], ankle[1], ankle[2] + rn * 1.55], [rn * 1.0, rn * 0.9, rn * 0.28], 0x3ff0ff, { glow: true, glowF: 1.6 }),
  seg([ankle[0] + rn * 0.3, ankle[1] - rn * 0.5, ankle[2] + rn * 0.2], [ankle[0] + rn * 1.5, ankle[1] - rn * 0.9, ankle[2] + rn * 1.2], rn * 0.2, 0.015, F.bone),
];
const fHorn = (pts, rs, col = F.plate2) => chain(pts, rs, col);


// ---- v2 look (2026-10-21): dark lamellar plating, rust streaks, blunt pearl-eyed prows, trailing blades ----
const N = { dk: 0x23292d, dk2: 0x2f373c, mt: 0x59636a, ru: 0x3b454b, ru2: 0x7a8890, ed: 0x66747c, pr: 0x35e8ff, bl: 0x0d1012, hot: 0x3ff0ff, ven: 0x9dff3a, tooth: 0x6f7a80, cy: 0x25d8ff };   // graphite carapace, pale-steel edges, CYAN light (reference art); venom green stays for acid weapons
const nSt = (per, sl = 0.2) => ({ rust: N.ru, edge: N.ed, strata: [per, sl], streak: 1 });
// sensor cluster (flush dark plate with a few small pale lights); replaces the earlier large 'eye' discs
const nEye = () => [];   // owner 2026-10-21: frontal sensor blobs read as eyes; removed (the radar component stays as a data hit zone)
// swept flat blade
const nBlade = (a, b, r = 0.2, col = N.bl) => seg(a, b, r, 0.015, col, { fy: 0.38, rust: N.ru, streak: 1 });
// spike (round)
const nSpike = (a, b, r = 0.15, col = N.dk2) => seg(a, b, r, 0.012, col, { rust: N.ru, streak: 1 });
// pod with pearl lights
const nPod = (c, r, col = N.dk2, p = 0.2) => ell(c, r, col, { rust: N.ru, streak: 1, dots: { col: N.pr, p: p * 0.25, f: 1.0 } });
// prow lance: short armoured ram blade, +x side (mirrored), swept slightly outward then forward
const nMand = (x, y, z, L, r = 0.2) => chain([[x, y, z], [x + 0.1 * L, y - 0.02 * L, z - 0.3 * L], [x + 0.08 * L, y - 0.04 * L, z - 0.6 * L]], [r * 0.8, r * 0.5, 0.015], N.bl, { rust: N.ru, streak: 1 });
// ventral keel spike
const nKeel = (y, z0, z1, drop, r = 0.25) => seg([0, y, z0], [0, y - drop, z1], r, 0.015, N.bl, { rust: N.ru, streak: 1 });
// comb of fan blades (aft/ventral), +x side
const nComb = (x, y, z, n, L, spread) => Array.from({ length: n }, (_, i) => nBlade([x + i * 0.12 * L / n, y, z], [x + spread * (i + 1) / n * L, y - 0.35 * L, z + L * (0.5 + 0.1 * i)], 0.1 * L / 3));
// engine nacelle + glowing nozzle (x,y at nozzle; z0 = front of nacelle, z1 = nozzle plane)
const nNoz = (x, y, z0, z1, r) => [
  tap([x, y, (z0 + z1) / 2], (z1 - z0) / 2, [r * 0.8, r * 0.7], [r * 1.1, r * 1.0], N.dk, { sh: 'e', ...nSt(r * 0.5, 0) }),
  ell([x, y, z1 + r * 0.1], [r * 0.55, r * 0.5, r * 0.15], N.hot, { glow: true, glowF: 0.95 }),
  seg([x + r * 0.9, y, z1 - r * 1.6], [x + r * 1.5, y, z1 + r * 0.8], r * 0.12, 0.012, N.bl),
];

// ---- FROGG surface-detail kit (lod prims: built from detail index 6 / 7). Everything is generated from the main body ellipsoid
//   o.E = [cx,cy,cz,rx,ry,rz]: dorsal armour plates, flank gill vents with glowing slits, armour collars, ventral ribs, flank spikes;
//   o.noz [[x,y,z0,z1,r]] nacelle fins + bell lip + ember ring; o.blades [[a,b,r]] serrated trailing edges; o.guns [[x,y,z0,z1,r]] barrel shrouds
const nRust = { rust: N.ru, edge: N.ed, streak: 1 };
const FD_LIST = [];
const fDetail = o => {
  FD_LIST.push(o);
  const [cx, cy, cz, rx, ry, rz] = o.E, P = [];
  const sf = z => Math.sqrt(Math.max(0, 1 - ((z - cz) / rz) ** 2));
  const ep = (z, th, out = 1) => { const f = sf(z) * out; return [cx + rx * Math.sin(th) * f, cy + ry * Math.cos(th) * f, z]; };
  const n = o.plates ?? 6;
  for (let i = 0; i < n; i++) {                                           // overlapping dorsal armour plates, stepping down towards the tail
    const t = i / Math.max(1, n - 1), z = cz - rz * 0.52 + rz * 0.9 * t, p = ep(z, 0, 1.0), w = rx * (0.7 - 0.3 * t), th = ry * 0.12;
    P.push(tap([0, p[1] + th * 0.4, z], rz * 0.9 / n * 0.62, [w, th], [w * 0.8, th * 0.7], i % 2 ? N.dk2 : N.dk, { sh: 'h', rot: [-0.1, 0, 0], ...nRust, lod: 2 }));
  }
  for (const side of [1]) {                                               // flank gill vents: dark frame + glowing slit (mirrored by the voxeliser)
    const ng = o.gills ?? 4;
    for (let i = 0; i < ng; i++) {
      const z = cz - rz * 0.18 + i * rz * (0.5 / Math.max(1, ng - 1)), p = ep(z, 1.2, 1.0), gs = ry * 0.34 * (1 - 0.25 * i / ng);
      const gc = (i + (o.gc || 0)) % 3 === 1 ? N.ven : N.hot;
      P.push(ell([p[0], p[1], z], [gs * 0.4, gs * 1.0, gs * 0.34], N.bl, { lod: 2 }));
      P.push(ell([p[0] * 1.02, p[1], z], [gs * 0.34, gs * 0.8, gs * 0.12], gc, { glow: true, glowF: 1.15, lod: 2 }));
    }
  }
  if (o.disc) {                                                           // serrated rim spikes around the wing disc
    const [dx, dy, dz, drx, dry, drz] = o.disc, nr = o.rim ?? 12;
    for (let i = 0; i < nr; i++) {
      const a = -Math.PI * 0.5 + Math.PI * (i + 0.5) / nr, c = Math.cos(a), sn = Math.sin(a);
      const p = [dx + drx * c * 0.96, dy, dz + drz * sn * 0.96], L = drx * (0.08 + 0.05 * (sn > 0 ? 1 : 0.4));
      P.push(seg(p, [p[0] + c * L, dy - dry * 0.2, p[2] + sn * L * 1.3], Math.max(dry * 0.8, drx * 0.025), 0.01, i % 2 ? N.dk2 : N.bl, { ...nRust, lod: 2 }));
    }
  }
  const nc = o.collars ?? 4;
  for (let i = 0; i < nc; i++) {                                          // armour collars: raised bands around the hull
    const z = cz - rz * 0.35 + i * rz * (0.8 / Math.max(1, nc - 1)), f = sf(z);
    P.push(tap([cx, cy, z], rz * 0.022, [rx * f * 1.05, ry * f * 1.05], [rx * f * 1.05, ry * f * 1.05], i % 2 ? N.dk2 : N.dk, { sh: 'e', ...nRust, lod: 2 }));
  }
  for (let i = 0; i < (o.ribs ?? 5); i++) {                               // ventral ribs
    const z = cz - rz * 0.3 + i * rz * 0.14, p = ep(z, Math.PI, 1.0);
    P.push(tap([0, p[1] - ry * 0.03, z], rz * 0.02, [rx * 0.42, ry * 0.1], [rx * 0.42, ry * 0.1], N.bl, { sh: 'h', lod: 2 }));
  }
  for (let i = 0; i < (o.spikes ?? 4); i++) {                             // small flank spikes
    const z = cz - rz * 0.3 + i * rz * 0.2, th = 0.62, p = ep(z, th, 0.98), L = ry * 0.9 * (1 - 0.1 * i);
    P.push(seg(p, [p[0] + Math.sin(th) * L * 0.7, p[1] + Math.cos(th) * L * 0.8, z + L * 0.9], ry * 0.12, 0.012, N.dk2, { ...nRust, lod: 2 }));
  }
  for (const [a, b, r] of o.blades || []) {                               // serrated trailing edges
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    for (let i = 1; i <= 6; i++) {
      const t = 0.22 + 0.13 * i, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + r * 0.3];
      P.push(seg(q, [q[0] + (b[0] - a[0]) * 0.03, q[1], q[2] + L * 0.1], r * 0.5, 0.01, N.bl, { lod: 2 }));
    }
  }
  for (const [x, y, z0, z1, r] of o.noz || []) {
    P.push(...ringSegs(x, y, z0 + (z1 - z0) * 0.3, z1, r * 0.96, 10, r * 0.07, N.bl, { lod: 2 }));
    P.push(tap([x, y, z1 - r * 0.1], r * 0.1, [r * 1.18, r * 1.08], [r * 1.18, r * 1.08], N.dk2, { sh: 'e', lod: 2 }));
    P.push(...ringSegs(x, y, z1 + r * 0.02, z1 + r * 0.3, r * 0.74, 10, r * 0.05, N.hot, { glow: true, glowF: 1.2, lod: 3 }));
  }
  for (const [x, y, z0, z1, r] of o.guns || []) P.push(...ringSegs(x, y, z0, z1, r * 1.8, 6, r * 0.3, N.bl, { lod: 2 }));
  return P;
};

// ---- reference-art kit (always built, not detail-gated): open toothed maw at the bow, rib arches with cyan seams, dorsal spike row.
//   o = the same body descriptor as fDetail (E = main hull ellipsoid). Written for the +x side; the voxeliser mirrors.
const fRef = o => {
  const [cx, cy, cz, rx, ry, rz] = o.E, P = [], big = rz > 12, zn = cz - rz;
  const sf = z => Math.sqrt(Math.max(0, 1 - ((z - cz) / rz) ** 2));
  const ep = (z, th, out = 1) => { const f = sf(z) * out; return [cx + rx * Math.sin(th) * f, cy + ry * Math.cos(th) * f, z]; };
  const th = Math.max(ry * 0.06, rz * 0.011);                                   // minimum feature so seams survive coarse voxels
  // ---- maw: open upper + lower mandibles that protrude past the hull nose, rows of teeth, glowing throat
  const zj = zn - rz * 0.04;
  const up = [[rx * 0.55, ry * 0.95, zj + rz * 0.26], [rx * 0.48, ry * 0.8, zj - rz * 0.04], [rx * 0.22, ry * 0.25, zj - rz * 0.3]];
  const lo = [[rx * 0.55, -ry * 0.95, zj + rz * 0.28], [rx * 0.46, -ry * 0.82, zj - rz * 0.02], [rx * 0.2, -ry * 0.3, zj - rz * 0.25]];
  P.push(...chain(up, [ry * 0.3, ry * 0.26, ry * 0.05], N.dk2, { rust: N.ru, edge: N.ed, streak: 1 }), ...chain(lo, [ry * 0.3, ry * 0.26, ry * 0.05], N.dk, { rust: N.ru, edge: N.ed, streak: 1 }));
  const at = (pts, s) => { const k = s * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)), f = k - i; return pts[i].map((v, j) => v + (pts[i + 1][j] - v) * f); };
  const nT = big ? 7 : 4, tl = Math.max(ry * 0.85, rz * 0.06), tr = Math.max(ry * 0.13, th * 1.2);
  for (let i = 0; i < nT; i++) {
    const s = 0.1 + 0.85 * i / Math.max(1, nT - 1), L = tl * (1 - 0.3 * (i % 2)), u = at(up, s), l = at(lo, s);
    P.push(seg([u[0], u[1] - ry * 0.2, u[2]], [u[0] * 0.92, u[1] - ry * 0.2 - L, u[2] - L * 0.3], tr, 0.01, N.tooth));        // upper fangs point down
    P.push(seg([l[0], l[1] + ry * 0.2, l[2]], [l[0] * 0.92, l[1] + ry * 0.2 + L * 0.9, l[2] - L * 0.25], tr * 0.9, 0.01, N.tooth)); // lower fangs point up
  }
  P.push(ell([0, 0, zj + rz * 0.1], [rx * 0.32, ry * 0.5, rz * 0.04], N.cy, { glow: true, glowF: 1.3 }));
  // ---- rib arches over the hull with cyan seams between them
  const nr = o.refN ?? (big ? 7 : 4);
  for (let i = 0; i < nr; i++) {
    const z = cz - rz * 0.42 + i * rz * (0.95 / Math.max(1, nr - 1)), f = sf(z) * 1.07;
    const pts = [0.12, 0.7, 1.25, 1.85, 2.4].map(a => [cx + rx * Math.sin(a) * f, cy + ry * Math.cos(a) * f, z - 0.0 * a]);
    P.push(...chain(pts, [th * 2.0, th * 2.3, th * 2.3, th * 2.0, th * 1.6], i % 2 ? N.dk2 : N.mt, { rust: N.ru, edge: N.ed, streak: 1 }));
    if (i < nr - 1) {
      const z2 = z + rz * (0.95 / Math.max(1, nr - 1)), a = ep(z + (z2 - z) * 0.18, 1.0, 1.04), b = ep(z + (z2 - z) * 0.82, 1.0, 1.04);
      P.push(seg(a, b, th * 0.8, th * 0.8, N.cy, { glow: true, glowF: 1.25 }));
      const c = ep(z + (z2 - z) * 0.25, 1.65, 1.04), d = ep(z + (z2 - z) * 0.75, 1.65, 1.04);
      P.push(seg(c, d, th * 0.7, th * 0.7, N.cy, { glow: true, glowF: 1.1 }));
    }
  }
  // ---- dorsal glow line + spike row
  for (let i = 0; i < 3; i++) { const z = cz - rz * 0.3 + i * rz * 0.3; P.push(seg(ep(z, 0.05, 1.05), ep(z + rz * 0.2, 0.05, 1.05), th * 0.8, th * 0.8, N.cy, { glow: true, glowF: 1.2 })); }
  const ns = big ? 8 : 3;
  for (let i = 0; i < ns; i++) {
    const z = cz - rz * 0.5 + i * rz * (0.95 / Math.max(1, ns - 1)), p = ep(z, 0.08, 1.0), L = (ry * 1.0 + rz * 0.05) * (1 - 0.35 * i / ns);
    P.push(seg([p[0] * 0.2 + 0.0, p[1], z], [0, p[1] + L, z + L * 1.1], Math.max(ry * 0.09, th), 0.01, N.dk2, { rust: N.ru, streak: 1 }));
  }
  return P;
};

// ---- DARTER: light interceptor (9 m) ---------------------------------------
SHIPS.darter = {
  ...DB.ships.darter,
  prims: [
    ell([0, -0.05, 0.9], [2.3, 0.2, 2.4], N.dk, nSt(0.14)), ell([0, 0.18, 0.5], [1.5, 0.16, 2.8], N.dk2, nSt(0.14)),
    ...nMand(0.45, -0.1, -3.7, 1.5, 0.16), nKeel(-0.4, -0.8, 1.6, 0.9, 0.16),
    ell([0, 0, 0.5], [0.9, 0.58, 3.9], N.dk, nSt(0.2)),                                   // layered body
    ell([0, 0.34, 0.2], [0.62, 0.3, 2.6], N.dk2, nSt(0.16)),                               // upper plate
    ell([0, -0.05, -3.2], [0.78, 0.55, 1.05], N.dk, nSt(0.2)),                             // blunt prow
    ...nEye(0.46, 0.12, -3.95, 0.95),
    nPod([0.62, -0.32, -1.1], [0.32, 0.26, 0.65]),
    nSpike([0, 0.5, -0.6], [0, 1.1, 1.6], 0.14), nSpike([0, 0.45, 0.8], [0, 0.95, 3.0], 0.11),
    nBlade([0.55, 0.05, 0.8], [3.9, -0.05, 5.0], 0.22), nBlade([0.5, -0.2, 1.6], [2.6, -0.35, 5.2], 0.16),
    ...nNoz(1.0, -0.15, 3.4, 4.9, 0.3),
    seg([0.4, -0.3, -3.5], [0.4, -0.3, -4.9], 0.09, 0.06, N.bl),                           // mouth guns
    ...fDetail({ disc: [0, -0.05, 0.9, 2.3, 0.2, 2.4], E: [0, 0, 0.5, 0.9, 0.58, 3.9], plates: 5, gills: 3, collars: 3, ribs: 3, spikes: 3, noz: [[1.0, -0.15, 3.4, 4.9, 0.3]], blades: [[[0.55, 0.05, 0.8], [3.9, -0.05, 5.0], 0.22]], guns: [[0.4, -0.3, -3.6, -4.8, 0.09]] }),
  ],
};

// ---- LEAPER: line fighter (13 m) --------------------------------------------
SHIPS.leaper = {
  ...DB.ships.leaper,
  prims: [
    ell([0, -0.1, 1.2], [3.6, 0.26, 3.4], N.dk, nSt(0.2)), ell([0, 0.3, 0.8], [2.4, 0.2, 3.8], N.dk2, nSt(0.2)),
    ...nMand(0.7, -0.15, -5.0, 2.2, 0.24), nKeel(-0.6, -1.4, 2.4, 1.2, 0.22),
    ell([0, 0, 0.6], [1.35, 0.82, 5.2], N.dk, nSt(0.26)),
    ell([0, 0.5, 0.2], [0.95, 0.42, 3.6], N.dk2, nSt(0.22)),
    ell([0, 0.78, -0.2], [0.55, 0.22, 2.2], N.dk, nSt(0.18)),
    ell([0, -0.05, -4.3], [1.1, 0.72, 1.6], N.dk, nSt(0.24)),
    ...nEye(0.62, 0.16, -5.5, 1.3),
    nPod([0.9, -0.5, -1.8], [0.5, 0.4, 1.0]),
    nSpike([0, 0.8, -1.8], [0, 1.7, 1.2], 0.2), nSpike([0, 0.7, 0.2], [0, 1.45, 3.4], 0.16),
    nBlade([1.1, 0.1, 0.0], [6.1, -0.1, 5.8], 0.3), nBlade([1.0, -0.25, 1.2], [4.2, -0.4, 6.6], 0.22),
    nSpike([1.3, 0.55, -1.0], [3.2, 0.9, 1.8], 0.12),
    ...nNoz(2.2, -0.2, 4.6, 6.8, 0.5),
    seg([0.65, -0.42, -5.6], [0.65, -0.42, -6.6], 0.13, 0.09, N.bl),
    ...fDetail({ disc: [0, -0.1, 1.2, 3.6, 0.26, 3.4], E: [0, 0, 0.6, 1.35, 0.82, 5.2], plates: 6, gills: 4, collars: 4, noz: [[2.2, -0.2, 4.6, 6.8, 0.5]], blades: [[[1.1, 0.1, 0.0], [6.1, -0.1, 5.8], 0.3]], guns: [[0.65, -0.42, -5.6, -6.5, 0.13]] }),
  ],
};

// ---- SPITTER: gunship (16 m) — dorsal acid cannon ---------------------------
SHIPS.spitter = {
  ...DB.ships.spitter,
  prims: [
    ell([0, -0.2, 1.4], [4.6, 0.34, 4.4], N.dk, nSt(0.24)), ell([0, 0.5, 1.0], [3.2, 0.26, 4.8], N.dk2, nSt(0.24)),
    ...nMand(1.1, -0.25, -6.6, 2.8, 0.3), nKeel(-1.0, 0.0, 4.4, 1.5, 0.3),
    ell([0, 0, 0.8], [1.9, 1.05, 6.6], N.dk, nSt(0.3)),
    ell([0, 0.7, 0.4], [1.3, 0.6, 4.6], N.dk2, nSt(0.26)),
    ell([0, 0.05, -5.0], [1.6, 1.0, 2.2], N.dk, nSt(0.3)),
    ...nEye(0.95, 0.3, -7.0, 1.45),
    nPod([0, -1.5, -1.0], [1.9, 1.25, 2.6], N.dk2, 0.28),                                  // acid sac cluster
    nPod([1.9, -1.1, 1.2], [1.0, 0.8, 1.7], N.dk2, 0.24),
    seg([0, 1.35, -3.0], [0, 1.35, -8.8], 0.95, 0.55, N.dk, { rust: N.ru, streak: 1 }),       // dorsal acid cannon
    ell([0, 1.35, -8.9], [0.5, 0.5, 0.25], N.ven, { glow: true, glowF: 1.7 }),
    nSpike([0, 1.5, 0.0], [0, 2.8, 3.4], 0.25), nSpike([0, 1.2, 2.2], [0, 2.3, 5.6], 0.2),
    nBlade([1.9, 0.2, -0.2], [7.4, -0.1, 7.4], 0.38), nBlade([1.8, -0.4, 1.4], [5.2, -0.6, 8.6], 0.28),
    ...nNoz(2.8, -0.3, 6.2, 8.4, 0.72),
    seg([1.6, -0.5, -7.2], [1.6, -0.5, -8.0], 0.16, 0.1, N.bl),
    ...fDetail({ disc: [0, -0.2, 1.4, 4.6, 0.34, 4.4], E: [0, 0, 0.8, 1.9, 1.05, 6.6], plates: 6, gills: 4, collars: 5, gc: 1, noz: [[2.8, -0.3, 6.2, 8.4, 0.72]], blades: [[[1.9, 0.2, -0.2], [7.4, -0.1, 7.4], 0.38]], guns: [[1.6, -0.5, -7.2, -7.9, 0.16]] }),
  ],
};

// ---- TOAD: torpedo bomber (19 m) --------------------------------------------
const toadWarts = [[1.9, 0.9, -0.3, 0.33], [-1.7, 1.0, 0.8, 0.3], [0.8, 1.35, 1.8, 0.36], [2.4, 0.5, 2.2, 0.3], [0.2, 1.2, -1.4, 0.26],
  [1.3, 1.15, 3.4, 0.28], [2.7, 0.2, 0.6, 0.27], [1.0, 1.4, 0.2, 0.3], [2.0, 0.95, 4.2, 0.25]];
SHIPS.toad = {
  ...DB.ships.toad,
  prims: [
    ell([0, -0.1, 1.6], [5.8, 0.42, 5.2], N.dk, nSt(0.28)), ell([0, 0.8, 1.2], [4.0, 0.3, 5.6], N.dk2, nSt(0.28)),
    ...nMand(1.5, -0.2, -7.6, 3.2, 0.36), nKeel(-1.4, 1.0, 5.0, 1.8, 0.35), ...nComb(0.6, -1.3, 4.4, 4, 3.2, 0.5),
    ell([0, 0, 0.6], [2.6, 1.55, 7.6], N.dk, nSt(0.34)),
    ell([0, 0.95, 0.2], [1.9, 0.8, 5.4], N.dk2, nSt(0.3)),
    ell([0, 1.5, 0.6], [1.0, 0.4, 3.2], N.dk, nSt(0.24)),
    ell([0, 0.0, -6.2], [2.3, 1.4, 2.5], N.dk, nSt(0.32)),
    ...nEye(1.35, 0.4, -8.4, 1.7),
    nPod([0, -1.9, 0.8], [2.2, 1.2, 4.2], N.dk2, 0.3),                                     // torpedo pod cluster
    nPod([2.6, -1.4, 2.6], [1.3, 0.9, 2.4], N.dk2, 0.26),
    nPod([2.3, -0.9, -2.4], [0.9, 0.7, 1.4], N.dk2, 0.26),
    nSpike([0, 1.8, -1.2], [0, 3.1, 2.4], 0.3), nSpike([0, 1.6, 1.8], [0, 2.7, 5.6], 0.24),
    nBlade([2.6, 0.2, 0.8], [8.4, -0.2, 8.8], 0.45), nBlade([2.4, -0.6, 2.4], [6.2, -0.8, 9.6], 0.32),
    ...nNoz(3.6, -0.3, 7.4, 9.4, 0.85),
    seg([1.0, 0.1, -8.4], [1.0, 0.1, -7.6], 0.18, 0.12, N.bl),
    ...fDetail({ disc: [0, -0.1, 1.6, 5.8, 0.42, 5.2], E: [0, 0, 0.6, 2.6, 1.55, 7.6], plates: 7, gills: 5, collars: 5, noz: [[3.6, -0.3, 7.4, 9.4, 0.85]], blades: [[[2.6, 0.2, 0.8], [8.4, -0.2, 8.8], 0.45]], guns: [[1.0, 0.1, -8.4, -7.6, 0.18]] }),
  ],
};

// ---- REAVER: heavy assault fighter (19 m) -----------------------------------
SHIPS.reaver = {
  ...DB.ships.reaver,
  prims: [
    ell([0, -0.1, 1.2], [6.2, 0.44, 5.6], N.dk, nSt(0.28)), ell([0, 0.9, 0.8], [4.4, 0.32, 6.0], N.dk2, nSt(0.28)),
    ...nMand(1.6, -0.2, -8.6, 3.6, 0.4), ...nMand(0.9, -0.5, -8.4, 2.2, 0.28), nKeel(-1.2, 0.0, 5.0, 1.9, 0.38),
    ell([0, 0, 0.8], [2.7, 1.5, 8.0], N.dk, nSt(0.34)),
    ell([0, 0.9, 0.2], [2.1, 0.8, 5.8], N.dk2, nSt(0.3)),
    ell([0, 1.55, -0.2], [1.2, 0.45, 3.6], N.dk, nSt(0.24)),
    ell([0, -0.05, -6.2], [2.6, 1.4, 2.7], N.dk2, nSt(0.3)),                               // armoured prow
    ell([0, 0.6, -7.8], [1.7, 0.8, 1.4], N.dk, nSt(0.26)),
    ...nEye(1.5, 0.35, -9.0, 1.6),
    nPod([2.5, -0.7, -3.6], [0.9, 0.7, 1.7]),
    nSpike([0, 1.8, -2.4], [0, 3.4, 1.6], 0.3), nSpike([0, 1.7, 0.4], [0, 3.1, 4.8], 0.26),
    nSpike([1.4, 1.2, -5.0], [3.2, 2.8, -1.8], 0.2), nSpike([1.5, 1.0, -2.0], [4.2, 2.6, 2.0], 0.2),
    nBlade([2.7, 0.15, 0.4], [9.2, -0.15, 9.2], 0.45), nBlade([2.5, -0.6, 2.0], [6.8, -0.8, 10.0], 0.34),
    nBlade([2.2, 0.6, 1.0], [7.4, 0.9, 8.2], 0.3),
    ...nNoz(3.2, -0.3, 7.4, 9.8, 0.8), ...nNoz(1.3, -0.5, 8.0, 9.9, 0.5),
    seg([1.2, -0.55, -8.0], [1.2, -0.55, -8.8], 0.18, 0.12, N.bl),
    ...fDetail({ disc: [0, -0.1, 1.2, 6.2, 0.44, 5.6], E: [0, 0, 0.8, 2.7, 1.5, 8.0], plates: 7, gills: 5, collars: 5, gc: 2, noz: [[3.2, -0.3, 7.4, 9.8, 0.8], [1.3, -0.5, 8.0, 9.9, 0.5]], blades: [[[2.7, 0.15, 0.4], [9.2, -0.15, 9.2], 0.45], [[2.2, 0.6, 1.0], [7.4, 0.9, 8.2], 0.3]], guns: [[1.2, -0.55, -8.0, -8.8, 0.18]] }),
  ],
};

// ---- GULPER: escort corvette (66 m) -----------------------------------------
SHIPS.gulper = {
  ...DB.ships.gulper,
  prims: [
    ell([0, -0.5, 4], [15, 1.3, 20], N.dk, nSt(0.8, 0.1)), ell([0, 2.8, 2], [11, 1.0, 22], N.dk2, nSt(0.7, 0.1)),
    ...nMand(5.5, 0.5, -33, 13, 1.0), ...nMand(3.4, -2.8, -33, 8, 0.7), nKeel(-9.6, -6, 16, 7, 1.2), ...nComb(4, -6.5, 20, 5, 9, 0.4),
    // lamellar barrel hull
    ell([0, 0, 2], [9.6, 6.4, 29], N.dk, nSt(0.85, 0.12)),
    ell([0, 4.0, 0], [7.8, 2.8, 22], N.dk2, nSt(0.75, 0.12)),
    ell([0, 6.0, -2], [5.4, 1.9, 15], N.dk, nSt(0.7, 0.12)),
    ell([0, 7.5, -4], [3.2, 1.2, 9], N.dk2, nSt(0.6, 0.12)),
    ell([0, -0.4, -28], [7.4, 5.2, 7.4], N.dk, nSt(0.8, 0.1)),                              // blunt prow
    ell([0, 3.4, -26], [4.8, 2.4, 6], N.dk2, nSt(0.7, 0.1)),
    ...nEye(3.0, 0.8, -34.0, 2.6), ...nEye(6.2, -0.6, -31.8, 1.4),
    // M-7 maser lances: emitter barrels on the upper prow (mirrored); the lance mounts sit at the glowing tips
    seg([3.0, 1.2, -28.5], [3.0, 1.2, -33.0], 0.9, 0.7, N.bl, { rust: N.ru, lod: 2 }),
    ell([3.0, 1.2, -33.2], [0.75, 0.75, 0.4], N.cy, { glow: true, glowF: 1.4, lod: 2 }),
    nPod([5.2, 1.0, -22], [2.2, 1.6, 3.6], N.dk2, 0.22), nPod([7.4, -1.6, -14], [2.0, 1.4, 3.0], N.dk2, 0.22),
    // ventral drum (supply/launch bay)
    seg([0, -6.4, -8], [0, -6.4, 20], 4.4, 3.8, N.dk, { rust: N.ru, edge: N.ed, streak: 1, dots: { col: N.pr, p: 0.02, f: 1.0 }, strata: [0.9, 0] }),
    ell([0, -6.4, 21], [3.6, 3.4, 2.0], N.dk2, nSt(0.7, 0)),
    // dorsal crest of spikes
    ...[-8, -2, 4, 10, 16, 22].map((z, i) => nSpike([0, 7.6 - i * 0.5, z], [0, 11.5 - i * 0.9, z + 6 + i * 0.4], 0.9 - i * 0.07)),
    // sting turret bases
    ell([3.6, 7.0, -2], [1.7, 0.9, 1.7], N.mt, { rust: N.ru, streak: 1 }), ell([3.4, 5.5, 14], [1.7, 0.9, 1.7], N.mt, { rust: N.ru, streak: 1 }),
    // trailing blades
    nBlade([8, 0.5, 6], [16.5, 0.2, 34], 0.9), nBlade([7, -3, 12], [14, -3.8, 36], 0.7), nBlade([6, 3.5, 4], [12, 5.6, 30], 0.6),
    // engine nacelles
    ...nNoz(9.5, -1.0, 24, 35.4, 2.7), ...nNoz(3.8, -2.2, 31, 36.0, 1.5),
    seg([5.5, -2.4, -30], [5.5, -2.4, -35.3], 1.3, 0.8, N.bl),
    ...fDetail({ disc: [0, -0.5, 4, 15, 1.3, 20], E: [0, 0, 2, 9.6, 6.4, 29], plates: 9, gills: 6, collars: 7, ribs: 7, spikes: 6, noz: [[9.5, -1.0, 24, 35.4, 2.7], [3.8, -2.2, 31, 36.0, 1.5]], blades: [[[8, 0.5, 6], [16.5, 0.2, 34], 0.9], [[7, -3, 12], [14, -3.8, 36], 0.7]], guns: [[5.5, -2.4, -30, -35.3, 1.0]] }),
  ],
};

// ---- HIVE CARRIER: migratory brood-ark, jump-capable super carrier (900 m) ---------------------------
// Catalogue ship (not yet used in missions). Low resolution multiplier keeps the voxel count sane.
SHIPS.hivecarrier = {
  ...DB.ships.hivecarrier,
  prims: [
    // carapace: stacked overlapping shell plates
    ell([0, 0, 40], [150, 70, 330], N.dk, nSt(14, 0.1)),
    ell([0, 55, 0], [190, 24, 330], N.dk2, nSt(12, 0.1)),
    ell([0, -10, 60], [250, 18, 300], N.dk, nSt(12, 0.1)),
    ell([0, 78, -40], [110, 22, 230], N.dk2, nSt(10, 0.1)),
    ell([0, 95, -90], [60, 14, 140], N.dk, nSt(8, 0.1)),
    ell([0, -6, -300], [110, 62, 120], N.dk, nSt(12, 0.1)),                                 // blunt prow
    // crescent mandibles
    ...nMand(90, 10, -330, 260, 20), ...nMand(55, -40, -340, 160, 15),
    ...nEye(60, 20, -418, 24), ...nEye(100, -10, -392, 14),
    // ventral keel, hangar maws with pearl lights
    nKeel(-60, -200, 330, 180, 22),
    ell([0, -62, -40], [60, 20, 150], N.bl, { dots: { col: N.pr, p: 0.02, f: 1.0 } }),
    ell([90, -48, 120], [34, 14, 90], N.bl, { dots: { col: N.pr, p: 0.02, f: 1.0 } }),
    ...nComb(30, -60, 120, 7, 200, 0.5),
    // dorsal spike rows
    ...[-240, -170, -100, -30, 40, 110, 180, 250].map((z, i) => nSpike([0, 100 - i * 4, z], [0, 170 - i * 8, z + 70], 12 - i * 0.8)),
    ...[-200, -120, -40, 40, 120, 200].map((z, i) => nSpike([70, 70, z], [110, 130 - i * 5, z + 60], 8)),
    // trailing blades
    nBlade([120, 20, 150], [265, 10, 440], 16), nBlade([100, -30, 200], [230, -40, 445], 12), nBlade([90, 60, 100], [200, 80, 420], 10),
    // engine vents (ribbed, red-orange)
    ...nNoz(60, 0, 330, 440, 40), ...nNoz(150, -10, 320, 430, 32), ...nNoz(200, 10, 300, 410, 24),
    ...fDetail({ disc: [0, -10, 60, 250, 18, 300], rim: 22, E: [0, 0, 40, 150, 70, 330], plates: 12, gills: 8, collars: 9, ribs: 8, spikes: 8, noz: [[60, 0, 330, 440, 40], [150, -10, 320, 430, 32], [200, 10, 300, 410, 24]], blades: [[[120, 20, 150], [265, 10, 440], 16]] }),
  ],
};


// ---- BULLFROG: 600 m jump capital, forward spine lance + 36-fighter hangar (docs/BULLFROG.md). Authored at full size (no scaleShip).
// Turret sizes (owner): S ~5 m (r 2.5), M ~12 m (r 6.5), L ~30 m (r 17). Positions: see BULLFROG.md 3.3 (owner decision 2026-10-22: one L lance only, dorsal; the ventral L2 was removed).
const bfArch = z => {                                   // hand-placed rib arch with cyan seam towards the bow (BULLFROG.md 7.3), same maths as fRef for E=[0,0,30,70,38,255]
  const cz = 30, rz = 255, rx = 70, ry = 38, th = 2.8, f = Math.sqrt(Math.max(0, 1 - ((z - cz) / rz) ** 2)) * 1.07;
  const pts = [0.12, 0.7, 1.25, 1.85, 2.4].map(a => [rx * Math.sin(a) * f, ry * Math.cos(a) * f, z]);
  return chain(pts, [th * 2, th * 2.3, th * 2.3, th * 2, th * 1.6], N.mt, { rust: N.ru, edge: N.ed, streak: 1 });
};
const bfMir = (f) => [f(1), f(-1)];
SHIPS.bullfrog = {
  ...DB.ships.bullfrog,
  prims: [
    ell([0, 0, 30], [68, 36, 255], N.dk, nSt(6, 0.1)),                                   // core barrel
    ell([0, 24, 10], [52, 15, 225], N.dk2, nSt(6, 0.1)), ell([0, 32, -30], [34, 8, 165], N.dk, nSt(5, 0.1)),   // dorsal shells
    ell([0, -4, 60], [88, 9, 200], N.dk, nSt(6, 0.1)), ell([0, -10, 90], [74, 7, 170], N.dk2, nSt(6, 0.1)),    // flare discs
    ell([30, -2, -226], [24, 28, 62], N.dk, nSt(5, 0.1)), ell([28, 8, -210], [20, 14, 40], N.dk2, nSt(5, 0.1)), // split-jaw prow lobes
    ell([0, 0, -176], [24, 26, 34], N.dk, nSt(5, 0.1)),                                  // skull block behind the spine slot
    ...nMand(34, 16, -236, 92, 5.5), ...nMand(30, -18, -236, 80, 5), ...nMand(54, 0, -218, 64, 4.5),
    seg([0, -4, -200], [0, -4, -252], 9, 7, N.dk), seg([0, -4, -250], [0, -4, -296], 6.5, 4.5, N.bl),   // spine emitter barrel
    ell([0, -4, -297], [8, 8, 3], N.cy, { glow: true, glowF: 1.5 }),
    ...[-258, -272, -286].map(z => ell([0, -4, z], [9, 9, 2.2], N.mt, nSt(2, 0))),       // collar plates
    // ventral launch drum, hangar maws, torpedo tube cluster
    seg([0, -30, -120], [0, -30, 130], 20, 17, N.dk, { dots: { col: N.pr, p: 0.02, f: 1 } }), ell([0, -30, 132], [15, 14, 6], N.dk2),
    ell([0, -46, -95], [24, 7, 32], N.bl, { dots: { col: N.pr, p: 0.05, f: 1 } }), ell([0, -46, 90], [24, 7, 32], N.bl, { dots: { col: N.pr, p: 0.05, f: 1 } }),
    ...[[-8, -48], [8, -48], [-8, -38], [8, -38]].map(([x, y]) => seg([x, y, -30], [x, y, -44], 3, 2.4, N.bl)),
    nKeel(-46, -20, 20, 10, 5),
    // heart dome (dorsal) over the reactor
    ell([0, 30, 150], [36, 14, 34], N.dk2, nSt(5, 0.1)),
    // turret housings: L barbette (dorsal; owner decision 2026-10-22 removed the ventral L blister - carrier keeps one lance), M mounts ~12 m, S/PD ~5 m
    ell([0, 31, -150], [19, 9, 20], N.mt, nSt(3, 0.1)),
    ...[[44, 33, -70], [54, 28, 80], [46, -30, -20]].map(([x, y, z]) => ell([x, y, z], [6.5, 3, 6.5], N.mt, nSt(2, 0))),
    // shield gland blisters
    ell([0, 33, -40], [14, 6, 14], N.dk2, { dots: { col: N.pr, p: 0.08, f: 1 } }), ell([0, 31, 170], [14, 6, 14], N.dk2, { dots: { col: N.pr, p: 0.08, f: 1 } }),
    // rib arches to the bow, flank spikes
    ...[-180, -160, -140, -120, -100].flatMap(bfArch),
    ...[-150, -100, -50, 0, 50, 100, 150].map((z, i) => nSpike([34, 30, z], [40, 55 - i * 2, z + 36], 3.5 - i * 0.2)),
    // trailing blades, pylons, engine nacelles
    nBlade([40, 2, 150], [78, 6, 262], 3.2), nBlade([60, 2, 60], [92, 0, 290], 4), nBlade([48, -6, 90], [84, -8, 288], 3),
    ...nNoz(24, 12, 244, 296, 12), ...nNoz(50, -4, 240, 294, 14), ...nNoz(76, 8, 236, 290, 11),
    ...fDetail({ disc: [0, -4, 60, 88, 9, 200], rim: 18, E: [0, 0, 30, 70, 38, 255], refN: 11, plates: 14, gills: 8, collars: 9, ribs: 9, spikes: 8,
      noz: [[24, 12, 244, 296, 12], [50, -4, 240, 294, 14], [76, 8, 236, 290, 11]], blades: [[[40, 2, 150], [78, 6, 262], 3.2], [[60, 2, 60], [92, 0, 290], 4]], guns: [[0, -4, -250, -296, 4.5]] }),
  ],
};

// attach the reference kit to every FROGG hull (FD_LIST holds each hull's body descriptor in definition order)
['darter', 'leaper', 'spitter', 'toad', 'reaver', 'gulper', 'hivecarrier', 'bullfrog'].forEach((id, i) => { if (FD_LIST[i]) SHIPS[id].prims.push(...fRef(FD_LIST[i])); });
for (const id in SHIPS) if (SHIPS[id].fac === 'frogg') SHIPS[id].flameColor = 0x30dcff;      // cyan drive plumes

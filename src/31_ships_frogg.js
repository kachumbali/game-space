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

// ---- FROGG fighters, 2026-11-12 bio-mech rebuild (owner direction: Gemini design seed, hybrid language, no glow): a scaled creature
// hide (the voxeliser's FROGG scale greebles grow on it) with machinery strapped on: gunmetal cages and frames, pipe bundles, clamp-on
// boxes and chunky round thrusters. Rust-red armour only on the Reaver. Drive flames come from
// the runtime, so nozzles are dark. Mounts, engines, comps and launch points in data/db.json were moved to match this art.
const FM = { hide: 0x3b403d, hide2: 0x2e3331, met: 0x5f6467, met2: 0x45494c, dk: 0x1c1e20, cu: 0x7a4e34, bone: 0xa49c8a, rust: 0x6a2c24, rust2: 0x4c2420, cap: 0x2f3a34 };
const NG = { noDetail: true };
// round thruster: steel housing, band, dark nozzle ending at the database engine position (x, y, z1)
const fmThr = (x, y, z1, r, len) => [
  tap([x, y, z1 - len / 2], len / 2, [r * 0.85, r * 0.85], [r, r], FM.met, { sh: 'e', ...NG }),
  tap([x, y, z1 - len * 0.62], Math.max(0.1, len * 0.07), [r * 1.08, r * 1.08], [r * 1.08, r * 1.08], FM.met2, { sh: 'e', ...NG }),
  tap([x, y, z1 - 0.05], 0.1, [r * 0.82, r * 0.82], [r * 0.8, r * 0.8], FM.dk, { sh: 'e', ...NG }),
];
// a cage ring around an elliptic section (top, bottom and side bars) at z, and longitudinal rails between z0 and z1
const fmRing = (cx, cy, z, rx, ry, t, col = FM.met2) => [
  tap([cx, cy + ry, z], t, [rx * 0.75, t], [rx * 0.75, t], col, NG), tap([cx, cy - ry, z], t, [rx * 0.75, t], [rx * 0.75, t], col, NG),
  tap([cx + rx, cy, z], t, [t, ry * 0.75], [t, ry * 0.75], col, NG),
  seg([cx + rx * 0.75, cy + ry, z], [cx + rx, cy + ry * 0.75, z], t, t, col, NG), seg([cx + rx * 0.75, cy - ry, z], [cx + rx, cy - ry * 0.75, z], t, t, col, NG),
];
const fmRail = (x, y, z0, z1, t, col = FM.met2) => tap([x, y, (z0 + z1) / 2], (z1 - z0) / 2, [t, t], [t, t], col, NG);
const fmBarrel = (x, y, z0, z1, r) => [seg([x, y, z0], [x, y, z1], r, r, FM.dk, NG), tap([x, y, z1 + r * 0.6], r * 0.6, [r * 1.4, r * 1.4], [r * 1.3, r * 1.3], FM.met2, { sh: 'e', ...NG })];
const fmPipe = (pts, r, col = FM.cu) => chain(pts, pts.map(() => r), col, NG);

// ---- DARTER: interceptor (9.5 m) — a needle hull, forward gun and sensor rods, a ribbed heat-sink plate, twin round thrusters
SHIPS.darter = {
  ...DB.ships.darter,
  prims: [
    tap([0, 0, -0.3], 4.0, [0.32, 0.28], [0.78, 0.62], FM.hide, { sh: 'e' }),                          // scaled needle hull
    tap([0, 0.2, 4.0], 0.9, [0.78, 0.6], [0.95, 0.55], FM.met, { sh: 'h', ...NG }),                     // drive saddle
    ...fmThr(0.5, 0.35, 5.0, 0.38, 1.6),
    tap([0, 0.95, 4.2], 0.8, [0.06, 0.05], [0.06, 0.9], FM.met2, NG),                                   // tail fin
    tap([0.7, 0.5, 4.5], 0.5, [0.3, 0.04], [0.2, 0.04], FM.met2, { ax: 'x', ...NG }),
    tap([1.0, 0, 0.4], 0.12, [1.3, 0.55], [1.3, 0.55], FM.met, NG),                                    // heat-sink plate
    ...rungs(1.13, 0, -0.8, 1.6, 7, 0.05, 0.5, 0.04, FM.dk, NG),
    seg([0.6, 0, -0.4], [0.9, 0, -0.4], 0.08, 0.08, FM.met2, NG), seg([0.6, 0, 1.2], [0.9, 0, 1.2], 0.08, 0.08, FM.met2, NG),
    ...fmRing(0, 0.05, -1.6, 0.62, 0.5, 0.05), ...fmRing(0, 0.1, 1.8, 0.8, 0.62, 0.05),
    ...fmBarrel(0.4, -0.3, -3.0, -4.9, 0.08),                                                           // fang rods
    seg([0.22, 0.28, -3.0], [0.24, 0.3, -5.1], 0.035, 0.03, FM.met, NG), seg([0.55, 0.05, -2.6], [0.62, 0.05, -4.4], 0.035, 0.03, FM.met, NG),
    seg([0.25, 0.55, 1.0], [0.3, 1.4, 1.2], 0.03, 0.02, FM.met, NG), seg([-0.25, 0.55, 0.2], [-0.3, 1.2, 0.3], 0.03, 0.02, FM.met, { ...NG, noMirror: true }),
    ...fmPipe([[0.35, 0.45, -2.2], [0.5, 0.55, 0], [0.45, 0.6, 2.6]], 0.06),
    ell([0.62, -0.38, -1.2], [0.13, 0.13, 0.6], FM.met2, NG),                                          // missile tube (launch -1.75)
  ],
};

// ---- LEAPER: fighter (13.6 m) — a blunt scaled frog head and body, rear horns, pipes over the back, big side gun pods
SHIPS.leaper = {
  ...DB.ships.leaper,
  prims: [
    ell([0, 0.3, 0.6], [2.4, 1.6, 5.2], FM.hide),                                                       // body
    ell([0, -0.1, -4.4], [2.2, 1.15, 2.2], FM.hide2),                                                   // blunt head
    ...[[0.7, 0.35, -6.45], [0.75, -0.35, -6.4]].map(c => ell(c, [0.3, 0.26, 0.2], FM.met2, NG)),       // nostril ports
    tap([0, 0.95, -4.6], 1.2, [1.2, 0.2], [1.5, 0.25], FM.hide, { sh: 'e' }),                           // brow
    seg([1.1, 1.6, 2.2], [1.7, 2.35, 4.6], 0.32, 0.05, FM.bone, NG), seg([1.6, 1.2, 3.4], [2.5, 1.8, 5.2], 0.24, 0.04, FM.bone, NG),   // horns
    ...fmPipe([[0.5, 1.7, -3.2], [0.6, 1.95, -0.5], [0.8, 1.8, 2.4], [1.2, 1.1, 4.8]], 0.13),
    ...fmPipe([[1.0, 1.45, -3.0], [1.25, 1.65, -0.2], [1.5, 1.35, 2.6]], 0.11, FM.met2),
    // gun pods (flaser + spit) on pylons, cable bundles back to the body
    tap([2.6, -0.8, -4.0], 2.0, [0.6, 0.6], [0.66, 0.66], FM.met, { sh: 'e', ...NG }),
    ...[-5.2, -3.6, -2.4].map(z => tap([2.6, -0.8, z], 0.14, [0.72, 0.72], [0.72, 0.72], FM.met2, { sh: 'e', ...NG })),
    seg([1.6, -0.6, -3.4], [2.3, -0.75, -3.6], 0.3, 0.3, FM.met2, NG),
    ...fmBarrel(2.6, -0.6, -5.8, -6.6, 0.16), ...fmBarrel(2.6, -1.1, -5.6, -6.0, 0.14),
    ...fmPipe([[2.7, -0.3, -2.2], [2.2, 0.2, -1.0], [1.6, 0.6, 0.2]], 0.09),
    ...fmThr(2.2, -0.2, 6.8, 0.5, 1.8), seg([1.2, -0.2, 4.6], [2.0, -0.2, 5.4], 0.3, 0.3, FM.met2, NG),
    ell([0.9, -0.75, -2.2], [0.2, 0.2, 0.6], FM.met2, NG),                                              // missile tube (launch -2.8)
  ],
};

// ---- SPITTER: gunship (16 m) — a bulbous body in a heavy cage, a maser capacitor bank, a caged heavy-maser muzzle, side gatlings, dorsal masts
SHIPS.spitter = {
  ...DB.ships.spitter,
  prims: [
    ell([0, 0.4, 0.6], [2.9, 2.3, 7.6], FM.hide),                                                       // body
    ell([0, -0.8, -2.2], [2.7, 1.9, 3.4], FM.cap, NG),                                                  // maser capacitor bank (owner 2026-11-12: no acid, kinetics and energy only)
    ...[-6.0, -3.6, -1.2, 1.4, 4.0].flatMap(z => { const f = Math.sqrt(1 - ((z - 0.6) / 7.6) ** 2); return fmRing(0, 0.4, z, 2.95 * f + 0.15, 2.35 * f + 0.15, 0.13); }),
    fmRail(1.0, 2.75, -6.0, 4.0, 0.13), fmRail(2.6, 1.3, -5.0, 3.6, 0.13), fmRail(2.6, -0.9, -5.0, 3.6, 0.13),
    // caged heavy-maser muzzle at the bow (spitcannon at z -8.6)
    tap([0, 0.1, -7.6], 0.5, [1.3, 1.1], [1.5, 1.25], FM.met, { sh: 'h', ...NG }),
    tap([0, 0.1, -8.1], 0.08, [1.0, 0.85], [1.0, 0.85], FM.dk, NG),
    ...[-0.5, 0, 0.5].map(x => tap([x, 0.1, -8.25], 0.1, [0.07, 0.85], [0.07, 0.85], FM.met2, { ...NG, noMirror: true })),
    // side gatlings (fang) on pylons
    tap([3.1, -0.9, -1.8], 1.4, [0.42, 0.42], [0.48, 0.48], FM.met, { sh: 'e', ...NG }), seg([2.4, -0.7, -1.4], [2.9, -0.85, -1.6], 0.24, 0.24, FM.met2, NG),
    ...[[0.12, 0.12], [-0.12, 0.12], [0, -0.14]].map(([dx, dy]) => seg([3.1 + dx, -0.9 + dy, -3.0], [3.1 + dx, -0.9 + dy, -3.6], 0.07, 0.07, FM.dk, NG)),
    // dorsal masts and rear thrusters
    seg([0.6, 2.6, 3.0], [0.6, 3.1, 3.0], 0.08, 0.05, FM.met, NG), seg([0.2, 2.6, 4.2], [0.2, 3.0, 4.2], 0.06, 0.04, FM.met, NG),
    tap([0, 0.6, 7.2], 1.0, [2.0, 1.3], [2.2, 1.4], FM.met2, { sh: 'h', ...NG }),
    ...fmThr(1.4, 0.6, 8.6, 0.8, 2.0),
    ...fmPipe([[1.5, 1.9, -4.5], [2.2, 1.6, -2.0], [2.4, 1.2, 1.0]], 0.12),
    ell([3.1, -1.5, -3.2], [0.18, 0.18, 0.5], FM.met2, NG),                                             // missile tube (launch -3.8)
  ],
};

// ---- TOAD: torpedo bomber (22 m) — a compact scaled body under an armoured deck, clamp-on torpedo frames, four round thrusters
SHIPS.toad = {
  ...DB.ships.toad,
  prims: [
    ell([0, 0, 0], [3.6, 2.2, 8.4], FM.hide),                                                           // body
    tap([0, -0.3, -7.2], 1.4, [2.2, 1.2], [3.2, 1.8], FM.met, { sh: 'h', ...NG }),                     // armoured jaw
    tap([0, -0.3, -8.4], 0.22, [1.8, 0.9], [2.2, 1.2], FM.met2, { sh: 'h', ...NG }),
    tap([0, 2.25, -0.5], 3.6, [1.6, 0.45], [1.85, 0.55], FM.met, { sh: 'h', ...NG }),                  // dorsal deck module
    ...rungs(0, 2.75, -2.8, 0.4, 6, 1.1, 0.06, 0.05, FM.dk, NG),
    tap([1.1, 2.75, 2.2], 0.9, [0.5, 0.25], [0.5, 0.25], FM.met2, { sh: 'h', ...NG }),
    ...fmBarrel(1.2, -0.8, -8.4, -8.9, 0.16),                                                           // fangs below the jaw
    // torpedo frames: two clamp-on boxes per side with the tube mouths at z -4.7 and 0.6
    ...[[-4.8, -0.6], [0.5, 4.0]].flatMap(([z0, z1]) => [
      tap([3.2, -2.0, (z0 + z1) / 2], (z1 - z0) / 2, [0.75, 0.75], [0.75, 0.75], FM.met, { sh: 'h', ...NG }),
      tap([3.2, -2.0, z0 + 0.05], 0.08, [0.5, 0.5], [0.5, 0.5], FM.dk, { sh: 'e', ...NG }),
    ]),
    fmRail(2.4, -1.35, -4.8, 4.0, 0.14), fmRail(3.95, -1.35, -4.8, 4.0, 0.14),
    ...fmRing(0, 0, -3.0, 3.2, 2.0, 0.14), ...fmRing(0, 0, 3.0, 3.2, 2.0, 0.14),
    // four round thrusters (two high, two low) on a frame
    tap([0, 0.2, 7.4], 1.0, [3.0, 1.9], [3.6, 2.2], FM.met2, { sh: 'h', ...NG }),
    ...fmThr(1.6, 1.2, 9.6, 1.1, 2.4), ...fmThr(3.4, -0.8, 9.4, 0.9, 2.2),
    ...fmPipe([[2.2, 1.7, -3.5], [2.8, 1.2, 0.5], [3.0, 1.0, 5.5]], 0.14),
  ],
};

// ---- REAVER: heavy fighter (19 m) — a rust-red armoured brick, stepped gun blocks at the bow, side tanks, an open rear truss
const rvTruss = (x0, x1, y0, y1, z0, z1, t) => {
  const P = [], xs = [x0, x1], ys = [y0, y1], zs = [z0, z1];
  for (const y of ys) for (const z of zs) P.push(tap([(x0 + x1) / 2, y, z], t, [(x1 - x0) / 2, t], [(x1 - x0) / 2, t], FM.met2, NG));
  for (const x of xs) for (const z of zs) P.push(tap([x, (y0 + y1) / 2, z], t, [t, (y1 - y0) / 2], [t, (y1 - y0) / 2], FM.met2, NG));
  for (const x of xs) for (const y of ys) P.push(fmRail(x, y, z0, z1, t));
  return P;
};
SHIPS.reaver = {
  ...DB.ships.reaver,
  prims: [
    tap([0, 0.2, 0.5], 5.6, [2.6, 1.6], [2.9, 1.8], FM.rust, { sh: 'h' }),                             // armoured hull
    tap([0, 1.95, -0.5], 3.8, [1.6, 0.35], [1.8, 0.4], FM.rust2, { sh: 'h', ...NG }),                  // dorsal armour
    ...[-3.0, -1.0, 1.0, 3.0].map(z => tap([0, 2.42, z], 0.5, [1.1, 0.12], [1.1, 0.12], FM.met2, { sh: 'h', ...NG })),
    // stepped gun blocks: flaser (x 1.2, z -8.8), fang (x 2.0, z -7.4), spit (x 2.4, z -6.2)
    tap([1.0, -0.5, -6.5], 1.5, [0.6, 0.8], [0.62, 0.85], FM.rust2, { sh: 'h', ...NG }),
    tap([1.95, -0.5, -5.8], 0.8, [0.36, 0.7], [0.38, 0.75], FM.rust, { sh: 'h', ...NG }),
    tap([2.65, -0.45, -5.0], 0.4, [0.35, 0.6], [0.36, 0.62], FM.rust2, { sh: 'h', ...NG }),
    ...fmBarrel(1.2, -0.55, -7.6, -8.8, 0.15), ...fmBarrel(2.0, -0.5, -6.4, -7.4, 0.13), ...fmBarrel(2.4, -0.4, -5.2, -6.2, 0.13),
    tap([2.5, -0.95, -5.0], 0.25, [0.22, 0.22], [0.22, 0.22], FM.dk, { sh: 'e', ...NG }),               // missile tube (launch -5.2)
    // side tanks with bands
    tap([3.65, 0.1, 0.8], 3.0, [0.9, 0.9], [0.95, 0.95], FM.met, { sh: 'e', ...NG }),
    ...[-1.4, 0.8, 3.0].map(z => tap([3.65, 0.1, z], 0.18, [1.02, 1.02], [1.02, 1.02], FM.met2, { sh: 'e', ...NG })),
    // open rear truss frame around the four thrusters
    ...rvTruss(-4.0, 4.0, -1.7, 1.6, 6.1, 9.6, 0.14),
    ...fmThr(3.2, -0.3, 9.8, 0.8, 3.0), ...fmThr(1.3, -0.5, 9.9, 0.5, 3.2),
    ...fmPipe([[1.6, 1.8, 4.0], [2.6, 1.4, 5.6], [3.2, 0.5, 6.8]], 0.12),
  ],
};

// ---- GULPER: escort corvette, 2026-11-12 bio-mech rebuild (authored at 66 m, scaled to 200 m by tuning.scaleTo). Owner direction: hybrid
// language, the outline from the battleship concept sheet (claw prow, long organic hull, swept ventral fins), the materials of the fighters
// (scaled hide, gunmetal cages and rails, copper pipes, round thrusters), no glow. Rod guns sit in the two lower claw prongs, maser lances
// in the upper head, torpedo frames under the belly. Every turret stands on a pedestal rooted in the hull.
const fgSeat = (x, y, z, dy, D, y0) => {
  const top = y - dy * D * 0.2, h = Math.abs(top - y0) / 2;
  return [
    tap([x, (top + y0) / 2, z], D * 0.4, [D * 0.4, h], [D * 0.4, h], FM.met2, { sh: 'h', noMirror: true, ...NG }),
    tap([x, y - dy * D * 0.1, z], D * 0.5, [D * 0.56, D * 0.12], [D * 0.56, D * 0.12], FM.met, { sh: 'h', noMirror: true, ...NG }),
  ];
};
const gSeat = (x, y, z, dy, cls, y0) => { const L = TUNE.scaleTo.gulper || 66; return fgSeat(x, y, z, dy, turretDia({ def: { length: L } }, { cls }) * 66 / L, y0); };
SHIPS.gulper = {
  ...DB.ships.gulper,
  prims: [
    ell([0, 0, -5], [8.5, 6.2, 24], FM.hide),                                                          // compact pressure hull
    tap([0, 0, 20], 10, [6.3, 4.6], [8.8, 4.2], FM.hide2, { sh: 'h' }),                               // armoured stern joins engine frame
    ell([0, 1, -14], [9.5, 5.4, 12], FM.hide2),                                                         // broad claw roots
    tap([0, 5.5, -4], 11, [3.3, 0.7], [2.5, 0.7], FM.met, { sh: 'h', ...NG }),                         // short dorsal equipment deck
    ell([0, 1.0, -28], [4.6, 3.4, 5.5], FM.hide2),                                                      // upper head
    ell([0, 4.4, -17], [1.7, 0.9, 2.2], FM.met2, NG),                                                   // sensor dome (comp 'eyes')
    // claw prongs: rod guns at their tips (z -35.3)
    ...chain([[5.0, -1.6, -19], [8.2, -2.5, -27], [5.5, -2.4, -34.0]], [2.8, 2.2, 1.1], FM.hide2),
    seg([5.5, -2.4, -36.5], [5.5, -2.4, -37.4], 0.5, 0.2, FM.bone, NG),                                  // claw tip
    ...fmBarrel(5.5, -2.4, -31.5, -35.3, 0.55),
    ...fmBarrel(3.0, 1.2, -30.8, -33.0, 0.45),                                                          // maser lance emitters
    // cage bands and rails along the back, copper feed pipes on the flanks
    ...[-12, 0, 12].flatMap(z => { const f = Math.sqrt(1 - ((z + 5) / 24) ** 2); return fmRing(0, 0, z, 8.5 * f + 0.25, 6.2 * f + 0.25, 0.35); }),
    fmRail(2.6, 6.15, -12, 12, 0.32),
    ...fmPipe([[6.0, 3.6, -20], [7.6, 2.8, -6], [7.8, 1.6, 8], [7.4, 0.8, 22]], 0.38),
    ...fmPipe([[4.6, 5.2, -12], [5.4, 4.8, 4], [5.0, 4.4, 18]], 0.3, FM.met2),
    // ventral torpedo frames: mouths at z -15 and -3, struts to the hull
    ...[[-15.2, -9.6], [-3.2, 2.4]].flatMap(([z0, z1]) => [
      tap([7.2, -5.8, (z0 + z1) / 2], (z1 - z0) / 2, [1.35, 1.15], [1.35, 1.15], FM.met, { sh: 'h', ...NG }),
      tap([7.2, -5.8, z0 + 0.1], 0.15, [0.75, 0.75], [0.75, 0.75], FM.dk, { sh: 'e', ...NG }),
      seg([4.6, -3.2, (z0 + z1) / 2], [6.6, -4.9, (z0 + z1) / 2], 0.6, 0.6, FM.met2, NG),
    ]),
    // swept ventral fins
    tap([11, -2.7, 4], 5.5, [10, 0.8], [3, 0.25], FM.hide2, { ax: 'x', sweep: 0.8, ...NG }),
    tap([11, -2.0, -3], 5.5, [0.5, 0.45], [0.3, 0.3], FM.met2, { ax: 'x', sweep: 0.8, ...NG }),
    // thruster cluster on a frame
    tap([0, -1, 30], 4, [9.0, 4.2], [11.5, 4.4], FM.met2, { sh: 'h', ...NG }),
    ...fmThr(9.5, -1, 35.4, 2.7, 6.5), ...fmThr(3.8, -2.2, 36, 1.5, 5.5),
    // turret seats: sting (S) and thorn (S PD)
    ...gSeat(3.6, 7.35, -2, 1, 'S', 4.5), ...gSeat(-3.6, 7.35, -2, 1, 'S', 4.5),
    ...gSeat(3.4, 5.85, 14, 1, 'S', 3.5), ...gSeat(-3.4, 5.6, 14, 1, 'S', 3.5),
    ...gSeat(0, 7.6, -19, 1, 'S', 4.0), ...gSeat(0, -6.2, -20, -1, 'S', -3.0), ...gSeat(0, -7.3, 16, -1, 'S', -3.5),
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
// ---- BULLFROG: 600 m spine carrier, 2026-11-12 bio-mech rebuild (owner: hybrid language, outline from the battleship concept sheet: a
// long segmented hull, a heavy head with a split claw prow around the spine gun, sweeping ventral fins; fighter materials; no glow).
// Every turret seat is generated from the database positions and stands on a pedestal rooted inside the hull.
const bfHullY = (x, z) => { const q = 1 - ((z - 30) / 250) ** 2 - (x / 64) ** 2; return q > 0 ? 34 * Math.sqrt(q) : 0; };
const bfSeats = () => (DB.ships.bullfrog.turrets || []).flatMap(t => {
  const [x, y, z] = t.pos, dy = Math.sign(y) || 1, D = turretDia({ def: { length: 600 } }, t);
  return fgSeat(x, y, z, dy, Math.max(D, 7), dy * Math.max(2, bfHullY(x, z) * 0.7));
});
SHIPS.bullfrog = {
  ...DB.ships.bullfrog,
  prims: [
    ell([0, 0, 30], [64, 34, 250], FM.hide),                                                            // pressure hull
    ell([0, 0, -105], [73, 32, 105], FM.hide2),                                                        // broad forward shoulders
    tap([0, 30, -10], 175, [9, 7], [16, 7], FM.hide2, { sh: 'h' }),                                     // dorsal ridge
    tap([0, 40, 120], 60, [2, 2], [3, 14], FM.hide2, NG),                                                // swept dorsal crest
    ell([0, 6, -200], [38, 24, 48], FM.hide2),                                                          // heavy head
    ell([0, 20, -215], [14, 6, 16], FM.met2, NG),                                                       // sensor cluster (comp 'eyes')
    // split claw prow around the spine gun: two lower prongs and two upper horns
    ...chain([[24, -14, -215], [32, -18, -255], [22, -12, -292]], [10, 7, 3], FM.hide2),
    ...chain([[20, 18, -225], [24, 22, -262], [14, 14, -285]], [7, 5, 2], FM.hide2),
    // spine gun: barrel along the axis, collars, muzzle at z -299
    seg([0, -4, -205], [0, -4, -296], 8.5, 6, FM.met, NG), tap([0, -4, -297], 1.5, [7.5, 7.5], [7, 7], FM.dk, { sh: 'e', ...NG }),
    ...[-235, -255, -275].map(z => tap([0, -4, z], 2.5, [10, 10], [10, 10], FM.met2, { sh: 'e', ...NG })),
    // cage rings and rails, copper pipes
    ...[-150, -70, 10, 90, 170].flatMap(z => { const f = Math.sqrt(1 - ((z - 30) / 250) ** 2); return fmRing(0, 0, z, 64 * f + 1.5, 34 * f + 1.5, 2.2); }),
    fmRail(22, 33, -150, 180, 2), fmRail(55, 16, -120, 170, 2),
    ...fmPipe([[40, 26, -170], [52, 22, -60], [56, 18, 60], [52, 14, 180]], 2.4),
    ...fmPipe([[30, 30, -120], [36, 30, 0], [34, 28, 140]], 1.8, FM.met2),
    // ventral launch drum with the two hangar maws, the torpedo tube cluster
    seg([0, -30, -125], [0, -30, 135], 19, 17, FM.met, NG), tap([0, -30, 138], 4, [15, 14], [13, 12], FM.met2, { sh: 'e', ...NG }),
    tap([0, -47, -95], 26, [14, 3], [14, 3], FM.dk, NG), tap([0, -47, 90], 26, [14, 3], [14, 3], FM.dk, NG),
    ...[[-8, -48], [8, -48], [-8, -38], [8, -38]].map(([x, y]) => seg([x, y, -10], [x, y, -42], 3, 2.6, FM.dk, { noMirror: true, ...NG })),
    // heart dome over the reactor
    ell([0, 32, 150], [30, 12, 30], FM.met2, NG),
    // Long swept shoulder fins, within the collision envelope; the broad roots overlap the hull.
    tap([71, -8, 22], 23, [126, 5], [36, 2], FM.hide2, { ax: 'x', sweep: 1.25, ...NG }),
    tap([71, -6, -59], 23, [5, 3], [4, 2], FM.met2, { ax: 'x', sweep: 1.25, ...NG }),
    // Recess-like dark side hangar mouths, framed by load-bearing upper and lower sills.
    tap([63, -3, 60], 3, [45, 9], [45, 9], FM.dk, { ax: 'x', ...NG }),
    tap([65, 8, 60], 3, [47, 2], [47, 2], FM.met2, { ax: 'x', ...NG }),
    tap([65, -14, 60], 3, [47, 2], [47, 2], FM.met2, { ax: 'x', ...NG }),
    ...[18, 102].map(z => seg([58, -14, z], [67, 8, z], 2.5, 2.5, FM.met2, NG)),
    // thruster frame and six round thrusters (engines at z 290-296)
    tap([0, 4, 268], 18, [62, 22], [86, 22], FM.met2, { sh: 'h', ...NG }),
    ...fmThr(24, 12, 296, 12, 26), ...fmThr(50, -4, 294, 14, 26), ...fmThr(76, 8, 290, 11, 24),
    ...bfSeats(),
  ],
};

// attach the reference kit to every FROGG hull (FD_LIST holds each hull's body descriptor in definition order)
// (2026-11-12: the bio-mech fighters no longer call fDetail, so the list holds the three capitals only; a positional list had moved their kit onto the fighters)
['hivecarrier'].forEach((id, i) => { if (FD_LIST[i]) SHIPS[id].prims.push(...fRef(FD_LIST[i])); });
for (const id in SHIPS) if (SHIPS[id].fac === 'frogg') SHIPS[id].flameColor = 0x30dcff;      // cyan drive plumes

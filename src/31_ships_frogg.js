// ======================================================================
//  FROGG fleet — organic bio-mech, sharp edges.
//  Visual language: wide diamond-section skull, bulging eye domes with glowing slits, fanged lip,
//  dorsal spine row, bat-web wings with bone spars, folded hind-leg engines, rust-red venom sacs,
//  mottled olive/brown skin over dark plate. Engines amber, weapons venom-green.
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
  ell([ankle[0], ankle[1], ankle[2] + rn * 1.55], [rn * 1.0, rn * 0.9, rn * 0.28], F.amber, { glow: true, glowF: 1.6 }),
  seg([ankle[0] + rn * 0.3, ankle[1] - rn * 0.5, ankle[2] + rn * 0.2], [ankle[0] + rn * 1.5, ankle[1] - rn * 0.9, ankle[2] + rn * 1.2], rn * 0.2, 0.015, F.bone),
];
const fHorn = (pts, rs, col = F.plate2) => chain(pts, rs, col);

// ---- DARTER: light interceptor (9 m) ---------------------------------------
SHIPS.darter = {
  id: 'darter', name: 'FROGG DARTER', cls: 'fighter', fac: 'frogg', role: 'INTERCEPTOR',
  length: 9.5, half: [4.6, 1.8, 5.4], mirror: true, radius: 5.4,
  prims: [
    tap([0, 0.03, -2.6], 2.3, [0.15, 0.1], [1.7, 0.42], F.olive, { sh: 'd', ...skinO }),         // needle skull
    tap([0, -0.4, -2.9], 1.8, [0.08, 0.08], [0.9, 0.22], F.plate, { sh: 'd' }),               // lower jaw
    tap([0, 0, 1.3], 2.7, [0.95, 0.48], [0.8, 0.4], F.skin, { sh: 'e', ...skinO }),           // body
    ell([0, -0.45, 0.6], [0.7, 0.35, 1.5], F.belly, { col2: F.belly2, mot: 1.5 }),             // belly
    ...fEye(1.25, 0.36, -1.7, 0.95),
    seg([0.25, 0.5, -1.3], [1.2, 0.58, -2.7], 0.09, 0.04, F.plate2),
    ...fFangs(-4.0, 0.7, 3, 0.55, 0.06, -0.27),
    seg([0.4, -0.3, -3.2], [0.4, -0.3, -4.9], 0.08, 0.06, F.dark),                             // mouth guns
    ...fSpines(-0.5, 2.8, 5, 0.38, 0.55),
    ...fWing(0.8, 4.2, 1.4, 1.5, 0.35, 0.09, 0.62, -0.05),
    ...fLeg([0.7, -0.1, 2.4], [1.5, -0.3, 3.6], [1.0, -0.15, 4.4], 0.3, 0.26, 0.3),
    ...fHorn([[0.3, 0.1, 3.6], [0.1, 0.0, 4.4], [0.0, 0.2, 5.1]], [0.16, 0.1, 0.02]),
  ],
  engines: [{ pos: [1.0, -0.15, 5.0], comp: 'engR', r: 0.3 }, { pos: [-1.0, -0.15, 5.0], comp: 'engL', r: 0.3 }],
  mounts: [{ w: 'fang', pos: [0.4, -0.3, -4.9], comp: 'gunR', grp: 1 }, { w: 'fang', pos: [-0.4, -0.3, -4.9], comp: 'gunL', grp: 1 }],
  stores: { tick: 2, flare: 8 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-1.0, -0.15, 3.8], r: 0.8, hp: 7 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [1.0, -0.15, 3.8], r: 0.8, hp: 7 },
    { id: 'gunL', name: 'GUN L', role: 'gun', pos: [-0.4, -0.3, -3.0], r: 0.6, hp: 5 },
    { id: 'gunR', name: 'GUN R', role: 'gun', pos: [0.4, -0.3, -3.0], r: 0.6, hp: 5 },
    { id: 'shield', name: 'SHIELD', role: 'shield', pos: [0, 0.1, 0.8], r: 0.8, hp: 8 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, 0, 1.8], r: 0.9, hp: 12 },
  ],
  shield: { fore: 10, aft: 8 }, armor: { fore: 12, aft: 10, left: 9, right: 9 }, structure: 14,
  maxSpeed: 165, aiSpeed: 120, accel: 90, turn: 2.6, sig: 0.8, flameColor: 0xffa030,
  ai: { role: 'fighter', aggr: 1.0 },
};

// ---- LEAPER: line fighter (13 m) --------------------------------------------
SHIPS.leaper = {
  id: 'leaper', name: 'FROGG LEAPER', cls: 'fighter', fac: 'frogg', role: 'FIGHTER',
  length: 13.6, half: [6.6, 2.4, 7.6], mirror: true, radius: 8,
  prims: [
    tap([0, 0.05, -3.3], 2.9, [0.25, 0.15], [2.5, 0.55], F.olive, { sh: 'd', ...skinO }),      // wide flat skull
    tap([0, -0.5, -3.5], 2.5, [0.12, 0.1], [1.9, 0.3], F.plate, { sh: 'd' }),                  // jaw
    tap([0, 0, 2.0], 3.7, [1.25, 0.7], [1.15, 0.66], F.skin, { sh: 'e', ...skinO }),           // torso
    ell([0, -0.62, 0.7], [0.95, 0.5, 2.0], F.belly, { col2: F.belly2, mot: 1.5 }),             // throat sac
    ell([1.0, 0.45, 1.4], [0.5, 0.42, 0.8], F.sac, { col2: F.sac2, mot: 2, dots: { col: F.venom, p: 0.05 } }),
    ...fEye(1.75, 0.5, -2.2),
    seg([0.4, 0.62, -1.7], [2.3, 0.7, -3.6], 0.13, 0.04, F.plate2),                            // brow
    ...fFangs(-6.0, 1.6, 5, 0.8, 0.08, -0.28),
    seg([0.65, -0.42, -4.4], [0.65, -0.42, -6.5], 0.12, 0.09, F.dark),                         // mouth guns
    tap([0, 0.75, 1.6], 3.0, [0.08, 0.15], [0.08, 0.5], F.plate, { sh: 'd' }),                  // dorsal ridge
    ...fSpines(-1.2, 3.8, 6, 0.8, 0.8),
    ...fWing(1.0, 5.7, 2.8, 2.4, 0.5, 0.12, 0.8, -0.1),
    ...fLeg([1.3, -0.1, 3.0], [3.0, -0.35, 4.6], [2.2, -0.2, 6.0], 0.5, 0.42, 0.5),
    ...fHorn([[0.4, 0.1, 5.0], [0.2, 0.0, 6.2], [0.0, 0.3, 7.3]], [0.3, 0.16, 0.02]),
  ],
  engines: [{ pos: [2.2, -0.2, 6.8], comp: 'engR', r: 0.5 }, { pos: [-2.2, -0.2, 6.8], comp: 'engL', r: 0.5 }],
  mounts: [{ w: 'spit', pos: [0.65, -0.42, -6.6], comp: 'gunR', grp: 1 }, { w: 'spit', pos: [-0.65, -0.42, -6.6], comp: 'gunL', grp: 1 }],
  stores: { tick: 2, flare: 10 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-2.2, -0.25, 5.2], r: 1.1, hp: 10 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [2.2, -0.25, 5.2], r: 1.1, hp: 10 },
    { id: 'gunL', name: 'GUN L', role: 'gun', pos: [-0.65, -0.4, -4.4], r: 0.8, hp: 8 },
    { id: 'gunR', name: 'GUN R', role: 'gun', pos: [0.65, -0.4, -4.4], r: 0.8, hp: 8 },
    { id: 'shield', name: 'SHIELD', role: 'shield', pos: [0, 0.2, 1.2], r: 1.1, hp: 12 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, 0, 2.8], r: 1.2, hp: 18 },
  ],
  shield: { fore: 16, aft: 14 }, armor: { fore: 25, aft: 20, left: 18, right: 18 }, structure: 25,
  maxSpeed: 120, aiSpeed: 85, accel: 65, turn: 1.7, sig: 1, flameColor: 0xffa030,
  ai: { role: 'fighter', aggr: 0.8 },
};

// ---- SPITTER: gunship (16 m) — dorsal acid cannon ---------------------------
SHIPS.spitter = {
  id: 'spitter', name: 'FROGG SPITTER', cls: 'fighter', fac: 'frogg', role: 'GUNSHIP',
  length: 16, half: [7.6, 3.2, 9.0], mirror: true, radius: 9.5,
  prims: [
    tap([0, 0, -3.7], 3.3, [0.3, 0.25], [2.4, 0.95], F.skin, { sh: 'd', ...skinO }),
    tap([0, -0.8, -3.6], 2.9, [0.2, 0.15], [1.9, 0.45], F.plate, { sh: 'd' }),
    tap([0, 0, 2.3], 3.8, [2.4, 0.95], [2.1, 0.95], F.skin, { sh: 'e', ...skinO }),
    ell([0, -0.95, 0.3], [1.5, 0.85, 2.7], F.belly, { col2: F.belly2, mot: 1.4 }),
    ell([0, -0.3, -2.0], [1.1, 0.8, 1.6], F.sac, { col2: F.sac2, mot: 2, dots: { col: F.venom, p: 0.06 } }),   // inflated throat sac
    ...fEye(1.5, 0.75, -3.0, 1.15),
    seg([0.5, 1.05, -2.4], [2.3, 1.1, -4.3], 0.15, 0.05, F.plate2),
    ...fFangs(-7.0, 1.9, 5, 0.9, 0.09, -0.45),
    // dorsal acid cannon: long barrel on a saddle
    tap([0, 1.1, -0.5], 2.3, [0.8, 0.45], [0.9, 0.55], F.plate, { sh: 'h' }),
    seg([0, 1.35, -2.0], [0, 1.35, -8.6], 0.42, 0.3, F.dark),
    seg([0, 1.35, -5.2], [0, 1.35, -5.5], 0.6, 0.6, F.plate2),
    ell([0, 1.35, -8.7], [0.34, 0.34, 0.14], F.venom, { glow: true }),
    seg([1.6, -0.5, -5.2], [1.6, -0.5, -8.0], 0.14, 0.1, F.dark),
    tap([0, 1.0, 3.0], 3.2, [0.1, 0.2], [0.1, 0.7], F.plate, { sh: 'd' }),
    ...fSpines(0.5, 5.5, 6, 1.0, 1.0, 0.13),
    ...fWing(1.8, 6.8, 3.8, 2.6, 0.9, 0.16, 0.6, -0.15),
    ...fLeg([1.9, -0.3, 3.8], [4.0, -0.7, 5.8], [2.8, -0.3, 7.2], 0.75, 0.6, 0.72),
    ...fHorn([[0.5, 0.2, 6.0], [0.3, 0.0, 7.4], [0.0, 0.4, 8.6]], [0.4, 0.22, 0.02]),
  ],
  engines: [{ pos: [2.8, -0.3, 8.4], comp: 'engR', r: 0.72 }, { pos: [-2.8, -0.3, 8.4], comp: 'engL', r: 0.72 }],
  mounts: [
    { w: 'spitcannon', pos: [0, 1.35, -8.8], comp: 'cannon', grp: 1 },
    { w: 'fang', pos: [1.6, -0.5, -8.0], comp: 'gunR', grp: 2 }, { w: 'fang', pos: [-1.6, -0.5, -8.0], comp: 'gunL', grp: 2 },
  ],
  stores: { tick: 2, flare: 10 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-2.8, -0.3, 6.2], r: 1.4, hp: 14 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [2.8, -0.3, 6.2], r: 1.4, hp: 14 },
    { id: 'cannon', name: 'ACID CANNON', role: 'gun', pos: [0, 1.2, -3.0], r: 1.4, hp: 20 },
    { id: 'gunL', name: 'GUN L', role: 'gun', pos: [-1.6, -0.5, -5.5], r: 0.8, hp: 8 },
    { id: 'gunR', name: 'GUN R', role: 'gun', pos: [1.6, -0.5, -5.5], r: 0.8, hp: 8 },
    { id: 'shield', name: 'SHIELD', role: 'shield', pos: [0, 0.3, 1.6], r: 1.4, hp: 16 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, 0, 3.2], r: 1.6, hp: 26 },
  ],
  shield: { fore: 30, aft: 24 }, armor: { fore: 38, aft: 30, left: 30, right: 30 }, structure: 38,
  maxSpeed: 90, aiSpeed: 66, accel: 50, turn: 1.1, sig: 1.3, flameColor: 0xffa030,
  ai: { role: 'gunship', aggr: 0.6 },
};

// ---- TOAD: torpedo bomber (19 m) --------------------------------------------
const toadWarts = [[1.9, 0.9, -0.3, 0.33], [-1.7, 1.0, 0.8, 0.3], [0.8, 1.35, 1.8, 0.36], [2.4, 0.5, 2.2, 0.3], [0.2, 1.2, -1.4, 0.26],
  [1.3, 1.15, 3.4, 0.28], [2.7, 0.2, 0.6, 0.27], [1.0, 1.4, 0.2, 0.3], [2.0, 0.95, 4.2, 0.25]];
SHIPS.toad = {
  id: 'toad', name: 'FROGG TOAD', cls: 'fighter', fac: 'frogg', role: 'TORPEDO BOMBER',
  length: 19, half: [8.8, 3.6, 10.4], mirror: true, radius: 11,
  prims: [
    tap([0, 0, -4.4], 3.0, [0.4, 0.3], [2.9, 1.5], F.skin, { sh: 'd', ...skinO }),
    tap([0, -1.1, -4.3], 2.7, [0.3, 0.2], [2.2, 0.55], F.plate, { sh: 'd' }),
    ell([0, 0.1, 1.8], [3.3, 1.9, 5.3], F.skin, { col2: F.skin2, mot: 1.2 }),                  // bloated body
    ell([0, -0.6, 2.4], [2.5, 1.5, 4.2], F.belly, { col2: F.belly2, mot: 1.3 }),
    ...toadWarts.map(([x, y, z, r]) => ell([x, y, z], [r, r * 0.9, r], F.olive2, { col2: F.sac })),
    ...fEye(1.9, 1.15, -3.5, 1.2),
    seg([0.6, 1.5, -2.8], [2.8, 1.55, -4.5], 0.18, 0.05, F.plate2),
    ...fFangs(-7.4, 2.2, 5, 1.0, 0.11, -0.7),
    // armour carapace plates
    tap([0, 1.9, 2.0], 4.0, [1.8, 0.35], [2.2, 0.4], F.plate, { sh: 'h', col2: F.plate2, mot: 2 }),
    tap([0, 2.0, 2.0], 0.15, [2.25, 0.4], [2.25, 0.4], F.plate2, { sh: 'h' }),
    tap([0, 2.0, 4.0], 0.15, [2.2, 0.4], [2.2, 0.4], F.plate2, { sh: 'h' }),
    ...fSpines(-1.0, 6.0, 5, 2.2, 1.1, 0.16),
    // slung torpedo ("tadpole"): cradle, body, tail
    seg([0, -2.2, -1.5], [0, -2.2, 5.5], 0.52, 0.42, F.sac, { col2: F.sac2, mot: 2 }),
    seg([0, -2.2, -2.8], [0, -2.2, -1.5], 0.08, 0.52, F.bone),
    ...chain([[0, -2.2, 5.5], [0, -2.1, 6.8], [0, -1.8, 8.2]], [0.4, 0.22, 0.04], F.sac2),
    ell([0, -2.2, -2.7], [0.22, 0.22, 0.2], F.venom, { glow: true }),
    seg([0.9, -1.6, -0.5], [0.4, -2.1, -0.5], 0.14, 0.1, F.plate), seg([0.9, -1.6, 4.0], [0.4, -2.1, 4.0], 0.14, 0.1, F.plate),
    ...fWing(2.6, 8.0, 4.4, 2.6, 0.9, 0.2, 0.55, 0.1),
    ...fLeg([2.5, -0.2, 4.6], [5.2, -0.6, 6.6], [3.6, -0.3, 8.0], 0.95, 0.75, 0.85),
    seg([1.0, 0.1, -4.8], [1.0, 0.1, -7.6], 0.13, 0.09, F.dark),
  ],
  engines: [{ pos: [3.6, -0.3, 9.4], comp: 'engR', r: 0.85 }, { pos: [-3.6, -0.3, 9.4], comp: 'engL', r: 0.85 }],
  mounts: [
    { w: 'fang', pos: [1.0, 0.1, -7.6], comp: 'gunR', grp: 1 }, { w: 'fang', pos: [-1.0, 0.1, -7.6], comp: 'gunL', grp: 1 },
    { w: 'tad', pos: [0, -2.2, -2.9], comp: 'rack', grp: 3, store: 'tad' },
  ],
  stores: { tad: 2, flare: 16 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.6, -0.3, 7.0], r: 1.6, hp: 18 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.6, -0.3, 7.0], r: 1.6, hp: 18 },
    { id: 'gunL', name: 'GUN L', role: 'gun', pos: [-1.0, 0.1, -4.8], r: 0.9, hp: 8 },
    { id: 'gunR', name: 'GUN R', role: 'gun', pos: [1.0, 0.1, -4.8], r: 0.9, hp: 8 },
    { id: 'rack', name: 'TORP RACK', role: 'gun', pos: [0, -2.0, 1.5], r: 1.6, hp: 20 },
    { id: 'shield', name: 'SHIELD', role: 'shield', pos: [0, 0.6, 0.5], r: 1.6, hp: 16 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, 0.2, 3.0], r: 2.0, hp: 34 },
  ],
  shield: { fore: 26, aft: 22 }, armor: { fore: 45, aft: 38, left: 38, right: 38 }, structure: 55,
  maxSpeed: 78, aiSpeed: 58, accel: 40, turn: 0.9, sig: 1.4, flameColor: 0xffa030,
  ai: { role: 'bomber', aggr: 0.3 },
};

// ---- REAVER: heavy assault fighter (19 m) -----------------------------------
SHIPS.reaver = {
  id: 'reaver', name: 'FROGG REAVER', cls: 'fighter', fac: 'frogg', role: 'HEAVY FIGHTER',
  length: 19, half: [9.6, 3.6, 10.8], mirror: true, radius: 11.5,
  prims: [
    tap([0, 0, -4.4], 3.8, [0.3, 0.25], [2.5, 1.0], F.skin2, { sh: 'd', col2: F.plate2, mot: 1.3 }),
    tap([0, -0.9, -4.5], 3.2, [0.2, 0.15], [2.0, 0.45], F.plate, { sh: 'd' }),
    tap([0, 0, 3.0], 4.2, [2.5, 1.0], [2.9, 1.2], F.skin, { sh: 'e', ...skinO }),
    ell([0, -1.0, 1.4], [1.6, 0.8, 3.0], F.belly, { col2: F.belly2, mot: 1.4 }),
    // flank armour plates + shoulder missile pods
    tap([2.4, 0.3, 1.5], 3.0, [0.2, 0.85], [0.2, 0.9], F.plate, { sh: 'h' }),
    tap([2.7, 0.55, 3.5], 1.0, [0.55, 0.55], [0.6, 0.6], F.sac, { sh: 'e', col2: F.sac2, mot: 2 }),
    ell([2.7, 0.55, 2.4], [0.32, 0.3, 0.14], F.venom, { glow: true }),
    ...fEye(1.6, 0.8, -3.4, 1.15),
    seg([0.5, 1.1, -2.7], [2.2, 1.2, -4.6], 0.16, 0.05, F.plate2),
    // crest horns
    ...fHorn([[1.0, 0.9, -1.5], [1.9, 1.7, -0.2], [2.4, 2.8, 1.4], [2.3, 3.4, 3.2]], [0.38, 0.3, 0.2, 0.02]),
    ...fHorn([[0.5, 0.95, 0.5], [0.8, 1.9, 1.8], [0.7, 2.7, 3.4]], [0.3, 0.2, 0.02]),
    ...fFangs(-7.9, 2.0, 5, 1.1, 0.11, -0.6),
    seg([1.2, -0.55, -5.0], [1.2, -0.55, -8.8], 0.16, 0.12, F.dark),
    seg([2.4, -0.4, -2.4], [2.4, -0.4, -6.2], 0.15, 0.11, F.dark),
    tap([0, 1.0, 3.0], 3.6, [0.1, 0.2], [0.1, 0.8], F.plate, { sh: 'd' }),
    ...fSpines(0.0, 6.8, 7, 1.15, 1.1, 0.15),
    ...fWing(2.8, 8.4, 4.2, 2.9, 0.8, 0.2, 0.7, -0.2),
    ...fLeg([2.2, -0.2, 4.4], [4.6, -0.6, 6.8], [3.2, -0.3, 8.3], 0.9, 0.72, 0.8),
    ...fLeg([1.0, -0.5, 5.0], [1.8, -1.0, 6.9], [1.3, -0.5, 8.6], 0.55, 0.45, 0.5),
    ...fHorn([[0.5, 0.2, 7.0], [0.3, 0.0, 8.6], [0.0, 0.4, 10.0]], [0.4, 0.2, 0.02]),
  ],
  engines: [
    { pos: [3.2, -0.3, 9.8], comp: 'engR', r: 0.8 }, { pos: [-3.2, -0.3, 9.8], comp: 'engL', r: 0.8 },
    { pos: [1.3, -0.5, 9.9], comp: 'engR', r: 0.5 }, { pos: [-1.3, -0.5, 9.9], comp: 'engL', r: 0.5 },
  ],
  mounts: [
    { w: 'fang', pos: [1.2, -0.55, -8.8], comp: 'gunR', grp: 1 }, { w: 'fang', pos: [-1.2, -0.55, -8.8], comp: 'gunL', grp: 1 },
    { w: 'spit', pos: [2.4, -0.4, -6.2], comp: 'gunR', grp: 2 }, { w: 'spit', pos: [-2.4, -0.4, -6.2], comp: 'gunL', grp: 2 },
  ],
  stores: { tick: 4, flare: 12 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.0, -0.3, 7.0], r: 1.8, hp: 18 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.0, -0.3, 7.0], r: 1.8, hp: 18 },
    { id: 'gunL', name: 'GUNS L', role: 'gun', pos: [-1.8, -0.4, -4.5], r: 1.3, hp: 14 },
    { id: 'gunR', name: 'GUNS R', role: 'gun', pos: [1.8, -0.4, -4.5], r: 1.3, hp: 14 },
    { id: 'shield', name: 'SHIELD', role: 'shield', pos: [0, 0.3, 1.8], r: 1.6, hp: 20 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, 0, 3.6], r: 1.9, hp: 30 },
  ],
  shield: { fore: 40, aft: 40 }, armor: { fore: 45, aft: 40, left: 38, right: 38 }, structure: 60,
  maxSpeed: 95, aiSpeed: 66, accel: 50, turn: 1.15, sig: 1.3, flameColor: 0xffa030,
  ai: { role: 'fighter', aggr: 0.9 },
};

// ---- GULPER: escort corvette (66 m) -----------------------------------------
SHIPS.gulper = {
  id: 'gulper', name: 'FROGG GULPER', cls: 'corvette', fac: 'frogg', role: 'ESCORT CORVETTE',
  length: 66, half: [17, 13, 38], mirror: true, radius: 40,
  prims: [
    // body: long toad torso, flattened
    ell([0, 0, 6], [9.5, 5.2, 24], F.skin, { col2: F.skin2, mot: 0.8 }),
    ell([0, -2.2, 6], [8.2, 3.8, 21], F.belly, { col2: F.belly2, mot: 0.8 }),
    // head: broad diamond-section skull, huge maw
    tap([0, 0.6, -21], 11, [1.0, 0.8], [10.0, 4.4], F.olive, { sh: 'd', ...skinO }),
    tap([0, -2.6, -21], 10, [0.6, 0.4], [8.2, 1.6], F.plate, { sh: 'd' }),
    tap([0, -1.2, -28], 4.5, [0.4, 0.4], [6.0, 1.0], 0x120c07, { sh: 'd' }),                    // dark maw / hangar throat
    ...fFangs(-31, 7.0, 9, 3.0, 0.4, -1.0),
    ...fFangs(-30.2, 6.2, 8, 2.2, 0.3, -3.0).map(p => ({ ...p, a: [p.a[0], -3.2, p.a[2]], b: [p.b[0], -1.6, p.b[2] - 0.6] })),
    // eyes = bridge
    ell([5.6, 4.2, -17], [2.8, 2.4, 3.2], F.eye, { col2: F.skin, mot: 1.5 }),
    ell([5.9, 5.0, -19.6], [1.7, 0.45, 1.2], F.eyeGlow, { glow: true, rot: [0, 0.3, 0.4] }),
    seg([2.0, 5.6, -13], [9.5, 6.4, -21], 0.7, 0.2, F.plate2),
    // throat sac / reactor bulb (rust, glowing flecks)
    ell([0, -4.6, -8], [5.0, 3.2, 9.0], F.sac, { col2: F.sac2, mot: 1.2, dots: { col: F.venom, p: 0.025 } }),
    // dorsal ridge and turret spines
    tap([0, 5.1, 6], 16, [0.35, 0.5], [0.35, 1.8], F.plate, { sh: 'd' }),
    ...fSpines(-6, 24, 12, 5.2, 3.6, 0.45),
    ...[[3.6, 4.4, -2], [-3.6, 4.4, -2], [3.4, 4.5, 14], [-3.4, 4.5, 14]].map(p => ell(p, [1.1, 0.8, 1.1], F.plate, { noMirror: true })),
    // lash cannons at the jaw corners
    seg([5.5, -2.4, -22], [5.5, -2.4, -35], 0.7, 0.55, F.dark),
    seg([5.5, -2.4, -27], [5.5, -2.4, -28], 1.0, 1.0, F.plate2),
    ell([5.5, -2.4, -35.1], [0.55, 0.55, 0.25], F.venom, { glow: true }),
    // folded hind legs = engines
    ...fLeg([7.5, -1.0, 16], [13.5, -2.4, 22], [9.5, -1.0, 30], 3.0, 2.4, 2.7),
    ...fLeg([3.2, -2.5, 20], [5.2, -3.8, 26], [3.8, -2.2, 33], 1.7, 1.4, 1.5),
    // webbed fins
    ...fWing(8.6, 16.5, 8, 7, 2, 0.5, 0.35, 1.2),
    ...fHorn([[0.5, 0.5, 28], [0.3, -0.5, 33], [0, 0.5, 36.5]], [1.5, 0.8, 0.05]),
  ],
  engines: [
    { pos: [9.5, -1.0, 35.4], comp: 'engR', r: 2.7 }, { pos: [-9.5, -1.0, 35.4], comp: 'engL', r: 2.7 },
    { pos: [3.8, -2.2, 36.0], comp: 'engR', r: 1.5 }, { pos: [-3.8, -2.2, 36.0], comp: 'engL', r: 1.5 },
  ],
  mounts: [
    { w: 'lash', pos: [5.5, -2.4, -35.3], comp: 'lashR', grp: 1 }, { w: 'lash', pos: [-5.5, -2.4, -35.3], comp: 'lashL', grp: 1 },
  ],
  turrets: [
    { w: 'sting', pos: [3.6, 5.0, -2], comp: 'tur1', side: 1 }, { w: 'sting', pos: [-3.6, 5.0, -2], comp: 'tur2', side: 1 },
    { w: 'sting', pos: [3.4, 5.1, 14], comp: 'tur3', side: 1 }, { w: 'sting', pos: [-3.4, 5.1, 14], comp: 'tur4', side: 1 },
  ],
  stores: { tad: 4, flare: 0 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-9.5, -1.0, 27], r: 3.6, hp: 90 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [9.5, -1.0, 27], r: 3.6, hp: 90 },
    { id: 'lashL', name: 'LASH L', role: 'gun', pos: [-5.5, -2.4, -24], r: 2.4, hp: 70 },
    { id: 'lashR', name: 'LASH R', role: 'gun', pos: [5.5, -2.4, -24], r: 2.4, hp: 70 },
    { id: 'tur1', name: 'STING 1', role: 'turret', pos: [3.6, 5.0, -2], r: 1.5, hp: 26 },
    { id: 'tur2', name: 'STING 2', role: 'turret', pos: [-3.6, 5.0, -2], r: 1.5, hp: 26 },
    { id: 'tur3', name: 'STING 3', role: 'turret', pos: [3.4, 5.1, 14], r: 1.5, hp: 26 },
    { id: 'tur4', name: 'STING 4', role: 'turret', pos: [-3.4, 5.1, 14], r: 1.5, hp: 26 },
    { id: 'shield', name: 'SHIELD GLAND', role: 'shield', pos: [0, 1.5, 0], r: 3.4, hp: 110 },
    { id: 'eyes', name: 'EYES', role: 'radar', pos: [0, 4.2, -17], r: 7.0, hp: 90 },
    { id: 'power', name: 'HEART', role: 'power', pos: [0, -1, 8], r: 4.2, hp: 230 },
  ],
  shield: { fore: 200, aft: 160 }, armor: { fore: 170, aft: 130, left: 140, right: 140 }, structure: 380,
  maxSpeed: 34, aiSpeed: 26, accel: 6, turn: 0.2, sig: 4, flameColor: 0xffa030,
  ai: { role: 'corvette' },
};

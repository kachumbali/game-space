// ======================================================================
//  SHIP DEFINITIONS  — Colonial Defence Force (human)
//  ship space: -Z nose, +Y up, mirrored about X.  Units are metres.
// ======================================================================
const SHIPS = {};
const K = { // Kestrel palette (grey/white with ochre accents)
  hull: 0x727a84, hull2: 0x626a74, hull3: 0x8a919a, dark: 0x3a4048, white: 0xd5d9dc, canopy: 0x1c2a36, amber: 0xc79a3a,
};
const H = { // palette
  hull: 0x9aa3ad, hull2: 0x838d99, dark: 0x3a4049, panel: 0x5b6572, red: 0xc8402f, canopy: 0x3aa8dc,
  nozzle: 0x2a2d33, white: 0xc9ccd0, navy: 0x2f4a7a, orange: 0xd9772b, glow: 0x7fd0ff, amber: 0xffc060,
};
// ---- Human fighters, 2026-11-12 rebuild in the approved fleet language (docs/DESIGN_VEHICLES_AND_LOADOUTS.md): modular blocky hulls in off-white
// and grey, graphite mechanisms, restrained orange bands; round drive pods on real spars; every gun, rack and turret seat sits on structure.
// Data (mounts, engines, comps, stations, launch points, eye) is unchanged in data/db.json; these prims are built around those positions.
const CF = { w: 0xd9dcd5, g1: 0xbfc3bd, g2: 0x9aa3a2, g3: 0x737d7e, dk: 0x2c3337, gr: 0x1d2124, or: 0xd9772b, can: 0x22394a, noz: 0x15181c, red: 0xc33a2a };
// A round drive pod: intake ring, body, orange band, graphite exhaust collar and the nozzle glow(s) at the engine positions from the database.
const cfPod = (x, y, z0, z1, r0, r1, glows, band = 0.32) => {
  const zc = (z0 + z1) / 2, hz = (z1 - z0) / 2, bz = z0 + (z1 - z0) * band, rb = r0 + (r1 - r0) * band + 0.06;
  return [
    tap([x, y, zc], hz, [r0, r0], [r1, r1], CF.w, { sh: 'e' }),
    tap([x, y, z0 + 0.06], 0.1, [r0 * 0.9, r0 * 0.9], [r0 * 0.94, r0 * 0.94], CF.gr, { sh: 'e' }),
    tap([x, y, bz], Math.max(0.14, hz * 0.09), [rb, rb], [rb, rb], CF.or, { sh: 'e' }),
    tap([x, y, z1 + 0.12], 0.14, [r1 * 1.02, r1 * 1.02], [r1 * 0.94, r1 * 0.94], CF.gr, { sh: 'e' }),
    ...glows.map(([gx, gy, gr]) => ell([gx, gy, z1 + 0.24], [gr * 0.9, gr * 0.9, 0.08], H.glow, { glow: true })),
  ];
};
const cfMissile = (x, y, z0, z1, r) => [                      // a missile on its rail: white body, red seeker, graphite pylon above
  seg([x, y, z0 + r * 2], [x, y, z1], r, r, CF.w),
  seg([x, y, z0], [x, y, z0 + r * 2], 0.02, r, CF.red),
  tap([x, y + r + 0.08, (z0 + z1) / 2], (z1 - z0) / 2 * 0.7, [0.04, 0.08], [0.04, 0.08], CF.gr, { ax: 'y' }),
];

SHIPS.kestrel = {
  ...DB.ships.kestrel,
  prims: [
    // modular fuselage: angled nose wedge, cockpit section, long central body, tapering aft section, graphite belly keel
    tap([0, -0.15, -3.6], 1.1, [0.24, 0.16], [0.72, 0.46], CF.w, { sh: 'h' }),
    tap([0, 0, -1.3], 1.2, [0.72, 0.46], [1.15, 0.58], CF.g1, { sh: 'h' }),
    tap([0, 0, 1.6], 1.7, [1.15, 0.58], [1.3, 0.6], CF.w, { sh: 'r' }),
    tap([0, 0, 4.35], 1.3, [1.3, 0.6], [0.8, 0.44], CF.g2, { sh: 'h' }),
    tap([0, -0.58, 0.6], 3.6, [0.55, 0.12], [0.8, 0.12], CF.g3, { sh: 'r' }),
    tap([0, -0.12, -4.75], 0.12, [0.1, 0.08], [0.24, 0.16], CF.gr, { sh: 'h' }),              // radar tip
    { t: 'paint', box: [-0.78, -0.65, -2.74, 0.78, 0.53, -2.50], col: CF.or, mix: 1 },                 // orange nose band
    // single-seat canopy with a graphite frame, dorsal spine module with access panels
    ell([0, 0.55, -2.2], [0.44, 0.32, 1.0], CF.can, { glow: false }),
    tap([0, 0.56, -2.2], 0.05, [0.48, 0.34], [0.48, 0.34], CF.dk, { sh: 'e' }),
    tap([0, 0.66, 0.9], 1.6, [0.48, 0.17], [0.6, 0.2], CF.g1, { sh: 'r' }),
    ...rungs(0, 0.86, 0.0, 1.8, 4, 0.3, 0.04, 0.05, CF.g3, { lod: 2 }),
    // stub wings carry the wing-tip HE cannons; a box spar carries each drive pod
    tap([2.6, -0.05, 2.3], 2.4, [1.45, 0.16], [0.95, 0.11], CF.g2, { ax: 'x', sweep: 0.22 }),
    tap([2.2, 0.0, 4.2], 1.1, [0.85, 0.3], [0.85, 0.3], CF.g3, { ax: 'x' }),
    // wing-tip MK-30 HE cannon pods (muzzle at the mount, z 0.6)
    tap([4.95, -0.04, 2.15], 1.15, [0.22, 0.22], [0.28, 0.26], CF.g1, { sh: 'h' }),
    seg([4.95, -0.04, 1.05], [4.95, -0.04, 0.72], 0.11, 0.09, CF.gr),
    seg([4.95, -0.04, 0.72], [4.95, -0.04, 0.62], 0.16, 0.16, CF.gr),
    // drive pods: one round pod per side around both nozzles
    ...cfPod(3.65, -0.05, 1.9, 6.2, 0.95, 1.15, [[3.35, 0.5, 0.46], [3.9, -0.6, 0.42]]),
    tap([3.6, -1.27, 5.5], 0.18, [0.19, 0.92], [0.19, 0.92], CF.g3, { noDetail: true }),
    tap([3.65, 1.43, 4.7], 0.95, [0.85, 0.2], [0.42, 0.14], CF.g1, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.18] }),
    tap([3.65, 2.25, 5.15], 0.12, [0.42, 0.15], [0.38, 0.14], CF.or, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.18] }),
    // under-nose guns: MK-20 cannon left, MD-9 mag driver right, each in its own housing
    tap([-0.62, -0.5, -2.8], 1.6, [0.2, 0.18], [0.3, 0.26], CF.g2, { sh: 'h', noMirror: true }),
    seg([-0.62, -0.48, -4.35], [-0.62, -0.48, -6.25], 0.08, 0.07, CF.gr, { noMirror: true }),
    seg([-0.62, -0.48, -6.25], [-0.62, -0.48, -6.42], 0.13, 0.13, CF.gr, { noMirror: true }),
    tap([0.6, -0.5, -2.6], 1.3, [0.22, 0.2], [0.3, 0.26], CF.g2, { sh: 'h', noMirror: true }),
    seg([0.6, -0.45, -3.85], [0.6, -0.45, -4.5], 0.12, 0.11, CF.gr, { noMirror: true }),
    ...[-4.0, -4.3].map(z => tap([0.6, -0.45, z], 0.05, [0.18, 0.18], [0.18, 0.18], CF.g3, { sh: 'e', noMirror: true })),
    // missiles: S1 (4 x SW-9) and M1 (2 x LN-3) racks under the right wing, mirrored rails on the left
    ...cfMissile(2.25, -0.4, 0.55, 2.4, 0.09), ...cfMissile(1.75, -0.36, 1.35, 3.0, 0.08),
    tap([2.25, -0.24, 1.73], 0.45, [0.15, 0.18], [0.15, 0.18], CF.gr),
    // nav lights, antenna, markings
    ell([-5.2, 0, 2.6], [0.09, 0.06, 0.09], 0xff3030, { glow: true, noMirror: true }),
    ell([5.2, 0, 2.6], [0.09, 0.06, 0.09], 0x30ff60, { glow: true, noMirror: true }),
    seg([0, 0.86, 2.2], [0, 1.35, 2.9], 0.03, 0.02, CF.dk, { lod: 2 }),
    { t: 'paint', box: [2.0, -0.3, 2.9, 4.4, 0.3, 3.25], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'paint', box: [0.75, -0.2, 3.0, 1.15, 0.6, 3.5], col: CF.or, side: 'side', mix: 0.85 },
    { t: 'text', c: [1.12, 0.1, 1.4], face: '+x', text: 'CDF', px: 0.075, col: CF.dk },
    { t: 'text', c: [3.0, 0.1, 2.0], face: '+y', text: '07', px: 0.1, col: CF.dk, mir: false },
    { t: 'text', c: [-3.0, 0.1, 2.0], face: '+y', text: '07', px: 0.1, col: CF.dk, mir: false },
  ],
};

SHIPS.merlin = {
  ...DB.ships.merlin,
  prims: [
    // slim arrow fuselage: long nose, compact cockpit, short tail between the pods
    tap([0, -0.08, -2.8], 1.4, [0.14, 0.11], [0.55, 0.36], CF.w, { sh: 'h' }),
    tap([0, 0, 0.0], 1.4, [0.55, 0.36], [0.68, 0.4], CF.g1, { sh: 'h' }),
    tap([0, 0, 2.7], 1.3, [0.68, 0.4], [0.5, 0.32], CF.w, { sh: 'h' }),
    tap([0, -0.38, 0.4], 2.6, [0.3, 0.08], [0.4, 0.08], CF.g3, { sh: 'r' }),
    tap([0, -0.08, -4.25], 0.08, [0.06, 0.05], [0.14, 0.11], CF.gr, { sh: 'h' }),
    ell([0, 0.38, -1.3], [0.3, 0.24, 0.8], CF.can, { glow: false }),
    tap([0, 0.4, -1.3], 0.04, [0.33, 0.25], [0.33, 0.25], CF.dk, { sh: 'e' }),
    tap([0, 0.44, 1.0], 0.9, [0.3, 0.1], [0.36, 0.12], CF.g1, { sh: 'r' }),
    // twin MK-20 barrels in nose housings (muzzles at z -4.75)
    tap([0.55, -0.28, -2.3], 1.1, [0.14, 0.13], [0.2, 0.18], CF.g2, { sh: 'h' }),
    seg([0.55, -0.3, -3.4], [0.55, -0.3, -4.6], 0.07, 0.06, CF.gr),
    seg([0.55, -0.3, -4.6], [0.55, -0.3, -4.72], 0.1, 0.1, CF.gr),
    // short swept wings with orange tips; spar to the pods
    tap([1.9, -0.1, 1.5], 1.6, [0.95, 0.1], [0.42, 0.06], CF.g2, { ax: 'x', sweep: 0.42 }),
    tap([0.95, 0.05, 2.9], 0.4, [0.7, 0.18], [0.7, 0.18], CF.g3, { ax: 'x' }),
    // round drive pods
    ...cfPod(1.5, 0.15, 1.3, 4.5, 0.45, 0.58, [[1.5, 0.15, 0.5]]),
    tap([1.5, 0.85, 3.5], 0.5, [0.6, 0.06], [0.3, 0.05], CF.g1, { ax: 'y', sweep: 0.6 }),
    tap([1.5, 1.3, 3.8], 0.08, [0.3, 0.05], [0.28, 0.05], CF.or, { ax: 'y', sweep: 0.6 }),
    // S1 station: two SW-9 on the right wing rail, mirrored rail left
    ...cfMissile(1.7, -0.32, 0.3, 1.6, 0.07),
    ell([-3.4, -0.1, 2.2], [0.07, 0.05, 0.07], 0xff3030, { glow: true, noMirror: true }),
    ell([3.4, -0.1, 2.2], [0.07, 0.05, 0.07], 0x30ff60, { glow: true, noMirror: true }),
    { t: 'paint', box: [-0.35, 0.0, -3.0, 0.35, 0.5, -2.7], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'paint', box: [2.6, -0.4, 1.6, 3.5, 0.3, 2.2], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'text', c: [0.7, 0.05, 1.4], face: '+x', text: 'CDF', px: 0.06, col: CF.dk },
  ],
};

SHIPS.bittern = {
  ...DB.ships.bittern,
  prims: [
    // broad load-bearing fuselage: armoured nose with the two HE cannons, cockpit block, centre body, tail section
    tap([0, 0, -9.0], 1.8, [0.95, 0.75], [2.0, 1.45], CF.w, { sh: 'h' }),
    tap([0, 0, -3.0], 4.2, [2.0, 1.45], [2.4, 1.6], CF.g1, { sh: 'h' }),
    tap([0, 0, 4.4], 3.2, [2.4, 1.6], [1.6, 1.2], CF.w, { sh: 'h' }),
    tap([0, 0.2, 8.8], 1.2, [1.6, 1.2], [1.0, 0.8], CF.g2, { sh: 'r' }),
    tap([0, -1.45, -1.0], 6.5, [1.4, 0.2], [1.6, 0.22], CF.g3, { sh: 'r' }),
    tap([0, 0.05, -10.8], 0.15, [0.5, 0.4], [0.95, 0.75], CF.gr, { sh: 'h' }),
    { t: 'paint', box: [-2.1, -1.6, -7.25, 2.1, 1.6, -6.85], col: CF.or, mix: 1 },
    // tandem canopy for pilot and weapons officer on a raised cockpit block
    tap([0, 1.1, -6.2], 1.7, [1.1, 0.55], [1.35, 0.6], CF.g1, { sh: 'h' }),
    ell([0, 1.62, -6.3], [0.95, 0.6, 1.7], CF.can, { glow: false }),
    ...[-7.2, -5.5].map(z => tap([0, 1.62, z], 0.05, [0.98, 0.62], [0.98, 0.62], CF.dk, { sh: 'e' })),
    // HE cannon housings either side of the nose (muzzles at z -10.9)
    tap([1.6, -0.8, -8.9], 1.6, [0.3, 0.28], [0.45, 0.4], CF.g2, { sh: 'h' }),
    seg([1.6, -0.8, -10.45], [1.6, -0.8, -10.8], 0.13, 0.12, CF.gr),
    seg([1.6, -0.8, -10.8], [1.6, -0.8, -10.88], 0.18, 0.18, CF.gr),
    // torpedo cassettes: a graphite magazine frame either side of the belly, three rounds visible on the outer face,
    // the launch mouths at the front (launch points z -5.2)
    tap([3.0, -1.7, -1.6], 3.4, [1.0, 0.85], [1.0, 0.85], CF.gr, { sh: 'r' }),
    tap([3.0, -1.7, -4.95], 0.12, [1.05, 0.9], [1.05, 0.9], CF.g3, { sh: 'r' }),
    ...[-1.15, -1.7, -2.25].flatMap(y => [
      seg([3.98, y, -4.6], [3.98, y, 1.4], 0.22, 0.22, CF.w),
      tap([3.98, y, -1.6], 0.14, [0.24, 0.24], [0.24, 0.24], CF.or, { sh: 'e' }),
    ]),
    tap([2.1, -0.9, -1.6], 3.0, [0.2, 0.3], [0.2, 0.3], CF.g3, { sh: 'r' }),             // cassette shoulder to the hull
    // stub wings and the spars that carry the drive pods
    tap([4.2, -0.4, 1.8], 2.2, [2.0, 0.25], [1.0, 0.15], CF.g2, { ax: 'x', sweep: 0.35 }),
    tap([3.1, 0.3, 7.2], 1.3, [1.5, 0.4], [1.5, 0.4], CF.g3, { ax: 'x' }),
    // drive pods: one large round pod per side around both nozzles
    ...cfPod(4.4, 0.3, 4.4, 10.7, 1.5, 1.8, [[3.6, 0.3, 0.9], [5.2, 0.3, 0.9]], 0.25),
    tap([4.4, 2.5, 8.8], 1.4, [1.2, 0.23], [0.6, 0.18], CF.g1, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.12] }),
    tap([4.4, 3.75, 9.5], 0.14, [0.6, 0.19], [0.55, 0.17], CF.or, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.12] }),
    // PD turret seats: dorsal behind the canopy line, ventral under the tail (turret heads come from makeTurret)
    tap([0, 1.45, 5.6], 0.7, [0.62, 0.28], [0.62, 0.28], CF.g3, { sh: 'h' }),
    tap([0, -1.45, 5.0], 0.7, [0.62, 0.28], [0.62, 0.28], CF.g3, { sh: 'h' }),
    // S1 rail outside the right cassette
    ...cfMissile(3.0, -2.45, -5.2, -3.6, 0.1).slice(0, 2),
    ell([-6.4, -0.4, 2.6], [0.12, 0.08, 0.12], 0xff3030, { glow: true, noMirror: true }),
    ell([6.4, -0.4, 2.6], [0.12, 0.08, 0.12], 0x30ff60, { glow: true, noMirror: true }),
    seg([0, 1.43, 1.0], [0, 2.4, 2.0], 0.11, 0.075, CF.dk, { lod: 2 }),
    { t: 'paint', box: [-0.6, 1.0, 2.0, 0.6, 1.8, 3.2], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'paint', box: [4.8, -0.6, 2.0, 6.4, 0.2, 2.8], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'text', c: [2.42, 0.4, -2.0], face: '+x', text: 'CDF', px: 0.14, col: CF.dk },
    { t: 'text', c: [1.7, 0.4, 3.0], face: '+x', text: '21', px: 0.16, col: CF.dk },
  ],
};

// ---- CSS HALBERD: Aegis-class escort corvette, 2026-11-12 rebuild in the fleet language (authored at 64 m, scaled to 200 m by tuning.scaleTo, owner 2026-11-12):
// a long boxy hull with a stepped superstructure, armoured weapon sponsons, a dorsal rail spine and three round nozzles in an aft engine raft.
// A capital turret seat: an armoured box plinth with a graphite ring. D is the turret diameter at the authored scale; dy is +1 dorsal, -1 ventral.
const cfSeat = (x, y, z, dy, D, col = CF.g2) => [
  tap([x, y - dy * D * 0.1, z], D * 0.52, [D * 0.58, D * 0.13], [D * 0.58, D * 0.13], col, { sh: 'h', noMirror: true }),
  tap([x, y - dy * D * 0.0, z], D * 0.46, [D * 0.5, D * 0.04], [D * 0.5, D * 0.04], CF.gr, { sh: 'e', noMirror: true }),
];
const hSeat = (x, y, z, dy = 1, cls = 'S') => { const L = TUNE.scaleTo.halberd || 64; return cfSeat(x, y, z, dy, turretDia({ def: { length: L } }, { cls }) * 64 / L); };
SHIPS.halberd = {
  ...DB.ships.halberd,
  prims: [
    // pressure hull: one long chamfered box, a stepped bow and a graphite ventral keel
    tap([0, 0, -1], 23, [2.7, 2.0], [3.4, 2.6], CF.w, { sh: 'h', seam: [2.4, 3.2] }),
    tap([0, -0.1, -28], 4, [0.9, 0.9], [2.7, 2.0], CF.g1, { sh: 'h' }),
    tap([0, -0.2, -31.6], 0.5, [0.55, 0.5], [0.9, 0.9], CF.g3, { sh: 'h' }),
    tap([0, -2.3, 4], 16, [1.6, 0.5], [1.9, 1.0], CF.dk, { sh: 'h' }),                                   // ventral keel (PD seats at z -6 and 14)
    tap([0, -2.3, -27], 2.8, [1.1, 1.1], [1.25, 1.2], CF.g3, { sh: 'h' }),                               // GA-9 rotary housing under the bow
    seg([0, -2.3, -29.4], [0, -2.3, -30.5], 0.55, 0.45, CF.gr), tap([0, -2.3, -30.4], 0.3, [0.7, 0.7], [0.66, 0.66], CF.noz, { sh: 'e' }),
    // dorsal rail spine: an armoured trough from the superstructure to the bow, twin rails ending at the database mounts (z -31)
    tap([0, 2.0, -15], 14, [0.9, 0.8], [1.6, 0.6], CF.g2, { sh: 'h' }),
    seg([0.7, 2.95, -4], [0.7, 2.95, -30.6], 0.3, 0.26, CF.gr, { noMirror: true }),
    seg([-0.7, 2.95, -4], [-0.7, 2.95, -30.6], 0.3, 0.26, CF.gr, { noMirror: true }),
    ...[-27, -21, -15, -9].map(z => tap([0, 2.7, z], 0.35, [1.3, 0.45], [1.3, 0.45], CF.g3, { sh: 'h' })),   // rail clamps
    tap([0, 2.95, -30.6], 0.45, [1.25, 0.45], [1.25, 0.45], CF.noz, { sh: 'h' }),
    // forward weapon sponsons carry the M pulse turrets (x 2.6, y 1.85)
    tap([0, 1.35, -12], 3.4, [3.05, 0.45], [3.05, 0.45], CF.g1, { sh: 'h' }),
    tap([3.05, 0, -12], 3.6, [0.5, 1.8], [0.5, 1.8], CF.g2, { sh: 'h' }),
    // stepped superstructure: two decks, the bridge block with windows, and a mast
    tap([0, 2.85, 5.3], 8.3, [2.3, 0.85], [2.6, 0.85], CF.w, { sh: 'h' }),
    tap([0, 3.9, 9.5], 4, [1.9, 0.6], [2.2, 0.6], CF.g1, { sh: 'h' }),
    tap([0, 5.0, 9.5], 2.4, [1.5, 0.7], [1.9, 0.75], CF.w, { sh: 'h', win: { col: H.amber, p: 0.75, f: 1.6, o: 2, pu: 4, wu: 2, pv: 4 } }),
    tap([0, 5.05, 7.25], 0.52, [1.55, 0.35], [1.55, 0.35], CF.can, { sh: 'h' }),
    seg([0, 5.4, 11.3], [0, 9.7, 11.3], 0.38, 0.23, CF.g3), ell([0, 9.7, 11.3], [1.3, 0.16, 1.3], CF.g1),
    seg([0, 7.6, 11.3], [1.6, 7.9, 11.3], 0.16, 0.12, CF.g3),
    // after deck carries the dorsal PD pair (x 2.2, y 3.1, z 19) and the VLS rack
    tap([0, 2.75, 18.5], 4.6, [2.75, 0.33], [2.85, 0.33], CF.g1, { sh: 'h' }),
    // side sponsons with hatches and an orange band
    tap([3.35, -0.2, 2.5], 7.5, [0.45, 1.5], [0.5, 1.6], CF.g1, { sh: 'h' }),
    tap([3.85, -0.2, 0], 2.6, [0.06, 0.9], [0.06, 0.9], CF.gr),                                          // service hatch
    tap([3.85, -0.2, 7], 1.2, [0.06, 0.8], [0.06, 0.8], CF.gr),
    { t: 'paint', box: [-2.95, -2.2, -21.45, 2.95, 2.2, -20.55], col: CF.or, mix: 1 },
    { t: 'paint', box: [-3.4, -2.7, 14.0, 3.4, 2.7, 15.0], col: CF.or, mix: 1 },
    // engine raft: a graphite frame with three round nozzles at the database engine positions
    tap([0, 0, 27], 4, [3.6, 2.5], [5.4, 2.4], CF.g2, { sh: 'h' }),
    tap([0, 0, 30.4], 1.4, [2.3, 2.3], [2.3, 2.3], CF.gr, { sh: 'e' }), tap([0, 0, 30.8], 0.9, [2.45, 2.45], [2.2, 2.2], CF.or, { sh: 'e' }),
    ell([0, 0, 31.85], [1.75, 1.75, 0.25], H.glow, { glow: true }),
    tap([3.9, 0, 30.3], 1.3, [1.5, 1.5], [1.5, 1.5], CF.gr, { sh: 'e' }),
    ell([3.9, 0, 31.65], [1.15, 1.15, 0.22], H.glow, { glow: true }),
    // compact radiator fins on the raft flanks
    tap([6.05, 0, 26], 1.95, [1.8, 0.21], [1.4, 0.13], CF.w, { ax: 'x', seam: [0.5, 0.7], noDetail: true }),
    tap([6.7, 0.12, 26], 1.3, [1.7, 0.05], [1.3, 0.04], CF.or, { ax: 'x' }),
    // turret seats: M pulse, dorsal and ventral PD
    ...hSeat(2.6, 1.85, -12, 1, 'M'), ...hSeat(-2.6, 1.85, -12, 1, 'M'), ...hSeat(2.2, 3.1, 19), ...hSeat(-2.2, 3.1, 19),
    ...hSeat(0, -2.8, -6, -1), ...hSeat(0, -3.3, 14, -1),
    // detail: VLS cells, hatch lights, nav lights, markings
    ...paintGrid(-1.0, 3.08, 14.5, 4, 5, 0.5, 0.55, 0.36, 0.38, CF.gr, { mix: 0.9 }),
    ...[-1.5, 0, 1.5].map(z => ell([3.88, 1.1, z], [0.1, 0.08, 0.1], H.amber, { glow: true, glowF: 1.5, lod: 2 })),
    ...ringSegs(0, 0, 23.5, 30.5, 2.48, 16, 0.26, CF.g3, { lod: 2 }),
    tap([3.72, 1.36, 2], 0.22, [0.3, 0.32], [0.3, 0.32], CF.g3),
    ell([-3.9, 1.6, 2], [0.22, 0.2, 0.22], 0xff3030, { glow: true, noMirror: true }),
    ell([3.9, 1.6, 2], [0.22, 0.2, 0.22], 0x30ff60, { glow: true, noMirror: true }),
    { t: 'text', c: [3.42, 0.55, -17], face: '+x', text: 'CSS HALBERD', px: 0.34, col: CF.dk },
    { t: 'text', c: [3.84, -0.9, 3.8], face: '+x', text: 'F-71', px: 0.45, col: CF.dk },
    { t: 'text', c: [0, 3.72, 3], face: '+y', text: 'CDF', px: 0.6, col: CF.dk, mir: false },
  ],
};

// ---- EXETER class frigate (450 m): jump-capable, docks 2 corvettes + 12 fighters/drones (no repair) -------------
// Inspiration: angular grey/white wedge hull, dorsal slab, outboard engine pods on pylons, folded radiator panels,
// PD turret clusters. Owner brief 2026-10-21. Catalogue model: not used in missions yet.
const E = { white: CF.w, grey: CF.g1, grey2: CF.g2, dark: CF.dk, panel: CF.g3, amber: 0xc79a3a, noz: CF.noz, glow: 0x7fd0ff, orange: CF.or };   // fleet palette (2026-11-12)
SHIPS.tern = {
  ...DB.ships.tern,
  prims: [
    // Narrow spine and raised bridge dome
    tap([0, 0, 0.5], 13.5, [2.0, 1.65], [2.2, 1.8], E.grey, { sh: 'h' }),
    tap([0, -1.25, -1], 13, [1.45, 0.5], [1.55, 0.5], E.dark, { sh: 'h' }),
    tap([0, 0.45, -8], 4, [1.8, 1.5], [2, 1.5], E.grey2, { sh: 'h' }),
    tap([0, 1.9, -13], 2.4, [1.7, 1.25], [1.5, 1.1], E.white, { sh: 'h' }),
    ell([0, 2.45, -13.4], [1.25, 0.5, 0.85], E.panel),
    ell([0, 2.3, -14.05], [0.75, 0.2, 0.12], E.glow, { glow: true }),
    // Six container sections per pod, linked back to the spine by paired pylons
    ...[-8.5, -5.5, -2.5, 0.5, 3.5, 6.5].map((z, i) =>
      tap([6.2, 0.3, z], 1.4, [1.75, 1.65], [1.75, 1.65], i % 2 ? E.orange : E.grey2, { sh: 'h' })),
    tap([6.2, 0.3, -1], 9, [1.2, 1.0], [1.2, 1.0], E.panel),  // longitudinal container frame
    ...[-6, 4].flatMap(z => [
      seg([1.6, 0.85, z], [5.4, 0.85, z], 0.45, 0.42, E.grey),
      seg([1.6, -0.55, z], [5.4, -0.55, z], 0.43, 0.38, E.panel),
    ]),
    ...[-8.5, -5.5, -2.5, 0.5, 3.5, 6.5].map(z =>
      ell([8.0, 1.05, z], [0.16, 0.14, 0.22], E.amber, { glow: true, glowF: 1.4 })),
    // Dorsal racks hold two rows of three static SD-4 silhouettes
    ...[-6, 0, 6].flatMap(z => [
      tap([1.7, 1.85, z], 2.15, [1.18, 0.68], [1.18, 0.68], E.grey2, { sh: 'h' }),
      tap([2.6, 2.8, z], 2.45, [0.62, 0.48], [0.62, 0.48], E.white, { sh: 'h' }),
      tap([2.6, 2.8, z - 2.05], 0.35, [0.34, 0.3], [0.34, 0.3], E.dark, { sh: 'e' }),
      ...[-2.35, 2.35].flatMap(dz => [
        seg([1.9, 3.9, z + dz], [3.35, 3.9, z + dz], 0.15, 0.15, E.dark),
        seg([1.9, 3.9, z + dz], [2.23, 2.95, z + dz], 0.16, 0.18, E.dark),
        seg([3.35, 3.9, z + dz], [2.97, 2.95, z + dz], 0.16, 0.18, E.dark),
      ]),
    ]),
    // Stowed transfer booms and hose reels
    seg([8.3, 0.05, -6.5], [8.3, 0.05, -1], 0.24, 0.2, E.dark),
    seg([8.3, 0.05, -6.1], [8.3, 0.05, -2.3], 0.1, 0.1, E.grey),
    tap([8.3, 0.05, -6.5], 0.45, [0.4, 0.38], [0.4, 0.38], E.amber, { sh: 'h' }),
    ell([6.2, 1.75, -8.25], [0.65, 0.3, 0.55], E.panel),
    tap([6.2, 1.75, -8.27], 0.46, [0.57, 0.57], [0.57, 0.57], E.dark, { sh: 'e' }),
    // Reactor hatch and ventral shield projector
    tap([0, 2.05, 8.5], 0.8, [0.9, 0.28], [0.9, 0.28], E.panel, { sh: 'h' }),
    tap([0, -1.89, 2], 0.75, [0.62, 0.34], [0.62, 0.34], E.panel),
    ell([0, -2.25, 2], [0.75, 0.28, 0.75], E.glow, { glow: true }),
    // Three aft nozzles aligned with the database engine positions
    tap([0, 0, 14.8], 2.7, [1.8, 1.6], [1.8, 1.6], E.grey2, { sh: 'h' }),
    tap([0, 0, 16.25], 0.9, [0.95, 0.85], [0.95, 0.85], E.noz, { sh: 'e' }),
    ell([0, 0, 17.05], [0.72, 0.72, 0.18], E.glow, { glow: true }),
    tap([2.1, 0.2, 15.45], 1.5, [0.9, 0.62], [0.9, 0.62], E.grey2, { ax: 'x' }),
    tap([3.4, 0.2, 15.8], 1.35, [0.88, 0.82], [0.92, 0.86], E.noz, { sh: 'e' }),
    ell([3.4, 0.2, 16.85], [0.65, 0.62, 0.16], E.glow, { glow: true }),
    // Port and starboard navigation lights
    seg([7.6, 0.3, 7.55], [8.45, 0.3, 7.65], 0.19, 0.14, E.panel),
    ell([-8.45, 0.3, 7.65], [0.15, 0.15, 0.15], 0x30ff60, { glow: true, noMirror: true }),
    ell([8.45, 0.3, 7.65], [0.15, 0.15, 0.15], 0xff3030, { glow: true, noMirror: true }),
  ],
};
// A capital turret seat on a pedestal: a column from y0 (a point inside the hull or sponson) up (dy +1) or down (dy -1) to the seat at y,
// so every turret visibly stands on structure (owner report 2026-11-12: Glaive turrets floating). Listed per side (noMirror).
const capSeat = (x, y, z, dy, D, y0) => {
  const top = y - dy * D * 0.2, h = Math.abs(top - y0) / 2;
  return [
    tap([x, (top + y0) / 2, z], D * 0.42, [D * 0.42, h], [D * 0.42, h], CF.g2, { sh: 'h', noMirror: true }),
    ...cfSeat(x, y, z, dy, D),
  ];
};
const eTur = (x, y, z, dy, cls, y0) => capSeat(x, y, z, dy, turretDia({ def: { length: 450 } }, { cls }), y0);
// ---- Exeter surface-detail prims (metres; voxel size at high detail is about 1 m) --------------------------------------
const exeterDetail = [
  // dorsal slab: VLS lattices, long trench with ribs, comm farm
  ...paintGrid(-14, 17, -12, 5, 10, 5.5, 5.5, 3.6, 3.6, 0x16191d, { mix: 0.9 }),
  ...paintGrid(-14, 17, 100, 5, 9, 5.5, 5.5, 3.6, 3.6, 0x16191d, { mix: 0.9 }),
  ...rungs(0, 18.3, -150, 60, 22, 2.8, 0.7, 0.5, E.dark, { lod: 2 }),
  tap([0, 17.2, -30], 180, [2.2, 1.2], [2.2, 1.2], E.dark, { sh: 'r', lod: 2 }),
  // bridge tower: lit windows, sensor spines, dishes
  tap([14, 41, 74], 6, [4, 8], [4, 8], E.grey2, { sh: 'h', lod: 2, noDetail: true }),
  tap([12, 41, 84], 5, [3, 6], [3, 6], E.grey2, { sh: 'h', lod: 2, noDetail: true }),
  ell([14, 49, 74], [9, 1.1, 9], E.white, { rot: [0.5, 0, 0.3], lod: 2 }), ell([-12, 46, 84], [7, 1, 7], E.white, { rot: [-0.4, 0, -0.3], lod: 2 }),
  ...[-6, 0, 6].map(x => seg([x, 36, 70], [x, 52, 68], 1.25, 0.65, E.dark, { lod: 2 })),
  tap([0, 31, 78], 6, [14, 2], [14, 2], E.panel, { sh: 'h', lod: 2 }),
  // hangar maw: frame, hazard lights, interior glow
  ...Array.from({ length: 9 }, (_, i) => ell([-16 + i * 4, -1.5, -204], [0.8, 0.6, 0.8], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  ...Array.from({ length: 9 }, (_, i) => ell([-16 + i * 4, -12.5, -204], [0.8, 0.6, 0.8], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  tap([0, -7, -199], 3, [17, 8.5], [17, 8.5], E.dark, { sh: 'h', lod: 2 }),
  ...[-12, -4, 4, 12].map(x => tap([x, -7, -192], 12, [0.8, 6.5], [0.8, 6.5], E.panel, { lod: 2 })),
  // corvette cradles: clamp arms, guide lights
  ...[-14, 0, 14, 28].map(z => seg([49, -11, 26 + z], [55, -10, 26 + z], 1.5, 1.1, E.panel, { lod: 2 })),
  ...[-14, 0, 14, 28].map(z => ell([53.4, -1, 26 + z], [0.9, 0.9, 0.9], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  // radiator manifolds and ribs
  ...Array.from({ length: 8 }, (_, i) => seg([44, 12.4, 108 + i * 6], [96, 12.4, 112 + i * 6], 0.7, 0.7, i % 2 ? E.dark : E.orange, { lod: 2 })),
  ...Array.from({ length: 8 }, (_, i) => seg([44, -12.4, 108 + i * 6], [96, -12.4, 112 + i * 6], 0.7, 0.7, i % 2 ? E.dark : E.orange, { lod: 2 })),
  // engine pods: intake ring, band plates, nozzle petals
  tap([80, -3, 104], 1.5, [16, 14], [16, 14], E.panel, { sh: 'h', lod: 2 }),
  ...[120, 140, 160, 180, 200].map(z => tap([80, -3, z], 0.8, [20.5, 18], [20.5, 18], E.grey2, { sh: 'h', lod: 2 })),
  ...ringSegs(80, -3, 221, 228, 14, 18, 0.7, E.noz, { lod: 2 }),
  ...ringSegs(0, 0, 204, 214, 26, 22, 1.0, 0x3e454e, { lod: 2 }),
  ...[208, 211].map(z => tap([0, 0, z], 1.7, [26.5, 26.5], [26.5, 26.5], E.grey2, { sh: 'e', lod: 2 })),
  // markings
  { t: 'paint', box: [-46, -10, -130, 46, 24, -124], col: E.orange, mix: 0.9 },
  { t: 'paint', box: [-46, -10, -112, 46, 24, -109], col: 0x2f4a7a, mix: 0.9 },
  { t: 'paint', box: [-26, 12, -190, 26, 30, -160], col: E.panel, side: 'top', mix: 0.7 },
  { t: 'text', c: [30, 3, -62], face: '+x', text: 'EXETER', px: 3.2, col: E.dark },
  { t: 'text', c: [52.2, 6, 0], face: '+x', text: 'F-03', px: 4, col: E.dark },
  { t: 'text', c: [0, 18.4, -100], face: '+y', text: 'CDF', px: 3.5, col: 0x2f4a7a, mir: false },
];

SHIPS.exeter = {
  ...DB.ships.exeter,
  prims: [
    // 2026-11-12 fleet-language rebuild: a white wedge hull, a dorsal launcher slab, armoured flank sponsons that carry the outboard
    // batteries, a stepped bridge tower and round engine pods on pylons. Every turret stands on a pedestal rooted in hull or sponson.
    tap([0, 0, 10], 185, [22, 12], [46, 22], E.white, { sh: 'h', seam: [9, 7] }),                          // wedge hull
    tap([0, 13.5, 0], 150, [20, 4], [34, 5], E.grey, { sh: 'h' }),                                          // dorsal launcher slab
    tap([0, 17.8, -20], 110, [12, 0.8], [20, 0.8], E.panel, { sh: 'r' }),                                   // slab inlay
    tap([38, -1, -10], 100, [13, 15], [14, 17], E.grey, { sh: 'h', seam: [8, 6] }),                         // flank sponson
    { t: 'paint', box: [47, -4, -106, 53, 2, 86], col: E.orange, side: '+x', mix: 1 },                                    // sponson band
    tap([0, -2, -200], 28, [9, 6], [22, 12], E.grey2, { sh: 'd' }),                                         // bow wedge
    tap([0, -7, -186], 14, [13, 4.5], [14, 5], CF.gr, { dots: { col: E.amber, p: 0.05 } }),                 // hangar maw
    // Swept gussets keep the paired bow rails rooted on the taper without obstructing the hangar.
    tap([11, 3.5, -208], 19, [5.5, 2.3], [5.5, 2.3], E.grey, { sweep: -0.06, sh: 'h' }),
    tap([15.5, 8.5, -188], 20, [7, 3], [7, 3], E.grey, { sweep: -0.10, sh: 'h' }),
    seg([14, 4, -195], [16, 5, -226], 1.6, 1.4, E.dark), seg([20, 10, -170], [22, 11, -207], 1.6, 1.4, E.dark),
    tap([0, -19, -20], 40, [10, 4], [14, 6], E.grey2, { sh: 'h' }),                                         // ventral sensor keel
    // stepped bridge tower and mast
    tap([0, 24, 72], 26, [15, 8], [19, 9], E.white, { sh: 'h', win: { col: 0xffd890, p: 0.7, f: 1.5, o: 1, pu: 5, wu: 3, pv: 4 } }),
    tap([0, 35, 78], 12, [11, 4], [13, 4], E.grey, { sh: 'h' }),
    tap([0, 35.5, 66.5], 0.8, [10.5, 2], [10.5, 2], CF.can, { sh: 'h' }),
    seg([0, 39, 82], [0, 68, 82], 1.5, 0.5, E.panel), ell([0, 68, 82], [8, 1.2, 8], E.grey),
    seg([8, 38, 84], [20, 62, 92], 0.7, 0.3, E.panel),
    // corvette cradles on the sponson flanks (comps cradleL/R)
    tap([52, -7, 40], 30, [1.2, 8], [1.2, 8], CF.gr, { dots: { col: E.amber, p: 0.05 } }),
    // radiator panels (folded white, orange edge)
    tap([70, 12, 130], 26, [36, 0.5], [24, 0.4], E.white, { ax: 'x', sweep: 0.2, seam: [6, 8] }),
    tap([70, -12, 130], 26, [36, 0.5], [24, 0.4], E.white, { ax: 'x', sweep: 0.2, seam: [6, 8] }),
    tap([70, 12.2, 130], 26, [1.2, 0.6], [1.2, 0.5], E.orange, { ax: 'x', sweep: 0.2 }),
    // nacelle pylons and round engine pods (engines at x 80, z 229)
    tap([53, -4, 158], 22, [15, 5], [15, 5], E.grey2, { sh: 'h' }), tap([60, 4, 150], 18, [5, 3], [5, 3], E.grey2, { sh: 'h' }),
    tap([80, -3, 160], 56, [16, 16], [18, 18], E.white, { sh: 'e', seam: [8, 6] }),
    tap([80, -3, 106], 4, [14, 14], [15, 15], CF.gr, { sh: 'e', dots: { col: E.amber, p: 0.05 } }),
    tap([80, -3, 130], 4, [17.4, 17.4], [17.6, 17.6], E.orange, { sh: 'e' }),
    tap([80, -3, 220], 6, [17, 17], [14, 14], CF.gr, { sh: 'e' }),
    ell([80, -3, 227.5], [11, 11, 2.5], E.glow, { glow: true }),
    seg([88, 3, 190], [106, 3, 228], 0.8, 0.3, E.panel),
    // central engine block
    tap([0, 0, 200], 14, [30, 17], [28, 16], E.grey2, { sh: 'h' }),
    tap([0, 0, 214], 1.5, [26, 15], [26, 15], CF.gr, { sh: 'h' }),
    ell([0, 0, 216], [20, 12, 2.5], E.glow, { glow: true }),
    // turret seats on pedestals: S pulse and PD, L mass drivers, M lasers (heads come from makeTurret)
    ...eTur(0, 24, -110, 1, 'S', 14), ...eTur(24, 22.4, -40, 1, 'M', 12), ...eTur(-24, 22.4, -40, 1, 'M', 12),
    ...eTur(20, 28.7, 110, 1, 'S', 14), ...eTur(-20, 28.7, 110, 1, 'S', 14),
    ...eTur(0, -22.4, -80, -1, 'S', -12),
    ...eTur(40, 23, -90, 1, 'L', 10), ...eTur(-40, 23, -90, 1, 'L', 10), ...eTur(36, -25, 30, -1, 'L', -12), ...eTur(-36, -25, 30, -1, 'L', -12),
    ...eTur(48, 21, 0, 1, 'M', 10), ...eTur(-48, 21, 0, 1, 'M', 10), ...eTur(14, 26, 130, 1, 'M', 14), ...eTur(-14, 26, 130, 1, 'M', 14),
    ...eTur(44, -21.2, 60, -1, 'M', -10), ...eTur(-44, -21.2, 60, -1, 'M', -10), ...eTur(14, -26.5, 120, -1, 'M', -14), ...eTur(-14, -26.5, 120, -1, 'M', -14),
    seg([0, -2, -196], [0, -2, -206], 7, 5.5, E.dark), ell([0, -2, -207], [5, 5, 2], E.glow, { glow: true }),   // XL mass driver muzzle on the bow face
    ...exeterDetail,
  ],
};

// ---- HECLA strategic tender (1 km owner decision, scaled from the 4 km brief) -------------
const HECLA_SCALE = 0.25;
const hPos = p => p.map(v => v * HECLA_SCALE);
const hTap = (c, hz, h0, h1, col, o = {}) =>
  tap(hPos(c), hz * HECLA_SCALE, h0.map(v => v * HECLA_SCALE), h1.map(v => v * HECLA_SCALE), col, o);
const hEll = (c, r, col, o = {}) => ell(hPos(c), r.map(v => v * HECLA_SCALE), col, o);
const hSeg = (a, b, ra, rb, col, o = {}) =>
  seg(hPos(a), hPos(b), ra * HECLA_SCALE, rb * HECLA_SCALE, col, o);

SHIPS.hecla = {
  ...DB.ships.hecla,
  prims: [
    // Armoured keel, bow citadel, command tower, and broad stern block.
    hTap([0, 0, -25], 1675, [90, 75], [90, 75], E.grey, { sh: 'h', noMirror: true, seam: [20, 15] }),
    hTap([0, -8, -1775], 175, [120, 105], [70, 65], E.grey2, { sh: 'd', noMirror: true }),
    hTap([0, -4, -1975], 25, [70, 65], [48, 48], E.white, { sh: 'd', noMirror: true }),
    hTap([0, 0, 1805], 155, [230, 110], [210, 105], E.grey2, { sh: 'h', noMirror: true }),
    hTap([0, 0, 0], 180, [72, 58], [72, 58], E.panel, { sh: 'h', noMirror: true }),
    hTap([0, 147, -1780], 38, [45, 30], [45, 30], E.grey2, { ax: 'y', sh: 'h', noMirror: true }),
    hTap([0, 174, -1780], 18, [35, 26], [35, 26], E.white, { ax: 'y', sh: 'h', noMirror: true }),
    hTap([0, 68, -1760], 22, [30, 26], [30, 26], E.panel, { ax: 'y', noMirror: true }),
    hTap([0, 5, 1190], 55, [62, 52], [62, 52], E.grey2, { sh: 'h', noMirror: true }),

    // Open slip frames: paired inner/outer rails and regularly spaced cross-arms.
    ...[124, 554].flatMap(x => [150, -150].map(y =>
      hTap([x, y, 0], 1400, [14, 14], [14, 14], E.grey, { sh: 'h' }))),
    ...Array.from({ length: 15 }, (_, i) => -1400 + i * 200).flatMap(z => [
      ...[150, -150].map(y =>
        hTap([339, y, z], 229, [14, 14], [14, 14], E.grey, { ax: 'x', sh: 'h' })),
      ...[124, 554].map(x =>
        hTap([x, 0, z], 164, [14, 14], [14, 14], E.grey, { ax: 'y', sh: 'h' })),
    ]),

    // Amber docking clamps, one pair at each station on both slips.
    ...[-900, -300, 300, 900].flatMap(z => [-55, 55].map(y =>
      hTap([200, y, z], 110, [30, 30], [30, 30], E.amber, { ax: 'x', sh: 'h' }))),
    ...[-900, -300, 300, 900].map(z =>
      hTap([200, 0, z], 55, [18, 18], [18, 18], E.grey2, { ax: 'y', sh: 'h' })),

    // Dorsal/ventral fighter hangars, with outboard-facing lit mouths.
    ...[
      [55, 90, -800], [55, -90, 800],
    ].flatMap(([x, y, z]) => [
      hTap([x, y, z], 80, [40, 15], [40, 15], E.grey2, { sh: 'h' }),
      hTap([95, y, z], 42, [24, 7], [24, 7], E.dark, { sh: 'h' }),
      hTap([103, y + Math.sign(y) * 8, z], 30, [22, 4], [22, 4], E.amber, { sh: 'h', glow: true }),
    ]),

    // Shuttle gates at the four ends of each outer rail.
    ...[-1450, 1450].flatMap(z => [-45, 45].map(y => [
      // Keep the outer gate face at its original furthest extent; the dark
      // rim and blue centre are surface markings rather than coincident caps.
      hTap([527.5, y, z], 50, [52.5, 22], [52.5, 22], E.grey2, { sh: 'h' }),
      { t: 'paint', box: [578, y - 16, z - 24, 581, y + 16, z + 24].map(v => v * HECLA_SCALE), col: E.dark, side: '+x', mix: 1 },
      { t: 'paint', box: [578, y - 12, z - 20, 581, y + 12, z + 20].map(v => v * HECLA_SCALE), col: E.glow, side: '+x', mix: 1 },
    ])).flat(),

    // Four ventral corvette racks, each with three visible guide cradles.
    ...[-430, -300, -170, 170, 300, 430].flatMap(z => [
      hTap([60, -95, z], 36, [50, 20], [50, 20], E.panel, { sh: 'h' }),
      hSeg([18, -112, z], [108, -112, z], 10, 10, E.grey2),
      { t: 'paint', box: [24, -123, z - 4, 94, -116, z + 4].map(v => v * HECLA_SCALE), col: E.amber, side: 'bottom', mix: 1 },
    ]),

    // Dorsal and ventral radiator plates around the aft machinery.
    ...[120, -120].map(y =>
      hTap([146, y, 1450], 75, [75, 6], [75, 6], E.white, { ax: 'y', sh: 'h' })),
    ...[0, 1, 2, 3, 4, 5].map(i =>
      hSeg([150, 65, 1380 + i * 28], [150, 175, 1380 + i * 28], 6, 6, i % 2 ? E.orange : E.grey2)),
    ...[0, 1, 2, 3, 4, 5].map(i =>
      hSeg([150, -65, 1380 + i * 28], [150, -175, 1380 + i * 28], 6, 6, i % 2 ? E.orange : E.grey2)),

    // Ordnance containers on the spine; leave hangars and projector stations clear.
    ...Array.from({ length: 40 }, (_, i) => -1560 + i * 80)
      .filter(z => Math.abs(z + 800) > 140 && Math.abs(z - 800) > 140 &&
        Math.abs(z + 1300) > 80 && Math.abs(z - 1150) > 80)
      .map((z, i) =>
        hTap([45, 82, z], 30, [15, 18.5], [15, 18.5], i % 2 ? E.orange : E.grey2, { sh: 'h' })),

    // Raised pads and arrays are positioned from the database so all mounts remain represented.
    ...DB.ships.hecla.turrets.flatMap(t => {
      const side = Math.sign(t.pos[1] || 1);
      const baseY = side * (Math.abs(t.pos[1]) > 40 ? 41 : 18.75);
      const gap = Math.abs(t.pos[1] - baseY);
      const pad = 0.56 * turretDia({def:{length:1000}}, t);
      return [
        ...(gap > 0 ? [tap([t.pos[0], (t.pos[1] + baseY) / 2, t.pos[2]], gap / 2,
          [pad, pad], [pad, pad], E.grey2, { ax: 'y', sh: 'h', noMirror: true })] : []),
        ell([t.pos[0], t.pos[1] - side * pad * 0.08 / 0.56, t.pos[2]],
          [pad, pad * 0.15 / 0.56, pad], t.w === 'laserM' ? E.panel : E.grey2, {noMirror:true}),
      ];
    }),
    ...DB.ships.hecla.comps.filter(c => c.role === 'shield' || c.role === 'radar').flatMap(c => {
      const r = (c.role === 'shield' ? 10 : 13) * HECLA_SCALE;
      const side = Math.sign(c.pos[1] || 1);
      const baseY = side * (Math.abs(c.pos[1]) > 40 ? 41 : 18.75);
      const gap = Math.abs(c.pos[1] - baseY);
      return [
        ...(gap > 0 ? [tap([c.pos[0], (c.pos[1] + baseY) / 2, c.pos[2]], gap / 2,
          [4.5, 4.5], [4.5, 4.5], E.grey2, { ax: 'y', sh: 'h', noMirror: true })] : []),
        tap(c.pos, r, [r, 0.75], [r, 0.75],
          c.role === 'shield' ? E.glow : E.white, { sh: 'h', noMirror: true }),
      ];
    }),
    ...DB.ships.hecla.comps.filter(c => c.id.startsWith('shb')).map(c =>
      tap(c.pos, 10, [9, 6], [9, 6], E.grey2, { sh: 'h', noMirror: true })),
    ...DB.ships.hecla.comps.filter(c => c.role === 'radiator').map(c =>
      tap(c.pos, 8, [4, 4], [4, 4], E.panel, { sh: 'h', noMirror: true })),

    // Eight exhaust housings and visible blue nozzle faces, aligned to the engine records.
    ...DB.ships.hecla.engines.flatMap(e => [
      tap([e.pos[0], e.pos[1], e.pos[2] - 5.5], 6, [6, 6], [6, 6], E.noz, { sh: 'h', noMirror: true }),
      tap([e.pos[0], e.pos[1], e.pos[2] - 2], 2, [4.25, 4.25], [4.25, 4.25], E.dark, { sh: 'h', noMirror: true }),
      ell([e.pos[0], e.pos[1], 499], [4, 4, 1], E.glow, { glow: true, noMirror: true }),
    ]),

    // Window strips and service lights keep the otherwise open frame legible.
    ...[-1450, -1250, -1050, -250, 0, 250, 1050, 1250].flatMap(z => [
      hTap([0, 77, z], 24, [32, 3], [32, 3], E.white, { sh: 'h', noMirror: true, glow: true }),
      hTap([116, 154, z], 18, [4, 4], [4, 4], E.amber, { sh: 'h', glow: true }),
    ]),
    hTap([0, 184, -1780], 18, [18, 2], [18, 2], E.amber, { sh: 'h', noMirror: true, glow: true }),
  ],
};

// ---- DRONE: unmanned 6 m wingman (docs/FLEET_LOGIC.md 9/9a). cls stays 'fighter' so fighter rules (fixed guns, PD priority, no big-ship death throes) apply;
// `drone: true` switches on the drone AI/orders (56_drones.js). No pilot, no eject, no missiles, one light gun, small shield. Cheap voxel model (resMul).
const D6 = { hull: 0xaab2bb, hull2: 0x8a929c, dark: 0x30363e, canopy: 0x2a9ad0, amber: 0xc79a3a };
SHIPS.drone = {
  ...DB.ships.drone,
  prims: [
    tap([0, 0, -1.0], 1.7, [0.16, 0.12], [0.5, 0.36], D6.hull, { sh: 'h' }),
    tap([0, 0, 1.5], 1.5, [0.5, 0.36], [0.46, 0.34], D6.hull2, { sh: 'h' }),
    ell([0, 0.22, -1.3], [0.26, 0.18, 0.6], D6.canopy, { glow: false }),
    tap([1.5, -0.02, 1.2], 1.3, [1.2, 0.15], [0.5, 0.11], D6.hull2, { ax: 'x', sweep: 0.3 }),
    tap([2.62, -0.02, 1.6], 0.23, [0.57, 0.10], [0.45, 0.08], D6.amber, { ax: 'x', sweep: 0.3 }),
    tap([0, 0, 3.0], 0.25, [0.34, 0.27], [0.3, 0.24], 0x2a2d33, { sh: 'e' }),
    ell([0, 0, 3.3], [0.24, 0.19, 0.08], 0x7fd0ff, { glow: true }),
    seg([0, -0.3, -0.6], [0, -0.32, -3.0], 0.07, 0.05, D6.dark, { noMirror: true }),
  ],
};

// ---- TENDER: unarmed fleet resupply ship (owner decision 2026-10-22: fleet tender ships for the magazine rule) ----
// Rearms friendly ships within `serviceR` (ammo pools, missile stores, XL slugs) at `tenderTick` (55_ships.js).
// Binding rule kept: rearm is not repair - structure, components and shields are NOT restored (AGENTS.md).
SHIPS.kite6 = {
  ...DB.ships.kite6,
  prims: [...SHIPS.drone.prims,
    seg([0, 0.26, 1], [0, 0.72, 1], 0.075, 0.055, D6.dark, { noMirror: true }),
    ell([0, 0.72, 1], [0.12, 0.06, 0.12], D6.canopy),
    tap([1.5, -0.16, 0.83], 0.6, [0.19, 0.19], [0.19, 0.19], D6.dark),
    seg([1.5, -0.25, 0.2], [1.5, -0.25, 1.5], 0.08, 0.08, D6.hull),
  ],
};
SHIPS.tender = {
  ...DB.ships.tender,
  prims: [
    tap([0, 0, 10], 150, [26, 16], [34, 20], E.grey, { sh: 'h', dots: { col: E.amber, p: 0.008 } }),       // long box hull
    tap([0, 8, 0], 120, [22, 5], [26, 6], E.white, { sh: 'h' }),                                          // dorsal deck
    // ordnance and supply containers (the cargo it delivers, visible per the model rules)
    ...[-60, -40, -20, 0, 20, 40, 60].flatMap(z => [
      tap([14, 13.5, z], 14, [6.5, 4], [6.5, 4], E.grey2, { sh: 'h', dots: { col: E.amber, p: 0.03 } }),
      tap([8, 12.5, z], 14, [5, 3.5], [5, 3.5], E.grey2, { sh: 'h' }),
    ]),
    ...[-40, 0, 40].map(z => ({ t: 'paint', box: [8, 15.5, z - 10, 21, 18, z + 10], side: 'top', col: E.orange, mix: 1 })),
    tap([0, -13, 10], 140, [16, 6], [20, 7], E.grey2, { sh: 'h' }),                                       // ventral cargo keel
    // bow service section: booms and cradles for alongside rearm
    tap([0, 0, -70], 24, [14, 12], [8, 7], E.grey, { sh: 'd' }),
    seg([16, 2, -62], [34, 2, -62], 1.6, 1.2, E.dark), seg([-16, 2, -62], [-34, 2, -62], 1.6, 1.2, E.dark),
    ell([36, 2, -62], [3.4, 2.2, 3.4], E.grey2), ell([-36, 2, -62], [3.4, 2.2, 3.4], E.grey2),
    // bridge tower + mast
    tap([0, 16, 50], 12, [8, 5], [10, 6], E.white, { sh: 'h', win: { col: 0xffd890, p: 0.7, f: 1.5, o: 1, pu: 5, wu: 3, pv: 4 } }),
    seg([0, 22, 52], [0, 30, 52], 0.5, 0.25, E.grey2), ell([0, 30.5, 52], [2.4, 0.3, 2.4], E.grey),
    // engine block aft
    tap([0, 0, 88], 14, [16, 13], [14, 11], E.noz, { sh: 'h' }),
    ell([12, 0, 95.5], [5.5, 5, 2], E.glow, { glow: true }), ell([-12, 0, 95.5], [5.5, 5, 2], E.glow, { glow: true }), ell([0, 0, 95.5], [6.5, 6, 2], E.glow, { glow: true }),
    // nav lights
    seg([28, 0, 60], [38, 0, 60], 1.2, 0.8, E.grey2, { noMirror: true }),
    ell([38, 0, 60], [0.8, 0.6, 0.8], 0xff3030, { glow: true, noMirror: true }),
  ],
};

// ======================================================================
//  v0.3 M4 roster: FALCHION heavy fighter, PETREL SAR CUTTER, MERIDIAN evacuation liner, GLAIVE destroyer.
//  Numbers live in data/db.json; this is geometry only. Every mount / launch / turret position below sits on a visible barrel, rack or seat.
// ======================================================================
// ---- FALCHION: two-seat heavy fighter (19.5 m), 2026-11-12 rebuild after the owner's concept (heavy two-seater with a dorsal turret):
// long armoured centre body with a tandem canopy, four forward guns (two MK-20 in the nose, two MD-9 on the wing-root booms), one round drive pod per
// side on a box spar, swept wings carrying the missile rails, two PD-15 seats (one dorsal, one ventral). Data unchanged in data/db.json.
const falSeat = (z, y, dy) => {
  const D = turretDia({def:{length:19.5}}, {cls:'S'});
  return [tap([0, y - dy * D * 0.25, z], D * 0.62, [D * 0.62, D * 0.22], [D * 0.62, D * 0.22], CF.g3, { sh: 'h' })];
};
SHIPS.falchion = {
  ...DB.ships.falchion,
  prims: [
    // centre body: nose with the radar and both MK-20s, cockpit section, armoured mid-body, tail
    tap([0, -0.2, -8.3], 1.6, [0.45, 0.35], [1.2, 0.8], CF.w, { sh: 'h' }),
    tap([0, 0, -4.6], 2.1, [1.2, 0.8], [1.6, 1.0], CF.g1, { sh: 'h' }),
    tap([0, 0, 1.0], 3.5, [1.6, 1.0], [1.7, 1.05], CF.w, { sh: 'r' }),
    tap([0, 0, 6.9], 2.4, [1.7, 1.05], [1.1, 0.8], CF.g2, { sh: 'h' }),
    tap([0, -1.0, 0.0], 7.0, [0.9, 0.12], [1.1, 0.12], CF.g3, { sh: 'r' }),
    tap([0, -0.2, -9.95], 0.12, [0.25, 0.2], [0.45, 0.35], CF.gr, { sh: 'h' }),
    { t: 'paint', box: [-1.65, -1.05, -2.61, 1.65, 1.05, -2.29], col: CF.or, mix: 1 },
    // tandem canopy (pilot ahead, weapons officer behind) on a raised cockpit block
    tap([0, 0.7, -4.4], 1.9, [0.85, 0.35], [1.0, 0.4], CF.g1, { sh: 'h' }),
    ell([0, 1.05, -5.4], [0.7, 0.45, 1.25], CF.can, { glow: false }),
    ell([0, 1.1, -3.4], [0.72, 0.45, 1.05], CF.can, { glow: false }),
    tap([0, 1.06, -4.4], 0.1, [0.76, 0.48], [0.76, 0.48], CF.dk, { sh: 'e' }),
    tap([0, 0.95, 0.6], 2.6, [0.8, 0.25], [0.9, 0.28], CF.g1, { sh: 'r' }),          // dorsal spine between the turret seats
    // nose MK-20 pair (muzzles z -10.4)
    tap([0.75, -0.55, -7.6], 1.6, [0.2, 0.18], [0.28, 0.24], CF.g2, { sh: 'h' }),
    seg([0.75, -0.55, -9.2], [0.75, -0.55, -10.22], 0.09, 0.08, CF.gr),
    seg([0.75, -0.55, -10.22], [0.75, -0.55, -10.38], 0.14, 0.14, CF.gr),
    // wing-root booms with the MD-9 mag drivers (muzzles z -7.7), coil collars
    tap([2.9, -0.45, -3.4], 3.0, [0.32, 0.3], [0.45, 0.4], CF.g1, { sh: 'h' }),
    tap([2.2, -0.35, -2.0], 0.7, [0.5, 0.25], [0.5, 0.25], CF.g3, { ax: 'x' }),
    seg([2.9, -0.45, -6.4], [2.9, -0.45, -7.55], 0.13, 0.12, CF.gr),
    ...[-6.6, -7.0].map(z => tap([2.9, -0.45, z], 0.06, [0.22, 0.22], [0.22, 0.22], CF.g3, { sh: 'e' })),
    // swept wings with orange tips carry the missile rails
    tap([4.2, -0.45, 1.6], 2.6, [2.2, 0.2], [1.0, 0.12], CF.g2, { ax: 'x', sweep: 0.35 }),
    { t: 'paint', box: [5.6, -0.8, 2.0, 7.0, 0.0, 3.4], col: CF.or, side: 'top', mix: 0.85 },
    ...cfMissile(4.6, -0.62, 0.35, 2.2, 0.09), ...cfMissile(3.5, -0.62, 0.35, 2.4, 0.09),
    // spars and round drive pods (one pod around both nozzles each side)
    tap([2.9, 0.0, 7.6], 1.4, [1.2, 0.35], [1.2, 0.35], CF.g3, { ax: 'x' }),
    ...cfPod(4.85, -0.05, 4.4, 10.2, 1.4, 1.65, [[4.0, 0.6, 0.55], [5.7, -0.7, 0.5]], 0.3),
    tap([4.85, 2.25, 8.2], 1.2, [1.1, 0.1], [0.55, 0.07], CF.g1, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.12] }),
    tap([4.85, 3.35, 8.85], 0.12, [0.55, 0.08], [0.5, 0.07], CF.or, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.12] }),
    // PD-15 seat: one dorsal turret behind the canopy (owner 2026-11-14: the ventral turret and the drones were trimmed, swarm balance)
    ...falSeat(1.2, 1.55, 1),
    tap([0, 0.95, 6.6], 1.3, [0.75, 0.22], [0.55, 0.18], CF.g1, { sh: 'h' }),
    // lights, antenna, markings
    seg([6.25, -0.45, 2.45], [7.6, -0.5, 3.0], 0.14, 0.1, CF.g3),
    ell([-7.6, -0.5, 3.0], [0.1, 0.07, 0.1], 0xff3030, { glow: true, noMirror: true }),
    ell([7.6, -0.5, 3.0], [0.1, 0.07, 0.1], 0x30ff60, { glow: true, noMirror: true }),
    seg([0, 0.95, 3.6], [0, 2.0, 4.6], 0.095, 0.065, CF.dk, { lod: 2 }),
    { t: 'paint', box: [-0.5, 0.5, -1.2, 0.5, 1.4, -0.4], col: CF.or, side: 'top', mix: 0.85 },
    { t: 'text', c: [1.72, 0.2, 1.2], face: '+x', text: 'CDF', px: 0.11, col: CF.dk },
    { t: 'text', c: [1.72, 0.2, 3.6], face: '+x', text: '11', px: 0.13, col: CF.dk },
  ],
};

// ---- PETREL SAR CUTTER (32 m, unarmed, crew 3: pilot, rescue specialist, trauma medic; docs/LORE_FACTIONS.md section 5) --------------------------
const SR = { red: 0xc8402f, orange: 0xe0702a };
SHIPS.sar = {
  ...DB.ships.sar,
  prims: [
    // bluff cockpit nose, boxy cabin, tapering tail
    tap([0, 0, -11], 5, [1.6, 1.4], [3.4, 2.6], E.white, { sh: 'h' }),
    tap([0, 0, 0.5], 8, [3.4, 2.6], [4.2, 3.0], E.white, { sh: 'h', seam: [2, 3] }),
    tap([0, 0, 12], 4, [4.2, 3.0], [3.4, 2.6], E.grey2, { sh: 'h' }),
    ell([0, 1.5, -11.5], [1.8, 1.1, 2.6], H.canopy, { glow: false }),
    tap([0, 1.3, -8.8], 0.18, [1.9, 1.1], [1.9, 1.1], E.dark, { sh: 'h' }),
    // ventral pod bay: dark bay doors with amber guide lights
    tap([0, -2.6, 1.0], 5.5, [2.8, 1.2], [3.0, 1.3], SR.orange, { sh: 'h' }),
    tap([0, -3.8, 1.0], 4.5, [2.3, 0.07], [2.3, 0.07], E.dark, { sh: 'r' }),
    ...[-3.2, 5.2].map(z => ell([1.9, -3.9, z], [0.3, 0.2, 0.3], E.amber, { glow: true, glowF: 1.4 })),
    // magnetic grapple winch under the nose: boom, reel housing and the grapple head at the bow
    seg([0, -1.5, -6], [0, -1.3, -15.4], 0.4, 0.3, E.dark),
    ell([0, -1.5, -7.2], [1.0, 0.7, 1.3], E.panel),
    ell([0, -1.3, -15.8], [0.9, 0.6, 0.5], E.amber, { glow: true }),
    // engine pods on short pylons
    tap([3.9, 0.4, 10.5], 1.9, [1.7, 0.3], [1.3, 0.22], E.grey, { ax: 'x', sweep: 0.0 }),
    tap([5.5, 0.4, 11.5], 4.5, [1.3, 1.2], [1.2, 1.1], E.grey2, { sh: 'h' }),
    tap([5.5, 0.4, 7.2], 0.1, [1.2, 1.1], [1.2, 1.1], 0x15181c, { dots: { col: E.amber, p: 0.1 } }),
    tap([5.5, 0.4, 16.0], 0.45, [1.0, 0.9], [0.9, 0.85], E.noz, { sh: 'e' }),
    ell([5.5, 0.4, 16.65], [0.75, 0.7, 0.14], E.glow, { glow: true }),
    // twin fins with orange tips, rescue beacon and spotlights
    tap([3.0, 2.8, 13], 1.8, [1.8, 0.25], [0.8, 0.22], E.white, { ax: 'y', sweep: 0.4, rot: [0, 0, -0.25] }),
    tap([3.3, 4.4, 13.6], 0.12, [0.8, 0.22], [0.6, 0.18], SR.orange, { ax: 'y', sweep: 0.4, rot: [0, 0, -0.25] }),
    seg([0, 2.6, 2], [0, 4.4, 2], 0.27, 0.22, E.dark),
    ell([0, 4.4, 2], [0.5, 0.3, 0.5], E.amber, { glow: true, glowF: 1.6 }),
    seg([1.65, 1.7, -6.5], [2.2, 2.8, -6.5], 0.31, 0.26, E.grey2),
    ell([2.2, 2.8, -6.5], [0.4, 0.25, 0.4], 0xfff0d0, { glow: true }),
    // subsystem housings
    ell([0, 3.0, -2], [1.0, 0.3, 1.0], E.panel),
    ...rungs(0, 3.0, 6.0, 10.0, 4, 1.2, 0.1, 0.05, E.dark, { lod: 2 }),
    seg([6.1, 0.4, 14.0], [7.0, 0.4, 14.0], 0.17, 0.12, E.grey2),
    ell([-7.0, 0.4, 14.0], [0.1, 0.1, 0.1], 0xff3030, { glow: true, noMirror: true }),
    ell([7.0, 0.4, 14.0], [0.1, 0.1, 0.1], 0x30ff60, { glow: true, noMirror: true }),
    // markings: orange nose and tail bands, hull SAR lettering
    { t: 'paint', box: [-4.4, -3.2, -9.0, 4.4, 3.2, -7.0], col: SR.orange, mix: 0.9 },
    { t: 'paint', box: [-4.4, -3.2, 6.5, 4.4, 3.2, 8.0], col: SR.orange, mix: 0.9 },
    { t: 'text', c: [4.25, 0.3, 0.5], face: '+x', text: 'SAR', px: 0.28, col: SR.red },
  ],
};

// ---- MERIDIAN: 450 m evacuation liner (refit passenger liner; two orange jump-coil collars; unarmed, 6 PD) ----------------------------------
const linWin = { col: 0xffd890, p: 0.6, f: 1.5, o: 1, pu: 6, wu: 3, pv: 5 };
const linTurPos = [[-35, 1], [35, 1], [190, 1], [-35, -1], [35, -1], [190, -1]];
SHIPS.liner = {
  ...DB.ships.liner,
  prims: [
    tap([0, 0, 0], 200, [22, 22], [26, 26], E.white, { sh: 'e' }),                                   // spine
    tap([0, 0, -212], 13, [8, 8], [22, 22], E.grey, { sh: 'e' }),                                    // bow taper
    ell([0, 10, -208], [14, 8, 14], E.panel),                                                        // observation dome
    // hab drums with window bands and rim plates
    ...[-140, -70, 0, 70, 140].flatMap(z => [
      tap([0, 0, z], 10, [42, 42], [42, 42], E.grey2, { sh: 'e', win: linWin }),
      tap([0, 0, z - 10], 1.2, [44.5, 44.5], [44.5, 44.5], E.panel, { sh: 'e', lod: 2 }),
      tap([0, 0, z + 10], 1.2, [44.5, 44.5], [44.5, 44.5], E.panel, { sh: 'e', lod: 2 }),
      ell([46, 0, z], [4, 3, 7], E.orange),                                                         // lifeboat blister
      ell([0, 46, z], [3.5, 4, 6], E.orange),
    ]),
    // refit: jump coil collars (the spool concept; effects are left to the campaign engine)
    ...[-105, 105].flatMap(z => [
      tap([0, 0, z], 4, [52, 52], [52, 52], E.orange, { sh: 'e', dots: { col: E.amber, p: 0.04 } }),
      ...ringSegs(0, 0, z - 5, z + 5, 51.8, 16, 1.3, E.amber, { lod: 2 }),
    ]),
    // bridge tower + mast
    tap([0, 28, -170], 12, [8, 5], [10, 6], E.white, { sh: 'h', win: { col: 0xffd890, p: 0.7, f: 1.5, o: 1, pu: 5, wu: 3, pv: 4 } }),
    seg([0, 31, -170], [0, 47.5, -170], 2.0, 1.75, E.grey2), ell([0, 47.5, -170], [5, 0.8, 5], E.white),
    // PD seats (six S turrets; the barrels are the real turret meshes)
    ...DB.ships.liner.turrets.flatMap(({ pos: [x, y, z] }) => capSeat(x, y, z, Math.sign(y), turretDia({ def: { length: 450 } }, { cls: "S" }), Math.sign(y) * 16)),   // PD seats on pedestals at the database positions
    // aft engine block with four nozzles
    tap([0, 0, 212], 12, [26, 26], [30, 30], E.grey2, { sh: 'e' }),
    ...[[15, 0], [0, 15], [0, -15]].flatMap(([x, y]) => [
      tap([x, y, 224], 5, [9, 9], [8, 8], E.noz, { sh: 'e' }),
      ell([x, y, 230.5], [7, 7, 1.6], E.glow, { glow: true }),
    ]),
    // markings: navy bow band, orange stern band, name
    { t: 'paint', box: [-30, -30, -185, 30, 30, -180], col: H.navy, mix: 0.9 },
    { t: 'paint', box: [-32, -32, 196, 32, 32, 201], col: E.orange, mix: 0.9 },
    { t: 'text', c: [25, 0, -35], face: '+x', text: 'MERIDIAN', px: 2.0, col: E.dark },
  ],
};

// ---- GLAIVE: destroyer, authored at 600 m and scaled to 720 m (owner 2026-11-12): heavy XL mass driver, 4 L mass drivers, 8 M lasers, 8 S PD, bow rails, 2 torpedo pods --------------
const dstSeat = (x, y, z, cls, y0) => { const L = TUNE.scaleTo.destroyer || 600; return capSeat(x, y, z, Math.sign(y), turretDia({ def: { length: L } }, { cls }) * 600 / L, y0); };   // authored at 600 m, scaled by tuning.scaleTo
const dstDetail = [
  // dorsal deck: VLS lattices and the long trench
  ...paintGrid(-14, 22, -60, 5, 8, 5.5, 5.5, 3.6, 3.6, 0x16191d, { mix: 0.9 }),
  tap([0, 21.6, 70], 80, [2.2, 0.8], [2.2, 0.8], E.dark, { sh: 'r', lod: 2 }),
  ...rungs(0, 22, -190, -150, 8, 8, 0.4, 0.4, E.dark, { lod: 2 }),
  // bridge tower: dishes and sensor spines
  tap([10, 36, 156], 3, [3.5, 3.5], [3.5, 3.5], E.grey2, { lod: 2 }),
  ell([10, 38, 156], [7, 1, 7], E.white, { rot: [0.4, 0, 0.3], lod: 2 }), ell([-9, 36, 142], [5, 0.9, 5], E.white, { rot: [-0.4, 0, -0.3], lod: 2 }),
  ...[-4, 0, 4].map(x => seg([x, 35, 150], [x, 42, 148], 0.45, 0.2, E.dark, { lod: 2 })),
  // torpedo pod: a dark muzzle ring at the mouth (z -258) and amber bands
  tap([22, -3, -258.2], 0.9, [2.7, 2.7], [2.7, 2.7], E.dark, { sh: 'e' }),
  ...[-250, -240, -230].map(z => tap([22, -3, z], 0.5, [3.3, 3.3], [3.3, 3.3], E.amber, { sh: 'e', lod: 2 })),
  // rail muzzle shrouds
  ...ringSegs(5, 3, -296, -304, 2.3, 8, 0.25, E.dark, { lod: 2 }),
  // engine block rims
  ...ringSegs(0, 0, 286, 296, 21, 16, 0.8, 0x3e454e, { lod: 2 }),
  // radiator manifolds
  ...Array.from({ length: 6 }, (_, i) => seg([42, 12.4, 188 + i * 7], [86, 12.4, 192 + i * 7], 0.6, 0.6, i % 2 ? E.dark : E.orange, { lod: 2 })),
  // markings
  { t: 'paint', box: [-46, -22, -132, 46, 24, -126], col: E.orange, mix: 0.9 },
  { t: 'paint', box: [-46, -22, -112, 46, 24, -108], col: 0x2f4a7a, mix: 0.9 },
  { t: 'text', c: [38.5, 2, -60], face: '+x', text: 'GLAIVE', px: 3.0, col: E.dark },
  { t: 'text', c: [38, 3, 70], face: '+x', text: 'D-07', px: 4, col: E.white },
  { t: 'text', c: [0, 22.4, -165], face: '+y', text: 'CDF', px: 3.5, col: 0x2f4a7a, mir: false },
];
SHIPS.destroyer = {
  ...DB.ships.destroyer,
  prims: [
    tap([0, 0, -235], 65, [4, 3], [34, 16], E.grey2, { sh: 'h' }),                                                   // bow wedge
    tap([0, 0, -10], 160, [34, 16], [46, 19], E.white, { sh: 'h', seam: [9, 7] }),                                  // main hull
    tap([0, 0, 220], 70, [46, 19], [40, 17], E.grey, { sh: 'h' }),                                                   // stern
    tap([0, 19.5, -20], 190, [20, 2.5], [30, 2.5], E.grey, { sh: 'h' }),                                             // dorsal deck
    tap([0, -18, 0], 200, [10, 2.6], [14, 2.6], E.grey2, { sh: 'h' }),                                               // ventral keel
    tap([0, 0, -298], 4, [4, 3], [5, 3.5], E.dark, { sh: 'd' }),                                                     // sensor prow
    // bridge tower and mast
    tap([0, 28, 150], 20, [12, 6], [16, 8], E.white, { sh: 'h', win: { col: 0xffd890, p: 0.7, f: 1.5, o: 1, pu: 5, wu: 3, pv: 4 } }),
    seg([0, 36, 156], [0, 58, 156], 1.3, 0.4, E.grey2), ell([0, 58.5, 156], [7, 1, 7], E.grey),
    // bow rails: barrels running out of the prow, breech blocks, muzzle brakes (mounts end at z -306)
    seg([5, 3, -250], [5, 3, -305], 1.6, 1.1, E.dark),
    ell([5, 3, -262], [2.6, 2.4, 6], E.panel),
    tap([5, 3, -304.5], 1.2, [1.7, 1.7], [1.7, 1.7], H.nozzle, { sh: 'e' }),
    // heavy XL mass driver (mdxh, owner 2026-11-12): a long barrel under the keel of the bow, muzzle at z -301
    seg([0, -6, -235], [0, -6, -299], 5.2, 3.8, E.dark), tap([0, -6, -300], 1.2, [4.6, 4.6], [4.4, 4.4], H.nozzle, { sh: 'e' }),
    ...[-250, -270, -290].map(z => tap([0, -6, z], 1.0, [6.0, 6.0], [6.0, 6.0], E.grey2, { sh: 'e' })),
    // torpedo pods on pylons off the bow flanks (mouths at z -258)
    seg([22, -3, -225], [22, -3, -258], 3.1, 3.0, E.white),
    seg([22, -3, -258], [22, -3, -254], 2.2, 3.0, 0xd04a3a),
    seg([14, -2, -250], [22, -3, -250], 1.2, 1.2, E.grey2), seg([17, -2, -232], [22, -3, -232], 1.2, 1.2, E.grey2),
    // turret seats: L mass drivers, M lasers, S point defence (the barrels are the real turret meshes)
    // (pedestals root every seat in hull or deck: owner report 2026-11-12, two M laser turrets floated beside the deck)
    ...dstSeat(0, 22, -140, 'L', 16), ...dstSeat(0, 22, 20, 'L', 16), ...dstSeat(0, -20.6, -60, 'L', -14), ...dstSeat(0, -20.6, 90, 'L', -14),
    ...[[30, 16.9, -90], [38, 18.4, 60]].flatMap(([x, y, z]) => [...dstSeat(x, y, z, 'M', 8), ...dstSeat(-x, y, z, 'M', 8)]),
    ...[[30, -17.2, -60], [36, -18.9, 120]].flatMap(([x, y, z]) => [...dstSeat(x, y, z, 'M', -8), ...dstSeat(-x, y, z, 'M', -8)]),
    ...[[12, 22, -190], [14, 22, 110]].flatMap(([x, y, z]) => [...dstSeat(x, y, z, 'S', 16), ...dstSeat(-x, y, z, 'S', 16)]),
    ...[[8, -20.6, -150], [8, -20.6, 150]].flatMap(([x, y, z]) => [...dstSeat(x, y, z, 'S', -14), ...dstSeat(-x, y, z, 'S', -14)]),
    // fleet bands: orange belts fore and aft, graphite deck edge
    { t: 'paint', box: [-39, -20, -153, 39, 20, -147], col: E.orange, mix: 1 },
    { t: 'paint', box: [-49, -21, 137, 49, 21, 143], col: E.orange, mix: 1 },
    // radiator panels
    tap([64, 12, 205], 24, [30, 1.3], [20, 1.1], E.white, { ax: 'x', sweep: 0.2, seam: [6, 8] }),             // thick enough for the 600 m voxel size
    tap([64, 13.2, 205], 24, [2.4, 0.9], [2.0, 0.8], E.orange, { ax: 'x', sweep: 0.2 }),
    tap([46, 12, 205], 8, [14, 3], [10, 2.5], E.grey2, { ax: 'x', sh: 'h' }),                                  // radiator root
    // engine block: central and flank nozzles at the database engine positions (z 296)
    tap([0, 0, 291], 5, [24, 15], [22, 14], E.noz, { sh: 'h' }),
    ell([0, 0, 297.5], [15, 10, 2.5], E.glow, { glow: true }),
    tap([26, 0, 291], 5, [13, 10], [12, 9], E.noz, { sh: 'e' }),
    ell([26, 0, 297.5], [10, 7, 2.5], E.glow, { glow: true }),
    ...dstDetail,
  ],
};

// Columbus fleet carrier, authored at 1 km and scaled to 1.2 km (owner 2026-11-12: Columbus class).
// The hull tapers in plan from the stern to a third of its width at a flattish nose; a submarine-style
// bridge sail stands on a low dorsal fairing aft. Six framed ventral launch wells sit under the deck.
// Hull half-width at z: 55 + 110 (z + 500) / 940; half-thickness 16 at the nose to 30 at the stern.
const cbW = z => 55 + 110 * (z + 500) / 940, cbH = z => 16 + 14 * (z + 500) / 940, cbS = 110 / 940, cbSY = 14 / 940;
SHIPS.carrier = {
  ...DB.ships.carrier,
  ordnancePlan: { ...DB.ships.carrier.ordnancePlan, droneLimit: TUNE.droneLimit.capital },
  prims: [
    tap([0, 0, -30], 470, [55, 16], [165, 30], CF.w, { sh: 'h' }),                                    // tapered pressure hull
    tap([0, -1, -496], 4, [46, 13], [50, 14], CF.g1, { sh: 'h' }),                                     // flat nose plate
    { t: 'paint', box: [0, -6, -496, cbW(-444), 0, -444], col: CF.g3, side: '+x', mix: 1 },               // nose band
    // graphite chine along the hull's widest line (the chamfered section's flat top spans only the inner 45 % of the width)
    tap([cbW(-30) - 1, 0, -30], 470, [2, 6], [2, 6], CF.g3, { sweep: cbS }),
    // flight-deck markings and a raised central service spine (trench machinery, as on the reference)
    tap([cbW(-30) * 0.32, cbH(-30) + 0.4, -30], 400, [3, 1.2], [3, 1.2], CF.or, { sweep: cbS * 0.32, sweepY: cbSY }),
    tap([0, cbH(-80) + 3, -80], 300, [9, 4], [15, 5], CF.g2, { sh: 'h', sweepY: cbSY }),
    ...[-330, -230, -130, -30, 70, 170].map(z => tap([0, cbH(z) + 6, z], 8, [12 + (z + 330) * 0.012, 3], [12 + (z + 330) * 0.012, 3], CF.g3, { sh: 'h' })),
    ...[-280, -120, 40].map(z => tap([cbW(z) * 0.3, cbH(z) + 1.5, z], 18, [8, 2], [8, 2], CF.g1, { sh: 'h' })),  // deck lifts
    // stepped dorsal superstructure aft, then the bridge tower: armoured neck and a wide T-shaped command deck
    tap([0, cbH(250) + 6, 250], 190, [40, 8], [110, 10], CF.g1, { sh: 'h' }),
    // bridge sail (owner: like a modern submarine, no planes): a tall narrow fin, elliptical in plan, slightly raked,
    // with a slit of command-deck windows near the top and masts
    tap([0, 62, 360], 32, [48, 11], [40, 9], CF.w, { ax: 'y', sh: 'e', sweep: 0.15 }),
    tap([0, 93.5, 364], 1.5, [36, 7.5], [34, 7], CF.g1, { ax: 'y', sh: 'e' }),                        // sail cap
    tap([0, 87, 326], 2, [6.5, 1.4], [6.5, 1.4], CF.can, { sh: 'r' }),                                  // command-deck windows
    seg([0, 94, 358], [0, 99.5, 358], 1.6, 1.1, CF.g3), seg([0, 94, 370], [0, 98, 370], 1.2, 0.9, CF.g3),
    seg([0, 94, 380], [0, 97, 380], 1, 0.8, CF.g2),
    // stern: engine block, four round nozzles at the database engine positions
    tap([0, 0, 465], 25, [158, 30], [148, 28], CF.g1, { sh: 'h' }),
    ...[30, 95].map(x => tap([x, 0, 478], 12, [15, 15], [14, 14], CF.noz, { sh: 'e' })),
    ...[30, 95].map(x => tap([x, 0, 466], 2.5, [17, 17], [17, 17], CF.or, { sh: 'e' })),
    // ventral launch wells: dark mouth in a graphite frame at each bay (launch points at the mouths)
    ...DB.ships.carrier.comps.filter(c => c.role === 'bay' && c.pos[0] > 0).flatMap(c => {
      const [x, , z] = c.pos, y = -cbH(z);
      return [
        tap([x, y + 4, z], 34, [19, 7.4], [19, 7.4], CF.g3, { sh: 'r', noDetail: true }),
        tap([x, y - 2.2, z], 30, [15, 1.6], [15, 1.6], CF.gr, { sh: 'r' }),
      ];
    }),
    // weapon plinths: armoured blocks from the hull surface up (or down) to just under each turret seat
    ...DB.ships.carrier.turrets.map(t => {
      const [x, y, z] = t.pos;
      const s0 = cbH(z) * (1.45 - (Math.abs(x) + 8) / cbW(z)) - 6;
      const s1 = Math.abs(y) - 1.5, c = t.side * (s0 + s1) / 2, h = (s1 - s0) / 2;
      return tap([x, c, z], 9, [8, h], [8, h], CF.g1, { sh: 'h', noMirror: true });
    }),
    ...DB.ships.carrier.turrets.flatMap(t => capSeat(t.pos[0], t.pos[1], t.pos[2], t.side, turretDia({ def: { length: 1200 } }, t) / 1.2, t.side * (cbH(t.pos[2]) - 4))),
  ],
};

// Recessed cell covers are paint on existing hull voxels: they cannot float
// independently of the pressure hull. Positions are the same as the runtime
// damageable launchers, authored in the database and scaled with the ship.
if (TUNE.ordnance?.enabled) {
  const d = SHIPS.destroyer;
  d.comps = [...d.comps, ...(d.ordnancePlan.hangar.extraComponents || [])];
  d.prims.push({t:'paint', box:[-8,-21,-12,8,-17,12], col:E.dark, side:'bottom', noMirror:true, mix:0.95});
}
if (TUNE.ordnance?.enabled) for (const id of ['halberd', 'exeter', 'destroyer', 'hecla']) {
  const d = SHIPS[id];
  for (const bank of d.launchers || []) for (const [x,y,z] of bank.positions) {
    const r = bank.mountRadius;
    d.prims.push({t:'paint', box:[x-r,y-r,z-r,x+r,y+r,z+r], col:bank.role === 'torpedo' ? 0x452b27 : 0x20252a, side:'top', noMirror:true, mix:0.95});
  }
}

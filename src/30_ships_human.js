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

// ---- Kestrel surface-detail prims: lod 2 = built from detail index 6, lod 3 = index 7; paint/text from index 5 -------------
const kNoz = (x, y, z, r) => [                                  // nozzle petals + heat bands around a pod
  ...ringSegs(x, y, z - 0.05, z + 0.42, r * 0.98, 12, 0.04, H.nozzle, { lod: 2 }),
  ...ringSegs(x, y, z + 0.05, z + 0.36, r * 0.72, 8, 0.03, 0x5a6068, { lod: 3 }),
];
const kestrelDetail = [
  // canopy frame ribs and spine
  tap([0, 0.34, -3.35], 0.035, [0.4, 0.3], [0.4, 0.3], K.dark, { sh: 'e', lod: 2 }),
  tap([0, 0.34, -2.55], 0.035, [0.45, 0.33], [0.45, 0.33], K.dark, { sh: 'e', lod: 2 }),
  tap([0, 0.34, -1.85], 0.035, [0.4, 0.3], [0.4, 0.3], K.dark, { sh: 'e', lod: 2 }),
  seg([0, 0.655, -3.3], [0, 0.63, -1.75], 0.028, 0.028, K.dark, { lod: 2 }),
  tap([0, 0.2, -3.3], 1.25, [0.22, 0.04], [0.5, 0.05], K.white, { sh: 'r', lod: 2 }),                 // chin spine panel
  // dorsal avionics: heat-sink fins, dish and blade antennae
  ...rungs(0, 0.82, -0.1, 1.2, 6, 0.2, 0.09, 0.03, K.hull3, { lod: 2 }),
  ell([0, 0.72, 1.85], [0.28, 0.12, 0.34], K.white, { lod: 2 }),
  seg([0, 0.78, 1.85], [0, 0.98, 1.85], 0.02, 0.02, K.dark, { lod: 2 }),
  tap([0.9, 0.6, 2.4], 0.5, [0.04, 0.22], [0.04, 0.12], K.dark, { ax: 'y', sweep: 0.5, lod: 3 }),
  // engine pods: intake lips, heat bands, nozzle petals
  tap([3.35, 0.5, 1.82], 0.06, [0.84, 0.58], [0.84, 0.58], K.dark, { sh: 'h', lod: 2 }),
  tap([3.9, -0.6, 2.67], 0.06, [0.72, 0.5], [0.72, 0.5], K.dark, { sh: 'h', lod: 2 }),
  tap([3.35, 0.5, 4.3], 0.07, [0.82, 0.56], [0.82, 0.56], K.hull2, { sh: 'h', lod: 2 }),
  tap([3.35, 0.5, 5.1], 0.07, [0.8, 0.55], [0.8, 0.55], K.hull2, { sh: 'h', lod: 2 }),
  tap([3.9, -0.6, 4.9], 0.07, [0.72, 0.49], [0.72, 0.49], K.hull3, { sh: 'h', lod: 2 }),
  tap([3.9, -0.6, 5.7], 0.07, [0.7, 0.48], [0.7, 0.48], K.hull3, { sh: 'h', lod: 2 }),
  ...kNoz(3.35, 0.5, 5.95, 0.5), ...kNoz(3.9, -0.6, 6.3, 0.46),
  // wing hardpoints with slim IR missiles on pylons, leading-edge sensor blisters
  tap([2.25, -0.17, 1.9], 0.55, [0.04, 0.18], [0.04, 0.16], K.dark, { ax: 'y', lod: 2 }),
  seg([2.25, -0.4, 0.9], [2.25, -0.4, 2.8], 0.09, 0.09, K.white, { lod: 2 }), seg([2.25, -0.4, 0.55], [2.25, -0.4, 0.9], 0.09, 0.02, 0xc33a2a, { lod: 2 }),
  tap([1.75, -0.17, 2.2], 0.45, [0.04, 0.16], [0.04, 0.14], K.dark, { ax: 'y', lod: 3 }),
  seg([1.75, -0.36, 1.35], [1.75, -0.36, 2.9], 0.07, 0.07, K.white, { lod: 3 }),
  ell([4.1, 0.05, 1.25], [0.1, 0.07, 0.17], K.canopy, { lod: 2 }),
  ell([3.1, 0.04, 1.3], [0.1, 0.07, 0.17], K.canopy, { lod: 3 }),
  // wing flap hinge lines (thin dark strips) and tip lights
  tap([3.6, 0.07, 3.25], 0.025, [1.3, 0.04], [0.8, 0.04], K.dark, { ax: 'x', sweep: 0.3, lod: 2 }),
  // gun boom: shroud rings, muzzle brake, feed lines; missile pylon rail
  ...[-1.6, -2.8, -3.8, -4.8].map(z => tap([-0.62, -0.46, z], 0.07, [0.17, 0.16], [0.17, 0.16], K.hull3, { sh: 'e', noMirror: true, lod: 2 })),
  tap([-0.62, -0.48, -6.3], 0.16, [0.13, 0.13], [0.13, 0.13], H.nozzle, { sh: 'e', noMirror: true, lod: 2 }),
  seg([-0.45, -0.3, -1.4], [-0.45, -0.38, -2.6], 0.03, 0.03, K.amber, { noMirror: true, lod: 3 }),
  ...[-1.8, -2.6, -3.4].map(z => tap([0.6, -0.43, z], 0.05, [0.12, 0.11], [0.12, 0.11], K.hull3, { sh: 'e', noMirror: true, lod: 2 })),
  // wing-tip pod details
  tap([4.95, -0.04, 1.2], 0.06, [0.15, 0.13], [0.15, 0.13], K.hull3, { sh: 'e', lod: 2 }),
  // nose: pitot probe and sensor ring
  seg([0, -0.18, -4.7], [0, -0.17, -5.9], 0.03, 0.01, K.dark, { lod: 2 }),
  // markings (tier 1+): ochre wing stripes, white nose flash, hull numbers on the fins and wings
  { t: 'paint', box: [2.0, -0.2, 3.1, 4.6, 0.2, 3.45], col: K.amber, side: 'top', mix: 0.85 },
  { t: 'paint', box: [-0.25, 0.1, -4.2, 0.25, 0.5, -3.5], col: K.white, side: 'top', mix: 0.9 },
  { t: 'paint', box: [0.8, 0.0, 1.8, 1.7, 0.7, 2.6], col: K.white, side: 'side', mix: 0.7 },
  { t: 'text', c: [1.16, 1.1, 3.25], face: '+x', text: 'CDF', px: 0.075, col: K.white },
  { t: 'text', c: [3.0, 0.1, 2.0], face: '+y', text: '07', px: 0.1, col: K.dark, mir: false },
  { t: 'text', c: [-3.0, 0.1, 2.0], face: '+y', text: '07', px: 0.1, col: K.dark, mir: false },
];

SHIPS.kestrel = {
  id: 'kestrel', name: 'KESTREL', cls: 'fighter', fac: 'human', role: 'MULTIROLE FIGHTER',
  length: 12.4, half: [5.2, 2.2, 6.9], mirror: true, radius: 6.6, seam: [1.5, 1.1], eye: [0, 0.62, -2.5],
  prims: [
    // long chined fuselage: drooping chin nose into a wide flat wing-body
    tap([0, -0.2, -3.3], 2.0, [0.22, 0.14], [0.66, 0.38], K.hull, { sh: 'd', sweepY: 0.11 }),
    tap([0, 0, -0.5], 1.0, [0.62, 0.38], [1.25, 0.42], K.hull, { sh: 'h' }),
    tap([0, 0, 1.9], 1.45, [1.25, 0.42], [1.7, 0.38], K.hull2, { sh: 'h' }),
    tap([0, -0.34, 0.6], 3.4, [0.5, 0.18], [1.0, 0.16], K.dark, { sh: 'h' }),                // darker belly
    tap([0, -0.18, -4.35], 0.5, [0.04, 0.05], [0.2, 0.13], 0x20252b, { sh: 'd' }),           // dark sensor nose tip
    tap([0, 0.05, -3.5], 0.35, [0.3, 0.2], [0.3, 0.2], K.white, { sh: 'h' }),                 // white chin panels
    tap([0, 0.12, -2.0], 0.22, [0.5, 0.3], [0.5, 0.3], K.white, { sh: 'h' }),
    // canopy and dorsal avionics block
    ell([0, 0.34, -2.55], [0.42, 0.3, 1.05], K.canopy, { glow: false }),
    tap([0, 0.32, -2.55], 0.1, [0.5, 0.06], [0.5, 0.06], K.white, { sh: 'h' }),
    tap([0, 0.5, 0.6], 1.4, [0.62, 0.26], [0.95, 0.3], K.hull3, { sh: 'e' }),
    tap([0, 0.62, 0.6], 0.8, [0.28, 0.08], [0.4, 0.1], K.dark, { sh: 'h', dots: { col: K.amber, p: 0.06 } }),
    // swept wing plates
    tap([3.0, -0.02, 2.2], 2.0, [1.9, 0.15], [0.85, 0.07], K.hull2, { ax: 'x', sweep: 0.3, seam: [2, 3] }),
    tap([3.5, -0.02, 1.35], 0.25, [0.9, 0.17], [0.7, 0.1], K.white, { ax: 'x', sweep: 0.3 }),   // leading-edge strip
    tap([4.6, 0.0, 3.0], 0.3, [0.7, 0.1], [0.65, 0.08], K.amber, { ax: 'x', sweep: 0.3 }),
    // tall canted dorsal fins
    tap([1.05, 1.0, 3.15], 1.15, [1.25, 0.08], [0.55, 0.05], K.hull, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.3] }),
    tap([1.18, 1.95, 3.55], 0.12, [0.5, 0.08], [0.45, 0.06], K.amber, { ax: 'y', sweep: 0.5, rot: [0, 0, -0.3] }),
    // engine pods: two boxy nacelles per side, louvred intakes
    tap([3.35, 0.5, 3.85], 1.9, [0.78, 0.52], [0.72, 0.5], K.hull3, { sh: 'h' }),
    tap([3.35, 0.5, 1.9], 0.12, [0.74, 0.48], [0.74, 0.48], 0x15181c, { dots: { col: K.amber, p: 0.12 } }),
    tap([3.35, 0.5, 5.9], 0.3, [0.6, 0.42], [0.52, 0.38], H.nozzle, { sh: 'e' }),
    ell([3.35, 0.5, 6.25], [0.46, 0.34, 0.1], H.glow, { glow: true }),
    tap([3.9, -0.6, 4.45], 1.7, [0.7, 0.46], [0.66, 0.44], K.hull2, { sh: 'h' }),
    tap([3.9, -0.6, 2.75], 0.12, [0.66, 0.42], [0.66, 0.42], 0x15181c, { dots: { col: K.amber, p: 0.12 } }),
    tap([3.9, -0.6, 6.25], 0.3, [0.54, 0.38], [0.48, 0.34], H.nozzle, { sh: 'e' }),
    ell([3.9, -0.6, 6.6], [0.42, 0.3, 0.1], H.glow, { glow: true }),
    tap([2.4, -0.1, 3.9], 0.9, [0.5, 0.3], [0.5, 0.3], K.dark, { sh: 'h', ax: 'x' }),            // pod struts
    // long under-slung gun boom (left) and missile pylon (right)
    seg([-0.62, -0.42, -1.2], [-0.62, -0.48, -6.4], 0.12, 0.1, K.dark, { noMirror: true }),
    ell([-0.62, -0.45, -2.2], [0.24, 0.2, 0.9], K.hull2, { noMirror: true }),
    seg([-0.62, -0.48, -5.7], [-0.62, -0.48, -5.9], 0.2, 0.2, 0x20252b, { noMirror: true }),
    seg([-0.62, -0.48, -6.1], [-0.62, -0.48, -6.3], 0.18, 0.18, 0x20252b, { noMirror: true }),
    seg([0.6, -0.42, -1.0], [0.6, -0.45, -4.5], 0.14, 0.11, K.dark, { noMirror: true }),   // MD-9 mag barrel on the right boom
    tap([0.6, -0.44, -2.0], 0.3, [0.3, 0.26], [0.3, 0.26], K.panel, { sh: 'e', noMirror: true }),
    tap([0.6, -0.44, -3.0], 0.3, [0.3, 0.26], [0.3, 0.26], K.panel, { sh: 'e', noMirror: true }),   // coil collars
    tap([0.6, -0.45, -4.45], 0.15, [0.2, 0.2], [0.18, 0.18], K.dark, { sh: 'e', noMirror: true }),   // muzzle
    // wing-tip MK-30 HE cannons: barrel + muzzle brake (realism pass 2026-10-22; was a plasma-bolter glow)
    seg([4.95, -0.04, 1.9], [4.95, -0.04, 0.7], 0.12, 0.09, K.dark),
    seg([4.95, -0.04, 0.78], [4.95, -0.04, 0.58], 0.17, 0.17, K.dark),
    // antennae, nav lights, ventral sensor legs
    seg([2.2, 0.4, 3.6], [4.2, 0.9, 5.2], 0.04, 0.02, K.dark),
    seg([0, 0.6, 1.2], [0, 1.1, 2.0], 0.04, 0.02, K.dark),
    seg([0, -0.4, 1.4], [0, -0.9, 1.5], 0.05, 0.04, K.dark), seg([0.2, -0.4, 1.6], [0.25, -0.85, 1.7], 0.04, 0.03, K.dark),
    ell([-5.1, 0, 3.0], [0.09, 0.06, 0.09], 0xff3030, { glow: true, noMirror: true }),
    ell([5.1, 0, 3.0], [0.09, 0.06, 0.09], 0x30ff60, { glow: true, noMirror: true }),
    ...kestrelDetail,
  ],
  engines: [
    { pos: [3.35, 0.5, 6.4], comp: 'engR', r: 0.46 }, { pos: [-3.35, 0.5, 6.4], comp: 'engL', r: 0.46 },
    { pos: [3.9, -0.6, 6.75], comp: 'engR', r: 0.42 }, { pos: [-3.9, -0.6, 6.75], comp: 'engL', r: 0.42 },
  ],
  mounts: [
    { w: 'cannon', pos: [-0.62, -0.48, -6.45], comp: 'gunL', grp: 1 }, { w: 'fmag', pos: [0.6, -0.45, -4.55], comp: 'gunR', grp: 1 },   // right boom carries the MD-9 mag (owner 2026-10-22): 3 gun systems - cannon, mag, HE - plus missiles
    { w: 'he', pos: [4.95, -0.04, 0.6], comp: 'wingR', grp: 2 }, { w: 'he', pos: [-4.95, -0.04, 0.6], comp: 'wingL', grp: 2 },
  ],
  stores: { ir: 4, rf: 2, torp: 1, flare: 24 },
  launch: [2.25, -0.4, 0.55],           // nose of the under-wing pylon missiles (x mirrors per launch)
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.6, -0.05, 4.4], r: 1.5, hp: 16 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.6, -0.05, 4.4], r: 1.5, hp: 16 },
    { id: 'gunL', name: 'CANNON L', role: 'gun', pos: [-0.62, -0.45, -3.8], r: 0.9, hp: 10 },
    { id: 'gunR', name: 'MD-9 MAG', role: 'gun', pos: [0.6, -0.45, -3.2], r: 0.7, hp: 12 },
    { id: 'wingL', name: 'HE GUN L', role: 'gun', pos: [-4.6, -0.04, 1.4], r: 0.8, hp: 9 },
    { id: 'wingR', name: 'HE GUN R', role: 'gun', pos: [4.6, -0.04, 1.4], r: 0.8, hp: 9 },
    { id: 'shield', name: 'SHIELD GEN', role: 'shield', pos: [0, 0.2, 1.2], r: 0.9, hp: 20 },
    { id: 'radar', name: 'RADAR', role: 'radar', pos: [0, -0.1, -3.9], r: 0.8, hp: 12 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 2.6], r: 1.0, hp: 30 },
  ],
  shield: { fore: 40, aft: 40 }, armor: { type: 'composite', rating: 0.44 }, structure: 50,
  maxSpeed: 150, accel: 75, turn: 2.2, shieldRegen: 1, sig: 1,
  flameColor: 0x66c8ff,
};

// ---- CSS HALBERD: Aegis-class escort corvette (60 m) -------------------------
// ---- Halberd surface-detail prims (authored at 64 m, scaled with the ship) ---------------------------------------------
const hTur = (x, y, z, dy = 1) => [                              // armoured turret seat + ammo drum for each PD turret
  tap([x, y - 0.25 * dy, z], 0.55, [1.5, 0.5], [1.5, 0.5], H.panel, { sh: 'e', lod: 2 }),
  tap([x, y - 0.05 * dy, z], 0.45, [1.1, 0.35], [1.1, 0.35], H.dark, { sh: 'e', lod: 2 }),
  ...ringSegs(x, y - 0.1 * dy, z - 0.5, z + 0.5, 1.3, 8, 0.07, 0x7a838d, { lod: 3 }),
];
const halberdDetail = [
  ...hTur(2.6, 1.85, -12), ...hTur(-2.6, 1.85, -12), ...hTur(2.2, 3.1, 19), ...hTur(-2.2, 3.1, 19), ...hTur(0, -2.8, -6, -1), ...hTur(0, -3.3, 14, -1),
  // railgun: coil rings, capacitor blocks, muzzle shroud
  ...[-10, -12.5, -15, -17.5, -20, -22.5, -25, -27.5].map(z => tap([0, 3.9, z], 0.12, [1.65, 0.78], [1.65, 0.78], H.panel, { sh: 'e', lod: 2 })),
  ...[-10, -13, -16, -19, -22, -25].map(z => tap([0, 3.9, z - 0.3], 0.05, [1.7, 0.85], [1.7, 0.85], H.glow, { sh: 'e', glow: true, glowF: 0.9, lod: 3 })),
  tap([0, 3.9, -30.2], 0.7, [1.8, 0.85], [1.8, 0.85], H.dark, { sh: 'h', lod: 2 }),
  tap([0, 3.7, -4], 2.0, [1.6, 0.5], [1.9, 0.6], 0x6e7782, { sh: 'h', lod: 2 }),
  // VLS lattice (tier 1 paint), dorsal armour seams and a ventral sensor strake
  ...paintGrid(-1.2, 3.0, 12.6, 5, 9, 0.5, 0.55, 0.36, 0.38, 0x16191d, { mix: 0.9 }),
  // bridge tower: lit windows, comms dishes and antennae
  ell([2.6, 8.5, 9.4], [1.3, 0.16, 1.3], 0xdfe2e6, { rot: [0.5, 0, 0.35], lod: 2 }),
  seg([2.6, 8.5, 9.4], [2.9, 9.4, 8.7], 0.06, 0.06, H.dark, { lod: 2 }),
  ell([-2.2, 8.0, 12], [0.9, 0.12, 0.9], 0xdfe2e6, { rot: [-0.4, 0, -0.3], lod: 2 }),
  tap([0, 8.0, 11.5], 1.1, [1.4, 0.5], [1.4, 0.5], H.panel, { sh: 'h', lod: 2 }),
  ...rungs(0, 8.65, 10.4, 12.6, 4, 1.1, 0.12, 0.08, 0x8e969f, { lod: 2 }),
  seg([0, 11, 11], [0, 12.6, 11], 0.08, 0.04, H.dark, { lod: 2 }), seg([-1.5, 10, 11], [1.5, 10, 11], 0.05, 0.05, H.dark, { lod: 2 }),
  ell([0, 12.7, 11], [0.14, 0.14, 0.14], 0xff3030, { glow: true, lod: 2 }),
  // hangar door frame with amber guide lights, boarding hatch rows
  tap([4.05, -0.2, -2], 0.15, [0.5, 1.5], [0.5, 1.5], H.dark, { lod: 2 }),
  ...[-6.3, -4.9, -3.5, -2.1, -0.7].map(z => ell([4.3, 1.25, z], [0.12, 0.08, 0.12], H.amber, { glow: true, glowF: 1.5, lod: 2 })),
  ...[-6.3, -4.9, -3.5, -2.1, -0.7].map(z => ell([4.3, -1.65, z], [0.12, 0.08, 0.12], H.amber, { glow: true, glowF: 1.5, lod: 2 })),
  // radiator wings: heat-pipe manifolds and rib strips
  ...Array.from({ length: 9 }, (_, i) => seg([4.8, 0.5, 8.6 + i * 1.05], [13.4, 0.52, 9.9 + i * 1.05], 0.1, 0.1, i % 3 === 0 ? H.orange : 0x7a838d, { lod: 2 })),
  seg([4.6, 0.55, 8.2], [4.6, 0.55, 18.5], 0.28, 0.28, H.dark, { lod: 2 }),
  tap([13.6, 0.4, 14], 5.2, [0.2, 0.32], [0.2, 0.28], H.dark, { ax: 'x', sweep: 0.3, lod: 2 }),
  // engine block: cooling cowl ribs, nozzle petals and bell rings
  ...ringSegs(0, 0, 21, 29.5, 4.95, 18, 0.2, 0x3e454e, { lod: 2 }),
  ...[22, 24, 26, 28].map(z => tap([0, 0, z], 0.15, [5.2, 3.7], [5.2, 3.7], 0x5b636d, { sh: 'h', lod: 2 })),
  ...ringSegs(0, 0, 30.1, 31.5, 2.5, 12, 0.12, H.nozzle, { lod: 2 }), ...ringSegs(3.9, 0, 30.2, 31.3, 1.7, 10, 0.1, H.nozzle, { lod: 2 }),
  tap([0, 0, 30.9], 0.12, [2.7, 2.35], [2.7, 2.35], 0x6a7078, { sh: 'e', lod: 2 }),
  // hull belts, hull number and name (tier 1 paint/text)
  { t: 'paint', box: [-5.5, -3.5, -26.5, 5.5, 4.5, -25.6], col: H.orange, mix: 0.9 },
  { t: 'paint', box: [-5.5, -3.5, -22.4, 5.5, 4.5, -22.0], col: H.white, mix: 0.9 },
  { t: 'paint', box: [-1.5, 3.1, -27, 1.5, 4.6, -24.5], col: H.orange, side: 'top', mix: 0.85 },
  { t: 'text', c: [3.5, 0.2, -13], face: '+x', text: 'CSS HALBERD', px: 0.34, col: H.dark },
  { t: 'text', c: [3.5, -1.4, 6], face: '+x', text: 'F-71', px: 0.5, col: H.white },
  { t: 'text', c: [0, 3.2, 0], face: '+y', text: 'CDF', px: 0.7, col: H.navy, mir: false },
];

SHIPS.halberd = {
  id: 'halberd', name: 'HALBERD', cls: 'corvette', fac: 'human', role: 'ESCORT CORVETTE',
  length: 64, half: [15, 11, 33], mirror: true, radius: 38, seam: [3.2, 2.4],
  prims: [
    tap([0, 0, 2], 22, [3.2, 2.4], [4.8, 3.4], 0xb7bcc3, { sh: 'h' }),                        // main hull
    tap([0, -0.1, -25], 7, [0.4, 0.5], [3.2, 2.4], 0x9aa1aa, { sh: 'd' }),                    // bow wedge
    tap([0, 2.7, -6], 14, [2.0, 0.5], [3.2, 0.7], 0x8e969f, { sh: 'h' }),                     // dorsal armour deck
    tap([0, 0, -8], 1.0, [3.7, 2.75], [3.7, 2.75], H.navy, { sh: 'h' }),                      // navy bands
    tap([0, 0, 8], 0.8, [4.15, 3.0], [4.15, 3.0], H.navy, { sh: 'h' }),
    tap([0, 0.2, -20], 0.5, [3.0, 2.2], [3.0, 2.2], H.orange, { sh: 'h' }),
    // spinal railgun
    tap([0, 3.5, -1], 8, [1.9, 0.9], [2.3, 1.0], 0x6e7782, { sh: 'h' }),
    seg([0.9, 3.9, -8], [0.9, 3.9, -30.5], 0.5, 0.42, H.dark),
    seg([-0.9, 3.9, -8], [-0.9, 3.9, -30.5], 0.5, 0.42, H.dark),
    tap([0, 3.9, -16], 0.3, [1.5, 0.75], [1.5, 0.75], H.panel, { sh: 'e' }),
    tap([0, 3.9, -24], 0.3, [1.4, 0.7], [1.4, 0.7], H.panel, { sh: 'e' }),
    // GA-9 rotary cannon (ventral nose, owner 2026-10-22): cradle + barrel cluster + muzzle disc
    tap([0, -2.3, -27], 2.6, [1.2, 1.2], [1.0, 1.0], 0x6e7782, { sh: 'h' }),
    seg([0, -2.3, -29], [0, -2.3, -30.4], 0.55, 0.45, H.dark),
    tap([0, -2.3, -30.2], 0.4, [0.7, 0.7], [0.65, 0.65], H.dark, { sh: 'e' }),
    // bridge tower + mast
    tap([0, 5.3, 10], 3.4, [1.6, 2.2], [2.5, 2.4], 0xa9afb7, { sh: 'h', win: { col: 0xffc060, p: 0.75, f: 1.6, o: 2, pu: 4, wu: 2, pv: 4 } }),
    tap([0, 6.0, 6.55], 0.2, [1.5, 0.32], [1.5, 0.32], H.amber, { glow: true, glowF: 1.3 }),
    seg([0, 7.4, 11], [0, 11, 11], 0.32, 0.16, 0x7a838d),
    ell([0, 11.1, 11], [2.0, 0.25, 2.0], 0x9aa1aa),
    seg([2.4, 7.6, 12], [3.5, 10.5, 13.5], 0.12, 0.06, 0x7a838d),
    // VLS + side details
    tap([0, 2.95, 15], 2.6, [1.9, 0.4], [1.9, 0.4], H.panel, { sh: 'h', dots: { col: H.amber, p: 0.04 } }),
    tap([4.2, -0.2, -2], 4.6, [0.4, 1.3], [0.4, 1.3], 0x16191d, { dots: { col: H.amber, p: 0.14 } }),    // hangar door
    tap([4.0, 1.4, 7], 3.0, [0.2, 0.18], [0.2, 0.18], H.orange),
    // engine block + nozzles
    tap([0, 0, 25.5], 5, [4.6, 3.3], [5.3, 3.7], 0x4d5560, { sh: 'h' }),
    tap([0, 0, 30.2], 1.2, [2.3, 2.0], [2.7, 2.35], H.nozzle, { sh: 'e' }),
    ell([0, 0, 31.5], [2.0, 1.7, 0.25], H.glow, { glow: true }),
    tap([3.9, 0, 30.2], 1.0, [1.5, 1.3], [1.8, 1.55], H.nozzle, { sh: 'e' }),
    ell([3.9, 0, 31.3], [1.3, 1.1, 0.22], H.glow, { glow: true }),
    // radiator wings
    tap([9.4, 0.4, 13], 4.9, [7.0, 0.18], [3.8, 0.12], 0xdfe2e6, { ax: 'x', sweep: 0.3, seam: [2.2, 3.0] }),
    tap([9.4, 0.42, 13], 4.9, [0.3, 0.2], [0.3, 0.14], H.orange, { ax: 'x', sweep: 0.3 }),
    seg([4.6, 0.1, 11], [9.5, 0.45, 11.5], 0.25, 0.18, 0x7a838d),
    seg([4.6, 0.1, 16], [9.5, 0.45, 17.5], 0.25, 0.18, 0x7a838d),
    // sensor pods / comms
    ell([3.3, 2.4, -14], [0.5, 0.35, 0.8], 0x7a838d),
    tap([0, -2.9, 4], 5, [1.4, 0.4], [1.6, 0.4], H.panel, { sh: 'h' }),
    ell([-3.6, 2.6, 0], [0.25, 0.2, 0.25], 0xff3030, { glow: true, noMirror: true }),
    ell([3.6, 2.6, 0], [0.25, 0.2, 0.25], 0x30ff60, { glow: true, noMirror: true }),
    ...halberdDetail,
  ],
  engines: [{ pos: [0, 0, 31.8], comp: 'engC', r: 1.9 }, { pos: [3.9, 0, 31.6], comp: 'engR', r: 1.25 }, { pos: [-3.9, 0, 31.6], comp: 'engL', r: 1.25 }],
  mounts: [
    { w: 'rail', pos: [0.9, 3.9, -31], comp: 'rail', grp: 1 }, { w: 'rail', pos: [-0.9, 3.9, -31], comp: 'rail', grp: 1 },
    { w: 'rotary', pos: [0, -2.3, -30.6], comp: 'rotary', grp: 2 },   // GA-9 rotary (owner 2026-10-22): ventral nose, A-10-style
  ],
  turrets: [
    { w: 'laser', pos: [2.6, 1.85, -12], comp: 'tur1', side: 1 }, { w: 'laser', pos: [-2.6, 1.85, -12], comp: 'tur2', side: 1 },
    { w: 'pd', pos: [2.2, 3.1, 19], comp: 'tur3', side: 1 }, { w: 'pd', pos: [-2.2, 3.1, 19], comp: 'tur4', side: 1 },
    { w: 'pd', pos: [0, -2.8, -6], comp: 'tur5', side: -1 }, { w: 'pd', pos: [0, -3.3, 14], comp: 'tur6', side: -1 },
  ],
  stores: { flare: 0 },
  comps: [
    { id: 'engC', name: 'ENGINE C', role: 'engine', pos: [0, 0, 26], r: 3.0, hp: 120 },
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.9, 0, 26], r: 2.2, hp: 70 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.9, 0, 26], r: 2.2, hp: 70 },
    { id: 'rail', name: 'RAILGUN', role: 'gun', pos: [0, 3.5, -12], r: 3.5, hp: 140 },
    { id: 'rotary', name: 'GA-9 ROTARY', role: 'gun', pos: [0, -2.3, -27], r: 2.0, hp: 120 },
    { id: 'tur1', name: 'LASER 1', role: 'turret', pos: [2.6, 1.85, -12], r: 2.8, hp: 30 },
    { id: 'tur2', name: 'LASER 2', role: 'turret', pos: [-2.6, 1.85, -12], r: 2.8, hp: 30 },
    { id: 'tur3', name: 'PD 3', role: 'turret', pos: [2.2, 3.1, 19], r: 1.3, hp: 30 },
    { id: 'tur4', name: 'PD 4', role: 'turret', pos: [-2.2, 3.1, 19], r: 1.3, hp: 30 },
    { id: 'tur5', name: 'PD 5', role: 'turret', pos: [0, -2.8, -6], r: 1.3, hp: 30 },
    { id: 'tur6', name: 'PD 6', role: 'turret', pos: [0, -3.3, 14], r: 1.3, hp: 30 },
    { id: 'shieldF', name: 'SHIELD FWD', role: 'shield', pos: [0, 0, -10], r: 3.0, hp: 90 },
    { id: 'shieldA', name: 'SHIELD AFT', role: 'shield', pos: [0, 0, 16], r: 3.0, hp: 90 },
    { id: 'bridge', name: 'BRIDGE', role: 'radar', pos: [0, 5.3, 10], r: 3.0, hp: 90 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 20], r: 3.6, hp: 200 },
  ],
  shield: { fore: 220, aft: 220 }, armor: { type: 'hard', rating: 0.28 }, structure: 420,
  maxSpeed: 28, accel: 6, turn: 0.22, shieldRegen: 6, sig: 4, flameColor: 0x66c8ff, energyMax: 600, energyRegen: 100,
};

// ---- EXETER class frigate (450 m): jump-capable, docks 2 corvettes + 12 fighters/drones (no repair) -------------
// Inspiration: angular grey/white wedge hull, dorsal slab, outboard engine pods on pylons, folded radiator panels,
// PD turret clusters. Owner brief 2026-10-21. Catalogue model: not used in missions yet.
const E = { white: 0xd8dce0, grey: 0x9aa2ab, grey2: 0x7d858f, dark: 0x262b31, panel: 0x4a525c, amber: 0xc79a3a, noz: 0x2a2d33, glow: 0x7fd0ff, orange: 0xd9772b };
const eTur = (x, y, z, dy = 1) => [                       // turret seat only: the barrels are the real turret meshes (makeTurret, cls S/M)
  tap([x, y, z], 5, [6, 2.4], [6, 2.4], E.grey2, { sh: 'h' }),
];
// ---- Exeter surface-detail prims (metres; voxel size at high detail is about 1 m) --------------------------------------
const eTurD = (x, y, z, dy = 1) => [
  tap([x, y - 1.2 * dy, z], 7, [8, 1.6], [8, 1.6], E.panel, { sh: 'e', lod: 2 }),
  ell([x, y + 1.0 * dy, z + 1], [3.2, 1.5, 3.2], E.grey2, { lod: 2 }),
  ...ringSegs(x, y + 0.2 * dy, z - 4, z + 5, 5.2, 8, 0.35, E.dark, { lod: 3 }),
];
const exeterDetail = [
  ...eTurD(0, 22, -110), ...eTurD(24, 21, -40), ...eTurD(-24, 21, -40), ...eTurD(20, 26, 110), ...eTurD(-20, 26, 110), ...eTurD(0, -20, -80, -1), ...eTurD(0, -21, 60, -1),
  // dorsal slab: VLS lattices, long trench with ribs, comm farm
  ...paintGrid(-14, 17, -12, 5, 10, 5.5, 5.5, 3.6, 3.6, 0x16191d, { mix: 0.9 }),
  ...paintGrid(-14, 17, 100, 5, 9, 5.5, 5.5, 3.6, 3.6, 0x16191d, { mix: 0.9 }),
  ...rungs(0, 18.3, -150, 60, 22, 2.8, 0.7, 0.5, E.dark, { lod: 2 }),
  tap([0, 17.2, -30], 180, [2.2, 1.2], [2.2, 1.2], E.dark, { sh: 'r', lod: 2 }),
  // bridge tower: lit windows, sensor spines, dishes
  ell([14, 49, 74], [9, 1.1, 9], E.white, { rot: [0.5, 0, 0.3], lod: 2 }), ell([-12, 46, 84], [7, 1, 7], E.white, { rot: [-0.4, 0, -0.3], lod: 2 }),
  ...[-6, 0, 6].map(x => seg([x, 44, 70], [x, 52, 68], 0.5, 0.2, E.dark, { lod: 2 })),
  tap([0, 31, 78], 6, [14, 2], [14, 2], E.panel, { sh: 'h', lod: 2 }),
  // hangar maw: frame, hazard lights, interior glow
  ...Array.from({ length: 9 }, (_, i) => ell([-16 + i * 4, -1.5, -204], [0.8, 0.6, 0.8], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  ...Array.from({ length: 9 }, (_, i) => ell([-16 + i * 4, -12.5, -204], [0.8, 0.6, 0.8], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  tap([0, -7, -199], 3, [17, 8.5], [17, 8.5], E.dark, { sh: 'h', lod: 2 }),
  ...[-12, -4, 4, 12].map(x => tap([x, -7, -192], 12, [0.8, 6.5], [0.8, 6.5], E.panel, { lod: 2 })),
  // corvette cradles: clamp arms, guide lights
  ...[-14, 0, 14, 28].map(z => seg([36, -12, 40 + z], [30, -7, 40 + z], 1.4, 1.0, E.panel, { lod: 2 })),
  ...[-14, 0, 14, 28].map(z => ell([28, -9, 40 + z], [0.9, 0.9, 0.9], E.amber, { glow: true, glowF: 1.6, lod: 2 })),
  // radiator manifolds and ribs
  ...Array.from({ length: 8 }, (_, i) => seg([44, 12.4, 108 + i * 6], [96, 12.4, 112 + i * 6], 0.7, 0.7, i % 2 ? E.dark : E.orange, { lod: 2 })),
  ...Array.from({ length: 8 }, (_, i) => seg([44, -12.4, 108 + i * 6], [96, -12.4, 112 + i * 6], 0.7, 0.7, i % 2 ? E.dark : E.orange, { lod: 2 })),
  // engine pods: intake ring, band plates, nozzle petals
  tap([80, -3, 104], 1.5, [16, 14], [16, 14], E.panel, { sh: 'h', lod: 2 }),
  ...[120, 140, 160, 180, 200].map(z => tap([80, -3, z], 0.8, [20.5, 18], [20.5, 18], E.grey2, { sh: 'h', lod: 2 })),
  ...ringSegs(80, -3, 221, 228, 14, 18, 0.7, E.noz, { lod: 2 }),
  ...ringSegs(0, 0, 204, 214, 26, 22, 1.0, 0x3e454e, { lod: 2 }),
  ...[208, 211].map(z => tap([0, 0, z], 0.8, [29, 18], [29, 18], E.grey2, { sh: 'h', lod: 2 })),
  // markings
  { t: 'paint', box: [-46, -10, -130, 46, 24, -124], col: E.orange, mix: 0.9 },
  { t: 'paint', box: [-46, -10, -112, 46, 24, -109], col: 0x2f4a7a, mix: 0.9 },
  { t: 'paint', box: [-26, 12, -190, 26, 30, -160], col: E.panel, side: 'top', mix: 0.7 },
  { t: 'text', c: [30, 3, -62], face: '+x', text: 'EXETER', px: 3.2, col: E.dark },
  { t: 'text', c: [36, 5, 40], face: '+x', text: 'F-03', px: 4, col: E.white },
  { t: 'text', c: [0, 18.4, -100], face: '+y', text: 'CDF', px: 3.5, col: 0x2f4a7a, mir: false },
];

SHIPS.exeter = {
  id: 'exeter', name: 'EXETER', cls: 'frigate', fac: 'human', role: 'JUMP FRIGATE',
  length: 450, half: [108, 48, 230], mirror: true, radius: 235, seam: [9, 7], resMul: 0.6,
  jump: true, dock: { fighters: 12, corvettes: 2 }, repair: false,
  prims: [
    tap([0, 0, 10], 185, [22, 12], [46, 22], E.grey, { sh: 'h', dots: { col: E.amber, p: 0.012 } }),            // wedge hull
    tap([0, 13.5, 0], 150, [20, 4], [34, 5], E.white, { sh: 'h' }),                                          // dorsal slab
    tap([0, 17.8, -20], 110, [12, 0.8], [20, 0.8], E.panel, { sh: 'r' }),                                    // dorsal panel inlay
    tap([0, -2, -200], 28, [9, 6], [22, 12], E.grey2, { sh: 'd' }),                                          // bow wedge
    tap([0, -7, -186], 14, [13, 4.5], [14, 5], E.dark, { dots: { col: E.amber, p: 0.05 } }),                 // hangar maw
    seg([14, 4, -195], [16, 5, -226], 1.3, 0.8, E.dark), seg([20, 10, -170], [22, 11, -207], 1.1, 0.7, E.dark), // bow prongs
    tap([0, 26, 70], 28, [16, 10], [22, 12], E.white, { sh: 'h', win: { col: 0xffd890, p: 0.7, f: 1.5, o: 1, pu: 5, wu: 3, pv: 4 } }),                                          // bridge tower
    tap([0, 38, 76], 10, [10, 6], [12, 6], E.grey2, { sh: 'h' }),
    seg([0, 44, 80], [0, 68, 80], 1.5, 0.5, E.grey2), ell([0, 68, 80], [8, 1.2, 8], E.grey),
    seg([8, 40, 84], [20, 62, 92], 0.7, 0.3, E.grey2),
    tap([0, -19, -20], 40, [10, 4], [14, 6], E.grey2, { sh: 'h' }),                                          // ventral sensor keel
    // wings / sponsons
    tap([54, -4, 40], 44, [56, 3], [30, 2.5], E.grey, { ax: 'x', sweep: 0.3, sh: 'r', seam: [8, 6] }),
    tap([54, -3.2, 40], 44, [3, 3.6], [3, 3.0], E.orange, { ax: 'x', sweep: 0.3 }),
    // dock cradles (corvette bays, flanks)
    tap([34, -7, 40], 32, [3, 9], [3, 9], E.dark, { dots: { col: E.amber, p: 0.05 } }),
    // radiator panels (folded white, orange edge)
    tap([70, 12, 130], 26, [36, 0.5], [24, 0.4], E.white, { ax: 'x', sweep: 0.2, seam: [6, 8] }),
    tap([70, -12, 130], 26, [36, 0.5], [24, 0.4], E.white, { ax: 'x', sweep: 0.2, seam: [6, 8] }),
    tap([70, 12.2, 130], 26, [1.2, 0.6], [1.2, 0.5], E.orange, { ax: 'x', sweep: 0.2 }),
    // nacelle pylons, pods, nozzles
    seg([40, -6, 150], [78, -4, 165], 7, 6, E.grey2), seg([40, 4, 140], [78, 2, 160], 5, 5, E.grey2),
    tap([80, -3, 160], 56, [17, 15], [20, 17], E.white, { sh: 'h', seam: [8, 6] }),
    tap([80, -3, 106], 4, [14, 12], [14, 12], E.dark, { sh: 'h', dots: { col: E.amber, p: 0.05 } }),
    tap([80, -3, 221], 6, [13, 12], [15, 14], E.noz, { sh: 'e' }),
    ell([80, -3, 227.5], [11, 10, 2.5], E.glow, { glow: true }),
    seg([88, 3, 190], [106, 3, 228], 0.8, 0.3, E.grey2),
    // central engine block
    tap([0, 0, 204], 10, [26, 15], [28, 17], E.noz, { sh: 'h' }),
    ell([0, 0, 214.5], [20, 12, 2.5], E.glow, { glow: true }),
    ...eTur(0, 22, -110), ...eTur(24, 21, -40), ...eTur(-24, 21, -40), ...eTur(20, 26, 110), ...eTur(-20, 26, 110),
    ...eTur(0, -20, -80, -1), ...eTur(0, -21, 60, -1),
    ...eTur(40, 21, -90), ...eTur(-40, 21, -90), ...eTur(36, -23, 30, -1), ...eTur(-36, -23, 30, -1),      // L mass driver seats
    ...eTur(48, 19, 0), ...eTur(-48, 19, 0), ...eTur(14, 24, 130), ...eTur(-14, 24, 130),                  // M laser seats (dorsal)
    ...eTur(44, -19.2, 60, -1), ...eTur(-44, -19.2, 60, -1), ...eTur(14, -24.5, 120, -1), ...eTur(-14, -24.5, 120, -1),  // M laser seats (ventral)
    seg([0, -2, -196], [0, -2, -206], 7, 5.5, E.dark), ell([0, -2, -207], [5, 5, 2], E.glow, { glow: true }),   // XL mass driver muzzle: collar and glow on the bow face, between the prongs
    ...exeterDetail,
  ],
  engines: [{ pos: [80, -3, 229], comp: 'engR', r: 11 }, { pos: [-80, -3, 229], comp: 'engL', r: 11 }, { pos: [0, 0, 216], comp: 'engC', r: 18 }],
  mounts: [
    { w: 'rail', pos: [16, 5, -227], comp: 'railR', grp: 1 }, { w: 'rail', pos: [-16, 5, -227], comp: 'railL', grp: 1 },    // bow prong tips (prims seg ends at [16,5,-226])
    { w: 'mdxl', pos: [0, -2, -204], comp: 'mdxl', grp: 9, store: 'spine' },    // XL mass driver: emitter in the centre mass, muzzle at the bow face; charge machine in 79_bullfrog.js
  ],
  turrets: [
    { w: 'laser', pos: [0, 24, -110], comp: 'tur1', side: 1 }, { w: 'laser', pos: [24, 22.4, -40], comp: 'tur2', side: 1 }, { w: 'laser', pos: [-24, 22.4, -40], comp: 'tur3', side: 1 },
    { w: 'pd', pos: [20, 28.7, 110], comp: 'tur4', side: 1 }, { w: 'pd', pos: [-20, 28.7, 110], comp: 'tur5', side: 1 },
    { w: 'laser', pos: [0, -22.4, -80], comp: 'tur6', side: -1 }, { w: 'pd', pos: [0, -22.4, 60], comp: 'tur7', side: -1 },
    // owner decision 2026-10-22: 2x2 L mass driver turrets (dorsal pair fwd, ventral pair mid) and 4x2 M lasers
    { w: 'mdl', cls: 'L', pos: [40, 23, -90], comp: 'mdL1', side: 1 }, { w: 'mdl', cls: 'L', pos: [-40, 23, -90], comp: 'mdL2', side: 1 },
    { w: 'mdl', cls: 'L', pos: [36, -25, 30], comp: 'mdL3', side: -1 }, { w: 'mdl', cls: 'L', pos: [-36, -25, 30], comp: 'mdL4', side: -1 },
    { w: 'laserM', pos: [48, 21, 0], comp: 'mt1', side: 1 }, { w: 'laserM', pos: [-48, 21, 0], comp: 'mt2', side: 1 },
    { w: 'laserM', pos: [14, 26, 130], comp: 'mt3', side: 1 }, { w: 'laserM', pos: [-14, 26, 130], comp: 'mt4', side: 1 },
    { w: 'laserM', pos: [44, -21.2, 60], comp: 'mt5', side: -1 }, { w: 'laserM', pos: [-44, -21.2, 60], comp: 'mt6', side: -1 },
    { w: 'laserM', pos: [14, -26.5, 120], comp: 'mt7', side: -1 }, { w: 'laserM', pos: [-14, -26.5, 120], comp: 'mt8', side: -1 },
  ],
  stores: { flare: 0 },
  comps: [
    { id: 'engC', name: 'ENGINE C', role: 'engine', pos: [0, 0, 200], r: 20, hp: 500 },
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-80, -3, 205], r: 18, hp: 350 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [80, -3, 205], r: 18, hp: 350 },
    { id: 'railL', name: 'RAIL L', role: 'gun', pos: [-14, 4, -205], r: 10, hp: 300 },
    { id: 'railR', name: 'RAIL R', role: 'gun', pos: [14, 4, -205], r: 10, hp: 300 },
    { id: 'tur1', name: 'LASER 1', role: 'turret', pos: [0, 24, -110], r: 7, hp: 90 },
    { id: 'tur2', name: 'LASER 2', role: 'turret', pos: [24, 22.4, -40], r: 7, hp: 90 },
    { id: 'tur3', name: 'LASER 3', role: 'turret', pos: [-24, 22.4, -40], r: 7, hp: 90 },
    { id: 'tur4', name: 'PD 4', role: 'turret', pos: [20, 28.7, 110], r: 3.2, hp: 90 },
    { id: 'tur5', name: 'PD 5', role: 'turret', pos: [-20, 28.7, 110], r: 3.2, hp: 90 },
    { id: 'tur6', name: 'LASER 6', role: 'turret', pos: [0, -22.4, -80], r: 7, hp: 90 },
    { id: 'tur7', name: 'PD 7', role: 'turret', pos: [0, -22.4, 60], r: 3.2, hp: 90 },
    { id: 'mdxl', name: 'MASS DRIVER', role: 'gun', pos: [0, 0, -150], r: 14, hp: 600 },
    { id: 'mdL1', name: 'MASS DRIVER 1', role: 'turret', pos: [40, 23, -90], r: 8, hp: 140 }, { id: 'mdL2', name: 'MASS DRIVER 2', role: 'turret', pos: [-40, 23, -90], r: 8, hp: 140 },
    { id: 'mdL3', name: 'MASS DRIVER 3', role: 'turret', pos: [36, -25, 30], r: 8, hp: 140 }, { id: 'mdL4', name: 'MASS DRIVER 4', role: 'turret', pos: [-36, -25, 30], r: 8, hp: 140 },
    { id: 'mt1', name: 'LS-8 LASER 1', role: 'turret', pos: [48, 21, 0], r: 6, hp: 90 }, { id: 'mt2', name: 'LS-8 LASER 2', role: 'turret', pos: [-48, 21, 0], r: 6, hp: 90 },
    { id: 'mt3', name: 'LS-8 LASER 3', role: 'turret', pos: [14, 26, 130], r: 6, hp: 90 }, { id: 'mt4', name: 'LS-8 LASER 4', role: 'turret', pos: [-14, 26, 130], r: 6, hp: 90 },
    { id: 'mt5', name: 'LS-8 LASER 5', role: 'turret', pos: [44, -21.2, 60], r: 6, hp: 90 }, { id: 'mt6', name: 'LS-8 LASER 6', role: 'turret', pos: [-44, -21.2, 60], r: 6, hp: 90 },
    { id: 'mt7', name: 'LS-8 LASER 7', role: 'turret', pos: [14, -26.5, 120], r: 6, hp: 90 }, { id: 'mt8', name: 'LS-8 LASER 8', role: 'turret', pos: [-14, -26.5, 120], r: 6, hp: 90 },
    { id: 'shieldF', name: 'SHIELD FWD', role: 'shield', pos: [0, 0, -100], r: 16, hp: 400 },
    { id: 'shieldA', name: 'SHIELD AFT', role: 'shield', pos: [0, 0, 100], r: 16, hp: 400 },
    { id: 'bridge', name: 'BRIDGE', role: 'radar', pos: [0, 26, 70], r: 16, hp: 350 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 150], r: 22, hp: 800 },
    { id: 'radL', name: 'RADIATOR L', role: 'radiator', pos: [-70, 0, 130], r: 20, hp: 250 },
    { id: 'radR', name: 'RADIATOR R', role: 'radiator', pos: [70, 0, 130], r: 20, hp: 250 },
    { id: 'bay', name: 'FIGHTER BAY (12)', role: 'bay', pos: [0, -7, -170], r: 16, hp: 400 },
    { id: 'cradleL', name: 'CRADLE L (corvette)', role: 'dock', pos: [-34, -7, 40], r: 14, hp: 300 },
    { id: 'cradleR', name: 'CRADLE R (corvette)', role: 'dock', pos: [34, -7, 40], r: 14, hp: 300 },
  ],
  shield: { fore: 900, aft: 800 }, armor: { type: 'composite', rating: 0.27 }, structure: 1600, stores: { drone: 48 },
  maxSpeed: 30, accel: 3, turn: 0.08, shieldRegen: 12, sig: 8, flameColor: 0x66c8ff, energyMax: 2500, energyRegen: 350,
  ai: { role: 'capital' },
};

// ---- DRONE: unmanned 6 m wingman (docs/FLEET_LOGIC.md 9/9a). cls stays 'fighter' so fighter rules (fixed guns, PD priority, no big-ship death throes) apply;
// `drone: true` switches on the drone AI/orders (56_drones.js). No pilot, no eject, no missiles, one light gun, small shield. Cheap voxel model (resMul).
const D6 = { hull: 0xaab2bb, hull2: 0x8a929c, dark: 0x30363e, canopy: 0x2a9ad0, amber: 0xc79a3a };
SHIPS.drone = {
  id: 'drone', name: 'DRONE', cls: 'fighter', drone: true, fac: 'human', role: 'COMBAT DRONE (UNMANNED)',
  length: 6, half: [2.9, 0.7, 3.4], mirror: true, radius: 3.3, seam: [1.5, 1.1], eye: [0, 0.3, -1.2], resMul: 0.32, noDetail: true,
  prims: [
    tap([0, 0, -1.0], 1.7, [0.16, 0.12], [0.5, 0.36], D6.hull, { sh: 'h' }),
    tap([0, 0, 1.5], 1.5, [0.5, 0.36], [0.46, 0.34], D6.hull2, { sh: 'h' }),
    ell([0, 0.22, -1.3], [0.26, 0.18, 0.6], D6.canopy, { glow: false }),
    tap([1.5, -0.02, 1.2], 1.3, [1.2, 0.07], [0.5, 0.04], D6.hull2, { ax: 'x', sweep: 0.3 }),
    tap([2.7, 0, 1.6], 0.15, [0.5, 0.06], [0.45, 0.05], D6.amber, { ax: 'x', sweep: 0.3 }),
    tap([0, 0, 3.0], 0.25, [0.34, 0.27], [0.3, 0.24], 0x2a2d33, { sh: 'e' }),
    ell([0, 0, 3.3], [0.24, 0.19, 0.08], 0x7fd0ff, { glow: true }),
    seg([0, -0.3, -0.6], [0, -0.32, -3.0], 0.07, 0.05, D6.dark, { noMirror: true }),
  ],
  engines: [{ pos: [0, 0, 3.3], comp: 'eng', r: 0.3 }],
  mounts: [{ w: 'dgun', pos: [0, -0.32, -3.05], comp: 'gun', grp: 1 }],
  stores: {},
  comps: [
    { id: 'eng', name: 'ENGINE', role: 'engine', pos: [0, 0, 2.4], r: 0.9, hp: 5 },
    { id: 'gun', name: 'GUN', role: 'gun', pos: [0, -0.3, -1.5], r: 0.6, hp: 4 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 0.8], r: 0.7, hp: 6 },
  ],
  shield: { fore: 6, aft: 6 }, armor: { type: 'composite', rating: 0.1 }, structure: 7,
  maxSpeed: 190, accel: 120, turn: 2.6, shieldRegen: 0.5, sig: 0.4, aiSpeed: 150, flameColor: 0x66c8ff,
  ai: { role: 'fighter', aggr: 1.0, skill: 5 },   // machine gunnery
};

// ---- TENDER: unarmed fleet resupply ship (owner decision 2026-10-22: fleet tender ships for the magazine rule) ----
// Rearms friendly ships within `serviceR` (ammo pools, missile stores, XL slugs) at `tenderTick` (55_ships.js).
// Binding rule kept: rearm is not repair - structure, components and shields are NOT restored (AGENTS.md).
SHIPS.tender = {
  id: 'tender', name: 'TENDER', cls: 'frigate', fac: 'human', role: 'FLEET TENDER',
  length: 200, half: [40, 24, 100], mirror: true, radius: 105, seam: [5, 4], resMul: 0.5,
  jump: true, dock: { fighters: 24, corvettes: 4 }, repair: false, tender: true, serviceR: 600,
  prims: [
    tap([0, 0, 10], 150, [26, 16], [34, 20], E.grey, { sh: 'h', dots: { col: E.amber, p: 0.008 } }),       // long box hull
    tap([0, 8, 0], 120, [22, 5], [26, 6], E.white, { sh: 'h' }),                                          // dorsal deck
    // ordnance and supply containers (the cargo it delivers, visible per the model rules)
    ...[-60, -40, -20, 0, 20, 40, 60].flatMap(z => [
      tap([14, 13.5, z], 14, [6.5, 4], [6.5, 4], z % 40 ? E.grey2 : E.orange, { sh: 'h', dots: { col: E.amber, p: 0.03 } }),
      tap([8, 12.5, z], 14, [5, 3.5], [5, 3.5], E.panel, { sh: 'h' }),
    ]),
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
    ell([38, 0, 60], [0.8, 0.6, 0.8], 0xff3030, { glow: true, noMirror: true }),
  ],
  engines: [{ pos: [12, 0, 96], comp: 'engR', r: 5 }, { pos: [-12, 0, 96], comp: 'engL', r: 5 }, { pos: [0, 0, 96], comp: 'engC', r: 6 }],
  mounts: [],
  turrets: [],
  stores: { flare: 24 },
  comps: [
    { id: 'engC', name: 'ENGINE C', role: 'engine', pos: [0, 0, 90], r: 6, hp: 260 },
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-12, 0, 90], r: 5, hp: 200 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [12, 0, 90], r: 5, hp: 200 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 55], r: 9, hp: 420 },
    { id: 'bridge', name: 'BRIDGE', role: 'radar', pos: [0, 17, 50], r: 7, hp: 180 },
    { id: 'shieldF', name: 'SHIELD FWD', role: 'shield', pos: [0, 0, -70], r: 9, hp: 200 },
    { id: 'shieldA', name: 'SHIELD AFT', role: 'shield', pos: [0, 0, 85], r: 9, hp: 200 },
    { id: 'bayA', name: 'SERVICE BAY A', role: 'bay', pos: [14, 13.5, 0], r: 8, hp: 220 },
    { id: 'bayB', name: 'SERVICE BAY B', role: 'bay', pos: [-14, 13.5, 0], r: 8, hp: 220 },
  ],
  shield: { fore: 600, aft: 500 }, armor: { type: 'composite', rating: 0.25 }, structure: 1400,
  maxSpeed: 24, accel: 2.5, turn: 0.07, shieldRegen: 8, sig: 10, flameColor: 0x66c8ff, energyMax: 2000, energyRegen: 300,
  ai: { role: 'capital' },
};

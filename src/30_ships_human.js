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
    seg([0.6, -0.42, -1.4], [0.6, -0.45, -4.4], 0.09, 0.07, K.dark, { noMirror: true }),
    // wing-tip plasma bolters
    seg([4.95, -0.04, 1.9], [4.95, -0.04, 0.7], 0.12, 0.09, K.dark),
    ell([4.95, -0.04, 0.65], [0.1, 0.1, 0.08], 0x66ffcc, { glow: true }),
    // antennae, nav lights, ventral sensor legs
    seg([2.2, 0.4, 3.6], [4.2, 0.9, 5.2], 0.04, 0.02, K.dark),
    seg([0, 0.6, 1.2], [0, 1.1, 2.0], 0.04, 0.02, K.dark),
    seg([0, -0.4, 1.4], [0, -0.9, 1.5], 0.05, 0.04, K.dark), seg([0.2, -0.4, 1.6], [0.25, -0.85, 1.7], 0.04, 0.03, K.dark),
    ell([-5.1, 0, 3.0], [0.09, 0.06, 0.09], 0xff3030, { glow: true, noMirror: true }),
    ell([5.1, 0, 3.0], [0.09, 0.06, 0.09], 0x30ff60, { glow: true, noMirror: true }),
  ],
  engines: [
    { pos: [3.35, 0.5, 6.4], comp: 'engR', r: 0.46 }, { pos: [-3.35, 0.5, 6.4], comp: 'engL', r: 0.46 },
    { pos: [3.9, -0.6, 6.75], comp: 'engR', r: 0.42 }, { pos: [-3.9, -0.6, 6.75], comp: 'engL', r: 0.42 },
  ],
  mounts: [
    { w: 'cannon', pos: [-0.62, -0.48, -6.45], comp: 'gunL', grp: 1 }, { w: 'cannon', pos: [0.6, -0.45, -4.5], comp: 'gunR', grp: 1 },
    { w: 'pulse', pos: [4.95, -0.04, 0.6], comp: 'wingR', grp: 2 }, { w: 'pulse', pos: [-4.95, -0.04, 0.6], comp: 'wingL', grp: 2 },
  ],
  stores: { ir: 4, rf: 2, torp: 1, flare: 24 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.6, -0.05, 4.4], r: 1.5, hp: 16 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.6, -0.05, 4.4], r: 1.5, hp: 16 },
    { id: 'gunL', name: 'CANNON L', role: 'gun', pos: [-0.62, -0.45, -3.8], r: 0.9, hp: 10 },
    { id: 'gunR', name: 'CANNON R', role: 'gun', pos: [0.6, -0.45, -3.2], r: 0.7, hp: 10 },
    { id: 'wingL', name: 'PLASMA L', role: 'gun', pos: [-4.6, -0.04, 1.4], r: 0.8, hp: 9 },
    { id: 'wingR', name: 'PLASMA R', role: 'gun', pos: [4.6, -0.04, 1.4], r: 0.8, hp: 9 },
    { id: 'shield', name: 'SHIELD GEN', role: 'shield', pos: [0, 0.2, 1.2], r: 0.9, hp: 20 },
    { id: 'radar', name: 'RADAR', role: 'radar', pos: [0, -0.1, -3.9], r: 0.8, hp: 12 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 2.6], r: 1.0, hp: 30 },
  ],
  shield: { fore: 40, aft: 40 }, armor: { fore: 40, aft: 30, left: 35, right: 35 }, structure: 50,
  maxSpeed: 150, accel: 75, turn: 2.2, shieldRegen: 5, sig: 1,
  flameColor: 0x66c8ff,
};

// ---- CSS HALBERD: Aegis-class escort corvette (60 m) -------------------------
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
    // bridge tower + mast
    tap([0, 5.3, 10], 3.4, [1.6, 2.2], [2.5, 2.4], 0xa9afb7, { sh: 'h' }),
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
  ],
  engines: [{ pos: [0, 0, 31.8], comp: 'engC', r: 1.9 }, { pos: [3.9, 0, 31.6], comp: 'engR', r: 1.25 }, { pos: [-3.9, 0, 31.6], comp: 'engL', r: 1.25 }],
  mounts: [
    { w: 'rail', pos: [0.9, 3.9, -31], comp: 'rail', grp: 1 }, { w: 'rail', pos: [-0.9, 3.9, -31], comp: 'rail', grp: 1 },
  ],
  turrets: [
    { w: 'pd', pos: [3.4, 3.0, -12], comp: 'tur1', side: 1 }, { w: 'pd', pos: [-3.4, 3.0, -12], comp: 'tur2', side: 1 },
    { w: 'pd', pos: [2.2, 3.1, 19], comp: 'tur3', side: 1 }, { w: 'pd', pos: [-2.2, 3.1, 19], comp: 'tur4', side: 1 },
    { w: 'pd', pos: [0, -3.2, -6], comp: 'tur5', side: -1 }, { w: 'pd', pos: [0, -3.3, 14], comp: 'tur6', side: -1 },
  ],
  stores: { flare: 0 },
  comps: [
    { id: 'engC', name: 'ENGINE C', role: 'engine', pos: [0, 0, 26], r: 3.0, hp: 120 },
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-3.9, 0, 26], r: 2.2, hp: 70 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [3.9, 0, 26], r: 2.2, hp: 70 },
    { id: 'rail', name: 'RAILGUN', role: 'gun', pos: [0, 3.5, -12], r: 3.5, hp: 140 },
    { id: 'tur1', name: 'PD 1', role: 'turret', pos: [3.4, 3.0, -12], r: 1.3, hp: 30 },
    { id: 'tur2', name: 'PD 2', role: 'turret', pos: [-3.4, 3.0, -12], r: 1.3, hp: 30 },
    { id: 'tur3', name: 'PD 3', role: 'turret', pos: [2.2, 3.1, 19], r: 1.3, hp: 30 },
    { id: 'tur4', name: 'PD 4', role: 'turret', pos: [-2.2, 3.1, 19], r: 1.3, hp: 30 },
    { id: 'tur5', name: 'PD 5', role: 'turret', pos: [0, -3.2, -6], r: 1.3, hp: 30 },
    { id: 'tur6', name: 'PD 6', role: 'turret', pos: [0, -3.3, 14], r: 1.3, hp: 30 },
    { id: 'shieldF', name: 'SHIELD FWD', role: 'shield', pos: [0, 0, -10], r: 3.0, hp: 90 },
    { id: 'shieldA', name: 'SHIELD AFT', role: 'shield', pos: [0, 0, 16], r: 3.0, hp: 90 },
    { id: 'bridge', name: 'BRIDGE', role: 'radar', pos: [0, 5.3, 10], r: 3.0, hp: 90 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 20], r: 3.6, hp: 200 },
  ],
  shield: { fore: 220, aft: 220 }, armor: { fore: 160, aft: 140, left: 150, right: 150 }, structure: 420,
  maxSpeed: 28, accel: 6, turn: 0.22, shieldRegen: 6, sig: 4, flameColor: 0x66c8ff,
};

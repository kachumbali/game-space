// ======================================================================
//  SHIP DEFINITIONS  — Colonial Defence Force (human)
//  ship space: -Z nose, +Y up, mirrored about X.  Units are metres.
// ======================================================================
const SHIPS = {};
const H = { // palette
  hull: 0x9aa3ad, hull2: 0x838d99, dark: 0x3a4049, panel: 0x5b6572, red: 0xc8402f, canopy: 0x3aa8dc,
  nozzle: 0x2a2d33, white: 0xc9ccd0, navy: 0x2f4a7a, orange: 0xd9772b, glow: 0x7fd0ff, amber: 0xffc060,
};

SHIPS.kestrel = {
  id: 'kestrel', name: 'KESTREL', cls: 'fighter', fac: 'human', role: 'MULTIROLE FIGHTER',
  length: 12, half: [5.6, 2.2, 6.6], mirror: true, radius: 6.4, seam: [1.5, 1.1],
  prims: [
    tap([0, 0, 0.8], 3.7, [0.52, 0.26], [0.98, 0.52], H.hull, { sh: 'h' }),                  // centre fuselage
    tap([0, -0.02, -3.9], 2.0, [0.05, 0.03], [0.52, 0.26], 0x8a949f, { sh: 'd' }),            // chined nose
    tap([0, -0.02, -5.7], 0.5, [0.03, 0.03], [0.17, 0.11], 0x23272e, { sh: 'd' }),            // radome tip
    tap([0, 0, -2.5], 0.2, [0.53, 0.27], [0.54, 0.27], H.red, { sh: 'h' }),                   // nose band
    ell([0, 0.36, -1.7], [0.42, 0.36, 1.3], H.canopy),                                        // canopy
    tap([0, 0.5, 2.2], 2.3, [0.32, 0.12], [0.5, 0.26], 0x838c97, { sh: 'e' }),                // dorsal spine
    tap([0.86, -0.2, 0.2], 1.6, [0.34, 0.3], [0.44, 0.32], 0x6c7682, { sh: 'h' }),            // intake ducts
    tap([0.86, -0.2, -1.25], 0.12, [0.33, 0.29], [0.33, 0.29], 0x14171b),                     // intake mouths
    // main wing (right), swept delta
    tap([2.8, -0.1, 2.5], 2.1, [2.1, 0.14], [0.7, 0.04], H.hull2, { ax: 'x', sweep: 0.5 }),
    tap([4.55, -0.1, 3.375], 0.35, [0.7, 0.05], [0.62, 0.04], H.red, { ax: 'x', sweep: 0.5 }),
    // stabilators
    tap([2.0, -0.05, 5.25], 1.1, [0.85, 0.09], [0.35, 0.03], H.hull2, { ax: 'x', sweep: 0.5 }),
    // canted twin fins
    tap([1.15, 0.85, 4.6], 0.9, [1.1, 0.07], [0.5, 0.04], H.hull, { ax: 'y', sweep: 0.55, rot: [0, 0, -0.42] }),
    tap([1.35, 1.55, 5.0], 0.12, [0.55, 0.08], [0.5, 0.06], H.red, { ax: 'y', sweep: 0.55, rot: [0, 0, -0.42] }),
    // engines
    tap([0.62, 0, 4.9], 1.5, [0.55, 0.42], [0.5, 0.4], 0x6b7480, { sh: 'h' }),
    tap([0.62, 0, 6.05], 0.45, [0.46, 0.36], [0.4, 0.32], H.nozzle, { sh: 'e' }),
    ell([0.62, 0, 6.5], [0.34, 0.28, 0.1], H.glow, { glow: true }),
    // guns: nose cannons + wing-tip plasma bolters
    seg([0.95, -0.12, -2.3], [0.95, -0.12, -3.4], 0.07, 0.06, H.dark),
    seg([4.7, -0.08, 2.9], [4.7, -0.08, 1.7], 0.13, 0.1, H.dark),
    ell([4.7, -0.08, 1.65], [0.1, 0.1, 0.08], 0x66ffcc, { glow: true }),
    // details
    seg([0, 0.55, 1.0], [0, 0.95, 1.5], 0.04, 0.02, H.dark),
    ell([-4.9, -0.1, 3.4], [0.09, 0.06, 0.09], 0xff3030, { glow: true, noMirror: true }),
    ell([4.9, -0.1, 3.4], [0.09, 0.06, 0.09], 0x30ff60, { glow: true, noMirror: true }),
    tap([0, 0.04, 3.2], 0.5, [0.7, 0.2], [0.7, 0.2], H.panel, { sh: 'h', dots: { col: 0xffd070, p: 0.05 } }),
  ],
  engines: [{ pos: [0.62, 0, 6.6], comp: 'engR', r: 0.34 }, { pos: [-0.62, 0, 6.6], comp: 'engL', r: 0.34 }],
  mounts: [
    { w: 'cannon', pos: [0.95, -0.12, -3.5], comp: 'gunR', grp: 1 }, { w: 'cannon', pos: [-0.95, -0.12, -3.5], comp: 'gunL', grp: 1 },
    { w: 'pulse', pos: [4.7, -0.08, 1.6], comp: 'wingR', grp: 2 }, { w: 'pulse', pos: [-4.7, -0.08, 1.6], comp: 'wingL', grp: 2 },
  ],
  stores: { ir: 4, rf: 2, torp: 1, flare: 24 },
  comps: [
    { id: 'engL', name: 'ENGINE L', role: 'engine', pos: [-0.62, 0, 4.9], r: 0.9, hp: 16 },
    { id: 'engR', name: 'ENGINE R', role: 'engine', pos: [0.62, 0, 4.9], r: 0.9, hp: 16 },
    { id: 'gunL', name: 'CANNON L', role: 'gun', pos: [-0.95, -0.1, -2.4], r: 0.6, hp: 10 },
    { id: 'gunR', name: 'CANNON R', role: 'gun', pos: [0.95, -0.1, -2.4], r: 0.6, hp: 10 },
    { id: 'wingL', name: 'LASER L', role: 'gun', pos: [-4.3, -0.1, 2.3], r: 0.7, hp: 9 },
    { id: 'wingR', name: 'LASER R', role: 'gun', pos: [4.3, -0.1, 2.3], r: 0.7, hp: 9 },
    { id: 'shield', name: 'SHIELD GEN', role: 'shield', pos: [0, 0.1, 2.0], r: 0.9, hp: 20 },
    { id: 'radar', name: 'RADAR', role: 'radar', pos: [0, 0, -3.6], r: 0.7, hp: 12 },
    { id: 'power', name: 'REACTOR', role: 'power', pos: [0, 0, 3.4], r: 1.0, hp: 30 },
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

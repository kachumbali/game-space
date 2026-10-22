import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests'))
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
import re
p=REPO+'/src/31_ships_frogg.js'
s=open(p).read()

KIT = r'''
// ---- v2 look (2026-10-21): dark lamellar plating, rust streaks, blunt pearl-eyed prows, trailing blades ----
const N = { dk: 0x1f1a18, dk2: 0x2d2622, mt: 0x4a4540, ru: 0x9a6232, ru2: 0xb7803f, pr: 0xdcf2e8, bl: 0x14110f, hot: 0xffa030, ven: 0x9dff3a };
const nSt = (per, sl = 0.2) => ({ col2: N.ru, mot: 0.7, strata: [per, sl], streak: 1 });
// pearl eye: socket ring + glowing disc facing forward (+x side, mirrored)
const nEye = (x, y, z, s = 1) => [
  ell([x, y, z + 0.12 * s], [0.62 * s, 0.62 * s, 0.34 * s], N.mt, { col2: N.ru, mot: 1 }),
  ell([x, y, z - 0.1 * s], [0.46 * s, 0.46 * s, 0.2 * s], N.pr, { glow: true, glowF: 1.5 }),
];
// swept flat blade
const nBlade = (a, b, r = 0.2, col = N.bl) => seg(a, b, r, 0.015, col, { fy: 0.38, col2: N.ru, mot: 2 });
// spike (round)
const nSpike = (a, b, r = 0.15, col = N.dk2) => seg(a, b, r, 0.012, col, { col2: N.ru, mot: 2 });
// pod with pearl lights
const nPod = (c, r, col = N.dk2, p = 0.2) => ell(c, r, col, { col2: N.ru, mot: 1, dots: { col: N.pr, p, f: 1.9 } });
// engine nacelle + glowing nozzle (x,y at nozzle; z0 = front of nacelle, z1 = nozzle plane)
const nNoz = (x, y, z0, z1, r) => [
  tap([x, y, (z0 + z1) / 2], (z1 - z0) / 2, [r * 0.8, r * 0.7], [r * 1.1, r * 1.0], N.dk, { sh: 'e', ...nSt(r * 0.5, 0) }),
  ell([x, y, z1 + r * 0.1], [r * 0.95, r * 0.85, r * 0.25], N.hot, { glow: true, glowF: 1.7 }),
  seg([x + r * 0.9, y, z1 - r * 1.6], [x + r * 1.5, y, z1 + r * 0.8], r * 0.12, 0.012, N.bl),
];
'''

SHIPS = {}
SHIPS['darter'] = r'''
    ell([0, 0, 0.5], [0.9, 0.58, 3.9], N.dk, nSt(0.2)),                                   // layered body
    ell([0, 0.34, 0.2], [0.62, 0.3, 2.6], N.dk2, nSt(0.16)),                               // upper plate
    ell([0, -0.05, -3.2], [0.78, 0.55, 1.05], N.dk, nSt(0.2)),                             // blunt prow
    ...nEye(0.46, 0.12, -3.95, 0.95),
    nPod([0.62, -0.32, -1.1], [0.32, 0.26, 0.65]),
    nSpike([0, 0.5, -0.6], [0, 1.1, 1.6], 0.14), nSpike([0, 0.45, 0.8], [0, 0.95, 3.0], 0.11),
    nBlade([0.55, 0.05, 0.8], [3.9, -0.05, 5.0], 0.22), nBlade([0.5, -0.2, 1.6], [2.6, -0.35, 5.2], 0.16),
    ...nNoz(1.0, -0.15, 3.4, 4.9, 0.3),
    seg([0.4, -0.3, -3.5], [0.4, -0.3, -4.9], 0.09, 0.06, N.bl),                           // mouth guns'''
SHIPS['leaper'] = r'''
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
    seg([0.65, -0.42, -5.6], [0.65, -0.42, -6.6], 0.13, 0.09, N.bl),'''
SHIPS['spitter'] = r'''
    ell([0, 0, 0.8], [1.9, 1.05, 6.6], N.dk, nSt(0.3)),
    ell([0, 0.7, 0.4], [1.3, 0.6, 4.6], N.dk2, nSt(0.26)),
    ell([0, 0.05, -5.0], [1.6, 1.0, 2.2], N.dk, nSt(0.3)),
    ...nEye(0.95, 0.3, -7.0, 1.45),
    nPod([0, -1.5, -1.0], [1.9, 1.25, 2.6], N.dk2, 0.28),                                  // acid sac cluster
    nPod([1.9, -1.1, 1.2], [1.0, 0.8, 1.7], N.dk2, 0.24),
    seg([0, 1.35, -3.0], [0, 1.35, -8.8], 0.95, 0.55, N.dk, { col2: N.ru, mot: 1 }),       // dorsal acid cannon
    ell([0, 1.35, -8.9], [0.5, 0.5, 0.25], N.ven, { glow: true, glowF: 1.7 }),
    nSpike([0, 1.5, 0.0], [0, 2.8, 3.4], 0.25), nSpike([0, 1.2, 2.2], [0, 2.3, 5.6], 0.2),
    nBlade([1.9, 0.2, -0.2], [7.4, -0.1, 7.4], 0.38), nBlade([1.8, -0.4, 1.4], [5.2, -0.6, 8.6], 0.28),
    ...nNoz(2.8, -0.3, 6.2, 8.4, 0.72),
    seg([1.6, -0.5, -7.2], [1.6, -0.5, -8.0], 0.16, 0.1, N.bl),'''
SHIPS['toad'] = r'''
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
    seg([1.0, 0.1, -8.4], [1.0, 0.1, -7.6], 0.18, 0.12, N.bl),'''
SHIPS['reaver'] = r'''
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
    seg([1.2, -0.55, -8.0], [1.2, -0.55, -8.8], 0.18, 0.12, N.bl),'''
SHIPS['gulper'] = r'''
    // lamellar barrel hull
    ell([0, 0, 2], [9.6, 6.4, 29], N.dk, nSt(0.85, 0.12)),
    ell([0, 4.0, 0], [7.8, 2.8, 22], N.dk2, nSt(0.75, 0.12)),
    ell([0, 6.0, -2], [5.4, 1.9, 15], N.dk, nSt(0.7, 0.12)),
    ell([0, 7.5, -4], [3.2, 1.2, 9], N.dk2, nSt(0.6, 0.12)),
    ell([0, -0.4, -28], [7.4, 5.2, 7.4], N.dk, nSt(0.8, 0.1)),                              // blunt prow
    ell([0, 3.4, -26], [4.8, 2.4, 6], N.dk2, nSt(0.7, 0.1)),
    ...nEye(3.0, 0.8, -34.0, 2.6), ...nEye(6.2, -0.6, -31.8, 1.4),
    nPod([5.2, 1.0, -22], [2.2, 1.6, 3.6], N.dk2, 0.22), nPod([7.4, -1.6, -14], [2.0, 1.4, 3.0], N.dk2, 0.22),
    // ventral drum (supply/launch bay)
    seg([0, -6.4, -8], [0, -6.4, 20], 4.4, 3.8, N.dk, { col2: N.ru, mot: 1, dots: { col: N.pr, p: 0.07, f: 1.9 }, strata: [0.9, 0], streak: 1 }),
    ell([0, -6.4, 21], [3.6, 3.4, 2.0], N.dk2, nSt(0.7, 0)),
    // dorsal crest of spikes
    ...[-8, -2, 4, 10, 16, 22].map((z, i) => nSpike([0, 7.6 - i * 0.5, z], [0, 11.5 - i * 0.9, z + 6 + i * 0.4], 0.9 - i * 0.07)),
    // sting turret bases
    ell([3.6, 4.7, -2], [1.7, 0.9, 1.7], N.mt, { col2: N.ru, mot: 1 }), ell([3.4, 4.8, 14], [1.7, 0.9, 1.7], N.mt, { col2: N.ru, mot: 1 }),
    // trailing blades
    nBlade([8, 0.5, 6], [16.5, 0.2, 34], 0.9), nBlade([7, -3, 12], [14, -3.8, 36], 0.7), nBlade([6, 3.5, 4], [12, 5.6, 30], 0.6),
    // engine nacelles
    ...nNoz(9.5, -1.0, 24, 35.4, 2.7), ...nNoz(3.8, -2.2, 31, 36.0, 1.5),
    seg([5.5, -2.4, -30], [5.5, -2.4, -35.3], 1.3, 0.8, N.bl),'''

for sid,new in SHIPS.items():
    m=re.search(r"SHIPS\."+sid+r" = \{",s); st=m.start()
    a=s.index("  prims: [\n",st)+len("  prims: [\n")
    b=s.index("\n  ],\n",a)
    s=s[:a]+new.strip("\n")+s[b:]
# insert kit before first ship
i=s.index("// ---- DARTER")
s=s[:i]+KIT+"\n"+s[i:]
open(p,'w').write(s)

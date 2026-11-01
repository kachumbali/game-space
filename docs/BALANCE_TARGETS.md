# Balance targets (PROPOSED, v0.3 M1 draft)

Status: **draft for the owner to accept or change; nothing here is tuned yet.** Agreed by the owner (plan v0.3, M2/M3): the size roles, the 3 s rule, the missile hit counts and the torpedo share. Every concrete number below marked PROPOSED was chosen by the harness author and needs the owner's decision. Measured baseline: `docs/BALANCE_BASELINE.md` (`python3 tools/tests/ttk_matrix.py`, 20 seeds). Times are sim-seconds (real = sim / 0.375). The ceiling numbers are a stationary perfect-solution best case for one weapon, so duel targets should sit well above the ceiling.

## 1. Roles by size (agreed)

| Class | Role | Must be good at | Must NOT be able to |
|---|---|---|---|
| S turret | anti-fighter and kinetic PD | killing missiles, shredding light fighters | hurt corvettes or bigger |
| M turret | corvette and bomber killer | corvette, Bittern/Toad/Reaver | out-DPS an L against capitals |
| L turret | anti-capital | frigate, capital | be a fighter weapon |
| XL spine | capital killer | one-shot corvettes, big chunk of frigate/capital | hit fighters at all |

## 2. Targets, with where the baseline stands

| Target | Value | Status | Baseline (ceiling, one weapon) |
|---|---|---|---|
| Any capital gun (M, L, XL turret or fixed capital mount) vs a fighter: beam time to kill | **>= 3 s** of beam time, fighters not instant-killed (agreed) | PROPOSED refinement: also >= 6 s for a single M turret vs Kestrel-class | LS-8 (M) 2.2 s Darter, 2.9 s Leaper, 5.7 s Merlin; M-8 (L) 1.6 s Darter, 1.9 s Leaper; M-7 lance 1.8 s Darter. Below target for light fighters; fine for Kestrel (9-18 s). |
| Capital beam duel: AI Kestrel skill 3 dead within 3 s of first beam hit | **<= 5% of runs** (PROPOSED number) | already met in the AI duel: 0 of 20 in every cell | 11 s median (Exeter, full), 15 s (Halberd, full) |
| S turret (pd, thorn, sting) vs light fighter, single turret | **6-15 s** to kill (PROPOSED) | far off, too weak: 24-95 s | pd 48 s Darter, 95 s Merlin; thorn 40/72 s; sting 46/80 s |
| S turret vs corvette | negligible (agreed: not their job) | met | > 120 s |
| M turret (acidT, laserM, mdl) vs corvette | **10-25 s** per turret (PROPOSED) | laserM 14-17 s ok; acidT 48-66 s and mdl 32-67 s too weak | see baseline |
| L turret (mdl, lanceL) vs frigate (Exeter) | **30-60 s** per turret (PROPOSED) | lanceL 31 s ok; mdl > 120 s too weak | |
| Anything vs capital (Bullfrog), single L/M turret | **> 60 s** (PROPOSED), a fleet job | lanceL 50 s, laserM 100 s | |
| XL spine vs fighter | **cannot kill** (agreed): tracking, not damage | by AI rule only (capitalAI skips fighters); the shot itself kills a fighter if aligned | 1 shot after 5-6 s charge |
| XL spine vs corvette / frigate | corvette: 1 shot; frigate: 3-5 shots (PROPOSED) | corvette 1, Exeter 3 (mdxl) / 5 (spine), Bullfrog 6 / 7 | ok |
| Light / medium fighter (Merlin, Darter, Kestrel, Leaper) vs one missile hit type (SW-9, SK-1, LN-3) | **1-2 missile hits** (agreed) | far off | Merlin 4-6, Darter 3-4, Kestrel 7-13, Leaper 4-5 |
| Heavy fighter / bomber (Bittern, Toad, Reaver) vs those missiles | **up to 3 hits** (agreed) | far off | Toad 6-8, Reaver 7-10, Bittern 16-24 |
| Torpedo vs frigate (HM-1, ST-2 vs Exeter) | **10-15% of the frigate's pool per hit** (agreed) so 7-10 to kill | far off: 3-5% each, 20-32 to kill | torp 32, tad 25 head-on |
| Only warheads kill a frigate outright (agreed) | NK-1 / strategic only; no gun or missile does it alone in under ~60 s | already true for guns; torpedoes only after 20+ | |
| Torpedo vs corvette | **3-4 hits** (PROPOSED) | 6-10 | torp 10 head-on, 7 broadside |
| Fighter missile vs corvette | small but non-zero from every aspect | broken head-on (0 damage), 29-38 broadside | immune head-on |

## 3. Defects found while measuring (not balance numbers, fix in M2/M3)

1. `blastAt` measures missile blast range from a sphere of 0.62 R around the ship centre (hullGap only for R > 150). Halberd (128 m) and Gulper (146 m) are bigger than their `half`/`radius` in db.json suggest (scaleShip doubles them at load), so a bow-on SW-9 / SK-1 / LN-3 detonates at the nose, out of blast range, and does 0 damage.
2. Fighter missiles lose almost everything after the first hit: the first deals the full shield-stripping damage, the next ones are absorbed by armour thresholds (damage per missile in the baseline table). Raise missile `dmg` or lower the fighter armour threshold if 1-2 hits is to hold.
3. Fixed and turret kinetic guns dig voxel tunnels in a frozen target; the harness randomises aspect to avoid it, a real stationary target (a docked ship, a player parked in a fight) is shot through, so hit rates drop with time on target.

## 4. Open questions for the owner

- Is the 3 s rule about continuous beam time on one fighter (the harness measure) or about total time under any capital fire?
- Should torpedo percentages count shield plus structure (pool, as the harness does) or structure only?
- Do the S turrets stay mostly a missile-defence weapon (numbers today) or should they become real fighter killers (PROPOSED 6-15 s)?

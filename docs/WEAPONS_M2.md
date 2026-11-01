# Weapons by size (v0.3 M2)

Status: implemented on branch `v0.3-m2-weapons`, measured with the M1 harness (`tools/tests/ttk_matrix.py`), **not hand-played**. All times are sim-seconds (real = sim / 0.375). Before = `docs/data/ttk_ceiling.json` / `ttk_capbeam.json` (M1 baseline); after = same harness, 20 seeds, same rig. The ceiling rig is a stationary perfect-solution best case for ONE weapon, so duel times in play are longer.

## Mechanics added (all numbers in `data/db.json`)

| Mechanic | Where | db field |
|---|---|---|
| Beam charge-up: the first pulse on a new target, or after contact was lost longer than `gap`, starts a charge (no tracking beam, no damage): the emitter glows and grows, a rising whine plays (`sfx beamcharge`); then the existing `acq` tracking phase, then the `ramp` | `beamFocus` / `fireBeam` (60_weapons), `renderBeams` (61_beams), `SFX.beamcharge` | `weapons.<beam>.charge` (s) |
| Slower damage ramp | existing mechanic | `ramp`, `peak`, `acq` |
| Turret slew in degrees per second (replaces the older `track` rad/s when present) | `updateTurrets` | `weapons.<turret>.slew` |
| Per-target-class damage multiplier for bolts | bolt hit in `updateBolts` | `weapons.<id>.vsCls {corvette, frigate, capital}` |
| Missile-defence damage kept at the old per-shell value while the shell hits fighters harder | `updateBolts` flak branch | `weapons.<id>.dmgMsl` |
| XL spine cannot target or hit fighters: the charge fizzles ("no fire-control solution on a fighter") and `spineFire` skips fighter-class hulls. Not only an AI rule: the machine itself refuses | `spineStep`, `spineFire` (79_bullfrog) | `weapons.mdxl/spine.hitFighters` (false) |
| Kinetic PD leaves a capacitor reserve: it stops firing at ships below `reserveShip` x energyMax, at missiles below `reserveMsl` | `updateTurrets` | `tuning.turret` |
| Gunner doctrine: a turret scores any ship that is targeting its own ship x `attackerBias` (0.5), so a bomber's gunners engage the fighter on its six first; missiles still come first | `updateTurrets` | `tuning.turret.attackerBias` |

Values now in the db:

| weapon | class | slew deg/s (was) | charge s | acq s | ramp s (was) | peak | other |
|---|---|---|---|---|---|---|---|
| laser LS-2 | capital M | 45 (126) | 0.5 | 0.5 | 2.5 (0.8) | 3 | |
| laserM LS-8 | M | 35 (103) | 0.6 | 0.6 | 3.0 (0.8) | 3 | |
| lanceL M-8 | L | 20 (52) | 0.8 | 0.8 (0.6) | 4.5 (1.0) | 2.6 (3) | |
| lance M-7 (Gulper bow, fixed) | corvette | ship turn | 0.6 | 1.0 (0.8) | 5.0 (1.0) | 3 | |
| mdl MD-55 | L | 25 (69) | | | | | dmg 85 (60), cd 1.0 (2.2) |
| acidT M-6T | M | 40 (92) | | | | | dmg 40 (24), cd 0.75 (1.3) |
| pd / thorn / sting | S | unchanged | | | | | dmg 4.3 (1.3) / 3.5 (1.2) / 3.9 (1.5); `vsCls` 0.3/0.25/0.25; `dmgMsl` = old dmg; pd energy 0.45 (3.0) |
| mdxl, spine | XL | | | | | | `hitFighters` false |

## Before / after (20 seeds, ceiling rig, mean sim-s to kill; "before / **after**")

**S turrets** (target: about 12-25 s on a light fighter for one turret, corvettes unharmed)

| weapon | merlin | darter | kestrel | leaper | bittern | toad | reaver | halberd | gulper | exeter |
|---|---|---|---|---|---|---|---|---|---|---|
| pd | 94.9 / **24.1** | 47.8 / **14.9** | 95.7 / **25.8** | 35.4 / **10.2** | 48.3 / **14.8** | 23.8 / **7.4** | 40.3 / **10.1** | >120 (56%) / **>120 (56%)** | >120 (58%) / **>120 (58%)** | >120 (31%) / **>120 (29%)** |
| thorn | 71.8 / **22.3** | 40.3 / **12.8** | 79.4 / **24.4** | 30.5 / **10.3** | 88.3 / **29.4** | 22.6 / **7.7** | 25.8 / **6.9** | >120 (57%) / **>120 (56%)** | >120 (57%) / **>120 (48%)** | >120 (34%) / **>120 (31%)** |
| sting | 79.9 / **27.8** | 46.1 / **17.5** | 75.2 / **26.5** | 35.1 / **12.8** | 92.7 / **34.6** | 24.7 / **9.5** | 22.7 / **8.5** | >120 (59%) / **>120 (56%)** | >120 (67%) / **>120 (48%)** | >120 (35%) / **>120 (30%)** |

Light fighters (Merlin, Darter) land at 13-28 s (Merlin is the small, hard-to-hit one and sits at the top of the band). Corvettes and frigates stay out of reach: the pool-damage fraction after 120 s is the same as before.

**Capital beams** (target: no kill under about 3 s of beam time; times include the charge-up)

| weapon | merlin | darter | kestrel | leaper | bittern | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|---|---|---|---|---|
| laser | 5.9 / **11.2** | 3.2 / **4.4** | 13.3 / **30 (19/20)** | 4.2 / **5.5** | 30.7 / **31.4** | 31.9 / **39.4** | 26.0 / **27.4** | 117 (16/20) / **117 (1/20)** | >120 (44%) / **>120 (44%)** |
| laserM | 5.7 / **8.2** | 2.2 / **3.8** | 9.4 / **28 (18/20)** | 2.9 / **4.4** | 16.3 / **18.2** | 16.8 / **21.8** | 14.0 / **15.7** | 61.2 / **64.7** | 100.3 / **102.9** |
| lance | 2.3 / **4.9** | 1.8 / **3.7** | 3.7 / **6.6** | 2.1 / **4.2** | 8.3 / **11.0** | 11.1 / **14.6** | 7.0 / **9.6** | 31.3 / **34.3** | 68.0 / **70.9** |
| lanceL | 6.9 / **12.4** | 1.6 / **3.6** | 18 (18/20) / **33 (10/20)** | 1.9 / **4.2** | 8.5 / **12.3** | 9.8 / **23.1** | 7.3 / **10.9** | 31.0 / **39.1** | 49.9 / **62.6** |

Fastest single run on the weakest fighter (Darter, charge included): laser 3.8 s, laserM 3.3 s, lance 3.6 s, lanceL 3.3 s; minus the charge (0.5-0.8 s) the live beam needs 2.7-3.3 s. The "about 3 s" rule holds on the weakest fighter and is comfortable on everything else.

**M and L turrets** (targets: M on a corvette 10-25 s; L on Exeter 30-60 s, > 60 s on Bullfrog)

| weapon | merlin | darter | kestrel | bittern | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|---|---|---|---|
| acidT | 12.5 / **5.0** | 6.0 / **3.3** | 19.6 / **9.8** | 63.3 / **22.6** | 66.1 / **22.5** | 48.4 / **17.0** | >120 (51%) / **88.3** | >120 (37%) / **109.2** |
| mdl | 7.1 / **1.7** | 5.6 / **0.3** | 26 (19/20) / **8.8** | 28.8 / **22 (18/20)** | 66.9 / **18.7** | 31.7 / **10.2** | >120 (70%) / **49.1** | >120 (36%) / **88.2** |

laserM on a corvette: 21.8 / 15.7 s (in band). lanceL: Exeter 39.1 s (in band), Bullfrog 62.6 s (just over 60). mdl: Exeter 49.1 s, Bullfrog 88.2 s. acidT on a corvette 17-22.5 s.

**XL spine**: both spines now do nothing to any fighter or bomber (0% pool damage, `hitFighters` false) and are unchanged elsewhere: one shot kills Halberd and Gulper, Exeter 3 shots (MK-90, 65 s incl. charge and cooldowns) or 5 shots (GX-1, 126 s), Bullfrog 6 / 7 shots.

**AI Kestrel (skill 3) flying at a capital, 20 runs per cell** (`capbeam`; "beams" = only the beam weapons armed, "full" = everything):

| capital / variant | before | after |
|---|---|---|
| Exeter beams only | died 19/20, median 20.6 s | died 4/20, median 19.3 s |
| Exeter full | died 20/20, median 13.3 s | died 16/20, median 11.5 s |
| Halberd beams only | died 14/20, median 41.2 s | died 3/20, median 44.5 s |
| Halberd full | died 20/20, median 19.4 s | died 20/20, median 14.2 s |
| Gulper full | 0/20 | 2/20 (median 14.8 s) |

No fighter died within 3 s of the first beam hit in the beams-only variants (0/20 before and after). In "full" Halberd, 2/20 died within 3 s of the first beam hit; those were already being killed by the four PD turrets (hit kind `gun`), not by the beams.

## Energy (decision 5)

PD cost 3.0 per round x 13.3 rounds/s = 40/s per turret: two Bittern turrets (regen 35/s, capacitor 150) emptied the capacitor in about 3 s, four Halberd turrets (160/s) exceeded the corvette's whole regen (100/s). Now 0.45/round = 6/s per turret: two Bittern turrets use 12/s of 35 (a third of the regen: noticeable next to guns, on a Kestrel-class 17/s regen a single turret would be 35%), Halberd 24/s of 100, Exeter 18/s of 350, Hecla's 40 turrets 240/s of 1600. On top of that the reserve rule stops PD at 25% capacitor against ships (5% against missiles), so the lasers and guns keep their last quarter.

## AI and gunners

The Bittern's two PD turrets already existed. A gunner now picks (1) hostile missiles that target the ship or come within 500 m, then (2) among ships, the one with the lowest score, where a ship that is targeting the gunner's ship counts half its distance. `tools/tests/gunner_t.py`: an AI Bittern with a hostile Kestrel on its six fires 264 rounds in 20 sim-s and takes 128 shield+hull points off the Kestrel; below the capacitor reserve the turrets hold fire. Toad and Reaver have no turrets: giving them one needs a seat prim and a hit zone per hull and was not done here.

## Point defence versus missiles

The shell damage used against missiles is frozen at the old value (`dmgMsl`), so PD lethality against missiles is not increased. The only change in missile defence is the cheaper rounds (the Bittern's turrets no longer starve) and the reserve rule. An A/B rig (salvos of SW-9 / SK-1 / HM-1 at a Bittern and a Halberd, old db against new) was tried and discarded: both sides took 0 damage, so it cannot discriminate. The evidence is therefore indirect: damage against missiles is unchanged by construction, `msl_t.py` (AI missile budget duels), `pd_t.py` and `tender_pd_t.py` pass, and the PD turrets of a Bittern keep firing under the new energy cost (`gunner_t.py`). A real interception-rate measurement is still open (M3, together with torpedo durability).

## What could NOT be measured

- A human pilot: slew limits, charge telegraph readability, whether the whine is audible over the music, and how it feels to be lasered in a dogfight. All of it rests on the AI Kestrel duel.
- Several turrets focusing on one fighter: each turret keeps its own focus and charge; the harness measures one turret. Four PD turrets together on a Kestrel kill it in about 8 s (see "full" cells), which is a design consequence of "S turrets kill fighters slowly" times their count. Capitals are about as lethal to AI fighters as before, only through PD instead of beams.
- Moving-target hit probabilities for the slewing turrets (the ceiling rig re-draws the aim point every step, and the turret lead is perfect).
- Bullfrog as duel capital, torpedoes against PD (M3), real GPU timing.

## Risks

- `mdl` (MD-55, L) one-shots light fighters in the rig (Darter 0.3 s) because the turret was strengthened against corvettes; it is `bigOnly` beyond 900 m and slews at 25 deg/s, but at close range a fighter that sits in its arc is deleted. Consider a `vsCls` fighter multiplier if hand-play shows it.
- `acidT` bolts are slow (430 m/s); the retune assumes they hit.
- S turrets together (Hecla 40, Bullfrog 18) are a strong anti-fighter screen now by construction.
- Fixed Gulper lance charge: the lance restarts its charge whenever contact is lost for 0.7 s; against a jinking fighter it may rarely get past the charge.

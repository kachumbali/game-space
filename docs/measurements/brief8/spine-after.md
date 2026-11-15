# Job U: spine gun measurements

20 seeds (1–20), varied opening, skill 3, 180 s limit; left / right / timeout, followed by median resolved fight duration. Baseline is merged main a34a852. Direct spine kills count deaths attributed to the spine, including escorts; a spine hit can influence a fight without delivering the final blow.

| Cell | Before | After | Median before → after (s) | Direct spine kills before → after |
|---|---:|---:|---:|---:|
| Glaive vs Exeter | 20 / 0 / 0 | 20 / 0 / 0 | 33.57 → 19.53 | 3 → 12 |
| Columbus vs Bullfrog | 9 / 11 / 0 | 0 / 20 / 0 | 81.22 → 54.10 | 2 → 14 |
| Columbus + 2 Halberds vs Bullfrog | 13 / 7 / 0 | 6 / 14 / 0 | 76.50 → 56.33 | 0 → 11 |
| Hecla vs Bullfrog | 2 / 18 / 0 | 0 / 20 / 0 | 78.48 → 54.10 | 1 → 14 |
| Halberd vs Gulper | 20 / 0 / 0 | 20 / 0 / 0 | 16.95 → 16.95 | 0 → 0 |
| Kestrel vs Leaper | 19 / 0 / 1 | 19 / 0 / 1 | 56.27 → 56.27 | 0 → 0 |
| Kestrel vs Reaver | 19 / 1 / 0 | 19 / 1 / 0 | 40.70 → 40.70 | 0 → 0 |
| Falchion vs Reaver | 20 / 0 / 0 | 20 / 0 / 0 | 30.85 → 30.85 | 0 → 0 |
| 4 Kestrels vs Gulper | 20 / 0 / 0 | 20 / 0 / 0 | 18.85 → 18.85 | 0 → 0 |

Total direct spine kills: 6 → 51 in 180 fights (escort deaths included). The Bullfrog now wins all 20 lone-Columbus fights in this sample, a substantial balance shift. Raw runs are in `spine-duels-before.csv` and `spine-duels-after.csv`.

## Isolated fresh-target probe

Two immediate stationary spine hits with no regeneration, using normal hit and component rules. Fraction is combined hull and shield pool removed; hull death can occur with an untouched opposite shield facet.

| Shooter → target | First hit: shield / hull loss | First pool fraction | After second |
|---|---:|---:|---|
| Bullfrog → Columbus | 2300 / 1841 | 49.8% | destroyed; 86.2% of initial pool removed |
| Glaive → Bullfrog | 690 / 1480 | 44.3% | destroyed; 88.5% removed |
| Glaive → Exeter | 690 / 1480 | 66.0% | destroyed |

The energy law's `spine` rate changed from 0.89 to 0.23 MJ/damage for the energy lance; `spineKinetic` is 0.50 for mass drivers. Shot capacitor share and energy draw remain 0.32 and unchanged. Law outputs: lance damage 1096 → 4239, mass drivers 756 → 1346 and 1385 → 2466. Charge / frozen lock: lance 6 / 1.5 → 4.5 / 1 s; drivers 5 / 1.5 → 4 / 1 s. Aim tolerance radius factor 0.45 → 0.60 and cap 0.04 → 0.08 rad, minimum unchanged at 0.012. Start checks use the actual remaining turn time.

## Trace and accuracy

Seed 1, same varied opening. Before Glaive–Exeter: 2 charges (one per side), 0 fizzles, 2 hits, 0 misses; combined shield and hull loss approximately 1218 on Exeter and 666 on Glaive. Before Bullfrog–Columbus: 2 charges, 0 fizzles, 2 hits, 0 misses; approximately 1315 and 1271 combined loss. Before shield-after samples are taken at the end of the update and may include other actions. After: Glaive–Exeter had 2 charges, 0 fizzles and 2 hits; Bullfrog–Columbus had 2 charges, 0 fizzles and 2 hits. Exact after-hit shields are logged at impact. The 20-seed after traces contain 75 charges, 68 released hits, no recorded fizzles or misses, and seven charges without a recorded shot; the fight can end or a firing component can be lost before release. See JSONL logs for details.

The focused tests cover fighter immunity, friendly corridor, charge timing, and 30–50% first-hit / two-hit capital cases. These are AI and pinned-target simulations, not human play. Real iPad performance is unverified.

# Job T measurements (work in progress)

Twenty seeds per cell, 180 s limit, skill 3, with reproducible varied openings as implemented in `tools/tests/armament_duels.py`. Results are human / FROGG / timeout. These are AI simulations, not player results.

| Cell | Baseline | After relevant AI change |
|---|---:|---:|
| Kestrel vs Leaper | 19 / 0 / 1 | not run |
| Kestrel vs 2 Leapers | 6 / 13 / 1 | not run |
| Kestrel vs Reaver | 19 / 1 / 0 | 19 / 1 / 0 |
| Falchion vs Reaver | 20 / 0 / 0 | 20 / 0 / 0 |
| Falchion vs 2 Reavers | 20 / 0 / 0 | 20 / 0 / 0 |
| Halberd vs Gulper | 20 / 0 / 0 | 20 / 0 / 0 |
| Halberd vs 2 Gulpers | 0 / 20 / 0 | 0 / 20 / 0 |

The Gulper's rod drivers fired in a seed-1 trace, but its lances were held until 1,300 m even though their range is 2,500 m; the Gulper died before closing that far. The AI change permits beam secondaries to engage at their range. Its two-on-one median fell from 34.27 to 31.87 s; one-on-one remained 33.43 s. The Reaver seed-1 trace showed repeated drone targeting while the Falchion attacked; both gun components and the reactor were damaged. Guns are exposed, the reactor receives internal damage. The target-choice change increased the one-on-one median from 14.53 to 16.68 s, but did not change the win counts.

Two exploratory eight-seed probes failed to achieve the targets. One changed Leaper and Reaver movement and Gulper movement and torpedo load; another changed Reaver shields and gun exposure and removed Gulper torpedoes. Neither produced a Reaver win or a Halberd win against two Gulpers. Those experimental data changes were reverted. No tuning values have been accepted; these results do not satisfy Job T. The remaining full after table, regression tests, and real-device verification are outstanding.

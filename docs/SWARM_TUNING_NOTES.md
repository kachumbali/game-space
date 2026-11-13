# Swarm tuning investigation (unfinished)

Baseline: `1f69b59`, `tools/tests/armament_duels.py`, seeds 1–20, 180 s limit. Left/right counts are human/FROGG wins; the harness includes the human ships' normal drones.

| Cell | Human | FROGG | Timeout |
|---|---:|---:|---:|
| Halberd vs Gulper | 20 | 0 | 0 |
| Kestrel vs Leaper | 18 | 0 | 2 |
| Kestrel vs Reaver | 20 | 0 | 0 |
| Falchion vs Reaver | 20 | 0 | 0 |
| 4 Kestrels vs Gulper | 20 | 0 | 0 |
| Kestrel vs 2 Leapers | 8 | 11 | 1 |
| Falchion vs 2 Reavers | 20 | 0 | 0 |
| Halberd vs 2 Gulpers | 0 | 20 | 0 |

The two-Gulper times were exceptionally concentrated (about 39.7–39.8 s), so seed variation in this fixed head-on setup does not provide much variation in that cell. This is a limitation of the measurement, not proof of general combat balance.

In seed 1, Leaper exhausted its capacitor, whereas Gulper's energy stayed above 98% in its loss. In Falchion vs Reaver seed 1, Reaver targeted a Kite drone for much of the engagement, lost both gun components, then its reactor; it died with structure remaining. A five-seed diagnostic with Falchion drones disabled still had Falchion win all five 1v1s, but won only three of five 1v2s. This was a diagnostic control, not a proposed human ship change.

Exploratory five-seed trials are not balance evidence. Greater fighter turn/acceleration and an 8 s bank did not produce the requested Reaver results; a 20 s bank plus Reaver subsystem durability produced human wins of 3/5 against Kestrel and 5/5 against Falchion, and 3/5 in Falchion vs two Reavers. Doubling fighter energy weapon damage changed Leaper vs Kestrel to 3/5 human wins but did not improve Falchion vs Reaver (5/5). Priority changes targeting drones likewise left Falchion at 5/5 in both Reaver cells. None of these trials is retained.

The fighter branch of `tools/armament_law.py` computes new `burstMJ` by subtracting the old total capacitor rather than the original base capacitor when the requested burst time increases. A repeated application does not correct this. The working tree corrects this calculation and includes an idempotence regression test; it has not yet been committed or gated.

Outstanding: find an acceptable candidate, rerun all cells with 20 seeds, run the three specified regression tests and the gate, then report the before/after table and exact values in the PR. No real iPad performance or player feel was verified.

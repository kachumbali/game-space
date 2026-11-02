# P1 capital-laser split — measurement record

Date: 2026-11-02. Harness: `tools/tests/balance_sweep.py` (AI-vs-AI, seeded, `update(0.05)` stepping, one page at a time, SwiftShader).
Raw files: `docs/data/p1_*.json`. Compared builds: `main` f73917d (before P1), branch with P1 only (0776125, Hecla still 40 PD), and final (P1 + Hecla 6 PD + 4 P-4 pulse + 6 LS-8).
Cells: 20 seeds each (1-20), 180 s cap. Medians [interquartile range]; "first loss" is the first human ship destroyed, among runs where one was.

## Implemented (Codex 0776125, cloud review 2026-11-02)
LS-8 (`laserM`): targets corvette/frigate/capital only, 18 deg/s slew, 1.5 s charge, 1.8 s re-target delay. New P-4 defence pulse (`pulseS`): 100 deg/s, 900 m, 1.35 dmg, the only fast-slew beam. Per-ship turret target spreading and skill/speed-dependent beam hit chance (`tuning.turret`). Halberd 2 and Exeter 4 turrets are P-4. Hecla keeps 6 LS-8.
Owner decision 2026-11-02 (after an attack run on `main` killed him quickly): Hecla PD cut from 40 to 6 (1,500-round magazines, bow/boom/stern), 4 P-4 pulse at the mid-hull as last line of defence.

## Results
| Cell | main | P1, 40 PD | final (6 PD + 4 pulse) |
|---|---|---|---|
| 3 Kestrel vs Hecla: runs with a human loss | 17/20 | 8/20 | 6/20 |
| first human loss, s | 43 [29-63] | 106 [87-150] | 144 [92-149] |
| killing weapons (human losses) | laserM 35, PD 19 | PD 11 | pulse 3, PD 5 |
| Hecla structure left (of 12000) | 11655 | 5846 | 5843 |
| 3 Merlin vs Hecla: runs with a human loss | 20/20 | 10/20 | 10/20 |
| first human loss, s | 6.5 [6.4-6.7] | 60 [44-106] | 134 [84-171] |
| killing weapons | laserM 71 | PD 14 | pulse 7, PD 2 |

Brief targets: Hecla vs 3 Kestrels survival above 60 s (met), vs 3 Merlins above 20 s (met). Nobody wins either cell inside 180 s: the Kestrels remove about half the Hecla's structure; the Hecla is no longer a fighter-killer.

Exeter + 2 Kestrels vs Bullfrog (`j-exeter-k2`): not informative, 0/20 human wins on both builds (the Bullfrog's spine ends it in ~35 s); FROGG losses median 7 -> 1. The brief's "12-18 kills" target belongs to the larger acceptance engagement.
Acceptance engagement (`bullfrog_eng.py`, Exeter + 12 Kestrels + 2 Halberds vs Bullfrog, seeds 1-10, both builds): Exeter alive 6/10 on both; Bullfrog alive 3/10 on `main`, 4/10 with P1; human fighters left identical (0,0,0,0,2,2,2,3,3,4); FROGG fighters left median 14.5 (main) vs 13.5 (P1). No regression found; the capital-laser nerf does not change this engagement measurably.

## Not established
- Not hand-played. Real-pilot and iPad feel is the owner's gate.
- 20 seeds per cell, AI pilots; the player is more evasive or less careful than the AI wing.
- The `d2`/`j` Exeter cell needs a different scenario to test the 12-18 kill target; not done.

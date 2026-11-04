# Drone engagement measurements

Baseline: `origin/main` at `70ae06f`. The current branch uses the database fighter leash of 2,000 m. Each seeded run starts paused with one stationary Halberd, six drones and four Darters starting about 1,650 m away. Carrier guns, turrets and launchers are disabled so drone kills are distinguishable; drone and fighter weapons remain enabled. The carrier position and velocity are reset each step. The test runs up to 100 simulated seconds in 0.25 s steps, stopping if all four fighters are gone. Maximum distance is sampled each step, including the last position of drones lost during the run.

This is a controlled simulation with a coarse timestep, not a claim about general balance, a moving-carrier maximum, or real-device performance. The ten paired seeds show scenario results, not enough runs for an even-point claim. Run `tools/tests/drone_measure.py` after building to reproduce.

| Seed | Before max m | After max m | Before drone kills | After drone kills |
|---:|---:|---:|---:|---:|
| 1 | 1143 | 1250 | 0 | 0 |
| 2 | 1423 | 1675 | 1 | 0 |
| 3 | 1226 | 1446 | 0 | 0 |
| 4 | 1311 | 1629 | 0 | 1 |
| 5 | 1268 | 1688 | 0 | 0 |
| 6 | 1184 | 1508 | 0 | 0 |
| 7 | 1143 | 1157 | 2 | 0 |
| 8 | 1136 | 1658 | 0 | 0 |
| 9 | 1227 | 1629 | 0 | 1 |
| 10 | 1155 | 1635 | 1 | 0 |

Across these runs, the largest sampled distances were 1423 m before and 1688 m after. Drone-attributed fighter kills were 4 before and 2 after.

The base AI flies all six drones in the original close-protection order. The revised AI retains one close defender and assigns the others fighter engagement. A controller death retains the existing orphan rule: fight nearby hostiles, then approach the nearest friendly capital hull, or hold if none remains. A living, moving controller is evaluated at its current position on each AI update; the leash is a break-off rule and turning inertia can cause overshoot.

A separate moving-carrier browser test (`tools/tests/drone_moving_t.py`) drives the Halberd at 28 m/s for 60 simulated seconds in 0.1 s steps. The largest observed live-drone distance was 1,697 m; a survivor placed 2,100 m behind the carrier broke off and entered its return state. This is one controlled scenario, not a hard physical bound for arbitrary carrier motion.

The isolated `tools/tests/drone_profile.js` target-selection benchmark runs 24 drones against 40 fighters for 1,000 AI ticks. On the development machine, the median of four warmed runs was 4.64 ms before and 9.42 ms after for the entire 1,000-tick sample (about 0.0046 versus 0.0094 ms per tick). It stubs sensing, weapons and flight and does not measure rendering or actual phone performance.

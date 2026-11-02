# Gulper isolation and Merlin speed: results (Claude, cloud, 2026-11-02)

Branch `codex/gulper-merlin` + main, 20 seeds per scenario, `tools/tests/balance_sweep.py --batch-size 1`; raw JSON in `docs/data/gulper_merlin/`. Gate PASS; `gulper_merlin_unit.js` PASS. `merlin_speed_t.py` FAILS in the cloud harness: the player only reaches about 37 m/s in a paused `g.update` loop for both Merlin and Kestrel, so the harness (not the game) is probably at fault (unconfirmed); Merlin handling still needs hand-play.

## Gulper: 1 Falchion vs 1 Gulper, human wins of 20 (median TTK of wins)

| Variant | Wins | TTK s |
|---|---|---|
| parent (380 HP, no R-5, old Falchion PD) | 18 | 16 |
| + hull 480 only | 12 | 18 |
| + 3 R-5 only | 13 | 17 |
| + halved Falchion PD only | 16 | 16 |
| all v0.5 | 6 | 20 |

The three changes each take wins away and add up (18 down to 6). It is not one bug.

## Gulper candidates (test-only, not shipped)

| Variant | 1 Falchion wins | 2 Falchions wins / TTK |
|---|---|---|
| baseline (v0.5) | 6/20 | 20/20, 13 s |
| lead + double shields | 3/20 (TTK 72 s) | 20/20, 15 s |
| lead + 6 shield/s regeneration | 9/20 | 20/20, 13 s |

Two Falchions kill the Gulper in 13 to 15 s under every variant; none reaches the 25 to 40 s target. Doubling shields alone adds only 2 s.

## Merlin (human wins of 20, median TTK s)

| vs | old speed | 262.5, uncontrolled AI | 262.5, AI cruise 140 (the branch) |
|---|---|---|---|
| Darter | 0 | 0 | 0 |
| Leaper | 3 (166) | 0 | 5 (53) |
| Spitter | 19 (55) | 2 (145) | 10 (82) |
| Reaver | 3 (144) | 0 | 7 (76) |
| Toad | 3 (156) | 1 (142) | 2 (109) |

The AI cruise cap fixes the stall (overshoot is confirmed as the main cause by the 0 to about 5 recovery) but is not neutral: better against Leaper and Reaver, clearly worse against Spitter (19 down to 10). The Merlin still wins at most 35 % against any FROGG fighter except the Spitter.

# Balance v0.5 results (Claude, cloud, 2026-11-02)

Branch `codex/balance-v05` merged with main (gate PASS, `balance_v05_t` and `tur_aim_t` PASS), against the parent (main without the branch). Seeds 1-10 per scenario (not 20: time), `--batch-size 1`. Raw: `docs/data/balance_v05/{branch,parent}_<scenario>.json`. "wins" = human side wins; everything else is a loss or unfinished at the cap. Commands: `/tmp/runsweep.sh`-style loop over `tools/tests/balance_sweep.py --scenario <name> --seeds 1-10 --batch-size 1`.

| Scenario | Branch wins / median TTK s | Parent wins / TTK s |
|---|---|---|
| merlin vs darter / leaper / spitter / reaver / toad | 0, 1, 10, 1, 2 (of 10) | 0, 1, 10, 2, 2 |
| kestrel vs darter / leaper / spitter / reaver / toad | 1, 5, 10, 9, 9 | 1, 5, 10, 10, 9 |
| falchion vs darter / leaper / spitter / reaver / toad | 8, 9, 10, 9, 10 (TTK 48/43/23/47/31) | 9, 9, 10, 10, 10 (TTK 30/25/14/16/16) |
| bittern vs darter / leaper / spitter / reaver / toad | 6, 10, 10, 8, 10 (TTK 44/37/34/37/29) | 9, 9, 9, 8, 9 (TTK 35/22/15/17/16) |
| 1 falchion vs 1 gulper (missiles / guns) | 2 / 4 of 10, one Falchion lost in the median | 9 / 9 of 10 |
| 2 falchions vs 1 gulper (missiles / guns) | 10 / 10, TTK 13 s | 10 / 10, TTK 12-13 s |
| gulper option HP+shield / aim proxy (2 falchions) | 9 / 10, TTK 15 / 14 s | not run |
| 3 kestrel vs 3 darter, default / IR swap | 3/10, TTK 63 s, one loss in the median, identical for both | not run |

Readings (10 seeds is thin; treat differences under 2-3 wins as noise):
- Fighter fights get slower: Falchion and Bittern kill times roughly double (about 15 s to 30-45 s) with the new FROGG HP. That is the intended spacing, not a regression.
- Merlin loses to Darters and wins at most 1-2 of 10 against Leaper, Reaver, Toad. HP 26 to 35 did not change that; Merlin is still the weak link.
- **One Falchion against one Gulper flipped from 9/10 wins to 2-4/10.** Two Falchions still kill it in 13 s, so the 2-vs-1 target of 25-40 s is not met. Neither candidate (+25 % HP and +50 % shield, or skill 5) moves it beyond 13 to 15 s.
- The IR/RF ordnance swap still gives byte-identical results (3 wins, TTK 63) in the 3-vs-3 scenario; the swap is inert there (missiles are probably not what decides it, or not fired). The 3-vs-3 scenario no longer ends in a total loss (3/10 wins).
- Not run: 20 seeds, HECLA/Bullfrog acceptance scenarios, the PD interception sweep (`v05_pd_sweep.py`), `?diag` visual check.

## Merlin shield and speed (owner request 2026-11-02: double shield, +50 % speed)

- Shield doubled (22/20 to 44/40): applied. Merlin vs Spitter 6/6 wins (TTK 112 s median, was 88 s at 10/10), so no regression in that matchup; wins against the other FROGG fighters were not re-measured.
- **Speed +50 % (maxSpeed 175 to 262.5) NOT applied.** With it, with and without accel x1.5 (95 to 142.5), the Merlin side scored 0 wins, 0 kills and 0 losses in 10 seeds each against Darter, Leaper, Spitter, Reaver and Toad (every fight unfinished). The cause is not isolated: the fast AI Merlins most likely overshoot or cannot hold a firing solution at that speed (turn rate 2.5 rad/s unchanged). Needs a Codex pass: scale turn rate and gun tracking with the speed, test player handling, then re-sweep.

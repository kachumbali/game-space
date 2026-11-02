# Gulper and Merlin: cloud experiment handoff

No seeded runs, browser tests or device playtests have been performed on this
branch. The 10-seed findings in `BALANCE_V05_RESULTS.md` are the prior evidence;
the following experiments are not yet measured and are not balance claims.

## Why Merlin might stall

The normal fighter AI sets attack throttle from `aiSpeed / maxSpeed`, or 0.8
when `aiSpeed` is absent. Before this branch Merlin had no `aiSpeed`, so its
normal attack command was 140 m/s. Raising only its maximum from 175 to 262.5
raises that command to 210 m/s. The faster break-away mode also uses full
throttle. More overshoot and shorter firing windows are plausible, but the
unfinished results do not identify a cause by themselves. Gun lead, turn,
and any arena/time-cap effects still need the controlled runs below.

This branch gives the player the requested 262.5 m/s maximum and sets the AI
normal attack cruise to 140 m/s. This preserves the earlier attack command,
not necessarily the former win rate: break, acceleration and AI trajectories
can still differ. `gm-merlin-<enemy>-old`, `-fast-uncontrolled` and
`-fast-controlled` cover Darter, Leaper, Spitter, Reaver and Toad. Each result
now includes 10-second distance, speed, mode and ammunition samples alongside
hits, kills, survival and time-cap status. Compare all three with matched seeds.

## Gulper isolation

The five 1-vs-1 `gm-isolate-*` cells vary exactly the requested three factors
on the same runtime base: parent (380 HP, no R-5, original Falchion PD),
`hull-only`, `battery-only`, `fighter-pd-only` and `all-v05`. The Gulper's
other weapons, missiles, shields and the Falchion's hull are unchanged. This
isolates the three factors within the common current engine; compare separately
with the actual historical parent build to catch unrelated engine differences.

## Two test-only Gulper alternatives

For both 1- and 2-Falchion engagements, `gm-falchion{1,2}-baseline`,
`-lead-shield` and `-lead-regen` compare the current hull with these candidates:

1. Fixed-gun quadratic intercept lead plus twice the current fore/aft shields.
2. The same lead solver plus six shield points/s regeneration (current Gulper
   has no regeneration; its normal regeneration delay still applies).

These are harness-only overrides. Neither candidate changes Gulper data or
adds weapons/ordnance. The solver accounts for the target's velocity and the
90% shooter-velocity inheritance of projectile bolts; unreachable solutions
fall back to the existing lead. It is enabled only by a test flag, so the
baseline keeps its original aiming. Measured impact is unknown until runs are
completed; do not infer the desired 25–40 seconds or one-third fighter loss.

## Claude cloud execution

Run `node tools/tests/gulper_merlin_unit.js`, then
`python3 tools/tests/merlin_speed_t.py`, `tools/tests/touch_qa_t.py`, and
`tools/check_branch.sh`. Hand-play the Merlin at full speed on desktop and
touch; browser automation cannot establish handling feel.

Run each `gm-isolate-*`, `gm-falchion*` and `gm-merlin-*` scenario using
`python3 tools/tests/balance_sweep.py --scenario <id> --seeds 1-20 --batch-size 1 --output <file>`.
Report matching-seed TTK, both sides' survival, wins, losses and unfinished
runs. Re-run the old and controlled Merlin settings against all five opponents;
compare with `BALANCE_V05_RESULTS.md` while clearly identifying its 10-seed
sample. Preserve raw JSON and include how many intercept/no-intercept and
head-on/overshoot observations occur before claiming a cause or a fix.

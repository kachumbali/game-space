# Balance v0.5: cloud measurement handoff

No browser or seeded results have been collected locally. All values below are
test settings or unmeasured candidates, not balance conclusions.

The HP table in `DESIGN_V05_BALANCE_PASS.md` is applied. Component hit points
remain authored independently; ship initialization copies component HP rather
than deriving or redistributing it from hull structure. The new `pdS` has half
the per-shot damage and missile damage of PD-30, and half the authored drum;
its ten-round burst and one-second pause reduce long-run DPS further. Falchion
and Bittern use their existing mount-specific drum sizes halved. The Gulper
retains four R-4 turrets and gains three R-5 turrets, including ventral mounts.

## Cloud checks and runs

- Run `python3 tools/tests/balance_v05_t.py`, `python3 tools/tests/p0_t.py`,
  `python3 tools/tests/tur_aim_t.py`, and `tools/check_branch.sh` on this
  branch. Inspect Gulper turret seats and `?diag` at desktop and mobile sizes.
- Run `tools/tests/balance_sweep.py` with `--seeds 1-20 --batch-size 1`
  separately for each of the twenty `v05-<human>-<enemy>` scenarios, the four
  `v05-falchion{1,2}-gulper-{missiles,guns}` scenarios, `gpd-g1-base` and
  the existing HECLA/Bullfrog acceptance scenarios. Save raw JSON. Run matching
  scenarios on the parent build where available, keeping seeds and caps equal.
  Report time-to-kill, side survival and win/unfinished counts, and flag
  matchups above 90% or below 10% wins. Do not treat time caps as kills.
- For PD, run `python3 tools/tests/v05_pd_sweep.py 20 <output.json>` on this
  branch and the parent with the same harness. It records each interception,
  near-target disappearance and unresolved projectile separately; proximity is
  an approximation, not proof of the collision cause. Compare Falchion,
  Bittern, Halberd and Gulper against IR, RF and ST-2 torpedoes.
- The `ordnance-3v3-default` and `ordnance-3v3-ir` scenarios compare three
  Kestrels against three Darters. The requirement that this scenario avoids a
  total loss is **unverified**; retain it only if the seeded results support it.

## Gulper alternatives for measurement

The harness-only scenarios `v05-gulper-option-hp-shield` and
`v05-gulper-option-aim` compare two Falchions against one Gulper. The first
tests +25% structure and +50% shields; the second tests skill 5 rather than
the authored skill 3, as a proxy for improved gun aiming. Neither changes the
shipped Gulper stats or AI. Skill affects other pilot behavior too, so it does
not isolate an aiming-only change. Compare each to `gpd-g1-base`, 20 matching
seeds, and report median TTK and fighter losses before selecting an option.

The `gpd-g1-*` names predate the battery: on this branch `base` already has the
new three R-5s, while `plus3` adds three more. Do not compare those labels as
if `base` still meant zero R-5. A measured tuning decision remains open.

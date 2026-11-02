# Capital ordnance P0–P3: cloud verification

No browser runs or seeded damage measurements were executed locally. Source
search on the branch found `dmgCls` and `pierceCls` only in `data/db.json`,
not under `src/`. Their presence does not mean the runtime applies them. The
ordnance table in `WEAPONS.md` now gives the database's base damage inputs;
these are not measured damage against a particular hull.

## P0: actual missile damage

From the built branch, run one page at a time, keeping the raw seed data:

```sh
python3 tools/tests/ttk_matrix.py ceiling --seeds 20 --jobs 1 --inpage --jitter --weapons ir,rf,tick,torp,tad --targets exeter,halberd,destroyer,gulper,bullfrog --out docs/data/capital_missile_damage_raw.json
python3 tools/tests/capital_damage_report.py docs/data/capital_missile_damage_raw.json docs/data/capital_missile_damage.csv
```

The ceiling rig reports the first missile's net shield-plus-structure pool
loss, including misses as zero, for head and side aspects; it is not a duel,
does not include component-only damage, and is not pure direct-hit damage.
The CSV separates positive-damage samples from all samples. Inspect hit and
miss behavior before interpreting it; add a direct-hit rig if required to
distinguish impact damage from proximity detonations. Insert the measured table
into `WEAPONS.md`, with seed count and method, and commit both data files.

## P1: opt-in missile cap and resources

`tuning.ordnance.enabled` defaults to false. When explicitly enabled through a
test database or the browser test, launchers refuse at 48 desktop/laptop,
32 tablet and 20 phone live missiles, without consuming stores or station
rounds. `PLOG.cnt` records `missile.capRefused` and `missile.highWater`.
Missile instances of the same resolved weapon definition share geometry and
materials; their transforms and flame visibility remain independent.

Run `python3 tools/tests/missile_budget_t.py` for all caps, disabled control,
refusals, ammunition conservation and reuse across repeated launch/cleanup
cycles; also run existing missile, station, campaign and drone tests. Check
restarts, device preset switches and performance on real iPad/phone. Then run
`tools/check_branch.sh`. None of those browser/gate checks were run locally.

## P2/P3: dormant data

Four human hulls have grouped `launchers` entries: `count` is the number of
identical physical units, `cap` is rounds per fixed pod or ready round per
reloadable cell, and `reload` is simulation seconds (fixed-pod value is its
salvo rest). `ordnancePlan` holds the proposed stores, hangar manifest, hold
and drone limit under `enabled:false`; it is deliberately **not used** by
combat, tender, hangar, AI or UI code. Existing live `stores` are unchanged.
No FROGG launchers, extra tick missiles or nuclear stores were added.
`tools/tests/capital_schema_t.py` validates the counts and negative controls.

The study's fixed Halberd launchers list 20/14-second rest periods; reloadable
missile/torpedo cells use the owner-approved 5/10 simulation seconds. There are
no physical cell positions or damageable launcher components in these dormant
records yet. Do not present the planned hardware as a functioning loadout.

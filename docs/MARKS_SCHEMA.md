# Marks I-IV: schema (scaffolding, no balance values yet)

Plan: `docs/PLAN_V03.md` M4. This document fixes **how** a mark is written in `data/db.json`; the actual Mark II-IV numbers come later and need
seeded runs (AGENTS.md). Nothing here changes balance: the only variant in the db, `kestrel_2`, is labelled `scaffolding` and uses placeholder numbers.

## Decision

A mark is its own db entry with **its own id** and a **base + deltas** body, in the same table as the thing it modifies:

```json
"ships":   { "kestrel_2": { "base": "kestrel", "mark": "II", "mods": { "maxSpeed": {"mul": 1.1}, "structure": {"mul": 0.95} } } },
"weapons": { "cannon_2":  { "base": "cannon",  "mark": "II", "mods": { "dmg": {"mul": 1.1}, "cd": {"mul": 0.92} } } }
```

Why ids (`kestrel_2`) instead of `variants` nested inside the base: every lookup in the game is by id (`SHIPS[id]`, `WEAPONS[id]`, skirmish `SK_PLAYER`,
`sk_ship=`, mission rosters, stores, mounts), so a variant that is a normal id needs no new plumbing. Mark I is the base itself (no `_1` entry).
Ids are `<base>_<n>` with n = 2, 3, 4 for II, III, IV (the validator enforces it).

| field | meaning |
|---|---|
| `base` | id of an ordinary entry in the same table. No chains: a base may not itself be a variant. |
| `mark` | `"II"`, `"III"` or `"IV"`; unique per base. |
| `mods` | `{ "dotted.path": {op} }`; op is exactly one of `{"mul": x}`, `{"add": x}`, `{"set": v}`. |
| `name` | optional; if present it must equal base name + space + mark. Default is generated. |
| `scaffolding` | free text; marks an example that must not be treated as balance data. Dropped at load. |

Paths walk the base def: object keys and array indices (`mounts.0.w`, `shield.fore`, `comps.2.hp`), `*` = every element/key (`shield.*`, `comps.*.hp`).
`mul`/`add` need a number at the target (typos fail loudly: the loader throws, the validator reports). `set` is for numbers, or for a mount weapon id
(`"mounts.0.w": {"set": "cannon_2"}`), which is how a ship mark takes a weapon mark. Weapons are resolved before ships.

Not modable (validator error): geometry and identity (`prims`, `pos`, `half`, `length`, `radius`, `engines`, `launch`, `dock`, `comp`, `grp`, `store`, `cls`, `fac`,
`role`, `kind`, `seeker`), colours and model sizes. A mark changes numbers, not the model; it reuses the base's geometry.

## Resolution (once, at load)

`src/16_db.js` `markResolve()` replaces each variant in `DB.weapons` / `DB.ships` by a deep copy of the base with the mods applied and sets `id`, `base`, `mark` and
`name` (`KESTREL II`, `MK-20 CANNON II`). Results are rounded to 6 decimals. `src/32_scale.js` then gives a ship mark the base ship's `prims` (deep-copied; scaled
hulls such as Halberd are rescaled via `SCALE_TO`) and runs the common fighter turn/afterburner passes on it. After that a mark is an ordinary entry:
`SHIPS.kestrel_2`, `WEAPONS.cannon_2`, with `def.base` / `def.mark` available for UI. The derived power fields (`energyRegen`/`energyMax`) are computed after marks, so a mod on `power.plantMW` works.
Python tools use `tools/dbmarks.py` (same algorithm): `validate_db.py`, `power_table.py`, `render_pack.py` see resolved defs; `export_db.py` reads the running game, so it already does.

## Owner rules and what the validator enforces

- Each step is about +8-12% **in the mark's own lane**, with a small cost elsewhere (no strictly dominating mark).
- Torpedoes: +8-12% range per mark, slightly better speed (`vmax`) and durability against PD (`hp`). Note that `range` is the lock range; the flight reach is `life`/`vmax`/`burn`, so scale `life` with `range`.

`tools/validate_db.py` (also in CI): base exists and is not a variant; only the known entry keys; mark is II-IV, unique per base, id `<base>_<n>`; name suffix;
each op well formed and the path exists with a number at the end; no forbidden keys; every `mul` inside **0.75-1.20** (error); **warning** if no delta is an own-lane
step (x1.08-1.12 or its inverse, e.g. cooldown x0.92); torpedo marks must have `range` x1.08-1.12 and must not lower `vmax`/`hp` (error). The resolved db then goes
through all the usual checks (mounts point at real components, weapons exist, ...).
It cannot judge whether the "cost elsewhere" is small or whether a lane is the right one: that is a balance question for the seeded runs.

## Listing a variant in the skirmish setup

`SK_PLAYER` in `src/76_menu.js` is `[id, label]` rows and `skNorm()` accepts any id that is in that list and in `SHIPS`. Adding
`['kestrel_2', 'KESTREL II (placeholder)']` is the whole change (also `sk_ship=kestrel_2` in the URL form); nothing else needs plumbing. It is **not** added yet.
Other places that pick by id (mission rosters, AI squads) work the same way. Voxel models are cached per id, so a mark costs one extra voxelisation when used.

## Example (scaffolding)

`ships.kestrel_2` = engine lane +10% (`maxSpeed`, `accel`), cost -5% structure and shields. Placeholder, to be replaced when M4 sets real marks.
Tests: `tools/tests/db_override_t.py` (resolution, weapon + ship mark, validator accept/reject cases).

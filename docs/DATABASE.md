# Ship database

`data/db.json` holds the technical data of every ship and weapon in one file. Created 2026-10-23 (owner request); the extraction was balance-neutral: the full runtime objects (`SHIPS`, `WEAPONS`, `ARMOR`, `MASS`, `ARMOR_THRESH_CLS`) were dumped from the game before and after and compared - structurally identical (`SHIPS` including `prims`, 13 ships, 29 weapons).

## Layout

| key | content |
|---|---|
| `ships.<id>` | name, class, faction, role, dimensions (`length`, `half`, `radius`), speeds, `structure`, `shield`, `shieldRegen`, `armor`, `sig`, `energyMax`/`energyRegen`, `engines`, `mounts`, `turrets`, `comps` (hit zones with hp), `stores`, `launch`, `dock`, `ai`, flags |
| `weapons.<id>` | damage, cooldown, range, energy/ammo, lock and beam parameters (`acq`/`ramp`/`peak`), turret flags |
| `armor.<type>` | damage-type profile, threshold, ablation rate, spall |
| `mass`, `armorThreshCls` | per-class mass and armour threshold multipliers |
| `tuning` | combat balance constants formerly hard-coded in `src/*`: `dmgx` (damage type x shield/structure), `ff` (friendly fire), `exposed`/`soft` (subsystem reach and softness), `hit` (damage split between shield, armour, component, structure), `beam` (focus floor, gap), `flak`, `regen`, `missile` (steering and blast constants), `nuke`, `crash`, `fighter` (turn/accel multipliers), `afterburner`, `ai`. Read through `TUNE` in `src/16_db.js`. |
| `ships.<id>` / `weapons.<id>` with `base` | a mark (variant): base id plus `mods`, resolved at load; see `docs/MARKS_SCHEMA.md` |
| `notes` | the design comments that sat next to the numbers in the old source (`notes.weapons.<id>`, `notes.ships.<id>.<field>`); not embedded in the game |

Colours are `"#rrggbb"` strings and become ints at load (`src/16_db.js`, keys `color`, `flameColor`, `flame`).

## Fast iteration: dev override (no rebuild)

1. `python3 -m http.server 8000` in the repo root, open `http://localhost:8000/index.html?db=data/db.json&free&go`.
2. Edit a number in `data/db.json` (a weapon `dmg`, a `tuning` value, a mark delta), save.
3. Reload the page. The file is fetched with `cache: 'no-store'` and used instead of the embedded copy (`__game.DB_SRC` shows which); no `build.py`.

`?db=<relative url>` is awaited at the top of `src/16_db.js` (module top-level await) before any other part runs, so every module sees the final db at load
time and `?free&go`, `?m=N` and the test hooks behave as usual. A missing or invalid file falls back to the embedded copy with a console warning. The published
`index.html` still embeds the db and works offline from a plain file; without `?db` nothing is fetched. `tools/tests/lib.py` links `data/` into the test server
directory so tests can use `?db=`. Run `python3 tools/validate_db.py [file]` on an edited copy first if in doubt. Geometry (`prims`) is not in the db, so shape edits still need a rebuild.

## What is NOT in the database

- Geometry: `prims` stays in `src/30_ships_human.js` / `31_ships_frogg.js`.
- Derived rules applied on top at load by `src/32_scale.js`: ship scaling (Halberd 128 m, Gulper 146 m, Hive Carrier 2500 m, so the JSON holds the authored size, not the in-game size). The fighter turn multiplier 2.85, FROGG fighter turn/accel bonus and afterburner pool now live in `tuning.fighter` / `tuning.afterburner`.
- Still in code (not combat balance, or tied to geometry): survival/Gauntlet tuning `SV_TUNE`, the nuke dial yields, HUD/AI thresholds written inline in `src/70_ai.js` (aim tolerances, role aggression), beam *visual* widths, `SIM_SPEED`. Candidates for a later pass.
- Weapon values that were written as `24 * FMX` (FROGG missile effectiveness 1.3) are stored as the evaluated number.

## Workflow

1. Edit `data/db.json`.
2. `python3 build.py` (embeds it) and `python3 tools/validate_db.py` (weapons exist, mounts point at real components, armour/class tables complete; also runs in CI).
3. `python3 tools/export_db.py` regenerates `docs/data/ships.csv` / `weapons.csv` from the current build (derived views; never edit by hand).
4. `python3 tools/render_pack.py` renders all ships into one captioned contact-sheet PNG per faction
   (requires the Playwright/Chromium test environment and Pillow).
   It reads captions and weapon names from `data/db.json`; output defaults to the git-ignored
   `docs/img/ships/contact_sheets/`. Set `--quality low|mid|high|ultra` or `--output DIR` as needed.

## Next step (not started)

See `docs/POWER.md` (step 1 done: `power` fields in the database).

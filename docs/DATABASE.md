# Ship database

`data/db.json` holds the technical data of every ship and weapon in one file. Created 2026-10-23 (owner request); the extraction was balance-neutral: the full runtime objects (`SHIPS`, `WEAPONS`, `ARMOR`, `MASS`, `ARMOR_THRESH_CLS`) were dumped from the game before and after and compared - structurally identical (`SHIPS` including `prims`, 13 ships, 29 weapons).

## Layout

| key | content |
|---|---|
| `ships.<id>` | name, class, faction, role, dimensions (`length`, `half`, `radius`), speeds, `structure`, `shield`, `shieldRegen`, `armor`, `sig`, `energyMax`/`energyRegen`, `engines`, `mounts`, `turrets`, `comps` (hit zones with hp), `stores`, `launch`, `dock`, `ai`, flags |
| `weapons.<id>` | damage, cooldown, range, energy/ammo, lock and beam parameters (`acq`/`ramp`/`peak`), turret flags |
| `armor.<type>` | damage-type profile, threshold, ablation rate, spall |
| `mass`, `armorThreshCls` | per-class mass and armour threshold multipliers |
| `notes` | the design comments that sat next to the numbers in the old source (`notes.weapons.<id>`, `notes.ships.<id>.<field>`); not embedded in the game |

Colours are `"#rrggbb"` strings and become ints at load (`src/16_db.js`, keys `color`, `flameColor`, `flame`).

## What is NOT in the database

- Geometry: `prims` stays in `src/30_ships_human.js` / `31_ships_frogg.js`.
- Derived rules applied on top at load by `src/32_scale.js`: ship scaling (Halberd 128 m, Gulper 146 m, Hive Carrier 2500 m, so the JSON holds the authored size, not the in-game size), fighter turn multiplier 2.85, FROGG fighter turn/accel bonus, afterburner pool. These are the first candidates to move into the database in the power-model step.
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

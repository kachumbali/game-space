# Ship and weapon database

`ships.csv` (one row per hull) and `weapons.csv` (one row per weapon) are generated from the game definitions
(`src/30_ships_human.js`, `src/31_ships_frogg.js`, `src/32_scale.js`, `src/60_weapons.js`), not hand-typed. Regenerate with the
headless script `tools/export_db.py` after any balance change so the files cannot drift from the code.

Units: metres, seconds, radians; `dps` = nominal damage per second before shields, armour and misses (damage / cooldown),
`range_m` = speed x lifetime for projectiles (theoretical; the AI engages at 55 % of it). `armor_thresh_*` are per-hit
thresholds: effective threshold = base x class multiplier. `mass_class` is the crash-damage mass. Derived columns are
computed in the exporter, everything else is the raw definition value.

Source of the numbers: the game code at the commit that carries the file (`git log -1 -- docs/data`); the values are design
parameters, not measurements of anything real. Renders: `docs/img/ships/<id>_{34,top,side,front}.png`.

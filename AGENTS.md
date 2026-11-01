# AGENTS.md: working on game-space (working title: Claude Space Commander)

Read this before editing. Owner: kachumbali; he tests builds on iPad/phone/desktop and iterates. Tone: sober,
critical, evidence-weighted, no flattery; state what was and was not verified.

## Build and run
- Source is `src/*` (sorted by filename); `python3 build.py` concatenates into the single file `index.html`
  (Three.js 0.170 via CDN). **Never edit `index.html` by hand.** Rebuild after every change.
- Everything shares one module scope: functions hoist, but top-level `const/let` are in the TDZ until their
  part runs. Part N must not use a later part's `let/const` at load time (a past bug: `FS` declared in 90_hud
  but used by 80_input; fix = declare in `10_config.js`). Symptom: page never sets `window.__game`.
- Source map (sorted build order): `src/00_head.html` (shell/CSS) · `10_config` · `12_audio` · `13_music`
  (mood/crossfade, options panel) · `14_samples` (CC0 sample layer) · `15_credits` · `16_db` (embeds
  `data/db.json`) · `20_voxel` · `30_ships_human` / `31_ships_frogg` · `32_scale` · `40_scene` · `41_sky` ·
  `45_particles` · `50_state` · `55_ships` · `56_drones` · `58_playlog` · `60_weapons` · `61_beams` · `62_juice` (hitmarkers, arcs, chain, medals) · `63_loot` (salvage pods) ·
  `65_combat` · `70_ai` · `74_survival` (Gauntlet, perks, difficulty, career) · `75_mission` · `76_menu` · `77_cine` · `78_coms` · `79_bullfrog` · `80_input` ·
  `85_update` · `90_hud` · `95_main` · `99_tail.html`.
- `data/db.json` is the source of truth for ship, weapon, armour, mass-class and armour-class data.
  `tools/validate_db.py` checks it (incl. marks and the tuning section); `tools/export_db.py` generates `docs/data/*.csv`.
- `tools/render_ships.py` renders individual ship views; `tools/render_pack.py` makes faction contact sheets.
  Image output under `docs/img/` is git-ignored and must not be committed.

## Key conventions
- Ships are data (`SHIPS`, schema in README/docs/SHIPS.md). Forward is -Z; models mirror about X. Change sizes
  with `scaleShip`. Fighter turn is multiplied in 32_scale (x2.85) and in the player controls (85_update).
- `SIM_SPEED` 0.375 scales the whole sim (not cine). Retune anything time-based against it.
- Damage: shield -> armour transform (`ARMOR`, never depletes; docs/ARMOR.md) -> structure, typed multipliers, `EXPOSED` subsystems take direct hits, `pierce`.
- Missions: `MISSIONS[]` in 75_mission; stages may carry `{transit:{to,dur,area,lines}}` handled by 77_cine
  (state `'cine'`, body class `cine`). Looks/backgrounds: `LOOKS` in 41_sky, via `M.look`/`area.look`.
- Phones: `body.phone` (set by `setPhone()` in 80_input); canvas HUD fonts use `FS`. iPad layout must not change.
- Voxel cost: corvettes are heavy (Halberd ~35k, Gulper ~78k instances). Do not raise resolution globally.

## Testing (headless)
- Python Playwright + Chromium (SwiftShader, so timings are not GPU-representative). Serve the repo on :8765.
- Hooks: `globalThis.__game`; set `__game.__paused = true` then call `__game.update(dt)`. URL: `?go` (skip
  briefing), `?free`, `?m=N`, `?touch`, `?speed=`, `?skyres=`.
- No enemies exist at t=0 (first group spawns ~4 s after launch); step the sim before hit tests.
- Run pages one at a time (several in one run time out). Hide overlays (`#brief,#ov,...`) for ship sheets.
- Check: no console errors, mission flow completes (bot), screenshots at 1280x720 and 844x390 / 390x844.

## Ship database (owner decision 2026-10-23)
- **`data/db.json` is the single source of truth for every ship, weapon, armour profile, mass class and armour class multiplier.** Edit the numbers there, not in `src/30/31_ships_*.js` or `60_weapons.js` (those keep only geometry: `prims`). `build.py` embeds the JSON via `src/16_db.js`. Details: `docs/DATABASE.md`.
- After editing: `python3 build.py && python3 tools/validate_db.py`. Design comments from the old source live under `notes` in the JSON.
- **Combat constants live in `db.tuning`** (damage-type multipliers, hit split, beam focus floor, flak, regen, missile steering, nuke, crash, fighter/afterburner rules), read via `TUNE` (`src/16_db.js`). Do not hard-code a new balance number in `src/*`.
- **Iterate without rebuilding (dev override):** (1) `python3 -m http.server 8000` in the repo root; (2) open `http://localhost:8000/index.html?db=data/db.json&free&go`; (3) edit `data/db.json`, reload. `?db=` is awaited at the top of `16_db.js`; the published file still embeds the db. Details: `docs/DATABASE.md`.
- **Marks** (ship/weapon variants `kestrel_2` = `base` + `mods`) are resolved at load; schema in `docs/MARKS_SCHEMA.md`, checked by `tools/validate_db.py`.
- `docs/data/*.csv` are generated views (`tools/export_db.py`), never edited by hand.

## Git
- **Work in branches** (owner rule 2026-10-22): commit work in progress to a feature branch; merge to main when green. Never let two agents edit the same working tree.
- **v0.2 note (2026-10-30): the owner lifted the freeze for the fun update** (docs/FUN_UPDATE.md), which met the three conditions below. The rule still stands for anything else.
- **New player-facing systems are frozen until the owner has hand-played the build on iPad** (owner rule 2026-10-22: power, afterburner, magazines, energy budgets, comms, drones, docking, the nuke dial all shipped with zero hand-play data). Any new player-facing system needs, in the same commit: a touch binding, an AI default so it can be ignored, and a line in the help overlay.
- **Balance claims need seeded runs**: `?seed=` makes the whole sim deterministic (mulberry32, 10_config). Duel cells quote >= 20 runs or do not claim an even point.
- Commit small, push to `origin main` (https://github.com/kachumbali/game-space). Do not force push. End each
  commit message with:
  `Co-Authored-By: Mistral Vibe (Mistral AI) <noreply@mistral.ai>`
  (Earlier commits carry Claude trailers; tool history in docs/MILESTONE_2.md.)
- Do not enable GitHub Pages without approval.

## Ship model rules
- **Every ship model view and blueprint must show subsystem positions** (engines, guns, PD turrets, shields, sensors,
  reactor, radiators, bays, cradles, muzzles). Use the `comps`, `mounts`, `turrets`, `engines` data as the single source.
- **Every weapon needs a physical thing on the model, realistic for its type** (owner rule, 2026-10-22): a fixed mount needs a
  visible barrel, emitter or pylon at its `pos` (rail/driver = long barrel; maser/laser = emitter with the weapon's colour;
  missile = pylon/rack/pod); a missile store needs its `launch` point at the mouth of that rack/pod/bay; turrets get their
  assembly from `makeTurret` plus a seat/housing prim on the hull. A mount or launch point floating on bare hull is a defect.
  `tools/tests/muzzle_t.py` (numbers + marker screenshots in `$GS_SHOTS/ships`) is the check.
- **Hull structural integrity:** a major visible mass (bridge, engine nacelle, wing/radiator, bay, turret housing, sensor
  pedestal) must visibly connect to the pressure hull or a clearly load-bearing pylon/strut in top, side, and 3/4 views.
  No floating detail islands. Antennae, dishes, lights, and muzzle tips are allowed only when visibly rooted in a mast, housing,
  or weapon barrel. Before accepting a geometry pass, inspect the runtime ship and `?yard=<id>` at top, side, and 3/4 views;
  enable the extents box and resolve geometry outside the intended collision envelope rather than silently enlarging it.
- Blueprint/plate generator scripts are in `tools/gen/` (moved 2026-10-22, not re-run since; see its README). Test scripts: `tools/tests/`.
- Size cap for now: ships at or under 1,000 m (owner decision 2026-10-23); frigates remain under 500 m. Only frigates, HECLA (1,000 m strategic tender) and the FROGG Bullfrog (600 m, `cls: 'capital'`) jump. Docking does not repair.

## Delivery
After a change the owner expects the rebuilt `index.html` plus screenshots. Update README and docs when
behaviour changes.

## Open items
See docs/PLAN.md and docs/TIE_FIGHTER_COMPARISON.md. Unverified: real-device performance (sky bake, two
corvettes + Gulper), phone readability, damage balance and turn feel.

## Credits and licences
Every third-party item (code, audio, art) must be listed in `src/15_credits.js` (shown in-game: briefing screen CREDITS, options panel) and `docs/CREDITS.md`, with its licence checked against the source page and the date. Do not add an asset whose licence you have not read.

# Briefs for GitHub Copilot agent mode (VS Code)

Each section is a self-contained prompt: paste the section text (or just "Do brief N in docs/COPILOT_BRIEFS.md") into Copilot agent mode with the repo open.
Rules that apply to every brief (they are also in AGENTS.md - the agent must read AGENTS.md first):
- Work on a NEW branch named in the brief; never commit to `main`; do not force-push; do not rewrite history.
- Commit author/email must be the noreply identity: `git config user.name "kachumbali"` and `git config user.email "178489347+kachumbali@users.noreply.github.com"` in this repo. No personal email anywhere.
- Source of truth for ship/weapon numbers is `data/db.json` (see docs/DATABASE.md); geometry stays in `src/30_ships_human.js` / `src/31_ships_frogg.js`. `index.html` is generated: edit `src/*` and run `python3 build.py`.
- Build must pass (`python3 build.py`, `python3 tools/validate_db.py`) and `cd tools/tests && python3 suite1.py` must show `ERRS []` for all URL variants (needs Playwright + Chromium; see tools/tests/README.md and docs/HANDOFF.md for the environment).
- No images committed (`*.png/*.jpg` are git-ignored on purpose). No new player-facing gameplay systems (feature freeze until owner hand-plays on iPad).
- The owner wants sober reporting: say what was and was not verified; no marketing language. End each branch with a short `docs/` note or PR description listing commands run and results.

---

## Brief 1 - Shipyard: a voxel ship workbench inside the game (branch `shipyard`)

Goal: a lightweight engineering and visual aid for designing ships, then pasting the result into the game. NOT a new editor engine: reuse the game's own voxelizer so what you see is what ships.

Background: ships are not voxel grids. A ship def has `prims`: a list of primitives built with helpers in `src/10_config.js` (`tap` = tapered box/prism with `sh` shape 'r' rect, 'e' ellipse, 'd' diamond, 'h' hex; `box`; `ell` ellipsoid; `seg` capsule/cone between two points; `chain`) and `src/20_voxel.js` (`ringSegs`, `rungs`; prim options `lod`, `win`, `noDetail`, `glow`, `rot`, `sweep`, paint/text decals). `voxelize(def, res)` turns them into voxels; ship space is -Z nose, +Y up, mirrored about X when `mirror: true`. Technical data (mounts, engines, comps, turrets, stores) lives in `data/db.json` under `ships.<id>`.

Build: a mode `?yard` (optionally `?yard=kestrel`) of the existing page, implemented in a NEW file `src/96_yard.js` (+ small CSS in `src/00_head.html`), no change to normal play. In yard mode:
1. Empty scene, one ship on a turntable with free orbit camera (mouse drag, wheel, touch pinch), the existing starfield dimmed, a toggleable grid with metre rulers, and a reference silhouette of the Kestrel (12.4 m) for scale.
2. Left panel: a ship picker (all ids in `SHIPS`, plus "NEW"), and a code editor textarea holding the ship's `prims` array as JS source using the helper names above. Live rebuild on edit (debounced ~400 ms), with parse/runtime errors shown inline and the last good model kept.
3. Toggles: markers for comps, mounts, turrets, engines (as in `tools/render_ships.py` SETUP: coloured spheres per role), hull wireframe/half-extents box, mirror on/off, detail tier selector (DETAIL_STEPS) and LOD level, voxel count and build time readout, bounding `half`/`radius` suggestion computed from the prims.
4. A second textarea with the ship's `data/db.json` entry (JSON) for mounts/engines/comps/turrets with live validation using the same checks as `tools/validate_db.py` (weapon ids exist, mounts point at real components); marker positions update live from it.
5. Export buttons: "Copy prims JS" (formatted, helper-call syntax) and "Copy db entry (JSON)"; plus "Save PNG sheet" (3/4, top, side, front views at 900x540) to download.
6. Loading a ship pre-fills both textareas from the running game (for prims: reconstruct source text; if exact reconstruction is impractical, serialise prims as plain objects `{t:'tap', c:[...], ...}` - the editor must accept that form too).
Constraints: no new top-level name collisions (build lint), no console errors, zero effect on normal URLs (suite1 must stay green), no network access, works from `file://` and GitHub Pages, desktop first (touch is a bonus).
Acceptance (write `tools/tests/yard_t.py` in the style of the other tests): `?yard=kestrel` loads without console errors; editing the prims text changes the voxel count; an invalid edit keeps the old model and shows an error; export strings parse back; the db validator flags a mount that points at a missing component.
Optional stretch, only after the above is green and merged: a `{t:'vox', ...}` prim type that imports a MagicaVoxel `.vox` file (palette, size) so externally modelled parts can be placed like any other prim. Document the format limits in docs/SHIP_MANUAL.md.

## Brief 2 - Seeded balance sweeps (branch `balance-sweeps`)

Goal: replace the 3-run duel cells with >= 20-run seeded measurements (AGENTS.md rule), report Wilson 95% intervals.
Use `?seed=N` (mulberry32 over Math.random, see src/10_config.js) and the duel/engagement scripts in tools/tests (`duel2.py`, `bullfrog_eng.py`, and the mission bot `bot2.py`/`m2full`). Note: same seed is not perfectly reproducible between runs (documented in docs/BALANCE_TESTS.md); treat runs as samples and report that.
Tasks: (a) arcade duel matrix: 4 Kestrels skill 3 vs N FROGGs for N = 6, 8, 10, 12, 14 (mixed Darter/Leaper), 20 runs each; (b) Exeter alone vs Bullfrog + hangar (4 km start) and Exeter + 12 Kestrels + 2 Halberds vs Bullfrog (10 km), 20 runs each - the Exeter lasers were halved on 2026-10-23, the old acceptance numbers predate that; (c) mission 2 survivability bot, 20 runs per difficulty cell (docs/HANDOFF.md item 3).
Output: append a dated section to docs/BALANCE_TESTS.md with the table (runs, wins, CI, median time), exact commands, git sha, and a raw-JSON file under docs/data/. Do NOT change any balance numbers; only report.

## Brief 3 - CI that runs the tests (branch `ci-tests`)

Extend `.github/workflows/ci.yml` (currently build + validate_db) with a Playwright job: install Chromium, `npm install three@0.170.0` into the harness dir (tools/tests/lib.py does this itself via GS_TEST_DIR), run `suite1.py`, `p0_t.py`, and the credits/db tests; fail on any console error. Keep wall time under ~10 minutes (software rendering is slow; use q=low URLs where the README says it is safe). Upload test logs as an artifact. Also add the lint blind spots to `build.py`'s duplicate-name check (destructuring declarations, multi-declarator `const a = 1, b = 2;`) with a test that proves a deliberate duplicate fails the build.

## Brief 4 - Reference render pack and docs hygiene (branch `docs-pass`)

(a) `tools/render_ships.py` already renders 3/4 / top / side / front per ship into docs/img/ships (git-ignored). Add a `tools/render_pack.py` that renders every ship with a labelled caption strip (name, class, length, key stats from data/db.json) into one contact-sheet PNG per faction, intended as an input pack for image-generation tools; do not commit images. (b) Find stale docs: grep docs/ for numbers that no longer match data/db.json (ship stats, weapon dmg/cd/range, laser values) and fix or mark them; docs/data/*.csv must be regenerated by tools/export_db.py, not edited. (c) Make `README.md` and `AGENTS.md` consistent with the current source map (src/16_db.js, data/db.json, tools/).

## Brief 5 - Touch and iPad checklist harness (branch `touch-qa`)

Goal: reduce what the owner must hand-test on iPad. Using Playwright with touch emulation (`R.page(w,h,q,touch=True)` in tools/tests/lib.py) at 844x390 and 390x844: script a sequence that exercises every touch button (fire, missile, target, power, pause, radar range, afterburner, dock, comms) and asserts the matching game state changes; screenshot into a git-ignored folder and write a markdown report listing buttons that overlap, are outside the safe area, or have touch targets under 44 px. Report only; fix nothing without a separate branch.

## Brief 6 - Shipyard follow-ups (branch `shipyard-2`, branch off `shipyard`)

From the owner's review of Brief 1: (a) the prims export must offer the helper-call syntax the ship files use (`tap([x,y,z], hz, [w0,h0], [w1,h1], 0xRRGGBB, {opts})`, `seg`, `ell`, `box`, `chain`, `ringSegs`, `rungs`) in addition to plain JSON, and the editor must accept both; (b) show the in-game size next to the authored size when `scaleShip` is applied (Halberd authored 64 m, in game 128 m; look at src/32_scale.js) and offer a "preview at in-game scale" toggle; (c) camera framing: start at a distance that fits the whole hull for every ship including the 600 m Bullfrog, and add "frame ship" and "front/side/top/3-4" view buttons; (d) a collapsible left panel so the model is visible on a laptop; (e) a "new ship from template" button that starts from the Kestrel (fighter), Halberd (corvette) or Exeter (frigate) prims and an empty db entry, with the id field validated. Extend `tools/tests/yard_t.py` for each. Same rules and gate as Brief 1.

## Brief 7 - Logistics bug fix (branch `fix-tender-drums`)

docs/WEAPONS.md states that a tender restores turret point-defence drums, but `tenderTick` (grep `tenderTick` in src/) only refills fixed mounts and `T.dry` on turrets is never cleared, so a Halberd or Exeter can run its PD dry for good (the drums are most of their ammunition: about 6000 and 5500 rounds). Fix it so a tender (proximity trickle and live `D` docking) refills turret magazines and clears `T.dry`. Write a seeded test in `tools/tests/` that empties a Halberd's PD drum, docks it, and asserts the drum refills at the documented service rate. Do not change any numbers in data/db.json and do not change the bomber AI (`bomberAI`) in this branch.

## Brief 8 - Merlin geometry and database entry (branch `ship-merlin`, branch off `shipyard`)

Read docs/ships/merlin.md (all of it, especially section i, the voxel design brief, and the owner decisions at the end) and docs/ships/merlin.db.json. Build the human light fighter MERLIN: 9.0 m, two MK-20 cannons (group 1), 2 IR missiles, composite armour, no HE, no magazine.
1. Geometry: add `SHIPS.merlin = { ...DB.ships.merlin, prims: [...] }` to src/30_ships_human.js following the pattern of the other ships there (the `prims` array only; use the K and H palettes at the top of the file and the Kestrel's design language so the two read as one fleet). Design it in the Shipyard (`?yard`), iterating until the silhouette is clearly a smaller, lighter airframe than the Kestrel at 100 m, with two visible MK-20 barrels, engine nozzles at the engine positions, a canopy and the IR missile rails at the `launch` point. Every weapon, engine and component in the database entry must have a physical thing on the model (AGENTS.md rule).
2. Database: add the entry from docs/ships/merlin.db.json to `ships.merlin` in data/db.json (same field order as the kestrel entry), keep the coordinates inside `half`, run `python3 tools/validate_db.py` and `python3 tools/power_table.py` and paste the Merlin row in your report. Do NOT change any number in the spec; if something cannot work, stop and report instead of improvising.
3. Do NOT add the Merlin to menus, skirmish presets, missions or AI wings (a player-facing change; owner decides later). It must spawn via `__game.spawnShip('merlin', team, pos, dir, {})`, via `?yard=merlin` and via the URL skirmish parameter (`?sk=merlin:2` style, check src/76_menu.js skFromParams; if that parameter only accepts a fixed list, extend the list only if the change is one line, otherwise report it).
4. Test: `tools/tests/merlin_t.py` (style of the other tests): spawn 2 Merlins vs 2 Darters in `?free&n=0`, run 60 sim-seconds headless, assert no console errors, both Merlins fire (bolts spawned), the ship has the expected components and mounts, the voxel count at mid quality is reported and below 6,000.
5. Run `tools/check_branch.sh ship-merlin`, then report: commands run and results, what you verified and what you did not, the voxel count, and a PNG sheet from the Shipyard saved OUTSIDE the repo (images are git-ignored).
Same global rules as every brief. Do not start any other brief.

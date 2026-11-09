# Milestone 2 (2026-10-22): handoff for local work

State of `main` when this milestone was declared. Written so that someone (or another coding tool) can continue locally.
Tone as in AGENTS.md: what was verified, what was not.

## How to work on it
- Clone `https://github.com/kachumbali/game-space`, open the folder in an editor. `AGENTS.md` (repo root) holds the rules: edit `src/*` only,
  `python3 build.py` regenerates `index.html` (never edit it by hand), top-level `const/let` live in one shared module scope (TDZ and **duplicate
  names across parts break the whole page**: this happened at the last merge, `_bm` declared in two parts; grep before adding a module-level name).
- Run: `python3 -m http.server` in the repo root, open `http://localhost:8000/` (three.js comes from a CDN, so internet is needed).
  The `audio/` folder must sit next to `index.html`. GitHub Pages (if enabled on `main`) redeploys on every push.
- Rebuild after each change; a tiny watcher is enough: `while true; do python3 build.py >/dev/null; sleep 2; done`.
- Tests: `pip install playwright`, Chromium installed (or `GS_CHROMIUM=/path/to/chrome`), `npm` for the first run (installs three into `GS_TEST_DIR`).
  `cd tools/tests && python3 suite1.py` (13 URL cases, no console errors). Run **one test at a time**, and use unique `GS_PORT` and `GS_TEST_DIR`
  if anything else runs. Page loads are slow on a software renderer (120 s timeout in `lib.py`). See `tools/tests/README.md`.
- Commit policy in AGENTS.md ends commits with Claude trailers; adapt that section to whatever tool you use. Images are git-ignored by owner decision
  (`.gitignore`); do not add image files. Every third-party asset must be listed in `src/15_credits.js` and `docs/CREDITS.md` with its licence checked.
- If you use another coding assistant: tell it to read `AGENTS.md` and `docs/PLAN.md` first (I have not verified that any given tool loads `AGENTS.md` automatically).

## What the game is now
Voxel space shooter "Claude Space Commander" (humans vs FROGGs), single file `index.html` from `src/*` (31 parts).
- **Menu and modes:** main menu (campaign/missions, skirmish, free flight, options, credits); skirmish setup with presets (waves, heavy, Gulper, vs Halberd/Exeter/Bullfrog, unarmed Hive Carrier) and `?sk=` URL form; free flight (`?free`); missions Lilypad and Reedbed.
- **Ships:** Kestrel (player), human Halberd corvette, Exeter frigate (450 m), drones (6 m, human only); FROGG Darter, Leaper, Spitter, Toad, Reaver, Gulper, Hive Carrier (2.5 km, unarmed catalogue ship) and the new **Bullfrog** (600 m, jump-capable cruiser, explicit exception to the 500 m cap).
- **Systems added this session:** power allocation (keys 4/5/6/7), afterburner pool (FROGG 36 s, x2.1), FROGG buffs (lasers +25 %, missiles +30 %), AI missile budget, LOD with device presets (options panel O), energy gauge, Newtonian vector markers, comms menu (J), drones (`?free&drones=N`), real beam rendering (`src/61_beams.js`), turret classes S/M/L (5 / 11 / 30 m) with barrel-tip muzzles, missiles hit friendly hulls, extremity-based ship collisions, WC2-style damage schematic with hull outline.
- **Bullfrog:** XL spine lance (6 s charge, 30 s cooldown, telegraphed, refuses with a friendly in line), 2 L turrets (dorsal, ventral), 6 M, 10 S, 8 PD, 4 Tadpole tubes, 2 hangar bays with 36 FROGG fighters, `lancer` AI. Spec and deviations: `docs/BULLFROG.md` (section 11 lists every deviation).
- **Docs worth reading first:** `docs/PLAN.md`, `docs/OPEN_QUESTIONS.md`, `docs/BULLFROG.md`, `docs/NUKES.md`, `docs/STAR_MAP.md`, `docs/STRATEGY_MECHANICS.md`, `docs/FLEET_LOGIC.md`, `docs/BALANCE_TESTS.md`.

## Verified at this milestone (headless, software renderer)
suite1 13/13 URL cases no console errors; beam_vis_t, tur_aim_t (every turret aims within 0.07 rad), menu_t 0 failures, drone_t 8/8, coms_t, fix_t, dmgmap_t; bullfrog_t scenarios as listed at the end of this file.

## NOT verified (be honest about these before trusting the numbers)
- Real GPU frame rate on any device (Hive Carrier, Bullfrog 45k instances at tablet detail, 112k at laptop detail), real touch behaviour, phone readability.
- Hand play of anything added this session: feel of power allocation, comms menu, beams, spine warning, damage map on a phone.
- Balance. Exeter + 12 Kestrels + 2 Halberds vs Bullfrog + 36 fighters at 10 km: FROGG won 4 of 6 runs (six samples, not reproducible seeds), see `docs/BALANCE_TESTS.md`. 4 Kestrels vs FROGGs: even point about 7-8 FROGGs (was 11-12 before the FROGG buffs; target was 12).

## Known problems and open items
1. **Point defence barely works against missiles** in the engine (Bullfrog's 18 small turrets killed 0-1 of 8 Swifts; Exeter PD 0 of 8). Turrets slew from rest too slowly; DT 0.05 also lets bolts skip the missile hitbox. This breaks the PD assumptions in `docs/BULLFROG.md` 4.4e and `docs/NUKES.md`. Engine-wide fix needed (turret slew, hitbox, PD lead).
2. **Nukes:** `docs/NUKES.md` is a design only. The first-cut code has defects (PD kill detonates at full yield, blind timer never affects PD, crew dose can destroy a capital, no arming step). Not implemented.
3. **Spine `through` hits** are an engine change beyond the spec (without it an Exeter survived 6 hits instead of 3-4). Revisit if armour/EXPOSED rules change.
4. **Ship turn rates** are per sim-second and the sim runs at 0.375x: capital turn 0.06 is about 0.0225 rad per real second. Intended for now; tune by feel.
5. **Hive Carrier is unarmed** (catalogue ship, coarse 12 m voxels); the skirmish preset is labelled accordingly.
6. **Lasers often miss 12 m fighters** (thin voxel target) after the first seconds; existing hit logic.
7. **Docs not yet updated:** `docs/BULLFROG.md` sections 3.3/4.3 still show pre-implementation turret numbers (section 11 is correct); `weapons.csv`/`ships.csv` regenerated from code but the blueprint generators in `tools/gen/` have not been re-run since they were moved.
8. **Flaky headless tests:** `menu_t` failed once on an idle-player skirmish (player killed at 21 s); passed on reruns. Seeds are not reproducible.
9. **Strategy layer** (`docs/STAR_MAP.md`, `docs/STRATEGY_MECHANICS.md`) is design only; its astronomy was not verified against NASA Exoplanet Archive/SIMBAD (no page could be opened); 18 open questions with defaults in section 18.
10. **Unresolved owner questions:** `docs/OPEN_QUESTIONS.md` (laser mechanics confirmation, FROGG heat, cut-scene art approach, publishing/licences).
11. **Reference art:** the owner supplied AI-generated FROGG portraits (warrior in a bioluminescent swamp; pilot in a flight suit with a "FROGG" shoulder patch inside an organic hive hangar). They are not in the repo (images are git-ignored); the look they establish (horned, scaled head, green and orange glowing seams, hive-organic architecture with arches and hoses) matches the existing ship palette. Provenance and licence of AI output must be confirmed by the owner before any use in the game (AGENTS.md credits rule).

## Suggested next steps
Fix point defence (item 1) before tuning the Bullfrog or implementing nukes; then nukes per `docs/NUKES.md`; wingman orders by group and mission use of drones; hand-play pass on phone and iPad for HUD (power widget, comms menu, damage map).

## bullfrog_t.py results at the milestone (each scenario in its own process)
- inst: tablet (detail 2) 45,741 instances, laptop (detail 4) 112,624, desktop (detail 6) 122,140; LOD drops two steps for a far ship and restores near. PASS.
- spine: first charge 14.95 s, lock 4.5 s later (heading frozen the last 1.5 s), shot at 6 s, next charge 30 s after the shot. PASS.
- friendly: no charge with a friendly in line; fizzle when one enters during the lock; friendly untouched. PASS.
- hangar: airborne cap 12 respected, first 12 out in about 27 sim-s, refill after losses, bay loss drops its manifest, emergency launch lifts the cap. PASS.
- blast: missiles detonating on the outer hull of the Bullfrog and Exeter now deal damage (the bug was confirmed before the fix); Halberd behaviour unchanged. PASS.
- exeter: without shield regeneration an Exeter dies on spine hit 4; with regeneration on hit 5. PASS.
- Visual check (mid quality, one skirmish screenshot set, not committed): the Bullfrog reads as a long ribbed barrel with cyan stern drives; thin flares and mandibles are mostly lost at 2.2 m voxels. The target panel listed all 40 components across the screen; fixed to one chip per role (`GUN 2/2 TUR 26/26 ENG 6/6 ...`).
- Merge note: the Bullfrog and beam branches both declared module-scope `_bm`; the page failed to load until the Bullfrog copy was renamed `_bfm`.

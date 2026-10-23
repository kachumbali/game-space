# Headless tests (Playwright + Chromium, software renderer)
Run from this folder: `cd tools/tests && python3 suite1.py`. Needs `pip install playwright` (Chromium already installed, or set `GS_CHROMIUM`) and `npm` (first run installs three@0.170.0 into `GS_TEST_DIR`, default `/tmp/gs_test`).
Run `python3 ../../build.py` first: the tests serve the built `index.html`. The build also fails on duplicate top-level names (owner P0 2026-10-22). `?seed=N` in page URLs makes a run deterministic; duel cells should quote >= 20 runs.

macOS test invocation (as used 2026-10-22): `cd tools/tests && GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" /tmp/gs_venv/bin/python <script>.py` - `/tmp/gs_venv` is a throwaway venv with playwright (`python3 -m venv /tmp/gs_venv && /tmp/gs_venv/bin/pip install playwright` to recreate). See docs/HANDOFF.md for gotchas (q=low and bolt hits, ai.hold blocks guns AND launches, missile-death tracking). The build also fails on duplicate top-level names (owner P0 2026-10-22). `?seed=N` in page URLs makes a run deterministic; duel cells should quote >= 20 runs. Run pages one at a time; several in one run time out. To run beside another test run set `GS_PORT` and `GS_TEST_DIR` (default 8765, /tmp/gs_test; symlink node_modules into the new dir).

| Script | What it checks |
|---|---|
| `drone_t.py` | drones: launch/limits, each order, ram on a Halberd, PD vs drones, controller death (8 scenarios, one page each) |
| `bullfrog_t.py [warn spine exeter friendly arcs pd hangar inst blast]` | Bullfrog (docs/BULLFROG.md): spine timeline, HUD warning, Exeter hit count, friendly-line refusal, turret arcs, PD vs missiles, hangar cadence/cap/bay loss, voxel instances and LOD, missile blast reach |
| `bullfrog_eng.py SEED [LIMIT] [RANGE] [DT]` | owner acceptance engagement: Exeter + 12 Kestrels + 2 Halberds vs Bullfrog + hangar at 10 km (no rendering, about 10-30 s wall per run); results in docs/BALANCE_TESTS.md |
| `bullfrog_surf.py`, `bullfrog_view.py` | Bullfrog turret/component surface probe; five-view screenshot renders (`/tmp/gs_bf_*.png`) |
| `spine_sim.py [START_DIST] [LIMIT_S]` | Bullfrog-vs-Exeter 1v1 diagnostic (docs/BULLFROG.md 4.4a): spine charge/fire/fizzle timeline with shield/structure around each hit; Tadpoles and hangar fighters disabled (default 6000 m, 900 sim-s) |
| `mdxl_t.py` | Exeter MK-90 mass driver (XL): capitalAI-driven cycle (delay 15 s, charge 5 s, lock 3.5 s, cd 30 s) and ~540 kinetic pierce per hit vs a disarmed Bullfrog dummy |
| `power_t.py` | AI power management (all ships): under fire -> SHIELDS, distant target -> ENGINES, pressure gone -> 4/4/4; shield regen at pw.s 8 is ~1.48x the balanced rate |
| `magazine_t.py` | Magazines (owner rule: every kinetic weapon carries ammo; XL = 100 slugs): mount pools drain, dry turret drums go dark, dry XL will not charge, GA-9 rotary fires and runs dry, Gulper grp-2 lances fire under AI, tender rearms ammo/stores/slugs but repairs nothing |
| `tender_pd_t.py` | Seeded tender service: Halberd PD turret drums refill at the documented 20 rds/s proximity rate and 40 rds/s docked rate; dry flags clear |
| `discipline_t.py` | Gun discipline (60/30/5 bands measured as drain rates), the Kestrel MD-9 mag (fires, draws energy), and the nuke yield dial (0.1 vs 2 kT kill radius) |
| `dock_t.py` | Tactical docking: approach + D -> auto-dock at the boom, glue while rearming at double the hovering trickle, auto-undock when full, manual undock, nothing repaired |
| `p0_t.py` | P0 pass: real pause freezes the sim in real time (Esc / touch II), PD proximity flak intercepts torpedoes (4 of 4 vs the 0-of-7 baseline), same seed -> identical Math.random streams |
| `suite1.py` | 10 URL variants load, no console errors |
| `menu_t.py` | main menu at 1280x720 / 844x390 / 390x844 (screenshots to `$GS_SHOTS`), keyboard nav, skirmish setup + launch + win/loss debrief, `?sk=` URL form, endless respawn |
| `music_t.py` | music: autoplay start on first input, mood per game state (patrol/combat/heavy in flight, menu on briefings, story in transits, win), correct track files, `?mute`, all audio files served |
| `m2full.py` | mission 2 flow through all stages |
| `bot2.py` | autopilot bot flight, no errors (note: the bot does not press SPACE, so its mission-2 run stays in the transit cine at t=3; the skip and the rest of the flow are covered by `m2full.py`) |
| `duel2.py 10,12,14 3` | 4 Kestrels vs N FROGGs balance duels (args: FROGG counts, runs, sim-second limit) |
| `duel2n.py 4,6,8 5` | same duel, both sides Newtonian (`fm:'newton'` on spawn) |
| `laser_t.py` | laser focus: ramp on a steady target, zero damage on a jinking one |
| `tur_t.py`, `pd_t.py` | turret aiming and fire (Halberd / Exeter vs FROGGs) |
| `beam_vis_t.py` | beam rendering: hostile Exeter lasers the player, asserts live beams in the pool, none in brief state, no console errors; screenshots to `$GS_SHOTS` (default /tmp/gs_shots) |
| `muzzle_t.py [ids]` | muzzle/turret audit: mount distance to the hull voxels, turret hit-zone radius vs visible size, marker screenshots per ship in `$GS_SHOTS/ships` (`GS_NOSHOT=1` for numbers only) |
| `tur_aim_t.py [ids]` | every turret (dorsal and ventral) aims its barrel at the target when firing (independent scene-graph check) and bolts leave from the barrel tip |
| `cred_t.py`, `cred_t2.py` | credits screen from briefing and from the options panel |
| `scen.py`, `plog_t.py`, `rdlg_t.py`, `beam_t.py`, `csv_t.py`, `render_t.py`, `view_t.py`, `tune_t.py`, `armor_t.py` | older scenarios: flight models, play log, restart dialog, beams, CSV check, renders |
Some older scripts may still reference session-specific files; fix paths when you hit one.

# Headless tests (Playwright + Chromium, software renderer)
Run from this folder: `cd tools/tests && python3 suite1.py`. Needs `pip install playwright` (Chromium already installed, or set `GS_CHROMIUM`) and `npm` (first run installs three@0.170.0 into `GS_TEST_DIR`, default `/tmp/gs_test`).
Run `python3 ../../build.py` first: the tests serve the built `index.html`. Run pages one at a time; several in one run time out. To run beside another test run set `GS_PORT` and `GS_TEST_DIR` (default 8765, /tmp/gs_test; symlink node_modules into the new dir).

| Script | What it checks |
|---|---|
| `drone_t.py` | drones: launch/limits, each order, ram on a Halberd, PD vs drones, controller death (8 scenarios, one page each) |
| `suite1.py` | 10 URL variants load, no console errors |
| `m2full.py` | mission 2 flow through all stages |
| `bot2.py` | autopilot bot flight, no errors (note: its mission-2 run stays in the cinematic at t=3; not investigated) |
| `duel2.py 10,12,14 3` | 4 Kestrels vs N FROGGs balance duels (args: FROGG counts, runs, sim-second limit) |
| `laser_t.py` | laser focus: ramp on a steady target, zero damage on a jinking one |
| `tur_t.py`, `pd_t.py` | turret aiming and fire (Halberd / Exeter vs FROGGs) |
| `cred_t.py`, `cred_t2.py` | credits screen from briefing and from the options panel |
| `scen.py`, `plog_t.py`, `rdlg_t.py`, `beam_t.py`, `csv_t.py`, `render_t.py`, `view_t.py`, `tune_t.py`, `armor_t.py` | older scenarios: flight models, play log, restart dialog, beams, CSV check, renders |
Some older scripts may still reference session-specific files; fix paths when you hit one.

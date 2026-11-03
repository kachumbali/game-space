# Codex local integration log — 2026-11-01

## Launcher HUD (Codex, `codex/launcher-hud`, based on `codex/launcher-ai`)

- The opt-in launcher HUD reports ready/total missile and torpedo cells,
  loaded rounds, damaged cells, remaining reload seconds and magazine reserves. It is hidden
  for ships without launchers and when the feature flag is off; the help
  overlay explains the readout. No additional player control is required.
- Local build, DB validation, syntax and the readout unit test with flag-off,
  damage and reload controls passed. Claude: run `launcher_hud_t.py` at desktop,
  tablet and phone portrait/landscape, `launcher_runtime_t.py`, `capital_ai_t.py`,
  existing touch/HUD tests and `tools/check_branch.sh`. Browser tests and
  real-device readability were not run locally. All launcher AI and balance
  cloud checks from the preceding entry still apply.

## Launcher AI (Codex, `codex/launcher-ai`, based on `codex/launcher-runtime`)

- With `tuning.ordnance.enabled`, human capitals acquire fighter and capital
  contacts independently, fire ready cells in ripples, and commit torpedo
  salvos only when their ready tubes meet the data-driven PD rule or the
  target's PD is sufficiently degraded. Damaged cells cannot fire. Friendly
  and own-hull line checks guard each shot. FROGG launcher behavior is unchanged.
- The human ordnance plans now drive hangar manifests and contact-triggered
  drone launches, subject to their configured live limits and bay components.
  Paired `capital-exeter-{off,on}` and `capital-hecla-{off,on}` sweep scenarios
  collect expenditure and peak live missile counts.
- Local build, database validation, PD/clearance/hangar controls, hangar
  schema negative controls and sweep-counter controls passed. Browser tests,
  visual inspection and 20-seed sweeps are pending; no balance claim is made.
  Claude: run `launcher_runtime_t.py`, `capital_ai_t.py`, existing drone,
  capital AI, hangar, missile and campaign tests, and `tools/check_branch.sh`.
  Then run each paired sweep with seeds 1–20 and compare time to kill,
  survival, expenditure and peak live missiles. Inspect launch points and
  verify launch paths clear the hull in runtime and Shipyard, including iPad.
- The earlier always-on missile class scaling lives separately on
  `codex/capital-ordnance-runtime`; it is not included in this lane. Integrate
  or reimplement it deliberately before treating measurements as final.

## Launcher runtime, lane 3a (Codex, `codex/launcher-runtime`)

- Experimental only: `tuning.ordnance.enabled` remains false. Human Halberd,
  Exeter, Claymore and Hecla grouped launcher data now includes one hull-local
  location and damageable component per cell. Recessed covers are painted on
  existing hull voxels and marker views use the same components. Halberd cell
  positions and radii follow its existing scale transform. No FROGG launcher
  data or new FROGG stores were added.
- `initLaunchers`, `launcherTick`, `launcherReconcile`, and `fireLauncher`
  implement independent simulation-second reloads, typed ready rounds and
  magazine reserves. `s.stores` is the total of loaded plus reserve rounds;
  existing tender additions are reconciled without duplicating ammunition.
  Damaged (at or below 50% health) and destroyed cells cannot load or fire.
  An over-cap refusal does not consume a cell or a round. Existing generic
  launches on these ships route through a ready healthy cell. The capital AI
  global timer, target policy, torpedo hold rule, hangars, HUD and other lanes
  are not implemented here; the AI lane should call the cell API explicitly.
- The opt-in `launchMissile` options can select a local origin, world heading
  and hostile target while preserving the existing seeker logic. Invalid
  headings fall back to forward; disabled behavior retains the old path.
- Locally passed: build, DB validation, `launcher_runtime_unit.js` (independent
  clocks, fire/reload, fixed racks, typed reserves, tender additions, damaged
  cells, cap refusal, FROGG and flag-off controls), `launcher_schema_unit.py`
  (valid and invalid position/HP controls), JS syntax and Python compilation.
  No browser, seeded sweep, real-device check or full gate was run locally.
- Claude cloud: run `launcher_runtime_t.py`, `missile_budget_t.py`, existing
  missile/ordnance, shipyard and `muzzle_t.py` checks and `tools/check_branch.sh`.
  Test `?db=` with the flag explicitly true and false; inspect every cell in
  Exeter, Halberd, Claymore and Hecla in flight and `?yard=` from top, side,
  and 3/4 views. The authored hatch locations and visual attachment have **not**
  been browser-rendered or owner-approved; do not enable by default until then.
- Flag changes at runtime do not rebuild ship definitions: hatch paint and
  shipyard component markers are created at page load when the flag is on.
  Turning the flag off mid-page hides runtime launcher behavior but leaves
  that page's model geometry/markers until reload; turning it on mid-page
  creates runtime components but does not add hatch paint or yard markers.
  Set the flag in the database before loading, and reload after changing it.

## Capital ordnance P0–P3 (Codex, `codex/capital-ordnance`)

- `rg` found `dmgCls` / `pierceCls` in DB only, with no source readers. Updated
  stale base ordnance values in `WEAPONS.md` without changing weapon damage;
  the 20-seed per-hull runtime damage table remains outstanding.
- Added opt-in device missile caps, refusal/high-water counters and shared
  per-weapon mesh resources. `tuning.ordnance.enabled` defaults false; normal
  launch behavior remains uncapped and uses independent resources.
- Added validated grouped launcher records and disabled human fleet plans
  matching the study, leaving live stores untouched. No new FROGG launchers,
  tick or nuclear stores. No launcher/hangar execution is implemented.
- Local build, DB validation, source syntax and schema, damage-report and
  device-cap unit controls passed. Cloud: run `missile_budget_t.py`, existing
  missile/ordnance/drone/campaign checks and the full branch gate, then execute
  the 20-seed damage collection and report commands in
  `docs/CAPITAL_ORDNANCE_CLOUD_RUN.md`. No browser or seeded runs were done
  locally; no per-hull damage numbers or performance claims are made.

## Gulper / Merlin experiments (Codex, `codex/gulper-merlin`)

- Merlin max speed is 262.5; an authored AI cruise of 140 preserves the old
  normal attack-speed command while leaving break/boost and player maximum at
  the new value. The previously observed no-kill stall is not yet proven fixed.
- Added a projectile intercept solver gated by an optional AI data flag;
  Gulper default remains unchanged. Paired test-only lead+shield and lead+regen
  candidates add no launchers or missiles. Five one-change isolation scenarios
  cover the v0.5 Gulper hull, added R-5s and Falchion PD. Fifteen Merlin
  scenarios include range/speed/mode/ammo telemetry.
- Local build, DB validation, JS syntax, Python compilation and lead solver
  positive/negative controls pass. No Chromium, 20-seed sweep, real-device
  check or full gate was run locally, per owner instruction. Claude: execute
  `merlin_speed_t.py`, `touch_qa_t.py`, `tools/check_branch.sh` and the 26
  matching-seed experiments in `docs/GULPER_MERLIN_EXPERIMENTS.md`; report
  effects and confirm no regressions before choosing either candidate.

## Balance v0.5 (Codex, `codex/balance-v05`)

- Applied the exact structure table; component HP is independent of structure
  and was not redistributed. Added half-calibre `pdS`, halved the authored
  fighter PD drums, and implemented generic `burst`/`burstPause` for fixed
  mounts and both player/AI turrets. Gulper has three additional R-5 mounts.
- Added opt-in `?diag` renderer, instancing support and per-ship instanced mesh
  counts; added fighter matrix, Falchion/Gulper, candidate and 3v3 ordnance
  sweep scenarios, a PD intercept sweep and unit/browser test fixtures.
- Local build, DB validation, source syntax, Python compilation, and burst/HP
  and validator positive/negative controls pass. Browser tests, 20-seed sweeps,
  image inspection, balance option effects and the full branch gate are NOT
  run locally at the owner's direction. Claude: run the exact checks and
  matching-seed comparisons in `docs/BALANCE_V05_CLOUD_RUN.md` before merge.
  The 3v3 scenario's survival and candidate effects are not yet verified.

## Housekeeping (Codex, `codex/housekeeping`)

- Exempted owner art under `assets/` from the image rule; images elsewhere
  remain subject to the check. The R3 debrief now reports evacuation count;
  a browser test exercises partial/full loss, navigation and counts. Added a
  KITE-6 Halberd/Falchion launch-and-run test with an assertion control.
- Added paired seeded Kestrel M1 RF/IR swap scenarios. Merlin has no M1; no
  measurement results or balance claims are made. Commands and exact loadout
  details are in `docs/ORDNANCE_SWAP_MEASUREMENT.md`.
- Local build, DB validation, Python compilation and shell syntax passed.
  Browser tests, the 20-seed sweeps and `tools/check_branch.sh` remain unrun:
  auto-review rejected local Chrome due to the standing no-browser rule.
  Cloud: run `retreat_convoy_t.py`, `drone_t.py kite_carriers`, both scenarios
  listed in the measurement note, and the full gate; report losses, kills,
  survival and incomplete runs.
## Campaign pilot bot (Codex, `codex/pilot-bot`)

- Added `tools/tests/pilot_good.js`: objective-relative target selection,
  guns and locked missiles, collision break, afterburner disengagement,
  countermeasures and damaged return to the anchor. Measurement selects it
  with `BOT=good`; `BOT=simple` retains the original pilot.
- Local build, database validation, JS syntax and Python compilation passed.
  `tools/check_opsec.py` reports existing author-name matches in
  `docs/BRIEF_CAPITAL_LASERS.md`, `docs/CODEX_NOTE.md` and
  `docs/PLAN_V04_CODEX.md` on the base; this branch did not change them.
  Six-seed comparisons, the 13-mission browser runs and `check_branch.sh` were
  not run: automatic approval review rejected local Chromium execution based
  on the prior no-local-browser instruction. No win/loss numbers are claimed.
  Cloud: run `BOT=simple` and `BOT=good` with six seeds across all 13 missions,
  record raw JSON and loss/unfinished results separately, check prologue 1 and
  a formerly 6/6 loss mission, then run `tools/check_branch.sh`. Check bot
  collision, disengagement, re-entry, missile lock and no-console-errors.

## Playtest support — 2026-11-02 (Codex)

- Split the eleven Bullfrog scenarios into individual CI matrix jobs; the
  runner now exits nonzero for failing assertions or browser errors.
- BOOST touch QA pauses automatic frames, checks that boost is off without a
  touch (positive control), then advances a simulation step while the button
  is still held. This removes the race between releasing the touch and reading
  the afterburner state.
- Added the owner device checklist. Build, database validation and Python
  compilation were run locally; no browser or actual device tests were run.
  Cloud: run every `bullfrog_t.py` group (spine, exeter, xl_filter, friendly,
  arcs, pd, hangar, inst, blast, m3, warn), `touch_qa_t.py` repeatedly at both
  viewport sizes, and the full `tools/check_branch.sh` gate. Verify each CI
  group completes within its ten-minute job cap.
## Ordnance follow-up (Codex, `codex/ordnance-followup`)

- Player briefing selections now resolve per-station remaining rounds and
  launch coordinates; AI defaults and launch logic remain unchanged. A mission
  may specify `ordnanceStock` caps by weapon id; the briefing displays caps and
  refuses launch if the current selection exceeds them. Added help-overlay
  guidance and validation for station positions.
- Existing hull positions are provisional where no clear rack exists; see
  `docs/ORDNANCE_MANIFEST.md`. No new free-floating rack geometry was added.
- Local: build, DB validation, JS syntax, and `node tools/tests/ordnance_logic_t.js`
  pass, including over-stock and exhausted-station negative controls.
  Cloud: run `tools/tests/ordnance_t.py`, add browser checks for stock refusal,
  station launch origins and exhausted/swapped stations, test mission restart
  and tender rearm, inspect each hull in live and shipyard views, then run
  `tools/check_branch.sh`. No browser or device tests were run locally.
## KITE-6 wingman (Codex, `codex/kite6`)

- Added six-metre KITE-6, one engine, DR-2, two S Swift rails and datalink
  mast. Drone launches and skirmish wing selection use it; existing drone
  orders and touch COMMS are reused, with PROTECT as the default and a help
  line. Controller-less drone AI was retained.
- Local build, validation, source syntax and data contract (including an
  invalid-size control) pass. Cloud: run `drone_t.py`, `drone_noctrl_t.py`,
  skirmish menu/touch COMMS tests, verify launch, orders, two missile launches,
  controller loss and the shipyard model, then `tools/check_branch.sh`.
  Browser, device and seeded balance tests were not run locally.
## Long Retreat mechanics (Codex, `codex/retreat-mechanics`)

- Added convoy spool/loss/escape tracking, R3 counted liner capacity, partial
  outcome and R4 one-time scripted release of a sealed nuclear reserve. Wave
  sizes and existing stage timers were not changed. Escaped passengers are
  counted for the mission only; no persistent strategic ledger exists.
- Local build, DB validation, JS syntax and `node tools/tests/retreat_logic_t.js`
  pass, including early-departure, partial, all and no-survivor controls.
  Cloud: exercise all four R1/R3/R4 convoy outcomes and visible countdowns,
  R4 nuclear availability before/after release and after restart, transit
  checkpoint restart, campaign progression/debrief, no arcade drops and the
  full branch gate. No browser/device or seeded balance runs were performed.

## Lane A touch parity — 2026-11-02 (work in progress)

- Added a touch DOCK control bound to the existing docking action and raised the
  ETS power widget above touch overlays so its controls can receive pointer input.
- Build, database validation and input source syntax pass. Touch and Bullfrog
  browser tests and real-device layout remain unverified; Bullfrog fixes are
  still outstanding. Do not merge this partial lane as a completed fix.
## Campaign measurement lane B — 2026-11-02

- Started from `origin/main` 5cbef17 in an isolated worktree. The requested
  briefing difficulty selector was already present and applies difficulty to
  the player and enemy spawn sizes/skills; it was not duplicated.
- Added an all-nine-mission seeded bot runner and a campaign kill/drop test.
  Neither browser test was run to completion: test setup could not install its
  Three.js npm dependency locally. Python compilation passes. See
  `docs/CAMPAIGN_MEASUREMENT.md` for the remaining 180 runs and balance gate.
- Wave sizes remain unmodified; there are no measured loss rates yet. The
  owner device-play gate remains outstanding.
## C interim ordnance controls — 2026-11-02

- Based on `origin/main` 5cbef17. Briefing buttons allow the player to load or
  leave each authored missile magazine empty, including by touch. AI keeps its
  database default. No capacities or balance values changed.
- This is **not the requested individual station system**: existing database
  entries have aggregate stores and generic launch points, with no physical
  station capacities or eligible weapons. Existing fighter torpedoes are shown
  as legacy fits, rather than silently removed. Physical station data, compatible
  substitutions, launch geometry, stock validation and in-flight help remain.
- Briefing integration is in `src/75_mission.js`, overlapping lane B. Merge
  carefully, rebuild `index.html`, and run the branch gate. No device playtest.

## Lane C finished by cloud session — 2026-11-02

Per-station ordnance replaces the interim magazine toggle: `hardpoints` for Kestrel, Falchion, Merlin, Bittern in the db (validator checks ids, sizes, caps, allow lists, default load == stores, legacy torpedo flag), `src/77_ordnance.js`, `tools/tests/ordnance_t.py` (9 checks, green). AI keeps authored stores. Launch geometry, stock limits, models: not built. Swaps are unmeasured.
## D Long Retreat — 2026-11-02

- Added four authored missions in `src/77_retreat.js` and registered the arc
  between prologue and Severed Node after the campaign table is initialized.
  This avoids changing `75_mission.js`, which lane B owns. Uses only existing
  spawn, objectives, timer, transit, comms and end actions.
- R1 TERNs are non-vital fleet objects; R3 convoy departure is narrated; R4
  launch waves and jump are scripted. There is no passenger persistence,
  partial-success outcome, physical convoy jump or nuclear release. The design
  note records these limits. Timers and waves are unbalanced placeholders.
- Branch is based on `5cbef17`; integrate after B, rebuild generated output,
  run the branch gate, seeded mission checks and desktop/touch hand-play before
  treating these sorties as complete.

## Purpose and branch

This is a local-only integration branch for the Gemini handoff. It was created from
`origin/main` at `385052a` (`Spec for the intro test animation...`) as
`integration/gemini-handoff`. Nothing in this log has been pushed or merged.

## Imported handoff

Source: the downloaded Gemini handoff folder, especially
`docs/gemini-dev.patch` and `docs/GEMINI_LOG.md`.

The patch applied as three commits:

1. `2bb4102` — G1 Marks II–IV data plus the G2 prologue draft.
2. `04dbb78` — intro test art, timeline, and asset validator.
3. `0895fdd` — cutscene player and menu/URL integration.

The branch intentionally does **not** contain M2, M3, or M4 tuning/roster work.
It also does not treat Gemini's stated verification as a replacement for the checks
recorded below.

## Codex changes after import

- Changed the cutscene image and timeline paths in `src/81_scene.js` from
  root-absolute (`/assets/...`) to document-relative (`assets/...`). The game is
  published below `/game-space/` on GitHub Pages; root-absolute paths would request
  `https://kachumbali.github.io/assets/...` instead of this repository's assets.
- Added `tools/tests/scene_t.py`, a scene smoke test for scene visibility, asset
  loading, timeline progression, return-to-menu behaviour, and browser errors.
- Updated `tools/tests/lib.py` so the test server exposes `assets/` alongside its
  existing `audio/` and `data/` links.
- Rebuilt the generated `index.html`; it is included with the branch.

## Verification actually completed

All commands below were run after the path correction:

```text
python3 build.py
# built index.html from 38 parts, 752 KB, 827 top-level names checked

python3 tools/validate_db.py
# 29 ships, 44 weapons (27 marks), 3 armour types: OK

python3 tools/check_opsec.py
# opsec OK

python3 tools/make_atlas.py
# all declared art sizes, colour counts, head metadata, and scene JSON: 0 errors

node --check src/81_scene.js
python3 -m py_compile tools/tests/scene_t.py tools/tests/lib.py
```

## Browser-test status

`tools/tests/scene_t.py` was prepared but did not complete in this environment:
the available macOS Chromium process aborted during Playwright launch before it
loaded the page. An earlier attempt was blocked by a root-owned global npm cache;
that was avoided with an isolated temporary cache. Neither failure implicates a
game assertion, but no browser screenshot or human playtest has been completed.

Before merging, rerun:

```text
NPM_CONFIG_CACHE=/tmp/gs_npm_cache GS_PORT=8861 GS_TEST_DIR=/tmp/gs_scene_test \
GS_CHROMIUM="/path/to/Chrome for Testing" \
python3 tools/tests/scene_t.py
```

Then inspect `?scene=intro_test` at the deployed subpath as well as at localhost.

## Review points for Claude

- Review the G1 mark deltas in `data/db.json`; schema validation passes, but no
  balance claim is made here.
- `docs/GEMINI_LOG.md` calls the FROGG Mark IV torpedo an “acid” weapon in its
  prose. That is not a data-field name, but it conflicts with the repository's
  current no-acid weapon terminology and should be revised if this branch is
  accepted.
- The imported cutscene player is a new player-facing system and needs the normal
  desktop/iPad visual review before merge.
- G2 is a draft document, not implemented campaign scripting.

## M3 foundation pass — 2026-11-01

- Fixed the bow-on missile defect: blast distance now falls back to the nearest
  hull voxel for any affected ship, rather than only long hulls. This covers the
  Halberd and Gulper cases recorded in `docs/BALANCE_BASELINE.md`.
- Added a data-driven `tandem` warhead profile to the human HM-1 and FROGG ST-2
  torpedoes. On a direct hit, the precursor drains the impacted fore/aft shield
  facet, produces a flash, then applies the configured armour/shield-bypassing
  portion of the main charge. The initial profile is 55% shield-facet drain,
  35% pierce, and a three-second exposed window.
- Validation passed: build, database schema, source syntax, and opsec. No seeded
  TTK result is claimed yet; the new M3 mechanics require the 20-seed harness
  before changing warhead damage or publishing target hit counts.
- Bomber AI now fires torpedoes in three-round salvos: 0.65 seconds between
  rounds and a seven-second pause between waves. The timing lives with each
  torpedo in `data/db.json`, so later measurement can tune it without changing
  the AI routine.
- Extended `tools/tests/bullfrog_t.py` with M3 assertions for bow impacts on
  both corvettes and for the tandem shield drain, penetration, and exposed-window
  state. The test still needs a working Playwright/Chromium run on this machine.

## G5 briefing loadouts — 2026-11-01

- Replaced the handwritten `LOADOUTS` table in `showBriefing` with
  `briefingLoadout(shipId)`, which derives fixed mounts, turrets, ordnance, and
  countermeasures from the loaded database. This removes stale references to the
  retired plasma bolter and correctly reports the Bittern's twelve torpedoes.

## G6 roster naming — 2026-11-01

- Added `docs/ROSTER_NAMES.md`: a lore-consistent naming catalogue for ECU,
  VAC, VBC, and CDF production variants, future hulls, and weapon families.
  It is deliberately text-only: no M4 ship, weapon, database id, stat, or
  mission has been implemented or balanced by this pass.

## G4 generated-table status — 2026-11-01

- `tools/export_db.py` intentionally reads the live game through the shared
  Playwright runner before writing `docs/data/ships.csv` and `weapons.csv`.
  The supplied Chromium aborts during launch in this environment. A retry with
  the locally installed Chrome did not complete or write either table during
  the available execution window. The checked-in CSV files were therefore left
  untouched; no claim of a G4 data refresh is made.

## Campaign, roster, and nuclear review — 2026-11-01

- Added `docs/CAMPAIGN_RETREAT.md`, the previously missing Long Retreat arc:
  four mission-ready drafts with an intel ladder, existing-engine fallback
  paths, and explicit tags where convoy/evacuation systems must be implemented
  before the narrative claim becomes real.
- Added `docs/ROSTER_IMPLEMENTATION.md`, separating present database hulls,
  data-only marks, and planned Falchion/SAR/liner/destroyer work.
- Added `docs/NUCLEAR_IMPLEMENTATION_AUDIT.md`. The current NK-1 is a
  free-flight test-bench burst only; it does not implement the safer campaign
  nuclear system specified in `docs/NUKES.md` (release authority, arming,
  intercept behaviour, Exeter cells, campaign stock, or dedicated tests).

## M2 XL fighter exclusion — 2026-11-01

- Closed a rules gap found during the ship/turret review: `spineFire` now
  physically ignores fighter hulls, so player-driven and scripted XL shots
  cannot kill them even when perfectly aligned. The beam continues to a valid
  non-fighter hull behind the fighter. Added `bullfrog_t.py xl_filter` for the
  regression. Syntax, privacy, and generated-build checks pass; the browser
  test itself awaits a working Playwright launcher.

## Prologue campaign integration — 2026-11-01

- Implemented the four drafted *Uncharted Vanguard* missions as a separate
  selectable campaign (`p01`–`p04`) rather than appending them after the main
  five-mission finale. The campaign menu now chooses an arc first, then a
  mission; briefing shortcuts and Next Mission remain scoped to that arc.
- Direct local testing path: `?campaign=prologue&m=1` (then add `&go` to
  launch). The mission scripts use existing spawn, objective, comm, and end
  actions. Build, source syntax, database, and privacy checks pass. Browser
  interaction still needs a manual pass because the automated launcher is not
  currently usable in this environment.

## Halberd spearhead visual pass — 2026-11-01

- Rebuilt the CSS *Halberd* visual geometry around a coherent spearhead escort
  silhouette: continuous armoured keel, lance bow, low protected bridge,
  swept radiator/PD planes, and a unified three-nacelle aft frame.
- Retained every database-defined subsystem, weapon, turret, and engine
  position. This is a geometry-only pass: no collision extents, gameplay
  statistics, balance values, or mission scripting changed.

## Shipyard fleet database — 2026-11-01

- Added **SHIPYARD** to the main menu. It is a TIE Fighter-style technical
  roster: select a base hull to inspect role, in-game length, hull, shields,
  speed, reactor/capacitor, armament, stores, and authored subsystem list.
- **OPEN VOXEL INSPECTION BAY** routes to the existing `?yard=<ship>` model
  viewer, whose markers expose the authored subsystem positions. The catalog is
  read-only and derives its technical readout from runtime ship and weapon data;
  it does not alter combat rules or ship values.

## Shipyard inspection integrity — 2026-11-01

- The voxel bay header now has a **Main menu** control, returning cleanly to
  the front-end menu without retaining the `?yard=` query.
- Diagnostic component, mount, turret, and engine markers are now **off by
  default**; they remain opt-in inspection overlays rather than pretending to
  be ship hardware. The Halberd uses compact voxel turret barrels visibly
  rooted in its armoured seats. The free-rotating live-combat turret rig is not
  used in the engineering preview, where it can appear detached.
- The yard now derives its diagnostic data from an authored-scale clone. This
  prevents values shared with the live, scale-adjusted ship table from placing
  markers at doubled, visibly detached coordinates.
- Removed superseded Halberd bridge/dish detail that floated above the new low
  bridge. Added the hull structural-integrity rule to `AGENTS.md`: major masses
  must show a continuous supporting path to the hull in top, side, and 3/4
  views, and geometry beyond collision extents must be fixed deliberately.

## Bomber, torpedo-corvette, marks and campaign rhythm — 2026-11-01

- Rebuilt the Bittern's bomber read around an armoured cockpit cage and recessed
  3-by-4 HM-1 cassette bays. The visual now accounts for its 12-torpedo load.
- Reworked the FROGG Toad into a 22 m, 12-ST-2 armoured bomber with four rooted
  cassette launchers. It is comparable to Bittern in payload, shields, power,
  and survivability while remaining less agile than a fighter.
- Converted Gulper into a torpedo corvette: four physical nine-round ST-2
  cassettes, 36 total rounds, explicit launcher components, and rotating launch
  mouths. Its core escort weapons and four PD turrets remain intact.
- Added a visual-improvement path and a campaign technology-progression contract;
  the latter distinguishes weapon/system Marks I-IV from Armour Levels I-IV and
  records hard/kinetic, ablative/beam, and composite armour roles.
- Added short voiced NAV transits to Operation Lilypad between its three combat
  contacts. The mission engine already supported these transits; this applies
  the established pattern rather than adding a new player-facing control.

## Fixed direct-fire weapon Marks — 2026-11-01

- Added Marks II-IV for every fixed, non-turret direct-fire gun and beam across
  both factions, including the two XL spinal weapons. Each mark is an alternate
  operational lane with a cost: II strike/reach, III velocity/reach or beam
  output, IV rate of fire.
- Recorded the S/M/L/XL engineering taxonomy in player-facing weapon and
  progression documentation. Existing barrels, emitters, and spinal geometry
  are retained; a stat mark never silently changes an assembly's physical size.
- Database validation after the additions: 29 ships, 86 weapons, 69 marks, 3
  armour types.

## Campaign technology taxonomy — 2026-11-01

- Added `docs/TECHNOLOGY_PROGRESSION.md`, the design contract for campaign
  refits: S/M/L/XL physical weapon classes; Mark II-IV lanes for turrets,
  shields, engines, reactors and radiators; and the separate Armour Level I-IV
  nomenclature.
- Armour types are now described consistently for players and implementers:
  Kinetic / Hard counters projectile and rail damage, Ablative counters beam and
  thermal damage, Composite is general-purpose. Levels use normal resolved
  data variants when campaign rewards activate them; no hidden loadout screen
  or untested automatic stat change was added.

## Campaign realism guard and Halberd refinement — 2026-11-01

- Made the no-arcade campaign rule explicit in the campaign and design-path
  documents. Mission start clears any residual free-flight drops; the reward
  paths now reject loot, Overdrive, temporary buffs, score bonuses, component
  score, chains, and kill banners during campaign sorties. A factual kill count
  remains available for a debrief without becoming a combat reward loop.
- Reworked the Halberd's forward rail assembly into a recessed, low dorsal
  spine with lower barrels and matching database mount/component positions.
  Replaced the oversized sheet radiator that read as a midship wall in the
  voxel bay with compact, hull-rooted radiator booms and support struts.
- Removed obsolete radiator ribs and decorative turret-ring rods that remained
  after that geometry change and could render as detached floating fragments.
  Halberd visible hardware now follows a direct-support rule: every mass either
  intersects the primary hull or a structural member that does.

## Shipyard energy-budget audit — 2026-11-01

- The Shipyard is no longer only a geometry/database workbench: its editable
  hull entry now receives a live, data-backed weapons-power audit. It calculates
  the balanced ETS weapons bus from reactor plant output, sums every installed
  energy-costed fixed mount and turret at continuous fire, and reports either
  sustained headroom or capacitor endurance under a deficit. Charged spinal
  weapons remain separately reported bursts instead of being falsely treated as
  continuous load.
- The readout is intentionally an engineering constraint rather than a fake
  complete shipbuilder. Heat, mass, volume, shield and drive demands have not
  yet been authored as data, so the audit says exactly what it can and cannot
  validate. It updates while editing and never writes to source files.

## Product-mode contract and Halberd live-turret correction — 2026-11-01

- Recorded the four-mode contract in the product vision: Free Flight,
  Skirmish, the authored Scripted Campaign, and the separate optional Strategy
  / Dynamic Campaign. The strategy layer will generate its own persistent war
  battles without altering the authored campaign route.
- The Shipyard displays only authored voxel geometry, while live combat adds
  tracking turret rigs. Halberd's two laser rigs now use a compact visual scale
  matched to their embedded voxel seats; their weapon class, tracking and
  combat values are unchanged.

## Ordnance-manifest and drone-wingman contract — 2026-11-01

- Recorded fixed physical ordnance stations: S missiles for drones/fighters,
  M missiles for fighters and heavy fighters, L torpedoes only for bombers and
  dedicated strike craft, and XL cells/spinal ordnance for capital hulls.
  Current briefings show fixed stores; a constrained station-selection screen
  is the next implementation step rather than an already-shipped feature.
- Audited the existing generic human drone and specified it as the future
  **KITE-6 Loyal Wingman**: a 6 m expendable scout/interceptor with DR-2,
  two S-class Swift rails, datalink mast, finite campaign inventory and no
  torpedo capability. Existing drone orders/control limits provide its base.

## P0 test debt, 2026-11-02 (cloud session, branch p0-test-debt)
Re-ran every red test of the post-merge sweep one at a time on the merged build.
- Fixed (test was wrong or stale): `menu_t` (campaign list is now two levels, `mission:severed_node:0`; the 30 s skirmish step makes the player invulnerable so an idle player cannot die), `yard_t` (camera eases, wheel check waits 600 ms), `roster_t` (SAR is unarmed and hunted, so no survival check; `SK_PLAYER`/`SK_WING` now exported on `__game`), `tur_aim_t` (MD-55 is `bigOnly`, skips fighters inside 900 m, so "never fired" is correct there), `bittern_t`, `campaign_t`, `scene_t`, `tern_t`, `tender_pd_t` pass.
- Not tests, documented in `tools/tests/README.md`: `view_t`, `plog_t`, `render_t`, `muzzle_t` (need arguments or minutes).
- Still red, real: `bullfrog_t` (3 fails: HUD text during the lock, no charge while a friendly is in the line, fizzle check; identical before the merge; also hits the 420 s cap) and `touch_qa_t` (4 fails: no touch DOCK control `#bdock`, touch power shift has no effect; player-facing touch gaps).

## P1 capital-laser split, 2026-11-02 (Codex, `codex/next-development`)

- Branched from the current `origin/main` at `f73917d`, as required by
  `docs/CODEX_NOTE.md`; no old local integration branch was reused.
- Added the S-class P-4 defence pulse and moved Halberd's two and Exeter's four
  former LS-2 placements to it. It is a short-range, low-output, 100 deg/s
  anti-fighter suppressor rather than a wing-deleting capital laser.
- Recast LS-8 (`laserM`) as the slow anti-capital battery: corvette/frigate/
  capital target filter, 18 deg/s slew, 1.8 s re-target delay, and 1.5 s
  charge. HECLA remains at exactly six LS-8 installations; its count was not
  changed.
- Added per-ship soft target spreading and speed/skill-dependent beam hit
  probability. These use `data/db.json` tuning values, not source constants.
  XL fighter immunity was not changed.
- Added `tools/tests/capital_laser_t.py`; it passed alongside DB validation,
  source syntax, diff whitespace checks, and a fresh build (33 ships, 111
  weapons, 93 marks). Updated the player-facing weapon and laser catalogue with
  the new P-4/LS-8 roles and live values.
- Measurement is intentionally **not claimed**: the required 20-seed browser
  sweep failed to complete even seed 1 in this local Chrome/SwiftShader setup.
  `docs/BALANCE_REPORT_3.md` records the exact pending P1 gates for Claude's
  cloud browser run. Do not merge P1 until those figures are recorded and the
  branch gate has been run. P0's known `bullfrog_t` and `touch_qa_t` failures
  remain out of scope and untouched.

## P5 red-team work in progress (Codex, `codex/p5-red-team`)

- Based on `origin/main` 5cbef17. Enemy AI considers nearby hostile tenders
  before squad focus, while respecting explicit orders and immediate attack.
- AI explosive fixed mounts hold when a friendly hull is near the target;
  other weapons in the group can still fire. This is a conservative target
  neighbourhood estimate, not a prediction of all possible impacts.
- R-12 now carries `bigOnly`/`noPD` and AI fixed-mount fire respects the
  existing 900 m close-defence exception. Player fire and 45% pierce remain
  unchanged; marks inherit the flags. No balance improvement is claimed.
- Build, database validation and JavaScript syntax pass. Browser behavior,
  seeded combat measurements and the full branch gate remain outstanding.
  Rebase on the newly merged main before publishing as instructed by owner.

## P5 review by cloud session — 2026-11-02
Codex's red-team AI pass (`7927281`: FROGG fighters prefer a nearby tender, AI big guns hold fire on fighters beyond 900 m, AI holds HE when a friendly is in the blast radius) verified with `tools/tests/p5_t.py` (9 checks, with positive controls). Fixed a missing semicolon. Not covered: R-12 pierce-vs-rail decision, GX-1-vs-hard-armour decision; no seeded balance run of the tender rule.

## Capital ordnance P0-P3: Claude cloud verification (2026-11-02)
Gate PASS on branch + main; `capital_schema_t`, `missile_budget_t` (caps 20/32/48, refusals, flat resources), `msl_t`, `ordnance_t` PASS. P0 damage table inserted in `docs/WEAPONS.md`, raw data in `docs/data/capital_missile_damage*`. Not run: real iPad/phone performance, drone/campaign suites.

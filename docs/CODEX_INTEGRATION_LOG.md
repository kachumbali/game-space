# Codex local integration log — 2026-11-01

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

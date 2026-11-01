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

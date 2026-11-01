# Cutscene art handoff — painted-cinematic pass

Date: 2026-11-01. Scope: only the `intro_test` cutscene visuals and its renderer.

## What changed

- Replaced the test's low-detail space and briefing backdrops with original,
  realistic painted-comic WebP illustrations.
- Replaced the 64px pixel talking heads for Commander Imani and Hawk with
  high-resolution framed portrait cards. The original mouth/eye overlays still
  load as a fallback for character art that needs explicit lip-sync frames.
- Removed the two low-resolution moving ship sprites from the test timeline;
  the space establishing shot already composes the fighter and escort ship at
  cinematic scale.
- The player now renders at 4x physical canvas resolution while retaining its
  320x200 authoring coordinates for dialogue and the timeline. Backgrounds and
  portrait cards consequently stay smooth when the cutscene fills a display.

## Deliberate limits

- This is a visual-quality pass, not a new story or campaign scene.
- The painted portrait cards do not animate mouths or eyes. The existing layered
  64px heads remain as a renderer fallback; future speaking characters should
  receive expression-card variants or layered high-resolution portraits.
- Browser smoke testing remains contingent on a working local Playwright browser
  launch. Static checks, the build, and asset existence checks should still run.

## Generated assets and provenance

See `docs/ART_CREDITS.md` for the tool record, asset list, and prompt constraints.

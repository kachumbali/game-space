# Changelog

Versions are named from the state of `main`. Commit trailers and tool history: docs/MILESTONE_2.md.

## 0.2.0: the fun update (in progress on branch `v0.2-fun`)
Owner request 2026-10-30: "make it a LOT more fun and awesome", after reading Simon Willison's account of doing exactly that
to a vibe-coded game. Design notes and acceptance results: `docs/FUN_UPDATE.md`. Written to the feature-freeze conditions in
AGENTS.md: every new player-facing system has a touch binding (or needs none), an AI default (the AI ignores it) and a help line.

## 0.1.0: status at 2026-10-24 (tag `v0.1` = commit 9bc97d7, origin/main)
What the game was before the fun update. Facts from the repo; where something was not verified it says so.

- **Content:** 5 campaign missions (Lilypad, Reedbed, The Severed Node, Short Leash, The Spine; the last three from docs/CAMPAIGN.md),
  skirmish with presets and a URL form (`?sk=`), endless free-flight waves, a main menu.
- **Ships (17 in `data/db.json`, the single source of truth):** human Kestrel, Merlin, Bittern bomber, Tern shuttle, Halberd corvette,
  Exeter frigate, Hecla fleet tender, Tender, Drone; FROGG Darter, Leaper, Spitter, Toad, Reaver, Gulper, Bullfrog (600 m),
  Hive Carrier (unarmed catalogue ship). 29 weapons, 3 armour types.
- **Systems:** damage pipeline (shield, armour, structure, exposed subsystems), power allocation (ETS), afterburner pool, magazines,
  comms menu, drones, tactical docking at a Tender, nukes (0.5 kT standard, `?nukeKt=` dial), real beams, S/M/L turrets,
  distance LOD with device presets, real pause, touch parity, AI power management and gun discipline.
- **Tools:** Shipyard voxel editor (`?yard`), seeded deterministic runs (`?seed=N`), balance sweep harness, build lint (duplicate
  top-level names), CI, about 60 headless test scripts in `tools/tests/`.
- **Known state (from docs/UX_REVIEW.md, OPEN_QUESTIONS.md, HANDOFF.md):** arcade even point about 6-7 FROGG fighters vs 4 Kestrels,
  Newtonian about 4; difficulty is a cliff with no dial; weak hit feedback; no tutorial; no directional damage cue; capital lasers
  delete fighter wings (owner play-test 2026-10-24); new player-facing systems were frozen pending an iPad hand-play.
- **Not verified:** real-device frame rate (iPad, phone, laptop), phone readability, hand-play feel of anything added after
  2026-10-22. All test numbers are from a software renderer.

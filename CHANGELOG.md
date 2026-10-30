# Changelog

Versions are named from the state of `main`. Commit trailers and tool history: docs/MILESTONE_2.md.

## 0.2.0: the fun update (2026-10-30)
Owner request 2026-10-30: "make it a LOT more fun and awesome", after reading Simon Willison's account of doing exactly that to a vibe-coded
game. Diagnosis, design, tunables, risks and what to play first: `docs/FUN_UPDATE.md`. The owner lifted the feature freeze for this pass; the
conditions of AGENTS.md (touch binding or none needed, AI default, help line) are met and tabulated there.

- **Feel pack** (`src/62_juice.js`): hitmarkers (shield / armour / hull / subsystem / kill), directional damage arcs, kill banners, chain multiplier
  (x1 to x4), style bonuses, hit-stop, medals, sounds; mouse sensitivity and invert Y in OPTIONS; `ship.mod` multiplier table.
- **Salvage pods** (`src/63_loot.js`): shield, hull, missile, ammo and overdrive pods dropped by kills (pity timer, magnet, radar and HUD markers).
- **GAUNTLET survival mode** (`src/74_survival.js`): wave director with events, named aces and bosses every 5th wave, perk draft (17 perks), 5 mutators,
  daily seed, career rank, records. Main menu entry; `?sv=1` URL form.
- **Difficulty** EASY / NORMAL / HARD / ACE on every mission briefing and in Gauntlet (NORMAL = as authored).
- **Missions:** wing strip HUD, objective counters `[3/7]`, four onboarding tips in mission 1 (first launch only), style and career in the debrief.
- **Version:** `GAME_VERSION` 0.2.0 on the menu, options and credits; tag `v0.1` marks the baseline.
- **Tests:** `fun_t.py` (feel, shot, loot, survival, missions), `sv_calib.py`; `menu_t.py` updated for the new menu entry.
- **Verified (headless, software renderer):** suite1 13/13 URL cases no console errors, build lint, pause (p0_t), menu_t 0 failures, coms_t, campaign_t,
  fix_t, dmgmap_t, beam_vis_t, fun_t all groups OK. **Not verified:** any hand-play, real-device frame rate, phone readability of the new overlays beyond
  one 844x390 screenshot, balance of Gauntlet against a human (calibration with an AI proxy: wave 1 safe, wave 3 costs about a third of the hull, the first boss
  killed the proxy in 15/20 runs before a supply drop was added), the effect of pods on the campaign missions (tuned without them).

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

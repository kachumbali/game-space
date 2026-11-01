# Changelog

Versions are named from the state of `main`. Commit trailers and tool history: docs/MILESTONE_2.md.

## 0.3.0 (in progress): Armoury, plan in docs/PLAN_V03.md
- M3 missiles and torpedoes (docs/MISSILES_M3.md): fighter missiles are fragmentation warheads (light/medium fighters die to 1-2 hits, heavies to about 3, still evadable); torpedoes carry a tandem warhead (precursor collapses the struck shield facet for 3-3.75 s, main charge goes to the hull; 7-9 torpedoes kill an Exeter, 3 a corvette); missile blasts no longer miss big hulls nose-on; bombers fire salvos of 3 and hold the rest. Tandem fields on the Gemini torpedo marks.
- Bittern carries 12 torpedoes (owner decision: it is the torpedo bomber). Key **U** (touch: **TUR**) makes your turrets hold fire to save energy and drum rounds; the weapon panel shows `PD ... HOLD (U)`. AI turrets are unaffected. Test: `tools/tests/turret_hold_t.py`.
- Merged: M1 balance harness + baseline (`tools/tests/ttk_matrix.py`), M5 subsystem damage effects (`src/51_subsys.js`), `?db=data/db.json` runtime override + `tuning` section, Marks I-IV schema (scaffolding only: `kestrel_2`).
- M0 opsec: the owner's real name is gone from code and docs (handle `kachumbali`); the player pilot is Lt. Tom Cat, callsign MEOW; `tools/check_opsec.py` runs in CI.

- Fix (owner report: Bittern turrets fired for free): kinetic PD now costs capacitor energy per round (`weapons.pd.energy`, 3.0) on top of its drum, every projectile turret with an `energy` value is charged the same way, per-turret drum size is settable in the ship's turret entry (Bittern 300 rounds), and the weapon panel shows `PD xN %`. Retuning of the numbers belongs to M2.

- Fix: the weapon panel is built from the ship's own gun mounts (it was hard-coded for the Kestrel, so the Bittern showed a cannon and MD-9 mag it does not have); the Bittern now starts with its torpedo selected.

## 0.2.3: Tern and Bittern selectable (2026-11-01)
- Skirmish setup (and `?sk_ship=`) now offers BITTERN (torpedo bomber) and TERN (unarmed resupply shuttle) as your ship; the Bittern can also be a wingman. Mission briefings show their loadouts.
- Test: flown in skirmish headless (Bittern fires, Tern flies unarmed); menu_t 0 failures. Not hand-played.

## 0.2.2: pause menu with exit (2026-10-30)
Owner request: the ESC pause menu must also offer exit mission / back to menu.
- **ESC (touch: the II button, now visible top-left; RAD moved beside it) opens a PAUSE MENU:** RESUME, RESTART..., OPTIONS, and EXIT MISSION / EXIT SKIRMISH /
  END RUN (Gauntlet: ends the run with its debrief, score kept) / EXIT TO MENU (free flight). Exit needs a second click within 4 s (progress is lost).
  Exiting a mission restores the wing's roster. Arrow keys/Enter work on the buttons; Space, Z etc. do nothing while paused.
- Losing the mouse lock (the browser's own Esc) pauses automatically; the Esc of that same key press is ignored. Test: `tools/tests/pause_t.py`.
- Not verified: hand-play feel; phone placement checked at 844x390 only.

## 0.2.1: SIM flight option (2026-10-30)
Owner request: "I would like it to still fly sim like TIE Fighter, at least as an option." Arcade stays the default.
- **Flight models are now ARCADE / SIM (TIE) / NEWTONIAN** (F cycles; also OPTIONS, the mission briefing, the skirmish setup; the choice is remembered).
  SIM: speed follows the throttle at the ship's real acceleration (a throttle slam takes seconds, braking is 1.5x quicker than accelerating), and the velocity
  vector trails the nose at 2.2 rad per sim-second, so a hard turn at speed skids briefly before the ship flies where it points (90 degrees: 52 degrees of
  skid after 0.3 s, caught up by 0.7 s). No strafing, no coasting. The AI flies the same rules while SIM is on. HUD shows the VEL marker in SIM.
- **Match target speed:** BACKSPACE (touch: double-tap the throttle slider), arcade and SIM.
- **Sim purist** (OPTIONS): hides hit markers, damage arcs, kill banners and chain readout, and turns off pods and hit-stop; the score is still counted for the debrief.
- OPTIONS panel scrolls on small screens (it had outgrown a 390 px phone). Test: `tools/tests/sim_t.py`.
- Not verified: how SIM feels (the 2.2 rad/s slew and the acceleration are first guesses, tunable in `SIMF`), SIM balance against the AI (only a finite-run dogfight check).

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

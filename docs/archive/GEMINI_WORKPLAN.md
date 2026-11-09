# Work plan for Gemini (GitHub-driven, free tier)

Purpose: tasks a smaller model can do safely **in parallel** with the engine work, working through GitHub (pull requests, CI as the safety net).
Rule of thumb: Gemini edits **data, text and docs**; the engine (`src/*.js`) stays with the main developer unless a task says otherwise.

## How Gemini should work
1. Read `AGENTS.md`, then this file, then only the files named in the task card.
2. One task = one branch `gemini/<task-id>` = one pull request into `main`. Never push to `main`, never force push.
3. Never edit `index.html` (generated). After any change in `src/*` or `data/db.json` run `python3 build.py`, `python3 tools/validate_db.py`, `python3 tools/check_opsec.py`; all must pass. CI runs the same.
4. No real person names or email addresses anywhere (the opsec check enforces it). The owner's handle is `kachumbali`. The player pilot is Lt. Tom Cat, callsign MEOW.
5. Balance numbers live only in `data/db.json` (see `docs/DATABASE.md`; `?db=data/db.json` lets you test a number without rebuilding when the repo is served with `python3 -m http.server`).
6. Say in the PR what was verified and what was not. Do not claim a balance result without the harness (`tools/tests/ttk_matrix.py`, see `docs/BALANCE_BASELINE.md`).

## Task cards (independent, ordered by value)
| ID | Task | Files | Done when |
|---|---|---|---|
| G1 | Author **Marks II-IV** for every fighter and bomber (Kestrel, Merlin, Bittern; shuttle optional) in the schema of `docs/MARKS_SCHEMA.md`. Each step +8-12% in that system's lane only, a small cost elsewhere; keep `kestrel_2` as the model. Same for the torpedo and fighter-missile entries (torpedo: +8-12% range per mark, slightly better speed and durability). | `data/db.json` | `validate_db.py` passes with the new marks; table of deltas in the PR |
| G2 | **Prologue campaign text** (4 missions: customs inspection, blockade, ambush, the first FROGG contact), in the style of `docs/CAMPAIGN.md`: briefing, objectives (use only existing objective types), enemy groups from existing ships, debriefs for win/lose, comm lines. Pilot: Lt. Tom Cat (MEOW). | new `docs/CAMPAIGN_PROLOGUE.md` | each mission has briefing, objectives, groups, debriefs, and a list of anything that needs engine work, tagged `[NEEDS CODE]` |
| G3 | **Long Retreat** mission drafts (evacuation arc, unknown enemy that becomes known, liners with jump spool, scarce warheads) from `docs/LORE_*.md`. Intel ladder: what the player knows after each mission. | new `docs/CAMPAIGN_RETREAT.md` | same checklist as G2 |
| G4 | **Doc sync**: regenerate `docs/data/weapons.csv` and tables in `docs/WEAPONS.md` / `docs/SHIPS.md` from the db (`python3 tools/export_db.py`), list any doc statements that contradict the db. | `docs/*`, `docs/data/*` | no contradictions left, or listed as questions |
| G5 | **Briefing loadout lines** for every playable ship (the `LOADOUTS` table in `showBriefing`, `src/75_mission.js`), generated from the db so they cannot drift. Text only; if it needs a function, keep it under 30 lines. | `src/75_mission.js` | test `tools/tests/menu_t.py` unchanged, briefings render for all ships |
| G6 | **Faction ship and weapon naming** pass: names, roles and one-line descriptions for ECU / VAC / VBC variants (names only, no stats) for the roster in `docs/PLAN_V03.md` M4. | new `docs/ROSTER_NAMES.md` | each name unique, consistent with `docs/LORE_FACTIONS.md` |

## Not for Gemini (needs the main developer, tests or hand-play)
Weapon and missile retuning (needs the 45-minute seeded harness), anything in `src/60_weapons.js`, `65_combat.js`, `70_ai.js`, `85_update.js`, mission scripting that needs new objective types, and anything that changes controls.

## Review
The owner or the main developer reviews each PR. Merge only when CI is green. A PR that touches `index.html` by hand, adds a name or email, or changes balance numbers without the harness is rejected.

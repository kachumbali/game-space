# Codex briefs, round 2 (2026-11-10)

Read `AGENTS.md` and `docs/ROADMAP.md` first. Same rules as round 1: one branch per job, commit and push after each part, `tools/gate.py` green
before every push, handle-only git identity, never push to `main`, say what was not verified. Do the jobs in this order; each is independent.
The demo goal has not changed: a friend finishes the four Prologue missions unaided on desktop or iPad. The owner has 1-2 hours a week to play.

## Job A: playtest report (branch `codex/playtest-report`)
Why: the owner's play time is the scarcest input, and today nothing of a session survives except memory.
1. At every debrief (win, lose, exit to menu) build a compact report from data the game already tracks: build id and version, device class
   (desktop / touch, viewport), campaign and mission id, difficulty, flight model, controls mode, result, time flown, the death cause line,
   kills, shots and hits per weapon, missiles fired / hit / decoyed, damage taken by source class, lowest shield and hull, subsystems lost,
   wingmen status, tutorial steps completed or timed out, average and worst frame time (see Job B), and the last 20 log lines.
2. A **COPY REPORT** button on the debrief and in the pause menu puts it on the clipboard as plain text (short, readable, under 60 lines) and
   offers a download on iPad where the clipboard is refused. A free-text "what annoyed you" box (optional) is included in the report.
3. Reports of the last 10 sessions are kept in localStorage and can be exported together.
4. No network calls, nothing leaves the device unless the owner pastes it. Touch parity, a help-overlay line, `tools/tests/report_t.py`.

## Job B: real-GPU performance pass (branch `codex/perf`)
Why: every number so far comes from a software renderer; the owner's checklist already flags stutter in the HECLA encounter.
1. Add a frame-time recorder (average, 95th percentile, worst, per 10 s window) behind `?fps` and feeding Job A's report.
2. On the Mac's real GPU (headed Chrome, not SwiftShader) measure the four Prologue missions, the heaviest Long Retreat mission and the HECLA
   skirmish at desktop 1440x900 and iPad-sized 1180x820, default quality. Write `docs/PERF_REPORT.md` with the numbers and the top five costs
   (draw calls, voxel instance counts per ship, particle counts, overlay canvas, garbage per frame).
3. Fix what is cheap and safe (object reuse in hot loops, culling, LOD thresholds, overlay redraw rate). Target: no 10 s window under 45 fps
   in the Prologue on the Mac; report honestly where that is missed. No visual redesign, no gameplay change, no balance numbers.
4. An iPad cannot be measured from the Mac: say so, and give the owner a two-minute procedure (`?fps`, which screen to photograph).

## Job C: Prologue flow (branch `codex/prologue-flow`)
Why: four missions must read as one short story, not four menu entries.
1. A CONTINUE entry on the main menu that resumes the Prologue at the next unfinished mission; a clear "mission n of 4" on the briefing.
2. After a win: debrief, then straight to the next briefing with one button; after mission 4 an ending card ("to be continued") with the
   session's totals and COPY REPORT, then the main menu with the other campaigns unlocked and labelled as unpolished.
3. Each mission teaches at most one new thing with the round-1 tutorial panel (p02: wingman orders through the comms menu; p03: power
   allocation; p04: subsystem targeting), skippable, shown once. The basic control mode reveals that one control when it is taught.
4. Hooks, not content: `beforeMission` / `afterMission` scene ids per Prologue mission that play through the existing scene player
   (`src/81_scene.js`) when the scene exists and are skipped silently when it does not. Job D supplies the scenes.

## Job D (design, no engine code): the Prologue presentation (branch `codex/prologue-presentation`)
Direction proposed by the lead: **narrow and deep.** Stop designing the 16-mission spine, interiors for every deck and the wider cast for now;
design everything a player sees *between* the four Prologue missions, to a level where it can be built in one week with assets that can
actually be produced. The reference is Wing Commander II's rhythm: a place, two faces, a text box, consequences of what just happened.
Deliver `docs/DESIGN_PROLOGUE_PRESENTATION.md` with:
1. **One hub screen** (the ready room, in the chosen Direction C style, `docs/DESIGN_CUTSCENE_STYLE.md`): what is on it, what is clickable
   (briefing, roster, continue), how it looks on desktop and iPad landscape. One room, not a carrier.
2. **Scene scripts**: for each mission one short scene before (20-40 s) and one after for win and for lose, as `scene.json` drafts in the
   existing format (see `assets/scenes/intro_test/scene.json`), text only (no voice), using only the three existing heads plus at most two new
   ones. Lines must react to state the game has (who was lost, grade, the death cause). Keep the existing mission briefings as the facts.
3. **A 30-second opening** for the demo (backlog item 2: what this game is, tone tongue-in-cheek but dry) and the ending card.
4. **The exact asset list** with sizes and prompts per `docs/CUTSCENE_ART_PROMPTS.md`, split into "must have for the demo" (target: at most
   12 images) and "nice to have", and which existing files are reused.
5. **A build plan**: which parts are data only, which need code (referencing Job C's hooks), and what is deliberately left out.
No new mechanics, no new ships, no balance. Mark every invention that is not in the lore docs as [NEW]. The owner decides before anything is built.

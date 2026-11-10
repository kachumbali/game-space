# Prologue flow

The main menu's **CONTINUE PROLOGUE** opens the first mission without a recorded victory. Victories are kept locally under `gs_prologue_progress`; a loss, partial result, or exit does not advance it. The briefing shows the mission number. **NEW CAMPAIGN** from a Prologue briefing resets Prologue victories and this page's session totals, along with the existing crew reset. The three lesson-completion flags remain separate and are shown once per browser; `?tutorial=1` forces a replay for testing.

The victory debrief leads to the next briefing. After mission 4 it leads to a **TO BE CONTINUED** card with this browser page's sortie, victory, kill and in-game mission-time totals. The card can copy or download a report; when the independent playtest-report branch is present it uses that report and appends the totals, otherwise it supplies a compact local fallback. Finishing mission 4 unlocks the other campaign entries and labels them **UNPOLISHED**. Skirmish, Gauntlet, Free Flight and Shipyard remain available. No report is transmitted by the flow.

The round-one panel teaches one extra control in each later mission: wingman orders in mission 2, power allocation in mission 3, subsystem selection in mission 4. Each lesson can be skipped and times out rather than blocking the mission indefinitely. In basic mode, the taught control becomes visible when introduced and remains visible; the player can still switch modes in the help panel. Mission 4 uses the existing noncombat practice-target mechanism and removes the target afterward.

## Optional scene assets

Each Prologue mission has `beforeMission` and `afterMission` IDs. For mission `p01`, for example, add `assets/scenes/p01_before/scene.json`, `assets/scenes/p01_after_win/scene.json`, and/or `assets/scenes/p01_after_lose/scene.json` in the existing scene-player format; the same pattern applies to `p02`–`p04`. A partial result uses the lose hook. Before scenes play before the briefing; after scenes play before the debrief. Scene skip and normal end resume the pending flow. No scene content is supplied by this change.

`build.py` embeds the IDs of scene directories that contain `scene.json`; rebuild after adding or removing a scene. A missing ID is skipped without an asset request. If an indexed scene cannot be read or parsed, the pending flow resumes. `?go` still launches after an optional before-scene completes. The normal intro scene retains its existing fallback behavior.

Run `python3 build.py`, `python3 tools/tests/prologue_flow_t.py`, `python3 tools/tests/tutorial_t.py`, and `python3 tools/gate.py`. The browser tests use desktop and iPad-sized touch viewports; they are not physical-device playtests.

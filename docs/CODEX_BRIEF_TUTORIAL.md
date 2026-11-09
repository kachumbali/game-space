# Codex brief: in-game tutorial and simple controls for Prologue mission 1

Read `AGENTS.md` and `docs/ROADMAP.md` first. Work on branch `codex/tutorial`; do not push to `main`; `git config user.name kachumbali` and the
noreply address before the first commit (the gate rejects other authors). Finish with `python3 tools/gate.py` green and a short report.

## Why
The demo is done when a friend plays the Prologue unaided. Today the game has well over 30 key bindings and four one-off CONTROL lines; the
owner died in every Prologue mission. Targets: desktop (mouse + keyboard) and iPad (touch). No gamepad, no phone work.

## What to build
1. **A guided opening for mission `p01`** (CONTRABAND SUN, `src/75_mission.js`): before the first enemies arrive, a sequence of short steps that
   each wait for the player to actually do the thing, then confirm it: look around (stick), throttle, target (T / TGT), fire guns, lock and fire
   a missile, flares when locked, afterburner, read shields and hull. One instruction on screen at a time, with the key and the touch button
   named for the device in use. A step that is not done after about 20 s repeats once, then moves on (never a soft lock).
   It must be skippable (one key / one tap, and never shown again once completed or skipped; `?tutorial=1` forces it for tests).
2. **A "basic" control mode, on by default for a first-time player**: only the bindings the tutorial teaches are advertised (HUD hints and the
   help overlay show the short list first, the full key map behind "ADVANCED"). Nothing is removed: every existing key keeps working, power
   allocation and the rest simply are not mentioned until the player opens ADVANCED or finishes the Prologue. Stored in localStorage.
3. **A gentler start for `p01` on NORMAL**, by data only (enemy count / pilot skill / spawn delay in the mission data): the tutorial fight
   should be winnable by someone who has just learned the keys. Do not change weapon or ship numbers (`data/db.json` balance is the lead's).
4. **Failure feedback**: when the player dies in the Prologue, the debrief names the likely cause in one line (shields down and no evasive
   action, missile hit without flares, flew into capital-ship fire, collision) from data the game already tracks, plus a RETRY button.

## Rules
- Edit `src/*` only; never `index.html` by hand; `python3 build.py` after changes. One shared module scope: no duplicate top-level names.
- Touch parity for everything new; iPad landscape (1180x820) must fit. A line in the help overlay for the tutorial and the basic mode.
- Tests: `tools/tests/tutorial_t.py` (each step advances on the real input, timeout path, skip, never shown twice, iPad viewport, no console
  errors) and the gate. Say plainly what was not verified; nothing here can be judged for feel without the owner's hand-play.
- Out of scope: new ships or weapons, balance numbers, other missions, cutscenes, gamepad.

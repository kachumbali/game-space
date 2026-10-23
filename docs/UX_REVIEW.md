# Red-team review: gaming UX and balance (2026-10-22)

Method: code inventory of the player-facing surface (HUD, input, menus, onboarding, feedback; line
references below) plus fresh headless balance simulations on the current build (`2d6800b`; harness
`tools/tests/duel2.py`, Newtonian variant `tools/tests/duel2n.py`, capital engagement
`tools/tests/bullfrog_eng.py`; Chromium/SwiftShader). Nothing in this review was verified by human
play. Sim numbers are AI-vs-AI, 3-5 runs per cell: direction, not statistics.

## 1. Balance simulation results (current build)

4 Kestrels (skill 3) vs N FROGG fighters (mixed Darter/Leaper/Spitter, skill 3):

| Flight model | N | Human wins | Notes |
|---|---|---|---|
| arcade | 6 | 5/5 | |
| arcade | 8 | 2/8 (pooled 2×3-run + 5-run batches) | one batch 0/5 clean; survivors often mauled |
| arcade | 10 | 0/8 | |
| arcade | 12 | 1/3 | the one human win: 3 Kestrels left at the 300-step limit |
| arcade | 14 | 0/3 | |
| Newtonian (both sides) | 4 | 3/5 | |
| Newtonian (both sides) | 6 | 0/5 | |
| Newtonian (both sides) | 8 | 0/5 | |

Reading:

- **The even point has drifted down to about 6-7 FROGGs in arcade** - the last recorded point was
  11-12 (docs/BALANCE_TESTS.md, 2026-10-22 earlier same day). The intervening commits (FROGG
  laser/missile buffs, turret class S/M/L corrections) were not re-measured until now. Mission wave
  sizes tuned against the old numbers will play noticeably harder than designed.
- The cliff is steep: 6 FROGGs = safe, 10 = certain loss. Mission difficulty is a switch, not a
  slope; wave sizes must be chosen per the new even point.
- **Newtonian flight is near-unwinnable at equal counts** (0/5 at 6). The open question "should
  Newtonian be the intended default difficulty" (docs/OPEN_QUESTIONS.md A8) - the evidence says no,
  keep it optional.

Bullfrog acceptance engagement (`bullfrog_eng.py`, seed 1: Exeter + 12 Kestrels + 2 Halberds vs
Bullfrog + hangar, 10 km): **human win in 291 s**. Bullfrog destroyed (Exeter rail credited), all
36 FROGG fighters destroyed, both Halberds undamaged, 8 of 12 human fighters lost, Exeter ends at
15% structure. Spine fired twice, hit Exeter twice, did not kill. Notable: 7 Tadpole torpedoes
launched, **0 intercepted by point defence, all 7 hit**. Two flags: PD never intercepts Tadpoles
(unchecked whether by design - see docs/BULLFROG.md), and the spine cannot finish a heavily damaged
frigate, so the player is never under time pressure once the FROGG fighter screen is gone.

## 2. Red-team findings, by severity

### P0 - trust breakers

**R1. "PAUSED" is a lie; the sim never pauses.** The `#msg` overlay says "PAUSED - touch to take
controls" (`src/90_hud.js:~488-493`) but the update loop has no paused branch (`src/85_update.js:100+`);
losing pointer lock or putting the phone down mid-mission means the AI keeps shooting you. The
headless hooks already have `__game.__paused`. A phone call or notification during mission 2 will
kill the player with no recourse. This is the single worst UX defect found.

**R2. Touch players get zero documentation.** The H help overlay is a keyboard map only
(`index.html:248`); the briefing keys-hint line is `display:none` under 520 px (`index.html:96`);
no screen explains the 14 touch buttons (AIM-T, SUB, WPN, etc. - `src/80_input.js:110-162`). The
companion claim "ours is better on touch" (docs/TIE_FIGHTER_COMPARISON.md:41) holds for controls,
not for teachability.

**R3. Lock state is invisible text-wise on all touch devices.** `#wpn` (lock line: LOCKED /
LOCKING n% / OUT OF RANGE / SEEKING / NO TARGET, `src/90_hud.js:208-209`) is
`display:none!important` on every touch layout (`index.html:~108`). A touch player who taps MSL and
nothing happens gets no reason. The ring/tone carry this only if you already know the system.

### P1 - onboarding and feel

**R4. No tutorial of any kind.** First-time teaching is prose briefing + diegetic CONTROL chatter
(`src/75_mission.js:44-50,64-110`). The systems that need it most (lock cone, flares-vs-IR vs
radar, ETS power, subsystem targeting) are explained only in the H prose legend.

**R5. Mouse stick: fixed sensitivity, no invert option.** Accumulating relative stick at ×0.003
(`src/80_input.js:106-107`), no setting anywhere. Sensitivity and invert-Y are the two options
every flight player looks for first.

**R6. No directional damage indication.** The red vignette is omnidirectional
(`index.html:~35`, `src/85_update.js:103`); in 3D you cannot tell where fire is coming from or who
is on your six. Radar helps only if you know to look and can read it fast.

**R7. Weak positive feedback for regular hits.** Hull hits have no visual hitmarker; subsystem
zones flash (0.35 s, `src/90_hud.js:~366-367`) only when you are subsystem-targeting at <2.5 km.
Kill confirmation is chatter + a counter. Gun duels at range feel like shooting into a void.

**R8. Difficulty is a cliff and has no dial.** No difficulty setting in missions (single tuning,
docs/TIE_FIGHTER_COMPARISON.md:37), and section 1 above shows the outcome flips fully between 6 and
10 FROGGs. Combined with the undocumented drift, missions are harder than their design point and
the player has no lever.

### P2 - consistency and polish

**R9. Key overloads that can bite.** Digits 1-9 switch weapons/power in flight but select comms
entries while the J menu is open (`src/78_coms.js:~192-199` vs `src/80_input.js:79-83`) - an
intentional context switch, but nothing on screen says "1 now means wingman 1". Enter fires a
missile whenever the player object exists (`src/80_input.js:78`), which can collide with
menu-confirm handling (`src/76_menu.js:100-115`) - unverified whether a missile launches when
confirming a menu with Enter; check it. M is mute in flight but "RESTART MISSION" in the dialog
(`src/80_input.js:~240`).

**R10. Wingman/fleet state is hidden behind the comms menu.** Hull % and orders only visible inside
J (`src/78_coms.js:91-106`), which auto-closes after 12 s. You cannot glance at how HAWK is doing.

**R11. Objectives have no counters or progress.** Bare ✔/✘/▸ list (`src/90_hud.js:175-181`) - the
FS2 doc flagged this on 2026-10-21 and it still stands.

**R12. Phone readability is unverified and risky by construction.** 8 px HUD text, 108 px radar,
0.68-scaled buttons (`index.html:112-123`); canvas text floors at 8 px after `Math.round(10*0.78)`
(`src/90_hud.js:~326`). Also touch has no binding for radar range (K), flight model (F), or restart
(R) mid-flight.

**R13. Stale self-assessment docs.** docs/FREESPACE2_COMPARISON.md still lists "no command layer"
for wingman orders that now exist (`src/78_coms.js`); power allocation likewise. Refresh before
using these docs for planning.

## 3. Suggestions (what to adopt)

Ordered by player impact per unit of effort. None of these change the flight or damage model
except S4.

1. **S1 - Real pause** (fixes R1): when `#msg` overlay is up in state `play`, freeze the sim (the
   `__paused` mechanism exists; add an overlay-driven gate in `85_update.js`). Desktop pause key
   (Esc already exits pointer lock - reuse that; Esc again to resume). Acceptance: suite1, m2full,
   and a new check that ships hold position while the overlay is up.
2. **S2 - Touch parity pack** (R2, R3, R12): lock-status chip near the radar on touch; a short
   touch-button legend (first-launch overlay + accessible from OPTIONS); touch buttons for radar
   range. Acceptance: menu_t phone layouts + screenshot pass at 390x844.
3. **S3 - Feel pack** (R5, R6, R7): mouse sensitivity + invert-Y in OPTIONS (localStorage, like
   AOPT); directional hit arc around the reticle; small hitmarker on hull hits and a one-shot tick
   on the target bracket at kill. Acceptance: screenshots + no perf regression (one overlay
   canvas pass).
4. **S4 - Balance and difficulty** (R8 + section 1): re-tune mission wave sizes against the new
   even point (~6-7 arcade, ~4 Newtonian); add a difficulty selector to the briefing (maps to
   enemy/wingman SKILL, missile on/off); decide "no" on Newtonian-as-default (or gate it to a
   second playthrough). Fix or consciously accept the Tadpole-vs-PD interception (0/7). Acceptance:
   duel2/duel2n grids in BALANCE_TESTS.md, bot2 + m2full green, owner play log.
5. **S5 - Onboarding beats in mission 1** (R4): 3-4 diegetic CONTROL lines gated to first launch
   only (throttle -> guns -> lock cone -> flares), timed to the first wave's approach; not a
   tutorial mission, no new UI. Acceptance: m1 headless run shows each line once; repeatability
   via localStorage.
6. **S6 - Menu/consistency sweep** (R9, R10, R11, R13): verify and fix Enter-while-in-menu; label
   the digit keys inside the comms menu ("1-7 select"); persistent mini wing strip (2 chips) near
   the comm feed; objective counters where stages have counts; refresh the two comparison docs.

## 4. Workplan for adoption

Status 2026-10-22 (p0-fixes branch): **S1 done** (real pause: Esc + touch II button + overlay; the frame loop gates on userPause - p0_t verifies a real-time freeze). **S2 done** (lock-status chip beside the radar, RAD touch button, touch legend in the help overlay). **S4 partially done**: the PD-vs-torpedo hole is fixed with swept, proximity-burst flak (p0_t: 4 of 4 intercepted, was 0 of 7); difficulty selector and mission-wave retune still open, now blocked on the owner's iPad playtest per the freeze rule. Balance harness is seeded (`?seed=`), 20-run cells are the standard.

Sessions are sized to one build + test + push each. S1 and S2 first because they change what the
owner's next device test should cover.

| Order | Session | Files touched | Depends on |
|---|---|---|---|
| 1 | S1 pause | 85_update.js, 90_hud.js, 80_input.js | - |
| 2 | S2 touch parity | 90_hud.js, 80_input.js, 00_head.html, 13_music.js (options panel) | - |
| 3 | S4 balance + difficulty | 75_mission.js, 30/31_ships, 70_ai.js, BALANCE_TESTS.md | fresh duel grid (this doc section 1) |
| 4 | S3 feel pack | 80_input.js, 90_hud.js, 85_update.js, options | S1 (overlay work) |
| 5 | S5 onboarding beats | 75_mission.js | S2 (touch legend wording) |
| 6 | S6 consistency sweep | 76_menu.js, 78_coms.js, 90_hud.js, comparison docs | all above |

Before each session: rebuild, suite1, then the session's acceptance tests. After S4 the owner
should re-run the device/perf pass with the new tuning and a play log (L key).

Deliberately not suggested: floating damage numbers (wrong genre register), auto-centering mouse
stick by default (changes feel for existing players - offer as option only), and any new
before-mission UI beyond the difficulty selector (the briefing prose is part of the game's
identity).

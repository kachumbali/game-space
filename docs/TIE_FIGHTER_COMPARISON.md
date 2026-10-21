# TIE Fighter (1994) as UX baseline — comparison with game-space

Status: build of 2026-10-21 (Lilypad, Reedbed). Sober assessment; no sycophancy intended.

## Method and sources
Baseline facts marked **[W]** come from the Wikipedia article on *Star Wars: TIE Fighter*
(https://en.wikipedia.org/wiki/Star_Wars:_TIE_Fighter, retrieved 2026-10-21). Facts marked **[M]** are from
general knowledge of the game (default key bindings, exact HUD layout, CMD/Shift-key power presets) and were
**not verified** in this session; check against the manual before acting on them. Statements about
game-space come from the repo. No playtest data beyond the owner's informal feedback and headless bot runs.

## Comparison

| Area | TIE Fighter | game-space now | Gap |
|---|---|---|---|
| Flight model | Newtonian-lite, speed-capped, throttle-based, no drift [M] | Arcade model with vacuum missiles/decoys; fighters turn fast (x2.85) | Comparable in feel; ours lacks a power-allocation trade-off |
| Power management | Split power among weapons, engines, shields; front/rear shield split; shields drain on hits [W] | Shields fore/aft exist, weapon energy (PLS) exists, boost/afterburner; no player allocation | **Large**: no engine/shield/laser decision loop |
| Damage model | Systems (engines, targeting computer) can be knocked out, slow player-ordered repair; cockpit displays can break [W] | Armour sectors, structure, subsystem components on enemies; player takes generic hull damage | **Large** on the player side: no degraded systems or repair |
| Weapons | Lasers (linked/alternating firing), ion cannons to disable, limited missiles/torpedoes [W] | Guns, plasma bolter, rail, missiles (IR/RF/tick/torp/TAD), decoys | We have more variety; no disable-not-destroy weapon, no fire-link modes |
| Targeting | Component targeting on capital ships/stations; 3D target model display [W] | Subsystem cycling (N / SUB), HUD hit-zone markers, pipper at component, target panel with status | Near parity; add a rotating 3D target wireframe |
| Mission structure | Briefing with animated map + Q&A; primary, secondary, secret objectives; success if primaries done even if destroyed [W] | Briefing text, staged objectives, transits with flyby cutscenes (multi-area), grades | Ours is linear stages; no secondary/bonus objectives, no map briefing |
| Mission variety | Dogfight, escort, disable, inspect, capital/station attack [W] | Dogfight, defend, capital strike, nav points | Missing: inspect/disable/escort variety |
| Campaign | 13 tours, 4–8 missions each; promotions, medals; combat chamber; recordings [W] | 2 missions, mission select, grades, no persistence yet | **Large** (expected at this stage) |
| Comms and story | In-flight messages, cutscenes, Inner Circle second briefing [W] | Comm lines, flyby cinematics; crew/LLM dialogue only planned | Planned in VISION.md |
| Difficulty | Not discussed in [W]; original had selectable levels [M] | Single tuning; speed via `?speed=` | Add difficulty select |
| Controls | Keyboard/joystick, many keys [M] | Mouse/keys + full touch UI | Ours is better on touch; TIE's depth is in keys |

## Assessment
game-space is ahead on **visual presentation and weapon variety** and roughly level on **component
targeting**. It is clearly behind on the three things that define TIE Fighter's loop:
1. **Moment-to-moment resource decisions** (power split, shield facing, repair).
2. **Mission objective layering** (primary/secondary/secret, outcome independent of survival).
3. **Campaign wrapper** (promotion, medals, persistent record).
Without (1) the dogfight is aim-and-evade only; the owner's earlier observation that damage was not felt is
partly this: nothing the player does in response to damage matters.

## Prioritised improvements
Effort: S ≤ 0.5 day, M ≈ 1–2 days, L > 2 days.

1. **Power allocation (M).** Three-way split guns/engines/shields with quick presets and HUD bars; ties into
   the existing PLS energy and the pending afterburner-fuel item (A5). Highest gameplay value.
2. **Player system damage (M).** Hits can disable engine (speed cap), guns (reduced energy), radar/target
   computer, with slow repair queue the player orders. Reuses enemy component code.
3. **Layered objectives (S–M).** Primary/secondary/bonus flags in mission data; debrief grades from them;
   win if primaries done even if player dies (TIE rule [W]).
4. **Ion/disable weapon (S).** Disables enemy components and capitals without killing; enables
   capture/inspect missions.
5. **Mission verbs (M).** Escort, inspect-cargo (close approach + hold), disable-and-capture. Cheap on the
   current stage engine.
6. **Briefing map (M).** Animated 3D/2D map of start positions and routes from the existing mission data;
   optional Q&A lines.
7. **Persistence and progression (M).** localStorage record: kills, grades, promotion rank; mission unlock.
8. **Target hologram (S).** Rotating wireframe of the target with damaged components highlighted.
9. **Fire-link modes (S).** Linked/alternating guns, with energy cost differences.
10. **Combat chamber / replay (L).** Extra missions per craft; recording of runs. Defer.

## Phone UX (this iteration)
`body.phone` class (touch and shorter side < 520 px) reduces HUD fonts to ~8 px, radar to 108 px and scales
touch buttons to 0.68. iPad layout unchanged. Checked only in headless Chromium at 844×390; needs real-device
confirmation.

## Caveats
- Comparison is against the 1994 design as described in [W]; remastered/Collector's CD differences ignored.
- Effort estimates are guesses, not measured.

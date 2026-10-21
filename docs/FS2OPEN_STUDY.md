# FS2 Open (SCP) source study: what to borrow for game-space

Repository: https://github.com/scp-fs2open/fs2open.github.com, shallow clone at commit `76219fd` (2026-10-18),
read-only. Files read: `code/hud/hudets.cpp`, `code/ship/subsysdamage.h`, `code/ai/aigoals.h`,
`code/hud/hudsquadmsg.h`, `code/mission/missioncampaign.h`, `code/ai/aicode.cpp` (grep only), `Copying.md`.
Only the excerpts named below were read; this is **not** a full audit. Line counts: sexp.cpp ~43k, aigoals.cpp ~3k,
missioncampaign.cpp ~1.9k.

## Licence (matters for what we may copy)
`Copying.md`: original Volition code (1999) "may not sell or otherwise commercially exploit"; SCP modifications
before 2020-11-01 keep that restriction unless authors opted in; modifications from 2020-11-01 are Unlicense.
Practical rule: **take ideas and numbers as design reference, do not copy code**. Our engine is JS/Three.js anyway.

## Findings, with where they live

### 1. Power allocation (ETS), `hud/hudets.cpp`
- 13 discrete levels per system (`Energy_levels` = 0, 1/12 ... 1). Three systems (weapons, shields, engines);
  the three indices are constrained to sum to a fixed total (`sanity_check_ets_inputs`).
- Weapon and shield recharge = power factor x level x max capacity.
- Engine level maps linearly to **max speed**: 0 -> 0.5 x max speed, default level -> max speed,
  1.0 -> `max_overclocked_speed` (`ets_get_max_speed`). So engines are a speed/boost knob, not an on/off.
- AI ships rebalance ETS every 500 ms (`AI_MODIFY_ETS_INTERVAL`).
- Fits us: we already have `PLS` energy, shields with regen, boost. Add three levels summing to 12 (or 6 for a
  touch UI), engine level scales `maxSpeed` and boost energy, shield level scales `shieldRegen`, weapon level
  scales plasma recharge. Tiny data model, real decisions.

### 2. Subsystem thresholds, `ship/subsysdamage.h`
| Subsystem | Effect (strength fractions) |
|---|---|
| Engines | below 0.5 ships slow; never below 0.15 contribution unless destroyed |
| Weapons | >= 0.7 always fire; < 0.2 will not fire (probabilistic between) |
| Targeting sensors | no ill effect >= 0.3; targeting stops < 0.2 |
| Radar sensors | no ill effect >= 0.4; radar stops < 0.1 |
| Communications | < 0.3 blocks squadmate messaging; states destroyed/damaged/scrambled/ok |
| Navigation | < 0.3 blocks warp |
- Lesson: **graded degradation with thresholds**, not binary death. Our `comps` are close; give the player the same
  treatment (engine -> speed cap, gun -> fire failures, radar -> static and lost lock, comms -> no orders).

### 3. Squadron orders, `hud/hudsquadmsg.h`, `ai/aigoals.h`
- Player orders: attack target, disable, disarm, protect, ignore, formation, cover me, engage enemy, capture,
  rearm/repair me, depart. Which orders exist depends on **target ship type** via message masks (transports:
  attack/capture/depart; cruisers: attack/depart; capitals: depart only; support ships: rearm/repair, abort,
  stay near, keep safe distance, depart).
- Orders become **AI goals** (`AI_GOAL_*`: chase, chase_any, guard, destroy_subsystem, disable_ship, disarm_ship,
  evade, stay_near_ship, keep_safe_distance, rearm_repair, form_on_wing, warp, waypoints, ...). Orders and mission
  scripting use the same goal queue.
- Fits us: `70_ai.js` roles already exist; add `s.goal = {mode,target}` evaluated before default behaviour. First set:
  attack target, engage all, cover me (guard), disengage/depart, rearm. Order availability depends on comm health.
- **Disable and disarm** as goals matter for capture and strategy-layer salvage (below).

### 4. Support ship, `ai/aicode.cpp`
Rearm/repair is an AI mode with a support craft that docks, repairs subsystems and rearms; AI keeps team-wide
"good/bad time to rearm" timestamps. Not read in detail. For us: one callable tender per mission with a delay
and limited calls.

### 5. Campaign, `mission/missioncampaign.h`
Missions form a **graph** with SEXP-formula branches, loops and forks; goals, events and variables persist across
missions (`mission_campaign_store_goals_and_events_and_variables`); missions can be skipped (flag). Per-mission
"red alert" persistence of ship state also exists. Lesson: persistence is a typed store keyed by name, branching is
a boolean formula over stored facts, not hard-coded order.

### 6. Mission logic, `parse/sexp.cpp` (~43k lines)
A large expression language drives events and goals. We do not need it; a small `when(cond) -> actions` event
list on top of our stages would cover most cases, but expect it to grow.

## What not to copy
- Wide feature surface (beams, flak, subsystem-attached turrets with their own AI) before our voxel LOD allows it.
- Heavy scripting. Our single-file constraint favours JSON-like data and a few condition kinds.

## Caveats
- Behaviour was inferred from headers and selected functions; defaults (e.g. initial ETS index, retail power
  factor) were not checked. Verify before copying numbers.
- Retail FS2 behaviour can differ from the current engine because of AI profile flags (the code shows several).

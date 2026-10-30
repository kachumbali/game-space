# The fun update (v0.2.0), 2026-10-30

Owner request: read Simon Willison's "The October inflection point for vibe game development" and "make this game a lot more fun and awesome like
Simon describes." His method was one instruction ("Make it a LOT more fun") to a model that then did real game design. This update treats it
that way: a diagnosis first, then changes aimed at the diagnosis, then tests. **Whether it is actually more fun is not something a headless
test can say; the first thing to do is play it** (section 6).

## 1. Diagnosis: why the game was not fun yet

Evidence, in order of trust: the owner's play-test notes (OPEN_QUESTIONS 29, "capital lasers delete fighter wings"; "I take almost no damage"),
the red-team review (docs/UX_REVIEW.md R4-R11), the balance sweeps (docs/BALANCE_REPORT*.md). Not from hand-play by the author of this update.

| Problem | Evidence | Fix in this update |
|---|---|---|
| Shooting feels like shooting into a void | UX_REVIEW R7: no hit feedback, kill = chatter + a counter | hitmarkers (4 kinds), kill banners, chain, hit-stop, sounds (section 2.1) |
| You cannot tell where fire comes from | R6: omnidirectional red vignette | directional damage arcs round the reticle |
| Nothing to chase beyond "survive the mission" | no score loop, no unlocks, no reason to take risks | chain multiplier, style bonuses, medals, career rank, salvage pods |
| One difficulty, a cliff (6 FROGGs fine, 10 certain loss) | R8, BALANCE_REPORT | difficulty selector (EASY..ACE), a gentle wave ramp in Gauntlet |
| No replay value | 5 scripted missions, free flight is a test mode | Gauntlet: endless waves, aces, bosses, perks, mutators, daily seed |
| Wingmen are invisible | R10 | wing strip under the damage map |
| Objectives have no progress | R11 | `[3/7]` counters on kill objectives |
| New players are lost | R4: no tutorial | four CONTROL lines in mission 1, first launch only |
| Mouse feel | R5: fixed sensitivity, no invert | OPTIONS sliders |

Deliberately not done: floating damage numbers (UX_REVIEW says wrong genre register), auto-centring stick, any new before-mission UI beyond the
difficulty selector.

## 2. What was built

### 2.1 Feel pack (`src/62_juice.js`, hooks in 65_combat, 60_weapons, 85_update, 90_hud)
- `applyHit` is now `applyHitCore` plus a feel layer. The core returns what the hit did (`shield`, `armor`, `comp`, `hull`, `kill`); weapon code sets
  `hitSrc` / `hitKind` just before the call. Damage numbers are unchanged.
- Hitmarkers: four ticks round the reticle. White = hull, blue = shield absorbed, grey = armour absorbed, orange = subsystem, red + larger = kill.
- Damage arcs: a red (blue if only shields) arc on the side the shot came from, fading in 1.1 s.
- Kills: banner above the reticle (`+450 DARTER`, tags `QUAD KILL · MISSILE · POINT BLANK`), chain readout with a decay bar.
- Chain: kills within 6 sim-s (about 16 s real) extend it; score multiplier 1 + 0.5 per extra kill, cap x4. Style bonuses: missile kill +50%,
  fighter killed inside 150 m +25%, ace x5. Subsystem kills by you +40. Tunables: `FUN` in 62_juice.js.
- Hit-stop: the sim crawls (x0.08) for 50 ms real after a kill, 160 ms after a capital. Capital kills also shake the camera.
- Medals at every debrief: ACE (5 kills), CHAIN MASTER (chain 5), SHARPSHOOTER (35% on 40+ shots), UNTOUCHED, MISSILE MASTER, SURGEON, CAPITAL BREAKER,
  ACE HUNTER, WING LEADER.
- Sounds: hit tick (shield variant), kill ding that rises with the chain, subsystem pop, pickup, perk fanfare, wave horn, ace sting (existing synth).
- OPTIONS: mouse sensitivity (30-250%) and invert Y.
- `ship.mod`: a table of multipliers (`dmg rof eff shield shieldCap energy ab speed turn lock take drop magnet score chainT`) read at the relevant
  places in weapons, regen, flight and `applyHit`. Empty = 1. Perks, difficulty and overdrive all write it via `recalcMods`.

### 2.2 Salvage pods (`src/63_loot.js`)
Kills drop pods: SHD shield cell (+60%), REP hull patch (+22% hull, damaged subsystems +35%), MSL (+1 of each missile, one over stock), AMO (ammo +
capacitor full), OVR overdrive (12 s: +35% fire rate, +20% damage, free energy, +5% speed; rare). Fighters drop at 22% with a pity timer (every 5th kill),
capital ships 3 pods, aces 2. The type is weighted by what you are short of. Magnet 130 m, collect 30 m, 34 s life (blinks the last 6 s), at most 14.
Radar diamonds and HUD markers within 2.5 km. Applies in every mode, including the campaign (see section 5).

### 2.3 Gauntlet (`src/74_survival.js`, menu entry GAUNTLET)
- Wave director: budget = (1.6 + 1.1 n) x difficulty x swarm in "fighter units" (Darter 1.0, Leaper 1.2, Spitter 1.8, Toad 2.0, Reaver 2.6, unlocked by wave
  1/1/2/3/4). Pilot skill = 1 + n/3 + difficulty. Every 5th wave is a boss: 5 = Gulper + 2 Reavers, 10 = two Gulpers, 15+ = Bullfrog (and Gulpers from 20).
  From wave 3 about 40% of waves carry an event: AMBUSH (behind you), SWARM (many soft Darters), BOMBERS (Toads), ELITE (fewer, skill 5).
  An **ace** (named FROGG, skill 5, 1.8x tougher, gold marker with name, taunts, x5 score, drops overdrive) appears from wave 3 with 25% + 5% per wave (max 75%).
- After each clear: wave bonus (100 n + speed bonus + 250 for no hull damage), shields refilled, +10% hull, 2 supply pods, then the **perk draft**:
  3 cards (1 / 2 / 3 or tap), 18 s, the first is taken on timeout. 17 perks (damage, fire rate, capacitors, shields, armour, afterburner, speed,
  seeker, pod magnet, field repairs, chain reaction, flare fountain, bounty hunter, chain links, call in support, glass cannon, second wind), up to 4 stacks.
  Boss waves also drop a supply (shield, missile, hull).
- Mutators (each multiplies score): GLASS x1.3, SWARM x1.2, ACES x1.5, SCARCE x1.3, NEWTON x1.6. Difficulty EASY x0.8, NORMAL x1, HARD x1.25, ACE x1.6.
- Daily seed: the same waves and perk offers for everybody that day (the fight itself is not deterministic). Random runs print their seed.
- End: debrief with score, kills, perks, style, medals, new best, career XP and rank (CADET to ADMIRAL). Records in localStorage (`gs_svbest`, `gs_career`).
- URL for tests: `?sv=1&sv_seed=42&sv_diff=hard&sv_wing=1&sv_mut=glass,swarm&sv_daily=1`.

### 2.4 Missions
Difficulty on every briefing (fighter counts and pilot skill scale, your damage taken scales; NORMAL = as authored). Objective counters. Wing strip.
Onboarding: four CONTROL lines in mission 1 on first launch (`gs_tips`; `?tips` forces them). Debriefs show style, medals and career XP.

## 3. Feature-freeze conditions (AGENTS.md)
The freeze on new player-facing systems was lifted for this pass by the owner's explicit request of 2026-10-30. The rule's conditions were still met:

| System | Touch | AI default | Help line |
|---|---|---|---|
| hitmarkers, arcs, banners, chain | nothing to bind (feedback only) | AI ignores | legend under the key map |
| salvage pods | fly through them | AI never collects | legend |
| Gauntlet, perks | setup buttons, tappable perk cards | AI ignores perks; wingmen just fly | legend |
| difficulty | briefing buttons | n/a | legend |
| wing strip, counters, tips | display only, touch wording in tips | n/a | n/a |
Branch workflow followed: all work on `v0.2-fun`, merged to `main` when green.

## 4. Verification (headless, software renderer; see tools/tests/fun_t.py)
- `fun_t.py feel`: marker on hit, arc from the right-hand attacker (angle 0), chain 3, multiplier x2, missile kill bonus, hit-stop, medals, chain expiry.
- `fun_t.py loot`: pity-timer drop within 5 kills, magnet, each of the five effects, overdrive doubling bolt damage to 3.6 (3.0 x 1.2) and expiring, pods timing out.
- `fun_t.py survival`: start, clear, draft (a real key press picks; the fire group is untouched), next wave, perk modifiers (x1.15, glass x1.4/x1.25),
  waves 2-11 walked (boss at 5 with a Gulper and at 10, aces appear), death to debrief with best and career saved, same seed gives the same director plan,
  difficulty and mutators reach the player, menu flow on desktop and 844x390 touch.
- `fun_t.py missions`: difficulty selector, Hard = 7 enemies at skill 4 and +20% damage taken in mission 1, counter `[0/7]`, wing strip, four tips once, debrief.
- Regression: see CHANGELOG 0.2.0 for the suite results at merge.
- **Calibration of Gauntlet waves** (`tools/tests/sv_calib.py`, 20 seeded runs per cell, one AI Kestrel of skill 4 standing in for the pilot, no perks, no pods):
  wave 1 (about 2 enemies, skill 1) 99% hull left on average; wave 3 (about 4, skill 2) 65% left; wave 5 (Gulper boss, about 6) the proxy died in 15 of 20.
  The proxy is a weak stand-in (it does not collect pods or pick perks, and the owner's play-tests suggest a human survives better); this is direction, not truth.
  The boss supply drop was added after this measurement and is not reflected in it.

## 5. Risks and things most likely wrong
1. **Fun is unmeasured.** Nobody has hand-played this build. Constants (chain window, perk strengths, pod rates, wave budgets) are first guesses.
2. **Pods change the campaign.** They drop in missions too and heal the player; missions were tuned without them (BALANCE reports). Set `LOOT_CFG.dropFighter = 0`
   (or gate by `game.mode`) if mission difficulty should stay as designed. Not measured with seeded runs (AGENTS: balance claims need >= 20).
3. **Score inflation.** A long chain plus wave bonuses yields large numbers (a test run reached 70k by wave 12); only the relative ordering matters for now.
4. **Pace of the draft.** One draft per wave may feel like too many interruptions or too few; 18 s timer and per-wave cadence are guesses.
5. **Bosses.** Wave 5 killed the proxy pilot in 75% of runs; the supply drop is untested against a human.
6. **Hit-stop** (50 ms) could feel like stutter on a slow device; it only slows the sim, not rendering. Remove via `FUN.hitStopKill = 0`.
7. Phone layout of the draft cards and banners checked in screenshots at 844x390 only.

## 6. What to try first
1. Free flight: shoot a Darter. Do the ticks and the kill banner feel good? Kill three quickly: does the chain read well?
2. Mission 1 on HARD, with the four tips (clear `gs_tips` or add `?tips`).
3. GAUNTLET on NORMAL: how many waves before the draft stops feeling like a choice? Is wave 5 a spike or a wall?
4. Pods: do you chase them, and do they make a bad fight recoverable?
5. Try SWARM + GLASS on EASY for the silly end of the dial.
Tell me what is dull, what is too easy, what is too hard; the numbers are all in four tables (`FUN`, `LOOT_CFG`, `SV_TUNE`, `PERKS`/`DIFFS`/`MUTATORS`).

## 7. Ideas not done (next candidates)
Replays and shareable seeds with a recorded run (Simon's Battle Drones has replays); persistent unlocks tied to rank (new mutators, ship skins); campaign medals
on the mission select; mutators for campaign missions; ace-specific dialogue and a named rival across runs; capital-ship boss phases; ghost of your best run; a
slow-motion "last kill" camera; per-wave random maps (looks already rotate every 3 waves).

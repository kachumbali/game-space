# Headless balance tests (2026-10-21)

Method: Python Playwright + Chromium (SwiftShader), `__game.update(0.05)` stepping, ships spawned with `spawnShip`, AI only (the player is parked
far away). Scripts live in the session scratchpad (`duel2.py`, `scen.py`); they should move to `tools/`. The time limit is in update steps of 0.05
(the sim runs at SIM_SPEED 0.375). Small samples (2-3 runs per cell): they show orders of magnitude, not statistics.

**Harness bug found and fixed during this session:** an earlier harness added every ship to `ships` twice, so every ship was simulated twice per
step. All balance numbers taken before the fix were wrong and were discarded; the figures below are after the fix.

## Setup changes made for these tests
- Pilot skill 1-5 (`SKILL` table in `src/70_ai.js`): aim wobble, turn rate, missile-lock speed, missile-warning range; shown as `SKL n` on the target panel.
- Human fighter shield regeneration cut from 3 to 1 per second per facing; FROGG fighters turn x1.5 and accelerate x1.3 (neuro-slaved pilots, high G).
- AI flight model switch (`fm: 'arcade' | 'newton'` per ship, `newtonAI` in `src/50_state.js`): thrust along the nose, no velocity vectoring.
- First-cut nuclear warhead `nuke` (0.1 kT, proximity fuze with settable burst range): `nukeAt` in `src/60_weapons.js`, placeholder numbers.

## Results (4 Kestrel, skill 3, versus FROGG fighters, mixed Darter/Leaper/Spitter, skill 3)
| Flight model | FROGG fighters | Result (Kestrels alive, FROGGs alive), 3 runs |
|---|---|---|
| arcade | 8 | (4,0) (4,0) (4,0) |
| arcade | 12 | (0,7) (0,4) (0,12) |
| arcade | 16 | (0,13) (0,14) (0,16) |
| arcade | 20 | (0,20) (0,18) (0,19) |
| Newtonian (both sides) | 6 | (4,0) (4,0) (4,0) |
| Newtonian (both sides) | 8 | (4,0) (0,4) (0,3) |
| Newtonian, 4 v 8 mixed (older table, 3 runs) | humans N / FROGG N: (2,2) (1,3) (3,1) | |
| humans Newtonian / FROGG arcade, 4 v 8 | | (4,0) (4,0) (3,0) |
| humans arcade / FROGG Newtonian, 4 v 8 | | (4,0) (4,0) (4,0) |
Reading: in arcade mode the even point lies between 8 and 12 FROGG fighters (about 10) for 4 Kestrels; the swing from certain win to certain loss
is steep (square-law effect), so mission difficulty will feel like a cliff unless group sizes are chosen with care. Newtonian flight cuts the even
point to about 7. Flying Newtonian against arcade-flying FROGGs did not cost the humans in these runs.

## Frigate scenario
Exeter + 4 Kestrels versus 8 FROGG fighters + 1 Gulper, 3 runs: all FROGGs destroyed in 116-130 steps, no losses, Exeter hull 95-100%.
The frigate (7 PD turrets, 2 rails, 900 / 800 shield) dominates this force; FROGG numbers must rise sharply, or the frigate must be threatened by something other than fighters.

## Nuclear scenario (frigate launches one 0.1 kT warhead at the FROGG group; Kestrels about 400-600 m away)
| Burst range | FROGG (9) before -> after | Friendly crews |
|---|---|---|
| 6 m (impact) | no detonation: the warhead expired without hitting a manoeuvring fighter (also in a longer 1,600-step run); an impact test against a corvette or frigate is still to do | |
| 60 m | 9 -> 3 | Kestrels at 400-650 m took 8-23 Gy (placeholder crew-loss threshold 30 Gy) |
| 150 m | 9 -> 5 | 4-6 Gy |
| 300 m | 9 -> 8 | 10-25 Gy |
Hull damage stayed small at all ranges; kills came from the crew dose (placeholder constants: 80 Gy at 900 m for 1 kT, shield cuts the dose by up to 50%,
incapacitation at 30 Gy). Friendly crews 400 m from the burst were close to the threshold.

## Not verified
Impact-fuze detonation; PD interception of the warhead; flash-blind effect on gameplay; skill levels against each other; any statistics beyond 3 runs.


## 2026-10-22: FROGG lasers and missile doctrine
Headless duels, `duel2.py`, arcade flight, 4 Kestrels vs N FROGGs (both skill 3), human wins out of runs:
- Before lasers (after squad tactics): N=6 4/4 wins; N=10 3/4 wins (earlier runs 4/4).
- Lasers at 3.4 dmg: N=6 2/2; N=10 1/2; N=14 0/2. Newtonian vs Newtonian 0/3 at the scenario count.
- Lasers at 2.8 dmg, 950 m, 9 energy (shipped): N=10 3/3; N=12 1/3. Even point about 11-12, close to the 12:4 target. Newtonian flight still favours the FROGGs at these counts.
Sample sizes are 2-3 runs per cell: treat as direction, not a measurement.

## 2026-10-22 (later): laser focus mechanic and the turret aiming bug
- Focus mechanic (`acq`/`ramp`/`peak`, see docs/LASERS.md section 6). Duel result, fighters only, arcade flight, 4 Kestrels vs N FROGGs: N=10 3/3 human wins, N=12 1/3, N=14 0/3. Same as before the change: the even point is still about 11-12, because I raised base damage to offset the dwell and the autopilot Kestrels keep a beam on target roughly as often as before. This test cannot say how a jinking human fares; it needs your play log.
- Isolated check (`laser_t.py`): a stationary target takes no damage for about the first 0.35 s (sim) and then ramps to a plateau; the same target jinking 14 m sideways takes zero laser damage.
- **Bug found and fixed: all turret aiming was rotated 180 degrees** (`Matrix4.lookAt` was given the negated direction in `updateTurrets`). PD turrets, FROGG sting turrets and the new laser turrets all pointed away from their targets and almost never fired (PD test: 2 bolts in 4 s before, 33 after). Every earlier result that included a Halberd, Exeter or Gulper (missions 1-3, `scen.py`, any capital-ship scenario) was measured without working point defence. Fighter-only duels (`duel2.py`) are not affected. Missions have not been replayed for feel since the fix; expect FROGG missiles and fighters to be hit harder when they close on a Halberd.
- Corvette vs FROGG (headless, stationary Halberd, 8 FROGGs Toad/Leaper mix): all 8 killed in 36 s, Halberd hull 160/420. Exeter alone killed 8 in 24 s without hull damage. Single runs, no variance data.


## 2026-10-22: after FROGG buffs (lasers +25 %, missiles +30 % damage and more stock, afterburner pool 36 s / x2.1) and the AI missile budget
`tools/tests/duel2.py N 3 240`, 4 Kestrels vs N FROGGs, 3 runs per cell (direction, not measurement; software renderer):
| N | human wins | note |
|---|---|---|
| 6 | 2/3 | |
| 8 | 1/3 | |
| 10 | 0/3 | was 3/3 before the buffs |
| 12 | 0/3 | was 1/3 |
The even point moved from about 11-12 to about 7-8 FROGGs (target was 12:4). Not retuned: the owner asked for the buffs; the combined size is a decision for the owner. `msl_t.py 8 3 180`: before, humans launched 7-15 of 28 missiles and FROGGs 7-9 of 9 (stock exhausted); after, humans 7-16, FROGGs 13-14 of 18 (the budget rule is not what limits them; stock and reload are).


## 2026-10-22: Bullfrog acceptance engagement (first implementation, untuned)
Script `tools/tests/bullfrog_eng.py SEED 900 10000 DT`; raw per-run JSON: `docs/data/bullfrog_engagement_runs.json`. Setup: human side Exeter + 12 Kestrels (AI skill 3, group K) + 2 Halberds
(escorting the Exeter via `ai.escort`) vs Bullfrog (skill 3) with its 36 fighters launched by the hangar logic; start 10,000 m apart head-on, both AI, no player involvement (player parked 200 km away),
headless `update(DT)`, rendering disabled, cap 900 sim-s (all runs ended on a capital's death at 246-301 s). "First contact (capitals)" = capital centres < 3.4 km (spine range); "first contact (fighters)" = first Kestrel within 900 m of a FROGG fighter.
Seeds replace `Math.random` before spawning, but runs with the same seed are NOT reproducible (a, seed 1-3 vs the first batch differed); read the six runs as six samples.

| run | DT | first contact caps / fighters (s) | winner | Exeter died (s) | Bullfrog died (s) | spine shots (t, target, killed?) | Kestrels lost | FROGG fighters lost / launched | Tadpoles launched / PD-intercepted / hit (sources) | hangar launches |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.05 | 184 / 54 | FROGG | 252 | alive, hull 48% | 1: 199.5 Exeter, no kill | 8 / 12 | 22 / 33 | 9 / 0 / 8 (8 Toad, 1 Bullfrog) | 33 |
| 2 | 0.05 | 183 / 54 | FROGG | 238 | alive, hull 61% | 1: 199.3 Exeter, no kill | 3 / 12 | 19 / 31 | 6 / 0 / 6 (Toad) | 31 |
| 3 | 0.05 | 224 / 54 | human | alive, hull 90% | 293 (spooled a jump at 289 s, 23% hull, destroyed 3 s later) | 1: 255.7 Exeter, no kill | 8 / 12 | 21 / 34 | 1 / 0 / 1 (Bullfrog) | 34 |
| 4 | 0.0125 | 184 / 54 | FROGG | 240 | alive, hull 56% | 2: 199.5, 238.5 Exeter, no kill | 12 / 12 | 28 / 33 | 6 / 0 / 5 (5 Toad, 1 Bullfrog) | 33 |
| 5 | 0.0125 | 185 / 54 | human | alive, hull 23% | 251 (spooled at 249 s, 25% hull) | 2: 200.9, 242.4 Exeter, no kill | 5 / 12 | 36 / 36 | 11 / 4 / 7 (10 Toad, 1 Bullfrog) | 36 |
| 6 | 0.0125 | 202 / 54 | FROGG | 258 | alive, hull 55% | 2: 217.6, 256.6 Exeter, no kill | 12 / 12 | 11 / 23 | 1 / 0 / 1 (Bullfrog) | 23 |

Halberds (runs 1-6): lost 1, 1, 0, 1, 0, 2 of 2. FROGG fighters "launched" is what the hangar had released when the fight ended; no bay was destroyed in any run (`lostManifest` 0). Kestrel losses count every Kestrel death including late ones after the Exeter died.
Totals: FROGG 4 wins, human 2 wins (3 of the 4 FROGG wins ended with the Bullfrog above 55% hull, i.e. the Bullfrog was not close to death).

Reading (not tuning data):
- **Not degenerate:** both sides close, fighters meet at about 54 s, capitals reach spine range at 183-224 s, the fight resolves in 4-5 minutes of sim time, and the result goes both ways. The spine fired 1-2 times per run, always at the Exeter, hit every time, and killed it in none (the Exeter always survived the shot; the owner's "survives a few hits" holds). The Exeter died to the sum of Toad Tadpoles, fighters and the Bullfrog's turrets; the Bullfrog died only when the Exeter's lasers and rails and the Kestrels got through.
- **The Tadpole count is dominated by Toads** (4 Toads x 3 Tadpoles) and **PD stops almost none** (0 of 33 at DT 0.05; 4 of 11 at DT 0.0125). Same cause as the PD scenario test below.
- **Missile PD scenario (`bullfrog_t.py pd`, DT 0.0125):** 8 single Swifts from 1.2 km and 8 single HM-1 torpedoes from 1.5 km at a stationary Bullfrog and at a stationary Exeter: 0 of 8 killed in every cell of the final run (an earlier run killed 1 Swift and 2 torpedoes for the Bullfrog). A 16-missile salvo: 0 of 16 killed. The spec model (BULLFROG.md 4.4e, ~1.0 kill chance with 9 turrets bearing) is **not reproduced**: in the engine a turret starts from rest, slews at 3.6-4 rad/s and each missile is inside range for about 1 s, so most of the 16 turrets that select the missile fire only a few bolts (8 bolts total in the one traced Swift run, closest 23 m). The Exeter's PD fares the same. This is an engine property, not Bullfrog-specific; not tuned.
- **Caveats:** six runs, no variance estimate; software renderer (irrelevant to the sim, which ran without rendering); DT 0.05 quantises turret cooldowns (thorn 0.07 s fires every 0.1 s) and lets a 900 m/s PD bolt skip a missile's 1.6 m hitbox (PD is weaker than in the live game, 0.0125 is closer to the live frame step); AI behaviour untuned (Kestrels go straight for the nearest target, 11-12 of 12 are lost in 4 of 6 runs); hangar cap, spine delay and all spec numbers unchanged.
- **Proposed tuning if the owner wants more or less luck (not applied):** lower `hangarCap` from 12 to 8 for a fairer fight; raise `BF.spineDelay`; PD slew rate is the lever that decides the Tadpole threat (an engine-wide change, so left alone).

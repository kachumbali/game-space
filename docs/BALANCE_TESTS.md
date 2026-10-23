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
Totals: FROGG 4 wins, human 2 wins. The four FROGG wins ended with the Bullfrog at 48-61% hull; both human wins came from the Bullfrog dropping below 25% and spooling a jump while the Exeter's fire finished it.

Reading (not tuning data):
- **Not degenerate:** both sides close, fighters meet at about 54 s, capitals reach spine range at 183-224 s, the fight resolves in 4-5 minutes of sim time, and the result goes both ways. The spine fired 1-2 times per run, always at the Exeter, hit every time, and killed it in none (the Exeter always survived the shot; the owner's "survives a few hits" holds). The Exeter died to the sum of Toad Tadpoles, fighters and the Bullfrog's turrets; the Bullfrog died only when the Exeter's lasers and rails and the Kestrels got through.
- **The Tadpole count is dominated by Toads** (4 Toads x 3 Tadpoles) and **PD stops almost none** (0 of 16 at DT 0.05; 4 of 18 at DT 0.0125). Same cause as the PD scenario test below.
- **Missile PD scenario (`bullfrog_t.py pd`, DT 0.0125):** 8 single Swifts from 1.2 km and 8 single HM-1 torpedoes from 1.5 km at a stationary Bullfrog and at a stationary Exeter: 0 of 8 killed in every cell of the final run (an earlier run killed 1 Swift and 2 torpedoes for the Bullfrog). A 16-missile salvo: 0 of 16 killed. The spec model (BULLFROG.md 4.4e, ~1.0 kill chance with 9 turrets bearing) is **not reproduced**: in the engine a turret starts from rest, slews at 3.6-4 rad/s and each missile is inside range for about 1 s, so most of the 16 turrets that select the missile fire only a few bolts (8 bolts total in the one traced Swift run, closest 23 m). The Exeter's PD fares the same. This is an engine property, not Bullfrog-specific; not tuned.
- **Caveats:** six runs, no variance estimate; software renderer (irrelevant to the sim, which ran without rendering); DT 0.05 quantises turret cooldowns (thorn 0.07 s fires every 0.1 s) and lets a 900 m/s PD bolt skip a missile's 1.6 m hitbox (PD is weaker than in the live game, 0.0125 is closer to the live frame step); AI behaviour untuned (Kestrels go straight for the nearest target, all 12 are lost in 2 of 6 runs); hangar cap, spine delay and all spec numbers unchanged.
- **Proposed tuning if the owner wants more or less luck (not applied):** lower `hangarCap` from 12 to 8 for a fairer fight; raise `BF.spineDelay`; PD slew rate is the lever that decides the Tadpole threat (an engine-wide change, so left alone).

## 2026-10-22 (evening): re-measurement of the current build (2d6800b)

Fresh runs after the day's commits (FROGG buffs, turret class S/M/L corrections, lore/music work
touched no combat code). Harness: `tools/tests/duel2.py` (arcade) and the new
`tools/tests/duel2n.py` (Newtonian variant: identical setup, `fm:'newton'` on spawn). 5 runs per
cell unless noted. AI-vs-AI, skill 3 both sides: direction, not statistics.

| Flight model | N FROGGs | Human wins |
|---|---|---|
| arcade | 6 | 5/5 |
| arcade | 8 | 2/8 (one 3-run batch 2/3, one 5-run batch 0/5) |
| arcade | 10 | 0/8 (3+5) |
| arcade | 12 | 1/3 |
| arcade | 14 | 0/3 |
| Newtonian both sides | 4 | 3/5 |
| Newtonian both sides | 6 | 0/5 |
| Newtonian both sides | 8 | 0/5 |

**Drift found: the arcade even point is now about 6-7 FROGGs, not the 11-12 recorded earlier the
same day.** The intervening FROGG buff/laser work was stronger than its own re-measure suggested.
Mission wave sizes tuned against the old even point play harder than designed; re-tune before the
next play-test. Newtonian remains near-unwinnable at equal counts (evidence against making it the
default, docs/OPEN_QUESTIONS.md A8).

Bullfrog acceptance engagement (`bullfrog_eng.py`, seed 1, Exeter + 12 Kestrels + 2 Halberds vs
Bullfrog + hangar, 10 km start): human win at t=291 s. Bullfrog destroyed by the Exeter rail; all
36 hangar FROGGs destroyed; Halberds 100%; 8/12 human fighters lost; Exeter ends at 15% structure.
Spine: 2 shots, 2 hits on Exeter, no kill. Tadpoles: 7 launched, 0 intercepted, 7 hits - PD never
stops a Tadpole; check whether that is intended (docs/BULLFROG.md).

Full review and follow-up plan: docs/UX_REVIEW.md.

## Weapon catalogue realism pass re-measure (2026-10-22, after the HE/rod changes)

Setup as above (4 Kestrels skill 3 vs mixed FROGGs skill 3, 3 runs per cell). The Kestrel's
PL-4 plasma bolter (en 7, unlimited) became the MK-30 HE cannon (kin 9 + 8 m splash, 500 rds
per mount); the Gulper's LASH CANNON became the R-12 penetrator driver (kin 34, 45% pierce).

| Flight model | FROGGs | Before (plasma) | After (HE 7 dmg / 240 rds) | After (HE 9 dmg / 300 rds) | After (HE 9 dmg / 500 rds, final) |
|---|---|---|---|---|---|
| arcade | 8 | 3/3 | 1/3 | 2/3 | 1/3 ((3,0) (0,5) (2,2)) |
| arcade | 10 | ~3/3 (older focus test) | 0/3 | 0/3 | 0/3 |
| arcade | 12 | 0/3 | 0/3 | 0/3 | - |
| Newtonian | 6 | 3/3 | 0/3 | - | 1/3 ((2,4) (3,2) (3,0)) |
| Newtonian | 8 | mixed | 0/3 | - | 0/3 |

Reading: the arcade even point moved from about 10 to about 7-8; Newtonian from about 7 to
about 5-6. Cause: `DMGX` gives kin 0.7x vs shields where the plasma bolter had en 1.25x, so
the Kestrel lost its shield-stripping tool; the splash (0.2-0.4 falloff) does not compensate
against scattered single fighters. Raising damage 7 -> 9 and the magazine 240 -> 500 recovered
about half the gap; 3-run cells are too noisy to tune further headlessly. If the old even point
is wanted, the structural fix is a small fighter-scale laser (en) as a realistic secondary;
that is an owner decision (it needs a third Kestrel mount group and a HUD line).

Mechanics verified headlessly (scratch, not committed as tests): the HE shell splashes to a
second Darter 8 m from the impact (shield-only damage, distance falloff) and a third at 600 m
stays clean; at `q=low` fighters' voxel hulls are too coarse for bolt hits at all - a property
of the engine, not of the weapon. The R-12 rod bypasses a 1e6 shield for 88 structure damage in
11 s against a parked Halberd dummy (45% pierce working as designed).

## AI power management re-measure (2026-10-22, after `powerAI`)

Owner decision: all ships work their 12-point budget, not just the player. Same duel setup (4 Kestrels skill 3
vs mixed FROGGs skill 3, 3 runs): arcade 8 -> 3/3, 10 -> 3/3, 12 -> 1/3. The even point is back at about
10-11, the original plasma-bolter band - the AI power pass (both sides push shields under fire, engines when
closing) restored what the HE swap had cost the Kestrels, roughly cancelling the shift recorded above.
Both changes stay in; the two effects are recorded separately so either can be re-tuned on its own.
Test: `tools/tests/power_t.py` (4/4 pass: fire -> SHIELDS, far -> ENGINES, calm -> 4/4/4, regen 1.48x).

## Magazine rule re-measure (2026-10-22, after ammo on all kinetic weapons)

Every kinetic weapon now carries a magazine (RG-90 100/mount, PD-30 1500/turret, R-9 400/mount, R-12 60/mount;
Halberd gains the GA-9 rotary, 900 rds; the Exeter's XL gets 100 slugs). Same duel setup: arcade 8 -> 2/3,
10 -> 3/3 - the even point stays about 10. The 300-s stalemates (e.g. (2,1,300)) are both sides dry: the
FROGG gun pools last ~64 s of continuous fire, the Kestrels' ~51 s cannon / ~110 s HE, and after that the
fights are decided by missiles and masers. capitalAI now fires both mount groups up close, which woke the
Gulper's grp-2 maser lances (they had never fired under AI before). Test: `tools/tests/magazine_t.py`.

## Gun discipline + MD-9 mag re-measure (2026-10-22)

AI ammo guns now fire in shrinking bursts below 60%/30% of pool and stop at 5% (discipline); the Kestrel
swapped one MK-20 for the MD-9 mag (26 kin, 25% pierce, 30 energy per slug - capacitor-fed). Same duel setup:
arcade 8 -> 2/3, 10 -> 1/3. The even point still reads ~9-10; the 10-cell swung from 3/3 to 1/3, within the
recorded noise band for 3-run cells. Discipline duty cycles measured headlessly: free 60 rds/6 s, 50% band
34 (57% duty vs the designed 54%), 20% band 15 (25% vs 23%). Tests: `tools/tests/discipline_t.py`.

## Gun-class taxonomy (owner statement 2026-10-22)

Three gun classes, now also true in the stats: chemical guns (ammo only), mag/rail (a little energy AND ammo -
RG-90 12 en/shot, MD-9 30 en + 120 slugs, MD-55 15 en, R-12 6 en), energy only (reactor-fed). FROGG lean
energy-heavy, humans ammo-heavy; drones are human-only (FROGG anti-AI). Duels after the class-2 energy draws:
arcade 8 -> 2/3, 10 -> 2/3 - the even point holds ~10-11. Tests unaffected (discipline_t 10/10, magazine_t
11/11, suite1 13/13).

## P0 pass (owner directive 2026-10-22): seeded 20-run measurement standard

`?seed=N` makes the whole sim deterministic (mulberry32 over Math.random, 10_config). Duel cells now
quote >= 20 runs or do not claim an even point. First 20-run cell (arcade, 4 Kestrels sk3 vs 10 FROGGs
sk3, seeded): **human wins 9/20 = 45%, Wilson 95% CI [25%, 66%]** - the even point at N=10 is confirmed
at 20 runs (the old 3-run cells gave 0/3 to 3/3 at this cell; the noise estimate was right). PD-vs-torpedo
is fixed by swept proximity flak (p0_t: 4 of 4 intercepted at 270-402 m, was 0 of 7); the acceptance
engagement was re-measured 2026-10-23, see the next section (6/6 human wins, 21 of 24 Tadpoles
intercepted). S1 real pause and S2 touch parity are in (UX_REVIEW workplan status).

## 2026-10-23: Bullfrog acceptance engagement re-measure under swept-proximity flak (post-P0, fde8b8c)

Same harness and protocol as the 2026-10-22 six-run set: `tools/tests/bullfrog_eng.py SEED 900 10000 DT`,
seeds 1-3 at DT 0.05 and 1-3 at DT 0.0125, Exeter + 12 Kestrels (sk3) + 2 Halberds vs Bullfrog (sk3) +
hangar, 10 km head-on, both AI, rendering disabled, cap 900 sim-s. Raw per-run JSON appended to
`docs/data/bullfrog_engagement_runs.json` under `flak_dt*_seedN`. No console errors in any run.

| run | DT | first contact caps / fighters (s) | winner | Exeter end | Bullfrog died (s) | spine shots (all: hit Exeter, no kill) | Kestrels lost | FROGG lost / total | Tadpoles launched / intercepted / hit | hangar launches |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.05 | 157 / 48 | human | 87% alive | 197 | 1 (171.0) | 3 / 12 | 26 / 31 | 8 / 5 / 1 (all Toad) | 31 |
| 2 | 0.05 | 162 / 48 | human | 90% alive | 218 | 1 (177.6, 1 fizzle) | 0 / 12 | 36 / 36 | 12 / 12 / 0 (Toad) | 36 |
| 3 | 0.05 | 157 / 48 | human | 90% alive | 202 | 1 (171.1, 1 fizzle) | 3 / 12 | 16 / 35 | 0 launched | 35 |
| 4 | 0.0125 | 158 / 48 | human | 90% alive | 203 | 1 (173.9, 1 fizzle) | 6 / 12 | 20 / 33 | 0 launched | 33 |
| 5 | 0.0125 | 156 / 48 | human | 90% alive | 200 | 1 (171.4) | 4 / 12 | 23 / 33 | 1 / 1 / 0 (Toad) | 33 |
| 6 | 0.0125 | 157 / 49 | human | 90% alive | 200 | 1 (172.0) | 5 / 12 | 21 / 32 | 3 / 3 / 0 (Toad) | 32 |

Totals vs the 2026-10-22 set: **human 6/6 (was 2/6)**; Exeter alive at 87-90% in every run (was dead in
4/6); Halberds 0 of 12 lost (was 5 of 12). Tadpoles: 24 launched, 21 intercepted, 1 hit, 2 unresolved at
run end (was: 0 of 16 intercepted at DT 0.05, 4 of 18 at DT 0.0125, 28 hits). The Bullfrog spooled a
jump in 5 of 6 runs (at 22-25% structure) and was destroyed mid-spool every time; **its own 16 ST-2
tubes never fired in any run** (bfLaunched 0; the pre-flak set had 1 Bullfrog-launched Tadpole in four
of six runs). Fights are shorter: 197-218 s (was 238-301 s).

Reading (not tuning data):
- **The flak fix moved the interception record exactly as p0_t predicted**: 21 of 22 resolved Toad
  Tadpoles killed in flight, 1 hit. With the Toad warheads gone, the Exeter's end state moved from
  0-23% structure (dead in 4/6) to 87-90%, and the surviving Kestrels (0-6 lost of 12, was 3-12)
  ground down the FROGG fighters harder (16-36 lost per run).
- **This is not a flak-only comparison.** The 2026-10-22 series between the two measurement sets also
  changed combat (HE/rod realism pass, powerAI, magazines + gun discipline, gun-class energy draws,
  capitalAI firing both mount groups). The interception count is the flak fix; the win flip is the sum
  of the series.
- **The acceptance engagement is no longer a fight.** 6/6 human with the Exeter barely scratched, and
  the Bullfrog dies before its own torpedo doctrine appears. If the owner wants the engagement
  competitive again, the levers this data points at are an early Bullfrog ST-2 salvo (its tubes never
  fired), PD-30/R-5 burst strength, and `spineDelay`; `hangarCap 12 -> 8` (proposed 2026-10-22) is now
  the wrong direction. Not tuned - feature freeze until the iPad playtest.
- Caveats as before: six runs, no variance estimate; q=low (bolt-vs-fighter hits do not land at this
  quality - fighter kills are missile/maser/turret-driven, same as the recorded set); rendering
  disabled, so the software renderer is irrelevant.
engagement should be re-measured. S1 real pause and S2 touch parity are in (UX_REVIEW workplan status).

## Exeter laser retune (owner decision 2026-10-23)

Owner hand-play: Exeter vs Bullfrog ended in seconds, fighters included. Reproduced with `bullfrog_eng.py` (4 km start, Exeter alone): Bullfrog and 31 of 34 fighters dead at ~67 sim-s, Exeter 75% hull; with lasers disabled the Exeter dies at ~61 s; proximity flak off changes nothing. Cause: the 10 turret lasers (LS-2 + LS-8) at full damage. Retuned LS-2 dmg 6 -> 3 and LS-8 dmg 13 -> 6.5 (Halberd's LS-2 turrets are affected too). After: Exeter alone 1 win / 1 mutual / 2 losses in 4 runs (Bullfrog killed in 2); full fleet 10 km, 3/3 human wins, Exeter 90%. Small samples (not the 20-run standard); direction only.

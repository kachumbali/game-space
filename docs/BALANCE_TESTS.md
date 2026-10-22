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

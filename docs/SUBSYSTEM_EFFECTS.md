# Subsystem damage effects (v0.3 M5)

What a damaged or destroyed component does to the ship. Grades follow `compState()` in `src/65_combat.js`: 0 ok, 1 damaged (hp at or below 50%), 2 destroyed.
New graded effects live in one tuning table, `SUBSYS` in `src/51_subsys.js` (rows are `[ok, damaged, destroyed]`). The grade of a role is the mean grade of its components
(two engines, one destroyed = 1.0), interpolated between the rows. Every effect sits in a shared function, so AI ships obey it exactly like the player.
Test: `tools/tests/subsys_t.py` (damages each role through `applyHit` to grade 1 and 2 and measures the result).

## Audit: component roles in `data/db.json`

Roles that exist on the 17 ships: `engine`, `gun`, `shield`, `radar`, `power`, `turret`, `bay`, `dock`, `radiator`. There is **no** wing, thruster or aft-section
role (components named `wingL/wingR` on the Kestrel are guns), so there is nothing to hang a separate roll/handling effect on; roll and pitch/yaw all scale with `turnMul`, which the engine grade drives.

| Role | Ships | Effect before M5 | Effect after M5 (grade 1 / grade 2) | Where |
|---|---|---|---|---|
| engine | all | top speed `0.3+0.7*hp` and turn `0.45+0.55*hp` (continuous in hp, player and AI), flame dies | unchanged, plus **afterburner**: pool x0.70 / x0.35, boost (speed and accel gain) x0.75 / x0.40, refill x0.70 / x0.40 | `speedMul`, `turnMul`, `abTick`, `abSpdOf`, `abAccOf` |
| gun | fighters, corvettes, capitals | destroyed gun = its mounts will not fire | + damaged gun: mount cooldown x1.35 (fire rate 74%) | `fireMount` |
| shield | all but unshielded | shield cap and regen scale with hp, 0 hp = no shield absorbs | unchanged (already graded) | `updateShieldsAndFx`, `applyHitCore` |
| radar | Kestrel, Merlin, Tern, Bittern, Halberd, Exeter, Hecla, Tender, Gulper, Hivecarrier, Bullfrog | dead = RF missiles cannot lock, target range reads `???`, radar scope offline, contacts beyond 1200 m hidden; <=50% = scope jitter and dropouts | **lock range** x0.65 / x0.35, **lock time** x1.5 / x2.6 (IR seekers still lock, slowly; RF seekers need a live radar), **scope reach** 60% of 6 km / offline | `lockUpdate`, `sensorLimit` (HUD) |
| power | all | `powerMul` = 0.5+0.5*hp scales capacitor regen, shield regen and weapon cooldown; **destroyed reactor kills the ship** | + capacitor capacity x0.80 / x0.60 (grade 2 is moot, the ship is lost) | `powerMul`, `energyCapOf` |
| radiator | Exeter, Hecla | none | capacitor refill x0.85 / x0.65 (heat-limited recharge; there is no heat model, this is the cheapest honest hook) | `updateShieldsAndFx` |
| turret | Bittern, Halberd, Exeter, Hecla, Gulper, Bullfrog | destroyed turret droops and stops | + damaged turret: cooldown x1.4 (fire rate 71%), slew rate x0.6 (also lengthens time on target) | `updateTurrets` |
| bay | Tern (cargo pods and transfer booms), Exeter, Hecla, Tender, Bullfrog | Bullfrog hangar only: damaged bay loses 10% of launches on the rail and launches 1.6x slower, destroyed bay loses its manifest | + **Tender** service bays: rearm rate x0.5 / x0, docking clearance refused (and an active dock released) at grade 2 | `tenderTick`, `dockTry`, `dockTick`; hangar in `79_bullfrog.js` unchanged |
| dock | Exeter, Hecla | none | still none: tactical docking only exists at the Tender and the strategic dockings are scripted, so these components have no mechanic to affect | - |

Not changed on purpose: Tern cargo pods and booms (`bay`) have no cargo or transfer mechanic. The AI has no sensor-range model (it picks targets without a radar), so a damaged AI radar acts only through lock range and lock time.

## Effect table (SUBSYS and the older continuous effects)

| System | Metric | Healthy | Damaged (grade 1) | Destroyed (grade 2) |
|---|---|---|---|---|
| Engines (all) | top speed | 100% | about 63% (continuous in hp) | 30% |
| Engines (all) | turn and roll rate | 100% | about 71% | 45% |
| Engines (all) | afterburner pool / boost / refill | 100% | 70% / 75% / 70% | 35% / 40% / 40% |
| Radar | lock range | 100% | 65% | 35% (RF: none) |
| Radar | lock time | x1.0 | x1.5 | x2.6 |
| Radar | scope reach (6 km setting) | 100% | 60% (3.6 km) | offline, 1.2 km visual |
| Power plant | capacitor capacity | 100% | 80% | ship lost |
| Power plant | recharge, shield regen, cooldown (`powerMul`) | 1.0 | about 0.74 | ship lost |
| Radiator | capacitor refill | 100% | 85% | 65% |
| Gun (per mount) | fire rate | 100% | 74% | mount disabled |
| Turret (per turret) | fire rate / slew | 100% / 100% | 71% / 60% | turret dead |
| Tender bay | rearm rate / docking | 100% / yes | 50% / yes | 0% / refused |
| Shield generator | shield cap and regen | 100% | at most 50% | 0 |

"Damaged" engine numbers are for every engine at 50% hp; with fewer damaged engines the continuous curve is milder.

## HUD cues

- Log flash when a component changes grade (player, and the selected target): `RADAR DAMAGED - LOCK RANGE 65%, LOCK TIME x1.5`, `ENGINE L DAMAGED - SPEED 82%, TURN 86%`.
- Status lines under the damage map (`#subsys`, `updateSubsysCue` in `src/90_hud.js`): desktop and tablet show up to four lines, one per degraded role, e.g. `RDR DMG LOCK RANGE 65% LOCK TIME x1.5`
  (amber = damaged, red = all destroyed). The phone layout shows one line of tags (`ENG! RDR`, `!` = destroyed) so the 844x390 layout is not crowded; details arrive as the log flash.
- The damage map colours (green, amber, red, hatched) are unchanged.

## Verified and not verified

Headless only (`subsys_t.py`): every row above was measured through the real hit path, plus phone layout at 844x390 with `?touch`. Nothing here is hand-played, so whether
these percentages feel fair (especially radar at grade 2 and turret slew) is a balance question for the owner.

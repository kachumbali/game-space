# Merlin: human light fighter (specification)

Status: proposal, not in the build. Specification only: no geometry, no code, `data/db.json` untouched. The database fragment is
`docs/ships/merlin.db.json` (drop-in value for `ships.merlin`; no `prims`). Source for the class: `docs/SHIP_CLASSES.md` section 1
(light fighter) and the section 3 fit sketch (2x MK-20, 2x SW-9, no mag, no HE; faster and flimsier than the Kestrel).

Everything below that is a number is either read from `data/db.json` / the source (marked as such) or a design choice with its reason.
Every performance claim in section (h) is a **hypothesis until seeded runs exist**; none was measured for this document.

Weapon ids in the fragment are existing db ids: `cannon` is the MK-20, `ir` is the SW-9 store key (`stores.ir`). No new weapon is needed.

## (a) Role and doctrine

**What it is for.** The cheap screen. It trades staying power for speed and bodies: a flight of Merlins put guns and a first missile
salvo on bombers, torpedo carriers and strays, die cheaply when the enemy commits, and so force the enemy to spend attention and
ordnance on hulls that cost little. Lore and class text: one pilot, minimum frame, no drone (the Kestrel's slaved SD-4 needs a
specialist-class workload; the Merlin has no second seat and no drone store), point-defence / interception screen.

**What it is bad at** (by construction, verified in the numbers of section e/f):
- Staying alive under focus: about 47 percent of the Kestrel's effective hit points against small kinetic hits (section e).
- Killing anything armoured or large: two 3-damage MK-20s are below the effective threshold for any hull with `thresh` armour at corvette
  scale or above (corvette thresh 3 to 6, class multiplier 1.0; the fighter scale 0.25 only protects *fighters*). It does nothing to a
  Halberd-class hull and little to a Toad's shield; missiles are its only capital-adjacent contribution, 2 x 26.
- Endurance: 1,200 cannon rounds (51 sim-s of both guns firing), no magazine of heavier ammunition, 2 missiles, 12 flares.
- Beam-armed FROGG fighters (Leaper and up): the M-1 pulse maser's peak output kills it in well under a second once the beam has acquired.
- The reactor-kill rule (`applyHit`: a dead `power` component kills the ship) makes its small, central reactor the cheapest way to kill it.

**How the AI should fly it.** Existing `ai.role` values in `src/70_ai.js` are `fighter`, `gunship`, `bomber`, `corvette`, `capital`, `lancer`.
There is no `interceptor` role: the Darter's `role: "INTERCEPTOR"` is a label string only, and the AI's AI-role is `fighter`.
- Use `ai: { "role": "fighter", "aggr": 0.9 }`. `fighterAI` flies attack / break / evade / flee, fires bursts under the gun-discipline rule, and
  launches `ir` missiles via `missileLogic` at 350 m to 0.7 x 1700 m. That is the whole doctrine the current code can express.
- `aggr` 0.9 (Kestrel default 0.8, Darter and Drone 1.0): the flee rule `hurt && aggr < 0.7` is switched off, so it does not run when hurt (it is
  the cheap screen; a fleeing 175 m/s hull rarely survives anyway), and the aim tolerance `0.07 / (aggr + 0.3)` stays tight enough not to
  waste a 1,200-round pool. Not 1.0, because the loosest tolerance burns the pool fastest.
- Cruise throttle is the default `0.8 x maxSpeed` = 140 m/s (no `aiSpeed`, like the Kestrel). Reason: no evidence for a different value.
- **Gap, not fixed here (proposal only):** "point defence / interception" is not an AI behaviour. `pickTarget` takes the nearest hostile and (for team 0)
  weights `bomber` roles by 0.7; it never targets a missile. The MK-20 can destroy missiles physically (`60_weapons.js` swept test: 1.6 m radius,
  missile hp 1 for SW-9 / SK-1, 3 damage per hit) but only by accident. A real interception role (prefer bombers; shoot inbound torpedoes) would be
  an AI change in `70_ai.js`, outside this task and presumably subject to the "new systems frozen until hand-play" rule only if it is player-facing.
  Until it exists the Merlin's "interception" is a role in the lore, not in the sim. See open question 3.

## (b) Lore line and crew

- Name: **Merlin** (the smallest European falcon; same bird-name lineage as Kestrel, Harrier, Bittern in `docs/SHIP_CLASSES.md`).
- Crew: **1** (pilot, no weapons specialist, no drone).
- Lore line (proposal): *"The CDF's cheapest hull with a pilot in it: a gun pack, a pair of heat-seekers and an engine, built in numbers at the
  colonial yards where the Exeter-class tenders can rearm a flight faster than the UTDF can replace one. Flown in flights of four to six from
  the Exeter's fighter docks as the screen in front of the Kestrels and Halberds; pilots call it 'the screen' and do not expect to be
  relieved."* Consistent with `docs/LORE_FACTIONS.md` section 4: the CDF is poorer, fields smaller numbers, and leans on drone wingmen and
  point defence; the Merlin is the crewed cheap option beside the unmanned SD-4.
- Pilots can eject (human rule, `docs/LORE.md`, `LORE_FACTIONS.md` section 5). A one-pilot hull with a 26-point structure gives a low overkill margin; the
  ejection check in `deathCause` is overkill-based, so Merlin pilots will be rescued less often than Kestrel pilots. That is a side effect, not a design aim.

## (c) Dimensions and silhouette targets

Scale table reference (`docs/SHIPS.md`): Kestrel 12.4 m / span 10.4 / height 4.4; Darter 9.5 / 9.2 / 3.6; Drone 6.0 (db `half` 2.9 / 0.7 / 3.4).
`half` is the authored bounding half-extent including wings, fins and protruding barrels; `radius` is the broad-phase radius (convention: about
the longitudinal half-extent: Kestrel 6.6 vs 6.9, Darter 5.4 vs 5.4, Leaper 8.0 vs 7.6).

| Quantity | Merlin | Kestrel | Reason |
|---|---|---|---|
| Length | **9.0 m** | 12.4 m (0.73x) | Between Drone (6.0) and Kestrel; just under the Darter (9.5) so a human light fighter is not larger than the FROGG interceptor it screens against. A single seat, two cannons, one engine pair and no booms/wing guns fit. |
| `half` (x, y, z) | **[3.9, 1.6, 5.0]** | [5.2, 2.2, 6.9] | z = length/2 (4.5) + 0.5 for chin barrels and nozzle glow, same construction as the Kestrel (6.2 + 0.7). x gives span 7.8 m (Kestrel 10.4, Darter 9.2): a compact delta-ish planform. y gives height 3.2 m (Kestrel 4.4) including fins and the belly missile pylon. |
| `radius` | **5.0** | 6.6 | Convention above. Also the broad-phase part of hit probability: 24 percent smaller. |
| Frontal cross-section (2 x half x, 2 x half y) | 7.8 x 3.2 = 25 m2 | 10.4 x 4.4 = 46 m2 (0.54x) | Upper bound (box); real silhouette is smaller. A real part of "flimsier" is "harder to hit": voxel collision uses the solid voxels, so this ratio matters more than `radius`. |
| `seam` | [1.2, 0.9] | [1.5, 1.1] | Panel-seam spacing scaled by 0.8 (visual only, keeps panel density readable on a smaller hull). |
| `eye` | [0, 0.5, -1.8] | [0, 0.62, -2.5] | Cockpit at roughly 40 percent of the length from the nose, as on the Kestrel (-2.5 / 12.4 = 20 percent of length behind nose point; Merlin -1.8 / 9 = 20 percent). |

Class mass: `mass.fighter = 1` (collision uses `reduced mass` class values, not length). Merlin is the same class as everything else; a Merlin-Kestrel collision
damages the Merlin more only through the ordinary "lighter body" rule if mass classes ever differ, which they currently do not.

Voxel cost: ships are voxelised by size; at 9 m this is below the Kestrel, so no `resMul` or `noDetail` is set (the Drone sets both because it is 6 m and expendable;
a hand-flown Merlin should keep the detail tiers).

## (d) Performance

Comparison table. Database values are authored; the in-game values apply `src/32_scale.js` afterwards (fighter turn x 2.85; FROGG fighters additionally turn x 1.5 and accelerate x 1.3; afterburner pool by faction).

| | Merlin | Kestrel | Drone | Darter (FROGG) | Leaper (FROGG) |
|---|---|---|---|---|---|
| `maxSpeed` | **175** | 150 | 190 | 165 | 120 |
| `accel` (authored / in game) | **95** / 95 | 75 / 75 | 120 / 120 | 90 / 117 | 65 / 84.5 |
| `turn` (authored / in game) | **2.5** / 7.1 | 2.2 / 6.3 | 2.6 / 7.4 | 2.6 / 11.1 | 1.7 / 7.3 |
| Afterburner top speed (x 1.8 human / x 2.1 FROGG) | **315** | 270 | 342 | 346 | 252 |
| Afterburner accel (x 2.2 / x 2.6) | **209** | 165 | 264 | 304 | 220 |

Reasons per number:
- `maxSpeed 175` (+17 percent over the Kestrel): the "faster" in the class sketch. Placed above the Darter's 165 (a human light fighter should out-run the FROGG interceptor on the straight; it
  is why it is a screen and not a brawler), and below the Drone's 190 (the drone has no pilot, no life support and no G limit; it must stay the fastest fighter hull). Lower than 175 and
  the Merlin has no speed argument against the Kestrel; higher and it reaches or passes the Drone.
- `accel 95` (+27 percent over the Kestrel): a lighter airframe on the same engine class. Kept below the Drone (120) and the Darter's in-game 117. It matters more than top speed for the break-away
  and for regaining energy after a turn; it is the main reason the AI Merlin can disengage.
- `turn 2.5` (+14 percent over the Kestrel): light frame, but a human pilot: no neuro-slaved G tolerance, so no FROGG-style bonus. It keeps the Merlin *below* the Darter (11.1 in game, 56 percent more) and about
  level with the Leaper (7.3 vs 7.1) and the Drone (7.4). Consequence: the Merlin cannot turn-fight a Darter; it wins by closing speed and by two guns.
- Afterburner: **the existing rules apply unchanged** (`32_scale.js`: human fighter pool 20 s, regen 0.8/s, speed x 1.8, acceleration x 2.2; pool scaled by the ETS engine channel, locked out until 25 percent).
  Merlin gains only through the higher base number (315 vs 270 m/s). The pool length cannot differ per ship without a code change (the loop overwrites `abMax` for every fighter); see open question 2.
- `aiSpeed`: unset (default cruise 0.8 x maxSpeed = 140 m/s for the AI, vs Kestrel 120). Same reason as the Kestrel.

## (e) Survivability

| | Merlin | Kestrel | Darter | Leaper | Drone |
|---|---|---|---|---|---|
| `structure` | **26** | 50 | 14 | 25 | 7 |
| shield fore / aft | **22 / 20** | 40 / 40 | 10 / 8 | 16 / 14 | 6 / 6 |
| `shieldRegen` | **0.8** | 1 | none | none | 0.5 |
| armour (type, rating) | **composite, 0.30** | composite, 0.44 | composite, 0.46 | composite, 0.50 | composite, 0.10 |
| reactor hp | **15** | 30 | 12 | 18 | 6 |
| `sig` | **0.7** | 1 | 0.8 | 1 | 0.4 |

Effective hit points against small hits, shield on the front facing plus structure behind the armour rating (kinetic shield multiplier 0.7, energy 1.25, `DMGX`; fighter thresholds 0.75 are below every fighter weapon, so ignored; pierce ignored; computed from the db values):

| Kinetic-equivalent hit points | Merlin | Kestrel | Leaper | Darter | Drone |
|---|---|---|---|---|---|
| vs kinetic, structure path | 69 | 146 | 73 | 40 | 16 |
| vs energy, structure path | 55 | 121 | 63 | 34 | 13 |
| vs kinetic, reactor path (shield + reactor hp / (1 - rating) / 0.7) | 62 | 134 | 74 | 46 | 18 |

The Merlin is 47 percent of the Kestrel, 1.7 times the Darter, and about the same as the Leaper. The reactor path is shorter than the structure path for the
Merlin by a small margin (62 vs 69), as for the Kestrel (134 vs 146): the sim will usually kill a Merlin by the reactor, not by structure.

Reasons:
- `structure 26`: roughly half the Kestrel's 50 (hull volume ratio 0.73^3 is 0.39; half is the compromise), and level with the Leaper (25, a 13.6 m FROGG fighter), because human structure is not worse than FROGG structure.
- Shield `22 / 20`: 55 percent of the Kestrel's 40. A shield generator is a fixed cost; a light frame carries a smaller one. 2.2x the Darter's fore value because human shield technology is the better of the two at equal size
  (the Leaper's 16 sits at a 13.6 m hull). The aft facing is 91 percent of fore (Darter 80, Toad 85): fighters are shot from behind; a larger asymmetry would be a pure bet.
- `shieldRegen 0.8`: smaller emitter than the Kestrel's 1. At 22 points it refills in about 28 s after the 4 s post-hit delay (Kestrel 40 points at 1: about 40 s). Note the code only regenerates when `shieldRegen` is set: the Darter and Leaper have none.
- Armour `composite 0.30`: below the Kestrel's 0.44 (thin plating on a minimum frame), above the Drone's 0.1 (crewed and armoured around the cockpit). Composite because the owner has "one armour type per ship for now" and it is the all-round profile: the
  Merlin screens against both kinetics and masers. Hard armour would make it immune to the FROGG's energy fire (0.4x) but reduce the pressure on the FROGG; that is a design decision (open to the owner), not made here.
- Component hit points (roles already used by the Kestrel: engine, gun, shield, radar, power). Total 67 vs structure 26 (2.6x), the Kestrel has 134 vs 50 (2.7x), so the component-to-structure ratio is kept:

| id | name | role | hp | r | Kestrel equivalent | Reason |
|---|---|---|---|---|---|---|
| `engL`, `engR` | ENGINE L / R | engine | 9 + 9 | 1.1 | 16 + 16, r 1.5 | One nacelle per side (Kestrel two per side); about 56 percent. Engines are `EXPOSED` x 2.2 (hit directly through armour), so losing one at 9 hp is the commonest component loss. Speed penalty per `speedMul`: 0.3 + 0.7 x comp factor. |
| `gunL`, `gunR` | CANNON L / R | gun | 7 + 7 | 0.65 | 10 (cannon), 12 (MD-9), 9 + 9 | Two small barrel groups in the nose; `EXPOSED` x 1.6. One dead cannon halves the firepower; two dead guns trigger the AI's `flee` (`!gun`). |
| `shield` | SHIELD GEN | shield | 12 | 0.8 | 20, r 0.9 | 60 percent; `SOFT` x 1.2 damage and `EXPOSED` x 1.3. |
| `radar` | RADAR | radar | 8 | 0.6 | 12, r 0.8 | 67 percent; `SOFT` x 1.5. |
| `power` | REACTOR | power | 15 | 0.8 | 30, r 1.0 | 50 percent; destroyed = ship destroyed. Smaller `r` than the Kestrel, so the capture zone (r x 2.2 + 0.8 = 2.6 m) is a smaller fraction of a 9 m hull than the Kestrel's 3.0 m of 12.4 m, but the reactor hp is low; see risks. |

- `sig 0.7`: smaller than the Darter's 0.8 (it is a smaller hull by 5 percent and a pilot-flown, not wetware, ship: nothing in the lore says it is stealthier). **Note:** in the code `sig` is used only in `lockUpdate` as `lockTime / max(1, sig x 0.7)`, i.e. it has no effect below sig 1.43.
  The number is therefore bookkeeping today; real signature is the hit volume. Do not rely on it for balance.

## (f) Armament

| Mount | Weapon id | Name | Position (ship space) | Component | Group | Notes |
|---|---|---|---|---|---|---|
| 1 | `cannon` | MK-20 CANNON | [-0.55, -0.30, -4.75] | `gunL` | 1 | chemical, 600 rounds |
| 2 | `cannon` | MK-20 CANNON | [ 0.55, -0.30, -4.75] | `gunR` | 1 | chemical, 600 rounds |

- MK-20 (db): 3 kin per round, `cd` 0.085 s (11.8 rounds/s), 900 m/s, life 1.8 s (range about 1,620 m), no energy cost, 600 rounds per mount.
- Totals: **1,200 rounds**; both firing: 23.5 rounds/s, **70.6 raw damage/s**, empty in 51 sim-s (136 real-s at `SIM_SPEED` 0.375). The gun-discipline rule shortens bursts below 60 percent of pool and ends gun fire at 5 percent.
- Compare Kestrel: raw 131.6 dps (cannon 35.3 + MD-9 14.4 + 2 x HE 40.9). The Merlin has 54 percent of it, **without** the Kestrel's pierce (MD-9 25 percent) and without HE splash.
- Magazine damage capacity (rounds x damage): Merlin 1,200 x 3 = **3,600**; Kestrel 600 x 3 + 120 x 26 + 1,000 x 9 = **13,920** (26 percent). That is the "no big magazine": it is built in by leaving out the MD-9 and the HE mounts, not by a per-ship ammo field (ammo is a weapon property).
- Both guns in one group on the nose: no group 2. (The Kestrel's two groups exist because it has a heavy-hitter and an HE cannon to choose between.) Simplicity for the AI and the touch UI: no new binding, no new HUD line.
- **Missile stores:** `"stores": {"ir": 2, "flare": 12}`. Launch point `[1.7, -0.32, 0.3]` (x alternates left/right, one pylon per wing, nose of the missile).
  - `ir` x 2 (SW-9 SWIFT: 26 damage, 10 m blast, range 1,700 m, IR, flare resistance 0.7): the owner sketch. 52 damage of ordnance vs the Kestrel's 4 x 26 + 2 x 34 + 170 = 342 (15 percent). No `rf` (LN-3) or `torp` store keys, like the Darter.
  - `flare` 12: between the Darter (8) and Leaper (10) and half the Kestrel's 24. The AI's evade loop spends flares at 0.9-1.9 s intervals; 12 flares last about 18 s of continuous deployment. Reason: the screen is exposed to more missile fire than the Kestrel; cheaper to keep a modest pool than to let it fall to zero by design. This is a choice; the sketch does not specify flares.
- Ordnance total (magazine damage plus missiles): Merlin 3,652 vs Kestrel 14,262 = 26 percent.
- **No new weapon proposed.** A genuine light PD weapon (a small turret like the PD-30 on the Halberd) would be a new thing; the sketch does not ask for one and `turrets` is empty here.
- Energy/ammo implications: both weapons are chemical. No energy draw, no capacitor use. Rearm at a Tender restores both pools at 40 rounds/s per mount (docs/WEAPONS.md) and a missile per 2 s; a Merlin returns to full in about 15 s of service for the guns, 4 s for the missiles.

## (g) Power

Step-1 model (docs/POWER.md, `src/16_db.js`): `energyRegen = plantMW / 3`, `energyMax = capacitorMJ`, 1 energy unit = 1 MJ. `power: { "plantMW": 36, "capacitorMJ": 60 }`.

- Weapon draw (as in `tools/power_table.py`: energy per shot / cooldown, summed over simultaneous energy-costed mounts): MK-20 has no `energy` field, so the draw is **0 MW**; the weapons bus is 36 / 3 = **12 MW** and it is never loaded. The calculation shows: peak draw 0, sustain not applicable (tool prints `-`). Verified by running `tools/power_table.py` on a scratch copy of the database with the fragment merged in: `merlin  fighter  36  12  60  1  15  0  -  -`.
- Kestrel for comparison: 51 MW / 100 MJ, bus 17 MW; its MD-9 draws 30 / 1.8 = 16.7 MW, sustain 102 percent.
- Why 36 and 60: no weapon requires more, so the number only matters for the later power-model steps (shields and engines on the buses, `docs/POWER.md` step 3). Chosen as 0.7 x the Kestrel's 51 (length ratio 0.73), rounded to a multiple of 3 so that each bus is an integer (12 MW).
  The capacitor is 60% of the Kestrel's 100; no consumer uses it today. **Both are placeholders** and I make no claim about them beyond that.
- Sanity check for a later fit: if a single MD-9 (16.7 MW) were ever added, the 12 MW bus would sustain 72 percent; with the default 51 MW it sustains 102 percent. So the smaller plant does constrain what energy weapons the airframe could ever carry, which fits the doctrine.
- Consequence for the player: the ETS **WEAPONS** channel has no effect on a Merlin (no energy consumer; the Kestrel's MD-9 was exactly what made it useful, see `docs/WEAPONS.md` section 7 "dead ETS WEAPONS channel"). Merlin pilots will run SHIELDS / ENGINES-heavy splits. The AI's `powerShift` logic moves points toward weapons "when the capacitors run low" (they never do on a Merlin), so it will behave sensibly by itself.

## (h) Balance reasoning

Per-body comparison from the database (derived numbers marked as such):

| | Merlin | Kestrel | Darter | Leaper |
|---|---|---|---|---|
| Hit points (kinetic, structure path) | 69 | 146 | 40 | 73 |
| Raw gun damage/s | 70.6 (kin) | 131.6 (kin) | 56 (kin, 2 x R-9 4.5 / 0.16) | 154 beam peak + 28 maser bolt (en) |
| Gun range | 1,620 m | 1,620 / 2,720 / 2,000 m | 1,800 m | 950 m beam, 858 m bolt |
| Magazine damage | 3,600 | 13,920 | 2 x 400 x 4.5 = 3,600 | energy, unlimited |
| Missiles | 2 SW-9 | 4 SW-9 + 2 LN-3 + 1 HM-1 | 2 SK-1 | 2 SK-1 |
| `maxSpeed` | 175 | 150 | 165 | 120 |

(Beam damage per second is the weapon's peak multiplier x dmg / cd; the beam only reaches it after `acq` and `ramp` seconds on target (`docs/LASERS.md` section 6), so the "peak" figures are the ceiling, not the average.)

**Cost of loss.** The repository has no unit cost table (`docs/ECONOMY.md` proposes deriving class costs from a physical proxy and keeping the ratios fixed; nothing is implemented). Using hit points x firepower as an unquantified proxy:
the Merlin is about 0.47 of a Kestrel in survivability and 0.54 in gun damage per second, 0.26 in magazine, 0.15 in missiles. A fair price is therefore not above about 0.4-0.5 of a Kestrel; if its price is higher, it is a worse trade than the Kestrel, not a cheaper one, since the Kestrel combines all those numbers in one hull, one pilot and one reactor target. The intended cost of loss is a *pilot and a cheap hull*; a stated cost must be set by the owner (open question 1).

**Kill speed.** At equal accuracy: against a Darter (hit points 40 kinetic) the Merlin's guns need about 0.6 s of continuous hits; the Darter's guns need about 1.2 s on the Merlin (69). In an equal-accuracy exchange the Merlin kills about twice as fast. But the Darter turns 56 percent harder in game (11.1 vs 7.1), so it will often get the nose to bear first; the Merlin's closing speed (175 vs 165) and wider fire cone (it fires 23.5 rounds/s) offset this partly. Against a Leaper (hit points 74): the Merlin needs about 1.0 s on target; the Leaper's two M-1 beams at peak need about 0.3 s on the Merlin (48-62 hit points / 154 dps) but only after they have acquired for 0.35 s and ramped for 0.5 s, and only inside 950 m, where the Merlin's 1,620 m cannon outranges it. The Merlin therefore wins the approach and loses the knife fight.

**Survivability against ordnance.** A single SK-1 (31.2 damage, blast 9) takes the Merlin's shield (22) and most of its structure. One hit leaves a Merlin at about 10-20 percent structure; two kill it. The Kestrel survives about 2.5 missile hits. A Merlin flight is therefore about as vulnerable to missile fire as to guns, and the evade/flare logic matters more than for a Kestrel (hence 12 flares).

**Intended expectation (hypothesis, not measured):**
1. 1v1 Merlin (skill 3) vs Darter (skill 3): Merlin wins **55-70 percent**. Vs Leaper: Merlin wins **25-40 percent**. Vs Kestrel: Merlin loses **70-85 percent** (a Kestrel has 2.1x the hit points and HE).
2. Combined value: **2 Merlins are about 1 Kestrel** in hit points (138 vs 146) and raw gun damage (141 vs 132), and better in speed; they are worse in magazine, missile and shield-stripping. The Kestrel's HE splash and MD-9 pierce are not replicated by Merlin numbers. So the exchange rate for a mixed fleet is intended to be **8 Merlins about 4 Kestrels against 10 FROGG fighters** (the established 45 percent human win cell, Wilson 95 percent interval 25-66 percent over 20 runs, `docs/BALANCE_TESTS.md`). If it takes **fewer than 6** Merlins to match 4 Kestrels the Merlin is too good for its price; if it takes **more than 10** it is a bad ship.
3. The Merlin's value is concentrated in interception and numbers, not 1v1; that will not show up in a duel-only test. Only its sub-role (killing bombers and missiles) needs a separate scenario.

**Test plan (seeded, at least 20 runs per cell, per AGENTS.md; each cell quotes wins/runs and a Wilson interval, otherwise no claim):**
- T1 (the exchange rate): `tools/tests/duel2.py`-style cells with the Merlin spawned instead of the Kestrel: N Merlins vs 10 FROGG (Darter/Leaper/Darter/Spitter/Leaper mix, skill 3 vs 3), N = 6, 8, 10, 20 seeded runs each (`?seed=`), arcade flight. Pass: the 8-Merlin cell human win rate lies within the 4-Kestrel cell's interval (25-66 percent).
- T2 (1v1 duels): Merlin vs Darter, vs Leaper, vs Kestrel, 20 seeds each, skill 3, spawn separation 1,800 m, record win fraction, time to kill, ammunition left, losses by cause (reactor vs structure). Pass: inside the bands above; the reactor-kill share is reported because it validates risk 1.
- T3 (the screen): 4 Merlins vs 2 Toad (bomber, 55 structure) escorted by 2 Darters, Toads heading for a Halberd: number of Toads killed before launch, Merlin losses. Without an interception behaviour (section a) this measures only the stock `fighter` AI; a null result is an argument for open question 3.
- T4 (missile exposure): two Merlins vs 4 Darters armed with SK-1; flares spent; damage per missile. Confirms the flare count.
- Regression: `tools/tests/magazine_t.py`, `muzzle_t.py` (mounts on a visible barrel), `tools/validate_db.py`, `tools/power_table.py` unchanged.

## (i) Voxel design brief (for the geometry pass)

Frame: ship space, **-Z nose, +Y up, mirrored about X** (as `src/30_ships_human.js`). Length 9.0 m (nose tip z = -4.5, nozzles to z = +4.9), span 7.8 m (wing tips x = +-3.9), height y from -0.9 (missile pylon) to +1.5 (fin tips), within `half` [3.9, 1.6, 5.0].

**Palette (consistent with the Kestrel, `K` and `H` at the top of `src/30_ships_human.js`):** hull `0x727a84` (K.hull), secondary `0x626a74` (K.hull2), light panels `0x8a919a` (K.hull3), dark `0x3a4048`, white `0xd5d9dc`, canopy `0x1c2a36`, amber `0xc79a3a` (wing-tip strips and fin tips as on the Kestrel). Distinguishing change: more white and light grey on the upper surface than the Kestrel and **one orange identification band** on each tail fin (H.orange `0xd9772b`, already in the `H` palette), so the same CDF family reads as the lighter hull. Engine glow `H.glow` `0x7fd0ff`, nozzles `H.nozzle` `0x2a2d33`, flame `#66c8ff` (already in the fragment).

**Silhouette:** a compact dart. Narrow chined fuselage, drooping chin nose with a dark sensor tip; a single bubble canopy ahead of centre (centre about z = -1.8, the `eye`); low swept wing plates reaching from z = -0.2 at the root to the tip at z = +3.4; two canted tail fins at x = +-0.9, tips at y = +1.5; **two** close-set engine nacelles at x = +-1.5 (the Kestrel has four, in two-per-side pods further out); no boom, no wing-tip guns, no dorsal avionics block taller than the fins.

**Key features and positions (single source: the db fragment):**
| Feature | Position | Notes |
|---|---|---|
| Cannon barrels (2) | muzzles [+-0.55, -0.30, -4.75] | slim barrels, 1.5 m long, flush with the chin, tips slightly beyond the nose tip (-4.5); muzzle ring `0x20252b`. Required by AGENTS.md: a visible barrel at each `mounts[].pos`. Check with `tools/tests/muzzle_t.py`. |
| Cannon breech / `gunL`, `gunR` | [+-0.55, -0.28, -3.2] | fairings along the chin |
| Radar | [0, -0.1, -3.8] | dark nose sensor, exposed |
| Engines (2) | nozzle [+-1.5, 0.15, 4.75] r 0.5 | large single nozzles with petal ring, `H.glow` core; comps at z = 3.7 |
| Shield generator | [0, 0.2, 0.9] | dorsal, white-panelled, small antenna blade |
| Reactor | [0, 0, 2.0] | inside the fuselage; vent grille on the spine at z = 2.0 |
| Missile pylon + launch | launch [1.7, -0.32, 0.3] (x mirrors) | one short pylon under each wing at x = 1.7; the missile mouth (launch point) at the pylon nose, z = 0.3. AGENTS.md rule: launch point at the pod mouth, not on bare hull. |
| Flare dispensers | tail, y 0.5, x +-0.5, z 4.3 | small dark slots (no db entry needed) |

**What makes it read as a light fighter at 100 m:** at 100 m the Kestrel subtends about 7 degrees, the Merlin about 5; at that size only these can be seen: (1) the **two** glowing nozzles (the Kestrel shows four); (2) **no side booms or wing-tip guns**, an uncluttered delta outline; (3) the white dorsal spine and light upper panels against the grey belly; (4) the orange fin bands; (5) the overall span-to-length of 0.87 (Kestrel 0.84, Darter 0.97), giving a compact rather than a long outline, contrasting with the Kestrel's long gun booms.

Voxel budget: below the Kestrel (smaller bounding volume); keep the detail tiers (lod 2-3 greebles) as the Kestrel, no `resMul`.

## (j) Open questions for the owner, and risks

**Open questions** (real ones only):
1. **Price / exchange rate.** There is no cost model. Is "8 Merlins about 4 Kestrels" (value 0.5 each) the intended exchange, or should the Merlin be worse per body (cheaper still, say 12 for 4)? Everything in section (h) assumes about 0.5.
2. **Afterburner.** `32_scale.js` gives every human fighter the same 20 s / x 1.8 afterburner. The Merlin gets only the higher base speed (315 vs 270 m/s). Is that enough, or should the Merlin get a longer pool or higher multiplier (a code change into per-ship `abMax`/`abSpd`)?
3. **Interception behaviour.** The AI has no point-defence / interceptor role. Do you want a minimal AI change (prefer bombers and inbound missiles for `ai.role` fighter units flagged light) or is "interceptor" only a lore/doctrine label for now? Without it the T3 test can only show the stock behaviour.
4. **Armour type and reactor.** Composite 0.30 is a placeholder. Hard armour would make the Merlin immune to FROGG maser fighters' small hits (energy 0.4x) at the cost of kinetic vulnerability; and the reactor (15 hp) is the main failure mode. Keep composite, and keep 15 hp?
5. **Unused ETS WEAPONS channel.** With no energy-costed weapon the weapons channel is dead on a Merlin (as it was on the Kestrel before the MD-9). Accept that, or give the Merlin one cheap energy-fed weapon (this would be a deviation from the owner's sketch and would need a new weapon id)?

**Risks.**
- **Reactor-kill dominance (measurable by T2).** A dead `power` component kills the ship; with reactor 15 hp, `r` 0.8 and the nearest-component rule, rear-aspect hits (the usual dogfight geometry) will kill via the reactor well before structure is exhausted. If T2 shows more than about 60 percent of deaths by reactor, raise reactor hp to 18 or move it forward-inboard.
- **Component overlap on a small hull.** Component capture radius is `r x 2.2 + 0.8` (about 2.3-3.2 m) on a 9 m hull; zones overlap heavily, so fine placement matters less than relative proximity.
- **Dead energy channel** (g) and **inert `sig`** (e) are existing system properties; they make two of the Merlin's numbers decorative today.
- **Speed vs Drone.** 175 m/s is inside the 15 percent band of the Drone's 190; if drones are used as wingmen of Merlins, a Merlin wingman may outrun the pack on cruise. AI cruise is separated by `aiSpeed` (drone 150 vs Merlin default 140).
- **Magazine capacity is per-mount weapon data**: "no big magazine" is achieved by omission (no MD-9, no HE), not by a Merlin-specific ammunition number; if the cannon pool changes, the Merlin changes with it.
- **Evidence quality.** All balance statements in (h) are hand arithmetic on db numbers plus the existing 20-run Kestrel cell; the Merlin has never been in the sim. The AI skill, `aggr` and the interception gap can move the results by more than the design margins above.

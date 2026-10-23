# Bittern (CDF torpedo bomber): ship specification

Status: owner decisions recorded 2026-10-23; geometry, database entry and AI behavior implemented. Companion file:
`docs/ships/bittern.db.json` is the drop-in `data/db.json` value (no `prims`).

What was verified: the JSON parses and passes `tools/validate_db.py` and `tools/power_table.py` when inserted into a scratch copy of
`data/db.json` (the repo file was not touched). Damage numbers below are hand arithmetic over the pipeline in `src/65_combat.js`
(`applyHit`) and `src/60_weapons.js` (`blastAt`, `nukeAt`), reproduced with a short script. The browser smoke test covers spawn,
weapons, URL access and Shipyard loading; balance claims in section (h) remain priors, not measurements.

Sources read: `docs/SHIP_CLASSES.md`, `WEAPONS.md`, `NUKES.md`, `CAPITAL_COMBAT.md`, `DATABASE.md`, `POWER.md`, `ARMOR.md`, `SHIPS.md`,
`LORE.md`, `LORE_FACTIONS.md`, `FLEET_LOGIC.md`, `AGENTS.md`, `data/db.json` (Kestrel, Toad, Halberd, Gulper, Bullfrog),
`tools/power_table.py`, `src/70_ai.js`, `src/60_weapons.js`, `src/65_combat.js`, `src/32_scale.js`, `src/30_ships_human.js` (palette).

---

## (a) Role and doctrine

**Purpose.** Put heavy ordnance (HM-1 Hammer, NK-1 class) into corvettes, frigates and carriers. It trades agility for payload,
shield and crew. Alone it is a target; with a Kestrel screen that has already broken the enemy fighters it is the only human
hull that can cost a FROGG corvette its shield and most of its structure in one pass.

**Doctrine (intended).**
1. Kestrels sweep first and kill the fighter screen. The Bittern holds 3 km behind the sweep, not in the furball.
2. Straight approach at cruise (66 m/s) to the release point; no jinking, the torpedo is the manoeuvre.
3. Release at 0.8 x HM-1 range = 1,600 m, one torpedo per 1.6 s. Four torpedoes take 4.8 s and close about 320 m, so the last
   leaves at about 1,280 m. 1,600 m is outside Halberd/Exeter PD-30 reach (900 m), outside Gulper lance reach (1,500 m) and inside the
   Gulper rod reach (3,080 m): the rods are the Bittern's main killer in this approach.
4. Break away, then fall back behind the Kestrels. Several Bitterns release together: a salvo of 8 to 16 is the only answer to flak.

**How the AI flies it (`bomberAI`, `src/70_ai.js`, `ai.role: 'bomber'`).**
- It switches from a non-capital target to the nearest available capital. If no capital is available, it uses fighter tactics without
  changing `ai.role` or aggression.
- It launches HM-1 when locked, `mslT <= 0` and within 0.8 x range; the interval is 1.6 s. Flares are dropped when a missile is inbound
  at 70 to 520 m.
- Empty stores or the close pass trigger a 6 s break-away. After the last store, it then forms 90 m behind the nearest friendly
  non-bomber. The same AI behavior applies to the Toad.
- An explicitly scripted NK-1 loadout gets a release branch only when locked, beyond 1,800 m from the target, and no friendly ship is
  within 1,500 m of the target. It immediately breaks away. This keep-clear is not a fix for the NK-1 crew-dose bug; scripted nuclear
  use remains hazardous.
- Kestrels never fire `torp` (`missileLogic` is called with `ir, rf, tick`), so the Bittern is the first human user of `bomberAI`.

**What it is bad at.** Everything else: no fixed guns that point aft (mounts fire -Z only), turn 2.28 rad/s against the
Kestrel's 6.27, no fighter-killing weapon beyond two nose HE guns and two PD turrets, and no way to hide: the enemy squad logic
(`squadFocus`) multiplies the distance to a bomber by 0.6, so FROGG fighters rank it above Kestrels. Enemy bomber priority is
already in the code; the escort must absorb it.

---

## (b) Lore line and crew

**Lore line.** *BITTERN, CDF torpedo bomber, 22 m, crew 2. Named for the marsh heron that stands still and strikes once. It
carries four Hammer torpedoes (or three and a tactical warhead) to a firing point 1.6 km from a capital hull, and it is flown by people
who are trusted to turn round afterwards. Without Kestrels in front of it, it is cargo.*

**Crew 2** (owner decision 2026-10-23; the gunner is automated):
| Seat | Job | In the engine now |
|---|---|---|
| Pilot | flies; fires nose HE | player or AI pilot |
| Weapons officer | locks and releases ordnance | specialist seat is automated, as for the Kestrel |

The two-seat EP-2 tandem survival pod (`LORE_FACTIONS.md` section 5) fits the crew. PD turrets and countermeasures remain automatic.

---

## (c) Dimensions and silhouette targets

| Field | Value | Reason |
|---|---|---|
| `length` | 22 m | Kestrel 12.4, Toad 19, planned Falchion about 18 (`LORE_FACTIONS.md`). A bomber must not be smaller than the heavy fighter it ships with; 22 m gives a 7 m torpedo row (HM-1 mesh 5.7 m, NK-1 6.2 m) plus mounts. Far below the 500 m cap. |
| `half` | [9.0, 3.4, 11.0] | span 18 m = 1.0 x Toad 17.6 (straight wings, not a long fuselage); height 6.8 m includes tail-fin tips (+3.4) and the cradle underside (about -3.1); z = length/2. |
| `radius` | 11.5 | ratio radius / corner distance is 0.81 (Toad 11/13.6) and 0.77 (Kestrel 6.6/8.6); corner distance here is 14.2; 14.2 x 0.81 = 11.5. Drives hit sphere, PD flak interaction and crash. |
| `seam` | [2.2, 1.6] | Kestrel [1.5, 1.1] scaled by length (1.77x) and rounded. |
| `eye` | [0, 2.2, -7.2] | Kestrel's eye sits at its canopy top; the Bittern canopy peaks at y = 2.35 at z = -6. |
| Cross-section | fuselage 3.4 m wide, 3.7 m deep | gives the torpedo cradles (x = +-3.0) room under the wing roots. |

Voxel cost: pitch = length / (detail steps x (22/12)^0.4 = 1.275). At detail 112 that is res 143 and pitch 0.154 m; a 0.6 m torpedo
is about 4 voxels across at that setting, 2 at detail 64, about 1 at detail 24. Surface area is about 3.1x the Kestrel's at equal
pitch; expect 1.6 to 2x the Kestrel's instance count after the coarser pitch. Not measured.

---

## (d) Performance against Kestrel and Toad

Effective turn = `turn` x 2.85 (all fighters, `32_scale.js`), x 1.5 more for FROGG. Speeds are m/s, turn rad/sim-s.

| | Kestrel | FROGG Toad | **Bittern** | Reason for the Bittern value |
|---|---|---|---|---|
| Length m | 12.4 | 19 | **22** | section (c) |
| `maxSpeed` | 150 | 78 | **90** | owner: slow. 0.60 x Kestrel so Kestrels can circle it. Above the Toad (78) because it is a 2-nacelle human hull, but below Reaver/Spitter-class speeds. |
| `aiSpeed` (cruise) | 0.8 x max by default | 58 | **66** | the Toad ratio (0.74) kept; `bomberAI` throttle is max(0.7, aiSpeed/maxSpeed). |
| `accel` | 75 | 40 (x1.3 = 52) | **32** | thrust about 2x Kestrel on about 4.3x the box volume (9 x 3.4 x 11 = 337 vs 79), with 4 torpedoes aboard. |
| `turn` (raw) | 2.2 | 0.9 | **0.8** | crewed, no neural slaving; the HM-1 lock cone vs a capital is 0.45 x 1.9 = 0.86 rad, so the nose need not swing far. |
| Effective turn | 6.27 | 3.85 | **2.28** | 180 degrees takes 1.38 sim-s (Kestrel 0.50, Toad 0.82). |
| Shield fore/aft | 40/40 | 26/22 | **90/80** | owner: well-shielded for its size. Fore larger: the approach is nose-on into PD and guns. |
| `shieldRegen` | 1 | none | **2** | 45 s sim to refill 90, same time constant as the Kestrel's 40 s. |
| Structure | 50 | 55 | **140** | 2.8x Kestrel, 2.5x Toad. |
| Armour | composite 0.44 | composite 0.45 | **ablative 0.50** | see (e). |
| `sig` | 1 | 1.4 | **1.6** | Toad scaled by length (1.4 x 22/19); lock time = lockTime / (sig x 0.7). |
| Stores | 4 SW-9, 2 LN-3, 1 HM-1 | 3 ST-2 | **4 HM-1, 2 SW-9, 32 flares** | (f) |
| Crew | 1 | 1 | **2** | (b) |
| Points to kill, fore, damage units (no pierce, no cap) | kin 146 / en 121 | kin 137 / en 121 | **kin 315 / en 632** | shield/mult + structure/(1 - stop); ablative stop 0.25 kin, 0.75 en. |

Afterburner: not in the database. `32_scale.js` gives every `cls: 'fighter'` the human pool (20 s, x1.8 speed): a Bittern would burn at
**162 m/s, faster than a Kestrel's cruise cap of 150**. The AI never uses it (`aiFly` in `bomberAI` passes no `ab`), the player would.
This contradicts "slow". See open question 4.

Mass class: `cls: 'fighter'` means crash mass 1 (same as a Kestrel). A 22 m bomber ramming a Kestrel is under-modelled.

---

## (e) Survivability

- **Structure 140.** Reason in (d).
- **Shield** fore 90 / aft 80, regen 2/s after 4 s without a hit (`85_update.js:42`). One generator component, as on the Kestrel.
- **Armour: ablative, rating 0.50.** The approach to a FROGG capital is under energy fire (R-4/R-5 `en` bolts, M-6T, M-8, M-7, fighter
  masers). Ablative stops `rating x prof` = 0.75 of energy, 0.25 of kinetics; composite stops 0.50 of both; hard stops 0.20 of
  energy (0.4 profile) and is the wrong choice against FROGG. `docs/LORE.md` already names ablative as the answer to FROGG lasers.
  Cost: kinetic points-to-kill drops from 409 (composite) to 315; energy rises from 352 to 632. The rate cap is 0.6 x 140 = 84
  absorbed/s per facing with 126 burst: a Leaper at partial beam ramp (about 100 dps, absorbed about 75/s) stays under it; at full ramp (about 180 dps,
  135/s absorbed) or with two fighters on one facing the bucket overflows within about 1 s and the excess goes to structure. So the
  ablative gain is real against a lone attacker and mostly gone against a pile-on; the escort must prevent the pile-on.
  Threshold: `thresh` 0 for ablative, so unlike composite (3 x 0.25 = 0.75) nothing is stopped by size. The armour type is a design
  call with a test arm in (h).
- **Components** (roles only those already in use: engine, gun, shield, radar, power, turret):

| id | role | pos (x,y,z) | r | hp | Note |
|---|---|---|---|---|---|
| engL / engR | engine | (-+4.4, 0.3, 8.0) | 2.0 | 44 | two nacelles, 2 nozzles each; hp 0.31 x structure, Kestrel 16/50 = 0.32 |
| gunL / gunR | gun | (-+1.6, -0.8, -9.0) | 0.7 | 18 | nose HE; Kestrel HE 9 hp, doubled for the larger hull |
| rackL / rackR | gun | (-+3.0, -2.3, -1.6) | 2.4 | 40 | torpedo cradles; Toad rack 20 hp on 55 structure, held at 0.29 |
| tur1 / tur2 | turret | (0, +2.0, 5.6) / (0, -2.0, 5.0) | 1.3 | 18 | PD, r = half the clamped 2.64 m turret (rule: r about half the diameter) |
| shield | shield | (0, 1.1, 0.4) | 1.4 | 45 | Toad 16/55 = 0.29, Kestrel 0.40; 0.32 |
| radar | radar | (0, 0.1, -9.6) | 0.9 | 28 | nose sensor, EXPOSED and SOFT 1.5 |
| power | power | (0, 0.2, 4.0) | 1.8 | 80 | 0.57 x structure (Kestrel 0.60, Toad 0.62); reactor death kills the ship (`compEvent`) so it is kept proportionate, not tanky |

  Exposed-part rule (`EXPOSED`): nacelles (reach 2.2 x r = 4.4 m), turrets and guns (1.6 x r) take 55% of any nearby hit through the
  armour. Rear-quarter fire hits engines first, then the reactor 7 m forward of the nozzles.
- **Self-defence on missiles.** Both PD-30 turrets shoot hostile missiles first (inside 0.75 x 900 = 675 m, or if targeted). FROGG SK-1
  has `hp 1`, PD-30 flak radius 6 m: a Bittern is close to immune to the fighter missiles inside 675 m when ammo remains (1,500 per
  turret, 110 s). Unverified in the build for a fighter-sized hull.
- **Signature.** `sig` 1.6, plus IR plume from 4 nozzles; flares 32 (Kestrel 24) because FROGG SK-1 flare susceptibility is only 0.3
  and the AI drops one per second at most (cmCool 0.8).
- **Rack loss.** Destroying `rackL/R` has no effect in the engine (`launchMissile` never reads the rack component). Cook-off or a
  halved salvo would need code.

---

## (f) Armament and stores

| Mount | Weapon id | grp | Comp | Position | Reason |
|---|---|---|---|---|---|
| Nose HE R/L | `he` (MK-30 HE) | 1 | gunR/gunL | (+-1.6, -0.8, -10.9) | owner sketch: 2x HE. Fixed forward, converge at 450 m. 9 dmg + 8 m blast, 500 rds per mount, no energy. |
| Torp rack R/L | `torp` (HM-1), `store: 'torp'` | 3 | rackR/rackL | (+-3.0, -2.45, -5.2) | same pattern as the Toad's store mount; mount at the cradle mouth. |
| Aft dorsal PD | `pd` turret | - | tur1 | (0, 1.85, 5.6) | the only aft-looking weapon the engine supports with existing ids |
| Aft ventral PD | `pd` turret | - | tur2 | (0, -1.85, 5.0) | covers the lower hemisphere; `sideOk` limits each turret to its own hemisphere |

**Tail defence is not possible with fixed mounts.** `fireMount` aims every fixed gun at (0,0,-450) in ship space. The owner sketch
(2x HE for tail defence) therefore cannot be built with `he` on a fixed mount; HE on the nose is what the sketch can mean today.
A real aft HE gun needs a turret weapon: proposed `heT`, see below. The PD-30 turrets give aft cover now at 1.3 dmg per shell,
range 900, 13.3 shots/s; against fighter armour (composite thresh 0.75, hard 1.5 at fighter scale) that is weak but real.

**Stores** (`stores`): `{ "ir": 2, "torp": 4, "flare": 32 }`, `launch [3.0, -2.45, -5.2]`.
- `torp` 4: owner 3 to 4. Four cradle positions: two per side, side by side (x = +-2.6 and +-3.4). Alternating launch uses |x| of
  `launch` (`launchMissile`), so the model's two torpedoes per side share the mouth line.
- `ir` 2: SW-9 for the pilot against pursuers; the AI uses them only after it has become a fighter.
- `rf` 0: radar missiles add nothing to a bomber and the Kestrel already carries them.
- `flare` 32, see (e).
- **NK-1.** No `nuke` key in the default stores, deliberately. A `nuke` entry adds a selectable missile type to every spawned
  Bittern. Loadout rule: the four cradle positions are interchangeable; a mission or `?nuke=N` may swap 1 HM-1 for 1 NK-1 (3 + 1),
  maximum 2 NK-1 (2 + 2). Nuclear points per `NUKES.md` 4.1 (HM-1 = 4, NK-1 = 5; budget 18 = 16 + 2 SW-9).
  **Warning on the build as it stands:** `nukeAt` kills any non-drone ship by crew dose (`dose >= 30 Gy -> killShip`) with no class
  protection factor. At the 0.5 kT standard load, dose = 40 x (900/r)^2 x (1 - 0.5 x shield fill): lethal out to 735 m (shields up) to
  1,040 m (shields down) from the burst, for a Halberd, a Gulper or a Bullfrog alike. The NK-1 proximity fuze is 120 m + 0.55 x radius
  from the centre, so the burst is about 100 to 115 m from the hull: dose 2,500 to 3,300 Gy, and **one NK-1 that survives flak kills
  any ship in the game, the Bullfrog included**, and every friendly (and the launcher) inside about 1 km, including when PD shoots the
  warhead down (`killMissile` blasts torps). This is the 2.4 bug in `NUKES.md` (CPF / `crewFrac`), not fixed. Until it is, the NK-1
  loadout is a scripted-mission option, not a default.
- **Magazine.** HE 500 rds per mount, pooled 1,000 (110 s at 4.5/s per mount); PD 1,500 per turret. No MD-9 ("Kestrel-mag or nothing
  fixed"): nothing. The pooled gun-empty rule (5%) never matters for a ship whose guns are secondary.

**Release logic implications.**
- Lock first: `lockTime / (sig x 0.7)` against Halberd/Gulper (sig 4) = 0.64 s, Bullfrog (sig 12) = 0.21 s; relock after every launch
  (`L.p = 0`), so the 1.6 s `mslT` is the binding interval.
- 4 torpedoes = 4.8 s at 66 m/s = 317 m of closing. The pilot is committed for 5 s inside 1,600 m with no manoeuvre.
- HM-1 time of flight from 1,600 m: reaches 260 m/s after 2.75 s (412 m), then 4.6 s: about 7.3 sim-s (19 real s). The target moves
  28 to 34 m/s in that time; HM-1 turn 0.9 rad/s copes with that.
- HM-1 `hp 7`: PD-30 flak (1.3 dmg per shell, 6 m radius) kills it in about 6 shells. The acceptance fight recorded 21 of 22 Toad
  torpedoes intercepted (`WEAPONS.md` section 7, item 1). **Assume most HM-1 launched into a PD-30 screen are lost.** This is the
  largest risk to the whole ship (section j).

**Proposed new weapon (not in the JSON):** `heT` MK-30T HE GUN TURRET (S): `he` stats with `turret: true`, `range 1100`, `track 2.6`,
`cd 0.45`, `ammo 300`, `blast 8`. Aft dorsal single mount replacing the dorsal PD if the owner wants the HE tail gun. Needs the three
turret fields that `he` lacks (`range`, `track`, `turret`).

---

## (g) Power (step 1 model, `docs/POWER.md`)

`energyRegen = plantMW / 3`, `energyMax = capacitorMJ`. 1 energy unit = 1 MJ, per second = MW (sim-s).

| Value | Number | Reason |
|---|---|---|
| `plantMW` | 105 | 2.06 x Kestrel (51). Step 1 does not draw shields or engines; this is sized for step 2/3: shields 170 vs Kestrel 80 (2.1x), engines about 2x thrust. Explicit assumption [A], not derived. |
| Weapons bus | 35 MW | 105 / 3 |
| `capacitorMJ` | 150 | 5 MD-9 shots (30 MJ) if one is added; 1.5 x Kestrel (100). Currently only the ETS shift threshold (`energy < 30%`) reads it. |
| Energy-costed mounts/turrets | none | `he`, `pd`, `torp`, `ir` have no `energy`. |
| Weapon peak draw | 0 MW | sum of energy/cd over energy-costed weapons firing at once = 0 |
| Sustain | n/a (tool prints `-`) | no limit; verified with `tools/power_table.py`: `bittern fighter 105 35 150 1 80 0 - -` |
| Reactor hp | 80 | (e) |

What-if, if the owner re-adds an MD-9 (30 MJ per 1.8 s = 16.7 MW): sustain = 35 / 16.7 = 210%, empty never. So the plant is not the
constraint on any fit considered; the magazine (120 slugs) would be. The value is not tested against hand-play (AGENTS.md: no
hand-play data on power).

---

## (h) Balance reasoning

**Damage pipeline used.** HM-1: `dmg 170`, blast 30 m, `exp` (shield x1.0, structure x1.1). Proximity fuze at dc < 0.55 R + 12.
Detonation distance gives `f = max(0.2, 1 - surf/30)`: a contact hit is f = 1; a proximity burst on a Halberd (R = 76) is f = 0.78 and
on a Gulper (R = 88.5) f = 0.81. Per hit: shield absorbs 1:1, then armour stop = min(0.92, rating x prof), then structure x 1.1.
Facing shield pools are separate; no regeneration assumed (4 s hold-off, 6/s).

| Target (facing) | Shield | Structure | Armour | HM-1 to kill, f = 0.78 / 1.0 | After 4 HM-1 (one Bittern), f = 0.78 / 1.0 |
|---|---|---|---|---|---|
| Halberd (fore) | 220 | 420 | hard 0.28 | 6 / 5 | shield 0, structure 41% / 13% left |
| Gulper (fore) | 200 | 380 | composite 0.31 | 6 / 5 | shield 0, structure 34% / 4% left |
| Bullfrog (fore) | 2000 | 3000 | hard 0.30 | 45 / 35 | shield 1,470 / 1,320 left, structure untouched |

Reading: one Bittern, every torpedo landing, leaves a Halberd or Gulper at 4% to 41% structure. **Two Bitterns kill either.** A Bullfrog
cannot be killed with HM-1: 4 Bitterns (16 HM-1) strip the fore shield and take 3% to 18% of structure, if all 16 land. Killing it
needs 9 to 11 Bitterns or a nuclear warhead (and see the NK-1 warning in (f)). Components are hit as well (55% of nearby hits go to
exposed parts), so structure is not the only way to a mission kill; not modelled here.

**Interception priors** (flak, `60_weapons.js:560`): Halberd 4 PD-30 (flak 6 m): high. Gulper 4 R-4 (`en` 1.5 dmg, no flak, 1.6 m
sweep, 600 m reach): lower, roughly one torpedo in two to three lost. Bullfrog 8 R-5 (flak 5 m, `pdOnly`): high. These are guesses
from the Toad's 21 of 22 and need the test below.

**Expected result, 4 Bitterns + 4 Kestrels vs a Gulper and the Bullfrog's screen (hand-estimate, low confidence).** Red: Gulper + 8 fighters
(`scen.py` list: 4 Darter, 3 Leaper, 1 Spitter). The measured baseline is that 10 FROGG fighters are about even with 4 Kestrels
(`BALANCE_TESTS.md`, noise +-2). 8 fighters on 4 Kestrels with 4 slow priority targets in the picture:
- Bitterns launched together with the Kestrels: they arrive in the furball. I expect 2 to 3 of the 4 lost before release; 1 to 2
  Bitterns release (4 to 8 HM-1), of which 30% to 60% land: Gulper killed in about one run in three; Kestrels lose 1 to 3.
- Bitterns staged 25 sim-s later behind the Kestrel sweep: Gulper killed in about half, Bittern losses 1 to 2.
- Rods: two R-12 on the Gulper, 34 kin and 45% pierce (15 to structure/component per rod, through the shield), reach 3,080 m, about 8
  rods during the 11 s approach from 2,370 m. Per rod: 15 pierces straight to structure/component, the other 19 hit the shield at x0.7 (13). The Bittern survives a handful, not eight.
- Bullfrog alone (no fighters): 16 HM-1 against 8 R-5 flak and 6 M-6T/10 R-4: shield dented, no kill. If the owner wants a Bittern to kill
  a Bullfrog, the answer is the nuke, not the torpedo.

**Test that would confirm (AGENTS.md: seeded, >= 20 runs per cell).** New `tools/tests/bittern_t.py` following `duel2.py`/`scen.py`
(one page `?free&seed=99`, `__game.spawnShip`, `update(0.05)` loop; `?seed=` makes the stream deterministic):
1. T0 smoke: `validate_db.py`, `muzzle_t.py` (mounts, launch, turret bases), `tur_t.py` on a fighter-size hull, no console errors, instance count.
2. T1 interception, isolated: stationary Bittern (AI off) fires 4 HM-1 at 1,600 m at a stationary Halberd, then a Gulper, then a Bullfrog; N = 20 each. Record launched / flak-killed / landed / damage. Fixes the f and interception priors above.
3. T2 engagement, 20 runs per arm: Red = Gulper + 8 fighters. Arm A: 4 Bittern + 4 Kestrel together. Arm B: Bitterns spawned 25 sim-s later. Arm C (control): 4 Kestrel only (Kestrels do not fire HM-1). Arm D: Arm B with composite 0.50 armour instead of ablative. Report: Gulper kill %, time, Bitterns/Kestrels lost, torpedoes launched / intercepted / landed.
4. Pass criteria (my proposal, owner to set): Arm B Gulper kill >= 12/20, torpedo landing rate >= 40%, Kestrel losses in B not more than 1 above C. Else the ship is a paperweight and the first lever is HM-1 `hp`/speed, not Bittern stats.

---

## (i) Voxel design brief (geometry pass later)

Ship space: -Z nose, +Y up, mirrored about X (`mirror: true`). Units metres. `half` [9.0, 3.4, 11.0].

**Silhouette.** A broad straight-winged gunship-bomber. Kestrel is a chined, drooping-nose delta; the Bittern must read as the
opposite: blunt stepped nose, long straight constant-chord wing, deep belly, heavy twin tail. Seen from the front it is a flat "H"
(wings plus twin canted fins); from the side a deep belly with a row of torpedoes below.

| Feature | Placement | Notes |
|---|---|---|
| Fuselage | z -11 to +11, 3.4 m wide, 3.7 m deep | dark radome nose z -11 to -9.2 (`radar` at 0, 0.1, -9.6) |
| Nose HE guns | barrels from z -9.0 to -10.9 at (+-1.6, -0.8), muzzle brake rings at z -10.7 | mount pos on the brake face (`muzzle_t`) |
| Canopy | tandem glazed hump, centre (0, 1.6, -6.0), radii (0.9, 0.75, 2.5), colour K.canopy | pilot forward, weapons officer behind; eye at (0, 2.2, -7.2) |
| Wing | straight, 0.5 m thick, root chord z -3.5 to +8.5 at x 1.7, tip chord z 3.0 to 8.0 at x +-9.0 | white leading-edge strip, amber tip band, red/green nav lights at (+-9, 0, 6.5) |
| Nacelles | boxy block x 2.6 to 6.2, y -0.7 to 1.3, z 3.0 to 11.0 per side, dark louvred intake at z 3 | two nozzles per side at x +-3.6 and +-5.2, z 10.9, ring segments as the Kestrel `kNoz`; glow `H.glow` ellipse behind each |
| Tail fins | canted 15 degrees outward, root (+-2.4, 1.6, 8.0), tip to y 3.4 at x +-3.2 | amber tip band; leaves the dorsal turret a clear arc |
| Torpedo cradles | per side x +-3.0, pylon from the belly (y -1.85) down to y -2.1, z -5.2 to +2.0, clamps in amber/dark | two torpedoes side by side at x +-2.6 and +-3.4, y -2.45; nose at z -5.2 (= `launch`), tail at about z +0.5 |
| Torpedoes | 0.6 m diameter, 5.7 m (HM-1), body 0xc8c8c0, nose cone 0xd04a3a, tail dark | NK-1 variant: 6.2 m, 0xe8e0a0 body, yellow band |
| Dorsal PD seat | base (0, 1.85, 5.6), seat prim + drum (as `hTur`) | turret assembly from `makeTurret` (2.64 m dia) |
| Ventral PD seat | base (0, -1.85, 5.0) | clear of cradles (end z +2.0) |
| Dorsal avionics block | (0, 1.1, 0.4), low dark box with amber dots | marks `shield` |
| Antennae / sensor legs | as the Kestrel | `radar` exposed |

**Palette** (Kestrel `K`, `src/30_ships_human.js`): hull 0x727a84, hull2 0x626a74 (belly and wing undersides), hull3 0x8a919a (dorsal
plates), dark 0x3a4048 (belly, intakes), white 0xd5d9dc (leading edges, nose panels), canopy 0x1c2a36, amber 0xc79a3a (more amber than
the Kestrel: hazard stripes on the cradles and wing tips). Nozzle H.nozzle 0x2a2d33, glow H.glow 0x7fd0ff.

**What makes it read as a bomber at 150 m.** At 150 m the hull subtends 8.4 degrees (Kestrel 4.7) and the span 6.9 degrees (Kestrel 4.0).
Four cues, in order of value: (1) a row of pale torpedoes under the belly, contrasting with the grey hull; (2) a straight, wide wing
instead of a swept delta; (3) twin outward-canted fins and a dorsal turret blister; (4) a stepped glazed nose without the Kestrel's
drooping chin. Check: render Kestrel, Toad and Bittern at 150 m in side, top and front view and have someone identify the bomber
without being told; at detail 24 the torpedoes are a single voxel row, so the pale colour and the cradle shadow carry them.

Blueprint rule (AGENTS.md): `comps`, `mounts`, `turrets`, `engines` are the single source of subsystem positions. Every position in
the JSON above sits on a feature listed here.

---

## (j) Owner decisions and risks

**Owner decisions (2026-10-23).**
1. **Tail defence:** keep the two specified PD-30 turrets; do not add `heT`.
2. **NK-1:** omit it from default stores. Scripted loadouts may add it; the current crew-dose bug still makes nuclear use hazardous.
3. **AI:** include the bomberAI role-preservation, final-run break-away/return-to-escort, NK-1 keep-clear and escort-cohesion changes.
4. **Afterburner:** accept the inherited fighter afterburner (162 m/s); do not add a bomber override.
5. **Crew:** use two crew; gunner functions are automated and the EP-2 pod remains sufficient.

**Risks.**
- **Torpedo survival is the ship's entire value and is unmeasured.** HM-1 `hp 7` against flak; the Toad's 21 of 22 intercepted is the
  only data. If T1 shows the same for HM-1, the Bittern fails regardless of its own stats.
- **Fuze geometry against the Bullfrog.** Fuze at 0.55 x 305 + 12 = 180 m from the centre can fire outside the 30 m blast reach on a
  beam-on approach (`blastAt` uses `hullGap` for hulls over 150 m radius; no hull within 30 m means zero damage). Nose-on hits are
  fine. Unchecked in the build.
- **Bomber AI has only smoke coverage.** The role-preservation and return-to-escort path pass the browser regression, but the
  engagement and keep-clear behavior have not been validated in seeded balance runs.
- **Fighter-sized hull with PD turrets.** No fighter has turrets in the build; `updateTurrets`, the HUD component list, voxel seats
  and the 2.64 m clamp are untested at this scale. Friendly HE splash (8 m, 50%) near escorts is a separate hazard of the two
  nose guns.
- **Enemy focus.** `squadFocus` already prioritises bombers, so FROGG fighters will concentrate on Bitterns; that is correct for
  doctrine and bad for a single player-flown Bittern.
- **Class mapping.** `cls: 'fighter'` fixes mass 1, armour threshold 0.25, afterburner and the 2.85 turn multiplier; `isCapital`
  is false, so Bitterns are not targets of capital weighting. Intended, but a bomber as `corvette` would change all of it.
- **Plant value** is an assumption until shields and engines draw power (steps 2 and 3).
- **Tuning knobs, if T2 fails:** HM-1 `hp` and speed first; then stores (4 to 6, hull growth); Bittern structure last.

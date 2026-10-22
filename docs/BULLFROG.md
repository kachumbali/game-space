# FROGG Bullfrog: 600 m jump capital with a spine lance and a 36-fighter hangar (design proposal)

Status: **implemented 2026-10-22 (first pass, section 11 lists every deviation from this design and the measured results); sections 1-10 are the original design text, partly superseded by section 11.** Owner decisions (binding, 2026-10-22): name Bullfrog, 600 m, jump-capable;
main weapon a super-heavy XL forward-fixed spine lance (whole ship aims); S-class point defence, ordinary S and M turrets, exactly 2 L turrets
(one dorsal, one ventral); hangar for 36 fighters of mixed FROGG classes; **no FROGG drones** (neuro-slaved pilots, anti-AI); beating it must take luck,
especially if the spine focuses a capital. Everything else below is my proposal with defaults.

Evidence labels used in this file:
- **[V]** read in the code or docs during this session (file named). Nothing was executed.
- **[C]** my arithmetic. I re-implemented the damage pipeline of `applyHit` (`src/65_combat.js`) in a throwaway Python script and applied it to
  stats read from the code. It reproduces the code's formulas as I read them; it is not the game, and it ignores voxel chipping, component splits
  unless stated, and anything the AI does.
- **[A]** assumption or placeholder, tunable.
- **[U]** unsimulated: no headless run of any Bullfrog scenario exists. Every duel time in this file is an estimate with that status.

Time convention: the sim runs at `SIM_SPEED` 0.375 [V `src/10_config.js`, `src/95_main.js`]. Unless a number says "real", seconds are sim-seconds;
real seconds = sim seconds / 0.375 (x 2.67). Speeds and turn rates in `SHIPS` are per sim-second as well.

## 1. Summary of key numbers

| Item | Value |
|---|---|
| Hull | 600 m, `cls: 'capital'`, `half [95, 55, 300]`, radius 305, `jump: true`, `dock: {fighters: 36, corvettes: 0}` |
| Shield | fore 2000 / aft 1600, regen 6/s (see open question 4) |
| Structure / armour | 3000 / `hard`, rating 0.30 (capital threshold multiplier x2, so 12 per hit) |
| Speed / accel / turn | 22 m/s, 2.0, 0.06 rad/s (= 0.0225 rad per real second, see 4.1), aiSpeed 14, sig 12 |
| XL spine | 800 'en' damage, 20% piercing (ignores shield and armour), range 3200 m, 6 s charge (last 1.5 s heading frozen), 30 s cooldown (cycle 36 s = 96 real s), 800 energy |
| L turrets | 2 x heavy lance, peak 13.5 per pulse, 10 pulses/s, range 1800 m |
| M turrets | 6 x acid cannon, 24 per round, 1.3 s, range 1250 m |
| S turrets / PD | 10 x sting (existing) + 8 x thorn (new PD) |
| Torpedoes | 4 tubes, 16 Tadpoles, one in flight per target, reload 18-26 s |
| Hangar | 2 bays, 18 fighters each (36 total: 12 Darter, 10 Leaper, 4 Spitter, 4 Toad, 6 Reaver), one launch per bay per 4.5 s, at most 12 airborne, no recovery |
| Energy | pool 3200, regen 320/s; full fire draws about 142/s sustained, so energy is not the limiter |
| Spine vs Exeter [C] | 3 hits always survivable; the 4th kills if the Exeter's shield cannot regenerate, the 5th kills if it can |
| Components | 40, total 9,390 hp; exposed (direct-hit) parts listed in 4.3 |
| Voxel cost [C estimate] | `resMul 0.7`: about 42k instances at tablet detail, 130k at laptop detail, about 160-190k at the 420 cap |

## 2. Repo facts this design rests on (verified by reading)

| Fact | Where | Consequence here |
|---|---|---|
| Hit order: shield (per facing fore/aft) -> exposed-subsystem direct hit (55% of what is left) -> armour transform -> structure or nearest component (70% component, 30% structure) | `applyHit`, `src/65_combat.js` | Components only take hits once the shield on that facing is gone |
| `pierce` removes that share of a hit before shield and armour; it is added back and reaches structure or a component | `applyHit` | The spine's 20% pierce is a guaranteed 160 per hit |
| Shield multipliers: kin x0.7, en x1.25, exp x1.0 | `DMGX`, `src/60_weapons.js` | Energy weapons drain shields fastest |
| `hard` armour: kin x1.4, en x0.4, exp x1.0 of the rating; threshold 6 x class (fighter 0.25, corvette 1, frigate 1.5, capital 2) | `ARMOR`, `ARMOR_THRESH_CLS` | Threshold 12 on a capital: Kestrel cannon rounds (3) and pulses (7) are mostly stopped |
| Death: structure <= 0 or component `power` hp <= 0 | `applyHit`, `compEvent` | The heart is the second kill path |
| EXPOSED roles and reach factors: turret 1.6, gun 1.6, engine 2.2, radar 1.5, shield 1.3, radiator 1.8 (times component radius); role `bay` and `power` are not exposed | `EXPOSED`, `SOFT` | Bays and heart are reachable only by internal hits within 2.2 r + 0.8 of their centre |
| Non-beam turrets shoot missiles first (target is this ship, or within 500 m, within 0.75 x range), then ships; beam turrets hold their target and prefer big ones; turrets only cover their own hemisphere (`side` +1 dorsal, -1 ventral) | `updateTurrets` | All S, PD and M turrets would act as PD today; role split needs flags (3.4) |
| PD bolt that kills a `torp: true` missile (Tadpole, HM-1, nuke) makes it detonate where it dies | `updateBolts`, `killMissile` | PD kills at 400-560 m are harmless for conventional warheads |
| AI missile budget: one missile at a time per target, nothing inside 350 m, shot only at lock and below 0.7 x range, reload 6-16 s for torpedoes (14-24 s for others) | `missileLogic`, `src/70_ai.js` | Reused for the tubes with a longer reload |
| `capitalAI` today: turn to lead point, throttle 0.7 beyond 900/1100 m, fire group 1 when aim error < 0.03, Tadpole every 5 s on any lock vs capitals; no budget check | `src/70_ai.js` | Needs a lancer variant (section 6) |
| `blastAt` measures distance to a sphere of 0.62 x radius around the ship centre and skips ships where that distance exceeds the blast radius | `blastAt`, `src/60_weapons.js` | **A missile blast on a 600 m hull does nothing if it detonates more than about 217 m from the centre (189 + 28 for a Tadpole).** Prow and stern thirds are immune to missile blasts as the code reads. Not run; see open question 6 |
| FROGG ships have no `shieldRegen` (Gulper, Hive Carrier, fighters); Exeter has 12/s | ship defs | My 6/s for the Bullfrog is a deviation |
| Gulper is authored at 66 m but `scaleShip(SHIPS.gulper, 146)` runs at load (`src/32_scale.js`); in game it is 146 m, structure 380, shield 200/160, composite 0.31, 4 sting turrets, 2 lash, 2 lance, 6 Tadpoles | `src/31_ships_frogg.js`, `src/32_scale.js`, `docs/data/ships.csv` | The brief's "66 m Gulper" is the authored size, not the flown size |
| Exeter in code: 450 m, structure 1600, shield 900/800, shieldRegen 12 (starts 4 s after the last hit), composite 0.27, **4** laser turrets (`LS-2`) + 3 PD (not 3 lasers), 2 rails (70 kin, 60% pierce, 2.4 s), turn 0.08 (not 0.05), energy 2500/350, reactor 800 hp | `src/30_ships_human.js` | Used for all Exeter arithmetic |
| Rule conflict: `AGENTS.md`, `docs/LORE.md`, `docs/SHIP_MANUAL.md` still say "ships under 500 m, only frigates jump" | docs | The owner decision for 600 m overrides; those files need a line when this is built (I was told to edit only this file) |
| Stale data: `docs/data/weapons.csv` shows flaser 2.8, lance 2.4, Tadpole 150; code has 3.5, 3.0, 195 | `src/60_weapons.js` (`FMX` 1.3) | I use the code values |

## 3. Armament

### 3.1 Weapon table (WEAPONS-style fields; "real" in brackets is real seconds)

Reused entries are marked "existing". New entries are in `docs/data/bullfrog_weapons.csv` (same columns as `weapons.csv` plus `charge_s`, `lock_s`, `width_m`, `track_rad_s`).

| id | Class | Count | kind | dt | dmg | cd | range | speed / life | energy | acq / ramp / peak | track (rad/s) | Role |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `spine` (NEW) | XL, fixed forward | 1 | `spine` (new kind: charge then instant ray) | en | 800, `pierce` 0.2 | 30 s after the shot [80 real] | 3200 m | instant | 800 at charge start | none (no focus mechanic) | the ship's turn, 0.06 | Capitals, corvettes; hits whatever is first on the line |
| `lanceL` (NEW) | L | 2 (1 dorsal, 1 ventral) | beam | en | 4.5 | 0.1 | 1800 m | instant | 6 per pulse (60/s each) | 0.6 / 1.0 / 3.0 (peak pulse 13.5) | 0.9 | Anti-capital and anti-corvette; holds one target |
| `acidT` (NEW, from `spitcannon`) | M | 6 (4 dorsal, 2 ventral) | proj | en | 24 | 1.3 | 1250 m | 430 m/s, 3 s | none | - | 1.6 | Anti-corvette, anti-bomber; flag `noPD` |
| `sting` (existing) | S | 10 (6 dorsal, 4 ventral) | proj | en | 1.5 | 0.09 | 800 m | 900 m/s, 0.9 s | none | - | 3.6 | Anti-fighter, backup PD |
| `thorn` (NEW) | S / PD | 8 (4 dorsal, 4 ventral) | proj | en | 1.2 | 0.07 | 750 m | 1150 m/s, 0.8 s | none | - | 4.0 | Missiles, Tadpoles, nukes; flag `pdOnly` |
| `tad` (existing) | launch tubes | 4 tubes, stock 16 | msl | exp | 195 (150 x `FMX`) | AI: 18 + U(0,8) s between launches | 2600 m (AI launches at 350-1820 m) | 280 m/s max, life 26 s, hp 8 | none | - | - | Capital targets only (AI rule) |

Why these numbers:
- **Spine damage and pierce** come from the Exeter arithmetic in 4.4 (800/20% gives "4 hits survivable with regeneration, 3 without"). A 20% pierce also makes
  the shield less than a full defence against it. The earlier default in `docs/OPEN_QUESTIONS.md` item 4 was 50% shield pierce; at 800 damage that kills an Exeter on the 4th hit
  whether or not its shield regenerates (3 survivable, the shield stops mattering), and at 600 damage on the 5th or 6th. I prefer 20% because it keeps the shield and regeneration relevant. [C]
- **L damage** is chosen so that two L turrets match the Exeter's four lasers (4.5 base, peak 13.5 vs 6 base, peak 18; both on the same focus rule from `docs/LASERS.md` section 6). [A]
- **M turrets** are deliberately poor against fighters (slow 430 m/s shells, 1.3 s cycle): the owner wants fighters and missiles to be the danger to fighters, not turrets. [A]
- **thorn** is slightly worse than the human `pd` (1.2 vs 1.3 damage, 750 vs 900 m, 4.0 vs 4.5 rad/s) because `docs/LORE.md` gives humans the better point defence; the FROGG answer is quantity (18 small turrets). [A]
- **Tadpole** reuses the existing entry unchanged.

### 3.2 Spine behaviour (new weapon kind), proposed rules
1. **Charge** (6 s, [16 real]) starts only if energy >= 800, the emitter component is alive, and the corridor is clear (3.5). Energy is deducted at charge start.
2. For the first 4.5 s the ship keeps turning onto its target. At 4.5 s the heading is **frozen** for the last 1.5 s [4 real]: the line can no longer be dodged by turning the hull, only by leaving it.
3. **Fire** at 6 s: an instant ray from the muzzle `[0, -4, -299]` along the frozen heading, 3200 m. The first ship whose voxels it crosses takes `applyHit(800, 'en', pierce 0.2)` (friendlies at x0.5 per `FF.bolt`). A fighter is counted hit if the ray passes within `width/2 + 0.5 x radius` of its centre (3 + 2.7 to 5.7 m); a capital by the normal voxel trace (`traceShip`).
4. **Cooldown** 30 s after the shot; a fizzled charge (target left the cone) costs 8 s.
5. **Telegraph (all required by the owner brief):** seams and muzzle glow ramp during the charge (visible from afar); a rising tone; `SPINE CHARGING` on the player's HUD when the player is within 4000 m and within 0.12 rad of the nose line; from the freeze on, a thin cyan tracer along the line and `SPINE LOCK ON YOU - BREAK` if the player is inside it; a deep sound at the shot. The existing beam-warning path (`warnState.beam`, `playerTrack`) is the model.
6. **Damage states** (reuse `compState`): emitter below 50% hp: charge 9 s and cooldown 45 s; emitter dead: spine offline.

### 3.3 Mounts and positions (for the modeller)
Frame: x is port/starboard (listed for +x, mirrored), y up, z forward is negative. Fractions: `x / 95`, `y / 55`, `z / 600` (so the bow tip is z = -0.5, the stern +0.5).
"Side" is the turret hemisphere in `updateTurrets` (+1 dorsal, -1 ventral). The y values assume the hull surface at that x and z; snap each base to the actual surface after modelling. Each row except the spine is a turret entry in `def.turrets` and a component with the same id.

| id | Weapon | x, y, z (m) | x / y / z fraction | Side | Comp hp | r |
|---|---|---|---|---|---|---|
| spine (mount) | `spine` | muzzle 0, -4, -299; emitter comp 0, -4, -286 | 0 / -0.07 / -0.498 (muzzle) | - | 700 | 13 |
| L1 | `lanceL` | 0, 34, -150 | 0 / +0.62 / -0.250 | dorsal | 260 | 12 |
| L2 | `lanceL` | 0, -30, -150 | 0 / -0.55 / -0.250 | ventral | 260 | 12 |
| M1, M2 | `acidT` | +-44, 30, -70 | +-0.46 / +0.55 / -0.117 | dorsal | 120 | 8 |
| M3, M4 | `acidT` | +-54, 26, 80 | +-0.57 / +0.47 / +0.133 | dorsal | 120 | 8 |
| M5, M6 | `acidT` | +-46, -28, -20 | +-0.48 / -0.51 / -0.033 | ventral | 120 | 8 |
| S1, S2 | `sting` | +-32, 34, -200 | +-0.34 / +0.62 / -0.333 | dorsal | 45 | 4.5 |
| S3, S4 | `sting` | +-40, 34, -10 | +-0.42 / +0.62 / -0.017 | dorsal | 45 | 4.5 |
| S5, S6 | `sting` | +-36, 32, 110 | +-0.38 / +0.58 / +0.183 | dorsal | 45 | 4.5 |
| S7, S8 | `sting` | +-36, -30, -130 | +-0.38 / -0.55 / -0.217 | ventral | 45 | 4.5 |
| S9, S10 | `sting` | +-40, -30, 90 | +-0.42 / -0.55 / +0.150 | ventral | 45 | 4.5 |
| P1, P2 | `thorn` | +-16, 40, -110 | +-0.17 / +0.73 / -0.183 | dorsal | 40 | 4 |
| P3, P4 | `thorn` | +-24, 38, 150 | +-0.25 / +0.69 / +0.250 | dorsal | 40 | 4 |
| P5, P6 | `thorn` | +-22, -36, -60 | +-0.23 / -0.65 / -0.100 | ventral | 40 | 4 |
| P7, P8 | `thorn` | +-26, -34, 200 | +-0.27 / -0.62 / +0.333 | ventral | 40 | 4 |
| tubes (mount) | `tad`, grp 3, `store: 'tad'`; `def.launch` | comp 0, -42, -10; launch point 0, -44, -40 | 0 / -0.76 / -0.067 (launch) | - | 500 | 14 |

Counts: 26 turrets (2 L + 6 M + 10 S + 8 PD). Dorsal hemisphere 15 turrets (L1, 4 M, 6 S, 4 PD), ventral 11 (L2, 2 M, 4 S, 4 PD). The code gives each turret a full hemisphere with a 0.05 margin; there is no
azimuth limit. Optional later: real firing arcs (not needed for the numbers here).
Arc meaning in practice [V]: a target slightly above the hull plane is reachable by the dorsal turrets and almost never by the ventral ones, and the reverse. Targets directly ahead or astern are covered by both, but the spine cannot fire astern (see doctrine: attack from astern).

### 3.4 What the code would need (I did not touch `src/`)
- New weapon entries `spine`, `lanceL`, `acidT`, `thorn` (CSV file) and a `spine` fire path with state `charge/lock/cool` (3.2); it must be excluded from `fireGuns` the way `m.store` mounts are.
- Turret flags: `pdOnly` (thorn: missiles first, ships only inside 300 m) and `noPD` (acidT: never aims at missiles). Without them all 24 non-beam turrets chase missiles.
- Sound `spine` (a licensed sample; see the credits rule in `AGENTS.md`), or reuse `lash` temporarily.
- `def.launch` for the tubes; `EXPOSED.bay` (open question 7).

### 3.5 Energy [C]
`energyMax` 3200, `energyRegen` 320/s (effective 320 x powerMul, which is 1.0 while the heart is above 0; the heart's death kills the ship anyway).
- Spine: 800 per 36 s cycle, 22/s average.
- L turrets: 6 per pulse at 10 pulses/s = 60/s each, 120/s for both. S, PD, M use no energy.
- Total sustained 142/s vs 320/s regen. First 10 s of everything firing: 800 + 1200 = 2000 of the 3200 pool.
- For comparison [V]: Exeter 2500/350 (four lasers 192/s); Gulper 400/70 (two lances at 50/s each, so it drains in about 13 s).
Conclusion: the Bullfrog never runs dry at full power; energy only matters if the owner shifts the ETS allocation (`pw.w`). If a drain lever is wanted, raise L energy from 6 to 12.

## 4. Durability

### 4.1 Stats (`SHIPS.bullfrog`, proposed)

| Field | Value | Compare [V] |
|---|---|---|
| `length` / `half` / `radius` | 600 / [95, 55, 300] / 305 | Exeter 450 / [108, 48, 230] / 235; Hive Carrier 900 authored (2500 after `scaleShip`) |
| `cls` | `capital` | threshold x2, crash mass 2000, nuke kill fluence 8000; AI treats every non-fighter as capital via `isCapital` |
| `structure` | 3000 | Exeter 1600, Gulper 380, Hive Carrier 6000 |
| `shield` | fore 2000, aft 1600; `shieldRegen` 6 | Exeter 900/800, regen 12; Gulper 200/160, none |
| `armor` | `hard`, rating 0.30 | Exeter composite 0.27; Gulper composite 0.31; Hive Carrier composite 0.21 |
| `maxSpeed` / `aiSpeed` / `accel` | 22 / 14 / 2.0 m/s | Exeter 30 / - / 3; Gulper 34 / 26 / 6 |
| `turn` | **0.06** | Exeter 0.08; Gulper 0.2; Hive Carrier 0.03 |
| `sig` | 12 | Exeter 8; Hive Carrier 20 |
| `energyMax` / `energyRegen` | 3200 / 320 | see 3.5 |
| `jump`, `dock` | `true`, `{fighters: 36, corvettes: 0}` | Exeter `{12, 2}` |
| `stores` | `{tad: 16, flare: 0}` | Gulper tad 6 |
| `ai` | `{role: 'lancer'}` | new role (section 6) |
| `resMul` | 0.7 | Exeter 0.6 |

Turn-rate units: `def.turn` is rad per **sim**-second [V `turnToward`]. 0.06 therefore is **0.0225 rad per real second** (1.3 degrees/s): a 90 degree swing takes 26 sim-s = **70 real seconds**, 180 degrees 140 real seconds, with both engine banks at full strength (`turnMul` 1.0; both banks dead 0.45, so 0.027). If the owner's 0.05-0.07 rad/s was meant in real seconds, `def.turn` would need to be about 0.16 to 0.19. I kept 0.06 because `docs/OPEN_QUESTIONS.md` 4 uses the same convention (frigate 0.05 next to a code value of 0.08 for the Exeter). This is the largest feel risk in the design (open question 2). [A]

Why fighters out-turn it [C]: a fighter crossing at speed v at range R sweeps v / R rad/s. A Kestrel at 150 m/s inside 2500 m sweeps faster than 0.06 and cannot be tracked; a capital at 30 m/s is trackable down to 500 m. Kestrel `turn` in the data is 6.27, about a hundred times the Bullfrog's. The spine can only hit a fighter flying a steady line for the whole 7.5 s of lead (charge plus freeze), which is what the owner asked for.

### 4.2 Why `hard` armour [A]
`hard` makes the hull nearly immune to the weapons that FROGG fighters' enemies carry in numbers (cannon, pulse, sting-class fire) and leaves it weak to energy: a held laser burns through. Pass-through per hit once the shield is gone, from the pipeline [C]:

| Attacker hit | Hit size | Shield cost (drain) | Reaches structure / components after armour |
|---|---|---|---|
| Kestrel cannon (kin) | 3 | 2.1 | 0.11 (96% stopped: below threshold 12) |
| Kestrel pulse (en) | 7 | 8.75 | 2.1 (70% stopped) |
| Swift IR missile (exp) | 26 | 26 | 20.0 |
| LN-3 radar missile (exp) | 34 | 34 | 26.2 |
| HM-1 torpedo (exp) | 170 | 170 | 130.9 (+ spall 15 to a nearby component) |
| Exeter rail (kin, 60% pierce) | 70 | 19.6 (the 42 piercing bypasses the shield) | 58.2 including the 42 piercing |
| Exeter / Halberd laser at start of focus (1.5) | 1.5 | 1.9 | 0.02 |
| Exeter laser at peak (18) | 18 | 22.5 | 15.8 |
| Exeter laser at mid ramp (9) | 9 | 11.3 | 4.5 |
| Own Tadpole (exp) | 195 | 195 | 150 |
| Spine | 800 | 640 x 1.25 = 800 shield-equivalent + 160 piercing | 723 after armour and piercing |

So the Bullfrog ignores a Kestrel's guns against its structure (they matter only against exposed parts, below) and fears missiles, rails and held lasers. Switching to `composite` would make cannon and pulse fire roughly 10 times more effective against the hull (threshold still 12); I did not choose that because it removes the "needs capital firepower or luck" property.

### 4.3 Components [V for the mechanism, A for the numbers]
Format follows `comps` (id, role, position, radius, hp). Positions of the turrets are in 3.3. Total 40 components, 9,390 hp. Exposed means the role is in `EXPOSED` (hits within `1.x * r` of it send 55% of the post-shield damage straight to the part, bypassing armour).

| Component | id | Role | x, y, z (m) | r | hp | Exposed? | Effect when lost |
|---|---|---|---|---|---|---|---|
| Spine emitter | `spine` | gun | 0, -4, -286 | 13 | 700 | yes (reach 20.8 m) | Spine offline; <50%: charge 9 s, cooldown 45 s |
| L turrets (2) | `L1`, `L2` | turret | see 3.3 | 12 | 260 each | yes (19.2 m) | that turret off |
| M turrets (6) | `M1`-`M6` | turret | see 3.3 | 8 | 120 each | yes | off |
| S turrets (10) | `S1`-`S10` | turret | see 3.3 | 4.5 | 45 each | yes | off |
| PD turrets (8) | `P1`-`P8` | turret | see 3.3 | 4 | 40 each | yes | off |
| Engines (6, one per nozzle) | `E1`-`E6` | engine | +-24, 12, 262 / +-50, -4, 262 / +-76, 8, 262 | 14 | 330 each | yes (30.8 m, widest reach) | each is 1/6 of `compFactor('engine')`; all dead: speed x0.3, turn x0.45 |
| Shield gland fore | `shieldF` | shield | 0, 32, -40 | 20 | 700 | yes (26 m, x1.2 soft) | `compFactor('shield')` falls to the average of both glands; both dead: shields stop absorbing |
| Shield gland aft | `shieldA` | shield | 0, 30, 170 | 20 | 600 | yes | as above |
| Eyes | `eyes` | radar | 0, 28, -215 | 16 | 500 | yes (24 m, x1.5 soft) | no radar-guided lock; recommended extra rule: beyond 900 m turrets and spine aim at x3 tolerance |
| Heart | `power` | power | 0, 0, 150 | 18 | 1100 | **no** (reach for internal hits 40.4 m) | **ship destroyed** |
| Hangar bay A (forward) | `bayA` | bay | 0, -32, -95 | 22 | 650 | no today; recommended yes (reach 1.4 r = 30.8 m) | its unlaunched manifest is lost (5.3) |
| Hangar bay B (aft) | `bayB` | bay | 0, -32, 90 | 22 | 650 | as above | as above |
| Torpedo tubes | `tubes` | gun | 0, -42, -10 | 14 | 500 | yes (22.4 m) | no Tadpole launches |

Hit-point logic: structure 3000; reference ratios from the code [V]: Exeter turret 90 of 1600 (5.6%), reactor 800 (50%), shield 400 each, bay 400; Gulper heart 230 of 380 (60%). The Bullfrog's heart is 37% of structure, a turret 1.5-9%, so structure damage alone kills it before the heart does unless hits happen to land within 40 m of the heart. The modeller must keep the intact hull at least 42 m thick above and below the heart (dorsal heart dome and ventral drum, 7.3) so casual hits do not reach it.
Because the exposed rule only applies after the shield is gone, **no component takes direct fire while the fore or aft shield on that side is up** (2000 / 1600 to strip, 4.2). Disarming the Bullfrog is a second-stage task.

### 4.4 Worked arithmetic [C], all unsimulated [U]

#### (a) Spine against an Exeter
Exeter: structure 1600, shield 900 fore / 800 aft, composite 0.27, threshold 4.5 (far below any spine hit). Spine: 800 'en', pierce 0.2 -> 160 bypasses everything; 640 meets the shield as 640 x 1.25 = 800 shield damage.
Shield regeneration: 12/s starting 4 s after the last hit; a 36 s cycle gives (36 - 4) x 12 = 384 back, if no other weapon hits the Exeter in between (any hit restarts the 4 s wait).

| Hit | Without regeneration (Exeter under other fire) | With 384 regenerated per cycle |
|---|---|---|
| 1 | shield 900 -> 100; structure 1600 -> 1440 (only the 160 piercing) | same |
| 2 | shield 100 absorbs 100 of 800; the remaining 560 loses 27% to armour (151) -> 409 + 160 = 569; structure 871 | shield 484 absorbs 484; 253 left -> 185 + 160 = 345; structure 1095 |
| 3 | shield 0; 640 x 0.73 = 467 + 160 = 627; structure 244 | shield 384; 333 left -> 243 + 160 = 403; structure 693 |
| 4 | 627 -> **dead** (-383) | 403; structure 290 |
| 5 | | 403 -> **dead** (-113) |

Same result from the aft side (800 shield). So the Exeter survives **3 hits when its shield cannot recover and 4 when it can; the 4th or 5th kills.** This sits in the owner's "3-4 survivable, 5th kills" band. A full cycle is 36 s sim = 96 s real, so a lone spine needs 4 x 96 = 384 real seconds (6.4 minutes) to deliver the killing 5th hit; in practice the Exeter's own fire changes the picture long before that.
If the entry point is within reach of a component the split is 70/30: a hit near a 300 hp rail or 400 hp shield gland usually destroys that component and loses only about a third of the structure damage. Two hits within 49 m of the Exeter's reactor (800 hp) kill it. The spine aims at the target centre, so the entry point is the nearest hull voxel; bow-on shots along the axis land far from the rails (25 m off, outside the 16 m reach) and take the structure case above.
Other targets [C]: Halberd (420 structure, shield 220/220, hard 0.28): one hit kills (572 against 420 after shield); Gulper-class (380, 200/160): one hit; any fighter: one hit.

#### (b) 4 Kestrels (guns and missiles) against a full-health Bullfrog
Kestrel [V]: 2 cannon (3 kin, 0.085 s -> 23.5 rounds/s), 2 pulse (7 en, 0.22 s -> 9.1 shots/s), stores 4 Swift (26), 2 LN-3 (34), 1 HM-1 (170); structure 50, shield 40/40.
- Shield strip at 100% fire and 100% hits: one Kestrel drains 129 shield per second (49.4 cannon + 79.5 pulse); four drain 516/s. Fore shield 2000 -> **3.9 s**.
- Structure after that, 100% fire and hits: 21.6 per Kestrel per second (pulses 19.1, cannon 2.5), **86 per second for four**. All 28 missiles landing: 16 x 20.0 + 8 x 26.2 + 4 x 130.9 = **1053** structure. Remaining 3000 - 1053 = 1947 at 86/s = 22.6 s.
- **Theoretical floor: 3.9 + 22.6 = about 26.5 sim-s (71 real s)** with every shot and every missile hitting, no Kestrel shot down, and no component diverting damage. Not achievable: the Bullfrog's PD (4.5) removes most missiles, and its turrets (below) kill Kestrels.
- Kestrel survival [A guess, U]: against a jinking fighter FROGG gunnery hit about 9% of shots (`docs/OPEN_QUESTIONS.md` 9). About 8 small turrets can bear on one fighter; 8 x 12 shots/s x 7% = 6-7 hits/s of 1.5 each. A Kestrel takes about 21 hits to lose its shield (1.875 each) and about 60 on its structure at 0.84 each: roughly 80 hits, so **about 12 sim-s per Kestrel, 45-50 s for four**, before counting the 6 acid cannons, the held L beams and above all the 12 airborne fighters (4 Kestrels have lost 0/3 against 12 FROGG fighters in `docs/BALANCE_TESTS.md`).
- Conclusion: **4 Kestrels cannot kill a Bullfrog**; the best case (about 26 s of perfect fire) is longer than their expected life. What they can do is disarm it: after the shield on one facing is gone, every hit near a component sends 55% of the damage to it, bypassing armour. Per Kestrel on a component in reach: 0.55 x (23.5 x 3 + 9.1 x 7) = 74 per second. **Four Kestrels remove an L turret (260 hp) in about 1 s, the spine emitter (700) in about 2.4 s** at ideal fire; realistic 5-12 s. Disarming needs the shield stripped first (3.9 s ideal), so a 30-60 s attack window under fire. Actual destruction needs the Exeter's rails and lasers or luck with the heart. I expect a success rate well under 10% for the four Kestrels alone but have no support for a number.

#### (c) Exeter against the Bullfrog
Exeter [V]: 2 rails (70 kin, 60% pierce, 2.4 s); 4 laser turrets (LS-2, 6 base, 0.25 s, focus 0.5 s then ramp 0.8 s to x3 = 18 per pulse, range 1600).
- Four lasers at peak: 16 pulses/s x 22.5 = 360 shield/s; plus rails 2/2.4 x 19.6 = 16/s. Fore shield 2000 / 376 = 5.3 s, plus about 1.2 s for acquisition and ramp = **about 6.5 s**.
- Structure, lasers 16 x 15.8 = 253/s, rails 0.83 x 58.2 = 48.5/s, total **302/s**: 3000 / 302 = **9.9 s**.
- **Ideal total about 16 sim-s (43 real s)**, all four lasers bearing, no target switch, no component diversion, Exeter alive that long. Realistic: 25-40 s, because beams reset on any gap, hits near components split 70/30, and only about 3 of 4 laser turrets bear at a time (three dorsal, one ventral).
- Rails alone: shield 2000 / 16.3 = 122 s, structure 3000 / 48.5 = 62 s; useless as a primary weapon, useful for 42 piercing per round against the shield wall.

#### (d) Bullfrog against the Exeter
- Both L turrets bearing at peak: 2 x 10 pulses/s x 13.5 = 270 raw/s. Exeter shield 900 needs 720 raw en: 2.7 s; structure 1600 / 0.73 = 2192 raw: 8.1 s. With the 1.1 s acquisition and ramp, **about 12 sim-s** (32 real s). One L only: about 24 s.
- Add the M acid cannons (4 in range at 13.5 effective each = 54/s), and one 723-point spine hit per 36 s.
- The Exeter's 3 PD turrets also have to deal with Tadpoles and fighters (4.6). A Bullfrog alone should beat a lone Exeter about 1.5:1 in time-to-kill before the hangar is counted; with the hangar it is a boss. Both numbers [U].

#### (e) S turrets and PD against missiles [C model, U]
Model: a turret that fires continuously at one missile, each shot a random direction in a square of half-width `spread`; the missile is a sphere of radius 1.6 m [V `updateBolts`]; hit chance per shot P = pi x 1.6^2 / (2 x spread)^2 / D^2 (capped at 1), integrated from the engagement edge (0.75 x range) to 100 m at the missile's closing speed. Expected hits per pass and kill probability with n turrets bearing and all firing at the same missile (the code makes them pick the nearest, so they tend to):

| Missile (hp, closing speed) | thorn: hits needed / mean hits | P(kill), 1 / 2 / 4 turrets | sting: hits needed / mean | P(kill), 1 / 2 / 4 | thorn at 60% efficiency, 1 / 2 / 4 |
|---|---|---|---|---|---|
| Kestrel Swift / LN-3, FROGG Tick (1, 420 m/s) | 1 / 4.4 | 0.99 / 1.0 / 1.0 | 1 / 3.0 | 0.95 / 1.0 / 1.0 | 0.93 / 0.99 / 1.0 |
| HM-1 Hammer torpedo (7, 260 m/s) | 6 / 7.0 | 0.70 / 0.99 / 1.0 | 5 / 4.8 | 0.53 / 0.96 / 1.0 | 0.25 / 0.85 / 1.0 |
| Tadpole (8, 280 m/s) | 7 / 6.5 | 0.48 / 0.98 / 1.0 | 6 / 4.5 | 0.29 / 0.88 / 1.0 | 0.10 / 0.67 / 1.0 |
| NK-1 nuke (5, 300 m/s) | 5 / 6.1 | 0.73 / 0.99 / 1.0 | 4 / 4.2 | 0.60 / 0.97 / 1.0 | 0.31 / 0.85 / 1.0 |

Hits needed use hp / damage rounded up (thorn 1.2, sting 1.5). A human **drone** (6 m, shield 6/6, structure 7, armour 0.1) needs about 9 sting or 11 thorn hits.
Reading: with about 9 small turrets bearing on one side (S 6 + PD 4 dorsal, S 4 + PD 4 ventral), the Bullfrog stops essentially any single missile or Tadpole approaching from an open arc. AI Kestrels fire singly (14-24 s apart per ship), so their missiles mostly die. What gets through is a **saturating salvo**: each turret kills at most about one missile per 0.3-0.5 s (retarget plus dwell), so more than about 8-10 missiles inside one second, or an approach through a masked arc (dead-ahead and astern have fewer bearing turrets), overwhelms it. Humans' answer is combined arms: Kestrel guns first remove PD turrets (45 and 40 hp, exposed), then missiles. The nuke assumptions are in section 8.
A PD-killed Tadpole or HM-1 detonates at the kill point (28-30 m blast) but at 400-560 m from the hull that harms nothing [V `killMissile`].

## 5. Hangar doctrine

### 5.1 Complement (36) [A]
Two bays on the ventral hull (bay A forward at z = -95, bay B aft at z = +90), each with its own manifest of 18:

| Class | Per bay | Total | Role | Stores [V] |
|---|---|---|---|---|
| Darter (interceptor, 9.5 m) | 6 | 12 | kills fighters, escorts | Tick 2 |
| Leaper (line fighter, 13.6 m) | 5 | 10 | main body | Tick 2 |
| Spitter (gunship, 16 m) | 2 | 4 | acid cannon vs corvettes | Tick 4 |
| Toad (torpedo bomber, 19 m) | 2 | 4 | 12 Tadpoles vs capitals | Tadpole 3 |
| Reaver (heavy, 19 m) | 3 | 6 | hard-armour heavy | Tick 6 |

Rationale: Darter and Leaper carry the "dangerous to fighters" part (flaser, fang, Tick); 4 Toads give the capital threat a wing can actually deliver (12 Tadpoles against PD that kills singles, 4.6), and are the first thing a mission designer removes to ease a scenario. No drones (owner).
Note [V]: Tadpoles are anti-capital by AI rule (`bomberAI`, `capitalAI` only fire them at capitals) and turn at 1.1 rad/s against a fighter's 4 or more, so they are not a fighter killer. Fighters die to FROGG fighters and Ticks; the Tadpoles are the capital danger.

### 5.2 Launch cadence [A]
- Each bay launches one fighter per **4.5 s** [12 real], the two bays alternate, so on average one fighter per 6 real seconds. A bay under 50% hp: x1.6 interval; dead: none.
- **At most 12 airborne** at once (default). A loss frees a slot; the next fighter leaves on the next bay tick.
- With the cap in force the first 12 are out after about 72 real seconds; refilling to 36 over the fight takes at least 216 real seconds at the cap-free rate.
- Order from the manifest, per bay: D, L, D, R, L, D, T (only while a hostile capital is present), then repeat; Spitters when a corvette is the main target; Toads wait until a capital is within 4000 m.
- Triggers: open the bays when any hostile is within 4000 m, or the Bullfrog is hit; the fight does not begin with all 36 in space.
- **Emergency launch:** below 25% structure, or when the jump spool starts (6.6), the cap lifts and the interval drops to 1.5 s [4 real] per bay.
- Launch point: ventral maws, fighters leave downward and aft of the spine corridor and must clear the cone of +-0.12 rad around the nose line before they may cross it (rule in 6.5).
- Speed context [V]: Exeter alone killed 8 FROGG fighters in 24 sim-s in a single headless run (BALANCE_TESTS), which is about one per 3 s; a Bullfrog launch rate of one per 2.25 s (two bays) is of the same order, so against a lone Exeter the hangar is roughly sustainable and against a flight of Kestrels it is overwhelming. [U]

### 5.3 Bay subsystems and failure
- `bayA`, `bayB`: 650 hp each, radius 22, role `bay`, at the maw (3.3). Not exposed in today's code, so only internal hits within 2.2 r + 0.8 = 49 m reach them; recommend adding `bay: 1.4` to `EXPOSED` (open question 7) so the maws can be sniped like the spine emitter.
- Below 50%: interval x1.6, and 10% of launches from that bay are lost on the rail (placeholder).
- **Bay destroyed: its remaining unlaunched manifest is lost** (the neuro-slaved pilots cannot leave). Up to 18 fighters disappear at once; airborne fighters are unaffected. Both bays dead: no further launches.
- **Recovery: none** (design). Docking in this game does not repair or rearm (`AGENTS.md`), so recovery would only add storage; omitting it keeps the Bullfrog's strength a finite budget. Survivors orbit the Bullfrog within 1500 m and fight on. Fighters that are docked at the moment of a jump leave with the ship (`dock.fighters: 36`).
- If the Bullfrog dies, airborne fighters keep fighting (hive logic) for 30 s, then follow the existing flee-and-break-contact rule. Default; see open question 11.

### 5.4 Mission-balance lever
Yes, and the most useful one. Mission data for a Bullfrog spawn: `hangar` (0-36, default 36), `airborneCap` (default 12; 4-6 for an easy mission), `launchInterval` (4.5), `spineDelay` (first shot not before 15 s), `spineCdMul` (1.0; 1.5 gives 45 s), `tubes` (16), `shieldMul`/`hullMul`. Measured anchor [V BALANCE_TESTS, arcade flight, skill 3]: 4 Kestrels beat 6 FROGG fighters 2/3 and 8 fighters 1/3, and lost to 10 and 12 fighters 0/3 each. A cap of 12 is already above the even point before the capital's own weapons count; for a player flight of 4 Kestrels, a cap of 6 is the designed "fair" value. Voxel cost of 12 airborne fighters is separate (about 4-5k instances each at tablet detail [A], 12k for a Kestrel at mid detail [V]).

## 6. AI doctrine (new role `lancer`)

### 6.1 Summary of behaviour
- Stand-off against **capital targets: 1500-2100 m**; spine range 3200 m, L range 1800 m, Tadpole launch window 350-1820 m. The band keeps L turrets and tubes at their edge while the spine does the work, and stays inside the Exeter's rail range anyway (4400 m).
- Against corvettes (Halberd) and fighters: no range discipline; hold where it is, let the hangar and turrets work. The spine is not used against fighters.
- Never reverses (arcade model has no reverse); drifts at throttle 0 when too close (< 1200 m) and lets escorts screen.
- Retreat: jump when hurt (6.6).

### 6.2 Hull states (one `ai.mode` field)

| State | Entry | Behaviour | Exit |
|---|---|---|---|
| `hold` | no target | `aiFly` throttle 0.1 (as `capitalAI`) | target found -> `close` |
| `close` | dist > 2300 | turn to the lead point, throttle 0.7 | dist < 2300 -> `station` |
| `station` | 1500 <= dist <= 2300 | turn to the lead point (turn-limited by 0.06), throttle 0.15 | dist > 2400 -> `close`; dist < 1200 -> `open` |
| `open` | dist < 1200 | throttle 0, keep turning to the target | dist > 1500 -> `station` |
| `spool` | structure < 25%, or (both glands dead and structure < 40%), or (spine and both L dead and < 50%) | throttle 1.0 away from the nearest hostile capital, emergency launch, jump drive spools 20 s [53 real] | removed (jumped) at 20 s; the heart dying earlier destroys the ship; hits do not interrupt (placeholder) |

### 6.3 Target selection (replaces the capital line in `pickTarget`)
`score = distance x classWeight x (1 + 1.5 x theta / pi)`, lowest wins, where `theta` is the angle between the nose and the target direction (prefers targets the ship can swing onto fast; 90 degrees off costs x1.75), `classWeight` capital 0.5, corvette 0.8, bomber 1.4, other fighters 4. Keep the target at least 20 s unless it dies or a capital appears within 2500 m and within 0.35 rad of the nose. Fighters are never a spine target; with only fighters in the arena the spine stays in `ready` and the hull targets the nearest fighter for the turrets' sake.
**Snap shot on a strike wing:** if the spine is ready and at least 3 hostile ships including a bomber (or 4 fighters) fly within 0.04 rad of the nose line at 800-2800 m, closing, begin a charge. They die only if they hold course for 7.5 s; the telegraph warns the player. Default on for bombers only.

### 6.4 Spine state machine (field `s.spine = {st, t, tgt}`)
```
cool   -> t counts down from SPINE.cd (first value: spineDelay 15)         -> ready
ready  -> begin charge when ALL of:
            target is capital/corvette, dist < 0.95 x range (3040),
            emitter alive, energy >= 800,
            time-to-align = err / (def.turn x turnMul) <= 4.5 s    (the ship may still be turning),
            corridor clear (6.5)
          on begin: energy -= 800; st = charge; t = 0
charge -> every step: aim point = target position + (target vel - own vel) x (6 - t + 0)   (linear lead, capped 8 s)
          turnToward(aim). At t = 4.5: if err > tol -> fizzle: st = cool, cd = 8
                                       else st = lock, heading frozen (turn = 0)
          tol = clamp(0.45 x targetRadius / dist, 0.012, 0.04)   (Exeter at 2000 m: 0.04)
lock   -> t = 4.5..6, heading frozen, tracer on, warnings on.
          corridor re-checked every step; blocked -> hold at 6.0 up to 3 s more, else fizzle with cd 10
fire   -> at t = 6: ray along frozen heading, first ship hit takes the hit; st = cool; t = cd (30; x1.5 if emitter < 50%)
```
`corridor clear`: `friendlyInLine(s, 3300)` [V, existing function] plus a +10 m margin so a 6 m wide ray plus its 0.9 radius test is covered, and no friendly missile or launched fighter inside +-0.1 rad of the nose line.

### 6.5 When it refuses to fire
- A friendly ship (any class, including its own fighters and Gulpers) sits on the line within 3300 m. The same function disables its L turrets' shots when a friendly is on the beam line (existing code in `updateTurrets`).
- The target is a fighter (only the strike-wing snap shot above exceptions).
- Emitter dead, energy < 800, or an eyes outage (optional rule) with the target beyond 900 m.
- Own fighters get a flight rule: when `s.spine.st` is `charge` or `lock`, launched or escorting FROGG fighters keep out of the cone of +-0.12 rad around the nose for 0-3500 m; otherwise the corridor check would block the spine constantly.

### 6.6 Other weapons, targets, torpedoes
- **L turrets** (beam rule, existing): hold one target, prefer big ones (`pr = d` for non-fighters, `d x 1.6` for fighters); do not fire with a friendly on the line; each switch resets the focus. Doctrine: capitals first, corvettes second, fighters only inside 900 m and only if nothing bigger is in range (add a bearing filter later).
- **M turrets** (`acidT`, `noPD`): nearest corvette or bomber; fighters last.
- **S turrets** (`sting`): nearest ship, fighters at distance x1.0 and others x2.2 (existing); missiles when they target the Bullfrog or come within 500 m.
- **thorn** (`pdOnly`): missiles first; if none, ships inside 300 m.
- **Tadpole tubes**: reuse `missileLogic` with a long reload. Conditions: target capital or corvette, `lock.state === 'locked'`, `350 < d < 1820` (0.7 x 2600), tubes alive, stock > 0, **no friendly missile already guided at that target**; then launch one; `ai.mslT = 18 + U(0, 8)` s [48-69 real], initial `mslT` 12. At most two Tadpoles in flight, each at a different target. Reasoning: single Tadpoles die to an Exeter's three PD turrets about 99% of the time [C]; the tubes are a harassment and PD-load tool, and the real torpedo threat is the 4 Toads. Optional lever: a 4-tube salvo against capital targets whose PD count is under 4 (changes the owner's "one at a time" rule, so off by default).
- **Hangar**: `hangarUpdate(s, dt)` called from `lancerAI` (5.2).

### 6.7 Escort by Gulpers
Mission spawn sets `gulper.ai.escort = bullfrog`. Extra rules for the `corvette` role (inside `capitalAI`, which currently handles every non-fighter):
- Station: 600-900 m ahead and **450-700 m to either side** of the Bullfrog's nose line; never inside the spine corridor (+-250 m of the line, 0-3300 m ahead).
- Leash: if farther than 1400 m from the Bullfrog, return to station.
- Targets: the nearest hostile fighter or bomber within 2200 m of the Bullfrog first (sting, lances), then corvettes; capitals only if within 1500 m.
- Cap: two Gulpers per Bullfrog in the default encounter. They are the main answer to Kestrels that dive under the turret arcs.
A Gulper in the line is the spine's most likely friendly-fire block, hence the station rule.

### 6.8 Exact changes to the existing code path
1. `aiUpdate`: unchanged until `if (isCapital(s)) return capitalAI(s, dt);` -> `capitalAI` begins with `if (s.ai.role === 'lancer') return lancerAI(s, dt);`.
2. `pickTarget`: in the line `else if (role === 'corvette' || role === 'capital')` add the `lancer` branch from 6.3.
3. `lancerAI`: the five hull states (6.2), the spine machine (6.4), `missileLogic(s, dt, ['tad'])` with the extra conditions, `hangarUpdate`, the spool/jump check, `fireGuns(s, 0b1)` for nothing (no fixed guns other than the spine, which is not in `fireGuns`).
4. Turret flags in `updateTurrets` (`pdOnly`, `noPD`).
5. Jump removal: a `spool` counter and an end action that sets `alive = false` with a log line, as the existing flee path does at >2600 m. Mission impact: the player can lose the objective if it escapes; per-mission flag `canJump`.

## 7. Geometry brief for the modeller (Gulper kit)

Kit [V `src/31_ships_frogg.js`]: `nMand`, `nKeel`, `nComb`, `nSpike`, `nBlade`, `nNoz`, `nPod`, `nEye` (returns empty by owner decision), `fRef` (maw, rib arches with cyan seams, dorsal spikes), `fDetail` (lod prims). Author directly at 600 m (no `scaleShip`). Palette `N`; acid weapons stay venom green, lance and spine muzzles cyan. Everything must stay inside `half [95, 55, 300]`: the voxel grid is clipped to the box, so a mandible tip beyond z = -300 will be cut off.

### 7.1 Silhouette (top view and side view)
- Long, flat, armoured barrel: 600 long, hull about 140-150 wide at the widest, 190 with blades; hull body about 85 high plus spikes to the 110 box. Mass is forward and mid; the stern fans out into a comb of engine nacelles and blades. Reads as a frog from the front: wide blunt skull, open jaw, no eyes.
- **Split-jaw prow:** two blunt lobes left and right (`ell` at x = +-30, z = -226, radii about [24, 28, 62]) with a 12 m slot between them down the centreline from z = -290 to about z = -190. Four mandibles per side (`nMand`) sweep forward past the lobes, tips at about z = -291, 284, 256. The **spine emitter sits in the slot between the mandibles**: a barrel `seg([0,-4,-250],[0,-4,-296], 6.5, 4.5)` ending in a cyan glowing ring at z = -298 (`ell` glow, `glowF 1.5`), with armoured collar plates. Teeth of `fRef` stay on the mandibles, not in the slot.
- **Dorsal:** rib arches with cyan seams (see 7.3), shell plates stepping down toward the tail, a spike row on the centreline (skip the bases of L1, `shieldF`, the heart dome), flank spike rows at x = +-34. Two raised gland blisters (shield glands) with cyan lights, the eyes plate (flush, dark, no big lenses) on the prow roof at z = -215.
- **Ventral:** a launch drum along the keel, y = -30, from z = -120 to +130 (like the Gulper's, scaled), two hangar maws (dark recesses with pearl lights) at z = -95 and +90, a ring of four torpedo tube muzzles at the front of the drum (z about -40), the ventral L turret forward of the first maw, a short keel spike and a comb of blades aft (`nComb`).
- **Stern:** six cyan nozzles on three nacelle pairs, fanned out on pylons (`nBlade` struts) because the hull tapers to about 30 m half-width at z = +260; trailing blades sweep back to x = 94.

### 7.2 Suggested prims (authored size; the modeller adjusts)
```
core barrel      ell([0,0,30],[68,36,255], N.dk, nSt(6,0.1))
dorsal shells    ell([0,24,10],[52,15,225], N.dk2, ...)   ell([0,32,-30],[34,8,165], N.dk, ...)
flare discs      ell([0,-4,60],[88,9,200], N.dk, ...)     ell([0,-10,90],[74,7,170], N.dk2, ...)
prow lobes       ell([30,-2,-226],[24,28,62], N.dk)       ell([28,8,-210],[20,14,40], N.dk2)
mandibles        nMand(34,16,-236,92,5.5)  nMand(30,-18,-236,80,5)  nMand(54,0,-218,64,4.5)
emitter          seg([0,-4,-250],[0,-4,-296],6.5,4.5,N.bl)  ell([0,-4,-298],[7,7,1.5],N.cy,{glow:true,glowF:1.5})
drum             seg([0,-30,-120],[0,-30,130],20,17,N.dk,{dots:{col:N.pr,p:0.02,f:1}})   cap ell([0,-30,132],[15,14,6])
maws             ell([0,-34,-95],[26,10,34],N.bl,{dots:...})   ell([0,-34,90],[26,10,34],N.bl,{dots:...})
heart dome       tap([0,26,150], ... up to y=+44)    ventral keel under it to y=-44
nozzles          nNoz(24,12,244,296,12)  nNoz(50,-4,240,294,14)  nNoz(76,8,236,290,11)
pylons / blades  nBlade([40,2,150],[78,6,262],3.2)  nBlade([60,2,60],[92,0,290],4)  nBlade([48,-6,90],[84,-8,288],3)
fRef/fDetail     E = [0,0,30,70,38,255], refN 11, disc [0,-4,60,88,9,200], plates 14, gills 8, collars 9, ribs 9, spikes 8, noz as above
```
`fRef` is attached in a loop by definition order (`FD_LIST[i]`), so `fDetail` for the Bullfrog must be called in `SHIPS.bullfrog.prims` after the Hive Carrier's, and `'bullfrog'` appended to that id list [V last lines of `src/31_ships_frogg.js`]. Dimensions I did not verify against the voxeliser: the nozzle lengths and the heart-dome thickness.

### 7.3 Rib arches and the telegraph
`fRef` draws rib arches between about z = -77 and +163 for the E above. For the spine to read as a charging weapon the arches (with cyan seams between them) should reach the bow: add 5 hand-placed arches (`chain` as in `fRef`) between z = -180 and -90. Charge cue (needs a small code addition): scale a cyan `flashAt` at the muzzle and emit sparks along the seams from aft to fore over the first 4.5 s; no per-instance emissive control exists in the renderer today, so a flash plus particles is the cheap version. The seam voxels are already `glow: true`.

### 7.4 Where every subsystem sits (every model view must show them, `AGENTS.md`)
Markers per the key in `docs/SHIP_MANUAL.md` 3: engines (orange rings): the six nozzles; main gun (green square): spine emitter and the two L bases; PD (yellow triangle): P1-P8 and S1-S10; M turrets: green square, smaller; shield generator (cyan diamond): `shieldF` (z -40, dorsal blister) and `shieldA` (z +170); sensors (magenta ring): `eyes` at z -215; reactor (red cross): heart at z +150 under the dome; bays (purple box): maws at z -95 and +90; weapon muzzle (green plus): spine at z -299, tubes at z -40, L turret muzzles. Data source is `comps`, `mounts`, `turrets`, `engines`. Radiators: none (FROGG heat is undecided, `docs/CAPITAL_COMBAT.md` question 6).

### 7.5 Voxel budget [C estimate, U]
Rule [V]: `resFor = min(RES_CAP 420, round(DETAIL_STEPS[idx] x (length/12)^0.4 x resMul))`; length factor (600/12)^0.4 = 4.78; instance count is the shell only (cells with all 6 neighbours solid are dropped). Voxel size `vs = 600 / res`.
Calibration: the flown Gulper (146 m, res capped at 420, vs 0.348 m) has 191k instances at detail 6 [V `docs/SHIP_MANUAL.md` 9]; an ellipsoid area estimate for its main hull (11.5k m2) gives instances ~ 2.0 x area / vs^2. For the Bullfrog the main ellipsoid [70, 38, 255] has about 166k m2; with the same factor (probably higher, because of nacelles, blades and arches: error +-35%): instances ~ 332k / vs^2.

| Device preset [V `src/10_config.js`] | detail index | res (`resMul` 0.7) | vs (m) | Estimated instances |
|---|---|---|---|---|
| phone / tablet (iPad) | 2 (64) | 214 | 2.80 | about 42k |
| laptop | 4 (112) | 375 | 1.60 | about 130k |
| high | 5 (160) | 420 (cap) | 1.43 | about 160k |
| desktop / max | 6-7 (224/288) | 420 (cap) | 1.43 | about 160-190k with tier-2/3 detail (+15%) |

Owner budget ~120k per ship on the iPad: at the tablet preset the Bullfrog is well inside it (about 42k, with seams still above voxel size: the minimum seam `th` in `fRef` is about 3 m). At `resMul` 1.0 the tablet figure would be about 86k. To guarantee 120k at every preset a per-def `resCap` of about 360 (vs 1.67, about 119k) would be needed, one line in `resFor` (not mine to edit). Distance LOD (`normal`) drops 1-3 detail steps for a far ship. The 12 airborne fighters add on top. **Measure after modelling**; this table is an estimate from an area formula, not a build.

## 8. Nuclear placeholders (docs/NUKES.md may override)
- **Hardening:** `NUKE.kill.capital` 8000 J/cm2 applies as it stands [V], i.e. twice the frigate figure and unaltered by armour type. Placeholder, no open source [V `docs/CAPITAL_COMBAT.md` 2.2].
- **Crew dose:** today `nukeAt` incapacitates and kills **any non-drone ship** whose dose reaches 30 Gy, shield-attenuated by up to 50% [V `src/60_weapons.js`]. For a 0.1 kT warhead that is a kill out to about 465 m surface distance with no shield (about 330 m at full shield; `r = dc - 0.62 radius`), which would be an instant kill of a 600 m hull by a warhead detonating next to its centre sphere. **Assumption: Bullfrog is `crewHardened`** (capital hull, deep compartments, neuro-slaved crew kept in shielded cores): no instant crew kill; dose instead adds a temporary penalty (spine charge x1.5 for 10 s). The nuke doc decides.
- **PD vs nuke:** nuke hp 5: 4 sting hits or 5 thorn hits; table 4.4(e) gives 0.73 (1 thorn) to 0.99 (2 thorn) kill chance per pass. A PD-killed warhead still detonates at the kill point (`torp: true`): at 500 m a 0.1 kT burst gives about 10.6 J/cm2 on the hull (0.13% of the kill figure) and a flash blind of about 9 s.
- **Flash blind:** `blindUntil` zeroes only `compFactor` for roles `radar` and `turret` [V]; no code path reads `compFactor(s, 'turret')`, so turrets are not actually blinded today, only radar-dependent (RF) lock. Not a Bullfrog-specific issue.
- No nuclear stores for FROGG ships (docs/LORE.md: nukes not assigned to either side).

## 9. Open questions with my defaults

1. **Class and conflicts.** `cls: 'capital'` (x2 threshold, mass 2000, nuke 8000). `AGENTS.md` ("ships under 500 m, only frigates jump"), `docs/LORE.md`, `docs/SHIP_MANUAL.md` need a line once built. Default: yes, `capital`.
2. **Turn rate units.** 0.06 per sim-second = 0.0225 rad per real second (a 90 degree swing takes 70 real seconds). If you meant 0.05-0.07 per real second, set `def.turn` to 0.16-0.19. Default: 0.06 (matches how earlier docs quote the Exeter's 0.05 against code 0.08). Consider playtesting 0.10.
3. **Spine strength.** 800 damage, 20% pierce, 36 s sim cycle (96 real s). Default as given. Alternatives [C]: 900 damage at 20% pierce kills on the 4th hit with or without regeneration (3 survivable always); 800 at 50% pierce also kills on the 4th.
4. **Shield regeneration.** FROGG defs have none today; I gave 6/s. Default 6 (0 for strict consistency; with 0 the Exeter exercise above is unchanged).
5. **Armour type.** `hard` 0.30. Alternative `composite` 0.30 would make Kestrel guns about 10x more effective against the hull. Default `hard`.
6. **Missile blast reach on long hulls.** `blastAt` skips a ship if the hit is farther than `0.62 x radius + blast` from its centre. For the Bullfrog that is about 217 m of 300 m half-length: missiles detonating on the prow or stern thirds deal nothing (also true for the Exeter at about 174 m of 230 m). Read, not run. Default: confirm with a headless torpedo test before relying on missiles as the Bullfrog counter; the fix is to measure from the hit point, not the centre sphere.
7. **Bay exposure.** Add `bay` to `EXPOSED` (reach 1.4, soft 1.2). Default yes.
8. **Eyes outage rule** (spine and L aim tolerance x3 beyond 900 m). Default off.
9. **Spine and fighters in the line.** Fighters never primary targets; bomber strike snap shot on. Default as written in 6.3.
10. **Jump during battle.** Spool 20 s, not interruptible; the Bullfrog leaves the arena. Mission rule needed for "objective: destroy the Bullfrog" (kill it before it jumps, or a disabled jump drive component). Default: it jumps, and the mission fails or continues by mission flag.
11. **Fate of airborne fighters when the Bullfrog dies or jumps.** Default: fight on 30 s, then flee (existing break-contact rule). A jump takes only fighters that are docked.
12. **Torpedo salvo override.** Default one-at-a-time. A 4-tube salvo against capitals would make Tadpoles a real threat; owner call.
13. **Tadpoles against fighters.** Not a fighter weapon today (AI rule and 1.1 rad/s turn). Fighters stay the danger to fighters; Ticks and flasers do it. Default: leave.
14. **Energy lever.** Not a limiter at 3200/320. Default: leave; raise `lanceL` energy to 12 for a visible drain.
15. **Gulper size.** Flown Gulper is 146 m (authored 66). The escort doctrine uses the flown size. Default: leave.
16. **Exeter facts.** Four lasers and 0.08 turn in code (the brief said 3 and 0.05). Arithmetic uses the code.
17. **Audio.** The spine needs a licensed sample or a reused `lash` temporarily (`docs/CREDITS.md` rule).
18. **Voxel measurement.** The 42k/130k/160k+ instance estimates are formula-based; first modelling pass must report the real number per preset and, if needed, add `resCap`.

## 10. Verification status
- Verified (read): all code and doc references above; line-level mechanism of `applyHit`, `updateTurrets`, `updateBolts`, `blastAt`, `nukeAt`, `capitalAI`, `missileLogic`, `resFor`, `scaleShip`.
- Calculated: every number marked [C] (script replica of `applyHit` and a continuous-fire intercept model), checked by hand for the Exeter spine table.
- Not done: any game run, any headless duel, any voxel build, any playtest. Hit probabilities against jinking fighters, kill times with the AI in the loop, hangar attrition, and the feel of a 0.06 turn rate are all open and need `tools/tests/`-style scripts (suggested first four: spine vs stationary Exeter hit count; Exeter-alone vs Bullfrog time to kill; 4 Kestrels vs Bullfrog with the hangar capped at 6 and 12; Tadpole and Swift salvo vs the PD ring).

## 11. Implementation status (2026-10-22) and deviations from sections 1-10
Code: ship def `SHIPS.bullfrog` (`src/31_ships_frogg.js`), everything else in `src/79_bullfrog.js` (weapon table additions, spine, hangar, `lancerAI`, escort rules, fighter keep-out); small edits in `60_weapons.js` (`updateTurrets` flags, `blastAt` reach), `65_combat.js` (`EXPOSED.bay`, `applyHit` `through`), `70_ai.js` (hooks), `20_voxel.js` (`def.resCap`), `76_menu.js`, `90_hud.js`. Tests: `tools/tests/bullfrog_t.py`, `bullfrog_eng.py`; results in `docs/BALANCE_TESTS.md`.

Verified by headless tests (see the scripts): spine timeline (first charge at 15 s, lock at 4.5 s, shot at 6 s, 30 s cooldown); Exeter survives 3 spine hits without shield regeneration and dies on the 4th, with regeneration (384 per cycle) survives 4 and dies on the 5th (matches 4.4a); refusal with a friendly on the line (no charge; a friendly entering the line during the lock holds then fizzles, friendly untouched); turret hemispheres cover every direction (static, 2000 directions) and a hostile at 800 m in 10 directions is engaged within 8 s; hangar cap 12, first 12 out at 25 sim-s, refill, bay loss drops the manifest, emergency launch; voxel instances 45.7k / 112.6k / 122.1k at detail 2 / 4 / 6 (LOD drops two steps at 45 km); missile blast reach (open question 6) confirmed as a bug and fixed.
Not verified: real GPU performance, hand play, how the spine telegraph looks and sounds (HUD text, glow and tracer exist but were not viewed in a running game), HUD text rendering of the warning, model appearance beyond a few low-quality headless renders (the hull reads as a ribbed barrel; the flare discs and mandibles are thin and mostly vanish at tablet voxel size).

Deviations and decisions (all mine unless stated):
1. **Turret sizes (owner, binding):** L about 30 m (comp r 17, housings: dorsal barbette and ventral blister of 38 m footprint), M about 12 m (r 6.5), S and PD about 5 m (r 2.5). Spec radii (12 / 8 / 4.5 / 4) replaced; direct-hit reach (1.6 x r) shrinks accordingly. **L2 moved from z -150 to z -165** (its blister would touch bay A's maw at z -127..-63); all turret and component y values were snapped to the voxel hull surface (`tools/tests/_surf.py` style probe at res 400): L1 y 38, L2 -31, M 33 / 28 / -30, S 43 / 35 / 35 / -20 / -27, PD 37 / 40 / -30 / -23, eyes y 14. Spacing check: the L footprints (+-19 m) clear every S, PD and M entry and the maws.
2. **Spine hits use `applyHit(..., through = true)`:** with the stock pipeline the spine did *not* match 4.4a. Measured on the real Exeter: 6 hits without regeneration, more than 6 with, because each hit craters the prow so the next ray enters near the rails and bay, and the 55% exposed-part rule and the 70/30 component split then absorb most of the damage (hit 2: 171 structure instead of 569). With `through` the structure takes the whole hit, exposed or nearby components take extra damage (55% / 40%) on top. Result: 1440, 871, 202, dead (4th) without regeneration; 1440, 1095, 671, 246, dead (5th) with it.
3. **`resMul` 0.85 and `resCap` 400** (spec 0.7, no cap): at 0.7 the tablet preset gave only 30k instances; 0.85 gives 45.7k (tablet), the cap holds laptop to 112.6k and desktop to 122.1k (below the 130k line).
4. **Turret role flags** on the weapon entries: `noPD` (acid cannon never shoots missiles; prefers non-fighters and bombers), `pdOnly` (thorn: missiles, ships only inside 300 m), `bigOnly` (heavy lance ignores fighters beyond 900 m). Heavy lance `acq 0.6, ramp 1.0, peak 3.0` as in the CSV; `bw` 12 (spine) and 4 (heavy lance); spine mount carries `store: 'spine'` so `fireGuns` and `primaryRange` skip it.
5. **Spine corridor check is conservative:** any friendly ship within 3300 m whose sphere (0.9 R + 13 m) touches the line blocks, even behind the target, and any friendly missile within 25 m of it. Own fighters keep out of a +-0.12 rad cone (+40 m) while the spine is charging, locked, or ready with a target (`bfFighterHook`). The bomber "snap shot" (6.3) is **not implemented**.
6. **Tadpoles:** inlined in `lancerAI` (same conditions as `missileLogic`: lock, 350 < d < 0.7 x range, nothing of ours already guided at the target) with initial `mslT` 12 and reload 18-26 s; at most the stock of 16, at capital and corvette targets only.
7. **Hangar:** `s.hangarCfg = {cap, interval, count}` is the only mission lever implemented (set before the first tick); `spineDelay` and the others are constants in `BF`. Damaged bay (< 50%): interval x1.6 and 10% of launches lost on the rail. Emergency: structure < 25% or spool lifts the cap, 1.5 s per bay.
8. **Fighters of a dead or jumped carrier** fight on for 30 s, then flee at full burn and are removed when more than 3 km from every hostile for 5 s (works without a mission anchor, unlike the existing flee rule).
9. **Jump:** 20 s spool, then the ship is removed (`jumped`); `ai.noJump = true` disables it (the mission flag `canJump` of 6.8 is this field). Hits do not interrupt it.
10. **Gulper escort** (`ai.escort = bullfrog`, set by the BULLFROG + 2 GULPER preset, which also spawns them on station): target priority fighters near the Bullfrog, then corvettes, then capitals within 1500 m; station override only when in the spine corridor or beyond 1400 m, otherwise ordinary corvette AI. The same code also serves the human Halberds in the acceptance test.
11. **Not implemented:** eyes-outage tolerance (open question 8, default off), spine audio sample (the shot reuses `lash` and `boom`, charge uses synthesised tones; no third-party asset, `docs/CREDITS.md` untouched), per-spawn `spineCdMul`, `shieldMul`, `hullMul`.
12. **Spec 4.4(e) (PD vs missiles) is not reproduced by the engine:** 0 of 8 Swifts and 0 of 8 torpedoes killed by the Bullfrog's 18 small turrets (and none by the Exeter) at 0.0125 s steps, because turrets slew from rest in about the time a missile needs to arrive. See BALANCE_TESTS.md. Left alone: it is shared engine behaviour.
13. **Missile blast reach:** confirmed by test before the fix (blast at 80% and 97% of the half-length: 0 damage on the Bullfrog and the Exeter, 195 at the centre). Fix in `blastAt`: for hulls with radius > 150 the distance is measured to the nearest hull voxel (`hullGap`, 7 probes) when the old 0.62 R sphere test fails; smaller ships unchanged (Halberd values identical before and after).
14. **`EXPOSED.bay` 1.4 / `SOFT.bay` 1.2** added (open question 7, default yes); it also applies to the Exeter's bay.

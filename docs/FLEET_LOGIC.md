# Fleet logic, ship roles and pilot recovery (design proposal)

Follows the owner's answers of 2026-10-21 to `docs/STRATEGY_LAYER.md` section 5:
1. The player **chooses a pilot** from a finite roster of persistent characters (state and memories). The player is a
   commander who flies through one of them.
2. Strategy is **turn-based**; a dogfight mission is exactly one battle.
3. Pilots can **eject**; with **SAR (search and rescue) assets** they can be recovered. This needs fleet logic.

## Sources and confidence
FS2 Open facts are from `code/def_files/data/tables/objecttypes.tbl`, `code/ship/ship.h`, `code/ai/aigoals.h`,
`code/ai/aibig.cpp`, `code/hud/hudsquadmsg.h` (clone at commit `76219fd`; see `docs/FS2OPEN_STUDY.md`). Read as
excerpts, not audited. **FS2 has no pilot ejection or recovery model**: the only hits for "rescue" are stats code
(respawn counts) and unrelated comments, and "Escape Pod" is merely a ship type. Everything on pilot recovery below
is our own design; numbers are placeholders to tune, not derived from any source.

## 1. What FS2 does for ship roles (from `objecttypes.tbl`)
Roles are **data rows keyed by ship type**, not code. Each type declares which AI goals it accepts, what it pursues,
what the player may order, what it can dock with, and how it reacts to crippled targets.

| Type | Player orders | Pursues | Docks | Notes |
|---|---|---|---|---|
| Fighter | attack, disable, disarm, guard, ignore, form on wing, cover me, attack any/class/type, depart, disable subsystem | everything incl. capitals | passive: support | can form wings; targeted as threat |
| Support | rearm me, abort rearm, depart | everything (auto attacks) | active: support | valid goals include stay near, keep safe distance, rearm ship |
| Cruiser / Corvette | attack ship, depart | transports, cruisers, corvettes, capitals, super caps, drydocks | passive: support | "Attempt Broadside"; targeted by "huge" weapons, ignored by small-only weapons |
| Capital / Super Cap | depart only (super cap: none) | big ships | passive: support | cannot be ordered to do much; "Protected on cripple: NO" |
| Escape Pod | none | n/a | none | high EMP multiplier; targeted but not a threat |

Other rules visible in the table:
- **Cripple handling**: fighters/cruisers/corvettes are "protected on cripple" (the AI keeps them alive when
  crippled so scripted scenes work); capitals and super caps are not.
- **Fighter bays**: ships have hangar bays with doors and launch/recover paths (`ship.h`: bay door state, departure to
  dockbay, `ship_has_hangar_bay`, `ship_fighterbays_all_destroyed`). Losing all bays stops launch/recovery.
- **Big-ship AI** (`aibig.cpp`): picks **attack points** on targets by octant, flies paths to get line of sight to a
  subsystem, enters **strafe mode** when fighters threaten, uses broadside. Escorts and wings are scripted goals.
- Wingmen orders and capital orders are **type-masked** (cruisers: attack/depart; capitals: depart).

## 2. Class table for game-space
Mapped to our existing classes and sizes (docs/SHIPS.md). Mechanics only, no art.

| Class | Tactical role (flown mission) | Strategic role | Carries |
|---|---|---|---|
| Fighter | dogfight, escort, intercept | combat power, scouts | none |
| Bomber | anti-ship strike (torpedoes) | strike vs ships/stations | none |
| Corvette (Halberd 128 m, Gulper 146 m) | screen, light strike, area defence | patrol, blockade, escort | 0-1 flight |
| Frigate / cruiser (planned) | gun platform, broadside | fleet backbone | 1 flight |
| Carrier (planned) | launch/recover, command | projects fighters, repair base | 2-4 flights, bays |
| Capital (planned) | decisive firepower | system control | flights, bays |
| Tender / SAR ship (planned) | rearm, repair, **recover** | logistics, rescue | pods, med bay |
| Freighter / tanker | objective | supply and resources | cargo |
| Station / drydock | static defence | production, repair, base | many |

Rules to adopt (borrowed in spirit from FS2):
- Each class gets an **orders mask** (fighters many, corvettes attack/depart, capitals depart/hold) so the command UI
  shows only legal orders.
- **Targeting weights** per class: big ships attack big ships, fighters hunt fighters and bombers, bombers prefer
  ships. Keep our current closest-target rule as the default inside that mask.
- **Hangar capacity** is the strategic currency for fighters: a flight can only be launched, recovered or rearmed
  where a bay or tender exists.
- **Crippled capitals** can be disabled instead of destroyed (enables capture/salvage; see STRATEGY_LAYER).

## 3. Fleet logic on the strategic map
Units are **task forces** (TF): a list of ships plus their embarked flights, at a system node.
- **Stats per ship** (placeholders): firepower, durability, flight slots, bay throughput, speed (jump range), fuel use,
  supply upkeep, SAR capacity.
- **Actions per turn per TF**: move, attack, defend, escort convoy, blockade, rest/repair, SAR sweep.
- **Supply**: ships consume Fuel on jumps and Materiel for repair/rearm; a TF cut from supply degrades each turn.
- **Auto-resolve**: compute a force rating per side from class stats, with a role matchup matrix (e.g. fighters vs
  bombers, bombers vs capitals, capitals vs everything), a defender bonus at stations, and variance. Output: losses
  per ship, damaged ships, ejected/lost pilots. Flown missions replace this with the result of the actual fight;
  flying must be able to beat the auto-resolve expectation or players will never choose it.
- **Persistent damage**: ships keep hull damage and missile stock between turns until repaired at a base, tender
  or drydock (FS2 also carries loadout/damage between missions).

## 4. Pilots: roster, selection, memory
- **Roster** is finite and named: each pilot has skill, traits, rank, current ship/TF, health state, relationships,
  kills, history and **memory entries** (see VISION.md; the state engine owns facts, an LLM only writes dialogue).
- **Selecting a pilot** is a strategic choice: only pilots at the battle's system and with a flyable fighter are
  eligible. Others fly as AI wingmen with the same persistent stats. Pilot skill feeds AI accuracy and
  reaction; the **player** flies their chosen pilot, so the pilot's personal stats must not weaken the player's controls.
  Suggest pilot traits modify AI wingmen and the pilot's *narrative* state, and give the player only small,
  transparent bonuses (so the choice has meaning without making the player weaker or stronger by an opaque rule).
- **State machine** (deterministic): ACTIVE -> (eject) -> ADRIFT -> RESCUED | CAPTURED | KIA; RESCUED -> RECOVERING
  (n turns) -> ACTIVE. CAPTURED can be exchanged or freed by taking the holding system.

## 5. Ejection and SAR
No FS2 precedent; design from scratch, flagged as such.

**Ejection.** In a flown mission: a hull-critical state gives the player (and AI wingmen) an eject option. AI wingmen
eject by a rule (structure below a threshold, engines or controls lost). Ejecting leaves a **pod** object (like FS2
"Escape Pod": targetable, fragile, slow) with a life-support timer. Not ejecting and dying = KIA by default, with a
modest chance of a pod getting out for realism (tunable; this is a balance question).

**In-mission recovery.** If friendlies with SAR capacity are present (SAR ship or a tender), a pod within range can be
picked up during the mission; the SAR ship needs the area secure, which creates the TIE-style "protect the pickup"
objective. If the mission ends first, remaining pods go to the **strategic layer** as ADRIFT.

**Strategic recovery.** Pods at a system are resolved at turn end:
- Rescue chance = f(SAR capacity in range, system control, time adrift vs life-support, enemy presence).
- Enemy control of the system lets them capture pilots instead (prisoners, exchange).
- A dedicated SAR sweep action raises the chance and costs fuel and exposure.

**Requirements for fleet logic**: SAR capacity as a ship stat; pod timers in the saved world; mission objectives of
type `rescue`; wounded states with recovery turns; a roster UI showing who is adrift and for how long.

## 6. Build order (smallest meaningful steps)
1. Class table and orders mask in data (`SHIPS` rows get `role`, `orders`, `bays`, `sar`) plus targeting weights in
   `70_ai.js`. (S-M)
2. Wingman orders using the masks (docs/FREESPACE2_COMPARISON.md item 1). (M)
3. Pilot state machine and eject option with pods in flown missions; roster persistence as JSON. (M)
4. Task force data model and a strategic map screen with turn processing (no combat yet). (M-L)
5. Auto-resolve with the matchup matrix, SAR resolution at turn end. (M)
6. Mission generator from battle data, reusing transits and looks. (M-L)

## 7. Risks and open questions
- **Balance without data.** Matchup matrix, rescue odds and the "does flying beat auto-resolve" rule all need
  playtesting; there is none yet.
- **Casualty emotional cost vs 5-minute sessions**: permanent death of named pilots with persistent memories is
  powerful but punishing; consider a difficulty setting (permadeath on/off, "heroic rescue" chance).
- **Carrier-less play**: if the player commands but flies from a specific ship, losing that ship needs a rule.
- **Scope**: the carrier, frigate, capital, tender and SAR ships do not exist as models yet; each costs voxel budget
  (corvettes already take seconds to build headless), so LOD or caching comes before a large fleet.
- **LLM memory** must remain advisory; the state engine decides survival, capture and rank.

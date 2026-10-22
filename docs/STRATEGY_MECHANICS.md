# Strategy mechanics: harvesting star systems with factory ships and operations hubs (design proposal, nothing implemented)

Status: **design description only, written 2026-10-22.** Nothing here is built or playtested. It extends `docs/ECONOMY.md`
(resources, depots, turn), `docs/STRATEGY_LAYER.md` (fly or auto-resolve), `docs/FLEET_LOGIC.md` (only frigates and larger
jump, section 8; drones, section 9), `docs/LORE.md` (FROGGs) and `AGENTS.md` (500 m cap, single file). The map is in
`docs/STAR_MAP.md`. Owner brief: humans and FROGGs harvest star systems using factory ships and giant solar- and
fusion-powered stations as operations hubs.

## 0. Evidence tags and honesty about numbers

- **[R]** repo fact, read in the files named above on 2026-10-22.
- **[PH]** placeholder number of mine, derived from nothing external. **Every number in this document is [PH] unless it carries
  another tag.** They are chosen to be in the same range as `docs/ECONOMY.md` section 6 so the two can be read together.
- **[C]** computed from stated inputs (physics arithmetic in section 5).
- **[M]** recollection, unverified.
- **[D]** design inference.
- No genre claim is re-verified here. Reference-game evidence stays in `docs/ECONOMY.md` section 1 (tags there).
- Nothing here was balanced by simulation. The first quantity to measure is still the loss distribution of a flown mission
  (ECONOMY section 8).

## 1. Where this document changes `docs/ECONOMY.md`

| Topic | ECONOMY today | This document | Why |
|---|---|---|---|
| Resource pools | Supplies S, Fuel F, Nuclear N, Pilots (roster) | **Same four. No new pool.** Adds **Power** as a per-system *capacity* (points), not a stock, and FROGG-side hidden **Biomass B** (already in ECONOMY 3.5) | Keeps the 3-flow limit (ECONOMY O1, 2.1) |
| Where S and F come from | A flat yield per system type (6.2) | Yield comes from **bodies in the system** worked by **factory ships**, multiplied by a **hub** | The brief asks for factories and hubs; a flat yield cannot show them |
| Fuel price | 2 F per lane-length unit, tank 12 F (6.3) | **1 F per light-year**, tank 12 F, hence 12 ly standard range (`STAR_MAP.md` 7) | The abstract unit becomes real map distance |
| Depot throughput | L1 6 S, L2 15 S, L3 30 S per turn (6.2) | Same numbers, but a depot **needs Power points** to run at full rate | Gives hubs a job |
| Finite deposits | Open (ECONOMY Q6), default no | Default stays no for humans; **a body has a yield cap per turn, not a stock**; FROGG presence still depletes (3.5) | Preserves asymmetry |
| Logistics | Binary connectedness, no convoys (3.2) | Same by default; optional explicit **haulers** only for fusion fuel (section 7) | Avoids a convoy simulation |
| Turn | 5 steps (6.4) | Adds **Harvest** and **Power check** inside step 4 (section 9) | Fits the existing order |
| Upkeep | Fleet-size based (6.3) | Adds hub and factory-ship upkeep (section 6) | Anti-snowball valve (ECONOMY 5.2) |
| Jump time | 1 turn per jump | 1 / 2 / 3 turns by lane tier (`STAR_MAP.md` 7) | Distance now matters |

## 2. Systems as nodes

A **system** is a node with:
- fixed data from `docs/data/stars.csv`: name, position, spectral class, luminosity L [R: file written 2026-10-22];
- a list of **bodies**: `{id, kind, richness R in 1-3, hazard tags}`. Kinds: `rock` (planet or moon: metals), `belt`
  (asteroids/dust: metals, easy to raid), `ice` (ice moon, comet disc: volatiles and deuterium), `giant` (gas/ice giant: fuel
  gas), `star` (light);
- per-side control state (section 10), hub slots (see 5.2), lane list (Tier A/B/C);
- a **knowledge level** per side (section 12).

Which bodies exist in a system is partly real (`STAR_MAP.md` 3) and partly invented [I]. Example, flagged: Sol has
`belt R2`, `giant R3` (Jupiter and Saturn), `ice R2`, `rock R3`; Epsilon Eridani `belt R3` (real dust belts), `giant R2`.
Systems in which the real catalogue has nothing (Sirius, Procyon) get **no** bodies by default and are pure solar sites; this
is a conscious design: their value is Power, not materials.

## 3. Resources and harvest rules

| Resource | Source bodies | Harvester | Note |
|---|---|---|---|
| S (Supplies) | rock, belt, ice (partly) | factory ship with **mining set** | Metals, silicates; "S" stays the single materiel pool [R: ECONOMY 2.2] |
| F (Fuel) | giant, ice | factory ship with **skimmer set** (giants) or mining set (ice) | Reaction mass, jump energy, and **fusion fuel (D and He-3)**: one pool, one name |
| Power (E) | star (solar hub), F (fusion hub) | hubs | Capacity in points per system. Does not carry over or cross lanes |
| N, Pilots | unchanged | | |

Why not separate "volatiles", "deuterium" and "helium-3" resources: they come from the same places (giants, ices) and are
spent on the same thing (energy and jumps), so they fail the "different source or different use" test of ECONOMY 2.1 [D].

**Harvest rate per factory ship per turn** [PH]: `base = 2 x R` for S (R1: 2, R2: 4, R3: 6); `1.5 x R` for F.
- **Slots:** a body supports at most R factory ships at once.
- **Hub bonus:** x1.5 on all ships in the system if a hub of Tier I+ is **operational** (Power satisfied).
- **Without power:** a factory ship runs at x0.5 (raw dumping).
- **Control state:** x1.0 held, x0.5 contested/blockaded, 0 if enemy-held (ECONOMY 3.3).
- **Yield is not stockpiled at the body**: it flows to the global pool if the system is connected, else into the local
  stockpile, per ECONOMY 3.2.
Calibration check against ECONOMY 6.2 (Belt 5 S/turn, Colony 6, Home 12): one factory ship on a R2 belt with a Tier I hub yields
4 x 1.5 = 6 S/turn, in the same range. A full Sol belt (2 ships) gives 12 S; with Sol's home yield that is clearly more than
ECONOMY's early example. **This is deliberate**: harvesting becomes the main income, and upkeep must rise to match (section 6).

## 4. Factory ships

A factory ship (working name **Foundry**) is a harvest platform on a **frigate-class hull**.

| Aspect | Proposal [PH] |
|---|---|
| Size class | Frigate class, **<= 450 m**, within the 500 m cap [R: AGENTS.md]. Thus it can jump under the existing rule [R: FLEET_LOGIC 8] with no exception |
| What it does | Works one body at a time: mining set (S) or skimmer set (F). Processes cargo into the system's pool. Can **assemble** hubs (section 5) and **repair** hubs and ships at a rate of 6 S/turn |
| Docking | No hangar and no cradle: the frigate dock rule (2 corvettes + 12 fighters) is *not* used. It carries 4 drones for self-defence [D] |
| Defence | 2 PD turrets and light armour. A Foundry cannot hold a system alone |
| Throughput | Section 3. One Foundry on a R2 body with a hub: 6 S/turn |
| Cost / build | 120 S; 8 turns at a Depot L3 (frigate: 300 S, 12 turns [R: ECONOMY 6.3]). Upkeep 2 S/turn |
| Payback | ~20 turns at R2 with a hub [C: 120 / 6]. That is half a 40-turn campaign; first parameter to simulate |
| Vulnerability | Unarmoured, slow to move (jumps 1 turn like any frigate, but cannot jump while harvesting that turn), a **prime raid target** (FLEET_LOGIC 8: capital-class hulls are high-value). Loss costs 120 S and the body slot |

**Count:** if factory ships are frigate-class jumpers, do they count against "the player commands 2-4 frigates" [R: OPEN_QUESTIONS 15]?
Default (open question SM-3): **No.** The player commands 2-4 *warship* frigates (Exeter class) **plus 1-3 Foundries**. This
raises piece count; ECONOMY O1 argued that piece count is the scarce thing, so this is a help, not a problem.

FROGG counterpart: **Maw barge**, a brood hull that strips a body, see 8.

## 5. Operations hubs

### 5.1 Concept

A hub is an **immobile structure**, not a ship, assembled in place by a Foundry. It does four things: (a) provides **Power points**
to its system; (b) multiplies harvest (x1.5, section 3); (c) unlocks facilities (depot level, shipyard, drone foundry, jump
beacon); (d) is an **objective** for the enemy, and so a mission generator (section 11).

### 5.2 Solar hubs: output scaling with luminosity and distance

Physics baseline [C]: flux at distance r from a star of luminosity L is `1361 W/m^2 x L / r^2` with r in AU (the 1361 W/m^2 is the
solar constant [M]). A collector of area A and efficiency eta gives `P = 1361 x A x eta x L / r^2`. With eta = 0.25 [PH, a
conservative space-PV figure; real cells are higher, concentrators and thermal loops differ] and 1 game "Power point" = 200 MW [PH]:

| Tier | Name | Collector area at 1 solar constant [C] | Points at f = 1 [PH] |
|---|---|---|---|
| I | Relay array | ~1.2 km^2 | 2 |
| II | Array | ~3.5 km^2 | 6 |
| III | Giant array | ~10 km^2 | 16 |

(Examples: Tier III: 10 km^2 x 1361 x 0.25 = 3.4 GW = 17 points; rounded to 16.)

**What the physics says about luminosity [C, D]:** per square metre, output depends on *where you put the collector*, not on
the star: at `r = sqrt(L)` AU the flux equals Earth's, whatever the star. So a faint star is not "low output"; it is
"output only close in" (TRAPPIST-1: 0.02 AU, among its planets, in the flare zone, see `STAR_MAP.md` 3). Luminosity therefore affects
**where the hub sits and what threatens it**, and the size of the *zone in which a hub is safe and useful*.

**Game abstraction (recommended, flagged as not physics):** each system has a **power factor**
`f = clamp(L, 0.25, 4)` for a hub at the **reference orbit 1 AU**. Hub points = tier points x f.
- Floor 0.25: even M-dwarf systems give a small amount (the real answer is "inner orbit").
- Cap 4: the thermal limit of a collector (Sirius' L 25 at 1 AU would cook anything [C]).
- **Inner-orbit option:** for any system with `L < 1`, the player may place the hub at `r = sqrt(L)` AU and get **f = 1** at the cost of
  a **flare-exposed** tag (shield upkeep +100%, x2 chance of a flare event per turn [PH]). This keeps the luminosity story honest: "it works
  near the star, if you accept the risk".

Resulting factors [C from `STAR_MAP.md` luminosities]: Sirius, Procyon, Vega, Fomalhaut **4**; Alpha Centauri **2**; Sol **1**; HD 69830
**0.6**; 55 Cancri **0.58**; Tau Ceti **0.52**; Epsilon Eridani **0.34**; all others (M dwarfs, K dwarfs below 0.25) **0.25**.
The Sirius/Procyon/Luyten cluster (`STAR_MAP.md` 8) is therefore the main **power region** of the map [D]. Whether that is a
good map design (a strong region behind the weakest defence line) is a feature, not verified.

### 5.3 Fusion hubs: independent of the star, dependent on fuel

Fusion hubs give a **fixed** output, independent of luminosity and distance, and burn F.

| Tier | Name | Size | Points [PH] | F burned per turn [PH] | Notes |
|---|---|---|---|---|---|
| I | Fusion tender | <= 450 m | 3 | 1 | One reactor; can run at dim stars and in outer orbits |
| II | Fusion station | 1-2 km | 8 | 2 | Can top up a tanker for Tier B lanes (`STAR_MAP.md` 7) |
| III | Fusion citadel | 3-5 km | 20 | 4 | Largest single power source; reactor breach risk (section 5.7) |

Ratio: 5 points per F burned at Tier III [PH]. Reference check: a skimmer Foundry on a R2 giant yields 3 F/turn
(section 3), enough to run a Tier II hub (2 F) plus 1 F surplus. **A fusion hub with its own giant is self-sufficient**; without
one it needs **fuel logistics** (section 7). If the hub's local F stock hits 0: Power drops to 0 on that turn, and the
system is "dark" (factory ships x0.5, depots at L0).

Why fusion is the second type: it is the only way to power systems where solar is poor (11 of 21 systems have f = 0.25), and it
creates the fuel logistics the owner asked for. Honest cost: it ties the human economy to giants, which are the minority of
bodies in the map (`STAR_MAP.md` 3: real giant planets are known in Sol, Epsilon Indi, Gliese 876, 55 Cancri, Epsilon Eridani,
and maybe HD 69830 [M]).

### 5.4 Size and cost tiers; the 500 m cap

| Tier | Size | Cost S | Build turns (Foundry present) | Upkeep S/turn | Within 500 m cap? |
|---|---|---|---|---|---|
| I | <= 450 m | 60 solar / 80 fusion | 3 | 1 | **Yes** |
| II | 1-2 km | 200 / 260 | 6 | 3 | **No: needs an exception** |
| III | 3-5 km | 600 / 800 | 10 | 8 | **No: needs an exception** |

Cost ratios are [PH]: Tier III costs 2-2.7x a frigate (600-800 S against 300 S). **Proposed exception (SM-4):**
the 500 m cap applies to *ships*. A **structure** that cannot move, jump or dock more than a defined number of ships may exceed it, because
(a) the lore already has 2-3 km hive carriers and ~10 km motherships, deferred [R: LORE.md] so km-scale objects exist in the fiction;
(b) the cap's stated reason in the repo is the cost of voxel models [R: AGENTS.md "corvettes are heavy"] and a static hub can be a
different, cheaper asset (section 14). Until the owner decides, **build only Tier I hubs** (inside the cap) in a first version.

Assembly: a Foundry adds `cost / turns` S per turn to the project while present. If the Foundry leaves or dies, the project pauses.
Partial completion gives nothing.

### 5.5 Unlocks

| Facility | Needs | Effect [PH] |
|---|---|---|
| Depot L1 (rearm, drones) | any Tier I hub, 1 Power point | 6 S/turn throughput (ECONOMY 6.2) |
| Depot L2 (adds repair) | Tier II hub, 3 points | 15 S/turn |
| Depot L3 (adds build, queue, pilot recovery) | Tier III hub, 6 points | 30 S/turn, can build frigates and Foundries |
| Drone foundry | Tier II, 2 points | replenishes drones at up to 10/turn at 0.5 S each |
| Defence grid D1-D3 | any, 2 / 4 / 8 points | PD and shield cover for the hub (5.6) |
| Sensor array | Tier II, 1 point | see arrivals at the system (section 12) |
| Jump beacon | Tier II fusion, 3 points | Tier C lane **arrivals** (`STAR_MAP.md` 7) |
| Tanker top-off | Tier II fusion | +10 F to a docked tanker for a Tier B departure |
| Shipyard | Tier III | builds frigates, Foundries, hubs |

Everything draws from the same Power budget; the player allocates it per turn at the **Power check**. A shortage scales the
affected facility down, it does not turn the whole system off. This is the only new "meter", and it is local.

### 5.6 Defence needs

A hub that is not defended is a free target. Each hub has `integrity` (Tier I 60, II 200, III 500 [PH]) and a **grid rating**
equal to the Power points allocated to D1-D3 times 4 [PH].
- A hub **always needs a garrison TF or its grid**; both together are best.
- A grid without Power is zero. The cheapest attack is therefore to **cut Power** (solar: damage collectors; fusion: starve fuel).

### 5.7 How hubs can be attacked

| Attack | Effect | Counter | Mission? |
|---|---|---|---|
| **Raid** on Foundries | Harvest stops; ship lost | Escort; hide Foundry in a defended system | Yes (intercept, defend) |
| **Blockade** (armed presence, no defender) | Output x0.5; breaks connectedness [R: ECONOMY 3.4] | Garrison TF | Yes (siege break) |
| **Siege** (section 10) | `integrity -= max(0, siege power - 4 x grid points)` per turn | Grid, garrison, relief | Yes (hub defence) |
| **Collector strike** (solar) | Each strike removes 10% of Power points; cheap to hit (thin structure) [D] | Repair by Foundry (6 S/turn), grid | Yes |
| **Fuel starvation** (fusion) | Cut the supply lane; hub goes dark when local F reaches 0 | Local giant skimmer; large F store | Yes (haulers) |
| **Reactor breach** (fusion) | Tier II/III destroyed: x0.5 damage to everything within the system's "hub zone", including docked ships | Not building Tier III beside a fleet; reactor shielding (S cost) | Yes (nuke, sabotage) |
| **Nuclear warhead** | Disables a Tier I-II hub in one hit; Tier III loses 50% integrity [PH] | Grid PD against torpedoes [R: CAPITAL_COMBAT]; kill the carrier | Yes |
| **Jump-in ambush** | Arrival points are predictable (fixed lane ends) | Sensor array, patrol | Yes |

Solar hubs are cheap to build and cheap to hurt; fusion hubs are tough but have a fuel line. This difference is the main
choice the player makes: **solar where a rich star is, fusion where a giant is** [D].

## 6. Upkeep and the snowball valve

Per turn [PH]: Foundry 2 S; hub Tier I 1, II 3, III 8; lane upkeep when using supply links (section 7): Tier A 0.5, B 1, C 2 per
active link. Total upkeep must exceed the marginal harvest of an extra hub/Foundry beyond a point. Test (to simulate): upkeep
grows ~linearly with asset count while harvest hits body slot caps (section 3), so returns diminish as bodies fill. Slots are the
real limiter: a system with 3 bodies at R2 has at most ~6 Foundry slots.

## 7. Logistics lanes and transports

**Default (cheap):** keep ECONOMY 3.2: a system is *connected* if a chain of friendly, un-blockaded systems links it to the capital by
lanes. Connected output flows into the global pool at no cost. Disconnected output accumulates in a local stockpile with a cap
(40 S [PH]). A lane tier determines **upkeep** (section 6) and **time** (1-3 turns).

**Optional explicit transport (Hauler):** a **frigate-class hull** (so it can jump, FLEET_LOGIC 8) with cargo 60 units [PH], used
only to carry F to fusion hubs without a local giant, and to move S to a remote shipyard. It follows the same fuel rule (1 F/ly).
It is a raid target, so the loss of a fusion hub's fuel line becomes a mission (section 11). There is **no** free-roaming
convoy simulation (rejected in ECONOMY 3.2).

Cost: a Hauler costs 90 S, 6 turns [PH]. It cannot fight. It can also serve as the **tanker** for Tier B/C lanes (carries 10 F
of tank extension) and it may sit in a **corvette cradle** of a warship frigate only if it is corvette-class, which it is not.
So a Hauler is a separate hull; the TF composition (frigate + 2 corvettes + 12) is unchanged. Whether it is jump-capable is
ECONOMY question 2, defaulted here to **yes**, as a frigate-class hull (SM-5).

## 8. How FROGGs harvest (biological analogue and asymmetry)

Premise [R: LORE.md]: migratory hive, consumes systems, relocates; neuro-slaved pilots; hive carriers 2-3 km and motherships ~10 km
(deferred). ECONOMY 3.5 already defines depletion and biomass; this adds the visible vocabulary [I].

| Aspect | Humans | FROGGs |
|---|---|---|
| Harvester | Foundry, industrial, sustainable | **Maw barge**, biological: strips a body of volatiles and minerals, digests into **biomass B** |
| Power | Solar and fusion hubs | None mirrored; B is both food and energy. **No power hub, no fuel line** |
| Output | S and F pools | B (hidden counter, ECONOMY 3.5) |
| Structure | Hub (integrity, grid) | **Brood nest**: a hive carrier (2-3 km) parked in orbit, converts B to fighters/hulls. Deferred hull; v1 uses an abstract nest object |
| Depletion | None for humans by default | System yield `x0.5` per turn after a brood arrives, until barren (ECONOMY 3.5) |
| Logistics | Lanes, haulers | A brood moves as a whole; **no lines to cut**. Cutting is replaced by killing barges and nests |
| Capture | Humans can disable hubs | FROGGs cannot use human hubs (no interface). They destroy or disable them. Humans can destroy nests; no capture by default |
| Weakness | Fuel lines, thin collectors | Barges are slow, nests are single points of growth |
| Jump rule | Frigates and larger | **Same rule for v1** (symmetry, FLEET_LOGIC 8 open question 3); a brood's capital-class ships carry the swarm |

**Harvest process:** each turn a brood at a system strips `sum(R x 2)` of the *local yield* into B (so a R3 belt gives 6 B), then
the system's remaining yield multiplier is halved (human assets there suffer: output x0.5, 0.25...). When B passes a threshold, the
brood spawns or reinforces. When the multiplier falls below 0.1, the brood picks the next target using the ECONOMY 3.5 rule (highest
remaining yield weighted by lowest defence) and **telegraphs it one turn ahead** (ECONOMY 6.4).

Consequences [D]:
- A human **hub is a bait** as well as an asset: it increases the system's yield and so the brood's interest.
- Humans cannot deplete FROGG-held space, only kill nests, so "hold" has no long-term yield in a system already barren.
- The player's choice is *where to be strong*, not *how to out-produce*, which keeps the FROGG side free of a production tree
  (the argument in ECONOMY 3.5).

## 9. Cycle and turn structure

One **turn** is an operational cycle [R: ECONOMY 6.4]. Proposed order:

1. **Logistics** (depots, within throughput): rearm, replace drones, repair, build queue, refuel.
2. **Orders**: each TF, Foundry or Hauler chooses move/jump (Tier A/B/C), harvest (pick body), assemble hub, hold, blockade,
   scout, reserve. Jumps of 2-3 turns are committed.
3. **Battles**: for each system with opposing armed presence or a siege tick, fly or auto-resolve (section 11).
4. **Economy** (new details): (a) **Power check**: allocate points per system among Foundries, depots, grid, sensors; (b) **Harvest**:
   apply section 3; (c) income and upkeep. Ledger is paid at a depot in step 1 of the next turn (ECONOMY 6.4).
5. **FROGG phase**: depletion, growth, movement, telegraph.

A turn is not a calendar unit; travel and harvest times are in turns only. This avoids fixing "light-years per day".

## 10. Contest, capture and siege rules

Control states per system and side:

| State | Meaning | Yield factor [R: ECONOMY 3.3 + PH] |
|---|---|---|
| Unclaimed | No assets | 0 |
| Claimed | Own asset (Foundry or hub), no enemy armed ship | 1.0 |
| Contested | Both sides have armed ships | 0.5 |
| Besieged | Enemy armed presence, no defending TF | 0.5, no connectedness through it |
| Disabled | A hub with integrity 0 | 0 until repaired; offline N turns (5, ECONOMY 3.5 idea) |
| Depleted (FROGG only) | Yield multiplier < 0.1 | ~0 |

**Siege power** per turn = sum over attacking ships [PH]: fighter 1, heavy fighter 2, corvette 5, frigate 20. A hub loses
`max(0, siege power - 4 x grid points)` integrity. At 0 it is *Disabled*; if the attacker also keeps an armed ship in the system
for 2 more turns, it is *destroyed*. A Foundry can repair 12 integrity/turn (6 S at 0.5 S per point) if present and protected.

**Capture:** human hubs can be **disabled** by FROGGs; humans can capture nothing from FROGGs. Human vs human factions are
deferred [R: LORE.md], so no capture rule for hubs between humans yet (open SM-11).

**Retreat:** the loser of a mission may withdraw one TF per turn (FS2's "skip after repeated failures" analogue, ECONOMY 1.5). A
retreat forfeits control but not units.

## 11. A fight becomes a mission, or auto-resolve

A fight **triggers** when (a) opposing armed ships share a system, or (b) a siege tick occurs against a defended hub, or (c) a
raid targets a Foundry or Hauler. The player then chooses **fly** or **auto-resolve** (`docs/STRATEGY_LAYER.md` 3).

| Trigger | Mission template (built from the system's data) | Notes |
|---|---|---|
| Hub siege | **Hub defence**: waves against a hub, with hardpoints as objectives | Tier I hub can be a real 450 m object; Tier II/III abstracted into 3-6 hardpoints (section 14) |
| Raid on Foundry | **Intercept / escort** the Foundry | Reuses existing wave and escort logic [R: STRATEGY_LAYER 4 hooks] |
| Fuel-line raid | **Convoy defence** (hauler as protected target) | |
| Blockade breaking | **Strike** on the enemy armed group | |
| Scouting | **Recon**: drones scout ahead [R: FLEET_LOGIC 9] | Sets knowledge level 2 |
| Brood at human system | **Defend** against a brood wave; nuclear target if N spendable (ECONOMY O3) | |

**Auto-resolve** [PH, formula to be fitted per ECONOMY 8]: strength `A = sum(class values)`, class values: fighter 1, heavy 2,
corvette 8, frigate 30, hub grid points x 3; losses fraction by a Lanchester square-law baseline [R: ECONOMY 1.12] with random variance
+/- 20%. The expected result is worse than a competently flown mission: irreplaceable assets (pilots, N, **hub integrity**) take
1.3x loss in auto-resolve [PH, rule from ECONOMY 5.2]. Outcome applies a ledger and hub integrity; no other changes.

To keep flying meaningful (STRATEGY_LAYER 1): flown missions **earn** things auto-resolve cannot: hub integrity saved, rescue of
Foundries, capture of intel (knowledge level), and a small S bonus from salvage.

## 12. Fog of war and scouting

Four knowledge levels per system and side [I]:

| Level | Name | Source | What is visible |
|---|---|---|---|
| 0 | Unknown | none | Not on the map |
| 1 | Charted | Telescope data (public) | Position, spectral class, lane list; **all 21 systems start here** (stars are known to astronomers, `STAR_MAP.md`) |
| 2 | Surveyed | A frigate stays 1 turn and launches drones, or a Recon mission | Bodies, richness, hazards |
| 3 | Watched | Own asset in system, or hub sensor array | Current forces in the system |

- **Drones** scout *in-system* only (scout ahead, FLEET_LOGIC 9); they cannot jump. Inter-system scouting needs a frigate
  (or Foundry/Hauler) to travel with them, which costs fuel and time. This keeps the "only frigates jump" rule.
- **Hub sensors:** a Tier II array sees arrivals into **its own system** with 1-turn warning. Long-range detection of
  neighbouring systems is not proposed (default no).
- **FROGG telegraph:** the next brood target is always shown one turn ahead (ECONOMY 6.4); FROGG strength is shown as a coarse rating, not
  exact numbers (ECONOMY 3.5).
- Intel is **not a resource** [R: ECONOMY 2.2]; it is a knowledge level.

## 13. Win and lose conditions (options)

| Option | Win | Lose | Fit |
|---|---|---|---|
| W1 Hold and purge | Destroy every brood nest; hold Sol | Sol hub disabled with enemy presence for 3 turns | Most legible; needs strong human offence |
| W2 Outlast | Survive N turns (the migration passes) with Sol and one Tier III hub standing | Sol falls | Fits "depletion clock" (ECONOMY 3.5); possibly passive |
| W3 Power quota | Reach X Power points of Tier III hubs | Same, plus no frigate | Economy-flavoured; weak story |
| W4 Exodus | Evacuate with M Haulers to a far system | Hauler losses | Story rich; no strategic map needed |

Loss conditions common to all [D]: all warship frigates lost (stranded forces, FLEET_LOGIC 8) with no shipyard, or S below upkeep for 3
turns. **Default:** W2 with authored beats, upgrading to W1 if the nests are reachable (ECONOMY 5.1 recommendation: fixed-length scenario
with narrative beats). Default scenario: 30 turns.

## 14. Feasibility notes for a single-file browser game

Sober, non-verified except where stated.
- **State size is trivial.** 21 systems, <= 100 bodies, <= 40 assets, a ledger and a roster serialise to a few tens of KB of JSON
  [C estimate]. `localStorage` is per browser, so export/import is needed [R: STRATEGY_LAYER 1, OPEN_QUESTIONS 24].
- **The map screen is cheap**: 21 nodes, lane lines, a side panel; canvas 2D or plain DOM/SVG. No new dependency
  (`index.html` is built from `src/*` with `build.py` and uses Three.js from a CDN [R: AGENTS.md]). A new source part (e.g.
  `src/7x_strategy.js`) fits the numbered-part convention; the TDZ rule applies to top-level `let/const` [R: AGENTS.md].
- **Hubs are the expensive part.** Corvettes are already "heavy" (Halberd ~35k, Gulper ~78k instances) and "do not raise resolution
  globally" [R: AGENTS.md]. A 2-5 km hub in the same voxel density would be far beyond that budget. Options: Tier I (450 m) as a
  normal low-detail voxel ship; Tier II/III as a distant backdrop silhouette plus 3-6 attackable hardpoint objects. **Whether the sim
  and renderer handle km-scale objects and collisions is unverified;** there is a scale file (`src/32_scale.js`) and a `scaleShip`
  [R: AGENTS.md], but I did not test large objects. Needs a prototype before committing to Tier II/III.
- **Mission generation** reuses what exists (waves, escort, transits) per STRATEGY_LAYER 4; "defend a static structure" is probably
  a new objective type [D; not checked in code].
- **Auto-resolve and FROGG AI** are plain functions on the state object; unit-testable headless without rendering, as ECONOMY 8 proposes.
- **Real devices:** iPad/phone performance of the strategic map is not an issue, of hub missions is unverified (OPEN_QUESTIONS 14, 26).
- **Effort (guesses):** map + state + save: M; harvest/power/hub rules: M; FROGG brood phase: S-M; hub-defence missions: M-L;
  auto-resolve: S-M; fog/scouting: S. This repeats the caution in STRATEGY_LAYER caveats: a strategy layer is a second game.
- **Thin-slice recommendation:** 8 systems (Sol, Alpha Cen, Barnard, Wolf 359, Lalande, Sirius, Procyon/Luyten, Epsilon Eridani), Tier I hubs
  only (inside the cap), solar and fusion Tier I, Foundry, no explicit Haulers, one FROGG brood path, auto-resolve first, **one** hub-defence
  mission template.

## 15. Difficulty levers

| Lever | Easy to hard [PH] | Effect |
|---|---|---|
| FROGG yield halving per turn | x0.7 to x0.3 | How fast a system dies |
| FROGG arrival speed | slower lane time to faster | Clock length |
| Telegraph length | 2 turns to 0 | Information |
| Number of warship frigates | 4 to 2 | Pieces |
| Foundry cost / hub cost | -25% to +50% | Investment horizon |
| Jump range | 12 ly to 10 ly | Map becomes less Sol-centred (`STAR_MAP.md` 7.1) |
| Auto-resolve penalty | 1.0x to 1.6x | Reward for flying |
| Rescue odds (ECONOMY 6.5) | as there | Pilot attrition |
| Hub integrity and grid | +50% to -25% | Siege length |
| Fog | all Surveyed to only Charted | Scouting need |
| Starting N | 5 to 2 | Nuke availability |

## 16. Worked example turn on the map (all numbers [PH]; the battle outcome is assumed, not predicted)

Map extract from `docs/STAR_MAP.md`: Sol (home), Alpha Centauri 4.4 ly from Sol (Tier A), Epsilon Indi 9.7 ly from Alpha Centauri (Tier A).
Fictional body data [I]: Alpha Centauri has `belt R2`.

**Start of turn 8**
- Assets: Sol: Depot L3. Alpha Centauri: Solar Tier I (f = 2 -> 4 points), Foundry-1 on the belt, Depot L1, defence grid D1.
- Power at Alpha Centauri: 4 points = Foundry 1 + Depot L1 1 + grid D1 2. Balanced.
- TF-1 (Exeter, 2 corvettes, 12 fighters, 48 drones) at Sol, tank 12/12. Pool: S 80, F 14, N 3.
- Telegraph: an FROGG raid (8 fighters, 1 corvette) from the brood at Epsilon Indi reaches Alpha Centauri this turn (one Tier A lane, 9.7 ly).

**1. Logistics.** Nothing to rearm.
**2. Orders.** TF-1 jumps Sol -> Alpha Centauri: 4.4 ly, 4.4 F, tank 12 -> 7.6 [C]; 1 turn. Foundry-1 stays and harvests.
**3. Battle.** The raid arrives at Alpha Centauri. A hub-defence mission is generated (Tier I hub as a protected object). The player flies it.
Assumed outcome: raid destroyed; 1 fighter lost (pilot ejects, rescued), 10 drones, 3 missiles, hub integrity -12 (60 -> 48). Foundry undamaged.
**4. Economy.**
- Power check: grid held, hub operational.
- Harvest: Foundry-1 on a R2 belt: 4 S x 1.5 (hub) = **6 S**.
- Income: Sol 12 + 6 = **18 S**, F +1 (Sol).
- Upkeep: Exeter 3 + corvettes 2 + fighters 1.1 + Foundry 2 + Solar I 1 = **9.1 S**. S: 80 + 18 - 9.1 = **88.9**.
- Fuel: Sol +1; tank refilled at the Alpha Centauri Depot L1 by 4.4: pool 14 + 1 - 4.4 = **10.6**; tank 12/12.
- Ledger (unpaid): fighter 4.0, drones 5.0, missiles 0.6, hub repair 12 integrity x 0.5 S = 6.0. Total **15.6 S**; Depot L1 throughput is 6 S/turn, so paying it takes ~3 turns.
**5. FROGG phase.** The brood at Epsilon Indi halves its yield again, B grows. Next target telegraphed for turn 10: Tau Ceti or Alpha Centauri.

**End of turn 8**
| Item | Value |
|---|---|
| S / F / N | 88.9 / 10.6 / 3 |
| TF-1 | at Alpha Centauri, 11 fighters, 38 drones, tank 12/12 |
| Alpha Centauri | held, hub integrity 48/60, Foundry-1 harvesting |
| Pending ledger | 15.6 S, repaired at ~6 S/turn |
| Decision | Upgrade the Solar hub to Tier II (200 S) to unlock Depot L2 and repair; or build a second Foundry (120 S); or leave TF-1 and cover Epsilon Indi (a Tier A jump with 9.7 F, leaving 2.3 in tank) |

What the example shows: Power is binding (4 points fully allocated); S piles up faster than before, so the first choice is
investment (a second Foundry, 120 S, payback ~20 turns) rather than survival; the Foundry's yield is almost irrelevant in a fight and
its **loss** is the cost. Compare ECONOMY 7: there the binding limit was depot throughput; here it is Power and slots.

## 17. Objections and risks (critical)

- **O1. Scope.** This is a second game on top of a fighter game that is still being tuned [R: STRATEGY_LAYER 1]. The hub layer
  adds Power, slots, tiers, lanes and two AI sides. Thin slice first (section 14).
- **O2. Meter creep.** ECONOMY O1 and 5.2 name spreadsheet fatigue. Power is an extra meter. It is local and small, but if
  playtests show players ignoring it, fold it into depot level and drop it.
- **O3. Solar-luminosity abstraction.** The physics (5.2) says a faint star is not weak in itself. `f = clamp(L, 0.25, 4)` is a
  game convenience; it will look wrong to an astronomer. The inner-orbit option softens it, not removes it.
- **O4. Map is Sol-centred and dense** (`STAR_MAP.md` 7.1): 37 Tier A lanes. Fusion and fuel range are the only brake; if the
  first playtest shows no chokepoints, shorten the range.
- **O5. Hub scale vs voxel cost.** Section 14. Do not commit Tier II/III until a km-scale prototype is measured.
- **O6. Auto-resolve dominance.** A hub siege with a 3-turn tick can be skipped cheaply; the 1.3x penalty and flown-only rewards are
  mitigations, not proven (ECONOMY 5.2).
- **O7. FROGG simplicity vs asymmetry.** The FROGG side is a clock, not a mirrored economy. If the owner wants FROGG hubs (power
  infrastructure the player can seize), that is a different design (SM-11).
- **O8. Real-data dependency.** Body lists come partly from catalogue data that is only [S]/[M] (`STAR_MAP.md` 9). Anything shown to the
  player as astronomy should be re-checked, and fictional bodies must be flagged.

## 18. Open questions with my default (same format as `docs/OPEN_QUESTIONS.md`)

Each item has my default; if you do not decide, the default is what a later build would use. Numbering is local (SM-n).

**SM-1. Bubble size.** 50 ly or 100 ly. Default: **50 ly**, 20 systems (`STAR_MAP.md` 1). Evidence: argument, not data.
**SM-2. Jump price and range.** 1 F per ly, tank 12 F, standard 12 ly; Tier B (12-22 ly, 2 turns, tanker) and Tier C (29-31 ly, 3 turns, tanker plus beacon). Default as stated.
**SM-3. Foundry class and count.** Frigate-class hull <= 450 m, jump-capable, 120 S, 8 turns; separate from the 2-4 warship frigates. Default: **separate count**, 1-3 Foundries.
**SM-4. Structures above the 500 m cap.** Default: **Tier I hubs only (<= 450 m) in the first build; Tier II/III (1-5 km) as an explicit exception for immobile structures** once a prototype shows the renderer copes.
**SM-5. Haulers.** Frigate-class, jump-capable, 60 cargo, 90 S. Default: **optional, off in the thin slice**; connectedness stays abstract (ECONOMY 3.2).
**SM-6. Power as capacity.** Local points, not a pool. Default: **keep**; drop if playtests show it is ignored.
**SM-7. Solar scaling.** `f = clamp(L, 0.25, 4)` at 1 AU plus the inner-orbit option. Default: **keep**.
**SM-8. Fusion fuel.** Uses the F pool; needs a giant or hauled F; a hub without fuel goes dark. Default: **keep**.
**SM-9. Finite deposits (ECONOMY Q20).** Default: **no for humans** (yield cap per body per turn); **yes by FROGG depletion**.
**SM-10. Do FROGGs obey the lane and jump rule?** Default: **yes** for v1 (FLEET_LOGIC 8 open question 3).
**SM-11. Hub capture, FROGG hubs, human-vs-human.** Default: **no capture by anyone** (disable/destroy only); no FROGG power infrastructure.
**SM-12. FROGG origin.** Default: **south, beyond LHS 1140**, path via TRAPPIST-1, Fomalhaut, Gliese 876 (`STAR_MAP.md` 8).
**SM-13. Number of systems in the first version.** Default: **8** (section 14), not 21.
**SM-14. Hub-defence mission representation.** Default: Tier I as a normal ship-like object; larger tiers as backdrop plus hardpoints.
**SM-15. Win condition.** Default: **W2 Outlast (30 turns)** with authored beats; W1 as an upgrade.
**SM-16. Knowledge levels.** Default: **four levels**, all systems start Charted; drones scout only in-system.
**SM-17. Fictional bodies and real names.** Default: **real names for stars and confirmed planets; any invented body is marked fictional on the system sheet** and in the CSV.
**SM-18. Verification of the star data before it is shown as fact.** Default: **one query each to the NASA Exoplanet Archive and SIMBAD for the 21 names** (`STAR_MAP.md` 9) before player-facing text is written.

## 19. What was and was not verified

- **Verified (repo):** the rules cited as [R] were read from the repo documents named; none of the mechanics proposed here exist in code.
- **Not verified:** every number in this document ([PH]); how the renderer handles km-scale objects; whether a hub-defence mission is
  buildable in the mission framework; whether the economy balances (needs the headless Monte Carlo in ECONOMY 8); whether players
  would fly rather than auto-resolve.
- **Real-world data:** see `docs/STAR_MAP.md` sections 0 and 9. The page-fetch tool failed for every host in this session, so the
  astronomy rests on search-result summaries and memory.

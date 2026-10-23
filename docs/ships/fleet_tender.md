# HECLA: the human strategic fleet tender (specification, no code, no geometry)

Status: the 4 km design below is the original 2026-10-23 proposal. Owner decisions superseded its envelope and several strategic assumptions; the 1 km geometry and database entry are now implemented in `src/30_ships_human.js` and `data/db.json`. The companion `fleet_tender.db.json` matches the implemented database record. The rest of the proposal remains design context, not implemented game behavior.

Evidence tags: **[R]** read in the repo this session (file named). **[C]** my arithmetic, reproducible from the stated inputs; not a simulation.
**[PH]** placeholder number of mine, derived from nothing external. **[M]** recollection, unverified. **[S]** sketch estimate: I rasterised the box
layout of section 9 in a throwaway Python script (`numpy`), counted voxels with the exposed-face rule of `voxelize`; the real prims will differ.
The 1 km model was tested in the Shipyard at all eight detail settings and spawned in a headless game. That does not verify real-device performance, campaign services, repair, scripted docking or real-device play.

## Owner decisions and implementation boundary (2026-10-23)

- Envelope: 1,000 m (`half [145, 50, 500]`, radius 520 m); geometry and spatial database fields are quarter-scale from the original 4 km sketch.
- Power: one main reactor, retaining the original aggregate 6,000 hp. The owner rule is a 25% output floor while damaged and ship destruction at 0 hp; this task did not change the combat/power implementation.
- Repair: strategic layer and scripted segments only; never live.
- Acquisition: buildable at a Tier III yard. This is a design decision only; no yard or menu integration was added.
- Voxel settings are measurement-driven: `resMul: 0.6`, `resCap: 240`, `noDetail: true`. The all-quality voxel counts and build timings are in section 3.1. Headless SwiftShader rendered-frame intervals were also recorded; they are not representative of device GPU performance.
- The avoidance radius is now 654 m (`1.2 * 520 + 30`); an AI Darter approached from 700 m in the headless check. Avoidance within 654 m remains unchanged.
- Open design point: behavior of a major ship berthed while HECLA is attacked (question 5 below).

## 0. Name, and how it relates to the tactical Tender

- **Name: HECLA, id `hecla`, role string `STRATEGIC TENDER`.** Human lineage so far: Kestrel and the planned Falchion (birds and blades), Halberd (polearm),
  Exeter (a Royal Navy cruiser name) [R: `docs/LORE_FACTIONS.md` 4]. A naval-logistics name fits the Exeter end of that list. HMS Hecla was, by my
  recollection, the Royal Navy's first purpose-built torpedo-boat depot ship (1878) and a second Hecla was a destroyer depot ship in the Second World War
  [M, unverified]: a ship whose job was to carry and service other warships. No existing id, name or file in the repo contains "hecla" [R: grep]. Alternatives
  if the owner dislikes it: Adamant, Maidstone, Tyne (also depot/tender names [M]).
- **Name clash to fix in the docs, not in this file.** The tactical Tender's `role` string in `data/db.json` is already `FLEET TENDER`, `docs/SHIPS.md` says
  "fleet tender ships resupply", and `docs/SHIP_CLASSES.md` uses "fleet tender" for the strategic class. Three meanings for one phrase. Recommendation: the 200 m
  hull keeps the name TENDER and its role string becomes `LOGISTICS FRIGATE`; "fleet tender" then means Hecla only.
  (`STRATEGY_MECHANICS.md` 5.3 also has a static "Fusion tender" power hub, Tier I, which is a third object; rename it when that document is next edited.)
- **Relation to the tactical Tender: complementary, neither replaced nor carried.**

| Question | Answer | Reason |
|---|---|---|
| Does Hecla replace the Tender in the campaign layer? | No. | The Tender is the frigate-class jumper that is a task-force member and the only hull with **live** player docking (`D`, `dockTry`, 55_ships.js) [R]. Hecla has no live docking by class definition [R: SHIP_CLASSES 1, 4]. |
| Does Hecla carry the Tender? | No. | The Tender has its own jump drive (`jump: true`) [R: db.json]; carrying it saves nothing. A medium berth could take it in a pinch (200 m is far inside the 1,200 m medium window), but there is no rule needing it. |
| Depot level at a node | Tender = mobile **Depot L1** (rearm, drones; 6 S/turn). Hecla = mobile **Depot L2** (adds repair and refuel; 15 S/turn). | `docs/ECONOMY.md` 3.2: "logistics ship = mobile level-1 depot"; 6.2: L1 6 S, L2 15 S and "L2 adds repair" [R]. Depots do not stack at a node: the highest level applies and throughput is the maximum, not the sum [PH]. |
| In a flown mission | Hecla gives wingmen and any friendly in range the slow shuttle trickle (the 0.5x path of `tenderTick`). The player's own fighter still gets the 2x boom rearm only from a Tender. | `docs/SHIP_CLASSES.md` 4: hovering AI wingmen get "the slow shuttle service" [R]. Keeps `D` a Tender-only feature and avoids a second hard-coded dock point (section 11). |
| Why keep both | Hecla is one campaign asset; the Tender is a cheap, many-per-campaign forward depot that can leave Hecla's side. | `docs/ECONOMY.md` 3.1: the frigate is the critical mobility unit, a mobile depot should not be the only one [D]. |

## 1. Role and doctrine

### 1.1 Services (all for friendly ships only)

| Service | What it does | Where it happens | Limit |
|---|---|---|---|
| **Rearm** | Refills gun magazines, missile racks, XL slugs, PD drums (the magazine rule of `docs/SHIPS.md`) | Berthed ships: scripted. Others: shuttles, live | Strategic: part of the 15 S/turn throughput. Live: trickle only |
| **Repair** | Restores structure, components, shields of **berthed** ships and of ships stored in its racks and hangars | Strategic layer between missions, or as the result of a scripted segment | **Never live.** Mobile Depot L2: 20% of build cost x fraction lost, inside the 15 S/turn cap [R: ECONOMY 6.3] |
| **Refuel** | Tops up fuel; its own jump tank is the same pool | Strategic layer | Stock 120 F (section 6.3) |
| **Berth fighters** | 96 fighters in four flight decks (24 each) | Internal hangars | Passengers: ferry and replacement pool. The air groups of berthed carriers stay in those carriers |
| **Berth corvettes** | 12 corvettes, three per rack, four ventral racks | External racks | Halberd 128 m x 3 = 384 m fits the 400 m racks |
| **Berth major ships** | Two heavy slips (a ship up to 2,400 x 400 x 270 m), or four medium berths (up to 1,200 m each), or one heavy plus two medium | Open slip frames, port and starboard | Scripted only (1.2). Berth operations take half a turn each way and cannot share a turn with a jump |
| **Launch shuttles** | 24 resupply shuttles from four gate bays (6 each) | Live | Service rate scales with surviving shuttle bays (1.3) |

Why 96 fighters and 12 corvettes: four times the tactical Tender's 24 and 4 [R: db.json], on the argument that Hecla stands in for about four Tenders' berthing
at one node. Why two heavy slips: the class text says it docks "cruisers, carriers, dreadnoughts" [R], and a carrier-plus-dreadnought pair is the largest
task force the docs imagine.

### 1.2 Scripted versus live

| Aspect | Scripted (cutscene, stage transit, or state delta) | Live |
|---|---|---|
| Docking of a major ship | Yes, always. Slip approach is a `77_cine` sequence or a stage line; the result is a state change | **Never a player input** [R: SHIP_CLASSES 1] |
| Time berthed | Between missions, or one scripted mission segment | During a segment the berthed ship does not act (open question 5) |
| Repair, refuel, major-ship rearm | Strategic ledger settlement or a scripted delta | No live repair [R: AGENTS "rearm is not repair"; FLEET_LOGIC 8] |
| Jump | Stage `transit` / mission exit line, spool as a mission timer | The player never jumps Hecla; the AI jumps it only by script |
| Defence | | PD and lasers run on the existing turret AI |
| Shuttle service | | Live, automatic (no input) |
| Hangar launches | Mission start positions (as Eagle flight today) | Not implemented for any human hull; do not promise it |

### 1.3 Compliance with the freeze rule
`AGENTS.md`: any new player-facing system needs a touch binding, an AI default and a help line. Hecla adds no key, no menu and no order: the player flies a
fighter near it. The shuttle trickle is automatic. If the owner later wants live fighter docking at Hecla, that is a new system and falls under the freeze.

### 1.4 Jump capability and its constraints
Rule base: jump-capable is "frigate-class and up (about 450 m)" [R: LORE.md adopted lore]; `AGENTS.md` still says only frigates and the Bullfrog jump, which
is stale for a 4 km hull and needs one line when this is built. Hecla has `jump: true`.

| Constraint | Value | Reason |
|---|---|---|
| Fuel | **4 F per light-year**; tank 48 F gives 12 ly (Tier A) | `STAR_MAP.md` 7: frigate 1 F/ly, tank 12 F [R]. Mass class 150 -> 2,000 is 13.3x [R: db.json `mass`]; 4x is about the square root (3.65) [PH]. Linear scaling (13 F/ly) would make the ship unusable. |
| Tier B (12 to 22 ly) | Self-sufficient: 88 F needed for 22 ly = 48 tank + 40 from the 72 F cargo reserve | STAR_MAP Tier B needs "+10 F beyond the tank" from a tanker [R]; Hecla is its own tanker. |
| Tier C (29 to 31 ly) | Not possible | Needs about 124 F, more than the 120 F stock, plus a beacon [R: STAR_MAP]. Keeps Hecla off the longest lanes by arithmetic, not a special rule. |
| Time | 1 turn on Tier A, 2 on Tier B, charging turn vulnerable | Same as every jumper [R: STAR_MAP 7] |
| Berthed ships | Travel with Hecla and spend none of their own fuel | "Everything docked travels with it" [R: STAR_MAP 7]. This is the economic reason to berth. |
| Spool (flown) | 60 sim-s (160 real s) stationary below 2 m/s | A "protect the tender until it jumps" timer: long enough to be a mission, short enough for a 5-minute session [PH]. |
| Readiness | At least 3 of 4 reactors above 40% hp and no berth operation running | Ties the jump to the owner's reactor threshold (section 7) [PH]. |
| Jump-in | No special arrival invulnerability | Fixed lane ends make arrivals predictable [R: STRATEGY_MECHANICS 5.7]; a jump-in ambush on Hecla is a mission type, not a bug. |

### 1.5 How the AI and mission layer use it
- **Spawn flags** that already exist: `ai.role: 'capital'` (as the Tender and Hive Carrier), and per-spawn `hold` / `vital`, which make `capitalAI` throttle to 0.12 and
  station-keep [R: 70_ai.js 366]. With no mounts and no missile stores, `capitalAI` does nothing else, as for the unarmed Tender.
- **Escort**: friendly escorts use the existing `ai.escort` path [R: 70_ai.js 347].
- **Enemy targeting**: Hecla is a `cls capital`, so it enters every target list; the mission data should set its priority, not the ship.
- **Mission types it generates** (STRATEGY_MECHANICS 5.7, 11): defend the tender while it spools, siege break, jump-in ambush, escort a shuttle run, recover a
  damaged berthed carrier. Each is a protect-object mission: the tender never wins anything, it only must not lose.
- **Strategic layer**: a task force with Hecla at a node counts as having a Depot L2 there.

## 2. Lore line and crew

> **CDF-S *Hecla*, Strategic Fleet Tender.** The Colonial Defence Force's only mobile base: a PAU Luna-yard hull on a mega-transport frame [R: LORE_FACTIONS 3, PAU
> "builds most 2 km mega-transports"], EC-standard PD-30 and sensor fit, a Vanderbilt-Astra jump core under licence [R: LORE_FACTIONS 2, VAC "holds the patents on
> capital jump drives"]. She does not fight. She carries the yard, the magazines and the fuel the fleet fights with, and the fleet's carriers and cruisers come alongside her to be made whole.

Crew **6,400** (class floor 5,000+ [R: SHIP_CLASSES]): 2,200 ship's company (operations, engineering, damage control), 2,600 yard and repair technicians, 700
ordnance and supply handlers, 500 flight deck, shuttle and medical, 400 command and staff [PH]. Reason for the split: most of the crew exists to repair other
ships, which is why the class is not a dreadnought's 10,000+ [R].

## 3. Dimensions and silhouette

| Quantity | Value | Reason |
|---|---|---|
| Length | **4,000 m** | Between the carrier rung (owner ladder 2 to 3 km, Hive Carrier 2.5 km) and the super-capital rung (about 5 km) [R: CAPITAL_COMBAT 1, SHIPS.md]. A ship that berths 2.4 km carriers needs about 2,800 m of slip rail plus bow and stern: 4 km. If human carriers stay at the 1.5 km of `SHIP_MANUAL.md`, scale to 3,000 m (open question 1); the voxel cost does not change (3.2). |
| `half` | **[580, 200, 2000]** | x: spine 90, inner rail 110..138, 402 m clear slip, outer rail 540..568, rounded to 580. y: rails at +-150 plus member 28 gives 164; command tower top at 185; rounded to 200. z: half the length. |
| `radius` | **2,080** | 0.52 x length, the convention of Exeter 235/450, Bullfrog 305/600, Hive Carrier 1,306/2,500 [R: db.json]. |
| Span x height | 1,160 x 400 m | 2 x half |
| Slip envelope (each of two) | 2,400 x 400 x 270 m clear (x 138..540, y +-136), rails z -1,400..1,400 | Berth window z -1,200..+1,200. Largest major ship that fits [PH]; a ship over 400 m beam or 270 m height does not berth. |
| Aspect | 8.7 : 2.9 : 1 | Reads as a long frame, not a block. |

Ladder (authored-in-game sizes) [R: db.json, 32_scale.js, SHIPS.md]:

| Ship | Length | Half [x,y,z] | Radius | Note |
|---|---|---|---|---|
| Tender | 200 | 40, 24, 100 | 105 | logistics frigate |
| Exeter | 450 | 108, 48, 230 | 235 | jump frigate |
| Bullfrog | 600 | 95, 55, 300 | 305 | FROGG carrier, the one cap exception |
| Hive Carrier | 2,500 (authored 900, `scaleShip` x2.78) | 750, 333, 1,250 | 1,306 | unarmed catalogue hull |
| **Hecla** | **4,000** (authored at size, no `scaleShip`) | **580, 200, 2,000** | **2,080** | |

Hecla is authored at its in-game size, like the Bullfrog, so the JSON holds the real values and `32_scale.js` needs no line. `AGENTS.md` caps ships at 500 m
with one exception (Bullfrog); the Hive Carrier at 2.5 km is already loadable from the skirmish menu with a warning [R: 76_menu.js 20, 126], so the cap is
already a convention, not a hard limit. Hecla needs an owner exception of the same kind.

### 3.1 Render and collision limits
- **Camera far plane 6,000 m** (`40_scene.js` 9), near 0.1, standard (not logarithmic) depth. Hecla's 1,000 m length fits within the view when centred up to about 5,500 m away side-on. Depth resolution at 5 km is about 15 m (`z^2 / (near x 2^24)`) [C], greater than the 4.17 m max-quality voxel; emissive detail may z-fight at range.
- **Distance LOD has little effect.** `lodTick` compares `radius / distance` with thresholds 0.02 / 0.008 / 0.0035 (normal) [10_config.js]. Hecla's ratio at the 6 km far plane is 520 / 6,000 = 0.087, above the first threshold. Voxel budgets are controlled by `resMul`, `resCap`, and `noDetail`.
- **Voxel resolution** uses `resFor = min(RES_CAP 420, def.resCap, round(DETAIL_STEPS[idx] x (length/12)^0.4 x resMul))`; measured counts below are from the Shipyard at each quality level. The model uses `resMul: 0.6`, `resCap: 240`, `noDetail: true`.

| Quality index | Detail step | Voxel instances | Shipyard voxel-build time |
|---:|---:|---:|---:|
| 0 | 24 | 1,264 | 3 ms |
| 1 | 40 | 5,224 | 5 ms |
| 2 | 64 | 17,310 | 11 ms |
| 3 | 88 | 23,264 | 12 ms |
| 4 | 112 | 23,264 | 11 ms |
| 5 | 160 | 23,264 | 11 ms |
| 6 | 224 | 23,264 | 11 ms |
| 7 | 288 | 23,264 | 11 ms |

The cap makes quality levels 3–7 share the same measured voxel count. In the latest headless SwiftShader run, 15 rendered-frame intervals were 383 ms median / 450 ms p95 in Shipyard and 150 ms median / 433 ms p95 in-game; these timings are not representative of device GPU performance.
- **Collision**: `collideShips` prefilters on `radius + 3` and then traces voxels [R: 65_combat.js 278]. AI avoidance uses centre distance and remains unchanged: `1.2 x radius + 30` = 654 m [R: 70_ai.js 154-163]. A Darter AI advanced toward Hecla from 700 m in the headless test; this verifies approach outside the avoidance margin, not behavior inside it.
- **Blast damage**: `blastAt` measures from the hull for radius over 150 m (`hullGap`) [R: 60_weapons.js 294].

## 4. Performance

| | Tender | Exeter | Bullfrog | Hive Carrier | **Hecla** |
|---|---|---|---|---|---|
| Max speed (m/s) | 24 | 30 | 22 | 12 | **10** |
| AI speed | - | - | 14 | 8 | **6** |
| Accel | 2.5 | 3 | 2 | 0.5 | **0.15** |
| Turn (rad/s) | 0.07 | 0.08 | 0.06 | 0.03 | **0.012** |
| Sim-s to move its own length | 8 | 15 | 27 | 208 | **400** (1,067 real s) |
| Sim-s for a 180 degree turn | 45 | 39 | 52 | 105 | **262** (698 real s) |
| Jump | yes | yes | yes | yes | yes, 4 F/ly |

Reasons [PH, all]: **10 m/s** keeps the speed ladder monotone (Hive 12) and makes Hecla stationary against a Kestrel's 150 and a torpedo's 280; the arcade model approaches
`maxSpeed` with a 2 s time constant for non-fighters [R: 50_state.js], so `accel` only matters to the Newtonian flight models. **AI speed 6** (0.6x, Hive 0.67x, Bullfrog 0.64x). **Turn 0.012**: 0.4x
the Hive's, so the ship cannot be manoeuvred to dodge anything; real time uses `SIM_SPEED` 0.375 [R]. Speed and turn scale with the mean engine hp fraction
(`speedMul`, `turnMul`) and eight engines make a single loss cheap [R: 50_state.js].

## 5. Survivability

### 5.1 Hull

| Item | Value | Reason |
|---|---|---|
| Structure | **12,000** | 7.5x Exeter (1,600), 4x Bullfrog (3,000), 2x the Hive placeholder (6,000). Structure does not follow volume in this game (Tender 1,400 at 200 m); it is set by how long the mission should last (below). |
| Shield | **8,000 fore / 6,500 aft**, regen 30/s after 4 s without a hit | Shield/structure 0.67, the Bullfrog's and Hive's ratio. Regen 30/s refills 8,000 in 267 sim-s, the Bullfrog's order (2,000 at 6/s = 333 s). |
| Armour | **composite, rating 0.30** | Composite spall is 0.12 against hard's 0.30 [R: ARMOR]; spall goes to the nearest component and this hull is nothing but components. Threshold 3 x capital 2 = 6: hits under 6 are mostly stopped. All-round, because the threats are mixed (masers, rods, torpedoes, nukes). Hard would resist masers (0.4x) and nukes (0.6x) better but is 1.4x for kinetics and spalls heavily. |
| Signature | **24** | `sig` divides lock time by `max(1, 0.7 x sig)` [R: 60_weapons.js 202]: lock in 1/17 of nominal time. Hive 20, Bullfrog 12, Exeter 8. A 4 km ship cannot hide; it is the biggest radar return in the game. |
| Mass class | `capital` (2,000) | No larger class exists; carriers and Hecla collide at the same mass. A `supercap` class belongs with the first super-capital. |

Hits through the armour (composite 0.30, capital threshold 6) [C, replicating the armour step of `applyHit`]:

| Hit | Passes | Note |
|---|---|---|
| R-4 autocannon 1.5 | 0.07 (4%) | FROGG fighter-scale guns cannot hurt it |
| Kestrel cannon 3 | 0.5 (18%) | |
| M-1 pulse maser 3.5 | 0.8 (24%) | |
| HE 7 | 4.9 (70%) | above threshold |
| M-6T maser 24 | 16.8 (70%) | |
| ST-2 torpedo 195 | 136.5 (70%) | one hit = 1.1% of structure |

**Time to kill, lower bound [C]**: a Bullfrog with every weapon firing at Hecla for the whole fight (L1 maser at its 3x focus peak 135/s, six M-6T at 18.5/s each, spine 800/36 s, ST-2 ignored)
drains 8,000 shield in 24 s (shield multiplier 1.25 for energy), then does about 189/s to structure: 64 s. About **88 sim-s (233 real s)** at 100% uptime, in range and with arcs; assume twice
that in play. It is a lower bound, not a prediction: nothing was simulated. This is the mission-length lever: a lone Bullfrog needs minutes, a Bullfrog with Gulpers and a torpedo wave needs one.

### 5.2 Components (101; 32,580 hp total, 2.7x structure; Bullfrog 9,390 over 3,000 is 3.1x)

| Role (count) | Ids | hp each | r | Position (ship space, x mirrored) | Why |
|---|---|---|---|---|---|
| Engine (8) | `E1`..`E8` | 400 | 30 | x +-70, +-190; y +-55; z 1,930 (nozzle z 1,992, r 24) | Exeter 350 to 500; eight small engines so no single loss is decisive. Total 3,200. |
| Reactor (4) | `power`, `power2`..`power4` | **1,500** | 30 | (0, 0, -900 / -300 / 300 / 900) | 12.5% of structure each, 50% together (Exeter's reactor is 50%). `r` 30 gives a direct-hit reach of 2.2 x 30 + 0.8 = 66.8 m [R: applyHit], under the 75 m spine half-height, so a surface hit cannot reach a reactor until the hull above is chipped. Staggered along the keel so one hit (even a spine hit, which damages one entry point only [R: 79_bullfrog.js]) cannot take two. |
| Shield projector (6) | `shieldFL/FR`, `shieldML/MR`, `shieldAL/AR` | 600 | 24 | (+-30, 85, -1,300), (+-554, 178, 700), (+-30, 85, 1,150) | Bullfrog glands 600 to 700. Shield cap and regen scale with mean projector hp [R: updateShieldsAndFx], so losing one of six costs 1/6. Exposed (reach 1.3 x r, soft 1.2x). |
| Radar (4) | `bridge`, `auxcon`, `sensL/R` | 700, 500, 300 | 28, 24, 26 | bridge (0, 160, -1,780) on the tower; aux control (0, 20, 1,200); arrays (+-554, 178, -1,100) | Two control sites so the bridge is not a single point. |
| Radiator (4) | `radDL/DR`, `radVL/VR` | 500 | 55 | (+-146, +-120, 1,450) | Human ships carry radiators [R: LORE.md]. Exposed with reach 1.8 x r = 99 m: deliberate soft targets near the engines. 6,400 MW needs them. |
| Fighter hangar (4) | `hgDL/DR`, `hgVL/VR` | 500 | 30 | (+-55, +90, -800) dorsal, (+-55, -90, 800) ventral | Bays are exposed (1.4x) [R: 65_combat.js 18]. Dorsal and ventral so a berthed ship does not block the doors. |
| Shuttle bay (4) | `shbFL/FR`, `shbAL/AR` | 350 | 28 | (+-520, 0, -1,450) and (+-520, 0, 1,450) | Gate houses at the outer rail ends, clear of the slip tunnel. |
| Repair yard | `yard` | 900 | 45 | (0, 0, 0) | Service comps below are `role: bay`; the ids carry the campaign meaning. |
| Ordnance store | `ordn` | 700 | 35 | (0, -30, -1,250) | |
| Fuel tanks | `fuel` | 700 | 35 | (0, -30, 1,250) | |
| Berth clamp (8, role `dock`) | `clpL1..4`, `clpR1..4` | 500 | 30 | (+-200, 0, -900 / -300 / 300 / 900) | Four per slip: a heavy berth uses all four, a medium berth two. |
| Corvette rack (4, role `dock`) | `crFL/FR`, `crAL/AR` | 400 | 40 | (+-60, -95, -300 / 300) | Three corvettes per rack in line. |
| Turret (52) | `PD01`..`PD40`, `LS01`..`LS12` | 90 | 3.2 / 6 | section 6.2 | Same hp and r as the Exeter's PD and LS-8 turrets. |

Campaign meaning of service components (for the loss and damage model, not engine behaviour): yard dead = no repair; ordnance dead = rearm throughput halved and the stock
lost; fuel dead = no refuel and no jump tank. These are soft kills that leave the ship afloat.

## 6. Armament

### 6.1 Fit and why it is mostly unarmed
No fixed mounts, no missiles, no spine. **40 PD-30 (`pd`, cls S) and 12 LS-8 (`laserM`, cls M)** only; all weapons are existing ids [R: db.json weapons].

Why: (1) the class is a base, and an armed 4 km hull would be driven by `capitalAI` as a gunship (it closes to about 1,100 m of its target and fires mains inside about 1,300 m) [R: 70_ai.js 367-375]; (2) offensive
weight belongs to the Exeter and carrier it services; (3) humans lean on layered PD [R: LORE.md weapon doctrine]; (4) it must stay a protect-object: a tender that wins fights removes the reason to escort it.
The MD-55 (`mdl`) is deliberately absent: it is `bigOnly` and `noPD`, so it would only add a way to hurt capitals.

| Weapon | Count | Role | Numbers [R: db.json] | Reason for the count |
|---|---|---|---|---|
| `pd` PD-30 | 40 (10 clusters of 4) | missiles, torpedoes, fighters, nukes | 1.3 dmg, cd 0.075, range 900, 1,500 rounds (112 sim-s continuous) | The Bullfrog carries 18 small turrets (8 PD + 10 R-4) on 600 m, one per 33 m; 40 on 4 km is one per 100 m, thinner by design: the ship is protected by escorts and its shield, not by its own guns. |
| `laserM` LS-8 | 12 (6 dorsal, 6 ventral) | anti-fighter, anti-corvette beams, pickets | 6.5 dmg (x3 at focus), cd 0.28, 26 MJ a pulse, range 1,800 | Exeter has 8 on 450 m; 12 on 4 km is a token fit. Draw 1,114 MW if all fire [C: 12 x 26 / 0.28]. |

Against fighters the PD does the work: 40 x (1.3 / 0.075) = 693 dps if all were in range [C]; a given approach sees perhaps a quarter. FROGG fighters (Reaver,
Leaper) are therefore not the threat; torpedo bombers (Toad, 3 x ST-2), the Bullfrog's spine and lances, and nukes are. PD drums run dry in 112 sim-s of continuous fire and nothing refills Hecla's own
turrets in the current code (`tenderTick` skips the tender itself): needs the self-service hook of section 11.

### 6.2 Turret positions (ship space; the 4 PD of a cluster sit at cluster centre +-8 m in x and z)

| Cluster | Centre (x, y, z) | Side | Surface |
|---|---|---|---|
| Dc1 | 0, 118, -1,650 | dorsal | citadel top (110) + 8 m pad |
| Dc2 L/R | +-554, 178, -900 | dorsal | outer rail top (164) + 14 m pod |
| Dc3 L/R | +-554, 178, 300 | dorsal | outer rail pod |
| Dc4 | 0, 83, 1,500 | dorsal | spine top (75) + 8 m pad |
| Vc1 | 0, -103, -1,650 | ventral | citadel belly (-95) + 8 m pad |
| Vc2 L/R | +-554, -178, -300 | ventral | outer rail pod |
| Vc3 | 0, -83, 1,500 | ventral | spine belly (-75) + 8 m pad |

LS-8 (all M turrets, 11 m diameter): dorsal (+-70, 83, -1,450), (+-554, 178, -100), (+-70, 83, 1,300); ventral (+-70, -83, -700), (+-554, -178, 500), (+-70, -83, 1,450).
Coverage is a first pass: along the keel the PD clusters are 1,000 to 1,200 m apart against a 900 m range, so the dorsal middle (z about -400) is covered only by the pods at z -900 and 300. Turrets
cover a full hemisphere, no arcs [R: SHIPS.md]. Each turret's component has the same position as its mount (checked).

### 6.3 Hangars, shuttles, berths

| Capacity | Value | How it works |
|---|---|---|
| Fighters | 96 | 4 hangars x 24. Four sets of doors (two dorsal at z -800, two ventral at z +800). Launch behaviour is not implemented for human hulls (the Bullfrog's hangar code is FROGG-specific, 79_bullfrog.js) |
| Corvettes | 12 | 4 racks x 3 on the ventral keel, z -500..-100 and 100..500 |
| Shuttles | 24 (`stores.shuttle`) | 4 gate bays x 6. The craft is the TERN of `docs/ships/shuttle.md` (34 m, crew 3, hose transfer, load of 3,600 rounds), which was specified separately and which I take as given. Two representations: first the abstract trickle below (no new objects), later visible Terns with that document's rates. 24 is [PH]: four loads for each of six corvettes |
| Shuttle range | `shuttleR` 2,600 m from the hull centre | = radius 2,080 + 520 m, the Tender's margin (600 service radius for 105 radius is 495 m) [R: db.json] |
| Shuttle rate (abstract version) | the Tender's 0.5x trickle (20 rds/s, one missile or flare per 4 s) x (live shuttle bays / 4) | A destroyed bay costs a quarter of live service. With visible Terns the rate is theirs (90 rds/s per craft) and the cap is the number of craft in flight |
| Heavy slips | 2 | One ship up to 2,400 x 400 x 270 m each; all four clamps of the slip |
| Medium berths | 4 | Each slip subdivides into two 1,200 m berths; two clamps each; takes a cruiser, an Exeter-class frigate, or a Bullfrog-sized hull |
| Mixed | 1 heavy + 2 medium | Slips are independent |

Berthing is a scripted set-piece (1.2): the major ship flies the slip on a `77_cine` path at about 5 m/s, six clamps close, the state delta is applied, and the reverse on departure. During a berth the
ship's own shield bubble is replaced by Hecla's (the ship sits inside the 8,000 shield ellipsoid; the visual ellipsoid is [0.95 hx, 1.25 hy, 0.97 hz] = [551, 250, 1,940] [R: 55_ships.js 26]).

## 7. Power (docs/POWER.md, step-1 model)

`power: { plantMW: 4800, capacitorMJ: 12000 }` -> `energyRegen` 1,600 MW per bus, `energyMax` 12,000 [R: 16_db.js].

| Quantity | Value | Reason |
|---|---|---|
| Plant | **4,800 MW** = 4 reactors x 1,200 MW | 4.6x Exeter (1,050). Design rule: the weapons bus (plant / 3 = 1,600 MW) must sustain all 12 LS-8 (1,114 MW) at 144%, and still at 108% with one reactor lost (1,200 MW bus) [C]. The ship has no other consumer in the step-1 model. |
| Capacitor | **12,000 MJ** = 2.5 x plant | Exeter 2.4, Tender 2.2, Halberd 2.0 [R: POWER.md table]. It never limits the lasers (bus above draw); it exists for later shield, engine and jump draws (steps 2 and 3). |
| Reactors | 4 x 1,500 hp, ids `power`, `power2`, `power3`, `power4` | Owner threshold logic: **a reactor under 40% hp (600) outputs 25%** (as given in the brief; I did not find these numbers in `docs/POWER.md`, which lists "reactor threshold" only as step 2 [R]). |

Output by state, assuming a reactor at 0 hp gives 0 (my assumption, open question 2):

| Reactors healthy / under 40% / destroyed | Output MW | Weapons bus | LS-8 sustain |
|---|---|---|---|
| 4 / 0 / 0 | 4,800 | 1,600 | 144% |
| 3 / 1 / 0 | 3,900 | 1,300 | 117% |
| 2 / 2 / 0 | 3,000 | 1,000 | 90% |
| 0 / 4 / 0 | 1,200 | 400 | 36% |
| 3 / 0 / 1 | 3,600 | 1,200 | 108% |
| 2 / 0 / 2 | 2,400 | 800 | 72% |

**Conflict with the current engine [R: 65_combat.js 98, 119]**: `applyHit` kills the ship when `compOf(s, 'power')` is dead, and `compEvent` calls `killShip` when **any** component with `role: 'power'` is
destroyed. With four reactors that makes Hecla easier to kill than with one (four kill paths). Until step 2 replaces this, the JSON is valid but the ship must not be flown. The ids keep one reactor named
`power`, the id the old code looks for.

## 8. Balance and role reasoning

**Why a target worth protecting.** One hull concentrates: 2 heavy or 4 medium berths of major ships, 96 fighters, 12 corvettes, 150 S and 120 F of stock, the task force's only mobile Depot L2,
and 6,400 crew. For FROGGs it is the `isCapital` target with the largest signature (24). For the player it is the only place a damaged carrier is made whole without returning to the home Depot L3.

**Campaign-layer numbers [PH, all, chosen in the ranges of ECONOMY 6]**:

| Item | Value | Reason |
|---|---|---|
| Depot level | mobile L2, 15 S/turn | One turn at Hecla settles the example frigate battle ledger of 22 S in 1.5 turns (ECONOMY 8: 8 + 6 + 1 + 1 + 6) [R]. A carrier's ledger is larger, so a heavy fleet takes several turns. |
| Stock | 150 S, 120 F (48 tank + 72 cargo) | 150 S = 3.75x the 40 S cap of a disconnected system (STRATEGY_MECHANICS 7) [R]. |
| Upkeep | 8 S/turn | The Tier III hub's upkeep (STRATEGY_MECHANICS 6) [R]; a frigate costs 3. |
| Acquisition | Not buildable in v1: a scenario-granted unit. Scoring and rebuild value 900 S | Tier III hub costs 600 to 800 S [R: STRATEGY_MECHANICS 5.4], so a mobile jump-capable ship with a yard is above that. 900 S is 75 home-turns of income (12 S/turn, ECONOMY 6.2) [C]: not a purchase. Open question 4. |
| Auto-resolve | Counts as a damage sink (12,000 + 14,500 shield) and a 40-PD screen; it adds no firepower | It must not make the player's side stronger in a fight it cannot fight. |

**Loss consequences** (all tunable, [PH]):

| Asset on board | If Hecla is destroyed |
|---|---|
| Berthed major ship | 50% survive, damaged; the rest lost (open question 5) |
| Ships in hangars and racks | lost; 25% of corvettes are launched in time |
| Stock | lost |
| Depot L2 at the node | gone; the ledger returns to Depot L1 or L3 only |
| Pilots and specialists aboard | resolved by the ejection and SAR rules of FLEET_LOGIC 5, not by crew count |
| Jump mobility of non-jumpers docked with it | stranded, as for any lost jumper [R: FLEET_LOGIC 8] |

Design risk: a pure escort objective is a dull mission if it is the only mission. Mitigations: a spool timer, a threat that attacks from two sides, shuttle service that rearms the player's wingmen while near, and
setting the Bullfrog-alone bound (about 88 sim-s) above the mission length by reducing enemy strength, not Hecla's.

**Tests that would confirm it** (none run). Following AGENTS: seeded (`?seed=`), at least 20 runs per cell.
1. `python3 build.py && python3 tools/validate_db.py` with the JSON merged; `python3 tools/power_table.py` must show hecla: plant 4800, bus 1600, reactors 4, hp 6000, peak 1114, sustain 144 (my copy-run does).
2. Instance counts at detail 2 / 4 / 6 (`__game` build hook): pass if at most 35k / 120k / 120k; build time under 3 s headless.
3. Muzzle and marker check (`tools/tests/muzzle_t.py` style): 52 turrets, bases within 1 voxel of solid, no turret floating; every comp within 2 voxels of the hull.
4. Shield and armour table (section 5.1 passes) reproduced in a unit test through `applyHit`.
5. Duel cell: Hecla alone vs Bullfrog + 2 Gulpers + 12 fighters, 20 seeds. Record median time to kill; hypothesis: Hecla dies in 2 to 4 sim-minutes unescorted.
6. Escorted cell: + Exeter + 4 Halberd + 8 Kestrel, 20 seeds. Hypothesis: Hecla survives a 160 real-second spool in at least 70%.
7. PD cell: 16 ST-2 torpedoes at Hecla, count interceptions; PD drum use in 60 sim-s.
8. Reactor logic (after step 2): set a reactor to 39% and 41% hp and read the output; fire at one reactor and confirm the ship survives losing one.
9. Collision: a Kestrel flies the slip (172 m gaps between arms, 272 m clear height) without damage and takes crash damage on a rail.
10. Real-device frame time on iPad with Hecla + Exeter + 12 fighters: unverified until the owner plays it.

## 9. Voxel design brief (for the later geometry pass, in `src/30_ships_human.js`)

### 9.1 Silhouette
A long open frame hung off an armoured keel, read from the side as a ribcage.
- **Spine** (the keel): x +-90, y +-75, z -1,700..1,650, octagonal section. Holds reactors, yard, stores, crew.
- **Bow citadel**: wedge x +-120, y -95..110, z -1,950..-1,600, nose cone to z -2,000 (x, y +-50). **Command tower** dorsal: x +-30, y 110..185, z -1,830..-1,730. Bridge at its top.
- **Stern block**: x +-230, y +-110, z 1,650..1,960. Eight nozzle housings 48 m square (x +-70 and +-190, y +-55) to z 2,000, glowing nozzles inside them.
- **Slip frames** (the base-like part): per side, four longitudinal rails 28 m square (inner x 110..138, outer x 540..568, upper y 150, lower y -150, z -1,400..1,400), joined by **cross arms every 200 m**
  (15 stations, x 110..568, 28 m square, both levels) and 28 m posts at inner and outer rail, y +-164. Clear opening between arms: 172 m along z, 272 m in y.
- **Clamp arms** (the docking gantries): 60 m square arms from the spine, x 90..310, at z -900, -300, 300, 900, both sides; the amber ones.
- **Hangar blocks**: dorsal x 15..95 (and mirrored), y 75..105, z -880..-720; ventral y -105..-75, z 720..880. Door mouths facing outboard-up and outboard-down.
- **Shuttle gate houses**: x 475..580, y +-45, z +-(1,400..1,500): two on each end of each outer rail. Doors face outward.
- **Corvette racks**: x 10..110 (and mirrored), y -115..-75, z -500..-100 and 100..500; three recesses each.
- **Radiator fins**: 12 m thick, x 140..152 (mirrored), y 60..180 and -180..-60, z 1,375..1,525; plates, not rungs.
- **Container rows** (cargo for the ordnance store): 30 x 25 x 60 m boxes on the spine top at x 30..60 and mirrored, every 80 m except under hangars, pads and dishes. Alternate `E.grey2` and `E.orange`.
- **Turret pads**: 8 m pads on the spine, 14 m pods on the outer rails, sized 30 m (S) to 24 m (M) square, plus 20 m dishes for the shield projectors and 26 m for the sensor arrays. The turrets themselves are `makeTurret` meshes; at
  5 m (S) and 11 m (M) they are specks beside a 10 m voxel, so the pads carry the reading [R: AGENTS "every weapon needs a physical thing"].

### 9.2 Positions the modeller must honour
Engines, turrets, components: `docs/ships/fleet_tender.db.json`, the single source. Every component position in the file lies on or within 8 m of the boxes above [S, checked]. Fixed mounts: none. `launch`: none.

### 9.3 Palette (human fleet, read-only from `src/30_ships_human.js`)
Use the Exeter / Tender palette `E`: hull `E.grey` 0x9aa2ab, secondary `E.grey2` 0x7d858f, plating `E.panel` 0x4a525c, deck highlights `E.white` 0xd8dce0, dark gaps `E.dark` 0x262b31, nozzle housings `E.noz` 0x2a2d33,
amber hazard `E.amber` 0xc79a3a on clamp arms, orange `E.orange` 0xd9772b on containers, glow `E.glow` 0x7fd0ff on nozzles. Flame colour `#66c8ff`. The Tender's `dots` amber lights and `win` window strips are the
only surface texture that works without detail tiers.

### 9.4 Keeping the voxel count tractable
- `noDetail: true` and `resCap 400`. At desktop detail the surface-detail pass would add greebles at 10 m, which are not wanted; revisit after measuring.
- Few large prims: about 270 in the sketch, mirrored by `mirror: true`; loops for the 15 cross-arm stations; no `ringSegs` or greeble kits (each ring is dozens of prims).
- **Minimum member 28 m** (1.6x the 17.5 m tablet voxel) so no frame vanishes at detail 2; **minimum gap 60 m** so the 12 m Kestrel passes at any detail.
- Paint prims (`t: 'paint'`, `t: 'text'`) are skipped at tier 0 (`noDetail`), so amber stripes and hull numbers must be real thin boxes (at least one voxel thick) or `dots`/`win` options on a prim.
- `seam: [80, 60]`: plate pitch 8 and 6 voxels at the laptop grid, so seams read as panels, not noise; the `seam` shading is only used with `noDetail`.
- Hollow nothing: a solid spine costs nothing because interior cells are culled (`inner` test); the frame is the surface-heavy part [S: the frame members alone are about half of the estimated instances].
- `radius` and `half` stay fixed; the damage-patch cap (30k, 60k at detail 6) is for chips and is not the base budget.

### 9.5 What makes it read as a base at 5 km
At 5 km and a vertical field of view of 75 degrees on a 720 px frame (about 9.6 px per degree), the hull spans about 43 degrees (400 px). A 200 m arm pitch is 2.3 degrees: about 22 px, a clear ladder. A 28 m member is about 3 px, a 10 m voxel
about 1 px [C]. So: (1) the **15 repeating cross-arm stations per side** are the base cue, a regularity no warship has; (2) two **open slips** with a sky-lit tunnel through them, filled or empty depending on what is berthed; (3) a **bow wedge and tower** against a **wide stern block with eight
glowing nozzles** gives the direction; (4) **amber clamp arms** and **orange container rows** against grey; (5) a few **window strips** along the keel and the tower; (6) none of the Exeter's or Bullfrog's smooth hull. Berthed ships are the strongest cue of all: the model
must therefore leave both slips empty and clean.

## 10. Items outside this ship's file (doc and code, do not do before the freeze lifts)
Docs to update when it is built: `docs/SHIP_CLASSES.md` (class table, fleet tender row), `docs/SHIPS.md` (ladder, sizes), `AGENTS.md` (size cap and jump line), `docs/POWER.md` (table row), the Tender's `role` string.

## 11. Code prerequisites found by reading (nothing was edited)

| # | Finding [R] | Needed |
|---|---|---|
| 1 | `avoidance()` repels AI ships within 1.2 x radius + 30 of a capital's centre (70_ai.js 154) | per-ship avoidance radius or a hull-distance test; blocks every escort and attacker |
| 2 | A destroyed reactor kills the ship (65_combat.js 98, 119) | power step 2 with N reactors; threshold 40%/25% |
| 3 | `def.tender` drives both `tenderTick` and `dockTry`; `DOCK_PT` is a fixed point (36, 2, -56) in tender space (55_ships.js 172) | split service from live docking; Hecla must not carry `tender: true` as is (this JSON does not). A shuttle service uses `shuttleR` in a new branch of `tenderTick` |
| 4 | `tenderTick` skips the tender itself (`s === t`) | Hecla's own PD drums, from the ordnance store |
| 5 | Engine flame length is clamped to a 7 m base (`clamp(r x 2.4, 0.7, 7)`, 85_update.js) | at `r` 24 the nozzles look like flat discs; make the clamp ship-dependent |
| 6 | `ai.role` has no "hold" role | rely on `hold`/`vital` spawn flags; no change |
| 7 | Standard depth buffer, far 6,000 | consider a reversed or logarithmic depth buffer if capital-scale scenes are common |
| 8 | 52 turrets scan missiles and ships each frame (60_weapons.js `updateTurrets`) | profile; the Bullfrog has 25. Cluster PD scanning if it costs |
| 9 | No hangar launch code for human hulls | only mission-start spawns |

## 12. Owner decisions and remaining question
1. **Envelope (decided).** HECLA is 1,000 m; the previous 3-4 km options are superseded.
2. **Reactor (decided).** One 6,000 hp main reactor; damaged output has a 25% floor; destruction of the reactor destroys the ship.
3. **Repair authority (decided).** Strategic and scripted only, never live.
4. **Acquisition (decided).** Buildable at a Tier III yard. Cost and campaign integration remain unspecified.
5. **Berthed ships under attack (open).** In a scripted segment with a major ship berthed, may HECLA be attacked? If yes, does the berthed ship fight, sit behind HECLA's shield and share its fate, or detach?

## 13. Risks
- **Performance** (the one that matters). Unmeasured: the Hive Carrier has no recorded frame cost either [R: SHIP_MANUAL 6 "No performance test of the 2.5 km model in the sim yet"]. Instances 22k to 120k [S] come from a box sketch and could be 1.5x higher; GPU cost of about 1.2M triangles for the body alone at laptop and above (12 triangles per voxel box) on an iPad is unknown; two capitals in one scene (Hecla + Bullfrog) is about 250k instances. Mitigation: `resMul` is the single dial; 0.30 gives res 196 / 343 and voxels 20 / 11.7 m [C], at the cost of the frame members approaching one voxel.
- **Depth precision and clipping** (3.1): z-fighting of glow voxels, clipping beyond 6 km; both already true for the Hive Carrier.
- **AI and engine assumptions** (section 11, items 1 to 3) can invalidate every mission test; they are blockers, not tuning.
- **Placeholder economics**: every strategic number (15 S, 150 S, 8 S, 900 S, 50% survival) is [PH] and unsimulated.
- **Escort fatigue**: see section 8.
- **Scope**: a ship with no weapons but 101 components and four service roles pulls in a repair model, a shuttle model and scripted docking. The cheap first version is the ship as a protect-object with the shuttle trickle and nothing else.

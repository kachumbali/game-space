# TERN: human resupply shuttle (db id `tern`; file name `shuttle`)

Status: specification, 2026-10-23; hull and database entry implemented on `ship-tern` (2026-10-24). The
`tools/tests/tern_t.py` smoke test passes; the Shipyard reports 14,424 instances at mid detail. Shuttle transfer
and mission-route behavior are not implemented. Companion data:
`docs/ships/shuttle.db.json` is the drop-in value for `data/db.json` `ships.tern`. All numbers
are first guesses with a stated reason; none is measured. Per `AGENTS.md`, balance claims need >= 20 seeded runs,
and a new player-facing system waits for the owner's iPad hand-play; section (h) says what that means here.

## Decision summary

- **Name: TERN.** Bird lineage kept (Kestrel, Merlin, Harrier, Bittern), and it is a bird that ferries food to
  others, which is what the hull does. Rejected: *Pelican* (the Halo dropship is the first association; the owner
  will see it), *Puffin* (apt, a bill full of fish, but it reads comic on a HUD), *Albatross* (a long-range
  hauler, wrong scale). The implementation uses the ship ID `tern`.
- **V1 is scripted-route only; no live shuttle AI** (owner decision, 2026-10-24). This branch adds only the hull
  and database entry; mission integration remains separate.
- **Fungible ammunition pool** (owner decision, 2026-10-24): use one `cargo.ammo` counter, not per-type cassettes.
- **Engine class `fighter` with `shuttle: true`** (owner decision, 2026-10-24); do not add a fifth class.
- Unarmed, no point defence, 12 flares of its own (section (f)).

## (a) Role and doctrine

**What it is for.** `docs/SHIP_CLASSES.md` makes the fleet tender (strategic, lore only) the sender of shuttles to
ships that cannot dock with it, and the tactical Tender (200 m) the in-battle rearm hull for fighters. The Tern is
the missing link between them: a small craft that carries a finite load from a tender to a corvette or frigate
that is not within the Tender's 600 m `serviceR`, hands it over, and goes home. In-game that means
Halberd and Exeter. The Tender's own `dock {corvettes: 4}` has no tactical meaning today (`dockTry` is player-only
and the player flies a fighter), so the Tern is the only way a corvette gets a live rearm beyond hovering.

**What it carries** (`cargo` in the data file; units are the receiver's own units so the transfer is a
min/add on existing fields):

| Item | Capacity | Unit | Reason |
|---|---|---|---|
| `ammo` | 3600 | rounds, any gun pool or PD drum (fungible) | A Halberd's non-drum pools hold 1100 (2 x RG-90 100, GA-9 900); its four PD drums hold 6000 (4 x 1500). 3600 = one load restores the pools plus about 1.7 drums. Exeter needs 5700 from empty (rails 200, 3 PD drums 4500, 4 MD-55 drums 1000) |
| `ir` / `rf` / `torp` | 8 / 4 / 2 | missiles (`stores` units) | Two Kestrel loads (4 / 2 / 1). Corvettes and Exeter carry none, so this exists for stranded fighters and wingmen only |
| `drone` | 6 | SD-4 drones into `stores.drone` | The Halberd's slaved set is 6 (`docs/FLEET_LOGIC.md` 9a); the lore says lost drones come back only "at a base or by a logistics transport". 6 m drones in two racks of 3 fix the hull length (section (c)) |
| `slug` | 4 | MK-90 slugs into `spine.mag` | Exeter's 100 slugs are a campaign number (1 per 30 s); 4 is a token that still lets the model carry the item |
| `flare` | 48 | countermeasures | Two Kestrel loads of 24 |

**Rates** (`xfer`; sim seconds, 1 real second = 0.375 sim seconds; compare `tenderTick` in `src/55_ships.js`):

| Quantity | Tern | Existing reference | Reason |
|---|---|---|---|
| Ammunition | 2 hoses x 45 rds/s = 90 rds/s total, one pool per hose | Tender docked 40 rds/s per pool, hovering 20 | A hose is at least the Tender's docked per-pool rate. Two hoses so a rotary pool and a drum fill together. A full 3600 load unloads in 40 sim-s (107 real-s) |
| Missiles, flares | 0.5 per sim-s | Tender docked 0.5 | Same cassette hardware |
| Drones | 1 per 8 sim-s | not modelled | Cradle release and link handshake |
| Slugs | 1 per 4 sim-s | Tender 1 per 3 s | One hose slower than the Tender's gantry |
| Repair | **none** | `repair: false`, `AGENTS.md` | Binding rule: rearm is not repair. Shield and structure of the receiver are never touched |
| Refuel | **none, not modelled tactically** | fuel is a strategic currency (`docs/ECONOMY.md`, F) | No tactical fuel exists; the fleet tender's jump fuel is a campaign-layer number, not a shuttle cargo |

Reload at the home Tender uses the same rates and the Tender's stock stays infinite (as today); that is a
simplification to be revisited with the economy layer.

**Loiter and escort.** A transfer is a standoff, not a rigid dock: the Tern holds a point 20 m abeam of the
receiver's service point (booms extend 12 m; `xfer.range` 45 m is the distance at which hoses start). Standoff
avoids collision geometry against 128 m and 450 m voxel hulls and needs no cradle model on the receiver. It does
need the receiver to keep a steady course: station is lost above about 0.15 rad/s relative turn rate or 6 m/s
relative speed, and the transfer pauses (cargo is not lost) after 6 s out of station. The Halberd turns at
0.22 rad/s at best, so this is a real constraint. The Tern is helpless: shield 80 plus structure 160 is two
Darters' work. Doctrine is therefore **do not go into a fight; go to a ship that has finished one**:

1. Request: a corvette or frigate with `rearmFrac` < 0.5 (the function in `src/55_ships.js`, extended to PD
   drums) and no Tern already assigned. Frigates weigh 1.5, corvettes 1.0, and the Tern needs at least 600 rounds
   (or any drone/slug/missile deficit) deliverable, so it does not shuttle for scraps.
2. Gate: no hostile armed ship within 1800 m of the service point, and no hostile missile tracking it or the Tern.
   Otherwise it holds at the Tender (or within 300 m of the nearest friendly hull with PD).
3. Flight: transit at `aiSpeed` 65 m/s, arrive on the receiver's rear quarter, match velocity inside 60 m, close
   to the standoff point, transfer, push away at 40 m/s as `dockTry` does on undock.
4. Break rule: any hit taken, a missile warning, or a hostile inside 1200 m aborts the transfer and sends the Tern
   home on the reciprocal of the threat bearing with flares dropping. Cargo already handed over stays handed over.

**What it is bad at:** speed (a Kestrel is 1.9 times faster, 3.4 times with afterburner), turning (0.19 of a
Kestrel), surviving a single torpedo (ST-2 195 damage), and any transfer to a target that is manoeuvring hard.
It also cannot shuttle between two receivers in under about 25 sim-s, so it cannot out-supply a corvette that is
firing its PD continuously (a Halberd's four PD-30 at full duty draw 53 rds/s against about 26 rds/s average
delivery per Tern, see (h)).

**How the code would reuse what exists (not written):**

| Need | Existing mechanic | Change |
|---|---|---|
| Dispatch | `aiUpdate` in `src/70_ai.js` line 210 returns `droneAI(s, dt)` for `def.drone` | add `if (s.def.shuttle) return shuttleAI(s, dt)` and a new `shuttleAI` file (e.g. `src/57_shuttles.js`, same shape as `56_drones.js`) |
| Flight | `turnToward`, `aiFly`, `avoidance`, `sense` (threat/missile detection) in `70_ai.js`; `orderFly` 'form' branch is already "go to a point in a base ship's frame, match its heading, throttle to its speed" | station-keeping at the service point reuses the form branch maths with the receiver as `base` |
| Docking glue | `dockTick` in `55_ships.js`: exponential approach to a tender-local point, then velocity and quaternion glued | generalise the singleton `dock` (player only) into per-ship `s.xfer = {t, phase, t0}`; for the Tern, glue to standoff not to the receiver's skin |
| Rearm | `tenderTick`: `s.ammo`/`ammoMax`, `s.stores` toward `def.stores`, `spine.mag`; `rearmFrac` | factor out `transferTo(src, dst, dt, rates)` so the Tender's trickle and the Tern share one code path; debit `s.cargo` |
| Service point | `DOCK_PT (36, 2, -56)` is a constant | optional `svc: [x, y, z]` per receiver def; default `[half.x + 20, 0, 0.1 x length]` (Halberd about [50, 0, 12.8] after scaling) |
| Drone delivery | `stores.drone`, `launchDrones`, `droneLimitOf` | add to the receiver's `stores.drone` up to `def.stores.drone` |
| Spawn / launch | `spawnShip(id, team, pos, toward, {ai})` | spawn at the Tender's bow cradle or from the mission edge; Tender gains `dock.shuttles: 4` |
| Despawn | the "damaged FROGG broke contact" removal in `aiUpdate` (>2600 m from anchor) | same rule for a fleeing/off-duty Tern when no tender exists |
| Excluded from | `comsWing` (`78_coms.js` line 43) excludes drones | exclude `def.shuttle` as well |
| Scale rules | `32_scale.js` gives every `cls: 'fighter'` turn x 2.85 and an afterburner pool | skip `abMax` for `shuttle`; the authored turn 0.42 gives 1.20 rad/s on purpose |

**Two defects in the current rearm path that block the whole idea** (found by reading, not by running):

1. `tenderTick` and `rearmFrac` only handle `s.ammo` mount pools, `s.stores` and `spine.mag`. **Turret drums
   (`T.ammo`, `src/60_weapons.js` 441-544) are never refilled, and `T.dry` is never cleared.** `docs/WEAPONS.md`
   says "only a tender restores it"; in code, nothing does. The Halberd's and Exeter's PD drums (6000 and 5500
   rounds, most of the logistics demand of the ships the Tern serves) are therefore outside any rearm. Fix first:
   refill `T.ammo` toward `T.w.ammo`, clear `T.dry`, restore the darkened material colour.
2. `pickTarget` ignores tenders (WEAPONS.md red-team item 2), so FROGG AI will probably ignore a Tern too. Loss
   rates measured before that is changed are optimistic; section (h) treats it as a confound.

**Freeze rule.** `AGENTS.md` freezes new player-facing systems until iPad hand-play. The AI loop has no player
binding, but it changes mission outcomes and a player will see it. Recommendation: build it behind a URL flag
(`?shuttle`), off by default, no comms order, no help-overlay line (nothing to bind), and ask the owner to play it
before it becomes default. A "REARM ME" comms order (FS2's Support type, `docs/FLEET_LOGIC.md`) is player-facing and
stays out until then.

## (b) Lore line and crew

TERN, CDF logistics wing, "the shuttle that carries the fish to the nest". The 34 m class sits in the same size
band as the planned SAR cutter (`docs/LORE_FACTIONS.md` section 5: about 32 m, crew 3, ventral pod bay), and it is
reasonable to treat both as marks of one utility airframe: Tern = cargo pods, SAR cutter = pod bay and winch.
Crew **3**: pilot, loadmaster (runs the hoses and booms, which is what a transfer needs a person for), systems
engineer (damage control, the reason it does not die to one hit). That is above the Kestrel's 1-2 and far below the
Halberd's about 25. No weapons specialist, no drones slaved (it only carries them). Ejection: a three-person
shared pod is an extension of the two-seat rule in `docs/LORE.md`; marked as an open point, not decided. Eject and
SAR logic are not needed for a first version (an AI Tern that dies is simply lost).

## (c) Dimensions and silhouette targets

Scale reference (`docs/SHIPS.md`): Kestrel 12.4 m, Merlin 9 m, Drone 6 m, SAR cutter about 32 m (lore),
Halberd 128 m (authored 64 m, scaled x2 by `32_scale.js`), Tender 200 m.

| Field | Value | Reason |
|---|---|---|
| `length` | **34 m** (2.7 x Kestrel, 0.27 x Halberd, 0.17 x Tender) | Two racks of three 6 m drones need an 18 m cradle run; nose cockpit about 5 m; engine block about 8 m; the rest margin. Smaller than 30 m cannot hold the rack, larger than 40 m starts to look like a small corvette |
| `half` | `[9.0, 5.0, 17.5]` | x: pod centre 6.2 plus half pod 1.8 plus stowed boom 1.0. y: dorsal drone rack and bridge dome. z: half length plus nozzles |
| `radius` | 18 | `radius / half-diagonal` for Kestrel is 0.74, Tender 0.95; half-diagonal here is 20.3, so 18 (0.89) keeps it an easy hit target, which is intended |
| `seam` | `[2.0, 1.5]` | between the Kestrel (1.5, 1.1) and Halberd (3.2, 2.4) |
| `resMul` | 0.8 | `resFor` multiplies by (length/12)^0.4 = 1.52 over a Kestrel already; 0.8 keeps it well under the Halberd's about 35k instances. **Measured at 14,424 instances at Shipyard mid detail.** |
| `eye` | `[0, 1.9, -13.2]` | forward of the bridge dome, for debug flight and ship sheets |
| Cargo | `ammo 3600, ir 8, rf 4, torp 2, flare 48, drone 6, slug 4` | table in (a) |

Silhouette targets (details in (i)): length-to-span 2.0 (34 : 17); height-to-span 0.6 including the dorsal rack;
the plan view must read as "H": a narrow centre spindle with two long pods, not a flying wing.

## (d) Performance

| | Max speed m/s | Accel m/s^2 | Turn (authored) | Turn effective rad/s | Afterburner |
|---|---|---|---|---|---|
| Kestrel | 150 | 75 | 2.2 | 6.27 (x 2.85) | 20 s at x 1.8 (270 m/s) |
| Drone | 190 | 120 | 2.6 | 7.41 | yes (fighter) |
| Halberd | 28 | 6 | 0.22 | 0.22 | none |
| Tender | 24 | 2.5 | 0.07 | 0.07 | none |
| **Tern** | **80** (`aiSpeed` 65) | **14** | **0.42** | **1.20 (x 2.85)** | **none** (`abMax` forced to 0) |

Reasons:

- **Speed 80.** It must overtake a 24-28 m/s hull with ease and cross 1.5 km in 23 sim-s at cruise (62 real-s);
  half that would make a delivery cycle longer than most engagements. It stays at 0.53 of a Kestrel (0.30 with
  afterburner) so any fighter that wants it, catches it.
- **Acceleration 14.** Top speed in about 6 sim-s: loaded and heavy, 5.4 x lower than a Kestrel, 2.3 x a Halberd.
- **Turn 0.42 authored.** The global fighter x 2.85 gives 1.20 rad/s, 5.4 x a Halberd (needed to sit beside a manoeuvring
  corvette), 0.19 of a Kestrel (it cannot evade a gun fighter, only missiles with flares).
- **Class `fighter`, flag `shuttle`.** `isCapital(s)` is `cls !== 'fighter'`, which routes to `capitalAI`; a
  `fighter` is the cheaper way to reach a custom `aiUpdate` branch. Consequences accepted: fighter damage threshold
  (x 0.25), instant destruction without the 3.2 s break-up, enemy PD treats it as a fighter, mass class 1
  (`MASS`: fighter 1, corvette 25), which is wrong for a 34 m hull in collisions with friendly capitals; a
  per-def `mass` override is a small second code item. The alternative `corvette` class would give threshold x 1
  (shrugs off PD), `capitalAI` and mass 25 and is wrong for a 160-structure craft.
- **Delivery cycle at 1.5 km** (all sim-s): reload at the Tender 40, transit 23, approach and match 8, transfer up
  to 40, depart 4, return 23: **138 sim-s = 368 real-s**; if the load is spent that moves 3600 rds, an average of
  26 rds/s.

## (e) Survivability

| Field | Value | Reason |
|---|---|---|
| `structure` | 160 | 3.2 x Kestrel (50) for 2.7 x its length, well under the Halberd's 420. A single SK-1 (31, blast 9) does not kill it (shield 80 absorbs it first); about 6 do. One ST-2 torpedo (195) does |
| `shield` | fore 80 / aft 60 | 2 x Kestrel (40/40); nose-on during approach; aft thinner, engines are the weak end |
| `shieldRegen` | 1.5 | ratio to shield 0.019, between Kestrel 0.025 and Tender 0.013 |
| `armor` | composite 0.30 | Tender 0.25, Kestrel 0.44: a thin-skinned hauler. Effective durability about 80 + 160 / 0.7 = 309 against a Kestrel's 129 (2.4 x) |
| `sig` | 2.0 | missile lock time is divided by `max(1, sig x 0.7)` (`src/60_weapons.js` 202): 2.0 gives 1.4 x faster locks than a Kestrel. Linear size ratio is 2.7; discounted for no radar emissions and no weapon charge. Placeholder |
| Flares | `stores.flare 12` (own, separate from cargo) | The only defence; the Kestrel carries 24 |

Components (all roles already used elsewhere: `engine`, `power`, `radar`, `shield`, `bay`; `hp` pool is 2.7 x structure,
the same ratio as the Kestrel's 134 : 50):

| id | Role | Position (ship space) | r | hp | Note |
|---|---|---|---|---|---|
| engC | engine | 0, 0, 14.2 | 1.6 | 40 | |
| engL / engR | engine | -3.4 / 3.4, 0.2, 14.2 | 1.3 | 28 | exposed x 2.2 |
| power | power | 0, 0, 8.5 | 1.8 | 60 | 38 % of structure (Kestrel 60 %, Tender 30 %); death kills the ship |
| bridge | radar | 0, 1.9, -12.5 | 1.5 | 30 | exposed, soft x 1.5 |
| shield | shield | 0, -2.2, 2.0 | 1.4 | 45 | ventral projector |
| podL / podR | bay | -6.2 / 6.2, 0.3, -1 | 3.4 | 70 | each holds half the cargo |
| boomL / boomR | bay | -8.3 / 8.3, 0, -6.5 | 1.1 | 35 | transfer booms, stowed |

`bay` has no mechanic in code today beyond `EXPOSED` 1.4 and `SOFT` 1.2; the new behaviour would be: a destroyed
pod loses half the cargo, a destroyed boom halves the transfer rate, both booms gone ends the delivery. This is
code that does not exist and is part of the shuttle item.

## (f) Armament

None, and no PD. Reasons: (1) a PD-30 turret needs a 1500-round drum, S assembly (5 m) and a `turret` component;
it would make the Tern a candidate for enemy PD-priority and give the AI a reason to loiter; (2) a 34 m hull with
one S turret does not defend against fighters, only against a missile, and flares do that for free; (3) the
doctrine is avoidance, the weapon would encourage staying; (4) rule "every weapon needs a physical thing" costs
voxel and design time for no balance gain. `mounts: []`, `turrets: []`. If hand-play shows the Tern dying to the
first missile on every delivery, one S-turret PD (rear dorsal, `[0, 2.4, 11]`) is the first lever, not armour.

## (g) Power

`power = {plantMW: 60, capacitorMJ: 120}` (step 1 of `docs/POWER.md`; `energyRegen` = 20 MW, bus 20 MW).

- 60 MW is 1.2 x the fighter default (51) because the hull is 2.7 x longer with three engines, and 0.2 x the
  Tender's (900) because it has no weapons. Per metre 1.8 MW/m against Kestrel 4.1, Halberd 2.3, Tender 4.5; low
  on purpose since nothing is drawn yet.
- 120 MJ (default 100 + 20 %).
- Weapon peak 0; `tools/power_table.py` prints `sustain -`, no empty-time. In step 3 (engines, shields on the bus)
  60 MW is probably too low for a loaded 34 m hull at 80 m/s; re-tune then, with the measured numbers.
- Reactor hp 60, listed in (e).

## (h) Balance reasoning and test

**Throughput.** One Tern delivers 3600 rds per 138 sim-s, 26 rds/s average (1.5 km leg). Demand is an assumption
that must be measured: a Halberd at 25 % PD duty (4 x 13.3 rds/s) plus 10 % rotary (25 rds/s) is about 16 rds/s;
Exeter at 25 % PD duty (3 x 13.3) plus MD-55 about 12 rds/s. A task force of one frigate and two corvettes then needs
about 44 rds/s, 1.7 Terns. **Recommendation: Tender `dock.shuttles` 4: two working, two reserve/replacement.** The
numbers move linearly with the duty assumption; measure it before trusting 4.

**Acceptable loss.** Target at most one Tern lost per 6 deliveries (about 17 %) in a standard mission with hostiles
about. Above about 30 % the AI gate does not work (or the FROGG AI hunts shuttles after the `pickTarget` fix); below
about 3 % there is no risk to weigh and the system is free supply. Unit economics (`docs/ECONOMY.md` table):
hull about 6 S (linear in length from Kestrel 4 at 12.4 m would give 11; discounted, unarmed), full manifest
about 0.3 S of ammunition, up to 1.6 + 0.8 + 2 for missiles, 3 for drones. **Loss of a fully loaded Tern is about
12 S, three Kestrels**; hence the manifest should be mission-specific (ammo-only by default), not the capacity.

**Interaction with the Tender.** `tenderTick` already trickles 20 rds/s to any friendly within 600 m
(`docs/SHIP_CLASSES.md` section 4 calls that trickle "the slow shuttle service"). The Tern is that fiction made
literal and extended: 90 rds/s (4.5 x) and no 600 m ceiling, but with finite cargo and a risk. Two consequences
the owner should decide (question 1): the free trickle devalues the Tern whenever corvettes stay near the Tender,
and a mission design where corvettes escort at 1-2 km is needed for the Tern to be used at all.

**Test (not run).** `tools/tests/shuttle_t.py`, same style as `dock_t.py` and `magazine_t.py`, seeded (`?seed=`),
20 runs per cell, Wilson CIs:
1. Rearm correctness: a Halberd with half-empty pools and drums, a Tern, no enemies: it gets rearmed, no structure,
   shield or component changes, cargo debits equal receiver credits, drones obey `droneLimitOf`.
2. Gate: hostiles inside 1800 m of the Halberd: no delivery attempt, Tern held at the Tender.
3. Duel cell: Halberd plus Tender 1.5 km away vs N Darters/Leapers, with and without 2 Terns: time to dry (rotary,
   PD drums), kills, Halberd structure at end, Terns lost per run.
4. Measure the duty rates used in this section (rds/s per ship) before touching `dock.shuttles`.

## (i) Voxel design brief

Ship space: -Z nose, +Y up, mirrored about X. Palette: the Tender's `E` set (`src/30_ships_human.js`: grey 0x9aa2ab,
grey2 0x7d858f, white 0xd8dce0, panel 0x4a525c, amber 0xc79a3a, orange 0xd9772b, nozzle 0x2a2d33, glow 0x7fd0ff). It
belongs to the Tender's family, not the Kestrel's warm grey, which is what makes it read as logistics.

- **Silhouette:** narrow spindle (x +-2.4, y +-2.0, z -12 to 14), a bridge dome at the nose (z -17 to -12, +Y 3 m),
  two long cargo pods outboard (x 4.4-8.0, z -10 to +8, y -1.6 to +2.2) tied to the spindle by two pairs of pylons
  (z -6 and +4). Three-engine block aft (z 9 to 17).
- **Cargo pods:** container-block segmentation along z (6 bays per pod), alternating grey2 and orange blocks with
  amber dot rows, as the Tender's container rows (z % 40 pattern). They are the cargo, visible per the model rules.
- **Dorsal drone rack:** two rows of three 6 m SD-4 hulls (x +-2.6, y 2.6, z -6, 0, +6), clamped under open arch
  frames in `dark`. Static in the model; delivered drones are not removed from the picture (known cosmetic
  limitation).
- **Transfer booms:** stowed telescopic arms along the outer pod faces (x +-8.3, z -6.5 to -1), amber band at the tip.
  `comps` boomL/boomR sit at the tips. A hose reel drum at each pod's forward end (ell, panel colour).
- **Service lights:** a red nav light on the starboard pod tip (`noMirror`), a white one to port, as on the Tender.
- **Engines:** three nozzles at z 16.5-16.8 (positions in the data file), glow colour `0x7fd0ff`, nozzle ring
  `E.noz`.
- **What makes it read as a hauler at 150 m:** at that distance one voxel is about 0.4 m; the two long, boxy, orange
  striped pods dominate, the central body is a thin spine, no guns, no canopy greenhouse. A pale-grey Kestrel is
  a delta with a canopy; this is a rectangle with an H plan and a coloured stripe. The orange/amber stripes must be
  at least 1.5 m wide to survive at that distance.
- **Subsystem markers** (model rule): engines, bridge, shield projector, pods, booms, reactor hatch (dorsal, z 8.5,
  small dark panel) all come from the data file's `comps` and `engines`.
- **Cost check:** estimate against the 35k Halberd benchmark once built; `resMul` 0.8 is a guess.

## (j) Open questions for the owner, and risks

1. **Does the free hover trickle stay?** If yes, the Tern is only worth building for corvettes parked beyond 600 m
   and the mission design must create that; if no, the trickle becomes the Tern's job and the Tender needs shuttles
   to work at all. This is the biggest value question.
2. **Turret-drum rearm:** is it intended that PD drums are refilled by a tender (WEAPONS.md says yes, the code says
   no)? Without it, the Tern's main customers have nothing to rearm.
3. **Resolved (2026-10-24):** cargo ammunition is one fungible `ammo` pool.
4. **Resolved (2026-10-24):** use `cls: 'fighter'` plus `shuttle: true`; no new class.
5. **Resolved (2026-10-24):** v1 follows a scripted route and has no live shuttle AI.

Risks: (1) the demand rates and the `pickTarget` blind spot make the loss-rate figures unreliable until measured;
(2) shared transfer code (`tenderTick` refactor) can regress `dock_t.py` and `magazine_t.py`: run both; (3) standoff
station-keeping against a manoeuvring Halberd may be fiddly and `Tern` may spend more time aborting than delivering;
(4) `bay` component effects are new code with no precedent; (5) instance counts vary by selected detail and have
not been measured on a device; (6) all speeds, rates and hp are first guesses with no hand-play.

Engine integration status: `shuttle`, `cargo`, and `xfer` are stored in the database but not consumed by the engine.
The `bay` component role currently supplies only damage modifiers; cargo loss on pod damage and transfer-rate
effects from boom damage are not implemented. No mission route or resupply behavior is added by the hull-only
implementation.

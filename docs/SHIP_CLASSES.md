# Ship classes: definitions, assignments and the fleet inventory

Status: owner statement 2026-10-22. This is the fleet foundation: what each class is, which existing ship
fills it, and what is still missing. Class = doctrine and crew, not the engine's `cls` field (the code keeps
fighter / corvette / frigate / capital for damage and AI purposes; the mapping is listed per ship).
`docs/WEAPONS.md` covers the guns; this covers the hulls.

## 1. The classes

**Light fighter** - one pilot, minimum frame. Speed and numbers over staying power: a point-defence/interception
screen, cheap enough to lose. Gun-light; missiles few; no drones. Dies to anything heavier than a stern look,
but forces the enemy to spend attention. Crew: 1.

**Heavy fighter / multirole** - the workhorse. Two seats where doctrine allows (pilot + weapons specialist; the
specialist can run slaved drones per `docs/LORE.md`). Enough magazine to matter, a heavy-hitter gun (class 2
mag/rail), missiles, and the agility to choose its fights. The Kestrel is the human example; multirole = it
fights fighters, strikes corvettes and torpedoes big hulls. Crew: 1-2.

**Bomber** - a bomb/torpedo truck. Slow, well-shielded for its size, near-helpless alone and decisive with an
escort: it exists to put heavy ordnance (HM-1, NK-1 class) into capitals. Everything about it is a trade of
agility for payload and crew. Crew: 2-3.

**Corvette** - the smallest capital-adjacent hull. Escorts: it kills fighters and missiles so the big ships
don't have to, and carries the first real turrets (PD, light beam/laser mounts, a rotary or rod main). Cannot
jump on its own doctrine (docks or stays local). Crew: 10-40. Human example: Halberd; FROGG: Gulper.

**Frigate** - the line ship. Jump-capable, turreted all round, carries drones/fighters as cargo and screens.
The independent operator: patrol, escort, presence. Magazine depth is the tactical constraint (tender-dependent
sorties). Crew: 100-300. Human examples: Exeter (combat), Tender (logistics variant).

**Cruiser** - a frigate that stopped compromising: the guns of a small capital with some of the agility of a
frigate. Fleet escort leader / surface (strike) action. **None exists yet in either fleet** - planned. Crew:
500-1,500.

**Carrier** - a flight deck with engines. Its weapons are its air group; the hull exists to launch, recover,
rearm and repair (lore: FROGG hangars rearm but do not repair - `AGENTS.md`). Vulnerable alone, decisive with a
screen. Crew: 1,500-6,000. FROGG example: Bullfrog (also carries an XL lance - a strike carrier); the Hive
Carrier is the unarmed catalogue hull.

**Dreadnought** - the strategic unit. Too big to dock with anything smaller than a fleet tender, too slow to
choose fights, exists so the other side must answer it. **Lore-only for now** (`docs/LORE.md`: the FROGG
dreadnought's full jaw and the carrier's leaf-shaped flank plates are in the aesthetic; no stats, no code).
Crew: 10,000+.

**Logistics (tactical)** - in-battle resupply. Small enough to sit behind the line; the reason magazines are a
tactic and not a sentence. Rearms fighters/corvettes that dock with it (TIE-fighter style: approach, request
docking, sit still while cassettes and missile racks go in). Crew: 60-150. Human example: the Tender.

**Fleet tender (strategic)** - huge, slow, the fleet's mobile base. Sends out **resupply shuttles** to feed
ships that cannot dock with it, and itself docks with the major ships - cruisers, carriers, dreadnoughts -
**between missions or for the duration of a scripted mission segment only** (`docs/FLEET_LOGIC.md` scale).
No tactical docking of major ships in-game: those dockings are scripted set-pieces, never live inputs.
**Lore/planning only** - no stats yet. Crew: 5,000+.

## 2. Assignment of existing ships

| Ship | Faction | Class (doctrine) | Engine `cls` | Crew | Notes |
|---|---|---|---|---|---|
| Drone (SD-4) | human | light fighter, unmanned | fighter | 0 | slaved by a heavy fighter's specialist; human-only (FROGG anti-AI) |
| Kestrel | human | **heavy fighter / multirole** (owner 2026-10-22) | fighter | 1 | the workhorse: cannon + MD-9 mag + HE + missiles |
| Halberd | human | corvette (escort) | corvette | ~25 | rails + GA-9 rotary + PD screen |
| Exeter | human | frigate (combat) | frigate | ~200 | jump-capable, MK-90 XL, 48 drones |
| Tender | human | frigate (logistics, tactical) | frigate | ~90 | in-battle rearm; fighters dock at its service booms |
| Darter | FROGG | light fighter (interceptor) | fighter | 1 (neuro-slaved) | gun + 2 SK-1; the most ammo-fragile hull |
| Leaper | FROGG | heavy fighter (multirole) | fighter | 1 | M-1 + M-2 mix |
| Spitter | FROGG | heavy fighter (gunship) | fighter | 1 | M-6 heavy maser main |
| Reaver | FROGG | heavy fighter (heavy) | fighter | 1 | the biggest FROGG fighter: all three maser marks |
| Toad | FROGG | bomber (torpedo) | fighter | 1 | 3x ST-2 racks |
| Gulper | FROGG | corvette (escort) | corvette | ~30 | R-12 rods + M-7 lances + 4 PD + 6 ST-2 |
| Bullfrog | FROGG | carrier (strike, with XL lance) | capital | ~4,000 | 36-fighter hangar, GX-1, 16 ST-2 |
| Hive Carrier | FROGG | carrier (catalogue hull, unarmed) | capital | - | 2.5 km, not flown |

Crew numbers are lore placeholders consistent with `docs/LORE.md` (heavy fighters crew 1-2 with the specialist
running drones; FROGG pilots are neuro-slaved, so FROGG "crew" is one brain-stem per station).

## 3. Gaps in the inventory (what we still need)

**Human fleet (owner 2026-10-22):**
- **A second heavy fighter, two pilots** - proposed *Harrier* (bird-name lineage, RN jet heritage): Kestrel-class
  airframe with the weapons-specialist seat crewed, so it runs 2 slaved SD-4 drones per `docs/LORE.md`; fit
  sketch: cannon + MD-9 + HE + 4 SW-9 + drones, heavier shield, slightly slower.
- **A bomber** - proposed *Bittern*: slow torpedo truck, 2-3 crew, 1 pilot + specialist; fit sketch: 2x HE cannon
  (tail defence), HM-1 x3-4 racks, NK-1 capable, Kestrel-mag or nothing fixed; needs escort doctrine to work.
- **A light fighter, one pilot** - proposed *Merlin*: the cheap screen; fit sketch: 2x MK-20, 2x SW-9, no mag, no
  HE; faster and flimsier than the Kestrel.
- **A cruiser** (later) and the **strategic fleet tender** (huge; shuttles + scripted major-ship docking - see
  class definition; design pass needed before any stats).

**FROGG fleet:** numbers doctrine covers the fighter line (light/heavy/bomber all exist); the gaps are the same
as the humans' at the top - cruiser, dreadnought (lore aesthetic already anticipates both), and their
logistics answer. Current FROGG logistics is the Bullfrog's hangar; whether FROGG get a tender hull at all is an
open doctrine question (energy-heavy weapons make their resupply problem smaller - masers never run dry, only
torpedoes and rods do).

## 4. The docking mechanic (tactical rearm; owner statement 2026-10-22)

In-battle rearm works like the classic space sims: **approach a friendly Tender, press `D` within 500 m; the
ship auto-docks to a service boom, holds position while ammo cassettes and missile racks go in, and undocks on
`D` again or automatically when magazines and stores are full.** While docked the pilot's controls are
suspended (the ship is in the tender's grip); the tender's service rate is twice the remote-proximity trickle
that AI wingmen receive just for hovering nearby (they cannot press buttons - they get the slow shuttle service).
Docking with major ships does not exist in tactical play - the fleet tender's dockings are scripted
(between-missions or mission segments), per the class definition above.

Implementation: `dockTry`/`dockTick` (55_ships.js), key `D` (80_input.js), HUD prompt and REARMING line
(90_hud.js). Test: `tools/tests/dock_t.py`.

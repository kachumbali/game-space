# Vehicle design and loadouts — working discussion

Status: discussion baseline, 2026-11-11. The owner wants a coherent visual and functional design for the vehicles and their weapons. Start with the four human fighters; extend the same review to human support and capital ships, then FROGG ships and weapons. This document records existing data and questions, not approved redesigns or balance changes. The baseline is `main` at `d0f256e`. Where older prose disagrees, check `data/db.json` and runtime code before treating either description as current.

## What we are reviewing

For each hull, agree on its job, crew, size, recognizable silhouette and visible weapon/ordnance arrangements. Check that every weapon has a credible mounting and a clear line of fire, that engines and other major pieces are structurally connected, and that the visible magazines, racks or bays plausibly relate to what the craft carries. Compare visual details at combat distance and up close, including the shipyard's subsystem markers. Balance and performance implications need separate evidence before any numbers change.

## Human fighters: current database baseline

Lengths and stores below come from `data/db.json`; the naming in the role column is a plain-language summary. The speed is the configured maximum, not a measured combat result. `mounts` tagged as stores are launch positions, not additional guns.

| Hull | Intended role | Length | Configured max speed | Fixed guns | Defensive turrets | Default carried ordnance |
|---|---|---:|---:|---|---|---|
| Merlin | Light fighter | 9 m | 262.5 m/s | 2 × MK-20 cannon | None | 2 × SW-9 IR; 12 countermeasures |
| Kestrel | Multirole fighter | 12.4 m | 150 m/s | 1 × MK-20 cannon, 1 × MD-9 mag driver, 2 × MK-30 HE cannon | None | 4 × SW-9 IR, 2 × LN-3 radar missiles, 1 × HM-1 torpedo; 24 countermeasures |
| Falchion | Two-seat heavy fighter | 19.5 m | 118 m/s | 2 × MK-20 cannon, 2 × MD-9 mag driver | 3 × PD-15 | 6 × SW-9 IR, 2 × LN-3 radar missiles, 2 × HM-1 torpedoes, 2 × drones; 32 countermeasures |
| Bittern | Torpedo bomber | 22 m | 90 m/s | 2 × MK-30 HE cannon | 2 × PD-15 | 2 × SW-9 IR, 12 × HM-1 torpedoes; 32 countermeasures |

These are authored fits, not a claim that the visible models convincingly accommodate every store. The shipyard and `tools/tests/muzzle_t.py` can help check actual mount and muzzle placement. `docs/ORDNANCE_MANIFEST.md` identifies Kestrel and Falchion torpedo stations as legacy fits and calls for a model/launch alignment review of some stations. The Merlin's two missiles are a single station with capacity 2, not two separately selectable stations.

## First discussion: roles and silhouettes

The present models share grey plated surfaces, exposed engine features and long gun forms. Their three-quarter views give the Merlin a slender fuselage, the Kestrel a twin-pod shape, the Falchion a broader multi-boom shape, and the Bittern a prominent tall slab behind a cylindrical forward hull. These are observations from a single rendered view, not a full geometry or line-of-fire audit. Compare top, side, front and three-quarter views at the same time before choosing changes; the side-by-side images are not to a common physical scale.

Questions for the owner:

1. **Role ladder:** Should the Merlin be a fast, lightly armed interceptor; the Kestrel the standard multirole fighter; the Falchion a heavier two-person fighter; and the Bittern the dedicated torpedo bomber? If not, what should each be best at?
2. **Torpedoes:** The ordnance guide reserves L-class torpedoes for bombers and dedicated heavy strike craft, yet the Kestrel and Falchion retain legacy torpedo stations. Should either fighter keep that capability? If yes, should it be a conspicuous special-purpose fit?
3. **Family resemblance:** Should human fighters share a recognizable cockpit, engine, gun and marking language, with each role getting a distinct silhouette? Which existing hull best captures the direction you want?
4. **Payload visibility:** Should torpedoes and missiles be visibly carried on external racks, housed in internal bays, or vary by hull? The Bittern carries twelve torpedoes in data; the current model should be checked against its cassette/bay concept before deciding whether that payload reads convincingly.
5. **Kestrel's asymmetric armament:** Its MK-20 and MD-9 are different weapons on opposite sides, with two HE cannons also fitted. Is that mixed, asymmetric gun arrangement part of its identity, or should equivalent weapons use matching visible mounts?

## Consistency checks to investigate

- **Role wording:** `data/db.json` labels Kestrel `HEAVY FIGHTER`; `docs/SHIP_MANUAL.md` calls it multirole and describes the larger Falchion as the two-seat heavy fighter. Decide the intended role before editing either source.
- **Torpedo policy:** The Kestrel and Falchion legacy fits conflict with the general L-class eligibility rule in `docs/ORDNANCE_MANIFEST.md`. This is an explicit pending design decision, not evidence that either fit is a bug.
- **Visible stations:** The ordnance manifest calls for reviewing Kestrel's legacy torpedo station and Merlin/Falchion coordinates against actual models. Inspect before deciding whether to move a model, a station, or neither.
- **Shield and piercing wording:** `docs/WEAPONS.md` describes piercing as bypassing shields. The current weapon-hit path in `src/65_combat.js` blocks the piercing share when an active shield facet is hit; tandem torpedoes open the facet. Reconcile the explanation with the implemented and owner-selected behavior.
- **Performance and scale:** Dense voxel models and capital turrets have real rendering costs. A more plausible silhouette or payload should not be assumed free; measure any eventual model changes, particularly on the desktop Mac and iPad.

## Decisions log

2026-11-11: owner chose off-white and grey with restrained orange for the shared human-fleet palette. This is a visual direction; it does not change weapon values or gameplay. Record further owner decisions, alternatives, and affected hulls and weapons here. Preserve existing weapon values and ship behavior until an implementation is requested and the implications are reviewed.

## Proposed common human-fleet appearance — 2026-11-11

**Status: draft for discussion.** The owner supplied six reference images showing compact industrial craft, a boxy escort and larger naval-style ships. Use the references to discuss construction, scale and finish; create original silhouettes and details. The owner selected **off-white and grey with restrained orange** as the base palette. No other decision in this section is final, and the concept illustrations are not 3D model specifications or approved loadouts.

A preliminary four-panel concept board (interceptor, multirole fighter, bomber, escort) was generated with OpenAI image generation from five of the owner-supplied references on 2026-11-11. It is a discussion sketch, not a technical blueprint: its apparent turret count, armament, proportions and panel detail do not establish in-game specs. The local preview is `docs/img/concepts/human_fleet_concept.png`; images in `docs/img/` are git-ignored, so that preview is not included in the branch.

### Shared construction language

- **A strong central hull:** a recognizable spine or pressure hull with blocky, bevelled armour sections and a clear front and rear. The hull should look assembled and maintainable, with access points and seams that follow real modules.
- **Visible structure:** drive pods, wings, weapon housings and other major masses attach through substantial spars, shoulders or pylons. Avoid floating pods and ornamental detail that competes with the ship's role.
- **Drives as a family:** exposed or partly armoured engine modules with dark, recessed nozzle interiors and a consistent mounting language. Their size, number and location remain specific to each ship and its gameplay components.
- **Practical surface treatment:** off-white and light-to-medium grey armour; graphite mechanisms, gun housings and heat-stained exhaust areas; restrained orange for identification or maintenance panels. Larger orange patches can distinguish specialist or civilian craft if the owner wants them, but orange does not have to denote a particular gameplay function.
- **Weapons with physical homes:** fixed guns have visible barrels or emitters; turrets have a seat, a traverse envelope and a plausible field of fire; missiles and torpedoes have visible rails, bay doors or cassette mouths. Shape and quantity must be reconciled with the real `mounts`, `turrets`, `hardpoints` and `stores` before the model is treated as correct. Do not imply that a concept-board detail already exists in data.
- **Texture serves the shape:** use a few major panels, contrasting joints, vents and service lines first. Fine scratches, labels and tiny greebles can enhance close views but must not be necessary to identify the ship in combat.

### A family, with distinct roles

| Hull/class | Proposed silhouette and scale cues | Existing-data constraint to investigate before building |
|---|---|---|
| Merlin, light interceptor | Narrow, compact pressure hull and tightly integrated twin engines; a simple profile reads quickly. Keep the cockpit and two forward guns apparent. | Two MK-20 guns and one S-class station carrying two IR missiles. Check visible station and clear muzzle placement. |
| Kestrel, multirole fighter | Wider centre body and clearly attached paired drive pods, with a recognizable single-seat cockpit and room for several visibly different weapon mounts. | Its mixed MK-20/MD-9/HE guns and legacy torpedo are current data. Their layout and the torpedo's future remain open decisions. |
| Falchion, two-seat heavy fighter | Longer, broader and visibly heavier than the Kestrel, with a readable two-person crew volume, larger engine structure and rooted defensive turrets. It should not simply be a scaled-up Kestrel. | Four fixed guns, three PD mounts, two drones and the current missile/torpedo fit all need credible placements and firing arcs. |
| Bittern, torpedo bomber | A broad load-bearing body with the payload cassette or bay as a primary mass; a protected cockpit and substantial engines make its strike role obvious. | Twelve torpedoes are in the default fit. Establish their storage and launch arrangement at the current 22 m nominal length before claiming it fits; review the two PD positions and approach/release arcs. |
| Halberd, escort corvette | A compact boxy warship with an elongated central structure, recessed/armoured bridge, connected engine raft and readable turret seats. Small hatches, windows and turrets establish a larger scale than the fighters. | Respect the existing nominal dimensions, collision extents, weapons, hangar and subsystem positions; inspect live and in the yard before deciding what needs to move. |
| Frigate and larger ships | Extend the same modular engineering into longer major sections, hangar/service zones and multiple weapon stations. Use smaller windows and doors to show scale, with a distinct silhouette for each role. | Use actual class dimensions, capabilities and the project's size exceptions; reference-image naval towers, numbers and markings are inspiration, not required shapes or lore. |

### Owner direction: corvette template and Falchion (2026-11-11)

The owner selected the **bottom-right corvette in the first four-ship concept board** as the visual template for the human fleet. Carry its modular, blocky construction, off-white/grey armour, restrained orange accents and dark mechanical joints across the family; develop different silhouettes and scale cues for fighters, bombers, escorts and larger ships. This selects the shared visual direction, not the illustrated corvette's exact proportions, hull details, turret counts or loadout as game data.

The **Falchion is a heavy two-seat fighter with a turret on top**. The concept should make both crew positions and a dorsal turret easy to read, while keeping the craft recognizably fighter-sized and structurally related to the corvette template. The current database already has three PD-15 turrets: two dorsal and one ventral. The owner's request confirms that a dorsal turret must be visible; it does not decide whether the existing other turrets should be removed or how their firing arcs should work. The current fixed guns and stores are recorded above and remain the engineering baseline; torpedo eligibility remains open.

Before building this hull, review a Falchion concept in top, side and three-quarter views, with the crew positions, drive attachment, both gun pairs, all existing turret stations and ordnance stations annotated against the data. Check the turret's seat, clearance and arcs, plus cockpit access and scale. Decide separately whether any existing weapon or station should move or change; do not infer that from the concept art.

### Before implementation

1. Agree on this common language and select a first hull for a bounded pilot pass. Keep the existing ship sizes, roles, weapon values and gameplay as the baseline until the owner decides otherwise.
2. For that hull, prepare top, side and three-quarter sketches or renders with the proposed modules, cockpit, engines, major subsystems, weapons and ordnance drawn explicitly. Show current versus proposed, and identify which shapes are decorative versus functional. Confirm the loadout and torpedo decision before treating the drawing as final.
3. Review the proposed model against `data/db.json`, `docs/ORDNANCE_MANIFEST.md`, shipyard markers, collision extents and muzzle/launch clearances. Any required changes to weapon positions, launch points, stores, hit zones or bounds must be listed explicitly and checked for gameplay effects; do not silently change them to match the illustration.
4. Only then implement the approved pilot hull on this branch. Inspect top, side, front and three-quarter views in the yard and in play, check subsystem/weapon markers and structural connections, run relevant tests and the full gate, and measure voxel build/render costs. An iPad-sized browser view is not a physical iPad playtest.
5. Use what the pilot teaches us to refine the family rules before extending them to the other human fighters, corvette and larger ships. FROGG keeps its own established visual language and receives a separate consistency review.

**Next decisions:** whether this is the right amount of industrial detail, which reference has the closest overall proportions for the first hull, and which hull to use as the pilot. The torpedo policy remains undecided.

### Falchion voxel pass — first implementation

The first geometry pass applies the approved light grey/off-white and restrained orange finish to the Falchion, adds blockier cockpit shoulders and engine cross-spars, and preserves its separate tandem canopy and three existing PD seats. The visible M1 and legacy L1 ordnance fittings now align with their authored station coordinates; their torpedo policy remains undecided. The four fixed barrels were shortened slightly so their unchanged muzzle points sit beyond the visible barrel ends. The database, loadout counts, engine positions and turret definitions were not edited. As with any voxel-geometry change, the solid collision shape can change even when gameplay numbers do not.

At the current high-detail marker audit, all four fixed muzzle points were outside the hull and had an unobstructed eight-metre forward probe; the prior model reported each inside. The three existing turret seats and their visible tips were inspected in the live renderer. These are geometry checks, not an in-flight weapons-effectiveness or physical-iPad test.

## Owner decisions and lead rebuild — 2026-11-12

- **Roles confirmed:** Merlin = fast light interceptor, Kestrel = standard multirole fighter, Falchion = two-seat heavy fighter with a dorsal turret, Bittern = dedicated torpedo bomber.
- **Torpedo policy:** the Kestrel carries no torpedo (store and legacy L1 station removed from `data/db.json`); the Falchion keeps its legacy torpedo fit for now; the Bittern stays the torpedo carrier (12).
- **All four fighters rebuilt by the lead** in `src/30_ships_human.js` (shared palette `CF`, round drive pod helper `cfPod`, missile-on-rail helper `cfMissile`): modular blocky hulls in off-white and grey, graphite mechanisms, restrained orange bands; one round drive pod per side around the database nozzle positions, carried on a box spar; every gun on a housing with barrel and muzzle brake at its mount; missiles visible on rails at their stations; the Bittern's torpedo cassettes are a graphite magazine frame with three rounds visible on each outer face; PD seats are hull housings. No data positions changed (mounts, engines, comps, stations, eye, bounds). Checked: top, side, front and three-quarter renders (`tools/render_ships.py`), all 34 shield bubbles still enclose their hulls, muzzle report unchanged, gate and the model-related tests. Not checked: how they read in flight at combat distance and on an iPad.
- **Known limit:** at combat detail a fighter is a few dozen voxels long; panel lines, hatches and small decals in the concept art cannot be reproduced. What carries over is silhouette, proportions, colour blocks, engine rings, visible barrels, racks and turret seats.


# Ship visual improvement path

Status: design path, 2026-11-01. This is an original, functional military-spacecraft direction informed by the readability and role clarity of classic space combat games and grounded science-fiction television. It does not copy any protected ship design.

## Acceptance gate

Every revised hull must read by silhouette at combat distance, then pass top, side, and 3/4 inspection with diagnostic overlays off. Engines, weapons, sensors, radiators, bays, and turret housings must have a visible structural path into the hull and stay inside declared collision extents. Add role-defining volumes before surface noise.

## Faction language

| Faction | Design language |
|---|---|
| Human | Engineered modularity: straight spars, armour plates, access panels, docking collars, separated heat/propellant/ordnance paths, and restrained identifiers. |
| FROGG | Grown load paths: lamellar carapaces, ribbed mouths, cyan energy seams, and organic apertures. A spike or blade must be a brace, sensor, thermal fin, or weapon support—not decoration. |

## Priority sequence

1. **Payload silhouettes:** Bittern, Toad, Gulper. The player must understand bomber/corvette ordnance capacity before reading small detail.
2. **Fighter roles:** Merlin/Darter; Kestrel/Leaper; Spitter/Reaver. Each pair needs a distinct planform, engine arrangement, and weapon aperture language.
3. **Capital and logistics readability:** Exeter, Tender, Bullfrog, Hive Carrier, Hecla. Expose command, hangar, service, and drive zones as separate readable masses.

## Hull actions

| Hull | Improvement path |
|---|---|
| Kestrel | Retain asymmetric gun/magazine booms; give pods a clear intake-to-nozzle service line and simplify competing dorsal clutter. |
| Merlin | Use a clean needle/delta silhouette with near-flush twin engines; reserve exposed side pods for Kestrel. |
| Bittern | Armoured naval bomber: plated cockpit cage, recessed 3-by-4 torpedo cassette bays, booms on structural spars, dorsal/ventral defensive stations, and service/radiator panels. |
| Tern | Make pressure-rated cargo modules, central truss, and service collar unmistakable; avoid warship-like bridge armour. |
| Halberd | Structural benchmark: low bridge, braced radiators, rooted turret seats, and an enclosed three-engine raft. |
| Exeter | Tie the dorsal command slab into a stepped central spine; use clear barbettes and a repeated hangar door/lift rhythm. |
| Tender | Make container rails, service booms, docking collars, and a protected drive raft the entire silhouette; do not add warship guns. |
| Hecla | Divide into service citadel, trussed drydock/berth spine, and broad engine/heat-rejection raft with repeated scale cues. |
| Drone | Keep the robust utility dart; add only a clear sensor puck and slaved docking hardpoint. |
| Darter | Narrow knife/dart outline, single offset sensor/weapon jaw, minimal blades. |
| Leaper | Root lateral vanes in shoulder carapaces; weapon pods need socket/gill feeds. |
| Spitter | Keep the dorsal acid cannon, add an acid-sac manifold and recoil/thermal cradle rather than extra spikes. |
| Toad | Swollen armoured brood-bomber: paired belly racks within one cradle, distinct launch mouths, rear support struts, and a heavier engine raft. |
| Reaver | Double armour mantle and twin engine raft establish the heavy fighter; reduce arbitrary blades and separate its weapon apertures by function. |
| Gulper | Four separated armoured torpedo cassette spines link to a central magazine trunk; retain high prow maser lances and raised PD nests. |
| Hive Carrier | Prioritise two or three enormous hangar maws, launch lanes, recovery lights, and guiding ribs; clear decoration from deck approaches. |
| Bullfrog | Make the charged lance a structural spinal trench; visually separate its magazine, hangars, and S/M/L turret barbettes. |

## Delivery order

Each hull pass changes its model and matching database mount/component positions together, then is inspected in `?yard=<id>` and in live combat. A completed pass includes the marker sheet and a short entry in `docs/CODEX_INTEGRATION_LOG.md`.

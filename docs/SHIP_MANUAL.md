# Ship manual (milestone 2026-10-21)

Handbook-style overview of every ship class, existing and planned. Blueprint plates are **generated from the current
voxel model data** (orthographic-style renders, silhouette + shading edges, measured overall dimensions); they document
the models, they are not independent design drawings. Re-generate after model changes (script kept in the working
scratchpad, not yet in the repo).

## 1. Scale ladder (owner decision 2026-10-21)
**Current scope: ships under 500 m.** The frigate (up to ~500 m) is the largest class for now, can jump, and can dock (not
repair) 2 corvettes and 12 fighters / large fighter drones. Everything above 500 m in the table is deferred.
| Class | Length | Status |
|---|---|---|
| Fighter / interceptor | 10-20 m | built (Kestrel, Darter, Leaper) |
| Gunship / bomber / heavy fighter | 16-20 m | built (Spitter, Toad, Reaver) |
| Corvette | 100-150 m | built (Halberd 128 m, Gulper 146 m) |
| Frigate (jump-capable, in scope) | 300-500 m | human Exeter class built (450 m); FROGG frigate planned |
| Human carrier / dreadnought | ~1.5 km | deferred (beyond current 500 m cap) |
| Hive carrier | 2-3 km | deferred; catalogue model exists at 2.5 km |
| Super capital (human) | ~5 km | deferred |
| Hive mothership | ~10 km | deferred |
Only the frigate class and up have jump drives (docs/FLEET_LOGIC.md section 8). Implications of the km scale are in
`docs/CAPITAL_COMBAT.md` (ranges, speeds, sim, voxel budget).

## 2. Ship list
### Built
| Ship | Side | Class | Role | Length | Max speed |
|---|---|---|---|---|---|
| Kestrel | human | fighter | multirole fighter | 12 m | 150 m/s |
| Halberd | human | corvette | escort / mothership | 128 m | 28 m/s |
| Darter | FROGG | fighter | interceptor | 9.5 m | 165 m/s |
| Leaper | FROGG | fighter | line fighter | 13.6 m | 120 m/s |
| Spitter | FROGG | fighter (gunship role) | acid gunship | 16 m | 90 m/s |
| Toad | FROGG | fighter (bomber role) | torpedo bomber | 19 m | 78 m/s |
| Reaver | FROGG | fighter (heavy role) | heavy fighter | 19 m | 95 m/s |
| Gulper | FROGG | corvette | escort corvette | 146 m | 34 m/s |
| Exeter class | human | frigate | jump frigate, docks 2 corvettes + 12 fighters/drones (no repair) | 450 m | 30 m/s |
| Hive Carrier | FROGG | capital | super carrier (deferred, over 500 m cap) | 2,500 m | 12 m/s (placeholder) |
Note: the Spitter/Toad/Reaver have `cls: 'fighter'` in data; a separate role field is needed once class masks exist.
### Planned (no models yet)
Human drone wingman (large fighter drone), FROGG frigate, human carrier (~1.5 km, deferred), human dreadnought (~1.5 km, deferred), human super capital (~5 km, deferred),
tender / SAR ship, freighter/tanker, station/drydock; FROGG frigate, FROGG mothership (~10 km), brood-spawn drones.
Human factions with distinct ships: deferred until the back story exists (docs/LORE.md).

## 3. Voxel overview and scale
**Subsystem positions (rule, owner 2026-10-21): every model view and blueprint shows its subsystems.** Marker key:
engine = orange ring, main gun = green square, PD turret = yellow triangle, shield generator = cyan diamond,
sensors/bridge = magenta ring, reactor = red cross, radiator = white panel, fighter bay / corvette cradle = purple box,
weapon muzzle = green plus; faint rings show hit-zone radius (blueprint elevations only).
![voxel models with subsystem positions](img/ship_classes_subsystems.png)
![voxel models](img/ship_classes_grid.png)
![true scale, fighters and corvettes](img/ship_classes_scale.png)
Earlier FROGG look (insect/frog) for comparison: `img/ship_classes_grid_before_frogg_v2.png`.

## 4. FROGG design language (v2, after owner feedback)
Reference images (owner-supplied concept art, style orientation only, not copied): dark lamellar plating with rust
streaks, swept trailing blades, ribbed red-orange engine vents, layered carapace shells, keel spikes.
Feedback applied: the first pass looked insectoid because of large pearl "eye" discs and curved mandibles; both were
removed. Current elements: stacked armour plates, flush sensor clusters, short prow blades, dorsal spikes, ventral keel,
nacelles with orange vents, small pale lights on pods. Weapons stay venom-green so enemy fire remains readable.
Open points: hull still reads warm-brown under the current sun; hangar maws, radiator-like structures and hardpoints
need work on the capital models.

## 5. Blueprint plates (with subsystem markers)
Each plate: side elevation, front elevation, plan, 3/4 view, overall measured dimensions, stats.
![Kestrel](img/blueprints/bp_kestrel.png)
![Halberd](img/blueprints/bp_halberd.png)
![Darter](img/blueprints/bp_darter.png)
![Leaper](img/blueprints/bp_leaper.png)
![Spitter](img/blueprints/bp_spitter.png)
![Toad](img/blueprints/bp_toad.png)
![Reaver](img/blueprints/bp_reaver.png)
![Exeter](img/blueprints/bp_exeter.png)
![Gulper](img/blueprints/bp_gulper.png)
![Hive Carrier](img/blueprints/bp_hivecarrier.png)

## 6. Known limits
- "Overall" dimensions include blades/spikes, so they exceed nominal `length` (e.g. Gulper 171 m overall vs 146 m).
- The 3/4 view is a flat-shaded silhouette plus edge shading, not a rendered art plate.
- Hive Carrier voxels are coarse (about 12 m per voxel); fine at catalogue distance, not for close flybys.
- No performance test of the 2.5 km model in the sim yet.

## 7. Exeter class (human frigate, 450 m)
Inspiration: owner-supplied angular grey/white frigate image (style only). Features: wedge hull, dorsal slab, bridge tower and mast,
bow hangar maw (12 fighters/drones), two side corvette cradles (2 corvettes), folded radiator panels (heat management for
PD lasers, docs/CAPITAL_COMBAT.md), outboard engine pods on pylons plus a central engine, 7 PD turret clusters, two
forward rails. Docking carries but does not repair or rearm. Hit points and PD weapon values are placeholders. Not yet used in missions.

## 8. Fighter drone (human, planned; owner brief 2026-10-21)
Auto wingman, smaller and more agile than the Kestrel (no pilot G-limit). Armament: one central (spinal) mag cannon and two
missiles. Behaviours: fly ahead as scouts, escort, attack on orders, and **ram ships to self-destruct** for damage.
Owner update 2026-10-21: 6 m long, small shield only, 48 per frigate, lost until replenished, slaved 1 per fighter / 2 per heavy fighter / 6 per corvette (docs/FLEET_LOGIC.md 9a). Model targets (placeholders, to tune): length 6 m, turn rate above Kestrel, low shield, very low hull. Needs: subsystem
set (engine, cannon, missile rail, sensor, core), marker rendering like all models, ram-damage rule (see docs/FLEET_LOGIC.md
section 9). Open: jamming rules (later).

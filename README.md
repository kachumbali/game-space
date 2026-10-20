# game-space

Voxel space shooter in the spirit of Wing Commander II / X-Wing / TIE Fighter.
Single-file prototype (`index.html`, Three.js via CDN). Enemies: **FROGGS**.

## Run
Open `index.html` in a browser (needs internet for the Three.js CDN import), or serve the folder
(`python3 -m http.server`). Phones: open the same URL; touch controls appear automatically
(append `?touch` to force them).

## Controls (desktop)
| Input | Action |
|---|---|
| Mouse (click to capture) | Stick (pitch/yaw), persistent; `C` centres it |
| W / S | Throttle up / down (thrust in newtonian mode) |
| Shift | Afterburner |
| Q / E | Roll |
| Space / LMB | Fire |
| V | Cockpit / chase view |
| F | Arcade / newtonian flight model |
| X | Brake (newtonian) |
| T | Cycle target |
| B | Toggle bloom |
| `-` / `=` | Voxel detail down / up (24–112 voxels per ship length) |
| `[` / `]` | Pixel size |
| R | Restart |

Touch: left half = floating stick, right side = throttle slider, FIRE, BOOST, roll buttons, VIEW.

## Damage model (WC2 / X-Wing style)
- Fore/aft shields, four-sided armour (fore/aft/left/right), then internal structure.
- Components with hit points: engines, guns, shield generator, radar, power plant. Damaged engines slow and
  slow-turn the ship, dead guns stop firing, a dead shield generator drops shields, a dead radar scrambles/blanks
  the scope, a dead power plant destroys the ship.
- Hits are traced through the voxel grid: you can miss, and hull damage physically chips voxels out of the ship,
  scorches the surrounding hull and exposes glowing interior voxels. A FROGG with no guns left flees.
- HUD: damage schematic (top left), target panel with shield/armour/structure and component states, event log.

## Design
- Ships are data (tapered/swept boxes and ellipsoids in ship space), voxelised at any resolution -> detail scales by changing one number.
  AO, panel tint and glow voxels are baked at voxelisation time; bloom, sky shader (nebula, sun, planet) and particles on top.
- FROGGS: Raider (fighter) and Reaver (heavy) - angular Kilrathi/Battlestar look, browns, rust, amber engines, green eye slit.
- Flight models are swappable (`flightModels.*`): arcade now, newtonian toggle, room for I-War-style physics.
- Mission system and campaign state machine (briefing -> mission -> debrief -> cutscene nodes) are next.

## Roadmap
1. [x] Flyable ship, voxel ships, pixel render, FROGG AI, lasers, debris, HUD, waves
1b. [x] Bloom/sky/planet, component damage, voxel chipping, new FROGG ships
2. [ ] Missiles + lock, capital ships, wingmen orders
3. [ ] Data-driven missions (JSON): objectives, triggers, spawns, win/fail
4. [ ] Briefing/debrief + campaign graph
5. [ ] Audio, cutscene nodes

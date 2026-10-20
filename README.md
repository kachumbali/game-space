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
| `-` / `=` | Voxel detail down / up (20–112 voxels per ship length) |
| `[` / `]` | Pixel size |
| R | Restart |

Touch: left half = floating stick, right side = throttle slider, FIRE, BOOST, roll buttons, VIEW.

## Design
- Ships are data (solid primitives in ship space), voxelised at any resolution -> detail scales by changing one number.
- Flight models are swappable (`flightModels.*`): arcade now, newtonian toggle, room for I-War-style physics.
- Mission system and campaign state machine (briefing -> mission -> debrief -> cutscene nodes) are next.

## Roadmap
1. [x] Flyable ship, voxel ships, pixel render, FROGG AI, lasers, debris, HUD, waves
2. [ ] Missiles + lock, capital ships, wingmen orders
3. [ ] Data-driven missions (JSON): objectives, triggers, spawns, win/fail
4. [ ] Briefing/debrief + campaign graph
5. [ ] Audio, cutscene nodes

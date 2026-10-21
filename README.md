# game-space

Voxel space shooter in the spirit of Wing Commander II / X-Wing / TIE Fighter. Enemies: **FROGGS**.
The playable build is the single file `index.html` (Three.js from a CDN). Source lives in `src/*`;
`python3 build.py` concatenates it into `index.html`.

## Play
Open `index.html` (internet needed for the Three.js CDN), or `python3 -m http.server`. Phones work: touch controls
appear automatically. The game boots into the briefing for **Operation Lilypad** (about 2–4 minutes).

URL flags: `?go` skip briefing · `?free` free flight · `?newcrew` reset crew record · `?touch` force touch UI ·
`?nobloom` · `?mute` · `?m=N` start mission N · `?speed=X` sim speed · `?skyres=N` sky cubemap size.
The game boots into the latest mission (Reedbed). Phones (touch, short side < 520 px) get a compact HUD (`body.phone`).

## Mission 1: Operation Lilypad
You fly Eagle Lead (Kestrel) from the corvette HSS Halberd with wingmen HAWK and SPARROW.
1. Kill the FROGG strike wave (Darters, Leapers). 2. Stop the Toad torpedo bombers before they launch at the Halberd.
3. Destroy the FROGG Gulper corvette (and its Reaver escort). Debrief shows kills, accuracy, grade; crew
kills/sorties persist in localStorage (`gs_crew`, see docs/VISION.md).

## Mission 2: Operation Reedbed (multi-area)
Two corvettes (HALBERD 128 m, TALON 128 m) and Eagle flight sortie through areas of operation. The autopilot flies the fleet
between them with cinematic cameras (flyby, orbit, chase, bow, arrival); SPACE / ENTER / tap skips. NAV 2 Bog Relay: fighters,
then torpedo bombers. NAV 3 FROGG outpost: Gulper (146 m) with Reaver/Spitter/Darter screen. Pick missions on the briefing
screen or with `?m=2`. Sim speed defaults to 37.5% (`?speed=1` for full).

## Controls (desktop)
| Input | Action |
|---|---|
| Mouse (click to capture) / C | Stick; centre |
| W / S, Shift | Throttle, afterburner |
| Q / E | Roll |
| Space / LMB | Guns (1 cannons, 2 lasers, 3 linked) |
| RMB / Enter, G | Fire missile, cycle missile type |
| Z | Flares/chaff |
| T / Y | Next target / target nearest crosshair |
| N | Cycle subsystem on target (pipper aims at it); touch: SUB |
| K | Radar range 1.5 / 3 / 6 km |
| V, F, H, M | View, flight model, help, mute |
| `-` `=` `[` `]`, B | Voxel detail, pixel size, bloom |

Touch: floating stick, throttle slider, FIRE, MSL, FLARE, BOOST, roll L/R, VIEW, TGT, AIM-T, WPN.

## Systems
- **Sky and backgrounds** (`src/41_sky.js`): procedural HDR cubemap (stars, Milky Way, nebulae, sun) baked once per
  *look* (1024 px/face desktop, 512 touch); shader planets (terran with clouds/cities/atmosphere, ringed gas giant),
  moons, sun glare. Looks (`LOOKS`: lilypad, reed, ao2, ao3) are chosen by `M.look` / `area.look`; the sun direction and
  scene lighting follow the look. Bake takes seconds in software rendering; GPU/iPad timing unverified.
- **Radar**: 3D forward-up scope with range rings, elevation stalks, missile triangles, target highlight.
- **Lock-on**: seek → range → locking → locked; IR (heat), RF (radar, needs working radar), torpedoes, FROGG tick/tadpole.
  Flares fool IR missiles, chaff fools radar missiles. Lead pipper for guns.
- **Weapons**: cannons (ammo), plasma bolters (energy capacitor), railgun, point-defence; FROGG fang/spit/lash/sting.
  Missiles are guided, burn out, proximity-fuzed; PD turrets shoot missiles down.
- **Damage**: fore/aft shields → 4-sided armour → structure, typed damage (kinetic/energy/explosive), components
  (engines, guns, shield, radar, power), voxel chipping and scorching. Corvettes die in stages.
- **AI roles**: fighter, gunship, bomber, corvette/capital.

## Ships
Human: Kestrel (fighter), Halberd (corvette). FROGG: Darter (interceptor), Leaper, Spitter (acid gunship), Toad
(torpedo bomber), Reaver (heavy), Gulper (corvette). Ships are data (`src/30_*`, `src/31_*`); voxel resolution is one
number (`DETAIL_STEPS`), so detail scales up later.

## Source layout
`00_head.html` shell/CSS · `10_config` · `12_audio` · `20_voxel` voxelizer · `30/31_ships_*` · `32_scale` (ship scaling, fighter turn) · `40_scene` · `41_sky` (sky/planets/sun) · `45_particles` · `50_state` ·
`55_ships` · `60_weapons` · `65_combat` · `70_ai` · `75_mission` · `77_cine` (transit cutscenes) · `80_input` · `85_update` · `90_hud` · `95_main`.

## Roadmap
See `docs/VISION.md` (long-term), `docs/PLAN.md` (next round), `docs/TIE_FIGHTER_COMPARISON.md` and `docs/FREESPACE2_COMPARISON.md` (UX gap analyses,
prioritised), `docs/REALISM.md`, `docs/EXPANSE_MODEL.md`, `docs/SHIPS.md`. `docs/FS2OPEN_STUDY.md` (FS2 Open source study), `docs/STRATEGY_LAYER.md` (campaign/strategy proposal), `docs/FLEET_LOGIC.md` (ship roles, fleets, pilots, SAR). `docs/SHIP_MANUAL.md` (ship list, scale ladder, blueprints), `docs/LORE.md`, `docs/CAPITAL_COMBAT.md` (discussion). Agents: read `AGENTS.md` first.

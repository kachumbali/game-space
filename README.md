# Claude Space Commander (repository: game-space)

Voxel space shooter in the spirit of Wing Commander II / X-Wing / TIE Fighter. Enemies: **FROGGS**.
The playable build is the single file `index.html` (Three.js from a CDN). Source lives in `src/*`;
`python3 build.py` concatenates it into `index.html`.

## Play
Open `index.html` (internet needed for the Three.js CDN), or `python3 -m http.server`. Phones work: touch controls
appear automatically. The game boots into the **main menu** (CAMPAIGN / MISSIONS, SKIRMISH, FREE FLIGHT, OPTIONS, CREDITS; arrow keys + Enter or click/tap). Missions open the briefing; the restart dialog (R) and briefing have a MAIN MENU button.

**Skirmish** (menu SKIRMISH): quick test fight. Choose wingmen (0-3), an optional friendly Halberd/Exeter, the enemy force as rows of ship + count (presets: Waves 1/2/3/5, Heavy, Gulper, vs Halberd, vs Exeter, BULLFROG, BULLFROG + 2 GULPER, Hive Carrier (unarmed catalogue ship)), enemy skill 1-5, friendly flight model, enemy missiles on/off, endless respawn, starting range (800 m / 2 km / 4 km / 10 km) and environment look. The fight ends with a debrief (kills, time, accuracy, damage) and RESTART / SETUP / MAIN MENU. Corvettes and frigates are heavy to voxelise; the 2.5 km Hive Carrier is the heaviest (warning in the UI, not tested on real hardware). Setup is remembered in localStorage `gs_sk`.

URL flags: `?go` skip menu and briefing · `?m=N` skip the menu, open mission N's briefing · `?free` free flight · `?sk=darter:3,leaper:2` skirmish (with `&sk_skill=1..5 &sk_wing=0..3 &sk_wskill &sk_fm=newton &sk_msl=0 &sk_respawn=1 &sk_range=800 &sk_look=reed &sk_ally=halberd|exeter`; `__game.startSkirmish(cfg)` takes the same as an object) · `?newcrew` reset crew record · `?touch` force touch UI ·
`?nobloom` · `?mute` · `?m=N` start mission N · `?speed=X` sim speed · `?skyres=N` sky cubemap size. The throttle gauge sits right of the radar (yellow tick = actual speed). Free-flight test flags (`n`, `wing`, `frigate`, `nuke`, `aifm`, `wskill`, `fskill`) are listed in docs/MILESTONE_1.md. Drone flags: `?free&drones=N` (player carries N drones and launches up to the control limit; a fighter controls 1, `&dlimit=N` raises it, `&nolaunch` keeps them aboard).

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
| `-` `=` `[` `]`, B | Voxel detail, pixel size (first step is 2x supersampling), bloom |
| P | Graphics preset low / mid / high / ultra (URL `?q=high` or `?q=ultra` also enables MSAA and a larger sky) |
| H | Key map overlay |
| 4 / 5 / 6, 7 | Power allocation: +1 point to weapons / shields / engines (from the largest other), 7 = balance (touch: tap the POWER bars) |
| J | Comms menu (touch: COMMS button): orders and requests to wingmen, capital ships, drones (when present) and the targeted ship; digits select, 0 back |
| O | Options: audio, device preset (phone / tablet / laptop / desktop / max), distance LOD |

Touch: floating stick, throttle slider, FIRE, MSL, FLARE, BOOST, roll L/R, VIEW, TGT, AIM-T, WPN.

## Systems
- **Sky and backgrounds** (`src/41_sky.js`): procedural HDR cubemap (stars, Milky Way, nebulae, sun) baked once per
  *look* (1024 px/face desktop, 512 touch); shader planets (terran with clouds/cities/atmosphere, ringed gas giant),
  moons, sun glare. Looks (`LOOKS`: lilypad, reed, ao2, ao3) are chosen by `M.look` / `area.look`; the sun direction and
  scene lighting follow the look. Bake takes seconds in software rendering; GPU/iPad timing unverified.
- **Radar**: 3D forward-up scope with range rings, elevation stalks, missile triangles, target highlight.
- **Lock-on**: seek → range → locking → locked; IR (heat), RF (radar, needs working radar), torpedoes, FROGG SK-1/ST-2.
  Flares fool IR missiles, chaff fools radar missiles. Lead pipper for guns.
- **Weapons**: cannons and HE shells (ammo), mass drivers, railguns, lasers, point-defence; FROGG masers and autocannons (realism pass 2026-10-22: ids like `fang`/`spit` are stable, the displayed names are the realistic ones).
- **Magazines** (owner rule 2026-10-22): every kinetic weapon carries ammo and runs dry - mount pools, per-turret PD drums (a dry turret goes dark), the Exeter's XL has 100 slugs. Energy weapons draw the reactor instead. A **Tender** rearms friendly ships nearby (rearm is not repair).
  Missiles are guided, burn out, proximity-fuzed; PD turrets shoot missiles down. Beam weapons (laser, FROGG pulse laser and lance) are drawn as real beams from the muzzle
  (thin and dim while the turret acquires, bright with muzzle and impact flares once it burns; width `bw` per weapon, docs/LASERS.md section 7). Turrets come in classes S/M/L (5/11/30 m, docs/SHIPS.md) and fire from their barrel tips.
- **Damage**: fore/aft shields → armour type (ablative/hard/composite, see docs/ARMOR.md) → structure, typed damage (kinetic/energy/explosive), components
  (engines, guns, shield, radar, power), voxel chipping and scorching. Corvettes die in stages.
- **AI roles**: fighter, gunship, bomber, corvette/capital.
- **Music** (`src/13_music.js`): mp3 tracks in `audio/`, switched by mood with a ~1.6 s crossfade: menu and briefing `airy`,
  flight `sector`, combat `combat-dogfight` (low bed), heavy fights `combat-bombast` (6+ hostiles near), victory `victory`,
  transit cutscenes `transmission`. Starts on the first key press/tap (browser autoplay rule); on/off and volume in OPTIONS (O),
  `?mute` silences everything. On iPad the music volume slider may not work (iOS ignores element volume).

## Ships
Human: Kestrel (fighter), Halberd (corvette: rails + GA-9 rotary), Exeter (frigate, stock 48 drones), Tender (unarmed fleet resupply ship: rearms ammo, missiles and XL slugs within 600 m - never repairs), Drone (6 m unmanned). FROGG: Darter (interceptor), Leaper, Spitter (maser gunship), Toad
(torpedo bomber), Reaver (heavy), Gulper (corvette), **Bullfrog** (600 m jump capital: XL GX-1 charged lance with a telegraphed 6 s charge and 30 s cooldown, 1 L / 6 M / 18 S+PD turrets, 36-fighter hangar, no drones; explicit exception to the 500 m cap; docs/BULLFROG.md, src/79_bullfrog.js, tests `tools/tests/bullfrog_t.py`, `bullfrog_eng.py`), Hive Carrier (unarmed catalogue ship). Ships are data (`src/30_*`, `src/31_*`); voxel resolution is one
number (`DETAIL_STEPS`), so detail scales up later.

## Source layout
`00_head.html` shell/CSS · `10_config` · `12_audio` · `13_music` (music moods, options panel) · `14_samples` (CC0 sample layer) · `15_credits` · `20_voxel` voxelizer · `30/31_ships_*` · `32_scale` (ship scaling, fighter turn) · `40_scene` · `41_sky` (sky/planets/sun) · `45_particles` · `50_state` ·
`55_ships` · `56_drones` (drone controller model, orders, ram) · `60_weapons` · `65_combat` · `70_ai` · `75_mission` · `76_menu` (main menu, skirmish) · `77_cine` (transit cutscenes) · `78_coms` (comms menu) · `79_bullfrog` · `80_input` · `85_update` · `90_hud` · `95_main`.

## Roadmap
See `docs/VISION.md` (long-term), `docs/PLAN.md` (next round), `docs/TIE_FIGHTER_COMPARISON.md` and `docs/FREESPACE2_COMPARISON.md` (UX gap analyses,
prioritised), `docs/REALISM.md`, `docs/EXPANSE_MODEL.md`, `docs/SHIPS.md`. `docs/FS2OPEN_STUDY.md` (FS2 Open source study), `docs/STRATEGY_LAYER.md` (campaign/strategy proposal), `docs/FLEET_LOGIC.md` (ship roles, fleets, pilots, SAR). `docs/SHIP_MANUAL.md` (ship list, scale ladder, blueprints), `docs/LORE.md`, `docs/CAPITAL_COMBAT.md` (discussion). Agents: read `AGENTS.md` first.

- `docs/STAR_MAP.md`: ~20 real star systems within 50 ly for the strategy layer (design proposal; data table `docs/data/stars.csv`).
- `docs/STRATEGY_MECHANICS.md`: harvesting, factory ships, solar/fusion hubs, sieges (design proposal, nothing implemented).


## Systems added 2026-10-22
- **Power allocation** (src/50_state.js `pwF`, `powerShift`; owner decision 2026-10-22: all ships work the budget, not just the player): 12 points over weapons / shields / engines (default 4/4/4 = factor 1). Factor: 0 pts 0.2, 4 pts 1.0, 12 pts 1.96. Weapons = capacitor recharge, shields = shield recharge, engines = top speed (x0.8 + 0.2f), turn (x0.9 + 0.1f), afterburner pool and refill. The AI manages it too (`powerAI` in src/70_ai.js): shields when taking hits, weapons when the capacitors run low while fighting, engines when closing or running, balance when calm; one point per decision, cadence scaled by skill (elite ~1.6 s, rookie ~3.6 s). Modelled on FreeSpace 2's ETS (key layout and factors are mine, not FS2's).
- **Afterburner pool** (`abTick`): drains 1/s while burning, empty = locked out until 25 %. Humans 20 s, refill 0.8/s, burn x1.8; FROGG fighters 36 s, refill 1.6/s, burn x2.1 (accel x2.6) and the AI burns on break-away runs and long re-engagements. Capitals have none.
- **AI missile budget** (`missileLogic`): one missile at a time per target, none inside 350 m, 14-24 s reload, lock plus 70 % range. FROGG missiles do +30 % damage (`FMX`) and carry more (Darter/Leaper 2, Spitter 4, Reaver 6, Toad 3, Bomber 6).
- **Distance LOD + device presets** (options panel, `DEVICES`, `LOD_LEVELS`, `lodTick`): far ships are re-voxelised 1-3 detail steps lower; saved in localStorage `gs_gfx`. Sky size and MSAA still need a reload.
- **HUD**: energy gauge same size and style as the throttle gauge (desktop left of the radar, touch left side); POWER widget above the radar; Newtonian vector markers (VEL, RETRO, REL, MATCH).
- FROGG lasers +25 % (pulse 3.5, lance 3.0).

## Comms menu (src/78_coms.js, 2026-10-22)
Key J (touch: COMMS). Tree: WINGMEN (all or one: attack my target, engage at will, protect me, defend capital, form on me [holds fire], weapons hold/free, return to base, status report) / CAPITAL-CONTROL (status, focus fire on my target, request fighter cover, CONTROL sitrep in missions) / DRONES (shown only when `dronesOf` exists) / TARGET (hail, identify, request assist from a non-wing friendly, capital menu). Orders live in `ship.ai.order`; `ai.hold` blocks guns and missiles. A pilot that is hit or has a missile inbound drops formation / RTB and defends itself. HAWK and SPARROW answer in character. Verified headless (`tools/tests/coms_t.py`); not played by hand. Not done: orders to other flights by group, wingmen asking the player for help, mission-scripted dialogue branches.
- **Drones** (src/56_drones.js, docs/FLEET_LOGIC.md 9b): unmanned 6 m wingmen slaved to one controller (`ctrl.drones`, stock `ctrl.stores.drone`, control limit fighter 1 / corvette 6 / frigate 6). Orders `engage`, `all`, `protect`, `return`, `scout`, `ram` via `droneOrder(ctrl, order, tgt)`; `launchDrones(ctrl, n)`, `dronesOf(ctrl)` (all on `__game`). Ram damage = 0.002 x closing speed^2 to the subsystem under the contact point; lost drones stay lost; drone kills are credited to the controller (`ctrl.droneKills`); drones of a dead controller go autonomous. Test: `tools/tests/drone_t.py`. No in-game control yet except the HUD line (DRONES live/stock + order) and the URL flags; the comms menu is separate work.

## Damage map (src/90_hud.js `drawCompZones`, 2026-10-22)
The player's damage schematic (top left) shows WC2-style zones instead of dots: each component is a zone shaped by its role (engine nacelle, gun barrel, turret ring, shield band, sensor oval, reactor block) clipped to the hull silhouette; colour = health (green / amber / red / dead = dark red with hatch), white flash when just hit, label (name and percent) on up to four damaged systems. Facing shield arcs and armour bars are unchanged. Check: `tools/tests/dmgmap_t.py` (element screenshots in /tmp/gs_shots). Only the player's ship has this map; the target panel is still a text list.
- **Bullfrog systems** (src/79_bullfrog.js, 2026-10-22): AI role `lancer`; spine (`spineStep`, ray 12 m wide, refuses to fire with a friendly on the line, HUD `SPINE CHARGING` / `SPINE LOCK - BREAK` / `... AT <ally>`), hangar (`hangarUpdate`: 2 bays x 18, 4.5 s per bay, 12 airborne cap, bay loss = manifest loss, emergency launch), jump spool (20 s), Gulper escort rules (`ai.escort`), fighters keep out of the spine corridor. `applyHit(..., through)` lets spine hits carry through component splits; `blastAt` measures from the hull for radius > 150 (`hullGap`); `EXPOSED.bay`. Skirmish presets BULLFROG and BULLFROG + 2 GULPER, start range 10 km. Test seam `__bf`.

## Milestone 2
See `docs/MILESTONE_2.md` for the state of the game, how to work on it locally, what is verified, known problems and next steps.

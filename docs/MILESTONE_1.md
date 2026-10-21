# Milestone 1: laptop test guide (2026-10-21)

Tag: `milestone-1`. The playable build is the single file `index.html` (Three.js loads from a CDN, so the laptop needs internet).

## Run
Open `index.html` in Chrome, Edge or Firefox (double-click is enough), or run `python3 -m http.server` in the folder and open http://localhost:8000/.
Click the canvas to capture the mouse. Press H in game for the key list (full table in README.md).
If it is slow: `?nobloom`, press `-` / `[` to lower voxel detail and `=` / `]` for larger pixels, `?skyres=512` for a smaller sky bake.

## Flags (add to the URL, e.g. `index.html?free&wing=3&frigate`)
| Flag | Effect |
|---|---|
| `?go` | skip the briefing; boots into Operation Reedbed (latest mission) |
| `?m=1` / `?m=2` | Operation Lilypad / Operation Reedbed |
| `?free` | free flight with FROGG waves |
| `&n=10` | 10 FROGG fighters per wave (4 Kestrels vs about 10 is roughly an even fight in arcade flight) |
| `&wing=4` | 4 AI Kestrel wingmen; `&wskill=1..5` their pilot skill; `&fskill=1..5` FROGG pilot skill |
| `&frigate` | the Exeter joins your side 700 m astern |
| `&nuke=2` | you carry two 0.1 kT warheads: G cycles missiles, lock then fire; proximity burst 120 m |
| `&aifm=newton` | AI ships fly under Newtonian rules; F toggles your own flight model |
| `?speed=1` | full simulation speed (default 37.5%) |

## What to try
1. Reedbed start to finish (about 2-4 minutes per area): does it feel right at laptop frame rate?
2. `?free&wing=4&n=10`: wingmen and FROGGs, check that the fight is neither a walkover nor a slaughter, and how it differs with `&aifm=newton`.
3. `?free&frigate&n=14`: does the Exeter hold? Target its parts with N (sensors, shield projector, radiators, PD turrets).
4. `?free&nuke=1&n=8`: fire a warhead at a group; stay about 500 m away or lose the pilot. Note the flash blinding of radar.
5. Armour: shoot a Halberd or Reaver with cannon and PD (hard armour barely notices small hits), then use plasma or the railgun. Check the ARM label on the target panel.
6. Look at the new FROGG models and the Exeter with V (view) for hull colour, and say if the FROGGs still read as brown.

## What changed since the iPad build
FROGG redesign (carapace skirts, no eyes or mandibles), new sky and planets, phone layout, armour types (ablative / hard / composite), exposed sensors and projectors,
friendly fire and crash damage for all classes, pilot skill 1-5 (SKL on the target panel), Newtonian AI option, first-cut nuclear warhead, Exeter frigate and
Hive Carrier models (blueprints in docs/img/blueprints).

## Not in this build
Lasers (FROGG or human), segmented rolling shields, Whipple plating, jamming, drones, docking and jumping, strategy layer and economy, nukes for the AI or in missions,
a FROGG missile advantage. These are documented in docs/ (LASERS, ARMOR, CAPITAL_COMBAT, FLEET_LOGIC, STRATEGY_LAYER, ECONOMY).

## Known gaps and unverified points
- All performance measurements are software rendering (SwiftShader); real laptop frame rate is unknown.
- The Exeter and Hive Carrier are not in any mission; the Hive Carrier is coarse at 2.5 km and is only a model.
- Balance: arcade even point is about 10 FROGG fighters per 4 Kestrels; Newtonian about 7. Small samples (3 runs); see docs/BALANCE_TESTS.md.
- Frigate dominates fighter-only attacks. Impact-fuzed nukes missed manoeuvring fighters in the headless test.
- Armour and nuke constants are placeholders; the FROGG hull colour is still unresolved; friendly-fire multiplier 0.5 is a guess.
- Please report: frame rate and hardware, anything that looks wrong, which fights feel unfair.

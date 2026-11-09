# Gemini Workplan Development Log (branch `gemini-dev`)

This log tracks all tasks executed by Gemini under `docs/GEMINI_WORKPLAN.md` for review and verification by Claude and the project owner.

---

## 2026-11-01: Dev Server & Target Environment Fix

- **Problem:** Dev server failed to start upon GitHub import into AI Studio container because `package.json` was missing in the source repo (which originally used `python3 build.py` into static `index.html`).
- **Resolution:**
  - Initialized `package.json` with React 19, Three.js 0.170, and Vite 6.1 on `0.0.0.0:3000`.
  - Configured `vite.config.ts` with `target: 'esnext'` and `top-level-await` support (required by runtime database override fetches `?db=data/db.json` in `src/16_db.js`).
  - Added path alias `'three/addons/'` -> `'three/examples/jsm/'`.
  - Added `node_modules/` and `dist/` to `.gitignore`.
  - Verified `compile_applet` succeeds cleanly.
  - Verified local dev server responds `HTTP/1.1 200 OK` on port 3000.
  - Initialized git tracking and checked out working branch `gemini-dev`.

---

## Task G1: Author Marks II–IV for Fighters, Bombers, Missiles & Torpedoes

### 1. Bittern Base Torpedo Capacity
- Updated `ships.bittern.stores.torp` from 4 to 12 in `data/db.json` per Claude's instruction (`Bittern is now 12 torpedoes`).

### 2. Ships Marks II–IV (`data/db.json`)

All mark multipliers adhere strictly to the `0.75..1.20` band, with each step featuring an own-lane delta of `+8..12%` and balanced trade-offs elsewhere.

| Ship ID | Mark | Name | Own-Lane (+8..12%) | Trade-offs / Costs | Concept / Lane |
|---|---|---|---|---|---|
| `kestrel_2` | II | KESTREL II | `maxSpeed`: x1.10, `accel`: x1.10 | `structure`: x0.95, `shield.*`: x0.95 | High-speed interceptor (VBC thrust) |
| `kestrel_3` | III | KESTREL III | `shield.*`: x1.10, `power.capacitorMJ`: x1.10 | `maxSpeed`: x0.95, `turn`: x0.95 | Heavy escort / shield capacitor (VAC) |
| `kestrel_4` | IV | KESTREL IV | `structure`: x1.10, `armor.rating`: x1.10 | `accel`: x0.95, `turn`: x0.95 | Armored assault vanguard (ECU) |
| `merlin_2` | II | MERLIN II | `turn`: x1.10, `accel`: x1.08 | `shield.*`: x0.95 | Dogfight agility / turn rate |
| `merlin_3` | III | MERLIN III | `shield.*`: x1.10, `shieldRegen`: x1.10 | `maxSpeed`: x0.95, `accel`: x0.95 | Reinforced deflector scout |
| `merlin_4` | IV | MERLIN IV | `structure`: x1.10, `armor.rating`: x1.10 | `turn`: x0.95, `accel`: x0.95 | Hardened reconnaissance hull |
| `bittern_2` | II | BITTERN II | `power.plantMW`: x1.10, `power.capacitorMJ`: x1.10, `stores.torp`: +2 (14) | `maxSpeed`: x0.95, `turn`: x0.95 | Extended ordnance loadout |
| `bittern_3` | III | BITTERN III | `shield.*`: x1.10, `shieldRegen`: x1.10 | `maxSpeed`: x0.95, `accel`: x0.95 | Heavy assault barrier |
| `bittern_4` | IV | BITTERN IV | `structure`: x1.10, `armor.rating`: x1.10 | `turn`: x0.94, `accel`: x0.95 | Ironclad siege hull |
| `tern_2` | II | TERN II | `shield.*`: x1.10 | `maxSpeed`: x0.95 | Protected replenishment shuttle |
| `tern_3` | III | TERN III | `maxSpeed`: x1.10, `accel`: x1.10 | `structure`: x0.95 | Rapid-response shuttle |
| `tern_4` | IV | TERN IV | `structure`: x1.10, `armor.rating`: x1.10 | `turn`: x0.95 | Armored fleet tender tender |

### 3. Weapons Marks II–IV (`data/db.json`)

#### Torpedoes (Must satisfy `range`: x1.08..1.12, `vmax` >= 1, `hp` >= 1)
| Weapon ID | Mark | Name | Range / Reach | Speed & Durability | Trade-offs | Concept |
|---|---|---|---|---|---|---|
| `torp_2` | II | HM-1 HAMMER TORPEDO II | `range`: x1.10, `life`: x1.10 | `vmax`: x1.04, `hp`: x1.08 | `turn`: x0.95 | Long-range penetrator |
| `torp_3` | III | HM-1 HAMMER TORPEDO III | `range`: x1.09, `life`: x1.09 | `vmax`: x1.08, `hp`: x1.04 | `lockTime`: x0.95 | Sprint attack torpedo |
| `torp_4` | IV | HM-1 HAMMER TORPEDO IV | `range`: x1.12, `life`: x1.12 | `vmax`: x1.03, `hp`: x1.10 | `dmg`: x1.05 | Heavy reinforced bunker-buster |
| `tad_2` | II | ST-2 TORPEDO II | `range`: x1.10, `life`: x1.10 | `vmax`: x1.04, `hp`: x1.08 | `turn`: x0.95 | Long-range penetrator (Frogg) |
| `tad_3` | III | ST-2 TORPEDO III | `range`: x1.09, `life`: x1.09 | `vmax`: x1.08, `hp`: x1.04 | `lockTime`: x0.95 | Fast strike torpedo (Frogg) |
| `tad_4` | IV | ST-2 TORPEDO IV | `range`: x1.12, `life`: x1.12 | `vmax`: x1.03, `hp`: x1.10 | `dmg`: x1.05 | Heavy acid siege torpedo (Frogg) |

#### Fighter Missiles
| Weapon ID | Mark | Name | Own-Lane (+8..12%) | Trade-offs | Concept |
|---|---|---|---|---|---|
| `ir_2` | II | SW-9 SWIFT (IR) II | `range`: x1.10, `life`: x1.10, `vmax`: x1.04 | `lockTime`: x1.05 | Extended tracker |
| `ir_3` | III | SW-9 SWIFT (IR) III | `turn`: x1.10, `vmax`: x1.08 | `dmg`: x0.95 | High-agility dogfight interceptor |
| `ir_4` | IV | SW-9 SWIFT (IR) IV | `dmg`: x1.10, `blast`: x1.10 | `turn`: x0.95 | Heavy fragmentation warhead |
| `rf_2` | II | LN-3 LANCE (RADAR) II | `range`: x1.10, `life`: x1.10 | `turn`: x0.95 | Long-range radar interceptor |
| `rf_3` | III | LN-3 LANCE (RADAR) III | `vmax`: x1.10, `acc`: x1.10 | `turn`: x0.95 | High-acceleration sprint seeker |
| `rf_4` | IV | LN-3 LANCE (RADAR) IV | `dmg`: x1.10, `hp`: x1.10 | `vmax`: x0.95 | Hardened kinetic breaker |
| `tick_2` | II | SK-1 IR MISSILE II | `range`: x1.10, `life`: x1.10 | `turn`: x0.95 | Stalker seeker (Frogg) |
| `tick_3` | III | SK-1 IR MISSILE III | `turn`: x1.10, `vmax`: x1.08 | `dmg`: x0.95 | Swarm seeker (Frogg) |
| `tick_4` | IV | SK-1 IR MISSILE IV | `dmg`: x1.10, `blast`: x1.10 | `turn`: x0.95 | Corrosive blast warhead (Frogg) |

### 4. Verification Results
- `python3 tools/validate_db.py`: `29 ships, 44 weapons (27 marks), 3 armour types: OK` (0 errors, 0 warnings).
- `python3 build.py`: `built index.html from 37 parts, 735 KB, 813 top-level names checked`.
- `python3 tools/check_opsec.py`: `opsec OK` (0 real names, 0 personal emails).
- `compile_applet`: `Build succeeded - the applet is compiled`.

---

## Intro Test Cutscene Animation (`docs/INTRO_TEST_SPEC.md`)

Implemented the full suite of pixel-art assets and scene definition for the 35-second cutscene test sequence:

### 1. Generated Assets (`assets/scenes/intro_test/`)
- `bg_space.png`: 320x200 pixel-art space background with dithered cyan/blue nebula and curved planetary atmosphere limb. (12 colours)
- `bg_briefing.png`: 320x200 carrier briefing room with riveted teal/slate steel bulkheads, amber hazard stripes, vertical structural struts, and holographic table display. (17 colours)
- `ship_kestrel.png`: 96x48 side/three-quarter pixel sprite of Kestrel heavy fighter with cockpit canopy, swept wings, and afterburner plume. (12 colours)
- `ship_halberd.png`: 160x56 side-profile sprite of 128m Halberd escort corvette with bridge tower, railgun sponson, PD housings, and dual engine exhaust. (12 colours)
- `ui_frame.png`: 320x200 CRT/HUD bracket overlay frame. (3 colours)

### 2. Character Talking Heads (64x64, Flat Skin Base + Overlays)
All heads have flat skin where eyes and mouth go on `base.png`, plus exact-fit overlays:
- **`imani`** (Cdr. Imani, carrier commander):
  - `base.png` (navy uniform, amber collar bar, silver-grey hair)
  - `eyes_open.png`, `eyes_half.png`, `eyes_closed.png`
  - `mouth_rest.png`, `mouth_A.png`, `mouth_E.png`, `mouth_O.png`, `mouth_MB.png`, `mouth_FV.png`
  - `head.json` (blink interval 2.0..5.0, voiceBlip 220)
- **`hawk`** (Lt. Maya Okafor, flight lead):
  - `base.png` (charcoal flight suit, amber stripe, eyebrow scar, short hair)
  - `eyes_open.png`, `eyes_half.png`, `eyes_closed.png`
  - `mouth_rest.png`, `mouth_A.png`, `mouth_E.png`, `mouth_O.png`, `mouth_MB.png`, `mouth_FV.png`
  - `head.json` (blink interval 2.0..5.0, voiceBlip 310)
- **`meow`** (Lt. Tom Cat, player pilot):
  - `base.png` (charcoal flight suit, amber collar, focused pilot head)
  - `eyes_open.png`, `eyes_half.png`, `eyes_closed.png`
  - `mouth_rest.png`, `mouth_A.png`, `mouth_E.png`, `mouth_O.png`, `mouth_MB.png`, `mouth_FV.png`
  - `head.json` (blink interval 2.0..5.0, voiceBlip 260)

### 3. Timeline & Validation Tools
- `scene.json`: Formatted 13-event timeline exactly per Section 3 of `docs/INTRO_TEST_SPEC.md`.
- `tools/make_atlas.py`: Validation script that inspects dimensions, colour counts (all <= 32 colours), head JSONs, and generates `heads_test_sheet.png` (448x192) showing all 7 mouth/eye combinations layered over each character base.
- Verification: `python3 tools/make_atlas.py` exits 0 with `ALL ASSETS VALIDATED SUCCESSFULLY! 0 ERRORS.`

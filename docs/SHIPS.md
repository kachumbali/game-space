# Ship sizes (model units = metres)

Source: `length` and `half` extents in `src/30_ships_human.js`, `src/31_ships_frogg.js`. Span/height = 2 x half-extent (includes wings, spines, turrets), so they can exceed the nominal length.

| Ship | Side | Class | Length m | Span m | Height m | Length vs Kestrel | Max speed m/s |
|---|---|---|---|---|---|---|---|
| Kestrel | human | fighter | 12.4 | 10.4 | 4.4 | 1.00x | 150 |
| Darter | FROGG | fighter | 9.5 | 9.2 | 3.6 | 0.79x | 165 |
| Leaper | FROGG | fighter | 13.6 | 13.2 | 4.8 | 1.13x | 120 |
| Spitter | FROGG | gunship | 16 | 15.2 | 6.4 | 1.33x | 90 |
| Toad | FROGG | bomber | 19 | 17.6 | 7.2 | 1.58x | 78 |
| Reaver | FROGG | heavy | 19 | 19.2 | 7.2 | 1.58x | 95 |
| Halberd | human | corvette | 128 | 60.0 | 44.0 | 10.3x | 28 |
| Gulper | FROGG | corvette | 146 | 75.2 | 57.5 | 11.8x | 34 |
| Bullfrog | FROGG | capital | 600 | 190 (box; hull ~140-150 without blades) | 110 | 48x | 22 |

Bullfrog (authored at 600 m, no `scaleShip`): `half [95, 55, 300]`, radius 305, structure 3000, shield 2000/1600 (regen 6), hard armour 0.30, turn 0.06, `jump: true`, `dock {fighters: 36}`, `ai.role: 'lancer'`, `resMul 0.85` with `resCap 400` (about 46k / 113k / 122k voxel instances at detail 2 / 4 / 6). New schema fields: turret `cls: 'S'|'M'|'L'`, weapon `bw` (beam width, m), def `resCap`, mount `store: 'spine'` (spine mount, not fired by `fireGuns`).

## Class comparison (build of 2026-10-21)
![ships](img/ship_classes_grid.png)

![scale](img/ship_classes_scale.png)

Kestrel row updated for the redesign; Halberd and Gulper rows for the 128/146 m scaling (span/height = 2 x half-extent). Kestrel multiples are relative to 12.4 m for the first row only approximately.

## Weapon mounts and turrets (2026-10-22)
- **Fixed mounts** (`mounts[].pos`, ship space): bolts, missiles' guns and beams originate exactly at `pos`, which must sit on the visible muzzle of the model. `tools/tests/muzzle_t.py` reports, per mount, the distance to the nearest solid voxel and whether the point is inside the hull, and writes marker screenshots (mount red, launch yellow, turret barrel tip green, turret base blue) to `/tmp/gs_shots/ships`.
- **Turrets** (`turrets[]`: `{ w, pos, comp, side, cls }`). `pos` is the base on the hull surface, `side` +1 dorsal / -1 ventral, `comp` the hit zone that powers/kills it. `cls` is the size class by absolute diameter of the visible assembly:

| cls | diameter | barrel | default for |
|---|---|---|---|
| S | 5 m | 1.2 x dia | `pd`, `sting` |
| M | 11 m | 1.7 x dia | every other weapon (`laser`, `flaser`, `spitcannon`, ...) |
| L | 30 m | 1.8 x dia | explicit `cls:'L'` only (heavy lance turrets) |
  The diameter is clamped to 12 % of the hull length (small hulls). Beam turrets have one barrel, others twin barrels that alternate. Bolts and beams leave from the barrel tip of the rotated head (`T.muzzles`), not the turret centre. `comps[].r` of a turret should be about half the diameter (flag if it differs by more than 2x).
- **Missile launch points**: optional `launch: [x, y, z]` per ship (ship space, x mirrors alternately left/right); sits at the front of the visible missile pod, pylon or bay mouth. Without it the default is a point under the nose (`half`-derived).
- **Dead turrets** (component hp 0) stop firing, the barrel droops onto the hull and the assembly darkens.

## Capital refit (owner decision 2026-10-22)

**Bullfrog**: as a carrier it keeps a single heavy lance - the dorsal `L1` (0, 38, -150, 260 hp). The ventral `L2` turret, its component and its model blister are removed; the ventral hemisphere now has no L. The spool condition ("disarmed") is spine emitter + L1 destroyed. Turret count 25 (1 L + 6 M + 10 S + 8 PD).

**Exeter** keeps its old fit (2 RG-90 bow rails, 4 LS-2 lasers, 3 PD-30) and gains:

| Mount | Weapon | Spec |
|---|---|---|
| XL main, muzzle 0, -2, -204 (bow face), emitter comp `mdxl` at 0, 0, -150, 600 hp, `store: 'spine'` | `mdxl` MK-90 MASS DRIVER | 900 kin, 60% pierce, 3200 m, 800 en; charge 5 s, lock 1.5 s before the end, cd 30 s (delay 15 s); kinetic rail-family twin of the FROGG spine |
| 4 L turrets (dorsal pair at +-40, 23, -90; ventral pair at +-36, -25, 30; 140 hp, cls L) | `mdl` MD-55 MASS DRIVER | 60 kin, 40% pierce, cd 2.2 s, v 1800, range 2600; big targets only (fighters inside 900 m), never missiles |
| 8 M turrets (dorsal +-48, 21, 0 and +-14, 26, 130; ventral +-44, -21.2, 60 and +-14, -26.5, 120; 90 hp) | `laserM` LS-8 TURRET LASER | 13 en, cd 0.28 s, range 1800, focus peak x3 like the LS-2 |

The XL charge/lock/cool machine (79_bullfrog.js) is now weapon-generic: any mount with `store: 'spine'` whose weapon has `kind: 'spine'` runs it, with the whole cycle read from the weapon entry (`charge`, `lockT`, `cd`, `delay`, `fizzleCd`, `lockHold`, `corridorHalf`, `warnName`, `bw`, `color`, `sfx`). The FROGG spine is driven by `lancerAI`, the Exeter's mass driver by `capitalAI` (charge gate: big target, in range, aligned, corridor clear; the ship steers onto the aim point while charging and freezes its heading at lock). The HUD charge warning names the weapon (`SPINE` / `MASS DRIVER`). Tests: `tools/tests/mdxl_t.py` (cycle and pierce), `bullfrog_t.py` arcs/spine/exeter (updated: single L, disarmed dummies).

## Weapon catalogue realism pass (owner decision 2026-10-22)

Owner: "realistic weapons, no acid spitters - kinetics, mass drivers, shells with HE or penetrator rods, lasers, masers, nukes". Conventional physics only; internal ids (`spit`, `fang`, `tad`, ...) are stable, display names are what the player sees.

**FROGG energy family -> masers** (en damage, the green bolts and cyan beams; stats unchanged): `flaser` M-1 PULSE MASER, `spit` M-2 MASER, `spitcannon` M-6 HEAVY MASER, `lance` M-7 MASER LANCE, `lanceL` M-8 HEAVY MASER (L), `acidT` M-6T MASER TURRET (M), `spine` GX-1 CHARGED LANCE (XL, kept as an energy lance per owner decision).

**FROGG kinetics:** `fang` R-9 AUTOCANNON (already kinetic, renamed), `sting` R-4 AUTOCANNON TURRET (S), `thorn` R-5 PD TURRET (S). **New:** `rodg` R-12 PENETRATOR DRIVER (kin 34, 45% pierce, 1400 m/s, cd 2.6) - the AP-rod variant that replaced the LASH CANNON as the Gulper's main (its comps are ROD DRIVER L/R).

**Missiles:** `tick` SK-1 IR MISSILE, `tad` ST-2 TORPEDO (stats unchanged).

**Human:** the PL-4 PLASMA BOLTER is gone; the Kestrel's secondary (grp 2) is the new `he` MK-30 HE CANNON - kin 7 per shell plus splash: on impact the bolt calls `blastAt` (8 m radius, distance falloff, `exp` damage to everything but the direct target, which already took the full hit). Ammo 240 per mount like the cannon; the HUD reads GUN + HE. Balance re-measured in `docs/BALANCE_TESTS.md` (HE shells vs FROGG fighters; Gulper rods vs humans).

## Magazine rule and fleet tenders (owner decision 2026-10-22)

"Every kinetic weapon carries ammo; the magazine scales with the weapon, the XL's is 100 slugs; fleet tender ships resupply."

- **Mount weapons** draw from `s.ammo[wid]` pools (`ammoMax` = per-mount sum, cached at makeShip): RG-90 rail 100 rds/mount (12 energy/shot - the mag/rail class draws a little of both), MD-9 mag 120 slugs (30 energy/shot), GA-9 rotary 900, MK-20 cannon 600, MK-30 HE 500, DR-2 300, R-9 autocannon 400, R-12 penetrator 60 (6 energy/shot).
- **Turret weapons** get per-turret drums (`T.ammo`, from the weapon's `ammo`): PD-30 1500 (Phalanx-style, ~110 s), R-4 800, R-5 1000, MD-55 250. A dry turret goes dark like a dead one but keeps tracking; only a tender restores it.
- **XL mains**: the MK-90 mass driver carries `mag: 100` slugs (`sp.mag`, decremented per shot, charge gates require a slug); the GX-1 charged lance is an energy weapon - its "ammo" is the reactor budget.
- **Energy weapons** (lasers, masers) have no magazine: the reactor and the power budget are their supply.
- **New weapon**: `rotary` GA-9 ROTARY CANNON (A-10-style, Halberd grp 2, ventral nose): 25 rps, 2.8 kin + 15% pierce per round, 900-rd magazine = 36 s of fire - the magazine IS the weapon. The AI fires it only inside 1300 m (its reach); capitalAI now fires both mount groups up close and group 1 at range - this also woke the Gulper's grp-2 maser lances, which had never fired under AI.
- **TENDER** (new ship, unarmed, 200 m): rearm service via `tenderTick` (55_ships.js) - friendly ships within `serviceR` 600 m regain fixed-mount ammo and finite turret drums at 20 rds/s; live `D` docking doubles this to 40 rds/s. Proximity service adds a missile or flare every 4 s and an XL slug every 6 s; docked service adds one every 2 s and 3 s, respectively. Binding rule kept: **rearm is not repair** - no structure, component or shield restoration. Visible cargo: container rows and service booms; 24-fighter / 4-corvette dock capacity.
- Tests: `tools/tests/magazine_t.py` (11 checks), `tools/tests/tender_pd_t.py` (seeded proximity and docked PD-drum rates).

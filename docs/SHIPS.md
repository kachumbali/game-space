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

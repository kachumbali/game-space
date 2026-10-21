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

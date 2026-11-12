# Armament, power and toughness laws (owner decisions 2026-11-12)

Status: design contract. Numbers are first-pass law outputs. They are balance only after seeded runs (`AGENTS.md`). This document extends the energy law and range law (`tuning.energyLaw`, `tuning.rangeLaw`) and the technology contract (`docs/TECHNOLOGY_PROGRESSION.md`: Marks I–IV for every system, the S/M/L/XL size taxonomy, Armour Levels).

## Owner decisions

1. **Power:** a size law plus a sustain rule.
2. **Turrets:** a fixed slot table per hull class. Each weapon declares its turret size.
3. **Toughness:** a size-and-role law. Carriers end up about 1.5–2× a destroyer, not 4–8×.
4. **Doctrine.**
   - FROGG are energy- and burst-heavy and have better missiles: their missiles start at **Mark V**, where human missiles run Mark I–IV.
   - Humans fight with magnetic and rail cannons and conventional high-explosive rounds.
   - Human fighters carry too many rounds for their size; magazines must fit the hull.
   - Everything stays grounded in physics: no acid, no "bio" hand-waving.

## 1. Size measure

`V` is the ship's solid hull volume in millions of m³, measured from the model at in-game scale. Use the voxel count at tablet detail times the voxel volume, not the bounding box: a sail or a fin must not count as hull. The law tool measures it in the browser. Fighters are outside these laws; they keep their own tables.

## 2. Power law and sustain rule

- **Plant:** `plantMW = 487 × V^0.63`. Fitted on the Halberd, Exeter and Glaive, which match their current values within 5%.
- **Weapon supply:** `bus = plant / 3`, as today.
- **Store:** `capacitorMJ = 2.3 × plantMW` (today's human median), plus the spine shot's share under the energy law.
- **Sustain rule, humans:** point defence plus secondaries at full fire must fit within the weapon supply. Main guns and spine guns fire from the store.
- **Sustain rule, FROGG (burst doctrine):** the supply sustains point defence only. Secondaries, mains and the spine fire from the store.
  - The store holds **at least 8 s** of full secondary and main fire, plus one spine shot, and refills from the supply.
  - The physical basis is superconducting magnetic energy storage: large superconducting coils that hold energy as a magnetic field and release it in milliseconds, charged by the fusion plant. On the models it is the dark coil banks (the Spitter's former sac).
- **Fighters:** human fighters keep their tables. FROGG fighters follow the burst rule: the store holds **4–5 s** of full fire, instead of today's 0.6 s for the Leaper and Reaver.

Check today:

| Ship | Point defence + secondaries (MW) | Supply under the law (MW) | Verdict |
|---|---:|---:|---|
| Exeter | 272 | 348 | sustains |
| Glaive | 268 | 502 | sustains |
| Hecla | 235 | 702 | sustains |
| Columbus | 268 | ~1,760 | sustains |
| Bullfrog | 730, burst from the store | 413 | store must hold ~6,900 MJ (8 s plus the spine) |

## 3. Toughness law

- **Hull:** `structure = 1016 × V^0.52 × roleFactor`. Fitted on the Halberd, Exeter and Glaive.
- **Shields:** today's per-ship ratio of shields to hull (about 0.8–1.2) is kept, so this law moves shields with hull.
- **Role factor** (how much of the volume is armoured):

| Role | Factor |
|---|---:|
| warship (corvette, frigate, destroyer, Bullfrog) | 1.0 |
| carrier or tender (Hecla, Columbus) | 0.7 |
| civil (liner, SAR tender) | 0.6 |

- **Target:** Columbus about 4,000–5,400 hull against the Glaive's 2,700, and Hecla about 2,400–3,000. Today they are 20,736 and 12,000.

## 4. Hardpoint slot table

Turret sizes follow the taxonomy: S 2–5 m, M 6–15 m, L 16–40 m, XL 41–80 m (spine guns only, on the keel). Every weapon gets an explicit `turretCls`; the guess in `turretCls()` goes. That guess is what put the Exeter's class-M turrets on small seats.

| Hull class | XL | L | M | S |
|---|---:|---:|---:|---:|
| corvette | 0 | 0 | 2 | 4 |
| frigate | 1 | 4 | 8 | 6 |
| destroyer | 1 | 4 | 8 | 8 |
| carrier | 0 | 0 | 8 | 12 |
| FROGG capital (Bullfrog) | 1 | 2 | 6 | 12 |

A ship may carry fewer slots than its class allows, never more. `tools/tests` gets a slot check.

Today the Bullfrog has 18 small turrets (10 sting, 8 thorn), which is over the table. The Columbus (8 small, 8 medium) and Hecla fit.

## 5. Doctrine

**Humans: kinetic.**
- Mag drivers, rail and mass drivers for main guns, conventional high-explosive autocannons, point-defence guns.
- Lasers stay as secondaries and point defence.
- **Fighter magazines fit the hull.** Ammunition is budgeted by mass. Reference: a 15 m F-16 carries 511 rounds of 20 mm.

| Kestrel (12.4 m) | Rounds today | Proposed |
|---|---:|---:|
| 20 mm cannon | 600 | 400 |
| 30 mm HE, each gun | 500 | 150 |
| mag driver | 120 | 60 |

  The other fighters are scaled by length.

**FROGG: energy and burst.**
- Masers and lances for secondaries, the spine as the main weapon, kinetic autocannons for point defence.
- No main guns other than the spine. The burst store (section 2) is their identity.

**Missiles.**
- Human missiles are Mark I–IV, as today.
- FROGG missiles (`tick`, `tad`) start at Mark V. Their base entry carries the human Mark IV mods plus one more step of about 10% in the same lanes, and is labelled Mark V. Their `_2` to `_4` entries are Marks VI–VIII.
- `tools/validate_db.py` and the marks schema need a faction mark offset (FROGG labels V–VIII).
- FROGG missiles have no extra cost lane: their better seeker and warhead are the doctrine.

## Implementation

1. `tools/armament_law.py [--apply]`, like `power_table.py --law` and `range_law.py`:
   - measure `V` per ship (headless, voxel count at tablet detail);
   - print the plant, supply, store, hull, shields and slot check against today's data;
   - `--apply` writes the numbers.
2. Store the laws in `tuning.armamentLaw`: coefficients, role factors, slot table and burst seconds.
3. Turret classes explicit in `db.json`; `turretCls()` reads them.
4. Refit ships that break the slot table (Bullfrog).
5. Missile marks for FROGG, with the validator offset.
6. Fighter magazines.
7. Seeded duels: Glaive vs Exeter, Columbus vs Bullfrog, Kestrel vs Leaper. 20 runs per cell before calling anything balanced.

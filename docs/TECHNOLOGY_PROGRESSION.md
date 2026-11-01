# Campaign technology progression

Status: design contract for campaign refits. It intentionally does **not** add a
new player loadout screen. A campaign reward creates a normal resolved ship or
weapon variant in `data/db.json`, so missions, AI, saves, export tools and the
shipyard continue to address it by its ordinary id.

## Naming

- Weapons and ship systems use **Mark I–IV**. Mark I is the base entry.
- Armour uses **Armour Level I–IV**, never “Armour Mark”. Level I is the base
  entry. This avoids conflating a hull-protection refit with a weapon model.
- A reward must state the affected item, level/mark, benefit, cost, and the
  mission or medal that unlocked it.

## Common physical size taxonomy

| Class | Assembly diameter | Fits | Design rule |
|---|---:|---|---|
| S | 2–5 m | fighter fixed gun, PD | can fit an armoured local housing |
| M | 6–15 m | heavy fighter gun, corvette turret | needs a visible seat/ring and magazine or capacitor path |
| L | 16–40 m | frigate turret, heavy support mount | needs a structural deck or spine connection |
| XL | 41–80 m | capital spinal weapon only | must be on the main keel; no wing or exposed pylon mounting |

The visual size is an engineering class, not a damage label. An energy weapon
still needs reactor and radiator support; a kinetic weapon still needs a barrel,
magazine, feed path or recoil structure. `AGENTS.md` hull-attachment rules apply
to every refit.

## System Mark lanes

Every Mark II–IV entry is a normal `base` + `mods` variant. It improves one lane
by roughly 8–12% and pays a visible/statistical cost elsewhere. Do not create a
strictly superior upgrade.

| System | II | III | IV |
|---|---|---|---|
| Turret (S/M/L) | tracking +10%; cycle cost | cooldown -10%; energy/ammo cost | component HP +10%; tracking cost |
| Shield (S/M/L/XL) | capacity +10%; regen cost | regen +10%; capacity cost | projector HP +10%; capacity cost |
| Engine (S/M/L/XL) | acceleration +10%; heat/fuel cost | speed +10%; turn cost | engine HP +10%; acceleration cost |
| Reactor (S/M/L/XL) | plant MW +10%; radiator demand | capacitor MJ +10%; plant cost | reactor HP +10%; capacitor cost |
| Radiator (M/L/XL) | heat rejection +10%; exposed area | component HP +10%; rejection cost | redundant panel operation; mass/volume cost |

“Radiator Mark” is only legal for a hull which has a radiator component and a
visible radiator assembly. A radiator-less fighter cannot receive it merely for
progression symmetry.

## Armour Levels and types

| Armour type | Best defence | Weakness | Visual language |
|---|---|---|---|
| Kinetic / hard | rails, shells and other kinetic penetrators | beam/thermal damage | thick faceted plates, angled belts, internal spall liner |
| Ablative | beams and thermal weapons | repeated kinetic penetration | layered pale panels, replaceable outer tiles, protected heat paths |
| Composite | broad all-round protection | no dominant speciality | layered seams, interlocking plate fields, modest slope |

| Level | Rating ceiling | Required cost | Optional campaign identity |
|---|---:|---|---|
| I | baseline | none | yard-standard protection |
| II | +10% rating | -5% acceleration | strengthened belt / add-on panels |
| III | +20% rating | -5% turn | denser internal liner or larger plate overlap |
| IV | +20% rating plus one survivability lane | -5% acceleration and turn | specialist spall control, protected projector trunks, or repairable outer layer |

The current combat implementation already distinguishes `hard`, `ablative`, and
`composite` profiles. New levels must use the ship mark system to alter
`armor.rating` and movement stats; changing `armor.type` is a separate doctrine
refit and must be an explicit owner decision. A level never bypasses the armour
damage cap and never makes exposed subsystems immune.

## Campaign integration sequence

1. Award a refit after a named mission/medal or narrative choice.
2. Add its resolved data variant and make it available only in later mission
   rosters; do not silently replace an earlier ship.
3. Add a short shipyard report naming the physical change and cost.
4. Give AI a sensible default variant and run seeded balance tests before calling
   it a power increase.
5. Add the same class language to the shipyard technical record and mission
   briefing.

This keeps progression understandable: a player can identify what changed on
the model, predict its combat role, and encounter the same technology on an
enemy without learning a hidden stat-only system.

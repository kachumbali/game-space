# Vehicle design and loadouts — working discussion

Status: discussion baseline, 2026-11-11. The owner wants a coherent visual and functional design for the vehicles and their weapons. Start with the four human fighters; extend the same review to human support and capital ships, then FROGG ships and weapons. This document records existing data and questions, not approved redesigns or balance changes. The baseline is `main` at `d0f256e`. Where older prose disagrees, check `data/db.json` and runtime code before treating either description as current.

## What we are reviewing

For each hull, agree on its job, crew, size, recognizable silhouette and visible weapon/ordnance arrangements. Check that every weapon has a credible mounting and a clear line of fire, that engines and other major pieces are structurally connected, and that the visible magazines, racks or bays plausibly relate to what the craft carries. Compare visual details at combat distance and up close, including the shipyard's subsystem markers. Balance and performance implications need separate evidence before any numbers change.

## Human fighters: current database baseline

Lengths and stores below come from `data/db.json`; the naming in the role column is a plain-language summary. The speed is the configured maximum, not a measured combat result. `mounts` tagged as stores are launch positions, not additional guns.

| Hull | Intended role | Length | Configured max speed | Fixed guns | Defensive turrets | Default carried ordnance |
|---|---|---:|---:|---|---|---|
| Merlin | Light fighter | 9 m | 262.5 m/s | 2 × MK-20 cannon | None | 2 × SW-9 IR; 12 countermeasures |
| Kestrel | Multirole fighter | 12.4 m | 150 m/s | 1 × MK-20 cannon, 1 × MD-9 mag driver, 2 × MK-30 HE cannon | None | 4 × SW-9 IR, 2 × LN-3 radar missiles, 1 × HM-1 torpedo; 24 countermeasures |
| Falchion | Two-seat heavy fighter | 19.5 m | 118 m/s | 2 × MK-20 cannon, 2 × MD-9 mag driver | 3 × PD-15 | 6 × SW-9 IR, 2 × LN-3 radar missiles, 2 × HM-1 torpedoes, 2 × drones; 32 countermeasures |
| Bittern | Torpedo bomber | 22 m | 90 m/s | 2 × MK-30 HE cannon | 2 × PD-15 | 2 × SW-9 IR, 12 × HM-1 torpedoes; 32 countermeasures |

These are authored fits, not a claim that the visible models convincingly accommodate every store. The shipyard and `tools/tests/muzzle_t.py` can help check actual mount and muzzle placement. `docs/ORDNANCE_MANIFEST.md` identifies Kestrel and Falchion torpedo stations as legacy fits and calls for a model/launch alignment review of some stations. The Merlin's two missiles are a single station with capacity 2, not two separately selectable stations.

## First discussion: roles and silhouettes

The present models share grey plated surfaces, exposed engine features and long gun forms. Their three-quarter views give the Merlin a slender fuselage, the Kestrel a twin-pod shape, the Falchion a broader multi-boom shape, and the Bittern a prominent tall slab behind a cylindrical forward hull. These are observations from a single rendered view, not a full geometry or line-of-fire audit. Compare top, side, front and three-quarter views at the same time before choosing changes; the side-by-side images are not to a common physical scale.

Questions for the owner:

1. **Role ladder:** Should the Merlin be a fast, lightly armed interceptor; the Kestrel the standard multirole fighter; the Falchion a heavier two-person fighter; and the Bittern the dedicated torpedo bomber? If not, what should each be best at?
2. **Torpedoes:** The ordnance guide reserves L-class torpedoes for bombers and dedicated heavy strike craft, yet the Kestrel and Falchion retain legacy torpedo stations. Should either fighter keep that capability? If yes, should it be a conspicuous special-purpose fit?
3. **Family resemblance:** Should human fighters share a recognizable cockpit, engine, gun and marking language, with each role getting a distinct silhouette? Which existing hull best captures the direction you want?
4. **Payload visibility:** Should torpedoes and missiles be visibly carried on external racks, housed in internal bays, or vary by hull? The Bittern carries twelve torpedoes in data; the current model should be checked against its cassette/bay concept before deciding whether that payload reads convincingly.
5. **Kestrel's asymmetric armament:** Its MK-20 and MD-9 are different weapons on opposite sides, with two HE cannons also fitted. Is that mixed, asymmetric gun arrangement part of its identity, or should equivalent weapons use matching visible mounts?

## Consistency checks to investigate

- **Role wording:** `data/db.json` labels Kestrel `HEAVY FIGHTER`; `docs/SHIP_MANUAL.md` calls it multirole and describes the larger Falchion as the two-seat heavy fighter. Decide the intended role before editing either source.
- **Torpedo policy:** The Kestrel and Falchion legacy fits conflict with the general L-class eligibility rule in `docs/ORDNANCE_MANIFEST.md`. This is an explicit pending design decision, not evidence that either fit is a bug.
- **Visible stations:** The ordnance manifest calls for reviewing Kestrel's legacy torpedo station and Merlin/Falchion coordinates against actual models. Inspect before deciding whether to move a model, a station, or neither.
- **Shield and piercing wording:** `docs/WEAPONS.md` describes piercing as bypassing shields. The current weapon-hit path in `src/65_combat.js` blocks the piercing share when an active shield facet is hit; tandem torpedoes open the facet. Reconcile the explanation with the implemented and owner-selected behavior.
- **Performance and scale:** Dense voxel models and capital turrets have real rendering costs. A more plausible silhouette or payload should not be assumed free; measure any eventual model changes, particularly on the desktop Mac and iPad.

## Decisions log

No new design decisions recorded yet. Record the owner's answer, alternatives considered, affected hulls and weapons, and whether the decision is visual only or needs gameplay/balance work. Preserve existing weapon values and ship behavior until an implementation is requested and the implications are reviewed.

# Roster implementation ledger

Status: checked against `data/db.json` on 2026-11-01. This distinguishes ships
the player can encounter now from marks and future roster concepts. It is not a
balance report.

## Present in the database

| Side | Hulls | Readiness |
|---|---|---|
| CDF / human | Kestrel, Merlin, Tern, Bittern, Halberd, Exeter, Hecla, Drone, Tender | Definitions and ship code exist. Kestrel, Merlin, Bittern, Halberd and Exeter have mission roles; not every hull has a campaign mission. |
| FROGG | Darter, Leaper, Spitter, Toad, Reaver, Gulper, Hive Carrier, Bullfrog | Definitions and ship code exist. Bullfrog has mission coverage in `m05`; Hive Carrier is an epilogue presence rather than a normal encounter. |

## Marks

The database contains Marks II-IV definitions for Kestrel, Merlin, Bittern and
Tern plus supporting weapon marks. They are authoring data, not proof that each
mark is selectable in every menu or has completed the required 20-seed balance
measurement. `kestrel_2` remains the schema example; empty mark records must
not be presented as flyable ships.

## Planned, not implemented

| Concept | Source | Needed before it becomes a ship |
|---|---|---|
| Falchion two-seat heavy fighter | `docs/LORE_FACTIONS.md` | Hull definition, geometry, 2-drone integration, menu entry, loadout, AI, mission test, balance measurement. |
| Lifeline SAR cutter | `docs/LORE_FACTIONS.md` | Rescue/pod objective loop; without it this is only scenery. |
| Wayfarer evacuation liner | `docs/CAMPAIGN_RETREAT.md` | Passenger/jump-spool state and partial-success mission outcomes. |
| Aegis-class destroyer | `docs/ROSTER_NAMES.md` | Mid-capital role, model, mount plan, PD coverage, AI and capital-balance harness. |
| Faction variants | `docs/ROSTER_NAMES.md` | Database fields and measured trade-offs; names alone deliberately add no stats. |

## Priority

1. Make the existing roster reliable in missions and hand-play it.
2. Ship the Falchion only when its second crew/drone role is mechanically real.
3. Add the liner and SAR cutter alongside their evacuation/rescue objectives.
4. Add a destroyer after the capital balance harness can measure it.

This order avoids model-only additions that look selectable but have no
meaningful gameplay role.

# Ordnance manifest and hardpoint rules

Status: approved design contract; the current game displays fixed stores in a
briefing but does not yet offer a pre-sortie selection screen.

## Physical size classes

| Class | Ordnance | Eligible hulls | Rule |
|---|---|---|---|
| S | short-range IR / defensive missile | drones, fighters, bombers | rail or small internal cell |
| M | radar / multirole missile | fighters, heavy fighters, bombers | wing, fuselage or internal bay station |
| L | torpedo | bombers and dedicated heavy strike craft only | visible torpedo rack, cassette or bay; never a light fighter or drone |
| XL | capital-cell or spinal ordnance | corvettes and larger | capital-only cell, tube or keel assembly |

The size class is a physical interface, not a damage promise. A hull carries a
fixed number of named stations. A briefing can exchange only weapons permitted
by that station; it cannot create extra stores or hide a torpedo in a fighter
missile rail.

## Required hull data

New configurable hulls declare `hardpoints` (or internal `cells`) with an id,
position, permitted size/classes, capacity, and visible physical mounting.
`stores` remains the resolved mission loadout after selection. Launch points
must originate at the selected rack, rail, cassette or bay mouth.

## Briefing loadout flow

Before launch, the player sees a fixed station diagram and may choose eligible
ordnance for each station within the mission's available stock. The briefing
shows total stations, mounted stores, size, seeker/type, and any strategic
stock limit. AI receives its authored default. Campaign missions retain their
no-arcade rule: logistics, dock/rearm and mission stock are the only source of
replacement stores.

## Drone exception

The human **KITE-6 Loyal Wingman** is a disposable S-class drone: DR-2 cannon,
two visible S-class Swift rails, sensor/datalink mast and one engine. It never
carries M/L/XL ordnance; it is a scout/interceptor/PD asset, not a bomber. Its
finite inventory belongs to the future Strategy / Dynamic Campaign ledger and
is replenished only at a base or logistics ship.

## Implementation order

1. Add validated hardpoint/cell data and visible models for existing playable
   hulls; migrate their current fixed stores without changing balance.
2. Add the briefing manifest UI, initially using campaign-authorised stock and
   an AI default loadout.
3. Add mission-start resolution from selected stations to runtime `stores` and
   launch points, with a saved/validated manifest.
4. Add strategic stock and rearm integration only with the Dynamic Campaign.

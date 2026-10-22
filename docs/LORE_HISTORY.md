# History and the Oasis-9 Incident (adopted lore)

Status: adopted 2026-10-22 (owner decision), based on the Gemini proposals in
`docs/prototypes/lore-gemini/` (oasis9-incident, timeline), adapted to the game's
canon. Differences from the raw proposals are flagged inline. Nothing here is
implemented in the engine unless a `src/` reference is given.

## 1. Timeline

- **2030s-2060s, the Great Inundation.** Climate devastation, sea-level rise and
  agricultural collapse destabilise Earth. Population stabilises near 8 billion
  through enforced geo-engineering and rationing. Orbital industry expands out of
  necessity, not choice.
- **2070s, the Fold Breakthrough.** Development of the sub-space jump drive. The
  spatial-displacement envelope needs a hull of roughly **450 m or larger** to
  stabilise a jump field (raw proposal said 500 m; adapted because the game's
  Exeter frigate is 450 m and jumps - naval practice defines the frigate as the
  minimum jump platform, `src/30_ships_human.js`). The technology is
  industrialised under corporate patent (Vanderbilt-Astra, see
  `docs/LORE_FACTIONS.md`).
- **2080s-2140s, the Great Re-Seeding.** Expansion into surrounding systems in
  2 km cryo mega-transports carrying up to 250,000 colonists each, bound mostly
  for hollowed-out asteroid habitats rather than planetary colonies: besides
  Earth, only two temperate Garden Worlds exist (New Caledonia, Aurelia). Roughly
  85 % of humanity ends up living in spun habitats and stations.
- **~2167, the Oasis-9 incident** (fifteen years before the present; see below).
- **2180s, the present.** Human space is a 30-light-year bubble. Earth is held
  together by the United Nations Governance Council; the colonies answer to no
  single authority (see `docs/LORE_FACTIONS.md`). The FROGG swarm is in human
  space.

## 2. The Oasis-9 Incident ("the Nursery")

- **The classified reality:** the FROGGs are an ancient migratory species that
  enters multi-century deep-space dormancy inside dense asteroid clusters while
  their Hive Motherships regenerate power cores.
- **The intrusion:** fifteen years ago a Vanderbilt-Astra mining fleet breached an
  unmapped planetoid in Sector Oasis-9 and found a dormant FROGG **Bio-Anchor
  Nursery**: millions of sleeping bio-neural units and three dormant Hive
  Motherships.
- **The awakening:** VAC attempted to strip-mine the motherships for hull plating
  and plasma capacitors. The forced extraction severed a primary neural node,
  triggering an interstellar distress signal that re-routed the main Hive Fleet
  toward human space.
- **The cover story:** ECU state media portrays the invasion as an unprovoked
  attack by a mindless locust swarm. VAC's role is classified; the conglomerate
  now profits from the war it started.
- Story hooks: the Nursery's severed node (a FROGG relic), whistleblowers inside
  VAC, salvage from the original mining fleet at Oasis-9.

## 3. Engagement limits (the strategic bottleneck)

- **Jump drives are capital-ship systems.** Only frigate-class hulls and larger
  stabilise a jump field (in-game: Exeter frigate, FROGG Bullfrog both `jump: true`).
  All fighters, drones and corvettes must dock before transit (`docs/FLEET_LOGIC.md`
  section 8): fighters and drones in frigate hangars, corvettes in external
  magnetic cradles.
- **Consequence:** if a task force's frigates are destroyed or forced to retreat,
  every deployed fighter, drone and corvette in the sector is marooned. Losing the
  jump platform loses the strike wing. This drives the campaign rule that the
  player commands 2-4 frigates (`docs/ECONOMY.md` section 9) and gives retreat
  decisions weight.
- Not implemented: no engine rule strands fighters on frigate loss yet; missions
  and the strategy layer can enforce it narratively for now.

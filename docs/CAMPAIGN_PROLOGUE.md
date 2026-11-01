# Campaign Draft: "PROLOGUE: UNCHARTED VANGUARD" (4 missions)

Status: Drafted for implementation and review under Task G2 (`docs/GEMINI_WORKPLAN.md`).
Style: Matches `docs/CAMPAIGN.md`.
Conventions: Uses only existing ship classes, existing objective mechanics, and adheres to adopted lore (`docs/LORE.md`, `docs/LORE_FACTIONS.md`, `docs/LORE_HISTORY.md`).
Tags: **[NEW]** = narrative invention consistent with lore; **[NEEDS CODE]** = requires an engine feature or script hook; **[UNTESTED]** = uses existing ships/weapons in an unverified scenario.

---

## Premise & Context

Before the full-scale invasion of human space and the defense of the Lily relay (Campaign: *The Severed Node*), the frontier of the off-world colonies was already trembling. Officially, the Colonial Defence Force (CDF) was policing customs infractions, enforcing mining corridor treaties, and watching corporate conglomerates like Vanderbilt-Astra (VAC) push unregistered survey convoys through restricted outer-system sectors.

You are **Lt. Tom Cat**, callsign **MEOW**, flying a Kestrel heavy fighter with Eagle Flight, 4th Colonial Patrol Wing.
- **Flight Lead:** Lt. Maya Okafor, callsign **HAWK** (veteran pilot, cynical about corporate security, fiercely protective of her wing).
- **Wingman:** Ens. Tomás Vidal, callsign **SPARROW** (rookie wingman, quick to panic under missile lock, flying tight on your shoulder).
- **Task Force Anchor:** Escort Corvette **CSS HALBERD** (128 m, Commander Sarah Vance in CIC, vital capital anchor).

The four prologue sorties chart Eagle Flight's journey from a routine frontier customs intercept to the terrifying first contact with the alien Bio-Anchor Hive Fleet.

---

## Mission P1: CONTRABAND SUN (Difficulty 1)

- **Location:** Nav Corridor 7-A, Outer Sidero-Node Periphery (Look: `reed` or `ao2`). Single area.
- **Purpose:** Introduce basic flight handling, formation flying, dogfighting against human light fighters, and protecting an allied capital anchor (CSS HALBERD).
- **Player Ship:** `kestrel`. Wing: HAWK + SPARROW in `kestrel`s.
- **Allies:** CSS HALBERD (`anchor`, vital, 128 m escort corvette).
- **Briefing:**
  `Eagle Flight, CDF Halberd CIC. We have an unauthorized transit beacon in Corridor 7-A. A heavy resupply shuttle, transponder registered to an unregistered dummy holding in VAC colonial space, has bypassed the orbital customs checkpoint at Hollow 14.`

  `Standard procedure: close within scan range and demand their registry seals. Intelligence warns the shuttle has hired private security—surplus light interceptors operating under false transponders. If they illuminate you with fire control radar, you are cleared weapons free.`

  `Protect the Halberd. Ground the smugglers. Do not let the transport jump.`
- **Setup:**
  - `anchor`: `{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' }`
  - `player`: `{ pos: [80, 15, 100], speed: 60, ship: 'kestrel' }`
  - `wingmen`:
    - `{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [110, 20, 130] }`
    - `{ pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [50, 10, 130] }`
- **Stages & Objectives (Existing Types Only):**
  - **Stage 0 (`when: { t: 4 }`):**
    - `comm`: `['CONTROL', 'Eagle flight, transport group identified. Resupply shuttle TERN with two escort fighters on vector one-four-zero. Broadcast inspection orders.']`
    - `obj`: `['p1_o1', 'Intercept the smuggler transport group', 'open']`
    - `spawn`: `{ grp: 'A', ships: [['merlin', 2]], bearing: [0.3, 0.05, -1], dist: 2600, spread: 180 }`
  - **Stage 1 (`when: { after: 3 }`):**
    - `comm`: `['HAWK', 'Target craft, this is CDF Eagle Flight. Cut main thrust and prepare for boarders.']`
    - `comm`: `['SMUGGLER', 'Eagle lead, disregard our heading. We carry private VAC industrial freight—you have no jurisdiction out here!']`
    - `comm`: `['HAWK', 'They are locking fire control! Eagle two, break and engage!']`
    - `obj`: `['p1_o1', null, 'done']`
    - `obj`: `['p1_o2', 'Destroy the mercenary escort fighters', 'open']`
  - **Stage 2 (`when: { dead: 'A', delay: 2 }`):**
    - `obj`: `['p1_o2', null, 'done']`
    - `comm`: `['CONTROL', 'Escorts neutralized. The Tern shuttle is firing thrusters for an emergency jump run! Bring down their shields and destroy the transport!']`
    - `obj`: `['p1_o3', 'Destroy the rogue transport TERN', 'open']`
    - `spawn`: `{ grp: 'B', ships: [['tern', 1]], bearing: [0.1, 0.0, -1], dist: 1800, spread: 50 }`
  - **Stage 3 (`when: { dead: 'B', delay: 3 }`):**
    - `obj`: `['p1_o3', null, 'done']`
    - `comm`: `['CONTROL', 'Target transport destroyed. Debris cloud confirmed. Good shooting, Eagle Flight. Form up on the Halberd.']`
    - `comm`: `['SPARROW', 'Control... sensor telemetry from that wreck is strange. The shuttle wasn't carrying ore or rations. It was packed with cryogenic sample pods.']`
    - `comm`: `['HAWK', 'Let salvage sift the slag, kid. Stay in formation.']`
    - `end`: `'win'`
- **Debrief (Win):**
  `Smuggler flight neutralized. Salvage crews recovering telemetry from the destroyed Tern shuttle report sealed biological containment canisters marked 'Project Nursery / Oasis-9'. Vanderbilt-Astra corporate legal has already filed an emergency secrecy injunction with the UNGC. The Halberd remains on patrol.`
- **Debrief (Lose):**
  `Sortie failed. The Halberd was lost or your fighter destroyed in the crossfire. The rogue transport jumped clear into deep space.`

---

## Mission P2: THE CHOKEPOINT (Difficulty 2)

- **Location:** Nav Point Beta, Sidero-Node Relay corridor (Look: `reed`). Two areas or wide operational perimeter.
- **Purpose:** Tactical fleet engagement; teaches wingman coordination, handling multiple concurrent fighter waves, and breaking heavy defensive screens.
- **Player Ship:** `kestrel`. Wing: HAWK + SPARROW in `kestrel`s.
- **Allies:** CSS HALBERD (`anchor`, vital, 128 m escort corvette).
- **Briefing:**
  `Colonial supply lines through the Siderite belt have been severed. A coalition of corporate privateers and rogue militia has blockaded Relay Beta with heavy fighters and combat drones, seizing ore shipments and starving the local spun habitats.`

  `The CSS Halberd will jump into the sector to draw their primary defensive batteries. Eagle Flight will deploy ahead to punch through the perimeter screen, eliminate their drone controllers, and break the blockade before enemy reinforcements can mass on our flank.`

  `Expect modified Kestrel fighters and autonomous VBC-pattern drones. Keep your speed high and watch for cross-covering mass drivers.`
- **Setup:**
  - `anchor`: `{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' }`
  - `player`: `{ pos: [90, 20, 110], speed: 65, ship: 'kestrel' }`
  - `wingmen`:
    - `{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [120, 25, 140] }`
    - `{ pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [60, 10, 140] }`
- **Stages & Objectives (Existing Types Only):**
  - **Stage 0 (`when: { t: 4 }`):**
    - `comm`: `['CONTROL', 'Eagle flight, we are in the blockade corridor. Multiple hostile signatures bearing zero-two-zero. Break their outer pickets.']`
    - `obj`: `['p2_o1', 'Destroy the blockade picket wave', 'open']`
    - `spawn`: `{ grp: 'A', ships: [['merlin', 3], ['kestrel', 1]], bearing: [0.2, 0.05, -1], dist: 2800, spread: 240 }`
  - **Stage 1 (`when: { dead: 'A', delay: 3 }`):**
    - `obj`: `['p2_o1', null, 'done']`
    - `comm`: `['CONTROL', 'Pickets shattered! But they have activated combat drone swarms from a hidden depot canister. Intercept the drones before they swarm the Halberd!']`
    - `obj`: `['p2_o2', 'Destroy the autonomous drone wave', 'open']`
    - `spawn`: `{ grp: 'B', ships: [['drone', 4], ['merlin', 2]], bearing: [-0.4, 0.1, -1], dist: 2400, spread: 260 }`
  - **Stage 2 (`when: { dead: 'B', delay: 3 }`):**
    - `obj`: `['p2_o2', null, 'done']`
    - `comm`: `['HAWK', 'Drone net collapsed! Control, we are detecting heavy engine ignitions near the relay anchor.']`
    - `comm`: `['CONTROL', 'Confirmed, heavy strike detachment moving in. A privateer assault flight is making a run on our engines! Kill them!']`
    - `obj`: `['p2_o3', 'Destroy the heavy strike flight', 'open']`
    - `spawn`: `{ grp: 'C', ships: [['kestrel', 3], ['merlin', 2]], bearing: [0.1, -0.1, -1], dist: 2200, spread: 200 }`
  - **Stage 3 (`when: { dead: 'C', delay: 3 }`):**
    - `obj`: `['p2_o3', null, 'done']`
    - `comm`: `['CONTROL', 'Blockade broken! Hostiles are withdrawing across all vectors. Relay Beta is back in colonial hands. Outstanding work, Eagle Flight.']`
    - `end`: `'win'`
- **Debrief (Win):**
  `The blockade at Relay Beta has been dismantled. Commercial freighters and habitat life-support convoys are moving once again. Intelligence interrogations of captured pilots reveal that the mercenaries were paid in Vanderbilt-Astra bearer bonds—hired to prevent CDF ships from patrolling further rimward.`
- **Debrief (Lose):**
  `The strike failed. The CSS Halberd was destroyed or Eagle Flight eliminated. The blockade remains intact, and the outer colonies remain isolated.`

---

## Mission P3: SIDERITE VEIL (Difficulty 3)

- **Location:** Abandoned Mining Belt Alpha-9 (Look: `ao2`). Dense metallic background, deep space.
- **Purpose:** Ambush survival scenario; teaches evasion under sustained missile threat, target prioritization in chaotic engagements, and protecting an immobilized ally.
- **Player Ship:** `kestrel`. Wing: HAWK + SPARROW in `kestrel`s.
- **Allies:** CSS HALBERD (`anchor`, vital, 128 m escort corvette).
- **Briefing:**
  `Three hours ago, a distress transponder was tripped inside Sector Alpha-9—a cluster of strip-mined nickel-iron asteroids abandoned twenty years ago. The beacon matches a lost colonial survey craft.`

  `The Halberd has dropped out of transit to coordinate rescue. However, ambient iron dust and residual radiation are degrading our sensor suite. If this is a real crew in distress, we recover them; if it is a trap, we break teeth.`

  `Fly tight escort on the Halberd. Keep your countermeasures primed.`
- **Setup:**
  - `anchor`: `{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' }`
  - `player`: `{ pos: [85, 10, 105], speed: 50, ship: 'kestrel' }`
  - `wingmen`:
    - `{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [115, 15, 135] }`
    - `{ pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [55, 5, 135] }`
- **Stages & Objectives (Existing Types Only):**
  - **Stage 0 (`when: { t: 4 }`):**
    - `comm`: `['CONTROL', 'Approaching coordinates. Scanning for survivor beacon... wait. Magnetometer readings spiking across all sectors!']`
    - `comm`: `['HAWK', 'Ambush! Check your scopes! Strike craft dropping out of silent running behind the asteroids!']`
    - `obj`: `['p3_o1', 'Defend the Halberd against the ambushers', 'open']`
    - `spawn`: `{ grp: 'A', ships: [['merlin', 4], ['kestrel', 2]], bearing: [0.3, 0.2, -1], dist: 2200, spread: 260 }`
  - **Stage 1 (`when: { after: 2 }`):**
    - `comm`: `['CONTROL', 'They have deployed ECM chaff! Sensor lock range is halved. Close to visual distance and clear the screen!']`
  - **Stage 2 (`when: { dead: 'A', delay: 2 }`):**
    - `obj`: `['p3_o1', null, 'done']`
    - `comm`: `['SPARROW', 'First wave down! But I am picking up missile locks—radar locks from the dark!']`
    - `comm`: `['CONTROL', 'Second wave inbound! Fast interceptors firing radar-guided Lances. Use chaff and break their attack runs!']`
    - `obj`: `['p3_o2', 'Destroy the missile interceptor wave', 'open']`
    - `spawn`: `{ grp: 'B', ships: [['merlin', 3], ['kestrel', 3]], bearing: [-0.4, -0.1, -1], dist: 2500, spread: 240 }`
  - **Stage 3 (`when: { dead: 'B', delay: 3 }`):**
    - `obj`: `['p3_o2', null, 'done']`
    - `comm`: `['HAWK', 'Targets destroyed! That was a military-grade kill box. Somebody wanted Eagle Flight wiped out before we reached the frontier.']`
    - `comm`: `['CONTROL', 'All hostile signals dark. Halberd jump drives are spooled. Form up on the corvette immediately. We are jumping out of this graveyard.']`
    - `end`: `'win'`
- **Debrief (Win):**
  `Eagle Flight survived the ambush in Sector Alpha-9. Flight logs show the ambushers were flying demilitarized UTDF hulls retrofitted with corporate-grade avionics. They were waiting specifically on CDF patrol frequencies. Somebody in colonial administration leaked the flight plan. We are heading to Lily Relay for re-armament.`
- **Debrief (Lose):**
  `The task group was overwhelmed in Sector Alpha-9. The Halberd was pulverized under concentrated missile salvos, leaving no survivors in the asteroid belt.`

---

## Mission P4: BIO-SIGNATURE ZERO (Difficulty 4)

- **Location:** The Lily Relay Approach, Sector Oasis Fringe (Look: `ao3` or `lilypad`).
- **Purpose:** First contact with the FROGG migratory hive! The sudden transition from human squabbling to alien bio-mechanical horror. High tension, biological weapon reveals, surviving unfamiliar weapons (masers and acid globs).
- **Player Ship:** `kestrel`. Wing: HAWK + SPARROW in `kestrel`s.
- **Allies:** CSS HALBERD (`anchor`, vital, 128 m escort corvette).
- **Briefing:**
  `Halberd has arrived at the outer picket of the Lily Relay. Three automated listening posts on the perimeter went silent thirty minutes ago without sending distress packets.`

  `Long-range passive arrays are reporting anomalies never seen in human space: biological thermal blooms, hull geometries that show no seams or welds, and radio signals that sound like cellular pulse chatter rather than digital encryption.`

  `Eagle Flight is on point. Maintain extreme vigilance. If you encounter non-human craft, do not attempt comms: gather telemetry, protect the Halberd, and survive.`
- **Setup:**
  - `anchor`: `{ ship: 'halberd', id: 'halberd', callsign: 'CSS HALBERD', pos: [0, 0, 0], vital: true, ai: 'capital' }`
  - `player`: `{ pos: [90, 15, 110], speed: 60, ship: 'kestrel' }`
  - `wingmen`:
    - `{ pilot: 'hawk', ship: 'kestrel', callsign: 'HAWK', pos: [120, 20, 140] }`
    - `{ pilot: 'sparrow', ship: 'kestrel', callsign: 'SPARROW', pos: [60, 10, 140] }`
- **Stages & Objectives (Existing Types Only):**
  - **Stage 0 (`when: { t: 4 }`):**
    - `comm`: `['CONTROL', 'Eagle Flight, we are at the buoy coordinates. The listening post is... shredded. The hull is coated in some kind of corrosive organic compound.']`
    - `comm`: `['SPARROW', 'Control! On the radar! Multiple contacts dropping out of cold drift! They are not on any fleet IFF!']`
    - `comm`: `['HAWK', 'Mother of God... what are those things?! Those aren't human ships!']`
    - `obj`: `['p4_o1', 'Engage the unknown alien interceptors', 'open']`
    - `spawn`: `{ grp: 'A', ships: [['darter', 4], ['leaper', 2]], bearing: [0.1, 0.05, -1], dist: 2400, spread: 220 }`
  - **Stage 1 (`when: { after: 3 }`):**
    - `comm`: `['SPARROW', 'They are fast! Impossibly fast! They are firing blue beams—shield integrity dropping!']`
    - `comm`: `['HAWK', 'Keep your nerve, Tomás! Use your mass drivers—lead the targets! They bleed when you hit them!']`
  - **Stage 2 (`when: { dead: 'A', delay: 3 }`):**
    - `obj`: `['p4_o1', null, 'done']`
    - `comm`: `['CONTROL', 'First wave neutralized! But more are emerging from the deep cluster—heavy bio-signatures closing fast! Torpedo bombers and an acid gunship!']`
    - `obj`: `['p4_o2', 'Stop the alien bombers before they reach the Halberd', 'open']`
    - `spawn`: `{ grp: 'B', ships: [['toad', 2], ['spitter', 1], ['darter', 2]], bearing: [-0.3, 0.1, -1], dist: 2700, spread: 240 }`
  - **Stage 3 (`when: { dead: 'B', delay: 3 }`):**
    - `obj`: `['p4_o2', null, 'done']`
    - `comm`: `['HAWK', 'Bombers destroyed! Control, are there any more of them?!']`
    - `comm`: `['CONTROL', 'Negative on immediate contacts, but long-range listening arrays are screaming. The entire Lily corridor is lighting up with bio-transits. This wasn't a patrol... this is the vanguard of an armada!']`
    - `comm`: `['CONTROL', 'All CDF flights, fall back to the Lily Relay immediately. Code Red. We are under invasion!']`
    - `end`: `'win'`
- **Debrief (Win):**
  `First contact confirmed: the invaders are an extraterrestrial bio-mechanical species, designated 'FROGG' by colonial intelligence due to their amphibious hull morphologies and organic thrust sacs. Their craft do not use radio or human jump coordinates; they communicate through bio-neural resonance. The Halberd is falling back to Lily Relay to mount a desperate defense of the evacuation convoys (leading directly into OPERATION LILYPAD).`
- **Debrief (Lose):**
  `First contact was catastrophic. Eagle Flight and the CSS Halberd were destroyed by the vanguard of the unknown swarm before any telemetry could be transmitted. The colonies will face the invasion blind.`

---

## Technical Notes & [NEEDS CODE] Tags

1. **`[NEEDS CODE]` Enemy Human Faction Skin / IFF:** In Missions P1-P3, the enemies are human ships (`merlin`, `kestrel`, `tern`, `drone`). Currently, human ships default to the player faction in certain auto-targeting filters unless assigned to an enemy group in `spawn`. The mission interpreter correctly handles hostile targeting via `grp`, but visual distinction (e.g. pirate / mercenary hull camo or red sensor box) would improve readability.
2. **`[NEEDS CODE]` Cargo Shuttle Boarding / Disable Mechanic:** In Mission P1, the objective is to destroy the rogue `tern`. If a subsystem targeting disable mechanic (e.g. destroy engines only without destroying the ship) is implemented in M5/M6, P1 can be upgraded from "destroy" to "disable engines and capture".
3. **`[NEEDS CODE]` Campaign Progression Chaining:** To link Prologue (P1–P4) into the main Campaign (M1–M5), the menu / campaign loader in `src/75_mission.js` / `src/76_menu.js` will need a campaign selector or sequential flow (`gs_campaign=prologue`).
4. **`[VERIFIED]` All Objectives Supported:** Every objective in P1–P4 uses only existing engine constructs (`spawn`, `dead`, `after`, `obj`, `comm`, `end: 'win'`). Zero new interpreter syntax required.

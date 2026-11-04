# Campaign spine, mission variety and story: design draft v0.1

Status: **v0.2, 2026-11-04: owner decisions of the same day are folded in (section 8).** Nothing here is implemented. A second, independent draft is to be
produced by Codex agents (prompt at the end); the two are then reconciled in `docs/DESIGN_CAMPAIGN_RECONCILE.md`.
Owner decisions behind this draft (2026-11-04): (1) the three existing campaign drafts become one spine in the order
*Prologue -> The Long Retreat -> The Severed Node*; (2) this pass is about **scripted** campaigns; a *dynamic theatre* (multi-system, evolving
with player results, logistics calculated, not scripted) comes later and must be possible on the same data model; (3) tone is **serious pulp,
grungy and oppressive**; (4) a **campaign ship roster / database** tracks ships, pilots, munition stores and more; (5) cutscenes use the
approved Direction C comic look (`docs/DESIGN_CUTSCENE_STYLE.md`).

## 1. What the reference games actually do (scan, 2026-11-04)

Sources are web summaries, not the games; treat the details as indicative. Fetched 2026-11-04:
[TIE Fighter](https://en.wikipedia.org/wiki/Star_Wars:_TIE_Fighter), [Wing Commander II](https://en.wikipedia.org/wiki/Wing_Commander_II:_Vengeance_of_the_Kilrathi),
[FreeSpace 2 tactical wiki](https://wiki.hard-light.net/index.php/Tactical), [Star Citizen mission list](https://starcitizen.tools/Mission).

| Game | Mission verbs | Structure | Persistence and consequence |
|---|---|---|---|
| Wing Commander II | patrol, base and cruiser strikes, escort, **rescue of ejected pilots**, intercept a dead drop, lone attacks | branching tree with a winning and a losing path; the game continues after failed objectives while the pilot lives | **correction to my earlier claim:** in normal play wingmen do not die; a lost fighter makes them eject; they die in scripted scenes. Story outcomes carry forward |
| TIE Fighter | dogfight, escort, **inspect cargo**, **disable and capture**, attack capital ships and stations, subsystem targeting | 13 tours of 4-8 missions; **primary, secondary and secret goals**, the latter two from a second briefing and giving medals; mission counts as won if primaries are met even if you die; animated briefing map | promotions from primaries, medals from secondary/secret goals; tech unlocks; concourse hub (sim, replays, tech room) |
| FreeSpace 2 | guard an escort target, assault capital ships with bombers, **stealth** (do not fire, avoid patrols), subsystem sniping (beams first), wing orders | scripted events with arrival and departure waves; wings Alpha/Beta/Delta/Epsilon; monitor list | strong briefing/debrief; campaign branches in the retail game (not verified from the fetched page) |
| Star Citizen (contracts) | bounty, delivery, hauling, **investigation**, **search**, **rescue beacons**, **salvage**, mercenary/escort, ECN emergency response | contract board, not a story | economy and reputation, no authored arc |

What we already have: escort and defend (anchor), convoy with individual ship tracking (Retreat R1/R4), evacuation capacity (R3), SAR with
capsules, subsystem targeting, capital launchers and drones, a roster with KIA/MIA/captured, ejection outcomes with cutscenes.

**Verbs we do not have and the genre treats as staples** (ordered by my estimate of value per effort):
1. **Secondary and secret goals** (TIE). Cheap: objective flags plus debrief and medals. Rewards play style without new simulation.
2. **Inspect / scan** a ship or object (TIE cargo inspection, Star Citizen investigation). Needs a "hold within X m for Y s, no fire" objective and a hidden cargo result.
3. **Disable and capture** (TIE). Needs a *disabled* ship state (engines and weapons down, hull intact, crew surrenders) and a boarding/tow outcome. High value, also supports captured-pilot and prisoner story beats.
4. **Subsystem strike** (FS2 bombing run): destroy one named component on a capital ship (reactor, comms mast, hangar door) and leave. Components already exist; the missing piece is scripted objective hooks and a good bomber approach.
5. **Stealth / emission control** (FS2): be unseen until a trigger. Needs a detection model (range, emissions, firing breaks cover). Medium effort, large variety gain.
6. **Salvage / recover** (Star Citizen, SAR): recover a wreck's black box or cargo pod, tow or pick up. Reuses the capsule pickup code.
7. **Courier / dead-drop intercept** (WC2): catch a fast target before it leaves, or deliver something before a deadline.
8. **Station or ground-adjacent defence**: hold a Hollow's docking axis against waves with limited ordnance (the tender and launcher systems are the interesting part).
9. **Boarding / prisoner transfer**: a cutscene and state change, not a minigame.

Assumptions to contest: more verbs do not by themselves make a campaign good. TIE's strength was *briefing context* (why this target, what the
secondary goal reveals), and WC2's was *people you lose*. The verb list is necessary, not sufficient.

## 2. Campaign spine

Acts follow the owner's order. Existing missions are kept; new missions are proposals (marked **NEW**) chosen so each act introduces a verb
the player has not used yet. Difficulty and balance remain owner/hand-play matters.

| Act | Campaign | Tone beat | Existing | New proposals (verb) |
|---|---|---|---|---|
| I | Uncharted Vanguard (prologue) | customs and corporate friction, unease | P1 Contraband Sun, P2 Chokepoint (blockade), P3 Siderite Veil (ambush), P4 Bio-Signature Zero (first contact) | **Rework P1** into a real inspection (verb 2); secondary goal: do not fire first. Secret goal in P3: recover the survey buoy. No new missions |
| II | The Long Retreat | loss, evacuation, civilians | R1 Last Freight Out, R2 Ghost Relay, R3 Hollow Nine, R4 No Safe Vector | **NEW R2b** Salvage: recover a black box from a wreck under harassment (verb 6). Hollow-axis defence (verb 8) becomes an optional segment of R3 instead of its own mission |
| III | The Severed Node | counter-attack, cost | m01 Lilypad, m02 Reedbed, m03 Severed Node, m04 Short Leash, m05 The Spine | **NEW m02b** Disable and capture a FROGG scout cutter for the intel officer (verb 3, prisoner thread). **NEW m04b** Subsystem strike on a FROGG tug/relay before m04 (verb 4). Stealth approach as an optional opening of m05 (verb 5) |

Notes:
- **Target: 16 missions** (owner: 14-16 are enough): 13 existing plus three new (R2b, m02b, m04b). If hand-play shows m01/m02 duplicate the prologue, merge them and land at 14-15. Stealth (verb 5) stays an optional opener of m05, not a mission.
- Every mission is **multi-area** (see section 10): the player travels to nav points; nothing just spawns on top of a stationary player.
- Every mission gets **primary, secondary (and one secret)** goals, a briefing that explains the *reason* for the secondary goal, and a debrief that changes with the outcome.
- **Fail forward** (WC2/TIE): failing a mission does not end the campaign, it changes the next briefing and the fleet state; losing the player ends the sortie, not the campaign (ejection outcomes: recovered, captured, missing).
- **Branch graph, minimal:** each mission has three outcomes (success, partial, failure) that choose the next *briefing variant* and set flags; only a few missions have a different next mission. Game over only when the carrier is lost or the roster has no flyable pilot.

## 3. Campaign state and the fleet database

The state must be one persistent, versioned object so that later a dynamic theatre can drive the same structures. Proposed tables
(JSON in the existing campaign save, try/catch localStorage; a reset button; schema in `data/db.json` or a sibling `data/campaign_*.json`):

- **fleet.ships**: id, class/type, name, hull and structure %, subsystem damage, armour state, ordnance stores (per weapon id, matches launcher stores), drone stock, hangar manifest, location (carrier id / in transit / lost), repairs pending (days or missions), flags (vital, flagship).
- **fleet.carriers**: capital ships and what they host (hangar slots, tender capacity, supply points). A fixed pilot pool per carrier (roster decision already made).
- **roster.pilots**: existing roster (rank, skill, kills, missions, medals, status ACTIVE / RECOVERING / KIA / MIA / CAPTURED) plus assignment (carrier, wing, fighter id) and a short *personal log* line list that the story can read.
- **stores**: supply points, spare fighters, ordnance reserves; resupply is scripted for now (briefing line plus a numeric grant per mission) but stored as numbers so that a later logistics model computes them.
- **world**: flags set by missions (which relay is alive, which colony evacuated, prisoner held, tug logs recovered), population evacuated, reputation with factions (CDF command, VAC liaison), intel level.
- **history**: per mission: outcome, goals met, losses, time, so debriefs and an epilogue can quote it.

Rules proposed (to decide):
1. **No repair of everything.** Hull damage is repaired between missions at a supply cost; destroyed ships are gone; spare fighters are finite (a carrier launches with a fixed number). Drones: damage and ammunition persist (already the case for recovered drones).
2. **Ordnance is a campaign resource**: a mission starts with the carrier's stock; expended missiles reduce the stock; scripted resupply events refill. This gives the launchers and tenders a purpose.
3. **Pilots are not fungible**: lost pilots are replaced only by scripted arrivals; replacements have lower skill (rank progression already improves skill).
4. **Dynamic later**: the same tables, with supply computed from nodes, losses from theatre combat (auto-resolved), and missions generated from flags. Out of scope now; the schema must not block it.

## 4. Tone and themes (serious pulp, grungy and oppressive)

- The CDF is the *poorer* defence arm (lore). Ships are patched, ordnance is rationed, replacement pilots are fewer than losses, command lies by omission.
- The Oasis-9 secret (VAC strip-mined a dormant Bio-Anchor nursery, severing the migration) stays offstage for most of the campaign: players learn it through
  documents, an intel officer and a captured FROGG, not through exposition. Politics stays offstage; the cost is on the flight deck.
- Humans are not clean: VAC has a liaison aboard whose interests diverge from the fleet's; command sacrifices a convoy to save the carrier; the retreat is an act of triage.
- FROGGs are not cartoon monsters: stockier, bulkier, alien; the interrogation scene is a chance to show they act on a doctrine, not mindlessly.
- Writing rule: short, terse, flight-deck voice; no heroics without cost; one human moment per mission, usually in the debrief.

## 5. Cast (proposal; names are invented, adjust freely)

Existing: **Lt. Tom Cat "MEOW"** (player), **Lt. Maya Okafor "HAWK"** (flight lead), **Ens. Tomás Vidal "SPARROW"** (rookie), **Cdr. Sarah Vance** (CSS Halberd CIC).
These need roster-aware callsigns because pilots can die; the *characters* below are authored and should have scripted fates independent of the dice.

| Role | Name (proposal) | What they are for | Fate options (scripted, can vary by flags) |
|---|---|---|---|
| Player pilot | MEOW | silent-ish point of view, customisable | survives, captured, or becomes unavailable (campaign ends in epilogue) |
| Flight lead | HAWK | veteran, bitter, protective; the person the player measures against | dies in Act III or is captured and recovered by the player (SAR payoff) |
| Rookie wingman | SPARROW | arc from panic to competence; the first loss the player feels | killed in Act I or II (scripted), or promoted |
| Halberd captain | Cdr. Vance | the voice of command and its compromises | survives; relieved after the Retreat if the convoy is lost |
| Carrier captain (Exeter) | Capt. Ilse Brandt-Okoro | the flagship, brings logistics and the jump platform | dies in m04 or the Spine if the Exeter is lost |
| Intel officer | Maj. Danil Reyes | briefings, secondary goals, the secret behind the Oasis-9 telemetry | exposes the VAC liaison or is silenced |
| Corporate liaison | Mr. Aurel Kessler (VAC) | pressure from the corporate side; hides the secret | ally of convenience, then betrayal or redemption |
| Deck chief / logistics | Chief Imani Thorne | the voice of numbers: ordnance, spares; makes scarcity felt | stays throughout; her stock reports reflect the fleet DB |
| SAR pilot | Lt. Cass Moreno | the rescue transport pilot; payoff of the SAR system | rescues the player once, or is lost |
| FROGG | The Reeve (name given by humans) | the interrogated captive; the alien's doctrine | revealed during m02b capture arc |

Rule: every principal has an introduced mission, an arc beat in each act, and a **fate switch** read from campaign flags, so the story reacts to what the player did. No existing character is changed without owner approval; the names above are placeholders.

## 6. Narrative delivery

- **Per mission:** briefing (map, objectives, reason for the secondary goal), debrief (variants by outcome, a medal line, a roster change line), optional one **comic cutscene** (Direction C) at story beats only.
- **Cutscene budget:** about 8-12 authored scenes for the whole campaign, each 4-8 panels reusing the JSON shot-list player (`assets/scenes/`). Each needs character continuity sheets before production; the FROGG commander and the queen/egg-sac concept are not approved.
- **In-flight comms:** the existing comms system, with roster-resolved callsigns and fate-aware lines.
- **Hub:** a minimal "ready room" between missions: the roster, the fleet DB summary, service records and the debrief log. TIE's concourse is a model; we need a screen, not a world.
- **Epilogue** (end of Act III): reads `history` and `world` flags: who lived, what was lost, what was evacuated. Short, in the grim register.

## 7. Work breakdown and ownership

1. **Design (me, now):** this document; mission cards for the 7 new missions; the finalised cast and arc table; a flag list. Owner reviews.
2. **Data model (Codex):** the campaign state and fleet DB, schema and validation, save/load/migration, flag-off behaviour, tests (the roster work is the template).
3. **Mission mechanics (Codex, one verb per prompt):** secondary/secret goals and medals; inspect/scan; salvage; subsystem-strike objective hooks; disabled-ship state and capture; stealth/detection. Each with seeded browser tests and a negative control.
4. **Mission content (Codex, after mechanics):** scripted missions from cards; measure with `campaign_measure.py` bots; hand-play balance is the owner's.
5. **Narrative (mixed):** briefings and debriefs drafted by me, reviewed by the owner, optionally cross-drafted by Codex; cutscene storyboards by Codex agents in Direction C.
6. **Hub and epilogue screens (Codex).**

## 8. Owner decisions (2026-11-04) and what is still open

Decided:
1. **14-16 missions**, not 20 (section 2).
2. **Deaths:** two or three core characters die **by script**; the other named characters are named but **can die through play** (a mission event, an ejection outcome, a lost ship). Roster pilots keep the dice-weighted outcomes. Author the fate switches accordingly (section 5).
3. **Mission failure** (my recommendation, pending answer): fail-forward almost everywhere; only a few campaign-ending conditions (flagship lost in the finale, no flyable pilot); a single mission can always be restarted.
4. **Politics in the fleet:** the VAC liaison and the command-versus-liaison conflict are in; missions should be shaped by it (secondary goals that command and the liaison want differently, orders the player can follow or bend).
5. **Medals and ranks:** both the roster ladder and campaign-specific decorations; Codex produces the visuals (ribbons, medal art, ceremony and service-record screens) in Direction C.
6. **Briefing windows and ship interiors**, not an immediate drop into action (section 10).
7. **Travel between areas of operation** like WC2 (section 10).

Still open: the failure model (3), the exact new-mission list once hand-play judges m01/m02, and the first character art sheets.

## 9. Prompt for the independent Codex draft (to cross-check this one)

```
Task: write an independent campaign/story proposal, docs only, branch codex/campaign-proposal. Do NOT read docs/DESIGN_CAMPAIGN_SPINE.md until you have finished
your own first draft; then read it and write a short compare-and-contrast. Inputs: docs/LORE*.md, docs/CAMPAIGN*.md, docs/DESIGN_ROSTER.md, docs/EJECTION_OUTCOMES.md,
docs/DESIGN_CUTSCENE_STYLE.md, src/75_mission.js (mission structure and available objective actions). Tone: serious pulp, grungy, oppressive, Wing Commander II / TIE Fighter
flavoured; no real names or personal data; original characters.
Deliver docs/CAMPAIGN_PROPOSAL_CODEX.md containing: (1) a unified three-act spine (Prologue -> Long Retreat -> Severed Node) with a mission list per act where every
mission has a distinct verb (listing which verbs need new engine mechanics); (2) a cast of at most 10 with arcs and fate switches driven by campaign flags; (3) a
campaign-state/fleet-database schema (ships, pilots, ordnance stores, supply, flags, history) compatible with a later dynamic theatre; (4) per-mission cards: premise,
primary/secondary/secret goals, setup using existing ships and weapons, what is new, branching outcomes; (5) 3 ideas the Claude draft is missing; (6) 3 weaknesses you see in it.
Push, report, do not merge.
```

## 10. Briefing and interiors, and travel between areas (owner decisions)

**Interiors (the ship as a place).** Between missions the player is on a ship, not on a menu: a small set of authored interior scenes in Direction C, navigated by a hub screen
with hotspots, not a free-roam 3D level (cost and tablet performance):
- **Briefing room:** map, objectives, primary/secondary/secret goals, the officer who briefs, the liaison present or absent.
- **Flight deck / hangar:** pilot assignment, fighter and ordnance loadout, the deck chief's stock report, damaged and missing fighters visible by state.
- **Ready room / mess:** roster, service records, memorial wall, one conversation per mission with a character; this is where the grim tone lives.
- **Bridge / CIC window:** command orders, the capital's condition, the jump platform.
- **Quarters / personal log (optional):** player's log, decorations.
Each room is one illustrated panel with state variants (day, damaged, empty seats) rather than animation; one or two animated transitions (launch, return). Visual style, room sheets and the
character continuity set are a Codex proposal task first (owner approves the look, then build), as with the cutscenes.

**Travel (areas of operation).** WC2's rhythm: briefing, launch, **fly to nav points**, events at each, return. Rules proposed:
1. Every mission has two to four areas (nav points) with an **autopilot transit** between them (existing cine transit and `ao2` areas), and something to find or do at each: an empty one is allowed, a pure spawn-on-player one is not.
2. Events are tied to the place, not to a timer on the player: the convoy is at nav 2, the relay at nav 3, the ambush at the jump point.
3. Transit can be **interrupted** (interdiction, distress call, a lost wingman) and the nav map shows what the player knows and does not.
4. A **nav map** screen (briefing and in flight) shows areas, distances and what has been scouted.
5. Return and recovery are part of the sortie: land on the carrier, resolve the roster and store changes, then debrief.

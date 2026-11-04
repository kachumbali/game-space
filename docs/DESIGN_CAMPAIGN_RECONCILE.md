# Campaign design: reconciled plan (Claude draft + Codex draft)

Status: **v1.0 proposal, 2026-11-04, for owner sign-off.** Sources: `docs/DESIGN_CAMPAIGN_SPINE.md` (Claude, v0.2) and `docs/CAMPAIGN_PROPOSAL_CODEX.md` (independent Codex draft, read
against mine only after its own first draft). Where the two disagree, this file states which one wins and why. Nothing here is implemented.

## 1. Owner decisions that are now fixed

1. Spine: **Prologue -> The Long Retreat -> The Severed Node.** Scripted campaign now; the data model must allow a later dynamic theatre (calculated logistics).
2. **15 missions**, each with a distinct verb (inside the owner's 14-16).
3. Tone: serious pulp, grungy, oppressive; politics inside the fleet (command, a corporate liaison, intelligence) shape the missions.
4. **Fail-forward for everything, with a retry button** (owner, 2026-11-04). A failed or partial mission advances the campaign and changes the next briefing and the fleet state;
   the **retry** button restores the exact pre-sortie state (including random seed and reservations) and cannot duplicate awards or cargo. The campaign ends only after the authored
   finale; if the flagship or all pilots are lost, the story continues through the fallback below, with the loss visible.
5. Every sortie: briefing and interior scene, travel across at least two areas, primary + secondary + secret goals, a debrief that varies by outcome.
6. Two or three **core characters die by script**; other named characters can die through play.
7. Medals and ranks (roster) plus campaign decorations; visuals in the approved Direction C.

## 2. Resolved disagreements

| Topic | Claude draft | Codex draft | Decision |
|---|---|---|---|
| Mission count and shape | 13 existing + 3 new, verbs not unique per mission | 15 rewritten missions, one distinct verb each, full cards | **Codex structure (15 verbs).** Existing missions are reused as source material and set pieces where they fit (section 3), not preserved as-is. My draft failed to specify goals and outcomes per mission |
| State model | tables listed, retry unresolved | versioned save, event log, transactional commit, pre-sortie snapshot, reserved ordnance | **Codex model**, plus my carrier/hangar fields and pilot personal-log lines |
| Failure policy | open | fail-forward with fallback (reserve frigate, emergency pilot arrival) | **Codex fallback** + owner's retry button |
| Scripted deaths | conditional switches | two guaranteed deaths on non-sortie roles | **Codex rule**: a scripted death must not depend on the player surviving a sortie, so it sits in a non-flying role or a cutscene beat |
| Character names | kept HAWK, SPARROW, Vance (canon in code and docs) | new IDs (rake, wisp, captain_arden, ...) | **Keep canon names** (MEOW, HAWK, SPARROW, Cdr. Vance) and map Codex roles onto them; Codex's new officers keep their names. Owner may overrule |
| Player identity | a fixed protagonist | roster-selected pilot, identity can change after KIA/capture | **Codex**: the player is a roster pilot; if lost, a successor flies and the log follows the fleet. MEOW stays the default |
| Interiors/hub | five rooms, state variants | scenes show consequences (dented table, stretcher) | merge: my room list, Codex's consequence props |

## 3. The fifteen missions

Verbs and turns are Codex's. The last column is my **proposed reuse of existing scripts as set pieces**, to be verified by reading each mission script before work starts (I have not re-audited them).

| # | Mission (Codex title) | Verb | Existing material to reuse (to verify) |
|---|---|---|---|
| 1 | Paper Hull | inspect | P1 Contraband Sun (intercept) |
| 2 | Blind Corridor | shadow | P2 Chokepoint geometry |
| 3 | First Heat | sample | P4 Bio-Signature Zero (first contact) |
| 4 | Open Gate | escort | R1 Last Freight Out (convoy tracking) |
| 5 | Cold Lantern | recover | SAR missions (capsule recovery) |
| 6 | False Light | decoy | R2 Ghost Relay |
| 7 | The Triage Line | allocate | R3 Hollow Nine (liner capacity) |
| 8 | Ash Ledger | salvage | P3 Siderite Veil (debris field) |
| 9 | Narrow Wake | interdict | R4 No Safe Vector |
| 10 | Broken Cradle | cover | R4 launch waves; **Cdr. Brack dies (scripted)** |
| 11 | Dead Letter | extract | m03 The Severed Node (VAC wreck) |
| 12 | Quiet Mouth | map | m03 relay |
| 13 | Cut the Wire | disable | m04 Short Leash (relay/tug) |
| 14 | The Last Charge | breach | m04 / m05 approach; **Maj. Sorn dies (scripted)** |
| 15 | Severance | strike | m05 The Spine (Bullfrog) |

Not in the spine: m01 Lilypad and m02 Reedbed (they duplicate the prologue's job). They stay available as standalone/practice missions. Prologue P1 to P4 and the existing Retreat R1 to R4 are
reorganised into the sequence above; the audit may change which fits which.

## 4. Cast (merged)

Canon names stay; roles are Codex's.

- **MEOW** (player pilot; roster-selected): successor after KIA/capture, log follows the fleet.
- **HAWK** (veteran wing lead; Codex "rake"): can die, be captured or recovered through play; never scripted.
- **SPARROW** (junior pilot; Codex "wisp"): through play. **Option for the owner:** make SPARROW the third scripted death (mission 6, in a cutscene beat, not in a sortie).
- **Cdr. Sarah Vance** (Halberd; Codex "commander_brack" is a separate role): see below. The Halberd commander dies in 10 as scripted; the owner chooses whether Vance or a new officer (Brack) carries that death.
- **Captain Arden** (Exeter), **Liaison Veyr** (VAC), **Maj. Sorn** (intelligence; scripted death in 14), **Chief Morrow** (deck and stores), **Medic Ilex** (SAR).
- Rule: no dialogue assumes an unavailable pilot is present; lines resolve against the living actor or an attributed log. Assigned non-flying characters can be killed, captured or left missing through an explicit casualty event if their ship is lost; their duties pass to an acting officer.

## 5. Campaign state, ledger and retry

Adopt the Codex schema (versioned save; `fleet.ships`, `fleet.pilots`, `stores`, `supply`, `flags`, append-only `history` events with unique IDs). Additions from the Claude draft: carrier and hangar fields, per-pilot personal log lines.
Rules (all from Codex, accepted):
1. **Ordnance is a resource.** Loaded at launch it is reserved and debited once; unused rounds return only if the ship is recovered; a destroyed ship loses its load. Inventory never below zero; capacity never exceeded; repairs consume parts at debrief.
2. **Mission commit is atomic.** Outcomes, resource deltas, pilot transitions and cursor advance are written exactly once. The pre-sortie snapshot (including the seed) is saved; **retry restores it**.
3. **Fallbacks, not game over:** lost flagship -> a named reserve frigate with reduced stocks; no available pilot -> an emergency arrival (no retroactive medals). The event and the reduced resources stay visible in briefings.
4. **Later dynamic theatre:** a mission is a reducer over events on the same ship/pilot/store/location records; a theatre simulator can emit the same events. No such simulator is claimed.

## 6. Mechanics, in build order

0. **Campaign state, ledger, commit and retry** (foundation; the roster work is the template). Flag-off behaviour identical.
1. **Goals framework**: primary/secondary/secret goals, three outcomes, debrief variants, decorations, `flags`; a small mission-script schema extension.
2. **Hub screens**: briefing room with nav map, flight deck (loadout, stores), ready room (roster, records, memorial), debrief; interiors from `docs/DESIGN_INTERIORS_STYLE.md`.
3. **Nav travel** (owner: real travel, not spawning at a stationary player): named nav points, autopilot transit that can be interrupted, a nav map. Today transit is a cinematic area change with confirmation; this needs a new mode.
4. **Verbs, grouped by reuse across the 15:**
   - scan/hold/data (inspect, sample, map: 3 missions)
   - custody and delivery (recover, extract, salvage: 3 missions)
   - moving routes and withdrawal (escort, interdict, cover: 3 missions)
   - detection and diversion (shadow, decoy: 2 missions)
   - disable state (1), breach/lane clearing (1), carrier-strike deadline (1), allocation choice (1)
5. **Content**: the 15 missions, then measurement with the mission bots; the owner hand-plays for balance.
6. **Cutscenes** (about 8 to 12): after the cast sheets are approved; the FROGG commander and queen concept are not approved.

## 7. Decisions taken on the owner's delegation ("go for whatever you think is good", 2026-11-04)

Open to overrule at any time.
1. **Names:** keep the canon names MEOW, HAWK, SPARROW and Cdr. Vance; add Codex's officers (Arden, Veyr, Sorn, Morrow, Ilex). Codex's IDs rake/wisp/brack are dropped.
2. **Three scripted deaths:** SPARROW (mission 6, a cutscene beat outside a sortie), **Cdr. Vance** (mission 10, aboard the traffic-control lighter; chosen over a new officer because she is established for nine missions, so the loss has weight), and Maj. Sorn (mission 14). Everyone else dies only through play.
3. **m01 Lilypad and m02 Reedbed** stay as standalone practice missions outside the spine.
4. **Act I scripts** for missions 1 to 4 are drafted in `docs/SCRIPTS_ACT1.md` for the owner to edit.

## 8. Codex prompts, in order (each docs-and-code with tests; do not merge)

1. **Campaign state and ledger (item 0):** implement the versioned campaign state, event log, atomic commit, pre-sortie snapshot and retry, behind `tuning.campaign.enabled` (default off), with unit tests, flag-off regression, save migration and a browser test that retries a failed sortie and checks no duplicate awards or cargo.
2. **Goals framework (item 1):** primary/secondary/secret goals, three outcomes, outcome-variant briefings and debriefs, decorations, flags; convert two existing missions as the pilot case.
3. **Nav travel (item 3):** nav points, interruptible autopilot, nav map, with seeded tests and touch layout.
4. Then verb mechanics one group at a time, then hub screens, then content.

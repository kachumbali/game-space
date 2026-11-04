# Campaign proposal: The Long Way Home

Independent first draft against `origin/main` at `88d983d`. Design proposal, not an implementation or balance claim. The 15 sorties form one authored campaign: **Prologue → The Long Retreat → The Severed Node**. Existing campaign scripts are source material, not promises of identical missions. All people below are fictional; the player is a roster identity, not a fixed personal name.

## The spine

Eagle Flight begins as a patrol instrument in a jurisdictional fight. A Vanderbilt-Astra (VAC) liaison demands protection for a sealed shipment; CDF command needs the company's jump data; intelligence suspects the manifest is false. First contact makes the argument immediately lethal. As Hollows empty, command must allocate finite bays and ammunition among military, corporate and civilian claims. The fleet survives by giving up territory, ships and finally certainty about who caused the war. At the Severed Node, evidence implicates a VAC operation at Oasis-9 in severing a dormant FROGG bio-anchor. It explains a possible trigger, not every motive of an intelligent species. The fleet breaks one vanguard's route; it does not win the war.

| # | Act / mission | Distinct player verb | Story turn |
|---|---|---|---|
| 1 | Prologue — Paper Hull | **Inspect** | A corporate manifest and the cargo disagree. |
| 2 | Prologue — Blind Corridor | **Shadow** | A silent courier leads to a missing patrol. |
| 3 | Prologue — First Heat | **Sample** | First contact; hard evidence must reach command. |
| 4 | Prologue — Open Gate | **Escort** | Civilians and corporate personnel compete for the first departure. |
| 5 | Long Retreat — Cold Lantern | **Recover** | Rescue a stranded pilot under pursuit. |
| 6 | Long Retreat — False Light | **Decoy** | Draw a hunter off the evacuation lane. |
| 7 | Long Retreat — The Triage Line | **Allocate** | Choose which damaged transport gets a scarce repair team. |
| 8 | Long Retreat — Ash Ledger | **Salvage** | Recover ammunition before the depot is abandoned. |
| 9 | Long Retreat — Narrow Wake | **Interdict** | Stop a FROGG force reaching a jump corridor. |
| 10 | Long Retreat — Broken Cradle | **Cover** | Protect a docking withdrawal; the escort commander dies. |
| 11 | Severed Node — Dead Letter | **Extract** | Pull the Oasis-9 archive from a VAC wreck. |
| 12 | Severed Node — Quiet Mouth | **Map** | Trace a living relay without destroying the evidence. |
| 13 | Severed Node — Cut the Wire | **Disable** | Degrade the relay so the strike can approach. |
| 14 | Severed Node — The Last Charge | **Breach** | The intelligence officer dies opening the route to the carrier. |
| 15 | Severed Node — Severance | **Strike** | Break the Bullfrog's routing capability, then get home. |

Each sortie has a briefing, at least two operational areas connected by named nav-point travel, and a debrief plus an interior scene. Scenes show physical consequences: a dented ready-room table, ration tallies, a stretcher in the hangar, a sealed intelligence drawer. Command, VAC and intelligence can disagree without a menu of moral absolutes; orders and their material cost are visible. Use the approved Direction C's hard shadows, restrained cyan/rust and readable close framing; captions remain separate, skippable and scalable. The shipboard setting is oppressive serious pulp, not parody. A transit is an authored change of location with radio dialogue and a reason to go there, not a disguised wave timer.

## Cast and fate

Roles are stable IDs, with dialogue resolved against a living actor or an attributed log; no dialogue assumes an unavailable pilot is present. Scripted deaths are confined to non-sortie roles at defined beats so prior gameplay cannot make a promised death impossible. Two deaths are mandatory, never counted as player-caused failures.

| ID / role | Arc and flag-driven fate |
|---|---|
| `player` — Eagle pilot | Roster-selected pilot; identity can change after recovery, capture, MIA or KIA. Log follows the fleet, not an immortal protagonist. If no pilot is available, an explicit emergency roster arrival restores one pilot with no retrospective medals. |
| `rake` — veteran wing lead | Starts suspicious of VAC; becomes protective of refugees. Can die, be captured or recover through normal ejection/SAR. `rake.status` gates lines; substitute the current wing lead. |
| `wisp` — junior wing pilot | Learns to challenge bad orders; can die or be captured through play. If alive and `evidence>=2`, speaks for disclosure in the finale; otherwise an unsigned deck log carries that view. |
| `captain_arden` — Exeter commander | Balances duty and survival. `trust_command` changes whether they admit the cost of their orders; always retains authority. If active, retains command; otherwise an acting captain inherits orders and flags. |
| `commander_brack` — Halberd commander | Argues for keeping the fleet together. **Scripted death in 10** aboard a remote traffic-control lighter during the final cradle release, irrespective of Halberd's earlier condition; command records the death even if the primary objective fails. Not a selectable or destructible flight actor. |
| `liaison_veyr` — VAC liaison | Defends proprietary navigation data, then confronts the archive. `evidence>=2` makes a public admission possible in the epilogue; otherwise they contest the incomplete record. If unavailable, a surviving corporate clerk presents the recorded company position; no simplistic villain switch. |
| `intel_sorn` — intelligence officer | Initially withholds the likely origin of the war to protect sources; **scripted death in 14** operating a one-use remote relay station, on both success and failure. Their sealed deposition remains available if `evidence>=1`. |
| `chief_morrow` — deck and stores chief | Challenges promises with actual inventory. `supply_band` and `repair_choice` change their scenes; if unavailable, an acting chief reads the same stores ledger. |
| `medic_ilex` — SAR officer | Records the difference between missing and dead. Rescue/capture history changes their scenes; if unavailable, an acting medic handles named pilot dispositions. |

Named deployable pilots `rake` and `wisp` use ordinary persistent roster/ejection outcomes. The captain, liaison and chief are assigned to the active frigate; Ilex is assigned to the SAR cutter. Loss of their assigned ship can kill, capture or leave them missing through the same explicit casualty-resolution event; a recovered person enters recovery. Their dialogue and duties transfer to an unnamed acting officer while unavailable. Arden, Veyr, Morrow and Ilex are not guaranteed to survive: their table entries describe the authored spine if alive. Brack and Sorn are protected only until their mandatory scripted beats. Any additional generated roster pilots can die. A captured or missing person is never silently treated as dead or returned; a later authored recovery must explicitly transition the record. Tandem Falchion crew share a pod where applicable. No FROGG pilot ejects; no autonomous FROGG drones.

## Campaign state and fleet database

One versioned save per campaign, with stable IDs and definition references to `data/db.json`, not copied combat stats. Example shape (illustrative units and starting quantities require tuning):

```yaml
version: 1
campaign_id: long_way_home
mission_cursor: p01
world: {system_id: frontier, location_id: corridor_7, time_tick: 0}
fleet:
  ships:
    exeter_01: {class_id: exeter, status: operational, hull_pct: 100, subsystem_damage: {}, location_id: corridor_7, carrier_id: null, capacity: {fighter: 12, corvette: 2}, assigned: [halberd_01]}
    halberd_01: {class_id: halberd, status: operational, hull_pct: 100, subsystem_damage: {}, location_id: corridor_7, carrier_id: exeter_01}
  pilots:
    rake: {roster_id: rake, status: active, assigned_ship_id: null, recovery_missions: 0, kills: 0, sorties: 0, rank: ensign, medals: []}
  stores: {ir: 32, rf: 16, torp: 8, nuke: 0, cannon_rounds: 5000, flare: 40}
  supply: {fuel: 100, parts: 50, medical: 20, evacuees: 0, evac_capacity: 2000}
flags: {evidence: 0, trust_command: 0, repair_choice: none, decoy_success: false, node_status: unknown}
history: [] # append-only event records, described below
```

A ship instance also records individual fitted stations, remaining rounds, embarked pilots/crew, repair queue and destruction/loss reason. Store IDs are weapon IDs; `nuke` is sealed unless an explicit release flag is set. Ordnance loaded at launch is reserved/debited once, unused rounds returned only when recovered; destruction loses the load. Fuel/parts/medical and evacuees use integer abstract supply units/persons; no precision or real-world conversion is implied. Inventory cannot go below zero, capacity cannot be exceeded, and repairs consume parts at debrief. Supply band is derived (adequate/strained/critical), never a second independent counter. Exact rates and starting stores are authoring/tuning decisions, not assertions about balance.

Events carry `{event_id, mission_id, tick, type, subject_id, payload, source}` with a unique ID; examples: `objective_resolved`, `ship_lost`, `pilot_captured`, `cargo_delivered`, `order_given`, `decoration_awarded`. A mission commit atomically writes outcomes, resource deltas, pilot transitions and cursor advancement exactly once. Save the pre-sortie snapshot; retry restores it, including the random seed and reservations, and cannot duplicate awards or cargo. Debrief makes continuing after a failed primary explicit. A player death resolves ejection/SAR first, then a successor flies; if Exeter is destroyed, survivors transfer to an authored reserve Exeter instance with damaged capacity and stores, rather than silently resurrecting the ship. If no active pilot remains, the one emergency arrival above is recorded. Thus every outcome reaches the next authored card, including total anchor loss, without erasing losses. No gameplay loss can remove a scripted-death actor before their scene.

Today the roster and rescue systems already provide pilot statuses, awards, succession and SAR outcomes, subject to their feature flags and limitations in `DESIGN_ROSTER.md` and `EJECTION_OUTCOMES.md`. `75_mission.js` provides `areas`, stage `when` (`t`, `after`, `dead`), `do` actions (`obj`, `comm`, `spawn`, `transit`, `end`) and convoy departure/partial results. Transit currently asks for player confirmation after a stage; it is a cinematic area change, not free navigation. Existing loss normally blocks Next Mission, and anchor destruction ends the sortie. The schema, unified chain, nonterminal losses, branching briefings, persistent resources and most specialized verbs below are **new**. Objective text alone is not evidence of a working mechanic. All new player actions need touch controls, an AI default and help text in the same implementation; no arcade drops, perks or score bonuses in Campaign.

The data boundary is deliberate: a scripted mission selects a location, eligible assets, conditions and a reducer over events; a later dynamic theatre can instead generate operations from the same ship/pilot/store/location records and emit the same events. A future graph of systems, links, travel times, supply production/consumption and enemy movements can calculate logistics from those records; this proposal does not claim that simulator exists. Authored flags are namespaced campaign facts, while generic events and asset states remain usable by either mode. Disconnected routes and inventory transfers must be calculated by that future layer, not faked as globally available stock.

## Verb implementation inventory

All 15 distinct verbs need campaign outcome persistence and briefing branching. Existing pieces are not complete implementations of the proposed verbs:

| Verbs | Existing building blocks | New mechanic or objective hook |
|---|---|---|
| Inspect, sample, map | proximity and mission stages | target/bearing scan, hold, integrity and accumulated data |
| Shadow | area transit | target route, detection and tracking |
| Escort, interdict, cover | convoy spool, combat, subsystem targeting | moving routes, boundary/escape counts and docking/withdrawal completion |
| Recover, extract, salvage | SAR capsule recovery, timed stages | authored target/cargo custody, transfer and delivery persistence |
| Decoy | combat AI | decoy deployment, threat attraction and diversion measure |
| Allocate | briefing and stage actions | mutually exclusive in-sortie choice and assignment |
| Disable | component damage | designated relay state and nonlethal threshold objective |
| Breach | staged combat and transit | spatial lane clearance and deadline |
| Strike | combat and `dead` conditions | carrier departure deadline, extraction and persistent result |

## Mission cards

Reading key: **P** primary, **S** secondary, **?** hidden until discovered or debrief; **W/P/F** are success/partial/failure, each advancing. A primary is success when all its stated criteria hold; partial when the specified salvage condition holds; otherwise failure. Secondary and secret goals do not alter that classification unless stated. All resource changes below are illustrative fixed event deltas, capped by actual availability/capacity. Destroyed assets and pilot outcomes are also persisted separately; subsequent briefing explicitly describes the resulting state. Every setup uses available active pilots and existing class IDs/default compatible mounted weapons; actual loadouts come from the database and available stores, never invented fittings. Hostile counts are starting proposals, not measured balance.

### 1 — Paper Hull / inspect
- **Premise and scene:** VAC liaison Veyr insists a sealed shipment has priority. In the ready room, command orders inspection while intelligence requests a copy.
- **Areas/travel:** launch at Corridor 7 → NAV Manifest, close on a Tern → NAV Customs Wake, intercept its escort.
- **Setup:** Kestrel and available Kestrel wing, Halberd; friendly Tern; hostile human Merlin and Kestrel. Use stock guns and compatible `ir`/`rf` as available.
- **P:** scan Tern inside range for a continuous interval before it leaves. **S:** keep it intact. **?:** scan the second, unlisted container signature.
- **New:** scan target/range/hold and neutral ROE, plus departure. **W:** manifest copied, `evidence+1`; next briefing admits discrepancies. **P:** Tern escapes but container is scanned: `evidence+1`, command calls it incomplete. **F:** neither scan, no evidence; command relies on Veyr's account. S saves the Tern instance; ? adds an archive lead.

### 2 — Blind Corridor / shadow
- **Premise and scene:** intelligence wants a suspect courier followed; the captain warns against provoking a private escort.
- **Areas/travel:** customs wake → NAV Cold Trail → NAV Patrol Graveyard, following a Tern's route, not an instantaneous teleport to the answer.
- **Setup:** Kestrel wing, Halberd; neutral Tern, hostile Merlin escort; stock kinetics and `ir`.
- **P:** remain within tracking range but outside detection radius until courier reaches graveyard. **S:** preserve courier. **?:** locate patrol's distress beacon.
- **New:** detection, pursuit and trail state. **W:** route recorded, `evidence+1`; next briefing identifies the contact lane. **P:** courier detects flight but beacon is found: lane inferred, no evidence increment. **F:** lose both: first-contact briefing warns of uncertain approach. Beacon adds medical supply +1 from the recovered emergency pack if found.

### 3 — First Heat / sample
- **Premise and scene:** a supposedly empty listening post is torn open. A hangar scene shows an unfamiliar burn cut through plating.
- **Areas/travel:** patrol graveyard → NAV Dead Array → NAV Return Screen. Exeter provides the jump platform; corvette and fighters must embark before a system jump.
- **Setup:** Kestrel wing, Exeter and Halberd; Darter/Leaper then Toad; default human guns and `ir`, FROGG stock weapons.
- **P:** record a close sensor sample of a living FROGG craft and return the data with a surviving friendly ship. **S:** keep Halberd operational. **?:** record a second weapon signature.
- **New:** sample and data custody. **W:** `evidence+1`, next briefing shows classified telemetry. **P:** sample recorded but lost with carrier: partial sensor trace gives warning, no evidence increment. **F:** no sample: next briefing uses only visual estimates. Secret signature grants an extra intelligence line, not a damage bonus.

### 4 — Open Gate / escort
- **Premise and scene:** civilians queue alongside VAC staff; command must defend both. Veyr's passenger list becomes a point of contention.
- **Areas/travel:** launch at loading throat → NAV Departure Lane → NAV Rear Screen; the convoy spools at the lane.
- **Setup:** Kestrel wing, Exeter, two existing liners, Halberd; Leaper/Toad attackers, stock weapons.
- **P:** both liners depart; **S:** Halberd survives; **?:** identify and defend a small SAR craft hiding in the rear screen.
- **New:** carry passenger counts into campaign state and support outcome branching; per-ship convoy spool/partial exists. **W:** both depart, `evacuees+400`; next briefing reports orderly clearance. **P:** one departs, `evacuees+200`; next briefing names the loss. **F:** neither departs, no evacuees; next briefing begins with a casualty count. Secret preserves an SAR instance for 5; if lost, 5 uses a replacement with no free resource grant.

### 5 — Cold Lantern / recover
- **Premise and scene:** a pilot from the last flight has a live beacon. Medic Ilex refuses to call a missing pilot dead.
- **Areas/travel:** NAV Beacon Field → NAV Recovery Lane, escorting the cutter back toward Exeter.
- **Setup:** Merlin or available Kestrel, SAR cutter and Exeter; Darter/Spitter; existing default weapons and countermeasures.
- **P:** recover the beacon pilot and return the cutter. **S:** keep cutter intact. **?:** find a second beacon and secure its record, even if the pilot is already dead.
- **New:** authored survivor as persistent rescue target and cutter return/custody; capsule recovery and ejection outcomes exist. **W:** pilot becomes RECOVERING; next briefing includes Ilex's report. **P:** cutter recovers pilot but is lost before return: pilot MIA, beacon confirmed; next briefing reports uncertainty. **F:** no pickup: pilot remains MIA or becomes KIA only on witnessed capsule destruction. Secret adds a history entry, not a guaranteed survivor.

### 6 — False Light / decoy
- **Premise and scene:** intelligence proposes broadcasting Exeter's signature away from a convoy. Veyr objects that the beacon also exposes a VAC supply lane.
- **Areas/travel:** NAV Decoy Drop → NAV Convoy Fork, return to check whether the ruse worked.
- **Setup:** Kestrel wing, Exeter and Tern; Reaver/Darter; default guns and available `ir`.
- **P:** activate a decoy and draw the marked hunter group to it until the Tern clears. **S:** preserve Tern. **?:** record hunter's response before breaking contact.
- **New:** deployable decoy, threat selection and measured diversion. **W:** `decoy_success=true`, Tern delivers `parts+4`; next briefing credits the diversion. **P:** hunter diverted but Tern lost: flag true, no parts; briefing notes the cost. **F:** no diversion, no delivery, flag false; next briefing deploys a heavier screen. Secret adds relay clue to history.

### 7 — The Triage Line / allocate
- **Premise and scene:** chief Morrow has one repair team and two disabled transports. Choose who gets the cradle: medicine or machine parts.
- **Areas/travel:** NAV Damaged Pair → NAV Rendezvous, cover the selected ship's extraction.
- **Setup:** Kestrel wing, Exeter, two Terns; Toad/Leaper; stock guns and `ir`/`rf`.
- **P:** select one Tern and escort it to rendezvous. **S:** keep the unselected hull alive until withdrawal. **?:** inspect both manifests before choosing.
- **New:** accessible mutually exclusive choice, repair assignment and extraction. **W:** chosen delivery `medical+4` or `parts+4`, set `repair_choice`; next briefing identifies what was left. **P:** chosen hull reaches rendezvous but its cargo is damaged: +2 of chosen supply. **F:** chosen hull lost or no selection: +0; next briefing faces the shortage. Secret reveals actual cargo before choice; no hidden penalty for informed selection.

### 8 — Ash Ledger / salvage
- **Premise and scene:** a depot must be scuttled before capture. The chief makes every remaining missile visible on a grease board.
- **Areas/travel:** NAV Depot → NAV Pickup → NAV Escape, escorting a Tern loaded from the depot.
- **Setup:** Kestrel wing, Tern, Halberd; Darter/Spitter and Gulper; existing guns and compatible `ir`.
- **P:** load two crates and deliver the Tern. **S:** prevent depot capture until loading ends. **?:** recover a sealed maintenance ledger from a third crate.
- **New:** crate loading, cargo capacity and delivery; no arcade pickups. **W:** `ir+8` capped by capacity; next briefing shows stock received. **P:** one crate delivered: `ir+4`. **F:** no crate delivered: no stock; next briefing restricts loadouts to remaining stores. Secret increments `evidence` by 1 only if ledger arrives.

### 9 — Narrow Wake / interdict
- **Premise and scene:** a Gulper screen is guiding bombers into a civilian lane. The captain orders a forward interception, accepting risk to the corvette.
- **Areas/travel:** NAV Hunter Screen → NAV Jump Mouth; hostile ships have an explicit route and deadline.
- **Setup:** Falchion with available crew, Kestrel wing, Halberd; Gulper, Toad and Reaver; default compatible guns and `torp` if stocked.
- **P:** stop all marked bombers crossing the jump-mouth boundary. **S:** keep Halberd alive. **?:** destroy the Gulper's sensors before its hull.
- **New:** traversing route and escape counter; subsystem targeting exists but sensor-specific objective tracking needs a hook. **W:** no bomber crosses, `fuel+4` from safe convoy arrival. **P:** one crosses, `fuel+2`. **F:** two or more cross, +0. Next briefing reports the corresponding convoy damage; secret exposes a relay bearing.

### 10 — Broken Cradle / cover
- **Premise and scene:** Halberd cannot clear the cradle without local traffic control. Brack volunteers for the control lighter; its reactor fails after the last release, killing them in the authored scene on every outcome.
- **Areas/travel:** NAV Cradle → NAV Withdrawal Screen, after fighters and corvettes embark on Exeter or an alternate frigate.
- **Setup:** Merlin wing, Exeter, Halberd if available, otherwise a surviving corvette or an empty cradle; Bullfrog and Darter screen. Stock guns and available `ir`.
- **P:** keep Exeter operational until all surviving assigned craft have embarked. **S:** preserve Halberd if present. **?:** cover the SAR cutter through the screen.
- **New:** multi-asset docking completion, withdrawal despite unresolved contacts, authored fixed death. **W:** all surviving assigned craft embark; next briefing announces Brack's death and recovered hull count. **P:** Exeter escapes but at least one assigned craft is left behind; persist those losses. **F:** Exeter lost or no escape; use reserve frigate rule, record abandoned assets. Secret preserves cutter; if absent it is unavailable, not spawned for credit.

### 11 — Dead Letter / extract
- **Premise and scene:** a drifting VAC wreck carries Oasis-9 records. Veyr demands custody; Sorn wants a duplicate.
- **Areas/travel:** NAV Wreck → NAV Relay Exit. A recovery Tern must physically leave with the archive.
- **Setup:** Kestrel wing, Exeter and Tern; Gulper/Reaver; stock guns and `ir`/`rf`.
- **P:** transfer archive to Tern and deliver it. **S:** preserve Tern. **?:** copy the protected chain-of-custody header.
- **New:** timed extraction, data custody and conditional dialogue. **W:** `evidence+2`, next briefing identifies Oasis-9. **P:** transfer started but Tern lost: `evidence+1` from partial transmission, next briefing calls it disputed. **F:** no transfer: +0, next briefing relies on Sorn's other source. Secret preserves provenance and enables an epilogue corroboration line.

### 12 — Quiet Mouth / map
- **Premise and scene:** the archive suggests FROGG route selection follows a biological relay. Destroying it now would blind the fleet to the carrier's position.
- **Areas/travel:** NAV Outer Nodes → NAV Relay Shadow → NAV Return.
- **Setup:** Merlin, Kestrel wing, Exeter; Leaper and Spitter patrols. Default guns, `ir` if stocked.
- **P:** scan three distinct relay bearings without destroying the relay. **S:** return with flight intact. **?:** record an undamaged thermal vent signature.
- **New:** scan points, relay integrity and map accumulation. **W:** all three bearings, `node_status=mapped`; next briefing has a clear strike vector. **P:** two bearings, `node_status=approximate`; next briefing warns of an uncertain approach. **F:** fewer or relay destroyed, `node_status=unknown`; next briefing uses a costly fallback search. Secret supplies a vent clue, not an automatic kill.

### 13 — Cut the Wire / disable
- **Premise and scene:** the carrier's route must be disrupted without destroying the navigation evidence. Sorn argues for a narrow strike; the captain wants certainty.
- **Areas/travel:** NAV Relay Guard → NAV Node → NAV Rally.
- **Setup:** Falchion, Kestrel wing, Exeter; Gulper and Reavers; stock guns and available `torp`.
- **P:** disable the relay's designated emitter while leaving its hull above zero. **S:** preserve Exeter. **?:** scan the disabled emitter before departure.
- **New:** non-ship relay subsystem with disable threshold and persistent status. **W:** `node_status=disabled`, next briefing identifies a brief opening. **P:** relay destroyed: `node_status=destroyed`, opening exists but evidence is lost. **F:** emitter still active: `node_status=active`, next briefing expects extra defenders. Secret adds `evidence+1` only if emitter survives and is scanned.

### 14 — The Last Charge / breach
- **Premise and scene:** Sorn operates a remote one-use traffic relay to open a safe passage. Its overloaded station burns out with Sorn aboard on every branch; their recorded deposition remains.
- **Areas/travel:** NAV Approach → NAV Breach → NAV Carrier Bearing.
- **Setup:** Kestrel wing, Exeter and Halberd if surviving; Gulper and Toads; default guns, available `ir`/`rf`. Active node from 13 adds a fighter group; disabled or destroyed node does not.
- **P:** clear the marked lane and reach carrier bearing before the window closes. **S:** keep Exeter operational. **?:** retrieve Sorn's transmitted deposition before the relay fails.
- **New:** spatial lane clearance, window and persistent deposition. **W:** `parts+2` from an undamaged support cache; finale briefing has a clean approach. **P:** reach bearing after window with Exeter alive: no parts; finale reports lost surprise. **F:** fail to reach bearing or lose Exeter: reserve frigate rule, finale uses emergency coordinates and reduced stores. Sorn dies in all cases; secret records the deposition if `evidence>=1`.

### 15 — Severance / strike
- **Premise and scene:** attack the Bullfrog routing the vanguard. The captain will not promise it ends the invasion; Veyr and surviving pilots confront what the evidence can actually prove.
- **Areas/travel:** NAV Outer Screen → NAV Carrier Anchorage → NAV Extraction. The fleet carries fighters/corvettes aboard before its jump.
- **Setup:** Falchion or Kestrel, available wing, Exeter or recorded reserve, surviving escorts; Bullfrog, Gulper, Reaver and Toad; stock compatible guns, `torp` and remaining missiles. No unearned nuclear weapon.
- **P:** destroy the Bullfrog before it exits and extract at least one friendly ship. **S:** preserve the active frigate. **?:** transmit the recovered archive with its provenance before departure, if obtained.
- **New:** carrier departure deadline, exit and final outcome reducer; Bullfrog itself exists. **W:** carrier destroyed and a ship extracts: `vanguard=broken`. **P:** carrier survives but a ship extracts: `vanguard=delayed`. **F:** no friendly ship extracts: `vanguard=through`; the reserve's distant log records the outcome. Epilogue differentiates fleet losses, evacuees, evidence and Veyr's response; no branch declares the whole war won.

## Decorations and progression

Keep roster rank and ordinary medals tied to its existing configured service criteria, not mission score; awards must remain unique and survive pilot succession. Add campaign decorations by stable ID: **Lantern** for a confirmed pilot recovery (5 or a qualifying rescue event), **Hollow Service** for at least one liner departure in 4, **Witness** for an archived provenance record, and **Retreat Star** for completing the campaign regardless of final result. Award only to eligible participating surviving or posthumous pilot records as explicitly defined in the implementation; record the citation and event ID. Secondary/secret goals can supply evidence for a citation but are never required to continue. Promotion and award thresholds require design and playtesting; no balance is claimed.


## Comparison with Claude's spine

Read `DESIGN_CAMPAIGN_SPINE.md` only after completing the independent draft above. Both designs use the same owner-mandated act order, multi-area sorties, scarcity, fleet politics and an eventually shared state model. Claude preserves more of the 13 existing missions and proposes three additions; this proposal rewrites the sequence into 15 individually specified verbs, with a higher implementation cost and a more explicit fallback when a flagship or the available pilot pool is lost. Claude includes a captured FROGG and interrogation, which this draft does not; that is a useful character and production opportunity, subject to lore and humane treatment.

Three ideas absent from the Claude draft:

1. **Transactional sortie ledger:** reserve ammunition at launch, commit event IDs once, and restore the exact pre-sortie state on retry. This makes persistence and later calculated logistics auditable and avoids duplication.
2. **A playable resource allocation:** choose between repairing a medical or parts transport, inspect manifests first, and carry the delivered commodity into the next briefing and inventory.
3. **Named continuity after catastrophic losses:** record a reserve frigate and an emergency pilot arrival rather than resurrecting a destroyed ship or ending the authored story; the event and reduced resources remain visible.

Three weaknesses in that draft:

1. Its mission table identifies additions but does not give each existing mission a distinct verb or complete primary, secondary and secret goals and three consequential outcomes. The intended variety and fail-forward paths cannot yet be evaluated mission by mission.
2. Its cast lists conditional or optional deaths, while the owner's fixed decision requires two or three core scripted deaths and other named characters vulnerable through play. The proposed switches do not yet guarantee that combination, particularly if a character dies before a scripted scene.
3. Its data model states that expenditure and losses persist, but leaves retry, atomic application, capacity, custody and fleet exhaustion unresolved. The suggested carrier-loss or empty-roster game over also leaves a different failure policy from this proposal; the failure model was still explicitly open in the Claude draft.

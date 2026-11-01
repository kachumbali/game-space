# Campaign draft: The Long Retreat

Status: **design-ready, not yet wired into the mission menu.** This is the
missing G3 campaign draft from `docs/GEMINI_WORKPLAN.md`. It follows the
prologue and precedes `docs/CAMPAIGN.md` (*The Severed Node*). Every battle
uses ships already in `data/db.json`; campaign-specific convoy survival,
evacuation capacity, and nuclear release remain explicitly marked as engine
work instead of being implied to exist.

## Arc and player knowledge

The CDF has confirmed that the FROGG vanguard is moving inward, but does not
yet know why. The task group is no longer hunting contacts: it is buying time
for people in Hollows and colony orbitals to leave. Eagle Flight is still MEOW,
HAWK, and SPARROW. The stakes progress from cargo to civilians to the route
itself.

| After mission | What Eagle knows | What remains uncertain |
|---|---|---|
| R1 | The FROGGs choose jump lanes and pursue civilian traffic. | Whether they are raiders or scouts. |
| R2 | Their ships are coordinating around relay signals, not loot. | What the relay network is for. |
| R3 | The vanguard is steering toward Lily and its population lanes. | What is behind the vanguard. |
| R4 | The retreat can delay, not stop, the advance. | Why the migration is in human space. |

## R1: LAST FREIGHT OUT

**Role:** teach escort priorities without claiming a new evacuation system.

- **Location:** outer-belt shipping lane; one area using `reed`.
- **Player:** Kestrel with HAWK and SPARROW; HALBERD is the vital anchor.
- **Civilian fiction:** two TERN resupply shuttles are the last scheduled
  freight out of a Hollow before it becomes an evacuation route.
- **Existing-engine version:** HALBERD remains the mission-loss anchor; TERNs
  are fleet scenery, and the briefing/debrief reports their condition.
- **Better version — [NEEDS CODE]:** mark both TERNs `vital`, give each a jump
  countdown, and make one loss a partial-success debrief rather than a hard
  fail.
- **Waves:** 3 Darter + 2 Leaper pickets; then 2 Toad + 1 Spitter + 2 Leaper
  bombers; finally 1 Gulper + 2 Reaver.
- **Win:** all hostile groups destroyed and the departure window reached.
- **Lose:** HALBERD or MEOW destroyed.
- **Debrief hook:** a freight crew reports that the FROGGs ignored ore and
  targeted the lane beacon itself.

## R2: GHOST RELAY

**Role:** introduce the information war: the enemy is mapping routes.

- **Location:** Bog Relay then a dark relay spur; two existing `transit`
  areas (`ao2`, then `ao3`).
- **Player:** Kestrel flight; HALBERD anchor, EXETER joins as non-vital fleet
  support.
- **Objective flow:** clear a relay picket; hold while EXETER copies a
  navigation burst; transit to the spur; destroy a Gulper screen.
- **Waves:** 4 Leaper + 2 Darter; 2 Toad + 1 Spitter + 2 Darter during the
  hold; 1 Gulper + 2 Reaver + 2 Spitter at the spur.
- **Existing-engine version:** the hold uses an `after` stage and its current
  countdown objective, exactly as `m03` does.
- **Win:** copied burst secured and Gulper screen destroyed.
- **Debrief hook:** the burst is not a destination list; it is a repeating
  route-selection pattern that points toward Lily.

## R3: HOLLOW NINE

**Role:** make the retreat personal: defend an evacuation jump window.

- **Location:** a Sidero-Node exit lane, `ao2` with a later `oasis` transit.
- **Player:** Merlin sortie with HAWK and SPARROW in Merlins; EXETER is vital
  anchor, HALBERD screens it.
- **Civilian fiction:** an evacuation liner programme is loading from Hollow
  Nine under the EXETER's jump envelope.
- **Existing-engine version:** defend EXETER for six minutes against timed
  strike waves. The liner remains a narrated departure rather than a simulated
  ship.
- **Better version — [NEEDS CODE]:** add a Wayfarer/liner hull with a spool
  state, passenger count, and partial-success outcome.
- **Waves:** 4 Darter + 3 Leaper; 2 Toad + 2 Spitter + 2 Reaver; 1 Gulper +
  2 Toad + 3 Reaver as the last jump-in.
- **Win:** EXETER survives the timer; civilian convoy makes its jump.
- **Lose:** EXETER or MEOW destroyed.
- **Debrief hook:** the evacuation is successful but not complete; the CDF
  abandons a habitat that cannot reach the lane in time.

## R4: NO SAFE VECTOR

**Role:** close the arc with a deliberate withdrawal, not a decisive victory.

- **Location:** FROGG outpost lane into a dark anchorage; `ao3` then `oasis`.
- **Player:** Kestrel or Merlin selected by the mission setup; EXETER is vital,
  HALBERD and TALON are fleet escorts.
- **Objective flow:** break a forward screen, escort the task force through a
  transit, survive a Bullfrog's first launch cycle, and withdraw on the
  EXETER's jump window. The Bullfrog is not required to die.
- **Waves:** forward screen of 4 Leaper + 3 Darter + 2 Spitter + 1 Gulper;
  Bullfrog-launched 4 Darter + 3 Reaver + 2 Toad; then 3 Reaver + 3 Spitter.
- **Existing-engine version:** use the current Bullfrog hangar and timed hold;
  end on the timer rather than `dead: 'bullfrog'`.
- **Nuclear branch — [NOT IMPLEMENTED]:** a mission may *describe* a sealed
  NK-1 reserve but must not grant it until the release/arming system in
  `docs/NUKES.md` is built and tested. No scripted “nuke wins the mission”
  shortcut belongs here.
- **Win:** EXETER jumps after the timer with Eagle Flight alive.
- **Lose:** EXETER or MEOW destroyed.
- **Debrief hook:** a distant hive carrier arrives after the task group leaves;
  Eagle has learned to retreat, not yet how to stop the migration.

## Implementation order and acceptance

1. Add a campaign selector/progression state; do not append these missions to
   the existing five-mission list without a clear transition from the prologue.
2. Implement R1 and R2 first using only current `spawn`, `dead`, `after`,
   `transit`, `comm`, and `obj` actions.
3. Add convoy/liner persistence before treating R1 or R3 as real evacuation
   missions; a decorative transport cannot carry an evacuation story alone.
4. Hand-play each mission on desktop and touch layouts. For R3/R4, run the
   seeded mission harness before publishing any win-rate or time-to-kill claim.
5. Only then add a nuclear-release branch to a later mission. The current
   test-bench NK-1 is insufficient for campaign use; see
   `docs/NUCLEAR_IMPLEMENTATION_AUDIT.md`.

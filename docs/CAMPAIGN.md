# Campaign draft: "THE SEVERED NODE" (5 missions)

Status: m01/m02 shipped; **m03-m05 implemented 2026-10-24 on branch `campaign`** (per the "Minimal implementation outline" below: per-ship player loadout, debriefWin/debriefLose in `showDebrief`, live countdown lines for hold objectives, anchor-name lose strings, `bullfrog`/`hivecarrier` in `SCORE`, and the optional `oasis` look). [NEEDS CODE] items 1, 2, 3, 4, 5 are done; items 6-8 are done or covered by `tools/tests/campaign_t.py`. Not hand-played; m05 balance numbers are unverified beyond headless bot runs. Tags: **[NEW]** = invention not stated in lore; **[NEEDS CODE]** = needs an engine change; **[UNTESTED]** = uses a ship/feature that exists in code but has not been flown in a mission script.

Sources used: `docs/LORE.md`, `docs/LORE_HISTORY.md`, `docs/LORE_FACTIONS.md`, `docs/LORE_FROGG.md`, `docs/SHIPS.md`, `src/75_mission.js`, `src/77_cine.js` (areas/transits), `src/41_sky.js` (LOOKS). Owner's Mac `Lore/` folder (15 `gemini-code-*.txt/.md` files) is the raw version of the adopted lore; the adopted `docs/LORE_*.md` files take precedence where they differ (Halberd = 128 m corvette, jump threshold about 450 m).

## Premise

You are Lt. Tom Cat, callsign MEOW, Eagle flight, Colonial Defence Force (CDF), the poorer joint defence arm of the off-world habitats (LORE_FACTIONS section 4). The FROGG migratory hive is in human space; Earth state media calls it an unprovoked locust swarm, while the classified truth is that Vanderbilt-Astra's strip-mining of a dormant Bio-Anchor Nursery at Oasis-9 fifteen years ago severed a neural node and set the Hive Fleet moving (LORE_HISTORY section 2; raw: Lore `gemini-code-1792683162964.md`). Only frigate-class hulls jump, so Eagle flight's fighters and the escort corvettes live or die with their frigate (LORE_HISTORY section 3; LORE section "Rules already set"). Over five sorties a CDF task group follows the Hive's vanguard from the Lily relay to a Bullfrog spine carrier (LORE: Bullfrog 600 m, jump-capable, 36-fighter hangar). The FROGG fighters are neuro-slaved, with no ejection and no rescue (LORE_FROGG section 2); yours are not that expendable, and your wingmen can die for good (CREW persistence in `75_mission.js`).

[NEW] elements: the task-group name "Eagle" is from code, but the Talon, the VAC wreck with Oasis-9 telemetry (M3), the Exeter being the group's jump platform from M3 on, and the Hive vanguard led by a Bullfrog (M5) are inventions. None contradicts the lore. Politics stays mostly offstage: the player never "learns the truth" in a way that changes play.

Player: Lt. Tom Cat, MEOW (`PILOT_DEFS.player`). Wing: HAWK (Lt. Maya Okafor, flight lead, personal hatred of FROGGs, skill 4), SPARROW (Ens. Tomas Vidal, rookie, skill 2). Both persist across missions via `CREW`; if one is KIA or recovering, they do not fly the next sortie (`startMission` skips non-active wingmen), so the wing shrinks. That is the only persistent consequence and it already works.

Difficulty scale: 1 tutorial-ish, 2 sweep, 3 two-area with corvette, 4 defend-the-capital under time pressure on the light ship, 5 finale vs capital ship.

---

## Mission 1: OPERATION LILYPAD (difficulty 1) - REUSE existing `m01`
- Location: Lily relay, look `lilypad`. Single area.
- Purpose: teach guns first, missiles for hard targets, protect the vital escort. Introduces HAWK and SPARROW.
- Player ship: Kestrel. Wing: HAWK + SPARROW, Kestrel.
- Allies: CSS HALBERD (anchor, vital, 128 m corvette).
- Briefing: keep existing text verbatim (src/75_mission.js `m01.briefing`).
- Objectives: o1 destroy the strike wave; **NAV 1 transit** to the starboard screen; o2 stop torpedo bombers; **NAV 2 transit** back to the relay wake; o3 destroy the FROGG corvette. The two short, voiced transits give the player a rearm/check-in beat and move the next fight to a new operational position. Group C remains a jump-in.
- Enemies (existing): A = 3 leaper + 2 darter; B = 2 toad + 1 spitter + 1 leaper; C = 1 gulper + 2 reaver + 2 darter (jump-in).
- Win: group C dead. Lose: Halberd destroyed, or MEOW destroyed.
- Length: about 7-9 min, including roughly 44 seconds of voiced NAV transit.
- Debrief (win): "Lily relay held. The convoy jumped on schedule. Intelligence notes the Gulper was not escorting anything: it was looking for the relay itself. The Hive is moving along this lane." Debrief (lose): "Halberd lost with the convoy still spooling. The relay is gone and so is the lane."

## Mission 2: OPERATION REEDBED (difficulty 2) - REUSE existing `m02`
- Location: NAV 2 Bog Relay (look `ao2`), then NAV 3 FROGG Outpost (look `ao3`), autopilot transit between.
- Purpose: first multi-area sortie; teach subsystem targeting (N) against a Gulper. Introduces CSS TALON as second escort.
- Player ship: Kestrel. Wing: HAWK + SPARROW, Kestrel.
- Allies: CSS HALBERD (anchor, vital), CSS TALON (halberd class, `fleet`, not vital).
- Briefing: keep existing text verbatim (`m02.briefing`).
- Objectives (existing): o0 transit; o1 pickets; o2 torpedo bombers; o3 transit; o4 destroy Gulper.
- Enemies (existing): A = 3 leaper + 2 darter; B = 2 toad + 1 spitter + 2 leaper; C = 1 gulper + 2 reaver + 2 spitter + 2 darter.
- Win: group C dead. Lose: Halberd destroyed, MEOW destroyed. Talon loss is not a failure condition (state this in the debrief if it happens, see implementation outline).
- Length: about 8-10 min. This is the longest existing mission; do not extend it.
- Debrief (win): "Outpost silenced. Salvage crews found no cargo, no feeding pens, no hatchery: only a relay of bio-neural nodes pointed at the dark between systems. The Hive is navigating, not raiding." [NEW] Debrief (lose): "Task Group Eagle broke at Bog Relay. Survivors are recovering to the nearest Hollow."

## Mission 3: THE SEVERED NODE (difficulty 3) - NEW, multi-area
- Location: NAV 2 Bog Relay (`ao2`) then NAV 3 outpost approach (`ao3`), two areas, player-triggered transit (autopilot, same mechanism as `m02`).
- Purpose: introduce the VAC thread in-universe without politics. A Vanderbilt-Astra security tug [NEW] is drifting dead at Bog Relay; its logs carry Oasis-9 telemetry. Eagle must hold the relay while Exeter's techs pull the logs, then escort the data to the outpost jump point.
- Player ship: Kestrel. Wing: HAWK + SPARROW (if active), Kestrel.
- Allies: CSS HALBERD (anchor, vital, 128 m), EXETER (450 m frigate, `fleet`, `hold`, not vital) as jump platform. [NEW] The Exeter joins the task group here.
- Briefing: "Task Group Eagle, now with the frigate EXETER, has a dead Vanderbilt-Astra security tug on the Bog Relay scope. Its transponder is silent but its data core is warm. Exeter's recovery team needs about four minutes at the hulk; the FROGG pickets that stripped the tug have not left. Hold the relay, then escort the Exeter to the outpost jump point, where a Gulper has been reported. Do not fire on the tug. Intelligence will not say what is on its logs. ROE: weapons free on FROGG contacts."
- Objectives (existing types only):
  - o0 autopilot to NAV 2 (existing `transit` action; area `ao2`).
  - o1 destroy the picket wave (group A: spawn, `when.dead`).
  - o2 "Hold the relay while the Exeter recovers the logs" = a timed stage: `{when:{after:240}}`. During those 240 s two further waves spawn on `after` timers (group B at +60 s, group C at +150 s). The stage only advances when time AND the previous group dead (the interpreter checks `t`, `after`, `dead` in one `when`, all must hold).
  - o3 autopilot to NAV 3 (`transit`, area `ao3`).
  - o4 destroy the Gulper and screen (group D).
- Enemies: A = 4 leaper + 2 darter (pickets); B = 2 toad + 1 spitter + 2 darter (bombers target the Talon-less Halberd/Exeter); C = 3 reaver + 2 leaper; D = 1 gulper + 2 reaver + 2 spitter + 3 darter (outpost screen, bearing as `m02` group C).
- Win: group D dead. Lose: Halberd destroyed, MEOW destroyed. Exeter loss: see [NEEDS CODE] item 4; until then Exeter is scenery.
- Length: about 9-10 min.
- Debrief (win): "Logs recovered, 9.4 minutes of telemetry tagged Oasis-9 in VAC corporate format. The Exeter's captain has sealed them. For the record the tug's crew died to FROGG lasers, not to an accident. Eagle flight is not to discuss what was on the core." Debrief (lose): "Relay lost, logs lost. The Hive keeps moving."

## Mission 4: SHORT LEASH (difficulty 4) - NEW, Merlin
- Location: NAV 3 outpost approach (`ao3`) single area, the Exeter dropping out of the Fold for a fixed spool window.
- Purpose: first Merlin sortie; the lore rule that fighters are marooned if the frigate dies (LORE_HISTORY section 3) becomes the stakes. The Exeter is vital. Defend it for a fixed time while its jump drive recycles.
- Player ship: MERLIN (light fighter; code change needed, see [NEEDS CODE] item 1). Wing: HAWK + SPARROW in Merlins (`wingmen[].ship` already accepts `merlin`).
- Allies: EXETER as anchor (`vital: true`, `ai: 'capital'`, 450 m frigate; its 4 LS-2 and 3 PD turrets exist in `src/30_ships_human.js`), CSS HALBERD as `fleet` escort.
- Briefing: "The Exeter has two jump cycles left before Fold stress forces a refit, and the second leaves in six minutes. Until then she sits at the outpost with her drive hot and her screen thin. The Merlin has no armour to speak of and no magazine to waste; use speed and stay inside her point-defence envelope. FROGG strike groups are inbound in three waves. Fighters that stray beyond 1.5 km are on their own. If the Exeter dies, so does the way home."
- Objectives (existing types only):
  - o1 "Defend the Exeter until the drive is ready" = `when:{after:360}` stage with waves A (t+8), B (t+120), C (t+220) as timed spawns, each also gated by previous-group-dead only where convenient. Comm lines from CONTROL give a spoken countdown at 300 s, 180 s, 60 s via `after` stages. A visible on-screen timer would be better, [NEEDS CODE] item 3.
  - o2 "Destroy the remaining raiders" (win requires the last group dead after the timer, or timer expiry with at most 4 hostiles left; simplest: win on timer, with leftovers despawned by the jump).
- Enemies: A = 4 darter + 3 leaper; B = 2 toad + 2 spitter + 2 reaver (torpedo bombers go for the Exeter); C = 3 reaver + 3 spitter + 2 toad + 1 gulper (jump-in at 260 s, `jump:true`).
- Win: timer reaches 360 s with Exeter alive. Lose: Exeter destroyed (anchor), MEOW destroyed.
- Length: 6-7 min.
- Debrief (win): "Exeter cleared the Fold with two squadrons docked: yours and the Halberd's. The Gulper came late, which tells us the Hive reads our jump windows. Merlin flights are staying in the rotation." Debrief (lose): "The Exeter is gone. Everything outside her bay is marooned. Eagle flight's logs end here."

## Mission 5: THE SPINE (difficulty 5, finale) - NEW, multi-area
- Location: area 1 = FROGG outpost lane (`ao3`) fighting through a forward screen; area 2 = [NEW] the Hive vanguard's anchorage. `LOOKS` has only four entries (`lilypad`, `reed`, `ao2`, `ao3`); a dedicated look `oasis` would be nicer ([NEEDS CODE] item 5, optional); fallback is `ao2` (deep space, dense nebula, no planet), which fits "a node in the dark".
- Purpose: destroy the Hive vanguard's Bullfrog spine carrier (600 m, jump-capable, 36-fighter hangar, per `docs/BULLFROG.md`/LORE) before it jumps with the vanguard's seed fleet. End on a larger threat to set up a sequel without needing code.
- Player ship: player's choice is not supported in missions; default Kestrel for the finale ([NEEDS CODE] item 1 would allow Merlin or Kestrel selection). Wing: HAWK + SPARROW (if active) in Kestrels.
- Allies: EXETER (anchor, vital, jump platform), CSS HALBERD and CSS TALON (`fleet`, `hold`). HECLA (1,000 m tender) may appear as `fleet` backdrop only [UNTESTED]; `docs/SHIPS.md` says it has no mission behaviour, so it would be inert scenery.
- Briefing: "The Hive vanguard has stopped. A Bullfrog, a spine carrier six hundred metres long, is bringing its hangar online in the lee of the outpost, and every analyst agrees it is waiting for something to catch up. We cannot meet that something. We can meet the Bullfrog. Exeter will carry the heavy fire, but she cannot approach until the screen is broken. Fight through the outpost lane, jump to the anchorage, strip the Bullfrog's escorts, then kill the spine. This is the whole of the task group's strength. Do not expect a second pass."
- Objectives (existing types only):
  - o0 autopilot to NAV 3 lane (existing `transit`).
  - o1 break the lane screen (group A).
  - o2 autopilot to anchorage (`transit`, area `ao2` or new `oasis`).
  - o3 clear the Bullfrog's fighter wing (groups B1, B2, spawned as the hangar launches).
  - o4 destroy the Bullfrog (group C: `bullfrog` + escorts; win when C is dead).
  - Epilogue (no objective): when C dies, spawn group D = 1 `hivecarrier` with `jump:true` at long range, CONTROL comm, `end: 'win'` after 6 s.
- Enemies: A = 4 leaper + 3 darter + 2 spitter + 1 gulper; B1 = 4 darter + 3 reaver + 2 toad (hangar launch 1); B2 = 3 reaver + 3 spitter + 2 leaper (launch 2, 60 s later); C = 1 bullfrog + 2 gulper; D = 1 hivecarrier (not required for victory). Bullfrog structure 3000, shield 2000/1600 (docs/SHIPS.md): kill is feasible with Exeter's 4 LS-2 plus rails plus your Hammers, but the full battle has not been balance-tested ([UNTESTED]: bullfrog and hivecarrier have never been spawned from a mission script).
- Win: group C dead. Lose: Exeter destroyed, MEOW destroyed.
- Length: about 10 min (two areas).
- Debrief (win): "The spine is broken and the Bullfrog's hangar went with it. Sensors report a second jump flash at 40 km: a hive carrier, two to three kilometres long, with no escort yet. We have taken one node out of a migration, not ended it. Whatever severed the first node at Oasis-9 is still pulling the rest this way." Debrief (lose): "The Bullfrog completed its jump. The vanguard is through. Eagle flight is not coming home."

---

## Existing missions reused or replaced

| Existing | Campaign use | Change |
|---|---|---|
| `m01` OPERATION LILYPAD | Mission 1 as is | Add `debrief` strings (below), reorder not needed |
| `m02` OPERATION REEDBED | Mission 2 as is | Add `debrief` strings; optionally set `grades` per mission |
| (new) m03 to m05 | Missions 3 to 5 | `MISSIONS.push({...})` in `src/75_mission.js` after `m02` |

The "NEXT MISSION" button in `showDebrief` already steps to `MISSIONS[index+1]`, so order in `MISSIONS` is campaign order.

## Minimal implementation outline

All edits are in `src/75_mission.js` unless stated.

1. Player ship selection: `startMission` hardcodes `'kestrel'` in `makeShip('kestrel', 0, ...)`. Change to `su.player.ship || 'kestrel'`, add `ship: 'merlin'` to m04 `setup.player`. `showBriefing`'s loadout text is Kestrel-only; make it per-ship ([NEEDS CODE]).
2. Briefing/debrief text: add optional `debriefWin` and `debriefLose` strings to each mission object and print them in `showDebrief` under the `<h2>`. ([NEEDS CODE], cosmetic.)
3. Timed-hold objective display: the `after` stage condition already gives the delay; a countdown on the objective line would need `objective()` to take a live label. Cheap version: use spoken comms at fixed `after` offsets (no code). Proper version: [NEEDS CODE], an `{timer: seconds, label}` HUD action. Optional.
4. Soft-fail for non-anchor ships: only `game.anchor` can fail a mission. For M3's Exeter being optional that is fine; for M4 and M5, set `setup.anchor.ship = 'exeter'`, which already works since `makeShip(su.anchor.ship, ...)`. The `onShipDestroyed`/lose check says "Halberd is lost" and the debrief shows "Halberd hull": make those strings use `game.anchor.callsign` ([NEEDS CODE], tiny).
5. Optional new look `oasis` in `src/41_sky.js` `LOOKS` (copy `ao2`, change nebula colour). Without it use `ao2`.
6. Scoring: add `bullfrog`, `hivecarrier` to `SCORE` (otherwise default 100 per kill).
7. Add `grades` arrays to m03 to m05 (`m02` pattern) and check that `missionStats` still handles the anchor being the Exeter.
8. Test: run each mission in a headless or manual pass for balance; the Bullfrog fight (M5) and the timed hold (M4) are the two unknowns.

Not needed from code: area transitions (`transit` with `area`), wing persistence (`CREW`), jump-in spawns (`spawn.jump`), `fleet` allies, enemy groups, win/lose via `end`.

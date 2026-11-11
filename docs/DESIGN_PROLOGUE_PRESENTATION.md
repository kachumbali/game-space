# Prologue presentation — owner decision draft

**Status:** proposal, not approved content or an implementation. Scope: the four existing Prologue sorties, one room, text only. The owner selected Direction C's gritty atmosphere, with the owner-selected commander identity ([style decision](DESIGN_CUTSCENE_STYLE.md)). The current runtime mission text in `src/75_mission.js` is authoritative where the older [campaign draft](CAMPAIGN_PROLOGUE.md) differs. The objective text, actual waves, outcomes, flight mechanics and balance remain as they are.

**Marking convention:** every proposed piece of staging, dialogue, scene timing, UI wording, identity or art in a section explicitly marked **[NEW]** is a narrative/presentation invention for approval, including every string inside its JSON block. `[NEW]` is an editorial label and is never displayed to a player. Unmarked factual references are grounded in `docs/LORE*.md`, `docs/CAMPAIGN_PROLOGUE.md`, or the current mission/debrief data. Existing art is not thereby approved as final character canon.

## 1. The ready room [NEW]

**One room:** a cramped combined crew ready room and briefing space on the CSS HALBERD, with one scuffed table, four secured chairs, a dark wall display and a cup held by a magnetic ring. Its hatch, pipework and braced furniture make the space plausible inside the existing 128 m corvette. There is no navigable carrier and no second room. Use Direction C's near-black/olive graphite, hard-edged shadows, a restrained cyan display and a rust-amber practical lamp. Two large portrait positions sit over the same still: Vance on the left as Cdr. Sarah Vance, HALBERD’s commander, and Hawk on the right only when that exact character is available. Keep the portrait faces and the lower caption area clear at the 320 × 200 logical safe frame. Reuse the existing commander and Hawk portraits; Vance’s on-screen identity is established by the owner.

The wall display is a UI layer, not text painted into the background. It has a mission number and three explicit, labelled controls; the room never depends on an invisible hotspot:

| Control | Action and availability |
|---|---|
| **BRIEFING** | Open the currently selected Prologue mission's existing briefing and loadout; if there is no current selection, use the next unfinished mission. Selection/launch availability remains the existing game rule. |
| **ROSTER** | Open the existing roster/service-record view for the selected Prologue mission; return to this same room. If the optional roster is disabled, show the existing legacy CREW statuses read-only. Do not add a crew-management mechanic or invent pilots. |
| **CONTINUE** | Use Job C's next-unfinished-mission selection, including its optional `beforeMission` scene, then the existing briefing. When all four are complete, show **PROLOGUE COMPLETE** and a main-menu action instead of inventing a fifth sortie. |

**Flow compatibility:** Job C's victory debrief → **NEXT MISSION** → next briefing remains a single direct action; the before-scene is presented within briefing step 1 as specified in §6. The room is reached from a clearly labelled **READY ROOM** entry at the main menu and an optional **READY ROOM** action on the debrief; it is not an extra mandatory stop or a replacement for CONTINUE. After a loss, the existing debrief and RETRY remain available. After mission 4's win, retain Job C's ending card, then its main menu. The room can show the last result only while a valid snapshot exists; otherwise it shows the neutral state. Persist no new story flags.

**Desktop:** at 1440 × 900, centre a 16:10 stage with the original art cropped only at the outer 16:9 edges. Place portraits left/right, the three large controls as a vertical stack in the central gap, and a separate opaque caption band under the faces. Mouse, Tab, arrows and Enter reach every action; focus is visible and the order is CONTINUE, BRIEFING, ROSTER, BACK. Use existing UI text, not baked labels. The current scene player's two-line 38-character wrapping is a production constraint, not a promise of responsive text.

**iPad landscape:** at 1180 × 820, preserve the same 16:10 composition and keep faces above the caption band. Use at least 44 × 44 CSS-pixel touch targets with spacing; no hover, drag, or precision tap is required. Tap advances/completes text and a persistent SKIP button returns to the correct briefing/debrief. Do not cover the next-action control with the bottom caption. The room is a proposed DOM/UI layer; fitting it, the roster and long/localised labels needs a real iPad test. Do not silently change the existing flight HUD.

## 2. Scene drafts and state rules [NEW]

**Reading this section:** all dialogue and presentation in every following JSON block is [NEW]. Factual anchors come from the runtime briefing and debrief fields, not from the more elaborate obsolete campaign draft. Each block is a complete valid `scene.json` in the current `id` / `size` / `music` / timed `events` shape; it contains only existing `bg`, `head`, `say`, and `end` actions. The `../shared/` art path denotes a planned shared asset directory. `music: null`; no spoken voice. At 28 characters/second the lines complete before their next event; 29 seconds is the unattended duration, and the existing click-to-advance / SKIP shortens it. Text must also be checked at the actual two-line renderer width, with localised text allowed to reflow.

**Before scenes:** the two heads are Vance and Hawk. The player may not have Hawk assigned or available. The adapter must show Hawk only if the *actual named Hawk* is active and assigned to the coming sortie; otherwise delete the Hawk `head` event, change the Hawk `say` event to `who: "vance"`, and use the exact replacement in the table after the drafts. Do not present the Hawk image as a different pilot. If the roster uses substitutes or the future assignment is not known, use the fallback. Never infer an available slot from `rosterSlotShip(0)` alone: in roster mode that slot can be a different pilot.

**After scenes:** these are an out-of-world debrief record on the same room backdrop, with Cdr. Sarah Vance speaking as HALBERD’s commander. Do not imply she survived a destroyed HALBERD: suppress her portrait and use the neutral text-only debrief fallback whenever the recorded outcome does not establish her availability. The `t=8` line is the neutral fallback; `t=15` is a named-survivor variant and must be adapted before playback. The adapter replaces event text and speaker, not the event schema, with the state-specific lines below. Never put a condition, placeholder, new event type, or unevaluated token in runtime JSON. No outcome text claims a rescue, death, interception or intelligence result beyond the game's own result. A loss leads to RETRY/main menu, not a scene implying the next sortie already happened.

**Character and safety contract [NEW]:** Vance is Cdr. Sarah Vance, not a separate presenter. Hawk (Lt. Maya Okafor) is a dry, disciplined flight lead; Sparrow (Ens. Tomás Vidal) is a nervous rookie who talks to steady himself (`PILOT_DEFS`). The `t=15` Hawk or Sparrow lines below are survivor variants: use the named speaker only if that exact pilot participated and is recorded available after the sortie. Otherwise replace both speaker and text with Vance saying `We will take this one step at a time.` If HALBERD or Vance’s availability is not established, use a text-only debrief line with no attributed living speaker. Sparrow needs only a text label; no new portrait is required. The adapter must never put words in the mouth of a lost, captured, missing or unavailable pilot.

For an actual casualty at `t=8`, Vance uses the actual callsign and outcome in a spoken sentence: `We lost HAWK.` for KIA; `HAWK is still missing.` for MIA; `HAWK was captured.` only for recorded capture; `HAWK is recovering.` only for recorded recovery. For two losses, name both without changing their actual status. If the record is unavailable use `We will account for everyone we can.` Grade and player-death cause remain available to the debrief and may replace the survivor line only when grounded in the actual recorded value. These substitutions are future adapter code, not conditional JSON.

### State-to-line contract [NEW]

| Input / priority | Exact line or operation | Source and constraint |
|---|---|---|
| **t=8 roster**, participating wing slots have KIA/MIA/CAPTURED/RECOVERING | Use `We lost HAWK. SPARROW is still missing.`-style text, with each participating pilot's *actual* callsign and actual status. [NEW] | Legacy: compare pre-sortie `game.crewSnap` against current `CREW`; roster: use the sortie's `S.rosterSelected` / participants and `rosterFind(id).status` after `rosterFinish`. Only claim KIA for KIA; never convert MIA, captured or recovering to death. If two slots have different outcomes, report both when they fit. Abbreviate a long callsign deterministically or use “Wing slot 1/2”; never fabricate a name. |
| **t=8**, no relevant loss or no reliable snapshot | `We will account for everyone we can.` [NEW] | The word “returned” is intentionally avoided: active status or absent evidence alone is not a rescue result. |
| **t=22**, victory | `Grade A. You gave them a chance.` [NEW], substituting the actual S/A/B/C/D from `missionStats().grade` | Resolve while the completed mission and `game.mstate` are still current. This is a result read, not a new award. |
| **t=22**, loss with a real death-cause line | `It appears ` followed by an approved natural-language rendering of `S.playerDeathCause` if it fits; otherwise use a two-line-safe, meaning-preserving approved mapping. [NEW] | It is a *likely* cause, not certainty. The game sets this field only for some Prologue player deaths. Missing field or objective failure must not be labelled pilot death. |
| **t=22**, loss without a cause | `We do not yet know what happened.` [NEW] | No claim that the player survived or died. |

### Ejection and partial-result variants [NEW]

The same `t=8` roster line also reacts to **recorded ejections**; it must not infer an ejection merely from KIA, missing, or a destroyed fighter. When rescue is enabled, `rescueSpawnCapsule` adds the actual capsule record to `game.rescueLog` with `pilot`, `player`, and `outcome`; `rescueResolve` updates that same record. The adapter snapshots the log before the next mission resets it, maps `pilot` to the actual sortie participant or uses the explicit `player` flag, and combines it with the final roster status. In the legacy, rescue-disabled path, use only an `ejected, recovered` note newly appended since the pre-sortie snapshot; older notes are not evidence for this sortie. If the log or comparison is unavailable, retain the neutral roster fallback.

| Evidence in the just-ended sortie | Exact example replacement for `t=8` [NEW] | Boundary |
|---|---|---|
| HAWK capsule record, `outcome === 'recovered'` | `HAWK got out. We recovered her capsule.` | Say recovered only for the actual recovery outcome; recovery does not mean fit for duty. |
| HAWK capsule record, `outcome === 'captured'` | `HAWK got out. The enemy took her capsule.` | Captured is not KIA or recovered. |
| HAWK capsule record, `outcome === 'destroyed'` | `HAWK got out, but her capsule was destroyed.` | Report the capsule outcome; use the separately recorded roster status for a casualty claim. |
| HAWK capsule record, `outcome === 'life support expired'` | `HAWK got out. Her life support ran out.` | Do not change the meaning to rescue or capture. |
| Capsule exists, `adrift`, `missing`, `mission ended before recovery`, or unknown | `HAWK got out. We are still looking.` | If the roster separately resolves an outcome, report only what that final status establishes; the capsule log alone does not establish recovery. |
| Player capsule record | `You got out. We are still looking.` or the matching recovered/captured/destroyed line | Use the record's `player` flag or actual pilot ID, not a fixed MEOW portrait. Ejection is not itself a death cause. |

Replace HAWK with the recorded participating pilot's actual callsign only when identity is known. For two recorded events, combine compactly, e.g. `HAWK is recovered. We lost SPARROW.`; preserve both actual outcomes. If the player plus two wing slots cannot fit within two 38-character lines, put the remaining status in the `t=22` slot and leave the outcome facts in `t=1` and the original debrief. Use `Wing slot 1/2` when an identifier cannot be safely displayed. Never force a named pilot, rescue, cause or casualty from a missing record. These are exact example lines for the adapter, not conditional syntax understood by the current scene player.

**Partial outcomes:** Job C routes `partial` to the `afterMission.lose` hook. A recovered, captured or missing player can yield a partial result; that does not prove the mission's loss-specific facts. For *every* `p01`–`p04` `after_lose` draft when `S.result === 'partial'`, replace `t=1` with `The sortie ended with a partial result.` [NEW]. Keep `t=8` state-aware and use `t=22` for the recorded likely cause when present, otherwise `We do not yet know what happened.` Do not assert the transport escaped, the blockade held, or first contact failed solely because the lose hook was selected. The existing mission debrief remains authoritative.

`missionStats()`, `game.mstate.result` and `playerDeathCause` are existing reads, not state invented by this design. Dynamic interpolation, choosing the actual roster identity, and the previous/current snapshot comparison are **[NEEDS CODE]**: the current scene player has no conditional-event or variable-substitution support. Mapping `vance` to the existing commander portrait file and speaker label needs code; the current player hard-codes `who` labels and suppresses Hawk through the current live slot, which is not a reliable previous/future roster snapshot. Job C's `afterMission` hook runs before its debrief, while `beforeMission` runs before the next mission is constructed; pass an explicit immutable context including the *intended* mission ID, pre/post roster records, the just-ended rescue log, result, grade and nullable cause. Do not read the prior mission's live `game.mission` as the next one. Keep status display to two lines of at most 38 characters each; use text rendering, never HTML. If a snapshot or cause is unavailable, use the neutral fallback above.

Hawk fallback lines for the `t=9` event in each before scene, spoken by Vance when Hawk is not both correctly identified and available:

| Scene | Replacement line [NEW] |
|---|---|
| `p01_before` | `Stay close to the HALBERD.` |
| `p02_before` | `Keep the wing together through the screen.` |
| `p03_before` | `Keep your countermeasures ready.` |
| `p04_before` | `Stay close and keep the telemetry running.` |

### Mission 1 — Contraband Sun

#### `p01_before` [NEW]

```json
{"id": "p01_before", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "vance", "text": "A shuttle bypassed Hollow 14 customs.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "They refused inspection. Stay close.", "cps": 28},
    {"t": 17, "do": "say", "who": "vance", "text": "Protect HALBERD and stop the transport.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p01_after_win` [NEW]

```json
{"id": "p01_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The canisters say Project Nursery / Oasis-9.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "hawk", "text": "That shuttle made us work for it.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "VAC legal has sealed the report.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p01_after_lose` [NEW]

```json
{"id": "p01_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The transport escaped. The trail is lost.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "sparrow", "text": "I thought we had it. I should have been closer.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "Review the sortie before another attempt.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

### Mission 2 — The Chokepoint

#### `p02_before` [NEW]

```json
{"id": "p02_before", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "vance", "text": "Privateers have closed Relay Beta.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "We break the screen; HALBERD draws fire.", "cps": 28},
    {"t": 17, "do": "say", "who": "vance", "text": "The habitats need that supply route open.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p02_after_win` [NEW]

```json
{"id": "p02_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "Relay Beta is open. The traffic records are in.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "sparrow", "text": "The relay is open. They can get supplies through.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "The privateers were paid in VAC bonds.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p02_after_lose` [NEW]

```json
{"id": "p02_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The blockade holds. The habitats are isolated.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "hawk", "text": "We will find another way through that screen.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "Review the sortie before another attempt.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

### Mission 3 — Siderite Veil

#### `p03_before` [NEW]

```json
{"id": "p03_before", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "vance", "text": "A survey beacon is calling from Alpha-9.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "A distress call is not a guarantee of safety.", "cps": 28},
    {"t": 17, "do": "say", "who": "vance", "text": "Stay close. Keep countermeasures ready.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p03_after_win` [NEW]

```json
{"id": "p03_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The attackers knew our patrol frequency.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "hawk", "text": "Someone knew exactly where to put that trap.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "Their hulls carried corporate avionics.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p03_after_lose` [NEW]

```json
{"id": "p03_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The task group was overwhelmed at Alpha-9.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "sparrow", "text": "They knew we would come. How did they know?", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "The route to Lily remains exposed.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

### Mission 4 — Bio-Signature Zero

#### `p04_before` [NEW]

```json
{"id": "p04_before", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "vance", "text": "The Lily listening posts have gone quiet.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "Those contacts do not match our registry.", "cps": 28},
    {"t": 17, "do": "say", "who": "vance", "text": "Protect HALBERD and collect telemetry.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p04_after_win` [NEW]

```json
{"id": "p04_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "The contacts are designated FROGG.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "sparrow", "text": "Those ships were alive, weren’t they?", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "HALBERD falls back to the relay defence.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p04_after_lose` [NEW]

```json
{"id": "p04_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 1, "do": "say", "who": "vance", "text": "First contact failed. The colonies are blind.", "cps": 28},
    {"t": 8, "do": "say", "who": "vance", "text": "We will account for everyone we can.", "cps": 28},
    {"t": 15, "do": "say", "who": "hawk", "text": "We need to get word to Lily. Now.", "cps": 28},
    {"t": 22, "do": "say", "who": "vance", "text": "Review the sortie before another attempt.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

## 3. Opening and ending [NEW]

### A skippable 30-second opening [NEW]

**Purpose:** establish the patrol and the HALBERD in-world. Credit the AI-designed game on the title card, not in character dialogue. Use only existing Vance and Hawk heads; the existing space illustration establishes the scale before the same ready room appears. No voice, no new music cue, and no instruction hidden in narration.

**When:** on the first entry to a fresh Prologue in this page session, including an initial CONTINUE when no Prologue victory is recorded, before `p01_before` and the existing mission briefing; skip continues to briefing step 1, where `p01_before` plays inline when available; the player still reaches steps 2 and 3 and the single LAUNCH button. Offer **WATCH OPENING** from the main menu for replay. Do not interrupt CONTINUE for an already-started Prologue, retries in the same session, `?go`, `?scene=`, or a direct testing URL. A local, presentation-only `gs_prologue_opening_seen` flag can prevent replay across reloads; it is not a story flag or progression mechanic. A prior loss without that flag cannot be distinguished from a fresh player, so the opening may be offered once and remains skippable. Job C currently supplies no opening hook: this scheduling and replay entry are **[NEEDS CODE]**, as decided by the owner. If Hawk is unavailable or not yet assigned, remove her `head` event and change the `t=13` line to Vance; it has the same text. The opening is not a claim that either character is alive after a subsequent loss.

#### `prologue_opening` [NEW]

```json
{"id": "prologue_opening", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../intro_test/painted/bg_space.webp", "fade": 0.6},
    {"t": 0.5, "do": "title", "text": "CLAUDE SPACE COMMANDER", "sub": "PROLOGUE · AN AI-DESIGNED GAME", "dur": 3.5},
    {"t": 4, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 4.2, "do": "head", "id": "vance", "char": "vance", "pos": "left"},
    {"t": 4.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 5, "do": "say", "who": "vance", "text": "HALBERD is on patrol beyond Hollow 14.", "cps": 28},
    {"t": 13, "do": "say", "who": "hawk", "text": "Four patrols. One corvette. Keep it flying.", "cps": 28},
    {"t": 21, "do": "say", "who": "vance", "text": "Keep your wing close. Bring them home.", "cps": 28},
    {"t": 30, "do": "end"}
  ]
}
```

### Ending card [NEW]

After the mission 4 **win** after-scene and debrief, keep Job C’s CONTINUE action and hold the existing ending card. The after-scene precedes the debrief in the merged hook implementation; do not replay it after the debrief. Fade the ready-room image to near-black; display **TO BE CONTINUED**, then **The HALBERD is falling back to Lily.** Use the existing actual session totals (sorties, wins, kills, in-game mission time), followed by **COPY REPORT**, **DOWNLOAD REPORT** if clipboard access fails, and **MAIN MENU**. The report is the actual Job A report with Job C's session-total line when the branches are integrated; no network call. The other campaigns are available and labelled unpolished as Job C specifies. The card is not shown for a loss and does not claim the invasion has ended. This proposes a change to the existing ending-card copy and styling; the counts and report must never be mocked or replaced by fixed text.

## 4. Asset list and generation prompts [NEW]

**Production target:** four required visible image files in total: one new painted background and three existing painted images reused. This is **1 new image and 4 required images total**, below the 12-image cap; no new speaking head is required. The already-shipped legacy head layers are optional fallbacks, not additional must-have artwork. The Vance and Hawk cards are 768 × 768, not the 4:5 masters proposed for new portraits in `CUTSCENE_ART_PROMPTS.md`. They are reused provisionally, not treated as final owner-approved likenesses. No image is generated by this design job. Do not count UI text, rules or the existing many-file 64 px head layers as new generated images. The owner can reject any reuse.

The prompt pack's older A/B selection predates the owner's Direction C decision. Use this **[STYLE C]** replacement block, then paste the item-specific prompt after it. It follows the prompt pack's no-text, original-work and reference-image workflow while taking its palette and hard shadows from the chosen direction:

```text
Original hard military science-fiction game cutscene, gritty realistic illustrated comic, believable practical engineering and proportions, strong silhouettes, hard black inked shadows, low-key lighting, limited olive-black and graphite palette with restrained cyan coolant and rust-orange heat accents, three main values and one restrained accent, a single readable composition at a 320 by 200 logical scale, no text, lettering, logos, insignia, watermark, signature, real people, or existing franchise characters or designs, not photorealistic, not chibi.
```

Negative prompt where supported: `letters, captions, watermark, signature, logos, duplicated faces, malformed hands, extra limbs, anime, chibi, fantasy armour, excessive lens flare, tiny unreadable detail`.

### Must have for the demo [NEW]

| # | Deliverable | Master / runtime | Prompt after [STYLE C] and production notes |
|---|---|---|---|
| 1 | `art/bg_ready_room.png` → `assets/scenes/shared/bg_ready_room.webp` | **1920 × 1080 PNG** master; **1280 × 720 WebP** runtime, target 100–150 KB after review | `An empty compact crew ready room inside a small military escort corvette, eye-level view, one scuffed secured table, four restrained chairs, a dark wall display, one pressure hatch, visible structural ribs and a cup held in a magnetic ring. Hard overhead shadow, a restrained amber practical lamp and faint cyan screen glow. No people. Keep the central 90 percent of the image readable as a 16:10 crop, with broad calm dark space for two portrait cards and a separate caption overlay; no labels or writing.` One fixed composition for hub and all scenes; no separate debrief room. The cup, layout and placement are [NEW], not lore. |

For production, generate the one master, review it against the game's 320 × 200 safe area and on an iPad, then downscale/compress; do not upscale or edit the runtime file by hand. Treat the size and byte budget as targets, not measured facts. The three-step briefing in §6 uses this same room and Vance card; its schematic map, arrows, labels and captions are drawn UI/vector primitives, not additional image assets. The current scene player preloads per-scene head layers and a UI frame even when painted cards exist; the shared-loader work in §5 must skip or gracefully handle those optional fetches, so the four-file must-have budget is achievable. Preserve the square portrait aspect ratio with a deliberate crop or letterbox rather than the current renderer’s 96 × 128 stretch.

### Reused, no new image generation [NEW]

| Existing file | Actual size | Use / limitation |
|---|---:|---|
| `assets/scenes/intro_test/painted/bg_space.webp` | 1280 × 720; 88,404 bytes | Opening establishing image, treated as an illustrative fleet view rather than an exact model of the HALBERD or Kestrel; use a plain dark title card if the owner rejects that mismatch. Existing original art's provenance and prompted purpose are in `docs/ART_CREDITS.md`; its full generation prompt was not recorded there and is not invented here. |
| `assets/scenes/intro_test/painted/imani.webp` | 768 × 768; 60,162 bytes | Commander portrait reused as Cdr. Sarah Vance; the legacy filename is an asset path only. |
| `assets/scenes/intro_test/painted/hawk.webp` | 768 × 768; 79,322 bytes | Hawk portrait only when that named pilot is available. Existing image has no expression animation. |
| `assets/scenes/intro_test/heads/{imani,hawk,meow}/*.png` and `head.json` | 64 × 64 per layer; metadata per head | Existing low-resolution eyes/mouth fallback if a painted card is unavailable. Meow is not required to speak in these drafts; never substitute this portrait for an unidentified player. |
| `assets/scenes/intro_test/painted/bg_briefing.webp` | 1280 × 720; 165,052 bytes | Temporary test stand-in for the ready-room image only; remove the stand-in reference when the new one is approved. It is not a second demo location. |
| `assets/scenes/intro_test/ui_frame.png` | 320 × 200; 432 bytes | Legacy asset already preloaded by the scene player; the current renderer draws its own dialogue frame. Do not assume this PNG is composited without code. |

The existing painted files are documented in `docs/ART_CREDITS.md`; check current source and licence/terms under the repository's existing credit rules before distributing new art. Existing painted portraits render as static cards, not animated eye/mouth frames. The three core reused painted images total about 228 KB; one 100–150 KB new background gives a planning estimate around 328–378 KB, excluding legacy layers, metadata, duplication and runtime overhead. This is not a measured production package size.

### Deferred concepts: outside the one-new-image budget [NEW]

| Deliverable | Master / runtime | Prompt after [STYLE C] and purpose |
|---|---|---|
| `art/portrait_sparrow_neutral.png` → `portrait_sparrow_neutral.webp` | **1024 × 1280 PNG** master, **512 × 640 WebP** target 30–50 KB | `Head-and-shoulders portrait on a flat mid-grey background, young rookie pilot with a slim face and short dark hair, alert nervous expression, charcoal flight suit with an amber stripe, shoulders square and three-quarter view, no patch or lettering, same lighting and framing as the approved Hawk portrait reference.` This would be **one** new head and needs explicit cast approval, loader/label support, identity-safe roster mapping and scripts that use it. It is not needed for the twelve drafts. |
| `art/bg_ready_room_alert.png` → `bg_ready_room_alert.webp` | **1920 × 1080 PNG** master, **1280 × 720 WebP** target 100–150 KB | `The exact same room and camera as the approved ready-room reference, empty and unchanged furniture and structure, with restrained low amber alert lighting and a dark wall display, no people, no text.` Optional visual treatment only, not a new room or claim that an alert occurred. Do not add a separate branch or asset dependency for launch. |

For any optional portrait, first obtain approval of a neutral master, then use that master as the image reference for later expressions, recording model, seed and date as described in `CUTSCENE_ART_PROMPTS.md`. Portrait expressions, mouth layers, additional stills, and any new roster-specific faces remain outside the one-week must-have list.

## 5. One-week build plan and decision points [NEW]

This is a **tight target of five working days after the owner accepts this proposal and the required branches are available**, now including the three-step briefing in §6; it excludes waiting for approval, external art iteration and a physical-iPad handoff. If the stepper or context adapter takes longer, report the overrun rather than dropping correctness or tests. It is not a promise of physical-iPad coverage. The owner’s one-new-image budget is entirely reserved for the ready-room background. The scene build waits for that image; the briefing is built first with existing assets.

| Day | Deliverable and exit condition |
|---|---|
| 1 | Owner accepted the HALBERD ready room, Vance identity, automatic skippable opening and one-image budget; review the revised dialogue. Produce/review the single room master and 320 × 200 crop. Convert the twelve drafts and opening to real JSON only after approval; validate JSON, durations and the two-line-safe fallback text. |
| 2 | Add the small context/line adapter and shared-image loading described below. Exercise every outcome and unavailable-state fallback with test fixtures. Keep scene playback skippable and paused correctly. |
| 3 | Build the responsive ready-room and three-step briefing shell; wire BRIEFING, ROSTER, CONTINUE and BACK to existing paths. Integrate the before-scene into step 1 without duplicate playback and preserve roster and ordnance selection through redraws. For ROSTER, obtain the selected Prologue carrier pool explicitly; the current `rosterServiceHtml` reads `game.mstate.rosterKey` and must not be called with a stale or absent mission. If the roster is disabled, render existing legacy CREW statuses read-only. Keep Job C's NEXT MISSION and ending route direct; test keyboard and touch navigation. |
| 4 | Integrate the approved room image, existing portraits, opening and 12 scene files; build the schematic map and add campaign difficulty to OPTIONS as specified in §6. Check source-derived vectors, per-scene paths, compressed size, opening replay/`?go` bypass, and correct return after normal end, skip, malformed or missing content. Review the after-loss state on screen, not just as JSON. |
| 5 | Run the project gate and focused branch/scene tests; capture desktop and iPad-sized screenshots, check caption wrap/focus and report copy/download, then reserve time for fixes. Ask the owner for a real iPad landscape pass and a first unaided playthrough; report those as unverified until actually done. |

### Data and art only after approval

- Put each approved block in `assets/scenes/<id>/scene.json`; the twelve IDs match Job C's `p01_before` … `p04_after_lose` names. Put the opening in `assets/scenes/prologue_opening/scene.json`. Set `music` to null. `build.py` on Job C indexes scene IDs with a `scene.json`; rebuild after adding them. This design branch itself adds no scene files or images.
- Produce one approved `assets/scenes/shared/bg_ready_room.webp`; reuse the cited intro-test portrait and space files. Copying existing assets into every scene folder would technically satisfy today's per-scene loader but would duplicate payload and risk drift. Prefer the shared-loader change below. Record generated-asset provenance and measured compressed size according to `docs/ART_CREDITS.md` and the existing credit rules.
- Select dynamic variants into an in-memory copy of ordinary scene events before playback. The safe generic text in each file remains readable if no context is available; raw JSON does not pretend to support `if`, arbitrary variables, or new event types. Persist no dialogue outcome or character relationship.

### Code needed; no code is implemented here

1. **Job C integration.** Start from or merge `codex/prologue-flow` through the lead. Its `beforeMission` and `afterMission` hooks already name the twelve IDs, skip missing indexed scenes and return to the briefing/debrief. Extend the hook invocation to pass the intended mission and an immutable, bounded context: pre-sortie assignment/status, post-sortie participant statuses, the just-ended rescue log, outcome, grade and nullable player-death-cause. The current before hook can run before the new `game.mission` and roster exist; use a neutral Vance-only version when actual future assignment is unknown. After hooks run before the debrief, with the just-ended `game.mstate` still available. Preserve callbacks on normal end, skip, failed loading and `?go`.
2. **State-safe scene preparation.** Implement the deterministic t=8/t=15/t=22 replacements, ejection evidence, partial-result guard and Hawk fallback in §2. In roster mode do not equate “slot 0 is occupied” with the named Hawk; compare actual identity, not a generic callsign. Suppress both the Hawk head and speech if identity or availability is uncertain. Distinguish KIA, MIA, captured and recovering; use the neutral fallback if data is absent. Resolve from the frozen context once so a loss/retry or late scene callback cannot re-read a different mission. Avoid unescaped HTML and test long names/unknown grades.
3. **Shared presentation assets.** Today's `preloadSceneAssets` searches under each scene ID and hard-codes three character directories; the `../shared/` background can resolve as a relative path, but the portrait/legacy-head and `ui_frame.png` lookups still need either shared-path support or deliberate packaged copies. Add a single shared asset lookup/cache and optional-asset fallback; do not claim the current player already has a general shared library. Keep the same existing commander/Hawk files across all 12 scenes, and do not show the existing painted face as a roster substitute.
4. **Text-only playback and layout.** `music: null` alone does **not** silence the current player: `updateSceneElements` calls `playSceneBlip` while typing. Add a per-Prologue-scene silent playback option, including transition sounds, without changing unrelated scenes. Preserve SKIP/keyboard/touch and the two-line read time; make full text available to assistive technology, support instant text/reduced motion, and resize/reflow long or translated text instead of drawing beyond the canvas. The current player paints fixed-width 320 × 200 text and does not provide all of these features.
5. **Hub, opening and briefing.** The ready room, its return route, the opening trigger/replay, the proposed ending copy and the three-step briefing in §6 are new UI work; the existing Job C branch does not already implement the room or opening. Use actual Job C progress and session totals; do not create a second campaign save or override debrief/briefing facts. Move the existing Prologue briefing selectors to OPTIONS as described in §6, preserving selected wing/loadout and actually applying the selected difficulty before launch. `COPY REPORT` delegates to Job A when present and retains Job C's fallback/download. Opening skip targets briefing step 1 and its inline `p01_before` (or its text fallback if the scene is absent); tests for `?go` and `?scene=` must show no opening delay.

### Explicitly out of scope

No new ships, boarding, mission objectives, branch mechanics, performance/balance tuning, player-controlled hub navigation, talking-head AI, voice acting, new cast beyond the optional unapproved Sparrow portrait, extra rooms or 16-mission expansion. No plot is advanced after a loss as if it were a win. No new canonical explanation is implied by the art or by the neutral unattributed fallback. No network telemetry or automatic report upload.

### Verification and owner decisions

- Walk all 12 scene IDs, both scene-end and skip paths, missing/corrupt scene assets, and opening bypass on direct debug URLs. Check all `say` lines complete and wrap; test at least one active-Hawk case, Hawk absent, replacement roster pilot, both wing slots unavailable, KIA vs MIA/recovering, player loss with each available cause, objective failure with no cause, each win grade, and unavailable/stale context. In every case, a missing pilot must not speak and a loss must not become a win.
- Run keyboard and 1180 × 820 touch-viewport checks for room, roster return, debrief → next briefing, mission-4 ending and report fallback. Test the combined A/B/C branches as well as this content, including the three-step briefing, options round-trips, source-derived vectors, and single LAUNCH action specified in §6. Check that loading assets does not write reports, send telemetry, or expose private data. Run `python3 tools/gate.py` before any push or merge. Headless touch emulation is not an iPad.
- Owner decisions accepted: one HALBERD ready room, Cdr. Sarah Vance, an automatic skippable opening with menu replay, and one new image. Review the revised writing and implement the stepped briefing first; scenes wait for the ready-room image.

## 6. Three-step mission briefing [NEW]

**Purpose and boundary.** The owner described the current briefing as “just one huge screen with loadout and pilot selection, some text.” Replace the current single long `showBriefing(M)` panel for the four Prologue missions with three sequential views inside one briefing surface. This is a presentation proposal, not new gameplay, a new mission, or an implementation. Existing `M.briefing`, mission scripts, roster and loadout data remain authoritative. The screen says **MISSION n OF 4** and **STEP n OF 3** throughout. There is one LAUNCH button, on step 3 only. Difficulty and flight-model selectors belong in the existing OPTIONS panel, not on any of the three steps. No additional generated image is needed: reuse the one ready-room background, Vance card and UI layers from §4; draw the map and text as accessible UI/vector primitives.

### Step 1 — Situation [NEW]

Present the existing mission briefing as a short, readable situation, with CDR. SARAH VANCE's existing portrait and text-only dialogue in the §2 scene style. The text is derived from the actual `M.briefing`; do not replace mission facts with the longer, older campaign draft or disclose later outcomes. A fixed high-contrast caption panel has at most two short lines per beat, with a visible **NEXT** action, skip/instant text, and keyboard/touch advance. The complete situation remains available as readable text, including for assistive technology. No generated voice or automatic narration is proposed.

**Do not show two mandatory introductions:** Job C currently plays `beforeMission` *before* constructing the briefing. Integrating this proposal requires changing that presentation transition so the `p0n_before` timeline is hosted in step 1, exactly once, instead of playing full-screen and then replaying the same words on step 1. If the indexed scene is missing, fails or is skipped, show the corresponding `M.briefing` situation in step 1 and leave **NEXT** available. The automatic, skippable 30-second demo opening in §3 is separate, still bypassed by `?go` and other testing URLs. Completing or skipping a situation never launches the ship.

### Step 2 — Objectives and tactical map [NEW]

Show a concise list of the briefing's **known** objectives alongside a static, schematic map: a labelled HALBERD anchor, the player marker, and enemy **possible approach sectors** derived from the mission's authored spawn bearings. Do not introduce boarding, scanning, navigation commands, target selection, new objectives, extra waves, or a promise that a contact appears at an exact position. Mark the map **SCHEMATIC · NOT LIVE**; early sectors may occur only after a previous group is defeated. Do not show hidden enemy models, counts or order as foreknowledge, especially before first contact in p04. The objective list can use short approved display strings tied to existing objectives, not the full later-stage script dump:

| Mission | Player-facing objective summary [NEW] | Source |
|---|---|---|
| p01 | Protect HALBERD; break the escort; stop the transport. | Existing briefing; later objective explicitly calls for destroying the rogue Tern. Do not imply boarding or a disable mechanic. |
| p02 | Break the pickets, drone screen and strike detachment; protect HALBERD. | Existing briefing and stage objectives. |
| p03 | Stay close to HALBERD; preserve countermeasures; be ready for a trap. | Existing briefing; don't reveal later attacks as already confirmed. |
| p04 | Protect HALBERD; collect telemetry; survive. | Existing briefing; contacts remain unidentified here. |

**Projection contract:** `spawnGroup` uses `bearingVec(sp.bearing)`, a normalized **world-space 3D vector**, then places the group at a nominal distance from the anchor's position at spawn, with per-ship offsets and random spread. For a briefing plan, project each authored vector onto X/Z: +X right, −Z up/forward, +Z down/aft; use the actual 3D normalization before projecting, not a misleading 2D renormalization. Draw the approach arrow **from** the bearing sector **toward** the anchor. Label +Y / −Y components as above/below the map plane. Use nominal `dist` and `spread` only as plan annotations; anchor movement, per-ship staggering, random offsets and later triggers mean these are not exact live positions or arrival times. The player marker uses `M.setup.player.pos − M.setup.anchor.pos`. The initial player-to-anchor separation is much smaller than the 1.8–2.8 km contacts: if markers would overlap, move only the *label* or use an enlarged player glyph with a leader and a visible **symbols not to scale** legend; do not move the underlying coordinate or imply real scale.

**Source table for the builder, not an on-screen wave list:** values below are copied from the merged `src/75_mission.js` spawn data, including the updated p02 authored layout. Each row corresponds to an existing stage `spawn`; IDs A/B/C are internal group IDs. The vector is not a compass degree. All p01–p04 initial anchor positions are `[0,0,0]`; the player values are the existing setup positions, in metres and world axes.

| Mission | Player `[x,y,z]` | Spawn groups: ID → `bearing`, nominal `dist`, `spread` |
|---|---|---|
| p01 | `[80,15,100]` | A → `[0.3,0.05,-1]`, 2600 m, 180 m; B → `[0.1,0,-1]`, 1800 m, 50 m |
| p02 | `[90,20,110]` | A → `[0.2,0.05,-1]`, 2800 m, 240 m; B → `[-0.4,0.1,-1]`, 2400 m, 260 m; C → `[0.1,-0.1,-1]`, 2200 m, 200 m |
| p03 | `[85,10,105]` | A → `[0.3,0.2,-1]`, 2200 m, 260 m; B → `[-0.4,-0.1,-1]`, 2500 m, 240 m |
| p04 | `[90,15,110]` | A → `[0.1,0.05,-1]`, 2400 m, 220 m; B → `[-0.3,0.1,-1]`, 2700 m, 240 m |

Draw distinct labelled symbols (anchor, player, possible approach) with both shape and text, not colour alone. An adjacent text equivalent lists the relative player position and each sector's vector, nominal range and above/below status; it is usable without the graphic. If a spawn has no usable bearing/distance, omit that sector and say **approach data unavailable**. No decorative map numbers, planets or new waypoints imply a route not in the scripts.

### Step 3 — Wing and loadout [NEW]

Show the actual selected player, the available/assigned wing slots and their current statuses using the existing `rosterBegin` / `rosterBriefHtml` and legacy CREW fallback; permit the existing roster selection and auto-fill only when enabled. Show the existing ship and `briefingLoadout` summary plus the existing station choices and stock warnings via `ordnanceBriefing` / `bindOrdnanceBriefing`; if stations are unavailable, say so instead of inventing options. Keep the actual defaults usable without any interaction, with the current AI and ordnance defaults unchanged. Preserve the existing rule that no active player disables LAUNCH, and `ordnanceApply(player)` must validate stock at LAUNCH. An invalid fit keeps the player on step 3, explains the issue beside the relevant station, and never consumes or silently changes the selection.

The primary action is the **only LAUNCH button**. Keep **BACK** to step 2; OPTIONS remains accessible as an existing modal/panel, not a fourth briefing step. Repeated NEXT/BACK, opening OPTIONS, or redrawing the roster/ordnance controls must preserve the selected mission, active pilot, chosen wing slots and station selections. Leaving the briefing explicitly follows the existing return/restore behavior. On launch, apply the current selected difficulty, flight model and validated loadout exactly once; close the briefing and perform the existing touch/audio/pointer-lock launch path.

### Options and state handling [NEW]

The current options panel already has the flight-model selector (`o_fm`, `fmSet` / `gs_fm`); move the Prologue briefing's duplicate selector there rather than creating a second setting. Add the existing campaign difficulty choices (`DIFFS`, `diffSet` / `gs_diff`, default NORMAL) to OPTIONS, including their existing descriptions. The briefing may show a compact **OPTIONS** link, but not a second inline selector. Keep non-Prologue modes' own setup semantics intact. These controls and moving their UI require code; this design changes no balance values.

The current briefing's difficulty handler calls `startMission(M)`, and `startMission` creates the player with `diffCfg().take`; a naïve options change while the wizard is open can therefore leave the displayed difficulty and actual player damage multiplier inconsistent or reset the selected wing. The implementation must either safely reapply the selected difficulty to the prepared player before launch or rebuild transactionally while restoring and revalidating the selected pilot, wing, ordnance and pre-sortie crew snapshot. Define and test the chosen path before shipping. Changing options must not accidentally replay the opening or `beforeMission` scene, reinitialize progression, discard loadout, or create multiple players. The existing global flight model is updated through `fmSet`; retain its existing AI behavior and persistence. On cancel/return, do not credit a sortie or write a victory.

### Layout and navigation [NEW]

**Desktop 1440 × 900:** centre a wide, high-contrast panel inside the ready-room composition. Step 1: Vance portrait left, situation captions right. Step 2: objective list left, a large map right, text equivalent directly under the map. Step 3: wing/pilot list left, loadout/stations right; LAUNCH is fixed at the lower right. A persistent top progress indicator reads `1 SITUATION · 2 OBJECTIVES · 3 WING & LOADOUT`; completed steps are navigable with BACK/NEXT. Tab order follows heading → content/actions → BACK → NEXT or LAUNCH; arrows are optional, never the only way to operate. Do not hide essential briefing text behind a hover state.

**iPad 1180 × 820 landscape:** same three steps and visual hierarchy. Step 1 keeps the portrait and captions side by side when they fit. Step 2 stacks the short objective list above a map with its legend and text equivalent below; step 3 stacks wing and loadout sections if necessary, with a scrollable content area and a sticky lower action bar. All interactive targets are at least 44 × 44 CSS px with visible labels and focus; support taps, scrolling, larger system text, safe-area insets and voice-over order. The action bar must not cover the last roster/station row. There is one LAUNCH control in the DOM and it appears only on step 3. At smaller widths, stack rather than shrink text. These sizes and layouts are design targets; a physical iPad test remains required.

### Production and acceptance [NEW]

This stepper adds code to the §5 plan: split the current briefing renderer while preserving the existing roster/ordnance callbacks, integrate the before-scene into step 1, draw an accessible map from authored data, and add difficulty to OPTIONS. The map's static headings/objective summaries can be authored data; the map coordinates, current wing/loadout, validation and options must be read from live existing state. Five working days remains a target only after owner approval and approved art; the stepper and identity-safe scene adapter make it a tight estimate, so cut optional polish rather than data correctness or tests.

Before implementation acceptance, check all four exact vector tables against source after any mission edits, including the updated p02; verify projection/labels and no early alien identity or hidden enemy count leaks. On desktop and touch, test direct `?go`, missing/skip-before scene, BACK/NEXT and OPTIONS round-trips, invalid stock, no active pilot, a partially filled wing, changing difficulty and flight model, persisted defaults, and selected roster/stations after redraw. Confirm exactly one LAUNCH control, no launch from steps 1–2, no duplicate scene and no progress/crew mutation on cancel. Run the original tutorial and Prologue flow tests plus the full gate; a headless touch viewport is not a physical iPad or an unaided human playtest.

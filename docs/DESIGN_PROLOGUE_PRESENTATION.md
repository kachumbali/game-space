# Prologue presentation — owner decision draft

**Status:** proposal, not approved content or an implementation. Scope: the four existing Prologue sorties, one room, text only. The owner selected Direction C's gritty atmosphere, not individual cast identities or assets ([style decision](DESIGN_CUTSCENE_STYLE.md)). The current runtime mission text in `src/75_mission.js` is authoritative where the older [campaign draft](CAMPAIGN_PROLOGUE.md) differs. The objective text, actual waves, outcomes, flight mechanics and balance remain as they are.

**Marking convention:** every proposed piece of staging, dialogue, scene timing, UI wording, identity or art in a section explicitly marked **[NEW]** is a narrative/presentation invention for approval, including every string inside its JSON block. `[NEW]` is an editorial label and is never displayed to a player. Unmarked factual references are grounded in `docs/LORE*.md`, `docs/CAMPAIGN_PROLOGUE.md`, or the current mission/debrief data. Existing art is not thereby approved as final character canon.

## 1. The ready room [NEW]

**One room:** a cramped combined crew ready room and briefing space on the CSS HALBERD, with one scuffed table, four secured chairs, a dark wall display and a cup held by a magnetic ring. Its hatch, pipework and braced furniture make the space plausible inside the existing 128 m corvette. There is no navigable carrier and no second room. Use Direction C's near-black/olive graphite, hard-edged shadows, a restrained cyan display and a rust-amber practical lamp. Two large portrait positions sit over the same still: Imani on the left as a framed command-feed portrait, Hawk on the right only when that exact character is available. The command feed is a presentation device; it does not establish Imani's location, rank over Vance, or survival. Keep the portrait faces and the lower caption area clear at the 320 × 200 logical safe frame. Existing Imani and Hawk portraits are provisional reuse, subject to owner review.

The wall display is a UI layer, not text painted into the background. It has a mission number and three explicit, labelled controls; the room never depends on an invisible hotspot:

| Control | Action and availability |
|---|---|
| **BRIEFING** | Open the currently selected Prologue mission's existing briefing and loadout; if there is no current selection, use the next unfinished mission. Selection/launch availability remains the existing game rule. |
| **ROSTER** | Open the existing roster/service-record panel, read-only where the current game offers only a service record. Return to this same room. Do not add a crew-management mechanic or invent a roster when the feature is disabled. |
| **CONTINUE** | Use Job C's next-unfinished-mission selection, including its optional `beforeMission` scene, then the existing briefing. When all four are complete, show **PROLOGUE COMPLETE** and a main-menu action instead of inventing a fifth sortie. |

**Flow compatibility:** Job C's victory debrief → **NEXT MISSION** → before-scene → next briefing remains a single direct action. The room is reached from a clearly labelled **READY ROOM** entry at the main menu and an optional **READY ROOM** action on the debrief; it is not an extra mandatory stop or a replacement for CONTINUE. After a loss, the existing debrief and RETRY remain available. After mission 4's win, retain Job C's ending card, then its main menu. The room can show the last result only while a valid snapshot exists; otherwise it shows the neutral state. Persist no new story flags.

**Desktop:** at 1440 × 900, centre a 16:10 stage with the original art cropped only at the outer 16:9 edges. Place portraits left/right, the three large controls as a vertical stack in the central gap, and a separate opaque caption band under the faces. Mouse, Tab, arrows and Enter reach every action; focus is visible and the order is CONTINUE, BRIEFING, ROSTER, BACK. Use existing UI text, not baked labels. The current scene player's two-line 38-character wrapping is a production constraint, not a promise of responsive text.

**iPad landscape:** at 1180 × 820, preserve the same 16:10 composition and keep faces above the caption band. Use at least 44 × 44 CSS-pixel touch targets with spacing; no hover, drag, or precision tap is required. Tap advances/completes text and a persistent SKIP button returns to the correct briefing/debrief. Do not cover the next-action control with the bottom caption. The room is a proposed DOM/UI layer; fitting it, the roster and long/localised labels needs a real iPad test. Do not silently change the existing flight HUD.

## 2. Scene drafts and state rules [NEW]

**Reading this section:** all dialogue and presentation in every following JSON block is [NEW]. Factual anchors come from the runtime briefing and debrief fields, not from the more elaborate obsolete campaign draft. Each block is a complete valid `scene.json` in the current `id` / `size` / `music` / timed `events` shape; it contains only existing `bg`, `head`, `say`, and `end` actions. The `../shared/` art path denotes a planned shared asset directory. `music: null`; no spoken voice. At 28 characters/second the lines complete before their next event; 29 seconds is the unattended duration, and the existing click-to-advance / SKIP shortens it. Text must also be checked at the actual two-line renderer width, with localised text allowed to reflow.

**Before scenes:** the two heads are Imani and Hawk. The player may not have Hawk assigned or available. The adapter must show Hawk only if the *actual named Hawk* is active and assigned to the coming sortie; otherwise delete the Hawk `head` event, change the Hawk `say` event to `who: "imani"`, and use the exact replacement in the table after the drafts. Do not present the Hawk image as a different pilot. If the roster uses substitutes or the future assignment is not known, use the fallback. Never infer an available slot from `rosterSlotShip(0)` alone: in roster mode that slot can be a different pilot.

**After scenes:** these are an out-of-world debrief record on the same room backdrop, with Imani's existing image used as a neutral command-feed presenter, not evidence that anyone aboard survived. [NEW] This is a display convention, not an assertion that Imani is Vance, that Imani is off ship, or that a dead pilot speaks. The default lines at `t=8` and `t=15` are safe neutral fallbacks. Before playback, the adapter replaces *those two event texts*, not the event schema, with the state-specific lines below. Never put a condition, placeholder, new event type, or unevaluated token in runtime JSON. No outcome text claims a rescue, death, interception or intelligence result beyond the game's own result. A loss leads to RETRY/main menu, not a scene implying the next sortie already happened.

### State-to-line contract [NEW]

| Input / priority | Exact line or operation | Source and constraint |
|---|---|---|
| **t=8 roster**, participating wing slots have KIA/MIA/CAPTURED/RECOVERING | Use `HAWK: KIA. SPARROW: MIA.`-style text, with each participating pilot's *actual* callsign and actual status. [NEW] | Legacy: compare pre-sortie `game.crewSnap` against current `CREW`; roster: use the sortie's `S.rosterSelected` / participants and `rosterFind(id).status` after `rosterFinish`. Only claim KIA for KIA; never convert MIA, captured or recovering to death. If two slots have different outcomes, report both when they fit. Abbreviate a long callsign deterministically or use “Wing slot 1/2”; never fabricate a name. |
| **t=8**, no relevant loss or no reliable snapshot | `Roster status: see the service record.` [NEW] | The word “returned” is intentionally avoided: active status or absent evidence alone is not a rescue result. |
| **t=15**, victory | `Grade: A. Flight record filed.` [NEW], substituting the actual S/A/B/C/D from `missionStats().grade` | Resolve while the completed mission and `game.mstate` are still current. This is a result read, not a new award. |
| **t=15**, loss with a real death-cause line | `Likely cause: ` followed by the exact `S.playerDeathCause` if it fits; otherwise use a two-line-safe, meaning-preserving approved mapping. [NEW] | It is a *likely* cause, not certainty. The game sets this field only for some Prologue player deaths. Missing field or objective failure must not be labelled pilot death. |
| **t=15**, loss without a cause | `Cause unavailable. Review the debrief.` [NEW] | No claim that the player survived or died. |

`missionStats()`, `game.mstate.result` and `playerDeathCause` are existing reads, not state invented by this design. Dynamic interpolation, choosing the actual roster identity, and the previous/current snapshot comparison are **[NEEDS CODE]**: the current scene player has no conditional-event or variable-substitution support. It also hard-codes `who` labels and suppresses Hawk through the current live slot, which is not a reliable previous/future roster snapshot. Job C's `afterMission` hook runs before its debrief, while `beforeMission` runs before the next mission is constructed; pass an explicit immutable context including the *intended* mission ID, pre/post roster records, result, grade and nullable cause. Do not read the prior mission's live `game.mission` as the next one. Keep status display to two lines of at most 38 characters each; use text rendering, never HTML. If a snapshot or cause is unavailable, use the neutral fallback above.

Hawk fallback lines for the `t=9` event in each before scene, spoken by Imani when Hawk is not both correctly identified and available:

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
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "imani", "text": "A shuttle passed Hollow 14 customs.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "They refused inspection. Stay close.", "cps": 28},
    {"t": 17, "do": "say", "who": "imani", "text": "Protect HALBERD and stop the transport.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p01_after_win` [NEW]

```json
{"id": "p01_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The canisters say Project Nursery / Oasis-9.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "VAC legal has sealed the report.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p01_after_lose` [NEW]

```json
{"id": "p01_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The transport escaped. The trail is lost.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "Review the sortie before another attempt.", "cps": 28},
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
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "imani", "text": "Privateers have closed Relay Beta.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "We break the screen; HALBERD draws fire.", "cps": 28},
    {"t": 17, "do": "say", "who": "imani", "text": "The habitats need that supply route open.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p02_after_win` [NEW]

```json
{"id": "p02_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "Relay Beta is open. The traffic records are in.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "The privateers were paid in VAC bonds.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p02_after_lose` [NEW]

```json
{"id": "p02_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The blockade holds. The habitats are isolated.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "Review the sortie before another attempt.", "cps": 28},
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
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "imani", "text": "A survey beacon is calling from Alpha-9.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "A distress call is not a guarantee of safety.", "cps": 28},
    {"t": 17, "do": "say", "who": "imani", "text": "Stay close. Keep countermeasures ready.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p03_after_win` [NEW]

```json
{"id": "p03_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The attackers knew our patrol frequency.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "Their hulls carried corporate avionics.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p03_after_lose` [NEW]

```json
{"id": "p03_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The task group was overwhelmed at Alpha-9.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "The route to Lily remains exposed.", "cps": 28},
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
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 0.4, "do": "head", "id": "hawk", "char": "hawk", "pos": "right"},
    {"t": 1, "do": "say", "who": "imani", "text": "The Lily listening posts have gone quiet.", "cps": 28},
    {"t": 9, "do": "say", "who": "hawk", "text": "Those contacts do not match our registry.", "cps": 28},
    {"t": 17, "do": "say", "who": "imani", "text": "Protect HALBERD and collect telemetry.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p04_after_win` [NEW]

```json
{"id": "p04_after_win", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "The contacts are designated FROGG.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "HALBERD falls back to the relay defence.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

#### `p04_after_lose` [NEW]

```json
{"id": "p04_after_lose", "size": [320, 200], "music": null,
  "events": [
    {"t": 0, "do": "bg", "img": "../shared/bg_ready_room.webp", "fade": 0.6},
    {"t": 0.2, "do": "head", "id": "imani", "char": "imani", "pos": "left"},
    {"t": 1, "do": "say", "who": "imani", "text": "First contact failed. The colonies are blind.", "cps": 28},
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the service record.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "Review the sortie before another attempt.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

## 3. Opening and ending [NEW]

### A skippable 30-second opening [NEW]

**Purpose:** backlog item 2 asks the opening to say what this is: an AI-designed space combat simulator. The first sentence does so. The dry second beat keeps the tone human without borrowing anyone else's artwork or characters. Use only existing Imani and Hawk heads; the existing space illustration establishes the scale before the same ready room appears. No voice, no new music cue, and no instruction hidden in narration.

**When:** on starting a new Prologue, before `p01_before` and the existing mission briefing; skip goes directly to that briefing, not to gameplay. Offer **WATCH OPENING** from the main menu for replay. Do not interrupt an existing CONTINUE, retries, `?go`, `?scene=`, or a direct testing URL. A page-session presentation flag can prevent the opening replaying on every visit; it is not a story flag or progression mechanic. Job C currently supplies no opening hook: this scheduling and replay entry are **[NEEDS CODE]**, subject to the owner choosing the trigger. If Hawk is unavailable or not yet assigned, remove her `head` event and change the `t=13` line to Imani; it has the same text. The opening is not a claim that either character is alive after a subsequent loss.

#### `prologue_opening` [NEW]

```json
{"id":"prologue_opening","size":[320,200],"music":null,
 "events":[
  {"t":0,"do":"bg","img":"../intro_test/painted/bg_space.webp","fade":0.6},
  {"t":0.5,"do":"title","text":"CLAUDE SPACE COMMANDER","sub":"PROLOGUE","dur":3.5},
  {"t":4,"do":"bg","img":"../shared/bg_ready_room.webp","fade":0.6},
  {"t":4.2,"do":"head","id":"imani","char":"imani","pos":"left"},
  {"t":4.4,"do":"head","id":"hawk","char":"hawk","pos":"right"},
  {"t":5,"do":"say","who":"imani","text":"An AI-designed space combat simulator.","cps":28},
  {"t":13,"do":"say","who":"hawk","text":"Four patrols. One corvette. Keep it flying.","cps":28},
  {"t":21,"do":"say","who":"imani","text":"The paperwork is human. So are the mistakes.","cps":28},
  {"t":30,"do":"end"}
 ]
}
```

### Ending card [NEW]

Only after the mission 4 **win** debrief and its optional after-scene: hold the existing Job C ending card. Fade the ready-room image to near-black; display **TO BE CONTINUED**, then **The HALBERD is falling back to Lily.** Use the existing actual session totals (sorties, wins, kills, in-game mission time), followed by **COPY REPORT**, **DOWNLOAD REPORT** if clipboard access fails, and **MAIN MENU**. The report is the actual Job A report with Job C's session-total line when the branches are integrated; no network call. The other campaigns are available and labelled unpolished as Job C specifies. The card is not shown for a loss and does not claim the invasion has ended. This proposes a change to the existing ending-card copy and styling; the counts and report must never be mocked or replaced by fixed text.

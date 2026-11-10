# Prologue presentation — owner decision draft

**Status:** proposal, not approved content or an implementation. Scope: the four existing Prologue sorties, one room, text only. The owner selected Direction C's gritty atmosphere, not individual cast identities or assets ([style decision](DESIGN_CUTSCENE_STYLE.md)). The current runtime mission text in `src/75_mission.js` is authoritative where the older [campaign draft](CAMPAIGN_PROLOGUE.md) differs. The objective text, actual waves, outcomes, flight mechanics and balance remain as they are.

**Marking convention:** every proposed piece of staging, dialogue, scene timing, UI wording, identity or art in a section explicitly marked **[NEW]** is a narrative/presentation invention for approval, including every string inside its JSON block. `[NEW]` is an editorial label and is never displayed to a player. Unmarked factual references are grounded in `docs/LORE*.md`, `docs/CAMPAIGN_PROLOGUE.md`, or the current mission/debrief data. Existing art is not thereby approved as final character canon.

## 1. The ready room [NEW]

**One room:** a cramped combined crew ready room and briefing space on the CSS HALBERD, with one scuffed table, four secured chairs, a dark wall display and a cup held by a magnetic ring. Its hatch, pipework and braced furniture make the space plausible inside the existing 128 m corvette. There is no navigable carrier and no second room. Use Direction C's near-black/olive graphite, hard-edged shadows, a restrained cyan display and a rust-amber practical lamp. Two large portrait positions sit over the same still: Imani on the left as a framed command-feed portrait, Hawk on the right only when that exact character is available. The command feed is a presentation device; it does not establish Imani's location, rank over Vance, or survival. Keep the portrait faces and the lower caption area clear at the 320 × 200 logical safe frame. Existing Imani and Hawk portraits are provisional reuse, subject to owner review.

The wall display is a UI layer, not text painted into the background. It has a mission number and three explicit, labelled controls; the room never depends on an invisible hotspot:

| Control | Action and availability |
|---|---|
| **BRIEFING** | Open the currently selected Prologue mission's existing briefing and loadout; if there is no current selection, use the next unfinished mission. Selection/launch availability remains the existing game rule. |
| **ROSTER** | Open the existing roster/service-record view for the selected Prologue mission; return to this same room. If the optional roster is disabled, show the existing legacy CREW statuses read-only. Do not add a crew-management mechanic or invent pilots. |
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
| **t=8**, no relevant loss or no reliable snapshot | `Roster status: see the debrief.` [NEW] | The word “returned” is intentionally avoided: active status or absent evidence alone is not a rescue result. |
| **t=15**, victory | `Grade: A. Flight record filed.` [NEW], substituting the actual S/A/B/C/D from `missionStats().grade` | Resolve while the completed mission and `game.mstate` are still current. This is a result read, not a new award. |
| **t=15**, loss with a real death-cause line | `Likely cause: ` followed by the exact `S.playerDeathCause` if it fits; otherwise use a two-line-safe, meaning-preserving approved mapping. [NEW] | It is a *likely* cause, not certainty. The game sets this field only for some Prologue player deaths. Missing field or objective failure must not be labelled pilot death. |
| **t=15**, loss without a cause | `Cause unavailable. Review the debrief.` [NEW] | No claim that the player survived or died. |

### Ejection and partial-result variants [NEW]

The same `t=8` roster line also reacts to **recorded ejections**; it must not infer an ejection merely from KIA, missing, or a destroyed fighter. When rescue is enabled, `rescueSpawnCapsule` adds the actual capsule record to `game.rescueLog` with `pilot`, `player`, and `outcome`; `rescueResolve` updates that same record. The adapter snapshots the log before the next mission resets it, maps `pilot` to the actual sortie participant or uses the explicit `player` flag, and combines it with the final roster status. In the legacy, rescue-disabled path, use only an `ejected, recovered` note newly appended since the pre-sortie snapshot; older notes are not evidence for this sortie. If the log or comparison is unavailable, retain the neutral roster fallback.

| Evidence in the just-ended sortie | Exact example replacement for `t=8` [NEW] | Boundary |
|---|---|---|
| HAWK capsule record, `outcome === 'recovered'` | `HAWK ejected; capsule recovered.` | Say recovered only for the actual recovery outcome; recovery does not mean fit for duty. |
| HAWK capsule record, `outcome === 'captured'` | `HAWK ejected; capsule captured.` | Captured is not KIA or recovered. |
| HAWK capsule record, `outcome === 'destroyed'` | `HAWK ejected; capsule destroyed.` | Report the capsule outcome; use the separately recorded roster status for a casualty claim. |
| HAWK capsule record, `outcome === 'life support expired'` | `HAWK ejected; life support expired.` | Do not change the meaning to rescue or capture. |
| Capsule exists, `adrift`, `missing`, `mission ended before recovery`, or unknown | `HAWK ejected; outcome unresolved.` | If the roster separately resolves an outcome, report only what that final status establishes; the capsule log alone does not establish recovery. |
| Player capsule record | `Player ejected; outcome unresolved.` or the matching recovered/captured/destroyed line | Use the record's `player` flag or actual pilot ID, not a fixed MEOW portrait. Ejection is not itself a death cause. |

Replace HAWK with the recorded participating pilot's actual callsign only when identity is known. For two recorded events, combine compactly, e.g. `HAWK: ejected, recovered. SPARROW: KIA.`; preserve both actual outcomes. If the player plus two wing slots cannot fit within two 38-character lines, put the remaining status in the `t=22` slot and leave the outcome facts in `t=1` and the original debrief. Use `Wing slot 1/2` when an identifier cannot be safely displayed. Never force a named pilot, rescue, cause or casualty from a missing record. These are exact example lines for the adapter, not conditional syntax understood by the current scene player.

**Partial outcomes:** Job C routes `partial` to the `afterMission.lose` hook. A recovered, captured or missing player can yield a partial result; that does not prove the mission's loss-specific facts. For *every* `p01`–`p04` `after_lose` draft when `S.result === 'partial'`, replace `t=1` with `The sortie ended with a partial result.` and `t=22` with `Review the debrief before continuing.` [NEW]. Keep `t=8` state-aware and use `t=15` for the recorded likely cause when present, otherwise `Cause unavailable. Review the debrief.` Do not assert the transport escaped, the blockade held, or first contact failed solely because the lose hook was selected. The existing mission debrief remains authoritative.

`missionStats()`, `game.mstate.result` and `playerDeathCause` are existing reads, not state invented by this design. Dynamic interpolation, choosing the actual roster identity, and the previous/current snapshot comparison are **[NEEDS CODE]**: the current scene player has no conditional-event or variable-substitution support. It also hard-codes `who` labels and suppresses Hawk through the current live slot, which is not a reliable previous/future roster snapshot. Job C's `afterMission` hook runs before its debrief, while `beforeMission` runs before the next mission is constructed; pass an explicit immutable context including the *intended* mission ID, pre/post roster records, the just-ended rescue log, result, grade and nullable cause. Do not read the prior mission's live `game.mission` as the next one. Keep status display to two lines of at most 38 characters each; use text rendering, never HTML. If a snapshot or cause is unavailable, use the neutral fallback above.

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
    {"t": 1, "do": "say", "who": "imani", "text": "A shuttle bypassed Hollow 14 customs.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
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
    {"t": 8, "do": "say", "who": "imani", "text": "Roster status: see the debrief.", "cps": 28},
    {"t": 15, "do": "say", "who": "imani", "text": "Flight record available in the debrief.", "cps": 28},
    {"t": 22, "do": "say", "who": "imani", "text": "Review the sortie before another attempt.", "cps": 28},
    {"t": 29, "do": "end"}
  ]
}
```

## 3. Opening and ending [NEW]

### A skippable 30-second opening [NEW]

**Purpose:** backlog item 2 asks the opening to say what this is: an AI-designed space combat simulator. The first sentence does so. The dry second beat keeps the tone human without borrowing anyone else's artwork or characters. Use only existing Imani and Hawk heads; the existing space illustration establishes the scale before the same ready room appears. No voice, no new music cue, and no instruction hidden in narration.

**When:** on the first entry to a fresh Prologue in this page session, including an initial CONTINUE when no Prologue victory is recorded, before `p01_before` and the existing mission briefing; skip continues to briefing step 1, where `p01_before` plays inline when available; the player still reaches steps 2 and 3 and the single LAUNCH button. Offer **WATCH OPENING** from the main menu for replay. Do not interrupt CONTINUE for an already-started Prologue, retries in the same session, `?go`, `?scene=`, or a direct testing URL. A local, presentation-only `gs_prologue_opening_seen` flag can prevent replay across reloads; it is not a story flag or progression mechanic. A prior loss without that flag cannot be distinguished from a fresh player, so the opening may be offered once and remains skippable. Job C currently supplies no opening hook: this scheduling and replay entry are **[NEEDS CODE]**, subject to the owner choosing the trigger. If Hawk is unavailable or not yet assigned, remove her `head` event and change the `t=13` line to Imani; it has the same text. The opening is not a claim that either character is alive after a subsequent loss.

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

After the mission 4 **win** after-scene and debrief, keep Job C’s CONTINUE action and hold the existing ending card. The after-scene precedes the debrief in the merged hook implementation; do not replay it after the debrief. Fade the ready-room image to near-black; display **TO BE CONTINUED**, then **The HALBERD is falling back to Lily.** Use the existing actual session totals (sorties, wins, kills, in-game mission time), followed by **COPY REPORT**, **DOWNLOAD REPORT** if clipboard access fails, and **MAIN MENU**. The report is the actual Job A report with Job C's session-total line when the branches are integrated; no network call. The other campaigns are available and labelled unpolished as Job C specifies. The card is not shown for a loss and does not claim the invasion has ended. This proposes a change to the existing ending-card copy and styling; the counts and report must never be mocked or replaced by fixed text.

## 4. Asset list and generation prompts [NEW]

**Production target:** one new painted image, three existing painted images reused, and the already-shipped legacy head layers as fallbacks. This is **1 new image**, comfortably below the 12-image target; no new speaking head is required. The Imani and Hawk cards are 768 × 768, not the 4:5 masters proposed for new portraits in `CUTSCENE_ART_PROMPTS.md`. They are reused provisionally, not treated as final owner-approved likenesses. No image is generated by this design job. Do not count UI text, rules or the existing many-file 64 px head layers as new generated images. The owner can reject any reuse.

The prompt pack's older A/B selection predates the owner's Direction C decision. Use this **[STYLE C]** replacement block, then paste the item-specific prompt after it. It follows the prompt pack's no-text, original-work and reference-image workflow while taking its palette and hard shadows from the chosen direction:

```text
Original hard military science-fiction game cutscene, gritty realistic illustrated comic, believable practical engineering and proportions, strong silhouettes, hard black inked shadows, low-key lighting, limited olive-black and graphite palette with restrained cyan coolant and rust-orange heat accents, three main values and one restrained accent, a single readable composition at a 320 by 200 logical scale, no text, lettering, logos, insignia, watermark, signature, real people, or existing franchise characters or designs, not photorealistic, not chibi.
```

Negative prompt where supported: `letters, captions, watermark, signature, logos, duplicated faces, malformed hands, extra limbs, anime, chibi, fantasy armour, excessive lens flare, tiny unreadable detail`.

### Must have for the demo [NEW]

| # | Deliverable | Master / runtime | Prompt after [STYLE C] and production notes |
|---|---|---|---|
| 1 | `art/bg_ready_room.png` → `assets/scenes/shared/bg_ready_room.webp` | **1920 × 1080 PNG** master; **1280 × 720 WebP** runtime, target 100–150 KB after review | `An empty compact crew ready room inside a small military escort corvette, eye-level view, one scuffed secured table, four restrained chairs, a dark wall display, one pressure hatch, visible structural ribs and a cup held in a magnetic ring. Hard overhead shadow, a restrained amber practical lamp and faint cyan screen glow. No people. Keep the central 90 percent of the image readable as a 16:10 crop, with broad calm dark space for two portrait cards and a separate caption overlay; no labels or writing.` One fixed composition for hub and all scenes; no separate debrief room. The cup, layout and placement are [NEW], not lore. |

For production, generate the one master, review it against the game's 320 × 200 safe area and on an iPad, then downscale/compress; do not upscale or edit the runtime file by hand. Treat the size and byte budget as targets, not measured facts.

### Reused, no new image generation [NEW]

| Existing file | Actual size | Use / limitation |
|---|---:|---|
| `assets/scenes/intro_test/painted/bg_space.webp` | 1280 × 720; 88,404 bytes | Opening establishing image, treated as an illustrative fleet view rather than an exact model of the HALBERD or Kestrel; use a plain dark title card if the owner rejects that mismatch. Existing original art's provenance and prompted purpose are in `docs/ART_CREDITS.md`; its full generation prompt was not recorded there and is not invented here. |
| `assets/scenes/intro_test/painted/imani.webp` | 768 × 768; 60,162 bytes | Imani command-feed portrait. Reuse subject to owner cast approval; do not equate her with Vance. |
| `assets/scenes/intro_test/painted/hawk.webp` | 768 × 768; 79,322 bytes | Hawk portrait only when that named pilot is available. Existing image has no expression animation. |
| `assets/scenes/intro_test/heads/{imani,hawk,meow}/*.png` and `head.json` | 64 × 64 per layer; metadata per head | Existing low-resolution eyes/mouth fallback if a painted card is unavailable. Meow is not required to speak in these drafts; never substitute this portrait for an unidentified player. |
| `assets/scenes/intro_test/painted/bg_briefing.webp` | 1280 × 720; 165,052 bytes | Temporary test stand-in for the ready-room image only; remove the stand-in reference when the new one is approved. It is not a second demo location. |
| `assets/scenes/intro_test/ui_frame.png` | 320 × 200; 432 bytes | Legacy asset already preloaded by the scene player; the current renderer draws its own dialogue frame. Do not assume this PNG is composited without code. |

The four original painted files are documented in `docs/ART_CREDITS.md`; check current source and licence/terms under the repository's existing credit rules before distributing new art. Existing painted portraits render as static cards, not animated eye/mouth frames. The three core reused painted images total about 228 KB; one 100–150 KB new background gives a planning estimate around 328–378 KB, excluding legacy layers, metadata, duplication and runtime overhead. This is not a measured production package size.

### Nice to have, not required or counted in the demo target [NEW]

| Deliverable | Master / runtime | Prompt after [STYLE C] and purpose |
|---|---|---|
| `art/portrait_sparrow_neutral.png` → `portrait_sparrow_neutral.webp` | **1024 × 1280 PNG** master, **512 × 640 WebP** target 30–50 KB | `Head-and-shoulders portrait on a flat mid-grey background, young rookie pilot with a slim face and short dark hair, alert nervous expression, charcoal flight suit with an amber stripe, shoulders square and three-quarter view, no patch or lettering, same lighting and framing as the approved Hawk portrait reference.` This would be **one** new head and needs explicit cast approval, loader/label support, identity-safe roster mapping and scripts that use it. It is not needed for the twelve drafts. |
| `art/bg_ready_room_alert.png` → `bg_ready_room_alert.webp` | **1920 × 1080 PNG** master, **1280 × 720 WebP** target 100–150 KB | `The exact same room and camera as the approved ready-room reference, empty and unchanged furniture and structure, with restrained low amber alert lighting and a dark wall display, no people, no text.` Optional visual treatment only, not a new room or claim that an alert occurred. Do not add a separate branch or asset dependency for launch. |

For any optional portrait, first obtain approval of a neutral master, then use that master as the image reference for later expressions, recording model, seed and date as described in `CUTSCENE_ART_PROMPTS.md`. Portrait expressions, mouth layers, additional stills, and any new roster-specific faces remain outside the one-week must-have list.

## 5. One-week build plan and decision points [NEW]

This is an estimate for **five working days after the owner accepts this proposal and the required branches are available**; it excludes waiting for approval or external art iteration. It is not a promise of physical-iPad coverage. If the single background is rejected, use the existing briefing image as the explicitly temporary stand-in and ship no unapproved replacement.

| Day | Deliverable and exit condition |
|---|---|
| 1 | Owner decides the room, command-feed framing, opening trigger, dialogue and one-image budget. Produce/review the single room master and 320 × 200 crop. Convert the twelve drafts and opening to real JSON only after approval; validate JSON, durations and the two-line-safe fallback text. |
| 2 | Add the small context/line adapter and shared-image loading described below. Exercise every outcome and unavailable-state fallback with test fixtures. Keep scene playback skippable and paused correctly. |
| 3 | Build one responsive ready-room UI and wire BRIEFING, ROSTER, CONTINUE and BACK to existing paths. For ROSTER, obtain the selected Prologue carrier pool explicitly; the current `rosterServiceHtml` reads `game.mstate.rosterKey` and must not be called with a stale or absent mission. If the roster is disabled, render the existing legacy CREW statuses read-only. Keep Job C's NEXT MISSION and ending route direct; test keyboard and touch navigation. |
| 4 | Integrate the approved room image, existing portraits, opening and 12 scene files; check per-scene paths, compressed size, opening replay/`?go` bypass, and correct return after normal end, skip, malformed or missing content. Review the after-loss state on screen, not just as JSON. |
| 5 | Run the project gate and focused branch/scene tests; capture desktop and iPad-sized screenshots, check caption wrap/focus and report copy/download, then reserve time for fixes. Ask the owner for a real iPad landscape pass and a first unaided playthrough; report those as unverified until actually done. |

### Data and art only after approval

- Put each approved block in `assets/scenes/<id>/scene.json`; the twelve IDs match Job C's `p01_before` … `p04_after_lose` names. Put the opening in `assets/scenes/prologue_opening/scene.json`. Set `music` to null. `build.py` on Job C indexes scene IDs with a `scene.json`; rebuild after adding them. This design branch itself adds no scene files or images.
- Produce one approved `assets/scenes/shared/bg_ready_room.webp`; reuse the cited intro-test portrait and space files. Copying existing assets into every scene folder would technically satisfy today's per-scene loader but would duplicate payload and risk drift. Prefer the shared-loader change below. Record generated-asset provenance and measured compressed size according to `docs/ART_CREDITS.md` and the existing credit rules.
- Select dynamic variants into an in-memory copy of ordinary scene events before playback. The safe generic text in each file remains readable if no context is available; raw JSON does not pretend to support `if`, arbitrary variables, or new event types. Persist no dialogue outcome or character relationship.

### Code needed; no code is implemented here

1. **Job C integration.** Start from or merge `codex/prologue-flow` through the lead. Its `beforeMission` and `afterMission` hooks already name the twelve IDs, skip missing indexed scenes and return to the briefing/debrief. Extend the hook invocation to pass the intended mission and an immutable, bounded context: pre-sortie assignment/status, post-sortie participant statuses, outcome, grade and nullable player-death-cause. The current before hook can run before the new `game.mission` and roster exist; use a neutral Imani-only version when actual future assignment is unknown. After hooks run before the debrief, with the just-ended `game.mstate` still available. Preserve callbacks on normal end, skip, failed loading and `?go`.
2. **State-safe scene preparation.** Implement the deterministic t=8/t=15 replacements and Hawk fallback in §2. In roster mode do not equate “slot 0 is occupied” with the named Hawk; compare actual identity, not a generic callsign. Suppress both the Hawk head and speech if identity or availability is uncertain. Distinguish KIA, MIA, captured and recovering; use the neutral fallback if data is absent. Resolve from the frozen context once so a loss/retry or late scene callback cannot re-read a different mission. Avoid unescaped HTML and test long names/unknown grades.
3. **Shared presentation assets.** Today's `preloadSceneAssets` searches under each scene ID and hard-codes three character directories; the `../shared/` background can resolve as a relative path, but the portrait/legacy-head and `ui_frame.png` lookups still need either shared-path support or deliberate packaged copies. Add a single shared asset lookup/cache and optional-asset fallback; do not claim the current player already has a general shared library. Keep the same approved Imani/Hawk files across all 12 scenes, and do not show the existing painted face as a roster substitute.
4. **Text-only playback and layout.** `music: null` alone does **not** silence the current player: `updateSceneElements` calls `playSceneBlip` while typing. Add a per-Prologue-scene silent playback option, including transition sounds, without changing unrelated scenes. Preserve SKIP/keyboard/touch and the two-line read time; make full text available to assistive technology, support instant text/reduced motion, and resize/reflow long or translated text instead of drawing beyond the canvas. The current player paints fixed-width 320 × 200 text and does not provide all of these features.
5. **Hub and opening.** The ready room, its return route, the opening trigger/replay and the proposed ending copy are new UI work; the existing Job C branch does not already implement the room or opening. Use actual Job C progress and session totals; do not create a second campaign save or override debrief/briefing facts. `COPY REPORT` delegates to Job A when present and retains Job C's fallback/download. Opening skip targets briefing step 1 and its inline `p01_before` (or its text fallback if the scene is absent); tests for `?go` and `?scene=` must show no opening delay.

### Explicitly out of scope

No new ships, boarding, mission objectives, branch mechanics, performance/balance tuning, player-controlled hub navigation, talking-head AI, voice acting, new cast beyond the optional unapproved Sparrow portrait, extra rooms or 16-mission expansion. No plot is advanced after a loss as if it were a win. No new canonical explanation is implied by the art or by the generic record presenter. No network telemetry or automatic report upload.

### Verification and owner decisions

- Walk all 12 scene IDs, both scene-end and skip paths, missing/corrupt scene assets, and opening bypass on direct debug URLs. Check all `say` lines complete and wrap; test at least one active-Hawk case, Hawk absent, replacement roster pilot, both wing slots unavailable, KIA vs MIA/recovering, player loss with each available cause, objective failure with no cause, each win grade, and unavailable/stale context. In every case, a missing pilot must not speak and a loss must not become a win.
- Run keyboard and 1180 × 820 touch-viewport checks for room, roster return, debrief → next briefing, mission-4 ending and report fallback. Test the combined A/B/C branches as well as this content. Check that loading assets does not write reports, send telemetry, or expose private data. Run `python3 tools/gate.py` before any push or merge. Headless touch emulation is not an iPad.
- Owner decisions requested at review: approve/alter the ready room and Imani command-feed convention; choose whether the opening is automatic for an untouched Prologue; approve or replace the reused portraits and writing; accept the one-image production scope and the optional state-adapter code. The owner—not this design—decides whether to build it.

# Cut scenes (Wing Commander II style): research and design

Status 2026-10-21. Research and proposal only; no game code changed. Owner constraint (2026-10-21): scenes are **text only**
(typewriter, optional blips); no synthesized voice; music may come later (menu switch), so the format carries only a music cue hook.
Prototype: `docs/prototypes/cutscene_poc.html` (+ `cutscene_poc.png`).

## 1. What WC2 actually did (and how well I could verify it)

Web access was patchy (two Hardcore Gaming 101 pages returned maintenance notices; the wcnews pages were thin). What is supported:

- **Origin Systems, released 7 Sep 1991 (MS-DOS), director Stephen Beeman, producer Chris Roberts.** The story is told through
  "sprite-animated cutscenes" and early voice acting; a separate **Speech Accessory Pack** added recorded speech to plot-important scenes
  [Wikipedia, WC2](https://en.wikipedia.org/wiki/Wing_Commander_II:_Vengeance_of_the_Kilrathi); [wcnews WCPedia WC2](https://wcnews.com/wcpedia/WC2).
- **Scene vocabulary from the 1990 art plan**: talking close-ups for every pilot and named NPC, plus cockpit vidscreen views; **pose sets for
  sitting/standing characters in specific rooms** (Peel Rec Room, Concordia Rec Room, generic office); a *reusable generic* talking-head
  animation ("drawn so the generic talking closeup animation can be reused"); a generic riveted ship-wall behind close-ups; room backgrounds
  (rec rooms, barracks, bridge, O-deck with starfield wall, sickbay, flight deck, briefing room, throne room); background crowd figures; a group of
  pilots for an awards ceremony; external ship views for the launch sequence; a logbook console for save-game; **2-3 animations per "midgame"
  story sequence**; a TV animation reused from Ultima 6; WC1 material (briefing room, funeral) reused
  [wcnews WC2 Art List, 29 Nov 1990](https://www.wcnews.com/wcpedia/Wing_Commander_II_Art_List). Caveat: this is an anticipation list written
  before production; the shipped game differs.
- **Tools**: cockpits and talking heads were drawn in DeluxePaint; ships were sprites pre-rendered in early 3D software (3D Studio for WC2)
  [wcnews art article](https://www.wcnews.com/news/update/11149). So WC2's cut scenes are hand-painted 2D with few frames, not a 3D engine.
- **Rec-room/briefing function**: routine bar talks, briefings and debriefings were "often replaced with casual interludes, dramatic exchanges, and
  emergency events" [WCPedia WC2]. WC1's bar had the bartender and pilots talk before missions; the bartender reflects how the war is going;
  wingmen have personalities that affect flying; medals/promotions for performance; a captain's report after missions
  [Force for Good review of WC1/2](https://forceforgood.co.uk/simulation/wing-commander-1-and-2/). That review also says WC2 introduced the
  movie-style approach, and that "the characters barely move".
- **Structure**: WC1 has a win/lose branching mission tree and permanent wingman deaths, with a "Game Over" funeral cutscene
  [Wikipedia, WC1](https://en.wikipedia.org/wiki/Wing_Commander_(video_game)). WC2's tree is "much more structured"; wingmen mostly eject, some die
  in scripted scenes [Wikipedia, WC2]. Per the planning notes, some pilots (Shadow, Downtown, Dallas) were scripted to die
  [wcnews WC2 Characters](https://www.wcnews.com/wcpedia/Wing_Commander_II_Characters), again a pre-release plan.
- **Not confirmed from sources I could open**: exact portrait resolution/frame counts, whether WC2 itself has a medal ceremony (the art list
  mentions an awards group; Wikipedia says the player "can no longer be promoted or awarded medals"), the carrier-bridge nav-map details of WC2,
  and the launch/landing sequence mechanics. My description of lip-flap (a handful of mouth frames over a still face) is common knowledge about
  the era, not something these sources state.

**TIE Fighter (1994)**: briefing room with a **mission map animating vessel positions and flight patterns**, a flight officer with optional Q&A, and
sometimes the Emperor's Inner Circle figure giving a second briefing with secondary objectives; mid-battle story cutscenes unlock only when the
mission is completed; quality "from excellent to disappointing", blocky close-ups [Wikipedia, TIE Fighter](https://en.wikipedia.org/wiki/Star_Wars:_TIE_Fighter);
[GameBytes review](https://www.ibiblio.org/GameBytes/issue21/editor/tierev.html). Correction to the brief: the "film" in TIE Fighter is the
**replay Film Room** (any-object camera, free camera), not a cutscene style. The story rides on briefings, debriefs and in-flight comms.

**FreeSpace 2**: three parts: optional command briefing (one text block and one 2D animation per stage), mission briefing with **per-stage saved
camera view, ship icons (labelled, IFF-coloured, highlightable), text and optional voice file, static-burst transitions between stages**, and
debriefing with stages gated by conditions, recommendations, music chosen by outcome [Hard Light wiki, Briefing](https://wiki.hard-light.net/index.php/Briefing).
The per-stage "camera + icons + text" model maps directly onto our nav-map briefing.

**Takeaway**: WC2's look is cheap by construction: few reused painted frames, strong staging (a room, two faces, a text box), and
the story consequences of state (who is alive, did you win). The effort belongs in the writing and state hooks, not in rendering.

## 2. Scene types and ties to existing state

State sources already in `src/75_mission.js`: `CREW[k] = {kills, sorties, status:'active'|'recovering'|'KIA', notes[]}`, `PILOT_DEFS`
(Hawk: dry humour, hates FROGGs; Sparrow: rookie, talks when nervous), `game.mstate.result`, `missionStats()` (score, accuracy, grade), `killLog`.

| Scene | Trigger | Reads | Writes |
|---|---|---|---|
| Briefing + nav map | mission start (replaces the text panel in `showBriefing`) | mission data (nav points, spawn bearings), CREW roster | none |
| Lounge / bar banter | between missions, after debrief | CREW status/kills/notes, last result, grade | CREW notes, flags (e.g. `note:'cautious'`) |
| Pre-launch flight deck | before the sortie | loadout, wingmen present | none |
| Debrief with medals/kill board | `endMission` (replaces `showDebrief` panel) | `missionStats()`, killLog, CREW | medal list in CREW (new field) |
| Wingman KIA memorial | a pilot `status` becomes 'KIA' | that CREW record, kills, notes | none |
| Jump-transit interlude | existing `transit`; add optional `scene` | transit lines already exist | none |
| FROGG intelligence footage | mission stage action, grainy "recovered feed" | mission data | flags |

Note an existing wrinkle: `onShipDestroyed` marks 'recovering' 70% / 'KIA' 30% at random. A memorial scene should key off the KIA outcome, and the
lounge scenes need conditions on `status` (a KIA pilot's lines and portrait drop out). Recovering pilots should appear with a bandage variant or be absent.
Also the lore (`docs/LORE.md`) says FROGG pilots are neuro-slaved and cannot eject; "enemy intelligence" scenes can use that.

## 3. Rendering options

| | Cost | Look | Verdict |
|---|---|---|---|
| (a) DOM/CSS scenes with generated art | lowest; no WebGL context juggling; ~0 KB assets | flat; clean text and choice UI, mobile layout is trivial | UI layer for everything |
| (b) Our voxel pipeline: busts and rooms | medium: bust is a small data table + 2D canvas projection (PoC does this in ~60 lines); a room diorama with a second Three.js camera costs renderer/scene management and a bake per scene | consistent with the game's voxel identity; **not** WC2's painted look, closer to a Minecraft-portrait style | portraits yes; rooms as CSS/canvas backdrops, 3D diorama only for flight deck |
| (c) Pre-rendered stills from headless screenshots | zero runtime cost but each still is 30-150 KB as WebP/JPEG; 10 stills = 0.5-1 MB base64 | best-looking ship shots | only for a handful of hero shots (carrier exterior, Gulper); optional |
| (d) AI-generated art | high consistency risk across frames (lip-flap needs frame-matched variants); licensing of generated output is unsettled and tool terms differ; large images break the single-file limit | potentially closest to painted WC2 | not recommended for core; at most owner-supplied stills loaded via URL |

**Recommendation: (a) for layout, text and set dressing, plus (b) for portraits** (2D canvas projection of small voxel heads, as in the PoC),
and a live in-engine view for flight deck / transit / briefing map (reusing 77_cine cameras and the real ships, which is already the best-looking
asset we have). No AI art, no image payload in the base file.

**Honest assessment of closeness to WC2:** staging, pacing, text box, choice menus, state-dependence and the "two faces and a window" composition can
match. What it cannot match: WC2's hand-painted faces and rooms (the PoC heads look like mannequins; they read as stylised, not as people), expressive acting
(WC2 had few frames too, but each was drawn by an artist), and full voice. Our faces will carry less emotion per frame; the writing has to carry it.
A 5-6 frame set (closed, 2 mouth shapes, blink, plus one "emotion" variant per character such as angry/worried) is the realistic ceiling for the first cut.

## 4. Data format (hand-authorable)

Scene data lives beside missions (`M.scenes`) or in a `SCENES` table; plain objects, no classes. The PoC uses exactly this shape:

```js
SCENES.lounge_m2 = {
  set: 'lounge',            // CSS/canvas backdrop id in SETS (window, planet, bar, ribs)
  music: 'cue:lounge_low',  // hook only; no audio implementation here
  cast: { L: 'hawk', R: 'sparrow' },          // slot -> CREW key; absent/KIA pilots are skipped
  if: { result: 'win' },                      // optional entry condition on mission result/grade
  lines: [
    { id:'a', who:'hawk', say:'...', mood:'dry' },                       // mood -> portrait variant
    { id:'b', who:'sparrow', say:'...', if:{ status:{ sparrow:'active' } } },
    { id:'ask', who:'sparrow', say:'...', choices:[
        { t:'text', goto:'brave', set:{ note:'confident' }, if:{ minKills:{ hawk:5 } } } ] },
    { id:'out', who:'hawk', say:'...', end:true } ] }
```
Rules: lines run in order unless `goto`; a line whose `if` fails is skipped; `choices` block until picked; `set` writes `CREW[*].notes` or a global
`flags` object persisted next to `gs_crew`; `end:true` finishes. Optional per-line fields: `cam` (named framing for live scenes), `fx` (`'cut'`,
`'static'`, `'fade'`), `sfx`. Conditions are a small fixed vocabulary (`status`, `minKills`, `result`, `grade`, `flag`), evaluated by one function.
Briefing stages reuse the FreeSpace idea: `stages:[{ cam:[x,y,z], look:[x,y,z], icons:[{id,pos,label,iff}], text }]`, rendered in a 3D/2D map.
Authoring flag: `?scene=lounge_m2` boots straight into that scene with stub CREW (`&crew=sparrow-kia` to test branches; the PoC supports `?crew=sparrow-kia`
and `?fast` for the harness; `window.__sceneDone` signals completion to Playwright). Proposed validator: a headless walk that follows every `goto`
and reports unreachable or dangling ids.

## 5. Voice

Deferred by owner decision: text only for now (typewriter, optional blips; the PoC uses a WebAudio square blip, created only after a user gesture to avoid the autoplay warning).

## 6. Budget, mobile, skip, accessibility

- **Size**: current `index.html` is ~312 KB. Scene engine (typewriter, choice menu, portraits, conditions) ~6-9 KB minified-equivalent source;
  voxel bust data ~2-3 KB per character if procedural; each scene's text ~1-2 KB; 10 scenes ~15 KB. Target: **under 40 KB total** for slice 1-3.
  Stills (option c) are the only thing that could blow the budget; cap at 150 KB total. These are estimates, not measured against the real build.
- **Mobile**: the PoC letterboxes to 16:10, which wastes the screen on a phone in portrait (see test at 390x844: stage is a thin band, hint text
  overlaps the window). Real implementation: portrait layout stacks portraits above a bottom-anchored text box, 44 px minimum choice targets,
  tap-anywhere to advance, no reliance on keys. Landscape phone (844x390) leaves ~120 px for the text box; use a two-line box and smaller portraits.
  iPad layout must not change (AGENTS.md); scenes are a new overlay (`#scene`), so the existing `#brief` panel stays untouched.
- **Skip/fast-forward**: first press completes the current line, second advances; `S`/Esc/long-press skips the scene (choices take a default branch
  or `skipDefault`); a global "skip all scenes" setting and "seen" flag per scene id in localStorage so repeats are skippable at once. Scenes must
  never block mission restarts.
- **Accessibility**: `aria-live` on the text box (PoC), full text appears instantly under `prefers-reduced-motion` and a "text speed: instant" option,
  no information conveyed by portraits alone, keyboard 1-9 and tab-focus for choices, contrast check of #c8f5e2 on dark panel (high), blink disabled
  with reduced motion, subtitles/captions unnecessary as there is no audio.

## 7. Phased plan

1. **Slice 1, lounge scene (1-2 days)**: `#scene` overlay, scene player (typewriter, skip, choices, conditions, flags), voxel bust renderer from the PoC,
   one backdrop, scene between debrief and next mission; `?scene=` flag; headless walker test. Already feels like WC2: two faces, window, branching line.
2. **Slice 2, KIA memorial and debrief (1-2 days)**: medals/kill board using `missionStats()`; memorial scene triggered on KIA; CREW gets `medals`,
   `flags`. Needs a decision on the random 30% KIA rule.
3. **Slice 3, nav-map briefing (2-3 days)**: replace the text briefing with staged map (live Three.js camera over a flat grid with icons from mission data,
   static-burst between stages, text per stage); first version can be 2D canvas.
4. **Slice 4, flight deck and transit scenes (2-3 days)**: reuse the 77_cine cameras on the real ships; add `scene` hook to `transit`.
5. **Slice 5, polish (open)**: mood/blink variants, FROGG footage filter (scanlines, static), 4-6 more scenes of writing.
Total about 8-12 working days including writing; writing time is the unestimated part.

**Risks**: (1) the mannequin look of voxel heads could undercut tone, so test with the owner before building more; (2) writing volume and
continuity with randomised KIA; (3) state bloat in `gs_crew` and save-migration; (4) two overlays (`#brief`, `#scene`) fighting over pointer lock
and state (`'brief'`, `'cine'`, `'done'`); (5) phone performance of per-frame canvas redraw (PoC redraws ~1.5k voxels per frame at 60 Hz, measured
only in headless Chromium; redraw only on pose change to be safe); (6) briefing-map camera cost if it shares the main renderer.

## 8. Prototype and verification

`docs/prototypes/cutscene_poc.html`: self-contained, no CDN, two voxel busts (projected on 2D canvas, mouth frames and blink), CSS lounge set,
typewriter with blips, a 3-way choice menu (mouse or 1-3), SPACE/click to advance (completes line first), S/Esc skip, `?crew=sparrow-kia`, `?fast`.
Verified headless (Python Playwright, Chromium, port 8767): loads with **zero console errors/warnings**, reaches the choice menu, chosen branch
completes with the expected path, skip works, 1280x800 screenshot in `cutscene_poc.png`; a 390x844 run also loads. Not verified: real-device
performance, audio output, iPad touch behaviour.

## 9. Unverified or open

WC2 launch/landing mechanics, portrait frame counts, medal scenes in the shipped game, and the WC2 carrier-bridge map details; whether FreeSpace 2
camera interpolates between stages (the Hard Light page gives saved views and a static-cut flag only); size estimates; the voxel faces' acceptability to the owner.

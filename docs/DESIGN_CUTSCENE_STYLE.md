# Cutscene style and cast — proposals for owner selection

**Status:** the owner selected **Direction C** for its gritty look on 2026-11-03.
This approves the starting art direction only; individual cast designs, queen
anatomy, storyboards and production assets remain proposals for review. No
cutscene or gameplay implementation is approved by this document. The eight PNGs in
`assets/proposals/` are AI-generated concept studies made for this project with
OpenAI image generation; they are not runtime assets. They contain no intended
likenesses, borrowed characters or copied game art. Review all art, including
hands and costume continuity, before using it. No owner reference images were
available in this checkout; the owner subsequently approved proceeding from the
written brief and requested stockier, bulkier dragon-like FROGGs.

## Choose a visual direction

| | Sample | Direction | Strength / trade-off |
|---|---|---|---|
| A | [Cockpit / ejection](../assets/proposals/direction-a.png) | **Ink and warning light.** Restrained navy and amber, confident outlines, large black masses, faces close to camera. | Strong expressions and character identity. Simplify the busy instruments for a small display. |
| B | [Capsule / recovery](../assets/proposals/direction-b.png) | **Service-record engraving.** Charcoal, ivory and copper-red, coarse ordered grain, harder industrial silhouettes. | Clearest low-resolution staging and the most tactile hardware. Human skin and expression need warmer accents. |
| C | [Capture / interrogation](../assets/proposals/direction-c.png) | **Hive chiaroscuro.** Olive-black silhouettes, cyan heat seams, rust-orange reflected light, deep environmental negative space. | Strong contrast between factions and strong atmosphere. Keep faces larger than this wide composition on phones. The slender commander in this early palette study is superseded by the bulkier cast concepts. |

The owner chose C for its gritty atmosphere. Carry its hard shadows, low-key
lighting and restrained faction colours into future studies while retaining
the 320×200 readability and stocky, bulky dragon-like FROGG silhouettes shown
in the revised cast sheet. The slender commander in the early C frame is not
the target build. None of these concepts is an imitation of a particular
franchise image or character.

## Shared art rules

- **Humans:** ink `#101820`, deep navy `#26384A`, steel `#738694`, bone
  `#D6D5BE`, skin/accent range chosen per character, rescue amber `#DA8A37`.
  Warning red `#E14D39` is reserved for danger; make it legible in grayscale too.
- **FROGG:** near-black `#131719`, graphite `#363F40`, scale olive `#606B55`,
  cyan coolant `#55C4C5`, kiln orange `#B65E2F`. Orange and cyan belong to
  heat/coolant and command lighting, not randomly scattered decoration.
- **Ink and shade:** outer contours approximately 2–3 logical pixels at a
  320×200 design canvas; facial landmarks 1 pixel, no high-frequency crosshatch
  on eyes. Use three principal values plus one accent; one dominant hard-edged
  shadow and a restrained rim light. Dither only in broad background gradients.
- **Camera:** one readable action per shot. Prefer medium close-ups for speech,
  clear over-shoulder reverses for interrogations, and a stable wide establishing
  shot before close action. Place eyes around the upper third. Avoid extreme
  lens distortion or constant camera movement. Design against the full 320×200
  composition even if a wider screen gets additional side art.
- **Frame and captions:** use a 16:10 art safe area with optional narrow
  letterboxing; never bake dialogue, rank, callsign or UI into art. Put captions
  in a separate high-contrast panel, 1–2 short lines, with speaker identity also
  indicated by portrait/label. Captions must scale as UI text, support wrapping
  and contrast, and never cover an essential face or action.
- **Transitions:** cut for impacts and decisions, short dissolve for passage
  of time, slow held push only on large readable stills. Use a restrained brief
  warning flash, never full-screen repeated strobes. A shared beacon shot joins
  outcome branches; only branch after the capsule is established.
- **Phone readability:** verify each frame at 320×200, 390×844 and 844×390;
  ensure a face and the primary action survive a thumbnail view. Reframe rather
  than shrink text. Preserve safe areas for notches, controls and captions.

## Cast studies

The sheets show **two alternative concepts per role**, not final identities.
Within each row, left = 1 and right = 2. They are original design proposals;
expressions, costume marks and gender presentation may be changed. No name is
assigned to any character here.

| Role | Visual options | Design distinction / further work |
|---|---|---|
| Player pilot, customisable | [Pilot sheet, row 1](../assets/proposals/cast-pilots.png) | 1 helmeted, rounded visor and broad cheek plates; 2 unhelmeted, angular brow and high collar. These are different customisation examples, **not a matched helmet-off portrait of one person**. Produce matched helmet-on/off pairs for each selected player option later; keep visor, collar and harness recognisable. |
| Wing leader | [Pilot sheet, row 2](../assets/proposals/cast-pilots.png) | 1 broad, weathered face and squared collar; 2 short light hair and narrow profile. Both read as experienced without relying on a rank label. |
| Recurring wingman one | [Pilot sheet, row 3](../assets/proposals/cast-pilots.png) | 1 slim profile and round eyewear; 2 broader profile and close hair. Test both without glasses/visor glare at thumbnail size. |
| Recurring wingman two | [Command sheet, row 1](../assets/proposals/cast-command.png) | 1 dark hair, compact chin and helmet carried at side; 2 copper hair and higher collar. Distinguish from wingman one by outline as well as colour. |
| Carrier captain | [Command sheet, row 2](../assets/proposals/cast-command.png) | 1 square posture and heavy epaulettes; 2 compact silhouette with swept-back hair and a narrow high collar. Insignia are placeholders, not approved ranks. |
| Intel / briefing officer | [Command sheet, row 3](../assets/proposals/cast-command.png) | 1 glasses and restrained desk pose; 2 dark asymmetric hair and angular collar. Both should be credible working officers, not exposition icons. |
| SAR transport pilot | [SAR / FROGG sheet, row 1](../assets/proposals/cast-sar-frogg.png) | 1 compact collar and rescue harness; 2 heavier shoulder rig and stubble. Retain rescue orange as a functional identification mark. |
| FROGG commander | [SAR / FROGG sheet, row 2](../assets/proposals/cast-sar-frogg.png) | 1 wide jaw, rust mantle and layered brow; 2 broad neck, sharper brow plates and dark armour. Both are stocky and intelligent, with controlled posture rather than animal snarling. |
| FROGG capture soldier | [SAR / FROGG sheet, row 3](../assets/proposals/cast-sar-frogg.png) | 1 bulky utility armour and compact horns; 2 heavy collar and wider shoulder plating. Their equipment should read as capture gear, not generic human infantry. |

**Additional queen concept:** [Hive queen and egg sac](../assets/proposals/hive-queen.png).
A large low, broad quadrupedal matriarch with lamellar plates, an asymmetric horn
crown and a connected, ribbed egg sac. Scale against a worker and anchor the sac
in a warm life-support chamber. This is a concept for discussion, not a canon
biology decision; simplify the intricate background and eggs for game-sized art.

## Storyboard — maximum six shots per outcome

[Thumbnail sheet](../assets/proposals/storyboard-thumbnails.png): four rows,
four panels per row, left to right. These are **sketches of staging**, not
final shots or evidence of implementation. Existing game outcomes are not
changed by this proposal.

### Shared ejection (sheet row 1)

1. **E1 — cockpit damage:** close on pilot, damaged canopy and critical warning.
2. **E2 — decision:** gloved hand reaches for the guarded ejection control.
3. **E3 — separation:** exterior silhouette; capsule clears the failing ship.
4. **E4 — beacon:** capsule against empty space, one clear locator flash.

E1–E4 are reusable in all three following branches, including a wingman or
player where framing and identity permit. Adapt the portrait to the selected
pilot; never imply that a customisable player has the wrong face.

### Recovered by wing / SAR (row 2)

1. **R1:** wing cockpit sees E4's beacon and calls its location.
2. **R2:** rescue cutter approaches, wing ship holds cover.
3. **R3:** magnetic grapple closes around the capsule; no floating machinery.
4. **R4:** trauma-bay close-up; medic checks a conscious survivor.

### Captured (row 3)

1. Reuse **E4**; replace the distant contact with an alien silhouette.
2. **C1:** FROGG ship eclipses the beacon.
3. **C2:** bulky capture team secures the capsule inside a bay.
4. **C3:** commander and restrained pilot in an asymmetric interrogation
   two-shot; no torture or graphic injury is needed.

### Player ejects with no friendlies (row 4)

1. Reuse **E4** without the friendly response.
2. **N1:** cockpit/visor view of an empty radar and decreasing life support.
3. **N2:** restrained close-up; a gloved hand steadies the beacon switch.
4. **N3:** long quiet capsule silhouette. End with an unresolved state until
   the game resolves rescue, capture or loss; do not imply a guaranteed death.

## Technical plan — not implemented

1. After selection, paint a limited set of reusable backgrounds and foreground
   plates, plus matched character busts/helmet variants. Keep dialogue and
   mission state outside the images. Prioritise 4:3/16:10 safe composition.
2. Prototype stills as WebP; compare a small embedded set with the present
   external-assets approach. **Single-file option:** generate a build-time JS
   manifest with base64 image data and load images lazily; never hand-edit the
   generated `index.html`. **Procedural option:** render simple panels, fades,
   captions and limited parallax in Canvas/SVG; do not procedurally redraw
   nuanced faces. Both are proposals pending owner approval and device tests.
3. Budget proposal: 8–12 reusable backgrounds at 80–150 KB each, 8–12
   portraits/foregrounds at 30–80 KB each, plus 200 KB for UI/metadata;
   target **under 3 MB compressed asset data**, approximately 4 MB base64
   before HTML overhead. Produce a measured build report before committing
   production assets; this proposal's PNGs are review masters, not the budget.
4. Decode only the current and next frame, reuse textures, cap parallax layers,
   avoid per-frame filters and particle-heavy overlays, pause hidden scenes,
   support skip and reduced motion, and test actual iPad/phone memory and
   subtitle legibility. Avoid autoplay-dependent audio; obey existing volume
   and accessibility settings.

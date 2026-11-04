# Between-mission interiors — visual proposals

**Status: proposals for owner review, not implementation approval.** Direction C in [the cutscene study](DESIGN_CUTSCENE_STYLE.md) is the starting point: hard ink shadows, olive-black and graphite, restrained cyan and rust-orange functional light. Human spaces are cramped, repaired and materially poor: exposed conduits, mismatched replacement panels, chipped paint and equipment kept in service. No polished luxury carrier. Characters and props must remain legible against large dark shapes. Any FROGG appearing in later work must follow the stocky, bulky cast sheet; the early slender Direction C figure is superseded. No queen or egg-sac design is part of this proposal.

## Room studies

Each sheet reads top to bottom. These are concept illustrations, not registered production layers; repaint and align a chosen design before using overlays. The base is the first panel, with state alternatives below it. The art establishes atmosphere and navigation, not a canonical ship plan.

| Room | Sheet | Base and state proposals | Hotspots |
|---|---|---|---|
| Briefing | [Scene sheet](../assets/proposals/interiors-briefing.webp) | Staffed table; liaison present; liaison absent with an empty place. A removable character plate is preferable to two full backgrounds. | Table opens briefing/map; liaison opens optional conversation. |
| Flight deck | [Scene sheet](../assets/proposals/interiors-flight-deck.webp) | Serviced fighter; damaged bay with repairs; depleted bay with empty cradle. Damage and stores are separate visual signals. | Fighter opens fleet/stores; deck crew opens condition details. |
| Ready room / mess | [Scene sheet](../assets/proposals/interiors-ready-room.webp) | Occupied mess; empty seats; quiet depleted mess and memorial wall. Absence should be understated, never a generic punishment screen. | Table opens roster; wall opens names and service records. |
| Bridge / CIC | [Scene sheet](../assets/proposals/interiors-cic.webp) | Staffed bridge; patched battle damage; low power and emergency lighting. | Chart table opens map; command station opens fleet status. |

Use the 16:10 central safe area from the cutscene direction, extending the sides for wide screens. Keep interactive silhouettes away from screen edges and reserve a clear UI region. A state is explicitly selected by campaign data in a future implementation; these pictures do not define game rules. Room changes should retain recognizable camera anchors, not suggest the ship has been rebuilt between visits. Characters are separate and optional, never baked into a required interaction target.

## Hub interaction and responsive wireframes

[Phone portrait](../assets/proposals/interiors-wireframe-phone-portrait.svg) · [phone landscape](../assets/proposals/interiors-wireframe-phone-landscape.svg) · [tablet](../assets/proposals/interiors-wireframe-tablet.svg) · [desktop](../assets/proposals/interiors-wireframe-desktop.svg). Each sheet presents five possible views left to right; these are separate screens, not a five-screen strip intended for a device. Labels are schematic and data is illustrative.

- **Hub:** room art with named hotspots and a persistent text navigation alternative. Hotspots expose their purpose on focus; a visible list makes every destination discoverable without hunting in the art.
- **Roster / service record:** pilot list with status, selection, rank, missions, victories, citations and medal details. Distinguish unavailable, missing, captured, recovering and lost in text as well as iconography. The memorial opens a respectful record, not an assignment action.
- **Fleet / stores:** switch among ships, pilots and ordnance; show available, assigned and unavailable counts with condition and a selected item’s details. The proposal does not specify resource consumption or introduce a new economy.
- **Nav-map briefing:** route, objective and threat markers accompanied by a readable textual briefing, risk and launch action. Map symbols have labels and a list equivalent; no essential fact depends on pan or colour.
- **Debrief:** outcome and objectives first, then losses, pilot status and awards/citations, with a clear continue action. Avoid implying a casualty is recoverable when the recorded state says otherwise.

On portrait phones, stack list and detail, scroll the content region and keep navigation and the primary action reachable. In landscape, use two panes but collapse secondary detail before shrinking text. Tablet and desktop can show list and detail together. Use safe-area insets, reflow for enlarged text and localised strings, and target at least 44 CSS pixels for touch controls. Keyboard focus order follows the visual order; Escape/back returns to the hub. Hotspots have accessible names and visible focus, and panels expose headings and status changes to assistive technology. The wireframes are not tested layouts.

## Decorations and rank

[Decoration and insignia sheet](../assets/proposals/interiors-decorations.svg) is original geometric concept art: woven, muted ribbons and worn metal, with strong light/dark shapes. The first nine correspond in order to the existing roster database: First Contact, Ace Star, Double Ace, Veteran Ace, Wound Ribbon, Rescue Cross, SAR Cover, Return from Captivity and Last Light Citation. The last three, Fleet Defence, Long Retreat and Distinguished Service, are **visual proposals only**; their names, eligibility and existence are not game rules. Differentiate final award silhouettes and ribbon patterns further before production; colour alone is insufficient. Show name and citation beside each icon, including a textual empty state.

The five proposed rank marks preserve the database’s current symbolic progression: Ensign `|`, Lieutenant JG `||`, Lieutenant `|||`, Lt. Commander `◆|`, Commander `◆||`. Shapes are stylised as cloth bars and a diamond and must remain distinguishable in monochrome and at small sizes. Rank labels remain text. The sheet is a design study, not an official insignia decision.

## Technical plan — no code in this branch

1. Paint four registered base backgrounds after selection, with transparent foreground, character and state plates sharing fixed camera anchors. A room state should assemble from base plus small changes; use a full replacement only when damage changes architecture. Pack decorations and rank marks into a small atlas with metadata; retain accessible text outside the art. Author at a higher resolution, export to measured WebP or another supported format, and compare quality at target size. The review sheets are not runtime crops.
2. Budget within the cutscene proposal’s **under 3 MB compressed total art target**, rather than adding another unrestricted allocation: provisionally four bases at 100–150 KB (400–600 KB), shared state/character plates 300–500 KB, decoration atlas 50–100 KB and UI metadata 50 KB. This leaves roughly 1.75–2.2 MB for the cutscene backgrounds and portraits. Base64 expands bytes by about one third: 3 MB becomes approximately 4 MB in the generated HTML before markup. Measure actual encoded and decoded sizes and visual quality before approval; budgets are targets, not measured results.
3. Generate a build-time asset manifest from source files and embed data in the existing single-file build; do not hand-edit `index.html`. Lazy-create images for the current room and next destination, release offscreen decoded images when appropriate, reuse textures, and cap resolution by device pixel ratio and memory. The single HTML still downloads its embedded bytes up front; lazy decoding reduces peak decoded memory, not transfer size. Feature-test format support and choose a build-time compatible fallback rather than fetching external files.
4. Use at most a background and one foreground parallax plane, with subtle opacity-only practical lights; avoid continuous filters, expensive blur and particle effects. Cut or use a short dissolve between rooms, preserving focus and navigation state. Reduced-motion preference disables parallax, flicker and animated transitions; manual override should be available. Never use repeated full-screen flashes. Pause animation in hidden tabs and when covered by a panel.
5. Profile actual iPad and phone devices in both orientations: load time, HTML transfer size, first decode, peak memory, frame time and thermal behaviour after repeated room changes. Test low-memory fallback as a static base, touch targets, zoom, screen reader order, keyboard navigation, contrast and 320×200 composition. Validate on desktop too. These are planned checks, not completed results.

## Provenance and review

The four scene sheets were generated for this proposal using OpenAI's built-in image generation from prompts describing each room, three states and Direction C. They are original concept studies, not production assets. The wireframes, decorations and rank sheet are original vector diagrams created for this proposal. Inspect scene continuity, hands, equipment attachment and readability before selecting or shipping any image. No gameplay, hub code or runtime art is changed here.

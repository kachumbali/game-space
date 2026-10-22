# Cut scene art: prompt pack for image models

Purpose: you generate the graphics with a vision/image model; I wire them into the text-only scene system (`docs/CUTSCENES.md`) or rebuild them as
voxels from your approved images. Prompts are written to be pasted as-is. Everything marked **[STYLE]** is the shared style block (paste it at the
start of every prompt, unchanged, so the set stays coherent). Nothing here has been run through a generator; expect to iterate.

## 0. Decide first: style A or B (pick one for the whole set)
- **A. Early-90s VGA painted look (recommended).** Hand-painted, dithered shading, limited palette, chunky detail: the Wing Commander II feel, hides
  AI inconsistencies, compresses well, and converts cleanly to voxels or pixel-snapped art.
- **B. Modern painterly concept art.** Richer, but faces and rooms drift between generations and files are larger.

### [STYLE] block, version A (paste at the start of every prompt)
```
Early 1990s PC adventure game illustration, hand-painted look with visible dithering and a limited palette of about 32 colours, slightly grainy CRT softness,
hard science fiction, cold industrial military space carrier interior, practical lighting, teal and slate steel with amber warning lights, no fantasy elements,
no text, no logos, no watermark, no signature, clean composition
```
### [STYLE] block, version B
```
Grounded hard science fiction concept art, digital painting, muted teal, slate and amber palette, practical lighting, filmic but restrained, cold industrial
military space carrier, believable engineering detail, no fantasy elements, no text, no logos, no watermark, no signature
```
### Negative prompt (if the tool has one)
`text, letters, captions, watermark, signature, extra fingers, deformed hands, cartoon, anime, chibi, fantasy armour, glowing runes, lens flare overload, blurry, duplicate face, cropped head`

## 1. Consistency workflow (matters more than any single prompt)
1. Generate each character **once as a neutral head-and-shoulders portrait**. Pick one. That image is the master.
2. For every other expression, feed the master image as the reference/"character reference" input (img2img or the tool's consistency feature) and only
   change the expression line.
3. Keep the same seed/model/version for the whole set where the tool allows it; write the seed down in the file name.
4. Generate characters on a flat mid-grey background (`#808080`), not the room, so I can cut them out; I composite them over the room backgrounds.
5. Export portraits as PNG, 1024x1280 (4:5), backgrounds as PNG 1920x1080 (16:9). I will recompress to WebP (budget below).

## 2. Characters (from `CREW` in `src/75_mission.js` and `docs/LORE.md`)
All wear the same fleet kit: charcoal-grey flight suit with an amber chest stripe, white "EAGLE" shoulder patch (stylised eagle head), collar open, helmet off.
Facing: three-quarter view, eyes toward the viewer, shoulders square to a camera slightly below eye level (heroic WC2 framing).

**HAWK**, Lt. Maya Okafor, flight lead (skill 4). `[STYLE]` + 
`head and shoulders portrait on a flat mid-grey background, a woman in her late thirties of Nigerian descent, short natural hair with a few grey strands, a thin old scar through her left eyebrow, strong jaw, tired steady eyes, a dry half smile, charcoal flight suit with amber chest stripe and a white eagle-head shoulder patch, three-quarter view, soft key light from the left with a cold teal rim light`

**SPARROW**, Ens. Tomas Vidal, rookie, talks when nervous (skill 2). `[STYLE]` +
`head and shoulders portrait on a flat mid-grey background, a young man of about twenty-two of Latin American descent, thin face, short dark hair slightly sweat-damp, wide eager eyes, a slightly nervous crooked grin, charcoal flight suit with amber chest stripe and a white eagle-head shoulder patch, three-quarter view, soft key light from the right with a cold teal rim light`

**ECHO**, Lt. J. Koll, the player (skill 3). Optional: if you prefer the player stays a blank slate, use the helmet-on version only.
`[STYLE]` + `head and shoulders portrait on a flat mid-grey background, a pilot in their early thirties, short dark hair, calm focused expression, charcoal flight suit with amber chest stripe and a white eagle-head shoulder patch, three-quarter view` and, for the faceless variant: `helmet on, visor down and reflecting a blue-white nebula, no visible face`

**CAPTAIN of HSS Halberd** (name TBD). `[STYLE]` + `head and shoulders portrait on a flat mid-grey background, a captain in her late fifties, silver cropped hair, deep lines, calm authority, navy-charcoal command uniform with a single amber collar bar, three-quarter view, key light from above`

**INTEL OFFICER** (name TBD). `[STYLE]` + `head and shoulders portrait on a flat mid-grey background, a lean man in his forties with round wire glasses, rumpled command uniform, a tablet glow lighting his chin, guarded intelligent expression`

**DECK CHIEF** (name TBD). `[STYLE]` + `head and shoulders portrait on a flat mid-grey background, a stocky woman in her fifties in an orange deck-crew vest over grey coveralls, hearing protection around her neck, grease on her cheek, blunt amused expression`

### Expression sheet (one image per character; use the master as reference)
`[STYLE]` + `character expression sheet, the same person as the reference image, six head-and-shoulders poses on a flat mid-grey background in a 3x2 grid, identical framing and lighting in every cell: neutral, talking with mouth open, amused half smile, grim and serious, worried, eyes closed in grief` 
Needed per speaking character: neutral, talking (mouth open), amused, serious/angry, worried/grief, eyes closed (blink). 6 frames x 6 characters = 36 cells; if you want the cheapest WC2 feel, only neutral + talking + one emotion per character (18 cells) is enough for slice 1.

## 3. Backgrounds (16:9, no people in them, painted, eye-level camera, plenty of empty floor space on the lower third for the dialogue box)
`[STYLE]` + one of:
1. **Briefing room.** `a cramped military briefing room aboard a corvette, a large dark holographic table in the centre projecting a faint blue star map, a wall screen at the back, six padded chairs, hard overhead light, amber door light, steel bulkheads with painted stencil numbers`
2. **Lounge / ready room (the bar scene).** `a small spaceship crew lounge, a short bar counter with a worn steel top and a few cups, two stools, a round porthole window showing a green-tinted gas giant and stars, pinned photos and a handwritten kill tally board on the wall, warm amber lamps against cool steel, lived-in clutter`
3. **Flight deck.** `the interior of a small carrier hangar deck, one grey-white single-seat fighter on a launch cradle in the centre with its nose pointing toward a large open bay door showing stars, orange deck-crew vests, hanging cables and fuel lines, yellow hazard stripes on the floor, steam, hard backlight`
4. **Bridge / CIC.** `the dim combat information centre of a corvette, curved consoles with green and amber displays, a central navigation table, a large forward viewport showing a nebula, tight and functional`
5. **Memorial alcove.** `a small quiet alcove on a military ship, a steel wall with a row of small framed pilot photographs lit by single amber candles-like LED lights, a folded flag-like patch on a shelf, a bench, dim light`
6. **Corridor.** `a narrow steel ship corridor with ribbed walls and a pressure door at the end, amber emergency strip lights, wet-looking deck plating, perspective view`
7. **Debrief room.** Reuse the briefing room; request a variant with lights up: `same room, the holographic table switched off, the wall screen showing a plain grey grid, brighter white light`
8. **Planet window shot** (loopable behind lounge): `view through a ship porthole, a green gas giant with pale cloud bands, distant stars, a faint ship hull edge at the frame border`

## 4. Cinematic stills (16:9)
`[STYLE]` + one of:
1. **Launch.** `a grey-white fighter shot out of a carrier bay, seen from behind and slightly below, engine glow, motion blur lines, a hangar bay door frame`
2. **Jump.** `a corvette and a frigate fleeing into a blue-white jump flash, space bending around them, long streaks of light, hard sci-fi`
3. **FROGG arrival.** `a swarm of dark graphite alien warships with glowing cyan seams emerging from a bright rip in space, in the distance a huge ribbed carrier with an open toothed maw at the bow, cyan engine plumes, scale against a small human corvette in the foreground`
4. **FROGG hive carrier close.** Use the reference art in `docs/img/frogg_reference_art.jpg` as the image reference: `a gigantic alien carrier, graphite plated ribs, rows of dorsal spikes, a jaw-like prow with teeth, cyan light seams and rear drive clusters, cold starlight, seen from slightly ahead and above`
5. **Intel footage frame.** `a grainy surveillance still of a dark alien warship, monochrome green phosphor monitor look, scan lines, small timestamp-free overlay marks, slight interlace blur`
6. **Victory.** `three grey-white fighters in a loose formation returning toward a corvette, the corvette's lights, a distant planet crescent, calm`
7. **Loss.** `a single fighter drifting dark and silent, a corvette small in the distance, empty stars`

## 5. Interface graphics (flat, no characters; transparent background or flat `#808080`)
`[STYLE]` + one of:
- **Nav map.** `top-down tactical map screen, a dark blue grid, thin amber waypoint markers numbered by position only (no text), faint range rings, a small corvette icon, a red-orange hostile cluster marker, scanlines` (I overlay real text in the game)
- **CRT frame / bezel.** `an empty rounded-rectangle monitor bezel, dark steel, subtle screws, a faint blue screen glow, transparent centre`
- **Medals (4, one image each, 512x512, flat background).** `a small military medal on a ribbon, ` + `1) a bronze star on a green ribbon, 2) a silver cross on a blue ribbon, 3) a gold wing emblem on a red ribbon, 4) a plain steel cluster pin`
- **Eagle flight patch.** `a circular military shoulder patch, a stylised eagle head in white on charcoal, amber border, embroidered texture`
- **FROGG glyph.** `a single stylised alien emblem, an open toothed jaw seen from the front in cyan on near-black, symmetric, flat vector look`
- **Photo frames (memorial).** `a small dark metal photo frame, empty glass, amber edge light`

## 6. If you want me to build it in voxels instead
Give me orthographic references so I can voxelise them (my voxelizer takes primitives; I will model from images by hand/with code):
`[STYLE]` + `character turnaround sheet, the same person as the reference, head and upper torso only, three views on a flat mid-grey background: exact front view, exact side view (profile, facing left), three-quarter view, even flat lighting, no shadows, no expression, neutral mouth` — and for each expression the same sheet with only the mouth/eyes changed.
Rooms: `isometric cutaway diorama of <room>, square tiles, flat lighting, simple geometry, no clutter beyond furniture` and ask for a clean top-down floor plan as well.
Honest limit: voxel faces at a size that stays readable need about 40x50 voxels per head; expect a stylised look (my first proof of concept read as mannequins), so I recommend generated 2D portraits for faces and voxels only for ships and the nav map.

## 7. Delivery and budget
- Put files in a folder named `art/` and attach them (or a zip). Name: `portrait_<id>_<expression>.png`, `bg_<name>.png`, `still_<name>.png`, `ui_<name>.png`.
- I recompress to WebP: portraits about 30-50 KB each (512 px wide), backgrounds about 100-150 KB (1280x720). Slice 1 (lounge, Hawk, Sparrow) is about 0.4 MB, the full pack about 3-4 MB. As with audio, these ship as files next to `index.html` (loaded on demand), not inside the HTML.
- Licensing: check your generator's terms allow commercial use and redistribution of outputs. Purely machine-generated images may not be copyrightable (e.g. US Copyright Office guidance, 2023-2025); that affects protecting the art, not using it. Record the tool, model and date for each asset in `docs/ART_CREDITS.md` (I will create the file when the first assets arrive).
- Do not put real people, existing film or game characters, or franchise logos in prompts; keep them original.

## 8. Order I would generate (smallest first slice that already feels like WC2)
1. Lounge background (3.2). 2. Hawk and Sparrow masters + neutral/talking/amused sheets. 3. Briefing room + Captain. 4. Flight deck + Deck chief. 5. Memorial alcove (needed once a wingman can die). 6. UI nav map. 7. Stills.

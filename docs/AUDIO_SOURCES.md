# AUDIO_SOURCES - vetted open-licensed audio shortlist

Research date: 2026-10-21. Every row below was read on the cited page on that date (via WebFetch, which returns a model-written extract of the page, not raw HTML). Nothing was downloaded. Re-check each licence line on the page itself before shipping; OGA licence fields can be edited by the uploader.

Existing sfx ids (src/12_audio.js): cannon, pulse, fang, spit, spitbig, rail, lash, pd, msl, flare, hit, shield, boom(n), blip, alarm, warn, launchwarn, jump, click; plus the lock-tone oscillator. No engine hum or music exists today.

Update 2026-10-22: music exists now - the SRG774 CC0 tracks in `audio/` (mapped in `src/13_music.js`), and two owner-commissioned combat loops composed with the Gemini code tools and rendered from GM MIDI (`tools/gen/music/`): `combat-dogfight.mp3` now serves the `combat` mood, `combat-bombast.mp3` the `heavy` mood; `urgent.mp3`/`pulse.mp3` remain as fallbacks. The shortlist below was the pre-music research and is kept for auditioning alternatives.

Licence key: CC0 = https://creativecommons.org/publicdomain/zero/1.0/ ; CC-BY 3.0 = https://creativecommons.org/licenses/by/3.0/ ; CC-BY 4.0 = https://creativecommons.org/licenses/by/4.0/. All CC-BY items permit commercial use and redistribution (including inside a bundled file) provided attribution is given and changes are indicated; re-encoding/trimming counts as a modification, so keep a "modified" note in credits.

## 1. Music

| # | Track / pack | Author | Licence (as shown) | Source URL | Format / size | Role | Attribution |
|---|---|---|---|---|---|---|---|
| M1 | Dark Sci-Fi Audio Pack: sector, airy, pulse, urgent, transmission, title (+ hover.mp3, victory.mp3) | SRG774 | CC0 | https://opengameart.org/content/dark-sci-fi-audio-pack | MP3: sector 2.3 MB, airy 2.6, pulse 2.8, urgent 2.3, transmission 3.8, title 9.4; hover 63 KB, victory 235 KB; OGG zip 13.3 MB. Durations not listed. Page says designed to loop, written for "Ball Logic" | title -> menu/briefing; airy, sector -> patrol/ambient; pulse, urgent -> combat; transmission -> defeat/transition; victory.mp3 -> victory | None required; page says mentioning SRG774 is appreciated |
| M2 | Outer Space Music Pack (lift off, stillness of space, racing through asteroids, emergency, building a colony, battle in space) | leohpaz (Leonardo Paz) | CC-BY 4.0 and CC-BY 3.0 (both listed) | https://opengameart.org/content/outer-space-music-pack | OGG; 02_stillness_of_space 1.7 MB; 04_emergency_alarm 875 KB / no_alarm 859 KB; 06_battle_in_space intro 755 KB + loop 756 KB; 03 racing intro 914 KB + loop 916 KB. Total ~9 MB for all | stillness -> patrol; emergency -> alert/escalation; battle_in_space -> combat; lift_off -> briefing/launch | "Just credit me (Leonardo Paz) in your game." Orchestral, probably less cold than the rest; audition |
| M3 | Ambience Pack 1 - Sci Fi Horror (5 tracks) | Joth | CC0 | https://opengameart.org/content/ambience-pack-1-sci-fi-horror | MP3, 0.96-1.2 MB each, about 1 min each, "designed to loop" | patrol/ambient, hive-space, defeat | None |
| M4 | Space Battle (space_battle_bpm130) | MintoDog | CC0 | https://opengameart.org/node/172812 | MP3 3.5 MB / OGG 2.9 MB, described as loopable | combat | None (suggested: "Space Battle" by MintoDog, CC0) |
| M5 | Outer Space Loop | wipics | CC0 | https://opengameart.org/content/outer-space-loop | MP3 1.7 MB, duration not stated | patrol/ambient | None ("Public Domain") |
| M6 | Heavy battle music (battle1.mp3) | Davieplier | CC0 on page, but page text asks "Credit my name in your project" | https://opengameart.org/content/heavy-battle-music | MP3 759 KB, short loop | combat | Credit "Davieplier" (CC0 does not require it; the request is a courtesy; flagged as mildly inconsistent) |
| M7 | Orchestral Battle Music (Batalha #1) | Lisboa | CC-BY 3.0 | https://opengameart.org/content/orchestral-battle-music-0 | OGG 1.8 MB | combat (orchestral; tone may be too fantasy) | "I only ask to put the composer name at the credits." |
| M8 | Claimed by the Void (incl. loop version) | vitalezzz | CC0 | https://opengameart.org/content/claimed-by-the-void | MP3 7.8 MB (too large unless trimmed/re-encoded), WAV/FLAC also | menu/briefing | Page suggests "Vitalezzz - Claimed by the Void" (not required) |
| M9 | ZenoStar (xenostar2loop_.ogg) | Centurion_of_war | CC0 | https://opengameart.org/node/126662 | OGG 2.4 MB; author calls it work-in-progress, "slightly techno", for an enemy spaceship | combat, FROGG-hive theme | Not required, appreciated |
| M10 | Space Boss Battle Theme (Orbital Colossus) | Matthew Pablo | CC-BY 3.0 | https://opengameart.org/content/space-boss-battle-theme | MP3 6.1 MB, NOT loopable as posted (loop version "on request") | boss / capital-ship encounter only | Per https://www.matthewpablo.com/services (that page was not opened; see unverified list) |
| M11 | 5 Chiptunes (Action), Juhani Junkala / SubspaceAudio | SubspaceAudio (zip name: Juhani Junkala) | CC0 | https://opengameart.org/node/55580 | zip 49.6 MB, contents not listed | Chiptune; wrong tone for this game. Listed only to say it was checked and rejected | - |

Note: M4 URL (node/172812) and M9 URL (node/126662) were matched to titles from the fetch results; confirm on the live pages.

Tone caveat for all music: I could not listen to anything. Descriptions come from the uploader. "Dark/tense" suitability is unverified; audition before committing. Chiptune and orchestral-fantasy items (M7, M11) are likely wrong for the cold hard-sci-fi tone.

### Suggested music role mapping (to audition)
- Menu / briefing: M1 title.mp3 (trim or re-encode, 9.4 MB raw) or M8 loop (re-encode); M2 lift_off as alternative
- Patrol / ambient: M1 airy, sector; M2 stillness; M3 tracks; M5
- Combat: M1 urgent, pulse; M2 battle_in_space loop; M4 Space Battle; M9 ZenoStar
- Victory: M1 victory.mp3 (235 KB)
- Defeat: M1 transmission.mp3 or one M3 track

## 2. Sound effects

| # | Item | Author | Licence | URL | Format / size | Fits sfx id | Attribution |
|---|---|---|---|---|---|---|---|
| S1 | Kenney Sci-Fi Sounds (70 assets) | Kenney | CC0 | https://kenney.nl/assets/sci-fi-sounds | zip; formats and sizes not stated on page (preview is .ogg) | cannon, pulse, rail, lash, pd, shield, jump, msl, engine, click, warn/alarm; per-file mapping not verified | None required; optional credit "Kenney" (https://kenney.nl/support) |
| S2 | Kenney Impact Sounds (130 assets) | Kenney | CC0 | https://kenney.nl/assets/impact-sounds | zip; formats not stated | hit (hull), cannon (kinetic thud layer), boom (low layer) | as above |
| S3 | Kenney Digital Audio (60 assets) | Kenney | CC0 | https://kenney.nl/assets/digital-audio | zip; formats not stated | pulse, fang, blip, warn, launchwarn, lock tone | as above |
| S4 | Kenney Interface Sounds (100 assets) | Kenney | CC0 | https://kenney.nl/assets/interface-sounds | zip; formats not stated | click, blip, menu | as above |
| S5 | Space Sound Effects (SpaceSFX1: 6 lasers, 6 explosions, warpout, notification; Bfxr-made) | messersm | CC0 | https://opengameart.org/content/space-sound-effects | zip 134.8 KB, appears to be OGG | lasers -> pulse/fang; explosions -> boom; warpout -> jump | None stated. Retro-synthetic character |
| S6 | Laser weapon burst fire | celestialghost8 | CC0 | https://opengameart.org/content/laser-weapon-burst-fire | MP3 14.2 KB | pulse / pd burst | None |
| S7 | Synthesized explosion | qubodup (comments credit "Iwan Gabovitch") | CC0 | https://opengameart.org/content/synthesized-explosion | FLAC 164 KB | boom (small/large via pitch) | None required; authorship line is unclear, credit both names optionally |
| S8 | Soundpack 03 (explosion01-04, 8-bit) | crazyduckgames | CC0 | https://opengameart.org/content/soundpack-03 | OGG zip 45.7 KB | boom (small) - 8-bit style, probably wrong tone | None |
| S9 | Missile sound | mikeask | CC0 | https://opengameart.org/node/83760 | WAV 475 KB | msl | None ("don't worry about license") |
| S10 | Warp Engine Engage Sound | bart | CC0 | https://opengameart.org/content/warp-engine-engage-sound | WAV 3 MB / 1.5 MB (16-bit) | jump | "Credit appreciated but unnecessary" |
| S11 | Rocket Engine (low rumble, tagged loopable) | theMinesAreShakin | CC0 | https://opengameart.org/content/rocket-engine | WAV 1.2 MB | engine hum | None stated |
| S12 | Space Flight Sound Effects (spaceflight3-17) | bretbernhoft | CC0 | https://opengameart.org/content/space-flight-sound-effects | WAV 21-46 MB each (far too large raw; would need trimming) | engine/ambience bed | None |
| S13 | Spaceship engine sound effects | cyberdyne | CC-BY 4.0 | https://opengameart.org/content/spaceship-engine-sound-effects | 3x MP3 320 kbps, 601 KB each (described as UFO sounds) | engine hum | "Spaceship engine sound effects" by cyberdyne, licensed under CC-BY 4.0, via OpenGameArt.org |
| S14 | Space Ship engine sounds (engine1-3, slowed microwave hum + bass) | Reemax page; notice credits Tuomo Untinen | CC-BY 4.0 and CC-BY 3.0 | https://opengameart.org/content/space-ship-engine-sounds | 3x WAV 216 KB | engine hum | "Space ship engine sounds by Tuomo Untinen" |
| S15 | Ambient Spaceship Hums | dklon | CC-BY 3.0 | https://opengameart.org/content/ambient-spaceship-hums | MP3 111 KB and 56 KB | cockpit/ambient bed | "credit me as dklon somewhere" |
| S16 | Boom Pack 1 (9 explosions, boom1-9.mp3) | dklon | CC-BY 3.0 | https://opengameart.org/content/boom-pack-1 | zip 586 KB | boom small/large | "credit me as dklon somewhere" |
| S17 | Bangs (7 bangs) | dklon | CC-BY 3.0 | https://opengameart.org/content/bangs | zip 162 KB, inner formats not listed | hit, cannon | same |
| S18 | 4 projectile launches (sci-fi) | Michel Baradari (submitted by qubodup) | CC-BY 3.0 | https://opengameart.org/content/4-projectile-launches | .7z 709 KB (needs 7z to unpack) | msl, spit/lash candidates | Credit Michel Baradari (apollo-music.de); no fixed string on page |
| S19 | 2 High Quality Explosions | Michel Baradari (submitted by qubodup) | CC-BY 3.0 | https://opengameart.org/content/2-high-quality-explosions | .7z 410 KB | boom large | same |
| S20 | 100 CC0 SFX / 100 CC0 SFX #2 | rubberduck | CC0 | https://opengameart.org/content/100-cc0-sfx and https://opengameart.org/content/100-cc0-sfx-2 | zips 2.9 MB / 2.4 MB | metal hits, slams, switches, machine loops, "hit sound" -> hit, click, hull creak/ambience. Recorded on a phone; quality unverified | None |

### Gaps (no verified dedicated sample found)
- Railgun, acid/spit organic projectile, large lash/beam, point-defence burst: no clearly matching open item found. Best route is to layer pitch-shifted Kenney S1/S2 material under the existing procedural sound (e.g. keep `rail`'s sine sweep, add an S2 metal impact for the crack). Organic/spit: no verified source; keep procedural (it is a low-pass noise plus sine, which is plausible for a wet projectile).
- Shield hit: no specific item verified; Kenney S1 likely contains force-field type sounds (from my memory of the pack, NOT verified on the page).

### Candidates excluded
- Laser rifle (Skorpio), https://opengameart.org/content/laser-rifle: CC-BY-SA 3.0. ShareAlike on audio inside a bundled game is ambiguous; excluded.
- Q009's weapon sounds, https://opengameart.org/content/q009s-weapon-sounds: CC-BY-SA 3.0; excluded for the same reason.
- Dark Ambience Soundscapes (yewbic), https://opengameart.org/content/dark-ambience-soundscapes: CC-BY-SA 3.0, 46.5 MB; excluded.
- Resistors (Spring Spring), https://opengameart.org/content/resistors: multi-licensed (includes CC-BY 3.0 and CC-BY 4.0), FLAC 14.7 MB, chiptune; not a fit. Note this is not Eric Skiff's "Resistor Anthems".
- Lazer Zero Sounds collection, https://opengameart.org/content/lazer-zero-sounds: states no licence of its own, only links to sources; use the original items instead.
- Weird Rocket Launch Sound (qzlocx, CC0, 8-bit), https://opengameart.org/content/weird-rocket-launch-sound: wrong tone.

## 3. Attribution block (paste into credits screen)

Required (CC-BY):
- Music: "Outer Space Music Pack" by Leonardo Paz (leohpaz), CC-BY 4.0 / 3.0, https://opengameart.org/content/outer-space-music-pack. Tracks trimmed/re-encoded.
- Sound effects: "Spaceship engine sound effects" by cyberdyne, CC-BY 4.0, https://opengameart.org/content/spaceship-engine-sound-effects
- "Space ship engine sounds" by Tuomo Untinen, CC-BY 4.0, https://opengameart.org/content/space-ship-engine-sounds
- dklon: "Boom Pack 1", "Bangs", "Ambient Spaceship Hums", CC-BY 3.0, https://opengameart.org/users/dklon (credit the name "dklon")
- Michel Baradari: "4 projectile launches", "2 High Quality Explosions", CC-BY 3.0, https://opengameart.org/content/4-projectile-launches
- Include the licence links https://creativecommons.org/licenses/by/4.0/ and https://creativecommons.org/licenses/by/3.0/ once.

Courtesy credit (CC0, not legally required):
- Music: SRG774 (Dark Sci-Fi Audio Pack), Joth (Ambience Pack 1), MintoDog, Centurion_of_war, wipics, vitalezzz, Davieplier
- Sound: Kenney (kenney.nl), messersm, celestialghost8, qubodup, mikeask, bart, theMinesAreShakin, rubberduck
- Remove from the block any item not actually shipped. Delete the CC-BY lines entirely if you ship CC0 only.

## 4. Integration recommendation

Size arithmetic (base64 inflates by 4/3; a data: URI in JS also costs the same again in parse memory):
- Current index.html: 311,991 bytes (~305 KB).
- SFX: a pragmatic set of ~25 short samples (hits, explosions, launches, engine loop, jump, UI) re-encoded mono 22-32 kHz, ~24-48 kbps, is ~250-500 KB binary -> ~330-670 KB base64. That would roughly double to triple the file. Acceptable for an HTML opened from disk, but it makes diffs and the build output unwieldy.
- Music: 6 tracks at ~2 MB (typical of the CC0 MP3s above) = ~12 MB -> ~16 MB base64. Not sensible inline. Re-encoding at 64-96 kbps stereo gives roughly 0.5-0.7 MB per minute; 6 tracks x ~2 min = ~5-8 MB binary, still too heavy to inline (6.5-10.5 MB base64, slow parse, and full cost paid at every load).
- Recommended: embed only SFX (and only those that beat the procedural sound) as base64; ship music as separate files in a folder `audio/` next to index.html and lazy-load after the first user gesture. Do not decode music into AudioBuffers; stream with an `<audio>` element (optionally routed through `createMediaElementSource` for volume/crossfade). Reason: fetch()/XHR on file:// is blocked in Chrome, and decodeAudioData of multi-MB files is memory-heavy on iPad. Whether `<audio src="audio/x.mp3">` works from file:// on each target browser was not tested here; test on laptop and iPad (and if the iPad copy is loaded via Files/Documents, check that the relative folder survives).
- Format: MP3 or AAC (.m4a) for iOS safety. I did not verify current Safari support for Ogg Vorbis/Opus; do not rely on OGG for iOS without testing. Several sources already ship MP3 (M1, M3, M5, M6); OGG-only ones (M2, M7, M9) would need conversion (which the licences permit, with a "modified" note for CC-BY).
- Keep procedural sfx as the baseline and fallback (zero assets, works with no network or files), and layer samples on top in `SFX[name]` (play sample if decoded, always play the procedural tail or a quieter version). This degrades gracefully if a file is missing.
- iOS: audio context already starts on `pointerdown`/`keydown`; add `touchend` and call `ctx.resume()` inside the handler, and start music only from that same gesture (create/play the `<audio>` element synchronously within the handler). Also expect the iOS silent-switch to mute WebAudio.
- Music director: one track per role (menu, patrol, combat, victory, defeat), crossfade over ~2 s on state change (patrol <-> combat driven by existing threat/lock state), pause on `visibilitychange`.

Menu toggle design (settings panel, reachable from title/pause):
- Music: On/Off toggle; Music volume slider 0-100 (default 40); SFX volume slider 0-100 (default 100, multiplies `AUDIO.master.gain`, currently 0.55); optional "Engine hum" toggle if S11/S13 are used continuously.
- State object `AUDIO.prefs = {music:true, musicVol:0.4, sfxVol:1}`; load at startup and save on change in `localStorage['spaceshooter.audio']` as JSON, every access in try/catch (private mode / file:// can throw); fall back to defaults silently. Keep the existing `?mute` URL param as a hard override.
- Music off must stop the stream and not even fetch files (saves bandwidth/memory).

## 5. Could NOT verify

- No audio was auditioned; durations, loop-point quality, dark/tense character, loudness, and clipping are unchecked for every item.
- Contents of zips/7z were not inspected (Kenney packs: file names/formats/sizes not shown on the pages; the OGA zips for dklon, Baradari, messersm, rubberduck, SRG774 ogg.zip). Mapping of Kenney files to sfx ids is therefore not done.
- WebFetch returns a model summary, not the raw HTML; licence strings and sizes should be re-read on the live pages.
- Blocked/unreachable (permission request timed out, not retried): https://ericskiff.com/music/ (Eric Skiff, Resistor Anthems - believed CC-BY, NOT verified), https://incompetech.com/music/royalty-free/faq.html (Kevin MacLeod / Incompetech - believed CC-BY 4.0 with a prescribed credit line, NOT verified). Neither is recommended until opened. Also not opened: https://www.matthewpablo.com/services (attribution instructions for M10).
- Not searched/opened: Freesound (CC0 items need an account to download; none vetted), itch.io CC0 packs, Wikimedia Commons, Free Music Archive, Internet Archive. Alexandr Zhelanov and Juhani Junkala space-specific tracks were not individually verified (only the 5 Chiptunes page).
- OGA upload provenance: OGA does not guarantee that uploaders own the work. Some items (e.g. SubspaceAudio page crediting Juhani Junkala; qubodup page with comment crediting Iwan Gabovitch) have authorship ambiguity; the licence is stated as CC0 but the uploader/author mismatch is a small provenance risk.
- M6 (Davieplier): CC0 stated but credit requested in the notice; harmless to credit, but the page is internally inconsistent.
- Safari Ogg support, file:// audio loading on iPad, and decode memory on iPad were not tested.
- Licences read here are as of 2026-10-21; this is not legal advice.

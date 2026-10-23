# Credits and licences

Working title: **Claude Space Commander** (owner decision 2026-10-22; the repository is still called `game-space`).
The in-game credits screen (briefing screen -> CREDITS, or options panel [O] -> CREDITS) shows the same list from `src/15_credits.js`. Keep both in sync.
Every licence below was re-read from its source page on **2026-10-22**.

## Who made what (AI tools and people)
| Contributor | Role |
|---|---|
| Jonas Koll | Design and direction, all owner decisions |
| Claude (Anthropic) | Engine, ships, missions, game systems, procedural sound, most documentation (git trailer `Co-Authored-By: Claude ...`) |
| Mistral Vibe (Mistral AI) | Later development passes from 2026-10-22: weapons and capital ships, magazines, balance and UX review, documentation (trailer `Co-Authored-By: Mistral Vibe ...`) |
| Google Gemini | Lore proposals (history, factions, FROGG species; raw text in `docs/prototypes/lore-gemini/`) and the two combat music loops (composed with Gemini code tools) |
The code, text and music above were produced with AI tools under the owner's direction. The copyright status of purely machine-generated work varies by jurisdiction (for example US Copyright Office guidance, 2023-2025), which affects how it can be protected, not whether it can be used. Check each tool's terms before any commercial release.

## Shipped with the game
| Item | Author | Licence | Source | Where used |
|---|---|---|---|---|
| three.js r170 | three.js authors | MIT, "Copyright (c) 2010-2024 three.js authors" | https://github.com/mrdoob/three.js/blob/r170/LICENSE | Loaded from the jsDelivr CDN at run time (`src/00_head.html`); not bundled, so the game needs internet |
| "Dark Sci-Fi Audio Pack" (airy, sector, urgent, pulse, victory, transmission) | SRG774 | CC0 1.0 | https://opengameart.org/content/dark-sci-fi-audio-pack | `audio/*.mp3`, re-encoded to 96 kbps; urgent and pulse are now fallback combat tracks (see below) |
| Combat loops "dogfight" and "bombast" (`audio/combat-dogfight.mp3`, `audio/combat-bombast.mp3`) | owner-commissioned, composed with Google Gemini code tools 2026-10-22 | original work for this project | generators + MIDI in `tools/gen/music/` | combat and heavy music moods (`src/13_music.js`), rendered offline with FluidSynth 2.6.1 + GeneralUser GS soundfont (S. Christian Collins, "GeneralUser GS License v2.0", free for private and commercial music use); the soundfont itself is not shipped |
| "Space Sound Effects" (explosion1/3/5, laser3/4) | messersm | CC0 1.0 | https://opengameart.org/content/space-sound-effects | base64 in `src/14_samples.js` |
| "Synthesized explosion" | qubodup | CC0 1.0 | https://opengameart.org/content/synthesized-explosion | base64 in `src/14_samples.js` |
| "Warp Engine Engage Sound" (first 5 s) | bart | CC0 1.0 | https://opengameart.org/content/warp-engine-engage-sound | base64 in `src/14_samples.js` |

CC0 does not require attribution (the SRG774 page says credit is "highly appreciated"); we credit anyway. MIT requires the copyright notice and licence text to travel with copies of three.js; the game loads it from the CDN, whose files carry that notice, and the in-game screen names it. If three.js is ever bundled into `index.html`, add the full MIT text to the page.

## Original work
Ship models (built in code from voxel primitives), weapons, effects, most sound effects (Web Audio synthesis), the setting (Colonial Defence Force, Eagle Flight, the FROGGs) and all characters. No fonts are bundled (system monospace). No bitmap textures or video.

## Inspiration only (nothing copied)
Wing Commander, TIE Fighter and FreeSpace are trademarks of their owners; this project is not affiliated with them. `docs/FS2OPEN_STUDY.md` records a read of the FreeSpace 2 Open source for design ideas; its licence forbids commercial use of the original Volition code, so no code was copied.

## Images are not in the repository
Owner decision 2026-10-22: no image files are committed (`.gitignore` excludes png/jpg/gif/webp; 122 files were untracked). The ship renders, blueprints, marked sheets and the FROGG reference image exist only on the working copy, so image links in the other docs are broken on GitHub. They remain in git history before this commit.

## Not shipped and not in the repository
- The FROGG look was adapted from AI-generated portraits the owner supplied (not distributed, not in the repository; the one image that had been committed was purged from git history on 2026-10-22). Provenance and the generator's terms are the owner's to confirm before any use in the game.
- Cut scene art, once generated from `docs/CUTSCENE_ART_PROMPTS.md`: record the tool, model and date for each asset in `docs/ART_CREDITS.md` and check the generator's terms.
- Audio downloaded but unused (celestialghost8 "Laser weapon burst fire", theMinesAreShakin "Rocket Engine", both CC0 per `docs/AUDIO_CREDITS.md`) is not in the repo.
- Development-only tools (Playwright, Chromium, Python) are not distributed with the game.

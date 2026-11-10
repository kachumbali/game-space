# Orchestral score (10 original GM loops)

Source: owner-commissioned, written with AI code tools, 2026-11-10 (originals in the owner's `audio/soundtrack/` folder with the README describing each track).
Files here: ten `.mid` loops, `generate-soundtrack.ts` (writes them), `validate-mid.mjs` (structure check) and `render-soundtrack.py` (offline render used for the shipped MP3s).

| MIDI | Game slot | Shipped file |
|---|---|---|
| 01-title-eagle-squadron | title | `audio/score-title.mp3` |
| 02-menu-hangar-deck | menu | `audio/score-menu.mp3` |
| 03-patrol-open-space | patrol | `audio/score-patrol.mp3` |
| 04-tension-contacts | tension | `audio/score-tension.mp3` |
| 05-dogfight-furball | combat | `audio/score-combat.mp3` |
| 06-heavy-climb-and-burn | heavy | `audio/score-heavy.mp3` |
| 07-capital-broadside | capital | `audio/score-capital.mp3` |
| 08-boss-hive-lord | boss | `audio/score-boss.mp3` |
| 09-victory-medals | win | `audio/score-win.mp3` |
| 10-loss-empty-bunks | loss | `audio/score-loss.mp3` |

Slots it does not cover (hive, retreat, rescue, story) keep the classic tracks. Selected in Options > Music score (default: Classic).

## Render (2026-11-10, reproducible)

    pip install mido numpy tinysoundfont
    GS_SF2=GeneralUser-GS.sf2 python3 render-soundtrack.py *.mid        # writes /tmp/soundtrack-wav/<name>.wav
    ffmpeg -i <name>.wav -af "loudnorm=I=<target>:TP=-2:LRA=20:linear=true,alimiter=limit=0.8" -codec:a libmp3lame -b:a 128k audio/score-<slot>.mp3

Renderer: TinySoundFont (no reverb or chorus, so the result is drier than a FluidSynth render); the release tail is folded onto the loop start so the loop seam is smooth.
Target loudness per slot = the integrated loudness of the classic track it replaces (title -31.5, menu -35.4, patrol -30.2, tension -30.7, combat -33.6, heavy -26.4, capital -31.8, boss -32.2, win -29.9, loss -31.1 LUFS).
The owner's earlier previews used a different soundfont and are not shipped.

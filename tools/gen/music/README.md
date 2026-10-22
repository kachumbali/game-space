# Music generators (combat loops)

Two GM MIDI combat loops, composed for this game with the Google Gemini code tools
(owner-commissioned, 2026-10-22). The `.ts` scripts are self-contained: no npm
dependencies, they hand-serialise Standard MIDI Files.

| Script | Output | Character |
|---|---|---|
| `generate-combat-loop.ts` | `combat-loop-90s-bombast.mid` | 148 BPM, WC2/Top-Gun-style anthem with lead melody, 80 bars, ~2:10. Used for the `heavy` music mood. |
| `generate-dogfight-loop.ts` | `combat-loop-dogfight.mid` | 128 BPM, X-Wing/TIE-style tension bed, no lead melody, channels mixed ~10-15 % below the anthem. Used for the `combat` mood. |

## Regenerate the MIDI

    npx tsx generate-combat-loop.ts
    npx tsx generate-dogfight-loop.ts

## Render to the MP3s the game plays

Browsers cannot play MIDI, so the loops are rendered offline and committed as
`audio/combat-bombast.mp3` and `audio/combat-dogfight.mp3` (the soundfont is a
build tool, not shipped):

    fluidsynth -ni -g 1.0 -F /tmp/loop.wav -r 44100 GeneralUser-GS.sf2 combat-loop-dogfight.mid
    # level-match to the CC0 tracks (peaks ~-13 dB), then encode:
    ffmpeg -i /tmp/loop.wav -af volume=-12dB -codec:a libmp3lame -b:a 128k ../../..//audio/combat-dogfight.mp3

Rendered 2026-10-22 with FluidSynth 2.6.1 (LGPL, dev tool only) and GeneralUser GS
by S. Christian Collins ("GeneralUser GS License v2.0": free for private and
commercial music use). The MP3s are ours; both tool licences are recorded in
`docs/CREDITS.md` and `src/15_credits.js`.

The moods map in `src/13_music.js` (`MUSIC_FILES`); the CC0 tracks `urgent.mp3`
and `pulse.mp3` remain in `audio/` as fallbacks.

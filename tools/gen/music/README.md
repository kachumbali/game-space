# Music generators (original score loops)

Two GM MIDI combat loops, composed for this game with the Google Gemini code tools
(owner-commissioned, 2026-10-22). The `.ts` scripts are self-contained: no npm
dependencies, they hand-serialise Standard MIDI Files.

| Script | Output | Character |
|---|---|---|
| `generate-combat-loop.ts` | `combat-loop-90s-bombast.mid` | 148 BPM, WC2/Top-Gun-style anthem with lead melody, 80 bars, ~2:10. Used for the `heavy` music mood. |
| `generate-dogfight-loop.ts` | `combat-loop-dogfight.mid` | 128 BPM, X-Wing/TIE-style tension bed, no lead melody, channels mixed ~10-15 % below the anthem. Used for the `combat` mood. |
| `generate-menu-frontier.mjs` | `menu-frontier-overture.mid` | 92 BPM D-minor menu overture: an original strings, horn, piano and synth-bass cue. Used for the `menu` mood. |
| `render-menu-frontier.mjs` | temporary WAV | Offline additive-synthesis renderer for the menu cue; it uses no soundfont or samples. |

## Regenerate the MIDI

    npx tsx generate-combat-loop.ts
    npx tsx generate-dogfight-loop.ts
    node generate-menu-frontier.mjs
    node render-menu-frontier.mjs /tmp/menu-frontier.wav

## Render to the MP3s the game plays

Browsers cannot play MIDI, so the loops are rendered offline and committed as
`audio/combat-bombast.mp3`, `audio/combat-dogfight.mp3`, and `audio/menu-frontier.mp3` (the soundfont is a
build tool, not shipped):

    fluidsynth -ni -g 1.0 -F /tmp/loop.wav -r 44100 GeneralUser-GS.sf2 combat-loop-dogfight.mid
    # level-match to the CC0 tracks (peaks ~-13 dB), then encode:
    ffmpeg -i /tmp/loop.wav -af volume=-12dB -codec:a libmp3lame -b:a 128k ../../..//audio/combat-dogfight.mp3

For the menu overture, encode the WAV from `render-menu-frontier.mjs`:

    node render-menu-frontier.mjs /tmp/menu-frontier.wav
    ffmpeg -i /tmp/menu-frontier.wav -af volume=-12dB -codec:a libmp3lame -b:a 128k ../../..//audio/menu-frontier.mp3

The committed MP3 is intentionally played through the existing `MUSIC_FILES.menu`
route. It is not started by page load: `musicUnlock()` starts media only from the
first pointer or key gesture, and the normal Music option and volume slider control it. The
MIDI is a readable score reference; the committed menu audio is rendered by the sample-free
oscillator script, not by a soundfont.

Rendered 2026-10-22 with FluidSynth 2.6.1 (LGPL, dev tool only) and GeneralUser GS
by S. Christian Collins ("GeneralUser GS License v2.0": free for private and
commercial music use). The MP3s are ours; both tool licences are recorded in
`docs/CREDITS.md` and `src/15_credits.js`.

The moods map in `src/13_music.js` (`MUSIC_FILES`); the CC0 tracks `urgent.mp3`
and `pulse.mp3` remain in `audio/` as fallbacks.

## Original situation cues (2026-11-02)

`generate-situation-score.py` writes ten original GM MIDI scores and renders
them with its own sample-free additive oscillators. It requires Python 3,
NumPy and ffmpeg; no soundfont, recordings, or third-party melodies are used.
Run from the repository root with `python3 tools/gen/music/generate-situation-score.py`.
The corresponding MP3 files are 96 kbps stereo and under 1.5 MB each. The
generator makes a 40 ms seam fade; a listener must still judge the loop and
the music's tone in context. MP3 player implementations can add encoder gap.

The cues are patrol, tension, hive, capital-duel, bullfrog, retreat, rescue,
loss, victory-new and title-sting. The title sting plays once, then the
existing menu track fades in; other transitions use the existing crossfade.
Critical warning tones zero the music gain for their duration, then the music
fades back in. Test on iOS: media-element unlock and gain routing vary across
OS/browser versions, and the `file://` fallback still uses `audio.volume`,
which iOS may ignore.

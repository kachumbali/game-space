# Audio audit — baseline on main, 2026-11-02

This is a code and asset audit, not an ear test. The owner must audition the
result on desktop, iPad and phone; neither the tonal fit nor loop seams and
mixing levels can be established from the filenames. The sounds are an
intentional cockpit/combat-feedback convention: sound cannot travel through
vacuum. Distance, filtering and latency are stylised sensor-feed effects.

## Effects on main

| ID / source | Situation | Assessment against a grounded cockpit mix |
|---|---|---|
| `cannon` synth | MK-20/30, DR-2 and GA-9 fire | Short noise and bass thump; useful start, little class distinction. |
| `rail` synth | Rail and mass drivers, including capitals | Low sweep and noise; size, propagation delay and filtering are missing. |
| `pulse` synth + `pulse` sample | Laser and pulse/maser guns and turrets | High saw sweep plus retro laser sample sounds game-like; no distinction between laser and maser. |
| `fang` synth + `fang` sample | FROGG R-9 autocannon | Square-wave snap and retro laser sample are too electronic for a cannon. |
| `spit`, `spitbig` synth | M-2 and M-6 masers | Low noise/tone offer weight; IDs are historical and obscure weapon type. |
| `lash` synth | GX-1 charged lance | Heavy noise and falling saw; potentially harsh in long engagements. |
| `beamcharge` synth | Capital beam charge begins | Rising electronic warning is useful, but must not mask cockpit warnings. |
| `pd` synth | Point defence and small autocannon turrets | Very brief noise tick; needs body and spatial differentiation. |
| `msl` synth | All missile and torpedo launches | Rising noise/low tone; torpedoes lack a separate heavy launch. |
| `flare` synth | Countermeasure deployment | Brief noise is plausible as an onboard ejection cue. |
| `hit` synth | Hull hits and collisions | Short band-limited impact; lacks weight and distance filtering. |
| `shield` synth | Shield impact | Single falling sine sounds like an interface beep; needs a duller energy impact. |
| `boom` synth + `expl1`/`expl2`/`expl4` or `expl3` samples | Projectile and ship explosions, nuclear detonation, subsystem destruction | Low noise and bass; retro samples need audition. Existing dispatcher accidentally invokes every synth explosion with default size, and sample volume ignores distance. |
| `jump` synth + `warp` sample | Jump/transition | Rising oscillator and noise plus sampled warp; check duration and harshness. |
| `alarm` synth | Incoming missile and player subsystem destroyed | Loud square two-tone; intelligible but cartoon-like and music is not suppressed. |
| `warn` synth | Enemy lock on player | High square beep; needs distinct cockpit tone and mix priority. |
| `launchwarn` synth | Missile launched at player | Double square beep; should cut through music without excessive loudness. |
| `lockOsc` continuous sine | Player has target lock | Persistent 1150 Hz tone; check fatigue and priority during other warnings. |
| `blip` synth | Player comm message | Square pip sounds like an arcade UI; radio squelch would fit better. |
| `click` synth | Menu, power, weapon select, docking commands | Square click; thin and undifferentiated, including docking. |
| `hitmark`, `hitshield` synth (`62_juice.js`) | Player hit confirmation | High, short square/sine notifications; too game-like for campaign realism. |
| `subkill` synth (`62_juice.js`) | Player destroys subsystem | Saw/square confirmation; should sound like mechanical failure, not a reward. |
| `kill` synth (`62_juice.js`) | Player kill confirmation | Rising musical doublet, chain-dependent; arcade feedback, unsuitable for campaign. |
| `pickup`, `perk` synth (`62_juice.js`) | Free Flight/Gauntlet pickup and perk | Bright musical tones; arcade modes only and intentionally separate from Campaign. |
| `wave`, `ace` synth (`62_juice.js`) | Gauntlet wave/ace appearance | Dramatic electronic stingers; acceptable only as optional arcade-mode feedback. |
| None | Engine/throttle and afterburner | No cockpit mechanical bed or class distinction. |
| None | Low energy, critical hull, docking, comms squelch | Current generic alarm/click/blip cannot convey these distinct events. |

The optional embedded samples are `expl1`, `expl2`, `expl3`, `expl4`,
`pulse`, `fang`, and `warp`, from the CC0 sources listed in
`AUDIO_CREDITS.md`. They sit under the procedural layer and may be disabled
with the existing sample-layer checkbox; procedural effects remain the
fallback. No new third-party source is required for synthesized effects.

## Music on main

| File | Baseline mapping / situation | Assessment |
|---|---|---|
| `menu-frontier.mp3` | Menu, briefing and loss/dead fallback | Original orchestral cue; briefing and loss need separate emotional treatment. |
| `sector.mp3` | Patrol without nearby hostiles | CC0 atmosphere; no separate approaching-contact tension or hive-space cue. |
| `combat-dogfight.mp3` | Nearby hostile combat | Original GM-MIDI loop; energy suitable in principle, no warning ducking. |
| `combat-bombast.mp3` | Heavy combat with many nearby hostiles | Original GM-MIDI loop; enemy counts alone cannot identify a capital duel or Bullfrog. |
| `victory.mp3` | Successful mission/debrief, one-shot | CC0 victory sting; needs specific debrief/victory treatment. |
| `transmission.mp3` | Transit cinematic | CC0 transition cue; retreat, evacuation and rescue have no individual mappings. |
| `airy.mp3` | Shipped but not selected by current director | CC0 legacy ambient; not currently heard. |
| `urgent.mp3` | Shipped fallback, not selected by current director | CC0 legacy combat; not currently heard. |
| `pulse.mp3` | Shipped fallback, not selected by current director | CC0 legacy heavy combat; not currently heard. |

The current crossfade is approximately 1.6 seconds, the victory cue plays
once, and the other mapped files loop via HTML audio. Seamlessness has not
been verified; iOS media unlock and volume constraints remain.

## Fix list

1. Replace the sharpest cartoon-like weapon and warning oscillators; distinguish
   fighter/capital weight, launches and impact scales. Apply distance to both
   procedural and sample layers, and add stylised remote-feed filtering/delay.
2. Add a single lightweight, optional engine bed, distinct alert/radio/docking
   events, and make critical alerts take priority over music.
3. Compose and map the missing patrol, tension, hive, capital, Bullfrog,
   retreat, rescue, loss, victory and title moods; verify loops and credits.
4. Audition at safe levels on the owner's devices, including simultaneous
   incoming missile warnings and large battles; check unlock after backgrounding.

## Implementation notes for review

The enhanced layer now substitutes restrained contact and subsystem feedback
for the arcade-style kill and hit tones. The original tones remain available
with the sample/enhancement layer disabled. Hull and energy cautions are
prioritised below missile, enemy-lock and beam alerts, spaced apart and
rate-limited; these thresholds and cues are pending owner audition.

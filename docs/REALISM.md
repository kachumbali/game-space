# Realism review (military-analyst subagent, 2026-10-21)

Summary of an independent review of the Lilypad build against public knowledge of space warfare. Figures marked (calc) are the reviewer's arithmetic from code values; missile-g, M61 and CIWS numbers are from background knowledge, not fetched sources.

## Verdict
- Overall: an atmospheric dogfight model with a space skin. Defensible as genre (Wing Commander / X-Wing), not as physics.
- Not defensible physically: 1.5-6 km radar and 2 km engagements (real detection is millions of km); sub-340 m/s missiles that a fighter can outrun; drag on coasting missiles and on flares (vacuum has none); "pulse laser" as a 650 m/s projectile; capacitor energy instead of heat limits; slow big ships (acceleration is thrust-to-mass, not size); omniscient radar.
- Defensible: fixed-gun convergence and lead pipper; shield -> armour -> component -> structure chain; subsystem kills; seeker gimbal limits, burnout, proximity fuzes, shoot-down; separate IR flares and RF chaff; CIWS-style point defence against missiles; finite stores.
- Contested premise: fighters as dogfighters. A defensible role is the torpedo bomber / sensor picket; the Toad fits that.
- Note: `SIM_SPEED` defaults to 0.375, so a 150 m/s fighter moves about 56 m/s in real time.

## Prioritized fixes (effort, playability impact)
1. Vacuum-correct decoys and missiles: remove drag, keep co-moving decoys, plume-aware seduction (S, low)
2. Afterburner fuel/boost pool and a heat gauge for sustained fire (S-M, positive)
3. Rename "pulse laser" to plasma bolter, or add real hitscan lasers with heat cost (S, neutral/positive)
4. Raise missile `vmax` so torpedoes outrun fighters; retune lock times (S, harder)
5. Replace blast falloff with a fragment cone or short radius (M, low)
6. Detection model: passive bearing-only contacts, active scan, ECM/jamming (M-L, medium)
7. Link corvette acceleration to thrust, add broadside PD (M, raises capital threat)
8. Railgun rounds unstoppable by PD; overpenetration via armour thickness (S, positive)

## Sources
- https://projectrho.com/public_html/rocket/spacewardetect.php
- https://projectrho.com/public_html/rocket/spacewardefense.php
- https://www.armscontrol.org/act/2021-12/news/russian-asat-test-creates-massive-debris
- https://www.csis.org/analysis/space-threat-assessment-2025 (summary page only)

Caveat: reviewer read 70_ai.js and 75_mission.js only by grep; some Atomic Rockets pages (including the fighter page) were not fetched.

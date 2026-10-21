# Discussion: moving the fighting model toward The Expanse (James S. A. Corey)

Question (2026-10-21): how hard would it be to change the fighting model to one more like The Expanse?

Answer: moderately hard for the physics, hard for the gameplay. Roughly 3-5 sessions to reach something playable; the main risk is fun, not feasibility.

## Cheap (mostly present)
- Newtonian flight exists (key F); thrust-only movement plus a flip-and-burn controller is small.
- Missiles, point-defence turrets and railguns exist; torpedo salvos with point defence as the main defence and railguns as heavy hitters are mostly retuning (see docs/REALISM.md, docs/PLAN.md).
- Subsystem damage model already fits.

## Medium
- Rescaling engagements from hundreds of metres to tens/hundreds of km: floating origin, radar/targeting/rendering at range.
- g-limits and crew effects (blackout), fuel and delta-v budgets.
- AI that plans burns and intercepts instead of steering at a point.

## Hard
- Detection and stealth: heat/emission hiding, bearing-only passive tracking, sensor lag. A new system, the core of Expanse-style combat.
- Pacing: long approaches, few exchanges; needs time compression and new ways to show the player what is happening.
- Premise: small manned fighters barely exist in that setting, which undercuts the Wing Commander premise (see docs/REALISM.md, section on fighter usefulness).

## Recommendation
Keep the arcade fighter game as is. Treat an Expanse-style mode as a separate capital-ship / fleet layer on top, not a replacement for fighter combat.

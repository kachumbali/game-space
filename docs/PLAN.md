# Next round plan (after human test of current build)

Status 2026-10-21: A1-A4 done (vacuum decoys/missiles, plasma bolter rename, faster missiles, piercing railgun, fleeing ships break contact). Multi-area missions + transit cutscenes done (mission 2). Sky/planet rework done (src/41_sky.js). Phone HUD compaction done. Next candidates: see docs/TIE_FIGHTER_COMPARISON.md (power allocation first). Remaining: resolution/LOD, afterburner fuel (A5), fighter subsystems.

## A. Cheap realism fixes (from docs/REALISM.md)
1. **Vacuum decoys and missiles** (src/60_weapons.js)
   - Remove coast drag on missiles (`sp*(1-0.06dt)`); keep speed after burnout.
   - Flares/chaff keep the launching ship's velocity (co-moving), no `exp(-0.5dt)` decay of motion; they still expire by lifetime.
   - Seduction probability depends on the target's plume: afterburner raises the chance a missile ignores a flare; flares work best with engines throttled down.
   - Test: seduction rate vs throttle, headless over 200 launches.
2. **Rename "pulse laser" to plasma bolter** (PL-4), keep projectile behaviour. Real hitscan lasers are deferred.
3. **Missile speed**: raise `vmax` of ir/rf (340 -> ~420) and torpedoes (175 -> ~260) so torpedoes outrun fighters; shorten lock times slightly and keep range caps. Retune against the 37.5% sim speed; check the bot still survives.
4. **Railgun beats point defence**: rail rounds ignore PD shoot-down and overpenetrate armour (damage carries through to structure/components). Needs a small `pierce` field in WEAPONS and use in `applyHit`.
5. **Afterburner fuel pool** (optional, S): 20 s of boost, refills slowly, shown on HUD. Decide after testing.

## B. Pending from earlier requests
- Multi-area missions: areas of operation, autopilot transit with WC-style flyby cutscenes (skippable), 2-3 friendly corvettes in the fleet, bigger mission 2.
- Voxel resolution x2 option for fighters; cache voxelisation per ship type; LOD for corvettes.
- Subsystem work for all classes: more exposed targets on fighters (sensor, weapon pods), visible damage per subsystem.

## C. Order
A1-A4 (one session of work, one build), then B multi-area missions, then resolution/LOD.
Everything stays behind the current defaults until tested: speed 0.375, turn +50%.

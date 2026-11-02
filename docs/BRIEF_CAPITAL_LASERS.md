# Brief: capital-laser class split (owner-approved 2026-11-02)

Problem (OPEN_QUESTIONS 29): frigate/cruiser lasers delete whole fighter wings in seconds.
Base: current `main` (beam charge-up `charge`, per-weapon `slew` deg/s, `tuning.beam`, `hitFighters`, `tuning.turret` already exist in `data/db.json` / `src/60_weapons.js`).

## Required behaviour
1. **Anti-capital LS-8 (`laserM`, size M/L)**: add a target-class filter, so it prefers capital-sized and large targets and does not retarget small fighters. Slow slew (M ~15-20 deg/s, L ~10-12), long retarget delay (>= 1.5 s), long charge.
2. **New anti-fighter pulse class S** (new weapon id, e.g. `pulseS`; existing `laser` LS-2 may be converted or kept): the ONLY class with fast slew (>= 90 deg/s), short range, low damage per hit, so it suppresses fighters but does not delete a wing at once.
3. **Target spreading**: turrets on one ship avoid picking the same target while others are available (soft penalty per turret already on the target).
4. **Skill-based miss**: beam/pulse tracking error grows with target angular speed; hit chance depends on the shooter's skill value (exists in `SK_PLAYER` / AI skill), so veterans hit more than rookies.
5. Fighters keep beam-immune XL rule from M2 unchanged. Marks (`*_2..4`) inherit via `base`; do not break `tools/validate_db.py`.

## Hecla
Stays at 6 lasers. Re-measure only; no turret count change.

## Acceptance
- `tools/check_branch.sh` green (images rule not triggered).
- `tools/tests/balance_sweep.py` before/after: Exeter+escorts median FROGG kills per Bullfrog fight clearly below ~30 (target 12-18); Hecla vs 3 Kestrels > 60 s; vs 3 Merlins > 20 s. Report numbers in `docs/BALANCE_REPORT_3.md`.
- No change to arcade/campaign rules. Commit author `Jonas Koll <178489347+kachumbali@users.noreply.github.com>`; no personal email.

# Codex brief 9: armed Hive mothership, FROGG frigate, FROGG missile picket

Read `AGENTS.md`, `docs/DESIGN_ARMAMENT_LAWS.md`, `docs/DESIGN_REAL_GEOMETRY.md` and `docs/measurements/brief8/swarm-after.md` first. Same rules as before:
- one branch and one PR per job, from current `main`;
- `python3 tools/gate.py` green before every push;
- handle-only git identity;
- never push to `main`, and never commit `index.html` or `docs/img/`;
- numbers in the PR, plus what you did not verify.

**Hulls render as real geometry by default** (`?vox=mesh`; owner 2026-11-14). Design and review every model in mesh mode. Prims must meet rather than hide colours inside each other, and `tools/overlap_audit.py` must report no coincident or exposed pairs for the new and changed ships. All laws apply: the size, power and toughness laws, the turret slot table and the range law. Run `tools/armament_law.py --apply`, `tools/power_table.py --law --apply` and `tools/range_law.py` after data changes. All model tests apply too: `detached_t`, `seat_attach_t`, `muzzle_t` and `damage_vis_t`.

## Owner decisions (2026-11-14)

1. **The Hive carrier becomes an armed mothership.**
   - It launches FROGG fighters and Gulpers from its hangar, like the Bullfrog's bays.
   - It carries carrier-class point defence and secondaries. No spine.
   - It is a boss: dangerous through what it launches, killable by a fleet.
   - It needs a detailed model pass: in mesh mode it now looks low-poly, about 20 large prims for 2.5 km.
2. **New FROGG frigate-class escort.** About 400 m, the counterpart to the Exeter. Maser secondaries, heavy point defence, Mark V missile batteries. It sits between the Gulper and the Bullfrog.
3. **New FROGG corvette: missile picket.** It follows the "better missiles" doctrine: Mark V missile racks against fighters and corvettes, light guns, and it keeps its distance. The Gulper stays the torpedo striker.

## Job W: armed Hive mothership (branch `codex/hive-mothership`)

**Data.**
- Turrets per the carrier slot table: up to 8 M and 12 S. Use FROGG weapons (`acidT` masers M, `sting` and `thorn` S), with explicit seats on the hull.
- Hangar: `dock.fighters` 60 and `dock.corvettes` 6 are already in the data.
- Generalise the Bullfrog hangar (`src/79_bullfrog.js` `hangarInit` / `hangarUpdate`) so any FROGG ship with `dock.fighters` launches from named bay components. Give the Hive 4–6 bays, with launch points at visible bay mouths.
- Gulper launches count against `dock.corvettes`.
- Airborne cap: a third of the complement, as for the Bullfrog.

**AI.** It holds position or advances slowly. Its bays open when hostiles come within about 6 km. It does not chase.

**Model.** A detail pass on the long-jaw skull and spine design from brief 4, about 120–200 prims at authored scale. FROGG material language, no glow. Keep the silhouette the owner approved.

**Balance (20 seeded runs, with `tools/tests/armament_duels.py` extended to fleets):**

| Fight | Target |
|---|---|
| Hive vs Columbus + 2 Halberds | the human fleet wins about 50–70% |
| Hive vs Glaive + Exeter | the human fleet wins about 50–70% |
| Hive vs a lone Glaive | the Hive wins clearly |

Report the cause of death and time to kill for each.

**Tests:** extend `bullfrog_t`'s hangar checks to the Hive (launch cadence, airborne cap, bay loss), plus `wing_capital_t` (wingmen ordered onto the Hive must damage it).

## Job X: FROGG frigate escort (branch `codex/frogg-frigate`)

**Data.**
- New id, for example `croaker`; propose three names and the owner picks.
- `cls: 'frigate'`, `fac: 'frogg'`, about 400 m.
- Frigate slot table (1 XL, 4 L, 8 M, 6 S), but no XL: there is no spine on a frigate.
- Masers (`acidT`) and lances as secondaries, `sting` and `thorn` point defence, and Mark V missile batteries (`tick` against fighters, `tad` in small numbers).
- Burst-bank doctrine under the armament law (`fac: 'frogg'`).
- Add it to the skirmish list and the yard. Not in missions yet.

**Model.** FROGG bio-mech, distinct from both the Gulper's claw and the Bullfrog's broad brute. Missile racks and turret seats must be visibly structured.

**Balance (20 seeds):**
- vs Exeter: about even (40–60%);
- vs Glaive: it loses most;
- 2 frigates vs Glaive: about even.

## Job Y: FROGG missile picket corvette (branch `codex/frogg-picket`)

**Data.**
- New id, for example `peeper`; propose three names.
- `cls: 'corvette'`, about 150–200 m, swarm role (`tuning.armamentLaw.roles`).
- Racks of Mark V `tick` missiles (anti-fighter), plus a few `tad` torpedoes against corvettes; light S turrets; no lances.
- AI: keeps its distance (stays around its missile range, about 2 km), fires salvos, and retreats when closed. Reuse the capital AI's corvette path with a stand-off; do not write a new AI from scratch.

**Model.** Small, distinct silhouette, with visible missile racks and launch points at the rack mouths.

**Balance (20 seeds):**

| Fight | Target |
|---|---|
| 2 pickets vs Halberd | about even |
| 1 picket vs 4 Kestrels | Kestrels win most |
| 1 picket vs 1 Kestrel | about even |

The picket is a fighter killer at range, weak up close.

## Report (each job)

- Before and after tables.
- Contact sheets in mesh mode (scratch output, not git).
- Any data moved.
- What was not verified (real iPad, hand-play).

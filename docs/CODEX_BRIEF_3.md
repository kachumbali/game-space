# Codex briefs, round 3 (owner decisions 2026-11-10)

Read `AGENTS.md` and `docs/ROADMAP.md` first. Same rules: one branch per job, commit and push after each part, `tools/gate.py` green before every
push, handle-only git identity, never push to `main`, say what was not verified. Balance numbers stay in `data/db.json` (`tuning`).

## Job E: damage visuals and shields (branch `codex/damage-shields`)
Owner report: "weapons take out huge chunks from models, so fighters sometimes have holes right in the middle - not realistic; shields should be larger
than the whole ship, often parts stick out of the shield." Lead's findings: `chip()` (`src/50_state.js`) carves up to 0.2 R + 0.5 m and scorches up to
0.35 R + 1 m per hit, keeps 250 carve events per ship, and a destroyed internal component carves `c.r * 0.85` at the component's own position
(`src/65_combat.js` ~145), i.e. in the middle of the ship. The shield mesh (`src/55_ships.js` ~25) is an ellipsoid at 0.95 / 1.25 / 0.97 of the
half extents, so nose, wings and nacelles stick out; shield hits are tested against the hull, not the bubble.
Owner decisions (A1-A4, B5-B7):
1. **Normal hits make shallow dents only:** at most one voxel layer deep and never more than about 10 % of the hull's local thickness; real holes
   only once the hull is below 25 % (tunable in `tuning`). Scorch, sparks and smoke as today.
2. **A destroyed internal component leaves no crater inside the ship:** mark the nearest outer surface instead (scorch, smoke trail, sparks).
3. **Capital ships keep visible carving** (corvette and larger), with the same rule that nothing is cut through the middle of the hull.
4. **A dying fighter breaks into 2-4 chunks** that tumble away (split the voxel set by a plane or two through the hull, keep the chunks' colours,
   inherit velocity plus a small spin, fade after a few seconds). Keep the existing explosion effects. Mind the voxel cost (`docs/PERF_REPORT.md`).
5. **Shield bubble sized per ship from the model:** an ellipsoid that encloses every voxel, plus 10-15 % (tunable).
6. **While a shield facet is up, shots stop at the bubble surface** with the impact spark on the bubble; hull and components are hit only once that
   facet is down. Applies to bolts, beams and missiles alike; the tandem torpedo's precursor still collapses the facet (`docs/MISSILES_M3.md`).
   This must not change damage numbers: only where the hit lands and what is drawn.
7. **Visibility:** flash at the impact point only (as today, but at the correct place on the bubble).
Tests: a new `tools/tests/damage_vis_t.py` (dent depth limit, no interior carve from components, capital carve kept, chunks on fighter death, bubble
encloses every voxel for every ship in the db, shield hits stop at the bubble, tandem still breaks through) and the existing `hull_carve_t.py`,
`armor_t.py`, `m3_missile_t.py`, `subsys_t.py`; screenshots of a damaged Kestrel, Merlin and Halberd before and after.

## Job F: presentation revision, then the stepped briefing (branch `codex/prologue-presentation`, then `codex/briefing`)
Owner decisions on `docs/DESIGN_PROLOGUE_PRESENTATION.md` (C8-C13):
- Accept the one ready room on the HALBERD.
- The commander on screen is **Cdr. Sarah Vance** (`docs/DESIGN_CAMPAIGN_RECONCILE.md`), reusing the existing commander portrait; drop the
  "command feed presenter" convention and the name Imani.
- The opening plays automatically before the first Prologue mission, skippable, with replay from the menu. Replace the fourth-wall line
  "An AI-designed space combat simulator." with an in-world line; the AI credit goes on the title card instead.
- Art budget: one new image (the ready room).
- Rewrite the after-scenes so people react: name the lost pilots, Hawk and Sparrow speak in character (`PILOT_DEFS`, `src/75_mission.js`), no
  form-like status lines ("Roster status: see the debrief." and similar go).
Then **build the stepped briefing first** (section 6 of the design) on `codex/briefing`: three steps (situation with Vance, objectives on the
tactical map from the spawn bearings, wing and loadout) with one LAUNCH button; difficulty and flight model move to OPTIONS. Desktop and iPad
landscape. Test `tools/tests/briefing_t.py` (step navigation, BACK/NEXT keeps selections, OPTIONS round trip, map sectors match the mission data,
`?go` bypass, iPad viewport, no console errors). The scenes come after, once the ready-room image exists.

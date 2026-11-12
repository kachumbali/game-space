# Codex brief 6: detached-part test, hidden-fighter damage leak, real-geometry hulls

Read `AGENTS.md`, `docs/ROADMAP.md` and `docs/DESIGN_REAL_GEOMETRY.md` first. Same rules as brief 5:
- one branch per job, from current `main`, merging `main` in when it moves (never rebase);
- commit and push after each part, with `python3 tools/gate.py` green before every push;
- handle-only git identity (`kachumbali`, `178489347+kachumbali@users.noreply.github.com`);
- never push to `main`, and never commit `index.html` or `docs/img/`;
- one PR per job, with the numbers asked for below and a list of what you did not verify.

The lead (Claude) reviews and merges. Do the jobs in order.

## Job K: detached-part test (branch `codex/detached-parts`)

The owner keeps finding parts that float off the hull: Glaive turrets, Bullfrog seats, and most recently rails on the Columbus rim. A part floats when a prim sits beside a chamfered edge instead of on it.

- Write `tools/tests/detached_t.py`. For every ship in `SHIPS`, at tablet detail (2) and at high detail (6):
  - voxelise the model and label its 6-connected solid components;
  - fail if any component other than the largest has more than 2 voxels;
  - report each failing component's bounding box in authored metres, and the prims that own its voxels (`pgrid`).
- Allow listed exceptions only with a reason, for example a part that is deliberately separate. Expect none.
- **Fix every ship the test flags**, in the ship files. Add structure so the part connects (a strut, plinth or root); do not delete it unless it is clearly a mistake. Do not move `db.json` positions unless a weapon cannot be served otherwise, and list any you move.
- Report: ships fixed, before and after component counts.

## Job L: hidden-fighter damage leak (branch `codex/los-leak`)

`tools/tests/turret_los_t.py` now picks its hiding place with a fixed sequence. In that place, all 16 Hecla turrets have no clear line and none fires with one, yet the Kestrel still takes about 20 damage in 10 s. This fails on `main`.

- Find the source. Candidates: a cached line-of-fire result (`T.losUntil`), splash or proximity damage, the point-defence path, or `traceLocal` stepping over thin lattice walls (it samples every 0.8 voxel along the ray).
- Fix the cause, not the test threshold.
- Run `turret_los_t`, `pd_t`, `capital_ai_t`, `hecla_t` and `beam_t`.

## Job M: real-geometry renderer, phase 1 (branch `codex/mesh-hulls`)

The owner decided (2026-11-12) that hulls become real geometry built from the same prims. The owner's yardstick is that it must **use less compute and look better** than today's chamfered voxels. Measure both.

**Starting point.** The prototype on branch `vox-hybrid-proto`: `tools/proto/hybrid_preview.js`, run with `tools/proto/hybrid_preview.py <ids>`. Its numbers at tablet detail:

| Ship | Chamfered triangles | Mesh triangles | Chamfered build | Mesh build |
|---|---:|---:|---:|---:|
| Falchion | 17.6k | 7.0k | 28 ms | 10 ms |
| Exeter | 45k | 22.5k | 56 ms | 29 ms |
| Bullfrog | 140k | 9.7k | 157 ms | 19 ms |
| Columbus | 89k | 4.6k | 142 ms | 10 ms |

**Build.**
- A hull mesh builder in `src/` (a new `21_mesh.js` or inside `20_voxel.js`), used by `buildVox` when `?vox=mesh`, and in the yard.
- Every `tap` (all `sh` shapes, `ax`, `sweep`, `sweepY`, `rot`), `ell` and `seg` (including `fy`) must match `primInside` exactly. Add a test that samples random points and compares mesh inside/outside with `primInside`.
- Mirrored copies; `glow` prims on the glow material; `lod` prims by detail tier.
- Tessellation scaled by shape size and by the detail setting.
- Merge all of a ship's hull triangles into as few draw calls as possible: one per material.
- `paint` and `text` prims: propose a method (a vertex-colour pass over the mesh, or a decal) and implement the cheaper one that still looks right.

**Unchanged in this phase.**
- The voxel grid (`s.vox.solid`) stays for collision, line of fire, shields and damage bookkeeping.
- **Try building it one or two detail steps lower in mesh mode** and report whether `turret_los_t`, `hecla_t`, `damage_vis_t` and `seat_attach_t` still pass. The grid is no longer seen, so it only needs to be accurate enough for gameplay.

**Measure, for every ship.**
- Hull triangles, draw calls and build time (uncached voxelise plus mesh), chamfered against mesh, at tablet and desktop detail.
- Contact sheets of all ships in both modes.
- If mesh mode does not beat chamfered on triangles and build time for a ship, say which and why.

Leave chamfered as the default. The owner decides the switch after phases 2 and 3.

## Job N: colour-overlap audit (branch `codex/overlap-audit`, after M)

With real surfaces, a colour that a later prim used to bury in voxels shows through or z-fights. The prototype's Falchion shows an orange patch.

- Write `tools/overlap_audit.py`. In mesh mode, for each ship, list prim surfaces that lie inside another prim, or coincide with one, and have a different colour.
- **Fix the ships** so shapes meet instead of hiding inside each other. Keep the silhouettes; the owner approved them.
- Report a per-ship list before and after.

## Job O: shading for mesh hulls (branch `codex/mesh-shading`, after N)

Voxels supplied dirt, wear and contact shadow; real geometry looks flat without them.

- Vertex ambient occlusion (baked per ship at build), and the `col2` / `rust` / `streak` / `strata` / `seam` / `rib` prim options mapped onto vertex colour or a small shared detail texture.
- **FROGG hide:** the scale relief now comes from voxel surface detail. Give the hide material an equivalent: a normal or bump detail texture, or a geometric scale pattern. No glow.
- Keep the triangle and build-time budget. Report the cost of the shading against Job M's numbers.

Damage visuals for mesh hulls (scorch and dent decals, breach decals with embers) follow in a later brief.

## Report (each job)

- The numbers asked for above.
- Screenshots in scratch output, not in git.
- Any data you moved.
- What you did not verify. Real iPad performance is always unverified unless the owner measured it.

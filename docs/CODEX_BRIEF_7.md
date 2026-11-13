# Codex brief 7: freeze hunt, flicker cleanup, mesh damage, seeded duels

Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/DESIGN_REAL_GEOMETRY.md` and `docs/DESIGN_ARMAMENT_LAWS.md` first. Same rules as brief 6:
- one branch and one PR per job, from current `main`, merging `main` in when it moves (never rebase);
- `python3 tools/gate.py` green before every push;
- handle-only git identity (`kachumbali`, `178489347+kachumbali@users.noreply.github.com`);
- never push to `main`, and never commit `index.html` or `docs/img/`;
- numbers in the PR description, plus a list of what you did not verify.

The lead (Claude) reviews and merges. Do the jobs in order. Chamfered voxels stay the default renderer; `?vox=mesh` is opt-in until the owner switches it.

## Job R: the 4.6 s freeze (branch `codex/freeze-hunt`)

The owner's skirmish report: desktop, about 4.5 min of play, worst frame **4,578 ms**, average 11 ms, frame recorder not on.
- The fleet was 2 Bullfrogs, 2 Gulpers and the Hive carrier, with many FROGG fighters.
- Nukes were used. The Hive carrier broke up and was destroyed.
- The Bullfrog hangar has since been fixed to 18 fighters with 6 airborne.

Measured by the lead:
- The Hive carrier builds in 64 ms at tablet detail and 0.7 s at high detail.
- A hit on it rebuilds slabs in 10–43 ms.
- So the hull build alone does not explain 4.6 s.

**Suspects, in order:**
1. A nuke blast calling `chip()` across many large ships in one frame. `chip` loops every cell inside its radius, and a 2.5 km Hive carrier is a big grid.
2. The Hive carrier's break-up and death: debris built from all its voxels, and the wreck split.
3. Spawning several capitals at once (uncached voxelise), including a jump-in.
4. Shader compiles the first time a new material appears (glow, the nuke flash).

**Do:**
- Reproduce with `?fps` at desktop detail (`q=high`) in a seeded skirmish: `?sk=bullfrog:2,gulper:2,hivecarrier:1&nuke=2&nukeKt=1&seed=7`. Script it: nuke the Hive carrier, then a Bullfrog.
- Find every frame over 100 ms, and attribute it with `performance.now()` spans or the PERF hooks.
- Fix each cause without changing gameplay results. Options include:
  - spreading the work over frames, like `flushAllVox`'s time budget;
  - capping the cells a single blast may visit per ship, with any excess queued;
  - building debris lazily;
  - prewarming shaders.
- **Target:** no frame over 100 ms in that scenario at `q=high`, and none over 50 ms at `q=low`.
- Add a regression test, `tools/tests/hitch_t.py`, that runs the scenario and asserts those limits. SwiftShader is slow, so use the worst-frame ratio against the scenario's median, not absolute milliseconds, if needed.

## Job P: flicker cleanup (branch `codex/overlap-fix`)

Brief 6 Job N added `tools/overlap_audit.py`. Its total (3,419 pairs) mixes buried interior surfaces, which an opaque mesh never shows, with visible problems.

**First, sharpen the audit.** Report three classes per ship:
1. **Coincident same-facing surfaces of different colour.** These flicker (z-fight) in mesh mode. Today there are 405: Hecla 179, Bullfrog 34, tender 27, Exeter 25, Columbus 19, Glaive 15, and others.
2. **Exposed buried colour:** a surface of one prim, inside another prim's volume, that is still visible from outside because the covering prim does not reach that point on the hull. The Falchion's orange patches were this kind.
3. **Buried and invisible.** Count only; no action.

**Then fix classes 1 and 2 on every ship.** Make shapes meet or nest properly, or turn the colour into `paint`. Silhouettes, `db.json` positions and seat attachment stay as they are. Keep `detached_t`, `seat_attach_t` and `muzzle_t` green.

**Target:** class 1 = 0 and class 2 = 0 at tablet and desktop detail. Provide a mesh-mode contact sheet of the five worst ships before and after.

## Job Q: damage on mesh hulls (branch `codex/mesh-damage`)

In mesh mode, hits currently leave the surface untouched; only the voxel grid underneath changes. Bring the damage rules of brief 3 Job E (`docs/CODEX_BRIEF_3.md`) to the mesh. Read `chip()` and `dentCell()` in `src/50_state.js`. `?vox=mesh` only; the chamfered renderer stays as it is.

**Behaviour:**
- **Scorch:** vertex colours darken around each hit, using the same scorch radius as `chip`.
- **Dents:** shallow dents displace nearby vertices inward. Respect the 10%-of-local-thickness limit; never cut through.
- **Breaches:** below the hull-hole threshold (`tuning.damageVisuals.holeHullFraction`), a breach decal with glowing embers. Use the same events (`s.dmgEvents`), so a rebuild (LOD, detail change) replays them.
- **Fighter death:** the 2–4 tumbling chunks split the mesh by the same planes as `fighterChunks`.
- **Performance:** no per-hit full-mesh rebuild. Patch only the vertices in range, and give only the hull's colour and position buffers an update range. Report the per-hit cost on the Bullfrog and the Columbus.

**Tests:**
- extend `damage_vis_t` to run in mesh mode as well;
- add `mesh_damage_t`: scorch present after hits, dents within the limit, no new triangles;
- screenshots of a damaged Kestrel, Halberd and Bullfrog in both modes.

## Job S: seeded duels for the armament laws (branch `codex/duels`)

The armament laws (`tools/armament_law.py`, `tuning.armamentLaw`) changed hull, shields, power, spine damage, turret counts, FROGG missiles (Mark V) and fighter magazines in one step. `AGENTS.md` requires seeded runs before anything is called balanced.

**Run at least 20 seeded runs per cell** (`?seed=`; the harness may reuse `tools/tests/ttk_matrix.py` if it fits). Cells:

| Duel | Question to answer |
|---|---|
| Glaive vs Exeter | the destroyer should win most |
| Columbus (escorted by 2 Halberds) vs Bullfrog | the carrier alone should lose; escorted it should be roughly even |
| Hecla vs Bullfrog | |
| Halberd vs Gulper | corvettes roughly even |
| Kestrel vs Leaper, Kestrel vs Reaver, Falchion vs Reaver | fighter duels |
| 4 Kestrels vs 1 Gulper | |

**Report:** win rate, median time to kill, and the cause of death (spine, turrets, missiles, guns).

**Do not tune.** Propose changes in the PR as numbers against the laws (role factor, burst seconds, magazine reference, mark lanes). The owner decides.

## Report (each job)

Numbers as asked, screenshots in scratch output (not in git), any data moved, and what was not verified. Real iPad performance is always unverified unless the owner measured it.

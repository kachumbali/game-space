# Codex brief 5: turret draw calls, human fleet carrier, Bullfrog pass 3

Read `AGENTS.md` and `docs/ROADMAP.md` first. The rules are the same as before:
- one branch per job;
- commit and push after each part;
- `python3 tools/gate.py` must be green before every push;
- git identity is the handle only (`git config user.name kachumbali`, `git config user.email 178489347+kachumbali@users.noreply.github.com`);
- never push to `main`, and never commit `index.html` or anything under `docs/img/`;
- say what you did not verify.

The lead (Claude) reviews and merges. Branch every job from current `main`; merge `main` in when it moves, do not rebase. Do the jobs in order.

## What changed since brief 4 (read before you start)

Ship hulls are no longer rendered as instanced cubes (`src/50_state.js`):
- **Smooth hulls are the default** (owner decision 2026-11-12: "all smoother if it simplifies compute"). The voxel grid is turned into a smooth surface (surface nets) per z slab. Non-fighter hulls build **one detail step lower** than the quality setting, because smoothing hides the coarser grid. Fighters keep their full step.
- `?vox=cube` shows merged cubes; `?vox=inst` shows the old instanced renderer. Use them only for comparison.
- Damage rebuilds the touched slabs, at most about 4 ms of rebuild work per frame.
- `s.vox.body` is now a `THREE.Group` of slab meshes. `body.count` still reports the surface voxel count, so existing tests keep working.
- **Design consequence:** a part thinner than about 2 voxels at the built detail can pinch or vanish on a smooth capital. To see the voxel size, run `__game.voxelize(def, __game.resFor(def, detail - 1), detail - 1).vs` in the browser. Check every design in the default smooth mode, not only with `?vox=cube`.

## Job H: turret draw calls (branch `codex/turret-batching`)

**Problem.** The hull is now cheap, but turrets are not. Every turret model in `src/60_weapons.js` (around lines 575–672) is built from about 10–15 separate meshes, and each mesh is one draw call. Measured with `renderer.info.render.calls` at `?q=low`, one ship alone in view:

| Ship | Draw calls |
|---|---:|
| Bullfrog | about 300 |
| Glaive | about 234 |
| Exeter | about 218 |
| Gulper | about 101 |

On the iPad this is now the likely main render cost.

**Goal.** At most **40 draw calls per capital** in the same test, with no visible change to the turrets.

**Constraints.**
- Turret aiming (yaw and pitch) must stay exactly as it is.
- Destroyed-turret visuals, muzzle positions (`turretMuzzle`) and line-of-fire checks (`turretLineClear`) must not change.

**Suggested approach.** Your choice, but report what you picked and why:
- merge each turret's static parts into one geometry per moving node (base, yaw, pitch), using vertex colours or a shared material; or
- share one `InstancedMesh` per part type across all turrets of a ship.

**Tests.**
- Add `tools/tests/drawcall_t.py`: draw-call counts for Bullfrog, Glaive, Exeter, Gulper and Hecla, each alone in view, each under the target.
- Also run `muzzle_t`, `turret_los_t`, `seat_attach_t`, `capital_ai_t`, `pd_t` and `damage_vis_t`.
- Provide before and after screenshots of a turret close-up.

## Job I: human fleet carrier (branch `codex/fleet-carrier`)

Owner decision: dedicated carriers carry the fighters; corvettes have no bays, frigates few, destroyers a few more (`docs/FLEET_LOGIC.md`). The existing Hecla (1 km, 36 fighters) is the reference for size versus hangar capacity.

**Ship.** A new human fleet carrier.
- id `carrier`, class `capital`, faction `human`.
- About **1,200 m** long: author it at a convenient size and set `tuning.scaleTo.carrier`, as the Glaive does.
- Name: propose three names; the owner picks one.

**Hangar.** About **72 fighters**:
- `dock.fighters: 72`, `dock.corvettes: 2`;
- `ordnancePlan.hangar` with `total: 72`, 6 bays as named components, an `airborneCap` and `interval` that you justify against the Hecla's;
- a manifest of Kestrel, Falchion, Bittern and Merlin;
- a `droneLimit` that follows `tuning.droneLimit.capital`.

**Weapons.** A carrier relies on its escorts. Fit point defence and capital secondaries only: no main guns and no spine gun.
- Fit them by the range law and the energy law. Run `tools/range_law.py` and `tools/power_table.py --law`, and apply both.
- Hull, armour and shields: scale them from the Hecla by size, and show the arithmetic in the report.

**Look.** The human fleet language, as on the Exeter and Glaive:
- `CF` palette, `capSeat` / `cfSeat` pedestals;
- flight deck openings that read clearly as launch bays (visible openings, framed; fighters launch from them, so each `launch` point is at a bay mouth);
- a long, flat-topped hull, clearly different in outline from the Hecla and Glaive.

All model-rule tests apply:
- a seat on hull under every turret;
- structure at every mount and launcher;
- no floating parts;
- everything inside `half`.

**Wiring.**
- Add the carrier to the skirmish ship list.
- Make it a valid `setup.home` for the roster (`src/73_roster.js`).
- Add it to the yard.
- Do not put it in any mission yet.

**Tests.**
- Run `seat_attach_t <id>`, `muzzle_t`, `damage_vis_t`, `roster_t`, `drone_t` and `hecla_t`.
- Add a new `carrier_t.py`: launch cadence, airborne cap, recovery, and the hangar empties and refills.
- Report the tablet-detail triangle count (`renderer.info.render.triangles`, carrier alone in view).

## Job J: Bullfrog pass 3 (branch `codex/bullfrog-3`)

The owner accepted brief 4's round 2. The Gulper and Hive carrier now read well. The Bullfrog is the weakest: from the side and in 3/4 view it is still a long, thin hull.

- **Make it the broad brute of the brief.** It should be visibly wider and heavier than it is tall, with the mass at the shoulders. Use the whole collision box (half 95 × 55 × 300).
- **Keep the round-2 elements:** jaw armour around the spine gun, swept fins, side bays.
- **Same hard constraints as brief 4:** no `db.json` position changes, every weapon structured, no floating parts, no glow.
- **Review in smooth mode (the default).** Fins and armour plates must be at least 2 voxels thick at the built detail (see "What changed").
- **Deliverable:** black-silhouette sheet of all FROGG ships (top, side, 3/4) plus a smooth-mode contact sheet. Run `bullfrog_t` (its tablet band now counts voxels at the built detail; report it) and the gate.

## Report (each job)

- Before and after numbers: draw calls, triangles and voxel counts, as relevant.
- Screenshots in your scratch output, not in git.
- Any data you moved.
- What you did not verify.

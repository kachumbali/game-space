# Codex brief 4: FROGG ship design rework (Job G)

Read `AGENTS.md` and `docs/ROADMAP.md` first. The rules are the same as in brief 3:
- one branch per job;
- commit and push after each part;
- `python3 tools/gate.py` must be green before every push;
- git identity is the handle only (`git config user.name kachumbali`, `git config user.email 178489347+kachumbali@users.noreply.github.com`);
- never push to `main`, and never commit `index.html` or anything under `docs/img/`;
- say what you did not verify.

The lead (Claude) reviews and merges.

## Branch

Branch `codex/frogg-design` from **`origin/range-law`**, not from `main`.
- `range-law` already has: the bio-mech FROGG fighters, a first-pass Gulper and Bullfrog, the helper kit you will use, and the range and energy laws.
- The lead is merging `range-law` into `main` in parallel. Merge `main` into your branch when it moves; do not rebase.

## Goal

Rework the visual design of the FROGG ships so that each one reads as a distinct, believable alien warship at combat distance. Ships, in order:
1. **Bullfrog** (600 m spine carrier, `cls: 'capital'`). Highest priority. The first pass reads as a big Gulper.
2. **Gulper** (escort corvette, authored at 66 m, scaled to 200 m by `tuning.scaleTo`).
3. **Hive carrier** (super carrier, authored at 900 m, scaled to 2.5 km). It still has the old look, with the cyan glow kit from `fRef`.
4. Optional, only if the capitals are done: polish of the five FROGG fighters (`darter`, `leaper`, `spitter`, `toad`, `reaver`). Their outlines were approved by the owner. Do not change their silhouettes, only detail quality.

## Owner direction (decided, do not reopen)

- **Hybrid language.** The materials of the Gemini fighter sheet everywhere: scaled creature hide with machinery strapped on (gunmetal cages and frames, copper pipe bundles, clamp-on boxes, chunky round thrusters). The big outlines come from the two concept sheets the owner will attach:
  - a long-jaw skull vessel (orange/teal sketch with the sphere fighter inset): use this for the **Hive carrier**;
  - the battleship concept sheet (nine dark organic hulls: claw prows, sweeping fins, ribbed vents, segmented bodies): use it for the **Gulper and Bullfrog**.
  - Use the sheets for shape language and mood. Do not copy a specific design from them; it is third-party art.
- **No glow.** The FROGG voxel style has `noGlow: true`. No `glow: true` prims on FROGG ships; drive flames come from the runtime. Remove the `fRef` glow kit from the Hive carrier when you rebuild it. After the Hive rebuild, the attach line at the end of `src/31_ships_frogg.js` should attach nothing.
- **No acid.** FROGG weapons are kinetic (autocannons, rod guns, torpedoes) and energy (masers, lances, the spine). No sacs, venom, or green "acid" colours. The Spitter's former sac is now a dark maser capacitor bank.
- **Distinct silhouettes.** Each ship must be identifiable from its outline alone:
  - Gulper = compact claw corvette;
  - Bullfrog = broad, heavy brute with a jaw-like head around the spine gun, large swept side fins and visible side hangar openings (it launches fighters);
  - Hive carrier = long-jaw skull carrier with a long spine-like body.

## Hard constraints

- **Gameplay data stays as it is.** Do not change `data/db.json` positions (`mounts`, `turrets`, `engines`, `comps`, `launch`, `launchers`), sizes (`length`, `half`) or `tuning.scaleTo`. Build the geometry around the data.
  - If a position truly cannot be served, move it in `db.json` together with its component.
  - List every such move in your report.
- **Every weapon has physical structure at its position** (AGENTS.md "Ship model rules"):
  - a barrel or emitter at each mount `pos`;
  - a torpedo frame or tube mouth at each torpedo mount;
  - a seat on a pedestal rooted in the hull under each turret.
  - Use `fgSeat` / `gSeat` / `bfSeats` in `src/31_ships_frogg.js`. `bfSeats()` builds every Bullfrog seat from the database; do the same for the Hive carrier.
- **No floating parts.** Every mass visibly connects to the hull in top, side and 3/4 views. Everything stays inside `half` (the collision box).
- **Voxel budget.** At tablet detail (index 2), do not exceed the previous instance counts by more than 20%. `bullfrog_t.py inst` prints the counts. Its "tablet 40–60k" band check already failed before this job (37k); do not make it worse.

## Kit (`src/31_ships_frogg.js`)

- `tap(c, hz, h0, h1, col, o)` is a tapered box along z; `h0` is at the front (−z).
  - Option `ax: 'x'` makes a wing: `h` = [chord half, thickness half].
  - Shapes: `sh: 'e'` elliptic, `'h'` chamfered, `'d'` diamond.
  - Other options: `sweep`, `rot`, `noMirror`, `noDetail`.
- `ell(c, r, col, o)`, `seg(a, b, ra, rb, col, o)`, `chain(points, radii, col, o)`.
- Models mirror about X; −Z is the nose.
- Palette `FM`: `hide`, `hide2`, `met`, `met2`, `dk`, `cu`, `bone`, `rust`, `rust2`, `cap`.
- Helpers:
  - `fmThr(x, y, z1, r, len)`: round thruster ending at the engine position;
  - `fmRing(cx, cy, z, rx, ry, t)`: cage ring;
  - `fmRail(...)`: cage rail;
  - `fmBarrel(x, y, z0, z1, r)`: barrel with muzzle collar;
  - `fmPipe(points, r, col)`: pipe bundle;
  - `fgSeat(x, y, z, dy, D, y0)`: pedestal seat from `y0` inside the hull to the turret at `y`.
- Hide prims carry the automatic FROGG scale greebles. Add `NG` (`noDetail`) to metal parts.

## Verification (each ship)

1. `python3 build.py`
2. `RS_K=1.4 RS_W=1400 RS_H=800 python3 tools/render_ships.py high <id>`: inspect clean, 3/4, top, side and front. Also check the in-game yard (`?yard=<id>`) with the extents box on.
3. `tools/tests/seat_attach_t.py <id>`: all turret seats rest on hull.
4. `tools/tests/muzzle_t.py`, `damage_vis_t.py` (shield bubbles enclose the hull) and `roster_t.py`.
5. `tools/tests/bullfrog_t.py`: report any failure. The tablet instance-band check already failed before this job (see Hard constraints).
6. `python3 tools/gate.py`.

## Report

- Renders: one contact sheet per ship, plus a sheet of all FROGG ships side by side at the same scale. Put them in your scratch output, not in git.
- Instance counts before and after.
- Any moved data positions.
- What you did not verify.

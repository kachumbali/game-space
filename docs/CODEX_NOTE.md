# Note for Codex (written 2026-11-02 by the cloud Claude session; read this before branching)

Read in this order: `AGENTS.md`, this note, `docs/PLAN_V04_CODEX.md`, `docs/BRIEF_CAPITAL_LASERS.md`.

## What happened since you stopped
- Your whole local branch `integration/gemini-handoff` (25 commits after 385052a) is merged into GitHub `main`. **Your design won every conflict.** Kept from the cloud side: M2 (weapons by size, beams, XL fighter immunity), M4 roster (Falchion, SAR, liner, Claymore), AO jump prompt (key X), Hecla and balance sweeps.
- Branch from current `origin/main`, **not** from your old local tree: it is far behind and would conflict.
- Merged fixes you should know about: `spawnWave` waits for the player (it crashed in `?scene=` cutscene mode; the bug was in your tree too); `tools/validate_db.py` uses your tandem schema (`shieldDrain`, `pierce`, `window`); the old `m3_missile_t.py` is retired (`docs/MISSILES_M3.md` marked superseded).
- Owner decisions 2026-11-02: split the capital-laser class (brief in `docs/BRIEF_CAPITAL_LASERS.md`); Hecla stays at 6 lasers; Merlin firepower waits for play-test; `bomber-ai-fix` and the interceptor doctrine are dropped; no LICENSE for now.

## Owner rules that must hold
- Four modes stay: Free Flight, Skirmish, Campaign, Gauntlet; plus Shipyard and the intro cutscene. **No arcade drops, pods, perks or score bonuses in Campaign**; they stay in Free Flight and Gauntlet.
- Commit author `Jonas Koll <178489347+kachumbali@users.noreply.github.com>`. The owner's personal email must never appear (the gate checks).
- Do not edit `index.html` by hand; run `python3 build.py`. Balance claims need >= 20 seeded runs. Numbers live in `data/db.json`.
- Gate before any merge: `tools/check_branch.sh`. Its image rule fires on `assets/` (owner art); that failure is accepted until P0 exempts `assets/`.

## Test state (what is red and why)
Cloud session cleaned most of it on branch `p0-test-debt` (check for a merged state first, `git log origin/main`). Remaining known reds:
- `bullfrog_t`: 3 fails (HUD text during lock; friendly-in-line charge and fizzle checks). Fails identically on `main` before the merge. Real Bullfrog code issue.
- `touch_qa_t`: 4 fails (no touch DOCK control `#bdock`; touch power shift does nothing). Documented gaps in the player-facing touch UI, not test bugs.
- `tur_aim_t`, `yard_t`, `tern_t`, `tender_pd_t`: see `docs/CODEX_INTEGRATION_LOG.md` for the latest status.
- `view_t`, `plog_t`, `render_t`, `muzzle_t` are utilities that need arguments, not tests (see `tools/tests/README.md`). Do not put them in a sweep.
- SwiftShader hangs with many open pages: run tests one at a time. Stale symlinks `audio`/`data` in `/tmp/gs_*` cause FileExistsError: remove them.

## Coordination
Cloud Claude is working on P0 (test debt) and will not touch P1 onward unless told. If you take P0 too, say so in `docs/CODEX_INTEGRATION_LOG.md` to avoid two agents on the same files. One branch per phase; never two agents in one tree.

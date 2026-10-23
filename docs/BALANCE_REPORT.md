# Seeded balance sweep

- **Date:** 2026-10-23
- **Branch:** `balance-sweep`
- **Game/source commit measured:** `6a9efeb3cf1aa6f8c44d07d54265fd0e7befc5bc`
- **Runs:** 20 per scenario, seeds 1-20 (140 total)
- **Runtime:** Playwright + Chromium for Testing, SwiftShader, `q=low`

No gameplay code or balance values were changed for this report. The exact per-run
records, including winner, time, per-ship survivors/losses, damage, hostile-hit
counts, movement, and console errors, are in
[`docs/data/balance_sweep_2026-10-23.json`](./data/balance_sweep_2026-10-23.json).

## Method

Each URL initializes the real skirmish setup. The idle human-controlled player
is moved off-stage; a matching AI ship replaces it when needed. Existing
skirmish wingmen, allies, and enemy forces retain the game's normal setup and
AI. This makes the scenarios AI-vs-AI measurements, not player-pilot results.
Scenario E uses a Halberd AI replacement because `sk_ship` accepts only
Kestrel/Merlin.

Pages are run one at a time. The harness disables `requestAnimationFrame`
before page load, uses `?seed=N` and reseeds after setup, and disables distance
LOD to prevent rendering and LOD timing from consuming randomness or changing
hit tracing. It steps `__game.update(0.05)` directly and stops on force
elimination or at 180 simulation seconds. Starting separation is 2,000 m
except Exeter scenarios D0/D2 at 4,000 m.

Per-ship damage is **net shield plus structure loss attributed to that ship's
latest hostile hit in an update**. It excludes armour absorption and
component-only damage; it is not raw weapon damage. Losses count every ship
launched during the run, including Bullfrog hangar fighters. TTK is enemy-force
elimination time for human wins only. Median losses and quartiles include all
20 runs; quartiles use linear interpolation. “Terminal time” is when a side
was eliminated or the cap was reached.

## Results

| Scenario | Human wins | Human TTK, winning runs only (median [25th-75th], n) | Human losses (median [25th-75th]) | FROGG losses (median [25th-75th]) | Terminal time (median [25th-75th]) | 180 s caps |
|---|---:|---:|---:|---:|---:|---:|
| A. Kestrel vs 3 Darter + 3 Leaper + 3 Spitter | 0/20 (0%) | — (0 wins) | 1 [1-1] | 0 [0-0] | 42.35 [36.52-52.93] s | 0 |
| B. Merlin vs same | 0/20 (0%) | — (0 wins) | 1 [1-1] | 0 [0-0] | 42.62 [37.31-52.62] s | 0 |
| C. 3 Merlin vs 2 Reaver + 2 Toad | 12/20 (60%) | 120.15 [109.28-124.29] s, n=12 | 0 [0-0] | 4 [3-4] | 129.18 [116.96-180.00] s | 8 |
| D0. Exeter vs Bullfrog, no fighter escorts | 1/20 (5%) | 100.65 [100.65-100.65] s, n=1 | 1 [1-1] | 29.5 [27-31.25] | 100.08 [96.41-105.95] s | 0 |
| D2. Exeter + 2 Kestrels vs Bullfrog | 9/20 (45%) | 120.90 [114.30-154.55] s, n=9 | 2.5 [1-3] | 29.5 [25.25-36.25] | 109.35 [96.84-133.47] s | 1 |
| E. Halberd vs 2 Gulpers | 6/20 (30%) | 26.35 [23.41-28.69] s, n=6 | 1 [0-1] | 1 [1-2] | 24.80 [24.29-26.32] s | 0 |
| F. 3 Kestrels vs Bullfrog | 0/20 (0%) | — (0 wins) | 3 [3-3] | 0 [0-1] | 86.00 [65.68-107.17] s | 1 |

For A, B, and F there was no successful human TTK; terminal time is reported
instead. C's eight capped runs ended with 1-2 FROGG ships and 2-3 human ships
still active. F's capped run ended with 1 Kestrel and 13 FROGG ships active.
D0's TTK quartiles describe one win only and are not a stable estimate.

## Reproduction

Run from the repository root. This was the command used for all cells:

```sh
GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
  /tmp/gs_venv/bin/python tools/tests/balance_sweep.py \
  --scenario all --seeds 1-20 --batch-size 1
```

The exact URL forms below are generated for each seed `N` (1 through 20); all
also include `q=low`.

| Scenario | URL query |
|---|---|
| A | `?sk=darter:3,leaper:3,spitter:3&sk_ship=kestrel&sk_wship=kestrel&sk_wing=0&sk_skill=3&sk_range=2000&seed=N` |
| B | `?sk=darter:3,leaper:3,spitter:3&sk_ship=merlin&sk_wship=merlin&sk_wing=0&sk_skill=3&sk_range=2000&seed=N` |
| C | `?sk=reaver:2,toad:2&sk_ship=merlin&sk_wship=merlin&sk_wing=2&sk_skill=3&sk_range=2000&seed=N` |
| D0 | `?sk=bullfrog:1&sk_ship=kestrel&sk_wship=kestrel&sk_wing=0&sk_skill=3&sk_ally=exeter&sk_range=4000&seed=N` |
| D2 | `?sk=bullfrog:1&sk_ship=kestrel&sk_wship=kestrel&sk_wing=2&sk_skill=3&sk_ally=exeter&sk_range=4000&seed=N` |
| E | `?sk=gulper:2&sk_ship=kestrel&sk_wship=kestrel&sk_wing=0&sk_skill=3&sk_range=2000&seed=N` |
| F | `?sk=bullfrog:1&sk_ship=kestrel&sk_wship=kestrel&sk_wing=2&sk_skill=3&sk_range=2000&seed=N` |

The game/data source SHA above was captured before the report and harness were
committed. The report commit contains the harness used to run it. For a direct
comparison, check out this report's branch and verify that the game/data source
SHA matches; a changed game build or harness invalidates the comparison.
Same-seed repeat check: scenario A, seed 1, produced identical results on two
separate runs.

The Exeter retune was already present in the measured source: LS-2 damage 3
and LS-8 damage 6.5. Neither value was changed here.

## Proposals (ranked)

1. **Do not use A/B to choose between Kestrel and Merlin.** Both solo cells
   lost 20/20, with median terminal times of 42.35 s and 42.62 s and one human
   loss every run. This force ratio overwhelms either single fighter and does
   not distinguish them; use a less lopsided comparison.
2. **Treat F as an intentionally overwhelming capital matchup, not a balance
   point.** Three Kestrels won 0/20; all three were lost in 19 runs, while the
   remaining capped run had only one Kestrel against 13 FROGG ships. Do not
   retune fighter values from this cell.
3. **Keep the Exeter escort count explicit in any Bullfrog test.** D0 won
   1/20, while D2 won 9/20 (+40 percentage points); median FROGG losses were
   29.5 in both, but median human losses rose from 1 to 2.5. Two escorts change
   the outcome materially but are themselves costly. This is evidence for
   testing fleet composition, not for another laser retune.
4. **Treat C's 8/20 cap outcomes as unresolved, not wins or losses.** They
   leave 1-2 FROGG and 2-3 human ships active; the 12 completed human wins had
   median TTK 120.15 s. Investigate the long-running engagements before making
   a fine balance claim.
5. **E is directional, not a settled even point.** Halberd won 6/20, with
   median losses of one ship on each side and interquartile loss ranges of
   0-1 human / 1-2 FROGG. Twenty seeds meet the minimum sample standard, but
   the 30% win rate is too noisy to justify a narrow balance adjustment alone.

## Odd observations

- **Console errors:** none captured in 140 runs.
- **Stationary AI:** none met the harness diagnostic (alive for at least 30
  simulation seconds and under 25 m total movement).
- **No credited hostile hits despite at least 30 seconds alive:** A had 24
  ship-runs (15 Leapers, 9 Spitters); B had 42 (20 Leapers, 18 Spitters,
  4 Darters); D2 had 3 Toads; F had 11 (10 Leapers, 1 Reaver).
  These ships did move; this records no damaging hits credited to them, not
  proof that their AI was stuck.

## Validation

- `python3 -m py_compile tools/tests/balance_sweep.py tools/tests/lib.py` — pass.
- Raw result check — pass: 7 scenarios, 20 ordered seeds per scenario, all
  below the 180 s cap, no captured browser errors.
- `PATH="/tmp/gs_venv/bin:$PATH" GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" tools/check_branch.sh balance-sweep`
  — pass: build/lint, database validation, no personal email in new commits,
  no images, 13/13 URL variants, and `p0_t`.

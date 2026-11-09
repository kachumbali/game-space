# Seeded balance sweep 2

- **Date:** 2026-10-24
- **Branch:** `balance-sweep-2` (not merged)
- **Game/data baseline:** `f5423dbce91ad2f0c5ec34932f31aa12850df06e`
- **Initial measured source/harness commit:** `022305acaa5def6fed3edfd63f015ae7db14a0ad`
- **Runs:** 30 seeds (1-30) in each of 27 cells; 810 completed runs
- **Runtime:** Playwright + Chromium for Testing, SwiftShader, `q=low`
- **Raw results:** [`docs/data/balance_sweep_2_2026-10-24.json`](./data/balance_sweep_2_2026-10-24.json)

No gameplay code, ship data, or balance values were changed. The harness and this
report are on the requested branch. The raw file records three harness-only
continuation commits (`ece5ff4`, `b98152e`, `d40e7a5`); they address browser
lifecycle, resuming, and transient startup retries. The source/database files
were unchanged across those commits.

## Method and interpretation

Each run initializes the real skirmish URL, parks the human-controlled player
off-stage, then recreates the listed human roster as AI ships. AI wings and the
enemy force use the game's normal AI. All runs are therefore AI-vs-AI, not
player-pilot outcomes. The requested mixed rosters and HECLA enemy-side ships
are harness-spawned; Bullfrog hangar fighters are counted among FROGG losses.

The harness disables `requestAnimationFrame` before load, reseeds after setup,
turns LOD off, and advances only `__game.update(0.05)`. Initial separation is
2,000 m except the Exeter/Bullfrog cells at 4,000 m. The default cap is 180
simulation seconds; L uses 300 seconds and also records active ships at exactly
180 seconds. Each run uses one page at a time. HECLA's 0- and 4-laserM variants
are injected by the harness init script; `data/db.json` is not altered.

“Human wins” means the FROGG force was eliminated. “FROGG wins” means the human
force was eliminated. Time-cap runs are unresolved, not wins or losses. TTK is
FROGG elimination time for human-winning runs only. Losses include all launched
ships, including Bullfrog hangar fighters. Values are median [25th-75th
percentile], using linear interpolation; cells have 30 runs. Damage is net
shield plus structure loss attributed to the latest hostile attacker in an
update, excluding armour absorption and component-only damage. G damage/ship is
the median [IQR] of each run's side-total divided by ships launched.

An observed result is not automatically a balance point: the seed sample is
finite, long fights can hit the cap, and these are scripted AI pilots. Do not
read a 30/30 result as a guarantee about real play.

## G. Kestrel-Merlin head-to-head

| Cell | Human wins / FROGG wins / caps | Human TTK, winning runs | Median losses H/F | Damage per ship Kestrel / Merlin | First hit |
|---|---:|---:|---:|---:|---|
| 1v1 | 0 / 0 / 30 | — | 0 / 0 | 18.9 [8.4-28.9] / 28.3 [19.4-36.6] | Kestrel 13, Merlin 17; 11.0 [8.4-13.6] s |
| 3v3 | 12 / 1 / 17 | 120.1 [102.8-138.2] s, n=12 | 0 [0-1] / 2 [2-3] | 80.1 [70.8-90.8] / 76.5 [70.0-94.1] | Kestrel 12, Merlin 18; 6.4 [6.0-6.9] s |

**Conclusion:** The 1v1 cell did not resolve in any seed. At 3v3 Kestrels
eliminated the Merlin side in 12 runs, but 17 more were unresolved; Merlin got
the first credited hit more often in both sizes. The 3v3 result is a directional
advantage for Kestrel, not an even-point comparison.

## H. Escalating mixed FROGG fighter groups

Each step uses equal numbers of Darter, Leaper, and Spitter: one each (3 total),
two each (6), and three each (9).

| Cell | Human wins / FROGG wins / 180 s caps | Human TTK, winning runs | Median losses H/F |
|---|---:|---:|---:|
| 3 Kestrel vs 3 | 28 / 0 / 2 | 91.3 [73.6-106.5] s, n=28 | 0 / 3 |
| 3 Kestrel vs 6 | 14 / 0 / 16 | 138.4 [128.9-150.6] s, n=14 | 0 [0-0.75] / 5 [4-6] |
| 3 Kestrel vs 9 | 0 / 3 / 27 | — | 1.5 [1-2] / 3 [2-5] |
| 3 Merlin vs 3 | 15 / 0 / 15 | 130.0 [113.1-148.3] s, n=15 | 0 / 2.5 [2-3] |
| 3 Merlin vs 6 | 0 / 0 / 30 | — | 0 / 2 [1-2] |
| 3 Merlin vs 9 | 0 / 5 / 25 | — | 1 [0.25-2] / 2 [1-3] |

**Conclusion:** Kestrels first fall below a 50% human win rate at six
opponents (14/30); 16/30 are still unresolved there. Merlins reach exactly
15/30 at three opponents, then secure no wins at six. At nine, both types have
zero human wins, but most runs still time out (27 Kestrel, 25 Merlin); only
three and five, respectively, are decisive FROGG wins. Thus the first step
where they fail to secure a majority is six, while a decisive losing trend is
clearest at nine. Treat the caps as unresolved engagements, not as additional
FROGG wins.

## I. Enemy skill

| Enemy `sk_skill` | Human wins / FROGG wins / caps | Human TTK, winning runs | Median losses H/F |
|---:|---:|---:|---:|
| 2 | 30 / 0 / 0 | 65.3 [54.0-76.2] s, n=30 | 0 / 4 |
| 3 | 30 / 0 / 0 | 56.2 [50.4-64.9] s, n=30 | 0 / 4 |
| 4 | 30 / 0 / 0 | 62.4 [57.8-75.8] s, n=30 | 0 / 4 |

**Conclusion:** Three Kestrels beat two Reavers plus two Toads in all 90 runs.
The win rate did not change; TTK is non-monotonic, with skill 3 faster than
both 2 and 4. This is not evidence for a linear skill-to-difficulty curve.

## J. Exeter and fighter composition vs Bullfrog

| Cell | Human wins / FROGG wins / caps | Human TTK, winning runs | Median losses H/F |
|---|---:|---:|---:|
| Exeter + 2 Kestrels | 14 / 14 / 2 | 119.5 [109.7-138.6] s, n=14 | 2 [1-3] / 30 [26.25-36.75] |
| Exeter + 2 Kestrels + 2 Merlins | 25 / 2 / 3 | 115.5 [112.5-127.2] s, n=25 | 1 [1-2.75] / 35.5 [29-36.75] |
| Exeter + Halberd | 26 / 4 / 0 | 93.5 [92.7-96.7] s, n=26 | 0 [0-1] / 37 [36-37] |

**Conclusion:** Adding two Merlins to Exeter + 2 Kestrels moved the human win
rate from 14/30 to 25/30, while median human losses fell from two to one; the
Bullfrog force, including launched fighters, lost a median 35.5 instead of 30.
Exeter + Halberd won 26/30 and had a shorter winning-run TTK, but this is a
different force composition, not a direct fighter substitution test.

## K. Halberd vs one to three Gulpers

| Cell | Human wins / FROGG wins / caps | Human TTK, winning runs | Median losses H/F |
|---|---:|---:|---:|
| Halberd vs 1 Gulper | 30 / 0 / 0 | 15.7 [15.4-15.9] s, n=30 | 0 / 1 |
| Halberd + 2 Kestrels vs 1 | 30 / 0 / 0 | 9.9 [9.4-10.3] s, n=30 | 0 / 1 |
| Halberd vs 2 Gulpers | 9 / 21 / 0 | 25.1 [22.8-27.6] s, n=9 | 1 [0-1] / 1 |
| Halberd + 2 Kestrels vs 2 | 30 / 0 / 0 | 14.0 [13.3-14.7] s, n=30 | 0 / 2 |
| Halberd vs 3 Gulpers | 0 / 30 / 0 | — | 1 / 1 |
| Halberd + 2 Kestrels vs 3 | 30 / 0 / 0 | 17.0 [16.1-19.1] s, n=30 | 0 / 3 |

**Conclusion:** An unescorted Halberd clears one Gulper 30/30, wins only 9/30
against two, and loses 30/30 against three. Two Kestrel escorts changed both
multi-Gulper cells to 30/30 human wins without human losses. These outcomes are
strongly composition-dependent; they do not establish a Gulper-only balance
point.

## L. C unresolved-cap check at 300 seconds

The 30-seed rerun of 3 Merlin vs 2 Reaver + 2 Toad had 30/30 human wins and no
300-second caps; median TTK was 130.1 [117.1-185.1] s. Nine runs were still
active at 180 seconds. All nine later ended in human wins. Active ships at
180 seconds had AI targets assigned; positions below are world metres rounded
to the nearest metre. “->” is the current target; the final parenthetical is
the last attacker recorded by the harness.

| Seed | Active ships at 180 s: position -> target (last attacker) |
|---:|---|
| 2 | W1 (2231,-303,-594) -> Reaver (Toad); W2 (2490,-230,-775) -> Reaver (Reaver); Reaver (2471,-245,-456) -> W2 (W2); H1 (2549,-168,-843) -> Reaver (Reaver) |
| 5 | W1 (527,10,385) -> Reaver (Toad); W2 (345,-24,147) -> Reaver (Reaver); Reaver (477,-7,129) -> H1 (H1); H1 (660,25,-160) -> Reaver (Toad) |
| 6 | W1 (1811,-621,-772) -> Reaver (Reaver); W2 (1417,-645,-885) -> Reaver (Reaver); Reaver (1887,-629,-767) -> W1 (W1) |
| 8 | W1 (-700,-783,-2642) -> Reaver (Toad); W2 (-691,-654,-2820) -> Reaver (Reaver); Reaver (-488,-709,-3006) -> W2 (W2); H1 (-531,-681,-2179) -> Reaver (Reaver) |
| 10 | W1 (353,56,-472) -> Reaver (Reaver); W2 (-251,8,-819) -> Reaver (Reaver); Reaver (-20,36,-635) -> H1 (H1); H1 (-242,-13,-916) -> Reaver (Reaver) |
| 13 | W1 (3163,953,-11159) -> Reaver (Reaver); W2 (3925,1220,-13569) -> Reaver (Reaver); Reaver (4202,1318,-14481) -> W2 (W2); H1 (3878,1205,-13444) -> Reaver (Reaver) |
| 17 | W1 (291,179,-790) -> Reaver (Toad); W2 (-100,124,-1248) -> Reaver (Toad); Reaver 1 (9,117,-1080) -> W2 (W2); Reaver 2 (-959,-46,-1067) -> W1 (W2); H1 (329,225,-1125) -> Reaver (Toad) |
| 19 | W1 (-763,-583,-88) -> Toad (Toad); W2 (-438,-449,122) -> Toad (Toad); Reaver (1659,2072,-3026) -> W2 (W2); Toad (-646,-471,121) -> W1 (W1) |
| 22 | W1 (3663,477,-396) -> Reaver (none); W2 (3617,472,-879) -> Reaver (Reaver); Reaver (3797,565,-660) -> H1 (W1); H1 (3558,511,-706) -> Reaver (Reaver) |

**Conclusion:** The former 180-second caps were genuinely extended fights rather
than inert ships: the sampled survivors had assigned targets, often exchanged
credited hits, and moved kilometres in some runs. The 300-second cap resolved
all 30; the active-at-180 snapshots are not themselves evidence that every
engagement was tactically healthy.

## M. HECLA with 12, 0, or 4 laserM turrets

Each cell has three human fighters. TTD is the median [IQR] among deaths only;
the `n/30` value is the number of deaths for that slot, with remaining ships
censored at the scenario cap. Weapon counts are harness-attributed candidate
weapons on lethal hit updates; more than one turret can fire on the same update,
so these are attribution records, not unique final-blow counts.

| Cell | Human wins / FROGG wins / caps | Median human losses | H1 TTD | WING1 TTD | WING2 TTD | Lethal weapon candidates |
|---|---:|---:|---:|---:|---:|---|
| 3 Kestrel vs 12 laserM | 0 / 30 / 0 | 3 | 30/30: 23.8 [19.7-29.3] s | 30/30: 27.7 [23.0-39.1] s | 30/30: 29.0 [24.7-45.7] s | 129 laserM, 1 PD |
| 3 Kestrel vs 0 laserM | 0 / 0 / 30 | 0 | 6/30: 106.6 [96.5-118.0] s | 2/30: 140.7 [135.8-145.7] s | 3/30: 124.4 [120.2-128.8] s | 11 PD |
| 3 Kestrel vs 4 laserM | 0 / 0 / 30 | 1 | 27/30: 55.5 [36.5-89.4] s | 6/30: 156.5 [141.9-162.6] s | 8/30: 107.4 [80.4-134.4] s | 21 laserM, 22 PD |
| 3 Merlin vs 12 laserM | 0 / 30 / 0 | 3 | 30/30: 4.9 [4.8-5.0] s | 30/30: 6.7 [6.4-7.9] s | 30/30: 7.7 [6.7-7.9] s | 113 laserM |
| 3 Merlin vs 0 laserM | 0 / 0 / 30 | 0 | 4/30: 86.3 [76.1-91.2] s | 1/30: 162.7 s | 1/30: 63.8 s | 6 PD |
| 3 Merlin vs 4 laserM | 0 / 30 / 0 | 3 | 30/30: 4.9 [4.8-5.0] s | 30/30: 7.0 [6.8-8.6] s | 30/30: 8.2 [7.0-8.4] s | 107 laserM |

**Conclusion:** With all 12 laserM turrets, HECLA eliminated all three Kestrels
in 30/30 runs (median slot TTD 23.8-29.0 s) and all three Merlins in 30/30
within a median 4.9-7.7 s. Removing laserM changed both matchups to 30/30 caps
with no human wins; PD still caused occasional deaths. Four laserM turrets left
Kestrels unresolved in all runs but killed at least one in 27/30; against
Merlins, the four-turret variant still eliminated all three in every run.
Lethal candidates include laserM turret components LS01-LS12 and PD. The full
per-run weapon/component records are in the raw JSON.

## Odd observations

- **Captured game-console errors:** 0 across all 810 runs.
- **Stationary-AI diagnostic:** 0 ship-runs moved under 25 m while alive for at
  least 30 seconds.
- **No credited hostile hits after 30 seconds alive:** 35 ship-runs: 14 Leapers,
  11 Toads, 6 Spitters, 2 Darters, 1 Bullfrog, and one human H1 in
  `h-merlin-6`. These are no-hit attribution flags, not proof that the AI was
  stuck; the stationary diagnostic did not trigger.
- The long C runs in L still had targets at 180 seconds, including some target
  switches/last-hit differences. Positions and target assignments are listed
  above and preserved per seed in the raw data.
- The sweep encountered transient Playwright page initialization/target-closed
  failures during long sequential execution. Missing seeds were resumed, and
  the final data has exactly 30 ordered seeds per cell. These were harness
  failures, not captured in-game console errors; continuation commits are
  listed in the JSON.

## AI-vs-AI caveat and follow-up proposals

These pilots all use automatic target selection, aim, and flight behavior.
A real player can manually select targets, exploit the capital's firing arcs,
manage power and missiles, and fly evasively; an AI wing also will not react to
the same tactical cues as a hand-piloted formation. Treat these outcomes as
repeatable AI engagement diagnostics, not a substitute for owner hand-play on
iPad/desktop.

### Ranked proposals

1. **Keep HECLA laser count as a high-priority acceptance test, not an immediate
   rebalance.** At 12 laserM, all 90 human fighters died across the Kestrel and
   Merlin cells; at zero lasers, neither side won any seed and median losses
   were zero; at four, all 30 Merlin runs still ended in a human-force loss.
   Confirm against a hand-piloted formation before changing the ship.
2. **Use explicit escort counts in Halberd/Gulper tuning.** Unescorted Halberd
   went from 30/30 wins at one Gulper to 9/30 at two and 0/30 at three; two
   Kestrel escorts restored 30/30 wins at both two and three.
3. **Do not infer a single fighter threshold from capped H cells.** At six
   mixed enemies, Kestrels won 14/30 while Merlins won 0/30, but the Merlin cell
   capped 30/30 and the Kestrel cell capped 16/30. At nine, 27/30 Kestrel and
   25/30 Merlin runs also capped. Extend or instrument these fights before
   making a numeric balance proposal.
4. **Do not make AI skill a monotonic TTK assumption.** The I cells all won
   30/30 with zero human losses; skill 3's 56.2 s median was faster than skill
   2's 65.3 s and skill 4's 62.4 s. Keep win rate and TTK separate.
5. **Continue Bullfrog composition testing.** Adding two Merlins to
   Exeter + 2 Kestrels changed wins from 14/30 to 25/30 and median human losses
   from 2 to 1; Exeter + Halberd won 26/30 with 0 median human losses. These
   different fleets should remain separate named test cells.
6. **Do not use G as a settled 1v1 balance point.** The Kestrel-Merlin 1v1
   ended at the 180 s cap in all 30 seeds with no losses; 3v3 had 12 Kestrel
   wins, 1 Merlin win, and 17 caps. The 3v3 result favors Kestrels directionally
   but remains partially unresolved.

## Reproduction

Initial invocation (the run was continued after transient page startup
failures):

```sh
GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
  /tmp/gs_venv/bin/python tools/tests/balance_sweep.py \
  --scenario sweep2 --seeds 1-30 --batch-size 1 \
  --output docs/data/balance_sweep_2_2026-10-24.json
```

Continuation command used for missing seeds:

```sh
GS_PORT=8766 \
GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
  /tmp/gs_venv/bin/python tools/tests/balance_sweep.py \
  --scenario sweep2 --seeds 1-30 --batch-size 1 \
  --output docs/data/balance_sweep_2_2026-10-24.json --resume
```

The output SHA and continuation SHAs are recorded in the raw JSON. `--resume`
requires the same seed range and time cap and verifies that `src/`,
`data/db.json`, and `build.py` did not change. This sweep is not a gameplay
change.

# Job V progress (incomplete)

Baseline: merged main a34a852. Hecla cradle amber overlays and nested shuttle-gate caps were converted to surface paint; the outer gate extent is retained. The dark nozzle interiors were moved inward by one metre while their outer glowing faces remain in place. The raw audit rows are in the adjacent CSVs. Counts are ordered prim pairs with at least one classified sample.

| Scope | Coincident before → after | Exposed before → after |
|---|---:|---:|
| Fleet tablet | 208 → 186 | 340 → 326 |
| Fleet desktop | 250 → 222 | 327 → 321 |
| Hecla tablet | 44 → 22 | 35 → 21 |
| Hecla desktop | 58 → 30 | 15 → 9 |

The remaining pairs are not fixed. The full fleet connectivity check passed at both detail levels, and Hecla turret seats passed. Hecla muzzle marker screenshots were generated; they require visual review. The Hecla mesh was compared at 3/4 view and muzzle markers were inspected at 3/4, top and bottom; the requested five-ship before/after contact sheets and full side inspection remain outstanding.

The harness now uses callback `performance.now()` for frame boundaries, matching the PERF clock. Previously the rAF timestamp sometimes preceded the action start, so the span filter missed work. This changes measurement only. The previous pre-merge baseline in `job-v-baseline.md` is retained for comparison; its numbers are one run and not a controlled performance experiment.

| Software scenario | Previous pre-merge baseline | Current merged branch |
|---|---:|---:|
| High worst / warm median / ratio | 3190.6 / 799.9 ms / 3.99× | 3544.3 / 873.4 ms / 4.06× |
| Low worst / warm median / ratio | 285.7 / 42.0 ms / 6.79× | 299.2 / 41.3 ms / 7.24× |

On the current low-detail worst frame, `nukeAt` took 6.9 ms, `flushAllVox` 6.3 ms and render submission 248.9 ms. High worst was a breakup frame; its detailed spans are in `hitch-after-merged.txt`. This supports software render submission as a major component of the observed low-detail spike, but does not rule out game work in other frames. The 3× low-detail target is unmet. A more useful CPU regression metric would report per-phase action/update and render-submission percentiles over repeated runs, retaining end-to-end frame timing as a separate renderer metric. No real iPad measurements were taken.

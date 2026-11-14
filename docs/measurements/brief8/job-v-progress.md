# Job V progress (incomplete)

Baseline: merged main a34a852. A Hecla cradle's amber overlay was converted from intersecting geometry to surface paint. The raw audit rows are in the adjacent CSVs. Counts are ordered prim pairs with at least one classified sample.

| Scope | Coincident before → after | Exposed before → after |
|---|---:|---:|
| Fleet tablet | 208 → 202 | 340 → 334 |
| Fleet desktop | 250 → 238 | 327 → 321 |
| Hecla tablet | 44 → 38 | 35 → 29 |
| Hecla desktop | 58 → 46 | 15 → 9 |

The remaining pairs are not fixed. The full fleet connectivity check passed at both detail levels, and Hecla turret seats passed. Hecla muzzle marker screenshots were generated; they require visual review. The two small 3/4 screenshots taken for this pass do not substitute for the requested five-ship mesh contact sheets or top/side inspection.

The harness now uses callback `performance.now()` for frame boundaries, matching the PERF clock. Previously the rAF timestamp sometimes preceded the action start, so the span filter missed work. This changes measurement only. The previous pre-merge baseline in `job-v-baseline.md` is retained for comparison; its numbers are one run and not a controlled performance experiment.

| Software scenario | Previous pre-merge baseline | Current merged branch |
|---|---:|---:|
| High worst / warm median / ratio | 3190.6 / 799.9 ms / 3.99× | 3544.3 / 873.4 ms / 4.06× |
| Low worst / warm median / ratio | 285.7 / 42.0 ms / 6.79× | 299.2 / 41.3 ms / 7.24× |

On the current low-detail worst frame, `nukeAt` took 6.9 ms, `flushAllVox` 6.3 ms and render submission 248.9 ms. High worst was a breakup frame; its detailed spans are in `hitch-after-merged.txt`. This supports software render submission as a major component of the observed low-detail spike, but does not rule out game work in other frames. The 3× low-detail target is unmet. A more useful CPU regression metric would report per-phase action/update and render-submission percentiles over repeated runs, retaining end-to-end frame timing as a separate renderer metric. No real iPad measurements were taken.

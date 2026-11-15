# Job V progress (incomplete)

Baseline: merged main a34a852. Hecla cradle amber overlays and nested shuttle-gate caps were converted to surface paint; the outer gate extent is retained. The dark nozzle interiors were moved inward by one metre while their outer glowing faces remain in place. A fully buried Gulper claw-barrel insert was removed while its muzzle collar remains. Hecla lights were shifted by 0.25 m and sensor pedestal roots were nested 0.25 m into the hull. The shared human turret-seat ring was raised by 3% of turret diameter. The Columbus nose plate was converted to a marking on the existing hull face, and its chine was nested 0.5 m at each end. The Exeter radiator stripe was converted to surface paint. Columbus's buried stern nozzle cylinders were replaced with circular face markings; its outer extent and visible four-nozzle pattern are retained. Exeter’s outer nozzle ribs were shortened to retain their visible ends while reducing buried overlaps; one inboard root remains slightly deeper to preserve voxel connectivity. The raw audit rows are in the adjacent CSVs. Counts are ordered prim pairs with at least one classified sample.

| Scope | Coincident before → after | Exposed before → after |
|---|---:|---:|
| Fleet tablet | 208 → 137 | 340 → 321 |
| Fleet desktop | 250 → 196 | 327 → 300 |
| Hecla tablet | 44 → 18 | 35 → 21 |
| Hecla desktop | 58 → 26 | 15 → 9 |
| Exeter tablet | 10 → 5 | 6 → 5 |
| Exeter desktop | 31 → 18 | 47 → 29 |

The remaining pairs are not fixed. Before the nozzle-rib change, the preceding fleet totals were reproduced after merging main 266ae6b; the table includes the subsequent rib change. The full fleet connectivity check passed at both detail levels, and all capital-ship turret seats passed. Five-ship desktop mesh contact sheets were generated locally for 3/4, top and side views; the images are ignored by the repository. Hecla muzzle markers were inspected at 3/4, top and bottom. A Columbus deck-stripe paint experiment reduced its coincident pairs by two on tablet and three on desktop, but added hundreds of triangles, so it was reverted.

The harness now uses callback `performance.now()` for frame boundaries, matching the PERF clock. Previously the rAF timestamp sometimes preceded the action start, so the span filter missed work. This changes measurement only. The previous pre-merge baseline in `job-v-baseline.md` is retained for comparison; its numbers are one run and not a controlled performance experiment.

| Software scenario | Previous pre-merge baseline | Current merged branch |
|---|---:|---:|
| High worst / warm median / ratio | 3190.6 / 799.9 ms / 3.99× | 3544.3 / 873.4 ms / 4.06× |
| Low worst / warm median / ratio | 285.7 / 42.0 ms / 6.79× | 299.2 / 41.3 ms / 7.24× |

On the current low-detail worst frame, `nukeAt` took 6.9 ms, `flushAllVox` 6.3 ms and render submission 248.9 ms. High worst was a breakup frame; its detailed spans are in `hitch-after-merged.txt`. This supports software render submission as a major component of the observed low-detail spike, but does not rule out game work in other frames. The 3× low-detail target is unmet. A more useful CPU regression metric would report per-phase action/update and render-submission percentiles over repeated runs, retaining end-to-end frame timing as a separate renderer metric. No real iPad measurements were taken.

A five-pass carrier build probe (middle two of four post-warmup timings) measured tablet mesh construction at 18.90 ms / 3,832 triangles before and 19.00 ms / 4,080 triangles after the eight-band nozzle stencil; desktop was 18.45 ms / 4,678 triangles before and 18.85 ms / 4,798 after. These single-run CPU measurements are not real-device performance.

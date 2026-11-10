# Real-GPU performance pass — 2026-11-10

The recorded opening segments of all four Prologue missions cleared 45 fps in every complete 10-second window after the changes below. This is **not a full-mission or real-iPad result**. Large individual hitches remain: in the desktop Long Retreat sample the worst frame was 1,183 ms. Sustained averages can hide a freeze.

## Machine and method

- Apple M4 Pro, 20-core GPU, macOS 27.0.1; headed Google Chrome 156.0.8078.80. The WebGL unmasked renderer in every case was `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)`. No SwiftShader flags or software renderer were used.
- Measured build: commit `04e1161`, rebuilt `index.html` SHA-256 `d16cdf133d3b9a66a7a943dfdbd27cdf2f4df87ad07ad0eb22d5163ee0047f6e`. Fresh browser context per case, `?fps&seed=42`, no quality override, device-pixel ratio 1, no manual input; enemies and allies use their normal AI. The opening tutorial was skipped. Each case had 5 seconds of warmup, then 25.5 seconds recorded, including at least two complete fixed 10-second windows. The simulation speed is lower than wall time; these runs reach the opening wave, not later waves, transit, endings or a complete mission. The unattended player did not fly or aim as a person would.
- `1440 × 900` used the auto-selected **desktop** preset (pixel size 1, detail 224, bloom on); `1180 × 820` used touch emulation and the auto-selected **tablet** preset (pixel size 2, detail 64, bloom on). The latter is Chrome on the Mac, not Safari or iPad hardware. These results do not cover Retina/DPR 2. Near-120 fps values are limited by the observed presentation cadence and are not a GPU throughput benchmark.
- Long Retreat 4 was selected because its starting fleet has an Exeter, two Halberds, two convoy hulls and an opening Gulper wave; its later Bullfrog stage was not reached. HECLA is a friendly HECLA, eight enemy Darters and two player wingmen (`?sk=darter:8&skh=hecla:1&sk_wing=2&sk_range=2000`). Seeded simulations can still diverge as actual frame timing changes.
- Full 10-second windows count completed frames in fixed wall-clock intervals. The minimum below excludes the final incomplete window. Overall p95 is rounded upward to 1 ms; the worst and averages use actual frame intervals. A stall crossing a window boundary contributes no completed frames during the portion it spans. One run per case is exploratory, not a statistical guarantee. Raw diagnostics: [final](perf/metal-final.json), [before mask change](perf/metal-baseline.json). The baseline was an instrumented working build with fixed windows and the idle-particle change, before the mask-loop change. The served HTML (with Three.js URLs redirected to local test files) had SHA-256 `137468b4c6dcfcf773d37034f57af20797f8372e44114f8d307854330f819ceb`; the final served HTML hash was `277cf4ea20e6dc786ad0fce1143ef0977e93abd895b499edf47b0b81d8eb74a1`.

## Measured opening segments

| Scenario | Viewport / preset | Mean frame ms | p95 ms | Worst frame ms | Slowest complete 10s fps | Mean draw calls/frame |
|---|---|---:|---:|---:|---:|---:|
| Prologue 1 | 1440 × 900 desktop | 8.4 | 10 | 150.7 | 118.1 | 37 |
| Prologue 2 | 1440 × 900 desktop | 8.4 | 9 | 200.0 | 117.4 | 67 |
| Prologue 3 | 1440 × 900 desktop | 8.4 | 9 | 233.3 | 117.2 | 73 |
| Prologue 4 | 1440 × 900 desktop | 8.6 | 9 | 349.9 | 115.7 | 77 |
| Long Retreat 4 | 1440 × 900 desktop | 8.9 | 10 | 1183.4 | 104.9 | 202 |
| HECLA skirmish | 1440 × 900 desktop | 8.7 | 10 | 250.0 | 113.9 | 89 |
| Prologue 1 | 1180 × 820 touch | 8.3 | 10 | 16.7 | 119.9 | 34 |
| Prologue 2 | 1180 × 820 touch | 8.3 | 10 | 16.6 | 119.9 | 65 |
| Prologue 3 | 1180 × 820 touch | 8.3 | 10 | 16.7 | 119.7 | 72 |
| Prologue 4 | 1180 × 820 touch | 8.3 | 10 | 25.0 | 119.7 | 77 |
| Long Retreat 4 | 1180 × 820 touch | 8.4 | 10 | 83.4 | 118.9 | 198 |
| HECLA skirmish | 1180 × 820 touch | 8.3 | 10 | 16.7 | 119.7 | 85 |

Draw calls include the bloom/composer passes. They are counts, not direct GPU timings. The two Prologue 3 desktop windows before the mask change had a 44.3 fps minimum and 9,258 ms worst frame; after, the corresponding single run had 117.2 fps and 233 ms. Prologue 4 went from 38.1 fps and 9,978 ms to 115.7 fps and 350 ms. The scenarios and seed were the same, but simulation timing can diverge, so these are individual before/after observations, not a guaranteed improvement factor.

## Costs and changes

1. **Voxel instances and construction.** At the sampled desktop endpoint, Kestrel meshes carried 7,173–61,998 instances depending on LOD; Halberd 78,547, Exeter 125,597, Gulper 225,669, and HECLA 23,272. Touch-preset examples were Kestrel 272–3,433, Halberd 7,985, Exeter 16,125, Gulper 33,150 and HECLA 17,322. These are mesh instance counts, including meshes that may be hidden or culled, not pixels drawn. Timed first-time voxelization in the final desktop sample included 148 ms for a Darter, 99 ms for a Leaper and 555 ms for a Gulper; mesh construction and uploads are additional. `buildVox` now fills its two identical occupancy masks with tight loops rather than calling a JavaScript callback for every grid cell. The test compares both masks against their sources.
2. **Draw calls and render work.** Desktop sampled means ranged from 37 calls/frame in Prologue 1 to 202 in Long Retreat 4; the latter still had the 1.18-second worst frame. The instrumented CPU time around renderer/composer submission is not GPU execution time and does not explain the full frame interval. A GPU timer trace and later-wave captures are still needed before attributing the remaining freeze to a particular GPU pass.
3. **Particles.** Four pools reserve 2,100 particles in total (700 sparks, 300 fire, 500 smoke, 600 fragments), and the old loop scanned and uploaded all four even when empty. At the final desktop snapshot, for example, Prologue 4 had 94 active particles, Long Retreat 4 had 99 and HECLA had 323; these are endpoint samples, not peak counts. Empty pools now skip their update and buffer upload; emission and expiration still update as before. The dedicated test covers slot overwrite and expiry.
4. **HUD and overlay canvas.** The full `updateHud` CPU section averaged approximately 0.24–0.35 ms/frame across these cases; it includes the other HUD elements, not just the full-screen 2D overlay. The overlay backing canvas was 1440 × 900 or 1180 × 820 pixels because DPR was 1. No HUD redraw-rate or visual change was made. DPR 2 and real Safari need separate measurement.
5. **Allocation / garbage.** A separate headed desktop Chrome V8 allocation-sampling run, with collected-object samples enabled and a 16 KiB sampling interval, estimated about 288 KiB allocated/frame in Prologue 4 (538 MB / 1,826 frames) and 293 KiB/frame in the HECLA run (627 MB / 2,086 frames). Sampling was active for about 18 seconds after a four-second warmup and perturbs execution; these are sampled JavaScript allocation estimates, **not measured garbage-collection bytes or pauses**, and exclude native/GPU and some backing-store memory. Do not interpret them as a precise garbage rate. Reproduce with `python3 tools/perf_alloc.py`.

The mask loops and empty-pool shortcut preserve gameplay and geometry; no quality, LOD or balance setting was changed. The old `?fps` detail governor was removed because silently changing detail invalidated fixed-quality comparisons. The recorder now reports overall average, p95 and worst plus fixed 10-second windows. When Job A is merged, its report includes the recorder summary and the most recent three windows. It has been tested in a temporary combined checkout.

## Reproduce the Mac run

Build with `python3 build.py`, then run `python3 tools/perf_gpu.py` from the repository root with Playwright, its browser dependencies and Google Chrome installed. The test helper uses a locally installed Three.js 0.170.0; on a first run it may install that package. The script opens headed Chrome one scenario at a time and refuses an unverified or SwiftShader renderer. Set `GS_PERF_OUTPUT` to change the JSON path, or pass `p04` / `hecla` etc. to run one scenario. Close other GPU-intensive applications and repeat runs before drawing a conclusion. `python3 tools/tests/perf_t.py` tests the recorder and optimized data paths; `python3 tools/gate.py` is the full project gate.

## Two-minute iPad check

Once this branch is merged and deployed, open the game link in Safari on the iPad with `?fps` added to the URL (use `&fps` if the link already has a `?`). Keep the iPad in landscape and leave graphics at their default. Launch Prologue mission 4, take control, and fly until the first enemy wave has appeared; continue for at least 20 seconds. Photograph or screenshot the **top-right FPS overlay together with the mission/action on screen**, and note any hitch and what was happening. If time permits, repeat in the HECLA skirmish. The overlay shows overall average/p95/worst frame times, the slowest completed 10-second window in fps, and the latest window's average/p95/worst. Share the screenshot or copy the Job A report after that work is merged. A Mac cannot measure iPad GPU performance; no iPad result is claimed here.

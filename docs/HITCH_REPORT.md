# Prologue spawn hitch investigation

## Measurement

On an Apple M4 Pro Mac, headed Google Chrome reported `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)` via `WEBGL_debug_renderer_info`; this was a real GPU, not SwiftShader. Each run used a fresh browser context at 1440 × 900, default graphics (detail 224), Prologue mission 1 or 2, `?go&fps&seed=42`, and local three.js 0.170.0. Tutorials were marked complete. The Job B `?fps` recorder was reset just before 34 seconds of unattended flight. Chrome DevTools Protocol tracing captured `devtools.timeline`, V8 CPU samples and compilation events during the same interval. CPU profiling itself adds overhead; these are automated opening samples, not the owner's hand-play sessions or full mission runs.

| Mission | First-wave frame before | Worst recorded frame before | Worst recorded frame after | Mean before / after | p95 before / after |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prologue 1 | 158.2 ms | 158.2 ms | 83.1 ms | 8.39 / 8.35 ms | 10 / 10 ms |
| Prologue 2 | 174.2 ms | 174.2 ms | 73.4 ms | 8.41 / 8.38 ms | 10 / 11 ms |

The after-run's largest frames occurred near trace/profiler startup (83.1 and 73.4 ms). Prologue 2 also had a later 66 ms frame; a 41.5 ms Kestrel lower-detail voxel build was recorded in that run. Smaller hitches remain; the measurements do not establish that all hitches are gone. The later Tern and drone waves were not reached in these unattended opening runs.

## Cause and change

The longest Chrome `FireAnimationFrame` slices were 162.1 ms and 182.1 ms, respectively. Their CPU samples were dominated by `frame → update → missionUpdate → runActions → spawnGroup → spawnShip → makeShip → buildVox → voxelize`, including `surfaceDetail` and `primInside`. The recorder measured the first Merlin voxelization at 140.5 ms and 129.1 ms; it occurred in the first hostile spawn in both cases. Garbage collection appeared in some samples, and background V8 optimization appeared in the trace, but neither was the dominant stack; these measurements do not identify a shader compile as the cause.

Before flight, the two affected missions now prepare the existing deterministic voxel cache for their mission-defined spawn types at the current detail setting. Spawns still use the same cache, geometry, code path, AI, and mission timing; no shader or visual settings change. A before/after SHA-256 comparison of the serialized voxel outputs matched at the actual default spawn resolutions for Merlin (224), Tern (272), Kestrel (227), and drone (72). Lower-detail LOD variants and changes to detail after mission setup can still require a build during flight. Cache preparation uses CPU and memory earlier, including for later waves that a player may never reach.

This moves work to mission setup. In three alternating fresh-context measurements without profiling, median navigation-to-ready time rose from 545.9 to 754.0 ms for Prologue 1 (+208.1 ms), and from 540.2 to 646.7 ms for Prologue 2 (+106.5 ms). Those startup measurements include page and browser overhead and are not isolated voxelizer timings. Test again with a human playthrough and the owner's settings, especially later waves and higher detail, before treating the issue as fully resolved.

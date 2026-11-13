# Job V baseline (work in progress)

At `main` c3dcf07, `tools/overlap_audit.py` reports ordered prim pairs with nonzero samples:

| Detail | Coincident pairs | Exposed pairs | Worst ships by combined pair count |
|---|---:|---:|---|
| Tablet (2) | 208 | 340 | Hecla 79, Gulper 47, Columbus 32 |
| Desktop (6) | 250 | 327 | Exeter 78, Hecla 73, Gulper 40 |

Raw rows are in `overlap-tablet.csv` and `overlap-desktop.csv`. No geometry has been changed or visually verified.

The hitch harness now records the actual rAF callback time with `performance.now()`, matching the clock used by the PERF spans. Previously rAF's supplied timestamp could precede the action's recorded start, making span attribution unreliable. A single SwiftShader `hitch_t.py --software --measure` run produced:

| Quality | Worst | Warm median | Ratio | Worst frame attribution |
|---|---:|---:|---:|---|
| High | 3190.6 ms | 799.9 ms | 3.99× | Hive nuke: 2.2 ms `nukeAt`, 2378.2 ms render submission |
| Low | 285.7 ms | 42.0 ms | 6.79× | Bullfrog nuke: 8.1 ms `nukeAt`, 4.8 ms `flushAllVox`, 246.5 ms render submission |

The complete run and spans are in `hitch-software.txt`. These are single software-rendered measurements; they suggest render submission dominates these particular worst frames, but do not prove all spikes lack game-code causes. A repeated measurement separating action/update CPU time from render submission and reporting frame-time percentiles would provide a more useful CPU regression measure than the maximum ratio alone. Low-detail target, geometry cleanup, screenshots, and real iPad performance remain outstanding.

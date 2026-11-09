# Touch and iPad checklist QA

Date: 2026-10-23
Branch: `touch-qa`
Scope: report-only; no `src/` gameplay files changed.

## Method

`tools/tests/touch_qa_t.py` uses Playwright touch emulation with `?free&go&touch&n=0&q=low&mute` at CSS viewports 844x390 and 390x844. It checks rendered control rectangles for overlap and viewport overflow, flags controls with either dimension below 44 CSS px, then sends touch input and checks the game state for fire, missile, target, power, pause, radar range, afterburner, docking control presence, and comms. The test-only pause hook freezes simulation while comparing radar renders.

Screenshots are saved locally under `tools/tests/touch_qa_shots/`, which is git-ignored. Bounds are compared to the viewport rectangle; this does not emulate device-specific safe-area insets, rounded corners, or a physical iPad.

## Results

| Viewport | Touch controls measured | Overlaps | Under 44 px | Outside viewport |
|---|---:|---:|---:|---:|
| 844x390 landscape | 18 | 1 | 16 | 0 |
| 390x844 portrait | 18 | 5 | 16 | 0 |

### Functional checks

| Control | 844x390 | 390x844 | Finding |
|---|---|---|---|
| Fire | Pass | Pass | Gun shot count increased during a held touch. |
| Missile | Pass | Pass | Selected missile store decreased and a missile launched. |
| Target | Pass | Pass | Touch cycled from the first hostile to the second. |
| Power | Pass | **Fail** | Portrait tap left allocation unchanged: the engine row overlaps the FLARE control. |
| Pause | **Fail** | **Fail** | `bpause` measures 12.5x12.2 px at the top-left and did not pause. Resume was not reached. |
| Radar range | Pass | Pass | Touch changed the rendered radar canvas. This control overlaps pause. |
| Afterburner | Pass | Pass | Afterburner activated and fuel decreased while held. |
| Dock | **Fail** | **Fail** | No `#bdock` touch control or touch binding is present. |
| Comms | Pass | Pass | Touch opened the communications menu. |

### Layout findings

- Pause and radar overlap by 125.3 px² at both viewports. Their measured bounds are 12.5x12.2 px and 17.5x12.2 px respectively, clustered at the upper-left corner.
- Portrait has five overlaps: weapons power row / missile, shields power row / missile, engines power row / FLARE, pause / radar, and BOOST / COMMS. The 372.3 px² engines-row / FLARE overlap explains the failed portrait power tap.
- Landscape has the pause / radar overlap only.
- The 16 undersized targets in each viewport are the three 155.8x12 px power rows; pause and radar; FLARE; BOOST; roll-left and roll-right; view, target, aim-target, subsystem, and missile-select; the 32.6x111.5 px throttle slider; and COMMS. FIRE is 68x68 px and missile is 44.9x44.9 px.
- No measured control rectangle extended beyond the viewport. This is not a device safe-area certification.

## Commands and outcome

- `python3 -m py_compile tools/tests/touch_qa_t.py` — passed.
- `python3 build.py` — passed; generated `index.html` was unchanged.
- `GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" GS_TEST_DIR=/tmp/gs_test /tmp/gs_venv/bin/python tools/tests/touch_qa_t.py` — ran both viewports; 19 checks passed and 5 failed for the pause, docking, and portrait power findings above. No console errors or failed requests in the final run.
- `tools/check_branch.sh touch-qa` — final result **PASS**: build/lint, database validation (13 ships, 29 weapons, 3 armour types), personal-email scan, image scan, `suite1.py` (13/13 URLs), and `p0_t.py`.
- On this macOS shell, the gate needed a temporary `timeout` wrapper and `PATH` to `/tmp/gs_venv/bin` so its `python3` could import Playwright. The unconfigured gate attempt could not find `timeout`; a first retry then used the default Python and could not import Playwright. The final configured gate passed. The temporary wrapper is not part of the changes.

## Not verified

- Physical iPad or phone behavior, hardware safe-area insets, and device-specific touch sampling.
- Any gameplay changes or remediation; none were made.
- Browser/device combinations other than the configured Playwright Chromium.

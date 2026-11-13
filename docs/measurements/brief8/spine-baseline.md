# Job U: initial spine traces (work in progress)

`python tools/tests/spine_trace.py` runs seed 1 of the fixed-opening brief-7 fights. `spine-baseline.jsonl` records the full `__bf.log`, outcomes and end-of-update shield samples. Shield-after values can include other actions during that update; exact isolated per-hit damage still needs a controlled measurement.

| Fight | Charges | Fizzles | Shots / hits / misses | Observed per-hit combined shield + hull loss |
|---|---:|---:|---:|---|
| Glaive vs Exeter | 2 (one each) | 0 | 2 / 2 / 0 | Exeter hit on Glaive: approximately 666; Glaive hit on Exeter: approximately 1,224 |
| Bullfrog vs Columbus | 2 | 0 | 2 / 2 / 0 | approximately 1,315 and 780 |

These are individual traces, not 20-seed balance claims. The baseline brief-7 duel set and outcome counts are in PR #12; the spine was the direct cause of 2 of 180 losses. No tuning has been applied. Charge/aim behavior, isolated fresh-capital damage, the complete after duel set, fighter immunity, friendly corridor and real-device behavior remain to be verified.

# Job T: swarm doctrine, after tuning (lead, 2026-11-14)

Owner targets (brief 8, revised 2026-11-13):
- two FROGG craft against one human counterpart: roughly even (40–60%);
- one-on-one: human about 80–90%.

Harness: `tools/tests/armament_duels.py`, 20 seeds per cell, varied openings (PR #14). Results are human / FROGG / timeout. These are AI simulations, not player results.

## Causes found (traces with the per-weapon damage tally, `?duelbench`)

1. **Gulper blinded.** The Halberd's guns destroyed the Gulper's exposed sensor dome (90 HP) at about 23 s, as it entered torpedo range. Lock range then dropped to 35% (about 1 km), so a lone Gulper launched one torpedo and fought blind. In 2-vs-1 only one Gulper gets blinded.
2. **Halberd split its fire.** It re-picked the nearest hostile every few seconds, shifting fire as the ranges crossed, and finished neither Gulper.
3. **Halberd fought out of its own reach.** It held at 2–3 km on 70% throttle and used only its railguns; its rotary cannon and pulse lasers never fired.
4. **Gulper pair over-armed.** In one 2-vs-1 run the Halberd took 2,125 damage (torpedoes 978, rod drivers 659, lances 488) against 1,382 hull and shields. No single Gulper weapon was decisive.
5. **Falchion.** It fights as three or four craft: two drones, a point-defence turret, eight missiles, two torpedoes and four guns. Its drones and turret alone dealt about 200–280 damage per Reaver.

## Changes

- **AI, both factions:**
  - corvettes and capitals keep their target unless another is clearly better (`tuning.ai.focusKeep` 1.4);
  - a corvette beyond its shortest gun's reach closes at full throttle.
- **Armament law:** role `swarm` = 0.35 for the Gulper (hull 706 → 247, shields scaled with it).
- **Reaver:** speed 95 → 115, turn 1.15 → 1.45, acceleration 50 → 60, shields 40/40 → 55/55.
- **Kept from PR #14:** the Gulper fires its beam secondaries at their full range; the Reaver ignores drones while a piloted fighter shoots it.

## Results

| Cell | Before (PR #14) | After |
|---|---:|---:|
| Halberd vs Gulper | 20 / 0 / 0 | 20 / 0 / 0 |
| Halberd vs 2 Gulpers | 0 / 20 / 0 | **8 / 12 / 0** |
| 4 Kestrels vs Gulper | 20 / 0 / 0 | 20 / 0 / 0 |
| Kestrel vs Leaper | 19 / 0 / 1 | 19 / 0 / 1 |
| Kestrel vs 2 Leapers | 6 / 13 / 1 | 6 / 13 / 1 |
| Kestrel vs Reaver | 19 / 1 / 0 | 19 / 1 / 0 |
| Falchion vs Reaver | 20 / 0 / 0 | 20 / 0 / 0 |
| Falchion vs 2 Reavers | 20 / 0 / 0 | **11 / 9 / 0** (after the Falchion trim) |
| Glaive vs Exeter | 20 / 0 / 0 | 20 / 0 / 0 |
| Columbus vs Bullfrog | 10 / 10 / 0 | 8 / 12 / 0 |
| Columbus + 2 Halberds vs Bullfrog | 13 / 7 / 0 | 12 / 8 / 0 |
| Hecla vs Bullfrog | 6 / 14 / 0 | 5 / 15 / 0 |

The Halberd cells were measured at swarm 0.35. The other cells were measured at 0.4; the Gulper does not appear in them.

## Assessment

- **Gulper:** two-against-one is now on target. One-on-one stays at 100%: by the square law of combat, one-on-one cannot drop toward 80–90% without tipping two-against-one past even.
- **Leaper:** on target within the ±20-point noise of 20 seeds.
- **Reaver:** on target against the Kestrel.
- **Falchion (owner 2026-11-14: trim its kit).** Removed its two drones and its ventral point-defence turret; it keeps one dorsal turret, four guns, missiles and torpedoes. Falchion vs 2 Reavers is now 11 / 9 (FROGG 45%), and 1-vs-1 stays 20 / 0. One drone kept the Falchion at 6–8 of 8 against two Reavers even with lighter shields, so the drones had to go. Drone control remains on frigates and carriers (Exeter, Columbus); the drone tests stock a test Falchion explicitly.

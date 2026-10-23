| ship | class | plant MW | wpn bus MW | capacitor MJ | reactors | reactor hp | wpn peak MW | sustain % | empty after sim-s (real-s) |
|---|---|---|---|---|---|---|---|---|---|
| kestrel | fighter | 51 | 17 | 100 | 1 | 30 | 17 | 102 | - |
| halberd | corvette | 300 | 100 | 600 | 1 | 200 | 106 | 94 | 100.0 (267) |
| exeter | frigate | 1050 | 350 | 2500 | 1 | 800 | 972 | 36 | 4.0 (11) |
| drone | fighter | 51 | 17 | 100 | 1 | 6 | 0 | - | - |
| tender | frigate | 900 | 300 | 2000 | 1 | 420 | 0 | - | - |
| darter | fighter | 51 | 17 | 100 | 1 | 12 | 0 | - | - |
| leaper | fighter | 51 | 17 | 100 | 1 | 18 | 180 | 9 | 0.6 (2) |
| spitter | fighter | 51 | 17 | 100 | 1 | 26 | 0 | - | - |
| toad | fighter | 51 | 17 | 100 | 1 | 34 | 0 | - | - |
| reaver | fighter | 51 | 17 | 100 | 1 | 30 | 180 | 9 | 0.6 (2) |
| gulper | corvette | 210 | 70 | 400 | 1 | 230 | 105 | 67 | 11.6 (31) |
| hivecarrier | capital | 51 | 17 | 100 | 1 | 2400 | 0 | - | - |
| bullfrog | capital | 960 | 320 | 3200 | 1 | 1100 | 60 | 533 | - |

Caveats: the Hive Carrier carries the fighter default (51 MW) with a 2400 hp reactor - a placeholder, to be authored in step 2/4. Draw counts only energy-costed mounts/turrets firing simultaneously; shields, engines and the rest do not draw yet.
rder: (1) database fields + back-fit, balance-neutral; (2) weapons and shields on buses + reactor threshold; (3) engines, afterburner, rest; (4) per-ship re-tune with hand-play and 20-run seeded measurements. Every player-facing piece ships with a touch binding, an AI default and a help line.

## Step 1 (done): database fields

`ships.<id>.power = { plantMW, capacitorMJ }` in `data/db.json`. `src/16_db.js` derives `energyRegen = plantMW / 3` (balanced 4/4/4 split: each bus gets a third) and `energyMax = capacitorMJ`. Values were back-fitted so every ship reproduces its former numbers; fighters, which used code defaults (17 / 100), now carry them explicitly (51 MW, 100 MJ). Verified by diffing the full runtime objects before/after: only the new fields differ.

`python3 tools/power_table.py` prints the budget (regenerate after any change):


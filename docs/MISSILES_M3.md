# Missiles and torpedoes (v0.3 M3)

Status: implemented on branch `v0.3-m3-missiles`; numbers measured with the ceiling rig (below), not by hand play. All times and counts are headless-SwiftShader sim results; see "What was not measured".

## What changed

1. **Missile damage model (fragmentation).** `ir`, `rf`, `tick` gained `pierce` (0.75): that share of a hit ignores shield and armour and lands on structure (the existing `applyHit` pierce path). `dmg` rose (SW-9 26 to 210, LN-3 34 to 240, SK-1 31.2 to 228; FROGG keeps its higher damage, range, seeker cone and turn rate). Two `tuning.missile` tables keep this a small-craft warhead: `pierceCls` (fighter 1, corvette 0.25, frigate 0.08, capital 0.05) and `dmgCls` (fighter 1, corvette 0.45, frigate 0.25, capital 0.15) scale pierce and total damage by the target's class, so fighter missiles stay shield-strippers against big hulls and do not replace torpedoes. Tandem torpedoes and the nuke ignore `dmgCls`.
2. **Aspect-independent blast (defect fixed).** A missile that struck a hull now passes that ship to `blastAt` as `direct`, so the contact is at distance 0 whatever the approach; non-contact (proximity) bursts measure from the real hull (`hullGap`) for every ship larger than `tuning.missile.hullGapR` (30 m) instead of only R > 150. Halberd/Gulper nose-on no longer takes 0.
3. **Tandem warhead (torpedoes).** `weapons.torp.tandem = {pen, holeT}` (HM-1 and ST-2: pen 0.6, holeT 3 s). The precursor: `pen` of the hit skips the shield (it still meets armour); the rest hits the shield normally; then the struck facet (fore/aft) collapses to 0 and stays down `holeT` s (`ship.shHole`, no regen, further hits find no shield), with a blue-white flash and a HUD line (`SHIELD FORE COLLAPSED` for the player, `TARGET SHIELD FORE DOWN` for the locked target). The main charge is applied as `through`: it wrecks the exposed part it touches and still goes into the hull, so a nose hit is not swallowed by a turret. No hole on friendly hulls; the hole needs the blast factor f >= 0.4 and scales holeT by f. HM-1 dmg 170 to 280, ST-2 195 to 310.
4. **Torpedo marks.** Gemini's G1 entries `torp_2..4`, `tad_2..4` (docs/MARKS_SCHEMA.md) are kept as they are (their ids won over mine); this branch adds `tandem.pen` +0.05/+0.10/+0.15 and `tandem.holeT` +0.25/+0.5/+0.75 to each. Mark IV: pen 0.75, hole 3.75 s. Their own deltas are non-compounding (every mark's range is x1.09-1.12 of base, not of the previous mark). `validate_db.py` now also checks `tandem` ranges, `pierce` 0..0.9, and that no torpedo mark lowers the tandem fields.
5. **Bomber discipline (`src/70_ai.js`).** `bomberAI` launches a salvo of `tuning.ai.torpSalvo` (3) at one lock, `torpGapT` 0.9 s apart, then breaks away and stays out while the tubes reload (`torpReload` 14 s + up to 6 s). `torpsStillNeeded()` stops launching when the torpedoes already in flight cover what the target still needs (`tuning.ai.torpFrac`: share of a full shield+structure pool one torpedo takes, corvette 0.30, frigate 0.13, capital 0.07); Gulper's torpedo logic uses the same check. Bombers only ever fire torpedoes at capital-class targets (fighters get the fighter AI, which fires only ir/rf/tick); a Bittern with 12 torpedoes does not empty its racks into one corvette (checked in `m3_missile_t.py`: 3 launched, hull dead, 9 left).
6. Tools: `ttk_matrix.py` gained `--jitter` (re-draw target position/aspect per launch, so seeds differ), `--salvo N`, `--inpage` (one page load, PRNG re-seeded per seed; a page load costs minutes on a loaded machine) and resolves mark weapons. New `tools/tests/m3_missile_t.py`, `m3_load_t.py`, `msl_m3_report.py`. `blastAt` and `tandemHole` are exported on `__game` for tests.

## Before / after (ceiling rig, `--jitter`, 20 seeds each)

Rig: Kestrel launches one missile at a time at a stationary target (head-on or turned 90 degrees) at 0.8 x range, no flares/chaff/PD, target position/aspect re-drawn before every launch (+-35 deg yaw, +-20 deg pitch). Cell = missiles fired until the target is dead (mean, range in brackets, capped at 60). Before = main at dfb612a; after = this branch. Tooling: `ttk_matrix.py ceiling --seeds 20 --jitter --inpage`. Serial launches let shields regenerate between shots, which understates salvos; the salvo table below is the torpedo case that matters.

Note: the old baseline (docs/BALANCE_BASELINE.md, fixed geometry) shows "immune" for fighter missiles head-on vs Halberd/Gulper; with the jittered aspect the "before" column below shows 43/44 because some random aspects expose the old 0.62 R sphere. The defect is real in the fixed head-on case (0 damage, 20/20 seeds in the baseline).

### BEFORE (main dfb612a): missiles fired per kill, head-on (mean over 20 seeds; range of the cell in brackets; `[k/n]` = killed in k of n)

| weapon | merlin | darter | kestrel | leaper | bittern | toad | reaver | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ir | 5.1 (5-6) | 3.2 (3-4) | 7.5 (7-8) | 5.0 | 26 (22-29) | 8.4 (7-9) | 9.5 (8-11) | 43 (42-46) | 44 (36-50) | no kill (42%) | no kill (23%) |
| rf | 6.0 (4-7) | 4.2 (3-5) | 12 (9-14) | 4.0 (3-5) | 17 (15-21) | 6.0 (4-7) | 6.2 (5-7) | 33 (31-35) | 33 (26-44) | no kill (52%) | no kill (30%) |
| tick | 4.2 (3-6) | 3.0 (2-4) | 6.4 (6-7) | 4.9 (3-6) | 21 (19-23) | 7.0 (6-8) | 7.4 (6-8) | 37 (35-40) | 37 (27-45) | no kill (48%) | no kill (28%) |
| torp | 2.0 | 1.0 | 2.3 (2-3) | 1.9 (1-2) | 5.2 (4-7) | 2.2 (2-3) | 2.5 (2-3) | 7.9 (6-9) | 6.7 (6-8) | 21 (19-23) | 42 (39-46) |
| tad | 2.0 | 1.0 | 2.3 (2-3) | 1.9 (1-2) | 4.4 (3-6) | 2.0 (1-3) | 2.4 (1-3) | 7.1 (5-9) | 5.3 (5-7) | 18 (15-22) | 36 (33-39) |

### BEFORE (main dfb612a): broadside (target turned 90 degrees)

| weapon | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|
| ir | 38.0 | 42 (35-46) | no kill (47%) | no kill (24%) |
| rf | 29.0 | 33 (27-38) | no kill (59%) | no kill (31%) |
| tick | 32.0 | 34 (31-39) | no kill (56%) | no kill (28%) |
| torp | 6.8 (5-7) | 7.5 (6-10) | 23 (23-24) | 48 (46-50) |
| tad | 6.0 | 6.0 (5-7) | 20.0 | 41 (39-42) |

### AFTER: missiles fired per kill, head-on (mean over 20 seeds; range of the cell in brackets; `[k/n]` = killed in k of n)

| weapon | merlin | darter | kestrel | leaper | bittern | toad | reaver | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ir | 1.0 | 1.0 | 1.0 | 1.0 | 2.4 (2-4) | 1.7 (1-2) | 1.8 (1-2) | 12 (10-14) | 8.9 (8-11) | 60.0 [2/20] | no kill (28%) |
| rf | 1.0 | 1.0 | 2.0 | 1.0 | 2.5 (1-3) | 1.0 | 1.0 | 11 (9-12) | 8.1 (7-9) | 58 (55-60) [16/20] | no kill (32%) |
| tick | 1.0 | 1.0 | 1.0 | 1.0 | 2.7 (2-3) | 1.0 | 1.8 (1-2) | 11 (11-12) | 8.3 (8-9) | 58 (55-60) [11/20] | no kill (31%) |
| torp | 1.0 | 1.0 | 1.0 | 1.0 | 2.0 (2-3) | 1.0 | 1.0 | 3.0 | 3.0 | 8.0 | 15.0 |
| tad | 1.0 | 1.0 | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 3.0 | 2.1 (2-3) | 7.0 | 13 (13-14) |
| torp_2 | 1.0 | 1.0 | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 3.0 | 3.0 | 8.0 | 15.0 |
| torp_3 | 1.0 | 1.0 | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 3.0 | 3.0 | 8.0 | 15 (14-15) |
| torp_4 | 1.0 | 1.0 | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 3.0 | 2.7 (2-3) | 7.6 (7-8) | 14.0 |

### AFTER: broadside (target turned 90 degrees)

| weapon | halberd | gulper | exeter | bullfrog |
|---|---|---|---|---|
| ir | 9.9 (9-10) | 11 (9-14) | no kill (88%) | no kill (29%) |
| rf | 8.7 (8-9) | 10 (8-12) | no kill (99%) | no kill (33%) |
| tick | 8.9 (8-9) | 10 (8-12) | no kill (94%) | no kill (31%) |
| torp | 3.0 | 3.0 | 8.8 (8-9) | 15.0 |
| tad | 3.0 | 2.9 (2-3) | 8.0 (7-8) | 14.0 |
| torp_2 | 3.0 | 3.0 | 8.0 | 15.0 |
| torp_3 | 3.0 | 3.0 | 8.0 | 15.0 |
| torp_4 | 3.0 | 3.0 | 8.0 | 14.0 |

### AFTER: torpedoes in salvos of 3 (0.9 s apart; counts are rounded up to whole salvos)

| weapon | halberd | gulper | exeter | bullfrog | exeter (side) |
|---|---|---|---|---|---|
| torp | 3.0 | 3.0 | 9.0 | 15.0 | 9.0 |
| tad | 3.0 | 3.0 | 9.0 | 15.0 | 9.0 |
| torp_4 | 3.0 | 3.0 | 9.0 | 15.0 | 9.0 |

## Reading the result against the owner's targets

| Target | Result |
|---|---|
| Light/medium fighters die to 1-2 missile hits | met: Merlin, Darter, Kestrel, Leaper 1.0 for SW-9/SK-1, Kestrel 2.0 for LN-3 (it is also the slowest-turning). Most contact hits are one-shot kills. |
| Heavy fighters/bombers up to 3 | met: Bittern 2.4-2.7 (range 1-4 over seeds, a few seeds need 4), Toad 1-1.7, Reaver 1-1.8 |
| Missiles stay evadable | not changed (steering, seeker cone, flare/chaff odds, PD hp untouched); lethality per hit rose, hit probability was not measured |
| FROGG missiles keep their lead in range, seeker, turn | unchanged fields (SK-1 range 2200 vs 1700, turn 4.2 vs 3.4, seekCone 0.9 vs 0.75); damage ratio SK-1/SW-9 kept at about 1.1 |
| Torpedo about 10-15% of a frigate per hit, 7-10 to kill an Exeter, 3-4 per corvette | met: Exeter 8 (HM-1) / 7 (ST-2) head-on, 8-9 / 8 broadside, 9 in 3-salvos; Halberd/Gulper 3 (2-3 for ST-2) |
| Only warheads kill a frigate outright | fighter missiles cannot kill an Exeter (60-missile cap); torpedoes need 7-9; no single torpedo kills one |
| Aspect independence | head-on vs broadside Halberd 12 vs 10 missiles, Gulper 9 vs 11 (was 43/44 vs 38/42, and 0 damage in the fixed head-on case) |
| Marks Mark I-IV | Gemini's range/speed/hp deltas, plus rising tandem pen (0.60/0.65/0.70/0.75) and hole (3.00-3.75 s); IV needs 7.6 torpedoes on an Exeter vs 8.0 |

Per-torpedo pool damage on an Exeter (pool 2500): the first hit takes the shield facet (about 1030, 41%), then about 225-245 each (9-10%); averaged over a kill it is 12%.

## What the harness cannot say (not measured)

- **PD interception rates, flares, chaff.** The rig has none. Torpedoes got more `dmg` but the same `hp` (7/8), so PD still shoots them down in the same time; whether 3 or 12 bombers' torpedoes get through a Bullfrog's 18 turrets is unknown. Missile lethality per HIT rose by 4-8 times, hit probability against evading AI was not re-measured: only the head-count of launches in `msl_t.py` (below).
- **A human pilot** (evasion, a human Kestrel dying to one SW-9 hit, the feel of the shield-collapse cue).
- **Duels.** `msl_t.py 8 3 180` (4 Kestrels vs 8 FROGG, 3 runs): before, humans alive at 180 s 4/4/3 and FROGG 2/1/4; after, humans 2/1/0 and FROGG 0/4/7 (human launches 3/3/1 vs 8/14/7, they died sooner; FROGG launches 12-16 vs 10-17, unchanged). Three runs, not a balance claim, but it shows missile duels got much more lethal for the side that gets hit; the AI missile budget (14-24 s reload) was not retuned.
- **Torpedo mark IV, ST-2 marks against moving frigates**, salvos arriving at different facets, hole stacking with beams/guns, ECU/FROGG shield regen mix.
- The ceiling is deterministic per geometry; "20 seeds" vary only the jittered aspect and fuze distance.

## Risks

- One-shot kills are common (contact hit f = 1): a player Kestrel dies to one SW-9 contact hit. Proximity bursts (the usual case against fighters) are weaker, which is why the table shows 1-2 and not always 1. If playtests find it brutal, lower `ir.dmg`/`pierce` (data only).
- `pierceCls` / `dmgCls` / `torpFrac` are tuning guesses fitted to this rig.
- The exposed-subsystem model still diverts non-`through` hits at the nose of big hulls (fighter missiles on an Exeter nose do less than on its flank); tandem hits use `through` and do not suffer from it.
- New player-facing cue (collapse flash + log line) has no help-overlay line and no touch binding; it is passive. Owner rule check needed.
- Gemini's mark deltas change `dmg`/`blast`/`vmax` on ir/tick marks (`ir_4` dmg x1.1); these were tuned against the old damage numbers and not re-checked.

## Reproduce

```
GS_PORT=8860 GS_TEST_DIR=/tmp/gs_a python3 tools/tests/ttk_matrix.py ceiling --seeds 20 --jitter --inpage --weapons ir,rf,tick,torp,tad,torp_2,torp_3,torp_4 --out after.json
GS_PORT=8861 GS_TEST_DIR=/tmp/gs_a python3 tools/tests/ttk_matrix.py ceiling --seeds 20 --jitter --inpage --salvo 3 --weapons torp,tad,torp_4 --targets halberd,gulper,exeter,bullfrog --out salvo.json
python3 tools/tests/msl_m3_report.py --before before.json --after after.json --salvo salvo.json
python3 tools/tests/m3_missile_t.py; python3 tools/tests/m3_load_t.py
```
(`before.json`: the same ceiling command run from a checkout of dfb612a with this branch's `ttk_matrix.py`.)

# Codex brief 8: FROGG swarm doctrine, a decisive spine gun, finishing brief 7

Read `AGENTS.md`, `docs/DESIGN_ARMAMENT_LAWS.md` and your brief 7 duel results (PR #12, `tools/tests/duel2.py`) first. Same rules as before:
- one branch and one PR per job, from current `main`;
- `python3 tools/gate.py` green before every push;
- handle-only git identity;
- never push to `main`, and never commit `index.html` or `docs/img/`;
- numbers in the PR, plus what you did not verify.

Do the jobs in order. Every balance change goes through `data/db.json` (`tuning` or ship and weapon entries), not through code constants. Where a law owns a value (`tuning.armamentLaw`, `energyLaw`, `rangeLaw`), change the law's input, not its output, and re-run `tools/armament_law.py --apply`, `tools/power_table.py --law --apply` and `tools/range_law.py`.

## Owner decisions (2026-11-13)

1. **FROGG small craft follow a swarm doctrine.** They stay individually weaker than their human counterparts but come in larger numbers and carry better missiles (they already start at Mark V).
   - **Revised 2026-11-13.** The first targets conflicted: by the square law of combat, a human that wins only 65–70% one-on-one loses clearly against two. The owner chose the 2-vs-1 target.
   - **Targets** over 20 seeded runs: **two FROGG against one human is roughly even (40–60%)**, and a human wins about **80–90%** of one-on-ones.
   - The same holds for corvettes: Halberd vs 2 Gulpers about even, Halberd vs 1 Gulper about 80–90%.
2. **The XL spine gun becomes decisive against capitals.** A spine ship should seriously threaten an enemy capital within 1–2 shots, while staying useless against fighters, as today.

## Job T: swarm doctrine tuning (branch `codex/swarm-tuning-2`)

Baseline (PR #13, merged), human / FROGG / timeout:

| Cell | Result |
|---|---|
| Kestrel vs Leaper | 18 / 0 / 2 |
| Kestrel vs 2 Leapers | 8 / 11 / 1 (already on target) |
| Kestrel vs Reaver | 20 / 0 / 0 |
| Falchion vs Reaver | 20 / 0 / 0 |
| Falchion vs 2 Reavers | 20 / 0 / 0 |
| Halberd vs Gulper | 20 / 0 / 0 |
| Halberd vs 2 Gulpers | 0 / 20 / 0 |

Fix these, in this order:

1. **Harness variation.** Randomise each seed's opening: bearing, offset and range within ±20%. The fixed head-on 2-Gulper cell showed almost no variation across seeds, so 20 seeds measured one fight 20 times. Re-run the baseline with variation before tuning.
2. **Gulper AI (a bug, not balance).** In its 1v1 losses the Gulper kept over 98% of its energy. Find out why its energy weapons (lances, rod guns) do not fire, and fix that in the AI or fire-control code. Then re-measure both Gulper cells; the 2-vs-1 cell may swing further.
3. **Reaver.** In traces it lost its guns and reactor while a Falchion drone drew its attention. Check its target choice: drones should not pull a Reaver off a fighter that is shooting it. Check its subsystem exposure too.
4. **Only then tune** the remaining gaps to the revised targets, with the levers listed before (turn rate, acceleration, burst seconds and recharge, missile counts; hull and shields last). Human ships stay unchanged.

**Report:** before and after, 20 seeds per cell with varied openings, plus the cause per matchup and every value changed.

## Job U: a decisive spine gun (branch `codex/spine-decisive`)

The spine gun decided 2 of 180 duels even with the spine-first AI (`spine_focus_t`).

**Find out why first.** Trace a Glaive vs Exeter and a Bullfrog vs Columbus fight with `__bf.log`. Count charges, fizzles (and why), hits and misses, and the damage per hit against the target's shields plus hull.

**Then make it decisive against capitals:**
- **Charge time and aim tolerance** against capital-sized targets, so a charge that starts against a capital usually lands.
- **Damage against shields:** for example a shield-bypass share, so one hit is felt through full shields. The energy law sets the shot's energy, so change the law's spine share (`spineCapacitorShare`) or the per-type rate, not the damage directly.
- **Target:** a spine hit on a fresh enemy capital of the same class removes about 30–50% of its shields plus hull, and two hits nearly kill it.
- **Unchanged:** fighters stay immune (the M2 fire-control rule), and the friendly-corridor safety stays.

**Re-run** the brief 7 duel set and report how often the spine now decides fights. Expect Glaive vs Exeter to be faster, and a Bullfrog to be a real threat to a lone Columbus.

## Job V: finishing brief 7 (branch `codex/brief7-finish`)

1. **Flicker:** take the coincident pairs (208 tablet, 250 desktop) and the exposed pairs to **zero** (Job P's target), worst ships first.
2. **Hitches:** meet `hitch_t`'s low-detail target, worst frame at most 3× the median (today 8.5×).
   - If SwiftShader rendering dominates the spike, so that no game code is responsible, show it with the timing spans and propose a better measure instead of chasing it.

## Report (each job)

The numbers above; any data moved; what was not verified. Real iPad performance is unverified unless the owner measured it.

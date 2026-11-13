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
   - **Targets** over 20 seeded runs: a human fighter wins about **65–70%** of one-on-ones against its counterpart, and **two FROGG against one human is roughly even** (40–60%).
   - The same holds for corvettes: Halberd vs Gulper about 65–70%; Halberd vs 2 Gulpers about even.
2. **The XL spine gun becomes decisive against capitals.** A spine ship should seriously threaten an enemy capital within 1–2 shots, while staying useless against fighters, as today.

## Job T: swarm doctrine tuning (branch `codex/swarm-tuning`)

Today: Kestrel vs Leaper 18–0 (2 timeouts), Kestrel vs Reaver 19–1, Falchion vs Reaver 20–0, Halberd vs Gulper 20–0, 4 Kestrels vs Gulper 20–0.

**Measure first.** Add the 2-vs-1 cells to the harness and run them before changing anything: 2 Leapers vs Kestrel, 2 Reavers vs Falchion, 2 Gulpers vs Halberd.

**Find the cause before tuning.** Why do FROGG craft lose? For example, AI behaviour (the burst-dive pattern), the energy burst running dry, turn rate, hull, or weapon range under the range law. Report it per matchup.

**Tune to the targets** with the fewest, most physical levers:
- FROGG fighter turn rate and acceleration;
- burst seconds and recharge (`tuning.armamentLaw.burstSec`);
- missile counts per FROGG fighter;
- hull and shields only as a last resort.

Do not change human ships to hit the target. Keep `armament_law_t`, `bullfrog_t` and `spine_focus_t` green.

**Report:** a before and after table for every cell, 20 seeds each, plus every value changed and why.

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

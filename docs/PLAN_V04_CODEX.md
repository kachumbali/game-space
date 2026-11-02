# Plan v0.4 "Consolidate, then campaign" (drafted 2026-11-02, for Codex to execute)

Supersedes the "Next" line of PLAN_V03. Owner constraints: keep the arcade layer (drops, pods, perks, score bonuses) in Free Flight and Gauntlet only; Campaign has none.
Four modes stay: Free Flight, Skirmish, Campaign (authored), Gauntlet; plus Shipyard and the intro cutscene. Codex's design wins on conflicts with older docs.

## Where we are against PLAN_V03 (2026-11-02, main = beea505)
| Item | State |
|---|---|
| M0 opsec, M1 harness, M5 subsystem effects, central db + `?db=`, marks schema | done, merged |
| M2 weapons by size (slew, charge-up, XL immunity) | merged, **not hand-played** |
| M3 missiles/torpedoes, tandem warhead (Codex schema) | merged; old M3 test retired, tandem has validator checks only, **no balance run** |
| M4 roster (Falchion, SAR, liner, destroyer/Claymore) | merged, menu entries exist, **unmeasured** |
| Marks II-IV (Gemini G1) | in db, **numbers unmeasured** |
| Campaign: prologue p01-p04, Severed Node m01-m05, AO jump prompt (X) | scripted and merged; **no end-to-end bot, no 20-run loss rates** |
| Long Retreat | docs only (CAMPAIGN_RETREAT.md), no missions |
| Codex rework: menu, Shipyard energy audit, cutscene player, ordnance manifest doc | merged; station-selection screen **not built** |
| Capital lasers delete fighter wings (OQ 29) | decided 2026-11-02, brief written, **not built** |
| Open red-team list (tender-targeting AI, HE friendly fire, R-12, ...) | untouched |
| Real-device checks (iPad touch, music, Hecla perf) | **none** |

Known test debt on main: tur_aim_t ("BAD 2"), roster_t HUD (HOLD/SAR), view_t/plog_t IndexError, muzzle_t/render_t timeouts, bullfrog_t (fails the same before the merge), skirmish 30 s survival flaky, touch_qa dock/power findings. `check_branch.sh` image rule fails on `assets/` (owner art): exempt `assets/`.

## Phases (one branch each, merge only when `tools/check_branch.sh` is green; no force push)
**P0 Stabilise (small).** Fix or consciously retire each test above, with a line per test in `docs/CODEX_INTEGRATION_LOG.md`. Exempt `assets/` in the image rule. Regenerate tables (`tools/export_db.py`) and list doc/db contradictions. Done when the full sweep is green or every red is documented as flaky with a reason.

**P1 Capital-laser split.** Execute `docs/BRIEF_CAPITAL_LASERS.md` exactly. Needs seeded before/after numbers in `docs/BALANCE_REPORT_3.md`. Hecla stays at 6 lasers. Merlin firepower unchanged.

**P2 Measure the campaign where it is played.** Extend the mission bot (m2full) to all of p01-p04 and m01-m05: seeded, 20 runs per mission, report player loss, ship loss, time, objective completion. Add a difficulty selector on the briefing (UX_REVIEW S4). Tune wave sizes in the mission scripts/db only if loss rates are outside 10-60%. Campaign must show no arcade drops (add an assertion test).

**P3 Ordnance station selection.** Per `docs/ORDNANCE_MANIFEST.md`: constrained loadout screen (S/M/L/XL stations), db-driven, AI default loadouts, touch binding, one help-overlay line, all in the same commit. Briefing loadout lines stay derived from the db.

**P4 Long Retreat missions.** Build from `docs/CAMPAIGN_RETREAT.md` using existing objective types (liner escort, jump spool, scarce nukes). Only add a new objective type if unavoidable, with a test. Follows the AO-transit rhythm of PLAN_V03.

**P5 Red-team list and KITE-6 wingman.** Tender-targeting AI, HE friendly fire, R-12 rules; KITE-6 only after P3.

**Not now:** strategy/dynamic campaign layer, hull-variety polish, LICENSE, interceptor doctrine and `bomber-ai-fix` (dropped).

## Owner gates (hand-play, cannot be automated)
After P1 and after P2: iPad + phone + desktop play of one prologue mission, one Severed Node mission, Free Flight. Report: touch controls, music, Hecla performance, damage feel. Nothing after P2 starts before this feedback.

## Rules for Codex
- Read `AGENTS.md` first. Commit author `Jonas Koll <178489347+kachumbali@users.noreply.github.com>`; no personal email anywhere. Never edit `index.html` by hand.
- Balance claims need >= 20 seeded runs. Numbers live in `data/db.json`.
- New player-facing system = touch binding + AI default + help line in the same commit.
- Update `docs/CODEX_INTEGRATION_LOG.md` per phase; one short summary per phase, no running commentary.

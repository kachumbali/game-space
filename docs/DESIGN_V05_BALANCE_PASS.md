# Design: balance pass v0.5 (owner decisions 2026-11-02, for Codex to implement)

Implementation is Codex's job (the owner has a month of free ChatGPT use). Claude reviews, runs browser tests and seeded sweeps, and merges. Branch: `codex/balance-v05`. Tests first where possible; every change is data-first (`data/db.json`) and then only code if the data cannot express it.

## 1. Hit points (structure) - set exactly

| Ship | Now | New |
|---|---|---|
| Merlin | 26 | 35 |
| FROGG Darter | 14 | 24 |
| FROGG Leaper | 25 | 35 |
| FROGG Spitter | 38 | 48 |
| FROGG Reaver | 60 | 95 |
| FROGG Toad | 130 | 140 |
| KITE-6 (and DRONE if it shares the def; check) | 7 | 10 |
| FROGG Gulper | 380 | 480 |
| Halberd | 420 | 460 |
| Exeter | 1600 | 1800 |
| Claymore (`destroyer`) | 2400 | 2700 |
| FROGG Bullfrog | 3000 | 3200 |

Unchanged: Kestrel 50, Falchion 110, Bittern 140, Hecla 12000, Argosy 2000. Shields and armour are unchanged by this pass. Check that every subsystem/component hp that is derived from structure still adds up and that `tools/validate_db.py` passes. Marks (`*_2..4`) must not break.

## 2. Point defence by class

- **Fighter-class ships (length under 60 m) get half-calibre PD:** the PD weapon on these ships (Falchion `pd` x3, Bittern `pd` x2; Halberd at 64 m is NOT affected) is a new weapon, e.g. `pdS`:
  - damage per second x0.5 of the current `pd`
  - magazine (`ammo`) x0.5
  - **fires in bursts of 10 shots**, then a short pause (suggest 0.8 to 1.2 s), not a continuous stream, to save ammo. Burst logic is a general weapon field (e.g. `burst: 10`, `burstPause`), reusable for others; AI and player PD must both respect it.
  - Capital ships keep the current `pd` calibre.
- **Gulper needs a reasonable PD battery** (currently 0). Start with 3 turrets of the FROGG PD weapon (`thorn` R-5, as on the Bullfrog), spaced to cover all hemispheres, and tune by test: the aim is that two Falchions' missile salvo (6 IR, 2 RF, 2 torpedoes each) does not simply wipe it. Gulper length is 146 m, so full calibre; do not halve.
- Measure: PD intercept rate vs IR, RF and torpedoes for each class before and after (a variant of the existing flak/torpedo test in `p0_t`).

## 3. Why (data in the owner's chat, summarised)

- Falchion has about 260 HP+shield, 99 gun dps and about 2300 raw missile damage plus 172 PD dps; the Gulper has about 740 HP+shield and no PD. Missiles, not guns, decide it.
- Fighters were too fragile relative to their weapons; the new HP gives spacing: Darter < Leaper < Spitter < Reaver < Toad, and Merlin below Kestrel.

## 4. Acceptance

1. `tools/check_branch.sh` green.
2. Seeded 1-vs-1 and 2-vs-1 Falchion-vs-Gulper test (missiles on and off): Gulper no longer dies in a fraction of the time of a Kestrel pair. Report time-to-kill before and after (20 seeds).
3. Seeded fighter-vs-fighter matrix (Merlin, Kestrel, Falchion, Bittern vs Darter, Leaper, Spitter, Reaver, Toad): report win rates; flag any pairing above 90 % or below 10 %.
4. Hecla attack-run and Bullfrog acceptance engagements do not regress (compare with the numbers in `docs/BALANCE_REPORT_3.md`).
5. Write what changed and the measured effects into `docs/CODEX_INTEGRATION_LOG.md`. Do not merge; push the branch for review.

## 5. Open / not in this pass

Armour classes (see `docs/BACKLOG.md`); the Halberd already has hard armour, so the GX-1 rule applies as soon as the armour decision is made.

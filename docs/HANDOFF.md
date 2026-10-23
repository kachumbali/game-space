# Handoff: session state 2026-10-23 (post acceptance re-measure, pre-iPad-playtest freeze)

Written for the next session before context compaction. Authoritative docs are listed first; do not
re-derive what they already state. Sober facts only. Last session (2026-10-23, main = d8eeb3a): handoff
item 2 done — the acceptance engagement re-measure under flak (item 2 below holds the numbers and the
new owner decision it surfaced). The next session starts at item 3.

## Rules now binding (AGENTS.md, owner directives)

- **Feature freeze**: no new player-facing systems until the owner hand-plays the build on iPad. Power,
  afterburner, magazines, energy budgets, comms, drones, docking and the nuke dial all shipped with zero
  hand-play data. A new player-facing system (when the freeze lifts) ships with a touch binding, an AI
  default, and a help-overlay line in the same commit.
- **Branches**: work in a branch, merge to main when green; never two agents in one working tree.
- **Measurement**: `?seed=N` makes the sim deterministic (mulberry32 over Math.random). Duel cells quote
  >= 20 runs or do not claim an even point (Wilson CI).
- Build fails on duplicate top-level names (one module scope); CI runs build+lint on push.

## How to build and test

- `python3 build.py` — builds `index.html` and lints 600 top-level names; exits 1 on duplicates.
- Tests: `cd tools/tests && /tmp/gs_venv/bin/python <script>.py` with
  `GS_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"`.
  The venv is throwaway (playwright only); recreate with `python3 -m venv /tmp/gs_venv && pip install playwright` if gone.
  If a page load times out once, rerun — loads are flaky under SwiftShader.
- **Gotcha: `?q=low` makes fighter hulls too coarse for ANY bolt hit** — do not use q=low for scenarios
  that need bolt hits to land (PD flak, gunnery); it is fine for AI/state tests.
- `ai.hold = true` blocks BOTH `fireGuns` and `launchMissile` for AI ships — held ships cannot shoot or
  launch; turrets still fire (updateTurrets does not check hold).
- Dead missiles are filtered out of `g.missiles` inside the same `update()` — tests track missiles by
  identity (last-seen position), not by polling `m.dead`.
- Repo history was rewritten once by the owner (fd3f015 -> 6c68171) and the P0 commit was amended
  (729ef2d -> fde8b8c). On a rejected push: `git fetch`, inspect divergence, rebase; do not force-push.
- Environment verified 2026-10-23: the throwaway venv, Chromium 1243 and `bullfrog_eng.py` all work;
  acceptance runs took 2-7 s wall each (rendering disabled). No server/venv setup needed beyond the
  commands above.

## System state (all committed; main includes the 2026-10-23 acceptance re-measure)

- Weapons: `docs/WEAPONS.md` (three gun classes, red-team open list section 7). Magazines everywhere;
  gun discipline 60/30/5 bands; Kestrel = HEAVY FIGHTER (cannon + MD-9 mag 120 slugs + HE).
- Ships: `docs/SHIP_CLASSES.md` (assignments + gaps: Harrier 2-seat heavy, Bittern bomber, Merlin light
  fighter, cruiser, strategic fleet tender - all UNBUILT, documented only).
- Docking: TIE-fighter style at a Tender (D key, touch button; `dock_t`). Tender rearm: docked 40 rds/s
  cassettes, hovering AI 20 rds/s trickle (`tenderTick`). Rearm is never repair.
- Pause: real pause (Esc / touch II; `p0_t`); touch parity chips done (lock chip, RAD button, legend).
- PD flak: swept seg-seg missile test + proximity burst (PD-30 r6, R-5 r5). Measured 4/4 ST-2
  intercepted (was 0/7).
- Nukes: NK-1 standard load 0.5 kT, `?nukeKt=` 0.1-10 dial; strategic 100 kT-10 MT lore-only
  (`docs/NUKES.md`).
- AI: `powerAI` (ETS management, all ships), `gunBurstOK` (discipline at fireGuns call sites),
  capitalAI fires both mount groups under 1300 m.

## Open items (priority order; owner's P0 framework)

1. **Blocked on iPad playtest** (freeze): S4 difficulty selector on briefing + mission-wave retune
   (UX_REVIEW S4 remains); S3 feel pack, S5 onboarding beats, S6 consistency sweep (UX_REVIEW workplan).
2. **DONE 2026-10-23** — Bullfrog acceptance engagement re-measured under flak (`bullfrog_eng.py`, six
   runs, seeds 1-3 at DT 0.05/0.0125): 21 of 24 Tadpoles intercepted, 1 hit; human 6/6 (was 2/6);
   Exeter 87-90% at end; the Bullfrog's own 16 ST-2 tubes never fired (it dies at ~200 s, before its
   salvo). Recorded in BALANCE_TESTS (2026-10-23 section) + raw JSON (`flak_*` keys). **New owner
   decision**: the engagement is now one-sided; levers this points at: early Bullfrog ST-2 salvo,
   PD-30/R-5 burst strength, `spineDelay` (hangarCap 12->8 is now the wrong direction). Not tuned.
3. **Mission bot**: extend m2full to report player/ship losses end-to-end for missions 1-2, seeded
   (`?seed=`), 20 runs; owner directive "measure balance where it is played".
4. **More 20-run duel cells** (8 and 12 FROGGs) to bracket the even point with CIs.
5. **Red-team open list** (WEAPONS.md section 7): tender-targeting AI (pickTarget ignores tenders),
   R-4/R-5 en-typed "autocannons", R-12 bigOnly/noPD + pierce-vs-rail decision, M-8 efficiency,
   GX-1-vs-hard-armour decision, AI blast awareness (HE friendly fire).
6. Later shelf: Harrier/Bittern/Merlin builds, FROGG tender doctrine, rotary recoil (newton),
   q=low fighter hitbox fix, strategic fleet tender + shuttles (scripted only).

## Session facts worth keeping

- Even point (arcade, 4 Kestrel sk3 vs FROGG sk3, seeded 20 runs at N=10): human wins 45%, Wilson CI
  [26%, 66%] — even point ~10 confirmed. Post-dry fights are decided by missiles/masers.
- The XL's 100 slugs never bind in a mission (one slug per 30 s); it is a campaign number.
- Tadpole/ST-2 vs PD before flak: 0/7 (recorded); after: 4/4 at 270-402 m (p0_t); in the full
  acceptance engagement (2026-10-23): 21 of 24 intercepted, 6/6 human wins, Exeter 87-90% at end.
- Nuke fluence at 0.1 kT kills fighters within ~42 m, 2 kT within ~190 m (measured, discipline_t).
- The Kestrel's ETS WEAPONS channel feeds the MD-9 (30 en/slug); powerAI pushes WEAPONS when energy
  is low while fighting.

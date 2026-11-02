# Capital-ship ordnance: stores, magazines, reloadable launchers, fighter complements

Status: design analysis, nothing implemented. Written 2026-11-02 against `/tmp/gh` HEAD `e8348b3`. Author: game-design analyst (Claude), for the owner and Codex.
Tone note: the owner asked for no flattery. Section 1 says plainly where the proposition is weak.

## 0. Sources, conventions, assumptions

**Evidence tags.** [V-data] read in `data/db.json` (python, 2026-11-02). [V-code] read in `src/*.js`, not executed. [V-doc] stated in a doc and not re-measured. [C] my arithmetic, formula shown. [A] assumption or design choice, unmeasured. Nothing below was run in a browser.

**Files read.** `docs/CODEX_NOTE.md`, `WEAPONS.md`, `SHIPS.md`, `BULLFROG.md`, `NUKES.md`, `NUCLEAR_IMPLEMENTATION_AUDIT.md`, `BALANCE_REPORT_3.md`, `BACKLOG.md`, `DESIGN_V05_BALANCE_PASS.md`, `MISSILES_M3.md`, `ORDNANCE_MANIFEST.md`, `SHIP_CLASSES.md` (tender part), `ECONOMY.md` (rearm part); `data/db.json` (ships, weapons, `tuning`); `src/55_ships.js` (`tenderTick`), `src/56_drones.js`, `src/60_weapons.js` (`launchMissile`, `lockUpdate`, `blastAt`, `tandemStrike`, `updateMissiles`, PD-vs-missile loop in `updateBolts`), `src/70_ai.js` (`missileLogic`, `bomberAI`, `capitalAI`, `torpsStillNeeded`), `src/79_bullfrog.js` (`hangarUpdate`), `tools/tests/balance_sweep.py`.

**Time.** All durations are sim-seconds (db and docs convention). Real time = sim / `SIM_SPEED` 0.375, so 1 sim-s = 2.67 real s. This matters for the owner's "about 10 s reload": see Q1.

**Data caveats found while reading (flag to Codex):**
1. `docs/WEAPONS.md` section 4 still lists SW-9 26 / LN-3 34 / HM-1 170 dmg. `data/db.json` has `ir` 210, `rf` 240, `torp` 280, `tick` 228, `tad` 310 [V-data] (M3 retune, `docs/MISSILES_M3.md`). Use the db.
2. `tuning.missile.dmgCls` (capital 0.15) and `pierceCls`, and the `pierce: 0.75` field on `ir`/`rf`/`tick`, are in the db but **no `src/*.js` reads them** (`grep dmgCls src/*.js` returns nothing; only the embedded copy in `index.html` contains it). `blastAt` passes `pierce` only from `tandemStrike` (torpedoes) [V-code]. Either the M3 rule "fighter missiles are shield-strippers against big hulls" was lost in the Codex merge or it is dead data. **Consequence:** the M3 ceiling table ("IR vs Exeter: 60 missiles, no kill") may be out of date, and every statement below about IR damage to capitals carries that uncertainty. Task P0 (section 8) re-measures it before any capital gets missile cells.
3. Hull sizes: `data/db.json` Halberd 64 m and Gulper 66 m are authored sizes; `src/32_scale.js` flies them at 128 m / 146 m (`docs/SHIPS.md`). Exeter db structure is 1600 (the 1800 of `DESIGN_V05_BALANCE_PASS.md` is not merged at this HEAD).
4. "Tern" in the brief: `ships.tern` is a 34 m **resupply shuttle** (cls fighter, `ai.role shuttle`, `flare 12`, two cargo pods and two transfer booms as `bay` comps). It has no rearm code. The ship that actually rearms (`tenderTick`) is `ships.tender`, the 200 m FLEET TENDER (`tender: true`, `serviceR 600`, bays A/B). I use TENDER for the rearm ship and TERN for a possible ferry (section 2.5).

**Key assumptions used throughout [A]:**
- A1: per-missile hit probability vs a manoeuvring AI fighter with flares: 0.30 (IR/radar). The ceiling-rig figure is 1.0 (no flares, no motion); the real value is unmeasured. All kill-rate arithmetic scales linearly with it.
- A2: PD interception capacity per S-class PD turret per approach window (about 2.6 s: torpedo at 260 m/s entering at 0.75 x 900 m): 1.3 hp-8 torpedoes or 6 hp-1 missiles. Derived: PD-30 13.3 shells/s x 2.6 s = 35 shells; HM-1 needs 6 hits of 1.3 (hp 7, `dmgMsl` 1.3); at about 25% hit rate that is 1.5 torpedoes; the 0.3-0.5 s retarget gap caps IR at about 6. The only measured anchor is "21 of 22 Toad Tadpoles intercepted by flak" (`WEAPONS.md` 7.1); consistent, not proof.
- A3: heavy mission = 120 sim-s (320 real s) of contact; launcher duty factor 0.35 (range band, lock, target availability, no dog-piling).

---

## 1. The owner's proposition, evaluated

### 1.1 What is right

1. **Capitals have no ordnance role today and that is a real gap.** Exeter has no missile stores or launch point (`stores {drone: 48}`, no `launch`); Halberd has `flare 0`; Argosy and Tender have flares only. Capital-class missile use is limited to the Claymore's 8 HM-1 and the FROGG Gulper/Bullfrog torpedoes [V-data]. In an Exeter vs Bullfrog fight the human capital has lasers, rails and PD; the Bullfrog has a spine, a 36-fighter hangar and tubes.
2. **The role split (missiles vs fighters, torpedoes vs capitals) matches the engine's own kill budgets.** Ceiling rig (stationary, no PD, serial; `MISSILES_M3.md`): one SW-9/SK-1 hit kills Merlin/Darter/Kestrel/Leaper; HM-1/ST-2 kill a Halberd/Gulper in 3, Exeter in 7-8, Bullfrog in 13-15. Missiles on a capital are wasted; torpedoes on a fighter are wasted. AI already enforces the second half (`bomberAI`/`capitalAI` fire torpedoes only at `isCapital` targets).
3. **Reloadable launchers fix a real engine limitation.** Today a ship has one global `ai.mslT` timer and one `s.lock` (`missileLogic`, `capitalAI`): it cannot work two targets, and its "salvo" is a time gap, not a launcher count.
4. **Stores -> magazines -> launchers is the right three-tier model.** `s.stores` (ready rounds), `def.stores` (cap) and `tenderTick` already behave like magazine, cap and refill; it gives the Tender a precise job.
5. **The Tender as the logistics hull is consistent with the project's own rule** ("rearm is not repair", `WEAPONS.md` section 5).

### 1.2 What is questionable

**(a) "Magazines in the hundreds" does not follow from "a bomber carries 12".** The inference confuses carriage with consumption. A Bittern carries 12 because the Bittern *is* a delivery vehicle; 12 is its whole mass budget. A capital's magazine should be set by what its launchers can usefully fire in a mission, not by hull volume. Launcher throughput is the binding variable:

    expected expenditure E = launchers x (T / reload) x duty,   T = 120 sim-s, duty = 0.35 [A3]

Exeter, 6 missile cells at 5 s and 4 torpedo tubes at 10 s: E_missile = 6 x 24 x 0.35 = 50; E_torp = 4 x 12 x 0.35 = 17. A magazine of 64 missiles and 24 torpedoes is 1.3-1.4 x one heavy mission. Hundreds are justified only at 1000 m scale (Hecla), or if launchers are made far faster. A 300-round magazine on a 6-cell ship would take 1,200 sim-s of continuous fire (53 real minutes) to empty and would turn the Tender into set dressing. The owner's *direction* (capital magazine >> bomber) is right; the *order of magnitude* for a 450-600 m hull is tens, not hundreds.

**(b) Pacing: more launchers than the plan below would end fights too fast.** With A1, one launcher at 5 s reload kills 0.06 fighters per sim-s. Six cells give 0.36, one fighter per 2.8 sim-s (7.4 real s), which on its own matches the whole-Exeter figure already measured ("8 FROGG fighters in 24 sim-s", `BULLFROG.md` 5.2). Doubling the Exeter's fighter-killing rate while the Bullfrog hangar is capped at 12 airborne removes the "hangar is a boss" property. Launcher counts below are deliberately low, with an explicit tuning knob (5.4).

**(c) "10 s reload" is ambiguous, and too fast if read as real seconds.** 10 real s is 3.75 sim-s. For missile cells that is tolerable; for torpedo tubes it is far outside every number in the repo (AI torpedo reload 14 sim-s, `tuning.ai.torpReload`; Bullfrog tubes 18-26; capital 5 s between single shots in `capitalAI`). I propose 5 sim-s (13 real s) for missile cells and 10 sim-s (27 real s) for torpedo tubes. Q1 asks which reading is meant.

**(d) Point defence decides whether capital torpedoes matter at all, and magazine size is irrelevant to that.** Using A2:

| Target | PD turrets that engage missiles | Capacity per window, hp-8 torpedoes | hp-1 missiles |
|---|---|---|---|
| Bullfrog | 10 sting + 8 thorn; about 9 bear on one side [V-doc `BULLFROG.md` 4.4e] | about 12 | about 54 |
| Exeter | 3 PD-30 (P-4 pulses are beams; beams do not take missiles, `BULLFROG.md` table line on turret roles) | 2-4 | 12-18 |
| Claymore | 8 PD-30 | 6-10 | 30-48 |
| Hecla | 6 PD-30 | 5-8 | 24-36 |
| Gulper (4 R-4 now; +3 R-5 per v05 pass) | 4 (7) | 3 (5) | 15 (25) |
| Halberd | 4 PD-30 | 4 | 20 |

An Exeter ripple of 4 torpedoes against a Bullfrog is fully absorbed (4 < 12). A magazine of 24, 240 or 2,400 changes nothing. What counts is **simultaneous arrivals**: a salvo of at least 2 x capacity inside about 3 s. Tube count and ripple interval, not magazine depth, determine capital-vs-capital value. (Existing finding: ST-2 at 8 hp is "trivially flakked", `WEAPONS.md` 7.1.)

**(e) The existing magazine rule is about guns; ordnance already follows a different refill.** `WEAPONS.md` ("Magazine rule") has `tenderTick` refilling gun drums at 40 rds/s (x0.5 when not docked). Missiles are refilled by the *same loop* at 0.5 x m per second per store type: one round per 4 sim-s in proximity, one per 2 s docked. For a 64-round magazine that is 256 sim-s (11 real minutes) per type [C from V-code]. Fine between missions (instant reset), unusable in a fight. A rate that scales with magazine size is needed (2.5).

**(f) Performance is unmeasured, and the engine has a known per-missile cost.** `missileMesh` builds three new `Mesh`es with new geometries and materials on every launch and disposes them on death; each live missile emits fire particles every frame and smoke at 40/s (`updateMissiles`) [V-code]. The highest in-flight count seen in repo tests is about 12 Tadpoles (`BALANCE_TESTS.md`); nobody has measured 40 or 80. Steady-state in-flight = launch rate x flight time: Exeter 6 cells x 0.2/s x ~5 s = 6, plus 4 tubes x 0.1/s x ~8 s = 3, so about 9 per capital at full duty; two capitals plus fighter missiles reach 25-30. Recommended budget [A]: **target at most 30 live missiles; hard cap 48 desktop, 32 iPad, 20 phone**, cells refuse to cycle at the cap. Voxel fighters (12k instances each at mid detail, `BULLFROG.md`) are the likelier iPad bottleneck, which is why airborne fighter caps (section 4) matter as much as missile caps. The owner's iPad/phone check is the gate (`AGENTS.md`).

**(g) Doing this symmetrically is the risk for human ships.** If FROGG capitals get the same launcher arithmetic, a Bullfrog ripple of 4 ST-2 against an Exeter with 3 PD (capacity 2-4) leaks 1-2 per ripple and two ripples kill (ST-2 tandem strips 55% of a facet shield per hit and adds 310 with 35% pierce). Today the Bullfrog fires one Tadpole per 18-26 s and "never fires before it dies" in the 6-run set (`WEAPONS.md` 7.1). `BULLFROG.md` open question 12 (salvo override) is the same decision.

**(h) Balance versus lasers and rails.** In `BALANCE_REPORT_3` the Exeter + 2 Kestrels vs Bullfrog cell is 0/20 human wins, FROGG losses median 1. Lasers, rails and the spine decide capital duels; ordnance would mostly add a fighter-killer and a PD-load tool. Do not expect torpedoes to flip the Bullfrog result (6a).

### 1.3 What to change in the proposal

| Owner proposal | Recommendation |
|---|---|
| Magazines in the hundreds | Tens for 450-600 m (64-96 missiles, 24-48 torpedoes); low hundreds for Hecla (160 / 48) plus a separate Tender hold. Size by E = launchers x T/reload x duty. |
| Fixed tubes for corvettes | Yes. Corvettes and fighters: fixed tubes, salvo-then-rest (existing `salvo` / `rest`). |
| Reloadable launchers on capitals, about 10 s | Yes; 5 sim-s (missile cells) and 10 sim-s (torpedo tubes) as starting values; counts per section 3. |
| Acquire target, fire, repeat | Needs code: launcher-level target assignment and an acquisition queue (2.4). |
| Tender nearby | Yes; needs a rate that scales with magazine size and a finite hold (2.5). |
| Nukes | One sealed campaign reserve, never AI-fired, never tender-restocked (2.6). |

---

## 2. Launcher taxonomy

### 2.1 Three tiers (terms used here)

| Tier | Meaning | Engine today | Needed |
|---|---|---|---|
| STORES / HOLD | rounds in a depot, tender or hold, outside the ready magazine | none (no campaign ledger; `ORDNANCE_MANIFEST.md` step 4) | tender `hold` counts, mission `holdStock` (2.5) |
| MAGAZINE | rounds aboard, cap per type | `s.stores[id]`, cap `def.stores[id]` | unchanged; add a `mag` hit zone |
| LAUNCHER | the thing that cycles: reload timer, arc, accepted types | **absent**. `launchMissile` only checks `stores`; Claymore's `torp` mounts (`rackL/R`, `store: 'torp'`) are hit zones plus launch visuals, not cyclers | `def.launchers` |

### 2.2 Launcher kinds

| Kind | Fits | Reload | Loads | Role | Notes |
|---|---|---|---|---|---|
| `FT` fixed tube / rail | fighters, bombers, corvettes | none per tube; `salvo {count, interval, rest}` after a full salvo; rack refill only at Tender/dock | one type per station (`hardpoints`) | Bittern 12 torp (2 x L cap 6), Kestrel S1 x4, Halberd/Gulper tubes | **Already in engine** (`hardpoints`, `salvo`, `launches[]`). Corvette `rest` 14 s (`torpReload`). |
| `RM` reloadable missile cell | frigate and larger | 5 s [A] | `ir`, `rf` (selectable per cell) | anti-fighter, any direction (cold launch) | New. One round ready per cell; refilled from the magazine after `reload`. |
| `RT` reloadable torpedo tube | frigate and larger | 10 s [A] | `torp`, `nuke` | anti-capital; arc +-70 deg about the bow because torpedo `turn` is 0.9 rad/s | New. Nuke reload x4.5 = 45 s (`NUKES.md` 4.2). |
| `HG` hangar bay | carriers | 4 s per bay, airborne cap | fighters by class | complement (section 4) | Exists for the Bullfrog only (`hangarUpdate`, hard-coded to `bayA`/`bayB`). |
| `DR` drone cradle | frigate and larger | 1 per 2 s up to control limit | `drone` | KITE-6 screen | Exists (`launchDrones`, `droneLimitOf`), player-triggered only. |

### 2.3 Geometry and arcs

`def.launch`/`launches[]` give launch points in ship space; add `launchers: [{id, kind, pos, arc, comp, types:[...]}]`, with `comp` tying each launcher to a hit zone so damage degrades or kills it as for turrets (`compOf`, `compEff`). Missile `dir` is currently the ship's forward vector (`launchMissile`), and the seeker gimbal is `seekCone` 0.75-0.9 rad with a 0.25 s loss timer [V-code]: a target at 90 deg is dropped at once. **A cold-launch cell needs the missile to start with `dir` toward the target or lead point - code.**

### 2.4 Acquisition and salvo logic (the "retarget cycle")

Proposed `launcherAI(s, dt)`, called from `capitalAI` and `lancerAI` [A]:

1. Every 0.5 s build a threat list: hostiles inside the type's `range x 0.7` and beyond 350 m (existing `missileLogic` window), scored by class (RM: fighters/bombers first; RT: capital/corvette), distance, and "attacking me or a friendly".
2. Coverage rule per target (extends `torpsStillNeeded` and the one-missile-per-target rule): RM covers a fighter with 1 round in flight (2 vs Toad/Reaver/Bittern, which need 2 hits); RT covers per `tuning.ai.torpFrac` (capital 0.07, corvette 0.30).
3. For each ready launcher pick the highest-scoring uncovered target in its arc, apply a per-target lock time (existing `lockTime / (sig x 0.7)` formula run per candidate instead of one global `s.lock`), launch with `dir` toward the target. Several launchers can acquire different targets in one tick.
4. Ripple: launchers sharing a target fire at `interval` 0.3 s (RM) or 0.4 s (RT). The torpedo salvo waits until `ready_RT >= required_salvo = clamp(2 x PD_capacity(target), 2, n_RT)`. If that is unreachable (Bullfrog: 24 vs Exeter's 4) torpedoes are held for a degraded-PD trigger ("target PD turrets alive < 50%") or the player's comms order. **This rule stops 4-tube Exeters pouring their stock into a Bullfrog's flak and is the cheapest large win in the design.**
5. Empty magazine: launcher marked `dry`, HUD line as for guns (`GUNS EMPTY` pattern); reload starts only when a round is available.
6. Friendly safety: cells sit on hull faces and `updateMissiles` treats friendly hulls as solid (owner exempt for 3 s), so firing through an escort screen costs hits on friends. Reuse the `friendlyInLine` check at launch.

### 2.5 Magazines, the Tender and persistence

**Exists** [V-code]: `tenderTick` adds `0.5 x m x dt` to every store type of each friendly ship within `serviceR` 600 m, `m` = 0.5 (AI hovering) or 1 (player docked), scaled by `subEff` of damaged bays. That is 0.25 rounds/s per type in proximity, 0.5 docked, all types in parallel, no tender stock, no distinction between a flare and a torpedo, and **nukes would refill** (any key in `def.stores`).

**Proposed:**

| Item | Value [A] | Basis |
|---|---|---|
| Ordnance points | flare 0.1, ir 1, rf 1.5, torp 4, drone 3, nuke never | `NUKES.md` 4.1 points (ir 1, rf 1.5, torp 4), `ECONOMY.md` munition costs |
| Transfer rate per service bay | 1.0 pt/s proximity, 2.0 pt/s docked | scaled to magazine size; Tender has two `bay` comps -> 2 / 4 pt/s |
| Refill of an empty Exeter | 64 missiles (about 80 pt) + 24 torpedoes (96 pt) = 176 pt -> 88 s at 2 pt/s (235 real s), 44 s docked | [C] |
| Tender hold (finite) | 400 missiles + 120 torpedoes + 96 drones, `hold` in db | about 4 Exeter refills; the Tender becomes a target and a bottleneck |
| Hecla hold | 800 + 240; service via the existing `ordn` bay comp (700 hp) | needs `tender: true` and `serviceR` on Hecla (currently none) |
| Per mission | magazine starts full if the mission says `supplied: true` (default), else `ordnanceStock` (existing mission field) | `ORDNANCE_MANIFEST.md` follow-up |
| Per campaign | ledger of missiles/torpedoes/nukes decrements by what was launched; hold restocks only at a depot | `ECONOMY.md` 6.2; ledger unbuilt, so interim = mission config |
| Magazine hit zone | new `mag` comp (hp 600, armoured) on each capital; destruction removes stores and deals a blast | follows `NUKES.md` 4.2 vault |
| Rearm is not repair | unchanged | `AGENTS.md` binding rule |

TERN ferry (optional, later): a TERN (34 m, two cargo pods) carries 24 missiles + 8 torpedoes (about 56 pt) and transfers to a capital within 150 m at 4 pt/s, letting the Tender stay 2-3 km back. Needs a shuttle AI (none exists).

### 2.6 Nuclear allotment (`NUKES.md` 4.2, 4.4, 4.6 and the audit)

- **One sealed reserve, campaign-level.** `nukes = {nk1, nk2, nk3}`, starting stock 20 = 4 Spark / 12 Brand / 4 Anvil [V-doc `NUKES.md`]. The engine today has a single `nuke` weapon (NK-1, 0.5 kT) and none of the release, arm or stock machinery [V-doc audit].
- **Per mission:** the briefing allocates N from the reserve to the player's ship(s). The Exeter's allocation sits in its vault (`mag` comp) and is fired through the `RT` tubes (heavy tubes accept `nuke`, reload x4.5).
- **Never per ship by default.** No hull's db `stores` carries `nuke`; allocation is a mission/briefing field. AI never fires a nuke (the audit calls this "an accident, not a rule": make it a rule: `launcherAI` ignores `nuke`).
- **Never restocked by the Tender:** add `noRearm: ['nuke']` to the service loop. Unfired warheads return to the reserve at mission end.
- **FROGG:** none (`NUKES.md` Q9 default).
- **Cell mismatch:** `NUKES.md` 4.2 specifies 6 VLS cells and 24 HM-1 for the Exeter; this document gives 4 heavy tubes and 24 HM-1. Q5.

### 2.7 What the engine can do now versus what needs code

| Capability | Today | Needs |
|---|---|---|
| Per-ship stores, caps, tender refill | yes (`stores`, `def.stores`, `tenderTick`) | data-only to set numbers |
| Salvo of N at one target, then rest | bombers only (`salvo`, `torpSalvo`); capitals use a fixed 5 s gap | per-launcher model |
| Several simultaneous targets from one ship | no (single `s.lock`) | per-launcher acquisition |
| Cold launch, initial heading toward target | no (forward only) | `launchMissile(s, wid, {tgt, dir, pos})` |
| Per-launcher reload timers, `dry`, HUD | no | `def.launchers` runtime state, HUD chip |
| Capital fires missiles at fighters | no (`capitalAI` fires only `tad`/`torp`) | `launcherAI` |
| Anti-saturation rule | no; `torpsStillNeeded` is the only gate | in `launcherAI`, needs target PD count |
| Drone limit per ship | yes: `def.droneLimit` read by `droneLimitOf` | data-only; AI launch missing |
| Generic hangar for human carriers | no (`hangarUpdate` Bullfrog-only) | generalise to `def.hangar` |
| Tender rate by magazine, finite hold, nuke exclusion | no | edit `tenderTick` |
| Shared missile geometry/material | no (new meshes per launch) | cache in `missileMesh` |
| In-flight cap | no | counter + refuse |
| Missile blast on 450-600 m hulls | fixed (`hullGap` in `blastAt`) | verify only |

---

## 3. Per-ship loadouts

Reading guide: M = missile (`ir` SW-9, `rf` LN-3, `tick` SK-1), T = torpedo (`torp` HM-1 / `tad` ST-2), RM/RT = reloadable launchers, FT = fixed tubes. "Cur." is the db today [V-data]. All numbers below are proposals [A], chosen so that magazine = 1.2-1.4 x E (3.3).

### 3.1 Human side

| Ship (cls, m) | Launchers (n, reload) | Magazine | Fighters / drones | PD (missile-capable) | Nukes |
|---|---|---|---|---|---|
| **Halberd** (corvette, 64 authored / 128 flown). Cur.: flare 0, no missiles | 4 FT-M pods (ripple 2, rest 20 s); 2 FT-T tubes (salvo 2, rest 14 s) | ir 12, rf 4, torp 8 | no fighters; drones: stock 12, live 6 (corvette default) | 4 PD-30 (+2 P-4 beams) | 0 |
| **Exeter** (frigate/cruiser, 450 m). Cur.: drone 48 only | 6 RM (3 dorsal, 3 ventral, 5 s); 4 RT (bow quarter, 10 s) | ir 40, rf 24, torp 24 | hangar 12 (`dock.fighters` already 12): 6 Kestrel, 2 Falchion, 2 Bittern, 2 Merlin; airborne cap 6; drones: stock 48, live 12 | 3 PD-30 (+4 P-4 beams) | allocation 0-6 from reserve, via RT, vault `mag` |
| **Claymore** (destroyer, 600 m). Cur.: torp 8 on 2 racks | 8 RM (5 s); 8 RT (10 s) replacing the two 4-pod racks | ir 48, rf 36, torp 48 | hangar 8: 4 Kestrel, 4 Bittern; airborne cap 4; drones: stock 24, live 12 | 8 PD-30 | 0 |
| **Hecla** (strategic tender, 1000 m). Cur.: shuttle 24, no missiles | 16 RM (5 s); 8 RT (10 s) | ir 100, rf 60, torp 48; **hold** 800 M + 240 T for service | hangar 36 of 96 docks (4 hangar comps `hgDL/DR/VL/VR`): 16 Kestrel, 8 Falchion, 8 Bittern, 4 Merlin; airborne cap 12; drones: stock 96, live 24 | 6 PD-30 + 4 P-4 | 0 default |
| **Argosy** (liner, 450 m). Cur.: flare 24 | none | flare 48 | none | 6 PD-30 | 0 |
| **Tender** (200 m, `tender`). Cur.: unarmed, flare 24, dock 24 fighters / 4 corvettes | none | flare 24; **hold** 400 M + 120 T + 96 drones | dock capacity as today | none (add 2 PD-30: it is the priority target) | never |
| **Tern** (34 m shuttle) | none | optional ferry cargo 24 M + 8 T | none | none | never |

Notes:
- **Halberd** screens the Exeter/Claymore; 8 torpedoes (four 2-round salvos) threaten a Gulper (3 hits) but not a capital. Rails and rotary stay the main armament. FT pods are single-salvo racks refilled at a Tender, as the owner proposed for corvettes.
- **Exeter** cells default to ir:rf = 5:3. `ir` (lock 1.2 s, range 1700 -> engage band 350-1190 m) for close defence; `rf` (3400 -> 2380 m) for reach, but chaff-defeatable (`chaffS` 0.65).
- **Claymore** is the anti-capital hull: RT 8 gives a ripple of 8 in 3.2 s. Enough against a Gulper trio; still below the 24 needed against a Bullfrog.
- **Hecla**: its ordnance is intentionally modest. The owner fixed its role as logistics with 6 PD, "no longer a fighter-killer" (`BALANCE_REPORT_3`); its power comes from the complement. 24 RM / 12 RT would end a Gulper trio in about 20 sim-s (6b), too fast for a 1000 m asset; hence 16 / 8.
- **Drone numbers** [A]: live limit and stock are `def.droneLimit` and `stores.drone` (data-only). KITE-6 is 6 m, 7 hp (10 in the v05 pass), DR-2 gun, two S-class IR hardpoints (`kite6.hardpoints` S1/S2 cap 1; `stores ir 2`). Twelve drones add up to 24 SW-9: count drone missiles in the same live cap. AI never launches drones today (only `?free&drones=` and the player's comms menu).

### 3.2 FROGG side

FROGG doctrine (`WEAPONS.md` 1b, 5): masers and wetware ordnance, no drones, numbers and pressure, no tender (`SHIP_CLASSES.md`: hangars rearm docked fighters, no repair). Wetware seekers lock harder and decoy worse.

| Ship (cls, m) | Launchers | Magazine | Complement | PD | Notes |
|---|---|---|---|---|---|
| **Gulper** (corvette, 66 / 146 flown). Cur.: tad 36 (4 cassette launch points), PD 4 R-4 (+3 R-5 pending v05) | 4 FT-T cassettes (salvo 3, rest 7 s; existing); + 2 FT-M pods (tick) | tad 36, tick 12 | none | 4 R-4 (7 with v05) | `tick` is new: something against fighters (two Falchions kill a Gulper in 12 s, `DESIGN_V05`). Leave `tad` untouched. |
| **Bullfrog** (capital, 600 m). Cur.: tad 16 (4 tubes), 36-fighter hangar, PD 10 sting + 8 thorn | 4 RT (tad; keep the current 18-26 s until Q4); 6 RM (tick, 8 s) | tad 16 (unchanged), tick 24 | hangar 36: 12 Darter, 10 Leaper, 4 Spitter, 4 Toad, 6 Reaver (existing), cap 12, 4.5 s per bay | 18 turrets | The wing already carries 96 SK-1 + 48 ST-2 [C: 12x2 + 10x2 + 4x4 + 6x6 = 96; 4 Toads x 12 = 48]. Do not buff the boss's own tubes without a sweep. |
| **Hive Carrier** (900 m). Cur.: unarmed, dock 60 fighters / 6 corvettes, power 51 MW (looks like a placeholder) | none | none | hangar 60 (Bullfrog mix x 5/3: 20 Darter, 17 Leaper, 7 Spitter, 7 Toad, 9 Reaver), cap 16, 3 s per bay | add 8 thorn (pdOnly) | Wing manifest 156 SK-1 + 84 ST-2 [C: 20x2 + 17x2 + 7x4 + 9x6 = 156; 7x12 = 84]. |

### 3.3 Why these magazine numbers (E check, T = 120 s, duty 0.35)

| Ship | E_missile | E_torp | Magazine / E |
|---|---|---|---|
| Halberd (pods 20 s, tubes 14 s) | 4 x 6 x 0.35 = 8 | 2 x 8.6 x 0.35 = 6 | 16 / 8 = 2.0; 8 / 6 = 1.3 |
| Exeter | 6 x 24 x 0.35 = 50 | 4 x 12 x 0.35 = 17 | 64 / 50 = 1.3; 24 / 17 = 1.4 |
| Claymore | 8 x 24 x 0.35 = 67 | 8 x 12 x 0.35 = 34 | 84 / 67 = 1.25; 48 / 34 = 1.4 |
| Hecla | 16 x 24 x 0.35 = 134 | 8 x 12 x 0.35 = 34 | 160 / 134 = 1.2; 48 / 34 = 1.4 |

Rule: magazine = 1.2-1.4 x E, so a hard mission nearly exhausts it and a second mission needs the Tender.

---

## 4. Fighter complements

### 4.1 Constraints from the code and docs

- Voxel cost: Kestrel 12k instances at mid detail, other fighters 4-5k at tablet detail [V-doc `BULLFROG.md` 5.2]. The Bullfrog's airborne cap is 12 (`hangarCfg.cap`). Humans: airborne cap 6 (Exeter), 4 (Claymore), 12 (Hecla); halve on phones.
- Recovery: the Bullfrog has none. Humans can dock at the Tender (`dockTry`, player only) but not at their own capital. Minimal viable: dry or damaged AI fighters return, are removed, and reappear rearmed (same damage) after a cooldown; docking animation later.
- `def.dock.fighters` is the only complement field today: Exeter 12, Tender 24, Hive 60, Hecla 96, Bullfrog 36.

### 4.2 Proposed `def.hangar`

| Ship | Total | Mix | Airborne cap | Interval per bay | Bays | Trigger |
|---|---|---|---|---|---|---|
| Exeter | 12 | 6 Kestrel, 2 Falchion, 2 Bittern, 2 Merlin | 6 | 6 s | 2 (`bay`, cradles) | hostile within 4000 m or hit (as `hangarUpdate`) |
| Claymore | 8 | 4 Kestrel, 4 Bittern | 4 | 6 s | 1 | same |
| Hecla | 36 active (of 96 docks) | 16 Kestrel, 8 Falchion, 8 Bittern, 4 Merlin | 12 | 4 s | 4 (`hg*` comps) | same; emergency 1.5 s below 25% structure |
| Bullfrog | 36 | existing | 12 | 4.5 s | 2 | existing |
| Hive Carrier | 60 | see 3.2 | 16 | 3 s | 2 | as Bullfrog |

A Bittern carries 12 torpedoes: two Bitterns are 24 torpedoes outside the ship's magazine. This is the owner's "bomber carries 12" logic applied correctly: **the capital's torpedo stock is mostly in its bomber wing, and the wing is the saturating salvo** (existing 3-round waves).

### 4.3 AI behaviour needed

- `hangarUpdate` is hard-wired to the Bullfrog's `bayA`/`bayB` comps and FROGG manifest (`hangarPick`, `hangarLaunch`). Generalise to `def.hangar.bays[]` plus a manifest; cap and emergency logic carry over.
- Spawned human fighters get `ai.escort` = the carrier (`escortAI` exists for Gulpers/Halberds).
- Spine corridor: friendly fighters must keep out of the Exeter MD-XL cone when charging (`bfFighterHook` is FROGG-only today).

---

## 5. Pacing, caps and tuning knobs

### 5.1 Numbers recommended

| Parameter | Value [A] | Reason |
|---|---|---|
| Live missiles, target | <= 30 | two capitals + fighters (1.2f) |
| Hard cap | 48 desktop / 32 iPad / 20 phone | launchers refuse, no silent despawn; unmeasured (P1) |
| RM reload | 5 s | 0.2 launches/s/cell; 6 cells = 1.2/s |
| RT reload | 10 s | `torpReload` 14 s today |
| Nuke reload | 45 s | `NUKES.md` 4.2 |
| RM ripple | up to 3 launchers, 0.3 s apart | flare exhaustion pressure without a wall |
| RT ripple | whole ready set, 0.4 s apart | needed to exceed PD capacity |
| Salvo requirement | 2 x PD capacity of target, else hold | 2.4(4) |
| Kill rate vs fighters | 0.06 per cell per s at A1 | 6 cells: one fighter per 2.8 s |
| Torpedoes per ripple | at most n_RT (8) | Claymore and Hecla only |

### 5.2 Derived quantities

- In flight at full duty: Exeter about 9; Claymore 8 x 0.2 x 5 + 8 x 0.1 x 8 = 14; Hecla 16 x 0.2 x 5 + 8 x 0.1 x 8 = 22. At duty 0.35 these are 3, 5 and 8, so a three-capital battle sits at 20-30 with fighter missiles (12 Kestrels, one launch per 14-24 s each = 0.6-0.9/s x ~6 s = about 5).
- Time to empty at duty 0.5: Exeter missiles 64 / (1.2 x 0.5) = 107 sim-s (285 real s); torpedoes 24 / (0.4 x 0.5) = 120 sim-s.

### 5.3 PD drums (side check)

PD-30 drum 1500 rounds; about 25 rounds per torpedo (6 hits at 25%) = 60 torpedoes per drum. Drums do not bind against ordnance; they bind against sustained fighter fire (110 s continuous). Leave tender drum refill (40 rds/s) as is.

### 5.4 Tuning knobs

`tuning.ordnance = { rmReload, rtReload, nukeReloadMul, rippleRM, rippleRT, pdSalvoMul (2.0), liveCap: {desktop, touch, phone} }` and per-ship `launcherScale` (so a mission can run easy/hard variants, as `hangarCfg` does).

---

## 6. Reference battles (simple arithmetic)

### 6a. Exeter + 2 Kestrels vs Bullfrog (scenario `j-exeter-k2`, start 4000 m)

**Measured baseline** [V-doc `BALANCE_REPORT_3`]: 0/20 human wins on both builds; FROGG losses median 7 -> 1 after the capital-laser split; the Bullfrog's spine ends it in about 35 s of contact. Acceptance engagement (Exeter + 12 Kestrels + 2 Halberds): Exeter alive 6/10, Bullfrog alive 3-4/10.

**Bullfrog side:** hangar cap 12, fighter contact 25-54 s; spine not before 15 s, 30 s cooldown; 4 tubes at one Tadpole per 18-26 s; PD capacity about 12 torpedoes or 54 IR per window.

**Exeter ordnance plan (new):**

| Phase | Time | Action | Arithmetic |
|---|---|---|---|
| Fighter wave 1 | 25-54 s | 6 RM engage: `ir` inside 1190 m, `rf` to 2380 m | 1.2 launches/s; hit 0.30 -> 0.36 kills/s while targets are present. 12 airborne at 0.36/s = 33 s, using 33 x 1.2 = 40 missiles |
| Waves 2-3 | to ~105 s | cells keep cycling | 64 missiles in total -> about 19 kills at A1, dry at about 105 s |
| Torpedoes | any | 4 RT | ripple 4 < capacity 12 -> 0 expected hits, so the hold rule keeps all 24 |
| Turret kill | | Kestrels remove Bullfrog S/PD turrets (45/40 hp, exposed) | with about 9 of 18 dead, capacity about 6; a 4-torpedo ripple still leaks 0-1. Torpedoes only matter with **bombers**: 2 Bitterns x 12 in 3-round waves = 6 per wave pair, still below 12 |

Expected change: the Bullfrog loses about 19 fighters to missiles instead of the 1-8 the lasers and PD manage, so the Exeter takes fewer Tick and Tadpole hits, but nothing touches the spine (900 kin, 60% pierce; Exeter dies on spine hit 4-5, `BULLFROG.md`). I expect the human win rate to move from 0/20 to somewhere in 0-30%, **not** to parity [A: reasoning only, no measurement]. If the owner wants a competitive fight the levers are spine cooldown and hangar cap, not Exeter missiles.

**Expenditure (a):** 64 missiles by about 105 s, 0-8 torpedoes, 0 nukes; 19 fighter kills at A1, about 9 if the true hit rate is 0.15.

**Where the plan is pointless:** (1) Exeter torpedoes against a manned Bullfrog PD (4 vs 12); (2) IR/RF against the Bullfrog hull (M3 ceiling: no kill, 28-33% structure left after 60 missiles, subject to data caveat 2 in section 0); (3) missiles on fighters that carry 8-12 flares each if A1 is optimistic; (4) any cell firing into the spine corridor with a friendly in line (launch refusal).

### 6b. Hecla group vs 3 Gulpers + fighters

**Setup [A]:** Hecla + 12 Kestrels (airborne cap 12) + 2 Halberds vs 3 Gulpers (380 hp now, 480 in v05; shield 200/160; 36 ST-2 and 12 tick each) + 12 FROGG fighters (6 Darter, 6 Leaper). Start 6000 m.

**FROGG threat.** Gulper AI fires one ST-2 per 5 s at capital targets until `torpsStillNeeded` is met: three Gulpers launch 0.6 per s. Hecla PD capacity is about 5 per window, 0.6/s x 2.6 s = 1.6 in the window: all absorbed. Against Halberds (capacity 4): same. The Gulpers' torpedoes are already pointless against this group; the danger is their guns and the 12 fighters (24 SK-1).

**Human ordnance:**
- Hecla RT 8 at 10 s: ripple of 8 at three Gulpers (about 3 each); Gulper PD capacity 3 each, so 0-1 leaks per Gulper; 3 hits needed (ceiling salvo of 3). Ripple 1 kills 0-1; ripple 2 (+10 s) kills 1-2; ripple 3 (+20 s) the rest: **3 Gulpers dead in 25-35 sim-s after first launch** (70-95 real s), 24 torpedoes. With 12 tubes it would be about 20 s, which I judge too fast.
- Hecla RM 16 + Halberd pods vs 12 fighters (A1): 40 missiles needed, 16 cells at 3.2/s = 13 sim-s of fire; with cover limits 25-30 s.
- Kestrel wing: 12 x (4 IR, 2 RF, 1 HM-1) = 48 IR + 24 RF + 12 HM-1; AI rate 0.6-0.9 launches per s overall; the 12 HM-1 add 1-2 Gulper kills.
- Bittern wing: 8 x 12 = 96 torpedoes in 3-round waves with 7 s rest, far above the 9-12 needed; `torpsStillNeeded` makes them break off after 1-2 waves.

**Expenditure (b):** Hecla about 24 torpedoes + 40 missiles; Kestrels about 40 IR/RF + 6 HM-1; Bitterns 12-24. About 130 rounds, 55 of them torpedoes. Hecla magazine afterwards: missiles 120 of 160, torpedoes 24 of 48: one more mission of this size before the Tender. Time to clear: about 40 sim-s (107 real s) for the Gulpers, 50 s for the fighters. Baseline for comparison (`BALANCE_REPORT_3`): 3 Kestrels remove about half of Hecla's structure in 180 s without winning; the new ordnance turns Hecla's group from "survives" into "wins decisively".

**Where it is pointless:** (1) IR against Gulpers (ceiling 8-9 IR per kill with the possibly dead `dmgCls`; unknown now); (2) Hecla torpedoes against any target with 8+ PD (Bullfrog, or a Gulper escorting one) at ripple 8; (3) Hecla's 8000/6500 shield is irrelevant to Gulper torpedoes as long as PD stops them (an ST-2 that connects strips up to `shieldDrain` 0.55 x def facet = 4400 and adds 310 with 35% pierce).

**Assumption risk:** with the v05 Gulper PD (7 turrets, capacity 5 each) a ripple of 8 kills about one Gulper per ripple. Re-run after the v05 branch merges.

---

## 7. Open owner decisions

| # | Question | Default used here |
|---|---|---|
| Q1 | Is "about 10 s reload" 10 sim-s or 10 real s (3.75 sim-s)? | 5 sim-s (RM), 10 sim-s (RT) |
| Q2 | Do capitals fire on their own, or by comms order only (as `NUKES.md` 4.2 says for nukes)? | AI for ir/rf/torp; comms-only for nukes |
| Q3 | Accept that AI holds torpedoes against a Bullfrog until its PD is degraded (2 x capacity rule), costing early "visible activity"? | yes |
| Q4 | Do FROGG capitals get the same launcher engine? (Bullfrog RT ripple of 4 would threaten Exeter.) | no; keep one Tadpole per 18-26 s until a sweep |
| Q5 | Exeter nuclear cells: 6 VLS (`NUKES.md`) or the 4 heavy tubes here? | 4 heavy tubes |
| Q6 | Do human fighters dock back at their carrier (recovery)? | respawn after cooldown, no animation |
| Q7 | Is the lost `dmgCls` fragmentation rule intended (fighter missiles weak against capitals), or should IR keep 210 flat to a capital? | restore the rule (data + a few lines) |
| Q8 | Hecla becomes a rearming `tender` as well? | yes, through the `ordn` comp |
| Q9 | Missile caps by device: acceptable that launchers refuse at the cap? | yes |
| Q10 | Capitals launch drones by AI at contact, live limit 12? (Today player-only.) | yes, 6 at contact, rest on losses |

---

## 8. Implementation phasing for Codex (dependency order)

Gate for all: `tools/check_branch.sh`; rebase on `origin/main`; balance claims need >= 20 seeded runs (`tools/tests/balance_sweep.py`), one page at a time (CODEX_NOTE). New player-facing systems stay frozen until the owner has hand-played on iPad (`AGENTS.md`): everything below ships behind a mission/db flag, default off.

| # | Task | Type | Depends | Test idea | Acceptance |
|---|---|---|---|---|---|
| P0 | **Re-measure missile damage vs capitals.** Run `ttk_matrix.py ceiling --seeds 20 --jitter --inpage` for ir/rf/tick/torp/tad vs exeter/destroyer/bullfrog/hecla. Decide Q7; delete or restore `dmgCls`/`pierceCls`/`pierce` | data + a few lines | none | regenerate the M3 ceiling tables | table in `docs/BALANCE_REPORT_*.md` with commit hash; Q7 answered |
| P1 | **Live-missile budget and shared meshes.** Cache geometry/material per `wid` in `missileMesh`; add `missiles.length` cap; instrument high-water mark and step time in `plog` | needs-code | none | stress test: spawn 24/48/72 missiles from fixed points for 120 s; record step time and live count | CPU step time at 48 live <= 1.3 x at 12; cap enforced; owner measures iPad fps |
| P2 | **Db schema:** `launchers`, `hangar`, `hold`, `mag` comp, `noRearm`; extend `tools/validate_db.py`; enter section 3 numbers as data the engine ignores | data-only | none | `validate_db.py`; `export_db.py` csv diff | all ships validate; sweeps `g1`, `j-exeter-k2` identical to baseline within noise |
| P3 | **Set stores** for Halberd, Exeter, Claymore, Hecla, Gulper (tick 12); Exeter `launch` points; `droneLimit` / `stores.drone` | data-only | P2 | `magazine_t.py`, `ordnance_t.py` | stores match section 3; player can fire Exeter missiles through existing keys |
| P4 | **`launchMissile(s, wid, opts)`** (target, dir, pos) with cold-launch heading; old signature still works | needs-code | P1 | new `launch_t.py`: ventral cell fires at a target 90 deg off-axis, 10 ceiling shots | >= 9/10 hit |
| P5 | **Per-launcher runtime and `launcherAI`** (threat list, coverage, ripple, PD-capacity gate, dry handling, friendly-line check), behind `def.launchersOn` | needs-code | P2, P3, P4 | scenarios `j-exeter-k2-cells`, `n-claymore-g3` (new, in `balance_sweep.py`); 20 seeds | (a) no launcher beats its reload; (b) kills per launch logged; (c) torpedoes held vs Bullfrog until PD < 50%; (d) live missiles <= cap |
| P6 | **Tender:** ordnance points, per-bay rate, finite `hold`, `nuke` exclusion; Hecla `tender` flag | needs-code (small) | P2 | extend `tender_pd_t.py`: empty Exeter refills in 88 +- 10 s | rates as 2.5; `nuke` never rises; hold decrements |
| P7 | **Generalise hangar** to `def.hangar` (bays, manifest, caps, emergency, respawn recovery) | needs-code | P2 | `bullfrog_t.py` hangar checks (regression) + new Exeter hangar test | Bullfrog timeline unchanged; Exeter cap 6 holds |
| P8 | **Drone AI launch** at contact | needs-code (small) | P3 | `drone_t.py` | launched <= limit; relaunch on loss |
| P9 | **Balance sweeps** with ordnance on: `j-exeter-k2`, `j-exeter-halberd`, Hecla vs 3 Gulpers, the acceptance engagement; 20 seeds each, plus `launcherScale` 0.5 / 1 / 1.5 | test + tuning | P5-P8 | `balance_sweep.py --seeds 1-20 --batch-size 1`; reuse the `__game` init-script override pattern (`GULPER_PD_INIT_SCRIPT`) | Exeter+2K vs Bullfrog 10-40% human win; Hecla group vs 3 Gulpers + 12 fighters clears in 60-120 sim-s with 20-50% loss rate; no cell above 90% or below 10% unless intended |
| P10 | **Nuclear allotment** per `NUKES.md` section 6 (release, vault, ledger); this design only reserves the data fields | needs-code (large) | Q5 | per audit table | out of scope for the first delivery |
| P11 | **HUD and briefing:** launcher chips (ready / reloading / dry), magazine counts, briefing line, one help line, touch binding | needs-code (UI) | P5 | `touch_qa_t`; screenshots at iPad and phone widths | readable at three widths; same commit as the feature (CODEX_NOTE lane C) |
| P12 | **TERN ferry** (optional) | needs-code | P6 | new test | not before owner hand-play |

**Risks:**
1. P0 may show IR now does 210 to a capital, so Exeter cells would be capital-killers, not only anti-fighter tools; the whole numbers table shifts.
2. The 2 x PD-capacity rule reads the target's turret count: fine for AI, but a "cheat" the owner may dislike.
3. A1 and A2 are unmeasured; section 6 can be off by a factor of two.
4. Changes touch `70_ai.js` and `60_weapons.js`, the same files as lane B (campaign waves); schedule after B merges.
5. The no-arcade-drops rule for Campaign is untouched.
6. FROGG parity (Q4): symmetric launchers would make the Bullfrog far more dangerous to Exeter.
7. Performance on iPad/phone is the single unmeasured gate; P1 is deliberately first among code tasks.

---
## OWNER DECISIONS 2026-11-02 (these override the draft above where they differ)

1. Reload times are **game (simulation) seconds**: 10 s torpedo tube reload, 5 s missile cell as proposed.
2. **Yes** to AI torpedo holding: capital AI fires torpedoes only when the salvo is at least 2x the target's PD capacity or the target's PD is below 50 % (tune by sweep, keep the rule data-driven).
3. **Nukes:** nuclear torpedoes are an **option toggled in the quick-play modes** (Skirmish, Gauntlet, Free Flight: a setting, default off). In the **campaign** it is a **story moment**: the player triggers it (scripted release by the mission, player fires). Never fired by the AI, never restocked by the tender.
4. **No launchers for the FROGG for now** (Bullfrog, Gulper, hive carrier keep what they have; the Gulper's extra tick missiles from the draft are NOT done).
5. Priority: balance pass v0.5 first (`docs/DESIGN_V05_BALANCE_PASS.md`), then P0-P3 of this document, then campaign tuning with the new fleets.

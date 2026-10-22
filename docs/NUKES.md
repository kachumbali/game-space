# Nuclear warheads: design for the Exeter stock, Kestrel torpedoes and Exeter launch (design paper, nothing implemented)

Status: design paper, 2026-10-22. No code was changed. **Every number below is an unsimulated placeholder** unless it is
explicitly marked as taken from existing code. The point of the numbers is internal consistency and a stated rationale,
not realism or measured balance.

Evidence tags used in this file:
- **[V-code]** read in the source in this session; not executed, so "verified by reading" only.
- **[C]** computed by me with throw-away Python scripts (formulas are written out so they can be reproduced; the scripts
  are not committed). The PD figures in section 5 come from a small Monte Carlo of my own abstraction of the turret code,
  **not** from the game.
- **[S]** a physical figure carried over from `docs/CAPITAL_COMBAT.md` section 2.2 (RAND RRA3028-3, Project Rho). I did not
  search the web for this paper and did not re-open those sources; treat them as secondary and as before "unverified here".
- **[A]** assumption or design choice by me. **[M]** physics from memory, unverified.
- `docs/BULLFROG.md` does **not exist yet** (checked: `ls docs/BULL*` found nothing). The Bullfrog is therefore the
  brief's placeholder: 600 m, shield about 1100 fore / 900 aft, structure 2600, composite armour (rating 0.35 [A]),
  18 PD turrets with `sting` (S class). Replace these numbers when the Bullfrog document lands.

Time: all durations are **sim seconds**; real time is sim time divided by `SIM_SPEED` 0.375, so 1 sim-s is 2.67 s on the
clock. Distances are metres.

Sources read for this paper: `AGENTS.md`, `docs/CAPITAL_COMBAT.md` (2.x), `docs/OPEN_QUESTIONS.md` (item 5),
`docs/LORE.md`, `docs/FLEET_LOGIC.md`, `docs/ECONOMY.md`, `docs/ARMOR.md`, and in `src/`: `60_weapons.js`, `65_combat.js`,
`30_ships_human.js`, `31_ships_frogg.js`, `70_ai.js`, `55_ships.js`, `50_state.js`, `75_mission.js`, `76_menu.js`,
`78_coms.js`, `90_hud.js`. The working tree had uncommitted edits by someone else to `index.html`, `src/60_weapons.js` and
`src/65_combat.js` while I wrote this; I read the working-tree versions and did not touch them.

---

## 1. What the first-cut code does today, and what is wrong with it [V-code]

| Item | Current behaviour | Problem for this design |
|---|---|---|
| `WEAPONS.nuke` (60_weapons.js:59) | `NK-1 WARHEAD (0.1 kT)`: v0 40, vmax 300, acc 90, turn 1.2, hp 5, lockTime 2.0, range 2200, `fuze: 120`, `nuclear`, `yield 0.1`, listed in `MSL_ORDER` | One class only; no arming, no release, no fuze modes |
| `nukeAt` (60_weapons.js:329) | For **every** live ship (any team, launcher included): fluence `0.8 x kT x 4.18e12 / (4 pi r^2)` J/cm2 with `r` measured to a shell at 0.62 x ship radius; hull damage `hp_ref x F / Fk` via `applyHit(..., 'nuke')`; blind timer; crew dose | No friendly-fire discount (correct for radiation, but then nothing protects own ships); no EMP; the crew rule below |
| Crew dose | `80 Gy x kT x (900/r)^2`, minus up to 50 % scaled by **average** shield fill; `>= 30 Gy` calls `killShip` for any non-drone ship | **A frigate or capital dies outright from crew dose.** 0.1 kT at 465 m would destroy a 450 m Exeter with no hull damage. Needs a per-class shielding factor (section 2.4) |
| Blind (`NUKE.blindF` 0.04 J/cm2) | `blindUntil = time + min(12, 2 + 3 log10(F/0.04))` | `compFactor(s,'turret')` is **never called** by `updateTurrets`; only `radar` consumers read it (grep: callers are lock, HUD, coms, shield gate). **So the "PD optics blind" effect described in CAPITAL_COMBAT.md 2.1 does not exist in the code.** Radius for any blind at 1 kT is about 26 km, so every ship in any arena is blinded |
| Bolt hit on a missile (`updateBolts`) | `m.hp -= b.dmg`; at 0 calls `killMissile(m, m.w.torp)`; for `nuke` (`torp: true`, `nuclear: true`) that runs `nukeAt` | **A shot-down nuke torp detonates at full yield at the point of interception.** This contradicts CAPITAL_COMBAT.md 2.3 ("soft kill or hard kill") and normal one-point-safe design [M] |
| Proximity fuze (`updateMissiles`) | Trips at `dc < radius x 0.55 + fuze`, hostile ships only; friendly hulls are solid for impact | Burst distance is to a 0.55 R shell, the dose and fluence use a 0.62 R shell: two different "surfaces" |
| Arming | 0.35 s delay (`m.age < 0.35`), `launchMissile` guards only `stores` and `ai.hold` | No safe-separation, no release, no ARM step. A Kestrel fires a nuke exactly like a Swift |
| AI | `missileLogic` only fires ids passed in `wantIds`; nuke stores exist only via `?free&nuke=N` (55_ships.js:125) | Correct today (AI never fires one), but it is an accident, not a rule |
| Wingman loss | `75_mission.js:289`: nuke-type death lowers eject chance by 0.30 | Keep |
| Damage pipeline | `DMGX.nuke = [1,1,1]`; `ARMOR.*.prof.nuke`: ablative 1.6, hard 0.6, composite 1.0 (armour stops share = min(0.92, rating x prof)); nuke is one large hit so the `thresh` cut-off is irrelevant | Good as is; section 2.3 reuses it |

PD facts needed later [V-code]: `sting` (FROGG S-class PD): dmg 1.5, `cd` 0.09 (11.1 rounds/s), v 900, spread 0.012 rad,
range 800, track 3.6. A turret picks a missile only inside `0.75 x range` (600 m) **and** if the missile targets that ship or
is within 500 m; it picks the **nearest** to itself, re-evaluated every 0.2-0.3 s, and idles until the next re-evaluation after
its target dies. Nothing deconflicts turrets, so all turrets pile onto the same missile (overkill), which helps the attacker
at the margin. Missile hit sphere for bolts is 1.6 m radius. Human `pd` is 1.3 kinetic, same rate class. Whether turrets
have a magazine is unmodelled today (CAPITAL_COMBAT.md section 3 plans one); a magazine would reduce PD and shift every
PD figure below in the attacker's favour.

---

## 2. Warhead classes and the effects model

### 2.1 Classes (yield, x-ray share, dose)
Scale target: the sim has 12 m fighters, a 66 m corvette and 450-600 m hulls, and sensor ranges of 1.5-6 km. Real tactical
yields would sterilise any such arena at tens of km [S: sourced civil thresholds, CAPITAL_COMBAT.md 2.2]; the game relies on
a hardening parameter for military hulls (`NUKE.kill`, no open source, [A]). I keep that parameter and keep yields small.

| Id | Name | Yield | X-ray share `xf` | Dose coefficient (Gy at 900 m per kT) | Intent |
|---|---|---|---|---|---|
| `nk1` | **NK-1 SPARK** | 0.1 kT | 0.3 (enhanced radiation) | 80 | Anti-fighter, anti-crew. Existing first-cut warhead, renamed. [A] |
| `nk2` | **NK-2 BRAND** | 1 kT | 0.8 | 40 | Standard capital-killer; fits a Kestrel pylon |
| `nk3` | **NK-3 ANVIL** | 10 kT | 0.8 | 40 | Heavy; Exeter cells only; clears the local volume of fighters |
| later | X-ray laser | free | n/a | n/a | In-arena capital weapon, not designed here (CAPITAL_COMBAT.md 2.1) |

The 80 Gy at 900 m per kT figure is Project Rho's neutron-bomb number [S]; I give it to the enhanced-radiation Spark and
halve it for the standard Brand/Anvil [A]. Warhead mass is not modelled; carriage cost is in section 4.

### 2.2 Fluence model (kept from the first cut)
For a burst at surface distance `r` (m) from a target, with `r = max(3, |distance_to_centre - 0.62 x radius|)`:

    F(r) = 2.661e7 x Y(kT) x (xf / 0.8) / r^2        [J/cm2]        (= xf x Y x 4.18e12 / (4 pi r^2 x 1e4))   [C]

Hull damage points (existing formula, `NUKE.kill` per class: fighter 1500, corvette 2500, frigate 4000, capital 8000 J/cm2):

    P(r) = hp_ref x F / Fk,        hp_ref = structure + mean(shield.fore, shield.aft)

and `applyHit(s, lp, P, wp, 'nuke')` does the rest: shield on the facing nearest the burst is drained 1:1, the remainder
passes the armour transform (`stop = min(0.92, rating x prof.nuke)`), then structure. Spall to a nearby component follows
the usual `ARMOR.spall`. Consequence worth stating: **a facing's shield pool is a flat buffer against a nuke; it does not
attenuate in proportion.** That is intentional and simple; "shield attenuation" applies to crew dose, not to hull damage.

Resulting "points to kill through one facing": `shield_facing + structure / (1 - rating)` [C]:

| Target | shield (facing) | structure | armour rating | points to kill |
|---|---|---|---|---|
| Kestrel | 40 | 50 | 0.44 | 129 |
| Gulper (66 m) | 200 | 380 | 0.31 | 751 |
| Exeter (450 m) | 900 | 1600 | 0.27 | 3092 |
| Bullfrog (600 m, placeholder) | 1100 | 2600 | 0.35 | 5100 |

Radii at which one warhead delivers that many points ("one-shot hull kill") and the radius at which it merely strips the
facing shield ("strip"), metres from the hull surface [C]:

| Warhead | Kestrel kill / strip | Gulper kill / strip | Exeter kill / strip | Bullfrog kill / strip |
|---|---|---|---|---|
| Spark 0.1 kT (xf 0.3) | 22 / 39 | 17 / 33 | 14 / 26 | 9 / 20 |
| Brand 1 kT | 111 / 200 | 89 / 173 | 73 / 135 | 48 / 104 |
| Anvil 10 kT | 351 / 632 | 282 / 546 | 230 / 426 | 153 / 330 |

Reading: **hull kills need contact-range bursts; the fighter and the crew die from dose long before the hull is hurt.**
The Spark is not a hull weapon at all. A Brand must burst within about 50 m of a Bullfrog's surface to kill it alone, which
is the reason PD, not yield, is the real contest (section 5).

### 2.3 Warheads needed against a hull, by burst distance
Sequential warheads at the same facing, shields not regenerating between them (shield regen is small and slow; an
approximation) [C]. Number of warheads to destroy the target:

| Burst distance from surface | Bullfrog: Brand | Bullfrog: Anvil | Gulper: Brand | Exeter: Brand |
|---|---|---|---|---|
| 30 m | 1 | 1 | 1 | 1 |
| 50 m | 2 | 1 | 1 | 1 |
| 100 m | 5 | 1 | 2 | 2 |
| 150 m | 10 | 1 | 3 | 5 |
| 250 m | 27 | 3 | 8 | 12 |

(Spark against a Bullfrog: 11 at 50 m, 43 at 100 m. Worthless, as intended.) For comparison, the existing `torp` (HM-1
Hammer, 170 dmg plus blast) needs about 30 hits on a Bullfrog by the same arithmetic; `docs/ECONOMY.md` already scores a
warhead as 30 S and a heavy torpedo as 1 S, so one nuke at contact range is priced like thirty Hammers. That coincidence is
not tuned, only noticed.

### 2.4 Crew dose
    dose(r) = coef x Y x (900 / r)^2 / CPF x (1 - 0.5 x shield_fill_on_burst_facing)         [Gy]   (coef in section 2.1)

- **CPF (crew protection factor), per class [A]:** fighter 1, drone n/a (immune), corvette 8, frigate 60, capital 150. This
  fixes the defect in section 1: it is hull mass and compartmentalisation, which the current code ignores.
- **Shield attenuation:** keep the owner-pending default `shieldCut 0.5` but use the **facing nearest the burst**, not the
  average, and not at all when that facing is at 0 [A]. Meaning: a strip-and-burst sequence (first warhead drops the
  shield, second burst irradiates) is deliberate and visible.
- **Thresholds [A]:** human crew `prompt incapacity` 30 Gy (existing value); FROGG crew 15 Gy (owner: FROGGs are
  radiation-vulnerable; the factor 0.5 is mine). Optional second tier, 6-30 Gy: "dosed", pilot survives the sortie but is
  lost to the roster afterwards (ties into the persistent pilots in `docs/FLEET_LOGIC.md`); not needed for a first build.
- **What dose does:** fighter: unchanged (`killShip`, the wingman eject rule already subtracts 0.30 for nukes). **Corvette
  and larger: do not call `killShip`.** Instead set a `crewFrac` in 0..1, ramping from the threshold to 3x threshold; turret
  fire rate, repair and power factor scale by `1 - crewFrac`; at 1.0 the ship is a derelict (guns off, no shield regen, AI
  `hold`), left to be finished conventionally. This gives the Spark a real niche against corvettes (below) without
  one-shotting capitals.
- **Drones** are immune to dose (CAPITAL_COMBAT.md 2.3) but not to EMP (below).

Lethal-dose radii in metres [C] (30 Gy human / 15 Gy FROGG; fighters "shield" = shield up, `cut 0.5`):

| Warhead | Kestrel, no shield / shield up | FROGG fighter, shield up / down | Gulper crew (15 Gy, CPF 8) | Exeter crew (30 Gy, CPF 60) | Bullfrog crew (15 Gy, CPF 150) |
|---|---|---|---|---|---|
| Spark 0.1 kT | 465 / 329 | 465 / 658 | 232 | 60 | 54 |
| Brand 1 kT | 1039 / 735 | 1039 / 1470 | 520 | 134 | 120 |
| Anvil 10 kT | 3286 / 2324 | 3286 / 4650 | 1643 | 424 | 379 |

(The FROGG "shield up" equals the human "no shield" figure only because the 0.5 threshold factor and the 0.5 shield cut
cancel; a coincidence of the placeholders.)

### 2.5 Electronics: EMP-like effect (new) and flash blindness (fixed)
Reasoning: RAND gives civil-satellite upset at about 0.4 J/m2 (4e-5 J/cm2) and system-generated EMP at about 4 J/m2 [S];
military hardening has no open number, same as hull hardening. I define game thresholds in J/cm2 and hardening multipliers.

- **Flash blind (sensors and PD optics).** Keep `blindUntil = time + min(CAP, 2 + 3 log10(F / blindF))` with `blindF` 0.04, but
  **(a)** make `updateTurrets` and `lockUpdate` actually consult `compFactor(s,'turret'/'radar')`; **(b)** lower `CAP` from 12
  to **8** sim-s (about 21 s on the clock, which is already long) [A]; **(c)** scale by line of sight: halve the timer if the
  burst is outside the sensor's forward 180 degrees, and zero it if the ship is occluded by a hull larger than 100 m (cheap
  ray test against `traceShip` is the existing tool) [A]. Durations before the cap, from the current formula [C]:

| Burst / distance | 300 m | 1 km | 3 km | 6 km |
|---|---|---|---|---|
| Spark | 9.3 s | 6.2 | 3.3 | 1.5 |
| Brand | 13.6 | 10.5 | 7.6 | 5.8 |
| Anvil | 16.6 | 13.5 | 10.6 | 8.8 |

  With cap 8 a Brand within about 3.3 km blinds everyone with line of sight for the full cap; a Spark blinds for 6 s at 1 km.
  That makes "blind the PD, then follow with the salvo" a playable tactic (section 3.5).
- **EMP "upset".** Threshold `F_up = 20 J/cm2 x EMPH`, with `EMPH`: fighter 1, drone 0.5, corvette 3, frigate/capital 5 [A].
  Radius `r_up = sqrt(2.661e7 x Y x xf/0.8 / F_up)` [C]:

| Warhead | Fighter | Corvette | Frigate / capital | Drone |
|---|---|---|---|---|
| Spark | 223 m | 129 | 100 | 316 |
| Brand | 1153 | 666 | 516 | 1631 |
| Anvil | 3648 | 2106 | 1631 | 5159 |

  Effect inside the radius: `empUntil = time + t`, with `t` 1.5 sim-s (4 s on the clock) at the threshold rising to 3 sim-s at
  10x threshold. During it: lock state reset, selected missile cleared, shield facings forced to 0 and regenerate from 0
  afterwards, weapon energy pool to 0, `compFactor` of `radar`, `shield` and `turret` returns 0. **Player:** controls stay
  live (the owner's brief wants a risk, not a lost game); the HUD loses its tracks (static). **AI:** `ai.stun = t` (no new
  decisions, coast on current velocity, no fire). **Drones:** control link lost for `t` (they hold position). Above 10x
  threshold, additionally 30 % damage to one `radar`/`shield`/`power` component (hardware loss), so close bursts leave a
  mark that a flash does not.
- A burst is therefore three overlapping bubbles for a Brand: fighters are dosed to 735-1039 m, upset to 1153 m, blinded
  to several km; a Bullfrog is hull-killed inside 48 m, shield-stripped inside 104 m, upset inside 516 m, crew-dosed
  inside 120 m. The **soft effects have much larger reach than the hard ones**, which is what makes standoff bursts
  useful for PD suppression and not for killing capitals.

### 2.6 Friendly fire and collateral
- **Radiation has no side.** `FF.blast` 0.5 does **not** apply to nukes: factor 1.0 for hull damage, dose, EMP and blind.
  (The current `nukeAt` already behaves this way, including on the launcher; keep it and document it.)
- **Proximity fuze** triggers on hostiles only (existing). **Impact** with any hull, friendly or hostile, once armed,
  detonates. Before arming (section 4.3) a hit on anything is an inert kinetic strike.
- **Keep-clear radii** (what the HUD shows, section 4.6) are the unshielded lethal-dose radius times 1.25 for crewed
  fighters, rounded: Spark 600 m, Brand 1.3 km, Anvil 4.1 km. For capitals use the EMP radius: Brand 520 m, Anvil 1.65 km.
- **Own frigate.** The Exeter (CPF 60, EMPH 5): Brand hull-kill 73 m, shield-strip 135 m, crew 134 m, EMP 516 m. Anvil:
  230 / 426 / 424 / 1631 m. So an Exeter that launches a Brand safely sends it to at least 600 m; an Anvil needs 1.7 km of
  separation before a burst is tolerable, and 2.3 km if the Exeter must keep PD running through the burst. **Mis-launch means:**
  - a torp that leaves the cell and is killed or fails **before arming**: no yield, a conventional fire at the cell (the
    existing `torp` blast, 30 m, is the right order);
  - a torp that arms (1-2 km out) and then turns back or is spoofed toward own ships: that is the real hazard, and the reason
    the guided phase should be observable and abortable (section 3.6, `SELF-DESTRUCT` = inert);
  - a **hot** fault at the launcher (premature yield at 100 m): a Brand costs the Exeter its aft/fore shield plus about a
    third of its structure; an Anvil destroys it. I do **not** model random hot faults by default (unfair to the player);
    if the owner wants a nuclear accident it should be a scripted mission event [A].
  - the vault (`mag` component) being destroyed: warheads are lost from stock, no yield (one-point-safe assumption [M]);
    the conventional propellant and a few thousand points of explosion are the collateral. This is the "carrier is the
    stock" rule from `docs/ECONOMY.md` 389.

---

## 3. Delivery: torpedoes, fuzes, point defence, countermeasures

### 3.1 Torpedo stats (new `WEAPONS` entries; `nk1` is the current `nuke` with changes)
| Field | `nk1` SPARK | `nk2` BRAND | `nk3` ANVIL | existing `torp` Hammer (for scale) |
|---|---|---|---|---|
| v0 / vmax / acc | 40 / 300 / 90 | 40 / 300 / 90 | 30 / 300 / 70 | 40 / 260 / 80 |
| turn (rad/s) | 1.2 | 1.0 | 0.7 | 0.9 |
| burn / life (s) | 14 / 20 | 14 / 20 | 18 / 24 | 16 / 22 |
| range (lock) | 2200 | 2200 | 2600 | 2000 |
| hp (hits of `sting` 1.5) | 6 (4) | 8 (6) | 12 (8) | 7 |
| lockTime / lockCone | 2.0 / 0.45 | 2.0 / 0.45 | 2.5 / 0.45 | 1.8 / 0.45 |
| flareS / chaffS | 0.2 / 0.2 | 0.15 / 0.15 | 0.1 / 0.1 | 0.15 / 0.15 |
| arming distance | 400 m | 1000 m | 2000 m | n/a |
| warhead ordnance cost | 5 pts | 5 pts | too big for a pylon | 4 pts |

Flight arithmetic [C]: accelerating from 40 to 300 at 90 m/s2 takes 2.9 s and covers about 490 m; a Brand therefore needs
about 7.9 sim-s (21 s on the clock) to cross 2 km, and arms at the 3.6 sim-s mark. The existing `torp` at the same range
takes similar time. The heavy hp values are an assumption for a hardened casing; they matter more than any other number
in this file for PD (section 5).

### 3.2 Fuze modes
Set before launch, changeable until arming completes, then locked (the weapons specialist in the heavy fighter, or the pilot
in a Kestrel):
1. **IMPACT:** detonates on first hull contact (any team, once armed).
2. **PROX d:** `d` selectable 25 / 50 / 100 / 150 / 250 / 400 m of **surface distance** (change the code so both fuze and
   `nukeAt` use one constant, 0.62 R, to remove the 0.55/0.62 mismatch of section 1). Hostile ships only. This is the main
   mode against capitals; against fighter clusters use 250-400.
3. **TIMED t:** detonates `t` seconds after arming (2-30 s) at wherever it is; the mode for clusters that the seeker cannot
   hold, and for a pure blind-the-PD flash. Does not need a lock.
Default: PROX 100. A fuze set larger than the lethal radius of the user's own formation triggers a HUD warning
(section 4.6). A fuze setting is a tactical dial on top of a single weapon, so no additional stocks.

### 3.3 Point-defence interaction (rules)
- **Hard kill** (hp reaches 0): before arming, no yield; after arming, `P(inert) = 0.85`, otherwise a *fizzle* (1 % yield,
  burst at the point) [A]. The current "kill = full yield" is replaced. Rationale: one-point safety [M]; the 15 % fizzle
  keeps FROGG PD from being perfectly safe and gives the attacker a sliver of value from every torpedo launched.
- **Soft kill:** a hit that does not kill but takes the torp below 50 % hp has a 30 % chance to break the seeker (target
  null, ballistic path, fuze still live). Recommended because the code already has a "lose target" state (`m.target = null`).
- **Neutron fratricide** (a nearby burst irradiating a torp) is not modelled; out of scope.
- PD bolts of **both** teams' own weapons ignore own missiles (existing); enemy bolts hit any hostile missile (existing).

### 3.4 Decoys and salvo composition
- **LURE** (`lure`, new): a cheap, tight-formation decoy torp, hp 2 (two sting hits), same signature as the warhead, fired
  in the same cells/pylons; costs 1 ordnance point and no stock. With "nearest first" targeting a lure flying slightly
  ahead of a warhead absorbs two hits' worth of attention. In my model (section 5) 4 lures add roughly +0.2 to +0.8 arrivals
  in the marginal case and nothing when saturated, so they matter near the threshold only.
- **Real Hammer torpedoes** (hp 7) are better decoys than lures but cost 1 S and 4 pts each.
- Flares/chaff on a torp: not carried; the seeker `flareS` fields apply to the **enemy** countermeasures only (FROGGs have
  none today, so this stays latent).

### 3.5 FROGG counters (what the opposition may do; only item 1 exists today) 
The FROGGs are the anti-AI species: neuro-slaved pilots, with a lore claim of better missiles and a doctrine of numbers.
Counters, in the order I would implement them:
1. **Point-defence kills** (exists): Gulper 4 `sting`; Bullfrog 18 `sting` (brief). See section 5.
2. **Intercept swarm** (new, small): FROGG fighters treat an incoming nuclear torp as priority-2 target inside 900 m (their
   `flaser`, 3.5 dmg 950 m, kills a Brand in 3 pulses, 0.3 s). Today they only hit torpedoes incidentally. This is the main
   defence against fighter-carried torps and the reason Kestrel salvos need escorts to kill the screen first.
3. **Seeker spoof (anti-AI)** (phase 2, off in the first build): inside a FROGG jammer bubble (Bullfrog only, radius 1500 m
   [A]) an AUTO-seeker torp has `0.25 / s` to drop its lock and fly ballistic. **Command guidance** (CMD, the launching ship
   or heavy-fighter specialist steers the torp) is immune to seeker spoof but dies with the controller: if the controller
   is dead, EMP-upset or **flash-blind** for longer than 1 s the torp reverts to ballistic. This links the blind timer to
   the user's own salvo: the flash that blinds the enemy PD also blinds your own command link. It makes AUTO versus CMD a
   real choice, but it needs an owner decision first because it makes the jamming rules (deferred in FLEET_LOGIC.md 9a) real.
4. **Early detonation / "shield pre-detonation":** the brief lists it; I do **not** recommend it as default. Shields are a
   pool with no geometry, so there is no shell for a fuze to trip on; inventing one for FROGGs only is a rules exception.
   Alternative that fits the lore without geometry: FROGG **flak spitters** (a fighter acid glob that detonates the *fuze*,
   not the warhead, in PROX mode within 15 m: the torp reverts to inert). Left as an open question.
5. **Dispersal:** FROGG fighters spread out when a Hammer or nuke torp is launched (AI rule: increase pairwise separation
   to above the Spark lethal radius if a nuclear release has been detected). Makes the Spark less efficient; cheap to do.
6. **Dodge:** none (torps are fast, Bullfrog is 600 m; a corvette-size Gulper moves at 34 m/s).

### 3.6 Standoff burst against fighter clusters
Spark, PROX 250-400 or TIMED. A FROGG fighter dies from dose to 465 m (shield up) or 658 m (shield down) [C]. For a swarm
Gaussian with per-axis sigma `s` around its centre, burst 250 m from the centre, expected fraction killed [C, my Monte Carlo
of positions only]:

| Swarm sigma | Shield up (R 465 m) | Shield down (R 658 m) |
|---|---|---|
| 100 m | 97 % | 100 % |
| 200 m | 68 % | 94 % |
| 300 m | 41 % | 73 % |
| 500 m | 15 % | 34 % |

A realistic wave spawns 8-14 FROGG fighters (`docs/OPEN_QUESTIONS.md` 8); their real sigma is not measured (a test is
listed in section 7). If sigma is 200 m a Spark kills 5-9 fighters, the most kills per warhead of anything here and the
least strategic value. **Mitigation** (the "elixir problem", `docs/ECONOMY.md` O3): release authority refuses a Spark unless
at least 5 hostile fighters are within 400 m of the aim point or a corvette/capital is present, and at most 4 of the 20
are Sparks. The player's own fighters need to be 600 m+ clear, which in practice means ordering the wing away first
("CLEAR AREA", section 4.5).

---

## 4. Carriage, arming, release, stock

### 4.1 Kestrel (torpedo hardpoint)
Today a Kestrel has `stores: { ir: 4, rf: 2, torp: 1, flare: 24 }` and one visible pylon under the right wing
(`30_ships_human.js`, the geometry `seg([0.6,-0.42,-1.4],[0.6,-0.45,-4.4],...)`); there is no explicit hardpoint list [V-code].
Proposal, ordnance budget in points (a derived rule, not a physical model):

| Item | Points |
|---|---|
| SW-9 Swift (IR) | 1 |
| LN-3 Lance (RF) | 1.5 |
| HM-1 Hammer torp | 4 |
| Nuclear torp (Spark or Brand) | 5 |
| Lure | 1 |
| Budget | 11 (= today's 4 IR + 2 RF + 1 torp = 4 + 3 + 4) |

- **One heavy station** (`hardpoints: [{ id: 'hvy', kind: 'heavy', max: 1, pts: 5 }, ...]`). A Kestrel can hold **at most one
  nuclear torp**. It displaces the Hammer and one Swift: the nuclear load-out is **1 NK + 3 IR + 2 RF** = 5 + 3 + 3 = 11.
  A heavy fighter (crew of 2, LORE.md) gets two heavy stations. Anvil does not fit a Kestrel (cells only).
- **Performance penalty** while the warhead is aboard (heavy casing, PAL, shielding) [A]: max speed -3 %, turn -5 %. Cosmetic
  value: the pylon visibly carries the nuclear torp (grey with a yellow band) and a "SEALED" tag on the HUD. Hardpoints
  must be shown on model views and blueprints per `AGENTS.md` (ship model rules); add the heavy pylon to `mounts` or a new
  `hardpoints` array so `tools/gen` picks it up.
- **Wing totals:** a flight of 4 Kestrels can carry 4 Brands. Wings are not given nukes by default (4.5).

### 4.2 Exeter launch: cells, salvo, reload, magazine
The Exeter has **no** missile launchers today: `mounts` are two railguns, `turrets` are 4 lasers and 3 PD, `stores { drone: 48 }`
[V-code]. Proposal (placeholders; geometry deliberately omitted until the model gets subsystem positions per AGENTS.md):

| Item | Proposal |
|---|---|
| Launchers | **6 vertical cells** dorsal/ventral (cold launch, any direction), `role: 'launcher'`. A 0.08 rad/s turn rate makes tube launch only viable for targets nearly dead ahead, so VLS is chosen |
| Ready rounds | 6 (one per cell) |
| Salvo size | 1-6 chosen in the comms menu; **cells fire together** (section 5 shows a tight salvo is the only kind that threatens an 18-turret ship; a 1-second stagger gives the PD time to take them one at a time) |
| Reload | 45 sim-s per cell (2 autoloader lines, so 2 cells in parallel; a full 6 re-cycle is 135 s), drawn from the vault |
| Magazine | **vault** component `mag`, hp 600, armoured, holds the nuclear stock (`nk1`, `nk2`, `nk3`) plus 24 HM-1 for the cells [A]; shared with the Kestrel loadouts at briefing time |
| Detonation of the vault | no yield (one-point safe [M]), stock lost, 600-ish conventional blast; cf. section 2.6 |
| Missile AI | the Exeter is `ai: capital` with `hold`; the cells fire only by the player's comms command (4.5) |

### 4.3 Arming procedure and rules (state machine)
`SAFE` (aboard / in cell) -> `AUTHORISED` (release granted, section 4.4) -> `ARMED` (pilot ARM hold, 1.5 s) -> launched,
**inert until `arm distance`** (400 / 1000 / 2000 m) **and** 2 s after launch -> `LIVE`.

- Without `AUTHORISED`, the fire key on a nuclear missile logs `NK: NO RELEASE` and does nothing. Without `ARMED`:
  `NK SAFE`.
- Before `LIVE`: a hit on anything, or a hard kill, is an inert kinetic event (no yield). After `LIVE`: section 3.3.
- **Self-destruct (inert):** the player can destroy any of their own LIVE torpedoes (SCUTTLE, 2-key hold); no yield.
  This is the abort for a mis-aimed or spoofed warhead. It is deliberately cheap: owner wants a risk of using nukes, not a
  trap.
- **Minimum launch geometry:** the lock/launch is refused if the target is inside `arm distance + 200 m`. A Brand cannot be
  fired at a target inside 1.2 km.
- **Interlock:** if the predicted burst point (target position at flight time, minus the fuze distance) puts a crewed
  friendly ship inside its own keep-clear radius (section 2.6), the launch is blocked unless the pilot **holds fire for 3 s**
  (SAFETY OVERRIDE). An override is written to the debrief and `PLOG` (`58_playlog.js`). The player decides; the game
  informs. No override for AI.
- There is no random failure on launch (section 2.6).

### 4.4 Release authority
Because stock is non-replaceable (ECONOMY.md: "nuclear warheads rare", scored at 30 S, `N` integer, never produced), the
mission layer holds the keys.
- `M.nukeAuth`: `'none' | 'conditional' | 'free'` per mission (default `'conditional'`; Reedbed-type training missions `'none'`).
  `M.nukeBudget`: warheads the briefing allows aloft (default 4).
- **Conditional** release is requested in the comms menu under `CAPITAL / CONTROL` -> **REQUEST NUCLEAR RELEASE**
  (`78_coms.js`, `comsRoot`, `capMenu`). The player must have a hostile target selected. CONTROL replies after 4-6 sim-s with
  one of:
  - `GRANTED: <class>, <n> warheads, target <name>, valid 90 s` (the grant is for the designated target and class);
  - `DENIED: no capital or cluster contact` / `DENIED: friendlies inside the blast zone` / `DENIED: budget spent` /
    `DENIED: Spark not authorised below 5 contacts`.
  Rules, not random: granted iff the target is a corvette/capital, or (Spark only) a cluster of 5+ within 400 m;
  no crewed friendly inside the keep-clear radius of the aim point; budget remains; the mission's `nukeAuth` is not `'none'`.
  `free` skips the request (used for scripted nuclear missions).
- **Arming step ("code"):** the briefing shows a 3-digit authenticator; the hold-ARM action is the arming step. A typed
  code on a touch device is hostile UI for a flavour benefit, so I recommend no typed code (open question 6).
- **Exeter strike** is a different menu: `CAPITAL MENU` (Exeter) -> **NUCLEAR STRIKE** -> class (Spark/Brand/Anvil) ->
  salvo (1-6) -> fuze (IMPACT/PROX d) -> **CONFIRM** within 10 sim-s or it lapses. The Exeter replies with an ETA and
  a "launching" line, and refuses on the same rules plus "no cells ready". The command is the player's (the commander is the
  Exeter's user in the fiction); the Exeter's own captain AI never initiates.
- Expiry: a grant lapses after 90 sim-s or when the designated target dies.

### 4.5 What AI wingmen may do
- **Never launch without an explicit order.** Rule: no AI ship has an `nk*` id in its `wantIds` unless `ai.order.type === 'nuke'`
  and release is granted.
- Wingmen carry no nuclear torps unless the briefing assigns them (a loadout allocation in the setup menu, section 4.6).
- New orders in `78_coms.js` (wing menu): **FIRE NUCLEAR AT MY TARGET** (only for wingmen who hold one, requires release),
  **CLEAR AREA** (wing flies to beyond the keep-clear radius of a marked point, 1.25 x the class lethal dose radius, replies
  when clear) and **HOLD NUCLEAR** (clears the `nuke` order). A wingman carrying a warhead answers `Weapon is cold, no
  release` if asked before release, in character (HAWK dry, SPARROW nervous).
- A wingman with a `nuke` order fires once, then reverts. Drones never carry them.
- FROGG AI never uses nuclear weapons (LORE.md: not assigned to either side; open question 9).

### 4.6 HUD, briefing and loadout
- **Loadout (76_menu.js, line 209 region):** a new row "NUCLEAR (sealed)" in the setup, 0..budget, taken from the campaign
  stock `nukes = {nk1, nk2, nk3}`. It is hidden if the mission has `nukeAuth: 'none'`. Setting any value shows the line
  `RELEASE: CONDITIONAL, BUDGET 4` in the briefing text.
- **Briefing:** a single line under ordnance: `NK-2 BRAND (1 kT) x1  [SEALED]  KEEP-CLEAR 1.3 km` and, if allocated to the
  Exeter, `EXETER VAULT: SPARK 4 / BRAND 12 / ANVIL 4 (stock) -> mission allocation 6`.
- **HUD (90_hud.js `updateRadarSide`, `tag` map):** chip tags `SPARK`, `BRAND`, `ANVIL`, and a second line `FUZE PROX 100`,
  `SAFE / ARMED / AUTH`. A ring on the radar at the keep-clear radius around the planned burst; amber when a friendly is
  inside, red `FRIENDLIES IN BLAST ZONE` when the interlock blocks. Chips for `EMP`, `BLIND` with timer when the player's
  own timers run.
- **Debrief:** `Warheads expended: 3 (stock 20 -> 17)`, `inert/dud 1`, `friendlies hit by radiation: 0`.
- **Stock:** campaign variable `nukes`, decremented on *launch* (a shot-down warhead is spent) and on vault loss, never
  incremented except by scripted rewards (ECONOMY.md 236). **Starting stock 20 = 4 Spark + 12 Brand + 4 Anvil** [A]. In-mission
  rearm: **none** (a Kestrel that returns with an unfired warhead hands it back at the end of the sortie; docking does not
  repair, per AGENTS.md).

---

## 5. Balance arithmetic (all unsimulated)

### 5.1 Expected PD intercept rate (my abstraction of the turret code) [C]
Assumptions: torps fly straight at 300 m/s, hit sphere 1.6 m; each `sting` turret fires 11.1 rounds/s once a missile is inside
600 m of it, picks the nearest missile to itself, re-targets every 0.2-0.3 s after the previous target dies; hit
probability per round `min(1, (1.6 / (0.012 d))^2)` (uniform disc dispersion, perfect lead, no evasion, no turret magazine);
18 turrets spread uniformly over the hull length with +/-60 m height; approach either **head-on** along the long axis or
**broadside** at mid-length; "arrival" means the torp reaches the burst distance alive (100 m for Brand hp 8, 150 m for
Anvil hp 12). 150-200 trials per cell; numbers are means.

| Salvo (all launched together, 18 turrets, no lures) | Brand head-on: mean arrive / P(>=1) | Brand broadside | Anvil head-on: mean / P(>=1) | Anvil broadside |
|---|---|---|---|---|
| 1 | 0.0 / 0.00 | 0.0 / 0.00 | 0.0 / 0.00 | 0.0 / 0.00 |
| 2 | 0.0 / 0.00 | 0.0 / 0.00 | 0.0 / 0.03 | 0.0 / 0.00 |
| 4 | 0.1 / 0.05 | 0.0 / 0.00 | 1.0 / 0.72-0.76 | 0.0 / 0.00 |
| 6 | 0.9 / 0.59 | 0.0 / 0.00 | 3.0 / 1.00 | 0.1 / 0.12 |
| 8 | 2.7 / 0.97 | 0.0 / 0.00 | 5.0 / 1.00 | 1.6 / 0.85-0.88 |
| 12 | 6.7 / 1.00 | 1.1 / 0.65 | 9.0 / 1.00 | 5.5 / 1.00 |

- With **9 turrets alive** (half silenced) the thresholds fall by about 3 torps (Brand 6 head-on arrives 3.3; broadside 8 arrives 2.5).
- Four lures added to the salvo: marginal gain only near threshold (Brand head-on 4 torps: 0.1 -> 0.5 arrivals).
- A **1 s stagger** between launches (300 m of trail): head-on Brand salvos of 4, 8 and 12 all arrived **0.0**. The 18-turret PD
  is a serial machine with a cliff, and a staggered salvo is always inside its kill rate.
- **Gulper (4 `sting`):** a lone Brand head-on arrives 0.29 of the time, broadside 0; 2 torps head-on 82 % at least one;
  3 head-on 97 %; broadside needs about 4-6 (4 torps: 92 % at least one, 6: 100 %).
- Per-torp kill range: single turret kills a hp-5 torp at about 130 m on average; 9 turrets at about 430 m; 18 at about
  500 m [C, from the hit integral]. So **unsaturated, the PD kills a torp 400-500 m before a burst that needs 50-150 m**.
- The curve is a **cliff**, not a slope, because the abstraction lets every turret engage the nearest missile with no
  loss. The real code has the same nearest-first rule but different geometry; expect the same shape with different thresholds.
  A salvo must be sized with margin, which is the intended expensive-and-risky property.

### 5.2 Warheads to kill a Bullfrog (PD intact, tight salvo)
Warheads spent = salvo size (every torp launched is spent). Kill condition from 2.3 at the stated burst distance.
- **Anvil head-on, salvo 4:** 72-76 % that at least one reaches 150 m (and one Anvil at <=153 m kills alone). Cost: 4 of 4 Anvils for
  roughly a 3-in-4 chance. A larger Anvil salvo is impossible (stock 4). **Broadside: 0 %** with 4 Anvils (6 would give 12 %).
- **Brand head-on, salvo 12 at PROX 100:** 94 % that 5 or more arrive (5 needed at 100 m); salvo 10: 58 %; salvo 8: 4 %. Cost:
  10-12 of 12 Brands, i.e. most of the stock for one hull. **Broadside: 1 % at 12**, 9 % at 14.
- **Blind-the-PD combination:** one Spark TIMED so that it bursts about 800 m off the Bullfrog's bow while the main salvo
  is 900-1200 m out (flight time 3-4 s). The Spark blinds the PD for about 6 s at 1 km (cap 8). PD blind: all torps arrive;
  PROX 50 means 2 Brands needed (2.3), salvo of 4 Brands (4 + the Spark = **5 warheads**, 25 % of stock), with the 4th as margin.
  Failure mode: the Bullfrog's own fighters (intercept swarm, 3.5.2) still shoot; its jammer if enabled; the Spark may
  be shot (a hard kill is inert, so the flash fails) - a decoy-led Spark is reasonable.
- **Conventional first:** the PD turret components are `EXPOSED` with `hp ~90` on the Exeter-scale ship; silencing half of
  18 turrets with railguns/lasers lowers the salvo from 12 to about 8-9. That makes the **cheapest** nuclear Bullfrog kill
  also the one that needs the most conventional work first, which matches the owner intent.
- So: a Bullfrog costs **4-5 warheads best case** (blind + 4 Brands, or 4 Anvils head-on with 3-in-4 odds) and **12-17 worst
  case** (naive Brand salvo plus a retry). Out of 20, **a campaign contains about two to four Bullfrog-class kills**.
  That fits "deliberate, expensive, risky". It also invites the elixir problem if there are fewer than 3 such targets
  in the campaign (ECONOMY.md O3): then spending is the player's only way to use the stock and nothing else is lost.

### 5.3 Gulper
- Hull: Brand one-shot at <=89 m; with PROX 50 and a 2-3 torp tight head-on salvo (82-97 % to arrive) the expected spend is
  2-3 warheads. Broadside needs 4-6. A Hammer-based answer (5 torps at 1 S each) is **cheaper and risk-free**; the
  nuke is the **wrong tool** against a corvette and the doc says so plainly.
- Crew: a Spark at PROX 150-200 m puts 232 m of FROGG-crew lethal radius on the Gulper (15 Gy, CPF 8): 2 torps head-on
  (83 % at least one arrives, hp 6) disables it for 2 warheads without destroying it. Niche, but it is the one place
  where the Spark is a hull-sparing, crew-killing weapon. **Unverified:** the `crewFrac` derelict state does not exist.

### 5.4 Fighter wing
- One Spark at a swarm centre with sigma 200 m, shields up: 68 % of 12 = 8 killed at 250 m burst; 5-9 in practice (3.6).
- Brand: lethal radius 1.0-1.5 km, 10-12 fighters in a 2 km box die almost surely; own fighters within 1.3 km also die. Not
  recommended: nothing a Spark cannot do at a tenth of the yield, with a much smaller own-fleet hazard.
- Anvil vs fighters: radius 3.3-4.7 km, kills everything in the arena including the player unless the wing has left by 4.1 km;
  an arena clearing tool, not a precision one.
- **Spend rates:** one Spark per 5-9 fighters is the most efficient use of stock and the least strategic; hence the gating
  rules (3.6) and the 4-in-20 cap.

### 5.5 Intent check
- The player has to: request release, arm, hold the ARM key, pick a salvo size, accept that a salvo of 4 Brand may arrive 0.1
  warheads, and coordinate fighters and Exeter on one clock to get a *tight* salvo. Each failure spends warheads. All of
  that is a deliberate cost; none of it is random.
- What is unmeasured: how the PD behaves against real FROGG hulls moving and rotating, turret magazines, real jamming, and
  how frequently a wave presents clusters. Do not read the cliff positions above as results.

---

## 6. Implementation list (not implemented; file names are in `src/`)

1. **`60_weapons.js`**
   - Replace `WEAPONS.nuke` with `nk1`, `nk2`, `nk3`, `lure` (fields in 3.1, plus `xf`, `dcoef`, `arm`, `nuclear: true`); keep
     `MSL_ORDER` and `?nuke=` working by mapping `nuke` -> `nk1`.
   - `NUKE`: add `CPF`, `EMPH`, `empF: 20`, `crewDead: {human: 30, frogg: 15}`, `blindCap: 8`, `surf: 0.62`; remove the
     0.55/0.62 mismatch in `updateMissiles` proximity.
   - `nukeAt(pos, Y, owner, w)`: take `xf`, `dcoef` from the warhead; per-class `CPF` in the dose; facing-based shield cut;
     `crewFrac` for non-fighters instead of `killShip`; add EMP and the corrected blind (LOS test); return a report to
     `nukeLog` with `fluence`, `dose`, `emp`, `blind` per ship for tests.
   - `launchMissile`: refuse nuclear ids unless `authorised && armed`; set `m.trav`, `m.live=false`; `m.fuzeMode`
     (`impact|prox|timed`), `m.fuze`, `m.tmr`. `updateMissiles`: arm after `arm` metres and 2 s; apply modes; armed impact on
     a friendly hull detonates; unarmed hits are inert; implement scuttle.
   - `killMissile`: hard kill rule 3.3 (inert 85 % / fizzle 15 % when live; inert when not live); soft-kill seeker break in
     `updateBolts`.
   - `updateTurrets`: gate on `compFactor(s,'turret')` and `empUntil`; add fratricide-free targeting only if needed.
2. **`50_state.js`**: `compFactor` honours `empUntil` for `radar`, `shield`, `turret`; new `ship.empUntil`, `ship.crewFrac`.
3. **`65_combat.js`**: nothing structural (`DMGX.nuke`, `ARMOR.prof.nuke` exist); add the capital derelict path for `crewFrac`.
4. **`30_ships_human.js`**: Kestrel `hardpoints: [{id:'hvy', kind:'heavy', pos:[0.6,-0.45,-4.4], max:1, pts:5}, ...]` and `ord: { budget: 11 }`;
   Exeter: `launchers` (6 cells, positions TBD), `mag` component (role `'mag'`, hp 600), `stores` for `nk1/nk2/nk3` and HM-1.
   Heavy fighter (not yet defined) gets two heavy stations.
5. **`55_ships.js`**: extend the free-flight flag: `?free&nk=1|2|3&nuke=N` (stock), `&nkauth` (grants release), `&nkarm` (pre-arm)
   for headless tests; map old `?nuke=N` to `nk1`.
6. **`70_ai.js`**: never put `nk*` in `wantIds` unless `ai.order.type === 'nuke'`; add the `nuke` order handler; add
   FROGG intercept swarm priority (3.5.2); dispersal on detected release (3.5.5); capital-class PD keeps the nearest-first rule.
7. **`78_coms.js`**: `REQUEST NUCLEAR RELEASE` (`comsRoot` capital/control list), `NUCLEAR STRIKE` (`capMenu` for the Exeter), wing entries
   `FIRE NUCLEAR AT MY TARGET`, `CLEAR AREA`, `HOLD NUCLEAR`; add voice lines to `VOICE` for `HAWK`/`SPARROW`/`GENERIC`; ensure
   `comsSay` replies with grant/deny reasons from rules.
8. **`80_input.js` / `85_update.js`**: ARM hold (keyboard; touch button next to the fire/missile buttons), FUZE cycle, SCUTTLE hold,
   EMP stun on the player (HUD static, lock cleared).
9. **`90_hud.js`**: `tag` map, FUZE/SAFE/ARMED/AUTH chips, keep-clear ring, interlock warnings, EMP/BLIND timers.
10. **`76_menu.js`**: nuclear allocation row in setup; briefing text; line-209 `cfg.missiles` branch must keep `nk*` at 0 unless
    allocated and authorised.
11. **`75_mission.js`**: `M.nukeAuth`, `M.nukeBudget`, `onNukeRelease(owner, wid, tgt)` hook for debrief; campaign `nukes` stock.
12. **`58_playlog.js`** counters (`nk.launch`, `nk.live`, `nk.inert`, `nk.pd_kill`, `nk.override`); **`95_main.js`**: export new
    constants for headless tests.
13. **Docs when built**: `docs/ECONOMY.md` (stock composition and per-class S scores), `docs/SHIP_MANUAL.md`/`docs/SHIPS.md`
    (hardpoints and cells, with positions), `docs/CAPITAL_COMBAT.md` 2.x pointer, `docs/BULLFROG.md` cross-links, README flags;
    the model/blueprint rule in `AGENTS.md` (every subsystem position shown) covers the cells, vault and heavy pylon.

## 7. Tests (to be written in `tools/tests/`, headless Playwright, one page at a time)
- `nuke_t.py` (new): (a) fluence/dose/EMP/blind table: place the burst at known distances from each ship class (spawn ships,
  call `nukeAt`, read `nukeLog`) and compare with sections 2.2-2.5; (b) arming: launch, kill the torp at 300 m and at 1100 m and
  assert inert, then 1100 m with `live` and assert 85/15 over 200 runs; (c) friendly fire: wingman inside keep-clear dies,
  launcher dose, Exeter crewFrac stays below 1; (d) release/arm interlocks: fire without `AUTH`/`ARMED` does nothing;
  (e) AI: no wingman ever launches in a 5-minute free fight with `nk` loaded; with an order, exactly one.
- Extend `pd_t.py`: Gulper and a stand-in 18-sting target vs 1, 2, 4, 6, 8, 12 torps, head-on and broadside, tight and staggered;
  compare with 5.1 to calibrate; record turret magazine if added.
- `msl_t.py` / `coms_t.py`: new comms entries present only when conditions hold; touch layout unchanged on iPad.
- Wave-cluster measurement: sample pairwise distances of FROGG waves at 4, 8 and 12 s after the wave spawn to get the real sigma of 3.6.
- Regression: `armor_t.py` (nuke prof unchanged), `laser_t.py` (blind change does not affect lasers), mission flow bot with `nukeAuth: 'none'`.

## 8. Open questions (my default is what I would build if you do not decide)
1. **Hull hardening (`NUKE.kill`) and CPF.** No open source; values are placeholders (section 2.4). Default: as above.
2. **Is a PD kill of a live warhead inert or a detonation?** Default: inert 85 %, fizzle 15 % (section 3.3). The first cut
   does a full detonation; this changes the design a lot.
3. **Crew dose kills a frigate/capital?** Default: no, derelict via `crewFrac`; fighters still die.
4. **Starting split of the 20.** Default 4 Spark / 12 Brand / 4 Anvil. If you want Anvils to be rarer or absent, Bullfrog
   kills (5.2) become much more expensive.
5. **Cells on the Exeter and who fires them.** Default: 6 VLS cells, fired only by the player's comms order; Exeter never
   fires on its own.
6. **Arming step:** hold ARM only, or also a typed code? Default: hold only.
7. **Seeker spoof / command guidance (3.5.3).** Default: off in the first build; it forces the deferred jamming rules.
8. **FROGG "shield pre-detonation" (3.5.4).** Default: not implemented; replace with flak spitters if you want an early-detonation
   counter.
9. **Do FROGGs ever use nuclear weapons, or humans only?** Default: humans only (LORE.md: unassigned).
10. **Blind cap 8 s and LOS rule.** Default as in 2.5; the original 12 s cap is 32 s of real time.
11. **Random launch faults.** Default: none; use scripted events if you want an accident.
12. **Stock sources in the story** (ECONOMY.md question 9: rare finds, allied transfers or an old stockpile): not decided here.
    It affects whether a destroyed vault can be replaced.
13. **Turret magazines and PD-vs-torp priority** will change section 5 materially; recalibrate after CAPITAL_COMBAT.md section 3 is built.

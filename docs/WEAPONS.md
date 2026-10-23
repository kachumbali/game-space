# Weapons reference: specs, fits, doctrine, red-team analysis

Status: live as of 2026-10-22 (realism pass, magazine rule, gun discipline, MD-9 mag, tactical yield dial all in).
Source of truth: `WEAPONS` in `src/60_weapons.js` + the FROGG block in `src/79_bullfrog.js`; ship fits in
`src/30_ships_human.js` / `src/31_ships_frogg.js`. The tables below were read out of the running build
(`docs/data/weapons.csv` is the CSV export via `tools/tests/csv_t.py`). All rates and durations are sim-seconds
(real time = sim / `SIM_SPEED` 0.375). Internal ids (`spit`, `fang`, `tad`, ...) are historical and stable;
the displayed names are the realistic ones.

## 1. Damage system primer (what the stats mean)

- **Damage types** (`DMGX`, multipliers [shield, structure]): `kin` 0.7 / 1.0, `en` 1.25 / 1.0, `exp` 1.0 / 1.1,
  `nuke` 1.0 / 1.0. Kinetics are poor shield-strippers and good structure-crackers; energy is the reverse.
- **Armour** (never depletes; `docs/ARMOR.md`): redistributes by type - `hard` 0.4x vs energy, `ablative` 1.5x,
  `composite` neutral; plus a per-class size threshold that stops light hits entirely. Big single hits matter.
- **Pierce**: fraction of the hit that bypasses shield and armour and lands on structure (or a component).
- **Beam focus** (`docs/LASERS.md` section 6): a beam does nothing until it has stayed on the same ship for
  `acq` seconds; damage then climbs from 0.25x to `peak` over `ramp`. Dwell time is a real stat.
- **Blast** (`blastAt`): distance falloff, minimum 20% at the rim, 50% to friendlies; the direct target of an
  HE bolt takes its hit separately and is skipped by the splash.
- **Gun classes** (owner rule 2026-10-22): chemical guns (ammo only), mag/rail (a little energy AND ammo -
  projectile plus capacitor), energy only (reactor-fed). **Magazines**: every kinetic weapon carries ammo and
  runs dry - mount pools (`s.ammo`, capacities cached in `s.ammoMax`), per-turret drums (`T.ammo`; a dry turret
  goes dark but keeps tracking), and the MK-90's 100 slugs (`sp.mag`). Energy weapons have no magazine: the
  reactor and the ETS power budget are their feed.

## 1b. Gun classes and faction lean (owner statement 2026-10-22)

Three gun classes, plus ordnance:

| Class | Feed | Weapons |
|---|---|---|
| 1. Chemical guns | ammunition only, no energy draw | MK-20, MK-30 HE, GA-9, DR-2 (human); R-9 (FROGG) |
| 2. Mag / rail | a little energy AND ammo - the projectile plus the capacitor discharge | RG-90 (12 en/shot, 100 rds), MD-9 (30 en, 120 slugs), MD-55 (15 en, 250 rds), MK-90 (800 en, 100 slugs), R-12 (6 en, 60 rds) |
| 3. Energy only | no magazine; the reactor is the feed (ETS WEAPONS speeds it) | LS-2, LS-8, all M- masers, the GX-1 XL |
| 4. Ordnance | missile stores; drones are HUMAN-ONLY (FROGG anti-AI doctrine - "dead silicon" - fields no autonomous machines; their seekers are wetware) | SW-9, LN-3, HM-1, NK-1 (human); SK-1, ST-2 (FROGG); SD-4 drones (human only) |

Faction lean: **FROGG energy-heavy** (masers and wetware ordnance; kinetics few and specialised), **humans
ammo-heavy** (chemical guns and rails carry; energy is support and PD). FROGG pressure never stops because
reactors recharge; human firepower is heavier per engagement but sorties end dry - which is what the Tender
is for. Full lore: `docs/LORE.md` weapon doctrine.

## 2. Human weapons

| Weapon | Kind | Dmg/shot | ROF | Vel | Range | Pierce | Energy | Magazine | Notes |
|---|---|---|---|---|---|---|---|---|---|
| MK-20 CANNON | proj kin | 3 | 11.8/s | 900 | 1620 | - | - | 600/mnt (~51 s) | Kestrel left boom |
| MD-9 MAG DRIVER | proj kin | 26 | 0.56/s | 1600 | 2720 | 25% | 30/shot | 120 slugs (~3.6 min) | Kestrel heavy hitter, class 2: slug plus capacitor - 30 energy of the 100-pt pool per shot, and a small magazine |
| MK-30 HE CANNON | proj kin | 9 + 8 m blast | 4.5/s | 1000 | 2000 | - | - | 500/mnt (~110 s) | splash punishes swarms |
| DR-2 MAG CANNON | proj kin | 3 | 11.8/s | 900 | 1350 | - | - | 300 (~25 s) | Drone |
| GA-9 ROTARY CANNON | proj kin | 2.8 | 25/s | 1100 | 1320 | 15% | - | 900 (36 s) | A-10-style, Halberd grp 2; AI fires it only inside 1300 m |
| RG-90 RAILGUN | proj kin | 70 | 0.42/s | 2000 | 4400 | 60% | 12/shot | 100/mnt (~4 min) | class 2: best kinetic pierce in the game |
| MD-55 MASS DRIVER (L) | proj kin | 60 | 0.45/s | 1800 | 2600 | 40% | 15/shot | 250/turret (~9 min) | class 2; bigOnly, noPD |
| LS-2 TURRET LASER | beam en | 6/pulse | 4/s | - | 1600 | - | 12/pulse | reactor | peak x3 after 0.5 s acq |
| LS-8 TURRET LASER (M) | beam en | 13/pulse | 3.6/s | - | 1800 | - | 26/pulse | reactor | peak x3 |
| PD-30 POINT DEFENCE | proj kin | 1.3 | 13.3/s | 1100 | 900 | - | - | 1500/turret (~110 s) | Phalanx-style drum |

**MK-90 MASS DRIVER (XL)**: 900 kin, 60% pierce, 3200 m instant ray, 5 s charge + 1.5 s lock (heading frozen),
30 s cd, 800 energy/shot, **100 slugs** - a campaign number, not a battle number (50 min of firing at cadence).
HUD warning: `MASS DRIVER CHARGING / LOCK - BREAK`.

## 3. FROGG weapons

**Masers (en, reactor-fed)**

| Mark | Kind | Dmg | ROF | Vel | Range | Energy | Peak | Notes |
|---|---|---|---|---|---|---|---|---|
| M-1 PULSE MASER | beam | 3.5/pulse | 10/s | - | 950 | 9 | x2.2 | fighter capacitor bank |
| M-7 MASER LANCE | beam | 3/pulse | 16.7/s | - | 1500 | 3 | x3 | Gulper bow, continuous |
| M-8 HEAVY MASER (L) | beam | 4.5/pulse | 10/s | - | 1800 | 6 | x3 | Bullfrog's single L turret, bigOnly |
| M-2 MASER | bolt | 7 | 2/s | 330 | 858 | - | - | the FROGG knife; inside PD-30 range |
| M-6 HEAVY MASER | bolt | 24 | 0.8/s | 430 | 1290 | - | - | Spitter main |
| M-6T MASER TURRET (M) | bolt | 24 | 0.8/s | 430 | 1250 | - | - | Bullfrog M turrets, noPD |
| R-4 AUTOCANNON TURRET (S) | bolt en | 1.5 | 11.1/s | 900 | 800 | - | - | drum 800; naming flagged in section 7 |
| R-5 PD TURRET (S) | bolt en | 1.2 | 14.3/s | 1150 | 750 | - | - | drum 1000, pdOnly |
| GX-1 CHARGED LANCE (XL) | ray en | 800 | 6 s charge + 30 s cd | - | 3200 | 800/shot | 20% pierce | energy weapon - the reactor is its magazine |

**Kinetics (magazine-fed)**

| Mark | Dmg | ROF | Vel | Range | Pierce | Magazine | Notes |
|---|---|---|---|---|---|---|---|
| R-9 AUTOCANNON | 4.5 kin | 6.2/s | 900 | 1800 | - | 400/mnt (~64 s) | half the MK-20's volume, 1.5x the bite |
| R-12 PENETRATOR DRIVER | 34 kin | 0.38/s | 1400 | 3080 | 45% | 6/shot | 60/mnt | class 2 AP rod; flags under review (section 7) |

## 4. Ordnance (all ships, stores-limited)

| Weapon | Dmg | Blast | Range | HP | Seeker | Decoys | Notes |
|---|---|---|---|---|---|---|---|
| SW-9 SWIFT | 26 | 10 | 1700 | 1 | IR | flare 0.7 | Kestrel x4 |
| LN-3 LANCE | 34 | 11 | 3400 | 1 | radar | chaff 0.65 | Kestrel x2 |
| HM-1 HAMMER | 170 | 30 | 2000 | 7 | IR | mixed | Kestrel x1 |
| NK-1 TAC WARHEAD | fluence model | - | 2200 | 5 | IR | mixed | standard load 0.5 kT; dial 0.1-10 kT (`?nukeKt=`); strategic 100 kT-10 MT is lore-only (`docs/NUKES.md`) |
| SK-1 IR MISSILE | 31.2 (x1.3 FROGG bonus) | 9 | 2200 | 1 | IR (wetware) | flare 0.3 | all FROGG fighters |
| ST-2 TORPEDO | 195 (x1.3) | 28 | 2600 | 8 | IR (wetware) | 0.05 flare | Toad 3, Gulper 6, Bullfrog 16 |

## 5. Fits and doctrine

| Ship | Fixed mounts | Turrets | Stores |
|---|---|---|---|
| Kestrel | 1x MK-20, 1x MD-9 mag (grp 1); 2x MK-30 HE (grp 2) | - | 4 SW-9, 2 LN-3, 1 HM-1 |
| Halberd | 2x RG-90 (grp 1); 1x GA-9 rotary (grp 2) | 2x LS-2, 4x PD-30 | - |
| Exeter | 2x RG-90 (grp 1); MK-90 XL, 100 slugs (grp 9, store) | 4x LS-2, 8x LS-8, 4x MD-55, 3x PD-30 | 48 drones |
| Tender | unarmed - rearm service within 600 m | - | - |
| Drone | 1x DR-2 | - | - |
| Darter | 2x R-9 | - | 2 SK-1 |
| Leaper | 2x M-1, 2x M-2 | - | 2 SK-1 |
| Spitter | 1x M-6, 2x R-9 | - | 4 SK-1 |
| Toad | 2x R-9, torpedo rack | - | 3 ST-2 |
| Reaver | 2x M-1, 2x R-9, 2x M-2 | - | 6 SK-1 |
| Gulper | 2x R-12 (grp 1); 2x M-7 (grp 2) | 4x R-4 | 6 ST-2 |
| Bullfrog | GX-1 XL; 16 ST-2 tubes | 1x M-8, 6x M-6T, 10x R-4, 8x R-5 | 36-fighter hangar |
| Hive Carrier | unarmed (catalogue) | - | - |

**Human doctrine**: outrange and out-punch - rails and mass drivers strip shields poorly but pierce deeply;
lasers focus-ramp and starve on the energy budget (the ETS is a real tactical layer); HE splash answers the
swarm; PD is qualitatively superior (PD-30 vs R-5) but drum-limited. Magazines bind: sorties end dry, and the
Tender is the strategic hull because rearm - not repair - is the only undo.

**FROGG doctrine**: numbers and pressure. Masers never run dry, so FROGG pressure never stops; kinetics hit
harder per round but carry small magazines; torpedoes are the capital answer (ST-2 at 8 hp survives most PD);
the swarm (Darter through Bullfrog hangar) forces the HE-splash trade. Wetware seekers track harder and decoy
worse than human equivalents.

**Gun discipline** (owner rule 2026-10-22): AI ammo weapons fire in bursts that shorten as the pool empties -
free above 60%, 0.7 s on / 0.6 s off to 30%, 0.35 s on / 1.2 s off to 5%, and at 5% the ship goes to
gun-empty status and stops gun fire (missiles and energy weapons unaffected). The player sees the same
threshold as a `bad`-flagged HUD line and a one-time `GUNS EMPTY` callout.

## 6. Evidence-quality note

Every even-point balance claim ("~10 FROGGs vs 4 Kestrels") rests on 3-run duel cells; the noise band is at
least +-2 fighters. Treat all balance numbers in `docs/BALANCE_TESTS.md` as bands, not points. The XL's 100
slugs never bind inside a mission (one slug per 30 s); it is a campaign constraint.

## 7. Red-team findings (2026-10-22 pass)

Fixed by the current commit set: the Kestrel's dead ETS WEAPONS channel (the MD-9 now feeds it); AI gun
discipline (was: dry ships fought on as if armed); no AI ammo awareness at all (was: free fire to empty).

Open, in priority order:

1. **Torpedo interception is the hole in the defence.** ST-2 at 8 hp: 7 launched, 7 hit, 0 intercepted in the
   acceptance engagement. A Bullfrog's 16 torpedoes exceed the Exeter's entire HP pool with perfect PD, and
   the magazine rule means saturation can also exhaust the PD drums first. Needs either tougher PD, an
   interceptor missile, or dedicated escort doctrine.
2. **The AI does not know the Tender matters.** `pickTarget` scores the resupply hull like any other; a human
   will kill it first, the AI will ignore it. Combined with the FROGG having no tender, long engagements are
   attrition-asymmetric.
3. **M-8 heavy maser is the most energy-efficient gun in the game** (2.25 dmg/energy at peak vs LS-2's 1.5):
   a sustained 135 dps peak from 60 energy/s on a 320-regen capital. Consider 10-12 energy/pulse or peak x2.5.
4. **R-12 has neither bigOnly nor noPD** (its human counterpart MD-55 has both): the AP rod doubles as a 3 km
   anti-fighter sniper, one-shotting shields. And a "penetrator" pierces less (45%) than the generic RG-90
   (60%). Either intended (humans own kinetic tech) or worth flags.
5. **R-4/R-5 are named autocannons and fire `en` bolts** - leftovers of the biological pass. Either retune to
   kin or rename to maser Gatlings.
6. **GX-1 vs hard armour is a landmine**: hard takes 0.4x from energy; the first human ship given hard armour
   neuters the FROGG's only capital-killer (20% pierce, kinetic XL pierces 60%). Decide whether the FROGG get
   an AP-rod XL.
7. **HE splash + no AI blast awareness**: friendly fire at 50% in 8 m furballs, and `fireGuns` checks the line
   but not the neighbourhood.

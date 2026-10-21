# Capital-scale combat: nukes, point defence, heat, and the km scale (for discussion)

Status: **discussion paper with owner decisions recorded 2026-10-21, nothing implemented. Update: ships are capped at 500 m for now (frigate = largest), so section 1 (km scale) is deferred; nukes, PD and heat apply to corvettes and frigates first.** Physical statements are general knowledge, marked [M] (unverified in
this session). Numbers are placeholders for tuning, not derived from sources.

## 1. Consequences of the km scale (needs decisions before any capital is flown)
Owner scale: carriers 1.5-3 km, super capitals 5 km, motherships 10 km. Our sim is built around 10-20 m fighters.
| Parameter now | Value now | Problem at km scale |
|---|---|---|
| Radar ranges | 1.5 / 3 / 6 km | A 10 km ship is longer than the longest radar range |
| Weapon ranges | guns ~1-2 km, missiles 2-4 km | Capital engagements span tens of km |
| Max speeds | corvettes 28-34 m/s; carrier placeholder 12 m/s | A 2.5 km ship at 12 m/s takes 3.5 minutes to move its own length |
| Camera far plane, float precision | tuned for km scenes | 10 km models and 50+ km battles need floating-origin care [M] |
| Voxel budget | corvettes 35-78k instances | Capitals only feasible with coarse voxels (carrier model uses 0.25 resolution multiplier, ~12 m voxels) and LOD |
Options: (a) scale the whole sim (ranges, radar, sim speed per ship class); (b) keep fighter-scale play and treat capitals
as scenery plus objectives with abstract damage (like FS2/TIE capitals); (c) fully fly capitals later. Recommendation:
(b) now, (a) when the strategic layer needs it.


## 2. Nuclear weapons (owner decisions 2026-10-21 in bold)

### 2.1 Decisions
- **X-ray (bomb-pumped) laser: later.** Impact and proximity warheads first.
- **Nuclear flash blinds sensors and PD optics only temporarily** (a blind timer, not hit-point loss).
- **When the X-ray laser comes, it is an in-arena weapon between capital ships.**
- **FROGG pilots are radiation-vulnerable** (so nukes are also an anti-FROGG weapon; biology to be fleshed out later).
- **Shields reduce crew radiation dose to some extent** (attenuation factor open, see 2.4).
- Delivery: heavy missiles and drones. The weapons specialist of a heavy fighter sets the fuze (impact, delay, proximity
  with burst range), after the Children of a Dead Earth model of selectable fuzing.

### 2.2 Physics anchors and sources
In vacuum there is no blast wave. About 90% of yield is X-rays and gamma, about 10% neutrons (more for enhanced-radiation
designs). Fluence falls with 1/r^2.

| Quantity | Value | Source / status |
|---|---|---|
| X-ray fluence, ionisation upset in satellite electronics | about 0.4 J/m^2 (4e-5 J/cm^2) | RAND RRA3028-3, ch. 4 "X-Rays", p. 7-9; the report calls it a rough illustrative estimate |
| X-ray fluence, thermal damage to (civil) satellites | about 400 J/m^2 (0.04 J/cm^2) | same report, same pages |
| X-ray fluence, system-generated EMP | about 4 J/m^2 | same report |
| Neutron standoff | about 5 km (15 kt), 22 km (300 kt), 40 km (1 Mt) | same report, Fig. 4; scales roughly with sqrt(yield) |
| Gamma standoff | about 2 km (15 kt), 9 km (300 kt), 16 km (1 Mt) | same report, Fig. 4 |
| 1 kt neutron bomb: 80 Gy at 900 m, LD50 about 1,350-1,400 m (unprotected) | | Project Rho (secondary source) |
| Armour or hull kill threshold for a military warship | **no open source found** | the earlier "kJ/cm^2" figure was a recollection, unsourced; treat as a tunable game parameter |

My own arithmetic (checked against the RAND data): taking 80% of yield as X-rays, a 15 kt burst gives 0.47 J/m^2 at
2,900 km, which matches the RAND 0.4 J/m^2 at roughly 2,900 km. For 1 kt (3.35e12 J of X-rays) the radius at which a
fluence F is reached is r = sqrt(3.35e12 / (4 pi F)):
- 0.04 J/cm^2 (civil thermal damage): about 26 km
- 2 kJ/cm^2 (placeholder hull threshold): about 115 m
The sourced civil thresholds therefore exceed any arena size by a wide margin. Civilian ships, stations and unhardened
craft are destroyed or disabled far outside the arena; **military hardening is the parameter that makes combat
possible and it has no open number**. Scaled RAND neutron data gives about 1.3 km for 1 kt, consistent with Rho's LD50
range; Rho's "lethal to about 20 km" figure is the outlier.

### 2.3 Warhead classes (first implementation: impact and proximity)
1. **Impact:** detonates on the hull after the shield is gone. Large structural damage, short range.
2. **Proximity:** detonates at a set burst range. Three effects with different radii:
   - hull and exposed-subsystem damage from X-ray fluence (1/r^2, shield-absorbed per facing);
   - crew and electronics dose from neutron and gamma (larger radius; kills or incapacitates pilots, human and FROGG);
   - optics flash (largest radius): radar, targeting and PD-laser optics get a temporary blind timer that grows with
     fluence above a sensor threshold and is capped.
3. **X-ray laser:** later (one-shot, aimed cone, damage about E/(Omega r^2)). Range claims in the literature differ by
   orders of magnitude and the design data is classified, so its range is a free design parameter.
Drones are immune to crew dose. A hit on a nuke can be a soft kill (guidance or fuze broken, warhead keeps a ballistic
path) or a hard kill.

### 2.4 Open parameters
Hardening factor for military hulls; shield attenuation of crew dose (suggest a fraction of dose removed that scales
with current shield level on the exposed facing); yields per warhead class; blind-timer scale.

## 3. Turrets: magazines, capacitors, heat, and roles (owner decisions 2026-10-21 in bold)
**The magazine/capacitor rule applies to all turrets.** Fire rate and damage differ by turret role:

| Role | Mount | Fire pattern (relative; numbers to be tuned) | Main targets |
|---|---|---|---|
| PD | many small mounts | very high burst rate, small magazine or small capacitor, short reload or recharge | missiles, drones, nukes, light craft |
| S | small turret | high rate, large magazine | fighters |
| M | medium turret | medium rate | corvettes, heavy fighters |
| L | heavy turret | slow rate, big damage per round | corvettes, frigates |
| XL | **keel-mounted mega cannon, fixed straight ahead: the whole ship must orient to aim** | very slow cycle, long capacitor charge, huge damage | frigates and larger; the firing ship is exposed while turning |

- Guns: magazine of N rounds, then a fixed reload drawn from the ship's `stores`. Reference rates from memory (Phalanx
  about 4,500 rpm, Goalkeeper about 4,200 rpm) are unverified.
- Lasers: a capacitor bank; each pulse draws charge and adds waste heat; when empty, the recharge draws on the ship's
  power budget (competing with shields and drives).
- Heat has three timescales: pulse (ms), capacitor burst (seconds), thermal buffer (tens of seconds); radiators set the
  sustained rate. Radiators and capacitor banks are targetable subsystems.
- Interception model: expected hits per burst from range, target size and evasion; a target dies when accumulated damage
  exceeds its HP; per-turret cap on simultaneous targets and a slew time.
- HUD: show ammunition or charge per mount in the subsystem target info; an emptied PD mount is the visible attack window.
- Human ships use radiator panels; FROGG ships may use vents (lore decision still open).

## 4. Open questions
1. Hardening factor for military hulls, and a number for the hull-kill fluence (no open source found).
2. Shield attenuation of crew dose: how much, and does it fail when the shield facing is down?
3. Yields per warhead class.
4. Turret numbers per role (rate, magazine or capacitor, damage, heat).
5. XL keel cannon: does the shield get pierced, and what is the turn-rate cost for a 450 m hull?
6. How FROGGs dissipate heat.

# Lasers: fluence, dwell time and what that means for the game (research note, 2026-10-21)

Status: research and proposal, nothing implemented. Numbers marked [S] come from a source below; [C] are my own calculations from those numbers;
[P] are placeholders for the game. The sources themselves say their figures are illustrative.

## 1. What the sources give
| Quantity | Value | Source |
|---|---|---|
| Thermal lethal fluence of a 1980s solid booster skin | about 10 kJ/cm^2; deployed missiles about 1 kJ/cm^2 or less | OTA 1984, pp. 17-19 [S] |
| Effect of hardening | ablative heat shield x2 to x3; spinning target x3; combined example 60 kJ/cm^2 | OTA 1984, p. 18, 20-21 [S] |
| Delivery of 10 kJ/cm^2 | 1 s at 10 kW/cm^2 | OTA 1984, p. 18 [S] |
| Impulse kill (X-ray, same fluence) | delivered in microseconds, not seconds; X-ray laser hardness example 20 kJ/cm^2 | OTA 1984, pp. 25-28 [S] |
| Steel vaporisation | about 60 kJ/cm^3, i.e. about 6 kJ/cm^2 per mm; 12.5 cm of steel through a 4 cm beam radius needs about 37.5 GJ, i.e. 38 MW for 1 s | Atomic Rockets (Project Rho) [S] |
| Diffraction spot radius | R_T = 0.305 x range x wavelength / mirror radius; intensity = power / (pi R_T^2) | Atomic Rockets [S] |
| Laser damage to an aluminium mirror | about 40 MW/m^2 = 4 kW/cm^2 | Atomic Rockets [S] |
| Waste heat | efficiency often assumed 20%, a 2004 diode demonstration reached 65% wall-plug; waste = input - beam power | Atomic Rockets [S] |
| Game precedent | Children of a Dead Earth gives each anti-laser armour material an ablation cap in cm/s (aramid 0.16, PTFE 0.31, nitrile rubber 0.44, polyethylene 0.53, selenium 0.64); lenses and mirrors are easily destroyed by laser fire and nuclear flashes | CoaDE wiki, patch notes [S] |

## 2. What it means at game ranges [C]
At 0.5-2 km a 1 micron laser with a 0.5 m mirror has a diffraction-limited spot under 2 mm in radius. The real spot is set by pointing jitter and
beam quality, not diffraction. With a placeholder pointing error of 20 microradians the spot radius is 1 cm at 500 m, 2 cm at 1 km and 4 cm at 2 km.
Intensity falls with the square of range. Dwell time to deliver a given fluence F is t = F / I.

| Beam power | Range | Intensity | Fighter hull (10 kJ/cm^2) | Corvette (300 kJ/cm^2, about 5 cm steel equivalent) | Frigate (1,000 kJ/cm^2) | Exposed optics (4 kW/cm^2) |
|---|---|---|---|---|---|---|
| 0.1 MW | 500 m | 32 kW/cm^2 | 0.3 s | 9 s | 31 s | damaged |
| 0.1 MW | 1 km | 8 kW/cm^2 | 1.3 s | 38 s | 126 s | damaged |
| 0.1 MW | 2 km | 2 kW/cm^2 | 5 s | 151 s | 503 s | not damaged |
| 1 MW | 500 m | 318 kW/cm^2 | 0.03 s | 0.9 s | 3 s | damaged |
| 1 MW | 1 km | 80 kW/cm^2 | 0.13 s | 3.8 s | 13 s | damaged |
| 1 MW | 2 km | 20 kW/cm^2 | 0.5 s | 15 s | 50 s | damaged |
The corvette and frigate fluences are my placeholders, scaled by hull thickness; the fighter figure is the OTA booster value.

Reading:
- A megawatt laser kills a fighter in a fraction of a second at fighting range. The only real limit is whether the turret can hold the spot on a manoeuvring
  target (pointing, slew rate, target motion), plus heat and capacitor energy. Tracking is the game mechanic, not the physics of the burn.
- Against corvettes and frigates the dwell is seconds to tens of seconds, which fits "focus time" gameplay and gives ablative armour (x2-x3, OTA) and rolling the
  ship (x3 for a spinning target, OTA) real tactical value.
- Exposed optics, antennae and projector lenses fail at about 4 kW/cm^2, 100x lower than armour burn-through. Lasers are best used against sensors,
  turrets' optics and projectors first. This supports the exposed-part rule in docs/ARMOR.md.
- Pulse lasers are more energy-efficient than continuous beams for the same damage (Atomic Rockets), which suits the capacitor/burst rule.
- Heat: a beam of power P at efficiency e dumps P(1-e)/e as waste heat; 1 MW at 35% efficiency makes about 1.9 MW of heat (docs/CAPITAL_COMBAT.md section 3).

## 3. Proposed game model [P]
- Laser stats: beam power P, pointing error sigma, efficiency e, capacitor energy, turret slew rate.
- Hit model: the beam is hit-scan. While the turret has the target within its pointing error, fluence accumulates on the facing patch at I = P / (pi (sigma R)^2).
  Damage per second = I / F_k(target), with F_k per ship class and armour type (ablative x2.5, spinning/rolling x up to 3 by roll rate, composite x1, hard x1.5 [P]).
  Breaking the lock (target manoeuvre exceeding slew rate) resets the accumulated heat slowly.
- Exposed parts use the optics threshold (4 kW/cm^2) instead of F_k, so they fail first.
- Armour in physical units is possible: CoaDE's ablation cap in cm/s per material is the same idea as the ablative `rate` in docs/ARMOR.md.
- Nuclear X-ray hull kill is an impulse effect; OTA's scale (10-20 kJ/cm^2) puts the 0.1 kT hull-kill radius at about 12-16 m, so the placeholder 1.5 kJ/cm^2
  now in `NUKE.kill` (42 m radius) is probably optimistic; crew dose, not hull damage, remains the main nuclear effect at 100-500 m.

## 4. Open decisions
1. Continuous beam with dwell accumulation, or discrete pulses with a capacitor burst count? (Proposal above is dwell-based with a capacitor.)
2. Pointing error and slew rate per turret size class (PD, S, M, L, XL); these set how lethal lasers are to fighters.
3. Whether shields absorb laser energy in kJ/cm^2 terms or at a flat multiplier as now.
4. Whether ship roll should be a deliberate defence (needs a roll-rate input for capitals) or an automatic bonus.

## Sources (accessed 2026-10-21)
- [OTA, Directed Energy Missile Defense in Space (1984)](https://www.princeton.edu/~ota/disk3/1984/8410/841005.PDF). The text itself says no significance should be attached to the precise numbers.
- [Atomic Rockets, Beam Weapons](https://www.projectrho.com/public_html/rocket/spacegunconvent2.php) (first 100,000 of about 104,000 characters read). Secondary compilation.
- [Children of a Dead Earth wiki, Armor](https://coade.fandom.com/wiki/Armor) and the [patch-note thread](https://combatace.com/forums/topic/90566-children-of-a-dead-earth-hard-sci-fi-space-combat-sim/).
- Not read: the ToughSF article returned a redirect I did not follow.

# Lasers: fluence, dwell time and what that means for the game (research note, 2026-10-21)

Status: research and proposal; the focus mechanic of section 6 is implemented (2026-10-22), the rest is not. Numbers marked [S] come from a source below; [C] are my own calculations from those numbers;
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

## 4. Owner decisions and my best guesses (2026-10-21)
**Owner:** (1) large lasers consume a lot of energy and are continuous; fighters use pulses from capacitors, e.g. 10 x 50 kW pulses.
(3) Ships roll to expose different shield parts. (2) accuracy: my best guess below. (4) shield treatment: my recommendation below.

**Weapon classes [P]**
| Class | Mode | Power | Pointing error (microradian) | Note |
|---|---|---|---|---|
| Fighter laser | 10 pulses x 50 kW, assumed 0.1 s each (5 kJ per pulse, 50 kJ per burst), then recharge | 50 kW | 40 | recharge from the fighter's energy pool, about 8 s |
| PD laser | short bursts from a capacitor | 100-200 kW | 25 | short range, tight tracking |
| Turret S/M | pulse or short beam | 0.1-0.5 MW | 30 | |
| Corvette laser (L) | continuous | 1 MW | 20 | draws about 2.9 MW from the reactor at 35% efficiency (waste heat about 1.9 MW) |
| Frigate laser (XL, keel-aligned) | continuous | 5 MW | 15 (10 when the ship is aimed on the keel) | about 14 MW input, waste heat about 9.3 MW; radiator limited |
The pointing errors are guesses with no source; they set how lethal lasers are and should be playtested.

**Consequence for the fighter pulse laser [C]** (spot radius = error x range; hull fluence needed to kill a fighter 10 kJ/cm^2):
| Range | Spot radius | Fluence per 10-pulse burst | Bursts to kill a fighter | Optics (4 kW/cm^2) |
|---|---|---|---|---|
| 250 m | 1.0 cm | 15.9 kJ/cm^2 | 0.6 | damaged |
| 500 m | 2.0 cm | 4.0 kJ/cm^2 | 2.5 | borderline (4.0 kW/cm^2) |
| 750 m | 3.0 cm | 1.8 kJ/cm^2 | 5.7 | not damaged |
| 1,000 m | 4.0 cm | 1.0 kJ/cm^2 | 10 | not damaged |
So a fighter laser is a close-in weapon: lethal inside about 300 m, a sensor-killer at 500 m, nearly useless at 1 km. Large continuous lasers (1 MW at 1 km: corvette hull in
about 4 s, frigate in 13 s; 5 MW at 2 km: corvette 1.7 s, frigate 5.7 s) are the capital-ship threat, limited by heat and slew rate.

**Shields: roll to present a fresh segment (owner).** Shields are segmented. Proposal: fighters keep fore/aft; corvettes and frigates get 6 segments (fore, aft, and four
around the long axis); rolling the ship rotates the four side segments, so a ship can swap a battered segment for a fresh one toward the enemy. Needs a roll command
for AI capitals and a HUD segment display. Rolling also spreads a laser's dwell (OTA: a spinning target is harder by about x3), a separate, smaller bonus.

**Recommendation on shield versus laser (owner asked):** treat each shield segment as an energy pool in common units (megajoules), and let a laser drain it at beam
power x time x a laser multiplier (the current 1.25 for energy weapons is a reasonable start). Do not model spot size on shields: a field spreads and dissipates the
energy, and the local burn-through physics only matters once the shield segment is empty and the beam is on the armour. This keeps shields simple and puts the
dwell-time mechanic on armour and exposed parts, where the sources apply. It is a design choice, not a sourced physical fact.

## 5. Open decisions
1. Turret slew rates per size class and the pulse length of the fighter laser (assumed 0.1 s); both change lethality as much as the pointing error.
2. Number and layout of shield segments per class, and the roll command for AI capitals.
3. Whether the XL keel laser and keel cannon share the keel line (whole-ship aiming) and the same capacitor/heat budget.
4. Confirm the shield-as-energy-pool recommendation in section 4.

## Sources (accessed 2026-10-21)
- [OTA, Directed Energy Missile Defense in Space (1984)](https://www.princeton.edu/~ota/disk3/1984/8410/841005.PDF). The text itself says no significance should be attached to the precise numbers.
- [Atomic Rockets, Beam Weapons](https://www.projectrho.com/public_html/rocket/spacegunconvent2.php) (first 100,000 of about 104,000 characters read). Secondary compilation.
- [Children of a Dead Earth wiki, Armor](https://coade.fandom.com/wiki/Armor) and the [patch-note thread](https://combatace.com/forums/topic/90566-children-of-a-dead-earth-hard-sci-fi-space-combat-sim/).
- Not read: the ToughSF article returned a redirect I did not follow.


## 6. Implemented 2026-10-22 (owner: "a steady beam delivers a lot of energy; shields and armour types come in")
All beam weapons (human `laser`, FROGG `flaser` and `lance`) share one rule, in `src/60_weapons.js` (`beamFocus`):
- A beam is instant-hit, but the ship it touches is only *tracked* at first: no damage until the beam has stayed on the **same ship** for `acq` sim-seconds.
- After that the per-pulse damage climbs from 0.25x to `peak`x over `ramp` sim-seconds. Contact lost for longer than `gap` (default max(0.25 s, 2.5 x cooldown)) resets everything.
- Because per-pulse damage grows, a held beam gets past the armour size threshold (ARMOR `thresh` x class) that stops light hits, and then the armour profile (`hard` 0.4x vs energy, `composite` 1.0x, `ablative` 1.5x) and shields (energy x1.25 vs shields) decide the rest. This matches the sources in sections 1-2: dwell time is the mechanic, ablative armour and target motion are the counters.
- sim seconds x 1/0.375 = real seconds the player experiences.

| Weapon | Carried by | acq (sim s / real s) | ramp | peak | base dmg | cd | range | energy/shot |
|---|---|---|---|---|---|---|---|---|
| `flaser` | FROGG Leaper, Reaver, Spitter | 0.35 / 0.9 | 0.5 | 2.2x | 2.8 | 0.1 | 950 | 9 (capacitor) |
| `lance` | FROGG Gulper | 0.8 / 2.1 | 1.0 | 3.0x | 2.4 | 0.06 | 1500 | 3 (pool 400, +70/s) |
| `laser` (LS-2 turret) | Halberd (2 dorsal-forward turrets), Exeter (4 turrets) | 0.5 / 1.3 | 0.8 | 3.0x | 6 | 0.25 | 1600 | 12 (Halberd pool 600, +100/s; Exeter 2500, +350/s) |

Feedback to the pilot: a tracked player sees `LASER TRACKING n%` (blink speeds up) and hears a rising tick; once the beam is burning, `LASER ON YOU - BREAK` and a fast tone. A tracking beam is drawn thin and dim, a burning beam bright.
Laser turrets hold their target (switching resets the focus), prefer large targets (PD turrets keep the fighters and missiles), do not fire with a friendly in the line, and spend ship energy.
Not modelled: heat, mirror damage, spot size growth with range, ablative cap per second (the existing ablative rate cap applies as for any hit). All numbers are placeholders tuned in headless duels; none is verified by play.

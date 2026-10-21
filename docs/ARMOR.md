# Armour, friendly fire and crash damage

Status: implemented 2026-10-21 (placeholder numbers). Owner decisions: one armour type per ship for now; armour is an
FS2-style damage transform that never depletes; `thresh` and `rate` included; Whipple (spaced) plating later but documented here.

## 1. Sources of the design
- **FreeSpace 2 (FS2 Open source, ideas only):** damage goes shield -> subsystems -> hull armour -> hull. Armour is a table of
  arithmetic steps per damage type applied to incoming damage, not a pool; shields have their own armour type and a
  piercing percentage; weapons carry shield/armour/subsystem factors (0..2). Files: `code/ship/ship.cpp`
  (`ArmorType::GetDamage`), `code/ship/shiphit.cpp` (`ship_do_damage`).
- **Children of a Dead Earth (community wiki and 2018 player thread, partly outdated):** armour is a layered stack, each layer
  against one threat (anti-flash ceramic, Whipple gap, bulk, spall liner, anti-laser ablator with an ablation-rate cap in cm/s).
  Laser armour is poor kinetic armour; sloped plates help against kinetics. No public damage formulas were found.

## 2. Model in the game (`ARMOR` in `src/60_weapons.js`, applied in `applyHit`, `src/65_combat.js`)
Order of a hit: shield (per facing) -> exposed subsystem direct hit -> **armour transform** -> structure/components.
A ship has `armor: { type, rating }`. `rating` is the average share of damage stopped (derived from the old armour pools:
armour_fore / (armour_fore + structure)); the type's profile redistributes it by damage type, capped at 92%.

| Type | Profile (kin / en / exp) | thresh | rate | spall | Idea |
|---|---|---|---|---|---|
| ABLATIVE | 0.5 / 1.5 / 1.0 | 0 | 0.6 x structure per second, burst capacity 1.5 s | 0.04 | burns away under energy fire; sustained fire beats the rate cap and passes through |
| HARD | 1.4 / 0.4 / 1.0 | 6 | none | 0.30 | stops kinetics; shrugs off small hits; breach throws spall into internals |
| COMPOSITE | 1.0 / 1.0 / 1.0 | 3 | none | 0.12 | all-round |

- `thresh` is scaled by ship class (fighter 0.25, corvette 1, frigate 1.5, capital 2). A hit smaller than the scaled threshold is
  mostly stopped (soft quadratic cut-off), so PD and light guns cannot hurt heavily armoured hulls; M/L/XL weapons and
  missiles are needed. Piercing damage (`pierce`) ignores armour as before.
- `rate` (ablative only) is a leaky bucket per facing: the amount absorbed counts against a capacity that drains at `rate`.
  It is a rate limit, not a reserve; armour has no memory after a few seconds.
- `spall` is the share of the blocked damage that goes to the nearest internal component when the hit gets past the armour.
- The HUD shows the armour type; the four facing bars show ablative rate-cap headroom (full for non-ablative types).
- Assignments are placeholders: Kestrel, Exeter, Darter, Leaper, Toad, Gulper, Hive Carrier composite; Halberd and Reaver hard;
  Spitter ablative. FROGG assignments wait for the biology/lore decision.
- Verified headlessly: damage fractions per ship/type/hit size; ablative rate cap; full Reedbed autopilot run (17 kills, mission
  completed, no JS errors). Not verified: feel in play, balance against the old pools (ratings were matched, shapes differ).
- Known loss of detail: the old model had different armour values per facing (fore/aft/left/right); one rating per ship now.

### Exposed parts (owner rule 2026-10-21)
Antennae and sensors (`radar`), shield projectors (`shield`), radiators and weapons or engines that stick out of the hull can still
be damaged however thick the armour is. A hit near one of these parts sends 55% of its damage to the part before the armour
transform (`EXPOSED` reach factors and `SOFT` damage multipliers in `src/65_combat.js`), so even PD fire can blind a sensor or
cripple a projector on a heavily armoured hull. Losing them has the usual effects (radar, shield, radiator roles).

## 3. Whipple (spaced) plating: later
A thin sacrificial plate set off the main hull (CoaDE: gap of at least 25 cm, plate 1-5 mm of a dense soft metal, optionally
filled with graphite aerogel) that turns kinetic projectiles into plasma before they reach the bulk armour. Proposed game rule:
a fourth armour layer flag `whipple` that cuts the first kinetic hit per facing by a large factor and then needs time to
"re-form" (modelled as a per-facing recharge, i.e. a destructible outer skin), and appears on voxel models as standoff plates.
Not implemented; needs a decision on whether it is a separate layer (stack) or a type.

## 4. Friendly fire and crash damage
- **Friendly fire:** own-team bolts and missile blasts now hit friendly ships (not the shooter for bolts). Multipliers
  `FF.bolt` and `FF.blast` are 0.5 (placeholder, `src/60_weapons.js`). Missile proximity fuzes still trigger on hostiles only.
  AI ships hold fire when a friendly sits in the gun line (`friendlyInLine`). The player gets a log line on friendly hits.
- **Crash damage:** every ship class can crash into any ship, friend or foe. The lighter body is the one tested against the
  other's solid voxels. Damage per body = (2 + 0.22 x relative speed) x (1 + 0.35 x sqrt(reduced mass)) x its share of the
  impact (the lighter ship takes more), capped. Mass classes are placeholders: fighter 1, corvette 25, frigate 150, capital 2000.
- Verified headlessly: kestrel vs darter 7.3 / 15.7 damage, kestrel vs Halberd 12.4 / 0.3, Halberd vs Exeter 37.5 / 7.6; friendly
  hit counter and AI hold-fire path ran without errors. Not yet tested: crowded wing dogfights for unwanted fratricide.

# Lore notes (owner statements, 2026-10-21)

Everything here is the owner's stated direction; nothing is verified or final.

## FROGGs
- A **migratory hive species** in the manner of the aliens in *Independence Day*: they move from system to system
  consuming resources, with huge motherships and carriers (hive carriers 2-3 km, hive motherships ~10 km).
- **Neuro-slaved pilots**: FROGG fighters are flown by neurally slaved pilots who tolerate much higher G-loads.
  Game consequence: FROGG fighters turn harder than human fighters (already roughly true for Darter), and shooting down a
  fighter kills its pilot (no ejection or rescue on the FROGG side).
- Visual language: dark lamellar carapace, rust streaks, swept blades, ribbed orange vents, technical rather than insectoid
  (feedback: avoid giant eyes).
## Humans
- Fighters are escorted by **drone wingmen** (instead of, or in addition to, crewed wingmen): drones accept the same
  orders (docs/FREESPACE2_COMPARISON.md) and are expendable; crewed pilots remain the persistent characters (docs/FLEET_LOGIC.md).
- **Multiple human factions** with different ships, in the manner of *Space: Above and Beyond*: deferred until back story
  is developed. Placeholder: current Kestrel/Halberd belong to one faction.
- Large ships (corvette and bigger) carry point defence (CRAM-style guns and PD lasers); heat forces radiators
  (docs/CAPITAL_COMBAT.md).
## Weapon doctrine (owner statement 2026-10-21)
- **FROGGs:** lasers, and better missiles than the humans (longer reach, better seekers/manoeuvre, harder to decoy; to be tuned).
- **Humans:** better in railguns, miniguns (rapid-fire kinetic) and point defence, plus some lasers.
- Intended feel: the FROGGs win by numbers and energy/missile pressure, the humans by kinetic firepower and layered PD.

Consequences and open points (analysis, not owner statements):
- **Armour interplay** (docs/ARMOR.md): lasers favour hard/composite hulls over ablative ones for the target, and ablative armour is the natural
  answer to FROGG lasers; human kinetics favour hard-armoured targets being hard to hurt below the size threshold, so railguns and large rounds
  matter against FROGG corvettes while miniguns and PD matter against missiles and fighters.
- **PD and missiles:** better FROGG missiles raise the value of human PD (magazine reload windows; docs/CAPITAL_COMBAT.md). A FROGG laser fleet meets
  the heat/capacitor rules too: lasers add waste heat, so FROGG vents or heat-sink tissue (lore: biology undecided) set the sustained rate.
- **Implemented 2026-10-22 (owner chose "stronger FROGG missiles and lasers"; numbers are my defaults, see docs/OPEN_QUESTIONS.md 1-2):**
  FROGG lasers are instant-hit beams. `flaser` (pulse bank, fighters: Leaper, Reaver, Spitter; 2.8 dmg, 0.1 s, 950 m, 9 energy per pulse so about a
  12-pulse burst from the capacitor, then limited by recharge) and `lance` (continuous large laser, Gulper: 2.6 dmg, 0.06 s, 1500 m, 3 energy, power pool
  400 with 70/s recharge). FROGG missiles improved: Tick range 1500->2200 m, turn 3.0->4.2, lock time 1.5->1.1 s, flare susceptibility 0.6->0.3;
  Tadpole range 1800->2600 m, turn 0.8->1.1, decoy susceptibility 0.1->0.05. Humans keep Cannon, Plasma bolter, Railgun, PD-30 and the new `LS-2` laser
  (instant beam, not mounted on any ship yet). Beams cannot be dodged and need no lead, so their damage is kept low; heat is not modelled yet (energy pool only).
  Balance effect (headless duels, arcade flight, 4 Kestrels skill 3 vs N FROGGs skill 3): the human win rate dropped from 100% at N=10 to about 1/3-3/3 at N=10-12 and 0/3 at 14.
- **Nuclear warheads:** not assigned to either side yet.

## Rules already set
- Only capital ships jump; fighters and corvettes dock first (docs/FLEET_LOGIC.md section 8).
- Pilots can eject; SAR assets can recover them (FROGG pilots cannot).
- Ship size cap for now: 500 m (frigate). Carriers, dreadnoughts, super capitals and hive motherships are later.
- Human **fighter drones**: small, agile, one central mag cannon + 2 missiles, scout ahead or ram to self-destruct (docs/FLEET_LOGIC.md section 9).
- Drones: 6 m, 48 per frigate, slaved 1 per fighter / 2 per heavy fighter / 6 per corvette; kills count as drone kills for the controller; jamming rules later.
- Heavy fighters carry a crew of 2: pilot and weapons specialist (the specialist can run the 2 slaved drones).
- Specialist seat is AI for now: manages munitions, drones and ECM while the player flies and shoots; two-person crews eject in one pod; two-crew heavy fighters are human only.

## FROGG ship look (owner reference art, 2026-10-21)
Reference: `docs/img/frogg_reference_art.jpg`. Graphite and gunmetal carapace in layered plates, **open toothed maw** at the bow (jaws
with teeth, glowing throat), **rib arches** over the hull with **cyan light seams** between them, rows of dorsal spikes, blocky
cylindrical drive clusters aft with **cyan plumes**. Acid weapons stay venom green so they read against the cyan hull light.
Implementation: `fRef` and the palette `N` in `src/31_ships_frogg.js`; detail layer palette in `src/20_voxel.js` (frogg).
Not yet matched: the long leaf-shaped flank plates of the carrier and the dreadnought's full jaw; cruiser/dreadnought classes do not exist yet.

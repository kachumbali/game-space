# Lore notes (owner statements, 2026-10-21)

Everything here is the owner's stated direction; nothing is verified or final.

## Adopted lore (2026-10-22, owner decision)
The Gemini lore proposals are now **canon in adapted form** (raw text: `docs/prototypes/lore-gemini/`):
- `docs/LORE_HISTORY.md` - timeline 2030s-2180s, the Oasis-9 incident, jump-drive limits.
- `docs/LORE_FACTIONS.md` - ECU/UTDF, Void-Born Confederacy, Vanderbilt-Astra; Sol super-blocs;
  the **Colonial Defence Force** (the player's side, per the briefing screen) and which in-game ships it fields;
  ejection/SAR doctrine. Resolves OPEN_QUESTIONS #23.
- `docs/LORE_FROGG.md` - FROGG species profile: cold-blooded thermal biology, wetware/anti-AI doctrine,
  ship aesthetic, weapon doctrine. Decides OPEN_QUESTIONS #7 (heat biology = plasma heat-sinks and coolant
  channels; still unmodelled in the engine).
- Naming decisions where the proposals collided with canon: the **Halberd stays our 128 m corvette**;
  the proposed two-seat heavy fighter became the **Falchion** (WC-style weapon name, planned ship, not built yet).
  The jump threshold is "frigate-class and up" (about 450 m), not a hard 500 m.

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

**Gun classes and faction lean (owner statement 2026-10-22):** three gun classes, and the factions lean on
them differently.
1. **Chemical guns** - ammunition only, no energy draw: MK-20, MK-30 HE, GA-9 rotary, DR-2 (humans);
   R-9 (FROGG). The magazine is the only constraint; firing them costs the ship nothing but rounds.
2. **Mag / rail** - a little energy AND ammunition: the projectile plus the capacitor discharge that throws
   it. RG-90, MD-9, MD-55, MK-90 (humans); R-12 (FROGG). Rails eat both a small capacitor draw per slug and
   a magazine; the ETS WEAPONS channel feeds the recharge.
3. **Energy only** - no magazine, the reactor is the feed: lasers and masers, the LS/ M- series, and the two
   XL lances' charge cycles (GX-1 fully, MK-90 hybrid: it is class 2 at XL scale - 100 slugs plus 800 energy
   a shot).

Faction lean: **FROGG are energy-heavy** (masers and wetware-guided ordnance; their kinetics are few and
specialised), **humans are ammo-heavy** (chemical guns and rails carry the day; energy weapons are support
and point-defence). Intended feel: FROGG pressure never stops because reactors recharge; human firepower
is heavier per engagement but sorties end dry, which is what tenders are for.

**Ordnance (owner statement 2026-10-22):** the fourth category is missiles and drones. Missiles both sides
carry (humans: SW-9, LN-3, HM-1, NK-1; FROGG: SK-1, ST-2 - better seekers, harder to decoy). **Drones are
humans-only**, because the FROGG anti-AI doctrine ("dead silicon") fields no autonomous machines of any kind:
their missile guidance is wetware (cloned brain-stems), their fighters are neuro-slaved pilots, and a human
fighter's slaved SD-4 drones are precisely the thing FROGG propaganda mocks.

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
  FROGG lasers are instant-hit beams that must first hold focus on a ship (docs/LASERS.md section 6) before they burn; a steady beam then ramps to 2-3x damage. `flaser` (pulse bank, fighters: Leaper, Reaver, Spitter; 3.5 dmg, 0.1 s, 950 m, 9 energy per pulse so about a
  12-pulse burst from the capacitor, then limited by recharge) and `lance` (continuous large laser, Gulper: 3 dmg, 0.06 s, 1500 m, 3 energy, power pool
  400 with 70/s recharge). FROGG missiles improved: Tick range 1500->2200 m, turn 3.0->4.2, lock time 1.5->1.1 s, flare susceptibility 0.6->0.3;
  Tadpole range 1800->2600 m, turn 0.8->1.1, decoy susceptibility 0.1->0.05. Humans keep the MK-20 cannon, MK-30 HE cannon, railgun, PD-30 and `LS-2` laser
  (instant beam, now mounted on the Halberd and Exeter). Beams cannot be dodged and need no lead, so their damage is kept low; heat is not modelled yet (energy pool only).
  The quoted headless duel result above is a historical pre-retune measurement, not current balance evidence.
- **Nuclear warheads:** not assigned to either side yet.

## Rules already set
- Only capital ships jump; fighters and corvettes dock first (docs/FLEET_LOGIC.md section 8).
- Pilots can eject; SAR assets can recover them (FROGG pilots cannot).
- Ship size cap for now: 500 m (frigate), except the FROGG **Bullfrog** (600 m, jump-capable spine carrier with a 36-fighter hangar; owner decision 2026-10-22, docs/BULLFROG.md). Carriers, dreadnoughts, super capitals and hive motherships are later.
- FROGGs field **no drones**: their fighters are flown by neuro-slaved pilots (anti-AI doctrine); the Bullfrog's hangar holds crewed FROGG fighters only (Darter, Leaper, Spitter, Toad, Reaver).
- Human **fighter drones**: small, agile, one central mag cannon + 2 missiles, scout ahead or ram to self-destruct (docs/FLEET_LOGIC.md section 9).
- Drones: 6 m, 48 per frigate, slaved 1 per fighter / 2 per heavy fighter / 6 per corvette; kills count as drone kills for the controller; jamming rules later.
- Heavy fighters carry a crew of 2: pilot and weapons specialist (the specialist can run the 2 slaved drones).
- Specialist seat is AI for now: manages munitions, drones and ECM while the player flies and shoots; two-person crews eject in one pod; two-crew heavy fighters are human only.

## FROGG ship look (owner reference art, 2026-10-21)
Reference: `docs/img/frogg_reference_art.jpg`. Graphite and gunmetal carapace in layered plates, **open toothed maw** at the bow (jaws
with teeth, glowing throat), **rib arches** over the hull with **cyan light seams** between them, rows of dorsal spikes, blocky
cylindrical drive clusters aft with **cyan plumes**. Maser bolts stay venom green so they read against the cyan hull light.
Implementation: `fRef` and the palette `N` in `src/31_ships_frogg.js`; detail layer palette in `src/20_voxel.js` (frogg).
Not yet matched: the long leaf-shaped flank plates of the carrier and the dreadnought's full jaw; cruiser/dreadnought classes do not exist yet.

# Human factions and infrastructure (adopted lore)

Status: adopted 2026-10-22 (owner decision), based on the Gemini proposals in
`docs/prototypes/lore-gemini/` (human-factions, sol-blocs, habitat and SAR
diagrams), adapted to the game's canon. This resolves `docs/OPEN_QUESTIONS.md`
#23 (human factions were "deferred"). Raw-proposal deviations are flagged inline.
The in-game player side is the **Colonial Defence Force** (see section 4) - the
briefing screen already reads "COLONIAL DEFENCE FORCE - EAGLE FLIGHT".

## 1. Where humans live

85 % of humanity lives in artificial low-gravity habitats, not on planets:
- **Garden Worlds:** Earth plus the two colonial temperate planets, New Caledonia
  and Aurelia (the only ones).
- **Sidero-Nodes ("Hollows"):** 5-20 km nickel-iron asteroids hollowed out with
  fusion torches, sealed and spun to 0.3-0.8 g along the inner cylinder walls
  (industrial zones, agricultural rings, living terraces). Ships launch and dock
  through the zero-g tube on the spin axis.
- **Corporate yards, research outposts, jump-gate hubs:** privately owned.

## 2. The three power blocs

### Earth-Core Union (ECU)
- **Territory:** Earth, Luna, the Garden Worlds. Government: United Nations
  Governance Council; military: **United Terrestrial Defense Force (UTDF)**.
- **Culture:** bureaucratic, wealthy, culturally dominant; views station dwellers
  as secondary labour ("Void-Born" is their slur).
- **Doctrine:** heavy composite armour, standardised kinetics (mass drivers,
  miniguns), layered point defence: CRAM-style guns and the kinetic **PD-30**, plus
  PD laser turrets (the LS-2 is VAC-licensed). Doctrine is `docs/CAPITAL_COMBAT.md`
  made official.

### Void-Born Confederacy (VBC)
- **Territory:** the outer asteroid belts, Oort cloud industrial clusters, the
  Sidero-Nodes.
- **Culture:** resource-starved, pragmatic, self-reliant. Waste is a capital
  offence. Views Core Earth as decadent parasites.
- **Doctrine:** high-thrust light interceptors with heavy autonomous drone
  integration (the **SD-4 Sentry**: 6 m, single mag cannon - the game's drone,
  `src/56_drones.js`; 2 missile hardpoints are in the design brief but not
  implemented). Human life is precious in the Belt; silicon drones take the brunt
  of the first passes. Pioneered slaved-drone wingman doctrine (the game's mechanic).

### Vanderbilt-Astra Conglomerate (VAC)
- **Territory:** private orbital yards, research outposts, jump-gate hubs.
- **Culture:** hyper-capitalist; holds the patents on capital jump drives and
  advanced shielding. Mercenary squadrons protect corporate assets.
- **Doctrine:** sleek high-precision laser platforms (the **LS-2** beam system;
  VAC designs it, others mount it under licence - 2 turrets on the Halberd,
  4 on the Exeter, `src/60_weapons.js`) and electronic warfare.
- **Secret:** responsible for provoking the FROGG invasion at Oasis-9
  (`docs/LORE_HISTORY.md` section 2).

## 3. Sol's national super-blocs (under the UNGC umbrella)

Outside Earth itself, industrial power sits with three blocs (raw-proposal names
kept; not yet used anywhere in-game):
- **Pan-Asian Union (PAU):** the largest orbital shipyards (Luna, Mars); builds
  most 2 km mega-transports and mining fleets.
- **North American Coalition (NAC):** heavy kinetics - mass-driver artillery,
  composite plating, long-range railgun corvettes. (The game's railgun fits here.)
- **European Commonwealth (EC):** electronic countermeasures, point-defence
  systems (PD-30), optical sensors, SAR infrastructure (see section 5).

Megacorporations operating across all blocs: Vanderbilt-Astra (jump cores,
navigation software, LS-2), Armitage-Weyland Bio-Industrial (cryo-stasis, life
support, atmosphere processing), Sidero-Dynamics (asteroid hollowing and spinning,
fusion torches).

## 4. The Colonial Defence Force (CDF) - the player's side

The colonies are not the ECU. The **Colonial Defence Force** is the joint defence
arm of the off-world habitats and Garden-World settlements - VBC-built hulls,
EC-standard subsystems, PAU shipyards, whatever the colonies can buy or build.
It is poorer than the UTDF and fields smaller numbers, which is why it leans on
drone wingmen and layered point defence.

In-game assignment (the current `SHIPS` roster, `src/30_ships_human.js`):

| Class | Ship | Faction flavour |
|---|---|---|
| Fighter | **Kestrel** (12.4 m, 1 slaved SD-4) | CDF/UTDF standard line fighter |
| Heavy fighter (planned, not built yet) | **Falchion** (~18 m, 2 crew, 2 slaved SD-4) | CDF strike craft |
| Corvette | **Halberd** (128 m, PD-30 screen) | CDF escort; docks in a frigate's magnetic cradle to jump |
| Frigate | **Exeter** (450 m, jump-capable) | CDF task-force flagship: 48 stored SD-4 drones, docks 12 fighters/drones + 2 corvettes; 2 rail mounts, 4 LS-2 laser turrets, 3 PD turrets (`src/30_ships_human.js`) |
| Drone | **SD-4 Sentry** (6 m; in-code `drone`, single DR-2 mag cannon) | VBC-designed, built under licence everywhere; 2 missile hardpoints are in the design brief (`docs/FLEET_LOGIC.md` section 9) but not implemented |

Raw-proposal deviations: the proposal called the two-seat heavy fighter "Halberd";
that name is our corvette, so the heavy fighter became the **Falchion** (owner
decision 2026-10-22; WC-style weapon name). The proposal's corvette names
(Watchkeeper, Vanguard-C) are dropped. The player character is Lt. Tom Cat,
callsign MEOW, of Eagle flight (HAWK, SPARROW) - `src/75_mission.js`.

## 5. Ejection, survival pods and SAR (human only)

Pilots can eject; FROGG pilots cannot (`docs/LORE.md`). Adopted detail:
- **Chain:** ejection detected -> LPI beacon lock -> SAR cutter dispatched under
  PD escort cover -> tractor/SAR dock -> trauma bay.
- **EP-2 tandem survival pod** (Falchion-class two-seat craft; whole crew ejects in
  one pod): Kevlar-titanium shell and ablative plate, low-observable passive
  radar/IR damping, 72-hour oxygen/hydro recycler and stasis foam.
- **SAR cutter:** ~32 m specialised utility transport, crew of 3 (pilot, rescue
  specialist, trauma medic), up to 6 ejection pods or 8 stretcher cases, forward
  magnetic grapple winch, ventral pod bay. None of this is implemented in the
  engine; wingman ejection survival odds exist (`docs/OPEN_QUESTIONS.md` #22).

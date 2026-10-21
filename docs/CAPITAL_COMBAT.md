# Capital-scale combat: nukes, point defence, heat, and the km scale (for discussion)

Status: **discussion paper, nothing implemented. Update: ships are capped at 500 m for now (frigate = largest), so section 1 (km scale) is deferred; nukes, PD and heat apply to corvettes and frigates first.** Physical statements are general knowledge, marked [M] (unverified in
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

## 2. Thermonuclear warheads on heavy missiles and drones
Facts [M]: in vacuum there is no blast wave; a warhead's energy leaves mainly as X-rays, gamma, neutrons and hot debris,
so damage depends on range and shielding rather than overpressure. Standoff or shaped designs can direct energy at a
target. Radiation also affects crews and electronics.
Design questions:
1. **Do nukes exist at all in this setting?** Treaties, taboo, and FROGG hive biology all change the answer. It is a
   story decision before a balance decision.
2. **Damage model.** Proposal: a new damage type `nuclear` with area effect and range falloff, strong against shields and
   unarmoured systems, weaker against thick armour at distance; plus a short lethal radius against fighters.
3. **Delivery.** Heavy missiles (slow, big, shootable) and **drones** (carrier-launched, can loiter, can be shot down by PD).
   Natural balance: PD kills most; saturation or protected approach lets some through.
4. **Gameplay role.** Anti-capital weapon launched from bombers/drones; the player's job is escort, PD suppression or
   interception. Keep fighters unable to carry them except bombers.
5. **Friendly fire and collateral.** Area effect hurts own wingmen; supports "clear the area" tension.
6. **Strategic layer link.** Limited stock, expensive materiel, possible political cost.
7. **Counters.** Shields scaled by facing, ECM/decoys, PD range, kill-the-launcher-first.

## 3. Point defence and heat (owner rule: corvette and larger have PD guns and PD lasers; heat forces radiators)
Facts [M]: in vacuum waste heat can only leave by radiation; radiated power scales with area times the fourth power of
temperature (Stefan-Boltzmann), so higher power needs bigger or hotter radiators; radiators are large, fragile and
visible to sensors.
Proposed model:
- Each large ship has a **power budget** P and a **heat state** H. Weapons/shields/drives add heat when used.
- Radiator area A cools at rate ~ A x k. Heat above a limit forces throttling or damages systems; below it, everything
  works. Heat shows on the HUD as one bar.
- **Human ships:** big radiator panels = bigger targets and bigger power budget (as the owner stated). Panels are
  targetable subsystems; losing them cuts the sustainable output of PD lasers and drives.
- **FROGG ships:** biological/thermal design could use vents and heat-sink tissue instead of panels: smaller visible
  radiators, different failure modes (e.g. burst vents). Decision for lore.
- **PD types:** CRAM-style guns (fast, area, ammo-limited, no heat to speak of) and PD lasers (unlimited ammo, heat-limited,
  range/dwell constraints). Rail-pierce rule exists for fighters; PD vs missiles/drones/nukes needs a hit-probability model
  and a cap on simultaneous intercepts per turret.
- **Hit-and-heat loop:** saturation attacks force PD lasers to run hot, which makes radiators and cooling the weak point.

## 4. Questions for you
1. Nukes: allowed in-universe? On which side(s), and at what stock level?
2. Do we fly capital combat or keep capitals as objectives/scenery with abstract damage for now?
3. How do FROGGs dissipate heat (vents vs panels)?
4. Is a nuclear detonation near a fighter always lethal, or does the shield model absorb part of it?
5. Do drones (human wingmen) ever carry nukes, or only bombers and special drones?
6. What size is the "frigate / cruiser" tier between 150 m and 1.5 km?

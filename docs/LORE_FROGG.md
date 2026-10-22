# FROGG species and doctrine (adopted lore)

Status: adopted 2026-10-22 (owner decision), based on the Gemini proposal in
`docs/prototypes/lore-gemini/frogg-species.md`, adapted to the canon in
`docs/LORE.md` (owner statements 2026-10-21). This document extends that canon;
where they differ, `docs/LORE.md` wins. Section 3 here resolves
`docs/OPEN_QUESTIONS.md` #7 (FROGG heat biology).

## 1. Biology and social structure

- **Classification:** apex reptilian migratory hive species; cold-blooded, dense
  muscular-skeletal structure, scaled lamellar skin, predatory jaw anatomy.
- **Thermal dependence:** being cold-blooded, FROGG biology and technology are
  intrinsically tied to heat management. Their ships are warm-blooded for them:
  internal **plasma heat-sinks** and **radiative coolant channels** (the glowing
  cyan seams between hull ribs, `src/31_ships_frogg.js`) regulate both vessel
  power and bio-neural function. The crew partly lives off the ship's waste heat.
  Engine note: heat is not modelled yet, only energy pools (lasers, capacitors);
  if heat is ever modelled, this is the biology it plugs into.
- **Social structure:** migratory swarm networks linked via bio-psionic bonds and
  directional laser comms to local Hive Commanders riding Carriers (2-3 km, the
  in-game Hive Carrier) and Motherships (~10 km, not built yet).

## 2. The anti-AI doctrine ("dead silicon")

- **Total rejection of machine intelligence.** FROGGs view silicon AI as fragile,
  predictable and devoid of combat instinct ("dead logic"). Religious revulsion,
  and a practical one.
- **Wetware instead.** No combat computers: cloned, streamlined reptilian
  brain-stems are integrated directly into missile seekers, flight-control systems
  and ship gunnery. This is why FROGG seekers (SK-1, ST-2) track harder and
  decoy worse than human equivalents (`src/60_weapons.js`, and see the reduced
  flare susceptibility in `docs/LORE.md`).
- **Neuro-slaved pilots.** No cockpit, no conscious pilot: a stripped-down neural
  cluster is embedded in the airframe, slaved to the sector Hive Commander's
  directives. Consequences (canon since 2026-10-21, restated):
  - G-tolerance: FROGG fighters (Darter, Leaper, Spitter, Toad, Reaver) turn
    harder than human fighters.
  - No ejection, no rescue: destroying a FROGG fighter destroys its node
    permanently. The SAR chain (`docs/LORE_FACTIONS.md` section 5) is human-only.
  - No drones: the FROGGs field no autonomous craft of any kind.
- **Propaganda mirror:** FROGGs view human reliance on silicon drones (the SD-4)
  as a foolish vulnerability; humans view neuro-slaving as barbaric bio-mechanics.

## 3. Ship aesthetic

Technical biomechanical predators, not insects. Graphite and gunmetal lamellar
plates with rust streaks, swept-forward blades, exposed structural rib arches.
Wide open-toothed bow maw with a glowing plasma throat; cyan coolant seams
between the ribs; blocky drive clusters with cyan plumes aft; rows of dorsal
spikes. Maser bolts stay venom green so they read against the cyan hull light.
Implementation: `fRef` and palette `N` in `src/31_ships_frogg.js` (reference art:
`docs/img/frogg_reference_art.jpg`, on the working copy only). The AI-generated
FROGG portraits supplied by the owner (horned scaled warrior, hive-hangar pilot)
match this palette; their usage terms must be confirmed before any in-game use.

## 4. Weapons and tactical doctrine

(Realism pass 2026-10-22: the FROGG arsenal is conventional physics - masers and
kinetics. Internal ids such as `spit`/`fang` are historical; the displayed names
are the realistic ones.)

- **Primary energy: masers** (microwave lasers) - `flaser` M-1 pulse banks on
  fighters (Leaper, Reaver, Spitter), the continuous M-7 `lance` on the Gulper
  corvette; the Bullfrog adds the telegraphed XL **GX-1 charged lance**
  (`docs/BULLFROG.md`). Beams need focus before they burn (`docs/LASERS.md`
  section 6), ramping to 2-3x damage on a held lock.
- **Kinetics:** the R-9 autocannon on fighters, R-4/R-5 small turrets on
  corvettes and the Bullfrog, and the R-12 penetrator driver - the Gulper's
  AP-rod main gun (the FROGG answer to human railguns).
- **Guided ordnance:** the **SK-1** interceptor missile and the **ST-2** heavy
  anti-ship torpedo (the Bullfrog's tubes). High tracking rates, long reach,
  low decoy susceptibility (flare values halved 2026-10-22).
- **Doctrine:** overwhelm by numerical saturation (swarms from carriers and the
  Bullfrog's 36-fighter hangar), extreme agility, persistent maser burn and
  long-range missile pressure. Humans answer with kinetics, railguns and layered
  point defence (`docs/LORE.md`, weapon doctrine).

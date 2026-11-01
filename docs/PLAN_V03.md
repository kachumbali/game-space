# Plan v0.3 "Armoury" (agreed 2026-11-01)

Goal: fix the combat numbers and fill the human roster **before** building the campaigns (docs/CAMPAIGN.md, plus the planned prologue and
"Long Retreat" arcs). Owner decisions in this plan are marked (O). Nothing here is balance-verified until its milestone says so.

## Standing requirements
- **Central values (O).** Every weapon stat, multiplier and mark lives in `data/db.json` (or one named table loaded from it), never in scattered
  code. A dev override (`?db=data/db.json`, served locally) loads the JSON at runtime, so changing one number needs a reload, not a rebuild.
  The published single file still embeds the db. `tools/validate_db.py` checks marks and ranges.
- **Roman-numeral marks (O)** after the name: "Kestrel II", "SW-9 III".
- **Balance claims need >= 20 seeded runs** (AGENTS.md). Branch per milestone, merge to `main` when green, no force push.
- **No real names or email addresses in the repo (O).** Handle: `kachumbali`.

## Status (2026-11-01)
Done and merged: M0 opsec, M1 harness and baseline (docs/BALANCE_BASELINE.md, docs/BALANCE_TARGETS.md PROPOSED), M5 subsystem effects (docs/SUBSYSTEM_EFFECTS.md), central db `tuning` section with the `?db=` override, Marks schema (docs/MARKS_SCHEMA.md, `kestrel_2` scaffolding), weapon panel built from mounts, PD turret energy. Also merged: Gemini G1 (Marks II-IV for Kestrel, Merlin, Bittern, Tern, torpedoes, fighter missiles; numbers unmeasured), M2 weapons by size (docs/WEAPONS_M2.md). Next: M3 missiles and torpedoes, M4 roster (agents running), scene player for the intro test.

## M0. Opsec
- Credits, AGENTS.md, ORCHESTRATION, CREDITS, MILESTONE_2, COPILOT_BRIEFS: the owner's real name becomes `kachumbali`.
- Player pilot: **Lt. Tom Cat, callsign MEOW** (O; replaces the old real-name pilot and the callsign ECHO everywhere in code, tests and docs).
- Git author `kachumbali` (noreply address) from now on. Old commits stay (the repo is public; owner accepts; no history rewrite).
- `tools/check_opsec.py` in CI fails on emails (except noreply) and on the retired real name (listed in the script itself).

## M1. Balance harness and targets
Seeded time-to-kill matrix (every weapon vs every target class; energy cost, capacitor life, tracking in deg/s; >= 20 runs per cell) and
`docs/BALANCE_TARGETS.md` agreed before tuning.

## M2. Weapons by size
- **S:** anti-fighter guns and **kinetic point defence**. **M:** corvette and bomber killers. **L:** anti-capital. **XL:** spine weapons, cannot hit fighters.
- Capital beams (O: all three): slower turret slew (fighters beat it by angular rate), a charge-up telegraph, a slower ramp. Beams stay instant-hit.
- Heavy fighters and bombers carry 1-2 small PD turrets as defensive gunners (WW2 bomber / Space: Above and Beyond); AI gunner behaviour.

## Owner decisions 2026-11-01 (second round)
- Bittern: 12 torpedoes (done). Player turret hold-fire toggle, key U / touch TUR (done).
- 3 s rule is flexible: make it realistic but fun.
- Torpedoes need real punch against shields: **tandem warhead** (precursor opens the shield facet, main charge reaches the hull); higher marks add the harmonic tuning (more bypass).
- S turrets: deterrent and missile defence first, a slow fighter killer second (about 12-25 s per light fighter for one turret), so bomber gunners matter without making bombers untouchable.

## M3. Missiles and torpedoes
- Light and medium fighters die in 1-2 missile hits (O); heavy fighters and bombers up to 3. Still evadable (flares, chaff, PD).
- Torpedoes take about 10-15% of a frigate each; only warheads kill a frigate outright.
- FROGG missiles keep their lead in range, seeker and turn rate.
- Torpedo marks I-IV: +8-12% range per mark, slightly better speed and durability against PD (O).

## M4. Marks I-IV and roster
- Marks for every system (shield, missile, cannon, laser, engine ...): base plus deltas in the db, about +8-12% per step **in that system's lane only**,
  a small cost elsewhere so nothing strictly dominates. Faction lanes: ECU armour and kinetics, VAC lasers and shields, VBC thrust and drones.
- Missing human ships on shared hulls plus faction retrofits and one signature hull per faction (O: hull variety is a later polish pass): Falchion
  heavy fighter, SAR cutter, evacuation liners, a mid-capital between Exeter and Hecla.
- Tern and Bittern in all menus (done in 0.2.3); every new ship gets a menu entry and a briefing loadout line.

## M5. Subsystem damage affects the ship (O)
In place: engines scale speed and turn, shield generator gates shields, gun components gate their mounts. To audit and fill: radar (lock range and
time), power plant (energy and recharge), wings and thrusters (roll and handling). A damage-model test and a HUD cue per degraded system.

## After v0.3
Campaigns: human prologue (about 4 missions: customs inspection, blockade, ambush, the FROGG shock), then "The Long Retreat" (evacuation, unknown
enemy that becomes known, transports with jump spool, scarce nukes), then the existing five missions as the following campaign. Campaign mode
has no arcade pods, perks or chain score (those stay in free flight and Gauntlet); a support ship call replaces them.

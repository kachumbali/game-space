# FreeSpace 2 (1999) as UX baseline: comparison with game-space

Companion to `docs/TIE_FIGHTER_COMPARISON.md`. Status: build of 2026-10-21. Sober assessment.

## Sources and confidence
- **[W2]** https://en.wikipedia.org/wiki/FreeSpace_2 and **[W1]** https://en.wikipedia.org/wiki/Descent:_FreeSpace_%E2%80%93_The_Great_War
  (both retrieved 2026-10-21). W1 describes the first game; FS2 shares the core systems but I treat W1 claims as
  FS2-valid only where marked [W1].
- **[M]** = from general knowledge, **not verified here** (ETS key layout and presets, flak/beam specifics, support-ship
  procedure, subsystem targeting of capitals in FS2, order menu details, mission-script tools). W2 itself does not
  describe wingman orders, flak, beams or swarm weapons in detail.
- game-space claims come from the repo. No external playtest data.

## Comparison

| Area | FreeSpace 2 | game-space now | Gap |
|---|---|---|---|
| Flight model | "Looser" space physics, ships need constant engine power, WWII-dogfight feel [W2]; collisions spin ships by impact point [W1] | Arcade model, speed-capped; fast turns | Similar philosophy; we lack impact-induced spin |
| Power management | Shift power among shields, engines, weapons; engine power sets top speed and afterburner energy [W1][W2]. W2 notes it can be ignored | Fore/aft shields, plasma energy, boost; no allocation | **Large**, same gap as TIE |
| Damage | Shields recharge, hull damage is permanent [W2]; subsystem damage shown in HUD [W1] | Shields regen (4 s delay), armour/structure, player has no persistent system damage | Medium: permanent hull attrition is a good, simple rule |
| Weapons | Primaries vary by shield/hull/subsystem role, drain energy; secondaries dumb/heat/aspect-seeking; single/double fire; countermeasures [W1]; beams, flak, missiles in capital fights [W2] | Guns, plasma bolter, rail (pierce), IR/RF/tick/torp/TAD missiles, decoys | Variety is good; **no role-specialised guns** (anti-shield vs anti-hull) or beam weapons |
| Targeting | Lock any craft, auto-nearest, match target speed, subsystem state on HUD [W1] | T/Y targeting, subsystem cycling and pipper, target panel | Parity; add **match-speed** and **target-attackers-of-protected-ship** [W2] |
| Wingmen | Orders: engage target, engage all, protect, depart; status on HUD [W1]; praised AI [W1] | Wingmen fly AI, no player orders, HUD status limited | **Large**: no command layer |
| Support | Call support craft to repair subsystems and rearm; call reinforcements [W1] | None | **Large**; ties to player system damage |
| Briefing / loadout | Choose ship and weapons where allowed, command briefings, carried-over loadout/damage [W1][W2] | Text briefing, fixed craft | Medium |
| Objectives | HUD directives with counters, blue/red states; some scripted to fail; hidden bonus objectives [W1]; mid-mission twists [W2] | Staged objectives on HUD, transits | Medium: no counters, no failable-but-continuing primaries |
| Campaign | Linear, optional covert missions, skip after five fails, difficulty between missions, medals/promotions, simulator [W1][W2] | 2 missions, grades, crew record in localStorage | **Large** (expected) |
| Scale | Capital ships fighting among fighter swarms, naval feel [W2] | 2 corvettes + Gulper, cinematic transits | Good direction; capitals are voxel-expensive |
| Atmosphere | Nebula environments praised [W2] | New procedural sky/looks (41_sky) | Reasonable; verify on device |
| Multiplayer | LAN/internet, coop, SquadWar [W2] | None | Out of scope for now |
| Modding | Engine source released 2002, SCP community [W2] | Single-file, data-driven ships | Our ship/mission data could be exposed as JSON |

## Where FS2 differs from TIE as a model
- TIE's strength is a tight **objective-layered, resource-managed** single craft loop. FS2 adds the **battlefield-command
  layer** (wingman orders, support, reinforcements) and capital-ship scale. For a Wing Commander-style game with named
  wingmen and persistent crews (docs/VISION.md), FS2's command layer fits better than TIE's solo focus.
- FS2's permanent hull damage and loadout carry-over [W1] make attrition matter across missions; this is cheap to add
  once we have persistent crews.

## Prioritised additions (merged with the TIE list)
Effort S ≤ 0.5 day, M 1–2 days, L > 2 days (guesses).
1. **Wingman orders (M).** Keys/touch menu: attack my target, engage all, protect me/target, break off. Works on
   existing AI roles; very high value for the Wing Commander premise and for the existing named wingmen.
2. **Power allocation (M).** Shared with TIE item 1; engine share sets top speed and boost energy as in FS [W1].
3. **Player system damage + support ship (M–L).** Disabled subsystems, a callable repair/rearm craft with a delay
   and a limited number of calls. Gives damage consequences and a recovery decision.
4. **Role-specialised primaries (S).** Anti-shield (energy) vs anti-hull (kinetic) guns with the existing typed
   damage multipliers `DMGX`; loadout choice in briefing.
5. **Briefing loadout select (S–M).** Choose guns and missile mix within a mission-defined set.
6. **Objective counters and failable primaries (S).** `Destroy FROGGs [3/8]`, blue/red state, mid-mission twist
   stages (e.g. reinforcements) [W1][W2].
7. **Match-speed and "target my attacker" keys (S).**
8. **Permanent attrition (S).** Carry hull damage and spent missiles between missions through the crew record.
9. **Capital-ship beams and flak (L).** Needs voxel-cost work (LOD) first.
10. **Data export (S).** Move SHIPS/MISSIONS to JSON for modding.

## Caveats
- Wikipedia summaries are secondary and thin on mechanics; anything [M] needs checking against the manual or
  the FS Open (SCP) documentation before it becomes a design requirement.
- Nostalgia is not evidence: "I loved it" is a reason to borrow the command layer, not proof that each FS2 mechanic
  suits a touch-first, single-file game. Wingman orders in particular need a thumb-friendly UI.

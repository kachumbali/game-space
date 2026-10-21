# Strategy layer: capturing star systems and resources (design proposal)

Origin: owner's idea (2026-10-21): a persistent strategy layer in a Wing Commander-like game; dogfight missions
fought **if the player chooses**. This is a proposal for review, not a commitment. Evidence base: our own repo,
`docs/FS2OPEN_STUDY.md`, plus general knowledge of the genre (marked [M], not verified).

## 1. The decision to make first
The idea merges two games. Risks worth stating before building:
- **Scope.** A strategy layer is a second game. Fighter combat is still being tuned (turn, damage, power). Building a
  big map now risks a shallow 4X plus a shallow sim. Recommendation: a *thin* layer first (below), with fighter
  depth continuing in parallel.
- **Why the player would fly.** If auto-resolve is always available, flying must pay off: better outcomes than
  the auto-resolve expectation, access to special objectives, and survivable named pilots. Otherwise players
  rationally skip the part that is the game's core. Needs explicit design, not an afterthought.
- **Persistence cost.** Everything below needs a saved world. localStorage is per browser/device; the owner tests on
  several devices, so export/import of the save (JSON file) is needed early, or the strategic state is lost.

## 2. Reference models [M]
- Wing Commander series: branching mission trees where win/loss changes which systems you fight over; the
  war is narrative-driven, not simulated.
- FreeSpace 2: campaign graph with persistent variables (study: section 5). No economy.
- Starlancer, Freelancer, X series: persistent economies, much more simulation than we can afford.
- Others in the 4X family (Master of Orion style): economy and fleets, combat abstracted.
Closest viable target: **WC-style narrative campaign with an explicit, small, legible strategic map**, not a
simulation of a galaxy.

## 3. Thin first version (MVP)
**Map.** 8-12 star systems on a graph (jump lanes). Each system: owner (human / FROGG / contested / neutral),
1-2 resources, a defence level, a supply link status. Static layout, hand-authored in data.

**Resources (3).** Fuel (jumps and sorties), Materiel (fighters, missiles, repairs), Intel (reveals enemy
strength and unlocks special objectives). Production per owned system per turn. Keep numbers few and legible.

**Turn.** One strategic turn = choose one action per fleet/task force: move, attack a system, defend, raid supply,
rest/repair. Enemy then acts by simple rules (weakest adjacent human system, supply raids).

**Resolution of a battle.** Player picks:
1. **Fly it:** a generated or authored dogfight mission built from the system's data (enemy composition from
   defence level, objectives from type: strike wave, convoy, capital strike, nav-point recon). Outcome and losses
   feed back.
2. **Auto-resolve:** expected result from force ratio with variance; always somewhat worse than a good flown result.
   Numbers must be explicit and tunable.

**Persistence.** The existing crew record (`gs_crew`, docs/VISION.md) extends to pilots with kills, wounds, death.
Ships, squadron strength and missile stocks carry over (FS2's persistent loadout/damage idea).

**Win and loss.** Hold the home system and take the FROGG hub within N turns, or collapse of supply.

## 4. How it plugs into the current code
| Need | Existing hook | New work |
|---|---|---|
| Mission generation | `MISSIONS[]` stages, `areas`, `looks` (41_sky) | Template builder from system data; reuse transits for jump arrival |
| Pilot persistence | crew record in localStorage | Pilot roster, injuries, replacements |
| Briefing/debrief | `75_mission.js` UI | Strategic map screen, result application |
| AI orders | `70_ai.js` roles | Order goals (FS2 study sec. 3) for wingmen |
| Disable/capture | none | Ion/disable weapon and capture objective, enables salvage and prisoners |
| Sim state | `50_state.js` | Strategic state object separate from sim state, serialised |

## 5. Open questions for the owner
1. Is the player a flight leader on a carrier (WC style) or a fleet commander who sometimes flies? This decides
   whether the player orders fleets or only requests them.
2. Real-time or turn-based strategy? Turn-based is far cheaper and fits phone play.
3. Do human and FROGG sides need different economies (asymmetry), or the same simple one at first?
4. Is a permanent loss (dead pilots, destroyed ships) acceptable on touch/casual sessions of 5 minutes?
5. How much of the narrative comes from authored missions versus generated?

## 6. Suggested sequence
1. Persistence foundation: saved world as JSON with export/import (S-M).
2. Power allocation, system damage, wingman orders (fighter depth; docs/TIE_FIGHTER_COMPARISON.md,
   docs/FREESPACE2_COMPARISON.md) in parallel.
3. Strategic map screen with 8 systems and one enemy rule set; mission template for 2 mission types (M-L).
4. Auto-resolve with explicit formula; pilot roster (M).
5. Playtest the "do I choose to fly?" question before adding systems or resources.

## Caveats
Effort labels are guesses. No playtest evidence exists for the strategic layer. Genre references marked [M] are
from memory and unverified.

# Vision

## Scope ladder
1. **Now**: fighter-scale missions (WC2 / X-Wing feel), one corvette per side, data-driven missions.
2. Full ship palette: fighters → bombers → corvettes → frigates → capitals → civilian (freighters, liners, tugs),
   TIE-Fighter-style mission variety (escort, inspect, defend, strike, recon).
3. Cut sequences between missions (WC2 / X-Wing / TIE style): briefing, flight deck, debrief, wardroom.
4. Higher voxel detail on the same ship data; optional I-War-style newtonian flight.

## Product modes

The game has four distinct modes. They share ships, weapons, art direction and
crew data where appropriate, but they do not silently turn into one another.

1. **Free Flight** is a low-commitment combat sandbox. Arcade rewards and
   experimental test flags belong here, never in campaign sorties.
2. **Skirmish** is a configurable one-off combat test: player-selected force,
   environment and challenge settings, with no strategic persistence.
3. **Scripted Campaign** is the authored Wing Commander-style narrative: fixed
   missions and branches, persistent named crew, mission briefings/debriefs,
   NAV transits and eventually ready-room/briefing scenes. It has no arcade
   drops, temporary buffs, perk loops or chain-score rewards.
4. **Strategy / Dynamic Campaign** is a separate optional turn-based war layer:
   a small strategic map, task forces, supply/fuel/crew consequences and a
   deliberate **Fly** or **Auto-resolve** choice for contested battles. Its
   generated missions use the combat engine, but it does not rewrite the
   authored Scripted Campaign.

The Dynamic Campaign begins with the documented thin 8-system design in
`docs/STRATEGY_LAYER.md`, not a full economic 4X simulation. Its persistent
state is versioned separately from the moment-to-moment combat state and must
support export/import before it is treated as a player-facing campaign.

## Persistent crew + state engine
Each pilot has a record (kills, sorties, status active/recovering/KIA, notes) stored as JSON (`CREW`,
localStorage `gs_crew`). Missions read and write it; outcomes (a wingman lost, a rival's kills) carry forward.
A deterministic state engine owns the truth (who is alive, relationships, flags); it never lets text generation
change facts.

## LLM layer
An LLM writes dialogue only, given a compact snapshot: character sheet, recent mission events, state flags.
Output is plain lines for the comm/wardroom UI, plus optional structured "memory" suggestions the engine may accept
or reject. In-mission comms stay scripted/templated for latency; wardroom/debrief conversations use the LLM.
Hook: `missionComm()` / debrief builder in `src/75_mission.js`.

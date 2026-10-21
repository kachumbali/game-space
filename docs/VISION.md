# Vision

## Scope ladder
1. **Now**: fighter-scale missions (WC2 / X-Wing feel), one corvette per side, data-driven missions.
2. Full ship palette: fighters → bombers → corvettes → frigates → capitals → civilian (freighters, liners, tugs),
   TIE-Fighter-style mission variety (escort, inspect, defend, strike, recon).
3. Cut sequences between missions (WC2 / X-Wing / TIE style): briefing, flight deck, debrief, wardroom.
4. Higher voxel detail on the same ship data; optional I-War-style newtonian flight.

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

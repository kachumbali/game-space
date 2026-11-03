# Pilot roster and progression

## Feature flag and compatibility

`tuning.roster.enabled` defaults to `false`. With it off the existing crew,
briefing, ejection and save behavior remain in use. For a local experiment,
serve the project and use `?db=data/db.json` after setting the flag in a local
copy of the database. Do not enable it for release without the owner's
hand-play and the campaign/device checks listed in the integration log.

Each campaign/carrier key owns a fixed pool: `rosterCapacity` on the carrier
sets the initial count (the tuning default covers carriers without an authored
capacity). Pools are created once and saved; ordinary replacement does not
create pilots. `rosterStoryArrival(key, pilot)` is the explicit scripted-only
addition hook and rejects duplicate IDs. A future dynamic campaign can call
`rosterForCarrier(key, shipId)` using a stable campaign and carrier key; that
mode does not yet exist and no dynamic campaign integration is claimed.

The versioned `gs_roster_v1` localStorage record contains the player and
carrier pools. New saves use generated fictional names and callsigns. The first
pool imports existing legacy crew counts, states and baseline skills, without
copying legacy names. A future-version save is left untouched and used in
read-only fallback mode. LocalStorage failures leave the current in-memory
session playable. Starting a new campaign resets the roster when enabled;
restart restores the roster snapshot from the start of the sortie.

## Pilot, rank, selection and awards

A pilot has an ID, callsign, generated name, rank, insignia, AI skill, kills,
missions, medal citations, status and optional traits. `ACTIVE` pilots can be
selected; `RECOVERING`, `KIA`, `MIA` and `CAPTURED` pilots cannot. KIA is
permanent. `RECOVERING` pilots return after the configured number of completed
missions that began while they were recovering. If the original player is not
active, the first active carrier pilot takes the player seat and is excluded
from the wing. If no player pilot is available, launch is disabled; an empty
wing alone never blocks launch.

The briefing provides touch/keyboard-accessible pilot buttons, AUTO-FILL and a
SERVICE RECORD view. The selected pilots replace the pre-created wing ships
before launch. The player rank insignia is also shown on the HUD. Rank
thresholds, insignia, recovery duration, skill step and medals live under
`tuning.roster` and are checked by `tools/validate_db.py`. Promotion requires
all three configured thresholds: kills, completed missions and medal count.
Rank adds small steps to the existing AI skill, capped at 5; no AI base values
are changed. The damage ribbon uses severe ship hull damage as a proxy because
there is not yet a separate pilot-wound simulation.

Debrief awards are unique by medal ID and carry their configured citation.
Available triggers cover first/5/10/20 kills, severe damage, a pilot recovered
by the recipient, successful SAR cover, a scripted return from captivity, and
an authored mission ID. Additional mission citations can be data entries.

## Rescue and outcome hook

An ejected pilot remains MIA while a capsule is adrift. Rescue changes the
record to RECOVERING; capture changes it to CAPTURED; destruction or expired
life support changes it to KIA. At sortie end an otherwise unresolved ejection
uses `rosterResolveMissing(friendly, enemy, random, cfg)`, the single hook for
later cutscene work. It weights recovery versus capture by surviving friendly
and hostile assets in the area; if neither side is present the pilot stays MIA.
A scripted return can call `rosterTransition` from CAPTURED to RECOVERING;
the next debrief grants the configured return citation. This does not change
capsule mechanics or produce cutscenes.

## Validation and limitations

`roster_unit.js` covers promotion, awards, skill, status, player succession,
pool exhaustion and weighted resolution. `roster_schema_unit.py` has an
invalid-data control. `pilot_roster_t.py` checks flag-off behavior, the briefing,
service record, KIA, awards and exhaustion; `roster_persistence_t.py` checks
reload, player succession and mission-counted recovery. `roster_rescue_t.py`
exercises actual ejection, recovery, capture and the rescue medal. The browser test writes
phone portrait and landscape screenshots to `GS_SHOTS` or `/private/tmp/roster-shots`.
The reviewed test snapshots are [portrait briefing](../assets/roster-review/briefing-portrait.png)
and [landscape service record](../assets/roster-review/service-record-landscape.png).

The scripted campaign dialogue still contains pre-authored callsigns and does
not yet dynamically rewrite every story line for a replacement pilot. The
roster's selected pilots and records are authoritative for gameplay, but this
narrative continuity needs a later pass. The service-record panel is scrollable;
review it on real phone/iPad hardware. No balance claim is made for the proposed
rank thresholds or for veteran-versus-rookie outcomes without seeded runs.

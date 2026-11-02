# Ejection and search and rescue

This experimental system is disabled by default in `tuning.rescue.enabled`.
When enabled, the existing cause-based ejection chance creates a drifting,
damageable capsule rather than immediately marking a pilot recovered. Life
support, capsule limit, pickup radius and time, safe period after a hit and
critical-hull threshold are in `data/db.json`. The critical warning offers
Shift+E or the touch EJECT button. A deliberate ejection bypasses the
destruction roll; an automatic ejection still uses it.

SAR cutters route to the nearest friendly beacon. Designated capital ships
and tenders can recover beacons in reach; designated FROGG ships can capture
them. Pickup stops while the rescuer has recently been hit or is targeted by
a missile. Recovery, capture, expiry and destruction update the crew record.
A player capsule drifts until rescued or lost; mission outcomes wait for the
player's rescue when possible. No rescue mechanics run with the flag off.

When enabled, two experimental sorties appear at the end of the Long Retreat
and as buttons on the Skirmish setup screen: BEACONS IN THE DARK and LAST
LIGHT. Protect the SAR cutter, keep the beacons alive and recover all survivors
before the timer expires. These scenarios, touch layouts, audiovisual alarm,
capsule rendering and rescue flight behavior still need cloud and real-device
testing before the feature can be enabled for players.

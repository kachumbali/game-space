# Campaign measurement, 2026-11-02 (main before lanes 1-4; 6 seeds per mission)

Bot: the simple pilot bot in `tools/tests/campaign_t.py`. Raw data: `docs/data/campaign_measure_2026-11-02.json`.

| Mission | Lost / 6 |
|---|---|
| Prologue 1 / 2 / 3 / 4 | 0 / 6 / 6 / 2 |
| Long Retreat 1 / 2 / 3 / 4 | 3 / 6 / 6 / 6 |
| Severed Node 1 / 2 / 3 / 4 / 5 | 3 / 5 / 6 / 5 / 6 |

Caveats for lane 5:
- The bot is crude. Many losses are the player dying in about 20 s ("MEOW DOWN"). A 100 % bot loss rate means "bot cannot do this", not necessarily "too hard for a human".
- Treat missions with 6/6 losses at under 30 s as the first tuning candidates (prologue 2 and 3, Long Retreat 2 to 4, Severed Node 3 and 5). Target for a human at NORMAL is a 10-60 % loss rate.
- Only change wave sizes, timings and spawn distances. Hand-play by the owner is the final check.
- Long Retreat 1 and later convoy missions were measured before lane 2 (convoy outcomes); re-measure with `CM_ONLY=long_retreat`.

## Good pilot bot (`BOT=good`, codex/pilot-bot), same day, 6 seeds, main incl. lanes 1-4

Raw data: `docs/data/campaign_measure_goodbot_2026-11-02.json`. Lost / won out of 6:

| Mission | Lost | Won |
|---|---|---|
| Prologue 1 / 2 / 3 / 4 | 0 / 5 / 4 / 2 | 6 / 1 / 1 / 4 |
| Long Retreat 1 / 2 / 3 / 4 | 3 / 4 / 6 / 6 | 3 / 2 / 0 / 0 |
| Severed Node 1 / 2 / 3 / 4 / 5 | 6 / 2 / 6 / 6 / 6 | 0 / 4 / 0 / 0 / 0 |

Missions with 6/6 losses even for the good bot: Long Retreat 3 and 4, Severed Node 1, 3, 4, 5. Severed Node 1 is odd (simple bot lost 3/6, good bot 6/6 after about 195 s): check bot behaviour on that mission (objective type) before tuning waves.

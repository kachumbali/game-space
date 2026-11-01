# Nuclear implementation audit

Status: code inspection on 2026-11-01; this is **not** a balance certification.
The answer to “is nuclear combat implemented as stated?” is **no**. The game
has a playable, test-bench NK-1 burst, while the release-safe campaign system
specified in `docs/NUKES.md` section 6 remains unimplemented.

## What works now

- `data/db.json` defines one NK-1 tactical missile, nominally 0.5 kT.
- `src/60_weapons.js` includes it in missile selection and resolves an impact
  or proximity detonation through `nukeAt`.
- The burst applies inverse-square fluence, standard armour/shield damage,
  flash blindness, and a shield-reduced crew-dose calculation to every nearby
  live ship, friend or foe.
- Free flight can add warheads with `?nuke=N` and set a 0.1–10 kT per-ship
  dial with `?nukeKt=`.
- A wingman killed by nuclear damage gets a lower ejection chance in
  `src/75_mission.js`.

## What differs from the stated design

| Required in `docs/NUKES.md` | Current behaviour | Status |
|---|---|---|
| Spark, Brand and Anvil families | One `nuke` entry only | missing |
| Release authority and mission budget | Any player with a loaded NK-1 can fire it | missing |
| ARM hold, safe separation and keep-clear interlock | Generic 0.35-second missile delay | missing |
| Safe/inert hard kill and scuttle | A PD hard kill detonates a live NK-1 at full yield | contradicts design |
| Exeter launch cells and vault | No nuclear launcher, magazine component, or stock | missing |
| Wingman/comms nuclear orders | AI has no explicit nuclear order, and no release menu | missing |
| Campaign stock, allocation and debrief accounting | Free-flight-only test flag | missing |
| EMP and turret-optics suppression | `blindUntil` is set, but the proposed EMP and turret gating are absent | incomplete |
| Capital crew degradation | Dose at/above the threshold calls `killShip` on all crewed hulls | contradicts proposed `crewFrac` derelict model |
| Dedicated automated nuclear tests | No `tools/tests/nuke_t.py` | missing |

## Consequence for campaigns

No campaign briefing should promise a controlled nuclear strike, a finite
warhead stock, or safe friendly-force coordination. The current NK-1 is useful
for isolated free-flight experiments only. It should remain unavailable to AI
and campaign loadouts until the minimum viable safety slice below exists.

## Recommended build order

1. Add `nuke_t.py` first: fluence/dose table, friendly-fire case, and
   intercepted-missile behaviour.
2. Make NK-1 stateful: authorised, armed, safe-separation, live, and inert
   scuttle/hard-kill outcomes.
3. Add mission budget and briefing/HUD release state before making a warhead
   selectable in a campaign.
4. Add Exeter cells/vault and only then consider multiple warhead families.
5. Measure at least 20 seeded scenarios per published nuclear balance claim.

The detailed multi-warhead design remains a useful target, but should be
implemented in slices with a test for each safety rule, rather than imported as
one large unverified combat change.

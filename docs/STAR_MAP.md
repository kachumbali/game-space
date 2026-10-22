# Star map: the neighbourhood of Sol for the strategy layer (design proposal, nothing implemented)

Status: **research and design proposal.** Written 2026-10-22 for the owner's request for a strategy layer in which humans and
FROGGs harvest star systems (`docs/STRATEGY_LAYER.md`, `docs/ECONOMY.md`, `docs/FLEET_LOGIC.md`). Companion document:
`docs/STRATEGY_MECHANICS.md`. Machine-readable table: `docs/data/stars.csv`. No code was changed.

## 0. How to read the evidence, and what the research could and could not do

Tags used throughout:
- **[S]** seen in a *search-result summary* on 2026-10-22. In this session the page-fetch tool failed for every host I tried
  (`getaddrinfo ENOTFOUND` for en.wikipedia.org and exoplanetarchive.ipac.caltech.edu), and a direct request to the NASA
  Exoplanet Archive from the shell was blocked. So **no page was opened**. The search tool returns a model-written summary
  with links; a value tagged [S] was stated in such a summary and attributed to a listed page, but I did not read that page.
  Treat [S] as "one secondary report", weaker than the [V] used in `docs/ECONOMY.md` (which meant a fetched extract).
- **[M]** from my memory of the literature, not checked in this session. Includes **all RA/Dec values** and every
  luminosity not marked [S]. Memory can be off by a few percent, and for planets by whole planets (several nearby-planet
  claims have been revised or retracted).
- **[C]** computed by me from other values (method in section 4). A [C] value is only as good as its inputs.
- **[I]** invented game content (roles, hubs, lane tiers, resource ratings). Not data.

Consequence: this map is good enough to design with and **not good enough to be quoted as astronomy**. Before any value
is shown to players as fact, re-check it against the NASA Exoplanet Archive and SIMBAD (section 9 lists what to check).

## 1. Decision: 50 ly or 100 ly bubble

| Criterion | 50 ly | 100 ly |
|---|---|---|
| Systems available | Order of 10^3 stars by volume scaling [C]: the 20 ly sphere holds 131-133 listed objects including brown and white dwarfs [S, Wikipedia "List of nearest stars"]; (50/20)^3 = 15.6x volume, so ~2,000 by naive scaling, fewer in practice because faint M dwarfs are incompletely catalogued. Enough for 20 interesting systems with many to spare. | ~8x the volume of 50 ly, order of 10^4. More than any design can use; 20 would be an arbitrary sample, and the best ones (Alpha Cen to Fomalhaut) would be a small cluster in the middle. |
| Confirmed-planet systems | 106 confirmed exoplanets within 10 pc (32.6 ly) [S, Wikipedia "List of nearest exoplanets"]; a few dozen host systems inside 50 ly [M]. All of the "famous" systems requested fit. | Hundreds of hosts [M]; Kepler targets only start well beyond 100 ly [M], so "Kepler-?" systems are not in either bubble. |
| Travel time (game) | With a 12 ly standard jump (section 7) the far edge is ~4-5 jumps from Sol. A campaign of 25-40 turns (`docs/ECONOMY.md` 5.1) crosses it, with lanes mattering. | ~9 jumps edge to edge: most of a 30-turn campaign is transit; the map becomes a corridor. Needs a bigger jump range, which erodes the "frigate is precious" constraint. |
| Frigate count | 2-4 frigates (owner decision, `docs/OPEN_QUESTIONS.md` 15) can cover 20 nodes. | Would need many more pieces or longer lanes. |
| FROGG origin | The hive can arrive **from outside the bubble** at its southern edge (section 8) and take ~4 jumps to reach Sol: a visible, telegraphed clock. | The hive's origin would need to be inside the bubble or be unreachably far; the clock is too long. |
| Realism of the Sol-centred view | Everything within 50 ly is "the neighbourhood" in the popular sense; the real data are best known here [M]. | Data quality drops (fainter stars, more uncertain planets) [M]. |

**Recommendation: 50 ly.** All 20 chosen systems lie at 4.4-49 ly. A 100 ly option is better treated as a later
expansion pack (e.g. Beta Pictoris at ~63 ly [M], not in this map). The argument rests on game-design reasoning [I]; nothing
verified forces either choice.

## 2. The 20 systems (plus Sol): real data

Columns: distance in ly (d), equatorial J2000 RA/Dec [M], galactic Cartesian x,y,z in ly relative to Sol [C] (x toward the
galactic centre, y toward galactic rotation, z toward the north galactic pole), spectral class, luminosity L in solar units,
and sqrt(L) in AU, the orbit where sunlight equals the solar constant at Earth (**[C]**: flux scales with L / r^2).
Distances and classes marked [S] in section 9; the rest [M]. Binaries/triples are treated as **one node** at the primary's
position (components separated by far less than the lane resolution).

| # | Id | System | d (ly) | RA (J2000) | Dec | x | y | z | Class | L (Lsun) | sqrt(L) AU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | SOL | Sol | 0 | - | - | +0.0 | +0.0 | +0.0 | G2V | 1 | 1.00 |
| 1 | ACEN | Alpha Centauri | 4.37 | 14h 39.6m | -60.83 | +3.1 | -3.0 | -0.1 | G2V+K1V (+M5.5V Proxima) | ~2.0 (A 1.5 + B 0.45 [S]) | 1.41 |
| 2 | BARN | Barnard's Star | 5.96 | 17h 57.8m | +4.69 | +5.0 | +3.0 | +1.4 | M4V | 0.0035 | 0.06 |
| 3 | W359 | Wolf 359 | 7.86 | 10h 56.5m | +7.01 | -1.9 | -3.9 | +6.5 | M6V | 0.001 | 0.03 |
| 4 | L211 | Lalande 21185 | 8.03 | 11h 03.3m | +35.97 | -3.3 | -0.3 | +7.3 | M2V | 0.026 | 0.16 |
| 5 | SIRI | Sirius | 8.6 | 06h 45.1m | -16.72 | -5.8 | -6.2 | -1.3 | A1V + DA white dwarf | ~25 | 5.00 |
| 6 | EERI | Epsilon Eridani | 10.5 | 03h 32.9m | -9.46 | -6.8 | -1.9 | -7.8 | K2V | 0.34 | 0.58 |
| 7 | 61CY | 61 Cygni | 11.4 | 21h 06.9m | +38.75 | +1.5 | +11.2 | -1.2 | K5V + K7V | 0.23 (both) | 0.48 |
| 8 | PROC | Procyon | 11.46 | 07h 39.3m | +5.22 | -9.3 | -6.2 | +2.6 | F5IV-V + DQZ white dwarf | ~7 | 2.63 |
| 9 | EIND | Epsilon Indi | 11.87 | 22h 03.4m | -56.79 | +7.3 | -3.2 | -8.8 | K5V (+2 brown dwarfs) | 0.22 | 0.47 |
| 10 | TCET | Tau Ceti | 11.9 | 01h 44.1m | -15.94 | -3.4 | +0.4 | -11.4 | G8.5V | 0.52 | 0.72 |
| 11 | LUYT | Luyten's Star (GJ 273) | 12.4 | 07h 27.4m | +5.23 | -10.3 | -6.5 | +2.2 | M3.5V | 0.009 | 0.09 |
| 12 | G876 | Gliese 876 | 15.3 | 22h 53.2m | -14.26 | +4.8 | +6.1 | -13.2 | M4V | 0.0124 | 0.11 |
| 13 | G581 | Gliese 581 | 20.4 | 15h 19.4m | -7.72 | +15.5 | -1.6 | +13.1 | M3V | 0.012 | 0.11 |
| 14 | G667 | Gliese 667 C | 23.6 | 17h 18.9m | -34.99 | +23.4 | -3.4 | +0.6 | M1.5V (in a K+K+M triple) | 0.014 | 0.12 |
| 15 | VEGA | Vega | 25.0 | 18h 36.9m | +38.78 | +9.1 | +21.8 | +8.2 | A0V | 30-50 (reports differ) | 6.32 |
| 16 | FOMA | Fomalhaut | 25.1 | 22h 57.7m | -29.62 | +10.0 | +3.7 | -22.7 | A4V | ~16-17 | 4.07 |
| 17 | TRAP | TRAPPIST-1 | 40.7 | 23h 06.5m | -5.04 | +7.8 | +21.0 | -34.0 | M8V | 0.00055 | 0.02 |
| 18 | H698 | HD 69830 | 41.0 | 08h 18.4m | -12.63 | -23.2 | -32.6 | +9.1 | K0V | 0.6 | 0.77 |
| 19 | 55CN | 55 Cancri | 41.0 | 08h 52.6m | +28.33 | -31.1 | -9.4 | +25.1 | G8V (+M dwarf B) | 0.58 | 0.76 |
| 20 | L114 | LHS 1140 | 49.0 | 00h 44.9m | -15.27 | -4.3 | +9.2 | -47.9 | M4.5V | 0.0038 | 0.06 |

Luminosity in the table uses the sqrt(L) column for the "solar-constant orbit". Vega's L is shown as a range because the
sources I saw disagree (a review gave ~30 [S], my memory says ~40 [M]); the sqrt value uses 40.

Why these 20 (selection, a design judgement [I]): all requested systems that lie inside 50 ly are included except
Gliese 12 and similar fringe planets that add nothing new; the requested "Kepler-?" systems lie beyond the bubble and are
omitted. I added **Luyten's Star** (habitable-zone planet reported [M], 1.1 ly from Procyon, which makes a natural double
node), **HD 69830** (the nearest star with a known asteroid-belt-like dust band plus planets [M]) and **LHS 1140** (a quiet
red dwarf with a habitable-zone super-Earth [S]) to fill the far edge. Not included although inside 50 ly: Altair
(16.7 ly [M], no known planets), Teegarden's Star, YZ Ceti, Gliese 1061, Gliese 687, Gliese 674, Gliese 436 (all [M], none
adds a mechanic the 20 do not cover). This list can be swapped without touching the rules.

## 3. Resource and station suitability per system

Everything here is a **mix of real data and invented rating [I]**. The harvest columns say what the real system suggests; the
game does not need the real planet to be exactly as stated. "Fusion fuel" means deuterium and helium-3 in game terms: both
are mainly obtainable from gas and ice giants and from ices [M: D/H in giant planets and comets is nonzero everywhere; He-3
is concentrated in giant-planet atmospheres in the standard proposals]. No system's fuel inventory is measured.

| Id | Planets / belts relevant to harvesting | Solar station | Fusion fuel | Hazards | Suggested role [I] |
|---|---|---|---|---|---|
| SOL | Asteroid belt, giant planets, Kuiper-belt ices [M]. Home. | Medium (L = 1); inner slots rich | Gas/ice giants (Jupiter to Neptune) [M] | None needed | **Human home**, capital, Depot L3 |
| ACEN | Proxima b is a planet in its star's habitable zone, ~11 d orbit [S]; no other confirmed planet that I could verify [M]. A and B are a Sun-like and a K dwarf | Good (A 1.5, B 0.45 [S]) | Unknown: no confirmed giant [M] | Proxima is a flare star; one superflare flashed ~14,000x brighter in 2019 [S] | **Human colony 1**, forward shipyard; flares force shielded stations |
| BARN | Four sub-Earth planets in 2.3-6.7 day orbits; none in the habitable zone (10-42 d) [S]; belts unknown | Poor (L 0.0035): station must orbit at ~0.06 AU | No giants known | Old, relatively quiet M dwarf [M]; hot compact orbits | **Human mining outpost** (rock and metal only) |
| W359 | No confirmed planet that I verified [M]; a candidate was reported at some point and its status is not known to me | Very poor (0.001) | None | Young, very active flare star [M] | **Contested / empty** with a flare-hazard tag |
| L211 | Planets reported (at least b and c) [M]; details unverified | Poor-medium (0.026) | Possibly one cold giant [M] | Moderate flare activity [M] | **Human colony 2** (Wolf-Lalande pair, 4.0 ly apart [C]) |
| SIRI | No known planets [M]; Sirius B is a white dwarf (8.58 ly [S]) | **Very high** (L ~25): the best solar prize | None known: needs imported fuel | UV-rich A star; a white dwarf companion [S] | **Contested prize**: big solar hub, no organic fuel |
| EERI | Giant planet b, ~1 Jupiter mass at ~1 arcsec separation [S]; **two dust belts and an outer disc out to ~60 AU** [S for the disc extent, M for the belt count]; warm dust 3-40 AU [S] | Medium (0.34), inner slot at 0.58 AU | Giant planet and a cometary disc (ices) | Young (400-800 Myr [S]), more active than the Sun [M] | **Contested**, richest asteroid/ice harvest of the near ring |
| 61CY | Binary K dwarfs; no confirmed planets that I verified [M] | Low-medium (0.23) | None known | Moderate activity [M] | **Human outpost / junction** toward Vega |
| PROC | No known planets [M]; F star with a white-dwarf companion (11.46 ly, 40.84 yr orbit [S]) | **High** (~7) | None known | UV-rich F star | **Contested solar hub**; pairs with Luyten (1.1 ly) |
| EIND | Epsilon Indi Ab: a cold (about 275 K [S]) ~6.3 Jupiter-mass planet imaged by JWST at ~28 AU [S]; two brown dwarfs | Low-medium (0.22) | **Good**: one real, cold super-Jupiter | Brown dwarfs add little hazard | **Human fuel colony** (gas skimming) or contested |
| TCET | G8.5V; debris disc; candidate planets e (163 d) and f (636 d) inside the habitable zone, **unconfirmed** [S]; HZ ~0.55-1.16 AU [S] | Medium (0.52) | Disc ices; no giant known | Low activity, old (~5.8 Gyr [S]) | **Contested**: the Sun-like prize; hive target |
| LUYT | Reported planets incl. a habitable-zone super-Earth [M]; unverified here | Poor (0.009) | None known | Quiet-ish M dwarf [M] | **Human colony 3** (Procyon cluster) |
| G876 | At least four planets, outer three in a Laplace resonance [S]; two are Jupiter-mass giants [M] | Poor (0.0124), inner slot at 0.11 AU | **Very good**: giant planets | Flare activity moderate [M] | **Fusion-fuel front**; contested, gateway of the southern chain |
| G581 | Up to six reported planets, habitability disputed, some signals not confirmed [S] | Poor (0.012) | None known | Quiet M dwarf [M] | **Empty / human outpost** (east arm) |
| G667 | Five confirmed planets per the NASA archive; three super-Earths in the habitable zone reported (c, e, f) [S]; part of a triple with two K dwarfs [M] | Poor-medium (0.014); AB pair adds light | Unknown | Triple system dynamics | **Human colony 4** (east arm) |
| VEGA | Debris disc [M]; no confirmed planets that I verified [M] | **Very high** (30-50); fast rotator [M] | Disc ices | Intense UV; ~450 Myr [S] | **Solar prize / empty** at the end of the east arm |
| FOMA | Large debris ring ~21.5 billion miles across (~230 AU) [S]; "Fomalhaut b" is probably a dust cloud, not a planet [S, disputed] | **High** (~16) | Ring ices and dust | Collisions in the ring: debris | **Contested, FROGG first target** (rich ring) |
| TRAP | Seven rocky planets in very tight orbits [S]; star M8, L 0.00055 [M]; planets at ~0.01-0.06 AU [M] | Very poor in absolute terms but the planets sit where flux is Earth-like | None known | Flare-active ultracool dwarf [S: flares mentioned as a habitability challenge] | **FROGG hive area** (dense rock, low defences) |
| H698 | Three Neptune-mass planets and a warm dust band inside ~1 AU reported as asteroid-belt-like [M] | Medium (0.6) | Neptune-mass planets (ices) | Quiet K dwarf [M] | **Remote mining prize** on a deep lane |
| 55CN | At least five planets [S], including a hot Jupiter (b) and the hot super-Earth e [M]; companion M dwarf | Medium (0.58) | Giants present | Close-in planets irrelevant; companion star | **Remote fuel/metal prize** on a deep lane |
| L114 | Super-Earth b in the habitable zone; star M4.5V with L = 0.0038, unusually quiet with no major flares found [S]; distance 49 ly [S] (older 41 ly figure superseded [S]) | Poor | None known | Low | **FROGG arrival edge**, then hive area |

"Habitable zone" in the sense of the table is where liquid water *could* exist on a planet; the game does not need
habitability except for **colony yield** (population, recruits). Habitable-zone entries for TCET, G581 and G667 are claims
that have been revised in the literature [S]; do not rely on them.

## 4. How the coordinates were computed [C]

1. For each system: distance d in ly (table), RA/Dec (J2000, from memory [M]).
2. Equatorial unit vector: (cos Dec cos RA, cos Dec sin RA, sin Dec) times d.
3. Rotated to galactic coordinates with the standard J2000 equatorial-to-galactic matrix (the one in the Hipparcos
   documentation, which I used from memory [M]):
   `[-0.0548756 -0.8734371 -0.4838350; +0.4941094 -0.4448296 +0.7469822; -0.8676661 -0.1980764 +0.4559838]`.
4. Result (x toward the galactic centre, y toward rotation, z toward north galactic pole). Proper motion is ignored: in the
   timescale of the game it is irrelevant; Barnard's Star moves ~10 arcsec/yr [M] and would be at most a few hundredths of a
   light-year different over centuries.
5. Sanity checks I did: |xyz| equals d for every row by construction. Independent plausibility: Alpha Centauri at about
   l = 315.7 deg, b = -0.7 deg [M] gives x = +3.1, y = -3.0, z = -0.1, which is what the table shows; Sirius at about
   l = 227 deg, b = -9 deg [M] gives x = -5.8, y = -6.2, z = -1.3, also as in the table. These two checks use remembered
   galactic longitudes, so they test the matrix and the arithmetic, not the RA/Dec values themselves.
6. The script is not committed (a throwaway); the numbers can be regenerated from `docs/data/stars.csv` (columns `ra_h, ra_m, dec_deg, dist_ly`).

## 5. Map sketch (top-down x-y, galactic frame; z listed below) [C]

Scale: 1 column = 1 ly (x, to the right = toward the galactic centre), 1 row = 2 ly (y, up = toward galactic rotation).
Sol is `@` at column 34 of 72, row 12. Letters are the ids from the legend.

```
+------------------------------------------------------------------------+
|                                                                        |
|                                           O                            |   O Vega         y +22
|                                          Q                             |   Q TRAPPIST-1   y +21
|                                                                        |
|                                                                        |
|                                                                        |
|                                    G                                   |   G 61 Cygni     y +11
|                              T                                         |   T LHS 1140     y +9
|                                                                        |
|                                       L                                |   L Gliese 876   y +6
|                                            P                           |   P Fomalhaut    y +4
|                                       B                                |   B Barnard      y +3
|                               DJ @                                     |   D Lalande, J Tau Ceti, @ Sol
|                           F                      M                     |   F Eps Eridani, M Gliese 581
|                                C    A   I               N              |   C Wolf 359, A Alpha Cen, I Eps Indi, N Gliese 667C
|                        KH  E                                           |   K Luyten, H Procyon, E Sirius
|                                                                        |
|   S                                                                    |   S 55 Cancri
|                                                                        |
|                                                                        |
|                                                                        |
|                                                                        |
|                                                                        |
|                                                                        |
|           R                                                            |   R HD 69830
+------------------------------------------------------------------------+
```

Reading aid: this is a projection, so letters that look close may be separated in z. Sorted by z (ly, [C]):

| z band | Systems (z in ly) |
|---|---|
| +20 to +26 | 55 Cancri +25.1 |
| +5 to +14 | Gliese 581 +13.1, HD 69830 +9.1, Vega +8.2, Lalande +7.3, Wolf 359 +6.5 |
| -3 to +3 | Procyon +2.6, Luyten +2.2, Barnard +1.4, Gliese 667C +0.6, Alpha Cen -0.1, 61 Cygni -1.2, Sirius -1.3 |
| -14 to -4 | Epsilon Eridani -7.8, Epsilon Indi -8.8, Tau Ceti -11.4, Gliese 876 -13.2 |
| -25 to -15 | Fomalhaut -22.7 |
| below -25 | TRAPPIST-1 -34.0, LHS 1140 -47.9 |

Shape [C]: the near ring (Sol to ~12 ly, 11 systems) is compact and roughly spherical; the **southern arm** (Tau Ceti, Gliese
876, Fomalhaut, TRAPPIST-1, LHS 1140) runs toward negative z; the **eastern arm** (Gliese 581, Gliese 667C, Vega) lies
toward +x/+y; the two **isolated prizes** (HD 69830, 55 Cancri) hang to the -x side, 29-31 ly from anything.

A player-facing map would need a stylised layout (equal-spacing, lanes as lines), not this projection. The projection is
the reference for lane lengths.

## 6. Real data versus invented content

| Real or claimed-real (checked as in section 9) | Invented [I] |
|---|---|
| Names, distances, spectral classes, rough luminosities | Roles (home, colony, FROGG area, prize) |
| Planet counts and the existence of discs/belts, with the caveats in section 3 | Resource ratings (metal, fuel), "richness" numbers, which body is mined |
| Flare-star status (Proxima, Wolf 359 [M], TRAPPIST-1 [S]) | Hazard levels as game numbers |
| Relative geometry (x, y, z) | The jump-lane tiers, jump time and fuel cost (section 7) |
| Habitable-zone distance sqrt(L) AU | Station slots, power output, yields (`docs/STRATEGY_MECHANICS.md`) |
| | FROGG origin and route (section 8) |

Where real knowledge conflicts with game needs (e.g. Fomalhaut b is probably not a planet [S]; Sirius has no known planets),
the game may add fictional bodies. **If it does, they must be marked fictional in the in-game system sheet** and in the CSV
column `provenance`, so that a player is not told a false planet exists.

## 7. Jump lanes under the rule "only frigates and larger jump" (proposal [I])

The rule (`docs/FLEET_LOGIC.md` 8) makes the frigate the strategic mobility unit. The existing economy sets the jump price
(`docs/ECONOMY.md` 6.3: 2 F per lane-length unit, frigate tank 12 F, 1 turn per jump) for an abstract 5-system map. **This
document changes the unit: 1 F per light-year.** With a 12 F tank that gives a **standard jump range of 12 ly** (a full tank
for one maximum jump). Nothing else in the economy has to change.

Three lane tiers, all derived from the computed distances above:

| Tier | Length | Time | Fuel | Condition |
|---|---|---|---|---|
| A. Standard | <= 12 ly | 1 turn | 1 F per ly (tank 12) | Frigate only. Everything docked travels with it |
| B. Long | 12 to 22 ly | 2 turns (one turn charging, one turn jumping; vulnerable while charging) | 1 F per ly | Needs +10 F beyond the tank: a logistics ship (tanker) docked in a corvette cradle, or a Fusion Hub at the origin that tops off beyond the tank (STRATEGY_MECHANICS.md 6) |
| C. Deep | 29 to 31 ly | 3 turns | 1 F per ly | Needs both a tanker and a **jump beacon** at the destination (a Tier-II hub unlock) |

Jump time of 1 turn follows the existing "1 turn per jump" in ECONOMY 6.3; the physical interpretation (a turn is an
operational cycle, not a calendar unit) is kept. FROGGs: see section 8 and `docs/FLEET_LOGIC.md` 8, open question 3.

### 7.1 Tier A lanes (<= 12 ly), by node, nearest first [C]

| Node | Tier A neighbours (ly) |
|---|---|
| SOL | ACEN 4.4, BARN 6.0, W359 7.9, L211 8.0, SIRI 8.6, EERI 10.5, 61CY 11.4, PROC 11.5, EIND 11.9, TCET 11.9 |
| ACEN | SOL 4.4, BARN 6.5, W359 8.3, SIRI 9.5, EIND 9.7, L211 10.2 |
| BARN | SOL 6.0, ACEN 6.5, 61CY 9.3, L211 10.7, W359 11.0 |
| W359 | L211 4.0, SOL 7.9, ACEN 8.3, PROC 8.7, SIRI 9.0, LUYT 9.8, BARN 11.0 |
| L211 | W359 4.0, SOL 8.0, PROC 9.6, ACEN 10.2, LUYT 10.6, BARN 10.7, SIRI 10.8 |
| SIRI | PROC 5.3, LUYT 5.8, EERI 7.8, SOL 8.6, W359 9.0, ACEN 9.5, L211 10.8 |
| EERI | TCET 5.5, SIRI 7.8, SOL 10.5, PROC 11.5, LUYT 11.6 |
| 61CY | BARN 9.3, SOL 11.4 |
| PROC | LUYT 1.1, SIRI 5.3, W359 8.7, L211 9.6, SOL 11.5, EERI 11.5 |
| EIND | ACEN 9.7, G876 10.6, TCET 11.5, SOL 11.9 |
| TCET | EERI 5.5, G876 10.1, EIND 11.5, SOL 11.9 |
| LUYT | PROC 1.1, SIRI 5.8, W359 9.8, L211 10.6, EERI 11.6 |
| G876 | TCET 10.1, EIND 10.6, FOMA 11.1 |
| FOMA | G876 11.1 |
| G581, G667, VEGA, TRAP, H698, 55CN, L114 | none |

37 Tier A lanes join 14 nodes, and Sol has 10 of them. That is **dense and Sol-centred**: nearly every near-ring system is
one jump from Sol, so the map has few chokepoints. Possible fix (a lever, section 10 of the mechanics document): keep only
lanes <= 10 ly for ordinary travel and treat 10-12 ly lanes as Tier B. At <= 10 ly, 12 nodes are still connected to Sol with
20 lanes [C]. I recommend 12 ly for the first build because it reaches Tau Ceti, Gliese 876 and Fomalhaut and keeps the
tank number clean; revisit after the first playtest.

### 7.2 Tier B and C lanes to connect the outer systems [C, selected by me]

| Lane | Length (ly) | Tier |
|---|---|---|
| G581 - G667 | 14.9 | B |
| BARN - G581 | 16.4 | B |
| 61CY - VEGA | 16.0 | B |
| EIND - FOMA | 15.8 | B (alternative to the Tier A route via G876) |
| FOMA - TRAP | 20.7 | B |
| TRAP - L114 | 21.9 | B |
| H698 - 55CN | 29.2 | C |
| LUYT - H698 | 29.9 | C |
| LUYT - 55CN | 31.0 | C |

With these, all 21 nodes are connected. Hop counts from Sol (nodes counted at one hop per lane regardless of tier): Alpha
Cen 1, Vega 2, Gliese 581 2, Gliese 667C 3, TRAPPIST-1 4, LHS 1140 5, HD 69830 and 55 Cancri 3 via Sirius and Luyten (but the last lane is 29-31 ly:
3 turns). In *turn* terms the farthest node (LHS 1140) is Sol -> Tau Ceti (1) -> Gliese 876 (1) -> Fomalhaut (1) ->
TRAPPIST-1 (2) -> LHS 1140 (2) = 7 turns for an unhindered frigate, plus charging and refuel stops [C].

### 7.3 What the lane model implies for the existing rules [D]

- One frigate fully tanked cannot make two consecutive maximum jumps; it must refuel at a Fuel source, a depot or a Fusion Hub
  (ECONOMY 6.3 has the refuel rule already). The refuel stop is the strategic constraint, as hoped in ECONOMY O6.
- Outer systems become reachable only by building the support chain (hubs with fuel) in advance. That is the "harvest and
  logistics" game the owner described.
- Lane length uses real 3D distances; a stylised map can show them as line weights.

## 8. FROGG origin, route and role placement [I]

- **Origin: outside the bubble, to the south (negative z), beyond LHS 1140.** The first contact is at **LHS 1140 / TRAPPIST-1**,
  the second at **Fomalhaut**, the third **Gliese 876 / Tau Ceti**, then the near ring. The hive follows the Tier B/A chain, so
  the human side sees a **long, visible approach of ~7 turns of frigate travel** (section 7.2), consistent with the
  "depletion clock" in ECONOMY 3.5.
- This does not violate any lore: LORE says only "migratory hive" and "move from system to system consuming resources".
  Whether FROGGs follow human lanes is `FLEET_LOGIC.md` 8 open question 3; this proposal assumes they **do**, for symmetric AI.
- **East arm** (Gliese 581/667C/Vega) and the **two deep prizes** are safe from the first contact, giving the player somewhere
  to expand: the human growth room. The eastern arm is reachable only by Tier B lanes, so it costs fuel and time.
- **Human start:** Sol (capital), Alpha Centauri (colony 1), then 1-2 others by scenario.
- The Sirius / Procyon / Luyten cluster (three systems within 6 ly of each other) is the best **solar** region of the map and
  sits on the side opposite the FROGG arrival; strategic tension: the humans' strongest power sources lie behind their
  weakest defence line.

## 9. Sources and how each was checked (accessed 2026-10-22)

Method for all rows: **WebSearch (extended or standard), reading the returned summary**. Pages were *not* opened (fetch
failed for DNS reasons). "Check status" gives what the summary supports. Nothing here is quoted at length.

| Fact | Source URL | Check status |
|---|---|---|
| Proxima 4.24 ly M5.5Ve, Alpha Cen A G2V / B K0V (L 1.5 / 0.45), Barnard 5.96 ly M4.0V, Wolf 359 7.856 ly M6V, Lalande 21185 8.03 ly M2V | https://en.wikipedia.org/wiki/List_of_nearest_stars_by_spectral_type ; https://sites.uni.edu/morgans/astro/course/Notes/section2/nearest.html | [S], from a summary quoting list rows. B is K0V in that summary; I wrote K1V from memory in the table, a difference of one subclass. |
| 131 (or 133) objects within 20 ly; Sirius A brightest, >25 L | https://en.wikipedia.org/wiki/List_of_nearest_stars | [S] count; "more than 25 times" luminosity from https://www.astronomy.com/science/explore-the-10-nearest-stars/ [S] |
| 106 confirmed exoplanets within 10 pc; GJ 887 second-nearest HZ planet | https://en.wikipedia.org/wiki/List_of_nearest_exoplanets | [S] |
| Barnard's Star: four planets, 2.34-6.74 d, none in HZ (10-42 d), confirmed March 2025 | https://aasnova.org/2025/03/11/confirmed-at-last-barnards-star-hosts-four-tiny-planets/ ; https://www.dlr.de/en/wr/about-us/departments-1/extrasolar-planets-and-atmospheres/news-from-our-department-epa/barnards-star-actually-hosts-four-planets | [S], two independent outlets in the results |
| Proxima b in HZ, ~11 d orbit, 2019 superflare ~14,000x brighter | https://www.scientificamerican.com/article/superflare-wallops-nearest-exoplanet-proxima-b/ ; https://www.space.com/39829-nearest-exoplanet-proxima-b-superflare.html | [S] |
| Epsilon Indi 11.867 ly, K5V + two brown dwarfs, Ab ~6.3 M_Jup, JWST image, ~275 K | https://en.wikipedia.org/wiki/Epsilon_Indi ; https://www.nature.com/articles/s41586-024-07837-8 | [S]. The orbit period (171-174 yr) differs between sources in the summary |
| Epsilon Eridani 3.22 pc, K2, disc to ~60 AU (Fermi study) or warm dust 3-40 AU (JWST/MIRI) | https://ui.adsabs.harvard.edu/abs/2019ApJ...878....8R ; https://iopscience.iop.org/article/10.3847/1538-3881/adfcd6 ; https://arxiv.org/pdf/1703.10330 | [S]. L = 0.34 and the two-belt count are [M] |
| Tau Ceti G8.5V, 3.65 pc, ~5.8 Gyr, L ~0.52, candidates e (163 d) and f (636 d), HZ 0.55-1.16 AU, unconfirmed | https://arxiv.org/pdf/1708.02051 ; https://www.universetoday.com/99091/five-planets-around-nearby-star-tau-ceti-one-in-habitable-zone ; https://astrobiology.com/2020/10/28/an-integrated-analysis-with-predictions-on-the-architecture-of-the-tau-ceti-planetary-system-includi/ | [S] |
| Procyon 11.46 ly, F5 IV-V, white-dwarf companion DQZ, 40.84 yr; Sirius B 8.58 ly | https://en.wikipedia.com/wiki/Procyon ; https://arxiv.org/pdf/1510.00485 | [S]. Procyon L ~7 not confirmed by the summary [M] |
| Gliese 667 C: 5 confirmed planets, 7.24 pc, planets c/e/f discussed as HZ | https://exoplanetarchive.ipac.caltech.edu/overview/GJ%20667C ; https://www.sciencedaily.com/releases/2013/06/130625073544.htm | [S] |
| Gliese 876: >= 4 planets, Laplace resonance, 15.30 ly | https://exoplanetarchive.ipac.caltech.edu/overview/Gliese%20876%20d ; https://www.openexoplanetcatalogue.com/planet/Gliese%20876%20e | [S]. Spectral class M4 and "two giants" are [M] |
| Gliese 581: ~20.3 ly, up to six reported planets, habitability disputed | https://www.britannica.com/place/Gliese-581 ; https://www.space.com/23821-gliese-581g.html | [S] |
| 55 Cancri: 12.3 pc, at least five planets | https://en.wikipedia.org/wiki/List_of_exoplanets_detected_by_radial_velocity | [S] for distance and count; "41 ly" is my conversion [C] |
| TRAPPIST-1: 40.66 ly, seven planets, flares a habitability challenge | https://en.wikipedia.org/wiki/TRAPPIST-1 | [S]. M8 and L = 0.00055 are [M] |
| LHS 1140: ~49 ly (older 41 ly), M4.5V, L ~0.0038, quiet star, HZ super-Earth | https://en.wikipedia.org/wiki/LHS_1140 ; https://en.wikipedia.org/wiki/LHS_1140_b ; https://skyandtelescope.org/astronomy-news/welcome-lhs-1140b-super-earth-habitable-zone/ | [S]; sources disagreed on distance, the 49 ly value is the newer one |
| Fomalhaut: 7.70 pc, A4, debris ring, "b" probably a dust cloud (disputed) | https://arxiv.org/pdf/1412.1129 ; https://arxiv.org/pdf/2103.04977 ; https://arxiv.org/pdf/1705.05867 | [S] |
| Fomalhaut and Vega: A4V and A0V, L ~16 and ~30, ages ~450 Myr, "debris disc twins" | https://arxiv.org/pdf/1706.08265 ; https://en.wikipedia.org/wiki/List_of_resolved_circumstellar_disks | [S] |
| RA/Dec of every system; luminosities of Wolf 359, Lalande, 61 Cyg, Luyten, G581, G667C, G876, TRAPPIST-1, HD 69830, 55 Cnc, Barnard, Vega's exact value; planet details for Wolf 359, Lalande, Luyten, HD 69830, 61 Cyg, Vega | none | **[M] only. Verify before use.** |
| Galactic rotation matrix | none (Hipparcos/ESA documentation, remembered) | [M]; arithmetic [C] |

Not done: no value was cross-checked against a primary catalogue (SIMBAD, Gaia DR3, NASA Exoplanet Archive). The most
valuable single follow-up is one query to the Exoplanet Archive (`pscomppars` where `sy_dist < 15.3` parsec) and one to
SIMBAD for the 21 names, which would replace most [M] and [S] tags in a few minutes if network access is available.

## 10. Caveats

- Luminosity of multiples is added for the node (Alpha Cen, 61 Cyg); individual star positions are within a light-week of
  each other and ignored.
- Habitable-zone planets of M dwarfs are tidally locked and exposed to flares [S for Proxima]; this matters for colony
  yield in the mechanics document, not for stations.
- The map includes systems whose planet inventories have been revised several times (Gliese 581, Tau Ceti, Fomalhaut b).
  A game is allowed to be wrong; a document that claims to cite data should say where it is unsure, as above.

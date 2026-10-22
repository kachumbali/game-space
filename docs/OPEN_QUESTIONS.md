# Open questions and decisions (2026-10-22)

Each item has my default; if you do not decide, the default is what I build. "Evidence" says what is measured versus assumed.

## A. Combat and balance
1. **FROGG laser mechanics. IMPLEMENTED with my defaults, please confirm or change.** Fighters (Leaper, Reaver, Spitter) carry `flaser` pulse banks (2.8 dmg, 950 m, capacitor-limited); the Gulper carries a continuous `lance` (1500 m, power pool 400, 70/s). Instant hit, no dodge, so damage is low. Heat is not modelled, only energy. Values are guesses, tuned by headless duels only.
2. **FROGG missiles. IMPLEMENTED with my defaults.** Tick range +~45%, turn +40%, flare effectiveness halved; Tadpole similar. Larger than the +30%/x0.6 I proposed because the first pass did not move balance.
3. **Shield layout.** Currently one energy pool per facing (fore/aft), no spot-size modelling. Default: keep.
4. **XL keel cannon and frigate threat.** Whole ship aims; open: shield pierce, turn-rate cost for a 450 m hull. Default: pierces 50% of shield, frigate turns at 0.05 rad/s.
5. **Nukes.** Hardening factor for hulls (no open source found), yields per warhead, shield attenuation of crew dose, where warheads come from in the story (rare finds, allied transfers, old stockpile).
6. **Friendly fire and crashes.** Friendly bolts/blasts do 50% damage (placeholder). Wreck/debris crash damage not modelled. Default: keep 50%, add debris damage later.
7. **FROGG heat.** Vents or heat-sink tissue (biology undecided).
8. **Balance target.** Measured after lasers (headless, arcade flight): 4 Kestrels beat 10 FROGGs 3/3, 12 FROGGs 1/3; even point about 11-12, near the 12:4 target. With Newtonian flight humans lose at about 10. Samples are 2-3 runs per cell: direction, not measurement. Decide whether Newtonian should be the intended default difficulty.
9. **"I take almost no damage" is not reproduced.** Measured: against a jinking player 8 FROGGs hit about 9% of shots and kill a Kestrel in about 10 sim-seconds; against my aimbot in mission 2 they hit 3 of 226 shots. Needs your play log (press L, send the JSON).

## B. Audio, art and presentation
10. **Audio by ear.** Six SRG774 tracks and three CC0 sample layers are in; Kenney packs unreachable (403), no railgun/spit/lash samples. Tell me what to swap.
11. **Cut scene look.** The voxel-head prototype was rejected. Decision: you generate 2D art from `docs/CUTSCENE_ART_PROMPTS.md` (recommended for faces) or I build voxel versions from your approved images.
12. **Cut scene scope.** Slice 1 = lounge with Hawk and Sparrow. Also open: memorial and debrief content, whether the player gets a portrait, scene length.
13. **FROGG ship look.** Match the reference further (leaf-shaped carrier flank plates, full dreadnought jaw, cruiser/dreadnought classes)? Hive Carrier detail is generic. Default: leave until classes exist.
14. **Unplayed in context.** High-detail ship models at laptop frame rates are untested (software renderer only).

## C. Strategy layer and economy (`docs/ECONOMY.md` section 9)
15. ~~How many frigates~~ Decided: player commands 2-4 frigates. (Economy design should now assume that.)
16. Logistics ship size class and jump drive.
17. Drone storage versus docking slots.
18. Is the player the commander of all task forces or one flight leader?
19. What does the player win (destroy the brood, outlast the migration, evacuate)?
20. Are human extraction sites finite?
21. How do unfought battles resolve (auto-resolve assumed; reinforcements?).
22. Permadeath default and rescue window; recruits as a flow or fixed. (Wingman death is now decided by how the ship died: base 75% eject, less for overkill, reactor breach, nukes; +/-5% per skill level.)
23. Human factions: economically distinct? (deferred)
24. Save policy: export/import, seed stored?
25. Objections I raised that you have not answered: territory versus migratory hive (O2), nuke "elixir problem" (O3), whether pilot choice has consequences (O4), drone economics until jamming rules exist (O5).

## D. Project and tooling
26. **Verification gaps.** Real-device performance (iPad, phone, laptop at high detail), phone readability, damage feel are unverified.
27. **GitHub.** Tag `milestone-1` exists locally only (push was rejected); GitHub Pages is not enabled (needs your approval).
28. **Test method.** Headless runs use a software renderer and an autopilot that is not representative of you; your play log is the only real evidence of how it feels.

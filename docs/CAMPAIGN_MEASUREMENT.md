# Campaign measurement handoff

The briefing already has EASY/NORMAL/HARD/ACE buttons. Selecting one restarts
the briefing setup with the corresponding player damage multiplier and enemy
wave count/skill; NORMAL preserves authored values. Buttons work by click or tap.

`tools/tests/campaign_measure.py` runs the existing mission-5 bot against all
four prologue and five Severed Node missions, defaulting to 20 seeds each. It
records unfinished runs separately from losses and saves each result as it runs.
`tools/tests/campaign_no_drops_t.py` checks a player-attributed capital kill in
Campaign does not produce loot pods. Neither test has completed locally: the
test harness could not install its required Three.js dependency from npm in this
restricted environment. No loss rate or balance claim is made. Run both in the
cloud before interpreting results, then compare each mission's loss rate with
the 10–60% target; bot performance is not a substitute for human play.

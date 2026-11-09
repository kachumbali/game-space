# Roadmap: the Prologue demo (agreed with the owner 2026-11-09)

**Goal.** A Prologue demo (4 missions) that the owner and friends can open from a link, finish and enjoy on **desktop and iPad**, without anyone
explaining the controls. Phones are not a target: they keep working, nothing is polished or tested for them.
**Done means:** a friend plays the four missions unaided and wants more.
**The budget is the owner's play time: 1-2 hours a week.** Nothing that cannot be played in that time gets built.

## Roles
- **Lead: Claude.** Everything reaches `main` through the lead, after `python3 tools/gate.py` passes. Nobody else pushes to `main`.
- **Codex:** bounded jobs on `codex/<task>` branches, one brief at a time (first: `docs/CODEX_BRIEF_TUTORIAL.md`).
- **Gemini:** text and art assets only, on `gemini/<task>` branches.
- **Owner (kachumbali):** plays and decides. Owner notes (docs/PLAYTEST_CHECKLIST.md, a voice memo, five bullets) are the only input that changes balance.

## The gate
`python3 tools/gate.py` = build + `check_opsec.py` (files and commit authors) + `validate_db.py` + `tools/tests/smoke_t.py` (every mode loads on
desktop and iPad-sized touch, no console errors). CI runs it on every push and then publishes the game to the `gh-pages` branch.
Deeper tests (`tools/tests/*`) are run by whoever touches that area; they are not the gate because they are slow under software rendering.

## Order of work
1. **Week 0, consolidation (lead):** the gate, CI publish, author guard, repo cleanup, this roadmap. `index.html` left the repo on 2026-11-09 (Pages
   serves `gh-pages`; it is generated, and committing it caused a conflict in nearly every merge).
2. **Weeks 1-2, the Prologue slice:** the owner plays one or two missions a week; the lead tunes from the notes through `data/db.json`
   (`?db=data/db.json` reloads without a rebuild) and fixes what was hit. In parallel: Codex builds the in-game tutorial and a simplified default
   control set for mission 1; Gemini delivers final Prologue dialogue and cutscene art in the chosen style (docs/DESIGN_CUTSCENE_STYLE.md).
3. **Then:** friends play; decide from their reactions what comes next.

## Parked until the demo is done
New ships, more marks, new weapon systems, the strategy layer, the star map, missions beyond the 13 that exist, gamepad support (owner: not
needed for now), phone polish. Ideas go to docs/BACKLOG.md, not into code.

## Known debts (not blocking the demo)
- Git history before 2026-11-09 carries a real name in commit metadata; the owner accepted it. New commits are checked.
- The game is one script scope in one file; splitting it into lazily loaded files is wanted before cutscene art and more audio are embedded.
- 150+ test scripts with no shared runner; only the gate is trusted to be green.
- Balance is measured against AI stand-ins only; the owner died in every Prologue mission on the first hand-play.
- Merged remote branches still exist (the lead's environment cannot delete branches).

# Orchestration board (owner decision 2026-10-23)

Claude is the orchestrator: it decides scope, writes briefs, reviews and merges. Other tools (GitHub Copilot agent mode in VS Code, Claude Code in the app, Gemini for images) do the bulk work. Claude's weekly budget is limited, so **work is farmed out and Claude's own effort goes to review, decisions and integration.**

## Roles

| Who | Does | Does not |
|---|---|---|
| Owner (kachumbali) | decisions, iPad hand-play, picks what merges | - |
| Claude (orchestrator) | briefs, specs, balance/design decisions, `tools/check_branch.sh` review, merge, history hygiene | bulk coding, long test runs, asset generation |
| Copilot agent (VS Code) | coding and testing briefs in `docs/COPILOT_BRIEFS.md` | merging to main, balance changes, history rewrites |
| Gemini | reference images and concept art for new ships (never committed) | code |
| Claude Code (app) | any brief, same rules | - |

## Protocol for every piece of delegated work
1. One brief = one branch off the current integration branch (see below), named in the brief.
2. The agent works only in its branch, commits with the noreply identity, ends with a note listing commands run and results.
3. Gate: run `tools/check_branch.sh <branch>` (build, db validation, 13-URL suite, P0 tests, email and image scan). Paste its output to Claude; Claude reviews the diff for scope creep and balance edits, then recommends merge or rework.
4. The owner merges (or tells Claude to). Never two agents in one working tree; never force-push.
5. Balance numbers change only in `data/db.json` and only on the owner's decision.

## Branch map (stacked; merge in this order, or merge `copilot-briefs` which contains all of them)
`main` <- `exeter-laser-tune` (laser retune) <- `ship-db` (database) <- `power-db` (power model step 1, budget table) <- `music-ios` (iOS music fix + status line) <- `copilot-briefs` (these docs, check script).
Owner must hand-check the music fix on the iPad before relying on it.

## Task board

| # | Task | Owner of the work | Status | Needs |
|---|---|---|---|---|
| 1 | Merge the stacked branches to main | owner / Claude | open | iPad music check |
| 2 | Shipyard workbench (`?yard`) - Brief 1 | Copilot | open | brief ready |
| 3 | 20-run seeded balance sweeps - Brief 2 | Copilot | open | after #1 |
| 4 | CI that runs tests - Brief 3 | Copilot | open | - |
| 5 | Render pack + docs hygiene - Brief 4 | Copilot | open | - |
| 6 | Touch/iPad checklist harness - Brief 5 | Copilot | open | - |
| 7 | New human ships: specs (Merlin, Bittern, resupply shuttle, strategic fleet tender) | Claude subagents | in progress | owner review of `docs/ships/*` |
| 8 | New ships: concept images | Gemini | open | owner; reference renders from `tools/render_ships.py` |
| 9 | New ships: voxel geometry | Copilot/Claude Code with the Shipyard | blocked on #2, #7, #8 | - |
| 10 | Power model step 2 (weapons+shields buses, reactor threshold 40% -> 25%) | Claude writes brief; Copilot implements | blocked on #1 | owner hand-play |
| 11 | Mission 2 survivability bot (handoff item 3) | Copilot | part of #3 | - |
| 12 | Open decisions for the owner | owner | open | Bullfrog one-sidedness and unused ST-2 tubes; LICENSE choice; Pages enable |

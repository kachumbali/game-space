# Generator scripts (moved from the session scratchpad on 2026-10-22; NOT re-run after the move)
`bp.py` blueprint plates (ship views with subsystem markers), `marks.py` marker drawing helpers, `subgrid.py` subsystem overview grid, `sheet.py`/`sheet_v.py` ship sheets, `classes.py`/`compose.py` class comparison images, `newfrogg.py` FROGG look renders, `cutscene_poc_run.py` cut scene prototype capture.
They use the test harness in `tools/tests/lib.py` (see `tools/tests/README.md`) and need Pillow (`pip install pillow`). Images they write are gitignored (owner decision: no images in the repo).
Rule (AGENTS.md): every ship model view must show subsystem positions, so regenerate blueprints with `bp.py` after any model change.

# Ordnance swap measurement

The requested example is the **Kestrel**, not the Merlin: the Kestrel's M1
station changes two RF rounds into two IR rounds, giving 6 IR and 0 RF instead
of 4 IR and 2 RF. Merlin has no M1 station in the current database.

`tools/tests/balance_sweep.py` defines paired `ordnance-kestrel-default` and
`ordnance-kestrel-ir` scenarios: three Kestrels against three each of Darter,
Leaper and Spitter. Run both with seeds 1–20 (one page at a time), saving
separate raw JSON files; compare FROGG losses (kills) and human survivors at
the same simulation-time cap, including unfinished fights.

```sh
python3 tools/tests/balance_sweep.py --scenario ordnance-kestrel-default --seeds 1-20 --batch-size 1 --output docs/data/ordnance_default.json
python3 tools/tests/balance_sweep.py --scenario ordnance-kestrel-ir --seeds 1-20 --batch-size 1 --output docs/data/ordnance_swap.json
```

No results have been collected for this branch. Local Chromium execution was
rejected by automatic approval review because of the standing local-browser
restriction. Cloud execution and reporting are required; do not infer a balance
advantage from the loadout alone.

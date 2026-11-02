#!/usr/bin/env python3
"""Static contract for P1 capital-laser doctrine (no browser required)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
db = json.loads((ROOT / "data/db.json").read_text())
w = db["weapons"]

ls8 = w["laserM"]
pulse = w["pulseS"]
assert set(ls8["targetClasses"]) == {"corvette", "frigate", "capital"}
assert ls8["slew"] <= 20 and ls8["retarget"] >= 1.5 and ls8["charge"] >= 1.0
assert pulse["turret"] and pulse["slew"] >= 90 and pulse["range"] <= 1000
assert pulse["dmg"] < ls8["dmg"]
assert all(wid != "laserM" or ship["cls"] != "fighter"
           for ship in db["ships"].values() if "cls" in ship
           for wid in [*(t["w"] for t in ship.get("turrets", []))])
assert sum(t["w"] == "laserM" for t in db["ships"]["hecla"]["turrets"]) == 6
assert sum(t["w"] == "pulseS" for t in db["ships"]["halberd"]["turrets"]) == 2
assert all(t["w"] == "pulseS" for t in db["ships"]["exeter"]["turrets"] if t["comp"] in {"tur1", "tur2", "tur3", "tur6"})
assert {"targetSpread", "beamAngularError", "beamMinHit"} <= db["tuning"]["turret"].keys()

source = (ROOT / "src/60_weapons.js").read_text()
for symbol in ("turretAllowsTarget", "turretTargetLoad", "angularSpeed", "hitChance"):
    assert symbol in source, symbol
print("capital laser contract: OK")

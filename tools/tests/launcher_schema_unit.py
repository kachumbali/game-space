#!/usr/bin/env python3
"""Positive and negative controls for launcher mount data validation."""
import copy, json, subprocess, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
db=json.loads((root/'data/db.json').read_text())
def validate(data):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json') as f:
        json.dump(data,f);f.flush()
        return subprocess.run(['python3',str(root/'tools/validate_db.py'),f.name],capture_output=True,text=True)
assert validate(db).returncode == 0
bad=copy.deepcopy(db);bad['ships']['exeter']['launchers'][0]['positions'].pop()
r=validate(bad);assert r.returncode != 0 and '.positions' in r.stdout
bad=copy.deepcopy(db);bad['ships']['exeter']['launchers'][0]['mountHp']=0
r=validate(bad);assert r.returncode != 0 and '.mountHp' in r.stdout
bad=copy.deepcopy(db);bad['ships']['exeter']['launchers'][0]['positions'][0][0]=9999
r=validate(bad);assert r.returncode != 0 and 'outside the hull extents' in r.stdout
print('launcher schema positive, missing-position and invalid-health controls: OK')

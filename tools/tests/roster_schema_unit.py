#!/usr/bin/env python3
"""Positive and negative database validator controls for roster tuning."""
import json, pathlib, subprocess, tempfile
root=pathlib.Path(__file__).resolve().parents[2]
base=json.loads((root/'data/db.json').read_text())
def validate(db):
    with tempfile.NamedTemporaryFile('w',suffix='.json') as f:
        json.dump(db,f);f.flush()
        return subprocess.run(['python3',str(root/'tools/validate_db.py'),f.name],capture_output=True,text=True)
assert validate(base).returncode==0
base['tuning']['roster']['ranks'][1]['kills']=-1
bad=validate(base);assert bad.returncode!=0 and 'roster' in bad.stdout,bad.stdout
print('roster validator accepts valid data and rejects invalid rank: OK')

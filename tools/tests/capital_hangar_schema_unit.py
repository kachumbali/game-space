#!/usr/bin/env python3
"""Real validator acceptance and two malformed hangar controls."""
import json, pathlib, subprocess, tempfile

root=pathlib.Path(__file__).resolve().parents[2]
data=json.loads((root/'data/db.json').read_text())
def validate(d):
    with tempfile.NamedTemporaryFile('w',suffix='.json') as f:
        json.dump(d,f);f.flush()
        return subprocess.run(['python3',str(root/'tools/validate_db.py'),f.name],capture_output=True,text=True)
assert validate(data).returncode==0
data['ships']['exeter']['ordnancePlan']['hangar']['bayComponents'][0]='missing'
r=validate(data);assert r.returncode and 'missing bay component' in r.stdout
data=json.loads((root/'data/db.json').read_text())
data['ships']['destroyer']['ordnancePlan']['hangar']['manifest']['kestrel']=3
r=validate(data);assert r.returncode and 'invalid manifest or total' in r.stdout
print('hangar valid schema and missing-bay / wrong-manifest controls: OK')

#!/usr/bin/env python3
"""Launcher schema validation and disabled fleet-plan controls."""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

root=Path(__file__).resolve().parents[2]
db=json.loads((root/'data/db.json').read_text())
assert db['tuning']['ordnance']['enabled'] is False
expected_live={'halberd':{'flare':0}, 'exeter':{'drone':48}, 'destroyer':{'torp':8}, 'hecla':{'shuttle':24,'flare':0}}
for ship, counts, stores in (
    ('halberd',(4,2),(12,4,8,12)), ('exeter',(6,4),(40,24,24,48)),
    ('destroyer',(8,8),(48,36,48,24)), ('hecla',(16,8),(100,60,48,96))):
    s=db['ships'][ship]; plan=s['ordnancePlan']; ls=s['launchers']
    assert plan['enabled'] is False and tuple(x['count'] for x in ls)==counts
    assert s['stores']==expected_live[ship], 'planned stores must not alter live stores'
    assert tuple(plan['stores'][x] for x in ('ir','rf','torp','drone'))==stores
    assert 'nuke' not in plan['stores']
assert all('launchers' not in s for s in db['ships'].values() if s.get('fac')=='frogg')
assert db['ships']['gulper']['stores']['tad']==36 and 'tick' not in db['ships']['gulper']['stores']
with tempfile.TemporaryDirectory() as tmp:
    p=Path(tmp)/'db.json'
    def validate(d):
        p.write_text(json.dumps(d)); return subprocess.run(['python3',str(root/'tools/validate_db.py'),str(p)],capture_output=True,text=True)
    assert validate(db).returncode==0
    bad=copy.deepcopy(db);bad['ships']['exeter']['launchers'][0]['reload']=-1
    r=validate(bad);assert r.returncode!=0 and 'reload' in r.stdout
    bad=copy.deepcopy(db);bad['ships']['exeter']['launchers'][0]['stores']=['torp']
    r=validate(bad);assert r.returncode!=0 and 'incompatible store' in r.stdout
    bad=copy.deepcopy(db);bad['tuning']['ordnance']['liveCap']['phone']=0
    r=validate(bad);assert r.returncode!=0 and 'liveCap.phone' in r.stdout
print('capital launcher schema controls: OK')

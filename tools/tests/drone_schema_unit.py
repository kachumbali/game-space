"""Drone tuning validation, including invalid types and hysteresis ordering."""
import copy, json, subprocess, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
db=json.loads((root/'data/db.json').read_text())
with tempfile.TemporaryDirectory() as temp:
    path=Path(temp)/'db.json'
    def check(drone):
        x=copy.deepcopy(db); x['tuning']['drone']=drone; path.write_text(json.dumps(x))
        return subprocess.run(['python3',str(root/'tools/validate_db.py'),str(path)],capture_output=True,text=True)
    good=db['tuning']['drone']
    assert check(good).returncode==0
    for bad in [None, [], {}, {**good,'leashFighters':0}, {**good,'leashFighters':True},
                {**good,'leashFighters':float('inf')}, {**good,'resumeFraction':.9}, {**good,'returnFraction':2}]:
        result=check(bad)
        assert result.returncode!=0 and 'tuning.drone' in result.stdout, (bad,result.stdout,result.stderr)
print('drone tuning valid and invalid controls: OK')

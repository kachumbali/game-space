"""Regression: changing fighter burst time preserves the base store and is repeatable."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory() as temp:
    repo = Path(temp)
    (repo / 'tools').mkdir()
    (repo / 'data').mkdir()
    for name in ('armament_law.py', 'dbmarks.py', 'dbedit.py'):
        shutil.copy(root / 'tools' / name, repo / 'tools' / name)
    shutil.copy(root / 'data' / 'db.json', repo / 'data' / 'db.json')
    path = repo / 'data' / 'db.json'
    db = json.loads(path.read_text())
    bases = {k: s['power']['capacitorMJ'] - s['power'].get('burstMJ', 0)
             for k, s in db['ships'].items()
             if not s.get('base') and s.get('cls') == 'fighter' and s.get('fac') == 'frogg'}
    db['tuning']['armamentLaw']['burstSec']['fighter'] = 8
    path.write_text(json.dumps(db, indent=2) + '\n')
    def apply():
        subprocess.run([sys.executable, str(repo / 'tools' / 'armament_law.py'), '--apply'],
                       check=True, stdout=subprocess.DEVNULL)
    apply()
    first = path.read_bytes()
    result = json.loads(first)
    for k, base in bases.items():
        p = result['ships'][k]['power']
        assert p['capacitorMJ'] - p.get('burstMJ', 0) == base, k
    apply()
    assert path.read_bytes() == first, 'second application changed the database'
print('PASS fighter burst application preserves base stores and is idempotent')

#!/usr/bin/env python3
"""Validator positive/negative controls for generic burst fields."""
import copy
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
data = json.loads((root / 'data/db.json').read_text())
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'db.json'
    def validate(value):
        path.write_text(json.dumps(value))
        return subprocess.run(['python3', str(root / 'tools/validate_db.py'), str(path)], capture_output=True, text=True)
    assert validate(data).returncode == 0
    bad = copy.deepcopy(data); bad['weapons']['pdS']['burst'] = 0
    result = validate(bad)
    assert result.returncode != 0 and 'pdS.burst' in result.stdout
    bad = copy.deepcopy(data); bad['weapons']['pdS']['burstPause'] = -1
    result = validate(bad)
    assert result.returncode != 0 and 'pdS.burstPause' in result.stdout
print('v0.5 validator controls: OK')

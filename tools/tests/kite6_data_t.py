#!/usr/bin/env python3
"""KITE-6 data contract with a deliberately invalid load as positive control."""
import copy
import json
from pathlib import Path

data = json.loads((Path(__file__).resolve().parents[2] / 'data/db.json').read_text())

def valid(s):
    return (s.get('drone') and s.get('length') == 6 and len(s['engines']) == 1
            and s['stores'] == {'ir': 2} and len(s['hardpoints']) == 2
            and all(h['size'] == 'S' and h['cap'] == 1 and h['allow'] == ['ir'] for h in s['hardpoints'])
            and any(m['w'] == 'dgun' for m in s['mounts']))

kite = data['ships']['kite6']
assert valid(kite)
bad = copy.deepcopy(kite)
bad['hardpoints'][0]['size'] = 'L'
assert not valid(bad), 'negative control must reject a torpedo-sized station'
print('KITE-6 data contract: OK')

"""Marks resolver shared by the Python tools (mirror of markResolve() in src/16_db.js; docs/MARKS_SCHEMA.md).
An entry in db['ships'] / db['weapons'] with a 'base' key is a variant: {base, mark, mods, [name], [scaffolding]}. resolve() returns a deep copy of the
db in which every variant is replaced by a complete ordinary def (base copy + mods; id, base, mark, name set)."""
import copy, json, os

ROMAN = ['I', 'II', 'III', 'IV']
ENTRY_KEYS = {'base', 'mark', 'mods', 'name', 'scaffolding'}
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'db.json')

def load(path=DB_PATH):
    return json.load(open(path))

def apply(obj, path, op):
    """Apply one mod; returns the number of leaves changed. Raises KeyError / TypeError on a bad path or a non-number target."""
    seg = path.split('.')
    n = [0]
    def go(o, i):
        k = seg[i]
        if k == '*':
            keys = range(len(o)) if isinstance(o, list) else list(o.keys())
        elif isinstance(o, list):
            keys = [int(k)]
        else:
            keys = [k]
        for key in keys:
            if (isinstance(o, list) and key >= len(o)) or (isinstance(o, dict) and key not in o):
                raise KeyError(path)
            if i == len(seg) - 1:
                v = o[key]
                if 'set' in op:
                    o[key] = op['set']
                else:
                    if isinstance(v, bool) or not isinstance(v, (int, float)): raise TypeError(f'{path} is not a number')
                    o[key] = round(v * op['mul'], 6) if 'mul' in op else round(v + op['add'], 6)
                n[0] += 1
            else:
                go(o[key], i + 1)
    go(obj, 0)
    return n[0]

def resolve(db):
    db = copy.deepcopy(db)
    for kind in ('weapons', 'ships'):
        table = db[kind]
        for id_ in list(table):
            e = table[id_]
            if 'base' not in e: continue
            b = table[e['base']]
            d = copy.deepcopy(b)
            for p, op in e.get('mods', {}).items(): apply(d, p, op)
            d['id'] = id_; d['base'] = e['base']; d['mark'] = e['mark']
            d['name'] = e.get('name') or (b['name'] + ' ' + e['mark'])
            table[id_] = d
    return db

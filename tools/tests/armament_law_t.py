# docs/DESIGN_ARMAMENT_LAWS.md (owner 2026-11-12): every corvette, frigate and capital follows the power and toughness laws
# (tuning.armamentLaw), fits its class's turret slot table, and (humans) sustains point defence + secondaries from the weapons bus.
# FROGG burst banks hold burstSec of their non-PD energy fire. Data only, no browser. Usage: python3 armament_law_t.py
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..'))
import dbmarks
db = dbmarks.resolve(dbmarks.load()); S, W, T = db['ships'], db['weapons'], db['tuning']; L = T['armamentLaw']; C = L['coef']
ok = True
def check(n, c, i=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, i); ok = ok and bool(c)
def cls_of(t): return t.get('cls') or W[t['w']].get('turretCls')
def draw(s, keep):
    tot = 0
    for t in s.get('turrets', []):
        w = W[t['w']]
        if w.get('energy') and keep(cls_of(t)): tot += w['energy'] / (w.get('cd') or 1)
    for m in s.get('mounts', []):
        w = W.get(m.get('w'), {})
        if w.get('energy') and w.get('kind') not in ('spine', 'msl') and keep('MAIN'): tot += w['energy'] / (w.get('cd') or 1)
    return tot
check('every turret weapon declares a turretCls', all(W[t['w']].get('turretCls') or t.get('cls') for s in S.values() for t in s.get('turrets', [])))
for sid, s in S.items():
    if s.get('base') or s['cls'] not in ('corvette', 'frigate', 'capital'): continue
    km = T['scaleTo'].get(sid, s['length']) / 1000; role = L['roleFactor'][L['roles'].get(sid, 'warship')]
    plant = C['plantA'] * km ** C['plantB']; hull = C['hullA'] * km ** C['hullB'] * role
    check(f'{sid}: plant follows the law', abs(s['power']['plantMW'] / plant - 1) < 0.02, f"{s['power']['plantMW']} vs {plant:.0f}")
    check(f'{sid}: structure follows the law', abs(s['structure'] / hull - 1) < 0.02, f"{s['structure']} vs {hull:.0f}")
    tab = L['slots'].get(L['slotClass'].get(sid, ''))
    if tab:
        c = {'XL': 0, 'L': 0, 'M': 0, 'S': 0}
        for t in s.get('turrets', []): c[cls_of(t)] += 1
        c['XL'] += sum(1 for m in s.get('mounts', []) if W.get(m.get('w'), {}).get('kind') == 'spine')
        check(f'{sid}: turret slots within the {L["slotClass"][sid]} table', all(c[k] <= tab[k] for k in c), f'{c} vs {tab}')
    bus = s['power']['plantMW'] / 3
    if s['fac'] == 'human':
        need = draw(s, lambda c: c in ('S', 'M'))
        check(f'{sid}: bus sustains point defence + secondaries', need <= bus + 1e-6, f'{need:.0f} MW vs {bus:.0f}')
    else:
        need = draw(s, lambda c: c != 'S') * L['burstSec'][s['cls']]
        check(f'{sid}: burst bank holds {L["burstSec"][s["cls"]]} s of non-PD energy fire', s['power'].get('burstMJ', 0) + 1 >= need, f"{s['power'].get('burstMJ', 0)} vs {need:.0f}")
sys.exit(0 if ok else 1)

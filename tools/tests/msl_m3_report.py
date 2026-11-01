#!/usr/bin/env python3
"""Before/after tables for docs/MISSILES_M3.md from two `ttk_matrix.py ceiling --jitter` JSON files (missile weapons only).
Usage: python3 tools/tests/msl_m3_report.py --before before.json --after after.json [--salvo after_salvo3.json]"""
import argparse, json, statistics, collections
TARGETS = ['merlin', 'darter', 'kestrel', 'leaper', 'bittern', 'toad', 'reaver', 'halberd', 'gulper', 'exeter', 'bullfrog']
def load(f):
    by = collections.defaultdict(list)
    for sd, cells in json.load(open(f)).items():
        for k, r in cells.items(): by[k].append(r)
    return by
def cell(runs):
    if not runs: return '-'
    n = len(runs); k = [r for r in runs if r['killed']]
    if not k:
        fr = statistics.mean(r['frac'] for r in runs)
        return 'immune' if fr < 0.01 else f'no kill ({100 * fr:.0f}%)'
    sh = statistics.mean(r['shots'] for r in k); lo = min(r['shots'] for r in k); hi = max(r['shots'] for r in k)
    s = f'{sh:.1f}' if lo == hi or sh < 10 else f'{sh:.0f}'
    if lo != hi: s += f' ({lo}-{hi})'
    if len(k) < n: s += f' [{len(k)}/{n}]'
    return s
def table(by, weapons, suffix=''):
    L = ['| weapon | ' + ' | '.join(TARGETS) + ' |', '|---|' + '---|' * len(TARGETS)]
    for w in weapons:
        L.append(f'| {w} | ' + ' | '.join(cell(by.get(f'{w}|{t}{suffix}')) for t in TARGETS) + ' |')
    return L
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--before'); ap.add_argument('--after'); ap.add_argument('--salvo'); a = ap.parse_args()
    out = []
    for name, f in (('BEFORE (main dfb612a)', a.before), ('AFTER', a.after)):
        if not f: continue
        by = load(f); ns = len(next(iter(json.load(open(f))).values())) and len(json.load(open(f)))
        ws = [w for w in ['ir', 'rf', 'tick', 'torp', 'tad', 'torp_2', 'torp_3', 'torp_4'] if any(k.startswith(w + '|') for k in by)]
        out.append(f'### {name}: missiles fired per kill, head-on (mean over {ns} seeds; range of the cell in brackets; `[k/n]` = killed in k of n)\n'); out += table(by, ws); out.append('')
        out.append(f'### {name}: broadside (target turned 90 degrees)\n')
        L = ['| weapon | halberd | gulper | exeter | bullfrog |', '|---|---|---|---|---|']
        for w in ws: L.append(f'| {w} | ' + ' | '.join(cell(by.get(f'{w}|{t}|side')) for t in ('halberd', 'gulper', 'exeter', 'bullfrog')) + ' |')
        out += L; out.append('')
    if a.salvo:
        by = load(a.salvo); ws = [w for w in ['torp', 'tad', 'torp_2', 'torp_3', 'torp_4'] if any(k.startswith(w + '|') for k in by)]
        out.append('### AFTER: torpedoes in salvos of 3 (0.9 s apart; counts are rounded up to whole salvos)\n')
        L = ['| weapon | halberd | gulper | exeter | bullfrog | exeter (side) |', '|---|---|---|---|---|---|']
        for w in ws: L.append(f'| {w} | ' + ' | '.join(cell(by.get(f'{w}|{t}|salvo3')) for t in ('halberd', 'gulper', 'exeter', 'bullfrog')) + f' | {cell(by.get(f"{w}|exeter|side|salvo3"))} |')
        out += L; out.append('')
    print('\n'.join(out))
if __name__ == '__main__': main()

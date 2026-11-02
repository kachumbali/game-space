#!/usr/bin/env python3
"""Summarise seeded ttk_matrix missile runs without claiming misses are hits."""
import argparse
import csv
import json
import statistics
from pathlib import Path

WEAPONS=('ir','rf','tick','torp','tad')
TARGETS=('exeter','halberd','destroyer','gulper','bullfrog')

def summarise(data, min_seeds=20):
    if len(data)<min_seeds: raise ValueError(f'need {min_seeds} seeds, got {len(data)}')
    rows=[]
    for wid in WEAPONS:
        for ship in TARGETS:
            for side in ('head','side'):
                key=f'{wid}|{ship}'+('|side' if side=='side' else '')
                vals=[]
                for seed,result in data.items():
                    cell=result.get(key)
                    if not cell or not cell.get('per'): raise ValueError(f'{seed}: missing first-shot data for {key}')
                    vals.append(float(cell['per'][0]))
                hits=[v for v in vals if v>0]
                rows.append({'weapon':wid,'ship':ship,'aspect':side,'seeds':len(vals),
                             'positive_damage':len(hits),'mean_all':round(statistics.mean(vals),2),
                             'mean_positive':round(statistics.mean(hits),2) if hits else '',
                             'median_all':round(statistics.median(vals),2)})
    return rows

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
    rows=summarise(json.loads(a.input.read_text()))
    with a.output.open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    print(f'{len(rows)} cells written to {a.output}')
if __name__=='__main__':main()

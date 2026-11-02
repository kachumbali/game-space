#!/usr/bin/env python3
"""Positive and missing/too-few-seeds controls for report aggregation."""
import capital_damage_report as r

cells={f'{w}|{s}'+('|side' if side=='side' else ''):{'per':[0 if side=='head' else 100]}
       for w in r.WEAPONS for s in r.TARGETS for side in ('head','side')}
data={str(i):cells for i in range(1,21)}
rows=r.summarise(data)
assert len(rows)==50 and rows[0]['positive_damage']==0 and rows[1]['mean_positive']==100
try: r.summarise({'1':cells})
except ValueError: pass
else: raise AssertionError('too few seeds accepted')
bad=dict(data);bad['1']={}
try: r.summarise(bad)
except ValueError: pass
else: raise AssertionError('missing cell accepted')
print('capital damage report controls: OK')

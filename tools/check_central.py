#!/usr/bin/env python3
"""Fail if a balance table that belongs in data/db.json is defined as a literal in src/ again (owner rule 2026-11-11: weapon, ship and system
properties are managed centrally). Each name below must be read from the database (TUNE.* / DB.*), never assigned an object or array literal."""
import re, glob, sys
CENTRAL = ['SUBSYS', 'SIMF', 'SKILL', 'DRONE_LIMIT', 'BF', 'SCALE_TO', 'SCORE', 'FUN', 'LOOT_CFG', 'DIFFS', 'MUTATORS', 'SV_TUNE', 'SV_POOL',
           'WEAPONS', 'ARMOR', 'MASS', 'DMGX', 'FF', 'NUKE', 'AI_TUNE', 'EXPOSED', 'SOFT', 'ARMOR_THRESH_CLS']
bad = []
for f in sorted(glob.glob('src/*.js')):
    for i, line in enumerate(open(f, encoding='utf-8'), 1):
        m = re.match(r'\s*(?:const|let|var) (%s) = ([\[{])' % '|'.join(CENTRAL), line)
        if m: bad.append(f'{f}:{i}: {m.group(1)} is defined in code; move the values to data/db.json (tuning) and read them from TUNE')
print('\n'.join(bad) if bad else 'central data OK')
sys.exit(1 if bad else 0)

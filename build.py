#!/usr/bin/env python3
"""Concatenate src/* (sorted by filename) into the single-file index.html."""
import glob, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
out = []
for f in sorted(glob.glob('src/*')):
    out.append(open(f).read().rstrip('\n') + '\n')
open('index.html', 'w').write(''.join(out))
print('built index.html from', len(out), 'parts,', sum(map(len, out)) // 1024, 'KB')

#!/usr/bin/env python3
"""Concatenate src/* (sorted by filename) into the single-file index.html.

Owner P0 2026-10-22: the build now fails on duplicate top-level names (the _bm merge collision
once broke the whole page). Every src part shares one module scope: two top-level declarations
of the same name is a bug, not a warning. CI runs this (see .github/workflows/ci.yml)."""
import glob, os, re, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
parts = sorted(glob.glob('src/*'))

TOP_LEVEL = re.compile(r'^(?:function\s*\*?\s+|class\s+)([A-Za-z_$][\w$]*)', re.M)
DECL_START = re.compile(r'^(?:const|let|var)\s+', re.M)

def split_top_level(source, separator):
    parts, start, stack = [], 0, []
    quote = None
    line_comment = block_comment = False
    i = 0
    pairs = {')': '(', ']': '[', '}': '{'}
    while i < len(source):
        c = source[i]
        n = source[i + 1] if i + 1 < len(source) else ''
        if line_comment:
            if c == '\n': line_comment = False
        elif block_comment:
            if c == '*' and n == '/':
                block_comment = False
                i += 1
        elif quote:
            if c == '\\': i += 1
            elif c == quote: quote = None
        elif c == '/' and n == '/':
            line_comment = True
            i += 1
        elif c == '/' and n == '*':
            block_comment = True
            i += 1
        elif c in ("'", '"', '`'):
            quote = c
        elif c in '([{':
            stack.append(c)
        elif c in ')]}':
            if stack and stack[-1] == pairs[c]: stack.pop()
        elif c == separator and not stack:
            parts.append(source[start:i])
            start = i + 1
        i += 1
    parts.append(source[start:])
    return parts

def binding_names(pattern):
    pattern = pattern.strip()
    if re.fullmatch(r'[A-Za-z_$][\w$]*', pattern):
        return [pattern]
    if pattern.startswith('...'):
        return binding_names(pattern[3:])
    if pattern.startswith('[') and pattern.endswith(']'):
        names = []
        for item in split_top_level(pattern[1:-1], ','):
            names.extend(binding_names(split_top_level(item, '=')[0]))
        return names
    if pattern.startswith('{') and pattern.endswith('}'):
        names = []
        for item in split_top_level(pattern[1:-1], ','):
            item = item.strip()
            if not item: continue
            pair = split_top_level(item, ':')
            target = pair[1] if len(pair) > 1 else pair[0]
            names.extend(binding_names(split_top_level(target, '=')[0]))
        return names
    return []

def declaration_names(source):
    names = []
    for match in DECL_START.finditer(source):
        # Keep the same top-level convention as the original check: declarations start at column 0.
        if match.start() and source[match.start() - 1] != '\n': continue
        kind_start = match.end()
        tail = source[kind_start:]
        statement = split_top_level(tail, ';')[0]
        # A statement without a semicolon ends at its first line break.
        if statement == tail and '\n' in statement: statement = statement.split('\n', 1)[0]
        for declarator in split_top_level(statement, ','):
            binding = split_top_level(declarator, '=')[0]
            names.extend(binding_names(binding))
    return names

decl = {}
for f in parts:
    source = open(f).read()
    for name in TOP_LEVEL.findall(source) + declaration_names(source):
        decl.setdefault(name, []).append(os.path.basename(f))

dups = {n: fs for n, fs in decl.items() if len(fs) > 1}
if dups:
    print('DUPLICATE TOP-LEVEL NAMES (one module scope - this would break the page at runtime):')
    for n, fs in sorted(dups.items()):
        print(f'  {n}: {", ".join(fs)}')
    sys.exit(1)

import json
db = json.load(open('data/db.json'))
db.pop('notes', None)                 # design notes stay in the JSON file; they are not needed at runtime
db.pop('_about', None)
db_js = json.dumps(db, separators=(',', ':'))
out = []
for f in parts:
    t = open(f).read().rstrip('\n') + '\n'
    if '/*@DB@*/null' in t: t = t.replace('/*@DB@*/null', db_js)
    out.append(t)
open('index.html', 'w').write(''.join(out))
print(f'built index.html from {len(out)} parts, {sum(map(len, out)) // 1024} KB, {len(decl)} top-level names checked')

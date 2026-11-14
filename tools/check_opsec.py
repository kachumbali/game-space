#!/usr/bin/env python3
"""Fail if a tracked file contains a real person's name or a non-noreply email address (owner rule 2026-11-01; docs/archive/PLAN_V03.md).
The retired names are assembled from parts so this file does not contain them itself."""
import json, os, re, subprocess, sys
BANNED = [re.compile(w, re.I) for w in ('Jon' + 'as', 'Ko' + 'll' + r'\b')]
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
OK_EMAIL = re.compile(r'(@users\.noreply\.github\.com|^noreply@[a-z.]+)$')
bad = []
for f in subprocess.check_output(['git', 'ls-files'], text=True).split('\n'):
    if not f or f.endswith(('.png', '.jpg', '.jpeg', '.ogg', '.mp3', '.wav', '.woff2', '.ico')):
        continue
    try:
        text = open(f, encoding='utf-8').read()
    except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
        continue
    for i, line in enumerate(text.split('\n'), 1):
        for r in BANNED:
            if r.search(line): bad.append(f'{f}:{i}: retired real name')
        for m in EMAIL.findall(line):
            if not OK_EMAIL.search(m): bad.append(f'{f}:{i}: email address {m}')
# Commit metadata: every commit after the cutoff must be authored and committed under a handle (owner decision 2026-11-09: the older
# history is accepted as it is, new commits must be clean). Skipped silently when the cutoff is not in the clone (shallow checkout).
CUTOFF = '4092ea9f960d99a5258a3055b6767dcdf818cf25'
try:
    log = subprocess.check_output(['git', 'log', '--format=%h|%an|%ae|%cn|%ce', CUTOFF + '..HEAD'], text=True, stderr=subprocess.DEVNULL)
except subprocess.CalledProcessError:
    log = ''
# PR workflows check out GitHub's synthetic merge rather than the submitted
# branch. Its identity comes from GitHub, not a contributor commit. Exempt only
# the exact merge whose parents match the event's base and head; still inspect
# every actual commit reachable from it.
synthetic_merge = None
if os.environ.get('GITHUB_ACTIONS') == 'true' and os.environ.get('GITHUB_EVENT_NAME') == 'pull_request':
    try:
        with open(os.environ['GITHUB_EVENT_PATH'], encoding='utf-8') as event_file:
            pr = json.load(event_file)['pull_request']
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
        parents = subprocess.check_output(['git', 'show', '-s', '--format=%P', head], text=True).strip().split()
        # The base may advance after the event payload was created. Require
        # the checked-out merge's base to descend from the event base and its
        # other parent to be the exact submitted head.
        base_is_descendant = len(parents) == 2 and subprocess.run(
            ['git', 'merge-base', '--is-ancestor', pr['base']['sha'], parents[0]],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        if head == os.environ.get('GITHUB_SHA') and base_is_descendant and parents[1] == pr['head']['sha']:
            synthetic_merge = head
    except (OSError, KeyError, ValueError, subprocess.CalledProcessError):
        pass
for line in log.split('\n'):
    if not line: continue
    h, an, ae, cn, ce = line.split('|')
    if synthetic_merge and synthetic_merge.startswith(h): continue
    for who, name, mail in (('author', an, ae), ('committer', cn, ce)):
        if any(r.search(name) for r in BANNED) or any(r.search(mail) for r in BANNED) or not OK_EMAIL.search(mail):
            bad.append(f'commit {h}: {who} "{name} <{mail}>" is not a handle with a noreply address (git config user.name kachumbali)')
print('\n'.join(bad) if bad else 'opsec OK')
sys.exit(1 if bad else 0)

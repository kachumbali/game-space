"""Regression tests for duplicate names in the shared JavaScript module scope."""
import pathlib
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(__file__).resolve().parents[2]
BUILD = REPO / 'build.py'
CASES = {
    'object destructuring': ('const shared = 1;\n', 'const { value: shared } = source;\n'),
    'array destructuring': ('const shared = 1;\n', 'const [shared] = source;\n'),
    'multiple declarators': ('const shared = 1;\n', 'const first = 1, shared = 2;\n'),
}

with tempfile.TemporaryDirectory(prefix='gs-build-lint-') as tmp:
    root = pathlib.Path(tmp)
    shutil.copy2(BUILD, root / 'build.py')
    (root / 'src').mkdir()
    for label, (first, second) in CASES.items():
        for old in (root / 'src').iterdir():
            old.unlink()
        (root / 'src' / '10_first.js').write_text(first)
        (root / 'src' / '20_second.js').write_text(second)
        result = subprocess.run(
            [sys.executable, str(root / 'build.py')],
            cwd=root,
            text=True,
            capture_output=True,
        )
        output = result.stdout + result.stderr
        if result.returncode != 1 or 'shared:' not in output:
            raise AssertionError(f'{label} duplicate was not rejected:\n{output}')
        print(f'PASS {label} duplicate rejected')

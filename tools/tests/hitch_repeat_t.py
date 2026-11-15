"""Repeat the low-detail software hitch scenario and report frames over 3x warm median.

Run alongside hitch_t.py, not as a replacement for its target check. PERF only
retains spans of at least 2 ms, so an empty span list is not proof of no work.
"""
import argparse
import json
from statistics import median

from hitch_t import RUN, SCENARIO
from lib import Runner, assert_no_console_errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=int, default=3)
    parser.add_argument('--json', help='save the raw frame and span data')
    opts = parser.parse_args()
    if opts.runs < 1:
        parser.error('--runs must be positive')
    results = []
    for n in range(opts.runs):
        with Runner() as runner:
            page = runner.page(320, 180, SCENARIO + '&q=low&skyres=128&nobloom',
                               init_script='globalThis.__paused = true')
            result = page.evaluate(RUN)
            assert len(result['nukes']) == 2 and all(result['destroyed']), result['nukes']
            assert_no_console_errors(runner)
            frames = result['frames']
            typical = median(f['ms'] for f in frames if f['name'] == 'warm')
            slow = [f for f in frames if f['ms'] > 3 * typical]
            print(f"run {n + 1}: warm median {typical:.1f} ms; "
                  f"worst {max(f['ms'] for f in frames):.1f} ms; "
                  f"{len(slow)} frames over 3x", flush=True)
            for frame in slow:
                spans = [s for s in result['spans'] if frame['start'] <= s['end'] <= frame['now']]
                phases = ', '.join(f"{s['name']} {s['ms']:.1f}" for s in spans) or 'none recorded'
                print(f"  {frame['name']}: {frame['ms']:.1f} ms, "
                      f"action {frame['script']:.1f} ms; {phases}", flush=True)
            results.append(result)
    if opts.json:
        with open(opts.json, 'w') as out:
            json.dump(results, out)


if __name__ == '__main__':
    main()

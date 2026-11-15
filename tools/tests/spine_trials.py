"""Trace varied-opening spine duels across seeds; one JSON object per fight."""
import argparse
import json
from armament_duels import DUEL
from lib import Runner, assert_no_console_errors

TRACE = DUEL.replace('let elapsed = 0;', 'let elapsed = 0; __bf.log.length = 0;').replace(
    'deaths: [...deaths.values()]', 'deaths: [...deaths.values()], log: __bf.log')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--runs', type=int, default=20)
    p.add_argument('--out', required=True)
    args = p.parse_args()
    with Runner() as runner, open(args.out, 'w') as out:
        for left, right in [('destroyer', 'exeter'), ('carrier', 'bullfrog')]:
            for seed in range(1, args.runs + 1):
                page = runner.page(480, 270, f'?free&n=0&q=low&skyres=128&mute&duelbench&seed={seed}', init_script='globalThis.__paused=true')
                try:
                    result = page.evaluate(TRACE, [[left], [right], 180, seed])
                    assert_no_console_errors(runner)
                    out.write(json.dumps({'cell': left + '-' + right, 'seed': seed, **result}) + '\n')
                    out.flush()
                finally:
                    page.context.close()
            print(left, right, 'complete', flush=True)

if __name__ == '__main__':
    main()

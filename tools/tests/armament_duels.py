"""Run seeded AI duels using normal weapons, magazines and damage rules."""
import argparse
from collections import Counter
import csv
from statistics import median
from lib import Runner, assert_no_console_errors

CELLS = [
    ('glaive-exeter', ['destroyer'], ['exeter']),
    ('columbus-bullfrog', ['carrier'], ['bullfrog']),
    ('escorted-columbus-bullfrog', ['carrier', 'halberd', 'halberd'], ['bullfrog']),
    ('hecla-bullfrog', ['hecla'], ['bullfrog']),
    ('halberd-gulper', ['halberd'], ['gulper']),
    ('kestrel-leaper', ['kestrel'], ['leaper']),
    ('kestrel-reaver', ['kestrel'], ['reaver']),
    ('falchion-reaver', ['falchion'], ['reaver']),
    ('kestrel-flight-gulper', ['kestrel'] * 4, ['gulper']),
]
DUEL = """([left, right, limit]) => {
    const g = __game, T = g.THREE;
    const p = g.player;
    p.group.position.set(0, 0, 90000);
    p.team = 2;
    g.setLod('off');
    const capital = [...left, ...right].some(id => g.SHIPS[id].cls !== 'fighter');
    const distance = capital ? 3600 : 900;
    const teams = [left, right].map((ids, team) => ids.map((id, i) => {
        const x = i ? (i % 2 ? -1 : 1) * Math.ceil(i / 2) * (capital ? 260 : 65) : 0;
        const z = (team ? -1 : 1) * distance / 2;
        return g.spawnShip(id, team, new T.Vector3(x, 0, z), new T.Vector3(0, 0, -z), {skill: 3});
    }));
    const lost = s => !s.alive || s.dying > 0;
    const deaths = new Map();
    let elapsed = 0;
    const dt = 1/30;
    while (elapsed < limit) {
        g.update(dt);
        elapsed += dt;
        for (const ship of teams.flat()) if (lost(ship) && !deaths.has(ship)) {
            deaths.set(ship, { id: ship.def.id, team: ship.team, t: elapsed, cause: ship.duelCause || 'unknown' });
        }
        const [a, b] = teams.map(group => group.every(lost));
        if (a || b) return { winner: a === b ? 'mutual' : a ? 'right' : 'left', elapsed, deaths: [...deaths.values()] };
    }
    return { winner: 'timeout', elapsed, deaths: [...deaths.values()] };
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=int, default=20)
    parser.add_argument('--limit', type=int, default=180)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    with open(args.out, 'w', newline='') as file, Runner() as runner:
        writer = csv.writer(file)
        writer.writerow(['cell', 'seed', 'winner', 'elapsed', 'deaths'])
        for name, left, right in CELLS:
            outcomes, times, causes = Counter(), [], Counter()
            for seed in range(1, args.runs + 1):
                page = runner.page(480, 270, f'?free&n=0&q=low&skyres=128&mute&duelbench&seed={seed}',
                                   init_script='globalThis.__paused=true')
                try:
                    result = page.evaluate(DUEL, [left, right, args.limit])
                    assert_no_console_errors(runner)
                finally:
                    page.context.close()
                outcomes[result['winner']] += 1
                if result['winner'] != 'timeout':
                    times.append(result['elapsed'])
                causes.update(death['cause'] for death in result['deaths'])
                writer.writerow([name, seed, result['winner'], round(result['elapsed'], 3), result['deaths']])
                file.flush()
            print(name, dict(outcomes), round(median(times), 2) if times else None, dict(causes), flush=True)


if __name__ == '__main__':
    main()

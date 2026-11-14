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
    ('kestrel-two-leapers', ['kestrel'], ['leaper'] * 2),
    ('falchion-two-reavers', ['falchion'], ['reaver'] * 2),
    ('halberd-two-gulpers', ['halberd'], ['gulper'] * 2),
]
DUEL = """([left, right, limit, seed]) => {
    const g = __game, T = g.THREE;
    const p = g.player;
    p.group.position.set(0, 0, 90000);
    p.team = 2;
    g.setLod('off');
    const capital = [...left, ...right].some(id => g.SHIPS[id].cls !== 'fighter');
    // A separate seeded stream keeps opening variation reproducible without consuming
    // the simulation's random stream. Vary range, bearing and formation offset.
    let state = seed >>> 0;
    const rand = () => { let t = state += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const distance = (capital ? 3600 : 900) * (0.8 + 0.4 * rand());
    const bearing = rand() * Math.PI * 2;
    const axis = new T.Vector3(Math.sin(bearing), 0, Math.cos(bearing));
    const lateral = new T.Vector3(axis.z, 0, -axis.x);
    const offset = (rand() * 0.4 - 0.2) * distance;
    const teams = [left, right].map((ids, team) => ids.map((id, i) => {
        const x = i ? (i % 2 ? -1 : 1) * Math.ceil(i / 2) * (capital ? 260 : 65) : 0;
        const pos = axis.clone().multiplyScalar((team ? -1 : 1) * distance / 2)
            .addScaledVector(lateral, x + (team ? offset / 2 : -offset / 2));
        // Vary the initial heading as well as the line of approach: merely
        // rotating the whole encounter leaves a head-on fight unchanged.
        const heading = pos.clone().negate().sub(pos).applyAxisAngle(new T.Vector3(0, 1, 0), (rand() * 0.4 - 0.2) * Math.PI);
        return g.spawnShip(id, team, pos, pos.clone().add(heading), {skill: 3});
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
    parser.add_argument('--cells', help='comma-separated cell names (default: all)')
    args = parser.parse_args()
    with open(args.out, 'w', newline='') as file, Runner() as runner:
        writer = csv.writer(file)
        writer.writerow(['cell', 'seed', 'winner', 'elapsed', 'deaths'])
        for name, left, right in CELLS:
            if args.cells and name not in args.cells.split(','):
                continue
            outcomes, times, causes = Counter(), [], Counter()
            for seed in range(1, args.runs + 1):
                page = runner.page(480, 270, f'?free&n=0&q=low&skyres=128&mute&duelbench&seed={seed}',
                                   init_script='globalThis.__paused=true')
                try:
                    result = page.evaluate(DUEL, [left, right, args.limit, seed])
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

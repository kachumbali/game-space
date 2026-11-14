"""Measure seeded capital skirmish startup, nuclear impacts, and destruction."""
import argparse
from statistics import median
from lib import Runner, assert_no_console_errors

SCENARIO = '?sk=bullfrog:2,gulper:2,hivecarrier:1&nuke=2&nukeKt=1&seed=7&fps&go&mute'
RUN = """async () => {
    const g = __game, frames = [];
    // Use the same clock for frame boundaries and PERF spans. The rAF callback
    // timestamp denotes the rendering opportunity, which can precede callback execution.
    const next = () => new Promise(resolve => requestAnimationFrame(() => resolve(performance.now())));
    async function phase(name, action, count, every = false) {
        let previous = await next();
        for (let i = 0; i < count; i++) {
            const start = performance.now();
            if (action && (i === 0 || every) && action() === false) break;
            const script = performance.now() - start;
            const now = await next();
            frames.push({ name, ms: now - previous, script, start, now });
            previous = now;
        }
    }
    g.__paused = true;
    await phase('warm', null, 8);
    const ships = ['hivecarrier', 'bullfrog'].map(id => g.ships.find(s => s.def.id === id && s.alive));
    if (ships.some(s => !s)) throw Error('Expected both capital targets');
    for (const ship of ships) {
        const pos = ship.group.position.clone();
        pos.y += ship.def.radius * 0.62 + 8;
        await phase('nuke ' + ship.def.id, () => g.nukeAt(pos, 1, g.player), 5);
        await phase('breakup ' + ship.def.id, () => {
            if (!ship.alive) return false;
            g.update(0.05);
        }, 90, true);
    }
    return { frames, nukes: g.nukeLog, diagnostics: g.perfDiagnostics(), spans: g.PERF.spans || [], destroyed: ships.map(s => !s.alive) };
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--software', action='store_true', help='use a smaller framebuffer and a median-normalized limit')
    parser.add_argument('--measure', action='store_true', help='report a baseline without asserting the target')
    opts = parser.parse_args()
    failed = []
    for quality, limit in [('high', 100), ('low', 50)]:
        with Runner() as runner:
            width, height = (320, 180) if opts.software else (1280, 720)
            extra = '&skyres=128&nobloom' if opts.software else ''
            page = runner.page(width, height, SCENARIO + '&q=' + quality + extra,
                               init_script='globalThis.__paused = true')
            print(quality, 'loaded', flush=True)
            result = page.evaluate(RUN)
            frames = result['frames']
            print(quality, len(frames), 'frames')
            for name in dict.fromkeys(f['name'] for f in frames):
                group = [f for f in frames if f['name'] == name]
                worst = max(group, key=lambda f: f['ms'])
                print(name, worst, 'max script', round(max(f['script'] for f in group), 2))
            print('frames over 100 ms:', [f for f in frames if f['ms'] > 100])
            print('voxel builds:', result['diagnostics']['voxelBuilds'])
            for f in frames:
                if f['ms'] > 100:
                    print('slow frame spans:', f['name'], [s for s in result['spans'] if f['start'] <= s['end'] <= f['now']])
            assert len(result['nukes']) == 2 and all(result['destroyed']), result['nukes']
            assert_no_console_errors(runner)
            worst = max(f['ms'] for f in frames)
            typical = median(f['ms'] for f in frames if f['name'] == 'warm')
            print(f'worst {worst:.1f} ms, warm median {typical:.1f} ms, ratio {worst / typical:.2f}')
            if worst > (typical * limit / (1000 / 60) if opts.software else limit):
                failed.append(quality)
    return int(bool(failed) and not opts.measure)


if __name__ == '__main__':
    raise SystemExit(main())

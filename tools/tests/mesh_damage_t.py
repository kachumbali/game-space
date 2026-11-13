"""Check mesh damage, update ranges, and measure local impact cost."""
from lib import Runner, assert_no_console_errors

with Runner() as runner:
    page = runner.page(640, 360, '?free&n=0&q=mid&vox=mesh&seed=8',
                       init_script='globalThis.__paused=true')
    results = page.evaluate("""() => {
        const g = __game, T = g.THREE, results = {};
        for (const id of ['kestrel', 'bullfrog', 'carrier']) {
            const s = g.makeShip(id, 1, new T.Vector3(2000,0,0), new T.Quaternion());
            const V = s.vox;
            const m = V.meshDamage[0];
            const initial = m.position.count;
            const i = Math.floor(initial / 6) * 3;
            const p = new T.Vector3().fromArray(m.base, i);
            const radius = V.data.vs * 4;
            const t = performance.now();
            g.chip(s, p, radius, radius, false);
            const ms = performance.now() - t;
            let dent = 0, dark = 0;
            for (let j = 0; j < m.base.length; j += 3) {
                dent = Math.max(dent, Math.hypot(m.position.array[j]-m.base[j],
                  m.position.array[j+1]-m.base[j+1], m.position.array[j+2]-m.base[j+2]));
                if (m.color.array[j] < m.rgb[j]) dark++;
            }
            results[id] = { ms, dark, dent, limit: V.data.vs * 2 * g.TUNE.damageVisuals.dentThicknessFraction,
                            oldVertices: initial, newVertices: m.position.count, ranges: m.color.updateRanges.length };
        }
        return results;
    }""")
    for ship, result in results.items():
        print(ship, result, flush=True)
        assert result['dark'] > 0 and result['ranges'] > 0, result
        assert result['oldVertices'] == result['newVertices'], result
        assert result['dent'] <= result['limit'] + 0.0001, result
    assert_no_console_errors(runner)

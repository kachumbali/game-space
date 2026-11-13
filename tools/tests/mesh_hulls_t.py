"""Seeded point containment comparison for the triangulated hull primitives."""
from lib import Runner

CHECK = """() => {
    const { THREE: T, hullPrimTriangles, primInside, SHIPS } = __game;
    const direction = new T.Vector3(1, 0.239, 0.371).normalize();
    const ray = new T.Ray(new T.Vector3(), direction);
    const hit = new T.Vector3();
    let seed = 17362843;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const stats = {}, failures = [];
    const fixtures = [];
    for (const ax of ['x', 'y', 'z']) for (const sh of ['r', 'd', 'h', 'e'])
        fixtures.push({ t: 'tap', c: [1, 2, 3], hz: 2, h0: [1, 2], h1: [1.5, 0.8],
            ax, sh, sweep: 0.2, sweepY: -0.3, rot: [0.13, 0.62, -0.4] });
    fixtures.push({ t: 'ell', c: [2, 0, 1], r: [1, 2, 0.8], rot: [0.4, -0.2, 0.6] });
    for (const fy of [0.38, 1, 1.8]) {
        fixtures.push({ t: 'seg', a: [0, 0, 0], b: [2, 3, -1], ra: 0.6, rb: 0.2, fy });
        fixtures.push({ t: 'seg', a: [1, 2, 3], b: [1, 2, 3], ra: 0.6, rb: 0.2, fy });
    }
    const models = [['fixtures', { length: 8, prims: fixtures }], ...Object.entries(SHIPS).filter(([, d]) => !d.base)];
    for (const [id, def] of models) for (const [i, p] of def.prims.entries()) {
        if (!['tap', 'ell', 'seg'].includes(p.t)) continue;
        const bucket = p.t === 'tap' ? 'tap ' + p.sh : p.t;
        const row = stats[bucket] ??= { samples: 0, inside: 0, misses: 0, extra: 0 };
        const triangles = hullPrimTriangles(p, def.length, 6).map(tri => tri.map(v => new T.Vector3(...v)));
        const { cx, cy, cz, bx, by, bz } = p._;
        let n = 0, inside = 0, mismatches = 0;
        const target = id === 'fixtures' ? 1000 : 40;
        for (let q = 0; q < target * 30 && (n < target || inside < target / 3); q++) {
            const x = cx + bx * (2 * random() - 1);
            const y = cy + by * (2 * random() - 1);
            const z = cz + bz * (2 * random() - 1);
            const expected = primInside(p, x, y, z);
            if (!expected && n >= target) continue;
            ray.origin.set(x, y, z);
            let intersections = 0;
            for (const [a, b, c] of triangles)
                if (ray.intersectTriangle(a, b, c, false, hit)) intersections++;
            const actual = intersections % 2 === 1;
            n++; inside += Number(expected);
            if (actual !== expected) {
                mismatches++;
                row[expected ? 'misses' : 'extra']++;
            }
        }
        row.samples += n; row.inside += inside;
        if (mismatches > n * 0.20) failures.push({ id, i, bucket, n, inside, mismatches });
    }
    return { stats, failures };
}"""

with Runner() as runner:
    page = runner.page(640, 360, '?q=low&vox=mesh')
    result = page.evaluate(CHECK)
    for shape, values in result['stats'].items():
        print(shape, values)
    assert not result['failures'], result['failures']
    assert result['stats']['tap r']['misses'] == result['stats']['tap r']['extra'] == 0
    for shape, row in result['stats'].items():
        assert row['extra'] / row['samples'] < 0.005, (shape, row)
        assert row['misses'] / row['inside'] < 0.08, (shape, row)
    assert not runner.errs, runner.errs

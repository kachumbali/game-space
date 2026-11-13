"""Report differently coloured authored prim surfaces that overlap in mesh mode."""
import argparse
import csv
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / 'tests'))
from lib import Runner

AUDIT = """([id, detail]) => {
    const { SHIPS, resFor, hullPrimTriangles, primInside, prepPrim } = __game;
    const ship = SHIPS[id], res = resFor(ship, detail);
    const tier = res < 120 || ship.noDetail ? 0 : detail >= 6 ? 2 : 0;
    const entries = ship.prims.flatMap((p, index) => {
        if (!['tap', 'ell', 'seg'].includes(p.t) || p.lod > tier) return [];
        return [{ p, index, bounds: prepPrim(p), mirrored: ship.mirror && !p.noMirror }];
    });
    const weights = [[1/3, 1/3, 1/3], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]];
    const eps = Math.max(1e-6, ship.length * 0.00002);
    const result = [];
    for (const a of entries) {
        const others = entries.filter(b => a !== b && (a.p.col !== b.p.col || !!a.p.glow !== !!b.p.glow));
        const pairs = new Map();
        for (const [v0, v1, v2] of hullPrimTriangles(a.p, ship.length, detail)) {
            const u = v1.map((n, i) => n - v0[i]), v = v2.map((n, i) => n - v0[i]);
            const normal = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]];
            const size = Math.hypot(...normal);
            if (size === 0) continue;
            const step = normal.map(n => n * eps / size);
            for (const [w0, w1, w2] of weights) {
                const x = v0[0]*w0 + v1[0]*w1 + v2[0]*w2;
                const y = v0[1]*w0 + v1[1]*w1 + v2[1]*w2;
                const z = v0[2]*w0 + v1[2]*w1 + v2[2]*w2;
                if (a.mirrored && x < 0) continue;
                for (const sign of a.mirrored ? [1, -1] : [1]) {
                    for (const b of others) {
                        const bx = b.mirrored ? Math.abs(sign*x) : sign*x;
                        const { cx, cy, cz, bx: rx, by: ry, bz: rz } = b.bounds;
                        if (Math.abs(bx - cx) > rx + eps || Math.abs(y - cy) > ry + eps || Math.abs(z - cz) > rz + eps) continue;
                        const inside = offset => {
                            const px = sign*(x + offset*step[0]);
                            return primInside(b.p, b.mirrored ? Math.abs(px) : px, y + offset*step[1], z + offset*step[2]);
                        };
                        const inward = inside(-1), outward = inside(1);
                        if (!inward && !outward) continue;
                        const counts = pairs.get(b.index) || [0, 0];
                        counts[inward && outward ? 0 : 1]++;
                        pairs.set(b.index, counts);
                    }
                }
            }
        }
        for (const [other, [inside, coincident]] of pairs) {
            result.push({ prim: a.index, other, inside, coincident });
        }
    }
    return result;
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ships', nargs='*', help='ship IDs (default is the whole fleet)')
    parser.add_argument('--detail', type=int, choices=(2, 6), default=6)
    args = parser.parse_args()
    writer = csv.DictWriter(sys.stdout, fieldnames=['ship', 'detail', 'prim', 'other', 'inside', 'coincident'])
    writer.writeheader()
    with Runner() as runner:
        page = runner.page(640, 360, '?q=low&vox=mesh')
        page.evaluate('() => { __game.__paused = true; }')
        ids = page.evaluate('Object.keys(__game.SHIPS)')
        if set(args.ships) - set(ids):
            parser.error('unknown ships: ' + ', '.join(sorted(set(args.ships) - set(ids))))
        for ship in args.ships or ids:
            rows = page.evaluate(AUDIT, [ship, args.detail])
            writer.writerows(dict(ship=ship, detail=args.detail, **row) for row in rows)
            print(f'{ship}: {len(rows)} ordered prim pairs', file=sys.stderr, flush=True)
        errors = [e for e in runner.errs if e[0] != 'http']
        if errors:
            raise RuntimeError(errors)


if __name__ == '__main__':
    main()

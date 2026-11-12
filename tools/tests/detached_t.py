"""Check 6-connected solid components of every authored hull at tablet and high detail."""
import sys

from lib import Runner

# Keys are (ship, detail, sorted zero-based prim owners).
EXCEPTIONS = {}

COMPONENTS = """([id, detail]) => {
    const { DB, SHIPS, resFor, voxelize } = __game;
    const ship = SHIPS[id];
    const authoredScale = DB.ships[id].length / ship.length;
    const { grid, pgrid, nx, ny, nz, hx, hy, hz, vs } = voxelize(ship, resFor(ship, detail), detail, true);
    const seen = new Uint8Array(grid.length);
    const queue = new Int32Array(grid.length);
    const plane = ny * nz;
    const components = [];
    for (let seed = 0; seed < grid.length; seed++) {
        if (grid[seed] < 0 || seen[seed]) continue;
        let size = 1;
        seen[seed] = 1;
        queue[0] = seed;
        const lo = [nx, ny, nz], hi = [-1, -1, -1];
        const owners = new Set();
        const enqueue = cell => {
            if (grid[cell] < 0 || seen[cell]) return;
            seen[cell] = 1;
            queue[size++] = cell;
        };
        for (let head = 0; head < size; head++) {
            const cell = queue[head];
            const i = Math.floor(cell / plane), j = Math.floor(cell / nz) % ny, k = cell % nz;
            if (i > 0) enqueue(cell - plane);
            if (i + 1 < nx) enqueue(cell + plane);
            if (j > 0) enqueue(cell - nz);
            if (j + 1 < ny) enqueue(cell + nz);
            if (k > 0) enqueue(cell - 1);
            if (k + 1 < nz) enqueue(cell + 1);
            lo[0] = Math.min(lo[0], i); hi[0] = Math.max(hi[0], i);
            lo[1] = Math.min(lo[1], j); hi[1] = Math.max(hi[1], j);
            lo[2] = Math.min(lo[2], k); hi[2] = Math.max(hi[2], k);
            owners.add(pgrid[cell]);
        }
        const origin = [-hx, -hy, -hz];
        components.push({ size,
            lo: lo.map((n, a) => (origin[a] + n * vs) * authoredScale),
            hi: hi.map((n, a) => (origin[a] + (n + 1) * vs) * authoredScale),
            owners: [...owners].sort((a, b) => a - b),
        });
    }
    components.sort((a, b) => b.size - a.size);
    return { total: components.length, detached: components.slice(1).filter(c => c.size > 2) };
}"""


def main():
    failed = False
    with Runner() as runner:
        page = runner.page(640, 360, '?q=low')
        page.evaluate('() => { __game.__paused = true; }')
        ids = page.evaluate('Object.keys(__game.SHIPS)')
        for detail in (2, 6):
            for ship in ids:
                result = page.evaluate(COMPONENTS, [ship, detail])
                detached = result['detached']
                print(f'{ship} detail={detail}: {result["total"]} components, {len(detached)} detached >2 voxels')
                for part in detached:
                    owners = tuple(part['owners'])
                    reason = EXCEPTIONS.get((ship, detail, owners))
                    failed |= not bool(reason)
                    lo, hi = (tuple(round(n, 3) for n in part[bound]) for bound in ('lo', 'hi'))
                    status = f'EXEMPT ({reason})' if reason else 'FAIL'
                    print(f'  {status} {part["size"]} voxels, {lo} to {hi} m, prims {owners}')
    return int(failed)


if __name__ == '__main__':
    sys.exit(main())

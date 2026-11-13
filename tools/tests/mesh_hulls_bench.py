"""Measure uncached runtime hull construction and save per-fleet contact sheets."""
import argparse
import base64
from pathlib import Path

from lib import Runner

BUILD = """([id, idx, mesh, drop, shade]) => {
    const g = __game, def = g.SHIPS[id];
    const gridIdx = Math.max(0, idx - drop), gridRes = g.resFor(def, gridIdx);
    const times = [];
    let result;
    for (let pass = 0; pass < 5; pass++) {
        g.clearVoxelCache();
        const t = performance.now();
        const D = g.voxelize(def, gridRes, gridIdx);
        const group = mesh ? g.buildHullMesh(def, idx, undefined, D, shade) : g.voxStaticBody(D);
        if (!mesh) {
            const glow = D.voxels.filter(v => v.g);
            if (glow.length) {
                const m = new g.THREE.InstancedMesh(new g.THREE.BoxGeometry(D.vs * 1.03, D.vs * 1.03, D.vs * 1.03),
                    new g.THREE.MeshBasicMaterial(), glow.length);
                const matrix = new g.THREE.Matrix4(), color = new g.THREE.Color();
                glow.forEach((v, i) => {
                    m.setMatrixAt(i, matrix.makeTranslation(v.x, v.y, v.z));
                    m.setColorAt(i, color.setRGB(v.cr, v.cg, v.cb));
                });
                group.add(m);
            }
        }
        times.push(performance.now() - t);
        if (pass === 4) {
            let triangles = 0, draws = 0;
            group.traverse(m => {
                if (!m.isMesh) return;
                const n = (m.geometry.index?.count ?? m.geometry.attributes.position?.count ?? 0)
                    * (m.isInstancedMesh ? m.count : 1) / 3;
                if (n) { draws++; triangles += n; }
            });
            result = { triangles, draws, gridRes };
        }
        group.traverse(m => {
            if (m.isMesh) m.geometry.dispose();
            if (m.isInstancedMesh) { m.material.dispose(); m.dispose(); }
        });
    }
    result.ms = times.slice(1).sort((a, b) => a - b).slice(1, 3).reduce((a, b) => a + b) / 2;
    return result;
}"""

TILE = """([id, idx, mesh, size, shade]) => {
    const g = __game, T = g.THREE, def = g.SHIPS[id], renderer = g.renderer;
    g.__paused = true;
    const scene = new T.Scene();
    scene.background = new T.Color(0x171f2a);
    const camera = new T.PerspectiveCamera(37, 4 / 3, 0.1, def.length * 20);
    const group = mesh ? g.buildHullMesh(def, idx, undefined, undefined, shade) : (() => {
        const data = g.voxelize(def, g.resFor(def, idx), idx);
        const body = g.voxStaticBody(data), glow = data.voxels.filter(v => v.g);
        if (!glow.length) return body;
        const light = new T.InstancedMesh(new T.BoxGeometry(data.vs * 1.03, data.vs * 1.03, data.vs * 1.03), new T.MeshBasicMaterial(), glow.length);
        const matrix = new T.Matrix4(), color = new T.Color();
        glow.forEach((v, i) => {
            light.setMatrixAt(i, matrix.makeTranslation(v.x, v.y, v.z));
            light.setColorAt(i, color.setRGB(v.cr, v.cg, v.cb));
        });
        const wrapper = new T.Group(); wrapper.add(body, light);
        return wrapper;
    })();
    scene.add(group, new T.HemisphereLight(0xcde3ff, 0x4d3b31, 2.7));
    const lamp = new T.DirectionalLight(0xfff2d5, 2.8);
    lamp.position.set(1, 3, -2); scene.add(lamp);
    camera.position.set(1.3, 0.94, -1.47).normalize().multiplyScalar(def.length * 1.7);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(1); renderer.setSize(size, size * 0.75, false);
    renderer.render(scene, camera);
    const tile = renderer.domElement.toDataURL();
    group.traverse(m => {
        if (m.isMesh) m.geometry.dispose();
        if (m.isInstancedMesh) { m.material.dispose(); m.dispose(); }
    });
    g.clearVoxelCache();
    return tile;
}"""


SHEET = """async ([ships, tiles, width, height, cols]) => {
    const canvas = document.createElement('canvas');
    canvas.width = cols * width;
    canvas.height = Math.ceil(ships.length / cols) * (height + 22);
    const context = canvas.getContext('2d');
    context.fillStyle = '#131a25';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '13px sans-serif';
    const images = await Promise.all(tiles.map(async src => {
        const image = new Image(); image.src = src; await image.decode(); return image;
    }));
    images.forEach((image, i) => {
        const x = i % cols * width, y = Math.floor(i / cols) * (height + 22);
        context.drawImage(image, x, y);
        context.fillText(ships[i], x + 8, y + height + 15);
    });
    return canvas.toDataURL();
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--grid-drop', type=int, choices=(0, 1, 2), default=0)
    parser.add_argument('--shots', type=Path)
    parser.add_argument('--compare-shading', action='store_true', help='Measure the mesh with shading disabled as a same-session control.')
    parser.add_argument('--ships', help='Comma-separated ship IDs')
    args = parser.parse_args()
    if args.shots:
        args.shots.mkdir(parents=True, exist_ok=True)
    header = 'ship,detail,smooth_triangles,smooth_draws,smooth_ms,mesh_triangles,mesh_draws,mesh_ms,smooth_grid,mesh_grid'
    if args.compare_shading:
        header += ',unshaded_triangles,unshaded_draws,unshaded_ms'
    print(header, flush=True)
    with Runner() as runner:
        page = runner.page(640, 360, '?q=low&seed=42')
        page.evaluate('() => { __game.__paused = true; }')
        ships = args.ships.split(',') if args.ships else page.evaluate('Object.keys(__game.SHIPS)')
        for detail in (2, 6):
            if args.shots:
                tile_w, tile_h, cols = 240, 180, 5
                sheets = [[], [], []] if args.compare_shading else [[], []]
            for ship in ships:
                a = page.evaluate(BUILD, [ship, detail, False, 0, False])
                b = page.evaluate(BUILD, [ship, detail, True, args.grid_drop, True])
                row = f'{ship},{detail},{a["triangles"]},{a["draws"]},{a["ms"]:.2f},{b["triangles"]},{b["draws"]},{b["ms"]:.2f},{a["gridRes"]},{b["gridRes"]}'
                if args.compare_shading:
                    c = page.evaluate(BUILD, [ship, detail, True, args.grid_drop, False])
                    row += f',{c["triangles"]},{c["draws"]},{c["ms"]:.2f}'
                print(row, flush=True)
                if args.shots:
                    for mode, sheet in enumerate(sheets):
                        sheet.append(page.evaluate(TILE, [ship, detail, mode != 0, tile_w, mode == 1]))
            if args.shots:
                for mode, sheet in zip(('chamfered', 'mesh', 'mesh-unshaded'), sheets):
                    png = page.evaluate(SHEET, [ships, sheet, tile_w, tile_h, cols])
                    (args.shots / f'{mode}-detail-{detail}.png').write_bytes(base64.b64decode(png.split(',')[1]))
        assert not runner.errs, runner.errs


if __name__ == '__main__':
    main()

if (params.has('yard')) {
  document.body.classList.add('yard');
  scene.backgroundIntensity = 0.42;
  for (const YARD_child of scene.children) if (!YARD_child.isLight && YARD_child !== camera) YARD_child.visible = false;

  const YARD_root = document.createElement('div');
  YARD_root.id = 'yard';
  YARD_root.innerHTML = `<section class="ypanel">
    <h1>SHIPYARD / VOXEL WORKBENCH</h1>
    <label for="yard-ship">SHIP</label><select id="yard-ship"></select>
    <div class="yardrow"><label><input id="yard-grid" type="checkbox" checked> grid</label><span class="yardnote">drag to orbit · wheel to zoom · pinch on touch</span></div>
    <div id="yard-stat" class="yardstat"></div>
    <div id="yard-error" role="alert"></div>
    <div class="yardnote" id="yard-reference">CYAN SILHOUETTE: KESTREL / 12.4 m</div>
  </section>`;
  document.body.appendChild(YARD_root);

  const YARD_select = document.getElementById('yard-ship');
  const YARD_stat = document.getElementById('yard-stat');
  const YARD_canvas = document.getElementById('c');
  const YARD_group = new THREE.Group();
  const YARD_model = new THREE.Group();
  const YARD_color = new THREE.Color();
  const YARD_material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 });
  const YARD_glowMaterial = new THREE.MeshBasicMaterial();
  let YARD_def = null, YARD_meshes = [], YARD_orbit = 0.55, YARD_elevation = 0.32, YARD_distance = 1, YARD_drag = null;
  const YARD_grid = new THREE.Group();
  const YARD_reference = new THREE.Group();
  const YARD_palette = { engine: 0xff8a20, gun: 0xff3030, turret: 0xffe040, radar: 0x30e0ff, shield: 0x4080ff, radiator: 0xff40ff, power: 0xffffff };

  const YARD_addLine = (group, points, color, opacity = 1) => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    geo.morphAttributes = {};
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    group.add(line);
    return line;
  };

  function YARD_buildGrid(def) {
    YARD_grid.clear();
    const span = Math.max(40, Math.ceil(Math.max(def.half[0], def.half[2]) * 4 / 10) * 10);
    const grid = new THREE.GridHelper(span, span, 0x42685f, 0x243b38);
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    YARD_grid.add(grid);
    const ruler = [];
    for (let x = -span / 2; x <= span / 2; x += 1) {
      const major = x % 5 === 0;
      ruler.push(new THREE.Vector3(x, 0.015, -span / 2), new THREE.Vector3(x, 0.015, -span / 2 + (major ? 0.75 : 0.35)));
    }
    YARD_addLine(YARD_grid, ruler, 0x74bfa4, 0.8);
    scene.add(YARD_grid);
  }

  function YARD_buildReference(def) {
    YARD_reference.clear();
    const ref = __game.SHIPS.kestrel, offset = Math.max(def.half[0], 4) + 4;
    const points = [
      [0, -6.2], [0.55, -3.4], [1.0, -1.2], [4.9, 1.7], [4.2, 2.8],
      [1.2, 1.8], [0.55, 3.0], [0.65, 5.7], [0, 6.2], [-0.65, 5.7],
      [-0.55, 3.0], [-1.2, 1.8], [-4.2, 2.8], [-4.9, 1.7], [-1.0, -1.2], [-0.55, -3.4], [0, -6.2],
    ].map(([x, z]) => new THREE.Vector3(x + offset, 0.04, z));
    YARD_addLine(YARD_reference, points, 0x54d9ef);
    scene.add(YARD_reference);
    document.getElementById('yard-reference').textContent = `CYAN SILHOUETTE: KESTREL / ${ref.length.toFixed(1)} m`;
  }

  function YARD_fit(def) {
    const radius = Math.max(def.radius || 0, ...def.half);
    YARD_distance = Math.max(radius * 2.5, 20);
    YARD_camera();
  }

  function YARD_camera() {
    const camera = __game.camera;
    const c = Math.cos(YARD_elevation);
    camera.fov = 42;
    camera.position.set(Math.sin(YARD_orbit) * c * YARD_distance, Math.sin(YARD_elevation) * YARD_distance, Math.cos(YARD_orbit) * c * YARD_distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }

  function YARD_clearModel() {
    for (const mesh of YARD_meshes) {
      YARD_model.remove(mesh);
      mesh.geometry.dispose();
    }
    YARD_meshes = [];
  }

  function YARD_setDefinition(def) {
    YARD_def = def;
    YARD_clearModel();
    const t0 = performance.now();
    const idx = 2, res = Math.min(120, resFor(def, idx));
    const data = voxelize(def, res, idx);
    const body = [], glow = [];
    for (const voxel of data.voxels) (voxel.g ? glow : body).push(voxel);
    for (const [voxels, material, scale] of [[body, YARD_material, 1], [glow, YARD_glowMaterial, 1.03]]) {
      if (!voxels.length) continue;
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(data.vs * scale, data.vs * scale, data.vs * scale), material, voxels.length);
      const matrix = new THREE.Matrix4();
      voxels.forEach((voxel, i) => {
        matrix.makeTranslation(voxel.x, voxel.y, voxel.z);
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, YARD_color.setRGB(voxel.cr, voxel.cg, voxel.cb));
      });
      mesh.frustumCulled = false;
      YARD_model.add(mesh);
      YARD_meshes.push(mesh);
    }
    voxCache.delete(def.id + ':' + res + (data.tier ? ':t' + data.tier : ''));
    YARD_stat.textContent = `${def.name || def.id} · ${data.voxels.length.toLocaleString()} voxels · ${(performance.now() - t0).toFixed(0)} ms · ${def.length} m`;
    YARD_buildGrid(def);
    YARD_buildReference(def);
    YARD_fit(def);
  }

  function YARD_selectShip(id) {
    const original = __game.SHIPS[id];
    const def = original ? { ...original, id: 'yard-' + id, prims: original.prims } : {
      ...__game.SHIPS.kestrel, id: 'yard-new', name: 'NEW SHIP', prims: [], comps: [], mounts: [], turrets: [], engines: [],
    };
    YARD_model.rotation.set(0, 0, 0);
    YARD_setDefinition(def);
  }

  const YARD_options = Object.keys(__game.SHIPS).sort().map(id => `<option value="${id}">${id.toUpperCase()}</option>`);
  YARD_options.push('<option value="__new">NEW</option>');
  YARD_select.innerHTML = YARD_options.join('');
  const YARD_requested = params.get('yard');
  YARD_select.value = YARD_requested && __game.SHIPS[YARD_requested.toLowerCase()] ? YARD_requested.toLowerCase() : 'kestrel';
  YARD_select.addEventListener('change', () => YARD_selectShip(YARD_select.value === '__new' ? '__new' : YARD_select.value));
  document.getElementById('yard-grid').addEventListener('change', event => { YARD_grid.visible = event.target.checked; });
  YARD_selectShip(YARD_select.value);
  scene.add(YARD_group);
  YARD_group.add(YARD_model);

  YARD_canvas.addEventListener('pointerdown', event => {
    if (event.target.closest('#yard')) return;
    YARD_drag = { x: event.clientX, y: event.clientY, orbit: YARD_orbit, elevation: YARD_elevation };
    YARD_canvas.setPointerCapture(event.pointerId);
  });
  YARD_canvas.addEventListener('pointermove', event => {
    if (!YARD_drag) return;
    YARD_orbit = YARD_drag.orbit - (event.clientX - YARD_drag.x) * 0.008;
    YARD_elevation = Math.max(-1.35, Math.min(1.35, YARD_drag.elevation + (event.clientY - YARD_drag.y) * 0.006));
    YARD_camera();
  });
  YARD_canvas.addEventListener('pointerup', () => { YARD_drag = null; });
  YARD_canvas.addEventListener('wheel', event => {
    YARD_distance = Math.max(2, Math.min(10000, YARD_distance * Math.exp(event.deltaY * 0.001)));
    YARD_camera();
  }, { passive: true });
}

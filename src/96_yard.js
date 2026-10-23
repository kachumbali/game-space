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
    <label for="yard-prims">PRIMS JS SOURCE (plain object array accepted)</label>
    <textarea id="yard-prims" spellcheck="false" aria-label="Ship prims JavaScript source"></textarea>
    <div class="yardnote">JSON-compatible primitive objects; types include tap, ell, seg, paint and text.</div>
    <div id="yard-error" class="yarderror" role="alert" aria-live="polite"></div>
    <label for="yard-db-entry">DATABASE ENTRY JSON</label>
    <textarea id="yard-db-entry" spellcheck="false" aria-label="Ship database entry JSON"></textarea>
    <div id="yard-db-error" class="yarderror" role="alert" aria-live="polite"></div>
    <div class="yardrow">
      <label><input id="yard-comp-markers" type="checkbox" checked> comps</label>
      <label><input id="yard-mount-markers" type="checkbox" checked> mounts</label>
      <label><input id="yard-turret-markers" type="checkbox" checked> turrets</label>
      <label><input id="yard-engine-markers" type="checkbox" checked> engines</label>
      <label><input id="yard-extents-toggle" type="checkbox"> extents box</label>
    </div>
    <div class="yardrow">
      <label>MIRROR <input id="yard-mirror" type="checkbox"></label>
      <label for="yard-detail">DETAIL</label><select id="yard-detail"></select>
      <label for="yard-lod">LOD</label><select id="yard-lod"><option value="0">0</option><option value="1">1 step</option><option value="2">2 steps</option><option value="3">3 steps</option></select>
    </div>
    <div id="yard-bounds" class="yardnote"></div>
    <button id="yard-apply-bounds" type="button">Apply suggested bounds</button>
    <div id="yard-stat" class="yardstat"></div>
    <div class="yardnote" id="yard-reference">CYAN SILHOUETTE: KESTREL / 12.4 m</div>
  </section>`;
  document.body.appendChild(YARD_root);

  const YARD_select = document.getElementById('yard-ship');
  const YARD_prims = document.getElementById('yard-prims');
  const YARD_dbEditor = document.getElementById('yard-db-entry');
  const YARD_stat = document.getElementById('yard-stat');
  const YARD_error = document.getElementById('yard-error');
  const YARD_dbError = document.getElementById('yard-db-error');
  const YARD_bounds = document.getElementById('yard-bounds');
  const YARD_canvas = document.getElementById('c');
  const YARD_group = new THREE.Group();
  const YARD_model = new THREE.Group();
  const YARD_color = new THREE.Color();
  const YARD_material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 });
  const YARD_glowMaterial = new THREE.MeshBasicMaterial();
  let YARD_def = null, YARD_dbEntry = null, YARD_meshes = [], YARD_orbit = 0.55, YARD_elevation = 0.32, YARD_distance = 1, YARD_drag = null, YARD_rebuildTimer = 0, YARD_dbTimer = 0, YARD_detailIdx = 2, YARD_lodDrop = 0;
  const YARD_grid = new THREE.Group();
  const YARD_reference = new THREE.Group();
  const YARD_markerRoot = new THREE.Group();
  const YARD_markerGroups = Object.fromEntries(['comps', 'mounts', 'turrets', 'engines'].map(kind => [kind, new THREE.Group()]));
  const YARD_extents = new THREE.Group();
  const YARD_palette = { engine: 0xff8a20, gun: 0xff3030, turret: 0xffe040, radar: 0x30e0ff, shield: 0x4080ff, radiator: 0xff40ff, power: 0xffffff };
  YARD_model.add(YARD_markerRoot);
  for (const group of Object.values(YARD_markerGroups)) YARD_markerRoot.add(group);
  YARD_model.add(YARD_extents);

  const YARD_addLine = (group, points, color, opacity = 1) => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    geo.morphAttributes = {};
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    group.add(line);
    return line;
  };

  function YARD_buildGrid(def) {
    YARD_emptyGroup(YARD_grid);
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
    YARD_emptyGroup(YARD_reference);
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

  function YARD_emptyGroup(group) {
    for (const child of [...group.children]) {
      group.remove(child);
      child.geometry?.dispose();
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) material?.dispose();
    }
  }

  function YARD_resolution(def, idx) {
    let res = resFor(def, idx);
    const cells = value => Math.ceil(2 * def.half[0] * value / def.length) * Math.ceil(2 * def.half[1] * value / def.length) * Math.ceil(2 * def.half[2] * value / def.length);
    while (res > DETAIL_STEPS[0] && cells(res) > 4000000) res = Math.max(DETAIL_STEPS[0], Math.floor(res * 0.85));
    return res;
  }

  function YARD_setDefinition(def, refit = false) {
    const t0 = performance.now();
    const idx = Math.max(0, YARD_detailIdx - YARD_lodDrop), res = YARD_resolution(def, idx);
    const data = voxelize(def, res, idx);
    const body = [], glow = [];
    const nextMeshes = [];
    for (const voxel of data.voxels) (voxel.g ? glow : body).push(voxel);
    try {
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
        nextMeshes.push(mesh);
      }
    } catch (error) {
      for (const mesh of nextMeshes) mesh.geometry.dispose();
      throw error;
    }
    YARD_clearModel();
    YARD_def = def;
    for (const mesh of nextMeshes) YARD_model.add(mesh);
    YARD_meshes = nextMeshes;
    voxCache.delete(def.id + ':' + res + (data.tier ? ':t' + data.tier : ''));
    YARD_stat.textContent = `${def.name || def.id} · ${data.voxels.length.toLocaleString()} voxels · ${(performance.now() - t0).toFixed(0)} ms · ${def.length} m`;
    YARD_buildGrid(def);
    YARD_buildReference(def);
    YARD_buildExtents(def);
    YARD_bounds.textContent = `Suggested half: ${YARD_suggestBounds(def.prims).half.map(value => value.toFixed(1)).join(', ')} m · radius ${YARD_suggestBounds(def.prims).radius.toFixed(1)} m`;
    if (refit) YARD_fit(def);
  }

  function YARD_suggestBounds(prims) {
    const max = [0, 0, 0];
    for (const prim of prims) {
      let lo, hi;
      if (prim.t === 'paint' && Array.isArray(prim.box)) {
        lo = prim.box.slice(0, 3); hi = prim.box.slice(3, 6);
      } else if (prim.t === 'text' && Array.isArray(prim.c)) {
        lo = prim.c; hi = prim.c;
      } else if (prim.t === 'seg') {
        const radius = Math.max(prim.ra || 0, prim.rb || 0);
        lo = prim.a.map(value => value - radius); hi = prim.b.map(value => value + radius);
        for (let axis = 0; axis < 3; axis++) if (lo[axis] > hi[axis]) [lo[axis], hi[axis]] = [hi[axis], lo[axis]];
      } else if (prim.t === 'ell' || prim.t === 'tap') {
        const bounds = prepPrim(prim);
        lo = [bounds.cx - bounds.bx, bounds.cy - bounds.by, bounds.cz - bounds.bz];
        hi = [bounds.cx + bounds.bx, bounds.cy + bounds.by, bounds.cz + bounds.bz];
      } else continue;
      for (let axis = 0; axis < 3; axis++) max[axis] = Math.max(max[axis], Math.abs(lo[axis]), Math.abs(hi[axis]));
    }
    const half = max.map(value => Math.ceil(value * 10) / 10);
    return { half, radius: Math.ceil(Math.hypot(...half) * 10) / 10 };
  }

  function YARD_buildExtents(def) {
    YARD_emptyGroup(YARD_extents);
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(...def.half.map(value => value * 2)));
    const box = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9dd9ff, transparent: true, opacity: 0.65 }));
    box.geometry.morphAttributes = {};
    box.material.depthTest = false;
    box.renderOrder = 900;
    YARD_extents.add(box);
    YARD_extents.visible = document.getElementById('yard-extents-toggle').checked;
  }

  function YARD_buildMarkers(entry) {
    for (const group of Object.values(YARD_markerGroups)) YARD_emptyGroup(group);
    const add = (kind, pos, radius, color, mirror) => {
      if (!Array.isArray(pos) || pos.length < 3 || !pos.every(Number.isFinite)) return;
      const geo = new THREE.SphereGeometry(radius, 10, 8);
      const material = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
      const marker = new THREE.Mesh(geo, material);
      marker.position.set(pos[0], pos[1], pos[2]);
      marker.renderOrder = 999;
      YARD_markerGroups[kind].add(marker);
      if (mirror && Math.abs(pos[0]) > 0.05) {
        const other = marker.clone();
        other.position.x = -pos[0];
        YARD_markerGroups[kind].add(other);
      }
    };
    const base = Math.max(0.3, (entry.length || 12) * 0.006);
    for (const comp of entry.comps || []) add('comps', comp.pos, Math.max(base, (comp.r || 1) * 0.45), YARD_palette[comp.role] || 0xaaaaaa, entry.mirror);
    for (const mount of entry.mounts || []) add('mounts', mount.pos, base * 0.7, 0xff3030, entry.mirror);
    for (const turret of entry.turrets || []) add('turrets', turret.pos, base * 0.8, 0xffe040, entry.mirror);
    for (const engine of entry.engines || []) add('engines', engine.pos, base * 0.9, 0xff8a20, entry.mirror);
  }

  function YARD_colorStrings(entry) {
    const copy = JSON.parse(JSON.stringify(entry));
    const hexKeys = new Set(['color', 'flameColor', 'flame']);
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (hexKeys.has(key) && Number.isInteger(child)) value[key] = '#' + child.toString(16).padStart(6, '0');
        else visit(child);
      }
    };
    visit(copy);
    return copy;
  }

  function YARD_validateEntry(entry) {
    const errors = [], comps = new Set((entry.comps || []).map(comp => comp.id));
    for (const kind of ['mounts', 'turrets']) for (const mount of entry[kind] || []) {
      if (!DB.weapons[mount.w]) errors.push(`${kind}: unknown weapon ${mount.w}`);
      if (!comps.has(mount.comp)) errors.push(`${kind}: weapon ${mount.w} mounted on missing component ${mount.comp}`);
      const store = mount.store;
      if (store && !Object.hasOwn(entry.stores || {}, store) && DB.weapons[mount.w]?.kind !== 'spine') errors.push(`${kind}: store ${store} not in stores`);
    }
    for (const engine of entry.engines || []) if (!comps.has(engine.comp)) errors.push(`engines: missing component ${engine.comp}`);
    if (!Object.hasOwn(DB.armor, entry.armor?.type)) errors.push(`unknown armour ${entry.armor?.type}`);
    if (!Object.hasOwn(DB.mass, entry.cls) || !Object.hasOwn(DB.armorThreshCls, entry.cls)) errors.push(`class ${entry.cls} missing from mass/armorThreshCls`);
    for (const comp of entry.comps || []) if (comp.hp <= 0) errors.push(`${comp.id}: hp <= 0`);
    const colors = value => {
      if (Array.isArray(value)) value.forEach(colors);
      else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
        if (['color', 'flameColor', 'flame'].includes(key) && !(typeof child === 'string' && /^#[0-9a-fA-F]{6}$/.test(child))) errors.push(`${key}: bad colour ${JSON.stringify(child)}`);
        colors(child);
      }
    };
    colors(entry);
    return errors;
  }

  function YARD_dbChange(text = YARD_dbEditor.value) {
    try {
      const entry = JSON.parse(text);
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Database entry must be a JSON object.');
      YARD_dbEntry = entry;
      YARD_buildMarkers(entry);
      const errors = YARD_validateEntry(entry);
      YARD_dbError.textContent = errors.length ? errors.map(error => '• ' + error).join('\n') : 'Database entry valid.';
      document.getElementById('yard-mirror').checked = !!entry.mirror;
      const nextDef = { ...YARD_def, ...entry, id: YARD_def.id, prims: YARD_def.prims };
      if (nextDef.mirror !== YARD_def.mirror || JSON.stringify(nextDef.half) !== JSON.stringify(YARD_def.half)) YARD_setDefinition(nextDef);
      else YARD_def = nextDef;
    } catch (error) {
      YARD_dbError.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  function YARD_loadEntry(id) {
    const entry = id === '__new' ? { ...YARD_colorStrings(DB.ships.kestrel), id: 'new_ship', name: 'NEW SHIP' } : YARD_colorStrings(DB.ships[id]);
    YARD_dbEditor.value = JSON.stringify(entry, null, 2);
    YARD_dbChange();
  }

  function YARD_selectShip(id) {
    const original = __game.SHIPS[id];
    const def = original ? { ...original, id: 'yard-' + id, prims: JSON.parse(JSON.stringify(original.prims, (key, value) => key === '_' ? undefined : value)) } : {
      ...__game.SHIPS.kestrel, id: 'yard-new', name: 'NEW SHIP', prims: [], comps: [], mounts: [], turrets: [], engines: [],
    };
    YARD_model.rotation.set(0, 0, 0);
    YARD_prims.value = JSON.stringify(def.prims, (key, value) => key === '_' ? undefined : value, 2);
    YARD_error.textContent = '';
    YARD_detailIdx = 2;
    YARD_lodDrop = 0;
    document.getElementById('yard-detail').value = String(YARD_detailIdx);
    document.getElementById('yard-lod').value = '0';
    YARD_setDefinition(def, true);
    YARD_loadEntry(id);
  }

  const YARD_detail = document.getElementById('yard-detail');
  YARD_detail.innerHTML = DETAIL_STEPS.map((step, index) => `<option value="${index}">${index}: ${step}</option>`).join('');
  const YARD_options = Object.keys(__game.SHIPS).sort().map(id => `<option value="${id}">${id.toUpperCase()}</option>`);
  YARD_options.push('<option value="__new">NEW</option>');
  YARD_select.innerHTML = YARD_options.join('');
  const YARD_requested = params.get('yard');
  YARD_select.value = YARD_requested && __game.SHIPS[YARD_requested.toLowerCase()] ? YARD_requested.toLowerCase() : 'kestrel';
  YARD_select.addEventListener('change', () => YARD_selectShip(YARD_select.value === '__new' ? '__new' : YARD_select.value));
  YARD_prims.addEventListener('input', () => {
    clearTimeout(YARD_rebuildTimer);
    YARD_error.textContent = '';
    YARD_rebuildTimer = setTimeout(() => {
      try {
        const prims = JSON.parse(YARD_prims.value);
        if (!Array.isArray(prims)) throw new Error('Prims source must evaluate to an array.');
        if (prims.some(prim => !prim || typeof prim !== 'object' || typeof prim.t !== 'string')) throw new Error('Every prim must be an object with a string t field.');
        YARD_setDefinition({ ...YARD_def, prims });
        YARD_error.textContent = '';
      } catch (error) {
        YARD_error.textContent = error instanceof Error ? error.message : String(error);
      }
    }, 400);
  });
  YARD_dbEditor.addEventListener('input', () => {
    clearTimeout(YARD_dbTimer);
    YARD_dbTimer = setTimeout(() => YARD_dbChange(), 250);
  });
  for (const [kind, id] of [['comps', 'yard-comp-markers'], ['mounts', 'yard-mount-markers'], ['turrets', 'yard-turret-markers'], ['engines', 'yard-engine-markers']]) {
    document.getElementById(id).addEventListener('change', event => { YARD_markerGroups[kind].visible = event.target.checked; });
  }
  document.getElementById('yard-extents-toggle').addEventListener('change', event => { YARD_extents.visible = event.target.checked; });
  document.getElementById('yard-detail').addEventListener('change', event => {
    YARD_detailIdx = Number(event.target.value);
    YARD_setDefinition(YARD_def);
  });
  document.getElementById('yard-lod').addEventListener('change', event => {
    YARD_lodDrop = Number(event.target.value);
    YARD_setDefinition(YARD_def);
  });
  document.getElementById('yard-mirror').addEventListener('change', event => {
    if (!YARD_dbEntry) return;
    YARD_dbEntry.mirror = event.target.checked;
    YARD_dbEditor.value = JSON.stringify(YARD_dbEntry, null, 2);
    YARD_dbChange();
  });
  document.getElementById('yard-apply-bounds').addEventListener('click', () => {
    const suggestion = YARD_suggestBounds(YARD_def.prims);
    YARD_dbEntry.half = suggestion.half;
    YARD_dbEntry.radius = suggestion.radius;
    YARD_dbEditor.value = JSON.stringify(YARD_dbEntry, null, 2);
    YARD_dbChange();
  });
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

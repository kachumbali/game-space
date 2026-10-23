if (params.has('yard')) {
  document.body.classList.add('yard');
  scene.backgroundIntensity = 0.42;
  for (const YARD_child of scene.children) if (!YARD_child.isLight && YARD_child !== camera) YARD_child.visible = false;

  const YARD_root = document.createElement('div');
  YARD_root.id = 'yard';
  YARD_root.innerHTML = `<section class="ypanel">
    <header class="yardhead"><h1>SHIPYARD / VOXEL WORKBENCH</h1><button id="yard-panel-toggle" type="button" aria-controls="yard-controls" aria-expanded="true">Collapse</button></header>
    <div class="yard-controls" id="yard-controls">
    <label for="yard-ship">SHIP</label><select id="yard-ship"></select>
    <div class="yardrow"><label for="yard-template">NEW FROM TEMPLATE</label><select id="yard-template"><option value="kestrel">Kestrel / fighter</option><option value="halberd">Halberd / corvette</option><option value="exeter">Exeter / frigate</option></select><button id="yard-new-template" type="button">New ship from template</button></div>
    <div class="yardrow"><label><input id="yard-grid" type="checkbox" checked> grid</label><span class="yardnote">drag to orbit · wheel to zoom · pinch on touch</span></div>
    <div class="yardrow yardviews">
      <button id="yard-frame" type="button">Frame ship</button>
      <button id="yard-view-front" type="button">Front</button>
      <button id="yard-view-side" type="button">Side</button>
      <button id="yard-view-top" type="button">Top</button>
      <button id="yard-view-quarter" type="button">3/4</button>
    </div>
    <div class="yardrow"><label><input id="yard-in-game-scale" type="checkbox"> preview at in-game scale</label></div>
    <div id="yard-size" class="yardnote"></div>
    <label for="yard-prims">PRIMS JS SOURCE (plain object array accepted)</label>
    <textarea id="yard-prims" spellcheck="false" aria-label="Ship prims JavaScript source"></textarea>
    <div class="yardnote">Plain object arrays or helper calls: tap, box, ell, seg, chain, ringSegs, rungs.</div>
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
    <div class="yardrow yardexports">
      <select id="yard-prims-format" aria-label="Prims export format"><option value="helpers">Helper-call syntax</option><option value="json">Plain JSON objects</option></select>
      <button id="yard-copy-prims" type="button">Copy prims JS</button>
      <button id="yard-copy-db" type="button">Copy db entry (JSON)</button>
      <button id="yard-save-sheet" type="button">Save PNG sheet</button>
    </div>
    <div id="yard-export-status" class="yardnote" role="status" aria-live="polite"></div>
    <div id="yard-stat" class="yardstat"></div>
    <div class="yardnote" id="yard-reference">CYAN SILHOUETTE: KESTREL / 12.4 m</div>
    </div>
  </section>`;
  document.body.appendChild(YARD_root);

  const YARD_select = document.getElementById('yard-ship');
  const YARD_prims = document.getElementById('yard-prims');
  const YARD_dbEditor = document.getElementById('yard-db-entry');
  const YARD_stat = document.getElementById('yard-stat');
  const YARD_error = document.getElementById('yard-error');
  const YARD_dbError = document.getElementById('yard-db-error');
  const YARD_bounds = document.getElementById('yard-bounds');
  const YARD_exportStatus = document.getElementById('yard-export-status');
  const YARD_canvas = document.getElementById('c');
  const YARD_group = new THREE.Group();
  const YARD_model = new THREE.Group();
  const YARD_color = new THREE.Color();
  const YARD_material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22 });
  const YARD_glowMaterial = new THREE.MeshBasicMaterial();
  let YARD_def = null, YARD_dbEntry = null, YARD_sourceShipId = null, YARD_gameScale = 1, YARD_meshes = [], YARD_orbit = 0.55, YARD_elevation = 0.32, YARD_distance = 1, YARD_drag = null, YARD_pinchDistance = 0, YARD_rebuildTimer = 0, YARD_dbTimer = 0, YARD_detailIdx = 2, YARD_lodDrop = 0;
  const YARD_pointers = new Map();
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

  function YARD_displayScale() {
    return document.getElementById('yard-in-game-scale').checked ? YARD_gameScale : 1;
  }

  function YARD_buildGrid(def, scale = 1) {
    YARD_emptyGroup(YARD_grid);
    const span = Math.max(40, Math.ceil(Math.max(def.half[0], def.half[2]) * scale * 4 / 10) * 10);
    const grid = new THREE.GridHelper(span, span, 0x42685f, 0x243b38);
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    YARD_grid.add(grid);
    const ruler = [];
    const tick = Math.max(1, Math.ceil(span / 200));
    for (let x = -span / 2; x <= span / 2; x += tick) {
      const major = x % (tick * 5) === 0;
      ruler.push(new THREE.Vector3(x, 0.015, -span / 2), new THREE.Vector3(x, 0.015, -span / 2 + (major ? 0.75 : 0.35)));
      if (major) {
        const label = document.createElement('canvas');
        label.width = 96;
        label.height = 48;
        const context = label.getContext('2d');
        context.fillStyle = '#a3d9c5';
        context.font = '24px ui-monospace, monospace';
        context.textAlign = 'center';
        context.fillText(`${x} m`, 48, 34);
        const texture = new THREE.CanvasTexture(label);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
        const labelSize = Math.max(1, span * 0.004);
        sprite.position.set(x, 0.04, -span / 2 + labelSize * 1.4);
        sprite.scale.set(labelSize * 2, labelSize, 1);
        YARD_grid.add(sprite);
      }
    }
    YARD_addLine(YARD_grid, ruler, 0x74bfa4, 0.8);
    scene.add(YARD_grid);
  }

  function YARD_buildReference(def, scale = 1) {
    YARD_emptyGroup(YARD_reference);
    const ref = __game.SHIPS.kestrel, offset = Math.max(def.half[0] * scale, 4) + 4;
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
    const scale = YARD_displayScale();
    const radius = Math.max(def.radius || 0, Math.hypot(...def.half)) * scale;
    const verticalHalfFov = THREE.MathUtils.degToRad(42 / 2);
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(0.1, camera.aspect));
    YARD_distance = Math.max(radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * 1.12, 20);
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
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        material?.map?.dispose();
        material?.dispose();
      }
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
    const displayScale = YARD_displayScale();
    YARD_model.scale.setScalar(displayScale);
    voxCache.delete(def.id + ':' + res + (data.tier ? ':t' + data.tier : ''));
    const gameLength = def.length * YARD_gameScale;
    const preview = document.getElementById('yard-in-game-scale').checked ? 'in-game' : 'authored';
    document.getElementById('yard-size').textContent = `Authored: ${def.length} m · in game: ${gameLength} m · preview: ${preview} (${displayScale}×)`;
    YARD_stat.textContent = `${def.name || def.id} · ${data.voxels.length.toLocaleString()} voxels · ${(performance.now() - t0).toFixed(0)} ms · ${def.length} m authored / ${gameLength} m in game`;
    YARD_buildGrid(def, displayScale);
    YARD_buildReference(def, displayScale);
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
      } else if (prim.t === 'seg' || prim.t === 'ell' || prim.t === 'tap') {
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
    if (typeof entry.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(entry.id)) errors.push('id must use lowercase letters, numbers, and underscores, starting with a letter');
    else if (Object.hasOwn(DB.ships, entry.id) && entry.id !== YARD_sourceShipId) errors.push(`id ${entry.id} already exists`);
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
      if (nextDef.mirror !== YARD_def.mirror || nextDef.length !== YARD_def.length || JSON.stringify(nextDef.half) !== JSON.stringify(YARD_def.half)) YARD_setDefinition(nextDef);
      else YARD_def = nextDef;
    } catch (error) {
      YARD_dbError.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  function YARD_loadEntry(id) {
    YARD_sourceShipId = id === '__new' ? null : id;
    const entry = id === '__new' ? { ...YARD_colorStrings(DB.ships.kestrel), id: 'new_ship', name: 'NEW SHIP' } : YARD_colorStrings(DB.ships[id]);
    YARD_dbEditor.value = JSON.stringify(entry, null, 2);
    YARD_dbChange();
  }

  function YARD_cloneAuthoredShip(id) {
    const runtime = __game.SHIPS[id];
    const def = JSON.parse(JSON.stringify(runtime, (key, value) => key === '_' ? undefined : value));
    const authoredLength = DB.ships[id]?.length;
    if (authoredLength > 0 && def.length !== authoredLength) scaleShip(def, authoredLength);
    return def;
  }

  function YARD_newFromTemplate(id) {
    const template = YARD_cloneAuthoredShip(id);
    template.id = 'yard-new-' + id;
    template.name = 'NEW SHIP';
    template.comps = [];
    template.mounts = [];
    template.turrets = [];
    template.engines = [];
    template.stores = {};
    YARD_sourceShipId = null;
    YARD_gameScale = 1;
    YARD_select.value = '__new';
    YARD_model.rotation.set(0, 0, 0);
    YARD_prims.value = JSON.stringify(template.prims, (key, value) => key === '_' ? undefined : value, 2);
    YARD_error.textContent = '';
    YARD_setDefinition(template, true);
    const entry = {
      id: '',
      name: '',
      fac: DB.ships[id].fac,
      cls: DB.ships[id].cls,
      length: DB.ships[id].length,
      half: [...DB.ships[id].half],
      radius: DB.ships[id].radius,
      mirror: !!DB.ships[id].mirror,
      armor: { ...DB.ships[id].armor },
      comps: [],
      mounts: [],
      turrets: [],
      engines: [],
      stores: {},
    };
    YARD_dbEditor.value = JSON.stringify(entry, null, 2);
    YARD_dbChange();
  }

  function YARD_parsePrims(source) {
    const tokens = [];
    for (let i = 0; i < source.length;) {
      const ch = source[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (source.startsWith('//', i)) {
        i = source.indexOf('\n', i);
        if (i < 0) break;
        continue;
      }
      if (source.startsWith('/*', i)) {
        const end = source.indexOf('*/', i + 2);
        if (end < 0) throw new Error('Unclosed comment in prims source.');
        i = end + 2;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let value = '';
        i++;
        while (i < source.length && source[i] !== quote) {
          if (source[i] !== '\\') { value += source[i++]; continue; }
          i++;
          if (i >= source.length) throw new Error('Unclosed string in prims source.');
          const escaped = source[i++];
          const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };
          if (escaped === 'u' || escaped === 'x') {
            const count = escaped === 'u' ? 4 : 2, hex = source.slice(i, i + count);
            if (!new RegExp(`^[0-9a-fA-F]{${count}}$`).test(hex)) throw new Error('Invalid escaped character in prims source.');
            value += String.fromCharCode(parseInt(hex, 16));
            i += count;
          } else value += Object.hasOwn(escapes, escaped) ? escapes[escaped] : escaped;
        }
        if (source[i] !== quote) throw new Error('Unclosed string in prims source.');
        i++;
        tokens.push({ type: 'literal', value });
        continue;
      }
      const number = source.slice(i).match(/^(?:0[xX][\da-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/);
      if (number) {
        const value = Number(number[0]);
        if (!Number.isFinite(value)) throw new Error('Non-finite number in prims source.');
        tokens.push({ type: 'literal', value });
        i += number[0].length;
        continue;
      }
      const identifier = source.slice(i).match(/^[A-Za-z_$][\w$]*/);
      if (identifier) {
        tokens.push({ type: 'identifier', value: identifier[0] });
        i += identifier[0].length;
        continue;
      }
      if (source.startsWith('...', i)) { tokens.push({ value: '...' }); i += 3; continue; }
      if ('[]{}(),:+-'.includes(ch)) { tokens.push({ value: ch }); i++; continue; }
      throw new Error(`Unsupported token "${ch}" in prims source.`);
    }
    let at = 0;
    const peek = () => tokens[at]?.value;
    const take = expected => {
      const token = tokens[at++];
      if (!token || (expected !== undefined && token.value !== expected)) throw new Error(`Expected ${expected || 'a value'} in prims source.`);
      return token;
    };
    const helpers = { tap, box, ell, seg, chain, ringSegs, rungs };
    function value() {
      if (peek() === '-') { take('-'); const number = value(); if (typeof number !== 'number') throw new Error('Unary minus requires a number.'); return -number; }
      if (peek() === '+') { take('+'); const number = value(); if (typeof number !== 'number') throw new Error('Unary plus requires a number.'); return number; }
      if (peek() === '[') {
        take('[');
        const result = [];
        while (peek() !== ']') {
          if (at >= tokens.length) throw new Error('Unclosed array in prims source.');
          const spread = peek() === '...';
          if (spread) take('...');
          const item = value();
          if (spread) {
            if (!Array.isArray(item)) throw new Error('Spread values must be arrays.');
            result.push(...item);
          } else result.push(item);
          if (peek() !== ',') break;
          take(',');
          if (peek() === ']') break;
        }
        take(']');
        return result;
      }
      if (peek() === '{') {
        take('{');
        const result = {};
        while (peek() !== '}') {
          if (at >= tokens.length) throw new Error('Unclosed object in prims source.');
          const key = take();
          if (key.type !== 'identifier' && key.type !== 'literal') throw new Error('Object keys must be names or strings.');
          take(':');
          result[key.value] = value();
          if (peek() !== ',') break;
          take(',');
          if (peek() === '}') break;
        }
        take('}');
        return result;
      }
      const token = take();
      if (token.type === 'literal') return token.value;
      if (token.type !== 'identifier') throw new Error('Expected a literal or helper call in prims source.');
      if (token.value === 'true') return true;
      if (token.value === 'false') return false;
      if (token.value === 'null') return null;
      if (token.value === 'undefined') return undefined;
      const helper = Object.hasOwn(helpers, token.value) ? helpers[token.value] : null;
      if (!helper) throw new Error(`Unknown helper ${token.value}.`);
      take('(');
      const args = [];
      while (peek() !== ')') {
        if (at >= tokens.length) throw new Error(`Unclosed ${token.value}() call.`);
        args.push(value());
        if (peek() !== ',') break;
        take(',');
        if (peek() === ')') break;
      }
      take(')');
      return helper(...args);
    }
    const prims = value();
    if (at !== tokens.length) throw new Error('Unexpected extra input after prims array.');
    if (!Array.isArray(prims)) throw new Error('Prims source must evaluate to an array.');
    if (prims.some(prim => !prim || typeof prim !== 'object' || typeof prim.t !== 'string')) throw new Error('Every prim must be an object with a string t field.');
    return prims;
  }

  function YARD_primJsValue(value, key = '') {
    if (value === undefined) return 'undefined';
    if (key === 'col' && Number.isInteger(value)) return `0x${value.toString(16).padStart(6, '0')}`;
    return JSON.stringify(value);
  }

  function YARD_primHelper(prim) {
    const options = { ...prim };
    delete options._;
    delete options.t;
    if (prim.t === 'tap') {
      for (const key of ['c', 'hz', 'h0', 'h1', 'col']) delete options[key];
      const sameSize = JSON.stringify(prim.h0) === JSON.stringify(prim.h1);
      if (sameSize && (prim.sh === undefined || prim.sh === 'r') && !(prim.sweep || prim.sweepY)) {
        delete options.sh; delete options.sweep; delete options.sweepY;
        return `box(${JSON.stringify(prim.c)}, ${JSON.stringify([prim.h0[0], prim.h0[1], prim.hz])}, ${YARD_primJsValue(prim.col, 'col')}${Object.keys(options).length ? ', ' + JSON.stringify(options) : ''})`;
      }
      return `tap(${JSON.stringify(prim.c)}, ${JSON.stringify(prim.hz)}, ${JSON.stringify(prim.h0)}, ${JSON.stringify(prim.h1)}, ${YARD_primJsValue(prim.col, 'col')}${Object.keys(options).length ? ', ' + JSON.stringify(options) : ''})`;
    }
    if (prim.t === 'ell') {
      for (const key of ['c', 'r', 'col']) delete options[key];
      return `ell(${JSON.stringify(prim.c)}, ${JSON.stringify(prim.r)}, ${YARD_primJsValue(prim.col, 'col')}${Object.keys(options).length ? ', ' + JSON.stringify(options) : ''})`;
    }
    if (prim.t === 'seg') {
      for (const key of ['a', 'b', 'ra', 'rb', 'col']) delete options[key];
      return `seg(${JSON.stringify(prim.a)}, ${JSON.stringify(prim.b)}, ${JSON.stringify(prim.ra)}, ${JSON.stringify(prim.rb)}, ${YARD_primJsValue(prim.col, 'col')}${Object.keys(options).length ? ', ' + JSON.stringify(options) : ''})`;
    }
    return JSON.stringify(prim);
  }

  function YARD_primsExport(format = document.getElementById('yard-prims-format').value) {
    const prims = YARD_parsePrims(YARD_prims.value);
    if (format === 'json') return JSON.stringify(prims, (key, value) => key === '_' ? undefined : value, 2);
    return '[\n' + prims.map(prim => '  ' + YARD_primHelper(prim) + ',').join('\n') + '\n]';
  }

  function YARD_dbExport() {
    const entry = JSON.parse(YARD_dbEditor.value);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Database entry must be a JSON object.');
    return JSON.stringify(entry, null, 2);
  }

  async function YARD_copy(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        if (!document.execCommand) throw error;
      }
    }
    const field = document.createElement('textarea');
    field.value = text;
    field.style.cssText = 'position:fixed;left:-10000px;top:0';
    document.body.appendChild(field);
    field.focus();
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Clipboard copy is unavailable in this browser context.');
  }

  async function YARD_copyAction(kind) {
    try {
      const text = kind === 'prims' ? YARD_primsExport() : YARD_dbExport();
      await YARD_copy(text);
      YARD_exportStatus.textContent = `${kind === 'prims' ? 'Prims JS' : 'Database entry JSON'} copied.`;
    } catch (error) {
      YARD_exportStatus.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  function YARD_saveSheet() {
    let downloadUrl = null;
    try {
      const sheet = document.createElement('canvas');
      sheet.width = 900;
      sheet.height = 540;
      const context = sheet.getContext('2d');
      if (!context) throw new Error('Could not create a 2D canvas for the export sheet.');
      const originalFov = camera.fov, originalBackground = scene.backgroundIntensity;
      const radius = Math.max(YARD_def.radius || 0, Math.hypot(...YARD_def.half)) * YARD_displayScale();
      const distance = Math.max(radius * 4.2, 25);
      const views = [
        { label: '3/4', az: 35, el: 22, up: [0, 1, 0] },
        { label: 'TOP', az: 0, el: 89.5, up: [0, 0, -1] },
        { label: 'SIDE', az: 90, el: 0, up: [0, 1, 0] },
        { label: 'FRONT', az: 180, el: 0, up: [0, 1, 0] },
      ];
      context.fillStyle = '#071016';
      context.fillRect(0, 0, sheet.width, sheet.height);
      renderer.setSize(450, 270, false);
      camera.fov = 30;
      camera.aspect = 450 / 270;
      camera.updateProjectionMatrix();
      views.forEach((view, index) => {
        const az = THREE.MathUtils.degToRad(view.az), el = THREE.MathUtils.degToRad(view.el), c = Math.cos(el);
        camera.up.set(...view.up);
        camera.position.set(Math.sin(az) * c * distance, Math.sin(el) * distance, Math.cos(az) * c * distance);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld(true);
        renderer.render(scene, camera);
        const x = (index % 2) * 450, y = Math.floor(index / 2) * 270;
        context.drawImage(renderer.domElement, x, y, 450, 270);
        context.fillStyle = '#061016d9';
        context.fillRect(x, y + 239, 450, 31);
        context.fillStyle = '#b8ead8';
        context.font = '12px ui-monospace, Menlo, Consolas, monospace';
        context.fillText(`${view.label}  ·  ${YARD_def.name || YARD_def.id}`, x + 12, y + 259);
      });
      camera.fov = originalFov;
      scene.backgroundIntensity = originalBackground;
      resize();
      YARD_camera();
      sheet.toBlob(blob => {
        if (!blob) {
          YARD_exportStatus.textContent = 'PNG encoding failed.';
          return;
        }
        downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${YARD_dbEntry?.id || YARD_def.id}_sheet.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
        YARD_exportStatus.textContent = 'Saved 900 × 540 four-view PNG sheet.';
      }, 'image/png');
    } catch (error) {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      resize();
      YARD_camera();
      YARD_exportStatus.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  function YARD_selectShip(id) {
    const original = __game.SHIPS[id];
    YARD_gameScale = original && DB.ships[id]?.length ? original.length / DB.ships[id].length : 1;
    const def = original ? { ...YARD_cloneAuthoredShip(id), id: 'yard-' + id } : {
      ...YARD_cloneAuthoredShip('kestrel'), id: 'yard-new', name: 'NEW SHIP', prims: [], comps: [], mounts: [], turrets: [], engines: [],
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
  document.getElementById('yard-new-template').addEventListener('click', () => YARD_newFromTemplate(document.getElementById('yard-template').value));
  document.getElementById('yard-panel-toggle').addEventListener('click', event => {
    const panel = event.currentTarget.closest('.ypanel');
    const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    event.currentTarget.setAttribute('aria-expanded', String(!expanded));
    event.currentTarget.textContent = expanded ? 'Expand' : 'Collapse';
    panel.classList.toggle('collapsed', expanded);
  });
  YARD_prims.addEventListener('input', () => {
    clearTimeout(YARD_rebuildTimer);
    YARD_error.textContent = '';
    YARD_rebuildTimer = setTimeout(() => {
      try {
        const prims = YARD_parsePrims(YARD_prims.value);
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
  document.getElementById('yard-copy-prims').addEventListener('click', () => YARD_copyAction('prims'));
  document.getElementById('yard-copy-db').addEventListener('click', () => YARD_copyAction('db'));
  document.getElementById('yard-save-sheet').addEventListener('click', YARD_saveSheet);
  document.getElementById('yard-grid').addEventListener('change', event => { YARD_grid.visible = event.target.checked; });
  document.getElementById('yard-in-game-scale').addEventListener('change', () => {
    const scale = YARD_displayScale();
    YARD_model.scale.setScalar(scale);
    YARD_buildGrid(YARD_def, scale);
    YARD_grid.visible = document.getElementById('yard-grid').checked;
    YARD_buildReference(YARD_def, scale);
    document.getElementById('yard-size').textContent = `Authored: ${YARD_def.length} m · in game: ${YARD_def.length * YARD_gameScale} m · preview: ${document.getElementById('yard-in-game-scale').checked ? 'in-game' : 'authored'} (${scale}×)`;
    YARD_fit(YARD_def);
  });
  document.getElementById('yard-frame').addEventListener('click', () => YARD_fit(YARD_def));
  document.getElementById('yard-view-front').addEventListener('click', () => { YARD_orbit = Math.PI; YARD_elevation = 0; YARD_fit(YARD_def); });
  document.getElementById('yard-view-side').addEventListener('click', () => { YARD_orbit = Math.PI / 2; YARD_elevation = 0; YARD_fit(YARD_def); });
  document.getElementById('yard-view-top').addEventListener('click', () => { YARD_orbit = 0; YARD_elevation = 1.52; YARD_fit(YARD_def); });
  document.getElementById('yard-view-quarter').addEventListener('click', () => { YARD_orbit = 0.55; YARD_elevation = 0.32; YARD_fit(YARD_def); });
  YARD_selectShip(YARD_select.value);
  scene.add(YARD_group);
  YARD_group.add(YARD_model);

  YARD_canvas.addEventListener('pointerdown', event => {
    YARD_pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.isTrusted) YARD_canvas.setPointerCapture(event.pointerId);
    if (YARD_pointers.size >= 2) {
      const [a, b] = [...YARD_pointers.values()];
      YARD_pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      YARD_drag = null;
    } else YARD_drag = { x: event.clientX, y: event.clientY, orbit: YARD_orbit, elevation: YARD_elevation };
  });
  YARD_canvas.addEventListener('pointermove', event => {
    if (!YARD_pointers.has(event.pointerId)) return;
    YARD_pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (YARD_pointers.size >= 2) {
      const [a, b] = [...YARD_pointers.values()];
      const nextDistance = Math.hypot(a.x - b.x, a.y - b.y);
      if (YARD_pinchDistance > 0 && nextDistance > 0) YARD_distance = Math.max(2, Math.min(10000, YARD_distance * YARD_pinchDistance / nextDistance));
      YARD_pinchDistance = nextDistance;
      YARD_camera();
    } else if (YARD_drag) {
      YARD_orbit = YARD_drag.orbit - (event.clientX - YARD_drag.x) * 0.008;
      YARD_elevation = Math.max(-1.35, Math.min(1.35, YARD_drag.elevation + (event.clientY - YARD_drag.y) * 0.006));
      YARD_camera();
    }
  });
  const YARD_endPointer = event => {
    YARD_pointers.delete(event.pointerId);
    YARD_pinchDistance = 0;
    if (YARD_pointers.size === 1) {
      const [pointer] = YARD_pointers.values();
      YARD_drag = { ...pointer, orbit: YARD_orbit, elevation: YARD_elevation };
    } else YARD_drag = null;
  };
  YARD_canvas.addEventListener('pointerup', YARD_endPointer);
  YARD_canvas.addEventListener('pointercancel', YARD_endPointer);
  YARD_canvas.addEventListener('wheel', event => {
    YARD_distance = Math.max(2, Math.min(10000, YARD_distance * Math.exp(event.deltaY * 0.001)));
    YARD_camera();
  }, { passive: true });
}

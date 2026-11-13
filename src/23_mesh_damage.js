// Index intact hull vertices once. Hits edit only the buckets intersecting their radius.
function meshDamageIndex(s) {
  const cellSize = Math.max(s.vox.data.vs, s.def.length / 32);
  const key = (x, y, z) => `${x},${y},${z}`;
  s.vox.meshDamage = s.vox.body.children.map(mesh => {
    const position = mesh.geometry.getAttribute('position');
    const color = mesh.geometry.getAttribute('color');
    position.setUsage(THREE.DynamicDrawUsage);
    color.setUsage(THREE.DynamicDrawUsage);
    const base = position.array.slice(), buckets = new Map();
    for (let i = 0; i < base.length; i += 3) {
      const id = key(Math.floor(base[i] / cellSize), Math.floor(base[i+1] / cellSize), Math.floor(base[i+2] / cellSize));
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push(i);
    }
    return { position, color, base, rgb: color.array.slice(), buckets,
      sample: hullGridSampler(s.vox.data), cellSize, key, glow: mesh.material === hullGlowMat };
  });
}

function damageHullMesh(s, p, r, sr, shallow) {
  const D = s.vox.data, reach = Math.max(r, sr);
  if (!(reach > 0)) return;
  let breachPoint = null, nearest = Infinity;
  for (const m of s.vox.meshDamage) {
    const { position, color, base, rgb, buckets, sample, cellSize, key, glow } = m;
    const lo = p.toArray().map(n => Math.floor((n - reach) / cellSize));
    const hi = p.toArray().map(n => Math.floor((n + reach) / cellSize));
    let firstColor = Infinity, lastColor = 0, firstPosition = Infinity, lastPosition = 0;
    for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
      for (const i of buckets.get(key(x, y, z)) || []) {
        const dx = base[i] - p.x, dy = base[i+1] - p.y, dz = base[i+2] - p.z;
        const d = Math.hypot(dx, dy, dz);
        const breach = !shallow && r > 0 && d < r;
        if (breach && !glow && d < nearest) {
          nearest = d;
          breachPoint = [base[i], base[i+1], base[i+2]];
        }
        if ((sr > 0 && d < sr) || breach) {
          const f = breach ? 0.08 + 0.12 * d / r : (glow ? 0.15 : 0.28) + 0.72 * d / sr;
          for (let axis = 0; axis < 3; axis++) color.array[i+axis] = Math.min(color.array[i+axis], rgb[i+axis] * f);
          firstColor = Math.min(firstColor, i); lastColor = Math.max(lastColor, i + 3);
        }
        if (shallow && r > 0 && d < r) {
          // Use a shared inward direction for duplicate vertices at triangle seams.
          const a = base[i], b = base[i+1], c = base[i+2];
          const len = Math.hypot(a, b, c);
          if (!len) continue;
          const ux = -a / len, uy = -b / len, uz = -c / len;
          let thickness = 0;
          for (let step = D.vs * 0.25; step <= D.vs * 2; step += D.vs * 0.25) {
            if (!sample(a + ux*step, b + uy*step, c + uz*step)) break;
            thickness = step;
          }
          const depth = thickness * TUNE.damageVisuals.dentThicknessFraction * (1 - d / r);
          const prior = Math.hypot(position.array[i]-a, position.array[i+1]-b, position.array[i+2]-c);
          if (depth <= prior) continue;
          position.array[i] = a + ux*depth; position.array[i+1] = b + uy*depth; position.array[i+2] = c + uz*depth;
          firstPosition = Math.min(firstPosition, i); lastPosition = Math.max(lastPosition, i + 3);
        }
      }
    }
    for (const [attribute, first, last] of [[color, firstColor, lastColor], [position, firstPosition, lastPosition]]) {
      if (last <= first) continue;
      attribute.addUpdateRange(first, last - first);
      attribute.needsUpdate = true;
    }
  }
  if (breachPoint) meshBreachEmber(s, p, breachPoint, D.vs);

}

// Bounded point buffer, replayed from the same damage events as the darkened patch.
function meshBreachEmber(s, hit, point, vs) {
  const V = s.vox;
  if (!V.embers) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(250 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    const material = new THREE.PointsMaterial({ color: new THREE.Color(2.4, 0.56, 0.11), size: vs * 0.35 });
    V.embers = new THREE.Points(geometry, material);
    V.embers.frustumCulled = false;
    V.body.add(V.embers);
    V.emberCount = 0;
  }
  const geometry = V.embers.geometry, position = geometry.getAttribute('position');
  const delta = new THREE.Vector3(...point).sub(hit);
  if (delta.lengthSq() > 0) delta.setLength(vs * 0.06);
  const i = V.emberCount++ % position.count;
  position.setXYZ(i, point[0] + delta.x, point[1] + delta.y, point[2] + delta.z);
  position.addUpdateRange(i * 3, 3);
  position.needsUpdate = true;
  geometry.setDrawRange(0, Math.min(V.emberCount, position.count));
}

// The same longitudinal planes as the voxel chunks. Clip triangles at the cuts
// and interpolate their damaged vertex attributes.
function fighterMeshChunks(s) {
  const cut = s.vox.data.hz / 3;
  const attributes = ['position', 'normal', 'color', 'hullSurface', 'hullRib'];
  for (let part = 0; part < 3; part++) {
    const group = new THREE.Group();
    for (const hull of s.vox.body.children) {
      if (!hull.isMesh) continue;
      const attrs = attributes.map(name => [name, hull.geometry.getAttribute(name)]).filter(([, attr]) => attr);
      const dims = attrs.map(([, attr]) => attr.itemSize);
      const buffers = attrs.map(() => []);
      const clip = (poly, plane, sign) => {
        const out = [];
        for (let j = 0; j < poly.length; j++) {
          const a = poly[j], b = poly[(j + 1) % poly.length];
          const da = sign * (a[2] - plane), db = sign * (b[2] - plane);
          if (da >= 0) out.push(a);
          if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
            const t = da / (da - db);
            out.push(a.map((v, k) => v + (b[k] - v) * t));
          }
        }
        return out;
      };
      for (let i = 0, n = attrs[0][1].count; i < n; i += 3) {
        let poly = [i, i + 1, i + 2].map(j => attrs.flatMap(([, a]) =>
          Array.from(a.array.subarray(j * a.itemSize, (j + 1) * a.itemSize))));
        if (part > 0) poly = clip(poly, part === 1 ? -cut : cut, 1);
        if (part < 2) poly = clip(poly, part === 0 ? -cut : cut, -1);
        for (let k = 1; k + 1 < poly.length; k++) for (const vertex of [poly[0], poly[k], poly[k+1]]) {
          let offset = 0;
          for (let a = 0; a < dims.length; a++) {
            buffers[a].push(...vertex.slice(offset, offset + dims[a]));
            offset += dims[a];
          }
        }
      }
      if (!buffers[0].length) continue;
      const geometry = new THREE.BufferGeometry();
      attrs.forEach(([name], a) => geometry.setAttribute(name, new THREE.Float32BufferAttribute(buffers[a], dims[a])));
      const material = hull.material.clone();
      material.onBeforeCompile = hull.material.onBeforeCompile;
      material.transparent = true;
      group.add(new THREE.Mesh(geometry, material));
    }
    if (!group.children.length) continue;
    group.position.copy(s.group.position); group.quaternion.copy(s.group.quaternion);
    scene.add(group);
    const vel = new THREE.Vector3((part-1)*2, 1.5, (part-1)*3).applyQuaternion(s.group.quaternion).add(s.vel);
    debris.push({mesh: group, chunk: true, meshChunk: true, vel,
      spin: new THREE.Vector3(0.25*(part-1), 0.2, 0.15*(part+1)), life: 0, dur: 3});
  }
}

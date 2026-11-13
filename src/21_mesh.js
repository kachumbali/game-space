// Render authored hull primitives directly. The collision grid remains authoritative.
const hullMeshMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.22, vertexColors: true });
const hullGlowMat = new THREE.MeshBasicMaterial({ vertexColors: true });

function hullSegments(radius, length, idx) {
  const density = Math.sqrt(DETAIL_STEPS[idx] / DETAIL_STEPS[2]);
  const count = 6 + 14 * density * Math.sqrt(radius / (length * 0.06));
  return Math.max(8, Math.min(40, 4 * Math.round(count / 4)));
}

function hullPrimTriangles(p, length, idx) {
  const shape = prepPrim(p);
  const tris = [];
  const add = (a, b, c, reverse = false) => tris.push(reverse ? [a, c, b] : [a, b, c]);
  const rotate = p.t !== 'seg' && shape.rm;
  const world = (x, y, z) => rotate
    ? [shape.cx + rotate[0] * x + rotate[1] * y + rotate[2] * z,
       shape.cy + rotate[4] * x + rotate[5] * y + rotate[6] * z,
       shape.cz + rotate[8] * x + rotate[9] * y + rotate[10] * z]
    : [shape.cx + x, shape.cy + y, shape.cz + z];
  const circle = n => Array.from({ length: n }, (_, i) => {
    const a = i * 2 * Math.PI / n;
    return [Math.cos(a), Math.sin(a)];
  });
  // The rings run along the axis, and their basis vectors cross toward its positive end.
  const connect = (rings, count, reverse = false) => {
    for (let i = 0; i + 1 < rings.length; i++) {
      const a = rings[i], b = rings[i + 1];
      for (let j = 0; j < count; j++) {
        const k = (j + 1) % count;
        if (a.length > 1) add(a[j], a[k], b[b.length === 1 ? 0 : k], reverse);
        if (b.length > 1) add(a[a.length === 1 ? 0 : j], b[k], b[j], reverse);
      }
    }
  };

  if (p.t === 'tap') {
    const { hz, h0, h1, sweep, sweepY } = p;
    const n = hullSegments(Math.max(...h0, ...h1), length, idx);
    const outline = p.sh === 'e' ? circle(n)
      : p.sh === 'd' ? [[1, 0], [0, 1], [-1, 0], [0, -1]]
      : p.sh === 'h' ? [[1, 0.45], [0.45, 1], [-0.45, 1], [-1, 0.45], [-1, -0.45], [-0.45, -1], [0.45, -1], [1, -0.45]]
      : [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    const ring = (along, h) => outline.map(([u, v]) => {
      const a = u * h[0] + sweep * along, b = v * h[1] + sweepY * along;
      if (p.ax === 'x') return world(along, b, a);
      if (p.ax === 'y') return world(b, along, a);
      return world(a, b, along);
    });
    const a = ring(-hz, h0), b = ring(hz, h1);
    const reverse = p.ax === 'x';
    // When the widths taper by different ratios, a diagonal through a round
    // side strip is only an approximation of the ruled elliptical surface.
    const taper = Math.abs(h0[0] * h1[1] - h0[1] * h1[0]) /
      Math.max(h0[0] * h1[1], h0[1] * h1[0], 1e-9);
    const strips = p.sh !== 'r' && taper > 1e-6 ? Math.ceil(taper * Math.max(2, n / 2)) : 1;
    const rings = [a];
    for (let i = 1; i < strips; i++) {
      const t = i / strips;
      rings.push(ring(hz * (2 * t - 1), [h0[0] + t * (h1[0] - h0[0]), h0[1] + t * (h1[1] - h0[1])]));
    }
    rings.push(b);
    connect(rings, outline.length, reverse);
    for (let i = 1; i + 1 < outline.length; i++) {
      add(a[0], a[i + 1], a[i], reverse);
      add(b[0], b[i], b[i + 1], reverse);
    }
  } else if (p.t === 'ell' || shape.L2 === 1e-9) {
    const [rx, ry, rz] = p.t === 'ell' ? p.r : [p.ra, p.ra * p.fy, p.ra];
    const n = hullSegments(Math.max(rx, ry, rz), length, idx), rows = n / 2;
    const basis = circle(n), rings = [[world(0, 0, -rz)]];
    for (let i = 1; i < rows; i++) {
      const a = Math.PI * i / rows, k = Math.sin(a), z = -rz * Math.cos(a);
      rings.push(basis.map(([u, v]) => world(rx * u * k, ry * v * k, z)));
    }
    rings.push([world(0, 0, rz)]);
    connect(rings, n);
  } else {
    const n = hullSegments(Math.max(p.ra, p.rb) * Math.max(1, p.fy), length, idx);
    const rows = Math.max(2, n / 4), basis = circle(n);
    // primInside projects onto the original axis, then scales the residual y.
    // In the scaled residual space the end plane's normal is S * axis.
    // Map a circle in that plane and both hemispheres back with S = diag(1, fy, 1).
    const axis = new THREE.Vector3(shape.ax, shape.ay * p.fy, shape.az).normalize();
    const up = Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(up, axis).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u);
    const cap = (center, r, sine, cosine) => {
      const x = center[0] + r * cosine * axis.x;
      const y = center[1] + r * cosine * axis.y * p.fy;
      const z = center[2] + r * cosine * axis.z;
      if (sine === 0) return [[x, y, z]];
      return basis.map(([a, b]) => [
        x + r * sine * (a * u.x + b * v.x),
        y + r * sine * (a * u.y + b * v.y) * p.fy,
        z + r * sine * (a * u.z + b * v.z),
      ]);
    };
    const rings = [cap(p.a, p.ra, 0, -1)];
    for (let i = 1; i < rows; i++) {
      const a = i * Math.PI / (2 * rows);
      rings.push(cap(p.a, p.ra, Math.sin(a), -Math.cos(a)));
    }
    rings.push(cap(p.a, p.ra, 1, 0), cap(p.b, p.rb, 1, 0));
    for (let i = 1; i < rows; i++) {
      const a = i * Math.PI / (2 * rows);
      rings.push(cap(p.b, p.rb, Math.cos(a), Math.sin(a)));
    }
    rings.push(cap(p.b, p.rb, 0, 1));
    connect(rings, n);
  }
  return tris;
}

// Split a planar polygon at an axis-aligned boundary. Both sides share the
// computed intersections, so reflection and painted edges cannot leave cracks.
function hullSplit(poly, axis, plane, side) {
  const inside = [], outside = [];
  let a = poly[poly.length - 1], da = side * (a[axis] - plane);
  for (const b of poly) {
    const db = side * (b[axis] - plane);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db), cut = a.map((n, i) => n + (b[i] - n) * t);
      cut[axis] = plane;
      inside.push(cut); outside.push(cut);
    }
    if (db >= 0) inside.push(b);
    if (db <= 0) outside.push(b);
    a = b; da = db;
  }
  return [inside, outside];
}

function hullMarkings(def, tier, vs) {
  const marks = [];
  for (const p of def.prims) {
    if (p.lod > tier) continue;
    if (p.t === 'paint') {
      for (const flip of def.mirror && !p.noMirror ? [false, true] : [false]) {
        const box = p.box.slice();
        if (flip) [box[0], box[3]] = [-box[3], -box[0]];
        let side = p.side === 'top' ? 2 : p.side === 'bottom' ? 3 : FACE[p.side]?.[0];
        if (flip && side < 2) side ^= 1;
        marks.push({ box, side, lateral: p.side === 'side', col: new THREE.Color(p.col), mix: p.mix ?? 0.92 });
      }
    } else if (p.t === 'text' && TXF[p.face] && p.px >= 0.5 * vs) {
      const text = String(p.text).toUpperCase(), px = p.px;
      const color = new THREE.Color(p.col), width = (text.length * 4 - 1) * px;
      for (const flip of (p.mir ?? (p.face[1] === 'x')) ? [false, true] : [false]) {
        const face = flip ? (p.face[0] === '+' ? '-' : '+') + p.face[1] : p.face;
        const [right, up, normal] = TXF[face];
        const axis = normal.findIndex(n => n !== 0), center = p.c.slice();
        if (flip) center[0] *= -1;
        for (let c = 0; c < text.length; c++) {
          const glyph = FONT[text[c]];
          if (!glyph) continue;
          for (let row = 0; row < 5; row++) for (let col = 0; col < 3;) {
            const start = col++;
            if (glyph[row * 3 + start] !== '1') continue;
            while (col < 3 && glyph[row * 3 + col] === '1') col++;
            const left = (c * 4 + start) * px - width / 2, rightEdge = left + (col - start) * px;
            const top = (2.5 - row) * px, bottom = top - px;
            const a = center.map((x, d) => x + right[d] * left + up[d] * bottom);
            const b = center.map((x, d) => x + right[d] * rightEdge + up[d] * top);
            a[axis] += normal[axis] * 3 * vs; b[axis] -= normal[axis] * 6 * vs;
            const box = a.map((x, d) => Math.min(x, b[d])).concat(a.map((x, d) => Math.max(x, b[d])));
            marks.push({ box, side: FACE[face][0], col: color, mix: p.mix ?? 0.95 });
          }
        }
      }
    }
  }
  return marks;
}

function hullPaint(poly, rgb, marks, side) {
  let pieces = [{ poly, rgb }];
  for (const mark of marks) {
    if ((mark.side !== undefined && mark.side !== side) || (mark.lateral && side >= 2)) continue;
    const { box } = mark;
    if ([0, 1, 2].some(d => poly.every(p => p[d] < box[d]) || poly.every(p => p[d] > box[d + 3]))) continue;
    const next = [];
    for (const piece of pieces) {
      let inside = piece.poly;
      for (let d = 0; d < 3 && inside.length >= 3; d++) {
        for (const [boundary, sign] of [[box[d], 1], [box[d + 3], -1]]) {
          if (inside.length < 3 || inside.every(p => sign * (p[d] - boundary) >= 0)) continue;
          let outside;
          [inside, outside] = hullSplit(inside, d, boundary, sign);
          if (outside.length >= 3) next.push({ poly: outside, rgb: piece.rgb });
        }
      }
      if (inside.length >= 3) next.push({ poly: inside, rgb: piece.rgb.clone().lerp(mark.col, mark.mix) });
    }
    pieces = next;
  }
  return pieces;
}

function buildHullMesh(def, idx, res = resFor(def, idx)) {
  const tier = detailTier(res, def, idx), vs = def.length / res;
  const marks = hullMarkings(def, tier, vs);
  const batches = [{ p: [], n: [], c: [] }, { p: [], n: [], c: [] }];
  const group = new THREE.Group();
  group.count = 0;
  for (const p of def.prims) {
    if (!['tap', 'ell', 'seg'].includes(p.t) || p.lod > tier) continue;
    const batch = batches[p.glow ? 1 : 0], color = new THREE.Color(p.col);
    if (p.glow) color.multiplyScalar(p.glowF || 1.8);
    const mirror = def.mirror && !p.noMirror;
    for (const tri of hullPrimTriangles(p, def.length, idx)) {
      const poly = mirror ? hullSplit(tri, 0, 0, 1)[0] : tri;
      if (poly.length < 3 || (mirror && poly.every(v => v[0] === 0))) continue;
      for (const sign of mirror ? [1, -1] : [1]) {
        const face = sign > 0 ? poly : poly.map(([x, y, z]) => [-x, y, z]).reverse();
        const [a, b, c] = face;
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz);
        if (len < 1e-12) continue;
        const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        const side = ax >= ay && ax >= az ? (nx >= 0 ? 0 : 1) : ay >= az ? (ny >= 0 ? 2 : 3) : (nz >= 0 ? 4 : 5);
        const pieces = p.glow || !marks.length ? [{ poly: face, rgb: color }] : hullPaint(face, color, marks, side);
        for (const { poly: piece, rgb } of pieces) for (let i = 1; i + 1 < piece.length; i++) {
          batch.p.push(...piece[0], ...piece[i], ...piece[i + 1]);
          for (let j = 0; j < 3; j++) {
            batch.n.push(nx / len, ny / len, nz / len);
            batch.c.push(rgb.r, rgb.g, rgb.b);
          }
          group.count++;
        }
      }
    }
  }
  for (const [batch, mat] of [[batches[0], hullMeshMat], [batches[1], hullGlowMat]]) {
    if (!batch.p.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(batch.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(batch.n, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(batch.c, 3));
    group.add(new THREE.Mesh(geo, mat));
  }
  return group;
}

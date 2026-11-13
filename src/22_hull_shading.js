// Mesh surface detail is shared across all opaque hulls. The scale relief uses
// one repeating height tile and object-space projection, so it adds no faces.
function hullScaleTile() {
  const side = 64, pixels = new Uint8Array(side * side);
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
    const x = 2 * (i + 0.5) / side, y = 2 * (j + 0.5) / side;
    const row = Math.floor(y), v = y - row;
    const u = (x + 0.5 * row) % 1 - 0.5;
    const seam = clamp((v - 0.65 * u * u) * 8, 0, 1);
    pixels[j * side + i] = Math.round(255 * seam * (1 - 0.4 * v) * (1 - 0.45 * u * u));
  }
  const texture = new THREE.DataTexture(pixels, side, side, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

let hullScaleTexture;
hullMeshMat.onBeforeCompile = shader => {
  shader.uniforms.hullScaleTile = { value: hullScaleTexture ??= hullScaleTile() };
  const varyings = `
    varying vec3 vHullPosition;
    varying vec3 vHullNormal;
    varying vec3 vHullSurface;
    varying vec2 vHullRib;
  `;
  shader.vertexShader = varyings + `
    attribute vec3 hullSurface;
    attribute vec2 hullRib;
  ` + shader.vertexShader.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    vHullPosition = position;
    vHullNormal = normal;
    vHullSurface = hullSurface;
    vHullRib = hullRib;
  `);
  shader.fragmentShader = varyings + `
    uniform sampler2D hullScaleTile;
  ` + shader.fragmentShader.replace('#include <color_fragment>', `
    #include <color_fragment>
    if (vHullSurface.x > 0.0) {
      vec2 panel = vec2(abs(vHullPosition.x), vHullPosition.z) / vHullSurface.xy;
      vec2 width = max(fwidth(panel), vec2(0.02));
      vec2 inset = smoothstep(vec2(0.0), width, abs(fract(panel + 0.5) - 0.5));
      float checker = mod(floor(panel.x) + floor(panel.y), 2.0);
      float edge = mix(0.76, mix(1.03, 0.95, checker), inset.x * inset.y);
      diffuseColor.rgb *= mix(edge, 1.0, smoothstep(0.15, 0.5, max(width.x, width.y)));
    }
    if (vHullRib.x > 0.0) {
      float phase = vHullPosition.z / vHullRib.x;
      float width = max(fwidth(phase), 0.02);
      float groove = 1.0 - smoothstep(0.34 - width, 0.34 + width, fract(phase));
      diffuseColor.rgb *= 1.0 + vHullRib.y * mix(0.3, -1.0, groove) * (1.0 - smoothstep(0.15, 0.5, width));
    }
  `).replace('#include <normal_fragment_maps>', `
    #include <normal_fragment_maps>
    if (vHullSurface.z > 0.0) {
      vec3 axis = abs(vHullNormal);
      vec2 uv = (axis.z > max(axis.x, axis.y) ? vHullPosition.xy
        : axis.x > axis.y ? vHullPosition.zy : vHullPosition.xz) * vHullSurface.z;
      vec2 ux = dFdx(uv), uy = dFdy(uv);
      float h = textureGrad(hullScaleTile, uv, ux, uy).r;
      vec2 slope = vec2(textureGrad(hullScaleTile, uv + ux, ux, uy).r - h,
                        textureGrad(hullScaleTile, uv + uy, ux, uy).r - h);
      vec3 tangentX = cross(normalize(dFdy(-vViewPosition)), normal);
      vec3 tangentY = cross(normal, normalize(dFdx(-vViewPosition)));
      float facing = dot(normalize(dFdx(-vViewPosition)), tangentX);
      if (abs(facing) > 0.0001) {
        normal = normalize(abs(facing) * normal - sign(facing) * 0.55 * (slope.x * tangentX + slope.y * tangentY));
      }
    }
  `);
};

function hullGridSampler(D) {
  const stride = D.ny * D.nz, inverse = 1 / D.vs;
  return (x, y, z) => {
    const i = Math.floor((x + D.hx) * inverse);
    const j = Math.floor((y + D.hy) * inverse);
    const k = Math.floor((z + D.hz) * inverse);
    return i >= 0 && i < D.nx && j >= 0 && j < D.ny && k >= 0 && k < D.nz
      && D.grid[i * stride + j * D.nz + k] >= 0;
  };
}

function hullAmbientOcclusion(sample, near, spread, x, y, z, nx, ny, nz, tx, ty, tz, bx, by, bz) {
  // Probe a small hemisphere beyond the surface's own voxel using the
  // collision grid already built for this ship.
  const ax = x + nx * near, ay = y + ny * near, az = z + nz * near;
  let occlusion = sample(ax, ay, az) ? 1.6 : 0;
  if (sample(ax + tx * spread, ay + ty * spread, az + tz * spread)) occlusion++;
  if (sample(ax - tx * spread, ay - ty * spread, az - tz * spread)) occlusion++;
  if (sample(ax + bx * spread, ay + by * spread, az + bz * spread)) occlusion++;
  if (sample(ax - bx * spread, ay - by * spread, az - bz * spread)) occlusion++;
  return 1 - 0.055 * occlusion;
}

function hullSurfaceColor(style, x, y, z, rgb, result) {
  const { frequency, mottling, rust, streak, rustK, strata, edge } = style;
  const sx = x * frequency, sy = y * frequency, sz = z * frequency;
  result.copy(rgb);
  let finish = 1;
  if (mottling) {
    const m = style.mot;
    const noise = vnoise(sx * m, sy * m, sz * m) * 0.65 + vnoise(sx * 3.1, sy * 3.1, sz * 3.1) * 0.35;
    result.lerp(mottling, clamp((noise - 0.52) * 7, 0, 1));
  }
  if (rust) {
    const noise = streak ? vnoise(sx * 2.2, sy * 2.2, sz * 0.28 * streak) : vnoise(sx, sy, sz);
    result.lerp(rust, clamp((noise - 0.6) * 3 * rustK, 0, 0.6));
  }
  if (strata) {
    const band = (y + z * (strata[1] || 0)) / strata[0], phase = band - Math.floor(band);
    if (phase < 0.22) { result.lerp(edge, 0.28); finish *= 1.12; }
    else if (phase < 0.34) finish *= 0.78;
  }
  result.multiplyScalar(finish);
}

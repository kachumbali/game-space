// ======================================================================
//  BEAM RENDERING  (kind:'beam' weapons: laser, flaser, lance, ...; docs/LASERS.md section 7)
//  fireBeam() (60_weapons) is hit-scan and calls beamNote() once per shot. A beam record lives for about one cooldown after its last shot, so a
//  weapon that keeps firing shows a continuous beam. Endpoints are anchored to objects (emitter muzzle, struck hull point) and re-evaluated every
//  frame in renderBeams(); everything is drawn from fixed pools (no per-frame allocation): 2 ribbon layers (glow + core) and 2 flare layers
//  (muzzle + impact) as InstancedBufferGeometry with a camera-facing vertex shader. Width is `w.bw` metres (default derived), widened with
//  distance so a beam never drops below ~2 px (glow) / ~1 px (core).
// ======================================================================
const BEAM_CAP = 48, BEAM_FAR = 12000;
const beamRec = new Map();                       // key (turret / mount) -> record
let beamPool = null, beamFrustum = null;
const _bm = new THREE.Matrix4(), _bS = new THREE.Sphere(), _bC = new THREE.Color();

function beamBw(w) { return w.bw ?? Math.min(20, Math.max(0.15, 0.16 * Math.sqrt(w.dmg || 3) * Math.pow((w.range || 1000) / 1000, 0.3))); }

const BEAM_VERT = `
attribute vec2 corner; attribute vec3 aA; attribute vec3 aB; attribute vec4 aP; attribute vec4 aCol;
uniform float uPx;
varying vec2 vUv; varying vec4 vP; varying vec4 vCol; varying float vNear;
void main() {
  vec3 p = mix(aA, aB, corner.y);
  vec3 dir = normalize(aB - aA + vec3(1e-5));
  vec3 toCam = cameraPosition - p;
  float d = max(length(toCam), 0.01);
  vec3 c = cross(dir, toCam);
  float sn = length(c) / d;                               // sine of the angle between beam and view line
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 side = normalize(mix(normalize(cross(dir, camRight) + 1e-6), c / max(length(c), 1e-6), smoothstep(0.0, 0.05, sn)));
  float hw = max(aP.x, d * uPx * aP.z * 0.5);              // half width: metres, but at least aP.z pixels
  vec3 wp = p + side * corner.x * hw;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  vUv = vec2(corner.x, corner.y);
  vP = vec4(aP.y, aP.w, sqrt(aP.x / hw), 0.0);
  vCol = aCol;
  vNear = smoothstep(2.0, 30.0, d);
}`;
const BEAM_FRAG = `
varying vec2 vUv; varying vec4 vP; varying vec4 vCol; varying float vNear;
void main() {
  float a = abs(vUv.x);
  float prof = exp(-a * a * vP.x);
  float tip = smoothstep(0.0, 0.015, vUv.y) * smoothstep(1.0, 0.985, vUv.y);
  float I = prof * vCol.a * clamp(vP.z, 0.6, 1.0) * vNear * tip;
  vec3 col = mix(vCol.rgb, vec3(1.0), vP.y * prof) * I;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const FLARE_VERT = `
attribute vec2 corner; attribute vec3 aA; attribute vec4 aP; attribute vec4 aCol;
uniform float uPx;
varying vec2 vUv; varying vec4 vCol; varying float vNear;
void main() {
  vec3 toCam = cameraPosition - aA;
  float d = max(length(toCam), 0.01);
  float r = max(aP.x, d * uPx * aP.z * 0.5);
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 wp = aA + (camRight * corner.x + camUp * corner.y) * r;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  vUv = corner; vCol = aCol; vNear = smoothstep(1.5, 20.0, d) * clamp(sqrt(aP.x / r), 0.3, 1.0);
}`;
const FLARE_FRAG = `
varying vec2 vUv; varying vec4 vCol; varying float vNear;
void main() {
  float r2 = dot(vUv, vUv);
  float I = (exp(-r2 * 5.0) + 0.5 * exp(-r2 * 22.0)) * step(r2, 1.0) * (1.0 - r2) * vCol.a * vNear;
  vec3 col = mix(vCol.rgb, vec3(1.0), 0.5 * exp(-r2 * 22.0)) * I;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function beamLayer(vert, frag, n, flare) {
  const geo = new THREE.InstancedBufferGeometry();
  const quad = flare ? [-1, -1, 1, -1, 1, 1, -1, 1] : [-1, 0, 1, 0, 1, 1, -1, 1];
  geo.setAttribute('corner', new THREE.Float32BufferAttribute(quad, 2));
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));     // dummy (bounds unused: frustumCulled off)
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const at = {
    aA: new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), aP: new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4),
    aCol: new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4),
  };
  if (!flare) at.aB = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  for (const k in at) { at[k].setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, at[k]); }
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms: { uPx: { value: 0.002 } },
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 20; scene.add(mesh);
  return { mesh, geo, at, mat, n: 0 };
}
function beamInit() {
  if (beamPool) return beamPool;
  beamFrustum = new THREE.Frustum();
  return (beamPool = {
    glow: beamLayer(BEAM_VERT, BEAM_FRAG, BEAM_CAP, false), core: beamLayer(BEAM_VERT, BEAM_FRAG, BEAM_CAP, false),
    muz: beamLayer(FLARE_VERT, FLARE_FRAG, BEAM_CAP, true), imp: beamLayer(FLARE_VERT, FLARE_FRAG, BEAM_CAP, true),
  });
}
function beamsClear() { beamRec.clear(); if (beamPool) for (const k in beamPool) { beamPool[k].geo.instanceCount = 0; } }

// One shot. key = the firing mount/turret; src/dst = { obj, local } (world point = obj.localToWorld(local)) or dst = { world }.
function beamNote(key, s, w, src, dst, live, prog, shield, chg = 1) {
  let r = beamRec.get(key);
  if (!r) { r = { s: null, w: null, src: { obj: null, local: new THREE.Vector3() }, dstObj: null, dstLocal: new THREE.Vector3(), dstWorld: new THREE.Vector3(), hit: false }; beamRec.set(key, r); }
  r.s = s; r.w = w; r.t = time; r.live = live; r.prog = prog; r.shield = shield; r.chg = chg;
  r.src.obj = src.obj; r.src.local.copy(src.local);
  r.hit = !!dst.obj;
  if (dst.obj) { r.dstObj = dst.obj; r.dstLocal.copy(dst.local); r.dstShip = dst.ship; } else { r.dstObj = null; r.dstWorld.copy(dst.world); r.dstShip = null; }
  r.bw = beamBw(w);
  r.col = w.color || 0xff5040;
}
const _bList = [];
function renderBeams() {
  if (!beamPool) { if (!beamRec.size) return; beamInit(); }
  const P = beamPool;
  const show = state !== 'brief' && beamRec.size > 0;
  let n = 0;
  if (show) {
    camera.updateMatrixWorld();
    _bm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); beamFrustum.setFromProjectionMatrix(_bm);
    const px = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(240, innerHeight);
    for (const k in P) P[k].mat.uniforms.uPx.value = px;
    _bList.length = 0;
    for (const [key, r] of beamRec) {
      const hold = r.w.cd * 1.1 + 0.03, age = time - r.t;
      if (age > hold || age < 0 || !r.s || !r.s.alive || !r.src.obj) { if (age > hold + 1 || age < 0) beamRec.delete(key); continue; }
      r.src.obj.updateWorldMatrix(true, false);
      r.a = r.a || new THREE.Vector3(); r.b = r.b || new THREE.Vector3();
      r.a.copy(r.src.local).applyMatrix4(r.src.obj.matrixWorld);
      if (r.dstObj) { if (!r.dstShip || !r.dstShip.alive) { r.dstObj = null; r.dstWorld.copy(r.b); } else r.b.copy(r.dstLocal).applyMatrix4(r.dstObj.matrixWorld); }
      if (!r.dstObj) r.b.copy(r.dstWorld);
      const dc = camera.position.distanceTo(r.a);
      if (dc > BEAM_FAR && camera.position.distanceTo(r.b) > BEAM_FAR) continue;
      _bS.center.copy(r.a).add(r.b).multiplyScalar(0.5); _bS.radius = r.a.distanceTo(r.b) * 0.5 + r.bw * 3 + 5;
      if (!beamFrustum.intersectsSphere(_bS)) continue;
      r.pri = (r.dstShip === player ? 0 : 1e6) + Math.min(dc, camera.position.distanceTo(r.b));
      r.age = age;
      _bList.push(r);
    }
    if (_bList.length > BEAM_CAP) { _bList.sort((x, y) => x.pri - y.pri); _bList.length = BEAM_CAP; }
    const T = time * 60;
    for (const r of _bList) {
      const w = r.w, ph = Math.min(1, r.age / w.cd);
      let I, wc, wg;
      if (r.chg < 1) {                                                                        // M2 charge-up: emitter glow only, growing and brightening; no ribbon, no impact yet
        const c = r.chg, fl = 0.8 + 0.2 * Math.sin(T * 2.3 + n * 1.3);
        _bC.setHex(r.col);
        const i = n++;
        let g = P.glow; g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aB.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aP.setXYZW(i, 0.01, 2.4, 2.6, 0.0); g.at.aCol.setXYZW(i, 0, 0, 0, 0);
        g = P.core; g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aB.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aP.setXYZW(i, 0.01, 5.0, 1.2, 0.25); g.at.aCol.setXYZW(i, 0, 0, 0, 0);
        g = P.muz; g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aP.setXYZW(i, r.bw * (1.2 + 5 * c * c), 0, 4.5, 0); g.at.aCol.setXYZW(i, _bC.r, _bC.g, _bC.b, (0.3 + 1.5 * c) * fl);
        P.imp.at.aCol.setW(i, 0);
        continue;
      }
      if (r.live) {
        const fl = 0.86 + 0.14 * Math.sin(T * 1.7 + n * 2.1) * Math.sin(T * 0.63 + n);       // fast flicker
        I = (1 - 0.35 * ph) * fl;                                                             // pulse: bright at the shot, easing toward the next
        wc = r.bw * 0.5; wg = r.bw * 1.7;
      } else {
        const p = 0.15 + 0.85 * (r.prog || 0), fl = 0.75 + 0.25 * Math.sin(T * 0.9 + n * 1.7);
        I = 0.22 * (0.4 + p) * fl;                                                            // acquiring: thin, dim, pulsing, rising with focus progress
        wc = r.bw * (0.18 + 0.2 * p); wg = r.bw * (0.55 + 0.4 * p);
      }
      const fadeOut = Math.min(1, (w.cd * 1.1 + 0.03 - r.age) / Math.max(0.05, w.cd * 0.4));      // fade over the end of the hold
      I *= fadeOut;
      _bC.setHex(r.col);
      const i = n++;
      let g = P.glow;
      g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aB.setXYZ(i, r.b.x, r.b.y, r.b.z);
      g.at.aP.setXYZW(i, wg * 0.5, 2.4, 2.6, 0.0); g.at.aCol.setXYZW(i, _bC.r, _bC.g, _bC.b, I * (r.live ? 1.1 : 0.9) * 1.6);
      g = P.core;
      g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z); g.at.aB.setXYZ(i, r.b.x, r.b.y, r.b.z);
      g.at.aP.setXYZW(i, wc * 0.5, 5.0, 1.2, r.live ? 0.75 : 0.25); g.at.aCol.setXYZW(i, _bC.r, _bC.g, _bC.b, I * (r.live ? 4.0 : 1.4));
      g = P.muz;
      g.at.aA.setXYZ(i, r.a.x, r.a.y, r.a.z);
      g.at.aP.setXYZW(i, r.bw * (r.live ? 2.2 : 0.9), 0, 3.5, 0); g.at.aCol.setXYZW(i, _bC.r, _bC.g, _bC.b, I * (r.live ? 1.6 : 0.4));
      g = P.imp;
      if (r.hit) {
        if (r.shield && r.live) _bC.lerp(_c1.setHex(0x7fd0ff), 0.6);
        g.at.aA.setXYZ(i, r.b.x, r.b.y, r.b.z);
        g.at.aP.setXYZW(i, r.bw * (r.live ? (r.shield ? 5 : 3.2) : 1.2), 0, 4, 0); g.at.aCol.setXYZW(i, _bC.r, _bC.g, _bC.b, I * (r.live ? 2.4 : 0.5) * (0.85 + 0.3 * Math.random()));
      } else g.at.aCol.setW(i, 0);
    }
  }
  for (const k in P) {
    const L = P[k]; L.geo.instanceCount = n; L.mesh.visible = n > 0;
    if (n) for (const a in L.at) { L.at[a].needsUpdate = true; }
  }
  beamStat.n = n;
}
const beamStat = { n: 0 };
const _c1 = new THREE.Color();

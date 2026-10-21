// ======================================================================
//  PARTICLES
// ======================================================================
class Particles {
  constructor(max, size, additive) {
    this.max = max; this.i = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.c0 = new Float32Array(max * 4); this.c1 = new Float32Array(max * 4);
    this.life = new Float32Array(max); this.maxLife = new Float32Array(max).fill(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    this.geo = g;
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  emit(p, v, life, c0, c1) {
    const i = this.i; this.i = (this.i + 1) % this.max;
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = v.x; this.vel[i * 3 + 1] = v.y; this.vel[i * 3 + 2] = v.z;
    this.life[i] = life; this.maxLife[i] = life;
    for (let k = 0; k < 4; k++) { this.c0[i * 4 + k] = c0[k]; this.c1[i * 4 + k] = c1[k]; }
  }
  update(dt) {
    const cp = camera.position;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.col[i * 4 + 3] = 0; continue; }
      this.life[i] -= dt;
      const t = 1 - Math.max(0, this.life[i]) / this.maxLife[i];
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      for (let k = 0; k < 4; k++) this.col[i * 4 + k] = this.c0[i * 4 + k] + (this.c1[i * 4 + k] - this.c0[i * 4 + k]) * t;
      // fade out particles that are very close to the camera (they would fill the screen)
      const ex = this.pos[i * 3] - cp.x, ey = this.pos[i * 3 + 1] - cp.y, ez = this.pos[i * 3 + 2] - cp.z;
      this.col[i * 4 + 3] *= Math.min(1, Math.max(0, (Math.sqrt(ex * ex + ey * ey + ez * ez) - 4) / 14));
      if (this.life[i] <= 0) this.col[i * 4 + 3] = 0;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
const sparks = new Particles(700, 0.7, true);
const fire = new Particles(300, 1.8, true);
const smoke = new Particles(500, 1.5, false);
const frag = new Particles(600, 0.4, false);

const _pv = new THREE.Vector3();
const rv = (s) => _pv.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(s * (0.3 + Math.random() * 0.7));
function sparksAt(p, n, speed, c = [3, 1.6, 0.5, 1]) {
  for (let i = 0; i < n; i++) sparks.emit(p, rv(speed), 0.25 + Math.random() * 0.4, c, [1, 0.2, 0, 0]);
}
function fireAt(p, n, speed) {
  for (let i = 0; i < n; i++) fire.emit(p, rv(speed), 0.4 + Math.random() * 0.6, [2.2, 1.0, 0.25, 0.9], [0.5, 0.05, 0, 0]);
}
function smokeAt(p, n, speed) {
  for (let i = 0; i < n; i++) smoke.emit(p, rv(speed), 1 + Math.random() * 1.2, [0.22, 0.2, 0.19, 0.55], [0.05, 0.05, 0.05, 0]);
}

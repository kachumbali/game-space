// ======================================================================
//  AI  (FROGG: attack run -> break off -> repeat; flee when guns are gone)
// ======================================================================
const _m4 = new THREE.Matrix4();
const _tq = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
function aiUpdate(e, dt) {
  const pp = player.group.position, ep = e.group.position;
  const dist = ep.distanceTo(pp), ai = e.ai;
  ai.t -= dt;
  const gunsAlive = e.def.guns.some(g => compOf(e, g.comp).hp > 0);
  let aim = _v.copy(pp).addScaledVector(player.vel, dist / e.def.boltSpeed);
  if (!gunsAlive) ai.mode = 'flee';
  else if (ai.mode === 'flee') ai.mode = 'attack';
  if (ai.mode === 'attack' && dist < 55) {
    ai.mode = 'break'; ai.t = 2 + Math.random() * 1.5;
    ai.aim.copy(ep).sub(pp).normalize().multiplyScalar(300)
      .add(new THREE.Vector3().randomDirection().multiplyScalar(120)).add(ep);
  }
  if (ai.mode === 'break') { aim = ai.aim; if (ai.t <= 0) ai.mode = 'attack'; }
  if (ai.mode === 'flee') aim = _v.copy(ep).sub(pp).normalize().multiplyScalar(500).add(ep);
  if (aim.distanceToSquared(ep) > 1e-4) {
    _m4.lookAt(ep, aim, _up);
    _tq.setFromRotationMatrix(_m4);
    e.group.quaternion.rotateTowards(_tq, e.def.turn * turnMul(e) * dt);
  }
  flightModels.arcade(e, { throttle: e.def.aiSpeed / e.def.maxSpeed, ab: false }, dt);
  if (ai.mode === 'attack' && e.cool <= 0 && dist < 320) {
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(e.group.quaternion);
    if (f.angleTo(_pt.copy(pp).sub(ep).normalize()) < 0.1) fire_(e);
  }
}
const _pt = new THREE.Vector3();

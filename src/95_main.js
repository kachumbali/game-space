// ======================================================================
//  MAIN LOOP
// ======================================================================
resetGame();
let last = performance.now();
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  last = t;
  if (!globalThis.__paused) update(dt);
  updateHud();
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  THREE, camera, scene, update, updateHud, resetGame, SHIPS, voxelize, keys, stick, applyHit, makeShip, compOf, compFactor, setView,
  get state() { return state; }, get ships() { return ships; }, get bolts() { return bolts; },
  get player() { return player; }, get debris() { return debris; }, get kills() { return kills; },
  get wave() { return wave; }, get target() { return target; }, changeDetail, DETAIL_STEPS, cycleTarget,
};

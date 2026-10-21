// ======================================================================
//  MAIN LOOP
// ======================================================================
startMission(MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, (parseInt(params.get('m')) || MISSIONS.length) - 1))]);
if (params.has('free')) { $id('brief').style.display = 'none'; resetGame(); }
else if (params.has('go')) { $id('brief').style.display = 'none'; state = 'play'; }
let last = performance.now();
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  last = t;
  if (!globalThis.__paused) update(dt * (state === 'cine' ? 1 : SIM_SPEED));
  renderBolts();
  updateHud();
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  THREE, camera, scene, update, updateHud, resetGame, startMission, MISSIONS, SHIPS, WEAPONS, voxelize, keys, stick, applyHit, makeShip, spawnShip, compOf, compFactor, setView,
  launchMissile, deployCM, fireGuns, killShip, destroy, hostileList, lockUpdate, selectedMissile, cycleMissile, cycleTarget, targetCrosshair, missionUpdate, changeDetail, DETAIL_STEPS, comm, game, warnState, CREW,
  get state() { return state; }, set state(v) { state = v; }, get ships() { return ships; }, get bolts() { return bolts; }, get missiles() { return missiles; }, get decoys() { return decoys; },
  get player() { return player; }, get debris() { return debris; }, get kills() { return kills; }, get killLog() { return killLog; },
  get wave() { return wave; }, get target() { return target; }, set target(v) { target = v; manualTarget = true; },
};

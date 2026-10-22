// ======================================================================
//  MAIN LOOP
// ======================================================================
startMission(MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, (parseInt(params.get('m')) || MISSIONS.length) - 1))]);
if (params.has('free')) { $id('brief').style.display = 'none'; resetGame(); }
else if (params.has('sk')) startSkirmish(skFromParams());
else if (params.has('go')) { $id('brief').style.display = 'none'; state = 'play'; }
else if (!params.has('m')) showMainMenu();          // ?m=N still opens that mission's briefing directly
let last = performance.now();
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  last = t;
  musicTick(dt);
  if (!globalThis.__paused && !rdlgOpen && !optsOpen) update(dt * (state === 'cine' ? 1 : SIM_SPEED));
  renderBolts();
  updateHud();
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  startSkirmish, showMainMenu, showSkirmishSetup, openMenu, skFromParams, SK_PRESETS, get skCfg() { return skCfg; }, get skState() { return game.skS; },
  nukeAt, nukeLog, flightModels, NUKE, PLOG, plogReset, AI_TUNE, MUS, AOPT, SMP, toggleOpts, showCredits, CREDITS, ARMOR, ARMOR_THRESH_CLS, MASS, DMGX, FF,
  THREE, camera, scene, update, applyArea, applyLook, LOOKS, updateHud, resetGame, startMission, MISSIONS, SHIPS, WEAPONS, voxelize, keys, stick, applyHit, makeShip, spawnShip, compOf, compFactor, setView,
  launchMissile, deployCM, fireGuns, killShip, destroy, hostileList, lockUpdate, selectedMissile, cycleMissile, cycleTarget, targetCrosshair, missionUpdate, changeDetail, DETAIL_STEPS, setDevice, setLod, lodTick, powerKey, powerShift, abTick, pwF, get lodLevel() { return lodLevel; }, comm, game, warnState, CREW,
  get state() { return state; }, set state(v) { state = v; }, get ships() { return ships; }, get bolts() { return bolts; }, get missiles() { return missiles; }, get decoys() { return decoys; },
  get player() { return player; }, get debris() { return debris; }, get kills() { return kills; }, get killLog() { return killLog; },
  get wave() { return wave; }, get target() { return target; }, set target(v) { target = v; manualTarget = true; },
};

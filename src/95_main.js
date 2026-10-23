// ======================================================================
//  MAIN LOOP
// ======================================================================
if (!params.has('yard')) {
  startMission(MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, (parseInt(params.get('m')) || MISSIONS.length) - 1))]);
  if (params.has('free')) { $id('brief').style.display = 'none'; resetGame(); }
  else if (params.has('sk')) startSkirmish(skFromParams());
  else if (params.has('go')) { $id('brief').style.display = 'none'; state = 'play'; }
  else if (!params.has('m')) showMainMenu();          // ?m=N still opens that mission's briefing directly
}
let last = performance.now();
const FPS_ON = params.has('fps');   // owner P0 2026-10-22: ?fps = overlay + play-log frame times + a detail governor (opt-in; headless runs unaffected)
let fpsAcc = 0, fpsN = 0, fpsT = 0, fpsEl = null;
function fpsTick(ms, dt) {
  if (!FPS_ON) return;
  fpsAcc += ms; fpsN++; fpsT += dt;
  if (!fpsEl) { fpsEl = document.createElement('div'); fpsEl.style.cssText = 'position:fixed;top:6px;right:8px;z-index:60;font:12px monospace;color:#7dffb0;background:rgba(5,12,10,.6);padding:2px 8px;border-radius:4px'; document.body.appendChild(fpsEl); }
  if (fpsT >= 1) {
    const avg = fpsAcc / fpsN;
    fpsEl.textContent = avg.toFixed(0) + ' ms/frame  ' + (1000 / avg).toFixed(0) + ' fps';
    plogN('frame.ms.avg', avg); plogN('frame.count', fpsN);   // frame times in the play log (key L)
    if (avg > 40 && state === 'play' && detailIdx > 0) changeDetail(-1);   // governor: long frames -> drop a detail step
    fpsAcc = fpsN = fpsT = 0;
  }
}
function pauseToggle() {   // S1: pause/resume in flight (Esc or the touch II button); dialogs keep their own gating
  if (state !== 'play' || rdlgOpen || optsOpen) return;
  userPause = !userPause;
  log(userPause ? 'PAUSED' : 'RESUMED', '#ffd24a');
  sfx('click');
}
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  if (FPS_ON) fpsTick(t - last, dt);   // before last=t: the delta must be this frame's
  last = t;
  if (!params.has('yard')) {
    musicTick(dt);
    if (!globalThis.__paused && !userPause && !rdlgOpen && !optsOpen) update(dt * (state === 'cine' ? 1 : SIM_SPEED));   // S1: userPause freezes the sim for real
    renderBolts(); renderBeams();
    updateHud();
  }
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  startSkirmish, showMainMenu, showSkirmishSetup, openMenu, skFromParams, SK_PRESETS, get skCfg() { return skCfg; }, get skState() { return game.skS; },
  nukeAt, nukeLog, flightModels, NUKE, PLOG, plogReset, AI_TUNE, MUS, AOPT, SMP, toggleOpts, showCredits, CREDITS, ARMOR, ARMOR_THRESH_CLS, MASS, DMGX, FF,
  THREE, camera, scene, update, applyArea, applyLook, LOOKS, updateHud, resetGame, startMission, MISSIONS, SHIPS, WEAPONS, voxelize, keys, stick, applyHit, makeShip, spawnShip, compOf, compFactor, setView,
  dockTry, get dock() { return dock; }, pauseToggle, get userPause() { return userPause; }, launchMissile, deployCM, fireGuns, killShip, destroy, hostileList, lockUpdate, selectedMissile, cycleMissile, cycleTarget, targetCrosshair, missionUpdate, changeDetail, DETAIL_STEPS, coms, comsToggle, comsPick, comsKey, comsTick, setOrder, comsWing, setDevice, setLod, lodTick, powerKey, powerShift, abTick, pwF, get lodLevel() { return lodLevel; }, comm, game, warnState, CREW,
  get state() { return state; }, set state(v) { state = v; }, get ships() { return ships; }, get bolts() { return bolts; }, get missiles() { return missiles; }, get decoys() { return decoys; },
  get player() { return player; }, get debris() { return debris; }, get kills() { return kills; }, get killLog() { return killLog; },
  get wave() { return wave; }, get target() { return target; }, set target(v) { target = v; manualTarget = true; },
};
Object.assign(globalThis.__game, { beamRec, beamStat, beamsClear, get beamPool() { return beamPool; }, renderBeams, dronesOf, launchDrones, droneOrder, droneLimitOf, DRONE_ORDERS });   // drone API for the comms menu

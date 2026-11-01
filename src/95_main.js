// ======================================================================
//  MAIN LOOP
// ======================================================================
if (!params.has('yard')) {
  startMission(MISSIONS[Math.max(0, Math.min(MISSIONS.length - 1, (parseInt(params.get('m')) || MISSIONS.length) - 1))]);
  if (params.has('free')) { $id('brief').style.display = 'none'; resetGame(); }
  else if (params.has('sk')) startSkirmish(skFromParams());
  else if (params.has('sv')) startSurvival(svFromParams());
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
// ---- pause menu (v0.2.2): Esc, losing mouse capture, or the touch II button open it. RESUME / RESTART / OPTIONS / EXIT (confirm; Gauntlet banks the score).
let pmArm = 0, pmAutoT = 0;                                         // performance.now() of the first EXIT click; a second click within 4 s confirms
function pauseToggle(force) {   // S1: pause/resume in flight; dialogs keep their own gating
  if (state !== 'play' || rdlgOpen || optsOpen) return;
  userPause = force !== undefined ? force : !userPause;
  pmArm = 0;
  log(userPause ? 'PAUSED' : 'RESUMED', '#ffd24a');
  sfx('click');
  if (userPause) document.exitPointerLock?.(); else if (!isTouch) lockPointer();       // resume re-takes the mouse; if the browser refuses, "click to take controls" shows
}
const pmEl = $id('pauseOv');
pmEl.innerHTML = `<div class="pt">PAUSED</div><div class="ps" id="pm_sub"></div><div class="pbtns"><button id="pm_res">RESUME <small>[ESC]</small></button><button id="pm_rst">RESTART... <small>[R]</small></button><button id="pm_opt">OPTIONS <small>[O]</small></button><button id="pm_exit" class="warn"></button></div>`;
const pmExitLabel = () => (game.mode === 'mission' ? 'EXIT MISSION' : game.mode === 'skirmish' ? 'EXIT SKIRMISH' : game.mode === 'survival' ? 'END RUN' : 'EXIT TO MENU');
function pauseMenuRefresh() {
  const armed = pmArm && performance.now() - pmArm < 4000;
  if (!armed) pmArm = 0;
  const sub = game.mode === 'mission' && game.mission ? game.mission.title : game.mode === 'survival' && sv ? 'GAUNTLET · WAVE ' + sv.n : game.mode === 'skirmish' ? 'SKIRMISH' : 'FREE FLIGHT';
  if ($id('pm_sub').textContent !== sub) $id('pm_sub').textContent = sub;
  const lab = armed ? (game.mode === 'survival' ? 'CONFIRM: END RUN (score is kept)' : 'CONFIRM: ' + pmExitLabel() + ' (progress is lost)') : pmExitLabel() + ' / MAIN MENU';
  const b = $id('pm_exit'); if (b.textContent !== lab) b.textContent = lab;
  b.classList.toggle('arm', !!armed);
}
function pauseExit() {                                   // leave the current run for the main menu (Gauntlet: end the run, bank the score, show the debrief)
  userPause = false; keys.clear(); pmArm = 0; pmEl.style.display = 'none';
  if (game.mode === 'survival' && sv && !sv.over) { sv.quit = true; svEnd(); sv.overT = 99; return; }
  if (game.mode === 'mission') restoreCrew();           // an abandoned sortie costs the wing nothing (same as a restart)
  openMenu();
}
$id('pm_res').onclick = () => pauseToggle(false);
$id('pm_rst').onclick = () => askRestart();
$id('pm_opt').onclick = () => toggleOpts(true);
$id('pm_exit').onclick = () => { if (pmArm && performance.now() - pmArm < 4000) pauseExit(); else { pmArm = performance.now(); pauseMenuRefresh(); } };
document.addEventListener('pointerlockchange', () => {   // the mouse was released in flight (Esc, alt-tab): that is a pause, not a lock-out
  if (isTouch || document.pointerLockElement === canvas) return;
  if (state === 'play' && !userPause && !rdlgOpen && !optsOpen && !credOpen) { userPause = true; pmArm = 0; pmAutoT = performance.now(); log('PAUSED', '#ffd24a'); }
});
addEventListener('keydown', e => {                       // pause menu: arrows move the focus, Enter presses; everything else is ignored while paused except Esc, R and O
  if (!userPause || state !== 'play' || rdlgOpen || optsOpen || e.ctrlKey || e.metaKey) return;
  const L = [...pmEl.querySelectorAll('button')], i = L.indexOf(document.activeElement);
  if (e.code === 'ArrowDown') L[(i + 1) % L.length].focus();
  else if (e.code === 'ArrowUp') L[(i - 1 + L.length) % L.length].focus();
  else if (e.code === 'Enter' || e.code === 'NumpadEnter') (i >= 0 ? L[i] : L[0]).click();
  else if (e.code === 'Escape' || e.code === 'KeyR' || e.code === 'KeyO') return;     // handled by their own listeners
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  if (FPS_ON) fpsTick(t - last, dt);   // before last=t: the delta must be this frame's
  last = t;
  if (!params.has('yard')) {
    musicTick(dt);
    if (!globalThis.__paused && !userPause && !rdlgOpen && !optsOpen) { let k = state === 'cine' ? 1 : SIM_SPEED; if (juice.hitStop > 0) { juice.hitStop -= dt; k *= 0.08; } update(dt * k); }   // S1: userPause freezes the sim for real
    renderBolts(); renderBeams();
    updateHud();
  }
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  get hitSrc() { return hitSrc; }, set hitSrc(v) { hitSrc = v; }, set hitKind(v) { hitKind = v; },
  version: GAME_VERSION, fmSet, fmLoad, matchSpeed, FM_ORDER, SIMF, endMission, showDebrief, tipsTick, startSurvival, SV_TUNE, svSkill, svPick, svNextWave, svCompose, svRecalc, PERKS, DIFFS, MUTATORS, diffSet, careerGet, careerRank, get sv() { return sv; }, lootClear, lootPods, lootSpawn, lootApply, lootTick, recalcMods, LOOT, LOOT_CFG, lootState, juice, FUN, juiceHit, juiceKill, juiceMedals, killHooks,
  startSkirmish, showMainMenu, showSkirmishSetup, openMenu, skFromParams, SK_PRESETS, get skCfg() { return skCfg; }, get skState() { return game.skS; },
  nukeAt, nukeLog, flightModels, NUKE, PLOG, plogReset, AI_TUNE, MUS, AOPT, SMP, toggleOpts, showCredits, CREDITS, ARMOR, ARMOR_THRESH_CLS, MASS, DMGX, FF,
  THREE, camera, scene, update, applyArea, applyLook, LOOKS, updateHud, resetGame, startMission, MISSIONS, SHIPS, WEAPONS, voxelize, keys, stick, applyHit, makeShip, spawnShip, compOf, compFactor, setView, get objectives() { return objectives; },
  dockTry, get dock() { return dock; }, pauseToggle, pauseExit, pauseMenuRefresh, get userPause() { return userPause; }, launchMissile, deployCM, fireGuns, killShip, destroy, hostileList, lockUpdate, selectedMissile, cycleMissile, cycleTarget, targetCrosshair, missionUpdate, changeDetail, DETAIL_STEPS, coms, comsToggle, comsPick, comsKey, comsTick, setOrder, comsWing, setDevice, setLod, lodTick, powerKey, powerShift, abTick, pwF, get lodLevel() { return lodLevel; }, comm, game, warnState, CREW,
  get state() { return state; }, set state(v) { state = v; }, get ships() { return ships; }, get bolts() { return bolts; }, get missiles() { return missiles; }, get decoys() { return decoys; },
  get time() { return time; }, get player() { return player; }, get debris() { return debris; }, get kills() { return kills; }, get killLog() { return killLog; },
  get wave() { return wave; }, get target() { return target; }, set target(v) { target = v; manualTarget = true; },
};
Object.assign(globalThis.__game, { DB, TUNE, DB_SRC, beamRec, beamStat, beamsClear, get beamPool() { return beamPool; }, renderBeams, dronesOf, launchDrones, droneOrder, droneLimitOf, DRONE_ORDERS });   // drone API for the comms menu

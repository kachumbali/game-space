// ======================================================================
//  MAIN LOOP
// ======================================================================
initControlHelp();
if (!params.has('yard')) {
  if (params.has('scene')) {
    startScene(params.get('scene') || 'intro_test');
  } else {
    const bootCampaign = CAMPAIGNS.find(c => c.id === params.get('campaign')) || CAMPAIGNS.find(c => c.id === 'severed_node');
    startMission(bootCampaign.missions[Math.max(0, Math.min(bootCampaign.missions.length - 1, (parseInt(params.get('m')) || bootCampaign.missions.length) - 1))], null, false, params.has('go') && !params.has('free') && !params.has('sk') && !params.has('skh') && !params.has('sv'));
    if (params.has('free')) { $id('brief').style.display = 'none'; resetGame(); }
    else if (params.has('sk') || params.has('skh')) startSkirmish(skFromParams());
    else if (params.has('sv')) startSurvival(svFromParams());
    else if (params.has('go')) { $id('brief').style.display = 'none'; state = 'play'; }
    else if (!params.has('m')) showMainMenu();          // ?campaign=prologue&m=N opens its briefing directly
  }
}
let last = performance.now();
const FPS_ON = params.has('fps');
let fpsEl = null, fpsDisplay = 0, fpsWasActive = false;
const perfCosts = {hudSum: 0, renderSum: 0, frames: 0, callsSum: 0, callsMax: 0};
if (FPS_ON) renderer.info.autoReset = false;
function fpsTick(ms) {
  if (!FPS_ON) return;
  const active = state === 'play' && !userPause && !rdlgOpen && !optsOpen && !globalThis.__paused && !document.hidden;
  if (active && fpsWasActive) perfRecord(ms);
  fpsWasActive = active;
  if (!fpsEl) { fpsEl = document.createElement('div'); fpsEl.style.cssText = 'position:fixed;top:6px;right:8px;z-index:60;font:12px monospace;color:#7dffb0;background:rgba(5,12,10,.8);padding:4px 8px;border-radius:4px'; document.body.appendChild(fpsEl); }
  fpsDisplay += ms;
  if (fpsDisplay >= 1000) { const s = perfSummary(); fpsEl.textContent = s ? `AVG ${s.avg.toFixed(1)} MS · P95 ${s.p95} MS · WORST ${s.worst.toFixed(1)} MS · 10S MIN ${s.windows.length ? Math.min(...s.windows.map(w => w.count / 10)).toFixed(1) : '—'} FPS${s.windows.length && s.windows.at(-1).count ? ` · LAST 10S ${s.windows.at(-1).avg.toFixed(1)}/${s.windows.at(-1).p95.toFixed(1)}/${s.windows.at(-1).worst.toFixed(1)} MS` : ''}` : 'FRAME RECORDER READY'; fpsDisplay = 0; }
}
// Job A may be merged independently. When present, include the opt-in recorder in its plain-text report.
if (typeof reportText === 'function') {
  const reportTextBase = reportText;
  reportText = (...args) => reportTextBase(...args) + '\n' + perfReportLine();
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
pmEl.innerHTML = `<div class="pt">PAUSED</div><div class="ps" id="pm_sub"></div><div class="pbtns"><button id="pm_res">RESUME <small>[ESC]</small></button><button id="pm_help">CONTROLS <small>[H]</small></button><button id="pm_rst">RESTART... <small>[R]</small></button><button id="pm_opt">OPTIONS <small>[O]</small></button><button id="pm_exit" class="warn"></button></div>`;
reportControls(pmEl, () => 'in progress');
document.getElementById('help').insertAdjacentHTML('beforeend', '<div class="legend">COPY REPORT in the pause menu or debrief copies a private session report; DOWNLOAD REPORT saves it, and EXPORT LAST 10 downloads saved sessions.</div>');
const pmExitLabel = () => (game.mode === 'mission' ? 'EXIT MISSION' : game.mode === 'skirmish' ? 'EXIT SKIRMISH' : game.mode === 'survival' ? 'END RUN' : 'EXIT TO MENU');
function pauseMenuRefresh() {
  const note = pmEl.querySelector('textarea'); if (document.activeElement !== note && note.value !== REPORT.note) note.value = REPORT.note;
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
  if (game.mode === 'mission') prologueSessionRecord(game.mission, game.mstate, 'exit');
  if (game.mode === 'survival' && sv && !sv.over) { sv.quit = true; svEnd(); sv.overT = 99; return; }
  reportArchive('exit');
  if (game.mode === 'mission') restoreCrew();           // an abandoned sortie costs the wing nothing (same as a restart)
  openMenu();
}
$id('pm_res').onclick = () => pauseToggle(false);
$id('pm_help').onclick = toggleHelp;
$id('pm_rst').onclick = () => askRestart();
$id('pm_opt').onclick = () => toggleOpts(true);
$id('pm_exit').onclick = () => { if (pmArm && performance.now() - pmArm < 4000) pauseExit(); else { pmArm = performance.now(); pauseMenuRefresh(); } };
document.addEventListener('pointerlockchange', () => {   // the mouse was released in flight (Esc, alt-tab): that is a pause, not a lock-out
  if (isTouch || document.pointerLockElement === canvas) return;
  if (state === 'play' && !userPause && !rdlgOpen && !optsOpen && !credOpen) { userPause = true; pmArm = 0; pmAutoT = performance.now(); log('PAUSED', '#ffd24a'); }
});
addEventListener('keydown', e => {                       // pause menu: arrows move the focus, Enter presses; everything else is ignored while paused except Esc, R and O
  if (!userPause || state !== 'play' || rdlgOpen || optsOpen || e.ctrlKey || e.metaKey || e.target.matches('textarea')) return;
  const L = [...pmEl.querySelectorAll('button')], i = L.indexOf(document.activeElement);
  if (e.code === 'ArrowDown') L[(i + 1) % L.length].focus();
  else if (e.code === 'ArrowUp') L[(i - 1 + L.length) % L.length].focus();
  else if (e.code === 'Enter' || e.code === 'NumpadEnter') (i >= 0 ? L[i] : L[0]).click();
  else if (e.code === 'Escape' || e.code === 'KeyR' || e.code === 'KeyO') return;     // handled by their own listeners
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
function frame(t) {
  const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
  reportFrame(t - last);
  if (FPS_ON) fpsTick(t - last, dt);   // before last=t: the delta must be this frame's
  last = t;
  if (!params.has('yard')) {
    audioEngineUpdate(player, state === 'play' && !userPause && !optsOpen && !rdlgOpen && !globalThis.__paused);
    ejectionSceneTick(dt); musicTick(dt);
    if (!globalThis.__paused && !userPause && !rdlgOpen && !optsOpen && !sceneState.active && !ejectionSceneActive()) { let k = state === 'cine' ? 1 : SIM_SPEED; if (juice.hitStop > 0) { juice.hitStop -= dt; k *= 0.08; } update(dt * k); }   // S1: userPause freezes the sim for real
    renderBolts(); renderBeams();
    const hudStart = FPS_ON ? performance.now() : 0;
    updateHud();
    if (FPS_ON) perfCosts.hudSum += performance.now() - hudStart;
  }
  if (FPS_ON) renderer.info.reset();
  const renderStart = FPS_ON ? performance.now() : 0;
  if (composer && bloomOn) composer.render(); else renderer.render(scene, camera);
  if (FPS_ON) { perfCosts.renderSum += performance.now() - renderStart; perfCosts.frames++; perfCosts.callsSum += renderer.info.render.calls; perfCosts.callsMax = Math.max(perfCosts.callsMax, renderer.info.render.calls); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test / debug seam
globalThis.__game = {
  get hitSrc() { return hitSrc; }, set hitSrc(v) { hitSrc = v; }, set hitKind(v) { hitKind = v; },
  version: GAME_VERSION, fmSet, fmLoad, matchSpeed, FM_ORDER, SIMF, endMission, showDebrief, tipsTick, startSurvival, SV_TUNE, svSkill, svPick, svNextWave, svCompose, svRecalc, PERKS, DIFFS, MUTATORS, diffSet, careerGet, careerRank, get sv() { return sv; }, lootClear, lootPods, lootSpawn, lootApply, lootTick, recalcMods, LOOT, LOOT_CFG, lootState, juice, FUN, juiceHit, juiceKill, juiceMedals, killHooks,
  startSkirmish, showSkirmishDebrief, svShowDebrief, showMainMenu, showCampaignList, showMissionList, showSkirmishSetup, openMenu, skFromParams, SK_PRESETS, SK_PLAYER, SK_WING, SHIPS, ordnanceStations, ordnanceTotals, ordnanceApply, get skCfg() { return skCfg; }, get skState() { return game.skS; },
  nukeAt, nukeLog, flightModels, NUKE, REPORT, reportText, reportReset, reportArchive, reportHistory, PLOG, plogReset, AI_TUNE, MUS, AOPT, SMP, toggleOpts, showCredits, CREDITS, ARMOR, ARMOR_THRESH_CLS, MASS, DMGX, FF,
  THREE, camera, scene, update, applyArea, applyLook, LOOKS, updateHud, resetGame, startMission, MISSIONS, PROLOGUE_MISSIONS, CAMPAIGNS, campaignOf, campaignNext, SHIPS, WEAPONS, voxelize, keys, stick, applyHit, makeShip, spawnShip, compOf, compFactor, setView, get objectives() { return objectives; },
  dockTry, get dock() { return dock; }, pauseToggle, pauseExit, pauseMenuRefresh, get userPause() { return userPause; }, launchMissile, deployCM, fireGuns, killShip, destroy, hostileList, lockUpdate, selectedMissile, cycleMissile, cycleTarget, targetCrosshair, missionUpdate, changeDetail, DETAIL_STEPS, coms, comsToggle, comsPick, comsKey, comsTick, setOrder, comsWing, setDevice, setLod, lodTick, powerKey, powerShift, abTick, pwF, get lodLevel() { return lodLevel; }, comm, game, warnState, CREW,
  get state() { return state; }, set state(v) { state = v; }, get ships() { return ships; }, get bolts() { return bolts; }, get missiles() { return missiles; }, get decoys() { return decoys; },
  get time() { return time; }, get player() { return player; }, get debris() { return debris; }, get kills() { return kills; }, get killLog() { return killLog; },
  get wave() { return wave; }, get target() { return target; }, set target(v) { target = v; manualTarget = true; },
};
Object.assign(globalThis.__game, { speedMul, turnMul, powerMul, compState, SUBSYS, subEff, compEff, subMean, subDegraded, sensorLimit, abMaxOf, energyCapOf, updateTurrets, tenderTick, beamRec, beamStat, beamsClear, get beamPool() { return beamPool; }, renderBeams, dronesOf, launchDrones, droneOrder, droneLimitOf, DRONE_ORDERS });   // drone API for the comms menu
Object.assign(globalThis.__game, { DB, TUNE, DB_SRC, beamRec, beamStat, beamsClear, get beamPool() { return beamPool; }, renderBeams, dronesOf, launchDrones, droneOrder, droneLimitOf, DRONE_ORDERS });   // drone API for the comms menu
Object.assign(globalThis.__game, { reportSample });   // tools/tests/playtest_fixes_t.py
Object.assign(globalThis.__game, { AUDIO, musicTick, MUSIC_DUCK });   // tools/tests/music_duck_t.py
Object.assign(globalThis.__game, { spineInit, spineFire });   // M1 balance harness (tools/tests/ttk_matrix.py): drive the XL spine shot directly
Object.assign(globalThis.__game, { missileLiveCap, missileResourceCount: () => missileGeos.size });
Object.assign(globalThis.__game, { sfx, audioInit, audioIds: () => Object.keys(SFX), musicFiles: MUSIC_FILES });
Object.assign(globalThis.__game, { rescueEnabled, rescueSpawnCapsule, rescueTick, rescueShipAI, rescueCritical, rescueRequestEject, rescueCapsules, rescueResolve, sarScenarioOutcome, SAR_MISSIONS });
Object.assign(globalThis.__game, { blastAt, chip });   // vanishing-hull regression test
Object.assign(globalThis.__game, { rescueOutcomeRoll, rescueOutcomeContext, rescueReachable, rescueResolveBeat, rosterScriptCallsign, rosterDialogueText, rosterSlotShip, comms, getEjectionScene:()=>EJSCENE, playEjectionSequence, ejectionSceneSkip });
Object.assign(globalThis.__game, { rosterEnabled, rosterLoad, rosterForCarrier, rosterFind, rosterRank, rosterSkill, rosterTransition, rosterResolveMissing, rosterStoryArrival, rosterUpdateAwards });


Object.assign(globalThis.__game, { PERF, perfReset, perfRecord, perfStats, perfSummary, perfReportLine, Particles, perfCosts, perfDiagnostics() {
  const shipRows = ships.filter(s => s.alive).map(s => { let instances = 0, meshes = 0; s.group.traverse(o => { if (o.isInstancedMesh) { instances += o.count; meshes++; } }); return {id: s.def.id, callsign: s.callsign, meshes, instances}; });
  const particles = [sparks, fire, smoke, frag].map(p => ({capacity:p.max, active:p.life.reduce((n,x) => n + (x > 0 ? 1 : 0), 0)}));
  return {voxelBuilds:PERF.voxelBuilds || [], costs:{...perfCosts}, ships:shipRows, particles, overlay:{width:ov.width,height:ov.height}, quality:qualityName, pixel:PIXEL_STEPS[pixelIdx], detail:DETAIL_STEPS[detailIdx], bloom:!!(composer && bloomOn), heap:performance.memory?.usedJSHeapSize || null};
}, capitalOrdnanceAI, capitalPdStats, capitalSalvoAllowed });
Object.assign(globalThis.__game, { launcherHudText, updateLauncherHud });
Object.assign(globalThis.__game, { initLaunchers, launcherTick, launcherReconcile, fireLauncher });
Object.assign(globalThis.__game, { SCENE_IDS, sceneState, sceneAvailable, startScene, stopScene, prologueNextIndex, prologueComplete, prologueReset });

// Preview a cutscene from the title screen: ?cutscene=ejection|recovered|captured|missing (plays regardless of the 'seen' marker)
if (params.has('cutscene')) setTimeout(() => { try { for (const k of ['ejection','recovered','captured','missing']) localStorage.removeItem('gs_ejection_scene_'+k); } catch (_) {} playEjectionSequence(params.get('cutscene')); }, 1500);

// Opt-in device diagnostics: no per-frame traversal in ordinary gameplay.
if (params.has('diag')) {
  const diag = document.createElement('pre');
  diag.id = 'diagnostics';
  diag.style.cssText = 'position:fixed;top:8px;right:8px;z-index:30;max-width:45vw;max-height:45vh;overflow:auto;background:#001b22dd;color:#bff;padding:8px;font:11px monospace;pointer-events:none;white-space:pre-wrap';
  document.body.appendChild(diag);
  const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const instancing = renderer.capabilities.isWebGL2 || !!gl.getExtension('ANGLE_instanced_arrays');
  const updateDiag = () => {
    const rows = ships.filter(s => s.alive && s.group).map(s => {
      let meshes = 0, instances = 0;
      s.group.traverse(o => { if (o.isInstancedMesh) { meshes++; instances += o.count; } });
      return `${s.callsign || s.def.name}: ${meshes} meshes / ${instances} instances`;
    });
    diag.textContent = `WebGL renderer: ${gpu}\nInstancing: ${instancing ? 'supported' : 'unavailable'}\n${rows.join('\n') || 'No active ships'}`;
  };
  updateDiag(); setInterval(updateDiag, 1000);
}

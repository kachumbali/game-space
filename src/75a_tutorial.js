// Guided opening for the Prologue. The clock below is wall-time-equivalent;
// mission timers are held until the player completes or skips the lesson.
const TUTORIAL_STEPS = [
  ['look', 'Move the mouse or arrow keys to look around.', 'Move the left stick to look around.'],
  ['throttle', 'Change throttle with W or S.', 'Drag the throttle slider on the right.'],
  ['target', 'Press T to select the practice contact.', 'Tap TGT to select the practice contact.'],
  ['guns', 'Fire your guns with SPACE or left mouse.', 'Hold FIRE to fire your guns.'],
  ['missile', 'Keep the practice contact in the ring until LOCKED, then press ENTER or right mouse.', 'Keep the practice contact in the ring until LOCKED, then tap MSL.'],
  ['flare', 'SIMULATED LOCK: press Z to release flares.', 'SIMULATED LOCK: tap FLARE to release flares.'],
  ['boost', 'Hold SHIFT to use the afterburner.', 'Hold BOOST to use the afterburner.'],
  ['read', 'Read SHD and HULL at the upper left. Press ENTER when ready.', 'Read SHD and HULL at the upper left. Tap READY when ready.'],
];
const TUTORIAL_BASE_STEPS = TUTORIAL_STEPS.slice();
const PROLOGUE_LESSONS = {
  p02: [['wing_order', 'Press J, choose WINGMEN, ALL WINGMEN, then PROTECT ME. If no wingmen are available, skip.', 'Tap COMMS, WINGMEN, ALL WINGMEN, then PROTECT ME. If no wingmen are available, skip.']],
  p03: [['power', 'Press 4 to move power to weapons. Press 7 to balance it again.', 'Tap WPN on the POWER panel to move power to weapons. Tap POWER to balance it again.']],
  p04: [['subsystem', 'A practice contact is selected. Press N to cycle its subsystems.', 'A practice contact is selected. Tap SUB to cycle its subsystems.']],
};
const TUTORIAL_CONTROLS = {p02:'comms', p03:'power', p04:'subsystem'};
let tutorialEl = null;
function tutorialStored(id = game.mission?.id || 'p01') { try { return localStorage.getItem('gs_tutorial_' + id) === 'done'; } catch (_) { return false; } }
function tutorialSave(id = game.mission?.id || 'p01') { try { localStorage.setItem('gs_tutorial_' + id, 'done'); } catch (_) {} }
function tutorialHide() { if (tutorialEl) tutorialEl.style.display = 'none'; }
function tutorialPanel() {
  if (tutorialEl) return tutorialEl;
  const el = tutorialEl = document.createElement('div'); el.id = 'tutorial';
  el.style.cssText = 'position:fixed;left:50%;top:7%;transform:translateX(-50%);width:min(560px,70vw);z-index:18;background:rgba(4,18,17,.94);border:1px solid #69c9ad;color:#e0fff3;padding:12px 16px;text-align:center;font:15px/1.4 monospace;box-sizing:border-box';
  el.innerHTML = '<div id="tutorialText"></div><button id="tutorialReady" style="display:none;margin:8px;padding:8px">READY</button><button id="tutorialSkip" style="margin:8px;padding:8px">SKIP TUTORIAL [I]</button>';
  document.body.appendChild(el);
  el.querySelector('#tutorialSkip').onclick = tutorialFinish;
  el.querySelector('#tutorialReady').onclick = () => tutorialAction('read');
  return el;
}
function tutorialStart(S) {
  const id = game.mission.id; if (TUTORIAL_CONTROLS[id]) teachControl(TUTORIAL_CONTROLS[id]);
  TUTORIAL_STEPS.splice(0, TUTORIAL_STEPS.length, ...(id === 'p01' ? TUTORIAL_BASE_STEPS : PROLOGUE_LESSONS[id]));
  S.tutorial = { id, steps: TUTORIAL_STEPS, step: 0, elapsed: 0, repeat: false, confirm: 0, target: null, stores: {...player.stores}, ammo: {...player.ammo}, stations: player.ordnanceLoad?.map(st => st.remaining) };
  tutorialPanel().style.display = 'block'; tutorialRender(S.tutorial);
}
function tutorialRender(T) {
  const step = TUTORIAL_STEPS[T.step];
  if (!step) return tutorialFinish();
  tutorialPanel().querySelector('#tutorialText').textContent = (T.repeat ? 'AGAIN: ' : '') + (isTouch ? step[2] : step[1]);
  tutorialEl.querySelector('#tutorialReady').style.display = step[0] === 'read' ? 'inline-block' : 'none';
}
function tutorialAction(action) {
  const T = game.mstate?.tutorial;
  if (!T || T.confirm || TUTORIAL_STEPS[T.step]?.[0] !== action || state !== 'play' || userPause) return;
  REPORT.tutorial.push(action + ': completed');
  T.confirm = 0.8; tutorialEl.querySelector('#tutorialText').textContent = 'GOOD';
}
function tutorialFinish() {
  const T = game.mstate?.tutorial; if (!T) return;
  if (T.target) { T.target.alive = false; if (target === T.target) { target = null; manualTarget = false; } }
  Object.assign(player.stores, T.stores); Object.assign(player.ammo, T.ammo);
  if (T.stations && player.ordnanceLoad) player.ordnanceLoad.forEach((st, i) => { st.remaining = T.stations[i]; });
  for (const m of missiles) if (m.owner === player && m.target === T.target) m.dead = true;
  if (T.step < TUTORIAL_STEPS.length && !T.confirm) REPORT.tutorial.push(TUTORIAL_STEPS[T.step][0] + ': skipped');
  tutorialSave(); game.mstate.tutorial = null; tutorialEl.style.display = 'none';
}
function tutorialTick(M, S, dt) {
  if (!(M.id === 'p01' || PROLOGUE_LESSONS[M.id]) || state !== 'play' || S.ended) { if (tutorialEl) tutorialEl.style.display = 'none'; return false; }
  if (S.tutorialStarted === undefined) {
    S.tutorialStarted = true;
    if (params.get('tutorial') === '1' || !tutorialStored(M.id)) tutorialStart(S);
  }
  const T = S.tutorial; if (!T) return false;
  tutorialEl.style.display = 'block';
  if (((T.id === 'p01' && T.step >= 2 && T.step <= 4) || T.steps[T.step]?.[0] === 'subsystem') && !T.target) {
    const p = player.group.position.clone().add(new THREE.Vector3(0,0,-700).applyQuaternion(player.group.quaternion));
    T.target = makeShip('merlin', 1, p, new THREE.Quaternion(), {id:'tutorial_target', callsign:'PRACTICE'});
    T.target.tutorialTarget = true;
    if (T.id === 'p04') { target = T.target; manualTarget = true; }
  }
  if (T.target && T.target.alive) {
    T.target.group.position.copy(player.group.position).add(new THREE.Vector3(0,0,-700).applyQuaternion(player.group.quaternion));
    T.target.vel.copy(player.vel);
  }
  if (T.confirm) {
    T.confirm -= dt / SIM_SPEED;
    if (T.confirm <= 0) { T.confirm = 0; T.step++; T.elapsed = 0; T.repeat = false; tutorialRender(T); }
  } else {
    T.elapsed += dt / SIM_SPEED;
    if (T.elapsed >= 20) { T.elapsed = 0; if (T.repeat) { REPORT.tutorial.push(TUTORIAL_STEPS[T.step][0] + ': timed out'); T.step++; T.repeat = false; } else T.repeat = true; tutorialRender(T); }
  }
  return !!S.tutorial;
}

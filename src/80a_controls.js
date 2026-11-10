// Basic mode changes presentation only. The full bindings remain active.
let controlsMode = (() => { try { return localStorage.getItem('gs_controls') === 'advanced' ? 'advanced' : 'basic'; } catch (_) { return 'basic'; } })();
function basicControls() { return controlsMode === 'basic'; }
function setControlsMode(mode) {
  controlsMode = mode === 'advanced' ? 'advanced' : 'basic';
  try { localStorage.setItem('gs_controls', controlsMode); } catch (_) {}
  document.body.classList.toggle('controls-basic', basicControls());
  const advanced = document.getElementById('helpAdvanced'), toggle = document.getElementById('helpMode');
  if (advanced) advanced.style.display = basicControls() ? 'none' : 'block';
  if (toggle) toggle.textContent = basicControls() ? 'ADVANCED' : 'BASIC';
}
function initControlHelp() {
  const help = document.getElementById('help');
  const advanced = document.createElement('div'); advanced.id = 'helpAdvanced';
  while (help.firstChild) advanced.appendChild(help.firstChild);
  const basic = document.createElement('div'); basic.id = 'helpBasic';
  basic.innerHTML = `<h3>BASIC CONTROLS</h3><div class="legend">${isTouch ? 'LOOK: left stick · THROTTLE: right slider · TARGET: TGT · GUNS: FIRE · MISSILE: MSL · FLARES: FLARE · AFTERBURNER: BOOST' : 'LOOK: mouse or arrows · THROTTLE: W / S · TARGET: T · GUNS: SPACE or left mouse · MISSILE: ENTER or right mouse · FLARES: Z · AFTERBURNER: SHIFT'}</div><div class="legend">Keep the target in the ring until locked before firing a missile. Read shields and hull at the upper left.</div><div class="legend">The Prologue tutorial can be skipped with ${isTouch ? 'SKIP TUTORIAL' : 'I'}. Basic mode keeps the other controls available; select ADVANCED to see them.</div>`;
  const mode = document.createElement('button'); mode.id = 'helpMode'; mode.style.cssText = 'margin:12px 8px 4px 0;padding:9px;cursor:pointer';
  mode.onclick = () => setControlsMode(basicControls() ? 'advanced' : 'basic');
  const close = document.createElement('button'); close.id = 'helpClose'; close.textContent = 'CLOSE'; close.style.cssText = 'padding:9px;cursor:pointer'; close.onclick = toggleHelp;
  help.append(basic, mode, close, advanced);
  help.style.maxHeight = '90vh'; help.style.overflow = 'auto'; help.style.whiteSpace = 'normal'; help.style.zIndex = '45';
  setControlsMode(controlsMode);
}
function toggleHelp() {
  const help = document.getElementById('help'), opening = help.style.display !== 'block';
  if (opening && state === 'play' && !userPause) pauseToggle(true);
  help.style.display = opening ? 'block' : 'none';
}

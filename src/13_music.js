// ======================================================================
//  MUSIC + AUDIO OPTIONS (owner 2026-10-21)
//  Music = mp3 files in ./audio/ played through <audio> elements (works from file:// and http; iOS ignores element.volume, so there on/off works
//  but the music volume slider may not). Sound samples (CC0) are embedded in 14_samples.js and layered under the procedural SFX.
//  Options (O key / button): music on/off, music volume, effects volume, sample layer on/off. Saved in localStorage (try/catch).
// ======================================================================
const AOPT = { music: true, musicVol: 0.5, sfxVol: 1, samples: true };
try { Object.assign(AOPT, JSON.parse(localStorage.getItem('gs_audio') || '{}')); } catch (e) { /* private mode: defaults */ }
function aoptSave() { try { localStorage.setItem('gs_audio', JSON.stringify(AOPT)); } catch (e) { /* ignore */ } }
const MUSIC_FILES = { menu: 'audio/airy.mp3', patrol: 'audio/sector.mp3', combat: 'audio/urgent.mp3', heavy: 'audio/pulse.mp3', win: 'audio/victory.mp3', story: 'audio/transmission.mp3' };
const MUS = { el: {}, want: null, started: false, combatT: 0, mood: null };
function musEl(k) {
  if (!MUS.el[k]) { const a = new Audio(MUSIC_FILES[k]); a.preload = 'auto'; a.loop = k !== 'win'; a.volume = 0; MUS.el[k] = a; }
  return MUS.el[k];
}
function sfxGain() { return AUDIO.muted ? 0 : 0.55 * AOPT.sfxVol; }
function musicWant(k) { if (MUS.want !== k) { MUS.want = k; if (k === 'win') { const a = musEl(k); try { a.currentTime = 0; } catch (e) { /* not loaded yet */ } } } }
// which track fits the situation: briefing/debrief = menu, flight = patrol, hostile fighters close = combat (heavy when many)
function musicMood(dtReal) {
  if (state === 'brief' || $id('brief').style.display === 'flex') return game.mstate && game.mstate.result === 'win' ? 'win' : 'menu';
  if (state === 'cine') return 'story';
  if (state === 'done' || state === 'dead') return game.mstate && game.mstate.result === 'win' ? 'win' : 'menu';
  if (state !== 'play' || !player) return 'menu';
  let n = 0;
  for (const s of ships) if (s.alive && s.team !== player.team && s.group.position.distanceTo(player.group.position) < 1800) n++;
  if (n > 0) MUS.combatT = 8; else MUS.combatT = Math.max(0, MUS.combatT - dtReal);
  if (MUS.combatT > 0) return n >= 6 || MUS.mood === 'heavy' && n >= 3 ? 'heavy' : 'combat';
  return 'patrol';
}
function musicTick(dtReal) {
  if (!MUS.started) return;
  const on = AOPT.music && !AUDIO.muted;
  musicWant(on ? musicMood(dtReal) : null);
  MUS.mood = MUS.want;
  for (const k in MUSIC_FILES) {
    if (k !== MUS.want && !MUS.el[k]) continue;
    const a = musEl(k), tv = k === MUS.want ? AOPT.musicVol : 0;
    if (tv > 0 && a.paused) a.play().catch(() => { /* autoplay blocked or file missing: stay silent */ });
    const step = dtReal / 1.6;                         // ~1.6 s crossfade
    a.volume = clamp(a.volume + clamp(tv - a.volume, -step, step), 0, 1);
    if (tv === 0 && a.volume < 0.01 && !a.paused) a.pause();
  }
}
// ---- sound samples layered under the procedural effects ----
const SMP = { buf: {}, ready: false };
function samplesLoad() {
  if (SMP.ready || !AUDIO.ctx || typeof SAMPLE_DATA === 'undefined') return;
  SMP.ready = true;
  for (const k in SAMPLE_DATA) {
    try {
      const bin = atob(SAMPLE_DATA[k].split(',')[1]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      AUDIO.ctx.decodeAudioData(u.buffer, b => { SMP.buf[k] = b; }, () => { });
    } catch (e) { /* skip */ }
  }
}
function samplePlay(k, vol, rate = 1) {
  const b = SMP.buf[k]; if (!b || !AOPT.samples || AUDIO.muted) return;
  const C = AUDIO.ctx, s = C.createBufferSource(), g = C.createGain();
  s.buffer = b; s.playbackRate.value = rate * (0.94 + Math.random() * 0.12); g.gain.value = vol;
  s.connect(g); g.connect(AUDIO.master); s.start();
}
const SAMPLE_MAP = {
  boom: v => { const big = v > 0.75; samplePlay(big ? 'expl3' : ['expl1', 'expl2', 'expl4'][Math.floor(Math.random() * 3)], big ? 0.5 : 0.35, big ? 0.8 : 1); },
  pulse: () => samplePlay('pulse', 0.16, 1.1),
  fang: () => samplePlay('fang', 0.12, 1.3),
  jump: () => samplePlay('warp', 0.45),
};
// ---- options panel ----
let optsOpen = false;
function toggleOpts(force) {
  const el = $id('opts'); if (!el) return;
  const open = force !== undefined ? force : !optsOpen;
  if (open === optsOpen) return;
  optsOpen = open;
  if (open) {
    document.exitPointerLock?.();
    const row = (id, label, inner) => `<div class="orow"><label for="${id}">${label}</label>${inner}</div>`;
    el.innerHTML = `<div class="panel"><h2>AUDIO OPTIONS</h2>`
      + row('o_music', 'Music', `<input type="checkbox" id="o_music" ${AOPT.music ? 'checked' : ''}>`)
      + row('o_mv', 'Music volume', `<input type="range" id="o_mv" min="0" max="100" value="${Math.round(AOPT.musicVol * 100)}">`)
      + row('o_sv', 'Effects volume', `<input type="range" id="o_sv" min="0" max="100" value="${Math.round(AOPT.sfxVol * 100)}">`)
      + row('o_smp', 'Sample layer (explosions, jump, bolts)', `<input type="checkbox" id="o_smp" ${AOPT.samples ? 'checked' : ''}>`)
      + `<div class="onote">Music files are in the audio/ folder next to index.html. On iPad the music volume slider may have no effect (iOS); use on/off.</div>`
      + `<button id="o_close">CLOSE <small>[O / ESC]</small></button><button id="o_cred">CREDITS</button></div>`;
    el.style.display = 'flex';
    $id('o_music').onchange = e => { AOPT.music = e.target.checked; aoptSave(); };
    $id('o_mv').oninput = e => { AOPT.musicVol = e.target.value / 100; aoptSave(); };
    $id('o_sv').oninput = e => { AOPT.sfxVol = e.target.value / 100; aoptSave(); if (AUDIO.master) AUDIO.master.gain.value = sfxGain(); };
    $id('o_smp').onchange = e => { AOPT.samples = e.target.checked; aoptSave(); };
    $id('o_close').onclick = () => toggleOpts(false);
    $id('o_cred').onclick = () => showCredits(true);
  } else { el.style.display = 'none'; if (!isTouch && state === 'play') canvas.requestPointerLock?.(); }
}
addEventListener('keydown', e => {
  if (e.code === 'KeyO' && !e.ctrlKey && !e.metaKey && !e.repeat) { toggleOpts(); e.preventDefault(); e.stopImmediatePropagation(); }
  else if (e.code === 'Escape' && optsOpen && !credOpen) { toggleOpts(false); e.stopImmediatePropagation(); }
}, true);

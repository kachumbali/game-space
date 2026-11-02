// ======================================================================
//  MUSIC + AUDIO OPTIONS (owner 2026-10-21)
//  Music = mp3 files in ./audio/ played through <audio> elements (works from file:// and http; iOS ignores element.volume, so there on/off works
//  but the music volume slider may not). Sound samples (CC0) are embedded in 14_samples.js and layered under the procedural SFX.
//  Options (O key / button): music on/off, music volume, effects volume, sample layer on/off. Saved in localStorage (try/catch).
// ======================================================================
const AOPT = { music: true, musicVol: 0.5, sfxVol: 1, samples: true, sens: 1, invY: false, purist: false };
try { Object.assign(AOPT, JSON.parse(localStorage.getItem('gs_audio') || '{}')); } catch (e) { /* private mode: defaults */ }
function aoptSave() { try { localStorage.setItem('gs_audio', JSON.stringify(AOPT)); } catch (e) { /* ignore */ } }
// The menu cue and combat tracks are original GM-MIDI loops (tools/gen/music). The menu remains opt-in:
// musicUnlock is called only inside the existing first pointer/key gesture, as required by browser audio policies.
// urgent.mp3/pulse.mp3 (CC0) stay in audio/ as fallbacks.
const MUSIC_FILES = { menu:'audio/menu-frontier.mp3', title:'audio/situation-title-sting.mp3', patrol:'audio/situation-patrol.mp3', tension:'audio/situation-tension.mp3', hive:'audio/situation-hive.mp3', capital:'audio/situation-capital-duel.mp3', boss:'audio/situation-bullfrog.mp3', retreat:'audio/situation-retreat.mp3', rescue:'audio/situation-rescue.mp3', loss:'audio/situation-loss.mp3', win:'audio/situation-victory-new.mp3', combat:'audio/combat-dogfight.mp3', heavy:'audio/combat-bombast.mp3', story:'audio/transmission.mp3' };
const MUS = { el: {}, gain: {}, vol: {}, want: null, started: false, combatT: 0, mood: null, titleDone:false, status: 'waiting for the first tap or key' };
// Routing: over http(s) every track goes <audio> -> GainNode -> speakers. iOS ignores element.volume and only lets a media element play()
// if that element itself was started inside a user gesture, so (a) volume and crossfades use the gain node, and (b) the first tap/key
// starts every track silently and pauses the ones not wanted (musicUnlock). Over file:// a media-element source is silenced by the browser
// (cross-origin taint), so there the old element.volume path stays.
const musRouted = () => !!AUDIO.ctx && /^https?:$/.test(location.protocol);
function musEl(k) {
  if (!MUS.el[k]) {
    const a = new Audio(MUSIC_FILES[k]); a.preload = 'auto'; a.loop = k !== 'title'; a.volume = 0; MUS.el[k] = a; MUS.vol[k] = 0;
    if (k === 'title') a.onended = () => { MUS.titleDone = true; };
    if (musRouted()) {
      try {
        const g = AUDIO.ctx.createGain(); g.gain.value = 0;
        AUDIO.ctx.createMediaElementSource(a).connect(g); g.connect(AUDIO.ctx.destination);
        a.volume = 1; MUS.gain[k] = g;
      } catch (e) { /* keep element.volume */ }
    }
  }
  return MUS.el[k];
}
function musSetVol(k, v) { MUS.vol[k] = v; if (MUS.gain[k]) MUS.gain[k].gain.value = v; else MUS.el[k].volume = clamp(v, 0, 1); }
function musicUnlock() {          // call from inside a user gesture
  if (!musRouted()) return;
  for (const k in MUSIC_FILES) {
    const a = musEl(k);
    if (!a.paused) continue;
    a.play().then(() => { if (MUS.want !== k) a.pause(); }).catch(() => { /* not fatal: musicTick retries the wanted track */ });
  }
}
function sfxGain() { return AUDIO.muted ? 0 : 0.55 * AOPT.sfxVol; }
function musicWant(k) { if (MUS.want !== k) { MUS.want = k; if (k === 'win') { const a = musEl(k); try { a.currentTime = 0; } catch (e) { /* not loaded yet */ } } } }
// which track fits the situation: briefing/debrief = menu, flight = patrol, hostile fighters close = combat (heavy when many)
function musicMood(dtReal) {
  if (state === 'brief' || $id('brief').style.display === 'flex') return game.mstate?.result ? (game.mstate.result === 'win' ? 'win' : 'loss') : (menuView === 'main' && !MUS.titleDone ? 'title' : 'menu');
  if (state === 'cine') return 'story';
  if (state === 'done' || state === 'dead') return game.mstate && game.mstate.result === 'win' ? 'win' : 'loss';
  if (state !== 'play' || !player) return 'menu';
  let n = 0, distant = 0, capital = false, boss = false, hive = false;
  for (const s of ships) if (s.alive && !s.dying && s.team !== player.team) {
    const d = s.group.position.distanceTo(player.group.position);
    if (d < 5000) distant++;
    if (d < 1800) n++;
    if (d < 6000 && s.def.id === 'bullfrog') boss = true;
    if (d < 6000 && s.def.id === 'hivecarrier') hive = true;
    if (d < 3500 && s.def.cls !== 'fighter') capital = true;
  }
  const mission = game.mission?.id || '';
  if (boss) return 'boss';
  if (game.mission?.music === 'rescue' || mission.startsWith('sar')) return 'rescue';
  if (hive || game.mstate?.area === 'oasis') return 'hive';
  if (capital) return 'capital';
  if (mission.startsWith('r0')) return 'retreat';
  if (n > 0) MUS.combatT = 8; else MUS.combatT = Math.max(0, MUS.combatT - dtReal);
  if (MUS.combatT > 0) return n >= 6 || MUS.mood === 'heavy' && n >= 3 ? 'heavy' : 'combat';
  return distant ? 'tension' : 'patrol';
}
function musicTick(dtReal) {
  if (!MUS.started) return;
  const on = AOPT.music && !AUDIO.muted;
  musicWant(on ? musicMood(dtReal) : null);
  MUS.mood = MUS.want;
  if (!on) MUS.status = AUDIO.muted ? 'sound is muted (?mute or no audio support)' : 'off';
  for (const k in MUSIC_FILES) {
    if (k !== MUS.want && !MUS.el[k]) continue;
    const critical = AUDIO.ctx && AUDIO.ctx.currentTime < (AUDIO.criticalUntil || 0);
    const a = musEl(k), tv = k === MUS.want && !critical ? AOPT.musicVol : 0;
    if (tv > 0 && a.paused) a.play().then(() => { if (k === MUS.want) MUS.status = 'playing: ' + k; }).catch(() => { MUS.status = 'blocked by the browser: tap the screen once more'; });
    const step = dtReal / 1.6;                         // ~1.6 s crossfade
    const cur = MUS.vol[k] ?? 0;
    musSetVol(k, critical ? 0 : clamp(cur + clamp(tv - cur, -step, step), 0, 1));
    if (tv === 0 && MUS.vol[k] < 0.01 && !a.paused) a.pause();
  }
  if (on && MUS.want && MUS.el[MUS.want] && !MUS.el[MUS.want].paused) MUS.status = 'playing: ' + MUS.want;
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
function samplePlay(k, vol, rate = 1, dist = 0) {
  const b = SMP.buf[k]; if (!b || !AOPT.samples || AUDIO.muted) return;
  const C = AUDIO.ctx, s = C.createBufferSource(), g = C.createGain(), f = C.createBiquadFilter();
  s.buffer = b; s.playbackRate.value = rate * (0.94 + Math.random() * 0.12); g.gain.value = vol;
  f.type = 'lowpass'; f.frequency.value = Math.max(500, 18000 / (1 + Math.max(0, dist) / 800));
  s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(C.currentTime + Math.min(0.8, Math.max(0, dist) / 5000));
}
const SAMPLE_MAP = {
  boom: (v, d, size) => { const big = size > 0.75; samplePlay(big ? 'expl3' : ['expl1', 'expl2', 'expl4'][Math.floor(Math.random() * 3)], (big ? 0.5 : 0.35) * v, big ? 0.8 : 1, d); },
  pulse: (v, d) => samplePlay('pulse', 0.16 * v, 1.1, d),
  fang: (v, d) => samplePlay('fang', 0.12 * v, 1.3, d),
  jump: (v, d) => samplePlay('warp', 0.45 * v, 1, d),
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
    el.innerHTML = `<div class="panel"><h2>OPTIONS <small>v${GAME_VERSION}</small></h2>`
      + row('o_music', 'Music', `<input type="checkbox" id="o_music" ${AOPT.music ? 'checked' : ''}>`)
      + row('o_mv', 'Music volume', `<input type="range" id="o_mv" min="0" max="100" value="${Math.round(AOPT.musicVol * 100)}">`)
      + row('o_sv', 'Effects volume', `<input type="range" id="o_sv" min="0" max="100" value="${Math.round(AOPT.sfxVol * 100)}">`)
      + row('o_smp', 'Sample layer (explosions, jump, bolts)', `<input type="checkbox" id="o_smp" ${AOPT.samples ? 'checked' : ''}>`)
      + row('o_fm', 'Flight model [F]', `<select id="o_fm">${FM_ORDER.map(k => `<option value="${k}" ${flightMode === k ? 'selected' : ''}>${FM_NAMES[k]}</option>`).join('')}</select>`)
      + row('o_pur', 'Sim purist (no hit markers, kill banners, pods or hit-stop)', `<input type="checkbox" id="o_pur" ${AOPT.purist ? 'checked' : ''}>`)
      + row('o_sens', 'Mouse sensitivity', `<input type="range" id="o_sens" min="30" max="250" value="${Math.round(AOPT.sens * 100)}">`)
      + row('o_inv', 'Invert mouse Y', `<input type="checkbox" id="o_inv" ${AOPT.invY ? 'checked' : ''}>`)
      + row('o_dev', 'Device preset', `<select id="o_dev">${DEV_ORDER.map(d => `<option value="${d}" ${(GFX.device || 'auto') === d ? 'selected' : ''}>${d === 'auto' ? 'AUTO (' + DEVICES[autoDevice()].label + ')' : DEVICES[d].label}</option>`).join('')}</select>`)
      + row('o_lod', 'Distance LOD', `<select id="o_lod">${LOD_ORDER.map(d => `<option value="${d}" ${lodLevel === d ? 'selected' : ''}>${d.toUpperCase()}</option>`).join('')}</select>`)
      + `<div class="onote">Device presets set voxel detail, pixel size, bloom and the LOD level; MSAA and sky size need a reload. LOD rebuilds far ships with fewer voxels.</div>`
      + `<div class="onote" id="o_mstat">Music: ${MUS.status}</div>`
      + `<div class="onote">Music files are in the audio/ folder next to index.html. On iPad the music volume slider may have no effect (iOS); use on/off.</div>`
      + `<button id="o_close">CLOSE <small>[O / ESC]</small></button><button id="o_cred">CREDITS</button></div>`;
    el.style.display = 'flex';
    $id('o_music').onchange = e => { AOPT.music = e.target.checked; aoptSave(); };
    $id('o_mv').oninput = e => { AOPT.musicVol = e.target.value / 100; aoptSave(); };
    $id('o_sv').oninput = e => { AOPT.sfxVol = e.target.value / 100; aoptSave(); if (AUDIO.master) AUDIO.master.gain.value = sfxGain(); };
    $id('o_smp').onchange = e => { AOPT.samples = e.target.checked; aoptSave(); };
    $id('o_fm').onchange = e => fmSet(e.target.value);
    $id('o_pur').onchange = e => { AOPT.purist = e.target.checked; aoptSave(); };
    $id('o_sens').oninput = e => { AOPT.sens = e.target.value / 100; aoptSave(); };
    $id('o_inv').onchange = e => { AOPT.invY = e.target.checked; aoptSave(); };
    $id('o_dev').onchange = e => setDevice(e.target.value);
    $id('o_lod').onchange = e => setLod(e.target.value);
    $id('o_close').onclick = () => toggleOpts(false);
    $id('o_cred').onclick = () => showCredits(true);
  } else { el.style.display = 'none'; if (!isTouch && state === 'play' && !userPause) lockPointer(); }
}
addEventListener('keydown', e => {
  if (e.code === 'KeyO' && !e.ctrlKey && !e.metaKey && !e.repeat) { toggleOpts(); e.preventDefault(); e.stopImmediatePropagation(); }
  else if (e.code === 'Escape' && optsOpen && !credOpen) { toggleOpts(false); e.stopImmediatePropagation(); }
}, true);

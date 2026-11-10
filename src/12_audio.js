// ======================================================================
//  AUDIO — tiny WebAudio synth (no assets). Starts on first user gesture. ?mute disables.
// ======================================================================
let SV = 1, SF = 1, SD = 0, SP = 1, ST = 1;
const AUDIO = { ctx: null, master: null, noise: null, muted: params.has('mute'), lockOsc: null, lockGain: null, engineOsc: null, engineGain: null, criticalUntil: 0, warnT: 0, lockT: 0, energyT: 0, hullT: 0, conditionT: 0 };
function audioInit() {
  if (AUDIO.ctx || AUDIO.muted) { AUDIO.ctx?.state === 'suspended' && AUDIO.ctx.resume(); return; }
  try {
    const C = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    const comp = C.createDynamicsCompressor();
    AUDIO.master = C.createGain(); AUDIO.master.gain.value = typeof sfxGain === 'function' ? sfxGain() : 0.55;
    AUDIO.master.connect(comp); comp.connect(C.destination);
    const b = C.createBuffer(1, C.sampleRate, C.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AUDIO.noise = b; AUDIO.ctx = C;
    AUDIO.lockOsc = C.createOscillator(); AUDIO.lockGain = C.createGain(); AUDIO.lockGain.gain.value = 0;
    AUDIO.lockOsc.type = 'sine'; AUDIO.lockOsc.frequency.value = 1150;
    AUDIO.lockOsc.connect(AUDIO.lockGain); AUDIO.lockGain.connect(AUDIO.master); AUDIO.lockOsc.start();
    AUDIO.engineOsc = C.createOscillator(); AUDIO.engineGain = C.createGain(); AUDIO.engineGain.gain.value = 0;
    AUDIO.engineOsc.type = 'triangle'; AUDIO.engineOsc.frequency.value = 65;
    AUDIO.engineOsc.connect(AUDIO.engineGain); AUDIO.engineGain.connect(AUDIO.master); AUDIO.engineOsc.start();
    if (typeof samplesLoad === 'function') samplesLoad();
  } catch (e) { AUDIO.muted = true; }
}
['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, () => { audioInit(); MUS.started = true; if (typeof musicUnlock === 'function') musicUnlock(); }));
// A single cockpit engine bed, updated by the flight loop; no per-ship oscillator swarm.
function audioEngineUpdate(s, active = true) {
  const C = AUDIO.ctx, g = AUDIO.engineGain, o = AUDIO.engineOsc;
  if (!C || !g || !o) return;
  const on = active && s && s.alive && !s.dying && !AUDIO.muted && AOPT.samples;
  const size = ({fighter: 1, corvette: 0.7, frigate: 0.5, capital: 0.4})[s?.def?.cls] || 1;
  const throttle = Math.max(0, Math.min(1, s?.throttle || 0));
  const boost = on && s.ab ? 1 : 0;
  o.frequency.setTargetAtTime((48 + throttle * 40 + boost * 25) * size, C.currentTime, 0.12);
  g.gain.setTargetAtTime(on ? 0.025 + throttle * 0.025 + boost * 0.035 : 0, C.currentTime, 0.15);
}
function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
  const C = AUDIO.ctx; if (!C) return;
  dur *= ST; const o = C.createOscillator(), g = C.createGain(), t = C.currentTime + delay + SD;
  o.type = type; o.frequency.setValueAtTime(Math.max(20, f0 * SP), t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * SP), t + dur);
  g.gain.setValueAtTime(vol * SV, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(AUDIO.master); o.start(t); o.stop(t + dur + 0.02);
}
function noiseBurst(dur, vol, f0, f1, type = 'lowpass', q = 0.7, delay = 0) {
  const C = AUDIO.ctx; if (!C) return;
  dur *= ST; const s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(), t = C.currentTime + delay + SD;
  s.buffer = AUDIO.noise; s.loop = dur > 0.5; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(Math.max(30, f0 * SF), t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * SF), t + dur);
  g.gain.setValueAtTime(vol * SV, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const SFX = {
  cannon: () => { noiseBurst(0.07, 0.35, 2600, 500, 'bandpass', 1.2); tone(140, 50, 0.07, 'sine', 0.3); },
  pulse: () => { tone(420, 190, 0.11, 'triangle', 0.12); noiseBurst(0.08, 0.08, 1800, 450, 'bandpass'); },
  laser: () => { tone(570, 290, 0.14, 'triangle', 0.10); noiseBurst(0.10, 0.06, 2200, 550, 'bandpass'); },
  maser: () => { tone(235, 120, 0.3, 'triangle', 0.16); noiseBurst(0.22, 0.12, 1200, 240, 'lowpass'); },
  fang: () => { tone(820, 300, 0.07, 'square', 0.07); noiseBurst(0.04, 0.12, 3000, 900, 'bandpass'); },
  spit: () => { tone(330, 110, 0.18, 'sine', 0.2); noiseBurst(0.12, 0.12, 900, 200, 'lowpass'); },
  spitbig: () => { tone(200, 55, 0.4, 'sine', 0.32); noiseBurst(0.35, 0.22, 1200, 150, 'lowpass'); },
  rail: () => { tone(120, 28, 0.6, 'sine', 0.5); noiseBurst(0.5, 0.35, 5000, 200, 'highpass'); },
  beamcharge: () => { tone(180, 1500, 0.6, 'sawtooth', 0.1); tone(90, 750, 0.6, 'sine', 0.12); },       // M2: capital beam charge-up whine (rises over about 0.6 s)
  lash: () => { tone(260, 50, 0.7, 'sawtooth', 0.22); noiseBurst(0.6, 0.3, 2000, 120, 'lowpass'); },
  pd: () => noiseBurst(0.025, 0.1, 4000, 2000, 'bandpass'),
  msl: () => { noiseBurst(0.7, 0.3, 500, 2800, 'bandpass', 0.8); tone(180, 90, 0.5, 'triangle', 0.15); },
  torp: () => { noiseBurst(0.9, 0.35, 650, 180, 'lowpass'); tone(100, 43, 0.8, 'sine', 0.22); },
  flare: () => noiseBurst(0.35, 0.18, 6000, 1500, 'highpass'),
  hit: () => { noiseBurst(0.05, 0.25, 1800, 400, 'bandpass'); },
  shield: () => tone(1100, 600, 0.08, 'sine', 0.12),
  boom: (n = 1) => { noiseBurst(0.5 + n * 0.5, 0.6 + n * 0.1, 900, 60, 'lowpass'); tone(90, 25, 0.5 + n * 0.4, 'sine', 0.5); },
  blip: () => tone(600, 570, 0.055, 'sine', 0.04),
  alarm: () => { tone(650, 650, 0.12, 'triangle', 0.07); tone(480, 480, 0.12, 'triangle', 0.07, 0.14); },
  warn: () => tone(850, 850, 0.1, 'triangle', 0.06),
  lowenergy: () => { tone(460, 410, 0.13, 'triangle', 0.065); },
  hullalarm: () => { tone(540, 540, 0.17, 'triangle', 0.08); tone(410, 410, 0.17, 'triangle', 0.08, 0.2); },
  launchwarn: () => { tone(1050, 1050, 0.10, 'triangle', 0.09); tone(1050, 1050, 0.10, 'triangle', 0.09, 0.13); },
  jump: () => { tone(60, 900, 0.9, 'sawtooth', 0.15); noiseBurst(0.9, 0.2, 200, 6000, 'bandpass', 2); },
  dock: () => { noiseBurst(0.2, 0.12, 450, 120, 'lowpass'); tone(90, 55, 0.24, 'sine', 0.1); },
  comms: () => noiseBurst(0.09, 0.08, 1800, 700, 'bandpass'),
  click: () => tone(480, 440, 0.025, 'sine', 0.04),
};
// Existing procedural fallback remains available with the sample/enhancement layer off.
const SFX_FALLBACK = {
  pulse: () => tone(1500, 260, 0.13, 'sawtooth', 0.09),
  laser: () => tone(1500, 260, 0.13, 'sawtooth', 0.09),
  maser: () => { tone(330, 110, 0.18, 'sine', 0.2); noiseBurst(0.12, 0.12, 900, 200); },
  torp: () => { noiseBurst(0.7, 0.3, 500, 2800, 'bandpass', 0.8); tone(180, 90, 0.5, 'triangle', 0.15); },
  blip: () => tone(1400, 1400, 0.04, 'square', 0.05),
  alarm: () => { tone(900, 900, 0.12, 'square', 0.07); tone(700, 700, 0.12, 'square', 0.07, 0.14); },
  warn: () => tone(1900, 1900, 0.09, 'square', 0.07),
  lowenergy: () => tone(1900, 1900, 0.09, 'square', 0.07),
  hullalarm: () => { tone(900, 900, 0.12, 'square', 0.07); tone(700, 700, 0.12, 'square', 0.07, 0.14); },
  launchwarn: () => { tone(1200, 1200, 0.08, 'square', 0.08); tone(1200, 1200, 0.08, 'square', 0.08, 0.12); },
  click: () => tone(600, 600, 0.03, 'square', 0.05),
  dock: () => tone(600, 600, 0.03, 'square', 0.05),
  comms: () => tone(1400, 1400, 0.04, 'square', 0.05),
};
function sfx(name, dist = 0, vol = 1, shipClass = 'fighter') {
  if (!AUDIO.ctx || AUDIO.muted) return;
  if (['alarm', 'launchwarn', 'hullalarm'].includes(name)) AUDIO.criticalUntil = Math.max(AUDIO.criticalUntil, AUDIO.ctx.currentTime + 1.0);   // real danger ducks the music; the routine 'warn' and 'lowenergy' cues no longer do
  const a = 1 / (1 + dist / 220);
  if (a * vol < 0.04) return;
  SV = Math.min(1, a * vol);
  // Stylised remote-feed latency/filtering: vacuum has no transmitted sound.
  const enhanced = AOPT.samples;
  SD = enhanced ? Math.min(0.8, Math.max(0, dist) / 5000) : 0;
  SF = enhanced ? 1 / (1 + Math.max(0, dist) / 900) : 1;
  SP = enhanced ? (({fighter: 1, corvette: 0.78, frigate: 0.62, capital: 0.52})[shipClass] || 1) : 1;
  ST = 1 / SP;
  (enhanced ? SFX[name] : (SFX_FALLBACK[name] || SFX[name]))?.(vol); SV = SF = SP = ST = 1; SD = 0;
  if (SAMPLE_MAP[name] && a * vol > 0.15) SAMPLE_MAP[name](a * vol, dist, vol, shipClass);
}

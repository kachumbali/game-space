// ======================================================================
//  AUDIO — tiny WebAudio synth (no assets). Starts on first user gesture. ?mute disables.
// ======================================================================
let SV = 1;
const AUDIO = { ctx: null, master: null, noise: null, muted: params.has('mute'), lockOsc: null, lockGain: null, warnT: 0, lockT: 0 };
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
    if (typeof samplesLoad === 'function') samplesLoad();
  } catch (e) { AUDIO.muted = true; }
}
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { audioInit(); MUS.started = true; if (typeof musicUnlock === 'function') musicUnlock(); }));
function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
  const C = AUDIO.ctx; if (!C) return;
  const o = C.createOscillator(), g = C.createGain(), t = C.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol * SV, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(AUDIO.master); o.start(t); o.stop(t + dur + 0.02);
}
function noiseBurst(dur, vol, f0, f1, type = 'lowpass', q = 0.7, delay = 0) {
  const C = AUDIO.ctx; if (!C) return;
  const s = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(), t = C.currentTime + delay;
  s.buffer = AUDIO.noise; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol * SV, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const SFX = {
  cannon: () => { noiseBurst(0.07, 0.35, 2600, 500, 'bandpass', 1.2); tone(140, 50, 0.07, 'sine', 0.3); },
  pulse: () => tone(1500, 260, 0.13, 'sawtooth', 0.09),
  fang: () => { tone(820, 300, 0.07, 'square', 0.07); noiseBurst(0.04, 0.12, 3000, 900, 'bandpass'); },
  spit: () => { tone(330, 110, 0.18, 'sine', 0.2); noiseBurst(0.12, 0.12, 900, 200, 'lowpass'); },
  spitbig: () => { tone(200, 55, 0.4, 'sine', 0.32); noiseBurst(0.35, 0.22, 1200, 150, 'lowpass'); },
  rail: () => { tone(120, 28, 0.6, 'sine', 0.5); noiseBurst(0.5, 0.35, 5000, 200, 'highpass'); },
  beamcharge: () => { tone(180, 1500, 0.6, 'sawtooth', 0.1); tone(90, 750, 0.6, 'sine', 0.12); },       // M2: capital beam charge-up whine (rises over about 0.6 s)
  lash: () => { tone(260, 50, 0.7, 'sawtooth', 0.22); noiseBurst(0.6, 0.3, 2000, 120, 'lowpass'); },
  pd: () => noiseBurst(0.025, 0.1, 4000, 2000, 'bandpass'),
  msl: () => { noiseBurst(0.7, 0.3, 500, 2800, 'bandpass', 0.8); tone(180, 90, 0.5, 'triangle', 0.15); },
  flare: () => noiseBurst(0.35, 0.18, 6000, 1500, 'highpass'),
  hit: () => { noiseBurst(0.05, 0.25, 1800, 400, 'bandpass'); },
  shield: () => tone(1100, 600, 0.08, 'sine', 0.12),
  boom: (n = 1) => { noiseBurst(0.5 + n * 0.5, 0.6 + n * 0.1, 900, 60, 'lowpass'); tone(90, 25, 0.5 + n * 0.4, 'sine', 0.5); },
  blip: () => tone(1400, 1400, 0.04, 'square', 0.05),
  alarm: () => { tone(900, 900, 0.12, 'square', 0.07); tone(700, 700, 0.12, 'square', 0.07, 0.14); },
  warn: () => tone(1900, 1900, 0.09, 'square', 0.07),
  launchwarn: () => { tone(1200, 1200, 0.08, 'square', 0.08); tone(1200, 1200, 0.08, 'square', 0.08, 0.12); },
  jump: () => { tone(60, 900, 0.9, 'sawtooth', 0.15); noiseBurst(0.9, 0.2, 200, 6000, 'bandpass', 2); },
  click: () => tone(600, 600, 0.03, 'square', 0.05),
};
function sfx(name, dist = 0, vol = 1) {
  if (!AUDIO.ctx || AUDIO.muted) return;
  const a = 1 / (1 + dist / 220);
  if (a * vol < 0.04) return;
  SV = Math.min(1, a * vol); SFX[name]?.(); SV = 1;
  if (SAMPLE_MAP[name] && a * vol > 0.15) SAMPLE_MAP[name](vol);
}

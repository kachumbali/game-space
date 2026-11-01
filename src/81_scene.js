// ======================================================================
//  SCENE PLAYER (WC2-style pixel-art cutscene engine)
//  Drives 320x200 timeline events: backgrounds, titles, scaling sprites,
//  talking heads with blinking and phoneme lip-sync, typewriter dialogue.
//  Reference: docs/INTRO_TEST_SPEC.md
// ======================================================================

const SCENE_CANVAS_W = 320;
const SCENE_CANVAS_H = 200;

let sceneState = {
  active: false,
  id: null,
  t: 0,
  lastFrameT: 0,
  events: [],
  eventIdx: 0,
  bgImg: null,
  bgFade: 1.0,
  bgFadeT: 0,
  bgCutStatic: 0,
  title: null,
  sprites: [],
  heads: {}, // { imani: { meta, base, eyes: {}, mouth: {} } }
  activeHeads: {}, // { left: { charId, eyeState, mouthShape, blinkT, blinkPhase } }
  dialogue: null, // { who, fullText, currentText, cps, timer, charIdx, done, waitT }
  images: {},
  audioCtx: null,
  rafId: null,
};

// Embedded default scene for intro_test (fallback if fetch is offline)
const INTRO_TEST_SCENE = {
  id: "intro_test",
  size: [320, 200],
  events: [
    { t: 0.0, do: "bg", img: "bg_space.png", fade: 0.8 },
    { t: 0.5, do: "title", text: "CLAUDE SPACE COMMANDER", sub: "TEST SEQUENCE", dur: 3.0 },
    { t: 4.0, do: "sprite", id: "k1", img: "ship_kestrel.png", from: { x: 40, y: 120, scale: 0.3 }, to: { x: 230, y: 80, scale: 1.6 }, dur: 4.0, ease: "in" },
    { t: 4.0, do: "sprite", id: "h1", img: "ship_halberd.png", from: { x: 260, y: 40, scale: 0.5 }, to: { x: 90, y: 60, scale: 0.9 }, dur: 6.0, ease: "inout" },
    { t: 10.0, do: "bg", img: "bg_briefing.png", cut: "static" },
    { t: 10.2, do: "head", id: "imani", char: "imani", pos: "left" },
    { t: 10.5, do: "say", who: "imani", text: "Eagle flight, this is not a drill. Unknown contacts at the Lily relay.", cps: 28 },
    { t: 16.0, do: "head", id: "hawk", char: "hawk", pos: "right" },
    { t: 16.2, do: "say", who: "hawk", text: "Unknown how, Commander?", cps: 28 },
    { t: 19.0, do: "say", who: "imani", text: "They are not answering our hails.", cps: 28 },
    { t: 23.0, do: "say", who: "meow", text: "Then we go and say hello.", cps: 28, mouth: null },
    { t: 27.0, do: "bg", img: "bg_space.png", cut: "static" },
    { t: 28.0, do: "end" }
  ]
};

function playSceneBlip(freq = 240) {
  try {
    if (!sceneState.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) sceneState.audioCtx = new AC();
    }
    const ac = sceneState.audioCtx;
    if (!ac || ac.state === 'suspended') { ac?.resume?.(); return; }
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ac.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.045);
  } catch (e) { /* ignore audio failure */ }
}

function getMouthFromChar(ch) {
  if (!ch) return 'rest';
  const c = ch.toLowerCase();
  if ('ai'.includes(c)) return 'A';
  if ('ey'.includes(c)) return 'E';
  if ('ouw'.includes(c)) return 'O';
  if ('mbp'.includes(c)) return 'MB';
  if ('fv'.includes(c)) return 'FV';
  if (/[a-z]/.test(c)) return 'A';
  return 'rest';
}

function loadSceneImage(url) {
  return new Promise((resolve) => {
    if (sceneState.images[url]) return resolve(sceneState.images[url]);
    const img = new Image();
    img.onload = () => { sceneState.images[url] = img; resolve(img); };
    img.onerror = () => { resolve(null); };
    img.src = url;
  });
}

async function preloadSceneAssets(sceneData) {
  const base = '/assets/scenes/' + sceneData.id + '/';
  const promises = [];

  // Backgrounds & Sprites
  for (const ev of sceneData.events) {
    if (ev.img) promises.push(loadSceneImage(base + ev.img));
  }
  promises.push(loadSceneImage(base + 'ui_frame.png'));

  // Preload Character Heads
  const chars = ['imani', 'hawk', 'meow'];
  const eyes = ['eyes_open.png', 'eyes_half.png', 'eyes_closed.png'];
  const mouths = ['mouth_rest.png', 'mouth_A.png', 'mouth_E.png', 'mouth_O.png', 'mouth_MB.png', 'mouth_FV.png'];

  for (const c of chars) {
    sceneState.heads[c] = { meta: { name: c.toUpperCase(), voiceBlip: 240, blink: { min: 2, max: 5 } }, eyes: {}, mouth: {} };
    promises.push(loadSceneImage(base + 'heads/' + c + '/base.png').then(img => { sceneState.heads[c].base = img; }));
    for (const e of eyes) {
      const k = e.replace('.png', '').replace('eyes_', '');
      promises.push(loadSceneImage(base + 'heads/' + c + '/' + e).then(img => { sceneState.heads[c].eyes[k] = img; }));
    }
    for (const m of mouths) {
      const k = m.replace('.png', '').replace('mouth_', '');
      promises.push(loadSceneImage(base + 'heads/' + c + '/' + m).then(img => { sceneState.heads[c].mouth[k] = img; }));
    }
  }

  await Promise.all(promises);
}

function initSceneDOM() {
  let wrap = document.getElementById('sceneWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'sceneWrap';
    wrap.style.cssText = 'display:none;position:fixed;inset:0;z-index:90;background:#000;align-items:center;justify-content:center;image-rendering:pixelated;';
    wrap.innerHTML = `
      <canvas id="sceneCv" width="320" height="200" style="width:min(100vw, 160vh);height:min(62.5vw, 100vh);image-rendering:pixelated;image-rendering:crisp-edges;box-shadow:0 0 50px rgba(0,0,0,0.9);cursor:pointer;"></canvas>
      <button id="sceneSkip" style="position:absolute;top:16px;right:20px;z-index:95;background:rgba(8,16,24,0.88);color:#7fe0b0;border:1px solid #31505c;font:12px monospace;padding:6px 14px;cursor:pointer;letter-spacing:1px;">SKIP [ESC]</button>
    `;
    document.body.appendChild(wrap);

    const cv = document.getElementById('sceneCv');
    cv.onclick = () => advanceSceneDialogue();
    document.getElementById('sceneSkip').onclick = () => stopScene();

    window.addEventListener('keydown', (e) => {
      if (!sceneState.active) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advanceSceneDialogue();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopScene();
      }
    });
  }
}

function advanceSceneDialogue() {
  if (!sceneState.active) return;
  const d = sceneState.dialogue;
  if (d && !d.done) {
    // Instant complete typewriter line
    d.currentText = d.fullText;
    d.charIdx = d.fullText.length;
    d.done = true;
    for (const pos in sceneState.activeHeads) {
      sceneState.activeHeads[pos].mouthShape = 'rest';
    }
  } else if (d && d.done) {
    // Jump forward in timeline to next event
    const nextEv = sceneState.events.find(ev => ev.t > sceneState.t);
    if (nextEv) {
      sceneState.t = nextEv.t - 0.01;
    }
  }
}

async function startScene(sceneId = 'intro_test') {
  initSceneDOM();
  const wrap = document.getElementById('sceneWrap');
  if (wrap) wrap.style.display = 'flex';

  let sceneData = INTRO_TEST_SCENE;
  try {
    const res = await fetch('/assets/scenes/' + sceneId + '/scene.json');
    if (res.ok) sceneData = await res.json();
  } catch (e) {
    console.warn('Using embedded scene data:', e);
  }

  await preloadSceneAssets(sceneData);

  sceneState.active = true;
  sceneState.id = sceneId;
  sceneState.t = 0;
  sceneState.lastFrameT = performance.now();
  sceneState.events = sceneData.events.sort((a, b) => a.t - b.t);
  sceneState.eventIdx = 0;
  sceneState.bgImg = null;
  sceneState.bgFade = 1.0;
  sceneState.bgCutStatic = 0;
  sceneState.title = null;
  sceneState.sprites = [];
  sceneState.activeHeads = {};
  sceneState.dialogue = null;

  if (sceneState.rafId) cancelAnimationFrame(sceneState.rafId);
  sceneState.rafId = requestAnimationFrame(sceneTick);
}

function stopScene() {
  sceneState.active = false;
  if (sceneState.rafId) cancelAnimationFrame(sceneState.rafId);
  const wrap = document.getElementById('sceneWrap');
  if (wrap) wrap.style.display = 'none';

  // Return to game menu
  if (typeof openMenu === 'function') openMenu();
  else if (typeof showMainMenu === 'function') showMainMenu();
}

function sceneTick(now) {
  if (!sceneState.active) return;
  const dt = Math.min(0.08, (now - sceneState.lastFrameT) / 1000);
  sceneState.lastFrameT = now;
  sceneState.t += dt;

  // Process timeline events
  while (sceneState.eventIdx < sceneState.events.length && sceneState.events[sceneState.eventIdx].t <= sceneState.t) {
    const ev = sceneState.events[sceneState.eventIdx++];
    handleSceneEvent(ev);
  }

  // Update animated elements
  updateSceneElements(dt);

  // Render 320x200 canvas
  renderSceneFrame();

  sceneState.rafId = requestAnimationFrame(sceneTick);
}

function handleSceneEvent(ev) {
  const base = '/assets/scenes/' + sceneState.id + '/';
  if (ev.do === 'bg') {
    sceneState.bgImg = sceneState.images[base + ev.img] || null;
    if (ev.cut === 'static') {
      sceneState.bgCutStatic = 0.22; // static noise burst duration
      playSceneBlip(120);
    } else {
      sceneState.bgFade = 0.0;
      sceneState.bgFadeT = ev.fade || 0.6;
    }
  } else if (ev.do === 'title') {
    sceneState.title = { text: ev.text, sub: ev.sub, dur: ev.dur || 3.0, t: 0 };
  } else if (ev.do === 'sprite') {
    sceneState.sprites.push({
      id: ev.id,
      img: sceneState.images[base + ev.img] || null,
      from: ev.from,
      to: ev.to,
      dur: ev.dur || 3.0,
      ease: ev.ease || 'linear',
      t: 0
    });
  } else if (ev.do === 'head') {
    const pos = ev.pos || 'left';
    sceneState.activeHeads[pos] = {
      charId: ev.char,
      eyeState: 'open',
      mouthShape: 'rest',
      blinkT: 2.0 + Math.random() * 2.5,
      blinkPhase: 0,
    };
  } else if (ev.do === 'say') {
    const headObj = Object.values(sceneState.activeHeads).find(h => h.charId === ev.who);
    sceneState.dialogue = {
      who: ev.who,
      fullText: ev.text,
      currentText: '',
      cps: ev.cps || 28,
      timer: 0,
      charIdx: 0,
      done: false,
      waitT: 0,
    };
  } else if (ev.do === 'end') {
    stopScene();
  }
}

function updateSceneElements(dt) {
  // Static burst
  if (sceneState.bgCutStatic > 0) {
    sceneState.bgCutStatic -= dt;
  }

  // Fade
  if (sceneState.bgFade < 1.0) {
    sceneState.bgFade = Math.min(1.0, sceneState.bgFade + dt / (sceneState.bgFadeT || 0.6));
  }

  // Title
  if (sceneState.title) {
    sceneState.title.t += dt;
    if (sceneState.title.t >= sceneState.title.dur) sceneState.title = null;
  }

  // Sprites
  for (let i = sceneState.sprites.length - 1; i >= 0; i--) {
    const sp = sceneState.sprites[i];
    sp.t += dt;
    if (sp.t >= sp.dur) sceneState.sprites.splice(i, 1);
  }

  // Head blinks
  for (const pos in sceneState.activeHeads) {
    const h = sceneState.activeHeads[pos];
    h.blinkT -= dt;
    if (h.blinkT <= 0) {
      if (h.blinkPhase === 0) {
        h.eyeState = 'half';
        h.blinkPhase = 1;
        h.blinkT = 0.05;
      } else if (h.blinkPhase === 1) {
        h.eyeState = 'closed';
        h.blinkPhase = 2;
        h.blinkT = 0.09;
      } else if (h.blinkPhase === 2) {
        h.eyeState = 'half';
        h.blinkPhase = 3;
        h.blinkT = 0.05;
      } else {
        h.eyeState = 'open';
        h.blinkPhase = 0;
        h.blinkT = 2.5 + Math.random() * 3.0;
      }
    }
  }

  // Typewriter dialogue & lip-sync
  const d = sceneState.dialogue;
  if (d && !d.done) {
    d.timer += dt;
    const charsTarget = Math.floor(d.timer * d.cps);
    if (charsTarget > d.charIdx) {
      d.charIdx = Math.min(d.fullText.length, charsTarget);
      d.currentText = d.fullText.slice(0, d.charIdx);
      const ch = d.fullText[d.charIdx - 1];
      
      // Update mouth phoneme on speaking head
      const speakerHead = Object.values(sceneState.activeHeads).find(h => h.charId === d.who);
      if (speakerHead) {
        speakerHead.mouthShape = getMouthFromChar(ch);
      }

      // Voice audio chatter blip
      if (d.charIdx % 2 === 0 && ch !== ' ') {
        const freq = d.who === 'imani' ? 190 : d.who === 'hawk' ? 300 : 250;
        playSceneBlip(freq);
      }

      if (d.charIdx >= d.fullText.length) {
        d.done = true;
        if (speakerHead) speakerHead.mouthShape = 'rest';
      }
    }
  }
}

function renderSceneFrame() {
  const cv = document.getElementById('sceneCv');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Clear
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, SCENE_CANVAS_W, SCENE_CANVAS_H);

  // Background
  if (sceneState.bgImg) {
    if (sceneState.bgFade < 1.0) {
      ctx.globalAlpha = sceneState.bgFade;
      ctx.drawImage(sceneState.bgImg, 0, 0, SCENE_CANVAS_W, SCENE_CANVAS_H);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.drawImage(sceneState.bgImg, 0, 0, SCENE_CANVAS_W, SCENE_CANVAS_H);
    }
  }

  // Static burst cut effect
  if (sceneState.bgCutStatic > 0) {
    const imgData = ctx.createImageData(SCENE_CANVAS_W, SCENE_CANVAS_H);
    const buf = imgData.data;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      buf[i] = v > 180 ? 220 : 20;
      buf[i + 1] = v > 150 ? 240 : 24;
      buf[i + 2] = v > 120 ? 255 : 36;
      buf[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Moving Sprites (Kestrel, Halberd)
  for (const sp of sceneState.sprites) {
    if (!sp.img) continue;
    let k = Math.min(1.0, sp.t / sp.dur);
    if (sp.ease === 'in') k = k * k;
    else if (sp.ease === 'inout') k = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

    const x = sp.from.x + (sp.to.x - sp.from.x) * k;
    const y = sp.from.y + (sp.to.y - sp.from.y) * k;
    const scale = sp.from.scale + (sp.to.scale - sp.from.scale) * k;

    const sw = Math.round(sp.img.width * scale);
    const sh = Math.round(sp.img.height * scale);
    ctx.drawImage(sp.img, Math.round(x - sw / 2), Math.round(y - sh / 2), sw, sh);
  }

  // Talking Heads
  for (const pos in sceneState.activeHeads) {
    const h = sceneState.activeHeads[pos];
    const headRes = sceneState.heads[h.charId];
    if (!headRes) continue;

    const hx = pos === 'left' ? 24 : pos === 'right' ? 232 : 128;
    const hy = 44;

    // Head base
    if (headRes.base) ctx.drawImage(headRes.base, hx, hy);

    // Eye overlay
    const eyeImg = headRes.eyes[h.eyeState] || headRes.eyes['open'];
    if (eyeImg) ctx.drawImage(eyeImg, hx, hy);

    // Mouth overlay
    const mouthImg = headRes.mouth[h.mouthShape] || headRes.mouth['rest'];
    if (mouthImg) ctx.drawImage(mouthImg, hx, hy);
  }

  // Lower Letterbox & Dialogue Box (Origin style)
  if (sceneState.dialogue) {
    const d = sceneState.dialogue;

    // Lower letterbox frame
    ctx.fillStyle = 'rgba(6, 12, 18, 0.94)';
    ctx.fillRect(16, 138, 288, 54);
    ctx.strokeStyle = '#325264';
    ctx.lineWidth = 1;
    ctx.strokeRect(16.5, 138.5, 287, 53);

    // Header label (Speaker name)
    const speakerName = (d.who === 'imani' ? 'CDR. IMANI' : d.who === 'hawk' ? 'LT. OKAFOR [HAWK]' : 'LT. TOM CAT [MEOW]');
    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#ffb830';
    ctx.fillText(speakerName, 26, 152);

    // Dialogue text (typewriter)
    ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#d8f4ff';

    // Word wrap 2 lines
    const words = d.currentText.split(' ');
    let line1 = '', line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).length <= 38) line1 += (line1 ? ' ' : '') + w;
      else line2 += (line2 ? ' ' : '') + w;
    }

    ctx.fillText(line1, 26, 168);
    if (line2) ctx.fillText(line2, 26, 182);

    // Blinking prompt chevron when done
    if (d.done && Math.floor(sceneState.t * 3) % 2 === 0) {
      ctx.fillStyle = '#7fe0b0';
      ctx.fillText('▼', 290, 182);
    }
  }

  // Title Card Overlay
  if (sceneState.title) {
    const ti = sceneState.title;
    ctx.fillStyle = 'rgba(0, 4, 8, 0.72)';
    ctx.fillRect(20, 70, 280, 60);
    ctx.strokeStyle = '#c48a28';
    ctx.lineWidth = 1;
    ctx.strokeRect(20.5, 70.5, 279, 59);

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#ffd060';
    ctx.fillText(ti.text, 160, 96);

    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#7fe0c0';
    ctx.fillText(ti.sub, 160, 114);
    ctx.textAlign = 'start';
  }
}

// Global hooks
if (typeof globalThis !== 'undefined') {
  globalThis.startScene = startScene;
  globalThis.stopScene = stopScene;
  globalThis.sceneState = sceneState;
  if (globalThis.__game) {
    globalThis.__game.startScene = startScene;
    globalThis.__game.stopScene = stopScene;
    globalThis.__game.sceneState = sceneState;
  }
}

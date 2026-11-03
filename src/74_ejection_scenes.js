// Ejection outcome presentation. The authored shot list is JSON; no game state
// is decided here. Existing proposal sheets are reused, adding no new images.
const EJSCENE = {active:false, kind:null, shots:[], index:0, elapsed:0, el:null, data:null, ticket:0};
function ejectionSceneActive() { return !!EJSCENE.active; }
function ejectionSceneEnabled() { return !!TUNE.cutscenes?.enabled && !params.has('nocut'); }
function ejectionSceneSkip() {
  EJSCENE.ticket++; EJSCENE.active=false; EJSCENE.kind=null;
  if (EJSCENE.el) EJSCENE.el.style.display='none';
}
function ejectionSceneMarkSeen(kind) { try { localStorage.setItem('gs_ejection_scene_'+kind,'1'); } catch (_) {} }
function ejectionSceneSeen(kind) { try { return localStorage.getItem('gs_ejection_scene_'+kind)==='1'; } catch (_) { return false; } }
function ejectionSceneShowShot() {
  const shot=EJSCENE.shots[EJSCENE.index]; if (!shot) { ejectionSceneSkip(); return; }
  const [x,y]=shot.panel, art=EJSCENE.el.querySelector('.ejs-art'), portrait=EJSCENE.el.querySelector('.ejs-portrait');
  art.style.backgroundPosition=`${x*100/3}% ${y*100/3}%`;
  art.style.animation='none'; void art.offsetWidth;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) art.style.animation=`ejs-pan ${shot.seconds}s ease-in-out both`;
  const portraits={player:['assets/proposals/cast-pilots.png','0% 0%'],commander:['assets/proposals/cast-sar-frogg.png','0% 50%'],soldier:['assets/proposals/cast-sar-frogg.png','0% 100%']};
  const spec=portraits[shot.portrait]; portrait.style.display=spec?'block':'none';
  if (spec) { portrait.style.backgroundImage=`url("${spec[0]}")`; portrait.style.backgroundPosition=spec[1]; }
  EJSCENE.el.querySelector('.ejs-caption').textContent=shot.caption;
  if (shot.sfx) sfx(shot.sfx); EJSCENE.elapsed=0;
}
async function playEjectionSequence(kind) {
  if (!ejectionSceneEnabled() || (TUNE.cutscenes.autoSkipRepeat && ejectionSceneSeen(kind))) return false;
  const ticket=++EJSCENE.ticket; EJSCENE.active=true; EJSCENE.kind=kind; EJSCENE.shots=[]; EJSCENE.index=0; EJSCENE.elapsed=0;
  if (!EJSCENE.el) {
    const el=document.createElement('section');el.id='ejectionScene';el.setAttribute('aria-label','Ejection sequence');
    el.style.cssText='position:fixed;inset:0;z-index:50;background:#000;display:flex;align-items:center;justify-content:center;touch-action:manipulation';
    el.innerHTML='<style>@keyframes ejs-pan{from{transform:scale(1)}to{transform:scale(1.06)}}@media(prefers-reduced-motion:reduce){.ejs-art{animation:none!important}}</style><div style="position:relative;width:min(100vw,160vh);aspect-ratio:16/10;overflow:hidden;background:#101713"><div class="ejs-art" style="position:absolute;inset:0;background-image:url(assets/proposals/storyboard-thumbnails.png);background-size:400% 400%;filter:sepia(.35) hue-rotate(70deg) saturate(.7) brightness(.8)"></div><div class="ejs-portrait" style="position:absolute;left:2%;bottom:3%;width:18%;height:34%;background-size:200% 300%;border:2px solid #8bb4a4;display:none"></div><div class="ejs-caption" aria-live="polite" style="position:absolute;bottom:2%;left:21%;right:2%;background:#07100eee;color:#f2ead4;padding:8px;font:600 clamp(12px,2.2vw,20px)/1.3 monospace"></div><button class="ejs-skip" style="position:absolute;top:2%;right:2%;padding:10px;background:#111;color:#fff;border:1px solid #9dc;font:14px monospace">SKIP</button></div>';
    el.querySelector('.ejs-skip').onclick=e=>{e.stopPropagation();ejectionSceneSkip();};el.onclick=()=>ejectionSceneSkip();document.body.appendChild(el);EJSCENE.el=el;
  }
  EJSCENE.el.style.display='flex'; EJSCENE.el.querySelector('.ejs-caption').textContent='Preparing transmission…';
  try {
    if (!EJSCENE.data) { const response=await fetch('assets/scenes/ejection/shots.json'); if(!response.ok) throw Error('shot list unavailable'); EJSCENE.data=await response.json(); }
    if (ticket!==EJSCENE.ticket) return false;
    const shots=EJSCENE.data[kind];
    if (!Array.isArray(shots) || !shots.length || shots.some(s=>!Array.isArray(s.panel)||s.panel.length!==2||s.panel.some(n=>!Number.isInteger(n)||n<0||n>3)||typeof s.caption!=='string'||!(s.seconds>0))) throw Error('invalid shot list');
    EJSCENE.shots=shots;EJSCENE.index=0;ejectionSceneMarkSeen(kind);ejectionSceneShowShot();return true;
  } catch (_) { if(ticket===EJSCENE.ticket)ejectionSceneSkip(); return false; }
}
function ejectionSceneTick(dt) {
  if (!EJSCENE.active || !EJSCENE.shots[EJSCENE.index]) return;
  EJSCENE.elapsed+=dt; if (EJSCENE.elapsed>=EJSCENE.shots[EJSCENE.index].seconds) { EJSCENE.index++;ejectionSceneShowShot(); }
}
addEventListener('keydown',e=>{if(EJSCENE.active && (e.code==='Escape'||e.code==='Space'||e.code==='Enter')){e.preventDefault();e.stopImmediatePropagation();ejectionSceneSkip();}},true);

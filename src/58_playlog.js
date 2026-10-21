// ---- play log: counters + 1 Hz samples, so "why do I take no damage" is answerable from data ---------------
// Key L downloads the JSON. A short summary is also kept in localStorage ('gs_plog').
const PLOG = { t0: Date.now(), mission: '', cnt: {}, samples: [], events: [] };
function plogN(k, v = 1) { PLOG.cnt[k] = (PLOG.cnt[k] || 0) + v; }
function plogShot(s) { plogN('shots.' + (s === player ? 'player' : s.team === 0 ? 'ally' : 'enemy')); }
function plogHold(s) { if (s !== player) plogN('hold.' + (s.team === 0 ? 'ally' : 'enemy')); }
function plogTry(s) { if (s !== player) plogN('try.' + (s.team === 0 ? 'ally' : 'enemy')); }
function plogBoltHit(b, s, dmg, fr) {
  const o = b.owner === player ? 'player' : b.team === 0 ? 'ally' : 'enemy';
  const tg = s === player ? 'player' : s.team === 0 ? 'ally' : 'enemy';
  plogN(`hit.${o}>${tg}`); plogN(`dmg.${o}>${tg}`, dmg);
}
function plogReset(label) { PLOG.cnt = {}; PLOG.samples.length = 0; PLOG.events.length = 0; PLOG.mission = label || ''; PLOG.t0 = Date.now(); PLOG.acc = 0; }
function plogEvent(e) { if (PLOG.events.length < 400) PLOG.events.push({ t: +(time || 0).toFixed(1), e }); }
let _plogAcc = 0;
function plogTick(dt) {
  _plogAcc += dt; if (_plogAcc < 1.0) return; _plogAcc = 0;
  if (!player || PLOG.samples.length > 3600) return;
  let near = 1e9, nEn = 0, aim = 0;
  for (const s of ships) {
    if (!s.alive || s.team === player.team) continue;
    nEn++;
    const d = s.group.position.distanceTo(player.group.position);
    if (d < near) near = d;
    if (d < 900) { const v = _w1.set(0, 0, -1).applyQuaternion(s.group.quaternion), r = _w2.copy(player.group.position).sub(s.group.position).normalize(); if (v.dot(r) > 0.97) aim++; }
  }
  PLOG.samples.push({ t: +time.toFixed(0), hull: +(player.structure ?? 0).toFixed(0), sh: Math.round((player.shield.fore + player.shield.aft) | 0), en: nEn, near: Math.round(near), aimed: aim });
}
function plogSummary() { return { mission: PLOG.mission, mins: +((Date.now() - PLOG.t0) / 60000).toFixed(1), cnt: PLOG.cnt, samples: PLOG.samples.length }; }
function plogSave() { try { localStorage.setItem('gs_plog', JSON.stringify(plogSummary())); } catch (e) {} }
function plogDownload() {
  plogSave();
  const blob = new Blob([JSON.stringify({ summary: plogSummary(), samples: PLOG.samples, events: PLOG.events }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-space-playlog.json'; a.click();
}
setInterval(plogSave, 15000);

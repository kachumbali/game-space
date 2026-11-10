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
function plogReset(label) { if (Object.keys(PLOG.cnt).length) PLOG.prev = plogSummary(); PLOG.cnt = {}; PLOG.samples.length = 0; PLOG.events.length = 0; PLOG.mission = label || ''; PLOG.t0 = Date.now(); _plogAcc = 0; reportReset(); }
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
  const blob = new Blob([JSON.stringify({ summary: plogSummary(), previousRun: PLOG.prev || null, samples: PLOG.samples, events: PLOG.events }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'claude-space-commander-playlog.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
setInterval(plogSave, 15000);

// Session report counters are separate from the diagnostic play log. Reset on each sortie.
const REPORT = { logs: [], weapons: {}, missiles: {fired: 0, hit: 0, decoyed: 0}, damage: {}, tutorial: [], elapsed: 0, shield: null, hull: null, frameSum: 0, frameCount: 0, frameWorst: 0, wing: {}, lost: {}, lost: {}, note: '', savedId: null, savedResult: null, lastControls: null, lastFlight: null };
function reportReset() { Object.assign(REPORT, {logs: [], weapons: {}, missiles: {fired: 0, hit: 0, decoyed: 0}, damage: {}, tutorial: [], elapsed: 0, shield: null, hull: null, frameSum: 0, frameCount: 0, frameWorst: 0, wing: {}, note: '', savedId: null, savedResult: null, lastControls: null, lastFlight: null}); }
function reportLog(line) { REPORT.logs.push(String(line)); if (REPORT.logs.length > 20) REPORT.logs.shift(); }
function reportWeapon(id, field) { const w = REPORT.weapons[id] ||= {shots: 0, hits: 0}; w[field]++; }
function reportTick(dt) {
  if (state !== 'play' || !player) return;
  REPORT.elapsed += dt / SIM_SPEED;
  REPORT.lastControls = controlsMode; REPORT.lastFlight = flightMode;
  for (const s of ships) if (s.team === 0 && s !== player && s.pilot) REPORT.wing[s.callsign || s.pilot] = s.alive && !s.dying ? 'active' : 'lost';
  reportSample();
}
function reportSample() {
  if (!player) return;
  // percentages of the ship's own maximum (owner report 2026-11-10: raw points read as "hull 50" on an undamaged Kestrel)
  const shMax = Math.max(1, (player.def.shield?.fore || 0) + (player.def.shield?.aft || 0)), sh = 100 * (player.shield.fore + player.shield.aft) / shMax;
  const hull = 100 * Math.max(0, player.structure) / Math.max(1, player.def.structure);
  REPORT.shield = Math.min(REPORT.shield ?? sh, sh); REPORT.hull = Math.min(REPORT.hull ?? hull, hull);
  for (const c of player.comps || []) if (c.hp <= 0) REPORT.lost[c.id] = 1;   // remembered: the debrief may run after a respawn or reset
}
function reportFrame(ms) { if (state === 'play' && !userPause && !optsOpen && !rdlgOpen && !globalThis.__paused) { REPORT.frameSum += ms; REPORT.frameCount++; REPORT.frameWorst = Math.max(REPORT.frameWorst, ms); } }
function reportText(result = 'in progress', note = '') {
  const p = player, m = game.mission, S = game.mstate;
  const entries = o => Object.entries(o).map(([k,v]) => `${k}: ${typeof v === 'number' ? Math.round(v) : v}`).join(', ') || 'none';
  const wing = entries(REPORT.wing) || 'none recorded';
  const lost = Object.keys({...(REPORT.lost || {}), ...Object.fromEntries((p?.comps || []).filter(c => c.hp <= 0).map(c => [c.id, 1]))}).join(', ') || 'none';
  const weapons = Object.entries(REPORT.weapons).map(([id,w]) => `${id} ${w.shots}/${w.hits}`).join(', ') || 'none';
  const frame = REPORT.frameCount ? `${(REPORT.frameSum / REPORT.frameCount).toFixed(1)} / ${REPORT.frameWorst.toFixed(1)} ms` : 'not recorded';
  const lines = [
    `SPACE COMMANDER REPORT · v${GAME_VERSION} · build ${BUILD_ID}`,
    `Device: ${isTouch ? 'touch' : 'desktop'} · ${innerWidth}x${innerHeight}`,
    `Campaign / mission: ${m ? campaignOf(m).id + ' / ' + m.id : game.mode}`,
    `Difficulty: ${game.mode === 'survival' ? sv?.cfg?.diff : game.mode === 'skirmish' ? game.sk?.skill || 'skirmish settings' : diffName} · Flight: ${REPORT.lastFlight || flightMode} · Controls: ${REPORT.lastControls || controlsMode}`,
    `Result: ${result} · Time flown: ${Math.floor(REPORT.elapsed / 60)}:${String(Math.floor(REPORT.elapsed % 60)).padStart(2,'0')}`,
    `Death cause: ${S?.playerDeathCause || 'not recorded'}`,
    `Kills: ${kills} (${entries(killLog)})`, `Weapons shots/hits: ${weapons}`,
    `Missiles fired/hit/decoyed: ${REPORT.missiles.fired}/${REPORT.missiles.hit}/${REPORT.missiles.decoyed}`,
    `Damage received by source class: ${entries(REPORT.damage)}`,
    `Lowest shield / hull: ${REPORT.shield === null ? 'not recorded' : Math.round(REPORT.shield) + '%'} / ${REPORT.hull === null ? 'not recorded' : Math.round(REPORT.hull) + '%'}`,
    `Subsystems lost: ${lost}`, `Wing: ${wing}`, `Tutorial: ${REPORT.tutorial.join(', ') || 'not shown'}`,
    `Frame time average / worst: ${frame}`, `What annoyed you: ${String(note).replace(/\s+/g, ' ').trim().slice(0, 1000) || '(none)'}`,
    'Last log lines:', ...REPORT.logs.map(x => String(x).replace(/\s+/g, ' '))
  ];
  return lines.join('\n');
}

// Install the same touch-accessible controls in the pause menu and each debrief.
function reportControls(host, result) {
  const box = document.createElement('div'); box.className = 'report-controls';
  box.innerHTML = '<label>WHAT ANNOYED YOU? (optional)<br><textarea rows="2" maxlength="1000" aria-label="What annoyed you?"></textarea></label><div><button type="button" class="report-copy">COPY REPORT</button> <button type="button" class="report-download">DOWNLOAD REPORT</button> <button type="button" class="report-history">EXPORT LAST 10</button></div><div class="report-status" role="status"></div>';
  const note = box.querySelector('textarea'); note.value = REPORT.note || '';
  note.addEventListener('keydown', e => e.stopPropagation());
  note.addEventListener('input', () => { REPORT.note = note.value; if (REPORT.savedId) reportArchive(REPORT.savedResult); });
  const text = () => reportText(typeof result === 'function' ? result() : result, REPORT.note || '');
  box.querySelector('.report-copy').onclick = async () => {
    try { if (!navigator.clipboard?.writeText) throw new Error('unavailable'); await navigator.clipboard.writeText(text()); box.querySelector('.report-status').textContent = 'Report copied.'; }
    catch (_) { box.querySelector('.report-status').textContent = 'Clipboard unavailable. Tap DOWNLOAD REPORT instead.'; }
  };
  box.querySelector('.report-download').onclick = () => reportDownload(text(), 'space-commander-report.txt');
  box.querySelector('.report-history').onclick = () => { const rows = reportHistory(); if (!rows.length) { box.querySelector('.report-status').textContent = 'No saved reports available.'; return; } reportDownload(rows.map(r => r.text).join('\n\n--- NEXT SESSION ---\n\n'), 'space-commander-reports.txt'); };
  host.appendChild(box); return box;
}
function reportDownload(text, name) {
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}

let reportSerial = 0;
function reportHistory() { try { const rows = JSON.parse(localStorage.getItem('gs_reports') || '[]'); return Array.isArray(rows) ? rows.filter(r => r && typeof r.text === 'string').slice(0, 10) : []; } catch (_) { return []; } }
function reportArchive(result) {
  if (!REPORT.savedId) REPORT.savedId = Date.now().toString(36) + '-' + (++reportSerial);
  REPORT.savedResult = result;
  const row = {id: REPORT.savedId, text: reportText(result, REPORT.note)};
  const rows = [row, ...reportHistory().filter(r => r.id !== row.id)].slice(0, 10);
  try { localStorage.setItem('gs_reports', JSON.stringify(rows)); return true; } catch (_) { return false; }
}

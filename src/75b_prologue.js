// Prologue progress survives a reload; only victories mark a mission complete.
const PROLOGUE_KEY = 'gs_prologue_progress';
let prologueProgress = (() => {
  try { const p = JSON.parse(localStorage.getItem(PROLOGUE_KEY) || '{}'); return {wins: p.wins && typeof p.wins === 'object' ? p.wins : {}}; }
  catch (_) { return {wins: {}}; }
})();
function prologueSave() { try { localStorage.setItem(PROLOGUE_KEY, JSON.stringify(prologueProgress)); } catch (_) {} }
let prologueSession = {sorties: 0, wins: 0, kills: 0, seconds: 0};
function prologueReset() { prologueProgress = {wins: {}}; prologueSession = {sorties: 0, wins: 0, kills: 0, seconds: 0}; prologueSave(); try { localStorage.removeItem('gs_prologue_snap'); } catch (_) {} }
function prologueNextIndex() { return PROLOGUE_MISSIONS.findIndex(m => !prologueProgress.wins[m.id]); }
function prologueComplete() { return prologueNextIndex() < 0; }
function prologueUnlocked() { return !!prologueProgress.wins.p04; }
function prologueSessionRecord(M, S, result) {
  if (!PROLOGUE_MISSIONS.includes(M) || !S || S.flowCounted) return;
  S.flowCounted = true; prologueSession.sorties++; if (result === 'win') prologueSession.wins++;
  prologueSession.kills += kills; prologueSession.seconds += Math.max(0, S.t || 0);
}
// Owner decision 2026-11-11 (option B): in the Prologue a pilot lost in a sortie that is flown again comes back; losses only become permanent
// when the player moves on (wins the mission, or starts a different one). The wing as it stood at launch is kept across reloads and menus.
const PROLOGUE_SNAP_KEY = 'gs_prologue_snap';
function prologueRetryRestore(M) {
  if (!PROLOGUE_MISSIONS.includes(M)) return;
  try {
    const snap = JSON.parse(localStorage.getItem(PROLOGUE_SNAP_KEY) || 'null');
    if (snap && snap.id === M.id) {
      if (snap.crew) { CREW = snap.crew; saveCrew(); }
      if (rosterEnabled() && snap.roster) { rosterState = snap.roster; rosterSave(); }
    }
    localStorage.setItem(PROLOGUE_SNAP_KEY, JSON.stringify({ id: M.id, crew: CREW, roster: rosterEnabled() ? rosterLoad() : null }));
  } catch (_) {}
}
function prologueRetryClear(M) { try { const snap = JSON.parse(localStorage.getItem(PROLOGUE_SNAP_KEY) || 'null'); if (snap && snap.id === M.id) localStorage.removeItem(PROLOGUE_SNAP_KEY); } catch (_) {} }
function prologueRecord(M, S) {
  prologueSessionRecord(M, S, S.result);
  if (PROLOGUE_MISSIONS.includes(M) && S.result === 'win') prologueRetryClear(M);
  if (!PROLOGUE_MISSIONS.includes(M) || S.result !== 'win' || prologueProgress.wins[M.id]) return;
  prologueProgress.wins[M.id] = {kills, seconds: Math.max(0, S.t || 0)}; prologueSave();
}

function prologueEndingText() {
  const base = typeof reportText === 'function' ? reportText('win', typeof REPORT !== 'undefined' ? REPORT.note : '') :
    `${GAME_TITLE} v${GAME_VERSION}\nPrologue mission p04: win\nMission kills: ${kills}\nMission time: ${Math.floor(game.mstate?.t || 0)} s`;
  return base + `\nPrologue session: ${prologueSession.sorties} sorties, ${prologueSession.wins} victories, ${prologueSession.kills} kills, ${Math.floor(prologueSession.seconds)} sim seconds`;
}
function showPrologueEnding() {
  menuView = 'debrief';
  const t = prologueSession;
  menuShell(`<div class="sub">UNCHARTED VANGUARD · PROLOGUE</div><h1>TO BE CONTINUED</h1><h2>Eagle Flight will return.</h2><div class="sub">THIS SESSION</div><p>Sorties <b>${t.sorties}</b> · Victories <b>${t.wins}</b> · Kills <b>${t.kills}</b> · Flight time <b>${Math.floor(t.seconds / 60)}:${String(Math.floor(t.seconds % 60)).padStart(2,'0')}</b></p><div class="btns"><button id="ending_copy">COPY REPORT</button><button class="alt" id="ending_download">DOWNLOAD REPORT</button><button class="alt" id="ending_menu">MAIN MENU</button></div><div id="ending_status" role="status"></div>`, 'ending');
  $id('ending_copy').onclick = async () => { try { if (!navigator.clipboard?.writeText) throw Error('unavailable'); await navigator.clipboard.writeText(prologueEndingText()); $id('ending_status').textContent = 'Report copied.'; } catch (_) { $id('ending_status').textContent = 'Clipboard unavailable. Use DOWNLOAD REPORT.'; } };
  $id('ending_download').onclick = () => { const u = URL.createObjectURL(new Blob([prologueEndingText()], {type:'text/plain;charset=utf-8'})); const a=document.createElement('a'); a.href=u; a.download='prologue-report.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),10000); };
  $id('ending_menu').onclick = () => openMenu();
  menuFocus('#ending_copy');
}

// Prologue progress survives a reload; only victories mark a mission complete.
const PROLOGUE_KEY = 'gs_prologue_progress';
let prologueProgress = (() => {
  try { const p = JSON.parse(localStorage.getItem(PROLOGUE_KEY) || '{}'); return {wins: p.wins && typeof p.wins === 'object' ? p.wins : {}}; }
  catch (_) { return {wins: {}}; }
})();
function prologueSave() { try { localStorage.setItem(PROLOGUE_KEY, JSON.stringify(prologueProgress)); } catch (_) {} }
function prologueReset() { prologueProgress = {wins: {}}; prologueSave(); }
function prologueNextIndex() { return PROLOGUE_MISSIONS.findIndex(m => !prologueProgress.wins[m.id]); }
function prologueComplete() { return prologueNextIndex() < 0; }
function prologueRecord(M, S) {
  if (!PROLOGUE_MISSIONS.includes(M) || S.result !== 'win' || prologueProgress.wins[M.id]) return;
  prologueProgress.wins[M.id] = {kills, seconds: Math.max(0, S.t || 0)}; prologueSave();
}

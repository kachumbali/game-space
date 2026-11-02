// Pre-sortie ordnance stations (docs/ORDNANCE_MANIFEST.md). Hulls declare `hardpoints` in data/db.json: id, size (S/M/L/XL), cap (rounds) and
// an `allow` list of missile/torpedo ids (first = authored default). The briefing cycles each station through its allowed ordnance or EMPTY;
// the sum per weapon is written to player.stores at LAUNCH. The AI keeps the authored `stores`. Flares/drones and other non-missile stores are untouched.
const ORD_SEL = {};                                           // shipId -> { stationId: weaponId | '' } (survives briefing redraws and restarts)
function ordnanceStations(shipId) { return SHIPS[shipId]?.hardpoints || []; }
function ordnanceChoice(shipId, st) {
  const sel = ORD_SEL[shipId]?.[st.id];
  return sel === undefined ? st.allow[0] : sel;
}
function ordnanceCycle(shipId, st) {
  const opts = [...st.allow, ''], cur = opts.indexOf(ordnanceChoice(shipId, st));
  (ORD_SEL[shipId] ??= {})[st.id] = opts[(cur + 1) % opts.length];
}
function ordnanceTotals(shipId) {                             // weapon id -> rounds, for the stations only
  const tot = {};
  for (const st of ordnanceStations(shipId)) { const w = ordnanceChoice(shipId, st); if (w) tot[w] = (tot[w] || 0) + st.cap; }
  return tot;
}
function ordnanceApply(p) {                                   // called at LAUNCH for the player ship
  const hp = p && ordnanceStations(p.def.id);
  if (!hp || !hp.length) return;
  const touched = new Set(hp.flatMap(st => st.allow)), tot = ordnanceTotals(p.def.id);
  for (const w of touched) p.stores[w] = tot[w] || 0;
}
function ordnanceBriefing(shipId) {
  const hp = ordnanceStations(shipId);
  if (!hp.length) return '';
  const tot = ordnanceTotals(shipId);
  const rows = hp.map(st => {
    const w = ordnanceChoice(shipId, st), def = st.allow[0];
    return `<button type="button" data-station="${st.id}" class="alt">${st.id} · ${st.size} · ${w ? `${WEAPONS[w].name} × ${st.cap}` : 'EMPTY'}${w && w !== def ? ' · SWAPPED' : ''}${st.legacy ? ' · LEGACY FIT' : ''}</button>`;
  }).join('');
  const sum = Object.entries(tot).map(([w, n]) => `${WEAPONS[w].name} × ${n}`).join(' · ') || 'NONE';
  return `<div class="sub">ORDNANCE STATIONS</div><div class="dim">Tap a station to cycle its ordnance or leave it empty. Loaded: ${sum}. Flares and other stores are fixed.</div>${rows}`;
}
function bindOrdnanceBriefing(el, mission) {
  el.querySelectorAll('[data-station]').forEach(button => {
    button.onclick = () => {
      const shipId = mission.setup.player.ship || 'kestrel', st = ordnanceStations(shipId).find(x => x.id === button.dataset.station);
      if (st) ordnanceCycle(shipId, st);
      showBriefing(mission);
    };
  });
}

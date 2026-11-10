// Experimental carrier roster. All entry points are gated by tuning.roster.enabled.
const ROSTER_KEY = 'gs_roster_v1';
let rosterState = null;
let rosterReadOnly = false;
function rosterEnabled() { return !!TUNE.roster?.enabled; }
if (rosterEnabled()) document.getElementById('help').insertAdjacentHTML('beforeend', '<div class="legend">Briefing roster: tap or select ACTIVE pilots, or use AUTO-FILL. SERVICE RECORD lists ranks and citations.</div>');
function rosterEscape(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function rosterRank(p, cfg = TUNE.roster) {
  let best = cfg.ranks[0];
  for (const r of cfg.ranks) if (p.kills >= r.kills && p.missions >= r.missions && p.medals.length >= r.medals) best = r;
  return best;
}
function rosterSkill(p, cfg = TUNE.roster) {
  const rank = cfg.ranks.indexOf(rosterRank(p, cfg));
  return Math.max(1, Math.min(5, p.baseSkill + Math.floor(rank / cfg.skillEveryRanks)));
}
function rosterNewPilot(id, i, isPlayer = false) {
  const first = ['Aven','Bren','Cira','Dalen','Eris','Ferin','Galen','Hira','Iven','Jora','Kelan','Lira','Maren','Neris','Orin','Pera','Quin','Riva','Selen','Tarin','Ulen','Vira','Wren','Yara'];
  const last = ['Venn','Korr','Derran','Sorel','Varek','Meren','Tavik','Rellan','Korin','Saven','Darik','Vell','Toren','Mavik','Renn','Sorin','Valen','Kerin','Davor','Tirren','Serek','Voran','Kelan','Merik'];
  return {id, callsign:isPlayer ? rosterDef('player').callsign : `PILOT-${String(i+1).padStart(2,'0')}`, name:isPlayer ? rosterDef('player').name : `${first[i%first.length]} ${last[(i*7+3)%last.length]}`, rank:'ensign', skill:3, baseSkill:3, kills:0, missions:0, medals:[], status:'ACTIVE', traits:[], recoveryLeft:0};
}
// Owner hand-play 2026-11-10: the Prologue wing showed up as PILOT-02 / PILOT-03. The story pilots (HAWK, SPARROW: PILOT_DEFS, the briefings and
// comms lines name them) take the first two seats of every carrier pool; a seat keeps its record, only the generic name is replaced.
// PILOT_DEFS lives in 75_mission.js; the unit test evaluates this file alone, so fall back to the callsigns only.
const rosterDef = id => (typeof PILOT_DEFS !== 'undefined' && PILOT_DEFS[id]) || { callsign: id === 'player' ? 'MEOW' : id.toUpperCase(), name: id === 'player' ? 'MEOW' : id.toUpperCase() };
function rosterStoryWing(pool) {
  ['hawk', 'sparrow'].forEach((id, i) => {
    const p = pool[i]; if (!p || pool.some(x => x.callsign === id.toUpperCase())) return;
    if (/^PILOT-\d+$/.test(p.callsign)) { p.callsign = rosterDef(id).callsign; p.name = rosterDef(id).name; }
  });
}
function rosterLoad() {
  if (rosterState) return rosterState;
  let data = null; try { data = JSON.parse(localStorage.getItem(ROSTER_KEY) || 'null'); } catch (_) {}
  if (data && Number(data.version)>TUNE.roster.version) { rosterReadOnly=true; data=null; }
  if (!data || !data.pools || !data.player) {
    data = {version:TUNE.roster.version, pools:{}, player:rosterNewPilot('player',23,true), legacyImported:false};
    if (typeof CREW !== 'undefined' && CREW.player) rosterImportLegacy(data.player,CREW.player,3);
  } else data.version=TUNE.roster.version;
  const normalise = p => {
    const base=rosterNewPilot(p?.id || 'player',0,p?.id==='player');
    const out={...base,...(p || {})};
    out.kills=Math.max(0,Number(out.kills)||0); out.missions=Math.max(0,Number(out.missions)||0);
    out.medals=Array.isArray(out.medals)?out.medals.filter(x=>x && typeof x.id==='string'):[];
    out.status=['ACTIVE','RECOVERING','KIA','MIA','CAPTURED'].includes(out.status)?out.status:'ACTIVE';
    out.baseSkill=Math.max(1,Math.min(5,Number(out.baseSkill)||3));out.recoveryLeft=Math.max(0,Number(out.recoveryLeft)||0);
    return out;
  };
  data.player=normalise(data.player);
  if (data.player.callsign === 'ECHO') { data.player.callsign = rosterDef('player').callsign; data.player.name = rosterDef('player').name; }   // saves from before the pilot rename
  for (const k of Object.keys(data.pools)) { data.pools[k]=Array.isArray(data.pools[k])?data.pools[k].map(normalise):[]; rosterStoryWing(data.pools[k]); }
  rosterState = data; return data;
}
function rosterSave() { if (!rosterEnabled() || !rosterState || rosterReadOnly) return; try { localStorage.setItem(ROSTER_KEY, JSON.stringify(rosterState)); } catch (_) {} }
function rosterReset() { if (!rosterEnabled() || rosterReadOnly) return; rosterState=null; try { localStorage.removeItem(ROSTER_KEY); } catch (_) {} }
function rosterImportLegacy(p, old, baseSkill) {
  p.kills=Math.max(0,Number(old.kills)||0); p.missions=Math.max(0,Number(old.sorties)||0);p.baseSkill=baseSkill;
  const states={active:'ACTIVE',recovering:'RECOVERING',KIA:'KIA',missing:'MIA',captured:'CAPTURED'};
  p.status=states[old.status] || 'ACTIVE';p.recoveryLeft=p.status==='RECOVERING'?TUNE.roster.recoveryMissions:0;
  p.skill=rosterSkill(p);
}
function rosterCarrierKey(M) { return `${campaignOf(M).id}:${M.setup.anchor.id || M.setup.anchor.ship}`; }
function rosterForCarrier(key, shipId) {
  const state = rosterLoad();
  if (!state.pools[key]) {
    const capacity = SHIPS[shipId]?.rosterCapacity ?? TUNE.roster.defaultCapacity;
    state.pools[key] = Array.from({length:capacity}, (_,i)=>rosterNewPilot(`${key}:${i+1}`,i));
    rosterStoryWing(state.pools[key]);
    if (!state.legacyImported && typeof CREW !== 'undefined') {
      for (const [i,id] of ['hawk','sparrow'].entries()) if (state.pools[key][i] && CREW[id]) {
        rosterImportLegacy(state.pools[key][i],CREW[id],id==='hawk'?4:2);state.pools[key][i].callsign=id.toUpperCase();
      }
      state.legacyImported=true;
    }
    rosterSave();
  }
  return state.pools[key];
}
function rosterFind(id) {
  const state=rosterLoad(); if (id === 'player') return state.player;
  for (const pool of Object.values(state.pools)) { const p=pool.find(x=>x.id===id); if (p) return p; }
  return null;
}
// Scripted callsigns identify mission slots, never permanent speakers.
function rosterSlotShip(slot) {
  if (!rosterEnabled() || game.mode!=='mission' || !game.mstate) return null;
  const id=game.mstate.rosterSelected?.[slot];
  return id ? ships.find(s=>s.pilot===id && s.alive && !s.dying && !s.rescueCapsule) || null : null;
}
function rosterScriptCallsign(token) {
  if (!rosterEnabled() || game.mode!=='mission') return token;
  const key=String(token).toUpperCase();
  if (key==='ECHO' || key==='MEOW') return player?.callsign || 'PLAYER';
  if (key==='HAWK' || key==='SPARROW') return rosterSlotShip(key==='HAWK'?0:1)?.callsign || null;
  return token;
}
function rosterDialogueText(text) {
  if (!rosterEnabled() || game.mode!=='mission') return text;
  return String(text).replace(/\b(HAWK|SPARROW|MEOW|ECHO)\b/gi, word=>rosterScriptCallsign(word) || 'WINGMATE');
}
// The only runtime addition to a fixed pool is an explicit scripted arrival.
function rosterStoryArrival(key, pilot) {
  if (!rosterEnabled() || !pilot || typeof pilot.id!=='string' || rosterFind(pilot.id)) return false;
  const pool=rosterLoad().pools[key]; if (!pool) return false;
  const p={...rosterNewPilot(pilot.id,pool.length),...pilot};
  if (p.status!=='ACTIVE' || !Array.isArray(p.medals)) return false;
  pool.push(p); rosterSave(); return true;
}
function rosterAvailable(pool) { return pool.filter(p=>p.status==='ACTIVE'); }
function rosterSelect(pool, requested, slots) {
  const active=rosterAvailable(pool), byId=new Map(active.map(p=>[p.id,p])), out=[];
  for (const id of requested || []) if (byId.has(id) && !out.includes(id) && out.length<slots) out.push(id);
  return out;
}
function rosterAuto(pool, slots) { return rosterAvailable(pool).slice(0,slots).map(p=>p.id); }
function rosterTransition(p, status, cfg = TUNE.roster) {
  if (!p || !['ACTIVE','RECOVERING','KIA','MIA','CAPTURED'].includes(status) || p.status==='KIA') return false;
  if (p.status==='CAPTURED' && status==='RECOVERING') p.returnedFromCapture=true;
  p.status=status; p.recoveryLeft=status==='RECOVERING' ? cfg.recoveryMissions : 0; return true;
}
// One outcome policy for live player capsules and unresolved AI pilots.
// The game's seeded Math.random is the default; tests can supply a random source.
function rescueOutcomeRoll(ctx) {
  const cfg=ctx.cfg || TUNE.roster.aoRecovery, random=ctx.random || Math.random;
  const friendly=Math.max(0,ctx.friendly || 0), enemy=Math.max(0,ctx.enemy || 0);
  if (!friendly && !enemy) return 'MIA';
  if (!enemy) return random()<cfg.unopposedRecovery ? 'RECOVERING' : 'MIA';
  const proximity=Number.isFinite(ctx.nearestHostile) ? 1/(1+Math.max(0,ctx.nearestHostile)/cfg.hostileDistanceScale) : 0;
  const f=friendly*cfg.friendlyWeight + (ctx.rescuers || 0)*cfg.rescuerWeight + (ctx.sarEnRoute ? cfg.sarWeight : 0);
  const e=enemy*cfg.enemyWeight*(1+proximity*cfg.hostileProximityWeight);
  return random() < f/(f+e) ? 'RECOVERING' : 'CAPTURED';
}
function rosterResolveMissing(friendly, enemy, random = Math.random, cfg = TUNE.roster) {
  return rescueOutcomeRoll({friendly,enemy,random,cfg:cfg.aoRecovery});
}
function rosterUpdateAwards(p, facts, cfg = TUNE.roster) {
  const earned=[];
  for (const m of cfg.medals) {
    if (p.medals.some(x=>x.id===m.id)) continue;
    const yes = m.type==='kills' ? p.kills>=m.threshold : m.type==='mission' ? facts.result==='win' && facts.mission===m.mission : !!facts[m.type];
    if (yes) { const award={id:m.id,citation:m.citation}; p.medals.push(award); earned.push(award); }
  }
  const rank=rosterRank(p,cfg); p.rank=rank.id; p.skill=rosterSkill(p,cfg); return earned;
}
function rosterBegin(M) {
  if (!rosterEnabled()) return;
  const S=game.mstate, key=rosterCarrierKey(M), pool=rosterForCarrier(key,M.setup.anchor.ship);
  const primary=rosterLoad().player;
  S.rosterKey=key; S.rosterPlayer=primary.status==='ACTIVE' ? primary.id : (rosterAvailable(pool)[0]?.id || null);
  S.rosterSelected=rosterAuto(pool.filter(p=>p.id!==S.rosterPlayer),M.setup.wingmen.length);
  S.rosterParticipants=[S.rosterPlayer,...S.rosterSelected].filter(Boolean);
  S.rosterRecovering=[primary,...pool].filter(p=>p.status==='RECOVERING').map(p=>p.id);
  S.rosterAwards=[]; S.rosterFinished=false;
  game.rosterSnap=JSON.stringify(rosterLoad());
}
function rosterSpawnWing(M) {
  const S=game.mstate, pool=rosterForCarrier(S.rosterKey,M.setup.anchor.ship);
  for (const s of ships.filter(x=>x.rosterWing)) { s.alive=false; disposeShip(s); }
  ships=ships.filter(x=>!x.rosterWing);
  S.rosterSelected=rosterSelect(pool.filter(p=>p.id!==S.rosterPlayer),S.rosterSelected,M.setup.wingmen.length);
  S.rosterParticipants=[S.rosterPlayer,...S.rosterSelected].filter(Boolean);
  for (const [i,id] of S.rosterSelected.entries()) {
    const p=rosterFind(id), spec=M.setup.wingmen[i]; if (!p || !spec) continue;
    const s=makeShip(spec.ship,0,new THREE.Vector3(...spec.pos),new THREE.Quaternion(),{callsign:p.callsign,id:p.id,pilot:p.id,ai:'fighter',skill:p.skill});
    s.rosterWing=true; s.vel.set(0,0,-M.setup.player.speed); s.ai.aggr=0.9;
  }
}
function rosterMarkPilot(id,status) { if (!rosterEnabled()) return; const p=rosterFind(id); if (rosterTransition(p,status)) rosterSave(); }
function rosterFlagCapture(p) {
  const state=rosterLoad(); state.capturePending ||= [];
  if (!state.capturePending.some(x=>x.pilot===p.id && !x.resolved)) state.capturePending.push({pilot:p.id,mission:game.mission?.id || null,resolved:false});
}
function rosterOnRescue(pod,outcome,rescuer) {
  if (!rosterEnabled() || game.mode !== 'mission' || !pod.rescueCapsule?.pilot) return;
  const p=rosterFind(pod.rescueCapsule.pilot); if (!p) return;
  if (outcome==='mission ended before recovery') {
    rosterTransition(p,rescueOutcomeRoll(rescueOutcomeContext(pod)));
  } else rosterTransition(p,outcome==='recovered'?'RECOVERING':outcome==='captured'?'CAPTURED':outcome==='missing'?'MIA':'KIA');
  if (p.status==='CAPTURED') rosterFlagCapture(p);
  if (outcome==='recovered' && rescuer?.pilot) { const rp=rosterFind(rescuer.pilot); if(rp) rp.rescuedThisSortie=true; }
  rosterSave();
}
function rosterFinish(M,S) {
  if (!rosterEnabled() || S.rosterFinished) return; S.rosterFinished=true;
  for (const id of S.rosterRecovering || []) { const p=rosterFind(id); if(p?.status==='RECOVERING' && --p.recoveryLeft<=0) rosterTransition(p,'ACTIVE'); }
  for (const id of S.rosterParticipants || []) {
    const p=rosterFind(id); if (!p) continue;
    if (p.status==='MIA' && !(game.rescueLog || []).some(r=>r.pilot===id && r.outcome==='missing')) {
      const point=game.anchor || player;
      const ctx=point?.group ? rescueOutcomeContext(point) : {friendly:0,enemy:0};
      rosterTransition(p,rescueOutcomeRoll(ctx));
      if (p.status==='CAPTURED') rosterFlagCapture(p);
    }
    p.missions++;
    const ship=ships.find(s=>s.pilot===id && !s.rescueCapsule);
    const facts={result:S.result,mission:M.id,wounded:!!p.woundedThisSortie||!!(ship && ship.structure/ship.def.structure<=TUNE.roster.woundHullRatio),rescued:!!p.rescuedThisSortie,
      sar_cover:id===S.rosterPlayer && !!M.sar && S.result==='win',capture_survivor:!!p.returnedFromCapture};
    const awards=rosterUpdateAwards(p,facts); for(const a of awards) S.rosterAwards.push({pilot:p.callsign,...a});
    delete p.rescuedThisSortie; delete p.returnedFromCapture; delete p.woundedThisSortie;
  }
  rosterSave();
}
function rosterBriefHtml(M) {
  const S=game.mstate,pool=rosterForCarrier(S.rosterKey,M.setup.anchor.ship), active=rosterAvailable(pool.filter(p=>p.id!==S.rosterPlayer));
  const missing=Math.max(0,M.setup.wingmen.length-active.length);
  const player=S.rosterPlayer && rosterFind(S.rosterPlayer);
  return `<div>${player ? `PLAYER ${rosterEscape(rosterRank(player).insignia)} ${rosterEscape(rosterRank(player).name)} · ${rosterEscape(player.callsign)}` : 'NO ACTIVE PILOT AVAILABLE — SORTIE CANNOT LAUNCH'}</div><div>${missing ? `SHORT ${missing} WINGMAN SLOT(S) — SORTIE MAY LAUNCH` : 'Select active pilots or auto-fill.'}</div>` + pool.map(p=>`<div><button type="button" data-roster="${rosterEscape(p.id)}" ${p.status!=='ACTIVE'||p.id===S.rosterPlayer?'disabled':''}>${S.rosterSelected.includes(p.id)?'✓ ':''}${rosterEscape(p.callsign)}</button> ${rosterEscape(rosterRank(p).insignia)} ${rosterEscape(rosterRank(p).name)} · ${rosterEscape(p.name)} · SK ${p.skill} · ${p.status} · ${p.kills} kills / ${p.missions} missions</div>`).join('') + '<button id="rosterAuto" type="button">AUTO-FILL</button> <button id="rosterRecord" type="button">SERVICE RECORD</button>';
}
function rosterServiceHtml(M) {
  const pool=rosterForCarrier(game.mstate.rosterKey,M.setup.anchor.ship), all=[rosterLoad().player,...pool];
  return `<div class="sub">SERVICE RECORD</div>`+all.map(p=>`<div><b>${rosterEscape(p.callsign)}</b> ${rosterEscape(p.name)} · ${rosterEscape(rosterRank(p).insignia)} ${rosterEscape(rosterRank(p).name)} · ${p.status} · ${p.kills} kills / ${p.missions} sorties<br>${p.medals.map(a=>{const m=TUNE.roster.medals.find(x=>x.id===a.id);return rosterEscape((m?.name || a.id)+': '+a.citation);}).join('<br>') || 'No medals yet.'}</div>`).join('');
}
function rosterBindBriefing(el,M) {
  const S=game.mstate,pool=rosterForCarrier(S.rosterKey,M.setup.anchor.ship);
  el.querySelectorAll('[data-roster]').forEach(b=>b.onclick=()=>{const id=b.dataset.roster,i=S.rosterSelected.indexOf(id);if(i>=0)S.rosterSelected.splice(i,1);else if(S.rosterSelected.length<M.setup.wingmen.length)S.rosterSelected.push(id);rosterSpawnWing(M);showBriefing(M);});
  document.getElementById('rosterAuto').onclick=()=>{S.rosterSelected=rosterAuto(pool.filter(p=>p.id!==S.rosterPlayer),M.setup.wingmen.length);rosterSpawnWing(M);showBriefing(M);};
  document.getElementById('rosterRecord').onclick=()=>{const d=document.getElementById('rosterDetails');d.innerHTML=rosterServiceHtml(M);d.style.display=d.style.display==='block'?'none':'block';};
}

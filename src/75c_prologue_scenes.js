// Prologue scene context is a bounded snapshot, never a live roster reference.
function prologueSceneContext(M, S, phase) {
  const ctx={missionId:M?.id || null, phase, result:S?.result || null, grade:null,
    cause:S?.playerDeathCause || null, anchorAvailable:!!(game.anchor?.alive && !game.anchor?.dying), participants:[], ejections:[]};
  if (!S || game.mission !== M) return ctx;
  if (S.result === 'win') ctx.grade=missionStats().grade;
  if (rosterEnabled()) {
    for (const id of S.rosterParticipants || []) {
      const p=rosterFind(id), ship=ships.find(s=>s.pilot===id && !s.rescueCapsule);
      if (!p) continue;
      ctx.participants.push({id, callsign:String(p.callsign || ''), name:String(p.name || ''), status:String(p.status || ''), available:!!(ship?.alive && !ship.dying && p.status==='ACTIVE'), player:id===S.rosterPlayer});
    }
  } else {
    const before=(()=>{try{return JSON.parse(game.crewSnap || '{}');}catch(_){return {};}})();
    for (const id of ['player','hawk','sparrow']) {
      const ship=ships.find(s=>s.pilot===id && !s.rescueCapsule), p=CREW[id], prev=before[id];
      if (!p || !ship || !prev || prev.status!=='active') continue;
      ctx.participants.push({id,callsign:String(ship.callsign || PILOT_DEFS[id]?.callsign || 'PLAYER'), name:String(PILOT_DEFS[id]?.name || ''), status:String(p.status || '').toUpperCase().replace('MISSING','MIA'), available:!!(ship.alive && !ship.dying && p.status==='active'), player:id==='player'});
      const old=Array.isArray(prev.notes)?prev.notes.length:0;
      if ((p.notes || []).slice(old).some(n=>String(n).includes('ejected, recovered'))) ctx.ejections.push({pilot:id,player:id==='player',outcome:'recovered'});
    }
  }
  for (const e of game.rescueLog || []) ctx.ejections.push({pilot:e.pilot || null,player:!!e.player,outcome:String(e.outcome || '')});
  return ctx;
}
const PROLOGUE_HAWK_FALLBACK={p01:'Stay close to the HALBERD.',p02:'Keep the wing together through the screen.',p03:'Keep your countermeasures ready.',p04:'Stay close and keep the telemetry running.'};
const PROLOGUE_NO_LOSS={p01:'Take a moment. We move when ready.',p02:'Hold the line. We still have work to do.',p03:'Stay sharp. We are not finished.',p04:'Keep each other close out there.'};
const PROLOGUE_CAUSES={'Hull destroyed; cause unclear.':'We cannot yet say what broke the hull.', 'Collision with another ship.':'It appears another ship struck the fighter.', 'Missile or warhead impact.':'It appears a missile or warhead hit the fighter.', 'Fire from a larger ship.':'It appears a larger ship hit the fighter.', 'Shields depleted under fire.':'It appears the shields failed under fire.', 'Incoming weapons fire.':'It appears incoming fire hit the fighter.'};
function prologueSpeakerAvailable(ctx, who) {
  const def=PILOT_DEFS[who];
  return !!def && !!ctx?.participants?.some(p=>!p.player && p.callsign===def.callsign && p.name===def.name && p.available && p.status==='ACTIVE');
}
function prologueName(p, index) {
  const name=String(p?.callsign || '').replace(/[^A-Za-z0-9 -]/g,'').trim();
  return name && name.length<=14 ? name : (p?.player ? 'PLAYER' : `WING ${index+1}`);
}
function prologueOutcomeLines(ctx) {
  const rows=[];
  for (const [i,p] of (ctx?.participants || []).entries()) {
    const name=prologueName(p,i), e=(ctx.ejections || []).find(x=>x.pilot===p.id || (p.player && x.player));
    let status='';
    if (p.status==='KIA') status=`We lost ${name}.`;
    else if (p.status==='MIA' || p.status==='MISSING') status=`${name} is still missing.`;
    else if (p.status==='CAPTURED') status=`${name} was captured.`;
    else if (p.status==='RECOVERING') status=`${name} is recovering.`;
    if (e) {
      const tail={recovered:'ejected; recovered.',captured:'ejected; captured.',destroyed:'ejected; capsule destroyed.', 'life support expired':'ejected; life support expired.'}[e.outcome] || 'ejected; outcome unknown.';
      const covered=(p.status==='CAPTURED' && e.outcome==='captured') || (p.status==='RECOVERING' && e.outcome==='recovered');
      rows.push(`${name} ${tail}${status && !covered ? ' '+status : ''}`);
    } else if (status) rows.push(status);
  }
  return rows;
}
function preparePrologueScene(data, ctx) {
  const out={...data, events:data.events.map(e=>({...e}))};
  const id=String(data.id || ''), mission=id.slice(0,3), before=/_before$/.test(id), after=/_after_(win|lose)$/.test(id);
  if (id==='prologue_opening' && !prologueSpeakerAvailable(ctx,'hawk')) {
    out.events=out.events.filter(e=>!(e.do==='head' && e.char==='hawk'));
    for (const e of out.events) if (e.do==='say' && e.who==='hawk') e.who='vance';
    return out;
  }
  if (!/^p0[1-4]/.test(id) || (!before && !after)) return out;
  const context=ctx?.missionId===mission ? ctx : null;
  if (before && !prologueSpeakerAvailable(context,'hawk')) {
    out.events=out.events.filter(e=>!(e.do==='head' && e.char==='hawk'));
    for (const e of out.events) if (e.do==='say' && e.who==='hawk') {e.who='vance';e.text=PROLOGUE_HAWK_FALLBACK[mission];}
  }
  if (after) {
    const rows=prologueOutcomeLines(context), t8=out.events.find(e=>e.do==='say' && e.t===8), t15=out.events.find(e=>e.do==='say' && e.t===15), t22=out.events.find(e=>e.do==='say' && e.t===22);
    if (t8) t8.text=rows.shift() || PROLOGUE_NO_LOSS[mission];
    if (t15 && rows.length) {t15.who='vance';t15.text=rows.join(' ');}
    else if (t15 && ['hawk','sparrow'].includes(t15.who) && !prologueSpeakerAvailable(context,t15.who)) {t15.who='vance';t15.text='We will take this one step at a time.';}
    if (context?.result==='partial') {const first=out.events.find(e=>e.do==='say' && e.t===1);if(first) first.text='The sortie ended with a partial result.';}
    if (t22 && context?.result==='win' && /^[SABCD]$/.test(context.grade || '')) {t22.who='vance';t22.text=`Grade ${context.grade}. You gave them a chance.`;}
    else if (t22 && context && context.result!=='win') {t22.who='vance';t22.text=PROLOGUE_CAUSES[context.cause] || 'We do not yet know what happened.';}
    if (!context?.anchorAvailable) {
      out.events=out.events.filter(e=>!(e.do==='head' && e.char==='vance'));
      for (const e of out.events) if (e.do==='say' && e.who==='vance') e.who='record';
    }
  }
  return out;
}

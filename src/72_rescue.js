// Ejection and pickup primitives. The caller owns ejection probability and mission outcomes.
// Everything is inert unless tuning.rescue.enabled is true.
function rescueEnabled() { return !!TUNE.rescue?.enabled; }
function rescueCritical(s) {
  return rescueEnabled() && !!s && s.alive && !s.dying && !s.rescueCapsule && !s.def.drone && !s.def.unmanned && s.def.cls === 'fighter' &&
    (!!s.pilot || s === player) && s.structure / s.def.structure <= TUNE.rescue.ejectHullRatio;
}
function rescueRequestEject(s) {
  if (!rescueCritical(s)) return false;
  s.rescueManualRequested = true;
  s.deathCause = {dtype:'eject', overkill:0, reactor:false};
  destroy(s);
  return true;
}
function rescueCapsules() { return ships.filter(s => s.rescueCapsule && s.rescueCapsule.outcome === 'adrift' && s.alive && !s.dying); }
function rescueEnsureDef() {
  if (SHIPS.rescue_capsule) return;
  const C = TUNE.rescue.capsule, base = SHIPS.sar;
  SHIPS.rescue_capsule = {
    ...base, id: 'rescue_capsule', name: 'EJECTION CAPSULE', role: 'LIFEBOAT',
    length: C.length, radius: C.radius, half: C.half, vs: C.vs,
    prims: [ell([0,0,0], C.half, 0xc7c9c5), ell([0,0.9,0], [0.18,0.12,0.18], 0xffaa30, {glow:true})],
    shield: {fore:0,aft:0}, shieldRegen:0, structure:C.structure,
    armor: { ...base.armor }, engines: [], mounts: [], turrets: [], stores: {},
    comps: [], drone: false, sar: null, rescue: false, shuttle: true,
    eye:[0,0.4,-0.8], maxSpeed:C.maxSpeed, accel:C.accel, turn:C.turn,
    ai: {role:'rescueCapsule', passive:true},
  };
}
function rescueSpawnCapsule(origin, opts = {}) {
  if (!rescueEnabled() || rescueCapsules().length >= TUNE.rescue.maxCapsules) return null;
  rescueEnsureDef();
  const isPlayer = !!opts.player;
  const p = makeShip('rescue_capsule', origin.team, origin.group.position.clone(), origin.group.quaternion.clone(),
    {player:isPlayer, callsign:opts.callsign || origin.callsign || 'PILOT'});
  p.rescueCapsule = {pilot:opts.pilot || origin.pilot || null, life:TUNE.rescue.lifeSupport, pickup:0, rescuer:null, outcome:'adrift', player:isPlayer};
  (game.rescueLog ||= []).push(p.rescueCapsule);
  p.vel.copy(origin.vel);
  if (isPlayer) { state = 'play'; view = 'chase'; p.group.visible = true; }
  comm('CONTROL', `${p.callsign} capsule beacon detected. Rescue required.`, '#ffd080');
  return p;
}
function rescueResolve(p, outcome, rescuer = null) {
  const r = p.rescueCapsule;
  if (!r || r.outcome !== 'adrift') return false;
  r.outcome = outcome; r.rescuer = rescuer;
  if (rosterEnabled()) rosterOnRescue(p,outcome,rescuer);
  const rec = r.pilot && CREW[r.pilot];
  if (rec && !rosterEnabled()) {
    rec.status = outcome === 'recovered' ? 'recovering' : outcome === 'captured' ? 'captured' : 'KIA';
    rec.notes.push(outcome === 'recovered' ? 'ejected and recovered' : outcome === 'captured' ? 'capsule captured by FROGG' : `capsule lost: ${outcome}`);
    saveCrew();
  }
  if (outcome !== 'destroyed') { p.alive = false; p.group.visible = false; }
  comm(outcome === 'recovered' ? 'SAR' : 'CONTROL', `${p.callsign}: ${outcome.toUpperCase()}.`, outcome === 'recovered' ? '#9ad7ff' : '#ff8a6a');
  if (r.player) { state = 'dead'; if (typeof rescuePlayerResolved === 'function') rescuePlayerResolved(p, outcome); }
  return true;
}
function rescueOnDestroyed(s) {
  if (!rescueEnabled() || !s.rescueCapsule) return false;
  rescueResolve(s, 'destroyed'); return true;
}
function rescueSurfaceDistance(rescuer, p) {
  return Math.max(0, rescuer.group.position.distanceTo(p.group.position) - (rescuer.def.radius || 0));
}
function rescueCanPickup(rescuer, p, now, cfg) {
  return rescuer !== p && rescuer.alive && !rescuer.dying && !!rescuer.def.rescue &&
    rescueSurfaceDistance(rescuer, p) <= cfg.pickupRadius &&
    now - (rescuer.lastHit ?? -Infinity) >= cfg.safeAfterHit &&
    !missiles.some(m => !m.dead && m.target === rescuer) &&
    !ships.some(e => e.alive && !e.dying && e.team !== rescuer.team && e.target === rescuer &&
      e.group.position.distanceTo(rescuer.group.position) <= cfg.safeThreatRange);
}
// Return true when this ship has a rescue-specific flight task and normal fighter AI must not run.
function rescueShipAI(s, dt) {
  if (!rescueEnabled()) return false;
  if (s.rescueCapsule) return true;
  const enemyRecovery = s.team === 1 && s.def.rescue;
  if ((!s.def.sar && !enemyRecovery) || !s.def.rescue) return false;
  if (enemyRecovery && ships.some(e => e.alive && !e.dying && !e.rescueCapsule && e.team !== s.team &&
      e.group.position.distanceTo(s.group.position) < TUNE.rescue.hostileSearchRadius)) return false;
  const targets = rescueCapsules().filter(p => enemyRecovery ? p.team !== s.team : p.team === s.team);
  if (!targets.length) return false;
  targets.sort((a,b) => s.group.position.distanceToSquared(a.group.position) - s.group.position.distanceToSquared(b.group.position));
  const p = targets[0], d = rescueSurfaceDistance(s, p);
  turnToward(s, p.group.position, dt, 1);
  if (d > TUNE.rescue.pickupRadius * 0.7) aiFly(s, {throttle:TUNE.rescue.routeThrottle}, dt);
  else s.vel.multiplyScalar(Math.exp(-TUNE.rescue.routeBrake * dt));
  return true;
}
function rescueTick(dt) {
  if (!rescueEnabled()) return;
  const cfg = TUNE.rescue, used = new Set();
  for (const p of rescueCapsules()) {
    const r = p.rescueCapsule;
    r.life = Math.max(0, r.life - dt);
    if (r.life <= 0) { rescueResolve(p, 'life support expired'); continue; }
    const candidates = ships.filter(s => !used.has(s) && rescueCanPickup(s, p, time, cfg));
    candidates.sort((a,b) => a.group.position.distanceToSquared(p.group.position) - b.group.position.distanceToSquared(p.group.position));
    const s = candidates[0];
    if (!s) { r.pickup = 0; r.rescuer = null; continue; }
    used.add(s);
    if (r.rescuer !== s) { r.pickup = 0; r.rescuer = s; }
    r.pickup += dt;
    if (r.pickup >= cfg.pickupTime) rescueResolve(p, s.team === p.team ? 'recovered' : 'captured', s);
  }
}

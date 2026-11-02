// Campaign pilot used only by the measurement harness. No game-state cheats:
// it uses the same flight, weapons, fuel, lock and damage rules as a player.
(n) => {
  const g = __game, T = g.THREE, out = [], dt = 0.05;
  for (let i = 0; i < n; i++) {
    const p = g.player, anchor = g.game.anchor;
    if (p && p.alive && g.state === 'play') {
      const ep = p.group.position;
      const enemies = g.ships.filter(s => s.alive && !s.dying && s.team !== p.team && s.team !== 2);
      const centre = anchor && anchor.alive ? anchor.group.position : ep;
      enemies.sort ( (a, b) => a.group.position.distanceToSquared(centre) - b.group.position.distanceToSquared(centre) );
      const target = enemies[0] || null;
      g.target = p.target = target;
      const hp = p.structure / p.def.structure;
      const shield = (p.shield.fore + p.shield.aft) / Math.max(1, p.def.shield.fore + p.def.shield.aft);
      if (!p.botMode) p.botMode = 'fight';
      if (hp < 0.42 || shield < 0.18) p.botMode = 'withdraw';
      else if (shield > 0.7 && hp > 0.42) p.botMode = 'fight';
      const threat = enemies.reduce((best, e) => !best || ep.distanceToSquared(e.group.position) < ep.distanceToSquared(best.group.position) ? e : best, null);
      let aim = null, boost = false, distance = Infinity;
      if (p.botMode === 'withdraw') {
        const home = anchor && anchor.alive ? anchor.group.position : ep.clone().add(new T.Vector3(0, 0, 1000));
        const away = threat ? ep.clone().sub(threat.group.position).normalize().multiplyScalar(500) : new T.Vector3();
        aim = home.clone().add(away); boost = ep.distanceTo(home) > 500;
        p.throttle = 1;
      } else if (target) {
        distance = ep.distanceTo(target.group.position);
        const relative = target.vel.clone().sub(p.vel);
        const lead = target.group.position.clone().addScaledVector(relative, Math.min(2, distance / 1000));
        const forward = new T.Vector3(0, 0, -1).applyQuaternion(p.group.quaternion);
        const to = target.group.position.clone().sub(ep).normalize();
        const closing = p.vel.clone().sub(target.vel).dot(to);
        const collision = closing > 0 && (distance - target.def.radius - p.def.radius) / closing < 2.5 && forward.dot(to) > 0.7;
        if (collision || distance < target.def.radius + p.def.radius + 120) {
          const side = new T.Vector3().crossVectors(to, new T.Vector3(0, 1, 0)).normalize();
          if (side.lengthSq() < 0.1) side.set(1, 0, 0);
          aim = ep.clone().addScaledVector(side, 700).addScaledVector(to, -250);
          p.botBreakUntil = g.time + 3; p.botBreak = aim.clone();
        } else aim = p.botBreakUntil > g.time ? p.botBreak : lead;
        boost = p.botBreakUntil > g.time || distance > 1800;
        p.throttle = distance < 500 ? 0.65 : 1;
        const err = forward.angleTo(lead.clone().sub(ep).normalize());
        if (!collision && err < 0.07 && distance < 1200) g.fireGuns(p, 3);
        const wid = g.selectedMissile(p), w = g.WEAPONS[wid];
        if (w && p.lock.state === 'locked' && p.lock.tgt === target && distance > 350 && distance < w.range * 0.85 && g.time > (p.botNextMissile || 0)) {
          if (g.launchMissile(p, wid)) p.botNextMissile = g.time + 4;
        }
      } else if (anchor && anchor.alive && ep.distanceTo(anchor.group.position) > 700) {
        aim = anchor.group.position.clone(); p.throttle = 0.8;
      } else p.throttle = 0.4;
      if (aim && aim.distanceToSquared(ep) > 1) {
        const m = new T.Matrix4().lookAt(ep, aim, new T.Vector3(0, 1, 0));
        p.group.quaternion.rotateTowards(new T.Quaternion().setFromRotationMatrix(m), 2 * dt);
      }
      if (boost && p.abFuel > 1) g.keys.add('ShiftLeft'); else g.keys.delete('ShiftLeft');
      if (g.warnState.incoming.length && g.warnState.incoming[0].pos.distanceTo(ep) < 500) g.deployCM(p);
    } else g.keys.delete('ShiftLeft');
    g.update(dt);
    if (i % 200 === 199) out.push({t:g.game.mstate.t, state:g.state, result:g.game.mstate.result});
  }
  return out;
}

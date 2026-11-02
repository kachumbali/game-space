// Experimental per-cell ordnance. All counts are rounds: s.stores includes
// both loaded cells and the magazine; launcherMagazine is the unassigned part.
// AI may select and fire cells through fireLauncher without owning their clocks.
function launcherMounts(def) {
  if (!def.launchers || def.fac !== 'human') return [];
  return def.launchers.flatMap(bank => bank.positions.map((pos, i) => ({
    id:`launcher-${bank.id}-${i + 1}`, name:`${bank.id} ${i + 1}`, role:'gun',
    pos:pos.slice(), r:bank.mountRadius, hp:bank.mountHp,
  })));
}
function initLaunchers(s) {
  if (!TUNE.ordnance?.enabled || s.def.fac !== 'human' || !s.def.launchers?.length) return;
  const banks = s.def.launchers, plan = s.def.ordnancePlan;
  const ids = new Set(banks.flatMap(b => b.stores));
  for (const wid of ids) if (plan?.stores?.[wid] !== undefined) s.stores[wid] = plan.stores[wid];
  s.launcherRuntime = [];
  for (const bank of banks) for (let i = 0; i < bank.count; i++) {
    const id = `${bank.id}-${i + 1}`, comp = `launcher-${id}`;
    const pos = bank.positions[i].slice();
    if (!s.comps.some(c => c.id === comp)) s.comps.push({id:comp, name:`${bank.id} ${i + 1}`, role:'gun', pos, r:bank.mountRadius, hp:bank.mountHp, max:bank.mountHp});
    s.launcherRuntime.push({id, role:bank.role, kind:bank.kind, pos, comp, cap:bank.cap, reload:bank.reload,
      allowed:bank.stores.slice(), ready:0, wid:null, timer:0});
  }
  s.launcherMagazine = {};
  launcherTick(s, 0);
}
// Reconcile with aggregate stores each tick so existing finite-stock tender
// service can add rounds without creating ammunition. External reductions
// remove magazine rounds first, then unload cells deterministically.
function launcherReconcile(s) {
  const cells = s.launcherRuntime || [], ids = new Set(cells.flatMap(c => c.allowed));
  for (const wid of ids) {
    let total = Math.max(0, Math.floor(s.stores[wid] || 0));
    for (const c of cells) if (c.wid === wid && c.ready > 0) {
      const keep = Math.min(total, c.ready); c.ready = keep; total -= keep;
      if (!keep) c.wid = null;
    }
    s.launcherMagazine[wid] = total;
  }
}
function launcherTick(s, dt) {
  if (!TUNE.ordnance?.enabled || !s.launcherRuntime) return;
  launcherReconcile(s);
  for (const c of s.launcherRuntime) {
    c.timer = Math.max(0, c.timer - Math.max(0, dt));
    if (c.timer > 0 || c.ready > 0) continue;
    const comp = s.comps.find(x => x.id === c.comp);
    if (!comp || comp.hp <= comp.max * 0.5) continue;
    const wid = c.allowed.find(id => s.launcherMagazine[id] > 0);
    if (!wid) { c.wid = null; continue; }
    const n = Math.min(c.cap, s.launcherMagazine[wid]);
    c.wid = wid; c.ready = n; s.launcherMagazine[wid] -= n;
  }
}
function fireLauncher(s, cell, wid, target = null) {
  if (!TUNE.ordnance?.enabled || !s.launcherRuntime?.includes(cell) || !s.alive || s.dying || cell.timer > 0 || cell.ready < 1 || cell.wid !== wid) return false;
  const comp = s.comps.find(x => x.id === cell.comp);
  if (!comp || comp.hp <= comp.max * 0.5 || !(s.stores[wid] >= 1)) return false;
  let dir = null;
  if (target && target.alive && !target.dying && target.team !== s.team) {
    s.group.updateMatrixWorld(true);
    const origin = s.group.localToWorld(new THREE.Vector3(...cell.pos));
    dir = target.group.position.clone().sub(origin);
  }
  if (!launchMissile(s, wid, {launcher:true, pos:cell.pos, dir, target})) return false;
  cell.ready--; cell.timer = cell.reload;
  if (!cell.ready) cell.wid = null;
  launcherReconcile(s);
  return true;
}

// TEMP shim until the weapon system lands
for (const d of Object.values(SHIPS)) d.guns = (d.mounts || []).filter(m => m.grp === 1).map(m => ({ pos: m.pos, comp: m.comp }));
for (const d of Object.values(SHIPS)) { d.boltColor = d.fac === 'frogg' ? 0x9dff3a : 0x66ffcc; d.fireRate = 0.3; d.damage = 5; d.boltSpeed = 400; }

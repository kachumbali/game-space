# needs the test runner (lib.Runner: local http server + Chromium via Playwright); see docs/BALANCE_TESTS.md
from lib import *
import json, csv, subprocess, datetime, sys
OUT='/home/claude/game-space/docs/data/'
JS='''()=>{const g=__game,W=g.WEAPONS,rows=[],wrows=[];
 const dps=(id)=>{const w=W[id];return w&&w.cd?(w.dmg||0)/w.cd:0};
 for(const [id,d] of Object.entries(g.SHIPS)){
  const mg=(d.mounts||[]).filter(m=>!m.store), tu=d.turrets||[];
  const cnt=a=>{const c={};a.forEach(m=>c[m.w]=(c[m.w]||0)+1);return Object.entries(c).map(([k,v])=>v+'x'+k).join(' ')};
  const rng=a=>Math.max(0,...a.map(m=>{const w=W[m.w];return w.kind==='beam'?w.range:(w.v||0)*(w.life||0)}));
  const st=d.stores||{};const comps=d.comps||[];
  const roles={};comps.forEach(c=>roles[c.role]=(roles[c.role]||0)+1);
  const ar=g.ARMOR[d.armor.type];
  rows.push({id,name:d.name,faction:d.fac,class:d.cls,role:d.role,length_m:d.length,half_x:d.half[0],half_y:d.half[1],half_z:d.half[2],radius_m:d.radius,
   mass_class:g.MASS[d.cls],structure:d.structure,shield_fore:d.shield.fore,shield_aft:d.shield.aft,shield_regen_per_s:d.shieldRegen,
   armor_type:d.armor.type,armor_rating:d.armor.rating,armor_thresh_base:ar.thresh,armor_thresh_class_mult:g.ARMOR_THRESH_CLS[d.cls],armor_ablative_rate:ar.rate,armor_spall:ar.spall,
   armor_vs_kin:ar.prof.kin,armor_vs_en:ar.prof.en,armor_vs_exp:ar.prof.exp,armor_vs_nuke:ar.prof.nuke,
   max_speed_mps:d.maxSpeed,accel_mps2:d.accel,turn_rad_s:+d.turn.toFixed(3),sig:d.sig,ai_speed_mps:d.aiSpeed||'',ai_role:(d.ai&&d.ai.role)||'',ai_skill:(d.ai&&d.ai.skill)||'',
   n_engines:(d.engines||[]).length,n_gun_mounts:mg.length,n_turrets:tu.length,n_components:comps.length,components_hp_total:comps.reduce((a,c)=>a+(c.hp||0),0),
   comp_roles:Object.entries(roles).map(([k,v])=>v+'x'+k).join(' '),
   guns:cnt(mg),turrets:cnt(tu),gun_dps:+mg.reduce((a,m)=>a+dps(m.w),0).toFixed(1),turret_dps:+tu.reduce((a,m)=>a+dps(m.w),0).toFixed(1),max_gun_range_m:Math.round(rng(mg)),max_turret_range_m:Math.round(rng(tu)),
   stores_ir:st.ir||0,stores_rf:st.rf||0,stores_torp:st.torp||0,stores_nuke:st.nuke||0,stores_flare:st.flare||0,
   stores_other:Object.entries(st).filter(([k])=>!['ir','rf','torp','nuke','flare'].includes(k)).map(([k,v])=>k+':'+v).join(' '),
   n_prims:(d.prims||[]).length,flame_color:'#'+(d.flameColor||0).toString(16).padStart(6,'0')});}
 for(const [id,w] of Object.entries(W)){wrows.push({id,name:w.name,kind:w.kind,damage_type:w.dt||'',damage:w.dmg??'',cooldown_s:w.cd??'',dps:w.cd?+(w.dmg/w.cd).toFixed(1):'',speed_mps:w.v??'',life_s:w.life??'',range_m:w.range??(w.v&&w.life?Math.round(w.v*w.life):''),spread_rad:w.spread??'',pierce:w.pierce??'',ammo:w.ammo??'',energy_per_shot:w.energy??'',turret:w.turret?1:'',seeker:w.seeker||'',lock_time_s:w.lockTime??'',lock_cone_rad:w.lockCone??'',hp:w.hp??'',nuclear:w.nuclear?1:''});}
 return {rows,wrows}}'''
with Runner() as R:
    pg=R.page(320,180,'?free&n=0&wing=0'); pg.wait_for_timeout(800)
    d=pg.evaluate(JS)
    print(R.errs[:3])
for name,rows in (('ships',d['rows']),('weapons',d['wrows'])):
    keys=[]
    for r in rows:
        for k in r:
            if k not in keys: keys.append(k)
    with open(OUT+name+'.csv','w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=keys); w.writeheader(); w.writerows(rows)
    print(name,len(rows),len(keys))

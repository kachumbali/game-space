from lib import *
with Runner() as R:
    pg=R.page(1280,720,'?free'); pg.wait_for_timeout(500)
    r=pg.evaluate("""()=>{const g=__game;__paused=true;const P=g.player;const T=g.THREE;
      const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const out={};
      // effective damage-to-kill per ship/type/hit size (shields 0)
      const tests=[['kin',3],['kin',1.3],['kin',70],['en',7],['en',24]];
      for(const id of ['kestrel','darter','leaper','spitter','toad','reaver','halberd','gulper','exeter','hivecarrier']){
        const row={};
        for(const [dt,dm] of tests){
          const s=g.spawnShip(id,1,P.group.position.clone().addScaledVector(f,3000),P.group.position);
          s.shield.fore=0;s.shield.aft=0;s.group.updateMatrixWorld(true);
          const lp=new T.Vector3(0,0,-s.def.half[2]*0.9);const wp=lp.clone().applyMatrix4(s.group.matrixWorld);
          const st0=s.structure+s.comps.reduce((a,c)=>a+c.hp,0);
          const n=1; g.applyHit(s,lp,dm,wp,dt,0);
          const st1=s.structure+s.comps.reduce((a,c)=>a+c.hp,0);
          row[dt+dm]=((st0-st1)/dm).toFixed(2);   // fraction of damage that reached structure+comps
          s.alive=false;
        }
        out[id]=row;
      }
      return out}""")
    for k,v in r.items(): print(k,v)
    # ablative rate cap: sustained energy fire on a darter, vs burst
    r=pg.evaluate("""()=>{const g=__game;const P=g.player;const T=g.THREE;const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const s=g.spawnShip('spitter',1,P.group.position.clone().addScaledVector(f,3000),P.group.position);s.shield.fore=0;s.group.updateMatrixWorld(true);
      const lp=new T.Vector3(0,0,-s.def.half[2]*0.9);const wp=lp.clone().applyMatrix4(s.group.matrixWorld);
      const seq=[];for(let i=0;i<8;i++){const a=s.structure+s.comps.reduce((x,c)=>x+c.hp,0);g.applyHit(s,lp,3,wp,'en',0);const b=s.structure+s.comps.reduce((x,c)=>x+c.hp,0);seq.push(((a-b)/3).toFixed(2));}
      return seq}""")
    print('ablative en burst (fraction through, 8 quick hits):',r)
    # friendly fire + crash
    r=pg.evaluate("""()=>{const g=__game;const P=g.player;const T=g.THREE;const f=new T.Vector3(0,0,-1).applyQuaternion(P.group.quaternion);
      const out={};
      const w=g.spawnShip('kestrel',0,P.group.position.clone().addScaledVector(f,200),P.group.position);w.shield.fore=w.shield.aft=0;
      const w2=g.spawnShip('kestrel',0,P.group.position.clone().addScaledVector(f,400),P.group.position);
      out.inLine=g.fireGuns(w2,3);
      const s0=w.structure+w.comps.reduce((a,c)=>a+c.hp,0);
      P.energy=100;for(let i=0;i<40;i++){g.fireGuns(P,3);g.update(0.02);}
      out.wingmanDmg=s0-(w.structure+w.comps.reduce((a,c)=>a+c.hp,0));out.ffHits=P.ffHits||0;
      // crash: fighter into corvette and frigate, and corvette into frigate
      function crash(aid,bid){const A=g.spawnShip(aid,1,new T.Vector3(0,0,-9000),null);const B=g.spawnShip(bid,1,new T.Vector3(0,0,-9000),null);
        A.shield.fore=A.shield.aft=B.shield.fore=B.shield.aft=0;B.group.updateMatrixWorld(true);
        A.group.position.copy(B.group.position).add(new T.Vector3(0,0,-B.def.half[2]*0.3));A.vel.set(0,0,200);B.vel.set(0,0,0);A.hitCool=0;
        const sa=A.structure,sb=B.structure;g.update(0.01);
        return {a:(sa-A.structure).toFixed(1),b:(sb-B.structure).toFixed(1)}}
      out.f_f=crash('kestrel','darter');out.f_c=crash('kestrel','halberd');out.c_fr=crash('halberd','exeter');
      return out}""")
    print(r); print('ERRS',R.errs[:6])

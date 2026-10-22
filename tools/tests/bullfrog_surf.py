from lib import *
JS='''()=>{const g=__game,d=g.SHIPS.bullfrog,D=g.voxelize(d,400,4),o=[];
  const col=(x,z)=>{const i=Math.floor((x+D.hx)/D.vs),k=Math.floor((z+D.hz)/D.vs);let top=null,bot=null;
    for(let j=0;j<D.ny;j++){if(D.grid[(i*D.ny+j)*D.nz+k]>=0){const y=-D.hy+(j+0.5)*D.vs;if(bot===null)bot=y;top=y;}}return [top,bot];};
  for(const t of d.turrets){const [top,bot]=col(Math.abs(t.pos[0]),t.pos[2]);o.push([t.comp,t.cls,t.pos.join(','),t.side>0?top:bot]);}
  for(const c of d.comps){if(c.role==='turret')continue;const [top,bot]=col(Math.abs(c.pos[0]),c.pos[2]);o.push([c.id,'',c.pos.join(','),top+'/'+bot]);}
  return o}'''
with Runner() as R:
    pg=R.page(320,180,'?free&n=0'); pg.wait_for_timeout(500)
    for x in pg.evaluate(JS): print(x)

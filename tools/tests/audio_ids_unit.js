const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/12_audio.js','utf8');
const obj=source.slice(source.indexOf('const SFX = '),source.indexOf('// Existing procedural fallback'));
const ctx={};vm.createContext(ctx);vm.runInContext(obj+'globalThis.ids=Object.keys(SFX)',ctx);
const ids=new Set(ctx.ids);
const juice=fs.readFileSync('src/62_juice.js','utf8');
for(const m of juice.matchAll(/SFX\.([a-zA-Z0-9_]+)\s*=/g)) ids.add(m[1]);
const references=[];
for(const f of fs.readdirSync('src').filter(f=>f.endsWith('.js'))) {
 const s=fs.readFileSync(path.join('src',f),'utf8');
 for(const m of s.matchAll(/\bsfx\(\s*['"]([^'"]+)['"]/g)) references.push([f,m[1]]);
}
for(const [id,w] of Object.entries(JSON.parse(fs.readFileSync('data/db.json','utf8')).weapons)) if(w.sfx) references.push([`weapon ${id}`,w.sfx]);
function missing(refs) {return refs.filter(([,id])=>!ids.has(id));}
assert.deepEqual(missing(references),[]);
assert.equal(missing([['negative-control','not-a-real-sound']]).length,1);
console.log(`${references.length} sound references resolve; missing-ID negative control: OK`);

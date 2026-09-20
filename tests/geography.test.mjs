import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
/* ROM-MAP-SPEC-003 geography contract: pure data checks that need no browser */
function world(){
  const c=vm.createContext({window:{THREE:{}}, console, document:{getElementById:()=>({classList:{remove(){}}})}});
  vm.runInContext(readFileSync('src/system/helpers.js','utf8').replace(/if\(!window\.THREE\)[^\n]*\n/,''),c);
  vm.runInContext(readFileSync('src/world/geography.js','utf8'),c);
  return c;
}
const builders=(readFileSync('src/buildings/landmarks.js','utf8')+readFileSync('src/buildings/areas.js','utf8')).match(/SITE_BUILDERS\.([a-z_]+)=/g).map(m=>m.replace('SITE_BUILDERS.','').replace('=',''));
test('world frame, regions, seats of power and the 48 villages follow the spec sheet',()=>{
  const c=world();
  assert.equal(c.WORLD.half,3000);assert.equal(c.ZN*c.ZS,6000);
  assert.equal(c.getRegion(0,0),'capital');assert.equal(c.getRegion(-1800,-800),'transylvanian');assert.equal(c.getRegion(1700,-700),'moldavian');
  assert.equal(c.getRegion(0,-2400),'carpathian');assert.equal(c.getRegion(0,2500),'trade_route');assert.equal(c.getRegion(-1400,1300),'wallachian');assert.equal(c.getRegion(0,-1500),'battlefield');
  assert.equal(c.VILLAGES.length,48);assert.equal(new Set(c.VILLAGES.map(v=>v.name)).size,48);
  assert.equal(c.VILLAGES.filter(v=>v.id&&v.id.startsWith('NV-')).length,16);
  for(const v of c.VILLAGES){assert.ok(v.lane!==undefined,`village ${v.name} has no lane`);assert.ok(v.lane<=1400,`lane of ${v.name} too long`);assert.ok(['CA','AR','VA','MO','TD','CP','BF'].includes(v.kit));}
  assert.equal(c.RIVERS.length,4);assert.equal(c.SITES_DEF.filter(s=>s.kind==='waystation').length,12);
  assert.ok(c.FLAGS.length>=51);assert.equal(new Set(c.FLAGS.map(f=>f.id)).size,c.FLAGS.length);assert.ok(c.BEACON_DEF.length>=9);
  assert.equal(new Set(c.SITES_DEF.map(s=>s.key)).size,c.SITES_DEF.length);
  for(const s of c.SITES_DEF) assert.ok(builders.includes(s.kind),`no builder for site kind ${s.kind}`);
});
test('named places never overlap and roads cross rivers only at bridges and fords',()=>{
  const c=world();
  const V=c.VILLAGES,S=c.SITES_DEF,TR={sparta:150,rome:190,moldavia:215,vikings:150,egypt:150,nippon:530};
  for(let i=0;i<V.length;i++)for(let j=i+1;j<V.length;j++)assert.ok(Math.hypot(V[i].x-V[j].x,V[i].z-V[j].z)>=150,`${V[i].name}/${V[j].name}`);
  for(const v of V)for(const s of S)assert.ok(Math.hypot(v.x-s.x,v.z-s.z)>=s.r+48,`${v.name}/${s.key}`);
  for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++){const a=S[i],b=S[j];if(a.key==='muntele_corbilor'||b.key==='muntele_corbilor')continue;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=a.r+b.r,`${a.key}/${b.key}`);}
  for(const f of c.FAC_KEYS_T){const T=c.TOWNS[f];for(const v of V)assert.ok(Math.hypot(v.x-T.x,v.z-T.z)>=TR[f]+60,`${T.name}/${v.name}`);for(const s of S)assert.ok(Math.hypot(s.x-T.x,s.z-T.z)>=TR[f]+s.r,`${T.name}/${s.key}`);}
  let wet=0;
  for(const R of c.ROADS)for(const p of R.pts){assert.ok(Number.isFinite(p[0])&&Number.isFinite(p[1]));const rf=c.riverField(p[0],p[1]);
    if(rf.river&&rf.d<c.riverHalfWidth(rf.river,p[1])*0.9){let ok=false;for(const b of c.BRIDGES)if(Math.hypot(b.x-p[0],b.z-p[1])<b.len/2+8)ok=true;if(!ok)wet++;}}
  assert.equal(wet,0);
  const classes=new Set(c.ROADS.map(r=>r.cls));for(const k of ['R0','R1','R1t','R2','R3'])assert.ok(classes.has(k));
  assert.ok(c.ROADS.filter(r=>r.lane).length>=60);assert.ok(c.BRIDGES.filter(b=>b.ford).length>=4);assert.ok(c.BRIDGES.filter(b=>b.stone).length>=5);
  assert.ok(c.roadSpeedAt(0,-1000)>1.3);assert.equal(c.roadSpeedAt(1500,-3000),1);
  /* every homeland flat is level ground and the massif summit is the highest named point */
  for(const f of c.FAC_KEYS_T){const T=c.TOWNS[f];assert.ok(Math.abs(c.groundH(T.x+40,T.z)-c.groundH(T.x-40,T.z))<0.6,T.name);}
  assert.ok(c.groundH(-1750,-2650)>c.groundH(-1750,-2450)+40);
});

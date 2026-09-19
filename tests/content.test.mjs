import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('src/manifest.json','utf8'));
test('every playable class is individually editable and uses medieval equipment',()=>{
 const c=vm.createContext({});vm.runInContext(readFileSync('src/weapons/catalog.js','utf8'),c);for(const file of manifest.filter(f=>/^src\/characters\/(factions|catalog)\.js$/.test(f)||/^src\/characters\/[^/]+\/[^/]+\.js$/.test(f)))vm.runInContext(readFileSync(file,'utf8'),c);
 const permitted=new Set(Object.keys(c.WEAPONS));for(const [id,weapon] of Object.entries(c.WEAPONS)){assert.ok(['blade','spear','axe','bow'].includes(weapon.family));assert.doesNotMatch(id,/rifle|pistol|musket|firearm|shotgun|tank/i);}
 let count=0;for(const [name,faction] of Object.entries(c.FACS))for(const [key,role] of Object.entries(faction.classes)){
   count++;assert.ok(manifest.includes(`src/characters/${name}/${key}.js`));assert.ok(permitted.has(role.spec.weapon));assert.ok(role.hp>0&&role.cost>0);
 }
 assert.ok(count>=24);assert.match(c.FACS.moldavia.name,/MOLDOVA/);
});
test('animation modules cannot apply damage, recruit, release arrows or grant gold',()=>{
 for(const file of manifest.filter(f=>f.startsWith('src/animations/'))){const source=readFileSync(file,'utf8');assert.doesNotMatch(source,/\b(?:damageEntity|shootArrowFrom|doMuster|captureTick)\s*\(|\.gold\s*\+=/,file);}
});
test('published HTML is self-contained, identical, and contains no injected challenge',()=>{
 const a=readFileSync('index.html','utf8');assert.equal(a,readFileSync('age-of-warfare.html','utf8'));assert.doesNotMatch(a,/<(?:script|link|img)\b[^>]*(?:src|href)=["'](?:https?:|\/\/)/i);assert.doesNotMatch(a,/cdn-cgi|__CF\$/);assert.match(a,/WORLD = \{half:3000\}/);
});
test('source manifest uses distinct files and generated outputs are not source inputs',()=>{
 assert.equal(manifest.length,new Set(manifest).size);assert.ok(manifest.every(f=>f.startsWith('src/')&&f.endsWith('.js')));
 for(const folder of ['animations','characters','weapons','buildings','navigation','groups','system'])assert.ok(manifest.some(f=>f.startsWith(`src/${folder}/`)));
});

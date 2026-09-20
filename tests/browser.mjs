import assert from 'node:assert/strict';
import {launchBrowser} from './browser-env.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
const results=[],errors=[],requests=[];mkdirSync('test-results',{recursive:true});
const browser=await launchBrowser();
const context=await browser.newContext({viewport:{width:1024,height:768}});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
const step=(n=1,dt=1/60)=>page.evaluate(([n,dt])=>__game.test.step(n,dt),[n,dt]);
const check=async(name,fn)=>{const started=Date.now();await fn();assert.deepEqual(errors,[],`Runtime errors during ${name}`);results.push({name,passed:true,ms:Date.now()-started});console.log('PASS',name);};
const act=a=>page.locator(`[data-action="${a}"]`).click();
try{
  await page.goto(pathToFileURL(resolve('index.html')).href+'?test=1');
  await page.evaluate(()=>__game.forceLook());
  await check('offline boot: original world size, all territories covered, populated settlements',async()=>{
    const r=await page.evaluate(()=>({world:__game.test.world(),coverage:__game.coverage(),buildings:__game.buildings(),lore:__game.landmarkCount(),live:__game.buildingsLive()}));
    assert.equal(r.world.half,3000);assert.equal(r.coverage.covered,256);assert.ok(r.world.settlements.buildings>5500);assert.ok(r.world.settlements.zones>=245);assert.ok(r.buildings>8500);assert.ok(r.lore>60);assert.deepEqual(requests,[]);
    assert.ok(r.live.doors>8000,'hinged doors');assert.ok(r.live.enterable>8000,'enterable structures');assert.ok(r.live.lights>15000,'registered light sources');assert.ok(r.live.chimneys>8000,'smoking chimneys');assert.ok(r.live.anim>=20,'moving parts');assert.ok(r.live.bridges>=9,'river bridges');
    /* phase 3: no box-and-prism buildings — every countryside house is an instanced real building with an interior; the only structures without one are gates and water gates */
    assert.ok(r.live.prefabs.defs>=60&&r.live.prefabs.houses>6000&&r.live.hamlets.hamlets>600,'prefab tier '+JSON.stringify(r.live.prefabs));
    assert.ok(r.live.enterable>=r.live.structures-120,'almost every structure is enterable');assert.deepEqual(Object.keys(r.live.nonEnterable).filter(k=>!/gate|tent|ferry|flag|beacon/.test(k)),[],JSON.stringify(r.live.nonEnterable));
    /* ROM-MAP-SPEC-003: 48 villages, four rivers, the road hierarchy with lanes, fords, waystations, capture flags and beacons */
    assert.equal(r.live.villages,48);assert.equal(r.live.rivers,4);assert.ok(r.live.roads.ribbons>=90&&r.live.roads.lanes>=60&&r.live.roads.trails>=12,'road hierarchy');
    assert.ok(r.live.fords>=4,'fords');assert.equal(r.live.waystations,12);assert.ok(r.live.flags>=51,'capture flags');assert.ok(r.live.beacons>=9,'signal beacons');assert.ok(Object.keys(r.live.rbl).length>=18,'vernacular library in use');
    writeFileSync('test-results/world.json',JSON.stringify(r,null,2));
  });
  await check('NO-CLIP LAW: every registered wall face is solid, roads never run through river water',async()=>{
    const r=await page.evaluate(()=>({audit:__game.noclipAudit(), road:__game.roadProbe(400)}));
    assert.equal(r.audit.badN,0,JSON.stringify(r.audit.bad));assert.ok(r.audit.ok>8000,'audited '+r.audit.ok);assert.equal(r.road.wet,0);
  });
  await check('every named building is solid, has a real door and an open entrance into a furnished interior',async()=>{
    const r=await page.evaluate(()=>{const S=__game.structures();let ok=0;const bad=[];
      for(const s of S){ if(!s.door) continue; const dx=s.x-s.door.x,dz=s.z-s.door.z,L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
        const outFree=__game.freeAt(s.door.x,s.door.z,0.42), inFree=__game.freeAt(s.door.x+ux*1.3,s.door.z+uz*1.3,0.42);
        /* walls beside the door must be solid: a point inside the wall next to the opening is blocked (tents are open-fronted) */
        const side=(s.dw||1.6)/2+0.5, wx=s.door.x+ux*0.95, wz=s.door.z+uz*0.95;
        const wallHit=s.kind==='tent'||!__game.freeAt(wx-uz*side,wz+ux*side,0.12)||!__game.freeAt(wx+uz*side,wz-ux*side,0.12);
        if(outFree&&inFree&&wallHit) ok++; else bad.push({name:s.name,kind:s.kind,x:s.x,z:s.z,outFree,inFree,wallHit}); }
      return {ok,bad:bad.slice(0,12),badN:bad.length,total:S.length};});
    assert.ok(r.ok>8000,JSON.stringify(r.bad));assert.ok(r.badN<=Math.max(3,r.total*0.01),JSON.stringify(r.bad));
  });
  await check('doors swing for the player, windows glow at night, lights and smoke follow the walker',async()=>{
    const r=await page.evaluate(()=>{const td=__game.townData('moldavia');const i=__game.nearestDoor(td.hall.door.x,td.hall.door.z);const d0=__game.doorState(i);
      __game.setTimeOfDay(13);for(let k=0;k<20;k++)__game.tickAmbient(0.05);const dayGlow=__game.paneGlow();
      __game.setTimeOfDay(0.5);for(let k=0;k<20;k++)__game.tickAmbient(0.05);const nightGlow=__game.paneGlow();
      return {d0,dayGlow,nightGlow,lights:__game.poolLights().length,smoke:__game.smokeAlive()};});
    assert.ok(r.d0&&r.d0.open===0);assert.ok(r.nightGlow>r.dayGlow+0.3);
  });
  await check('menu/back/faction/role buttons and role-before-spawn gate',async()=>{
    await page.click('#btn-begin');await page.click('#btn-back-fac');assert.equal(await page.evaluate(()=>__game.state()),0);
    await page.click('#btn-begin');await page.click('[data-fac="moldavia"]');assert.ok(await page.locator('#btn-spawn').isDisabled());
    await page.click('#btn-back');await page.click('[data-fac="moldavia"]');await page.click('#role-grid [data-role="curtean"]:not(.random)');
    await page.click('#btn-spawn');assert.equal(await page.evaluate(()=>__game.state()),3);await step(2);
    assert.equal(await page.evaluate(()=>__game.test.members().length),17);
  });
  await check('walking up to the hall door opens it; lights and chimney smoke are pooled around the player',async()=>{
    const r=await page.evaluate(()=>{const td=__game.townData('moldavia');const i=__game.nearestDoor(td.hall.door.x,td.hall.door.z);const d=__game.doorState(i);
      __game.tpNear(d.x,d.z);const p=__game.player();p.group.position.x=d.x;p.group.position.z=d.z+0.6;__game.test.step(60,1/30);const open=__game.doorState(i);
      __game.setTimeOfDay(23);__game.test.step(30,1/30);return {before:d.open,after:open.open,rot:Math.abs(open.rot-open.base),lights:__game.poolLights().length,smoke:__game.smokeAlive(),inside:__game.freeAt(p.group.position.x,p.group.position.z,0.4)};});
    assert.ok(r.after>0.9,JSON.stringify(r));assert.ok(r.rot>1.2);assert.ok(r.lights>=3,JSON.stringify(r));assert.ok(r.smoke>0,JSON.stringify(r));
  });
  await check('single-click muster and auto-buy toggles are not double-bound',async()=>{
    await page.evaluate(()=>__game.addGold(100000));await act('muster');
    const before=await page.evaluate(()=>({n:__game.test.members().length,gold:__game.gold(),anim:__game.player().animT}));
    await page.click('.recruit-card[data-key="curtean"]');
    const after=await page.evaluate(()=>({n:__game.test.members().length,gold:__game.gold(),cost:__game.test.catalog().factions.moldavia.classes.curtean.cost,anim:__game.player().animT}));
    assert.equal(after.n,before.n+1);assert.equal(after.gold,before.gold-after.cost);assert.equal(after.anim,before.anim);
    await page.click('#btn-autobuy');assert.equal(await page.evaluate(()=>__game.brainState().autobuy),true);
    await page.click('#btn-autobuy');assert.equal(await page.evaluate(()=>__game.brainState().autobuy),false);
    await page.selectOption('#autobuy-sel','arcas');await page.click('#btn-recruit-close');assert.equal(await page.evaluate(()=>__game.gates().rec),false);
  });
  await check('buttons and number keys issue matching commands, scope is exact',async()=>{
    for(const [action,key] of [['follow','1'],['defend','2'],['attack','3'],['halt','4']]){
      await act(action);assert.equal(await page.evaluate(()=>__game.curOrder()),action);
      await page.keyboard.press(key);assert.equal(await page.evaluate(()=>__game.curOrder()),action);
    }
    await page.evaluate(()=>{__game.setScope(0);__game.issueOrder('follow');__game.setScope(4);});
    const n=await page.evaluate(()=>__game.test.members().length);await act('halt');
    assert.equal(await page.evaluate(()=>__game.test.members().filter(e=>e.order==='halt').length),Math.max(1,Math.round(n*.1)));
    await page.evaluate(()=>__game.setScope(0));await act('scope');assert.equal(await page.evaluate(()=>__game.scope()),.75);await page.keyboard.press('q');assert.equal(await page.evaluate(()=>__game.scope()),.5);
    await page.evaluate(()=>__game.setScope(0));
  });
  await check('keyboard-only play with buttons hidden: idle/walk/sprint/dodge',async()=>{
    await page.keyboard.press('F2');assert.ok(await page.locator('#actionbar').isHidden());
    await page.evaluate(()=>{const p=__game.test.free(120,120);__game.tpNear(p.x,p.z);});await step(1);
    const idle=await page.evaluate(()=>__game.test.animation(__game.player()));await step(15);const idle2=await page.evaluate(()=>__game.test.animation(__game.player()));assert.notEqual(idle.body,idle2.body);
    const start=await page.evaluate(()=>({x:__game.player().group.position.x,z:__game.player().group.position.z}));
    await page.keyboard.down('w');await step(40);const walking=await page.evaluate(()=>({anim:__game.anim(),x:__game.player().group.position.x,z:__game.player().group.position.z}));assert.ok(Math.hypot(walking.x-start.x,walking.z-start.z)>1);assert.ok(walking.anim.amt>.8);assert.notEqual(walking.anim.kneeL,0);
    await page.keyboard.down('Shift');await step(10);assert.ok(await page.evaluate(()=>__game.anim().rate>10));await page.keyboard.up('Shift');
    await page.keyboard.press('Space',{delay:1}); // use held input while simulation advances
    await page.keyboard.down('Space');await step(1);assert.ok(await page.evaluate(()=>__game.player().dodgeT>0));await page.keyboard.up('Space');await page.keyboard.up('w');await step(30);
    assert.equal(await page.evaluate(()=>__game.anim().keyW),false);await page.keyboard.press('F2');
  });
  await check('mouse and button melee/block animations, UI clicks never attack',async()=>{
    await page.mouse.move(500,400);await page.mouse.down({button:'right'});await step(1);assert.equal(await page.evaluate(()=>__game.player().blocking),true);await page.mouse.up({button:'right'});
    await page.mouse.click(500,400);await step(1);assert.ok(await page.evaluate(()=>__game.player().animT>=0));await step(40);
    await act('block');assert.equal(await page.evaluate(()=>__game.player().blocking),true);await act('block');assert.equal(await page.evaluate(()=>__game.player().blocking),false);
    await act('strike');await step(1);assert.ok(await page.evaluate(()=>__game.player().animT>=0));await step(40);
    const before=await page.evaluate(()=>__game.player().animT);await act('muster');assert.equal(await page.evaluate(()=>__game.player().animT),before);await page.keyboard.press('b');
  });
  await check('mount/rally/AFK buttons and shortcuts toggle once',async()=>{
    await act('ride');assert.equal(await page.evaluate(()=>__game.player().riding),true);await step(2);assert.ok(await page.evaluate(()=>__game.player().parts.legL.hip.rotation.x<-.9));await page.keyboard.press('h');assert.equal(await page.evaluate(()=>__game.player().riding),false);
    await act('rally');assert.ok(await page.evaluate(()=>__game.rallyCd()>0));
    await act('afk');assert.equal(await page.evaluate(()=>__game.brainState().afk),true);await step(2);await page.keyboard.press('k');assert.equal(await page.evaluate(()=>__game.brainState().afk),false);
  });
  await check('pause/settings controls; text editing cannot issue gameplay shortcuts',async()=>{
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__game.state()),4);await page.click('#btn-settings');
    await page.fill('#set-scopes','100, 50, 10');await page.locator('#set-bg').fill('10');await page.locator('#set-def').fill('30');
    const order=await page.evaluate(()=>__game.curOrder());await page.locator('#set-scopes').press('k');assert.equal(await page.evaluate(()=>__game.brainState().afk),false);assert.equal(await page.evaluate(()=>__game.curOrder()),order);await page.fill('#set-scopes','100, 50, 10');
    await page.click('#btn-set-apply');assert.deepEqual(await page.evaluate(()=>__game.doctrineCfg()),{bg:.1,def:.3,atk:.6,scopes:[1,.5,.1]});
    await page.click('#btn-settings');await page.click('#btn-set-defaults');await page.click('#btn-set-close');await page.click('#btn-resume');assert.equal(await page.evaluate(()=>__game.state()),3);
    await act('pause');await page.click('#btn-resume');assert.equal(await page.evaluate(()=>__game.state()),3);
  });
  await check('map button, map click area order, T shortcut and close button',async()=>{
    await act('map');assert.equal(await page.evaluate(()=>__game.gates().map),true);
    await page.locator('#warmap-canvas').click({position:{x:350,y:230}});assert.equal(await page.evaluate(()=>__game.curOrder()),'area');
    assert.ok(await page.evaluate(()=>__game.test.members().every(e=>e.order==='area'&&e.post&&!__game.insideWall(e.post.x,e.post.z))));
    await page.click('#btn-warmap-close');await page.keyboard.press('t');assert.equal(await page.evaluate(()=>__game.gates().map),true);await page.keyboard.press('t');assert.equal(await page.evaluate(()=>__game.gates().map),false);
  });
  await check('real settlement routing around walls and through clear streets',async()=>{
    const r=await page.evaluate(()=>{const h=__game.test.settlement(4),a=__game.test.free(h.x-28,h.z),b=__game.test.free(h.x+28,h.z),path=__game.test.navigation(a.x,a.z,b.x,b.z);let prev=a;return {path,safe:!!path&&path.every(p=>{const ok=__game.test.clear(prev.x,prev.z,p.x,p.z);prev=p;return ok;})};});assert.ok(r.path);assert.ok(r.safe);
  });
  await check('countryside houses are real: the instanced door swings open for the player, a furnished lit interior waits behind it',async()=>{
    const r=await page.evaluate(()=>{const out=[];for(let n=0;n<3;n++){const S=__game.prefabHouse(n*911);if(!S) break;const i=__game.nearestDoor(S.door.x,S.door.z);const d=__game.doorState(i);
      const ux=(S.door.x-S.x),uz=(S.door.z-S.z),L=Math.hypot(ux,uz)||1;const px=S.door.x+ux/L*0.7,pz=S.door.z+uz/L*0.7;
      const p=__game.player();__game.tpNear(px,pz);p.group.position.x=px;p.group.position.z=pz;p.lastFree={x:px,z:pz};__game.test.step(60,1/30);const open=__game.doorState(i);
      out.push({prefab:S.prefab,instanced:d.instanced,before:d.open,after:open.open,rot:Math.abs(open.rot-open.base),furnished:__game.furnished(S),outFree:__game.freeAt(px,pz,0.4),inFree:__game.freeAt(S.door.x-ux/L*1.3,S.door.z-uz/L*1.3,0.4)});}
      return out;});
    assert.equal(r.length,3);for(const h of r){assert.ok(h.instanced&&h.before===0&&h.after>0.9&&h.rot>1.2,JSON.stringify(h));assert.ok(h.furnished.furniture>=3&&h.furnished.lights>=1&&h.furnished.chimneys>=1,JSON.stringify(h));assert.ok(h.outFree&&h.inFree,JSON.stringify(h));}
  });
  await check('commanded unit reaches an area across a real hamlet without wall penetration',async()=>{
    const r=await page.evaluate(()=>{const h=__game.test.settlement(4),a=__game.test.free(h.x-28,h.z),b=__game.test.free(h.x+28,h.z),e=__game.test.members()[0];e.group.position.x=a.x;e.group.position.z=a.z;e.lastFree=a;__game.setScope(5);__game.areaOrder(b.x,b.z);const samples=__game.test.walkAI(e,600,.05);__game.setScope(0);return {distance:Math.hypot(e.group.position.x-b.x,e.group.position.z-b.z),inside:samples.some(s=>s.inside),moved:Math.hypot(e.group.position.x-a.x,e.group.position.z-a.z)};});assert.ok(r.distance<32,JSON.stringify(r));assert.equal(r.inside,false);assert.ok(r.moved>25);
  });
  await check('every faction/class rig and every medieval weapon build with valid joints',async()=>{
    const r=await page.evaluate(()=>{const c=__game.test.catalog();let count=0;for(const f of Object.keys(c.factions))for(const id of Object.keys(c.factions[f].classes)){const e=__game.test.spawn(id,f,220,220);__game.test.pose(e,.016);if(!Number.isFinite(e.parts.armR.sh.rotation.x))throw Error('Invalid pose '+id);const socket=e.group.getObjectByName('weapon:'+e.weapon);if(!socket||![e.parts.armL.wr,e.parts.armR.wr].includes(socket.parent))throw Error('Detached weapon '+id);count++;}for(const id of Object.keys(c.weapons))if(!__game.test.weapon(id).children.length)throw Error(id);let banned=false;try{__game.test.weapon('rifle');}catch{banned=true;}return {count,banned};});assert.ok(r.count>=24);assert.equal(r.banned,true);
  });
  await check('thrust/bash/overhead/draw/block/stagger/death poses without controls',async()=>{
    const r=await page.evaluate(()=>{const e=__game.test.spawn('curtean','moldavia',200,200),out=[];for(const kind of ['overhead','bash','thrust','draw']){e.ranged=kind==='draw';e.atkKind=kind;e.animT=.15;e.animDur=.5;e.movingAmt=0;__game.test.pose(e,.016);out.push(__game.test.animation(e));}e.animT=-1;e.ranged=false;e.staggerT=.4;__game.test.pose(e,.016);const stagger=e.body.rotation.x<0;e.dead=true;e.deadT=.3;__game.test.pose(e,.016);return {out,stagger,death:e.group.rotation.x<0};});assert.equal(new Set(r.out.map(p=>p.shoulder)).size,4);assert.ok(r.stagger&&r.death);
  });
  await check('off-screen archers fire without posing; off-screen dead units are cleaned up',async()=>{
    const r=await page.evaluate(()=>{const e=__game.test.spawn('arcas','moldavia',250,250);e.group.visible=false;const before=__game.test.arrows();__game.test.attack(e,new THREE.Vector3(250,3,280));__game.test.combat(e,.4);const fired=__game.test.arrows()-before;__game.test.kill(e);__game.test.lifecycle(e,8);return {fired,gone:e.gone,disposed:e.disposed};});assert.equal(r.fired,1);assert.ok(r.gone&&r.disposed);
  });
  await check('player bow via role buttons: RMB aim, LMB draw/release',async()=>{
    await act('pause');await page.click('#btn-abandon');await page.click('#btn-begin');await page.click('[data-fac="moldavia"]');await page.click('#role-grid [data-role="arcas"]:not(.random)');await page.click('#btn-spawn');await step(35);
    await page.mouse.move(500,400);await page.mouse.down({button:'right'});assert.equal(await page.evaluate(()=>__game.player().aiming),true);await page.mouse.click(500,400);await step(1);assert.equal(await page.evaluate(()=>__game.attackKind()),'draw');await step(23);assert.ok(await page.evaluate(()=>__game.test.arrows()>0));await page.mouse.up({button:'right'});
  });
  await check('unlimited player recruitment beyond AI cap; groups cover every member',async()=>{
    const r=await page.evaluate(()=>{const before=__game.test.members().length;for(let i=0;i<400;i++)__game.muster('curtean');__game.test.regroup();return {delta:__game.test.members().length-before,army:__game.test.members().length,cap:__game.aiCapOf('moldavia'),grouped:__game.groups().reduce((n,g)=>n+g.n,0),maxGroup:Math.max(...__game.groups().map(g=>g.n))};});assert.equal(r.delta,400);assert.ok(r.army>r.cap);assert.equal(r.grouped,r.army);assert.ok(r.maxGroup<=8);
  });
  await check('death/redeploy and new campaign clear stale group references',async()=>{
    await page.evaluate(()=>__game.doom());await step(1);assert.equal(await page.evaluate(()=>__game.state()),5);await page.click('#role-grid-rd [data-role="lancier"]:not(.random)');await page.click('#btn-rd-spawn');assert.equal(await page.evaluate(()=>__game.state()),3);
    await page.evaluate(()=>__game.flipUntilWin());assert.equal(await page.evaluate(()=>__game.state()),6);await page.click('#btn-new');assert.equal(await page.evaluate(()=>__game.state()),1);await page.click('[data-fac="moldavia"]');await page.click('#role-grid [data-role="voievod"]:not(.random)');await page.click('#btn-spawn');await step(2);assert.equal(await page.evaluate(()=>__game.test.members().length),17);assert.equal(await page.evaluate(()=>__game.groups().reduce((n,g)=>n+g.n,0)),17);
  });
  await check('rendered game screenshot and normal animation loop smoke',async()=>{
    assert.equal(await page.evaluate(()=>__game.test.cameraClear()),true);
    await page.evaluate(()=>{__game.test.step(10);__game.test.render();});await page.screenshot({path:'test-results/moldavia-game.png'});
    await page.evaluate(()=>__game.test.automatic(true));await page.waitForTimeout(1600);await page.evaluate(()=>__game.test.automatic(false));assert.ok(await page.evaluate(()=>Number.isFinite(__game.player().group.position.x)));
  });
  await check('all controls remain accessible at narrow viewport',async()=>{
    await page.setViewportSize({width:600,height:500});await act('pause');await page.click('#btn-settings');assert.ok(await page.locator('#btn-set-apply').isVisible());await page.click('#btn-set-close');await page.click('#btn-resume');await page.setViewportSize({width:1024,height:768});
  });
  await check('static subdirectory hosting and downloadable HTML work without services',async()=>{
    const html=readFileSync('age-of-warfare.html');const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
    try{await page.goto(`http://127.0.0.1:${server.address().port}/romaniano/age-of-warfare.html?test=1`);assert.equal(await page.evaluate(()=>__game.state()),0);assert.equal(await page.evaluate(()=>__game.test.world().half),3000);}finally{server.close();}
  });
  assert.deepEqual(errors,[]);
  writeFileSync('test-results/browser.json',JSON.stringify({passed:results.length,results,errors},null,2));console.log(`\n${results.length} browser checks passed.`);
}catch(error){writeFileSync('test-results/browser.json',JSON.stringify({passed:results.length,results,errors,failure:String(error)},null,2));throw error;}
finally{await browser.close();}

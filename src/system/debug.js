/* ---------------- debug / test hook ---------------- */
window.__game={
  begin:function(fac, role){
    selectedFaction=fac; selectedRole=role; curFaction=fac; beginCampaign();
  },
  classes:function(f){ return Object.keys(FACS[f].classes); },
  facKeys:function(){ return FAC_KEYS.slice(); },
  state:function(){ return state; },
  player:function(){ return player; },
  anim:function(){ return player?{amt:player.movingAmt, rate:player.walkRate, walk:player.walk, keyW:!!keys.KeyW, kneeL:player.parts.legL.knee.rotation.x, hipL:player.parts.legL.hip.rotation.x, elL:player.parts.armL.el.rotation.x}:null; },
  entities:entities,
  kills:function(){ return kills; },
  score:function(){ return score; },
  gold:function(f){ return Math.floor(EC[f||playerTeam].gold); },
  addGold:function(v){ EC[playerTeam].gold+=v; },
  owned:function(){ return ownedCounts(); },
  teamCount:function(f){ return teamAliveCount(f); },
  muster:function(key){ return doMuster(playerTeam, key, true); },
  captureTick:function(){ captureTick(); },
  incomeTick:function(){ incomeTick(); },
  setZone:function(zi, fac){ var old=zones[zi].owner; zones[zi].owner=fac; reassignWorkers(zi, fac, old);
    if(old===playerTeam && fac!==playerTeam){ pendingAlerts.push({zi:zi, t:gameTime}); }
    checkDomination(); },
  zoneInfo:function(zi){ var inf={}; FAC_KEYS.forEach(function(f){ inf[f]=zones[zi].inf[f]; });
    return {owner:zones[zi].owner, inf:inf, core:zones[zi].core, bonus:zones[zi].bonus}; },
  zoneIdxAt:zoneIdxAt,
  marchTo:function(x,z){
    var spot=findFreeSpot(x,z,0.6);
    player.group.position.x=spot.x; player.group.position.z=spot.z;
  },
  spawnHostileNear:function(kind){
    var other=FAC_KEYS.filter(function(f){ return f!==playerTeam; })[0];
    var okey=Object.keys(FACS[other].classes)[0];
    var p=player.group.position;
    return spawnCharacter(okey, other, p.x, p.z-2.4);
  },
  dragLook:function(){ return dragLook; },
  forceLook:function(){ dragLook=true; },
  setTimeOfDay:function(h){ DN.t=clamp(h,0,24)/24; },
  dayNight:function(){ return {t:+DN.t.toFixed(3), night:+DN.night.toFixed(3)}; },
  landmarkCount:function(){ return LANDMARKS.length; },
  loreAll:function(){ return LANDMARKS.map(function(l){ return l.key; }); },
  lore:function(){ return loreNow?{key:loreNow.key, name:loreNow.name, shown:hudEls.lore.classList.contains('show')}:null; },
  tpNear:function(x,z){ player.group.position.x=x; player.group.position.z=z; },
  fxStats:function(){ return {slashes:fxStats.slashes, rings:fxStats.rings, live:slashes.length}; },
  rally:function(){ return doRally(); },
  rallyCd:function(){ return +rallyCd.toFixed(1); },
  critterCount:function(){ return critters.length; },
  wolves:function(){ var n=0; entities.forEach(function(en){ if(en.kind==='wolf'&&!en.dead) n++; }); return n; },
  wolfNear:function(){ if(!player) return null; var a=rand(0,TAU); spawnWolf(player.group.position.x+Math.cos(a)*26, player.group.position.z+Math.sin(a)*26); return true; },
  chestInfo:function(i){ var c=chests[i||0]; return c?{x:c.x, z:c.z, open:c.open}:null; },
  attackKind:function(){ return player?player.atkKind||null:null; },
  camPose:function(x,y,z,tx,ty,tz){ camera.position.set(x,y,z); camera.lookAt(tx,ty,tz); },
  issueOrder:function(o){ return issueOrder(o); },
  buildings:function(){ return BUILD_COUNT; },
  setScope:function(i){ cmdScopeIdx=clamp(i,0,SCOPES.length-1); return SCOPES[cmdScopeIdx]; },
  scope:function(){ return SCOPES[cmdScopeIdx]; },
  doctrine:function(){ var r={bodyguard:0,defender:0,attacker:0};
    entities.forEach(function(e){ if(!e.dead&&e.team===playerTeam&&e.role) r[e.role]++; });
    return r; },
  defenderPosts:function(){ var out=[];
    entities.forEach(function(e){ if(!e.dead&&e.role==='defender'&&e.post) out.push(zoneIdxAt(e.post.x,e.post.z)); });
    return out; },
  alerts:function(){ return pendingAlerts.length; },
  attackerTarget:function(){ var e=entities.find(function(x){ return !x.dead&&x.role==='attacker'; });
    return e?(e.atkTarget!==null&&e.atkTarget!==undefined?e.atkTarget:-1):-2; },
  secureInfo:function(){ var e=entities.find(function(x){ return !x.dead&&x.role==='attacker'&&x.secureT>0; });
    return e?+e.secureT.toFixed(0):null; },
  economy:function(){ return {rate:+incomeRate(playerTeam).toFixed(2),
    sites:SITES.length, byType:(function(){ var t={}; SITES.forEach(function(s){ if(zones[s.zi].owner===playerTeam) t[s.type]=(t[s.type]||0)+1; }); return t; })()}; },
  slashLast:function(){ return window.__lastSlash||null; },
  aiCapOf:function(f){ return aiCap(f); },
  setDoctrine:function(bg,def){ return applyDoctrineCfg(bg,def,null); },
  setScopes:function(a){ return applyDoctrineCfg(DOCTRINE.bg, DOCTRINE.def, a); },
  autobuy:function(on, key){ AUTOBUY.on=!!on; if(key) AUTOBUY.key=key; autobuyKey(); updAutobuyUI();
    if(on) autobuyTick(); return {on:AUTOBUY.on, key:AUTOBUY.key}; },
  autobuyStep:function(){ autobuyT=0; autobuyTick(); return {on:AUTOBUY.on, army:teamAliveCount(playerTeam), gold:Math.floor(EC[playerTeam].gold)}; },
  afk:function(v){ toggleAfk(v); return {afk:afkMode, goal:brainGoal}; },
  brainStep:function(){ brainT=0; brainCmdT=0; brainTick(1.2); return {afk:afkMode, goal:brainGoal, order:curOrder,
    px:+player.group.position.x.toFixed(1), pz:+player.group.position.z.toFixed(1), yaw:+camYaw.toFixed(2)}; },
  areaOrder:function(x,z){ return issueAreaOrder(x,z); },
  insideWall:function(x,z){ var p={x:x, z:z}; collideCircle(p, 0.5);
    return Math.abs(p.x-x)>0.05 || Math.abs(p.z-z)>0.05; },
  brainState:function(){ return {afk:afkMode, autobuy:AUTOBUY.on, goal:brainGoal, order:curOrder, intent:brainIntent, riding:player?!!player.riding:false}; },
  groups:function(){ return GROUPS.map(function(g){ return {id:g.id, n:g.members.length, task:g.task,
    atk:g.atkTarget===null?null:g.atkTarget, post:g.post?{x:Math.round(g.post.x), z:Math.round(g.post.z)}:null,
    seen:g.seen, x:Math.round(g.members[0]?g.members[0].group.position.x:0), z:Math.round(g.members[0]?g.members[0].group.position.z:0), ms:g.members}; }); },
  ride:function(v){ return toggleRide(v); },
  openPause:function(){ pauseGame(); return state; },
  curOrderGet:function(){ return curOrder; },
  hint:function(){ return {text:hudEls.hint.textContent, shown:hudEls.hint.classList.contains('show')}; },
  yaw:function(){ return +camYaw.toFixed(3); },
  gates:function(){ return {rec:recruitOpen, map:warmapOpen, set:settingsOpen, st:state, afk:afkMode,
    gold:Math.floor(EC[playerTeam].gold), army:playerUnits().length}; },
  doctrineCfg:function(){ return {bg:DOCTRINE.bg, def:DOCTRINE.def, atk:+(1-DOCTRINE.bg-DOCTRINE.def).toFixed(3), scopes:SCOPES.slice()}; },
  settings:function(v){ if(v!==undefined) toggleSettings(v); return settingsOpen; },
  coverage:function(){ var cz=window.__contentZi||{}, cov=0;
    for(var i=0;i<zones.length;i++){ if(cz[i]||zones[i].core||zones[i].bonus) cov++; }
    return {covered:cov, total:zones.length, wilds:window.__wildsN||0}; },
  distIM:function(){ var n=0, vis=0;
    scene.children.forEach(function(c){ if(c.isInstancedMesh&&c.name==='always'){ n++; if(c.visible) vis++; } });
    return {n:n, visible:vis}; },
  lookAtWorld:function(x,z){ if(!player) return; camYaw=Math.atan2(x-player.group.position.x, z-player.group.position.z); camPitch=0.06; },
  districts:function(){ return DISTRICT_C.map(function(d){ return {x:d.x, z:d.z}; }); },
  cullNow:function(){ cullTick(); return cullStatics.length; },
  camAt:function(x,y,z,tx,ty,tz){ camera.position.set(x,y,z); camera.lookAt(tx,ty,tz); camera.updateMatrixWorld(true); return true; },
  tickAmbient:function(dt){ updateAmbient(dt||0.016); return DN.t; },
  /* living buildings: doors, lights, chimneys, moving parts, registered structures */
  buildingsLive:function(){ var ent=0; STRUCTURES.forEach(function(S){ if(S.enterable) ent++; });
    return {doors:DOORS.length, structures:STRUCTURES.length, enterable:ent, lights:LIGHT_SRC.length, chimneys:CHIMNEYS.length,
      anim:ANIM_PARTS.length, colliders:colliders.length, roads:roadStats, sites:SITES.length, districts:DISTRICT_C.length, waters:waterSurfaces.length, bridges:BRIDGES.length,
      flags:FLAG_PARTS.length, beacons:BEACON_PARTS.length, villages:VILLAGES.length, rivers:RIVERS.length, rbl:RBL_STATS, junctions:ROAD_JUNCTIONS.length,
      fords:BRIDGES.filter(function(b){ return b.ford; }).length, waystations:SITES_DEF.filter(function(s){ return s.kind==='waystation'; }).length}; },
  /* NO-CLIP audit (spec §14 QA): probe the four faces of every registered box structure at four heights' worth of
     inset points — a wall must be solid just inside its face, the door opening must be free. Returns the offenders. */
  noclipAudit:function(){ var bad=[], ok=0;
    STRUCTURES.forEach(function(S){ if(!S.enterable||!S.hx||!S.hz||S.kind==='tent'||S.rot) return;   /* rotated gatehouses are probed by the entrance check instead */
      var faces=[[0,-1],[0,1],[-1,0],[1,0]], solid=0, i, k;
      for(i=0;i<faces.length;i++){ var n=faces[i], fx0=S.x+n[0]*S.hx, fz0=S.z+n[1]*S.hz;
        if(S.kind==='gate' && ((S.passage||'z')==='z'?n[0]===0:n[1]===0)){ solid++; continue; }   /* the passage is the door of a gatehouse */
        if(S.door&&Math.hypot(fx0-S.door.x,fz0-S.door.z)<(S.dw||1.6)/2+1.4){ solid++; continue; }
        if(S.back&&Math.hypot(fx0-S.back.x,fz0-S.back.z)<(S.dw||1.6)/2+1.4){ solid++; continue; }   /* back doors are doors too */
        var hit=false; for(k=0;k<4&&!hit;k++){ var ins=[0.15,0.45,0.8,1.2][k]; if(insideSolid(fx0-n[0]*ins,fz0-n[1]*ins,0.1)) hit=true; }
        if(hit) solid++; }
      if(solid===4) ok++; else bad.push({name:S.name, kind:S.kind, x:Math.round(S.x), z:Math.round(S.z), solidFaces:solid}); });
    return {ok:ok, bad:bad.slice(0,20), badN:bad.length}; },
  roadProbe:function(n){ /* draped ribbons: sampled road points must sit on walkable ground (no water, finite height) */
    var wet=0, tot=0, i; for(i=0;i<ROADS.length;i+=Math.max(1,Math.floor(ROADS.length/(n||60)))){ var R=ROADS[i]; for(var j=0;j<R.pts.length;j+=4){ var p=R.pts[j]; tot++; var rf=riverField(p[0],p[1]); if(rf.river&&rf.d<riverHalfWidth(rf.river,p[1])*0.9){ var nb=false; for(var k=0;k<BRIDGES.length;k++) if(Math.hypot(BRIDGES[k].x-p[0],BRIDGES[k].z-p[1])<BRIDGES[k].len/2+8) nb=true; if(!nb) wet++; } } }
    return {sampled:tot, wet:wet}; },
  structures:function(){ return STRUCTURES.map(function(S){ return {name:S.name, kind:S.kind, x:+S.x.toFixed(1), z:+S.z.toFixed(1), hx:+S.hx.toFixed(1), hz:+S.hz.toFixed(1), door:S.door?{x:+S.door.x.toFixed(2), z:+S.door.z.toFixed(2)}:null, dw:S.dw||0, enterable:!!S.enterable, fac:S.fac||null}; }); },
  doorState:function(i){ var D=DOORS[i]; return D?{x:D.x, z:D.z, open:+D.open.toFixed(3), rot:+D.g.rotation.y.toFixed(3), base:+D.base.toFixed(3)}:null; },
  nearestDoor:function(x,z){ var best=-1, bd=1e18; for(var i=0;i<DOORS.length;i++){ var d=(DOORS[i].x-x)*(DOORS[i].x-x)+(DOORS[i].z-z)*(DOORS[i].z-z); if(d<bd){ bd=d; best=i; } } return best; },
  paneGlow:function(){ return +PANE_MAT.emissiveIntensity.toFixed(3); },
  poolLights:function(){ return BLD.lights.filter(function(L){ return L.visible; }).map(function(L){ return {x:+L.position.x.toFixed(1), z:+L.position.z.toFixed(1), i:+L.intensity.toFixed(2)}; }); },
  smokeAlive:function(){ return BLD.smoke.filter(function(q){ return q.life>0; }).length; },
  sceneStats:function(){ var n=0, tri=0, im=0; scene.traverse(function(o){ if(o.isMesh){ n++; var g=o.geometry; if(g&&g.attributes&&g.attributes.position){ var c=g.index?g.index.count/3:g.attributes.position.count/3; if(o.isInstancedMesh){ im++; tri+=c*o.count; } else tri+=c; } } }); return {meshes:n, instanced:im, tris:Math.round(tri)}; },
  groundAt:function(x,z){ return +groundH(x,z).toFixed(3); },
  freeAt:function(x,z,r){ return !insideSolid(x,z,r||0.4); },
  townData:function(f){ var td=townData[f]; return td?{hall:td.hall, barracks:td.barracks, temple:td.temple, r:td.r}:null; },
  glInfo:function(){ return {calls:renderer.info.render.calls, tris:renderer.info.render.triangles}; },
  fpInfo:function(){ var wd=null;
    if(fpWeapon){ var wp=new THREE.Vector3(); fpWeapon.getWorldPosition(wp); var pj=wp.clone().project(camera);
      var mesh=null; fpWeapon.traverse(function(o){ if(o.isMesh&&!mesh){ o.geometry.computeBoundingSphere();
        mesh={r:+o.geometry.boundingSphere.radius.toFixed(3), vis:o.visible, fog:o.material.fog}; } });
      wd={x:+wp.x.toFixed(2), y:+wp.y.toFixed(2), z:+wp.z.toFixed(2), ndcX:+pj.x.toFixed(2), ndcY:+pj.y.toFixed(2), ndcZ:+pj.z.toFixed(2),
        nan:![wp.x,wp.y,wp.z].every(isFinite), vis:fpWeapon.visible, kids:fpWeapon.children.length, mesh:mesh}; }
    return {weaponCam:!!(fpWeapon&&fpWeapon.parent===camera&&fpWeapon.visible), shield:fpShieldG?fpShieldG.visible:null,
      camDist:player?+camera.position.distanceTo(player.group.position).toFixed(2):null, weapon:wd}; },
  curOrder:function(){ return curOrder; },
  army:function(){ var n=0, following=0;
    entities.forEach(function(e){ if(!e.dead&&!e.civ&&!e.isPlayer&&e.team===playerTeam){ n++; if(e.order) following++; } });
    return {total:n, ordered:following, order:curOrder}; },
  villages:function(){ return VILLAGES.length; },
  workerInfo:function(){ var t=0,a=0,working=0,tc={};
    entities.forEach(function(e){ if(e.kind==='worker'&&!e.dead){ t++; if(e.armed)a++; if(e.bend>0)working++;
      tc[e.team]=(tc[e.team]||0)+1; } });
    return {total:t, armored:a, working:working, teams:tc}; },
  relicInfo:function(){ var t=0; relics.forEach(function(R){ if(R.taken)t++; });
    return {total:relics.length, taken:t, dmg:player?Math.round(player.dmg):0, spd:player?+player.speed.toFixed(2):0, maxHp:player?player.maxHp:0}; },
  zoneTotal:function(){ return zones.length; },
  villageNameAt:villageNameAt,
  doom:function(){ var p=player; if(!p||p.dead) return false;
    var w=spawnWolf(p.group.position.x+0.6, p.group.position.z+0.6);
    damageEntity(p, 99999, p.group.position.x+1, p.group.position.z, w);
    return p.dead; },
  marchCooldown:function(){ return marchCooldown; },
  flipUntilWin:function(){
    var oc=ownedCounts();
    for(var i=0;i<zones.length && oc[playerTeam]<WIN_ZONES+2;i++){
      if(zones[i].owner!==playerTeam){ zones[i].owner=playerTeam; oc=ownedCounts(); }
    }
    checkDomination();
  }
};

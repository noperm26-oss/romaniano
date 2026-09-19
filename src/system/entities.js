/* ---------------- entities ---------------- */
function defFor(e){
  if(e.faction!=='enemy' && RECRUIT_DEFS[e.team] && RECRUIT_DEFS[e.team][e.kind]) return RECRUIT_DEFS[e.team][e.kind];
  return FACS[e.team].classes[e.kind] || FACS[e.team].classes[Object.keys(FACS[e.team].classes)[0]];
}
function spawnCharacter(kind, team, x, z, opts){
  opts=opts||{};
  /* v9: a NaN coordinate must never become a position (poisons zone lookups, minimap, capture) */
  if(!isFinite(x)||!isFinite(z)){
    var T0=TOWNS[team]||{x:0,z:0};
    x=T0.x; z=T0.z;
  }
  var def=defFor({team:team, kind:kind, faction:(team===playerTeam?'player':'ally')});
  var spec=def.spec;
  var built=buildCharacter(spec);
  var e={
    kind:kind, team:team, faction:(team===playerTeam?'player':'ally'),
    group:built.group, body:built.body, parts:built.parts,
    mats:built.mats, weapon:built.weapon, ranged:built.ranged,
    weaponMesh:built.weaponMesh||null,
    animationProfile:spec.animation||'warrior',
    yaw:0, walk:rand(0,6), movingAmt:0,
    dead:false, deadT:0, gone:false, passive:!!opts.passive,
    animT:-1, animDur:0.45, hitDone:true,
    atkT:rand(0,0.5), flashT:0, staggerT:0, invulnT:0,
    target:null, retargetT:0, isPlayer:false,
    isCommander:kind==='champion',
    blocking:false, blockStat:def.block||0, scale:1, name:def.name,
    goal:null, home:{x:x,z:z}, walkRate:0, hasShield:!!def.spec.shield
  };
  if(opts.statMul){
    e.maxHp=Math.round(def.hp*opts.statMul); e.dmg=Math.round(def.dmg*opts.statMul);
  } else {
    e.maxHp=def.hp; e.dmg=def.dmg;
  }
  e.hp=e.maxHp;
  e.speed=def.speed; e.range=def.range; e.cd=def.cd;
  e.animDur=Math.min(0.5, def.cd*0.72);
  e.scoreVal=opts.scoreVal||100;
  var free=findFreeSpot(x,z,0.55);x=free.x;z=free.z;
  e.group.position.set(x, groundH(x,z), z);
  collideCircle(e.group.position, 0.5);
  scene.add(e.group);
  var barCol=0xe03131;
  if(playerTeam){
    if(e.team===playerTeam) barCol=e.isPlayer?0xf1c40f:0x37b24d;
  }
  var bar=makeBar(barCol, e.isCommander?1.4:0.95);
  bar.grp.position.set(x, e.group.position.y+2.3, z);
  bar.grp.visible=!opts.passive;
  e.barBase=!opts.passive;
  scene.add(bar.grp);
  e.bar=bar;
  entities.push(e);
  return e;
}
function clearEntities(){
  entities.forEach(function(e){
    disposeEntity(e);
  });
  entities.length=0;
  GROUPS.length=0; groupSeq=1; groupT=0; lastAreaOrder=null; pendingAlerts.length=0;
  arrows.forEach(function(a){ a.active=false; a.mesh.visible=false; });
  player=null;
}


function disposeEntity(e){
  if(e.disposed)return;e.disposed=true;
  var materials=new Set(),geometries=new Set();
  [e.group,e.bar&&e.bar.grp].forEach(function(root){
    if(!root)return;scene.remove(root);root.traverse(function(o){
      if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){materials.add(m);});
      if((o.isMesh||o.isLine)&&o.geometry&&!o.geometry.userData.shared)geometries.add(o.geometry);
    });
  });
  var shared=new Set(Object.values(matCache));
  materials.forEach(function(m){if(!shared.has(m))m.dispose();});geometries.forEach(function(g){g.dispose();});
}
function updateEntityLifecycle(e,dt){
  if(e.dead){
    e.deadT+=dt;
    if(e.deadT>6)e.group.position.y-=dt*0.85;
    if(e.deadT>7.2){disposeEntity(e);e.gone=true;}
  } else {
    e.group.position.y=groundH(e.group.position.x,e.group.position.z);
    if(e.flashT>0){e.flashT=Math.max(0,e.flashT-dt);e.mats.forEach(function(m){m.emissive.setHex(e.flashT>0?0x6e1a1a:0);});}
    e.blockKick=Math.max(0,(e.blockKick||0)-dt*3.2);
  }
}

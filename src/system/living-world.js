function spawnWildlife(){
  var herds=[[2600,-900],[-2200,1500],[900,-2600],[-900,2600]];
  herds.forEach(function(h){
    for(var i=0;i<4;i++) makeCritter('deer', h[0]+rand(-14,14), h[1]+rand(-14,14));
  });
  FAC_KEYS.forEach(function(f){
    var T=TOWNS[f];
    var dl=Math.sqrt(T.x*T.x+T.z*T.z)||1;
    var gx=T.x-T.x/dl*230, gz=T.z-T.z/dl*230;
    for(var i=0;i<3;i++) makeCritter('sheep', gx+rand(-26,26), gz+rand(-26,26));
    for(var b=0;b<2;b++) makeCritter('bird', T.x, T.z, f);
  });
}

function spawnWolf(x,z){
  var spot=findFreeSpot(x,z,0.5);x=spot.x;z=spot.z;
  var built=buildWolfCharacter(),g=built.group,legs=built.legs,y=groundH(x,z);
  g.position.set(x,y,z);
  var e={
    kind:'wolf', team:'wolf', faction:'enemy', group:g, parts:{}, body:null, mats:built.mats,
    weapon:'bite', ranged:false, yaw:rand(0,TAU), walk:0, movingAmt:0,
    dead:false, deadT:0, gone:false, passive:false, civ:false,
    animT:-1, animDur:0.4, hitDone:true, atkT:rand(0.2,0.8), flashT:0, staggerT:0, invulnT:0,
    target:null, retargetT:0, isPlayer:false, isCommander:false,
    blocking:false, blockStat:0, scale:1, name:'Wolf',
    goal:null, home:{x:x,z:z}, walkRate:0, hasShield:false, rallyT:0, blockKick:0,
    maxHp:34, hp:34, dmg:8, speed:7.2, range:1.5, cd:1.1, scoreVal:40,
    legs:legs
  };
  var bar=makeBar(0xe03131, 0.7);
  bar.grp.position.set(x, y+1.6, z); scene.add(bar.grp);
  e.bar=bar; e.barBase=true;
  scene.add(g); entities.push(e);
  return e;
}
function updateWolf(e,dt){
  if(e.dead){updateWolfPose(e,dt);return;}
  e.atkT-=dt;
  var p=e.group.position;
  var townD=1e9, tdx=0, tdz=0;
  FAC_KEYS.forEach(function(fk){
    var T=TOWNS[fk];
    var dx=p.x-T.x, dz=p.z-T.z, d=Math.sqrt(dx*dx+dz*dz);
    if(d<townD){ townD=d; tdx=dx/(d||1); tdz=dz/(d||1); }
  });
  var nearest=null, nd=1e9;
  for(var i=0;i<entities.length;i++){
    var t=entities[i];
    if(t.dead||t.team==='wolf') continue;
    var ntx=t.group.position.x-p.x, ntz=t.group.position.z-p.z, ntd=ntx*ntx+ntz*ntz;
    if(ntd<nd){ nd=ntd; nearest=t; }
  }
  var hunt=nearest&&nd<42*42;
  var mvx=0,mvz=0,spd=e.speed;
  if(townD<120 && !hunt){ mvx=tdx; mvz=tdz; spd=e.speed*0.8; e.yaw=turnTo(e.yaw, Math.atan2(tdx,tdz), 4*dt); }
  else if(hunt){
    var nd1=Math.sqrt(nd)||1;
    var hx=(nearest.group.position.x-p.x)/nd1, hz=(nearest.group.position.z-p.z)/nd1;
    e.yaw=turnTo(e.yaw, Math.atan2(hx,hz), 6*dt);
    if(nd1>e.range*0.8){ mvx=hx; mvz=hz; }
    else if(e.atkT<=0){
      e.atkT=e.cd;
      damageEntity(nearest, e.dmg*rand(0.85,1.15), p.x, p.z, e);
      Snd.tone(320,140,0.12,'square',0.12);
    }
  } else {
    if(!e.goal || ((e.goal.x-p.x)*(e.goal.x-p.x)+(e.goal.z-p.z)*(e.goal.z-p.z))<9){
      e.goal={x:p.x+rand(-60,60), z:p.z+rand(-60,60)};
    }
    var gx=e.goal.x-p.x, gz=e.goal.z-p.z, gl=Math.sqrt(gx*gx+gz*gz)||1;
    mvx=gx/gl; mvz=gz/gl; spd=e.speed*0.45;
    e.yaw=turnTo(e.yaw, Math.atan2(gx,gz), 3*dt);
  }
  var ml=Math.sqrt(mvx*mvx+mvz*mvz);
  if(ml>0.01){
    moveWithCollision(p,mvx/ml*Math.min(ml,1)*spd*dt,mvz/ml*Math.min(ml,1)*spd*dt,0.45);
    collideCircle(p, 0.45);
  }
  p.y=groundH(p.x,p.z);
  e.movingAmt=ml>0.01?1:0;
  if(e.group.visible)updateWolfPose(e,dt);
}

function spawnVillager(x,z){
  var built=buildVillagerCharacter();
  var e={
    kind:'villager', team:'civ', faction:'neutral', group:built.group, body:built.body, parts:built.parts,
    mats:built.mats, weapon:built.weapon, ranged:built.ranged,
    yaw:rand(0,TAU), walk:rand(0,6), movingAmt:0,
    dead:false, deadT:0, gone:false, passive:false, civ:true,
    animT:-1, animDur:0.45, hitDone:true,
    atkT:rand(0,0.5), flashT:0, staggerT:0, invulnT:0,
    target:null, retargetT:0, isPlayer:false, isCommander:false,
    blocking:false, blockStat:0, scale:1, name:'Villager',
    goal:null, home:{x:x,z:z}, walkRate:0, hasShield:false, rallyT:0, blockKick:0,
    maxHp:24, hp:24, dmg:0, speed:2.1, range:0, cd:9, scoreVal:0
  };
  e.group.position.set(x, groundH(x,z), z);
  collideCircle(e.group.position, 0.4);
  var bar=makeBar(0x9a9078, 0.7); bar.grp.visible=false; scene.add(bar.grp);
  e.bar=bar; e.barBase=false;
  scene.add(e.group); entities.push(e);
  return e;
}
function findThreat(e, r){
  var best=null, bd=r*r;
  for(var i=0;i<entities.length;i++){
    var t=entities[i];
    if(t.dead||t.passive||t===e) continue;
    if(t.kind==='worker'&&!t.armed) continue;
    if(t.kind==='villager') continue;
    if(t.team===e.team) continue;
    var dx=t.group.position.x-e.group.position.x, dz=t.group.position.z-e.group.position.z, d2=dx*dx+dz*dz;
    if(d2<bd){ bd=d2; best=t; }
  }
  return best;
}
function nearWorker(e, r){
  var best=null, bd=r*r;
  for(var i=0;i<entities.length;i++){
    var t=entities[i];
    if(t.dead||t.kind!=='worker'||t.armed) continue;
    var dx=t.group.position.x-e.group.position.x, dz=t.group.position.z-e.group.position.z, d2=dx*dx+dz*dz;
    if(d2<bd){ bd=d2; best=t; }
  }
  return best;
}
function updateVillager(e,dt){
  var p=e.group.position;
  e.atkT-=dt;
  e.scanT=(e.scanT||0)-dt;
  if(e.scanT<=0){ e.scanT=0.45; e.threat=findThreat(e, 18); }
  var th=(e.threat&&!e.threat.dead)?e.threat:null;
  var mvx=0,mvz=0,spd=e.speed;
  if(th){
    var dx=th.group.position.x-p.x, dz=th.group.position.z-p.z, fd=Math.sqrt(dx*dx+dz*dz)||1;
    mvx=dx/fd; mvz=dz/fd; spd=e.speed*2.4;
    e.yaw=turnTo(e.yaw, Math.atan2(mvx,mvz), 7*dt);
  } else {
    if(!e.goal || ((e.goal.x-p.x)*(e.goal.x-p.x)+(e.goal.z-p.z)*(e.goal.z-p.z))<4){
      e.goal={x:e.home.x+rand(-30,30), z:e.home.z+rand(-30,30)};
    }
    var gx=e.goal.x-p.x, gz=e.goal.z-p.z, gl=Math.sqrt(gx*gx+gz*gz)||1;
    if(gl>1.2){ mvx=gx/gl; mvz=gz/gl; e.yaw=turnTo(e.yaw, Math.atan2(gx,gz), 4*dt); }
  }
  var ml=Math.sqrt(mvx*mvx+mvz*mvz);
  e.movingAmt=ml>0.05?1:0;
  e.walkRate=e.movingAmt?(fd<18*18?15:7):0;
  if(ml>0.05){
    moveWithCollision(p,mvx/ml*Math.min(ml,1)*spd*dt,mvz/ml*Math.min(ml,1)*spd*dt,0.45);
    collideCircle(p, 0.4);
  }
  e.bar.grp.visible=false;
}

function chestSpot(){
  for(var tries=0;tries<50;tries++){
    var x=rand(-2150,2150), z=rand(-2150,2150);
    if(Math.abs(x)<480 && Math.abs(z)<480) continue;
    var ok=true;
    FAC_KEYS.forEach(function(f){
      var T=TOWNS[f];
      var dx=x-T.x, dz=z-T.z;
      if(dx*dx+dz*dz<240*240) ok=false;
    });
    if(ok) return {x:x,z:z};
  }
  return {x:rand(-2000,2000), z:rand(-2000,2000)};
}
function placeChest(){
  var s=chestSpot(); var x=s.x, z=s.z;
  var g=new THREE.Group(); var y=groundH(x,z); g.position.set(x,y,z);
  g.add(box(0.9,0.5,0.62, NM(0x7a5230), 0,0.25,0));
  g.add(box(0.94,0.1,0.66, NM(0xc9a227), 0,0.52,0));
  var lid=box(0.9,0.2,0.62, NM(0x8a6a3c), 0,0.62,0); g.add(lid);
  g.add(box(0.16,0.18,0.06, NM(0xc9a227), 0,0.42,0.33));
  var glint=addFlame(x, y+1.15, z, 0.45); glint.scale.set(0.5,0.7,0.5);
  chests.push({grp:g, lid:lid, glint:glint, open:false, x:x, z:z, respawn:0});
  scene.add(g);
}
function spawnChests(){ for(var i=0;i<14;i++) placeChest(); }

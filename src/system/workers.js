function spawnWorkerAt(x,z,team,armed){
  var built=buildWorkerCharacter(armed);
  var e={
    kind:'worker', team:team||'neutral', faction:'ally',
    group:built.group, body:built.body, parts:built.parts, mats:built.mats,
    weapon:built.weapon, ranged:built.ranged,
    yaw:rand(0,TAU), walk:rand(0,6), movingAmt:0,
    dead:false, deadT:0, gone:false, passive:false, civ:true, armed:!!armed,
    animT:-1, animDur:0.45, hitDone:true, sndDone:true,
    atkT:rand(0,0.5), flashT:0, staggerT:0, invulnT:0,
    target:null, retargetT:0, isPlayer:false, isCommander:false,
    blocking:false, blockStat:0, scale:1, name:armed?'Foreman':'Worker',
    goal:null, home:{x:x,z:z}, walkRate:0, hasShield:false, rallyT:0, blockKick:0,
    maxHp:armed?85:24, hp:0, dmg:armed?13:0, speed:armed?3.4:2.1, range:armed?1.4:0, cd:armed?1.3:9,
    scoreVal:0, scanT:rand(0,0.4), threat:null, workT:rand(1,4), workSpot:null, earnT:6, bend:0
  };
  e.hp=e.maxHp;
  var free=findFreeSpot(x,z,0.45);x=free.x;z=free.z;
  e.group.position.set(x, groundH(x,z), z);
  collideCircle(e.group.position, 0.4);
  var bar=makeBar(armed?0xe0a020:0x9a9078, 0.7); bar.grp.visible=false; scene.add(bar.grp);
  e.bar=bar; e.barBase=false;
  scene.add(e.group); entities.push(e);
  return e;
}
function updateWorker(e,dt){
  var p=e.group.position;
  e.atkT-=dt;
  e.scanT-=dt;
  if(e.scanT<=0){ e.scanT=0.45; e.threat=findThreat(e, e.armed?17:21); }
  var th=(e.threat&&!e.threat.dead)?e.threat:null;
  var mvx=0,mvz=0,spd=e.speed, moving=false;
  if(e.armed && th){
    var tdx=th.group.position.x-p.x, tdz=th.group.position.z-p.z, td=Math.sqrt(tdx*tdx+tdz*tdz)||1;
    e.yaw=turnTo(e.yaw, Math.atan2(tdx,tdz), 6*dt);
    if(td>e.range*0.85){ mvx=tdx/td; mvz=tdz/td; spd=e.speed*2.1; moving=true; }
    else if(e.atkT<=0 && e.staggerT<=0){ beginAttack(e); }
    e.bend=0;
  } else if(th){
    var fdx=th.group.position.x-p.x, fdz=th.group.position.z-p.z, fd=Math.sqrt(fdx*fdx+fdz*fdz)||1;
    mvx=-fdx/fd; mvz=-fdz/fd; spd=e.speed*2.5; moving=true;
    e.yaw=turnTo(e.yaw, Math.atan2(mvx,mvz), 7*dt);
    e.bend=0;
  } else if(e.armed){
    if(!e.goal || ((e.goal.x-p.x)*(e.goal.x-p.x)+(e.goal.z-p.z)*(e.goal.z-p.z))<4){
      e.goal={x:e.home.x+rand(-16,16), z:e.home.z+rand(-16,16)};
    }
    var gx0=e.goal.x-p.x, gz0=e.goal.z-p.z, gl0=Math.sqrt(gx0*gx0+gz0*gz0)||1;
    if(gl0>1.4){ mvx=gx0/gl0; mvz=gz0/gl0; moving=true; e.yaw=turnTo(e.yaw, Math.atan2(gx0,gz0), 4*dt); }
    e.bend=0;
  } else {
    e.workT-=dt;
    if(e.workSpot){
      var wx=e.workSpot.x-p.x, wz=e.workSpot.z-p.z, wl=Math.sqrt(wx*wx+wz*wz)||1;
      if(wl>0.9){ mvx=wx/wl; mvz=wz/wl; moving=true; e.yaw=turnTo(e.yaw, Math.atan2(wx,wz), 4*dt); e.bend=0; }
      else {
        e.bend=0.45+Math.sin(gameTime*5+e.walk)*0.12;
        e.yaw=turnTo(e.yaw, Math.atan2(-wx,-wz), 2*dt);
        if(e.team && e.team!=='neutral'){
          e.earnT-=dt;
          if(e.earnT<=0){ e.earnT=6; if(EC[e.team]) EC[e.team].gold+=1; }
        }
      }
      if(e.workT<=0){ e.workSpot=null; e.workT=rand(4,9); }
    } else {
      e.bend=0;
      if(e.workT<=0){ e.workSpot={x:e.home.x+rand(-14,14), z:e.home.z+rand(-14,14)}; e.workT=rand(5,9); }
    }
  }
  var ml=Math.sqrt(mvx*mvx+mvz*mvz);
  e.movingAmt=moving?1:0;
  e.walkRate=moving?(th?15:7):0;
  if(ml>0.05){
    moveWithCollision(p,mvx/ml*Math.min(ml,1)*spd*dt,mvz/ml*Math.min(ml,1)*spd*dt,0.4);
    collideCircle(p, 0.4);
  }
  e.bar.grp.visible=false;
}
function spawnWorldWorkers(){
  VILLAGES.forEach(function(v){
    for(var w=0;w<3;w++){ var wsp=findFreeSpot(v.x+rand(-13,13), v.z+rand(-13,13), 0.4); spawnWorkerAt(wsp.x, wsp.z, 'neutral', false); }
    var sp=findFreeSpot(v.x+rand(-8,8), v.z+rand(-8,8), 0.4);
    spawnVillager(sp.x, sp.z);
  });
  FAC_KEYS.forEach(function(f){
    var td=townData[f];
    for(var w=0;w<2;w++) spawnWorkerAt(td.hall.x+rand(-20,20), td.hall.z+rand(-8,26), f, false);
  });
  var armored=0;
  entities.forEach(function(e){ if(e.kind==='worker'&&e.armed) armored++; });
  if(armored<2){
    var cand=entities.filter(function(e){ return e.kind==='worker'&&!e.armed; });
    for(var u=0;u<2 && cand.length;u++){
      var idx=Math.floor(Math.random()*cand.length);
      var w2=cand.splice(idx,1)[0];
      w2.armed=true; w2.maxHp=85; w2.hp=85; w2.dmg=13; w2.speed=3.4; w2.range=1.4; w2.cd=1.3;
      w2.name='Foreman';
    }
  }
}

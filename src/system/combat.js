/* ---------------- combat ---------------- */
function hostileF(a,b){ return a!==b; }
function coneTargets(attacker, range){
  var out=[];
  var fx=Math.sin(attacker.yaw), fz=Math.cos(attacker.yaw);
  var ax=attacker.group.position.x, az=attacker.group.position.z;
  eqNear(ax,az,range+0.55,function(e,d2){
    if(e.dead||e.passive||e===attacker||!hostileF(e.team,attacker.team)||e.kind==='villager')return;
    var dx=e.group.position.x-ax,dz=e.group.position.z-az,d=Math.sqrt(d2);
    if((dx*fx+dz*fz)/(d||1)>0.25&&segmentClear(ax,az,e.group.position.x,e.group.position.z,0.05))out.push(e);
  });
  return out;
}
function damageEntity(target, dmg, fromX, fromZ, killer){
  if(!target || target.dead) return;
  if(target.invulnT>0){
    spawnParticles(target.group.position, 0xcccccc, 4, 1.5, 3);
    return;
  }
  var blocked=false;
  if(target.blocking && target.blockStat>0){
    var dx=fromX-target.group.position.x, dz=fromZ-target.group.position.z;
    var face=Math.atan2(-dx,-dz);
    if(Math.abs(angDiff(target.yaw, face))<1.25){
      dmg*=(1-target.blockStat*0.85); blocked=true;
      target.blockKick=1;
      if(target.isPlayer) target.stamina=Math.max(0, target.stamina-8);
    }
  }
  target.hp-=dmg;
  target.flashT=0.12;
  var chest=target.group.position.clone(); chest.y+=1.3;
  spawnParticles(chest, blocked?0xffd76e:0xa83232, blocked?10:8, blocked?2.6:2.2, 3.2);
  var kx=target.group.position.x-fromX, kz=target.group.position.z-fromZ;
  var kd=Math.sqrt(kx*kx+kz*kz)||1;
  var kb=target.isPlayer?0.5:1.0;
  target.group.position.x+=kx/kd*kb;
  target.group.position.z+=kz/kd*kb;
  if(target.isPlayer){
    Snd.hurt(); hitVignette=Math.min(1, hitVignette+0.55); target.regenT=0;
  } else if(blocked){ Snd.blockHit(); }
  else { Snd.hit(); }
  if(killer && killer.isPlayer){
    camShake=Math.min(1, camShake+(blocked?0.22:0.45));
    hitStop=Math.max(hitStop, blocked?0.025:0.05);
  }
  if(target.hp<=0) killEntity(target, killer);
}
function killEntity(e, killer){
  if(e.dead) return;
  e.dead=true; e.deadT=0; e.hp=0;
  e.bar.grp.visible=false;
  Snd.die();
  if(e.isCommander){
    Snd.roar(); spawnParticles(e.group.position, 0xc9a227, 16, 3, 5);
    showBanner(e.name+' has fallen!', 'A champion is slain', 2.2);
  }
  if(killer && killer.isPlayer){
    kills++;
    score+=e.scoreVal;
    EC[playerTeam].gold+=8; /* bounty */
  }
  killFeedKill(killer, e);
  checkDomination();
}
function beginAttack(e, shotPos){
  e.atkT=e.cd;
  e.animT=0; e.hitDone=false; e.sndDone=false;
  e.blocking=false;
  e.attackCycle=(e.attackCycle||0)+1;
  e.atkKind=e.ranged?'draw':e.weapon&&weaponFamily(e.weapon)==='spear'?'thrust':e.hasShield&&e.attackCycle%3===0?'bash':'overhead';
  e.shotDone=!e.ranged;
  if(e.ranged && shotPos) e.shotPos=shotPos;
}
function doStrike(e){
  var targets=coneTargets(e, e.range);
  var bash=e.atkKind==='bash';
  for(var i=0;i<targets.length;i++){
    var dmg=e.dmg*rand(0.9,1.1)*(bash?0.7:1)*(e.rallyT>0?1.2:1);
    damageEntity(targets[i], dmg, e.group.position.x, e.group.position.z, e);
    if(bash && !targets[i].dead) targets[i].staggerT=0.55;   /* shield bash staggers */
  }
}
function shootArrowFrom(e, targetPos, inacc){
  var from=e.group.position.clone(); from.y+=1.45;
  var dir=targetPos.clone().sub(from);
  dir.y-=dir.length()*0.028;
  dir.normalize();
  if(inacc){ dir.x+=rand(-inacc,inacc); dir.y+=rand(-inacc,inacc); dir.z+=rand(-inacc,inacc); dir.normalize(); }
  spawnArrow(from, dir, 26, e.dmg, e.team, e, 1);
  Snd.shoot();
}


/* Combat timing is simulation, never animation/rendering. Invisible archers still fire. */
function advanceCombat(e,dt){
  if(e.dead||e.gone)return;
  if(e.animT>=0){
    e.animT+=dt;
    var phase=e.animT/e.animDur,release=e.atkKind==='bash'?0.42:e.ranged?0.68:0.34;
    if(!e.sndDone&&phase>=release){
      e.sndDone=true;
      if(e.ranged&&e.shotPos){
        e.shotDone=true;shootArrowFrom(e,e.shotPos,e.isPlayer?(e.aiming?0.005:0.02):0.045);e.shotPos=null;
        if(e.isPlayer)Snd.shoot();
      } else if(!e.ranged&&e.group.visible){Snd.swing();spawnSlash(e);}
    }
    if(!e.hitDone&&!e.ranged&&phase>=0.45){e.hitDone=true;doStrike(e);}
    if(phase>=1)e.animT=-1;
  }
}

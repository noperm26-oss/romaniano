function createPlayer(roleKey){
  var td=townData[playerTeam];
  var spot=findFreeSpot(td.hall.door.x, td.hall.door.z+TOWNS_and_front(playerTeam)*4, 0.5);
  var p=spawnCharacter(roleKey, playerTeam, spot.x, spot.z);
  p.isPlayer=true;
  p.faction='player';
  p.yaw=TOWNS_and_front(playerTeam)>0?0:Math.PI;
  p.stamina=100; p.staminaDelay=0; p.regenT=0; p.dodgeT=0; p.dodgeDir=new THREE.Vector3();
  p.aiming=false; p.goal=null;
  player=p;
  curOrder='follow';   /* v9: recruits trail the king until ordered */
  camYaw=p.yaw; camPitch=-0.06;
  return p;
}

/* ---------------- player update ---------------- */
function updatePlayer(dt){
  var p=player;
  if(p.dead) return;
  if(overlayActive()){resetInput();return;}
  camYaw -= mouse.dx*0.0026;
  camPitch = clamp(camPitch - mouse.dy*0.0022, -0.55, 1.05);
  mouse.dx=0; mouse.dy=0;
  var fx=Math.sin(camYaw), fz=Math.cos(camYaw);
  var rx=-Math.cos(camYaw), rz=Math.sin(camYaw);
  var mx=0, mz=0;
  if(keys.KeyW||keys.ArrowUp){ mx+=fx; mz+=fz; }
  if(keys.KeyS||keys.ArrowDown){ mx-=fx; mz-=fz; }
  if(keys.KeyD||keys.ArrowRight){ mx+=rx; mz+=rz; }
  if(keys.KeyA||keys.ArrowLeft){ mx-=rx; mz-=rz; }
  var moving=(mx!==0||mz!==0);
  var ml=Math.sqrt(mx*mx+mz*mz)||1; mx/=ml; mz/=ml;
  var sprinting=(keys.ShiftLeft||keys.ShiftRight)&&moving&&p.stamina>0.5&&!p.blocking&&p.dodgeT<=0;
  if(sprinting){ p.stamina=Math.max(0,p.stamina-16*dt); p.staminaDelay=0.6; }
  else { p.staminaDelay-=dt; if(p.staminaDelay<=0) p.stamina=Math.min(100,p.stamina+15*dt); }
  if(keys.Space && p.dodgeT<=0 && p.stamina>=26 && !p.riding){
    p.stamina-=26; p.staminaDelay=0.8;
    p.dodgeT=0.34; p.invulnT=0.32;
    if(moving){ p.dodgeDir.set(mx,0,mz); } else { p.dodgeDir.set(fx,0,fz); }
    Snd.swing();
  }
  if(p.dodgeT>0){
    p.dodgeT-=dt;
    moveWithCollision(p.group.position,p.dodgeDir.x*13*dt,p.dodgeDir.z*13*dt,0.46);
  } else if(moving){
    var spd=p.speed*(p.riding?2.05:1)*(sprinting?1.42:1)*(p.blocking?0.5:1)*(p.aiming?0.55:1)*(p.rallyT>0?1.15:1);
    moveWithCollision(p.group.position,mx*spd*dt,mz*spd*dt,0.46);
  }
  p.movingAmt=lerp(p.movingAmt,(moving||p.dodgeT>0)?1:0,Math.min(1,dt*10));
  p.walkRate = (moving||p.dodgeT>0) ? 10*(sprinting?1.5:1)*(p.blocking?0.7:1)*(p.aiming?0.6:1)*(p.riding?1.35:1) : 0;
  if(p.rallyT>0) p.rallyT-=dt;
  p.dustT=(p.dustT||0)-dt;
  if(p.movingAmt>0.6 && p.dustT<=0){
    p.dustT=sprinting?0.16:0.27;
    spawnParticles({x:p.group.position.x, y:p.group.position.y+0.12, z:p.group.position.z}, 0xc9b483, 2, 0.7, 1.1);
  }
  p.group.position.x=clamp(p.group.position.x,-WORLD.half+5,WORLD.half-5);
  p.group.position.z=clamp(p.group.position.z,-WORLD.half+5,WORLD.half-5);
  collideCircle(p.group.position, 0.45);
  /* v10: the king never remains stuck inside a building — rewind, don't phase */
  if(!insideSolid(p.group.position.x, p.group.position.z, 0.46)){
    p.lastFree={x:p.group.position.x, z:p.group.position.z};
    p.embedT=0;
  } else {
    p.embedT=(p.embedT||0)+dt;
    if(p.embedT>0.8 && p.lastFree){
      p.group.position.x=p.lastFree.x; p.group.position.z=p.lastFree.z;
      p.embedT=0; brainPathT=0; brainStuck=0;
    }
  }
  p.yaw=camYaw;
  p.blocking=!p.ranged&&p.blocking;
  p.regenT+=dt;
  if(p.regenT>5 && p.hp<p.maxHp) p.hp=Math.min(p.maxHp, p.hp+3.5*dt);
  p.invulnT-=dt;
  p.atkT-=dt;
  if(mouse.wantAttack){
    mouse.wantAttack=false;
    if(p.atkT<=0 && !p.blocking && p.dodgeT<=0){
      if(p.ranged){
        var cp=Math.cos(camPitch);
        var dir=new THREE.Vector3(Math.sin(camYaw)*cp, Math.sin(camPitch), Math.cos(camYaw)*cp).normalize();
        var from=p.group.position.clone(); from.y+=1.5;
        beginAttack(p, from.add(dir.multiplyScalar(40)));   /* arrow released at full draw */
      } else beginAttack(p);
    }
  }

  if(marchCooldown>0) marchCooldown-=dt;
}

/* ---------------- AI (tactical + strategic goals) ---------------- */

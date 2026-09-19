/* ---------------- main update — with LOD & performance safeguards ---------------- */
var lodTick=0;
function update(dt){
  NAV.budget=0;NAV.workMs=0;
  gameTime+=dt;
  ehashBuild();
  brainTick(dt);
  if(player && !player.dead && state===ST.PLAY) updatePlayer(dt);
  var px=player?player.group.position.x:0, pz=player?player.group.position.z:0;
  lodTick+=dt;
  var doLod=lodTick>0.25;
  if(doLod) lodTick=0;
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    updateEntityLifecycle(e,dt);
    if(e.gone) continue;
    if(e.kind==='wolf'){ updateWolf(e,dt); continue; }
    if(e.dead||e.passive){
      if(e.group.visible) updatePose(e,dt);
      continue;
    }
    if(e.isPlayer){ advanceCombat(e,dt);updatePose(e,dt); continue; }
    // LOD: distant units update AI less frequently, lower animation quality
    var dist2=(e.group.position.x-px)*(e.group.position.x-px)+(e.group.position.z-pz)*(e.group.position.z-pz);
    var isDistant=dist2>250*250;
    var isVeryDistant=dist2>400*400;
    if(isVeryDistant && doLod){
      // very distant: update AI every 0.5s, skip pose every other frame
      if((i%2)===0) updateAI(e,dt*2);
      if(e.group.visible && (i%3)===0) updatePose(e,dt);
      advanceCombat(e,dt);
    } else if(isDistant){
      // distant: half frequency AI
      e._aiAccum=(e._aiAccum||0)+dt;
      if(e._aiAccum>0.2){ updateAI(e,e._aiAccum); e._aiAccum=0; }
      advanceCombat(e,dt);
      if(e.group.visible) updatePose(e,dt);
    } else {
      updateAI(e,dt);
      advanceCombat(e,dt);
      if(e.group.visible) updatePose(e,dt);
    }
  }
  for(var j=entities.length-1;j>=0;j--){
    if(entities[j].gone) entities.splice(j,1);
  }
  updateHorse();
  updateArrows(dt);
  updateParticles(dt);
  updateFx(dt);
  updateAmbient(dt);
  if(state===ST.PLAY)updateLivingWorld(dt);
  if(state===ST.PLAY) updateStrategy(dt);
  updateCamera(dt);
  updateHUD(dt);
  if(player && player.dead && state===ST.PLAY) playerDied();
  // cull less frequently for performance
  if(doLod) cullTick();
}

/* ---------------- render loop ---------------- */
var last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min((now-last)/1000, 0.05);
  last=now;
  if(manualSimulation)return;
  if(hitStop>0){ hitStop-=dt; dt=0; }
  if(state===ST.PLAY || state===ST.REDEPLOY){
    update(dt);
  } else if(state===ST.MENU || state===ST.FACTION || state===ST.ROLES){
    gameTime+=dt;
    var a=gameTime*0.08;
    camera.position.set(Math.sin(a)*46, 16+Math.sin(gameTime*0.3)*2, Math.cos(a)*46);
    camera.lookAt(0,2,10);
    updateAmbient(dt);
  } else if(state===ST.RESULT){
    gameTime+=dt;
    updateAmbient(dt);
    var ang2=gameTime*0.15;
    camera.position.set(Math.sin(ang2)*40, 18, Math.cos(ang2)*40);
    camera.lookAt(0,2,0);
  }
  renderer.render(scene,camera);
}

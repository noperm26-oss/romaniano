/* ---------------- main update ---------------- */
function update(dt){
  NAV.budget=0;NAV.workMs=0;
  gameTime+=dt;
  ehashBuild();
  brainTick(dt);
  if(player && !player.dead && state===ST.PLAY) updatePlayer(dt);
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    updateEntityLifecycle(e,dt);
    if(e.gone) continue;
    if(e.kind==='wolf'){ updateWolf(e,dt); continue; }
    if(e.dead||e.passive){ if(e.group.visible) updatePose(e,dt); continue; }
    if(e.isPlayer){ advanceCombat(e,dt);updatePose(e,dt); continue; }
    updateAI(e,dt);
    advanceCombat(e,dt);
    if(e.group.visible) updatePose(e,dt);   /* v11: off-screen bones never churn */
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
}

/* ---------------- render loop ---------------- */
var last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min((now-last)/1000, 0.05);
  last=now;
  if(manualSimulation)return;
  if(hitStop>0){ hitStop-=dt; dt=0; }   /* impact freeze-frames */
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

/* ---------------- camera ---------------- */
var camFov=68;
/* ---------------- first-person weapon & shield (v7) ---------------- */
var fpWeapon=null, fpShieldG=null, fpKey='', fpAimS=0;
function fpUpdate(dt, aim){
  /* v8.3: third-person camera restored — FP weapon retired, never shown */
  if(fpWeapon) fpWeapon.visible=false;
  if(fpShieldG) fpShieldG.visible=false;
}

function updateCamera(dt){
  if(!player || player.dead || state===ST.REDEPLOY){
    if(player) player.group.visible=true;
    if(fpWeapon) fpWeapon.visible=false;
    if(fpShieldG) fpShieldG.visible=false;
    var ang=gameTime*0.25;
    var cxp=deathPos.x+Math.sin(ang)*9, czp=deathPos.z+Math.cos(ang)*9;
    camera.position.set(cxp, deathPos.y+5, czp);
    camera.lookAt(deathPos.x, deathPos.y+1, deathPos.z);
    return;
  }
  /* ---- v8.3: THIRD-PERSON follow cam (user preference — FP retired) ---- */
  var p=player;
  p.group.visible=true;
  var aim=p.ranged&&p.aiming;
  var dist=aim?3.8:8.4, h=aim?2.4:4.5;
  var fx=Math.sin(camYaw), fz=Math.cos(camYaw);
  var lift=Math.sin(camPitch)*7;
  // Pull the third-person camera forward instead of placing it inside a house.
  var origin=p.group.position;
  while(dist>0.7&&!segmentClear(origin.x,origin.z,origin.x-fx*dist,origin.z-fz*dist,0.2))dist-=0.25;
  var cx=p.group.position.x - fx*dist;
  var cz=p.group.position.z - fz*dist;
  var cy=p.group.position.y + h - lift*0.7;
  var gy=groundH(cx,cz)+1.2; if(cy<gy) cy=gy;
  camera.position.set(cx, cy, cz);
  if(camShake>0){
    camShake=Math.max(0,camShake-dt*2.6);
    camera.position.x+=rand(-1,1)*camShake*0.13;
    camera.position.y+=rand(-1,1)*camShake*0.09;
    camera.position.z+=rand(-1,1)*camShake*0.13;
  }
  camera.lookAt(p.group.position.x + fx*3, p.group.position.y+1.7+lift, p.group.position.z + fz*3);
  var wantFov=aim?52:66;
  camFov=lerp(camFov, wantFov, Math.min(1,dt*10));
  if(Math.abs(camera.fov-camFov)>0.05){ camera.fov=camFov; camera.updateProjectionMatrix(); }
  fpUpdate(dt, aim);
}

/* ---------------- arrows & ambient ---------------- */
function updateArrows(dt){
  for(var i=0;i<arrows.length;i++){
    var a=arrows[i];
    if(!a.active) continue;
    if(a.stuck){
      a.stickT-=dt;
      if(a.stickT<=0){ a.active=false; a.mesh.visible=false; }
      continue;
    }
    a.life-=dt;
    if(a.life<=0){ a.active=false; a.mesh.visible=false; continue; }
    a.prev.copy(a.mesh.position);
    a.mesh.position.x+=a.vel.x*dt;
    a.mesh.position.y+=a.vel.y*dt;
    a.mesh.position.z+=a.vel.z*dt;
    a.vel.y-=7*dt;
    a.mesh.lookAt(a.mesh.position.x+a.vel.x, a.mesh.position.y+a.vel.y, a.mesh.position.z+a.vel.z);
    var hit=null;
    var dx=a.mesh.position.x-a.prev.x,dz=a.mesh.position.z-a.prev.z,den=dx*dx+dz*dz;
    var midX=(a.prev.x+a.mesh.position.x)/2,midZ=(a.prev.z+a.mesh.position.z)/2,closest=Infinity;
    eqNear(midX,midZ,Math.sqrt(den)/2+1,function(e){
      if(e.dead||e.passive||e.kind==='villager'||!hostileF(e.team,a.team))return;
      var p=e.group.position,t=den>0?clamp(((p.x-a.prev.x)*dx+(p.z-a.prev.z)*dz)/den,0,1):0;
      var ex=a.prev.x+dx*t-p.x,ez=a.prev.z+dz*t-p.z,relY=a.prev.y+(a.mesh.position.y-a.prev.y)*t-p.y;
      if(ex*ex+ez*ez<0.42&&relY>0.1&&relY<2.1&&t<closest){hit=e;closest=t;}
    });
    if(hit){
      damageEntity(hit, a.dmg, a.prev.x, a.prev.z, a.owner);
      Snd.arrowHit();
      a.active=false; a.mesh.visible=false;
      continue;
    }
    var gy=groundH(a.mesh.position.x, a.mesh.position.z);
    if(a.mesh.position.y<=gy+0.05){
      a.stuck=true; a.stickT=6;
      spawnParticles(a.mesh.position, 0x8a815f, 3, 0.8, 1.5);
    }
  }
}

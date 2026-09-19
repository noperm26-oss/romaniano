function updateCritters(dt){
  var fx=player?player.group.position.x:camera.position.x, fz=player?player.group.position.z:camera.position.z;
  for(var i=0;i<critters.length;i++){
    var c=critters[i];
    c.t-=dt;
    if(c.kind==='bird'){
      var BT=TOWNS[c.town];
      c.ph+=dt*0.5;
      c.grp.position.set(BT.x+Math.cos(c.ph)*c.rad, groundH(BT.x,BT.z)+16+Math.sin(c.ph*2.3)*3, BT.z+Math.sin(c.ph)*c.rad);
      c.grp.rotation.y=-c.ph+Math.PI/2;
      var flap=Math.sin(gameTime*9+c.t)*0.55;
      c.wings[0].rotation.z=flap; c.wings[1].rotation.z=-flap;
      continue;
    }
    var dx=fx-c.grp.position.x, dz=fz-c.grp.position.z, d2=dx*dx+dz*dz;
    if(d2>360*360) continue;
    var d=Math.sqrt(d2);
    if(d<16 && c.flee<=0 && (c.kind==='deer'||c.kind==='sheep')){ c.flee=2.6; c.fdx=-dx/(d||1); c.fdz=-dz/(d||1); }
    if(c.flee>0){
      c.flee-=dt;
      moveWithCollision(c.grp.position,c.fdx*8.2*dt,c.fdz*8.2*dt,0.4);
      c.grp.rotation.y=Math.atan2(c.fdx,c.fdz);
      animLegs(c,dt,14);
    } else {
      if(!c.tgt || c.t<=0){ c.tgt={x:c.grp.position.x+rand(-22,22), z:c.grp.position.z+rand(-22,22)}; c.t=rand(3,8); }
      var tx=c.tgt.x-c.grp.position.x, tz=c.tgt.z-c.grp.position.z, tl=Math.sqrt(tx*tx+tz*tz);
      if(tl>1){
        moveWithCollision(c.grp.position,tx/tl*c.speed*dt,tz/tl*c.speed*dt,0.4);
        c.grp.rotation.y=Math.atan2(tx,tz);
        animLegs(c,dt,4);
      } else animLegs(c,dt,0);
    }
    c.grp.position.y=groundH(c.grp.position.x,c.grp.position.z);
  }
}

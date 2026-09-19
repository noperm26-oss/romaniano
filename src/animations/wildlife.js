function animLegs(c,dt,rate){
  if(!c.legs.length) return;
  c.gait+=dt*rate;
  for(var i=0;i<c.legs.length;i++) c.legs[i].rotation.x=Math.sin(c.gait+(i%2)*Math.PI)*(rate>0?0.5:0);
}

function updateWolfPose(e,dt){
  if(e.dead){e.group.rotation.z=Math.min(1,e.deadT*3)*Math.PI/2;e.bar.grp.visible=false;return;}
  e.wph=(e.wph||0)+dt*(e.movingAmt>0?10:0);
  e.legs.forEach(function(leg,i){leg.rotation.x=Math.sin(e.wph+(i%2)*Math.PI)*(e.movingAmt>0?0.55:0);});
  e.group.rotation.y=e.yaw;
  e.bar.grp.position.set(e.group.position.x,e.group.position.y+1.7,e.group.position.z);
}

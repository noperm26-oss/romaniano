function whiskerClear(e, yaw, maxD){
  /* v9: how far can the unit walk along yaw before a collider blocks it */
  var px=e.group.position.x, pz=e.group.position.z;
  var sx=Math.sin(yaw), sz=Math.cos(yaw);
  var p={x:px,z:pz};
  for(var d=1; d<=maxD; d++){
    p.x=px+sx*d; p.z=pz+sz*d;
    collideCircle(p, 0.55);
    if(Math.abs(p.x-(px+sx*d))>0.05 || Math.abs(p.z-(pz+sz*d))>0.05) return d-1;
  }
  return maxD;
}

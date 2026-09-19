function makeQuiver(){
  var g=new THREE.Group();
  g.add(box(0.16,0.52,0.13, NM(0x7a5230), 0,0,0));
  for(var i=0;i<3;i++){
    var a=cyl(0.015,0.015,0.3, NM(0xc9b98a), 4);
    a.position.set(-0.04+i*0.04, 0.36, -0.01+i*0.02); g.add(a);
  }
  g.rotation.z=-0.35;
  return g;
}

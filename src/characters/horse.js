function makeHorse(){
  /* v10: procedural warhorse — forward is +z to match yaw conventions */
  var g=new THREE.Group();
  var c=choice([0x6e4a2a, 0x3a2c1c, 0x7a6a52, 0x4a3524]);
  var dark=NM(0x241a10);
  g.add(box(1.05,1.05,2.5, NM(c), 0,1.3,0));
  var neck=box(0.55,1.1,0.55, NM(c), 0,2.0,1.0); neck.rotation.x=0.5; g.add(neck);
  g.add(box(0.44,0.5,0.95, NM(c), 0,2.6,1.5));
  g.add(box(0.1,0.24,0.1, dark, 0.16,2.92,1.3));
  g.add(box(0.1,0.24,0.1, dark, -0.16,2.92,1.3));
  g.add(box(0.18,0.85,0.75, dark, 0,2.15,0.72));
  var tail=box(0.18,0.9,0.24, dark, 0,1.35,-1.32); tail.rotation.x=-0.35; g.add(tail);
  function leg(x,z){
    var L=new THREE.Group();
    L.add(box(0.27,1.05,0.32, NM(c), 0,-0.52,0));
    L.add(box(0.31,0.22,0.36, dark, 0,-1.1,0));
    L.position.set(x,1.1,z);
    g.add(L);
    return L;
  }
  g.userData.horse=true;
  g.userData.legs={fl:leg(0.42,0.95), fr:leg(-0.42,0.95), bl:leg(0.42,-0.98), br:leg(-0.42,-0.98)};
  return g;
}

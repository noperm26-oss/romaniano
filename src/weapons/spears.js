function makeSpearSpec(o){
  o=o||{};
  var g=new THREE.Group();
  var L=o.len||2.5;
  var shaft=cyl(0.028,0.028,L, NM(o.shaft||0x8a6a3c), 6); shaft.position.y=-0.3-L*0.12; g.add(shaft);
  var tip=cone(0.055,o.tipLen||0.26, NM(0xb9c1c9), 5); tip.position.y=-0.3-L*0.12-L/2-0.1; tip.rotation.x=Math.PI; g.add(tip);
  if(o.butt){
    var bt=cone(0.04,0.18, NM(0xb9c1c9), 5); bt.position.y=-0.3-L*0.12+L/2+0.06; g.add(bt);
  }
  g.rotation.x=-Math.PI/2;
  return g;
}

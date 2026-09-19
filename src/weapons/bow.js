function makeBow(o){
  o=o||{};
  var g=new THREE.Group();
  var up=cyl(0.022,0.032,0.62, NM(o.woodColor||0x6e4a28), 6); up.position.set(0,0.3,0.1); up.rotation.z=0.28; up.rotation.x=-0.12; g.add(up);
  var lo=cyl(0.022,0.032,0.62, NM(o.woodColor||0x6e4a28), 6); lo.position.set(0,-0.3,0.1); lo.rotation.z=-0.28; lo.rotation.x=0.12; g.add(lo);
  var mid=cyl(0.035,0.035,0.24, NM(0x7a5230), 6); mid.position.set(0,0,0.16); mid.rotation.x=0.35; g.add(mid);
  var geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.53,-.06),new THREE.Vector3(0,0,-.06),new THREE.Vector3(0,-.53,-.06)]);
  var str=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:o.stringColor||0xd8d2c0}));str.name='bow-string';g.add(str);g.userData.bowString=str;
  return g;
}

function buildWolfCharacter(){
  var g=new THREE.Group();
  var gray=NM(0x6f6f74), darkG=NM(0x4a4a50);
  g.add(box(0.5,0.5,1.15, gray, 0,0.85,0));
  g.add(box(0.3,0.32,0.5, gray, 0,1.05,0.75));
  g.add(box(0.34,0.3,0.16, gray, 0,1.3,0.9));
  var e1=sph(0.035, NM(0xff3b30), 4,3); e1.material.emissive=new THREE.Color(0xaa1000); e1.position.set(0.09,1.12,0.98); g.add(e1);
  var e2=e1.clone(); e2.position.x=-0.09; g.add(e2);
  var tail=box(0.12,0.12,0.5, darkG, 0,0.95,-0.75); tail.rotation.x=0.5; g.add(tail);
  var legs=[];
  [[0.16,0.4],[-0.16,0.4],[0.16,-0.4],[-0.16,-0.4]].forEach(function(lp){
    var l=box(0.11,0.6,0.11, darkG, lp[0],0.3,lp[1]); g.add(l); legs.push(l);
  });
  var materials=new Set();g.traverse(function(o){if(o.material)materials.add(o.material);});
  return {group:g,legs:legs,mats:Array.from(materials)};
}

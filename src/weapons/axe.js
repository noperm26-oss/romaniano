function makeAxe(){
  var g=new THREE.Group();
  var haft=cyl(0.03,0.035,0.85, NM(0x6b4a26), 6); haft.position.y=-0.32; g.add(haft);
  var head=box(0.06,0.26,0.3, NM(0x9aa2ab), 0,-0.62,0.12); g.add(head);
  var edge=box(0.02,0.3,0.1, NM(0xc9d2da), 0,-0.62,0.3); g.add(edge);
  g.add(box(0.05,0.1,0.12, NM(0x71787f), 0,-0.6,-0.06));
  return g;
}

/* ---------------- solid structures (v7): cheap no-interior buildings ---------------- */
var BUILD_COUNT=0;
function solidBuilding(x,z,w,d,h,wallCol,roofCol,roof){
  var y=groundH(x,z)+0.25;
  var g=new THREE.Group(); g.position.set(x,y,z); scene.add(g);
  g.add(box(w,h,d, NM(wallCol), 0,h/2,0));
  if(roof==='gable'||roof==='thatch'){
    var rm=Math.max(w,d)*0.78;
    var r=cone(rm, h*0.55, NM(roofCol), 4);
    r.rotation.y=Math.PI/4;
    r.scale.x=w/rm; r.scale.z=d/rm;
    r.position.y=h+h*0.26;
    g.add(r);
  } else {
    g.add(box(w+0.3,0.35,d+0.3, NM(roofCol), 0,h+0.15,0));
  }
  g.add(box(w*0.24, h*0.62, 0.14, NM(0x3a2c1c), 0, h*0.31, d/2+0.02));
  addCollider(x-w/2, z-d/2, x+w/2, z+d/2);
  BUILD_COUNT++;
  return g;
}

/* ---------------- weapons (single-piece blades — no detachable parts) ---------------- */
/* sword/khopesh/katana blades are ONE extruded mesh: blade + tip grown together */
function bladeShape(w,L,curve){
  var sh=new THREE.Shape();
  if(curve){
    sh.moveTo(-w/2,0);
    sh.lineTo(-w/2,-L*0.62);
    sh.quadraticCurveTo(-w*0.28,-L*1.02, w*0.55,-L*1.12);      /* curved back edge to tip */
    sh.quadraticCurveTo(w*0.1,-L*0.62, w/2,0);                 /* cutting edge back up */
    sh.lineTo(-w/2,0);
  } else {
    sh.moveTo(-w/2,0);
    sh.lineTo(-w/2,-L*0.8);
    sh.lineTo(0,-L);                                           /* integral point */
    sh.lineTo(w/2,-L*0.8);
    sh.lineTo(w/2,0);
    sh.lineTo(-w/2,0);
  }
  return sh;
}
function makeBlade(o){
  o=o||{};
  var g=new THREE.Group();
  var L=o.len||0.95, W=o.wide||0.09, curve=o.curve||0;
  var geo=sharedGeometry('blade:'+W+':'+L+':'+curve,function(){var geometry=new THREE.ExtrudeGeometry(bladeShape(W,L,curve),{depth:0.03,bevelEnabled:false});geometry.translate(0,0,-0.015);return geometry;});
  var blade=new THREE.Mesh(geo, NM(o.col||0xb9c1c9));
  blade.castShadow=true;
  blade.position.y=-0.07;
  g.add(blade);
  g.add(box(0.26,0.05,0.06, NM(0xc9a227), 0,-0.05,0));                    /* guard */
  var grip=cyl(0.035,0.035,o.grip||0.2, NM(0x7a5230), 6); grip.position.y=0.08; g.add(grip);
  var pommel=sph(0.045, NM(0xc9a227), 6,5); pommel.position.y=0.08+(o.grip||0.2)/2+0.02; g.add(pommel);
  return g;
}

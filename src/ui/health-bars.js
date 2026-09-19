/* ---------------- hp bars ---------------- */
function makeBar(colorHex, wide){
  var grp=new THREE.Group();
  var bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x141414, opacity:0.62, transparent:true, depthWrite:false}));
  bg.scale.set(wide||0.95,0.13,1);
  var fill=new THREE.Sprite(new THREE.SpriteMaterial({color:colorHex, depthWrite:false}));
  fill.center.set(0,0.5); fill.position.x=-(wide||0.95)*0.46; fill.scale.set((wide||0.95)*0.92,0.085,1);
  grp.add(bg); grp.add(fill);
  grp.renderOrder=5;
  return {grp:grp, fill:fill, w:(wide||0.95)*0.92};
}

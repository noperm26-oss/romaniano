/* ---------------- shields ---------------- */
function makeShieldShape(shape, tex, baseCol){
  var g=new THREE.Group();
  if(shape==='hoplon'){
    var disc=cyl(0.4,0.4,0.07, NM(baseCol||0xa07030), 16);
    disc.rotation.x=Math.PI/2; g.add(disc);
    var rim=torus(0.4,0.03, NM(0x8a6420)); rim.position.z=0.02; g.add(rim);
    var d2=new THREE.Mesh(new THREE.CircleGeometry(0.35,16), new THREE.MeshLambertMaterial({map:tex}));
    d2.position.z=0.045; g.add(d2);
    var boss=sph(0.07, NM(0xc9a227), 8,6); boss.position.z=0.07; boss.scale.z=0.6; g.add(boss);
  } else if(shape==='scutum'){
    var body=box(0.62,1.0,0.06, NM(baseCol||0x8e1b1b), 0,0,0.02); g.add(body);
    var curveT=box(0.62,0.2,0.07, NM(baseCol||0x8e1b1b), 0,0.42,0.05); curveT.rotation.x=-0.25; g.add(curveT);
    var d=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.94), new THREE.MeshLambertMaterial({map:tex}));
    d.position.z=0.056; g.add(d);
    var boss2=cone(0.09,0.12, NM(0xc9a227), 8); boss2.rotation.x=Math.PI/2; boss2.position.z=0.1; g.add(boss2);
  } else if(shape==='kite'){
    var top=box(0.5,0.55,0.05, NM(baseCol||0xd8d2c0), 0,0.2,0.02); g.add(top);
    var bot=cone(0.25,0.55, NM(baseCol||0xd8d2c0), 4); bot.rotation.x=Math.PI; bot.position.y=-0.32; bot.scale.z=0.16; g.add(bot);
    var d3=new THREE.Mesh(new THREE.PlaneGeometry(0.44,0.95), new THREE.MeshLambertMaterial({map:tex}));
    d3.position.z=0.05; g.add(d3);
  } else if(shape==='oval'){
    var ov=cyl(0.36,0.36,0.05, NM(baseCol||0x6b4a2f), 12);
    ov.rotation.x=Math.PI/2; ov.scale.x=0.78; g.add(ov);
    var d4=new THREE.Mesh(new THREE.CircleGeometry(0.32,12), new THREE.MeshLambertMaterial({map:tex}));
    d4.scale.x=0.78; d4.position.z=0.032; g.add(d4);
    var sp=sph(0.06, NM(0xc9a227), 7,5); sp.position.z=0.05; sp.scale.z=0.6; g.add(sp);
  } else if(shape==='wicker'){
    var wk=cyl(0.38,0.42,0.09, NM(0xb59a63), 12);
    wk.rotation.x=Math.PI/2; g.add(wk);
    var d5=new THREE.Mesh(new THREE.CircleGeometry(0.36,12), new THREE.MeshLambertMaterial({map:tex}));
    d5.position.z=0.052; g.add(d5);
  } else {
    var rd=cyl(0.37,0.37,0.05, NM(baseCol||0x50565e), 14);
    rd.rotation.x=Math.PI/2; g.add(rd);
    var d6=new THREE.Mesh(new THREE.CircleGeometry(0.33,14), new THREE.MeshLambertMaterial({map:tex}));
    d6.position.z=0.032; g.add(d6);
    var bs=sph(0.06, NM(0x8a919b), 7,5); bs.position.z=0.055; bs.scale.z=0.6; g.add(bs);
  }
  return g;
}

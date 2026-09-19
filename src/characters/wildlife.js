/* ---------------- living world (v5): wildlife, villagers, chests ---------------- */
var wolfTimer=18;
function makeCritter(kind,x,z,town){
  var g=new THREE.Group(); var y=groundH(x,z); g.position.set(x,y,z);
  var c={kind:kind, grp:g, t:rand(0,9), tgt:null, speed:kind==='deer'?1.3:0.8, flee:0, fdx:0, fdz:0, ph:rand(0,6), legs:[], wings:[], gait:0, town:town||null, rad:rand(24,42)};
  if(kind==='deer'){
    var bodyM=NM(0x9a6b42), dark=NM(0x6e4a2c);
    g.add(box(0.55,0.55,1.15, bodyM, 0,1.02,0));
    var nk=box(0.2,0.62,0.22, bodyM, 0,1.45,0.5); nk.rotation.x=0.45; g.add(nk);
    g.add(box(0.24,0.26,0.46, bodyM, 0,1.78,0.74));
    g.add(box(0.05,0.05,0.06, dark, 0.08,1.82,0.95)); g.add(box(0.05,0.05,0.06, dark, -0.08,1.82,0.95));
    g.add(box(0.045,0.42,0.045, dark, 0.1,2.2,0.62)); g.add(box(0.045,0.42,0.045, dark, -0.1,2.2,0.62));
    g.add(box(0.24,0.045,0.045, dark, 0.15,2.36,0.62)); g.add(box(0.24,0.045,0.045, dark, -0.15,2.36,0.62));
    var legs=[[0.19,0.42],[-0.19,0.42],[0.19,-0.42],[-0.19,-0.42]];
    for(var i=0;i<4;i++){ var lg=box(0.11,0.8,0.11, dark, legs[i][0],0.42,legs[i][1]); g.add(lg); c.legs.push(lg); }
  } else if(kind==='sheep'){
    var wool=NM(0xe8e4da), face=NM(0x3a3a3a);
    var bd=sph(0.42, wool, 8,6); bd.scale.set(1,0.9,1.35); bd.position.y=0.72; g.add(bd);
    g.add(box(0.2,0.2,0.24, face, 0,0.82,0.58));
    var legs2=[[0.14,0.24],[-0.14,0.24],[0.14,-0.24],[-0.14,-0.24]];
    for(var i2=0;i2<4;i2++){ var lg2=box(0.09,0.42,0.09, face, legs2[i2][0],0.21,legs2[i2][1]); g.add(lg2); c.legs.push(lg2); }
  } else if(kind==='bird'){
    var bm=NM(0x3d3d42);
    var bo=cone(0.1,0.4, bm, 5); bo.rotation.x=Math.PI/2; g.add(bo);
    var w1=box(0.5,0.03,0.22, bm, 0.28,0,0); g.add(w1);
    var w2=box(0.5,0.03,0.22, bm, -0.28,0,0); g.add(w2);
    c.wings.push(w1,w2);
  }
  scene.add(g); critters.push(c); return c;
}

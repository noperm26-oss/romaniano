function addFlame(x,y,z,scale){
  var f=new THREE.Mesh(new THREE.ConeGeometry(0.22*(scale||1),0.55*(scale||1),6), new THREE.MeshBasicMaterial({color:0xffc14d}));
  f.position.set(x,y,z);
  scene.add(f);
  flames.push(f);
  return f;
}
/* table / bench / rack / crate / bed / throne helpers (with colliders) */
function propTable(cx,cz,rot,w,dp){
  var y=groundH(cx,cz);
  var g=new THREE.Group(); g.position.set(cx,y,cz);
  var top=box(w,0.12,dp, M(0x7a5c39), 0,0.82,0); g.add(top);
  var lw=rot?dp:w, ld=rot?w:dp;
  g.add(box(0.12,0.8,0.12, M(0x5d4326), -lw/2+0.1,0.4,-ld/2+0.1));
  g.add(box(0.12,0.8,0.12, M(0x5d4326),  lw/2-0.1,0.4,-ld/2+0.1));
  g.add(box(0.12,0.8,0.12, M(0x5d4326), -lw/2+0.1,0.4, ld/2-0.1));
  g.add(box(0.12,0.8,0.12, M(0x5d4326),  lw/2-0.1,0.4, ld/2-0.1));
  scene.add(g);
  var ex=rot?dp/2:w/2, ez=rot?w/2:dp/2;
  addCollider(cx-ex,cz-ez,cx+ex,cz+ez);
}
function propBench(cx,cz,rot){
  var y=groundH(cx,cz);
  var w=rot?0.5:1.8, d=rot?1.8:0.5;
  scene.add(box(w,0.1,d, M(0x8a6a3c), cx,y+0.48,cz));
  scene.add(box(w*0.8,0.42,d*0.8, M(0x6e4a28), cx,y+0.24,cz));
}
function propRack(cx,cz,rot){
  var y=groundH(cx,cz);
  var dx=rot?0.15:1.4, dz=rot?1.4:0.15;
  scene.add(box(dx,1.5,dz, M(0x5d4326), cx,y+0.75,cz));
  var barW=rot?0.05:1.3, barD=rot?1.3:0.05;
  scene.add(box(barW,0.08,barD, M(0x5d4326), cx,y+1.35,cz));
  for(var i=-1;i<=1;i++){
    var bl=rot? box(0.07,0.7,0.16, M(0x9aa2ab), cx, y+1.0, cz+i*0.45)
              : box(0.16,0.7,0.07, M(0x9aa2ab), cx+i*0.45, y+1.0, cz);
    bl.rotation.z=rand(-0.12,0.12); scene.add(bl);
  }
  addCollider(cx-dx/2-0.2,cz-dz/2-0.2,cx+dx/2+0.2,cz+dz/2+0.2);
}
function propCrate(cx,cz,s){
  s=s||0.9;
  var y=groundH(cx,cz);
  scene.add(box(s,s,s, M(0x8a6a3c), cx,y+s/2,cz));
  addCollider(cx-s/2,cz-s/2,cx+s/2,cz+s/2);
}
function propBed(cx,cz,rot){
  var y=groundH(cx,cz);
  var w=rot?1.2:2.2, d=rot?2.2:1.2;
  scene.add(box(w,0.3,d, M(0x6e4a28), cx,y+0.25,cz));
  scene.add(box(w*0.92,0.18,d*0.92, M(0xb5a487), cx,y+0.48,cz));
  var pw=rot?w:0.5, pd=rot?0.5:d;
  scene.add(box(pw,0.14,pd, M(0xe8e0cf), cx+(rot?0:w*0.3), y+0.62, cz+(rot?d*0.3:0)));
  addCollider(cx-w/2,cz-d/2,cx+w/2,cz+d/2);
}
function propThrone(cx,cz,backZ){
  var y=groundH(cx,cz);
  scene.add(box(1.1,0.5,1.0, M(0x6e4a28), cx,y+0.35,cz));
  scene.add(box(1.1,1.5,0.16, M(0x6e4a28), cx,y+1.3,cz+backZ*0.42));
  scene.add(box(1.16,0.1,1.06, M(COL_GOLD), cx,y+0.62,cz));
  scene.add(box(0.9,0.7,0.5, M(0x8e1b1b), cx,y+0.85,cz-backZ*0.08));
}
function propBrazier(cx,cz,big){
  var y=groundH(cx,cz);
  var s=big?1.3:1.0;
  var bowl=cyl(0.32*s,0.2*s,0.3*s, M(0x50565e), 10); bowl.position.set(cx,y+0.45*s,cz); scene.add(bowl);
  var leg=cyl(0.1,0.14,0.45*s, M(0x3d3d42), 8); leg.position.set(cx,y+0.22*s,cz); scene.add(leg);
  addFlame(cx,y+0.7*s,cz,big?1.5:1.1);
}
var COL_GOLD=0xc9a227;
/*
  Collision for detailed buildings lives in architecture.js (wallColliders);
  the shell itself is emitted there as merged geometry.
*/
/*
  buildBuilding: full house with floor, walls, door, roof & interior.
  o = {x, z, w, d, h, wall, roofCol, roof:'gable'|'thatch'|'church'|'temple'|'long',
       door:'S'|'N', interior:'hall'|'house'|'barracks'|'temple'|'church'|'long', fac}
*/

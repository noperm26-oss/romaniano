/* ---------------- primitives: flames and free-standing props (world coordinates) ---------------- */
var FLAME_MAT=new THREE.MeshBasicMaterial({color:0xffc14d});
var FLAME_MAT2=new THREE.MeshBasicMaterial({color:0xff8a2a});
function addFlame(x,y,z,scale,noLight){
  var s=scale||1;
  var f=new THREE.Mesh(sharedGeometry('flame',function(){ return new THREE.ConeGeometry(0.22,0.55,6); }), s>1.2?FLAME_MAT2:FLAME_MAT);
  f.scale.set(s,s,s);
  f.position.set(x,y,z);
  if(typeof PREFAB_REC!=='undefined' && PREFAB_REC){ PREFAB_REC.flames.push({x:x,y:y,z:z,s:s}); }
  else { propAdd(f); flames.push(f); }
  if(!noLight) regLight(x,y+0.3*s,z,0xff9a3c,0.9*s,10+7*s,1);
  return f;
}
/* torch on a post — world coordinates, registers a pooled light */
function torchPost(x,z,h){
  var y=groundH(x,z), hh=h||2.4, kit=cellKit(x,z);
  kit.box(M2(0x5d4326),0.16,hh,0.16, x, y+hh/2, z);
  kit.cyln(M2(0x50565e),0.14,0.09,0.24,7, x, y+hh+0.1, z);
  addFlame(x,y+hh+0.42,z,0.9);
}
/* wall torch (bracket) at a world point */
function wallTorch(x,y,z){
  cellKit(x,z).cyln(M2(0x50565e),0.1,0.07,0.22,6, x, y, z);
  addFlame(x,y+0.3,z,0.75);
}
/* free-standing crate / barrel with colliders (world coordinates) */
function propCrate(cx,cz,s){
  s=s||0.9;
  var y=groundH(cx,cz);
  cellKit(cx,cz).box(M2(0x8a6a3c),s,s,s, cx,y+s/2,cz, (cx*0.37)%0.6);
  addCollider(cx-s/2,cz-s/2,cx+s/2,cz+s/2);
}
function propBarrel(cx,cz,big){
  var y=groundH(cx,cz), r=big?0.42:0.32, h=big?1.1:0.85, kit=cellKit(cx,cz);
  kit.cyln(M2(0x7a5c39),r,r*0.92,h,9, cx,y+h/2,cz);
  kit.cyln(M2(0x50565e),r+0.02,r+0.02,0.06,9, cx,y+h*0.25,cz); kit.cyln(M2(0x50565e),r+0.02,r+0.02,0.06,9, cx,y+h*0.75,cz);
  addCollider(cx-r,cz-r,cx+r,cz+r);
}
function propBrazier(cx,cz,big){
  var y=groundH(cx,cz), s=big?1.3:1.0, kit=cellKit(cx,cz);
  kit.cyln(M2(0x50565e),0.32*s,0.2*s,0.3*s,10, cx,y+0.45*s,cz);
  kit.cyln(M2(0x3d3d42),0.1,0.14,0.45*s,8, cx,y+0.22*s,cz);
  addFlame(cx,y+0.7*s,cz,big?1.5:1.1);
  addCollider(cx-0.35*s,cz-0.35*s,cx+0.35*s,cz+0.35*s);
}
/* campfire ring */
function propCampfire(cx,cz,big){
  var y=groundH(cx,cz), n=big?9:6, r=big?0.75:0.55, kit=cellKit(cx,cz);
  for(var i=0;i<n;i++){ var a=i/n*TAU; kit.box(M2(0x777772),0.3,0.22,0.3, cx+Math.cos(a)*r, y+0.1, cz+Math.sin(a)*r, a); }
  kit.cyln(M2(0x5d4326),0.1,0.12,1.3,6, cx,y+0.22,cz, 0.5,0,Math.PI/2);
  kit.cyln(M2(0x5d4326),0.1,0.12,1.3,6, cx,y+0.36,cz, -0.7,0,Math.PI/2);
  addFlame(cx,y+0.75,cz,big?1.6:1.1);
}
/* hay cart, wagon (solid) */
function propCart(cx,cz,ry,broken){
  var y=groundH(cx,cz), kit=cellKit(cx,cz), T=M2(0x7a5c39), D=M2(0x5d4326), rz=broken?0.35:0;
  kit.box(T,2.6,0.5,1.4, cx,y+0.85,cz, ry,0,rz);
  kit.box(D,2.6,0.12,0.12, cx,y+1.2,cz+0.66, ry,0,rz); kit.box(D,2.6,0.12,0.12, cx,y+1.2,cz-0.66, ry,0,rz);
  var c=Math.cos(ry||0), s=Math.sin(ry||0);
  function wheel(lx,lz){ kit.cyln(D,0.55,0.55,0.12,10, cx+lx*c+lz*s, y+0.55, cz-lx*s+lz*c, ry, Math.PI/2, 0); }
  wheel(-0.8,0.75); wheel(0.8,0.75); wheel(-0.8,-0.75);
  if(!broken){ wheel(0.8,-0.75); kit.box(D,0.12,0.12,2.4, cx+1.5*c, y+0.7, cz-1.5*s, ry); kit.box(M2(0xc9b24a),2.2,0.5,1.0, cx,y+1.35,cz, ry); }
  addCollider(cx-1.4,cz-0.9,cx+1.4,cz+0.9);
}
/* fence run (world, any angle) */
function propFence(x0,z0,x1,z1,h){
  var L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.2)), hh=h||1.1, i;
  var mx=(x0+x1)/2, mz=(z0+z1)/2, my=groundH(mx,mz), kit=cellKit(mx,mz), ry=-Math.atan2(z1-z0,x1-x0);
  for(i=0;i<=n;i++){ var t=i/n, px=x0+(x1-x0)*t, pz=z0+(z1-z0)*t, py=groundH(px,pz); kit.box(M2(0x5d4326),0.14,hh,0.14, px, py+hh/2, pz); }
  kit.box(M2(0x6b4f2e),L,0.08,0.08, mx, my+hh*0.85, mz, ry);
  kit.box(M2(0x6b4f2e),L,0.08,0.08, mx, my+hh*0.45, mz, ry);
  colliderAlong(x0,z0,x1,z1,0.12);
}
/* well with roof (solid) */
function propWell(cx,cz,roofCol){
  var y=groundH(cx,cz), kit=cellKit(cx,cz);
  kit.cyln(M2(0x8f8a80),1.1,1.2,1.0,10, cx,y+0.5,cz);
  kit.cyln(M2(0x3a3430),0.9,0.9,0.1,10, cx,y+1.0,cz);
  kit.box(M2(0x5d4326),0.13,2.4,0.13, cx-0.9, y+1.6, cz);
  kit.box(M2(0x5d4326),0.13,2.4,0.13, cx+0.9, y+1.6, cz);
  kit.cyln(M2(0x5d4326),0.08,0.08,2.0,6, cx,y+2.4,cz, 0,0,Math.PI/2);
  kit.pyr(M2(roofCol||0x6d5a3e),1.5,0.8,4, cx,y+3.2,cz, Math.PI/4);
  kit.cyln(M2(0x6b4f2e),0.16,0.13,0.25,7, cx,y+1.3,cz);
  addCollider(cx-1.2,cz-1.2,cx+1.2,cz+1.2);
  BUILD_COUNT++;
}
/* roadside troiță (wayside cross with a little roof) */
function propTroita(cx,cz,ry){
  var y=groundH(cx,cz), kit=cellKit(cx,cz), T=M2(0x6b4f2e), G=M2(0xc9a227);
  ry=ry||0; var c=Math.cos(ry), s=Math.sin(ry);
  kit.box(T,0.2,2.8,0.2, cx,y+1.4,cz, ry); kit.box(T,1.2,0.2,0.2, cx,y+2.1,cz, ry);
  kit.box(G,0.5,0.6,0.06, cx+0.12*s, y+1.6, cz+0.12*c, ry);
  kit.box(M2(0x5d4a38),1.6,0.08,0.7, cx,y+3.05,cz, ry);
  kit.box(G,0.06,0.5,0.06, cx,y+3.3,cz, ry); kit.box(G,0.3,0.06,0.06, cx,y+3.4,cz, ry);
  addCollider(cx-0.25,cz-0.25,cx+0.25,cz+0.25);
}
/* mile marker stone */
function propMarker(cx,cz){
  var y=groundH(cx,cz), kit=cellKit(cx,cz);
  kit.box(M2(0x8f8a80),0.5,1.1,0.4, cx, y+0.55, cz);
  kit.box(M2(0x241d16),0.3,0.3,0.05, cx, y+0.75, cz+0.21);
  addCollider(cx-0.25,cz-0.2,cx+0.25,cz+0.2);
}
/* grave: mound + cross */
function propGrave(cx,cz,ry,stone){
  var y=groundH(cx,cz), kit=cellKit(cx,cz); ry=ry||0; var c=Math.cos(ry), s=Math.sin(ry);
  kit.box(M2(0x6e5f43),0.9,0.3,1.8, cx,y+0.12,cz, ry);
  var hx=cx-0.8*s, hz=cz-0.8*c;
  if(stone){ kit.box(M2(0x8f8a80),0.7,0.9,0.16, hx,y+0.5,hz, ry); }
  else { kit.box(M2(0x5d4a38),0.1,1.3,0.1, hx,y+0.65,hz, ry); kit.box(M2(0x5d4a38),0.6,0.1,0.1, hx,y+0.95,hz, ry); }
}
/* stake / spike palisade piece */
function propStakes(cx,cz,ry,n){
  var y=groundH(cx,cz), kit=cellKit(cx,cz); n=n||5; ry=ry||0; var c=Math.cos(ry), s=Math.sin(ry);
  for(var i=0;i<n;i++){ var lx=i*0.5-n*0.25; kit.cyln(M2(0x6b4f2e),0.02,0.08,1.6,5, cx+lx*c, y+0.6, cz-lx*s, ry,0,0.7); }
}

/* ============================================================
   terrain.js — the ground of the eight zones, rivers and lakes
   ------------------------------------------------------------
   One vertex-coloured mesh (384×384 quads over 6,400u) painted
   from the palette in docs/WORLD-ULTRA-EXPANDED.md, plus water
   ribbons that follow the river troughs carved by geography.js.
   ============================================================ */
var WATER_MAT=null, ICE_MAT=null, waterSurfaces=[];
function makeWaterTexture(){
  var c=document.createElement('canvas'); c.width=128; c.height=128;
  var g=c.getContext('2d');
  g.fillStyle='#4a6a7a'; g.fillRect(0,0,128,128);
  for(var i=0;i<140;i++){
    g.strokeStyle='rgba(180,210,225,'+(0.06+Math.random()*0.16).toFixed(2)+')';
    g.lineWidth=1+Math.random()*1.5;
    var x=Math.random()*128, y=Math.random()*128, l=8+Math.random()*26;
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+l,y+Math.random()*3-1.5); g.stroke();
  }
  var t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,60);
  return t;
}
/* region weights — same smoothsteps as the height field, so colours never show a hard border */
/* soft-edged version of getRegion() (spec section 1.3 grid) — blends ~100u wide so palettes never cut hard */
function regionWeights(x,z,out){
  var ax=Math.abs(x), az=Math.abs(z);
  var mC=1-ss(-1850,-1750,z), mTr=ss(1950,2050,z), rest=(1-mC)*(1-mTr);
  var mCap=(1-ss(950,1050,Math.max(ax,az)))*rest, side=rest-mCap;
  var north=1-ss(-1050,-950,z), mid=(1-north)*(1-ss(150,250,z)), south=(1-north)*(1-mid);
  var west750=1-ss(-800,-700,x), east750=ss(700,800,x), westC=1-ss(-50,50,x);
  var eastMold=ss(950,1050,x)*(1-ss(350,450,z)), rimW=(1-ss(-2750,-2650,x))*ss(325,425,z);
  out.carpathian=mC; out.trade_route=mTr*(1-mC); out.capital=mCap;
  out.transylvanian=side*(north*west750 + mid*westC);
  out.moldavian=side*(north*east750 + mid*(1-westC) + south*eastMold);
  out.battlefield=side*(north*(1-west750-east750) + south*(1-eastMold)*rimW);
  out.wallachian=side*south*(1-eastMold)*(1-rimW);
  return out;
}
/* ---- the rendered ground grid: PlaneGeometry TM_SEGS² over TM_SIZE (diagonal b–d per cell) ---- */
var TM_SIZE=WORLD.half*2+400, TM_SEGS=512, TM_STEP=TM_SIZE/TM_SEGS, _tmNodes=new Map();
function terrainNodeH(ix,iz){
  var k=ix*4096+iz, v=_tmNodes.get(k);
  if(v===undefined){ v=groundHBase(-TM_SIZE/2+ix*TM_STEP, -TM_SIZE/2+iz*TM_STEP); _tmNodes.set(k,v); }
  return v;
}
/* height of the rendered mesh at (x,z): matches PlaneGeometry's triangulation exactly, so draped meshes never float */
function terrainMeshH(x,z){
  var fx=(x+TM_SIZE/2)/TM_STEP, fz=(z+TM_SIZE/2)/TM_STEP;
  var ix=clamp(Math.floor(fx),0,TM_SEGS-1), iz=clamp(Math.floor(fz),0,TM_SEGS-1), u=fx-ix, v=fz-iz;
  var ha=terrainNodeH(ix,iz), hb=terrainNodeH(ix,iz+1), hc=terrainNodeH(ix+1,iz+1), hd=terrainNodeH(ix+1,iz);
  if(u+v<=1) return ha+(hd-ha)*u+(hb-ha)*v;
  return hc+(hb-hc)*(1-u)+(hd-hc)*(1-v);
}
(function buildGround(){
  var _t0=performance.now();
  var size=TM_SIZE, segs=TM_SEGS;
  var geo=new THREE.PlaneGeometry(size,size,segs,segs);
  geo.rotateX(-Math.PI/2);
  var pos=geo.attributes.position;
  var colors=new Float32Array(pos.count*3);
  var C=function(h){ return new THREE.Color(h); };
  var pal={
    limestone:C(0x8a9aa8), snow:C(0xe8f0f8), pine:C(0x2f4a2e), rock:C(0x7a7a82), scree:C(0x6f7378),
    grass:C(0x7ea04a), wheat:C(0xc9b24a), vine:C(0x6b8f3a), road:C(0x9a8555),
    wgrass:C(0x6a8a3a), marsh:C(0x5a6a4a), mud:C(0x7a6a4a),
    mgrass:C(0x6b8f4a), forest:C(0x3a5a2e), mrock:C(0x7a7a6a), river:C(0x4a6a7a),
    dust:C(0xc2b08a), dry:C(0x9a8a6a), tbase:C(0xa4905f),
    cbase:C(0x8a9a6a), stone:C(0x9a9a8a), boulevard:C(0x8a8070), garden:C(0x6a8a5a),
    bbase:C(0x7a8a5a), scar:C(0x6e5f43), burned:C(0x5a4a3a), ash:C(0x3a3430), lakebed:C(0x3f4a44)
  };
  var w={}, tmp=new THREE.Color(), acc=new THREE.Color(), burnedSites=SITES_DEF.filter(function(s){ return s.kind==='burned'||s.kind==='graves'||s.kind==='siege'||s.kind==='memorial'; });
  var ROAD_PAINT={R0:C(0x9a9a8a), R1:C(0x9a8555), R1t:C(0xc2b08a), R2:C(0x9b8866), R3:C(0x8a7a5a)};
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i), z=pos.getZ(i);
    var h=terrainNodeH(i%(segs+1), Math.floor(i/(segs+1)));
    pos.setY(i,h);
    regionWeights(x,z,w);
    var n=Math.sin(x*0.13+z*0.17)*0.5+Math.sin(x*0.031-z*0.043)*0.5;
    var n2=Math.sin(x*0.011+1.7)*Math.cos(z*0.009-0.4);
    var n3=Math.sin(x*0.0021)*Math.cos(z*0.0027);
    acc.setRGB(0,0,0);
    /* Carpathians: forest floor low, scree, snow high */
    tmp.copy(pal.pine).lerp(pal.limestone, clamp((h-6)/22,0,1));
    if(n>0.25) tmp.lerp(pal.rock,0.3);
    if(n2>0.55) tmp.lerp(pal.scree,0.35);
    if(h>24) tmp.lerp(pal.snow, clamp((h-24)/9,0,1)*(0.7+0.3*n2));
    acc.r+=tmp.r*w.carpathian; acc.g+=tmp.g*w.carpathian; acc.b+=tmp.b*w.carpathian;
    /* Transylvania: wheat and vineyards in patches, oak woods on hilltops */
    tmp.copy(pal.grass);
    if(n2>0.35) tmp.lerp(pal.wheat, 0.55+0.3*n);
    else if(n2<-0.45) tmp.lerp(pal.vine, 0.6);
    if(h>7.5) tmp.lerp(pal.forest, clamp((h-7.5)/3,0,1)*0.55);
    acc.r+=tmp.r*w.transylvanian; acc.g+=tmp.g*w.transylvanian; acc.b+=tmp.b*w.transylvanian;
    /* Wallachia: grass, marsh in the hollows, mud along the water */
    tmp.copy(pal.wgrass);
    if(h<-1.2) tmp.lerp(pal.marsh, clamp((-1.2-h)/1.4,0,1));
    if(n<-0.35) tmp.lerp(pal.marsh,0.3);
    if(n2>0.6) tmp.lerp(pal.mud,0.3);
    acc.r+=tmp.r*w.wallachian; acc.g+=tmp.g*w.wallachian; acc.b+=tmp.b*w.wallachian;
    /* Moldavia: black forest with rock breaking through */
    tmp.copy(pal.mgrass).lerp(pal.forest, clamp(0.35+n*0.5,0,1));
    if(h>8) tmp.lerp(pal.mrock, clamp((h-8)/4,0,1)*0.6);
    if(n3>0.5) tmp.lerp(pal.mrock,0.2);
    acc.r+=tmp.r*w.moldavian; acc.g+=tmp.g*w.moldavian; acc.b+=tmp.b*w.moldavian;
    /* Trade route: dust and dry earth */
    tmp.copy(pal.tbase).lerp(pal.dust, 0.45+0.35*Math.sin(x*0.01));
    if(n<-0.5) tmp.lerp(pal.dry,0.4);
    acc.r+=tmp.r*w.trade_route; acc.g+=tmp.g*w.trade_route; acc.b+=tmp.b*w.trade_route;
    /* Capital: garden belt inside r300, paved districts to the wall at r520, boulevards fading outside */
    tmp.copy(pal.cbase);
    var dc=Math.sqrt(x*x+z*z);
    if(dc<300){ tmp.lerp(pal.garden, 0.55); if(n>0.45) tmp.lerp(pal.stone,0.4); }
    else if(dc<524) tmp.lerp(pal.stone, 0.75*ss(280,320,dc));
    else if(dc<620) tmp.lerp(pal.boulevard, 0.35*(1-(dc-524)/96));
    if(Math.abs(x-600)<130 && Math.abs(z-600)<130) tmp.lerp(pal.stone, 0.55*(1-ss(80,130,Math.max(Math.abs(x-600),Math.abs(z-600)))));
    acc.r+=tmp.r*w.capital; acc.g+=tmp.g*w.capital; acc.b+=tmp.b*w.capital;
    /* Battlefields: scarred plains */
    tmp.copy(pal.bbase).lerp(pal.scar, 0.15+0.25*Math.max(0,n));
    if(n2>0.7) tmp.lerp(pal.burned,0.3);
    acc.r+=tmp.r*w.battlefield; acc.g+=tmp.g*w.battlefield; acc.b+=tmp.b*w.battlefield;
    tmp.copy(acc);
    /* scarred / burned ground around war sites */
    for(var bi=0;bi<burnedSites.length;bi++){
      var S=burnedSites[bi], dsx=x-S.x, dsz=z-S.z, ds=Math.sqrt(dsx*dsx+dsz*dsz);
      if(ds<S.r*1.15){
        var k=1-ss(S.r*0.5,S.r*1.15,ds);
        tmp.lerp(S.kind==='burned'?pal.ash:pal.scar, k*(S.kind==='burned'?0.7:0.55));
      }
    }
    /* the rock-hall floor of the cave village is earth, not snow */
    if(Math.abs(x-MASSIF.cave.x)<74 && z>MASSIF.cave.z-48 && z<MASSIF.cave.z+46) tmp.lerp(pal.mud, 0.7);
    /* river banks: mud, then reeds/marsh */
    var rf=riverField(x,z);
    if(rf.river){
      var hw=rf.river.hw*(1+0.3*(1-ss(-2050,-1700,z)));
      if(rf.d<hw*0.75) tmp.lerp(pal.lakebed, 0.7*(1-rf.d/(hw*0.75)));
      else if(rf.d<hw*1.5) tmp.lerp(w.wallachian>0.5?pal.marsh:pal.mud, 0.45*(1-(rf.d-hw*0.75)/(hw*0.75)));
    }
    for(var li=0;li<LAKES.length;li++){
      var L=LAKES[li], dlx=x-L.x, dlz=z-L.z, dl=Math.sqrt(dlx*dlx+dlz*dlz);
      if(dl<L.r+16) tmp.lerp(L.frozen?pal.limestone:pal.lakebed, 0.6*(1-ss(L.r*0.6,L.r+16,dl)));
    }
    /* road verges: the ribbon itself is a mesh (roads.js); the ground under and beside it takes the class colour */
    var rd=roadField(x,z);
    if(rd.road && rd.d<rd.w/2+6){
      var rk=1-ss(rd.w/2-1, rd.w/2+6, rd.d);
      tmp.lerp(ROAD_PAINT[rd.cls]||pal.road, rk*0.8);
    }
    tmp.multiplyScalar(0.8);
    colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var ground=new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors:true}));
  ground.receiveShadow=true;
  ground.name='always';
  scene.add(ground);

  /* ---- water: rivers as ribbons over the troughs, lakes as discs ---- */
  WATER_MAT=new THREE.MeshLambertMaterial({color:0x6f8f9c, map:makeWaterTexture(), transparent:true, opacity:0.84, side:THREE.DoubleSide});
  ICE_MAT=new THREE.MeshLambertMaterial({color:0xcfe3ee, emissive:0x223038, transparent:true, opacity:0.96});
  RIVERS.forEach(function(R){
    var P=R.pts, verts=[], idx=[], i;
    for(i=0;i<P.length;i++){
      var a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)];
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1, nx=-dz/L, nz=dx/L;
      var mC=1-ss(-2050,-1700,P[i][1]);
      var hw=R.hw*(1+0.3*mC)*0.92;
      var y=riverWaterY(P[i][0],P[i][1]);
      var lx=P[i][0]+nx*hw, lz=P[i][1]+nz*hw, rx=P[i][0]-nx*hw, rz=P[i][1]-nz*hw;
      var yl=Math.max(y, terrainMeshH(lx,lz)+0.06, terrainMeshH(P[i][0]+nx*hw*0.5,P[i][1]+nz*hw*0.5)+0.06), yr=Math.max(y, terrainMeshH(rx,rz)+0.06, terrainMeshH(P[i][0]-nx*hw*0.5,P[i][1]-nz*hw*0.5)+0.06);
      y=Math.max(yl,yr);
      verts.push(lx, y, lz, rx, y, rz);
      if(i>0){ var v=i*2; idx.push(v-2,v-1,v, v-1,v+1,v); }
    }
    var g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts),3));
    var uv=new Float32Array(P.length*4);
    for(i=0;i<P.length;i++){ uv[i*4]=0; uv[i*4+1]=i*0.12; uv[i*4+2]=1; uv[i*4+3]=i*0.12; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv,2));
    g.setIndex(idx); g.computeVertexNormals();
    var m=new THREE.Mesh(g, WATER_MAT); m.name='always'; m.receiveShadow=true;
    scene.add(m); waterSurfaces.push(m);
  });
  LAKES.forEach(function(L){
    var y=groundHBase(L.x,L.z)+L.depth*0.55;
    var m=new THREE.Mesh(new THREE.CircleGeometry(L.r*1.02,28), L.frozen?ICE_MAT:WATER_MAT);
    m.rotation.x=-Math.PI/2; m.position.set(L.x,y,L.z); m.name='always'; m.receiveShadow=true;
    scene.add(m); waterSurfaces.push(m);
  });
  BOOT_TIMES.terrain=Math.round(performance.now()-_t0);
})();

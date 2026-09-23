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
/* ---- the rendered ground grid: TM_SEGS² over TM_SIZE, same layout as PlaneGeometry (diagonal b–d per cell) ---- */
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
var _groundJob=null;
/* same accumulation as BufferGeometry.computeVertexNormals, a few thousand faces at a time */
function groundNormals(geo, job, deadline){
  var idx=geo.index, pos=geo.attributes.position, nrm=geo.attributes.normal, st=job.nv;
  if(!nrm){ nrm=new THREE.BufferAttribute(new Float32Array(pos.count*3),3); geo.setAttribute('normal', nrm); }
  if(!st){
    st=job.nv={fi:0, ni:0, phase:0,
      i:new THREE.Vector3(), r:new THREE.Vector3(), s:new THREE.Vector3(),
      a:new THREE.Vector3(), o:new THREE.Vector3(), l:new THREE.Vector3(),
      c:new THREE.Vector3(), h:new THREE.Vector3(), u:new THREE.Vector3()};
  }
  if(st.phase===0){
    var start=st.fi, count=idx.count;
    for(; st.fi<count; st.fi+=3){
      if(deadline && st.fi>start && ((st.fi-start)&63)===0 && performance.now()>=deadline) return true;
      var d=idx.getX(st.fi), p=idx.getX(st.fi+1), m=idx.getX(st.fi+2);
      st.i.fromBufferAttribute(pos,d); st.r.fromBufferAttribute(pos,p); st.s.fromBufferAttribute(pos,m);
      st.c.subVectors(st.s, st.r); st.h.subVectors(st.i, st.r); st.c.cross(st.h);
      st.a.fromBufferAttribute(nrm,d); st.o.fromBufferAttribute(nrm,p); st.l.fromBufferAttribute(nrm,m);
      st.a.add(st.c); st.o.add(st.c); st.l.add(st.c);
      nrm.setXYZ(d, st.a.x, st.a.y, st.a.z);
      nrm.setXYZ(p, st.o.x, st.o.y, st.o.z);
      nrm.setXYZ(m, st.l.x, st.l.y, st.l.z);
    }
    st.phase=1; st.ni=0;
    if(deadline && performance.now()>=deadline) return true;
  }
  var ncount=nrm.count, nstart=st.ni;
  for(; st.ni<ncount; st.ni++){
    if(deadline && st.ni>nstart && ((st.ni-nstart)&63)===0 && performance.now()>=deadline) return true;
    st.u.fromBufferAttribute(nrm, st.ni); st.u.normalize(); nrm.setXYZ(st.ni, st.u.x, st.u.y, st.u.z);
  }
  nrm.needsUpdate=true;
  return false;
}
function buildGround(budget){
  var tEnd=budget?performance.now()+budget:1e15;
  var j=_groundJob;
  if(!j){
  j=_groundJob={phase:-1, iy:0, faceY:0, segs:TM_SEGS, size:TM_SIZE};
  if(budget) return true;
  }
  if(j.phase===-1){
  if(!j.posArr){
    var segs0=j.segs, n0=segs0+1;
    j.n=n0;
    j.posArr=new Float32Array(n0*n0*3);
    j.nrmArr=new Float32Array(n0*n0*3);
    j.uvArr=new Float32Array(n0*n0*2);
    j.idxArr=new Uint32Array(segs0*segs0*6);
    if(budget && performance.now()>=tEnd) return true;
  }
  var segs=j.segs, n=j.n, step=j.size/segs, half=j.size/2, ix, ix2;
  for(; j.iy<=segs; j.iy++){
    if(budget && j.iy && performance.now()>=tEnd) return true;
    var z=-half+j.iy*step, row=j.iy*n, base=row*3, ub=row*2, vv=1-j.iy/segs;
    for(ix=0; ix<n; ix++){
      j.posArr[base+ix*3]=-half+ix*step;
      j.posArr[base+ix*3+2]=z;
      j.nrmArr[base+ix*3+1]=1;
      j.uvArr[ub+ix*2]=ix/segs;
      j.uvArr[ub+ix*2+1]=vv;
    }
  }
  for(; j.faceY<segs; j.faceY++){
    if(budget && j.faceY && performance.now()>=tEnd) return true;
    var o=j.faceY*segs*6, rowF=j.faceY*n;
    for(ix2=0; ix2<segs; ix2++){
      var a=rowF+ix2, b=a+n, d=a+1, c=b+1, k=o+ix2*6;
      j.idxArr[k]=a; j.idxArr[k+1]=b; j.idxArr[k+2]=d;
      j.idxArr[k+3]=b; j.idxArr[k+4]=c; j.idxArr[k+5]=d;
    }
  }
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(j.posArr, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(j.nrmArr, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(j.uvArr, 2));
  geo.setIndex(new THREE.BufferAttribute(j.idxArr, 1));
  var pos=geo.attributes.position;
  var colors=new Float32Array(pos.count*3);
  var C=function(h){ return new THREE.Color(h); };
  var pal={
    limestone:C(0x8a9aa8), snow:C(0xe8f0f8), pine:C(0x2f4a2e), rock:C(0x7a7a82), scree:C(0x6f7378),
    grass:C(0x648c40), wheat:C(0xb4a15a), vine:C(0x6b8f3a), road:C(0x9a8555),
    wgrass:C(0x5e843f), marsh:C(0x5a6a4a), mud:C(0x7a6a4a),
    mgrass:C(0x628846), forest:C(0x3a5a2e), mrock:C(0x7a7a6a), river:C(0x4a6a7a),
    dust:C(0xb8a684), dry:C(0x9a8a6a), tbase:C(0xa4905f),
    cbase:C(0x8a9a6a), stone:C(0x9a9a8a), boulevard:C(0x8a8070), garden:C(0x6a8a5a),
    bbase:C(0x7a8a5a), scar:C(0x6e5f43), burned:C(0x5a4a3a), ash:C(0x3a3430), lakebed:C(0x3f4a44)
  };
  var w={}, tmp=new THREE.Color(), acc=new THREE.Color(), burnedSites=SITES_DEF.filter(function(s){ return s.kind==='burned'||s.kind==='graves'||s.kind==='siege'||s.kind==='memorial'; });
  var ROAD_PAINT={R0:C(0x9a9a8a), R1:C(0x9a8555), R1t:C(0xc2b08a), R2:C(0x9b8866), R3:C(0x8a7a5a)};
  var arr=pos.array;
  j.geo=geo; j.pos=pos; j.colors=colors; j.arr=arr; j.w=w; j.tmp=tmp; j.acc=acc; j.burnedSites=burnedSites; j.ROAD_PAINT=ROAD_PAINT; j.pal=pal; j.i=0; j.phase=0;
  if(budget) return true;
  }
  if(j.phase===0){
  var arr=j.arr, pos=j.pos, segs=j.segs, colors=j.colors, w=j.w, tmp=j.tmp, acc=j.acc, pal=j.pal, burnedSites=j.burnedSites, ROAD_PAINT=j.ROAD_PAINT;
  for(; j.i<pos.count; j.i++){
    if(budget && performance.now()>=tEnd) return true;
    var i=j.i;
    var i3=i*3, x=arr[i3], z=arr[i3+2];
    var h=terrainNodeH(i%(segs+1), Math.floor(i/(segs+1)));
    arr[i3+1]=h;
    regionWeights(x,z,w);
    var n=Math.sin(x*0.13+z*0.17)*0.5+Math.sin(x*0.031-z*0.043)*0.5;
    var n2=Math.sin(x*0.011+1.7)*Math.cos(z*0.009-0.4);
    var n3=Math.sin(x*0.0021)*Math.cos(z*0.0027);
    acc.setRGB(0,0,0);
    /* a zero region weight adds nothing — skip that blend so the colour stays identical */
    if(w.carpathian){
    /* Carpathians: forest floor low, scree, snow high */
    tmp.copy(pal.pine).lerp(pal.limestone, clamp((h-6)/22,0,1));
    if(n>0.25) tmp.lerp(pal.rock,0.3);
    if(n2>0.55) tmp.lerp(pal.scree,0.35);
    if(h>24) tmp.lerp(pal.snow, clamp((h-24)/9,0,1)*(0.7+0.3*n2));
    acc.r+=tmp.r*w.carpathian; acc.g+=tmp.g*w.carpathian; acc.b+=tmp.b*w.carpathian;
    }
    if(w.transylvanian){
    /* Transylvania: wheat and vineyards in patches, oak woods on hilltops */
    tmp.copy(pal.grass);
    if(n2>0.35) tmp.lerp(pal.wheat, 0.55+0.3*n);
    else if(n2<-0.45) tmp.lerp(pal.vine, 0.6);
    if(h>7.5) tmp.lerp(pal.forest, clamp((h-7.5)/3,0,1)*0.55);
    acc.r+=tmp.r*w.transylvanian; acc.g+=tmp.g*w.transylvanian; acc.b+=tmp.b*w.transylvanian;
    }
    if(w.wallachian){
    /* Wallachia: grass, marsh in the hollows, mud along the water */
    tmp.copy(pal.wgrass);
    if(h<-1.2) tmp.lerp(pal.marsh, clamp((-1.2-h)/1.4,0,1));
    if(n<-0.35) tmp.lerp(pal.marsh,0.3);
    if(n2>0.6) tmp.lerp(pal.mud,0.3);
    acc.r+=tmp.r*w.wallachian; acc.g+=tmp.g*w.wallachian; acc.b+=tmp.b*w.wallachian;
    }
    if(w.moldavian){
    /* Moldavia: black forest with rock breaking through */
    tmp.copy(pal.mgrass).lerp(pal.forest, clamp(0.35+n*0.5,0,1));
    if(h>8) tmp.lerp(pal.mrock, clamp((h-8)/4,0,1)*0.6);
    if(n3>0.5) tmp.lerp(pal.mrock,0.2);
    acc.r+=tmp.r*w.moldavian; acc.g+=tmp.g*w.moldavian; acc.b+=tmp.b*w.moldavian;
    }
    if(w.trade_route){
    /* Trade route: dust and dry earth */
    tmp.copy(pal.tbase).lerp(pal.dust, 0.45+0.35*Math.sin(x*0.01));
    if(n<-0.5) tmp.lerp(pal.dry,0.4);
    acc.r+=tmp.r*w.trade_route; acc.g+=tmp.g*w.trade_route; acc.b+=tmp.b*w.trade_route;
    }
    if(w.capital){
    /* Capital: garden belt inside r300, paved districts to the wall at r520, boulevards fading outside */
    tmp.copy(pal.cbase);
    var dc=Math.sqrt(x*x+z*z);
    if(dc<300){ tmp.lerp(pal.garden, 0.55); if(n>0.45) tmp.lerp(pal.stone,0.4); }
    else if(dc<524) tmp.lerp(pal.stone, 0.75*ss(280,320,dc));
    else if(dc<620) tmp.lerp(pal.boulevard, 0.35*(1-(dc-524)/96));
    if(Math.abs(x-600)<130 && Math.abs(z-600)<130) tmp.lerp(pal.stone, 0.55*(1-ss(80,130,Math.max(Math.abs(x-600),Math.abs(z-600)))));
    acc.r+=tmp.r*w.capital; acc.g+=tmp.g*w.capital; acc.b+=tmp.b*w.capital;
    }
    if(w.battlefield){
    /* Battlefields: scarred plains */
    tmp.copy(pal.bbase).lerp(pal.scar, 0.15+0.25*Math.max(0,n));
    if(n2>0.7) tmp.lerp(pal.burned,0.3);
    acc.r+=tmp.r*w.battlefield; acc.g+=tmp.g*w.battlefield; acc.b+=tmp.b*w.battlefield;
    }
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
    var rf=riverField(x,z,64);
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
    tmp.multiplyScalar(0.92);   /* noon light sums to ~1.25; the surface shader adds its own ±15% */
    colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
  }
  j.phase=1;
  if(budget && performance.now()>=tEnd) return true;
  }
  if(j.phase===1){
  j.geo.setAttribute('color', new THREE.BufferAttribute(j.colors,3));
  j.phase=2;
  if(budget) return true;
  }
  if(j.phase===2){
  var geo=j.geo;
  if(groundNormals(geo, j, budget?tEnd:0)) return true;
  var ground=new THREE.Mesh(geo, surfApply(new THREE.MeshLambertMaterial({vertexColors:true}), SURF.GROUND));
  ground.receiveShadow=true;
  ground.name='always';
  scene.add(ground);
  j.phase=3;
  j.ri=0; j.li=0;
  if(budget && performance.now()>=tEnd) return true;
  }
  if(j.phase!==3) return false;

  /* ---- water: rivers as ribbons over the troughs, lakes as discs ---- */
  if(!j.waterReady){
  WATER_MAT=new THREE.MeshLambertMaterial({color:0x6f8f9c, map:makeWaterTexture(), transparent:true, opacity:0.84, side:THREE.DoubleSide});
  ICE_MAT=new THREE.MeshLambertMaterial({color:0xcfe3ee, emissive:0x223038, transparent:true, opacity:0.96});
  j.waterReady=1; j.ri=0; j.li=0;
  }
  for(; j.ri<RIVERS.length; j.ri++){
    var R=RIVERS[j.ri];
    var P=R.pts;
    if(!j.rv || j.rv.ri!==j.ri) j.rv={ri:j.ri, i:0, verts:[], idx:[]};
    var rv=j.rv, verts=rv.verts, idx=rv.idx, i;
    for(; rv.i<P.length; rv.i++){
      if(budget && rv.i && (rv.i&31)===0 && performance.now()>=tEnd) return true;
      i=rv.i;
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
    j.rv=null;
    if(budget && performance.now()>=tEnd) return true;
  }
  for(; j.li<LAKES.length; j.li++){
    if(budget && performance.now()>=tEnd) return true;
    var L=LAKES[j.li];
    var y=groundHBase(L.x,L.z)+L.depth*0.55;
    var m=new THREE.Mesh(new THREE.CircleGeometry(L.r*1.02,28), L.frozen?ICE_MAT:WATER_MAT);
    m.rotation.x=-Math.PI/2; m.position.set(L.x,y,L.z); m.name='always'; m.receiveShadow=true;
    scene.add(m); waterSurfaces.push(m);
  }
  _groundJob=null;
  return false;
}

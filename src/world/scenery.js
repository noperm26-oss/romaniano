/* ============================================================
   scenery.js — the living land: rim peaks, forests, rocks,
   reeds, vineyards, clouds. Instanced per 375u bucket so the
   whole 6,000u world costs a few dozen draw calls.
   ============================================================ */
var clouds=[], flames=[];
var waveBanners=[];
var nightLights=[];
var LANDMARKS=[];
var critters=[];
var chests=[];
function registerLore(o){ o.idx=LANDMARKS.length; LANDMARKS.push(o); return o; }
var scenery={};

/* deterministic random for world dressing (same forest every boot) */

/* generic bucketed instancing: items=[{m:Matrix4, c:hex}] → InstancedMesh per 375u cell with cullBounds */
function bucketIM(geo, items, mat, name, opts){
  opts=opts||{};
  if(!items.length) return 0;
  var buckets=new Map(), cell=opts.cell||375;
  items.forEach(function(it,i){
    var e=it.m.elements, bx=Math.floor((e[12]+WORLD.half)/cell), bz=Math.floor((e[14]+WORLD.half)/cell), key=bx+':'+bz;
    if(!buckets.has(key)) buckets.set(key,{x:bx,z:bz,items:[]});
    buckets.get(key).items.push(i);
  });
  var made=0;
  buckets.forEach(function(b){
    var im=new THREE.InstancedMesh(geo, mat, b.items.length);
    var _bc=new THREE.Color();
    b.items.forEach(function(orig,i){ im.setMatrixAt(i, items[orig].m); if(items[orig].c!==undefined) im.setColorAt(i, _bc.setHex(items[orig].c)); });
    im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true;
    im.frustumCulled=false; im.name=name||'scenery-chunk';
    im.castShadow=opts.shadow!==false; im.receiveShadow=true;
    im.userData.cullBounds={x:(b.x+0.5)*cell-WORLD.half, z:(b.z+0.5)*cell-WORLD.half, r:cell*0.76};
    scene.add(im); made++;
  });
  return made;
}
var _imM4=new THREE.Matrix4(), _imQ=new THREE.Quaternion(), _imE=new THREE.Euler(), _imV=new THREE.Vector3(), _imS=new THREE.Vector3();
function imItem(x,y,z,ry,sx,sy,sz,col,rx,rz){
  _imE.set(rx||0,ry||0,rz||0); _imQ.setFromEuler(_imE); _imV.set(x,y,z); _imS.set(sx,sy,sz);
  _imM4.compose(_imV,_imQ,_imS);
  return {m:_imM4.clone(), c:col};
}

/* keep-out test shared by trees, rocks, reeds: sites, towns, roads, rivers, lakes */
function sceneryRoadDist(x,z){ var f=roadField(x,z); return f.d-(f.w||8)/2; }
function sceneryBlocked(x,z,margin){
  var i, gx=Math.floor(x/FLAT_CELL), gz=Math.floor(z/FLAT_CELL);
  if(!FLAT_GRID) flatGridBuild();
  for(var ix=-1;ix<=1;ix++) for(var iz=-1;iz<=1;iz++){
    var arr=FLAT_GRID.get((gx+ix)*4096+(gz+iz)); if(!arr) continue;
    for(i=0;i<arr.length;i++){
      var f=arr[i], dx=x-f.x, dz=z-f.z, rr=f.r+(margin||0);
      if(dx*dx+dz*dz<rr*rr) return true;
    }
  }
  if(sceneryRoadDist(x,z)<5) return true;
  var rf=riverField(x,z,48);
  if(rf.river && rf.d<rf.river.hw*1.25+3) return true;
  for(i=0;i<LAKES.length;i++){ var L=LAKES[i]; if((x-L.x)*(x-L.x)+(z-L.z)*(z-L.z)<(L.r+6)*(L.r+6)) return true; }
  return false;
}

/* trees and rocks outside the loaded area keep the same seed, but their meshes wait until the reach includes them */
var SCENERY_LATER=[];
function sceneryEmit(list, kind, x,y,z,ry,sx,sy,sz,col,rx,rz){
  if(typeof inLoadArea==='function' && !inLoadArea(x,z)){
    SCENERY_LATER.push(kind,x,y,z,ry,sx,sy,sz,col,rx||0,rz||0);
    return;
  }
  list.push(imItem(x,y,z,ry,sx,sy,sz,col,rx,rz));
}
function sceneryFlushHeld(flat){
  var lists=[[],[],[],[],[],[],[],[],[],[],[]], i, k;
  for(i=0;i<flat.length;i+=11){
    lists[flat[i]].push(imItem(flat[i+1],flat[i+2],flat[i+3],flat[i+4],flat[i+5],flat[i+6],flat[i+7],flat[i+8],flat[i+9],flat[i+10]));
  }
  var trunk=sharedGeometry('sc-trunk',function(){ return new THREE.CylinderGeometry(0.4,0.55,1,6); });
  var cone=sharedGeometry('sc-cone',function(){ return new THREE.ConeGeometry(0.5,1,7); });
  var sphG=sharedGeometry('sc-sph',function(){ return new THREE.SphereGeometry(0.5,7,5); });
  var rock=sharedGeometry('sc-rock',function(){ return new THREE.IcosahedronGeometry(0.5,0); });
  var box=sharedGeometry('sc-box',function(){ return new THREE.BoxGeometry(1,1,1); });
  var reed=sharedGeometry('sc-reed',function(){ return new THREE.ConeGeometry(0.08,1,4); });
  var stump=sharedGeometry('sc-stump',function(){ return new THREE.CylinderGeometry(0.5,0.6,1,7); });
  var white=M(0xffffff);
  var geos=[trunk,cone,trunk,sphG,trunk,rock,rock,reed,box,box,stump];
  var names=['forest','forest','forest','forest','forest','rocks','rocks','reeds','vines','vines','stumps'];
  for(k=0;k<11;k++) if(lists[k].length) bucketIM(geos[k], lists[k], white, names[k], {shadow:k<7});
}
function loadAreaScenery(budget){
  if(!SCENERY_LATER.length) return false;
  var tEnd=performance.now()+(budget||8), a=SCENERY_LATER, still=[], take=[], i, k, cut=false;
  for(i=0;i<a.length;i+=11){
    if(inLoadArea(a[i+1], a[i+3])){ for(k=0;k<11;k++) take.push(a[i+k]); }
    else { for(k=0;k<11;k++) still.push(a[i+k]); }
    if(take.length>=660 && performance.now()>=tEnd){
      for(k=i+11;k<a.length;k++) still.push(a[k]);
      cut=true; break;
    }
  }
  SCENERY_LATER=still;
  if(take.length) sceneryFlushHeld(take);
  return cut;
}
var _fieldJob=null;
function buildField(budget){
  var tEnd=budget?performance.now()+budget:1e15;
  function over(){ return !!(budget && performance.now()>=tEnd); }
  var j=_fieldJob;
  if(!j){
    j=_fieldJob={phase:'rim', rnd:srand(20260919), wi:0, mi:0, ci:0, gz:-2880, gx:-2880, placed:0, ri:0, qi:0, vi:0, si:0, w:{},
      pineTrunk:[], pineTop:[], oakTrunk:[], oakTop:[], deadTrunk:[], rocks:[], bigRocks:[], reeds:[], vinePosts:[], vineRows:[], stumps:[],
      rimM:M(0x7d94a5), rimSnow:M(0xe8f0f8), rimDark:M(0x6c8090), cm:null};
  }
  var rnd=j.rnd, rimM=j.rimM, rimSnow=j.rimSnow, rimDark=j.rimDark, w=j.w;
  var pineTrunk=j.pineTrunk, pineTop=j.pineTop, oakTrunk=j.oakTrunk, oakTop=j.oakTop, deadTrunk=j.deadTrunk;
  var rocks=j.rocks, bigRocks=j.bigRocks, reeds=j.reeds, vinePosts=j.vinePosts, vineRows=j.vineRows, stumps=j.stumps;
  /* ---- rim peaks: a square wall of mountains just outside the 6,000 × 6,000 world, highest in the north ---- */
  function peak(x,z,wrad,wh,dark){
    var wall=cone(wrad, wh, dark?rimDark:rimM, 7); wall.name='always';
    wall.position.set(x, wh*0.32, z); wall.castShadow=false; scene.add(wall);
    var cap=cone(wrad*0.34, wh*0.34, rimSnow, 7); cap.name='always';
    cap.position.set(x, wh*0.32+wh*0.33, z); cap.castShadow=false; scene.add(cap);
  }
  /* a peak may not swallow anything built: named places, villages, towns, roads — and the hamlets and farmsteads
     of the countryside (a cone over a hamlet hides the hamlet from outside and shows its underside from within) */
  function peakBlocked(x,z,r){
    var i;
    for(i=0;i<SITES_DEF.length;i++){ var S=SITES_DEF[i]; if(Math.hypot(x-S.x,z-S.z)<S.r+r+30) return true; }
    for(i=0;i<VILLAGES.length;i++){ if(Math.hypot(x-VILLAGES[i].x,z-VILLAGES[i].z)<r+90) return true; }
    for(i=0;i<FAC_KEYS_T.length;i++){ var T=TOWNS[FAC_KEYS_T[i]]; if(Math.hypot(x-T.x,z-T.z)<r+320) return true; }
    for(i=0;i<HAMLETS.length;i++){ if(Math.hypot(x-HAMLETS[i].x,z-HAMLETS[i].z)<r+85) return true; }
    for(i=0;i<DISTRICT_C.length;i++){ if(Math.hypot(x-DISTRICT_C[i].x,z-DISTRICT_C[i].z)<r+70) return true; }
    if(sceneryRoadDist(x,z)<r*0.6) return true;
    return false;
  }
  if(j.phase==='rim'){
  for(; j.wi<128; j.wi++){
    if(over() && j.wi) return true;
    var wi=j.wi;
    var side=wi%4, t=(Math.floor(wi/4)+rnd()*0.9)/32*6600-3300, off=3110+rnd()*130, wx, wz;
    if(side===0){ wx=t; wz=-off; } else if(side===1){ wx=t; wz=off; } else if(side===2){ wx=-off; wz=t; } else { wx=off; wz=t; }
    var north=wz<-2400?1:0, wrad=190+rnd()*110, wh=95+rnd()*85+north*90;
    if(peakBlocked(wx,wz,wrad)){ wrad=150; if(peakBlocked(wx,wz,wrad)) continue; }   /* the rim keeps its skirt off the border hamlets */
    peak(wx, wz, wrad, wh, wi%3===0);
  }
  j.phase='massif';
  if(over()) return true;
  }
  if(j.phase==='massif'){
  for(; j.mi<60; j.mi++){
    if(over() && j.mi) return true;
    var mi=j.mi;
    var mx=rnd()*5400-2700, mz=-3000+rnd()*1050, mrad=110+rnd()*120, mh=(70+rnd()*90)*(1-ss(-2600,-1950,mz))+40;
    if(mz>-1950||peakBlocked(mx,mz,mrad)) continue;
    peak(mx, mz, mrad, mh, mi%2===0);
  }
  j.phase='clouds';
  if(over()) return true;
  }
  if(j.phase==='clouds'){
  if(!j.cm) j.cm=new THREE.MeshLambertMaterial({color:0xe6eaee, emissive:0x7d8a99});
  var cm=j.cm;
  for(; j.ci<30; j.ci++){
    if(over() && j.ci) return true;
    var ci=j.ci;
    var cl=new THREE.Group();
    var parts=3+Math.floor(rnd()*3);
    for(var pi=0; pi<parts; pi++){
      var ps=sph(3+rnd()*3, cm, 8, 6);
      ps.scale.y=0.42; ps.castShadow=false;
      ps.position.set(rnd()*9-4.5, rnd()-0.5, rnd()*4-2);
      cl.add(ps);
    }
    if(ci<10) cl.position.set(rnd()*2400-1200, 92+rnd()*24, -2650+rnd()*900);
    else cl.position.set(rnd()*2400-1200, 52+rnd()*26, rnd()*2400-1200);
    scene.add(cl); clouds.push(cl);
  }
  j.phase='forest';
  if(over()) return true;
  }
  if(j.phase==='forest'){
  for(; j.gz<2880; j.gz+=22){
  for(; j.gx<2880; j.gx+=22){
    if(over()) return true;
    var gx=j.gx, gz=j.gz;
    var x=gx+rnd()*20-10, z=gz+rnd()*20-10;
    regionWeights(x,z,w);
    var n=Math.sin(x*0.0072+1.1)*Math.cos(z*0.0066-0.3)+0.5*Math.sin(x*0.021)*Math.sin(z*0.019);
    /* height only changes the Carpathian and Transylvanian odds; everywhere else it is asked after the reject so the seed stays identical */
    var h, kind=null, p=0;
    if(w.carpathian>0.5){ h=groundH(x,z); p=h<27 ? 0.62-0.012*Math.max(0,h-12) : 0; kind='pine'; if(n<-0.55) p*=0.25; }
    else if(w.moldavian>0.5){ p=0.55+0.25*n; kind=rnd()<0.75?'pine':'oak'; }
    else if(w.transylvanian>0.5){ h=groundH(x,z); p=h>7 ? 0.55 : 0.09; kind='oak'; }
    else if(w.wallachian>0.5){ p=0.09; kind='oak'; }
    else if(w.trade_route>0.5){ p=0.045; kind='oak'; }
    else if(w.capital>0.5){ p=Math.max(Math.abs(x),Math.abs(z))>430 ? 0.16 : 0; kind='oak'; }
    else { p=0.14+0.1*n; kind=rnd()<0.3?'dead':'oak'; }
    if(p<=0||rnd()>p) continue;
    if(h===undefined) h=groundH(x,z);
    if(sceneryBlocked(x,z,14)) continue;
    var s=0.8+rnd()*0.55, ry=rnd()*TAU;
    if(kind==='pine'){
      var dark=w.moldavian>0.5;
      sceneryEmit(pineTrunk,0,x,h+1.4*s,z,ry,0.36*s,2.8*s,0.36*s,0x4a3a2a);
      sceneryEmit(pineTop,1,x,h+3.6*s,z,ry,2.6*s,4.2*s,2.6*s,dark?0x2a4126:(h>18?0x3d5a3c:0x2f4a2e));
      sceneryEmit(pineTop,1,x,h+5.6*s,z,ry+0.4,1.8*s,3.2*s,1.8*s,dark?0x243a20:0x35533a);
    } else if(kind==='oak'){
      var dusty=w.trade_route>0.5;
      sceneryEmit(oakTrunk,2,x,h+1.1*s,z,ry,0.42*s,2.2*s,0.42*s,0x5d4326);
      sceneryEmit(oakTop,3,x,h+3.1*s,z,ry,3.0*s,2.6*s,3.0*s,dusty?0x7a8a5a:(rnd()<0.5?0x4a7a37:0x57893f));
      if(rnd()<0.6) sceneryEmit(oakTop,3,x+0.7*s,h+3.7*s,z-0.4*s,ry,2.0*s,1.9*s,2.0*s,0x3f6a30);
    } else {
      sceneryEmit(deadTrunk,4,x,h+1.5*s,z,ry,0.32*s,3.0*s,0.32*s,0x3a3028,0,0.12);
      sceneryEmit(deadTrunk,4,x+0.5*s,h+2.6*s,z,ry,0.12*s,1.5*s,0.12*s,0x3a3028,0,0.8);
    }
    j.placed++;
  }
  j.gx=-2880;
  }
  j.phase='rocks';
  if(over()) return true;
  }
  if(j.phase==='rocks'){
  for(; j.ri<2600; j.ri++){
    if(over() && j.ri) return true;
    var ri=j.ri;
    var rx=rnd()*5800-2900, rz=rnd()*5800-2900;
    regionWeights(rx,rz,w);
    var pr=w.carpathian*0.9+w.moldavian*0.5+w.battlefield*0.2+w.transylvanian*0.12+w.wallachian*0.05+w.trade_route*0.15+w.capital*0.05;
    if(rnd()>pr) continue;
    if(sceneryBlocked(rx,rz,10)) continue;
    var rh=groundH(rx,rz), rs=0.5+rnd()*1.6+(w.carpathian>0.5?rnd()*1.6:0);
    var col=w.carpathian>0.5?0x8a8a86:(w.trade_route>0.5?0xa09070:0x777772);
    var ryR=rnd()*3, rxR=rnd()*0.5, rzR=rnd()*0.5;
    if(rs>1.7){ sceneryEmit(bigRocks,6,rx,rh+rs*0.35,rz,ryR,rs*1.4,rs,rs*1.2,col,rxR,rzR); addCollider(rx-rs*0.6,rz-rs*0.55,rx+rs*0.6,rz+rs*0.55); }
    else sceneryEmit(rocks,5,rx,rh+rs*0.3,rz,ryR,rs*1.3,rs*0.9,rs,col,rxR,rzR);
  }
  j.phase='reeds';
  if(over()) return true;
  }
  if(j.phase==='reeds'){
  for(; j.qi<9000; j.qi++){
    if(over() && j.qi) return true;
    var qi=j.qi;
    var qx=rnd()*5800-2900, qz=rnd()*5800-2900;
    regionWeights(qx,qz,w);
    if(w.wallachian<0.4 && w.trade_route<0.4 && w.capital<0.4) continue;
    var rf=riverField(qx,qz,64), rd=rf.d, rriv=rf.river, qh=groundH(qx,qz), ok=false;
    if(rriv && rd>rriv.hw*0.85 && rd<rriv.hw*1.7) ok=true;
    if(w.wallachian>0.5 && qh<-1.3) ok=rnd()<0.5;
    for(var lk=0; lk<LAKES.length && !ok; lk++){ var L=LAKES[lk]; var dl=Math.hypot(qx-L.x,qz-L.z); if(!L.frozen && dl>L.r*0.95 && dl<L.r+9) ok=true; }
    if(!ok) continue;
    if(sceneryRoadDist(qx,qz)<3) continue;
    if(!FLAT_GRID) flatGridBuild();
    var farr=FLAT_GRID.get(Math.floor(qx/FLAT_CELL)*4096+Math.floor(qz/FLAT_CELL));
    if(farr) for(var fi=0; fi<farr.length; fi++){ var F=farr[fi], fdx=qx-F.x, fdz=qz-F.z; if(F.r>100 && fdx*fdx+fdz*fdz<F.r*F.r){ ok=false; break; } }
    if(!ok) continue;
    var qs=0.8+rnd()*0.7;
    sceneryEmit(reeds,7,qx,qh+0.9*qs,qz,rnd()*TAU,0.9*qs,1.8*qs,0.9*qs,rnd()<0.5?0x8a9a5a:0x6f8a48,rnd()*0.2-0.1,rnd()*0.2-0.1);
  }
  j.phase='vines';
  if(over()) return true;
  }
  if(j.phase==='vines'){
  for(; j.vi<2600; j.vi++){
    if(over() && j.vi) return true;
    var vi=j.vi;
    var vx=rnd()*1900-2950, vz=rnd()*1900-1750;
    if(getRegion(vx,vz)!=='transylvanian') continue;
    var vn=Math.sin(vx*0.011+1.7)*Math.cos(vz*0.009-0.4);
    if(vn>-0.45) continue;
    if(sceneryBlocked(vx,vz,20)) continue;
    var vh=groundH(vx,vz), va=Math.round(vn*4)%2?0:Math.PI/2;
    sceneryEmit(vinePosts,8,vx,vh+0.8,vz,va,0.14,1.6,0.14,0x5d4326);
    sceneryEmit(vineRows,9,vx,vh+0.95,vz,va,4.6,0.9,0.5,0x6b8f3a);
  }
  j.phase='stumps';
  if(over()) return true;
  }
  if(j.phase==='stumps'){
  for(; j.si<500; j.si++){
    if(over() && j.si) return true;
    var si=j.si;
    var sx=rnd()*5800-2900, sz=rnd()*5800-2900;
    regionWeights(sx,sz,w);
    if(w.moldavian+w.transylvanian+w.carpathian<0.6) continue;
    if(sceneryBlocked(sx,sz,12)) continue;
    stumps.push(imItem(sx,groundH(sx,sz)+0.25,sz,rnd()*TAU,0.9,0.5,0.9,0x6b4f2e));
  }
  j.phase='flush';
  if(over()) return true;
  }
  var trunkGeo=new THREE.CylinderGeometry(0.4,0.55,1,6), coneGeo=new THREE.ConeGeometry(0.5,1,7), sphGeo=new THREE.SphereGeometry(0.5,7,5);
  var rockGeo=new THREE.IcosahedronGeometry(0.5,0), boxGeo=new THREE.BoxGeometry(1,1,1), reedGeo=new THREE.ConeGeometry(0.08,1,4), stumpGeo=new THREE.CylinderGeometry(0.5,0.6,1,7);
  var white=M(0xffffff);
  bucketIM(trunkGeo, pineTrunk, white, 'forest');
  bucketIM(coneGeo, pineTop, white, 'forest');
  bucketIM(trunkGeo, oakTrunk, white, 'forest');
  bucketIM(sphGeo, oakTop, white, 'forest');
  bucketIM(trunkGeo, deadTrunk, white, 'forest');
  bucketIM(rockGeo, rocks, white, 'rocks');
  bucketIM(rockGeo, bigRocks, white, 'rocks');
  bucketIM(reedGeo, reeds, white, 'reeds', {shadow:false});
  bucketIM(boxGeo, vinePosts, white, 'vines', {shadow:false});
  bucketIM(boxGeo, vineRows, white, 'vines', {shadow:false});
  bucketIM(stumpGeo, stumps, white, 'stumps', {shadow:false});
  scenery.trees=j.placed; scenery.rocks=rocks.length+bigRocks.length; scenery.reeds=reeds.length;
  _fieldJob=null;
  return false;
}

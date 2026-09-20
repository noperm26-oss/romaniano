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
function srand(seed){ var s=(seed>>>0)||7; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

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
    b.items.forEach(function(orig,i){ im.setMatrixAt(i, items[orig].m); if(items[orig].c!==undefined) im.setColorAt(i, new THREE.Color(items[orig].c)); });
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
  var i;
  for(i=0;i<FLATS.length;i++){
    var f=FLATS[i], dx=x-f.x, dz=z-f.z, rr=f.r+(margin||0);
    if(dx*dx+dz*dz<rr*rr) return true;
  }
  if(sceneryRoadDist(x,z)<5) return true;
  var rf=riverField(x,z);
  if(rf.river && rf.d<rf.river.hw*1.25+3) return true;
  for(i=0;i<LAKES.length;i++){ var L=LAKES[i]; if((x-L.x)*(x-L.x)+(z-L.z)*(z-L.z)<(L.r+6)*(L.r+6)) return true; }
  return false;
}

(function buildField(){
  var rnd=srand(20260919);
  /* ---- rim peaks: a square wall of mountains just outside the 6,000 × 6,000 world, highest in the north ---- */
  var rimM=M(0x7d94a5), rimSnow=M(0xe8f0f8), rimDark=M(0x6c8090);
  function peak(x,z,wrad,wh,dark){
    var wall=cone(wrad, wh, dark?rimDark:rimM, 7); wall.name='always';
    wall.position.set(x, wh*0.32, z); wall.castShadow=false; scene.add(wall);
    var cap=cone(wrad*0.34, wh*0.34, rimSnow, 7); cap.name='always';
    cap.position.set(x, wh*0.32+wh*0.33, z); cap.castShadow=false; scene.add(cap);
  }
  for(var wi=0; wi<128; wi++){
    var side=wi%4, t=(Math.floor(wi/4)+rnd()*0.9)/32*6600-3300, off=3110+rnd()*130, wx, wz;
    if(side===0){ wx=t; wz=-off; } else if(side===1){ wx=t; wz=off; } else if(side===2){ wx=-off; wz=t; } else { wx=off; wz=t; }
    var north=wz<-2400?1:0;
    peak(wx, wz, 190+rnd()*110, 95+rnd()*85+north*90, wi%3===0);
  }
  /* inland peaks of the Carpathian ridge, kept clear of every named place */
  function peakBlocked(x,z,r){
    var i;
    for(i=0;i<SITES_DEF.length;i++){ var S=SITES_DEF[i]; if(Math.hypot(x-S.x,z-S.z)<S.r+r+30) return true; }
    for(i=0;i<VILLAGES.length;i++){ if(Math.hypot(x-VILLAGES[i].x,z-VILLAGES[i].z)<r+90) return true; }
    for(i=0;i<FAC_KEYS_T.length;i++){ var T=TOWNS[FAC_KEYS_T[i]]; if(Math.hypot(x-T.x,z-T.z)<r+320) return true; }
    if(sceneryRoadDist(x,z)<r*0.6) return true;
    return false;
  }
  for(var mi=0; mi<60; mi++){
    var mx=rnd()*5400-2700, mz=-3000+rnd()*1050, mrad=110+rnd()*120, mh=(70+rnd()*90)*(1-ss(-2600,-1950,mz))+40;
    if(mz>-1950||peakBlocked(mx,mz,mrad)) continue;
    peak(mx, mz, mrad, mh, mi%2===0);
  }
  /* ---- clouds: iron-grey overcast, thicker over the Carpathians ---- */
  var cm=new THREE.MeshLambertMaterial({color:0xe6eaee, emissive:0x7d8a99});
  for(var ci=0; ci<30; ci++){
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

  /* ---- forests ---- */
  var pineTrunk=[], pineTop=[], oakTrunk=[], oakTop=[], deadTrunk=[], rocks=[], bigRocks=[], reeds=[], vinePosts=[], vineRows=[], stumps=[];
  var w={}, placed=0;
  for(var gz=-2880; gz<2880; gz+=22) for(var gx=-2880; gx<2880; gx+=22){
    var x=gx+rnd()*20-10, z=gz+rnd()*20-10;
    regionWeights(x,z,w);
    var n=Math.sin(x*0.0072+1.1)*Math.cos(z*0.0066-0.3)+0.5*Math.sin(x*0.021)*Math.sin(z*0.019);
    var h=groundH(x,z);
    var kind=null, p=0;
    if(w.carpathian>0.5){ p=h<27 ? 0.62-0.012*Math.max(0,h-12) : 0; kind='pine'; if(n<-0.55) p*=0.25; }
    else if(w.moldavian>0.5){ p=0.55+0.25*n; kind=rnd()<0.75?'pine':'oak'; }
    else if(w.transylvanian>0.5){ p=h>7 ? 0.55 : 0.09; kind='oak'; }
    else if(w.wallachian>0.5){ p=0.09; kind='oak'; }
    else if(w.trade_route>0.5){ p=0.045; kind='oak'; }
    else if(w.capital>0.5){ p=Math.max(Math.abs(x),Math.abs(z))>430 ? 0.16 : 0; kind='oak'; }
    else { p=0.14+0.1*n; kind=rnd()<0.3?'dead':'oak'; }
    if(p<=0||rnd()>p) continue;
    if(sceneryBlocked(x,z,14)) continue;
    var s=0.8+rnd()*0.55, ry=rnd()*TAU;
    if(kind==='pine'){
      var dark=w.moldavian>0.5;
      pineTrunk.push(imItem(x,h+1.4*s,z,ry,0.36*s,2.8*s,0.36*s,0x4a3a2a));
      pineTop.push(imItem(x,h+3.6*s,z,ry,2.6*s,4.2*s,2.6*s,dark?0x2a4126:(h>18?0x3d5a3c:0x2f4a2e)));
      pineTop.push(imItem(x,h+5.6*s,z,ry+0.4,1.8*s,3.2*s,1.8*s,dark?0x243a20:0x35533a));
    } else if(kind==='oak'){
      var dusty=w.trade_route>0.5;
      oakTrunk.push(imItem(x,h+1.1*s,z,ry,0.42*s,2.2*s,0.42*s,0x5d4326));
      oakTop.push(imItem(x,h+3.1*s,z,ry,3.0*s,2.6*s,3.0*s,dusty?0x7a8a5a:(rnd()<0.5?0x4a7a37:0x57893f)));
      if(rnd()<0.6) oakTop.push(imItem(x+0.7*s,h+3.7*s,z-0.4*s,ry,2.0*s,1.9*s,2.0*s,0x3f6a30));
    } else {
      deadTrunk.push(imItem(x,h+1.5*s,z,ry,0.32*s,3.0*s,0.32*s,0x3a3028,0,0.12));
      deadTrunk.push(imItem(x+0.5*s,h+2.6*s,z,ry,0.12*s,1.5*s,0.12*s,0x3a3028,0,0.8));
    }
    placed++;
  }
  /* ---- rocks: Carpathian scree, Moldavian outcrops, boulders on every plain ---- */
  for(var ri=0; ri<2600; ri++){
    var rx=rnd()*5800-2900, rz=rnd()*5800-2900;
    regionWeights(rx,rz,w);
    var pr=w.carpathian*0.9+w.moldavian*0.5+w.battlefield*0.2+w.transylvanian*0.12+w.wallachian*0.05+w.trade_route*0.15+w.capital*0.05;
    if(rnd()>pr) continue;
    if(sceneryBlocked(rx,rz,10)) continue;
    var rh=groundH(rx,rz), rs=0.5+rnd()*1.6+(w.carpathian>0.5?rnd()*1.6:0);
    var col=w.carpathian>0.5?0x8a8a86:(w.trade_route>0.5?0xa09070:0x777772);
    if(rs>1.7){ bigRocks.push(imItem(rx,rh+rs*0.35,rz,rnd()*3,rs*1.4,rs,rs*1.2,col,rnd()*0.5,rnd()*0.5)); addCollider(rx-rs*0.6,rz-rs*0.55,rx+rs*0.6,rz+rs*0.55); }
    else rocks.push(imItem(rx,rh+rs*0.3,rz,rnd()*3,rs*1.3,rs*0.9,rs,col,rnd()*0.5,rnd()*0.5));
  }
  /* ---- reeds along Wallachian water and marsh hollows ---- */
  for(var qi=0; qi<9000; qi++){
    var qx=rnd()*5800-2900, qz=rnd()*5800-2900;
    regionWeights(qx,qz,w);
    if(w.wallachian<0.4 && w.trade_route<0.4 && w.capital<0.4) continue;
    var rf=riverField(qx,qz), qh=groundH(qx,qz), ok=false;
    if(rf.river && rf.d>rf.river.hw*0.85 && rf.d<rf.river.hw*1.7) ok=true;
    if(w.wallachian>0.5 && qh<-1.3) ok=rnd()<0.5;
    for(var lk=0; lk<LAKES.length && !ok; lk++){ var L=LAKES[lk]; var dl=Math.hypot(qx-L.x,qz-L.z); if(!L.frozen && dl>L.r*0.95 && dl<L.r+9) ok=true; }
    if(!ok) continue;
    if(sceneryRoadDist(qx,qz)<3) continue;
    for(var fi=0; fi<FLATS.length; fi++){ var F=FLATS[fi]; if(F.r>100 && (qx-F.x)*(qx-F.x)+(qz-F.z)*(qz-F.z)<F.r*F.r){ ok=false; break; } }
    if(!ok) continue;
    var qs=0.8+rnd()*0.7;
    reeds.push(imItem(qx,qh+0.9*qs,qz,rnd()*TAU,0.9*qs,1.8*qs,0.9*qs,rnd()<0.5?0x8a9a5a:0x6f8a48,rnd()*0.2-0.1,rnd()*0.2-0.1));
  }
  /* ---- vineyards on Transylvanian slopes ---- */
  for(var vi=0; vi<2600; vi++){
    var vx=rnd()*1900-2950, vz=rnd()*1900-1750;
    if(getRegion(vx,vz)!=='transylvanian') continue;
    var vn=Math.sin(vx*0.011+1.7)*Math.cos(vz*0.009-0.4);
    if(vn>-0.45) continue;
    if(sceneryBlocked(vx,vz,20)) continue;
    var vh=groundH(vx,vz), va=Math.round(vn*4)%2?0:Math.PI/2;
    vinePosts.push(imItem(vx,vh+0.8,vz,va,0.14,1.6,0.14,0x5d4326));
    vineRows.push(imItem(vx,vh+0.95,vz,va,4.6,0.9,0.5,0x6b8f3a));
  }
  /* ---- stumps and log piles at the woodcutters' edges ---- */
  for(var si=0; si<500; si++){
    var sx=rnd()*5800-2900, sz=rnd()*5800-2900;
    regionWeights(sx,sz,w);
    if(w.moldavian+w.transylvanian+w.carpathian<0.6) continue;
    if(sceneryBlocked(sx,sz,12)) continue;
    stumps.push(imItem(sx,groundH(sx,sz)+0.25,sz,rnd()*TAU,0.9,0.5,0.9,0x6b4f2e));
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
  scenery.trees=placed; scenery.rocks=rocks.length+bigRocks.length; scenery.reeds=reeds.length;
})();

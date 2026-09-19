/* ---------------- faction towns ---------------- */
/* local->world: wx = x + mx*lx ; wz = z + fz*lz ; front door faces the field */
function townT(facKey){
  var T=TOWNS[facKey];
  return {mx: T.x>0?1:-1, fz: T.z<0?1:-1, x:T.x, z:T.z};
}
function tw(T,lx,lz){ return {x:T.x+T.mx*lx, z:T.z+T.fz*lz}; }
var townData={}; /* fac -> {hall:{x,z,doorWorld:{x,z}}} */
function buildTown(facKey){
  var F=FACS[facKey];
  var T=townT(facKey);
  var door = T.fz>0 ? 'S' : 'N';
  var data={hall:{}};
  var P=F.townPalette;
  /* palisade ring (instanced posts, decorative) */
  (function(){
    var R=165, n=Math.floor(TAU*R/4.6);
    var post=new THREE.CylinderGeometry(0.5,0.62,7.5,6);
    var pm=new THREE.MeshLambertMaterial({color:P.palisade});
    var im=new THREE.InstancedMesh(post,pm,n);
    var tipG=new THREE.ConeGeometry(0.5,1.1,6);
    var im2=new THREE.InstancedMesh(tipG,pm,n);
    var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3(1,1,1);
    var idx=0;
    for(var i=0;i<n;i++){
      var a=i/n*TAU;
      var px=T.x+Math.cos(a)*R, pz=T.z+Math.sin(a)*R*0.92;
      /* gaps toward the field + two side gates */
      var fa=Math.atan2(-T.z*0.2,-T.x); /* rough direction to field */
      var da=angDiff(a,fa);
      if(Math.abs(da)<0.24) continue;
      if(Math.abs(Math.abs(da)-Math.PI/2)<0.14) continue;
      var y=groundH(px,pz);
      e.set(0,-a+Math.PI/2,0); q.setFromEuler(e);
      v.set(px,y+3.6,pz); m4.compose(v,q,s); im.setMatrixAt(idx,m4);
      v.set(px,y+7.7,pz); m4.compose(v,q,s); im2.setMatrixAt(idx,m4);
      idx++;
    }
    im.count=idx; im2.count=idx;
    im.castShadow=true; im2.castShadow=true;
    scene.add(im); scene.add(im2);
  })();
  /* the great hall (throne room — where recruits muster) */
  var hallP=tw(T,-26,-42);
  buildBuilding({x:hallP.x, z:hallP.z, w:26, d:15, h:6.4, wall:P.wall, roofCol:P.roof, roof:'gable',
    door:door, interior:'hall', fac:facKey});
  data.hall={x:hallP.x, z:hallP.z};
  data.hall.door={x:hallP.x, z:hallP.z+T.fz*(15/2+3)};
  /* temple / church / longhouse */
  var temP=tw(T,26,-46);
  if(facKey==='moldavia'){
    buildBuilding({x:temP.x,z:temP.z,w:12,d:18,h:4.6,wall:0xe8e0cf,roofCol:0x6d4a34,roof:'church',door:door,interior:'church'});
  } else if(facKey==='vikings'){
    buildBuilding({x:temP.x,z:temP.z,w:14,d:20,h:5.4,wall:P.wall,roofCol:P.roof,roof:'long',door:door,interior:'long'});
  } else {
    buildBuilding({x:temP.x,z:temP.z,w:13,d:19,h:5.2,wall:P.wall,roofCol:P.roof,roof:'temple',door:door,interior:'temple',colCol:P.col});
  }
  data.temple=temP;
  /* barracks */
  var barP=tw(T,-52,4);
  buildBuilding({x:barP.x,z:barP.z,w:14,d:11,h:4.4,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'barracks'});
  data.barracks=barP;
  /* houses */
  var houses=[[6,-10,10,9],[-14,16,9,8],[26,14,10,9],[50,-10,9,8],[0,40,10,9],[44,32,9,8]];
  houses.forEach(function(hd,i){
    var p=tw(T,hd[0],hd[1]);
    buildBuilding({x:p.x,z:p.z,w:hd[2],d:hd[3],h:4.2,
      wall:i%2?P.wallAlt:P.wall, roofCol:P.roof, roof:i%3===0?'thatch':'gable', door:door, interior:'house'});
  });
  /* market stalls */
  [[-8,56],[16,58]].forEach(function(sp){
    var p=tw(T,sp[0],sp[1]);
    var y=groundH(p.x,p.z);
    scene.add(box(0.14,2.4,0.14, M(0x5d4326), p.x-1.5,y+1.2,p.z));
    scene.add(box(0.14,2.4,0.14, M(0x5d4326), p.x+1.5,y+1.2,p.z));
    var can=box(3.6,0.1,2.4, M(P.stall), p.x,y+2.4,p.z);
    can.rotation.z=0.08; scene.add(can);
    scene.add(box(3.0,0.9,1.0, M(0x8a6a3c), p.x,y+0.45,p.z+0.4));
    propCrate(p.x+2.3,p.z-0.8,0.7);
  });
  /* well */
  var wellP=tw(T,0,6);
  var wy=groundH(wellP.x,wellP.z);
  var well=cyl(1.3,1.5,1.1, M(0x8f8a80), 10); well.position.set(wellP.x,wy+0.55,wellP.z); scene.add(well);
  scene.add(box(0.14,2.6,0.14, M(0x5d4326), wellP.x-1,wy+1.3,wellP.z));
  scene.add(box(0.14,2.6,0.14, M(0x5d4326), wellP.x+1,wy+1.3,wellP.z));
  var wr=cone(1.7,0.9, M(P.roof), 4); wr.rotation.y=Math.PI/4; wr.position.set(wellP.x,wy+3.0,wellP.z); scene.add(wr);
  addCollider(wellP.x-1.4,wellP.z-1.4,wellP.x+1.4,wellP.z+1.4);
  data.well=wellP;
  /* banners along the front */
  [[-16,66],[16,66],[0,72]].forEach(function(bp,i){
    var p=tw(T,bp[0],bp[1]);
    var pole=cyl(0.07,0.09,6.4, M(0x5d4326), 6);
    pole.position.set(p.x,groundH(p.x,p.z)+3.2,p.z);
    scene.add(pole);
    var flag=new THREE.Mesh(new THREE.PlaneGeometry(2.0,3.0,6,8), new THREE.MeshLambertMaterial({map:i===2?F.bannerTex2:F.bannerTex, side:THREE.DoubleSide}));
    flag.position.set(p.x+1.05,groundH(p.x,p.z)+4.6,p.z);
    scene.add(flag);
    waveBanners.push({m:flag, ph:rand(0,6)});
  });
  /* bonfire near the front */
  var bfP=tw(T,26,52);
  var by=groundH(bfP.x,bfP.z);
  for(var si=0; si<7; si++){
    var sa=si/7*TAU;
    scene.add(box(0.3,0.24,0.3, M(0x777772), bfP.x+Math.cos(sa)*0.7, by+0.1, bfP.z+Math.sin(sa)*0.7));
  }
  addFlame(bfP.x,by+0.8,bfP.z,1.6);
  var bl=new THREE.PointLight(0xff9a3c, 0.9, 22, 2);
  bl.position.set(bfP.x,by+1.3,bfP.z); scene.add(bl);
  bl.userData.base=0.9; nightLights.push(bl);
  /* v7 capital extras: warehouse, watchtower, stable */
  var wh0=tw(T,4,-64);
  solidBuilding(wh0.x, wh0.z, 11,7,4.5, P.wall, P.roof, 'gable');
  var tx0=tw(T,48,-42);
  solidBuilding(tx0.x, tx0.z, 4.5,4.5,9.5, P.wallAlt, P.roof, 'flat');
  var twy=groundH(tx0.x,tx0.z);
  scene.add(cyl(0.06,0.08,2.2, NM(0x4a3520), 6).translateX(tx0.x).translateY(twy+10.6).translateZ(tx0.z));
  var twFlag=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4,6,8), new THREE.MeshLambertMaterial({map:F.bannerTex, side:THREE.DoubleSide}));
  twFlag.position.set(tx0.x+0.85, twy+11.6, tx0.z);
  scene.add(twFlag); waveBanners.push({m:twFlag, ph:rand(0,6)});
  var sx0=tw(T,56,14);
  solidBuilding(sx0.x, sx0.z, 9,6,3.6, P.wallAlt, P.roof, 'thatch');
  for(var sf2=0; sf2<5; sf2++){
    scene.add(box(0.12,1,0.12, NM(0x4a3520), sx0.x-4.5+sf2*2.2, groundH(sx0.x,sx0.z)+0.5, sx0.z+4));
  }
  scene.add(box(9,0.09,0.09, NM(0x4a3520), sx0.x, groundH(sx0.x,sx0.z)+0.95, sx0.z+4));
  registerTownLore(facKey, data);
  townData[facKey]=data;
  return data;
}

/* ============================================================
   v5 LANDMARKS & WONDERS — every stone here has a story.
   Walk close to any monument and its tale appears.
   ============================================================ */

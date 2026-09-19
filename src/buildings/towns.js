/* ---------------- faction towns — ROMANIAN MEDIEVAL WAR WORLD EXTENDED 2× EDITION ----------------
   Six nations reimagined as Romanian medieval regions:
   - sparta: Ardealburg (Transylvanian Heartland)
   - rome: Cetatea Dunarii (Wallachian Lowlands)
   - moldavia: Hotarul de Nord / Codrul Vechi (Moldavian Borderlands)
   - vikings: Stanca de Fier (Carpathian Ridge)
   - egypt: Drumul Lung (Southern Trade Route)
   - nippon: Romaria (Capital City)
*/
function townT(facKey){
  var T=TOWNS[facKey];
  return {mx: T.x>0?1:-1, fz: T.z<0?1:-1, x:T.x, z:T.z, name:T.name, region:T.region};
}
function tw(T,lx,lz){ return {x:T.x+T.mx*lx, z:T.z+T.fz*lz}; }
var townData={};
function buildTown(facKey){
  var F=FACS[facKey];
  var T=townT(facKey);
  var door = T.fz>0 ? 'S' : 'N';
  var data={hall:{}};
  var P=F.townPalette;

  /* palisade ring — varies by region */
  (function(){
    var R= facKey==='nippon'?210 : facKey==='rome'?195 : 165;
    var n=Math.floor(TAU*R/4.6);
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
      var fa=Math.atan2(-T.z*0.2,-T.x);
      var da=angDiff(a,fa);
      if(Math.abs(da)<0.24) continue;
      if(Math.abs(Math.abs(da)-Math.PI/2)<0.14) continue;
      // Wallachian fortress has full stone walls later, skip palisade gaps for stone
      if(facKey==='rome' && Math.abs(da)<0.6) continue;
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

  /* ---------- REGION-SPECIFIC TOWN LAYOUT ---------- */
  if(facKey==='vikings'){
    // STANCA DE FIER — Carpathian mountain fort: iron-reinforced gates, murder holes, battlements, spikes
    var hallP=tw(T,-26,-42);
    buildBuilding({x:hallP.x, z:hallP.z, w:26, d:15, h:6.4, wall:0x6e6e6e, roofCol:0x4a4238, roof:'gable', door:door, interior:'mountain_fort', fac:facKey});
    data.hall={x:hallP.x, z:hallP.z}; data.hall.door={x:hallP.x, z:hallP.z+T.fz*(15/2+3)};
    // Iron gates + murder holes
    var gateP=tw(T,0,66);
    buildBuilding({x:gateP.x, z:gateP.z, w:14, d:6, h:5.5, wall:0x5a5a5a, roofCol:0x3a3a3a, roof:'flat', door:door, interior:'guardhouse'});
    // Barracks bunk beds wool blankets
    var barP=tw(T,-52,4);
    buildBuilding({x:barP.x,z:barP.z,w:14,d:11,h:4.4,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'barracks'});
    // Armory, Chapel, War room, Storage, Commander quarters
    var armP=tw(T,26,-46);
    buildBuilding({x:armP.x,z:armP.z,w:12,d:10,h:4.6,wall:0x6e6152,roofCol:0x4a4238,roof:'gable',door:door,interior:'forge'});
    var chapP=tw(T,50,-10);
    buildBuilding({x:chapP.x,z:chapP.z,w:10,d:14,h:4.8,wall:0xe8e0cf,roofCol:0x6d4a34,roof:'church',door:door,interior:'monastery'});
    var warP=tw(T,-14,16);
    buildBuilding({x:warP.x,z:warP.z,w:11,d:9,h:4.2,wall:P.wallAlt,roofCol:P.roof,roof:'gable',door:door,interior:'townhall'});
    var stoP=tw(T,0,40);
    buildBuilding({x:stoP.x,z:stoP.z,w:10,d:9,h:3.6,wall:P.wallAlt,roofCol:P.roof,roof:'thatch',door:door,interior:'tradepost'});
    // Watchtower
    var wtP=tw(T,48,-42);
    solidBuilding(wtP.x, wtP.z, 4.5,4.5,11.5, P.wallAlt, P.roof, 'flat');
    var twy=groundH(wtP.x,wtP.z);
    scene.add(cyl(0.06,0.08,2.2, NM(0x4a3520), 6).translateX(wtP.x).translateY(twy+12.6).translateZ(wtP.z));
    var twFlag=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4,6,8), new THREE.MeshLambertMaterial({map:F.bannerTex, side:THREE.DoubleSide}));
    twFlag.position.set(wtP.x+0.85, twy+13.6, wtP.z); scene.add(twFlag); waveBanners.push({m:twFlag, ph:rand(0,6)});
    // Hermit cave nearby
    var caveP=tw(T,26,14);
    buildBuilding({x:caveP.x,z:caveP.z,w:8,d:8,h:3.2,wall:0x6e6152,roofCol:0x5a5a5a,roof:'thatch',door:door,interior:'cave'});
    // Monastery Sfantul Andrei bell tower
    var monP=tw(T,-8,56);
    buildBuilding({x:monP.x,z:monP.z,w:16,d:18,h:5.2,wall:0xd8d2c0,roofCol:0x2a5caa,roof:'church',door:door,interior:'monastery'});
    var monY=groundH(monP.x,monP.z);
    scene.add(cyl(1.3,1.5,1.1, M(0x8f8a80), 10).translateX(monP.x+12).translateY(monY+0.55).translateZ(monP.z));
    // Defensive spikes
    for(var sp=0;sp<6;sp++){
      var spP=tw(T,-30+sp*12,70);
      scene.add(cone(0.4,1.2, M(0x4a4a4a), 6).translateX(spP.x).translateY(groundH(spP.x,spP.z)+0.6).translateZ(spP.z));
    }
    data.temple=chapP; data.barracks=barP; data.well=tw(T,0,6);
  } else if(facKey==='sparta'){
    // ARDEALBURG — Transylvanian Heartland: stone walls round towers, portcullis, market, blacksmith, noble quarter
    var hallP2=tw(T,-26,-42);
    buildBuilding({x:hallP2.x, z:hallP2.z, w:26, d:15, h:6.4, wall:P.wall, roofCol:P.roof, roof:'gable', door:door, interior:'townhall', fac:facKey});
    data.hall={x:hallP2.x, z:hallP2.z}; data.hall.door={x:hallP2.x, z:hallP2.z+T.fz*(15/2+3)};
    // Church Orthodox
    var temP=tw(T,26,-46);
    buildBuilding({x:temP.x,z:temP.z,w:12,d:18,h:4.6,wall:0xe8e0cf,roofCol:0x6d4a34,roof:'church',door:door,interior:'church'});
    // Barracks
    var barP2=tw(T,-52,4);
    buildBuilding({x:barP2.x,z:barP2.z,w:14,d:11,h:4.4,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'barracks'});
    // Blacksmith Forge anvil furnace racks
    var forgeP=tw(T,6,-10);
    buildBuilding({x:forgeP.x,z:forgeP.z,w:12,d:10,h:4.2,wall:P.wallAlt,roofCol:P.roof,roof:'gable',door:door,interior:'forge'});
    // Merchant Homes two-story balconies flower pots
    [[-14,16,9,8],[26,14,10,9],[50,-10,9,8],[0,40,10,9]].forEach(function(hd,i){
      var p=tw(T,hd[0],hd[1]);
      buildBuilding({x:p.x,z:p.z,w:hd[2],d:hd[3],h:5.2, wall:i%2?P.wallAlt:P.wall, roofCol:P.roof, roof:i%3===0?'thatch':'gable', door:door, interior:'house'});
      // balcony
      var by=groundH(p.x,p.z);
      scene.add(box(2.0,0.1,0.8, M(0x5d4a38), p.x, by+2.6, p.z+2.0));
      scene.add(box(0.2,0.2,0.2, M(0xc94f4f), p.x-0.6, by+2.75, p.z+2.1));
      scene.add(box(0.2,0.2,0.2, M(0xe9c458), p.x+0.6, by+2.75, p.z+2.1));
    });
    // Tavern Lupul Rosu fireplace long tables barrels upstairs straw beds
    var tavP=tw(T,44,32);
    buildBuilding({x:tavP.x,z:tavP.z,w:14,d:11,h:4.8,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'tavern'});
    // School of Scribes writing desks ink pots scrolls classroom benches
    var scriP=tw(T,4,-64);
    buildBuilding({x:scriP.x,z:scriP.z,w:13,d:10,h:4.2,wall:0xd8d2c0,roofCol:0x2a5caa,roof:'gable',door:door,interior:'scribe'});
    // Guardhouse jail cells weapon racks duty roster captain office
    var guardP=tw(T,48,-42);
    buildBuilding({x:guardP.x,z:guardP.z,w:12,d:10,h:4.0,wall:P.wallAlt,roofCol:P.roof,roof:'gable',door:door,interior:'guardhouse'});
    // Watermill grinding stones flour sacks
    var millP=tw(T,56,14);
    buildBuilding({x:millP.x,z:millP.z,w:10,d:10,h:4.0,wall:P.wallAlt,roofCol:P.roof,roof:'thatch',door:door,interior:'watermill'});
    // Hunter cabin bow racks pelts trap storage fireplace
    var huntP=tw(T,-8,56);
    buildBuilding({x:huntP.x,z:huntP.z,w:9,d:8,h:3.8,wall:0x6e6152,roofCol:0x4a4238,roof:'thatch',door:door,interior:'hunter'});
    // Bathhouse tubs heated stones steam room
    var bathP=tw(T,16,58);
    buildBuilding({x:bathP.x,z:bathP.z,w:11,d:9,h:3.8,wall:0x8a7a5e,roofCol:0x6d5a3e,roof:'thatch',door:door,interior:'bathhouse'});
    data.temple=temP; data.barracks=barP2; data.well=tw(T,0,6);
  } else if(facKey==='rome'){
    // CETATEA DUNARII — Wallachian: 20m stone walls 4 corner towers moat drawbridge
    var hallP3=tw(T,-26,-42);
    buildBuilding({x:hallP3.x, z:hallP3.z, w:28, d:18, h:7.2, wall:0x8d8578, roofCol:0x6d4a34, roof:'gable', door:door, interior:'fortress', fac:facKey});
    data.hall={x:hallP3.x, z:hallP3.z}; data.hall.door={x:hallP3.x, z:hallP3.z+T.fz*(15/2+3)};
    // Massive stone walls 20m
    (function(){
      var wallM=NM(0x8d8578);
      var y0=groundH(T.x,T.z);
      // 4 corner towers
      [[-100,-100],[100,-100],[-100,100],[100,100]].forEach(function(c){
        var tx=T.x+c[0], tz=T.z+c[1];
        var twr=cyl(4.5,5.0,20, wallM, 10); twr.position.set(tx, groundH(tx,tz)+10, tz); scene.add(twr);
        var top=cone(5.5,4, M(0x7a3b32), 10); top.position.set(tx, groundH(tx,tz)+22, tz); scene.add(top);
        addCollider(tx-5,tz-5,tx+5,tz+5);
      });
      // walls
      scene.add(box(200,20,3, wallM, T.x, y0+10, T.z-100));
      scene.add(box(200,20,3, wallM, T.x, y0+10, T.z+100));
      scene.add(box(3,20,200, wallM, T.x-100, y0+10, T.z));
      scene.add(box(3,20,200, wallM, T.x+100, y0+10, T.z));
      // moat
      var moat=new THREE.Mesh(new THREE.RingGeometry(108,122,32), new THREE.MeshLambertMaterial({color:0x3f6a8a, transparent:true, opacity:0.7, side:THREE.DoubleSide}));
      moat.rotation.x=-Math.PI/2; moat.position.set(T.x, y0+0.05, T.z); scene.add(moat);
      // drawbridge
      scene.add(box(12,0.5,18, M(0x5d4a38), T.x, y0+1.5, T.z+100));
    })();
    // Grand Hall pillars barracks bunks dungeon iron bars stable horses
    var barP3=tw(T,-52,4);
    buildBuilding({x:barP3.x,z:barP3.z,w:16,d:12,h:4.8,wall:0x8d8578,roofCol:0x6d4a34,roof:'gable',door:door,interior:'barracks'});
    var dungP=tw(T,26,-46);
    buildBuilding({x:dungP.x,z:dungP.z,w:10,d:10,h:3.5,wall:0x5a5a5a,roofCol:0x4a4238,roof:'flat',door:door,interior:'guardhouse'});
    var stabP=tw(T,56,14);
    buildBuilding({x:stabP.x,z:stabP.z,w:14,d:10,h:4.0,wall:P.wallAlt,roofCol:P.roof,roof:'thatch',door:door,interior:'forestvillage'});
    // Kitchen cauldrons ovens
    var kitP=tw(T,6,-10);
    buildBuilding({x:kitP.x,z:kitP.z,w:11,d:9,h:4.0,wall:P.wall,roofCol:P.roof,roof:'gable',door:door,interior:'tavern'});
    // Armory vault locked chests
    var armP3=tw(T,-14,16);
    buildBuilding({x:armP3.x,z:armP3.z,w:10,d:8,h:4.0,wall:0x6e6152,roofCol:0x4a4238,roof:'gable',door:door,interior:'forge'});
    // War balcony archive room
    var warP3=tw(T,0,40);
    buildBuilding({x:warP3.x,z:warP3.z,w:12,d:10,h:5.0,wall:P.wall,roofCol:P.roof,roof:'gable',door:door,interior:'townhall'});
    // War camp tents
    [[-8,56],[16,58],[30,70],[-20,70]].forEach(function(sp){
      var p=tw(T,sp[0],sp[1]);
      buildBuilding({x:p.x,z:p.z,w:8,d:8,h:3.2,wall:0x8a7a5e,roofCol:0x6d5a3e,roof:'thatch',door:door,interior:'warcamp'});
    });
    // Siege workshop catapult parts mess hall drum tower
    var siegP=tw(T,44,32);
    buildBuilding({x:siegP.x,z:siegP.z,w:13,d:11,h:4.2,wall:P.wallAlt,roofCol:P.roof,roof:'gable',door:door,interior:'workshop'});
    var messP=tw(T,4,-64);
    buildBuilding({x:messP.x,z:messP.z,w:14,d:10,h:4.0,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'tavern'});
    var drumP=tw(T,48,-42);
    solidBuilding(drumP.x, drumP.z, 5,5,9, P.wallAlt, P.roof, 'flat');
    data.temple=dungP; data.barracks=barP3; data.well=tw(T,0,6);
  } else if(facKey==='moldavia'){
    // HOTARUL DE NORD — Moldavian Borderlands: wooden palisade watchtowers mess hall etc + Codrul Vechi
    var hallP4=tw(T,-26,-42);
    buildBuilding({x:hallP4.x, z:hallP4.z, w:22, d:14, h:5.5, wall:P.wall, roofCol:P.roof, roof:'gable', door:door, interior:'borderfort', fac:facKey});
    data.hall={x:hallP4.x, z:hallP4.z}; data.hall.door={x:hallP4.x, z:hallP4.z+T.fz*(15/2+3)};
    var barP4=tw(T,-52,4);
    buildBuilding({x:barP4.x,z:barP4.z,w:14,d:11,h:4.4,wall:P.wall,roofCol:P.roof,roof:'thatch',door:door,interior:'barracks'});
    // Archery tower scout barracks lookout
    var archP=tw(T,26,-46);
    solidBuilding(archP.x, archP.z, 4.5,4.5,9.5, P.wallAlt, P.roof, 'flat');
    var scoutP=tw(T,6,-10);
    buildBuilding({x:scoutP.x,z:scoutP.z,w:12,d:9,h:4.0,wall:P.wallAlt,roofCol:P.roof,roof:'thatch',door:door,interior:'barracks'});
    var lookP=tw(T,50,-10);
    solidBuilding(lookP.x, lookP.z, 3.5,3.5,8, P.wall, P.roof, 'flat');
    // Codrul Vechi forest village wooden huts smokehouses
    [[-14,16,9,8],[26,14,10,9],[0,40,10,9],[44,32,9,8]].forEach(function(hd,i){
      var p=tw(T,hd[0],hd[1]);
      buildBuilding({x:p.x,z:p.z,w:hd[2],d:hd[3],h:4.2, wall:0x5d4a38, roofCol:0x3a5a2e, roof:'thatch', door:door, interior:'forestvillage'});
    });
    // Hunter lodge pelts bows traps
    var huntP2=tw(T,-8,56);
    buildBuilding({x:huntP2.x,z:huntP2.z,w:11,d:9,h:4.0,wall:0x5d4a38,roofCol:0x3a5a2e,roof:'thatch',door:door,interior:'hunter'});
    // Herbalist hut herbs potions drying racks
    var herbP=tw(T,16,58);
    buildBuilding({x:herbP.x,z:herbP.z,w:9,d:8,h:3.6,wall:0x6e6152,roofCol:0x4a4238,roof:'thatch',door:door,interior:'herbalist'});
    // Woodcutter cabin mushroom cellar wolf shrine
    var woodP=tw(T,4,-64);
    buildBuilding({x:woodP.x,z:woodP.z,w:9,d:8,h:3.5,wall:0x5d4a38,roofCol:0x4a4238,roof:'thatch',door:door,interior:'woodcutter'});
    var mushP=tw(T,48,-42);
    buildBuilding({x:mushP.x,z:mushP.z,w:8,d:8,h:3.0,wall:0x6e6152,roofCol:0x5a5a5a,roof:'flat',door:door,interior:'cave'});
    var wolfP=tw(T,56,14);
    buildBuilding({x:wolfP.x,z:wolfP.z,w:7,d:7,h:3.8,wall:0x70685a,roofCol:0x5a5a5a,roof:'thatch',door:door,interior:'secret'});
    data.temple=archP; data.barracks=barP4; data.well=tw(T,0,6);
  } else if(facKey==='egypt'){
    // DRUMUL LUNG — Southern Trade Route: trade post, inn, checkpoint, shrine, repair workshop
    var hallP5=tw(T,-26,-42);
    buildBuilding({x:hallP5.x, z:hallP5.z, w:24, d:14, h:5.5, wall:0xb09a6e, roofCol:0xc9b24a, roof:'gable', door:door, interior:'tradepost', fac:facKey});
    data.hall={x:hallP5.x, z:hallP5.z}; data.hall.door={x:hallP5.x, z:hallP5.z+T.fz*(15/2+3)};
    // Inn Drumul Lung beds kitchen stable
    var innP=tw(T,26,-46);
    buildBuilding({x:innP.x,z:innP.z,w:18,d:14,h:5.0,wall:0x8a7a5e,roofCol:0x6d4a34,roof:'gable',door:door,interior:'inn'});
    // Checkpoint gate guards spears log barriers
    var checkP=tw(T,-52,4);
    buildBuilding({x:checkP.x,z:checkP.z,w:14,d:6,h:4.5,wall:0x6e6152,roofCol:0x4a4238,roof:'flat',door:door,interior:'checkpoint'});
    // Roadside Orthodox shrine
    var shrP=tw(T,6,-10);
    buildBuilding({x:shrP.x,z:shrP.z,w:6,d:6,h:3.5,wall:0x6b4f2e,roofCol:0x5d4a38,roof:'church',door:door,interior:'church'});
    // Caravan repair workshop merchant stables guard barracks
    var repP=tw(T,-14,16);
    buildBuilding({x:repP.x,z:repP.z,w:12,d:10,h:4.0,wall:0x6e6152,roofCol:0x4a4238,roof:'gable',door:door,interior:'workshop'});
    var stabP2=tw(T,26,14);
    buildBuilding({x:stabP2.x,z:stabP2.z,w:12,d:9,h:3.8,wall:P.wallAlt,roofCol:P.roof,roof:'thatch',door:door,interior:'forestvillage'});
    var gbarP=tw(T,0,40);
    buildBuilding({x:gbarP.x,z:gbarP.z,w:12,d:10,h:4.0,wall:P.wall,roofCol:P.roof,roof:'gable',door:door,interior:'barracks'});
    // Trade post crates
    [[-8,56],[16,58]].forEach(function(sp){
      var p=tw(T,sp[0],sp[1]);
      buildBuilding({x:p.x,z:p.z,w:10,d:8,h:3.6,wall:0xb09a6e,roofCol:0xc9b24a,roof:'thatch',door:door,interior:'tradepost'});
    });
    // Dusty road market stalls
    var marketP=tw(T,4,-64);
    buildBuilding({x:marketP.x,z:marketP.z,w:12,d:10,h:4.0,wall:0xc2b89a,roofCol:0x7a5c39,roof:'thatch',door:door,interior:'market'});
    data.temple=shrP; data.barracks=checkP; data.well=tw(T,0,6);
  } else {
    // ROMARIA — Capital City: massive stone walls, grand gate lion carvings, boulevards, noble estates etc
    // Royal Palace marble columns red banners
    var hallP6=tw(T,-26,-42);
    buildBuilding({x:hallP6.x, z:hallP6.z, w:32, d:20, h:8.0, wall:0xd8d2c0, roofCol:0xc0272d, roof:'gable', door:door, interior:'palace', fac:facKey});
    data.hall={x:hallP6.x, z:hallP6.z}; data.hall.door={x:hallP6.x, z:hallP6.z+T.fz*(15/2+3)};
    // Massive stone walls grand gate lion carvings
    (function(){
      var y0=groundH(T.x,T.z);
      var wallM=NM(0x9a9a8a);
      scene.add(box(240,12,4, wallM, T.x, y0+6, T.z-120));
      scene.add(box(240,12,4, wallM, T.x, y0+6, T.z+120));
      scene.add(box(4,12,240, wallM, T.x-120, y0+6, T.z));
      scene.add(box(4,12,240, wallM, T.x+120, y0+6, T.z));
      // Grand gate lion carvings
      scene.add(box(4,10,6, M(0xd8cfa8), T.x-6, y0+5, T.z+120));
      scene.add(box(4,10,6, M(0xd8cfa8), T.x+6, y0+5, T.z+120));
      scene.add(box(14,3,6, M(0xd8cfa8), T.x, y0+11.5, T.z+120));
      // Lion carvings
      scene.add(box(1.2,1.5,0.8, M(0xc9a227), T.x-5, y0+12.5, T.z+123));
      scene.add(box(1.2,1.5,0.8, M(0xc9a227), T.x+5, y0+12.5, T.z+123));
      addCollider(T.x-120,T.z-120,T.x+120,T.z-116);
      addCollider(T.x-120,T.z+116,T.x+120,T.z+120);
      addCollider(T.x-120,T.z-120,T.x-116,T.z+120);
      addCollider(T.x+116,T.z-120,T.x+120,T.z+120);
    })();
    // Cathedral Sfantul Mihail tall spires iconostasis marble floor choir balcony crypt bell tower priest study
    var cathP=tw(T,26,-46);
    buildBuilding({x:cathP.x,z:cathP.z,w:20,d:28,h:8.5,wall:0xe8e0cf,roofCol:0x6d4a34,roof:'church',door:door,interior:'cathedral'});
    // Noble estates merchant districts artisan quarter river docks
    var houses=[[6,-10,10,9],[-14,16,9,8],[26,14,10,9],[50,-10,9,8],[0,40,10,9],[44,32,9,8]];
    houses.forEach(function(hd,i){
      var p=tw(T,hd[0],hd[1]);
      var inter = i%3===0?'market':i%3===1?'forge':'house';
      buildBuilding({x:p.x,z:p.z,w:hd[2]+2,d:hd[3]+2,h:4.8, wall:i%2?0xd8d2c0:0xc2b89a, roofCol:i%2?0xc0272d:P.roof, roof:i%3===0?'thatch':'gable', door:door, interior:inter});
    });
    // Market stalls butcher tailor blacksmith tavern spice merchant book seller armor craftsman horse trader
    [[-8,56],[16,58],[0,72],[24,72],[-24,72]].forEach(function(sp,i){
      var p=tw(T,sp[0],sp[1]);
      var y=groundH(p.x,p.z);
      scene.add(box(0.14,2.4,0.14, M(0x5d4326), p.x-1.5,y+1.2,p.z));
      scene.add(box(0.14,2.4,0.14, M(0x5d4326), p.x+1.5,y+1.2,p.z));
      var can=box(3.6,0.1,2.4, M(P.stall), p.x,y+2.4,p.z);
      can.rotation.z=0.08; scene.add(can);
      scene.add(box(3.0,0.9,1.0, M(i%2?0x8a6a3c:0xc9a83a), p.x,y+0.45,p.z+0.4));
      propCrate(p.x+2.3,p.z-0.8,0.7);
    });
    // Wide boulevards
    var wellP=tw(T,0,6);
    var wy=groundH(wellP.x,wellP.z);
    var well=cyl(1.3,1.5,1.1, M(0x8f8a80), 10); well.position.set(wellP.x,wy+0.55,wellP.z); scene.add(well);
    scene.add(box(0.14,2.6,0.14, M(0x5d4326), wellP.x-1,wy+1.3,wellP.z));
    scene.add(box(0.14,2.6,0.14, M(0x5d4326), wellP.x+1,wy+1.3,wellP.z));
    var wr=cone(1.7,0.9, M(P.roof), 4); wr.rotation.y=Math.PI/4; wr.position.set(wellP.x,wy+3.0,wellP.z); scene.add(wr);
    addCollider(wellP.x-1.4,wellP.z-1.4,wellP.x+1.4,wellP.z+1.4);
    data.well=wellP;
    // Royal library manuscripts garden courtyard fountains servant quarters kitchen ovens
    var libP=tw(T,4,-64);
    buildBuilding({x:libP.x,z:libP.z,w:14,d:10,h:5.0,wall:0xe8e0cf,roofCol:0x6d4a34,roof:'gable',door:door,interior:'scribe'});
    var gardP=tw(T,48,-42);
    buildBuilding({x:gardP.x,z:gardP.z,w:12,d:12,h:4.0,wall:0xd8d2c0,roofCol:0x6d5a3e,roof:'gable',door:door,interior:'market'});
    // Fountain
    var fountP=tw(T,56,14);
    var fy=groundH(fountP.x,fountP.z);
    scene.add(cyl(2.0,2.2,0.5, M(0x8f8a80), 12).translateX(fountP.x).translateY(fy+0.25).translateZ(fountP.z));
    scene.add(cyl(0.3,0.3,1.2, M(0x8f8a80), 8).translateX(fountP.x).translateY(fy+0.8).translateZ(fountP.z));
    scene.add(sph(0.4, M(0x3f6a8a), 8,6).translateX(fountP.x).translateY(fy+1.5).translateZ(fountP.z));
    data.temple=cathP;
    data.barracks=tw(T,-52,4);
  }

  /* common: banners, bonfire */
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

  registerTownLore(facKey, data);
  townData[facKey]=data;
  return data;
}

/* ============================================================
   v5 LANDMARKS & WONDERS — every stone here has a story.
   Extended for Romanian Medieval War World
   ============================================================ */

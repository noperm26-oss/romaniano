/* ---------------- map decoration: ruins, towers, hamlets, ponds — EXTENDED EDITION ---------------- */
(function buildMapDeco(){
  var stoneM=M(0xcfc9b8);
  // Ancient ruins — more scattered across battlefields
  for(var ri=0; ri<16; ri++){
    var ra=ri/16*TAU, rr=150+((ri%4)*32);
    var rx=Math.cos(ra)*rr, rz=Math.sin(ra)*rr-20;
    // bias some to Wallachian battlefields
    if(ri%3===0){ rx=rand(-2000,2000); rz=rand(200,1800); }
    var ry=groundH(rx,rz);
    var hgt=choice([2.2,3.6,4.4,5.2]);
    var col=cyl(0.55,0.7,hgt, stoneM, 9);
    if(ri%3===2){
      col.rotation.z=Math.PI/2; col.rotation.y=rand(0,TAU);
      col.position.set(rx,ry+0.6,rz);
    } else {
      col.position.set(rx,ry+hgt/2,rz);
      if(ri%3===0){
        scene.add(box(2.6,0.5,1.1, stoneM, rx,ry+hgt+0.25,rz));
      }
    }
    scene.add(col);
    addCollider(rx-0.7,rz-0.7,rx+0.7,rz+0.7);
  }
  // Small shrine ring around Romaria capital
  for(var si=0; si<12; si++){
    var sa=si/12*TAU;
    var sx=Math.cos(sa)*580, sz=Math.sin(sa)*580;
    var sy=groundH(sx,sz);
    var m0=box(1.4,rand(2.6,3.6),0.9, M(0xa8a294), sx,sy+1.5,sz);
    m0.rotation.y=sa+rand(-0.2,0.2);
    scene.add(m0);
    addCollider(sx-0.8,sz-0.8,sx+0.8,sz+0.8);
    if(si%3===0){
      registerLore({key:'romaria_shrine_'+si, x:sx, z:sz, r:22, icon:'🕯️',
        name:'Troiță de hotar — Romaria', sub:'Boundary shrine of the capital',
        story:'Orthodox roadside shrine marking the old border of Romaria. Candles burn here for travelers, soldiers and shepherds — faith and war share the same road.'});
    }
  }
  // Watchtowers — Carpathian + trade route + border
  [
    [0,-1750, 'Frostwind Watch'],
    [0,1750, 'Drumul Lung Watch'],
    [-1750,0, 'Ardealburg Watch'],
    [1750,0, 'Hotarul Watch'],
    [-2200,-2000, 'Sfantul Andrei Monastery Tower'],
    [2200,2200, 'Southern Caravan Tower'],
    [-2200,1800, 'Cetatea Dunarii Outpost'],
    [2100,-400, 'Codrul Vechi Lookout']
  ].forEach(function(tp){
    var ty=groundH(tp[0],tp[1]);
    var twr=cyl(2.3,2.8,11, M(0x8f8a80), 10); twr.position.set(tp[0],ty+5.5,tp[1]); scene.add(twr);
    var ring=cyl(2.6,2.6,0.5, M(0x837d72), 10); ring.position.set(tp[0],ty+11.1,tp[1]); scene.add(ring);
    for(var ci=0; ci<8; ci++){
      var ca=ci/8*TAU;
      scene.add(box(0.6,0.7,0.6, M(0x837d72), tp[0]+Math.cos(ca)*2.3, ty+11.8, tp[1]+Math.sin(ca)*2.3));
    }
    var pole=cyl(0.06,0.08,2.6, M(0x5d4326), 5); pole.position.set(tp[0],ty+13.4,tp[1]); scene.add(pole);
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.0), new THREE.MeshLambertMaterial({color:0x57544e, side:THREE.DoubleSide}));
    fl.position.set(tp[0]+0.7,ty+14.2,tp[1]); scene.add(fl);
    addCollider(tp[0]-2.4,tp[1]-2.4,tp[0]+2.4,tp[1]+2.4);
    registerLore({key:'tower_'+tp[2], x:tp[0], z:tp[1], r:28, icon:'🗼',
      name:tp[2], sub:'Watchtower — '+getRegion(tp[0],tp[1]),
      story:'A wooden watchtower with stone foundation, used to spot invaders. Signal fires, weapon racks, logbooks — the frontier never sleeps.'});
  });
  // Hamlet wells near faction towns — extended
  [
    [0,0, 'Romaria'],[-1800,-800,'Ardealburg'],[-1400,1300,'Cetatea Dunarii'],
    [1700,-700,'Hotarul de Nord'],[0,-2400,'Stanca de Fier'],[0,2500,'Drumul Lung'],
    [-2100,-400,'Valea Lupilor'],[2100,200,'Codrul Vechi']
  ].forEach(function(hp,i){
    [[-16,-8],[14,6]].forEach(function(off,j){
      var hx=hp[0]+off[0], hz=hp[1]+off[1];
      if(Math.hypot(hx-hp[0],hz-hp[1])<40) buildBuilding({x:hx,z:hz,w:8,d:7,h:3.6, wall:i%2?0xc2b89a:0xb5a98c, roofCol:0x7a5c39, roof:'thatch', door:j?'S':'N', interior:'house'});
    });
    var by=groundH(hp[0],hp[1]);
    var wr2=cone(1.4,0.8, M(0x7a5c39), 4); wr2.rotation.y=Math.PI/4; wr2.position.set(hp[0],by+2.6,hp[1]); scene.add(wr2);
    var wc=cyl(1.0,1.2,0.9, M(0x8f8a80), 9); wc.position.set(hp[0],by+0.45,hp[1]); scene.add(wc);
    addCollider(hp[0]-1.1,hp[1]-1.1,hp[0]+1.1,hp[1]+1.1);
  });
  // Ponds, marshes, frozen lakes — region specific
  [
    [1300,620,'Wallachian Marsh'],
    [-700,1500,'Dunarii Swamp'],
    [320,-1420,'Carpathian Tarn'],
    [-2200,-2000,'Frozen Lake — Sfantul Andrei'],
    [0,-1600,'Hermit Cave Spring'],
    [1800,2400,'Southern Oasis']
  ].forEach(function(pp){
    var py=groundH(pp[0],pp[1]);
    var col = pp[2].includes('Frozen')?0x8ab4d0:pp[2].includes('Swamp')||pp[2].includes('Marsh')?0x4a6a4a:0x3f6a8a;
    var pond=new THREE.Mesh(new THREE.CircleGeometry(pp[2].includes('Frozen')?22:38,18), new THREE.MeshLambertMaterial({color:col, transparent:true, opacity:0.85}));
    pond.rotation.x=-Math.PI/2;
    pond.position.set(pp[0],py+0.14,pp[1]);
    scene.add(pond);
    for(var rd=0; rd<14; rd++){
      var ra2=rand(0,TAU), rr2=38+rand(0,7);
      var rx2=pp[0]+Math.cos(ra2)*rr2, rz2=pp[1]+Math.sin(ra2)*rr2;
      var reed=cone(0.06,rand(0.7,1.3), M(0x5d8a38), 4);
      reed.position.set(rx2, groundH(rx2,rz2)+0.4, rz2);
      scene.add(reed);
    }
    registerLore({key:'water_'+pp[0]+'_'+pp[1], x:pp[0], z:pp[1], r:38, icon:pp[2].includes('Frozen')?'❄️':'💧',
      name:pp[2], sub:'Water source — '+getRegion(pp[0],pp[1]),
      story:'A vital water source in '+getRegion(pp[0],pp[1])+' — marsh, lake or oasis that decides where armies can march and villages can live.'});
  });
  try{
    var bGeo=new THREE.SphereGeometry(0.55,7,5);
    var bMat=new THREE.MeshLambertMaterial({color:0x4a7a37});
    var bushes=new THREE.InstancedMesh(bGeo,bMat,160);
    var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3();
    for(var bi=0; bi<160; bi++){
      var a2=rand(0,TAU), r2=rand(240,1600);
      var bx=Math.cos(a2)*r2, bz=Math.sin(a2)*r2;
      if(getRegion(bx,bz)==='trade_route' && Math.random()<0.7) continue;
      if(getRegion(bx,bz)==='carpathian' && Math.random()<0.3){ r2=rand(1800,2600); bx=Math.cos(a2)*r2; bz=Math.sin(a2)*r2; }
      e.set(0,rand(0,TAU),0); q.setFromEuler(e);
      v.set(bx, groundH(bx,bz)+0.3, bz);
      var bs=rand(0.6,1.4); s.set(bs,bs*0.75,bs);
      m4.compose(v,q,s);
      bushes.setMatrixAt(bi,m4);
    }
    bushes.castShadow=false;
    scene.add(bushes);
  }catch(err){}
  // Secret locations — extended
  [
    [-1200,-1800, 'Hidden Cave Shrine', '🕯️', 'Candles, icons, ancient carvings — a hermit’s refuge'],
    [1400,1800, 'Abandoned Monastery', '⛪', 'Collapsed roof, vines, old library with scrolls'],
    [0,1200, 'Bandit Hideout', '🏴', 'Tents, stolen goods, lookout posts in Wallachian reeds'],
    [-800,-2200, 'Underground Crypt Maze', '💀', 'Stone coffins, dark tunnels beneath Carpathian monastery'],
    [900,-2000, 'Hidden Waterfall Cave', '🌊', 'Behind a frozen waterfall — whispers and icons'],
    [-2000,2000, 'Forgotten Watchtower', '🗼', 'Overgrown, broken, but still watching the trade route'],
    [2200,-600, 'Smuggler Tunnels', '🕳️', 'Moldavian border — salt, gold and secrets move unseen'],
    [-600,2100, 'Witch’s Hut Deep in Forest', '🧙', 'Herbs, potions, drying racks — Codrul Vechi whispers']
  ].forEach(function(sec){
    var sy=groundH(sec[0],sec[1]);
    var marker=sph(0.6, M(0x6a6a6a), 6,5);
    marker.position.set(sec[0],sy+0.6,sec[1]);
    scene.add(marker);
    registerLore({key:'secret_'+sec[0]+'_'+sec[1], x:sec[0], z:sec[1], r:26, icon:sec[3],
      name:sec[2], sub:'Secret Location — '+getRegion(sec[0],sec[1]),
      story:sec[4]});
  });
})();

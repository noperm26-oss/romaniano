/* ---------------- battlefield props — ROMANIAN MEDIEVAL WAR WORLD EXTENDED ----------------
   Carpathian peaks, Transylvanian orchards, Wallachian marshes, Moldavian forests,
   Trade Route caravan stops, Romaria boulevards, battlefields, secret areas
*/
var clouds=[], flames=[];
var waveBanners=[];
var nightLights=[];
var LANDMARKS=[];
var critters=[];
var chests=[];
function registerLore(o){ o.idx=LANDMARKS.length; LANDMARKS.push(o); return o; }
var scenery={};
(function buildField(){
  /* mountains ring at the edge of the world — now Carpathian ridge emphasis north */
  for(var mi=0; mi<34; mi++){
    var ma=mi/34*TAU+rand(-0.14,0.14), mr=rand(2670,2870), mh=rand(60,140);
    // bias north for Carpathian ridge
    if(mi<14){
      ma = -Math.PI/2 + rand(-0.9,0.9);
      mr = rand(2550,2920);
      mh = rand(90,180);
    }
    var mtn=cone(rand(130,260), mh, M(0x7d94a5), 7); mtn.name='always';
    mtn.position.set(Math.cos(ma)*mr, mh*0.32, Math.sin(ma)*mr);
    mtn.castShadow=false;
    scene.add(mtn);
  }
  /* continuous wall of peaks so the world's rim is SEEN, not felt — extended north */
  for(var wi=0; wi<72; wi++){
    var wa=wi/72*TAU+rand(-0.03,0.03), wr=rand(2980,3080), wh=rand(95,180);
    if(wa>-2.5 && wa<-0.6){ wh+=40; } // north higher
    var wall=cone(rand(210,360), wh, M(0x71879a), 7); wall.name='always';
    wall.position.set(Math.cos(wa)*wr, wh*0.32, Math.sin(wa)*wr);
    wall.castShadow=false;
    scene.add(wall);
  }
  /* spent arrows + broken shields on the field — battlefields scattered */
  try{
    var aGeo=new THREE.CylinderGeometry(0.02,0.02,0.8,4);
    var aMat=new THREE.MeshLambertMaterial({color:0xb59a63});
    var sticks=new THREE.InstancedMesh(aGeo, aMat, 160);
    var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3(1,1,1);
    for(var ai=0; ai<160; ai++){
      var regionPick = rand(0,1);
      var ax, az;
      if(regionPick<0.3){
        ax=rand(-2800,2800); az=rand(200,1800); // Wallachian battlefields
      } else if(regionPick<0.6){
        ax=rand(-2000,2000); az=rand(-800,800); // central
      } else {
        ax=rand(-380,380); az=rand(-380,380);
      }
      e.set(rand(-0.5,0.5),rand(0,TAU),rand(0.4,1.1)); q.setFromEuler(e);
      v.set(ax, groundH(ax,az)+0.28, az);
      m4.compose(v,q,s);
      sticks.setMatrixAt(ai,m4);
    }
    scene.add(sticks);
  }catch(err){}
  for(var bi=0; bi<24; bi++){
    var bx, bz;
    if(bi<8){ bx=rand(-2600,2600); bz=rand(300,1800); }
    else if(bi<16){ bx=rand(-1800,1800); bz=rand(-600,600); }
    else { bx=rand(-330,330); bz=rand(-330,330); }
    var sh=cyl(0.34,0.34,0.05, M(choice([0x7a3434,0x50565e,0x5b4a86])), 10);
    sh.rotation.set(Math.PI/2+rand(-0.4,0.4), rand(0,TAU), 0);
    sh.position.set(bx, groundH(bx,bz)+0.06, bz);
    scene.add(sh);
  }
  /* great bonfire at Romaria's heart + additional fires per region */
  var fx2=0, fz2=26, fy=groundH(fx2,fz2);
  for(var si=0; si<9; si++){
    var sa=si/9*TAU;
    scene.add(box(0.34,0.26,0.34, M(0x777772), fx2+Math.cos(sa)*0.75, fy+0.1, fz2+Math.sin(sa)*0.75));
  }
  var lg1=cyl(0.11,0.13,1.5, M(0x5d4326), 6); lg1.rotation.z=Math.PI/2; lg1.rotation.y=0.5; lg1.position.set(fx2,fy+0.24,fz2); scene.add(lg1);
  var lg2=cyl(0.11,0.13,1.5, M(0x5d4326), 6); lg2.rotation.z=Math.PI/2; lg2.rotation.y=-0.7; lg2.position.set(fx2,fy+0.42,fz2); scene.add(lg2);
  var fireLight=new THREE.PointLight(0xff9a3c, 1.1, 26, 2);
  fireLight.position.set(fx2, fy+1.2, fz2); scene.add(fireLight);
  fireLight.userData.base=1.1; nightLights.push(fireLight);
  var flame=new THREE.Mesh(new THREE.ConeGeometry(0.45,1.2,7), new THREE.MeshBasicMaterial({color:0xffa531}));
  flame.position.set(fx2, fy+0.95, fz2); scene.add(flame);
  var flame2=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.7,6), new THREE.MeshBasicMaterial({color:0xffe28a}));
  flame2.position.set(fx2, fy+1.15, fz2); scene.add(flame2);
  flames.push(flame, flame2);
  scenery.fire={light:fireLight, flame:flame, flame2:flame2, y:fy};

  /* regional bonfires */
  [
    [0,-2400, 'Stanca de Fier beacon'],
    [-1800,-800, 'Ardealburg market fire'],
    [-1400,1300, 'Cetatea Dunarii war fire'],
    [1700,-700, 'Hotarul de Nord watchfire'],
    [0,2500, 'Drumul Lung inn fire']
  ].forEach(function(f){
    var fy2=groundH(f[0],f[1]);
    var fl=new THREE.Mesh(new THREE.ConeGeometry(0.35,0.9,6), new THREE.MeshBasicMaterial({color:0xffa531}));
    fl.position.set(f[0],fy2+0.8,f[1]); scene.add(fl); flames.push(fl);
    var li=new THREE.PointLight(0xff9a3c, 0.8, 20, 2); li.position.set(f[0],fy2+1.1,f[1]); scene.add(li); li.userData.base=0.8; nightLights.push(li);
  });

  /* clouds — more over Carpathians */
  var cm=new THREE.MeshLambertMaterial({color:0xffffff, emissive:0x8a97a8});
  for(var ci=0; ci<22; ci++){
    var cl=new THREE.Group();
    var parts=randi(3,5);
    for(var pi=0; pi<parts; pi++){
      var ps=sph(rand(3,5.5), cm, 8, 6);
      ps.scale.y=0.45; ps.castShadow=false;
      ps.position.set(rand(-4,4), rand(-0.5,0.5), rand(-2,2));
      cl.add(ps);
    }
    if(ci<8) cl.position.set(rand(-900,900), rand(56,76), rand(-2400,-1600)); // over Carpathians
    else cl.position.set(rand(-900,900), rand(46,66), rand(-900,900));
    scene.add(cl); clouds.push(cl);
  }
  /* trees across the world — region specific */
  function tree(x,z, type){
    var y=groundH(x,z);
    var t=new THREE.Group(); t.position.set(x,y,z);
    var trunk=cyl(0.16,0.28,rand(1.5,2.4), M(0x5d4326), 7);
    trunk.position.y=1.1; t.add(trunk);
    if(type==='pine' || Math.random()<0.5){
      var pc=M(type==='pine'?0x2f4a2e:0x2f5233);
      [[1.6,2.2,1.5],[2.8,1.8,1.15],[3.9,1.4,0.9]].forEach(function(l){
        var c=cone(l[2],l[1],pc,8); c.position.y=l[0]; t.add(c);
      });
    } else {
      var gc=M(0x4a7a37);
      for(var i=0;i<3;i++){
        var sp=sph(rand(0.85,1.3), Math.random()<0.5?gc:M(0x57893f), 8, 6);
        sp.position.set(rand(-0.6,0.6), rand(2.1,3.3), rand(-0.6,0.6));
        sp.scale.y=0.8; t.add(sp);
      }
    }
    scene.add(t);
  }
  function farFromTowns(x,z){
    if(x*x+z*z < 580*580) return false; // keep capital clear
    for(var i=1;i<FLATS.length;i++){
      var f=FLATS[i];
      var dx=x-f.x, dz=z-f.z;
      if(dx*dx+dz*dz < 360*360) return false;
    }
    return true;
  }
  var placed=0, guard=0;
  while(placed<240 && guard<2500){
    guard++;
    var tx=rand(-WORLD.half+200, WORLD.half-200);
    var tz=rand(-WORLD.half+200, WORLD.half-200);
    var reg = getRegion(tx,tz);
    if(reg==='carpathian'){
      if(Math.random()<0.7){ /* dense pine forests */
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz,'pine'); placed++;
      }
    } else if(reg==='transylvanian'){
      if(Math.random()<0.55){
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz,'oak'); placed++;
      }
    } else if(reg==='moldavian'){
      if(Math.random()<0.65){
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz, Math.random()<0.6?'pine':'oak'); placed++;
      }
    } else if(reg==='wallachian'){
      if(Math.random()<0.25){
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz,'oak'); placed++;
      }
    } else if(reg==='trade_route'){
      if(Math.random()<0.12){
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz,'oak'); placed++;
      }
    } else {
      if(Math.random()<0.4){
        tx*=0.55; tz*=0.55;
        if(!farFromTowns(tx,tz)) continue;
        tree(tx,tz); placed++;
      }
    }
  }
  for(var ri=0; ri<36; ri++){
    var rx2=rand(-2400,2400), rz2=rand(-2400,2400);
    if(!farFromTowns(rx2,rz2)) continue;
    var reg2=getRegion(rx2,rz2);
    var rockCol = reg2==='carpathian'?0x8a8a86:reg2==='trade_route'?0xa09070:0x8a8a86;
    var rock=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6,2.2),0), M(rockCol));
    rock.position.set(rx2, groundH(rx2,rz2)+0.2, rz2);
    rock.rotation.set(rand(0,3),rand(0,3),rand(0,3));
    rock.castShadow=true;
    scene.add(rock);
  }
})();

/* ============================================================
   BUILDINGS — real walls, doors & interiors — EXTENDED
   ============================================================ */

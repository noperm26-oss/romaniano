/* ---------------- battlefield props (center field) ---------------- */
var clouds=[], flames=[];
var waveBanners=[];  /* cloth flags that ripple (v5) */
var nightLights=[];  /* fire lights that own the night (v5) */
var LANDMARKS=[];    /* every monument & building carries a story (v5) */
var critters=[];     /* ambient wildlife: deer, sheep, birds (v5) */
var chests=[];       /* hidden treasure chests (v5) */
function registerLore(o){ o.idx=LANDMARKS.length; LANDMARKS.push(o); return o; }
var scenery={};
(function buildField(){
  /* mountains ring at the edge of the world */
  for(var mi=0; mi<22; mi++){
    var ma=mi/22*TAU+rand(-0.14,0.14), mr=rand(2670,2870), mh=rand(60,120);
    var mtn=cone(rand(130,230), mh, M(0x7d94a5), 7); mtn.name='always';
    mtn.position.set(Math.cos(ma)*mr, mh*0.32, Math.sin(ma)*mr);
    mtn.castShadow=false;
    scene.add(mtn);
  }
  /* v6: continuous wall of peaks so the world's rim is SEEN, not felt */
  for(var wi=0; wi<56; wi++){
    var wa=wi/56*TAU+rand(-0.03,0.03), wr=rand(2980,3080), wh=rand(95,160);
    var wall=cone(rand(210,320), wh, M(0x71879a), 7); wall.name='always';
    wall.position.set(Math.cos(wa)*wr, wh*0.32, Math.sin(wa)*wr);
    wall.castShadow=false;
    scene.add(wall);
  }
  /* spent arrows + broken shields on the field */
  try{
    var aGeo=new THREE.CylinderGeometry(0.02,0.02,0.8,4);
    var aMat=new THREE.MeshLambertMaterial({color:0xb59a63});
    var sticks=new THREE.InstancedMesh(aGeo, aMat, 90);
    var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3(1,1,1);
    for(var ai=0; ai<90; ai++){
      var ax=rand(-380,380), az=rand(-380,380);
      e.set(rand(-0.5,0.5),rand(0,TAU),rand(0.4,1.1)); q.setFromEuler(e);
      v.set(ax, groundH(ax,az)+0.28, az);
      m4.compose(v,q,s);
      sticks.setMatrixAt(ai,m4);
    }
    scene.add(sticks);
  }catch(err){}
  for(var bi=0; bi<10; bi++){
    var bx=rand(-330,330), bz=rand(-330,330);
    var sh=cyl(0.34,0.34,0.05, M(choice([0x7a3434,0x50565e,0x5b4a86])), 10);
    sh.rotation.set(Math.PI/2+rand(-0.4,0.4), rand(0,TAU), 0);
    sh.position.set(bx, groundH(bx,bz)+0.06, bz);
    scene.add(sh);
  }
  /* great bonfire at the field's heart */
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
  /* clouds */
  var cm=new THREE.MeshLambertMaterial({color:0xffffff, emissive:0x8a97a8});
  for(var ci=0; ci<16; ci++){
    var cl=new THREE.Group();
    var parts=randi(3,5);
    for(var pi=0; pi<parts; pi++){
      var ps=sph(rand(3,5.5), cm, 8, 6);
      ps.scale.y=0.45; ps.castShadow=false;
      ps.position.set(rand(-4,4), rand(-0.5,0.5), rand(-2,2));
      cl.add(ps);
    }
    cl.position.set(rand(-900,900), rand(46,66), rand(-900,900));
    scene.add(cl); clouds.push(cl);
  }
  /* trees across the world (avoid towns & field) */
  function tree(x,z){
    var y=groundH(x,z);
    var t=new THREE.Group(); t.position.set(x,y,z);
    var trunk=cyl(0.16,0.28,rand(1.5,2.4), M(0x5d4326), 7);
    trunk.position.y=1.1; t.add(trunk);
    if(Math.random()<0.4){
      var pc=M(0x2f5233);
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
    if(x*x+z*z < 480*480) return false;
    for(var i=1;i<FLATS.length;i++){
      var f=FLATS[i];
      var dx=x-f.x, dz=z-f.z;
      if(dx*dx+dz*dz < 380*380) return false;
    }
    return true;
  }
  var placed=0, guard=0;
  while(placed<170 && guard<1500){
    guard++;
    var tx=rand(-WORLD.half+200, WORLD.half-200);
    var tz=rand(-WORLD.half+200, WORLD.half-200);
    if(Math.random()<0.6){ /* cluster nearer the middle of the world */
      tx*=0.45; tz*=0.45;
    }
    if(!farFromTowns(tx,tz)) continue;
    tree(tx,tz); placed++;
  }
  for(var ri=0; ri<24; ri++){
    var rx2=rand(-2400,2400), rz2=rand(-2400,2400);
    if(!farFromTowns(rx2,rz2)) continue;
    var rock=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.6,1.9),0), M(0x8a8a86));
    rock.position.set(rx2, groundH(rx2,rz2)+0.2, rz2);
    rock.rotation.set(rand(0,3),rand(0,3),rand(0,3));
    rock.castShadow=true;
    scene.add(rock);
  }
})();

/* ============================================================
   BUILDINGS — real walls, doors & interiors
   ============================================================ */

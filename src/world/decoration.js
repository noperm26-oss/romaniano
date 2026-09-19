/* ---------------- map decoration: ruins, towers, hamlets, ponds ---------------- */
(function buildMapDeco(){
  var stoneM=M(0xcfc9b8);
  for(var ri=0; ri<9; ri++){
    var ra=ri/9*TAU, rr=150+((ri%3)*26);
    var rx=Math.cos(ra)*rr, rz=Math.sin(ra)*rr-20;
    var ry=groundH(rx,rz);
    var hgt=choice([2.2,3.6,4.4]);
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
  for(var si=0; si<7; si++){
    var sa=si/7*TAU;
    var sx=Math.cos(sa)*70, sz=-160+Math.sin(sa)*70;
    var sy=groundH(sx,sz);
    var m0=box(1.4,rand(2.6,3.6),0.9, M(0xa8a294), sx,sy+1.5,sz);
    m0.rotation.y=sa+rand(-0.2,0.2);
    scene.add(m0);
    addCollider(sx-0.8,sz-0.8,sx+0.8,sz+0.8);
  }
  [[0,-1750],[0,1750],[-1750,0],[1750,0]].forEach(function(tp){
    var ty=groundH(tp[0],tp[1]);
    var twr=cyl(2.3,2.8,9, M(0x8f8a80), 10); twr.position.set(tp[0],ty+4.5,tp[1]); scene.add(twr);
    var ring=cyl(2.6,2.6,0.5, M(0x837d72), 10); ring.position.set(tp[0],ty+9.1,tp[1]); scene.add(ring);
    for(var ci=0; ci<8; ci++){
      var ca=ci/8*TAU;
      scene.add(box(0.6,0.7,0.6, M(0x837d72), tp[0]+Math.cos(ca)*2.3, ty+9.8, tp[1]+Math.sin(ca)*2.3));
    }
    var pole=cyl(0.06,0.08,2.6, M(0x5d4326), 5); pole.position.set(tp[0],ty+11.4,tp[1]); scene.add(pole);
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.0), new THREE.MeshLambertMaterial({color:0x57544e, side:THREE.DoubleSide}));
    fl.position.set(tp[0]+0.7,ty+12.2,tp[1]); scene.add(fl);
    addCollider(tp[0]-2.4,tp[1]-2.4,tp[0]+2.4,tp[1]+2.4);
  });
  [[900,900],[-900,900],[900,-900],[-900,-900]].forEach(function(hp,i){
    [[-16,-8],[14,6]].forEach(function(off,j){
      var hx=hp[0]+off[0], hz=hp[1]+off[1];
      buildBuilding({x:hx,z:hz,w:8,d:7,h:3.6, wall:i%2?0xc2b89a:0xb5a98c, roofCol:0x7a5c39, roof:'thatch', door:j?'S':'N', interior:'house'});
    });
    var by=groundH(hp[0],hp[1]);
    var wr2=cone(1.4,0.8, M(0x7a5c39), 4); wr2.rotation.y=Math.PI/4; wr2.position.set(hp[0],by+2.6,hp[1]); scene.add(wr2);
    var wc=cyl(1.0,1.2,0.9, M(0x8f8a80), 9); wc.position.set(hp[0],by+0.45,hp[1]); scene.add(wc);
    addCollider(hp[0]-1.1,hp[1]-1.1,hp[0]+1.1,hp[1]+1.1);
  });
  [[1300,620],[-700,1500],[320,-1420]].forEach(function(pp){
    var py=groundH(pp[0],pp[1]);
    var pond=new THREE.Mesh(new THREE.CircleGeometry(38,18), new THREE.MeshLambertMaterial({color:0x3f6a8a, transparent:true, opacity:0.85}));
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
  });
  try{
    var bGeo=new THREE.SphereGeometry(0.55,7,5);
    var bMat=new THREE.MeshLambertMaterial({color:0x4a7a37});
    var bushes=new THREE.InstancedMesh(bGeo,bMat,90);
    var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3();
    for(var bi=0; bi<90; bi++){
      var a2=rand(0,TAU), r2=rand(240,1600);
      var bx=Math.cos(a2)*r2, bz=Math.sin(a2)*r2;
      e.set(0,rand(0,TAU),0); q.setFromEuler(e);
      v.set(bx, groundH(bx,bz)+0.3, bz);
      var bs=rand(0.6,1.4); s.set(bs,bs*0.75,bs);
      m4.compose(v,q,s);
      bushes.setMatrixAt(bi,m4);
    }
    bushes.castShadow=false;
    scene.add(bushes);
  }catch(err){}
})();

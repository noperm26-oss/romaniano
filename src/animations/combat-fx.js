/* ---------------- combat fx (v5): slash arcs, shock rings, shake, hit-stop ---------------- */
var slashes=[]; var camShake=0, hitStop=0; var fxStats={slashes:0, rings:0};
function spawnSlash(e){
  try{
    var kind=e.atkKind||'overhead';
    var fwd=e.yaw;
    var dist=0.95, h=1.35, geo, rx;
    if(e.isPlayer){ fwd=camYaw; dist=2.1; h=1.42; }   /* centered in the FP view */
    if(kind==='thrust'){ geo=new THREE.RingGeometry(0.4,0.8,14,1,-0.5,1.0); rx=-0.15; }
    else if(kind==='bash'){ geo=new THREE.RingGeometry(0.5,1.1,14,1,-0.9,1.8); rx=-0.25; }
    else { geo=new THREE.RingGeometry(0.55,1.3,16,1,-1.25,2.5); rx=-1.15; }   /* horizontal sweep */
    var m=new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:e.isPlayer?0xfff0c2:0xcfd8e2, transparent:true, opacity:0.7, side:THREE.DoubleSide, depthWrite:false, fog:false}));
    var p=e.group.position;
    m.position.set(p.x+Math.sin(fwd)*dist, p.y+h, p.z+Math.cos(fwd)*dist);
    m.rotation.order='YXZ';
    m.rotation.y=fwd; m.rotation.x=rx; m.rotation.z=0;
    scene.add(m);
    slashes.push({m:m, life:0.17, t:0, ring:false});
    fxStats.slashes++;
    window.__lastSlash={x:+m.position.x.toFixed(2), y:+m.position.y.toFixed(2), z:+m.position.z.toFixed(2), rx:rx, fwd:+fwd.toFixed(2), kind:kind, who:e.isPlayer?'player':'ai'};
    if(e.isPlayer) window.__lastSlashP=window.__lastSlash;
  }catch(err){}
}
function spawnRing(x,y,z,col){
  var m=new THREE.Mesh(new THREE.RingGeometry(0.85,1.0,26), new THREE.MeshBasicMaterial({color:col||0xe9c458, transparent:true, opacity:0.85, side:THREE.DoubleSide, depthWrite:false, fog:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,y,z);
  scene.add(m);
  slashes.push({m:m, life:0.8, t:0, ring:true});
  fxStats.rings++;
}
function updateFx(dt){
  for(var i=slashes.length-1;i>=0;i--){
    var s=slashes[i]; s.t+=dt;
    if(s.t>=s.life){ scene.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); slashes.splice(i,1); continue; }
    var k=s.t/s.life;
    if(s.ring){
      var sc=1+k*46; s.m.scale.set(sc,sc,1); s.m.material.opacity=0.85*(1-k);
    } else {
      var sc2=0.7+k*0.7; s.m.scale.set(sc2*1.4,sc2*1.4,sc2); s.m.material.opacity=0.7*(1-k);
    }
  }
}

/* ---------------- arrows ---------------- */
var arrows=[];
function makeArrowMesh(){
  var g=new THREE.Group(); g.name='arrow';
  var shaft=cyl(0.02,0.02,0.72, M(0xc9b98a), 5); shaft.rotation.x=Math.PI/2; g.add(shaft);
  var tip=cone(0.035,0.12, M(0x8a919b), 5); tip.rotation.x=Math.PI/2; tip.position.z=0.4; g.add(tip);
  g.add(box(0.09,0.005,0.1, M(0xe0d8c4), 0,0.035,-0.3));
  g.add(box(0.005,0.09,0.1, M(0xe0d8c4), 0.035,0,-0.3));
  return g;
}
function spawnArrow(pos,dir,speed,dmg,team,owner,scale){
  var a=null;
  for(var i=0;i<arrows.length;i++){ if(!arrows[i].active){ a=arrows[i]; break; } }
  if(!a){
    a={mesh:makeArrowMesh(), active:false, vel:new THREE.Vector3(), prev:new THREE.Vector3()};
    scene.add(a.mesh); arrows.push(a);
  }
  a.active=true; a.stuck=false; a.stickT=0;
  a.dmg=dmg; a.team=team; a.owner=owner||null; a.life=5;
  a.mesh.visible=true;
  a.mesh.scale.setScalar(scale||1);
  a.mesh.position.copy(pos);
  a.prev.copy(pos);
  a.vel.copy(dir).multiplyScalar(speed);
  a.mesh.lookAt(pos.clone().add(dir));
}

/* ============================================================
   AGE OF WARFARE — part 2: conquest, economy, armies, UI
   ============================================================ */

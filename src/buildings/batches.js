/* Spatially bounded instancing. Nearby regions draw, distant regions cost no draw calls. */
function createBuildingBatch(){
  var buckets=new Map(),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3();
  function add(kind,x,y,z,w,h,d,color,rotation){
    var key=Math.floor((x+WORLD.half)/375)+':'+Math.floor((z+WORLD.half)/375)+':'+kind;
    if(!buckets.has(key))buckets.set(key,{kind:kind,x:Math.floor((x+WORLD.half)/375),z:Math.floor((z+WORLD.half)/375),items:[]});
    pos.set(x,y,z);scale.set(w,h,d);quat.setFromAxisAngle(new THREE.Vector3(0,1,0),rotation||0);matrix.compose(pos,quat,scale);
    buckets.get(key).items.push({matrix:matrix.clone(),color:color});
  }
  function finish(){
    var geos={box:new THREE.BoxGeometry(1,1,1),roof:new THREE.ConeGeometry(0.5,1,4),
              gable:gablePrismGeometry(),tree:new THREE.ConeGeometry(0.5,1,7)};
    var material=M(0xffffff);
    buckets.forEach(function(b){
      var mesh=new THREE.InstancedMesh(geos[b.kind],material,b.items.length);
      b.items.forEach(function(item,i){mesh.setMatrixAt(i,item.matrix);mesh.setColorAt(i,new THREE.Color(item.color));});
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
      mesh.userData.cullBounds={x:(b.x+0.5)*375-WORLD.half,z:(b.z+0.5)*375-WORLD.half,r:285};
      mesh.name='settlement-chunk';mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
      scene.add(mesh);
    });
    return buckets.size;
  }
  return {add:add,finish:finish};
}
function buildSettlementHouse(batch,x,z,type){
  var d=BUILDING_DESIGNS[type],r=Math.hypot(d.width,d.depth)/2+2;
  if(insideSolid(x,z,r))return false;
  // Keep older trunk roads and their walking clearance intact.
  if(settlementRoadNear(x,z,r+3))return false;
  var y=groundH(x,z);
  var w=d.width, dp=d.depth, h=d.height;
  var alongZ=dp>w+0.5;                                     /* ridge follows the long axis */
  var ridgeLen=alongZ?dp:w, crossLen=alongZ?w:dp;
  var ov=0.55, rh=Math.max(0.95,(crossLen/2+ov)*0.7);
  /* stone plinth, walls, real gable roof, ridge beam, chimney */
  batch.add('box',x,y+0.15,z,w+0.5,0.3,dp+0.5,d.trim);
  batch.add('box',x,y+h/2,z,w,h,dp,d.wall);
  batch.add('gable',x,y+h+rh/2-0.06,z,ridgeLen,rh,crossLen+2*ov,d.roof,alongZ?Math.PI/2:0);
  if(alongZ) batch.add('box',x,y+h+rh,z,0.26,0.18,ridgeLen+0.4,d.trim);
  else batch.add('box',x,y+h+rh,z,ridgeLen+0.4,0.18,0.26,d.trim);
  batch.add('box',x+(alongZ?w*0.26:ridgeLen*0.28),y+h+rh*0.5,z+(alongZ?ridgeLen*0.28:dp*0.26),0.66,1.5,0.66,d.trim);
  /* door with frame, two glazed windows */
  var fz=dp/2+0.06;
  batch.add('box',x,y+1.05,z+fz,1.2,2.1,0.13,d.trim);
  batch.add('box',x-w*0.31,y+2.1,z+fz,0.8,0.9,0.1,0x47606c);
  batch.add('box',x+w*0.31,y+2.1,z+fz,0.8,0.9,0.1,0x47606c);
  if(type==='chapel'){
    batch.add('box',x,y+h+rh+1.0,z,0.2,2,0.2,0xc9a227);
    batch.add('box',x,y+h+rh+1.3,z,1.1,0.2,0.2,0xc9a227);
  }
  addCollider(x-w/2,z-dp/2,x+w/2,z+dp/2);BUILD_COUNT++;
  return true;
}

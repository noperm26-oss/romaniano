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
    var geos={box:new THREE.BoxGeometry(1,1,1),roof:new THREE.ConeGeometry(0.5,1,4),tree:new THREE.ConeGeometry(0.5,1,7)};
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
  batch.add('box',x,y+d.height/2,z,d.width,d.height,d.depth,d.wall);
  batch.add('roof',x,y+d.height+1.2,z,d.width*1.55,2.5,d.depth*1.55,d.roof,Math.PI/4);
  batch.add('box',x,y+1,z+d.depth/2+0.05,1.25,2,0.14,d.trim);
  batch.add('box',x-1.9,y+2,z+d.depth/2+0.08,0.8,0.8,0.12,0x47606c);
  batch.add('box',x+1.9,y+2,z+d.depth/2+0.08,0.8,0.8,0.12,0x47606c);
  if(type==='chapel'){
    batch.add('box',x,y+d.height+2.8,z,0.2,2,0.2,0xc9a227);
    batch.add('box',x,y+d.height+3.1,z,1.1,0.2,0.2,0xc9a227);
  }
  addCollider(x-d.width/2,z-d.depth/2,x+d.width/2,z+d.depth/2);BUILD_COUNT++;
  return true;
}

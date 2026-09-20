/* Spatially bounded instancing for yard clutter (fences, garden rows, fields, trees). Nearby regions draw, distant regions cost no draw calls. */
function createBuildingBatch(){
  var buckets=new Map(),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3();
  function add(kind,x,y,z,w,h,d,color,rotation){
    var key=Math.floor((x+WORLD.half)/375)+':'+Math.floor((z+WORLD.half)/375)+':'+kind;
    if(!buckets.has(key))buckets.set(key,{kind:kind,x:Math.floor((x+WORLD.half)/375),z:Math.floor((z+WORLD.half)/375),items:[]});
    pos.set(x,y,z);scale.set(w,h,d);quat.setFromAxisAngle(new THREE.Vector3(0,1,0),rotation||0);matrix.compose(pos,quat,scale);
    buckets.get(key).items.push({matrix:matrix.clone(),color:color});
  }
  function finish(){
    /* box, tree (fir) and ball (broadleaf crown) — no building is a batch primitive any more (prefabs.js) */
    var geos={box:new THREE.BoxGeometry(1,1,1),tree:new THREE.ConeGeometry(0.5,1,7),ball:new THREE.SphereGeometry(0.5,7,5)};
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

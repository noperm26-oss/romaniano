var fireT=0;
/* v7: fog-distance culling — nothing beyond the fog ever draws */
var cullStatics=[]; var cullTimer=0; var CULL_R=500;
function snapshotStatics(){
  cullStatics.length=0;
  scene.updateMatrixWorld(true);
  var sph=new THREE.Sphere();
  scene.children.slice().forEach(function(ch){
    if(ch.isLight || ch.isPoints || ch.isCamera) return;   /* camera hosts the FP weapon — never cull */
    if(ch.name==='always'||ch.name==='arrow'||ch.name==='fx') return;
    var skip=false;
    ch.traverse && ch.traverse(function(o){ if(o.material && o.material.fog===false) skip=true; });
    if(skip) return;
    if(ch.userData.cullBounds){var bounds=ch.userData.cullBounds;cullStatics.push({g:ch,x:bounds.x,z:bounds.z,r:bounds.r});return;}
    /* v8.1: cull by world bounds so huge groups (district IMs, towns) still hide by distance */
    var box=new THREE.Box3().setFromObject(ch);
    if(!isFinite(box.min.x)) return;
    box.getBoundingSphere(sph);
    if(!isFinite(sph.center.x) || sph.radius>1400) return;   /* map-spanning group: keep always-on */
    cullStatics.push({g:ch, x:sph.center.x, z:sph.center.z, r:sph.radius});
  });
}
function cullTick(){
  var px=player?player.group.position.x:camera.position.x;
  var pz=player?player.group.position.z:camera.position.z;
  var R2=CULL_R*CULL_R;
  for(var i=0;i<cullStatics.length;i++){
    var c=cullStatics[i];
    var dx=c.x-px, dz=c.z-pz;
    var vis=(dx*dx+dz*dz) < (CULL_R+c.r)*(CULL_R+c.r);
    if(c.g.visible!==vis) c.g.visible=vis;
  }
  for(var j=0;j<entities.length;j++){
    var e=entities[j];
    if(e.isPlayer) continue;
    var p=e.group.position;
    var vis=((p.x-px)*(p.x-px)+(p.z-pz)*(p.z-pz))<R2;
    if(e.group.visible!==vis) e.group.visible=vis;
    if(e.bar){
      var want=e.barBase!==false && !e.dead && vis;
      if(e.bar.grp.visible!==want) e.bar.grp.visible=want;
    }
  }
}

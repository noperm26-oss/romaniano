/* ---------------- mesh helpers ---------------- */
var matCache = {};
var geometryCache=new Map();
function sharedGeometry(key,build){if(!geometryCache.has(key)){var geo=build();geo.userData.shared=true;geometryCache.set(key,geo);}return geometryCache.get(key);}
function M(c,opts){
  var key = c + (opts?JSON.stringify(opts):'');
  if(!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial(Object.assign({color:c}, opts||{}));
  return matCache[key];
}
function NM(c){ return new THREE.MeshLambertMaterial({color:c}); }
function shad(m){ m.castShadow=true; return m; }
function box(w,h,d,m,x,y,z){
  var ms=new THREE.Mesh(sharedGeometry('box:'+w+':'+h+':'+d,function(){return new THREE.BoxGeometry(w,h,d);}), m);
  ms.position.set(x||0,y||0,z||0); return shad(ms);
}
function cyl(rt,rb,h,m,seg){
  var ms=new THREE.Mesh(sharedGeometry('cyl:'+rt+':'+rb+':'+h+':'+(seg||10),function(){return new THREE.CylinderGeometry(rt,rb,h,seg||10);}), m);
  return shad(ms);
}
function cone(r,h,m,seg){
  var ms=new THREE.Mesh(sharedGeometry('cone:'+r+':'+h+':'+(seg||10),function(){return new THREE.ConeGeometry(r,h,seg||10);}), m);
  return shad(ms);
}
function sph(r,m,ws,hs){
  var ms=new THREE.Mesh(sharedGeometry('sph:'+r+':'+(ws||9)+':'+(hs||7),function(){return new THREE.SphereGeometry(r,ws||9,hs||7);}), m);
  return shad(ms);
}
function torus(r,t,m){
  var ms=new THREE.Mesh(sharedGeometry('torus:'+r+':'+t,function(){return new THREE.TorusGeometry(r,t,6,12);}), m);
  return shad(ms);
}

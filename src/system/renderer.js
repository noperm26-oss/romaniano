/* ---------------- three.js setup ---------------- */
var canvas = $('game');
var renderer;
try{
  renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, powerPreference:'high-performance'});   /* laptops: ask for the discrete GPU */
}catch(e){ $('webgl-error').classList.remove('hidden'); return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xb7cbdd);
scene.fog = new THREE.Fog(0xb2c4d4, 130, 540);

var camera = new THREE.PerspectiveCamera(68, window.innerWidth/window.innerHeight, 0.3, 780);
scene.add(camera);   /* camera hosts the first-person weapon (v7) */
camera.position.set(0,10,40);

var hemi = new THREE.HemisphereLight(0xd6e4f2, 0x67743f, 0.55);   /* sun + sky sum to ~1.25 at noon: walls keep their shading, roofs keep their colour */
scene.add(hemi);
var sun = new THREE.DirectionalLight(0xffe7bd, 0.95);
sun.position.set(70,95,45);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left=-90; sun.shadow.camera.right=90;
sun.shadow.camera.top=90; sun.shadow.camera.bottom=-90;
sun.shadow.camera.near=10; sun.shadow.camera.far=320;
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.02;
scene.add(sun);
scene.add(sun.target);

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

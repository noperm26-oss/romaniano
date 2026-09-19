/* ---------------- particles ---------------- */
var particles=[];
(function(){
  for(var i=0;i<160;i++){
    var s=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffffff, transparent:true, opacity:0, depthWrite:false}));
    s.scale.set(0.14,0.14,1);
    s.visible=false; scene.add(s);
    s.name='fx';
    particles.push({s:s, vel:new THREE.Vector3(), life:0});
  }
})();
var particleIdx=0;
function spawnParticles(pos, colorHex, n, spread, up){
  for(var i=0;i<n;i++){
    var p=particles[particleIdx]; particleIdx=(particleIdx+1)%particles.length;
    p.s.visible=true;
    p.s.material.color.setHex(colorHex);
    p.s.material.opacity=0.95;
    p.s.position.set(pos.x+rand(-0.2,0.2), pos.y+rand(-0.2,0.2), pos.z+rand(-0.2,0.2));
    p.vel.set(rand(-spread,spread), rand(up*0.5,up), rand(-spread,spread));
    p.life=rand(0.35,0.6);
  }
}
function updateParticles(dt){
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    if(p.life<=0) continue;
    p.life-=dt;
    if(p.life<=0){ p.s.visible=false; p.s.material.opacity=0; continue; }
    p.s.position.x+=p.vel.x*dt; p.s.position.y+=p.vel.y*dt; p.s.position.z+=p.vel.z*dt;
    p.vel.y-=9*dt;
    p.s.material.opacity=Math.min(0.95, p.life*2.2);
  }
}

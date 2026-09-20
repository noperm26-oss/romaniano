/* ============================================================
   flags.js — capture flags CMP-xx (§11.1) and signal beacons SB-xx (§4.9)
   ------------------------------------------------------------
   A flag is a stone base, a 7 m pole and a live cloth that shows the
   banner of whoever owns the zone the flag stands in (zones[] of
   strategy.js).  When ownership flips the cloth is lowered and raised
   again (AN-16).  Beacons are iron fire baskets whose flame takes the
   owner's colour at night.  Both register lore and a structure entry.
   Capture itself stays in strategy.js (captureTick) — these are the
   visible truth of the zone map, not a second capture system.
   ============================================================ */
var FLAG_PARTS=[], BEACON_PARTS=[];
function flagSpot(x,z,r){
  for(var k=0;k<40;k++){ var a=k*2.4, d=k*0.9, px=x+Math.cos(a)*d, pz=z+Math.sin(a)*d; if(aFree(px,pz,r)) return {x:px,z:pz}; }
  return null;
}
function buildFlags(){
  FLAGS.forEach(function(F,i){
    var sp=flagSpot(F.x,F.z,1.4); if(!sp) return;
    var x=sp.x, z=sp.z, y=groundH(x,z), kit=cellKit(x,z);
    kit.cyln(M2(0x8f8a80),1.2,1.4,0.6,8, x,y+0.3,z); kit.cyln(M2(0x7d7669),0.9,1.0,0.5,8, x,y+0.85,z);
    kit.cyln(M2(0x4a3520),0.09,0.12,7.2,7, x,y+1.1+3.6,z); kit.cyln(M2(0xc9a227),0.14,0.05,0.4,7, x,y+8.5,z);
    addCollider(x-0.7,z-0.7,x+0.7,z+0.7);
    var cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2,5,3), new THREE.MeshLambertMaterial({map:plainBannerTex(0x8a8a7a), side:THREE.DoubleSide}));
    cloth.position.set(x+0.95, y+7.6, z); cloth.name='flag'; (PROP_PARENT||scene).add(cloth);
    var part={kind:'flag', id:F.id, name:F.name, x:x, y:y, z:z, zi:zoneIdxAt(x,z), m:cloth, owner:undefined, raise:1, top:y+7.6, ph:i*0.7};
    ANIM_PARTS.push(part); FLAG_PARTS.push(part);
    regStructure({name:F.name+' ('+F.id+')', kind:'flag', x:x, z:z, hx:0.7, hz:0.7, enterable:false});
    registerLore({key:'flag_'+F.id, x:x, z:z, r:16, icon:'🚩', name:F.name, sub:'Capture flag '+F.id, story:'Hold this ground with your soldiers and the banner changes to your colours; the zone\'s income, workers and defence follow the flag.'});
  });
}
function buildBeacons(){
  BEACON_DEF.forEach(function(B){
    var sp=flagSpot(B.x,B.z,1.8); if(!sp) return;
    var x=sp.x, z=sp.z, y=groundH(x,z), kit=cellKit(x,z), I=M2(0x50565e);
    kit.cyln(M2(0x8f8a80),1.6,1.9,1.0,8, x,y+0.5,z); kit.cyln(M2(0x7d7669),1.2,1.4,0.6,8, x,y+1.3,z);
    kit.box(M2(0x5d4326),0.34,4.6,0.34, x,y+3.9,z);
    kit.cyln(I,0.8,0.5,0.9,8, x,y+6.5,z); for(var k=0;k<6;k++){ var a=k/6*TAU; kit.box(I,0.08,1.0,0.08, x+Math.cos(a)*0.72, y+6.7, z+Math.sin(a)*0.72); }
    kit.box(M2(0x6b4f2e),0.5,0.5,0.5, x+1.4,y+1.85,z+0.3); kit.box(M2(0x6b4f2e),0.5,0.5,0.5, x+1.1,y+1.85,z-0.6);
    addCollider(x-1.0,z-1.0,x+1.0,z+1.0);
    var f=addFlame(x,y+7.3,z,1.9); f.material=f.material.clone();
    var part={kind:'beacon', id:B.id, name:B.name, x:x, y:y, z:z, zi:zoneIdxAt(x,z), f:f, owner:undefined};
    ANIM_PARTS.push(part); BEACON_PARTS.push(part);
    regStructure({name:B.name+' ('+B.id+')', kind:'beacon', x:x, z:z, hx:1.0, hz:1.0, enterable:false});
    registerLore({key:'beacon_'+B.id, x:x, z:z, r:18, icon:'🔥', name:B.name, sub:'Signal beacon '+B.id, story:'One of the fires of the signal chain Stânca → Frostwind → Sf. Andrei → Ardealburg → Romaria. At night it burns in the colours of whoever holds the ground.'});
  });
}

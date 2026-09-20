/* ============================================================
   animations/buildings.js — buildings that live
   ------------------------------------------------------------
   • doors swing open for anyone who walks up and close behind them
   • windows glow at dusk (shared pane material), a pooled set of
     point lights follows the player between torches and hearths
   • chimneys smoke, forges spark, the mill wheel turns and splashes,
     bells swing on the hour, drums thump in the war camp,
     fountains and waterfalls spray
   Pure presentation: reads world state, changes nothing in it.
   ============================================================ */
var BLD={lights:[], lightT:0, smoke:[], smokeIdx:0, smokeT:0, doorT:0, near:[], bellT:0, made:false, splashT:0};
function bldInit(){
  if(BLD.made) return; BLD.made=true;
  for(var i=0;i<8;i++){ var L=new THREE.PointLight(0xff9a3c, 0, 18, 2); L.name='fx'; L.visible=false; scene.add(L); BLD.lights.push(L); }
  var tex=canvasTex(32,32,function(g){ var gr=g.createRadialGradient(16,16,2,16,16,16); gr.addColorStop(0,'rgba(255,255,255,0.9)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,32,32); });
  for(var s=0;s<140;s++){ var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex, color:0x9a9a9a, transparent:true, opacity:0, depthWrite:false})); sp.visible=false; sp.name='fx'; scene.add(sp); BLD.smoke.push({s:sp, life:0, max:1, vx:0, vy:0, vz:0, grow:1}); }
  /* bells and drums get their meshes here (registered as points by the builders) */
  ANIM_PARTS.forEach(function(p){
    if(p.kind==='bell' && !p.g){
      var g=new THREE.Group(); g.position.set(p.x,p.y,p.z);
      var bell=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.7,1.0,10), M(0xb08d3a)); bell.position.y=-0.6; g.add(bell);
      var clapper=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,5), M(0x3d3d42)); clapper.position.y=-1.15; g.add(clapper);
      var yoke=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.2,0.3), M(0x5d4326)); g.add(yoke);
      scene.add(g); p.g=g; p.ph=Math.random()*40;
    }
    if(p.kind==='windmill' && !p.g){
      var wm=new THREE.Group(); wm.position.set(p.x,p.y,p.z);
      for(var si=0;si<4;si++){ var arm=new THREE.Mesh(new THREE.BoxGeometry(0.16,p.r,0.16), M(0x5d4326)); arm.position.y=p.r/2; var sail=new THREE.Mesh(new THREE.BoxGeometry(1.3,p.r*0.75,0.05), M(0xe8e0cf)); sail.position.set(0.75,p.r*0.58,0);
        var hold=new THREE.Group(); hold.add(arm); hold.add(sail); hold.rotation.z=si*Math.PI/2; wm.add(hold); }
      var hub=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.6,8), M(0x3a2a1a)); hub.rotation.x=Math.PI/2; wm.add(hub);
      scene.add(wm); p.g=wm; p.ph=Math.random()*6;
    }
    if(p.kind==='shadoof' && !p.g){
      var sd=new THREE.Group(); sd.position.set(p.x,p.y,p.z); sd.rotation.y=p.ry||0;
      var beam=new THREE.Mesh(new THREE.BoxGeometry(6.4,0.2,0.2), M(0x5d4326)); beam.position.x=0.6; sd.add(beam);
      var wt=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6), M(0x8f8a80)); wt.position.x=-2.4; sd.add(wt);
      var rope=new THREE.Mesh(new THREE.BoxGeometry(0.04,3.4,0.04), M(0x3a3430)); rope.position.set(3.6,-1.7,0); sd.add(rope);
      var bucket=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.22,0.4,8), M(0x6b4f2e)); bucket.position.set(3.6,-3.4,0); sd.add(bucket);
      scene.add(sd); p.g=sd; p.ph=Math.random()*6;
    }
    if(p.kind==='winch' && !p.g){
      var wn=new THREE.Group(); wn.position.set(p.x,p.y,p.z);
      var spool=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,1.6,10), M(0x6b4f2e)); spool.rotation.z=Math.PI/2; wn.add(spool);
      var handle=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.8,0.1), M(0x50565e)); handle.position.set(0.95,0.3,0); wn.add(handle);
      var rope2=new THREE.Mesh(new THREE.BoxGeometry(0.05,2.2,0.05), M(0x3a3430)); rope2.position.set(0,-1.1,0.32); wn.add(rope2);
      scene.add(wn); p.g=wn;
    }
    if(p.kind==='drum' && !p.g){
      var d=new THREE.Group(); d.position.set(p.x,p.y,p.z);
      var drum=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.7,12), M(0x7a3434)); d.add(drum);
      var skin=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.62,0.06,12), M(0xe8e0cf)); skin.position.y=0.36; d.add(skin);
      var stick=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.9), M(0x5d4326)); stick.position.set(0.2,0.9,0.3); d.add(stick); d.userData.stick=stick;
      scene.add(d); p.g=d; p.ph=Math.random()*3;
    }
  });
}
function bldPuff(x,y,z,col,size,life,vy,vx,vz){
  var p=BLD.smoke[BLD.smokeIdx]; BLD.smokeIdx=(BLD.smokeIdx+1)%BLD.smoke.length;
  p.s.visible=true; p.s.material.color.setHex(col); p.s.material.opacity=0.0;
  p.s.position.set(x,y,z); p.s.scale.set(size,size,1); p.life=life; p.max=life; p.vx=vx||0; p.vy=vy; p.vz=vz||0; p.grow=1+0.9/life;
}
function updateBuildings(dt){
  bldInit();
  var px=player?player.group.position.x:camera.position.x, pz=player?player.group.position.z:camera.position.z, py=player?player.group.position.y:0;
  var i, t=gameTime||0;
  /* ---- doors ---- */
  BLD.doorT-=dt;
  if(BLD.doorT<=0){
    BLD.doorT=0.35; BLD.near.length=0;
    for(i=0;i<DOORS.length;i++){ var D=DOORS[i], dx=D.x-px, dz=D.z-pz; if(dx*dx+dz*dz<110*110) BLD.near.push(D); }
  }
  for(i=0;i<BLD.near.length;i++){
    var D=BLD.near[i], want=0;
    var ddx=D.x-px, ddz=D.z-pz;
    if(ddx*ddx+ddz*ddz<2.6*2.6) want=1;
    else if(typeof eqNear==='function' && EH.map.size){ if(eqNear(D.x,D.z,2.2,function(e){ return !e.dead; })) want=1; }
    if(want!==D.open){ D.open+=(want-D.open)*Math.min(1,dt*3.2); if(Math.abs(D.open-want)<0.02) D.open=want; }
    var ang=D.base+D.open*D.swing;
    if(D.g.rotation.y!==ang) D.g.rotation.y=ang;
  }
  /* ---- windows glow, lights follow ---- */
  var night=DN.night;
  PANE_MAT.emissiveIntensity=0.85*Math.pow(night,0.8);
  BLD.lightT-=dt;
  if(BLD.lightT<=0){
    BLD.lightT=0.3;
    var picks=[];
    for(i=0;i<LIGHT_SRC.length;i++){ var Ls=LIGHT_SRC[i], lx=Ls.x-px, lz=Ls.z-pz, d2=lx*lx+lz*lz; if(d2<70*70){ picks.push({s:Ls, d:d2}); } }
    picks.sort(function(a,b){ return a.d-b.d; });
    for(i=0;i<BLD.lights.length;i++){
      var L=BLD.lights[i];
      if(i<picks.length){ var S=picks[i].s; L.position.set(S.x,S.y,S.z); L.color.setHex(S.color); L.distance=S.dist; L.userData.src=S; L.visible=true; }
      else { L.visible=false; L.userData.src=null; }
    }
  }
  for(i=0;i<BLD.lights.length;i++){
    var Lp=BLD.lights[i], src=Lp.userData.src; if(!src) continue;
    var fl=src.flicker?(0.82+Math.sin(t*11+i*1.7)*0.12+Math.sin(t*23+i)*0.06):1;
    Lp.intensity=src.base*(0.35+0.85*night)*fl*1.6;
  }
  /* ---- smoke, sparks, water ---- */
  BLD.smokeT-=dt;
  if(BLD.smokeT<=0){
    BLD.smokeT=0.16;
    var n=0;
    for(i=0;i<CHIMNEYS.length && n<14;i++){ var C=CHIMNEYS[i], cx=C.x-px, cz=C.z-pz; if(cx*cx+cz*cz<95*95){ if(Math.random()<C.rate*0.7){ bldPuff(C.x,C.y,C.z,night>0.5?0x6a6a70:0xa8a8ac,0.7+Math.random()*0.4,2.8+Math.random(),0.55,0.25+Math.random()*0.2,0.1); n++; } } }
  }
  for(i=0;i<BLD.smoke.length;i++){
    var q=BLD.smoke[i]; if(q.life<=0) continue;
    q.life-=dt; if(q.life<=0){ q.s.visible=false; q.s.material.opacity=0; continue; }
    var k=q.life/q.max;
    q.s.position.x+=q.vx*dt; q.s.position.y+=q.vy*dt; q.s.position.z+=q.vz*dt;
    q.s.scale.x+=q.grow*dt*0.6; q.s.scale.y+=q.grow*dt*0.6;
    q.s.material.opacity=Math.min(0.55, (1-k)*2.2)*k;
  }
  /* ---- moving parts ---- */
  BLD.splashT-=dt;
  for(i=0;i<ANIM_PARTS.length;i++){
    var P=ANIM_PARTS[i], ax=P.x-px, az=P.z-pz, ad2=ax*ax+az*az;
    if(ad2>160*160) continue;
    if(P.kind==='spin'){ P.g.rotation[P.axis||'y']+=P.rate*dt; if(P.splash && BLD.splashT<=0 && ad2<80*80) bldPuff(P.splash.x+(Math.random()-0.5)*2.5, P.splash.y, P.splash.z+(Math.random()-0.5), 0xdff0ff, 0.5, 0.7, 1.2, (Math.random()-0.5)*0.6, 0.3); }
    else if(P.kind==='hammer'){ var s=Math.sin(t*5.5+P.ph); P.g.rotation.x=-0.9+Math.max(0,s)*0.95; if(s>0.985 && ad2<60*60){ for(var k2=0;k2<3;k2++) bldPuff(P.anvil.x+(Math.random()-0.5)*0.4, P.y+0.2, P.anvil.z+(Math.random()-0.5)*0.4, 0xffb347, 0.12, 0.35, 1.8, (Math.random()-0.5)*2.4, (Math.random()-0.5)*2.4); } }
    else if(P.kind==='bell'){ var cyc=(t+P.ph)%75; if(cyc<6){ P.g.rotation.z=Math.sin(cyc*5.2)*0.55*(1-cyc/6); } else if(P.g.rotation.z!==0) P.g.rotation.z*=0.9; }
    else if(P.kind==='drum'){ var b=Math.abs(Math.sin(t*4.2+P.ph)); P.g.userData.stick.rotation.x=-0.6+b*0.8; }
    else if(P.kind==='fountain'){ if(BLD.splashT<=0) bldPuff(P.x+(Math.random()-0.5)*0.4, P.y, P.z+(Math.random()-0.5)*0.4, 0xdff0ff, 0.35, 0.9, 1.6, (Math.random()-0.5)*1.4, (Math.random()-0.5)*1.4); }
    else if(P.kind==='splash'){ if(BLD.splashT<=0) bldPuff(P.x+(Math.random()-0.5)*3, P.y, P.z+(Math.random()-0.5), 0xeaf6ff, 0.9, 1.1, 0.9, (Math.random()-0.5)*0.8, 0.4); }
    else if(P.kind==='windmill'){ P.g.rotation.z-=P.rate*dt*(0.8+0.2*Math.sin(t*0.3+P.ph)); }
    else if(P.kind==='shadoof'){ P.g.rotation.z=Math.sin(t*0.7+P.ph)*0.32; }
    else if(P.kind==='winch'){ P.g.rotation.x+=dt*1.4; }
    else if(P.kind==='flag'){ if(P.raise<1){ P.raise=Math.min(1,P.raise+dt*0.55); } P.m.position.y=P.y+2.2+(P.top-P.y-2.2)*P.raise; P.m.rotation.y=Math.sin(t*1.7+P.ph)*0.25; }
    else if(P.kind==='waterfall'){ var arr=P.g.geometry.attributes.position.array; for(var vi=0;vi<arr.length;vi+=3){ arr[vi+2]=Math.sin(t*6+arr[vi+1]*1.3+arr[vi]*0.7)*0.18; } P.g.geometry.attributes.position.needsUpdate=true; }
  }
  if(BLD.splashT<=0) BLD.splashT=0.09;
  /* flags and beacons follow zone ownership (AN-16: lower, swap the banner, raise) */
  BLD.ownT=(BLD.ownT||0)-dt;
  if(BLD.ownT<=0 && typeof zones!=='undefined' && zones.length){
    BLD.ownT=0.5;
    for(i=0;i<FLAG_PARTS.length;i++){ var FP=FLAG_PARTS[i], own=zones[FP.zi]?zones[FP.zi].owner:null;
      if(own!==FP.owner){ FP.owner=own; FP.m.material.map=(own&&FACS[own]&&FACS[own].bannerTex)?FACS[own].bannerTex:plainBannerTex(0x8a8a7a); FP.m.material.needsUpdate=true; FP.raise=FP.owner===undefined?1:0; } }
    for(i=0;i<BEACON_PARTS.length;i++){ var BP=BEACON_PARTS[i], own2=zones[BP.zi]?zones[BP.zi].owner:null;
      if(own2!==BP.owner){ BP.owner=own2; var col=(own2&&FACS[own2]&&FACS[own2].bannerBg)?new THREE.Color(FACS[own2].bannerBg):new THREE.Color(0xffc14d); BP.f.material.color.copy(col).lerp(new THREE.Color(0xffc14d),0.35); } }
  }
  /* water shimmer */
  if(WATER_MAT && WATER_MAT.map){ WATER_MAT.map.offset.x=(WATER_MAT.map.offset.x+dt*0.012)%1; WATER_MAT.map.offset.y=(WATER_MAT.map.offset.y+dt*0.007)%1; }
}

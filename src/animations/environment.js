function updateAmbient(dt){
  fireT+=dt;
  cullTimer-=dt;
  if(cullTimer<=0){ cullTimer=0.4; cullTick(); }
  var f=scenery.fire;
  if(f){
    var fl=0.85+Math.sin(fireT*11)*0.18+Math.sin(fireT*23+1)*0.12;
    f.flame.scale.set(0.9+fl*0.15, fl, 0.9+fl*0.15);
    f.flame2.scale.set(1, 0.8+fl*0.3, 1);
  }
  for(var i=0;i<flames.length;i++){
    var fm=flames[i];
    var fs=0.85+Math.sin(fireT*9+i*1.7)*0.18+Math.sin(fireT*19+i)*0.1;
    fm.scale.set(0.9+fs*0.12, fs, 0.9+fs*0.12);
  }
  for(var ci=0; ci<clouds.length; ci++){
    clouds[ci].position.x+=dt*0.8;
    if(clouds[ci].position.x>1000) clouds[ci].position.x=-1000;
  }
  /* ---- day / night ---- */
  DN.t=(DN.t+dt/280)%1;
  var sunAng=(DN.t-0.25)*TAU;
  var sunH=Math.sin(sunAng);
  var dayF=clamp(sunH+0.12,0,1);
  DN.night=1-clamp(sunH+0.06,0,1);
  var fx0=player?player.group.position.x:0, fz0=player?player.group.position.z:0;
  sun.position.set(fx0+Math.cos(sunAng)*160, Math.max(20,sunH*220+30), fz0+70);
  sun.target.position.set(fx0,0,fz0);
  sun.intensity=0.06+0.9*dayF;
  hemi.intensity=0.13+0.45*dayF;
  sun.color.setHex(0xffe7bd); sun.color.lerp(skyDawn, clamp(1-dayF*1.7,0,1)*0.55);
  skyTmp.copy(skyNight).lerp(skyDay, dayF);
  skyTmp.lerp(skyDawn, clamp(1-Math.abs(dayF-0.3)*3.4,0,1)*0.4);
  scene.background.copy(skyTmp);
  scene.fog.color.copy(skyTmp);
  skySun.position.set(fx0+Math.cos(sunAng)*620, sunH*300+90, fz0-240);
  skyMoon.position.set(fx0-Math.cos(sunAng)*620, -sunH*300+90, fz0+240);
  skySun.visible=sunH>-0.14; skyMoon.visible=sunH<0.14;
  starMat.opacity=DN.night*0.9;
  stars.position.set(fx0,0,fz0);
  for(var li=0;li<nightLights.length;li++){
    var nl=nightLights[li];
    nl.intensity=(nl.userData.base||0.8)*(0.16+0.95*DN.night);
  }
  /* ---- banners ripple in the wind ---- */
  for(var wi=0;wi<waveBanners.length;wi++){
    var wb=waveBanners[wi];
    if(!wb.base) wb.base=wb.m.geometry.attributes.position.array.slice();
    var arr=wb.m.geometry.attributes.position.array, base=wb.base, tm=gameTime*2.6+wb.ph;
    var hw=wb.m.geometry.parameters.width/2;
    for(var vi=0;vi<arr.length;vi+=3){
      var bx=base[vi], by=base[vi+1];
      var k=(bx+hw)/(hw*2);
      arr[vi+2]=Math.sin(tm+bx*1.8+by*0.6)*0.16*k + Math.sin(tm*1.7+by)*0.04*k;
    }
    wb.m.geometry.attributes.position.needsUpdate=true;
  }
  /* ---- wildlife ---- */
  updateCritters(dt);
  /* ---- doors, lights, smoke, wheels, bells ---- */
  updateBuildings(dt);
}

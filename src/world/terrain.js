/* ---------------- terrain — ROMANIAN MEDIEVAL WAR WORLD EXTENDED ---------------- */
(function buildGround(){
  var size=WORLD.half*2+400;
  var geo = new THREE.PlaneGeometry(size,size,200,200);
  geo.rotateX(-Math.PI/2);
  var pos = geo.attributes.position;
  var colors = new Float32Array(pos.count*3);
  /* palette per region — extended edition */
  var pal = {
    carpathian: {base:new THREE.Color(0x8a9aa8), snow:new THREE.Color(0xe8f0f8), pine:new THREE.Color(0x2f4a2e), rock:new THREE.Color(0x7a7a82)},
    transylvanian:{base:new THREE.Color(0x7ea04a), wheat:new THREE.Color(0xc9b24a), vine:new THREE.Color(0x6b8f3a), road:new THREE.Color(0x9a8555)},
    wallachian:{base:new THREE.Color(0x8aa85a), grass:new THREE.Color(0x6a8a3a), marsh:new THREE.Color(0x5a6a4a), mud:new THREE.Color(0x7a6a4a)},
    moldavian:{base:new THREE.Color(0x6b8f4a), forest:new THREE.Color(0x3a5a2e), rocky:new THREE.Color(0x7a7a6a), river:new THREE.Color(0x4a6a7a)},
    trade_route:{base:new THREE.Color(0xa4905f), dust:new THREE.Color(0xc2b08a), dry:new THREE.Color(0x9a8a6a), well:new THREE.Color(0x8a7a5e)},
    capital:{base:new THREE.Color(0x8a9a6a), stone:new THREE.Color(0x9a9a8a), boulevard:new THREE.Color(0x8a8070), garden:new THREE.Color(0x6a8a5a)},
    battlefield:{base:new THREE.Color(0x7a8a5a), scar:new THREE.Color(0x6e5f43), burned:new THREE.Color(0x5a4a3a)}
  };
  var cA=new THREE.Color(0x71983f), cB=new THREE.Color(0x8fae52), cC=new THREE.Color(0x5c7f3b), cD=new THREE.Color(0x9a8555);
  var scar=new THREE.Color(0x6e5f43), dust=new THREE.Color(0xa4905f);
  var tmp=new THREE.Color();
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i, groundH(x,z));
    var region = getRegion(x,z);
    var n=Math.sin(x*0.13+z*0.17)*0.5+Math.sin(x*0.031-z*0.043)*0.5;
    var h = groundH(x,z);
    if(region==='carpathian'){
      tmp.copy(pal.carpathian.base);
      // snow caps
      if(h>8) tmp.lerp(pal.carpathian.snow, clamp((h-8)/8,0,1)*0.85);
      else if(h>4) tmp.lerp(pal.carpathian.rock, 0.3);
      // pine forest noise
      if(n>0.2) tmp.lerp(pal.carpathian.pine, 0.25);
      // frozen lakes
      if(Math.sin(x*0.008+z*0.009)>0.85 && h<3) tmp.lerp(new THREE.Color(0x8ab4d0),0.35);
      // avalanche scars
      if(Math.sin(x*0.05)*Math.cos(z*0.07)>0.75) tmp.lerp(pal.carpathian.rock,0.2);
    } else if(region==='transylvanian'){
      tmp.copy(pal.transylvanian.base);
      tmp.lerp(pal.transylvanian.wheat, clamp(n*0.5+0.3,0,0.6));
      if(Math.sin(x*0.02+z*0.015)>0.6) tmp.lerp(pal.transylvanian.vine,0.25);
      // cobblestone roads hint
      var roadD=1e9;
      for(var rk=0; rk<FAC_KEYS_T.length; rk++){
        var T0=TOWNS[FAC_KEYS_T[rk]];
        roadD=Math.min(roadD, distToSeg(x,z, T0.x,T0.z, 0,0));
      }
      if(roadD<28) tmp.lerp(pal.transylvanian.road, (1-roadD/28)*0.6);
    } else if(region==='wallachian'){
      tmp.copy(pal.wallachian.base);
      if(n<-0.3) tmp.lerp(pal.wallachian.marsh,0.35);
      if(Math.sin(x*0.04)*Math.cos(z*0.03)>0.6) tmp.lerp(pal.wallachian.mud,0.25);
      tmp.lerp(pal.wallachian.grass, 0.15*Math.sin(x*0.01+z*0.01)+0.15);
      // reeds near rivers
      if(Math.abs(x)<400 && z>0) tmp.lerp(pal.wallachian.marsh,0.2);
    } else if(region==='moldavian'){
      tmp.copy(pal.moldavian.base);
      if(n>0.4) tmp.lerp(pal.moldavian.forest,0.45);
      if(h>5) tmp.lerp(pal.moldavian.rocky,0.3);
      if(Math.sin(x*0.015+z*0.02)>0.7) tmp.lerp(pal.moldavian.river,0.15);
      // wolf dens, fallen logs
      if(Math.sin(x*0.07+z*0.05)>0.8) tmp.lerp(pal.moldavian.rocky,0.15);
    } else if(region==='trade_route'){
      tmp.copy(pal.trade_route.base);
      tmp.lerp(pal.trade_route.dust, 0.5+0.3*Math.sin(x*0.01));
      if(n<-0.5) tmp.lerp(pal.trade_route.dry,0.3);
      // dusty road central
      var rd = Math.abs(z-2500);
      if(rd<40) tmp.lerp(pal.trade_route.dust, (1-rd/40)*0.85);
      if(rd<15) tmp.lerp(pal.trade_route.base,0.2);
    } else if(region==='capital'){
      tmp.copy(pal.capital.base);
      var ds=Math.sqrt(x*x+z*z);
      if(ds<520){
        tmp.lerp(pal.capital.stone, 0.35*(1-ds/520));
        if(Math.sin(x*0.08)*Math.cos(z*0.08)>0.5) tmp.lerp(pal.capital.boulevard,0.25);
      }
      if(ds<300 && Math.sin(x*0.04+z*0.03)>0.6) tmp.lerp(pal.capital.garden,0.2);
      // wide boulevards
      if(Math.abs(x)<30 || Math.abs(z)<30) tmp.lerp(pal.capital.boulevard,0.4);
    } else {
      // battlefield / default
      tmp.copy(pal.battlefield.base);
      tmp.lerp(pal.battlefield.scar, 0.2+0.2*Math.sin(x*0.02+z*0.02));
      if(Math.sin(x*0.05+z*0.07)>0.75 && Math.random()<0.1) tmp.lerp(pal.battlefield.burned,0.3);
      var ds2=Math.sqrt(x*x+z*z);
      if(ds2<430){
        var sf=1-ds2/430;
        tmp.lerp(scar, sf*0.7*(0.6+0.4*Math.sin(x*0.05+z*0.07)));
        if(sf>0.75 && Math.sin(x*0.4)*Math.cos(z*0.5)>0.55) tmp.lerp(dust,0.4);
      }
    }
    /* ancient highways: every homeland is connected to Romaria capital */
    var roadD2=1e9;
    for(var rk2=0; rk2<FAC_KEYS_T.length; rk2++){
      var T02=TOWNS[FAC_KEYS_T[rk2]];
      roadD2=Math.min(roadD2, distToSeg(x,z, T02.x,T02.z, 0,0));
    }
    if(roadD2<24){
      var rf=1-clamp((roadD2-10)/14,0,1);
      tmp.lerp(dust, rf*0.85);
      tmp.lerp(scar, rf*0.25);
    }
    /* trade route dusty road east-west */
    if(region==='trade_route' || (z>1800 && z<2700)){
      var tradeRoad = Math.abs(z-2500);
      if(tradeRoad<18){
        tmp.lerp(dust, (1-tradeRoad/18)*0.9);
      }
    }
    colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var ground=new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors:true}));
  ground.receiveShadow=true;
  ground.name='always';
  scene.add(ground);
})();

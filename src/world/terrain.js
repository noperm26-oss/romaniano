/* ---------------- terrain (vast) ---------------- */
(function buildGround(){
  var size=WORLD.half*2+400;
  var geo = new THREE.PlaneGeometry(size,size,170,170);
  geo.rotateX(-Math.PI/2);
  var pos = geo.attributes.position;
  var colors = new Float32Array(pos.count*3);
  var cA=new THREE.Color(0x71983f), cB=new THREE.Color(0x8fae52), cC=new THREE.Color(0x5c7f3b), cD=new THREE.Color(0x9a8555);
  var scar=new THREE.Color(0x6e5f43), dust=new THREE.Color(0xa4905f);
  var tmp=new THREE.Color();
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i, groundH(x,z));
    var n=Math.sin(x*0.13+z*0.17)*0.5+Math.sin(x*0.031-z*0.043)*0.5;
    tmp.copy(cA).lerp(cB, n*0.5+0.5);
    if(n<-0.55) tmp.lerp(cC,0.5);
    /* the great scarred field at the world's heart */
    var ds=Math.sqrt(x*x+z*z);
    if(ds<430){
      var sf=1-ds/430;
      tmp.lerp(scar, sf*0.7*(0.6+0.4*Math.sin(x*0.05+z*0.07)));
      if(sf>0.75 && Math.sin(x*0.4)*Math.cos(z*0.5)>0.55) tmp.lerp(dust,0.4);
    }
    /* ancient highways: every homeland is connected to the heart of the world */
    var roadD=1e9;
    for(var rk=0; rk<FAC_KEYS_T.length; rk++){
      var T0=TOWNS[FAC_KEYS_T[rk]];
      roadD=Math.min(roadD, distToSeg(x,z, T0.x,T0.z, 0,0));
    }
    if(roadD<24){
      var rf=1-clamp((roadD-10)/14,0,1);
      tmp.lerp(dust, rf*0.85);
      tmp.lerp(scar, rf*0.25);
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

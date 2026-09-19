/* ---------------- districts (v8): farms, mines, markets, caves, ruins — instanced ---------------- */
var SITES=[];
var zoneSiteRate=null;
var DISTRICT_C=[];
var LMS=[[575,850],[915,570],[990,705],[635,950],[805,710],[710,680],[580,-850],[-580,-850],[-580,850],[-465,-2080],[465,2080],[0,0]];
(function(){
  for(var i=0;i<260;i++){
    if(DISTRICT_C.length>=150) break;
    var a=i*2.39996, r=200+Math.pow((i%65)/65,0.72)*2650;
    var x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(x*x+z*z<560*560) continue;
    if(Math.abs(x)>2920||Math.abs(z)>2920) continue;
    var bad=false;
    FAC_KEYS_T.forEach(function(fk){
      var T=TOWNS[fk];
      if((x-T.x)*(x-T.x)+(z-T.z)*(z-T.z)<300*300) bad=true;
    });
    for(var v=0;v<VILLAGES.length;v++){ var V=VILLAGES[v];
      if((x-V.x)*(x-V.x)+(z-V.z)*(z-V.z)<100*100) bad=true; }
    for(var L=0;L<LMS.length;L++){ if((x-LMS[L][0])*(x-LMS[L][0])+(z-LMS[L][1])*(z-LMS[L][1])<110*110) bad=true; }
    for(var d=0;d<DISTRICT_C.length;d++){ var D=DISTRICT_C[d];
      if((x-D.x)*(x-D.x)+(z-D.z)*(z-D.z)<150*150) bad=true; }
    if(!bad) DISTRICT_C.push({x:x, z:z});
  }
})();
function buildDistricts(){
  var wallMats=[], wallCols=[], roofMats=[], roofCols=[], cylMats=[], moundMats=[], darkMats=[], flatMats=[], flatCols=[];
  var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), eu=new THREE.Euler(), v3=new THREE.Vector3(), s3=new THREE.Vector3();
  function pushM(arr,x,y,z,ry,sx,sy,sz){ eu.set(0,ry||0,0); q.setFromEuler(eu); v3.set(x,y,z); s3.set(sx,sy,sz); m4.compose(v3,q,s3); arr.push(m4.clone()); if(arr===wallMats)wallCols.push(0x8a7a5e); if(arr===roofMats)roofCols.push(0x6d5a3e); if(arr===flatMats)flatCols.push(0x7a8f4a); }
  function site(x,z,type,rate){ var zi=zoneIdxAt(x,z); SITES.push({zi:zi, rate:rate, type:type}); }
  DISTRICT_C.forEach(function(D, di){
    var n=42+(di*7)%24;
    for(var b=0;b<n;b++){
      var row=Math.floor(b/8),col=b%8;
      var x=D.x+(col-3.5)*15+(col>=4?6:-6), z=D.z+(row-3.5)*15;
      if(insideSolid(x,z,5.5))continue;
      var y=groundH(x,z), ry=0;
      var roll=(b*29+di*17)%100;
      var hb=choice([0x8a7a5e,0x7a6a50,0x94826a,0x6e6152]), rb=choice([0x6d5a3e,0x5d4a38,0x4a4238]);
      if(roll<40){
        addCollider(x-2.5,z-2,x+2.5,z+2);
        pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=hb;
        pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=rb;
        BUILD_COUNT++;
      } else if(roll<55){
        addCollider(x-3.2,z-2.2,x+3.2,z+2.2);
        pushM(wallMats,x,y+1.6,z,ry,6.5,3.2,4.5); wallCols[wallCols.length-1]=hb;
        pushM(roofMats,x,y+3.9,z,ry+0.78,9.2,1.8,9.2); roofCols[roofCols.length-1]=rb;
        pushM(cylMats,x+4.2,y+2.2,z-2.6,0,1.5,4.4,1.5);
        pushM(flatMats,x-5,y+0.08,z+4,ry,9,1,7); flatCols[flatCols.length-1]=0x7a8f4a;
        BUILD_COUNT++; BUILD_COUNT++;
        site(x,z,'farm',0.08);
      } else if(roll<65){
        addCollider(x-3,z-2.5,x+3,z+2.5);
        pushM(wallMats,x,y+1.7,z,ry,6,3.4,5); wallCols[wallCols.length-1]=hb;
        pushM(flatMats,x,y+3.7,z,ry,7,1,5.6); flatCols[flatCols.length-1]=0xc0272d;
        pushM(wallMats,x+3.6,y+0.9,z+2.6,ry,0.14,1.8,0.14);
        pushM(wallMats,x-3.6,y+0.9,z-2.6,ry,0.14,1.8,0.14);
        BUILD_COUNT++;
        site(x,z,'market',0.15);
      } else if(roll<73){
        addCollider(x-2.7,z-2.2,x+2.7,z+2.2);
        pushM(wallMats,x,y+1.6,z,ry,5.5,3.2,4.5); wallCols[wallCols.length-1]=0x6e6152;
        pushM(cylMats,x+2.2,y+3.4,z,0,0.7,3.6,0.7);
        BUILD_COUNT++;
        site(x,z,'forge',0.12);
      } else if(roll<80){
        pushM(wallMats,x,y+1.4,z,ry,0.22,2.8,0.22);
        pushM(wallMats,x-1.8,y+1.4,z,ry,0.22,2.8,0.22);
        pushM(wallMats,x-0.9,y+2.9,z,ry,2.6,0.24,0.24);
        pushM(moundMats,x,y+1.6,z+2.2,ry,8.4,2.6,7.2);
        BUILD_COUNT++;
        site(x,z,'mine',0.22);
      } else if(roll<85){
        pushM(moundMats,x,y+1.4,z,ry,14,3.4,12);
        pushM(darkMats,x+Math.cos(ry)*3.4,y+1.1,z+Math.sin(ry)*3.4,ry,2.2,2.2,0.6);
        BUILD_COUNT++;
        site(x,z,'cave',0.28);
      } else if(roll<95){
        pushM(wallMats,x,y+0.7,z,ry,4.5,1.4,0.5);
        pushM(wallMats,x+2.4,y+0.9,z+1.4,ry+1.1,0.5,1.8,3.2);
        pushM(moundMats,x-1.5,y+0.3,z-1,0,3.2,0.8,2.8);
        BUILD_COUNT++; BUILD_COUNT++;
      } else {
        addCollider(x-3.7,z-2.7,x+3.7,z+2.7);
        pushM(wallMats,x,y+2,z,ry,7.5,4,5.5); wallCols[wallCols.length-1]=hb;
        pushM(roofMats,x,y+5,z,ry+0.78,11,2.2,11); roofCols[roofCols.length-1]=rb;
        BUILD_COUNT++;
      }
    }
    if(di%9===0){
      registerLore({key:'district'+di, x:D.x, z:D.z, r:70, icon:'🏘️',
        name:'District '+(di+1), sub:'Hamlets, works and wilds',
        story:'A working district — mines and caves ring gold for whoever holds the zone. Markets and forges pay their tithe. Houses shelter the folk who do the real work.'});
    }
  });
  /* ---- v11 ROADS: every village/district connects to its nearest town; houses line the roads ---- */
  window.__roadPts=[];
  var roadMats=[], roadRots=[];
  function layRoad(x0,z0,x1,z1){
    var dx=x1-x0, dz=z1-z0, L=Math.sqrt(dx*dx+dz*dz);
    if(L<30) return;
    var ux=dx/L, uz=dz/L, px=-uz, pz=ux;
    var hop=20;
    for(var s=0;s<L;s+=hop){
      var wx=x0+ux*s, wz=z0+uz*s;
      if(insideSolid(wx,wz,3.5)) continue;            /* weave: skip segments that hit buildings */
      var ry=Math.atan2(ux,uz);
      pushM(roadMats, wx, groundH(wx,wz)+0.06, wz, ry, 5.2,1,hop*1.06);
      roadRots.push(0);
      window.__roadPts.push([wx,wz]);
      /* houses lining the road */
      if(s>60 && s<L-60 && ((s/hop)|0)%3===0 && Math.random()<0.5){
        var side=((s/hop)%2)?1:-1;
        var hx=wx+px*side*11, hz=wz+pz*side*11;
        if(!insideSolid(hx,hz,3.2)){
          var hy=groundH(hx,hz), hr=0;
          var roll=Math.random();
          addCollider(hx-2.5,hz-2,hx+2.5,hz+2);
          if(roll<0.62){
            pushM(wallMats,hx,hy+1.5,hz,hr,5,3,4); wallCols[wallCols.length-1]=choice([0x8a7a5e,0x7a6a50,0x94826a]);
            pushM(roofMats,hx,hy+3.8,hz,hr+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=choice([0x6d5a3e,0x5d4a38]);
          } else {
            pushM(wallMats,hx,hy+1.3,hz,hr,4.6,2.6,3.6); wallCols[wallCols.length-1]=0x6e6152;
            pushM(roofMats,hx,hy+3.1,hz,hr+0.78,6.2,1.5,5.6); roofCols[roofCols.length-1]=0x4a4238;
          }
          BUILD_COUNT++;
        }
      }
    }
  }
  var roadTowns=FAC_KEYS_T.map(function(f){ return TOWNS[f]; });
  /* towns fully connected (greedy chain both ends) */
  for(var ti=0;ti<roadTowns.length-1;ti++) layRoad(roadTowns[ti].x,roadTowns[ti].z,roadTowns[ti+1].x,roadTowns[ti+1].z);
  layRoad(roadTowns[roadTowns.length-1].x,roadTowns[roadTowns.length-1].z,roadTowns[0].x,roadTowns[0].z);
  /* every village + district spur to nearest town */
  function nearestTown(x,z){
    var bt=null, bd=1e18;
    for(var t=0;t<roadTowns.length;t++){
      var T=roadTowns[t], d=(T.x-x)*(T.x-x)+(T.z-z)*(T.z-z);
      if(d<bd){ bd=d; bt=T; }
    }
    return bt;
  }
  VILLAGES.forEach(function(V){ var T=nearestTown(V.x,V.z); layRoad(V.x,V.z,T.x,T.z); });
  DISTRICT_C.forEach(function(D){ var T=nearestTown(D.x,D.z); layRoad(D.x,D.z,T.x,T.z); });

  /* ---- v8.1 WILDS: every zone gets something — no empty green anywhere ---- */
  window.__contentZi={};
  DISTRICT_C.forEach(function(D){ window.__contentZi[zoneIdxAt(D.x,D.z)]=1; });
  VILLAGES.forEach(function(V){ window.__contentZi[zoneIdxAt(V.x,V.z)]=1; });
  LMS.forEach(function(L){ window.__contentZi[zoneIdxAt(L[0],L[1])]=1; });
  [[2000,-2000],[-2000,2000],[0,-2600]].forEach(function(R){ window.__contentZi[zoneIdxAt(R[0],R[1])]=1; });
  var wildsN=0;
  for(var gz=0; gz<ZN; gz++) for(var gx=0; gx<ZN; gx++){
    var zi=gz*ZN+gx;
    if(window.__contentZi[zi]) continue;
    var cx=(gx+0.5)*(6000/ZN)-3000, cz=(gz+0.5)*(6000/ZN)-3000;
    var near=false;
    FAC_KEYS_T.forEach(function(fk){ var T=TOWNS[fk];
      if((cx-T.x)*(cx-T.x)+(cz-T.z)*(cz-T.z)<300*300) near=true; });
    if(!near) for(var v2=0;v2<VILLAGES.length;v2++){ var V2=VILLAGES[v2];
      if((cx-V2.x)*(cx-V2.x)+(cz-V2.z)*(cz-V2.z)<160*160) near=true; }
    if(!near) for(var L2=0;L2<LMS.length;L2++){ if((cx-LMS[L2][0])*(cx-LMS[L2][0])+(cz-LMS[L2][1])*(cz-LMS[L2][1])<140*140) near=true; }
    if(!near) for(var d2=0;d2<DISTRICT_C.length;d2++){ var D2=DISTRICT_C[d2];
      if((cx-D2.x)*(cx-D2.x)+(cz-D2.z)*(cz-D2.z)<200*200) near=true; }
    if(near){ window.__contentZi[zi]=1; continue; }   /* real content within reach — zone counts as filled */
    var jx=cx+(((gz*7+gx*13)%61)-30)*1.7, jz=cz+(((gx*11+gz*5)%61)-30)*1.7;
    var wy=groundH(jx,jz), wr=((gx+gz)%12)*0.5236, wt=(gx*3+gz*5)%6;
    if(wt===0){        /* stone ruin */
      pushM(wallMats,jx,wy+0.8,jz,wr,4.2,1.6,0.6); wallCols[wallCols.length-1]=0x8a8272;
      pushM(wallMats,jx+1.8,wy+1.3,jz+1.2,wr+0.5,0.6,2.6,2.2); wallCols[wallCols.length-1]=0x7a7264;
      addCollider(jx-2.2,jz-1.2,jx+2.8,jz+2.2); BUILD_COUNT++; BUILD_COUNT++;
    } else if(wt===1){ /* roadside shrine */
      pushM(wallMats,jx-0.9,wy+1.1,jz,wr,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
      pushM(wallMats,jx+0.9,wy+1.1,jz,wr,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
      pushM(wallMats,jx,wy+2.3,jz,wr,2.4,0.24,0.3); wallCols[wallCols.length-1]=0x7a5a36;
      BUILD_COUNT++; BUILD_COUNT++; BUILD_COUNT++;
    } else if(wt===2){ /* haystack + barrel */
      pushM(roofMats,jx,wy+1.1,jz,wr,2.6,2.2,2.6); roofCols[roofCols.length-1]=0xc9a83a;
      pushM(cylMats,jx+2,wy+0.55,jz+1,0,0.8,1.1,0.8);
      BUILD_COUNT++; BUILD_COUNT++;
    } else if(wt===3){ /* boulders */
      pushM(moundMats,jx,wy+0.9,jz,wr,3.4,2.2,3);
      pushM(moundMats,jx+2.4,wy+0.6,jz-1.4,wr+1,2.2,1.5,2);
      BUILD_COUNT++; BUILD_COUNT++;
    } else if(wt===4){ /* herder camp: tent + fire patch */
      pushM(roofMats,jx,wy+1.3,jz,wr,3.2,2.6,3.2); roofCols[roofCols.length-1]=0x8f6f4a;
      pushM(flatMats,jx+2.2,wy+0.06,jz+1.6,wr,2.4,1,2.4); flatCols[flatCols.length-1]=0x5a4a38;
      BUILD_COUNT++; BUILD_COUNT++;
    } else {           /* boundary watchstone */
      pushM(wallMats,jx,wy+2.6,jz,wr,1.1,5.2,0.9); wallCols[wallCols.length-1]=0x70685a;
      pushM(moundMats,jx,wy+0.3,jz,0,2.2,0.8,2);
      addCollider(jx-0.8,jz-0.7,jx+0.8,jz+0.7); BUILD_COUNT++; BUILD_COUNT++;
    }
    window.__contentZi[zi]=1; wildsN++;
  }
  window.__wildsN=wildsN;
  function makeIM(geo,mats,mat,cols){
    if(!mats.length)return;
    var buckets=new Map();
    mats.forEach(function(matrix,i){
      var x=Math.floor((matrix.elements[12]+WORLD.half)/375),z=Math.floor((matrix.elements[14]+WORLD.half)/375),key=x+':'+z;
      if(!buckets.has(key))buckets.set(key,{x:x,z:z,items:[]});buckets.get(key).items.push(i);
    });
    var material=mat||M(0xffffff);
    buckets.forEach(function(b){
      var im=new THREE.InstancedMesh(geo,material,b.items.length);
      b.items.forEach(function(original,i){im.setMatrixAt(i,mats[original]);if(cols)im.setColorAt(i,new THREE.Color(cols[original]===undefined?0x8a7a5e:cols[original]));});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
      im.frustumCulled=false;im.name='district-chunk';
      im.userData.cullBounds={x:(b.x+0.5)*375-WORLD.half,z:(b.z+0.5)*375-WORLD.half,r:285};
      scene.add(im);
    });
  }
  makeIM(new THREE.BoxGeometry(1,1,1), wallMats, null, wallCols);
  makeIM(new THREE.ConeGeometry(0.5,1,4), roofMats, null, roofCols);
  makeIM(new THREE.CylinderGeometry(0.5,0.5,1,6), cylMats, NM(0x9a9284));
  makeIM(new THREE.SphereGeometry(0.5,8,6), moundMats, NM(0x77706a));
  makeIM(new THREE.BoxGeometry(1,1,1), darkMats, new THREE.MeshBasicMaterial({color:0x14100c}));
  makeIM(new THREE.BoxGeometry(1,1,1), flatMats, new THREE.MeshLambertMaterial({color:0xffffff}), flatCols);
  makeIM(new THREE.BoxGeometry(1,1,1), roadMats, new THREE.MeshLambertMaterial({color:0x9a815a}), null);   /* v11 roads: 1 draw call */
  zoneSiteRate=new Float32Array(ZN*ZN);
  for(var s=0;s<SITES.length;s++) zoneSiteRate[SITES[s].zi]+=SITES[s].rate;
}

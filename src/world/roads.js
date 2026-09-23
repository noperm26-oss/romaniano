/* ============================================================
   roads.js — the road network as draped ribbons (ROM-MAP-SPEC-003 §4)
   ------------------------------------------------------------
   Every ROADS entry of geography.js (imperial vias, regional drums,
   the trade artery, village lanes, trails) becomes a vertex-coloured
   ribbon that follows the *rendered* terrain triangles exactly, so a
   road never floats or sinks on a slope (engineering rule E4).  Road
   class sets width, colour, kerbs and the +speed bonus (roadSpeedAt).
   Ribbons stop at bridge decks and at ford channels; fords get
   stepping stones (fortifications.js buildBridge).  Furniture: mile
   stones every 250u on R0/R1/R1t, wayside crosses and signposts at
   junctions, wells every 700u on the Caravan Road, lanterns on the
   200u gate approaches, toll arches on RG-04.  window.__roadPts feeds
   settlements and the navigation grid.
   ============================================================ */
function nearTown(x,z,extra){
  for(var i=0;i<FAC_KEYS_T.length;i++){ var T=TOWNS[FAC_KEYS_T[i]], r=(TOWN_RADIUS[FAC_KEYS_T[i]]||150)+(extra||0); if((x-T.x)*(x-T.x)+(z-T.z)*(z-T.z)<r*r) return true; }
  return false;
}
function nearSite(x,z,extra){
  for(var i=0;i<SITES_DEF.length;i++){ var s=SITES_DEF[i], r=s.r+(extra||0); if((x-s.x)*(x-s.x)+(z-s.z)*(z-s.z)<r*r) return true; }
  return false;
}
/* surface a road rides on: the mesh (or a bridge ramp / deck when higher) */
function roadSurfY(x,z){ return Math.max(terrainMeshH(x,z), groundH(x,z)); }

var roadStats={ribbons:0, quads:0, lanes:0, trails:0, milestones:0, crosses:0, signs:0, wells:0, lanterns:0, tolls:0, junctions:0};
var _roadPhase=0;
var _roadJob=null;
var ROAD_JUNCTIONS=[];
function onBridgeDeck(x,z,margin){
  for(var i=0;i<BRIDGES.length;i++){
    var b=BRIDGES[i]; if(b.ford) continue;
    var bx=x-b.x, bz=z-b.z; if(bx*bx+bz*bz>(b.len/2+margin+4)*(b.len/2+margin+4)) continue;
    var c=Math.cos(b.ang), s=Math.sin(b.ang), u=bx*c+bz*s, v=-bx*s+bz*c;
    if(Math.abs(u)<b.len/2+margin && Math.abs(v)<b.w/2+3) return b;
  }
  return null;
}
function inFordWater(x,z){
  var rf=riverField(x,z); if(!rf.river) return false;
  var hw=riverHalfWidth(rf.river,z); if(rf.d>hw+1.5) return false;
  for(var i=0;i<BRIDGES.length;i++){ var b=BRIDGES[i]; if(b.ford && Math.hypot(x-b.x,z-b.z)<hw*2+14) return true; }
  return false;
}
function buildRoads(budget){
  var deadline=budget?performance.now()+budget:0, i;
  if(_roadPhase<1){
  if(!_roadJob){
    window.__roadPts=window.__roadPts||[];
    _roadJob={rnd:srand(4471), cells:new Map(), ri:0, phase:'ribbons'};
  }
  var job=_roadJob, rnd=job.rnd, cells=job.cells, CELL=375;
  var EG=TOWNS.egypt;
  function cellOf(x,z){ var k=Math.floor((x+WORLD.half)/CELL)+':'+Math.floor((z+WORLD.half)/CELL); var c=cells.get(k); if(!c){ c={pos:[],col:[],x:(Math.floor((x+WORLD.half)/CELL)+0.5)*CELL-WORLD.half,z:(Math.floor((z+WORLD.half)/CELL)+0.5)*CELL-WORLD.half}; cells.set(k,c); } return c; }
  function quad(a,b,c,d){ /* a,b = previous section (left,right), c,d = current */
    var cc=cellOf((a[0]+d[0])/2,(a[2]+d[2])/2);
    cc.pos.push(a[0],a[1],a[2], b[0],b[1],b[2], d[0],d[1],d[2],  a[0],a[1],a[2], d[0],d[1],d[2], c[0],c[1],c[2]);
    cc.col.push(a[3],a[4],a[5], b[3],b[4],b[5], d[3],d[4],d[5],  a[3],a[4],a[5], d[3],d[4],d[5], c[3],c[4],c[5]);
    roadStats.quads++;
  }
  function skipAt(x,z){
    if(Math.hypot(x-EG.x,z-EG.z)<172) return true;                 /* Drumul Lung's own streets */
    if(onBridgeDeck(x,z,0.5)) return true;
    if(inFordWater(x,z)) return true;
    return false;
  }
  if(job.phase==='ribbons'){
  for(; job.ri<ROADS.length; job.ri++){
    if(deadline && job.ri && performance.now()>=deadline) return true;
    var R=ROADS[job.ri];
    var P=R.pts, C=ROAD_CLASSES[R.cls], hw=R.w/2, lift=C.y, kerbed=(R.cls==='R0'||R.cls==='R1'||R.cls==='R1t');
    var base=new THREE.Color(R.col).multiplyScalar(0.78), kerb=base.clone().multiplyScalar(0.72), prev=null, k;  /* 0.78: the noon sun + sky light sum to ~1.25 */
    var pi0=0;
    if(job.road && job.road.ri===job.ri){ prev=job.road.prev; pi0=job.road.pi; }
    else { if(R.lane) roadStats.lanes++; else if(R.cls==='R3') roadStats.trails++; roadStats.ribbons++; }
    for(i=pi0;i<P.length;i++){
      if(deadline && i>pi0 && (i&3)===0 && performance.now()>=deadline){ job.road={ri:job.ri, pi:i, prev:prev}; return true; }
      var x=P[i][0], z=P[i][1];
      window.__roadPts.push([x,z]);
      if(skipAt(x,z)){ prev=null; continue; }
      var a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1, nx=-dz/L, nz=dx/L;
      var tone=0.9+0.2*rnd(), col=[base.r*tone,base.g*tone,base.b*tone], kc=[kerb.r*tone,kerb.g*tone,kerb.b*tone];
      var yc=roadSurfY(x,z)+lift, sec=[];
      var offs=kerbed?[-(hw+0.5),-(hw-0.6),(hw-0.6),(hw+0.5)]:[-hw,hw];
      for(k=0;k<offs.length;k++){
        var px=x+nx*offs[k], pz=z+nz*offs[k], py=roadSurfY(px,pz)+lift;
        if(py<yc-0.5) py=yc-0.5; if(py>yc+0.5) py=yc+0.5;      /* cross-slope clamp: the bed stays a plane */
        var cc=(kerbed&&(k===0||k===3))?kc:col;
        sec.push([px,py,pz,cc[0],cc[1],cc[2]]);
      }
      if(prev){ for(k=0;k<sec.length-1;k++) quad(prev[k],prev[k+1],sec[k],sec[k+1]); }
      prev=sec;
    }
  }
    job.phase='mesh'; job.mi=0; job.keys=Array.from(cells.keys());
    if(deadline && performance.now()>=deadline) return true;
  }
  if(job.phase==='mesh'){
  var mat=job.mat||(job.mat=surfApply(new THREE.MeshLambertMaterial({vertexColors:true}), SURF.GROUND));
  for(; job.mi<job.keys.length; job.mi++){
    if(deadline && job.mi && performance.now()>=deadline) return true;
    var c=cells.get(job.keys[job.mi]);
    var g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(c.pos),3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(c.col),3));
    g.computeVertexNormals();
    var m=new THREE.Mesh(g,mat); m.name='road'; m.receiveShadow=true; m.frustumCulled=false;
    m.userData.cullBounds={x:c.x, z:c.z, r:CELL*0.8};
    scene.add(m);
  }
  }
    _roadPhase=1;
    _roadJob=null;
    if(deadline && performance.now()>=deadline) return true;
  }
  /* ---- junctions: road ends meeting another road, and R0/R1 crossings ---- */
  if(_roadPhase===1){
  function segX(ax,az,bx,bz,cx,cz,dx,dz){
    var r1x=bx-ax, r1z=bz-az, r2x=dx-cx, r2z=dz-cz, den=r1x*r2z-r1z*r2x; if(Math.abs(den)<1e-9) return null;
    var t=((cx-ax)*r2z-(cz-az)*r2x)/den, u=((cx-ax)*r1z-(cz-az)*r1x)/den; if(t<0.02||t>0.98||u<0.02||u>0.98) return null;
    return [ax+r1x*t, az+r1z*t];
  }
  function addJunction(x,z,kind){ for(var j=0;j<ROAD_JUNCTIONS.length;j++) if(Math.hypot(ROAD_JUNCTIONS[j].x-x,ROAD_JUNCTIONS[j].z-z)<40) return; ROAD_JUNCTIONS.push({x:x,z:z,kind:kind}); }
  ROADS.forEach(function(R,ri){
    [R.wp[0], R.wp[R.wp.length-1]].forEach(function(p){
      var f=roadFieldExcept(p[0],p[1],R); if(f.road && f.d<f.road.w/2+6) addJunction(p[0],p[1],R.lane?'lane':'road');
    });
    if(R.cls==='R2'||R.cls==='R3') return;
    for(var rj=ri+1;rj<ROADS.length;rj++){ var Q=ROADS[rj]; if(Q.cls==='R2'||Q.cls==='R3') continue;
      for(var a=0;a<R.wp.length-1;a++) for(var b=0;b<Q.wp.length-1;b++){ var h=segX(R.wp[a][0],R.wp[a][1],R.wp[a+1][0],R.wp[a+1][1],Q.wp[b][0],Q.wp[b][1],Q.wp[b+1][0],Q.wp[b+1][1]); if(h) addJunction(h[0],h[1],'cross'); } }
  });
  roadStats.junctions=ROAD_JUNCTIONS.length;
  _roadPhase=2;
  if(deadline && performance.now()>=deadline) return true;
  }
  /* ---- furniture ---- */
  function freeSpot(px,pz,r){ if(insideSolid(px,pz,r)) return false; var f=roadField(px,pz); if(f.road&&f.d<f.road.w/2+0.6) return false; var rf=riverField(px,pz); if(rf.river&&rf.d<riverHalfWidth(rf.river,pz)+2) return false; if(nearTown(px,pz,-30)) return false; return true; }
  if(_roadPhase===2){
  ROAD_JUNCTIONS.forEach(function(J,ji){
    if(nearTown(J.x,J.z,-20)) return;
    var placed=false;
    for(var a=0;a<8&&!placed;a++){ var ang=a/8*TAU+0.4, px=J.x+Math.cos(ang)*9, pz=J.z+Math.sin(ang)*9;
      if(!freeSpot(px,pz,1.2)) continue;
      if(J.kind==='cross'||ji%3===0){ propTroita(px,pz,ang+Math.PI/2); roadStats.crosses++; } else { propSignpost(px,pz,ang); roadStats.signs++; }
      placed=true; }
  });
  _roadPhase=3;
  if(deadline && performance.now()>=deadline) return true;
  }
  if(_roadPhase===3){
  ROADS.forEach(function(R){
    var P=R.pts, acc=0, accW=0, side=1;
    var mile=(R.cls==='R0'||R.cls==='R1'||R.cls==='R1t'), wells=(R.id==='RG-04');
    if(!mile) return;
    for(i=1;i<P.length;i++){
      var a=P[i-1], b=P[i], L=Math.hypot(b[0]-a[0],b[1]-a[1]), ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L, nx=-uz, nz=ux;
      acc+=L; accW+=L;
      if(acc>=250){ acc=0; side=-side; var mx=b[0]+nx*side*(R.w/2+1.6), mz=b[1]+nz*side*(R.w/2+1.6);
        if(!nearSite(mx,mz,4)&&freeSpot(mx,mz,0.6)){ propMilestone(mx,mz,-Math.atan2(uz,ux), R); roadStats.milestones++; } }
      if(wells&&accW>=700){ accW=0; var wx=b[0]+nx*(R.w/2+7), wz=b[1]+nz*(R.w/2+7);
        if(!nearSite(wx,wz,10)&&freeSpot(wx,wz,1.8)){ propWell(wx,wz,0x6d5a3e); roadStats.wells++; } }
    }
  });
  _roadPhase=4;
  if(deadline && performance.now()>=deadline) return true;
  }
  if(_roadPhase===4){
  /* gate approaches: a lantern every 30u on the last 200u of any road that ends at a town */
  ROADS.forEach(function(R){
    if(R.cls==='R3'||R.lane) return;
    [[R.pts,1],[R.pts.slice().reverse(),1]].forEach(function(e){
      var P=e[0], p0=P[0], town=null;
      for(var t=0;t<FAC_KEYS_T.length;t++){ var T=TOWNS[FAC_KEYS_T[t]]; if(Math.hypot(p0[0]-T.x,p0[1]-T.z)<300) town=T; }
      if(!town||town===TOWNS.nippon) return;
      var acc=0, n=0;
      for(var k=1;k<P.length&&acc<200;k++){ var a=P[k-1], b=P[k], L=Math.hypot(b[0]-a[0],b[1]-a[1]); acc+=L; if(acc/30<n) continue; n++;
        var ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L, sd=(n%2?1:-1), lx=b[0]-uz*sd*(R.w/2+1.2), lz=b[1]+ux*sd*(R.w/2+1.2);
        if(freeSpot(lx,lz,0.4)&&!onBridgeDeck(lx,lz,2)){ torchPost(lx,lz,2.6); roadStats.lanterns++; } }
    });
  });
  _roadPhase=5;
  if(deadline && performance.now()>=deadline) return true;
  }
  /* toll arches on the Caravan Road */
  [[-1300,2530],[1350,2540]].forEach(function(t){
    var R=ROADS.filter(function(r){ return r.id==='RG-04'; })[0], best=null, bd=1e9, bi=0;
    for(i=0;i<R.pts.length;i++){ var d=Math.hypot(R.pts[i][0]-t[0],R.pts[i][1]-t[1]); if(d<bd){ bd=d; best=R.pts[i]; bi=i; } }
    var a=R.pts[Math.max(0,bi-1)], b=R.pts[Math.min(R.pts.length-1,bi+1)];
    propTollArch(best[0],best[1],Math.atan2(b[1]-a[1],b[0]-a[0]),R.w); roadStats.tolls++;
  });
  _roadPhase=0;
  return false;
}

function roadFieldExcept(x,z,R){
  var q=roadQuery(x,z,1,R), br=q.seg?q.seg.road:null;
  return {d:q.seg?Math.sqrt(q.d2):1e9, road:br};
}
/* ---- road furniture ---- */
function propMilestone(cx,cz,ry,R){
  var y=roadSurfY(cx,cz), kit=cellKit(cx,cz), S=M2(R.cls==='R0'?0x9a9a8a:0x8f8a80);
  kit.box(S,0.6,1.3,0.45, cx,y+0.6,cz, ry); kit.box(M2(0x6a6560),0.66,0.14,0.51, cx,y+1.0,cz, ry);
  kit.box(M2(0x241d16),0.36,0.32,0.05, cx+0.24*Math.sin(ry), y+0.72, cz+0.24*Math.cos(ry), ry);
  addCollider(cx-0.32,cz-0.28,cx+0.32,cz+0.28);
}
function propSignpost(cx,cz,ry){
  var y=roadSurfY(cx,cz), kit=cellKit(cx,cz), T=M2(0x5d4326), B=M2(0xd9c8a2);
  kit.box(T,0.16,3.0,0.16, cx,y+1.5,cz);
  kit.box(B,1.4,0.28,0.06, cx+0.6*Math.cos(ry), y+2.6, cz+0.6*Math.sin(ry), -ry);
  kit.box(B,1.2,0.28,0.06, cx-0.5*Math.sin(ry), y+2.2, cz+0.5*Math.cos(ry), -ry+Math.PI/2);
  addCollider(cx-0.2,cz-0.2,cx+0.2,cz+0.2);
}
function propTollArch(cx,cz,ang,w){
  var y=roadSurfY(cx,cz), kit=cellKit(cx,cz), T=M2(0x5d4326), R=M2(0x8b2d2d), c=Math.cos(ang), s=Math.sin(ang), hw=w/2+0.9, i;
  for(i=-1;i<=1;i+=2){ var px=cx-s*i*hw, pz=cz+c*i*hw; kit.box(T,0.5,5.2,0.5, px,y+2.6,pz, -ang); addCollider(px-0.3,pz-0.3,px+0.3,pz+0.3); kit.box(M2(0x8f8a80),1.0,0.5,1.0, px,y+0.25,pz, -ang); }
  kit.box(T,0.36,0.36,hw*2+0.5, cx,y+5.0,cz, -ang);
  kit.box(R,0.06,1.4,1.6, cx,y+4.2,cz, -ang);
  kit.prism(M2(0x3a3430),1.4,0.7,hw*2+1.0, cx,y+5.5,cz, -ang);
  /* toll keeper's hut beside the arch */
  var hx=cx-s*(hw+5), hz=cz+c*(hw+5);
  buildBuilding({x:hx, z:hz, w:6, d:5, h:3.2, wall:0xd9c8a2, roofCol:0x6d5a3e, roof:'gable', door:'S', interior:'checkpoint', name:'Vama Caravanelor', windows:true, timberFrame:true});
  torchPost(cx-s*(hw+1.2)+c*3, cz+c*(hw+1.2)+s*3, 2.6);
}

/* ============================================================
   fortifications.js — towers, curtain walls, gates, palisades,
   tents, moats and bridges. World coordinates; every solid
   part registers colliders (round shapes as chains of AABBs).
   ============================================================ */
function fortKit(x,z){ return SITE_KIT||cellKit(x||0,z||0); }
function fortFlush(kit){ /* cell kits are flushed once by flushCellKits() */ }
/* a chain of small AABBs along a segment — walls at any angle stay solid */
function colliderAlong(x0,z0,x1,z1,halfT){
  var L=Math.hypot(x1-x0,z1-z0), step=Math.max(0.8, halfT*1.6), n=Math.max(1,Math.ceil(L/step)), i;
  var dx=(x1-x0)/n, dz=(z1-z0)/n;
  for(i=0;i<n;i++){
    var ax=x0+dx*i, az=z0+dz*i, bx=ax+dx, bz=az+dz;
    addCollider(Math.min(ax,bx)-halfT, Math.min(az,bz)-halfT, Math.max(ax,bx)+halfT, Math.max(az,bz)+halfT);
  }
}

/* ---- round / polygonal tower ---- */
/* o={x,z,r,h,sides,wall,roofCol,roof:'cone'|'flat'|'timber'|'open',door:angle|null,torches,banner,slits,brazier,name,interior,y,base} */
function fortTower(o){
  var kit=fortKit(o.x,o.z), n=o.sides||10, r=o.r, h=o.h, cx=o.x, cz=o.z;
  var gy=o.y!==undefined?o.y:groundH(cx,cz), yTop=gy+h;
  var W=M2(o.wall||0x8b8579), W2=M2(tintHex(o.wall||0x8b8579,-0.12)), D=M2(0x241d16), T=M2(0x5d4326), R=M2(o.roofCol||0x4a4238), S=M2(0x7d7669);
  var side=2*r*Math.sin(Math.PI/n), t=0.55, i;
  var doorA=(o.door===undefined||o.door===null)?null:o.door;
  /* the polygon is turned so one side faces the door angle exactly */
  var rot=(doorA===null?0:doorA)-0.5*TAU/n, doorIdx=doorA===null?-1:0;
  kit.cyln(S, r+0.5, r+0.8, 0.5, n, cx, gy+0.25, cz, rot);
  kit.cyln(S, r-0.1, r-0.1, 0.25, n, cx, gy+0.12, cz, rot); /* floor */
  for(i=0;i<n;i++){
    var a=rot+(i+0.5)*TAU/n, mx=cx+Math.cos(a)*(r-t/2), mz=cz+Math.sin(a)*(r-t/2), ry=-a+Math.PI/2;
    var ax=cx+Math.cos(rot+i*TAU/n)*(r-t/2), az=cz+Math.sin(rot+i*TAU/n)*(r-t/2);
    var bx=cx+Math.cos(rot+(i+1)*TAU/n)*(r-t/2), bz=cz+Math.sin(rot+(i+1)*TAU/n)*(r-t/2);
    if(i===doorIdx){
      var dw=1.7, hd=2.4;
      kit.box(W, (side-dw)/2, h, t, cx+Math.cos(a)*(r-t/2)+Math.cos(a+Math.PI/2)*(side/4+dw/4), gy+h/2, mz+Math.sin(a+Math.PI/2)*(side/4+dw/4), ry);
      kit.box(W, (side-dw)/2, h, t, cx+Math.cos(a)*(r-t/2)-Math.cos(a+Math.PI/2)*(side/4+dw/4), gy+h/2, mz-Math.sin(a+Math.PI/2)*(side/4+dw/4), ry);
      kit.box(W, dw+0.2, h-hd, t, mx, gy+hd+(h-hd)/2, mz, ry);
      kit.box(T, dw+0.4, 0.2, t+0.2, mx, gy+hd+0.1, mz, ry);
      kit.box(S, dw+1.2, 0.2, 1.2, cx+Math.cos(a)*(r+0.3), gy+0.1, cz+Math.sin(a)*(r+0.3), ry);
      /* colliders: two jambs */
      var ux=Math.cos(a+Math.PI/2), uz=Math.sin(a+Math.PI/2);
      colliderAlong(ax,az, mx-ux*dw/2, mz-uz*dw/2, t/2);
      colliderAlong(mx+ux*dw/2, mz+uz*dw/2, bx,bz, t/2);
      /* the leaf */
      var hx=mx-ux*(dw/2-0.05), hz=mz-uz*(dw/2-0.05);
      spawnDoorLeaf(hx,hz,gy,-a+Math.PI/2,dw,hd,T,D,mx,mz);
    } else {
      kit.box(i%2?W:W2, side+0.05, h, t, mx, gy+h/2, mz, ry);
      colliderAlong(ax,az,bx,bz,t/2);
      if(o.slits!==false && h>5){
        kit.box(D, 0.16, 0.9, 0.2, cx+Math.cos(a)*(r+0.02), gy+h*0.55, cz+Math.sin(a)*(r+0.02), ry);
        if(h>9) kit.box(D, 0.16, 0.9, 0.2, cx+Math.cos(a)*(r+0.02), gy+h*0.8, cz+Math.sin(a)*(r+0.02), ry);
      }
    }
  }
  /* string course */
  kit.cyln(S, r+0.25, r+0.25, 0.3, n, cx, gy+h*0.5, cz, rot);
  var roof=o.roof||'cone';
  if(roof==='flat'||roof==='open'){
    kit.cyln(S, r+0.4, r+0.15, 0.5, n, cx, yTop+0.2, cz, rot);
    for(i=0;i<n*2;i++){ var ma=rot+i*TAU/(n*2); kit.box(W, side*0.42, 1.0, 0.45, cx+Math.cos(ma)*(r+0.15), yTop+0.9, cz+Math.sin(ma)*(r+0.15), -ma+Math.PI/2); }
    if(o.brazier){ kit.cyln(M2(0x50565e),0.45,0.3,0.35,10,cx,yTop+0.7,cz); addFlame(cx,yTop+1.1,cz,1.7); }
  } else if(roof==='timber'){
    kit.box(T, r*2+1.6, 0.3, r*2+1.6, cx, yTop+0.15, cz);
    for(i=-1;i<=1;i+=2){ kit.box(T, r*2+1.6, 1.4, 0.16, cx, yTop+1.0, cz+i*(r+0.72)); kit.box(T, 0.16, 1.4, r*2+1.6, cx+i*(r+0.72), yTop+1.0, cz); }
    kit.pyr(R, r+1.2, r*1.2+1.2, 4, cx, yTop+1.7+(r*1.2+1.2)/2, cz, Math.PI/4);
    if(o.brazier){ kit.cyln(M2(0x50565e),0.45,0.3,0.35,10,cx+r+1.2,yTop+0.5,cz); addFlame(cx+r+1.2,yTop+0.9,cz,1.6); }
  } else {
    kit.cyln(S, r+0.4, r+0.15, 0.4, n, cx, yTop+0.15, cz, rot);
    kit.pyr(R, r+0.6, r*1.35+1.0, n, cx, yTop+0.35+(r*1.35+1.0)/2, cz, rot);
    kit.pyr(M2(tintHex(o.roofCol||0x4a4238,-0.15)), r*0.2, 0.8, n, cx, yTop+0.35+r*1.35+1.0+0.3, cz, rot);
  }
  if(o.banner){ bannerOn(PROP_PARENT||scene, cx+r*0.3, yTop+(roof==='cone'?r*1.35+2.4:3.2), cz, o.banner); }
  if(o.torches!==false){
    var ta=doorA!==null?doorA:0;
    wallTorch(cx+Math.cos(ta+0.5)*(r+0.3), gy+3.2, cz+Math.sin(ta+0.5)*(r+0.3));
    wallTorch(cx+Math.cos(ta-0.5)*(r+0.3), gy+3.2, cz+Math.sin(ta-0.5)*(r+0.3));
  }
  /* inside: stair round the post, stores, a lamp */
  if(o.interior!==false){
    fSpiral(kit, cx, gy+0.24, cz, Math.min(h-0.6, 9), Math.max(1.2, r-1.0));
    var ba=(doorA===null?0:doorA)+Math.PI;
    fBarrel(kit, cx+Math.cos(ba+0.6)*(r-1.1), gy+0.24, cz+Math.sin(ba+0.6)*(r-1.1));
    fCrate(kit, cx+Math.cos(ba-0.6)*(r-1.1), gy+0.24, cz+Math.sin(ba-0.6)*(r-1.1), 0.7);
    var lw={x:cx+Math.cos(ba)*(r-0.9), z:cz+Math.sin(ba)*(r-0.9)};
    wallTorch(lw.x, gy+2.2, lw.z);
  }
  fortFlush(kit);
  BUILD_COUNT++;
  regStructure({name:o.name||'tower', kind:'tower', x:cx, z:cz, hx:r, hz:r, door:doorA===null?null:{x:cx+Math.cos(doorA)*(r+0.6), z:cz+Math.sin(doorA)*(r+0.6)}, dw:1.7, enterable:doorA!==null});
  return {x:cx, z:cz, yTop:yTop};
}

/* ---- curtain wall segment ---- */
/* o={x0,z0,x1,z1,h,t,wall,merlons,walk,slits} */
function fortWall(o){
  var kit=fortKit((o.x0+o.x1)/2,(o.z0+o.z1)/2), h=o.h, t=o.t||1.6, W=M2(o.wall||0x8b8579), W2=M2(tintHex(o.wall||0x8b8579,-0.12)), S=M2(0x7d7669), D=M2(0x241d16);
  var L=Math.hypot(o.x1-o.x0,o.z1-o.z0), ry=-Math.atan2(o.z1-o.z0,o.x1-o.x0);
  var mx=(o.x0+o.x1)/2, mz=(o.z0+o.z1)/2;
  var y0=o.y!==undefined?o.y:Math.min(groundH(o.x0,o.z0),groundH(o.x1,o.z1),groundH(mx,mz))-0.3;
  kit.box(W, L, h, t, mx, y0+h/2, mz, ry);
  kit.box(S, L+0.2, 0.5, t+0.5, mx, y0+0.25, mz, ry);
  kit.box(S, L+0.1, 0.3, t+0.24, mx, y0+h*0.5, mz, ry);
  if(o.walk!==false){
    kit.box(S, L, 0.3, t*0.55, mx, y0+h-0.3, mz, ry); /* walkway parapet base */
  }
  if(o.merlons!==false){
    var n=Math.max(2,Math.floor(L/2.2)), i, ux=(o.x1-o.x0)/L, uz=(o.z1-o.z0)/L, nx=-uz, nz=ux;
    for(i=0;i<n;i++){
      var u=-L/2+1.1+i*(L-2.2)/(n-1);
      kit.box(i%2?W:W2, 1.0, 1.1, 0.5, mx+ux*u+nx*(t/2-0.25), y0+h+0.55, mz+uz*u+nz*(t/2-0.25), ry);
      if(o.slits && i%2===0) kit.box(D, 0.16, 1.0, 0.2, mx+ux*u+nx*(t/2+0.02), y0+h*0.62, mz+uz*u+nz*(t/2+0.02), ry);
    }
    kit.box(W, L, 0.7, 0.3, mx-nx*(t/2-0.15), y0+h+0.35, mz-nz*(t/2-0.15), ry); /* inner lip */
  }
  colliderAlong(o.x0,o.z0,o.x1,o.z1,t/2);
  fortFlush(kit);
  BUILD_COUNT++;
  return {len:L};
}
/* wall along a polyline with gaps: gaps=[{x,z,w}] */
function fortWallRun(pts,opts,gaps,closed){
  var i, out=[];
  var n=closed?pts.length:pts.length-1;
  for(i=0;i<n;i++){
    var a=pts[i], b=pts[(i+1)%pts.length];
    var segs=[[a[0],a[1],b[0],b[1]]];
    (gaps||[]).forEach(function(g){
      var next=[];
      segs.forEach(function(sg){
        var L=Math.hypot(sg[2]-sg[0],sg[3]-sg[1]), ux=(sg[2]-sg[0])/L, uz=(sg[3]-sg[1])/L;
        var t=((g.x-sg[0])*ux+(g.z-sg[1])*uz);
        var px=sg[0]+ux*t, pz=sg[1]+uz*t;
        if(t>0&&t<L&&Math.hypot(px-g.x,pz-g.z)<3){
          if(t-g.w/2>1) next.push([sg[0],sg[1],px-ux*g.w/2,pz-uz*g.w/2]);
          if(L-(t+g.w/2)>1) next.push([px+ux*g.w/2,pz+uz*g.w/2,sg[2],sg[3]]);
        } else next.push(sg);
      });
      segs=next;
    });
    segs.forEach(function(sg){ out.push(fortWall(Object.assign({x0:sg[0],z0:sg[1],x1:sg[2],z1:sg[3]},opts))); });
  }
  return out;
}

/* ---- gatehouse: two towers, an arch, a raised portcullis, torches, banner ---- */
/* o={x,z,dir:'N'|'S'|'E'|'W',w,h,wall,roofCol,banner,name,portcullis,leaves} */
function fortGate(o){
  var kit=fortKit(o.x,o.z), dirA=(o.ang!==undefined)?o.ang:doorAngle(o.dir||'S'); /* frame so the gate opens toward local +z (o.ang: any outward angle) */
  var cx=o.x, cz=o.z, w=o.w||5, h=o.h||9, tw=o.tw||4.2, th=h+3.5;
  var W=M2(o.wall||0x8b8579), W2=M2(tintHex(o.wall||0x8b8579,-0.12)), S=M2(0x7d7669), D=M2(0x241d16), T=M2(0x5d4326), I=M2(0x50565e), R=M2(o.roofCol||0x4a4238);
  kit.frame(cx,cz,dirA);
  var gy=groundH(cx,cz), i, s;
  for(s=-1;s<=1;s+=2){
    var tx=cx+s*(w/2+tw/2);
    kit.box(s>0?W:W2, tw, th, tw, tx, gy+th/2, cz);
    kit.box(S, tw+0.5, 0.5, tw+0.5, tx, gy+0.25, cz);
    kit.box(S, tw+0.3, 0.3, tw+0.3, tx, gy+th*0.5, cz);
    for(i=0;i<3;i++){ kit.box(D,0.16,1.0,0.2,tx,gy+th*(0.35+0.2*i),cz+tw/2+0.02); kit.box(D,0.16,1.0,0.2,tx,gy+th*(0.35+0.2*i),cz-tw/2-0.02); }
    for(i=0;i<4;i++){ kit.box(W, 0.8, 1.0, 0.5, tx-tw/2+0.5+i*(tw-1)/3, gy+th+0.5, cz+tw/2-0.25); kit.box(W, 0.8, 1.0, 0.5, tx-tw/2+0.5+i*(tw-1)/3, gy+th+0.5, cz-tw/2+0.25); }
    kit.box(W, 0.5, 1.0, tw, tx+s*(tw/2-0.25), gy+th+0.5, cz);
    if(o.roof==='cone') kit.pyr(R, tw*0.75, tw*1.1, 4, tx, gy+th+1.2+tw*0.55, cz, Math.PI/4);
    kit.collider(tx-tw/2, cz-tw/2, tx+tw/2, cz+tw/2);
    wallTorch(kit.toWorld(tx-s*(tw/2+0.2),cz+tw/2+0.2).x, gy+3.4, kit.toWorld(tx-s*(tw/2+0.2),cz+tw/2+0.2).z);
  }
  /* arch over the passage */
  var ph=o.ph||4.6;
  kit.box(W, w+0.4, th-ph, tw, cx, gy+ph+(th-ph)/2, cz);
  kit.box(T, w+0.4, 0.3, tw+0.3, cx, gy+ph+0.15, cz);
  kit.box(S, w+0.8, 0.4, 0.6, cx, gy+th+0.2, cz+tw/2-0.3); kit.box(S, w+0.8, 0.4, 0.6, cx, gy+th+0.2, cz-tw/2+0.3);
  for(i=0;i<Math.floor(w/1.2);i++){ kit.box(W, 0.7, 1.0, 0.5, cx-w/2+0.6+i*1.2, gy+th+0.7, cz+tw/2-0.25); }
  /* murder holes and the raised portcullis */
  for(i=-1;i<=1;i++) kit.box(D, 0.5, 0.15, 0.5, cx+i*1.2, gy+ph-0.05, cz);
  if(o.portcullis!==false){
    for(i=0;i<=Math.floor(w/0.5);i++) kit.box(I, 0.08, ph-2.9, 0.08, cx-w/2+0.25+i*0.5, gy+2.9+(ph-2.9)/2, cz+0.3);
    kit.box(I, w, 0.08, 0.08, cx, gy+3.3, cz+0.3); kit.box(I, w, 0.08, 0.08, cx, gy+ph-0.4, cz+0.3);
  }
  /* open gate leaves against the passage walls */
  if(o.leaves!==false){
    kit.box(T, 0.16, ph-1.2, w*0.45, cx-w/2+0.1, gy+(ph-1.2)/2, cz+tw/2-w*0.2, 0, 0, 0);
    kit.box(T, 0.16, ph-1.2, w*0.45, cx+w/2-0.1, gy+(ph-1.2)/2, cz+tw/2-w*0.2);
    kit.box(I, 0.2, 0.12, w*0.45, cx-w/2+0.1, gy+1.2, cz+tw/2-w*0.2); kit.box(I, 0.2, 0.12, w*0.45, cx+w/2-0.1, gy+1.2, cz+tw/2-w*0.2);
  }
  /* cobbles through the passage */
  kit.box(S, w+0.2, 0.12, tw+3, cx, gy+0.04, cz);
  var bw=kit.toWorld(cx, cz+tw/2+0.2);
  if(o.banner) bannerOn(PROP_PARENT||scene, bw.x, gy+th-1.2, bw.z, o.banner);
  var gd=kit.toWorld(cx, cz+tw/2+0.8);
  kit.frame(0,0,0);
  fortFlush(kit);
  BUILD_COUNT++;
  var ca=Math.abs(Math.cos(dirA)), sa=Math.abs(Math.sin(dirA)), gd2=kit.toWorld(cx, cz-tw/2-0.8);
  regStructure({name:o.name||'gate', kind:'gate', x:cx, z:cz, hx:ca*(w/2+tw)+sa*(tw/2), hz:sa*(w/2+tw)+ca*(tw/2), door:{x:gd.x,z:gd.z}, back:{x:gd2.x,z:gd2.z}, dw:w, passage:(sa>ca)?'x':'z', rot:(ca>0.01&&sa>0.01), enterable:true});
  return {x:cx, z:cz, w:w};
}

/* ---- palisade: instanced logs along a polyline; gaps=[{x,z,w}] ---- */
function palisade(pts,opts){
  opts=opts||{};
  var h=opts.h||5.5, closed=opts.closed!==false, gaps=opts.gaps||[], items=[], tips=[], i, j;
  var n=closed?pts.length:pts.length-1;
  for(i=0;i<n;i++){
    var a=pts[i], b=pts[(i+1)%pts.length];
    var L=Math.hypot(b[0]-a[0],b[1]-a[1]), ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L, m=Math.max(1,Math.round(L/0.95));
    var segStart=null;
    for(j=0;j<=m;j++){
      var px=a[0]+ux*(L*j/m), pz=a[1]+uz*(L*j/m), inGap=false;
      for(var g=0;g<gaps.length;g++){ if(Math.hypot(px-gaps[g].x,pz-gaps[g].z)<gaps[g].w/2) inGap=true; }
      if(inGap){ if(segStart){ colliderAlong(segStart[0],segStart[1],px-ux*0.5,pz-uz*0.5,0.45); segStart=null; } continue; }
      if(!segStart) segStart=[px,pz];
      var py=groundH(px,pz), hh=h+((i*7+j*13)%5)*0.12;
      items.push(imItem(px,py+hh/2,pz,0,1,hh,1,opts.col||0x6b4f2e));
      tips.push(imItem(px,py+hh+0.45,pz,0,1,1,1,opts.col||0x6b4f2e));
      if(j===m && segStart){ colliderAlong(segStart[0],segStart[1],px,pz,0.45); segStart=null; }
    }
    if(segStart) colliderAlong(segStart[0],segStart[1],b[0],b[1],0.45);
    /* walkway rail inside */
    if(opts.walk){
      var mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2, kit=fortKit(mx,mz), nx=-uz, nz=ux, cy=groundH(mx,mz);
      kit.box(M2(0x5d4326), L, 0.14, 1.2, mx-nx*(opts.inside||1.1), cy+h*0.62, mz-nz*(opts.inside||1.1), -Math.atan2(uz,ux));
      fortFlush(kit);
    }
  }
  var parent=PROP_PARENT||scene;
  var geo=new THREE.CylinderGeometry(0.42,0.5,1,6), tipGeo=new THREE.ConeGeometry(0.42,0.9,6), mat=M(0xffffff);
  function make(list,gm){
    var im=new THREE.InstancedMesh(gm, mat, list.length);
    var _pc=new THREE.Color();
    list.forEach(function(it,k){ im.setMatrixAt(k,it.m); im.setColorAt(k,_pc.setHex(it.c)); });
    im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; im.castShadow=true; im.receiveShadow=true; im.frustumCulled=false;
    if(!PROP_PARENT){ var bb={x0:1e9,x1:-1e9,z0:1e9,z1:-1e9}; pts.forEach(function(p){ bb.x0=Math.min(bb.x0,p[0]); bb.x1=Math.max(bb.x1,p[0]); bb.z0=Math.min(bb.z0,p[1]); bb.z1=Math.max(bb.z1,p[1]); }); im.userData.cullBounds={x:(bb.x0+bb.x1)/2,z:(bb.z0+bb.z1)/2,r:Math.hypot(bb.x1-bb.x0,bb.z1-bb.z0)/2+20}; }
    parent.add(im);
  }
  if(items.length){ make(items,geo); make(tips,tipGeo); }
  BUILD_COUNT+=Math.ceil(items.length/12);
  return items.length;
}
function ringPts(cx,cz,r,n,squash,rot){
  var out=[], i; squash=squash||1; rot=rot||0;
  for(i=0;i<n;i++){ var a=rot+i/n*TAU; out.push([cx+Math.cos(a)*r, cz+Math.sin(a)*r*squash]); }
  return out;
}
/* earth rampart ring (berm) */
function rampart(cx,cz,r,n,h,w){
  var kit=fortKit(cx,cz), E=M2(0x6e5f43), G=M2(0x5a6a3a), i;
  for(i=0;i<n;i++){
    var a0=i/n*TAU, a1=(i+1)/n*TAU, am=(a0+a1)/2, L=2*r*Math.sin(Math.PI/n)+0.6;
    var mx=cx+Math.cos(am)*r, mz=cz+Math.sin(am)*r, my=groundH(mx,mz);
    kit.box(E, L, h, w, mx, my+h/2-0.2, mz, -am+Math.PI/2);
    kit.box(G, L, 0.3, w*0.6, mx, my+h-0.1, mz, -am+Math.PI/2);
  }
  fortFlush(kit);
}

/* ---- tents ---- */
/* ridge tent: o={x,z,w,d,ry,col,trim,interior:'cots'|'command'|'store'|null,name} — open at local +z */
function fortTent(o){
  var kit=fortKit(o.x,o.z), cx=o.x, cz=o.z, w=o.w||5, d=o.d||6, ry=o.ry||0, gy=groundH(cx,cz);
  var C=M2(o.col||0xd9c8a2), C2=M2(tintHex(o.col||0xd9c8a2,-0.12)), T=M2(0x5d4326), Tr=M2(o.trim||0x7a3434);
  kit.frame(cx,cz,ry);
  var h=o.h||3.2, slope=Math.hypot(w/2,h);
  var ang=Math.atan2(h,w/2);
  kit.box(C, slope+0.2, 0.08, d, cx-w/4, gy+h/2, cz, 0, 0, ang);
  kit.box(C2, slope+0.2, 0.08, d, cx+w/4, gy+h/2, cz, 0, 0, -ang);
  kit.prism(C2, w, h, 0.1, cx, gy+h/2, cz-d/2+0.05);           /* closed back */
  kit.prism(C, w*0.5, h*0.5, 0.06, cx-w*0.25, gy+h*0.25, cz+d/2-0.03); /* half flaps at the front */
  kit.box(T, 0.14, h, 0.14, cx, gy+h/2, cz+d/2-0.2); kit.box(T, 0.14, h, 0.14, cx, gy+h/2, cz-d/2+0.2);
  kit.box(T, 0.12, 0.12, d+0.6, cx, gy+h+0.05, cz);
  kit.box(Tr, 0.1, 0.5, d+0.4, cx, gy+h+0.2, cz);
  for(var i=-1;i<=1;i+=2){ for(var j=0;j<3;j++){ var pz=cz-d/2+0.6+j*(d-1.2)/2; kit.box(T,0.06,0.9,0.06,cx+i*(w/2+0.6),gy+0.45,pz,0,0,i*0.5); } }
  kit.box(M2(0x8a7a5e), w-0.4, 0.06, d-0.4, cx, gy+0.04, cz);
  /* colliders: sides and back (the canvas reaches the ground) */
  kit.collider(cx-w/2-0.2, cz-d/2, cx-w/2+0.5, cz+d/2);
  kit.collider(cx+w/2-0.5, cz-d/2, cx+w/2+0.2, cz+d/2);
  kit.collider(cx-w/2, cz-d/2-0.1, cx+w/2, cz-d/2+0.2);
  var it=o.interior;
  if(it==='cots'){
    fBed(kit,cx-w/2+0.9,gy+0.05,cz-0.4,0,{len:1.9,wide:0.8}); fBed(kit,cx+w/2-0.9,gy+0.05,cz-0.4,0,{len:1.9,wide:0.8});
    fCrate(kit,cx,gy+0.05,cz-d/2+0.8,0.7); fRack(kit,cx+w/2-0.4,gy+0.05,cz-d/2+1.9,-Math.PI/2,'spear');
  } else if(it==='command'){
    fMapTable(kit,cx,gy+0.05,cz-0.5,0); fChair(kit,cx,gy+0.05,cz-1.7,0,true); fChest(kit,cx+w/2-0.9,gy+0.05,cz-d/2+0.6,0);
    fRack(kit,cx-w/2+0.5,gy+0.05,cz-d/2+1.4,Math.PI/2,'sword'); fBrazier(kit,cx-w/2+1.0,gy+0.05,cz+d/2-1.2,false);
  } else if(it==='store'){
    fBarrel(kit,cx-w/2+0.8,gy+0.05,cz-d/2+0.8); fBarrel(kit,cx-w/2+0.8,gy+0.05,cz-d/2+1.6); fCrate(kit,cx+w/2-0.9,gy+0.05,cz-d/2+0.9,0.9); fCrate(kit,cx+w/2-0.9,gy+0.05,cz,0.7); fSack(kit,cx,gy+0.05,cz-d/2+1.0);
  } else if(it==='forge'){
    fAnvil(kit,cx,gy+0.05,cz,0); fQuench(kit,cx+w/2-0.9,gy+0.05,cz-1.0); fRack(kit,cx-w/2+0.5,gy+0.05,cz-d/2+1.5,Math.PI/2,'axe');
  }
  kit.frame(0,0,0);
  fortFlush(kit);
  BUILD_COUNT++;
  var c=Math.cos(ry), s=Math.sin(ry);
  regStructure({name:o.name||'tent', kind:'tent', x:cx, z:cz, hx:Math.abs(w/2*c)+Math.abs(d/2*s), hz:Math.abs(w/2*s)+Math.abs(d/2*c), door:{x:cx+s*(d/2+1), z:cz+c*(d/2+1)}, enterable:true});
}
/* round pavilion: o={x,z,r,h,col,stripe,door:angle,interior} */
function pavilion(o){
  var kit=fortKit(o.x,o.z), cx=o.x, cz=o.z, r=o.r||4, h=o.h||2.6, n=12, gy=groundH(cx,cz), i;
  var C=M2(o.col||0xd9c8a2), C2=M2(o.stripe||0x7a3434), T=M2(0x5d4326), G=M2(COL_GOLD);
  var doorA=o.door||0, side=2*r*Math.sin(Math.PI/n), rot=doorA-0.5*TAU/n;
  for(i=0;i<n;i++){
    if(i===0) continue; /* side 0 faces the door angle: the open flap */
    var a=rot+(i+0.5)*TAU/n, mx=cx+Math.cos(a)*r, mz=cz+Math.sin(a)*r;
    kit.box(i%2?C:C2, side+0.05, h, 0.08, mx, gy+h/2, mz, -a+Math.PI/2);
    colliderAlong(cx+Math.cos(rot+i*TAU/n)*r, cz+Math.sin(rot+i*TAU/n)*r, cx+Math.cos(rot+(i+1)*TAU/n)*r, cz+Math.sin(rot+(i+1)*TAU/n)*r, 0.15);
  }
  kit.pyr(C, r+0.6, r*0.8, n, cx, gy+h+r*0.4, cz, rot);
  kit.cyln(T, 0.12, 0.12, h+r*0.8+0.6, 6, cx, gy+(h+r*0.8+0.6)/2, cz);
  kit.pyr(G, 0.25, 0.5, 6, cx, gy+h+r*0.8+0.7, cz);
  kit.box(M2(0x8a7a5e), r*1.4, 0.06, r*1.4, cx, gy+0.04, cz, 0.3);
  kit.collider(cx-0.15,cz-0.15,cx+0.15,cz+0.15);
  if(o.interior==='command'){ fMapTable(kit,cx-0.5,gy+0.05,cz-r*0.35,0.2); fChair(kit,cx-0.5,gy+0.05,cz-r*0.35-1.2,0,true); fBanner(kit,cx+r*0.6,gy+2.2,cz-r*0.4,0,C2); fBrazier(kit,cx+r*0.5,gy+0.05,cz+r*0.3,true); fChest(kit,cx-r*0.6,gy+0.05,cz+r*0.2,0.4,true); }
  else if(o.interior==='cots'){ for(i=0;i<4;i++){ var ca=doorA+Math.PI+(i-1.5)*0.7; fBed(kit,cx+Math.cos(ca)*(r-1.4),gy+0.05,cz+Math.sin(ca)*(r-1.4),-ca+Math.PI/2,{len:1.9,wide:0.8}); } fBrazier(kit,cx,gy+0.05,cz,false); }
  fortFlush(kit);
  BUILD_COUNT++;
  regStructure({name:o.name||'pavilion', kind:'tent', x:cx, z:cz, hx:r, hz:r, door:{x:cx+Math.cos(doorA)*(r+1), z:cz+Math.sin(doorA)*(r+1)}, enterable:true});
}

/* ---- moat water ring around a rectangle (terrain trough comes from geography MOATS) ---- */
function moatWater(x,z,hx,hz,w,y){
  var shape=new THREE.Shape();
  shape.moveTo(-hx-w/2,-hz-w/2); shape.lineTo(hx+w/2,-hz-w/2); shape.lineTo(hx+w/2,hz+w/2); shape.lineTo(-hx-w/2,hz+w/2); shape.lineTo(-hx-w/2,-hz-w/2);
  var hole=new THREE.Path();
  hole.moveTo(-hx+w/2,-hz+w/2); hole.lineTo(hx-w/2,-hz+w/2); hole.lineTo(hx-w/2,hz-w/2); hole.lineTo(-hx+w/2,hz-w/2); hole.lineTo(-hx+w/2,-hz+w/2);
  shape.holes.push(hole);
  var geo=new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI/2);
  var m=new THREE.Mesh(geo, WATER_MAT); m.position.set(x,y,z); m.name='always'; m.receiveShadow=true;
  scene.add(m); waterSurfaces.push(m);
  return m;
}

/* ---- bridges (river and moat): deck at b.y, parapets with colliders, piers ---- */
/* ford: no deck — the bed rises to wading depth (geography waterCut) and stepping stones cross it */
function buildFord(b){
  var kit=fortKit(b.x,b.z), c=Math.cos(b.ang), s=Math.sin(b.ang), S=M2(0x8f8a80), T=M2(0x5d4326), i;
  var n=Math.max(3,Math.floor(b.len/2.4));
  for(i=0;i<n;i++){
    var u=-b.len/2+b.len*(i+0.5)/n, px=b.x+c*u+s*((i%2)?0.5:-0.5), pz=b.z+s*u-c*((i%2)?0.5:-0.5), gy=groundHBase(px,pz);
    kit.cyln(S,0.75,0.85,0.5,7, px,gy+0.18,pz, 0, (i*0.7)%1.0, 0);
  }
  for(i=-1;i<=1;i+=2){
    var ex=b.x+c*i*(b.len/2+1.2), ez=b.z+s*i*(b.len/2+1.2), ey=groundHBase(ex,ez);
    kit.box(T,0.18,2.2,0.18, ex-s*(b.w/2+0.6), ey+1.1, ez+c*(b.w/2+0.6)); addFlame(ex-s*(b.w/2+0.6), ey+2.45, ez+c*(b.w/2+0.6), 0.6, true);
    kit.box(T,0.18,1.6,0.18, ex+s*(b.w/2+0.6), ey+0.8, ez-c*(b.w/2+0.6));
  }
  fortFlush(kit);
}
function buildBridge(b){
  if(b.ford){ buildFord(b); return; }
  var kit=fortKit(b.x,b.z), c=Math.cos(b.ang), s=Math.sin(b.ang), ry=-b.ang;
  var S=M2(b.col||0x8b8579), S2=M2(tintHex(b.col||0x8b8579,-0.15)), T=M2(0x5d4326);
  var timber=b.timber;
  kit.box(timber?T:S, b.len, 0.5, b.w, b.x, b.y-0.24, b.z, ry);
  kit.box(timber?T:S2, b.len+1.0, 0.25, b.w+0.6, b.x, b.y-0.55, b.z, ry);
  /* parapets */
  for(var sd=-1;sd<=1;sd+=2){
    var px=b.x-s*sd*(b.w/2-0.2), pz=b.z+c*sd*(b.w/2-0.2);
    kit.box(timber?T:S, b.len, 0.9, 0.35, px, b.y+0.45, pz, ry);
    kit.box(S2, b.len+0.2, 0.15, 0.45, px, b.y+0.95, pz, ry);
    colliderAlong(px-c*b.len/2, pz-s*b.len/2, px+c*b.len/2, pz+s*b.len/2, 0.2);
  }
  /* piers and arches */
  var n=Math.max(1,Math.floor(b.len/14)), i;
  for(i=0;i<n;i++){
    var u=-b.len/2+b.len*(i+0.5)/n, cxp=b.x+c*u, czp=b.z+s*u, gyp=groundHBase(cxp,czp);
    kit.box(S2, 2.2, b.y-gyp+0.6, b.w+1.0, cxp, gyp+(b.y-gyp+0.6)/2-0.5, czp, ry);
    kit.prism(S2, 3.0, 1.2, b.w+1.0, cxp, gyp+0.3, czp, ry, 0, 0, 0);
  }
  /* lanterns at both ends */
  for(i=-1;i<=1;i+=2){ var ex=b.x+c*i*(b.len/2-0.6)-s*(b.w/2-0.2), ez=b.z+s*i*(b.len/2-0.6)+c*(b.w/2-0.2); kit.box(T,0.16,2.0,0.16,ex,b.y+1.0,ez); addFlame(ex,b.y+2.3,ez,0.7); }
  fortFlush(kit);
  BUILD_COUNT++;
}

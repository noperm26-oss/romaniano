/* ============================================================
   architecture.js — building shells with real openings
   ------------------------------------------------------------
   Walls, roofs, frames and trim are emitted into a merged
   per-material kit, so a house can carry a hundred parts and
   still cost a handful of draw calls: detail costs triangles,
   not batches. Collision footprints keep the dimensions of the
   old walls, so navigation and street routing are unchanged.
   ============================================================ */

/* ---- colour and randomness helpers (shared by every shell) ---- */
function tintHex(c, amt){
  var r=(c>>16)&255, g=(c>>8)&255, b=c&255;
  if(amt>0){ r+=(255-r)*amt; g+=(255-g)*amt; b+=(255-b)*amt; }
  else { r*=(1+amt); g*=(1+amt); b*=(1+amt); }
  return (Math.round(clamp(r,0,255))<<16)|(Math.round(clamp(g,0,255))<<8)|Math.round(clamp(b,0,255));
}
function M2(c){ return M(c,{side:THREE.DoubleSide}); }
function seedRand(seed){
  var s=(seed>>>0)||1;
  return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
}

/* ============================================================
   1. Merged geometry kit
   ============================================================ */
function kitCreate(){
  var bags=new Map();
  var quat=new THREE.Quaternion(), eul=new THREE.Euler(0,0,0,'YXZ');
  var va=new THREE.Vector3(), vb=new THREE.Vector3(), vc=new THREE.Vector3();
  var e1=new THREE.Vector3(), e2=new THREE.Vector3(), nv=new THREE.Vector3();
  var tx=0, ty=0, tz=0;
  /* local frame: everything placed after frame(cx,cz,a) is rotated by a about (cx,cz) */
  var fx=0, fz=0, fa=0, fc=1, fs=0;
  function frame(cx,cz,a){ fx=cx||0; fz=cz||0; fa=a||0; fc=Math.cos(fa); fs=Math.sin(fa); }
  function toWorld(x,z){ if(!fa) return {x:x,z:z}; var dx=x-fx, dz=z-fz; return {x:fx+dx*fc+dz*fs, z:fz-dx*fs+dz*fc}; }
  function bag(m){ var b=bags.get(m); if(!b){ b={p:[],n:[],u:[]}; bags.set(m,b); } return b; }
  function place(x,y,z,rx,ry,rz){
    if(fa){ var w=toWorld(x||0,z||0); x=w.x; z=w.z; ry=(ry||0)+fa; }
    tx=x||0; ty=y||0; tz=z||0; eul.set(rx||0,ry||0,rz||0); quat.setFromEuler(eul);
  }
  /* axis-aligned collider given in local coordinates (rotated to a world AABB) */
  function collider(x0,z0,x1,z1){
    var a=toWorld(x0,z0), b=toWorld(x1,z1), c=toWorld(x0,z1), d=toWorld(x1,z0);
    addCollider(Math.min(a.x,b.x,c.x,d.x), Math.min(a.z,b.z,c.z,d.z), Math.max(a.x,b.x,c.x,d.x), Math.max(a.z,b.z,c.z,d.z));
  }
  function angle(){ return fa; }
  function push(b,v,n){
    b.p.push(v.x+tx, v.y+ty, v.z+tz);
    b.n.push(n.x, n.y, n.z);
    b.u.push((v.x+v.z)*0.25, v.y*0.25);
  }
  function tri(m,p0,p1,p2){
    var b=bag(m);
    va.set(p0[0],p0[1],p0[2]); vb.set(p1[0],p1[1],p1[2]); vc.set(p2[0],p2[1],p2[2]);
    e1.subVectors(vb,va); e2.subVectors(vc,va); nv.crossVectors(e1,e2);
    if(nv.lengthSq()<1e-10) return;
    nv.normalize();
    va.applyQuaternion(quat); vb.applyQuaternion(quat); vc.applyQuaternion(quat); nv.applyQuaternion(quat);
    push(b,va,nv); push(b,vb,nv); push(b,vc,nv);
  }
  function quad(m,p0,p1,p2,p3){ tri(m,p0,p1,p2); tri(m,p0,p2,p3); }
  /* box: size w(x) h(y) d(z), centre x,y,z, euler ry/rx/rz */
  function box(m,w,h,d,x,y,z,ry,rx,rz){
    place(x,y,z,rx,ry,rz);
    var X=w/2, Y=h/2, Z=d/2;
    quad(m,[-X,-Y,Z],[X,-Y,Z],[X,Y,Z],[-X,Y,Z]);
    quad(m,[X,-Y,-Z],[-X,-Y,-Z],[-X,Y,-Z],[X,Y,-Z]);
    quad(m,[-X,Y,Z],[X,Y,Z],[X,Y,-Z],[-X,Y,-Z]);
    quad(m,[-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z],[-X,-Y,Z]);
    quad(m,[X,-Y,Z],[X,-Y,-Z],[X,Y,-Z],[X,Y,Z]);
    quad(m,[-X,-Y,-Z],[-X,-Y,Z],[-X,Y,Z],[-X,Y,-Z]);
  }
  /* prism: triangle in local XY (base w along X, apex up, apex shifted -1..1), extruded d along Z */
  function prism(m,w,h,d,x,y,z,ry,rx,rz,apex){
    place(x,y,z,rx,ry,rz);
    var X=w/2, Y=h/2, Z=d/2, A=(apex||0)*X;
    tri(m,[-X,-Y,Z],[X,-Y,Z],[A,Y,Z]);
    tri(m,[-X,-Y,-Z],[A,Y,-Z],[X,-Y,-Z]);
    quad(m,[-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z],[-X,-Y,Z]);
    quad(m,[-X,-Y,Z],[A,Y,Z],[A,Y,-Z],[-X,-Y,-Z]);
    quad(m,[X,-Y,Z],[X,-Y,-Z],[A,Y,-Z],[A,Y,Z]);
  }
  /* n-gon prism along Y */
  function cyln(m,rt,rb,h,seg,x,y,z,ry,rx,rz){
    place(x,y,z,rx,ry,rz);
    var Y=h/2, n=Math.max(3,seg||8), i, a0, a1, c0, s0, c1, s1;
    for(i=0;i<n;i++){
      a0=i/n*TAU; a1=(i+1)/n*TAU;
      c0=Math.cos(a0); s0=Math.sin(a0); c1=Math.cos(a1); s1=Math.sin(a1);
      quad(m,[c0*rt,Y,s0*rt],[c1*rt,Y,s1*rt],[c1*rb,-Y,s1*rb],[c0*rb,-Y,s0*rb]);
      tri(m,[0,Y,0],[c1*rt,Y,s1*rt],[c0*rt,Y,s0*rt]);
      tri(m,[0,-Y,0],[c0*rb,-Y,s0*rb],[c1*rb,-Y,s1*rb]);
    }
  }
  /* n-gon pyramid, apex up */
  function pyr(m,r,h,seg,x,y,z,ry){
    place(x,y,z,0,ry||0,0);
    var Y=h/2, n=Math.max(3,seg||4), i, a0, a1, c0, s0, c1, s1;
    for(i=0;i<n;i++){
      a0=i/n*TAU; a1=(i+1)/n*TAU;
      c0=Math.cos(a0); s0=Math.sin(a0); c1=Math.cos(a1); s1=Math.sin(a1);
      tri(m,[c1*r,-Y,s1*r],[c0*r,-Y,s0*r],[0,Y,0]);
      tri(m,[0,-Y,0],[c0*r,-Y,s0*r],[c1*r,-Y,s1*r]);
    }
  }
  /* explicit placement for hand-built polygons: kit.at(x,y,z) then kit.quad/tri with offsets from that point */
  function at(x,y,z){ place(x,y,z,0,0,0); }
  /* drain the bags into two geometries: one vertex-coloured body (any Lambert material becomes a colour)
     and the window panes (kept on PANE_MAT so they glow at night). Used by prefabs.js for instancing. */
  function exportGeo(dy){
    dy=dy||0;
    var pos=[], nor=[], col=[], pp=[], pn=[], pu=[], c=new THREE.Color();
    bags.forEach(function(b,m){
      var i, n=b.p.length;
      if(m===PANE_MAT){ for(i=0;i<n;i+=3){ pp.push(b.p[i], b.p[i+1]-dy, b.p[i+2]); pn.push(b.n[i],b.n[i+1],b.n[i+2]); } for(i=0;i<b.u.length;i++) pu.push(b.u[i]); return; }
      c.copy(m.color||new THREE.Color(0xffffff));
      if(m.emissive && m.emissive.getHex()>0 && m.emissiveIntensity>0) c.lerp(m.emissive, Math.min(0.8,m.emissiveIntensity*0.5));   /* glowing materials bake a little of their glow */
      for(i=0;i<n;i+=3){ pos.push(b.p[i], b.p[i+1]-dy, b.p[i+2]); nor.push(b.n[i],b.n[i+1],b.n[i+2]); col.push(c.r,c.g,c.b); }
    });
    bags.clear();
    function geo(p,nn,cc,uu){
      if(!p.length) return null;
      var g=new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p),3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nn),3));
      if(cc) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cc),3));
      if(uu) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uu),2));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    }
    return {body:geo(pos,nor,col,null), panes:geo(pp,pn,null,pu), tris:pos.length/9};
  }
  function flush(parent,shadow){
    var made=0;
    bags.forEach(function(b,m){
      if(!b.p.length) return;
      var g=new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b.p),3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(b.n),3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(b.u),2));
      g.computeBoundingSphere();
      var mesh=new THREE.Mesh(g,m);
      mesh.castShadow=shadow!==false; mesh.receiveShadow=true;
      parent.add(mesh); made++;
    });
    bags.clear();
    return made;
  }
  return {box:box, prism:prism, cyln:cyln, pyr:pyr, tri:tri, quad:quad, at:at, exportGeo:exportGeo, flush:flush, frame:frame, toWorld:toWorld, collider:collider, angle:angle};
}

/* ============================================================
   2. Palette
   ============================================================ */
var ARCH_TIMBER=0x5d4326, ARCH_STONE=0x8b8579, ARCH_DARK=0x241d16, ARCH_PANE=0xd9c79a;
function structPal(o){
  var wall=o.wall, roof=o.roofCol;
  return {
    wall:   M2(wall),
    wall2:  M2(tintHex(wall,-0.10)),
    stone:  M2(o.stone||ARCH_STONE),
    timber: M2(o.timber||ARCH_TIMBER),
    roof:   M2(roof),
    roof2:  M2(tintHex(roof,-0.14)),
    trim:   M2(o.trim||0x513820),
    dark:   M2(ARCH_DARK),
    pane:   o.pane?M2(o.pane):PANE_MAT,
    floor:  M2(o.floorCol||0x8a7a5c)
  };
}

/* ============================================================
   3. Walls with genuine openings
   ============================================================ */
/*
  sp = {axis:'x'|'z', a0, a1, cross, y0, top, t, holes:[{c, w, b, tp, kind}]}
  Segments are emitted around every hole, so an opening is a real
  gap — daylight, arrows and sight lines pass through it.
*/
function wallRun(kit, m, sp){
  var axis=sp.axis, t=sp.t, cross=sp.cross;
  function seg(a,b,yb,yt){
    if(b-a<0.03||yt-yb<0.03) return;
    if(axis==='x') kit.box(m, b-a, yt-yb, t, (a+b)/2, (yb+yt)/2, cross);
    else kit.box(m, t, yt-yb, b-a, cross, (yb+yt)/2, (a+b)/2);
  }
  var holes=(sp.holes||[]).slice().sort(function(p,q){ return (p.c-p.w/2)-(q.c-q.w/2); });
  var bandLo=sp.top, bandHi=sp.y0, i, h;
  for(i=0;i<holes.length;i++){ bandLo=Math.min(bandLo,holes[i].b); bandHi=Math.max(bandHi,holes[i].tp); }
  if(!holes.length){ seg(sp.a0, sp.a1, sp.y0, sp.top); return; }
  seg(sp.a0, sp.a1, sp.y0, bandLo);
  seg(sp.a0, sp.a1, bandHi, sp.top);
  var cur=sp.a0;
  for(i=0;i<holes.length;i++){
    h=holes[i];
    var a=h.c-h.w/2, b=h.c+h.w/2;
    if(a>cur+0.03) seg(cur, a, bandLo, bandHi);
    if(h.b>bandLo+0.03) seg(a, b, bandLo, h.b);
    if(h.tp<bandHi-0.03) seg(a, b, h.tp, bandHi);
    if(b>cur) cur=b;
  }
  if(cur<sp.a1-0.03) seg(cur, sp.a1, bandLo, bandHi);
}
/* place a box against a wall: u along the wall, off across it */
function wallBox(kit,m,axis,u,cross,off,y,w,h,d){
  if(axis==='x') kit.box(m, w, h, d, u, y, cross+off);
  else kit.box(m, d, h, w, cross+off, y, u);
}
/* timber frame, door furniture or window joinery. f = outward side (+1/-1). */
function openingTrim(kit, P, sp, hole, rng){
  var axis=sp.axis, cross=sp.cross, f=sp.f, t=sp.t;
  var u=hole.c, w=hole.w, b=hole.b, tp=hole.tp, hh=tp-b;
  var thick=t+0.16;
  wallBox(kit,P.timber,axis,u-(w/2+0.08),cross,0,(b+tp)/2, 0.16, hh+0.16, thick);
  wallBox(kit,P.timber,axis,u+(w/2+0.08),cross,0,(b+tp)/2, 0.16, hh+0.16, thick);
  wallBox(kit,P.timber,axis,u,cross,0,tp+0.09, w+0.48, 0.18, thick);
  if(hole.kind==='door'){
    if(sp.leaf===false){
      wallBox(kit,P.trim,axis,u,cross,-f*0.02,b+hh/2, w-0.1, hh-0.04, 0.13);
      wallBox(kit,P.timber,axis,u,cross,f*(t*0.5-0.03),b+hh*0.22, w-0.12, 0.11, 0.17);
      wallBox(kit,P.timber,axis,u,cross,f*(t*0.5-0.03),b+hh*0.78, w-0.12, 0.11, 0.17);
    } else {
      /* a real leaf on a hinge: it swings open for whoever walks up (animations/buildings.js) */
      var hinge=(axis==='x')?kit.toWorld(u-w/2+0.04, cross):kit.toWorld(cross, u-w/2+0.04);
      var ang=kit.angle()+(axis==='x'?0:-Math.PI/2);
      var cw=(axis==='x')?kit.toWorld(u, cross):kit.toWorld(cross, u);
      spawnDoorLeaf(hinge.x, hinge.z, b, ang, w, hh, P.trim, P.dark, cw.x, cw.z, f>0?1.9:-1.9);
    }
    wallBox(kit,P.dark,axis,u-w*0.3,cross,f*(t*0.5-0.02),b+hh/2, 0.05, hh-0.24, 0.05);
    wallBox(kit,P.dark,axis,u+w*0.3,cross,f*(t*0.5-0.02),b+hh/2, 0.05, hh-0.24, 0.05);
    wallBox(kit,P.stone,axis,u,cross+f*0.2,0,b+0.09, w+0.55, 0.22, t+0.6);
  } else {
    wallBox(kit,P.timber,axis,u,cross,f*0.06,b-0.07, w+0.46, 0.14, t+0.3);
    wallBox(kit,P.timber,axis,u,cross,0,b+hh/2, 0.08, hh-0.08, t*0.55);
    wallBox(kit,P.timber,axis,u,cross,0,b+hh*0.56, w-0.1, 0.08, t*0.55);
    if(sp.pane!==false && rng()<0.82) wallBox(kit,P.pane,axis,u,cross,-f*t*0.3,b+hh/2, w-0.14, hh-0.12, 0.05);
    var sw=(w-0.12)/2, ph=rng()<0.5?0.45:0.05;
    for(var s=-1;s<=1;s+=2){
      var hinge=u+s*(w/2+0.03);
      var cu=hinge+s*(sw/2)*Math.cos(ph), co=cross+f*(t*0.5+0.09)+f*(sw/2)*Math.sin(ph);
      if(axis==='x') kit.box(P.trim, sw, hh-0.06, 0.09, cu, b+hh/2, co, -f*ph);
      else kit.box(P.trim, 0.09, hh-0.06, sw, co, b+hh/2, cu, f*ph);
    }
  }
}
/* animated door leaf: hinge at (hx,hz,y), leaf extends along the frame's +x, swings toward -z (inside) */
function spawnDoorLeaf(hx,hz,y,ang,w,hh,matLeaf,matDark,cx,cz,swing){
  if(typeof PREFAB_REC!=='undefined' && PREFAB_REC){ PREFAB_REC.doors.push({hx:hx, hz:hz, y:y, ang:ang, w:w, hh:hh, cx:cx, cz:cz, swing:swing||1.9}); return null; }
  var g=new THREE.Group(); g.position.set(hx, y, hz); g.rotation.y=ang;
  /* unit leaf: planks, two iron bands, a ring handle — scaled to the opening */
  var geo=sharedGeometry('doorleafVC',function(){ return mergedColoredBoxes([
    {w:1,h:1,d:0.11,x:0.5,y:0.5,z:0,c:0x513820},
    {w:0.96,h:0.05,d:0.15,x:0.5,y:0.24,z:0,c:0x241d16},{w:0.96,h:0.05,d:0.15,x:0.5,y:0.76,z:0,c:0x241d16},
    {w:0.02,h:1,d:0.13,x:0.34,y:0.5,z:0,c:0x3a2a18},{w:0.02,h:1,d:0.13,x:0.66,y:0.5,z:0,c:0x3a2a18},
    {w:0.08,h:0.08,d:0.2,x:0.86,y:0.48,z:0,c:0x50565e}]); });
  var leaf=new THREE.Mesh(geo, DOOR_MAT);
  leaf.scale.set(w-0.12, hh-0.06, 1); leaf.castShadow=true; g.add(leaf);
  propAdd(g);
  var D={g:g, base:ang, x:cx, z:cz, open:0, w:w, swing:swing||1.9};
  DOORS.push(D);
  return D;
}
/* evenly spaced window slots along a wall stretch */
function winSlots(a0,a1,maxN){
  var len=a1-a0, n=clamp(Math.floor(len/3.1),1,Math.max(1,maxN||4)), out=[], i, step=len/n;
  for(i=0;i<n;i++) out.push(a0+step*(i+0.5));
  return out;
}
/* holes for one wall: optional door in the middle, windows either side */
function wallHoles(a0,a1,doorW,y0,yTop,opt){
  opt=opt||{};
  var holes=[], sill=y0+(opt.sill||1.15), winH=opt.winH||1.15, winW=opt.winW||0.95;
  var top=Math.min(sill+winH, yTop-0.6);
  if(top-sill<0.45) return holes;
  if(doorW){
    var mid=(a0+a1)/2;
    holes.push({c:mid, w:doorW, b:y0, tp:y0+(opt.doorH||2.4), kind:'door'});
    [[a0+0.6, mid-doorW/2-0.6],[mid+doorW/2+0.6, a1-0.6]].forEach(function(seg){
      if(seg[1]-seg[0]>1.4) winSlots(seg[0],seg[1],opt.maxWin||2).forEach(function(u){
        holes.push({c:u, w:winW, b:sill, tp:top, kind:'window'});
      });
    });
  } else {
    winSlots(a0+0.5, a1-0.5, opt.maxWin||4).forEach(function(u){
      holes.push({c:u, w:winW, b:sill, tp:top, kind:'window'});
    });
  }
  return holes;
}

/* ============================================================
   4. Roofs — polyline profiles shared by every style
   ============================================================ */
/*
  R = {yTop, ridgeLen, crossLen, alongZ, rh, ov, rake, th, thatch, profile}
  profile: [{c, y}] from eave to ridge; c is the cross offset from the
  centre line, y the height above the wall top.
*/
function roofAssembly(kit, P, cx, cz, R){
  var half=R.crossLen/2, halfR=R.ridgeLen/2;
  var span=half+R.ov, th=R.th, slabW=R.ridgeLen+2*R.rake, pts=R.profile;
  var ridgeY=R.yTop+R.rh, i, s, e, k;
  function slopeAng(pa,pb){ return Math.atan2(pb.y-pa.y, Math.abs(pb.c-pa.c)); }
  for(s=-1;s<=1;s+=2){
    for(i=0;i<pts.length-1;i++){
      var pa=pts[i], pb=pts[i+1];
      var len=Math.hypot(pb.c-pa.c, pb.y-pa.y)+th*0.35, ang=slopeAng(pa,pb);
      var mc=(pa.c+pb.c)/2, my=R.yTop+(pa.y+pb.y)/2;
      if(R.alongZ) kit.box(P.roof, len, th, slabW, cx+s*mc, my, cz, 0, 0, -s*ang);
      else kit.box(P.roof, slabW, th, len, cx, my, cz+s*mc, 0, s*ang);
      /* barge board along the rake, both ends */
      for(e=-1;e<=1;e+=2){
        if(R.alongZ) kit.box(P.timber, len, 0.32, 0.16, cx+s*mc, my, cz+e*(halfR+R.rake-0.07), 0, 0, -s*ang);
        else kit.box(P.timber, 0.16, 0.32, len, cx+e*(halfR+R.rake-0.07), my, cz+s*mc, 0, s*ang);
      }
    }
    /* fascia board and exposed rafter tails under the eaves */
    var eaveY=R.yTop+pts[0].y;
    if(R.alongZ){
      kit.box(P.timber, 0.15, 0.3, slabW+0.14, cx+s*span, eaveY-0.05, cz);
      for(var u=-halfR+0.9;u<halfR-0.6;u+=1.5) kit.box(P.timber, 0.6, 0.13, 0.13, cx+s*(span-0.28), eaveY-0.17, cz+u);
    } else {
      kit.box(P.timber, slabW+0.14, 0.3, 0.15, cx, eaveY-0.05, cz+s*span);
      for(var u2=-halfR+0.9;u2<halfR-0.6;u2+=1.5) kit.box(P.timber, 0.13, 0.13, 0.6, cx+u2, eaveY-0.17, cz+s*(span-0.28));
    }
    /* thatch brows or shingle courses */
    if(R.thatch){
      if(R.alongZ) kit.box(P.roof2, 0.36, 0.36, slabW, cx+s*span, eaveY+0.13, cz);
      else kit.box(P.roof2, slabW, 0.36, 0.36, cx, eaveY+0.13, cz+s*span);
      for(i=0;i<pts.length-1;i++){
        var ta=pts[i], tb=pts[i+1];
        for(k=1;k<=2;k++){
          var tf=k/3, tc=ta.c+(tb.c-ta.c)*tf, ty=R.yTop+ta.y+(tb.y-ta.y)*tf;
          if(R.alongZ) kit.box(P.roof2, 0.42, 0.08, slabW*0.96, cx+s*tc, ty+0.07, cz, 0, 0, -s*slopeAng(ta,tb));
          else kit.box(P.roof2, slabW*0.96, 0.08, 0.42, cx, ty+0.07, cz+s*tc, 0, s*slopeAng(ta,tb));
        }
      }
    } else {
      for(i=0;i<pts.length-1;i++){
        var qa=pts[i], qb=pts[i+1], dc=qb.c-qa.c, dy=qb.y-qa.y, dl=Math.hypot(dc,dy)||1;
        var nc=dy/dl, ny=-dc/dl;
        for(k=1;k<=3;k++){
          var fq=k/3.6, cc=qa.c+dc*fq, yy=R.yTop+qa.y+dy*fq;
          if(R.alongZ) kit.box(P.roof2, 0.42, 0.07, slabW*0.97, cx+s*(cc+nc*0.07), yy+ny*0.07, cz, 0, 0, -s*slopeAng(qa,qb));
          else kit.box(P.roof2, slabW*0.97, 0.07, 0.42, cx, yy+ny*0.07, cz+s*(cc+nc*0.07), 0, s*slopeAng(qa,qb));
        }
      }
    }
  }
  /* the gable ends are real walls, not open triangles */
  var triH=R.rh-0.06;
  if(triH>0.3){
    for(s=-1;s<=1;s+=2){
      if(R.alongZ) kit.prism(P.wall2, R.crossLen, triH, 0.32, cx, R.yTop+triH/2, cz+s*(halfR-0.16));
      else kit.prism(P.wall2, R.crossLen, triH, 0.32, cx+s*(halfR-0.16), R.yTop+triH/2, cz, Math.PI/2);
      /* a small attic window (or a hay hatch on barns) in each gable */
      if(R.gableWin && triH>1.1){
        var gw=R.gableWin==='hatch'?0.9:0.5, gh=R.gableWin==='hatch'?1.0:0.6, gy=R.yTop+Math.min(triH*0.36, triH-gh/2-0.25);
        if(R.alongZ){ kit.box(P.dark, gw, gh, 0.42, cx, gy, cz+s*(halfR-0.16)); kit.box(P.timber, gw+0.24, 0.1, 0.46, cx, gy+gh/2+0.05, cz+s*(halfR-0.16)); kit.box(P.timber, gw+0.24, 0.1, 0.46, cx, gy-gh/2-0.05, cz+s*(halfR-0.16)); kit.box(P.timber, 0.1, gh+0.2, 0.46, cx-gw/2-0.07, gy, cz+s*(halfR-0.16)); kit.box(P.timber, 0.1, gh+0.2, 0.46, cx+gw/2+0.07, gy, cz+s*(halfR-0.16)); }
        else { kit.box(P.dark, 0.42, gh, gw, cx+s*(halfR-0.16), gy, cz); kit.box(P.timber, 0.46, 0.1, gw+0.24, cx+s*(halfR-0.16), gy+gh/2+0.05, cz); kit.box(P.timber, 0.46, 0.1, gw+0.24, cx+s*(halfR-0.16), gy-gh/2-0.05, cz); kit.box(P.timber, 0.46, gh+0.2, 0.1, cx+s*(halfR-0.16), gy, cz-gw/2-0.07); kit.box(P.timber, 0.46, gh+0.2, 0.1, cx+s*(halfR-0.16), gy, cz+gw/2+0.07); }
      }
    }
  }
  /* ridge: beam under the slabs, cap board over them */
  if(R.alongZ){
    kit.box(P.timber, 0.26, 0.16, slabW, cx, ridgeY-0.05, cz);
    kit.box(P.trim, 0.5, 0.14, slabW+0.26, cx, ridgeY+0.06, cz);
  } else {
    kit.box(P.timber, slabW, 0.16, 0.26, cx, ridgeY-0.05, cz);
    kit.box(P.trim, slabW+0.26, 0.14, 0.5, cx, ridgeY+0.06, cz);
  }
  if(R.thatch){
    /* rounded straw ridge */
    if(R.alongZ) kit.cyln(P.roof2, 0.32, 0.32, slabW+0.36, 8, cx, ridgeY+0.22, cz, 0, 0, Math.PI/2);
    else kit.cyln(P.roof2, 0.32, 0.32, slabW+0.36, 8, cx, ridgeY+0.22, cz, 0, 0, Math.PI/2);
  }
}
function roofProfile(kind, span, rh, eaveDrop){
  if(kind==='long') return [{c:span, y:-eaveDrop},{c:span*0.5, y:rh*0.68},{c:0, y:rh}];
  return [{c:span, y:-eaveDrop},{c:0, y:rh}];
}
/* hip roof ("acoperiș în patru ape"): four slopes, ridge shortened by the hip run, caps on ridge and hips.
   u runs along the ridge, v across it; the mapping to x/z follows R.alongZ like the gable roof. */
function roofHip(kit, P, cx, cz, R){
  var halfR=R.ridgeLen/2+R.ov, halfC=R.crossLen/2+R.ov, ye=R.yTop-0.34, yr=R.yTop+R.rh, th=R.th;
  var rHalf=Math.max(0, halfR-halfC); if(rHalf<0.4) rHalf=0;
  var aZ=R.alongZ, s, i, k;
  function L(u,v,y){ return aZ?[v,y,u]:[u,y,v]; }                 /* local offsets from (cx,cz) */
  function bx(m,lu,h,lv,u,y,v,ru,rv){                            /* box: lu along the ridge, lv across; ru = tilt about the ridge axis, rv = tilt about the cross axis */
    if(aZ) kit.box(m, lv, h, lu, cx+v, y, cz+u, 0, rv||0, -(ru||0)); else kit.box(m, lu, h, lv, cx+u, y, cz+v, 0, ru||0, -(rv||0));
  }
  var angC=Math.atan2(yr-ye, halfC), angE=Math.atan2(yr-ye, halfR-rHalf);
  kit.at(cx,0,cz);
  for(s=-1;s<=1;s+=2){
    /* long slopes (trapezoids) and their undersides */
    kit.quad(P.roof, L(-s*halfR,s*halfC,ye), L(s*halfR,s*halfC,ye), L(s*rHalf,0,yr), L(-s*rHalf,0,yr));
    kit.quad(P.roof2, L(-s*rHalf,0,yr-th), L(s*rHalf,0,yr-th), L(s*halfR,s*halfC,ye-th), L(-s*halfR,s*halfC,ye-th));
    /* hip ends (triangles) */
    kit.tri(P.roof, L(s*halfR,s*halfC,ye), L(s*halfR,-s*halfC,ye), L(s*rHalf,0,yr));
    kit.tri(P.roof2, L(s*rHalf,0,yr-th), L(s*halfR,-s*halfC,ye-th), L(s*halfR,s*halfC,ye-th));
  }
  /* fascia boards and rafter tails on all four eaves */
  for(s=-1;s<=1;s+=2){
    bx(P.timber, 2*halfR+0.14, 0.3, 0.15, 0, ye-0.05, s*halfC);
    bx(P.timber, 0.15, 0.3, 2*halfC+0.14, s*halfR, ye-0.05, 0);
    for(var u=-halfR+0.9;u<halfR-0.6;u+=1.5) bx(P.timber, 0.13, 0.13, 0.6, u, ye-0.17, s*(halfC-0.28));
    for(var v=-halfC+0.9;v<halfC-0.6;v+=1.5) bx(P.timber, 0.6, 0.13, 0.13, s*(halfR-0.28), ye-0.17, v);
  }
  /* courses: shingle lines (or thatch brows) shortened toward the top on every face */
  var nC=R.thatch?2:3, den=R.thatch?3:3.6;
  for(k=1;k<=nC;k++){
    var f=k/den, y=ye+(yr-ye)*f;
    var lu=2*(halfR-f*(halfR-rHalf)), lv=2*halfC*(1-f);
    for(s=-1;s<=1;s+=2){
      bx(P.roof2, lu*0.98, R.thatch?0.09:0.07, 0.42, 0, y+0.07, s*halfC*(1-f), s*angC, 0);
      bx(P.roof2, 0.42, R.thatch?0.09:0.07, lv*0.98, s*(halfR-f*(halfR-rHalf)), y+0.07, 0, 0, s*angE);
    }
  }
  if(R.thatch){
    for(s=-1;s<=1;s+=2){ bx(P.roof2, 2*halfR+0.2, 0.36, 0.36, 0, ye+0.13, s*halfC); bx(P.roof2, 0.36, 0.36, 2*halfC+0.2, s*halfR, ye+0.13, 0); }
  }
  /* ridge and hip caps */
  if(rHalf>0){
    bx(P.timber, 2*rHalf+0.2, 0.16, 0.26, 0, yr-0.05, 0);
    if(R.thatch){ if(aZ) kit.cyln(P.roof2, 0.32, 0.32, 2*rHalf+0.5, 8, cx, yr+0.18, cz, 0, Math.PI/2, 0); else kit.cyln(P.roof2, 0.32, 0.32, 2*rHalf+0.5, 8, cx, yr+0.18, cz, 0, 0, Math.PI/2); }
    else bx(P.trim, 2*rHalf+0.36, 0.14, 0.5, 0, yr+0.06, 0);
  } else { kit.pyr(P.trim, 0.42, 0.5, 4, cx, yr+0.2, cz, Math.PI/4); }
  for(s=-1;s<=1;s+=2) for(var e=-1;e<=1;e+=2){
    var a=L(s*rHalf,0,yr), b=L(s*halfR,e*halfC,ye);
    var dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], hl=Math.hypot(dx,dz), len=Math.hypot(hl,dy);
    var ry=Math.atan2(dx,dz), rx=Math.atan2(-dy,hl);
    if(R.thatch) kit.cyln(P.roof2, 0.22, 0.22, len+0.2, 7, cx+(a[0]+b[0])/2, (a[1]+b[1])/2+0.08, cz+(a[2]+b[2])/2, ry, rx+Math.PI/2, 0);
    else kit.box(P.trim, 0.34, 0.12, len+0.2, cx+(a[0]+b[0])/2, (a[1]+b[1])/2+0.06, cz+(a[2]+b[2])/2, ry, rx, 0);
  }
}

/* ============================================================
   5. Details: plinth, posts, chimney, porch
   ============================================================ */
function structPlinth(kit,P,cx,cz,w,d,y0,doorS,doorW){
  function run(axis,a0,a1,cross,yb,hgt,thick,holes){
    wallRun(kit,P.stone,{axis:axis,a0:a0,a1:a1,cross:cross,y0:yb,top:yb+hgt,t:thick,holes:holes||[]});
  }
  var h1=0.28, h2=0.24;
  run('x',cx-w/2-0.3,cx+w/2+0.3,cz+doorS*(d/2+0.18),y0,h1,0.6,
      doorW?[{c:cx,w:doorW+0.8,b:y0,tp:y0+h1}]:[]);
  run('x',cx-w/2-0.3,cx+w/2+0.3,cz-doorS*(d/2+0.18),y0,h1,0.6);
  run('z',cz-d/2,cz+d/2,cx-(w/2+0.18),y0,h1,0.6);
  run('z',cz-d/2,cz+d/2,cx+(w/2+0.18),y0,h1,0.6);
  run('x',cx-w/2-0.14,cx+w/2+0.14,cz+doorS*(d/2+0.09),y0+h1,h2,0.46,
      doorW?[{c:cx,w:doorW+0.6,b:y0+h1,tp:y0+h1+h2}]:[]);
  run('x',cx-w/2-0.14,cx+w/2+0.14,cz-doorS*(d/2+0.09),y0+h1,h2,0.46);
  run('z',cz-d/2,cz+d/2,cx-(w/2+0.09),y0+h1,h2,0.46);
  run('z',cz-d/2,cz+d/2,cx+(w/2+0.09),y0+h1,h2,0.46);
}
function structPosts(kit,P,cx,cz,w,d,y0,yTop,t,studs){
  /* corner posts, proud of the wall face on both sides of the corner */
  for(var i=-1;i<=1;i+=2) for(var j=-1;j<=1;j+=2)
    kit.box(P.timber, 0.4, yTop-y0-0.1, 0.4, cx+i*(w/2-0.1), y0+(yTop-y0)/2, cz+j*(d/2-0.1));
  function band(y,hgt){
    kit.box(P.timber, w+0.16, hgt, 0.14, cx, y, cz+(d/2+0.02));
    kit.box(P.timber, w+0.16, hgt, 0.14, cx, y, cz-(d/2+0.02));
    kit.box(P.timber, 0.14, hgt, d+0.16, cx+(w/2+0.02), y, cz);
    kit.box(P.timber, 0.14, hgt, d+0.16, cx-(w/2+0.02), y, cz);
  }
  band(y0+0.78, 0.2);
  band(yTop-0.24, 0.22);
}
/* studs and corner braces of one wall, placed only in the solid stretches between openings (half-timbering).
   sp = the wall run spec, holes = its openings, f = outward side. */
function wallStuds(kit,P,sp,holes,f,braces){
  var t=sp.t, off=f*(t/2+0.03), yb=sp.y0+0.9, yt=sp.top-0.36, h=yt-yb, i;
  if(h<0.8) return;
  var edges=[sp.a0+0.2];
  holes.slice().sort(function(a,b){ return a.c-b.c; }).forEach(function(hh){ edges.push(hh.c-hh.w/2-0.3, hh.c+hh.w/2+0.3); });
  edges.push(sp.a1-0.2);
  for(i=0;i<edges.length;i+=2){
    var a=edges[i], b=edges[i+1], L=b-a; if(L<0.7) continue;
    var n=L>3.2?2:1, k;
    for(k=0;k<n;k++){ var u=a+L*(k+1)/(n+1); wallBox(kit,P.timber,sp.axis,u,sp.cross,off,(yb+yt)/2, 0.15, h, 0.12); }
    /* a diagonal brace in the corner panels */
    if(braces && L>1.5 && h>1.4 && (i===0 || i===edges.length-2)){
      var corner=(i===0)?a:b, dir=(i===0)?1:-1, bl=Math.min(1.5, L-0.3), bu=corner+dir*bl/2, by=yb+0.75;
      var ang=Math.atan2(bl, 1.3)*dir;
      if(sp.axis==='x') kit.box(P.timber, 0.14, Math.hypot(bl,1.3), 0.12, bu, by, sp.cross+off, 0, 0, -ang);
      else kit.box(P.timber, 0.12, Math.hypot(bl,1.3), 0.14, sp.cross+off, by, bu, 0, ang, 0);
    }
  }
}
/* plastered houses: a painted band (brâu) below the windows and stone quoins at the corners */
function wallBand(kit,P,cx,cz,w,d,y0,yTop){
  var y=y0+0.95;
  kit.box(P.trim, w+0.2, 0.16, 0.12, cx, y, cz+(d/2+0.02)); kit.box(P.trim, w+0.2, 0.16, 0.12, cx, y, cz-(d/2+0.02));
  kit.box(P.trim, 0.12, 0.16, d+0.2, cx+(w/2+0.02), y, cz); kit.box(P.trim, 0.12, 0.16, d+0.2, cx-(w/2+0.02), y, cz);
  for(var i=-1;i<=1;i+=2) for(var j=-1;j<=1;j+=2) kit.box(P.stone, 0.34, yTop-y0-0.3, 0.34, cx+i*(w/2-0.09), y0+(yTop-y0)/2-0.1, cz+j*(d/2-0.09));
}
function structChimney(kit,P,cx,cz,R,u,thatch){
  var yTop=R.yTop, top=yTop+R.rh+(thatch?0.8:0.66), w=thatch?0.95:0.84;
  var x=R.alongZ?cx:cx+u, z=R.alongZ?cz+u:cz;
  kit.box(P.stone, w, top-yTop+0.5, w, x, (yTop-0.5+top)/2, z);
  kit.box(P.stone, w+0.22, 0.18, w+0.22, x, top-0.6, z);
  kit.box(P.stone, w+0.34, 0.16, w+0.34, x, top+0.02, z);
  kit.box(P.dark, w*0.46, 0.22, w*0.46, x, top+0.13, z);
  var cwp=kit.toWorld(x,z); regChimney(cwp.x, top+0.3, cwp.z, 1);
}
function structPorch(kit,P,cx,cz,w,d,y0,doorS,doorW,t,deep){
  var fz=cz+doorS*(d/2-t/2), hh=2.8, sw=deep||1.35, pw=doorW+1.6, i, s;
  for(s=-1;s<=1;s+=2){
    kit.box(P.timber, 0.24, hh, 0.24, cx+s*(pw/2-0.12), y0+hh/2, fz+doorS*(sw-0.22));
    kit.box(P.timber, 0.16, 0.36, sw+0.24, cx+s*(pw/2-0.12), y0+hh+0.16, fz+doorS*(sw/2-0.1));
    kit.collider(cx+s*(pw/2-0.12)-0.12, fz+doorS*(sw-0.22)-0.12, cx+s*(pw/2-0.12)+0.12, fz+doorS*(sw-0.22)+0.12);
  }
  kit.box(P.roof, pw+0.55, 0.16, sw+0.55, cx, y0+hh+0.32, fz+doorS*(sw/2-0.05), 0, doorS*0.22);
  kit.box(P.timber, pw+0.55, 0.15, 0.15, cx, y0+hh+0.26, fz+doorS*(sw+0.2));
  /* railing either side of the steps — the doorway itself stays open */
  var railL=(pw-0.3)/2-(doorW/2+0.25);
  if(railL>0.3){
    for(s=-1;s<=1;s+=2){
      var rc=cx+s*(doorW/2+0.25+railL/2);
      kit.box(P.timber, railL, 0.13, 0.12, rc, y0+1.08, fz+doorS*(sw-0.18));
      for(i=0;i<Math.max(1,Math.round(railL/0.45));i++) kit.box(P.timber, 0.1, 1.02, 0.1, cx+s*(doorW/2+0.4+i*0.45), y0+0.56, fz+doorS*(sw-0.18));
    }
  }
  kit.box(P.stone, doorW+1.0, 0.16, 0.5, cx, y0+0.32, fz+doorS*(sw+0.36));
  kit.box(P.stone, doorW+1.4, 0.16, 0.5, cx, y0+0.16, fz+doorS*(sw+0.82));
}

/* the prispă: a roofed gallery along the whole door wall — deck, carved posts, railing, lean-to roof, steps */
function structPrispa(kit,P,cx,cz,w,d,y0,yTop,t,doorW,rng){
  var fz=cz+d/2, depth=1.8, pw=w+0.5, deckY=y0+0.22, i, k;
  kit.box(P.stone, pw+0.2, 0.3, depth+0.2, cx, y0+0.02, fz+depth/2);
  kit.box(P.timber, pw, 0.1, depth, cx, deckY-0.05, fz+depth/2);
  var eaveY=yTop-0.34, postZ=fz+depth-0.2, rlen=postZ+0.55-(fz-0.15), drop=0.36;
  var beamY=eaveY-drop-0.32, postH=beamY-deckY-0.1;
  /* bays: the door bay in the middle, then ~2.2u bays either side */
  var xs=[cx-doorW/2-0.55, cx+doorW/2+0.55];
  for(var side=-1;side<=1;side+=2){
    var edge=cx+side*(pw/2-0.12), from=cx+side*(doorW/2+0.55), L=Math.abs(edge-from), n=Math.max(1,Math.round(L/2.2));
    for(i=1;i<=n;i++) xs.push(from+side*(L*i/n));
  }
  xs.sort(function(a,b){ return a-b; });
  xs.forEach(function(u){
    kit.box(P.timber, 0.22, postH, 0.22, u, deckY+postH/2, postZ);
    kit.box(P.trim, 0.34, 0.14, 0.34, u, deckY+postH+0.07, postZ);
    kit.box(P.timber, 0.16, 0.16, 0.7, u, deckY+postH-0.12, postZ-0.25, 0, -0.5);
    if(Math.abs(u-cx)<doorW/2+0.7) kit.collider(u-0.11, postZ-0.11, u+0.11, postZ+0.11);   /* the door-bay posts; the railings cover the others */
  });
  kit.box(P.timber, pw+0.3, 0.2, 0.22, cx, beamY, postZ);
  var ang=Math.atan2(drop, rlen);
  kit.box(P.roof, pw+0.8, 0.13, Math.hypot(rlen,drop), cx, eaveY-0.1-drop/2, (fz-0.15+postZ+0.55)/2, 0, ang);
  kit.box(P.roof2, pw*0.98, 0.06, 0.4, cx, eaveY-0.1-drop*0.8+0.05, postZ+0.2, 0, ang);
  kit.box(P.timber, pw+0.8, 0.18, 0.12, cx, eaveY-0.18-drop, postZ+0.6);
  /* railing in every bay but the door bay */
  for(i=0;i<xs.length-1;i++){
    var a=xs[i], b=xs[i+1]; if(a<cx && b>cx) continue;
    var mid=(a+b)/2, L2=b-a-0.22; if(L2<0.3) continue;
    kit.box(P.timber, L2, 0.1, 0.1, mid, deckY+0.98, postZ);
    kit.box(P.timber, L2, 0.08, 0.08, mid, deckY+0.42, postZ);
    var nb=Math.max(1,Math.floor(L2/0.36));
    for(k=0;k<nb;k++) kit.box(P.trim, 0.07, 0.5, 0.07, a+0.11+(k+0.5)*(L2/nb), deckY+0.7, postZ);
    kit.collider(a, postZ-0.06, b, postZ+0.06);
  }
  for(var sx=-1;sx<=1;sx+=2){
    var ex=cx+sx*(pw/2-0.12);
    kit.box(P.timber, 0.1, 0.1, depth-0.5, ex, deckY+0.98, fz+depth/2-0.15); kit.box(P.timber, 0.08, 0.08, depth-0.5, ex, deckY+0.42, fz+depth/2-0.15);
    for(k=0;k<3;k++) kit.box(P.trim, 0.07, 0.5, 0.07, ex, deckY+0.7, fz+0.3+k*0.45);
    kit.collider(ex-0.06, fz, ex+0.06, postZ);
  }
  /* steps out of the door bay, and a bench on the deck beside the door */
  kit.box(P.stone, doorW+1.0, 0.14, 0.5, cx, deckY-0.09, postZ+0.45);
  kit.box(P.stone, doorW+1.4, 0.1, 0.5, cx, y0+0.05, postZ+0.9);
  if(rng()<0.7 && w>5.5) structBench(kit,P,cx+(rng()<0.5?-1:1)*(doorW/2+1.1),deckY,fz+0.32,w);
}
/* a little wooden bench (băncuță) against the door wall */
function structBench(kit,P,u,y,z,w){
  kit.box(P.timber, 1.3, 0.07, 0.36, u, y+0.46, z);
  kit.box(P.timber, 0.08, 0.44, 0.3, u-0.55, y+0.22, z); kit.box(P.timber, 0.08, 0.44, 0.3, u+0.55, y+0.22, z);
  kit.collider(u-0.65, z-0.18, u+0.65, z+0.18);
}
/* extras: log courses, buttresses, battlements, corner tower, dome, arcade, hanging sign */
function structExtras(kit,P,o,cx,cz,w,d,y0,yTop,t,doorS,doorW,rng){
  var i, s, h=yTop-y0;
  if(o.style==='log'){
    var n=Math.floor(h/0.62);
    for(i=1;i<n;i++){
      var yy=y0+i*0.62;
      kit.box(P.timber, w+0.3, 0.12, 0.1, cx, yy, cz+(d/2+0.02)); kit.box(P.timber, w+0.3, 0.12, 0.1, cx, yy, cz-(d/2+0.02));
      kit.box(P.timber, 0.1, 0.12, d+0.3, cx+(w/2+0.02), yy, cz); kit.box(P.timber, 0.1, 0.12, d+0.3, cx-(w/2+0.02), yy, cz);
    }
    for(s=-1;s<=1;s+=2) for(var q=-1;q<=1;q+=2) kit.cyln(P.timber, 0.2, 0.2, h+0.3, 6, cx+s*(w/2+0.05), y0+h/2, cz+q*(d/2+0.05));
  }
  if(o.buttress){
    var nb=Math.max(2,Math.floor(d/5));
    for(i=0;i<nb;i++){ var bz=cz-d/2+1.2+i*(d-2.4)/(nb-1); for(s=-1;s<=1;s+=2){ kit.box(P.stone, 1.0, h*0.7, 0.9, cx+s*(w/2+0.45), y0+h*0.35, bz); kit.prism(P.stone, 1.0, 1.2, 0.9, cx+s*(w/2+0.45), y0+h*0.7+0.6, bz, 0, 0, 0, s>0?-1:1); kit.collider(cx+s*(w/2+0.45)-0.5, bz-0.45, cx+s*(w/2+0.45)+0.5, bz+0.45); } }
  }
  if(o.battlements){
    var m=Math.floor(w/1.6), k=Math.floor(d/1.6);
    for(i=0;i<m;i++){ var ux=cx-w/2+0.8+i*(w-1.6)/(m-1); if(i%2) continue; kit.box(P.wall, 0.9, 1.1, 0.5, ux, yTop+0.85, cz+d/2+0.05); kit.box(P.wall, 0.9, 1.1, 0.5, ux, yTop+0.85, cz-d/2-0.05); }
    for(i=0;i<k;i++){ var uz=cz-d/2+0.8+i*(d-1.6)/(k-1); if(i%2) continue; kit.box(P.wall, 0.5, 1.1, 0.9, cx+w/2+0.05, yTop+0.85, uz); kit.box(P.wall, 0.5, 1.1, 0.9, cx-w/2-0.05, yTop+0.85, uz); }
    kit.box(P.stone, w+0.7, 0.35, d+0.7, cx, yTop+0.32, cz);
  }
  if(o.tower){
    var tw=Math.min(4.2, w*0.22), tx=cx-w/2+tw/2+0.3, tz=cz-doorS*(d/2-tw/2-0.3), th=h+tw*1.4;
    kit.box(P.wall, tw, th, tw, tx, y0+th/2, tz);
    kit.box(P.trim, tw+0.3, 0.26, tw+0.3, tx, y0+th, tz);
    for(i=0;i<3;i++){ kit.box(P.dark, 0.4, 0.8, 0.2, tx, y0+th*0.5+i*1.6, tz+doorS*(tw/2+0.02)); }
    kit.pyr(P.roof, tw*0.85, tw*1.3, 4, tx, y0+th+0.26+tw*0.65, tz, Math.PI/4);
    kit.box(M2(COL_GOLD), 0.1, 1.0, 0.1, tx, y0+th+0.26+tw*1.3+0.5, tz);
  }
  if(o.dome){
    var r=Math.min(w,d)*0.24, dy=(o.roof==='flat')?yTop+0.3:yTop+Math.max(0.9,(Math.min(w,d)/2+0.6)*0.7)+0.2, dm=M2(o.domeCol||0x3f7a5e);
    kit.cyln(P.wall, r*0.9, r*0.95, 2.2, 12, cx, dy+1.1, cz);
    for(i=0;i<4;i++) kit.box(P.dark, 0.5, 1.1, 0.2, cx+Math.cos(i*Math.PI/2)*r*0.9, dy+1.2, cz+Math.sin(i*Math.PI/2)*r*0.9, -i*Math.PI/2);
    kit.cyln(dm, r*1.0, r*1.05, 0.5, 12, cx, dy+2.45, cz); kit.cyln(dm, r*0.82, r*1.0, 0.6, 12, cx, dy+3.0, cz); kit.cyln(dm, r*0.52, r*0.82, 0.55, 12, cx, dy+3.55, cz); kit.cyln(dm, r*0.15, r*0.52, 0.45, 12, cx, dy+4.05, cz);
    kit.box(M2(COL_GOLD), 0.12, 1.4, 0.12, cx, dy+5.0, cz); kit.box(M2(COL_GOLD), 0.7, 0.12, 0.12, cx, dy+5.3, cz);
  }
  if(o.arcade){
    var fz=cz+doorS*(d/2+1.6), nc=Math.max(3,Math.floor(w/3.2)), ch=Math.min(3.6,h*0.55);
    kit.box(P.stone, w+0.8, 0.25, 3.4, cx, y0+0.12, cz+doorS*(d/2+1.7));
    for(i=0;i<=nc;i++){ var ax=cx-w/2+i*(w/nc); if(Math.abs(ax-cx)<doorW/2+0.6&&i!==0&&i!==nc) continue; kit.cyln(P.stone, 0.28, 0.32, ch, 8, ax, y0+ch/2, fz); kit.box(P.stone, 0.7, 0.2, 0.7, ax, y0+ch+0.1, fz); kit.collider(ax-0.32,fz-0.32,ax+0.32,fz+0.32); }
    kit.box(P.timber, w+0.8, 0.3, 0.3, cx, y0+ch+0.3, fz);
    kit.box(P.roof, w+1.2, 0.16, 3.6, cx, y0+ch+0.55, cz+doorS*(d/2+1.8), 0, doorS*0.16);
  }
  if(o.sign){
    var sx=cx+doorW/2+1.2, sy=y0+2.6, sz=cz+doorS*(d/2+0.02);
    kit.box(P.dark, 0.06, 0.06, 0.9, sx, sy+0.35, sz+doorS*0.45);
    var sc={wolf:0x7a3434, butcher:0x8a3a2a, tailor:0x2f5a7a, spice:0xc46a2a, bookseller:0x5b4a86, armorer:0x50565e, horsetrader:0x7a5c39}[o.sign]||0x7a5c39;
    kit.box(M2(sc), 0.9, 0.7, 0.06, sx, sy-0.1, sz+doorS*0.85); kit.box(P.trim, 1.0, 0.8, 0.04, sx, sy-0.1, sz+doorS*0.84);
  }
}

/* ============================================================
   6. Temple and church crowns
   ============================================================ */
/* peripteral temple: crepidoma, columns, entablature, pediment */
function structTempleRoof(kit,P,o,cx,cz,w,d,yTop){
  var col=M2(o.colCol||0xe8e0cf), i, u, z, steps=3;
  for(i=0;i<steps;i++){
    kit.box(P.stone, w+1.6+i*0.7, 0.26, d+1.6+i*0.7, cx, yTop-steps*0.26+0.13+i*0.26, cz);
  }
  var baseY=yTop+0.02, colH=o.colH||Math.max(3.2, o.h*0.62);
  var nFront=clamp(Math.round(w/2.4),4,8), nSide=clamp(Math.round(d/2.6),3,7);
  function column(x,zz){
    kit.cyln(P.stone, 0.44, 0.5, 0.2, 10, x, baseY+0.1, zz);
    kit.cyln(col, 0.33, 0.4, colH, 10, x, baseY+0.2+colH/2, zz);
    kit.cyln(col, 0.5, 0.36, 0.28, 10, x, baseY+0.2+colH+0.14, zz);
    kit.box(P.stone, 0.8, 0.14, 0.8, x, baseY+0.2+colH+0.35, zz);
  }
  for(i=0;i<nFront;i++){
    u=cx-w/2+0.6+i*((w-1.2)/(nFront-1));
    column(u, cz+(d/2+0.6));
    column(u, cz-(d/2+0.6));
  }
  for(i=1;i<nSide-1;i++){
    z=cz-d/2-0.6+i*((d+1.2)/(nSide-1));
    column(cx+(w/2+0.6), z);
    column(cx-(w/2+0.6), z);
  }
  var entY=baseY+0.2+colH+0.42;
  kit.box(col, w+2.5, 0.5, d+2.5, cx, entY+0.25, cz);
  kit.box(P.stone, w+2.7, 0.62, d+2.7, cx, entY+0.81, cz);
  kit.box(col, w+3.4, 0.3, d+3.4, cx, entY+1.27, cz);
  var pedY=entY+1.42, pedH=Math.max(1.5,(w+3.4)*0.18);
  kit.prism(P.stone, w+3.4, pedH, d+3.4, cx, pedY+pedH/2, cz);
  kit.prism(P.dark, w+2.4, pedH*0.7, d+2.4, cx, pedY+pedH*0.35-0.03, cz);
  kit.pyr(col, 0.32, 0.62, 6, cx-(w+3.4)/2, pedY+0.31, cz);
  kit.pyr(col, 0.32, 0.62, 6, cx+(w+3.4)/2, pedY+0.31, cz);
  kit.pyr(col, 0.38, 0.82, 6, cx, pedY+pedH+0.32, cz);
}
/* Moldavian church: altar apse, brâu band, entrance tower, dome, cross */
function structChurchCrown(kit,P,o,cx,cz,w,d,yTop,rh,doorS){
  var domeM=M2(0x3f7a5e), gold=M2(COL_GOLD), gy=groundH(cx,cz), i;
  var sc=clamp(w/10, 1, 2.6), ar=clamp(w*0.16, 1.5, 4.2), ah=Math.min(o.h*0.75, 3.0*sc+1);
  /* altar apse at the far end */
  kit.cyln(P.wall, ar, ar+0.1, ah, 12, cx, gy+ah/2, cz-doorS*(d/2+ar*0.55));
  kit.cyln(P.roof, 0.12, ar+0.25, ar*0.9, 12, cx, gy+ah+ar*0.45, cz-doorS*(d/2+ar*0.55));
  kit.collider(cx-ar, cz-doorS*(d/2+ar*0.55)-ar, cx+ar, cz-doorS*(d/2+ar*0.55)+ar);   /* the apse is a wall too */
  /* portal: arch and a round window over the door */
  var fz=cz+doorS*(d/2+0.02), dw=clamp(w*0.14,1.6,3.2)+0.9, dh=clamp(o.h*0.36,2.4,4.6);
  kit.box(P.stone, dw+0.9, 0.35, 0.5, cx, gy+dh+0.45, fz);
  kit.box(P.stone, 0.4, dh+0.5, 0.5, cx-dw/2-0.25, gy+(dh+0.5)/2, fz); kit.box(P.stone, 0.4, dh+0.5, 0.5, cx+dw/2+0.25, gy+(dh+0.5)/2, fz);
  kit.cyln(P.stone, dw*0.55, dw*0.55, 0.4, 12, cx, gy+dh+0.5, fz, 0, Math.PI/2, 0);
  kit.cyln(P.dark, dw*0.42, dw*0.42, 0.44, 12, cx, gy+dh+0.5, fz, 0, Math.PI/2, 0);
  if(o.h>7){ kit.cyln(P.stone, w*0.11, w*0.11, 0.3, 14, cx, gy+o.h*0.7, fz, 0, Math.PI/2, 0); kit.cyln(P.pane, w*0.085, w*0.085, 0.34, 14, cx, gy+o.h*0.7, fz, 0, Math.PI/2, 0); for(i=0;i<6;i++) kit.box(P.dark, 0.1, w*0.19, 0.36, cx, gy+o.h*0.7, fz, 0, 0, i*Math.PI/6); }
  /* the twisted brâu belt around the nave */
  var by=gy+o.h*0.6;
  kit.box(P.trim, w+0.5, 0.3, 0.17, cx, by, cz+(d/2-0.17));
  kit.box(P.trim, w+0.5, 0.3, 0.17, cx, by, cz-(d/2-0.17));
  kit.box(P.trim, 0.17, 0.3, d+0.5, cx+(w/2-0.17), by, cz);
  kit.box(P.trim, 0.17, 0.3, d+0.5, cx-(w/2-0.17), by, cz);
  /* bell tower over the entrance, scaled with the nave */
  var tw=3.4*sc, tz=cz+doorS*(d/2-tw/2-0.3), ty=yTop+rh*0.3, th=3.6*sc;
  kit.box(P.wall, tw, th+rh*0.3+0.2, tw, cx, ty-rh*0.15+th/2, tz);
  kit.box(P.trim, tw+0.3, 0.26, tw+0.3, cx, ty+th+0.1, tz);
  kit.cyln(P.wall, 1.2*sc, 1.28*sc, 1.5*sc, 10, cx, ty+th+0.85*sc+0.1, tz);
  kit.pyr(domeM, 1.4*sc, 2.2*sc, 12, cx, ty+th+1.6*sc+1.1*sc+0.1, tz);
  kit.cyln(P.roof, 0.34*sc, 0.42*sc, 0.32, 8, cx, ty+th+3.8*sc+0.2, tz);
  kit.box(gold, 0.11, 1.2*sc, 0.11, cx, ty+th+3.8*sc+0.8*sc+0.3, tz);
  kit.box(gold, 0.66*sc, 0.11, 0.11, cx, ty+th+3.8*sc+1.05*sc+0.3, tz);
  for(i=-1;i<=1;i+=2){
    kit.box(P.dark, 0.55*sc, 1.0*sc, 0.18, cx+i*0.8*sc, ty+th*0.7, tz+doorS*(tw/2+0.04));
    kit.box(P.dark, 0.18, 1.0*sc, 0.55*sc, cx+tw/2+0.04, ty+th*0.7, tz+i*0.8*sc);
    kit.box(P.dark, 0.18, 1.0*sc, 0.55*sc, cx-tw/2-0.04, ty+th*0.7, tz+i*0.8*sc);
  }
  /* side domes on big churches */
  if(sc>1.6){ for(i=-1;i<=1;i+=2){ kit.cyln(P.wall, 1.1*sc, 1.15*sc, 1.4*sc, 10, cx+i*w*0.3, yTop+rh*0.55+0.7*sc, cz); kit.pyr(domeM, 1.3*sc, 1.8*sc, 12, cx+i*w*0.3, yTop+rh*0.55+1.4*sc+0.9*sc, cz); kit.box(gold, 0.1, 0.9*sc, 0.1, cx+i*w*0.3, yTop+rh*0.55+1.4*sc+1.8*sc+0.4*sc, cz); } }
}

/* ============================================================
   7. The shell
   ============================================================ */
/*
  o = {x,z,w,d,h,wall,roofCol,roof,door,timber,stone,trim,pane,floorCol,
       porch,chimney,studs,seed,windows,doorW,doorH,sill,winW,winH,maxWin,rh}
  Returns {yTop, ridgeY, meshes}.
*/
function doorAngle(side){ return side==='N'?Math.PI:side==='E'?Math.PI/2:side==='W'?-Math.PI/2:0; }
function structShell(o){
  var cx=o.x, cz=o.z, w=o.w, d=o.d, h=o.h;
  var gy=(o.y!==undefined)?o.y:groundH(cx,cz), y0=gy, yTop=gy+h;
  var P=structPal(o);
  var own=false;
  var kit=o.kit||SITE_KIT||cellKit(cx,cz);
  /* the shell is built with its door on the local south side; the frame turns it N/E/W */
  var fang=doorAngle(o.door||'S');
  kit.frame(cx,cz,fang);
  var rng=seedRand(o.seed===undefined?(Math.abs(Math.round(cx*7.3+cz*13.1))||3):o.seed);
  var t=0.34, doorS=1;
  var style=o.roof||'gable';
  var alongZ=(d>w+0.5);
  var ridgeLen=alongZ?d:w, crossLen=alongZ?w:d;
  var church=(o.roof==='church'), grand=(w>=18||h>=9);
  var doorW=(o.doorW!==undefined)?o.doorW:(church||grand)?clamp(w*0.14, 1.6, 3.2):clamp(Math.min(1.55, w*0.3), 1.15, 2.4);
  var doorH=o.doorH||((church||grand)?clamp(h*0.36, 2.4, 4.6):clamp(h-1.0, 1.95, 2.5));
  var thatch=(style==='thatch'||style==='hipthatch'), hip=(style==='hip'||style==='hipthatch');
  var ov=thatch?0.8:(hip?0.75:0.6), rake=0.44, th=thatch?0.42:0.22;
  var rh=(o.rh!==undefined)?o.rh:Math.max(0.9,(crossLen/2+ov)*(thatch?0.84:(hip?0.62:0.7)));
  var R={yTop:yTop, ridgeLen:ridgeLen, crossLen:crossLen, alongZ:alongZ,
         rh:rh, ov:ov, rake:rake, th:th, thatch:thatch, gableWin:o.gableWin,
         profile:roofProfile(style, crossLen/2+ov, rh, 0.34)};
  var frontIn=cz+doorS*(d/2-t/2), backIn=cz-doorS*(d/2-t/2);
  var wallOpt={sill:o.sill||(church?1.9:grand?1.4:1.15), winH:o.winH||(church?clamp(h*0.42,1.6,3.4):grand?1.5:1.15), winW:o.winW||(church?1.1:0.95),
               doorH:doorH, maxWin:o.maxWin||clamp(Math.round(w/4.2),2,8)};
  var i, holes, sp;

  kit.box(P.floor, w+0.5, 0.24, d+0.5, cx, gy+0.1, cz);
  /* foundation skirt: reaches down into sloping ground so no house floats on a hillside */
  kit.box(P.stone, w+0.5, 1.4, d+0.5, cx, y0-0.45, cz);
  structPlinth(kit,P,cx,cz,w,d,y0,doorS,doorW);
  var framed=o.studs!==false && !church && (w>6.5||o.timberFrame) && o.style!=='log' && o.style!=='plaster';

  /* ---- four walls, each with real openings; tall buildings get a second row of windows ---- */
  var two=(o.floors>=2 && h>=5.4), ySplit=two?y0+h*0.52:yTop;
  var lowTop=two?ySplit:yTop;
  function wallWithRows(axis,a0,a1,cross,f,doorWidth,noWin,maxWin){
    var hl=noWin?[]:wallHoles(a0,a1,doorWidth,y0,lowTop,{sill:wallOpt.sill,winH:wallOpt.winH,winW:wallOpt.winW,doorH:doorH,maxWin:maxWin});
    if(noWin&&doorWidth) hl=wallHoles(a0,a1,doorWidth,y0,lowTop,{sill:wallOpt.sill,winH:wallOpt.winH,winW:wallOpt.winW,doorH:doorH,maxWin:maxWin}).filter(function(hh){ return hh.kind==='door'; });
    var spl={axis:axis, a0:a0, a1:a1, cross:cross, y0:y0, top:lowTop, t:t, holes:hl, f:f, leaf:o.leaf, pane:o.pane!==null};
    wallRun(kit,P.wall,spl);
    for(var k=0;k<hl.length;k++) openingTrim(kit,P,spl,hl[k],rng);
    if(framed) wallStuds(kit,P,spl,hl,f,o.timberFrame||o.braces);
    if(two){
      var hu=noWin?[]:wallHoles(a0,a1,0,ySplit,yTop,{sill:0.75,winH:Math.min(wallOpt.winH,yTop-ySplit-1.3),winW:wallOpt.winW*0.9,maxWin:Math.max(maxWin,3)});
      var spu={axis:axis, a0:a0, a1:a1, cross:cross, y0:ySplit, top:yTop, t:t, holes:hu, f:f, pane:o.pane!==null};
      wallRun(kit,P.wall,spu);
      for(var k2=0;k2<hu.length;k2++) openingTrim(kit,P,spu,hu[k2],rng);
      if(framed) wallStuds(kit,P,spu,hu,f,o.timberFrame||o.braces);
      /* floor band between storeys */
      if(axis==='x') kit.box(P.timber, a1-a0, 0.22, t+0.12, (a0+a1)/2, ySplit, cross); else kit.box(P.timber, t+0.12, 0.22, a1-a0, cross, ySplit, (a0+a1)/2);
    }
  }
  wallWithRows('x', cx-w/2, cx+w/2, frontIn, doorS, (o.doorW===0)?0:doorW, false, wallOpt.maxWin);
  wallWithRows('x', cx-w/2, cx+w/2, backIn, -doorS, o.backDoor?doorW:0, o.windows===false, wallOpt.maxWin);
  for(var sx=-1;sx<=1;sx+=2){
    wallWithRows('z', cz-d/2+t, cz+d/2-t, cx+sx*(w/2-t/2), sx, 0, o.windows===false, clamp(Math.round(d/4.2),1,5));
  }
  if(framed) structPosts(kit,P,cx,cz,w,d,y0,yTop,t,true);
  else if(o.style==='plaster' || (o.band && !church)) wallBand(kit,P,cx,cz,w,d,y0,yTop);
  structExtras(kit,P,o,cx,cz,w,d,y0,yTop,t,doorS,doorW,rng);

  /* ---- roof ---- */
  if(style==='temple'){
    structTempleRoof(kit,P,o,cx,cz,w,d,yTop);
  } else if(style==='flat'){
    kit.box(P.roof, w+0.6, 0.3, d+0.6, cx, yTop+0.12, cz);
    kit.box(P.trim, w+0.9, 0.3, 0.22, cx, yTop+0.4, cz+(d/2+0.28));
    kit.box(P.trim, w+0.9, 0.3, 0.22, cx, yTop+0.4, cz-(d/2+0.28));
    kit.box(P.trim, 0.22, 0.3, d+0.9, cx+(w/2+0.28), yTop+0.4, cz);
    kit.box(P.trim, 0.22, 0.3, d+0.9, cx-(w/2+0.28), yTop+0.4, cz);
    if(o.chimney!==false) structChimney(kit,P,cx,cz,{yTop:yTop,rh:0.4,alongZ:false},0,false);
  } else {
    if(hip) roofHip(kit,P,cx,cz,R); else roofAssembly(kit,P,cx,cz,R);
    if(o.chimney!==false) structChimney(kit,P,cx,cz,R,ridgeLen*0.29,thatch);
    if(o.chimney!==false && o.chimney2) structChimney(kit,P,cx,cz,R,-ridgeLen*0.29,thatch);
    if(style==='church') structChurchCrown(kit,P,o,cx,cz,w,d,yTop,rh,doorS);
    if(style==='long'){
      for(var s2=-1;s2<=1;s2+=2){
        var fy=yTop+rh+0.34, fz2=cz+s2*(d/2-rake-0.12);
        kit.box(P.timber, 0.18, 0.95, 0.18, cx-0.4, fy, fz2);
        kit.box(P.timber, 0.18, 0.95, 0.18, cx+0.4, fy, fz2);
        kit.box(P.trim, 0.55, 0.32, 0.55, cx, fy+0.55, fz2, s2>0?0.55:-0.55);
      }
    }
  }

  /* ---- porch: the full-length prispă, or the small pridvor over the door ---- */
  if(o.prispa && !o.arcade){ structPrispa(kit,P,cx,cz,w,d,y0,yTop,t,doorW,rng); }
  else {
    var wantPorch=o.porch!==false && !o.arcade && (style==='gable'||style==='thatch'||style==='hall'||style==='hip'||style==='hipthatch');
    if(wantPorch) structPorch(kit,P,cx,cz,w,d,y0,doorS,doorW,t,o.porch);
    if(o.bench && w>5.5) structBench(kit,P,cx+(rng()<0.5?-1:1)*(doorW/2+1.2+(wantPorch?0.6:0)),y0,cz+d/2+0.25,w);
  }

  var meshes=0;
  if(own && !o.deferFlush){ meshes=kit.flush(o.parent||PROP_PARENT||scene); kit.frame(0,0,0); }
  return {yTop:yTop, ridgeY:yTop+rh, meshes:meshes, pal:P, kit:kit, own:own, y0:y0, doorW:doorW, doorH:doorH, ang:fang, t:t};
}

/* ============================================================
   8. Collision footprints — same planes as the original walls
   ============================================================ */
function wallColliders(cx,cz,w,d,h,doorSide,gapW,backDoor){
  /* w along x, d along z for S/N doors; for E/W the building is turned, so swap */
  var t=0.35, gap=gapW||2.0, side=doorSide||'S';
  var opp={S:'N',N:'S',E:'W',W:'E'}[side];
  var hx=(side==='E'||side==='W')?d/2:w/2, hz=(side==='E'||side==='W')?w/2:d/2;
  function wallOf(sd,gapped){
    if(sd==='N'){ if(!gapped) addCollider(cx-hx, cz-hz, cx+hx, cz-hz+t); else { addCollider(cx-hx, cz-hz, cx-gap/2, cz-hz+t); addCollider(cx+gap/2, cz-hz, cx+hx, cz-hz+t); } }
    if(sd==='S'){ if(!gapped) addCollider(cx-hx, cz+hz-t, cx+hx, cz+hz); else { addCollider(cx-hx, cz+hz-t, cx-gap/2, cz+hz); addCollider(cx+gap/2, cz+hz-t, cx+hx, cz+hz); } }
    if(sd==='W'){ if(!gapped) addCollider(cx-hx, cz-hz, cx-hx+t, cz+hz); else { addCollider(cx-hx, cz-hz, cx-hx+t, cz-gap/2); addCollider(cx-hx, cz+gap/2, cx-hx+t, cz+hz); } }
    if(sd==='E'){ if(!gapped) addCollider(cx+hx-t, cz-hz, cx+hx, cz+hz); else { addCollider(cx+hx-t, cz-hz, cx+hx, cz-gap/2); addCollider(cx+hx-t, cz+gap/2, cx+hx, cz+hz); } }
  }
  ['N','S','E','W'].forEach(function(sd){ wallOf(sd, sd===side || (backDoor && sd===opp)); });
}
/* world position of the door threshold (just outside the wall) */
function doorPoint(o,out){
  var side=o.door||'S', dist=out||0;
  var hx=(side==='E'||side==='W')?o.d/2:o.w/2, hz=(side==='E'||side==='W')?o.w/2:o.d/2;
  if(side==='S') return {x:o.x, z:o.z+hz+dist};
  if(side==='N') return {x:o.x, z:o.z-hz-dist};
  if(side==='E') return {x:o.x+hx+dist, z:o.z};
  return {x:o.x-hx-dist, z:o.z};
}
/* world footprint half sizes */
function shellHalf(o){ var side=o.door||'S'; var e=(side==='E'||side==='W'); return {hx:e?o.d/2:o.w/2, hz:e?o.w/2:o.d/2}; }


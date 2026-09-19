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
  function bag(m){ var b=bags.get(m); if(!b){ b={p:[],n:[],u:[]}; bags.set(m,b); } return b; }
  function place(x,y,z,rx,ry,rz){ tx=x||0; ty=y||0; tz=z||0; eul.set(rx||0,ry||0,rz||0); quat.setFromEuler(eul); }
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
  return {box:box, prism:prism, cyln:cyln, pyr:pyr, tri:tri, quad:quad, flush:flush};
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
    pane:   M2(o.pane||ARCH_PANE),
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
    wallBox(kit,P.trim,axis,u,cross,-f*0.02,b+hh/2, w-0.1, hh-0.04, 0.13);
    wallBox(kit,P.dark,axis,u-w*0.3,cross,f*(t*0.5-0.02),b+hh/2, 0.05, hh-0.24, 0.05);
    wallBox(kit,P.dark,axis,u+w*0.3,cross,f*(t*0.5-0.02),b+hh/2, 0.05, hh-0.24, 0.05);
    wallBox(kit,P.timber,axis,u,cross,f*(t*0.5-0.03),b+hh*0.22, w-0.12, 0.11, 0.17);
    wallBox(kit,P.timber,axis,u,cross,f*(t*0.5-0.03),b+hh*0.78, w-0.12, 0.11, 0.17);
    wallBox(kit,P.stone,axis,u,cross+f*0.2,0,b+0.09, w+0.55, 0.22, t+0.6);
  } else {
    wallBox(kit,P.timber,axis,u,cross,f*0.06,b-0.07, w+0.46, 0.14, t+0.3);
    wallBox(kit,P.timber,axis,u,cross,0,b+hh/2, 0.08, hh-0.08, t*0.55);
    wallBox(kit,P.timber,axis,u,cross,0,b+hh*0.56, w-0.1, 0.08, t*0.55);
    if(rng()<0.55) wallBox(kit,P.pane,axis,u,cross,-f*t*0.3,b+hh/2, w-0.14, hh-0.12, 0.05);
    var sw=(w-0.12)/2, ph=rng()<0.5?0.45:0.05;
    for(var s=-1;s<=1;s+=2){
      var hinge=u+s*(w/2+0.03);
      var cu=hinge+s*(sw/2)*Math.cos(ph), co=cross+f*(t*0.5+0.09)+f*(sw/2)*Math.sin(ph);
      if(axis==='x') kit.box(P.trim, sw, hh-0.06, 0.09, cu, b+hh/2, co, -f*ph);
      else kit.box(P.trim, 0.09, hh-0.06, sw, co, b+hh/2, cu, f*ph);
    }
  }
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
  var i,u,n;
  for(i=-1;i<=1;i+=2) for(var j=-1;j<=1;j+=2)
    kit.box(P.timber, 0.36, yTop-y0, 0.36, cx+i*(w/2-t/2), y0+(yTop-y0)/2, cz+j*(d/2-t/2));
  function band(y,hgt,thick){
    kit.box(P.timber, w, hgt, thick, cx, y, cz+(d/2-t/2));
    kit.box(P.timber, w, hgt, thick, cx, y, cz-(d/2-t/2));
    kit.box(P.timber, thick, hgt, d-2*t, cx+(w/2-t/2), y, cz);
    kit.box(P.timber, thick, hgt, d-2*t, cx-(w/2-t/2), y, cz);
  }
  band(y0+0.78, 0.2, t+0.09);
  band(yTop-0.24, 0.22, t+0.09);
  if(!studs) return;
  n=Math.max(2,Math.floor(w/2.0));
  for(i=0;i<n;i++){
    u=cx-w/2+(i+0.5)*(w/n);
    if(Math.abs(u-cx)<1.0) continue;
    kit.box(P.timber, 0.16, yTop-y0-1.1, t*0.5, u, y0+(yTop-y0)/2, cz+(d/2-t/2-0.03));
    kit.box(P.timber, 0.16, yTop-y0-1.1, t*0.5, u, y0+(yTop-y0)/2, cz-(d/2-t/2-0.03));
  }
}
function structChimney(kit,P,cx,cz,R,u,thatch){
  var yTop=R.yTop, top=yTop+R.rh+(thatch?0.8:0.66), w=thatch?0.95:0.84;
  var x=R.alongZ?cx:cx+u, z=R.alongZ?cz+u:cz;
  kit.box(P.stone, w, top-yTop+0.5, w, x, (yTop-0.5+top)/2, z);
  kit.box(P.stone, w+0.22, 0.18, w+0.22, x, top-0.6, z);
  kit.box(P.stone, w+0.34, 0.16, w+0.34, x, top+0.02, z);
  kit.box(P.dark, w*0.46, 0.22, w*0.46, x, top+0.13, z);
}
function structPorch(kit,P,cx,cz,w,d,y0,doorS,doorW,t,deep){
  var fz=cz+doorS*(d/2-t/2), hh=2.8, sw=deep||1.35, pw=doorW+1.6, i, s;
  for(s=-1;s<=1;s+=2){
    kit.box(P.timber, 0.24, hh, 0.24, cx+s*(pw/2-0.12), y0+hh/2, fz+doorS*(sw-0.22));
    kit.box(P.timber, 0.16, 0.36, sw+0.24, cx+s*(pw/2-0.12), y0+hh+0.16, fz+doorS*(sw/2-0.1));
  }
  kit.box(P.roof, pw+0.55, 0.16, sw+0.55, cx, y0+hh+0.32, fz+doorS*(sw/2-0.05), 0, doorS*0.22);
  kit.box(P.timber, pw+0.55, 0.15, 0.15, cx, y0+hh+0.26, fz+doorS*(sw+0.2));
  kit.box(P.timber, pw-0.3, 0.13, 0.12, cx, y0+1.08, fz+doorS*(sw-0.18));
  for(i=-2;i<=2;i++) kit.box(P.timber, 0.1, 1.02, 0.1, cx+i*(pw-0.6)/4, y0+0.56, fz+doorS*(sw-0.18));
  kit.box(P.stone, doorW+1.0, 0.16, 0.5, cx, y0+0.32, fz+doorS*(sw+0.36));
  kit.box(P.stone, doorW+1.4, 0.16, 0.5, cx, y0+0.16, fz+doorS*(sw+0.82));
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
  /* altar apse at the far end */
  kit.cyln(P.wall, 1.5, 1.6, 3.0, 10, cx, gy+1.5, cz-doorS*(d/2+0.8));
  kit.cyln(P.roof, 0.12, 1.75, 1.4, 10, cx, gy+3.4, cz-doorS*(d/2+0.8));
  /* the twisted brâu belt around the nave */
  var by=gy+o.h*0.6;
  kit.box(P.trim, w+0.5, 0.3, 0.17, cx, by, cz+(d/2-0.17));
  kit.box(P.trim, w+0.5, 0.3, 0.17, cx, by, cz-(d/2-0.17));
  kit.box(P.trim, 0.17, 0.3, d+0.5, cx+(w/2-0.17), by, cz);
  kit.box(P.trim, 0.17, 0.3, d+0.5, cx-(w/2-0.17), by, cz);
  /* bell tower over the entrance */
  var tz=cz+doorS*(d/2-2.0), ty=yTop+rh*0.3;
  kit.box(P.wall, 3.4, 3.6, 3.4, cx, ty+1.8, tz);
  kit.box(P.trim, 3.7, 0.26, 3.7, cx, ty+3.7, tz);
  kit.cyln(P.wall, 1.2, 1.28, 1.5, 10, cx, ty+4.55, tz);
  kit.pyr(domeM, 1.4, 2.2, 12, cx, ty+6.35, tz);
  kit.cyln(P.roof, 0.34, 0.42, 0.32, 8, cx, ty+7.5, tz);
  kit.box(gold, 0.11, 1.2, 0.11, cx, ty+8.25, tz);
  kit.box(gold, 0.66, 0.11, 0.11, cx, ty+8.5, tz);
  for(i=-1;i<=1;i+=2){
    kit.box(P.dark, 0.55, 1.0, 0.18, cx+i*0.8, ty+2.6, tz+1.74);
    kit.box(P.dark, 0.18, 1.0, 0.55, cx+1.74, ty+2.6, tz+i*0.8);
  }
}

/* ============================================================
   7. The shell
   ============================================================ */
/*
  o = {x,z,w,d,h,wall,roofCol,roof,door,timber,stone,trim,pane,floorCol,
       porch,chimney,studs,seed,windows,doorW,doorH,sill,winW,winH,maxWin,rh}
  Returns {yTop, ridgeY, meshes}.
*/
function structShell(o){
  var cx=o.x, cz=o.z, w=o.w, d=o.d, h=o.h;
  var gy=groundH(cx,cz), y0=gy, yTop=gy+h;
  var P=structPal(o);
  var kit=kitCreate();
  var rng=seedRand(o.seed===undefined?(Math.abs(Math.round(cx*7.3+cz*13.1))||3):o.seed);
  var t=0.34, doorS=o.door==='S'?1:-1;
  var style=o.roof||'gable';
  var alongZ=(d>w+0.5);
  var ridgeLen=alongZ?d:w, crossLen=alongZ?w:d;
  var doorW=(o.doorW!==undefined)?o.doorW:clamp(Math.min(1.55, w*0.3), 1.15, 2.4);
  var doorH=o.doorH||clamp(h-1.0, 1.95, 2.5);
  var thatch=(style==='thatch');
  var ov=thatch?0.8:0.6, rake=0.44, th=thatch?0.42:0.22;
  var rh=(o.rh!==undefined)?o.rh:Math.max(0.9,(crossLen/2+ov)*(thatch?0.84:0.7));
  var R={yTop:yTop, ridgeLen:ridgeLen, crossLen:crossLen, alongZ:alongZ,
         rh:rh, ov:ov, rake:rake, th:th, thatch:thatch,
         profile:roofProfile(style, crossLen/2+ov, rh, 0.34)};
  var frontIn=cz+doorS*(d/2-t/2), backIn=cz-doorS*(d/2-t/2);
  var wallOpt={sill:o.sill||1.15, winH:o.winH||1.15, winW:o.winW||0.95,
               doorH:doorH, maxWin:o.maxWin||2};
  var i, holes, sp;

  kit.box(P.floor, w+0.5, 0.24, d+0.5, cx, gy+0.1, cz);
  structPlinth(kit,P,cx,cz,w,d,y0,doorS,doorW);

  /* ---- four walls, each with real openings ---- */
  holes=wallHoles(cx-w/2, cx+w/2, doorW, y0, yTop, wallOpt);
  sp={axis:'x', a0:cx-w/2, a1:cx+w/2, cross:frontIn, y0:y0, top:yTop, t:t, holes:holes, f:doorS};
  wallRun(kit,P.wall,sp);
  for(i=0;i<holes.length;i++) openingTrim(kit,P,sp,holes[i],rng);

  holes=(o.windows===false)?[]:wallHoles(cx-w/2, cx+w/2, 0, y0, yTop, wallOpt);
  sp={axis:'x', a0:cx-w/2, a1:cx+w/2, cross:backIn, y0:y0, top:yTop, t:t, holes:holes, f:-doorS};
  wallRun(kit,P.wall,sp);
  for(i=0;i<holes.length;i++) openingTrim(kit,P,sp,holes[i],rng);

  for(var sx=-1;sx<=1;sx+=2){
    holes=(o.windows===false)?[]:wallHoles(cz-d/2+t, cz+d/2-t, 0, y0, yTop,
      {sill:wallOpt.sill, winH:wallOpt.winH, winW:wallOpt.winW,
       maxWin:clamp(Math.round(d/4.2),1,5)});
    sp={axis:'z', a0:cz-d/2+t, a1:cz+d/2-t, cross:cx+sx*(w/2-t/2), y0:y0, top:yTop, t:t, holes:holes, f:sx};
    wallRun(kit,P.wall,sp);
    for(i=0;i<holes.length;i++) openingTrim(kit,P,sp,holes[i],rng);
  }
  structPosts(kit,P,cx,cz,w,d,y0,yTop,t,o.studs!==false && w>6.5);

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
    roofAssembly(kit,P,cx,cz,R);
    if(o.chimney!==false) structChimney(kit,P,cx,cz,R,ridgeLen*0.29,thatch);
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

  /* ---- porch: the Moldavian pridvor ---- */
  var wantPorch=o.porch!==false && (style==='gable'||style==='thatch'||style==='hall');
  if(wantPorch) structPorch(kit,P,cx,cz,w,d,y0,doorS,doorW,t,o.porch);

  var meshes=kit.flush(scene);
  return {yTop:yTop, ridgeY:yTop+rh, meshes:meshes, pal:P};
}

/* ============================================================
   8. Collision footprints — same planes as the original walls
   ============================================================ */
function wallColliders(cx,cz,w,d,h,doorSide){
  var t=0.35, gap=2.0, z0, z1;
  addCollider(cx-w/2, cz-d/2, cx+w/2, cz-d/2+t);
  addCollider(cx-w/2, cz-d/2, cx-w/2+t, cz+d/2);
  addCollider(cx+w/2-t, cz-d/2, cx+w/2, cz+d/2);
  if(doorSide==='S'){ z0=cz+d/2-t; z1=cz+d/2; } else { z0=cz-d/2; z1=cz-d/2+t; }
  addCollider(cx-w/2, z0, cx-gap/2, z1);
  addCollider(cx+gap/2, z0, cx+w/2, z1);
}

/* Unit triangular prism used by the instanced settlement roofs:
   base 1x1 in X/Z, apex on the centre line, ridge along X. */
function gablePrismGeometry(){
  var A=[-0.5,-0.5,0.5], B=[-0.5,-0.5,-0.5], C=[-0.5,0.5,0],
      D=[0.5,-0.5,0.5], E=[0.5,-0.5,-0.5], F=[0.5,0.5,0], p=[];
  [[A,C,B],[D,E,F],[A,B,E],[A,E,D],[A,D,F],[A,F,C],[E,B,C],[E,C,F]].forEach(function(t){
    for(var i=0;i<3;i++) p.push(t[i][0], t[i][1], t[i][2]);
  });
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p),3));
  g.computeVertexNormals();
  return g;
}

/* ============================================================
   9. Mid-tier structure: full silhouette, no interior
   ============================================================ */
function buildSolidStructure(x,z,w,d,h,wallCol,roofCol,roof,opts){
  opts=opts||{};
  var shell={x:x, z:z, w:w, d:d, h:h, wall:wallCol, roofCol:roofCol, roof:roof||'gable',
             door:opts.door||'S', windows:true, porch:false, studs:false,
             chimney:opts.chimney!==false, seed:opts.seed, maxWin:1};
  if(roof==='flat') shell.rh=0;
  var r=structShell(shell);
  addCollider(x-w/2, z-d/2, x+w/2, z+d/2);
  BUILD_COUNT++;
  return r;
}

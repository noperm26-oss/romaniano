/* ---------------- collision (buildings have real walls) ---------------- */
var colliders=[];
var collisionVersion=0;
var colGrid=new Map(); var CCELL=64;
/* flat heads for the map; the Map remains the fallback for a box that lands outside the table */
var COL_OFF=160, COL_N=320, COL_HEADS=new Array(COL_N*COL_N);
function colKey(gx,gz){ return (gx+1024)*4096+(gz+1024); }
function colBucket(gx,gz,create){
  var ix=gx+COL_OFF, iz=gz+COL_OFF;
  if(ix>=0&&iz>=0&&ix<COL_N&&iz<COL_N){
    var p=iz*COL_N+ix, a=COL_HEADS[p];
    if(!a&&create){ a=[]; COL_HEADS[p]=a; }
    return a;
  }
  var k=colKey(gx,gz), b=colGrid.get(k);
  if(!b&&create){ b=[]; colGrid.set(k,b); }
  return b;
}
function addCollider(x0,z0,x1,z1){
  if(typeof PREFAB_REC!=='undefined' && PREFAB_REC){ PREFAB_REC.col.push([Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)]); return; }   /* prefab capture: local footprint, re-added per instance */
  var c={x0:Math.min(x0,x1)-0.05, x1:Math.max(x0,x1)+0.05, z0:Math.min(z0,z1)-0.05, z1:Math.max(z0,z1)+0.05};
  colliders.push(c);
  collisionVersion++;
  var gx0=Math.floor(c.x0/CCELL), gx1=Math.floor(c.x1/CCELL);
  var gz0=Math.floor(c.z0/CCELL), gz1=Math.floor(c.z1/CCELL);
  for(var gx=gx0;gx<=gx1;gx++)for(var gz=gz0;gz<=gz1;gz++){
    colBucket(gx,gz,true).push(c);
  }
}
function insideSolid(x, z, r){
  /* v10: true if the disc at (x,z) overlaps any collider — no pushing, pure query */
  var gx=Math.floor(x/CCELL), gz=Math.floor(z/CCELL);
  for(var ix=-1;ix<=1;ix++)for(var iz=-1;iz<=1;iz++){
    var arr=colBucket(gx+ix,gz+iz,false);
    if(!arr) continue;
    for(var i=0;i<arr.length;i++){
      var c=arr[i];
      var cx=clamp(x,c.x0,c.x1), cz=clamp(z,c.z0,c.z1);
      var dx=x-cx, dz=z-cz;
      if(dx*dx+dz*dz<r*r) return true;
    }
  }
  return false;
}
function collideCircle(pos, r){
  var __sx=pos.x, __sz=pos.z;   /* v10: cap the escape push so nobody phases through a wall */
  var gx=Math.floor(pos.x/CCELL), gz=Math.floor(pos.z/CCELL);
  for(var ix=-1;ix<=1;ix++)for(var iz=-1;iz<=1;iz++){
    var arr=colBucket(gx+ix,gz+iz,false);
    if(!arr) continue;
    for(var i=0;i<arr.length;i++){
      var c=arr[i];
      var cx=clamp(pos.x,c.x0,c.x1), cz=clamp(pos.z,c.z0,c.z1);
      var dx=pos.x-cx, dz=pos.z-cz, d2=dx*dx+dz*dz;
      if(d2<r*r){
        if(d2>1e-6){
          var d=Math.sqrt(d2);
          pos.x=cx+dx/d*r; pos.z=cz+dz/d*r;
        } else {
          var l=pos.x-c.x0, ri=c.x1-pos.x, t=pos.z-c.z0, b=c.z1-pos.z;
          var m=Math.min(l,ri,t,b);
          if(m===l)pos.x=c.x0-r; else if(m===ri)pos.x=c.x1+r;
          else if(m===t)pos.z=c.z0-r; else pos.z=c.z1+r;
        }
      }
    }
  }
  var __dx=pos.x-__sx, __dz=pos.z-__sz, __dl=Math.sqrt(__dx*__dx+__dz*__dz);
  if(__dl>0.55){ pos.x=__sx+__dx/__dl*0.55; pos.z=__sz+__dz/__dl*0.55; }   /* max 0.55u per frame — no more popping through corners */
}
function findFreeSpot(x,z,rad){
  if(!Number.isFinite(x)||!Number.isFinite(z)) {x=0;z=0;}
  x=clamp(x,-WORLD.half+5,WORLD.half-5);z=clamp(z,-WORLD.half+5,WORLD.half-5);
  if(!insideSolid(x,z,rad))return {x:x,z:z};
  for(var ring=1;ring<=128;ring++){
    var distance=ring*Math.max(1,rad*2),count=Math.min(64,8+ring*4);
    for(var a=0;a<count;a++){
      var ang=a/count*TAU,px=x+Math.cos(ang)*distance,pz=z+Math.sin(ang)*distance;
      if(Math.abs(px)<WORLD.half-5&&Math.abs(pz)<WORLD.half-5&&!insideSolid(px,pz,rad))return {x:px,z:pz};
    }
  }
  throw new Error('No free spawn point near '+x+', '+z);
}


/* Exact swept-disc vs expanded AABBs; broad phase walks hash cells, not the map. */
function segmentClear(ax,az,bx,bz,r){
  if(![ax,az,bx,bz,r].every(Number.isFinite))return false;
  var dx=bx-ax,dz=bz-az,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/CCELL)),seen=new Set();
  for(var step=0;step<=steps;step++){
    var gx=Math.floor((ax+dx*step/steps)/CCELL),gz=Math.floor((az+dz*step/steps)/CCELL);
    var reach=Math.ceil(r/CCELL);
    for(var ix=-reach;ix<=reach;ix++)for(var iz=-reach;iz<=reach;iz++){
      var list=colBucket(gx+ix,gz+iz,false);if(!list)continue;
      for(var i=0;i<list.length;i++){
        var c=list[i];if(seen.has(c))continue;seen.add(c);
        var low=0,high=1;
        if(Math.abs(dx)<1e-10){if(ax<c.x0-r||ax>c.x1+r)continue;}
        else {var tx0=(c.x0-r-ax)/dx,tx1=(c.x1+r-ax)/dx;low=Math.max(low,Math.min(tx0,tx1));high=Math.min(high,Math.max(tx0,tx1));}
        if(Math.abs(dz)<1e-10){if(az<c.z0-r||az>c.z1+r)continue;}
        else {var tz0=(c.z0-r-az)/dz,tz1=(c.z1+r-az)/dz;low=Math.max(low,Math.min(tz0,tz1));high=Math.min(high,Math.max(tz0,tz1));}
        if(low<=high)return false;
      }
    }
  }
  return true;
}
function moveWithCollision(pos,dx,dz,r){
  var steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/Math.max(0.2,r*0.75))),sx=dx/steps,sz=dz/steps;
  for(var i=0;i<steps;i++){
    if(segmentClear(pos.x,pos.z,pos.x+sx,pos.z+sz,r)){pos.x+=sx;pos.z+=sz;}
    else {
      if(segmentClear(pos.x,pos.z,pos.x+sx,pos.z,r))pos.x+=sx;
      if(segmentClear(pos.x,pos.z,pos.x,pos.z+sz,r))pos.z+=sz;
    }
  }
}

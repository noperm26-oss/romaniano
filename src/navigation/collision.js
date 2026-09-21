/* ---------------- collision (buildings have real walls) ---------------- */
var colliders=[];
var collisionVersion=0;
/* 16u hash cells with numeric keys: a query touches only the cells its disc/segment overlaps (a few dozen
   colliders inside a town instead of thousands), and large discs simply reach across more cells */
var colGrid=new Map(); var CCELL=16;
function colKey(gx,gz){ return (gx+32768)*65536+(gz+32768); }
function addCollider(x0,z0,x1,z1){
  if(typeof PREFAB_REC!=='undefined' && PREFAB_REC){ PREFAB_REC.col.push([Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)]); return; }   /* prefab capture: local footprint, re-added per instance */
  var c={x0:Math.min(x0,x1)-0.05, x1:Math.max(x0,x1)+0.05, z0:Math.min(z0,z1)-0.05, z1:Math.max(z0,z1)+0.05};
  colliders.push(c);
  collisionVersion++;
  var gx0=Math.floor(c.x0/CCELL), gx1=Math.floor(c.x1/CCELL);
  var gz0=Math.floor(c.z0/CCELL), gz1=Math.floor(c.z1/CCELL);
  for(var gx=gx0;gx<=gx1;gx++)for(var gz=gz0;gz<=gz1;gz++){
    var k=colKey(gx,gz), arr=colGrid.get(k);
    if(!arr){ arr=[]; colGrid.set(k,arr); }
    arr.push(c);
  }
}
function insideSolid(x, z, r){
  /* v10: true if the disc at (x,z) overlaps any collider — no pushing, pure query */
  var gx0=Math.floor((x-r)/CCELL), gx1=Math.floor((x+r)/CCELL), gz0=Math.floor((z-r)/CCELL), gz1=Math.floor((z+r)/CCELL), r2=r*r;
  for(var gx=gx0;gx<=gx1;gx++)for(var gz=gz0;gz<=gz1;gz++){
    var arr=colGrid.get(colKey(gx,gz));
    if(!arr) continue;
    for(var i=0;i<arr.length;i++){
      var c=arr[i];
      var cx=x<c.x0?c.x0:(x>c.x1?c.x1:x), cz=z<c.z0?c.z0:(z>c.z1?c.z1:z);
      var dx=x-cx, dz=z-cz;
      if(dx*dx+dz*dz<r2) return true;
    }
  }
  return false;
}
function collideCircle(pos, r){
  var __sx=pos.x, __sz=pos.z;   /* v10: cap the escape push so nobody phases through a wall */
  /* successive pushes can walk the disc a few units, so the whole 3×3 block of 16u cells around it is scanned */
  var gx=Math.floor(pos.x/CCELL), gz=Math.floor(pos.z/CCELL);
  for(var ix=-1;ix<=1;ix++)for(var iz=-1;iz<=1;iz++){
    var arr=colGrid.get(colKey(gx+ix,gz+iz));
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


/* Exact swept-disc vs expanded AABBs; broad phase walks only the hash cells the swept segment
   actually touches, rejects every collider by bounding box first, and allocates nothing per call. */
function segmentClear(ax,az,bx,bz,r){
  if(![ax,az,bx,bz,r].every(Number.isFinite))return false;
  var dx=bx-ax,dz=bz-az;
  var minX=(ax<bx?ax:bx)-r, maxX=(ax<bx?bx:ax)+r, minZ=(az<bz?az:bz)-r, maxZ=(az<bz?bz:az)+r;
  var gx0=Math.floor(minX/CCELL), gx1=Math.floor(maxX/CCELL), gz0=Math.floor(minZ/CCELL), gz1=Math.floor(maxZ/CCELL);
  var idx=Math.abs(dx)>1e-10?1/dx:0, idz=Math.abs(dz)>1e-10?1/dz:0, many=(gx1-gx0)*(gz1-gz0)>3;
  for(var gx=gx0;gx<=gx1;gx++)for(var gz=gz0;gz<=gz1;gz++){
    var list=colGrid.get(colKey(gx,gz));if(!list)continue;
    if(many&&!slabHit(ax,az,dx,dz,idx,idz,gx*CCELL-r,gz*CCELL-r,(gx+1)*CCELL+r,(gz+1)*CCELL+r))continue;   /* the swept disc misses this whole cell */
    for(var i=0;i<list.length;i++){
      var c=list[i];
      if(c.x1+r<minX||c.x0-r>maxX||c.z1+r<minZ||c.z0-r>maxZ)continue;
      if(slabHit(ax,az,dx,dz,idx,idz,c.x0-r,c.z0-r,c.x1+r,c.z1+r))return false;
    }
  }
  return true;
}
/* does the segment a + t*d (t in 0..1) enter the box? (idx/idz = 1/d or 0 for a degenerate axis) */
function slabHit(ax,az,dx,dz,idx,idz,x0,z0,x1,z1){
  var low=0,high=1,t0,t1;
  if(idx===0){ if(ax<x0||ax>x1)return false; }
  else { t0=(x0-ax)*idx; t1=(x1-ax)*idx; if(t0>t1){var t=t0;t0=t1;t1=t;} if(t0>low)low=t0; if(t1<high)high=t1; if(low>high)return false; }
  if(idz===0){ if(az<z0||az>z1)return false; }
  else { t0=(z0-az)*idz; t1=(z1-az)*idz; if(t0>t1){var s=t0;t0=t1;t1=s;} if(t0>low)low=t0; if(t1<high)high=t1; }
  return low<=high;
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

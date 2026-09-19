/* ---------------- v11: entity spatial hash — all nearby queries in O(few) ---------------- */
var EH={cell:24,map:new Map(),pool:[]};
function ehashBuild(){
  EH.map.forEach(function(bucket){bucket.length=0;EH.pool.push(bucket);});
  EH.map.clear();
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    if(e.gone||e.dead) continue;
    var k=Math.floor(e.group.position.x/EH.cell)*1024+Math.floor(e.group.position.z/EH.cell);
    var a=EH.map.get(k);
    if(!a){ a=EH.pool.pop()||[]; EH.map.set(k,a); }
    a.push(e);
  }
}
function eqNear(x,z,r,fn){
  var x0=Math.floor((x-r)/EH.cell), x1=Math.floor((x+r)/EH.cell);
  var z0=Math.floor((z-r)/EH.cell), z1=Math.floor((z+r)/EH.cell);
  var r2=r*r;
  for(var gx=x0;gx<=x1;gx++)for(var gz=z0;gz<=z1;gz++){
    var a=EH.map.get(gx*1024+gz);
    if(!a) continue;
    for(var i=0;i<a.length;i++){
      var e=a[i];
      var dx=e.group.position.x-x, dz=e.group.position.z-z;
      if(dx*dx+dz*dz<=r2) if(fn(e,dx*dx+dz*dz)===true) return e;
    }
  }
  return null;
}
function nearestOpponent(e){
  var ax=e.group.position.x, az=e.group.position.z;
  /* v11: hash query — 44u scan covers every aggro radius; wide search throttled per unit */
  var best=null, bestD=1e9;
  eqNear(ax,az,44,function(t,d2){
    if(t===e||t.dead||t.passive||(t.civ&&!t.armed)||!hostileF(t.team,e.team)) return;
    if(d2<bestD){ bestD=d2; best=t; }
  });
  if(best) return best;
  if(((e.wideT||0)-gameTime)<=0){
    e.wideT=gameTime+1.2;
    eqNear(ax,az,160,function(t,d){
      if(t.dead||t.passive||(t.civ&&!t.armed)||!hostileF(t.team,e.team))return;
      if(d<bestD){bestD=d;best=t;}
    });
    return best;
  }
  return null;
}

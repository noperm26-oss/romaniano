/* Collision-aware A*: heap frontier, stamped arrays, exact segment clearance.
   Navigation budgets throttle WORK, never recruitment or army size. */
function createNavigator(options){
  var half=options.half, cell=options.cell||6, w=Math.ceil(half*2/cell), n=w*w;
  var edgeKnown=new Uint8Array(n),edgeClear=new Uint8Array(n);
  var blocked=new Uint8Array(n), scores=new Float64Array(n), parents=new Int32Array(n);
  var stamps=new Uint32Array(n), closed=new Uint32Array(n), generation=0;
  var stats={searches:0, expanded:0, failures:0, cacheHits:0}, cache=new Map();
  function idAt(x,z){ return Math.max(0,Math.min(w-1,Math.floor((z+half)/cell)))*w+Math.max(0,Math.min(w-1,Math.floor((x+half)/cell))); }
  function point(id){ return {x:(id%w+0.5)*cell-half,z:(Math.floor(id/w)+0.5)*cell-half}; }
  function isBlocked(id){
    if(!blocked[id]){ var p=point(id); blocked[id]=options.blocked(p.x,p.z)?2:1; }
    return blocked[id]===2;
  }
  function anchor(x,z){
    var id=idAt(x,z), cx=id%w, cz=Math.floor(id/w), best=-1, dist=Infinity;
    for(var ring=0;ring<=5;ring++){
      for(var dz=-ring;dz<=ring;dz++)for(var dx=-ring;dx<=ring;dx++){
        if(ring && Math.abs(dx)!==ring&&Math.abs(dz)!==ring) continue;
        var nx=cx+dx,nz=cz+dz;
        if(nx<0||nz<0||nx>=w||nz>=w) continue;
        var ni=nz*w+nx, p=point(ni), d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);
        if(d<dist&&!isBlocked(ni)&&options.clear(x,z,p.x,p.z)){best=ni;dist=d;}
      }
      if(best>=0) return best;
    }
    return -1;
  }
  function heuristic(a,b){
    var x=Math.abs(a%w-b%w),z=Math.abs(Math.floor(a/w)-Math.floor(b/w));
    return 0.8*(Math.max(x,z)+(Math.SQRT2-1)*Math.min(x,z));
  }
  function find(sx,sz,tx,tz){
    if(![sx,sz,tx,tz].every(Number.isFinite)) return null;
    if(Math.max(Math.abs(sx),Math.abs(sz),Math.abs(tx),Math.abs(tz))>half-1) return null;
    if(options.blocked(sx,sz)||options.blocked(tx,tz)) return null;
    if(options.clear(sx,sz,tx,tz)) return [{x:tx,z:tz}];
    var start=anchor(sx,sz),goal=anchor(tx,tz);
    if(start<0||goal<0){stats.failures++;return null;}
    var key=start+':'+goal, hit=cache.get(key);
    if(hit){ stats.cacheHits++;return finish(hit,sx,sz,tx,tz); }
    stats.searches++;
    generation=(generation+1)>>>0;
    if(!generation){stamps.fill(0);closed.fill(0);generation=1;}
    var gen=generation,heap=[];
    function push(id,f,g){
      var item={id:id,f:f,g:g},i=heap.length;heap.push(item);
      while(i>0){var p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]=item;
    }
    function pop(){
      var top=heap[0],last=heap.pop();
      if(heap.length){var i=0;while(i*2+1<heap.length){var c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}
      return top;
    }
    stamps[start]=gen;scores[start]=0;parents[start]=-1;push(start,heuristic(start,goal),0);
    var found=false,expanded=0;
    while(heap.length&&expanded<(options.maxNodes||16000)){
      var current=pop(),id=current.id;
      if(closed[id]===gen||current.g!==scores[id])continue;
      closed[id]=gen;expanded++;
      if(id===goal){found=true;break;}
      var x=id%w,z=Math.floor(id/w),a=point(id);
      for(var dz=-1;dz<=1;dz++)for(var dx=-1;dx<=1;dx++){
        if(!dx&&!dz)continue;
        var nx=x+dx,nz=z+dz;
        if(nx<0||nz<0||nx>=w||nz>=w)continue;
        var next=nz*w+nx;
        if(closed[next]===gen||isBlocked(next))continue;
        if(dx&&dz&&(isBlocked(z*w+nx)||isBlocked(nz*w+x)))continue;
        var b=point(next);
        var direction=(dz+1)*3+dx+1;if(direction>4)direction--;
        var bit=1<<direction,reverse=1<<(7-direction);
        if(!(edgeKnown[id]&bit)){
          var safe=options.clear(a.x,a.z,b.x,b.z);edgeKnown[id]|=bit;edgeKnown[next]|=reverse;
          if(safe){edgeClear[id]|=bit;edgeClear[next]|=reverse;}
        }
        if(!(edgeClear[id]&bit))continue;
        var cost=(dx&&dz?Math.SQRT2:1)*(options.road&&options.road(b.x,b.z)?0.8:1),ng=scores[id]+cost;
        if(stamps[next]!==gen||ng<scores[next]){
          stamps[next]=gen;scores[next]=ng;parents[next]=id;push(next,ng+heuristic(next,goal),ng);
        }
      }
    }
    stats.expanded+=expanded;
    if(!found){stats.failures++;return null;}
    var path=[];for(var cur=goal;cur!==-1;cur=parents[cur])path.push(point(cur));path.reverse();
    // Cache grid routes, not caller-specific endpoints. Shared members get safe connectors.
    if(cache.size>=128)cache.delete(cache.keys().next().value);
    cache.set(key,path);
    return finish(path,sx,sz,tx,tz);
  }
  function finish(path,sx,sz,tx,tz){
    var full=path.concat([{x:tx,z:tz}]),out=[],x=sx,z=sz,i=0;
    while(i<full.length){
      var jump=i;
      // Bounded lookahead avoids quadratic smoothing on world-spanning paths.
      for(var j=Math.min(full.length-1,i+40);j>=i;j--){
        if(options.clear(x,z,full[j].x,full[j].z)){jump=j;break;}
      }
      var p=full[jump];if(!options.clear(x,z,p.x,p.z))return null;
      out.push({x:p.x,z:p.z});x=p.x;z=p.z;i=jump+1;
    }
    return out;
  }
  return {find:find,stats:stats,invalidate:function(){blocked.fill(0);edgeKnown.fill(0);edgeClear.fill(0);cache.clear();}};
}
var NAV={cell:6, engine:null, coarse:null, fine:null, version:-1, budget:0, workMs:0, road:new Set()};
function ensureNav(){
  if(!NAV.engine){
    (window.__roadPts||[]).forEach(function(p){NAV.road.add(Math.floor(p[0]/18)+':'+Math.floor(p[1]/18));});
    function opts(cell){return {half:WORLD.half,cell:cell,blocked:function(x,z){return insideSolid(x,z,0.65);},clear:navLos,road:function(x,z){return NAV.road.has(Math.floor(x/18)+':'+Math.floor(z/18));}};}
    NAV.engine=createNavigator(opts(6));
    NAV.coarse=createNavigator(opts(24));
    NAV.fineOptions=opts(2);
  }
  if(NAV.version!==collisionVersion){ NAV.engine.invalidate();NAV.coarse.invalidate();if(NAV.fine)NAV.fine.invalidate();NAV.version=collisionVersion; }
}
function navLos(ax,az,bx,bz){ return segmentClear(ax,az,bx,bz,0.65); }
function navFind(sx,sz,tx,tz){
  ensureNav();
  var startTime=performance.now();
  var path=Math.hypot(tx-sx,tz-sz)>1800?NAV.coarse.find(sx,sz,tx,tz):null;
  if(!path)path=NAV.engine.find(sx,sz,tx,tz);
  // Fine navigation handles narrow doorways; allocated only when actually needed.
  if(!path&&Math.hypot(tx-sx,tz-sz)<240){
    var extent=Math.max(Math.abs(tx-sx),Math.abs(tz-sz))+36;
    var local=createNavigator({half:extent,cell:2,maxNodes:20000,blocked:function(x,z){return insideSolid(x+sx,z+sz,0.65);},clear:function(ax,az,bx,bz){return navLos(ax+sx,az+sz,bx+sx,bz+sz);}});
    var fine=local.find(0,0,tx-sx,tz-sz);
    if(fine)path=fine.map(function(p){return {x:p.x+sx,z:p.z+sz};});
  }
  NAV.workMs+=performance.now()-startTime;
  return path;
}
function navSteer(e,ox,oz){
  var ex=e.group.position.x,ez=e.group.position.z;
  var changed=!e.navGoal||Math.hypot(e.navGoal.x-ox,e.navGoal.z-oz)>4;
  if(changed){e.navPts=null;e.navT=0;}
  if(e.navPts&&e.navI<e.navPts.length){
    while(e.navI<e.navPts.length-1&&Math.hypot(e.navPts[e.navI].x-ex,e.navPts[e.navI].z-ez)<1.2&&navLos(ex,ez,e.navPts[e.navI+1].x,e.navPts[e.navI+1].z))e.navI++;
    var next=e.navPts[e.navI];
    if(e.navI===e.navPts.length-1&&Math.hypot(next.x-ex,next.z-ez)<1.2){e.navPts=null;return navSteer(e,ox,oz);}
    if(navLos(ex,ez,next.x,next.z)&&(e.stuckT||0)<1.2)return next;
    e.navPts=null;
  }
  if(navLos(ex,ez,ox,oz)){e.navPts=null;return {x:ox,z:oz};}
  if((e.navT||0)<=0&&NAV.budget<3&&NAV.workMs<4){
    NAV.budget++;e.navT=1.5+Math.random();
    e.navGoal={x:ox,z:oz};e.navPts=navFind(ex,ez,ox,oz);e.navI=0;
    if(e.navPts&&e.navPts.length)return e.navPts[0];
  }
  // An unreachable command must not become a straight-line order through a wall.
  return {x:ex,z:ez};
}
function freeGoal(x,z){return findFreeSpot(x,z,0.7);}

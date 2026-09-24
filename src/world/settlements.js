/* ============================================================
   settlements.js — the hamlets (cătune) of the countryside
   ------------------------------------------------------------
   One hamlet per zone quadrant (HAMLETS, geography.js — the ground
   under each is levelled). A hamlet is a lane with fenced yards on
   both sides: real regional houses (prefabs.js — every one a solid,
   enterable, furnished building with a hinged door, glowing windows
   and a smoking chimney), each with its own yard — woodpile, oven,
   haystack, beehives, garden rows, a shed, a fruit tree — a chapel
   or barn closing the lane, the well and the troiță at the other end,
   fields and an orchard beyond.
   ============================================================ */
var SETTLEMENTS=[],settlementStats={buildings:0,hamlets:0,chunks:0,zones:0,yards:0},settlementRoadGrid=new Map();
function settlementRoadKey(gx,gz){ return (gx+1024)*4096+(gz+1024); }
function settlementRoadNear(x,z,r){
  var gx=Math.floor(x/32),gz=Math.floor(z/32);
  for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){
    var pts=settlementRoadGrid.get(settlementRoadKey(gx+dx,gz+dz))||[];
    for(var i=0;i<pts.length;i++)if(Math.hypot(x-pts[i][0],z-pts[i][1])<r)return true;
  }return false;
}
function hamletWater(x,z){
  var rf=riverField(x,z,120); if(rf.river && rf.d<rf.river.hw*1.5+40) return true;
  for(var i=0;i<LAKES.length;i++){ var L=LAKES[i]; if((x-L.x)*(x-L.x)+(z-L.z)*(z-L.z)<Math.pow(L.r+50,2)) return true; }
  for(var m=0;m<MOATS.length;m++){ if(moatDist(MOATS[m],x,z)<MOATS[m].w+40) return true; }
  return false;
}
/* free ground for a yard piece: no wall, no road, not in front of a door */
function hamletFree(x,z,r){
  if(insideSolid(x,z,r)) return false;
  if(settlementRoadNear(x,z,r+2)||sceneryRoadDist(x,z)<r+1.5) return false;
  if(nearDoor(x,z,r+1.2)) return false;
  return true;
}
/* what a region builds along its lanes: [type, weight] */
var HAMLET_KINDS={
  carpathian:   {houses:[['cottage',5],['house',2],['farm',1],['workshop',1]], end:[['chapel',3],['barn',2]], trees:[0x2f4a2e,0x3a5a3a], crop:[0x928047,0x667743], ball:false},
  transylvanian:{houses:[['house',4],['cottage',3],['farm',2],['workshop',1]], end:[['chapel',1],['barn',1]], trees:[0x556b38,0x657940], crop:[0xc9b24a,0x6b8f3a], ball:true},
  wallachian:   {houses:[['cottage',5],['house',3],['farm',2],['workshop',1]], end:[['barn',1],['chapel',1]], trees:[0x6a8a3a,0x7a9a4a], crop:[0x5a6a4a,0x6a8a3a], ball:true},
  moldavian:    {houses:[['cottage',4],['house',3],['farm',2],['workshop',1]], end:[['chapel',3],['barn',2]], trees:[0x2a4a2a,0x3a5a2e], crop:[0x928047,0x667743], ball:true},
  trade_route:  {houses:[['house',4],['cottage',3],['workshop',2],['farm',1]], end:[['barn',3],['chapel',2]], trees:[0x7a8a5a,0x8a9a5a], crop:[0xc9b24a,0xb9a13a], ball:true},
  capital:      {houses:[['house',5],['cottage',2],['farm',2],['workshop',1]], end:[['chapel',3],['barn',2]], trees:[0x556b38,0x657940], crop:[0xc9b24a,0x6b8f3a], ball:true},
  battlefield:  {houses:[['cottage',5],['house',2],['farm',1],['workshop',2]], end:[['barn',3],['chapel',2]], trees:[0x556b38,0x4a5a3a], crop:[0x928047,0x667743], ball:false}
};
function hamletPick(list,rnd){ var t=0,i; for(i=0;i<list.length;i++) t+=list[i][1]; var r=rnd()*t; for(i=0;i<list.length;i++){ r-=list[i][1]; if(r<=0) return list[i][0]; } return list[0][0]; }
function hamletVariants(type){ return type==='cottage'||type==='house'?3:type==='farm'?2:1; }

var _setJob=null, _setRoads=0, _setCovered=null;
function buildSettlements(budget){
  var tEnd=budget?performance.now()+budget:1e15;
  if(!_setJob){
    if(!_setRoads){
      (window.__roadPts||[]).forEach(function(p){var key=settlementRoadKey(Math.floor(p[0]/32),Math.floor(p[1]/32));if(!settlementRoadGrid.has(key))settlementRoadGrid.set(key,[]);settlementRoadGrid.get(key).push(p);});
      _setRoads=1;
    }
    if(!_setCovered) _setCovered=new Set();
    _setJob={i:0, batch:null, covered:_setCovered};
  }
  var j=_setJob;
  for(; j.i<HAMLETS.length; j.i++){
    if(budget && performance.now()>=tEnd && j.i>0) return true;
    var H=HAMLETS[j.i];
    if(H._area) continue;
    if(typeof inLoadArea==='function' && !inLoadArea(H.x, H.z)) continue;
    H._area=1;
    if(nearTown(H.x,H.z,30)||nearSite(H.x,H.z,30)||hamletWater(H.x,H.z)) continue;
    if(!j.batch) j.batch=createBuildingBatch();
    var n=buildHamlet(j.batch,H);
    if(!n) continue;
    j.covered.add(H.zi); settlementStats.hamlets++; settlementStats.buildings+=n;
    var regionLabel=WORLD_REGIONS[H.region]?WORLD_REGIONS[H.region].name:H.region;
    SETTLEMENTS.push({x:H.x,z:H.z,zi:H.zi,region:H.region,name:VNAMES[H.zi%VNAMES.length]+' — '+regionLabel+' cătun '+(H.q+1),buildings:n});
    window.__contentZi[H.zi]=1;
  }
  settlementStats.zones=j.covered.size;
  if(j.batch) settlementStats.chunks+=j.batch.finish();
  _setJob=null;
  return false;
}
/* ---- one hamlet: lane, yards, houses, the lane-end building, well, troiță, fields, orchard ----
   Built in lane coordinates (u along the lane, v across it) and turned onto the map, so half the hamlets
   run east-west and half north-south. */
function buildHamlet(batch,H){
  var X=H.x, Z=H.z, reg=H.region, K=HAMLET_KINDS[reg]||HAMLET_KINDS.wallachian, rnd=srand(H.zi*7919+H.q*131+17);
  var placed=0, i, side, k;
  var alongX=rnd()<0.5, endPlus=(H.q%2===1);
  var T=alongX?function(u,v){ return [X+u, Z+v]; }:function(u,v){ return [X+v, Z+u]; };
  var faceIn=alongX?{'-1':'S','1':'N'}:{'-1':'E','1':'W'};        /* the door side of a house at v=side·d, looking at the lane */
  var faceEnd=alongX?{'-1':'E','1':'W'}:{'-1':'S','1':'N'};       /* the door side of a building at u=±end, looking down the lane */
  var L={T:T, alongX:alongX, faceIn:faceIn, reg:reg, K:K, rnd:rnd};
  var roadCol=tintHex(reg==='carpathian'?0x7a7a82:reg==='trade_route'?0xc2b08a:reg==='capital'?0x9a9a8a:0x9b8866,-0.2);
  /* the lane (tested against real walls so trunk roads keep their clearance) */
  for(var step=-58;step<=58;step+=6){
    var lp=T(step,0);
    if(!insideSolid(lp[0],lp[1],4)){ batch.add('box',lp[0],groundH(lp[0],lp[1])+0.04,lp[1],alongX?6.2:5.4,0.08,alongX?5.4:6.2,roadCol); window.__roadPts.push([lp[0],lp[1]]); }
  }
  /* yards along both sides: slots every 22u, fences shared on the slot boundaries; a slot now and then is an orchard */
  var slots=[-33,-11,11,33];
  for(side=-1;side<=1;side+=2){
    for(k=0;k<slots.length;k++){
      var su=slots[k], sv=side*(14.2+rnd()*1.6);
      if(rnd()<0.1){ hamletOrchard(batch,L,su,side,su-11,su+11); continue; }
      var type=hamletPick(K.houses,rnd), key=reg+'.'+type+(1+Math.floor(rnd()*hamletVariants(type)));
      var pf=prefabGet(key); if(!pf) continue;
      var hp=T(su,sv), r=Math.hypot(pf.hx,pf.hz)+1.2;
      if(insideSolid(hp[0],hp[1],r)||settlementRoadNear(hp[0],hp[1],r+3)||sceneryRoadDist(hp[0],hp[1])<r+2) continue;
      var S=prefabPlace(key,hp[0],hp[1],faceIn[side]);
      if(!S) continue;
      placed++; settlementStats.yards++;
      var depthIn=alongX?S.hz:S.hx;                                  /* half size of the house across the lane */
      hamletYard(batch,L,su,sv,side,depthIn,su-11,su+11,k===slots.length-1);
    }
  }
  /* the lane-end building faces down the lane */
  var eType=hamletPick(K.end,rnd), eKey=reg+'.'+eType+'1', epf=prefabGet(eKey);
  if(epf){
    var eu=endPlus?60:-60, ep=T(eu,0), er=Math.hypot(epf.hx,epf.hz)+1.5;
    if(!insideSolid(ep[0],ep[1],er)&&!settlementRoadNear(ep[0],ep[1],er+3)&&sceneryRoadDist(ep[0],ep[1])>er+2){ if(prefabPlace(eKey,ep[0],ep[1],faceEnd[endPlus?1:-1])) placed++; }
  }
  /* the well and the troiță at the open end, a hay wagon nearby */
  var ou=endPlus?-58:58, wp=T(ou,-3.6), tp=T(ou,3.4), cp=T(ou+(endPlus?-4:4),7.5);
  if(hamletFree(wp[0],wp[1],1.6)) prefabPlace('prop.well',wp[0],wp[1],'S',{force:true});
  if(hamletFree(tp[0],tp[1],0.8)) prefabPlace('prop.troita',tp[0],tp[1],faceEnd[endPlus?-1:1],{force:true});
  if(rnd()<0.6 && hamletFree(cp[0],cp[1],1.8)) prefabPlace('prop.cart',cp[0],cp[1],rnd()<0.5?'S':'E',{force:true});
  /* fields beyond the yards and an orchard behind the open end */
  for(side=-1;side<=1;side+=2){
    for(k=0;k<2;k++){
      var fv=side*(47+rnd()*6), fu=-34+k*44+rnd()*10, fp=T(fu,fv);
      if(insideSolid(fp[0],fp[1],12)||sceneryRoadDist(fp[0],fp[1])<12) continue;
      hamletField(batch,fp[0],fp[1],alongX?18:14+rnd()*6,alongX?14+rnd()*6:18,rnd()*0.3-0.15,K.crop);
    }
  }
  for(i=0;i<8;i++){
    var tp2=T((endPlus?-1:1)*(68+rnd()*12),(rnd()*2-1)*24);
    if(!hamletFree(tp2[0],tp2[1],2.2)) continue;
    hamletTree(batch,tp2[0],tp2[1],K,rnd,true);
  }
  return placed;
}
/* a fenced yard behind a house: gate in front of the door, garden rows, a shed and the small pieces of a household */
function hamletYard(batch,L,su,sv,side,depthIn,u0,u1,last){
  var T=L.T, rnd=L.rnd, K=L.K, reg=L.reg, i;
  var vIn=side*4.2, vOut=side*33;
  function fence(ua,va,ub,vb){ var a=T(ua,va), b=T(ub,vb); hamletFence(batch,a[0],a[1],b[0],b[1]); }
  /* fences: along the lane with the gate gap, the back, the -u side (and the +u side of the last yard) */
  fence(u0,vIn,su-1.4,vIn); fence(su+1.4,vIn,u1,vIn);
  fence(u0,vOut,u1,vOut);
  fence(u0,vIn,u0,vOut); if(last) fence(u1,vIn,u1,vOut);
  /* gate posts and a path from the gate to the door */
  var g1=T(su-1.5,vIn), g2=T(su+1.5,vIn), gm=T(su,vIn), gy=groundH(gm[0],gm[1]);
  batch.add('box',g1[0],gy+0.9,g1[1],0.24,1.8,0.24,0x5d4326); batch.add('box',g2[0],gy+0.9,g2[1],0.24,1.8,0.24,0x5d4326);
  batch.add('box',gm[0],gy+1.9,gm[1],L.alongX?3.2:0.16,0.16,L.alongX?0.16:3.2,0x6b4f2e);
  var vDoor=sv-side*depthIn, pm=T(su,(vIn+vDoor)/2), plen=Math.abs(vDoor-vIn);
  batch.add('box',pm[0],groundH(pm[0],pm[1])+0.05,pm[1],L.alongX?1.6:plen,0.06,L.alongX?plen:1.6,tintHex(0x9b8866,-0.3));
  /* the yard behind the house */
  var vBack=sv+side*(depthIn+1.4), depth=Math.abs(vOut-vBack)-1.5;
  if(depth<4) return;
  var items=['garden','woodpile','shed','haystack','oven','beehives','dovecote','tree','tree'];
  var n=4+Math.floor(rnd()*3), used={}, taken=[];
  function free(x,z,r){ if(!hamletFree(x,z,r)) return false; for(var t=0;t<taken.length;t++){ var q=taken[t]; if(Math.hypot(q.x-x,q.z-z)<q.r+r) return false; } taken.push({x:x,z:z,r:r}); return true; }
  var faceHouse=L.alongX?(side<0?'N':'S'):(side<0?'W':'E');          /* looking back at the house */
  var faceLane=L.faceIn[side];
  for(i=0;i<n;i++){
    var it=items[Math.floor(rnd()*items.length)]; if(used[it]&&it!=='tree') continue; used[it]=1;
    var uu=u0+2.6+rnd()*(u1-u0-5.2), vv=vBack+side*(1.4+rnd()*(depth-2.8)), p=T(uu,vv);
    if(it==='woodpile'){ if(free(p[0],p[1],1.5)) prefabPlace('prop.woodpile',p[0],p[1],rnd()<0.5?'S':'E',{force:true}); }
    else if(it==='haystack'){ if(free(p[0],p[1],1.7)) prefabPlace('prop.haystack',p[0],p[1],'S',{force:true}); }
    else if(it==='oven'){ if(free(p[0],p[1],1.3)) prefabPlace('prop.oven',p[0],p[1],faceLane,{force:true}); }
    else if(it==='beehives'){ if(free(p[0],p[1],1.6)) prefabPlace('prop.beehives',p[0],p[1],rnd()<0.5?'S':'N',{force:true}); }
    else if(it==='dovecote'){ if(free(p[0],p[1],1.0)) prefabPlace('prop.dovecote',p[0],p[1],'S',{force:true}); }
    else if(it==='shed'){ var sk=reg+'.shed1', sp=prefabGet(sk); if(sp){ var sq=T(u0+3.2+rnd()*(u1-u0-6.4), vOut-side*(sp.hz+1.4)); if(free(sq[0],sq[1],Math.hypot(sp.hx,sp.hz)+1.0)) prefabPlace(sk,sq[0],sq[1],faceLane); } }
    else if(it==='garden'){ var gw=Math.min(depth-2.5,8), gd=7, gq=T((u0+u1)/2+(rnd()-0.5)*6, vBack+side*(gw/2+0.8)); if(gw>3 && free(gq[0],gq[1],Math.hypot(gw,gd)/2+0.3)) hamletGarden(batch,gq[0],gq[1],L.alongX?gd:gw,L.alongX?gw:gd,K.crop); }
    else { if(free(p[0],p[1],2.2)) hamletTree(batch,p[0],p[1],K,rnd,true); }
  }
}
/* an empty slot: a little orchard behind a low fence */
function hamletOrchard(batch,L,su,side,u0,u1){
  var T=L.T, rnd=L.rnd, i;
  var a=T(u0,side*4.2), b=T(u1,side*4.2); hamletFence(batch,a[0],a[1],b[0],b[1]);
  for(i=0;i<5;i++){ var p=T(u0+3+rnd()*(u1-u0-6), side*(8+rnd()*22)); if(hamletFree(p[0],p[1],2.4)) hamletTree(batch,p[0],p[1],L.K,rnd,true); }
}
function hamletFence(batch,x0,z0,x1,z1){
  var mx=(x0+x1)/2, mz=(z0+z1)/2;
  if(sceneryRoadDist(mx,mz)<4||sceneryRoadDist(x0,z0)<3.5||sceneryRoadDist(x1,z1)<3.5) return;
  if(insideSolid(mx,mz,0.6)) return;
  batchFence(batch,x0,z0,x1,z1);
}
function hamletGarden(batch,x,z,w,d,crop){
  var y=groundH(x,z), rows=Math.max(3,Math.floor(w/1.3)), i;
  batch.add('box',x,y+0.05,z,w,0.1,d,0x5a4632);
  for(i=0;i<rows;i++){ var u=x-w/2+(i+0.5)*(w/rows); batch.add('box',u,y+0.2,z,0.7,0.3,d-0.6,i%2?crop[1]:0x4a6a3a); }
}
function hamletField(batch,x,z,w,d,ry,crop){
  var y=groundH(x,z), i;
  for(i=0;i<6;i++){ var u=(i-2.5)*(w/6), c=Math.cos(ry), s=Math.sin(ry); batch.add('box',x+u*c,y+0.08,z-u*s,w/6*0.7,0.16,d,i%2?crop[0]:crop[1],ry); }
}
/* an orchard / yard tree: a trunk and a round crown (or a fir in the mountains) */
function hamletTree(batch,x,z,K,rnd,ball){
  var y=groundH(x,z), c=K.trees[Math.floor(rnd()*K.trees.length)], s=0.8+rnd()*0.5;
  batch.add('box',x,y+1.1*s,z,0.36,2.2*s,0.36,0x5a4632);
  if(K.ball&&ball){ batch.add('ball',x,y+2.9*s,z,3.4*s,3.0*s,3.4*s,c); batch.add('ball',x+0.6*s,y+3.6*s,z-0.3*s,2.2*s,2.0*s,2.2*s,tintHex(c,0.12)); }
  else { batch.add('tree',x,y+3.4*s,z,3.2*s,4.6*s,3.2*s,c); batch.add('tree',x,y+5.2*s,z,2.2*s,3.0*s,2.2*s,tintHex(c,0.1)); }
  addCollider(x-0.3,z-0.3,x+0.3,z+0.3);
}

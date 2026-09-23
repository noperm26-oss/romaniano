/* ============================================================
   districts.js — the countryside between the named places
   ------------------------------------------------------------
   Farmsteads, herders' folds, quarries and hunting camps
   scattered over every region — real regional houses (prefabs.js:
   solid, enterable, furnished, hinged doors, lit windows) set in a
   ring around the well, with barns, sheds, hay, fields and fences —
   the zone economy (SITES / zoneSiteRate) and the "wilds" pass that
   guarantees every zone has something in it.
   ============================================================ */
var SITES=[];
var zoneSiteRate=null;
/* instanced fence pieces (solid) */
function batchFence(batch,x0,z0,x1,z1){
  var L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.4)), ry=-Math.atan2(z1-z0,x1-x0), i;
  for(i=0;i<=n;i++){ var t=i/n, px=x0+(x1-x0)*t, pz=z0+(z1-z0)*t; batch.add('box',px,groundH(px,pz)+0.55,pz,0.14,1.1,0.14,0x5d4326); }
  var mx=(x0+x1)/2, mz=(z0+z1)/2; batch.add('box',mx,groundH(mx,mz)+0.9,mz,L,0.08,0.08,0x6b4f2e,ry); batch.add('box',mx,groundH(mx,mz)+0.5,mz,L,0.08,0.08,0x6b4f2e,ry);
  addCollider(Math.min(x0,x1)-0.1,Math.min(z0,z1)-0.1,Math.max(x0,x1)+0.1,Math.max(z0,z1)+0.1);
}
function batchHay(batch,x,z,s){ if(!insideSolid(x,z,1.6)) prefabPlace('prop.haystack',x,z,'S',{force:true}); }
/* the side of a house that looks at (tx,tz) */
function faceToward(x,z,tx,tz){ var dx=tx-x, dz=tz-z; return Math.abs(dx)>Math.abs(dz)?(dx>0?'E':'W'):(dz>0?'S':'N'); }
/* what each kind of farmstead builds, in order around the ring */
var DISTRICT_KITS={
  farm:['farm','barn','cottage','cottage','stable','house','shed','cottage','house','shed'],
  estate:['house','chapel','farm','barn','house','cottage','stable','cottage','workshop','shed'],
  vineyard:['farm','barn','cottage','house','shed','cottage'],
  fold:['cottage','stable','cottage','shed'],
  quarry:['workshop','cottage','cottage','shed','house'],
  hunt:['cottage','cottage','shed'],
  camp:['cottage','workshop','cottage'],
  fishers:['cottage','cottage','shed','house'],
  caravan:['workshop','house','cottage','stable','cottage','shed']
};
function batchField(batch,x,z,w,d,ry,c1,c2){ var y=groundH(x,z); for(var i=0;i<6;i++){ var u=(i-2.5)*(w/6), c=Math.cos(ry||0), s=Math.sin(ry||0); batch.add('box',x+u*c,y+0.08,z-u*s,w/6*0.7,0.16,d,i%2?c1:c2,ry); } }
function batchCairn(batch,x,z){ var y=groundH(x,z); batch.add('box',x,y+0.4,z,1.6,0.8,1.4,0x8a8a86,0.3); batch.add('box',x,y+1.0,z,1.1,0.6,1.0,0x8a8a86,0.7); batch.add('box',x,y+1.45,z,0.6,0.5,0.6,0x9a9a96,0.2); addCollider(x-0.8,z-0.7,x+0.8,z+0.7); }
function siteEcon(x,z,type,rate){ SITES.push({zi:zoneIdxAt(x,z), rate:rate, type:type, region:getRegion(x,z), x:x, z:z}); }

var _distJob=null;
function buildDistricts(budget){
  var deadline=budget?performance.now()+budget:0;
  if(!_distJob){
    _distJob={batch:createBuildingBatch(), rnd:srand(1337), di:0, phase:'econ', gz:0, gx:0, wildsN:0};
    window.__contentZi=window.__contentZi||{};
  /* economy of the named places */
  FAC_KEYS_T.forEach(function(f){ var T=TOWNS[f]; siteEcon(T.x,T.z,'market',0.5); siteEcon(T.x,T.z,'fort',0.4); siteEcon(T.x,T.z,'forge',0.3); window.__contentZi[zoneIdxAt(T.x,T.z)]=1; });
  SITES_DEF.forEach(function(s){
    var t={watchtower:'watchtower',cave:'shrine',monastery:'library',outpost:'fort',village:'farm',warcamp:'warcamp',forestvillage:'hunter',tradepost:'tradepost',checkpoint:'checkpoint',graves:'shrine',crossing:'watchtower',siege:'warcamp',ambush:'cave',burned:'farm',memorial:'shrine',trench:'fort',caveshrine:'shrine',ruinmonastery:'library',bandits:'cave',crypt:'cave',waterfall:'shrine',lostwatchtower:'watchtower',tunnels:'tradepost',witch:'shrine'}[s.kind]||'shrine';
    siteEcon(s.x,s.z,t,s.secret?0.22:0.3);
    if(s.kind==='monastery'){ siteEcon(s.x,s.z,'school',0.2); siteEcon(s.x,s.z,'shrine',0.2); }
    if(s.kind==='village'){ siteEcon(s.x,s.z,'inn',0.15); siteEcon(s.x,s.z,'stable',0.1); }
    if(s.kind==='checkpoint'||s.kind==='tradepost') siteEcon(s.x,s.z,'stable',0.1);
    window.__contentZi[zoneIdxAt(s.x,s.z)]=1;
  });
  VILLAGES.forEach(function(v){ siteEcon(v.x,v.z,'farm',0.18); window.__contentZi[zoneIdxAt(v.x,v.z)]=1; });
    _distJob.phase='farms';
    if(deadline && performance.now()>=deadline) return true;
  }
  var batch=_distJob.batch, rnd=_distJob.rnd;
  if(_distJob.phase==='farms'){
  /* farmsteads and camps — same order, same random stream; a player load may yield between farmsteads */
  for(; _distJob.di<DISTRICT_C.length; _distJob.di++){
    if(deadline && _distJob.di && performance.now()>=deadline) return true;
    var D=DISTRICT_C[_distJob.di], di=_distJob.di;
    var reg=D.region, kind;
    var roll=rnd();
    if(reg==='carpathian') kind=roll<0.45?'fold':roll<0.8?'quarry':'hunt';
    else if(reg==='transylvanian') kind=roll<0.6?'farm':roll<0.85?'vineyard':'fold';
    else if(reg==='wallachian') kind=roll<0.6?'farm':roll<0.85?'fishers':'fold';
    else if(reg==='moldavian') kind=roll<0.5?'hunt':roll<0.8?'farm':'fold';
    else if(reg==='trade_route') kind=roll<0.5?'caravan':roll<0.8?'farm':'fold';
    else if(reg==='capital') kind=roll<0.7?'farm':'estate';
    else kind=roll<0.5?'farm':roll<0.8?'camp':'fold';
    D.kind=kind;
    var list=DISTRICT_KITS[kind]||DISTRICT_KITS.farm, n=Math.min(list.length, (kind==='farm'?6:kind==='estate'?8:3)+Math.floor(rnd()*3)), placed=0, i;
    var ring=17+n*1.9, a0=rnd()*TAU;
    /* the houses stand in a ring around the well, each facing the yard */
    for(i=0;i<n;i++){
      var a=a0+i/n*TAU+(rnd()-0.5)*0.3, r=ring*(0.85+rnd()*0.3), hx=D.x+Math.cos(a)*r, hz=D.z+Math.sin(a)*r;
      var type=list[i], key=reg+'.'+type+(1+Math.floor(rnd()*((type==='cottage'||type==='house')?3:type==='farm'?2:1)));
      var pf=prefabGet(key); if(!pf) continue;
      var rr=Math.hypot(pf.hx,pf.hz)+1.5;
      if(insideSolid(hx,hz,rr)||settlementRoadNear(hx,hz,rr+3)||sceneryRoadDist(hx,hz)<rr+2) continue;
      if(prefabPlace(key,hx,hz,faceToward(hx,hz,D.x,D.z))) placed++;
      /* a woodpile, oven or beehives beside the house */
      var px=D.x+Math.cos(a+0.35)*(r+2), pz=D.z+Math.sin(a+0.35)*(r+2), pk=['prop.woodpile','prop.oven','prop.beehives','prop.woodpile','prop.dovecote'][Math.floor(rnd()*5)];
      if(!insideSolid(px,pz,1.6)&&!nearDoor(px,pz,2.5)) prefabPlace(pk,px,pz,faceToward(px,pz,D.x,D.z),{force:true});
    }
    if(!placed) continue;
    if(!insideSolid(D.x,D.z,2)) prefabPlace('prop.well',D.x,D.z,'S',{force:true});
    if(rnd()<0.7 && !insideSolid(D.x+5,D.z+3,2)) prefabPlace('prop.cart',D.x+5,D.z+3,rnd()<0.5?'S':'E',{force:true});
    var y=groundH(D.x,D.z);
    if(kind==='farm'||kind==='estate'||kind==='vineyard'){
      for(i=0;i<3;i++){ var fa=i*2.1+rnd(), fx=D.x+Math.cos(fa)*(ring+40), fz=D.z+Math.sin(fa)*(ring+40); if(insideSolid(fx,fz,16)||sceneryRoadDist(fx,fz)<14) continue; batchField(batch,fx,fz,26,20,fa,kind==='vineyard'?0x6b8f3a:0xb4a15a,kind==='vineyard'?0x5a7a3a:0x928047); }
      for(i=0;i<3;i++){ var ha=rnd()*TAU, hx2=D.x+Math.cos(ha)*(ring+10), hz2=D.z+Math.sin(ha)*(ring+10); if(!insideSolid(hx2,hz2,2.5)) batchHay(batch,hx2,hz2,0.8+rnd()*0.5); }
      siteEcon(D.x,D.z,'farm',0.16+rnd()*0.08); if(kind==='estate') siteEcon(D.x,D.z,'noble',0.2);
    } else if(kind==='fold'){
      var px=D.x+ring+12, pz=D.z; if(!insideSolid(px,pz,14)){ batchFence(batch,px-10,pz-10,px+10,pz-10); batchFence(batch,px+10,pz-10,px+10,pz+10); batchFence(batch,px+10,pz+10,px-10,pz+10); batchFence(batch,px-10,pz+10,px-10,pz-2); for(i=0;i<5;i++) batch.add('box',px-6+rnd()*12,groundH(px,pz)+0.45,pz-6+rnd()*12,1.1,0.8,0.6,0xe8e0cf,rnd()*3); }
      batchHay(batch,D.x-ring-6,D.z+4,0.9); siteEcon(D.x,D.z,'farm',0.12);
    } else if(kind==='quarry'){
      for(i=0;i<6;i++){ var qa=rnd()*TAU, qx=D.x+Math.cos(qa)*(ring+14), qz=D.z+Math.sin(qa)*(ring+14); if(insideSolid(qx,qz,3)) continue; batch.add('box',qx,groundH(qx,qz)+0.9,qz,2.4+rnd()*2,1.8+rnd()*1.5,2+rnd(),0x8a8a86,rnd()*3); addCollider(qx-1.6,qz-1.4,qx+1.6,qz+1.4); }
      batch.add('box',D.x+8,y+1.2,D.z+8,0.3,2.4,0.3,0x5d4326); batch.add('box',D.x+8,y+2.5,D.z+8,3,0.2,0.2,0x5d4326,0.4);
      siteEcon(D.x,D.z,'mine',0.22);
    } else if(kind==='hunt'||kind==='camp'){
      for(i=0;i<3;i++){ var ta=rnd()*TAU, tx=D.x+Math.cos(ta)*(ring+8), tz=D.z+Math.sin(ta)*(ring+8); if(insideSolid(tx,tz,3)) continue; prefabPlace('prop.tent',tx,tz,faceToward(tx,tz,D.x,D.z),{force:true}); }
      propCampfire(D.x+4,D.z+4,false); siteEcon(D.x,D.z,kind==='hunt'?'hunter':'warcamp',0.14);
    } else if(kind==='fishers'){
      for(i=0;i<3;i++){ var bx=D.x+ring+6+i*4, bz=D.z-6+i*5; batch.add('box',bx,groundH(bx,bz)+0.5,bz,3.2,0.7,1.2,0x6b4f2e,0.5); }
      batch.add('box',D.x-ring-4,y+1.1,D.z,0.12,2.2,0.12,0x5d4326); batch.add('box',D.x-ring-4,y+2.0,D.z,3,0.06,0.06,0x5d4326); batch.add('box',D.x-ring-4,y+1.2,D.z,2.6,1.4,0.04,0x8a9a5a);
      siteEcon(D.x,D.z,'market',0.14);
    } else if(kind==='caravan'){
      for(i=0;i<3;i++) propCart(D.x+ring+8, D.z-8+i*7, 0.1*i, false);
      batchFence(batch,D.x+ring+2,D.z-14,D.x+ring+2,D.z+14); propCampfire(D.x+ring+14,D.z+18,true);
      siteEcon(D.x,D.z,'tradepost',0.18);
    }
    /* the lane through the yard, then the yard fence: a ring of fence runs around the farmstead, open where the lane
       comes in and out (north and south); a few trees inside the fence */
    for(var s=-ring;s<=ring;s+=6){ if(!insideSolid(D.x,D.z+s,2.5)){ batch.add('box',D.x,groundH(D.x,D.z+s)+0.04,D.z+s,4.5,0.08,6.2,0x9b8866); window.__roadPts.push([D.x,D.z+s]); } }
    var R=ring+9, segs=12, ai;
    for(ai=0;ai<segs;ai++){
      var b0=ai/segs*TAU, b1=(ai+1)/segs*TAU, fx0=D.x+Math.cos(b0)*R, fz0=D.z+Math.sin(b0)*R, fx1=D.x+Math.cos(b1)*R, fz1=D.z+Math.sin(b1)*R;
      if(Math.abs(Math.sin((b0+b1)/2))>0.9) continue;
      var fmx=(fx0+fx1)/2, fmz=(fz0+fz1)/2;
      if(insideSolid(fx0,fz0,0.5)||insideSolid(fx1,fz1,0.5)||insideSolid(fmx,fmz,0.7)||nearDoor(fmx,fmz,2.5)||sceneryRoadDist(fmx,fmz)<4||settlementRoadNear(fmx,fmz,3)) continue;
      propFence(fx0,fz0,fx1,fz1,1.05);
    }
    var TK=HAMLET_KINDS[reg]||HAMLET_KINDS.wallachian;
    for(i=0;i<5;i++){ var ta2=rnd()*TAU, tr=ring*(0.35+rnd()*0.5), tx2=D.x+Math.cos(ta2)*tr, tz2=D.z+Math.sin(ta2)*tr; if(insideSolid(tx2,tz2,2.4)||nearDoor(tx2,tz2,3)||Math.abs(tx2-D.x)<3.5) continue; hamletTree(batch,tx2,tz2,TK,rnd,true); }
    D.buildings=placed;
    window.__contentZi[zoneIdxAt(D.x,D.z)]=1;
  }
    _distJob.phase='wilds';
    if(deadline && performance.now()>=deadline) return true;
  }
  if(_distJob.phase==='wilds'){
  /* ---- WILDS: every remaining zone gets a feature ---- */
  var wildsN=_distJob.wildsN, gx, gz;
  for(gz=_distJob.gz;gz<ZN;gz++){
    for(gx=(gz===_distJob.gz?_distJob.gx:0);gx<ZN;gx++){
      if(deadline && (gz||gx) && performance.now()>=deadline){ _distJob.gz=gz; _distJob.gx=gx; _distJob.wildsN=wildsN; return true; }
    var zi=gz*ZN+gx;
    if(window.__contentZi[zi]) continue;
    var cx=(gx+0.5)*ZS-WORLD.half, cz=(gz+0.5)*ZS-WORLD.half, found=false;
    for(var tries=0;tries<12 && !found;tries++){
      var jx=cx+(rnd()*2-1)*140, jz=cz+(rnd()*2-1)*140;
      if(sceneryBlocked(jx,jz,6)||insideSolid(jx,jz,8)) continue;
      var reg=getRegion(jx,jz), wt=(gx*3+gz*5+tries)%6;
      if(reg==='carpathian'||wt===0) batchCairn(batch,jx,jz);
      else if(wt===1){ propTroita(jx,jz,rnd()*3); }
      else if(wt===2){ batchHay(batch,jx,jz,1.0); batchHay(batch,jx+4,jz+2,0.8); }
      else if(wt===3){ var lk=reg+'.cottage'+(1+Math.floor(rnd()*3)), lf=['S','E','N','W'][Math.floor(rnd()*4)]; if(prefabPlace(lk,jx,jz,lf)){ if(!insideSolid(jx+6,jz+5,1.6)) prefabPlace('prop.woodpile',jx+6,jz+5,'S',{force:true}); if(!insideSolid(jx-6,jz+6,1.6)) prefabPlace('prop.haystack',jx-6,jz+6,'S',{force:true}); } }
      else if(wt===4){ batch.add('box',jx,groundH(jx,jz)+0.8,jz,4.2,1.6,0.6,0x8a8272,rnd()*3); addCollider(jx-2.2,jz-1.2,jx+2.2,jz+1.2); batch.add('box',jx+1.8,groundH(jx,jz)+1.3,jz+1.2,0.6,2.6,2.2,0x7a7264,rnd()*3); }
      else { propCampfire(jx,jz,false); prefabPlace('prop.tent',jx+4.5,jz,'W',{force:true}); }
      found=true; wildsN++;
    }
    window.__contentZi[zi]=1;
    }
    _distJob.gx=0;
  }
  window.__wildsN=wildsN;
  batch.finish();
  zoneSiteRate=new Float32Array(ZN*ZN);
  for(var s2=0;s2<SITES.length;s2++) zoneSiteRate[SITES[s2].zi]+=SITES[s2].rate;
  _distJob=null;
  return false;
  }
}

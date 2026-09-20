/* ============================================================
   districts.js — the countryside between the named places
   ------------------------------------------------------------
   Farmsteads, herders' folds, quarries and hunting camps
   scattered over every region (instanced, solid, with doors and
   windows), the zone economy (SITES / zoneSiteRate) and the
   "wilds" pass that guarantees every zone has something in it.
   ============================================================ */
var SITES=[];
var zoneSiteRate=null;
var DISTRICT_C=[];
(function(){
  var rnd=srand(90210);
  for(var i=0;i<900 && DISTRICT_C.length<150;i++){
    var x=rnd()*5600-2800, z=rnd()*5600-2800;
    if(Math.abs(x)>2850||Math.abs(z)>2850) continue;
    var bad=false, k;
    for(k=0;k<FAC_KEYS_T.length && !bad;k++){ var T=TOWNS[FAC_KEYS_T[k]]; if((x-T.x)*(x-T.x)+(z-T.z)*(z-T.z)<Math.pow((TOWN_RADIUS[FAC_KEYS_T[k]]||150)+150,2)) bad=true; }
    for(k=0;k<SITES_DEF.length && !bad;k++){ var S=SITES_DEF[k]; if((x-S.x)*(x-S.x)+(z-S.z)*(z-S.z)<Math.pow(S.r+110,2)) bad=true; }
    for(k=0;k<VILLAGES.length && !bad;k++){ var V=VILLAGES[k]; if((x-V.x)*(x-V.x)+(z-V.z)*(z-V.z)<130*130) bad=true; }
    for(k=0;k<DISTRICT_C.length && !bad;k++){ var D=DISTRICT_C[k]; if((x-D.x)*(x-D.x)+(z-D.z)*(z-D.z)<200*200) bad=true; }
    if(!bad){ var rf=riverField(x,z); if(rf.river && rf.d<rf.river.hw*1.5+45) bad=true; }
    if(!bad) for(k=0;k<LAKES.length;k++){ var L=LAKES[k]; if((x-L.x)*(x-L.x)+(z-L.z)*(z-L.z)<Math.pow(L.r+60,2)) bad=true; }
    if(!bad && groundH(x,z)>34) bad=true; /* not on the high crags */
    if(!bad) DISTRICT_C.push({x:x, z:z, region:getRegion(x,z)});
  }
})();
/* instanced well and fence pieces (solid) */
function batchWell(batch,x,z,roofCol){
  var y=groundH(x,z);
  batch.add('box',x,y+0.5,z,2.2,1.0,2.2,0x8f8a80,0.4);
  batch.add('box',x-0.9,y+1.6,z,0.13,2.4,0.13,0x5d4326); batch.add('box',x+0.9,y+1.6,z,0.13,2.4,0.13,0x5d4326);
  batch.add('roof',x,y+3.2,z,3.0,0.8,3.0,roofCol||0x6d5a3e,Math.PI/4);
  addCollider(x-1.1,z-1.1,x+1.1,z+1.1); BUILD_COUNT++;
}
function batchFence(batch,x0,z0,x1,z1){
  var L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.4)), ry=-Math.atan2(z1-z0,x1-x0), i;
  for(i=0;i<=n;i++){ var t=i/n, px=x0+(x1-x0)*t, pz=z0+(z1-z0)*t; batch.add('box',px,groundH(px,pz)+0.55,pz,0.14,1.1,0.14,0x5d4326); }
  var mx=(x0+x1)/2, mz=(z0+z1)/2; batch.add('box',mx,groundH(mx,mz)+0.9,mz,L,0.08,0.08,0x6b4f2e,ry); batch.add('box',mx,groundH(mx,mz)+0.5,mz,L,0.08,0.08,0x6b4f2e,ry);
  addCollider(Math.min(x0,x1)-0.1,Math.min(z0,z1)-0.1,Math.max(x0,x1)+0.1,Math.max(z0,z1)+0.1);
}
function batchHay(batch,x,z,s){ var y=groundH(x,z); batch.add('box',x,y+0.15,z,0.2,0.3,0.2,0x5d4326); batch.add('roof',x,y+1.1*s,z,2.6*s,2.2*s,2.6*s,0xc9b24a,0.3); batch.add('roof',x,y+1.4*s,z,2.0*s,2.0*s,2.0*s,0xb9a13a,0.8); addCollider(x-1.1*s,z-1.1*s,x+1.1*s,z+1.1*s); }
function batchField(batch,x,z,w,d,ry,c1,c2){ var y=groundH(x,z); for(var i=0;i<6;i++){ var u=(i-2.5)*(w/6), c=Math.cos(ry||0), s=Math.sin(ry||0); batch.add('box',x+u*c,y+0.08,z-u*s,w/6*0.7,0.16,d,i%2?c1:c2,ry); } }
function batchCairn(batch,x,z){ var y=groundH(x,z); batch.add('box',x,y+0.4,z,1.6,0.8,1.4,0x8a8a86,0.3); batch.add('box',x,y+1.0,z,1.1,0.6,1.0,0x8a8a86,0.7); batch.add('box',x,y+1.45,z,0.6,0.5,0.6,0x9a9a96,0.2); addCollider(x-0.8,z-0.7,x+0.8,z+0.7); }
function siteEcon(x,z,type,rate){ SITES.push({zi:zoneIdxAt(x,z), rate:rate, type:type, region:getRegion(x,z), x:x, z:z}); }

function buildDistricts(){
  var batch=createBuildingBatch(), rnd=srand(1337);
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
  /* farmsteads and camps */
  DISTRICT_C.forEach(function(D,di){
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
    var n=(kind==='farm'?7:kind==='estate'?9:5)+Math.floor(rnd()*4), placed=0, i;
    var ring=18+n*1.4;
    for(i=0;i<n;i++){
      var a=i/n*TAU+rnd()*0.4, r=ring*(0.75+rnd()*0.4), hx=D.x+Math.cos(a)*r, hz=D.z+Math.sin(a)*r;
      var type=(i===0&&(kind==='farm'||kind==='estate'))?'farm':(i===1&&kind==='estate')?'chapel':(kind==='quarry'||kind==='caravan')&&i===0?'workshop':'cottage';
      if(buildSettlementHouse(batch,hx,hz,type)) placed++;
    }
    if(!placed) return;
    if(!insideSolid(D.x,D.z,2)) batchWell(batch,D.x,D.z,0x6d5a3e);
    var y=groundH(D.x,D.z);
    if(kind==='farm'||kind==='estate'||kind==='vineyard'){
      for(i=0;i<3;i++){ var fa=i*2.1+rnd(), fx=D.x+Math.cos(fa)*(ring+40), fz=D.z+Math.sin(fa)*(ring+40); if(insideSolid(fx,fz,16)||sceneryRoadDist(fx,fz)<14) continue; batchField(batch,fx,fz,26,20,fa,kind==='vineyard'?0x6b8f3a:0xc9b24a,kind==='vineyard'?0x5a7a3a:0x928047); }
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
      for(i=0;i<3;i++){ var ta=rnd()*TAU, tx=D.x+Math.cos(ta)*(ring+8), tz=D.z+Math.sin(ta)*(ring+8); if(insideSolid(tx,tz,3)) continue; batch.add('roof',tx,groundH(tx,tz)+1.3,tz,4.2,2.6,4.2,0xb5a487,rnd()); addCollider(tx-1.6,tz-1.6,tx+1.6,tz+1.6); }
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
    /* fences and a lane to the yard */
    batchFence(batch,D.x-ring-2,D.z-ring-2,D.x+ring*0.5,D.z-ring-2);
    for(var s=-ring;s<=ring;s+=6){ if(!insideSolid(D.x,D.z+s,2.5)){ batch.add('box',D.x,groundH(D.x,D.z+s)+0.04,D.z+s,4.5,0.08,6.2,0x9b8866); window.__roadPts.push([D.x,D.z+s]); } }
    D.buildings=placed;
    window.__contentZi[zoneIdxAt(D.x,D.z)]=1;
  });
  /* ---- WILDS: every remaining zone gets a feature ---- */
  var wildsN=0, gx, gz;
  for(gz=0;gz<ZN;gz++) for(gx=0;gx<ZN;gx++){
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
      else if(wt===3){ buildSettlementHouse(batch,jx,jz,'cottage'); }
      else if(wt===4){ batch.add('box',jx,groundH(jx,jz)+0.8,jz,4.2,1.6,0.6,0x8a8272,rnd()*3); addCollider(jx-2.2,jz-1.2,jx+2.2,jz+1.2); batch.add('box',jx+1.8,groundH(jx,jz)+1.3,jz+1.2,0.6,2.6,2.2,0x7a7264,rnd()*3); }
      else { propCampfire(jx,jz,false); batch.add('roof',jx+3,groundH(jx+3,jz)+1.3,jz,4.2,2.6,4.2,0xb5a487,rnd()); addCollider(jx+1.4,jz-1.6,jx+4.6,jz+1.6); }
      found=true; wildsN++;
    }
    window.__contentZi[zi]=1;
  }
  window.__wildsN=wildsN;
  batch.finish();
  zoneSiteRate=new Float32Array(ZN*ZN);
  for(var s2=0;s2<SITES.length;s2++) zoneSiteRate[SITES[s2].zi]+=SITES[s2].rate;
}

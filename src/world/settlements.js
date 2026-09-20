/* Four spaced homesteads per territory, plus region-specific Romanian medieval hamlets
   — EXTENDED 2× EDITION: every region has distinct settlement types
*/
var SETTLEMENTS=[],settlementStats={buildings:0,hamlets:0,chunks:0,zones:0},settlementRoadGrid=new Map();
function settlementRoadNear(x,z,r){
  var gx=Math.floor(x/32),gz=Math.floor(z/32);
  for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){
    var pts=settlementRoadGrid.get((gx+dx)+':'+(gz+dz))||[];
    for(var i=0;i<pts.length;i++)if(Math.hypot(x-pts[i][0],z-pts[i][1])<r)return true;
  }return false;
}
function hamletWater(x,z){
  var rf=riverField(x,z); if(rf.river && rf.d<rf.river.hw*1.5+40) return true;
  for(var i=0;i<LAKES.length;i++){ var L=LAKES[i]; if((x-L.x)*(x-L.x)+(z-L.z)*(z-L.z)<Math.pow(L.r+50,2)) return true; }
  for(var m=0;m<MOATS.length;m++){ if(moatDist(MOATS[m],x,z)<MOATS[m].w+40) return true; }
  return false;
}
function buildSettlements(){
  (window.__roadPts||[]).forEach(function(p){var key=Math.floor(p[0]/32)+':'+Math.floor(p[1]/32);if(!settlementRoadGrid.has(key))settlementRoadGrid.set(key,[]);settlementRoadGrid.get(key).push(p);});
  var batch=createBuildingBatch(),covered=new Set();
  for(var zi=0;zi<ZN*ZN;zi++){
    var center=zoneCenter(zi);
    var region = getRegion(center.x, center.z);
    for(var quadrant=0;quadrant<4;quadrant++){
      var x=center.x+(quadrant%2?88:-88),z=center.z+(quadrant>1?88:-88);
      var protectedSite=nearTown(x,z,30)||nearSite(x,z,30)||hamletWater(x,z);
      if(protectedSite)continue;
      var added=0;
      for(var h=0;h<8;h++){
        var hx=x+(h<4?-16:16),hz=z+((h%4)-1.5)*18;
        var type;
        if(region==='carpathian'){
          type = h===0?'chapel':h===1?'workshop':h===2?'cottage':h===5?'farm':'cottage';
        } else if(region==='transylvanian'){
          type = h===0?'chapel':h===1?'farm':h===2?'workshop':h===4?'cottage':'cottage';
        } else if(region==='wallachian'){
          type = h===0?'workshop':h===1?'farm':h===2?'cottage':'cottage';
        } else if(region==='moldavian'){
          type = h===0?'chapel':h===1?'farm':h===3?'workshop':'cottage';
        } else if(region==='trade_route'){
          type = h===0?'workshop':h===1?'cottage':h===2?'farm':'cottage';
        } else if(region==='capital'){
          type = h===0?'chapel':h===1?'workshop':h===2?'cottage':h===3?'cottage':'farm';
        } else {
          type = h===0&&quadrant===0?'chapel':h===1?'farm':h===4?'workshop':'cottage';
        }
        if(buildSettlementHouse(batch,hx,hz,type)){added++;settlementStats.buildings++;}
      }
      if(!added)continue;
      covered.add(zi);settlementStats.hamlets++;
      var regionLabel = WORLD_REGIONS[region] ? WORLD_REGIONS[region].name : region;
      SETTLEMENTS.push({x:x,z:z,zi:zi,region:region,name:VNAMES[zi%VNAMES.length]+' — '+regionLabel+' cătun '+(quadrant+1),buildings:added});
      // Street segments are tested against actual walls, including legacy buildings.
      for(var step=-36;step<=36;step+=6){
        if(!insideSolid(x,z+step,4)){
          var roadCol = tintHex(region==='carpathian'?0x7a7a82:region==='trade_route'?0xc2b08a:region==='capital'?0x9a9a8a:0x9b8866, -0.38);
          batch.add('box',x,groundH(x,z+step)+0.04,z+step,6,0.08,6.2,roadCol);
          window.__roadPts.push([x,z+step]);
        }
      }
      // Region-specific decoration
      for(var tree=0;tree<10;tree++){
        var tx=x+(tree<5?-36:36),tz=z+(tree%5-2)*14;
        if(insideSolid(tx,tz,3)||settlementRoadNear(tx,tz,7))continue;
        var y=groundH(tx,tz);
        if(region==='carpathian'){
          batch.add('box',tx,y+1,tz,0.5,2,0.5,0x4a3a2a);
          batch.add('tree',tx,y+3.5,tz,3.5,5,3.5,tree%2?0x2f4a2e:0x3a5a3a);
        } else if(region==='transylvanian'){
          batch.add('box',tx,y+1,tz,0.5,2,0.5,0x66472e);
          batch.add('tree',tx,y+3,tz,4.5,4.5,4.5,tree%2?0x556b38:0x657940);
          if(tree%3===0) batch.add('box',tx+2,y+0.3,tz,2,0.6,2,0x6b8f3a); // vineyard
        } else if(region==='wallachian'){
          batch.add('box',tx,y+0.8,tz,0.4,1.5,0.4,0x5a4a3a);
          batch.add('tree',tx,y+2.5,tz,3,3,3,0x6a8a3a);
        } else if(region==='moldavian'){
          batch.add('box',tx,y+1,tz,0.5,2,0.5,0x3a2a1a);
          batch.add('tree',tx,y+3,tz,4,4.5,4,tree%2?0x2a4a2a:0x3a5a2e);
        } else if(region==='trade_route'){
          if(tree%2===0){
            batch.add('box',tx,y+0.5,tz,0.6,1.2,0.6,0x8a7a5e);
            batch.add('tree',tx,y+2,tz,2.5,2.5,2.5,0x7a8a5a);
          }
        } else {
          batch.add('box',tx,y+1,tz,0.5,2,0.5,0x66472e);
          batch.add('tree',tx,y+3,tz,4.5,4.5,4.5,tree%2?0x556b38:0x657940);
        }
      }
      if(!insideSolid(x,z+43,9)){
        for(var furrow=0;furrow<6;furrow++){
          var cropCol = region==='transylvanian'? (furrow%2?0xc9b24a:0x6b8f3a) : region==='wallachian'? (furrow%2?0x5a6a4a:0x6a8a3a) : (furrow%2?0x928047:0x667743);
          batch.add('box',x-7.5+furrow*3,groundH(x,z+43)+0.07,z+43,1.8,0.14,12,cropCol);
        }
      }
      // Extra: Orthodox shrine per hamlet in trade_route / transylvanian
      if((region==='trade_route' || region==='transylvanian') && quadrant===0){
        var sx=x+20, sz=z+20;
        if(!insideSolid(sx,sz,3)){
          batch.add('box',sx,groundH(sx,sz)+1.1,sz,0.22,2.2,0.22,0x6b4f2e);
          batch.add('box',sx+1.8,groundH(sx,sz)+1.1,sz,0.22,2.2,0.22,0x6b4f2e);
          batch.add('box',sx+0.9,groundH(sx,sz)+2.3,sz,2.4,0.24,0.3,0x7a5a36);
        }
      }
      window.__contentZi[zi]=1;
    }
  }
  settlementStats.zones=covered.size;settlementStats.chunks=batch.finish();
}

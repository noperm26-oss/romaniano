/* Four spaced homesteads per territory, rather than one prop claiming a whole zone.
   Planned streets, courtyards and orchards preserve walkable gaps between buildings. */
var SETTLEMENTS=[],settlementStats={buildings:0,hamlets:0,chunks:0,zones:0},settlementRoadGrid=new Map();
function settlementRoadNear(x,z,r){
  var gx=Math.floor(x/32),gz=Math.floor(z/32);
  for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){
    var pts=settlementRoadGrid.get((gx+dx)+':'+(gz+dz))||[];
    for(var i=0;i<pts.length;i++)if(Math.hypot(x-pts[i][0],z-pts[i][1])<r)return true;
  }return false;
}
function buildSettlements(){
  (window.__roadPts||[]).forEach(function(p){var key=Math.floor(p[0]/32)+':'+Math.floor(p[1]/32);if(!settlementRoadGrid.has(key))settlementRoadGrid.set(key,[]);settlementRoadGrid.get(key).push(p);});
  var batch=createBuildingBatch(),covered=new Set();
  for(var zi=0;zi<ZN*ZN;zi++){
    var center=zoneCenter(zi);
    for(var quadrant=0;quadrant<4;quadrant++){
      var x=center.x+(quadrant%2?88:-88),z=center.z+(quadrant>1?88:-88);
      var protectedSite=FAC_KEYS.some(function(f){return Math.hypot(x-TOWNS[f].x,z-TOWNS[f].z)<210;})||LANDMARKS.some(function(l){return Math.hypot(x-l.x,z-l.z)<Math.max(45,l.r||0);});
      if(protectedSite)continue;
      var added=0;
      for(var h=0;h<6;h++){
        var hx=x+(h<3?-13:13),hz=z+((h%3)-1)*18;
        var type=h===0&&quadrant===0?'chapel':h===1?'farm':h===4?'workshop':'cottage';
        if(buildSettlementHouse(batch,hx,hz,type)){added++;settlementStats.buildings++;}
      }
      if(!added)continue;
      covered.add(zi);settlementStats.hamlets++;
      SETTLEMENTS.push({x:x,z:z,zi:zi,name:VNAMES[zi%VNAMES.length]+' — cătun '+(quadrant+1),buildings:added});
      // Street segments are tested against actual walls, including legacy buildings.
      for(var step=-30;step<=30;step+=6){
        if(!insideSolid(x,z+step,4)){
          batch.add('box',x,groundH(x,z+step)+0.04,z+step,6,0.08,6.2,0x9b8866);
          window.__roadPts.push([x,z+step]);
        }
      }
      for(var tree=0;tree<8;tree++){
        var tx=x+(tree<4?-33:33),tz=z+(tree%4-1.5)*14;
        if(insideSolid(tx,tz,3)||settlementRoadNear(tx,tz,7))continue;
        var y=groundH(tx,tz);
        batch.add('box',tx,y+1,tz,0.5,2,0.5,0x66472e);
        batch.add('tree',tx,y+3,tz,4.5,4.5,4.5,tree%2?0x556b38:0x657940);
      }
      if(!insideSolid(x,z+43,9)){
        for(var furrow=0;furrow<6;furrow++)batch.add('box',x-7.5+furrow*3,groundH(x,z+43)+0.07,z+43,1.8,0.14,12,furrow%2?0x928047:0x667743);
      }
      window.__contentZi[zi]=1;
    }
  }
  settlementStats.zones=covered.size;settlementStats.chunks=batch.finish();
}

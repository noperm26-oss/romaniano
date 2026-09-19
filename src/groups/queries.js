function unitPower(e){ return e.hp + e.dmg*3 + (e.ranged?20:0); }
function playerUnits(){
  var out=[];
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    if(!e.dead && !e.civ && !e.isPlayer && e.team===playerTeam
       && e.kind!=='worker' && e.kind!=='villager' && e.kind!=='wolf') out.push(e);
  }
  return out;
}
function defendPosts(){
  var owned=[];
  for(var zi=0;zi<zones.length;zi++){
    if(zones[zi].owner===playerTeam) owned.push(zi);
  }
  owned.sort(function(a,b){
    var pa=(zones[a].core||zones[a].bonus)?0:1, pb=(zones[b].core||zones[b].bonus)?0:1;
    return pa-pb;
  });
  return owned;
}
function pickAttackTarget(){
  var now=gameTime;
  pendingAlerts=pendingAlerts.filter(function(a){ return now-a.t<240; });
  if(pendingAlerts.length) return pendingAlerts[0].zi;
  var px=player?player.group.position.x:0, pz=player?player.group.position.z:0;
  var best=null, bd=1e18;
  for(var zi=0;zi<zones.length;zi++){
    if(zones[zi].owner===playerTeam) continue;
    var c=zoneCenter(zi);
    var d=(c.x-px)*(c.x-px)+(c.z-pz)*(c.z-pz);
    if(d<bd){ bd=d; best=zi; }
  }
  return best;
}
function villageNameAt(zi){
  for(var i=0;i<VILLAGES.length;i++){ if(VILLAGES[i].zone===zi) return VILLAGES[i].name; }
  return null;
}

function aiCap(f){ return 50 + 10*(ownedCounts()[f]||0); }   /* v8: bots scale with territory */
var WIN_ZONES=128;
var marchCooldown=0;

/* economy: gold per faction */
var EC={};
function resetEconomy(){
  EC={};
  FAC_KEYS.forEach(function(k){ EC[k]={gold:300}; });
}

/* ---------------- ownership zones ---------------- */
var zones=[];
function zoneIdxAt(x,z){
  if(!isFinite(x)||!isFinite(z)) return 0;   /* v9: NaN positions must not poison the grid lookup */
  var gx=clamp(Math.floor((x+WORLD.half)/ZS),0,ZN-1);
  var gz=clamp(Math.floor((z+WORLD.half)/ZS),0,ZN-1);
  return gz*ZN+gx;
}
function zoneCenter(i){
  var gx=i%ZN, gz=Math.floor(i/ZN);
  return {x:(gx+0.5)*ZS-WORLD.half, z:(gz+0.5)*ZS-WORLD.half, gx:gx, gz:gz};
}
function resetZones(){
  zones=[];
  for(var i=0;i<ZN*ZN;i++){
    zones.push({owner:null, inf:{}, core:false, bonus:false});
    FAC_KEYS.forEach(function(f){ zones[zones.length-1].inf[f]=0; });
  }
  VILLAGES.forEach(function(v){
    var zi=zoneIdxAt(v.x,v.z);
    zones[zi].bonus=true; v.zone=zi;
  });
  FAC_KEYS.forEach(function(f){
    var T=TOWNS[f];
    var c=zoneIdxAt(T.x,T.z);
    var gx=c%ZN, gz=Math.floor(c/ZN);
    /* plus-shaped homeland: town core + 4 orthogonal zones (center field stays neutral) */
    [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
      var zx=gx+d[0], zz=gz+d[1];
      if(zx<0||zz<0||zx>=ZN||zz>=ZN) return;
      var zi=zz*ZN+zx;
      zones[zi].owner=f;
      if(d[0]===0&&d[1]===0) zones[zi].core=true;
    });
  });
}
function ownedCounts(){
  var c={};
  FAC_KEYS.forEach(function(f){ c[f]=0; });
  var n=0;
  for(var i=0;i<zones.length;i++){
    if(zones[i].owner){ c[zones[i].owner]++; n++; }
  }
  c.neutral=zones.length-n;
  return c;
}
var captureT=0, incomeT=0, raidT=0, aiBuyT=0, conqHudT=0, cmdHudT=0, backupT=4;
function incomeTick(){
  var oc=ownedCounts();
  FAC_KEYS.forEach(function(f){
    EC[f].gold += 2 + oc[f]*0.4;
  });
  for(var i=0;i<zones.length;i++){
    var z=zones[i];
    if(!z.owner) continue;
    if(z.bonus) EC[z.owner].gold += 0.7;              /* village tribute */
    if(zoneSiteRate) EC[z.owner].gold += zoneSiteRate[i];  /* v8: what the buildings earn */
  }
}
function incomeRate(f){
  var r=2+(ownedCounts()[f]||0)*0.4;
  for(var i=0;i<zones.length;i++){
    if(zones[i].owner===f){
      if(zones[i].bonus) r+=0.7;
      if(zoneSiteRate) r+=zoneSiteRate[i];
    }
  }
  return r;
}
function captureTick(){
  var counts={};
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    if(e.dead||e.passive||!e.team) continue;
    var zi=zoneIdxAt(e.group.position.x, e.group.position.z);
    if(zi<0||zi>=zones.length) continue;
    if(!counts[zi]) counts[zi]={};
    counts[zi][e.team]=(counts[zi][e.team]||0)+1;
  }
  var flipped=false;
  for(var z in counts){
    var zi2=+z, zone=zones[zi2];
    var c=counts[z];
    var best=null, bestN=0, others=0;
    FAC_KEYS.forEach(function(f){
      if(c[f]>bestN){ others+=bestN; bestN=c[f]; best=f; }
      else others+=c[f];
    });
    if(!best || others>=bestN) continue;
    zone.inf[best]+=bestN*0.7;
    FAC_KEYS.forEach(function(f){ if(f!==best && zone.inf[f]>0) zone.inf[f]=Math.max(0,zone.inf[f]-0.5); });
    var need = zone.owner===null ? 4 : (zone.core?16:11);
    if(zone.owner!==best && zone.inf[best]>=need){
      var old=zone.owner;
      zone.owner=best;
      FAC_KEYS.forEach(function(f){ zone.inf[f]=0; });
      flipped=true;
      reassignWorkers(zi2, best, old);
      if(old===playerTeam){
        pendingAlerts.push({zi:zi2, t:gameTime});
        killFeedMsg('City lost', (villageNameAt(zi2)?'Satul '+villageNameAt(zi2):'A territory')+' has fallen — attack forces respond once secure', '#e06666');
      }
      if(playerTeam && best===playerTeam){
        Snd.horn();
        showBanner(zone.core?'Enemy stronghold taken!':'Territory seized!', 'The banner of '+FACS[best].name+' rises (+income)', 2.4);
      } else if(playerTeam && old===playerTeam){
        showBanner('Territory lost!', FACS[best].name+' overruns your lands', 2.4);
      }
    }
  }
  if(flipped) checkDomination();
}
function reassignWorkers(zi, fac, oldOwner){
  for(var i=0;i<entities.length;i++){
    var w=entities[i];
    if(w.kind==='worker' && !w.dead && w.team!==fac){
      if(zoneIdxAt(w.group.position.x, w.group.position.z)===zi){
        w.team=fac;
        killFeedMsg('Workers', 'The people of '+(villageNameAt(zi)||'the village')+' now serve '+FACS[fac].name, '#e9c458');
      }
    }
  }
}
function checkDomination(){
  var oc=ownedCounts();
  for(var i=0;i<FAC_KEYS.length;i++){
    var f=FAC_KEYS[i];
    if(oc[f]>=WIN_ZONES){ showResult(f===playerTeam, f); return; }
  }
  if(playerTeam && oc[playerTeam]===0){
    /* still alive if home core not lost? No: 0 zones = wiped out */
    showResult(false, null);
  }
}

/* ---------------- war bands (strategic AI) ---------------- */
function borderTargets(team){
  var owned={};
  zones.forEach(function(z,i){ if(z.owner===team) owned[i]=true; });
  var cands={};
  Object.keys(owned).forEach(function(i){
    var c=zoneCenter(+i);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
      var gx=c.gx+d[0], gz=c.gz+d[1];
      if(gx<0||gz<0||gx>=ZN||gz>=ZN) return;
      var zi=gz*ZN+gx;
      if(zones[zi].owner===team) return;
      cands[zi]=true;
    });
  });
  return Object.keys(cands).map(Number);
}
function launchRaids(){
  FAC_KEYS.forEach(function(team){
    var targets=borderTargets(team);
    if(!targets.length) return;
    /* prefer neutral zones */
    var neutral=targets.filter(function(z){ return !zones[z].owner; });
    var target=choice(neutral.length?neutral:targets);
    var c=zoneCenter(target);
    /* send up to 6 idle units of this team */
    var idle=entities.filter(function(e){
      return !e.dead && !e.passive && !e.isPlayer && e.team===team && !e.goal;
    });
    idle.sort(function(a,b){
      var da=(a.group.position.x-c.x)*(a.group.position.x-c.x)+(a.group.position.z-c.z)*(a.group.position.z-c.z);
      var db=(b.group.position.x-c.x)*(b.group.position.x-c.x)+(b.group.position.z-c.z)*(b.group.position.z-c.z);
      return da-db;
    });
    for(var i=0;i<Math.min(6,idle.length);i++){
      idle[i].goal={x:c.x+rand(-160,160), z:c.z+rand(-160,160)};
    }
  });
}
function aiBuyTick(){
  FAC_KEYS.forEach(function(team){
    if(team===playerTeam) return;
    var count=0;
    entities.forEach(function(e){ if(!e.dead&&!e.isPlayer&&e.team===team) count++; });
    if(count>=aiCap(team)) return;
    var defs=RECRUIT_DEFS[team];
    var keys=Object.keys(defs);
    var key=keys[randi(0,keys.length-1)];
    if(key==='champion'&&Math.random()<0.7) key=keys[0];
    var def=defs[key];
    if(EC[team].gold>=def.cost){
      EC[team].gold-=def.cost;
      doMuster(team, key, false);
    }
  });
}
function doMuster(team, key, announce){
  var td=townData[team];
  if(!td) return null;
  var def=RECRUIT_DEFS[team][key];
  var spot=findFreeSpot(td.hall.door.x+rand(-3,3), td.hall.door.z+rand(-2,2), 0.5);
  var e=spawnCharacter(key, team, spot.x, spot.z);
  e.order=curOrder||'follow';   /* v9: fresh troops always have a duty (trail the king) */
  if(e.order==='follow') e.sqIdx=playerUnits().length;
  if(team===playerTeam) scheduleReform();   /* v11: recruits join a group on the next think */
  e.goal={x:td.hall.door.x+rand(-30,30), z:td.hall.door.z+TOWNS_and_front(team)*rand(20,45)};
  if(announce){
    Snd.coin(); Snd.horn();
    killFeedMsg('Muster', def.name+' joins the army', '#e9c458');
  }
  return e;
}
function TOWNS_and_front(team){
  var T=TOWNS[team];
  return T.z<0?1:-1;
}

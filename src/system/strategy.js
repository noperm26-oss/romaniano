function aiCap(f){
  var base=50 + 10*(ownedCounts()[f]||0);
  var mod=typeof kingdomMod!=='undefined'?kingdomMod(f):null;
  if(mod){
    // economic kingdoms sustain larger, aggressive slightly smaller but faster
    base=Math.round(base*(mod.economy*0.6+0.6));
  }
  return base;
}
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
    var mod=typeof kingdomMod!=='undefined'?kingdomMod(f):{economy:1};
    var baseIncome=2 + oc[f]*0.4;
    // terrain & strategic income per zone
    for(var i=0;i<zones.length;i++){
      if(zones[i].owner===f){
        var inc=typeof zoneIncomeBase!=='undefined'?zoneIncomeBase(i):0;
        // Kemet — Nile Economy (L1): rich territories pay more
        if(f==='egypt' && inc>=4 && typeof factionHasPassive==='function' && factionHasPassive('egypt','nile-economy')) inc*=1.12;
        // faction terrain income affinity (spec §14)
        if(typeof factionTerrainIncome==='function'){
          var ti=zoneTerrain(i);
          inc*=factionTerrainIncome(f, ti);
        }
        // subtract base 2.2 to avoid double counting, keep site/bonus
        baseIncome+=Math.max(0, inc-2.2);
      }
    }
    // kingdom economy modifier
    baseIncome*= (0.7 + mod.economy*0.3);
    // faction income identity (doctrines, Flood of the Nile, ability strain)
    if(typeof factionIncomeMod==='function') baseIncome*=factionIncomeMod(f);
    // anti-snowball supply penalty
    if(typeof supplyPenalty!=='undefined') baseIncome*=supplyPenalty(f);
    // upkeep
    var upkeep=typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(f):0;
    baseIncome-=upkeep*0.35; // upkeep partially from income tick (scaled down, rest via rate)
    EC[f].gold += baseIncome*0.1; // tick is 0.1s scaled in update loop? keep same factor as before (original added per tick)
    if(EC[f].gold<0) EC[f].gold=0;
  });
  // extra per-zone bonuses (village tribute + sites) kept for compatibility but now via zoneIncomeBase
  for(var j=0;j<zones.length;j++){
    var z=zones[j];
    if(!z.owner) continue;
    // small extra for bonus already counted, but keep for legacy
    if(z.bonus) EC[z.owner].gold += 0.07;
    if(typeof zoneSiteRate!=='undefined' && zoneSiteRate) EC[z.owner].gold += zoneSiteRate[j]*0.1;
  }
}
function incomeRate(f){
  var oc=ownedCounts();
  var mod=typeof kingdomMod!=='undefined'?kingdomMod(f):{economy:1, upkeep:1};
  var r=2+(oc[f]||0)*0.4;
  for(var i=0;i<zones.length;i++){
    if(zones[i].owner===f){
      var inc=typeof zoneIncomeBase!=='undefined'?zoneIncomeBase(i):0;
      if(f==='egypt' && inc>=4 && typeof factionHasPassive==='function' && factionHasPassive('egypt','nile-economy')) inc*=1.12;
      if(typeof factionTerrainIncome==='function') inc*=factionTerrainIncome(f, zoneTerrain(i));
      r+=Math.max(0, inc-2.2);
    }
  }
  r*= (0.7 + mod.economy*0.3);
  if(typeof factionIncomeMod==='function') r*=factionIncomeMod(f);
  if(typeof supplyPenalty!=='undefined') r*=supplyPenalty(f);
  var upkeep=typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(f):0;
  r-=upkeep;
  return Math.max(0, r);
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
  var flippedZone=-1;
  var oldOwner=null;
  for(var z in counts){
    var zi2=+z, zone=zones[zi2];
    var c=counts[z];
    var best=null, bestN=0, others=0;
    FAC_KEYS.forEach(function(f){
      if(c[f]>bestN){ others+=bestN; bestN=c[f]; best=f; }
      else others+=c[f];
    });
    if(!best || others>=bestN) continue;
    // terrain defense + kingdom defense + anti-snowball defensive bonus
    var defBonus=0;
    if(typeof terrainDefenseBonus!=='undefined'){
      defBonus+=terrainDefenseBonus(typeof zoneTerrain!=='undefined'?zoneTerrain(zi2):'plains')*0.12;
    }
    // faction terrain affinity of the DEFENDER (spec §14)
    if(typeof factionTerrainDefense!=='undefined' && zone.owner){
      defBonus+=factionTerrainDefense(zone.owner, typeof zoneTerrain!=='undefined'?zoneTerrain(zi2):'plains')*0.12;
    }
    if(typeof defensiveBonus!=='undefined') defBonus+=defensiveBonus(zi2)*0.18;
    if(zone.owner){
      var km=typeof kingdomMod!=='undefined'?kingdomMod(zone.owner):null;
      if(km) defBonus+= (km.defense-1)*6;
      // building bonus
      if(typeof zoneBuildingBonus!=='undefined'){
        var bb=zoneBuildingBonus(zi2);
        defBonus+=bb.morale*8;
      }
    }
    zone.inf[best]+=bestN*0.7;
    FAC_KEYS.forEach(function(f){ if(f!==best && zone.inf[f]>0) zone.inf[f]=Math.max(0,zone.inf[f]-0.5); });
    var need = zone.owner===null ? 4 : (zone.core?16:11);
    need+=defBonus;
    // faction fortification identity: some walls hold longer than others (spec §2-§7)
    if(typeof factionZoneNeedMod!=='undefined' && zone.owner){
      need+=factionZoneNeedMod(zone.owner, zi2, c[zone.owner]||0, bestN);
    }
    if(zone.owner!==best && zone.inf[best]>=need){
      var old=zone.owner;
      oldOwner=old;
      flippedZone=zi2;
      zone.owner=best;
      FAC_KEYS.forEach(function(f){ zone.inf[f]=0; });
      flipped=true;
      reassignWorkers(zi2, best, old);
      /* faction identity events: raid loot & momentum (Norrøn),
         fear of the north, Kemet's economic consequences */
      if(typeof onZoneCaptured!=='undefined') onZoneCaptured(best, old, zi2);
      if(typeof onZoneLost!=='undefined' && old) onZoneLost(old, best, zi2);
      if(old===playerTeam){
        pendingAlerts.push({zi:zi2, t:gameTime});
        killFeedMsg('City lost', (villageNameAt(zi2)?'Satul '+villageNameAt(zi2):'A territory')+' has fallen — attack forces respond once secure', '#e06666');
      }
      if(playerTeam && best===playerTeam){
        Snd.horn();
        var inc=typeof zoneIncomeBase!=='undefined'?zoneIncomeBase(zi2):0;
        var terr=typeof zoneTerrain!=='undefined'?zoneTerrain(zi2):'plains';
        showBanner(zone.core?'Enemy stronghold taken!':'Territory seized!',
          'The banner of '+FACS[best].name+' rises | '+terr+' | +'+inc.toFixed(1)+'g/min', 2.8);
      } else if(playerTeam && old===playerTeam){
        showBanner('Territory lost!', FACS[best].name+' overruns your lands', 2.4);
      }
      // finalize battle tracking
      if(typeof finalizeBattle!=='undefined' && (counts[zi2][playerTeam]||counts[zi2][best])){
        finalizeBattle(zi2, best);
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
    /* each kingdom wants different ground (spec §10): score by identity,
       then roll among the three best so campaigns stay varied */
    var ranked;
    if(typeof factionTargetScore==='function'){
      ranked=targets.map(function(z){ return {z:z, s:0.5+Math.random()}; });
      ranked.forEach(function(r){ r.s+=factionTargetScore(team, r.z)*0.25; });
      ranked.sort(function(a,b){ return b.s-a.s; });
    } else {
      ranked=targets.map(function(z){ return {z:z}; });
    }
    var top=ranked.slice(0, Math.min(3, ranked.length));
    var target=choice(top).z;
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
/* which soldiers each kingdom musters first (spec §11/§21) */
var FACTION_UNIT_PREFS={
  rome:['legionarius','veles','sagittarius','princeps'],
  sparta:['spartiatis','hoplites','champion','toxotes','perioikoi'],
  moldavia:['viteaz','curtean','lancier','arcas','voievod'],
  vikings:['berserkr','huscarl','ulfhednar','bogi'],
  egypt:['warru','setjet','menfyt','medjay'],
  nippon:['samurai','yumi','ashigaru','sohei']
};
function aiBuyTick(){
  FAC_KEYS.forEach(function(team){
    if(team===playerTeam) return;
    var count=0;
    entities.forEach(function(e){ if(!e.dead&&!e.isPlayer&&e.team===team) count++; });
    var pers=typeof aiPersonalityFor!=='undefined'?aiPersonalityFor(team):{reserve:0.18, econFocus:0.5, name:'Balanced', cap:1};
    if(count>=aiCap(team)*(pers.cap||1)) return;
    var defs=RECRUIT_DEFS[team];
    var keys=Object.keys(defs);
    var gold=EC[team].gold;
    var reserve=gold*(pers.reserve||0.18);
    var canSpend=gold-reserve;
    if(canSpend<20) return;
    /* the kingdom musters its own kind of soldier */
    var prefs=(typeof FACTION_UNIT_PREFS!=='undefined'&&FACTION_UNIT_PREFS[team])?FACTION_UNIT_PREFS[team]:keys;
    var order=[];
    prefs.forEach(function(k){ if(defs[k]) order.push(k); });
    keys.forEach(function(k){ if(order.indexOf(k)<0) order.push(k); });
    var key=order[0];
    if(pers.name==='Raider'||pers.name==='Lion'){
      // raiding hosts & Spartans buy their most expensive effective troop they can afford
      var bestCost=-1;
      order.forEach(function(k){
        var d=defs[k];
        if(d.cost>bestCost && d.cost<=canSpend){ bestCost=d.cost; key=k; }
      });
    } else if(pers.name==='Pharaoh'){
      // the granary hires for volume: the cheapest troop it can afford
      var cheapCost=1e9;
      order.forEach(function(k){
        var d=defs[k];
        if(d.cost<cheapCost && d.cost<=canSpend*0.6){ cheapCost=d.cost; key=k; }
      });
    } else if(pers.name==='Shogun'){
      // the clans rotate through their specialists, favoring the rare
      key=order[Math.min(order.length-1, Math.floor(Math.random()*Math.min(3,order.length)))];
    } else {
      key=order[randi(0, Math.min(2, order.length-1))];
    }
    if(key==='champion'&&Math.random()<0.7) key=order[0];
    var cost=musterCost(team, key);
    if(EC[team].gold>=cost && canSpend>=cost){
      EC[team].gold-=cost;
      doMuster(team, key, false);
      /* Kemet — Granary (L3): replace losses in volume */
      if(team==='egypt' && typeof factionHasPassive==='function' && factionHasPassive('egypt','granary')
         && EC[team].gold>=musterCost(team, order[0]) && (battleLoss[team]||0)>0 && Math.random()<0.5){
        EC[team].gold-=musterCost(team, order[0]);
        doMuster(team, order[0], false);
      }
    }
  });
}
/* the true price of a recruit: base cost × faction identity
   (Sparta's elite training, abilities, doctrines, barracks discount) */
function musterCost(team, key){
  if(typeof RECRUIT_DEFS==='undefined'||!RECRUIT_DEFS[team]||!RECRUIT_DEFS[team][key]) return Infinity;
  var cost=RECRUIT_DEFS[team][key].cost;
  if(typeof factionRecruitCostMod==='function') cost*=factionRecruitCostMod(team);
  if(typeof _barracksDiscount!=='undefined' && _barracksDiscount) cost*=Math.max(0.5, 1-_barracksDiscount);
  return Math.ceil(cost);
}
function doMuster(team, key, announce){
  var td=townData[team];
  if(!td) return null;
  var def=RECRUIT_DEFS[team][key];
  var spot=findFreeSpot(td.hall.door.x+rand(-3,3), td.hall.door.z+rand(-2,2), 0.5);
  var e=spawnCharacter(key, team, spot.x, spot.z);
  // kingdom infantry modifier
  if(typeof kingdomMod!=='undefined'){
    var km=kingdomMod(team);
    if(km){
      e.maxHp=Math.round(e.maxHp*km.infantry);
      e.hp=e.maxHp;
      e.dmg*=km.infantry;
    }
  }
  // faction recruit identity (Sparta Elite Training, doctrines, specialists)
  if(typeof factionRecruitStrengthMod==='function'){
    var sm=factionRecruitStrengthMod(team, key);
    if(sm!==1){ e.maxHp=Math.round(e.maxHp*sm); e.hp=e.maxHp; e.dmg*=sm; }
  }
  // building recruit bonus
  if(typeof zoneBuildingBonus!=='undefined'){
    var zi=zoneIdxAt(td.hall.x, td.hall.z);
    var bb=zoneBuildingBonus(zi);
    if(bb && bb.recruit) e.dmg*=1+bb.recruit*0.4;
  }
  e.order=curOrder||'follow';
  if(e.order==='follow') e.sqIdx=playerUnits().length;
  if(team===playerTeam) scheduleReform();
  e.goal={x:td.hall.door.x+rand(-30,30), z:td.hall.door.z+TOWNS_and_front(team)*rand(20,45)};
  if(announce){
    Snd.coin(); Snd.horn();
    var disc=typeof _barracksDiscount!=='undefined'?_barracksDiscount:0;
    var msg=def.name+' joins the army'+(disc? ' (barracks -'+Math.round(disc*100)+'%)':'');
    killFeedMsg('Muster', msg, '#e9c458');
  }
  return e;
}
function TOWNS_and_front(team){
  var T=TOWNS[team];
  return T.z<0?1:-1;
}

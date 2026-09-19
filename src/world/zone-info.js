/* ------------------------------------------------------------
   zone-info.js — terrain types, strategic value, kingdom
   modifiers, building bonuses, anti-snowball helpers
   ------------------------------------------------------------ */

var ZONE_TERRAINS=['plains','forest','hills','mountains','desert','river'];
/* deterministic terrain per zone: based on ground height + noise */
function zoneTerrain(zi){
  var c=zoneCenter(zi);
  var h=groundH(c.x,c.z);
  var n=Math.sin(c.x*0.0017+c.z*0.0023)*0.5 + Math.cos(c.x*0.0031-c.z*0.0027)*0.5;
  var d=Math.sqrt(c.x*c.x+c.z*c.z);
  if(d<420) return 'city'; /* the Field */
  if(Math.abs(c.x)<120 && Math.abs(c.z)<2600) {
    if(Math.abs(c.x)<24) return 'river';
  }
  if(h>7.5) return 'mountains';
  if(h>4.2) return 'hills';
  if(n>0.6) return 'forest';
  if(d>2200 && Math.abs(c.x)>800) return 'desert';
  if(n<-0.4) return 'river';
  return 'plains';
}
function terrainDefenseBonus(t){
  switch(t){
    case 'forest': return 20;
    case 'hills': return 15;
    case 'mountains': return 35;
    case 'river': return 10;
    case 'city': return 25;
    case 'desert': return -5;
    default: return 0;
  }
}
function terrainMoveCost(t){
  switch(t){
    case 'plains': return 1.0;
    case 'forest': return 1.25;
    case 'hills': return 1.35;
    case 'mountains': return 1.8;
    case 'desert': return 1.15;
    case 'river': return 1.4;
    case 'city': return 0.9;
    default: return 1.0;
  }
}
function zoneStrategicValue(zi){
  var z=zones[zi];
  if(!z) return 'Low';
  if(z.core) return 'Capital';
  if(z.bonus) return 'High';
  var rate=(typeof zoneSiteRate!=='undefined' && zoneSiteRate)?zoneSiteRate[zi]:0;
  if(rate>0.25) return 'High';
  if(rate>0.12) return 'Medium';
  if(terrainDefenseBonus(zoneTerrain(zi))>=20) return 'Medium';
  return 'Low';
}
function zoneIncomeBase(zi){
  var t=zoneTerrain(zi);
  var base=2.2;
  switch(t){
    case 'city': base=6; break;
    case 'forest': base=3.0; break;
    case 'hills': base=2.8; break;
    case 'mountains': base=3.5; break;
    case 'desert': base=1.2; break;
    case 'river': base=3.2; break;
    default: base=2.2;
  }
  var z=zones[zi];
  if(z && z.core) base+=4;
  if(z && z.bonus) base+=1.8;
  var rate=(typeof zoneSiteRate!=='undefined' && zoneSiteRate)?zoneSiteRate[zi]:0;
  base+=rate*3;
  return base;
}
function zonePopulation(zi){
  var t=zoneTerrain(zi);
  var pop=0;
  switch(t){
    case 'city': pop=18000; break;
    case 'plains': pop=8000; break;
    case 'forest': pop=5200; break;
    case 'hills': pop=4100; break;
    case 'mountains': pop=2200; break;
    case 'desert': pop=1500; break;
    case 'river': pop=9600; break;
    default: pop=6000;
  }
  var z=zones[zi];
  if(z && z.core) pop*=2.2;
  if(z && z.bonus) pop*=1.6;
  var rate=(typeof zoneSiteRate!=='undefined' && zoneSiteRate)?zoneSiteRate[zi]:0;
  pop+=rate*12000;
  return Math.round(pop);
}

/* Kingdom gameplay differences — the base layer of faction identity
   (full identity, passives, doctrines & AI behavior live in
   src/system/faction-identity.js). Balance rule: every kingdom keeps
   a real weakness — none of these rows is uniformly strong. */
var KINGDOM_MODS={
  sparta:{ name:'Sparta', infantry:1.10, defense:1.16, economy:0.84, upkeep:1.12, move:0.97, desc:'Elite infantry & phalanx defense; expensive, slow to replace' },
  rome:{ name:'Roma', infantry:1.05, defense:1.12, economy:1.04, upkeep:0.93, move:0.98, desc:'Logistics & fortification: big armies stay affordable, elite units cost extra' },
  moldavia:{ name:'Moldova', infantry:1.02, defense:1.06, economy:1.08, upkeep:1.0, move:1.06, desc:'Frontier flexibility: fast response, strong on home ground' },
  vikings:{ name:'Norrøn', infantry:1.12, defense:0.90, economy:0.92, upkeep:0.90, move:1.14, desc:'Raiding host: devastating on the move, weak on the wall' },
  egypt:{ name:'Kemet', infantry:0.96, defense:1.0, economy:1.24, upkeep:0.92, move:1.0, desc:'The granary: income, population and infrastructure outlast rivals' },
  nippon:{ name:'Nippon', infantry:1.08, defense:0.98, economy:0.96, upkeep:0.90, move:1.10, desc:'Clan specialists: precision over raw size' }
};
function kingdomMod(f){ return KINGDOM_MODS[f]||KINGDOM_MODS.moldavia; }

/* Building bonuses: if a zone contains a specific building type, give modifiers */
function zoneBuildingBonus(zi){
  // Look up nearby building types from SITES
  var bonus={recruit:0, morale:0, treasury:0, manpower:0};
  if(typeof SITES==='undefined') return bonus;
  for(var i=0;i<SITES.length;i++){
    var s=SITES[i];
    if(s.zi!==zi) continue;
    switch(s.type){
      case 'farm': bonus.manpower+=0.15; bonus.treasury+=0.08; break;
      case 'market': bonus.treasury+=0.22; break;
      case 'forge': bonus.recruit+=0.18; break;
      case 'mine': bonus.treasury+=0.18; break;
      case 'cave': bonus.treasury+=0.12; break;
      default: break;
    }
  }
  /* Kemet — Royal Infrastructure (L2): the state makes every building work harder */
  if(typeof factionHasPassive==='function' && factionHasPassive('egypt','royal-infrastructure')){
    var zOwner=zones[zi]?zones[zi].owner:null;
    if(zOwner==='egypt'){ bonus.treasury*=1.3; bonus.manpower*=1.3; bonus.recruit*=1.3; }
  }
  var z=zones[zi];
  if(z && z.core){
    bonus.recruit+=0.25; bonus.morale+=0.2; bonus.treasury+=0.15;
  }
  if(z && z.bonus){
    bonus.manpower+=0.12; bonus.treasury+=0.1;
  }
  return bonus;
}

/* Anti-snowball: upkeep, supply penalty, defensive bonus for threatened.
   Faction identity layers on top (spec §11): Rome's logistics make big
   armies cheaper, ability strain raises upkeep, doctrines tweak it. */
function armyUpkeepCost(team){
  var count=0;
  if(typeof entities!=='undefined'){
    for(var i=0;i<entities.length;i++){
      var e=entities[i];
      if(!e.dead && !e.passive && e.team===team) count++;
    }
  }
  var mod=kingdomMod(team);
  // Base upkeep 0.02 gold/sec per soldier, scaled by kingdom and size
  var base=count*0.022*mod.upkeep;
  // Large army penalty: beyond 80, cost grows 1.5x
  if(count>80) base+= (count-80)*0.015*mod.upkeep;
  if(count>150) base+= (count-150)*0.02;
  // Roman Military Logistics (L2): the state feeds the legions
  if(typeof factionHasPassive==='function' && factionHasPassive('rome','military-logistics') && team==='rome') base*=0.92;
  // Faction upkeep identity (ability strain, doctrine, kingdom upkeepMod)
  if(typeof factionUpkeepMod==='function') base*=factionUpkeepMod(team);
  return base;
}
function supplyPenalty(team){
  var oc=typeof ownedCounts!=='undefined'?ownedCounts():null;
  if(!oc) return 1;
  var owned=oc[team]||0;
  // Long-distance penalty: owning >80 zones makes distant zones less efficient
  var p=1;
  if(owned>=60) p=0.92;
  if(owned>=100) p=0.85;
  if(owned>=140) p=0.78;
  // Rome — Imperial Administration (L4): distant provinces still pay
  if(p<1 && typeof factionHasPassive==='function' && factionHasPassive('rome','imperial-administration') && team==='rome'){
    p=1-(1-p)*0.35;   /* penalty reduced by two thirds */
  }
  return p;
}
function defensiveBonus(zi){
  var oc=typeof ownedCounts!=='undefined'?ownedCounts():null;
  if(!oc || !zones[zi]) return 0;
  var owner=zones[zi].owner;
  if(!owner) return 0;
  var owned=oc[owner]||0;
  // If owner is losing ( <20 zones), give recovery bonus
  if(owned<15) return 18;
  if(owned<30) return 10;
  // If zone is core and owner is threatened (<40 zones), extra defense
  if(zones[zi].core && owned<45) return 15;
  return 0;
}

/* Battle tracking for reports */
var lastBattle={time:0, zone:-1, enemyLoss:0, ourLoss:0, gold:0, result:'', armyRemaining:0, territoryCaptured:-1};
var battleLoss={};
function resetBattleTracking(){
  battleLoss={};
  FAC_KEYS.forEach(function(f){ battleLoss[f]=0; });
}
function recordKill(victimTeam){
  if(!battleLoss[victimTeam]) battleLoss[victimTeam]=0;
  battleLoss[victimTeam]++;
}
function finalizeBattle(zoneIdx, winner){
  var oc=ownedCounts();
  var enemyLoss=0, ourLoss=0;
  if(playerTeam){
    ourLoss=battleLoss[playerTeam]||0;
    FAC_KEYS.forEach(function(f){
      if(f!==playerTeam) enemyLoss+=battleLoss[f]||0;
    });
  }
  lastBattle={
    time:typeof gameTime!=='undefined'?gameTime:0,
    zone:zoneIdx,
    enemyLoss:enemyLoss,
    ourLoss:ourLoss,
    gold:Math.round(oc[playerTeam]? (typeof zoneIncomeBase!=='undefined'?zoneIncomeBase(zoneIdx)*18:0):0),
    result:winner===playerTeam?'Victory':(winner?'Defeat':'Stalemate'),
    armyRemaining:typeof teamAliveCount!=='undefined'?teamAliveCount(playerTeam):0,
    territoryCaptured:zoneIdx
  };
  if(playerTeam && (enemyLoss+ourLoss)>3){
    showBanner('BATTLE: '+lastBattle.result,
      'Enemy Losses: '+enemyLoss+' | Our Losses: '+ourLoss+' | Army: '+lastBattle.armyRemaining+' | '+(lastBattle.result==='Victory'?'Gold +'+lastBattle.gold:''),
      4.5);
    // populate detailed battle report panel
    var br=$('battle-report');
    if(br){
      var terr=typeof zoneTerrain!=='undefined'?zoneTerrain(zoneIdx):'plains';
      var strat=typeof zoneStrategicValue!=='undefined'?zoneStrategicValue(zoneIdx):'Low';
      $('br-title').textContent='BATTLE RESULT — '+lastBattle.result;
      $('br-body').innerHTML='<div class=\"line\"><span>Territory</span><b>#'+zoneIdx+' ('+terr+' — '+strat+')</b></div>'
        +'<div class=\"line\"><span>Enemy Losses</span><b>'+enemyLoss+'</b></div>'
        +'<div class=\"line\"><span>Our Losses</span><b>'+ourLoss+'</b></div>'
        +'<div class=\"line\"><span>Territory Captured</span><b>'+(winner===playerTeam?'#'+zoneIdx:'—')+'</b></div>'
        +'<div class=\"line\"><span>Gold Gained</span><b>'+(winner===playerTeam?'+'+lastBattle.gold:'0')+'</b></div>'
        +'<div class=\"line\"><span>Army Remaining</span><b>'+lastBattle.armyRemaining+'</b></div>';
      br.classList.remove('hidden');
    }
  }
  resetBattleTracking();
}

/* ------------------------------------------------------------
   zone-info.js — terrain types, strategic value, kingdom
   modifiers, building bonuses, anti-snowball helpers
   EXTENDED EDITION: carpathian, transylvanian, wallachian,
   moldavian, trade_route, capital, battlefield
   ------------------------------------------------------------ */

var ZONE_TERRAINS=['plains','forest','hills','mountains','desert','river','carpathian','transylvanian','wallachian','moldavian','trade_route','capital','battlefield','city'];
/* deterministic terrain per zone: based on region + ground height + noise */
function zoneTerrain(zi){
  var c=zoneCenter(zi);
  var region = typeof getRegion!=='undefined' ? getRegion(c.x,c.z) : 'plains';
  var h=groundH(c.x,c.z);
  var n=Math.sin(c.x*0.0017+c.z*0.0023)*0.5 + Math.cos(c.x*0.0031-c.z*0.0027)*0.5;
  var d=Math.sqrt(c.x*c.x+c.z*c.z);
  if(d<520) return 'capital'; /* Romaria capital */
  if(d<420) return 'city'; /* the Field legacy */
  if(region==='carpathian'){
    if(h>8) return 'mountains';
    if(h>4) return 'carpathian';
    return 'forest';
  }
  if(region==='transylvanian'){
    if(n>0.5) return 'forest';
    if(h>3) return 'hills';
    return 'transylvanian';
  }
  if(region==='wallachian'){
    if(n<-0.4) return 'river';
    if(h<1) return 'plains';
    return 'wallachian';
  }
  if(region==='moldavian'){
    if(h>6) return 'mountains';
    if(n>0.3) return 'forest';
    if(h>2.5) return 'moldavian';
    return 'hills';
  }
  if(region==='trade_route'){
    if(Math.abs(c.x)<120 && Math.abs(c.z-2500)<200) return 'river';
    if(n<-0.3) return 'desert';
    return 'trade_route';
  }
  if(region==='capital'){
    return 'capital';
  }
  if(region==='battlefield'){
    return 'battlefield';
  }
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
    case 'carpathian': return 30;
    case 'transylvanian': return 12;
    case 'wallachian': return 8;
    case 'moldavian': return 18;
    case 'trade_route': return 5;
    case 'capital': return 28;
    case 'battlefield': return 10;
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
    case 'carpathian': return 1.7;
    case 'transylvanian': return 1.1;
    case 'wallachian': return 1.05;
    case 'moldavian': return 1.3;
    case 'trade_route': return 0.85;
    case 'capital': return 0.9;
    case 'battlefield': return 1.15;
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
    case 'capital': base=7.5; break;
    case 'forest': base=3.0; break;
    case 'hills': base=2.8; break;
    case 'mountains': base=3.5; break;
    case 'desert': base=1.2; break;
    case 'river': base=3.2; break;
    case 'carpathian': base=4.2; break;
    case 'transylvanian': base=3.8; break;
    case 'wallachian': base=2.5; break;
    case 'moldavian': base=3.3; break;
    case 'trade_route': base=4.5; break;
    case 'battlefield': base=1.8; break;
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
    case 'capital': pop=25000; break;
    case 'plains': pop=8000; break;
    case 'forest': pop=5200; break;
    case 'hills': pop=4100; break;
    case 'mountains': pop=2200; break;
    case 'desert': pop=1500; break;
    case 'river': pop=9600; break;
    case 'carpathian': pop=1800; break;
    case 'transylvanian': pop=9500; break;
    case 'wallachian': pop=7200; break;
    case 'moldavian': pop=4800; break;
    case 'trade_route': pop=11000; break;
    case 'battlefield': pop=1200; break;
    default: pop=6000;
  }
  var z=zones[zi];
  if(z && z.core) pop*=2.2;
  if(z && z.bonus) pop*=1.6;
  var rate=(typeof zoneSiteRate!=='undefined' && zoneSiteRate)?zoneSiteRate[zi]:0;
  pop+=rate*12000;
  return Math.round(pop);
}

/* Kingdom gameplay differences — not just visual — extended for Romanian world */
var KINGDOM_MODS={
  sparta:{ name:'Ardealburg', infantry:1.18, defense:1.22, economy:0.82, upkeep:1.08, move:0.98, desc:'Transylvanian fortified town — strong infantry & defense, weaker economy' },
  rome:{ name:'Cetatea Dunarii', infantry:1.05, defense:1.18, economy:1.05, upkeep:1.15, move:1.0, desc:'Wallachian fortress — organized defense & infrastructure, higher upkeep' },
  moldavia:{ name:'Moldova — Hotarul de Nord', infantry:1.0, defense:1.08, economy:1.12, upkeep:1.0, move:1.02, desc:'Moldavian Borderlands — balanced economy & regional defense' },
  vikings:{ name:'Stanca de Fier', infantry:1.12, defense:0.92, economy:0.9, upkeep:0.92, move:1.15, desc:'Carpathian mountain fort — aggressive warfare & mobility' },
  egypt:{ name:'Drumul Lung', infantry:0.95, defense:1.0, economy:1.22, upkeep:0.95, move:1.0, desc:'Southern Trade Route — economy & ranged/support' },
  nippon:{ name:'Romaria', infantry:1.08, defense:0.98, economy:0.95, upkeep:0.92, move:1.12, desc:'Capital City — disciplined specialists & mobility' }
};
function kingdomMod(f){ return KINGDOM_MODS[f]||KINGDOM_MODS.moldavia; }

/* Building bonuses: if a zone contains a specific building type, give modifiers */
function zoneBuildingBonus(zi){
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
      case 'watchtower': bonus.recruit+=0.12; bonus.morale+=0.08; break;
      case 'fort': bonus.recruit+=0.20; bonus.morale+=0.12; break;
      case 'shrine': bonus.morale+=0.15; break;
      case 'inn': bonus.treasury+=0.15; bonus.manpower+=0.10; break;
      case 'tradepost': bonus.treasury+=0.25; break;
      case 'warcamp': bonus.recruit+=0.22; break;
      case 'school': bonus.morale+=0.10; bonus.treasury+=0.08; break;
      case 'hunter': bonus.manpower+=0.12; break;
      case 'noble': bonus.treasury+=0.20; bonus.recruit+=0.10; break;
      case 'library': bonus.morale+=0.12; break;
      case 'stable': bonus.recruit+=0.10; bonus.manpower+=0.08; break;
      case 'checkpoint': bonus.treasury+=0.12; bonus.morale+=0.05; break;
      default: break;
    }
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

/* Anti-snowball: upkeep, supply penalty, defensive bonus for threatened */
function armyUpkeepCost(team){
  var count=0;
  if(typeof entities!=='undefined'){
    for(var i=0;i<entities.length;i++){
      var e=entities[i];
      if(!e.dead && !e.passive && e.team===team) count++;
    }
  }
  var mod=kingdomMod(team);
  var base=count*0.022*mod.upkeep;
  if(count>80) base+= (count-80)*0.015*mod.upkeep;
  if(count>150) base+= (count-150)*0.02;
  return base;
}
function supplyPenalty(team){
  var oc=typeof ownedCounts!=='undefined'?ownedCounts():null;
  if(!oc) return 1;
  var owned=oc[team]||0;
  if(owned<60) return 1;
  if(owned<100) return 0.92;
  if(owned<140) return 0.85;
  return 0.78;
}
function defensiveBonus(zi){
  var oc=typeof ownedCounts!=='undefined'?ownedCounts():null;
  if(!oc || !zones[zi]) return 0;
  var owner=zones[zi].owner;
  if(!owner) return 0;
  var owned=oc[owner]||0;
  if(owned<15) return 18;
  if(owned<30) return 10;
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

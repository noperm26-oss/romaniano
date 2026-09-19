/* ============================================================
   faction-battle.js — the battlefield expression of faction
   identity: Battle Momentum (Norrøn), legion & phalanx
   formation mechanics (Rome/Sparta), frontier punishment
   (Moldova), precision & crits (Nippon), zone-capture
   resistance, and the per-faction battle status the HUD
   shows (spec §19).
   ============================================================ */

var FAC_MOMENTUM={};

function momentumOf(f){ var m=(typeof FAC_MOMENTUM!=='undefined')?FAC_MOMENTUM[f]:null; return m?m.value:0; }

/* ---------- Norrøn: Battle Momentum (spec §5) ---------- */
function onZoneCaptured(winner, loser, zi){
  if(winner!=='vikings') return;
  var m=FAC_MOMENTUM.vikings;
  if(!m) return;
  var now=(typeof gameTime!=='undefined')?gameTime:0;
  m.streak=(m.lastWin&&now-m.lastWin<120)?Math.min(4,m.streak+1):1;
  m.value=Math.max(m.value,m.streak);
  m.lastWin=now;
  /* Raider Culture: war-booty, short rally, movement burst */
  if(typeof EC!=='undefined'&&EC.vikings){
    var inc=(typeof zoneIncomeBase==='function')?zoneIncomeBase(zi):2.2;
    var lootMod=1.5;
    var fx=(typeof abilityFx==='function')?abilityFx('vikings'):null;
    if(fx&&fx.loot) lootMod*=fx.loot;
    var d=doctrineMod('vikings');
    if(d.raid) lootMod*=d.raid;
    if(d.conquer) lootMod*=d.conquer;
    var loot=Math.round(inc*12*lootMod);
    EC.vikings.gold+=loot;
    if(winner===playerTeam) killFeedMsg('Raider Culture', 'War-booty +'+loot+' gold · momentum +'+m.value, '#d08a3e');
  }
  var c=(typeof zoneCenter==='function')?zoneCenter(zi):null;
  if(c && typeof entities!=='undefined'){
    for(var i=0;i<entities.length;i++){
      var e=entities[i];
      if(e.dead||e.isPlayer||e.team!=='vikings') continue;
      var dx=e.group.position.x-c.x, dz=e.group.position.z-c.z;
      if(dx*dx+dz*dz<150*150) e.rallyT=Math.max(e.rallyT||0,5);
    }
    /* Fear of the North (L3): the losing army wavers */
    if(loser && factionHasPassive('vikings','fear-of-the-north')){
      for(var j=0;j<entities.length;j++){
        var f2=entities[j];
        if(f2.dead||f2.isPlayer||f2.team!==loser) continue;
        var ex=f2.group.position.x-c.x, ez=f2.group.position.z-c.z;
        if(ex*ex+ez*ez<180*180) applyMoralePenalty(f2, 14, 0.88);
      }
    }
  }
  if(winner===playerTeam){
    showBanner('MOMENTUM +'+m.value, 'The North grows fearful — '+m.value+' victory point'+(m.value>1?'s':'')+' (decays without blood)', 2.6);
  }
}
function onZoneLost(loser, winner, zi){
  var m=(typeof FAC_MOMENTUM!=='undefined')?FAC_MOMENTUM[loser]:null;
  if(m){ m.value=0; m.streak=0; m.lastWin=0; }
  /* Kemet: losing an economic heart has real consequences (spec §6) */
  if(loser==='egypt' && (typeof zoneIncomeBase!=='undefined') && zoneIncomeBase(zi)>=5){
    if(typeof EC!=='undefined' && EC.egypt){
      EC.egypt.gold=Math.max(0, EC.egypt.gold-30);
      if(playerTeam===loser) showBanner('The Granary Burns', 'An economic heart is lost — treasury −30 gold. Rebuild it, or starve for it.', 3);
    }
  }
}
function updateMomentum(dt){
  if(typeof FAC_MOMENTUM==='undefined' || !Object.keys(FAC_MOMENTUM).length) return;
  var now=(typeof gameTime!=='undefined')?gameTime:0;
  FAC_KEYS.forEach(function(f){
    var m=FAC_MOMENTUM[f];
    if(!m||m.value<=0) return;
    if(now-m.lastWin>90){
      m.decayAt=m.decayAt||now+30;
      if(now>=m.decayAt){
        m.value--; m.streak=m.value; m.decayAt=now+30;
        if(m.value<=0){ m.streak=0; m.lastWin=0; m.decayAt=0; }
      }
    } else m.decayAt=0;
  });
}

/* ---------- formation cohesion (Rome & Sparta) ---------- */
function legionCohesion(e){
  if(!e||e.dead||typeof eqNear!=='function') return 0;
  var allies=0;
  eqNear(e.group.position.x, e.group.position.z, 14, function(o){
    if(o===e||o.dead||o.passive||o.team!==e.team||o.ranged) return;
    allies++;
  });
  return Math.min(1, allies/6);
}
function phalanxFormed(e){
  if(!e||e.dead||e.ranged||typeof eqNear!=='function') return false;
  var allies=0;
  eqNear(e.group.position.x, e.group.position.z, 11, function(o){
    if(o===e||o.dead||o.passive||o.team!==e.team||o.ranged) return;
    allies++;
  });
  return allies>=4;
}
function lastStandActive(e){
  if(!e||e.team!=='sparta'||e.dead||typeof zones==='undefined') return false;
  if(!factionHasPassive('sparta','last-stand')) return false;
  var zi=zoneIdxAt(e.group.position.x, e.group.position.z);
  var z=zones[zi];
  if(!z||z.owner!=='sparta'||!(z.core||z.bonus)) return false;
  var own=0, foe=0;
  eqNear(e.group.position.x, e.group.position.z, 60, function(o){
    if(o.dead||o.passive||o.civ) return;
    if(o.team==='sparta') own++; else foe++;
  });
  var mult=(doctrineMod('sparta').laststand)||1;   /* Last Stand doctrine: triggers earlier */
  return foe>=Math.max(4, own*3*mult);
}

/* ---------- combat modifiers (hooked into combat.js) ---------- */
function factionIncomingMod(target, fromX, fromZ){
  var m=1;
  var f=target.team;
  if(!f) return m;
  var c=factionCfg(f);
  if(!c) return m;
  var fx=(typeof abilityFx==='function')?abilityFx(f):null;
  if(fx&&fx.incoming) m*=fx.incoming;
  if(f==='sparta'){
    if(fx&&fx.meleeDef) m*=fx.meleeDef;                 /* 300's Resolve */
    if(factionHasPassive('sparta','phalanx') && phalanxFormed(target)){
      var dx=fromX-target.group.position.x, dz=fromZ-target.group.position.z;
      var front=Math.abs(angDiff(target.yaw, Math.atan2(dx,dz)));
      if(front<1.1) m*=(doctrineMod('sparta').phalanx===1.45?0.55:0.65);  /* shield wall front */
      else if(front>2.2) m*=1.15;                                       /* flank/rear exposed */
    }
    if(lastStandActive(target)) m*=0.82;
  }
  if(f==='rome' && factionHasPassive('rome','legionary-discipline')){
    var coh=legionCohesion(target);
    if(coh>0.3) m*=(1-0.10*coh);
  }
  if(f==='moldavia' && factionHasPassive('moldavia','frontier-warfare')){
    var zi=zoneIdxAt(target.group.position.x, target.group.position.z);
    if(zones[zi] && zones[zi].owner==='moldavia') m*=0.95;   /* homeland footing */
  }
  if(f==='vikings' && fx && fx.risk){
    var own=1, foe=0;
    eqNear(target.group.position.x, target.group.position.z, 40, function(o){
      if(o.dead||o.passive||o.civ) return;
      if(o.team==='vikings') own++; else foe++;
    });
    if(foe>=own*2) m*=fx.risk;   /* a raid caught in a trap */
  }
  var d=doctrineMod(f);
  if(d.berserkDef) m*=d.berserkDef;
  return m;
}
function factionOutgoingMod(e){
  var m=1;
  var f=e.team;
  if(!f) return m;
  var c=factionCfg(f);
  if(!c) return m;
  var fx=(typeof abilityFx==='function')?abilityFx(f):null;
  if(fx){
    if(fx.dmg) m*=fx.dmg;
    if(fx.mode==='ambush'||fx.firstStrike){
      var st=(typeof FAC_ABIL!=='undefined')?FAC_ABIL[f]:null;
      m*=(st&&st.ambushT>0)?fx.firstStrike:fx.then;
    }
  }
  var d=doctrineMod(f);
  if(f==='sparta'){
    if(factionHasPassive('sparta','warrior-culture') && !e.ranged && (e.kind==='spartiatis'||e.kind==='hoplites'||e.kind==='champion')) m*=1.10;
    if(lastStandActive(e)) m*=1.12;
    if(d.berserk) m*=d.berserk;
  }
  if(f==='rome' && factionHasPassive('rome','legionary-discipline')){
    var coh=legionCohesion(e);
    m*=(1+0.10*coh*(d.formation||1));
  }
  if(f==='vikings'){
    var mo=momentumOf('vikings');
    if(mo>0) m*=(1+0.03*mo);
  }
  if(f==='moldavia' && factionHasPassive('moldavia','frontier-warfare')){
    var zi=zoneIdxAt(e.group.position.x, e.group.position.z);
    if(zones[zi] && zones[zi].owner==='moldavia') m*=(1+0.08*(d.frontier||1));
  }
  if(f==='nippon'){
    if(factionHasPassive('nippon','precision-training') && e.ranged) m*=1.06;
    if(factionHasPassive('nippon','specialist-warfare') && (e.kind==='yumi'||e.kind==='sohei')) m*=1.08;
  }
  return m;
}
function factionCritChance(e){
  if(!e||e.team!=='nippon') return 0;
  if(!factionHasPassive('nippon','precision-training')) return 0;
  var ch=e.ranged?0.12:0.08;
  var d=doctrineMod('nippon');
  if(d.precision) ch*=d.precision;
  var fx=(typeof abilityFx==='function')?abilityFx('nippon'):null;
  if(fx&&fx.crit) ch*=fx.crit;
  return ch;
}
function factionArrowInacc(e, base){
  if(e && e.team==='nippon'){
    if(factionHasPassive('nippon','precision-training')) base*=0.7;
    var fx=(typeof abilityFx==='function')?abilityFx('nippon'):null;
    if(fx&&fx.crit) base*=0.6;
  }
  return base;
}

/* ---------- capture resistance (hooked into captureTick) ---------- */
function factionZoneNeedMod(owner, zi, defenderCount, attackerCount){
  var m=0;
  if(!owner||typeof zones==='undefined'||!zones[zi]) return m;
  var z=zones[zi];
  if(owner==='rome' && factionHasPassive('rome','roman-engineering')){
    m+= z.core?8:(z.bonus?4:1);
    var d=doctrineMod('rome');
    if(d.fort) m*=d.fort;
  }
  if(owner==='sparta' && factionHasPassive('sparta','last-stand') && z.core){
    if(attackerCount>=Math.max(4, defenderCount*2.1)) m+=10;
  }
  if(owner==='moldavia' && factionHasPassive('moldavia','frontier-warfare') && (z.core||z.bonus)) m+=4;
  if(owner==='egypt' && factionHasPassive('egypt','royal-infrastructure') && z.core) m+=5;
  if(owner==='nippon'){
    var t=(typeof zoneTerrain==='function')?zoneTerrain(zi):'plains';
    if(t==='hills'||t==='forest') m+=4;
  }
  if(owner==='vikings') m-=4;   /* the raiding host does not hold stone walls (spec weakness) */
  return m;
}

/* ---------- Kemet supply (spec §6) & battle status (spec §19) ---------- */
function kemetSupplyEfficiency(f){
  if(typeof incomeRate!=='undefined' && typeof armyUpkeepCost!=='undefined'){
    var inc=incomeRate(f), up=armyUpkeepCost(f);
    if(inc>up) return Math.min(100, Math.round(88+Math.min(12,(inc-up)/Math.max(1,inc)*100)));
    return Math.max(0, Math.round(inc/Math.max(1,up)*70));
  }
  return 70;
}
function factionBattleStatus(f){
  if(typeof playerTeam==='undefined' || f!==playerTeam) return null;
  var c=factionCfg(f);
  if(!c) return null;
  var army=(typeof playerUnits==='function')?playerUnits():[];
  if(f==='rome'){
    var sum=0, n=0;
    army.forEach(function(e){ if(!e.ranged){ sum+=legionCohesion(e); n++; } });
    var pct=n?Math.round(sum/n*100):0;
    return {title:'LEGION FORMATION', value:'Integrity: '+pct+'%', good:pct>=60};
  }
  if(f==='sparta'){
    var a=(typeof FAC_ABIL!=='undefined')?FAC_ABIL.sparta:null;
    var label='STEADY';
    if(a&&a.t>0) label='RESOLVED';
    else if(player && lastStandActive(player)) label='EXTREME';
    return {title:'WARRIOR MORALE', value:'Morale: '+label, good:label!=='STEADY'};
  }
  if(f==='moldavia'){
    var active=false;
    if(player){
      var zi=zoneIdxAt(player.group.position.x, player.group.position.z);
      active=!!(zones[zi]&&zones[zi].owner==='moldavia');
    }
    return {title:'FRONTIER DEFENSE', value:'Homeland Bonus: '+(active?'ACTIVE':'—'), good:active};
  }
  if(f==='vikings'){
    var m=momentumOf('vikings');
    return {title:'BATTLE MOMENTUM', value:'Momentum: '+(m>0?'+'+m:'—'), good:m>0};
  }
  if(f==='egypt'){
    var eff=kemetSupplyEfficiency('egypt');
    return {title:'SUPPLY NETWORK', value:'Supply Efficiency: '+eff+'%', good:eff>=60};
  }
  if(f==='nippon'){
    var a2=(typeof FAC_ABIL!=='undefined')?FAC_ABIL.nippon:null;
    if(a2&&a2.t>0) return {title:'TACTICAL ADVANTAGE', value:(a2.mode||'tactic').toUpperCase()+' Tactic: ACTIVE', good:true};
    return {title:'TACTICAL ADVANTAGE', value:'Precision Bonus: READY (F)', good:false};
  }
  return null;
}

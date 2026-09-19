/* ============================================================
   faction-abilities.js — signature abilities (spec §2):
   the active heart of each faction. Each is a risk/reward
   decision: a burst with a price paid afterwards, gated
   behind Kingdom Level 5 progression (spec §16).
   The AI Brain also uses them (spec §21-22).
   ============================================================ */

var FAC_ABIL={};

function abilityData(f){ var c=factionCfg(f); return c?c.ability:null; }
function abilityFx(f){
  var st=(typeof FAC_ABIL!=='undefined'&&FAC_ABIL)?FAC_ABIL[f]:null;
  var c=factionCfg(f);
  if(!st||!c||st.t<=0) return null;
  var ab=c.ability;
  return (ab.modeFx&&st.mode&&ab.modeFx[st.mode])?ab.modeFx[st.mode]:(ab.fx||null);
}
function abilityStrain(f){
  var st=(typeof FAC_ABIL!=='undefined'&&FAC_ABIL)?FAC_ABIL[f]:null;
  var c=factionCfg(f);
  if(!st||!c||st.strain<=0) return null;
  return c.ability.strain||null;
}
function canActivateAbility(f, mode){
  var c=factionCfg(f);
  if(!c) return {ok:false, reason:'unknown faction'};
  var st=FAC_ABIL[f];
  if(!st) return {ok:false, reason:'no state'};
  var ab=c.ability;
  if(factionLevel(f)<5) return {ok:false, reason:'unlocks at Kingdom Level 5 (40 zones)'};
  if(ab.needsMode&&!mode) return {ok:false, reason:'choose a tactic (ability bar)'};
  if(ab.modes&&mode&&ab.modes.indexOf(mode)<0) return {ok:false, reason:'unknown tactic'};
  if(!ab.needsMode&&mode) return {ok:false, reason:'no tactic needed'};
  if(st.t>0) return {ok:false, reason:'already active ('+Math.ceil(st.t)+'s left)'};
  if(st.cd>0) return {ok:false, reason:'recovering ('+Math.ceil(st.cd)+'s)'};
  return {ok:true};
}
function tryActivateAbility(f, mode){
  var chk=canActivateAbility(f, mode);
  if(!chk.ok) return chk;
  var c=factionCfg(f), ab=c.ability, st=FAC_ABIL[f];
  st.t=ab.duration; st.mode=mode||null; st.strain=0;
  st.ambushT=(ab.modeFx&&ab.modeFx[mode]&&ab.modeFx[mode].ambushT)?ab.modeFx[mode].ambushT:0;
  if(typeof Snd!=='undefined'){ Snd.tone(300,540,0.5,'square',0.12,0.1); Snd.horn(); }
  if(typeof playerTeam!=='undefined' && f===playerTeam && player && !player.dead){
    showBanner(ab.name+(mode?' — '+mode.toUpperCase():''), c.name+': '+ab.desc, 3.2);
    if(typeof spawnRing!=='undefined') spawnRing(player.group.position.x, player.group.position.y+0.3, player.group.position.z, parseInt(c.color.slice(1),16));
    if(typeof killFeedMsg!=='undefined') killFeedMsg('Signature', ab.name+(mode?' ('+mode+')':'')+' — '+ab.desc, '#e9c458');
  }
  if(typeof updateAbilityBar==='function') updateAbilityBar(true);
  return {ok:true};
}
function updateFactionAbilities(dt){
  if(typeof FAC_ABIL==='undefined') return;
  FAC_KEYS.forEach(function(f){
    var st=FAC_ABIL[f];
    if(!st) return;
    var c=factionCfg(f);
    if(!c) return;
    if(st.t>0){
      st.t-=dt;
      if(st.ambushT>0) st.ambushT-=dt;
      if(st.t<0) st.t=0;
      if(st.t<=0){
        st.t=0; st.mode=null; st.ambushT=0;
        st.strain=(c.ability.strain&&c.ability.strain.duration)?c.ability.strain.duration:0;
        st.cd=c.ability.cooldown;
        if(typeof playerTeam!=='undefined' && f===playerTeam && c.ability.strain){
          killFeedMsg('Strain', c.ability.strain.desc||'The effort catches up — short-term penalty', '#e0a020');
        }
      }
    } else if(st.strain>0){
      /* strain only counts down once the burst is over */
      st.strain=Math.max(0, st.strain-dt);
    }
    if(st.cd>0) st.cd=Math.max(0, st.cd-dt);
  });
  if(typeof updateAbilityBar!=='undefined') updateAbilityBar(false);
}

/* ---------- cheap situation intel for AI-controlled kingdoms ---------- */
function cheapFactionIntel(f){
  if(typeof zones==='undefined'||!zones.length) return null;
  var oc=ownedCounts();
  var T=(typeof TOWNS!=='undefined'&&TOWNS[f])?TOWNS[f]:{x:0,z:0};
  var army=0, foeNear=0, foeInOwn=0, byFoe={}, i, e;
  for(i=0;i<entities.length;i++){
    e=entities[i];
    if(e.dead||e.passive||e.civ) continue;
    if(e.team===f){ army++; continue; }
    var dx=e.group.position.x-T.x, dz=e.group.position.z-T.z;
    if(dx*dx+dz*dz<260*260) foeNear++;
    var zi=zoneIdxAt(e.group.position.x, e.group.position.z);
    if(zi>=0 && zi<zones.length && zones[zi].owner===f) foeInOwn++;
    byFoe[e.team]=(byFoe[e.team]||0)+1;
  }
  var foeMax=0;
  for(var k in byFoe) if(byFoe[k]>foeMax) foeMax=byFoe[k];
  var treasury=(typeof EC!=='undefined'&&EC[f])?EC[f].gold:0;
  var income=(typeof incomeRate!=='function')?0:incomeRate(f);
  var upkeep=(typeof armyUpkeepCost!=='function')?0:armyUpkeepCost(f);
  var zi2=zoneIdxAt(T.x,T.z);
  var t=(typeof zoneTerrain!=='function')?'plains':zoneTerrain(zi2);
  var tb=(typeof terrainDefenseBonus!=='function')?0:terrainDefenseBonus(t);
  var tbd=(typeof factionTerrainDefense!=='function')?0:factionTerrainDefense(f,t);
  return {
    threat: foeNear>=8?'HIGH':(foeNear>=3?'Medium':'Low'),
    army:army, foeMax:foeMax, foeNear:foeNear, foeInOwn:foeInOwn,
    treasury:treasury, income:income, upkeep:upkeep,
    territory:oc[f]||0,
    momentum:momentumOf(f),
    terrainFavor: (tb+tbd)>=15,
    raidTarget:(foeMax<army && foeMax>0 && threat!=='HIGH')
  };
}
var aiAbilityTickT=4;
function aiAbilityTick(dt){
  aiAbilityTickT-=dt;
  if(aiAbilityTickT>0) return;
  aiAbilityTickT=4;
  if(typeof zones==='undefined'||!zones.length) return;
  FAC_KEYS.forEach(function(f){
    if(typeof playerTeam!=='undefined' && f===playerTeam) return;  /* the player's brain handles the crown */
    var st=FAC_ABIL[f];
    if(!st||st.cd>0||st.t>0) return;
    if(factionLevel(f)<5) return;
    var I=cheapFactionIntel(f);
    if(!I) return;
    var d=factionAIDecision(f, I);
    if(d && d.ability===abilityData(f).id){
      tryActivateAbility(f, d.mode||null);
    }
  });
}

/* ---------- the AI Brain's use of its faction's signature (spec §21/22) ---------- */
function factionAIDecision(f, I){
  var c=factionCfg(f);
  if(!c||!I) return null;
  var base={decision:'HOLD', deploy:{bg:5,def:40,atk:55}, order:null, ability:null, mode:null};
  var ab=c.ability.id, threat=I.threat||'Low', army=I.army||0, foeMax=I.foeMax||0;
  if(f==='rome'){
    /* Economy → Logistics → Defense → Expansion */
    if(threat==='HIGH'){
      base.decision='DEFEND THE LEGIONS'; base.deploy={bg:10,def:65,atk:25}; base.order='defend';
      if(army<26 && (I.treasury||0)>160) base.ability=ab;          /* need an army NOW */
    } else if(foeMax>0 && army>foeMax*1.3 && (I.treasury||0)>120){
      base.decision='ADVANCE (sustainable)'; base.deploy={bg:5,def:35,atk:60}; base.order='attack';
    } else if((I.territory||0)>=40 && (I.treasury||0)<(I.income||0)*25){
      base.decision='CONSOLIDATE (administration)';
    } else base.decision='ORGANIZE THE CAMPAIGN';
  } else if(f==='sparta'){
    /* Army Quality → Defense → Strategic Battles → Expansion */
    if(threat==='HIGH' && foeMax>army*1.5){
      base.decision='LAST STAND'; base.deploy={bg:10,def:70,atk:20}; base.order='defend'; base.ability=ab;
    } else if((I.terrainFavor||false) && army>foeMax*1.2 && foeMax>0){
      base.decision='DECISIVE BATTLE (favorable ground)'; base.deploy={bg:5,def:25,atk:70}; base.order='attack';
    } else if((I.treasury||0)<(I.income||0)*20){
      base.decision='CONSERVE (no attrition)';
    } else base.decision='HOLD THE LINE';
  } else if(f==='moldavia'){
    /* Threat Detection → Mobility → Defense → Counterattack */
    if((I.foeInOwn||0)>0){
      base.decision='FRONTIER DEFENSE'; base.deploy={bg:8,def:60,atk:32}; base.order='defend';
      if(I.foeInOwn>=6) base.ability=ab;
    } else if(threat==='Low' && army>12){
      base.decision='COUNTERATTACK (reposition)'; base.deploy={bg:5,def:25,atk:70}; base.order='attack';
    } else base.decision='WATCH THE BORDERS';
  } else if(f==='vikings'){
    /* Weak Targets → Raid → Momentum → Expansion */
    if((I.raidTarget||false)){
      base.decision='RAID '+((I.targetName||'weak ground')); base.deploy={bg:3,def:15,atk:82}; base.order='attack';
      if((I.momentum||0)>=2) base.ability=ab;
    } else if((I.momentum||0)===0 && threat==='HIGH'){
      base.decision='RETREAT TO SEA (raid impossible)'; base.deploy={bg:8,def:55,atk:37}; base.order='defend';
    } else { base.decision='HUNT WEAK GROUND'; base.order='attack'; }
  } else if(f==='egypt'){
    /* Economy → Infrastructure → Population → Military Expansion */
    base.ability=ab;   /* the Pharaoh calls the flood whenever it can */
    if((I.income||0)<=(I.upkeep||0)){
      base.decision='PROTECT THE HARVEST'; base.deploy={bg:8,def:55,atk:37}; base.order='defend';
    } else if((I.treasury||0)>260){
      base.decision='GROW THE EMPIRE'; base.deploy={bg:5,def:40,atk:55}; base.order='attack';
    } else base.decision='BUILD & TAX';
  } else if(f==='nippon'){
    /* Intelligence → Positioning → Specialists → Precision Attacks */
    if(threat==='HIGH'){
      base.decision='AMBUSCH THE ASSAULT'; base.deploy={bg:8,def:55,atk:37}; base.order='defend'; base.ability=ab; base.mode='ambush';
    } else if(foeMax>0 && army>foeMax*1.1){
      base.decision='PRECISION STRIKE (weak flank)'; base.deploy={bg:5,def:30,atk:65}; base.order='attack'; base.ability=ab; base.mode='precision';
    } else if(army>=12 && (I.income||0)>0){
      base.decision='ADVANCE (positioned)'; base.deploy={bg:5,def:30,atk:65}; base.order='attack'; base.ability=ab; base.mode='mobility';
    } else { base.decision='REPOSITION'; base.ability=ab; base.mode='mobility'; }
  }
  return base;
}

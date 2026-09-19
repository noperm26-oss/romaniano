/* ============================================================
   faction-identity.js — AGE OF WARFARE: complete faction
   benefits & identity system (design spec, 26 sections).

   This is the single data-driven table behind all faction
   gameplay: passives, signature abilities, doctrines, terrain
   affinity, territory priorities, morale traits and the AI
   Brain's personality. Systems elsewhere (economy, capture,
   combat, unit AI, AFK brain, UI) consult FACTION_IDENTITY
   instead of hard-coding per-faction behavior, so a future
   faction is added by writing one entry here (spec §24).
   ============================================================ */

var FACTION_IDENTITY={

/* ---------------- 1. ROME — THE IMPERIAL LEGION ---------------- */
rome:{
  id:'rome', name:'ROME', title:'The Imperial Legion',
  color:'#a8321f',
  playstyle:'Organization · Defense · Logistics',
  designedFor:'players who prefer organized armies, strong infrastructure, stable economics and long campaigns.',
  militaryIdentity:'Sustained warfare — large, well-fed armies that hold ground and grind wars down.',
  economicIdentity:'Sustain large armies: administration and logistics make size affordable.',
  strategicIdentity:'Expand slowly, hold everything, win the long war.',
  aiIdentity:'Imperial — wins wars slowly and safely; never gambles the treasury.',
  stats:{military:8, economy:7, mobility:5, defense:9},
  specialization:'Large armies and sustained warfare',
  strengths:['Logistics & army upkeep','Legionary formation discipline','Defensive infrastructure','Empire administration','Recovery from losses'],
  weaknesses:['Slower tactical movement','Expensive elite units','Low burst damage','Weak when formations fragment'],
  passives:[
    {level:1, id:'legionary-discipline', name:'Legionary Discipline', desc:'Roman infantry fight better beside their comrades: bonus damage and up to −10% damage taken while in formation. FORMATION = POWER.'},
    {level:2, id:'military-logistics', name:'Military Logistics', desc:'Roman armies are cheaper to keep fed and marching: −8% upkeep and faster long-distance movement.'},
    {level:3, id:'roman-engineering', name:'Roman Engineering', desc:'Roman-held zones resist capture far longer (fortification bonus); defenders near their own strongpoints gain organization.'},
    {level:4, id:'imperial-administration', name:'Imperial Administration', desc:'Distant provinces still pay: the large-empire supply penalty is reduced by two thirds.'},
    {level:5, id:'imperial-mobilization', name:'Imperial Mobilization', desc:'Signature: emergency taxation. Musters 20% cheaper and earns +15% for 45s — then the treasury strains for a while.'}
  ],
  terrain:{plains:{def:4}, city:{def:8}, mountains:{move:-8}},
  territoryWeights:{value:2.2, roads:1.5, strategic:1.8, weak:0.4, distance:0.6},
  morale:{penaltyResist:0.30, kingAura:1.10, winBoost:0.5, supplySensitive:false, note:'Stable morale — the legion holds its line.'},
  brain:{name:'Imperial', reserve:0.22, defBias:0.55, atkThreshold:1.35, econFocus:0.45, wantFactor:4, cap:1, adaptive:1,
    priorities:'Economy → Logistics → Defense → Expansion',
    desc:'Checks logistics before every war. Advances only when the army is sustainable; defends everything else. Prefers winning slowly and safely.'},
  doctrines:[
    {id:'imperial', name:'Imperial', bg:5, def:35, desc:'Expansion & administration: +4% income.', mod:{income:1.04}},
    {id:'legion', name:'Legion', bg:10, def:40, desc:'Military organization: formation bonus +25%.', mod:{formation:1.25}},
    {id:'fortress', name:'Fortress', bg:10, def:60, desc:'Defensive warfare: fortifications +20% harder to take.', mod:{fort:1.2}}
  ],
  ability:{id:'imperial-mobilization', name:'Imperial Mobilization', key:'F', duration:45, cooldown:180,
    desc:'Emergency taxation: −20% recruit cost, +15% income, +6% movement (45s). Afterwards: +25% upkeep, −10% income (45s).',
    fx:{recruitCost:0.8, income:1.15, speed:1.06},
    strain:{duration:45, upkeep:1.25, income:0.9, desc:'Emergency taxation rebounds: +25% upkeep, −10% income (45s)'}},
  upkeepMod:0.92, incomeMod:1.0, recruitCostMod:1.0, recruitStrengthMod:1.0
},

/* ---------------- 2. SPARTA — THE WARRIOR KINGDOM ---------------- */
sparta:{
  id:'sparta', name:'SPARTA', title:'The Warrior Kingdom',
  color:'#d35454',
  playstyle:'Elite Infantry · Defense · Quality',
  designedFor:'players who prefer elite infantry, defensive warfare and high-value battles.',
  militaryIdentity:'Quality over quantity — fewer soldiers, better soldiers, one shield wall.',
  economicIdentity:'Fund elite forces: every drachma buys a full hoplite, not a levy.',
  strategicIdentity:'Hold the passes, choose the battles, never fight where the ground is bad.',
  aiIdentity:'Lion — protects elite armies, fights from terrain, avoids attrition at all costs.',
  stats:{military:9, economy:4, mobility:4, defense:10},
  specialization:'Elite infantry and defensive battles',
  strengths:['Elite melee soldiers','Phalanx front armor','Last-stand resolve','Morale that never breaks'],
  weaknesses:['Expensive military','Slow economic growth','Low replacement speed','Punished by encirclement & attrition'],
  passives:[
    {level:1, id:'warrior-culture', name:'Warrior Culture', desc:'Spartan elite infantry deal +10% melee damage and resist fear far better.'},
    {level:2, id:'phalanx', name:'Phalanx', desc:'In a dense formation the front takes 35% less damage — but flanks and the rear are exposed (+15%).'},
    {level:3, id:'elite-training', name:'Elite Training', desc:'Recruits cost +18% but arrive +12% stronger. Fewer soldiers. Better soldiers.'},
    {level:4, id:'last-stand', name:'Last Stand', desc:'Defending an important Spartan zone while outnumbered 3:1: +12% damage, −18% damage taken, no rout.'},
    {level:5, id:'300s-resolve', name:"300's Resolve", desc:'Signature: morale locked high, retreat disabled, infantry defense +15% for 25s. After: fatigue (−15% speed, +15% recruit cost, 30s).'}
  ],
  terrain:{mountains:{def:12, move:-6}, hills:{def:8}, river:{def:-4}},
  territoryWeights:{choke:1.8, def:1.5, value:1.2, weak:0.2, distance:0.2},
  morale:{penaltyResist:0.55, kingAura:1.0, winBoost:0.4, supplySensitive:false, note:'Extremely resistant to morale collapse.'},
  brain:{name:'Lion', reserve:0.20, defBias:0.72, atkThreshold:1.5, econFocus:0.35, wantFactor:2.5, cap:0.8, adaptive:1,
    priorities:'Army Quality → Defense → Strategic Battles → Expansion',
    desc:'Cares about UNIT QUALITY, not unit quantity. Defends chokepoints aggressively, attacks only from terrain advantage, and never bleeds its elites.'},
  doctrines:[
    {id:'phalanx', name:'Phalanx', bg:8, def:50, desc:'Maximum infantry defense: phalanx front armor −45%.', mod:{phalanx:1.45}},
    {id:'warrior', name:'Warrior', bg:5, def:30, desc:'Maximum elite combat: elite units +10% damage.', mod:{elite:1.10}},
    {id:'laststand', name:'Last Stand', bg:12, def:65, desc:'Maximum defense under pressure: last stand triggers earlier.', mod:{laststand:0.7}}
  ],
  ability:{id:'300s-resolve', name:"300's Resolve", key:'F', duration:25, cooldown:150,
    desc:'Morale locked high, retreat disabled, infantry damage taken −15% (25s). After: fatigue −15% speed, +15% recruit cost (30s).',
    fx:{meleeDef:0.85, moraleLock:true},
    strain:{duration:30, speed:0.85, recruitCost:1.15, desc:'Fatigue: −15% speed, +15% recruit cost (30s)'}},
  upkeepMod:1.0, incomeMod:1.0, recruitCostMod:1.18, recruitStrengthMod:1.12
},

/* ---------------- 3. MOLDOVA — THE FRONTIER KINGDOM ---------------- */
moldavia:{
  id:'moldavia', name:'MOLDOVA', title:'The Frontier Kingdom',
  color:'#3f8a5e',
  playstyle:'Adaptability · Mobility · Homeland Defense',
  designedFor:'players who prefer adaptability, mobility and reacting to enemy attacks.',
  militaryIdentity:'The responsive army — fast repositioning, strong on home ground, always in counterattack position.',
  economicIdentity:'Maintain flexibility: a balanced treasury that can mobilize at a moment’s notice.',
  strategicIdentity:'Let them come. Meet every border crisis, then strike the weakened enemy.',
  aiIdentity:'Frontier — constantly reads the threat map and repositions; defends the homeland, then counterattacks.',
  stats:{military:5, economy:7, mobility:8, defense:6},
  specialization:'Homeland defense and rapid response',
  strengths:['Homeland defense bonus','Fast strategic movement','Threat detection & reaction','Doctrines that switch fast'],
  weaknesses:['No extreme specialization','Weaker than Sparta in a static wall','Weaker economy than Kemet','Weaker momentum than Norrøn'],
  passives:[
    {level:1, id:'mobile-army', name:'Mobile Army', desc:'Moldovan armies move 6% faster and respond to orders more quickly on the strategic map.'},
    {level:2, id:'frontier-warfare', name:'Frontier Warfare', desc:'Fighting on Moldovan ground: +8% damage for its army — enemies invading deep pay for it. The deeper they dig in, the more dangerous Moldova becomes.'},
    {level:3, id:'local-knowledge', name:'Local Knowledge', desc:'Defenders hear raiders coming earlier: faster backup response, improved ambush detection.'},
    {level:4, id:'adaptive-command', name:'Adaptive Command', desc:'Doctrine changes take effect 50% faster; the AI switches offensive/defensive instantly when the situation flips.'},
    {level:5, id:'rapid-mobilization', name:'Rapid Mobilization', desc:'Signature: the army moves +30% faster and reinforcements surge (30s). After: +15% upkeep (30s).'}
  ],
  terrain:{plains:{move:6}, forest:{move:4}, hills:{def:5}, river:{def:5}},
  territoryWeights:{border:1.6, home:1.3, roads:1.2, value:0.8, weak:0.6},
  morale:{penaltyResist:0.20, kingAura:1.15, winBoost:0.6, supplySensitive:false, note:'Strong morale while defending the homeland.'},
  brain:{name:'Frontier', reserve:0.18, defBias:0.50, atkThreshold:1.15, econFocus:0.5, wantFactor:3.5, cap:1, adaptive:0.6,
    priorities:'Threat Detection → Mobility → Defense → Counterattack',
    desc:'Never leaves armies stationary. Evaluates threat, distance and territory value every few seconds; defends the border, then counterattacks the weakened invader.'},
  doctrines:[
    {id:'frontier', name:'Frontier', bg:8, def:55, desc:'Maximum homeland defense: frontier bonus +25%.', mod:{frontier:1.25}},
    {id:'mobile', name:'Mobile', bg:5, def:25, desc:'Maximum strategic movement: +8% army speed.', mod:{speed:1.08}},
    {id:'adaptive', name:'Adaptive', bg:5, def:40, desc:'Maximum flexibility: faster doctrine switching, +5% speed.', mod:{adaptive:1.05}}
  ],
  ability:{id:'rapid-mobilization', name:'Rapid Mobilization', key:'F', duration:30, cooldown:150,
    desc:'The whole army moves +30% faster, reinforcements surge (30s). After: +15% upkeep (30s).',
    fx:{speed:1.3},
    strain:{duration:30, upkeep:1.15, desc:'Strain: +15% upkeep (30s)'}},
  upkeepMod:1.0, incomeMod:1.0, recruitCostMod:1.0, recruitStrengthMod:1.0
},

/* ---------------- 4. NORRØN — THE RAIDING HOST ---------------- */
vikings:{
  id:'vikings', name:'NORRØN', title:'The Raiding Host',
  color:'#4a6a8a',
  playstyle:'Aggression · Raiding · Momentum',
  designedFor:'players who prefer aggressive warfare, raids and constant offensive pressure.',
  militaryIdentity:'The storm that never stops — victories feed victories; momentum is the weapon.',
  economicIdentity:'Turn victories into resources: loot, tribute and war-booty pay for the next raid.',
  strategicIdentity:'Hit what is weak, take what is rich, never sit still, always pressure.',
  aiIdentity:'Raider — hunts weak ground and exposed armies; retreats a raid only when it becomes impossible.',
  stats:{military:8, economy:5, mobility:10, defense:4},
  specialization:'Raiding and sustained offensive pressure',
  strengths:['Battle Momentum after victories','Raider loot on capture','Water & open-terrain speed','Fear of the North (enemy morale)'],
  weaknesses:['Weak long-term fortification','Unstable economy','Collapses when momentum dies','Overextends past the supply line'],
  passives:[
    {level:1, id:'raider-culture', name:'Raider Culture', desc:'Capturing enemy territory yields war-booty (+150% loot), a short rally and a burst of movement.'},
    {level:2, id:'battle-momentum', name:'Battle Momentum', desc:'Consecutive victories stack MOMENTUM (+1…+4): +3% damage and +2% speed per point. Momentum decays after 90s of peace or on defeat.'},
    {level:3, id:'fear-of-the-north', name:'Fear of the North', desc:'Enemies who lose territory to Norrøn waver: −12% damage for 14s. Rapid offensives become psychologically dangerous.'},
    {level:4, id:'norron-mobility', name:'Norrøn Mobility', desc:'Coastal routes, rivers and open terrain: +25% movement on water routes, +12% on open ground.'},
    {level:5, id:'great-raid', name:'Great Raid', desc:'Signature: a high-risk raid — +40% speed, +20% damage, +50% capture rewards (45s). If outnumbered 2:1 the raiding army is 20% more vulnerable and cannot break off cleanly.'}
  ],
  terrain:{river:{move:25, def:5}, plains:{move:12}, city:{income:8}},
  territoryWeights:{weak:2.0, income:1.6, coast:1.3, isolated:1.2, value:0.5, distance:0.1},
  morale:{penaltyResist:0.15, kingAura:0.95, winBoost:1.0, supplySensitive:false, note:'Strong morale after victories — and none without them.'},
  brain:{name:'Raider', reserve:0.10, defBias:0.30, atkThreshold:0.8, econFocus:0.25, wantFactor:3.5, cap:1.05, adaptive:1,
    priorities:'Weak Targets → Raid → Momentum → Expansion',
    desc:'Constantly asks “where can I hurt the enemy next?” Attacks exposed armies and rich, poorly defended ground; retreats only when a raid is strategically impossible.'},
  doctrines:[
    {id:'raider', name:'Raider', bg:3, def:20, desc:'Maximum territory raiding: raid loot +25%.', mod:{raid:1.25}},
    {id:'berserker', name:'Berserker', bg:5, def:25, desc:'Maximum offensive combat: +12% damage, −8% defense.', mod:{berserk:1.12, berserkDef:1.08}},
    {id:'conqueror', name:'Conqueror', bg:8, def:40, desc:'Maximum sustained expansion: −8% upkeep, +10% capture rewards.', mod:{conquer:1.10, upkeep:0.92}}
  ],
  ability:{id:'great-raid', name:'Great Raid', key:'F', duration:45, cooldown:200,
    desc:'The host goes over the ridge: +40% speed, +20% damage, +50% capture rewards, +25% raid loot (45s). Outnumbered 2:1: +20% damage taken and harder to break off.',
    fx:{speed:1.4, dmg:1.2, loot:1.5, aggro:1.4, risk:1.2}},
  upkeepMod:0.96, incomeMod:1.0, recruitCostMod:1.0, recruitStrengthMod:1.0
},

/* ---------------- 5. KEMET — KINGDOM OF THE NILE ---------------- */
egypt:{
  id:'egypt', name:'KEMET', title:'Kingdom of the Nile',
  color:'#c9a227',
  playstyle:'Economy · Population · Infrastructure',
  designedFor:'players who prefer economic development, manpower and infrastructure.',
  militaryIdentity:'The deep state at war — wealth converts to manpower, manpower converts to victory.',
  economicIdentity:'Build economic dominance: income, population and infrastructure compound over the campaign.',
  strategicIdentity:'Grow the granary, defend the harvest, and outlast every rival in a long war of replacement.',
  aiIdentity:'Pharaoh — weighs every war in gold; avoids any fight whose economic payoff is poor.',
  stats:{military:5, economy:10, mobility:5, defense:6},
  specialization:'Income, population and infrastructure',
  strengths:['Highest income & building value','Granary: faster replacement & recovery','Desert adaptation','Recover from any defeat with time'],
  weaknesses:['Weaker heavy infantry','Economically valuable territories are prime targets','Economic centers lost have real consequences','Slow to react without planning'],
  passives:[
    {level:1, id:'nile-economy', name:'Nile Economy', desc:'Rich territories (towns, river lands, sites) pay +12% more income.'},
    {level:2, id:'royal-infrastructure', name:'Royal Infrastructure', desc:'Buildings work harder: +30% building bonuses, and Kemet capitals are harder to take.'},
    {level:3, id:'granary', name:'Granary of the Kingdom', desc:'A larger population pool: armies recover out of combat and the AI replaces losses faster.'},
    {level:4, id:'desert-adaptation', name:'Desert Adaptation', desc:'Harsh lands stop punishing Kemet: +25% movement and +8 defense in the desert.'},
    {level:5, id:'flood-of-the-nile', name:'Flood of the Nile', desc:'Signature: the river gives. +50% income, army recovery and −10% recruit cost for 60s. No direct combat power — Kemet wins through the treasury. (240s cooldown)'}
  ],
  terrain:{desert:{move:25, def:8}, plains:{income:5}, city:{income:10}},
  territoryWeights:{income:2.0, village:1.4, pop:1.3, value:0.8, weak:0.3, distance:0.3},
  morale:{penaltyResist:0.10, kingAura:1.0, winBoost:0.3, supplySensitive:true, note:'Stable morale only while supplied and economically secure.'},
  brain:{name:'Pharaoh', reserve:0.30, defBias:0.45, atkThreshold:1.4, econFocus:0.9, wantFactor:4.5, cap:1.25, adaptive:1,
    priorities:'Economy → Infrastructure → Population → Military Expansion',
    desc:'Evaluates the economic value of every target. Expands only when a territory is worth its military cost; otherwise builds, taxes and outlasts.'},
  doctrines:[
    {id:'economic', name:'Economic', bg:5, def:35, desc:'Maximum income: +8% territory income.', mod:{income:1.08}},
    {id:'military', name:'Military', bg:8, def:45, desc:'Convert economy into military power: core infantry +8%, −4% income.', mod:{infantry:1.08, income:0.96}},
    {id:'population', name:'Population', bg:5, def:30, desc:'Maximum manpower: −12% recruit cost, faster recovery.', mod:{recruit:0.88, regen:1.3}}
  ],
  ability:{id:'flood-of-the-nile', name:'Flood of the Nile', key:'F', duration:60, cooldown:240,
    desc:'The river gives: +50% income, +2 army recovery, −10% recruit cost (60s). Pure economy — no combat bonus.',
    fx:{income:1.5, regen:2, recruitCost:0.9}},
  upkeepMod:1.0, incomeMod:1.0, recruitCostMod:1.0, recruitStrengthMod:1.0
},

/* ---------------- 6. NIPPON — THE WARRING CLANS ---------------- */
nippon:{
  id:'nippon', name:'NIPPON', title:'The Warring Clans',
  color:'#8a5a9a',
  playstyle:'Precision · Specialists · Tactical Command',
  designedFor:'players who prefer precision, specialists and tactical command.',
  militaryIdentity:'Fewer but more effective — disciplined specialists who win skirmishes, not melees.',
  economicIdentity:'Fund specialist forces: every soldier is a trained professional worth protecting.',
  strategicIdentity:'See the battle before it happens: position, spot the weak flank, and strike precisely.',
  aiIdentity:'Shogun — analyzes enemy formations, avoids frontal assaults, repositions constantly, punishes the weak flank.',
  stats:{military:7, economy:5, mobility:8, defense:6},
  specialization:'Specialists, precision and tactical advantage',
  strengths:['Precision strikes & crits','Clan discipline under command','Fast tactical transitions','Terrain of forests and hills'],
  weaknesses:['Smaller, costlier armies','Painfully punished for losing specialists','Less forgiving of strategic errors','No raw economic or defensive edge'],
  passives:[
    {level:1, id:'clan-discipline', name:'Clan Discipline', desc:'Clan units answer the standard faster: wider, stronger king aura and quicker response to orders.'},
    {level:2, id:'precision-training', name:'Precision Training', desc:'Specialists are more accurate: arrows fly truer, and strikes land critical hits (+80% damage).'},
    {level:3, id:'rapid-deployment', name:'Rapid Deployment', desc:'The army changes state faster: formations reform 35% quicker, defenders swing to counterattack without lag.'},
    {level:4, id:'specialist-warfare', name:'Specialist Warfare', desc:'Scouts and specialists: +25% threat detection range, ranged specialists +8% effectiveness.'},
    {level:5, id:'clan-tactics', name:'Clan Tactics', desc:'Signature: choose a temporary tactic — PRECISION, DEFLECTION, AMBUSH or MOBILITY — each with its own tradeoff (30s, 45s cooldown).'}
  ],
  terrain:{forest:{def:10, move:4}, hills:{def:8, move:6}, plains:{def:-4}},
  territoryWeights:{tactical:1.6, highground:1.4, choke:1.3, value:0.7, weak:0.5, distance:0.2},
  morale:{penaltyResist:0.25, kingAura:1.30, winBoost:0.5, supplySensitive:false, note:'Strong morale while under effective command.'},
  brain:{name:'Shogun', reserve:0.20, defBias:0.48, atkThreshold:1.2, econFocus:0.4, wantFactor:3, cap:0.9, adaptive:1,
    priorities:'Intelligence → Positioning → Specialists → Precision Attacks',
    desc:'Never fights a fair fight it does not want. Prefers favorable engagements, exploits weak flanks and specialists, and repositions more than any other brain.'},
  doctrines:[
    {id:'precision', name:'Precision', bg:5, def:35, desc:'Maximum specialist effectiveness: +15% crit chance & accuracy.', mod:{precision:1.15}},
    {id:'mobility', name:'Mobility', bg:5, def:30, desc:'Maximum tactical movement: +10% speed.', mod:{speed:1.10}},
    {id:'command', name:'Command', bg:12, def:45, desc:'Maximum order & formation: +30% king aura, +10% damage under the standard.', mod:{command:1.30, order:1.10}}
  ],
  ability:{id:'clan-tactics', name:'Clan Tactics', key:'F', duration:30, cooldown:45, needsMode:true,
    modes:['precision','deflection','ambush','mobility'],
    desc:'Set a temporary clan tactic (30s): PRECISION (dmg +18%, crits up, speed −10%) · DEFLECTION (damage taken −18%, dealt −8%) · AMBUSH (first 8s: +35% damage, then −5%) · MOBILITY (speed +30%, defense −10%).',
    modeFx:{
      precision:{dmg:1.18, crit:1.5, speed:0.9},
      deflection:{incoming:0.82, dmg:0.92},
      ambush:{firstStrike:1.35, ambushT:8, then:0.95},
      mobility:{speed:1.3, incoming:1.1}
    }},
  upkeepMod:1.0, incomeMod:1.0, recruitCostMod:1.0, recruitStrengthMod:1.0
}
};

/* ================= shared faction state ================= */
var FAC_LEVELS={}, FAC_DOCTRINE={};   /* ability & momentum state live in faction-abilities.js / faction-battle.js */

function factionCfg(f){ return FACTION_IDENTITY[f]||null; }
function factionKnown(f){ return !!FACTION_IDENTITY[f]; }

/* ---------- progression (spec §16): 5 kingdom levels by territory ---------- */
function factionZoneThresholds(){ return [0,4,12,24,40]; }
function factionLevel(f){
  var oc=(typeof ownedCounts==='function')?ownedCounts():null;
  var n=oc?(oc[f]||0):0;
  var th=factionZoneThresholds();
  for(var i=th.length-1;i>=0;i--){ if(n>=th[i]) return i+1; }
  return 1;
}
function factionHasPassive(f, id){
  var c=factionCfg(f); if(!c) return false;
  var lv=factionLevel(f);
  for(var i=0;i<c.passives.length;i++) if(c.passives[i].id===id && c.passives[i].level<=lv) return true;
  return false;
}
function factionProgressionCheck(){
  if(typeof playerTeam==='undefined'||!playerTeam) return;
  FAC_KEYS.forEach(function(f){
    var lv=factionLevel(f);
    if((FAC_LEVELS[f]||1)<lv){
      FAC_LEVELS[f]=lv;
      var c=FACTION_IDENTITY[f];
      var p=null;
      for(var i=0;i<c.passives.length;i++) if(c.passives[i].level===lv) p=c.passives[i];
      if(p && f===playerTeam){
        showBanner('KINGDOM LEVEL '+lv, c.name+' — '+c.title+' unlocks '+p.name, 3.5);
        killFeedMsg('Progression', p.name+' unlocked — see the codex for the full ability', '#e9c458');
      }
    }
  });
}
function resetFactionSystems(){
  FAC_LEVELS={}; FAC_DOCTRINE={};
  if(typeof FAC_ABIL!=='undefined') FAC_ABIL={};
  if(typeof FAC_MOMENTUM!=='undefined') FAC_MOMENTUM={};
  FAC_KEYS.forEach(function(f){
    FAC_LEVELS[f]=1;
    var c=FACTION_IDENTITY[f];
    FAC_DOCTRINE[f]=c?c.doctrines[0].id:null;
    if(typeof FAC_ABIL!=='undefined') FAC_ABIL[f]={t:0, cd:0, strain:0, mode:null, ambushT:0, decayAt:0};
    if(typeof FAC_MOMENTUM!=='undefined') FAC_MOMENTUM[f]={value:0, streak:0, lastWin:0};
  });
}

/* ---------- terrain interaction (spec §14) ---------- */
function factionTerrainMoveCost(f, t){
  var c=factionCfg(f); if(!c) return 1;
  var mod=c.terrain[t];
  return (mod&&mod.move)?(1+mod.move/100):1;
}
function factionTerrainDefense(f, t){
  var c=factionCfg(f); if(!c) return 0;
  var mod=c.terrain[t];
  return (mod&&mod.def)?mod.def:0;
}
function factionTerrainIncome(f, t){
  var c=factionCfg(f); if(!c) return 1;
  var mod=c.terrain[t];
  return (mod&&mod.income)?(1+mod.income/100):1;
}

/* ---------- territory priorities (spec §10) ---------- */
function factionTargetScore(f, zi){
  var c=factionCfg(f); if(!c) return 0;
  if(typeof zones==='undefined'||!zones[zi]) return 0;
  var z=zones[zi], w=c.territoryWeights||{};
  var t=(typeof zoneTerrain==='function')?zoneTerrain(zi):'plains';
  var inc=(typeof zoneIncomeBase==='function')?zoneIncomeBase(zi):2.2;
  var pop=(typeof zonePopulation==='function')?zonePopulation(zi):6000;
  var score=0;
  var value=(z.core?3:z.bonus?2:0)+Math.max(0,inc-2.2)*0.5;
  score+=value*(w.value||0.5);
  if(w.roads) score+=((t==='city')?1.5:(t==='plains')?1.1:0)*w.roads;
  if(w.choke) score+=((t==='mountains')?1.8:(t==='hills')?1.4:(t==='river')?1.2:0)*w.choke;
  if(w.coast) score+=((t==='river')?1.5:(t==='city')?1.2:0)*w.coast;
  if(w.tactical) score+=((t==='hills')?1.6:(t==='forest')?1.4:0)*w.tactical;
  if(w.highground) score+=((t==='mountains')?1.5:(t==='hills')?1.2:0)*w.highground;
  if(w.village) score+=(z.bonus?1.6:0)*w.village;
  if(w.pop) score+=(pop>9000?1.3:0.4)*w.pop;
  if(w.income) score+=Math.max(0,inc-2.2)*w.income;
  if(w.strategic){
    var sv=(typeof zoneStrategicValue==='function')?zoneStrategicValue(zi):'Low';
    if(sv==='Capital') score+=2*w.strategic; else if(sv==='High') score+=1.4*w.strategic; else if(sv==='Medium') score+=0.7*w.strategic;
  }
  if(t==='desert') score*=0.75;  /* harsh ground — every host avoids it unless adapted */
  if(w.avoidPlains && t==='plains') score*=0.85;
  var pos=(typeof zoneCenter==='function')?zoneCenter(zi):{x:0,z:0,gx:0,gz:0};
  var home=(typeof TOWNS!=='undefined'&&TOWNS[f])?TOWNS[f]:{x:0,z:0};
  var dist=Math.hypot(pos.x-home.x, pos.z-home.z);
  if(w.home) score+=Math.max(0,1-dist/2400)*w.home;
  if(w.distance) score+=Math.max(0,1.2-dist/3000)*w.distance;
  if(w.border){
    var border=false;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
      var zx=pos.gx+d[0], zz=pos.gz+d[1];
      if(zx<0||zz<0||zx>=ZN||zz>=ZN) return;
      var id2=zz*ZN+zx;
      if(zones[id2]&&zones[id2].owner===f) border=true;
    });
    if(border) score+=w.border;
  }
  if(w.weak && typeof entities!=='undefined'){
    var defN=0, atkN=0;
    for(var i=0;i<entities.length;i++){
      var e=entities[i];
      if(e.dead||e.passive) continue;
      if(zoneIdxAt(e.group.position.x, e.group.position.z)===zi){
        if(e.team===z.owner) defN++; else atkN++;
      }
    }
    var weak=(z.owner?(defN===0?1.7:(defN<4?1.4:0.4+Math.max(0,4-defN)*0.3)):1.0);
    if(atkN>defN*2) weak*=0.6;
    score+=weak*w.weak;
  }
  if(w.isolated && z.owner){
    var adj=false;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
      var zx=pos.gx+d[0], zz=pos.gz+d[1];
      if(zx<0||zz<0||zx>=ZN||zz>=ZN) return;
      if(zones[zz*ZN+zx]&&zones[zz*ZN+zx].owner===z.owner) adj=true;
    });
    if(!adj) score+=w.isolated;
  }
  return score;
}

/* ---------- doctrines (spec §12) ---------- */
function factionDoctrineData(f){
  var c=factionCfg(f); if(!c) return null;
  var id=(typeof FAC_DOCTRINE!=='undefined')?FAC_DOCTRINE[f]:null;
  for(var i=0;i<c.doctrines.length;i++) if(c.doctrines[i].id===id) return c.doctrines[i];
  return c.doctrines[0];
}
function setFactionDoctrine(f, id){
  var c=factionCfg(f); if(!c) return false;
  var d=null;
  for(var i=0;i<c.doctrines.length;i++) if(c.doctrines[i].id===id){ d=c.doctrines[i]; break; }
  if(!d) return false;
  FAC_DOCTRINE[f]=d.id;
  if(typeof playerTeam!=='undefined' && f===playerTeam){
    if(typeof applyDoctrineCfg==='function') applyDoctrineCfg(d.bg/100, d.def/100);
    if(typeof updSettingsLabels==='function') updSettingsLabels();
    if(typeof updateAbilityBar==='function') updateAbilityBar(true);
    if(typeof killFeedMsg==='function') killFeedMsg('Doctrine', c.name+' adopts the '+d.name+' doctrine — '+d.desc, '#8ab8e0');
  }
  return true;
}
function doctrineMod(f){
  var d=factionDoctrineData(f);
  return (d&&d.mod)?d.mod:{};
}

/* ---------- economic system (spec §11) ---------- */
function factionWantArmy(f, territoryCount){
  var c=factionCfg(f); if(!c) return 14+(territoryCount||0)*4;
  var b=c.brain||{};
  var base=10+(territoryCount||0)*(b.wantFactor||3.5);
  if(b.name==='Raider') base+=4;
  if(b.name==='Pharaoh' && typeof EC!=='undefined' && EC[f] && EC[f].gold>260) base+=8;
  return Math.max(8, Math.round(base));
}
function factionUpkeepMod(f){
  var m=1, c=factionCfg(f);
  if(!c) return m;
  m*=(c.upkeepMod||1);
  var st=(typeof abilityStrain==='function')?abilityStrain(f):null;
  if(st&&st.upkeep) m*=st.upkeep;
  var d=doctrineMod(f);
  if(d.upkeep) m*=d.upkeep;
  return m;
}
function factionIncomeMod(f){
  var m=1, c=factionCfg(f);
  if(!c) return m;
  var fx=(typeof abilityFx==='function')?abilityFx(f):null;
  if(fx&&fx.income) m*=fx.income;
  var st=(typeof abilityStrain==='function')?abilityStrain(f):null;
  if(st&&st.income) m*=st.income;
  var d=doctrineMod(f);
  if(d.income) m*=d.income;
  return m;
}
function factionRecruitCostMod(f){
  var m=1, c=factionCfg(f);
  if(!c) return m;
  m*=(c.recruitCostMod||1);
  var fx=(typeof abilityFx==='function')?abilityFx(f):null;
  if(fx&&fx.recruitCost) m*=fx.recruitCost;
  var st=(typeof abilityStrain==='function')?abilityStrain(f):null;
  if(st&&st.recruitCost) m*=st.recruitCost;
  var d=doctrineMod(f);
  if(d.recruit) m*=d.recruit;
  return m;
}
function factionRecruitStrengthMod(f, kind){
  var m=1, c=factionCfg(f);
  if(!c) return m;
  m*=(c.recruitStrengthMod||1);
  var d=doctrineMod(f);
  if(f==='sparta'&&d.elite) m*=(/spartiatis|champion/.test(kind||''))?d.elite:1;
  if(f==='egypt'&&d.infantry) m*=(kind==='warru'||kind==='menfyt')?d.infantry:1;
  if(f==='nippon'&&d.order) m*=d.order;
  return m;
}
function factionMoveMod(f){
  var m=1, c=factionCfg(f);
  if(!c) return m;
  var fx=(typeof abilityFx==='function')?abilityFx(f):null;
  if(fx&&fx.speed) m*=fx.speed;
  var st=(typeof abilityStrain==='function')?abilityStrain(f):null;
  if(st&&st.speed) m*=st.speed;
  if(f==='vikings'&&typeof FAC_MOMENTUM!=='undefined'&&FAC_MOMENTUM[f]&&FAC_MOMENTUM[f].value) m*=(1+0.02*Math.min(4,FAC_MOMENTUM[f].value));
  var d=doctrineMod(f);
  if(d.speed) m*=d.speed;
  return m;
}

/* ---------- morale (spec §13) ---------- */
function factionMoraleResist(f){ var c=factionCfg(f); return c?(c.morale.penaltyResist||0):0; }
function factionKingAura(f){ var c=factionCfg(f); return c?(c.morale.kingAura||1):1; }
function applyMoralePenalty(e, t, dmgMult){
  if(!e) return;
  var resist=factionMoraleResist(e.team);
  e.moralePenaltyT=Math.max(e.moralePenaltyT||0, t);
  e.dmgMult=1-(1-dmgMult)*(1-resist);
}

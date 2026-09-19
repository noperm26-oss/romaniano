import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';

/* ------------------------------------------------------------
   factions.test.mjs — regression suite for the complete faction
   benefits & identity system (26-section design spec).
   Loads the three faction system files in a stubbed world and
   verifies: configuration completeness, balance rules,
   progression, momentum, signature abilities, terrain,
   territory priorities, doctrines, AI decisions and battle
   feedback.
   ------------------------------------------------------------ */
const KEYS=['rome','sparta','moldavia','vikings','egypt','nippon'];

function world(overrides={}){
  const c=vm.createContext({
    console, Math, Set, Map, Object, JSON, parseInt, isNaN, isFinite,
    FAC_KEYS:KEYS, ZN:4, ZS:1500,
    playerTeam:null, player:null, gameTime:0,
    EC:{}, entities:[], zones:[], TOWNS:{},
    _oc:Object.fromEntries(KEYS.map(f=>[f,0])),
    Snd:{tone(){},horn(){},click(){},drum(){},coin(){}},
    showBanner(){}, killFeedMsg(){}, showHint(){}, spawnRing(){},
    applyDoctrineCfg:(bg,def)=>{c._doctrineCalls.push({bg,def});return {bg,def};},
    updSettingsLabels(){},
    ownedCounts(){ return c._oc; },
    zoneTerrain:zi=>c._terr[zi]||'plains',
    zoneIncomeBase:zi=>c._inc[zi]!==undefined?c._inc[zi]:2.2,
    zonePopulation:zi=>c._pop[zi]!==undefined?c._pop[zi]:6000,
    zoneStrategicValue:zi=>c._strat[zi]||'Low',
    terrainDefenseBonus:t=>({forest:20,hills:15,mountains:35,river:10,city:25,desert:-5}[t]||0),
    zoneCenter:i=>({x:(i%4)*1500-3000, z:Math.floor(i/4)*1500-3000, gx:i%4, gz:Math.floor(i/4)}),
    zoneIdxAt:(x,z)=>{
      const gx=Math.max(0,Math.min(3,Math.floor((x+3000)/1500)));
      const gz=Math.max(0,Math.min(3,Math.floor((z+3000)/1500)));
      return gz*4+gx;
    },
    incomeRate:()=>c._income||10,
    armyUpkeepCost:()=>c._upkeep||2,
    playerUnits:()=>c._army||[],
    eqNear:(x,z,r,fn)=>{ (c._near[x+','+z]||[]).forEach(e=>fn(e)); },
    angDiff:(a,b)=>{ let d=(b-a)%(2*Math.PI); if(d>Math.PI)d-=2*Math.PI; if(d<-Math.PI)d+=2*Math.PI; return d; },
    hostileF:(a,b)=>a!==b
  });
  c.zones=Array.from({length:16},(_,i)=>({owner:null,inf:{},core:false,bonus:false}));
  c._inc={}; c._pop={}; c._terr={}; c._strat={}; c._near={}; c._doctrineCalls=[];
  Object.assign(c, overrides);
  return c;
}
const load=(c,files)=>{ for(const f of files) vm.runInContext(readFileSync(f,'utf8'), c); };
const RUN=(c,s)=>vm.runInContext(s,c);

/* ================= 1. configuration completeness (§24) ================= */
test('every faction carries the full identity configuration',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  const r=RUN(c,`
    const out={};
    FAC_KEYS.forEach(f=>{
      const x=FACTION_IDENTITY[f];
      out[f]={
        name:!!x.name, title:!!x.title, color:/^#[0-9a-f]{6}$/i.test(x.color),
        playstyle:!!x.playstyle, designedFor:/players who/.test(x.designedFor),
        ids:!!(x.militaryIdentity&&x.economicIdentity&&x.strategicIdentity&&x.aiIdentity),
        stats:!!(x.stats.military&&x.stats.economy&&x.stats.mobility&&x.stats.defense),
        spec:!!x.specialization,
        strengths:x.strengths.length>=2, weaknesses:x.weaknesses.length>=2,
        passives:x.passives.length===5 && x.passives.every((p,i)=>p.level===i+1&&p.id&&p.name&&p.desc),
        terrain:Object.keys(x.terrain).length>0,
        weights:Object.keys(x.territoryWeights).length>0,
        morale:!!(x.morale.penaltyResist!==undefined&&x.morale.kingAura!==undefined&&x.morale.note),
        brain:!!(x.brain.name&&x.brain.reserve!==undefined&&x.brain.atkThreshold!==undefined&&x.brain.econFocus!==undefined&&x.brain.priorities),
        doctrines:x.doctrines.length===3 && x.doctrines.every(d=>d.id&&d.name&&d.bg>=0&&d.def>=0&&d.bg+d.def<=100&&d.desc),
        ability:!!(x.ability.id&&x.ability.name&&x.ability.duration>0&&x.ability.cooldown>0&&x.ability.desc)
      };
    });
    out;
  `);
  for(const f of KEYS){
    for(const [k,v] of Object.entries(r[f])) assert.ok(v, f+' missing: '+k);
  }
});

/* ================= 2. balance rules (§20/§23): no perfect faction ================= */
test('no faction is objectively strongest: every identity has a major strength and a real weakness',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  const r=RUN(c,`FAC_KEYS.map(f=>{const s=FACTION_IDENTITY[f].stats;return {f,min:Math.min(s.military,s.economy,s.mobility,s.defense),max:Math.max(s.military,s.economy,s.mobility,s.defense)};})`);
  for(const row of r){
    assert.ok(row.max>=8, row.f+' has no major strength');
    assert.ok(row.min<=5, row.f+' has no meaningful weakness');
  }
});

test('unique mechanics: each faction owns one signature ability and no two share an id',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  const ids=RUN(c,`FAC_KEYS.map(f=>FACTION_IDENTITY[f].ability.id)`);
  assert.equal(new Set(ids).size,6);
  for(const f of KEYS) assert.equal(RUN(c,`FACTION_IDENTITY.${f}.passives[4].id`), ids[KEYS.indexOf(f)], f+' progression must unlock its signature last');
});

/* ================= 3. progression (§16) ================= */
test('kingdom levels unlock 1→5 at 0/4/12/24/40 zones and gate passives',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  for(const [zones,level] of [[0,1],[3,1],[4,2],[11,2],[12,3],[24,4],[39,4],[40,5]]){
    c._oc.rome=zones;
    assert.equal(RUN(c,'factionLevel("rome")'), level, 'level at '+zones+' zones');
  }
  c._oc.rome=3;
  assert.equal(RUN(c,'factionHasPassive("rome","legionary-discipline")'), true, 'L1 passive at start');
  assert.equal(RUN(c,'factionHasPassive("rome","imperial-mobilization")'), false, 'L5 passive locked early');
  c._oc.rome=40;
  assert.equal(RUN(c,'factionHasPassive("rome","imperial-mobilization")'), true, 'L5 passive at 40 zones');
  c._oc.rome=40; c._oc.vikings=40;
  c.playerTeam='moldavia';
  RUN(c,'factionProgressionCheck()');
  assert.equal(RUN(c,'FAC_LEVELS.vikings'),5,'progression check records level-ups');
});

/* ================= 4. Battle Momentum (Norrøn, §5) ================= */
test('momentum stacks on consecutive victories, caps at 4, dies on defeat, decays in peace',()=>{
  const c=world(); c.gameTime=100;
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  c._oc.vikings=40; // all passives
  c.EC.vikings={gold:0};
  RUN(c,`onZoneCaptured('vikings','rome',5)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),1,'first victory: MOMENTUM +1');
  c.gameTime=160;
  RUN(c,`onZoneCaptured('vikings','sparta',6)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),2,'consecutive victory: MOMENTUM +2');
  c.gameTime=220;
  RUN(c,`onZoneCaptured('vikings','nippon',7)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),3,'MOMENTUM +3');
  c.gameTime=280;
  RUN(c,`onZoneCaptured('vikings','moldavia',8)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),4,'MOMENTUM +4');
  c.gameTime=340;
  RUN(c,`onZoneCaptured('vikings','egypt',9)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),4,'momentum capped at 4');
  assert.ok(c.EC.vikings.gold>0,'raider culture pays war-booty');
  /* defeat kills momentum */
  c.gameTime=400;
  RUN(c,`onZoneLost('vikings','rome',10)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),0,'defeat destroys momentum');
  /* decay after 90s of peace (arms at +90s, fires one tick later) */
  c.gameTime=500;
  RUN(c,`onZoneCaptured('vikings','rome',5)`);
  assert.equal(RUN(c,'momentumOf("vikings")'),1);
  c.gameTime=591;
  RUN(c,'updateMomentum(1/60)');   // arms the decay timer
  assert.equal(RUN(c,'momentumOf("vikings")'),1);
  c.gameTime=622;
  RUN(c,'updateMomentum(1/60)');   // fires
  assert.equal(RUN(c,'momentumOf("vikings")'),0,'peace of 90s+ decays momentum to zero');
});

/* ================= 5. signature abilities (§2/§16) ================= */
test('signature abilities are gated behind Kingdom Level 5, cooldown and strain',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  /* too early */
  c._oc.rome=10;
  assert.equal(RUN(c,'tryActivateAbility("rome").ok'),false,'locked below Level 5');
  /* unlocked */
  c._oc.rome=40;
  assert.equal(RUN(c,'tryActivateAbility("rome").ok'),true,'activates at Level 5');
  assert.ok(RUN(c,'FAC_ABIL.rome.t')>0,'active duration set');
  assert.equal(RUN(c,'tryActivateAbility("rome").ok'),false,"cannot re-activate while active");
  RUN(c,'updateFactionAbilities(46)');
  assert.ok(RUN(c,'FAC_ABIL.rome.cd')>0,'cooldown starts after effect');
  assert.ok(RUN(c,'FAC_ABIL.rome.strain')>0,'economic strain follows mobilization');
  /* strain decays, cooldown decays */
  RUN(c,'updateFactionAbilities(181)');
  assert.equal(RUN(c,'tryActivateAbility("rome").ok'),true,'ready again after cooldown');
});

test('Nippon Clan Tactics requires a mode and applies its tradeoffs',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  c._oc.nippon=40;
  assert.equal(RUN(c,'tryActivateAbility("nippon").ok'),false,'tactic requires a mode');
  assert.equal(RUN(c,'tryActivateAbility("nippon","bogus").ok'),false,'unknown tactic rejected');
  assert.equal(RUN(c,'tryActivateAbility("nippon","ambush").ok'),true,'ambush accepted');
  assert.equal(RUN(c,'FAC_ABIL.nippon.ambushT'),8,'ambush first-strike window set');
  assert.equal(RUN(c,'abilityFx("nippon").firstStrike'),1.35,'ambush fx resolved');
});

test('ability modifiers flow into upkeep, income, speed and recruit cost',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  c._oc.egypt=40;
  const before=RUN(c,'factionIncomeMod("egypt")');
  assert.ok(before>=1,'doctrine baseline applies (Egypt opens on Economic)');
  RUN(c,'tryActivateAbility("egypt")');
  const flood=RUN(c,'factionIncomeMod("egypt")');
  assert.ok(flood/before>1.49,'Flood of the Nile multiplies the baseline by ~1.5');
  const mob=RUN(c,'tryActivateAbility("moldavia")'); // moldavia not level 5 yet
  assert.equal(mob.ok,false);
  c._oc.moldavia=40;
  assert.equal(RUN(c,'tryActivateAbility("moldavia").ok'),true);
  assert.ok(RUN(c,'factionMoveMod("moldavia")')>1.2,'rapid mobilization speed');
  c._oc.sparta=40;
  RUN(c,'tryActivateAbility("sparta")');
  RUN(c,'updateFactionAbilities(26)'); // resolve ends → strain
  assert.ok(RUN(c,'factionRecruitCostMod("sparta")')>1,"300's Resolve strain raises recruit cost");
  assert.ok(RUN(c,'factionMoveMod("sparta")')<1,'fatigue slows the host');
});

/* ================= 6. terrain interaction (§14) ================= */
test('terrain affinity: every faction moves and defends differently on the same ground',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  assert.ok(RUN(c,'factionTerrainMoveCost("vikings","river")')>1.2,'Norrøn loves water routes');
  assert.ok(RUN(c,'factionTerrainMoveCost("egypt","desert")')>1.2,'Kemet ignores the desert penalty');
  assert.ok(RUN(c,'factionTerrainMoveCost("sparta","mountains")')<1,'Sparta at home in the passes');
  assert.ok(RUN(c,'factionTerrainMoveCost("rome","mountains")')<1,'Rome dislikes the mountains');
  assert.ok(RUN(c,'factionTerrainDefense("sparta","mountains")')>=10,'Sparta mountain defense');
  assert.ok(RUN(c,'factionTerrainDefense("nippon","forest")')>=8,'Nippon forest defense');
  assert.ok(RUN(c,'factionTerrainDefense("nikon","forest")')===0,'unknown factions are safe no-ops');
  assert.equal(RUN(c,'factionTerrainMoveCost("nikon","plains")'),1);
});

/* ================= 7. territory priorities (§10) ================= */
test('each brain wants different ground: weak/rich, income, strategic, tactical',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  c._terr={0:'plains',1:'plains',2:'city',3:'mountains',4:'forest',5:'hills',6:'river',7:'desert'};
  c._inc={0:3,1:2,2:7,3:3,4:2.5,5:2.4,6:3.4,7:1.2};
  c._pop={2:20000,3:2000};
  c._strat={2:'Capital'};
  c.TOWNS={rome:{x:2250,z:-2250},sparta:{x:2250,z:2250},moldavia:{x:-2250,z:2250},vikings:{x:-2250,z:-2250},egypt:{x:-2250,z:-2250},nippon:{x:2250,z:2250}};
  c.zones[0].owner='sparta'; c.zones[0].core=true;   // heavily defended fortress
  c.zones[1].owner='sparta';                            // poor plains border
  c.zones[2].owner='egypt'; c.zones[2].core=true;      // rich undefended capital
  c.zones[6].owner='sparta';                            // weak river zone on a Viking border
  c.zones[10].owner='vikings';                          // makes zone 6 a frontier target
  c.entities=[];
  for(let i=0;i<6;i++) c.entities.push({dead:false,passive:false,team:'sparta',group:{position:{x:-2900+i*5,z:-2900+i*5}}}); // fortress garrison in zone 0
  const vik=RUN(c,`[0,2,6].map(z=>factionTargetScore('vikings',z))`);
  assert.ok(vik[2]>vik[0],'Norrøn prefers weak ground over a garrisoned fortress');
  const egn=RUN(c,`[0,1,2].map(z=>factionTargetScore('egypt',z))`);
  assert.ok(egn[2]>egn[0],'Kemet chases income (the capital pays)');
  const rom=RUN(c,`[0,1].map(z=>factionTargetScore('rome',z))`);
  assert.ok(rom[0]>rom[1],'Rome weights strategic cores and roads over empty plains');
  const njp=RUN(c,`[1,4,5].map(z=>factionTargetScore('nippon',z))`); // [plains, forest, hills]
  assert.ok(njp[1]>njp[0],'Nippon prefers forested tactical ground over open plains');
  assert.ok(njp[2]>njp[0],'Nippon prefers hills over open plains');
});

/* ================= 8. doctrines (§12) ================= */
test('doctrines are valid per faction, switch safely, and reshape doctrine modifiers',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  RUN(c,'resetFactionSystems()');
  c.playerTeam='rome';
  assert.equal(RUN(c,'setFactionDoctrine("rome","bogus")'),false,'unknown doctrine rejected');
  assert.equal(RUN(c,'setFactionDoctrine("rome","fortress")'),true,'valid doctrine applied');
  assert.equal(RUN(c,'FAC_DOCTRINE.rome'),'fortress');
  assert.equal(RUN(c,'doctrineMod("rome").fort'),1.2,'fortress fortification bonus');
  assert.ok(c._doctrineCalls.some(d=>d.bg===0.1&&d.def===0.6),'doctrine wrote 10/60 into the army config');
  for(const f of KEYS){
    c.playerTeam=null;
    for(const d of RUN(c,`FACTION_IDENTITY.${f}.doctrines.map(d=>d.id)`)){
      assert.equal(RUN(c,`setFactionDoctrine("${f}","${d}")`),true, f+' doctrine '+d);
    }
  }
});

/* ================= 9. faction AI decisions (§9/§21/§22) ================= */
test('the same situation produces different decisions per faction',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  const I='({threat:"HIGH",army:12,foeMax:30,foeNear:10,foeInOwn:8,treasury:200,income:12,upkeep:6,territory:18,momentum:0,terrainFavor:false,raidTarget:false,targetName:"x",outnumbered:true})';
  const decisions=RUN(c,`FAC_KEYS.map(f=>({f, d:factionAIDecision(f,${I}).decision}))`);
  const get=f=>decisions.find(x=>x.f===f).d;
  assert.match(get('rome'),/DEFEND/,'Rome defends under pressure');
  assert.match(get('sparta'),/LAST STAND/,'Sparta holds the line outnumbered');
  assert.match(get('moldavia'),/FRONTIER/,'Moldova turns to frontier defense');
  assert.match(get('vikings'),/RETREAT/,'Norrøn abandons an impossible raid');
  assert.match(get('nippon'),/AMBUSCH/,'Nippon ambushes the assault');
  /* the brain knows when to pull the signature ability */
  const ab=RUN(c,`FAC_KEYS.map(f=>factionAIDecision(f,${I}).ability)`);
  assert.equal(ab[KEYS.indexOf('sparta')],'300s-resolve');
  assert.equal(ab[KEYS.indexOf('nippon')],'clan-tactics');
  assert.equal(RUN(c,`factionAIDecision('nippon',${I}).mode`),'ambush');
  /* open field: the raiding host hunts */
  const open='({threat:"Low",army:20,foeMax:8,foeNear:2,foeInOwn:0,treasury:300,income:15,upkeep:4,territory:20,momentum:3,terrainFavor:true,raidTarget:true,targetName:"the granary",outnumbered:false})';
  assert.match(RUN(c,`factionAIDecision('vikings',${open}).decision`),/RAID/);
  assert.equal(RUN(c,`factionAIDecision('vikings',${open}).ability`),'great-raid');
  assert.match(RUN(c,`factionAIDecision('sparta',${open}).decision`),/DECISIVE/,'Sparta attacks from favorable ground');
  assert.equal(RUN(c,`factionAIDecision('egypt',${open}).ability`),'flood-of-the-nile','Kemet calls the flood when it can');
});

/* ================= 10. formation mechanics (Rome/Sparta) ================= */
test('legion cohesion and phalanx geometry gate the formation bonuses',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  c._oc.rome=40; c._oc.sparta=40;
  const allies=Array.from({length:6},(_,i)=>({dead:false,passive:false,team:'rome',ranged:false,group:{position:{x:i,z:0}}}));
  c._near={'0,0':allies};
  assert.equal(RUN(c,`legionCohesion({dead:false,team:'rome',ranged:false,group:{position:{x:0,z:0}}})`),1,'six close comrades: full cohesion');
  c._near={'1,1':allies.slice(0,2)};
  const coh2=RUN(c,`legionCohesion({dead:false,team:'rome',ranged:false,group:{position:{x:1,z:1}}})`);
  assert.ok(coh2>0&&coh2<1,'partial cohesion scales');
  const phAlly=Array.from({length:4},(_,i)=>({dead:false,passive:false,team:'sparta',ranged:false,group:{position:{x:i,z:0}}}));
  c._near={'2,2':phAlly};
  assert.equal(RUN(c,`phalanxFormed({dead:false,team:'sparta',ranged:false,group:{position:{x:2,z:2}}})`),true,'four melee neighbours form a phalanx');
  assert.equal(RUN(c,`phalanxFormed({dead:false,team:'sparta',ranged:true,group:{position:{x:2,z:2}}})`),false,'ranged units cannot hold the line');
  /* the phalanx front takes less; the rear pays (target faces +z, yaw 0) */
  const phObj=JSON.stringify({dead:false,team:'sparta',ranged:false,yaw:0,group:{position:{x:2,z:2}}});
  const front=RUN(c,`factionIncomingMod(${phObj},2,4)`);   // attacker in front of the wall
  const rear=RUN(c,`factionIncomingMod(${phObj},2,0)`);    // attacker at the rear
  assert.ok(front<1,'front-facing attack blunted by the shield wall');
  assert.ok(rear>1,'attack from behind the phalanx is punished');
});

/* ================= 11. battle feedback UI data (§19) ================= */
test('each faction reports its own battle status to the HUD',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  c._oc.rome=40; c._oc.vikings=2;
  const r={};
  for(const f of KEYS){
    c.playerTeam=f;
    r[f]=RUN(c,`factionBattleStatus("${f}")`);
  }
  c.playerTeam=null;
  assert.match(r.rome.title,/LEGION FORMATION/); assert.match(r.rome.value,/Integrity/);
  assert.match(r.sparta.title,/WARRIOR MORALE/); assert.match(r.sparta.value,/Morale/);
  assert.match(r.moldavia.title,/FRONTIER DEFENSE/); assert.match(r.moldavia.value,/Homeland/);
  assert.match(r.vikings.title,/BATTLE MOMENTUM/); assert.match(r.vikings.value,/Momentum/);
  assert.match(r.egypt.title,/SUPPLY NETWORK/); assert.match(r.egypt.value,/Supply Efficiency/);
  assert.match(r.nippon.title,/TACTICAL ADVANTAGE/); assert.match(r.nippon.value,/Precision/);
});

/* ================= 12. morale identity (§13) ================= */
test('morale penalties are resisted differently by each faction',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js']);
  const table=RUN(c,`FAC_KEYS.map(f=>factionMoraleResist(f))`);
  assert.ok(table[KEYS.indexOf('sparta')]>=0.5,'Sparta resists morale collapse');
  assert.ok(table[KEYS.indexOf('rome')]>table[KEYS.indexOf('vikings')],'Rome steadier than Norrøn');
  c.uSparta={team:'sparta',dmgMult:1.4};
  c.uVik={team:'vikings',dmgMult:1.4};
  RUN(c,`applyMoralePenalty(uSparta,30,0.78);applyMoralePenalty(uVik,30,0.78)`);
  assert.ok(c.uSparta.dmgMult>0.85,'Spartan penalty is muted by warrior culture');
  assert.ok(c.uVik.dmgMult<0.85,'Norrøn feels the blow (winBoost lives on victories)');
});

/* ================= 13. capture resistance asymmetry (soft counters §15) ================= */
test('walls hold differently: Rome and Sparta fortify, the raiding host does not',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  for(const f of KEYS) c._oc[f]=40;
  const need=RUN(c,`
    ['rome','sparta','moldavia','egypt','nippon','vikings'].map(f=>{
      const zi=0; const z=zones[zi]; z.owner=f; z.core=true; z.bonus=false;
      return {f, need: factionZoneNeedMod(f, zi, 3, 10)};
    });
  `);
  const get=f=>need.find(x=>x.f===f).need;
  assert.ok(get('rome')>6,'Roman engineering resists capture');
  assert.ok(get('sparta')>8,'Spartan last stand makes the core very hard to take');
  assert.ok(get('vikings')<0,'the raiding host holds stone walls badly (its documented weakness)');
  assert.ok(get('nippon')>0||get('nippon')===0,'Nippon defense is terrain-dependent');
});

/* ================= 14. save/restore safety ================= */
test('resetFactionSystems leaves a clean state for every kingdom',()=>{
  const c=world();
  load(c,['src/system/faction-identity.js','src/system/faction-battle.js','src/system/faction-abilities.js']);
  RUN(c,'resetFactionSystems()');
  const st=RUN(c,`FAC_KEYS.map(f=>({lv:FAC_LEVELS[f], doc:FACTION_IDENTITY[f].doctrines[0].id===FAC_DOCTRINE[f], ab:FAC_ABIL[f].t===0&&FAC_ABIL[f].cd===0, mo:FAC_MOMENTUM[f].value===0}))`);
  for(const s of st){ assert.equal(s.lv,1); assert.ok(s.doc); assert.ok(s.ab); assert.ok(s.mo); }
});

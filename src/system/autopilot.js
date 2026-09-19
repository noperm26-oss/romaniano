/* ---------------- v9: AFK AI BRAIN — strategic commander ---------------- */
var AI_PERSONALITIES={
  balanced:{ name:'Balanced', reserve:0.18, defBias:0.45, atkThreshold:1.15, econFocus:0.5, desc:'Maintains reserve, defends important territory, attacks with advantage' },
  aggressive:{ name:'Aggressive', reserve:0.06, defBias:0.22, atkThreshold:0.85, econFocus:0.2, desc:'Prioritizes expansion, spends treasury, accepts casualties' },
  defensive:{ name:'Defensive', reserve:0.28, defBias:0.68, atkThreshold:1.45, econFocus:0.4, desc:'Prioritizes capitals & valuable territories, large defense, counterattacks weakened' },
  economic:{ name:'Economic', reserve:0.32, defBias:0.38, atkThreshold:1.35, econFocus:0.85, desc:'Prioritizes income & development, avoids unnecessary wars' }
};
function aiPersonalityFor(team){
  var mod=typeof kingdomMod!=='undefined'?kingdomMod(team):null;
  if(!mod) return AI_PERSONALITIES.balanced;
  if(mod.name==='NORRØN') return AI_PERSONALITIES.aggressive;
  if(mod.name==='SPARTA') return AI_PERSONALITIES.defensive;
  if(mod.name==='KEMET') return AI_PERSONALITIES.economic;
  if(mod.name==='ROMA') return AI_PERSONALITIES.balanced;
  if(mod.name==='NIPPON') return AI_PERSONALITIES.balanced;
  return AI_PERSONALITIES.balanced;
}
function toggleAfk(v){
  afkMode=(v===undefined)?!afkMode:!!v;
  var chip=$('afk-chip');
  if(afkMode){
    if(state===ST.PAUSE){ hide(overlayPause); state=ST.PLAY; }
    if(recruitOpen) toggleRecruit();
    if(warmapOpen) toggleWarmap();
    if(settingsOpen) toggleSettings(false);
    if(document.pointerLockElement) document.exitPointerLock();
    brainT=0; brainCmdT=0; brainPathT=0; brainStuck=0;
    var pers=aiPersonalityFor(playerTeam);
    killFeedMsg('AFK', '🤖 AI Brain ('+pers.name+') rules — '+pers.desc+'. Press K to take over.', '#d08a3e');
    showBanner('AFK — AI Brain · '+pers.name, 'Threat-aware commander: treasury, army, territory, king health. Press K to rule again.', 3.5);
    if(chip) chip.className='show';
    if(player && !player.dead && !player.riding) toggleRide(true);
  } else {
    keys.KeyW=false; keys.KeyA=false; keys.KeyS=false; keys.KeyD=false;
    mouse.wantAttack=false;
    if(player){ player.blocking=false; player.aiming=false; }
    brainIntent='IDLE';
    killFeedMsg('AFK', 'You rule again, majesty.', '#7ec97e');
    if(chip) chip.className='';
    if(state===ST.PLAY) tryLock();
  }
}
function brainSetIntent(s){
  brainIntent=s;
  var chip=$('afk-chip');
  if(chip){
    var pers=aiPersonalityFor(playerTeam);
    var extra='';
    if(typeof EC!=='undefined' && playerTeam) extra=' | gold '+Math.floor(EC[playerTeam].gold)+' | inc '+(typeof incomeRate!=='undefined'?incomeRate(playerTeam).toFixed(1):'0');
    chip.textContent='🤖 AFK · '+pers.name+' · '+s+' · army '+playerUnits().length+extra+' · press K';
  }
}
function brainTick(dt){
  if(!afkMode) return;
  if(state===ST.REDEPLOY){
    brainSetIntent('REDEPLOY');
    brainCmdT-=dt;
    if(brainCmdT<=0){
      brainCmdT=2.5;
      var card=document.querySelector('#role-grid-rd .card');
      if(card) card.click();
      var btn=$('btn-rd-spawn');
      if(btn && !btn.disabled) btn.click();
    }
    return;
  }
  if(state!==ST.PLAY || !player || player.dead) return;
  if(recruitOpen || warmapOpen || settingsOpen) return;
  var army=playerUnits(), oc=ownedCounts();
  var px=player.group.position.x, pz=player.group.position.z;
  var pers=aiPersonalityFor(playerTeam);
  /* --- gather intelligence --- */
  var treasury=EC[playerTeam].gold;
  var income=typeof incomeRate!=='undefined'?incomeRate(playerTeam):0;
  var upkeep=typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(playerTeam):0;
  var netIncome=income-upkeep;
  var armySize=army.length;
  var territoryCount=oc[playerTeam]||0;
  var kingHpFrac=player.hp/(player.maxHp||100);
  var foes=0, foe=null, nd=1e18;
  var enemyArmies={};
  var nearestEnemyZoneDist=1e18, nearestEnemyZone=-1;
  entities.forEach(function(e){
    if(e.dead||e.passive||e.civ||!hostileF(e.team,playerTeam)) return;
    var dx=e.group.position.x-px, dz=e.group.position.z-pz, d=dx*dx+dz*dz;
    if(d<70*70) foes++;
    if(d<nd){ nd=d; foe=e; }
    enemyArmies[e.team]=(enemyArmies[e.team]||0)+1;
  });
  nd=nd===1e18?1e9:Math.sqrt(nd);
  // enemy army sizes
  var maxEnemyArmy=0, totalEnemy=0;
  for(var et in enemyArmies){ totalEnemy+=enemyArmies[et]; if(enemyArmies[et]>maxEnemyArmy) maxEnemyArmy=enemyArmies[et]; }
  // territory strategic value & threats
  var capitalThreat='Low', highValueThreat=0;
  var myCoreZi=-1;
  FAC_KEYS.forEach(function(f){
    if(f!==playerTeam) return;
    var T=TOWNS[f];
    var coreZi=zoneIdxAt(T.x,T.z);
    myCoreZi=coreZi;
    // check enemies near capital
    var nearCap=0;
    entities.forEach(function(e){
      if(e.dead||e.team===playerTeam||e.civ||e.passive) return;
      var dx=e.group.position.x-TOWNS[f].x, dz=e.group.position.z-TOWNS[f].z;
      if(dx*dx+dz*dz<200*200) nearCap++;
    });
    if(nearCap>=6) capitalThreat='HIGH';
    else if(nearCap>=2) capitalThreat='Medium';
  });
  // high value zones threatened
  for(var zi=0;zi<zones.length;zi++){
    if(zones[zi].owner!==playerTeam) continue;
    var strat=typeof zoneStrategicValue!=='undefined'?zoneStrategicValue(zi):'Low';
    if(strat==='High' || strat==='Capital'){
      var c=zoneCenter(zi);
      var near=0;
      entities.forEach(function(e){
        if(e.dead||e.team===playerTeam||e.civ||e.passive) return;
        var dx=e.group.position.x-c.x, dz=e.group.position.z-c.z;
        if(dx*dx+dz*dz<120*120) near++;
      });
      if(near>=3) highValueThreat++;
    }
  }
  var threatLevel='Low';
  if(capitalThreat==='HIGH' || foes>=6) threatLevel='HIGH';
  else if(capitalThreat==='Medium' || foes>=3 || highValueThreat>0) threatLevel='Medium';

  /* --- economic decisions --- */
  var wantArmy=14+territoryCount*4;
  if(pers.name==='Aggressive') wantArmy+=8;
  if(pers.name==='Defensive') wantArmy+=4;
  if(pers.name==='Economic') wantArmy=Math.max(10, wantArmy-6);
  // adjust for treasury & income
  var reservePct=pers.reserve;
  var canSpend=treasury*(1-reservePct);
  var rich=treasury > 180 + income* (pers.econFocus>0.6?12:8) && netIncome>0;
  if(armySize<wantArmy || rich){
    var defs=RECRUIT_DEFS[playerTeam], best=null;
    // prefer balanced cost based on personality
    Object.keys(defs).forEach(function(k){
      var d2=defs[k];
      if(EC[playerTeam].gold>=d2.cost){
        if(!best) best={k:k,d:d2};
        else {
          if(pers.name==='Economic' && d2.cost<best.d.cost) best={k:k,d:d2};
          else if(pers.name!=='Economic' && d2.cost>best.d.cost) best={k:k,d:d2};
        }
      }
    });
    if(best && canSpend>=best.d.cost){
      EC[playerTeam].gold-=best.d.cost;
      doMuster(playerTeam, best.k, false);
    }
  }

  /* --- combat --- */
  if(foe && nd<13){
    brainSetIntent('FIGHT (Threat '+threatLevel+')');
    camYaw=Math.atan2(foe.group.position.x-px, foe.group.position.z-pz);
    if(player.atkT<=0 && player.staggerT<=0 && nd<5){
      mouse.wantAttack=true;
      player.blocking=false;
    } else player.blocking=!player.ranged && nd<4.6;
  } else if(player.blocking && !keysShiftHeld()) player.blocking=false;

  /* --- strategic commands --- */
  var roles={bg:0,def:0,atk:0};
  army.forEach(function(e){ if(e.role==='bodyguard')roles.bg++; if(e.role==='defender')roles.def++; if(e.role==='attacker')roles.atk++; });
  brainCmdT-=dt;
  if(brainCmdT<=0){
    brainCmdT=6 + Math.random()*3;
    // Decide doctrine based on threat & personality
    var decision='BALANCED';
    var deploy={bg:5, def:40, atk:55};
    if(threatLevel==='HIGH' || capitalThreat==='HIGH'){
      decision='DEFEND CAPITAL';
      deploy={bg:10, def:65, atk:25};
      issueOrder('defend');
      // set doctrine to defensive
      if(typeof applyDoctrineCfg!=='undefined') applyDoctrineCfg(deploy.bg/100, deploy.def/100);
    } else if(armySize>maxEnemyArmy*pers.atkThreshold && treasury>100 && threatLevel==='Low'){
      decision='COUNTERATTACK';
      deploy={bg:5, def:20, atk:75};
      if(pers.name==='Aggressive') deploy={bg:3, def:15, atk:82};
      issueOrder('attack');
      if(typeof applyDoctrineCfg!=='undefined') applyDoctrineCfg(deploy.bg/100, deploy.def/100);
    } else if(foes>=1 && armySize>=8 && nd<45){
      decision='ENGAGE';
      issueOrder('attack');
    } else if(roles.bg+roles.def===0 && territoryCount>0){
      decision='SECURE';
      issueOrder('defend');
    } else if(armySize>=16+territoryCount*2 && Math.random()< (pers.name==='Aggressive'?0.75:0.45)){
      decision='ADVANCE';
      issueOrder('attack');
    }
    // log decision for debug
    if(typeof window!=='undefined') window.__lastBrainDecision={decision:decision, threat:threatLevel, enemy:maxEnemyArmy, ours:armySize, treasury:Math.floor(treasury), capitalThreat:capitalThreat, deploy:deploy};
  }

  /* --- movement: pursue / regroup / retreat --- */
  var flee=kingHpFrac<0.35 || (foes>=3 && nd<18) || (capitalThreat==='HIGH' && territoryCount<20);
  var gx=null, gz=null;
  if(flee){
    brainSetIntent('RETREAT (HP '+Math.round(kingHpFrac*100)+'%)');
    var bd=1e18;
    for(var zi2=0; zi2<zones.length; zi2++){
      if(zones[zi2].owner!==playerTeam) continue;
      var c3=zoneCenter(zi2);
      var strat=typeof zoneStrategicValue!=='undefined'?zoneStrategicValue(zi2):'Low';
      var score= (c3.x-px)*(c3.x-px)+(c3.z-pz)*(c3.z-pz);
      if(strat==='Capital') score*=0.3;
      else if(strat==='High') score*=0.6;
      if(score<bd){ bd=score; gx=c3.x; gz=c3.z; }
    }
  } else if(foe && nd<70){
    brainSetIntent(player.ranged?'SHOOT':'PURSUE');
    var keep=player.ranged?15:4.2;
    if(nd>keep){ gx=foe.group.position.x; gz=foe.group.position.z; }
  }
  if(gx===null){
    var sx2=0, sz2=0, sn=0;
    army.forEach(function(e){
      var d4=(e.group.position.x-px)*(e.group.position.x-px)+(e.group.position.z-pz)*(e.group.position.z-pz);
      if(d4<260*260){ sx2+=e.group.position.x; sz2+=e.group.position.z; sn++; }
    });
    if(sn>0){ gx=sx2/sn; gz=sz2/sn; }
    else { var T2=TOWNS[playerTeam]; gx=T2.x; gz=T2.z; }
    if(!foe || nd>=70) brainSetIntent(roles.def>0?'OVERSEE ('+threatLevel+')':'REGROUP');
  }
  var dd=Math.hypot(gx-px, gz-pz);
  if(!player.riding && dd>26) toggleRide(true);
  var stopAt=(foe && !flee) ? (player.ranged?15.5:4.0) : 7;
  if(dd>stopAt){
    var tx=gx, tz=gz;
    brainPathT-=dt;
    var los=dd<45 ? navLos(px,pz,gx,gz) : false;
    if(!los){
      var stale=!brainPath || !brainPathGoal || Math.hypot(brainPathGoal.x-gx, brainPathGoal.z-gz)>25 || brainPathT<=0;
      if(stale){
        brainPathT=2.2+Math.random(); brainPathGoal={x:gx, z:gz};
        brainPath=navFind(px,pz,gx,gz); brainPathI=0;
      }
      if(brainPath&&brainPath.length){
        while(brainPathI<brainPath.length && Math.hypot(brainPath[brainPathI].x-px, brainPath[brainPathI].z-pz)<9) brainPathI++;
        if(brainPathI<brainPath.length){ tx=brainPath[brainPathI].x; tz=brainPath[brainPathI].z; }
      }
    }
    var wy=Math.atan2(tx-px, tz-pz);
    if(brainSteerT>0){ brainSteerT-=dt; wy+=brainSteerOff; }
    camYaw=turnTo(camYaw, wy, 3.5*dt);
    camPitch=0.12;
    keys.KeyW=true; keys.KeyS=false; keys.KeyA=false; keys.KeyD=false;
    brainGoal={x:Math.round(gx), z:Math.round(gz), d:Math.round(dd)};
    if(brainLastPos){
      var mvd=Math.hypot(px-brainLastPos.x, pz-brainLastPos.z);
      if(mvd<1.1) brainStuck+=dt; else brainStuck=0;
      if(brainStuck>1.4){
        brainSteerT=0.9; brainSteerOff=(Math.random()<0.5?-1:1)*0.95;
        brainStuck=0; brainPathT=0;
      }
    }
    brainLastPos={x:px, z:pz};
  } else {
    keys.KeyW=false;
    brainGoal={x:Math.round(gx), z:Math.round(gz), d:0};
    brainLastPos=null; brainStuck=0;
  }
  window.__brainDbg={foe:!!foe, nd:nd===1e18?null:Math.round(nd), foes:foes, intent:brainIntent,
    dd:Math.round(dd), army:armySize, want:wantArmy, gold:Math.floor(treasury), riding:!!player.riding,
    threat:threatLevel, enemyMax:maxEnemyArmy, income:Math.round(income), upkeep:Math.round(upkeep), capitalThreat:capitalThreat};
}
function keysShiftHeld(){ return keys.ShiftLeft||keys.ShiftRight; }
window.addEventListener('keydown', function(ev){
  if(ev.code==='KeyK' && !ev.repeat && !editableTarget(ev.target) && !overlayActive() && (state===ST.PLAY || state===ST.PAUSE)) toggleAfk();
});

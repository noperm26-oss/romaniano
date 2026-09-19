/* ---------------- v9: AFK AI BRAIN ---------------- */
function toggleAfk(v){
  afkMode=(v===undefined)?!afkMode:!!v;
  var chip=$('afk-chip');
  if(afkMode){
    if(state===ST.PAUSE){ hide(overlayPause); state=ST.PLAY; }
    /* v10 FIX: overlays gate the brain — close everything so it rules from second one */
    if(recruitOpen) toggleRecruit();
    if(warmapOpen) toggleWarmap();
    if(settingsOpen) toggleSettings(false);
    if(document.pointerLockElement) document.exitPointerLock();
    brainT=0; brainCmdT=0; brainPathT=0; brainStuck=0;
    killFeedMsg('AFK', '🤖 The AI Brain rules — fights, hires, commands. Press K to take over.', '#d08a3e');
    showBanner('AFK — AI Brain', 'Your king commands himself now. Press K to rule again.', 3);
    if(chip) chip.className='show';
    if(player && !player.dead && !player.riding) toggleRide(true);   /* kings ride to war */
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
  if(chip) chip.textContent='🤖 AFK · '+s+' · army '+playerUnits().length+' · press K to take control';
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
  /* foe scan around the king */
  var foes=0, foe=null, nd=1e18;   /* nd stays SQUARED here — v10 bugfix: plain-vs-squared mix blinded the brain to foes past ~34u */
  entities.forEach(function(e){
    if(e.dead||e.passive||e.civ||!hostileF(e.team,playerTeam)) return;
    var dx=e.group.position.x-px, dz=e.group.position.z-pz, d=dx*dx+dz*dz;
    if(d<70*70) foes++;
    if(d<nd){ nd=d; foe=e; }
  });
  nd=nd===1e18?1e9:Math.sqrt(nd);
  /* HIRE (v10: never idles while there is gold — army target grows, wealth spills into troops) */
  var wantArmy=14+(oc[playerTeam]||0)*4;
  var rich=EC[playerTeam].gold > 180 + incomeRate(playerTeam)*8;
  if(army.length<wantArmy || rich){
    var defs=RECRUIT_DEFS[playerTeam], best=null;
    Object.keys(defs).forEach(function(k){
      var d2=defs[k];
      if(EC[playerTeam].gold>=d2.cost && (!best || d2.cost>best.d.cost)) best={k:k, d:d2};
    });
    if(best){
      EC[playerTeam].gold-=best.d.cost;
      doMuster(playerTeam, best.k, false);
    }
  }
  /* FIGHT what presses on the king */
  if(foe && nd<13){
    brainSetIntent('FIGHT');
    camYaw=Math.atan2(foe.group.position.x-px, foe.group.position.z-pz);
    if(player.atkT<=0 && player.staggerT<=0 && nd<5){
      mouse.wantAttack=true;
      player.blocking=false;   /* v10.1: attack beats block — the shield only rises BETWEEN swings */
    } else player.blocking=!player.ranged && nd<4.6;
  } else if(player.blocking && !keysShiftHeld()) player.blocking=false;
  /* COMMANDS — furious: press any advantage the moment it appears */
  var roles={bg:0,def:0};
  army.forEach(function(e){ if(e.role==='bodyguard')roles.bg++; if(e.role==='defender')roles.def++; });
  brainCmdT-=dt;
  if(brainCmdT<=0){
    brainCmdT=8;
    if(foes>=1 && army.length>=8 && nd<45) issueOrder('attack');
    else if(roles.bg+roles.def===0) issueOrder('defend');
    else if(army.length>=16+(oc[playerTeam]||0)*2 && Math.random()<0.55) issueOrder('attack');
  }
  /* DESTINATION: pursue / regroup / retreat */
  var hpFrac=player.hp/(player.maxHp||100);
  var flee=hpFrac<0.35 || (foes>=3 && nd<18);
  var gx=null, gz=null;
  if(flee){
    brainSetIntent('RETREAT');
    var bd=1e18;
    for(var zi2=0; zi2<zones.length; zi2++){
      if(zones[zi2].owner!==playerTeam) continue;
      var c3=zoneCenter(zi2);
      var d3=(c3.x-px)*(c3.x-px)+(c3.z-pz)*(c3.z-pz);
      if(d3<bd){ bd=d3; gx=c3.x; gz=c3.z; }
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
    if(!foe || nd>=70) brainSetIntent(roles.def>0?'OVERSEE':'REGROUP');
  }
  var dd=Math.hypot(gx-px, gz-pz);
  if(!player.riding && dd>26) toggleRide(true);
  var stopAt=(foe && !flee) ? (player.ranged?15.5:4.0) : 7;   /* v10: close into real swing range (cone 4.65) */
  if(dd>stopAt){
    /* v10.1: A* whenever the straight line crosses buildings — the king can no longer
       beeline into a house. Direct walking only with a clear line of sight. */
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
    dd:Math.round(dd), army:army.length, want:wantArmy, gold:Math.floor(EC[playerTeam].gold), riding:!!player.riding};
}
function keysShiftHeld(){ return keys.ShiftLeft||keys.ShiftRight; }
window.addEventListener('keydown', function(ev){
  if(ev.code==='KeyK' && !ev.repeat && !editableTarget(ev.target) && !overlayActive() && (state===ST.PLAY || state===ST.PAUSE)) toggleAfk();
});

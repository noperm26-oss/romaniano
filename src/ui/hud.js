/* ---------------- rally: the battle horn (G) ---------------- */
var rallyCd=0;
function doRally(){
  if(!player||player.dead||rallyCd>0||state!==ST.PLAY) return false;
  rallyCd=22;
  Snd.horn(); Snd.drum(true); Snd.tone(110,104,0.8,'sawtooth',0.1,0.12);
  spawnRing(player.group.position.x, player.group.position.y+0.3, player.group.position.z, 0xe9c458);
  var n=0;
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    if(e.dead||e.team!==playerTeam) continue;
    var dx=e.group.position.x-player.group.position.x, dz=e.group.position.z-player.group.position.z;
    if(dx*dx+dz*dz<55*55){ e.rallyT=8; n++; }
  }
  killFeedMsg('Battle Horn', n+' allies rally — +speed +damage (8s)', '#e9c458');
  return true;
}

function killFeedMsg(who, what, col){
  var div=document.createElement('div');
  div.className='feed-item';
  div.innerHTML='<span style="color:'+col+'">'+who+'</span><span class="x">»</span><span>'+what+'</span>';
  hudEls.feed.prepend(div);
  while(hudEls.feed.children.length>5) hudEls.feed.removeChild(hudEls.feed.lastChild);
  setTimeout(function(){ div.classList.add('fade'); }, 3600);
  setTimeout(function(){ if(div.parentNode) div.parentNode.removeChild(div); }, 4300);
}
function killFeedKill(killer, victim){
  var kn = killer ? (killer.isPlayer?'You':killer.name) : 'The field';
  var col='#b9a06a';
  if(killer){
    col = killer.team===playerTeam ? '#7ec97e' : '#e06666';
  }
  killFeedMsg(kn, victim.name, col);
}
function updateHUD(dt){
  hudEls.score.textContent=score;
  hudEls.kills.textContent=kills;
  var oc=ownedCounts();
  hudEls.zonesN.textContent=playerTeam?oc[playerTeam]:0;
  hudEls.goldN.textContent=playerTeam?Math.floor(EC[playerTeam].gold):0;
  if(player && !player.dead){
    hudEls.hp.style.width=(clamp(player.hp/player.maxHp,0,1)*100)+'%';
    hudEls.st.style.width=(clamp(player.stamina,0,100))+'%';
    hudEls.crosshair.className='crosshair'+(player.ranged?(player.aiming?' aim':' bow'):'');
  }
  hitVignette=Math.max(0, hitVignette-dt*1.4);
  var lowHp=player&&!player.dead&&player.hp<player.maxHp*0.3 ? (0.25+0.15*Math.sin(gameTime*6)) : 0;
  hudEls.vignette.style.opacity=Math.min(1, hitVignette+lowHp).toFixed(2);
  if(bannerTimer>0){ bannerTimer-=dt; if(bannerTimer<=0) hudEls.banner.classList.remove('show'); }
  if(hintTimer>0){ hintTimer-=dt; if(hintTimer<=0) hudEls.hint.classList.remove('show'); }
  /* conquest bar refresh (twice per second) */
  conqHudT-=dt;
  if(conqHudT<=0){
    conqHudT=0.5;
    var total=ZN*ZN;
    var segs='';
    var labels='';
    FAC_KEYS.forEach(function(f){
      var pct=Math.round(oc[f]/total*100);
      segs+='<div style="width:'+(oc[f]/total*100)+'%;background:'+FACS[f].mapColor+'"></div>';
      labels+='<span style="color:'+FACS[f].mapColor+'">'+FACS[f].name+' '+pct+'%</span>';
    });
    var npct=Math.round(oc.neutral/total*100);
    segs+='<div style="width:'+(oc.neutral/total*100)+'%;background:#6b6257"></div>';
    labels+='<span style="color:#9a9078">Neutral '+npct+'%</span>';
    hudEls.conq.innerHTML=segs;
    hudEls.conqLabels.innerHTML=labels;
  }
  drawMinimap(oc);
  /* landmark lore card */
  if(player && !player.dead){
    var bestL=null, bd=1e9;
    for(var L=0;L<LANDMARKS.length;L++){
      var lm=LANDMARKS[L];
      var ddx=player.group.position.x-lm.x, ddz=player.group.position.z-lm.z, dd=ddx*ddx+ddz*ddz;
      if(dd<lm.r*lm.r && dd<bd){ bd=dd; bestL=lm; }
    }
    if(bestL){
      if(loreNow!==bestL){
        loreNow=bestL;
        hudEls.loreName.textContent=bestL.icon+'  '+bestL.name;
        hudEls.loreSub.textContent=bestL.sub;
        hudEls.loreStory.textContent=bestL.story;
      }
      hudEls.lore.classList.add('show');
    } else { hudEls.lore.classList.remove('show'); loreNow=null; }
  } else { hudEls.lore.classList.remove('show'); }
  /* army command bar */
  cmdHudT-=dt;
  if(cmdHudT<=0){
    cmdHudT=0.4;
    var armyN=0;
    for(var ai2=0;ai2<entities.length;ai2++){
      var ae=entities[ai2];
      if(!ae.dead && !ae.civ && !ae.isPlayer && ae.team===playerTeam) armyN++;
    }
    var lbl={follow:'1 FOLLOW', defend:'2 DEFEND', attack:'3 ATTACK', halt:'4 HALT', area:'MAP POST'};
    var roles={bodyguard:0,defender:0,attacker:0};
    for(var re2=0;re2<entities.length;re2++){
      var rn=entities[re2].role;
      if(rn&&roles[rn]!==undefined) roles[rn]++;
    }
    var inc=incomeRate(playerTeam);
    hudEls.cmd.innerHTML='<span class="cmd-scope">'+Math.round(SCOPES[cmdScopeIdx]*100)+'%</span>'
      +['follow','defend','attack','halt','area'].map(function(o){
        return '<span class="cmd-opt'+(curOrder===o?' on':'')+'">'+lbl[o]+'</span>';
      }).join('')
      +'<span class="cmd-n">⚔ '+armyN+(roles.bodyguard?' 👑'+roles.bodyguard:'')+(roles.defender?' 🛡'+roles.defender:'')+(roles.attacker?' ⚔'+roles.attacker:'')+'</span>'
      +'<span class="cmd-n">💰+'+inc.toFixed(1)+'/s</span>'
      +(AUTOBUY.on?'<span class="cmd-n">🤖 auto-buy</span>':'');
  }
  /* battle horn chip */
  rallyCd=Math.max(0, rallyCd-dt);
  hudEls.rally.textContent=rallyCd>0?('G — Battle Horn · '+Math.ceil(rallyCd)+'s'):('G — Battle Horn · READY');
  hudEls.rally.className=rallyCd>0?'rally-chip cd':'rally-chip ready';
}
/* minimap (whole world) */

/* ---------------- hidden developer/debug menu ---------------- */
var debugOpen=false;
var overlayDebug=null;
function toggleDebug(open){
  if(!overlayDebug){
    var div=document.createElement('div');
    div.id='debug-overlay';
    div.className='overlay hidden';
    div.innerHTML='<div class=\"panel\" style=\"max-width:720px;text-align:left\">'
      +'<h2>🔧 Developer Tools <span>— hidden, for testing only</span></h2>'
      +'<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0\">'
      +'<button id=\"dbg-gold\">+1000 Gold</button>'
      +'<button id=\"dbg-gold10\">+10000 Gold</button>'
      +'<button id=\"dbg-army\">Spawn 10 Army</button>'
      +'<button id=\"dbg-killking\">Kill King (test death)</button>'
      +'<button id=\"dbg-tp-field\">Teleport to Field (0,0)</button>'
      +'<button id=\"dbg-tp-cap\">Teleport to Capital</button>'
      +'<button id=\"dbg-enemy\">Spawn Enemy Army (5)</button>'
      +'<button id=\"dbg-battle\">Force Battle Report</button>'
      +'<button id=\"dbg-set50\">Set 50% Zones</button>'
      +'<button id=\"dbg-set128\">Set 128 Zones (win)</button>'
      +'<button id=\"dbg-clear\">Clear Save</button>'
      +'<button id=\"dbg-save\">Save Now</button>'
      +'<button id=\"dbg-brain\">Force AI Decision</button>'
      +'<button id=\"dbg-switch\">Switch Kingdom (random)</button>'
      +'<button id=\"dbg-upkeep\">Toggle Upkeep Debug</button>'
      +'<button id=\"dbg-reset\">Reset Campaign</button>'
      +'</div>'
      +'<div id=\"dbg-info\" style=\"background:#fbf3dc;border:1px solid #8a6a2f;border-radius:6px;padding:8px;font-size:12px;max-height:180px;overflow:auto\"></div>'
      +'<div class=\"row center\"><button id=\"dbg-close\">Close (F10)</button></div>'
      +'</div>';
    document.body.appendChild(div);
    overlayDebug=div;
    // bind buttons
    div.querySelector('#dbg-gold').addEventListener('click', function(){ if(EC[playerTeam]) EC[playerTeam].gold+=1000; updDbgInfo(); });
    div.querySelector('#dbg-gold10').addEventListener('click', function(){ if(EC[playerTeam]) EC[playerTeam].gold+=10000; updDbgInfo(); });
    div.querySelector('#dbg-army').addEventListener('click', function(){ for(var i=0;i<10;i++) doMuster(playerTeam, Object.keys(RECRUIT_DEFS[playerTeam])[0], false); updDbgInfo(); });
    div.querySelector('#dbg-killking').addEventListener('click', function(){ if(window.__game && window.__game.doom) window.__game.doom(); });
    div.querySelector('#dbg-tp-field').addEventListener('click', function(){ if(player){ player.group.position.x=0; player.group.position.z=0; } });
    div.querySelector('#dbg-tp-cap').addEventListener('click', function(){ if(player && TOWNS[playerTeam]){ player.group.position.x=TOWNS[playerTeam].x; player.group.position.z=TOWNS[playerTeam].z; } });
    div.querySelector('#dbg-enemy').addEventListener('click', function(){
      var other=FAC_KEYS.filter(function(f){return f!==playerTeam;})[0];
      for(var i=0;i<5;i++){ var okey=Object.keys(FACS[other].classes)[0]; spawnCharacter(okey, other, player.group.position.x+rand(-20,20), player.group.position.z+rand(-20,20)); }
      updDbgInfo();
    });
    div.querySelector('#dbg-battle').addEventListener('click', function(){
      if(typeof lastBattle!=='undefined'){
        var el=$('battle-report');
        if(el){
          $('br-title').textContent='BATTLE RESULT — '+lastBattle.result;
          $('br-body').innerHTML='<div class=\"line\"><span>Enemy Losses</span><b>'+lastBattle.enemyLoss+'</b></div>'
            +'<div class=\"line\"><span>Our Losses</span><b>'+lastBattle.ourLoss+'</b></div>'
            +'<div class=\"line\"><span>Territory</span><b>#'+lastBattle.zone+'</b></div>'
            +'<div class=\"line\"><span>Gold</span><b>+'+lastBattle.gold+'</b></div>'
            +'<div class=\"line\"><span>Army Remaining</span><b>'+lastBattle.armyRemaining+'</b></div>';
          el.classList.remove('hidden');
        }
      }
    });
    div.querySelector('#dbg-set50').addEventListener('click', function(){
      var oc=ownedCounts(); var need=50-oc[playerTeam];
      for(var i=0;i<zones.length && need>0;i++){ if(zones[i].owner!==playerTeam){ zones[i].owner=playerTeam; need--; } }
      updDbgInfo();
    });
    div.querySelector('#dbg-set128').addEventListener('click', function(){
      var oc=ownedCounts(); var need=128-oc[playerTeam];
      for(var i=0;i<zones.length && need>0;i++){ if(zones[i].owner!==playerTeam){ zones[i].owner=playerTeam; need--; } }
      checkDomination(); updDbgInfo();
    });
    div.querySelector('#dbg-clear').addEventListener('click', function(){ clearSave(); killFeedMsg('Debug','Save cleared','#e06666'); updDbgInfo(); });
    div.querySelector('#dbg-save').addEventListener('click', function(){ saveCampaign(); killFeedMsg('Debug','Saved','#7ec97e'); updDbgInfo(); });
    div.querySelector('#dbg-brain').addEventListener('click', function(){ brainCmdT=0; brainTick(1); updDbgInfo(); });
    div.querySelector('#dbg-switch').addEventListener('click', function(){
      var other=FAC_KEYS.filter(function(f){return f!==playerTeam;})[Math.floor(Math.random()*5)];
      playerTeam=other; toFaction(); updDbgInfo();
    });
    div.querySelector('#dbg-upkeep').addEventListener('click', function(){
      var up=typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(playerTeam):0;
      var inc=typeof incomeRate!=='undefined'?incomeRate(playerTeam):0;
      killFeedMsg('Debug','Upkeep '+up.toFixed(2)+' | Income '+inc.toFixed(2)+' | Net '+(inc-up).toFixed(2),'#8ab8e0');
      updDbgInfo();
    });
    div.querySelector('#dbg-reset').addEventListener('click', function(){ location.reload(); });
    div.querySelector('#dbg-close').addEventListener('click', function(){ toggleDebug(false); });
  }
  debugOpen=(open===undefined)?!debugOpen:!!open;
  if(debugOpen){
    if(overlayDebug) { overlayDebug.classList.remove('hidden'); updDbgInfo(); }
    if(document.pointerLockElement) document.exitPointerLock();
  } else {
    if(overlayDebug) overlayDebug.classList.add('hidden');
    if(state===ST.PLAY) tryLock();
  }
}
function updDbgInfo(){
  var el=document.getElementById('dbg-info');
  if(!el) return;
  var oc=typeof ownedCounts!=='undefined'?ownedCounts():{};
  var up=typeof armyUpkeepCost!=='undefined' && playerTeam?armyUpkeepCost(playerTeam).toFixed(2):'0';
  var inc=typeof incomeRate!=='undefined' && playerTeam?incomeRate(playerTeam).toFixed(2):'0';
  var terr=player? (typeof zoneTerrain!=='undefined'?zoneTerrain(zoneIdxAt(player.group.position.x, player.group.position.z)):'?'):'?';
  el.innerHTML='Team: '+(playerTeam||'?')+' | Gold: '+(EC[playerTeam]?Math.floor(EC[playerTeam].gold):0)+' | Army: '+teamAliveCount(playerTeam)+' | Zones: '+(oc[playerTeam]||0)
    +'<br>Income: '+inc+'/s | Upkeep: '+up+'/s | Net: '+(inc-up).toFixed(2)+'/s | Terrain: '+terr
    +'<br>Doctrine: '+(DOCTRINE?Math.round(DOCTRINE.bg*100)+'/'+Math.round(DOCTRINE.def*100)+'/'+Math.round((1-DOCTRINE.bg-DOCTRINE.def)*100):'?')
    +' | Autobuy: '+(AUTOBUY?AUTOBUY.mode+' '+(AUTOBUY.on?'ON':'OFF'):'?')+' | AFK: '+(afkMode?'ON '+brainIntent:'OFF')
    +'<br>Brain: '+JSON.stringify(window.__brainDbg||{})+'<br>LastDecision: '+JSON.stringify(window.__lastBrainDecision||{})
    +'<br>LastBattle: '+JSON.stringify(typeof lastBattle!=='undefined'?lastBattle:{});
}
window.addEventListener('keydown', function(ev){
  if(ev.code==='F10' && !ev.repeat){
    ev.preventDefault();
    toggleDebug();
  }
});

/* ---------------- v9: AUTO-BUY — now with reserve modes ---------------- */
function autobuyKey(){
  var defs=RECRUIT_DEFS[playerTeam];
  if(!AUTOBUY.key || !defs[AUTOBUY.key]) AUTOBUY.key=Object.keys(defs)[0];
  return AUTOBUY.key;
}
function autobuyReservePct(){
  switch(AUTOBUY.mode){
    case 'conservative': return 0.30;
    case 'aggressive': return 0.05;
    case 'balanced': default: return 0.15;
  }
}
function updAutobuyUI(){
  var b=$('btn-autobuy'); if(!b) return;
  if(!AUTOBUY.on){
    b.textContent='🤖 Auto-buy: OFF';
    b.className='';
  } else {
    var label={conservative:'Conservative', balanced:'Balanced', aggressive:'Aggressive'}[AUTOBUY.mode]||'Balanced';
    b.textContent='🤖 Auto-buy: '+label;
    b.className='primary';
  }
  var selM=$('autobuy-mode');
  if(selM) selM.value=AUTOBUY.mode;
}
function autobuyTick(){
  if(!AUTOBUY.on || state!==ST.PLAY || !player || player.dead) return;
  var defs=RECRUIT_DEFS[playerTeam];
  var key=autobuyKey(), d=defs[key];
  if(!d) return;
  var cost=(typeof musterCost==='function')?musterCost(playerTeam,key):d.cost;
  var reserve=autobuyReservePct();
  var gold=EC[playerTeam].gold;
  var minKeep=0;
  // keep % of treasury as reserve, scaled by income
  if(typeof incomeRate!=='undefined'){
    var inc=incomeRate(playerTeam);
    minKeep=Math.max(50, inc* (AUTOBUY.mode==='conservative'?18: AUTOBUY.mode==='aggressive'?4:9));
  }
  var effective=gold*(1-reserve);
  if(effective < cost) return;
  if(gold - cost < minKeep && AUTOBUY.mode!=='aggressive') return;
  if(EC[playerTeam].gold>=cost){
    EC[playerTeam].gold-=cost;
    doMuster(playerTeam, key, false);
    killFeedMsg('Auto-buy', d.name+' mustered — '+Math.floor(EC[playerTeam].gold)+'g left ('+AUTOBUY.mode+')', '#e9c458');
    if(recruitOpen) buildRecruitList();
  }
}
$('btn-autobuy').addEventListener('click', function(){
  Snd.click();
  AUTOBUY.on=!AUTOBUY.on;
  if(AUTOBUY.on && !AUTOBUY.mode) AUTOBUY.mode='balanced';
  autobuyKey();
  updAutobuyUI();
  if(AUTOBUY.on){
    killFeedMsg('Auto-buy', AUTOBUY.mode.toUpperCase()+' — buys '+RECRUIT_DEFS[playerTeam][AUTOBUY.key].name+' (keeps '+Math.round(autobuyReservePct()*100)+'% reserve)', '#e9c458');
  } else {
    killFeedMsg('Auto-buy', 'OFF', '#b9a06a');
  }
});
$('autobuy-sel').addEventListener('change', function(){
  AUTOBUY.key=this.value;
  if(AUTOBUY.on) killFeedMsg('Auto-buy', 'now buying '+RECRUIT_DEFS[playerTeam][AUTOBUY.key].name, '#e9c458');
});
var _autobuyModeSel=$('autobuy-mode');
if(_autobuyModeSel){
  _autobuyModeSel.addEventListener('change', function(){
    if(this.value==='off'){
      AUTOBUY.on=false;
    } else {
      AUTOBUY.mode=this.value;
      AUTOBUY.on=true;
    }
    updAutobuyUI();
    killFeedMsg('Auto-buy', AUTOBUY.on?(AUTOBUY.mode.toUpperCase()+' mode'):'OFF', AUTOBUY.on?'#e9c458':'#b9a06a');
  });
}

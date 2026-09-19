/* ---------------- v9: AUTO-BUY ---------------- */
function autobuyKey(){
  var defs=RECRUIT_DEFS[playerTeam];
  if(!AUTOBUY.key || !defs[AUTOBUY.key]) AUTOBUY.key=Object.keys(defs)[0];
  return AUTOBUY.key;
}
function updAutobuyUI(){
  var b=$('btn-autobuy'); if(!b) return;
  b.textContent=AUTOBUY.on?'🤖 Auto-buy: ON':'🤖 Auto-buy: OFF';
  b.className=AUTOBUY.on?'primary':'';
}
function autobuyTick(){
  if(!AUTOBUY.on || state!==ST.PLAY || !player || player.dead) return;
  var defs=RECRUIT_DEFS[playerTeam];
  var key=autobuyKey(), d=defs[key];
  if(!d) return;
  if(EC[playerTeam].gold>=d.cost){
    EC[playerTeam].gold-=d.cost;
    doMuster(playerTeam, key, false);
    killFeedMsg('Auto-buy', d.name+' mustered — '+Math.floor(EC[playerTeam].gold)+'g left', '#e9c458');
    if(recruitOpen) buildRecruitList();
  }
}
$('btn-autobuy').addEventListener('click', function(){
  Snd.click();
  AUTOBUY.on=!AUTOBUY.on;
  autobuyKey();
  updAutobuyUI();
  killFeedMsg('Auto-buy', AUTOBUY.on?('ON — buys '+RECRUIT_DEFS[playerTeam][AUTOBUY.key].name+' whenever gold allows'):'OFF', AUTOBUY.on?'#e9c458':'#b9a06a');
});
$('autobuy-sel').addEventListener('change', function(){
  AUTOBUY.key=this.value;
  if(AUTOBUY.on) killFeedMsg('Auto-buy', 'now buying '+RECRUIT_DEFS[playerTeam][AUTOBUY.key].name, '#e9c458');
});

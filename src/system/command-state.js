/* ---------------- workers, foremen & the command system (v6, doctrine v8) ---------------- */
var curOrder=null;
var SCOPES=[1,0.75,0.5,0.25,0.1,0.05];
var DOCTRINE={bg:0.05, def:0.40};   /* v8.3: user-tunable in Settings; defaults 5% guard / 40% defend / 55% attack */
var settingsOpen=false;
/* ---- v9/v10: auto-buy + AFK AI brain + royal steed ---- */
var AUTOBUY={on:false, key:null};
var afkMode=false, brainT=0, brainCmdT=0, brainGoal=null, autobuyT=0;
var brainIntent='IDLE', brainPath=null, brainPathGoal=null, brainPathI=0, brainPathT=0;
var brainStuck=0, brainSteerT=0, brainSteerOff=0, brainLastPos=null;
var kingHorse=null;
function toggleRide(v){
  if(!player||player.dead||state!==ST.PLAY) return player&&player.riding?1:0;
  var want=(v===undefined)?!player.riding:!!v;
  if(want===!!player.riding) return want?1:0;
  if(want){
    if(!kingHorse) kingHorse=makeHorse();
    kingHorse.visible=true;
    if(!kingHorse.parent) scene.add(kingHorse);
    player.riding=true;
    showHint('You mount your warhorse (H to dismount · speed ×2)', 1.8);
  } else {
    if(kingHorse) kingHorse.visible=false;
    player.riding=false;
    showHint('You dismount', 1.2);
  }
  return want?1:0;
}
var cmdScopeIdx=0;
var pendingAlerts=[];
function cycleScope(){
  cmdScopeIdx=(cmdScopeIdx+1)%SCOPES.length;
  killFeedMsg('Command', 'Scope: '+Math.round(SCOPES[cmdScopeIdx]*100)+'% of army', '#8ab8e0');
}

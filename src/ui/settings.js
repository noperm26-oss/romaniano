/* ---------------- v8.3 settings: doctrine % + scope steps ---------------- */
var overlaySettings=null;
function applyDoctrineCfg(bg, def, scopes){
  bg=Number.isFinite(bg)?bg:0.05;def=Number.isFinite(def)?def:0.4;
  DOCTRINE.bg=clamp(bg,0,1);
  DOCTRINE.def=clamp(def,0,1-DOCTRINE.bg);
  if(Array.isArray(scopes))scopes=Array.from(new Set(scopes.filter(Number.isFinite).map(function(v){return clamp(v,0.01,1);})));
  if(Array.isArray(scopes)&&scopes.length){
    SCOPES.length=0;
    scopes.forEach(function(v){ SCOPES.push(clamp(v,0.01,1)); });
    SCOPES.sort(function(a,b){ return b-a; });
    if(cmdScopeIdx>=SCOPES.length) cmdScopeIdx=0;
  }
  try{ localStorage.setItem('aow_doctrine', JSON.stringify({bg:DOCTRINE.bg, def:DOCTRINE.def, scopes:SCOPES.slice()})); }catch(e){}
  return {bg:DOCTRINE.bg, def:DOCTRINE.def, atk:+(1-DOCTRINE.bg-DOCTRINE.def).toFixed(3), scopes:SCOPES.slice()};
}
function loadDoctrineCfg(){
  try{
    var s=JSON.parse(localStorage.getItem('aow_doctrine')||'null');
    if(s && isFinite(s.bg)) applyDoctrineCfg(s.bg, s.def, s.scopes);
  }catch(e){}
}
function updSettingsLabels(){
  var bg=+$('set-bg').value, def=+$('set-def').value;
  $('set-bg-v').textContent=bg+'%';
  $('set-def-v').textContent=def+'%';
  $('set-atk-v').textContent=Math.max(0,100-bg-def)+'%';
}
function syncSettingsUI(){
  $('set-bg').value=Math.round(DOCTRINE.bg*100);
  $('set-def').value=Math.round(DOCTRINE.def*100);
  $('set-scopes').value=SCOPES.map(function(s){ return Math.round(s*100); }).join(', ');
  updSettingsLabels();
}
function toggleSettings(open){
  if(!overlaySettings) overlaySettings=$('settings');
  settingsOpen=(open===undefined)?!settingsOpen:!!open;
  if(settingsOpen){
    resetInput();
    if(state===ST.PAUSE) hide(overlayPause);
    else if(state===ST.PLAY && document.pointerLockElement) document.exitPointerLock();
    syncSettingsUI();
    show(overlaySettings);
  } else {
    hide(overlaySettings);
    if(state===ST.PLAY) tryLock();
    else if(state===ST.PAUSE) show(overlayPause);
  }
}
$('set-bg').addEventListener('input', updSettingsLabels);
$('set-def').addEventListener('input', updSettingsLabels);
$('btn-set-apply').addEventListener('click', function(){
  Snd.click();
  var bg=clamp(+$('set-bg').value||0,0,100), def=clamp(+$('set-def').value||0,0,100);
  if(bg+def>100) def=100-bg;
  var atk=100-bg-def;
  var arr=[], seen={};
  $('set-scopes').value.split(',').forEach(function(s){
    var v=Math.round(parseFloat(s));
    if(isFinite(v)&&v>=1&&v<=100&&!seen[v]){ seen[v]=1; arr.push(v); }
  });
  arr.sort(function(a,b){ return b-a; }); arr=arr.slice(0,8);
  if(!arr.length) arr=[100,75,50,25,10,5];
  applyDoctrineCfg(bg/100, def/100, arr.map(function(v){ return v/100; }));
  killFeedMsg('Settings', 'Doctrine: '+bg+'% guard / '+def+'% defend / '+atk+'% attack · scope steps: '+arr.join(', ')+'%', '#8ab8e0');
  toggleSettings(false);
});
$('btn-set-defaults').addEventListener('click', function(){
  Snd.click();
  applyDoctrineCfg(0.05, 0.40, [1,0.75,0.5,0.25,0.1,0.05]);
  syncSettingsUI();
});
$('btn-set-close').addEventListener('click', function(){ Snd.click(); toggleSettings(false); });
$('btn-settings').addEventListener('click', function(){ Snd.click(); toggleSettings(true); });
$('btn-warmap-close').addEventListener('click', function(){ Snd.click(); toggleWarmap(); });
$('warmap-canvas').addEventListener('click', marchClick);

/* ---------------- v8.3 settings: doctrine % + scope steps + live counts ---------------- */
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
function armySizeNow(){
  var n=0;
  if(typeof entities!=='undefined'){
    for(var i=0;i<entities.length;i++){
      var e=entities[i];
      if(!e.dead && !e.civ && !e.isPlayer && e.team===playerTeam) n++;
    }
  }
  return n;
}
function updSettingsLabels(){
  var bg=+$('set-bg').value, def=+$('set-def').value;
  if(bg+def>100){ def=100-bg; $('set-def').value=def; }
  var atk=Math.max(0,100-bg-def);
  $('set-bg-v').textContent=bg+'%';
  $('set-def-v').textContent=def+'%';
  $('set-atk-v').textContent=atk+'%';
  var total=armySizeNow();
  var bgN=Math.round(total*bg/100), defN=Math.round(total*def/100), atkN=Math.max(0,total-bgN-defN);
  var elBgN=$('set-bg-n'), elDefN=$('set-def-n'), elAtkN=$('set-atk-n'), elTot=$('set-army-size');
  if(elBgN) elBgN.textContent=bgN;
  if(elDefN) elDefN.textContent=defN;
  if(elAtkN) elAtkN.textContent=atkN;
  if(elTot) elTot.textContent=total;
}
function renderFacDoctrines(){
  var row=$('set-fac-doctrines');
  if(!row||!playerTeam) return;
  var c=(typeof factionCfg!=='undefined')?factionCfg(playerTeam):null;
  if(!c) return;
  row.innerHTML='';
  c.doctrines.forEach(function(d){
    var b=document.createElement('button');
    b.textContent=d.name;
    b.title=d.bg+'% guard / '+d.def+'% defend — '+d.desc;
    if(typeof FAC_DOCTRINE!=='undefined' && FAC_DOCTRINE[playerTeam]===d.id) b.className='primary';
    b.addEventListener('click', function(){
      Snd.click();
      setFactionDoctrine(playerTeam, d.id);
      renderFacDoctrines();
      syncSettingsUI();
    });
    row.appendChild(b);
  });
}
function syncSettingsUI(){
  $('set-bg').value=Math.round(DOCTRINE.bg*100);
  $('set-def').value=Math.round(DOCTRINE.def*100);
  $('set-scopes').value=SCOPES.map(function(s){ return Math.round(s*100); }).join(', ');
  updSettingsLabels();
  renderFacDoctrines();
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
  var total=armySizeNow();
  killFeedMsg('Settings', 'Doctrine: '+bg+'% ('+Math.round(total*bg/100)+') guard / '+def+'% ('+Math.round(total*def/100)+') defend / '+atk+'% ('+Math.round(total*atk/100)+') attack · scope: '+arr.join(', ')+'%', '#8ab8e0');
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
$('warmap-canvas').addEventListener('mousemove', warmapMouseMove);
// presets
function setPreset(bg,def){
  $('set-bg').value=bg; $('set-def').value=def;
  updSettingsLabels();
}
var bDef=$('btn-preset-def'), bBal=$('btn-preset-bal'), bOff=$('btn-preset-off'), bEm=$('btn-preset-em');
if(bDef) bDef.addEventListener('click', function(){ Snd.click(); setPreset(10,65); });
if(bBal) bBal.addEventListener('click', function(){ Snd.click(); setPreset(5,40); });
if(bOff) bOff.addEventListener('click', function(){ Snd.click(); setPreset(5,20); });
if(bEm) bEm.addEventListener('click', function(){ Snd.click(); setPreset(15,20); });

// battle report close
var brClose=$('btn-br-close');
if(brClose) brClose.addEventListener('click', function(){
  var el=$('battle-report'); if(el) el.classList.add('hidden');
});

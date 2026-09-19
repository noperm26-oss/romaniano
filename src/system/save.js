/* ---------------- save / persistence + recovery ---------------- */
var SAVE_KEY='aow_save_v12';
function saveCampaign(){
  try{
    if(!playerTeam || !zones.length) return false;
    var data={
      v:12,
      team:playerTeam,
      role:player?player.roleKey||selectedRole:null,
      gold:EC[playerTeam]?EC[playerTeam].gold:0,
      zones:zones.map(function(z){ return z.owner; }),
      inf:zones.map(function(z){ return z.inf; }),
      px:player?player.group.position.x:0,
      pz:player?player.group.position.z:0,
      kills:kills,
      score:score,
      doctrine:{bg:DOCTRINE.bg, def:DOCTRINE.def, scopes:SCOPES.slice()},
      facDoc:(typeof FAC_DOCTRINE!=='undefined'&&FAC_DOCTRINE[playerTeam])?FAC_DOCTRINE[playerTeam]:null,
      autobuy:{on:AUTOBUY.on, key:AUTOBUY.key, mode:AUTOBUY.mode},
      afk:afkMode,
      time:Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  }catch(e){ console.warn('save failed', e); return false; }
}
function loadCampaign(){
  try{
    var raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    var data=JSON.parse(raw);
    if(!data || data.v<10) return null;
    return data;
  }catch(e){ return null; }
}
function hasSave(){
  try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; }
}
function clearSave(){
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
}
function tryRestoreSave(){
  var data=loadCampaign();
  if(!data) return false;
  try{
    // validate zones length
    if(!data.zones || data.zones.length!==ZN*ZN) return false;
    // restore economy & zones
    FAC_KEYS.forEach(function(k){ if(EC[k]) EC[k].gold=data.gold && data.team===k ? data.gold : EC[k].gold; });
    for(var i=0;i<zones.length;i++){
      zones[i].owner=data.zones[i];
      if(data.inf && data.inf[i]) zones[i].inf=data.inf[i];
    }
    if(data.doctrine) applyDoctrineCfg(data.doctrine.bg, data.doctrine.def, data.doctrine.scopes);
    if(data.facDoc && typeof FAC_DOCTRINE!=='undefined') FAC_DOCTRINE[data.team]=data.facDoc;
    /* doctrine survives toMenu()/resetFactionSystems via the pending state */
    window._pendingSaveDoc=(data.team&&data.facDoc)?{team:data.team, doc:data.facDoc}:null;
    if(data.autobuy){
      AUTOBUY.on=!!data.autobuy.on;
      AUTOBUY.key=data.autobuy.key;
      AUTOBUY.mode=data.autobuy.mode||'balanced';
      updAutobuyUI();
    }
    if(data.kills) kills=data.kills;
    if(data.score) score=data.score;
    // player position will be set after spawn
    window._pendingSavePos={x:data.px, z:data.pz, team:data.team, role:data.role};
    return true;
  }catch(e){
    console.warn('restore failed', e);
    clearSave();
    return false;
  }
}
var saveT=0;
function autoSaveTick(dt){
  saveT-=dt;
  if(saveT<=0){
    saveT=12;
    if(state===ST.PLAY && playerTeam) saveCampaign();
  }
}
// expose for debug menu
window.__saveDbg={save:saveCampaign, load:loadCampaign, clear:clearSave, has:hasSave};

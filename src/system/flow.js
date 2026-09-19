/* ---------------- flow ---------------- */
var overlayMenu=$('menu'), overlayFaction=$('faction'), overlayRoles=$('roles'),
    overlayPause=$('pause'), overlayRedeploy=$('redeploy'), overlayResult=$('result'), hud=$('hud');
overlayRecruit=$('recruit'); overlayWarmap=$('warmap');

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

function toMenu(){
  state=ST.MENU;
  playerTeam=null;
  clearEntities();
  resetInput();
  afkMode=false; AUTOBUY.on=false; brainGoal=null; brainPath=null;
  if(kingHorse) {scene.remove(kingHorse);kingHorse=null;}
  settingsOpen=false; hide($('settings'));
  hide(overlayFaction); hide(overlayRoles); hide(overlayPause); hide(overlayRedeploy); hide(overlayResult);
  hide(overlayRecruit); hide(overlayWarmap); hide(hud);
  recruitOpen=false; warmapOpen=false;
  show(overlayMenu);
  if(document.pointerLockElement) document.exitPointerLock();
}
function toFaction(){
  state=ST.FACTION;
  hide(overlayMenu); hide(overlayRoles);
  show(overlayFaction);
  if(document.pointerLockElement) document.exitPointerLock();
}
function toRoles(){
  state=ST.ROLES;
  curFaction=selectedFaction;
  hide(overlayMenu); hide(overlayFaction);
  show(overlayRoles);
  selectedRole=null;
  $('roles-title').innerHTML=FACS[selectedFaction].name+' <span>— choose who you are · your kingdom awaits · vs '+FACS[selectedFaction].loreEnemy+'</span>';
  $('btn-spawn').disabled=true;
  $('btn-spawn').textContent='Choose your soldier';
  buildRoleCards(false);
  if(document.pointerLockElement) document.exitPointerLock();
}
function beginCampaign(){
  clearEntities();
  resetInput();afkMode=false;AUTOBUY.on=false;brainGoal=null;brainPath=null;
  if(kingHorse){scene.remove(kingHorse);kingHorse=null;}
  settingsOpen=false;hide($('settings'));
  playerTeam=selectedFaction;
  curFaction=selectedFaction;
  resetEconomy();
  resetZones();
  kills=0; score=0;
  var F=FACS[playerTeam];
  hudEls.roleName.textContent=F.classes[selectedRole].name+' — '+F.classes[selectedRole].en;
  hudEls.roleIcon.innerHTML=ICONS[F.classes[selectedRole].icon];
  hudEls.fac.textContent=F.name+' — rule the world';
  hide(overlayMenu); hide(overlayFaction); hide(overlayRoles); hide(overlayRedeploy); hide(overlayResult);
  hide(overlayRecruit); hide(overlayWarmap); hide(overlayPause);
  recruitOpen=false; warmapOpen=false;
  show(hud);
  /* garrisons for every faction */
  FAC_KEYS.forEach(function(f){
    var order=Object.keys(RECRUIT_DEFS[f]).filter(function(k){return k!=='champion';});
    var T=TOWNS[f];
    var front=TOWNS_and_front(f);
    for(var i=0;i<8;i++){
      var kind=order[i%order.length];
      var spot=findFreeSpot(T.x+rand(-40,40), T.z+front*rand(75,115), 0.5);
      spawnCharacter(kind, f, spot.x, spot.z);
    }
    /* early war bands march for the great field */
    for(var j=0;j<9;j++){
      var kind2=order[randi(0,order.length-1)];
      var e=spawnCharacter(kind2, f, T.x+rand(-40,40), T.z+front*rand(75,115));
      e.goal={x:rand(-260,260), z:rand(-260,260)};
    }
  });
  /* civilians & workers bring the homelands and villages to life */
  FAC_KEYS.forEach(function(f){
    var td=townData[f];
    for(var v=0;v<3;v++){
      var sp=findFreeSpot(td.hall.x+rand(-34,34), td.hall.z+rand(-16,40), 0.4);
      spawnVillager(sp.x, sp.z);
    }
  });
  spawnWorldWorkers();
  relics.forEach(function(R){ R.taken=false; R.grp.visible=true; });
  createPlayer(selectedRole);
  state=ST.PLAY;
  gameTime=0; hitVignette=0; marchCooldown=0;
  captureT=2; incomeT=1; raidT=8; aiBuyT=4;
  tryLock();
  Snd.setFactionMusic(F.drone, F.mode);
  Snd.startMusic();
  Snd.startDrums();
  showBanner('The Campaign Begins', F.name+' musters — hold territory, grow rich, conquer', 3);
  showHint('B = muster troops (spend gold) • T = campaign map & march • own '+WIN_ZONES+' zones to rule the world', 8);
}
function playerDied(){
  var p=player;
  if(p.riding) toggleRide(false);   /* v10: the steed flees when the king falls */
  deathPos.copy(p.group.position);
  state=ST.REDEPLOY;
  if(document.pointerLockElement) document.exitPointerLock();
  setTimeout(function(){
    if(state===ST.REDEPLOY){
      $('rd-role').textContent=FACS[playerTeam].classes[selectedRole]?FACS[playerTeam].classes[selectedRole].name:'';
      var ransom=Math.min(100, Math.floor(EC[playerTeam].gold));
      EC[playerTeam].gold-=ransom;
      $('rd-cost').textContent=ransom;
      $('rd-tickets').textContent=Math.floor(EC[playerTeam].gold);
      show(overlayRedeploy);
      buildRoleCards(true);
      $('btn-rd-spawn').disabled=true;
      $('btn-rd-spawn').textContent='Choose your soldier';
    }
  }, 1500);
}
function deployAgain(){
  hide(overlayRedeploy);
  for(var i=entities.length-1;i>=0;i--){
    var e=entities[i];
    if(e.isPlayer){ scene.remove(e.group); scene.remove(e.bar.grp); entities.splice(i,1); }
  }
  createPlayer(selectedRole);
  hudEls.roleName.textContent=FACS[playerTeam].classes[selectedRole].name+' — '+FACS[playerTeam].classes[selectedRole].en;
  hudEls.roleIcon.innerHTML=ICONS[FACS[playerTeam].classes[selectedRole].icon];
  state=ST.PLAY;
  tryLock();
}
function showResult(victory, winnerTeam){
  if(state===ST.RESULT) return;
  state=ST.RESULT;
  if(document.pointerLockElement) document.exitPointerLock();
  hide(overlayRecruit); hide(overlayWarmap); hide(overlayRedeploy);
  recruitOpen=false; warmapOpen=false;
  var oc=ownedCounts();
  $('res-title').textContent=victory?'DOMINION':'DEFEAT';
  $('res-title').style.color=victory?'#8a6a2f':'#6e1414';
  if(victory){
    $('res-sub').textContent=FACS[playerTeam].name+' rules the known world! All bow to your banner.';
  } else if(winnerTeam){
    $('res-sub').textContent=FACS[winnerTeam].name+' has conquered the world. Your kingdom is no more.';
  } else {
    $('res-sub').textContent='Your kingdom has been wiped from the map.';
  }
  $('res-zones').textContent=playerTeam?oc[playerTeam]:0;
  $('res-kills').textContent=kills;
  $('res-score').textContent=score;
  $('res-gold').textContent=playerTeam?Math.floor(EC[playerTeam].gold):0;
  show(overlayResult);
  if(victory) Snd.victory(); else Snd.defeat();
}
function newCampaign(){
  hide(overlayResult);
  toFaction();
}
function pauseGame(){
  if(state!==ST.PLAY) return;
  state=ST.PAUSE;
  resetInput();
  show(overlayPause);
  if(document.pointerLockElement) document.exitPointerLock();
}
function resumeGame(){
  hide(overlayPause);
  state=ST.PLAY;
  tryLock();
}

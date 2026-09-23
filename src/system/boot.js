/* boot: raise the world, then open the menu.
   The player path yields every few dozen milliseconds so a slow Mac, a
   Windows laptop or this machine can paint the menu and keep the tab
   responsive. The land, the counts and the draw are unchanged — the work
   is only sliced. ?test=1 stays one synchronous pass so the browser tests
   still see a finished world at page load. */
validateCharacters();
resetEconomy();
resetZones();
if(typeof resetBattleTracking!=='undefined') resetBattleTracking();
var WORLD_READY=false, BOOT_ACC={}, BOOT_SLICE_MAX=0, BOOT_SLICES=[], _townI=0, TOWN_BUDGET=0, TOWN_TEND=0, _townHold=null;
function closeHeldTown(){
  if(!_townHold) return;
  var h=_townHold; _townHold=null;
  townData[h.f]=h.td;
  siteEnd();
  registerTownLore(h.f);
}
function bootStep(name, fn){
  var t0=performance.now();
  var more=fn();
  var dt=performance.now()-t0;
  BOOT_ACC[name]=(BOOT_ACC[name]||0)+dt;
  BOOT_TIMES[name]=Math.round(BOOT_ACC[name]);
  if(dt>BOOT_SLICE_MAX) BOOT_SLICE_MAX=dt;
  if(dt>=80) BOOT_SLICES.push(name+':'+Math.round(dt));
  return !!more;
}
function bootTowns(budget){
  TOWN_BUDGET=budget||0;
  TOWN_TEND=budget?performance.now()+budget:0;
  var start=_townI;
  for(;;){
    if(typeof _roma!=='undefined' && _roma){
      var tR=performance.now(), moreR=townRomaria();
      if(performance.now()-tR>=80) BOOT_SLICES.push('town-nippon:'+Math.round(performance.now()-tR));
      if(moreR) return true;
      closeHeldTown();
    }
    if(_townI>=FAC_KEYS.length){ _townI=0; return false; }
    if(budget && _townI>start && performance.now()>=TOWN_TEND) return true;
    var _tf=FAC_KEYS[_townI], _tt=performance.now();
    buildTown(_tf);
    _townI++;
    if(performance.now()-_tt>=80) BOOT_SLICES.push('town-'+_tf+':'+Math.round(performance.now()-_tt));
    if(typeof _roma!=='undefined' && _roma && budget && performance.now()>=TOWN_TEND) return true;
  }
}
function setBootStatus(label, done, total){
  var pct=Math.max(0, Math.min(99, Math.round(done/total*100)));
  var el=document.getElementById('load-status');
  if(el) el.textContent=label+'… '+pct+'%'+(typeof LOAD_AREA_STEPS!=='undefined'?' · '+LOAD_AREA_STEPS[loadAreaIndex].name:'');
  var bar=document.getElementById('load-meter-i');
  if(bar) bar.style.width=pct+'%';
  var meter=document.getElementById('load-meter');
  if(meter) meter.setAttribute('aria-valuenow', String(pct));
}
function finishBoot(){
  cullTick();
  loadDoctrineCfg();
  if(typeof tryRestoreSave!=='undefined'){
    try{ tryRestoreSave(); }catch(e){}
  }
  spawnWildlife();
  spawnChests();
  WORLD_READY=true;
  if(window.__game) window.__game.ready=true;
  var btn=document.getElementById('btn-begin');
  if(btn){ btn.disabled=false; btn.textContent='Take the Throne'; }
  var st=document.getElementById('load-status');
  if(st) st.textContent='';
  var meter=document.getElementById('load-meter');
  if(meter) meter.style.display='none';
  toMenu();
  requestAnimationFrame(frame);
}
function bootQueue(budget){
  return [
    ['terrain', function(){ return buildGround(budget); }, 'Laying the ground'],
    ['scenery', function(){ return buildField(budget); }, 'Planting the forests'],
    ['towns', function(){ return bootTowns(budget); }, 'Raising the towns'],
    ['landmarks', function(){ return buildLandmarks(budget); }, 'Placing the named sites'],
    ['villages', function(){ return buildVillages(budget); }, 'Building the villages'],
    ['flags', function(){ buildFlags(); }, 'Raising the banners'],
    ['beacons', function(){ buildBeacons(); }, 'Lighting the beacons'],
    ['roads', function(){ return buildRoads(budget); }, 'Paving the roads'],
    ['districts', function(){ return buildDistricts(budget); }, 'Marking the farmsteads'],
    ['settlements', function(){ return buildSettlements(budget); }, 'Raising the hamlets'],
    ['prefabs', function(){ prefabFlush(); }, 'Furnishing the houses'],
    ['relics', function(){ placeRelics(); }, 'Hiding the relics'],
    ['kits', function(){ flushCellKits(); }, 'Finishing the roofs'],
    ['statics', function(){ snapshotStatics(); }, 'Opening the gates']
  ];
}
if(typeof manualSimulation!=='undefined' && manualSimulation){
  var syncSteps=bootQueue(0), si;
  for(si=0; si<syncSteps.length; si++){
    var guard=0;
    while(bootStep(syncSteps[si][0], syncSteps[si][1])){
      if(++guard>100000) throw Error('boot did not finish '+syncSteps[si][0]);
    }
  }
  finishBoot();
} else {
  var yieldSteps=bootQueue(48), yi=0, ySub=0;
  var btn0=document.getElementById('btn-begin');
  if(btn0){ btn0.disabled=true; btn0.textContent='Raising the land…'; }
  setBootStatus('The kingdoms are waking', 0, yieldSteps.length);
  function bootPump(){
    if(yi>=yieldSteps.length){ finishBoot(); return; }
    setTimeout(function(){
      var step=yieldSteps[yi], more=false;
      try{ more=bootStep(step[0], step[1]); }
      catch(err){
        console.error(err);
        var el=document.getElementById('load-status');
        if(el) el.textContent='The land could not be raised. Reload the page.';
        return;
      }
      if(more) ySub++; else { yi++; ySub=0; }
      if(yi<yieldSteps.length) setBootStatus(yieldSteps[Math.min(yi, yieldSteps.length-1)][2], yi+Math.min(0.85, ySub*0.03), yieldSteps.length);
      bootPump();
    }, 0);
  }
  setTimeout(bootPump, 0);
}

/* ============================================================
   load-area.js — how much of the 6,000 × 6,000 map is raised
   ------------------------------------------------------------
   Lowest (the default) builds each kingdom and the land just
   past the fog, so a weak machine can take the throne. Highest
   is the entire map. What does get built is the same geometry,
   the same colours and the same places — only the reach changes.
   ?test=1 and ?load=4 always raise the entire map. A smaller
   choice, or the entire map, reloads so memory actually drops
   and the full world is built in its original order. A larger
   step in between streams the same builders in short slices.
   ============================================================ */
var LOAD_AREA_STEPS=[
  {name:'Homeland', r:780, hint:'Each kingdom and the ground you can see. Fastest on a weak machine.'},
  {name:'County', r:1400, hint:'The countryside just beyond the towns. Same buildings, a wider reach.'},
  {name:'Province', r:2200, hint:'A wide reach of the same map.'},
  {name:'Realm', r:3400, hint:'Most of the world, still short of the rim.'},
  {name:'Entire map', r:1e9, hint:'Every village, hamlet and forest — the full 6,000 × 6,000. Choosing this reloads so the map matches the whole world.'}
];
var loadAreaIndex=0, LOAD_CENTERS=[], loadAreaDirty=false, _areaPhase=0, _areaKids=-1;
function loadAreaRead(){
  try{
    var q=new URLSearchParams(location.search).get('load');
    if(q==='all'||q==='4'){ loadAreaIndex=LOAD_AREA_STEPS.length-1; return; }
    if(q!==null && q!==''){
      var qn=parseInt(q,10);
      if(qn>=0 && qn<LOAD_AREA_STEPS.length){ loadAreaIndex=qn; return; }
    }
    var n=parseInt(localStorage.getItem('aow_load_area'),10);
    if(n>=0 && n<LOAD_AREA_STEPS.length) loadAreaIndex=n;
  }catch(e){}
}
function loadAreaWrite(){
  try{ localStorage.setItem('aow_load_area', String(loadAreaIndex)); }catch(e){}
}
function loadAreaFull(){
  return (typeof manualSimulation!=='undefined' && manualSimulation) || LOAD_AREA_STEPS[loadAreaIndex].r>8000;
}
function loadAreaRadius(){ return loadAreaFull()?1e9:LOAD_AREA_STEPS[loadAreaIndex].r; }
function inLoadArea(x,z){
  if(loadAreaFull()) return true;
  var r2=LOAD_AREA_STEPS[loadAreaIndex].r*LOAD_AREA_STEPS[loadAreaIndex].r, i, T, dx, dz;
  for(i=0;i<FAC_KEYS_T.length;i++){
    T=TOWNS[FAC_KEYS_T[i]]; dx=x-T.x; dz=z-T.z;
    if(dx*dx+dz*dz<=r2) return true;
  }
  for(i=0;i<LOAD_CENTERS.length;i++){
    dx=x-LOAD_CENTERS[i][0]; dz=z-LOAD_CENTERS[i][1];
    if(dx*dx+dz*dz<=r2) return true;
  }
  return false;
}
function loadAreaHint(n){
  var s=LOAD_AREA_STEPS[n];
  var extra='';
  if(n<loadAreaIndex) extra=' Lowering this reloads, so a weak machine can drop what was already raised.';
  else if(n===LOAD_AREA_STEPS.length-1 && n!==loadAreaIndex) extra='';
  else if(n>loadAreaIndex) extra=' Raising this keeps the campaign and fills in the same places.';
  return s.hint+extra;
}
function paintLoadArea(n){
  n=clamp(Math.round(n),0,LOAD_AREA_STEPS.length-1);
  var name=LOAD_AREA_STEPS[n].name, hint=loadAreaHint(n);
  var v=$('menu-load-v'), h=$('menu-load-h'), sv=$('set-load-v'), sh=$('set-load-h');
  if(v) v.textContent=name;
  if(sv) sv.textContent=name;
  if(h) h.textContent=hint;
  if(sh) sh.textContent=hint;
}
function syncLoadAreaUI(){
  var a=$('menu-load'), b=$('set-load');
  if(a) a.value=String(loadAreaIndex);
  if(b) b.value=String(loadAreaIndex);
  paintLoadArea(loadAreaIndex);
}
function previewLoadArea(n){ paintLoadArea(n); }
function setLoadArea(n){
  n=clamp(Math.round(n),0,LOAD_AREA_STEPS.length-1);
  if(n===loadAreaIndex){ syncLoadAreaUI(); return; }
  var prev=loadAreaIndex;
  loadAreaIndex=n;
  loadAreaWrite();
  syncLoadAreaUI();
  if(typeof manualSimulation!=='undefined' && manualSimulation) return;
  if(n<prev || n===LOAD_AREA_STEPS.length-1){ location.reload(); return; }
  loadAreaDirty=true;
  _areaPhase=0;
}
function loadAreaCover(x,z){
  if(loadAreaFull()) return;
  var r=LOAD_AREA_STEPS[loadAreaIndex].r, lim=r-560, i, T, dx, dz, best=1e18;
  if(lim<180) lim=180;
  for(i=0;i<FAC_KEYS_T.length;i++){
    T=TOWNS[FAC_KEYS_T[i]]; dx=x-T.x; dz=z-T.z;
    if(dx*dx+dz*dz<best) best=dx*dx+dz*dz;
  }
  for(i=0;i<LOAD_CENTERS.length;i++){
    dx=x-LOAD_CENTERS[i][0]; dz=z-LOAD_CENTERS[i][1];
    if(dx*dx+dz*dz<best) best=dx*dx+dz*dz;
  }
  if(best>lim*lim){ LOAD_CENTERS.push([x,z]); loadAreaDirty=true; _areaPhase=0; }
}
/* after the throne is open, raise anything the current reach now includes — same builders, short slices */
function loadAreaWork(budget){
  var more=false;
  if(_areaPhase===0){ if(buildLandmarks(budget)) more=true; else _areaPhase=1; }
  if(!more && _areaPhase===1){ if(buildVillages(budget)) more=true; else _areaPhase=2; }
  if(!more && _areaPhase===2){ if(buildSettlements(budget)) more=true; else _areaPhase=3; }
  if(!more && _areaPhase===3){ if(typeof loadAreaScenery==='function' && loadAreaScenery(budget)) more=true; else _areaPhase=4; }
  if(prefabFlush(budget)) more=true;
  if(!more){
    if(typeof snapshotStatics==='function') snapshotStatics();
    _areaPhase=0;
  }
  return more;
}
function loadAreaTick(){
  if(typeof WORLD_READY==='undefined' || !WORLD_READY) return;
  if(typeof manualSimulation!=='undefined' && manualSimulation) return;
  if(!loadAreaFull() && typeof player!=='undefined' && player && player.group && state===ST.PLAY) loadAreaCover(player.group.position.x, player.group.position.z);
  if(!loadAreaDirty) return;
  if(loadAreaWork(12)) return;
  loadAreaDirty=false;
}
loadAreaRead();
syncLoadAreaUI();

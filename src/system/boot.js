
/* boot: build towns + reset world */
validateCharacters();
resetEconomy();
resetZones();
if(typeof resetBattleTracking!=='undefined') resetBattleTracking();
/* The world is built in steps between frames, so the splash screen can paint its progress and the tab never
   looks frozen. Every step runs exactly the same code in the same order as before; nothing is skipped. */
var BOOT_STEPS=[
  ['towns',      'Raising the six towns…',                function(){ FAC_KEYS.forEach(buildTown); }],
  ['landmarks',  'Placing castles, monasteries and ruins…', buildLandmarks],
  ['villages',   'Building the 48 villages…',            buildVillages],
  ['flags',      'Planting the capture flags…',          buildFlags],
  ['beacons',    'Lighting the signal beacons…',         buildBeacons],
  ['roads',      'Laying the roads and bridges…',        buildRoads],
  ['districts',  'Fencing the farm districts…',          buildDistricts],
  ['settlements','Settling the hamlets and farmsteads…', buildSettlements],
  ['prefabs',    'Stamping the countryside houses…',     prefabFlush],        /* countryside prefabs → one InstancedMesh per prefab per cell */
  ['relics',     'Hiding the relics…',                   placeRelics],
  ['kits',       'Merging the stonework…',               flushCellKits],
  ['statics',    'Preparing the horizon…',               snapshotStatics]
];
function bootStep(name,fn){ var t0=performance.now(); fn(); BOOT_TIMES[name]=Math.round(performance.now()-t0); }
function bootProgress(i,label){
  var f=$('loading-fill'), st=$('loading-step');
  if(f) f.style.width=Math.round(4+92*i/BOOT_STEPS.length)+'%';
  if(st && label) st.textContent=label;
}
/* GPU warm-up: render one throw-away frame from each capital while the splash is still up so the shader
   programs compile and the geometry uploads happen now, not on the player's first frame after spawning. */
function bootWarmGPU(){
  var t0=performance.now();
  try{
    var keys=Object.keys(TOWNS), px=camera.position.x, py=camera.position.y, pz=camera.position.z;
    for(var i=0;i<keys.length;i++){
      var T=TOWNS[keys[i]];
      camera.position.set(T.x+30, groundH(T.x+30,T.z+30)+12, T.z+30);
      camera.lookAt(T.x,groundH(T.x,T.z)+4,T.z);
      cullTick();
      renderFrame();
    }
    camera.position.set(px,py,pz);
  }catch(e){}
  BOOT_TIMES.warm=Math.round(performance.now()-t0);
}
function bootFinish(){
  cullTick();
  loadDoctrineCfg();
  // try restore save (optional persistence)
  if(typeof tryRestoreSave!=='undefined'){
    try{ tryRestoreSave(); }catch(e){}
  }
  spawnWildlife();
  spawnChests();
  toMenu();
  var ld=$('loading'); if(ld) ld.classList.add('hidden');
  BOOT_TIMES.total=Math.round(performance.now()-BOOT_T0);
  requestAnimationFrame(frame);
}
var BOOT_T0=performance.now();
/* deterministic test mode boots synchronously so the harness sees a finished world on page load */
if(manualSimulation){
  BOOT_STEPS.forEach(function(s){ bootStep(s[0],s[2]); });
  bootFinish();
} else {
  (function runStep(i){
    if(i>=BOOT_STEPS.length){ bootProgress(i,'Opening the gates…'); setTimeout(function(){ bootWarmGPU(); bootFinish(); },20); return; }
    bootProgress(i,BOOT_STEPS[i][1]);
    setTimeout(function(){ bootStep(BOOT_STEPS[i][0],BOOT_STEPS[i][2]); runStep(i+1); },16);
  })(0);
}

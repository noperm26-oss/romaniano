
/* boot: build towns + reset world */
validateCharacters();
resetEconomy();
resetZones();
if(typeof resetBattleTracking!=='undefined') resetBattleTracking();
function bootStep(name,fn){ var t0=performance.now(); fn(); BOOT_TIMES[name]=Math.round(performance.now()-t0); }
bootStep('towns', function(){ FAC_KEYS.forEach(buildTown); });
bootStep('landmarks', buildLandmarks);
bootStep('villages', buildVillages);
bootStep('flags', buildFlags);
bootStep('beacons', buildBeacons);
bootStep('roads', buildRoads);
bootStep('districts', buildDistricts);
bootStep('settlements', buildSettlements);
bootStep('prefabs', prefabFlush);        /* countryside prefabs → one InstancedMesh per prefab per cell */
bootStep('relics', placeRelics);
bootStep('kits', flushCellKits);
bootStep('statics', snapshotStatics);
cullTick();
loadDoctrineCfg();
// try restore save (optional persistence)
if(typeof tryRestoreSave!=='undefined'){
  try{ tryRestoreSave(); }catch(e){}
}
spawnWildlife();
spawnChests();
toMenu();
requestAnimationFrame(frame);

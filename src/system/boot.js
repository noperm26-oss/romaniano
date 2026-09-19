
/* boot: build towns + reset world */
validateCharacters();
resetEconomy();
resetZones();
if(typeof resetBattleTracking!=='undefined') resetBattleTracking();
FAC_KEYS.forEach(buildTown);
buildLandmarks();
buildVillages();
buildDistricts();
buildSettlements();
placeRelics();
snapshotStatics();
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

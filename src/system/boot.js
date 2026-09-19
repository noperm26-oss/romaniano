
/* boot: build towns + reset world */
validateCharacters();
resetEconomy();
resetZones();
FAC_KEYS.forEach(buildTown);
buildLandmarks();
buildVillages();
buildDistricts();
buildSettlements();
placeRelics();
snapshotStatics();
cullTick();
loadDoctrineCfg();   /* v8.3: must run AFTER DOCTRINE/SCOPES are initialized (end of script) */
spawnWildlife();
spawnChests();
toMenu();
requestAnimationFrame(frame);

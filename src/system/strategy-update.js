/* ---------------- raid alerts: defenders call nearby backup (v8) ---------------- */
function backupScan(){
  if(!playerTeam) return;
  pendingAlerts=pendingAlerts.filter(function(a){ return gameTime-a.t<240; });
  var hostileZones={};
  for(var i=0;i<entities.length;i++){
    var e=entities[i];
    if(e.dead||e.civ||e.team===playerTeam) continue;
    var zi=zoneIdxAt(e.group.position.x, e.group.position.z);
    if(zi>=0&&zi<zones.length&&zones[zi].owner===playerTeam) hostileZones[zi]=true;
  }
  var called=0;
  /* Moldova — Local Knowledge (L3): defenders hear raiders from further out */
  var watchR=(typeof playerTeam!=='undefined'&&playerTeam==='moldavia'&&typeof factionHasPassive!=='undefined'&&factionHasPassive('moldavia','local-knowledge'))?1120:900;
  for(var zi in hostileZones){
    zi=+zi;
    var c=zoneCenter(zi);
    var sent=0;
    for(var j=0;j<entities.length&&sent<4;j++){
      var d=entities[j];
      if(d.dead||d.role!=='defender'||d.responseGoal) continue;
      if(!d.post) continue;
      var dpz=zoneIdxAt(d.post.x, d.post.z);
      if(dpz===zi) continue;
      var dd=(d.group.position.x-c.x)*(d.group.position.x-c.x)+(d.group.position.z-c.z)*(d.group.position.z-c.z);
      if(dd<watchR*watchR){
        d.responseGoal={x:c.x+rand(-20,20), z:c.z+rand(-20,20)};
        sent++; called++;
      }
    }
    if(sent) killFeedMsg('Alert', 'Raiders in '+(villageNameAt(zi)||'the territory')+' — '+sent+' defenders respond', '#e0a020');
  }
}

/* ---------------- strategy ticks ---------------- */
function updateStrategy(dt){
  groupThink(dt);
  incomeT-=dt;
  if(incomeT<=0){ incomeT=1; incomeTick(); }
  captureT-=dt;
  if(captureT<=0){ captureT=1.5; captureTick(); }
  raidT-=dt;
  if(raidT<=0){ raidT=14; launchRaids(); }
  aiBuyT-=dt;
  if(aiBuyT<=0){ aiBuyT=3.5; aiBuyTick(); }
  backupT-=dt;
  if(backupT<=0){
    /* Moldova — Local Knowledge (L3): the border watch is faster */
    backupT=2*((typeof playerTeam!=='undefined'&&playerTeam==='moldavia'&&typeof factionHasPassive!=='undefined'&&factionHasPassive('moldavia','local-knowledge'))?0.7:1);
    backupScan();
  }
  autobuyT-=dt;
  if(autobuyT<=0){ autobuyT=1.2; autobuyTick(); }
  if(typeof kingDeathPenaltyT!=='undefined' && kingDeathPenaltyT>0) kingDeathPenaltyT-=dt;
  /* faction identity ticks: momentum decay, signature abilities, progression */
  if(typeof updateMomentum!=='undefined') updateMomentum(dt);
  if(typeof updateFactionAbilities!=='undefined') updateFactionAbilities(dt);
  if(typeof factionProgressionCheck!=='undefined') factionProgressionCheck();
  if(typeof aiAbilityTick!=='undefined') aiAbilityTick(dt);
  if(typeof updateBuildingBonuses!=='undefined') updateBuildingBonuses(dt);
  if(typeof autoSaveTick!=='undefined') autoSaveTick(dt);
}

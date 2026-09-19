/* Explicit deterministic test mode. Normal play uses requestAnimationFrame unchanged. */
var manualSimulation=new URLSearchParams(window.location.search).has('test');
if(manualSimulation){
  window.__game.test={
    step:function(n,dt){for(var i=0;i<n;i++)if(state===ST.PLAY||state===ST.REDEPLOY)update(dt||1/60);},
    render:function(){cullTick();renderer.render(scene,camera);},
    automatic:function(on){manualSimulation=!on;},
    navigation:function(sx,sz,tx,tz){return navFind(sx,sz,tx,tz);},
    clear:navLos,free:freeGoal,
    world:function(){return {half:WORLD.half,settlements:settlementStats,colliders:colliders.length,roads:window.__roadPts.length,geometryCache:geometryCache.size};},
    settlement:function(i){return SETTLEMENTS[i||0];},
    cameraClear:function(){return segmentClear(player.group.position.x,player.group.position.z,camera.position.x,camera.position.z,0.15);},
    collider:function(i){return colliders[i||0];},
    members:playerUnits,
    regroup:function(){formGroups();},
    think:function(){ehashBuild();groupT=0;groupThink(2.2);},
    units:function(){return entities;},
    groups:function(){return GROUPS;},
    walkAI:function(e,n,dt){var samples=[];for(var i=0;i<n;i++){NAV.budget=0;NAV.workMs=0;ehashBuild();updateAI(e,dt);advanceCombat(e,dt);updateEntityLifecycle(e,dt);if(i%10===0)samples.push({x:e.group.position.x,z:e.group.position.z,inside:insideSolid(e.group.position.x,e.group.position.z,0.45)});}return samples;},
    attack:function(e,target){e.atkT=0;beginAttack(e,target);},
    combat:advanceCombat,
    pose:updatePose,
    lifecycle:updateEntityLifecycle,
    spawn:spawnCharacter,
    weapon:makeWeapon,
    rig:buildCharacter,
    arrows:function(){return arrows.filter(function(a){return a.active;}).length;},
    catalog:function(){return {factions:FACS,weapons:WEAPONS};},
    kill:function(e){killEntity(e,null);},
    animation:function(e){return {walk:e.walk,hip:e.parts.legL.hip.rotation.x,knee:e.parts.legL.knee.rotation.x,shoulder:e.parts.armR.sh.rotation.x,elbow:e.parts.armR.el.rotation.x,body:e.body.position.y};},
    factions:function(){
      return {
        identity:FACTION_IDENTITY,
        level:factionLevel,
        passive:factionHasPassive,
        momentum:function(f){return momentumOf(f);},
        ability:function(f){return FAC_ABIL[f]?{t:FAC_ABIL[f].t,cd:FAC_ABIL[f].cd,strain:FAC_ABIL[f].strain,mode:FAC_ABIL[f].mode}:null;},
        activate:tryActivateAbility,
        doctrine:function(f){return FAC_DOCTRINE[f];},
        setDoctrine:setFactionDoctrine,
        targetScore:function(f,z){return factionTargetScore(f,z);},
        terrainMove:function(f,t){return factionTerrainMoveCost(f,t);},
        terrainDef:function(f,t){return factionTerrainDefense(f,t);},
        musterCost:musterCost,
        decision:function(f,i){return factionAIDecision(f,i);},
        status:function(f){return factionBattleStatus(f);},
        capture:function(w,l,z){onZoneCaptured(w,l,z);},
        lost:function(l,w,z){onZoneLost(l,w,z);},
        codex:function(f){openCodex(f);}
      };
    }
  };
}

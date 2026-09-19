function updateAI(e, dt){
  if(e.dead) return;
  var visNow=e.group.visible;
  e.atkT-=dt;
  e.staggerT-=dt;
  e.retargetT-=dt;
  if(e.rallyT>0) e.rallyT-=dt;
  if(e.kind==='wolf'){ updateWolf(e,dt); return; }
  if(e.kind==='villager'){ updateVillager(e,dt); return; }
  if(e.kind==='worker'){ updateWorker(e,dt); return; }
  if(e.retargetT<=0 || !e.target || e.target.dead){ e.target=nearestOpponent(e); e.retargetT=0.6; }
  var t=e.target;
  var ex=e.group.position.x, ez=e.group.position.z;
  var engaged=false;
  if(t){
    var tdx=t.group.position.x-ex, tdz=t.group.position.z-ez;
    var tdist=Math.sqrt(tdx*tdx+tdz*tdz)||0.001;
    var aggro=e.ranged?26 : e.order==='halt'?16 : e.order==='attack'?38 : e.order==='defend'?26 : e.order==='area'?30 : 24;
    if(tdist<aggro) engaged=true;
  }
  var mvx=0, mvz=0, wantYaw=null, spd=e.speed;
  if(engaged && t){
    var tdx2=t.group.position.x-ex, tdz2=t.group.position.z-ez;
    var dist=tdist;
    wantYaw=Math.atan2(tdx2,tdz2);
    if(e.ranged){
      if(dist<8.5){ mvx=-tdx2/dist; mvz=-tdz2/dist; }
      else if(dist>15){ mvx=tdx2/dist; mvz=tdz2/dist; }
      else if(Math.abs(angDiff(e.yaw,wantYaw))<0.25 && e.atkT<=0 && e.staggerT<=0){
        beginAttack(e, new THREE.Vector3(t.group.position.x, t.group.position.y+1.2, t.group.position.z));
      }
    } else {
      if(dist > e.range*0.82){ mvx=tdx2/dist; mvz=tdz2/dist; }
      else if(Math.abs(angDiff(e.yaw,wantYaw))<0.5 && e.atkT<=0 && e.staggerT<=0){
        beginAttack(e);
      }
    }
    /* shield up while closing */
    if(!e.ranged && e.blockStat>0 && e.animT<0){
      e.blocking = dist < e.range+2.2 && Math.random()<0.85;
    } else if(e.animT>=0){ e.blocking=false; }
  } else {
    /* v6: a worker too close feels dangerous — scare them off */
    var wk=nearWorker(e, 6.5);
    if(wk){
      var wkx=wk.group.position.x-ex, wkz=wk.group.position.z-ez, wkd=Math.sqrt(wkx*wkx+wkz*wkz)||1;
      wantYaw=Math.atan2(wkx,wkz);
      if(wkd>e.range*0.85){ mvx=wkx/wkd; mvz=wkz/wkd; }
      else if(e.atkT<=0 && e.staggerT<=0){ beginAttack(e); }
    } else if((e.order||e.role) && e.team===playerTeam && player && !player.dead){
      /* ---- v8 commanded army: roles drive movement ---- */
      var ox=null, oz=null;
      if(e.role==='bodyguard'){
        var bgt=null, bgd=1e18;
        eqNear(player.group.position.x,player.group.position.z,15,function(bt,bd2){
          if(bt.dead||bt.passive||bt.civ||!hostileF(bt.team,e.team))return;
          if(bd2<bgd){bgd=bd2;bgt=bt;}
        });
        if(bgt){
          var bkx=bgt.group.position.x-ex, bkz=bgt.group.position.z-ez, bkd=Math.sqrt(bkx*bkx+bkz*bkz)||1;
          if(bkd>e.range*0.9){ ox=bgt.group.position.x; oz=bgt.group.position.z; }
          else if(e.atkT<=0 && e.staggerT<=0){ beginAttack(e); }
        } else {
          ox=player.group.position.x+Math.cos(e.bgAngle||0)*3.1;
          oz=player.group.position.z+Math.sin(e.bgAngle||0)*3.1;
        }
      } else if(e.role==='defender'){
        if(e.responseGoal){
          ox=e.responseGoal.x; oz=e.responseGoal.z;
          var rdx2=ox-ex, rdz2=oz-ez;
          if(rdx2*rdx2+rdz2*rdz2<25*25) e.responseGoal=null;
        } else {
          e.patrolT=(e.patrolT||0)-dt;
          if(e.patrolT<=0 || !e.patrol){
            e.patrolT=rand(6,10);
            e.patrol=e.post?freeGoal(e.post.x+rand(-48,48),e.post.z+rand(-48,48)):freeGoal(ex+rand(-30,30),ez+rand(-30,30));
          }
          if(e.patrol){
            var pdx=e.patrol.x-ex, pdz=e.patrol.z-ez;
            if(pdx*pdx+pdz*pdz>16){ ox=e.patrol.x; oz=e.patrol.z; }
          }
        }
      } else if(e.role==='attacker'){
        if(e.secureT>0){
          /* hold the taken ground until the air is clean (~2.5 min), then move on */
          e.secureT-=dt;
          e.patrolT=(e.patrolT||0)-dt;
          if(e.patrolT<=0 || !e.patrol){
            e.patrolT=rand(5,9);
            e.patrol=e.securePost?{x:e.securePost.x+rand(-40,40), z:e.securePost.z+rand(-40,40)}:null;
          }
          if(e.patrol){
            var sdx=e.patrol.x-ex, sdz=e.patrol.z-ez;
            if(sdx*sdx+sdz*sdz>16){ ox=e.patrol.x; oz=e.patrol.z; }
          }
        } else {
          if(e.atkTarget!==null && zones[e.atkTarget].owner===playerTeam){
            e.secureT=150; e.securePost=zoneCenter(e.atkTarget); e.atkTarget=null; e.atkPt=null; e.patrol=null; e.patrolT=0;
          } else if(e.atkTarget===null){
            /* fresh pick at secure-expiry so lost-city alerts are honored first */
            e.atkTarget=pickAttackTarget();
          }
          if(e.atkTarget!==null){
            if(!e.atkPt){ var cc2=zoneCenter(e.atkTarget); e.atkPt=freeGoal(cc2.x,cc2.z); }
            if((e.atkPt.x-ex)*(e.atkPt.x-ex)+(e.atkPt.z-ez)*(e.atkPt.z-ez)<36) e.atkPt=null; /* arrived — fight/advance normally */
            if(e.atkPt){ ox=e.atkPt.x; oz=e.atkPt.z; }
          }
          if(ox===null && e.atkTarget!==null && !e.atkPt){ var cc3=zoneCenter(e.atkTarget); var fg3=freeGoal(cc3.x,cc3.z); ox=fg3.x; oz=fg3.z; }
        }
      } else if(e.order==='follow'){
        var pr2=4+Math.sqrt(e.sqIdx||0)*1.1, pa2=(e.sqIdx||0)*2.39996;
        ox=player.group.position.x+Math.cos(pa2)*pr2;
        oz=player.group.position.z+Math.sin(pa2)*pr2;
      } else if(e.order==='defend'){
        ox=e.anchor?e.anchor.x:ex; oz=e.anchor?e.anchor.z:ez;
      } else if(e.order==='area'){
        /* v9/v11: hold the assigned ground — patrol it, engage anything close (aggro handles) */
        var ax3=e.post?e.post.x:(e.anchor?e.anchor.x:ex), az3=e.post?e.post.z:(e.anchor?e.anchor.z:ez);
        e.patrolT=(e.patrolT||0)-dt;
        if(e.patrolT<=0 || !e.patrol){
          e.patrolT=rand(6,10);
          e.patrol=freeGoal(ax3+rand(-20,20),az3+rand(-20,20));
        }
        var adx2=e.patrol.x-ex, adz2=e.patrol.z-ez;
        if(adx2*adx2+adz2*adz2>16){ ox=e.patrol.x; oz=e.patrol.z; }
      } else if(e.order==='attack'){
        var at2=nearestOpponent(e);
        if(at2){ ox=at2.group.position.x; oz=at2.group.position.z; }
      }
      if(ox!==null){
        e.navT=(e.navT||0)-dt;
        if(!engaged){ var np9=navSteer(e,ox,oz); ox=np9.x; oz=np9.z; }
        var ddx=ox-ex, ddz=oz-ez, ddl=Math.sqrt(ddx*ddx+ddz*ddz);
        var arrive=(e.order==='follow'&&ddl<3.4)||((e.role==='defender'||e.role==='attacker'||e.role==='bodyguard')&&ddl<4.5)||(e.order==='defend'&&ddl<6)||(e.order==='area'&&Math.hypot((e.post||e.anchor||{x:ex,z:ez}).x-ex,(e.post||e.anchor||{x:ex,z:ez}).z-ez)<6&&(!e.patrol||Math.hypot(e.patrol.x-ex,e.patrol.z-ez)<4));
        if(e.navPts)arrive=ddl<0.8;
        if(!arrive && ddl>0.6){
          mvx=ddx/ddl; mvz=ddz/ddl;
          if(ddl>80) spd=e.speed*2.6;
          wantYaw=Math.atan2(ddx,ddz);
        }
      }
      if(wantYaw===null && t){
        var fdx0=t.group.position.x-ex, fdz0=t.group.position.z-ez;
        wantYaw=Math.atan2(fdx0,fdz0);
      }
    } else {
    /* strategic movement: goal or return home */
    var gx=null, gz=null;
    if(e.goal && !isFinite(e.goal.x)) e.goal=null;
    if(e.goal){
      gx=e.goal.x; gz=e.goal.z;
      var gdx=gx-ex, gdz=gz-ez;
      if(gdx*gdx+gdz*gdz < 100){ e.goal=null; gx=null; }
      else {
        e.navT=(e.navT||0)-dt;var route=navSteer(e,gx,gz);gdx=route.x-ex;gdz=route.z-ez;
        mvx=gdx; mvz=gdz;
        var gl=Math.sqrt(gdx*gdx+gdz*gdz);
        if(gl>100) spd=e.speed*2.6; /* forced march across the map */
        wantYaw=Math.atan2(gdx,gdz);
      }
    } else {
      var hdx=e.home.x-ex, hdz=e.home.z-ez;
      if(hdx*hdx+hdz*hdz > 3600){
        e.navT=(e.navT||0)-dt;var homeRoute=navSteer(e,e.home.x,e.home.z);hdx=homeRoute.x-ex;hdz=homeRoute.z-ez;
        mvx=hdx; mvz=hdz;
        spd=e.speed*1.6;
        wantYaw=Math.atan2(hdx,hdz);
      }
    }
    if(wantYaw===null && t){
      var fdx=t.group.position.x-ex, fdz=t.group.position.z-ez;
      wantYaw=Math.atan2(fdx,fdz);
    }
    }
  }
  if(wantYaw!==null) e.yaw=turnTo(e.yaw, wantYaw, (engaged?6:4.5)*dt);
  /* separation (v11: spatial hash — was O(n²) over every entity) */
  if(visNow){
    eqNear(ex,ez,1.6,function(o,sd){
      if(o===e||o.dead||o.passive||sd<0.0001||sd>=1.2) return;
      var sL=Math.sqrt(sd);
      mvx+=(ex-o.group.position.x)/sL*0.7;
      mvz+=(ez-o.group.position.z)/sL*0.7;
    });
  }
  /* v9: unstuck — the old 90° detour ran before mvl was computed (silent no-op). Whisker steering instead. */
  var mvl=Math.sqrt(mvx*mvx+mvz*mvz);
  if((e.stuckT||0)>0.9 && mvl>0.05){
    var baseYaw=Math.atan2(mvx,mvz), bestY=null, bestD=0.9;
    for(var kk=-5;kk<=5;kk++){
      if(!kk) continue;
      var clr=whiskerClear(e, baseYaw+kk*0.5, 9);
      if(clr>bestD){ bestD=clr; bestY=baseYaw+kk*0.5; }
    }
    if(bestY!==null){ e.detourT=1.15; e.detourYaw=bestY; e.stuckT=0.2; }
    else { e.detourT=1.0; e.detourYaw=baseYaw+Math.PI; e.stuckT=0.2; }  /* boxed in — reverse out the way we came */
  }
  if(e.detourT>0){ e.detourT-=dt; if(mvl>0.05){ mvx=Math.sin(e.detourYaw)*mvl; mvz=Math.cos(e.detourYaw)*mvl; } }
  if(mvl>0.05){
    if(e.staggerT>0){ e.movingAmt=0; e.walkRate=0; return; }
    var sp=spd*(e.animT>=0&&e.weapon!=='spear'&&e.weapon!=='dory'?0.6:1)*(e.rallyT>0?1.28:1);
    moveWithCollision(e.group.position,mvx/mvl*Math.min(mvl,1)*sp*dt,mvz/mvl*Math.min(mvl,1)*sp*dt,0.5);
    collideCircle(e.group.position, 0.5);          /* v8: no more phasing through walls */
    var nmove=Math.abs(e.group.position.x-ex)+Math.abs(e.group.position.z-ez);
    if(nmove<sp*dt*0.3){ e.stuckT=(e.stuckT||0)+dt; } else e.stuckT=Math.max(0,(e.stuckT||0)-dt*2);
    if(e.stuckT>1.1){ e.detourT=0.9; e.detourSign=(Math.random()<0.5?1:-1); e.stuckT=0; }
    e.movingAmt=lerp(e.movingAmt,1,dt*8);
    e.walkRate=10*clamp(sp/e.speed,0.85,2.4);
  } else {
    e.movingAmt=lerp(e.movingAmt,0,dt*8);
    e.walkRate=0;
  }
  e.group.position.x=clamp(e.group.position.x,-WORLD.half+5,WORLD.half-5);
  e.group.position.z=clamp(e.group.position.z,-WORLD.half+5,WORLD.half-5);
  collideCircle(e.group.position, 0.45);
  /* v10: if a unit ends up embedded (spawn glitch, deep corner), REWIND to the last
     known-free spot instead of phasing through the wall */
  if(!insideSolid(e.group.position.x, e.group.position.z, 0.46)){
    e.lastFree={x:e.group.position.x, z:e.group.position.z};
    e.embedT=0;
  } else {
    e.embedT=(e.embedT||0)+dt;
    if(e.embedT>0.8 && e.lastFree){
      e.group.position.x=e.lastFree.x; e.group.position.z=e.lastFree.z;
      e.embedT=0; e.navPts=null; e.stuckT=0;
    }
  }

}

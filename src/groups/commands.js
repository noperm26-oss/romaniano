/* Unlimited groups and units. Eight is a formation size, NEVER an army limit. */
var GROUPS=[],groupSeq=1,groupT=0,spreadCounter=0,lastAreaOrder=null;
function scheduleReform(){groupT=Math.min(groupT,0.1);}
function newGroup(members,task,post){
  var g={id:groupSeq++,members:members,task:task||'follow',post:post||null,atkTarget:null,seen:0,power:0,secureT:0,supporting:null,reinforceBy:null};
  if(g.task==='attack')g.atkTarget=groupNextAttackTarget(g);
  if(g.task==='halt'&&members[0])g.anchor={x:members[0].group.position.x,z:members[0].group.position.z};
  GROUPS.push(g);syncGroup(g);return g;
}
function syncGroup(g){
  g.power=0;
  g.members.forEach(function(m,i){
    g.power+=unitPower(m);m.grp=g;m.grpId=g.id;m.formationSlot=i;m.sqIdx=g.id*8+i;
    m.role=g.task==='guard'?'bodyguard':g.task==='defend'?'defender':g.task==='attack'?'attacker':null;
    m.order=g.task==='guard'?'defend':g.task==='hold'?'area':g.task;
    m.post=g.post;m.atkTarget=g.task==='attack'?g.atkTarget:null;
    m.responseGoal=null;m.patrol=null;m.patrolT=0;m.navPts=null;m.navGoal=null;m.navT=0;
    m.atkPt=null;m.secureT=0;m.securePost=null;
    if(g.task==='guard')m.bgAngle=i*2.39996;
  });
}
function formGroups(){
  var pool=playerUnits(),live=new Set(pool),assigned=new Set();
  GROUPS=GROUPS.filter(function(g){
    g.members=g.members.filter(function(m){if(!live.has(m)||assigned.has(m))return false;assigned.add(m);return true;});
    g.power=g.members.reduce(function(sum,m){return sum+unitPower(m);},0);
    return g.members.length>0;
  });
  var buckets=new Map();
  pool.forEach(function(e){
    if(assigned.has(e))return;
    var key=Math.floor(e.group.position.x/60)+':'+Math.floor(e.group.position.z/60);
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);
  });
  buckets.forEach(function(members){
    for(var i=0;i<members.length;i+=8){
      var task=curOrder==='area'?'hold':curOrder==='defend'?'defend':curOrder||'follow';
      var posts=defendPosts(),post=task==='hold'?lastAreaOrder:task==='defend'&&posts.length?zoneCenter(posts[spreadCounter++%posts.length]):null;
      newGroup(members.slice(i,i+8),task,post);
    }
  });
}
function frontierTargets(){
  var owned=defendPosts(),out=[],seen=new Set();
  owned.forEach(function(zi){
    var c=zoneCenter(zi);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
      var gx=c.gx+d[0],gz=c.gz+d[1];if(gx<0||gz<0||gx>=ZN||gz>=ZN)return;
      var id=gz*ZN+gx;if(zones[id].owner===playerTeam||seen.has(id))return;
      seen.add(id);out.push(id);
    });
  });return out;
}
function groupNextAttackTarget(g){
  pendingAlerts=pendingAlerts.filter(function(a){return gameTime-a.t<240;});
  if(pendingAlerts.length)return pendingAlerts.shift().zi;
  var candidates=frontierTargets();
  if(!candidates.length)for(var i=0;i<zones.length;i++)if(zones[i].owner!==playerTeam)candidates.push(i);
  if(!candidates.length)return null;
  var occupied=new Map();
  GROUPS.forEach(function(o){if(o!==g&&o.task==='attack')occupied.set(o.atkTarget,(occupied.get(o.atkTarget)||0)+1);});
  var lead=g.members[0],p=lead?lead.group.position:{x:0,z:0};
  /* the army hunts the ground its kingdom wants (spec §10): proximity
     still matters, but faction territory preference steers the pick */
  var maxD=1, fs=null, cache={};
  if(typeof factionTargetScore==='function'&&playerTeam){
    fs=function(zi){ if(!(zi in cache)) cache[zi]=factionTargetScore(playerTeam,zi); return cache[zi]; };
    for(var ci=0;ci<candidates.length;ci++){
      var cc=zoneCenter(candidates[ci]);
      var dd=Math.hypot(cc.x-p.x,cc.z-p.z);
      if(dd>maxD)maxD=dd;
      fs(candidates[ci]);
    }
  }
  candidates.sort(function(a,b){
    var diff=(occupied.get(a)||0)-(occupied.get(b)||0);if(diff)return diff;
    var ca=zoneCenter(a),cb=zoneCenter(b);
    var da=Math.hypot(ca.x-p.x,ca.z-p.z), db=Math.hypot(cb.x-p.x,cb.z-p.z);
    if(fs) return (db/maxD*0.55+fs(b)*0.45)-(da/maxD*0.55+fs(a)*0.45);
    return da-db;
  });return candidates[0];
}
function assignTasks(mode,areaPt,scopeSel){
  formGroups();
  var selected=playerUnits().filter(function(m){return !scopeSel||scopeSel.has(m);});
  if(!selected.length)return;
  var chosen=new Set(selected);
  // Split formations at scope boundaries; non-selected units keep every order/goal.
  GROUPS=GROUPS.filter(function(g){g.members=g.members.filter(function(m){return !chosen.has(m);});g.power=g.members.reduce(function(s,m){return s+unitPower(m);},0);return g.members.length;});
  selected.sort(function(a,b){return unitPower(b)-unitPower(a);});
  function batch(members,task,post){for(var i=0;i<members.length;i+=8)newGroup(members.slice(i,i+8),task,post);}
  if(mode==='defend'){
    var guards=Math.round(selected.length*DOCTRINE.bg),defenders=Math.min(selected.length-guards,Math.round(selected.length*DOCTRINE.def));
    batch(selected.slice(0,guards),'guard');
    batch(selected.slice(guards,selected.length-defenders),'attack');
    var weakest=selected.slice(selected.length-defenders),posts=defendPosts();
    if(!posts.length)batch(weakest,'guard');
    else {
      var bins=posts.map(function(){return [];});
      weakest.forEach(function(m,i){bins[i%posts.length].push(m);});
      bins.forEach(function(ms,i){batch(ms,'defend',freeGoal(zoneCenter(posts[i]).x,zoneCenter(posts[i]).z));});
    }
  } else {
    if(mode==='area')lastAreaOrder={x:areaPt.x,z:areaPt.z};
    batch(selected,mode==='area'?'hold':mode,mode==='area'?lastAreaOrder:null);
  }
}
function groupThink(dt){
  groupT-=dt;if(groupT>0)return;
  var reformT=2.2;
  /* Nippon Rapid Deployment (L3): the army transitions between states faster */
  if(typeof factionHasPassive==='function'&&typeof playerTeam!=='undefined'&&playerTeam==='nippon'&&factionHasPassive('nippon','rapid-deployment')) reformT*=0.65;
  groupT=reformT;formGroups();
  var ids=new Map(),kingThreat=0,maxPower=0;
  GROUPS.forEach(function(g){ids.set(g.id,g);maxPower=Math.max(maxPower,g.power);var lead=g.members[0];g.seen=0;
    eqNear(lead.group.position.x,lead.group.position.z,80,function(t){if(!t.dead&&!t.passive&&!t.civ&&t.kind!=='worker'&&hostileF(t.team,playerTeam))g.seen++;});});
  if(player&&!player.dead)eqNear(player.group.position.x,player.group.position.z,55,function(t){if(!t.dead&&!t.passive&&!t.civ&&hostileF(t.team,playerTeam))kingThreat++;});
  GROUPS.forEach(function(g){
    if(g.supporting){
      var recipient=ids.get(g.supporting);
      if(!recipient||recipient.seen===0||gameTime-g.supportSince>30){g.supporting=null;g.post=null;syncGroup(g);}
    }
    if(g.temporaryGuard&&kingThreat===0){g.temporaryGuard=false;g.task='attack';syncGroup(g);}
  });
  var supportMap=new Map();
  GROUPS.forEach(function(g){if(g.supporting){if(!supportMap.has(g.supporting))supportMap.set(g.supporting,[]);supportMap.get(g.supporting).push(g);}});
  GROUPS.forEach(function(g){
    var lead=g.members[0],cx=lead.group.position.x,cz=lead.group.position.z;
    var supporters=supportMap.get(g.id)||[];
    var committed=supporters.reduce(function(n,o){return n+o.members.length;},g.members.length);
    g.reinforceBy=supporters.length?supporters[0].id:null;
    if(!g.supporting&&g.seen>=committed){
      var need=g.seen+1-committed;
      var candidates=GROUPS.filter(function(o){return o!==g&&o.task==='attack'&&!o.supporting&&o.seen<o.members.length;});
      candidates.sort(function(a,b){return Math.hypot(a.members[0].group.position.x-cx,a.members[0].group.position.z-cz)-Math.hypot(b.members[0].group.position.x-cx,b.members[0].group.position.z-cz);});
      for(var i=0;i<candidates.length&&need>0;i++){
        var other=candidates[i];other.supporting=g.id;other.supportSince=gameTime;
        if(g.atkTarget!==null)other.atkTarget=g.atkTarget;
        other.post=freeGoal(cx,cz);
        other.members.forEach(function(m){m.atkTarget=other.atkTarget;m.atkPt=other.post;m.navPts=null;m.navGoal=null;});
        need-=other.members.length;g.reinforceBy=g.reinforceBy||other.id;
      }
    }
    if(g.task==='attack'&&!g.supporting){
      if(g.atkTarget===null||!zones[g.atkTarget]||(zones[g.atkTarget].owner===playerTeam&&!g.members.some(function(m){return m.secureT>0;}))){
        g.atkTarget=groupNextAttackTarget(g);syncGroup(g);
      }
    }
    if(kingThreat>=2&&g.task==='attack'&&!g.supporting&&g.power>=maxPower*0.8){g.task='guard';g.temporaryGuard=true;syncGroup(g);kingThreat=0;}
  });
}

function issueOrder(o){
  if(state!==ST.PLAY||!player||player.dead) return 0;
  var army=playerUnits();
  if(!army.length) return 0;
  curOrder=o;
  var scope=SCOPES[cmdScopeIdx];
  var n=Math.max(1, Math.round(army.length*scope));
  var byPower=army.slice().sort(function(a,b){ return unitPower(b)-unitPower(a); });
  var scopeSel=null;
  if(n<army.length){ scopeSel=new Set(); for(var i=0;i<n;i++) scopeSel.add(byPower[i]); }
  assignTasks(o, null, scopeSel);
  Snd.tone(o==='follow'?520:420, o==='follow'?700:330, 0.13,'square',0.1);
  spawnRing(player.group.position.x, player.group.position.y+0.3, player.group.position.z,
    o==='follow'?0x7ec97e : o==='defend'?0x5c9ce0 : o==='attack'?0xe06666 : 0xb9a06a);
  return Math.min(n,army.length);
}
/* v9/v11: send the scoped army to hold a specific spot on the map (T → click) */
function issueAreaOrder(x,z){
  if(state!==ST.PLAY||!player||player.dead) return 0;
  var army=playerUnits();
  if(!army.length) return 0;
  var scope=SCOPES[cmdScopeIdx];
  var n=Math.max(1, Math.round(army.length*scope));
  var byDist=army.slice().sort(function(a,b){
    return ((a.group.position.x-x)*(a.group.position.x-x)+(a.group.position.z-z)*(a.group.position.z-z))
          -((b.group.position.x-x)*(b.group.position.x-x)+(b.group.position.z-z)*(b.group.position.z-z));
  });
  var scopeSel=null;
  if(n<army.length){ scopeSel=new Set(); for(var i=0;i<n;i++) scopeSel.add(byDist[i]); }
  var spot=freeGoal(x,z);
  assignTasks('area', spot, scopeSel);
  curOrder='area';
  Snd.tone(480, 380, 0.13,'square',0.1);
  spawnRing(spot.x, (player.group.position.y||0)+0.2, spot.z, 0xd08a3e);
  killFeedMsg('Area order', n+' units hold ('+Math.round(spot.x)+', '+Math.round(spot.z)+') — guard & engage', '#d08a3e');
  return n;
}

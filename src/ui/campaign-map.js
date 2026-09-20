/* ---------------- campaign map (march) + territory info panel ---------------- */
var overlayWarmap, warmapOpen=false;
var warmapHoverZi=-1;
function toggleWarmap(){
  warmapOpen=!warmapOpen;
  if(warmapOpen){
    drawWarmap();
    show(overlayWarmap);
    if(document.pointerLockElement) document.exitPointerLock();
  } else {
    hide(overlayWarmap);
    if(state===ST.PLAY) tryLock();
  }
}
function drawWarmap(){
  var cv=$('warmap-canvas');
  var g=cv.getContext('2d');
  var w=cv.width, h=cv.height;
  var sx=w/(WORLD.half*2), sz=h/(WORLD.half*2);
  var X=function(x){ return (x+WORLD.half)*sx; };
  var Z=function(z){ return (z+WORLD.half)*sz; };
  g.fillStyle='#3d4f33';
  g.fillRect(0,0,w,h);
  for(var i=0;i<zones.length;i++){
    var zc=zoneCenter(i);
    var terr=typeof zoneTerrain!=='undefined'?zoneTerrain(i):'plains';
    var baseCol = zones[i].owner ? FACS[zones[i].owner].mapColor : '#6b6257';
    // tint by terrain
    var col=baseCol;
    if(!zones[i].owner){
      if(terr==='forest') col='#4a5a3a';
      else if(terr==='mountains') col='#7a756a';
      else if(terr==='hills') col='#6b6257';
      else if(terr==='desert') col='#8a7a5a';
      else if(terr==='river') col='#5a6a7a';
    }
    g.fillStyle=col;
    g.globalAlpha = zones[i].owner ? 0.88 : 0.5;
    g.fillRect(X(zc.x-ZS/2)+1, Z(zc.z-ZS/2)+1, ZS*sx-2, ZS*sz-2);
    // strategic marker
    if(zones[i].core){
      g.globalAlpha=1;
      g.fillStyle='#f1e4c3';
      g.font='bold 10px Georgia';
      g.fillText('♜', X(zc.x), Z(zc.z)+3);
    } else if(zones[i].bonus){
      g.globalAlpha=0.9;
      g.fillStyle='#e9c458';
      g.font='9px Georgia';
      g.fillText('⬢', X(zc.x), Z(zc.z)+3);
    }
  }
  g.globalAlpha=1;
  g.strokeStyle='rgba(0,0,0,0.25)';
  for(var gx=0;gx<=ZN;gx++){
    g.beginPath(); g.moveTo(gx*ZS*sx,0); g.lineTo(gx*ZS*sx,h); g.stroke();
    g.beginPath(); g.moveTo(0,gx*ZS*sz); g.lineTo(w,gx*ZS*sz); g.stroke();
  }
  /* rivers and the main roads of ROM-MAP-SPEC-003 */
  if(typeof RIVERS!=='undefined'){
    g.strokeStyle='rgba(90,150,190,0.85)'; g.lineWidth=3; g.lineJoin='round';
    RIVERS.forEach(function(R){ g.beginPath(); R.wp.forEach(function(p,i){ if(i===0) g.moveTo(X(p[0]),Z(p[1])); else g.lineTo(X(p[0]),Z(p[1])); }); g.stroke(); });
    ROADS.forEach(function(R){ if(R.lane||R.cls==='R3') return; g.strokeStyle=R.cls==='R0'?'rgba(240,230,200,0.9)':R.cls==='R1t'?'rgba(220,190,130,0.85)':'rgba(190,160,110,0.75)'; g.lineWidth=R.cls==='R0'?2.2:R.cls==='R2'?1:1.6;
      g.beginPath(); R.wp.forEach(function(p,i){ if(i===0) g.moveTo(X(p[0]),Z(p[1])); else g.lineTo(X(p[0]),Z(p[1])); }); g.stroke(); });
    if(typeof FLAGS!=='undefined') FLAGS.forEach(function(F){ var zi=zoneIdxAt(F.x,F.z), o=zones[zi]&&zones[zi].owner; g.fillStyle=o&&FACS[o]?FACS[o].bannerBg:'#9a9a8a'; g.fillRect(X(F.x)-2,Z(F.z)-2,4,4); });
  }
  /* towns */
  g.font='bold 13px Georgia'; g.textAlign='center';
  FAC_KEYS.forEach(function(f){
    var T=TOWNS[f];
    g.fillStyle='#f1e4c3';
    g.fillText('♜ '+FACS[f].name, X(T.x), Z(T.z)-8);
  });
  /* units */
  entities.forEach(function(e){
    if(e.dead) return;
    g.fillStyle = e.isPlayer ? '#f1c40f' : (e.team===playerTeam ? '#7ec97e' : '#e03131');
    g.beginPath();
    g.arc(X(e.group.position.x), Z(e.group.position.z), e.isPlayer?5:3, 0, TAU);
    g.fill();
    if(e.isPlayer){
      g.strokeStyle='#fff'; g.lineWidth=2; g.stroke();
    }
  });
  /* field marker */
  g.fillStyle='rgba(110,95,67,0.9)';
  g.beginPath(); g.arc(X(0), Z(0), 14, 0, TAU); g.fill();
  g.fillStyle='#f1e4c3';
  g.fillText('Romaria', X(0), Z(0)+4);

  // highlight hovered zone
  if(warmapHoverZi>=0){
    var hc=zoneCenter(warmapHoverZi);
    g.strokeStyle='#f1e4c3'; g.lineWidth=2;
    g.strokeRect(X(hc.x-ZS/2)+1, Z(hc.z-ZS/2)+1, ZS*sx-2, ZS*sz-2);
    g.lineWidth=1;
  }
}
function warmapInfoHtml(zi){
  if(zi<0||zi>=zones.length) return '<i>Hover a territory for details — click to order army, SHIFT-click to march king</i>';
  var z=zones[zi];
  var c=zoneCenter(zi);
  var terr=typeof zoneTerrain!=='undefined'?zoneTerrain(zi):'plains';
  var inc=typeof zoneIncomeBase!=='undefined'?zoneIncomeBase(zi):0;
  var pop=typeof zonePopulation!=='undefined'?zonePopulation(zi):0;
  var strat=typeof zoneStrategicValue!=='undefined'?zoneStrategicValue(zi):'Low';
  var defB=typeof terrainDefenseBonus!=='undefined'?terrainDefenseBonus(terr):0;
  if(typeof defensiveBonus!=='undefined') defB+=defensiveBonus(zi);
  var owner=z.owner?FACS[z.owner].name:'Neutral';
  var ownerCol=z.owner?FACS[z.owner].mapColor:'#9a9078';
  var friendly=z.owner===playerTeam;
  var status=friendly?'Friendly':(z.owner?'Enemy-controlled':(z.core?'Contested':'Neutral'));
  var dist=0, travel='—';
  if(typeof player!=='undefined' && player){
    dist=Math.hypot(player.group.position.x-c.x, player.group.position.z-c.z);
    var speed=player.riding?12:6;
    var moveCost=typeof terrainMoveCost!=='undefined'?terrainMoveCost(terr):1;
    var sec=Math.round(dist/speed*moveCost);
    var m=Math.floor(sec/60), s=sec%60;
    travel=(m>0?m+'m ':'')+s+'s ('+Math.round(dist)+'u)';
  }
  var bb=typeof zoneBuildingBonus!=='undefined'?zoneBuildingBonus(zi):null;
  var bonusStr='';
  if(bb){
    var parts=[];
    if(bb.treasury) parts.push('💰+'+Math.round(bb.treasury*100)+'%');
    if(bb.recruit) parts.push('⚔+'+Math.round(bb.recruit*100)+'%');
    if(bb.manpower) parts.push('👥+'+Math.round(bb.manpower*100)+'%');
    if(bb.morale) parts.push('🛡+'+Math.round(bb.morale*100)+'%');
    if(parts.length) bonusStr=' | '+parts.join(' ');
  }
  return '<span class=\"tag\" style=\"background:'+ownerCol+'\">'+owner+'</span> <b>Territory #'+zi+'</b> ('+Math.round(c.x)+', '+Math.round(c.z)+') — <b>'+status+'</b><br>'
    +'Terrain: <b>'+terr+'</b> (Def +'+defB+'% | Move ×'+(typeof terrainMoveCost!=='undefined'?terrainMoveCost(terr).toFixed(2):'1.0')+') | Strategic: <b>'+strat+'</b>'+bonusStr+'<br>'
    +'Income: <b>+'+inc.toFixed(1)+' Gold/min</b> | Population: <b>'+pop.toLocaleString()+'</b> | Defense Bonus: <b>+'+defB+'%</b><br>'
    +'Travel: <b>'+travel+'</b> | Owner: <b style=\"color:'+ownerCol+'\">'+owner+'</b> | Influence: '+(z.owner?Object.keys(z.inf).map(function(f){ return FACS[f].name+':'+Math.round(z.inf[f]); }).join(', '):'—');
}
function updateWarmapInfo(zi){
  var el=$('warmap-info');
  if(!el) return;
  el.innerHTML=warmapInfoHtml(zi);
}
function warmapMouseMove(ev){
  var cv=$('warmap-canvas');
  var rect=cv.getBoundingClientRect();
  var px=(ev.clientX-rect.left)/rect.width;
  var py=(ev.clientY-rect.top)/rect.height;
  var wx=px*(WORLD.half*2)-WORLD.half;
  var wz=py*(WORLD.half*2)-WORLD.half;
  var zi=zoneIdxAt(wx,wz);
  if(zi!==warmapHoverZi){
    warmapHoverZi=zi;
    drawWarmap();
    updateWarmapInfo(zi);
  }
}
function marchClick(ev){
  var cv=$('warmap-canvas');
  var rect=cv.getBoundingClientRect();
  var px=(ev.clientX-rect.left)/rect.width;
  var py=(ev.clientY-rect.top)/rect.height;
  var wx=px*(WORLD.half*2)-WORLD.half;
  var wz=py*(WORLD.half*2)-WORLD.half;
  var zi=zoneIdxAt(wx,wz);
  updateWarmapInfo(zi);
  if(!ev.shiftKey){
    /* click = the scoped army marches there, holds the ground, engages when needed */
    var sent=issueAreaOrder(wx,wz);
    if(sent>0){
      var terr=typeof zoneTerrain!=='undefined'?zoneTerrain(zi):'plains';
      var moveCost=typeof terrainMoveCost!=='undefined'?terrainMoveCost(terr):1;
      var dist=player?Math.hypot(player.group.position.x-wx, player.group.position.z-wz):0;
      var sec=Math.round(dist/6*moveCost);
      showHint(sent+' units → Territory #'+zi+' ('+terr+') — ETA '+sec+'s', 3);
    }
    return;
  }
  if(marchCooldown>0){ showHint('Your soldiers rest — march ready in '+Math.ceil(marchCooldown)+'s', 2); return; }
  if(zones[zi].owner!==playerTeam){ showHint('You can only march into YOUR territory', 2.5); return; }
  var CIVILIAN={worker:1, villager:1, wolf:1, deer:1, sheep:1, bird:1};
  var enemiesNear=false;
  entities.forEach(function(e){
    if(!e.dead&&!e.passive&&player&&!e.isPlayer&&!e.civ&&!CIVILIAN[e.kind]&&e.team!==playerTeam){
      var dx=e.group.position.x-player.group.position.x;
      var dz=e.group.position.z-player.group.position.z;
      if(dx*dx+dz*dz<45*45) enemiesNear=true;
    }
  });
  if(enemiesNear){ showHint('Cannot march — the enemy is upon you!', 2.5); return; }
  var c=zoneCenter(zi);
  var spot=findFreeSpot(c.x+rand(-80,80), c.z+rand(-80,80), 0.6);
  player.group.position.x=spot.x;
  player.group.position.z=spot.z;
  player.goal=null;
  marchCooldown=8;
  toggleWarmap();
  showBanner('March!', 'Your king arrives at Territory #'+zi+' — '+ (typeof zoneTerrain!=='undefined'?zoneTerrain(zi):''), 1.8);
  Snd.horn();
}

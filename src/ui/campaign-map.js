/* ---------------- campaign map (march) ---------------- */
var overlayWarmap, warmapOpen=false;
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
    g.fillStyle = zones[i].owner ? FACS[zones[i].owner].mapColor : '#6b6257';
    g.globalAlpha = zones[i].owner ? 0.85 : 0.4;
    g.fillRect(X(zc.x-ZS/2)+1, Z(zc.z-ZS/2)+1, ZS*sx-2, ZS*sz-2);
  }
  g.globalAlpha=1;
  g.strokeStyle='rgba(0,0,0,0.25)';
  for(var gx=0;gx<=ZN;gx++){
    g.beginPath(); g.moveTo(gx*ZS*sx,0); g.lineTo(gx*ZS*sx,h); g.stroke();
    g.beginPath(); g.moveTo(0,gx*ZS*sz); g.lineTo(w,gx*ZS*sz); g.stroke();
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
  g.fillText('The Field', X(0), Z(0)+4);
}
function marchClick(ev){
  var cv=$('warmap-canvas');
  var rect=cv.getBoundingClientRect();
  var px=(ev.clientX-rect.left)/rect.width;
  var py=(ev.clientY-rect.top)/rect.height;
  var wx=px*(WORLD.half*2)-WORLD.half;
  var wz=py*(WORLD.half*2)-WORLD.half;
  if(!ev.shiftKey){
    /* v9: click = the scoped army marches there, holds the ground, engages when needed */
    var sent=issueAreaOrder(wx,wz);
    if(sent>0) showHint(sent+' units sent to hold ('+Math.round(wx)+', '+Math.round(wz)+')', 2.5);
    return;
  }
  var zi=zoneIdxAt(wx,wz);
  if(marchCooldown>0){ showHint('Your soldiers rest — march ready in '+Math.ceil(marchCooldown)+'s', 2); return; }
  if(zones[zi].owner!==playerTeam){ showHint('You can only march into YOUR territory', 2.5); return; }
  /* no enemy nearby (v9: civilians, workers and wildlife never count — only real soldiers do) */
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
  showBanner('March!', 'Your soldier arrives at the banner\'s call', 1.6);
  Snd.horn();
}

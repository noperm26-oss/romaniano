var miniCtx=null;
function drawMinimap(oc){
  var cv=hudEls.mini;
  if(!cv) return;
  if(!miniCtx) miniCtx=cv.getContext('2d');
  var w=cv.width, h=cv.height;
  var sx=w/(WORLD.half*2), sz=h/(WORLD.half*2);
  var X=function(x){ return (x+WORLD.half)*sx; };
  var Z=function(z){ return (z+WORLD.half)*sz; };
  miniCtx.fillStyle='#4a5c3a';
  miniCtx.fillRect(0,0,w,h);
  for(var i=0;i<zones.length;i++){
    var zc=zoneCenter(i);
    miniCtx.fillStyle = zones[i].owner ? FACS[zones[i].owner].mapColor : '#6b6257';
    miniCtx.globalAlpha = zones[i].owner ? 0.75 : 0.3;
    miniCtx.fillRect(X(zc.x-ZS/2), Z(zc.z-ZS/2), ZS*sx+0.5, ZS*sz+0.5);
  }
  miniCtx.globalAlpha=1;
  /* towns */
  miniCtx.font='bold 8px Georgia'; miniCtx.textAlign='center';
  FAC_KEYS.forEach(function(f){
    var T=TOWNS[f];
    miniCtx.fillStyle='#f1e4c3';
    miniCtx.fillText(FACS[f].name, X(T.x), Z(T.z)+3);
  });
  for(var j=0;j<entities.length;j++){
    var e=entities[j];
    if(e.dead) continue;
    if(e.isPlayer) continue;
    miniCtx.fillStyle = (playerTeam && e.team===playerTeam) ? '#7ec97e' : '#e03131';
    miniCtx.beginPath();
    miniCtx.arc(X(e.group.position.x), Z(e.group.position.z), 1.6, 0, TAU);
    miniCtx.fill();
  }
  if(player && !player.dead){
    var ppx=X(player.group.position.x), ppy=Z(player.group.position.z);
    var a=Math.atan2(Math.sin(camYaw), -Math.cos(camYaw));
    miniCtx.save();
    miniCtx.translate(ppx,ppy);
    miniCtx.rotate(a);
    miniCtx.fillStyle='#f1c40f';
    miniCtx.beginPath();
    miniCtx.moveTo(0,-4.5); miniCtx.lineTo(3.2,3.5); miniCtx.lineTo(-3.2,3.5);
    miniCtx.closePath(); miniCtx.fill();
    miniCtx.restore();
  }
}

/* Pickup rewards and wildlife spawns are simulation, not visual animation. */
function updateLivingWorld(dt){
  /* ---- treasure chests ---- */
  for(var chi=0; chi<chests.length; chi++){
    var c=chests[chi];
    if(!c.open){
      if(player && !player.dead){
        var cdx=player.group.position.x-c.x, cdz=player.group.position.z-c.z;
        if(cdx*cdx+cdz*cdz<6.8){
          c.open=true; c.lid.rotation.x=-1.85; c.lid.position.z=-0.25; c.glint.visible=false;
          var cg=Math.floor(rand(25,60)); EC[playerTeam].gold+=cg; Snd.coin();
          killFeedMsg('Discovery','Ancient chest — +'+cg+' gold','#e9c458');
          c.respawn=240;
        }
      }
    } else {
      c.respawn-=dt;
      if(c.respawn<=0){
        var ns=chestSpot(); c.x=ns.x; c.z=ns.z;
        c.grp.position.set(c.x, groundH(c.x,c.z), c.z);
        c.lid.rotation.x=0; c.lid.position.z=0; c.glint.visible=true;
        c.glint.position.set(c.x, groundH(c.x,c.z)+1.15, c.z);
        c.open=false;
      }
    }
  }
  /* ---- legendary relics wait for a worthy bearer ---- */
  for(var ri=0; ri<relics.length; ri++){
    var R=relics[ri];
    if(R.taken) continue;
    R.gem.rotation.y+=dt*1.4;
    R.gem.position.y=1.6+Math.sin(gameTime*2.2)*0.18;
    if(player && !player.dead){
      var rdx=player.group.position.x-R.x, rdz=player.group.position.z-R.z;
      if(rdx*rdx+rdz*rdz<9){
        R.taken=true; R.grp.visible=false;
        var rmsg='';
        if(R.def.buff==='dmg'){ player.dmg=Math.round(player.dmg*1.28); rmsg='+28% damage forever'; }
        else if(R.def.buff==='spd'){ player.speed*=1.18; rmsg='+18% speed forever'; }
        else { player.maxHp+=50; player.hp=player.maxHp; rmsg='+50 max health, fully healed'; }
        Snd.victory();
        showBanner(R.def.name+' claimed!', rmsg, 3);
        killFeedMsg('Legend', R.def.name+' — '+rmsg, '#ffd24d');
      }
    }
  }
  /* ---- wolves wake at nightfall ---- */
  wolfTimer-=dt;
  if(DN.night>0.75 && wolfTimer<=0){
    wolfTimer=42;
    var wcount=0;
    entities.forEach(function(en){ if(en.kind==='wolf'&&!en.dead) wcount++; });
    if(wcount<4 && player && !player.dead){
      var wa=rand(0,TAU), wr2=rand(130,220);
      var wx=player.group.position.x+Math.cos(wa)*wr2, wz=player.group.position.z+Math.sin(wa)*wr2;
      if(Math.abs(wx)<WORLD.half-10&&Math.abs(wz)<WORLD.half-10){
        spawnWolf(wx,wz); spawnWolf(wx+rand(-6,6), wz+rand(-6,6));
        killFeedMsg('Night','Wolves prowl the darkness…','#c56b4a');
      }
    }
  }
}

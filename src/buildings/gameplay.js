/* ------------------------------------------------------------
   gameplay.js — building functions: barracks, temple, hall, homes
   ------------------------------------------------------------ */
var buildingBonusT=0;
function updateBuildingBonuses(dt){
  buildingBonusT-=dt;
  if(buildingBonusT>0) return;
  buildingBonusT=1.2;
  if(!player || player.dead || !playerTeam) return;
  var px=player.group.position.x, pz=player.group.position.z;
  var td=typeof townData!=='undefined'?townData[playerTeam]:null;
  if(!td) return;
  // Hall: treasury + command center
  if(td.hall){
    var dx=px-td.hall.x, dz=pz-td.hall.z;
    if(dx*dx+dz*dz<35*35){
      EC[playerTeam].gold+=0.8;
      if(typeof kingAuraT!=='undefined') kingAuraT=Math.max(kingAuraT, 2);
      if(Math.random()<0.08) killFeedMsg('Hall', 'Command center: +treasury, morale aura', '#e9c458');
    }
  }
  // Barracks: recruit bonus
  if(td.barracks){
    var bx=px-td.barracks.x, bz=pz-td.barracks.z;
    if(bx*bx+bz*bz<28*28){
      // reduce muster cost slightly when near barracks
      if(typeof _barracksDiscount==='undefined') window._barracksDiscount=0;
      window._barracksDiscount=0.15;
      if(Math.random()<0.07) killFeedMsg('Barracks', 'Near barracks: -15% recruit cost, +training', '#7ec97e');
    } else {
      window._barracksDiscount=0;
    }
  }
  // Temple/Church: morale + recovery
  if(td.temple){
    var tx=px-td.temple.x, tz=pz-td.temple.z;
    if(tx*tx+tz*tz<30*30){
      player.hp=Math.min(player.maxHp, player.hp+0.6);
      player.stamina=Math.min(100, player.stamina+1.2);
      if(Math.random()<0.06) killFeedMsg('Temple', 'Sacred ground: +recovery, +morale', '#8ab8e0');
    }
  }
  // Homes: population/manpower contribution already via zone income, but give small passive when near any settlement
  if(typeof SETTLEMENTS!=='undefined'){
    for(var i=0;i<SETTLEMENTS.length;i++){
      var s=SETTLEMENTS[i];
      var dx2=px-s.x, dz2=pz-s.z;
      if(dx2*dx2+dz2*dz2<22*22){
        EC[playerTeam].gold+=0.15;
        break;
      }
    }
  }
}

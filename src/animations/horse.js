function updateHorse(){
  if(!player||player.dead){if(kingHorse)kingHorse.visible=false;return;}
  if(player.riding&&!player.dead&&state===ST.PLAY){
    if(!kingHorse||!kingHorse.visible)return;
    var gy=groundH(player.group.position.x, player.group.position.z);
    kingHorse.position.set(player.group.position.x, gy, player.group.position.z);
    kingHorse.rotation.y=player.yaw;
    var amt=player.movingAmt, w=player.walk, L=kingHorse.userData.legs;
    var s=Math.sin(w*1.1)*0.6*amt;
    L.fl.rotation.x=s; L.br.rotation.x=s; L.fr.rotation.x=-s; L.bl.rotation.x=-s;
    player.group.position.y=gy+1.42+Math.abs(Math.sin(w*1.1))*0.09*amt;
    var P=player.parts;
    P.legL.hip.rotation.x=-1.02; P.legR.hip.rotation.x=-1.02;
    P.legL.knee.rotation.x=1.12; P.legR.knee.rotation.x=1.12;
  }
}

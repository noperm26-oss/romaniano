/* Optional attachment animation contract: custom weapons can omit bowString. */
function updateWeaponPose(weapon,draw){
  var string=weapon.userData.bowString;if(!string)return;
  var positions=string.geometry.attributes.position;
  positions.setZ(1,-0.06-0.22*clamp(draw,0,1));positions.needsUpdate=true;
}

/* Custom builders must return the R15 joint contract described in docs/EDITING.md. */
var CHARACTER_RIGS={warrior:buildWarrior};
function buildCharacter(spec){
  var factory=CHARACTER_RIGS[spec.rig||'warrior'];
  if(!factory)throw new Error('Unknown character rig: '+spec.rig);
  if(spec.weapon)weaponDefinition(spec.weapon);
  var built=factory(spec);
  if(!built||!built.group||!built.body||!built.parts)throw new Error('Character builder is missing group/body/parts');
  ['armL','armR'].forEach(function(k){['sh','el','wr'].forEach(function(j){if(!built.parts[k]||!built.parts[k][j])throw new Error('Missing rig joint '+k+'.'+j);});});
  ['legL','legR'].forEach(function(k){['hip','knee'].forEach(function(j){if(!built.parts[k]||!built.parts[k][j])throw new Error('Missing rig joint '+k+'.'+j);});});
  if(!built.parts.head)throw new Error('Missing rig head');
  return built;
}
function validateCharacters(){
  FAC_KEYS.forEach(function(f){Object.keys(FACS[f].classes).forEach(function(k){
    var def=FACS[f].classes[k];
    ['hp','dmg','speed','range','cd','cost'].forEach(function(stat){if(!Number.isFinite(def[stat])||def[stat]<=0)throw new Error(f+'.'+k+': invalid '+stat);});
    weaponDefinition(def.spec.weapon);
  });});
}

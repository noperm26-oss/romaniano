/* ---------------- input ---------------- */
var keys={};
var mouse={dx:0, dy:0, wantAttack:false};
var camYaw=Math.PI, camPitch=-0.08, locked=false;
var dragLook=false, everLocked=false;
function resetInput(){
  Object.keys(keys).forEach(function(key){keys[key]=false;});mouse.dx=0;mouse.dy=0;mouse.wantAttack=false;
  if(player){player.aiming=false;player.blocking=false;}
}
function overlayActive(){return recruitOpen||warmapOpen||settingsOpen;}
function editableTarget(target){return target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));}
window.addEventListener('keydown',function(ev){
  if(editableTarget(ev.target))return;
  if(ev.code==='F2'){if(!ev.repeat){$('actionbar').classList.toggle('hidden');showHint('Button panel toggled · F2 · all keyboard controls remain active',2);}ev.preventDefault();return;}
  if(ev.code==='Escape'){
    if(settingsOpen)toggleSettings(false);else if(recruitOpen)toggleRecruit();else if(warmapOpen)toggleWarmap();else if(state===ST.PLAY)pauseGame();else if(state===ST.PAUSE)resumeGame();
    resetInput();return;
  }
  if(ev.repeat)return;
  if(ev.code==='KeyM'){var on=Snd.toggleMusic();showHint(on?'Music ON (M)':'Music OFF (M)',1.2);return;}
  if(state!==ST.PLAY)return;
  if(ev.code==='KeyB'){performAction('muster');return;}
  if(ev.code==='KeyT'){performAction('map');return;}
  if(overlayActive())return;
  var actions={KeyG:'rally',KeyQ:'scope',KeyH:'ride',Digit1:'follow',Digit2:'defend',Digit3:'attack',Digit4:'halt',Numpad1:'follow',Numpad2:'defend',Numpad3:'attack',Numpad4:'halt'};
  if(actions[ev.code]){performAction(actions[ev.code]);return;}
  keys[ev.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code))ev.preventDefault();
});
window.addEventListener('keyup',function(ev){keys[ev.code]=false;});
window.addEventListener('blur',resetInput);
document.addEventListener('visibilitychange',function(){if(document.hidden)resetInput();});
window.addEventListener('mousemove',function(ev){
  if(state!==ST.PLAY||overlayActive())return;
  if(locked||dragLook){mouse.dx+=ev.movementX||0;mouse.dy+=ev.movementY||0;}
});
canvas.addEventListener('mousedown',function(ev){
  Snd.init();Snd.resume();if(state!==ST.PLAY||overlayActive())return;
  if(ev.button===0){if(!locked&&!dragLook)tryLock();mouse.wantAttack=true;}
  if(ev.button===2&&player&&!player.dead){if(player.ranged)player.aiming=true;else player.blocking=true;}
});
window.addEventListener('mouseup',function(ev){if(ev.button===2&&player){player.aiming=false;player.blocking=false;}});
canvas.addEventListener('contextmenu',function(ev){ev.preventDefault();});
function tryLock(){
  if(locked || dragLook) return;
  try{
    var p=canvas.requestPointerLock();
    if(p && p.catch) p.catch(function(){ if(!everLocked) dragLook=true; });
  }catch(e){ if(!everLocked) dragLook=true; }
}
document.addEventListener('pointerlockchange', function(){
  locked = (document.pointerLockElement===canvas);
  if(locked) everLocked=true;
  if(!locked && state===ST.PLAY && !dragLook && !recruitOpen && !warmapOpen && !settingsOpen && !afkMode) pauseGame();
});
document.addEventListener('pointerlockerror', function(){
  if(!everLocked) dragLook=true;
  else if(state===ST.PLAY) showHint('Click to capture the mouse', 2.5);
});

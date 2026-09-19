function performAction(action){
  if(action==='hide'){$('actionbar').classList.add('hidden');return;}
  if(state!==ST.PLAY)return;
  if(action==='muster'){resetInput();if(warmapOpen)toggleWarmap();if(settingsOpen)toggleSettings(false);toggleRecruit();return;}
  if(action==='map'){resetInput();if(recruitOpen)toggleRecruit();if(settingsOpen)toggleSettings(false);toggleWarmap();return;}
  if(overlayActive())return;
  if(['follow','defend','attack','halt'].includes(action))issueOrder(action);
  else if(action==='scope')cycleScope();
  else if(action==='ride')toggleRide();
  else if(action==='rally')doRally();
  else if(action==='afk')toggleAfk();
  else if(action==='pause')pauseGame();
  else if(action==='strike')mouse.wantAttack=true;
  else if(action==='block'&&player){if(player.ranged)player.aiming=!player.aiming;else player.blocking=!player.blocking;}
}
$('actionbar').addEventListener('click',function(ev){var button=ev.target.closest('[data-action]');if(button)performAction(button.dataset.action);});

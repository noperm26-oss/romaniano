/* ---------------- UI wiring ---------------- */
$('btn-begin').addEventListener('click', function(){ if(!WORLD_READY) return; Snd.init(); Snd.click(); toFaction(); });
$('btn-back-fac').addEventListener('click', function(){ Snd.click(); toMenu(); });
$('btn-back').addEventListener('click', function(){ Snd.click(); toFaction(); });
$('btn-spawn').addEventListener('click', function(){
  if(!selectedRole) return;
  Snd.click();
  beginCampaign();
});
$('btn-rd-spawn').addEventListener('click', function(){
  if(!selectedRole) return;
  Snd.click();
  deployAgain();
});
$('btn-resume').addEventListener('click', function(){ Snd.click(); resumeGame(); });
$('btn-abandon').addEventListener('click', function(){ Snd.click(); toMenu(); });
$('btn-rd-abandon').addEventListener('click', function(){ Snd.click(); toMenu(); });
$('btn-menu').addEventListener('click', function(){ Snd.click(); toMenu(); });
$('btn-new').addEventListener('click', function(){ Snd.click(); newCampaign(); });
$('btn-recruit-close').addEventListener('click', function(){ Snd.click(); toggleRecruit(); });

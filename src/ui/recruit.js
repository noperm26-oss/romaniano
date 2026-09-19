/* ---------------- recruit panel (the King's muster) + upkeep + kingdom mods ---------------- */
var overlayRecruit, recruitOpen=false;
function buildRecruitList(){
  var F=FACS[playerTeam];
  var defs=RECRUIT_DEFS[playerTeam];
  var list=$('recruit-list');
  var html='';
  var mod=typeof kingdomMod!=='undefined'?kingdomMod(playerTeam):null;
  Object.keys(defs).forEach(function(k){
    var d=defs[k];
    function pips(n){ var s=''; for(var i=1;i<=5;i++) s+='<i class=\"'+(i<=n?'on':'')+'\"></i>'; return s; }
    var price=(typeof musterCost==='function')?musterCost(playerTeam,k):d.cost;
    var afford=EC[playerTeam].gold>=price;
    var kmBonus='';
    if(mod){
      if(k.indexOf('arch')>=0 || k.indexOf('bow')>=0 || k.indexOf('sag')>=0 || k.indexOf('tox')>=0){
        if(mod.name==='Kemet' || mod.name==='Nippon') kmBonus=' | Kingdom bonus';
      }
      if(mod.infantry!==1) kmBonus=' | Inf ×'+mod.infantry.toFixed(2);
    }
    if(price!==d.cost) kmBonus+=' | faction price';
    html+='<div class=\"card recruit-card'+(afford?'':' poor')+'\" data-key=\"'+k+'\">'
      +'<div class=\"card-icon\">'+ICONS[d.icon]+'</div>'
      +'<h3>'+d.name+'</h3>'
      +'<p class=\"tag\">'+d.tag+kmBonus+'</p>'
      +'<div class=\"stat\"><label>Health</label><span class=\"pips\">'+pips(d.stats.hp)+'</span></div>'
      +'<div class=\"stat\"><label>Damage</label><span class=\"pips\">'+pips(d.stats.dmg)+'</span></div>'
      +'<p class=\"cost\">gold '+(price!==d.cost?d.cost+' → '+price:price)+'</p>'
      +'</div>';
  });
  list.innerHTML=html;
  $('recruit-treasury').textContent=Math.floor(EC[playerTeam].gold);
  var army=teamAliveCount(playerTeam);
  $('recruit-count').textContent=army+' / unlimited';
  var upkeepEl=$('recruit-upkeep');
  if(upkeepEl){
    var up=typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(playerTeam):0;
    var inc=typeof incomeRate!=='undefined'?incomeRate(playerTeam):0;
    upkeepEl.textContent=up.toFixed(1)+' (net '+(inc-up).toFixed(1)+')';
  }
  /* keep the auto-buy troop picker in sync */
  var selA=$('autobuy-sel');
  if(selA){
    autobuyKey();
    selA.innerHTML='';
    Object.keys(defs).forEach(function(k){
      var o=document.createElement('option');
      var pc=(typeof musterCost==='function')?musterCost(playerTeam,k):defs[k].cost;
      o.value=k; o.textContent=defs[k].name+' ('+pc+'g)';
      if(k===AUTOBUY.key) o.selected=true;
      selA.appendChild(o);
    });
    updAutobuyUI();
  }
  Array.prototype.forEach.call(list.querySelectorAll('.recruit-card'), function(card){
    card.addEventListener('click', function(){
      var key=card.getAttribute('data-key');
      var d=RECRUIT_DEFS[playerTeam][key];
      var buyPrice=(typeof musterCost==='function')?musterCost(playerTeam,key):d.cost;
      if(EC[playerTeam].gold < buyPrice){ showHint('Not enough gold — hold territory to earn more (upkeep: '+(typeof armyUpkeepCost!=='undefined'?armyUpkeepCost(playerTeam).toFixed(1):'0')+'/s)', 2.5); return; }
      EC[playerTeam].gold-=buyPrice;
      doMuster(playerTeam, key, true);
      buildRecruitList();
    });
  });
}
function teamAliveCount(team){
  var n=0;
  entities.forEach(function(e){ if(!e.dead&&!e.passive&&e.team===team) n++; });
  return n;
}
function toggleRecruit(){
  recruitOpen=!recruitOpen;
  if(recruitOpen){
    buildRecruitList();
    show(overlayRecruit);
    if(document.pointerLockElement) document.exitPointerLock();
  } else {
    hide(overlayRecruit);
    if(state===ST.PLAY) tryLock();
  }
}

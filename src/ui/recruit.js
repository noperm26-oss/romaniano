/* ---------------- recruit panel (the King's muster) ---------------- */
var overlayRecruit, recruitOpen=false;
function buildRecruitList(){
  var F=FACS[playerTeam];
  var defs=RECRUIT_DEFS[playerTeam];
  var list=$('recruit-list');
  var html='';
  Object.keys(defs).forEach(function(k){
    var d=defs[k];
    function pips(n){ var s=''; for(var i=1;i<=5;i++) s+='<i class="'+(i<=n?'on':'')+'"></i>'; return s; }
    var afford=EC[playerTeam].gold>=d.cost;
    html+='<div class="card recruit-card'+(afford?'':' poor')+'" data-key="'+k+'">'
      +'<div class="card-icon">'+ICONS[d.icon]+'</div>'
      +'<h3>'+d.name+'</h3>'
      +'<p class="tag">'+d.tag+'</p>'
      +'<div class="stat"><label>Health</label><span class="pips">'+pips(d.stats.hp)+'</span></div>'
      +'<div class="stat"><label>Damage</label><span class="pips">'+pips(d.stats.dmg)+'</span></div>'
      +'<p class="cost">gold '+d.cost+'</p>'
      +'</div>';
  });
  list.innerHTML=html;
  $('recruit-treasury').textContent=Math.floor(EC[playerTeam].gold);
  $('recruit-count').textContent=teamAliveCount(playerTeam)+' / unlimited';
  /* v9: keep the auto-buy troop picker in sync */
  var selA=$('autobuy-sel');
  if(selA){
    autobuyKey();
    selA.innerHTML='';
    Object.keys(defs).forEach(function(k){
      var o=document.createElement('option');
      o.value=k; o.textContent=defs[k].name+' ('+defs[k].cost+'g)';
      if(k===AUTOBUY.key) o.selected=true;
      selA.appendChild(o);
    });
    updAutobuyUI();
  }
  Array.prototype.forEach.call(list.querySelectorAll('.recruit-card'), function(card){
    card.addEventListener('click', function(){
      var key=card.getAttribute('data-key');
      var d=RECRUIT_DEFS[playerTeam][key];
      if(EC[playerTeam].gold < d.cost){ showHint('Not enough gold — hold territory to earn more', 2.5); return; }
      /* v8.2: player army is UNLIMITED — old TEAM_CAP check removed (bots are capped by aiCap, not you) */
      EC[playerTeam].gold-=d.cost;
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

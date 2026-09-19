/* ---------------- icons ---------------- */
var ICONS={
  sword:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 25 L19 13"/><path d="M19 13 L25 4 L28 7 L21 15 Z" fill="currentColor"/><path d="M6 20 L12 26"/><path d="M4 24 L8 28"/></g></svg>',
  spear:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 27 L24 8"/><path d="M22 4 L28 4 L28 10" fill="currentColor"/><path d="M8 20 L12 24"/></g></svg>',
  bow:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4 C18 8 18 24 8 28"/><path d="M8 4 L8 28"/><path d="M8 16 L27 16"/><path d="M24 13 L27 16 L24 19"/></g></svg>',
  axe:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 28 L16 10"/><path d="M12 6 C18 2 24 4 26 10 C20 12 14 12 12 10 Z" fill="currentColor"/></g></svg>'
};
var FAC_ICONS={
  lambda:'<svg viewBox="0 0 32 32"><path d="M8 27 L16 5 L24 27" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spqr:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="2"/><text x="16" y="20" text-anchor="middle" font-size="8.5" font-family="Georgia" fill="currentColor" font-weight="bold">SPQR</text></svg>',
  aurochs:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M11 13 C4 10 4 3 11 2"/><path d="M21 13 C28 10 28 3 21 2"/><ellipse cx="16" cy="18" rx="5.5" ry="8" fill="currentColor" stroke="none"/></g></svg>',
  raven:'<svg viewBox="0 0 32 32"><path d="M4 20 C10 10 20 8 27 13 L29 10 L27 17 C21 25 10 24 6 22 L3 24 Z" fill="currentColor"/><circle cx="22" cy="13" r="1.4" fill="#1a1a1a"/></svg>',
  ankh:'<svg viewBox="0 0 32 32"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><ellipse cx="16" cy="10" rx="5" ry="6"/><path d="M16 16 L16 28"/><path d="M9.5 19 L22.5 19"/></g></svg>',
  disc:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="#c0272d" stroke="currentColor" stroke-width="1.6"/></svg>'
};

/* ---------------- role cards ---------------- */
function buildRoleCards(redeploy){
  var F=FACS[curFaction];
  var gridId=redeploy?'role-grid-rd':'role-grid';
  var grid=$(gridId);
  var html='';
  Object.keys(F.classes).forEach(function(k){
    var r=F.classes[k];
    function pips(n){ var s=''; for(var i=1;i<=5;i++) s+='<i class="'+(i<=n?'on':'')+'"></i>'; return s; }
    html+='<div class="card" data-role="'+k+'">'
      +'<div class="card-icon">'+ICONS[r.icon]+'</div>'
      +'<h3>'+r.name+' <span>'+r.en+'</span></h3>'
      +'<p class="tag">'+r.tag+'</p>'
      +'<div class="stat"><label>Health</label><span class="pips">'+pips(r.stats.hp)+'</span></div>'
      +'<div class="stat"><label>Damage</label><span class="pips">'+pips(r.stats.dmg)+'</span></div>'
      +'<div class="stat"><label>Speed</label><span class="pips">'+pips(r.stats.spd)+'</span></div>'
      +'<div class="stat"><label>Reach</label><span class="pips">'+pips(r.stats.rng)+'</span></div>'
      +'<p class="desc">'+r.desc+'</p>'
      +'</div>';
  });
  var randKey=Object.keys(F.classes)[randi(0,Object.keys(F.classes).length-1)];
  html+='<div class="card random" data-role="'+randKey+'">'
    +'<div class="card-icon">'+ICONS.sword+'</div>'
    +'<h3>Fate <span>Random soldier</span></h3>'
    +'<p class="tag">Fate decides your role</p>'
    +'<p class="desc">Let fate choose who you wake up as.</p>'
    +'</div>';
  grid.innerHTML=html;
  function setBtn(roleKey, isRandom){
    var def=FACS[curFaction].classes[roleKey];
    var btn=$(redeploy?'btn-rd-spawn':'btn-spawn');
    btn.disabled=false;
    btn.textContent=isRandom
      ? 'Spawn as fate decides — Rule!'
      : (redeploy?'Redeploy as ':'Begin as ')+def.name+' — Rule!';
  }
  Array.prototype.forEach.call(grid.querySelectorAll('.card'), function(card){
    card.addEventListener('click', function(){
      Snd.init(); Snd.click();
      Array.prototype.forEach.call(grid.querySelectorAll('.card'), function(c){ c.classList.remove('sel'); });
      card.classList.add('sel');
      selectedRole=card.getAttribute('data-role');
      setBtn(selectedRole, card.classList.contains('random'));
    });
  });
}

/* ---------------- faction cards (identity-aware, spec §17/§18) ---------------- */
(function buildFactionCards(){
  var grid=$('faction-grid');
  var html='';
  FAC_KEYS.forEach(function(k){
    var F=FACS[k];
    var c=factionCfg(k);
    var s=c?c.stats:{military:5,economy:5,mobility:5,defense:5};
    var fc=c?c.color:'#6e1414';
    function fbar(label, n){
      var pct=Math.round(n/10*100);
      return '<div class="fcard-bar"><label>'+label+'</label><div class="track"><i style="width:'+pct+'%;background:linear-gradient(90deg,'+fc+',#6e1414)"></i></div></div>';
    }
    var sig=c?c.passives[c.passives.length-1].name:'';
    html+='<div class="card faction-card" data-fac="'+k+'">'
      +'<div class="card-icon" style="color:'+F.bannerBorder+'">'+FAC_ICONS[F.emblem]+'</div>'
      +'<h3 style="color:'+fc+'">'+F.name+' <span>'+(c?c.title:'')+' · '+F.sub+'</span></h3>'
      +'<p class="tag">'+(c?c.playstyle:'Kingdom economy · territory war')+'</p>'
      +'<div class="fcard-bars">'
      +fbar('Military', s.military)
      +fbar('Economy', s.economy)
      +fbar('Mobility', s.mobility)
      +fbar('Defense', s.defense)
      +'</div>'
      +'<p class="desc">'+(c?('For '+c.designedFor):F.desc)+'</p>'
      +'<p class="classes">Signature: '+(c?sig:'')+'</p>'
      +'<button class="fcard-info" data-cx="'+k+'">📖 Full codex</button>'
      +'</div>';
  });
  grid.innerHTML=html;
  Array.prototype.forEach.call(grid.querySelectorAll('.fcard-info'), function(btn){
    btn.addEventListener('click', function(ev){
      ev.stopPropagation();
      openCodex(btn.getAttribute('data-cx'));
    });
  });
  Array.prototype.forEach.call(grid.querySelectorAll('.faction-card'), function(card){
    card.addEventListener('click', function(ev){
      if(ev.target.classList && ev.target.classList.contains('fcard-info')) return;
      Snd.init(); Snd.click();
      selectedFaction=card.getAttribute('data-fac');
      toRoles();
    });
  });
})();

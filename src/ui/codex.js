/* ============================================================
   codex.js — the faction codex: the detailed information panel
   shown when choosing a faction (spec §17/§18). Selection must
   teach the player what they are choosing.
   ============================================================ */
var codexOpen=false, codexFaction=null;
function facBarRow(label, n, max){
  max=max||10;
  var pct=Math.round(n/max*100);
  return '<div class="cx-bar"><label>'+label+'</label><div class="track"><i style="width:'+pct+'%;background:linear-gradient(90deg,#a8271f,#6e1414)"></i></div><b>'+n+'/'+max+'</b></div>';
}
function buildCodex(f, keepOpen){
  var c=factionCfg(f);
  if(!c) return;
  codexFaction=f;
  codexOpen=true;
  var sub=(typeof FACS!=='undefined'&&FACS[f]&&FACS[f].sub)?FACS[f].sub:c.title;
  $('codex-title').innerHTML=c.name+' <span>— '+c.title+' · '+sub+'</span>';
  /* tabs for every kingdom */
  var tabs='';
  FAC_KEYS.forEach(function(k){
    tabs+='<button data-cx="'+k+'" class="'+(k===f?'sel':'')+'">'+FACTION_IDENTITY[k].name+'</button>';
  });
  $('codex-tabs').innerHTML=tabs;
  Array.prototype.forEach.call($('codex-tabs').querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      Snd.click();
      buildCodex(b.getAttribute('data-cx'), true);
    });
  });
  var s=c.stats;
  var html='';
  /* designed for (spec §18) */
  html+='<div class="cx-line" style="font-size:15px;font-style:italic;color:#4a3418">Designed for '+c.designedFor+'</div>';
  html+='<h4>Playstyle & identity</h4>';
  html+='<div class="cx-line"><b>Playstyle:</b> '+c.playstyle+'</div>';
  html+='<div class="cx-bars">'
    +facBarRow('Military', s.military)
    +facBarRow('Economy', s.economy)
    +facBarRow('Mobility', s.mobility)
    +facBarRow('Defense', s.defense)
    +'</div>';
  html+='<div class="cx-line"><b>Specialization:</b> '+c.specialization+'</div>';
  html+='<div class="cx-line"><b>Military:</b> '+c.militaryIdentity+'</div>';
  html+='<div class="cx-line"><b>Economy:</b> '+c.economicIdentity+'</div>';
  html+='<div class="cx-line"><b>Strategy:</b> '+c.strategicIdentity+'</div>';
  html+='<div class="cx-line"><b>AI Brain:</b> '+c.aiIdentity+'</div>';
  html+='<h4>Strengths</h4><ul class="cx-strengths">';
  c.strengths.forEach(function(x){ html+='<li>'+x+'</li>'; });
  html+='</ul>';
  html+='<h4>Weaknesses</h4><ul class="cx-weaknesses">';
  c.weaknesses.forEach(function(x){ html+='<li>'+x+'</li>'; });
  html+='</ul>';
  html+='<h4>Passives — Kingdom progression</h4>';
  c.passives.forEach(function(p){
    html+='<div class="cx-line"><b>Level '+p.level+':</b> '+p.name+' <span class="cx-level">('+(p.level===5?'unlocks the signature ability':'unlocks at '+[0,0,4,12,24,40][p.level]+' zones)')+'</span><br><span style="color:#5a4830">'+p.desc+'</span></div>';
  });
  html+='<h4>Signature ability — '+c.ability.name+' (key F)</h4>';
  html+='<div class="cx-line">'+c.ability.desc+' <span class="cx-level">Duration '+c.ability.duration+'s · cooldown '+c.ability.cooldown+'s</span></div>';
  html+='<h4>Doctrines</h4><div>';
  c.doctrines.forEach(function(d){
    html+='<span class="cx-doctrine">'+d.name+' — '+d.desc+'</span>';
  });
  html+='</div>';
  html+='<h4>Ground affinity</h4><div>';
  var terrs=Object.keys(c.terrain);
  if(terrs.length){
    terrs.forEach(function(t){
      var m=c.terrain[t], bits=[];
      if(m.move) bits.push((m.move>0?'+':'')+m.move+'% move');
      if(m.def) bits.push((m.def>0?'+':'')+m.def+' defense');
      if(m.income) bits.push((m.income>0?'+':'')+m.income+'% income');
      html+='<span class="cx-terr">'+t+' · '+bits.join(' · ')+'</span>';
    });
  } else html+='<span class="cx-terr">no special affinity</span>';
  html+='</div>';
  html+='<h4>Throne priorities (the AI Brain)</h4>';
  html+='<div class="cx-line"><b>Decision order:</b> '+c.brain.priorities+'</div>';
  html+='<div class="cx-line" style="color:#5a4830">'+c.brain.desc+'</div>';
  html+='<h4>Morale</h4>';
  html+='<div class="cx-line">'+c.morale.note+'</div>';
  $('codex-body').innerHTML=html;
  $('btn-codex-choose').classList.remove('hidden');
  $('btn-codex-choose').textContent='Take the crown of '+c.name;
  $('btn-codex-choose').onclick=function(){
    Snd.click();
    selectedFaction=codexFaction;
    hide($('codex'));
    codexOpen=false;
    toRoles();
  };
  show($('codex'));
}
function openCodex(f){
  Snd.init(); Snd.click();
  buildCodex(f||FAC_KEYS[0], false);
}
function closeCodex(){
  hide($('codex'));
  codexOpen=false;
}
$('btn-codex-open').addEventListener('click', function(){ openCodex(FAC_KEYS[0]); });
$('btn-codex-close').addEventListener('click', function(){ Snd.click(); closeCodex(); });

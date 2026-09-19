/* ============================================================
   abilities.js — the HUD ability bar: signature ability (F),
   clan tactics modes (Nippon), and doctrine selection.
   Buttons are pure UI: all logic lives in faction-abilities.js.
   ============================================================ */
var abilityBarBuilt=false, abilityBarFaction=null;
function updateAbilityBar(force){
  var bar=$('ability-bar');
  if(!bar) return;
  if(!playerTeam){
    if(abilityBarBuilt){ bar.innerHTML=''; abilityBarBuilt=false; abilityBarFaction=null; }
    return;
  }
  var c=factionCfg(playerTeam);
  if(!c) return;
  var ab=c.ability;
  var st=(typeof FAC_ABIL!=='undefined')?FAC_ABIL[playerTeam]:null;
  var lv=(typeof factionLevel==='function')?factionLevel(playerTeam):1;
  if(abilityBarFaction!==playerTeam||force){
    abilityBarFaction=playerTeam;
    var html='';
    /* signature ability */
    var abState=(st&&st.t>0)?'ab-active':((st&&st.cd>0)?'ab-cd':'ab-ready');
    if(lv<5) abState='ab-cd';
    var abLabel=ab.name;
    html+='<button data-ab="sig" class="'+abState+'" title="'+ab.desc.replace(/"/g,'&quot;')+'">'+abLabel+' · F</button>';
    /* Nippon: the four clan tactics */
    if(ab.modes){
      html+='<span class="ab-sep"></span>';
      ab.modes.forEach(function(m){
        html+='<button data-ab="'+m+'" class="ab-cd" title="Set the '+m.toUpperCase()+' tactic">'+m.charAt(0).toUpperCase()+m.slice(1)+'</button>';
      });
    }
    /* doctrines */
    html+='<span class="ab-sep"></span>';
    c.doctrines.forEach(function(d){
      var on=(FAC_DOCTRINE[playerTeam]===d.id);
      html+='<button data-doc="'+d.id+'" class="ab-doc'+(on?' on':'')+'" title="'+d.bg+'% guard / '+d.def+'% defend — '+d.desc.replace(/"/g,'&quot;')+'">'+d.name+'</button>';
    });
    bar.innerHTML=html;
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function(b){
      b.addEventListener('click', function(){
        Snd.init(); Snd.click();
        var what=b.getAttribute('data-ab');
        if(what){
          if(what!=='sig' && FAC_ABIL[playerTeam]) FAC_ABIL[playerTeam].prepMode=what;
          var r=tryActivateAbility(playerTeam, what==='sig'?null:what);
          if(!r.ok && typeof showHint!=='function') return;
          if(!r.ok) showHint(r.reason, 2.2);
        } else {
          var doc=b.getAttribute('data-doc');
          if(doc) setFactionDoctrine(playerTeam, doc);
        }
      });
    });
    abilityBarBuilt=true;
  } else {
    /* cheap per-tick refresh: states only, no rebuild */
    var sig=bar.querySelector('button[data-ab="sig"]');
    if(sig){
      var cls='ab-ready';
      if(lv<5) cls='ab-cd';
      else if(st&&st.t>0) cls='ab-active';
      else if(st&&st.cd>0) cls='ab-cd';
      sig.className=cls;
      var cdTxt=ab.name;
      if(st&&st.t>0) cdTxt=ab.name+' · '+Math.ceil(st.t)+'s';
      else if(st&&st.cd>0) cdTxt=ab.name+' · '+Math.ceil(st.cd)+'s';
      else if(lv<5) cdTxt=ab.name+' · Lv5 (40 zones)';
      sig.textContent=cdTxt+' · F';
    }
    if(ab.modes){
      ab.modes.forEach(function(m){
        var btn=bar.querySelector('button[data-ab="'+m+'"]');
        if(!btn) return;
        var active=st&&st.t>0&&st.mode===m;
        btn.className=active?'ab-active':((st&&st.cd>0&&st.t<=0)?'ab-cd':'ab-ready');
      });
    }
    Array.prototype.forEach.call(bar.querySelectorAll('button[data-doc]'), function(b){
      b.className='ab-doc'+(FAC_DOCTRINE[playerTeam]===b.getAttribute('data-doc')?' on':'');
    });
  }
}
/* F: the kingdom's signature ability (tactic chooser opens via bar for Nippon) */
window.addEventListener('keydown', function(ev){
  if(ev.code!=='KeyF'||ev.repeat) return;
  if(typeof overlayActive!=='function'||overlayActive()) return;
  if(typeof editableTarget!=='function'||editableTarget(ev.target)) return;
  if(state!==ST.PLAY||!player||player.dead||!playerTeam) return;
  var c=factionCfg(playerTeam);
  if(!c) return;
  if(c.ability.needsMode){
    /* F fires the last chosen clan tactic (defaults to Precision) */
    var mode=(FAC_ABIL[playerTeam]&&FAC_ABIL[playerTeam].prepMode)?FAC_ABIL[playerTeam].prepMode:c.ability.modes[0];
    var r2=tryActivateAbility(playerTeam, mode);
    if(!r2.ok && typeof showHint!=='function') return;
    if(!r2.ok) showHint(r2.reason, 2.2);
    return;
  }
  var r=tryActivateAbility(playerTeam, null);
  if(!r.ok && typeof showHint!=='function') return;
  if(!r.ok) showHint(r.reason, 2.2);
});

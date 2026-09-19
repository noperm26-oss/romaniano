/* ---------------- recruit defs (king's muster) ---------------- */
var RECRUIT_DEFS={};
(function(){
  FAC_KEYS.forEach(function(k){
    var F=FACS[k];
    var map={};
    Object.keys(F.classes).forEach(function(ck){ map[ck]=F.classes[ck]; });
    /* champion: elite version of the first class (spec copied by reference-preserving clone) */
    var base=F.classes[Object.keys(F.classes)[0]];
    var spec2={};
    for(var kk in base.spec) spec2[kk]=base.spec[kk];
    spec2.cloak=0xc9a227;
    spec2.armorCol=0xc9a227;
    map.champion={
      name:'Champion '+base.name, en:'Elite warrior', tag:'Champion of the realm',
      hp:Math.round(base.hp*1.35), dmg:Math.round(base.dmg*1.35), speed:base.speed*1.04,
      range:base.range, cd:base.cd*0.9, block:Math.min(0.85, base.block+0.15),
      cost:230, icon:base.icon, ranged:base.ranged,
      desc:'The finest warrior of the realm, armoured head to toe. Costly — and worth it.',
      stats:{hp:5,dmg:5,spd:3,rng:base.stats.rng},
      spec:spec2
    };
    RECRUIT_DEFS[k]=map;
  });
})();

/* samurai back-banner (sashimono) */
(function(){
  FAC_KEYS.forEach(function(k){
    var F=FACS[k];
    if(F.classes.samurai) F.classes.samurai.spec.backBanner=F.bannerTex;
    var ch=RECRUIT_DEFS[k].champion;
    if(ch && ch.spec.helm==='kabuto') ch.spec.backBanner=F.bannerTex;
  });
})();

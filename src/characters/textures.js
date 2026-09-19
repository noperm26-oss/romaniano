
/* resolve shield textures + banners */
function resolveFactionTextures(){
  FAC_KEYS.forEach(function(k){
    var F=FACS[k];
    F.bannerTex=makeBannerTex(F.bannerBg, F.bannerBorder, F.emblem);
    F.bannerTex2=makeBannerTex(F.emblem==='aurochs'?'#1f3a6e':F.bannerBg, F.bannerBorder, F.emblem==='aurochs'?'star':F.emblem);
    Object.keys(F.classes).forEach(function(ck){
      var c=F.classes[ck];
      var st=c.spec.shieldTex;
      if(st===null || typeof st==='string' && ['aurochsW','starDark','raven','spqrLight'].indexOf(st)<0){
        c.spec.shieldTex=emblemTex(F.bannerBg, true, F.emblem, F.bannerBorder);
      }
    });
  });
  /* enemy-flavoured textures used by specific classes */
  FAC_KEYS.forEach(function(k){
    var F=FACS[k];
    Object.keys(F.classes).forEach(function(ck){
      var c=F.classes[ck];
      var st=c.spec.shieldTex;
      if(st==='aurochsW') c.spec.shieldTex=emblemTex('#e0d8c4', true, 'aurochs', '#c9a227');
      else if(st==='starDark') c.spec.shieldTex=emblemTex('#3a3f46', true, 'star', '#c9a227');
      else if(st==='raven') c.spec.shieldTex=emblemTex('#50565e', false, 'raven', '#e8e4da');
      else if(st==='spqrLight') c.spec.shieldTex=emblemTex('#9a2a2a', false, 'spqr', '#c9a227');
    });
  });
}
resolveFactionTextures();

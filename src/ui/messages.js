/* ---------------- HUD ---------------- */
var loreNow=null;
var hudEls={
  hp:$('hp-fill'), st:$('st-fill'), score:$('score-n'),
  kills:$('kills-n'), zonesN:$('zones-n'), goldN:$('gold-n'), armyN:$('army-n'),
  roleName:$('role-name'), roleIcon:$('role-icon'),
  crosshair:$('crosshair'), hint:$('hint'), vignette:$('vignette'),
  banner:$('banner'), bannerTitle:$('banner-title'), bannerSub:$('banner-sub'),
  conq:$('conq-bar'), conqLabels:$('conq-labels'), fac:$('fac-name'),
  feed:$('killfeed'), mini:$('minimap'),
  rally:$("rally-chip"),
  cmd:$("cmdbar"),
  lore:$("lore"),
  loreName:$("lore-name"),
  loreSub:$("lore-sub"),
  loreStory:$("lore-story"),
};
var hintTimer=0;
function showHint(text, dur){
  hudEls.hint.textContent=text;
  hudEls.hint.classList.add('show');
  hintTimer=dur||3;
}
var bannerTimer=0;
function showBanner(title, sub, dur){
  hudEls.bannerTitle.textContent=title;
  hudEls.bannerSub.textContent=sub;
  hudEls.banner.classList.add('show');
  bannerTimer=dur||2.5;
}

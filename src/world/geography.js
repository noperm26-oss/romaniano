/* ---------------- the vast world (×1000 the old arena) ---------------- */
var WORLD = {half:3000};            /* 6,000 × 6,000 units — dense & walkable (v7) */
var ZN = 16, ZS = 375;             /* 16×16 ownership zones of 375u = 256 */

var FLATS = [
  {x:0,    z:0,    r:430, h:0},
  {x:900,  z:-900, r:160, h:1.2},
  {x:-900, z:-900, r:160, h:1.2},
  {x:900,  z:900,  r:160, h:1.2},
  {x:-900, z:900,  r:160, h:1.2},
  {x:-250, z:-2250,r:160, h:1.2},
  {x:250,  z:2250, r:160, h:1.2},
  {x:575,  z:850,  r:30, h:1.2},
  {x:915,  z:570,  r:34, h:1.2},
  {x:990,  z:705,  r:24, h:1.2},
  {x:635,  z:950,  r:28, h:1.2},
  {x:805,  z:710,  r:21, h:1.2},
  {x:710,  z:680,  r:19, h:1.2},
  {x:580,  z:-850, r:32, h:1.2},
  {x:-580, z:-850, r:27, h:1.2},
  {x:-580, z:850,  r:29, h:1.2},
  {x:-465, z:-2080,r:29, h:1.2},
  {x:465,  z:2080, r:29, h:1.2}
];
var FAC_KEYS_T=['sparta','rome','moldavia','vikings','egypt','nippon'];
/* six nation homelands (world coords) — roads & territories anchor here */
var TOWNS={
  sparta:  {x: 900, z:-900},
  rome:    {x:-900, z:-900},
  moldavia:{x: 900, z: 900},
  vikings: {x:-900, z: 900},
  egypt:   {x:-250, z:-2250},
  nippon:  {x: 250, z: 2250}
};
/* 24 free villages — the wilds are worth exploring; their fields pay whoever holds the land */
var VNAMES=['Săcele','Bălți','Rădăuți','Huși','Tecuci','Trotuș','Baia','Siret','Cârlig','Gurahonț','Vama','Oituz','Șomuz','Prut','Sucevița','Humor','Moldovița','Neamț','Tazlău','Bistrița','Horaiț','Agapia','Vorona','Dorna'];
var VILLAGES=[
  {x:475,z:-210},{x:-440,z:190},{x:210,z:450},{x:-230,z:-440},
  {x:1200,z:125},{x:-1225,z:-75},{x:90,z:-1200},{x:-110,z:1175},
  {x:1300,z:-800},{x:-1300,z:750},{x:750,z:1300},{x:-750,z:-1300},
  {x:1650,z:-400},{x:-1650,z:350},{x:350,z:1650},{x:-400,z:-1650},
  {x:1800,z:1000},{x:-1800,z:-1000},{x:1000,z:-1800},{x:-1000,z:1800},
  {x:1900,z:-1900},{x:-1900,z:1900},{x:-700,z:-1900},{x:700,z:1900}
];
VNAMES.forEach(function(n,i){ VILLAGES[i].name=n; VILLAGES[i].zone=-1; });

function distToSeg(px,pz, ax,az, bx,bz){
  var dx=bx-ax, dz=bz-az;
  var t=((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz);
  t=clamp(t,0,1);
  var cx=ax+dx*t, cz=az+dz*t;
  var ex=px-cx, ez=pz-cz;
  return Math.sqrt(ex*ex+ez*ez);
}
function baseH(x,z){
  return 7*Math.sin(x*0.0022+1.3)*Math.cos(z*0.0019-0.7)
       + 3.5*Math.sin(x*0.0061-2.1)*Math.sin(z*0.0053+0.4)
       + 1.1*Math.sin(x*0.017)*Math.cos(z*0.015)
       + 0.35*Math.sin(x*0.045+3)*Math.sin(z*0.038+1);
}
VILLAGES.forEach(function(v){ FLATS.push({x:v.x, z:v.z, r:44, h:baseH(v.x,v.z)}); });
function groundH(x,z){
  var h=baseH(x,z);
  for(var i=0;i<FLATS.length;i++){
    var f=FLATS[i];
    var dx=x-f.x, dz=z-f.z;
    var d2=dx*dx+dz*dz;
    if(d2 < f.r*f.r*2.25){
      var d=Math.sqrt(d2);
      var k=1-clamp((d-f.r)/(f.r*0.5),0,1);
      k=k*k*(3-2*k);
      h=h*(1-k)+f.h*k;
    }
  }
  return h;
}

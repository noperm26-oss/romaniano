/* ---------------- ROMANIAN MEDIEVAL WAR WORLD — EXTENDED 2× EDITION ----------------
   6000×6000 world, now twice as detailed, twice as expansive.
   Regions: Carpathian Ridge, Transylvanian Heartland, Wallachian Lowlands,
   Moldavian Borderlands, Southern Trade Route, Capital Romaria, Battlefields, Secrets
*/
var WORLD = {half:3000};            /* 6,000 × 6,000 units — preserved for tests */
var ZN = 16, ZS = 375;             /* 16×16 ownership zones of 375u = 256 */

/* ---------- REGION DEFINITIONS (extended lore) ---------- */
var WORLD_REGIONS = {
  carpathian: { name:'Northern Carpathian Ridge', x0:-3000, x1:3000, z0:-3000, z1:-1800, h:6000, w:1200, color:'mountain' },
  transylvanian:{ name:'Transylvanian Heartland', x0:-3000, x1:-700, z0:-1800, z1:200, h:2000, w:2300, color:'heartland' },
  wallachian: { name:'Wallachian Lowlands', x0:-2800, x1:800, z0:200, z1:2200, h:2000, w:3600, color:'lowlands' },
  moldavian:  { name:'Moldavian Borderlands', x0:700, x1:3000, z0:-1800, z1:400, h:2200, w:2300, color:'border' },
  trade_route:{ name:'Southern Trade Route', x0:-3000, x1:3000, z0:2000, z1:3000, h:1000, w:6000, color:'trade' },
  capital:    { name:'Capital City Romaria', x0:-1000, x1:1000, z0:-1000, z1:1000, h:2000, w:2000, color:'capital' },
  battlefield:{ name:'Scattered Battlefields', x0:-3000, x1:3000, z0:-3000, z1:3000, h:6000, w:6000, color:'battle' }
};

function getRegion(x,z){
  if(z <= -1800) return 'carpathian';
  if(z >= 2000) return 'trade_route';
  if(Math.abs(x) < 1000 && Math.abs(z) < 1000) return 'capital';
  if(x < -700 && z < 200) return 'transylvanian';
  if(x > 700 && z < 400) return 'moldavian';
  if(z > 100 && x > -2800) return 'wallachian';
  return 'battlefield';
}
function getRegionInfo(x,z){
  var id = getRegion(x,z);
  return WORLD_REGIONS[id] || WORLD_REGIONS.battlefield;
}

/* ---------- FLATS: keep capitals walkable, flatten towns & villages ---------- */
var FLATS = [
  {x:0,    z:0,    r:520, h:1.2},   /* Romaria capital — massive flat */
  {x:-1800,z:-800, r:190, h:2.5},   /* Ardealburg — Transylvanian */
  {x:-1400,z:1300, r:190, h:0.8},   /* Cetatea Dunarii — Wallachian */
  {x:1700, z:-700, r:190, h:2.8},   /* Hotarul de Nord — Moldavian */
  {x:0,    z:-2400,r:200, h:6.5},   /* Stanca de Fier — Carpathian */
  {x:0,    z:2500, r:180, h:0.5},   /* Drumul Lung — Trade Route */
  {x:0,    z:0,    r:430, h:0},     /* central field (kept for legacy) */
  /* extended landmarks flats */
  {x:575,  z:850,  r:32, h:1.2},
  {x:915,  z:570,  r:36, h:1.2},
  {x:990,  z:705,  r:28, h:1.2},
  {x:635,  z:950,  r:30, h:1.2},
  {x:805,  z:710,  r:22, h:1.2},
  {x:710,  z:680,  r:20, h:1.2},
  {x:580,  z:-850, r:34, h:1.2},
  {x:-580, z:-850, r:30, h:1.2},
  {x:-580, z:850,  r:32, h:1.2},
  {x:-465, z:-2080,r:32, h:5.5},
  {x:465,  z:2080, r:32, h:0.6},
  /* new extended flats */
  {x:-2200,z:-2000,r:110, h:7.2}, /* Carpathian Monastery Sfantul Andrei */
  {x:2200, z:-1900,r:90,  h:6.8}, /* Frostwind Pass */
  {x:-2100,z:-400, r:100, h:2.2}, /* Valea Lupilor */
  {x:2100, z:200,  r:95,  h:1.5}, /* Codrul Vechi */
  {x:-2200,z:1800, r:110, h:0.9}, /* Wallachian War Camp */
  {x:2200, z:2200, r:100, h:0.4}, /* Southern caravan */
  {x:0,    z:-1500,r:85,  h:4.2}, /* Hermit Cave */
  {x:1200, z:0,    r:80,  h:1.8}  /* Wolf shrine */
];

var FAC_KEYS_T=['sparta','rome','moldavia','vikings','egypt','nippon'];
/* six nation homelands — repositioned to match extended Romanian world */
var TOWNS={
  sparta:  {x:-1800, z:-800,  name:'Ardealburg', region:'transylvanian', desc:'Transylvanian Heartland — fortified town, vineyards, scribes'},
  rome:    {x:-1400, z:1300,  name:'Cetatea Dunarii', region:'wallachian', desc:'Wallachian Lowlands — 20m stone walls, moat, war camps'},
  moldavia:{x:1700,  z:-700,  name:'Hotarul de Nord', region:'moldavian', desc:'Moldavian Borderlands — border fort, Codrul Vechi forest village'},
  vikings: {x:0,     z:-2400, name:'Stanca de Fier', region:'carpathian', desc:'Northern Carpathian Ridge — iron-reinforced mountain fort'},
  egypt:   {x:0,     z:2500,  name:'Drumul Lung', region:'trade_route', desc:'Southern Trade Route — inn, trade post, checkpoint'},
  nippon:  {x:0,     z:0,     name:'Romaria', region:'capital', desc:'Capital City Romaria — royal palace, cathedral, grand market'}
};

/* 32 Romanian medieval villages — extended from 24 to fill every region */
var VNAMES=[
  'Săcele','Bălți','Rădăuți','Huși','Tecuci','Trotuș','Baia','Siret',
  'Cârlig','Gurahonț','Vama','Oituz','Șomuz','Prut','Sucevița','Humor',
  'Moldovița','Neamț','Tazlău','Bistrița','Horaiț','Agapia','Vorona','Dorna',
  'Valea Lupilor','Codrul Vechi','Ardealburg-Sat','Cetatea-Sat',
  'Drumul Lung-Sat','Stanca-Sat','Romaria-Sat','Frostwind'
];
var VILLAGES=[
  /* Transylvanian Heartland */
  {x:-2100,z:-400},{x:-1600,z:-1200},{x:-2200,z:-900},{x:-1200,z:-200},
  /* Wallachian Lowlands */
  {x:-1800,z:800},{x:-1200,z:1600},{x:-600,z:900},{x:-2000,z:1300},
  /* Moldavian Borderlands */
  {x:1800,z:-1200},{x:2200,z:-400},{x:1600,z:200},{x:2100,z:-900},
  /* Carpathian Ridge */
  {x:-800,z:-2200},{x:800,z:-2100},{x:0,z:-1600},{x:-2200,z:-2000},
  /* Southern Trade Route */
  {x:-1800,z:2300},{x:1800,z:2400},{x:0,z:2200},{x:-900,z:2600},
  /* Capital Romaria outskirts */
  {x:600,z:600},{x:-600,z:600},{x:600,z:-600},{x:-600,z:-600},
  /* Battlefields & Secrets */
  {x:1300,z:-800},{x:-1300,z:750},{x:1900,z:-1900},{x:-1900,z:1900},
  {x:1200,z:125},{x:-1225,z:-75},{x:475,z:-210},{x:-440,z:190}
];
VNAMES.forEach(function(n,i){ if(VILLAGES[i]){ VILLAGES[i].name=n; VILLAGES[i].zone=-1; VILLAGES[i].region=getRegion(VILLAGES[i].x,VILLAGES[i].z); } });

function distToSeg(px,pz, ax,az, bx,bz){
  var dx=bx-ax, dz=bz-az;
  var t=((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz);
  t=clamp(t,0,1);
  var cx=ax+dx*t, cz=az+dz*t;
  var ex=px-cx, ez=pz-cz;
  return Math.sqrt(ex*ex+ez*ez);
}
function baseH(x,z){
  var region = getRegion(x,z);
  var base = 0;
  /* rolling base */
  base += 7*Math.sin(x*0.0022+1.3)*Math.cos(z*0.0019-0.7)
        + 3.5*Math.sin(x*0.0061-2.1)*Math.sin(z*0.0053+0.4)
        + 1.1*Math.sin(x*0.017)*Math.cos(z*0.015)
        + 0.35*Math.sin(x*0.045+3)*Math.sin(z*0.038+1);
  /* Carpathian Ridge: jagged limestone peaks, snow, high altitude */
  if(region==='carpathian'){
    var ridgeFactor = clamp((-1800 - z)/1200, 0, 1); // 0 at edge, 1 deep north
    base += ridgeFactor * 18
          + 9*Math.sin(x*0.0011)*Math.cos(z*0.0014)
          + 5*Math.sin(x*0.008 + z*0.005)
          + 2.5*Math.sin(x*0.04)*Math.cos(z*0.03);
    /* avalanche zones, frozen lakes */
    base += Math.sin(x*0.009+z*0.007)*1.2*ridgeFactor;
  }
  /* Transylvanian Heartland: gentle hills, vineyards */
  else if(region==='transylvanian'){
    base += 2.5*Math.sin(x*0.004)*Math.cos(z*0.003)
          + 1.2*Math.sin(x*0.02+z*0.01);
  }
  /* Wallachian Lowlands: flat, marshy, tall grass */
  else if(region==='wallachian'){
    base += 0.8*Math.sin(x*0.003+z*0.002)
          + 0.5*Math.sin(x*0.015)*Math.cos(z*0.012);
    base *= 0.6; // flatter
  }
  /* Moldavian Borderlands: rocky, dense forests, river valleys */
  else if(region==='moldavian'){
    base += 3.2*Math.sin(x*0.005)*Math.cos(z*0.004)
          + 1.8*Math.sin(x*0.018)*Math.cos(z*0.022)
          + 0.9*Math.sin(x*0.05+z*0.03);
  }
  /* Southern Trade Route: dusty, dry, slight dunes */
  else if(region==='trade_route'){
    var tradeFactor = clamp((z-2000)/1000,0,1);
    base += tradeFactor*1.5
          + 0.6*Math.sin(x*0.006)*Math.cos(z*0.008)
          + 0.3*Math.sin(x*0.03);
    base *= 0.5;
  }
  /* Capital Romaria: slightly elevated, commanding */
  else if(region==='capital'){
    base += 1.5*Math.sin(x*0.002)*Math.cos(z*0.002)
          + 0.7*Math.sin(x*0.01+z*0.01);
    base += 1.2; // capital on slight hill
  }
  /* Battlefields: scarred, uneven */
  else {
    base += 1.2*Math.sin(x*0.007)*Math.cos(z*0.006)
          + 0.8*Math.sin(x*0.025+z*0.02);
  }
  return base;
}
VILLAGES.forEach(function(v){ if(v) FLATS.push({x:v.x, z:v.z, r:48, h:baseH(v.x,v.z)}); });
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

/* ---------- EXTENDED LANDMARKS LIST FOR DISTRICTS ---------- */
var EXTENDED_LANDMARKS = [
  {x:-2200,z:-2000, name:'Manastirea Sfantul Andrei', type:'monastery', region:'carpathian'},
  {x:0,    z:-1600, name:'Pestera Pustnicului', type:'cave', region:'carpathian'},
  {x:800,  z:-2100, name:'Frostwind Pass Outpost', type:'outpost', region:'carpathian'},
  {x:-1800,z:-800,  name:'Ardealburg', type:'town', region:'transylvanian'},
  {x:-2100,z:-400,  name:'Valea Lupilor', type:'village', region:'transylvanian'},
  {x:-1400,z:1300,  name:'Cetatea Dunarii', type:'fortress', region:'wallachian'},
  {x:-2200,z:1800,  name:'Tabara de Razboi', type:'warcamp', region:'wallachian'},
  {x:1700, z:-700,  name:'Hotarul de Nord', type:'borderfort', region:'moldavian'},
  {x:2100, z:200,   name:'Codrul Vechi', type:'forestvillage', region:'moldavian'},
  {x:0,    z:2500,  name:'Drumul Lung Inn', type:'inn', region:'trade_route'},
  {x:0,    z:0,     name:'Romaria Palace', type:'capital', region:'capital'},
  {x:600,  z:600,   name:'Catedrala Sfantul Mihail', type:'cathedral', region:'capital'},
  {x:0,    z:2200,  name:'Punct Comert', type:'tradepost', region:'trade_route'},
  {x:1200, z:0,     name:'Altarul Lupului', type:'shrine', region:'moldavian'}
];

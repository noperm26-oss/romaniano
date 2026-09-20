/* ============================================================
   geography.js — ROMANIANO WORLD, ROM-MAP-SPEC-003 v3.0
   ("LEMN ȘI PIATRĂ" — wood & stone edition)
   ------------------------------------------------------------
   The 6,000 × 6,000 world is laid out from docs/ROM-MAP-SPEC-003.md.
   Coordinates: x grows east, z grows south, north is -z.
   Everything that needs a position (regions, towns, sites, villages,
   rivers, lakes, moats, bridges, roads, flags) is declared here so
   terrain, roads, buildings, lore and the campaign map agree on one
   geography.  Unit IDs (U-xx, NV-xx, NA-xx, HW/RG/CR/TR, WS, BR, CMP)
   follow the specification.
   ============================================================ */
var WORLD = {half:3000};            /* 6,000 × 6,000 units — preserved for tests */
var ZN = 16, ZS = 375;             /* 16×16 ownership zones of 375u = 256 */

function ss(e0,e1,x){ var t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
function gauss(x,z,cx,cz,sig){ var dx=x-cx, dz=z-cz; return Math.exp(-(dx*dx+dz*dz)/(2*sig*sig)); }

/* ---------- THE SEVEN REGIONS (R-01..R-07) + the secret places ---------- */
var WORLD_REGIONS = {
  carpathian:   { id:'R-01', name:'Northern Carpathian Ridge', ro:'Creasta Carpaților', x0:-3000, x1:3000, z0:-3000, z1:-1800,
                  mood:'jagged limestone spine, snow above the tree line, frozen tarns, avalanche scars, pine darkness', mapColor:'#8a9aa8' },
  transylvanian:{ id:'R-02', name:'Transylvanian Heartland', ro:'Inima Ardealului', x0:-3000, x1:-700, z0:-1800, z1:200,
                  mood:'golden wheat, vine terraces, orchards, cobbled towns, scribes', mapColor:'#7ea04a' },
  wallachian:   { id:'R-03', name:'Wallachian Lowlands', ro:'Câmpia Valahă', x0:-2800, x1:3000, z0:200, z1:2000,
                  mood:'grass seas, marsh fog, reed belts, lone oaks, the slow Little Danube', mapColor:'#6a8a3a' },
  moldavian:    { id:'R-04', name:'Moldavian Borderlands', ro:'Hotarele Moldovei', x0:700, x1:3000, z0:-1800, z1:400,
                  mood:'rocky fields, old forest, river valleys, wolves', mapColor:'#3a5a2e' },
  trade_route:  { id:'R-05', name:'Southern Trade Route', ro:'Drumul Sudului', x0:-3000, x1:3000, z0:2000, z1:3000,
                  mood:'dust, heat shimmer, caravans, wells, tolls, palms', mapColor:'#c2b08a' },
  capital:      { id:'R-06', name:'Capital City Romaria', ro:'Cetatea Romaria', x0:-1000, x1:1000, z0:-1000, z1:1000,
                  mood:'white walls on a low hill, the lion gate, boulevards, bells, the golden dome', mapColor:'#9a9a8a' },
  battlefield:  { id:'R-07', name:'Scattered Battlefields', ro:'Câmpurile de Luptă', x0:-750, x1:750, z0:-1800, z1:-1125,
                  mood:'the old Field of ruins, graves, burned villages, memorial stones', mapColor:'#6e5f43' },
  secret:       { id:'SEC', name:'Secret Places', ro:'Locuri Ascunse', x0:0, x1:0, z0:0, z1:0,
                  mood:'caves, crypts, hideouts and tunnels the maps do not show', mapColor:'#4a3a5a' }
};
/* region of a point — conforms to the 16×16 region grid of the spec (section 1.3) */
function getRegion(x,z){
  if(z < -1800) return 'carpathian';
  if(z > 2000) return 'trade_route';
  if(Math.abs(x) <= 1000 && Math.abs(z) <= 1000) return 'capital';
  if(z < -1000){ if(x < -750) return 'transylvanian'; if(x > 750) return 'moldavian'; return 'battlefield'; }
  if(x < -2700 && z > 375) return 'battlefield';          /* western rim pocket (column A, rows 10-13) */
  if(z < 200) return x < 0 ? 'transylvanian' : 'moldavian';
  if(z < 400 && x > 1000) return 'moldavian';
  return 'wallachian';
}
function getRegionInfo(x,z){ return WORLD_REGIONS[getRegion(x,z)]; }

/* ---------- SIX SEATS OF POWER ---------- */
var FAC_KEYS_T=['sparta','rome','moldavia','vikings','egypt','nippon'];
var TOWNS={
  sparta:  {x:-1800, z:-800,  name:'Ardealburg',      region:'transylvanian', kind:'walled town', id:'U-AR-01',
            desc:'Transylvanian Heartland — stone curtain, four round towers, portcullis; town hall, forge, tavern Lupul Roșu, school of scribes, guardhouse'},
  rome:    {x:-1400, z:1300,  name:'Cetatea Dunării',  region:'wallachian', kind:'fortress', id:'U-VA-01',
            desc:'Wallachian Lowlands — twenty-metre walls, four towers, moat and drawbridge, great hall, dungeon, archive, war balcony'},
  moldavia:{x:1700,  z:-700,  name:'Hotarul de Nord',  region:'moldavian', kind:'border fort', id:'U-MO-01',
            desc:'Moldavian Borderlands — palisade ring, earthworks, watchtowers, mess hall, salt warehouses on the Salt Road'},
  vikings: {x:0,     z:-2400, name:'Stânca de Fier',   region:'carpathian', kind:'mountain fort', id:'U-CA-01',
            desc:'Northern Carpathian Ridge — pentagon of iron gates, murder holes, spike field, keep, chapel, beacon over the pass'},
  egypt:   {x:0,     z:2500,  name:'Drumul Lung',      region:'trade_route', kind:'road inn', id:'U-TD-01',
            desc:'Southern Trade Route — the great inn, trade post, checkpoint, repair workshop, stables, guard barracks behind an earth rampart'},
  nippon:  {x:0,     z:0,     name:'Romaria',          region:'capital', kind:'capital', id:'R-06',
            desc:'Capital City — royal palace, Great Cathedral Sf. Mihail, grand market, river docks, four gates and the ring road'}
};

/* ---------- ROAD CLASSES (section 4.2) ---------- */
var ROAD_CLASSES={
  R0: {name:'Imperial via',   w:9.0, col:0x9a9a8a, speed:1.35, y:0.16},
  R1: {name:'Regional drum',  w:6.5, col:0x9a8555, speed:1.30, y:0.14},
  R1t:{name:'Trade artery',   w:8.0, col:0xc2b08a, speed:1.32, y:0.15},
  R2: {name:'Village lane',   w:4.0, col:0x9b8866, speed:1.20, y:0.12},
  R3: {name:'Trail',          w:2.5, col:0x8a7a5a, speed:1.10, y:0.10}
};

/* ---------- NAMED SITES (built by landmarks.js / areas.js / caves.js) ---------- */
/* r = footprint radius used for flats, spacing and lore triggers */
var SITES_DEF=[
  /* R-01 Northern Carpathian Ridge */
  {key:'sf_andrei',        id:'U-CA-02', x:-2200, z:-2000, r:110, region:'carpathian', name:'Mănăstirea Sf. Andrei', kind:'monastery'},
  {key:'frostwind_outpost',id:'U-CA-03', x:800,   z:-2170, r:60,  region:'carpathian', name:'Avanpostul Frostwind', kind:'outpost'},
  {key:'frostwind_pass',   id:'U-CA-04', x:2200,  z:-1900, r:90,  region:'carpathian', name:'Trecătoarea Frostwind', kind:'pass', noFlat:true},
  {key:'pestera',          id:'U-CA-05', x:70,    z:-1600, r:40,  region:'carpathian', name:'Peștera Pustnicului', kind:'cave'},
  {key:'wtw01',            id:'WTW-01',  x:-90,   z:-1740, r:30,  region:'carpathian', name:'Turnul de Veghe Frostwind', kind:'watchtower'},
  {key:'turnul_vantului',  id:'WTW-02',  x:-900,  z:-2650, r:40,  region:'carpathian', name:'Turnul Vântului', kind:'watchtower', flatH:'peak'},
  {key:'cripta',           id:'SEC-04',  x:-780,  z:-2260, r:50,  region:'secret', name:'Cripta Labirint', kind:'crypt', secret:true},
  {key:'cascada',          id:'SEC-05',  x:900,   z:-2000, r:24,  region:'secret', name:'Cascada Văduva Albă', kind:'waterfall', secret:true},
  {key:'carbunari',        id:'NA-04',   x:-1300, z:-2420, r:50,  region:'carpathian', name:'Cătunul Cărbunarilor', kind:'charcoal'},
  {key:'statiune',         id:'NA-09',   x:-2600, z:-2250, r:45,  region:'carpathian', name:'Stațiunea Montană', kind:'spa'},
  {key:'muntele_corbilor', id:'NA-13',   x:-1750, z:-2650, r:180, region:'carpathian', name:'Muntele Corbilor', kind:'mountain', noFlat:true},
  {key:'satul_de_sub_piatra', id:'NV-17', x:-1800, z:-2470, r:95, region:'carpathian', name:'Satul de sub Piatră', kind:'cavevillage'},
  {key:'chilia',           id:'NA-14',   x:600,   z:-2550, r:40,  region:'carpathian', name:'Chilia Săpată', kind:'hermitage'},
  {key:'ambuscada_pas',    id:'U-CA-11', x:-1250, z:-2126, r:60,  region:'carpathian', name:'Ambuscada din Pas', kind:'ambush', noFlat:true},
  {key:'depozit_inghetat', id:'U-BF-03', x:-350,  z:-1950, r:60,  region:'carpathian', name:'Depozitul Înghețat', kind:'siege', noFlat:true},
  /* R-07 the central battlefield pocket */
  {key:'campia_ruinelor',  id:'U-BF-01', x:-350,  z:-1350, r:170, region:'battlefield', name:'Câmpia Ruinelor', kind:'graves'},
  /* R-02 Transylvanian Heartland */
  {key:'valea_lupilor',    id:'U-AR-02', x:-2100, z:-400,  r:100, region:'transylvanian', name:'Valea Lupilor', kind:'village'},
  {key:'altar_ascuns',     id:'SEC-01',  x:-1200, z:-1800, r:40,  region:'secret', name:'Altarul din Stâncă', kind:'caveshrine', secret:true},
  {key:'wtw03',            id:'WTW-03',  x:-1750, z:0,     r:30,  region:'transylvanian', name:'Turnul Ardealului', kind:'watchtower'},
  {key:'cariera',          id:'NA-03',   x:-2450, z:-1100, r:80,  region:'transylvanian', name:'Cariera de Piatră', kind:'quarry'},
  {key:'stana_mare',       id:'NA-05',   x:-2600, z:-200,  r:60,  region:'transylvanian', name:'Stâna Mare', kind:'sheepfold'},
  {key:'moara_de_vant',    id:'NA-07',   x:-1300, z:-650,  r:40,  region:'transylvanian', name:'Moara de Vânt', kind:'windmill'},
  /* R-03 Wallachian Lowlands */
  {key:'war_camp',         id:'U-VA-02', x:-2200, z:1800,  r:110, region:'wallachian', name:'Tabăra de Război', kind:'warcamp'},
  {key:'cuibul_lupilor',   id:'SEC-03',  x:-110,  z:1230,  r:60,  region:'secret', name:'Cuibul Lupilor', kind:'bandits', secret:true, noFlat:true},
  {key:'manastire_parasita', id:'SEC-02', x:1400, z:1800,  r:70,  region:'secret', name:'Mănăstirea Părăsită', kind:'ruinmonastery', secret:true},
  {key:'moara_campiei',    id:'NA-01',   x:1000,  z:900,   r:70,  region:'wallachian', name:'Moara Câmpiei', kind:'windmillfarm'},
  {key:'portul',           id:'NA-08',   x:-620,  z:1420,  r:70,  region:'wallachian', name:'Portul Fluvial', kind:'riverport', noFlat:true},
  {key:'sat_ars',          id:'U-BF-02', x:-400,  z:1520,  r:110, region:'wallachian', name:'Satul Ars', kind:'burned'},
  {key:'sat_ars_est',      id:'U-BF-02b',x:1700,  z:1520,  r:110, region:'wallachian', name:'Cenușa Siretului', kind:'burned'},
  {key:'piatra_eroilor',   id:'U-BF-02c',x:150,   z:1820,  r:60,  region:'wallachian', name:'Piatra Eroilor', kind:'memorial'},
  {key:'asediu_dunarii',   id:'U-BF-02d',x:-1520, z:900,   r:120, region:'wallachian', name:'Liniile de Asediu', kind:'siege', noFlat:true},
  /* R-04 Moldavian Borderlands */
  {key:'codrul_vechi',     id:'U-MO-02', x:2100,  z:200,   r:95,  region:'moldavian', name:'Codrul Vechi', kind:'forestvillage'},
  {key:'altar_lupului',    id:'U-MO-03', x:1200,  z:0,     r:80,  region:'moldavian', name:'Altarul Lupului', kind:'wolfshrine'},
  {key:'wtw04',            id:'WTW-04',  x:1750,  z:0,     r:30,  region:'moldavian', name:'Turnul Hotarului', kind:'watchtower'},
  {key:'wtw08',            id:'WTW-08',  x:2140,  z:-470,  r:30,  region:'moldavian', name:'Turnul Codrului', kind:'watchtower'},
  {key:'tunel',            id:'SEC-07',  x:2200,  z:-600,  r:60,  region:'secret', name:'Tunelurile Contrabandiștilor', kind:'tunnels', secret:true, noFlat:true},
  {key:'ocna',             id:'NA-02',   x:2450,  z:-950,  r:80,  region:'moldavian', name:'Ocna de Jos', kind:'saltmine'},
  {key:'pestera_cristalelor', id:'NA-10', x:1750, z:-1750, r:40,  region:'secret', name:'Peștera Cristalelor', kind:'crystalcave', secret:true},
  {key:'ambuscada_codru',  id:'U-MO-07', x:1950,  z:-305,  r:70,  region:'moldavian', name:'Trecătoarea Ambuscadei', kind:'ambush', noFlat:true},
  {key:'pajistea_focului', id:'NA-12',   x:1050,  z:450,   r:60,  region:'moldavian', name:'Pajiștea Focului', kind:'firemeadow'},
  /* R-05 Southern Trade Route */
  {key:'punct_comert',     id:'U-TD-02', x:0,     z:2200,  r:70,  region:'trade_route', name:'Punct Comerț', kind:'tradepost'},
  {key:'caravanserai',     id:'U-TD-03', x:2200,  z:2200,  r:100, region:'trade_route', name:'Caravanseraiul de Sud', kind:'serai'},
  {key:'oaza',             id:'U-TD-04', x:1800,  z:2400,  r:50,  region:'trade_route', name:'Oaza de Sud', kind:'oasis', noFlat:true},
  {key:'vrajitoarea',      id:'SEC-08',  x:-600,  z:2100,  r:40,  region:'secret', name:'Coliba Vrăjitoarei', kind:'witch', secret:true},
  {key:'turn_uitat',       id:'SEC-06',  x:-2450, z:2050,  r:40,  region:'secret', name:'Turnul Uitat', kind:'lostwatchtower', secret:true},
  {key:'targul',           id:'NA-06',   x:-450,  z:2350,  r:70,  region:'trade_route', name:'Târgul de Toamnă', kind:'fair'},
  /* R-06 Capital outskirts */
  {key:'granarul',         id:'NA-11',   x:820,   z:-330,  r:70,  region:'capital', name:'Grânarul Regelui', kind:'granary'},
  /* WS waystations (hans) — 12 forward rest stops on the roads (section 4.9) */
  {key:'ws01', id:'WS-01', x:-45,   z:-1350, r:30, region:'battlefield',   name:'Hanul Pustnicului', kind:'waystation'},
  {key:'ws02', id:'WS-02', x:-1068, z:-271,  r:30, region:'transylvanian', name:'Hanul Scribilor', kind:'waystation'},
  {key:'ws03', id:'WS-03', x:1400,  z:-232,  r:30, region:'moldavian',     name:'Hanul Sării', kind:'waystation'},
  {key:'ws04', id:'WS-04', x:-870,  z:815,   r:30, region:'wallachian',    name:'Hanul Dunării', kind:'waystation'},
  {key:'ws05', id:'WS-05', x:-2200, z:2478,  r:30, region:'trade_route',   name:'Seraiul Caravanelor', kind:'waystation'},
  {key:'ws06', id:'WS-06', x:-1460, z:1790,  r:30, region:'wallachian',    name:'Hanul Pescarilor', kind:'waystation'},
  {key:'ws07', id:'WS-07', x:-2385, z:600,   r:30, region:'transylvanian', name:'Hanul Stânei', kind:'waystation'},
  {key:'ws08', id:'WS-08', x:900,   z:2640,  r:30, region:'trade_route',   name:'Hanul Oazei', kind:'waystation'},
  {key:'ws09', id:'WS-09', x:1048,  z:-1900, r:30, region:'carpathian',    name:'Hanul Trecătorii', kind:'waystation'},
  {key:'ws10', id:'WS-10', x:-1540, z:-2240, r:30, region:'carpathian',    name:'Adăpostul Crestei', kind:'waystation', hut:true},
  {key:'ws11', id:'WS-11', x:-500,  z:-2412, r:30, region:'carpathian',    name:'Adăpostul Vântului', kind:'waystation', hut:true},
  {key:'ws12', id:'WS-12', x:45,    z:1000,  r:30, region:'capital',       name:'Hanul Vadului', kind:'waystation'}
];
var SITE_BY_KEY={};
SITES_DEF.forEach(function(s){ SITE_BY_KEY[s.key]=s; });

/* ---------- 48 VILLAGES (32 ratified + NV-01..NV-16), pad r48, one lane each ---------- */
/* kit: construction kit of section 8 (CA AR VA MO TD CP BF); feat: special feature of section 7.1 */
var VILLAGES=[
  /* Transylvanian Heartland */
  {name:'Săcele',        x:-2340, z:-520,  kit:'AR'}, {name:'Bălți',        x:-1600, z:-1200, kit:'AR', feat:'fulling'},
  {name:'Rădăuți',       x:-2200, z:-900,  kit:'AR'}, {name:'Huși',         x:-1200, z:-200,  kit:'AR'},
  {name:'Pietriș',       x:-1550, z:-120,  kit:'AR'}, {name:'Cireșarii',    x:-1400, z:140,   kit:'AR', id:'NV-07', feat:'cherry'},
  {name:'Stejarii Vechi',x:-2600, z:150,   kit:'AR', id:'NV-05', feat:'oaks'}, {name:'Valea Mierii', x:-2500, z:-1400, kit:'AR', id:'NV-06', feat:'apiary'},
  /* Wallachian Lowlands */
  {name:'Tecuci',        x:-1800, z:800,   kit:'VA'}, {name:'Trotuș',       x:-1200, z:1700,  kit:'VA'},
  {name:'Baia',          x:-600,  z:900,   kit:'VA'}, {name:'Siret',        x:-2000, z:1300,  kit:'VA'},
  {name:'Gura Văii',     x:-1900, z:1900,  kit:'BF'}, {name:'Codrul Mic',   x:-1300, z:750,   kit:'BF'},
  {name:'Grindu Mare',   x:420,   z:1520,  kit:'VA', id:'NV-09', feat:'fishing'}, {name:'Balta Albă', x:-2600, z:1900, kit:'VA', id:'NV-10', feat:'marsh'},
  {name:'Nisipuri',      x:2400,  z:1900,  kit:'VA', id:'NV-11', feat:'sand'},
  /* Moldavian Borderlands */
  {name:'Cârlig',        x:1800,  z:-1200, kit:'MO'}, {name:'Gurahonț',     x:2200,  z:-400,  kit:'MO'},
  {name:'Vama',          x:1600,  z:300,   kit:'MO', feat:'customs'}, {name:'Oituz',  x:2250,  z:-800,  kit:'MO'},
  {name:'Câmpia Lupilor',x:1300,  z:-800,  kit:'BF'}, {name:'Hanul lui Iancu', x:1150, z:200, kit:'MO', feat:'inn'},
  {name:'Câmpia Sării',  x:2600,  z:-150,  kit:'MO', id:'NV-01', feat:'salt'}, {name:'Vadul Lupului', x:2600, z:-1600, kit:'MO', id:'NV-02', feat:'logbridge'},
  {name:'Livada',        x:1400,  z:430,   kit:'MO', id:'NV-08', feat:'orchard'}, {name:'Pârâul de Argint', x:1000, z:-560, kit:'MO', id:'NV-16', feat:'sluice'},
  /* Northern Carpathian Ridge */
  {name:'Șomuz',         x:-900,  z:-2140, kit:'CA'}, {name:'Prut',         x:1150,  z:-1960, kit:'CA'},
  {name:'Sucevița',      x:-90,   z:-1560, kit:'CA'}, {name:'Humor',        x:-1950, z:-2050, kit:'CA'},
  {name:'Poiana Mărului',x:1900,  z:-2010, kit:'BF'}, {name:'Creasta Cocoșului', x:1500, z:-2600, kit:'CA', id:'NV-03', feat:'crest'},
  {name:'Izvorul Rece',  x:-1500, z:-2600, kit:'CA', id:'NV-04', feat:'icehouse'},
  /* Southern Trade Route */
  {name:'Moldovița',     x:-1800, z:2300,  kit:'TD'}, {name:'Neamț',        x:1620,  z:2330,  kit:'TD'},
  {name:'Tazlău',        x:220,   z:2120,  kit:'TD'}, {name:'Bistrița',     x:-900,  z:2660,  kit:'TD'},
  {name:'Oasița',        x:-2400, z:2750,  kit:'TD', id:'NV-12', feat:'oasis'},
  /* Capital outskirts */
  {name:'Horaiț',        x:760,   z:1010,  kit:'CP'}, {name:'Agapia',       x:-600,  z:600,   kit:'CP'},
  {name:'Vorona',        x:600,   z:-600,  kit:'CP'}, {name:'Dorna',        x:-600,  z:-600,  kit:'CP'},
  {name:'Mărginime',     x:-450,  z:1050,  kit:'CP', id:'NV-15', feat:'weavers'}, {name:'Curtea Veche', x:620, z:-150, kit:'CP'},
  {name:'Fântâna Rece',  x:-780,  z:300,   kit:'CP'},
  /* Battlefield pockets */
  {name:'Câmpul Cenușii',x:250,   z:-1500, kit:'BF', id:'NV-13', feat:'ash'}, {name:'Marginea', x:2700, z:1040, kit:'BF', id:'NV-14'}
];
var VNAMES=VILLAGES.map(function(v){ return v.name; });
VILLAGES.forEach(function(v,i){ v.zone=-1; v.region=getRegion(v.x,v.z); v.idx=i; if(!v.id) v.id='VC-'+(i<9?'0':'')+(i+1); });

/* ---------- HYDROLOGY (section 3): four rivers, ponds, marshes, springs ---------- */
var RIVERS=[
  {id:'RV-01', name:'Râul Dunării Mici', hw:20, depth:2.4, slow:true,
   pts:[[-3050,1620],[-2800,1600],[-2000,1520],[-1200,1560],[-700,1500],[0,1450],[700,1400],[1300,1100],[1600,1200],[2300,1160],[3050,1150]]},
  {id:'RV-02', name:'Râul Regal', hw:11, depth:2.0,
   pts:[[320,-1420],[300,-900],[290,-520],[300,-100],[310,300],[330,700],[400,1050],[700,1400]]},
  {id:'RV-03', name:'Râul Ghețarului', hw:10, depth:2.2, fast:true,
   pts:[[-2290,-1910],[-2230,-1870],[-2100,-1860],[-1900,-1900],[-1400,-2050],[-1100,-2140],[-700,-1980],[-300,-1840],[0,-1690],[500,-1900],[900,-2020],[1000,-2050],[1500,-2200],[2000,-2450],[2400,-2700],[2800,-3050]]},
  {id:'RV-04', name:'Râul Sării', hw:9, depth:1.8, salt:true,
   pts:[[2750,-1700],[2500,-1450],[2400,-1300],[2050,-900],[1800,-550],[1750,-200],[1850,150],[2000,450],[2300,700],[2600,900],[3050,1000]]}
];
/* smooth the coarse river polylines (Catmull-Rom, ~45u steps) so troughs, water and banks all curve */
function densifyPolyline(P,step,keepEnds){
  var out=[], n=P.length, i, k;
  if(n<2) return P.slice();
  function cr(p0,p1,p2,p3,t){ var t2=t*t, t3=t2*t; return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3); }
  for(i=0;i<n-1;i++){
    var p0=P[Math.max(0,i-1)], p1=P[i], p2=P[i+1], p3=P[Math.min(n-1,i+2)];
    var L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]), steps=Math.max(1,Math.round(L/step));
    for(k=0;k<steps;k++){ var t=k/steps; out.push([cr(p0[0],p1[0],p2[0],p3[0],t), cr(p0[1],p1[1],p2[1],p3[1],t)]); }
  }
  out.push([P[n-1][0],P[n-1][1]]);
  return out;
}
RIVERS.forEach(function(R){ R.wp=R.pts; R.pts=densifyPolyline(R.pts,45); });
/* ponds, marshes, tarns, springs (WTR-01..07 + the mill ponds) */
var LAKES=[
  {id:'WTR-01', name:'Mlaștina Valahă',    x:1300,  z:620,   r:38, depth:0.7, marsh:true},
  {id:'WTR-02', name:'Smârcul Dunării',    x:-700,  z:1500,  r:38, depth:1.4, marsh:true},
  {id:'WTR-03', name:'Tăul Carpatin',      x:320,   z:-1420, r:38, depth:2.6},
  {id:'WTR-04', name:'Lacul Înghețat',     x:-2290, z:-1910, r:22, depth:2.0, frozen:true},
  {id:'WTR-05', name:'Izvorul Pustnicului',x:56,    z:-1572, r:7,  depth:0.7},
  {id:'WTR-06', name:'Oaza de Sud',        x:1800,  z:2400,  r:38, depth:1.6},
  {id:'WTR-07', name:'Izvorul de sub Piatră', x:-1780, z:-2455, r:6, depth:0.6, cave:true},
  {name:'Lacul Corbilor',    x:1350, z:-2420, r:60, depth:3.0, frozen:true},
  {name:'Iazul Morii',       x:-2350, z:-420, r:14, depth:1.2},
  {name:'Balta Neagră',      x:-2050, z:950,  r:40, depth:1.6, marsh:true},
  {name:'Ochiul Cascadei',   x:900,   z:-1982, r:14, depth:2.0},
  {name:'Iazul Oasiței',     x:-2400, z:2790, r:16, depth:1.2}
];
/* moats: ring troughs around fortresses (rectangular hx/hz or circular r) */
var MOATS=[
  {x:TOWNS.rome.x, z:TOWNS.rome.z, hx:150, hz:112, w:14, depth:2.4, water:true},      /* Cetatea Dunării */
  {x:TOWNS.moldavia.x, z:TOWNS.moldavia.z, r:196, w:9, depth:1.6, water:false}         /* Hotarul de Nord ditch */
];
function moatDist(m,x,z){
  var dx=x-m.x, dz=z-m.z;
  if(m.r) return Math.abs(Math.sqrt(dx*dx+dz*dz)-m.r);
  var qx=Math.abs(dx)-m.hx, qz=Math.abs(dz)-m.hz;
  if(qx>0||qz>0) return Math.sqrt(Math.max(qx,0)*Math.max(qx,0)+Math.max(qz,0)*Math.max(qz,0));
  return -Math.max(qx,qz);
}
/* bridges: deck at bank height, walkable; fords: the bed rises to wading depth */
var BRIDGES=[
  {id:'BR-M1', x:TOWNS.rome.x, z:TOWNS.rome.z-112, ang:Math.PI/2, len:26, w:6, name:'Podul Ridicător', moat:true, drawbridge:true},
  {id:'BR-M2', x:TOWNS.moldavia.x, z:TOWNS.moldavia.z+196, ang:Math.PI/2, len:20, w:5, name:'Podul Hotarului de Sud', moat:true, timber:true},
  {id:'BR-M3', x:TOWNS.moldavia.x, z:TOWNS.moldavia.z-196, ang:Math.PI/2, len:20, w:5, name:'Podul Hotarului de Nord', moat:true, timber:true}
];
function riverSegDist(px,pz,pts){
  var best=1e9, bi=0, bt=0, i;
  for(i=0;i<pts.length-1;i++){
    var ax=pts[i][0], az=pts[i][1], bx=pts[i+1][0], bz=pts[i+1][1];
    var dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz;
    var t=L2>0?clamp(((px-ax)*dx+(pz-az)*dz)/L2,0,1):0;
    var cx=ax+dx*t, cz=az+dz*t, ex=px-cx, ez=pz-cz, d2=ex*ex+ez*ez;
    if(d2<best){ best=d2; bi=i; bt=t; }
  }
  return {d:Math.sqrt(best), seg:bi, t:bt};
}
/* nearest river: {d, river, seg, t} — used by terrain paint, reeds, docks */
function riverField(x,z){
  var out={d:1e9, river:null, seg:0, t:0}, i;
  for(i=0;i<RIVERS.length;i++){
    var R=RIVERS[i];
    var bb=R.bb;
    if(!bb){
      bb={x0:1e9,x1:-1e9,z0:1e9,z1:-1e9};
      R.pts.forEach(function(p){ bb.x0=Math.min(bb.x0,p[0]); bb.x1=Math.max(bb.x1,p[0]); bb.z0=Math.min(bb.z0,p[1]); bb.z1=Math.max(bb.z1,p[1]); });
      R.bb=bb;
    }
    if(x<bb.x0-260||x>bb.x1+260||z<bb.z0-260||z>bb.z1+260) continue;
    var r=riverSegDist(x,z,R.pts);
    if(r.d<out.d){ out.d=r.d; out.river=R; out.seg=r.seg; out.t=r.t; }
  }
  return out;
}
function riverHalfWidth(R,z){ return R.hw*(1+0.3*(1-ss(-2050,-1700,z))); }
function distToSeg(px,pz, ax,az, bx,bz){
  var dx=bx-ax, dz=bz-az;
  var t=((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz);
  t=clamp(t,0,1);
  var cx=ax+dx*t, cz=az+dz*t;
  var ex=px-cx, ez=pz-cz;
  return Math.sqrt(ex*ex+ez*ez);
}

/* ---------- ROAD NETWORK (section 4) — waypoints are the contract, ribbons follow the ground ---------- */
var ROADS=[
  /* imperial highways R0 */
  {id:'HW-01', name:'Via Romaria', cls:'R0', pts:[[0,-2300],[0,-2160],[20,-1900],[0,-1780],[0,-1690],[0,-1350],[0,-1050],[0,-700],[0,-520],[0,-400],[-46,-330],[-46,-60],[0,-10],[0,200],[0,520],[30,880],[0,1240],[-20,1600],[0,1960],[0,2200],[0,2360],[0,2380]]},
  {id:'CR-02', name:'Aleea Regală', cls:'R0', pts:[[0,-400],[46,-330],[46,-60],[0,-10]]},
  {id:'HW-02', name:'Via Transilvania', cls:'R0', pts:[[-520,0],[-760,-120],[-1050,-300],[-1350,-450],[-1580,-620],[-1640,-800]]},
  {id:'CR-05', name:'Bulevardul Răsăritului', cls:'R0', pts:[[-520,0],[-300,0],[0,0],[300,0],[520,0]]},
  /* capital ring & market street */
  {id:'CR-01', name:'Inelul Romariei', cls:'R1', ring:{x:0,z:0,r:460,n:48}},
  {id:'CR-04', name:'Strada Târgului', cls:'R1', pts:[[0,0],[130,130],[230,300],[264,377]]},
  {id:'CR-04b', name:'Strada Catedralei', cls:'R1', pts:[[342,308],[368,368],[470,470],[600,580],[700,600]]},
  /* regional roads R1 */
  {id:'RG-01', name:'Drumul Sării', cls:'R1', pts:[[520,0],[780,60],[1080,-40],[1380,-260],[1560,-440],[1680,-500],[1700,-520]]},
  {id:'RG-01b', name:'Drumul Sării — Trecătoarea', cls:'R1', pts:[[1700,-880],[1620,-980],[1500,-1250],[1440,-1380],[1360,-1420],[1350,-1550],[1200,-1700],[1100,-1800],[1000,-1880],[900,-1940],[760,-1980],[800,-2090]]},
  {id:'RG-02', name:'Drumul Dunării', cls:'R1', pts:[[-520,0],[-620,260],[-760,520],[-900,800],[-1050,1050],[-1250,1080],[-1400,1100]]},
  {id:'RG-02b', name:'Drumul Taberei', cls:'R1', pts:[[-1400,1100],[-1560,1200],[-1640,1440],[-1850,1600],[-2050,1700],[-2110,1760]]},
  {id:'RG-03', name:'Calea Voievodului', cls:'R1', switchbacks:true, pts:[[-1800,-900],[-1920,-1020],[-1990,-1100],[-1900,-1170],[-2030,-1240],[-2050,-1280],[-1980,-1360],[-2100,-1440],[-2150,-1550],[-2080,-1640],[-2200,-1750],[-2200,-1890]]},
  {id:'RG-03b', name:'Drumul Crestei', cls:'R1', switchbacks:true, pts:[[-2120,-1960],[-2000,-2080],[-1900,-2160],[-1700,-2240],[-1500,-2280],[-1000,-2340],[-500,-2380],[-300,-2320],[-140,-2250],[0,-2230]]},
  {id:'RG-04', name:'Drumul Caravanelor', cls:'R1t', pts:[[-3000,2450],[-2600,2420],[-2200,2440],[-1800,2480],[-1300,2530],[-900,2600],[-450,2560],[-200,2520],[0,2500],[200,2520],[450,2560],[900,2600],[1350,2540],[1650,2520],[1850,2490],[2050,2350],[2200,2340],[2600,2300],[3000,2290]]},
  {id:'RG-05', name:'Drumul Codrului', cls:'R1', pts:[[1700,-520],[1780,-470],[1880,-430],[2020,-180],[2100,80],[2010,180],[1980,320],[1780,300],[1620,210],[1350,120],[1080,40],[830,60],[620,20],[520,0]]},
  {id:'RG-06', name:'Drumul Vântului', cls:'R1', pts:[[-2120,-1960],[-1900,-1965],[-1700,-2040],[-1400,-2100],[-1150,-2170],[-800,-2090],[-400,-2020],[-200,-1900],[0,-1780],[200,-1830],[400,-1900],[800,-2090],[1000,-2090],[1150,-2010],[1300,-2000],[1700,-1930],[2110,-1900],[2200,-1900]]},
  /* connectors R2 */
  {id:'RG-07', name:'Scara Țării', cls:'R2', pts:[[-1850,1600],[-1640,1740],[-1500,1800],[-1520,2000],[-1720,2240],[-1900,2380],[-2000,2420]]},
  {id:'RG-09', name:'Drumul Marginii', cls:'R2', pts:[[2100,80],[2350,300],[2600,600],[2660,960]]},
  {id:'RG-08', name:'Calea Oilor', cls:'R2', pts:[[-2050,-1280],[-1950,-800],[-1990,-560],[-2000,-400],[-2140,-280],[-2250,100],[-2350,600],[-2450,1100],[-2400,1600],[-2350,1900],[-2260,2200],[-2200,2440]]},
  /* trails R3 — covert network to the secrets (section 4.7) */
  {id:'TR-01', name:'Poteca Altarului', cls:'R3', pts:[[-1350,-450],[-1250,-900],[-1200,-1400],[-1200,-1760]]},
  {id:'TR-02', name:'Poteca Mănăstirii Părăsite', cls:'R3', pts:[[0,1960],[700,1900],[1340,1800]]},
  {id:'TR-03', name:'Poteca Trestiilor', cls:'R3', pts:[[0,1240],[-60,1236],[-110,1230]]},
  {id:'TR-04', name:'Poteca Criptei', cls:'R3', pts:[[-800,-2100],[-790,-2180],[-780,-2220]]},
  {id:'TR-05', name:'Poteca Cascadei', cls:'R3', pts:[[900,-1940],[905,-1960],[905,-1980]]},
  {id:'TR-06', name:'Poteca Turnului Uitat', cls:'R3', pts:[[-2200,2440],[-2350,2250],[-2450,2090]]},
  {id:'TR-07', name:'Poteca Contrabandiștilor', cls:'R3', pts:[[2020,-180],[2080,-380],[2200,-545]]},
  {id:'TR-08', name:'Poteca Vrăjitoarei', cls:'R3', pts:[[-700,2580],[-620,2300],[-600,2140]]},
  {id:'TR-09', name:'Scara Pustnicului', cls:'R3', pts:[[0,-1650],[40,-1610],[60,-1575]]},
  {id:'TR-10', name:'Poteca Lupului', cls:'R3', pts:[[1350,120],[1260,80],[1200,80]]},
  {id:'TR-11', name:'Poteca Cristalelor', cls:'R3', pts:[[1350,-1550],[1550,-1650],[1720,-1740]]},
  {id:'TR-12', name:'Scara Corbilor', cls:'R3', pts:[[-1500,-2450],[-1560,-2500],[-1620,-2560],[-1580,-2610],[-1660,-2660],[-1640,-2720],[-1720,-2730],[-1760,-2690],[-1750,-2650]]},
  {id:'TR-13', name:'Poteca Chiliei', cls:'R3', pts:[[1300,-2000],[1000,-2250],[700,-2480],[610,-2530]]},
  {id:'TR-14', name:'Poteca Vântului', cls:'R3', pts:[[-1000,-2340],[-940,-2500],[-900,-2620]]},
  {id:'TR-15', name:'Poteca Egidei', cls:'R3', pts:[[-300,-2320],[-200,-2500],[-60,-2600],[0,-2600]]}
];
/* ring roads are unrolled into polylines */
ROADS.forEach(function(R){
  if(R.ring){ var g=R.ring, pts=[], i; for(i=0;i<=g.n;i++){ var a=i/g.n*TAU; pts.push([g.x+Math.cos(a)*g.r, g.z+Math.sin(a)*g.r]); } R.pts=pts; }
  var C=ROAD_CLASSES[R.cls]; R.w=C.w; R.col=C.col; R.speed=C.speed;
});
function nearestRoadPoint(x,z,filter,accept){
  var cands=[], i, j;
  for(i=0;i<ROADS.length;i++){ var R=ROADS[i]; if(filter&&!filter(R)) continue; var P=R.wp||R.pts, best=null, bd=1e18; for(j=0;j<P.length-1;j++){
    var ax=P[j][0], az=P[j][1], bx=P[j+1][0], bz=P[j+1][1], dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz;
    var t=L2>0?clamp(((x-ax)*dx+(z-az)*dz)/L2,0,1):0, px=ax+dx*t, pz=az+dz*t, d=(px-x)*(px-x)+(pz-z)*(pz-z);
    if(d<bd){ bd=d; best={x:px,z:pz,road:R,d:Math.sqrt(d)}; }
  } if(best) cands.push(best); }
  cands.sort(function(a,b){ return a.d-b.d; });
  if(!accept) return cands[0]||null;
  for(i=0;i<cands.length;i++) if(accept(cands[i])) return cands[i];
  return null;
}
/* does the straight segment a→b cross a wide river (hw>12)? lanes and trails avoid those */
function segCrossesWideRiver(ax,az,bx,bz){
  for(var i=0;i<RIVERS.length;i++){ var R=RIVERS[i]; if(R.hw<=12) continue; var P=R.pts;
    for(var j=0;j<P.length-1;j++){ var cx=P[j][0], cz=P[j][1], dx=P[j+1][0], dz=P[j+1][1];
      var r1x=bx-ax, r1z=bz-az, r2x=dx-cx, r2z=dz-cz, den=r1x*r2z-r1z*r2x; if(Math.abs(den)<1e-9) continue;
      var t=((cx-ax)*r2z-(cz-az)*r2x)/den, u=((cx-ax)*r1z-(cz-az)*r1x)/den; if(t>=0&&t<=1&&u>=0&&u<=1) return true; } }
  return false;
}
/* village lanes (VC-xx, R2): one lane per village to the nearest R0/R1/R1t/R2 road, one bend at 60 % */
(function(){
  var laneable=function(R){ return R.cls!=='R3' && !R.lane; };
  var laneSites=SITES_DEF.filter(function(s){ return !s.secret && ['charcoal','spa','quarry','sheepfold','windmill','windmillfarm','riverport','saltmine','fair','granary','firemeadow','hermitage','cavevillage','graves','memorial','burned','watchtower','monastery','outpost','serai','village','forestvillage','warcamp'].indexOf(s.kind)>=0; });
  var from=VILLAGES.map(function(v){ return {x:v.x,z:v.z,id:v.id,name:v.name,r:52,v:v}; })
    .concat(laneSites.map(function(s){ return {x:s.x,z:s.z,id:'LN-'+s.key,name:s.name,r:s.r*0.9,s:s}; }));
  from.forEach(function(p){
    var q=nearestRoadPoint(p.x,p.z,laneable,function(c){ return c.d>1400 || !segCrossesWideRiver(p.x,p.z,c.x,c.z); }); if(!q) return;
    var L=q.d; if(L<p.r+6){ p.onRoad=true; if(p.v) p.v.lane=0; return; }
    if(L>1400) return;
    var ux=(q.x-p.x)/L, uz=(q.z-p.z)/L, nx=-uz, nz=ux, side=((p.x*7+p.z*3)%2===0)?1:-1;
    var ex=p.x+ux*(p.r-4), ez=p.z+uz*(p.r-4);       /* start at the pad edge */
    if(p.v){ if(Math.abs(ux)>=Math.abs(uz)){ ex=p.x+(ux>0?52:-52); ez=p.z; p.v.laneAxis='x'; } else { ex=p.x; ez=p.z+(uz>0?46:-46); p.v.laneAxis='z'; } }   /* villages: the lane meets the end of a village street */
    var mx=p.x+ux*L*0.6+nx*side*Math.min(40,L*0.12), mz=p.z+uz*L*0.6+nz*side*Math.min(40,L*0.12);
    var road={id:p.id, name:'Ulița '+p.name, cls:'R2', lane:true, pts:[[ex,ez],[mx,mz],[q.x,q.z]], w:ROAD_CLASSES.R2.w, col:ROAD_CLASSES.R2.col, speed:ROAD_CLASSES.R2.speed, target:q.road.id, len:L};
    if(p.v) p.v.lane=L;
    ROADS.push(road);
  });
})();
/* every road: keep the waypoints (wp) and a dense spline (pts, ~10u) for ribbons, paint and navigation */
ROADS.forEach(function(R){ R.wp=R.pts; R.pts=densifyPolyline(R.pts, R.switchbacks?6:10); });
/* a 64u grid of road samples: O(1) "how far is the nearest road" for terrain, scenery and movement */
var ROAD_GRID=new Map(), ROAD_CELL=64;
ROADS.forEach(function(R,ri){
  R.pts.forEach(function(p,pi){
    if(pi===R.pts.length-1) return;
    var q=R.pts[pi+1], x0=Math.min(p[0],q[0]), x1=Math.max(p[0],q[0]), z0=Math.min(p[1],q[1]), z1=Math.max(p[1],q[1]);
    for(var gx=Math.floor(x0/ROAD_CELL);gx<=Math.floor(x1/ROAD_CELL);gx++) for(var gz=Math.floor(z0/ROAD_CELL);gz<=Math.floor(z1/ROAD_CELL);gz++){
      var k=gx+':'+gz; if(!ROAD_GRID.has(k)) ROAD_GRID.set(k,[]); ROAD_GRID.get(k).push(ri*100000+pi);
    }
  });
});
/* nearest road: {d, road, w, cls} — cells within 64u only (roads never matter further than that) */
function roadField(x,z){
  var gx=Math.floor(x/ROAD_CELL), gz=Math.floor(z/ROAD_CELL), best=1e9, br=null, ix, iz, i;
  for(ix=-1;ix<=1;ix++) for(iz=-1;iz<=1;iz++){
    var arr=ROAD_GRID.get((gx+ix)+':'+(gz+iz)); if(!arr) continue;
    for(i=0;i<arr.length;i++){
      var R=ROADS[Math.floor(arr[i]/100000)], pi=arr[i]%100000, a=R.pts[pi], b=R.pts[pi+1];
      var d=distToSeg(x,z,a[0],a[1],b[0],b[1]);
      if(d<best){ best=d; br=R; }
    }
  }
  return {d:best, road:br, w:br?br.w:0, cls:br?br.cls:null};
}
/* roads are the fastest surface: +35 % on the imperial via, +10 % on a trail */
function roadSpeedAt(x,z){ var f=roadField(x,z); return (f.road && f.d<f.w/2+0.8) ? f.road.speed : 1; }

/* ---------- river crossings: bridges (R0 stone, R1 timber) and fords (lanes, trails over small rivers) ---------- */
var BRIDGE_NAMES={'HW-01|RV-03':[['BR-01','Podul Pustnicului','stone']],'CR-05|RV-02':[['BR-02','Podul Coroanei','stone']],'CR-01|RV-02':[['BR-03','Podul Inel Nord','stone'],['BR-04','Podul Inel Sud','stone']],
  'RG-02b|RV-01':[['BR-05','Podul Cetății','timber']],'RG-05|RV-04':[['BR-06','Fordul Sării','ford'],['BR-13','Podul Codrului','timber']],'RG-06|RV-03':[['BR-08','Fordul Prutului','ford']],
  'HW-01|RV-01':[['BR-11','Podul Dunării Mici','stone']],'RG-03|RV-03':[['BR-14','Podul Mănăstirii','stone']],'RG-08|RV-01':[['BR-15','Podul Oilor','timber']],'RG-01b|RV-03':[['BR-16','Podul Trecătorii','timber']],'RG-09|RV-04':[['BR-18','Vadul Marginii','ford']],'TR-13|RV-03':[['BR-19','Vadul Chiliei','ford']],'NV-03|RV-03':[['BR-20','Vadul Crestei','ford']]};
(function(){
  function segX(ax,az,bx,bz,cx,cz,dx,dz){
    var r1x=bx-ax, r1z=bz-az, r2x=dx-cx, r2z=dz-cz, den=r1x*r2z-r1z*r2x;
    if(Math.abs(den)<1e-9) return null;
    var t=((cx-ax)*r2z-(cz-az)*r2x)/den, u=((cx-ax)*r1z-(cz-az)*r1x)/den;
    if(t<0||t>1||u<0||u>1) return null;
    return {x:ax+r1x*t, z:az+r1z*t, ang:Math.atan2(r1z,r1x)};
  }
  var used={};
  ROADS.forEach(function(road){
    for(var i=0;i<road.pts.length-1;i++) RIVERS.forEach(function(R){
      for(var j=0;j<R.pts.length-1;j++){
        var hit=segX(road.pts[i][0],road.pts[i][1],road.pts[i+1][0],road.pts[i+1][1],R.pts[j][0],R.pts[j][1],R.pts[j+1][0],R.pts[j+1][1]);
        if(!hit) continue;
        var hw=riverHalfWidth(R,hit.z), dup=false;
        for(var k=0;k<BRIDGES.length;k++) if(Math.hypot(BRIDGES[k].x-hit.x,BRIDGES[k].z-hit.z)<hw*2+12) dup=true;
        if(dup) continue;
        var ford=(road.cls==='R2'||road.cls==='R3') && R.hw<=12, key=road.id+'|'+R.id, n=used[key]||0; used[key]=n+1;
        var nm=BRIDGE_NAMES[key]&&BRIDGE_NAMES[key][n];
        var id=nm?nm[0]:('BR-'+(30+BRIDGES.length)), name=nm?nm[1]:(ford?'Vadul ':'Podul ')+(road.name.replace(/^(Drumul|Poteca|Calea|Via|Ulița|Strada) /,''));
        var type=nm?nm[2]:(ford?'ford':(road.cls==='R0'?'stone':'timber')); ford=type==='ford';
        BRIDGES.push({id:id, x:hit.x, z:hit.z, ang:hit.ang, len:hw*2+10, w:ford?Math.max(4,road.w*0.8):Math.min(Math.max(road.w*0.8,4.5),9), river:R.id, road:road.id, name:name,
          ford:ford, timber:type==='timber', stone:type==='stone'});
      }
    });
  });
})();

/* ---------- HEIGHT FIELD (section 2.1) ---------- */
var MASSIF={x:-1750, z:-2650, r:190, cave:{x:-1800, z:-2470, r:100}};
function massifH(x,z){
  var dx=x-MASSIF.x, dz=z-MASSIF.z, d=Math.sqrt(dx*dx+dz*dz);
  if(d>MASSIF.r+40) return 0;
  var h=18*(1-ss(150,192,d)) + 20*(1-ss(100,142,d)) + 17*(1-ss(52,92,d));
  h+= 2.2*Math.sin(x*0.07+z*0.05)*Math.sin(d*0.11)*(1-ss(150,192,d));      /* crag noise */
  var cx=x-MASSIF.cave.x, cz=z-MASSIF.cave.z;                                 /* the cave village foot is left level */
  h*=ss(MASSIF.cave.r*0.5, MASSIF.cave.r+12, Math.sqrt(cx*cx+cz*cz));
  return h;
}
function baseH(x,z){
  var ax=Math.abs(x), az=Math.abs(z);
  /* gentle rolling ground everywhere */
  var h = 2.2*Math.sin(x*0.0021+1.3)*Math.cos(z*0.0018-0.7)
        + 1.1*Math.sin(x*0.0063-2.1)*Math.sin(z*0.0051+0.4)
        + 0.5*Math.sin(x*0.017)*Math.cos(z*0.015)
        + 0.2*Math.sin(x*0.045+3)*Math.sin(z*0.038+1);
  /* continuous zone masks — no cliffs at region borders */
  var mC=1-ss(-2050,-1700,z);                 /* Carpathian */
  var mTr=ss(1950,2150,z);                    /* trade route */
  var mWest=1-ss(-900,-700,x), mEast=ss(700,900,x);
  var mN=1-ss(100,300,z), mS=1-mN;
  var mCap=1-ss(650,950,Math.max(ax,az));
  var mTrans=mWest*mN*(1-mC), mWal=mS*(1-mTr)*(1-mCap), mMold=mEast*mN*(1-mC), mPlainN=(1-mWest)*(1-mEast)*mN*(1-mC)*(1-mCap);
  /* Carpathians: the ridge climbs toward the rim, peaks, a pass in the east */
  if(mC>0){
    var deep=1-ss(-2950,-2150,z);
    var ridge=10*mC + 34*Math.pow(deep,1.5)
      + (7*Math.abs(Math.sin(x*0.0034+0.4)) + 4*Math.sin(x*0.011+z*0.007) + 2.2*Math.sin(x*0.03)*Math.cos(z*0.027))*mC
      + 6*Math.sin(x*0.0021)*Math.cos(z*0.0026)*mC;
    ridge -= 16*mC*Math.exp(-Math.pow((x-2200)/170,2)); /* Frostwind pass corridor */
    h += ridge;
    h += 22*gauss(x,z,-900,-2700,95);         /* Turnul Vântului peak */
    h += 11*gauss(x,z,150,-1640,55);          /* cliff behind the hermit's cave */
    h += 9*gauss(x,z,0,-2450,210);            /* Stânca de Fier spur */
    h += 14*(1-ss(-2035,-2010,z))*Math.exp(-Math.pow((x-900)/140,2))*mC; /* waterfall shelf of the Glacier river */
    h += 5*gauss(x,z,-2100,-2150,170);        /* monastery plateau */
    h += 12*gauss(x,z,650,-2580,70);          /* the hermitage cliff */
    h += massifH(x,z);                        /* Muntele Corbilor */
  }
  /* Transylvania: hills and terraces */
  h += mTrans*(3.5*Math.sin(x*0.004)*Math.cos(z*0.0035) + 1.6*Math.sin(x*0.013+z*0.009) + 2.0);
  /* Wallachia: pulled flat, low, with marsh pools */
  h += mWal*(-h*0.55 - 0.8 - 1.6*Math.max(0,(Math.sin(x*0.02)*Math.sin(z*0.023)-0.6)/0.4));
  /* Moldavia: rugged */
  h += mMold*(4*Math.sin(x*0.005)*Math.cos(z*0.004) + 2*Math.sin(x*0.018)*Math.cos(z*0.022) + 1.2*Math.sin(x*0.05+z*0.03) + 2.5);
  /* the scarred field north of the capital */
  h += mPlainN*(1.2*Math.sin(x*0.02)*Math.cos(z*0.017) + 0.8*Math.sin(x*0.05+z*0.04));
  /* trade route: dry and flat */
  h += mTr*(-h*0.5 + 0.8*Math.sin(x*0.006)*Math.cos(z*0.008));
  /* the capital rises on a low hill */
  h += 4.5*mCap;
  return h;
}
/* rivers carve troughs (ravines in the mountains); lakes are bowls; fords lift the bed to wading depth */
function waterCut(x,z){
  var cut=0, mC=1-ss(-2050,-1700,z);
  var rf=riverField(x,z);
  if(rf.river){
    var R=rf.river, hw=riverHalfWidth(R,z), depth=R.depth+3.2*mC;
    if(rf.d<hw*1.5){
      var c=depth*(1-ss(hw*0.35,hw*1.5,rf.d));
      for(var fi=0;fi<BRIDGES.length;fi++){ var F=BRIDGES[fi]; if(!F.ford) continue; var fd=Math.hypot(x-F.x,z-F.z); if(fd<hw+8){ c*=0.35+0.65*ss(hw*0.5,hw+8,fd); } }
      cut+=c;
    }
  }
  for(var li=0;li<LAKES.length;li++){
    var L=LAKES[li], dx=x-L.x, dz=z-L.z, d2=dx*dx+dz*dz;
    if(d2<(L.r+30)*(L.r+30)) cut += L.depth*(1-ss(L.r*0.55,L.r+18,Math.sqrt(d2)));
  }
  for(var mi=0;mi<MOATS.length;mi++){
    var Mo=MOATS[mi], ex=Math.abs(x-Mo.x), ez=Math.abs(z-Mo.z), lim=(Mo.r||Math.max(Mo.hx,Mo.hz))+Mo.w;
    if(ex>lim||ez>lim) continue;
    var md=moatDist(Mo,x,z);
    if(md<Mo.w/2+3) cut += Mo.depth*(1-ss(Mo.w*0.25,Mo.w/2+3,md));
  }
  return cut;
}

/* ---------- FLATS (section 1.5): every site stands on level ground ---------- */
var FLATS=[];
function addFlat(x,z,r,h){ FLATS.push({x:x,z:z,r:r,h:h===undefined?baseH(x,z):h}); }
addFlat(0,0,560,baseH(0,0)+1.2);                              /* Romaria plateau r520 (+ blend) */
addFlat(TOWNS.sparta.x,TOWNS.sparta.z,250);                   /* Ardealburg */
addFlat(TOWNS.rome.x,TOWNS.rome.z,300,baseH(TOWNS.rome.x,TOWNS.rome.z)+0.4);   /* Cetatea Dunării */
addFlat(TOWNS.moldavia.x,TOWNS.moldavia.z,230);               /* Hotarul de Nord */
addFlat(TOWNS.vikings.x,TOWNS.vikings.z,215,baseH(0,-2400)+1.0); /* Stânca de Fier */
addFlat(TOWNS.egypt.x,TOWNS.egypt.z,230);                     /* Drumul Lung */
SITES_DEF.forEach(function(s){ if(!s.noFlat) addFlat(s.x,s.z,s.r,baseH(s.x,s.z)+(s.flatH==='peak'?0.5:0)); });
VILLAGES.forEach(function(v){ addFlat(v.x,v.z,70); });
addFlat(600,600,120,FLATS[0].h);                               /* cathedral quarter */
/* height with flats applied (no water) */
function flatsH(x,z){
  var h=baseH(x,z), i;
  for(i=0;i<FLATS.length;i++){
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
BRIDGES.forEach(function(b){
  var c=Math.cos(b.ang), s=Math.sin(b.ang);
  var ex=c*(b.len/2+6), ez=s*(b.len/2+6);
  b.y=(flatsH(b.x+ex,b.z+ez)+flatsH(b.x-ex,b.z-ez))/2;
});
/* ground without bridges: flats + river troughs + lake bowls + moats */
function groundHBase(x,z){ return flatsH(x,z)-waterCut(x,z); }
function groundH(x,z){
  var h=groundHBase(x,z), i;
  for(i=0;i<BRIDGES.length;i++){
    var b=BRIDGES[i]; if(b.ford) continue;
    var bx=x-b.x, bz=z-b.z;
    if(bx*bx+bz*bz>(b.len/2+14)*(b.len/2+14)) continue;
    var c=Math.cos(b.ang), s=Math.sin(b.ang);
    var u=bx*c+bz*s, v=-bx*s+bz*c;
    if(Math.abs(v)<b.w/2+1.5){
      var k2=1-ss(b.len/2, b.len/2+10, Math.abs(u));
      if(k2>0) h=Math.max(h, h*(1-k2)+b.y*k2);
    }
  }
  return h;
}
/* water surface height on a river centreline point: 1.1 above the bed */
function riverWaterY(x,z){ return groundHBase(x,z)+1.1; }

/* ---------- CAPTURE FLAGS CMP (section 11.1): 51 named flag zones ---------- */
var FLAGS=[
  /* Carpathia (10) */
  {id:'CMP-CA-1', name:'Piața Porții de Fier', x:0, z:-2270}, {id:'CMP-CA-2', name:'Sala Donjonului', x:0, z:-2420},
  {id:'CMP-CA-3', name:'Curtea Mănăstirii', x:-2200, z:-1975}, {id:'CMP-CA-4', name:'Turnul Avanpostului', x:800, z:-2170},
  {id:'CMP-CA-5', name:'Șaua Trecătorii', x:2200, z:-1900}, {id:'CMP-CA-6', name:'Creasta Cocoșului', x:1500, z:-2600},
  {id:'CMP-CA-7', name:'Izvorul Rece', x:-1500, z:-2600}, {id:'CMP-CA-8', name:'Piața de sub Piatră', x:-1800, z:-2470},
  {id:'CMP-CA-9', name:'Paraclisul din Stâncă', x:-1852, z:-2470}, {id:'CMP-CA-10', name:'Vârful Corbilor', x:-1750, z:-2650},
  /* Transylvania (9) */
  {id:'CMP-AR-1', name:'Piața Ardealburgului', x:-1800, z:-800}, {id:'CMP-AR-2', name:'Primăria Ardealburg', x:-1800, z:-842},
  {id:'CMP-AR-3', name:'Biserica Văii Lupilor', x:-2100, z:-436}, {id:'CMP-AR-4', name:'Stejarii Vechi', x:-2600, z:150},
  {id:'CMP-AR-5', name:'Valea Mierii', x:-2500, z:-1400}, {id:'CMP-AR-6', name:'Cireșarii', x:-1400, z:140},
  {id:'CMP-AR-7', name:'Cariera de Piatră', x:-2450, z:-1100}, {id:'CMP-AR-8', name:'Stâna Mare', x:-2600, z:-200},
  {id:'CMP-AR-9', name:'Moara de Vânt', x:-1300, z:-650},
  /* Wallachia (10) */
  {id:'CMP-VA-1', name:'Piața Podului Ridicător', x:-1400, z:1170}, {id:'CMP-VA-2', name:'Sala Mare a Cetății', x:-1400, z:1356},
  {id:'CMP-VA-3', name:'Balconul de Război', x:-1264, z:1398}, {id:'CMP-VA-4', name:'Cortul Comandantului', x:-2200, z:1760},
  {id:'CMP-VA-5', name:'Piața de Instrucție', x:-2160, z:1840}, {id:'CMP-VA-6', name:'Grindu Mare', x:420, z:1520},
  {id:'CMP-VA-7', name:'Balta Albă', x:-2600, z:1900}, {id:'CMP-VA-8', name:'Nisipuri', x:2400, z:1900},
  {id:'CMP-VA-9', name:'Moara Câmpiei', x:1000, z:900}, {id:'CMP-VA-10', name:'Portul Fluvial', x:-620, z:1420},
  /* Moldavia (8) */
  {id:'CMP-MO-1', name:'Curtea Hotarului', x:1700, z:-700}, {id:'CMP-MO-2', name:'Turnul Arcașilor', x:1670, z:-796},
  {id:'CMP-MO-3', name:'Poiana Altarului', x:2100, z:200}, {id:'CMP-MO-4', name:'Câmpia Sării', x:2600, z:-150},
  {id:'CMP-MO-5', name:'Vadul Lupului', x:2600, z:-1600}, {id:'CMP-MO-6', name:'Livada', x:1400, z:430},
  {id:'CMP-MO-7', name:'Pârâul de Argint', x:1000, z:-560}, {id:'CMP-MO-8', name:'Ocna de Jos', x:2450, z:-950},
  /* Trade route (5) */
  {id:'CMP-TD-1', name:'Curtea Hanului', x:0, z:2470}, {id:'CMP-TD-2', name:'Punctul de Control', x:0, z:2600},
  {id:'CMP-TD-3', name:'Bazarul Punct Comerț', x:0, z:2200}, {id:'CMP-TD-4', name:'Curtea Caravanseraiului', x:2200, z:2200},
  {id:'CMP-TD-5', name:'Oasița', x:-2400, z:2750},
  /* Capital (9) */
  {id:'CMP-CP-1', name:'Sala Tronului', x:0, z:-160}, {id:'CMP-CP-2', name:'Esplanada Palatului', x:0, z:-100},
  {id:'CMP-CP-3', name:'Vistieria', x:-40, z:-160}, {id:'CMP-CP-4', name:'Piața Catedralei', x:560, z:600},
  {id:'CMP-CP-5', name:'Cripta Regilor', x:560, z:650}, {id:'CMP-CP-6', name:'Crucea Târgului', x:700, z:520},
  {id:'CMP-CP-7', name:'Cheiul Docurilor', x:270, z:300}, {id:'CMP-CP-8', name:'Mărginime', x:-450, z:1050},
  {id:'CMP-CP-9', name:'Grânarul Regelui', x:820, z:-330},
  /* Battlefields (5) */
  {id:'CMP-BF-1', name:'Inima Câmpiei Ruinelor', x:-350, z:-1350}, {id:'CMP-BF-2', name:'Cercul Ruinelor', x:-350, z:-1250},
  {id:'CMP-BF-3', name:'Câmpul Cenușii', x:250, z:-1500}, {id:'CMP-BF-4', name:'Marginea', x:2700, z:1040},
  {id:'CMP-BF-5', name:'Pajiștea Focului', x:1050, z:450}
];
/* signal beacons SB (section 4.9): Stânca → Frostwind Watch → Monastery → Ardealburg → Romaria; Cetatea → War Camp → Romaria; the summit */
var BEACON_DEF=[
  {id:'SB-01', name:'Rugul Stâncii de Fier', x:150, z:-2440}, {id:'SB-02', name:'Rugul de Veghe Frostwind', x:-60, z:-1790},
  {id:'SB-03', name:'Rugul Mănăstirii', x:-2120, z:-2060}, {id:'SB-04', name:'Rugul Ardealburgului', x:-1930, z:-930},
  {id:'SB-05', name:'Rugul Romariei', x:-70, z:-470}, {id:'SB-06', name:'Rugul Cetății', x:-1560, z:1140},
  {id:'SB-07', name:'Rugul Taberei', x:-2110, z:1720}, {id:'SB-08', name:'Rugul Șeii Scara I', x:-2150, z:-1590},
  {id:'SB-09', name:'Rugul Hotarului', x:1770, z:-905}, {id:'SB-13', name:'Rugul Corbilor', x:-1750, z:-2660}
];

/* ---------- LORE SUMMARY USED BY MAP / HUD ---------- */
var EXTENDED_LANDMARKS = SITES_DEF.map(function(s){ return {x:s.x, z:s.z, name:s.name, type:s.kind, region:s.region, id:s.id}; });
FAC_KEYS_T.forEach(function(f){ var T=TOWNS[f]; EXTENDED_LANDMARKS.push({x:T.x, z:T.z, name:T.name, type:T.kind, region:T.region, id:T.id}); });

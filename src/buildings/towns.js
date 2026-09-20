/* ============================================================
   towns.js — the six faction homes, built by hand from the
   ULTRA EXPANDED map description. Every building is solid,
   has a door that opens, windows that glow at night and a
   furnished interior. townData[fac] keeps the gameplay anchors
   (hall door = spawn, barracks, temple).
   ============================================================ */
var townData={};

/* ---- shared town helpers (axis-aligned streets) ---- */
var TOWN_STREETS=[], TOWN_PLAZAS=[];   /* recorded so the infill can line the streets and keep the squares open */
function townStreet(x0,z0,x1,z1,w,col){
  var mx=(x0+x1)/2, mz=(z0+z1)/2, kit=cellKit(mx,mz), L=Math.hypot(x1-x0,z1-z0);
  TOWN_STREETS.push({x0:x0,z0:z0,x1:x1,z1:z1,w:w});
  var n=Math.max(1,Math.ceil(L/24)), i;
  for(i=0;i<n;i++){
    var t0=i/n, t1=(i+1)/n, ax=x0+(x1-x0)*t0, az=z0+(z1-z0)*t0, bx=x0+(x1-x0)*t1, bz=z0+(z1-z0)*t1;
    var cx=(ax+bx)/2, cz=(az+bz)/2, y=groundH(cx,cz);
    kit.box(M2(tintHex(col||0x8a8070,-0.38)), Math.hypot(bx-ax,bz-az)+0.4, 0.12, w, cx, y+0.04, cz, -Math.atan2(bz-az,bx-ax));
  }
  for(i=0;i<=L;i+=8){ var t=i/L; window.__roadPts.push([x0+(x1-x0)*t, z0+(z1-z0)*t]); }
}
function townPlaza(x,z,r,col){
  var kit=cellKit(x,z), y=groundH(x,z);
  TOWN_PLAZAS.push({x:x,z:z,r:r});
  kit.cyln(M2(tintHex(col||0x8a8070,-0.38)), r, r, 0.12, 16, x, y+0.05, z);
  for(var a=0;a<TAU;a+=TAU/8) window.__roadPts.push([x+Math.cos(a)*r*0.6, z+Math.sin(a)*r*0.6]);
}
/* a row of houses along a street: axis 'x' → street along x at z=cross; side ±1 = which side of the street */
function houseRow(axis,u0,u1,cross,side,o){
  o=o||{}; var rnd=o.rnd||Math.random, u=Math.min(u0,u1), end=Math.max(u0,u1), n=0, guard=0;
  while(u<end && guard++<60){
    var w=o.w?(o.w[0]+rnd()*(o.w[1]-o.w[0])):(6+rnd()*3), d=o.d?(o.d[0]+rnd()*(o.d[1]-o.d[0])):(5+rnd()*2.5);
    var gap=o.gap!==undefined?o.gap:(1.5+rnd()*2.5);
    var cu=u+w/2; if(cu+w/2>end) break;
    var off=(o.off||0)+d/2+0.6;
    var x,z,door;
    if(axis==='x'){ x=cu; z=cross+side*off; door=side>0?'N':'S'; }
    else { z=cu; x=cross+side*off; door=side>0?'W':'E'; }
    var rr=Math.hypot(w,d)/2+0.8, dp0=doorPoint({x:x,z:z,w:w,d:d,door:door},1.4);
    if(!insideSolid(x,z,rr) && !insideSolid(dp0.x,dp0.z,1.0) && !nearDoor(x,z,rr+1) && !(o.avoid&&o.avoid(x,z,rr))){
      var interior=o.interior||(rnd()<0.12?'store':'house');
      if(typeof interior==='function') interior=interior(n);
      buildBuilding({x:x, z:z, w:w, d:d, h:o.h||(3.2+rnd()*0.8), wall:o.wall?o.wall[Math.floor(rnd()*o.wall.length)]:0xe2d6bb,
        roofCol:o.roofCol?o.roofCol[Math.floor(rnd()*o.roofCol.length)]:0x70503a, roof:o.roof?(typeof o.roof==='string'?o.roof:o.roof[Math.floor(rnd()*o.roof.length)]):'gable',
        door:door, interior:interior, fac:o.fac, style:o.style, timberFrame:o.timberFrame, plinth:o.plinth, chimney:o.chimney!==false, windows:o.windows, floors:o.floors, name:o.name, porch:o.porch,
        prispa:o.prispa?rnd()<o.prispa:false, bench:o.bench!==false, gableWin:rnd()<0.6, band:o.band, chimney2:w>8.5&&rnd()<0.4});
      n++;
    }
    u+=w+gap;
  }
  return n;
}
function townStalls(x,z,n,r,rnd){
  var kit=cellKit(x,z), i;
  for(i=0;i<n;i++){
    var a=i/n*TAU+0.3, sx=x+Math.cos(a)*r, sz=z+Math.sin(a)*r, sy=groundH(sx,sz), ry=-a+Math.PI/2;
    var C=M2([0x7a3434,0x3f5f8a,0xc9a227,0xe2d6bb,0x4a6a3a][i%5]);
    kit.box(M2(0x7a5c39),2.6,0.1,1.1,sx,sy+0.95,sz,ry); kit.box(M2(0x5d4326),0.1,0.95,0.1,sx-1.2,sy+0.48,sz,ry); kit.box(M2(0x5d4326),0.1,0.95,0.1,sx+1.2,sy+0.48,sz,ry);
    kit.box(M2(0x5d4326),0.1,2.4,0.1,sx-1.25,sy+1.2,sz-0.5,ry); kit.box(M2(0x5d4326),0.1,2.4,0.1,sx+1.25,sy+1.2,sz-0.5,ry);
    kit.box(C,3.0,0.06,1.8,sx,sy+2.45,sz-0.1,ry,0.25,0);
    kit.cyln(M2([0xc46a2a,0xb9a13a,0x5a7a3a,0xc9a065,0x8a3a2a][i%5]),0.25,0.25,0.3,8,sx-0.6,sy+1.15,sz,ry); kit.box(M2([0xe8e0cf,0x8a3a5a,0x2f5a7a,0xa88a3a,0x6b4f2e][i%5]),0.6,0.3,0.5,sx+0.5,sy+1.15,sz,ry);
    var c=Math.cos(a), s=Math.sin(a); addCollider(sx-Math.abs(1.4*s)-Math.abs(0.6*c), sz-Math.abs(1.4*c)-Math.abs(0.6*s), sx+Math.abs(1.4*s)+Math.abs(0.6*c), sz+Math.abs(1.4*c)+Math.abs(0.6*s));
  }
  BUILD_COUNT+=n;
}
function townTrees(x,z,n,r,rnd,col){
  var kit=cellKit(x,z), i;
  for(i=0;i<n;i++){ var a=i/n*TAU+rnd(), tx=x+Math.cos(a)*r, tz=z+Math.sin(a)*r; if(insideSolid(tx,tz,2.5)||nearDoor(tx,tz,3)) continue; var ty=groundH(tx,tz), s=0.8+rnd()*0.5;
    kit.cyln(M2(0x5d4326),0.25*s,0.35*s,2.2*s,6,tx,ty+1.1*s,tz); kit.cyln(M2(col||0x4a7a37),1.9*s,0.9*s,2.4*s,7,tx,ty+3.2*s,tz); kit.cyln(M2(col||0x4a7a37),1.2*s,0.3*s,1.6*s,7,tx,ty+4.8*s,tz); addCollider(tx-0.4,tz-0.4,tx+0.4,tz+0.4); }
}

function buildTown(f){
  var T=TOWNS[f], rnd=srand(f.length*977+T.x*3+T.z);
  siteBegin(T.name, T.x, T.z, TOWN_RADIUS[f]+80);
  window.__roadPts=window.__roadPts||[];
  var td={name:T.name, x:T.x, z:T.z, r:TOWN_RADIUS[f]}, s0=TOWN_STREETS.length;
  ({sparta:townArdealburg, rome:townCetatea, moldavia:townHotarul, vikings:townStanca, egypt:townDrumulLung, nippon:townRomaria})[f](T.x,T.z,f,rnd,td);
  if(f!=='nippon') td.infill=townInfill(T, td, rnd, TOWN_STREETS.slice(s0));
  townData[f]=td;
  siteEnd();
  registerTownLore(f);
}

/* ---- infill: townhouses of the region's kit along every straight street inside the walls (instanced prefabs) ---- */
function townInfill(T, td, rnd, streets){
  var reg=getRegion(T.x,T.z), n=0, inside=td.inside||function(x,z){ return Math.hypot(x-T.x,z-T.z)<(td.r||150)-10; };
  function rect(s){ return {x0:Math.min(s.x0,s.x1)-s.w/2, x1:Math.max(s.x0,s.x1)+s.w/2, z0:Math.min(s.z0,s.z1)-s.w/2, z1:Math.max(s.z0,s.z1)+s.w/2}; }
  var rects=streets.map(rect);
  function hitsStreet(ax0,az0,ax1,az1){ for(var i=0;i<rects.length;i++){ var r=rects[i]; if(ax0<r.x1&&ax1>r.x0&&az0<r.z1&&az1>r.z0) return true; } return false; }
  function nearPlaza(x,z,r){ for(var i=0;i<TOWN_PLAZAS.length;i++){ var p=TOWN_PLAZAS[i]; if(Math.hypot(x-p.x,z-p.z)<p.r+r) return true; } return false; }
  streets.forEach(function(s){
    var ax=Math.abs(s.x1-s.x0)>Math.abs(s.z1-s.z0)?'x':'z';
    if(ax==='x'?Math.abs(s.z1-s.z0)>0.5:Math.abs(s.x1-s.x0)>0.5) return;       /* only the straight grid streets */
    var u0=Math.min(ax==='x'?s.x0:s.z0, ax==='x'?s.x1:s.z1), u1=Math.max(ax==='x'?s.x0:s.z0, ax==='x'?s.x1:s.z1), cross=ax==='x'?s.z0:s.x0;
    [-1,1].forEach(function(side){
      var u=u0+3+rnd()*4;
      while(u<u1-4){
        var type=rnd()<0.18?'workshop':rnd()<0.3?'cottage':'house', key=reg+'.'+type+(type==='workshop'?1:1+Math.floor(rnd()*3));
        var pf=prefabGet(key); if(!pf){ u+=10; continue; }
        var face=ax==='x'?(side<0?'S':'N'):(side<0?'E':'W'), r=prefabRot(face);
        var hx=(r%2)?pf.hz:pf.hx, hz=(r%2)?pf.hx:pf.hz, along=ax==='x'?hx:hz, deep=ax==='x'?hz:hx;
        var cu=u+along, off=s.w/2+1.3+deep, x=ax==='x'?cu:cross+side*off, z=ax==='x'?cross+side*off:cu, rr=Math.hypot(hx,hz)+0.8;
        if(inside(x,z) && inside(x-hx,z-hz) && inside(x+hx,z+hz) && !insideSolid(x,z,rr) && !nearDoor(x,z,rr+1) && !nearPlaza(x,z,rr) && !hitsStreet(x-hx-0.8,z-hz-0.8,x+hx+0.8,z+hz+0.8)){
          if(prefabPlace(key,x,z,face,{maxSlope:2.5})) n++;
        }
        u=cu+along+1.2+rnd()*3;
      }
    });
  });
  return n;
}
/* ============================================================
   ARDEALBURG — walled Transylvanian market town (sparta)
   ============================================================ */
function townArdealburg(X,Z,f,rnd,td){
  td.frontZ=1;
  var WALL=0x9a8a6a, WH=[0xe2d6bb,0xd9c8a2,0xe8dcc0], RF=[0x8a4a3a,0x70503a,0x7a4030];
  var hx=112, hz=100;
  td.inside=function(x,z){ return Math.abs(x-X)<hx-9 && Math.abs(z-Z)<hz-9; };
  /* curtain wall, three gates, corner towers */
  fortWallRun([[X-hx,Z-hz],[X+hx,Z-hz],[X+hx,Z+hz],[X-hx,Z+hz]], {h:10, t:1.8, wall:WALL, slits:true},
    [{x:X+hx,z:Z,w:14},{x:X,z:Z+hz,w:14},{x:X,z:Z-hz,w:14}], true);
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(c,i){ fortTower({x:X+c[0]*hx, z:Z+c[1]*hz, r:5, h:12, sides:8, wall:WALL, roofCol:0x4a4238, roof:'cone', door:Math.atan2(-c[1],-c[0]), banner:i===0?'sparta':null, name:'Turnul '+['de Nord-Vest','de Nord-Est','de Sud-Est','de Sud-Vest'][i]}); });
  fortGate({x:X+hx, z:Z, dir:'E', w:6, h:8, wall:WALL, roofCol:0x4a4238, banner:'sparta', name:'Poarta Răsăritului'});
  fortGate({x:X, z:Z+hz, dir:'S', w:6, h:8, wall:WALL, roofCol:0x4a4238, name:'Poarta Lupilor'});
  fortGate({x:X, z:Z-hz, dir:'N', w:6, h:8, wall:WALL, roofCol:0x4a4238, name:'Poarta Mănăstirii'});
  /* streets: east gate → square, north gate → south gate */
  townStreet(X+hx+40, Z, X-40, Z, 9, 0x9a8555);
  townStreet(X, Z-hz-40, X, Z+hz+40, 8, 0x9a8555);
  townStreet(X-90, Z-60, X+90, Z-60, 6, 0x9a8555); townStreet(X-90, Z+60, X+90, Z+60, 6, 0x9a8555);
  townStreet(X-70, Z-95, X-70, Z+95, 6, 0x9a8555); townStreet(X+70, Z-95, X+70, Z+95, 6, 0x9a8555);
  townPlaza(X, Z, 24, 0x9a8555);
  /* town hall on the north side of the square (door faces the square = south = front) */
  var hall=buildBuilding({x:X, z:Z-42, w:22, d:14, h:7.5, wall:0xe2d6bb, roofCol:0x8a4a3a, roof:'gable', door:'S', interior:'townhall', name:'Primăria Ardealburg', fac:f, floors:2, tower:true, timberFrame:true,
    lore:{key:'ardeal_hall', icon:'🏛', sub:'Town hall of the guilds', story:'The council of Ardealburg sits under the painted beams: guild masters, the judge and the burgrave. Their seal opens every gate on the Transylvanian roads.'}});
  td.hall={x:X, z:Z-42, door:hall.door};
  /* market square: stalls, well, linden trees */
  townStalls(X, Z, 10, 16, rnd); propWell(X, Z, 0x70503a);
  townTrees(X, Z, 6, 30, rnd, 0x57893f);
  /* tavern Lupul Roșu, school of scribes, church */
  buildBuilding({x:X+36, z:Z+36, w:14, d:11, h:4.2, wall:0xd9c8a2, roofCol:0x70503a, roof:'gable', door:'W', interior:'tavern', name:'Hanul Lupul Roșu', fac:f, floors:2, timberFrame:true, sign:'wolf',
    lore:{key:'lupul_rosu', icon:'🍺', sub:'Tavern of the Red Wolf', story:'Mulled wine, sour soup and news from three borders. The wolf on the sign is said to have been painted with the blood of a bandit chief.'}});
  buildBuilding({x:X-38, z:Z+38, w:13, d:10, h:4.6, wall:0xe8dcc0, roofCol:0x8a4a3a, roof:'gable', door:'E', interior:'school', name:'Școala de Scribi', fac:f, floors:2,
    lore:{key:'scribi', icon:'📜', sub:'School of scribes', story:'Boys of the guilds learn letters here: charters, tolls, and the chronicles of every siege the town survived.'}});
  buildBuilding({x:X-44, z:Z-38, w:11, d:20, h:7, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'S', interior:'church', name:'Biserica Sf. Nicolae', fac:f, belfry:true});
  td.temple={x:X-44, z:Z-38};
  /* barracks by the east gate */
  buildBuilding({x:X+80, z:Z-24, w:18, d:9, h:4.2, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'S', interior:'barracks', name:'Cazarma Porții', fac:f});
  td.barracks={x:X+80, z:Z-24};
  buildBuilding({x:X+80, z:Z+24, w:12, d:9, h:4, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'N', interior:'stable', name:'Grajdurile Porții', fac:f});
  /* blacksmith district: south-west quarter */
  buildBuilding({x:X-30, z:Z+82, w:10, d:8, h:3.8, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'N', interior:'forge', name:'Fierăria Mare', fac:f, lore:{key:'fierarie', icon:'⚒', sub:'Blacksmith district', story:'Six forges share one street and one river of sparks. The armourers of Ardealburg sign their blades with a small wolf.'}});
  buildBuilding({x:X-46, z:Z+82, w:9, d:8, h:3.8, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'N', interior:'forge', name:'Fierăria Veche', fac:f});
  buildBuilding({x:X-62, z:Z+82, w:9, d:8, h:3.8, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'N', interior:'armorer', name:'Armurierul', fac:f});
  buildBuilding({x:X-80, z:Z+82, w:9, d:8, h:3.6, wall:0x9a8a6a, roofCol:0x4a4238, roof:'gable', door:'N', interior:'workshop', name:'Rotăria', fac:f});
  buildBuilding({x:X-90, z:Z-80, w:12, d:9, h:4, wall:0xd9c8a2, roofCol:0x70503a, roof:'gable', door:'S', interior:'granary', name:'Grânarul', fac:f});
  /* houses along the inner streets */
  var HO={rnd:rnd, wall:WH, roofCol:RF, fac:f, timberFrame:true, roof:['gable','gable','hip']};
  houseRow('x', X-100, X-14, Z-60, -1, HO); houseRow('x', X+14, X+100, Z-60, -1, HO);
  houseRow('x', X-100, X-60, Z-60, 1, HO); houseRow('x', X+14, X+60, Z-60, 1, HO);
  houseRow('x', X-100, X-14, Z+60, -1, Object.assign({}, HO, {interior:function(i){ return i%3===1?'store':'house'; }}));
  houseRow('x', X+14, X+60, Z+60, -1, HO); houseRow('x', X+14, X+100, Z+60, 1, HO);
  houseRow('z', Z-95, Z-70, X-70, -1, HO); houseRow('z', Z+70, Z+95, X+70, 1, HO);
  houseRow('z', Z-95, Z-70, X+70, -1, HO); houseRow('z', Z-95, Z-70, X+70, 1, HO);
  houseRow('x', X-100, X-60, Z+10, -1, HO); houseRow('x', X-100, X-60, Z+10, 1, HO);
  houseRow('x', X+30, X+60, Z+10, -1, HO); houseRow('x', X+30, X+60, Z+10, 1, HO);
  /* torches along the main street, banners on the square */
  for(var i=-80;i<=80;i+=40){ torchPost(X+i, Z-7); torchPost(X+i, Z+7); }
  bannerOn(PROP_PARENT, X-20, groundH(X-20,Z)+5, Z-20, 'sparta'); bannerOn(PROP_PARENT, X+20, groundH(X+20,Z)+5, Z-20, 'sparta');
  /* fields outside the walls */
  var kit=cellKit(X,Z);
  for(var fx=0;fx<6;fx++) for(var fz=0;fz<2;fz++){ var px=X-hx-60+fx*14, pz=Z+hz+40+fz*30; kit.box(M2(fx%2?0xc9b24a:0x6b8f3a), 12, 0.25, 24, px, groundH(px,pz)+0.1, pz); }
}

/* ============================================================
   CETATEA DUNĂRII — Wallachian river fortress (rome)
   ============================================================ */
function townCetatea(X,Z,f,rnd,td){
  td.frontZ=-1;
  var WALL=0x8b8579, RF=0x4a4238;
  var hx=136, hz=98;
  td.inside=function(x,z){ return Math.abs(x-X)<hx-10 && Math.abs(z-Z)<hz-10; };
  /* the moat water and the 20 m curtain walls with four great towers */
  moatWater(X, Z, 150, 112, 14, groundHBase(X+150,Z)+1.0);
  fortWallRun([[X-hx,Z-hz],[X+hx,Z-hz],[X+hx,Z+hz],[X-hx,Z+hz]], {h:20, t:3.2, wall:WALL, slits:true}, [{x:X,z:Z-hz,w:20}], true);
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(c,i){ fortTower({x:X+c[0]*hx, z:Z+c[1]*hz, r:9, h:27, sides:10, wall:WALL, roofCol:RF, roof:'cone', door:Math.atan2(-c[1],-c[0]), banner:'rome', brazier:false, name:'Turnul '+['Dunării','Răsăritului','Bălții','Apusului'][i]}); });
  fortGate({x:X, z:Z-hz, dir:'N', w:8, h:20, tw:7, ph:7, wall:WALL, roofCol:RF, banner:'rome', name:'Poarta Podului Ridicător'});
  /* drawbridge chains */
  var g=PROP_PARENT, by=groundH(X,Z-hz-10);
  for(var s=-1;s<=1;s+=2){ var ch=cyl(0.06,0.06,16,4,M(0x50565e)); ch.position.set(X+s*3.6, by+13, Z-hz-8); ch.rotation.x=0.9; g.add(ch); }
  /* inner courtyard: streets and the keep */
  townStreet(X, Z-200, X, Z+30, 10, 0x8a8070); townStreet(X-110, Z, X+110, Z, 8, 0x8a8070); townStreet(X-110, Z-60, X+110, Z-60, 6, 0x8a8070);
  townStreet(X-30, Z-92, X-30, Z-30, 5, 0x8a8070); townStreet(X+30, Z-92, X+30, Z-30, 5, 0x8a8070);           /* the lanes of the garrison quarter */
  townStreet(X-125, Z+36, X-26, Z+36, 5, 0x8a8070); townStreet(X+26, Z+36, X+125, Z+36, 5, 0x8a8070);
  townPlaza(X, Z-10, 26, 0x8a8070);
  var keep=buildBuilding({x:X, z:Z+56, w:40, d:26, h:14, wall:0x7d7669, roofCol:RF, roof:'flat', door:'N', interior:'grandhall', name:'Sala Mare a Cetății', fac:f, battlements:true, buttress:true,
    lore:{key:'sala_mare', icon:'🏰', sub:'Grand hall of the Danube fortress', story:'The Voivode holds court under iron chandeliers. Every treaty with the south was sealed at this table — and broken at least once.'}});
  td.hall={x:X, z:Z+56, door:keep.door};
  buildBuilding({x:X-96, z:Z+66, w:22, d:12, h:6, wall:0x6f6a62, roofCol:RF, roof:'flat', door:'N', interior:'dungeon', name:'Temnița', fac:f, battlements:true, windows:false,
    lore:{key:'temnita', icon:'⛓', sub:'The dungeon', story:'Twelve cells, one torch. Prisoners of three wars scratched their names into the stone; some names are still read aloud on feast days.'}});
  buildBuilding({x:X+96, z:Z+66, w:24, d:12, h:5.5, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'long', door:'N', interior:'stable', name:'Grajdurile Cetății', fac:f});
  buildBuilding({x:X-60, z:Z-64, w:20, d:11, h:5.5, wall:0x8b8579, roofCol:RF, roof:'gable', door:'S', interior:'kitchen', name:'Bucătăria Mare', fac:f, chimney:true});
  buildBuilding({x:X+60, z:Z-64, w:20, d:11, h:5.5, wall:0x8b8579, roofCol:RF, roof:'gable', door:'S', interior:'armory', name:'Armurăria', fac:f});
  td.barracks={x:X+60, z:Z-64};
  buildBuilding({x:X+62, z:Z+6, w:16, d:12, h:8, wall:0x8b8579, roofCol:RF, roof:'gable', door:'W', interior:'archive', name:'Arhiva Cetății', fac:f, floors:2,
    lore:{key:'arhiva', icon:'📚', sub:'The archive', story:'Maps of every ford on the Danube and the muster rolls of two centuries. The archivist keeps the keys on a chain around his neck.'}});
  buildBuilding({x:X-62, z:Z+6, w:12, d:18, h:8, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'E', interior:'church', name:'Paraclisul Cetății', fac:f, belfry:true});
  td.temple={x:X-62, z:Z+6};
  buildBuilding({x:X-100, z:Z-20, w:18, d:9, h:4.5, wall:0x8b8579, roofCol:RF, roof:'gable', door:'E', interior:'barracks', name:'Cazarma Gărzii', fac:f});
  buildBuilding({x:X+100, z:Z-20, w:14, d:9, h:4.5, wall:0x8b8579, roofCol:RF, roof:'gable', door:'W', interior:'forge', name:'Fierăria Cetății', fac:f});
  buildBuilding({x:X+100, z:Z+28, w:12, d:9, h:4.5, wall:0x8b8579, roofCol:RF, roof:'gable', door:'W', interior:'granary', name:'Magazia', fac:f});
  /* well, braziers, training posts */
  propWell(X-24, Z-10, RF); propBrazier(X+24, Z-10, true);
  for(var i=0;i<4;i++) propBarrel(X-104+i*2.2, Z+40, i%2===0);
  for(var t=-1;t<=1;t+=2){ torchPost(X+t*10, Z-hz-14, 3); torchPost(X+t*30, Z-30, 2.6); torchPost(X+t*30, Z+30, 2.6); }
  /* the lower town outside the moat: fishermen and traders along the road */
  var HO={rnd:rnd, wall:[0x8a7a5e,0x7a6a4a,0x94826a], roofCol:[0x968047,0x6d5a3e], roof:['thatch','hipthatch','gable','hip'], fac:f, prispa:0.5};
  houseRow('x', X-110, X-20, Z-150, -1, HO); houseRow('x', X+20, X+110, Z-150, -1, HO);
  houseRow('x', X-110, X-20, Z-150, 1, Object.assign({}, HO, {avoid:function(x,z){ return z>Z-hz-30; }}));
  houseRow('x', X+20, X+110, Z-150, 1, Object.assign({}, HO, {avoid:function(x,z){ return z>Z-hz-30; }}));
  townStreet(X-130, Z-150, X+130, Z-150, 7, 0x7a6a4a);
  for(var r=0;r<3;r++) propCart(X-40+r*30, Z-172, rnd()*0.6, false);
}

/* ============================================================
   HOTARUL DE NORD — Moldavian border fort (moldavia)
   ============================================================ */
function townHotarul(X,Z,f,rnd,td){
  td.frontZ=1;
  var TIM=0x5d4326, DK=0x3a2a1a, RF=0x4a3a2a;
  /* earth rampart, double palisade with two gates (north road, south road) */
  td.inside=function(x,z){ return Math.hypot(x-X,z-Z)<138; };
  rampart(X, Z, 178, 40, 2.2, 7);
  palisade(ringPts(X,Z,172,44), {h:6, gaps:[{x:X,z:Z-172,w:12},{x:X,z:Z+172,w:12}], walk:true});
  palisade(ringPts(X,Z,150,40), {h:5, gaps:[{x:X,z:Z-150,w:12},{x:X,z:Z+150,w:12}], col:0x6b4f2e});
  /* watchtowers on the ring and the gate towers */
  for(var i=0;i<6;i++){ var a=i/6*TAU+0.26; fortTower({x:X+Math.cos(a)*161, z:Z+Math.sin(a)*161, r:3.4, h:11, sides:6, wall:0x6b4f2e, roofCol:RF, roof:'timber', door:a+Math.PI, brazier:i%2===0, name:'Turnul de veghe '+(i+1)}); }
  fortGate({x:X, z:Z-160, dir:'N', w:6, h:7, tw:4, wall:0x6b4f2e, roofCol:RF, banner:'moldavia', name:'Poarta de Miazănoapte', portcullis:false});
  fortGate({x:X, z:Z+160, dir:'S', w:6, h:7, tw:4, wall:0x6b4f2e, roofCol:RF, banner:'moldavia', name:'Poarta de Miazăzi', portcullis:false});
  townStreet(X, Z-190, X, Z+190, 8, 0x7a7a6a); townStreet(X-120, Z, X+120, Z, 6, 0x7a7a6a);
  townStreet(X-60, Z-112, X-60, Z+112, 5, 0x7a7a6a); townStreet(X+60, Z-112, X+60, Z+112, 5, 0x7a7a6a);
  townStreet(X-112, Z-60, X+112, Z-60, 5, 0x7a7a6a); townStreet(X-112, Z+60, X+112, Z+60, 5, 0x7a7a6a);
  townPlaza(X, Z, 22, 0x7a7a6a);
  var hall=buildBuilding({x:X, z:Z-44, w:24, d:14, h:6.5, wall:TIM, roofCol:RF, roof:'long', door:'S', interior:'hall', name:'Casa Pârcălabului', fac:f, style:'log',
    lore:{key:'hotar_hall', icon:'🛡', sub:'Seat of the border captain', story:'The pârcălab of the north keeps the muster horn above his chair. When it sounds, every hamlet between the rivers sends its men.'}});
  td.hall={x:X, z:Z-44, door:hall.door};
  buildBuilding({x:X-60, z:Z-40, w:22, d:10, h:4.5, wall:TIM, roofCol:RF, roof:'gable', door:'S', interior:'barracks', name:'Cazarma Străjerilor', fac:f, style:'log'});
  buildBuilding({x:X+60, z:Z-40, w:22, d:10, h:4.5, wall:TIM, roofCol:RF, roof:'gable', door:'S', interior:'barracks', name:'Cazarma Arcașilor', fac:f, style:'log'});
  td.barracks={x:X-60, z:Z-40};
  buildBuilding({x:X-60, z:Z+44, w:10, d:16, h:6, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'N', interior:'church', name:'Biserica de Lemn', fac:f, belfry:true});
  td.temple={x:X-60, z:Z+44};
  buildBuilding({x:X+60, z:Z+44, w:20, d:11, h:5, wall:0x6b4f2e, roofCol:RF, roof:'long', door:'N', interior:'stable', name:'Grajdurile Călăreților', fac:f});
  buildBuilding({x:X, z:Z+70, w:16, d:10, h:4.5, wall:TIM, roofCol:RF, roof:'gable', door:'N', interior:'granary', name:'Hambarul Cetății', fac:f, style:'log'});
  buildBuilding({x:X-40, z:Z+72, w:14, d:8, h:4, wall:TIM, roofCol:RF, roof:'gable', door:'N', interior:'warehouse', name:'Depozitul de Sare I', fac:f, style:'log', plinth:true, lore:{key:'sare1', icon:'🧂', sub:'Salt warehouse', story:'White gold from Ocna de Jos, stacked in blocks and guarded like coin. The Salt Road begins at this ramp.'}});
  buildBuilding({x:X+40, z:Z+72, w:14, d:8, h:4, wall:TIM, roofCol:RF, roof:'gable', door:'N', interior:'warehouse', name:'Depozitul de Sare II', fac:f, style:'log', plinth:true});
  buildBuilding({x:X-100, z:Z, w:10, d:8, h:3.8, wall:TIM, roofCol:RF, roof:'gable', door:'E', interior:'forge', name:'Fierăria de Hotar', fac:f, style:'log'});
  buildBuilding({x:X+100, z:Z, w:10, d:8, h:3.8, wall:TIM, roofCol:RF, roof:'gable', door:'W', interior:'workshop', name:'Atelierul Săgeților', fac:f, style:'log'});
  buildBuilding({x:X+28, z:Z-100, w:10, d:8, h:3.8, wall:TIM, roofCol:RF, roof:'gable', door:'W', interior:'guardhouse', name:'Corpul de Gardă', fac:f, style:'log'});
  /* the signal tower */
  fortTower({x:X-30, z:Z-96, r:3.2, h:16, sides:6, wall:0x6b4f2e, roofCol:RF, roof:'open', door:0, brazier:true, banner:'moldavia', name:'Turnul Semnalului'});
  /* cabins, archery butts, the training ground */
  var HO={rnd:rnd, wall:[TIM,0x6b4f2e,0x4a3a2a], roofCol:[RF,0x3a2a1a], roof:['gable','gable','hip'], fac:f, style:'log', h:3.4, prispa:0.4};
  houseRow('x', X-120, X-20, Z+112, -1, HO); houseRow('x', X+20, X+120, Z+112, -1, HO);
  houseRow('z', Z-120, Z-60, X-108, 1, HO); houseRow('z', Z+60, Z+120, X+108, -1, HO);
  var kit=cellKit(X,Z);
  for(var b=0;b<4;b++){ var bx=X+80+b*6, bz=Z+96; kit.cyln(M2(0xc9b24a),0.9,0.9,0.5,10,bx,groundH(bx,bz)+1.2,bz,0,Math.PI/2,0); kit.cyln(M2(0x7a3434),0.3,0.3,0.52,10,bx,groundH(bx,bz)+1.2,bz,0,Math.PI/2,0); kit.box(M2(TIM),0.2,1.2,0.2,bx,groundH(bx,bz)+0.6,bz+0.3); addCollider(bx-0.9,bz-0.4,bx+0.9,bz+0.5); }
  for(var p=0;p<5;p++){ var px=X-90+p*5, pz=Z+96; kit.cyln(M2(0x5d4326),0.2,0.25,2.2,7,px,groundH(px,pz)+1.1,pz); kit.box(M2(0xb5a487),0.9,0.5,0.5,px,groundH(px,pz)+1.6,pz); addCollider(px-0.3,pz-0.3,px+0.3,pz+0.3); }
  propCampfire(X-24, Z+8, true); propCampfire(X+24, Z+8, false);
  for(var t=0;t<8;t++){ var ta=t/8*TAU; torchPost(X+Math.cos(ta)*26, Z+Math.sin(ta)*26, 2.6); }
  for(var s=0;s<6;s++) propStakes(X+Math.cos(s)*186, Z+Math.sin(s)*186, -s, 5);
}

/* ============================================================
   STÂNCA DE FIER — Carpathian mountain fort (vikings)
   ============================================================ */
function townStanca(X,Z,f,rnd,td){
  td.frontZ=1;
  var WALL=0x8a9aa8, W2=0x7a8a98, RF=0x3a4048, i;
  /* pentagon curtain: apex north, gate on the south face (U-CA-01) */
  var P5=[[X,Z-100],[X+95,Z-30],[X+60,Z+90],[X-60,Z+90],[X-95,Z-30]];
  td.inside=function(x,z){ var px=(x-X)/0.88, pz=(z-Z)/0.88, inn=false; for(var i=0,j=4;i<5;j=i++){ var xi=P5[i][0]-X, zi=P5[i][1]-Z, xj=P5[j][0]-X, zj=P5[j][1]-Z; if((zi>pz)!==(zj>pz) && px<(xj-xi)*(pz-zi)/(zj-zi)+xi) inn=!inn; } return inn; };
  fortWallRun(P5, {h:11, t:2.4, wall:WALL, slits:true}, [{x:X,z:Z+90,w:18}], true);
  var tn=['Farul Trecătorii','Turnul Gheții','Turnul Porții de Răsărit','Turnul Porții de Apus','Turnul Vântului'];
  P5.forEach(function(c,k){ fortTower({x:c[0], z:c[1], r:k===0?6.5:6, h:k===0?22:16, sides:8, wall:W2, roofCol:RF, roof:k===0?'open':(k<3?'flat':'cone'), door:Math.atan2(Z-c[1],X-c[0]), brazier:k<3, banner:k===2?'vikings':null, name:tn[k]}); });
  fortGate({x:X, z:Z+90, dir:'S', w:7, h:11, tw:5.5, ph:5.2, wall:W2, roofCol:RF, banner:'vikings', name:'Poarta de Fier'});
  townStreet(X, Z+90+40, X, Z-60, 9, 0x7a7a82); townStreet(X-80, Z, X+80, Z, 7, 0x7a7a82); townStreet(X-55, Z+50, X+55, Z+50, 5, 0x7a7a82);
  townPlaza(X, Z+10, 22, 0x7a7a82);
  var keep=buildBuilding({x:X, z:Z-50, w:30, d:22, h:12, wall:0x7a8a98, roofCol:RF, roof:'flat', door:'S', interior:'grandhall', name:'Donjonul Stâncii de Fier', fac:f, battlements:true, buttress:true,
    lore:{key:'stanca_keep', icon:'🏔', sub:'Keep of the iron rock', story:'Bolted to the spur with iron pins, the keep has never been taken. Its beacon answers the Turnul Vântului across the pass.'}});
  td.hall={x:X, z:Z-50, door:keep.door};
  buildBuilding({x:X-62, z:Z-12, w:22, d:10, h:5, wall:WALL, roofCol:RF, roof:'gable', door:'S', interior:'barracks', name:'Cazarma Muntenilor', fac:f});
  td.barracks={x:X-62, z:Z-12};
  buildBuilding({x:X+64, z:Z-8, w:12, d:18, h:7, wall:0xe2d6bb, roofCol:RF, roof:'church', door:'S', interior:'church', name:'Capela Sf. Gheorghe', fac:f, belfry:true});
  td.temple={x:X+64, z:Z-8};
  buildBuilding({x:X+56, z:Z+40, w:12, d:9, h:4.2, wall:WALL, roofCol:RF, roof:'gable', door:'W', interior:'forge', name:'Fierăria Stâncii', fac:f});
  buildBuilding({x:X-58, z:Z+40, w:16, d:10, h:4.8, wall:WALL, roofCol:RF, roof:'gable', door:'E', interior:'granary', name:'Depozitul de Iarnă', fac:f});
  buildBuilding({x:X+38, z:Z-60, w:14, d:10, h:4.8, wall:WALL, roofCol:RF, roof:'gable', door:'S', interior:'armory', name:'Armurăria Muntelui', fac:f});
  buildBuilding({x:X-50, z:Z+70, w:14, d:9, h:4.2, wall:WALL, roofCol:RF, roof:'gable', door:'E', interior:'stable', name:'Grajdurile', fac:f});
  buildBuilding({x:X+50, z:Z+70, w:10, d:8, h:4, wall:WALL, roofCol:RF, roof:'gable', door:'W', interior:'guardhouse', name:'Corpul de Gardă', fac:f});
  var HO={rnd:rnd, wall:[WALL,W2,0x8f8a80], roofCol:[RF,0x4a4238], roof:['gable','hip'], fac:f, h:3.4, plinth:true, band:true};
  houseRow('x', X-70, X-20, Z+20, 1, HO); houseRow('x', X+20, X+70, Z+20, 1, HO);
  houseRow('x', X-40, X-14, Z-24, -1, HO); houseRow('x', X+14, X+40, Z-24, -1, HO);
  propWell(X-20, Z+10, RF); propBrazier(X+20, Z+10, true); propBrazier(X, Z+90+16, true);
  for(var t=-1;t<=1;t+=2){ torchPost(X+t*8, Z+90+12, 3); torchPost(X+t*40, Z+2, 2.6); }
  /* spike field flanking the approach, and the beacon on the eastern spur */
  for(i=0;i<5;i++){ propStakes(X-16-i*5, Z+108+(i%2)*6, 0.2*i, 5); propStakes(X+16+i*5, Z+108+(i%2)*6, -0.2*i, 5); }
  fortTower({x:X+150, z:Z-40, r:3.4, h:12, sides:6, wall:W2, roofCol:RF, roof:'open', door:Math.PI, brazier:true, name:'Rugul de Veghe'});
}

/* ============================================================
   DRUMUL LUNG — the great road inn and caravan town (egypt)
   ============================================================ */
function townDrumulLung(X,Z,f,rnd,td){
  td.frontZ=1;
  var AD=0xc2b08a, AD2=0xd9c8a2, RF=0x9a6a3a, RF2=0x7a5a3a;
  td.inside=function(x,z){ return Math.hypot(x-X,z-Z)<135; };
  townStreet(X-170, Z, X+170, Z, 14, 0xc2b08a); townStreet(X, Z-120, X, Z+120, 8, 0xc2b08a);
  townStreet(X-120, Z-60, X+120, Z-60, 6, 0xc2b08a); townStreet(X-120, Z+60, X+120, Z+60, 6, 0xc2b08a);
  townPlaza(X, Z-30, 30, 0xc2b08a);
  var inn=buildBuilding({x:X, z:Z-74, w:34, d:16, h:5.5, wall:AD2, roofCol:RF, roof:'gable', door:'S', interior:'inn', name:'Hanul Drumul Lung', fac:f, floors:2, timberFrame:true, arcade:true,
    lore:{key:'drumul_lung', icon:'🏨', sub:'The great inn of the southern road', story:'Forty beds, a stable for two hundred horses and a cellar the size of a chapel. Every caravan between the Danube and the mountains stops here.'}});
  td.hall={x:X, z:Z-74, door:inn.door};
  buildBuilding({x:X-70, z:Z-70, w:26, d:12, h:5, wall:AD, roofCol:RF2, roof:'long', door:'S', interior:'stable', name:'Grajdurile Caravanelor', fac:f});
  buildBuilding({x:X+70, z:Z-70, w:22, d:12, h:5, wall:AD, roofCol:RF2, roof:'long', door:'S', interior:'stable', name:'Grajdurile de Schimb', fac:f});
  buildBuilding({x:X-70, z:Z+40, w:16, d:10, h:4.5, wall:AD, roofCol:RF2, roof:'gable', door:'N', interior:'workshop', name:'Atelierul de Reparații', fac:f, lore:{key:'atelier', icon:'🛠', sub:'Repair workshop', story:'Wheels, axles, harness and horseshoes — no caravan leaves the inn limping.'}});
  buildBuilding({x:X+70, z:Z+40, w:20, d:10, h:4.5, wall:AD, roofCol:RF2, roof:'gable', door:'N', interior:'barracks', name:'Cazarma Gărzii Drumului', fac:f});
  td.barracks={x:X+70, z:Z+40};
  buildBuilding({x:X-30, z:Z+96, w:10, d:16, h:6, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'N', interior:'church', name:'Biserica Drumeților', fac:f, belfry:true});
  td.temple={x:X-30, z:Z+96};
  buildBuilding({x:X+30, z:Z+96, w:16, d:10, h:4.5, wall:AD, roofCol:RF2, roof:'gable', door:'N', interior:'tradepost', name:'Depozitul Negustorilor', fac:f});
  buildBuilding({x:X+120, z:Z-30, w:12, d:9, h:4, wall:AD, roofCol:RF2, roof:'gable', door:'W', interior:'forge', name:'Potcovăria', fac:f});
  buildBuilding({x:X-120, z:Z-30, w:12, d:9, h:4, wall:AD, roofCol:RF2, roof:'gable', door:'E', interior:'bathhouse', name:'Baia Drumeților', fac:f});
  /* caravan yard: carts, wells, market stalls, palms of the south (poplars) */
  townStalls(X, Z-30, 9, 20, rnd); propWell(X, Z-30, RF); propWell(X-100, Z+8, RF);
  for(var c=0;c<6;c++) propCart(X-60+c*24, Z+14, (c%2?0.2:-0.2)+rnd()*0.2, c===4);
  for(var t=-140;t<=140;t+=40){ torchPost(X+t, Z-9, 2.6); torchPost(X+t, Z+9, 2.6); }
  townTrees(X, Z+30, 8, 46, rnd, 0x7a8a5a);
  var HO={rnd:rnd, wall:[AD,AD2,0xb9a98a], roofCol:[RF,RF2], roof:['gable','flat','hip'], fac:f, h:3.4, band:true};
  houseRow('x', X-130, X-20, Z+60, 1, Object.assign({}, HO, {interior:function(i){ return i%2?'store':'house'; }})); houseRow('x', X+20, X+130, Z+60, 1, HO);
  houseRow('x', X-130, X-95, Z-60, -1, HO); houseRow('x', X+95, X+130, Z-60, -1, HO);
  houseRow('x', X-130, X-20, Z+60, -1, HO); houseRow('x', X+20, X+130, Z+60, -1, HO);
  /* Poarta Sud checkpoint tower at the town's south-east edge */
  fortTower({x:X+150, z:Z+20, r:3.6, h:12, sides:8, wall:0x9a8a6a, roofCol:RF2, roof:'timber', door:Math.PI, banner:'egypt', name:'Turnul Vămii'});
  propFence(X-170, Z-14, X-140, Z-14, 1.1); propFence(X-170, Z+14, X-140, Z+14, 1.1);
}

/* ============================================================
   ROMARIA — the capital (nippon) — ROM-MAP-SPEC-003 §6 R-06
   circular curtain r520 (32 sides, 16 towers, 4 axis gates + the
   market postern at 45°), ring road r460, palace core with the
   esplanade and garden court, garden belt r<300, noble/artisan/
   merchant/docks/training districts, water gates where the Royal
   River enters and leaves, cathedral + grand market outside the
   south-east gate, twelve shrines at r580.
   ============================================================ */
function arcFree(x,z,rr){ /* keep-out shared by every capital row: ring road, river, boulevards, palace core */
  var r=Math.hypot(x,z); if(r>446-rr) return true;
  if(r<118+rr) return true;                                        /* plaza + esplanade */
  if(Math.abs(x)<60+rr && z>-250-rr && z<-30+rr) return true;       /* palace, annexes, garden court */
  var rf=riverField(x,z); if(rf.river && rf.d<riverHalfWidth(rf.river,z)+rr+6) return true;
  var f=roadField(x,z); if(f.road && f.d<f.road.w/2+rr+1.2) return true;
  if(x>230-rr && z>150-rr && z<400+rr && x<330) return true;        /* docks */
  return false;
}
function townRomaria(X,Z,f,rnd,td){
  var ST=0x9a9a8a, ST2=0x8a8a7a, BL=0x3f5f8a, RD=0x8a4a3a, WH=0xe2d6bb, i, k;
  var R=520, N=32, kit=cellKit(X,Z);
  td.frontZ=1;
  /* ---- the circular curtain: 32 sides, rotated half a step so gates sit on segment midpoints ---- */
  var pts=[]; for(i=0;i<N;i++){ var a=(i+0.5)*TAU/N; pts.push([X+Math.cos(a)*R, Z+Math.sin(a)*R]); }
  var gates=[{x:X+R,z:Z,dir:'E',name:'Poarta Hotarului'},{x:X,z:Z+R,dir:'S',name:'Poarta Regelui'},{x:X-R,z:Z,dir:'W',name:'Poarta Ardealului'},{x:X,z:Z-R,dir:'N',name:'Poarta de Nord (Poarta Leului)'}];
  var seGate={x:X+Math.cos(Math.PI/4)*R, z:Z+Math.sin(Math.PI/4)*R, ang:Math.PI/4, name:'Poarta Târgului'};
  var gaps=gates.map(function(g){ return {x:g.x,z:g.z,w:10+12+1}; });
  gaps.push({x:seGate.x, z:seGate.z, w:8+10+1});
  /* water gates: where the Royal River crosses the wall polygon */
  var water=[], RV=RIVERS[1];
  for(i=0;i<N;i++){ var a0=pts[i], b0=pts[(i+1)%N];
    for(k=0;k<RV.pts.length-1;k++){ var h=segXw(a0[0],a0[1],b0[0],b0[1],RV.pts[k][0],RV.pts[k][1],RV.pts[k+1][0],RV.pts[k+1][1]); if(h){ water.push({x:h[0],z:h[1],w:2*(riverHalfWidth(RV,h[1])+13),seg:i}); } } }
  water.forEach(function(w){ gaps.push(w); });
  fortWallRun(pts, {h:12, t:2.6, wall:ST, slits:true}, gaps, true);
  for(i=0;i<N;i+=2){ var ta=(i+0.5)*TAU/N, tx=X+Math.cos(ta)*R, tz=Z+Math.sin(ta)*R;
    fortTower({x:tx, z:tz, r:7, h:17, sides:10, wall:ST2, roofCol:BL, roof:'cone', door:ta+Math.PI, banner:(i%6===0)?'nippon':null, name:'Turnul Cetății '+(i/2+1)}); }
  gates.forEach(function(g){ fortGate({x:g.x, z:g.z, dir:g.dir, w:10, h:12, tw:6, ph:6.2, wall:ST, roofCol:BL, banner:'nippon', name:g.name}); });
  fortGate({x:seGate.x, z:seGate.z, ang:seGate.ang, w:8, h:10, tw:5, ph:5.4, wall:ST, roofCol:BL, banner:'nippon', name:seGate.name});
  /* water gates: piers, a lintel arch and an iron grille down to the water — impassable (C-6) */
  water.forEach(function(w,wi){
    var a0=pts[w.seg], b0=pts[(w.seg+1)%N], ux=b0[0]-a0[0], uz=b0[1]-a0[1], L=Math.hypot(ux,uz); ux/=L; uz/=L;
    var gy=flatsH(w.x,w.z), ry=-Math.atan2(uz,ux), I=M2(0x50565e), S=M2(ST2);
    kit.box(S, w.w+2, 3.0, 3.4, w.x, gy+11.0, w.z, ry);                       /* lintel walk */
    kit.box(S, w.w+2, 0.8, 3.8, w.x, gy+12.6, w.z, ry);
    for(k=0;k<Math.floor(w.w/1.4);k++){ var bx=w.x+ux*(-w.w/2+0.7+k*1.4), bz=w.z+uz*(-w.w/2+0.7+k*1.4), by=groundHBase(bx,bz); kit.box(I,0.16,gy+9.6-by,0.16, bx,(gy+9.6+by)/2,bz); }
    kit.box(I, w.w, 0.14, 0.14, w.x, gy+4.0, w.z, ry); kit.box(I, w.w, 0.14, 0.14, w.x, gy+7.5, w.z, ry);
    colliderAlong(w.x-ux*w.w/2, w.z-uz*w.w/2, w.x+ux*w.w/2, w.z+uz*w.w/2, 0.5);
    regStructure({name:wi===0?'Poarta Apei de Nord':'Poarta Apei de Sud', kind:'watergate', x:w.x, z:w.z, hx:w.w/2, hz:2, enterable:false});
    wallTorch(w.x-uz*2.4, gy+9.0, w.z+ux*2.4); wallTorch(w.x+uz*2.4, gy+9.0, w.z-ux*2.4);
  });
  /* ---- streets: the boulevards/ring are road ribbons (roads.js); secondary grid at ±120/±240/±360 ---- */
  [-360,-240,-120,120,240,360].forEach(function(o){
    var lim=Math.sqrt(440*440-o*o);
    townStreet(X-lim, Z+o, X+lim, Z+o, 6, 0x8a8070); townStreet(X+o, Z-lim, X+o, Z+lim, 6, 0x8a8070);
  });
  townPlaza(X, Z, 48, ST);                                                     /* the grand plaza */
  kit.box(M2(tintHex(ST,-0.3)), 84, 0.1, 100, X, groundH(X,Z-95)+0.05, Z-95); /* the esplanade between the carriageways */
  /* ---- the Lion Column on the crossing of the boulevards ---- */
  var cy=groundH(X,Z);
  kit.cyln(M2(ST),2.2,2.6,1.4,10,X,cy+0.7,Z); kit.cyln(M2(0xe2d6bb),0.7,0.9,7.0,10,X,cy+4.9,Z); kit.box(M2(0xc9a227),1.6,1.2,0.8,X,cy+9.0,Z,0.6); kit.box(M2(0xc9a227),0.8,0.8,0.6,X+0.6,cy+9.7,Z-0.2,0.6);
  addCollider(X-2.6,Z-2.6,X+2.6,Z+2.6);
  for(i=0;i<8;i++){ var la=i/8*TAU+0.39; torchPost(X+Math.cos(la)*8, Z+Math.sin(la)*8, 2.8); }
  /* ---- palace core: throne hall (0,-160), treasury W, library E, kitchen & servants N, garden court ---- */
  var pal=buildBuilding({x:X, z:Z-160, w:36, d:22, h:10, wall:WH, roofCol:BL, roof:'gable', door:'S', interior:'throne', name:'Palatul Regal', fac:f, floors:2, tower:true, arcade:true, dome:true, backDoor:true,
    lore:{key:'palat', icon:'👑', sub:'The royal palace', story:'Two thrones under a gilded ceiling: the crown of Romaria and the empty seat of the heir. Behind the hall a garden court with a fountain is the only quiet place in the capital.'}});
  td.hall={x:X, z:Z-160, door:pal.door};
  buildBuilding({x:X-38, z:Z-160, w:10, d:8, h:5, wall:WH, roofCol:BL, roof:'flat', door:'E', interior:'cellar', name:'Vistieria', fac:f, windows:false, battlements:true,
    lore:{key:'vistieria', icon:'💰', sub:'The treasury', story:'Iron doors, no windows, and a ledger that has never balanced. The crown jewels lie in the third chest from the left.'}});
  buildBuilding({x:X+38, z:Z-160, w:10, d:8, h:6, wall:WH, roofCol:BL, roof:'gable', door:'W', interior:'library', name:'Biblioteca Regală', fac:f, floors:2});
  buildBuilding({x:X+34, z:Z-198, w:12, d:8, h:4.5, wall:WH, roofCol:BL, roof:'gable', door:'S', interior:'kitchen', name:'Bucătăriile Palatului', fac:f, chimney:true});
  buildBuilding({x:X-34, z:Z-198, w:12, d:8, h:4.5, wall:WH, roofCol:BL, roof:'gable', door:'S', interior:'house', name:'Casa Slujitorilor', fac:f});
  var GZ=Z-214;
  kit.box(M2(0x6a8a5a), 88, 0.12, 40, X, groundH(X,GZ)+0.05, GZ);
  kit.cyln(M2(ST),3.2,3.4,0.8,12,X,groundH(X,GZ)+0.4,GZ); kit.cyln(WATER_MAT,2.7,2.7,0.1,12,X,groundH(X,GZ)+0.78,GZ); kit.cyln(M2(ST),0.4,0.5,2.0,8,X,groundH(X,GZ)+1.5,GZ);
  addCollider(X-3.4,GZ-3.4,X+3.4,GZ+3.4);
  ANIM_PARTS.push({kind:'fountain', x:X, y:groundH(X,GZ)+2.5, z:GZ});
  for(i=0;i<8;i++){ var hx2=X-28+i*8; if(Math.abs(hx2-X)<6) continue; kit.box(M2(0x4a6a3a),3,0.9,2,hx2,groundH(hx2,GZ-14)+0.45,GZ-14); addCollider(hx2-1.5,GZ-15,hx2+1.5,GZ-13); }
  townTrees(X, GZ, 6, 30, rnd, 0x4a7a37);
  fortWallRun([[X-46,Z-176],[X-46,GZ-22],[X+46,GZ-22],[X+46,Z-176]], {h:3.0, t:0.7, wall:ST, merlons:false, walk:false}, [{x:X,z:GZ-22,w:5}], false);
  /* ---- garden belt r<300: lindens, hedges, the Alley of the Voivodes along the market street ---- */
  for(i=0;i<40;i++){ var ga=rnd()*TAU, gr=130+rnd()*150, gx=X+Math.cos(ga)*gr, gz=Z+Math.sin(ga)*gr; if(arcFreeCore(gx,gz)) continue; townTrees(gx,gz,1,0,rnd,0x4a7a37); }
  for(i=1;i<=5;i++){ var sx=X+i*30, sz=Z+i*30*(i<4?1:1.3), off=6; [-1,1].forEach(function(sd){ var px=sx-sd*off*0.707, pz=sz+sd*off*0.707; kit.box(M2(ST),1.2,1.4,1.2,px,groundH(px,pz)+0.7,pz,0.785); kit.box(M2(0x6a6560),0.6,2.2,0.6,px,groundH(px,pz)+2.5,pz,0.785); addCollider(px-0.7,pz-0.7,px+0.7,pz+0.7); }); }
  /* ---- named buildings of the districts ---- */
  var B=function(o){ o.fac=f; return buildBuilding(o); };
  /* NW noble quarter */
  B({x:X-300, z:Z-300, w:22, d:14, h:7.5, wall:WH, roofCol:RD, roof:'gable', door:'S', interior:'hall', name:'Conacul Basarab', floors:2, tower:true, timberFrame:true, lore:{key:'conac_basarab', icon:'🏛', sub:'Boyar manor', story:'Arcaded porch, a private chapel and a wine cellar older than the walls.'}});
  B({x:X-180, z:Z-300, w:20, d:12, h:7, wall:WH, roofCol:RD, roof:'gable', door:'S', interior:'hall', name:'Conacul Movilă', floors:2, timberFrame:true});
  B({x:X-180, z:Z-180, w:18, d:12, h:6.5, wall:WH, roofCol:RD, roof:'gable', door:'S', interior:'school', name:'Academia Domnească', floors:2, lore:{key:'academia', icon:'📜', sub:'The princely academy', story:'Greek, Slavonic and the law of the land, taught under a painted ceiling.'}});
  B({x:X-300, z:Z-180, w:12, d:18, h:7, wall:WH, roofCol:BL, roof:'church', door:'E', interior:'chapel', name:'Biserica Sf. Paraschiva', belfry:true});
  /* N artisan quarter: forges with working hammers */
  B({x:X-60, z:Z-300, w:14, d:10, h:4.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'forge', name:'Fierăria Cetății', chimney:true});
  B({x:X+60, z:Z-300, w:14, d:10, h:4.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'armorer', name:'Armurierul Regelui', chimney:true, sign:'armorer'});
  B({x:X-60, z:Z-395, w:12, d:9, h:4, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'workshop', name:'Rotăria'});
  B({x:X+60, z:Z-395, w:12, d:9, h:4, wall:WH, roofCol:RD, roof:'gable', door:'S', interior:'tailor', name:'Croitoria Curții', sign:'tailor'});
  B({x:X+200, z:Z-300, w:20, d:12, h:5.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'armory', name:'Arsenalul'});
  B({x:X+180, z:Z-180, w:16, d:11, h:5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'bathhouse', name:'Băile Publice'});
  B({x:X+180, z:Z-395, w:20, d:12, h:5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'S', interior:'granary', name:'Grânarele Regale'});
  /* E merchant quarter across the river, along the eastern boulevard */
  [['butcher','Măcelăria Regală',352,-30,'S'],['spice','Prăvălia de Mirodenii',374,-30,'S'],['bookseller','Librăria Scribilor',396,-30,'S'],['tavern','Hanul Trei Coroane',422,-31,'S'],
   ['tailor','Postăvăria',352,30,'N'],['horsetrader','Geambașul',376,31,'N'],['tradepost','Casa Negustorilor Sași',402,30,'N']].forEach(function(sh){
    B({x:X+sh[2], z:Z+sh[3], w:sh[0]==='horsetrader'?16:14, d:sh[0]==='horsetrader'?12:11, h:5, wall:0xd9c8a2, roofCol:RD, roof:'gable', door:sh[4], interior:sh[0], name:sh[1], floors:2, timberFrame:true, sign:sh[0]});
  });
  townStalls(X+390, Z+70, 6, 12, rnd);
  /* S: guild hall, apothecary, garrison, stables; SW training ground */
  B({x:X-60, z:Z+300, w:20, d:12, h:7, wall:WH, roofCol:RD, roof:'gable', door:'N', interior:'townhall', name:'Casa Breslelor', floors:2, timberFrame:true, lore:{key:'bresle', icon:'⚖', sub:'Hall of the guilds', story:'Weights, measures and the seals of twelve guilds. Prices are argued here before they are posted in the market.'}});
  B({x:X+60, z:Z+300, w:16, d:10, h:5, wall:WH, roofCol:RD, roof:'gable', door:'N', interior:'herbalist', name:'Spițeria'});
  var bar=B({x:X-180, z:Z+180, w:30, d:12, h:5.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'N', interior:'barracks', name:'Garda Regală'});
  td.barracks={x:X-180, z:Z+180};
  B({x:X-300, z:Z+180, w:22, d:12, h:5, wall:ST, roofCol:0x4a4238, roof:'long', door:'N', interior:'stable', name:'Grajdurile Regale'});
  B({x:X+180, z:Z+395, w:14, d:10, h:4.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'N', interior:'tavern', name:'Cârciuma Podului'});
  B({x:X-180, z:Z+395, w:16, d:11, h:5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'N', interior:'checkpoint', name:'Vama Porții Regelui'});
  /* training ground SW: fence, dummies, archery butts */
  propFence(X-330, Z+270, X-260, Z+270, 1.1); propFence(X-330, Z+340, X-260, Z+340, 1.1); propFence(X-330, Z+270, X-330, Z+340, 1.1);
  for(i=0;i<5;i++){ var px=X-320+i*8, pz=Z+285; kit.cyln(M2(0x5d4326),0.2,0.25,2.2,7,px,groundH(px,pz)+1.1,pz); kit.box(M2(0xb5a487),0.9,0.5,0.5,px,groundH(px,pz)+1.6,pz); addCollider(px-0.3,pz-0.3,px+0.3,pz+0.3); }
  for(i=0;i<4;i++){ var bx=X-320+i*8, bz=Z+325; kit.cyln(M2(0xc9b24a),0.9,0.9,0.5,10,bx,groundH(bx,bz)+1.2,bz,0,Math.PI/2,0); kit.cyln(M2(0x7a3434),0.3,0.3,0.52,10,bx,groundH(bx,bz)+1.2,bz,0,Math.PI/2,0); kit.box(M2(0x5d4326),0.2,1.2,0.2,bx,groundH(bx,bz)+0.6,bz+0.3); addCollider(bx-0.9,bz-0.4,bx+0.9,bz+0.4); }
  propCampfire(X-290, Z+305, true);
  /* ---- the river docks (west bank of the Royal River, z 200..370) ---- */
  var qy=flatsH(X+280,Z+290)-0.15, T=M2(0x5d4326);
  kit.box(T, 24, 0.5, 160, X+287, qy+0.25, Z+290); addCollider(X+275,Z+210,X+299,Z+370);
  for(i=0;i<9;i++){ kit.cyln(M2(0x4a3a2a),0.25,0.3,1.4,6,X+297,qy+0.9,Z+215+i*18); }
  for(i=0;i<3;i++){ var bz2=Z+230+i*45, bx2=X+312+i*3; kit.box(M2(0x6b4f2e),3,1.2,9,bx2,riverWaterY(bx2,bz2)+0.2,bz2); kit.box(T,0.2,4.5,0.2,bx2,riverWaterY(bx2,bz2)+2.6,bz2); kit.box(M2(0xe8e0cf),2.4,2.8,0.05,bx2,riverWaterY(bx2,bz2)+2.8,bz2+0.3); }
  kit.box(T,0.5,7,0.5,X+292,qy+3.5,Z+330); kit.box(T,0.3,0.3,6,X+292,qy+6.5,Z+332.5,0,0,0.5); kit.box(M2(0x50565e),0.05,3.5,0.05,X+294.4,qy+4.4,Z+335.2); propCrate(X+290,Z+336,0.9); addCollider(X+291.5,Z+329.5,X+292.5,Z+330.5);
  propCrate(X+282, Z+250, 0.9); propBarrel(X+280, Z+262, true); propCrate(X+284, Z+300, 0.7); propBarrel(X+279, Z+318, false);
  B({x:X+248, z:Z+250, w:16, d:10, h:4.5, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'gable', door:'E', interior:'warehouse', name:'Antrepozitul Portului'});
  B({x:X+250, z:Z+330, w:12, d:9, h:4.5, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'gable', door:'E', interior:'customs', name:'Căpitănia Portului', lore:{key:'capitanie', icon:'⚓', sub:'Harbour master', story:'Every barge on the Royal River pays here: salt from the north, grain from the plain, wine from the terraces.'}});
  B({x:X+291, z:Z+180, w:10, d:8, h:4.5, wall:ST, roofCol:0x5d4a38, roof:'gable', door:'N', interior:'watermill', name:'Moara Regală', chimney:false});
  townStalls(X+262, Z+296, 5, 9, rnd);
  townStreet(X+240, Z+290, X+274, Z+290, 5, 0x8a8070);
  /* ---- residential rows on the secondary grid (axis-aligned, clipped to the ring by arcFree) ---- */
  var HO={rnd:rnd, wall:[WH,0xd9c8a2,0xe8dcc0,0xc9c2b0], roofCol:[RD,0x70503a,BL], roof:'gable', fac:f, timberFrame:true, floors:2, h:3.6, avoid:arcFree};
  var HS={rnd:rnd, wall:[ST,ST2,0xa8a698], roofCol:[0x4a4238,RD], roof:'gable', fac:f, h:3.4, avoid:arcFree};
  [-360,-240,120,240,360].forEach(function(o,idx){
    var lim=Math.sqrt(440*440-o*o), P=(o<0)?HO:HS;
    houseRow('x', X-lim, X-20, Z+o, -1, P); houseRow('x', X+20, X+lim, Z+o, -1, P);
    houseRow('x', X-lim, X-20, Z+o, 1, P); houseRow('x', X+20, X+lim, Z+o, 1, P);
    houseRow('z', Z-lim, Z-20, X+o, -1, P); houseRow('z', Z+20, Z+lim, X+o, -1, P);
    houseRow('z', Z-lim, Z-20, X+o, 1, P); houseRow('z', Z+20, Z+lim, X+o, 1, P);
  });
  /* ---- block interiors: an alley cross through every block, townhouses along the alleys, a well and gardens
          in the courtyards (instanced prefabs of the capital kit — solid, enterable, furnished like every house) ---- */
  var blocks=0, bi, bj;
  for(bi=-4;bi<4;bi++) for(bj=-4;bj<4;bj++){
    var bx=X+bi*120+60, bz=Z+bj*120+60;
    if(Math.hypot(bx-X,bz-Z)>375) continue;
    if(Math.abs(bx-X)<=60 && Math.abs(bz-Z)<=60) continue;                  /* plaza and esplanade */
    if(Math.abs(bx-X)<130 && bz-Z<-100 && bz-Z>-260) continue;             /* palace precinct */
    if(arcFree(bx-X,bz-Z,50)) continue;
    townStreet(bx-54, bz, bx+54, bz, 4.5, 0x8a8070); townStreet(bx, bz-54, bx, bz+54, 4.5, 0x8a8070);
    var arms=[[1,0],[-1,0],[0,1],[0,-1]], ai, k, n=0;
    for(ai=0;ai<4;ai++){
      var ux=arms[ai][0], uz=arms[ai][1];
      for(k=0;k<3;k++){
        var along=18+k*12;
        [-1,1].forEach(function(sd){
          var hx=bx+ux*along+(uz?sd*9:0), hz=bz+uz*along+(ux?sd*9:0);
          var face=ux?(sd<0?'S':'N'):(sd<0?'E':'W');
          var type=rnd()<0.15?'workshop':rnd()<0.3?'cottage':'house', key='capital.'+type+(type==='workshop'?1:1+Math.floor(rnd()*3));
          var pf=prefabGet(key); if(!pf) return; var rr=Math.hypot(pf.hx,pf.hz)+1.0;
          if(insideSolid(hx,hz,rr)||arcFree(hx-X,hz-Z,rr)||nearDoor(hx,hz,rr+1)) return;
          if(prefabPlace(key,hx,hz,face,{force:true})) n++;
        });
      }
    }
    if(!insideSolid(bx+7,bz+7,1.8)) prefabPlace('prop.well',bx+7,bz+7,'S',{force:true});
    [[-1,-1],[1,1],[-1,1]].forEach(function(q){ var gx=bx+q[0]*30, gz=bz+q[1]*30; if(!insideSolid(gx,gz,4)&&!arcFree(gx-X,gz-Z,4)) townTrees(gx,gz,2,4,rnd,0x4a7a37); });
    if(n) blocks++;
  }
  td.blocks=blocks;
  /* ---- street furniture: lanterns on the boulevards and ring, banners on the plaza ---- */
  for(i=-500;i<=500;i+=40){ if(Math.abs(i)<60) continue; var r0=Math.abs(i); if(r0<440||r0>470){ torchPost(X+i, Z-7, 2.8); torchPost(X+i, Z+7, 2.8); torchPost(X-7, Z+i, 2.8); torchPost(X+7, Z+i, 2.8); } }
  for(i=0;i<24;i++){ var ra=i/24*TAU+0.13, rx=X+Math.cos(ra)*(460+5.5), rz=Z+Math.sin(ra)*(460+5.5); if(!insideSolid(rx,rz,0.5)) torchPost(rx,rz,2.6); }
  for(i=0;i<8;i++){ var ba=i/8*TAU+0.2; bannerOn(PROP_PARENT, X+Math.cos(ba)*40, groundH(X,Z)+6, Z+Math.sin(ba)*40, 'nippon'); }
  /* ---- outside the SE gate: the cathedral quarter and the grand market ---- */
  var CX=X+560, CZ=Z+660;
  buildBuilding({x:CX, z:CZ, w:22, d:30, h:9, wall:WH, roofCol:BL, roof:'church', door:'W', interior:'cathedral', name:'Catedrala Sf. Mihail', fac:f, dome:true, belfry:true, buttress:true,
    lore:{key:'catedrala', icon:'⛪', sub:'The Great Cathedral', story:'The golden dome, an iconostasis of walnut and gold, and the crypt of the first kings beneath the nave. The great bell is rung only for coronations and sieges.'}});
  td.temple={x:CX, z:CZ};
  fortTower({x:CX+16, z:CZ+24, r:4.2, h:24, sides:8, wall:WH, roofCol:BL, roof:'cone', door:-Math.PI/2, name:'Clopotnița Sf. Mihail', slits:false, torches:false, interior:false});
  ANIM_PARTS.push({kind:'bell', x:CX+16, y:groundH(CX+16,CZ+24)+20, z:CZ+24, g:null});
  townPlaza(CX-40, CZ, 22, ST);
  buildBuilding({x:CX-30, z:CZ-40, w:14, d:10, h:5, wall:WH, roofCol:RD, roof:'gable', door:'S', interior:'cells', name:'Casa Parohială', fac:f});
  var MX=X+690, MZ=Z+590;
  townPlaza(MX, MZ, 32, ST); townStalls(MX, MZ, 12, 22, rnd); propWell(MX+10, MZ, BL);
  kit.cyln(M2(ST),1.4,1.8,1.0,8,MX,groundH(MX,MZ)+0.5,MZ); kit.box(M2(0xc9a227),0.5,3.2,0.5,MX,groundH(MX,MZ)+2.6,MZ); kit.box(M2(0xc9a227),1.6,0.3,0.4,MX,groundH(MX,MZ)+3.8,MZ); addCollider(MX-1.9,MZ-1.9,MX+1.9,MZ+1.9);
  buildBuilding({x:MX+50, z:MZ-50, w:16, d:11, h:5, wall:0xd9c8a2, roofCol:RD, roof:'gable', door:'S', interior:'inn', name:'Hanul Târgului', fac:f, floors:2, timberFrame:true, sign:'inn'});
  buildBuilding({x:MX-60, z:MZ-50, w:14, d:10, h:5, wall:0xd9c8a2, roofCol:RD, roof:'gable', door:'S', interior:'tradepost', name:'Casa Negustorilor', fac:f, floors:2, timberFrame:true});
  buildBuilding({x:MX+62, z:MZ+10, w:12, d:9, h:4.5, wall:ST, roofCol:0x4a4238, roof:'gable', door:'W', interior:'checkpoint', name:'Vama Târgului', fac:f});
  houseRow('x', MX-70, MX+70, MZ+48, 1, {rnd:rnd, wall:[0xd9c8a2,WH], roofCol:[RD,0x70503a], roof:'gable', fac:f, timberFrame:true, floors:2, interior:function(n){ return ['butcher','tailor','spice','store','bookseller','store'][n%6]; }});
  for(i=0;i<10;i++){ var cxp=X+380+i*34, czp=Z+380+i*24; if(!insideSolid(cxp+4,czp-4,0.5)) torchPost(cxp+4, czp-4, 2.6); }
  /* ---- the ring of twelve shrines at r580 ---- */
  for(i=0;i<12;i++){ var sa=i*TAU/12+TAU/24, sx2=X+Math.cos(sa)*580, sz2=Z+Math.sin(sa)*580, tries=0;
    while(tries++<6){ var fr=roadField(sx2,sz2); var rf=riverField(sx2,sz2); if((fr.road&&fr.d<fr.road.w/2+3)||(rf.river&&rf.d<riverHalfWidth(rf.river,sz2)+4)||insideSolid(sx2,sz2,1.5)){ sa+=0.09; sx2=X+Math.cos(sa)*580; sz2=Z+Math.sin(sa)*580; } else break; }
    propTroita(sx2, sz2, -sa+Math.PI/2); }
}
function arcFreeCore(x,z){ var r=Math.hypot(x,z); if(r<52) return true; if(Math.abs(x)<60&&z>-250&&z<-30) return true; var f=roadField(x,z); if(f.road&&f.d<f.road.w/2+3) return true; if(insideSolid(x,z,3)) return true; return false; }
function segXw(ax,az,bx,bz,cx,cz,dx,dz){
  var r1x=bx-ax, r1z=bz-az, r2x=dx-cx, r2z=dz-cz, den=r1x*r2z-r1z*r2x; if(Math.abs(den)<1e-9) return null;
  var t=((cx-ax)*r2z-(cz-az)*r2x)/den, u=((cx-ax)*r1z-(cz-az)*r1x)/den; if(t<0||t>1||u<0||u>1) return null;
  return [ax+r1x*t, az+r1z*t];
}

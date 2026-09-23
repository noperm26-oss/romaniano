/* ============================================================
   landmarks.js — every named place of the ULTRA EXPANDED map
   outside the six faction towns: mountain sites, villages,
   the war camp, trade-route posts, battlefields and secrets.
   Each site is one merged geometry group (siteBegin/siteEnd).
   ============================================================ */
function frescoTex(base,accent){
  return canvasTex(256,64,function(g){
    g.fillStyle=base; g.fillRect(0,0,256,64);
    for(var i=0;i<12;i++){ g.fillStyle=i%2?accent:'#e8dcc0'; g.fillRect(6+i*20,10,12,44); g.fillStyle='#c9a227'; g.beginPath(); g.arc(12+i*20,16,4,0,TAU); g.fill(); }
  });
}
function glyphTex(bg,fg,text){
  return canvasTex(128,128,function(g){
    g.fillStyle=bg; g.fillRect(0,0,128,128);
    g.fillStyle=fg; g.font='bold 64px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text||'✠',64,66);
  });
}
var _plainBanners={};
function plainBannerTex(col){
  var key=String(col);
  if(!_plainBanners[key]) _plainBanners[key]=canvasTex(64,96,function(g){ g.fillStyle='#'+('000000'+col.toString(16)).slice(-6); g.fillRect(0,0,64,96); g.fillStyle='#c9a227'; g.fillRect(0,0,64,6); g.beginPath(); g.moveTo(32,28); g.lineTo(44,52); g.lineTo(20,52); g.closePath(); g.fill(); });
  return _plainBanners[key];
}
/* banner on a pole; tex = THREE.Texture | faction key | hex colour */
function bannerOn(g,x,y,z,tex){
  g=g||PROP_PARENT||scene;
  if(typeof tex==='string') tex=(typeof FACS!=='undefined'&&FACS[tex]&&FACS[tex].bannerTex)?FACS[tex].bannerTex:plainBannerTex(0x7a3434);
  else if(typeof tex==='number') tex=plainBannerTex(tex);
  var pole=cyl(0.05,0.07,5.2, NM(0x4a3520), 6); pole.position.set(x,y+2.6,z); g.add(pole);
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4,6,8), new THREE.MeshLambertMaterial({map:tex, side:THREE.DoubleSide}));
  fl.position.set(x+0.85,y+3.9,z); g.add(fl);
  waveBanners.push({m:fl, ph:rand(0,6)});
}
function registerTownLore(f){
  var F=typeof FACS!=='undefined'?FACS[f]:null, T=TOWNS[f], td=townData[f];
  if(!td||!td.hall) return;
  registerLore({key:f+'_hall', x:td.hall.door?td.hall.door.x:td.hall.x, z:td.hall.door?td.hall.door.z:td.hall.z, r:26, icon:f==='nippon'?'👑':f==='vikings'?'🏔️':f==='egypt'?'🐪':'🏯',
    name:(F?F.name:f)+' — '+T.name, sub:T.kind+' — '+T.desc, story:'The seat of '+(F?F.name:f)+'. Musters gather at this door; lose the hall and the nation loses its voice.'});
  if(td.temple) registerLore({key:f+'_temple', x:td.temple.x, z:td.temple.z, r:24, icon:'🕯️', name:'Sanctuary of '+T.name, sub:'Where soldiers pray before the march', story:'Banners are dipped at the threshold and wounds are washed here. Stand inside to recover.'});
  if(td.barracks) registerLore({key:f+'_barracks', x:td.barracks.x, z:td.barracks.z, r:22, icon:'⚔️', name:'Barracks of '+T.name, sub:'Home of the garrison', story:'Recruits cost less within sight of the barracks door.'});
}

/* ---- small shared bits ---- */
function lmRuinWall(kit,x0,z0,x1,z1,h,t,mat){
  var L=Math.hypot(x1-x0,z1-z0), n=Math.max(2,Math.round(L/2.5)), i;
  for(i=0;i<n;i++){ var u=(i+0.5)/n, px=x0+(x1-x0)*u, pz=z0+(z1-z0)*u, hh=h*(0.4+0.6*Math.abs(Math.sin(i*2.3+px*0.1))); kit.box(mat, L/n+0.05, hh, t, px, groundH(px,pz)+hh/2-0.2, pz, -Math.atan2(z1-z0,x1-x0)); }
  colliderAlong(x0,z0,x1,z1,t/2);
}
function lmRock(kit,x,z,s,mat){ var y=groundH(x,z); kit.box(mat, s*1.5, s, s*1.2, x, y+s*0.35, z, x*0.3, 0.3, 0.2); kit.box(mat, s, s*0.7, s*0.9, x+s*0.4, y+s*0.7, z-s*0.3, z*0.2, 0.2, 0.4); if(s>1.4) addCollider(x-s*0.7,z-s*0.6,x+s*0.7,z+s*0.6); }
function lmGraveField(kit,x,z,r,n,rnd){ for(var i=0;i<n;i++){ var gx=x+(rnd()*2-1)*r, gz=z+(rnd()*2-1)*r; if(insideSolid(gx,gz,1.2)) continue; propGrave(gx,gz,rnd()*0.4-0.2,rnd()<0.3); } }
function lmSmokeRuin(kit,x,z,w,d,ry,rnd){
  var y=groundH(x,z), B=M2(0x3a3028), C=M2(0x241d16), i;
  var c=Math.cos(ry), s=Math.sin(ry);
  kit.box(M2(0x5a4a3a), w+0.4, 0.3, d+0.4, x, y+0.1, z, ry);
  for(i=0;i<4;i++){ var a=i*Math.PI/2+ry, len=i%2?d:w, hh=(0.6+rnd()*1.8); var px=x+Math.cos(a+Math.PI/2)*(i%2?w/2:d/2)*(i<2?1:-1), pz=z-Math.sin(a+Math.PI/2)*(i%2?w/2:d/2)*(i<2?1:-1); kit.box(rnd()<0.5?B:C, len*(0.5+rnd()*0.5), hh, 0.34, px, y+hh/2, pz, -a); }
  kit.box(C, 0.3, 2.6+rnd()*1.5, 0.3, x-w*0.35*c, y+1.6, z+w*0.35*s, ry, 0, 0.2);
  kit.box(C, 0.3, 1.6, 0.3, x+w*0.3*c, y+0.8, z-w*0.3*s, ry, 0.3, 0);
  kit.box(M2(0x8f8a80), 0.9, 2.4, 0.9, x+w*0.28, y+1.2, z-d*0.28);
  addCollider(x-Math.abs(w/2*c)-Math.abs(d/2*s), z-Math.abs(w/2*s)-Math.abs(d/2*c), x+Math.abs(w/2*c)+Math.abs(d/2*s), z+Math.abs(w/2*s)+Math.abs(d/2*c));
  regChimney(x+w*0.28, y+2.6, z-d*0.28, 0.5);
  BUILD_COUNT++;
}
function lmSiegeEngine(kit,x,z,ry,kind){
  var y=groundH(x,z), T=M2(0x5d4326), I=M2(0x50565e), R=M2(0x777772);
  if(kind==='catapult'){
    kit.box(T,3.2,0.4,1.6,x,y+0.4,z,ry); kit.box(T,0.3,2.4,0.3,x-0.6,y+1.6,z-0.6,ry,0,0.2); kit.box(T,0.3,2.4,0.3,x-0.6,y+1.6,z+0.6,ry,0,0.2);
    kit.box(T,0.24,0.24,3.6,x,y+1.6,z,ry,0.9,0); kit.cyln(R,0.35,0.35,0.3,8,x+0.6,y+2.9,z,ry); kit.box(T,0.3,0.3,1.8,x+0.2,y+2.0,z,ry,0.9,0);
    for(var i=0;i<4;i++) kit.cyln(T,0.5,0.5,0.2,10,x+(i%2?1.2:-1.2),y+0.5,z+(i<2?0.9:-0.9),0,Math.PI/2,0);
    addCollider(x-1.8,z-1.2,x+1.8,z+1.2);
  } else if(kind==='ram'){
    kit.box(T,5,0.3,2.2,x,y+0.3,z,ry); for(var j=-1;j<=1;j+=2){ kit.box(T,0.24,2.4,0.24,x-2,y+1.4,z+j*1.0,ry); kit.box(T,0.24,2.4,0.24,x+2,y+1.4,z+j*1.0,ry); }
    kit.prism(M2(0x6e5a44),2.6,1.2,5.4,x,y+3.2,z,ry+Math.PI/2); kit.cyln(T,0.28,0.28,4.6,8,x,y+1.6,z,ry,0,Math.PI/2); kit.cyln(I,0.34,0.28,0.5,8,x+2.5,y+1.6,z,ry,0,Math.PI/2);
    addCollider(x-2.7,z-1.3,x+2.7,z+1.3);
  } else {
    kit.box(T,2.4,7,2.4,x,y+3.5,z,ry); kit.box(M2(0x6e5a44),2.6,7,0.2,x,y+3.5,z+1.3,ry); for(var k=0;k<4;k++) kit.box(T,2.6,0.2,2.6,x,y+1.6+k*1.7,z,ry);
    addCollider(x-1.3,z-1.3,x+1.3,z+1.3);
  }
  BUILD_COUNT++;
}
function lmLoreAt(s,icon,sub,story,r){ registerLore({key:s.key, x:s.x, z:s.z, r:r||s.r, icon:icon, name:s.name, sub:sub, story:story}); }

/* ============================================================ site builders ============================================================ */
var SITE_BUILDERS={};
/* 1. Turnul Vântului — watchtower on a peak */
SITE_BUILDERS.watchtower=function(s,rnd){
  var kit=cellKit(s.x,s.z);
  fortTower({x:s.x, z:s.z, r:4.2, h:18, sides:8, wall:0x8a9aa8, roofCol:0x3a4048, roof:'flat', door:Math.PI/2, brazier:true, banner:'vikings', name:s.name});
  buildBuilding({x:s.x-14, z:s.z+4, w:8, d:6, h:3.4, wall:0x8f8a80, roofCol:0x3a4048, roof:'gable', door:'E', interior:'watchtower', name:'Adăpostul Străjerilor', windows:true});
  for(var i=0;i<7;i++) lmRock(kit, s.x+Math.cos(i*0.9)*(16+i*2), s.z+Math.sin(i*0.9)*(14+i), 1.2+rnd()*1.6, M2(0x8a8a86));
  propCampfire(s.x+8, s.z+6, false); propStakes(s.x+6, s.z-8, 0.4, 6);
  lmLoreAt(s,'🗼','Watchtower of the winds','From this peak the beacon answers Stânca de Fier and the monastery. Climb the stair: the whole northern ridge lies below, and the pass where the ambush waits.');
};
/* 2. Peștera Pustnicului — the hermit's cave */
SITE_BUILDERS.cave=function(s,rnd){
  var kit=cellKit(s.x,s.z), R=M2(0x6f6a62), R2=M2(0x5a554e), i;
  buildBuilding({x:s.x, z:s.z, w:12, d:14, h:4.6, wall:0x6f6a62, roofCol:0x5a554e, roof:'flat', door:'S', interior:'cave', name:s.name, windows:false, porch:false, chimney:false, studs:false, plinth:false, lamp:false, doorW:2.4});
  /* the hill that swallows the shell */
  for(i=0;i<12;i++){ var a=i/12*TAU, rr=7+rnd()*3; kit.box(R, 5+rnd()*3, 3+rnd()*4, 5+rnd()*3, s.x+Math.cos(a)*rr, groundH(s.x,s.z)+2+rnd(), s.z+Math.sin(a)*rr*0.9-1.5, a, rnd()*0.4, rnd()*0.4); }
  kit.box(R2, 16, 4, 14, s.x, groundH(s.x,s.z)+6.2, s.z-1, 0.1, 0.05, 0.08); kit.box(R, 10, 3, 9, s.x-2, groundH(s.x,s.z)+8.5, s.z-2, 0.5, 0.1, 0.2);
  for(i=0;i<5;i++) lmRock(kit, s.x-14+i*7, s.z+12+rnd()*4, 1+rnd()*1.2, R);
  propCampfire(s.x+3, s.z+11, false); propTroita(s.x-4, s.z+12, 0.3);
  lmLoreAt(s,'🕯','The hermit\'s cave','A monk left Sf. Andrei forty years ago and never came down. His cave has an altar, a spring and a bed of straw. Pilgrims leave bread at the mouth.');
};
/* 3. Mănăstirea Sf. Andrei — monastery complex */
SITE_BUILDERS.monastery=function(s,rnd){
  var X=s.x, Z=s.z, W=0xe2d6bb, RF=0x3a4048;
  fortWallRun([[X-70,Z-60],[X+70,Z-60],[X+70,Z+60],[X-70,Z+60]], {h:4.5, t:1.0, wall:0x9a9a8a, merlons:false, walk:false}, [{x:X,z:Z+60,w:8}], true);
  fortGate({x:X, z:Z+60, dir:'S', w:5, h:5, tw:3.2, ph:3.6, wall:0x9a9a8a, roofCol:RF, portcullis:false, leaves:false, name:'Poarta Mănăstirii'});
  townStreet(X, Z+90, X, Z+20, 6, 0x9a9a8a); townPlaza(X, Z, 20, 0x9a9a8a);
  buildBuilding({x:X, z:Z-22, w:14, d:30, h:9, wall:W, roofCol:RF, roof:'church', door:'S', interior:'church', name:'Biserica Sf. Andrei', belfry:true, dome:true,
    lore:{key:'sf_andrei_biserica', icon:'⛪', sub:'Monastery church', story:'Painted inside and out. The monks say the blue of the frescoes was ground from a stone that no longer exists.'}});
  fortTower({x:X-24, z:Z-46, r:3.6, h:20, sides:8, wall:W, roofCol:RF, roof:'cone', door:Math.PI/2, name:'Clopotnița', slits:false, torches:false});
  ANIM_PARTS.push({kind:'bell', x:X-24, y:groundH(X-24,Z-46)+17, z:Z-46});
  buildBuilding({x:X-50, z:Z, w:12, d:36, h:4.2, wall:W, roofCol:RF, roof:'gable', door:'E', interior:'cells', name:'Chiliile', lore:{key:'chilii', icon:'🛏', sub:'The monks\' cells', story:'Twelve cells, each with a bed, a candle and an icon. Silence after vespers.'}});
  buildBuilding({x:X+50, z:Z-10, w:12, d:22, h:6, wall:W, roofCol:RF, roof:'gable', door:'W', interior:'library', name:'Biblioteca', floors:2, lore:{key:'biblioteca_andrei', icon:'📚', sub:'Monastery library', story:'Chronicles copied by hand since the first voivodes. The librarian knows every siege by the ink it was written in.'}});
  buildBuilding({x:X+50, z:Z+30, w:12, d:14, h:4, wall:W, roofCol:RF, roof:'gable', door:'W', interior:'candles', name:'Atelierul de Lumânări', chimney:true, lore:{key:'lumanari', icon:'🕯', sub:'Candle workshop', story:'Beeswax from the monastery hives. Every candle in the capital\'s cathedral was dipped here.'}});
  buildBuilding({x:X-30, z:Z+40, w:20, d:10, h:4.2, wall:W, roofCol:RF, roof:'gable', door:'N', interior:'refectory', name:'Trapeza', chimney:true});
  buildBuilding({x:X+22, z:Z+42, w:10, d:8, h:3.6, wall:0x9a9a8a, roofCol:RF, roof:'gable', door:'N', interior:'store', name:'Cămara'});
  propWell(X, Z, RF); townTrees(X, Z, 6, 14, rnd, 0x3d5a3c);
  var kit=cellKit(s.x,s.z), i; for(i=0;i<4;i++){ var bx=X-60+i*4, bz=Z-50; kit.box(M2(0xc9a065),1.2,1.0,1.2,bx,groundH(bx,bz)+0.5,bz); kit.pyr(M2(0x5d4a38),1.0,0.6,4,bx,groundH(bx,bz)+1.3,bz,Math.PI/4); addCollider(bx-0.6,bz-0.6,bx+0.6,bz+0.6); }
  for(i=0;i<5;i++) propGrave(X+30+i*2.2, Z-50, 0, i%2===0);
  lmLoreAt(s,'⛪','Monastery of St Andrew','Bell tower, cells, library and the candle workshop behind a low wall. The monks feed travellers and bury soldiers of every banner.');
};
/* 4. Frostwind Pass — mountain outpost */
SITE_BUILDERS.outpost=function(s,rnd){
  var X=s.x, Z=s.z, W=0x8a9aa8, RF=0x3a4048;
  palisade(ringPts(X,Z,60,28,0.8), {h:5, gaps:[{x:X,z:Z-48,w:10},{x:X,z:Z+48,w:10}], col:0x4a3a2a, walk:true});
  fortTower({x:X-40, z:Z-30, r:3.6, h:12, sides:6, wall:W, roofCol:RF, roof:'timber', door:0, brazier:true, name:'Turnul Trecătorii'});
  fortTower({x:X+40, z:Z+30, r:3.6, h:12, sides:6, wall:W, roofCol:RF, roof:'timber', door:Math.PI, brazier:true, name:'Turnul Gheții'});
  townStreet(X, Z-80, X, Z+80, 7, 0x7a7a82);
  buildBuilding({x:X-24, z:Z, w:18, d:9, h:4.2, wall:0x5d4326, roofCol:RF, roof:'gable', door:'E', interior:'barracks', name:'Cazarma Trecătorii', style:'log'});
  buildBuilding({x:X+24, z:Z, w:14, d:9, h:4, wall:0x5d4326, roofCol:RF, roof:'gable', door:'W', interior:'store', name:'Magazia de Iarnă', style:'log'});
  buildBuilding({x:X+22, z:Z-28, w:8, d:7, h:3.4, wall:0x5d4326, roofCol:RF, roof:'gable', door:'W', interior:'guardhouse', name:'Corpul de Gardă', style:'log'});
  buildBuilding({x:X-22, z:Z+28, w:8, d:7, h:3.4, wall:0x5d4326, roofCol:RF, roof:'gable', door:'E', interior:'forge', name:'Fierăria Pasului', style:'log'});
  propCampfire(X, Z+12, true); propStakes(X-8, Z-52, 0, 6); propStakes(X+8, Z-52, 0.2, 6);
  for(var i=0;i<4;i++) propBarrel(X+6+i*1.2, Z-10, i%2===0);
  var kit=cellKit(s.x,s.z); for(i=0;i<8;i++) lmRock(kit, X+Math.cos(i*0.8)*(75+rnd()*10), Z+Math.sin(i*0.8)*(60+rnd()*10), 1.5+rnd()*2, M2(0x8a8a86));
  lmLoreAt(s,'🏔','Outpost of the frozen pass','The only road over the northern ridge. Two towers, a palisade and a garrison that counts the snow. Whoever holds the pass holds the way to the Moldavian border.');
};
/* 5. Valea Lupilor — Transylvanian valley village */
SITE_BUILDERS.village=function(s,rnd){
  var X=s.x, Z=s.z, WH=[0xe2d6bb,0xd9c8a2], RF=[0x70503a,0x5d4a38];
  townStreet(X-90, Z, X+90, Z, 7, 0x9a8555); townStreet(X, Z-70, X, Z+70, 5, 0x9a8555); townPlaza(X, Z, 16, 0x9a8555);
  buildBuilding({x:X, z:Z-36, w:10, d:18, h:6, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'S', interior:'church', name:'Biserica Valea Lupilor', belfry:true});
  buildBuilding({x:X+60, z:Z-24, w:10, d:8, h:4, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'gable', door:'S', interior:'watermill', name:'Moara de Apă', wheelSide:'R', lore:{key:'moara', icon:'⚙', sub:'The watermill', story:'The wheel turns day and night on the valley stream. Flour for the whole heartland — and the miller hears every rumour first.'}});
  buildBuilding({x:X-56, z:Z+30, w:8, d:7, h:3.4, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'N', interior:'hunter', name:'Cabana Vânătorului', style:'log'});
  buildBuilding({x:X+40, z:Z+34, w:10, d:8, h:3.6, wall:0x8f8a80, roofCol:0x5d4a38, roof:'gable', door:'N', interior:'bathhouse', name:'Baia Satului', chimney:true});
  buildBuilding({x:X-30, z:Z-34, w:12, d:8, h:3.8, wall:0xd9c8a2, roofCol:0x70503a, roof:'gable', door:'S', interior:'tavern', name:'Crâșma Lupilor', timberFrame:true});
  var HO={rnd:rnd, wall:WH, roofCol:RF, roof:['gable','thatch'], style:'log', h:3.3, interior:'loghouse'};
  houseRow('x', X-85, X-20, Z, 1, HO); houseRow('x', X+14, X+80, Z, 1, HO); houseRow('x', X-85, X-40, Z, -1, HO); houseRow('x', X+14, X+50, Z, -1, HO);
  houseRow('z', Z+14, Z+60, X, -1, HO); houseRow('z', Z+14, Z+60, X, 1, HO);
  propWell(X, Z, 0x70503a); propFence(X-80, Z+50, X-40, Z+50, 1.0); propFence(X-80, Z+50, X-80, Z+70, 1.0);
  var kit=cellKit(s.x,s.z), i; for(i=0;i<3;i++){ var px=X-70+i*8, pz=Z+60; kit.box(M2(0x8a6a3c),3,0.9,2,px,groundH(px,pz)+0.45,pz); kit.pyr(M2(0x968047),2.2,1.2,4,px,groundH(px,pz)+1.5,pz,Math.PI/4); addCollider(px-1.5,pz-1,px+1.5,pz+1); }
  for(i=0;i<8;i++){ var hx=X+55+(i%4)*3.5, hz=Z+58+Math.floor(i/4)*3.5; kit.cyln(M2(0xc9b24a),1.2,1.4,1.6,8,hx,groundH(hx,hz)+0.8,hz); kit.pyr(M2(0xb5a487),1.3,0.8,8,hx,groundH(hx,hz)+2.0,hz); addCollider(hx-1.2,hz-1.2,hx+1.2,hz+1.2); }
  for(i=0;i<4;i++) torchPost(X+Math.cos(i*Math.PI/2+0.7)*20, Z+Math.sin(i*Math.PI/2+0.7)*20, 2.4);
  lmLoreAt(s,'🐺','Valley of the wolves','Log houses, a wooden church, the watermill on the stream, a hunter\'s cabin and the bathhouse. Wolves come down to the fences in winter.');
};
/* 6. Tabăra de Război — Wallachian war camp */
SITE_BUILDERS.warcamp=function(s,rnd){
  var X=s.x, Z=s.z, i;
  palisade(ringPts(X,Z,110,36), {h:4.2, gaps:[{x:X+110,z:Z,w:14},{x:X-110,z:Z,w:10}], col:0x6b4f2e});
  for(i=0;i<8;i++){ var a=i/8*TAU+0.4; propStakes(X+Math.cos(a)*120, Z+Math.sin(a)*120, -a, 6); }
  townStreet(X-130, Z, X+130, Z, 8, 0x7a6a4a); townStreet(X, Z-90, X, Z+90, 6, 0x7a6a4a);
  pavilion({x:X, z:Z-30, r:7, h:3.2, col:0x7a3434, stripe:0xd9c8a2, door:Math.PI/2, interior:'command', name:'Cortul Comandantului'});
  registerLore({key:'cort_comandant', x:X, z:Z-22, r:14, icon:'⚔', name:'Cortul Comandantului', sub:'Command tent', story:'Maps of the Danube fords weighted with daggers. The commander sleeps in armour.'});
  for(i=0;i<10;i++){ var tx=X-60+(i%5)*24, tz=Z+30+Math.floor(i/5)*22; fortTent({x:tx, z:tz, w:5.5, d:7, ry:Math.PI, col:i%3?0xd9c8a2:0xc9b890, interior:i%4===0?'store':'cots', name:'Cort '+(i+1)}); }
  for(i=0;i<4;i++){ fortTent({x:X-70+i*20, z:Z-40, w:5, d:6, ry:0, col:0xb5a487, interior:'cots'}); }
  fortTent({x:X+70, z:Z-40, w:7, d:9, ry:0, col:0xa88a3a, trim:0x241d16, interior:'forge', name:'Cortul Vraciului de Cai'});
  buildBuilding({x:X+70, z:Z+40, w:16, d:12, h:5, wall:0x7a5c39, roofCol:0x5d4a38, roof:'gable', door:'N', interior:'siege', name:'Atelierul de Asediu', style:'log', lore:{key:'atelier_asediu', icon:'🛠', sub:'Siege workshop', story:'Catapult arms, ram heads and ladder rungs. The carpenters work faster than the enemy can repair walls.'}});
  buildBuilding({x:X-70, z:Z+40, w:20, d:10, h:4.5, wall:0x7a5c39, roofCol:0x5d4a38, roof:'long', door:'N', interior:'refectory', name:'Sala de Mese', style:'log'});
  fortTower({x:X+30, z:Z-72, r:3.6, h:12, sides:6, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'open', door:Math.PI/2, brazier:true, banner:'rome', name:'Turnul Tobelor'});
  ANIM_PARTS.push({kind:'drum', x:X+30, y:groundH(X+30,Z-72)+12.6, z:Z-72});
  lmSiegeEngine(cellKit(X,Z), X+40, Z+70, 0.3, 'catapult'); lmSiegeEngine(cellKit(X,Z), X+56, Z+74, 0.1, 'catapult'); lmSiegeEngine(cellKit(X,Z), X-40, Z+74, 0, 'ram'); lmSiegeEngine(cellKit(X,Z), X-60, Z+76, 0, 'tower');
  /* training ground and archery range */
  var kit=cellKit(s.x,s.z);
  for(i=0;i<6;i++){ var px=X-30+i*6, pz=Z-12; kit.cyln(M2(0x5d4326),0.2,0.25,2.2,7,px,groundH(px,pz)+1.1,pz); kit.box(M2(0xb5a487),0.9,0.5,0.5,px,groundH(px,pz)+1.6,pz); addCollider(px-0.3,pz-0.3,px+0.3,pz+0.3); }
  for(i=0;i<5;i++){ var bx=X-90, bz=Z-70+i*8; kit.cyln(M2(0xc9b24a),0.9,0.9,0.5,10,bx,groundH(bx,bz)+1.2,bz,0,0,Math.PI/2); kit.cyln(M2(0x7a3434),0.3,0.3,0.52,10,bx,groundH(bx,bz)+1.2,bz,0,0,Math.PI/2); addCollider(bx-0.4,bz-0.9,bx+0.4,bz+0.9); }
  propFence(X-96, Z-76, X-96, Z-30, 1.0);
  propCampfire(X-20, Z+10, true); propCampfire(X+20, Z+10, true); propCampfire(X, Z+64, false);
  for(i=0;i<6;i++){ var ca=i/6*TAU; torchPost(X+Math.cos(ca)*100, Z+Math.sin(ca)*100, 2.6); }
  bannerOn(PROP_PARENT, X+8, groundH(X+8,Z+4)+5, Z+4, 'rome'); bannerOn(PROP_PARENT, X-8, groundH(X-8,Z+4)+5, Z+4, 'rome');
  for(i=0;i<8;i++) propBarrel(X+50+(i%4)*1.4, Z+20+Math.floor(i/4)*1.4, i%3===0);
  propCart(X-50, Z+18, 0.2, false); propCart(X-58, Z+24, -0.3, false);
  lmLoreAt(s,'⛺','Wallachian war camp','Tents in rows, a training ground, the archery range, the siege workshop and the drum tower. The whole southern army musters here before the fords.');
};
/* 7. Codrul Vechi — Moldavian forest village */
SITE_BUILDERS.forestvillage=function(s,rnd){
  var X=s.x, Z=s.z, i;
  townStreet(X-80, Z, X+80, Z, 5, 0x5a4a3a); townStreet(X, Z-70, X, Z+70, 5, 0x5a4a3a);
  buildBuilding({x:X-36, z:Z-30, w:14, d:10, h:4.5, wall:0x5d4326, roofCol:0x4a3a2a, roof:'long', door:'S', interior:'lodge', name:'Casa Vânătorilor', style:'log', lore:{key:'lodge', icon:'🏹', sub:'Hunter lodge', story:'Bear skins on the floor, antlers over the hearth. The hunters of the old forest never miss and never boast.'}});
  buildBuilding({x:X+36, z:Z-28, w:8, d:7, h:3.4, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'S', interior:'herbalist', name:'Coliba Vraciului', style:'log', lore:{key:'vraci', icon:'🌿', sub:'The herbalist', story:'Dried herbs from the ceiling, jars on every shelf. She sets bones and reads fevers; soldiers walk two days to reach her door.'}});
  buildBuilding({x:X-40, z:Z+30, w:9, d:7, h:3.4, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'N', interior:'woodcutter', name:'Cabana Tăietorului', style:'log'});
  for(i=0;i<3;i++) buildBuilding({x:X+20+i*14, z:Z+30, w:5, d:5, h:3.6, wall:0x3a2a1a, roofCol:0x241d16, roof:'gable', door:'N', interior:'smokehouse', name:'Afumătoarea '+(i+1), windows:false, porch:false, chimney:true});
  buildBuilding({x:X+62, z:Z+6, w:9, d:7, h:2.8, wall:0x6e5f43, roofCol:0x3a5a2e, roof:'thatch', door:'W', interior:'cellar', name:'Pivnița de Ciuperci', windows:false, lore:{key:'pivnita', icon:'🍄', sub:'Mushroom cellar', story:'Cool, dark, and full of baskets. The forest gives more than meat.'}});
  var HO={rnd:rnd, wall:[0x5d4326,0x4a3a2a], roofCol:[0x4a3a2a,0x3a2a1a], roof:'gable', style:'log', h:3.2, interior:'loghouse', w:[5.5,7], d:[4.5,6]};
  houseRow('x', X-75, X-14, Z, 1, HO); houseRow('x', X+14, X+70, Z, -1, HO); houseRow('z', Z-60, Z-40, X, 1, HO); houseRow('z', Z+40, Z+65, X, -1, HO);
  /* wolf shrine: standing stones in a ring around a carved post, at the forest edge north of the village */
  var kit=cellKit(s.x,s.z), sx=X, sz=Z-84, sy=groundH(sx,sz);
  kit.cyln(M2(0x7a7a6a), 5, 5.4, 0.3, 12, sx, sy+0.15, sz);
  for(i=0;i<7;i++){ var a=i/7*TAU; kit.box(M2(0x7a7a6a),0.8,2.2+((i*3)%3)*0.4,0.6,sx+Math.cos(a)*4,sy+1.1,sz+Math.sin(a)*4,-a,0.1*(i%2?1:-1),0); addCollider(sx+Math.cos(a)*4-0.5,sz+Math.sin(a)*4-0.5,sx+Math.cos(a)*4+0.5,sz+Math.sin(a)*4+0.5); }
  kit.cyln(M2(0x5d4326),0.35,0.45,3.4,7,sx,sy+1.7,sz); kit.box(M2(0x5d4326),1.2,0.6,0.7,sx,sy+3.6,sz); kit.box(M2(0x241d16),0.25,0.25,0.5,sx-0.35,sy+3.8,sz+0.5); kit.box(M2(0x241d16),0.25,0.25,0.5,sx+0.35,sy+3.8,sz+0.5);
  addCollider(sx-0.5,sz-0.5,sx+0.5,sz+0.5);
  for(i=0;i<5;i++) fCandle(kit,sx-1+i*0.5,sy+0.3,sz+1.2,i%2===0);
  fFlame(kit,sx,sy+0.6,sz+2.2,0.8,0.8,0xff9a3c,12);
  registerLore({key:'altar_lup', x:sx, z:sz, r:12, icon:'🐺', name:'Altarul Lupului', sub:'Wolf shrine', story:'Seven stones and a carved post with two ears. Hunters leave the first cut of every kill. Nobody has seen a wolf take it; nobody has seen it left in the morning.'});
  for(i=0;i<6;i++) torchPost(X+Math.cos(i)*22, Z+Math.sin(i)*22, 2.4);
  lmLoreAt(s,'🌲','Village of the old forest','Smokehouses, the hunter lodge, the herbalist, the woodcutter and the mushroom cellar under the black pines. The wolf shrine stands at the forest edge.');
};
/* 8. Oaza Drumului — trade post */
SITE_BUILDERS.tradepost=function(s,rnd){
  /* U-TD-02 Punct Comerț: a bazaar on both sides of the Via Romaria (the highway ribbon runs through x=X) */
  var X=s.x, Z=s.z, AD=0xc2b08a, RF=0x9a6a3a, i;
  townPlaza(X-26, Z, 16, AD); townPlaza(X+26, Z, 16, AD);
  buildBuilding({x:X+42, z:Z-36, w:22, d:12, h:5, wall:0xd9c8a2, roofCol:RF, roof:'flat', door:'W', interior:'tradepost', name:'Casa Negustorilor', arcade:true, lore:{key:'casa_negustori', icon:'⚖', sub:'Trade post on the Via Romaria', story:'Salt from the north, wine from the terraces, iron from Ardealburg — weighed here on the crown\'s scales before it goes south.'}});
  buildBuilding({x:X-44, z:Z-30, w:16, d:10, h:4.5, wall:AD, roofCol:RF, roof:'long', door:'E', interior:'stable', name:'Grajdurile Punctului'});
  buildBuilding({x:X+44, z:Z+10, w:12, d:9, h:4, wall:AD, roofCol:RF, roof:'gable', door:'W', interior:'guardhouse', name:'Postul de Pază'});
  buildBuilding({x:X-44, z:Z+12, w:12, d:9, h:4, wall:AD, roofCol:RF, roof:'flat', door:'E', interior:'inn', name:'Hanul Punctului'});
  buildBuilding({x:X+34, z:Z+44, w:10, d:8, h:3.8, wall:AD, roofCol:RF, roof:'flat', door:'N', interior:'workshop', name:'Atelierul Caravanelor'});
  buildBuilding({x:X-34, z:Z+44, w:10, d:8, h:3.8, wall:AD, roofCol:RF, roof:'flat', door:'N', interior:'customs', name:'Vama Punctului'});
  townStalls(X-26, Z, 6, 10, rnd); townStalls(X+26, Z, 6, 10, rnd); propWell(X-26, Z, RF); propWell(X+26, Z, RF);
  townTrees(X, Z, 10, 46, rnd, 0x7a8a5a);
  for(i=0;i<4;i++) propCart(X+(i%2?1:-1)*(14+i*4), Z+24, rnd()*0.4, i===2);
  for(i=0;i<5;i++){ torchPost(X-8, Z-40+i*20, 2.6); torchPost(X+8, Z-40+i*20, 2.6); }
  propTroita(X+52, Z-30, 0);
  lmLoreAt(s,'⚖','Punct Comerț','A bazaar on both sides of the imperial road: stalls, two wells, an inn and the crown\'s customs house.');
};
/* 9. Poarta Sud — checkpoint */
SITE_BUILDERS.checkpoint=function(s,rnd){
  var X=s.x, Z=s.z, i;
  fortWall({x0:X-60, z0:Z-30, x1:X-14, z1:Z-30, h:5, t:1.2, wall:0x9a8a6a, merlons:true}); fortWall({x0:X+14, z0:Z-30, x1:X+60, z1:Z-30, h:5, t:1.2, wall:0x9a8a6a, merlons:true});
  fortWall({x0:X-60, z0:Z+30, x1:X-14, z1:Z+30, h:5, t:1.2, wall:0x9a8a6a, merlons:true}); fortWall({x0:X+14, z0:Z+30, x1:X+60, z1:Z+30, h:5, t:1.2, wall:0x9a8a6a, merlons:true});
  fortGate({x:X, z:Z-30, dir:'N', w:12, h:6, tw:4, ph:4.6, wall:0x9a8a6a, roofCol:0x7a5a3a, banner:'egypt', name:'Poarta Sud — intrare', portcullis:false});
  fortGate({x:X, z:Z+30, dir:'S', w:12, h:6, tw:4, ph:4.6, wall:0x9a8a6a, roofCol:0x7a5a3a, banner:'egypt', name:'Poarta Sud — ieșire', portcullis:false});
  fortTower({x:X-60, z:Z-30, r:3.6, h:11, sides:8, wall:0x9a8a6a, roofCol:0x7a5a3a, roof:'timber', door:Math.PI/2, name:'Turnul Vămii de Vest'});
  fortTower({x:X+60, z:Z+30, r:3.6, h:11, sides:8, wall:0x9a8a6a, roofCol:0x7a5a3a, roof:'timber', door:-Math.PI/2, name:'Turnul Vămii de Est'});
  buildBuilding({x:X-34, z:Z, w:14, d:10, h:4.5, wall:0xc2b08a, roofCol:0x7a5a3a, roof:'gable', door:'E', interior:'checkpoint', name:'Vama', lore:{key:'vama', icon:'📜', sub:'Customs house', story:'Every cart is counted, every seal checked. The ledger of Poarta Sud is worth more to a spy than a chest of gold.'}});
  buildBuilding({x:X+34, z:Z, w:16, d:10, h:4.5, wall:0xc2b08a, roofCol:0x7a5a3a, roof:'gable', door:'W', interior:'barracks', name:'Cazarma Vameșilor'});
  buildBuilding({x:X+40, z:Z-50, w:12, d:9, h:4, wall:0xc2b08a, roofCol:0x7a5a3a, roof:'long', door:'S', interior:'stable', name:'Grajdurile Vămii'});
  for(i=0;i<3;i++) propCart(X-10+i*8, Z+8, 0.1*i, false);
  propFence(X-14, Z-8, X-14, Z+8, 1.1);
  for(i=0;i<4;i++) propBarrel(X+8+i*1.2, Z-10, i%2===0);
  propBrazier(X-6, Z-20, true); propBrazier(X+6, Z+20, true);
  lmLoreAt(s,'🛃','Southern gate checkpoint','Two gates, two towers, the customs house and the toll ledger. No caravan reaches the inn without a stamp from Poarta Sud.');
};
/* 10. Câmpia Sângelui — the plains of graves */
SITE_BUILDERS.graves=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  lmGraveField(kit, X, Z, 110, 120, rnd);
  kit.box(M2(0x7a7a6a), 3.2, 5.5, 1.6, X, groundH(X,Z)+2.7, Z); kit.box(M2(0x241d16), 2.2, 3.2, 0.2, X, groundH(X,Z)+3.0, Z+0.9); addCollider(X-1.6,Z-0.8,X+1.6,Z+0.8);
  for(i=0;i<12;i++){ var a=i/12*TAU; var px=X+Math.cos(a)*60, pz=Z+Math.sin(a)*60; kit.box(M2(0x5d4326),0.14,3.6,0.14,px,groundH(px,pz)+1.8,pz); kit.box(M2(i%2?0x7a3434:0x3f5f8a),1.0,1.5,0.05,px+0.5,groundH(px,pz)+3.0,pz); }
  for(i=0;i<20;i++){ var rx=X+(rnd()*2-1)*120, rz=Z+(rnd()*2-1)*120; kit.box(M2(0x50565e),0.05,1.4,0.05,rx,groundH(rx,rz)+0.6,rz,rnd()*3,0.4,0.3); kit.box(M2(0x7a5c39),0.9,0.9,0.1,rx+1,groundH(rx,rz)+0.2,rz,rnd()*3,1.2,0); }
  for(i=0;i<3;i++) lmSmokeRuin(kit, X-80+i*80, Z-90, 6, 5, rnd()*0.6, rnd);
  propTroita(X, Z+8, 0); propCampfire(X+20, Z+20, false);
  lmLoreAt(s,'⚰','The plains of blood','Three armies met here and none left whole. Crosses in rows, arrows still in the ground, banners of every colour faded to the same grey.');
};
/* 11. river crossings */
SITE_BUILDERS.crossing=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  for(i=0;i<8;i++){ var a=rnd()*TAU, r=20+rnd()*40; propStakes(X+Math.cos(a)*r, Z+Math.sin(a)*r, a, 5); }
  lmGraveField(kit, X+40, Z+30, 25, 14, rnd);
  fortTower({x:X-40, z:Z-30, r:3.2, h:9, sides:6, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'timber', door:0, brazier:true, name:'Turnul Vadului'});
  propCart(X+30, Z-20, 0.5, true); propCampfire(X-30, Z+10, false);
  for(i=0;i<3;i++) lmRock(kit, X+10+i*7, Z+50, 1.2+rnd(), M2(0x777772));
  lmLoreAt(s,'🌊','The old ford','A shallow crossing guarded by a single tower. Stakes still stand in the water where the last charge was broken.');
};
/* 12. siege lines */
SITE_BUILDERS.siege=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  var toward=(s.key==='asediu_dunarii')?1:-1; /* the fortress lies to +z or -z */
  for(i=0;i<9;i++){ var px=X-80+i*20, pz=Z+toward*40; kit.box(M2(0x6e5f43),18,1.6,4,px,groundH(px,pz)+0.6,pz); kit.box(M2(0x5d4326),18,0.3,0.3,px,groundH(px,pz)+1.6,pz+toward*2); addCollider(px-9,pz-2,px+9,pz+2); propStakes(px, pz+toward*4, 0, 8); }
  lmSiegeEngine(kit, X-40, Z, 0, 'catapult'); lmSiegeEngine(kit, X, Z, 0, 'catapult'); lmSiegeEngine(kit, X+40, Z, 0, 'tower'); lmSiegeEngine(kit, X+20, Z-toward*20, 0, 'ram');
  for(i=0;i<6;i++) fortTent({x:X-60+i*24, z:Z-toward*40, w:5, d:6, ry:toward>0?Math.PI:0, col:0xb5a487, interior:i%2?'cots':'store'});
  propCampfire(X-30, Z-toward*20, true); propCampfire(X+30, Z-toward*20, true);
  for(i=0;i<8;i++) propBarrel(X+50+(i%4)*1.3, Z-toward*22+Math.floor(i/4)*1.3, i%2===0);
  lmLoreAt(s,'🏹','Siege lines','Earthworks, catapults and a ram under its roof. The besiegers dug in for a winter and left the ditch to the crows.');
};
/* 13. ambush passes */
SITE_BUILDERS.ambush=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  for(i=0;i<14;i++){ var a=rnd()*TAU, r=30+rnd()*50, rp=offRoad(X+Math.cos(a)*r, Z+Math.sin(a)*r, 4); lmRock(kit, rp.x, rp.z, 1.5+rnd()*2.5, M2(0x777772)); }
  for(i=0;i<3;i++){ var cp=offRoad(X-20+i*14, Z+(i%2?6:-6), 3.2); propCart(cp.x, cp.z, rnd()*2, i!==1); }
  for(i=0;i<10;i++){ var rx=X+(rnd()*2-1)*40, rz=Z+(rnd()*2-1)*20; kit.box(M2(0x50565e),0.05,1.4,0.05,rx,groundH(rx,rz)+0.6,rz,rnd()*3,0.4,0.3); }
  lmGraveField(kit, X+30, Z+30, 15, 8, rnd);
  for(i=0;i<5;i++){ var bp=offRoad(X-30+i*1.3, Z-12, 1.2); propBarrel(bp.x, bp.z, false); }
  lmLoreAt(s,'🪨','Ambush pass','Boulders on both sides, a broken caravan in the middle. The arrows came from above and nobody saw the archers.');
};
/* 14. burned villages */
SITE_BUILDERS.burned=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  for(i=0;i<9;i++){ var a=i/9*TAU, r=22+rnd()*30; lmSmokeRuin(kit, X+Math.cos(a)*r, Z+Math.sin(a)*r, 6+rnd()*3, 5+rnd()*2, a, rnd); }
  kit.cyln(M2(0x8f8a80),1.1,1.2,1.0,10,X,groundH(X,Z)+0.5,Z); addCollider(X-1.2,Z-1.2,X+1.2,Z+1.2);
  buildBuilding({x:X+50, z:Z-40, w:9, d:14, h:5, wall:0x5a4a3a, roofCol:0x241d16, roof:'flat', door:'S', interior:'shrine', name:'Biserica Arsă', windows:true, chimney:false, porch:false});
  lmGraveField(kit, X-40, Z+50, 20, 16, rnd);
  for(i=0;i<8;i++){ var bx=X+(rnd()*2-1)*50, bz=Z+(rnd()*2-1)*50; kit.box(M2(0x241d16),0.3,1.8+rnd(),0.3,bx,groundH(bx,bz)+1,bz,rnd()*3,0.2*rnd(),0.2*rnd()); }
  lmLoreAt(s,'🔥','Burned village','Black beams, a well nobody drinks from, and the shell of the church. Smoke still rises from one hearth that will not die.');
};
/* 15. memorial */
SITE_BUILDERS.memorial=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), y=groundH(X,Z), i;
  kit.cyln(M2(0x9a9a8a),8,8.5,0.5,12,X,y+0.25,Z); kit.cyln(M2(0x9a9a8a),6,6.3,0.5,12,X,y+0.75,Z);
  kit.box(M2(0x7a7a6a),2.4,7,1.2,X,y+4.5,Z); kit.box(M2(0xc9a227),1.6,2.4,0.1,X,y+4.6,Z+0.62); kit.box(M2(0xc9a227),0.14,1.4,0.14,X,y+8.7,Z); kit.box(M2(0xc9a227),0.7,0.14,0.14,X,y+9.0,Z);
  addCollider(X-1.3,Z-0.7,X+1.3,Z+0.7);
  for(i=0;i<8;i++){ var a=i/8*TAU; kit.box(M2(0x8f8a80),1.0,1.4,0.4,X+Math.cos(a)*7,y+1.7,Z+Math.sin(a)*7,-a+Math.PI/2); addCollider(X+Math.cos(a)*7-0.5,Z+Math.sin(a)*7-0.5,X+Math.cos(a)*7+0.5,Z+Math.sin(a)*7+0.5); }
  for(i=0;i<12;i++){ var ca=i/12*TAU; fCandle(kit,X+Math.cos(ca)*3.2,y+1.0,Z+Math.sin(ca)*3.2,i%3===0); }
  for(i=0;i<4;i++){ var ba=i/4*TAU+0.4; bannerOn(PROP_PARENT, X+Math.cos(ba)*12, y, Z+Math.sin(ba)*12, i%2?0x7a3434:0x3f5f8a); }
  townTrees(X, Z, 8, 20, rnd, 0x4a7a37);
  lmLoreAt(s,'🕯','Stone of the heroes','Names cut into a single block of grey stone, candles that are never allowed to go out. Every faction sends a wreath and every faction claims the dead.');
};
/* 16. trench line — the northern wall */
SITE_BUILDERS.trench=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  for(i=0;i<11;i++){ var px=X-100+i*20, pz=Z+Math.sin(i*0.7)*8; kit.box(M2(0x6e5f43),19,2.0,5,px,groundH(px,pz)+0.8,pz); kit.box(M2(0x5d4326),19,0.4,0.3,px,groundH(px,pz)+2.0,pz+2.4); addCollider(px-9.5,pz-2.5,px+9.5,pz+2.5); if(i%2) propStakes(px, pz+5, 0, 8); }
  fortTower({x:X-100, z:Z-12, r:3.4, h:10, sides:6, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'timber', door:Math.PI/2, brazier:true, name:'Turnul Zidului de Vest'});
  fortTower({x:X+100, z:Z-12, r:3.4, h:10, sides:6, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'timber', door:Math.PI/2, brazier:true, name:'Turnul Zidului de Est'});
  for(i=0;i<5;i++) fortTent({x:X-50+i*25, z:Z-30, w:5, d:6, ry:Math.PI, col:0xb5a487, interior:i%2?'cots':'store'});
  lmSiegeEngine(kit, X+20, Z-50, 0, 'catapult'); propCampfire(X, Z-18, true);
  lmGraveField(kit, X+60, Z+40, 30, 24, rnd);
  lmLoreAt(s,'🛡','The northern wall','A ditch and a rampart across the road, towers at both ends. It stopped one army and buried another.');
};
/* 17. secret: cave shrine */
SITE_BUILDERS.caveshrine=function(s,rnd){
  var kit=cellKit(s.x,s.z), i;
  buildBuilding({x:s.x, z:s.z, w:9, d:11, h:4.2, wall:0x6f6a62, roofCol:0x5a554e, roof:'flat', door:'S', interior:'shrine', name:s.name, windows:false, porch:false, chimney:false, studs:false, doorW:2.2});
  for(i=0;i<10;i++){ var a=i/10*TAU; kit.box(M2(0x6f6a62), 4+rnd()*3, 3+rnd()*3, 4+rnd()*2, s.x+Math.cos(a)*6.5, groundH(s.x,s.z)+2+rnd(), s.z+Math.sin(a)*6-1, a, rnd()*0.4, rnd()*0.3); }
  kit.box(M2(0x5a554e), 12, 3.5, 11, s.x, groundH(s.x,s.z)+5.5, s.z-1, 0.2, 0.05, 0.1);
  fFlame(kit, s.x, groundH(s.x,s.z)+0.6, s.z+8, 0.8, 0.8, 0xffc14d, 12);
  lmLoreAt(s,'✨','Hidden altar in the rock','Behind a fall of stones, an altar older than the monastery. Candles burn that nobody lights.', 20);
};
/* 18. secret: abandoned monastery */
SITE_BUILDERS.ruinmonastery=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), R=M2(0x8a8a86), i;
  lmRuinWall(kit, X-40, Z-34, X+40, Z-34, 3.5, 0.9, R); lmRuinWall(kit, X-40, Z+34, X-6, Z+34, 3.0, 0.9, R); lmRuinWall(kit, X+6, Z+34, X+40, Z+34, 3.0, 0.9, R);
  lmRuinWall(kit, X-40, Z-34, X-40, Z+34, 2.5, 0.9, R); lmRuinWall(kit, X+40, Z-34, X+40, Z+34, 2.8, 0.9, R);
  buildBuilding({x:X, z:Z-10, w:10, d:20, h:6.5, wall:0x8a8a86, roofCol:0x3a4048, roof:'church', door:'S', interior:'crypt', name:'Biserica Părăsită', windows:true, chimney:false, porch:false});
  for(i=0;i<6;i++){ var px=X-30+i*12, pz=Z+20; kit.box(R,0.8,2.2+rnd()*2,0.8,px,groundH(px,pz)+1.2,pz,0,0,rnd()*0.2); addCollider(px-0.5,pz-0.5,px+0.5,pz+0.5); }
  lmGraveField(kit, X+24, Z+8, 12, 10, rnd);
  townTrees(X, Z, 9, 30, rnd, 0x2f4a2e);
  lmLoreAt(s,'🏚','The abandoned monastery','The monks left in one night and took nothing. The crypt beneath the church is still locked from the inside.');
};
/* 19. secret: bandit hideout Cuibul Lupilor */
SITE_BUILDERS.bandits=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), i;
  palisade(ringPts(X,Z,44,22,0.8,0.3), {h:4, gaps:[{x:X+Math.cos(0.3)*44,z:Z+Math.sin(0.3)*44*0.8,w:8}], col:0x4a3a2a});
  buildBuilding({x:X-10, z:Z-8, w:14, d:10, h:4.2, wall:0x5d4326, roofCol:0x3a2a1a, roof:'long', door:'E', interior:'bandit', name:'Bârlogul', style:'log', lore:{key:'barlog', icon:'💰', sub:'The den', story:'Loot chests under the cots, dice on the table, a wolf skull over the door. The band that robbed the Oaza caravans sleeps here.'}});
  buildBuilding({x:X+14, z:Z+12, w:7, d:6, h:3.2, wall:0x5d4326, roofCol:0x3a2a1a, roof:'gable', door:'N', interior:'store', name:'Magazia Prăzii', style:'log', windows:false});
  fortTower({x:X-24, z:Z+18, r:2.8, h:9, sides:6, wall:0x4a3a2a, roofCol:0x3a2a1a, roof:'open', door:Math.PI/2, brazier:true, name:'Turnul Hoților', interior:false});
  fortTent({x:X+18, z:Z-14, w:4.5, d:5.5, ry:Math.PI, col:0x6e5a44, interior:'cots'});
  propCampfire(X+2, Z+4, true); for(i=0;i<5;i++) propBarrel(X+6+(i%3)*1.2, Z-20+Math.floor(i/3)*1.2, i%2===0);
  propCart(X+28, Z+2, 1.2, true);
  for(i=0;i<8;i++) lmRock(kit, X+Math.cos(i*0.8)*(52+rnd()*10), Z+Math.sin(i*0.8)*(45+rnd()*8), 1.5+rnd()*2, M2(0x777772));
  lmLoreAt(s,'🗡','Wolves\' nest','A palisade hidden in the eastern rocks. Stolen goods, stolen horses, and a lookout who whistles like a bird.');
};
/* 20. secret: crypt maze */
SITE_BUILDERS.crypt=function(s,rnd){
  var kit=cellKit(s.x,s.z), i;
  buildBuilding({x:s.x, z:s.z, w:22, d:30, h:4.5, wall:0x5a554e, roofCol:0x6e5f43, roof:'flat', door:'S', interior:'crypt', name:s.name, windows:false, porch:false, chimney:false, studs:false, doorW:2.0, lamp:true});
  /* buried under a mound */
  kit.box(M2(0x6e5f43), 26, 3, 34, s.x, groundH(s.x,s.z)+5.6, s.z-1, 0, 0, 0); kit.box(M2(0x5a6a3a), 24, 1, 30, s.x, groundH(s.x,s.z)+7.3, s.z-1);
  for(i=0;i<6;i++){ var px=s.x-12+i*5, pz=s.z+18; kit.box(M2(0x8f8a80),0.9,1.6,0.5,px,groundH(px,pz)+0.8,pz,0.1*(i%3-1)); addCollider(px-0.5,pz-0.3,px+0.5,pz+0.3); }
  propTroita(s.x+8, s.z+20, 0);
  lmLoreAt(s,'💀','Labyrinth crypt','Walls that turn back on themselves and sarcophagi in every corridor. Find the golden reliquary by the altar and find your way out again.');
};
/* 21. secret: waterfall cave */
SITE_BUILDERS.waterfall=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(s.x,s.z), y=groundH(X,Z), R=M2(0x8a8a86), i;
  for(i=0;i<9;i++){ kit.box(R, 5+rnd()*3, 8+rnd()*8, 4+rnd()*3, X-14+i*3.5, y+5+rnd()*2, Z-10-rnd()*3, rnd()*0.3, 0, rnd()*0.2); }
  addCollider(X-16,Z-16,X-4.5,Z-7); addCollider(X+4.5,Z-16,X+16,Z-7);
  /* the fall and the pool */
  var fall=new THREE.Mesh(new THREE.PlaneGeometry(4,13,1,6), new THREE.MeshLambertMaterial({color:0xcfe6f0, transparent:true, opacity:0.75, side:THREE.DoubleSide}));
  fall.position.set(X, y+6.5, Z-7.6); PROP_PARENT.add(fall); ANIM_PARTS.push({kind:'waterfall', g:fall, x:X, y:y, z:Z-7.6});
  var pool=new THREE.Mesh(new THREE.CircleGeometry(7,16), WATER_MAT); pool.rotation.x=-Math.PI/2; pool.position.set(X, y+0.15, Z-1); pool.name='always'; PROP_PARENT.add(pool); waterSurfaces.push(pool);
  ANIM_PARTS.push({kind:'splash', x:X, y:y+0.3, z:Z-6});
  /* the cave behind the water */
  buildBuilding({x:X, z:Z-16, w:8, d:9, h:3.6, wall:0x6f6a62, roofCol:0x5a554e, roof:'flat', door:'S', interior:'cave', name:'Grota Cascadei', windows:false, porch:false, chimney:false, studs:false, doorW:2.2, lamp:false});
  for(i=0;i<6;i++) lmRock(kit, X-12+i*5, Z+8, 0.8+rnd(), R);
  lmLoreAt(s,'💧','The white widow falls','Walk through the curtain of water: a dry grotto with a fire-ring and a hermit\'s icon waits behind it.', 24);
};
/* 22. secret: forgotten watchtower */
SITE_BUILDERS.lostwatchtower=function(s,rnd){
  var kit=cellKit(s.x,s.z), i;
  fortTower({x:s.x, z:s.z, r:3.8, h:13, sides:8, wall:0x6f6a62, roofCol:0x3a3028, roof:'open', door:Math.PI/2, brazier:false, torches:false, name:s.name});
  for(i=0;i<6;i++){ var a=i/6*TAU; kit.box(M2(0x6f6a62), 1.2, 0.6+rnd()*1.2, 1.0, s.x+Math.cos(a)*7, groundH(s.x,s.z)+0.4, s.z+Math.sin(a)*7, a); }
  townTrees(s.x, s.z, 7, 14, rnd, 0x4a7a37);
  fCandle(kit, s.x+1, groundH(s.x,s.z)+0.3, s.z+1, true);
  lmLoreAt(s,'🗼','The forgotten tower','Ivy over the stair, a cold brazier at the top. From here the marshes and the burned village are both in view — a smuggler\'s lookout now.', 24);
};
/* 23. secret: smuggler tunnels */
SITE_BUILDERS.tunnels=function(s,rnd){
  var kit=cellKit(s.x,s.z), i;
  buildBuilding({x:s.x, z:s.z, w:6, d:90, h:3.4, wall:0x5a554e, roofCol:0x6e5f43, roof:'flat', door:'S', backDoor:true, interior:'tunnel', name:s.name, windows:false, porch:false, chimney:false, studs:false, doorW:2.0, lamp:false});
  kit.box(M2(0x9a8a6a), 9, 2.2, 92, s.x, groundH(s.x,s.z)+4.5, s.z); kit.box(M2(0xc2b08a), 8, 0.6, 90, s.x, groundH(s.x,s.z)+5.8, s.z);
  for(i=0;i<3;i++) propBarrel(s.x+5+i*1.2, s.z-48, i%2===0); propCart(s.x-6, s.z+50, 0.4, false);
  lmLoreAt(s,'🕳','Smugglers\' tunnels','A covered passage under the dunes from the road to the marsh. Salt goes one way, weapons the other.', 50);
};
/* 24. secret: witch's hut */
SITE_BUILDERS.witch=function(s,rnd){
  var kit=cellKit(s.x,s.z), i;
  buildBuilding({x:s.x, z:s.z, w:7, d:6, h:3.2, wall:0x4a3a2a, roofCol:0x3a5a2e, roof:'thatch', door:'S', interior:'witch', name:s.name, style:'log', chimney:true});
  for(i=0;i<8;i++){ var a=i/8*TAU, px=s.x+Math.cos(a)*9, pz=s.z+Math.sin(a)*9; kit.cyln(M2(0x5d4326),0.08,0.1,1.8,5,px,groundH(px,pz)+0.9,pz,0,0,rnd()*0.3); kit.cyln(M2(0xe6dcc6),0.16,0.16,0.2,6,px,groundH(px,pz)+1.9,pz); }
  propCampfire(s.x+5, s.z+5, false);
  kit.cyln(M2(0x241d16),0.6,0.7,0.5,9,s.x-4,groundH(s.x-4,s.z+4)+0.25,s.z+4); addCollider(s.x-4.7,s.z+3.3,s.x-3.3,s.z+4.7);
  townTrees(s.x, s.z, 6, 16, rnd, 0x3a5a2e);
  lmLoreAt(s,'🔮','The witch\'s hut','Skulls on stakes, a cauldron that is always warm. She trades cures for secrets and never asks twice.', 24);
};

/* ============================================================ build them all ============================================================ */
var _lmI=0, _lmBr=0, _lmPhase=0;
function buildLandmarks(budget){
  var tEnd=budget?performance.now()+budget:1e15;
  if(_lmPhase===0){
    for(; _lmI<SITES_DEF.length; _lmI++){
      if(budget && performance.now()>=tEnd && _lmI>0) return true;
      var s=SITES_DEF[_lmI], fn=SITE_BUILDERS[s.kind];
      if(!fn || s._area) continue;
      if(typeof inLoadArea==='function' && !inLoadArea(s.x, s.z)) continue;
      s._area=1;
      var rnd=srand(s.x*31+s.z*17+s.key.length);
      siteBegin(s.name, s.x, s.z, s.r+60);
      fn(s,rnd);
      siteEnd();
    }
    _lmPhase=1;
    if(budget && performance.now()>=tEnd) return true;
  }
  /* bridges over rivers and moats — once; a later reach must not lay them again */
  if(!_lmBridges){
  for(; _lmBr<BRIDGES.length; _lmBr++){
    if(budget && performance.now()>=tEnd && _lmBr>0) return true;
    buildBridge(BRIDGES[_lmBr]);
  }
  _lmBridges=1;
  }
  _lmI=0; _lmBr=0; _lmPhase=0;
  return false;
}
var _lmBridges=0;

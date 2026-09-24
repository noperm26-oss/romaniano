/* ============================================================
   areas.js — new areas NA-01..NA-14 and the remaining named units
   of ROM-MAP-SPEC-003 §6/§7.2 as SITE_BUILDERS kinds:
   pass, charcoal, spa, quarry, sheepfold, windmill, windmillfarm,
   riverport, wolfshrine, saltmine, crystalcave, firemeadow, serai,
   oasis, fair, granary, hermitage, waystation (12 hans), mountain
   (Muntele Corbilor) and cavevillage (Satul de sub Piatră).
   Every wall collides, every door opens into a furnished room, every
   free-standing solid registers its collider (NO-CLIP LAW G1–G8).
   ============================================================ */
/* nearest road (roadNearest) lives in geography.js — used to orient buildings toward the road and to push props off it */
function offRoad(x,z,margin){
  var n=roadNearest(x,z); if(!n.road) return {x:x,z:z};
  var need=n.road.w/2+margin; if(n.d>=need) return {x:x,z:z};
  var dx=x-n.px, dz=z-n.pz, L=Math.hypot(dx,dz); if(L<0.01){ dx=1; dz=0; L=1; }
  return {x:n.px+dx/L*need, z:n.pz+dz/L*need};
}
/* door side facing a target point (axis-aligned buildings only face N/S/E/W) */
function doorToward(x,z,tx,tz){ var dx=tx-x, dz=tz-z; return Math.abs(dx)>Math.abs(dz)?(dx>0?'E':'W'):(dz>0?'S':'N'); }
function aFree(x,z,r){ if(insideSolid(x,z,r)) return false; if(nearDoor(x,z,r+1)) return false; var f=roadField(x,z); if(f.road&&f.d<f.road.w/2+r+0.8) return false; var rf=riverField(x,z); if(rf.river&&rf.d<riverHalfWidth(rf.river,z)*1.5+r) return false; return true; }
function aCairn(kit,x,z,h){ var y=groundH(x,z), S=M2(0x8a8a86); for(var i=0;i<h;i++) kit.box(S,1.1-i*0.13,0.32,1.0-i*0.12, x+(i%2)*0.1, y+0.16+i*0.3, z-(i%2)*0.08, i*0.5); addCollider(x-0.6,z-0.6,x+0.6,z+0.6); }
function aWoodpile(kit,x,z,ry){ var y=groundH(x,z), T=M2(0x6b4f2e); for(var r=0;r<3;r++) for(var c=0;c<5-r;c++) kit.cyln(T,0.22,0.22,2.2,6, x+(c-(4-r)/2)*0.48, y+0.22+r*0.4, z, ry||0, 0, Math.PI/2); addCollider(x-1.3,z-1.2,x+1.3,z+1.2); }

/* ---------- NA-04 Cătunul Cărbunarilor — charcoal burners ---------- */
SITE_BUILDERS.charcoal=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  for(i=0;i<3;i++){ var mx=X-18+i*18, mz=Z-14, y=groundH(mx,mz); kit.cyln(M2(0x2b2622),0.6,3.4,2.6,10, mx,y+1.3,mz); kit.cyln(M2(0x6e5f43),0.4,3.0,0.4,10, mx,y+0.2,mz); addCollider(mx-3.4,mz-3.4,mx+3.4,mz+3.4); regChimney(mx,y+2.7,mz,1.6); }
  buildBuilding({x:X-16, z:Z+16, w:7, d:5.5, h:2.9, wall:0x5d4326, roofCol:0x3a2a1a, roof:'gable', door:'N', interior:'loghouse', name:'Casa Cărbunarului', style:'log', porch:true});
  buildBuilding({x:X+14, z:Z+16, w:7, d:5.5, h:2.9, wall:0x5d4326, roofCol:0x3a2a1a, roof:'gable', door:'N', interior:'woodcutter', name:'Coliba Tăietorilor', style:'log'});
  aWoodpile(kit,X+30,Z-2,0); aWoodpile(kit,X-32,Z+2,0.3); propCart(X+26, Z+14, 0.5, false); propCampfire(X, Z+4, false);
  townTrees(X, Z, 8, 44, rnd, 0x2f4a2e);
  lmLoreAt(s,'🔥','Charcoal burners\' hamlet','Three smouldering mounds and two log cabins black with soot. The forges of Ardealburg burn what these men make.');
};
/* ---------- NA-09 Stațiunea Montană — hot-spring spa ---------- */
SITE_BUILDERS.spa=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  buildBuilding({x:X, z:Z-22, w:14, d:10, h:4.8, wall:0x8f8a80, roofCol:0x3a4048, roof:'gable', door:'S', interior:'bathhouse', name:'Băile Calde', plinth:true, chimney:true,
    lore:{key:'bai_calde', icon:'♨', sub:'The hot baths', story:'Water comes out of the mountain warm and smelling of iron. Boyars come for their knees, soldiers for their scars.'}});
  buildBuilding({x:X+24, z:Z+8, w:12, d:9, h:4.4, wall:0x8f8a80, roofCol:0x3a4048, roof:'gable', door:'W', interior:'inn', name:'Pensiunea Izvoarelor', floors:2, plinth:true});
  for(i=0;i<2;i++){ var px=X-14+i*16, pz=Z+8, y=groundH(px,pz); kit.cyln(M2(0x8a8a86),4.2,4.6,0.9,14, px,y+0.45,pz); kit.cyln(M2(0x9fc4d0),3.6,3.6,0.1,14, px,y+0.86,pz); ANIM_PARTS.push({kind:'fountain', x:px, y:y+1.0, z:pz, steam:true}); addCollider(px-4.4,pz-4.4,px+4.4,pz+4.4); torchPost(px+4.9,pz+4.9,2.2); }
  for(i=0;i<6;i++){ var wx=X-20+i*6, wz=Z+18; kit.box(M2(0x6b4f2e),5.8,0.14,1.6, wx,groundH(wx,wz)+0.2,wz); }
  propWell(X+2, Z+22, 0x3a4048); townTrees(X, Z, 7, 40, rnd, 0x2f4a2e);
  lmLoreAt(s,'♨','Mountain spa','Two steaming pools cut into the rock, a bath house and an inn where the soup is always hot.');
};
/* ---------- NA-03 Cariera de Piatră — stone quarry ---------- */
SITE_BUILDERS.quarry=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), S=M2(0x8f8a80), S2=M2(0x7d7669), i, k;
  for(k=0;k<3;k++){ var r=22+k*14, h=2.6; for(i=0;i<10;i++){ var a0=Math.PI+i/10*Math.PI, a1=Math.PI+(i+1)/10*Math.PI, ax=X+Math.cos(a0)*r, az=Z+Math.sin(a0)*r, bx=X+Math.cos(a1)*r, bz=Z+Math.sin(a1)*r, mx=(ax+bx)/2, mz=(az+bz)/2, L=Math.hypot(bx-ax,bz-az);
    kit.box(i%2?S:S2, L+0.3, h+k*0.6, 2.2, mx, groundH(mx,mz)+(h+k*0.6)/2, mz, -Math.atan2(bz-az,bx-ax)); colliderAlong(ax,az,bx,bz,1.1); } }
  for(i=0;i<8;i++){ var sx=X-26+(i%4)*9, sz=Z+14+Math.floor(i/4)*8, y=groundH(sx,sz); kit.box(S,3.2,1.2,1.6, sx,y+0.6,sz); kit.box(S2,2.6,1.0,1.4, sx,y+1.7,sz,0.1); addCollider(sx-1.7,sz-0.9,sx+1.7,sz+0.9); }
  var cy=groundH(X+20,Z-4); kit.box(M2(0x5d4326),0.5,8,0.5, X+20,cy+4,Z-4); kit.box(M2(0x5d4326),0.3,0.3,7, X+20,cy+7.6,Z-0.5,0,0,0.4); kit.box(M2(0x50565e),0.05,4,0.05, X+20,cy+4.2,Z+2.6); addCollider(X+19.6,Z-4.4,X+20.4,Z-3.6);
  buildBuilding({x:X+34, z:Z+20, w:10, d:7, h:3.8, wall:0x8f8a80, roofCol:0x4a4238, roof:'gable', door:'W', interior:'workshop', name:'Atelierul Pietrarilor', plinth:true});
  buildBuilding({x:X-38, z:Z+22, w:9, d:7, h:3.4, wall:0x8f8a80, roofCol:0x4a4238, roof:'gable', door:'E', interior:'guardhouse', name:'Casa Vătafului'});
  propCart(X+4, Z+30, 0.2, false); propCart(X-8, Z+34, -0.4, true);
  lmLoreAt(s,'⛏','Stone quarry','Three terraces cut into the hill. The white blocks of Romaria\'s cathedral came down this ramp on oxen sledges.');
};
/* ---------- NA-05 Stâna Mare — the great sheepfold ---------- */
SITE_BUILDERS.sheepfold=function(s,rnd){
  rblStana(s.x, s.z, rnd, {r:20, sheep:34, name:'Stâna Mare'});
  buildBuilding({x:s.x+8, z:s.z-34, w:8, d:6, h:3.2, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'S', interior:'smokehouse', name:'Cășăria', style:'log', chimney:true});
  var kit=cellKit(s.x,s.z), i; for(i=0;i<3;i++){ var rx=s.x-30, rz=s.z+26+i*3, y=groundH(rx,rz); kit.box(M2(0x5d4326),0.12,1.6,0.12,rx-2,y+0.8,rz); kit.box(M2(0x5d4326),0.12,1.6,0.12,rx+2,y+0.8,rz); kit.box(M2(0xf0ece4),4.2,0.3,0.4,rx,y+1.5,rz); addCollider(rx-2.1,rz-0.3,rx+2.1,rz+0.3); }
  lmLoreAt(s,'🐑','The great sheepfold','Two thousand sheep in summer, forty dogs, and the best cheese west of the capital.');
};
/* ---------- NA-07 Moara de Vânt — windmill hill ---------- */
SITE_BUILDERS.windmill=function(s,rnd){
  rblMoaraVant(s.x, s.z, {name:s.name, story:'The Transylvanian wind never stops on this hill. The miller pays his tithe to whoever holds the road below.'});
  rblCasa({x:s.x+16, z:s.z+10, door:'W', name:'Casa Morarului', wall:0xe2d6bb, roofCol:0x70503a, timberFrame:true});
  var kit=cellKit(s.x,s.z), i; for(i=0;i<6;i++) propBarrel(s.x-8+i*1.1, s.z+8, false); propCart(s.x+2, s.z-12, 0.3, false);
};
/* ---------- NA-01 Moara Câmpiei — windmill farm ---------- */
SITE_BUILDERS.windmillfarm=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  rblMoaraVant(X-22, Z-14, {name:'Moara Mare', lore:false}); rblMoaraVant(X+24, Z-18, {name:'Moara Mică', h:7.5, sail:5.5, rate:0.6, lore:false});
  buildBuilding({x:X, z:Z+18, w:14, d:9, h:5, wall:0x8a7a5e, roofCol:0x6d5a3e, roof:'gable', door:'N', interior:'granary', name:'Hambarul Câmpiei', plinth:true});
  rblCasa({x:X+26, z:Z+18, door:'W', name:'Casa Morarilor', wall:0x8a7a5e, roofCol:0x968047, roof:'thatch'});
  for(i=0;i<4;i++){ var fx=X-52+i*14, fz=Z+40; kit.box(M2(i%2?0xc9b24a:0x9a8a4a),12,0.25,22,fx,groundH(fx,fz)+0.1,fz); }
  propFence(X-40, Z+4, X-10, Z+4, 1.0); propCart(X-10, Z+30, 0.6, false); propWell(X+4, Z+2, 0x6d5a3e);
  lmLoreAt(s,'🌾','Windmill farm','Two mills grind for the whole plain. When the sails stop, Romaria\'s bread price doubles within the week.');
};
/* ---------- NA-08 Portul Fluvial — river port with the ferry BR-09 ---------- */
SITE_BUILDERS.riverport=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), rf=riverField(X,Z+80), R=rf.river, i;
  var qz=Z+52, qy=flatsH(X,qz)-0.2, T=M2(0x5d4326);
  kit.box(T, 110, 0.5, 8, X+20, qy+0.25, qz); addCollider(X-35,qz-4,X+75,qz+4);
  for(i=0;i<8;i++) kit.cyln(M2(0x4a3a2a),0.25,0.3,1.4,6, X-30+i*14, qy+0.9, qz+3.4);
  if(R){ for(i=0;i<3;i++){ var bx=X-14+i*22, bz=qz+11; kit.box(M2(0x6b4f2e),7,1.1,3,bx,riverWaterY(bx,bz)+0.15,bz); kit.box(T,0.2,4,0.2,bx,riverWaterY(bx,bz)+2.4,bz); }
    /* the ferry: a flat barge on a rope across the river */
    var fx=X+50, fz=qz+18, ry=riverWaterY(fx,fz); kit.box(M2(0x6b4f2e),9,0.8,5,fx,ry+0.2,fz); kit.box(T,0.16,0.16,44,fx,ry+2.2,fz+8); kit.box(T,0.3,3.2,0.3,fx,ry+1.6,fz-6); kit.box(T,0.3,3.2,0.3,fx,ry+1.6,fz+30);
    regStructure({name:'Bacul (ferry BR-09)', kind:'ferry', x:fx, z:fz, hx:4.5, hz:2.5, enterable:false}); }
  buildBuilding({x:X-20, z:Z+30, w:16, d:9, h:4.6, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'gable', door:'S', interior:'warehouse', name:'Antrepozitul I'});
  buildBuilding({x:X+10, z:Z+30, w:16, d:9, h:4.6, wall:0x8a7a5e, roofCol:0x5d4a38, roof:'gable', door:'S', interior:'warehouse', name:'Antrepozitul II'});
  buildBuilding({x:X+42, z:Z+30, w:11, d:8, h:4.2, wall:0x8f8a80, roofCol:0x4a4238, roof:'gable', door:'S', interior:'customs', name:'Căpitănia Portului', lore:{key:'port_capitanie', icon:'⚓', sub:'Harbour master of the Little Danube', story:'Barges from three rivers tie up here. The ferry rope is the only crossing for twenty leagues that a cart can use.'}});
  buildBuilding({x:X-8, z:Z+6, w:12, d:9, h:4.4, wall:0x8a7a5e, roofCol:0x968047, roof:'thatch', door:'S', interior:'tavern', name:'Cârciuma Pescarilor'});
  var cy=qy; kit.box(T,0.5,7,0.5, X+62,cy+3.5,qz-1); kit.box(T,0.3,0.3,6,X+62,cy+6.6,qz+1.5,0,0,0.5); kit.box(M2(0x50565e),0.05,3.6,0.05,X+62,cy+4.2,qz+4.2); addCollider(X+61.6,qz-1.4,X+62.4,qz-0.6);
  townStalls(X-30, Z+14, 4, 8, rnd); propCrate(X+24, qz-6, 0.9); propBarrel(X+28, qz-6, true); propCrate(X-2, qz-6, 0.7);
  for(i=0;i<3;i++){ var nx=X+70+i*4, nz=Z+40, y=groundH(nx,nz); kit.box(T,0.15,2.2,0.15,nx-1.2,y+1.1,nz); kit.box(T,0.15,2.2,0.15,nx+1.2,y+1.1,nz); kit.box(M2(0x8a8a7a),2.6,1.6,0.04,nx,y+1.3,nz); addCollider(nx-1.3,nz-0.2,nx+1.3,nz+0.2); }
  for(i=0;i<4;i++) torchPost(X-30+i*30, qz-6, 2.6);
  lmLoreAt(s,'⚓','River port','Quays, two warehouses, the harbour master and the ferry. Salt goes down the river, grain and wine come up.');
};
/* ---------- U-MO-03 Altarul Lupului — the wolf shrine grove ---------- */
SITE_BUILDERS.wolfshrine=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i, S=M2(0x6f6a62), D=M2(0x3a3430);
  for(i=0;i<9;i++){ var a=i/9*TAU, sx=X+Math.cos(a)*14, sz=Z+Math.sin(a)*14, y=groundH(sx,sz); kit.box(S,1.2,3.2+(i%3)*0.6,0.9, sx,y+1.6,sz, a); addCollider(sx-0.7,sz-0.7,sx+0.7,sz+0.7); }
  var ay=groundH(X,Z); kit.box(S,3.2,1.1,1.6, X,ay+0.55,Z); kit.box(D,0.6,1.6,0.5, X-1.1,ay+1.9,Z,0.2); kit.box(D,0.5,1.4,0.5, X+1.1,ay+1.8,Z,-0.2); kit.box(D,0.9,0.4,0.4, X-1.1,ay+2.8,Z,0,0,0.3); addCollider(X-1.7,Z-0.9,X+1.7,Z+0.9);
  propBrazier(X-4, Z+3, true); propBrazier(X+4, Z+3, true);
  vTreeRing(X, Z, 10, 30, rnd, 0x2f4a2e, 1.8); vTreeRing(X, Z, 12, 48, rnd, 0x3a5a2e, 1.4);
  buildBuilding({x:X+40, z:Z+30, w:6, d:5, h:2.8, wall:0x5d4326, roofCol:0x3a2a1a, roof:'gable', door:'W', interior:'loghouse', name:'Coliba Paznicului Altarului', style:'log', windows:false});
  for(i=0;i<8;i++){ var px=X+Math.cos(i*0.4+1)*22, pz=Z+Math.sin(i*0.4+1)*22; kit.box(M2(0x8f8a80),0.8,0.16,0.8, px,groundH(px,pz)+0.1,pz, i); }
  propGrave(X+18, Z-20, 0.3, true); propGrave(X+21, Z-19, 0.2, false);
  lmLoreAt(s,'🐺','The wolf altar','Nine standing stones in an oak grove and an altar carved with two wolves. Shepherds leave the first lamb; soldiers leave arrowheads.');
};
/* ---------- NA-02 Ocna de Jos — salt mine ---------- */
SITE_BUILDERS.saltmine=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i, R=M2(0x8a8a86), T=M2(0x5d4326);
  /* the mound with the timber portal (the gallery is a furnished cave room) */
  buildBuilding({x:X, z:Z-30, w:10, d:12, h:4.4, wall:0x7d7669, roofCol:0x6f6a62, roof:'flat', door:'S', interior:'cave', name:'Galeria Ocnei', windows:false, porch:false, chimney:false, plinth:false, timberFrame:false, doorW:2.6, lamp:true});
  for(i=0;i<10;i++){ var a=i/10*TAU, rr=8+rnd()*3; kit.box(R, 5+rnd()*3, 3+rnd()*3, 5+rnd()*3, X+Math.cos(a)*rr, groundH(X,Z-30)+2+rnd(), Z-30+Math.sin(a)*rr*0.9-1, a, rnd()*0.3, rnd()*0.3); }
  kit.box(R, 14, 4, 12, X, groundH(X,Z-30)+6.4, Z-32, 0.1, 0.05, 0.08);
  kit.box(T,0.5,2.9,0.5,X-1.8,groundH(X,Z-24)+1.45,Z-23.6); kit.box(T,0.5,2.9,0.5,X+1.8,groundH(X,Z-24)+1.45,Z-23.6); kit.box(T,4.4,0.5,0.6,X,groundH(X,Z-24)+3.1,Z-23.6);
  /* headframe and winch, salt heaps, rail carts */
  var hy=groundH(X+18,Z-8); kit.box(T,0.4,7,0.4,X+16,hy+3.5,Z-8); kit.box(T,0.4,7,0.4,X+20,hy+3.5,Z-8); kit.box(T,5,0.4,0.4,X+18,hy+7.2,Z-8); addCollider(X+15.7,Z-8.3,X+20.3,Z-7.7);
  ANIM_PARTS.push({kind:'winch', x:X+18, y:hy+6.6, z:Z-8});
  for(i=0;i<3;i++){ var sx=X-20+i*7, sz=Z+2, y=groundH(sx,sz); kit.cyln(M2(0xf4f1ea),0.4,2.6,2.2,9,sx,y+1.1,sz); addCollider(sx-2.4,sz-2.4,sx+2.4,sz+2.4); }
  for(i=0;i<3;i++){ var cx=X+6+i*3.4, cz=Z+6, y2=groundH(cx,cz); kit.box(M2(0x50565e),2.2,1.0,1.3,cx,y2+0.7,cz); kit.box(M2(0xf4f1ea),1.8,0.4,1.0,cx,y2+1.3,cz); addCollider(cx-1.1,cz-0.7,cx+1.1,cz+0.7); }
  kit.box(M2(0x50565e),0.12,0.1,26, X+6, groundH(X+6,Z-6)+0.05, Z-6); kit.box(M2(0x50565e),0.12,0.1,26, X+7.2, groundH(X+7,Z-6)+0.05, Z-6);
  buildBuilding({x:X-30, z:Z+24, w:14, d:8, h:4, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'N', interior:'barracks', name:'Cazarma Ocnașilor', style:'log'});
  buildBuilding({x:X+30, z:Z+24, w:10, d:7, h:3.8, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'N', interior:'guardhouse', name:'Corpul de Gardă al Ocnei', style:'log'});
  rblSalt({x:X, z:Z+30, door:'N', name:'Magazia Mare de Sare'});
  propCart(X-10, Z+14, 0.2, false); torchPost(X-6, Z-20, 2.6); torchPost(X+6, Z-20, 2.6);
  lmLoreAt(s,'🧂','Salt mine','The gallery goes down two hundred steps into white halls. Convicts dig; the guard counts every block; the Salt Road starts at the headframe.');
};
/* ---------- NA-10 Peștera Cristalelor — crystal cave ---------- */
SITE_BUILDERS.crystalcave=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i, R=M2(0x6f6a62), C=M(0x9fe8ff,{emissive:0x3fa0c0});
  buildBuilding({x:X, z:Z, w:11, d:12, h:4.6, wall:0x6f6a62, roofCol:0x5a554e, roof:'flat', door:'S', interior:'cave', name:s.name, windows:false, porch:false, chimney:false, plinth:false, timberFrame:false, doorW:2.2, lamp:false});
  for(i=0;i<12;i++){ var a=i/12*TAU, rr=7+rnd()*3; kit.box(R, 5+rnd()*3, 3+rnd()*4, 5+rnd()*3, X+Math.cos(a)*rr, groundH(X,Z)+2+rnd(), Z+Math.sin(a)*rr*0.9-1.5, a, rnd()*0.4, rnd()*0.4); }
  kit.box(R, 15, 4, 13, X, groundH(X,Z)+6.2, Z-1, 0.1, 0.05, 0.08);
  for(i=0;i<9;i++){ var cx=X+(rnd()*2-1)*9, cz=Z-4+(rnd()*2-1)*6, y=groundH(cx,cz); kit.pyr(C, 0.5+rnd()*0.5, 1.2+rnd()*1.6, 6, cx, y+1.0, cz, rnd()*TAU, rnd()*0.3, rnd()*0.3); }
  for(i=0;i<5;i++){ var px=X+Math.cos(i*1.3)*12, pz=Z+8+Math.sin(i*1.3)*3, y2=groundH(px,pz); kit.pyr(C, 0.4, 1.0+rnd(), 6, px, y2+0.6, pz, rnd()*TAU, 0.2, 0.1); }
  regLight(X, groundH(X,Z)+2, Z, 0x7fd0ff, 0.9, 16, 0);
  torchPost(X+4, Z+10, 2.2);
  lmLoreAt(s,'💎','Crystal cave','Quartz grows from the floor like frozen fire. Smugglers used it for a lamp-less store; the crystals give light enough to read.');
};
/* ---------- NA-12 Pajiștea Focului — the fire meadow ---------- */
SITE_BUILDERS.firemeadow=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  kit.cyln(M2(0x3a3430),22,24,0.14,20, X,groundH(X,Z)+0.06,Z);
  for(i=0;i<5;i++){ var a=i/5*TAU, px=X+Math.cos(a)*12, pz=Z+Math.sin(a)*12; propCampfire(px,pz,true); }
  propCampfire(X,Z,true);
  for(i=0;i<8;i++){ var ta=i/8*TAU+0.2; torchPost(X+Math.cos(ta)*30, Z+Math.sin(ta)*30, 3.2); }
  for(i=0;i<6;i++){ var bx=X+Math.cos(i*1.1)*40, bz=Z+Math.sin(i*1.1)*40, y=groundH(bx,bz); kit.cyln(M2(0x241d16),0.25,0.4,5+rnd()*2,6,bx,y+2.6,bz,0.1,0,0.1); kit.box(M2(0x241d16),2.4,0.2,0.2,bx,y+4.2,bz,0.6,0,0.3); addCollider(bx-0.4,bz-0.4,bx+0.4,bz+0.4); }
  var py=groundH(X+30,Z-30); kit.box(M2(0x5d4326),0.3,4,0.3,X+28,py+2,Z-32); kit.box(M2(0x5d4326),0.3,4,0.3,X+32,py+2,Z-32); kit.box(M2(0x5d4326),0.3,4,0.3,X+28,py+2,Z-28); kit.box(M2(0x5d4326),0.3,4,0.3,X+32,py+2,Z-28); kit.box(M2(0x6b4f2e),5,0.3,5,X+30,py+4.1,Z-30); addCollider(X+27.6,Z-32.4,X+32.4,Z-27.6);
  lmLoreAt(s,'🔥','The fire meadow','Where the borderers burn the winter out every March: six great fires, torches on poles, and dancing until the ash is cold.');
};
/* ---------- U-TD-03 Caravanseraiul de Sud — walled caravanserai ---------- */
SITE_BUILDERS.serai=function(s,rnd){
  var X=s.x, Z=s.z, AD=0xc2b08a, RF=0x9a6a3a, i;
  fortWallRun([[X-44,Z-32],[X+44,Z-32],[X+44,Z+32],[X-44,Z+32]], {h:5.5, t:1.2, wall:AD, merlons:true, slits:false, walk:false}, [{x:X,z:Z+32,w:12}], true);
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(c,k){ fortTower({x:X+c[0]*44, z:Z+c[1]*32, r:3.2, h:8, sides:8, wall:AD, roofCol:RF, roof:'flat', door:Math.atan2(-c[1],-c[0]), brazier:k<2, name:'Turnul Seraiului '+(k+1), interior:false}); });
  fortGate({x:X, z:Z+32, dir:'S', w:6, h:6.5, tw:3.4, ph:4.4, wall:AD, roofCol:RF, portcullis:false, leaves:true, name:'Poarta Seraiului'});
  townPlaza(X, Z, 16, AD); townStreet(X, Z+60, X, Z+16, 6, AD);
  buildBuilding({x:X, z:Z-22, w:30, d:10, h:5, wall:0xd9c8a2, roofCol:RF, roof:'flat', door:'S', interior:'inn', name:'Hanul Seraiului', arcade:true, floors:2, lore:{key:'serai_han', icon:'🐪', sub:'The caravanserai', story:'Forty rooms around a courtyard, a well in the middle and a gate barred at dusk. Merchants from the south sleep with their goods.'}});
  buildBuilding({x:X-32, z:Z+2, w:9, d:22, h:4.4, wall:AD, roofCol:RF, roof:'long', door:'E', interior:'stable', name:'Grajdurile Seraiului'});
  buildBuilding({x:X+32, z:Z-4, w:9, d:14, h:4.4, wall:AD, roofCol:RF, roof:'flat', door:'W', interior:'warehouse', name:'Magaziile'});
  buildBuilding({x:X+32, z:Z+16, w:9, d:9, h:4, wall:AD, roofCol:RF, roof:'flat', door:'W', interior:'bathhouse', name:'Hamamul'});
  propWell(X, Z, RF); townStalls(X, Z, 6, 11, rnd);
  for(i=0;i<3;i++) propCart(X-16+i*9, Z+22, rnd()*0.3, false);
  var kit=cellKit(X,Z); for(i=0;i<6;i++){ var pa=i/6*TAU+0.3, px=X+Math.cos(pa)*54, pz=Z+Math.sin(pa)*42; if(aFree(px,pz,1.5)) vPalm(kit,px,pz,1.1); }
  for(i=0;i<4;i++){ var ta=i/4*TAU+0.8; torchPost(X+Math.cos(ta)*12, Z+Math.sin(ta)*12, 2.6); }
  lmLoreAt(s,'🐪','Caravanserai of the south','Adobe walls, four squat towers and one gate. The last safe bed before the desert road.', 120);
};
/* ---------- U-TD-04 Oaza de Sud — the oasis ---------- */
SITE_BUILDERS.oasis=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  for(i=0;i<14;i++){ var a=i/14*TAU, r=42+rnd()*8, px=X+Math.cos(a)*r, pz=Z+Math.sin(a)*r; if(aFree(px,pz,1.2)) vPalm(kit,px,pz,1+rnd()*0.5); }
  for(i=0;i<3;i++){ var ta=i*2.1+0.4, tx=X+Math.cos(ta)*56, tz=Z+Math.sin(ta)*52; if(aFree(tx,tz,4)) fortTent({x:tx, z:tz, w:5, d:6, ry:ta, col:0xd9c8a2, trim:0x8b2d2d, name:'Cortul Caravanei '+(i+1)}); }
  propCampfire(X+50, Z+10, true); propCart(X+44, Z+20, 0.4, false); propCart(X-50, Z-12, -0.3, false);
  propWell(X+52, Z-14, 0x9a6a3a); propTroita(X-54, Z+8, 0.3);
  for(i=0;i<20;i++){ var rx=X+(rnd()*2-1)*46, rz=Z+(rnd()*2-1)*46; if(Math.hypot(rx-X,rz-Z)<40||Math.hypot(rx-X,rz-Z)>46) continue; kit.cyln(M2(0x6a7a3a),0.05,0.08,1.4+rnd(),4,rx,groundH(rx,rz)+0.8,rz); }
  lmLoreAt(s,'🌴','Oasis of the south','Date palms around a green pool; tents, a well and the smell of roasting lamb. Caravans rest a day here whatever the war.');
};
/* ---------- NA-06 Târgul de Toamnă — the autumn fair ---------- */
SITE_BUILDERS.fair=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  townPlaza(X, Z, 34, 0xc2b08a); townStalls(X, Z, 10, 16, rnd); townStalls(X, Z, 14, 30, rnd);
  var sy=groundH(X,Z-44); kit.box(M2(0x6b4f2e),12,1.0,6,X,sy+0.5,Z-44); kit.box(M2(0x8b2d2d),12.4,0.1,6.4,X,sy+3.6,Z-44); for(i=-1;i<=1;i+=2){ kit.box(M2(0x5d4326),0.2,3.2,0.2,X+i*5.8,sy+2.0,Z-46.8); kit.box(M2(0x5d4326),0.2,3.2,0.2,X+i*5.8,sy+2.0,Z-41.2); } addCollider(X-6.2,Z-47.2,X+6.2,Z-40.8);
  var my=groundH(X,Z); kit.cyln(M2(0xe2d6bb),0.16,0.2,9,7,X,my+4.5,Z); for(i=0;i<6;i++){ var a=i/6*TAU; kit.box(M2([0x8b2d2d,0xc9a227,0x3f5f8a,0x5a8a3a,0xe8e0cf,0xc46a2a][i]),0.12,8.6,0.06,X+Math.cos(a)*1.4,my+4.6,Z+Math.sin(a)*1.4,a,0,0.16); } addCollider(X-0.4,Z-0.4,X+0.4,Z+0.4);
  propFence(X+40, Z+20, X+58, Z+20, 1.0); propFence(X+40, Z+34, X+58, Z+34, 1.0); propFence(X+40, Z+20, X+40, Z+34, 1.0); propFence(X+58, Z+20, X+58, Z+34, 1.0);
  for(i=0;i<7;i++){ var sx=X+43+rnd()*12, sz=Z+22+rnd()*10, y=groundH(sx,sz); kit.box(M2(0xe8e0cf),0.9,0.55,0.55,sx,y+0.55,sz,rnd()*TAU); }
  fortTent({x:X-48, z:Z+20, w:8, d:10, ry:0.3, col:0xd9c8a2, trim:0x3f5f8a, name:'Cortul Crâșmei'});
  for(i=0;i<4;i++) propCart(X-40+i*22, Z+46, rnd()*0.5, false);
  for(i=0;i<8;i++){ var ta=i/8*TAU+0.1; torchPost(X+Math.cos(ta)*38, Z+Math.sin(ta)*38, 2.6); }
  lmLoreAt(s,'🎪','The autumn fair','Two rings of stalls, a stage, a maypole with six ribbons and a pen of sheep for sale. Once a year the whole road comes here.');
};
/* ---------- NA-11 Grânarul Regelui — the king's granary ---------- */
SITE_BUILDERS.granary=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), i;
  for(i=0;i<3;i++) buildBuilding({x:X-30+i*30, z:Z-20, w:18, d:10, h:6.5, wall:0x9a9a8a, roofCol:0x8a4a3a, roof:'gable', door:'S', interior:'granary', name:'Grânarul Regal '+['I','II','III'][i], plinth:true, buttress:true, windows:false, lore:i===1?{key:'granar_regal', icon:'🌾', sub:'The king\'s granary', story:'Three stone halls of wheat, sealed with the royal lion. A year of bread for the capital if the fields burn.'}:undefined});
  kit.cyln(M2(0x9a8a6a),14,14,0.14,18, X,groundH(X,Z+14)+0.06,Z+14);
  rblMoaraVant(X+50, Z+14, {name:'Moara Grânarului', lore:false});
  buildBuilding({x:X-46, z:Z+16, w:9, d:7, h:3.8, wall:0x9a9a8a, roofCol:0x4a4238, roof:'gable', door:'E', interior:'guardhouse', name:'Garda Grânarului'});
  for(i=0;i<8;i++){ var sx=X-10+(i%4)*2.4, sz=Z+30+Math.floor(i/4)*1.4; kit.cyln(M2(0xc9a065),0.55,0.6,1.0,7,sx,groundH(sx,sz)+0.5,sz); } addCollider(X-11,Z+29,X+0,Z+32);
  propCart(X+14, Z+30, 0.2, false); propCart(X+24, Z+32, -0.3, false);
  propFence(X-56, Z-40, X+56, Z-40, 1.1); propFence(X-56, Z-40, X-56, Z+40, 1.1); propFence(X+56, Z-40, X+56, Z+40, 1.1);
  torchPost(X-8, Z-8, 2.6); torchPost(X+8, Z-8, 2.6);
};
/* ---------- NA-14 Chilia Săpată — the carved hermitage ---------- */
SITE_BUILDERS.hermitage=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), R=M2(0x8a8a86), i;
  buildBuilding({x:X, z:Z, w:5.5, d:5.5, h:3.0, wall:0x8a8a86, roofCol:0x7d7669, roof:'flat', door:'S', interior:'cells', name:s.name, windows:true, porch:false, chimney:true, plinth:false, timberFrame:false});
  for(i=0;i<7;i++){ var a=Math.PI+i/7*Math.PI, rr=6+rnd()*2; kit.box(R, 4+rnd()*3, 4+rnd()*4, 4+rnd()*2, X+Math.cos(a)*rr, groundH(X,Z)+2.5+rnd(), Z+Math.sin(a)*rr-2, a, rnd()*0.3, rnd()*0.3); }
  kit.box(R, 12, 4, 9, X, groundH(X,Z)+5.2, Z-2, 0.1, 0.05, 0.05);
  for(i=0;i<5;i++) kit.box(R, 1.6, 0.3, 1.0, X+0.6*i, groundH(X,Z+6)+0.15+i*0.3, Z+8-i*0.9);
  var by=groundH(X+5,Z+4); kit.box(M2(0x5d4326),0.25,3.2,0.25, X+5,by+1.6,Z+4); kit.box(M2(0x5d4326),1.2,0.2,0.2, X+5,by+3.2,Z+4); addCollider(X+4.7,Z+3.7,X+5.3,Z+4.3);
  ANIM_PARTS.push({kind:'bell', x:X+5, y:by+3.0, z:Z+4});
  propTroita(X-5, Z+5, 0.4); propFence(X+2, Z+10, X+9, Z+10, 0.8); propFence(X+9, Z+10, X+9, Z+15, 0.8);
  for(i=0;i<3;i++) kit.box(M2(0x4a6a3a),1.6,0.4,1.0, X+4+i*1.9, groundH(X+4,Z+12)+0.2, Z+12.5);
  wallTorch(X+2.9, groundH(X,Z)+2.2, Z+2.9);
  lmLoreAt(s,'🕯','The carved hermitage','A single cell cut into the cliff, a bell on a post, three rows of beans. The hermit blesses whoever climbs the path — soldier or thief.');
};
/* ---------- U-CA-04 Trecătoarea Frostwind — the pass ---------- */
SITE_BUILDERS.pass=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), R=M2(0x8a9aa8), R2=M2(0x7a8a98), W=M2(0xe8f0f8), i;
  for(i=0;i<10;i++){ lmRock(kit, X-72+i*16, Z-16-rnd()*10, 2.2+rnd()*2.2, i%2?R:R2); lmRock(kit, X-72+i*16, Z+16+rnd()*10, 2.2+rnd()*2.2, i%2?R2:R); }
  var gy=groundH(X,Z); kit.box(R2, 4, 14, 4, X-10, gy+7, Z-9); kit.box(R2, 4, 14, 4, X-10, gy+7, Z+9); kit.box(R, 5, 3, 22, X-10, gy+15, Z, 0, 0, 0.08); addCollider(X-12,Z-11,X-8,Z-7); addCollider(X-12,Z+7,X-8,Z+11);
  for(i=0;i<5;i++) aCairn(kit, X-60+i*30, Z+13, 4+i%2);
  for(i=0;i<8;i++){ var sx=X+(rnd()*2-1)*80, sz=Z+(rnd()>0.5?1:-1)*(12+rnd()*18); if(!aFree(sx,sz,3)) continue; kit.box(W, 5+rnd()*4, 0.6, 3+rnd()*3, sx, groundH(sx,sz)+0.2, sz, rnd()); }
  buildBuilding({x:X+30, z:Z+24, w:6, d:5, h:2.8, wall:0x5d4326, roofCol:0x3a4048, roof:'gable', door:'N', interior:'loghouse', name:'Adăpostul Trecătorii', style:'log', windows:false, plinth:true});
  propTroita(X+8, Z-13, 0.2); propStakes(X+40, Z-14, 0.3, 4);
  for(i=0;i<4;i++){ var px=X-50+i*32, pz=Z-12; if(aFree(px,pz,0.5)){ kit.box(M2(0x5d4326),0.16,4.5,0.16, px, groundH(px,pz)+2.25, pz); addCollider(px-0.2,pz-0.2,px+0.2,pz+0.2); bannerOn(PROP_PARENT, px, groundH(px,pz)+4.2, pz, 'vikings'); } }
  torchPost(X-14, Z-12, 3); torchPost(X-14, Z+12, 3);
  lmLoreAt(s,'🏔','Frostwind Pass','The only gap in the northern ridge: a natural arch, cairns for the lost, and a shelter hut. The wind here has a name.', 110);
};
/* ---------- WS-01..12 waystations: hans and ridge huts beside the road ---------- */
SITE_BUILDERS.waystation=function(s,rnd){
  var X=s.x, Z=s.z, n=roadNearest(X,Z), door=n.road?doorToward(X,Z,n.px,n.pz):'S', kit=cellKit(X,Z);
  if(s.hut){
    buildBuilding({x:X, z:Z, w:6, d:5, h:2.8, wall:0x5d4326, roofCol:0x3a4048, roof:'gable', door:door, interior:'loghouse', name:s.name, style:'log', windows:false, plinth:true, porch:true});
    aWoodpile(kit, X+5.5, Z-3, 0); propCampfire(X+4, Z+5, false); aCairn(kit, X-5, Z+4, 4);
    lmLoreAt(s,'🛖','Ridge shelter','Logs, a stove and a stack of firewood. Whoever uses it leaves wood for the next traveller.');
  } else {
    rblHan({x:X, z:Z, w:11, d:8, h:4.4, door:door, name:s.name, wall:s.region==='trade_route'?0xc2b08a:0xd9c8a2, roofCol:s.region==='carpathian'?0x3a4048:0x70503a, timberFrame:s.region==='transylvanian'||s.region==='capital'});
    propTroita(X+(door==='E'?-9:9), Z+(door==='S'?-7:7), 0.2);
    lmLoreAt(s,'🏨','Waystation — '+s.name,'A yard, a well, beds for twelve and stabling for their horses. The innkeeper knows every rider on this road by name.', 40);
  }
  propSignpost(X+(door==='W'?-8:8), Z+(door==='N'?-8:8), 0.4);
};
/* ---------- NA-13 Muntele Corbilor — the raven mountain (cliff bands, crags, summit beacon) ---------- */
SITE_BUILDERS.mountain=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), R=M2(0x8a9aa8), R2=M2(0x6f7378), W=M2(0xe8f0f8), i, k;
  var trail=ROADS.filter(function(r){ return r.id==='TR-12'; })[0];
  function trailNear(x,z){ if(!trail) return false; for(var j=0;j<trail.pts.length;j++){ if(Math.hypot(trail.pts[j][0]-x,trail.pts[j][1]-z)<9) return true; } return false; }
  var bands=[70,120,170];
  bands.forEach(function(rb,bi){
    var n=Math.round(rb*0.55);
    for(i=0;i<n;i++){
      var a0=i/n*TAU, a1=(i+1)/n*TAU, ax=X+Math.cos(a0)*rb, az=Z+Math.sin(a0)*rb, bx=X+Math.cos(a1)*rb, bz=Z+Math.sin(a1)*rb, mx=(ax+bx)/2, mz=(az+bz)/2;
      if(Math.hypot(mx-MASSIF.cave.x, mz-MASSIF.cave.z)<MASSIF.cave.r+20) continue;        /* the cave village foot stays open */
      if(trailNear(mx,mz)) continue;                                                        /* the Raven Stair passes through */
      colliderAlong(ax,az,bx,bz,1.6);
      if(i%2===0){ var hh=3+rnd()*4; kit.box(bi===2?R2:R, Math.hypot(bx-ax,bz-az)+1.2, hh, 3.2, mx, groundH(mx,mz)+hh*0.35, mz, -Math.atan2(bz-az,bx-ax), rnd()*0.2-0.1, 0.35+rnd()*0.2); }
    }
  });
  for(i=0;i<26;i++){ var a=rnd()*TAU, r=30+rnd()*150, px=X+Math.cos(a)*r, pz=Z+Math.sin(a)*r; if(trailNear(px,pz)||Math.hypot(px-MASSIF.cave.x,pz-MASSIF.cave.z)<MASSIF.cave.r+16) continue; lmRock(kit, px, pz, 1.4+rnd()*2.4, rnd()<0.5?R:R2); }
  for(i=0;i<10;i++){ var sa=rnd()*TAU, sr=rnd()*60, sx=X+Math.cos(sa)*sr, sz=Z+Math.sin(sa)*sr; kit.box(W, 4+rnd()*5, 0.5, 3+rnd()*4, sx, groundH(sx,sz)+0.15, sz, rnd()); }
  /* the summit: cairn, the raven roost stone, the beacon SB-13, a survey cross */
  aCairn(kit, X+4, Z+3, 6);
  var ty=groundH(X,Z); kit.box(R2, 3.2, 4.6, 2.6, X-5, ty+2.0, Z-2, 0.4, 0.1, 0.2); addCollider(X-6.8,Z-3.6,X-3.2,Z-0.4);
  for(k=0;k<4;k++){ kit.box(M2(0x241d16),0.5,0.3,0.7, X-5+(k%2)*0.9, ty+4.4+(k>1?0.3:0), Z-2.4+k*0.4, k*0.7); }
  propTroita(X+2, Z-6, 0.3);
  lmLoreAt(s,'🏔','Raven Mountain','Three cliff bands, one stair, a summit where the ravens roost and the highest beacon in the land. From here you can see every homeland at once.', 200);
};
/* ---------- NV-17 Satul de sub Piatră — the cave village under the north foot ---------- */
SITE_BUILDERS.cavevillage=function(s,rnd){
  var X=s.x, Z=s.z, kit=cellKit(X,Z), R=M2(0x6f6a62), R2=M2(0x5a554e), R3=M2(0x7d7669), i, gy=groundH(X,Z);
  var HW=62, HD=38, H=16, L=M2(0x8a9aa8), L2=M2(0x7a8a98), SN=M2(0xe8f0f8);    /* the rock hall: open to the north (z-), back wall to the south against the massif */
  /* the roof: a mound of overlapping limestone masses (no clean slab), snow on top, merging into the slope behind */
  kit.box(R2, HW*2+16, 6, HD*2+14, X, gy+H+3.0, Z+2, 0, 0.02, 0.01);
  for(i=0;i<9;i++){ var mx=X-HW+i*(HW*2/8), md=HD*(0.8+rnd()*0.5), mh=6+rnd()*7; kit.box(i%2?L:L2, HW*0.5+rnd()*14, mh, md*2, mx, gy+H+4+mh/2-1, Z+6+rnd()*10, rnd()*0.3-0.15, (rnd()-0.5)*0.16, (rnd()-0.5)*0.2); }
  for(i=0;i<5;i++){ var bx2=X-HW+10+i*(HW*2-20)/4; kit.box(L2, 30+rnd()*16, 12+rnd()*10, 26+rnd()*10, bx2, gy+H+8+rnd()*4, Z+HD+16+rnd()*10, rnd()*0.4-0.2, -0.2, (rnd()-0.5)*0.2); }
  for(i=0;i<7;i++){ var sx2=X-HW+rnd()*HW*2, sz2=Z-HD+10+rnd()*HD*1.6; kit.box(SN, 12+rnd()*16, 0.7, 8+rnd()*10, sx2, gy+H+9.5+rnd()*3, sz2, rnd()); }
  kit.box(R, HW*2+10, H, 8, X, gy+H/2, Z+HD+2); addCollider(X-HW-5, Z+HD-2, X+HW+5, Z+HD+6);
  kit.box(R, 8, H, HD*2-10, X-HW-1, gy+H/2, Z-3); addCollider(X-HW-5, Z-HD+2, X-HW+3, Z+HD);
  kit.box(R, 8, H, HD*2-10, X+HW+1, gy+H/2, Z-3); addCollider(X+HW-3, Z-HD+2, X+HW+5, Z+HD);
  for(i=0;i<6;i++){ var fx=(i<3?-1:1)*(HW+8+rnd()*6), fz=Z-HD+14+(i%3)*24; kit.box(L2, 12+rnd()*8, 8+rnd()*9, 16+rnd()*8, X+fx, gy+4+rnd()*3, fz, rnd()*0.4, (rnd()-0.5)*0.2, (rnd()-0.5)*0.3); addCollider(X+fx-8, fz-10, X+fx+8, fz+10); }
  /* the mouth: two rock pillars, a jagged lintel, an overhang of boulders */
  kit.box(R3, 7, H, 7, X-30, gy+H/2, Z-HD+2, 0.2); addCollider(X-33.5, Z-HD-1.5, X-26.5, Z-HD+5.5);
  kit.box(R3, 7, H, 7, X+30, gy+H/2, Z-HD+2, -0.2); addCollider(X+26.5, Z-HD-1.5, X+33.5, Z-HD+5.5);
  for(i=0;i<4;i++){ kit.box(i%2?L:L2, HW*0.6+rnd()*10, 4.5+rnd()*2, 8+rnd()*3, X-HW*0.75+i*HW*0.5, gy+H+0.6+rnd()*1.2, Z-HD+1+rnd()*2, (rnd()-0.5)*0.2, 0.1+rnd()*0.1, (rnd()-0.5)*0.12); }
  for(i=0;i<12;i++){ var bx=X-HW-6+i*(HW*2+12)/11, bz=Z-HD-4-rnd()*4; lmRock(kit, bx, bz, 1.6+rnd()*2, rnd()<0.5?R:R3); }
  /* chamber dividers with openings (rock ribs) */
  kit.box(R2, 4, H-2, 20, X-24, gy+(H-2)/2, Z+16); addCollider(X-26, Z+6, X-22, Z+26);
  kit.box(R2, 4, H-2, 20, X+24, gy+(H-2)/2, Z+16); addCollider(X+22, Z+6, X+26, Z+26);
  kit.box(R2, 4, H-2, 12, X-24, gy+(H-2)/2, Z-26); addCollider(X-26, Z-32, X-22, Z-20);
  kit.box(R2, 4, H-2, 12, X+24, gy+(H-2)/2, Z-26); addCollider(X+22, Z-32, X+26, Z-20);
  /* stalactites, vents, the spring */
  for(i=0;i<14;i++){ var sx=X+(rnd()*2-1)*HW*0.9, sz=Z+(rnd()*2-1)*HD*0.8; kit.pyr(R2, 0.5+rnd()*0.8, 1.5+rnd()*2.5, 5, sx, gy+H-0.9-rnd(), sz, rnd(), Math.PI, 0); }
  kit.box(R2, 3, 3, 3, X-10, gy+H+2, Z+10); regChimney(X-10, gy+H+3.4, Z+10, 0.8);
  /* the central plaza with the fire pit (CMP-CA-8) and the well */
  townPlaza(X, Z, 12, 0x6f6a62);
  propCampfire(X, Z+2, true); propWell(X+9, Z-6, 0x5a554e);
  /* the carved chapel CMP-CA-9 (west chamber), the elder's hall, dwellings at ground level */
  buildBuilding({x:X-46, z:Z+2, w:8, d:11, h:4.6, wall:0x7d7669, roofCol:0x6f6a62, roof:'flat', door:'E', interior:'shrine', name:'Paraclisul din Stâncă', windows:false, porch:false, chimney:false, plinth:false, timberFrame:false, lore:{key:'paraclis_stanca', icon:'🕯', sub:'Chapel cut in the rock', story:'Icons painted straight onto the stone; the candle soot of two hundred years on the ceiling.'}});
  buildBuilding({x:X+44, z:Z+2, w:10, d:8, h:4, wall:0x7d7669, roofCol:0x6f6a62, roof:'flat', door:'W', interior:'hall', name:'Casa Bătrânilor', windows:true, porch:false, chimney:true, plinth:false, timberFrame:false});
  var dw=[[-40,24,'N'],[-30,-24,'S'],[0,24,'N'],[12,-26,'S'],[40,24,'N'],[36,-24,'S'],[-12,-26,'S'],[26,24,'N']];
  for(i=0;i<dw.length;i++){ var d=dw[i]; if(!aFree(X+d[0],Z+d[1],4.2)) continue; buildBuilding({x:X+d[0], z:Z+d[1], w:6, d:5, h:2.9, wall:0x7d7669, roofCol:0x5a554e, roof:'flat', door:d[2], interior:'cavehouse', name:'Locuința '+(i+1), windows:false, porch:false, chimney:i%2===0, plinth:false, timberFrame:false, lamp:true}); }
  buildBuilding({x:X-8, z:Z-34, w:8, d:5, h:3, wall:0x7d7669, roofCol:0x5a554e, roof:'flat', door:'N', interior:'store', name:'Cămara Satului', windows:false, porch:false, chimney:false, plinth:false, timberFrame:false});
  /* light: braziers along the walls, torches at the mouth, a lantern chain across the plaza */
  for(i=0;i<6;i++){ propBrazier(X-50+i*20, Z+HD-8, i%2===0); }
  for(i=0;i<4;i++){ torchPost(X-36+i*24, Z-HD+8, 3.0); }
  for(i=0;i<5;i++){ regLight(X-24+i*12, gy+6, Z, 0xff9a3c, 0.8, 14, 1); kit.box(M2(0x50565e),0.3,0.4,0.3, X-24+i*12, gy+6, Z); }
  kit.box(M2(0x3a3430),0.06,0.06,52, X, gy+6.3, Z-2, 0, 0, Math.PI/2);
  /* the lane arrives from the north: a flagged path into the mouth */
  townStreet(X, Z-HD-40, X, Z-10, 5, 0x6f6a62);
  lmLoreAt(s,'🏔','Village under the rock','A whole village in one rock hall: three chambers, a spring, a chapel and the elders\' house, lit day and night by braziers. Smoke goes out through the vents in the ceiling.', 100);
};

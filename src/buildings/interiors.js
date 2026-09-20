/* ============================================================
   interiors.js — buildBuilding: shell + colliders + a furnished
   interior for every named building type of the world.
   Interiors are written in the building's local frame:
   x across the door wall, z toward the door (+z), y = floor.
   ------------------------------------------------------------
   o = {x,z,w,d,h,wall,roofCol,roof,door:'S'|'N'|'E'|'W',interior,
        name,lore:{icon,sub,story},backDoor,fac,...structShell opts}
   ============================================================ */
var INTERIORS={};
function addInterior(names,fn){ names.split(' ').forEach(function(n){ INTERIORS[n]=fn; }); }
/* facing helpers: ry so a piece's +z faces into the room from a wall */
var FACE={back:0, front:Math.PI, left:Math.PI/2, right:-Math.PI/2};

function buildBuilding(o){
  BUILD_COUNT++;
  var cx=o.x, cz=o.z, w=o.w, d=o.d;
  if(o.deferFlush===undefined) o.deferFlush=true;
  var r=structShell(o);
  var kit=r.kit, y=r.y0+0.22;
  wallColliders(cx,cz,w,d,o.h,o.door||'S',r.doorW+0.5,o.backDoor);
  var hw=w/2-0.34, hd=d/2-0.34, F=fmats();
  var fn=INTERIORS[o.interior||'house']||INTERIORS.house;
  fn(kit,o,y,cx,cz,hw,hd,F,r);
  /* a lamp by the door inside every building */
  var lw=kit.toWorld(cx+Math.min(hw-0.3,1.4), cz+hd-0.05);
  if(o.lamp!==false) wallTorch(lw.x, y+2.1, lw.z);
  kit.frame(0,0,0);
  if(r.own) kit.flush(o.parent||PROP_PARENT||scene);
  var hh=shellHalf(o), dp=doorPoint(o,0.8);
  var S=regStructure({name:o.name||o.interior||'house', kind:o.interior||'house', x:cx, z:cz, hx:hh.hx, hz:hh.hz, door:dp, back:o.backDoor?{x:2*cx-dp.x, z:2*cz-dp.z}:null, dw:r.doorW, enterable:true, fac:o.fac||null});
  if(o.lore){
    registerLore({key:o.lore.key||('b'+STRUCTURES.length), x:dp.x, z:dp.z, r:o.lore.r||Math.max(14,Math.max(w,d)*0.8), icon:o.lore.icon||'🏠',
      name:o.lore.name||o.name||'', sub:o.lore.sub||'', story:o.lore.story||''});
  }
  return S;
}

/* ---------- dwellings ---------- */
addInterior('house cottage', function(kit,o,y,cx,cz,hw,hd,F){
  fHearth(kit,cx-hw*0.3,y,cz-hd+0.3,FACE.back,false);
  var tx=cx-Math.max(hw*0.45,1.6); fTable(kit,tx,y,cz+hd*0.15,1.5,0.9,0); fBench(kit,tx,y,cz+hd*0.15+0.75,1.4,0); fStool(kit,tx-1.05,y,cz+hd*0.15);
  fBed(kit,cx+hw-0.65,y,cz-hd+1.3,0,{}); fChest(kit,cx+hw-0.7,y,cz+hd-0.9,0);
  fShelf(kit,cx+hw*0.55,y,cz-hd+0.25,1.6,FACE.back,'bread');
  fIcon(kit,cx+hw-0.2,y+1.9,cz-hd+0.6,FACE.right,false); fCandle(kit,cx+hw-0.4,y+1.5,cz-hd+0.6);
  fHerbs(kit,cx-hw+0.3,y+2.2,cz+hd*0.5,3,FACE.right);
  if(hw>3.4){ fBarrel(kit,cx-hw+0.5,y,cz+hd-0.6); fSack(kit,cx-hw+1.2,y,cz+hd-0.5); }
});
addInterior('loghouse', function(kit,o,y,cx,cz,hw,hd,F){
  fHearth(kit,cx,y,cz-hd+0.3,FACE.back,false);
  fBunk(kit,cx-hw+0.6,y,cz-hd+1.3,Math.PI/2); fBed(kit,cx+hw-0.65,y,cz-hd+1.3,0,{fur:true});
  var tx=cx-Math.max(hw*0.45,1.5); fTable(kit,tx,y,cz+hd*0.2,1.6,0.9,0); fBench(kit,tx,y,cz+hd*0.2+0.75,1.4,0); fBench(kit,tx,y,cz+hd*0.2-0.75,1.4,0);
  kit.box(F.fur,1.6,0.04,1.1,cx,y+0.02,cz-hd*0.3);
  fRack(kit,cx-hw+0.25,y,cz+hd-1.6,FACE.left,'axe'); fMeat(kit,cx+hw*0.5,y+2.3,cz+hd-0.5,3,0);
  fChest(kit,cx+hw-0.7,y,cz+hd-0.8,0);
});
addInterior('hall longhouse', function(kit,o,y,cx,cz,hw,hd,F){
  fCarpet(kit,cx,y,cz,1.8,hd*1.6,0,F.velvet);
  fThrone(kit,cx,y,cz-hd+1.4,FACE.back);
  fTable(kit,cx,y,cz-hd*0.05,Math.min(hw*1.2,5.5),1.1,0); fBench(kit,cx,y,cz-hd*0.05+0.85,Math.min(hw*1.1,5),0); fBench(kit,cx,y,cz-hd*0.05-0.85,Math.min(hw*1.1,5),0);
  fBrazier(kit,cx-hw*0.7,y,cz-hd*0.3,true); fBrazier(kit,cx+hw*0.7,y,cz-hd*0.3,true);
  fRack(kit,cx-hw+0.25,y,cz-hd+1.2,FACE.left,'shield'); fRack(kit,cx+hw-0.25,y,cz-hd+1.2,FACE.right,'spear');
  fBanner(kit,cx-hw*0.5,y+3.2,cz-hd+0.3,0,F.red); fBanner(kit,cx+hw*0.5,y+3.2,cz-hd+0.3,0,F.blue);
  fChest(kit,cx+hw-0.7,y,cz+hd-1.0,0); fBarrel(kit,cx-hw+0.5,y,cz+hd-0.7); fBarrel(kit,cx-hw+1.3,y,cz+hd-0.6);
});
addInterior('townhall council', function(kit,o,y,cx,cz,hw,hd,F){
  fCarpet(kit,cx,y,cz-hd*0.1,Math.min(hw*1.1,6),Math.min(hd*1.1,7),0,F.velvet);
  fTable(kit,cx,y,cz-hd*0.15,Math.min(hw*1.3,6),2.0,0,F.green);
  for(var i=-2;i<=2;i++){ fChair(kit,cx+i*1.2,y,cz-hd*0.15-1.4,0,true); fChair(kit,cx+i*1.2,y,cz-hd*0.15+1.4,Math.PI,false); }
  fChair(kit,cx,y,cz-hd+1.2,0,true); kit.box(F.gold,0.3,0.05,0.3,cx,y+0.86,cz-hd*0.15);
  fShelf(kit,cx-hw+0.25,y,cz-hd*0.3,3.0,FACE.left,'scrolls',true); fShelf(kit,cx+hw-0.25,y,cz-hd*0.3,3.0,FACE.right,'books',true);
  fHearth(kit,cx+hw-0.3,y,cz+hd*0.5,FACE.right,false);
  fChest(kit,cx-hw+0.7,y,cz+hd-0.9,0); fLectern(kit,cx-hw*0.5,y,cz+hd-1.4,Math.PI);
  fBanner(kit,cx,y+3.4,cz-hd+0.25,0,F.red); fCandelabra(kit,cx-hw*0.6,y,cz-hd+0.6); fCandelabra(kit,cx+hw*0.6,y,cz-hd+0.6);
});
addInterior('barracks guardhouse', function(kit,o,y,cx,cz,hw,hd,F){
  var n=Math.max(2,Math.floor((hd*2-2)/2.4)), i;
  for(i=0;i<n;i++){ var z=cz-hd+1.3+i*2.4; if(z>cz+hd-1.6) break; fBunk(kit,cx-hw+0.6,y,z,Math.PI/2); fBunk(kit,cx+hw-0.6,y,z,Math.PI/2); }
  fRack(kit,cx-1.2,y,cz-hd+0.25,FACE.back,'spear'); fRack(kit,cx+0.6,y,cz-hd+0.25,FACE.back,'shield');
  fTable(kit,cx,y,cz+hd*0.2,2.0,1.0,0); fBench(kit,cx,y,cz+hd*0.2+0.8,1.8,0); fBench(kit,cx,y,cz+hd*0.2-0.8,1.8,0);
  fBrazier(kit,cx,y,cz-hd*0.35,false); fChest(kit,cx+hw-1.0,y,cz+hd-0.8,0); fCrate(kit,cx-hw+0.9,y,cz+hd-0.8,0.8);
  if(o.interior==='guardhouse'){ fBars(kit,cx+hw-2.2,cz+hd-2.6,cx+hw-0.05,cz+hd-2.6,y,2.4,0.9); fBars(kit,cx+hw-2.2,cz+hd-2.6,cx+hw-2.2,cz+hd,y,2.4,0); }
});
addInterior('church chapel temple', function(kit,o,y,cx,cz,hw,hd,F){
  fCarpet(kit,cx,y,cz+hd*0.15,1.6,hd*1.5,0,F.velvet);
  fIconostasis(kit,cx,y,cz-hd+1.1,Math.min(hw*2-0.4,9),0);
  fAltar(kit,cx,y,cz-hd+0.5,0);
  fCandelabra(kit,cx-hw*0.55,y,cz-hd+2.0); fCandelabra(kit,cx+hw*0.55,y,cz-hd+2.0);
  fLectern(kit,cx+0.9,y,cz-hd+2.3,0);
  var rows=Math.max(2,Math.floor((hd*2-4.5)/1.5)), i;
  for(i=0;i<rows;i++){ var z=cz-hd+3.4+i*1.5; if(z>cz+hd-1.6) break; fBench(kit,cx-hw*0.5,y,z,Math.min(hw*0.85,3.4),0); fBench(kit,cx+hw*0.5,y,z,Math.min(hw*0.85,3.4),0); }
  for(i=0;i<3;i++){ fIcon(kit,cx-hw+0.15,y+1.8,cz-hd+2.5+i*2.2,FACE.left,true); fIcon(kit,cx+hw-0.15,y+1.8,cz-hd+2.5+i*2.2,FACE.right,true); }
  fFont(kit,cx-hw+1.0,y,cz+hd-1.2);
  fShelf(kit,cx+hw-0.25,y,cz+hd-1.4,1.4,FACE.right,'candles');
});
addInterior('cathedral', function(kit,o,y,cx,cz,hw,hd,F){
  fCarpet(kit,cx,y,cz+hd*0.1,2.4,hd*1.6,0,F.velvet);
  fIconostasis(kit,cx,y,cz-hd+1.4,Math.min(hw*2-0.6,14),0);
  fAltar(kit,cx,y,cz-hd+0.6,0);
  var i, cols=Math.floor((hd*2-4)/4.5);
  for(i=0;i<cols;i++){ var z=cz-hd+3.5+i*4.5; fPillar(kit,cx-hw*0.5,y,z,o.h-0.4,0.45,F.marble); fPillar(kit,cx+hw*0.5,y,z,o.h-0.4,0.45,F.marble); }
  fCandelabra(kit,cx-hw*0.25,y,cz-hd+2.6); fCandelabra(kit,cx+hw*0.25,y,cz-hd+2.6); fCandelabra(kit,cx-hw*0.8,y,cz); fCandelabra(kit,cx+hw*0.8,y,cz);
  var rows=Math.floor((hd*2-6)/1.6);
  for(i=0;i<rows;i++){ var bz=cz-hd+4.2+i*1.6; if(bz>cz+hd-2.4) break; fBench(kit,cx-hw*0.25,y,bz,Math.min(hw*0.4,3.2),0); fBench(kit,cx+hw*0.25,y,bz,Math.min(hw*0.4,3.2),0); }
  for(i=0;i<4;i++){ fIcon(kit,cx-hw+0.15,y+2.2,cz-hd+3+i*3.2,FACE.left,true); fIcon(kit,cx+hw-0.15,y+2.2,cz-hd+3+i*3.2,FACE.right,true); }
  fLectern(kit,cx+1.4,y,cz-hd+3.0,0); fFont(kit,cx-hw+1.2,y,cz+hd-1.6);
  /* crypt stair in the corner: rail and dark well */
  kit.box(F.black,2.2,0.05,3.0,cx+hw-1.4,y+0.01,cz+hd-2.2); fBars(kit,cx+hw-2.5,cz+hd-3.7,cx+hw-2.5,cz+hd-0.7,y,1.1,0); fBars(kit,cx+hw-2.5,cz+hd-3.7,cx+hw-0.1,cz+hd-3.7,y,1.1,0);
  for(i=0;i<6;i++) kit.box(F.stone2,2.0,0.2,0.45,cx+hw-1.4,y-0.2-i*0.2,cz+hd-1.0-i*0.45);
  /* bell rope */
  kit.cyln(F.straw,0.02,0.02,o.h-1.2,4,cx-hw+1.0,y+(o.h-1.2)/2+0.8,cz+hd-1.0);
  fRelicCase(kit,cx-hw*0.5,y,cz-hd+2.4);
});
addInterior('cells', function(kit,o,y,cx,cz,hw,hd,F){
  var n=Math.floor((hd*2-1)/2.6), i;
  for(i=0;i<n;i++){
    var z0=cz-hd+i*2.6, z1=z0+2.6;
    if(i>0) fWall(kit,M2(o.wall),cx-hw,z0,cx-1.0,z0,y,o.h-0.6,0);
    fBed(kit,cx-hw+0.6,y,z0+1.3,Math.PI/2,{len:1.9,wide:0.8}); fCandle(kit,cx-1.5,y+0.8,z0+0.4); kit.box(F.dark,0.5,0.8,0.4,cx-1.5,y+0.4,z0+0.4);
    fIcon(kit,cx-hw+0.1,y+1.6,z0+1.3,FACE.left,false);
  }
  fWall(kit,M2(o.wall),cx-1.0,cz-hd,cx-1.0,cz+hd,y,o.h-0.6,0);
  for(i=0;i<n;i++){ var zz=cz-hd+i*2.6; fBars(kit,cx-1.0,zz+0.3,cx-1.0,zz+2.3,y,2.2,1.0); }
  fShelf(kit,cx+hw-0.25,y,cz-hd*0.5,2.4,FACE.right,'books'); fTable(kit,cx+hw*0.4,y,cz+hd*0.4,1.6,0.9,0); fStool(kit,cx+hw*0.4,y,cz+hd*0.4+0.7);
  fCandelabra(kit,cx+hw*0.4,y,cz-hd+0.8);
});
addInterior('library archive scribe school', function(kit,o,y,cx,cz,hw,hd,F){
  var tall=o.interior!=='school', fill=o.interior==='archive'?'scrolls':'books', i;
  fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-0.6,8),FACE.back,fill,tall);
  var n=Math.floor((hd*2-3)/2.4);
  for(i=0;i<n;i++){ var z=cz-hd+2.2+i*2.4; fShelf(kit,cx-hw+0.25,y,z,2.0,FACE.left,fill,tall); fShelf(kit,cx+hw-0.25,y,z,2.0,FACE.right,i%2?'scrolls':'books',tall); }
  if(o.interior==='school'||o.interior==='scribe'){
    for(i=0;i<Math.floor(hd*2/2.2)-1;i++){ var dz=cz-hd+2.6+i*2.2; if(dz>cz+hd-1.6) break; fDesk(kit,cx-1.4,y,dz,Math.PI); fDesk(kit,cx+1.4,y,dz,Math.PI); }
    fLectern(kit,cx,y,cz-hd+1.4,0); fShelf(kit,cx-hw+1.6,y,cz-hd+0.25,1.4,FACE.back,'candles');
  } else {
    fTable(kit,cx,y,cz+hd*0.1,3.2,1.4,0,F.green); fChair(kit,cx-0.8,y,cz+hd*0.1+1.1,Math.PI,false); fChair(kit,cx+0.8,y,cz+hd*0.1-1.1,0,false);
    kit.box(F.paper,0.6,0.02,0.4,cx-0.6,y+0.87,cz+hd*0.1); kit.box(F.red,0.3,0.1,0.22,cx+0.7,y+0.9,cz+hd*0.1+0.2);
    fCandelabra(kit,cx-hw*0.5,y,cz-hd+1.4); fCandelabra(kit,cx+hw*0.5,y,cz-hd+1.4); fLectern(kit,cx,y,cz-hd+1.5,0);
    if(o.interior==='archive') fRelicCase(kit,cx+hw*0.5,y,cz+hd-1.6);
  }
  fCandle(kit,cx-hw+0.6,y+1.2,cz+hd-1.0,true);
});
addInterior('candles', function(kit,o,y,cx,cz,hw,hd,F){
  fTub(kit,cx-hw*0.5,y,cz-hd*0.4,true); fTub(kit,cx+hw*0.5,y,cz-hd*0.4,true); kit.cyln(F.candle,0.45,0.45,0.05,10,cx-hw*0.5,y+0.73,cz-hd*0.4); kit.cyln(F.candle,0.45,0.45,0.05,10,cx+hw*0.5,y+0.73,cz-hd*0.4);
  fStove(kit,cx,y,cz-hd+0.7,FACE.back);
  fTable(kit,cx,y,cz+hd*0.3,2.6,1.0,0); for(var i=0;i<8;i++) kit.cyln(F.candle,0.03,0.035,0.28,5,cx-1.0+i*0.28,y+1.0,cz+hd*0.3+(i%2?0.2:-0.2));
  for(i=0;i<3;i++){ kit.box(F.dark,hw*1.6,0.05,0.05,cx,y+2.4,cz-hd+1.6+i*1.2); for(var j=0;j<Math.floor(hw*1.6/0.35);j++) kit.cyln(F.candle,0.03,0.035,0.3,5,cx-hw*0.8+0.2+j*0.35,y+2.2,cz-hd+1.6+i*1.2); }
  fShelf(kit,cx-hw+0.25,y,cz+hd*0.2,2.4,FACE.left,'candles'); fShelf(kit,cx+hw-0.25,y,cz+hd*0.2,2.4,FACE.right,'jars');
});
addInterior('refectory kitchen', function(kit,o,y,cx,cz,hw,hd,F){
  fHearth(kit,cx,y,cz-hd+0.3,FACE.back,true);
  kit.cyln(F.copper,0.35,0.3,0.4,9,cx-0.9,y+0.7,cz-hd+1.0); kit.cyln(F.copper,0.28,0.24,0.34,9,cx+0.9,y+0.6,cz-hd+1.0);
  fTable(kit,cx,y,cz+hd*0.05,Math.min(hw*1.4,6),1.2,0); fBench(kit,cx,y,cz+hd*0.05+0.9,Math.min(hw*1.3,5.5),0); fBench(kit,cx,y,cz+hd*0.05-0.9,Math.min(hw*1.3,5.5),0);
  for(var i=0;i<5;i++){ kit.cyln(F.bread,0.14,0.12,0.14,7,cx-1.6+i*0.8,y+0.92,cz+hd*0.05); kit.cyln(F.copper,0.1,0.08,0.12,7,cx-1.2+i*0.8,y+0.92,cz+hd*0.05+0.35); }
  fMeat(kit,cx-hw*0.6,y+2.5,cz-hd+1.2,4,0); fMeat(kit,cx+hw*0.6,y+2.5,cz-hd+1.2,4,0);
  fShelf(kit,cx-hw+0.25,y,cz+hd*0.3,2.6,FACE.left,'bread'); fShelf(kit,cx+hw-0.25,y,cz+hd*0.3,2.6,FACE.right,'jars');
  fBarrel(kit,cx-hw+0.6,y,cz+hd-0.7); fBarrel(kit,cx-hw+1.4,y,cz+hd-0.6,true); fSack(kit,cx+hw-0.7,y,cz+hd-0.8); fSack(kit,cx+hw-1.4,y,cz+hd-0.6,F.hay);
  fCrate(kit,cx+hw-0.9,y,cz-hd+0.9,0.8);
});
addInterior('tavern inn', function(kit,o,y,cx,cz,hw,hd,F){
  fCounter(kit,cx+hw-1.5,y,cz-hd*0.25,Math.min(hd*1.1,5),Math.PI/2);
  fBarrel(kit,cx+hw-0.5,y,cz-hd+0.6,true); fBarrel(kit,cx+hw-0.5,y,cz-hd+1.6,true); fBarrel(kit,cx+hw-0.5,y,cz-hd+2.6,true);
  fShelf(kit,cx+hw-0.25,y,cz+hd*0.3,2.0,FACE.right,'jars');
  fHearth(kit,cx-hw*0.4,y,cz-hd+0.3,FACE.back,true); fMeat(kit,cx+hw*0.2,y+2.5,cz-hd+0.6,3,0);
  var i, n=Math.floor((hd*2-3)/2.6);
  for(i=0;i<n;i++){ var z=cz-hd+2.6+i*2.6; if(z>cz+hd-1.6) break; fTable(kit,cx-hw*0.45,y,z,1.5,1.0,0.1*i); fStool(kit,cx-hw*0.45-1.0,y,z); fStool(kit,cx-hw*0.45+1.0,y,z); fStool(kit,cx-hw*0.45,y,z-0.9); }
  if(hw>3.2){ fTable(kit,cx+hw*0.5,y,cz+hd-1.6,1.4,0.9,0.3); fStool(kit,cx+hw*0.5+0.9,y,cz+hd-1.6); fStool(kit,cx+hw*0.5-0.9,y,cz+hd-1.6); }
  fLadder(kit,cx-hw+0.4,y,cz+hd-0.7,o.h-0.5,0);
  for(i=0;i<3;i++) kit.cyln(F.copper,0.09,0.08,0.14,7,cx+hw-1.5+(i-1)*0.4,y+1.1,cz-hd*0.25);
  if(o.interior==='inn'){ fWall(kit,M2(o.wall),cx-hw,cz+hd*0.35,cx-1.6,cz+hd*0.35,y,o.h-0.4,0); fBed(kit,cx-hw+0.7,y,cz+hd*0.35+1.3,Math.PI/2,{}); fBed(kit,cx-hw+2.4,y,cz+hd*0.35+1.3,Math.PI/2,{}); fChest(kit,cx-hw+3.6,y,cz+hd-0.6,0); }
  kit.box(F.dark,1.4,0.06,0.9,cx-hw*0.45,y+0.001,cz+hd*0.05);
});
addInterior('forge smithy armorer', function(kit,o,y,cx,cz,hw,hd,F,r){
  fForge(kit,cx-hw*0.35,y,cz-hd+0.8,FACE.back);
  fAnvil(kit,cx+0.3,y,cz-hd*0.15,0.3); fQuench(kit,cx+hw*0.6,y,cz-hd*0.2);
  fRack(kit,cx+hw-0.25,y,cz-hd+1.4,FACE.right,'sword'); fRack(kit,cx+hw-0.25,y,cz-hd+3.2,FACE.right,'axe'); fRack(kit,cx-hw+0.25,y,cz+hd*0.3,FACE.left,'spear');
  fTable(kit,cx-hw*0.4,y,cz+hd*0.4,1.8,0.9,0); kit.box(F.steel,0.5,0.04,0.12,cx-hw*0.4,y+0.87,cz+hd*0.4,0.3); kit.box(F.iron,0.3,0.1,0.1,cx-hw*0.4+0.5,y+0.9,cz+hd*0.4);
  fCrate(kit,cx+hw-0.8,y,cz+hd-0.8,0.8); fBarrel(kit,cx+hw-1.7,y,cz+hd-0.6); fSack(kit,cx-hw+0.6,y,cz-hd+0.6,F.ash);
  if(o.interior==='armorer'){ fArmorStand(kit,cx-hw+0.8,y,cz-hd+1.2); fArmorStand(kit,cx-hw+0.8,y,cz-hd+2.4); fShelf(kit,cx+hw-0.25,y,cz+hd*0.3,1.8,FACE.right,'armor'); }
  /* the smith's hammer: a real moving part */
  var wpos=kit.toWorld(cx+0.3,cz-hd*0.15-0.6), gy=y;
  var g=new THREE.Group(); g.position.set(wpos.x,gy+1.05,wpos.z); g.rotation.y=r.ang;
  var handle=box(0.05,0.05,0.8,M(0x5d4326),0,0,0.4); g.add(handle); var head=box(0.16,0.14,0.22,M(0x50565e),0,0,0.82); g.add(head);
  propAdd(g);
  ANIM_PARTS.push({kind:'hammer', g:g, x:wpos.x, z:wpos.z, y:gy+0.85, ph:Math.random()*3, anvil:kit.toWorld(cx+0.3,cz-hd*0.15)});
});
addInterior('watermill mill', function(kit,o,y,cx,cz,hw,hd,F,r){
  fMillstone(kit,cx,y,cz-hd*0.25);
  for(var i=0;i<5;i++) fSack(kit,cx-hw+0.5+(i%3)*0.7,y,cz+hd-0.6-Math.floor(i/3)*0.7,F.straw);
  fShelf(kit,cx+hw-0.25,y,cz+hd*0.2,2.2,FACE.right,'bread'); fCrate(kit,cx+hw-0.8,y,cz-hd+0.8,0.8); fTable(kit,cx-hw*0.5,y,cz-hd+1.0,1.6,0.8,0);
  kit.box(F.oak,0.3,0.3,hw*2-0.4,cx-hw*0.5,y+3.0,cz); kit.cyln(F.dark,0.12,0.12,hw*2,8,cx,y+2.2,cz-hd*0.25,0,0,Math.PI/2);
  /* the wheel outside, on the wheel side (local -x unless o.wheelSide==='R') */
  var side=o.wheelSide==='R'?1:-1, wx=cx+side*(hw+0.34+1.2), wz=cz-hd*0.25;
  var ww=kit.toWorld(wx,wz), wy=groundH(ww.x,ww.z);
  var g=new THREE.Group(); g.position.set(ww.x,wy+2.0,ww.z); g.rotation.y=r.ang;
  var axle=new THREE.Group(); axle.rotation.z=Math.PI/2; g.add(axle);
  var wheel=new THREE.Group(); axle.add(wheel);
  var rim=cyl(2.0,2.0,0.2,M(0x5d4326),16); wheel.add(rim);
  var rim2=cyl(2.0,2.0,0.2,M(0x5d4326),16); rim2.position.y=0.9; wheel.add(rim2);
  for(i=0;i<10;i++){ var a=i/10*TAU; var pad=box(0.5,1.1,0.12,M(0x7a5c39),Math.cos(a)*1.8,0.45,Math.sin(a)*1.8); pad.rotation.y=-a; wheel.add(pad); }
  wheel.position.y=-0.45;
  propAdd(g);
  ANIM_PARTS.push({kind:'spin', g:wheel, axis:'y', rate:0.8, x:ww.x, z:ww.z, splash:{x:ww.x,y:wy+0.2,z:ww.z}});
  kit.box(F.dark,0.3,0.3,1.4,cx+side*(hw+0.34+0.6),y+1.8,wz); addCollider(ww.x-2.2,ww.z-1.0,ww.x+2.2,ww.z+1.0);
});
addInterior('hunter lodge', function(kit,o,y,cx,cz,hw,hd,F){
  fHearth(kit,cx,y,cz-hd+0.3,FACE.back,o.interior==='lodge');
  fBed(kit,cx-hw+0.65,y,cz-hd+1.4,0,{fur:true}); if(o.interior==='lodge'){ fBed(kit,cx+hw-0.65,y,cz-hd+1.4,0,{fur:true}); fBunk(kit,cx-hw+0.6,y,cz+hd*0.4,Math.PI/2); }
  fRack(kit,cx+hw-0.25,y,cz-hd+1.6,FACE.right,'bow'); fRack(kit,cx+hw-0.25,y,cz+hd*0.3,FACE.right,'spear');
  fMeat(kit,cx-hw*0.4,y+2.4,cz+hd*0.1,4,0); kit.box(F.fur,1.2,0.05,0.8,cx-hw+0.3,y+1.5,cz+hd*0.5,0,0,Math.PI/2);
  kit.box(F.fur,1.8,0.04,1.2,cx,y+0.02,cz+hd*0.1);
  var tx=cx-Math.max(hw*0.5,1.6), tw=o.interior==='lodge'?Math.min(3.4,hw*0.8):1.6; fTable(kit,tx,y,cz+hd*0.3,tw,1.0,0); fBench(kit,tx,y,cz+hd*0.3+0.8,tw-0.2,0);
  /* antlers over the hearth */
  kit.box(F.bone,0.05,0.5,0.05,cx-0.3,y+3.2,cz-hd+0.4,0,0,0.5); kit.box(F.bone,0.05,0.5,0.05,cx+0.3,y+3.2,cz-hd+0.4,0,0,-0.5); kit.box(F.bone,0.05,0.3,0.05,cx-0.45,y+3.5,cz-hd+0.4,0,0,-0.4); kit.box(F.bone,0.05,0.3,0.05,cx+0.45,y+3.5,cz-hd+0.4,0,0,0.4);
  fChest(kit,cx+hw-0.7,y,cz+hd-0.9,0);
});
addInterior('bathhouse', function(kit,o,y,cx,cz,hw,hd,F){
  fStove(kit,cx-hw+0.8,y,cz-hd+0.7,FACE.right);
  fTub(kit,cx+hw*0.4,y,cz-hd+1.4,true); fTub(kit,cx+hw*0.4,y,cz-hd+3.4,true); fTub(kit,cx-hw*0.3,y,cz+hd*0.3,true);
  fBench(kit,cx-hw+0.5,y,cz+hd*0.2,Math.min(hd*1.2,3.2),Math.PI/2); fBench(kit,cx+hw-0.5,y,cz+hd*0.5,2.0,Math.PI/2);
  fBarrel(kit,cx-hw+0.5,y,cz-hd+2.4); fBarrel(kit,cx-hw+1.3,y,cz-hd+2.2);
  for(var i=0;i<4;i++) kit.box(F.linen,0.5,0.06,0.3,cx+hw-0.4,y+1.6,cz-hd+0.6+i*0.6);
  kit.box(F.stone,hw*2,0.03,hd*2,cx,y+0.005,cz);
});
addInterior('grandhall throne', function(kit,o,y,cx,cz,hw,hd,F){
  fCarpet(kit,cx,y,cz+hd*0.1,2.6,hd*1.7,0,F.velvet);
  kit.box(F.stone,hw*1.6,0.3,3.0,cx,y+0.15,cz-hd+1.7); kit.box(F.stone,hw*1.8,0.15,3.6,cx,y+0.07,cz-hd+2.0);
  fThrone(kit,cx-(o.interior==='throne'?0.9:0),y+0.3,cz-hd+1.4,FACE.back); if(o.interior==='throne') fThrone(kit,cx+0.9,y+0.3,cz-hd+1.4,FACE.back);
  var i, cols=Math.max(1,Math.floor((hd*2-5)/4.5));
  for(i=0;i<cols;i++){ var z=cz-hd+4.5+i*4.5; fPillar(kit,cx-hw*0.62,y,z,o.h-0.4,0.42,F.stone); fPillar(kit,cx+hw*0.62,y,z,o.h-0.4,0.42,F.stone); fBanner(kit,cx-hw*0.62+0.55,y+3.8,z,0,i%2?F.red:F.blue); fBanner(kit,cx+hw*0.62-0.55,y+3.8,z,0,i%2?F.blue:F.red); }
  if(o.interior==='grandhall'){ fTable(kit,cx-hw*0.32,y,cz+hd*0.15,1.3,Math.min(hd*1.1,9),0); fTable(kit,cx+hw*0.32,y,cz+hd*0.15,1.3,Math.min(hd*1.1,9),0); fBench(kit,cx-hw*0.32-1.0,y,cz+hd*0.15,Math.min(hd,8),Math.PI/2); fBench(kit,cx+hw*0.32+1.0,y,cz+hd*0.15,Math.min(hd,8),Math.PI/2); }
  fBrazier(kit,cx-hw*0.85,y,cz-hd+1.2,true); fBrazier(kit,cx+hw*0.85,y,cz-hd+1.2,true); fCandelabra(kit,cx-2.4,y+0.3,cz-hd+1.0); fCandelabra(kit,cx+2.4,y+0.3,cz-hd+1.0);
  fHearth(kit,cx-hw+0.3,y,cz+hd*0.4,FACE.left,true); fRack(kit,cx+hw-0.25,y,cz+hd*0.5,FACE.right,'shield'); fChest(kit,cx+hw-0.8,y,cz+hd-1.0,0,o.interior==='throne');
});
addInterior('dungeon', function(kit,o,y,cx,cz,hw,hd,F){
  var i, n=Math.floor((hd*2-1)/2.8), W=M2(0x6f6a62);
  for(i=0;i<n;i++){
    var z0=cz-hd+i*2.8;
    if(i>0){ fWall(kit,W,cx-hw,z0,cx-1.4,z0,y,o.h-0.4,0); fWall(kit,W,cx+1.4,z0,cx+hw,z0,y,o.h-0.4,0); }
    fBars(kit,cx-1.4,z0+0.3,cx-1.4,z0+2.5,y,2.4,0.9); fBars(kit,cx+1.4,z0+0.3,cx+1.4,z0+2.5,y,2.4,0.9);
    kit.box(F.straw,1.2,0.12,0.9,cx-hw+0.8,y+0.06,z0+1.4); kit.box(F.straw,1.2,0.12,0.9,cx+hw-0.8,y+0.06,z0+1.4);
    kit.cyln(F.iron,0.02,0.02,0.9,4,cx-hw+0.1,y+1.4,z0+1.8,0,0,0.3); kit.cyln(F.iron,0.02,0.02,0.9,4,cx+hw-0.1,y+1.4,z0+1.0,0,0,-0.3);
    if(i%2) kit.cyln(F.bone,0.04,0.05,0.4,5,cx-hw+0.6,y+0.15,z0+0.8,0,0,Math.PI/2);
  }
  fTable(kit,cx,y,cz-hd+1.2,1.8,0.9,0); kit.box(F.iron,0.4,0.06,0.1,cx-0.4,y+0.88,cz-hd+1.2); kit.box(F.iron,0.5,0.05,0.05,cx+0.3,y+0.88,cz-hd+1.3,0.4);
  fBrazier(kit,cx-0.9,y,cz-hd+2.4,false); fBrazier(kit,cx+0.9,y,cz+hd-2.6,false);
  fChest(kit,cx-0.9,y,cz-hd+0.5,0); fBarrel(kit,cx+1.0,y,cz-hd+0.5);
});
addInterior('stable stables horsetrader', function(kit,o,y,cx,cz,hw,hd,F){
  var i, n=Math.floor((hd*2-2)/3.0);
  for(i=0;i<n;i++){ var z=cz-hd+1.6+i*3.0; fStall(kit,cx-hw+1.4,y,z,0); if(hw>3.4) fStall(kit,cx+hw-1.4,y,z,0); }
  kit.box(F.straw,hw*2-0.4,0.04,hd*2-0.4,cx,y+0.01,cz);
  fHay(kit,cx,y,cz-hd+1.2,1.2); fBarrel(kit,cx+hw-0.6,y,cz+hd-0.8,true); kit.cyln(F.water,0.4,0.4,0.03,9,cx+hw-0.6,y+1.08,cz+hd-0.8);
  for(i=0;i<3;i++){ kit.box(F.dark,0.5,0.25,0.9,cx+2.2+i*0.7,y+1.3,cz+hd-0.3); kit.box(F.dark,0.08,1.2,0.08,cx+2.2+i*0.7,y+0.6,cz+hd-0.3); }
  if(o.interior==='horsetrader'){ fCounter(kit,cx-hw*0.45,y,cz+hd-1.6,Math.min(2.4,hw*0.8),0); fChest(kit,cx+hw-0.8,y,cz+hd-0.8,0); }
});
addInterior('armory', function(kit,o,y,cx,cz,hw,hd,F){
  var i, n=Math.floor((hd*2-1.5)/1.8);
  for(i=0;i<n;i++){ var z=cz-hd+1.0+i*1.8; fRack(kit,cx-hw+0.25,y,z,FACE.left,['spear','sword','shield','axe','bow'][i%5]); fRack(kit,cx+hw-0.25,y,z,FACE.right,['sword','shield','spear','bow','axe'][i%5]); }
  for(i=0;i<Math.floor(hw*2/1.4)-1;i++) fArmorStand(kit,cx-hw+1.6+i*1.4,y,cz-hd+0.8);
  fTable(kit,cx,y,cz+hd*0.1,2.4,1.0,0); kit.box(F.steel,0.8,0.05,0.14,cx-0.4,y+0.88,cz+hd*0.1,0.2); kit.cyln(F.steel,0.3,0.3,0.05,10,cx+0.6,y+0.88,cz+hd*0.1);
  fCrate(kit,cx-hw+1.0,y,cz+hd-0.9,0.9); fCrate(kit,cx-hw+2.0,y,cz+hd-0.8,0.7); fBarrel(kit,cx+hw-1.0,y,cz+hd-0.8); fBrazier(kit,cx,y,cz-hd*0.5,false);
});
addInterior('herbalist', function(kit,o,y,cx,cz,hw,hd,F){
  fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-0.6,4.5),FACE.back,'jars',true);
  fShelf(kit,cx-hw+0.25,y,cz-hd*0.2,2.2,FACE.left,'jars'); fHerbs(kit,cx+hw*0.4,y+2.4,cz,5,0); fHerbs(kit,cx-hw*0.4,y+2.4,cz+hd*0.5,4,0);
  fTable(kit,cx+0.4,y,cz+hd*0.15,2.0,1.0,0); kit.cyln(F.stone,0.18,0.14,0.22,8,cx,y+0.96,cz+hd*0.15); kit.cyln(F.dark,0.03,0.03,0.4,5,cx+0.1,y+1.1,cz+hd*0.15,0,0,0.9); kit.box(F.herb,0.4,0.06,0.3,cx+0.9,y+0.88,cz+hd*0.15);
  fCauldron(kit,cx+hw-1.1,y,cz-hd+1.2); fBed(kit,cx-hw+0.65,y,cz+hd-1.4,0,{});
  fSack(kit,cx+hw-0.6,y,cz+hd-0.7,F.herb); fSack(kit,cx+hw-1.3,y,cz+hd-0.6,F.green);
});
addInterior('woodcutter', function(kit,o,y,cx,cz,hw,hd,F){
  for(var i=0;i<3;i++) for(var j=0;j<3-i;j++) kit.cyln(F.dark,0.24,0.24,2.2,7,cx-hw+0.5+j*0.5+i*0.25,y+0.24+i*0.42,cz-hd+1.2,0,0,Math.PI/2);
  kit.collider(cx-hw+0.1,cz-hd+0.1,cx-hw+2.2,cz-hd+2.4);
  fRack(kit,cx+hw-0.25,y,cz-hd+1.4,FACE.right,'axe'); fTable(kit,cx,y,cz+hd*0.2,2.0,0.9,0); kit.box(F.steel,1.4,0.04,0.12,cx,y+0.88,cz+hd*0.2,0.1); kit.box(F.dark,0.3,0.3,0.14,cx-0.8,y+0.98,cz+hd*0.2);
  kit.cyln(F.oak,0.4,0.4,0.6,9,cx+hw*0.5,y+0.3,cz-hd*0.3); kit.box(F.steel,0.1,0.5,0.05,cx+hw*0.5,y+0.75,cz-hd*0.3,0,0,0.6);
  fBed(kit,cx-hw+0.65,y,cz+hd-1.3,0,{fur:true}); fHearth(kit,cx+hw-0.3,y,cz+hd*0.5,FACE.right,false);
});
addInterior('smokehouse', function(kit,o,y,cx,cz,hw,hd,F){
  for(var i=0;i<3;i++) fMeat(kit,cx,y+2.4,cz-hd+0.9+i*1.1,Math.max(3,Math.floor(hw*2/0.5)),0);
  kit.box(F.stone,1.6,0.3,1.6,cx,y+0.15,cz-hd*0.4); kit.box(F.black,1.2,0.3,1.2,cx,y+0.35,cz-hd*0.4); fFlame(kit,cx,y+0.5,cz-hd*0.4,0.7,0.6,0xff9a3c,10);
  kit.collider(cx-0.8,cz-hd*0.4-0.8,cx+0.8,cz-hd*0.4+0.8);
  fBarrel(kit,cx-hw+0.5,y,cz+hd-0.6); fSack(kit,cx+hw-0.6,y,cz+hd-0.6,F.ash);
});
/* a yard shed: tools, a barrel, sacks and herbs — the smallest furnished room in the world */
addInterior('shed', function(kit,o,y,cx,cz,hw,hd,F){
  fBarrel(kit,cx-hw+0.45,y,cz-hd+0.45,false); fSack(kit,cx+hw-0.45,y,cz-hd+0.4,F.straw); fSack(kit,cx+hw-0.95,y,cz-hd+0.5,F.hay);
  fShelf(kit,cx-hw*0.2,y,cz-hd+0.2,Math.min(hw*1.4,2.2),FACE.back,'tools');
  fRack(kit,cx-hw+0.2,y,cz+hd*0.2,FACE.left,'axe'); fHerbs(kit,cx+hw*0.3,y+2.0,cz-hd*0.2,3,0);
  fCrate(kit,cx+hw-0.55,y,cz+hd-0.6,0.6);
});
addInterior('cellar', function(kit,o,y,cx,cz,hw,hd,F){
  var i;
  for(i=0;i<Math.floor((hd*2-1)/1.0);i++){ fBarrel(kit,cx-hw+0.5,y,cz-hd+0.6+i*1.0,true); if(hw>2.6) fBarrel(kit,cx+hw-0.5,y,cz-hd+0.6+i*1.0,i%2===0); }
  fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-2.6,4),FACE.back,'jars');
  for(i=0;i<4;i++){ kit.cyln(F.straw,0.35,0.28,0.3,8,cx-0.9+i*0.6,y+0.15,cz+hd*0.3); for(var j=0;j<3;j++) kit.cyln(F.bread,0.06,0.02,0.1,6,cx-0.9+i*0.6+(j-1)*0.15,y+0.36,cz+hd*0.3+(j%2)*0.1); }
  kit.box(F.straw,2.2,0.2,1.0,cx,y+0.1,cz+hd*0.3);
  fCrate(kit,cx+hw*0.5,y,cz+hd-0.8,0.7); fSack(kit,cx-hw*0.5,y,cz+hd-0.7,F.straw);
});
addInterior('tradepost shop butcher tailor spice bookseller', function(kit,o,y,cx,cz,hw,hd,F){
  var t=o.interior;
  fCounter(kit,cx,y,cz-hd*0.15,Math.min(hw*1.5,5),0);
  if(t==='butcher'){ fMeat(kit,cx,y+2.4,cz-hd+0.7,Math.max(3,Math.floor(hw*1.6/0.45)),0); kit.cyln(F.oak,0.45,0.45,0.9,9,cx+hw*0.5,y+0.45,cz+hd*0.4); kit.box(F.steel,0.5,0.04,0.1,cx+hw*0.5,y+0.93,cz+hd*0.4,0.4); kit.box(F.meat,0.4,0.12,0.3,cx-0.5,y+1.1,cz-hd*0.15); kit.collider(cx+hw*0.5-0.45,cz+hd*0.4-0.45,cx+hw*0.5+0.45,cz+hd*0.4+0.45); fBarrel(kit,cx-hw+0.5,y,cz-hd+0.6); }
  else if(t==='tailor'){ fLoom(kit,cx-hw+1.0,y,cz-hd+1.0,0); fShelf(kit,cx+hw-0.25,y,cz-hd*0.2,2.4,FACE.right,'cloth'); fArmorStand(kit,cx+hw*0.5,y,cz+hd*0.5); kit.box(F.cloth1,0.5,0.7,0.34,cx+hw*0.5,y+1.3,cz+hd*0.5); for(var i=0;i<4;i++) kit.cyln([F.cloth1,F.cloth2,F.cloth3,F.linen][i],0.1,0.1,1.4,7,cx-hw+0.4+i*0.24,y+0.7,cz+hd-0.5); kit.box(F.cloth2,0.5,0.06,0.4,cx+0.4,y+1.1,cz-hd*0.15); }
  else if(t==='spice'){ fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-0.6,4.5),FACE.back,'spice',true); for(var s=0;s<5;s++) fSack(kit,cx-hw+0.5+s*0.55,y,cz+hd-0.6,[F.spice,F.spice2,F.herb,F.copper,F.straw][s]); fScale(kit,cx-0.6,y+1.08,cz-hd*0.15); kit.cyln(F.spice,0.14,0.14,0.2,8,cx+0.6,y+1.18,cz-hd*0.15); kit.cyln(F.spice2,0.14,0.14,0.2,8,cx+1.0,y+1.18,cz-hd*0.15); }
  else if(t==='bookseller'){ fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-0.6,4.5),FACE.back,'books',true); fShelf(kit,cx-hw+0.25,y,cz+hd*0.2,2.2,FACE.left,'books',true); fLectern(kit,cx+hw*0.5,y,cz+hd*0.4,Math.PI); for(var b=0;b<4;b++) kit.box([F.red,F.blue,F.green,F.purple][b],0.3,0.06,0.22,cx-0.9+b*0.6,y+1.11,cz-hd*0.15); fCandle(kit,cx+1.2,y+1.08,cz-hd*0.15); }
  else { /* tradepost */ fShelf(kit,cx,y,cz-hd+0.25,Math.min(hw*2-0.6,6),FACE.back,'cloth',true); fShelf(kit,cx-hw+0.25,y,cz-hd*0.1,2.4,FACE.left,'jars'); fScale(kit,cx,y+1.08,cz-hd*0.15); for(var k=0;k<4;k++) kit.box([F.cloth1,F.cloth2,F.cloth3,F.linen][k],1.0,0.5,0.7,cx+hw-1.0,y+0.25+k*0.5*(k<2?1:0),cz+hd*0.4-(k>=2?0.9:0)); fSack(kit,cx-hw+0.6,y,cz+hd-0.6,F.spice); fSack(kit,cx-hw+1.2,y,cz+hd-0.5,F.straw); fChest(kit,cx+hw-0.7,y,cz-hd+0.6,0); }
  fStool(kit,cx,y,cz-hd*0.15-0.9); fChest(kit,cx-hw+0.7,y,cz-hd+0.6,0);
});
addInterior('checkpoint customs', function(kit,o,y,cx,cz,hw,hd,F){
  fDesk(kit,cx-hw*0.3,y,cz-hd*0.2,Math.PI); kit.box(F.paper,0.6,0.08,0.4,cx-hw*0.3+0.3,y+0.9,cz-hd*0.2); kit.box(F.gold,0.14,0.14,0.14,cx-hw*0.3-0.4,y+0.93,cz-hd*0.2);
  fRack(kit,cx+hw-0.25,y,cz-hd+1.2,FACE.right,'spear'); fChest(kit,cx-hw+0.7,y,cz-hd+0.6,0); fChest(kit,cx-hw+1.9,y,cz-hd+0.6,0);
  fBars(kit,cx+hw-2.4,cz+hd-2.8,cx+hw-0.05,cz+hd-2.8,y,2.4,0.9); fBars(kit,cx+hw-2.4,cz+hd-2.8,cx+hw-2.4,cz+hd,y,2.4,0); kit.box(F.straw,1.2,0.1,0.8,cx+hw-1.2,y+0.05,cz+hd-1.2);
  fBrazier(kit,cx,y,cz+hd*0.4,false); fShelf(kit,cx,y,cz-hd+0.25,2.4,FACE.back,'scrolls'); fCrate(kit,cx-hw+0.7,y,cz+hd-0.8,0.9);
});
addInterior('workshop siege', function(kit,o,y,cx,cz,hw,hd,F){
  fTable(kit,cx-hw*0.4,y,cz-hd+1.0,2.6,1.0,0); kit.box(F.steel,0.9,0.04,0.1,cx-hw*0.4,y+0.88,cz-hd+1.0,0.2); kit.box(F.dark,0.3,0.3,0.3,cx-hw*0.4+0.8,y+1.0,cz-hd+1.0);
  fRack(kit,cx+hw-0.25,y,cz-hd+1.2,FACE.right,'axe');
  fWheel(kit,cx+hw*0.5,y,cz+hd*0.1,0,0.9); fWheel(kit,cx+hw*0.5,y,cz+hd*0.1+0.3,0,0.9); fWheel(kit,cx-hw*0.5,y+0.05,cz+hd*0.5,Math.PI/2,0.7);
  for(var i=0;i<3;i++) kit.box(F.oak,0.3,0.3,hd*1.4,cx-hw+0.4+i*0.35,y+0.15+i*0.3,cz);
  kit.collider(cx-hw+0.1,cz-hd*0.7,cx-hw+1.5,cz+hd*0.7);
  if(o.interior==='siege'){ kit.box(F.dark,1.2,3.0,1.2,cx,y+1.5,cz-hd*0.3,0.3); kit.box(F.oak,0.2,0.2,3.6,cx,y+3.1,cz-hd*0.3,0,-0.5); kit.cyln(F.iron,0.1,0.1,1.8,6,cx+0.5,y+3.4,cz-hd*0.3+1.0,0,0,0.4); kit.collider(cx-0.7,cz-hd*0.3-0.7,cx+0.7,cz-hd*0.3+0.7); }
  fBarrel(kit,cx+hw-0.6,y,cz+hd-0.7,true); fCrate(kit,cx+hw-1.6,y,cz+hd-0.8,0.8); fSack(kit,cx-hw*0.4,y,cz+hd-0.6,F.ash);
});
addInterior('watchtower', function(kit,o,y,cx,cz,hw,hd,F){
  fSpiral(kit,cx,y,cz-hd*0.3,Math.min(o.h-0.6,10),Math.max(1.2,Math.min(hw,hd)-0.6));
  fBed(kit,cx-hw+0.65,y,cz+hd-1.3,0,{len:1.9,wide:0.85}); fRack(kit,cx+hw-0.25,y,cz+hd-1.5,FACE.right,'bow'); fCrate(kit,cx+hw-0.8,y,cz-hd+0.8,0.7); fBarrel(kit,cx-hw+0.5,y,cz-hd+0.6);
  fBrazier(kit,cx+hw*0.5,y,cz+hd*0.1,false); fTable(kit,cx-hw*0.5,y,cz+hd*0.1,1.2,0.8,0); kit.box(F.paper,0.5,0.02,0.36,cx-hw*0.5,y+0.86,cz+hd*0.1);
});
addInterior('cave', function(kit,o,y,cx,cz,hw,hd,F){
  var R=M2(0x6f6a62), R2=M2(0x5a554e), i;
  for(i=0;i<9;i++){ var a=i/9*TAU; kit.box(R2,1.6,1.2+((i*7)%4)*0.4,1.4,cx+Math.cos(a)*(hw-0.4),y+0.6,cz+Math.sin(a)*(hd-0.4),a*0.7,0.2,0.3); }
  kit.box(R,0.8,0.5,0.8,cx-hw*0.4,y+0.2,cz+hd*0.2,0.6); kit.box(R,0.6,0.4,0.6,cx+hw*0.5,y+0.15,cz+hd*0.5,0.3);
  fAltar(kit,cx,y,cz-hd+0.9,0); fIcon(kit,cx-0.8,y+1.6,cz-hd+0.3,FACE.back,true); fIcon(kit,cx+0.8,y+1.6,cz-hd+0.3,FACE.back,true);
  for(i=0;i<6;i++) fCandle(kit,cx-1.4+i*0.55,y+0.02,cz-hd+2.0);
  kit.box(F.straw,1.8,0.2,1.0,cx+hw-1.2,y+0.1,cz+hd*0.4); kit.box(F.fur,1.4,0.05,0.8,cx+hw-1.2,y+0.22,cz+hd*0.4);
  kit.box(F.stone,1.2,0.25,1.2,cx-hw*0.5,y+0.12,cz+hd*0.5); fFlame(kit,cx-hw*0.5,y+0.4,cz+hd*0.5,0.9,0.9,0xff9a3c,12);
  fShelf(kit,cx-hw+0.6,y,cz-hd*0.2,1.4,FACE.left,'bread'); kit.cyln(F.water,0.3,0.3,0.4,8,cx+hw-0.8,y+0.2,cz-hd*0.3);
});
/* a small rock-cut dwelling: straw bed, hearth stones, a shelf, a niche icon */
addInterior('cavehouse', function(kit,o,y,cx,cz,hw,hd,F){
  var R2=M2(0x5a554e);
  kit.box(R2,1.2,0.9,1.0,cx-hw+0.5,y+0.4,cz-hd+0.5,0.4,0.1,0.2); kit.box(R2,0.9,0.6,0.9,cx+hw-0.5,y+0.3,cz-hd+0.6,0.2);
  kit.box(F.straw,1.9,0.22,1.1,cx+hw-1.15,y+0.1,cz+hd*0.15); kit.box(F.fur,1.5,0.05,0.8,cx+hw-1.15,y+0.24,cz+hd*0.15);
  kit.box(F.stone,1.1,0.22,1.1,cx-hw*0.45,y+0.11,cz+hd*0.35); fFlame(kit,cx-hw*0.45,y+0.38,cz+hd*0.35,0.8,0.8,0xff9a3c,11);
  fShelf(kit,cx-hw+0.5,y,cz-hd*0.1,1.2,FACE.left,'bread'); fIcon(kit,cx,y+1.5,cz-hd+0.25,FACE.back,false); fStool(kit,cx+0.4,y,cz+hd*0.4);
  kit.cyln(F.water,0.28,0.28,0.4,8,cx+hw-0.7,y+0.2,cz-hd+1.2);
});
addInterior('crypt', function(kit,o,y,cx,cz,hw,hd,F){
  var W=M2(0x5a554e), i, j;
  /* the maze: partition walls with gaps that force a winding path */
  var rows=Math.floor((hd*2-4)/3.2);
  for(i=0;i<rows;i++){
    var z=cz+hd-4.2-i*3.2, left=i%2===0;
    if(left) fWall(kit,W,cx-hw,z,cx+hw-2.4,z,y,o.h-0.5,0); else fWall(kit,W,cx-hw+2.4,z,cx+hw,z,y,o.h-0.5,0);
    for(j=0;j<Math.floor((hw*2-3)/2.8);j++){ var sx=cx-hw+1.6+j*2.8; if(i===0&&Math.abs(sx-cx)<1.6) continue; fSarcophagus(kit,sx,y,z+1.6,0); }
    var tw=kit.toWorld(left?cx+hw-0.4:cx-hw+0.4, z+0.5); wallTorch(tw.x,y+2.0,tw.z);
  }
  fAltar(kit,cx,y,cz-hd+0.8,0); fSarcophagus(kit,cx-2.0,y,cz-hd+0.9,0); fSarcophagus(kit,cx+2.0,y,cz-hd+0.9,0);
  fShelf(kit,cx-hw+0.25,y,cz-hd+1.2,1.8,FACE.left,'bones'); fShelf(kit,cx+hw-0.25,y,cz-hd+1.2,1.8,FACE.right,'bones');
  for(i=0;i<5;i++) fCandle(kit,cx-1.2+i*0.6,y+0.02,cz-hd+2.0);
  kit.box(F.gold,0.4,0.4,0.4,cx,y+0.2,cz-hd+1.9,0.6);
});
addInterior('witch', function(kit,o,y,cx,cz,hw,hd,F){
  fCauldron(kit,cx-hw*0.45,y,cz-hd*0.25); fHerbs(kit,cx,y+2.3,cz-hd+0.6,6,0); fHerbs(kit,cx-hw+0.3,y+2.2,cz,4,FACE.right);
  fShelf(kit,cx-hw+0.25,y,cz-hd*0.3,2.0,FACE.left,'bones'); fShelf(kit,cx+hw-0.25,y,cz-hd*0.3,2.0,FACE.right,'jars');
  fTable(kit,cx+hw*0.5,y,cz-hd*0.3,1.5,0.9,0.4); kit.cyln(F.glass,0.1,0.1,0.25,7,cx+hw*0.5,y+0.98,cz-hd*0.3); kit.cyln(F.bone,0.12,0.12,0.14,7,cx+hw*0.5+0.4,y+0.92,cz-hd*0.3); kit.box(F.paper,0.5,0.03,0.4,cx+hw*0.5-0.4,y+0.87,cz-hd*0.3);
  fBed(kit,cx-hw+0.65,y,cz+hd-1.3,0,{fur:true}); for(var i=0;i<5;i++) fCandle(kit,cx-hw+0.4+i*0.4,y+0.02,cz-hd+0.5);
  kit.cyln(F.bone,0.14,0.14,0.16,8,cx+hw-0.5,y+2.4,cz-hd+0.4); kit.box(F.dark,0.05,0.05,0.4,cx,y+1.6,cz-hd+0.3,0,0,0.5);
});
addInterior('bandit', function(kit,o,y,cx,cz,hw,hd,F){
  fBed(kit,cx-hw+0.65,y,cz-hd+1.3,0,{fur:true}); fBed(kit,cx-hw+0.65,y,cz-hd+3.6,0,{}); fBunk(kit,cx+hw-0.6,y,cz-hd+1.4,Math.PI/2);
  fChest(kit,cx,y,cz-hd+0.6,0,true); fChest(kit,cx+1.2,y,cz-hd+0.6,0.2,true); fChest(kit,cx-1.2,y,cz-hd+0.6,-0.2,false);
  fTable(kit,cx,y,cz+hd*0.3,1.8,1.0,0.2); fStool(kit,cx-1.1,y,cz+hd*0.3); fStool(kit,cx+1.1,y,cz+hd*0.3); fStool(kit,cx,y,cz+hd*0.3+0.9);
  for(var i=0;i<4;i++) kit.box(F.bone,0.08,0.08,0.08,cx-0.3+i*0.2,y+0.9,cz+hd*0.3+(i%2)*0.15,i*0.4);
  kit.box(F.gold,0.3,0.1,0.2,cx+0.5,y+0.9,cz+hd*0.3-0.2);
  fRack(kit,cx+hw-0.25,y,cz+hd*0.2,FACE.right,'sword'); fRack(kit,cx+hw-0.25,y,cz+hd-1.6,FACE.right,'bow');
  fBarrel(kit,cx-hw+0.5,y,cz+hd-0.6,true); fBrazier(kit,cx-hw*0.4,y,cz-hd*0.1,false); fSack(kit,cx+hw-1.4,y,cz-hd+0.6,F.gold);
});
addInterior('tunnel', function(kit,o,y,cx,cz,hw,hd,F){
  var i, n=Math.floor(hd*2/6);
  for(i=0;i<n;i++){ var z=cz-hd+3+i*6; fBarrel(kit,cx-hw+0.45,y,z); fCrate(kit,cx+hw-0.5,y,z+1.2,0.7); var tw=kit.toWorld(cx+hw-0.05,z-2); wallTorch(tw.x,y+1.9,tw.z); kit.box(F.dark,hw*2+0.2,0.25,0.25,cx,y+o.h-0.5,z); kit.box(F.dark,0.25,o.h-0.4,0.25,cx-hw+0.1,y+(o.h-0.4)/2,z); kit.box(F.dark,0.25,o.h-0.4,0.25,cx+hw-0.1,y+(o.h-0.4)/2,z); }
  fSack(kit,cx,y,cz-hd+1.2,F.spice); fChest(kit,cx-hw+0.8,y,cz+hd-1.2,0,true);
});
addInterior('lighthouse beacon', function(kit,o,y,cx,cz,hw,hd,F){
  fSpiral(kit,cx,y,cz,Math.min(o.h-0.6,12),Math.max(1.2,Math.min(hw,hd)-0.5)); fBarrel(kit,cx-hw+0.5,y,cz+hd-0.6); fCrate(kit,cx+hw-0.6,y,cz+hd-0.7,0.7); fSack(kit,cx+hw-0.6,y,cz-hd+0.6,F.ash);
});
addInterior('shrine', function(kit,o,y,cx,cz,hw,hd,F){
  fAltar(kit,cx,y,cz-hd+0.8,0); fIcon(kit,cx,y+2.0,cz-hd+0.25,FACE.back,true); for(var i=0;i<5;i++) fCandle(kit,cx-1.0+i*0.5,y+0.02,cz-hd+1.8); fBench(kit,cx,y,cz+hd*0.3,Math.min(hw*1.6,3),0);
});
addInterior('store granary warehouse', function(kit,o,y,cx,cz,hw,hd,F){
  var i;
  for(i=0;i<Math.floor((hd*2-1)/1.0);i++){ fBarrel(kit,cx-hw+0.45,y,cz-hd+0.6+i*1.0,i%3===0); }
  if(hd>3.2) for(i=0;i<Math.floor((hw*2-1.2)/1.0);i++){ fCrate(kit,cx-hw+1.6+i*1.0,y,cz-hd+0.6,0.85); if(i%2) fCrate(kit,cx-hw+1.6+i*1.0,y,cz-hd+0.6,0.6); }
  else { fCrate(kit,cx-hw+1.4,y,cz-hd+0.6,0.8); fCrate(kit,cx+hw-0.7,y,cz-hd+0.6,0.7); }
  for(i=0;i<6;i++) fSack(kit,cx+hw-0.6-(i%3)*0.6,y,cz+hd-0.6-Math.floor(i/3)*0.6,[F.straw,F.hay,F.spice][i%3]);
  var tx=cx-Math.max(hw*0.5,1.5); fTable(kit,tx,y,cz+hd*0.2,1.4,0.8,0); kit.box(F.paper,0.5,0.02,0.36,tx,y+0.86,cz+hd*0.2); fScale(kit,tx+0.4,y+0.86,cz+hd*0.2);
});
addInterior('palace_library', INTERIORS.library);
addInterior('palace_kitchen', INTERIORS.kitchen);
addInterior('monastery', INTERIORS.church);
addInterior('outpost', INTERIORS.barracks);
addInterior('warcamp', INTERIORS.barracks);
addInterior('fortress', INTERIORS.grandhall);
addInterior('mountain_fort', INTERIORS.grandhall);
addInterior('market', INTERIORS.tradepost);
addInterior('secret', INTERIORS.crypt);
addInterior('long', INTERIORS.hall);

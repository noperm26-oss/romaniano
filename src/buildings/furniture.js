/* ============================================================
   furniture.js — everything that furnishes an interior
   ------------------------------------------------------------
   All pieces are emitted into the building's kit (merged
   geometry) in the building's LOCAL frame: x across the door
   wall, z toward the door (+z = front), y absolute. Colliders
   go through kit.collider so they land in world space.
   ============================================================ */
var FM=null;
function fmats(){
  if(FM) return FM;
  FM={ oak:M2(0x7a5c39), dark:M2(0x5d4326), black:M2(0x241d16), iron:M2(0x50565e), steel:M2(0x9aa2ab),
       red:M2(0x7a3434), linen:M2(0xe8e0cf), straw:M2(0xb5a487), gold:M2(0xc9a227), stone:M2(0x8f8a80),
       stone2:M2(0x7d7669), candle:M2(0xf3e6c4), paper:M2(0xe8dcc0), green:M2(0x4a6a3a), blue:M2(0x3f5f8a),
       purple:M2(0x5b4a86), copper:M2(0xa86a3a), meat:M2(0x8a3a2a), bread:M2(0xc9a065), herb:M2(0x5a7a3a),
       fur:M2(0x6e5a44), bone:M2(0xe6dcc6), glass:M2(0x8ab4d0), spice:M2(0xc46a2a), spice2:M2(0xb9a13a),
       cloth1:M2(0x8a3a5a), cloth2:M2(0x2f5a7a), cloth3:M2(0xa88a3a), water:M2(0x5f8fa0), hay:M2(0xc9b24a),
       rock:M2(0x6f6a62), moss:M2(0x4a5a3a), ash:M2(0x3a3430), marble:M2(0xe2ddd0), velvet:M2(0x6a1e2a) };
  return FM;
}
/* local → world helper for fires and lights */
function fWorld(kit,x,z){ return kit.toWorld(x,z); }
function fFlame(kit,x,y,z,s,light,color,dist){
  var w=kit.toWorld(x,z);
  addFlame(w.x,y,w.z,s||1,true);
  if(light!==false) regLight(w.x,y+0.35,w.z,color||0xff9a3c,light||1.0,dist||14,1);
}
function fTable(kit,x,y,z,w,d,ry,cloth){
  var F=fmats();
  kit.box(F.oak, w, 0.1, d, x, y+0.8, z, ry);
  if(cloth) kit.box(cloth, w*0.92, 0.03, d*0.92, x, y+0.86, z, ry);
  var c=Math.cos(ry||0), s=Math.sin(ry||0);
  for(var i=-1;i<=1;i+=2)for(var j=-1;j<=1;j+=2){
    var lx=i*(w/2-0.12), lz=j*(d/2-0.12);
    kit.box(F.dark, 0.12, 0.78, 0.12, x+lx*c+lz*s, y+0.39, z-lx*s+lz*c);
  }
  var hx=Math.abs(w/2*c)+Math.abs(d/2*s), hz=Math.abs(w/2*s)+Math.abs(d/2*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fBench(kit,x,y,z,len,ry){
  var F=fmats();
  kit.box(F.oak, len, 0.08, 0.42, x, y+0.46, z, ry);
  kit.box(F.dark, 0.1, 0.44, 0.36, x+Math.cos(ry||0)*(len/2-0.15), y+0.22, z-Math.sin(ry||0)*(len/2-0.15), ry);
  kit.box(F.dark, 0.1, 0.44, 0.36, x-Math.cos(ry||0)*(len/2-0.15), y+0.22, z+Math.sin(ry||0)*(len/2-0.15), ry);
}
function fStool(kit,x,y,z){ var F=fmats(); kit.cyln(F.oak,0.22,0.2,0.08,8,x,y+0.44,z); kit.cyln(F.dark,0.05,0.06,0.42,5,x,y+0.21,z); }
function fChair(kit,x,y,z,ry,rich){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(rich?F.velvet:F.oak, 0.5, 0.08, 0.5, x, y+0.46, z, ry);
  kit.box(F.dark, 0.5, 0.9, 0.08, x-s*0.22, y+0.9, z-c*0.22, ry);
  for(var i=-1;i<=1;i+=2)for(var j=-1;j<=1;j+=2) kit.box(F.dark,0.06,0.44,0.06, x+(i*0.2)*c+(j*0.2)*s, y+0.22, z-(i*0.2)*s+(j*0.2)*c);
}
function fBed(kit,x,y,z,ry,opts){
  opts=opts||{};
  var F=fmats(), L=opts.len||2.1, W=opts.wide||1.0, c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(F.dark, W, 0.3, L, x, y+0.28, z, ry);
  kit.box(opts.rich?F.red:F.straw, W*0.92, 0.16, L*0.92, x, y+0.5, z, ry);
  kit.box(F.linen, W*0.9, 0.06, L*0.55, x-s*(L*0.18), y+0.6, z-c*(L*0.18), ry);
  kit.box(F.linen, W*0.6, 0.12, 0.4, x+s*(L*0.38), y+0.62, z+c*(L*0.38), ry);
  kit.box(F.dark, W, 0.7, 0.08, x+s*(L/2), y+0.55, z+c*(L/2), ry);
  if(opts.fur) kit.box(F.fur, W*0.8, 0.05, L*0.4, x-s*(L*0.05), y+0.64, z-c*(L*0.05), ry);
  var hx=Math.abs(W/2*c)+Math.abs(L/2*s), hz=Math.abs(W/2*s)+Math.abs(L/2*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fBunk(kit,x,y,z,ry){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0);
  for(var lv=0;lv<2;lv++){
    var yy=y+0.35+lv*1.1;
    kit.box(F.dark, 0.95, 0.12, 2.0, x, yy, z, ry);
    kit.box(F.straw, 0.86, 0.14, 1.9, x, yy+0.13, z, ry);
    kit.box(F.linen, 0.5, 0.1, 0.34, x+s*0.75, yy+0.25, z+c*0.75, ry);
  }
  for(var i=-1;i<=1;i+=2)for(var j=-1;j<=1;j+=2) kit.box(F.dark,0.1,1.9,0.1, x+(i*0.44)*c+(j*0.97)*s, y+0.95, z-(i*0.44)*s+(j*0.97)*c);
  var hx=Math.abs(0.5*c)+Math.abs(1.0*s), hz=Math.abs(0.5*s)+Math.abs(1.0*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fChest(kit,x,y,z,ry,open){
  var F=fmats();
  kit.box(F.oak, 1.0, 0.55, 0.6, x, y+0.28, z, ry);
  kit.box(F.iron, 1.02, 0.06, 0.62, x, y+0.3, z, ry);
  if(open){ kit.box(F.oak, 1.0, 0.08, 0.6, x, y+0.75, z-0.28, ry, -1.2); kit.box(F.gold, 0.8, 0.14, 0.4, x, y+0.6, z, ry); }
  else kit.box(F.dark, 1.0, 0.16, 0.6, x, y+0.63, z, ry);
  kit.collider(x-0.55,z-0.35,x+0.55,z+0.35);
}
function fBarrel(kit,x,y,z,big){
  var F=fmats(), r=big?0.42:0.32, h=big?1.1:0.85;
  kit.cyln(F.oak, r, r*0.92, h, 9, x, y+h/2, z);
  kit.cyln(F.iron, r+0.03, r+0.03, 0.06, 9, x, y+h*0.25, z);
  kit.cyln(F.iron, r+0.03, r+0.03, 0.06, 9, x, y+h*0.75, z);
  kit.collider(x-r,z-r,x+r,z+r);
}
function fCrate(kit,x,y,z,s,ry){ var F=fmats(); s=s||0.8; kit.box(F.oak,s,s,s,x,y+s/2,z,ry); kit.box(F.dark,s*1.02,0.06,s*1.02,x,y+s*0.5,z,ry); kit.collider(x-s/2,z-s/2,x+s/2,z+s/2); }
function fSack(kit,x,y,z,col){ var F=fmats(); kit.cyln(col||F.straw,0.3,0.36,0.6,7,x,y+0.3,z); kit.cyln(F.dark,0.08,0.1,0.1,6,x,y+0.63,z); }
/* wall shelf with contents; ry faces the room */
function fShelf(kit,x,y,z,w,ry,fill,tall){
  var F=fmats(), H=tall?2.2:1.5, rows=tall?4:3, c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(F.dark, w, H, 0.4, x, y+H/2, z, ry);
  for(var r=0;r<rows;r++){
    var yy=y+0.35+r*(H-0.5)/(rows-1);
    kit.box(F.oak, w-0.08, 0.05, 0.36, x, yy, z, ry);
    var n=Math.max(2,Math.floor(w/0.28)), i;
    for(i=0;i<n;i++){
      var u=-w/2+0.2+i*(w-0.4)/(n-1), px=x+u*c, pz=z-u*s;
      if(fill==='books'){ kit.box([F.red,F.blue,F.green,F.dark,F.purple][i%5], 0.16, 0.34+((i*7)%3)*0.05, 0.24, px, yy+0.2, pz, ry); }
      else if(fill==='scrolls'){ kit.cyln(F.paper, 0.06, 0.06, 0.34, 6, px, yy+0.1, pz, 0, 0, Math.PI/2); }
      else if(fill==='jars'){ kit.cyln([F.glass,F.green,F.copper][i%3], 0.08, 0.1, 0.24, 7, px, yy+0.14, pz); }
      else if(fill==='bread'){ if(i%2) kit.cyln(F.bread, 0.14, 0.12, 0.14, 7, px, yy+0.1, pz); }
      else if(fill==='cloth'){ kit.box([F.cloth1,F.cloth2,F.cloth3][i%3], 0.24, 0.12, 0.3, px, yy+0.08, pz, ry); }
      else if(fill==='candles'){ kit.cyln(F.candle, 0.03, 0.035, 0.25, 5, px, yy+0.14, pz); }
      else if(fill==='spice'){ kit.cyln([F.spice,F.spice2,F.herb][i%3], 0.09, 0.11, 0.2, 7, px, yy+0.12, pz); }
      else if(fill==='armor'){ if(i%2) kit.box(F.steel, 0.2, 0.28, 0.16, px, yy+0.16, pz, ry); }
      else if(fill==='bones'){ if(i%2) kit.cyln(F.bone, 0.04, 0.05, 0.3, 5, px, yy+0.05, pz, 0, 0, Math.PI/2); else kit.cyln(F.bone,0.1,0.1,0.14,6,px,yy+0.08,pz); }
      else if(fill==='tools'){ if(i%3===0) kit.box(F.iron, 0.05, 0.3, 0.14, px, yy+0.16, pz, ry); else if(i%3===1) kit.cyln(F.oak, 0.05, 0.05, 0.3, 5, px, yy+0.16, pz); else kit.box([F.copper,F.glass][i%2], 0.16, 0.18, 0.16, px, yy+0.1, pz, ry); }
    }
  }
  var hx=Math.abs(w/2*c)+Math.abs(0.2*s), hz=Math.abs(w/2*s)+Math.abs(0.2*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
/* weapon racks */
function fRack(kit,x,y,z,ry,kind){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(F.dark, 1.5, 1.6, 0.14, x, y+0.8, z, ry);
  kit.box(F.dark, 1.4, 0.08, 0.3, x, y+0.5, z, ry);
  for(var i=-1;i<=1;i++){
    var px=x+i*0.45*c, pz=z-i*0.45*s;
    if(kind==='spear'){ kit.cyln(F.dark,0.025,0.025,2.4,5,px,y+1.2,pz); kit.cyln(F.steel,0.05,0.005,0.3,5,px,y+2.5,pz); }
    else if(kind==='shield'){ kit.cyln([F.red,F.blue,F.gold][i+1],0.36,0.36,0.06,10,px,y+1.0,pz,0,Math.PI/2,0); }
    else if(kind==='bow'){ kit.cyln(F.dark,0.02,0.02,1.4,5,px,y+1.1,pz,0,0,0.05); kit.box(F.linen,0.01,1.3,0.01,px,y+1.1,pz+0.1); }
    else if(kind==='axe'){ kit.cyln(F.dark,0.03,0.03,1.0,5,px,y+1.0,pz); kit.box(F.steel,0.3,0.26,0.05,px,y+1.45,pz,ry); }
    else { kit.box(F.steel,0.06,0.9,0.02,px,y+1.15,pz,ry); kit.box(F.dark,0.2,0.05,0.05,px,y+0.72,pz,ry); kit.box(F.dark,0.06,0.2,0.05,px,y+0.6,pz,ry); }
  }
  var hx=Math.abs(0.75*c)+Math.abs(0.2*s), hz=Math.abs(0.75*s)+Math.abs(0.2*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fArmorStand(kit,x,y,z,ry){
  var F=fmats();
  kit.cyln(F.dark,0.05,0.05,1.7,5,x,y+0.85,z); kit.box(F.dark,0.5,0.5,0.5,x,y+0.15,z,ry);
  kit.box(F.steel,0.56,0.7,0.34,x,y+1.3,z,ry); kit.cyln(F.steel,0.17,0.16,0.28,8,x,y+1.85,z);
  kit.collider(x-0.3,z-0.3,x+0.3,z+0.3);
}
/* hearth against a wall: x,z is the wall side; ry faces into the room */
function fHearth(kit,x,y,z,ry,big){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0), W=big?3.0:2.2, H=big?3.0:2.4;
  kit.box(F.stone2, W, H, 0.5, x, y+H/2, z, ry);
  kit.box(F.stone, W+0.3, 0.3, 0.9, x+s*0.2, y+0.15, z+c*0.2, ry);
  kit.box(F.black, W*0.62, 1.1, 0.5, x+s*0.3, y+0.75, z+c*0.3, ry);
  kit.box(F.dark, W+0.4, 0.16, 0.7, x+s*0.1, y+H-0.2, z+c*0.1, ry);
  kit.cyln(F.dark, 0.08,0.09,0.9,6, x+s*0.55-c*0.2, y+0.28, z+c*0.55+s*0.2, 0, ry, Math.PI/2);
  kit.cyln(F.dark, 0.08,0.09,0.9,6, x+s*0.55+c*0.2, y+0.28, z+c*0.55-s*0.2, 0, ry+0.3, Math.PI/2);
  fFlame(kit, x+s*0.55, y+0.5, z+c*0.55, big?1.4:1.1, big?1.5:1.1, 0xff9a3c, big?22:16);
  var hx=Math.abs(W/2*c)+Math.abs(0.45*s), hz=Math.abs(W/2*s)+Math.abs(0.45*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fBrazier(kit,x,y,z,big){
  var F=fmats(), sc=big?1.3:1.0;
  kit.cyln(F.iron,0.32*sc,0.2*sc,0.3*sc,10,x,y+0.45*sc,z);
  kit.cyln(F.black,0.1,0.14,0.45*sc,8,x,y+0.22*sc,z);
  fFlame(kit,x,y+0.7*sc,z,big?1.5:1.1,big?1.3:0.9,0xff9a3c,big?20:14);
  kit.collider(x-0.35*sc,z-0.35*sc,x+0.35*sc,z+0.35*sc);
}
function fCandle(kit,x,y,z,tall){ var F=fmats(); var h=tall?1.2:0.28; kit.cyln(F.iron,0.06,0.09,tall?h:0.03,6,x,y+(tall?h/2:0.015),z); kit.cyln(F.candle,0.03,0.035,0.26,5,x,y+h+0.13,z); fFlame(kit,x,y+h+0.3,z,0.35,false); }
function fCandelabra(kit,x,y,z){
  var F=fmats();
  kit.cyln(F.gold,0.04,0.14,1.5,6,x,y+0.75,z);
  kit.box(F.gold,0.9,0.05,0.05,x,y+1.5,z);
  for(var i=-1;i<=1;i++){ kit.cyln(F.candle,0.03,0.035,0.24,5,x+i*0.42,y+1.64,z); }
  fFlame(kit,x,y+1.85,z,0.4,0.7,0xffc070,10);
  kit.collider(x-0.2,z-0.2,x+0.2,z+0.2);
}
function fThrone(kit,x,y,z,ry){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(F.stone, 2.6, 0.3, 2.2, x, y+0.15, z, ry);
  kit.box(F.dark, 1.1, 0.5, 1.0, x, y+0.55, z, ry);
  kit.box(F.dark, 1.1, 1.7, 0.16, x-s*0.45, y+1.45, z-c*0.45, ry);
  kit.box(F.gold, 1.16, 0.08, 1.06, x, y+0.82, z, ry);
  kit.box(F.velvet, 0.9, 0.7, 0.5, x+s*0.1, y+1.05, z+c*0.1, ry);
  kit.box(F.gold, 0.12, 0.6, 0.12, x+c*0.55, y+1.05, z-s*0.55);
  kit.box(F.gold, 0.12, 0.6, 0.12, x-c*0.55, y+1.05, z+s*0.55);
  kit.pyr(F.gold, 0.16, 0.3, 4, x-s*0.45, y+2.45, z-c*0.45);
  kit.collider(x-0.7,z-0.7,x+0.7,z+0.7);
}
function fIcon(kit,x,y,z,ry,big){
  var F=fmats(), w=big?0.7:0.36, h=big?0.95:0.5;
  kit.box(F.gold, w, h, 0.05, x, y, z, ry);
  kit.box([F.red,F.blue,F.velvet][Math.abs(Math.round(x*3+z*7))%3], w*0.72, h*0.72, 0.06, x, y, z, ry);
  kit.cyln(F.gold, w*0.14, w*0.14, 0.07, 8, x, y+h*0.18, z, 0, ry+Math.PI/2, 0);
}
/* iconostasis: a wall of icons with the royal doors, facing +z (ry rotates) */
function fIconostasis(kit,x,y,z,w,ry){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0), i, H=3.4;
  kit.box(F.dark, w, H, 0.3, x, y+H/2, z, ry);
  kit.box(F.gold, w, 0.14, 0.34, x, y+H-0.1, z, ry);
  kit.box(F.gold, w, 0.1, 0.34, x, y+1.9, z, ry);
  var n=Math.max(3,Math.floor(w/1.1));
  for(i=0;i<n;i++){
    var u=-w/2+0.55+i*(w-1.1)/(n-1), px=x+u*c+s*0.18, pz=z-u*s+c*0.18;
    if(Math.abs(u)<0.9){ if(i===Math.floor(n/2)){ kit.box(F.gold, 1.1, 1.7, 0.1, x+s*0.18, y+0.95, z+c*0.18, ry); kit.box(F.red, 0.9, 1.5, 0.12, x+s*0.2, y+0.95, z+c*0.2, ry); } continue; }
    fIcon(kit,px,y+1.2,pz,ry,true);
    fIcon(kit,px,y+2.6,pz,ry,false);
  }
  kit.box(F.gold, 0.14, 1.1, 0.14, x+s*0.25, y+H+0.5, z+c*0.25);
  kit.box(F.gold, 0.6, 0.12, 0.14, x+s*0.25, y+H+0.75, z+c*0.25, ry);
  var hx=Math.abs(w/2*c)+Math.abs(0.2*s), hz=Math.abs(w/2*s)+Math.abs(0.2*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fCross(kit,x,y,z,ry,h){ var F=fmats(); h=h||1.2; kit.box(F.gold,0.1,h,0.1,x,y+h/2,z,ry); kit.box(F.gold,h*0.55,0.1,0.1,x,y+h*0.75,z,ry); }
function fAltar(kit,x,y,z,ry){
  var F=fmats();
  kit.box(F.marble,1.8,1.0,0.9,x,y+0.5,z,ry); kit.box(F.red,1.9,0.06,1.0,x,y+1.03,z,ry);
  fCross(kit,x,y+1.06,z,ry,0.9); fCandle(kit,x-0.6,y+1.06,z); fCandle(kit,x+0.6,y+1.06,z);
  kit.collider(x-0.95,z-0.5,x+0.95,z+0.5);
}
function fLectern(kit,x,y,z,ry){ var F=fmats(); kit.cyln(F.dark,0.08,0.2,1.1,6,x,y+0.55,z); kit.box(F.oak,0.6,0.05,0.45,x,y+1.15,z,ry,-0.4); kit.box(F.paper,0.5,0.04,0.36,x,y+1.2,z,ry,-0.4); kit.collider(x-0.3,z-0.3,x+0.3,z+0.3); }
function fDesk(kit,x,y,z,ry){
  var F=fmats(); fTable(kit,x,y,z,1.4,0.8,ry);
  kit.box(F.paper,0.5,0.02,0.36,x-0.25,y+0.86,z,ry); kit.cyln(F.glass,0.05,0.06,0.12,6,x+0.4,y+0.91,z);
  kit.cyln(F.linen,0.01,0.01,0.3,4,x+0.42,y+1.05,z,0,0,0.5); fStool(kit,x-Math.sin(ry||0)*0.7,y,z-Math.cos(ry||0)*0.7);
}
function fAnvil(kit,x,y,z,ry){ var F=fmats(); kit.box(F.dark,0.7,0.5,0.6,x,y+0.25,z,ry); kit.box(F.iron,0.9,0.22,0.36,x,y+0.62,z,ry); kit.cyln(F.iron,0.06,0.16,0.3,6,x+Math.cos(ry||0)*0.55,y+0.62,z-Math.sin(ry||0)*0.55,0,ry,Math.PI/2); kit.collider(x-0.45,z-0.35,x+0.45,z+0.35); }
function fQuench(kit,x,y,z){ var F=fmats(); kit.cyln(F.oak,0.45,0.4,0.7,9,x,y+0.35,z); kit.cyln(F.water,0.4,0.4,0.04,9,x,y+0.68,z); kit.collider(x-0.45,z-0.45,x+0.45,z+0.45); }
function fForge(kit,x,y,z,ry){
  var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0);
  kit.box(F.stone2,2.4,1.0,1.4,x,y+0.5,z,ry); kit.box(F.black,1.2,0.3,0.9,x+s*0.2,y+1.05,z+c*0.2,ry);
  kit.box(F.stone2,2.6,0.3,1.6,x,y+2.6,z,ry); kit.box(F.stone2,1.2,1.4,1.0,x-s*0.3,y+1.8,z-c*0.3,ry);
  kit.box(F.oak,0.9,0.3,0.5,x+c*1.5,y+0.9,z-s*1.5,ry); kit.box(F.dark,0.3,0.1,0.1,x+c*2.0,y+1.1,z-s*2.0,ry);
  fFlame(kit,x+s*0.25,y+1.2,z+c*0.25,1.1,1.3,0xff7a2c,16);
  var hx=Math.abs(1.3*c)+Math.abs(0.8*s), hz=Math.abs(1.3*s)+Math.abs(0.8*c);
  kit.collider(x-hx,z-hz,x+hx,z+hz);
}
function fMillstone(kit,x,y,z){
  var F=fmats();
  kit.box(F.dark,2.4,0.7,2.4,x,y+0.35,z); kit.cyln(F.stone,0.9,0.9,0.25,14,x,y+0.82,z);
  var top=new THREE.Mesh(sharedGeometry('millstone',function(){ return new THREE.CylinderGeometry(0.85,0.85,0.28,14); }), M2(0x8f8a80));
  var w=kit.toWorld(x,z); top.position.set(w.x,y+1.1,w.z); propAdd(top);
  var post=new THREE.Mesh(sharedGeometry('millpost',function(){ return new THREE.BoxGeometry(0.16,0.4,0.9); }), M2(0x5d4326)); post.position.y=0.3; top.add(post);
  ANIM_PARTS.push({kind:'spin', g:top, axis:'y', rate:0.9, x:w.x, z:w.z});
  kit.box(F.oak,1.2,1.0,1.2,x,y+2.1,z,0.78); kit.box(F.oak,0.3,0.8,0.3,x,y+1.55,z);
  kit.collider(x-1.2,z-1.2,x+1.2,z+1.2);
}
function fTub(kit,x,y,z,filled){ var F=fmats(); kit.cyln(F.oak,0.8,0.7,0.8,10,x,y+0.4,z); kit.cyln(F.iron,0.83,0.83,0.06,10,x,y+0.6,z); if(filled!==false) kit.cyln(F.water,0.72,0.72,0.04,10,x,y+0.72,z); kit.collider(x-0.8,z-0.8,x+0.8,z+0.8); }
function fStove(kit,x,y,z,ry){ var F=fmats(); kit.box(F.stone2,1.4,1.5,1.2,x,y+0.75,z,ry); kit.cyln(F.stone,0.5,0.5,0.5,10,x,y+1.75,z); kit.box(F.black,0.6,0.5,0.3,x+Math.sin(ry||0)*0.6,y+0.5,z+Math.cos(ry||0)*0.6,ry); fFlame(kit,x+Math.sin(ry||0)*0.65,y+0.45,z+Math.cos(ry||0)*0.65,0.7,0.8,0xff9a3c,12); kit.collider(x-0.75,z-0.65,x+0.75,z+0.65); }
/* iron bars: a cell wall from (x0,z0) to (x1,z1) with an optional gap in the middle */
function fBars(kit,x0,z0,x1,z1,y,h,gap){
  var F=fmats(), L=Math.hypot(x1-x0,z1-z0), n=Math.floor(L/0.28), i, dx=(x1-x0)/L, dz=(z1-z0)/L;
  for(i=0;i<=n;i++){
    var t=i/n, px=x0+(x1-x0)*t, pz=z0+(z1-z0)*t;
    if(gap && Math.abs(t-0.5)*L<gap/2) continue;
    kit.cyln(F.iron,0.03,0.03,h,5,px,y+h/2,pz);
  }
  kit.box(F.iron, L, 0.08, 0.08, (x0+x1)/2, y+h-0.1, (z0+z1)/2, -Math.atan2(dz,dx));
  kit.box(F.iron, L, 0.08, 0.08, (x0+x1)/2, y+0.5, (z0+z1)/2, -Math.atan2(dz,dx));
  if(gap){
    var hl=(L/2-gap/2);
    kit.collider(Math.min(x0,x0+dx*hl)-0.06, Math.min(z0,z0+dz*hl)-0.06, Math.max(x0,x0+dx*hl)+0.06, Math.max(z0,z0+dz*hl)+0.06);
    kit.collider(Math.min(x1,x1-dx*hl)-0.06, Math.min(z1,z1-dz*hl)-0.06, Math.max(x1,x1-dx*hl)+0.06, Math.max(z1,z1-dz*hl)+0.06);
  } else kit.collider(Math.min(x0,x1)-0.06, Math.min(z0,z1)-0.06, Math.max(x0,x1)+0.06, Math.max(z0,z1)+0.06);
}
/* interior partition wall with an optional doorway */
function fWall(kit,mat,x0,z0,x1,z1,y,h,gapW){
  var L=Math.hypot(x1-x0,z1-z0), dx=(x1-x0)/L, dz=(z1-z0)/L, ry=-Math.atan2(dz,dx), t=0.28;
  if(gapW){
    var hl=(L-gapW)/2;
    kit.box(mat, hl, h, t, x0+dx*hl/2, y+h/2, z0+dz*hl/2, ry);
    kit.box(mat, hl, h, t, x1-dx*hl/2, y+h/2, z1-dz*hl/2, ry);
    kit.box(mat, gapW+0.2, h-2.2, t, (x0+x1)/2, y+h-(h-2.2)/2, (z0+z1)/2, ry);
    kit.collider(Math.min(x0,x0+dx*hl)-t/2, Math.min(z0,z0+dz*hl)-t/2, Math.max(x0,x0+dx*hl)+t/2, Math.max(z0,z0+dz*hl)+t/2);
    kit.collider(Math.min(x1,x1-dx*hl)-t/2, Math.min(z1,z1-dz*hl)-t/2, Math.max(x1,x1-dx*hl)+t/2, Math.max(z1,z1-dz*hl)+t/2);
  } else {
    kit.box(mat, L, h, t, (x0+x1)/2, y+h/2, (z0+z1)/2, ry);
    kit.collider(Math.min(x0,x1)-t/2, Math.min(z0,z1)-t/2, Math.max(x0,x1)+t/2, Math.max(z0,z1)+t/2);
  }
}
function fPillar(kit,x,y,z,h,r,mat){ var F=fmats(); kit.cyln(mat||F.stone,r||0.3,(r||0.3)*1.1,h,8,x,y+h/2,z); kit.box(mat||F.stone,(r||0.3)*2.6,0.2,(r||0.3)*2.6,x,y+h-0.1,z); kit.collider(x-(r||0.3),z-(r||0.3),x+(r||0.3),z+(r||0.3)); }
function fCarpet(kit,x,y,z,w,d,ry,mat){ var F=fmats(); kit.box(mat||F.red,w,0.03,d,x,y+0.03,z,ry); kit.box(F.gold,w*0.96,0.031,d*0.96,x,y+0.031,z,ry); kit.box(mat||F.red,w*0.9,0.032,d*0.9,x,y+0.032,z,ry); }
function fBanner(kit,x,y,z,ry,mat){ var F=fmats(); kit.box(F.dark,0.08,0.08,1.0,x,y,z,ry); kit.box(mat||F.red,0.06,1.6,0.9,x,y-0.85,z,ry); kit.box(F.gold,0.07,0.1,0.92,x,y-0.1,z,ry); }
function fSarcophagus(kit,x,y,z,ry){ var F=fmats(); kit.box(F.stone,2.2,0.9,1.0,x,y+0.45,z,ry); kit.box(F.stone2,2.3,0.2,1.1,x,y+1.0,z,ry); kit.box(F.marble,1.4,0.16,0.5,x,y+1.14,z,ry); fCross(kit,x+Math.cos(ry||0)*0.7,y+1.1,z-Math.sin(ry||0)*0.7,ry,0.5); kit.collider(x-1.15,z-0.6,x+1.15,z+0.6); }
function fCauldron(kit,x,y,z){ var F=fmats(); kit.cyln(F.dark,0.1,0.1,0.7,6,x-0.6,y+0.35,z); kit.cyln(F.dark,0.1,0.1,0.7,6,x+0.6,y+0.35,z); kit.cyln(F.dark,0.05,0.05,1.4,6,x,y+0.75,z,0,0,Math.PI/2); kit.cyln(F.iron,0.45,0.35,0.5,10,x,y+0.5,z); kit.cyln(F.green,0.4,0.4,0.05,10,x,y+0.74,z); fFlame(kit,x,y+0.2,z,0.8,0.9,0x8fd07a,14); kit.collider(x-0.5,z-0.5,x+0.5,z+0.5); }
function fHerbs(kit,x,y,z,n,ry){ var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0); kit.cyln(F.dark,0.02,0.02,n*0.4,4,x,y,z,0,ry,Math.PI/2); for(var i=0;i<n;i++){ var u=-n*0.2+0.2+i*0.4; kit.cyln([F.herb,F.green,F.moss][i%3],0.04,0.12,0.45,5,x+u*c,y-0.28,z-u*s,Math.PI); } }
function fMeat(kit,x,y,z,n,ry){ var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0); kit.cyln(F.dark,0.03,0.03,n*0.45,4,x,y,z,0,ry,Math.PI/2); for(var i=0;i<n;i++){ var u=-n*0.225+0.225+i*0.45; kit.cyln(F.iron,0.01,0.01,0.2,4,x+u*c,y-0.12,z-u*s); kit.cyln(F.meat,0.1,0.14,0.5,6,x+u*c,y-0.48,z-u*s); } }
function fHay(kit,x,y,z,s){ var F=fmats(); s=s||1; kit.box(F.hay,1.4*s,0.8*s,1.0*s,x,y+0.4*s,z,0.2); kit.box(F.hay,1.0*s,0.5*s,0.8*s,x+0.2,y+1.0*s,z,0.5); }
function fStall(kit,x,y,z,ry){ var F=fmats(); fWall(kit,F.dark,x-1.2,z-1.4,x-1.2,z+1.4,y,1.3); fWall(kit,F.dark,x+1.2,z-1.4,x+1.2,z+1.4,y,1.3); fHay(kit,x,y,z-0.6,0.8); kit.box(F.oak,0.8,0.3,0.4,x+0.6,y+0.9,z+0.9); kit.box(F.dark,0.5,0.25,0.9,x-0.5,y+1.1,z+0.8); }
function fLoom(kit,x,y,z,ry){ var F=fmats(); kit.box(F.dark,1.6,1.8,0.1,x,y+0.9,z,ry); kit.box(F.dark,1.6,0.1,1.0,x,y+0.6,z+0.5,ry); kit.box(F.cloth2,1.3,1.2,0.04,x,y+1.1,z+0.06,ry); kit.collider(x-0.8,z-0.6,x+0.8,z+0.6); }
function fCounter(kit,x,y,z,w,ry){ var F=fmats(); kit.box(F.oak,w,1.0,0.7,x,y+0.5,z,ry); kit.box(F.dark,w+0.1,0.08,0.8,x,y+1.04,z,ry); var c=Math.cos(ry||0), s=Math.sin(ry||0); var hx=Math.abs(w/2*c)+Math.abs(0.4*s), hz=Math.abs(w/2*s)+Math.abs(0.4*c); kit.collider(x-hx,z-hz,x+hx,z+hz); }
function fScale(kit,x,y,z){ var F=fmats(); kit.cyln(F.gold,0.03,0.08,0.5,6,x,y+0.25,z); kit.box(F.gold,0.6,0.02,0.02,x,y+0.5,z); kit.cyln(F.gold,0.1,0.1,0.02,8,x-0.3,y+0.35,z); kit.cyln(F.gold,0.1,0.1,0.02,8,x+0.3,y+0.4,z); }
function fDrum(kit,x,y,z){ var F=fmats(); kit.cyln(F.oak,0.5,0.5,0.7,10,x,y+0.35,z); kit.cyln(F.linen,0.5,0.5,0.04,10,x,y+0.72,z); kit.cyln(F.dark,0.02,0.02,0.5,4,x+0.2,y+0.85,z,0,0,0.6); kit.collider(x-0.5,z-0.5,x+0.5,z+0.5); }
function fWheel(kit,x,y,z,ry,r){ var F=fmats(); r=r||0.8; kit.cyln(F.dark,r,r,0.12,12,x,y+r,z,0,ry,Math.PI/2); kit.cyln(F.oak,r*0.2,r*0.2,0.2,8,x,y+r,z,0,ry,Math.PI/2); }
function fLadder(kit,x,y,z,h,ry){ var F=fmats(), c=Math.cos(ry||0), s=Math.sin(ry||0); kit.box(F.dark,0.08,h,0.08,x-c*0.25,y+h/2,z+s*0.25,0,0,0.12); kit.box(F.dark,0.08,h,0.08,x+c*0.25,y+h/2,z-s*0.25,0,0,0.12); for(var i=0;i<h/0.35;i++) kit.box(F.dark,0.5,0.05,0.05,x,y+0.2+i*0.35,z,ry); }
/* spiral stair impression around a post (towers): wedge steps climbing h */
function fSpiral(kit,x,y,z,h,r){
  var F=fmats(), n=Math.floor(h/0.28), i;
  kit.cyln(F.stone,0.3,0.3,h,8,x,y+h/2,z);
  for(i=0;i<n;i++){ var a=i*0.42; kit.box(F.stone2, r, 0.08, 0.5, x+Math.cos(a)*r*0.55, y+i*0.28+0.1, z-Math.sin(a)*r*0.55, a); }
  kit.collider(x-0.35,z-0.35,x+0.35,z+0.35);
}
function fMapTable(kit,x,y,z,ry){
  var F=fmats(); fTable(kit,x,y,z,2.6,1.5,ry,F.paper);
  kit.box(F.green,0.5,0.01,0.5,x-0.5,y+0.9,z+0.2,ry); kit.box(F.blue,0.02,0.01,1.2,x+0.2,y+0.9,z,ry+0.3);
  for(var i=0;i<6;i++) kit.box([F.red,F.blue][i%2],0.1,0.14,0.1,x-0.9+i*0.35,y+0.97,z-0.3+(i%3)*0.25);
  fCandle(kit,x+1.0,y+0.86,z+0.5);
}
function fFont(kit,x,y,z){ var F=fmats(); kit.cyln(F.marble,0.55,0.35,1.0,10,x,y+0.5,z); kit.cyln(F.water,0.45,0.45,0.04,10,x,y+0.98,z); kit.collider(x-0.55,z-0.55,x+0.55,z+0.55); }
function fRelicCase(kit,x,y,z){ var F=fmats(); kit.box(F.dark,1.2,1.0,0.8,x,y+0.5,z); kit.box(F.glass,1.1,0.6,0.7,x,y+1.3,z); kit.box(F.gold,0.3,0.3,0.3,x,y+1.2,z,0.78); kit.collider(x-0.6,z-0.4,x+0.6,z+0.4); }

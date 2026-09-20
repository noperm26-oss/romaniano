/* ============================================================
   vernacular.js — Romanian Building Library RBL-01..RBL-21
   (ROM-MAP-SPEC-003 §5.9).  Every piece is a real solid: shells come
   from buildBuilding (walls collide, doors are the only way in, rooms
   are furnished), free-standing pieces register their own colliders.
   Regional kits (§8) pick from this library.
   Deviations recorded in docs/ROM-MAP-SPEC-003.md: the cula's door is
   at ground level (its stair is decorative) and the bordei stands on
   the ground with an earth berm instead of being dug in (the collision
   contract needs axis-aligned boxes and one floor plane).
   ============================================================ */
var RBL_STATS={};
function rblCount(k){ RBL_STATS[k]=(RBL_STATS[k]||0)+1; }
/* RBL-01 casa țărănească: whitewashed cottage with a prispă (porch) along the door wall */
function rblCasa(o){ rblCount('RBL-01'); return buildBuilding(Object.assign({w:7, d:6, h:3.2, wall:0xe8dcc0, roofCol:0x6d5a3e, roof:'gable', interior:'house', porch:true, windows:true, chimney:true}, o)); }
/* RBL-02 casa cu foișor: cottage with a square porch-tower at the door corner */
function rblFoisor(o){
  rblCount('RBL-02');
  var r=buildBuilding(Object.assign({w:8, d:6.5, h:3.4, wall:0xe2d6bb, roofCol:0x8a4a3a, roof:'gable', interior:'house', porch:true, windows:true, chimney:true, floors:1}, o));
  var kit=cellKit(o.x,o.z), d=o.door||'S', y=groundH(o.x,o.z), w=o.w||8, dd=o.d||6.5, h=o.h||3.4;
  var sx=(d==='E')?1:(d==='W')?-1:0, sz=(d==='S')?1:(d==='N')?-1:0;   /* outward */
  var tx=o.x+sx*(w/2+1.4)+(sx?0:(w/2-1.6)), tz=o.z+sz*(dd/2+1.4)+(sz?0:(dd/2-1.6));
  if(sz) tx=o.x-(w/2-1.7); else tz=o.z-(dd/2-1.7);
  kit.box(M2(o.wall||0xe2d6bb),2.6,h+1.6,2.6, tx,y+(h+1.6)/2,tz);
  kit.pyr(M2(o.roofCol||0x8a4a3a),2.4,1.6,4, tx,y+h+2.2,tz, Math.PI/4);
  kit.box(M2(0x241d16),0.9,0.9,0.1, tx+sx*1.31, y+h+0.5, tz+sz*1.31, sx?Math.PI/2:0);
  addCollider(tx-1.3,tz-1.3,tx+1.3,tz+1.3);
  return r;
}
/* RBL-03 cula: fortified boyar tower-house, three floors, arcaded top, stone plinth */
function rblCula(o){
  rblCount('RBL-03');
  var r=buildBuilding(Object.assign({w:9, d:9, h:9.5, wall:0xd9c8a2, roofCol:0x5d4a38, roof:'gable', interior:'hall', floors:3, plinth:true, arcade:true, windows:true, chimney:true, tower:true,
    lore:{key:'cula_'+Math.round(o.x)+'_'+Math.round(o.z), icon:'🏯', sub:'Cula — fortified boyar house', story:'Thick walls, loopholes, a ground-floor door barred with oak, and an open gallery under the roof from which the family watched the road.'}}, o));
  var kit=cellKit(o.x,o.z), y=groundH(o.x,o.z), w=o.w||9, S=M2(0x8f8a80);
  /* decorative exterior stair to the gallery (the real entrance is the ground-floor door: deviation D-3) */
  var side=(o.door==='E')?-1:1;
  for(var i=0;i<6;i++) kit.box(S,1.2,0.35,1.0, o.x+side*(w/2+0.6), y+0.18+i*0.55, o.z-w/2+1.2+i*0.95);
  addCollider(o.x+side*(w/2+0.6)-0.6, o.z-w/2+0.6, o.x+side*(w/2+0.6)+0.6, o.z+w/2-1.6);
  return r;
}
/* RBL-04 bordei: low reed-roofed hut with an earth berm */
function rblBordei(o){
  rblCount('RBL-04');
  var r=buildBuilding(Object.assign({w:6, d:5, h:2.5, wall:0x7a6a4a, roofCol:0x968047, roof:'thatch', interior:'house', windows:false, porch:false, plinth:false, timberFrame:false, chimney:true}, o));
  var kit=cellKit(o.x,o.z), y=groundH(o.x,o.z), w=(o.w||6), d=(o.d||5), E=M2(0x6e5f43), dr=o.door||'S';
  if(dr!=='W') kit.box(E,1.2,1.1,d+1.2, o.x-w/2-0.5, y+0.5, o.z); if(dr!=='E') kit.box(E,1.2,1.1,d+1.2, o.x+w/2+0.5, y+0.5, o.z);
  if(dr!=='N') kit.box(E,w+1.2,1.1,1.2, o.x, y+0.5, o.z-d/2-0.5); if(dr!=='S') kit.box(E,w+1.2,1.1,1.2, o.x, y+0.5, o.z+d/2+0.5);
  return r;
}
/* RBL-05 biserică de lemn: wooden church with the tall shingled spire of Maramureș */
function rblBisericaLemn(o){
  rblCount('RBL-05');
  var r=buildBuilding(Object.assign({w:7, d:13, h:5, wall:0x5d4326, roofCol:0x3a2a1a, roof:'church', interior:'chapel', style:'log', belfry:false, windows:true, chimney:false}, o));
  var kit=cellKit(o.x,o.z), y=groundH(o.x,o.z), dr=o.door||'S', d=o.d||13, w=o.w||7, h=o.h||5;
  var sx=(dr==='E')?1:(dr==='W')?-1:0, sz=(dr==='S')?1:(dr==='N')?-1:0;
  var tx=o.x+sx*(d/2-2.2), tz=o.z+sz*(d/2-2.2);  /* the tower over the entrance end */
  kit.box(M2(0x5d4326),3.0,h+2.4,3.0, tx,y+(h+2.4)/2,tz);
  kit.box(M2(0x4a3a2a),3.4,1.2,3.4, tx,y+h+2.9,tz);
  kit.pyr(M2(0x3a2a1a),3.2,9.0,4, tx,y+h+3.5+4.5,tz, Math.PI/4);
  kit.box(M2(0xc9a227),0.08,1.2,0.08, tx,y+h+13.1,tz); kit.box(M2(0xc9a227),0.5,0.08,0.08, tx,y+h+13.4,tz);
  for(var i=0;i<4;i++){ var a=i*Math.PI/2+Math.PI/4; kit.pyr(M2(0x3a2a1a),0.8,1.6,4, tx+Math.cos(a)*1.55, y+h+3.6, tz+Math.sin(a)*1.55, Math.PI/4); }
  ANIM_PARTS.push({kind:'bell', x:tx, y:y+h+2.0, z:tz});
  return r;
}
/* RBL-06 conac: boyar manor with arcaded porch, tower and garden wall */
function rblConac(o){
  rblCount('RBL-06');
  var r=buildBuilding(Object.assign({w:18, d:12, h:7, wall:0xe2d6bb, roofCol:0x8a4a3a, roof:'gable', interior:'hall', floors:2, arcade:true, tower:true, windows:true, chimney:true, timberFrame:false}, o));
  return r;
}
/* RBL-07 han: road inn with a walled yard and gate */
function rblHan(o){
  rblCount('RBL-07');
  var r=buildBuilding(Object.assign({w:14, d:10, h:5, wall:0xd9c8a2, roofCol:0x70503a, roof:'gable', interior:'inn', floors:2, arcade:true, windows:true, chimney:true, sign:'inn'}, o));
  var dr=o.door||'S', w=o.w||14, d=o.d||10, sz=(dr==='S')?1:(dr==='N')?-1:0, sx=(dr==='E')?1:(dr==='W')?-1:0;
  var yx=o.x+sx*(d/2+9), yz=o.z+sz*(d/2+9);       /* yard in front of the door, open toward the building, gate on the far side */
  var hw=sz?w/2+4:9, hd=sz?9:d/2+4;
  if(sz){ propFence(yx-hw, yz-hd, yx-hw, yz+hd, 1.1); propFence(yx+hw, yz-hd, yx+hw, yz+hd, 1.1); var fz=yz+sz*hd; propFence(yx-hw, fz, yx-2.2, fz, 1.1); propFence(yx+2.2, fz, yx+hw, fz, 1.1); }
  else { propFence(yx-hw, yz-hd, yx+hw, yz-hd, 1.1); propFence(yx-hw, yz+hd, yx+hw, yz+hd, 1.1); var fx=yx+sx*hw; propFence(fx, yz-hd, fx, yz-2.2, 1.1); propFence(fx, yz+2.2, fx, yz+hd, 1.1); }
  propCart(yx+(sz?4:0), yz+(sz?0:4), 0.3, false); propWell(yx-(sz?5:0), yz-(sz?0:5), o.roofCol||0x70503a);
  torchPost(yx+hw-1, yz+hd-1, 2.4); torchPost(yx-hw+1, yz-hd+1, 2.4);
  return r;
}
/* RBL-08 cramă: wine cellar house with a barrel yard */
function rblCrama(o){
  rblCount('RBL-08');
  var r=buildBuilding(Object.assign({w:9, d:7, h:3.6, wall:0xd9c8a2, roofCol:0x70503a, roof:'gable', interior:'cellar', windows:true, chimney:false, plinth:true}, o));
  for(var i=0;i<3;i++) propBarrel(o.x-(o.w||9)/2-1.2, o.z-2+i*1.4, i===1);
  return r;
}
/* RBL-09 șură: threshing barn with wide doors */
function rblSura(o){ rblCount('RBL-09'); return buildBuilding(Object.assign({w:12, d:8, h:5, wall:0x6b4f2e, roofCol:0x5d4a38, roof:'long', interior:'store', doorW:3.2, windows:false, chimney:false}, o)); }
/* RBL-10 grajd: stable */
function rblGrajd(o){ rblCount('RBL-10'); return buildBuilding(Object.assign({w:11, d:7, h:4, wall:0x6b4f2e, roofCol:0x5d4a38, roof:'gable', interior:'stable', doorW:2.4, windows:false, chimney:false}, o)); }
/* RBL-11 stână: sheepfold — a hurdle ring, the shepherd's hut, the cheese hut, the flock */
function rblStana(x,z,rnd,opts){
  rblCount('RBL-11'); opts=opts||{};
  var kit=cellKit(x,z), r=opts.r||13, i, n=Math.max(10,Math.round(r*1.4)), y;
  for(i=0;i<n;i++){ if(i===Math.floor(n*0.75)) continue; var a0=i/n*TAU, a1=(i+1)/n*TAU; propFence(x+Math.cos(a0)*r, z+Math.sin(a0)*r, x+Math.cos(a1)*r, z+Math.sin(a1)*r, 1.2); }
  buildBuilding({x:x-r-6, z:z, w:6, d:5, h:2.8, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'E', interior:'loghouse', name:opts.name||'Stâna', style:'log', windows:false});
  buildBuilding({x:x+r+5, z:z-3, w:4.5, d:4, h:2.4, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', door:'W', interior:'smokehouse', name:'Căsoaia (cheese hut)', style:'log', windows:false, chimney:false});
  var W=M2(0xe8e0cf), K=M2(0x3a3430);
  for(i=0;i<(opts.sheep||14);i++){ var sa=rnd()*TAU, sr=rnd()*(r-2.5), sx=x+Math.cos(sa)*sr, sz=z+Math.sin(sa)*sr; y=groundH(sx,sz); kit.box(W,0.9,0.55,0.55, sx,y+0.55,sz, rnd()*TAU); kit.box(K,0.3,0.3,0.32, sx+0.5,y+0.7,sz, 0); }
  propCampfire(x+r-3, z+r-4, false); propTroita(x, z-r-3, 0);
  registerLore({key:'stana_'+Math.round(x)+'_'+Math.round(z), x:x, z:z, r:r+10, icon:'🐑', name:opts.name||'Stâna', sub:'Sheepfold', story:'Hurdles, dogs, the baci\'s hut and the cheese house. In summer the flock climbs; in autumn it comes down with the first snow.'});
}
/* RBL-12 moară de apă: watermill (wheel animated by the interiors kit) */
function rblMoaraApa(o){ rblCount('RBL-12'); return buildBuilding(Object.assign({w:9, d:7, h:4.2, wall:0x8f8a80, roofCol:0x5d4a38, roof:'gable', interior:'watermill', windows:true, chimney:false}, o)); }
/* RBL-13 moară de vânt: post windmill — tapered tower, cap, four animated sails */
function rblMoaraVant(x,z,opts){
  rblCount('RBL-13'); opts=opts||{};
  var kit=cellKit(x,z), y=groundH(x,z), h=opts.h||9, W=M2(opts.wall||0xd9c8a2), T=M2(0x5d4326);
  kit.cyln(M2(0x8f8a80),3.4,3.8,1.0,10, x,y+0.5,z);
  kit.cyln(W,2.4,3.2,h,10, x,y+1+h/2,z);
  kit.cyln(T,2.7,2.7,1.4,10, x,y+1+h+0.6,z);
  kit.pyr(M2(0x4a3a2a),3.6,2.2,8, x,y+1+h+1.3+1.1,z, 0);
  kit.box(M2(0x241d16),1.2,2.1,0.2, x,y+2.1,z+3.15);   /* door recess */
  kit.box(M2(0x2b3540),0.7,0.9,0.1, x+1.6, y+1+h*0.55, z+2.6, 0.5);
  addCollider(x-3.4,z-3.4,x+3.4,z+3.4);
  ANIM_PARTS.push({kind:'windmill', x:x, y:y+1+h-0.4, z:z+3.4, r:opts.sail||6.5, rate:opts.rate||0.45});
  regStructure({name:opts.name||'Moara de Vânt', kind:'windmill', x:x, z:z, hx:3.4, hz:3.4, door:{x:x, z:z+4.1}, dw:1.2, enterable:false});
  BUILD_COUNT++;
  if(opts.lore!==false) registerLore({key:'moara_'+Math.round(x)+'_'+Math.round(z), x:x, z:z, r:18, icon:'🌬', name:opts.name||'Moara de Vânt', sub:'Windmill', story:opts.story||'Four sails on a tarred oak post. The miller turns the whole cap into the wind with a long tail-pole.'});
}
/* RBL-14 fântână cu cumpănă: shadoof well (beam animated) */
function rblCumpana(x,z,ry){
  rblCount('RBL-14');
  var kit=cellKit(x,z), y=groundH(x,z), T=M2(0x5d4326), S=M2(0x8f8a80); ry=ry||0;
  var c=Math.cos(ry), s=Math.sin(ry), px=x-c*2.2, pz=z+s*2.2;
  kit.box(S,1.6,1.0,1.6, x,y+0.5,z, ry); kit.box(M2(0x3a3430),1.1,0.1,1.1, x,y+1.0,z, ry);
  kit.box(T,0.3,4.6,0.3, px,y+2.3,pz, ry); kit.box(T,0.3,4.6,0.3, px-s*0.5,y+2.3,pz-c*0.5, ry);
  addCollider(x-0.9,z-0.9,x+0.9,z+0.9); addCollider(px-0.5,pz-0.7,px+0.5,pz+0.4);
  ANIM_PARTS.push({kind:'shadoof', x:px, y:y+4.6, z:pz, ry:ry});
  BUILD_COUNT++;
}
/* RBL-15 poartă maramureșeană: carved triple-post gate with a shingle roof; the wicket is the way through */
function rblPoarta(x,z,ry,opts){
  rblCount('RBL-15'); opts=opts||{};
  var kit=cellKit(x,z), y=groundH(x,z), T=M2(0x5d4326), T2=M2(0x6b4f2e), R=M2(0x4a3a2a), c=Math.cos(ry||0), s=Math.sin(ry||0), i;
  var offs=[-2.4,0.6,2.4];   /* big gate between -2.4 and 0.6, wicket between 0.6 and 2.4 */
  for(i=0;i<3;i++){ var px=x+c*offs[i], pz=z-s*offs[i]; kit.box(T,0.42,4.2,0.42, px,y+2.1,pz, ry); addCollider(px-0.25,pz-0.25,px+0.25,pz+0.25); kit.box(T2,0.5,0.3,0.5, px,y+1.3,pz, ry); }
  kit.box(T,5.4,0.4,0.5, x,y+4.1,z, ry);
  kit.prism(R,1.6,0.8,5.8, x,y+4.5,z, (ry||0)+Math.PI/2);
  kit.box(T2,0.6,0.6,0.12, x+c*(-0.9), y+3.4, z-s*(-0.9), ry);   /* carved sun */
  if(opts.closed){ kit.box(T2,2.9,2.4,0.1, x+c*(-0.9), y+1.2, z-s*(-0.9), ry); colliderAlong(x+c*(-2.3),z-s*(-2.3),x+c*0.5,z-s*0.5,0.1); }
  BUILD_COUNT++;
}
/* RBL-16 fânar: hay rack under a little roof */
function rblFanar(x,z,ry){
  rblCount('RBL-16');
  var kit=cellKit(x,z), y=groundH(x,z), T=M2(0x5d4326), H=M2(0xc9b24a); ry=ry||0;
  for(var i=-1;i<=1;i+=2) for(var j=-1;j<=1;j+=2) kit.box(T,0.2,3.4,0.2, x+i*1.6,y+1.7,z+j*1.0, ry);
  kit.box(H,3.0,1.8,1.8, x,y+1.1,z, ry); kit.box(H,2.6,0.8,1.5, x,y+2.4,z, ry);
  kit.prism(M2(0x6d5a3e),2.6,0.8,3.8, x,y+3.4,z, ry+Math.PI/2);
  addCollider(x-1.7,z-1.1,x+1.7,z+1.1); BUILD_COUNT++;
}
/* RBL-17 porumbar: corn crib on stilts */
function rblPorumbar(x,z,ry){
  rblCount('RBL-17');
  var kit=cellKit(x,z), y=groundH(x,z), T=M2(0x5d4326), L=M2(0x8a7448), C=M2(0xd9a83a); ry=ry||0;
  for(var i=-1;i<=1;i+=2) for(var j=-1;j<=1;j+=2) kit.box(T,0.2,0.8,0.2, x+i*1.2,y+0.4,z+j*0.7, ry);
  kit.box(L,3.0,2.0,1.6, x,y+1.8,z, ry); kit.box(C,2.8,1.4,1.4, x,y+1.8,z, ry);
  kit.prism(M2(0x5d4a38),1.9,0.7,3.3, x,y+2.9,z, ry+Math.PI/2);
  addCollider(x-1.5,z-0.9,x+1.5,z+0.9); BUILD_COUNT++;
}
/* RBL-18 afumătoare: smokehouse */
function rblAfumatoare(o){ rblCount('RBL-18'); return buildBuilding(Object.assign({w:4.5, d:4, h:3, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'gable', interior:'smokehouse', windows:false, chimney:true, porch:false}, o)); }
/* RBL-19 beci / pivniță: half-buried cellar vault — a mound with a door front (door at ground level) */
function rblBeci(x,z,dir){
  rblCount('RBL-19');
  var r=buildBuilding({x:x, z:z, w:5, d:6, h:2.6, wall:0x8f8a80, roofCol:0x6e5f43, roof:'flat', door:dir||'S', interior:'cellar', name:'Pivnița', windows:false, chimney:false, plinth:false, porch:false, timberFrame:false});
  var kit=cellKit(x,z), y=groundH(x,z), E=M2(0x6e5f43);
  kit.box(E,7,1.4,8, x,y+2.4,z); kit.box(E,5.6,0.8,6.6, x,y+3.4,z);
  return r;
}
/* RBL-20 fântână de piatră: stone well with winch (the existing propWell with an animated winch) */
function rblFantana(x,z,roofCol){ rblCount('RBL-20'); propWell(x,z,roofCol); ANIM_PARTS.push({kind:'winch', x:x, y:groundH(x,z)+2.4, z:z}); }
/* RBL-21 depozit de sare: log salt store on a stone plinth with a loading ramp */
function rblSalt(o){
  rblCount('RBL-21');
  var r=buildBuilding(Object.assign({w:12, d:8, h:4.2, wall:0x5d4326, roofCol:0x4a3a2a, roof:'gable', interior:'warehouse', style:'log', plinth:true, windows:false, doorW:2.4, chimney:false}, o));
  var kit=cellKit(o.x,o.z), y=groundH(o.x,o.z), dr=o.door||'S', d=o.d||8, w=o.w||12;
  var sz=(dr==='S')?1:(dr==='N')?-1:0, sx=(dr==='E')?1:(dr==='W')?-1:0;
  kit.box(M2(0x8f8a80),sz?2.6:3.0,0.35,sz?3.0:2.6, o.x+sx*(w/2+1.5), y+0.17, o.z+sz*(d/2+1.5), 0, sz?0.12*sz:0, sx?-0.12*sx:0);
  for(var i=0;i<3;i++) kit.box(M2(0xf0ece4),0.9,0.7,0.9, o.x+sx*(d/2+4)-(sz?w/2-1.5-i*1.2:0), y+0.35, o.z+sz*(d/2+4)-(sx?d/2-1.5-i*1.2:0));
  return r;
}
/* ---- regional construction kits (§8): which pieces a village or hamlet of each region is made of ---- */
var RBL_KITS={
  CA:{wall:[0x8f8a80,0x7d7669,0x5d4326], roof:[0x3a4048,0x4a4238,0x3a2a1a], roofKind:['gable','gable','gable'], style:'log', plinth:true, church:'lemn', extras:['fanar','bordei','stana','afumatoare','beci'], street:0x8a7a5a, tree:0x2f4a2e},
  AR:{wall:[0xe2d6bb,0xd9c8a2,0xe8dcc0], roof:[0x70503a,0x8a4a3a,0x7a4030], roofKind:['gable','gable','thatch'], timberFrame:true, church:'stone', extras:['foisor','crama','poarta','sura','beci'], street:0x9a8555, tree:0x57893f},
  VA:{wall:[0x8a7a5e,0x7a6a4a,0x94826a], roof:[0x968047,0x6d5a3e], roofKind:['thatch','thatch','gable'], church:'lemn', extras:['bordei','cumpana','porumbar','cula','sura'], street:0x8a7a5a, tree:0x4a7a37},
  MO:{wall:[0x5d4326,0x6b4f2e,0x4a3a2a], roof:[0x4a3a2a,0x3a2a1a], roofKind:['gable'], style:'log', church:'lemn', extras:['fanar','afumatoare','poarta','grajd','beci'], street:0x8a7a5a, tree:0x3a5a2e},
  TD:{wall:[0xc2b08a,0xd9c8a2,0xb9a98a], roof:[0x9a6a3a,0x7a5a3a], roofKind:['flat','gable'], church:'stone', extras:['han','sura','fantana','porumbar'], street:0xc2b08a, tree:0x7a8a5a},
  CP:{wall:[0xe2d6bb,0xc9c2b0,0xd9c8a2], roof:[0x8a4a3a,0x3f5f8a], roofKind:['gable'], timberFrame:true, church:'stone', extras:['conac','crama','fantana','sura'], street:0x8a8070, tree:0x4a7a37},
  BF:{wall:[0x8a7a5e,0x6e6152,0x7a6a4a], roof:[0x5d4a38,0x4a4238], roofKind:['thatch','gable'], church:'lemn', extras:['bordei','fanar','memorial'], street:0x7a6a5a, tree:0x6e5f43, burned:true}
};

/* ============================================================
   prefabs.js — instanced vernacular buildings for the countryside
   ------------------------------------------------------------
   The old hamlet and farmstead houses were instanced boxes with a
   prism on top: no door you could open, painted windows, nothing
   inside. This module builds REAL houses once, through the same
   kit as every named building (structShell + a furnished interior
   from interiors.js), captures everything the build produced —
   merged geometry, colliders, the hinged door leaf, hearth and lamp
   lights, chimney, the structure record — and then stamps thousands
   of instances across the map with THREE.InstancedMesh, one draw
   call per prefab per 375u cell.

   Every instance is a full building: walls collide, the door is the
   only way in (and swings open like any other), windows glow at
   night, the chimney smokes, and the interior is furnished.

   Capture works by setting PREFAB_REC: addCollider, regLight,
   regChimney, regStructure, spawnDoorLeaf and addFlame record into
   it instead of touching the world (see the hooks in collision.js,
   registry.js, architecture.js, primitives.js).
   ============================================================ */
var PREFAB_REC=null;
var PREFAB_DEFS={}, PREFAB_CACHE={};
var PREFAB_CELLS=new Map();
var PREFAB_MAT=KIT_MAT;   /* pattern per vertex (aPat) — the same merged-body material every site and cell uses */
var PREFAB_STATS={defs:0, instances:0, houses:0, cells:0, meshes:0, tris:0, byKey:{}};
var PREFAB_Y=new THREE.Vector3(0,1,0), PREFAB_ONE=new THREE.Vector3(1,1,1);

/* ---- capture: build once at the origin, keep what it produced ---- */
function prefabCapture(key, fn){
  var kit=kitCreate();
  var rec={col:[], doors:[], chim:[], lights:[], flames:[], structs:[], anim:ANIM_PARTS.length, build:BUILD_COUNT, rbl:JSON.stringify(RBL_STATS)};
  var prevKit=SITE_KIT, prevParent=PROP_PARENT, prevFlush=null;
  SITE_KIT=kit; PROP_PARENT=new THREE.Group(); PREFAB_REC=rec;
  var gy=groundH(0,0), extra=null;
  try { extra=fn(kit, gy)||null; }
  finally { PREFAB_REC=null; SITE_KIT=prevKit; PROP_PARENT=prevParent; }
  ANIM_PARTS.length=rec.anim; BUILD_COUNT=rec.build; RBL_STATS=JSON.parse(rec.rbl);
  var g=kit.exportGeo(gy), i;
  for(i=0;i<rec.doors.length;i++) rec.doors[i].y-=gy;
  for(i=0;i<rec.chim.length;i++) rec.chim[i].y-=gy;
  for(i=0;i<rec.lights.length;i++) rec.lights[i].y-=gy;
  for(i=0;i<rec.flames.length;i++) rec.flames[i].y-=gy;
  var S=rec.structs[0]||null;
  var pf={key:key, body:g.body, panes:g.panes, tris:g.tris, col:rec.col, doors:rec.doors, chim:rec.chim, lights:rec.lights, flames:rec.flames,
          struct:S, hx:S?S.hx:(extra&&extra.hx)||1, hz:S?S.hz:(extra&&extra.hz)||1, rbl:extra&&extra.rbl||null, name:extra&&extra.name||(S&&S.name)||key};
  PREFAB_STATS.defs++; PREFAB_STATS.tris+=g.tris;
  return pf;
}
function prefabGet(key){
  if(PREFAB_CACHE[key]) return PREFAB_CACHE[key];
  var def=PREFAB_DEFS[key]; if(!def){ var m=/^([a-z_]+)\.([a-z]+)(\d+)$/.exec(key); if(m) def=prefabHouseDef(m[1],m[2],+m[3]); }
  if(!def) return null;
  PREFAB_CACHE[key]=prefabCapture(key, def);
  return PREFAB_CACHE[key];
}

/* ---- instances ---- */
function prefabRot(face){ return face==='E'?1:face==='N'?2:face==='W'?3:0; }
function prefabXZ(x,z,r){ return r===1?[z,-x]:r===2?[-x,-z]:r===3?[-z,x]:[x,z]; }
function prefabCellOf(x,z){
  var k=cellKey(x,z), c=PREFAB_CELLS.get(k);
  if(!c){ c={key:k, items:new Map(), flames:[], doors:[], x:x, z:z}; PREFAB_CELLS.set(k,c); }
  return c;
}
/* place an instance; face = side the door looks toward ('S' = +z). Returns the structure record or null. */
function prefabPlace(key, x, z, face, opts){
  opts=opts||{};
  var pf=prefabGet(key); if(!pf) return null;
  var r=prefabRot(face), a=r*Math.PI/2;
  var hx=(r%2)?pf.hz:pf.hx, hz=(r%2)?pf.hx:pf.hz;
  var gy=(opts.y!==undefined)?opts.y:groundH(x,z), i;
  if(!opts.force){
    var hs=[groundH(x-hx,z-hz),groundH(x+hx,z-hz),groundH(x-hx,z+hz),groundH(x+hx,z+hz)];
    if(Math.max.apply(null,hs)-Math.min.apply(null,hs)>(opts.maxSlope||1.6)) return null;
  }
  /* colliders: local boxes turned by quarter turns stay axis-aligned */
  for(i=0;i<pf.col.length;i++){
    var c=pf.col[i], p=prefabXZ(c[0],c[1],r), q=prefabXZ(c[2],c[3],r);
    addCollider(x+Math.min(p[0],q[0]), z+Math.min(p[1],q[1]), x+Math.max(p[0],q[0]), z+Math.max(p[1],q[1]));
  }
  var cell=prefabCellOf(x,z);
  var list=cell.items.get(key); if(!list){ list=[]; cell.items.set(key,list); }
  var m=new THREE.Matrix4(); m.compose(new THREE.Vector3(x,gy,z), new THREE.Quaternion().setFromAxisAngle(PREFAB_Y,a), PREFAB_ONE);
  list.push(m);
  /* the door leaf becomes an instance of the shared leaf; DOORS drives it like any hinged door */
  for(i=0;i<pf.doors.length;i++){
    var D=pf.doors[i], hp=prefabXZ(D.hx,D.hz,r), cp=prefabXZ(D.cx,D.cz,r);
    var E={g:null, im:null, idx:cell.doors.length, cell:cell, hx:x+hp[0], hz:z+hp[1], hy:gy+D.y, base:D.ang+a, x:x+cp[0], z:z+cp[1], open:0, w:D.w, hh:D.hh, swing:D.swing, rot:D.ang+a};
    cell.doors.push(E); DOORS.push(E);
  }
  for(i=0;i<pf.chim.length;i++){ var C=pf.chim[i], cq=prefabXZ(C.x,C.z,r); regChimney(x+cq[0], gy+C.y, z+cq[1], C.rate); }
  for(i=0;i<pf.lights.length;i++){ var L=pf.lights[i], lq=prefabXZ(L.x,L.z,r); regLight(x+lq[0], gy+L.y, z+lq[1], L.color, L.base, L.dist, L.flicker); }
  for(i=0;i<pf.flames.length;i++){ var F=pf.flames[i], fq=prefabXZ(F.x,F.z,r); cell.flames.push({x:x+fq[0], y:gy+F.y, z:z+fq[1], s:F.s}); }
  var S=null;
  if(pf.struct){
    var st=pf.struct, dq=prefabXZ(st.door.x,st.door.z,r), bq=st.back?prefabXZ(st.back.x,st.back.z,r):null;
    S=regStructure({name:opts.name||pf.name, kind:st.kind, x:x, z:z, hx:hx, hz:hz, door:{x:x+dq[0], z:z+dq[1]}, back:bq?{x:x+bq[0], z:z+bq[1]}:null, dw:st.dw, enterable:true, fac:null, prefab:key});
    BUILD_COUNT++; PREFAB_STATS.houses++;
    if(pf.rbl) rblCount(pf.rbl);
  }
  PREFAB_STATS.instances++; PREFAB_STATS.byKey[key]=(PREFAB_STATS.byKey[key]||0)+1;
  return S||{x:x, z:z, hx:hx, hz:hz};
}
/* the matrix of an instanced door leaf: hinge, swing angle, leaf size */
function prefabDoorMatrix(E, out){
  out.compose(new THREE.Vector3(E.hx,E.hy,E.hz), new THREE.Quaternion().setFromAxisAngle(PREFAB_Y,E.rot), new THREE.Vector3(E.w-0.12,E.hh-0.06,1));
  return out;
}
/* turn every cell's instance lists into InstancedMeshes (called once, after the countryside is placed) */
function prefabFlush(){
  var tmp=new THREE.Matrix4(), made=0;
  PREFAB_CELLS.forEach(function(cell){
    var g=propCell(cell.x,cell.z);
    cell.items.forEach(function(list,key){
      var pf=PREFAB_CACHE[key], i;
      if(pf.body){ var im=new THREE.InstancedMesh(pf.body, PREFAB_MAT, list.length); for(i=0;i<list.length;i++) im.setMatrixAt(i,list[i]); im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; im.name='prefab:'+key; g.add(im); made++; }
      if(pf.panes){ var ip=new THREE.InstancedMesh(pf.panes, PANE_MAT, list.length); for(i=0;i<list.length;i++) ip.setMatrixAt(i,list[i]); ip.instanceMatrix.needsUpdate=true; ip.frustumCulled=false; ip.name='prefab-panes:'+key; g.add(ip); made++; }
    });
    if(cell.flames.length){
      var fg=sharedGeometry('flame',function(){ return new THREE.ConeGeometry(0.22,0.55,6); });
      var fi=new THREE.InstancedMesh(fg, FLAME_MAT, cell.flames.length);
      cell.flames.forEach(function(f,i){ tmp.compose(new THREE.Vector3(f.x,f.y,f.z), new THREE.Quaternion(), new THREE.Vector3(f.s,f.s,f.s)); fi.setMatrixAt(i,tmp); });
      fi.instanceMatrix.needsUpdate=true; fi.frustumCulled=false; fi.name='prefab-flames'; g.add(fi); made++;
    }
    if(cell.doors.length){
      var dg=sharedGeometry('doorleafVC',function(){ return mergedColoredBoxes([
        {w:1,h:1,d:0.11,x:0.5,y:0.5,z:0,c:0x513820},
        {w:0.96,h:0.05,d:0.15,x:0.5,y:0.24,z:0,c:0x241d16},{w:0.96,h:0.05,d:0.15,x:0.5,y:0.76,z:0,c:0x241d16},
        {w:0.02,h:1,d:0.13,x:0.34,y:0.5,z:0,c:0x3a2a18},{w:0.02,h:1,d:0.13,x:0.66,y:0.5,z:0,c:0x3a2a18},
        {w:0.08,h:0.08,d:0.2,x:0.86,y:0.48,z:0,c:0x50565e}]); });
      var di=new THREE.InstancedMesh(dg, DOOR_MAT, cell.doors.length);
      cell.doors.forEach(function(E,i){ E.im=di; E.idx=i; di.setMatrixAt(i, prefabDoorMatrix(E,tmp)); });
      di.instanceMatrix.needsUpdate=true; di.frustumCulled=false; di.castShadow=true; di.name='prefab-doors'; g.add(di); made++;
    }
    cell.items=null; cell.flames=null;
  });
  PREFAB_STATS.cells=PREFAB_CELLS.size; PREFAB_STATS.meshes=made;
  return made;
}

/* ============================================================
   The regional catalogue (ROM-MAP-SPEC-003 §8 settlement kits)
   key = region.type+variant, e.g. 'moldavian.cottage2'
   ============================================================ */
var PREFAB_PAL={
  carpathian:   {walls:[0x5d4326,0x6b4f2e,0x74624a], roofs:[0x3a2a1a,0x4a3a2a,0x54423a], trim:0x3a2a1a, style:'log',     roof:['gable','gable','hip'],        porch:'prispa', barn:0x5d4326, chapel:0x5d4326},
  transylvanian:{walls:[0xd9c8a2,0xa9b8a0,0x8fa6c0,0xd7b78a,0xc79a8a,0xe2d6bb], roofs:[0x8a4a3a,0x9a5a3a,0x7a4030,0xa0563f], trim:0x513820, style:'timber', roof:['gable','gable','hip'], porch:'small', barn:0x6b4f2e, chapel:0xe2d6bb},
  wallachian:   {walls:[0xe8dcc0,0xf0e6cc,0xe2d6bb,0xd9cfae], roofs:[0x968047,0xa08a50,0x8a7a48,0x6d5a3e], trim:0x5d4326, style:'plaster', roof:['hipthatch','thatch','hip','gable'], porch:'prispa', barn:0x6b4f2e, chapel:0xe8dcc0},
  moldavian:    {walls:[0xe8dcc0,0xe2d6bb,0xdfe4dc,0xd9d0b0], roofs:[0x6d5a3e,0x5d4a38,0x7a6446,0x4a3a2a], trim:0x3f5f8a, style:'plaster', roof:['hip','gable','hip'], porch:'prispa', barn:0x5d4326, chapel:0xe8dcc0},
  trade_route:  {walls:[0xc9a86a,0xb9975a,0xd4b27a,0xbfa070], roofs:[0x8a7a5e,0x9a8a6a,0x7a6a4e], trim:0x6b4f2e, style:'plaster', roof:['flat','flat','hip'], porch:'none', barn:0xb9975a, chapel:0xd4b27a},
  capital:      {walls:[0xd9c8a2,0xe2d6bb,0xcfc2a4,0xb9b3a4], roofs:[0x8a4a3a,0x7a4030,0x5d4a38,0x9a5a3a], trim:0x513820, style:'timber', roof:['gable','hip','gable'], porch:'small', barn:0x6b4f2e, chapel:0xe2d6bb, floors2:0.35},
  battlefield:  {walls:[0xbaa98e,0xa89a80,0x9a8f78,0xc9b890], roofs:[0x6b4939,0x5d4a38,0x4a3a2a], trim:0x4a3725, style:'plaster', roof:['gable','thatch','hip'], porch:'small', barn:0x5d4326, chapel:0xbaa98e}
};
var PREFAB_NAMES={cottage:'Casă țărănească', house:'Casă cu prispă', farm:'Casa gospodarului', barn:'Șură', workshop:'Atelier', chapel:'Paraclis', shed:'Șopron', stable:'Grajd'};
function prefabHash(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h; }
/* a house definition: region palette × building type × variant → buildBuilding options */
function prefabHouseDef(region, type, v){
  var pal=PREFAB_PAL[region]||PREFAB_PAL.wallachian;
  return function(kit, gy){
    var rnd=seedRand(prefabHash(region+'.'+type+v)), pick=function(a){ return a[Math.floor(rnd()*a.length)]; };
    var o={x:0, z:0, y:gy, door:'S', kit:kit, wall:pick(pal.walls), roofCol:pick(pal.roofs), trim:pal.trim, seed:Math.floor(rnd()*1e6), chimney:true, windows:true, name:PREFAB_NAMES[type]||type};
    var roof=pick(pal.roof), rbl='RBL-01';
    if(pal.style==='log') o.style='log'; else if(pal.style==='timber') o.timberFrame=true; else { o.style='plaster'; o.band=true; }
    if(pal.porch==='prispa') o.prispa=true; else if(pal.porch==='none') o.porch=false; else o.porch=true;
    if(roof==='flat'){ o.prispa=false; o.porch=false; }
    if(type==='cottage'){ o.w=5.8+rnd()*1.6; o.d=4.8+rnd()*1.2; o.h=3.2+rnd()*0.35; o.interior='cottage'; o.bench=true; o.gableWin=rnd()<0.6; }
    else if(type==='house'){ o.w=7.4+rnd()*1.6; o.d=5.8+rnd()*1.0; o.h=3.4+rnd()*0.4; o.interior='house'; o.bench=true; o.gableWin=true; o.chimney2=rnd()<0.5; rbl=o.prispa?'RBL-01':'RBL-02'; if(pal.floors2&&rnd()<pal.floors2){ o.floors=2; o.h=5.7; o.prispa=false; } }
    else if(type==='farm'){ o.w=8.6+rnd()*1.6; o.d=6.4+rnd()*1.0; o.h=3.5+rnd()*0.3; o.interior='house'; o.chimney2=true; o.gableWin=true; o.bench=true; }
    else if(type==='barn'){ o.w=9.5+rnd()*2.5; o.d=6.8+rnd()*1.2; o.h=4.4+rnd()*0.7; o.interior='stable'; o.doorW=3.0; o.windows=false; o.chimney=false; o.prispa=false; o.porch=false; o.bench=false; o.gableWin='hatch';
      o.wall=pal.barn; o.style=(region==='trade_route')?'plaster':'log'; o.timberFrame=false; o.band=false; roof=(roof==='flat')?'flat':(rnd()<0.5?'long':'gable'); rbl='RBL-09'; }
    else if(type==='stable'){ o.w=8.5+rnd()*1.5; o.d=6+rnd(); o.h=3.8; o.interior='stable'; o.doorW=2.4; o.windows=false; o.chimney=false; o.prispa=false; o.porch=false; o.wall=pal.barn; o.style='log'; o.timberFrame=false; o.band=false; roof=(roof==='flat')?'flat':'gable'; rbl='RBL-10'; }
    else if(type==='workshop'){ o.w=7+rnd()*1.2; o.d=5.8+rnd()*0.6; o.h=3.6+rnd()*0.3; o.interior='workshop'; o.prispa=false; o.porch=(roof!=='flat'); o.gableWin=true; rbl='RBL-19'; }
    else if(type==='chapel'){ o.w=6.4+rnd()*0.8; o.d=9+rnd()*1.5; o.h=5+rnd()*0.5; o.interior='chapel'; o.chimney=false; o.prispa=false; o.porch=false; o.bench=false; o.wall=pal.chapel; o.timberFrame=false; o.band=false; o.style=(pal.style==='log')?'log':undefined; roof='church'; o.roofCol=pal.style==='log'?0x3a2a1a:pick(pal.roofs); rbl=pal.style==='log'?'RBL-05':'RBL-15'; }
    else if(type==='shed'){ o.w=3.6+rnd()*0.6; o.d=3.1+rnd()*0.5; o.h=2.5; o.interior='shed'; o.windows=false; o.chimney=false; o.prispa=false; o.porch=false; o.bench=false; o.wall=pal.barn; o.style=(region==='trade_route')?'plaster':'log'; o.timberFrame=false; o.band=false; roof=(roof==='flat')?'flat':'gable'; rbl='RBL-16'; }
    o.roof=roof;
    buildBuilding(o);
    return {rbl:rbl, name:o.name};
  };
}
/* ---- yard pieces, built with the same kit and instanced the same way ---- */
PREFAB_DEFS['prop.woodpile']=function(kit,gy){
  var T=M2(0x6b4f2e), E=M2(0xb59a6a), D=M2(0x5d4326), i, j;
  for(j=0;j<3;j++) for(i=0;i<5;i++){ var xx=-0.8+i*0.4+(j%2)*0.2, yy=gy+0.14+j*0.27; if(j===2&&(i===0||i===4)) continue; kit.cyln(T,0.13,0.13,1.5,6, xx, yy, 0, 0,0,Math.PI/2); kit.cyln(E,0.135,0.135,0.02,6, xx, yy, 0.76, 0,0,Math.PI/2); }
  kit.box(D,0.12,1.1,0.12,-1.05,gy+0.55,0.6); kit.box(D,0.12,1.1,0.12,1.05,gy+0.55,0.6); kit.box(D,0.12,1.1,0.12,-1.05,gy+0.55,-0.6); kit.box(D,0.12,1.1,0.12,1.05,gy+0.55,-0.6);
  addCollider(-1.1,-0.8,1.1,0.8);
  return {hx:1.1, hz:0.8, name:'Stivă de lemne'};
};
PREFAB_DEFS['prop.haystack']=function(kit,gy){
  var H=M2(0xc9b24a), H2=M2(0xb9a13a), D=M2(0x5d4326);
  kit.cyln(D,0.06,0.08,3.6,5, 0,gy+1.8,0);
  kit.cyln(H,1.25,1.05,0.9,9, 0,gy+0.45,0); kit.cyln(H2,1.15,1.3,0.8,9, 0,gy+1.25,0); kit.cyln(H,0.8,1.15,0.8,9, 0,gy+2.0,0); kit.cyln(H2,0.3,0.8,0.7,9, 0,gy+2.7,0);
  addCollider(-1.2,-1.2,1.2,1.2);
  return {hx:1.2, hz:1.2, name:'Căpiță'};
};
PREFAB_DEFS['prop.oven']=function(kit,gy){
  var C=M2(0xc9a86a), C2=M2(0xb9975a), K=M2(0x241d16), S=M2(0x8f8a80);
  kit.box(S,1.6,0.5,1.4, 0,gy+0.25,0);
  kit.cyln(C,0.7,0.75,0.6,10, 0,gy+0.8,0); kit.cyln(C2,0.5,0.7,0.35,10, 0,gy+1.27,0); kit.cyln(C,0.2,0.5,0.3,10, 0,gy+1.58,0);
  kit.box(K,0.5,0.4,0.2, 0,gy+0.78,0.68); kit.box(C2,0.3,0.7,0.3, 0.35,gy+1.8,-0.2); kit.box(K,0.16,0.1,0.16, 0.35,gy+2.18,-0.2);
  addFlame(0,gy+0.75,0.6,0.55,true); regLight(0,gy+0.9,0.7,0xff8a2a,0.6,8,1);
  addCollider(-0.8,-0.7,0.8,0.7);
  return {hx:0.8, hz:0.7, name:'Cuptor'};
};
PREFAB_DEFS['prop.beehives']=function(kit,gy){
  var B=M2(0xd9c8a2), R=M2(0x7a5c39), K=M2(0x241d16), i;
  kit.box(R,2.4,0.1,0.7, 0,gy+0.35,0); kit.box(R,0.1,0.35,0.6,-1.1,gy+0.17,0); kit.box(R,0.1,0.35,0.6,1.1,gy+0.17,0);
  for(i=-1;i<=1;i++){ kit.box(B,0.5,0.7,0.5, i*0.8,gy+0.75,0); kit.prism(R,0.64,0.3,0.64, i*0.8,gy+1.25,0); kit.box(K,0.2,0.06,0.04, i*0.8,gy+0.5,0.26); }
  addCollider(-1.25,-0.4,1.25,0.4);
  return {hx:1.25, hz:0.4, name:'Stupi'};
};
PREFAB_DEFS['prop.dovecote']=function(kit,gy){
  var P=M2(0x5d4326), W=M2(0xe8dcc0), R=M2(0x6d5a3e), K=M2(0x241d16), i;
  kit.box(P,0.16,3.2,0.16, 0,gy+1.6,0);
  kit.box(W,1.1,0.9,1.1, 0,gy+3.55,0); kit.pyr(R,1.0,0.7,4, 0,gy+4.35,0, Math.PI/4);
  for(i=0;i<4;i++){ var a=i*Math.PI/2; kit.box(K,0.16,0.2,0.05, Math.sin(a)*0.56, gy+3.5, Math.cos(a)*0.56, a); kit.box(P,0.5,0.04,0.12, Math.sin(a)*0.6, gy+3.36, Math.cos(a)*0.6, a); }
  addCollider(-0.2,-0.2,0.2,0.2);
  return {hx:0.6, hz:0.6, name:'Porumbar'};
};
PREFAB_DEFS['prop.well']=function(kit,gy){ propWell(0,0,0x6d5a3e); return {hx:1.2, hz:1.2, name:'Fântână'}; };
PREFAB_DEFS['prop.cart']=function(kit,gy){ propCart(0,0,0,false); return {hx:1.4, hz:0.9, name:'Car'}; };
PREFAB_DEFS['prop.troita']=function(kit,gy){ propTroita(0,0,0); return {hx:0.3, hz:0.3, name:'Troiță'}; };
PREFAB_DEFS['prop.tent']=function(kit,gy){
  var C=M2(0xb5a487), C2=M2(0xa08f74), D=M2(0x5d4326), K=M2(0x3a3430);
  kit.cyln(C,0.08,2.3,2.7,8, 0,gy+1.35,0, Math.PI/8);
  kit.box(K,0.9,1.5,0.3, 0,gy+0.75,1.95, 0, -0.55);                 /* the open flap, dark inside */
  kit.box(C2,0.5,1.7,0.08, -0.55,gy+0.85,2.05, 0.4, -0.55);
  kit.cyln(D,0.05,0.05,3.0,5, 0,gy+1.5,0);
  for(var i=0;i<4;i++){ var a=i*Math.PI/2+Math.PI/4; kit.cyln(D,0.03,0.03,1.6,4, Math.cos(a)*2.6, gy+0.6, Math.sin(a)*2.6, 0, 0, Math.cos(a)>0?-0.9:0.9); kit.box(D,0.08,0.4,0.08, Math.cos(a)*3.1, gy+0.2, Math.sin(a)*3.1); }
  addCollider(-1.9,-1.9,1.9,1.9);
  return {hx:2.0, hz:2.0, name:'Cort'};
};

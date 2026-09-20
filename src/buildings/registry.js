/* ============================================================
   registry.js — shared registries for everything built
   ------------------------------------------------------------
   Buildings register the parts that live after construction:
   animated door leaves, chimneys (smoke), light sources (a
   pooled light budget), animated parts (wheels, bells, hammers,
   water) and every solid footprint (for tests and the map).
   ============================================================ */
var BUILD_COUNT=0;
var DOORS=[];        /* {g, base, x, z, open, w} — leaf groups that swing for anyone who walks up */
var CHIMNEYS=[];     /* {x,y,z} — smoke sources */
var LIGHT_SRC=[];    /* {x,y,z,color,base,dist,flicker} — the light pool picks the nearest */
var ANIM_PARTS=[];   /* {kind:'wheel'|'bell'|'hammer'|'water'|'mill'|'sparkle', ...} */
var STRUCTURES=[];   /* {name, kind, x, z, hx, hz, door:{x,z}|null, enterable} */
var COL_GOLD=0xc9a227;

/* one shared window-pane material: its emissive glow rises at night */
var PANE_MAT=new THREE.MeshLambertMaterial({color:0xd9c79a, emissive:0xffb347, emissiveIntensity:0.0, side:THREE.DoubleSide});
/* glass-like dark panes for solid filler houses (instanced) */
var PANE_COL=0xd9c79a;

/* where props and door leaves are added: the current site group, or a culled 375u cell group */
var PROP_PARENT=null;
var PROP_CELLS=new Map(), CELL_KITS=new Map();
function cellKey(x,z){ return Math.floor((x+WORLD.half)/375)*64+Math.floor((z+WORLD.half)/375); }
function propCell(x,z){
  var k=cellKey(x,z), g=PROP_CELLS.get(k);
  if(!g){ var cx=Math.floor(k/64), cz=k%64; g=new THREE.Group(); g.name='props:'+cx+':'+cz; g.userData.cullBounds={x:(cx+0.5)*375-WORLD.half, z:(cz+0.5)*375-WORLD.half, r:300}; scene.add(g); PROP_CELLS.set(k,g); }
  return g;
}
function propAdd(obj){ var p=PROP_PARENT||propCell(obj.position.x,obj.position.z); p.add(obj); return obj; }
/* merged geometry for static props outside sites: one kit per cell, flushed once by flushCellKits() */
function cellKit(x,z){
  if(SITE_KIT) return SITE_KIT;
  var k=cellKey(x,z), kit=CELL_KITS.get(k);
  if(!kit){ kit=kitCreate(); CELL_KITS.set(k,kit); }
  return kit;
}
function flushCellKits(){
  var n=0;
  CELL_KITS.forEach(function(kit,k){ var cx=Math.floor(k/64), cz=k%64; n+=kit.flush(propCell((cx+0.5)*375-WORLD.half,(cz+0.5)*375-WORLD.half)); });
  CELL_KITS.clear();
  return n;
}

function regLight(x,y,z,color,base,dist,flicker){
  var L={x:x,y:y,z:z,color:color||0xff9a3c,base:base||1.0,dist:dist||16,flicker:flicker===undefined?1:flicker};
  LIGHT_SRC.push(L); return L;
}
function regChimney(x,y,z,rate){ CHIMNEYS.push({x:x,y:y,z:z,rate:rate||1}); }
function regStructure(o){ STRUCTURES.push(o); return o; }
/* is a point within r of any registered door threshold (keep entrances clear when placing props) */
function nearDoor(x,z,r){
  var rr=(r||2.5); rr*=rr;
  for(var i=0;i<STRUCTURES.length;i++){ var d=STRUCTURES[i].door; if(!d) continue; var dx=d.x-x, dz=d.z-z; if(dx*dx+dz*dz<rr) return true; }
  return false;
}

/* ---- site kits: one merged geometry set per named place ---- */
var SITE_KIT=null, SITE_GROUP=null, SITE_INFO=null;
function siteBegin(name,x,z,r){
  SITE_GROUP=new THREE.Group(); SITE_GROUP.name='site:'+name;
  SITE_GROUP.userData.cullBounds={x:x,z:z,r:r};
  SITE_INFO={name:name,x:x,z:z,r:r,buildings:0};
  PROP_PARENT=SITE_GROUP;
  SITE_KIT=kitCreate();
  scene.add(SITE_GROUP);
  return SITE_GROUP;
}
function siteEnd(){
  var g=SITE_GROUP;
  if(SITE_KIT&&g) SITE_KIT.flush(g);
  SITE_KIT=null; SITE_GROUP=null; PROP_PARENT=null; SITE_INFO=null;
  return g;
}

/* one geometry from several coloured boxes (vertex colours) — used by door leaves */
function mergedColoredBoxes(parts){
  var pos=[], nor=[], col=[], idx=[], base=0, c=new THREE.Color();
  parts.forEach(function(p){
    var g=new THREE.BoxGeometry(p.w,p.h,p.d), pa=g.attributes.position.array, na=g.attributes.normal.array, ia=g.index.array, i;
    c.setHex(p.c);
    for(i=0;i<pa.length;i+=3){ pos.push(pa[i]+p.x, pa[i+1]+p.y, pa[i+2]+p.z); nor.push(na[i],na[i+1],na[i+2]); col.push(c.r,c.g,c.b); }
    for(i=0;i<ia.length;i++) idx.push(ia[i]+base);
    base+=pa.length/3;
  });
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  geo.setIndex(idx); geo.computeBoundingSphere();
  return geo;
}
var DOOR_MAT=new THREE.MeshLambertMaterial({color:0xffffff, vertexColors:true});

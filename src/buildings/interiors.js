/*
  buildBuilding: the detailed tier. The shell (walls with real window and
  door openings, plinth, eaves, roof, chimney, porch) comes from
  architecture.js; collision comes from wallColliders; this file only
  furnishes the inside.
  EXTENDED EDITION: 30+ interior types for Romanian Medieval War World
  o = {x, z, w, d, h, wall, roofCol, roof:'gable'|'thatch'|'church'|'temple'|'long',
       door:'S'|'N', interior:'hall'|'house'|'barracks'|'temple'|'church'|'long'|..., fac}
*/
function interiorHearth(cx,cz,fi,w,d){
  var y=groundH(cx,cz);
  scene.add(box(2.2,0.4,0.9, M(0x8f8a80), cx, y+0.3, cz));
  scene.add(box(2.4,2.4,0.45, M(0x7d7669), cx, y+1.5, cz));
  scene.add(box(1.5,1.1,0.5, M(0x241d16), cx, y+0.75, cz+fi*0.28));
  addFlame(cx, y+0.6, cz+fi*0.45, 1.1);
  scene.add(box(2.6,0.16,0.7, M(0x5d4326), cx, y+2.75, cz+fi*0.1));
}
function propIconShelf(cx,cz){
  var y=groundH(cx,cz);
  scene.add(box(1.8,0.1,0.4, M(0x5d4a38), cx, y+1.2, cz));
  for(var i=0;i<3;i++) scene.add(box(0.2,0.3,0.05, M(0xc9a227), cx-0.6+i*0.6, y+1.45, cz+0.15));
}
function propScrollShelf(cx,cz){
  var y=groundH(cx,cz);
  scene.add(box(2.2,1.4,0.5, M(0x5d4a38), cx, y+0.7, cz));
  for(var i=0;i<4;i++) scene.add(box(0.4,0.08,0.4, M(0xe8dcc0), cx-0.8+i*0.55, y+1.1, cz+0.2));
}
function propAnvil(cx,cz){
  var y=groundH(cx,cz);
  scene.add(box(0.8,0.5,0.5, M(0x4a4a4a), cx, y+0.5, cz));
  scene.add(box(0.9,0.2,0.6, M(0x2a2a2a), cx, y+0.85, cz));
}
function buildBuilding(o){
  BUILD_COUNT++;
  var cx=o.x, cz=o.z, w=o.w, d=o.d, h=o.h;
  var y=groundH(cx,cz);
  structShell(o);
  wallColliders(cx,cz,w,d,h,o.door);
  var fi=o.door==='S'?-1:1;
  var interior=o.interior||'house';

  if(interior==='house'){
    propTable(cx - w*0.22, cz - fi*d*0.15, false, 1.6, 0.9);
    propBench(cx - w*0.22, cz - fi*d*0.15 + (o.door==='S'?0.7:-0.7), false);
    propBed(cx + w*0.28, cz + fi*d*0.22, false);
    propCrate(cx + w*0.32, cz - fi*d*0.28, 0.8);
    interiorHearth(cx, cz + fi*(d/2-0.45), -fi, w, d);
  } else if(interior==='hall'){
    propThrone(cx, cz - fi*(d/2-1.6), fi);
    propTable(cx, cz - fi*d*0.05, false, Math.min(w*0.5,4.2), 1.1);
    propBench(cx-1.2, cz + fi*d*0.12, false);
    propBench(cx+1.2, cz + fi*d*0.12, false);
    propBrazier(cx - w*0.32, cz + fi*d*0.2, true);
    propBrazier(cx + w*0.32, cz + fi*d*0.2, true);
    propRack(cx + w*0.3, cz - fi*(d/2-1.4), false);
    propRack(cx - w*0.3, cz - fi*(d/2-1.4), false);
  } else if(interior==='barracks'){
    propRack(cx - w*0.25, cz - fi*(d/2-1.2), false);
    propRack(cx + w*0.25, cz - fi*(d/2-1.2), false);
    propCrate(cx - w*0.3, cz + fi*d*0.25, 0.9);
    propCrate(cx - w*0.3+0.95, cz + fi*d*0.25+0.3, 0.7);
    propBench(cx + w*0.2, cz + fi*d*0.2, false);
    propBrazier(cx, cz + fi*d*0.05, false);
    propBed(cx + w*0.3, cz - fi*d*0.3, true);
  } else if(interior==='temple'){
    scene.add(box(2.0,1.0,1.0, M(0xd8d2c0), cx,y+0.62,cz-fi*(d/2-1.6)));
    scene.add(box(2.1,0.12,1.1, M(COL_GOLD), cx,y+1.16,cz-fi*(d/2-1.6)));
    addCollider(cx-1.05,cz-fi*(d/2-1.6)-0.55,cx+1.05,cz-fi*(d/2-1.6)+0.55);
    addFlame(cx-0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    addFlame(cx+0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    propBench(cx - w*0.28, cz+fi*d*0.05, true);
    propBench(cx + w*0.28, cz+fi*d*0.05, true);
    propBench(cx, cz+fi*d*0.28, false);
  } else if(interior==='church'){
    scene.add(box(1.7,1.0,0.9, M(0xe8e0cf), cx,y+0.62,cz-fi*(d/2-1.5)));
    scene.add(box(0.12,0.8,0.12, M(COL_GOLD), cx,y+1.5,cz-fi*(d/2-1.5)));
    scene.add(box(0.5,0.1,0.1, M(COL_GOLD), cx,y+1.62,cz-fi*(d/2-1.5)));
    addCollider(cx-0.85,cz-fi*(d/2-1.5)-0.45,cx+0.85,cz-fi*(d/2-1.5)+0.45);
    addFlame(cx-0.6,y+0.6,cz-fi*(d/2-2.6),0.7);
    addFlame(cx+0.6,y+0.6,cz-fi*(d/2-2.6),0.7);
    propBench(cx - w*0.25, cz+fi*d*0.1, true);
    propBench(cx + w*0.25, cz+fi*d*0.1, true);
    propBench(cx - w*0.25, cz+fi*d*0.32, true);
    propBench(cx + w*0.25, cz+fi*d*0.32, true);
    propIconShelf(cx, cz-fi*(d/2-1.5)+0.8);
  } else if(interior==='long'){
    var pit=cyl(1.3,1.5,0.25, M(0x777772), 12); pit.position.set(cx,y+0.2,cz); scene.add(pit);
    addFlame(cx,y+0.75,cz,1.9);
    propBench(cx-2.2, cz, true);
    propBench(cx+2.2, cz, true);
    propTable(cx, cz-d*0.28, false, 2.4, 1.0);
    propRack(cx+w*0.32, cz+d*0.2, true);
    propBed(cx - w*0.3, cz + d*0.3, true);
  }
  /* ---------- EXTENDED INTERIORS ---------- */
  else if(interior==='watchtower'){
    // Spiral staircase circling inner wall
    for(var s=0;s<8;s++){
      var a=s/8*TAU, rx=Math.cos(a)*(w*0.38), rz=Math.sin(a)*(d*0.38);
      scene.add(box(0.8,0.15,0.6, M(0x5d4a38), cx+rx, y+0.3+s*0.7, cz+rz));
    }
    // Lookout balcony
    scene.add(box(w*0.9,0.15,d*0.3, M(0x6d5a3e), cx, y+h-0.5, cz+fi*d*0.35));
    // Weapon racks
    propRack(cx - w*0.3, cz - fi*(d/2-1.2), false);
    propRack(cx + w*0.3, cz - fi*(d/2-1.2), false);
    // Signal fire brazier
    propBrazier(cx, cz, false);
    addFlame(cx, y+1.2, cz, 1.0);
    // Logbook table
    propTable(cx, cz+fi*d*0.2, false, 1.2, 0.8);
    scene.add(box(0.4,0.05,0.3, M(0xe8dcc0), cx, y+0.9, cz+fi*d*0.2));
  } else if(interior==='cave' || interior==='hermit_cave'){
    // Carved stone alcoves with clay pots
    for(var a2=0;a2<3;a2++){
      scene.add(box(0.6,0.4,0.5, M(0x8a7a6a), cx-1.2+a2*1.2, y+0.8, cz-fi*d*0.3));
      scene.add(box(0.3,0.3,0.3, M(0xb59a63), cx-1.2+a2*1.2, y+1.15, cz-fi*d*0.3));
    }
    propCrate(cx + w*0.3, cz + fi*d*0.2, 0.8);
    propIconShelf(cx - w*0.2, cz+fi*d*0.1);
    // Fire pit soot-blackened
    var pit2=cyl(0.9,1.0,0.2, M(0x2a2a2a), 10); pit2.position.set(cx,y+0.15,cz); scene.add(pit2);
    addFlame(cx,y+0.5,cz,0.9);
    // Straw bed
    propBed(cx + w*0.25, cz - fi*d*0.25, false);
  } else if(interior==='mountain_fort' || interior==='fortress'){
    // Barracks bunk beds wool blankets
    propBed(cx - w*0.3, cz - fi*d*0.25, false);
    propBed(cx - w*0.3, cz + fi*d*0.25, false);
    // Armory racks swords shields spears
    propRack(cx + w*0.35, cz - fi*d*0.3, false);
    propRack(cx + w*0.35, cz + fi*d*0.3, false);
    // Chapel wooden benches icons candles
    propBench(cx, cz+fi*d*0.1, true);
    propIconShelf(cx, cz-fi*d*0.35);
    addFlame(cx-0.6,y+1.0,cz-fi*d*0.35,0.6); addFlame(cx+0.6,y+1.0,cz-fi*d*0.35,0.6);
    // War room carved wooden strategy table
    propTable(cx, cz, false, 2.2, 1.2);
    scene.add(box(0.8,0.05,0.6, M(0x8a9a6a), cx, y+0.95, cz));
    // Storage cellar barrels crates dried food
    propCrate(cx - w*0.35, cz, 0.9); propCrate(cx - w*0.35, cz+0.8, 0.7);
    scene.add(cyl(0.4,0.4,0.6, M(0x5d4a38), 8).translateX(cx+w*0.35).translateY(y+0.3).translateZ(cz));
  } else if(interior==='monastery' || interior==='monastery_hall'){
    // Prayer hall iconostasis
    scene.add(box(w*0.8,2.2,0.2, M(0x8a7a5e), cx, y+1.1, cz-fi*d*0.4));
    propIconShelf(cx, cz-fi*d*0.4+0.3);
    for(var ic=0;ic<5;ic++) scene.add(box(0.2,0.4,0.05, M(0xc9a227), cx-1.0+ic*0.5, y+1.5, cz-fi*d*0.4+0.25));
    // Monk cells simple beds
    propBed(cx - w*0.3, cz+fi*d*0.2, true); propBed(cx + w*0.3, cz+fi*d*0.2, true);
    // Library scrolls manuscripts
    propScrollShelf(cx - w*0.3, cz);
    // Candle workshop wax vats
    scene.add(cyl(0.5,0.5,0.6, M(0xe8dcc0), 8).translateX(cx+w*0.3).translateY(y+0.4).translateZ(cz));
    addFlame(cx+w*0.3, y+0.9, cz, 0.5);
  } else if(interior==='outpost' || interior==='frostwind_outpost'){
    propBed(cx - w*0.3, cz, true); propBed(cx + w*0.3, cz, true);
    propCrate(cx, cz-fi*d*0.3, 0.8); propCrate(cx+0.8, cz-fi*d*0.3, 0.7);
    propRack(cx - w*0.35, cz, false);
    var pit3=cyl(0.8,0.9,0.15, M(0x2a2a2a), 10); pit3.position.set(cx,y+0.15,cz+fi*d*0.2); scene.add(pit3);
    addFlame(cx,y+0.45,cz+fi*d*0.2,0.8);
    // Observation deck
    scene.add(box(w*0.6,0.1,d*0.25, M(0x5d4a38), cx, y+h-0.6, cz+fi*d*0.35));
  } else if(interior==='townhall'){
    // Oak floors, banners, council chamber long table
    propTable(cx, cz, false, w*0.7, 1.2);
    for(var b=0;b<4;b++){
      propBench(cx - w*0.3 + b*0.6, cz - d*0.2, false);
      propBench(cx - w*0.3 + b*0.6, cz + d*0.2, false);
    }
    // Banners
    scene.add(box(0.05,1.2,0.8, M(0xc0272d), cx - w*0.4, y+1.5, cz));
    scene.add(box(0.05,1.2,0.8, M(0x2a5caa), cx + w*0.4, y+1.5, cz));
  } else if(interior==='forge' || interior==='blacksmith'){
    propAnvil(cx, cz);
    scene.add(box(1.2,1.0,0.8, M(0x4a4a4a), cx+1.2, y+0.5, cz));
    addFlame(cx+1.2, y+1.2, cz, 0.9);
    propRack(cx - w*0.3, cz, false);
    propRack(cx + w*0.3, cz, false);
  } else if(interior==='tavern'){
    // Fireplace long tables barrels upstairs straw beds
    interiorHearth(cx, cz+fi*d*0.35, -fi, w, d);
    propTable(cx, cz, false, 3.0, 1.0);
    propTable(cx, cz+fi*d*0.15, false, 2.4, 0.9);
    propBench(cx-1.5, cz, false); propBench(cx+1.5, cz, false);
    scene.add(cyl(0.4,0.4,0.6, M(0x5d4a38), 8).translateX(cx-w*0.35).translateY(y+0.3).translateZ(cz));
    scene.add(cyl(0.4,0.4,0.6, M(0x5d4a38), 8).translateX(cx+w*0.35).translateY(y+0.3).translateZ(cz));
    // Upstairs hint
    scene.add(box(w*0.8,0.1,d*0.4, M(0x5d4a38), cx, y+2.2, cz-fi*d*0.25));
    propBed(cx - w*0.25, cz-fi*d*0.25, true); // straw bed upstairs representation
  } else if(interior==='scribe' || interior==='school'){
    for(var desk=0;desk<3;desk++){
      propTable(cx -1.2+desk*1.2, cz, false, 0.9, 0.6);
      scene.add(box(0.12,0.12,0.12, M(0x2a2a2a), cx -1.2+desk*1.2, y+0.85, cz));
      scene.add(box(0.3,0.05,0.4, M(0xe8dcc0), cx -1.2+desk*1.2+0.2, y+0.85, cz));
    }
    propScrollShelf(cx - w*0.35, cz+fi*d*0.2);
    propBench(cx, cz+fi*d*0.3, false);
  } else if(interior==='guardhouse'){
    // Jail cells iron bars
    scene.add(box(0.08,2.0,2.0, M(0x4a4a4a), cx - w*0.3, y+1.0, cz));
    for(var bar=0;bar<4;bar++) scene.add(box(0.05,2.0,0.05, M(0x2a2a2a), cx - w*0.3+bar*0.4-0.6, y+1.0, cz));
    propRack(cx + w*0.3, cz, false);
    propTable(cx, cz+fi*d*0.2, false, 1.0, 0.7);
    // Duty roster board
    scene.add(box(1.0,0.7,0.05, M(0x8a7a5e), cx, y+1.2, cz-fi*d*0.4));
  } else if(interior==='watermill'){
    scene.add(cyl(1.2,1.2,0.3, M(0x8a8a8a), 12).translateX(cx).translateY(y+0.4).translateZ(cz));
    scene.add(cyl(0.9,0.9,0.25, M(0x6a6a6a), 12).translateX(cx).translateY(y+0.8).translateZ(cz));
    for(var sack=0;sack<3;sack++) scene.add(box(0.5,0.4,0.3, M(0xe8dcc0), cx-1.0+sack*1.0, y+0.3, cz+1.0));
  } else if(interior==='hunter' || interior==='hunters_cabin'){
    propRack(cx - w*0.3, cz, false);
    // Pelts
    scene.add(box(1.2,0.05,0.8, M(0x5d4a38), cx, y+1.0, cz-fi*d*0.35));
    // Trap storage
    propCrate(cx + w*0.3, cz, 0.7); propCrate(cx + w*0.3, cz+0.7, 0.6);
    interiorHearth(cx, cz+fi*d*0.3, -fi, w, d);
  } else if(interior==='bathhouse'){
    for(var tub=0;tub<2;tub++){
      scene.add(cyl(0.7,0.7,0.5, M(0x8a7a5e), 10).translateX(cx-1.0+tub*2.0).translateY(y+0.3).translateZ(cz));
      scene.add(box(0.6,0.1,0.6, M(0x6a8a7a), cx-1.0+tub*2.0, y+0.35, cz));
    }
    // Heated stones
    for(var st=0;st<5;st++) scene.add(sph(0.15, M(0x5a5a5a), 5,4).translateX(cx-1.0+st*0.5).translateY(y+0.15).translateZ(cz+1.0));
    addFlame(cx, y+0.3, cz+1.0, 0.5);
  } else if(interior==='palace' || interior==='royal_palace'){
    // Throne room golden throne marble columns red banners
    propThrone(cx, cz-fi*d*0.35, fi);
    scene.add(box(0.3, h*0.8, 0.3, M(0xd8d2c0), cx-w*0.4, y+h*0.4, cz));
    scene.add(box(0.3, h*0.8, 0.3, M(0xd8d2c0), cx+w*0.4, y+h*0.4, cz));
    scene.add(box(0.05,1.5,1.0, M(0xc0272d), cx-w*0.4+0.3, y+1.8, cz));
    scene.add(box(0.05,1.5,1.0, M(0xc0272d), cx+w*0.4-0.3, y+1.8, cz));
    // Royal chambers velvet beds
    propBed(cx - w*0.3, cz+fi*d*0.2, false);
    // War council maps
    propTable(cx, cz, false, 2.5, 1.4);
    scene.add(box(1.0,0.05,0.7, M(0x8a9a6a), cx, y+0.95, cz));
    // Treasury gold chests
    scene.add(box(0.8,0.5,0.5, M(0xc9a227), cx+w*0.35, y+0.3, cz-fi*d*0.2));
    // Library manuscripts garden courtyard fountains
    propScrollShelf(cx - w*0.35, cz);
    scene.add(cyl(0.5,0.5,0.1, M(0x3f6a8a), 10).translateX(cx).translateY(y+0.15).translateZ(cz+fi*d*0.3));
  } else if(interior==='cathedral'){
    // Iconostasis marble floor choir balcony crypt
    scene.add(box(w*0.8,2.4,0.2, M(0xe8e0cf), cx, y+1.2, cz-fi*d*0.4));
    for(var ci2=0;ci2<4;ci2++) scene.add(box(0.25,0.5,0.05, M(0xc9a227), cx-0.9+ci2*0.6, y+1.5, cz-fi*d*0.4+0.15));
    // Marble floor
    // Choir balcony
    scene.add(box(w*0.6,0.1,d*0.25, M(0x5d4a38), cx, y+2.2, cz+fi*d*0.3));
    // Benches
    propBench(cx - w*0.25, cz, true); propBench(cx + w*0.25, cz, true);
    addFlame(cx-1.0,y+1.0,cz-fi*d*0.4+0.3,0.6); addFlame(cx+1.0,y+1.0,cz-fi*d*0.4+0.3,0.6);
    // Crypt hint
    scene.add(box(1.0,0.2,0.5, M(0x5a5a5a), cx, y+0.15, cz+fi*d*0.35));
  } else if(interior==='market' || interior==='grand_market'){
    propTable(cx, cz, false, 2.0, 1.0);
    for(var cr=0;cr<3;cr++) propCrate(cx-1.2+cr*1.2, cz+1.0, 0.6);
    scene.add(box(0.8,0.6,0.4, M(0xc9b24a), cx, y+0.9, cz)); // goods
    propBench(cx, cz+fi*d*0.25, false);
  } else if(interior==='inn' || interior==='drumul_inn'){
    // Beds kitchen stable
    propBed(cx - w*0.3, cz - fi*d*0.2, false); propBed(cx + w*0.3, cz - fi*d*0.2, false);
    interiorHearth(cx, cz+fi*d*0.3, -fi, w, d);
    propTable(cx, cz, false, 2.2, 0.9);
    scene.add(cyl(0.35,0.35,0.5, M(0x5d4a38), 8).translateX(cx-w*0.35).translateY(y+0.3).translateZ(cz));
  } else if(interior==='warcamp' || interior==='war_camp'){
    // Commander tent interior
    propTable(cx, cz, false, 1.8, 1.0);
    scene.add(box(0.6,0.05,0.5, M(0x8a9a6a), cx, y+0.95, cz));
    propCrate(cx - w*0.3, cz, 0.8); propCrate(cx + w*0.3, cz, 0.7);
    propBed(cx, cz+fi*d*0.25, true);
    propRack(cx - w*0.35, cz-fi*d*0.2, false);
  } else if(interior==='forestvillage' || interior==='herbalist' || interior==='woodcutter'){
    propTable(cx, cz, false, 1.4, 0.8);
    for(var herb=0;herb<4;herb++) scene.add(box(0.15,0.3,0.15, M(0x4a7a37), cx-0.6+herb*0.4, y+0.9, cz+0.5));
    propBed(cx + w*0.25, cz, true);
    scene.add(box(1.0,0.1,0.4, M(0x5d4a38), cx, y+1.2, cz-fi*d*0.3)); // drying rack
  } else if(interior==='tradepost' || interior==='checkpoint' || interior==='workshop'){
    propTable(cx, cz, false, 1.6, 0.9);
    propCrate(cx - w*0.3, cz, 0.9); propCrate(cx + w*0.3, cz, 0.8);
    propCrate(cx, cz+1.0, 0.7);
    if(interior==='checkpoint'){
      propRack(cx - w*0.3, cz-fi*d*0.2, false);
    }
  } else if(interior==='secret' || interior==='bandit' || interior==='crypt' || interior==='witch'){
    // Dark, mysterious
    var pit4=cyl(0.9,1.0,0.2, M(0x2a2a2a), 10); pit4.position.set(cx,y+0.15,cz); scene.add(pit4);
    if(Math.random()<0.7) addFlame(cx,y+0.5,cz,0.7);
    propCrate(cx + w*0.3, cz, 0.8);
    scene.add(box(0.5,0.4,0.3, M(0xc9a227), cx - w*0.2, y+0.4, cz));
    propIconShelf(cx, cz-fi*d*0.3);
  } else {
    // fallback house
    propTable(cx - w*0.22, cz - fi*d*0.15, false, 1.6, 0.9);
    propBench(cx - w*0.22, cz - fi*d*0.15 + (o.door==='S'?0.7:-0.7), false);
    propBed(cx + w*0.28, cz + fi*d*0.22, false);
    propCrate(cx + w*0.32, cz - fi*d*0.28, 0.8);
    interiorHearth(cx, cz + fi*(d/2-0.45), -fi, w, d);
  }
}

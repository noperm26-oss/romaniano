/*
  buildBuilding: the detailed tier. The shell (walls with real window and
  door openings, plinth, eaves, roof, chimney, porch) comes from
  architecture.js; collision comes from wallColliders; this file only
  furnishes the inside.
  o = {x, z, w, d, h, wall, roofCol, roof:'gable'|'thatch'|'church'|'temple'|'long',
       door:'S'|'N', interior:'hall'|'house'|'barracks'|'temple'|'church'|'long', fac}
*/
function interiorHearth(cx,cz,fi,w,d){
  var y=groundH(cx,cz);
  scene.add(box(2.2,0.4,0.9, M(0x8f8a80), cx, y+0.3, cz));
  scene.add(box(2.4,2.4,0.45, M(0x7d7669), cx, y+1.5, cz));
  scene.add(box(1.5,1.1,0.5, M(0x241d16), cx, y+0.75, cz+fi*0.28));
  addFlame(cx, y+0.6, cz+fi*0.45, 1.1);
  scene.add(box(2.6,0.16,0.7, M(0x5d4326), cx, y+2.75, cz+fi*0.1));
}
function buildBuilding(o){
  BUILD_COUNT++;
  var cx=o.x, cz=o.z, w=o.w, d=o.d, h=o.h;
  var y=groundH(cx,cz);
  structShell(o);
  wallColliders(cx,cz,w,d,h,o.door);
  /* ------- interior furnishings ------- */
  var fi=o.door==='S'?-1:1; /* furniture pushed away from the door */
  if(o.interior==='house'){
    propTable(cx - w*0.22, cz - fi*d*0.15, false, 1.6, 0.9);
    propBench(cx - w*0.22, cz - fi*d*0.15 + (o.door==='S'?0.7:-0.7), false);
    propBed(cx + w*0.28, cz + fi*d*0.22, false);
    propCrate(cx + w*0.32, cz - fi*d*0.28, 0.8);
    interiorHearth(cx, cz + fi*(d/2-0.45), -fi, w, d);
  } else if(o.interior==='hall'){
    propThrone(cx, cz - fi*(d/2-1.6), fi);
    propTable(cx, cz - fi*d*0.05, false, Math.min(w*0.5,4.2), 1.1);
    propBench(cx-1.2, cz + fi*d*0.12, false);
    propBench(cx+1.2, cz + fi*d*0.12, false);
    propBrazier(cx - w*0.32, cz + fi*d*0.2, true);
    propBrazier(cx + w*0.32, cz + fi*d*0.2, true);
    propRack(cx + w*0.3, cz - fi*(d/2-1.4), false);
    propRack(cx - w*0.3, cz - fi*(d/2-1.4), false);
  } else if(o.interior==='barracks'){
    propRack(cx - w*0.25, cz - fi*(d/2-1.2), false);
    propRack(cx + w*0.25, cz - fi*(d/2-1.2), false);
    propCrate(cx - w*0.3, cz + fi*d*0.25, 0.9);
    propCrate(cx - w*0.3+0.95, cz + fi*d*0.25+0.3, 0.7);
    propBench(cx + w*0.2, cz + fi*d*0.2, false);
    propBrazier(cx, cz + fi*d*0.05, false);
    propBed(cx + w*0.3, cz - fi*d*0.3, true);
  } else if(o.interior==='temple'){
    scene.add(box(2.0,1.0,1.0, M(0xd8d2c0), cx,y+0.62,cz-fi*(d/2-1.6)));
    scene.add(box(2.1,0.12,1.1, M(COL_GOLD), cx,y+1.16,cz-fi*(d/2-1.6)));
    addCollider(cx-1.05,cz-fi*(d/2-1.6)-0.55,cx+1.05,cz-fi*(d/2-1.6)+0.55);
    addFlame(cx-0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    addFlame(cx+0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    propBench(cx - w*0.28, cz+fi*d*0.05, true);
    propBench(cx + w*0.28, cz+fi*d*0.05, true);
    propBench(cx, cz+fi*d*0.28, false);
  } else if(o.interior==='church'){
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
  } else if(o.interior==='long'){
    var pit=cyl(1.3,1.5,0.25, M(0x777772), 12); pit.position.set(cx,y+0.2,cz); scene.add(pit);
    addFlame(cx,y+0.75,cz,1.9);
    propBench(cx-2.2, cz, true);
    propBench(cx+2.2, cz, true);
    propTable(cx, cz-d*0.28, false, 2.4, 1.0);
    propRack(cx+w*0.32, cz+d*0.2, true);
    propBed(cx - w*0.3, cz + d*0.3, true);
  }
}

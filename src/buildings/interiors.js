function buildBuilding(o){
  BUILD_COUNT++;
  var cx=o.x, cz=o.z, w=o.w, d=o.d, h=o.h;
  var y=groundH(cx,cz);
  var wallM=M(o.wall);
  var roofM=M(o.roofCol);
  /* floor slab */
  var fl=box(w+0.5,0.24,d+0.5, M(o.floorCol||0x8a7a5c), cx,y+0.1,cz);
  fl.receiveShadow=true; scene.add(fl);
  buildingWalls(cx,cz,w,d,h,wallM,o.door);
  if(o.roof==='gable'||o.roof==='thatch'||o.roof==='long'){
    gableRoof(cx,cz,w,d,y+h,roofM,o.roof!=='gable');
  } else if(o.roof==='temple'){
    /* columns + wide pediment roof */
    var cols=Math.max(4,Math.floor(w/2.6));
    for(var ci=0;ci<cols;ci++){
      var px=cx-w/2+1.2+ci*((w-2.4)/(cols-1));
      var col=cyl(0.32,0.36,h, M(o.colCol||0xe8e0cf), 10);
      col.position.set(px,y+h/2,cz+(o.door==='S'?d/2-0.9:-d/2+0.9));
      scene.add(col);
    }
    var ped=box(w+1.4,1.1,d+1.4, roofM, cx,y+h+0.5,cz);
    scene.add(ped);
    var ped2=cone(w*0.62,1.6, roofM, 4);
    ped2.rotation.y=Math.PI/4; ped2.position.set(cx,y+h+1.8,cz);
    scene.add(ped2);
  } else if(o.roof==='church'){
    gableRoof(cx,cz,w,d,y+h,roofM,false);
    /* tower + green dome + gold cross */
    var tw=cyl(1.5,1.7,3.2, M(o.wall), 10);
    tw.position.set(cx,y+h+1.4,cz-d/4);
    scene.add(tw);
    var drum=cyl(1.15,1.15,1.1, M(o.wall), 10);
    drum.position.set(cx,y+h+3.4,cz-d/4); scene.add(drum);
    var dome=sph(1.2, M(0x3f7a5e), 12,8);
    dome.scale.y=0.78; dome.position.set(cx,y+h+4.5,cz-d/4); scene.add(dome);
    var cv=box(0.09,0.95,0.09, M(COL_GOLD,{emissive:0x5a4a10}), cx,y+h+5.7,cz-d/4); scene.add(cv);
    scene.add(box(0.55,0.09,0.09, M(COL_GOLD,{emissive:0x5a4a10}), cx,y+h+5.8,cz-d/4));
  }
  /* ------- interior furnishings ------- */
  var fi=o.door==='S'?-1:1; /* furniture pushed away from the door */
  if(o.interior==='house'){
    propTable(cx - w*0.22, cz - fi*d*0.15, false, 1.6, 0.9);
    propBench(cx - w*0.22, cz - fi*d*0.15 + (o.door==='S'?0.7:-0.7), false);
    propBed(cx + w*0.28, cz + fi*d*0.22, false);
    propCrate(cx + w*0.32, cz - fi*d*0.28, 0.8);
    propBrazier(cx - w*0.3, cz + fi*d*0.1, false);
  } else if(o.interior==='hall'){
    propThrone(cx, cz - fi*(d/2-1.6), fi);
    propTable(cx, cz - fi*d*0.05, false, Math.min(w*0.5,4.2), 1.1);
    propBench(cx-1.2, cz + fi*d*0.12, false);
    propBench(cx+1.2, cz + fi*d*0.12, false);
    propBrazier(cx - w*0.32, cz + fi*d*0.2, true);
    propBrazier(cx + w*0.32, cz + fi*d*0.2, true);
    propRack(cx + w*0.3, cz - fi*(d/2-1.4), false);
  } else if(o.interior==='barracks'){
    propRack(cx - w*0.25, cz - fi*(d/2-1.2), false);
    propRack(cx + w*0.25, cz - fi*(d/2-1.2), false);
    propCrate(cx - w*0.3, cz + fi*d*0.25, 0.9);
    propCrate(cx - w*0.3+0.95, cz + fi*d*0.25+0.3, 0.7);
    propBench(cx + w*0.2, cz + fi*d*0.2, false);
    propBrazier(cx, cz + fi*d*0.05, false);
  } else if(o.interior==='temple'){
    var ay=groundH(cx,cz);
    scene.add(box(2.0,1.0,1.0, M(0xd8d2c0), cx,y+0.62,cz-fi*(d/2-1.6)));
    scene.add(box(2.1,0.12,1.1, M(COL_GOLD), cx,y+1.16,cz-fi*(d/2-1.6)));
    addCollider(cx-1.05,cz-fi*(d/2-1.6)-0.55,cx+1.05,cz-fi*(d/2-1.6)+0.55);
    addFlame(cx-0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    addFlame(cx+0.5,y+1.5,cz-fi*(d/2-1.6),0.8);
    propBench(cx - w*0.28, cz+fi*d*0.05, true);
    propBench(cx + w*0.28, cz+fi*d*0.05, true);
    propBench(cx, cz+fi*d*0.28, false);
  } else if(o.interior==='church'){
    var ay2=groundH(cx,cz);
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
    var fy2=groundH(cx,cz);
    var pit=cyl(1.3,1.5,0.25, M(0x777772), 12); pit.position.set(cx,y+0.2,cz); scene.add(pit);
    addFlame(cx,y+0.75,cz,1.9);
    propBench(cx-2.2, cz, true);
    propBench(cx+2.2, cz, true);
    propTable(cx, cz-d*0.28, false, 2.4, 1.0);
    propRack(cx+w*0.32, cz+d*0.2, true);
  }
}

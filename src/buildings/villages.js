/* ---------------- villages (v6): huts, fires, life in the wilds ---------------- */
function buildVillages(){
  VILLAGES.forEach(function(v, vi){
    var y=groundH(v.x,v.z);
    for(var h=0;h<4;h++){
      var a=h/4*TAU+0.5+vi*0.31;
      var hx=v.x+Math.cos(a)*10.5, hz=v.z+Math.sin(a)*10.5;
      buildBuilding({x:hx, z:hz, w:rand(5.6,7), d:rand(4.6,6), h:3.4,
        wall:choice([0x8a7a5e,0x7a6a50,0x94826a]), roofCol:choice([0x6d5a3e,0x5d4a38]),
        roof:h%2?'thatch':'gable', door:'N', interior:'house'});
    }
    propCrate(v.x+2.2, v.z+1.4, 0.6);
    propCrate(v.x-1.8, v.z+2.6, 0.5);
    /* v7 density: seven more structures per village */
    var hb=choice([0x8a7a5e,0x7a6a50,0x94826a]), rb=choice([0x6d5a3e,0x5d4a38]);
    solidBuilding(v.x+16, v.z+5.5, 5.5,4.5,3.2, hb, rb, 'gable');
    solidBuilding(v.x-14.5, v.z-3.5, 5,4.2,3.1, hb, rb, 'thatch');
    solidBuilding(v.x+3, v.z+17, 7.5,5.5,4, hb, rb, 'thatch');
    solidBuilding(v.x-4.5, v.z-16, 5.5,4.5,3.2, 0x6e6152, 0x4a4238, 'flat');
    var gx2=v.x+16.5, gz2=v.z-9.5, gy2=groundH(gx2,gz2);
    [[-1.6,-1.2],[1.6,-1.2],[-1.6,1.2],[1.6,1.2]].forEach(function(o){
      scene.add(box(0.16,1.7,0.16, NM(0x5d4326), gx2+o[0], gy2+0.85, gz2+o[1]));
    });
    scene.add(box(4.4,3,4.4, NM(hb), gx2, gy2+3.1, gz2));
    var gr2=cone(3.4,1.6, NM(rb), 4); gr2.rotation.y=Math.PI/4; gr2.position.set(gx2, gy2+5.4, gz2); scene.add(gr2);
    addCollider(gx2-2.2, gz2-2.2, gx2+2.2, gz2+2.2);
    BUILD_COUNT++;
    var chx=v.x-16.5, chz=v.z+7, chy=groundH(chx,chz);
    solidBuilding(chx, chz, 4.5,6.5,3.8, 0xd8d2c0, 0x5d4a38, 'gable');
    scene.add(box(0.14,1.7,0.14, NM(0x6d4a34), chx, chy+5.3, chz));
    scene.add(box(0.75,0.14,0.14, NM(0x6d4a34), chx, chy+5.6, chz));
    var wl2=v.x+2.5, wz2=v.z-19, wy2=groundH(wl2,wz2);
    scene.add(cyl(1.2,1.4,1, NM(0x8f8a80), 10).translateX(wl2).translateY(wy2+0.5).translateZ(wz2));
    scene.add(box(0.13,2.4,0.13, NM(0x5d4326), wl2-0.9, wy2+1.6, wz2));
    scene.add(box(0.13,2.4,0.13, NM(0x5d4326), wl2+0.9, wy2+1.6, wz2));
    var wr2=cone(1.5,0.8, NM(rb), 4); wr2.rotation.y=Math.PI/4; wr2.position.set(wl2, wy2+3.2, wz2); scene.add(wr2);
    addCollider(wl2-1.3, wz2-1.3, wl2+1.3, wz2+1.3);
    BUILD_COUNT++;
    for(var si=0; si<6; si++){
      var sa=si/6*TAU;
      scene.add(box(0.24,0.18,0.24, M(0x777772), v.x+Math.cos(sa)*0.55, y+0.08, v.z+Math.sin(sa)*0.55));
    }
    addFlame(v.x, y+0.7, v.z, 1.0);
    /* v7: village fires glow via flame cones only (fixed light budget) */
    registerLore({key:'village'+vi, x:v.x, z:v.z, r:34, icon:'V',
      name:'Satul '+v.name, sub:'Free village - under no banner',
      story:'Craftsmen, fields and quiet days. A village pays tribute to whoever holds the land it stands on - take the zone and its workers earn gold for your crown. Guard them: wolves and soldiers ask no permission.'});
  });
}

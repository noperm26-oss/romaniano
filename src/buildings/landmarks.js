function frescoTex(base,accent){
  var cv=document.createElement('canvas'); cv.width=256; cv.height=64;
  var g=cv.getContext('2d');
  g.fillStyle=base; g.fillRect(0,0,256,64);
  for(var i=0;i<8;i++){
    var x=i*32+16;
    g.fillStyle=accent; g.beginPath(); g.arc(x,34,11,Math.PI,0); g.fill();
    g.fillStyle='#f0e2ae'; g.beginPath(); g.arc(x,30,5.5,0,TAU); g.fill();
    g.fillStyle='#f0e2ae'; g.fillRect(x-4.5,34,9,16);
    g.fillStyle='#8a6d3b'; g.fillRect(x-7,20,14,2.5);
  }
  var t=new THREE.CanvasTexture(cv); return t;
}
function glyphTex(bg,fg,text){
  var cv=document.createElement('canvas'); cv.width=256; cv.height=96;
  var g=cv.getContext('2d');
  g.fillStyle=bg; g.fillRect(0,0,256,96);
  g.strokeStyle=fg; g.fillStyle=fg; g.lineWidth=6; g.lineCap='square';
  g.font='bold 34px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle';
  var lines=text.split('|');
  for(var i=0;i<lines.length;i++) g.fillText(lines[i],128,30+i*36);
  var t=new THREE.CanvasTexture(cv); return t;
}
function lmLight(x,y,z,base,dist){
  var l=new THREE.PointLight(0xff9a3c, base, dist||20, 2);
  l.position.set(x,y,z); scene.add(l);
  l.userData.base=base; nightLights.push(l); return l;
}
function torchPost(g,x,y,z){
  g.add(box(0.12,2.6,0.12, NM(0x4a3520), x,y+1.3,z));
  g.add(box(0.3,0.16,0.3, NM(0x4a3520), x,y+2.7,z));
  var f=addFlame(0,0,0,0.8); f.position.set(0,0,0); g.add(f); f.position.set(x,y+3,z);
  return f;
}
function lmGable(g,x,y,z,w,h,d,col){
  var r=cone(Math.max(w,d)*0.72, h, NM(col), 4);
  r.rotation.y=Math.PI/4; r.scale.x=w/(Math.max(w,d)*0.72)*1.05; r.scale.z=d/(Math.max(w,d)*0.72)*1.05;
  r.position.set(x,y+h/2,z); g.add(r); return r;
}
function bannerOn(g,x,y,z,tex){
  g.add(cyl(0.05,0.07,5.2, NM(0x4a3520), 6).translateX(x).translateY(y+2.6).translateZ(z));
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4,6,8), new THREE.MeshLambertMaterial({map:tex, side:THREE.DoubleSide}));
  fl.position.set(x+0.85,y+3.9,z); g.add(fl);
  waveBanners.push({m:fl, ph:rand(0,6)});
}

/* ---------- 1. Mănăstirea Voroneț — the "Sistine Chapel of the East" ---------- */
function wonderVoronet(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  /* nave: white stone base, the famous blue band with frescoes */
  g.add(box(15,3,9.5, NM(0xd8d2c0), 0,1.5,0));
  g.add(box(15,2.8,9.5, NM(0x2a5caa), 0,4.4,0));
  var fres=new THREE.Mesh(new THREE.PlaneGeometry(14.4,2.2), new THREE.MeshLambertMaterial({map:frescoTex('#2a5caa','#1d3f7a')}));
  fres.position.set(0,4.4,4.78); g.add(fres);
  var fres2=fres.clone(); fres2.position.z=-4.78; fres2.rotation.y=Math.PI; g.add(fres2);
  lmGable(g,0,5.8,0,11.5,3.4,10.5,0x5d4a38);
  /* apse (east) */
  var apse=cyl(3,3,5.6, NM(0x2a5caa), 10); apse.position.set(9,2.8,0); g.add(apse);
  var apseR=cone(3.4,2.2, NM(0x5d4a38), 10); apseR.position.set(9,6.7,0); g.add(apseR);
  /* bell tower (west front) */
  g.add(box(5,11,5, NM(0xd8d2c0), -9.5,5.5,0));
  g.add(box(5.4,1.2,5.4, NM(0x2a5caa), -9.5,8.6,0));
  var tRoof=cone(3.9,3.4, NM(0x5d4a38), 4); tRoof.rotation.y=Math.PI/4; tRoof.position.set(-9.5,12.8,0); g.add(tRoof);
  g.add(box(0.14,1.1,0.14, NM(0xc9a227), -9.5,15.2,0));
  g.add(box(0.6,0.14,0.14, NM(0xc9a227), -9.5,15.35,0));
  /* windows + door */
  g.add(box(1.1,2.2,0.2, NM(0x3a2c1c), 0,2.4,4.8));
  g.add(box(0.8,1.4,0.16, NM(0x2a1d10), -4,5.2,4.8)); g.add(box(0.8,1.4,0.16, NM(0x2a1d10), 4,5.2,4.8));
  /* candle pines + lamps around the church */
  for(var i=0;i<5;i++){ var a=i/5*TAU; g.add(cyl(0.05,0.05,rand(0.8,1.4), NM(0xe8dcc0), 5).translateX(Math.cos(a)*13).translateY(0.6).translateZ(Math.sin(a)*9)); }
  torchPost(g,-13,0,4); torchPost(g,-13,0,-4);
  lmLight(gx-13, y+3.2, gz+4, 0.85, 22); lmLight(gx-13, y+3.2, gz-4, 0.85, 22);
  addCollider(gx-12,gz-2.5,gx-7,gz+2.5);
  addCollider(gx-7,gz-4.8,gx+7,gz+4.8);
  addCollider(gx+7,gz-3,gx+11,gz+3);
  registerLore({key:'voronet', x:gx, z:gz, r:46, icon:'⛪',
    name:'Mănăstirea Voroneț', sub:'Voroneț Monastery · 1488',
    story:'Raised by Ștefan cel Mare to keep a vow after the disaster at Războieni, painted in 1547 under Petru Rareș. Its last judgment fresco glows in the legendary "Voroneț blue" — a pigment whose recipe was buried with its monks. People call it the Sistine Chapel of the East.'});
}

/* ---------- 2. Cetatea de Scaun — fortress throne of Moldavia ---------- */
function wonderCetatea(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  var wallM=NM(0x8d8578), wallD=NM(0x6f695e);
  /* ring walls (gap = south gate) */
  g.add(box(26,6,2.2, wallM, 0,3,-13));
  g.add(box(9,6,2.2, wallM, -8.5,3,13));
  g.add(box(9,6,2.2, wallM, 8.5,3,13));
  g.add(box(2.2,6,26, wallM, -13,3,0));
  g.add(box(2.2,6,26, wallM, 13,3,0));
  /* battlements */
  for(var i=-11;i<=11;i+=2.2){
    g.add(box(1.1,1,1.4, wallD, i,6.5,-13));
    if(Math.abs(i)>4.2){ g.add(box(1.1,1,1.4, wallD, i,6.5,13)); g.add(box(1.4,1,1.1, wallD, -13,6.5,i)); g.add(box(1.4,1,1.1, wallD, 13,6.5,i)); }
  }
  /* gate: pillars, lintel, portcullis (walk through!) */
  g.add(box(2.6,7.5,3, wallD, -4.7,3.75,13));
  g.add(box(2.6,7.5,3, wallD, 4.7,3.75,13));
  g.add(box(7,1.6,3, wallD, 0,8.3,13));
  for(var b=-1.5;b<=1.5;b+=0.75) g.add(box(0.14,5.6,0.14, NM(0x4a4038), b,2.9,13.6));
  /* corner drum towers */
  [[-13,-13],[13,-13],[-13,13],[13,13]].forEach(function(c){
    var t=cyl(2.9,3.2,9.5, wallM, 10); t.position.set(c[0],4.75,c[1]); g.add(t);
    var r=cone(3.6,3, NM(0x7a3b32), 10); r.position.set(c[0],11,c[1]); g.add(r);
    addCollider(gx+c[0]-2.6,gz+c[1]-2.6,gx+c[0]+2.6,gz+c[1]+2.6);
  });
  /* inner keep + banner */
  g.add(box(10,11.5,8, wallD, 0,5.75,-2));
  for(var k=-4;k<=4;k+=2) g.add(box(1,1,1.2, wallM, k,12,-2));
  g.add(box(1.6,2.6,0.3, NM(0x3a2c1c), 0,2,2.05));
  bannerOn(g,0,11.6,-2, FACS.moldavia.bannerTex);
  torchPost(g,-6.5,0,13.8); torchPost(g,6.5,0,13.8);
  lmLight(gx-6.5,y+3.2,gz+13.8,0.9,24); lmLight(gx+6.5,y+3.2,gz+13.8,0.9,24);
  addCollider(gx-14.2,gz-14.2,gx+14.2,gz-11.8);
  addCollider(gx-14.2,gz+11.8,gx-4.8,gz+14.2);
  addCollider(gx+4.8,gz+11.8,gx+14.2,gz+14.2);
  addCollider(gx-14.2,gz-14.2,gx-11.8,gz+14.2);
  addCollider(gx+11.8,gz-14.2,gx+14.2,gz+14.2);
  addCollider(gx-5,gz-6,gx+5,gz+2);
  registerLore({key:'cetatea', x:gx, z:gz, r:52, icon:'🏰',
    name:'Cetatea de Scaun a Sucevei', sub:'Seat Fortress of Suceava · 1388',
    story:'The stone seat of Moldavian princes, rebuilt by Petru II Mușat and braced by Ștefan cel Mare. In 1476 Sultan Mehmed II — the conqueror of Constantinople — sat before these walls for days and left with his banners unfed. The fortress was never taken by storm.'});
}

/* ---------- 3. Putna — where Stephen the Great sleeps ---------- */
function wonderPutna(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  g.add(box(11,2.8,7.5, NM(0xd8d2c0), 0,1.4,0));
  g.add(box(11,2.4,7.5, NM(0x7a2f35), 0,4,0));
  var fr=new THREE.Mesh(new THREE.PlaneGeometry(10.4,1.9), new THREE.MeshLambertMaterial({map:frescoTex('#7a2f35','#5a1f24')}));
  fr.position.set(0,4,3.8); g.add(fr);
  lmGable(g,0,5.2,0,9,2.8,8.4,0x5d4a38);
  g.add(box(4,9,4, NM(0xd8d2c0), -6.5,4.5,0));
  var tr=cone(3.1,2.8, NM(0x5d4a38), 4); tr.rotation.y=Math.PI/4; tr.position.set(-6.5,10.4,0); g.add(tr);
  g.add(box(0.12,0.9,0.12, NM(0xc9a227), -6.5,12.2,0));
  /* the voivode's tomb slab + votive cross */
  g.add(box(2.3,0.55,1.1, NM(0x8d8578), 2,0.28,6.6));
  g.add(box(2.0,0.12,0.9, NM(0xc9a227), 2,0.58,6.6));
  g.add(box(0.34,2.6,0.34, NM(0x9a9284), -3.5,1.3,6.8));
  g.add(box(1.3,0.3,0.3, NM(0x9a9284), -3.5,2.1,6.8));
  g.add(box(1.0,0.28,0.28, NM(0x9a9284), -3.5,1.5,6.8));
  torchPost(g,-9.5,0,4.5);
  lmLight(gx-9.5,y+3.2,gz+4.5,0.8,20);
  addCollider(gx-5.5,gz-3.8,gx+5.5,gz+3.8);
  addCollider(gx-8.5,gz-2,gx-4.5,gz+2);
  registerLore({key:'putna', x:gx, z:gz, r:40, icon:'✝️',
    name:'Mănăstirea Putna', sub:'Putna Monastery · 1469',
    story:'"My vineyard of prayer" — that is how Ștefan cel Mare called Putna, built on a hill he chose himself. His tomb lies just inside: the king who reigned forty-seven years sleeps beneath a stone slab, crowned in stone, facing the sunrise.'});
}

/* ---------- 4. Curtea Domnească & Turnul lui Ștefan ---------- */
function wonderCurtea(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  /* princely hall */
  g.add(box(16,5.2,8, NM(0xa89a80), 0,2.6,4));
  lmGable(g,0,5.2,4,13,2.6,9,0x6d4a34);
  g.add(box(1.8,2.6,0.3, NM(0x3a2c1c), 0,1.3,8.2));
  for(var i=-6;i<=6;i+=3) g.add(box(0.7,1.2,0.15, NM(0x2a1d10), i,3.6,8.1));
  /* Stephen's tower — tall, thin, gold crown */
  g.add(box(5,14,5, NM(0x8d8578), -9,7,-4));
  for(var lv=7;lv<=14;lv+=3.5) g.add(box(5.5,0.5,5.5, NM(0x6f695e), -9,lv,-4));
  var tRoof=cone(4,3, NM(0x5d4a38), 4); tRoof.rotation.y=Math.PI/4; tRoof.position.set(-9,17,-4); g.add(tRoof);
  g.add(box(0.12,1,0.12, NM(0xc9a227), -9,19.2,-4));
  bannerOn(g,-9,13.5,-1.2, FACS.moldavia.bannerTex2);
  /* low courtyard walls */
  g.add(box(2,2.6,14, NM(0x8d8578), 9,1.3,-2));
  g.add(box(10,2.6,2, NM(0x8d8578), 3,1.3,-8));
  torchPost(g,7,0,9);
  lmLight(gx+7,y+3.2,gz+9,0.85,22);
  addCollider(gx-8,gz,gx+8,gz+8);
  addCollider(gx-11.5,gz-6.5,gx-6.5,gz-1.5);
  addCollider(gx+8,gz-9,gx+10,gz+5);
  addCollider(gx-2,gz-9,gx+8,gz-7);
  registerLore({key:'curtea', x:gx, z:gz, r:44, icon:'👑',
    name:'Curtea Domnească', sub:'Princely Court & Stephen\'s Tower',
    story:'Where the princes of Moldavia were raised onto the throne on a shield and given the sword of the land. The tall tower kept the treasury, the archives and the watch — and from its balcony the chronicles say you can count three lands on a clear day.'});
}

/* ---------- 5. Hanul Vechi — the inn on the trade road ---------- */
function wonderHan(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  g.add(box(11,3.2,7, NM(0xb09a6e), 0,1.6,0));
  g.add(box(11.6,2.6,6, NM(0x9c8760), 0,4.5,0.5));     /* overhung upper floor */
  lmGable(g,0,5.8,0.5,10.5,2.6,7.2,0x5d4a38);
  /* balcony rail + posts */
  g.add(box(11,0.09,0.09, NM(0x4a3520), 0,5.7,3.4));
  for(var i=-5;i<=5;i+=2.2) g.add(box(0.09,0.9,0.09, NM(0x4a3520), i,5.3,3.4));
  /* stairs + door + windows */
  g.add(box(1.6,0.22,1, NM(0x7a5c39), 0,0.35,3.9));
  g.add(box(1.6,0.22,0.8, NM(0x7a5c39), 0,0.68,3.6));
  g.add(box(1.4,2.2,0.2, NM(0x3a2c1c), 0,1.2,3.55));
  g.add(box(1,0.9,0.14, NM(0x2a1d10), -3.4,1.8,3.52)); g.add(box(1,0.9,0.14, NM(0x2a1d10), 3.4,1.8,3.52));
  /* the HAN sign */
  var sign=new THREE.Mesh(new THREE.PlaneGeometry(1.7,0.64), new THREE.MeshLambertMaterial({map:glyphTex('#3a2c1c','#e9c458','HAN')}));
  sign.position.set(2.6,3.1,3.6); sign.rotation.z=-0.06; g.add(sign);
  /* stable fence + cart */
  for(var f=0;f<5;f++) g.add(box(0.12,1.0,0.12, NM(0x4a3520), 7, 0.5, -2.5+f*1.1));
  g.add(box(0.12,0.12,5.0, NM(0x4a3520), 7, 1.0, -0.4));
  torchPost(g,-6.5,0,4.2);
  lmLight(gx-6.5,y+3.2,gz+4.2,0.8,20);
  addCollider(gx-5.5,gz-3.5,gx+5.5,gz+3.5);
  registerLore({key:'han', x:gx, z:gz, r:36, icon:'🍺',
    name:'Hanul Vechi', sub:'The Old Inn on the Moldavian Road',
    story:'Salt from the Ocna mines, wax, hides and tall tales all changed hands under this roof. Moldavian hans fed the merchants who walked the road to Lviv — and any soldier of any banner paid the same for a bed, as long as he left his quarrel at the door.'});
}

/* ---------- 6. Statuia lui Ștefan cel Mare ---------- */
function wonderStatue(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  g.add(box(3.2,0.5,3.2, NM(0x8d8578), 0,0.25,0));
  g.add(box(2.4,2,2.4, NM(0x9a9284), 0,1.5,0));
  /* bronze voivode: cloak, crown, raised sword */
  var br=NM(0x4e5a52);
  g.add(box(0.62,0.28,0.62, NM(0x4a4038), -0.7,3.6,0));
  g.add(box(0.7,1,0.5, br, 0,4.3,0));
  g.add(box(0.36,0.3,0.36, NM(0xd8cfa8), 0,5.05,0));
  g.add(box(0.4,0.12,0.4, NM(0xc9a227), 0,5.3,0));
  g.add(box(0.1,0.12,0.1, NM(0xc9a227), 0,5.44,0));
  g.add(box(0.14,0.7,0.14, br, -0.45,4.2,0.1));
  g.add(box(0.16,0.85,0.16, br, 0.42,4.55,-0.1)); g.add(box(0.16,0.16,0.16, br, 0.42,5,-0.1));
  g.add(box(0.09,1.5,0.05, NM(0xb9c1c9), 0.42,5.7,-0.1));
  g.add(box(0.3,0.06,0.06, NM(0xc9a227), 0.42,6.2,-0.1));
  var pl=new THREE.Mesh(new THREE.PlaneGeometry(2.1,0.5), new THREE.MeshLambertMaterial({map:glyphTex('#2c2c28','#c9a227','ȘTEFAN CEL MARE|1457 · 1504')}));
  pl.position.set(0,1.55,1.21); g.add(pl);
  addCollider(gx-1.4,gz-1.4,gx+1.4,gz+1.4);
  registerLore({key:'stefan', x:gx, z:gz, r:30, icon:'⚔️',
    name:'Statuia lui Ștefan cel Mare', sub:'Stephen the Great · 1457–1504',
    story:'Forty-seven years on the throne, thirty-six battles fought. He raised forty thousand viteji with a word, beat the greatest army of his age at Vaslui, and was buried a monk. "Ștefan cel Mare și Sfânt" — the Great and the Holy.'});
}

/* ---------- 7. Troiță & the Salt Road camp ---------- */
function wonderTroita(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  /* wayside cross: post + upper + slanted lower bar + little roof */
  g.add(box(0.22,3.4,0.22, NM(0x6d4a34), 0,1.7,0));
  g.add(box(1.5,0.2,0.2, NM(0x6d4a34), 0,2.9,0));
  var low=box(1.3,0.18,0.18, NM(0x6d4a34), 0,1.5,0); low.rotation.z=0.28; g.add(low);
  var roof=cone(0.85,0.5, NM(0x5d4a38), 4); roof.rotation.y=Math.PI/4; roof.position.set(0,3.6,0); g.add(roof);
  /* flowers at the foot */
  for(var i=0;i<7;i++){ var a=rand(0,TAU), rr=rand(0.4,1.1);
    g.add(cyl(0.03,0.03,0.3, NM(0x3f6b35), 4).translateX(Math.cos(a)*rr).translateY(0.15).translateZ(Math.sin(a)*rr));
    g.add(sph(0.06, NM(choice([0xc94f4f,0xe9c458,0xd8d2c0])), 5,4).translateX(Math.cos(a)*rr).translateY(0.34).translateZ(Math.sin(a)*rr));
  }
  /* salt carts + sacks + fire ring */
  [[5.5,1.5,-0.4],[7.6,-1,0.5]].forEach(function(c){
    var cy=groundH(gx+c[0],gz+c[1])-y;
    g.add(box(2.2,0.5,1.3, NM(0x7a5c39), c[0],cy+0.7,c[1]));
    var w1=cyl(0.55,0.55,0.12, NM(0x4a3520), 8); w1.rotation.x=Math.PI/2; w1.position.set(c[0],cy+0.55,c[1]+0.72); g.add(w1);
    var w2=w1.clone(); w2.position.z=c[1]-0.72; g.add(w2);
    var salt=sph(0.6, NM(0xe8e4da), 7,5); salt.scale.set(1.4,0.7,1); salt.position.set(c[0],cy+1.15,c[1]); g.add(salt);
    var shaft=box(1.6,0.08,0.08, NM(0x4a3520), c[0]-1.8,cy+0.6,c[1]); g.add(shaft);
    addCollider(gx+c[0]-1.2,gz+c[1]-0.9,gx+c[0]+1.2,gz+c[1]+0.9);
  });
  for(var s=0;s<4;s++){ var sk=sph(0.34, NM(0xb59a63), 6,5); sk.scale.y=0.8; sk.position.set(rand(-2,2),0.3,rand(2.5,4)); g.add(sk); }
  var fx=3.2, fz=3.6;
  for(var si=0; si<6; si++){ var sa=si/6*TAU; g.add(box(0.26,0.2,0.26, NM(0x777772), fx+Math.cos(sa)*0.6, 0.1, fz+Math.sin(sa)*0.6)); }
  torchPost(g,-2.5,0,2.5);
  lmLight(gx-2.5,y+3.2,gz+2.5,0.75,18); lmLight(gx+fx,y+1.6,gz+fz,0.9,20);
  addCollider(gx-0.5,gz-0.5,gx+0.5,gz+0.5);
  registerLore({key:'troita', x:gx, z:gz, r:32, icon:'🪵',
    name:'Troiță și Drumul Sării', sub:'Wayside Cross on the Salt Road',
    story:'Ocna salt fed half of Europe through this road, carted night and day toward Poland. Shepherds and merchants raised troițe at the crossroads — slanted lower bar and all — to bless the journey. Lean a hand here and travel easy.'});
}

/* ---------- 8. Temple of Apollo at Amyclae (SPARTA) ---------- */
function wonderTemple(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  g.add(box(19,0.5,13, NM(0xcfc8b8), 0,0.25,0));
  g.add(box(17.6,0.5,11.6, NM(0xd8d2c0), 0,0.75,0));
  g.add(box(16.2,0.5,10.2, NM(0xcfc8b8), 0,1.25,0));
  var colM=NM(0xe4ddc8);
  for(var i=-2;i<=2;i++) for(var j=-1;j<=1;j++){
    if(Math.abs(i)<2 && j===0) continue;                     /* door gap front/back rows center */
    var c=cyl(0.42,0.48,4.6, colM, 8); c.position.set(i*3.4,3.8,j*4.2); g.add(c);
    g.add(box(0.95,0.18,0.95, NM(0xcfc8b8), i*3.4,1.55,j*4.2));
    addCollider(gx+i*3.4-0.55, gz+j*4.2-0.55, gx+i*3.4+0.55, gz+j*4.2+0.55);
  }
  g.add(box(17,0.8,9.6, colM, 0,6.5,0));
  lmGable(g,0,6.9,0,15,2,10.4,0xb59a63);
  /* pediment decorations + cult statue */
  g.add(box(2.2,1,0.4, NM(0xc9a227), 0,7.2,4.6));
  g.add(box(0.7,2.6,0.7, NM(0xd8cfa8), 0,3,0));
  g.add(box(1.1,1.4,0.7, NM(0xd8cfa8), 0,5.1,0));
  g.add(box(0.3,0.3,0.3, NM(0xc9a227), 0,6.05,0));
  addCollider(gx-1.4,gz-1.4,gx+1.4,gz+1.4);
  registerLore({key:'apollo', x:gx, z:gz, r:46, icon:'🏛️',
    name:'Temple of Apollo Amyklaios', sub:'Sanctuary south of Sparta',
    story:'Every summer Spartan youths danced the paean here for Apollo, the far-shooter who listened. On the ancient throne of Amyclae, older than the city\'s walls, the god\'s face was a bronze beam of light — the Spartans needed no golden idol to know him.'});
}

/* ---------- 9. Arch of Triumph (ROME) ---------- */
function wonderArch(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  var mar=NM(0xe0dac8), marD=NM(0xcfc8b8);
  g.add(box(3,9,4.4, mar, -5.5,4.5,0));
  g.add(box(3,9,4.4, mar, 5.5,4.5,0));
  g.add(box(8,3.4,4.4, mar, 0,7.3,0));           /* attic over the arch */
  g.add(box(11,1.4,4.8, marD, 0,9.7,0));
  g.add(box(0.5,7,0.4, marD, -3.6,3.5,2.25)); g.add(box(0.5,7,0.4, marD, 3.6,3.5,2.25));
  var insc=new THREE.Mesh(new THREE.PlaneGeometry(6.4,1.1), new THREE.MeshLambertMaterial({map:glyphTex('#e0dac8','#6e5a36','SENATVS|POPVLVSQVE·ROMANVS')}));
  insc.position.set(0,7.3,2.25); g.add(insc);
  var insc2=insc.clone(); insc2.position.z=-2.25; insc2.rotation.y=Math.PI; g.add(insc2);
  /* quadriga — four horses + chariot */
  g.add(box(2.4,0.9,1.4, NM(0xc9a227), 0,10.8,0));
  for(var hI=0;hI<4;hI++){
    var hx=-1.7+hI*1.15;
    g.add(box(0.55,1.1,1.7, NM(0x9a7c48), hx,11.6,-1.4));
    g.add(box(0.4,0.5,0.7, NM(0x9a7c48), hx,12.3,-2.3));
    g.add(box(0.5,0.5,0.3, NM(0x6e5230), hx,11.2,-0.6));
  }
  addCollider(gx-7,gz-2.2,gx-4,gz+2.2);
  addCollider(gx+4,gz-2.2,gx+7,gz+2.2);
  registerLore({key:'arch', x:gx, z:gz, r:42, icon:'🏛️',
    name:'Arcus Triumphalis', sub:'Gateway of the Victors',
    story:'Under this arch marched the legions with spoils, captives and painted faces of the vanquished. The Senate raised arches wherever a triumph passed — for one day the victor was a god, and Rome never let its soldiers forget what glory cost.'});
}

/* ---------- 10. Viking ship burial & runestone ---------- */
function wonderBurial(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  var stoneM=NM(0x8a9096);
  /* stone ship setting: two curved rows of standing stones */
  for(var i=0;i<9;i++){
    var a=(i/8)*Math.PI;                       /* half circle arcs */
    var lx=Math.cos(a)*7, lz=-Math.sin(a)*3.2;
    g.add(box(0.7,rand(1.2,1.9),0.5, stoneM, lx,0.7,lz));
    g.add(box(0.7,rand(1.2,1.9),0.5, stoneM, lx,0.7,-lz));
  }
  /* prow + stern stones taller */
  g.add(box(0.8,2.6,0.6, stoneM, -7,1.3,0));
  g.add(box(0.8,2.9,0.6, stoneM, 7,1.45,0));
  /* burial mound */
  var mound=sph(3.4, NM(0x67804a), 10,7); mound.scale.y=0.42; mound.position.set(0,0.3,0); g.add(mound);
  /* runestone */
  g.add(box(1.6,3.4,0.5, NM(0x9aa0a6), -5.5,1.7,0.5));
  var rs=new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.6), new THREE.MeshLambertMaterial({map:glyphTex('#5b6570','#d8dce0','ᚱᚢᚾᛖᛋ|ᛁᚴ·ᚹᚨᚱᚨ')}));
  rs.position.set(-5.5,1.8,0.78); rs.rotation.y=0.25; g.add(rs);
  torchPost(g,5.8,0,1.5);
  lmLight(gx+5.8,y+3.2,gz+1.5,0.8,20);
  addCollider(gx-6.4,gz-0.4,gx-4.6,gz+1.4);
  registerLore({key:'burial', x:gx, z:gz, r:40, icon:'🛡️',
    name:'Skibssætning — Ship Burial', sub:'Stones that sail the last sea',
    story:'The Northmen raised ships of stone for those who could not be given to the fire. Sail a ship of rocks around the dead, they said, and the voyage continues even on land. The runes beside it still speak a name the wind remembers.'});
}

/* ---------- 11. Great Sphinx (KEMET) ---------- */
function wonderSphinx(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  var sand=new THREE.Mesh(new THREE.CircleGeometry(16,18), new THREE.MeshLambertMaterial({color:0xd9c08c}));
  sand.rotation.x=-Math.PI/2; sand.position.y=0.05; g.add(sand);
  var lm=NM(0xc7a86a), lmD=NM(0xb08d55);
  /* lion body lying, facing +z */
  g.add(box(3.4,2.4,8.5, lm, 0,1.5,-1.5));
  g.add(box(3.0,1.5,2.6, lmD, 0,0.75,3.4));      /* chest */
  g.add(box(1.1,1,2.8, lmD, -1.15,0.5,4.6));     /* front legs */
  g.add(box(1.1,1,2.8, lmD, 1.15,0.5,4.6));
  g.add(box(2.6,0.9,2.2, lm, 0,0.45,-5.2));      /* haunch */
  /* head + nemes + uraeus */
  g.add(box(1.7,1.5,1.7, lmD, 0,3.35,2.6));
  g.add(box(2.1,1.1,2.0, NM(0x1f4e79), 0,3.9,2.5));
  g.add(box(0.55,1.3,0.5, NM(0x1f4e79), 0.85,3.1,2.7));
  g.add(box(0.55,1.3,0.5, NM(0x1f4e79), -0.85,3.1,2.7));
  g.add(box(0.14,0.4,0.12, NM(0xc9a227), 0,4.35,3.3));
  /* tail up the flank */
  var tail=cyl(0.16,0.2,2.6, lmD, 6); tail.position.set(1.7,1.8,-4.6); tail.rotation.x=0.7; g.add(tail);
  /* obelisks */
  [[-7,4],[7,4]].forEach(function(o){
    var ob=cyl(0.35,0.55,7, NM(0xc7a86a), 4); ob.rotation.y=Math.PI/4; ob.position.set(o[0],3.5,o[1]); g.add(ob);
    var py=cone(0.5,0.8, NM(0xc9a227), 4); py.rotation.y=Math.PI/4; py.position.set(o[0],7.4,o[1]); g.add(py);
    addCollider(gx+o[0]-0.6,gz+o[1]-0.6,gx+o[0]+0.6,gz+o[1]+0.6);
  });
  addCollider(gx-2,gz-6,gx+2,gz+5);
  registerLore({key:'sphinx', x:gx, z:gz, r:44, icon:'🐪',
    name:'Hor-m-akhet', sub:'"Horus in the Horizon" — the Great Sphinx',
    story:'A lion with the king\'s face, carved from a single ridge of living rock to guard the horizon where the sun is born. Strangers asked it riddles; kings left offerings between its paws. Two thousand years of sand once buried it to the neck — the dreamer-king Thutmose dug it free.'});
}

/* ---------- 12. Great vermilion Torii (NIPPON) ---------- */
function wonderTorii(gx,gz){
  var g=new THREE.Group(); var y=groundH(gx,gz); g.position.set(gx,y,gz); scene.add(g);
  var verm=NM(0xd03a26), vermD=NM(0xb02f1e);
  var gravel=new THREE.Mesh(new THREE.CircleGeometry(14,16), new THREE.MeshLambertMaterial({color:0xcac7bd}));
  gravel.rotation.x=-Math.PI/2; gravel.position.y=0.05; g.add(gravel);
  [[-4.4,0.08],[4.4,-0.08]].forEach(function(p){
    var pl=cyl(0.42,0.5,7.5, verm, 10); pl.position.set(p[0],3.75,0); pl.rotation.z=p[1]; g.add(pl);
    g.add(cyl(0.7,0.7,0.5, NM(0x3a3a3a), 10).translateX(p[0]).translateY(0.25));
    addCollider(gx+p[0]-0.6,gz-0.6,gx+p[0]+0.6,gz+0.6);
  });
  g.add(box(11.4,0.55,0.7, vermD, 0,7.7,0));     /* nuki */
  var kasagi=box(13,0.6,1.1, verm, 0,8.75,0); kasagi.rotation.z=-0.015; g.add(kasagi);
  g.add(box(12,0.3,0.85, vermD, 0,8.25,0));      /* shimaki */
  g.add(box(0.4,0.9,0.4, NM(0xc9a227), 0,7.15,0)); /* gakuzuka */
  /* stone lanterns + zen rocks */
  [[-6.5,3.5],[6.5,3.5]].forEach(function(o){
    g.add(cyl(0.3,0.4,0.9, NM(0x9a958a), 6).translateX(o[0]).translateY(0.45).translateZ(o[1]));
    g.add(box(0.75,0.6,0.75, NM(0x9a958a), o[0],1.2,o[1]));
    g.add(cone(0.62,0.45, NM(0x8a857a), 4).translateX(o[0]).translateY(1.72).translateZ(o[1]));
    addCollider(gx+o[0]-0.4,gz+o[1]-0.4,gx+o[0]+0.4,gz+o[1]+0.4);
  });
  [[-2.5,-3],[1.8,-4],[3.4,-2.4]].forEach(function(r){ var rk=sph(rand(0.5,0.9), NM(0x6f7a72), 7,5); rk.scale.y=0.7; rk.position.set(r[0],0.25,r[1]); g.add(rk); });
  registerLore({key:'torii', x:gx, z:gz, r:44, icon:'⛩️',
    name:'Ō-torii', sub:'Gate between the worlds',
    story:'Vermilion wards off misfortune; the gate marks where the mundane ends and the sacred begins. Pass beneath it and you walk in the presence of kami. The greatest of them stands in the sea itself — the tide bows twice a day before the shrine of Itsukushima.'});
}

/* ---------- town lore: every building tells its own story ---------- */
function registerTownLore(facKey, data){
  var F=FACS[facKey];
  var nat=F.name;
  registerLore({key:facKey+'_hall', x:data.hall.x, z:data.hall.z, r:26, icon:'🏯',
    name:nat+' Great Hall', sub:'Throne room & muster court',
    story:'The heart of '+nat+'\'s power. From this hall the rulers hold court, count their gold, and send fresh troops to the front. Lose this hall and the nation loses its voice.'});
  registerLore({key:facKey+'_temple', x:data.temple.x, z:data.temple.z, r:24, icon:'🕯️',
    name:nat+' Sanctuary', sub:'Where soldiers pray before the march',
    story:'Every company of '+nat+' passes this sanctuary on the way to the field. Banners are dipped at the threshold; wounds are washed and blessed here. Priests say the walls remember every name that never came home.'});
  registerLore({key:facKey+'_barracks', x:data.barracks.x, z:data.barracks.z, r:22, icon:'⚔️',
    name:nat+' Barracks', sub:'Home of the garrison',
    story:'Spartan bunks, whetstone-dulled mornings, the smell of oil and leather. The garrison of '+nat+' drills on the square at dawn so that the road-dust never has time to settle.'});
  registerLore({key:facKey+'_well', x:data.well.x, z:data.well.z, r:18, icon:'💧',
    name:nat+' Town Well', sub:'The meeting place',
    story:'All roads of a town lead to its well. Here the news is traded dearer than salt, children are scolded, and in war-time the elders count the men who are still standing.'});
}

/* ---------- build them all ---------- */
function buildLandmarks(){
  wonderVoronet(575,850);
  wonderCetatea(915,570);
  wonderPutna(990,705);
  wonderCurtea(635,950);
  wonderHan(805,710);
  wonderStatue(760,760);
  wonderTroita(710,680);
  wonderTemple(580,-850);
  wonderArch(-580,-850);
  wonderBurial(-580,850);
  wonderSphinx(-465,-2080);
  wonderTorii(465,2080);
}

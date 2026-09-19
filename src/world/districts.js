/* ---------------- districts — ROMANIAN MEDIEVAL WAR WORLD EXTENDED 2× EDITION ----------------
   Farms, mines, markets, caves, ruins, plus NEW: watchtowers, monasteries, outposts,
   war camps, trade posts, inns, shrines, secret crypts — per region, instanced
*/
var SITES=[];
var zoneSiteRate=null;
var DISTRICT_C=[];
var LMS=[
  [0,0],           /* Romaria capital */
  [-1800,-800],    /* Ardealburg */
  [-1400,1300],    /* Cetatea Dunarii */
  [1700,-700],     /* Hotarul de Nord */
  [0,-2400],       /* Stanca de Fier */
  [0,2500],        /* Drumul Lung */
  [575,850],[915,570],[990,705],[635,950],[805,710],[710,680],
  [580,-850],[-580,-850],[-580,850],
  [-465,-2080],[465,2080],
  [-2200,-2000],[2200,-1900],[-2100,-400],[2100,200],
  [-2200,1800],[2200,2200],[0,-1600],[1200,0]
];
(function(){
  // Generate districts across all regions, avoiding towns & landmarks
  for(var i=0;i<400;i++){
    if(DISTRICT_C.length>=220) break;
    var a=i*2.39996, r=220+Math.pow((i%85)/85,0.68)*2700;
    var x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(Math.abs(x)>2920||Math.abs(z)>2920) continue;
    var reg = getRegion(x,z);
    if(reg==='capital' && Math.sqrt(x*x+z*z)<620) continue; // keep capital clear for hand-placed palace
    var bad=false;
    FAC_KEYS_T.forEach(function(fk){
      var T=TOWNS[fk];
      if((x-T.x)*(x-T.x)+(z-T.z)*(z-T.z)<320*320) bad=true;
    });
    for(var v=0;v<VILLAGES.length;v++){ var V=VILLAGES[v];
      if((x-V.x)*(x-V.x)+(z-V.z)*(z-V.z)<110*110) bad=true; }
    for(var L=0;L<LMS.length;L++){ if((x-LMS[L][0])*(x-LMS[L][0])+(z-LMS[L][1])*(z-LMS[L][1])<130*130) bad=true; }
    for(var d=0;d<DISTRICT_C.length;d++){ var D=DISTRICT_C[d];
      if((x-D.x)*(x-D.x)+(z-D.z)*(z-D.z)<140*140) bad=true; }
    if(!bad) DISTRICT_C.push({x:x, z:z, region:reg});
  }
})();
function buildDistricts(){
  var wallMats=[], wallCols=[], roofMats=[], roofCols=[], cylMats=[], moundMats=[], darkMats=[], flatMats=[], flatCols=[];
  var m4=new THREE.Matrix4(), q=new THREE.Quaternion(), eu=new THREE.Euler(), v3=new THREE.Vector3(), s3=new THREE.Vector3();
  function pushM(arr,x,y,z,ry,sx,sy,sz){ eu.set(0,ry||0,0); q.setFromEuler(eu); v3.set(x,y,z); s3.set(sx,sy,sz); m4.compose(v3,q,s3); arr.push(m4.clone()); if(arr===wallMats)wallCols.push(0x8a7a5e); if(arr===roofMats)roofCols.push(0x6d5a3e); if(arr===flatMats)flatCols.push(0x7a8f4a); }
  function site(x,z,type,rate){ var zi=zoneIdxAt(x,z); SITES.push({zi:zi, rate:rate, type:type, region:getRegion(x,z)}); }

  DISTRICT_C.forEach(function(D, di){
    var n=36+(di*7)%28;
    var region = D.region || getRegion(D.x,D.z);
    for(var b=0;b<n;b++){
      var row=Math.floor(b/8),col=b%8;
      var x=D.x+(col-3.5)*15+(col>=4?6:-6), z=D.z+(row-3.5)*15;
      if(insideSolid(x,z,5.5))continue;
      var y=groundH(x,z), ry=0;
      var roll=(b*29+di*17)%100;
      var hb=choice([0x8a7a5e,0x7a6a50,0x94826a,0x6e6152]), rb=choice([0x6d5a3e,0x5d4a38,0x4a4238]);

      /* ---------- REGION-SPECIFIC STRUCTURES ---------- */
      if(region==='carpathian'){
        if(roll<25){
          // Carpathian Watchtower — tall wooden tower with stone foundation
          addCollider(x-2.2,z-2.2,x+2.2,z+2.2);
          pushM(wallMats,x,y+3.5,z,ry,4.5,7,4.5); wallCols[wallCols.length-1]=0x8a7a6e;
          pushM(roofMats,x,y+8.2,z,ry+0.78,6.2,2.2,6.2); roofCols[roofCols.length-1]=0x5d4a38;
          pushM(cylMats,x,y+0.6,z,0,3.2,1.2,3.2);
          BUILD_COUNT+=2;
          site(x,z,'watchtower',0.18);
        } else if(roll<45){
          // Hermit's Cave / Monastery cell
          pushM(moundMats,x,y+1.4,z,ry,12,3.2,10);
          pushM(darkMats,x+Math.cos(ry)*2.8,y+1.0,z+Math.sin(ry)*2.8,ry,1.8,1.8,0.5);
          BUILD_COUNT++;
          site(x,z,'cave',0.32);
        } else if(roll<65){
          // Mountain Fort Stanca de Fier — iron-reinforced
          addCollider(x-3.5,z-3,x+3.5,z+3);
          pushM(wallMats,x,y+2.2,z,ry,7,4.4,5.5); wallCols[wallCols.length-1]=0x6e6e6e;
          pushM(wallMats,x,y+5.2,z,ry,0.22,2.8,0.22);
          pushM(roofMats,x,y+5.5,z,ry,8.5,1.2,6.5); roofCols[roofCols.length-1]=0x4a4238;
          BUILD_COUNT++;
          site(x,z,'fort',0.25);
        } else if(roll<80){
          // Frozen shrine
          pushM(wallMats,x,y+1.1,z,ry,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
          pushM(wallMats,x+1.8,y+1.1,z,ry,0.22,2.2,0.22);
          pushM(wallMats,x,y+2.3,z,ry,2.4,0.24,0.3);
          BUILD_COUNT+=3;
          site(x,z,'shrine',0.15);
        } else {
          // Avalanche debris + boulders
          pushM(moundMats,x,y+0.9,z,wr,3.4,2.2,3);
          pushM(moundMats,x+2.4,y+0.6,z-1.4,wr+1,2.2,1.5,2);
          BUILD_COUNT+=2;
        }
      } else if(region==='transylvanian'){
        if(roll<35){
          // Transylvanian cottage — vineyard house
          addCollider(x-2.5,z-2,x+2.5,z+2);
          pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=hb;
          pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=rb;
          pushM(flatMats,x-5,y+0.08,z+4,ry,9,1,7); flatCols[flatCols.length-1]=0x6b8f3a; // vineyard
          BUILD_COUNT++;
          site(x,z,'farm',0.12);
        } else if(roll<50){
          // School of Scribes
          addCollider(x-3.2,z-2.2,x+3.2,z+2.2);
          pushM(wallMats,x,y+1.6,z,ry,6.5,3.2,4.5); wallCols[wallCols.length-1]=0xd8d2c0;
          pushM(roofMats,x,y+3.9,z,ry+0.78,9.2,1.8,9.2); roofCols[roofCols.length-1]=0x2a5caa;
          BUILD_COUNT++;
          site(x,z,'school',0.18);
        } else if(roll<65){
          // Hunter's Cabin
          addCollider(x-2.7,z-2.2,x+2.7,z+2.2);
          pushM(wallMats,x,y+1.6,z,ry,5.5,3.2,4.5); wallCols[wallCols.length-1]=0x6e6152;
          pushM(cylMats,x+2.2,y+3.4,z,0,0.7,3.6,0.7);
          pushM(roofMats,x,y+3.5,z,ry,6.5,1.2,6); roofCols[roofCols.length-1]=0x4a4238;
          BUILD_COUNT++;
          site(x,z,'hunter',0.14);
        } else if(roll<80){
          // Bathhouse
          addCollider(x-3,z-2.5,x+3,z+2.5);
          pushM(wallMats,x,y+1.7,z,ry,6,3.4,5); wallCols[wallCols.length-1]=0x8a7a5e;
          pushM(flatMats,x,y+3.7,z,ry,7,1,5.6); flatCols[flatCols.length-1]=0x8a9a8a;
          BUILD_COUNT++;
          site(x,z,'bath',0.12);
        } else {
          // Orchards
          pushM(wallMats,x,y+0.7,z,ry,4.5,1.4,0.5);
          pushM(moundMats,x-1.5,y+0.3,z-1,0,3.2,0.8,2.8);
          BUILD_COUNT+=2;
          site(x,z,'orchard',0.08);
        }
      } else if(region==='wallachian'){
        if(roll<30){
          // Wallachian War Camp tent + training
          pushM(roofMats,x,y+1.3,z,ry,3.2,2.6,3.2); roofCols[roofCols.length-1]=0x8f6f4a;
          pushM(flatMats,x+2.2,y+0.06,z+1.6,ry,2.4,1,2.4); flatCols[flatCols.length-1]=0x5a4a38;
          BUILD_COUNT+=2;
          site(x,z,'warcamp',0.22);
        } else if(roll<50){
          // Siege workshop
          addCollider(x-3,z-2.5,x+3,z+2.5);
          pushM(wallMats,x,y+1.7,z,ry,6,3.4,5); wallCols[wallCols.length-1]=0x7a6a50;
          pushM(flatMats,x,y+3.7,z,ry,7,1,5.6); flatCols[flatCols.length-1]=0xc0272d;
          BUILD_COUNT++;
          site(x,z,'forge',0.18);
        } else if(roll<70){
          // Horse doctor / stable
          addCollider(x-2.5,z-2,x+2.5,z+2);
          pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=0x6e6152;
          pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=0x6d5a3e;
          BUILD_COUNT++;
          site(x,z,'stable',0.15);
        } else if(roll<85){
          // Marsh reed + mine
          pushM(moundMats,x,y+1.6,z+2.2,ry,8.4,2.6,7.2);
          BUILD_COUNT++;
          site(x,z,'mine',0.20);
        } else {
          // Muddy farm
          addCollider(x-3.2,z-2.2,x+3.2,z+2.2);
          pushM(wallMats,x,y+1.6,z,ry,6.5,3.2,4.5); wallCols[wallCols.length-1]=hb;
          pushM(flatMats,x-5,y+0.08,z+4,ry,9,1,7); flatCols[flatCols.length-1]=0x5a6a4a;
          BUILD_COUNT++;
          site(x,z,'farm',0.10);
        }
      } else if(region==='moldavian'){
        if(roll<30){
          // Border fort palisade
          addCollider(x-3,z-3,x+3,z+3);
          pushM(wallMats,x,y+2,z,ry,6,4,5); wallCols[wallCols.length-1]=0x6e6152;
          pushM(cylMats,x,y+0.6,z,0,4,1.2,4);
          BUILD_COUNT++;
          site(x,z,'borderfort',0.22);
        } else if(roll<55){
          // Forest village Codrul Vechi — wooden hut
          addCollider(x-2.5,z-2,x+2.5,z+2);
          pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=0x5d4a38;
          pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=0x3a5a2e;
          BUILD_COUNT++;
          site(x,z,'forestvillage',0.16);
        } else if(roll<70){
          // Woodcutter + mushroom cellar
          pushM(wallMats,x,y+1.4,z,ry,0.22,2.8,0.22);
          pushM(moundMats,x,y+0.3,z-1,0,3.2,0.8,2.8);
          pushM(darkMats,x,y+0.5,z,ry,1.5,1.2,1.5);
          BUILD_COUNT+=3;
          site(x,z,'woodcutter',0.12);
        } else if(roll<85){
          // Wolf shrine carved stones
          pushM(wallMats,x,y+2.6,z,ry,1.1,5.2,0.9); wallCols[wallCols.length-1]=0x70685a;
          pushM(moundMats,x,y+0.3,z,0,2.2,0.8,2);
          BUILD_COUNT+=2;
          site(x,z,'shrine',0.18);
        } else {
          // Herbalist
          pushM(wallMats,x,y+1.4,z,ry,4.5,2.8,4); wallCols[wallCols.length-1]=0x7a6a50;
          pushM(roofMats,x,y+3.2,z,ry,6,1.2,5.5); roofCols[roofCols.length-1]=0x6d5a3e;
          BUILD_COUNT++;
          site(x,z,'herbalist',0.10);
        }
      } else if(region==='trade_route'){
        if(roll<35){
          // Trade post wooden building + crates
          addCollider(x-3,z-2.5,x+3,z+2.5);
          pushM(wallMats,x,y+1.7,z,ry,6,3.4,5); wallCols[wallCols.length-1]=0xb09a6e;
          pushM(flatMats,x,y+3.7,z,ry,7,1,5.6); flatCols[flatCols.length-1]=0xc9b24a;
          pushM(cylMats,x+2,y+0.55,z+1,0,0.8,1.1,0.8);
          BUILD_COUNT++;
          site(x,z,'market',0.20);
        } else if(roll<60){
          // Inn Drumul Lung — beds, kitchen, stable
          addCollider(x-3.5,z-2.5,x+3.5,z+2.5);
          pushM(wallMats,x,y+2,z,ry,7.5,4,5.5); wallCols[wallCols.length-1]=0x8a7a5e;
          pushM(roofMats,x,y+5,z,ry+0.78,11,2.2,11); roofCols[roofCols.length-1]=0x5d4a38;
          BUILD_COUNT++;
          site(x,z,'inn',0.18);
        } else if(roll<75){
          // Checkpoint gate
          pushM(wallMats,x,y+2.2,z,ry,0.5,4.4,5.5); wallCols[wallCols.length-1]=0x6e6152;
          pushM(wallMats,x+4,y+2.2,z,ry,0.5,4.4,5.5);
          pushM(wallMats,x+2,y+4.5,z,ry,5,0.5,0.5);
          BUILD_COUNT+=3;
          site(x,z,'checkpoint',0.15);
        } else if(roll<90){
          // Roadside Orthodox shrine
          pushM(wallMats,x-0.9,y+1.1,z,ry,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
          pushM(wallMats,x+0.9,y+1.1,z,ry,0.22,2.2,0.22);
          pushM(wallMats,x,y+2.3,z,ry,2.4,0.24,0.3);
          BUILD_COUNT+=3;
          site(x,z,'shrine',0.12);
        } else {
          // Caravan repair workshop
          pushM(wallMats,x,y+1.6,z,ry,5.5,3.2,4.5); wallCols[wallCols.length-1]=0x6e6152;
          pushM(cylMats,x+2.2,y+3.4,z,0,0.7,3.6,0.7);
          BUILD_COUNT++;
          site(x,z,'workshop',0.14);
        }
      } else if(region==='capital'){
        if(roll<30){
          // Romaria noble estate / merchant
          addCollider(x-3.5,z-2.5,x+3.5,z+2.5);
          pushM(wallMats,x,y+2.2,z,ry,7,4.4,5.5); wallCols[wallCols.length-1]=0xd8d2c0;
          pushM(roofMats,x,y+5.2,z,ry+0.78,9.2,2.2,9.2); roofCols[roofCols.length-1]=0xc0272d;
          BUILD_COUNT++;
          site(x,z,'noble',0.25);
        } else if(roll<55){
          // Grand market spice / book / armor
          addCollider(x-3,z-2.5,x+3,z+2.5);
          pushM(wallMats,x,y+1.7,z,ry,6,3.4,5); wallCols[wallCols.length-1]=0xc2b89a;
          pushM(flatMats,x,y+3.7,z,ry,7,1,5.6); flatCols[flatCols.length-1]=0xc9a83a;
          BUILD_COUNT++;
          site(x,z,'market',0.22);
        } else if(roll<70){
          // Artisan quarter
          addCollider(x-2.7,z-2.2,x+2.7,z+2.2);
          pushM(wallMats,x,y+1.6,z,ry,5.5,3.2,4.5); wallCols[wallCols.length-1]=0x8a7a5e;
          pushM(cylMats,x+2.2,y+3.4,z,0,0.7,3.6,0.7);
          BUILD_COUNT++;
          site(x,z,'forge',0.20);
        } else if(roll<85){
          // River docks / garden courtyard
          pushM(flatMats,x,y+0.08,z,ry,8,0.2,6); flatCols[flatCols.length-1]=0x6a8a5a;
          pushM(wallMats,x,y+0.7,z,ry,4.5,1.4,0.5);
          BUILD_COUNT+=2;
          site(x,z,'dock',0.15);
        } else {
          // Royal library / servant quarters
          addCollider(x-2.5,z-2,x+2.5,z+2);
          pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=0xe8e0cf;
          pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=0x6d4a34;
          BUILD_COUNT++;
          site(x,z,'library',0.18);
        }
      } else {
        // battlefield / generic — broken carts, burned houses, mass graves, memorials
        if(roll<30){
          pushM(wallMats,x,y+0.7,z,ry,4.5,1.4,0.5); wallCols[wallCols.length-1]=0x5a4a3a;
          pushM(moundMats,x-1.5,y+0.3,z-1,0,3.2,0.8,2.8);
          BUILD_COUNT+=2;
          site(x,z,'ruin',0.12);
        } else if(roll<55){
          addCollider(x-2.5,z-2,x+2.5,z+2);
          pushM(wallMats,x,y+1.5,z,ry,5,3,4); wallCols[wallCols.length-1]=0x6e6152;
          pushM(roofMats,x,y+3.8,z,ry+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=0x4a4238;
          BUILD_COUNT++;
          site(x,z,'burned',0.10);
        } else if(roll<70){
          pushM(moundMats,x,y+1.4,z,ry,14,3.4,12);
          pushM(darkMats,x+Math.cos(ry)*3.4,y+1.1,z+Math.sin(ry)*3.4,ry,2.2,2.2,0.6);
          BUILD_COUNT++;
          site(x,z,'cave',0.20);
        } else {
          pushM(wallMats,x,y+1.4,z,ry,0.22,2.8,0.22);
          pushM(moundMats,x,y+1.6,z+2.2,ry,8.4,2.6,7.2);
          BUILD_COUNT+=2;
          site(x,z,'memorial',0.10);
        }
      }
    }
    if(di%7===0){
      var regName = WORLD_REGIONS[region] ? WORLD_REGIONS[region].name : 'District';
      registerLore({key:'district'+di, x:D.x, z:D.z, r:70, icon:region==='carpathian'?'🏔️':region==='trade_route'?'🐪':region==='capital'?'🏰':'🏘️',
        name:regName+' — Sector '+(di+1), sub:region+' hamlets, works and wilds',
        story:'A working district of '+regName+' — '+(
          region==='carpathian'?'monasteries, watchtowers and frozen shrines keep the northern pass':
          region==='transylvanian'?'vineyards, scribe schools and hunter cabins feed Ardealburg':
          region==='wallachian'?'war camps, siege workshops and horse doctors supply Cetatea Dunarii':
          region==='moldavian'?'border forts, wolf shrines and forest villages guard the frontier':
          region==='trade_route'?'caravan posts, inns and Orthodox shrines serve the long road':
          region==='capital'?'noble estates, markets and artisan quarters surround Romaria':
          'battlefields, burned villages and memorials tell the cost of war'
        )});
    }
  });

  /* ---- ROADS: every village/district connects to its nearest town + Romaria capital ---- */
  window.__roadPts=[];
  var roadMats=[], roadRots=[];
  function layRoad(x0,z0,x1,z1){
    var dx=x1-x0, dz=z1-z0, L=Math.sqrt(dx*dx+dz*dz);
    if(L<30) return;
    var ux=dx/L, uz=dz/L, px=-uz, pz=ux;
    var hop=20;
    for(var s=0;s<L;s+=hop){
      var wx=x0+ux*s, wz=z0+uz*s;
      if(insideSolid(wx,wz,3.5)) continue;
      var ry=Math.atan2(ux,uz);
      pushM(roadMats, wx, groundH(wx,wz)+0.06, wz, ry, 5.2,1,hop*1.06);
      roadRots.push(0);
      window.__roadPts.push([wx,wz]);
      if(s>60 && s<L-60 && ((s/hop)|0)%3===0 && Math.random()<0.55){
        var side=((s/hop)%2)?1:-1;
        var hx=wx+px*side*11, hz=wz+pz*side*11;
        if(!insideSolid(hx,hz,3.2)){
          var hy=groundH(hx,hz), hr=0;
          var roll=Math.random();
          addCollider(hx-2.5,hz-2,hx+2.5,hz+2);
          if(roll<0.62){
            pushM(wallMats,hx,hy+1.5,hz,hr,5,3,4); wallCols[wallCols.length-1]=choice([0x8a7a5e,0x7a6a50,0x94826a]);
            pushM(roofMats,hx,hy+3.8,hz,hr+0.78,6.8,1.7,6.8); roofCols[roofCols.length-1]=choice([0x6d5a3e,0x5d4a38]);
          } else {
            pushM(wallMats,hx,hy+1.3,hz,hr,4.6,2.6,3.6); wallCols[wallCols.length-1]=0x6e6152;
            pushM(roofMats,hx,hy+3.1,hz,hr+0.78,6.2,1.5,5.6); roofCols[roofCols.length-1]=0x4a4238;
          }
          BUILD_COUNT++;
        }
      }
    }
  }
  var roadTowns=FAC_KEYS_T.map(function(f){ return TOWNS[f]; });
  // towns fully connected (ring + spokes to Romaria)
  for(var ti=0;ti<roadTowns.length;ti++){
    var next = roadTowns[(ti+1)%roadTowns.length];
    layRoad(roadTowns[ti].x,roadTowns[ti].z,next.x,next.z);
    layRoad(roadTowns[ti].x,roadTowns[ti].z,0,0); // all roads lead to Romaria
  }
  // Trade Route main east-west artery
  layRoad(-2800,2500,2800,2500);
  layRoad(-2800,2300,2800,2300);
  // Carpathian ridge pass
  layRoad(-2800,-2400,2800,-2400);
  layRoad(-2800,-2000,2800,-2000);

  function nearestTown(x,z){
    var bt=null, bd=1e18;
    for(var t=0;t<roadTowns.length;t++){
      var T=roadTowns[t], d=(T.x-x)*(T.x-x)+(T.z-z)*(T.z-z);
      if(d<bd){ bd=d; bt=T; }
    }
    return bt;
  }
  VILLAGES.forEach(function(V){ var T=nearestTown(V.x,V.z); layRoad(V.x,V.z,T.x,T.z); });
  DISTRICT_C.forEach(function(D){ var T=nearestTown(D.x,D.z); layRoad(D.x,D.z,T.x,T.z); });

  /* ---- WILDS: every zone gets something — no empty green anywhere ---- */
  window.__contentZi={};
  DISTRICT_C.forEach(function(D){ window.__contentZi[zoneIdxAt(D.x,D.z)]=1; });
  VILLAGES.forEach(function(V){ window.__contentZi[zoneIdxAt(V.x,V.z)]=1; });
  LMS.forEach(function(L){ window.__contentZi[zoneIdxAt(L[0],L[1])]=1; });
  [[2000,-2000],[-2000,2000],[0,-2600]].forEach(function(R){ window.__contentZi[zoneIdxAt(R[0],R[1])]=1; });
  var wildsN=0;
  for(var gz=0; gz<ZN; gz++) for(var gx=0; gx<ZN; gx++){
    var zi=gz*ZN+gx;
    if(window.__contentZi[zi]) continue;
    var cx=(gx+0.5)*(6000/ZN)-3000, cz=(gz+0.5)*(6000/ZN)-3000;
    var near=false;
    FAC_KEYS_T.forEach(function(fk){ var T=TOWNS[fk];
      if((cx-T.x)*(cx-T.x)+(cz-T.z)*(cz-T.z)<300*300) near=true; });
    if(!near) for(var v2=0;v2<VILLAGES.length;v2++){ var V2=VILLAGES[v2];
      if((cx-V2.x)*(cx-V2.x)+(cz-V2.z)*(cz-V2.z)<160*160) near=true; }
    if(!near) for(var L2=0;L2<LMS.length;L2++){ if((cx-LMS[L2][0])*(cx-LMS[L2][0])+(cz-LMS[L2][1])*(cz-LMS[L2][1])<140*140) near=true; }
    if(!near) for(var d2=0;d2<DISTRICT_C.length;d2++){ var D2=DISTRICT_C[d2];
      if((cx-D2.x)*(cx-D2.x)+(cz-D2.z)*(cz-D2.z)<200*200) near=true; }
    if(near){ window.__contentZi[zi]=1; continue; }
    var jx=cx+(((gz*7+gx*13)%61)-30)*1.7, jz=cz+(((gx*11+gz*5)%61)-30)*1.7;
    var wy=groundH(jx,jz), wr=((gx+gz)%12)*0.5236, wt=(gx*3+gz*5)%8;
    var regionWild = getRegion(jx,jz);
    if(regionWild==='carpathian'){
      if(wt%3===0){
        pushM(wallMats,jx,wy+0.8,jz,wr,4.2,1.6,0.6); wallCols[wallCols.length-1]=0x8a8272;
        pushM(moundMats,jx,wy+1.2,jz,wr,2.5,2.0,2.5);
        addCollider(jx-2.2,jz-1.2,jx+2.8,jz+2.2); BUILD_COUNT+=2;
      } else {
        pushM(moundMats,jx,wy+0.9,jz,wr,3.4,2.2,3);
        pushM(moundMats,jx+2.4,wy+0.6,jz-1.4,wr+1,2.2,1.5,2);
        BUILD_COUNT+=2;
      }
    } else if(regionWild==='trade_route'){
      if(wt%2===0){
        pushM(roofMats,jx,wy+1.1,jz,wr,2.6,2.2,2.6); roofCols[roofCols.length-1]=0xc9a83a;
        pushM(cylMats,jx+2,wy+0.55,jz+1,0,0.8,1.1,0.8);
        BUILD_COUNT+=2;
      } else {
        pushM(wallMats,jx-0.9,wy+1.1,jz,wr,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
        pushM(wallMats,jx+0.9,wy+1.1,jz,wr,0.22,2.2,0.22);
        pushM(wallMats,jx,wy+2.3,jz,wr,2.4,0.24,0.3);
        BUILD_COUNT+=3;
      }
    } else if(wt===0){
      pushM(wallMats,jx,wy+0.8,jz,wr,4.2,1.6,0.6); wallCols[wallCols.length-1]=0x8a8272;
      pushM(wallMats,jx+1.8,wy+1.3,jz+1.2,wr+0.5,0.6,2.6,2.2); wallCols[wallCols.length-1]=0x7a7264;
      addCollider(jx-2.2,jz-1.2,jx+2.8,jz+2.2); BUILD_COUNT+=2;
    } else if(wt===1){
      pushM(wallMats,jx-0.9,wy+1.1,jz,wr,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
      pushM(wallMats,jx+0.9,wy+1.1,jz,wr,0.22,2.2,0.22); wallCols[wallCols.length-1]=0x6b4f2e;
      pushM(wallMats,jx,wy+2.3,jz,wr,2.4,0.24,0.3); wallCols[wallCols.length-1]=0x7a5a36;
      BUILD_COUNT+=3;
    } else if(wt===2){
      pushM(roofMats,jx,wy+1.1,jz,wr,2.6,2.2,2.6); roofCols[roofCols.length-1]=0xc9a83a;
      pushM(cylMats,jx+2,wy+0.55,jz+1,0,0.8,1.1,0.8);
      BUILD_COUNT+=2;
    } else if(wt===3){
      pushM(moundMats,jx,wy+0.9,jz,wr,3.4,2.2,3);
      pushM(moundMats,jx+2.4,wy+0.6,jz-1.4,wr+1,2.2,1.5,2);
      BUILD_COUNT+=2;
    } else if(wt===4){
      pushM(roofMats,jx,wy+1.3,jz,wr,3.2,2.6,3.2); roofCols[roofCols.length-1]=0x8f6f4a;
      pushM(flatMats,jx+2.2,wy+0.06,jz+1.6,wr,2.4,1,2.4); flatCols[flatCols.length-1]=0x5a4a38;
      BUILD_COUNT+=2;
    } else {
      pushM(wallMats,jx,wy+2.6,jz,wr,1.1,5.2,0.9); wallCols[wallCols.length-1]=0x70685a;
      pushM(moundMats,jx,wy+0.3,jz,0,2.2,0.8,2);
      addCollider(jx-0.8,jz-0.7,jx+0.8,jz+0.7); BUILD_COUNT+=2;
    }
    window.__contentZi[zi]=1; wildsN++;
  }
  window.__wildsN=wildsN;
  function makeIM(geo,mats,mat,cols){
    if(!mats.length)return;
    var buckets=new Map();
    mats.forEach(function(matrix,i){
      var x=Math.floor((matrix.elements[12]+WORLD.half)/375),z=Math.floor((matrix.elements[14]+WORLD.half)/375),key=x+':'+z;
      if(!buckets.has(key))buckets.set(key,{x:x,z:z,items:[]});buckets.get(key).items.push(i);
    });
    var material=mat||M(0xffffff);
    buckets.forEach(function(b){
      var im=new THREE.InstancedMesh(geo,material,b.items.length);
      b.items.forEach(function(original,i){im.setMatrixAt(i,mats[original]);if(cols)im.setColorAt(i,new THREE.Color(cols[original]===undefined?0x8a7a5e:cols[original]));});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
      im.frustumCulled=false;im.name='district-chunk';
      im.userData.cullBounds={x:(b.x+0.5)*375-WORLD.half,z:(b.z+0.5)*375-WORLD.half,r:285};
      scene.add(im);
    });
  }
  makeIM(new THREE.BoxGeometry(1,1,1), wallMats, null, wallCols);
  makeIM(new THREE.ConeGeometry(0.5,1,4), roofMats, null, roofCols);
  makeIM(new THREE.CylinderGeometry(0.5,0.5,1,6), cylMats, NM(0x9a9284));
  makeIM(new THREE.SphereGeometry(0.5,8,6), moundMats, NM(0x77706a));
  makeIM(new THREE.BoxGeometry(1,1,1), darkMats, new THREE.MeshBasicMaterial({color:0x14100c}));
  makeIM(new THREE.BoxGeometry(1,1,1), flatMats, new THREE.MeshLambertMaterial({color:0xffffff}), flatCols);
  makeIM(new THREE.BoxGeometry(1,1,1), roadMats, new THREE.MeshLambertMaterial({color:0x9a815a}), null);
  zoneSiteRate=new Float32Array(ZN*ZN);
  for(var s=0;s<SITES.length;s++) zoneSiteRate[SITES[s].zi]+=SITES[s].rate;
}

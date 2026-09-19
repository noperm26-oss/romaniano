/* ---------------- game state ---------------- */
var ST={MENU:0, FACTION:1, ROLES:2, PLAY:3, PAUSE:4, REDEPLOY:5, RESULT:6};
var state=ST.MENU;
var entities=[];
var player=null;
var playerTeam=null;
var kills=0, score=0;
var selectedRole=null, selectedFaction=null;
var curFaction=null;
var deathPos=new THREE.Vector3();
var gameTime=0, hitVignette=0;
/* ---------------- day / night sky (v5) ---------------- */
var DN={t:0.42, night:0};   /* start at 10:10 — bright day */
var skyDay=new THREE.Color(0xb7cbdd), skyNight=new THREE.Color(0x0b1122), skyDawn=new THREE.Color(0xd98d5f), skyTmp=new THREE.Color();
scene.add(sun.target);
var skySun=new THREE.Mesh(new THREE.SphereGeometry(42,12,10), new THREE.MeshBasicMaterial({color:0xffd98a, fog:false}));
var skyMoon=new THREE.Mesh(new THREE.SphereGeometry(30,12,10), new THREE.MeshBasicMaterial({color:0xdfe8ff, fog:false}));
scene.add(skySun); scene.add(skyMoon);
var starGeo=new THREE.BufferGeometry();
var starPos=new Float32Array(700*3);
for(var spi=0;spi<700;spi++){
  var sa2=rand(0,TAU), sb2=rand(0.06,1.32);
  starPos[spi*3]=Math.cos(sa2)*Math.sin(sb2)*620;
  starPos[spi*3+1]=Math.cos(sb2)*420+110;
  starPos[spi*3+2]=Math.sin(sa2)*Math.sin(sb2)*620;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
var starMat=new THREE.PointsMaterial({color:0xcfd8ff, size:2.2, sizeAttenuation:false, transparent:true, opacity:0, fog:false});
var stars=new THREE.Points(starGeo, starMat); scene.add(stars);

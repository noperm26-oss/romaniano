/* ---------------- legendary relics — EXTENDED EDITION ---------------- */
var relics=[];
function placeRelics(){
  var defs=[
    {x:2000,z:-2000, name:'Sword of Stefan', icon:'⚔️', buff:'dmg',
     story:'The blade the voivode carried at Vaslui. Whoever raises it strikes a fifth again harder - forever. Found in Carpathian Ridge.'},
    {x:-2000,z:2000, name:'Golden Fleece', icon:'🐑', buff:'spd',
     story:'Stolen from the deep mines where salt and gold sleep together. The bearer moves like mountain wind. Wallachian lowlands treasure.'},
    {x:0,z:-2600, name:'Aegis of the South', icon:'🛡️', buff:'hp',
     story:'Bull-hide and bronze, blessed under the burning sun. It fills the bearer with iron vigor. Carpathian frostwind pass.'},
    /* extended relics */
    {x:-1800,z:-800, name:'Crown of Ardealburg', icon:'👑', buff:'treasury',
     story:'Golden crown of Transylvanian princes, hidden in Ardealburg School of Scribes. Grants wealth and wisdom.'},
    {x:0,z:0, name:'Scepter of Romaria', icon:'🏰', buff:'morale',
     story:'Royal scepter of Romaria capital, marble and gold. Inspires armies, holds the realm together.'},
    {x:0,z:2500, name:'Merchant’s Scale of Drumul Lung', icon:'⚖️', buff:'trade',
     story:'Bronze scale from Southern Trade Route inn — measures not gold but fate. Caravans prosper under its balance.'},
    {x:1700,z:-700, name:'Wolf Fang of Codrul Vechi', icon:'🐺', buff:'forest',
     story:'Carved wolf fang shrine in Moldavian Borderlands. Grants sight in forests, speed among trees.'},
    {x:-1400,z:1300, name:'Banner of Cetatea Dunarii', icon:'🚩', buff:'defense',
     story:'War-torn banner from Wallachian fortress, 20-meter walls could not hold without it. Defense eternal.'}
  ];
  defs.forEach(function(d){
    var y=groundH(d.x,d.z);
    var g=new THREE.Group(); g.position.set(d.x,y,d.z);
    var beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,26,8,1,true), new THREE.MeshBasicMaterial({color:0xffe9a0, transparent:true, opacity:0.16, depthWrite:false, side:THREE.DoubleSide, fog:false}));
    beam.position.y=13; g.add(beam);
    var gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshLambertMaterial({color:d.buff==='trade'?0x8ab4d0:d.buff==='forest'?0x4a7a37:0xffd24d, emissive:d.buff==='trade'?0x2a4a6a:d.buff==='forest'?0x1a3a1a:0x9a6a10}));
    gem.position.y=1.6; g.add(gem);
    scene.add(g);
    relics.push({def:d, grp:g, gem:gem, x:d.x, z:d.z, taken:false});
    registerLore({key:'relic_'+d.buff, x:d.x, z:d.z, r:40, icon:d.icon, name:d.name, sub:'Legendary Relic — '+getRegion(d.x,d.z), story:d.story});
  });
}

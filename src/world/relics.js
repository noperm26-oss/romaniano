/* ---------------- legendary relics (v6) ---------------- */
var relics=[];
function placeRelics(){
  var defs=[
    {x:2000,z:-2000, name:'Sword of Stefan', icon:'X', buff:'dmg',
     story:'The blade the voivode carried at Vaslui. Whoever raises it strikes a fifth again harder - forever.'},
    {x:-2000,z:2000, name:'Golden Fleece', icon:'R', buff:'spd',
     story:'Stolen from the deep mines where salt and gold sleep together. The bearer moves like mountain wind.'},
    {x:0,z:-2600, name:'Aegis of the South', icon:'S', buff:'hp',
     story:'Bull-hide and bronze, blessed under the burning sun of Kemet. It fills the bearer with iron vigor.'}
  ];
  defs.forEach(function(d){
    var y=groundH(d.x,d.z);
    var g=new THREE.Group(); g.position.set(d.x,y,d.z);
    var beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,26,8,1,true), new THREE.MeshBasicMaterial({color:0xffe9a0, transparent:true, opacity:0.16, depthWrite:false, side:THREE.DoubleSide, fog:false}));
    beam.position.y=13; g.add(beam);
    var gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshLambertMaterial({color:0xffd24d, emissive:0x9a6a10}));
    gem.position.y=1.6; g.add(gem);
    /* v7: relic beam + emissive gem carry the glow (fixed light budget) */
    scene.add(g);
    relics.push({def:d, grp:g, gem:gem, x:d.x, z:d.z, taken:false});
    registerLore({key:'relic_'+d.buff, x:d.x, z:d.z, r:40, icon:d.icon, name:d.name, sub:'Legendary Relic', story:d.story});
  });
}

/* Medieval equipment only. Mesh design, gameplay family and wrist socket are independent. */
var WEAPONS={
  xiphos:{family:'blade',design:{len:0.75}},
  kopis:{family:'blade',design:{len:0.85,curve:1}},
  gladius:{family:'blade',design:{len:0.65,wide:0.1}},
  longsword:{family:'blade',design:{len:1.05,grip:0.26}},
  katana:{family:'blade',design:{len:0.95,curve:1,grip:0.26,col:0xd7dde3}},
  khopesh:{family:'blade',design:{len:0.62,curve:1,wide:0.11,col:0xb08d3e}},
  dory:{family:'spear',design:{len:2.6,butt:true}},
  naginata:{family:'spear',design:{len:2.3,tipLen:0.42}},
  spear:{family:'spear',design:{len:2.2}},
  axe:{family:'axe',design:{}},
  bow:{family:'bow',design:{}}
};
var WEAPON_SOCKETS={
  blade:{hand:'armR',position:[0,-0.38,0.02],rotation:[0,0,0],scale:1},
  spear:{hand:'armR',position:[0,-0.32,0.1],rotation:[0,0,0],scale:1},
  axe:{hand:'armR',position:[0,-0.38,0.02],rotation:[0,0,0],scale:1},
  bow:{hand:'armL',position:[0,-0.34,0.08],rotation:[0,0,0],scale:1}
};
function weaponDefinition(id){
  var def=WEAPONS[id];
  if(!def||!Object.prototype.hasOwnProperty.call(WEAPON_SOCKETS,def.family))throw new Error('Unsupported medieval weapon: '+id);
  return def;
}
function makeWeapon(id){
  var def=weaponDefinition(id),factories={blade:makeBlade,spear:makeSpearSpec,axe:makeAxe,bow:makeBow};
  var mesh=factories[def.family](def.design);mesh.name='weapon:'+id;mesh.userData.weaponId=id;return mesh;
}
function attachWeapon(id,arms,override){
  var def=weaponDefinition(id),socket=Object.assign({},WEAPON_SOCKETS[def.family],def.socket||{},override||{});
  if(!['armL','armR'].includes(socket.hand))throw new Error('Invalid weapon hand: '+socket.hand);
  if(![socket.position,socket.rotation].every(function(v){return Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);})||!Number.isFinite(socket.scale)||socket.scale<=0)throw new Error('Invalid weapon socket: '+id);
  var mesh=makeWeapon(id);
  mesh.position.fromArray(socket.position);mesh.rotation.set.apply(mesh.rotation,socket.rotation);mesh.scale.setScalar(socket.scale);
  arms[socket.hand].wr.add(mesh);return mesh;
}
function weaponFamily(id){return weaponDefinition(id).family;}

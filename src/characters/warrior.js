/* ============================================================
   R15 SOLDIER BUILDER — jointed limbs (shoulder>elbow, hip>knee)
   ============================================================ */
var SKINS=[0xd9a066,0xcf9058,0xe0b080,0xc98a54];
function buildWarrior(spec){
  var g=new THREE.Group();
  var body=new THREE.Group(); g.add(body);
  var mats=[];
  var localMaterials=new Map();
  function m(c){ if(c&&c.isMaterial)c=c.color.getHex();if(localMaterials.has(c))return localMaterials.get(c);var mm=new THREE.MeshLambertMaterial({color:c});mats.push(mm);localMaterials.set(c,mm);return mm; }
  var skin=NM(spec.skin||choice(SKINS)); mats.push(skin);
  var darkM=NM(0x1c1c1c); mats.push(darkM);
  var armorM = m(spec.armorCol||0x8b939c);
  var underM = m(spec.under);
  var sleeveM = m(spec.sleeves!==undefined?spec.sleeves:spec.under);
  var skirtM = m(spec.skirtCol||spec.under);
  var legM = m(spec.legs||0x4a4034);

  /* ----- R15 legs: hip joint > thigh, knee joint > shin + foot ----- */
  function buildLeg(side){
    var hip=new THREE.Group(); hip.position.set(0.16*side,0.94,0); body.add(hip);
    hip.add(box(0.22,0.46,0.24, legM, 0,-0.21,0));                       /* thigh */
    var knee=new THREE.Group(); knee.position.set(0,-0.45,0); hip.add(knee);
    knee.add(box(0.19,0.4,0.21, legM, 0,-0.19,0));                       /* shin */
    if(spec.greaves) knee.add(box(0.18,0.32,0.06, m(spec.greavesCol||armorM), 0,-0.16,0.12));
    knee.add(box(0.22,0.12,0.3, m(0x7a5230), 0,-0.42,0.05));             /* foot */
    return {hip:hip, knee:knee};
  }
  var legL=buildLeg(1), legR=buildLeg(-1);

  /* ----- torso ----- */
  var torso=box(0.6,0.72,0.36, underM, 0,1.3,0); body.add(torso);
  if(spec.armor && spec.armor!=='none'){
    var armShape=box(0.64,spec.armorH||0.5,0.4, armorM, 0,spec.armorY||1.42,0);
    body.add(armShape);
    if(spec.armorPtiers){
      for(var pt=0; pt<3; pt++) body.add(box(0.655,0.035,0.41, m(spec.ptCol||0x8a6a2a), 0,1.28+pt*0.16,0));
    }
  }
  body.add(box(0.63,0.11,0.38, m(0x7a5230), 0,0.99,0));
  body.add(box(0.66,0.04,0.4, m(0xc9a227), 0,0.99,0));
  if(spec.pteres){
    for(var pp=0; pp<7; pp++){
      var pa=-0.24+pp*0.08;
      body.add(box(0.07,0.24,0.03, skirtM, pa,0.88,0.2));
      body.add(box(0.07,0.24,0.03, skirtM, pa,0.88,-0.2));
    }
    body.add(box(0.56,0.2,0.42, skirtM, 0,0.92,0));
  } else if(spec.skirt==='robe'){
    body.add(box(0.58,0.3,0.4, skirtM, 0,0.86,0));
  } else if(spec.skirt==='fur'){
    body.add(box(0.6,0.26,0.42, m(0x4a3a28), 0,0.9,0));
  }
  body.add(box(0.7,0.15,0.39, sleeveM, 0,1.62,0));
  if(spec.pauldrons){
    var pdL=sph(0.15, armorM, 8,6); pdL.position.set(0.43,1.66,0); pdL.scale.y=0.7; body.add(pdL);
    var pdR=sph(0.15, armorM, 8,6); pdR.position.set(-0.43,1.66,0); pdR.scale.y=0.7; body.add(pdR);
  }
  if(spec.cloak){
    var cl=box(0.68,0.86,0.05, m(spec.cloak), 0,1.22,-0.23);
    cl.rotation.x=0.09; body.add(cl);
    body.add(box(0.16,0.08,0.08, m(0xc9a227), 0,1.6,0.18));
  }
  if(spec.backBanner){ /* sashimono */
    var bp=cyl(0.02,0.02,1.5, m(0x5d4326), 5); bp.position.set(0.12,2.2,-0.28); bp.rotation.z=-0.12; body.add(bp);
    var bfl=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.8), new THREE.MeshLambertMaterial({map:spec.backBanner, side:THREE.DoubleSide}));
    bfl.position.set(0.34,2.6,-0.28); body.add(bfl);
  }
  if(spec.torc){
    var tc=torus(0.14,0.025, m(0xc9a227)); tc.position.set(0,1.68,0); tc.rotation.x=Math.PI/2; body.add(tc);
  }
  if(spec.collar){ /* egyptian wide collar */
    var co=torus(0.24,0.05, m(spec.collar)); co.position.set(0,1.6,0); co.rotation.x=Math.PI/2.3; body.add(co);
  }

  /* ----- R15 arms: shoulder joint > upper arm, elbow joint > forearm + hand ----- */
  function buildArm(side){
    var sh=new THREE.Group(); sh.position.set(0.44*side,1.6,0); body.add(sh);
    sh.add(box(0.16,0.36,0.18, sleeveM, 0,-0.16,0));                     /* upper arm */
    if(spec.pauldrons){ var pp2=sph(0.13, armorM, 8,6); pp2.position.y=-0.02; pp2.scale.y=0.7; sh.add(pp2); }
    var el=new THREE.Group(); el.position.set(0,-0.34,0); sh.add(el);
    el.add(box(0.14,0.34,0.16, sleeveM, 0,-0.15,0));                     /* forearm */
    if(spec.bracers) el.add(box(0.15,0.2,0.17, m(spec.bracerCol||0x7a5230), 0,-0.14,0));
    var wr=new THREE.Group(); wr.position.set(0,-0.34,0); el.add(wr);    /* wrist joint (v5) */
    wr.add(box(0.13,0.13,0.14, skin, 0,-0.05,0));                        /* hand */
    return {sh:sh, el:el, wr:wr};
  }
  var armL=buildArm(1), armR=buildArm(-1);

  /* ----- head ----- */
  var head=new THREE.Group(); head.position.set(0,1.78,0); body.add(head);
  head.add(box(0.32,0.34,0.32, skin, 0,0.18,0));
  head.add(box(0.06,0.055,0.03, darkM, 0,0.24,0.165));
  head.add(box(0.05,0.05,0.02, darkM, 0.075,0.21,0.165));
  head.add(box(0.05,0.05,0.02, darkM, -0.075,0.21,0.165));
  head.add(box(0.2,0.03,0.02, m(0x3d2c1e), 0,0.27,0.17));
  if(spec.beard) head.add(box(0.27,0.16,0.06, m(spec.hairCol||0x4a3520), 0,0.03,0.145));
  if((!spec.helm||spec.helm==='bare'||spec.helm==='wreath') && spec.hairCol){
    head.add(box(0.335,0.1,0.335, m(spec.hairCol), 0,0.34,-0.01));
    head.add(box(0.335,0.22,0.1, m(spec.hairCol), 0,0.22,-0.13));
  }
  var helm=spec.helm;
  if(helm==='corinthian'){
    var cd=sph(0.21, armorM, 10,8); cd.scale.set(1,1.05,1.12); cd.position.y=0.22; head.add(cd);
    head.add(box(0.05,0.12,0.03, armorM, 0,0.22,0.19));
    head.add(box(0.055,0.2,0.04, armorM, 0.1,0.18,0.16));
    head.add(box(0.055,0.2,0.04, armorM, -0.1,0.18,0.16));
    head.add(box(0.06,0.03,0.02, darkM, 0.07,0.245,0.2));
    head.add(box(0.06,0.03,0.02, darkM, -0.07,0.245,0.2));
    if(spec.plume){
      head.add(box(0.05,0.16,0.46, m(spec.plume), 0,0.5,-0.02));
      head.add(box(0.045,0.1,0.14, m(spec.plume), 0,0.44,0.24));
      head.add(box(0.045,0.1,0.1, m(spec.plume), 0,0.44,-0.28));
      head.add(box(0.07,0.06,0.5, m(0x8a6a2a), 0,0.4,-0.02));
    }
  } else if(helm==='galea'){
    var gd=sph(0.2, armorM, 10,8); gd.scale.y=0.95; gd.position.y=0.24; head.add(gd);
    head.add(box(0.3,0.08,0.06, armorM, 0,0.14,0.14));
    if(spec.plume){
      head.add(box(0.05,0.15,0.44, m(spec.plume), 0,0.5,-0.02));
      head.add(box(0.07,0.06,0.46, m(0x8a6a2a), 0,0.4,-0.02));
    }
  } else if(helm==='nasal'){
    var nh=cone(0.2,0.3, armorM, 8); nh.position.y=0.36; head.add(nh);
    head.add(box(0.045,0.14,0.03, armorM, 0,0.2,0.18));
    head.add(box(0.42,0.03,0.42, armorM, 0,0.24,0));
  } else if(helm==='spangenhelm'){
    var sh2=cone(0.21,0.26, armorM, 8); sh2.position.y=0.38; head.add(sh2);
    head.add(box(0.035,0.3,0.42, m(0x8a6a2a), 0,0.3,0));
    head.add(box(0.42,0.035,0.06, m(0x8a6a2a), 0,0.24,0.1));
    if(spec.plume) head.add(box(0.04,0.12,0.3, m(spec.plume), 0,0.56,0));
  } else if(helm==='tiara'){
    var ti=cyl(0.21,0.23,0.3, m(spec.tiaraCol||0x5b2a86), 10); ti.position.y=0.3; head.add(ti);
    head.add(box(0.3,0.24,0.04, m(spec.tiaraCol||0x5b2a86), 0,0.14,0.15));
    head.add(box(0.3,0.24,0.04, m(spec.tiaraCol||0x5b2a86), 0,0.14,-0.15));
    var veil=cyl(0.2,0.24,0.22, m(0x8b939c), 8); veil.position.set(0,0.06,-0.08); veil.scale.z=0.7; head.add(veil);
    head.add(box(0.05,0.05,0.05, m(0xc9a227), 0,0.46,0.16));
  } else if(helm==='kettle'){
    var kc=cyl(0.22,0.25,0.12, armorM, 10); kc.position.y=0.4; head.add(kc);
    var brim2=cyl(0.35,0.35,0.03, armorM, 12); brim2.position.y=0.35; head.add(brim2);
    var ktip=cone(0.05,0.1, armorM, 6); ktip.position.y=0.51; head.add(ktip);
  } else if(helm==='fur'){
    var fur=sph(0.2, m(0x4a3a28), 9,7); fur.scale.y=0.62; fur.position.y=0.38; head.add(fur);
  } else if(helm==='hood'){
    var hd=cone(0.24,0.42, m(spec.hoodCol||0x2f5233), 8); hd.position.set(0,0.44,-0.03); head.add(hd);
  } else if(helm==='wreath'){
    var wr=torus(0.17,0.02, m(0x6b7a30)); wr.position.y=0.36; wr.rotation.x=0.35; head.add(wr);
  } else if(helm==='winged'){
    var wg=sph(0.2, m(0x50565e), 9,7); wg.scale.y=0.9; wg.position.y=0.26; head.add(wg);
    var w1=cone(0.06,0.3, m(0xc9a227), 5); w1.position.set(0.2,0.42,0); w1.rotation.z=-0.8; head.add(w1);
    var w2=cone(0.06,0.3, m(0xc9a227), 5); w2.position.set(-0.2,0.42,0); w2.rotation.z=0.8; head.add(w2);
    head.add(box(0.05,0.16,0.42, m(0x3d3d20), 0,0.5,0));
  } else if(helm==='nemes'){
    var nm1=box(0.37,0.24,0.37, m(spec.nemesCol||0x1f4e79), 0,0.32,-0.02); head.add(nm1);
    head.add(box(0.1,0.3,0.09, m(spec.nemesCol||0x1f4e79), 0.19,0.12,0.05));   /* lappets */
    head.add(box(0.1,0.3,0.09, m(spec.nemesCol||0x1f4e79), -0.19,0.12,0.05));
    head.add(box(0.24,0.34,0.08, m(spec.nemesCol||0x1f4e79), 0,0.1,-0.18));    /* back flap */
    head.add(box(0.385,0.05,0.385, m(0xc9a227), 0,0.44,-0.02));                /* gold band */
    head.add(box(0.06,0.05,0.06, m(0xc9a227), 0,0.24,0.19));                   /* uraeus */
  } else if(helm==='kabuto'){
    var kb=sph(0.21, m(spec.kabutoCol||0x3d3d42), 10,8); kb.scale.y=0.8; kb.position.y=0.28; head.add(kb);
    var kbr=cone(0.3,0.12, m(spec.kabutoCol||0x3d3d42), 10); kbr.position.y=0.2; head.add(kbr); /* flared neck guard */
    var ken=torus(0.13,0.02, m(0xc9a227)); ken.position.y=0.4; ken.rotation.x=0.4; head.add(ken);
    var cres=torus(0.09,0.022, m(0xc9a227), 6,10); cres.position.set(0,0.52,0.12); head.add(cres); /* maedate */
    head.add(box(0.3,0.06,0.06, m(0xc9a227), 0,0.44,0.14));
  } else if(helm==='jingasa'){
    var jg=cone(0.34,0.16, m(spec.jingasaCol||0xb59a63), 10); jg.position.y=0.4; head.add(jg);
    var jg2=cyl(0.2,0.24,0.08, m(spec.jingasaCol||0xb59a63), 10); jg2.position.y=0.31; head.add(jg2);
  }
  /* ----- weapons (parented to forearm group; single rigid assembly) ----- */
  var w=spec.weapon,wG=w?attachWeapon(w,{armL:armL,armR:armR},spec.weaponSocket):null;
  if(w==='bow' && spec.quiver){
    var qv=makeQuiver(); qv.position.set(0.2,1.32,-0.26); body.add(qv);
  }
  if(spec.shield){
    var shp=makeShieldShape(spec.shield, spec.shieldTex, spec.shieldCol);
    shp.position.set(0,-0.16,0.15);
    if(spec.shield==='scutum'||spec.shield==='kite') shp.position.set(0,-0.14,0.14);
    armL.el.add(shp);
  }
  return {group:g, body:body, mats:mats, weaponMesh:wG,
          parts:{
            armL:armL, armR:armR,
            legL:legL, legR:legR,
            head:head
          },
          weapon:w, ranged:w?weaponFamily(w)==='bow':false};
}

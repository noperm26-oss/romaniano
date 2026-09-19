/* ---------------- R15 animation system ---------------- */
function easeOut(t){ return 1-(1-t)*(1-t); }
function easeIn(t){ return t*t; }
function easeInOut(t){ return t<0.5? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
function updatePose(e, dt){
  if(e.gone) return;
  var P=e.parts,profile=animationProfile(e);
  if(e.dead){
    var t=Math.min(e.deadT*profile.deathSpeed,1);
    e.group.rotation.x=-t*Math.PI*0.46;
    /* ragdoll-ish limb splay */
    P.legL.hip.rotation.z=0.45*t;  P.legR.hip.rotation.z=-0.45*t;
    P.legL.hip.rotation.x=0.3*t;   P.legR.hip.rotation.x=-0.2*t;
    P.legL.knee.rotation.x=0.7*t;  P.legR.knee.rotation.x=0.5*t;
    P.armL.sh.rotation.z=-1.1*t;   P.armR.sh.rotation.z=1.1*t;
    P.armL.sh.rotation.x=0.2*t;    P.armR.sh.rotation.x=0.1*t;
    P.armL.el.rotation.x=-0.4*t;   P.armR.el.rotation.x=-0.3*t;
    return;
  }
  var amt=e.movingAmt;
  var strideRate=e.walkRate||10;
  e.walk+=dt*strideRate*amt;
  var s=Math.sin(e.walk), c=Math.cos(e.walk);

  /* ------- R15 LEGS — natural gait -------
     Hip: smooth pendulum stride.
     Knee: straight at heel-strike, flexes to peak at MID-SWING
     (when the leg passes under the body) — driven by -cos(walk),
     NOT a fixed offset (that was the stiff "doll" bug).        */
  P.legL.hip.rotation.x = s*profile.stride*amt;
  P.legR.hip.rotation.x = -s*profile.stride*amt;
  P.legL.hip.rotation.z=0; P.legR.hip.rotation.z=0;
  P.legL.knee.rotation.x = (Math.max(0,-c)*profile.knee + 0.1)*amt;
  P.legR.knee.rotation.x = (Math.max(0, c)*profile.knee + 0.1)*amt;

  /* ------- BODY: bob (2 per stride), sway & hip twist ------- */
  e.body.position.y = Math.abs(c)*profile.bob*amt + Math.sin(gameTime*2.1+e.walk*0.7)*0.018;
  e.body.rotation.x = 0;
  e.body.rotation.y = s*0.055*amt;
  e.body.rotation.z = s*profile.sway*amt;

  /* ------- HEAD: stays level, counter-tilts gently ------- */
  P.head.position.y = 1.78 + Math.abs(c)*0.035*amt;
  P.head.rotation.z = -s*0.035*amt;
  P.head.rotation.x = 0;
  P.head.rotation.y = 0;

  /* ------- REST POSES (weapon-dependent guard stances) ------- */
  var restShR=-0.5, restElR=-0.9, restShL=-0.32, restElL=-0.55, restZL=0.14;
  if(e.ranged){ restShL=-1.12; restElL=-0.25; restShR=-0.7; restElR=-1.2; restZL=0.05; }
  var spearish=e.weapon&&weaponFamily(e.weapon)==='spear';
  if(spearish){ restShR=-0.62; restElR=-1.05; }

  /* ------- R15 ARMS — counter-swing + cross-body sway + ELBOW FOLLOW-THROUGH -------
     The elbow & wrist run on a LEADING phase (+0.35 rad) so the forearm trails
     the shoulder like a limb with mass: swing, whip-through, settle.          */
  /* v6 arms: pendulum shoulder + elbow folds as the arm swings FORWARD (trailing
     the shoulder like a real limb). Weapon arm stays nearly straight so the blade
     carries naturally; shield arm swings quietly. No shoulder twisting. */
  var wSwing = e.ranged?0.3 : spearish?0.55 : 1;
  var sSwing = e.hasShield?0.55:1;
  var armAmp = 0.36*amt;
  var foldL = Math.max(0, s)*amt*(e.hasShield?0.26:0.34);
  var foldR = Math.max(0,-s)*amt*(e.ranged?0.12 : spearish?0.28 : e.hasShield?0.18 : 0.24);
  P.armL.sh.rotation.set(restShL + s*armAmp*sSwing, 0, restZL + amt*0.02 + Math.cos(e.walk)*0.03*amt*sSwing);
  P.armR.sh.rotation.set(restShR - s*armAmp*wSwing, 0, -amt*0.02 - Math.cos(e.walk)*0.03*amt*wSwing);
  P.armL.el.rotation.x = restElL - foldL;
  P.armR.el.rotation.x = restElR - foldR;
  if(P.armL.wr) P.armL.wr.rotation.set(-0.05 - 0.12*foldL, 0, 0.03*Math.sin(gameTime*1.3+e.walk));
  if(P.armR.wr) P.armR.wr.rotation.set((e.ranged?-0.1:(spearish?0:-0.16)) - 0.12*foldR, 0, 0);

  /* ------- AIM (ranged holding RMB): anchored draw, elbow high, slight cant ------- */
  var aiming = e.isPlayer && e.ranged && e.aiming;
  if(aiming){
    P.armL.sh.rotation.set(-1.52,0,0.10); P.armL.el.rotation.x=-0.08;
    P.armR.sh.rotation.set(-1.3,0,-0.15); P.armR.el.rotation.x=-1.62;
    if(P.armR.wr) P.armR.wr.rotation.x=-0.5;
    if(P.armL.wr) P.armL.wr.rotation.x=0.12;
    e.body.rotation.y=-0.06;
  }
  var bowDraw=e.ranged&&aiming?1:0;
  /* ------- SHIELD BLOCK: shield braces center-chest, crouch, recoil on impact ------- */
  var blocking = e.blocking && !e.ranged;
  if(blocking){
    var bs=Math.max(e.blockStat,0.6), kick=e.blockKick;
    P.armL.sh.rotation.set(-1.32+kick*0.4, 0.16, 0.5-kick*0.22);
    P.armL.el.rotation.x=-1.02+kick*0.3;
    if(P.armL.wr) P.armL.wr.rotation.x=-0.3+kick*0.35;
    P.legL.knee.rotation.x+=0.3*bs; P.legR.knee.rotation.x+=0.3*bs;
    P.legL.hip.rotation.x-=0.12*bs; P.legR.hip.rotation.x-=0.12*bs;
    e.body.position.y-=0.07*bs;
    e.body.rotation.x=-0.07*bs - kick*0.06;
    P.head.rotation.x=0.08*bs;
  }
  /* ------- ATTACK ANIMATIONS — anticipation > strike (ease-in) > follow-through > recover ------- */
  if(e.animT>=0){
    var ph=clamp(e.animT/e.animDur,0,1);
    var kind=e.atkKind||'overhead';
    if(e.ranged){
      /* bow cycle: raise & draw > anchor at cheek > RELEASE > string-hand recoil */
      var draw, rel;
      if(ph<0.55){ draw=easeOut(ph/0.55); rel=0; }
      else if(ph<0.68){ draw=1; rel=0; }
      else if(ph<0.78){ var ru=(ph-0.68)/0.10; draw=1-easeIn(ru); rel=ru; }
      else { draw=0; rel=1; }
      bowDraw=draw;
      P.armL.sh.rotation.set(-1.52,0,0.10); P.armL.el.rotation.x=-0.08-0.1*(1-draw);
      P.armR.sh.rotation.set(-1.05+0.25*(1-draw),0,-0.15-0.3*rel);
      P.armR.el.rotation.x=-0.25-1.37*draw+0.45*rel;
      if(P.armR.wr) P.armR.wr.rotation.x=-0.5*draw+0.4*rel;
      if(P.armL.wr) P.armL.wr.rotation.x=0.12;
      e.body.rotation.y=-0.06*draw;
      e.body.rotation.x=0.03*draw;
    } else if(kind==='thrust'){
      /* spear: deep coil back, then an explosive driving lunge through the hip */
      var th;
      if(ph<0.30) th=-easeOut(ph/0.30);
      else if(ph<0.48) th=easeIn((ph-0.30)/0.18);
      else if(ph<0.66) th=1;
      else th=1-easeInOut((ph-0.66)/0.34);
      var wind=Math.max(0,-th), drive=Math.max(0,th);
      P.armR.sh.rotation.set(restShR+0.5*wind-0.85*drive, 0, 0.12*wind);
      P.armR.el.rotation.x=restElR+0.4*wind+1.0*drive;
      if(P.armR.wr) P.armR.wr.rotation.x=0.25*wind-0.2*drive;
      P.armL.sh.rotation.set(restShL-0.4*drive+0.3*wind, 0, restZL);
      P.armL.el.rotation.x=restElL-0.2*drive;
      e.body.rotation.x=-0.12*drive+0.06*wind;
      e.body.rotation.y=0.12*wind-0.16*drive;
    } else if(kind==='bash'){
      /* shield bash: shield cocked, then driven forward — weapon hand guards high */
      var ba;
      if(ph<0.34) ba=-easeOut(ph/0.34);
      else if(ph<0.55) ba=easeIn((ph-0.34)/0.21);
      else if(ph<0.7) ba=1;
      else ba=1-easeInOut((ph-0.7)/0.3);
      var bw=Math.max(0,-ba), bd=Math.max(0,ba);
      P.armL.sh.rotation.set(-1.05+0.45*bw-0.5*bd, 0.1-0.1*bd, 0.5-0.25*bd);
      P.armL.el.rotation.x=-0.9+0.3*bw+0.75*bd;
      P.armR.sh.rotation.set(restShR+0.55*bw-0.2*bd, 0, -0.3*bw);
      P.armR.el.rotation.x=restElR-0.5*bw;
      e.body.rotation.x=-0.1*bw+0.14*bd;
      e.body.rotation.y=0.1*bw-0.08*bd;
    } else {
      /* overhead: coil up-back (ease-out), whip down (ease-in SQUARED), overshoot, settle */
      var oh, ov;
      if(ph<0.32){ oh=easeOut(ph/0.32); ov=0; }
      else if(ph<0.5){ var ou=(ph-0.32)/0.18, k=ou*ou; oh=1-k; ov=k; }
      else if(ph<0.68){ var ou2=easeOut((ph-0.5)/0.18); oh=0; ov=1-ou2*0.45; }
      else { var ou3=easeInOut((ph-0.68)/0.32); ov=0.55*(1-ou3); oh=0; }
      var shR=restShR + oh*(-2.55-restShR) + ov*(0.62-restShR);
      var elR=restElR + oh*(-1.75-restElR) + ov*0.9*(0.35-restElR);
      var swZ=oh*(-0.3) + ov*0.34;
      P.armR.sh.rotation.set(shR, 0, swZ);
      P.armR.el.rotation.x=elR;
      if(P.armR.wr) P.armR.wr.rotation.x=oh*0.85 - ov*0.7;
      P.armL.sh.rotation.set(restShL-oh*0.3+ov*0.15, 0, restZL+oh*0.1-ov*0.08);
      P.armL.el.rotation.x=restElL+oh*0.3-ov*0.2;
      e.body.rotation.y=oh*0.3 - ov*0.34;
      e.body.rotation.x=-0.05*oh + 0.1*ov;
      e.body.position.y-=ov*0.05;
      P.head.rotation.y=-e.body.rotation.y*0.6;    /* eyes locked on target */
    }
  }
  /* ------- stagger: reel from the blow ------- */
  if(e.staggerT>0 && e.animT<0){
    var st=Math.min(1, e.staggerT*2.4);
    e.body.rotation.x=-0.18*st;
    P.head.rotation.x=0.14*st;
    P.armL.sh.rotation.z-=0.3*st; P.armR.sh.rotation.z+=0.3*st;
  }
  /* ------- idle micro-motion: weight shifts, breathing, live wrists ------- */
  if(amt<0.05 && e.animT<0 && !aiming){
    var sway=Math.sin(gameTime*1.6+e.walk)*0.035;
    var br=Math.sin(gameTime*1.8+e.walk*0.9);
    P.armL.sh.rotation.x+=sway+br*0.012; P.armR.sh.rotation.x-=sway+br*0.012;
    P.armL.el.rotation.x+=br*0.016; P.armR.el.rotation.x+=br*0.016;
    e.body.position.y+=br*0.01;
  }
  if(e.kind==='worker' && e.bend>0){
    e.body.rotation.x=e.bend;
    P.armL.sh.rotation.x=-1.2; P.armR.sh.rotation.x=-1.2;
    P.armL.el.rotation.x=-0.22; P.armR.el.rotation.x=-0.22;
    P.head.rotation.x=-e.bend*0.8;
  }
  if(e.weaponMesh)updateWeaponPose(e.weaponMesh,bowDraw);
  e.group.rotation.y=e.yaw;
  e.group.rotation.x=0;
  e.bar.grp.position.set(e.group.position.x, e.group.position.y+(e.isCommander?2.7:2.3), e.group.position.z);
  var ratio=clamp(e.hp/e.maxHp,0,1);
  e.bar.fill.scale.x=e.bar.w*ratio;
}

/* ============================================================
   villages.js — the 48 free villages (ROM-MAP-SPEC-003 §7.1, §8)
   ------------------------------------------------------------
   Each VILLAGES entry is built from its regional construction kit
   (RBL_KITS: CA AR VA MO TD CP BF) on a 48u pad: plaza, two streets
   (one of them meets the village lane from roads.js), 10–16 solid
   houses with porches, the church of the kit, three vernacular
   extras (fânar, bordei, cumpănă, cula, poartă, cramă, han…), a well,
   a wayside cross, lanterns, and the special feature of §7.1 for
   the NV villages (orchard, apiary, salt pans, log bridge, sluice…).
   ============================================================ */
function vFree(x,z,r){ if(insideSolid(x,z,r)) return false; if(nearDoor(x,z,r+1)) return false; var f=roadField(x,z); if(f.road&&f.d<f.road.w/2+r+0.8) return false; var rf=riverField(x,z,64); if(rf.river&&rf.d<riverHalfWidth(rf.river,z)*1.5+r) return false; return true; }
/* a broadleaf tree: trunk, three tapered tiers that read as a round crown */
function kitTree(kit,tx,tz,col,s,fir){
  var ty=groundH(tx,tz), C=MS(col,SURF.GRAIN), C2=MS(tintHex(col,0.12),SURF.GRAIN);
  kit.cyln(MS(0x5a4632,SURF.WOOD),0.22*s,0.34*s,2.4*s,6,tx,ty+1.2*s,tz);
  if(fir){ kit.pyr(C,1.9*s,3.4*s,8,tx,ty+3.6*s,tz); kit.pyr(C2,1.4*s,2.6*s,8,tx,ty+5.4*s,tz); kit.pyr(C2,0.8*s,1.8*s,8,tx,ty+6.9*s,tz); }
  else { kit.cyln(C,1.9*s,1.2*s,1.3*s,8,tx,ty+2.9*s,tz); kit.cyln(C,1.7*s,1.9*s,1.4*s,8,tx,ty+4.2*s,tz); kit.cyln(C2,0.7*s,1.7*s,1.5*s,8,tx,ty+5.6*s,tz); }
  addCollider(tx-0.4,tz-0.4,tx+0.4,tz+0.4);
}
function vTreeRing(x,z,n,r,rnd,col,scale){
  var kit=cellKit(x,z), i, fir=(col===0x2f4a2e||col===0x3a5a2e);
  for(i=0;i<n;i++){ var a=i/n*TAU+rnd()*0.6, tx=x+Math.cos(a)*r*(0.8+rnd()*0.4), tz=z+Math.sin(a)*r*(0.8+rnd()*0.4); if(!vFree(tx,tz,2.2)) continue; kitTree(kit,tx,tz,col,(scale||1)*(0.8+rnd()*0.5),fir); }
}
function vPalm(kit,x,z,s){ var y=groundH(x,z); s=s||1; kit.cyln(M2(0x8a6a3a),0.22*s,0.34*s,6*s,6,x,y+3*s,z,0.08,0,0.06); for(var i=0;i<6;i++){ var a=i/6*TAU; kit.box(M2(0x5a8a3a),2.6*s,0.12,0.7*s, x+Math.cos(a)*1.2*s, y+6*s+0.2, z+Math.sin(a)*1.2*s, -a, 0, -0.5); } addCollider(x-0.35,z-0.35,x+0.35,z+0.35); }
function vSlot(X,Z,k){ return [[X+30,Z-34],[X-30,Z+34],[X+30,Z+34],[X+52,Z-30],[X-52,Z+30],[X-30,Z-34]][k%6]; }
function buildVillageFeature(v,X,Z,rnd,kit){
  var i, y;
  switch(v.feat){
    case 'cherry': for(i=0;i<14;i++){ var cx=X-40+(i%7)*13, cz=Z+58+Math.floor(i/7)*10; if(!vFree(cx,cz,2)) continue; y=groundH(cx,cz); kit.cyln(M2(0x5d4326),0.2,0.3,2.0,6,cx,y+1,cz); kit.cyln(M2(0xd98aa0),1.8,1.0,2.2,7,cx,y+3.0,cz); addCollider(cx-0.3,cz-0.3,cx+0.3,cz+0.3); } break;
    case 'oaks': vTreeRing(X,Z-64,5,14,rnd,0x3f6a2a,1.7); propTroita(X,Z-64,0); break;
    case 'apiary': propFence(X-46,Z-62,X-14,Z-62,1.0); propFence(X-46,Z-62,X-46,Z-46,1.0); for(i=0;i<8;i++){ var bx=X-43+i*4, bz=Z-56; y=groundH(bx,bz); kit.box(M2([0xe2d6bb,0x3f5f8a,0xc9a227,0x7a3434][i%4]),0.8,0.9,0.8,bx,y+0.55,bz); kit.box(M2(0x5d4a38),1.0,0.12,1.0,bx,y+1.05,bz); addCollider(bx-0.45,bz-0.45,bx+0.45,bz+0.45); } break;
    case 'fulling': rblMoaraApa({x:X+58, z:Z+30, door:'W', name:'Piua din '+v.name}); break;
    case 'fishing': for(i=0;i<3;i++){ var fx=X-20+i*8, fz=Z-58; y=groundH(fx,fz); kit.box(M2(0x5d4326),0.15,2.2,0.15,fx-1.2,y+1.1,fz); kit.box(M2(0x5d4326),0.15,2.2,0.15,fx+1.2,y+1.1,fz); kit.box(M2(0x8a8a7a),2.6,1.6,0.04,fx,y+1.3,fz); addCollider(fx-1.3,fz-0.2,fx+1.3,fz+0.2); }
      var rf=riverField(X,Z-80); if(rf.river){ var bp=rf.river.pts[rf.seg]; var bxx=bp[0], bzz=bp[1]+riverHalfWidth(rf.river,bp[1])*0.7; kit.box(M2(0x6b4f2e),3,1.1,7,bxx,riverWaterY(bxx,bzz)+0.1,bzz); kit.box(M2(0x6b4f2e),3.4,1.1,7,bxx+5,riverWaterY(bxx+5,bzz)+0.1,bzz,0.3); } break;
    case 'marsh': for(i=0;i<40;i++){ var mx=X+(rnd()*2-1)*70, mz=Z+50+rnd()*30; if(!vFree(mx,mz,0.5)) continue; y=groundH(mx,mz); kit.cyln(M2(0x6a7a3a),0.05,0.08,1.6+rnd(),4,mx,y+0.9,mz,0.1*rnd(),0,0.1*rnd()); }
      for(i=0;i<8;i++){ var dx=X-20+i*5, dz=Z+60; kit.box(M2(0x6b4f2e),4.8,0.12,1.4,dx,groundH(dx,dz)+0.15,dz); } break;
    case 'sand': for(i=0;i<6;i++){ var sx=X+(rnd()*2-1)*60, sz=Z+56+rnd()*20; if(!vFree(sx,sz,4)) continue; kit.cyln(M2(0xd9c28a),4+rnd()*3,6+rnd()*3,1.2,9,sx,groundH(sx,sz)+0.4,sz); } for(i=0;i<3;i++) vPalm(kit,X-30+i*30,Z-58,1.1); break;
    case 'customs': buildBuilding({x:X, z:Z-64, w:10, d:7, h:3.8, wall:0x6b4f2e, roofCol:0x4a3a2a, roof:'gable', door:'S', interior:'customs', name:'Vama '+v.name, style:'log'}); kit.box(M2(0xe2d6bb),0.16,0.16,9,X+8,groundH(X+8,Z-58)+1.1,Z-58,0,0,0); kit.box(M2(0x8b2d2d),0.16,0.16,3,X+8,groundH(X+8,Z-58)+1.1,Z-55,0,0,0); addCollider(X+7.7,Z-63,X+8.3,Z-53); break;
    case 'inn': rblHan({x:X, z:Z-66, door:'S', name:'Hanul lui Iancu', lore:{key:'han_iancu', icon:'🍺', sub:'The inn of Iancu', story:'Stables for forty horses and a fiddler every Saturday. Iancu\'s wife keeps the ledger; Iancu keeps the stories.'}}); break;
    case 'salt': for(i=0;i<6;i++){ var px=X-30+(i%3)*22, pz=Z+56+Math.floor(i/3)*16; y=groundH(px,pz); kit.box(M2(0x6e5f43),18,0.4,12,px,y+0.1,pz); kit.box(M2(0xf4f1ea),16.5,0.16,10.5,px,y+0.35,pz); addCollider(px-9,pz-6,px+9,pz+6); } rblSalt({x:X+44, z:Z+30, door:'W', name:'Magazia de Sare '+v.name}); break;
    case 'logbridge': var rb=riverField(X,Z); if(rb.river){ var q=rb.river.pts[rb.seg], q2=rb.river.pts[Math.min(rb.seg+1,rb.river.pts.length-1)], ang=Math.atan2(q2[1]-q[1],q2[0]-q[0])+Math.PI/2, hw2=riverHalfWidth(rb.river,q[1]);
        var lx=q[0], lz=q[1], ly=flatsH(lx,lz)+0.3; for(i=-1;i<=1;i++) kit.cyln(M2(0x5d4326),0.32,0.32,hw2*2.6,7,lx+Math.cos(ang+Math.PI/2)*i*0.7,ly,lz+Math.sin(ang+Math.PI/2)*i*0.7,0,0,Math.PI/2); kit.box(M2(0x6b4f2e),hw2*2.6,0.12,2.2,lx,ly+0.3,lz,-ang);
        BRIDGES.push({id:'BR-21', x:lx, z:lz, ang:ang, len:hw2*2.6, w:2.2, y:ly+0.36, name:'Puntea Lupului', log:true}); } break;
    case 'orchard': for(i=0;i<16;i++){ var ox=X-42+(i%8)*12, oz=Z+58+Math.floor(i/8)*11; if(!vFree(ox,oz,2)) continue; y=groundH(ox,oz); kit.cyln(M2(0x5d4326),0.2,0.28,1.8,6,ox,y+0.9,oz); kit.cyln(M2(0x5a8a3a),1.7,1.1,2.0,7,ox,y+2.7,oz); kit.box(M2(0xc23b2a),0.3,0.3,0.3,ox+0.8,y+2.4,oz+0.6); addCollider(ox-0.3,oz-0.3,ox+0.3,oz+0.3); } propFence(X-48,Z+52,X+48,Z+52,1.0); break;
    case 'sluice': var sl=X, sz2=Z-64; y=groundH(sl,sz2); kit.box(M2(0x5d4326),0.4,3.2,0.4,sl-2.4,y+1.6,sz2); kit.box(M2(0x5d4326),0.4,3.2,0.4,sl+2.4,y+1.6,sz2); kit.box(M2(0x6b4f2e),4.6,0.4,0.4,sl,y+3.0,sz2); kit.box(M2(0x8a8a7a),4.4,1.8,0.2,sl,y+0.9,sz2); kit.cyln(WATER_MAT,2.2,2.2,0.1,10,sl,y+0.1,sz2+3); kit.box(M2(0x50565e),0.12,3.4,0.12,sl,y+3.2,sz2); addCollider(sl-2.6,sz2-0.4,sl+2.6,sz2+0.4); ANIM_PARTS.push({kind:'splash', x:sl, y:y+0.6, z:sz2+1.2}); break;
    case 'crest': for(i=0;i<7;i++) lmRock(kit, X-40+i*13, Z-64+(i%2)*6, 1.6+rnd()*1.4, M2(0x8a8a86)); kit.box(M2(0x5d4326),6,0.3,4,X,groundH(X,Z-60)+2.2,Z-60); for(i=-1;i<=1;i+=2){ kit.box(M2(0x5d4326),0.2,2.4,0.2,X+i*2.8,groundH(X,Z-60)+1.2,Z-58); kit.box(M2(0x5d4326),0.2,2.4,0.2,X+i*2.8,groundH(X,Z-60)+1.2,Z-62); } addCollider(X-3,Z-62,X+3,Z-58); break;
    case 'icehouse': rblBeci(X-30, Z-62, 'S'); for(i=0;i<4;i++) kit.box(M2(0xdff0ff),1.0,0.8,1.0,X-24+i*1.3,groundH(X-24,Z-56)+0.4,Z-56); break;
    case 'oasis': for(i=0;i<8;i++){ var pa=i/8*TAU, pxx=X+Math.cos(pa)*26, pzz=Z+40+Math.sin(pa)*22; if(vFree(pxx,pzz,1.5)) vPalm(kit,pxx,pzz,1+rnd()*0.4); } break;
    case 'weavers': for(i=0;i<3;i++){ var wx=X+34+i*4, wz=Z-56; y=groundH(wx,wz); kit.box(M2(0x5d4326),0.15,2.6,0.15,wx-1.5,y+1.3,wz); kit.box(M2(0x5d4326),0.15,2.6,0.15,wx+1.5,y+1.3,wz); kit.box(M2(0x5d4326),3.2,0.12,0.12,wx,y+2.5,wz); kit.box(M2([0x8b2d2d,0x2f5a7a,0xc9a227][i]),0.9,1.9,0.05,wx-0.6,y+1.5,wz); kit.box(M2([0x3f5f8a,0xe8e0cf,0x5a7a3a][i]),0.9,1.6,0.05,wx+0.6,y+1.6,wz); addCollider(wx-1.6,wz-0.2,wx+1.6,wz+0.2); } break;
    case 'ash': for(i=0;i<3;i++) lmSmokeRuin(kit, X-30+i*22, Z-60, 5, 4, rnd()*0.4, rnd); break;
  }
}
/* ---- yards (ogrăzi): every village house stands in a fenced yard — gate on the street line, side fences on the
   shared boundaries, a back fence; behind the house a kitchen garden, woodpile, haystack, fruit trees, an outdoor oven,
   beehives, a dovecote, a cart or a shed (a real prefab shed with an interior). Fence pieces that would run into a
   church, an extra or a road are left out. ---- */
function yardClear(x,z,r){ if(insideSolid(x,z,r)) return false; if(nearDoor(x,z,r+1.2)) return false; var f=roadField(x,z); if(f.road&&f.d<f.road.w/2+r+0.5) return false; return true; }
function yardFence(a,b){
  var L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<0.8) return;
  var n=Math.max(1,Math.ceil(L/5.5)), i, ok=[], ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L;
  /* test every piece before building any (a built piece's own collider must not block its neighbour) */
  for(i=0;i<n;i++){
    var t0=i/n, t1=(i+1)/n, x0=a[0]+(b[0]-a[0])*t0, z0=a[1]+(b[1]-a[1])*t0, x1=a[0]+(b[0]-a[0])*t1, z1=a[1]+(b[1]-a[1])*t1, mx=(x0+x1)/2, mz=(z0+z1)/2;
    ok.push(yardClear(x0+ux*0.4,z0+uz*0.4,0.3)&&yardClear(x1-ux*0.4,z1-uz*0.4,0.3)&&yardClear(mx,mz,0.45));
  }
  for(i=0;i<n;i++){ if(!ok[i]) continue; var s0=i/n, s1=(i+1)/n; propFence(a[0]+(b[0]-a[0])*s0,a[1]+(b[1]-a[1])*s0,a[0]+(b[0]-a[0])*s1,a[1]+(b[1]-a[1])*s1,1.05); }
}
/* is a rectangle (centre, half sizes) clear — corners and centre, small probes */
function yardRectClear(x,z,hx,hz){ return yardClear(x,z,0.4)&&yardClear(x-hx,z-hz,0.3)&&yardClear(x+hx,z-hz,0.3)&&yardClear(x-hx,z+hz,0.3)&&yardClear(x+hx,z+hz,0.3); }
/* a village gate (poartă): two carved posts, a lintel and a little shingled roof over the opening */
function yardGate(a,b,kit,rp){
  var mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2, y=groundH(mx,mz), L=Math.hypot(b[0]-a[0],b[1]-a[1]), ry=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  if(!yardClear(mx,mz,0.3)) return;
  var T=MS(0x5d4326,SURF.WOOD), R=MS(rp||0x4a3a2a,SURF.SHINGLE), i;
  for(i=0;i<2;i++){ var px=i?b[0]:a[0], pz=i?b[1]:a[1]; kit.box(T,0.3,2.6,0.3,px,y+1.3,pz,ry); kit.box(MS(0x6b4f2e,SURF.WOOD),0.42,0.16,0.42,px,y+2.62,pz,ry); addCollider(px-0.16,pz-0.16,px+0.16,pz+0.16); }
  kit.box(T,L+0.3,0.2,0.22,mx,y+2.55,mz,ry);
  kit.prism(R,1.2,0.55,L+0.9,mx,y+2.95,mz,ry+Math.PI/2);
}
function yardTree(kit,x,z,K,rnd,fir){ kitTree(kit,x,z,K.tree,0.6+rnd()*0.4,fir); }
function yardGarden(kit,x,z,w,d,ry,crop){
  var y=groundH(x,z), rows=Math.max(3,Math.floor(w/1.2)), i, c=Math.cos(ry), s=Math.sin(ry);
  kit.box(MS(0x5a4632,SURF.GROUND),w,0.1,d,x,y+0.05,z,ry);
  for(i=0;i<rows;i++){ var u=-w/2+(i+0.5)*(w/rows); kit.box(MS(i%2?crop:0x4a6a3a,SURF.GRAIN),0.6,0.32,d-0.5,x+u*c,y+0.2,z-u*s,ry); }
}
function villageYards(rows,v,K,rnd,kit){
  var reg=v.region||'wallachian', fir=(reg==='carpathian'||reg==='moldavian'), crop=(reg==='wallachian'||reg==='battlefield')?0x6a8a3a:0xb4a15a, n=0;
  rows.forEach(function(row){
    var hs=row.houses.slice().sort(function(a,b){ return a.u-b.u; }); if(!hs.length) return;
    var axis=row.axis, side=row.side, cross=row.cross;
    var P=(axis==='x')?function(u,vv){ return [u, cross+side*vv]; }:function(u,vv){ return [cross+side*vv, u]; };
    var faceHouse=(axis==='x')?(side>0?'N':'S'):(side>0?'W':'E');          /* looking back toward the street */
    var edges=[hs[0].u-hs[0].w/2-1.4], i;
    for(i=0;i<hs.length-1;i++) edges.push((hs[i].u+hs[i].w/2+hs[i+1].u-hs[i+1].w/2)/2);
    edges.push(hs[hs.length-1].u+hs[hs.length-1].w/2+1.4);
    hs.forEach(function(h,i){
      var u0=edges[i], u1=edges[i+1], vF=3.0, vWall=5.2+h.d, vBack=vWall+10+rnd()*3.5;
      var gw=h.doorW+1.9, g0=h.u-gw/2, g1=h.u+gw/2;
      yardFence(P(u0,vF),P(g0,vF)); yardFence(P(g1,vF),P(u1,vF));
      yardFence(P(u0,vF),P(u0,vBack)); if(i===hs.length-1) yardFence(P(u1,vF),P(u1,vBack));
      yardFence(P(u0,vBack),P(u1,vBack));
      yardGate(P(g0,vF),P(g1,vF),kit,K.roof[0]);
      /* the yard behind the house */
      var taken=[];
      function spot(r){ for(var t=0;t<8;t++){ var uu=u0+1.6+r+rnd()*Math.max(0.5,(u1-u0)-3.2-2*r), vv=vWall+1.4+r+rnd()*Math.max(0.5,(vBack-vWall)-2.8-2*r), p=P(uu,vv), ok=yardClear(p[0],p[1],r), k;
          for(k=0;k<taken.length&&ok;k++){ if(Math.hypot(taken[k][0]-p[0],taken[k][1]-p[1])<taken[k][2]+r) ok=false; }
          if(ok){ taken.push([p[0],p[1],r]); return p; } } return null; }
      var items=['garden','woodpile','haystack','tree','tree','oven','beehives','shed','dovecote','cart'], used={}, k, p;
      var cnt=3+Math.floor(rnd()*3);
      for(k=0;k<cnt;k++){
        var it=items[Math.floor(rnd()*items.length)]; if(used[it]&&it!=='tree') continue; used[it]=1;
        if(it==='garden'){ var gwid=Math.min(u1-u0-3.4,7), gdep=Math.min(vBack-vWall-3.2,5); if(gwid<2.6||gdep<2.4) continue; p=P((u0+u1)/2,vWall+1.6+gdep/2); var ghx=(axis==='x'?gwid:gdep)/2, ghz=(axis==='x'?gdep:gwid)/2; if(yardRectClear(p[0],p[1],ghx,ghz)){ taken.push([p[0],p[1],Math.hypot(gwid,gdep)/2]); yardGarden(kit,p[0],p[1],ghx*2,ghz*2,0,crop); n++; } }
        else if(it==='woodpile'){ if((p=spot(1.5))) prefabPlace('prop.woodpile',p[0],p[1],rnd()<0.5?'S':'E',{force:true}); }
        else if(it==='haystack'){ if((p=spot(1.8))) prefabPlace('prop.haystack',p[0],p[1],'S',{force:true}); }
        else if(it==='oven'){ if((p=spot(1.3))) prefabPlace('prop.oven',p[0],p[1],faceHouse,{force:true}); }
        else if(it==='beehives'){ if((p=spot(1.6))) prefabPlace('prop.beehives',p[0],p[1],'S',{force:true}); }
        else if(it==='dovecote'){ if((p=spot(1.0))) prefabPlace('prop.dovecote',p[0],p[1],'S',{force:true}); }
        else if(it==='cart'){ if((p=spot(1.9))) prefabPlace('prop.cart',p[0],p[1],axis==='x'?'E':'S',{force:true}); }
        else if(it==='shed'){ var sk=reg+'.shed1', sp=prefabGet(sk); if(sp){ var sq=P(u0+2.6+rnd()*Math.max(0.5,(u1-u0)-5.2), vBack-2.4); var sr=Math.hypot(sp.hx,sp.hz)+0.8; if(yardClear(sq[0],sq[1],sr)){ taken.push([sq[0],sq[1],sr]); prefabPlace(sk,sq[0],sq[1],faceHouse); n++; } } }
        else { if((p=spot(2.0))) yardTree(kit,p[0],p[1],K,rnd,fir); }
      }
      n++;
    });
  });
  return n;
}
var _villageI=0;
function buildVillages(budget){
  var tEnd=budget?performance.now()+budget:1e15, start=_villageI;
  for(; _villageI<VILLAGES.length; _villageI++){
    if(budget && _villageI>start && performance.now()>=tEnd) return true;
    var v=VILLAGES[_villageI], vi=_villageI;
    if(v._area) continue;
    if(typeof inLoadArea==='function' && !inLoadArea(v.x, v.z)) continue;
    v._area=1;
    var K=RBL_KITS[v.kit]||RBL_KITS.VA, rnd=srand(vi*7919+11), X=v.x, Z=v.z, i, kit=cellKit(X,Z);
    siteBegin('sat:'+v.name, X, Z, 120);
    var SC=K.street;
    townPlaza(X, Z, 12, SC);
    townStreet(X-54, Z, X+54, Z, 5, SC); townStreet(X, Z-56, X, Z+56, 4.5, SC);
    /* houses stand 5.2 u back from the street centreline, each in its own fenced yard (villageYards) */
    var rows=[], curRow=null;
    var HO={rnd:rnd, wall:K.wall, roofCol:K.roof, roof:K.roofKind, style:K.style, timberFrame:K.timberFrame, plinth:K.plinth, h:3.3, w:[5.5,7.5], d:[4.6,6.2], porch:true, prispa:K.prispa||0, band:K.band, off:4.6, interior:function(k){ return K.style==='log'?'loghouse':'house'; },
             onBuilt:function(h){ curRow.houses.push(h); }};
    function row(axis,u0,u1,cross,side){ curRow={axis:axis, side:side, cross:cross, houses:[]}; rows.push(curRow); houseRow(axis,u0,u1,cross,side,HO); }
    row('x', X-50, X-12, Z, 1); row('x', X+12, X+50, Z, 1); row('x', X-50, X-12, Z, -1); row('x', X+12, X+50, Z, -1);
    row('z', Z+28, Z+52, X, 1); row('z', Z-52, Z-28, X, -1); row('z', Z+28, Z+52, X, -1); row('z', Z-52, Z-28, X, 1);
    /* the church of the kit */
    var cs=vSlot(X,Z,5);
    if(K.church==='lemn') rblBisericaLemn({x:cs[0], z:cs[1], door:'S', name:'Biserica de lemn din '+v.name});
    else buildBuilding({x:cs[0], z:cs[1], w:7, d:12, h:5, wall:0xe2d6bb, roofCol:0x3f5f8a, roof:'church', door:'S', interior:'chapel', name:'Biserica din '+v.name, belfry:true});
    /* three extras of the kit, in fixed slots */
    var ex=K.extras.slice(), used=0;
    for(i=0;i<ex.length&&used<3;i++){
      var kind=ex[(i+vi)%ex.length], sl=vSlot(X,Z,used), sx=sl[0], sz=sl[1], door=(sz<Z)?'S':'N';
      if(kind==='cula'&&vi%3!==0) continue; if(kind==='conac'&&vi%2!==0) continue; if(kind==='stana'&&vi%2!==0) continue;
      if(kind==='fanar'){ if(vFree(sx,sz,2.2)) rblFanar(sx,sz,0.3); }
      else if(kind==='bordei'){ if(vFree(sx,sz,4)) rblBordei({x:sx, z:sz, door:door, name:'Bordeiul '+(used+1)}); }
      else if(kind==='stana'){ var stx=X+78, stz=Z+62; if(vFree(stx,stz,20)) rblStana(stx,stz,rnd,{name:'Stâna '+v.name}); }
      else if(kind==='afumatoare'){ if(vFree(sx,sz,3)) rblAfumatoare({x:sx, z:sz, door:door, name:'Afumătoarea'}); }
      else if(kind==='beci'){ if(vFree(sx,sz,4.5)) rblBeci(sx,sz,door); }
      else if(kind==='foisor'){ if(vFree(sx,sz,5.5)) rblFoisor({x:sx, z:sz, door:door, name:'Casa cu foișor', wall:K.wall[0], roofCol:K.roof[0], timberFrame:true}); }
      else if(kind==='crama'){ if(vFree(sx,sz,5.5)) rblCrama({x:sx, z:sz, door:door, name:'Crama '+v.name}); }
      else if(kind==='poarta'){ var gx=X-56, gz=Z; if(vFree(gx,gz,3)) rblPoarta(gx,gz,Math.PI/2); }
      else if(kind==='sura'){ if(vFree(sx,sz,7)) rblSura({x:sx, z:sz, door:door, name:'Șura'}); }
      else if(kind==='cumpana'){ if(vFree(X+9,Z+9,1.5)) rblCumpana(X+9,Z+9,0.4); }
      else if(kind==='porumbar'){ if(vFree(sx,sz,2)) rblPorumbar(sx,sz,0.2); }
      else if(kind==='cula'){ if(vFree(sx,sz,6)) rblCula({x:sx, z:sz, door:door, name:'Cula '+v.name}); }
      else if(kind==='han'){ if(vFree(sx,sz,8)) rblHan({x:sx, z:sz, door:door, name:'Hanul '+v.name, wall:K.wall[0], roofCol:K.roof[0]}); }
      else if(kind==='fantana'){ rblFantana(X, Z, K.roof[0]); }
      else if(kind==='conac'){ if(vFree(sx,sz,10)) rblConac({x:sx, z:sz, door:door, name:'Conacul '+v.name}); }
      else if(kind==='grajd'){ if(vFree(sx,sz,6)) rblGrajd({x:sx, z:sz, door:door, name:'Grajdul'}); }
      else if(kind==='memorial'){ var mm=sl; kit.box(M2(0x8f8a80),1.6,2.6,0.6,mm[0],groundH(mm[0],mm[1])+1.3,mm[1]); kit.box(M2(0xc9a227),0.1,0.9,0.1,mm[0],groundH(mm[0],mm[1])+3.0,mm[1]); addCollider(mm[0]-0.9,mm[1]-0.4,mm[0]+0.9,mm[1]+0.4); lmGraveField(kit,mm[0]+8,mm[1],5,6,rnd); }
      used++;
    }
    if(!(K.extras.indexOf('fantana')>=0)) propWell(X, Z, K.roof[0]);
    if(K.burned){ lmSmokeRuin(kit, X+40, Z+34, 5, 4, 0.2, rnd); lmSmokeRuin(kit, X-40, Z-34, 4, 4, -0.3, rnd); }
    buildVillageFeature(v,X,Z,rnd,kit);
    propCampfire(X+6, Z+7, false);
    for(i=0;i<3;i++){ var hx=X+34+i*3.2, hz=Z+38; if(vFree(hx,hz,1.6)){ kit.cyln(M2(0xc9b24a),1.1,1.3,1.5,8,hx,groundH(hx,hz)+0.75,hz); kit.pyr(M2(0xb5a487),1.2,0.8,8,hx,groundH(hx,hz)+1.9,hz); addCollider(hx-1.2,hz-1.2,hx+1.2,hz+1.2); } }
    propFence(X-48, Z+30, X-30, Z+30, 1.0); propFence(X-48, Z+30, X-48, Z+44, 1.0);
    propTroita(X+8, Z-10, 0.2);
    torchPost(X-6, Z-6, 2.4); torchPost(X+6, Z-6, 2.4);
    villageYards(rows, v, K, rnd, kit);
    vTreeRing(X, Z, 10, 62, rnd, K.tree, 1); vTreeRing(X, Z, 8, 74, rnd, K.tree, 1.2);
    siteEnd();
    registerLore({key:'village'+vi, x:X, z:Z, r:34, icon:'V',
      name:'Satul '+v.name+(v.id&&v.id.indexOf('NV')===0?' ('+v.id+')':''), sub:'Free village — '+(WORLD_REGIONS[v.region]?WORLD_REGIONS[v.region].name:v.region)+' — kit '+v.kit,
      story:'Craftsmen, fields and quiet days. A village pays tribute to whoever holds the land it stands on — take the zone and its workers earn gold for your crown. Guard them: wolves and soldiers ask no permission.'});
  }
  _villageI=0;
  return false;
}

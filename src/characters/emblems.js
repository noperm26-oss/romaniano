/* ---------------- canvas textures / emblems ---------------- */
function canvasTex(w,h,draw){
  var c=document.createElement('canvas'); c.width=w; c.height=h;
  draw(c.getContext('2d'));
  var t=new THREE.CanvasTexture(c); t.anisotropy=4;
  return t;
}
function drawStar(g,cx,cy,r){
  g.beginPath();
  for(var i=0;i<10;i++){
    var rr=(i%2===0)?r:r*0.42, a=-Math.PI/2 + i*Math.PI/5;
    var x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
    if(i===0) g.moveTo(x,y); else g.lineTo(x,y);
  }
  g.closePath(); g.fill();
}
function drawAurochs(g,cx,cy,s,col){
  g.save(); g.translate(cx,cy); g.scale(s,s);
  g.fillStyle=col; g.strokeStyle=col;
  g.lineWidth=6.5; g.lineCap='round';
  g.beginPath(); g.moveTo(-7,-12); g.bezierCurveTo(-26,-16,-32,-42,-12,-52); g.stroke();
  g.beginPath(); g.moveTo(7,-12);  g.bezierCurveTo(26,-16,32,-42,12,-52);   g.stroke();
  g.beginPath(); g.moveTo(-11,-6); g.lineTo(-22,-10); g.lineTo(-11,-1); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(11,-6);  g.lineTo(22,-10);  g.lineTo(11,-1);  g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0,4,13,19,0,0,TAU); g.fill();
  g.globalCompositeOperation='destination-out';
  g.beginPath(); g.arc(-5,2,1.8,0,TAU); g.fill();
  g.beginPath(); g.arc(5,2,1.8,0,TAU); g.fill();
  g.beginPath(); g.ellipse(0,17,4,3,0,0,TAU); g.fill();
  g.globalCompositeOperation='source-over';
  drawStar(g,0,-58,6);
  g.restore();
}
var EMBLEMS = {
  ankh:function(g,w,h){ g.strokeStyle='#1f4e79'; g.fillStyle='#1f4e79'; g.lineWidth=h*0.07; g.lineCap='round'; var cx=w/2, cy=h*0.36, r=h*0.14; g.beginPath(); g.ellipse(cx,cy,r*0.85,r,0,0,TAU); g.stroke(); g.beginPath(); g.moveTo(cx,cy+r); g.lineTo(cx,h*0.86); g.stroke(); g.beginPath(); g.moveTo(cx-r*1.2,h*0.58); g.lineTo(cx+r*1.2,h*0.58); g.stroke(); },
  disc:function(g,w,h){ g.fillStyle='#c0272d'; g.beginPath(); g.arc(w/2,h/2,h*0.28,0,TAU); g.fill(); },
  lambda:function(g,w,h){ g.fillStyle='#c9a227'; g.font='bold '+Math.round(h*0.62)+'px Georgia'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('\u039B', w/2, h*0.54); },
  spqr:function(g,w,h){ g.fillStyle='#c9a227'; g.font='bold '+Math.round(h*0.2)+'px Georgia'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('SPQR', w/2, h*0.5); g.strokeStyle='#c9a227'; g.lineWidth=3; g.beginPath(); g.arc(w/2,h*0.5,h*0.34,0,TAU); g.stroke(); },
  aurochs:function(g,w,h){ drawAurochs(g,w/2,h*0.46,h/170,'#c9a227'); },
  star:function(g,w,h){ g.fillStyle='#c9a227'; drawStar(g,w/2,h/2,h*0.3); },
  raven:function(g,w,h){ g.fillStyle='#e8e4da'; var s=h/128; g.save(); g.translate(w/2,h/2); g.scale(s,s); g.beginPath(); g.moveTo(-28,8); g.bezierCurveTo(-10,-16,14,-18,26,-8); g.lineTo(30,-12); g.lineTo(27,-4); g.bezierCurveTo(20,12,-6,18,-16,10); g.lineTo(-30,14); g.closePath(); g.fill(); g.beginPath(); g.arc(14,-9,2.2,0,TAU); g.fillStyle='#1a1a1a'; g.fill(); g.restore(); },
  swirl:function(g,w,h){ g.strokeStyle='#e2d9bf'; g.lineWidth=7; g.lineCap='round'; var cx=w/2, cy=h/2, r=h*0.3; for(var k=0;k<3;k++){ var a0=k*TAU/3; g.beginPath(); for(var i=0;i<=20;i++){ var t=i/20; var rr=r*t; var a=a0+t*3.6; var x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; if(i===0)g.moveTo(x,y); else g.lineTo(x,y); } g.stroke(); } },
  cross:function(g,w,h){ g.fillStyle='#2b2b30'; g.fillRect(w*0.44,h*0.16,w*0.12,h*0.68); g.fillRect(w*0.22,h*0.38,w*0.56,h*0.12); }
};
function emblemTex(bg, frame, emblem, frameCol){
  return canvasTex(128,128,function(g){
    g.fillStyle=bg; g.fillRect(0,0,128,128);
    if(frame){ g.strokeStyle=frameCol||'#c9a227'; g.lineWidth=6; g.strokeRect(5,5,118,118); }
    if(EMBLEMS[emblem]) EMBLEMS[emblem](g,128,128);
  });
}
function makeBannerTex(bg, border, emblem){
  return canvasTex(128,192,function(g){
    g.fillStyle=bg; g.fillRect(0,0,128,192);
    g.strokeStyle=border; g.lineWidth=7; g.strokeRect(7,7,114,178);
    g.fillStyle=border;
    for(var i=0;i<8;i++){ g.beginPath(); g.moveTo(10+i*15,185); g.lineTo(17.5+i*15,172); g.lineTo(25+i*15,185); g.closePath(); g.fill(); }
    if(EMBLEMS[emblem]){
      g.save(); g.translate(0,10); EMBLEMS[emblem](g,128,150); g.restore();
    }
  });
}

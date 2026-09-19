/* ---------------- audio ---------------- */
var Snd = {
  ctx:null, master:null, musicOn:true, musicStarted:false, droneOsc:[], melodyTimer:null,
  scale:null, drumTimer:null, drumStep:0, root:73.42, mode:'dor',
  init:function(){
    if(this.ctx) return;
    try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  },
  resume:function(){ if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  tone:function(f0,f1,dur,type,vol,delay){
    if(!this.ctx) return;
    delay = delay||0;
    var t = this.ctx.currentTime+delay;
    var o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(Math.max(f0,1),t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+0.05);
  },
  noise:function(dur,freq,vol,q,delay){
    if(!this.ctx) return;
    q=q||1; delay=delay||0;
    var t=this.ctx.currentTime+delay;
    var len=Math.max(1,Math.floor(this.ctx.sampleRate*dur));
    var buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
    var src=this.ctx.createBufferSource(); src.buffer=buf;
    var f=this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
    var g=this.ctx.createGain();
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
  },
  swing:function(){ this.noise(0.12,900,0.2,0.8); },
  hit:function(){ this.noise(0.09,500,0.3); this.tone(170,80,0.1,'sine',0.24); },
  blockHit:function(){ this.noise(0.07,2400,0.2,2); this.tone(540,320,0.08,'square',0.09); },
  shoot:function(){ this.noise(0.1,1800,0.15,2); },
  arrowHit:function(){ this.noise(0.06,700,0.26); },
  hurt:function(){ this.tone(300,120,0.22,'sawtooth',0.18); },
  die:function(){ this.tone(200,45,0.5,'sawtooth',0.2); this.noise(0.3,300,0.16,0.7); },
  horn:function(){ this.tone(146.8,146.8,1.0,'sawtooth',0.15); this.tone(220,220,1.0,'sawtooth',0.11,0.06); this.tone(146.8,138,1.4,'sawtooth',0.13,0.55); },
  victory:function(){ var self=this; [261.6,329.6,392,523.3,659.3].forEach(function(f,i){ self.tone(f,f,0.42,'triangle',0.2,i*0.16); }); },
  defeat:function(){ var self=this; [330,294,247,196,147].forEach(function(f,i){ self.tone(f,f,0.45,'sawtooth',0.13,i*0.22); }); },
  click:function(){ this.tone(720,520,0.06,'square',0.09); },
  coin:function(){ this.tone(880,1320,0.09,'square',0.1); this.tone(1320,1760,0.12,'square',0.08,0.07); },
  roar:function(){ this.tone(110,55,0.7,'sawtooth',0.26); this.noise(0.5,180,0.2,0.7); },
  drum:function(deep){
    if(!this.ctx) return;
    this.tone(deep?82:120, deep?38:50, deep?0.3:0.18, 'sine', deep?0.22:0.15);
    this.noise(0.05, 300, 0.06, 0.8);
  },
  setFactionMusic:function(root, mode){
    this.root=root; this.mode=mode;
    var R=this.root;
    var ratios={ dor:[1,1.2,1.333,1.5,1.8,2,2.4], phr:[1,1.067,1.333,1.5,1.6,2,2.133], penta:[1,1.2,1.5,1.8,2.4,2,1.5], min:[1,1.2,1.333,1.6,1.8,2,2.4] };
    var r = ratios[mode]||ratios.dor;
    this.scale = r.map(function(x){ return R*x; });
    this.scale.sort(function(a,b){return a-b;});
  },
  startMusic:function(){
    if(!this.ctx || this.musicStarted) return;
    this.musicStarted = true;
    var self=this;
    var lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=210;
    var dg=this.ctx.createGain(); dg.gain.value=0.05;
    [this.root/2, this.root*0.75].forEach(function(f){
      var o=self.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f;
      o.connect(lp); o.start(); self.droneOsc.push(o);
    });
    lp.connect(dg); dg.connect(this.master);
    var step=0, next=this.ctx.currentTime+0.3, stepDur=0.28;
    this.melodyTimer=setInterval(function(){
      if(!self.musicOn || !self.ctx || !self.scale) return;
      while(next < self.ctx.currentTime+0.4){
        if(Math.random()<0.82){
          var f=self.scale[(step*5+Math.floor(step/3))%self.scale.length];
          var t=next, o=self.ctx.createOscillator(), g=self.ctx.createGain();
          o.type='triangle'; o.frequency.value=f;
          g.gain.setValueAtTime(0.0001,t);
          g.gain.exponentialRampToValueAtTime(0.06,t+0.02);
          g.gain.exponentialRampToValueAtTime(0.0001,t+stepDur*1.8);
          o.connect(g); g.connect(self.master); o.start(t); o.stop(t+stepDur*2);
        }
        next+=stepDur; step++;
      }
    },130);
  },
  startDrums:function(){
    if(this.drumTimer) return;
    var self=this;
    this.drumTimer=setInterval(function(){
      if(!self.musicOn || !self.ctx) return;
      self.drumStep=(self.drumStep+1)%8;
      if(self.drumStep===0||self.drumStep===3||self.drumStep===6) self.drum(self.drumStep===0);
    },300);
  },
  toggleMusic:function(){ this.musicOn=!this.musicOn; return this.musicOn; }
};

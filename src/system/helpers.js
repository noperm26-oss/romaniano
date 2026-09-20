/* boot-time profile (ms per phase) — filled by the world builders and boot.js */
var BOOT_TIMES={};
/* deterministic per-feature random streams (LCG) */
function srand(seed){ var s=(seed>>>0)||7; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
var $ = function(id){ return document.getElementById(id); };
if(!window.THREE){ $('webgl-error').classList.remove('hidden'); return; }

/* ---------------- helpers ---------------- */
var TAU = Math.PI*2;
function rand(a,b){ return a+Math.random()*(b-a); }
function randi(a,b){ return Math.floor(rand(a,b+1)); }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function lerp(a,b,t){ return a+(b-a)*t; }
function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function angDiff(a,b){ var d=(b-a)%TAU; if(d>Math.PI)d-=TAU; if(d<-Math.PI)d+=TAU; return d; }
function turnTo(cur,tgt,maxD){ var d=angDiff(cur,tgt); return cur+clamp(d,-maxD,maxD); }

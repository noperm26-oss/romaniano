/* ============================================================
   surface.js — procedural surface detail for every Lambert material
   ------------------------------------------------------------
   Flat colours read as toy blocks. Every Lambert material built
   through M()/M2()/NM() gets a small shader patch: in world space,
   from the fragment position and normal, it draws the material's
   surface — tile and shingle courses on roofs, thatch straw, log
   rows, stone blocks with mortar, plaster grain, plank grain,
   patchy earth and grass, cobbles. No textures, no UVs, works on
   merged and instanced geometry alike. The pattern is a material
   uniform (uPat) or, for vertex-coloured merged/instanced bodies
   (prefabs), a per-vertex attribute aPat baked by exportGeo().
   ============================================================ */
var SURF={NONE:0, TILE:1, THATCH:2, PLASTER:3, LOG:4, STONE:5, WOOD:6, GROUND:7, COBBLE:8, GRAIN:9, SHINGLE:10, PLANK:11};
var SURF_GLSL_COMMON=[
  'varying vec3 vSurfP; varying vec3 vSurfN; varying float vSurfPat;'
].join('\n');
var SURF_GLSL_VERT=[
  'attribute float aPat;'
].join('\n');
var SURF_GLSL_FRAG=[
  'uniform float uPat;',
  'float sh21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }',
  'float snz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(sh21(i),sh21(i+vec2(1.0,0.0)),f.x),mix(sh21(i+vec2(0.0,1.0)),sh21(i+vec2(1.0,1.0)),f.x),f.y); }',
  'float seam(float t,float w){ return smoothstep(0.0,w,t)*smoothstep(0.0,w,1.0-t); }',
  'vec3 surfDetail(){',
  '  float pat=(uPat>0.5)?uPat:vSurfPat;',
  '  if(pat<0.5) return vec3(1.0);',
  '  vec3 n=abs(vSurfN); vec3 p=vSurfP;',
  '  float u=(n.x>n.z)?p.z:p.x; float v=p.y; float f=1.0; vec3 tint=vec3(1.0);',
  '  if(pat<1.5){',                                                         /* clay tiles: staggered courses, each tile a little lighter at its lip */
  '    float rw=0.28, cw=0.24; float r=floor(v/rw); float uu=u/cw+((mod(r,2.0)<1.0)?0.0:0.5); float fr=fract(v/rw), fu=fract(uu);',
  '    float cell=sh21(vec2(floor(uu),r));',
  '    f=(0.78+0.22*seam(fr,0.14)*seam(fu,0.16))*(0.90+0.20*cell)*(0.90+0.18*fr);',
  '  } else if(pat<2.5){',                                                  /* thatch: straw streaks down the slope, brows every layer */
  '    float s=snz(vec2(u*16.0,v*3.0)), s2=snz(vec2(u*44.0,v*7.0));',
  '    f=(0.78+0.28*s+0.12*s2)*(0.92+0.08*seam(fract(v*1.8),0.25));',
  '  } else if(pat<3.5){',                                                  /* lime plaster: soft mottling, fine grain */
  '    f=0.92+0.10*snz(vec2(u,v)*0.9)+0.05*snz(vec2(u,v)*7.0);',
  '  } else if(pat<4.5){',                                                  /* log courses: dark seams, rounded rows, grain */
  '    float rw=0.36; float fr=fract(v/rw); float row=floor(v/rw);',
  '    f=(0.68+0.32*seam(fr,0.22))*(0.90+0.20*sh21(vec2(row,floor(u/7.0))))*(0.95+0.10*snz(vec2(u*6.0,v*30.0)))*(0.90+0.10*(1.0-abs(fr-0.5)*2.0));',
  '  } else if(pat<5.5){',                                                  /* ashlar / rubble stone: staggered blocks and mortar */
  '    float rw=0.42, cw=0.78; float r=floor(v/rw); float uu=u/cw+((mod(r,2.0)<1.0)?0.0:0.5); float fr=fract(v/rw), fu=fract(uu);',
  '    float cell=sh21(vec2(floor(uu),r));',
  '    f=(0.70+0.30*seam(fr,0.10)*seam(fu,0.08))*(0.86+0.26*cell)*(0.96+0.08*snz(vec2(u,v)*9.0));',
  '  } else if(pat<6.5){',                                                  /* timber: long grain */
  '    f=0.90+0.12*snz(vec2(u*1.2,v*22.0))+0.06*snz(vec2(u*24.0,v*1.5));',
  '  } else if(pat<7.5){',                                                  /* ground: patchy meadow, dry warm patches, fine speckle */
  '    float g1=snz(p.xz*0.045), g2=snz(p.xz*0.35), g3=snz(p.xz*1.7), g4=snz(p.xz*7.0);',
  '    f=0.72+0.20*g1+0.18*g2+0.12*g3+0.06*g4;',
  '    tint=mix(vec3(1.0),vec3(1.06,1.0,0.86),g1*g2*1.3);',
  '  } else if(pat<8.5){',                                                  /* cobbles */
  '    vec2 c=p.xz/0.5; vec2 fc=fract(c); float cell=sh21(floor(c));',
  '    f=(0.72+0.28*seam(fc.x,0.2)*seam(fc.y,0.2))*(0.88+0.24*cell);',
  '  } else if(pat<9.5){',                                                  /* generic grain */
  '    f=0.95+0.08*snz(vec2(u,v)*5.0);',
  '  } else if(pat<10.5){',                                                 /* wooden shingles (șindrilă): narrow staggered courses */
  '    float rw=0.40, cw=0.15; float r=floor(v/rw); float uu=u/cw+((mod(r,2.0)<1.0)?0.0:0.5); float fr=fract(v/rw), fu=fract(uu);',
  '    float cell=sh21(vec2(floor(uu),r));',
  '    f=(0.78+0.22*seam(fr,0.12)*seam(fu,0.3))*(0.86+0.28*cell)*(0.92+0.14*fr);',
  '  } else {',                                                             /* floor planks along x */
  '    float pw=0.26; float fp=fract(p.z/pw); float plank=floor(p.z/pw);',
  '    f=(0.80+0.20*seam(fp,0.12))*(0.92+0.16*sh21(vec2(plank,floor(p.x/3.0))))*(0.94+0.10*snz(vec2(p.x*22.0,p.z*1.5)));',
  '  }',
  '  return tint*f;',
  '}'
].join('\n');
function surfCompile(mat){
  return function(shader){
    shader.uniforms.uPat={value:mat.userData.pat||0};
    shader.vertexShader=SURF_GLSL_COMMON+'\n'+SURF_GLSL_VERT+'\n'+shader.vertexShader.replace('#include <fog_vertex>',
      '#include <fog_vertex>\n'+
      'vec4 sfp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nsfp=instanceMatrix*sfp;\n#endif\nsfp=modelMatrix*sfp; vSurfP=sfp.xyz;\n'+
      'vSurfN=normalize(inverseTransformDirection(transformedNormal,viewMatrix)); vSurfPat=aPat;');
    shader.fragmentShader=SURF_GLSL_COMMON+'\n'+SURF_GLSL_FRAG+'\n'+shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb*=surfDetail();');
  };
}
/* give a Lambert material its surface (pat from SURF) — safe to call once per material */
function surfApply(mat,pat){
  mat.userData.pat=pat||0;
  mat.onBeforeCompile=surfCompile(mat);
  mat.customProgramCacheKey=function(){ return 'surf1'; };
  return mat;
}
/* the merged/instanced bodies (prefabs) carry the pattern per vertex */
function surfPatOf(m){ return (m&&m.userData&&m.userData.pat)||SURF.GRAIN; }

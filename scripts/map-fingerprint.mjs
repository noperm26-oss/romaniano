/* Sampled fingerprint of the built world. Used to prove a speed change
   did not move places, colours, or collision. Not part of the game. */
import {launchBrowser} from '../tests/browser-env.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';

const outPath = process.argv[2] || 'test-results/map-fp-before.json';
const browser = await launchBrowser();
const page = await (await browser.newContext({viewport:{width:1280,height:720}})).newPage();
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(pathToFileURL(resolve('index.html')).href + '?load=4', {waitUntil:'load', timeout:180000});
await page.waitForFunction(() => window.__game && window.__game.ready, {timeout:180000});
const fp = await page.evaluate(() => window.__game.ev(`(function(){
  function mix(h, n){
    var buf = new Float64Array(1), u = new Uint32Array(buf.buffer);
    buf[0] = n;
    h = Math.imul(h ^ u[0], 16777619) >>> 0;
    h = Math.imul(h ^ u[1], 16777619) >>> 0;
    return h;
  }
  function mixStr(h, s){
    s = s || '';
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h;
  }
  var pos = 2166136261, col = 2166136261, nor = 2166136261, inst = 2166136261, structs = 2166136261;
  var meshes = 0, verts = 0;
  scene.traverse(function(o){
    meshes++;
    if (o.position) { pos = mix(pos, o.position.x); pos = mix(pos, o.position.y); pos = mix(pos, o.position.z); }
    var g = o.geometry;
    if (g && g.attributes && g.attributes.position) {
      var a = g.attributes.position.array;
      verts += a.length;
      for (var i = 0; i < a.length; i += 48) pos = mix(pos, a[i]);
      if (g.attributes.color) {
        var c = g.attributes.color.array;
        for (var ci = 0; ci < c.length; ci += 48) col = mix(col, c[ci]);
      }
      if (g.attributes.normal) {
        var n = g.attributes.normal.array;
        for (var ni = 0; ni < n.length; ni += 48) nor = mix(nor, n[ni]);
      }
    }
    if (o.isInstancedMesh && o.instanceMatrix) {
      var ia = o.instanceMatrix.array;
      for (var ii = 0; ii < ia.length; ii += 64) inst = mix(inst, ia[ii]);
    }
  });
  for (var si = 0; si < STRUCTURES.length; si++) {
    var s = STRUCTURES[si];
    structs = mix(structs, s.x); structs = mix(structs, s.z);
    structs = mix(structs, s.hx || 0); structs = mix(structs, s.hz || 0);
    if (s.door) { structs = mix(structs, s.door.x); structs = mix(structs, s.door.z); }
    structs = mixStr(structs, s.name || '');
    structs = mixStr(structs, s.kind || '');
  }
  var cols = 2166136261;
  for (var k = 0; k < colliders.length; k += 7) {
    var cb = colliders[k];
    cols = mix(cols, cb.x0); cols = mix(cols, cb.z0); cols = mix(cols, cb.x1); cols = mix(cols, cb.z1);
  }
  var live = __game.buildingsLive();
  return {
    pos:pos, col:col, nor:nor, inst:inst, structs:structs, cols:cols,
    meshes:meshes, verts:verts, nStruct:STRUCTURES.length, nCol:colliders.length,
    nDoor:DOORS.length, nHamlet:HAMLETS.length, nSettle:SETTLEMENTS.length,
    doors:live.doors, hamlets:live.hamlets, tris:__game.sceneStats().tris,
    ground:[groundH(0,0), groundH(1200,-400), groundH(-1800,-2470), groundH(400,1500)]
  };
})()`));
const out = {errors, fp};
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();

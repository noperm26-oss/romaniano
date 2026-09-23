/* Headless load profile. Measures page-load and the game's own BOOT_TIMES.
   Does not change the game. Used before/after optimization. */
import {launchBrowser} from '../tests/browser-env.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFileSync, mkdirSync} from 'node:fs';

const label = process.argv[2] || 'now';
const query = process.argv[3] || '';
const browser = await launchBrowser();
const context = await browser.newContext({viewport:{width:1280, height:720}});
const page = await context.newPage();
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.addInitScript(() => {
  window.__longTasks = [];
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) window.__longTasks.push(Math.round(e.duration));
    }).observe({type:'longtask', buffered:true});
  } catch (e) {}
});
const t0 = Date.now();
await page.goto(pathToFileURL(resolve('index.html')).href + query, {waitUntil:'load', timeout:180000});
const respondMs = Date.now() - t0;
/* the player path yields, so `load` is not world-ready. Wait for the throne. */
await page.waitForFunction(() => window.__game && window.__game.ready, {timeout:180000});
const worldMs = Date.now() - t0;
const wall = worldMs;
const data = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paints = performance.getEntriesByType('paint').map(p => ({name:p.name, start:Math.round(p.startTime)}));
  return {
    boot: (typeof __game !== 'undefined' && __game.bootTimes) ? __game.bootTimes() : null,
    live: __game.buildingsLive(),
    mem: __game.memStats(),
    scene: __game.sceneStats(),
    nav: nav ? {
      dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      request: Math.round(nav.responseEnd - nav.requestStart),
      response: Math.round(nav.responseEnd - nav.responseStart),
      domInteractive: Math.round(nav.domInteractive),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadEvent: Math.round(nav.loadEventEnd),
      transferSize: nav.transferSize,
      decodedBodySize: nav.decodedBodySize
    } : null,
    paints,
    htmlBytes: document.documentElement.outerHTML.length,
    sliceMax: Math.round(__game.ev('BOOT_SLICE_MAX')),
    slices: __game.ev('BOOT_SLICES'),
    longTasks: (window.__longTasks||[]).slice().sort((a,b)=>b-a).slice(0,8)
  };
});
/* a few animation frames after the menu is up — how heavy the first presented frames are */
const frames = await page.evaluate(() => new Promise(resolve => {
  const samples = [];
  let last = performance.now();
  let n = 0;
  function tick(now){
    samples.push(Math.round((now - last) * 100) / 100);
    last = now;
    if (++n < 3) requestAnimationFrame(tick);
    else {
      const sorted = samples.slice().sort((a,b) => a-b);
      const sum = samples.reduce((a,b) => a+b, 0);
      resolve({
        samples,
        avg: Math.round(sum / samples.length * 100) / 100,
        p50: sorted[Math.floor(sorted.length / 2)],
        max: sorted[sorted.length - 1],
        gl: __game.glInfo()
      });
    }
  }
  requestAnimationFrame(tick);
}));
const out = {label, respondMs, worldMs, wallMs: wall, errors, ...data, frames};
mkdirSync('test-results', {recursive:true});
writeFileSync('test-results/load-' + label + '.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();

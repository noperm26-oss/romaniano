import chromium from '@sparticuz/chromium';
import {chromium as playwright} from 'playwright';
import {brotliDecompressSync} from 'node:zlib';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
// npm-distributed Chromium fallback for environments where browser CDNs are blocked.
export async function launchBrowser(){
  if(process.env.CHROME_PATH)return playwright.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const require=createRequire(import.meta.url),root=join(dirname(require.resolve('@sparticuz/chromium')), '..', '..');
  const libs=join(tmpdir(),'romaniano-browser-libs');mkdirSync(libs,{recursive:true});
  const tar=join(libs,'libraries.tar');writeFileSync(tar,brotliDecompressSync(readFileSync(join(root,'bin/al2023.tar.br'))));
  execFileSync('tar',['-xf',tar,'-C',libs]);
  return playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,
    env:{...process.env,LD_LIBRARY_PATH:join(libs,'lib')+':'+(process.env.LD_LIBRARY_PATH||'')}});
}

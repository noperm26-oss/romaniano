import {readFileSync, writeFileSync} from 'node:fs';
import {parse} from 'acorn';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const read = p => readFileSync(p, 'utf8');
const manifest = JSON.parse(read('src/manifest.json'));
const names = new Map();
const parts = manifest.map(path => {
  const code = read(path);
  let ast; try { ast = parse(code, {ecmaVersion: 2022, allowReturnOutsideFunction: true}); } catch(e) { throw Error(path + ": " + e.message); }
  for (const node of ast.body) {
    const ids = node.type === 'FunctionDeclaration' ? [node.id.name] :
      node.type === 'VariableDeclaration' ? node.declarations.map(d => d.id.name) : [];
    for (const id of ids) {
      if (names.has(id)) throw Error(`Duplicate top-level declaration ${id}: ${path} and ${names.get(id)}`);
      names.set(id,path);
    }
  }
  return `\n// SOURCE: ${path}\n${code}`;
});
const game = `(function(){\n'use strict';\n${parts.join('\n')}\n})();`;
parse(game, {ecmaVersion: 2022});
const html = read('src/ui/shell.html')
  .replace('{{STYLES}}', () => read('src/ui/game.css'))
  .replace('{{VENDOR}}', () => read('src/vendor/three.js'))
  .replace('{{GAME}}', () => game);
for (const path of ['index.html', 'age-of-warfare.html']) {
  if (process.argv.includes('--check')) {
    if (read(path) !== html) throw Error(`${path} is stale. Run npm run build.`);
  } else writeFileSync(path,html);
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Built'} ${manifest.length} source files → two identical, offline HTML entry points (${Buffer.byteLength(html)} bytes).`);

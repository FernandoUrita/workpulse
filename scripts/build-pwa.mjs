import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

// Run after Vite has written its final, hashed assets, including lazy routes.
const output = resolve('dist');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return lists.flat();
}
const files = (await walk(output)).filter(path => !path.endsWith(`${sep}sw.js`)).sort();
const hash = createHash('sha256');
for (const file of files) {
  hash.update(relative(output, file));
  hash.update(await readFile(file));
}
const template = await readFile(new URL('./sw-template.js', import.meta.url), 'utf8');
hash.update(template);
const version = hash.digest('hex').slice(0, 16);
const urls = files.map(file => '/' + relative(output, file).split(sep).join('/'));
const worker = template.replace('__BUILD_VERSION__', version).replace('__PRECACHE_URLS__', JSON.stringify(urls));
await writeFile(resolve(output, 'sw.js'), worker);
console.log(`PWA: ${urls.length} local files precached; version ${version}`);

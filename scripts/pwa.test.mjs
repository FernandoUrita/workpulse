import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const origin = 'https://workpulse.test';
function harness({ failInstall = false, windows = 1 } = {}) {
  const handlers = new Map();
  const stores = new Map();
  const state = { claimed: false, skipped: false, posted: [], fetched: [] };
  const keyOf = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const map = stores.get(name);
      return {
        async addAll(requests) {
          if (failInstall) throw new Error('Network unavailable');
          requests.forEach(request => map.set(keyOf(request), { url: keyOf(request), cached: true }));
        },
        async match(request, options) { if (request.mode === 'cors' && !options?.ignoreVary) return undefined; return map.get(keyOf(request)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    location: { origin },
    addEventListener(name, callback) { handlers.set(name, callback); },
    clients: {
      async claim() { state.claimed = true; },
      async matchAll() { return Array.from({ length: windows }, () => ({ url: origin + '/tasks' })); },
    },
    async skipWaiting() { state.skipped = true; },
  };
  class BrowserRequest extends Request {
    constructor(url, options) { super(new URL(url, origin), options); }
  }
  vm.runInNewContext(source, { self, caches, URL, Request: BrowserRequest, fetch: async request => { state.fetched.push(request.url); throw new Error('Offline'); } });
  async function fire(name, extra = {}) {
    let result;
    handlers.get(name)({ ...extra, waitUntil(promise) { result = promise; }, respondWith(promise) { result = promise; } });
    return result;
  }
  return { state, stores, fire };
}

test('install caches every page chunk and icon, then serves deep links offline', async () => {
  const app = harness();
  await app.fire('install');
  assert.equal(app.state.skipped, false, 'never force an update at install');
  const cache = [...app.stores.values()][0];
  const assets = await readdir(new URL('../dist/assets/', import.meta.url));
  for (const name of assets) assert.ok(cache.has(origin + '/assets/' + name), name);
  for (const path of ['/dashboard', '/tasks', '/meetings', '/items', '/mom', '/settings', '/login', '/register', '/tasks?filter=all']) {
    const response = await app.fire('fetch', { request: { method: 'GET', mode: 'navigate', url: origin + path } });
    assert.equal(response.url, origin + '/index.html');
  }
  const chunk = assets.find(name => name.startsWith('TasksPage-'));
  const response = await app.fire('fetch', { request: { method: 'GET', mode: 'cors', url: origin + '/assets/' + chunk } });
  assert.equal(response.cached, true);
  assert.equal(app.state.fetched.length, 0);
});

test('API responses, external URLs and mutations bypass the shell cache', async () => {
  const app = harness();
  await app.fire('install');
  for (const request of [
    { method: 'POST', mode: 'cors', url: origin + '/tasks' },
    { method: 'GET', mode: 'cors', url: origin + '/api/tasks' },
    { method: 'GET', mode: 'navigate', url: origin + '/api/private' },
    { method: 'GET', mode: 'cors', url: 'https://example.com/private' },
  ]) assert.equal(await app.fire('fetch', { request }), undefined);
});

test('failed precaching rejects the new worker without activating it', async () => {
  const app = harness({ failInstall: true });
  await assert.rejects(app.fire('install'), /Network unavailable/);
  assert.equal(app.state.skipped, false);
  assert.equal(app.state.claimed, false);
});

test('activation only removes old WorkPulse caches', async () => {
  const app = harness();
  app.stores.set('another-app-cache', new Map());
  app.stores.set('workpulse-shell-old', new Map());
  await app.fire('install');
  await app.fire('activate');
  assert.equal(app.stores.has('another-app-cache'), true);
  assert.equal(app.stores.has('workpulse-shell-old'), false);
  assert.equal(app.state.claimed, true);
});

test('update activation protects other open tabs', async () => {
  const multiple = harness({ windows: 2 });
  await multiple.fire('message', { data: { type: 'ACTIVATE_UPDATE' }, source: { postMessage(message) { multiple.state.posted.push(message.type); } } });
  assert.equal(multiple.state.skipped, false);
  assert.deepEqual(multiple.state.posted, ['UPDATE_BLOCKED']);
  const single = harness();
  await single.fire('message', { data: { type: 'ACTIVATE_UPDATE' } });
  assert.equal(single.state.skipped, true);
});

test('manifest icons have the advertised PNG dimensions and valid launch scope', async () => {
  const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.start_url, '/dashboard');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const data = await readFile(new URL('../dist' + icon.src, import.meta.url));
    assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`, icon.sizes);
  }
});

// Drives the built site in a browser with made-up titles. Usage: node tests/ui.test.mjs _site
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = process.argv[2] || '_site';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg' };
const srv = createServer((q, r) => {
  let p = join(root, decodeURIComponent(q.url.split('?')[0])); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {});
const pg = await b.newPage(); const requests = [];
pg.on('request', (r) => requests.push(r.url()));
await pg.goto(base + '/');
await pg.fill('#add-input', 'The Imaginary Lighthouse'); await pg.click('#add-form button');
await pg.fill('#add-input', 'https://www.themoviedb.org/movie/1-sample-harbour-nights'); await pg.click('#add-form button');
await pg.fill('#add-input', 'https://example.com/x'); await pg.click('#add-form button');
assert.match(await pg.textContent('#msg'), /Only links/);
assert.equal(await pg.locator('#items li').count(), 2);
await pg.selectOption('#items li >> nth=0 >> select >> nth=0', 'hidden');
assert.equal(await pg.locator('#items li').count(), 1);
await pg.selectOption('#design', 'cinema');
assert.equal(await pg.getAttribute('html', 'data-design'), 'cinema');
await pg.reload();
assert.equal(await pg.getAttribute('html', 'data-design'), 'cinema');
assert.equal(await pg.locator('#items li').count(), 1);
const pt = await b.newPage(); await pt.goto(base + '/pt/');
assert.equal(await pt.getAttribute('html', 'lang'), 'pt-PT');
assert.equal(await pt.locator('#items li').count(), 1);
// every page has the design control; the design carries across pages
for (const path of ['/start/', '/agents/', '/admin/', '/policy/', '/pt/start/', '/pt/agents/', '/pt/admin/', '/pt/policy/']) {
  const q = await b.newPage(); await q.goto(base + path);
  assert.equal(await q.locator('#design').count(), 1, path);
  assert.equal(await q.getAttribute('html', 'data-design'), null, 'new context has no stored design: ' + path);
  await q.close();
}
// the design control works on a page without the list, and Automatic follows the device
{
  const ctx = await b.newContext({ colorScheme: 'dark', viewport: { width: 320, height: 700 } }); const q = await ctx.newPage();
  await q.goto(base + '/policy/');
  assert.equal(await q.inputValue('#design'), 'auto');
  assert.equal(await q.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(20, 21, 19)');
  await q.selectOption('#design', 'coast');
  assert.equal(await q.getAttribute('html', 'data-design'), 'coast');
  await q.goto(base + '/pt/agents/');
  assert.equal(await q.getAttribute('html', 'data-design'), 'coast');
  assert.equal(await q.inputValue('#design'), 'coast');
  for (const path of ['/', '/agents/', '/policy/', '/pt/']) { await q.goto(base + path); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= 320), 'no sideways scroll at 320 px: ' + path); }
  await q.selectOption('#design', 'auto');
  assert.equal(await q.getAttribute('html', 'data-design'), null);
  await ctx.close();
}
// merge an import into the list
const fixture = readFileSync(new URL('./fixtures/made-up-list.json', import.meta.url));
await pg.setInputFiles('#import', { name: 'f.json', mimeType: 'application/json', buffer: fixture });
await pg.waitForFunction(() => /Added 1 new/.test(document.getElementById('msg').textContent));
assert.match(await pg.textContent('#counts'), /Hidden 2/);
await pg.selectOption('#sort', 'title');
assert.match(await pg.textContent('#items li .item-title >> nth=0'), /Imaginary/);
// offline
await pg.evaluate(() => navigator.serviceWorker.ready);
await pg.reload(); await pg.evaluate(() => navigator.serviceWorker.ready);
await pg.context().setOffline(true);
await pg.reload();
assert.equal(await pg.textContent('h1'), 'Your streaming list');
assert.ok((await pg.locator('#items li').count()) >= 1);
await pg.goto(base + '/pt/policy/');
assert.match(await pg.textContent('h1'), /governado/);
await pg.context().setOffline(false);
const external = requests.filter((u) => !u.startsWith(base));
assert.deepEqual(external, [], 'no request leaves the site');
console.log('ui tests passed');
await b.close(); srv.close();

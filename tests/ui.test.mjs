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
const external = requests.filter((u) => !u.startsWith(base));
assert.deepEqual(external, [], 'no request leaves the site');
console.log('ui tests passed');
await b.close(); srv.close();

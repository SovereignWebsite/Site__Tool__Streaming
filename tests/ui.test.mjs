// Drives the built site in a browser with made-up titles. Usage: node tests/ui.test.mjs _site
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = process.argv[2] || '_site';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = createServer((q, r) => {
  let p = join(root, decodeURIComponent(q.url.split('?')[0])); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {});
const ctx = await b.newContext();
// this test walks through The list; tests/designs.test.mjs covers the other designs
await ctx.addInitScript(() => { if (!localStorage.getItem('streaming.design')) localStorage.setItem('streaming.design', 'list'); });
const pg = await ctx.newPage(); const requests = [], errors = [];
pg.on('request', (r) => requests.push(r.url())); pg.on('pageerror', (e) => errors.push(e.message));
const msg = () => pg.textContent('#msg');
const count = (s) => pg.textContent('#n-' + s);
const first = () => pg.locator('#items li.item').first();
const tab = (name) => pg.click(`.tab[data-status="${name}"]`);

await pg.goto(base + '/');
// first visit: empty state teaches how to add, and offers an example
assert.equal(await pg.isVisible('#example-banner'), false);
assert.match(await pg.textContent('#empty'), /Your list is empty/);
await pg.click('text=Show an example list');
assert.equal(await pg.isVisible('#example-banner'), true);
assert.equal(await count('watch'), '2'); assert.equal(await count('seen'), '2');
// adding an own title removes the example
await pg.fill('#add-input', 'The Imaginary Lighthouse Two'); await pg.click('#add-form button');
assert.equal(await pg.isVisible('#example-banner'), false);
assert.equal(await count('watch'), '1'); assert.equal(await count('seen'), '0');
await pg.fill('#add-input', 'https://www.themoviedb.org/movie/1-sample-harbour-nights'); await pg.click('#add-form button');
assert.equal(await msg(), 'Added.');
await pg.fill('#add-input', 'https://example.com/x'); await pg.click('#add-form button');
assert.match(await msg(), /Only links/);
assert.equal(await pg.locator('#items li.item').count(), 2);
assert.equal(await first().locator('.item-title').textContent(), 'sample harbour nights');
// note, rating, status
await first().getByText('Note and tags').click();
await first().locator('textarea').fill('Made-up note.');
await first().locator('input[type=text]').fill('family, weekend');
await pg.click('text=Save note');
assert.equal(await first().locator('.note').textContent(), 'Made-up note.');
assert.deepEqual(await first().locator('.item-tags .tag').allTextContents(), ['#family', '#weekend']);
// tag filter: the tag bar narrows the list
assert.equal(await pg.isVisible('#tagbar'), true);
await pg.click('#tagbar .tag:has-text("#family")');
assert.equal(await pg.locator('#items li.item').count(), 1);
await pg.click('#tagbar .tag:has-text("All")');
assert.equal(await pg.locator('#items li.item').count(), 2);
// pick something for tonight (only titles on the watchlist)
await pg.click('#pick-btn');
await pg.waitForSelector('#pick-card .pick-acts');
assert.match(await pg.textContent('#pick-card .pick-name'), /sample harbour nights|The Imaginary Lighthouse Two/);
await pg.click('#pick-card >> text=Close');
assert.equal(await pg.isVisible('#pick-card'), false);
// the record dialog, with the title's own JSON, and a link that opens it
await first().locator('.item-title').click();
assert.equal(await pg.evaluate(() => document.getElementById('record').open), true);
const rec = JSON.parse(await pg.textContent('#record-json'));
assert.equal(rec.kind, 'record'); assert.equal(rec.record.note, 'Made-up note.'); assert.deepEqual(rec.record.tags, ['family', 'weekend']);
const recId = rec.record.id;
assert.ok(pg.url().endsWith('#title-' + recId));
const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#rec-download')]);
assert.match(dl.suggestedFilename(), /^streaming-sample-harbour-nights\.json$/);
await pg.keyboard.press('Escape');
assert.equal(await pg.evaluate(() => document.getElementById('record').open), false);
await pg.waitForFunction(() => !location.hash);
{ const q = await ctx.newPage(); await q.goto(base + '/#title-' + recId); assert.equal(await q.evaluate(() => document.getElementById('record').open), true); assert.equal(await q.textContent('#record-h'), 'sample harbour nights'); await q.close(); }
await first().getByText('Mark as seen').click();
assert.equal(await count('seen'), '1');
await tab('seen');
await first().locator('.star').nth(3).click();
assert.equal(await msg(), 'Rated 4 out of 5.');
assert.equal(await first().locator('.star[aria-pressed="true"]').count(), 4);
await first().getByText('Hide', { exact: true }).click();
assert.equal(await pg.isVisible('#toast'), true);
await pg.click('#toast-undo');
assert.equal(await msg(), 'Put back.'); assert.equal(await count('seen'), '1'); assert.equal(await count('hidden'), '0');
await first().getByText('Hide', { exact: true }).click();
await tab('hidden'); assert.equal(await pg.locator('#items li.item').count(), 1);
await first().getByText('Unhide').click();
await tab('watch'); assert.equal(await pg.locator('#items li.item').count(), 2);
// remove
await first().locator('.remove').click();
assert.equal(await msg(), 'Removed.'); assert.equal(await count('watch'), '1');
await pg.click('#toast-undo'); assert.equal(await count('watch'), '2');
await first().locator('.remove').click(); assert.equal(await count('watch'), '1');
// paste a link anywhere on the page, and / to start typing
await pg.locator('h1').click();
await pg.evaluate(() => { const d = new DataTransfer(); d.setData('text/plain', 'https://www.themoviedb.org/tv/5-pasted-made-up-show'); document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: d, bubbles: true })); });
assert.equal(await msg(), 'Added.'); assert.equal(await count('watch'), '2');
await pg.locator('h1').click(); await pg.keyboard.press('/');
assert.equal(await pg.evaluate(() => document.activeElement.id), 'add-input');
await first().locator('.remove').click();
// it survives a reload, and /pt/ reads the same list
await pg.reload(); assert.equal(await count('watch'), '1');
const pt = await ctx.newPage(); await pt.goto(base + '/pt/');
assert.equal(await pt.getAttribute('html', 'lang'), 'pt-PT');
assert.equal(await pt.textContent('#n-watch'), '1');
assert.match(await pt.textContent('.tab[data-status="watch"]'), /Para ver/);
await pt.close();

// the design control works on a page without the list, and Automatic follows the device
{
  const c2 = await b.newContext({ colorScheme: 'dark', viewport: { width: 320, height: 700 } }); const q = await c2.newPage();
  await q.goto(base + '/policy/');
  assert.equal(await q.inputValue('#design'), 'auto');
  assert.equal(await q.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(18, 16, 19)', 'Automatic is The shelf, dark');
  await q.selectOption('#design', 'queue');
  assert.equal(await q.getAttribute('html', 'data-design'), 'queue');
  await q.goto(base + '/pt/agents/');
  assert.equal(await q.getAttribute('html', 'data-design'), 'queue');
  for (const path of ['/', '/agents/', '/policy/', '/pt/', '/pt/start/']) { await q.goto(base + path); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= 320), 'no sideways scroll at 320 px: ' + path); }
  await q.selectOption('#design', 'auto');
  assert.equal(await q.getAttribute('html', 'data-design'), null);
  await c2.close();
}
for (const path of ['/start/', '/agents/', '/admin/', '/policy/', '/pt/start/', '/pt/agents/', '/pt/admin/', '/pt/policy/']) {
  const q = await b.newPage(); await q.goto(base + path);
  assert.equal(await q.locator('#design').count(), 1, path); await q.close();
}

// merge an import into the list (folded under Your data)
await pg.click('summary:has-text("Your data")');
const fixture = readFileSync(new URL('./fixtures/made-up-list.json', import.meta.url));
await pg.setInputFiles('#import', { name: 'f.json', mimeType: 'application/json', buffer: fixture });
await pg.waitForFunction(() => /Added \d+ new titles/.test(document.getElementById('msg').textContent));
assert.ok(Number(await count('watch')) >= 2);
// search and sort appear once the list is longer
await pg.fill('#add-input', 'Placeholder Valley'); await pg.click('#add-form button');
await pg.fill('#add-input', 'Another Invented Show'); await pg.click('#add-form button');
assert.equal(await pg.isVisible('#tools'), true);
await pg.fill('#filter-text', 'invented');
assert.equal(await pg.locator('#items li.item').count(), 1);
await pg.fill('#filter-text', 'nothing-like-this');
assert.match(await pg.textContent('#empty'), /matches your search/);
await pg.fill('#filter-text', '');

// offline
await pg.evaluate(() => navigator.serviceWorker.ready);
await pg.reload(); await pg.evaluate(() => navigator.serviceWorker.ready);
await ctx.setOffline(true);
await pg.reload();
assert.equal(await pg.textContent('h1'), 'Your streaming list');
assert.ok((await pg.locator('#items li.item').count()) >= 1);
await pg.goto(base + '/pt/policy/');
assert.match(await pg.textContent('h1'), /governado/);
await ctx.setOffline(false);

assert.deepEqual(errors, [], 'no script errors');
assert.deepEqual(requests.filter((u) => !u.startsWith(base)), [], 'no request leaves the site');
console.log('ui tests passed');
await b.close(); srv.close();

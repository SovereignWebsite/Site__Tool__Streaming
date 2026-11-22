// The five designs, the charts and the owner's own pictures, with made-up titles only.
// Usage: node tests/designs.test.mjs _site
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = process.argv[2] || '_site';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/design-sample.json', import.meta.url), 'utf8')).data;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = createServer((q, r) => {
  let p = join(root, decodeURIComponent(q.url.split('?')[0])); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {});
const errors = [], outside = [];

async function open(design, path = '/') {
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.addInitScript(([s, d]) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('streaming.v1', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
    if (d) localStorage.setItem('streaming.design', d); else localStorage.removeItem('streaming.design');
  }, [fixture, design]);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push((design || 'auto') + ': ' + e.message));
  p.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) outside.push(r.url()); });
  await p.goto(base + path);
  return { ctx, p };
}

// Automatic is The shelf: every title on the watchlist is a cover, generated from its title
{
  const { ctx, p } = await open(null);
  assert.equal(await p.getAttribute('body', 'data-layout'), 'shelf');
  assert.equal(await p.locator('.shelf .shelf-item').count(), 5);
  assert.equal(await p.isVisible('#add-input'), false, 'the add box waits behind the + cover');
  await p.click('.shelf-add-btn');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'add-input', 'the + cover opens the add box, full width above the shelf');
  assert.ok(await p.evaluate(() => document.getElementById('add-input').getBoundingClientRect().width > 250));
  await p.keyboard.press('Escape');
  assert.equal(await p.isVisible('#add-input'), false);
  assert.equal(await p.evaluate(() => document.activeElement.className), 'shelf-add-btn');
  // one main action per title, the rest behind More
  const firstItem = p.locator('.shelf-item').first();
  assert.deepEqual(await firstItem.locator('.item-acts button').allTextContents(), ['Mark as seen', 'More']);
  await firstItem.locator('.more-btn').click();
  assert.equal(await firstItem.locator('.more-btn').getAttribute('aria-expanded'), 'true');
  assert.deepEqual(await firstItem.locator('.more-menu button').allTextContents(), ['Hide', 'Note and tags', 'Remove']);
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.more-menu').count(), 0);
  assert.equal(await p.locator('.shelf .cover svg').count(), 5);
  await p.locator('.shelf-item').first().locator('.cover-btn').click();
  assert.equal(await p.evaluate(() => document.getElementById('record').open), true);
  assert.equal(await p.locator('#record-art svg').count(), 1);
  await p.keyboard.press('Escape');
  // switching design redraws straight away
  await p.selectOption('#design', 'cards');
  assert.equal(await p.getAttribute('body', 'data-layout'), 'cards');
  assert.equal(await p.locator('.cards .card[data-id]').count(), 5);
  assert.equal(await p.locator('.cards .add-card #add-input').count(), 1, 'adding a title is a blank card');
  await ctx.close();
}

// The queue: tonight's title on top, then the rest in the owner's order
{
  const { ctx, p } = await open('queue');
  assert.equal(await p.isVisible('#tabsblock'), false, 'the tabs wait behind All titles');
  assert.equal(await p.locator('#add-slot #add-input').count(), 1, 'Add to the queue sits under the running order');
  const top = await p.textContent('.tonight .tonight-title');
  const second = await p.locator('.queue-item').first().locator('.item-title').textContent();
  assert.equal(await p.locator('.queue-item').count(), 4);
  await p.locator('.queue-item').first().getByText('Watch tonight').click();
  assert.equal(await p.textContent('.tonight .tonight-title'), second);
  assert.equal(await p.locator('.queue-item').first().locator('.item-title').textContent(), top);
  await p.locator('.queue-item').first().locator('.more-btn').click();
  await p.locator('.queue-item').first().getByText('Move down').click();
  assert.equal(await p.locator('.queue-item').nth(1).locator('.item-title').textContent(), top);
  assert.match(await p.textContent('#msg'), /moved .* down/i);
  await p.reload();
  assert.equal(await p.textContent('.tonight .tonight-title'), second, 'the order is kept');
  await p.locator('.tonight').getByText('Mark as seen').click();
  assert.notEqual(await p.textContent('.tonight .tonight-title'), second, 'the next title comes forward');
  await ctx.close();
}

// Index cards: the note is the point, and an empty note says so
{
  const { ctx, p } = await open('cards');
  assert.match(await p.locator('.card', { hasText: 'Paper Moon Over Lisbon' }).locator('.card-note').textContent(), /Made-up title/);
  assert.equal(await p.locator('.card', { hasText: 'Sample Harbour Nights' }).locator('.empty-note').count(), 1);
  await ctx.close();
}

// Ticket stubs: figures, charts with a tooltip on focus and a table, stubs by month
{
  const { ctx, p } = await open('stubs');
  assert.deepEqual(await p.locator('#hero .tile-value').allTextContents(), ['6', '5', '3.4']);
  assert.equal(await p.isVisible('#add-input'), false);
  await p.click('#ticket-toggle');
  assert.equal(await p.isVisible('#add-input'), true);
  await p.click('.tab[data-status="seen"]');
  assert.deepEqual((await p.locator('.stub-month').allTextContents()).slice(0, 2), ['November 2026', 'October 2026']);
  assert.equal(await p.locator('.stub').count(), 6);
  const bars = p.locator('.chart').nth(1).locator('.bar');
  assert.equal(await bars.count(), 5);
  await bars.nth(3).focus();
  assert.equal(await p.locator('.chart').nth(1).locator('.chart-tip').textContent(), '4 stars: 2 titles');
  await bars.nth(0).focus();
  assert.equal(await p.locator('.chart').nth(1).locator('.chart-tip').textContent(), '1 star: 1 title', 'singular for one');
  await p.locator('.chart').nth(1).locator('summary').click();
  assert.deepEqual(await p.locator('.chart').nth(1).locator('tbody td').allTextContents(), ['1', '1', '1', '2', '2']);
  await p.locator('.hbars .tag', { hasText: '#crime' }).click();
  assert.equal(await p.locator('.stub').count(), 2, 'a tag in the chart filters the stubs');
  await p.click('.tab[data-status="watch"]');
  assert.match(await p.textContent('.stub-month'), /Still to watch/);
  await ctx.close();
}

// The owner's own picture: shrunk, kept in this browser, shown instead of the generated poster, and exported
{
  const { ctx, p } = await open('shelf');
  const png = readFileSync(new URL('../site/assets/icons/icon-192.png', import.meta.url)); // our own icon, as a made-up picture
  const item = p.locator('.shelf-item', { hasText: 'The Imaginary Lighthouse' });
  await item.locator('.more-btn').click();
  await item.getByText('Note and tags').click();
  await item.locator('input[type=file]').setInputFiles({ name: 'made-up.png', mimeType: 'image/png', buffer: png });
  await p.waitForFunction(() => /Picture saved/.test(document.getElementById('msg').textContent));
  assert.equal(await p.locator('.shelf-item', { hasText: 'The Imaginary Lighthouse' }).locator('.cover img').count(), 1);
  await p.reload();
  await p.waitForSelector('.shelf-item img');
  assert.equal(await p.locator('.shelf-item', { hasText: 'The Imaginary Lighthouse' }).locator('.cover img').count(), 1, 'kept after a reload');
  await p.click('summary:has-text("Your data")');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#export')]);
  const exported = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  assert.ok(/^data:image\/jpeg;base64,/.test(exported.pictures.fx00), 'the picture travels with the export');
  await ctx.close();
}

// the Design button opens five screenshot cards on every page, and a card applies its design
for (const path of ['/', '/pt/policy/']) {
  const { ctx, p } = await open(null, path);
  assert.equal(await p.isVisible('#design-open'), true);
  await p.click('#design-open');
  assert.equal(await p.evaluate(() => document.getElementById('design-dialog').open), true);
  assert.equal(await p.locator('.design-cards li').count(), 5);
  assert.equal(await p.locator('.design-cards img').count(), 5);
  assert.equal(await p.getAttribute('.design-use[data-design="auto"]', 'aria-pressed'), 'true');
  await p.click('.design-use[data-design="stubs"]');
  assert.equal(await p.evaluate(() => document.getElementById('design-dialog').open), false);
  assert.equal(await p.getAttribute('html', 'data-design'), 'stubs');
  assert.equal(await p.inputValue('#design'), 'stubs');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'design-open');
  if (path === '/') assert.equal(await p.getAttribute('body', 'data-layout'), 'stubs');
  await p.click('#design-open');
  assert.equal(await p.getAttribute('.design-use[data-design="stubs"]', 'aria-pressed'), 'true');
  await p.keyboard.press('Escape');
  await ctx.close();
}

// every design draws every page of the list without script errors, in both languages
for (const d of ['shelf', 'queue', 'cards', 'stubs', 'list']) for (const path of ['/', '/pt/']) {
  const { ctx, p } = await open(d, path);
  if (d === 'queue') await p.click('#all-toggle');
  for (const s of ['watch', 'seen', 'hidden']) { await p.click(`.tab[data-status="${s}"]`); assert.ok(await p.locator('[data-id]').count() >= 1, d + ' ' + path + ' ' + s); }
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await ctx.close();
}

assert.deepEqual(errors, [], 'no script errors');
assert.deepEqual(outside, [], 'no request leaves the site');
console.log('design tests passed');
await b.close(); srv.close();

// Runs axe (WCAG 2.0, 2.1 and 2.2, A and AA) on every page in every design, light and dark.
// The home pages are filled with made-up titles and shown with the design's own content open.
// Usage: node tests/axe-designs.mjs _site
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
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
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
let bad = 0, runs = 0;
async function check(pg, label) {
  const r = await new AxeBuilder({ page: pg }).withTags(TAGS).analyze(); runs++;
  for (const v of r.violations) { bad++; console.log(label, v.id, v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message || '')).join(' | ')); }
}
for (const design of ['auto', 'shelf', 'queue', 'cards', 'stubs', 'list']) {
  for (const colour of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme: colour, reducedMotion: 'reduce' });
    await ctx.addInitScript(([s, d]) => {
      localStorage.setItem('streaming.v1', JSON.stringify(s));
      if (d !== 'auto') localStorage.setItem('streaming.design', d); else localStorage.removeItem('streaming.design');
    }, [fixture, design]);
    const pg = await ctx.newPage();
    for (const path of ['/', '/pt/', '/start/', '/pt/start/', '/agents/', '/pt/agents/', '/admin/', '/pt/admin/', '/policy/', '/pt/policy/']) {
      await pg.goto(base + path);
      const label = design + ' ' + colour + ' ' + path;
      if (path === '/' || path === '/pt/') {
        await check(pg, label + ' (list)');
        await pg.locator('[data-id] .more-btn').first().click(); // the More menu
        await check(pg, label + ' (More)');
        await pg.locator('.more-menu .chip', { hasText: /Note and tags|Nota e etiquetas/ }).first().click(); // Note and tags, with the picture controls
        if (design === 'queue' || design === 'auto' || design === 'shelf' || design === 'stubs') { const t = pg.locator('#all-toggle, #refine-toggle, #ticket-toggle'); for (let i = 0; i < await t.count(); i++) if (await t.nth(i).isVisible()) await t.nth(i).click(); }
        await pg.click('#pick-btn'); await pg.waitForSelector('#pick-card .pick-acts');
        await pg.locator('details.fold summary').nth(0).click(); await pg.locator('details.fold summary').nth(1).click();
        await check(pg, label + ' (edit panel, picker, folds)');
        await pg.click('.tab[data-status="seen"]');
        if (design === 'stubs') { await pg.locator('.chart summary').first().click(); await pg.locator('.chart .bar').nth(10).focus(); }
        await check(pg, label + ' (seen)');
        await pg.locator('[data-id]').first().locator('.item-title').click();
        await check(pg, label + ' (record)');
      } else await check(pg, label);
      if (path === '/policy/' && colour === 'light') { await pg.click('#design-open'); await check(pg, label + ' (design cards)'); await pg.keyboard.press('Escape'); }
    }
    await ctx.close();
  }
}
console.log(bad ? bad + ' violations in ' + runs + ' runs' : 'axe: ' + runs + ' runs, every page in every design, light and dark: no violations');
await b.close(); srv.close();

// Runs axe on every page in every design. Usage: node tests/axe-designs.mjs _site
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const root = process.argv[2] || '_site';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = createServer((q, r) => {
  let p = join(root, decodeURIComponent(q.url.split('?')[0])); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const base = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {});
let bad = 0;
for (const design of ['paper', 'night', 'cinema', 'coast', 'contrast']) {
  for (const colour of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme: colour });
    await ctx.addInitScript((d) => localStorage.setItem('streaming.design', d), design);
    const pg = await ctx.newPage();
    for (const path of ['/', '/pt/', '/start/', '/pt/start/', '/agents/', '/pt/agents/', '/admin/', '/pt/admin/', '/policy/', '/pt/policy/']) {
      await pg.goto(base + path);
      if (path === '/') { await pg.fill('#add-input', 'The Imaginary Lighthouse'); await pg.click('#add-form button'); }
      const r = await new AxeBuilder({ page: pg }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      for (const v of r.violations) { bad++; console.log(design, colour, path, v.id, v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message || '')).join(' | ')); }
    }
    await ctx.close();
  }
}
console.log(bad ? bad + ' violations' : 'axe: all pages, all designs, light and dark: no violations');
await b.close(); srv.close();

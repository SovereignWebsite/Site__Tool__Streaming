// Makes the screenshot cards for the "Choose a design" dialog, from the made-up fixture only.
// Run after a design changes: node .github/ci/build.mjs && node tools/design-shots.mjs _site
// Writes site/assets/designs/<design>.jpg (390 x 520, phone width, light).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const root = process.argv[2] || '_site';
const fixture = JSON.parse(readFileSync('tests/fixtures/design-sample.json', 'utf8')).data;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((q, r) => {
  let p = join(root, decodeURIComponent(q.url.split('?')[0])); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p));
}).listen(0);
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {});
for (const d of ['shelf', 'queue', 'cards', 'stubs', 'list']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 520 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(([s, x]) => { localStorage.setItem('streaming.v1', JSON.stringify(s)); localStorage.setItem('streaming.design', x); }, [fixture, d]);
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:' + srv.address().port + '/');
  if (d === 'stubs') await p.click('.tab[data-status="seen"]');
  await p.evaluate(() => { document.querySelector('.tagbar').hidden = true; document.querySelector('#pickbar').hidden = true; document.querySelector('#tools').hidden = true; });
  await p.evaluate(() => window.scrollTo(0, document.querySelector('.tabs').getBoundingClientRect().top + window.scrollY - 8));
  await p.screenshot({ path: `site/assets/designs/${d}.jpg`, type: 'jpeg', quality: 78 });
  await ctx.close();
}
console.log('design cards written');
await b.close(); srv.close();

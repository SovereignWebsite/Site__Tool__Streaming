import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../site/assets/core.js');

let s = C.empty();
assert.equal(C.addItem(s, 'The Imaginary Lighthouse').ok, true);
assert.equal(C.addItem(s, 'the imaginary lighthouse').error, 'duplicate');
assert.equal(C.addItem(s, '').error, 'empty');
assert.equal(C.addItem(s, 'https://example.com/x').error, 'host');
assert.equal(C.addItem(s, 'https://').error, 'badlink');
const r = C.addItem(s, 'https://www.themoviedb.org/movie/9-made-up-film');
assert.equal(r.item.title, 'made up film');
assert.equal(s.items.length, 2);
C.update(s, r.item.id, { status: 'seen', rating: 9, note: 'ok' });
assert.equal(r.item.status, 'seen'); assert.equal(r.item.rating, 0);
C.update(s, r.item.id, { rating: 5 }); assert.equal(r.item.rating, 5);
assert.equal(C.list(s, {}).length, 2);
C.update(s, r.item.id, { status: 'hidden' });
assert.equal(C.list(s, {}).length, 1);
assert.equal(C.list(s, { showHidden: true }).length, 2);
assert.equal(C.remove(s, r.item.id), true);

assert.equal(C.addView(s, 'v', 'https://data.promptugal.news/streaming/?a=1').ok, true);
assert.equal(C.addView(s, 'v', 'https://evil.example/streaming/').error, 'viewhost');
assert.equal(C.addView(s, '', 'https://data.promptugal.news/streaming/').error, 'noname');

const fx = readFileSync(new URL('./fixtures/made-up-list.json', import.meta.url), 'utf8');
const imp = C.importJson(fx);
assert.equal(imp.ok, true);
assert.deepEqual(imp.state.prefs.services, ['Netflix']);
assert.deepEqual(imp.state.prefs.genres, ['Drama', 'Comedy']);
assert.equal(imp.state.views.length, 1);
const round = C.importJson(C.exportJson(imp.state));
assert.deepEqual(round.state.items, imp.state.items);
assert.equal(C.importJson('nope').error, 'json');
assert.equal(C.importJson('{"app":"x"}').error, 'shape');
const bad = C.importJson(JSON.stringify({ app: 'streaming', data: { v: 1, items: [{ title: 'T', url: 'https://evil.example/', status: 'zzz' }] } }));
assert.equal(bad.state.items[0].url, ''); assert.equal(bad.state.items[0].status, 'watch');

const mem = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
C.save(mem, imp.state);
assert.equal(C.load(mem).items.length, 3);
const a = C.importJson(fx).state;
const o = C.empty(); C.addItem(o, 'Sample Harbour Nights'); C.addItem(o, 'Another Made-up Title'); C.setPrefs(o, { services: ['Disney+'], countries: ['GB'], genres: ['Horror'] });
const before = a.items.length;
assert.equal(C.merge(a, o), 2); assert.equal(a.items.length, before + 2);
assert.equal(C.merge(a, o), 0);
assert.deepEqual(a.prefs.services, ['Netflix', 'Disney+']); assert.deepEqual(a.prefs.countries, ['PT', 'GB']);
assert.deepEqual(C.counts(a), { watch: 3, seen: 1, hidden: 1 });
assert.equal(C.list(a, { sort: 'title' })[0].title, 'Another Made-up Title');
assert.equal(C.list(a, { sort: 'rating' })[0].rating, 4);
// tags, seen date, tag filter, pick, undo, record
{
  const t = C.empty();
  const a = C.addItem(t, 'Made-up One').item, b2 = C.addItem(t, 'Made-up Two').item, c = C.addItem(t, 'Made-up Three').item;
  C.update(t, a.id, { tags: 'Family, weekend, family, ' + 'x'.repeat(40) });
  assert.deepEqual(a.tags, ['Family', 'weekend', 'x'.repeat(30)]);
  C.update(t, b2.id, { tags: ['family'] });
  assert.equal(C.allTags(t)[0].tag.toLowerCase(), 'family'); assert.equal(C.allTags(t)[0].count, 2);
  assert.equal(C.list(t, { status: 'watch', tag: 'FAMILY' }).length, 2);
  assert.equal(C.list(t, { text: 'weekend' }).length, 1);
  const when = new Date('2026-01-05T20:00:00.000Z');
  C.update(t, c.id, { status: 'seen', now: when });
  assert.equal(c.seenAt, '2026-01-05T20:00:00.000Z');
  C.update(t, c.id, { status: 'seen', now: new Date() }); assert.equal(c.seenAt, '2026-01-05T20:00:00.000Z', 'seen date kept when already seen');
  for (let i = 0; i < 20; i++) { const p = C.pick(t, 'family', a.id); assert.equal(p.id, b2.id); }
  assert.equal(C.pick(t, 'nothing'), null);
  assert.equal(C.pick(t, '', null, () => 0).id, C.list(t, { status: 'watch' })[0].id);
  const taken = C.take(t, b2.id); assert.equal(taken.index, 1); assert.equal(t.items.length, 2);
  assert.equal(C.putBack(t, taken), true); assert.equal(t.items[1].id, b2.id); assert.equal(C.putBack(t, taken), false);
  const rec = JSON.parse(C.recordJson(t, a.id));
  assert.equal(rec.kind, 'record'); assert.equal(rec.record.title, 'Made-up One'); assert.deepEqual(rec.record.tags, a.tags);
  const back = C.importJson(C.exportJson(t)).state;
  assert.deepEqual(back.items.find((i) => i.id === a.id).tags, a.tags);
  assert.equal(back.items.find((i) => i.id === c.id).seenAt, '2026-01-05T20:00:00.000Z');
  assert.equal('tags' in back.items.find((i) => i.id === c.id), false);
}
// the queue's own order, and the figures for the ticket stubs
{
  const q = C.empty();
  const x = C.addItem(q, 'Made-up X').item, y = C.addItem(q, 'Made-up Y').item, z = C.addItem(q, 'Made-up Z').item; // order: Z, Y, X
  C.update(q, y.id, { status: 'seen', now: new Date('2026-10-03T21:00:00.000Z') });
  assert.equal(C.move(q, x.id, -1), true); // skips the seen title in between
  assert.deepEqual(q.items.map((i) => i.title), ['Made-up X', 'Made-up Y', 'Made-up Z']);
  assert.equal(C.move(q, x.id, -1), false);
  C.update(q, z.id, { status: 'seen', now: new Date('2026-11-20T21:00:00.000Z'), rating: 4 });
  C.update(q, y.id, { rating: 4 });
  const months = C.seenByMonth(q, 3, new Date('2026-11-22T00:00:00.000Z'));
  assert.deepEqual(months, [{ key: '2026-09', count: 0 }, { key: '2026-10', count: 1 }, { key: '2026-11', count: 1 }]);
  assert.deepEqual(C.ratingCounts(q).map((r) => r.count), [0, 0, 0, 2, 0]);
  assert.deepEqual(C.seenGroups(q).map((g) => g.key + ':' + g.items.length), ['2026-11:1', '2026-10:1']);
}
// the generated poster is the same for the same title, and different for another
{
  const P = createRequire(import.meta.url)('../site/assets/poster.js');
  assert.equal(P.svg('The Imaginary Lighthouse'), P.svg('The Imaginary Lighthouse'));
  const art = (t) => P.svg(t).replace(/<text[^>]*>[^<]*<\/text>/g, '');
  assert.equal(art('The Imaginary Lighthouse'), art('the imaginary lighthouse'), 'same artwork whatever the case');
  assert.notEqual(P.svg('The Imaginary Lighthouse'), P.svg('Placeholder Hills'));
  assert.ok(P.svg('<script>').includes('&lt;script&gt;'));
  assert.ok(P.lines('A very long made-up title that goes on and on and on for ever').length <= 4);
}
console.log('core tests passed');

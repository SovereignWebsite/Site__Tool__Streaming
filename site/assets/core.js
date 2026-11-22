/* Streaming core: the owner's own list, kept in the browser. No network, no TMDB data.
   A title is only what the owner gives: a link, a typed title, their notes. */
(function (root) {
  'use strict';
  var KEY = 'streaming.v1';
  var STATUSES = ['watch', 'seen', 'hidden'];
  var SERVICES = ['Netflix', 'Disney+', 'Prime Video', 'Apple TV+'];
  var COUNTRIES = ['GB', 'PT'];
  var LINK_HOSTS = ['www.themoviedb.org', 'themoviedb.org', 'data.promptugal.news'];
  var VIEW_HOST = 'data.promptugal.news';

  function empty() {
    return { v: 1, items: [], prefs: { services: [], countries: [], genres: [] }, views: [] };
  }

  function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }

  function parseUrl(s) {
    try { var u = new URL(s); return /^https?:$/.test(u.protocol) ? u : null; } catch (e) { return null; }
  }

  /* Title as it appears in a link slug, e.g. /movie/603-example-title -> "example title". Fetches nothing. */
  function titleFromUrl(u) {
    var parts = u.pathname.split('/').filter(Boolean);
    var last = parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
    last = last.replace(/^\d+-?/, '').replace(/[-_]+/g, ' ').trim();
    return last;
  }

  function makeId() {
    return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* input: a pasted link or a typed title. Returns {ok, item} or {ok:false, error}. */
  function makeItem(input, now) {
    var raw = clean(input, 500);
    if (!raw) return { ok: false, error: 'empty' };
    var u = /^https?:\/\//i.test(raw) ? parseUrl(raw) : null;
    var item = { id: makeId(), title: '', url: '', status: 'watch', rating: 0, note: '', added: (now || new Date()).toISOString() };
    if (/^https?:\/\//i.test(raw)) {
      if (!u) return { ok: false, error: 'badlink' };
      if (LINK_HOSTS.indexOf(u.hostname) < 0) return { ok: false, error: 'host' };
      item.url = u.href;
      item.title = clean(titleFromUrl(u), 200);
      if (!item.title) return { ok: false, error: 'notitle' };
    } else {
      item.title = clean(raw, 200);
    }
    return { ok: true, item: item };
  }

  function addItem(state, input, now) {
    var r = makeItem(input, now);
    if (!r.ok) return r;
    var key = r.item.url || r.item.title.toLowerCase();
    for (var i = 0; i < state.items.length; i++) {
      var o = state.items[i];
      if ((o.url || o.title.toLowerCase()) === key) return { ok: false, error: 'duplicate' };
    }
    state.items.unshift(r.item);
    return r;
  }

  /* The owner's own tags: short, at most 10 per title, no duplicates (case does not matter). */
  function cleanTags(tags) {
    var list = Array.isArray(tags) ? tags : String(tags || '').split(',');
    var seen = {}, out = [];
    list.forEach(function (t) {
      var v = clean(t, 30); var k = v.toLowerCase();
      if (v && !seen[k] && out.length < 10) { seen[k] = 1; out.push(v); }
    });
    return out;
  }

  function update(state, id, patch) {
    for (var i = 0; i < state.items.length; i++) {
      var it = state.items[i];
      if (it.id !== id) continue;
      if (patch.status !== undefined && STATUSES.indexOf(patch.status) >= 0) {
        if (patch.status === 'seen' && it.status !== 'seen') it.seenAt = (patch.now || new Date()).toISOString();
        it.status = patch.status;
      }
      if (patch.tags !== undefined) it.tags = cleanTags(patch.tags);
      if (patch.rating !== undefined) { var n = parseInt(patch.rating, 10); it.rating = n >= 0 && n <= 5 ? n : 0; }
      if (patch.note !== undefined) it.note = clean(patch.note, 2000);
      return true;
    }
    return false;
  }

  function remove(state, id) {
    var n = state.items.length;
    state.items = state.items.filter(function (i) { return i.id !== id; });
    return state.items.length < n;
  }

  function setPrefs(state, prefs) {
    state.prefs.services = (prefs.services || []).filter(function (s) { return SERVICES.indexOf(s) >= 0; });
    state.prefs.countries = (prefs.countries || []).filter(function (c) { return COUNTRIES.indexOf(c) >= 0; });
    var seen = {};
    state.prefs.genres = (prefs.genres || []).map(function (g) { return clean(g, 40); }).filter(function (g) {
      var k = g.toLowerCase(); if (!g || seen[k]) return false; seen[k] = 1; return true;
    }).slice(0, 40);
  }

  /* A saved view is a name and a link to a filtered view on the PrompTugal page. */
  function addView(state, name, link) {
    var n = clean(name, 80), u = parseUrl(clean(link, 1000));
    if (!n) return { ok: false, error: 'noname' };
    if (!u || u.hostname !== VIEW_HOST || u.pathname.indexOf('/streaming/') !== 0) return { ok: false, error: 'viewhost' };
    state.views.push({ name: n, url: u.href });
    return { ok: true };
  }

  function removeView(state, index) { if (index >= 0 && index < state.views.length) state.views.splice(index, 1); }

  function list(state, filter) {
    var f = filter || {};
    return sortItems(state.items, f.sort).filter(function (i) {
      if (f.status && i.status !== f.status) return false;
      if (!f.status && !f.showHidden && i.status === 'hidden') return false;
      if (f.tag && !(i.tags || []).some(function (t) { return t.toLowerCase() === f.tag.toLowerCase(); })) return false;
      if (f.text && (i.title + ' ' + i.note + ' ' + (i.tags || []).join(' ')).toLowerCase().indexOf(f.text.toLowerCase()) < 0) return false;
      return true;
    });
  }

  function sortItems(items, how) {
    var a = items.slice();
    if (how === 'title') a.sort(function (x, y) { return x.title.toLowerCase() < y.title.toLowerCase() ? -1 : x.title.toLowerCase() > y.title.toLowerCase() ? 1 : 0; });
    else if (how === 'rating') a.sort(function (x, y) { return y.rating - x.rating; });
    return a;
  }

  function counts(state) {
    var c = { watch: 0, seen: 0, hidden: 0 };
    state.items.forEach(function (i) { c[i.status]++; });
    return c;
  }

  function keyOf(i) { return i.url || i.title.toLowerCase(); }

  /* Adds what is in `other` and not yet in `state`; never overwrites what the owner already has. */
  function merge(state, other) {
    var have = {}, added = 0;
    state.items.forEach(function (i) { have[keyOf(i)] = 1; });
    other.items.forEach(function (i) { if (!have[keyOf(i)]) { have[keyOf(i)] = 1; state.items.push(i); added++; } });
    setPrefs(state, {
      services: state.prefs.services.concat(other.prefs.services),
      countries: state.prefs.countries.concat(other.prefs.countries),
      genres: state.prefs.genres.concat(other.prefs.genres)
    });
    state.prefs.services = state.prefs.services.filter(function (v, k, a) { return a.indexOf(v) === k; });
    state.prefs.countries = state.prefs.countries.filter(function (v, k, a) { return a.indexOf(v) === k; });
    var urls = {}; state.views.forEach(function (v) { urls[v.url] = 1; });
    other.views.forEach(function (v) { if (!urls[v.url]) { urls[v.url] = 1; state.views.push(v); } });
    return added;
  }

  /* An example list of made-up titles, marked so it can be removed in one go. */
  function addExamples(state, examples, now) {
    var t = (now || new Date()).getTime();
    examples.forEach(function (e, i) {
      var title = clean(e.title, 200); if (!title) return;
      state.items.push({ id: 'ex' + i + makeId().slice(1, 9), title: title, url: '', status: STATUSES.indexOf(e.status) >= 0 ? e.status : 'watch',
        rating: e.rating >= 0 && e.rating <= 5 ? e.rating : 0, note: clean(e.note, 2000), added: new Date(t - i * 1000).toISOString(), example: true });
    });
  }
  function hasExamples(state) { return state.items.some(function (i) { return i.example; }); }
  function removeExamples(state) { state.items = state.items.filter(function (i) { return !i.example; }); }

  /* Every tag in use, with how many titles carry it, most used first. */
  function allTags(state) {
    var c = {}, name = {};
    state.items.forEach(function (i) { (i.tags || []).forEach(function (t) { var k = t.toLowerCase(); c[k] = (c[k] || 0) + 1; if (!name[k]) name[k] = t; }); });
    return Object.keys(c).sort(function (a, b) { return c[b] - c[a] || (a < b ? -1 : 1); }).map(function (k) { return { tag: name[k], count: c[k] }; });
  }

  /* A random title from the watchlist, optionally with a tag, never the one just shown when there is a choice. */
  function pick(state, tag, avoidId, rnd) {
    var pool = list(state, { status: 'watch', tag: tag || '' });
    if (pool.length > 1 && avoidId) pool = pool.filter(function (i) { return i.id !== avoidId; });
    if (!pool.length) return null;
    return pool[Math.floor((rnd || Math.random)() * pool.length)];
  }

  /* Removes a title and says where it was, so it can be put back (undo). */
  function take(state, id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return { item: state.items.splice(i, 1)[0], index: i };
    return null;
  }
  function putBack(state, taken) {
    if (!taken || state.items.some(function (i) { return i.id === taken.item.id; })) return false;
    state.items.splice(Math.min(taken.index, state.items.length), 0, taken.item);
    return true;
  }

  function find(state, id) { for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]; return null; }

  /* One title's record, as the owner holds it, ready to save as its own JSON file. */
  function recordJson(state, id) {
    var it = find(state, id); if (!it) return null;
    return JSON.stringify({ app: 'streaming', kind: 'record', exported: new Date().toISOString(), record: it }, null, 2);
  }

  function exportJson(state) { return JSON.stringify({ app: 'streaming', exported: new Date().toISOString(), data: state }, null, 2); }

  /* Validates an imported file and rebuilds a clean state; never trusts shapes. */
  function importJson(text) {
    var j;
    try { j = JSON.parse(text); } catch (e) { return { ok: false, error: 'json' }; }
    var d = j && j.app === 'streaming' ? j.data : null;
    if (!d || d.v !== 1 || !Array.isArray(d.items)) return { ok: false, error: 'shape' };
    var s = empty();
    d.items.slice(0, 5000).forEach(function (o) {
      if (!o || typeof o !== 'object') return;
      var title = clean(o.title, 200);
      if (!title) return;
      var url = '';
      var u = o.url ? parseUrl(String(o.url)) : null;
      if (u && LINK_HOSTS.indexOf(u.hostname) >= 0) url = u.href;
      var rating = parseInt(o.rating, 10);
      s.items.push({
        id: /^[A-Za-z0-9]{3,40}$/.test(String(o.id)) ? String(o.id) : makeId(),
        title: title, url: url,
        status: STATUSES.indexOf(o.status) >= 0 ? o.status : 'watch',
        rating: rating >= 0 && rating <= 5 ? rating : 0,
        note: clean(o.note, 2000),
        added: clean(o.added, 40),
        example: o.example === true,
        tags: cleanTags(o.tags),
        seenAt: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(String(o.seenAt || '')) ? String(o.seenAt) : ''
      });
      var last = s.items[s.items.length - 1];
      if (!last.tags.length) delete last.tags;
      if (!last.seenAt) delete last.seenAt;
      if (!s.items[s.items.length - 1].example) delete s.items[s.items.length - 1].example;
    });
    if (d.prefs) setPrefs(s, d.prefs);
    (d.views || []).slice(0, 200).forEach(function (v) { if (v) addView(s, v.name, v.url); });
    return { ok: true, state: s };
  }

  function load(storage) {
    try { var t = storage.getItem(KEY); if (t) { var r = importJson(JSON.stringify({ app: 'streaming', data: JSON.parse(t) })); if (r.ok) return r.state; } } catch (e) {}
    return empty();
  }
  function save(storage, state) { try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; } }

  var api = { KEY: KEY, SERVICES: SERVICES, COUNTRIES: COUNTRIES, empty: empty, addItem: addItem, update: update, remove: remove,
    setPrefs: setPrefs, addView: addView, removeView: removeView, list: list, sortItems: sortItems, counts: counts, merge: merge, cleanTags: cleanTags, allTags: allTags, pick: pick, take: take, putBack: putBack, find: find, recordJson: recordJson, addExamples: addExamples, hasExamples: hasExamples, removeExamples: removeExamples, exportJson: exportJson, importJson: importJson,
    load: load, save: save, titleFromUrl: titleFromUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StreamingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

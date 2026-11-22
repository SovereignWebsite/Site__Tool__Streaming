/* Streaming page: draws the owner's list from the browser's own storage. No network calls. */
(function () {
  'use strict';
  var C = window.StreamingCore;
  var T = JSON.parse(document.getElementById('i18n').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var state = C.load(window.localStorage);
  var tab = 'watch', tagFilter = '', editing = null, lastPick = null, toastTimer = null, undoFn = null;
  var PT_LINK = 'https://data.promptugal.news/streaming/';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function say(key, o) { $('msg').textContent = fmt(T[key] || key, o || {}); }
  function persist() { if (!C.save(window.localStorage, state)) say('nostorage'); }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(label, cls, aria, fn) {
    var b = el('button', { type: 'button', 'class': cls }, label);
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', fn); return b;
  }
  function act(label, title) { return fmt(T.actionsFor, { a: label, t: title }); }
  function day(iso) {
    if (!iso) return T.none;
    try { return new Date(iso).toLocaleDateString(document.documentElement.lang, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return iso.slice(0, 10); }
  }
  function focusRow(id, sel) { var e = document.querySelector('[data-id="' + id + '"] ' + (sel || '.item-title')); if (e) e.focus(); }

  /* A short message with Undo, for actions that remove a title from view. */
  function toast(text, undo) {
    clearTimeout(toastTimer);
    $('toast-msg').textContent = text; undoFn = undo; $('toast').hidden = false;
    toastTimer = setTimeout(function () { $('toast').hidden = true; undoFn = null; }, 8000);
  }

  function setTab(s) {
    tab = s; editing = null;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-status') === s)); });
    $('pick-card').hidden = true;
    render();
  }
  function setTag(t) { tagFilter = tagFilter.toLowerCase() === String(t).toLowerCase() ? '' : t; render(); }

  function stars(it) {
    var g = el('span', { 'class': 'stars', role: 'group', 'aria-label': fmt(T.rateFor, { t: it.title }) });
    for (var n = 1; n <= 5; n++) (function (n) {
      var b = btn(n <= it.rating ? '★' : '☆', 'star', fmt(T.star, { n: n }), function () {
        var v = it.rating === n ? 0 : n;
        C.update(state, it.id, { rating: v }); persist(); render();
        say(v ? 'rated' : 'unrated', { n: v });
        focusRow(it.id, '.star:nth-child(' + n + ')');
      });
      b.setAttribute('aria-pressed', String(n <= it.rating));
      g.appendChild(b);
    })(n);
    return g;
  }

  function move(it, to) {
    return function () {
      var from = it.status;
      C.update(state, it.id, { status: to }); persist(); render(); say('moved_' + to);
      if (to === 'hidden') toast(fmt(T.hiddenT, { t: it.title }), function () { C.update(state, it.id, { status: from }); persist(); render(); say('undone'); focusRow(it.id); });
    };
  }

  function removeItem(it) {
    var taken = C.take(state, it.id); persist(); render(); say('removed');
    toast(fmt(T.removedT, { t: it.title }), function () { C.putBack(state, taken); persist(); render(); say('undone'); focusRow(it.id); });
  }

  function row(it) {
    var li = el('li', { 'class': 'item' + (it.example ? ' is-example' : ''), 'data-id': it.id });
    var head = el('div', { 'class': 'item-head' });
    head.appendChild(btn(it.title, 'item-title', act(T.openRecord, it.title), function () { openRecord(it.id); }));
    if (it.url) head.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer', 'class': 'open', 'aria-label': act(T.open, it.title) }, T.open));
    li.appendChild(head);

    if (it.tags && it.tags.length) {
      var tg = el('div', { 'class': 'item-tags' });
      it.tags.forEach(function (t) {
        var b = btn('#' + t, 'tag', fmt(T.filterTag, { t: t }), function () { setTag(t); });
        b.setAttribute('aria-pressed', String(tagFilter.toLowerCase() === t.toLowerCase()));
        tg.appendChild(b);
      });
      li.appendChild(tg);
    }

    var bar = el('div', { 'class': 'item-bar' });
    bar.appendChild(stars(it));
    var acts = el('span', { 'class': 'item-acts' });
    if (it.status === 'watch') acts.appendChild(btn(T.markSeen, 'chip', act(T.markSeen, it.title), move(it, 'seen')));
    if (it.status === 'seen') acts.appendChild(btn(T.toWatch, 'chip', act(T.toWatch, it.title), move(it, 'watch')));
    if (it.status !== 'hidden') acts.appendChild(btn(T.hide, 'chip quiet-chip', act(T.hide, it.title), move(it, 'hidden')));
    else acts.appendChild(btn(T.unhide, 'chip', act(T.unhide, it.title), move(it, 'watch')));
    acts.appendChild(btn(T.edit, 'chip quiet-chip', act(T.edit, it.title), function () { editing = it.id; render(); focusRow(it.id, 'textarea'); }));
    bar.appendChild(acts);
    li.appendChild(bar);

    if (editing === it.id) {
      var box = el('div', { 'class': 'note-edit' });
      var ta = el('textarea', { rows: '3', 'aria-label': fmt(T.noteFor, { t: it.title }), placeholder: T.notePh }); ta.value = it.note;
      var tl = el('label', { 'for': 'tags-' + it.id }, T.tagsLabel);
      var ti = el('input', { type: 'text', id: 'tags-' + it.id, autocomplete: 'off', placeholder: T.tagsPh }); ti.value = (it.tags || []).join(', ');
      box.appendChild(ta); box.appendChild(tl); box.appendChild(ti);
      var r = el('div', { 'class': 'note-acts' });
      var save = function () { C.update(state, it.id, { note: ta.value, tags: ti.value }); editing = null; persist(); render(); say('noteSaved'); focusRow(it.id); };
      ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); save(); } });
      box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { editing = null; render(); focusRow(it.id); } });
      r.appendChild(btn(T.saveNote, '', null, save));
      r.appendChild(btn(T.cancel, 'quiet', null, function () { editing = null; render(); focusRow(it.id); }));
      box.appendChild(r); li.appendChild(box);
    } else if (it.note) {
      li.appendChild(el('p', { 'class': 'note' }, it.note));
    }
    li.appendChild(btn(T.remove, 'text-danger remove', act(T.remove, it.title), function () { removeItem(it); }));
    return li;
  }

  function renderEmpty(empty, query) {
    empty.textContent = '';
    if (query || tagFilter) { empty.appendChild(el('p', {}, T.noMatch)); return; }
    if (tab === 'seen') { empty.appendChild(el('p', {}, T.emptySeen)); return; }
    if (tab === 'hidden') { empty.appendChild(el('p', {}, T.emptyHidden)); return; }
    empty.appendChild(el('p', { 'class': 'empty-title' }, T.emptyWatch));
    var ol = el('ol');
    T.emptySteps.forEach(function (s, i) {
      var li = el('li');
      if (i === 0) li.appendChild(el('a', { href: PT_LINK, rel: 'noopener noreferrer' }, s)); else li.textContent = s;
      ol.appendChild(li);
    });
    empty.appendChild(ol);
    if (!state.items.length) empty.appendChild(btn(T.exampleBtn, 'quiet', null, function () { C.addExamples(state, T.examples); persist(); render(); }));
  }

  function renderTags() {
    var bar = $('tagbar'); bar.textContent = '';
    var tags = C.allTags(state);
    if (tagFilter && !tags.some(function (t) { return t.tag.toLowerCase() === tagFilter.toLowerCase(); })) tagFilter = '';
    bar.hidden = !tags.length;
    if (!tags.length) return;
    var all = btn(T.allTags, 'tag', null, function () { tagFilter = ''; render(); });
    all.setAttribute('aria-pressed', String(!tagFilter)); bar.appendChild(all);
    tags.forEach(function (t) {
      var b = btn('#' + t.tag + ' ' + t.count, 'tag', fmt(T.filterTagCount, { t: t.tag, n: t.count }), function () { setTag(t.tag); });
      b.setAttribute('aria-pressed', String(tagFilter.toLowerCase() === t.tag.toLowerCase()));
      bar.appendChild(b);
    });
  }

  function render() {
    var n = C.counts(state);
    ['watch', 'seen', 'hidden'].forEach(function (s) { $('n-' + s).textContent = n[s]; });
    renderTags();
    var query = $('filter-text').value;
    var items = C.list(state, { status: tab, text: query, sort: $('sort').value, tag: tagFilter });
    $('tools').hidden = state.items.length < 4;
    $('example-banner').hidden = !C.hasExamples(state);
    $('pickbar').hidden = !(tab === 'watch' && C.list(state, { status: 'watch', tag: tagFilter }).length >= 2);
    $('pick-btn').textContent = tagFilter ? fmt(T.pickTag, { t: tagFilter }) : T.pickBtn;
    var ul = $('items'); ul.textContent = '';
    items.forEach(function (it) { ul.appendChild(row(it)); });
    $('empty').hidden = items.length > 0;
    if (!items.length) renderEmpty($('empty'), query);
  }

  /* Pick something for tonight: a short shuffle (none if the visitor prefers less motion), then one title. */
  function runPick() {
    var card = $('pick-card'), final = C.pick(state, tagFilter, lastPick && lastPick.id);
    if (!final) return;
    lastPick = final; card.hidden = false; card.textContent = '';
    var label = el('p', { 'class': 'pick-label' }, T.pickTitle);
    var name = el('p', { 'class': 'pick-name' });
    card.appendChild(label); card.appendChild(name);
    var pool = C.list(state, { status: 'watch', tag: tagFilter });
    var steps = reduceMotion ? 0 : Math.min(10, pool.length * 3), k = 0;
    (function spin() {
      if (k < steps) { name.textContent = pool[Math.floor(Math.random() * pool.length)].title; name.classList.add('spinning'); k++; setTimeout(spin, 60 + k * 12); return; }
      name.classList.remove('spinning'); name.textContent = final.title;
      var r = el('div', { 'class': 'pick-acts' });
      r.appendChild(btn(T.markSeen, 'chip', act(T.markSeen, final.title), function () { C.update(state, final.id, { status: 'seen' }); persist(); card.hidden = true; render(); say('moved_seen'); }));
      r.appendChild(btn(T.openRecord, 'chip quiet-chip', act(T.openRecord, final.title), function () { openRecord(final.id); }));
      r.appendChild(btn(T.pickAgain, 'chip quiet-chip', null, runPick));
      r.appendChild(btn(T.close, 'text-danger', null, function () { card.hidden = true; $('pick-btn').focus(); }));
      card.appendChild(r);
      say('picked', { t: final.title });
    })();
  }

  /* One title's record: everything the owner holds about it, and the same as a JSON file. */
  var recordId = null;
  function openRecord(id) {
    var it = C.find(state, id); if (!it) return;
    recordId = id;
    $('record-h').textContent = it.title;
    var dl = $('record-dl'); dl.textContent = '';
    var rows = [
      [T.r_status, T['tab_' + it.status]],
      [T.r_rating, it.rating ? fmt(T.star, { n: it.rating }) : T.none],
      [T.r_tags, it.tags && it.tags.length ? it.tags.map(function (t) { return '#' + t; }).join(' ') : T.none],
      [T.r_note, it.note || T.none],
      [T.r_added, day(it.added)],
      [T.r_seen, day(it.seenAt)]
    ];
    rows.forEach(function (r) { dl.appendChild(el('dt', {}, r[0])); dl.appendChild(el('dd', {}, r[1])); });
    dl.appendChild(el('dt', {}, T.r_link));
    var dd = el('dd');
    if (it.url) dd.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer' }, it.url)); else dd.textContent = T.none;
    dl.appendChild(dd);
    if (it.example) dl.appendChild(el('p', { 'class': 'meta' }, T.exampleBanner));
    $('record-json').textContent = C.recordJson(state, id);
    var d = $('record');
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    try { history.replaceState(null, '', '#title-' + id); } catch (e) {}
  }
  function closeRecord() {
    var d = $('record'); if (d.open && typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  $('record').addEventListener('close', function () {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (recordId) focusRow(recordId); recordId = null;
  });
  $('rec-close').addEventListener('click', closeRecord);
  $('rec-copy').addEventListener('click', function () {
    var text = $('record-json').textContent;
    var done = function () { $('rec-status').textContent = T.copied; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { $('rec-status').textContent = T.copyFailed; });
    else $('rec-status').textContent = T.copyFailed;
  });
  $('rec-download').addEventListener('click', function () {
    var it = C.find(state, recordId); if (!it) return;
    var slug = it.title.toLowerCase().replace(/[^a-z0-9À-ɏ]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'title';
    var a = el('a', { href: URL.createObjectURL(new Blob([$('record-json').textContent], { type: 'application/json' })), download: 'streaming-' + slug + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
  });

  function renderPrefs() {
    C.SERVICES.forEach(function (s, i) { $('svc-' + i).checked = state.prefs.services.indexOf(s) >= 0; });
    C.COUNTRIES.forEach(function (c) { $('cty-' + c).checked = state.prefs.countries.indexOf(c) >= 0; });
    $('genres').value = state.prefs.genres.join(', ');
  }

  function renderViews() {
    var ul = $('views'); ul.textContent = '';
    if (!state.views.length) ul.appendChild(el('li', {}, T.noviews));
    state.views.forEach(function (v, i) {
      var li = el('li'); li.appendChild(el('a', { href: v.url, rel: 'noopener noreferrer' }, v.name));
      li.appendChild(document.createTextNode(' '));
      li.appendChild(btn(T.remove, 'text-danger', act(T.remove, v.name), function () { C.removeView(state, i); persist(); renderViews(); }));
      ul.appendChild(li);
    });
  }

  function all() { render(); renderPrefs(); renderViews(); }

  function addTitle(text) {
    var hadExamples = C.hasExamples(state);
    if (hadExamples) C.removeExamples(state);
    var r = C.addItem(state, text);
    if (!r.ok) { if (hadExamples) state = C.load(window.localStorage); say('err_' + r.error); return false; }
    persist(); tagFilter = ''; setTab('watch'); say('added');
    return true;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-status')); }); });

  $('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (addTitle($('add-input').value)) $('add-input').value = '';
  });
  /* Paste a link anywhere on the page (outside a text box) to add it; press / to start typing a title. */
  document.addEventListener('paste', function (e) {
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable) || $('record').open) return;
    var text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text || !text.trim()) return;
    e.preventDefault(); addTitle(text.trim().split('\n')[0]);
  });
  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !e.ctrlKey && !e.metaKey && !e.altKey && !$('record').open) { e.preventDefault(); $('add-input').focus(); }
  });

  $('toast-undo').addEventListener('click', function () { var f = undoFn; undoFn = null; $('toast').hidden = true; clearTimeout(toastTimer); if (f) f(); });
  $('pick-btn').addEventListener('click', runPick);
  $('example-clear').addEventListener('click', function () { C.removeExamples(state); persist(); render(); $('add-input').focus(); });
  $('filter-text').addEventListener('input', render);
  $('sort').addEventListener('change', render);

  $('prefs-form').addEventListener('submit', function (e) {
    e.preventDefault();
    C.setPrefs(state, {
      services: C.SERVICES.filter(function (s, i) { return $('svc-' + i).checked; }),
      countries: C.COUNTRIES.filter(function (c) { return $('cty-' + c).checked; }),
      genres: $('genres').value.split(',')
    });
    persist(); renderPrefs(); say('prefssaved');
  });

  $('view-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var r = C.addView(state, $('view-name').value, $('view-link').value);
    if (!r.ok) { say('err_' + r.error); return; }
    $('view-name').value = ''; $('view-link').value = ''; persist(); renderViews(); say('viewadded');
  });

  $('export').addEventListener('click', function () {
    var blob = new Blob([C.exportJson(state)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'streaming-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a); a.click(); a.remove(); say('exported');
  });
  $('import').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var input = this, rd = new FileReader();
    rd.onload = function () {
      var r = C.importJson(String(rd.result));
      if (!r.ok) { say('err_import'); return; }
      if ($('merge').checked) { var n = C.merge(state, r.state); persist(); all(); say('merged', { n: n }); return; }
      state = r.state; persist(); all(); say('imported');
    };
    rd.readAsText(f); input.value = '';
  });
  $('wipe').addEventListener('click', function () {
    if (!window.confirm(T.confirmwipe)) return;
    state = C.empty(); persist(); all(); say('wiped');
  });

  all();
  var m = /^#title-([A-Za-z0-9]+)$/.exec(location.hash);
  if (m && C.find(state, m[1])) openRecord(m[1]);
})();

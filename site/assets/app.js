/* Streaming page: draws the owner's list from the browser's own storage. No network calls. */
(function () {
  'use strict';
  var C = window.StreamingCore;
  var T = JSON.parse(document.getElementById('i18n').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var state = C.load(window.localStorage);
  var tab = 'watch';
  var editing = null;
  var PT_LINK = 'https://data.promptugal.news/streaming/';

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

  function setTab(s) {
    tab = s; editing = null;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-status') === s)); });
    render();
  }

  function stars(it) {
    var g = el('span', { 'class': 'stars', role: 'group', 'aria-label': fmt(T.rateFor, { t: it.title }) });
    for (var n = 1; n <= 5; n++) (function (n) {
      var b = btn(n <= it.rating ? '★' : '☆', 'star', fmt(T.star, { n: n }), function () {
        var v = it.rating === n ? 0 : n;
        C.update(state, it.id, { rating: v }); persist(); render();
        say(v ? 'rated' : 'unrated', { n: v });
        var again = document.querySelector('[data-id="' + it.id + '"] .star:nth-child(' + n + ')'); if (again) again.focus();
      });
      b.setAttribute('aria-pressed', String(n <= it.rating));
      g.appendChild(b);
    })(n);
    return g;
  }

  function move(it, to) {
    return function () { C.update(state, it.id, { status: to }); persist(); render(); say('moved_' + to); };
  }

  function row(it) {
    var li = el('li', { 'class': 'item' + (it.example ? ' is-example' : ''), 'data-id': it.id });
    var head = el('div', { 'class': 'item-head' });
    head.appendChild(el('span', { 'class': 'item-title' }, it.title));
    if (it.url) head.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer', 'class': 'open', 'aria-label': act(T.open, it.title) }, T.open));
    li.appendChild(head);

    var bar = el('div', { 'class': 'item-bar' });
    bar.appendChild(stars(it));
    var acts = el('span', { 'class': 'item-acts' });
    if (it.status === 'watch') acts.appendChild(btn(T.markSeen, 'chip', act(T.markSeen, it.title), move(it, 'seen')));
    if (it.status === 'seen') acts.appendChild(btn(T.toWatch, 'chip', act(T.toWatch, it.title), move(it, 'watch')));
    if (it.status !== 'hidden') acts.appendChild(btn(T.hide, 'chip quiet-chip', act(T.hide, it.title), move(it, 'hidden')));
    else acts.appendChild(btn(T.unhide, 'chip', act(T.unhide, it.title), move(it, 'watch')));
    acts.appendChild(btn(it.note ? T.editNote : T.note, 'chip quiet-chip', act(it.note ? T.editNote : T.note, it.title), function () { editing = it.id; render(); var ta = document.querySelector('[data-id="' + it.id + '"] textarea'); if (ta) ta.focus(); }));
    bar.appendChild(acts);
    li.appendChild(bar);

    if (editing === it.id) {
      var box = el('div', { 'class': 'note-edit' });
      var ta = el('textarea', { rows: '3', 'aria-label': fmt(T.noteFor, { t: it.title }) }); ta.value = it.note;
      box.appendChild(ta);
      var r = el('div', { 'class': 'note-acts' });
      r.appendChild(btn(T.saveNote, '', null, function () { C.update(state, it.id, { note: ta.value }); editing = null; persist(); render(); say('noteSaved'); }));
      r.appendChild(btn(T.cancel, 'quiet', null, function () { editing = null; render(); }));
      box.appendChild(r); li.appendChild(box);
    } else if (it.note) {
      li.appendChild(el('p', { 'class': 'note' }, it.note));
    }
    li.appendChild(btn(T.remove, 'text-danger remove', act(T.remove, it.title), function () { C.remove(state, it.id); persist(); render(); say('removed'); }));
    return li;
  }

  function renderEmpty(empty, query) {
    empty.textContent = '';
    if (query) { empty.appendChild(el('p', {}, T.noMatch)); return; }
    if (tab === 'seen') { empty.appendChild(el('p', {}, T.emptySeen)); return; }
    if (tab === 'hidden') { empty.appendChild(el('p', {}, T.emptyHidden)); return; }
    empty.appendChild(el('p', { 'class': 'empty-title' }, T.emptyWatch));
    var ol = el('ol');
    T.emptySteps.forEach(function (s, i) {
      var li = el('li');
      if (i === 0) { var a = el('a', { href: PT_LINK, rel: 'noopener noreferrer' }, s); li.appendChild(a); } else li.textContent = s;
      ol.appendChild(li);
    });
    empty.appendChild(ol);
    if (!state.items.length) empty.appendChild(btn(T.exampleBtn, 'quiet', null, function () { C.addExamples(state, T.examples); persist(); render(); }));
  }

  function render() {
    var n = C.counts(state);
    ['watch', 'seen', 'hidden'].forEach(function (s) { $('n-' + s).textContent = n[s]; });
    var query = $('filter-text').value;
    var items = C.list(state, { status: tab, text: query, sort: $('sort').value });
    $('tools').hidden = state.items.length < 4;
    $('example-banner').hidden = !C.hasExamples(state);
    var ul = $('items'); ul.textContent = '';
    items.forEach(function (it) { ul.appendChild(row(it)); });
    $('empty').hidden = items.length > 0;
    if (!items.length) renderEmpty($('empty'), query);
  }

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

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-status')); }); });

  $('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var hadExamples = C.hasExamples(state);
    if (hadExamples) C.removeExamples(state);
    var r = C.addItem(state, $('add-input').value);
    if (!r.ok) { if (hadExamples) { state = C.load(window.localStorage); } say('err_' + r.error); return; }
    $('add-input').value = ''; persist(); setTab('watch'); say('added');
  });
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
})();

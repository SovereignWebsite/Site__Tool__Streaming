/* Streaming page: draws the owner's list from the browser's own storage. No network calls. */
(function () {
  'use strict';
  var C = window.StreamingCore;
  var T = JSON.parse(document.getElementById('i18n').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var state = C.load(window.localStorage);
  var saved = true;

  function say(key) { $('msg').textContent = T[key] || key; }
  function persist() { saved = C.save(window.localStorage, state); if (!saved) say('nostorage'); }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function option(sel, value, label, current) {
    var o = el('option', { value: value }, label); if (String(current) === String(value)) o.selected = true; sel.appendChild(o);
  }

  function renderItems() {
    var ul = $('items'); ul.textContent = '';
    var status = $('filter-status').value;
    var items = C.list(state, { status: status || '', text: $('filter-text').value, showHidden: false, sort: $('sort').value });
    var n = C.counts(state);
    $('count').textContent = items.length + ' / ' + state.items.length;
    $('counts').textContent = T.s_watch + ' ' + n.watch + ' · ' + T.s_seen + ' ' + n.seen + ' · ' + T.s_hidden + ' ' + n.hidden;
    if (!items.length) { ul.appendChild(el('li', {}, T.empty)); return; }
    items.forEach(function (it) {
      var li = el('li');
      li.appendChild(el('div', { 'class': 'item-title' }, it.title));
      var meta = el('div', { 'class': 'meta' });
      meta.appendChild(el('span', { 'class': 'status' }, T['s_' + it.status]));
      if (it.url) {
        meta.appendChild(document.createTextNode(' · '));
        meta.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer' }, T.open));
      }
      li.appendChild(meta);
      var row = el('div', { 'class': 'row' });
      var s1 = el('select', { 'aria-label': T.statusfor + ' ' + it.title });
      ['watch', 'seen', 'hidden'].forEach(function (s) { option(s1, s, T['s_' + s], it.status); });
      s1.addEventListener('change', function () { C.update(state, it.id, { status: s1.value }); persist(); renderItems(); });
      var s2 = el('select', { 'aria-label': T.ratingfor + ' ' + it.title });
      option(s2, 0, T.norating, it.rating);
      for (var r = 1; r <= 5; r++) option(s2, r, r + ' / 5', it.rating);
      s2.addEventListener('change', function () { C.update(state, it.id, { rating: s2.value }); persist(); });
      var note = el('textarea', { rows: '2', 'aria-label': T.notefor + ' ' + it.title, placeholder: T.noteph });
      note.value = it.note;
      note.addEventListener('change', function () { C.update(state, it.id, { note: note.value }); persist(); });
      var del = el('button', { type: 'button', 'class': 'quiet', 'aria-label': T.remove + ' ' + it.title }, T.remove);
      del.addEventListener('click', function () { C.remove(state, it.id); persist(); renderItems(); say('removed'); });
      row.appendChild(s1); row.appendChild(s2); row.appendChild(del);
      li.appendChild(row); li.appendChild(note);
      ul.appendChild(li);
    });
  }

  function renderPrefs() {
    C.SERVICES.forEach(function (s) { var b = $('svc-' + C.SERVICES.indexOf(s)); b.checked = state.prefs.services.indexOf(s) >= 0; });
    C.COUNTRIES.forEach(function (c) { $('cty-' + c).checked = state.prefs.countries.indexOf(c) >= 0; });
    $('genres').value = state.prefs.genres.join(', ');
  }

  function renderViews() {
    var ul = $('views'); ul.textContent = '';
    if (!state.views.length) ul.appendChild(el('li', {}, T.noviews));
    state.views.forEach(function (v, i) {
      var li = el('li'); li.appendChild(el('a', { href: v.url, rel: 'noopener noreferrer' }, v.name));
      var b = el('button', { type: 'button', 'class': 'quiet', 'aria-label': T.remove + ' ' + v.name }, T.remove);
      b.addEventListener('click', function () { C.removeView(state, i); persist(); renderViews(); });
      li.appendChild(document.createTextNode(' ')); li.appendChild(b); ul.appendChild(li);
    });
  }

  $('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var r = C.addItem(state, $('add-input').value);
    if (!r.ok) { say('err_' + r.error); return; }
    $('add-input').value = ''; persist(); renderItems(); say('added');
  });
  $('filter-status').addEventListener('change', renderItems);
  $('filter-text').addEventListener('input', renderItems);
  $('sort').addEventListener('change', renderItems);

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
    var rd = new FileReader();
    rd.onload = function () {
      var r = C.importJson(String(rd.result));
      if (!r.ok) { say('err_import'); return; }
      if ($('merge').checked) { var n = C.merge(state, r.state); persist(); renderItems(); renderPrefs(); renderViews(); $('msg').textContent = T.merged.replace('{n}', n); return; }
      state = r.state; persist(); renderItems(); renderPrefs(); renderViews(); say('imported');
    };
    rd.readAsText(f); this.value = '';
  });
  $('wipe').addEventListener('click', function () {
    if (!window.confirm(T.confirmwipe)) return;
    state = C.empty(); persist(); renderItems(); renderPrefs(); renderViews(); say('wiped');
  });

  var d = $('design');
  try { d.value = localStorage.getItem('streaming.design') || 'paper'; } catch (e) {}
  if (!d.value) d.value = 'paper';
  d.addEventListener('change', function () {
    document.documentElement.setAttribute('data-design', d.value);
    try { localStorage.setItem('streaming.design', d.value); } catch (e) {}
  });

  renderItems(); renderPrefs(); renderViews();
})();

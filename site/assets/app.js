/* Streaming page: draws the owner's list from the browser's own storage, in the chosen design. No network calls. */
(function () {
  'use strict';
  var C = window.StreamingCore, P = window.StreamingPoster, PIC = window.StreamingPictures;
  var T = JSON.parse(document.getElementById('i18n').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var state = C.load(window.localStorage);
  var tab = 'watch', tagFilter = '', editing = null, lastPick = null, toastTimer = null, undoFn = null;
  var PT_LINK = 'https://data.promptugal.news/streaming/';
  var LAYOUTS = ['shelf', 'queue', 'cards', 'stubs', 'list'];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = document.documentElement.lang;

  function layout() { var d = document.documentElement.getAttribute('data-design'); return LAYOUTS.indexOf(d) >= 0 ? d : 'shelf'; }
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
    try { return new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return iso.slice(0, 10); }
  }
  function monthName(key, style) {
    if (!/^\d{4}-\d{2}$/.test(key)) return T.none;
    var d = new Date(key + '-01T12:00:00Z');
    try { return d.toLocaleDateString(lang, style === 'short' ? { month: 'short', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return key; }
  }
  function focusRow(id, sel) { var e = document.querySelector('[data-id="' + id + '"] ' + (sel || '.item-title, .cover-btn')); if (e) e.focus(); }

  /* A title's picture: the owner's own, or the generated poster. Decorative; the title is always shown as text. */
  function cover(it, cls) {
    var box = el('span', { 'class': 'cover ' + (cls || ''), 'aria-hidden': 'true' });
    var own = PIC && PIC.get(it.id);
    if (own) { var img = el('img', { src: own, alt: '' }); box.appendChild(img); }
    else box.innerHTML = P.svg(it.title);
    return box;
  }

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

  /* ---- the parts every design uses ---- */
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
  function titleBtn(it, cls) { return btn(it.title, 'item-title ' + (cls || ''), act(T.openRecord, it.title), function () { openRecord(it.id); }); }
  function coverBtn(it, cls) {
    var b = el('button', { type: 'button', 'class': 'cover-btn', 'aria-label': act(T.openRecord, it.title) });
    b.appendChild(cover(it, cls));
    if (it.status === 'seen') b.appendChild(el('span', { 'class': 'ribbon', 'aria-hidden': 'true' }, T.tab_seen));
    b.addEventListener('click', function () { openRecord(it.id); });
    return b;
  }
  function tagsEl(it) {
    if (!it.tags || !it.tags.length) return null;
    var tg = el('div', { 'class': 'item-tags' });
    it.tags.forEach(function (t) {
      var b = btn('#' + t, 'tag', fmt(T.filterTag, { t: t }), function () { setTag(t); });
      b.setAttribute('aria-pressed', String(tagFilter.toLowerCase() === t.toLowerCase()));
      tg.appendChild(b);
    });
    return tg;
  }
  function actions(it, opts) {
    var acts = el('span', { 'class': 'item-acts' });
    if (it.status === 'watch') acts.appendChild(btn(T.markSeen, 'chip', act(T.markSeen, it.title), move(it, 'seen')));
    if (it.status === 'seen') acts.appendChild(btn(T.toWatch, 'chip', act(T.toWatch, it.title), move(it, 'watch')));
    if (it.status !== 'hidden') acts.appendChild(btn(T.hide, 'chip quiet-chip', act(T.hide, it.title), move(it, 'hidden')));
    else acts.appendChild(btn(T.unhide, 'chip', act(T.unhide, it.title), move(it, 'watch')));
    if (!(opts && opts.noEdit)) acts.appendChild(btn(T.edit, 'chip quiet-chip', act(T.edit, it.title), function () { editing = it.id; render(); focusRow(it.id, 'textarea'); }));
    return acts;
  }
  function removeBtn(it) { return btn(T.remove, 'text-danger remove', act(T.remove, it.title), function () { removeItem(it); }); }

  function editPanel(it) {
    var box = el('div', { 'class': 'note-edit' });
    var ta = el('textarea', { rows: '3', 'aria-label': fmt(T.noteFor, { t: it.title }), placeholder: T.notePh }); ta.value = it.note;
    var tl = el('label', { 'for': 'tags-' + it.id }, T.tagsLabel);
    var ti = el('input', { type: 'text', id: 'tags-' + it.id, autocomplete: 'off', placeholder: T.tagsPh }); ti.value = (it.tags || []).join(', ');
    box.appendChild(ta); box.appendChild(tl); box.appendChild(ti);
    /* The owner's own picture for this title. */
    var pr = el('div', { 'class': 'pic-row' });
    var fi = el('input', { type: 'file', id: 'pic-' + it.id, 'class': 'file-input', accept: 'image/*' });
    var fl = el('label', { 'for': 'pic-' + it.id, 'class': 'button small' }, PIC.get(it.id) ? T.picChange : T.picAdd);
    fi.addEventListener('change', function () {
      var f = fi.files[0]; if (!f) return;
      PIC.shrink(f).then(function (url) { return PIC.put(it.id, url); }).then(function () { render(); say('picSaved'); focusRow(it.id, 'textarea'); })
        .catch(function () { say('picFailed'); });
    });
    pr.appendChild(fi); pr.appendChild(fl);
    if (PIC.get(it.id)) pr.appendChild(btn(T.picRemove, 'text-danger', act(T.picRemove, it.title), function () { PIC.remove(it.id); render(); say('picRemoved'); }));
    pr.appendChild(el('p', { 'class': 'meta pic-note' }, T.picNote));
    box.appendChild(pr);
    var r = el('div', { 'class': 'note-acts' });
    var save = function () { C.update(state, it.id, { note: ta.value, tags: ti.value }); editing = null; persist(); render(); say('noteSaved'); focusRow(it.id); };
    ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { editing = null; render(); focusRow(it.id); } });
    r.appendChild(btn(T.saveNote, '', null, save));
    r.appendChild(btn(T.cancel, 'quiet', null, function () { editing = null; render(); focusRow(it.id); }));
    box.appendChild(r);
    return box;
  }
  function noteOrEdit(li, it, big) {
    if (editing === it.id) li.appendChild(editPanel(it));
    else if (it.note) li.appendChild(el('p', { 'class': big ? 'card-note' : 'note' }, it.note));
    else if (big) li.appendChild(el('p', { 'class': 'card-note empty-note' }, T.noNote));
  }
  function add(parent, child) { if (child) parent.appendChild(child); }

  /* ---- the five designs ---- */
  function rowList(it) {
    var li = el('li', { 'class': 'item', 'data-id': it.id });
    li.appendChild(cover(it, 'thumb'));
    var body = el('div', { 'class': 'item-body' });
    var head = el('div', { 'class': 'item-head' });
    head.appendChild(titleBtn(it));
    if (it.url) head.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer', 'class': 'open', 'aria-label': act(T.open, it.title) }, T.open));
    body.appendChild(head);
    add(body, tagsEl(it));
    var bar = el('div', { 'class': 'item-bar' }); bar.appendChild(stars(it)); var acts = actions(it); acts.appendChild(removeBtn(it)); bar.appendChild(acts); body.appendChild(bar);
    noteOrEdit(body, it);
    li.appendChild(body);
    return li;
  }
  function itemShelf(it) {
    var li = el('li', { 'class': 'shelf-item' + (editing === it.id ? ' editing' : ''), 'data-id': it.id });
    li.appendChild(coverBtn(it));
    var cap = el('div', { 'class': 'shelf-cap' });
    cap.appendChild(titleBtn(it, 'shelf-title'));
    add(cap, tagsEl(it));
    cap.appendChild(stars(it));
    cap.appendChild(actions(it));
    noteOrEdit(cap, it);
    cap.appendChild(removeBtn(it));
    li.appendChild(cap);
    return li;
  }
  function itemCard(it) {
    var li = el('li', { 'class': 'card', 'data-id': it.id });
    var head = el('div', { 'class': 'card-head' });
    var ht = el('div', { 'class': 'card-titles' });
    ht.appendChild(titleBtn(it, 'card-title'));
    add(ht, tagsEl(it));
    head.appendChild(ht);
    head.appendChild(coverBtn(it, 'card-thumb'));
    li.appendChild(head);
    noteOrEdit(li, it, true);
    var bar = el('div', { 'class': 'item-bar' }); bar.appendChild(stars(it)); bar.appendChild(actions(it)); li.appendChild(bar);
    li.appendChild(el('p', { 'class': 'meta card-date' }, fmt(T.addedOn, { d: day(it.added) }) + (it.seenAt ? ' · ' + fmt(T.seenOn, { d: day(it.seenAt) }) : '')));
    li.appendChild(removeBtn(it));
    return li;
  }
  function itemQueue(it, n, total) {
    var li = el('li', { 'class': 'queue-item', 'data-id': it.id });
    li.appendChild(el('span', { 'class': 'queue-n', 'aria-hidden': 'true' }, String(n)));
    li.appendChild(cover(it, 'thumb'));
    var body = el('div', { 'class': 'item-body' });
    body.appendChild(titleBtn(it));
    add(body, tagsEl(it));
    var bar = el('div', { 'class': 'item-bar' });
    var up = btn(T.moveUp, 'chip quiet-chip', act(T.moveUp, it.title), function () { if (C.move(state, it.id, -1)) { persist(); render(); say('movedUp', { t: it.title }); focusRow(it.id, '.move-up'); } });
    up.classList.add('move-up'); if (n <= 2) up.disabled = true;
    var down = btn(T.moveDown, 'chip quiet-chip', act(T.moveDown, it.title), function () { if (C.move(state, it.id, 1)) { persist(); render(); say('movedDown', { t: it.title }); focusRow(it.id, '.move-down'); } });
    down.classList.add('move-down'); if (n === total) down.disabled = true;
    var bring = btn(T.makeTonight, 'chip', act(T.makeTonight, it.title), function () { while (C.move(state, it.id, -1)) {} persist(); render(); say('madeTonight', { t: it.title }); focusRow(it.id); });
    var qa = actions(it); qa.appendChild(removeBtn(it));
    bar.appendChild(bring); bar.appendChild(up); bar.appendChild(down); bar.appendChild(qa);
    body.appendChild(bar);
    noteOrEdit(body, it);
    li.appendChild(body);
    return li;
  }
  function tonight(it) {
    var sec = el('div', { 'class': 'tonight', 'data-id': it.id });
    sec.appendChild(coverBtn(it, 'tonight-cover'));
    var body = el('div', { 'class': 'tonight-body' });
    body.appendChild(el('p', { 'class': 'pick-label' }, T.upNext));
    body.appendChild(titleBtn(it, 'tonight-title'));
    add(body, tagsEl(it));
    body.appendChild(stars(it));
    body.appendChild(actions(it));
    noteOrEdit(body, it);
    sec.appendChild(body);
    return sec;
  }
  function stub(it, unused) {
    var li = el('li', { 'class': 'stub' + (unused ? ' unused' : ''), 'data-id': it.id });
    var main = el('div', { 'class': 'stub-main' });
    main.appendChild(el('p', { 'class': 'stub-label' }, unused ? T.admitOne : (it.seenAt ? day(it.seenAt) : T.tab_seen)));
    main.appendChild(titleBtn(it, 'stub-title'));
    add(main, tagsEl(it));
    var bar = el('div', { 'class': 'item-bar' }); bar.appendChild(stars(it)); bar.appendChild(actions(it)); main.appendChild(bar);
    noteOrEdit(main, it);
    li.appendChild(main);
    var tear = el('div', { 'class': 'stub-tear' }); tear.appendChild(cover(it, 'stub-cover')); li.appendChild(tear);
    li.appendChild(removeBtn(it));
    return li;
  }

  /* ---- charts for the ticket stubs: one measure each, in the design's accent; values also in a table ---- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function tableView(rows, head) {
    var d = el('details', { 'class': 'chart-table' });
    d.appendChild(el('summary', {}, T.asTable));
    var t = el('table'), tr = el('tr');
    head.forEach(function (h) { tr.appendChild(el('th', { scope: 'col' }, h)); });
    var th = el('thead'); th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody');
    rows.forEach(function (r) { var x = el('tr'); x.appendChild(el('th', { scope: 'row' }, r[0])); x.appendChild(el('td', {}, String(r[1]))); tb.appendChild(x); });
    t.appendChild(tb); d.appendChild(t);
    return d;
  }
  function columns(title, data, tipFn) {
    var fig = el('figure', { 'class': 'chart' });
    fig.appendChild(el('figcaption', {}, title));
    var W = 320, H = 150, top = 22, bottom = 22, n = data.length, slot = W / n, bw = Math.min(24, slot * 0.62);
    var max = Math.max(1, Math.max.apply(null, data.map(function (d) { return d.value; })));
    var s = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'chart-svg', role: 'group', 'aria-label': title });
    s.appendChild(svgEl('line', { x1: 0, x2: W, y1: H - bottom + 0.5, y2: H - bottom + 0.5, 'class': 'axis' }));
    var tip = el('div', { 'class': 'chart-tip', role: 'status', hidden: '' });
    var peak = data.reduce(function (a, d, i) { return d.value > data[a].value ? i : a; }, 0);
    data.forEach(function (d, i) {
      var h = (H - top - bottom) * d.value / max, x = i * slot + (slot - bw) / 2, y = H - bottom - h;
      var g = svgEl('g', { tabindex: '0', role: 'img', 'class': 'bar', 'aria-label': tipFn(d) });
      g.appendChild(svgEl('rect', { x: i * slot, y: top - 10, width: slot, height: H - top - bottom + 10, 'class': 'hit' }));
      if (d.value > 0) {
        var r = Math.min(4, h, bw / 2);
        g.appendChild(svgEl('path', { 'class': 'mark', d: 'M' + x + ' ' + (H - bottom) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (H - bottom) + 'Z' }));
      }
      var lab = svgEl('text', { x: i * slot + slot / 2, y: H - 6, 'text-anchor': 'middle', 'class': 'tick' }); lab.textContent = d.label; g.appendChild(lab);
      if (i === peak && d.value > 0) { var v = svgEl('text', { x: x + bw / 2, y: y - 6, 'text-anchor': 'middle', 'class': 'peak' }); v.textContent = String(d.value); g.appendChild(v); }
      var show = function () { tip.textContent = tipFn(d); tip.hidden = false; tip.style.left = Math.min(82, Math.max(18, (i + 0.5) / n * 100)) + '%'; g.classList.add('on'); };
      var hide = function () { tip.hidden = true; g.classList.remove('on'); };
      g.addEventListener('pointerenter', show); g.addEventListener('pointerleave', hide); g.addEventListener('focus', show); g.addEventListener('blur', hide);
      s.appendChild(g);
    });
    var wrap = el('div', { 'class': 'chart-wrap' }); wrap.appendChild(s); wrap.appendChild(tip); fig.appendChild(wrap);
    return fig;
  }
  function tagBars(title, tags) {
    var fig = el('figure', { 'class': 'chart' });
    fig.appendChild(el('figcaption', {}, title));
    if (!tags.length) { fig.appendChild(el('p', { 'class': 'meta' }, T.noTags)); return fig; }
    var max = tags[0].count, ul = el('ul', { 'class': 'hbars' });
    tags.slice(0, 6).forEach(function (t) {
      var li = el('li');
      var b = btn('#' + t.tag, 'hbar-label tag', fmt(T.filterTagCount, { t: t.tag, n: t.count }), function () { setTag(t.tag); });
      b.setAttribute('aria-pressed', String(tagFilter.toLowerCase() === t.tag.toLowerCase()));
      var track = el('span', { 'class': 'hbar-track', 'aria-hidden': 'true' });
      var fill = el('span', { 'class': 'hbar-fill' }); fill.style.width = Math.max(4, t.count / max * 100) + '%'; track.appendChild(fill);
      li.appendChild(b); li.appendChild(track); li.appendChild(el('span', { 'class': 'hbar-n' }, String(t.count)));
      ul.appendChild(li);
    });
    fig.appendChild(ul);
    return fig;
  }
  function stats() {
    var box = el('section', { 'class': 'stats', 'aria-label': T.statsH });
    var n = C.counts(state), rated = state.items.filter(function (i) { return i.rating > 0; });
    var avg = rated.length ? (rated.reduce(function (a, i) { return a + i.rating; }, 0) / rated.length).toFixed(1) : '–';
    var tiles = el('div', { 'class': 'tiles' });
    [[T.statSeen, n.seen], [T.statWatch, n.watch], [T.statAvg, avg]].forEach(function (t) {
      var d = el('div', { 'class': 'tile' }); d.appendChild(el('p', { 'class': 'tile-label' }, t[0])); d.appendChild(el('p', { 'class': 'tile-value' }, String(t[1]))); tiles.appendChild(d);
    });
    box.appendChild(tiles);
    var months = C.seenByMonth(state, 12).map(function (m) { return { label: monthName(m.key, 'short').slice(0, 3), value: m.count, key: m.key }; });
    var mc = columns(T.chartMonths, months, function (d) { return fmt(T.tipMonth, { m: monthName(d.key), n: d.value }); });
    mc.appendChild(tableView(months.map(function (d) { return [monthName(d.key), d.value]; }), [T.colMonth, T.colSeen]));
    var ratings = C.ratingCounts(state).map(function (r) { return { label: r.stars + '★', value: r.count, stars: r.stars }; });
    var rc = columns(T.chartRatings, ratings, function (d) { return fmt(T.tipRating, { s: d.stars, n: d.value }); });
    rc.appendChild(tableView(ratings.map(function (d) { return [fmt(T.star, { n: d.stars }), d.value]; }), [T.colRating, T.colTitles]));
    var charts = el('div', { 'class': 'charts' });
    charts.appendChild(mc); charts.appendChild(rc); charts.appendChild(tagBars(T.chartTags, C.allTags(state)));
    box.appendChild(charts);
    return box;
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
    var L = layout();
    document.body.setAttribute('data-layout', L);
    var n = C.counts(state);
    ['watch', 'seen', 'hidden'].forEach(function (s) { $('n-' + s).textContent = n[s]; });
    renderTags();
    var query = $('filter-text').value;
    var sort = L === 'queue' ? 'order' : $('sort').value;
    var items = C.list(state, { status: tab, text: query, sort: sort, tag: tagFilter });
    $('list-count').textContent = state.items.length ? fmt(T['count_' + tab], { n: items.length }) + (tagFilter ? fmt(T.countTag, { t: tagFilter }) : '') : '';
    $('list-count').hidden = !state.items.length;
    $('tools').hidden = state.items.length < 4;
    $('sort-wrap').hidden = L === 'queue';
    $('example-banner').hidden = !C.hasExamples(state);
    $('pickbar').hidden = !(tab === 'watch' && C.list(state, { status: 'watch', tag: tagFilter }).length >= 2);
    $('pick-btn').textContent = tagFilter ? fmt(T.pickTag, { t: tagFilter }) : T.pickBtn;
    $('add-help').hidden = !state.items.length;

    var stage = $('stage'); stage.textContent = '';
    if (L === 'stubs' && state.items.length) stage.appendChild(stats());
    var ul;
    if (L === 'shelf') { ul = el('ul', { 'class': 'shelf', id: 'items' }); items.forEach(function (it) { ul.appendChild(itemShelf(it)); }); }
    else if (L === 'cards') { ul = el('ul', { 'class': 'cards', id: 'items' }); items.forEach(function (it) { ul.appendChild(itemCard(it)); }); }
    else if (L === 'queue' && tab === 'watch' && items.length) {
      stage.appendChild(tonight(items[0]));
      ul = el('ol', { 'class': 'queue', id: 'items', 'aria-label': T.laterH });
      items.slice(1).forEach(function (it, i) { ul.appendChild(itemQueue(it, i + 2, items.length)); });
      if (items.length > 1) stage.appendChild(el('h3', { 'class': 'queue-h' }, T.laterH));
    }
    else if (L === 'stubs' && tab !== 'hidden') {
      ul = el('div', { id: 'items', 'class': 'stubs' });
      if (tab === 'seen') {
        C.seenGroups(state).forEach(function (g) {
          var gi = g.items.filter(function (it) { return items.indexOf(it) >= 0; });
          if (!gi.length) return;
          ul.appendChild(el('h3', { 'class': 'stub-month' }, monthName(g.key)));
          var l = el('ul', { 'class': 'stub-list' }); gi.forEach(function (it) { l.appendChild(stub(it)); }); ul.appendChild(l);
        });
      } else {
        if (items.length) ul.appendChild(el('h3', { 'class': 'stub-month' }, T.unusedH));
        var l2 = el('ul', { 'class': 'stub-list' }); items.forEach(function (it) { l2.appendChild(stub(it, true)); }); ul.appendChild(l2);
      }
    }
    else { ul = el('ul', { 'class': 'items', id: 'items' }); items.forEach(function (it) { ul.appendChild(rowList(it)); }); }
    stage.appendChild(ul);
    $('empty').hidden = items.length > 0;
    if (!items.length) renderEmpty($('empty'), query);
  }

  /* Pick something for tonight: a short shuffle (none if the visitor prefers less motion), then one title. */
  function runPick() {
    var card = $('pick-card'), final = C.pick(state, tagFilter, lastPick && lastPick.id);
    if (!final) return;
    lastPick = final; card.hidden = false; card.textContent = '';
    var art = el('div', { 'class': 'pick-art' });
    var body = el('div', { 'class': 'pick-body' });
    var name = el('p', { 'class': 'pick-name' });
    body.appendChild(el('p', { 'class': 'pick-label' }, T.pickTitle)); body.appendChild(name);
    card.appendChild(art); card.appendChild(body);
    var pool = C.list(state, { status: 'watch', tag: tagFilter });
    var steps = reduceMotion ? 0 : Math.min(10, pool.length * 3), k = 0;
    (function spin() {
      if (k < steps) {
        var p = pool[Math.floor(Math.random() * pool.length)];
        name.textContent = p.title; art.textContent = ''; art.appendChild(cover(p, 'pick-cover'));
        name.classList.add('spinning'); k++; setTimeout(spin, 60 + k * 12); return;
      }
      name.classList.remove('spinning'); name.textContent = final.title; art.textContent = ''; art.appendChild(cover(final, 'pick-cover'));
      var r = el('div', { 'class': 'pick-acts' });
      r.appendChild(btn(T.markSeen, 'chip', act(T.markSeen, final.title), function () { C.update(state, final.id, { status: 'seen' }); persist(); card.hidden = true; render(); say('moved_seen'); }));
      if (layout() === 'queue') r.appendChild(btn(T.makeTonight, 'chip quiet-chip', act(T.makeTonight, final.title), function () { while (C.move(state, final.id, -1)) {} persist(); card.hidden = true; render(); say('madeTonight', { t: final.title }); }));
      r.appendChild(btn(T.openRecord, 'chip quiet-chip', act(T.openRecord, final.title), function () { openRecord(final.id); }));
      r.appendChild(btn(T.pickAgain, 'chip quiet-chip', null, runPick));
      r.appendChild(btn(T.close, 'text-danger', null, function () { card.hidden = true; $('pick-btn').focus(); }));
      body.appendChild(r);
      say('picked', { t: final.title });
    })();
  }

  /* One title's record: everything the owner holds about it, and the same as a JSON file. */
  var recordId = null;
  function openRecord(id) {
    var it = C.find(state, id); if (!it) return;
    recordId = id;
    $('record-h').textContent = it.title;
    var art = $('record-art'); art.textContent = ''; art.appendChild(cover(it, 'record-cover'));
    var dl = $('record-dl'); dl.textContent = '';
    var rows = [
      [T.r_status, T['tab_' + it.status]],
      [T.r_rating, it.rating ? fmt(T.star, { n: it.rating }) : T.none],
      [T.r_tags, it.tags && it.tags.length ? it.tags.map(function (t) { return '#' + t; }).join(' ') : T.none],
      [T.r_note, it.note || T.none],
      [T.r_added, day(it.added)],
      [T.r_seen, day(it.seenAt)],
      [T.r_picture, PIC.get(it.id) ? T.picOwn : T.picGenerated]
    ];
    rows.forEach(function (r) { dl.appendChild(el('dt', {}, r[0])); dl.appendChild(el('dd', {}, r[1])); });
    dl.appendChild(el('dt', {}, T.r_link));
    var dd = el('dd');
    if (it.url) dd.appendChild(el('a', { href: it.url, rel: 'noopener noreferrer' }, it.url)); else dd.textContent = T.none;
    dl.appendChild(dd);
    if (it.example) dl.appendChild(el('p', { 'class': 'meta' }, T.exampleBanner));
    $('record-json').textContent = C.recordJson(state, id);
    $('rec-status').textContent = '';
    var d = $('record');
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    try { history.replaceState(null, '', '#title-' + id); } catch (e) {}
  }
  function closeRecord() { var d = $('record'); if (d.open && typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
  $('record').addEventListener('close', function () {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (recordId) focusRow(recordId); recordId = null;
  });
  $('rec-close').addEventListener('click', closeRecord);
  $('rec-copy').addEventListener('click', function () {
    var text = $('record-json').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { $('rec-status').textContent = T.copied; }, function () { $('rec-status').textContent = T.copyFailed; });
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
  $('add-form').addEventListener('submit', function (e) { e.preventDefault(); if (addTitle($('add-input').value)) $('add-input').value = ''; });
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
  document.addEventListener('streaming:design', function () { editing = null; render(); });

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

  /* Export: the list as one JSON file, with the owner's own pictures if they choose. */
  $('export').addEventListener('click', function () {
    var data = JSON.parse(C.exportJson(state));
    if ($('with-pics').checked) data.pictures = PIC.all();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'streaming-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a); a.click(); a.remove(); say('exported');
  });
  $('import').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var input = this, rd = new FileReader();
    rd.onload = function () {
      var text = String(rd.result), r = C.importJson(text);
      if (!r.ok) { say('err_import'); return; }
      var pics = {}; try { pics = JSON.parse(text).pictures || {}; } catch (e) {}
      var done = function (msgKey, o) {
        Object.keys(pics).forEach(function (id) { if (C.find(state, id) && PIC.valid(pics[id])) PIC.put(id, pics[id]); });
        persist(); all(); say(msgKey, o);
      };
      if ($('merge').checked) { var n = C.merge(state, r.state); done('merged', { n: n }); return; }
      state = r.state; done('imported');
    };
    rd.readAsText(f); input.value = '';
  });
  $('wipe').addEventListener('click', function () {
    if (!window.confirm(T.confirmwipe)) return;
    state = C.empty(); PIC.clear(); persist(); all(); say('wiped');
  });

  all();
  /* Pictures load from the browser's database after the first draw; titles whose picture is gone are tidied up. */
  PIC.loadAll().then(function (pics) {
    Object.keys(pics).forEach(function (id) { if (!C.find(state, id)) PIC.remove(id); });
    if (Object.keys(pics).length) render();
    var m = /^#title-([A-Za-z0-9]+)$/.exec(location.hash);
    if (m && C.find(state, m[1])) openRecord(m[1]);
  });
})();

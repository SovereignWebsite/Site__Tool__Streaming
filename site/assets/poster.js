/* Generated posters: artwork drawn from the title's own words, so a title always gets the same poster.
   No data about the title is fetched or used; nothing leaves the browser. */
(function (root) {
  'use strict';

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) { var x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hsl(h, s, l) { return 'hsl(' + Math.round(h % 360) + ',' + Math.round(s) + '%,' + Math.round(l) + '%)'; }

  /* Breaks a title into at most four short lines for the poster. */
  function lines(title) {
    var words = String(title).split(/\s+/).filter(Boolean), out = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > 12 && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) out.push(cur);
    if (out.length > 4) { out = out.slice(0, 4); out[3] = out[3].replace(/.{0,2}$/, '') + '…'; }
    return out;
  }

  var MOTIFS = ['sun', 'stripes', 'rings', 'dots', 'hills', 'letter', 'grid', 'wave'];

  function motif(kind, r, c1, c2, c3, letter) {
    var s = '', i;
    switch (kind) {
      case 'sun':
        s += '<circle cx="' + (60 + r() * 80) + '" cy="' + (70 + r() * 50) + '" r="' + (38 + r() * 30) + '" fill="' + c2 + '"/>';
        s += '<rect y="190" width="200" height="110" fill="' + c3 + '" opacity=".55"/>';
        break;
      case 'stripes':
        for (i = -6; i < 12; i++) s += '<rect x="' + (i * 26) + '" y="-40" width="' + (8 + r() * 8) + '" height="420" fill="' + (i % 2 ? c2 : c3) + '" opacity=".5" transform="rotate(28 100 150)"/>';
        break;
      case 'rings':
        var cx = 40 + r() * 120, cy = 60 + r() * 100;
        for (i = 9; i > 0; i--) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (i * 22) + '" fill="none" stroke="' + (i % 2 ? c2 : c3) + '" stroke-width="7" opacity=".6"/>';
        break;
      case 'dots':
        for (i = 0; i < 26; i++) s += '<circle cx="' + (r() * 200) + '" cy="' + (r() * 220) + '" r="' + (3 + r() * 16) + '" fill="' + (i % 3 ? c2 : c3) + '" opacity="' + (0.35 + r() * 0.5).toFixed(2) + '"/>';
        break;
      case 'hills':
        s += '<path d="M0 ' + (170 + r() * 30) + ' Q 60 ' + (110 + r() * 40) + ' 110 ' + (160 + r() * 20) + ' T 200 ' + (130 + r() * 40) + ' V300 H0Z" fill="' + c2 + '"/>';
        s += '<path d="M0 ' + (210 + r() * 20) + ' Q 80 ' + (170 + r() * 30) + ' 140 ' + (205 + r() * 20) + ' T 200 ' + (190 + r() * 20) + ' V300 H0Z" fill="' + c3 + '"/>';
        s += '<circle cx="' + (140 + r() * 40) + '" cy="' + (50 + r() * 30) + '" r="14" fill="' + c3 + '" opacity=".8"/>';
        break;
      case 'letter':
        s += '<text x="100" y="175" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="210" font-weight="700" fill="' + c2 + '" opacity=".85">' + esc(letter) + '</text>';
        break;
      case 'grid':
        for (i = 0; i < 6; i++) for (var j = 0; j < 7; j++) if (r() > 0.45) s += '<rect x="' + (i * 34 + 4) + '" y="' + (j * 34 + 4) + '" width="28" height="28" rx="4" fill="' + (r() > 0.5 ? c2 : c3) + '" opacity=".6"/>';
        break;
      default:
        for (i = 0; i < 7; i++) s += '<path d="M0 ' + (40 + i * 28) + ' C 50 ' + (20 + i * 28 + r() * 30) + ', 150 ' + (60 + i * 28 - r() * 30) + ', 200 ' + (40 + i * 28) + '" fill="none" stroke="' + (i % 2 ? c2 : c3) + '" stroke-width="' + (4 + r() * 6) + '" opacity=".6"/>';
    }
    return s;
  }

  /* Returns an SVG string, 2:3, for a title. It is decorative: the title is always also shown as text. */
  function svg(title) {
    var t = String(title || '?'), h = hash(t.toLowerCase()), r = rng(h);
    var hue = h % 360, hue2 = (hue + 35 + (h >>> 9) % 120) % 360;
    var dark = ((h >>> 3) % 3) !== 0;
    var c1 = dark ? hsl(hue, 45, 16) : hsl(hue, 55, 86);
    var c2 = dark ? hsl(hue2, 70, 58) : hsl(hue2, 65, 46);
    var c3 = dark ? hsl(hue + 180, 55, 40) : hsl(hue + 180, 50, 66);
    var ink = dark ? '#fbf7ef' : '#16130f';
    var kind = MOTIFS[(h >>> 5) % MOTIFS.length];
    var letter = (t.replace(/^(the|a|an|o|a|os|as|um|uma)\s+/i, '').charAt(0) || '?').toUpperCase();
    var ls = lines(t), size = ls.length > 3 ? 17 : ls.length > 2 ? 20 : 24;
    var text = '';
    ls.forEach(function (l, i) {
      text += '<text x="14" y="' + (300 - 18 - (ls.length - 1 - i) * (size + 4)) + '" font-family="system-ui, -apple-system, \'Segoe UI\', sans-serif" font-size="' + size + '" font-weight="800" fill="' + ink + '">' + esc(l) + '</text>';
    });
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<rect width="200" height="300" fill="' + c1 + '"/>' + motif(kind, r, c1, c2, c3, letter) +
      '<rect y="' + (300 - 30 - ls.length * (size + 4)) + '" width="200" height="' + (40 + ls.length * (size + 4)) + '" fill="' + c1 + '" opacity=".72"/>' + text + '</svg>').replace(/\d+\.\d{2,}/g, function (m) { return (+m).toFixed(1); });
  }

  var api = { svg: svg, hash: hash, lines: lines };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StreamingPoster = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

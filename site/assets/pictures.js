/* The owner's own pictures for titles: shrunk in the browser and kept in its own database (IndexedDB).
   Never uploaded, never fetched from anywhere. */
(function (root) {
  'use strict';
  var DB = 'streaming-pictures', STORE = 'pictures', MAX = 480;
  var cache = {}, ready = null;

  function open() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      try {
        var req = indexedDB.open(DB, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return ready;
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), out = fn(s);
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : true); };
        t.onerror = t.onabort = function () { resolve(null); };
      });
    });
  }

  /* Loads every picture into memory once, so drawing the list stays synchronous. */
  function loadAll() {
    return open().then(function (db) {
      if (!db) return cache;
      return new Promise(function (resolve) {
        var s = db.transaction(STORE, 'readonly').objectStore(STORE), req = s.openCursor();
        req.onsuccess = function () { var c = req.result; if (c) { cache[c.key] = c.value; c.continue(); } else resolve(cache); };
        req.onerror = function () { resolve(cache); };
      });
    });
  }
  function get(id) { return cache[id] || null; }
  function put(id, dataUrl) { cache[id] = dataUrl; return tx('readwrite', function (s) { return s.put(dataUrl, id); }); }
  function remove(id) { delete cache[id]; return tx('readwrite', function (s) { return s.delete(id); }); }
  function all() { var o = {}; Object.keys(cache).forEach(function (k) { o[k] = cache[k]; }); return o; }
  function clear() { cache = {}; return tx('readwrite', function (s) { return s.clear(); }); }

  /* Shrinks an image file to at most 480 px on its longer side, as a JPEG data URL. */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('type')); return; }
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('read')); };
      img.src = url;
    });
  }
  /* Only pictures this page made itself are accepted back from an import. */
  function valid(dataUrl) { return typeof dataUrl === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(dataUrl) && dataUrl.length < 400000; }

  root.StreamingPictures = { loadAll: loadAll, get: get, put: put, remove: remove, all: all, clear: clear, shrink: shrink, valid: valid };
})(typeof globalThis !== 'undefined' ? globalThis : this);

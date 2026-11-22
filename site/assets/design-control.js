/* The "Choose a design" control, on every page: the Design button with its screenshot cards, and the
   select in the footer. The choice is kept in this browser only. "auto" is the home design (The shelf),
   light or dark as the device asks. */
(function () {
  var NAMES = /^(shelf|queue|cards|stubs|list)$/;
  var d = document.getElementById('design');
  var dlg = document.getElementById('design-dialog'), openBtn = document.getElementById('design-open');
  function current() { var v = null; try { v = localStorage.getItem('streaming.design'); } catch (e) {} return v && NAMES.test(v) ? v : 'auto'; }
  function apply(v) {
    var root = document.documentElement;
    if (v === 'auto') root.removeAttribute('data-design'); else root.setAttribute('data-design', v);
    try { if (v === 'auto') localStorage.removeItem('streaming.design'); else localStorage.setItem('streaming.design', v); } catch (e) {}
    if (d) d.value = v;
    mark();
    try { document.dispatchEvent(new CustomEvent('streaming:design', { detail: v })); } catch (e) {}
  }
  function mark() {
    if (!dlg) return;
    var v = current();
    Array.prototype.forEach.call(dlg.querySelectorAll('.design-use'), function (b) {
      var on = b.getAttribute('data-design') === v;
      b.setAttribute('aria-pressed', String(on));
      if (!b.getAttribute('data-label')) b.setAttribute('data-label', b.textContent);
      if (b.getAttribute('data-design') !== 'auto') b.textContent = on ? dlg.getAttribute('data-in-use') || b.getAttribute('data-label') : b.getAttribute('data-label');
    });
  }
  if (d) {
    d.value = current();
    d.addEventListener('change', function () { apply(d.value); });
  }
  if (dlg && openBtn && typeof dlg.showModal === 'function') {
    openBtn.hidden = false;
    openBtn.addEventListener('click', function () { mark(); dlg.showModal(); var on = dlg.querySelector('.design-cards .design-use[aria-pressed="true"]') || dlg.querySelector('.design-cards .design-use'); if (on) on.focus(); });
    Array.prototype.forEach.call(dlg.querySelectorAll('.design-use'), function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-design')); dlg.close(); });
    });
    document.getElementById('design-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { openBtn.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
})();

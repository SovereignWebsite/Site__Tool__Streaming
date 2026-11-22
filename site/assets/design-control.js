/* The "Choose a design" control, on every page. The choice is kept in this browser only.
   "auto" follows the device's light or dark setting. */
(function () {
  var d = document.getElementById('design');
  if (!d) return;
  var stored = null;
  try { stored = localStorage.getItem('streaming.design'); } catch (e) {}
  d.value = stored || 'auto';
  if (!d.value) d.value = 'auto';
  d.addEventListener('change', function () {
    var root = document.documentElement;
    if (d.value === 'auto') root.removeAttribute('data-design'); else root.setAttribute('data-design', d.value);
    try { if (d.value === 'auto') localStorage.removeItem('streaming.design'); else localStorage.setItem('streaming.design', d.value); } catch (e) {}
  });
})();

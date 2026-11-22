/* Applies the chosen design before the page paints. Stored in this browser only. Older design names are forgotten. */
(function () {
  try {
    var d = localStorage.getItem('streaming.design');
    if (d && /^(shelf|queue|cards|stubs|list)$/.test(d)) document.documentElement.setAttribute('data-design', d);
    else if (d) localStorage.removeItem('streaming.design');
  } catch (e) {}
})();

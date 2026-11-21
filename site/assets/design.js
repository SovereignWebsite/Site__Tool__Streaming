/* Applies the chosen design before the page paints. Stored in this browser only. */
(function () {
  try { var d = localStorage.getItem('streaming.design'); if (d && /^(paper|night|cinema|coast|contrast)$/.test(d)) document.documentElement.setAttribute('data-design', d); } catch (e) {}
})();

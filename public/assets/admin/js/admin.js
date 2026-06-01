// Admin dashboard front-end helpers.
// htmx + Alpine are loaded via CDN in the base layout; this file is for small
// shared behaviours. Kept intentionally light for now.
(function () {
  'use strict';

  // Re-render Lucide icons after any htmx content swap (icons in swapped-in
  // partials won't exist until they're injected).
  document.body.addEventListener('htmx:afterSettle', function () {
    if (window.lucide) window.lucide.createIcons();
  });
})();

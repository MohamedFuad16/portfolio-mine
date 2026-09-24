// Starts the app bundle after the prerendered page has painted. On a slow
// phone the 190 KB script otherwise shares the connection with the CSS-inlined
// HTML and fonts and pushes first paint back (and Lighthouse counts it into
// FCP/LCP). scripts/prerender.mjs writes the entry path into data-entry.
(function () {
  var entry = document.currentScript && document.currentScript.getAttribute('data-entry');
  if (!entry) return;
  var start = function () {
    var script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = '';
    script.src = entry;
    document.head.appendChild(script);
  };
  // Wait for the browser to report first contentful paint, so the request can
  // never compete with it. A timer covers browsers without paint timing.
  var started = false;
  var once = function () {
    if (started) return;
    started = true;
    start();
  };
  try {
    new PerformanceObserver(function (list) {
      if (list.getEntriesByName('first-contentful-paint').length) requestAnimationFrame(once);
    }).observe({ type: 'paint', buffered: true });
  } catch (error) {
    /* no paint timing */
  }
  setTimeout(once, 1500);
})();

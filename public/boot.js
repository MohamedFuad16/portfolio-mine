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
  // never compete with it. The fallback is the load event, not a timer: on a
  // slow test machine a 1.5 s timer sometimes fired before first paint, and
  // Lighthouse then counted the whole bundle into FCP and LCP (mobile scores
  // split between ~87 and ~98). A timer remains only without paint timing.
  var started = false;
  var once = function () {
    if (started) return;
    started = true;
    start();
  };
  var observed = false;
  try {
    new PerformanceObserver(function (list) {
      if (list.getEntriesByName('first-contentful-paint').length) requestAnimationFrame(once);
    }).observe({ type: 'paint', buffered: true });
    observed = true;
  } catch (error) {
    /* no paint timing */
  }
  if (observed) {
    // Fallback if FCP is never reported: after load, wait for a frame to be
    // painted (load can come first on a slow CPU). A background tab runs no
    // frames, so the bundle then starts when the tab is shown.
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        setTimeout(once, 0);
      });
    });
  } else {
    setTimeout(once, 1500);
  }
})();

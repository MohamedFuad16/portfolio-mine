// Classic (non-module) script: if the modules never boot (no import maps,
// a blocked file), show the plain fallback message instead of a blank page.
setTimeout(function () {
  if (!document.documentElement.dataset.booted) document.documentElement.dataset.failed = '1';
}, 9000);

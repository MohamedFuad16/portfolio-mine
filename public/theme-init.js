// Runs before the app bundle so the first paint already has the right theme.
// Kept in step with the theme state in src/App.jsx (key 'portfolio-theme').
(function () {
  var theme;
  try {
    theme = window.localStorage.getItem('portfolio-theme');
  } catch (error) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.dataset.theme = theme;
})();

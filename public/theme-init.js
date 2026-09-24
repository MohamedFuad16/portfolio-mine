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

  // The prerendered HTML is English. A Japanese visitor would see it switch
  // language once the app hydrates, so hide the page until then instead
  // (src/App.jsx removes the attribute). Same key and rule as readLocale().
  var locale;
  try {
    locale = window.localStorage.getItem('portfolio-locale');
  } catch (error) {
    locale = null;
  }
  if (locale !== 'en' && locale !== 'ja') {
    locale = (navigator.language || '').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en';
  }
  if (locale === 'ja') document.documentElement.setAttribute('data-hold-prerender', '');
})();

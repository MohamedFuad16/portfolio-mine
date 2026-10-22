import React from 'react';
import { renderToString } from 'react-dom/server';
import App, { ErrorBoundary, projects, HOME_TITLE, projectTitle } from './App';

export { projects, HOME_TITLE, projectTitle };

// Build-time only (scripts/prerender.mjs). Renders the same tree as main.jsx
// in its default state (English, dark) for the given path, `/` or
// `/projects/<slug>`, so crawlers and the first paint get real HTML, and the
// client then hydrates it.
export function render(path = '/') {
  return renderToString(
    <React.StrictMode>
      <ErrorBoundary>
        <App initialPath={path} />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

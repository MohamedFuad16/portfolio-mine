import React from 'react';
import { renderToString } from 'react-dom/server';
import App, { ErrorBoundary } from './App';

// Build-time only (scripts/prerender.mjs). Renders the same tree as main.jsx
// in its default state (English, dark, home route) so crawlers and the first
// paint get real HTML, and the client then hydrates it.
export function render() {
  return renderToString(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

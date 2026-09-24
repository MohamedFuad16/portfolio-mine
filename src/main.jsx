import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App, { ErrorBoundary } from './App';

if (import.meta.env.PROD) {
  inject({ disableAutoTrack: true });
}

// Fast Refresh re-executes this module in development. Reuse the existing root
// so React never mounts a second tree over the first one.
const container = document.getElementById('root');
const tree = (
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
// Production builds ship the page prerendered (scripts/prerender.mjs), so
// attach to that markup instead of replacing it. Dev serves an empty root.
if (!container.__portfolioRoot && container.firstElementChild) {
  container.__portfolioRoot = hydrateRoot(container, tree);
} else {
  container.__portfolioRoot ||= createRoot(container);
  container.__portfolioRoot.render(tree);
}

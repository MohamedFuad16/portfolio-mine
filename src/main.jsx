import React from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App, { ErrorBoundary } from './App';

if (import.meta.env.PROD) {
  inject({ disableAutoTrack: true });
}

// Fast Refresh re-executes this module in development. Reuse the existing root
// so React never mounts a second tree over the first one.
const container = document.getElementById('root');
container.__portfolioRoot ||= createRoot(container);
container.__portfolioRoot.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

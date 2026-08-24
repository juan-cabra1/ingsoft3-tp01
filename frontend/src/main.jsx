import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App.jsx'
import { initSentry } from './lib/sentry'
import { api } from './services/api'

initSentry();

// Catch errors outside React tree
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    col: event.colno,
  });
  api.reportError({
    message: event.message,
    source: event.filename,
    line: event.lineno,
    col: event.colno,
    stack: event.error?.stack || '',
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  console.error('[UnhandledPromise]', reason);
  api.reportError({
    message: reason?.message || String(reason),
    stack: reason?.stack || '',
  });
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

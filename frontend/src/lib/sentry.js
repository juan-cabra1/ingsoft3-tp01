import * as Sentry from '@sentry/react';

// A front-end DSN is public by design: it only lets the browser SEND events, it cannot read them.
// It lives in the code because the image is built once and runs unchanged in QA and production;
// VITE_SENTRY_DSN still overrides it at build time. Events are told apart by `environment`.
const DEFAULT_DSN = 'https://e088fa2bf171499b2f8596da4d848847@o4512319489769472.ingest.us.sentry.io/4512319511658496';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN || DEFAULT_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: window.location.hostname, // which site sent it: QA, production or localhost
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 1.0, // small app, free quota is enough: measure every page load
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };

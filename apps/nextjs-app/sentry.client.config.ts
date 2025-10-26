// This file should only be imported on the client side
// Import it dynamically or in a "use client" component

import * as Sentry from "@sentry/nextjs";

if (typeof window !== "undefined") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Disable client-side tracing to prevent trace ID conflicts with OTEL
    // Sentry reuses trace IDs across requests which interferes with OTEL tracing
    // Uncomment the lines below to enable Sentry's full tracing experience
    tracesSampleRate: 0,
    // tracesSampleRate: 1.0,

    // Enable error monitoring
    sendDefaultPii: true,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || "obs-playground@1.0.0",

    // Integrations
    integrations: [
      // Uncomment browserTracingIntegration to enable client-side tracing
      // Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Enable console log integration
    enableLogs: true,

    // Trace propagation - uncomment to connect client spans with backend spans
    // tracePropagationTargets: ["localhost", /^http:\/\/localhost:\d+/],
    // propagateTraceparent: true,

    // Session replay
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

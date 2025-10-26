import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Disable Sentry's automatic OpenTelemetry setup to prevent duplicate registration
  // Custom OTEL setup is handled in src/otel.ts
  skipOpenTelemetrySetup: true,

  // Disable Sentry's native tracing on the server to avoid conflict with OTEL
  // OTEL handles all server-side tracing and sends traces to Sentry via OTLP
  tracesSampleRate: 0,

  // Enable error monitoring
  sendDefaultPii: true,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "obs-playground@1.0.0",

  // Enable console log integration
  enableLogs: true,
});

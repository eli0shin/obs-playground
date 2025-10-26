export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for server-side error monitoring
    // Note: Sentry tracing is disabled (tracesSampleRate: 0) to avoid conflict with OTEL
    await import("../sentry.server.config");

    // Only initialize OTel if NOT using custom server
    // Custom server handles OTel initialization in server.ts
    if (process.env.CUSTOM_SERVER !== "true") {
      await import("./otel");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize Sentry for edge runtime error monitoring
    // Note: Sentry tracing is disabled (tracesSampleRate: 0) to avoid conflict with OTEL
    await import("../sentry.edge.config");
  }
}

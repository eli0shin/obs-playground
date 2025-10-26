"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/browser";

export default function MySentry({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      sendDefaultPii: true,
      release: process.env.NEXT_PUBLIC_APP_VERSION || "obs-playground@1.0.0",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      enableLogs: true,
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", /^http:\/\/localhost:\d+/],
      propagateTraceparent: true, // Enable W3C trace context propagation
      replaysSessionSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
    });
  }, []);

  return <>{children}</>;
}

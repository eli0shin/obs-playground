import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";
import { captureRouterTransitionStart } from "@sentry/nextjs";

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID!,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
  site: "us5.datadoghq.com",
  service: "nextjs-app",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  defaultPrivacyLevel: "mask-user-input",
  plugins: [reactPlugin({ router: false })],
  traceSampleRate: 100,
  propagateTraceBaggage: true,
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
  allowedTracingUrls: ["https://localhost"],
  allowedGraphQlUrls: [
    {
      match: /\/graphql$/,
      trackPayload: true,
      trackResponseErrors: true,
    },
  ],
});

export const onRouterTransitionStart = captureRouterTransitionStart;

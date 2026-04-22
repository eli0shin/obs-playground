import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN ?? "",
  site: "datadoghq.com",
  service: "nextjs-app",
  forwardConsoleLogs: "all",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
});

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID ?? "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN ?? "",
  site: "datadoghq.com",
  service: "nextjs-app",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  defaultPrivacyLevel: "mask-user-input",
  plugins: [reactPlugin({ router: false })],
  traceSampleRate: 100,
  traceContextInjection: "all",
  propagateTraceBaggage: true,
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
  allowedTracingUrls: [
    {
      match: (url: string) => {
        const parsedUrl = new URL(url);
        if (parsedUrl.pathname.startsWith("/_")) {
          return false;
        }
        if (parsedUrl.hostname !== window.location.hostname) {
          return false;
        }
        return true;
      },
      propagatorTypes: ["tracecontext", "datadog"],
    },
  ],
  allowedGraphQlUrls: [
    {
      match: /\/graphql$/,
      trackPayload: true,
      trackResponseErrors: true,
    },
  ],
});

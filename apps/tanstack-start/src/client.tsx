import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

function getRootDomain(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

function matchesTraceDomain(hostname: string) {
  const rootDomain = getRootDomain(window.location.hostname);
  return hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
}

datadogLogs.init({
  clientToken: String(import.meta.env.VITE_DATADOG_CLIENT_TOKEN ?? ""),
  site: "datadoghq.com",
  service: "tanstack-start-app",
  forwardConsoleLogs: "all",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
});

datadogRum.init({
  applicationId: String(import.meta.env.VITE_DATADOG_APP_ID ?? ""),
  clientToken: String(import.meta.env.VITE_DATADOG_CLIENT_TOKEN ?? ""),
  site: "datadoghq.com",
  service: "tanstack-start-app",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  defaultPrivacyLevel: "mask-user-input",
  traceSampleRate: 100,
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
        if (!matchesTraceDomain(parsedUrl.hostname)) {
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

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);

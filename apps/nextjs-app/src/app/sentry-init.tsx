"use client";

import { useEffect } from "react";

export default function SentryInit() {
  useEffect(() => {
    // Dynamically import client config only in browser
    import("../../sentry.client.config");
  }, []);

  return null;
}

"use client";

import NextError from "next/error";
import { useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    datadogRum.addError(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

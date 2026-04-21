"use client";

import { datadogLogs } from "@datadog/browser-logs";
import type { ReactNode } from "react";

type LoggedFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  logMessage: string;
  logAttributes?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
};

export function LoggedForm({
  action,
  logMessage,
  logAttributes,
  className,
  children,
}: LoggedFormProps) {
  const handleSubmit = () => {
    datadogLogs.logger.info(logMessage, logAttributes ?? {});
  };

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

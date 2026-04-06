import { context } from "@opentelemetry/api";
import {
  logs,
  SeverityNumber,
  type AnyValue,
  type AnyValueMap,
} from "@opentelemetry/api-logs";
import pino from "pino";

type LogArgs =
  | [message: string]
  | [message: string, attributes: Record<string, unknown>];

export type Logger = {
  debug: (...args: LogArgs) => void;
  info: (...args: LogArgs) => void;
  warn: (...args: LogArgs) => void;
  error: (...args: LogArgs) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializeValue(value: unknown): AnyValue {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: serializeValue(value.cause),
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue),
      ]),
    );
  }

  return String(value);
}

function normalizeArgs(args: LogArgs): {
  body: string;
  attributes: AnyValueMap;
  exception?: unknown;
} {
  if (args.length === 1) {
    return { body: args[0], attributes: {} };
  }

  const [body, attributes] = args;

  return {
    body,
    attributes: Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        serializeValue(value),
      ]),
    ),
    exception: attributes.err,
  };
}

function createOtelLogger(serviceName: string): Logger {
  const otelLogger = logs.getLogger(serviceName);

  const emit = (
    severityNumber: SeverityNumber,
    severityText: string,
    ...args: LogArgs
  ) => {
    const { body, attributes, exception } = normalizeArgs(args);

    otelLogger.emit({
      severityNumber,
      severityText,
      body,
      attributes,
      exception,
      context: context.active(),
    });
  };

  return {
    debug: (...args) => emit(SeverityNumber.DEBUG, "debug", ...args),
    info: (...args) => emit(SeverityNumber.INFO, "info", ...args),
    warn: (...args) => emit(SeverityNumber.WARN, "warn", ...args),
    error: (...args) => emit(SeverityNumber.ERROR, "error", ...args),
  };
}

function createPinoLogger(serviceName: string): Logger {
  const pinoLogger = pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? "info",
  });

  const callPino = (
    method: "debug" | "info" | "warn" | "error",
    ...args: LogArgs
  ) => {
    if (args.length === 1) {
      pinoLogger[method](args[0]);
      return;
    }

    pinoLogger[method](args[1], args[0]);
  };

  return {
    debug: (...args) => callPino("debug", ...args),
    info: (...args) => callPino("info", ...args),
    warn: (...args) => callPino("warn", ...args),
    error: (...args) => callPino("error", ...args),
  };
}

export function createLogger(serviceName: string): Logger {
  if (process.env.DD_TRACE_ENABLED === "true") {
    return createPinoLogger(serviceName);
  }

  return createOtelLogger(serviceName);
}

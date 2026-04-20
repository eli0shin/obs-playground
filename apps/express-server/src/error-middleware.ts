import type { Request, Response, NextFunction } from "express";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { logger } from "./otel";

function getRoutePath(route: unknown): string | undefined {
  if (
    route &&
    typeof route === "object" &&
    "path" in route &&
    typeof route.path === "string"
  ) {
    return route.path;
  }
  return undefined;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const activeSpan = trace.getActiveSpan();

  logger.error("Unhandled error", {
    err,
    "http.method": req.method,
    "http.path": req.path,
    "http.route": getRoutePath(req.route),
    "http.user_agent": req.get("user-agent"),
    "http.query": req.query,
  });

  activeSpan?.recordException(err);
  activeSpan?.setStatus({
    code: SpanStatusCode.ERROR,
    message: err.message,
  });

  res.status(500).json({
    error: err.message || "Internal server error",
  });
}

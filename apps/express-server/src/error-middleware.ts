import { Request, Response, NextFunction } from "express";
import { trace, SpanStatusCode } from "@opentelemetry/api";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    activeSpan.recordException(err);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
  }

  res.status(500).json({
    error: err.message || "Internal server error",
  });
}

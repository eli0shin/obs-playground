import type { Request, Response, NextFunction } from "express";
import { logger } from "./otel";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    };

    if (res.statusCode >= 500) {
      logger.error("Request failed", log);
    } else if (res.statusCode >= 400) {
      logger.warn("Request client error", log);
    } else {
      logger.info("Request completed", log);
    }
  });

  next();
}

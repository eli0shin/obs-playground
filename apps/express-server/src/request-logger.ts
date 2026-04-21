import type { Request, Response, NextFunction } from "express";
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

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const contentLength = res.getHeader("content-length");
    const log = {
      "http.method": req.method,
      "http.path": req.path,
      "http.route": getRoutePath(req.route),
      "http.status_code": res.statusCode,
      "http.duration_ms": duration,
      "http.user_agent": req.get("user-agent"),
      "http.response_content_length":
        typeof contentLength === "string"
          ? parseInt(contentLength, 10)
          : undefined,
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

import { Request, Response, NextFunction } from "express";
import { trace, Attributes } from "@opentelemetry/api";

export function responseInstrumentation(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body: unknown): Response {
    responseBody = body;
    return originalJson(body);
  };

  res.send = function (body: unknown): Response {
    responseBody = body;
    return originalSend(body);
  };

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      const activeSpan = trace.getActiveSpan();

      activeSpan?.addEvent("error_response", responseBody as Attributes);
    }
  });

  next();
}

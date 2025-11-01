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
      // @ts-expect-error
      responseBody = JSON.parse(responseBody);
      const activeSpan = trace.getActiveSpan();
      if (responseBody && typeof responseBody === "object") {
        if (
          "message" in responseBody &&
          typeof responseBody.message === "string"
        ) {
          activeSpan?.recordException(new Error(responseBody.message));
        } else if (
          "error" in responseBody &&
          typeof responseBody.error === "string"
        ) {
          activeSpan?.recordException(new Error(responseBody.error));
        }

        if ("errors" in responseBody && Array.isArray(responseBody.errors)) {
          responseBody.errors.forEach((error) => {
            activeSpan?.addEvent("error_details", error as Attributes);
          });
        }
      }
    }
  });

  next();
}

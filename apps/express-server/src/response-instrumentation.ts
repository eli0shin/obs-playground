import type { Request, Response, NextFunction } from "express";
import { trace } from "@opentelemetry/api";
import { z } from "zod";

const attributeSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

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
      if (typeof responseBody === "string") {
        try {
          responseBody = JSON.parse(responseBody);
        } catch {
          return;
        }
      }

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
          for (const error of responseBody.errors) {
            const parsed = attributeSchema.safeParse(error);
            if (parsed.success) {
              activeSpan?.addEvent("error_details", parsed.data);
            }
          }
        }
      }
    }
  });

  next();
}

import type { Exception, Span } from "@opentelemetry/api";
import { describe, expect, it } from "vitest";
import { recordExceptionWithCauses } from "./record-exception.js";

function createSpanRecorder() {
  const exceptions: Exception[] = [];
  function returnSpan(this: Span) {
    return this;
  }

  const span = {
    addEvent: returnSpan,
    addLink: returnSpan,
    addLinks: returnSpan,
    end: () => undefined,
    isRecording: () => true,
    recordException: (exception: Exception) => {
      exceptions.push(exception);
    },
    setAttribute: returnSpan,
    setAttributes: returnSpan,
    setStatus: returnSpan,
    spanContext: () => ({
      spanId: "0000000000000000",
      traceFlags: 0,
      traceId: "00000000000000000000000000000000",
    }),
    updateName: returnSpan,
  } satisfies Span;

  return {
    exceptions,
    span,
  };
}

describe("recordExceptionWithCauses", () => {
  it("records the top-level error", () => {
    const { exceptions, span } = createSpanRecorder();
    const error = new Error("top-level");

    recordExceptionWithCauses(span, error);

    expect(exceptions).toEqual([error]);
  });

  it("recursively records error causes in order", () => {
    const { exceptions, span } = createSpanRecorder();
    const rootCause = new Error("root cause");
    const middleCause = new Error("middle cause", { cause: rootCause });
    const error = new Error("top-level", { cause: middleCause });

    recordExceptionWithCauses(span, error);

    expect(exceptions).toEqual([error, middleCause, rootCause]);
  });

  it("ignores non-Error causes", () => {
    const { exceptions, span } = createSpanRecorder();
    const error = new Error("top-level", { cause: "not an error" });

    recordExceptionWithCauses(span, error);

    expect(exceptions).toEqual([error]);
  });

  it("does not throw when span is undefined", () => {
    const rootCause = new Error("root cause");
    const error = new Error("top-level", { cause: rootCause });

    expect(() => recordExceptionWithCauses(undefined, error)).not.toThrow();
  });
});

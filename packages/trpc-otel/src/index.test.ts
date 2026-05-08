import type { Context, Span, SpanOptions, Tracer } from "@opentelemetry/api";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tracing } from "./index.js";

type SpanCallback<T> = (span: Span) => T;

function createSpanRecorder() {
  const attributes: Record<string, unknown>[] = [];
  const statuses: unknown[] = [];
  const exceptions: unknown[] = [];
  let ended = false;

  function returnSpan(this: Span) {
    return this;
  }

  const span = {
    addEvent: returnSpan,
    addLink: returnSpan,
    addLinks: returnSpan,
    end: () => {
      ended = true;
    },
    isRecording: () => true,
    recordException: (exception: unknown) => {
      exceptions.push(exception);
    },
    setAttribute: returnSpan,
    setAttributes(this: Span, nextAttributes: Record<string, unknown>) {
      attributes.push(nextAttributes);
      return this;
    },
    setStatus(this: Span, status: unknown) {
      statuses.push(status);
      return this;
    },
    spanContext: () => ({
      spanId: "0000000000000000",
      traceFlags: 0,
      traceId: "00000000000000000000000000000000",
    }),
    updateName: returnSpan,
  } satisfies Span;

  return {
    attributes,
    exceptions,
    get ended() {
      return ended;
    },
    span,
    statuses,
  };
}

function createTracer(span: Span): Tracer {
  function startActiveSpan<F extends SpanCallback<unknown>>(
    name: string,
    fn: F,
  ): ReturnType<F>;
  function startActiveSpan<F extends SpanCallback<unknown>>(
    name: string,
    options: SpanOptions,
    fn: F,
  ): ReturnType<F>;
  function startActiveSpan<F extends SpanCallback<unknown>>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: F,
  ): ReturnType<F>;
  function startActiveSpan<F extends SpanCallback<unknown>>(
    _name: string,
    optionsOrCallback: SpanOptions | F,
    contextOrCallback?: Context | F,
    callback?: F,
  ) {
    const spanCallback =
      typeof optionsOrCallback === "function"
        ? optionsOrCallback
        : typeof contextOrCallback === "function"
          ? contextOrCallback
          : callback;

    if (!spanCallback) {
      throw new Error("startActiveSpan callback is required");
    }

    return spanCallback(span);
  }

  return {
    startActiveSpan,
    startSpan: () => span,
  };
}

describe("tracing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("collects input attributes when the procedure throws", async () => {
    const recorder = createSpanRecorder();
    const error = new Error("procedure failed");

    vi.spyOn(trace, "getTracer").mockReturnValue(createTracer(recorder.span));

    const middleware = tracing({ collectInput: true });

    await expect(
      middleware({
        batchIndex: 0,
        ctx: {},
        getRawInput: async () => ({ id: "recipe-1" }),
        input: {},
        meta: undefined,
        next: async () => {
          throw error;
        },
        path: "recipe.byId",
        signal: undefined,
        type: "query",
      }),
    ).rejects.toThrow(error);

    expect(recorder.attributes).toContainEqual({ "input.id": "recipe-1" });
    expect(recorder.statuses).toContainEqual({
      code: SpanStatusCode.ERROR,
      message: "procedure failed",
    });
    expect(recorder.exceptions).toEqual([error]);
    expect(recorder.ended).toBe(true);
  });
});

# @obs-playground/trpc-otel

tRPC v11 OpenTelemetry middleware for this repo.

This package started as a fork of the tRPC middleware from [`@baselime/node-opentelemetry`](https://github.com/baselime/node-opentelemetry/blob/main/src/trpc.ts). The Baselime version gave us a useful baseline, but we maintain this package because we need behavior that the original middleware does not provide.

## Features

- tRPC v11 middleware without legacy v10 compatibility paths
- Server spans named from the tRPC procedure type and path
- `trpc.path`, `trpc.type`, and `http.route` span attributes
- Span status tracking for failed tRPC procedures
- Exception recording for failed tRPC procedures
- Recursive `Error.cause` exception recording via `@obs-playground/otel`
- Optional flattened input attributes with `collectInput`

## Usage

```ts
import { initTRPC } from "@trpc/server";
import { tracing } from "@obs-playground/trpc-otel";

const t = initTRPC.create();

export const publicProcedure = t.procedure.use(
  tracing({ collectInput: true }),
);
```

## What It Records

Each procedure gets a server span named from the tRPC procedure type and path:

```txt
<procedure type> <procedure path>
```

The span includes:

- `trpc.path`
- `trpc.type`
- `http.route`
- flattened input attributes when `collectInput` is enabled

When a procedure returns an error result, the middleware marks the span as errored and records the exception with recursive `Error.cause` support via `@obs-playground/otel`.

In other words, this middleware tracks span status and errors for tRPC procedure failures instead of relying only on generic HTTP spans.

## Options

```ts
type TracingOptions = {
  collectInput?: boolean;
};
```

`collectInput` defaults to `false`.

## Why This Exists

The upstream Baselime middleware is intentionally small. We need tighter tRPC v11 support, span names based on the tRPC path, explicit span status/error tracking, and recursive cause recording for errors. This package is where those repo-specific requirements live.

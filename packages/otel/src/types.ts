import type { NodeSDK } from "@opentelemetry/sdk-node";
import type { InstrumentationConfigMap } from "@opentelemetry/auto-instrumentations-node";
import type { Tracer } from "dd-trace";

export type OtelConfig = {
  serviceName: string;
  instrumentations?: InstrumentationConfigMap;
};

export type OtelResult = {
  sdk: NodeSDK | Tracer;
};

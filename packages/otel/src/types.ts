import type { NodeSDK } from "@opentelemetry/sdk-node";
import type { InstrumentationConfigMap } from "@opentelemetry/auto-instrumentations-node";

export type OtelConfig = {
  serviceName: string;
  instrumentations?: InstrumentationConfigMap;
};

export type OtelResult = {
  sdk: NodeSDK;
};

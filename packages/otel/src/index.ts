import { metrics } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  CompositePropagator,
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
} from "@opentelemetry/core";
import tracer from "dd-trace";
import {
  createSpanProcessors,
  createLogProcessors,
  createMetricReaders,
} from "./exporters.js";
import type { OtelConfig, OtelResult } from "./types.js";

export function initializeOtel(config: OtelConfig): OtelResult {
  const { serviceName, instrumentations = {} } = config;

  // Check if Datadog native tracer is enabled
  if (process.env.DD_TRACE_ENABLED === "true") {
    const ddServiceName = `dd-${serviceName}`;
    const ddTracer = tracer.init({
      service: ddServiceName,
      hostname: process.env.DD_AGENT_HOST || "localhost",
      port: process.env.DD_TRACE_AGENT_PORT || "8126",
    });

    console.log(
      `Datadog native tracer (dd-trace) initialized for service: ${ddServiceName}`,
    );

    return { sdk: ddTracer };
  }

  // Standard OpenTelemetry initialization
  const spanProcessors = createSpanProcessors();
  const logRecordProcessors = createLogProcessors();
  const metricReaders = createMetricReaders();

  // Create MeterProvider with all metric readers for multi-backend support
  const meterProvider = new MeterProvider({
    readers: metricReaders,
  });

  // Set global meter provider
  metrics.setGlobalMeterProvider(meterProvider);

  const sdk = new NodeSDK({
    serviceName,
    spanProcessors,
    logRecordProcessors,
    textMapPropagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
      ],
    }),
    spanLimits: {
      attributeValueLengthLimit: 1024, // Limit attribute value length
      attributeCountLimit: 64, // Limit number of attributes per span
    },
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
        ...instrumentations,
      }),
    ],
  });

  sdk.start();

  console.log(`OpenTelemetry initialized for service: ${serviceName}`);

  return { sdk };
}

export type { OtelConfig, OtelResult } from "./types.js";

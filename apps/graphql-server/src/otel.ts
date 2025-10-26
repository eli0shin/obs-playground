import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor, SpanProcessor } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from "@opentelemetry/core";

// Enable error logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

// Batch processor configuration to prevent payload size errors
const batchConfig = {
  maxExportBatchSize: 50, // Reduced from default 512
  maxQueueSize: 500, // Reduced from default 2048
  scheduledDelayMillis: 5000, // Export every 5 seconds
};

// Configure exporters
const createSpanProcessors = (): SpanProcessor[] => {
  const processors = [
    // Honeycomb exporter
    ...(process.env.HONEYCOMB_API_KEY && process.env.HONEYCOMB_ENDPOINT
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: `${process.env.HONEYCOMB_ENDPOINT}/v1/traces`,
              headers: {
                "x-honeycomb-team": process.env.HONEYCOMB_API_KEY,
              },
            }),
            batchConfig
          ),
        ]
      : []),

    // Grafana exporter
    ...(process.env.GRAFANA_OTLP_ENDPOINT && process.env.GRAFANA_OTLP_AUTH
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/traces`,
              headers: {
                Authorization: process.env.GRAFANA_OTLP_AUTH,
              },
            }),
            batchConfig
          ),
        ]
      : []),

    // Sentry exporter
    ...(process.env.SENTRY_OTLP_ENDPOINT && process.env.SENTRY_AUTH
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: process.env.SENTRY_OTLP_ENDPOINT,
              headers: {
                "x-sentry-auth": process.env.SENTRY_AUTH,
              },
            }),
            batchConfig
          ),
        ]
      : []),
  ];

  return processors;
};

const spanProcessors = createSpanProcessors();

const sdk = new NodeSDK({
  serviceName: "graphql-server",
  spanProcessors,
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
      // we recommend disabling fs autoinstrumentation since it can be noisy
      // and expensive during startup
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-graphql": {
        ignoreTrivialResolveSpans: true,
        depth: 2,
      },
    }),
  ],
});

sdk.start();

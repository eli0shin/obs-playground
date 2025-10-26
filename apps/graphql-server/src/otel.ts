import { diag, DiagConsoleLogger, DiagLogLevel, metrics, trace, context } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import {
  BatchSpanProcessor,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { BatchLogRecordProcessor, LogRecordProcessor } from "@opentelemetry/sdk-logs";
import { MeterProvider, PeriodicExportingMetricReader, MetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  CompositePropagator,
  W3CTraceContextPropagator,
  W3CBaggagePropagator,
} from "@opentelemetry/core";

// Enable error logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

// Batch processor configuration to prevent payload size errors
const batchConfig = {
  maxExportBatchSize: 50, // Reduced from default 512
  maxQueueSize: 500, // Reduced from default 2048
  scheduledDelayMillis: 5000, // Export every 5 seconds
};

// Configure trace exporters
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
            batchConfig,
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
            batchConfig,
          ),
        ]
      : []),

    // Sentry exporter
    ...(process.env.SENTRY_OTLP_ENDPOINT && process.env.SENTRY_AUTH
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: `${process.env.SENTRY_OTLP_ENDPOINT}/v1/traces`,
              headers: {
                "x-sentry-auth": process.env.SENTRY_AUTH,
              },
            }),
            batchConfig,
          ),
        ]
      : []),
  ];

  return processors;
};

// Configure log exporters
const createLogProcessors = (): LogRecordProcessor[] => {
  const processors = [
    // Honeycomb exporter
    ...(process.env.HONEYCOMB_API_KEY && process.env.HONEYCOMB_ENDPOINT
      ? [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `${process.env.HONEYCOMB_ENDPOINT}/v1/logs`,
              headers: {
                "x-honeycomb-team": process.env.HONEYCOMB_API_KEY,
              },
            })
          ),
        ]
      : []),

    // Grafana exporter
    ...(process.env.GRAFANA_OTLP_ENDPOINT && process.env.GRAFANA_OTLP_AUTH
      ? [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/logs`,
              headers: {
                Authorization: process.env.GRAFANA_OTLP_AUTH,
              },
            })
          ),
        ]
      : []),

    // Sentry exporter
    ...(process.env.SENTRY_OTLP_ENDPOINT && process.env.SENTRY_AUTH
      ? [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `${process.env.SENTRY_OTLP_ENDPOINT}/v1/logs`,
              headers: {
                "x-sentry-auth": process.env.SENTRY_AUTH,
              },
            })
          ),
        ]
      : []),
  ];

  return processors;
};

// Configure metric exporters
const createMetricReaders = (): MetricReader[] => {
  const readers = [
    // Honeycomb exporter
    ...(process.env.HONEYCOMB_API_KEY && process.env.HONEYCOMB_ENDPOINT
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: `${process.env.HONEYCOMB_ENDPOINT}/v1/metrics`,
              headers: {
                "x-honeycomb-team": process.env.HONEYCOMB_API_KEY,
              },
            }),
            exportIntervalMillis: 60000, // Export every 60 seconds
          }),
        ]
      : []),

    // Grafana exporter
    ...(process.env.GRAFANA_OTLP_ENDPOINT && process.env.GRAFANA_OTLP_AUTH
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/metrics`,
              headers: {
                Authorization: process.env.GRAFANA_OTLP_AUTH,
              },
            }),
            exportIntervalMillis: 60000,
          }),
        ]
      : []),

    // Note: Sentry does not support OTLP metrics, only traces
  ];

  return readers;
};

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
  serviceName: "graphql-server",
  spanProcessors,
  logRecordProcessors,
  textMapPropagator: new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
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
        depth: 1,
      },
    }),
  ],
});

sdk.start();

// Bridge console logs to OpenTelemetry logs
const logger = logs.getLogger("graphql-server", "1.0.0");

// Store original console methods
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalLog = console.log;
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalInfo = console.info;
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalWarn = console.warn;
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalError = console.error;
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalDebug = console.debug;

// Helper to emit log records
function emitLogRecord(severityNumber: SeverityNumber, severityText: string, ...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const body = args.map((arg: any) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  const activeSpan = trace.getActiveSpan();
  const spanContext = activeSpan?.spanContext();

  logger.emit({
    severityNumber,
    severityText,
    body,
    context: context.active(),
    attributes: {
      ...(spanContext && {
        'trace_id': spanContext.traceId,
        'span_id': spanContext.spanId,
      }),
    },
  });
}

// Override console methods
console.log = function(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalLog.call(console, ...args);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  emitLogRecord(SeverityNumber.INFO, 'INFO', ...args);
};

console.info = function(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalInfo.call(console, ...args);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  emitLogRecord(SeverityNumber.INFO, 'INFO', ...args);
};

console.warn = function(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalWarn.call(console, ...args);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  emitLogRecord(SeverityNumber.WARN, 'WARN', ...args);
};

console.error = function(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalError.call(console, ...args);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  emitLogRecord(SeverityNumber.ERROR, 'ERROR', ...args);
};

console.debug = function(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  originalDebug.call(console, ...args);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  emitLogRecord(SeverityNumber.DEBUG, 'DEBUG', ...args);
};

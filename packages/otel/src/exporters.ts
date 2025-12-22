import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import {
  BatchSpanProcessor,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  BatchLogRecordProcessor,
  LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { ConsoleLogRecordExporter } from "@opentelemetry/sdk-logs";
import {
  PeriodicExportingMetricReader,
  MetricReader,
} from "@opentelemetry/sdk-metrics";

// Batch processor configuration to prevent payload size errors
const batchConfig = {
  maxExportBatchSize: 50, // Reduced from default 512
  maxQueueSize: 500, // Reduced from default 2048
  scheduledDelayMillis: 5000, // Export every 5 seconds
};

// Configure trace exporters
export function createSpanProcessors(): SpanProcessor[] {
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

    // Datadog exporter
    ...(process.env.DATADOG_OTLP_ENDPOINT
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: `${process.env.DATADOG_OTLP_ENDPOINT}/v1/traces`,
            }),
            batchConfig,
          ),
        ]
      : []),

    // ClickStack exporter
    ...(process.env.CLICKSTACK_OTLP_ENDPOINT
      ? [
          new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: `${process.env.CLICKSTACK_OTLP_ENDPOINT}/v1/traces`,
              headers: {
                "authorization": process.env.CLICKSTACK_API_KEY || "",
              },
            }),
            batchConfig,
          ),
        ]
      : []),

    // Console exporter for local debugging
    ...(process.env.OTEL_EXPORTER_CONSOLE
      ? [new BatchSpanProcessor(new ConsoleSpanExporter(), batchConfig)]
      : []),
  ];

  return processors;
}

// Configure log exporters
export function createLogProcessors(): LogRecordProcessor[] {
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
            }),
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
            }),
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
            }),
          ),
        ]
      : []),

    // Datadog exporter
    ...(process.env.DATADOG_OTLP_ENDPOINT
      ? [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `${process.env.DATADOG_OTLP_ENDPOINT}/v1/logs`,
            }),
          ),
        ]
      : []),

    // ClickStack exporter
    ...(process.env.CLICKSTACK_OTLP_ENDPOINT
      ? [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `${process.env.CLICKSTACK_OTLP_ENDPOINT}/v1/logs`,
              headers: {
                "authorization": process.env.CLICKSTACK_API_KEY || "",
              },
            }),
          ),
        ]
      : []),

    // Console exporter for local debugging
    ...(process.env.OTEL_EXPORTER_CONSOLE
      ? [new BatchLogRecordProcessor(new ConsoleLogRecordExporter())]
      : []),
  ];

  return processors;
}

// Configure metric exporters
export function createMetricReaders(): MetricReader[] {
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

    // Datadog exporter
    ...(process.env.DATADOG_OTLP_ENDPOINT
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: `${process.env.DATADOG_OTLP_ENDPOINT}/v1/metrics`,
            }),
            exportIntervalMillis: 60000,
          }),
        ]
      : []),

    // ClickStack exporter
    ...(process.env.CLICKSTACK_OTLP_ENDPOINT
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: `${process.env.CLICKSTACK_OTLP_ENDPOINT}/v1/metrics`,
              headers: {
                "authorization": process.env.CLICKSTACK_API_KEY || "",
              },
            }),
            exportIntervalMillis: 60000,
          }),
        ]
      : []),

    // Note: Sentry does not support OTLP metrics, only traces
  ];

  return readers;
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLogProcessors,
  createMetricReaders,
  createSpanProcessors,
} from "./exporters.js";

type ExporterCalls = {
  grpcLogs: unknown[];
  grpcMetrics: unknown[];
  grpcTraces: unknown[];
  httpLogs: unknown[];
  httpMetrics: unknown[];
  httpTraces: unknown[];
  protoLogs: unknown[];
  protoMetrics: unknown[];
  protoTraces: unknown[];
};

const exporterCalls = vi.hoisted<ExporterCalls>(() => ({
  grpcLogs: [],
  grpcMetrics: [],
  grpcTraces: [],
  httpLogs: [],
  httpMetrics: [],
  httpTraces: [],
  protoLogs: [],
  protoMetrics: [],
  protoTraces: [],
}));

vi.mock("@opentelemetry/exporter-trace-otlp-http", () => ({
  OTLPTraceExporter: vi.fn(function OTLPTraceExporter(config: unknown) {
    exporterCalls.httpTraces.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-trace-otlp-proto", () => ({
  OTLPTraceExporter: vi.fn(function OTLPTraceExporter(config: unknown) {
    exporterCalls.protoTraces.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-trace-otlp-grpc", () => ({
  OTLPTraceExporter: vi.fn(function OTLPTraceExporter(config: unknown) {
    exporterCalls.grpcTraces.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-logs-otlp-http", () => ({
  OTLPLogExporter: vi.fn(function OTLPLogExporter(config: unknown) {
    exporterCalls.httpLogs.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-logs-otlp-proto", () => ({
  OTLPLogExporter: vi.fn(function OTLPLogExporter(config: unknown) {
    exporterCalls.protoLogs.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-logs-otlp-grpc", () => ({
  OTLPLogExporter: vi.fn(function OTLPLogExporter(config: unknown) {
    exporterCalls.grpcLogs.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-http", () => ({
  OTLPMetricExporter: vi.fn(function OTLPMetricExporter(config: unknown) {
    exporterCalls.httpMetrics.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-proto", () => ({
  OTLPMetricExporter: vi.fn(function OTLPMetricExporter(config: unknown) {
    exporterCalls.protoMetrics.push(config);
  }),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-grpc", () => ({
  OTLPMetricExporter: vi.fn(function OTLPMetricExporter(config: unknown) {
    exporterCalls.grpcMetrics.push(config);
  }),
}));

const exporterEnvironmentVariables = [
  "CLICKSTACK_API_KEY",
  "CLICKSTACK_OTLP_ENDPOINT",
  "DATADOG_OTLP_ENDPOINT",
  "DATADOG_OTLP_PROTOCOL",
  "GRAFANA_OTLP_AUTH",
  "GRAFANA_OTLP_ENDPOINT",
  "HONEYCOMB_API_KEY",
  "HONEYCOMB_ENDPOINT",
  "OTEL_EXPORTER_CONSOLE",
] as const;

beforeEach(() => {
  for (const calls of Object.values(exporterCalls)) {
    calls.length = 0;
  }

  for (const variable of exporterEnvironmentVariables) {
    vi.stubEnv(variable, undefined);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function createDatadogExporters() {
  createSpanProcessors();
  createLogProcessors();
  createMetricReaders();
}

describe("Datadog OTLP exporters", () => {
  it("defaults to HTTP/protobuf exporters with HTTP signal paths", () => {
    vi.stubEnv("DATADOG_OTLP_ENDPOINT", "http://datadog-agent:4318");

    createDatadogExporters();

    expect(exporterCalls.protoTraces).toEqual([
      { url: "http://datadog-agent:4318/v1/traces" },
    ]);
    expect(exporterCalls.protoLogs).toEqual([
      { url: "http://datadog-agent:4318/v1/logs" },
    ]);
    expect(exporterCalls.protoMetrics).toEqual([
      { url: "http://datadog-agent:4318/v1/metrics" },
    ]);
    expect(exporterCalls.httpTraces).toHaveLength(0);
    expect(exporterCalls.httpLogs).toHaveLength(0);
    expect(exporterCalls.httpMetrics).toHaveLength(0);
    expect(exporterCalls.grpcTraces).toHaveLength(0);
    expect(exporterCalls.grpcLogs).toHaveLength(0);
    expect(exporterCalls.grpcMetrics).toHaveLength(0);
  });

  it("uses gRPC exporters with the unchanged base endpoint", () => {
    vi.stubEnv("DATADOG_OTLP_ENDPOINT", "http://datadog-agent:4317");
    vi.stubEnv("DATADOG_OTLP_PROTOCOL", "grpc");

    createDatadogExporters();

    expect(exporterCalls.grpcTraces).toEqual([
      { url: "http://datadog-agent:4317" },
    ]);
    expect(exporterCalls.grpcLogs).toEqual([
      { url: "http://datadog-agent:4317" },
    ]);
    expect(exporterCalls.grpcMetrics).toEqual([
      { url: "http://datadog-agent:4317" },
    ]);
    expect(exporterCalls.httpTraces).toHaveLength(0);
    expect(exporterCalls.httpLogs).toHaveLength(0);
    expect(exporterCalls.httpMetrics).toHaveLength(0);
    expect(exporterCalls.protoTraces).toHaveLength(0);
    expect(exporterCalls.protoLogs).toHaveLength(0);
    expect(exporterCalls.protoMetrics).toHaveLength(0);
  });

  it("keeps other backends on HTTP when Datadog uses gRPC", () => {
    vi.stubEnv("DATADOG_OTLP_ENDPOINT", "http://datadog-agent:4317");
    vi.stubEnv("DATADOG_OTLP_PROTOCOL", "grpc");
    vi.stubEnv("HONEYCOMB_API_KEY", "honeycomb-key");
    vi.stubEnv("HONEYCOMB_ENDPOINT", "https://honeycomb.example");
    vi.stubEnv("GRAFANA_OTLP_AUTH", "Basic grafana-token");
    vi.stubEnv("GRAFANA_OTLP_ENDPOINT", "https://grafana.example");
    vi.stubEnv("CLICKSTACK_API_KEY", "clickstack-key");
    vi.stubEnv("CLICKSTACK_OTLP_ENDPOINT", "https://clickstack.example");

    createDatadogExporters();

    expect(exporterCalls.httpTraces).toEqual([
      {
        headers: { "x-honeycomb-team": "honeycomb-key" },
        url: "https://honeycomb.example/v1/traces",
      },
      {
        headers: { Authorization: "Basic grafana-token" },
        url: "https://grafana.example/v1/traces",
      },
      {
        headers: { authorization: "clickstack-key" },
        url: "https://clickstack.example/v1/traces",
      },
    ]);
    expect(exporterCalls.httpLogs).toEqual([
      {
        headers: { "x-honeycomb-team": "honeycomb-key" },
        url: "https://honeycomb.example/v1/logs",
      },
      {
        headers: { Authorization: "Basic grafana-token" },
        url: "https://grafana.example/v1/logs",
      },
      {
        headers: { authorization: "clickstack-key" },
        url: "https://clickstack.example/v1/logs",
      },
    ]);
    expect(exporterCalls.httpMetrics).toEqual([
      {
        headers: { "x-honeycomb-team": "honeycomb-key" },
        url: "https://honeycomb.example/v1/metrics",
      },
      {
        headers: { Authorization: "Basic grafana-token" },
        url: "https://grafana.example/v1/metrics",
      },
      {
        headers: { authorization: "clickstack-key" },
        url: "https://clickstack.example/v1/metrics",
      },
    ]);
    expect(exporterCalls.protoTraces).toHaveLength(0);
    expect(exporterCalls.protoLogs).toHaveLength(0);
    expect(exporterCalls.protoMetrics).toHaveLength(0);
  });

  it("rejects unsupported protocols", () => {
    vi.stubEnv("DATADOG_OTLP_ENDPOINT", "http://datadog-agent:4317");
    vi.stubEnv("DATADOG_OTLP_PROTOCOL", "http/json");

    expect(() => {
      const processors = createSpanProcessors();
      expect(processors).toHaveLength(0);
    }).toThrow(
      'Invalid DATADOG_OTLP_PROTOCOL "http/json". Expected "http/protobuf" or "grpc".',
    );
  });
});

/* instrumentation.ts */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

//import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

export class Instrumentation {
  private sdk: NodeSDK;

  constructor() {
    this.sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: "http://localhost:4318/v1/traces",
      }),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "pepr-istio-module",
        [SemanticResourceAttributes.SERVICE_VERSION]: "0.2.0",
      }),
    });
  }

  start() {
    this.sdk.start();
  }

  // Optional: You might want to add a method to stop the SDK
  stop() {
    this.sdk.shutdown();
  }
}

import { OTLPTraceExporter as OTLPTraceExporterGRPC } from "@opentelemetry/exporter-trace-otlp-grpc";

export class InstrumentationGRPC {
  private sdk: NodeSDK;

  constructor() {
    this.sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporterGRPC({
        //this is default url: "http://localhost:4317",
      }),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "pepr-istio-module",
        [SemanticResourceAttributes.SERVICE_VERSION]: "0.2.0",
      }),
    });
  }

  start() {
    this.sdk.start();
  }

  // Optional: You might want to add a method to stop the SDK
  stop() {
    this.sdk.shutdown();
  }
}

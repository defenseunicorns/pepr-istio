import {
  serviceToVirtualService,
  extractPort,
} from "./service-to-virtualservice";
import { kind } from "pepr";
import { expect, test } from "@jest/globals";

test("extractPort should return undefined when no valid ports", () => {
  const service: kind.Service = {
    spec: {
      ports: [{ port: 8080, protocol: "TCP" }],
    },
  };
  const port = extractPort(service);
  expect(port).toBe(undefined);
});

test("extractPort should return a single valid port", () => {
  const service: kind.Service = {
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  const port = extractPort(service);
  expect(port).toBe(80);
});

test("extractPort should throw an error for multiple valid ports", () => {
  const service: kind.Service = {
    spec: {
      ports: [
        { port: 80, protocol: "TCP" },
        { port: 443, protocol: "TCP" },
      ],
    },
  };
  expect(() => extractPort(service)).toThrowError(
    "Ambiguous ports: More than one TCP port 80 or 443 is specified",
  );
});

test("serviceToVirtualService should return a valid VirtualService", () => {
  const service: kind.Service = {
    metadata: {
      name: "test-service",
      uid: "test-uid",
    },
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  const vs = serviceToVirtualService(service, "gateway", "hostname");
  expect(vs.metadata.name).toBe("test-service");
  expect(vs.spec.gateways[0]).toBe("gateway");
  expect(vs.spec.hosts[0]).toBe("hostname");
});

test("serviceToVirtualService should return undefined when no valid ports", () => {
  const service: kind.Service = {
    metadata: {
      name: "test-service",
    },
    spec: {
      ports: [{ port: 8080, protocol: "TCP" }],
    },
  };
  const vs = serviceToVirtualService(service, "gateway", "hostname");
  expect(vs).toBe(undefined);
});

test("serviceToVirtualService should throw an error for missing metadata or spec", () => {
  const service: kind.Service = {
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  expect(() =>
    serviceToVirtualService(service, "gateway", "hostname"),
  ).toThrowError("Invalid V1Service provided");
});

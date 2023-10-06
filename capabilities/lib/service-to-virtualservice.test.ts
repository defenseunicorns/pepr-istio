import { serviceToVirtualService } from "./service-to-virtualservice";
import { kind } from "pepr";
import { expect, test } from "@jest/globals";

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
  const vs = serviceToVirtualService(service, 80, "gateway", "hostname");
  expect(vs.metadata.name).toBe("test-service");
  expect(vs.spec.gateways[0]).toBe("gateway");
  expect(vs.spec.hosts[0]).toBe("hostname");
});

test("serviceToVirtualService should throw an error for missing metadata or spec, or if the expected port is not found", () => {
  const service: kind.Service = {
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  expect(() =>
    serviceToVirtualService(service, undefined, "gateway", "hostname"),
  ).toThrowError("Invalid V1Service provided");
});

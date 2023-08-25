import test from "ava";
import {
  serviceToVirtualService,
  extractPort,
} from "./service-to-virtualservice"; // Replace with the actual import
import { k8s } from "pepr"; // Replace with the actual import

test("extractPort should return undefined when no valid ports", t => {
  const service: k8s.V1Service = {
    spec: {
      ports: [{ port: 8080, protocol: "TCP" }],
    },
  };
  const port = extractPort(service);
  t.is(port, undefined);
});

test("extractPort should return a single valid port", t => {
  const service: k8s.V1Service = {
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  const port = extractPort(service);
  t.is(port, 80);
});

test("extractPort should throw an error for multiple valid ports", t => {
  const service: k8s.V1Service = {
    spec: {
      ports: [
        { port: 80, protocol: "TCP" },
        { port: 443, protocol: "TCP" },
      ],
    },
  };
  const error = t.throws(() => extractPort(service));
  t.is(
    error.message,
    "Ambiguous ports: More than one TCP port 80 or 443 is specified"
  );
});

test("serviceToVirtualService should return a valid VirtualService", t => {
  const service: k8s.V1Service = {
    metadata: {
      name: "test-service",
    },
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  const vs = serviceToVirtualService(service, "gateway", "hostname");
  vs.validate();

  t.is(vs.metadata.name, "test-service");
  t.is(vs.spec.gateways[0], "gateway");
  t.is(vs.spec.hosts[0], "hostname");
});

test("serviceToVirtualService should return undefined when no valid ports", t => {
  const service: k8s.V1Service = {
    metadata: {
      name: "test-service",
    },
    spec: {
      ports: [{ port: 8080, protocol: "TCP" }],
    },
  };
  const vs = serviceToVirtualService(service, "gateway", "hostname");
  t.is(vs, undefined);
});

test("serviceToVirtualService should throw an error for missing metadata or spec", t => {
  const service: k8s.V1Service = {
    spec: {
      ports: [{ port: 80, protocol: "TCP" }],
    },
  };
  const error = t.throws(() =>
    serviceToVirtualService(service, "gateway", "hostname")
  );
  t.is(error.message, "Invalid V1Service provided");
});

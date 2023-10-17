import { ingressToVirtualService } from "./ingress-to-virtualservice";
import { kind } from "pepr";
import { expect, test } from "@jest/globals";

test("ingressToVirtualService should create VirtualService with all fields", () => {
  const ingress: kind.Ingress = {
    metadata: {
      name: "test-ingress",
      annotations: { "pepr.dev/gateway": "custom-gateway" },
      uid: "test-uid",
    },
    spec: {
      rules: [
        {
          host: "example.com",
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix", // include pathType if it is required
                backend: {
                  service: {
                    name: "test-service",
                    port: {
                      name: "http", // Or other appropriate name
                      number: 80,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
  const vs = ingressToVirtualService(ingress);
  expect(vs.metadata.name).toBe("test-ingress");
  expect(vs.spec.gateways[0]).toBe("custom-gateway");
  expect(vs.spec.hosts[0]).toBe("example.com");
  expect(vs.spec.http[0].route[0].destination.host).toBe("test-service");
});

test("ingressToVirtualService should use default gateway when annotation is missing", () => {
  const ingress: kind.Ingress = {
    metadata: {
      name: "test-ingress",
    },
    spec: {
      rules: [],
    },
  };

  const vs = ingressToVirtualService(ingress);
  expect(vs.spec.gateways[0]).toBe("istio-system/tenant");
});

test("ingressToVirtualService should handle ingress without hosts", () => {
  const ingress: kind.Ingress = {
    metadata: {
      name: "test-ingress",
    },
    spec: {
      rules: [],
    },
  };

  const vs = ingressToVirtualService(ingress);
  expect(vs.spec.hosts).toEqual([]);
});

test("ingressToVirtualService should handle ingress without paths", () => {
  const ingress: kind.Ingress = {
    metadata: {
      name: "test-ingress",
    },
    spec: {
      rules: [
        {
          host: "example.com",
          http: {
            paths: [],
          },
        },
      ],
    },
  };

  const vs = ingressToVirtualService(ingress);
  expect(vs.spec.http).toEqual([]);
});

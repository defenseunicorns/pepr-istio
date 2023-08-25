import test from "ava";
import { ingressToVirtualService } from "./ingress-to-virtualservice"; // Replace with the actual import
import { k8s } from "pepr"; // Replace with the actual import

test("ingressToVirtualService should create VirtualService with all fields", t => {
  const ingress: k8s.V1Ingress = {
    metadata: {
      name: "test-ingress",
      annotations: { "pepr.dev/gateway": "custom-gateway" },
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
  vs.validate();
  t.is(vs.metadata.name, "test-ingress");
  t.is(vs.spec.gateways[0], "custom-gateway");
  t.is(vs.spec.hosts[0], "example.com");
  t.is(vs.spec.http[0].route[0].destination.host, "test-service");
});

test("ingressToVirtualService should use default gateway when annotation is missing", t => {
  const ingress: k8s.V1Ingress = {
    metadata: {
      name: "test-ingress",
    },
    spec: {
      rules: [],
    },
  };

  const vs = ingressToVirtualService(ingress);
  t.is(vs.spec.gateways[0], "istio-system/tenant");
});

test("ingressToVirtualService should handle ingress without hosts", t => {
  const ingress: k8s.V1Ingress = {
    metadata: {
      name: "test-ingress",
    },
    spec: {
      rules: [],
    },
  };

  const vs = ingressToVirtualService(ingress);
  t.deepEqual(vs.spec.hosts, []);
});

test("ingressToVirtualService should handle ingress without paths", t => {
  const ingress: k8s.V1Ingress = {
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
  t.deepEqual(vs.spec.http, []);
});

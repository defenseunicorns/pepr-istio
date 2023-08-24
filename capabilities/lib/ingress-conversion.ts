import { k8s, Log } from "pepr";

import {
  VirtualService,
  Gateway,
} from "@kubernetes-models/istio/networking.istio.io/v1beta1";

function parseSelector(text: string) {
  try {
    if (text !== undefined) {
      const obj = JSON.parse(text);
      if ("istio" in obj && typeof obj.istio === "string") {
        return obj;
      }
    }
  } catch (e) {
    Log.info(
      "error (will use the default) parsing ingress gateway selector: " + e
    );
  }
  Log.info("using default ingress gateway selector");
  return { istio: "ingressgateway" };
}

export function ingressToVirtualService(
  ingress: k8s.V1Ingress
): VirtualService {
  const gateway = ingress.metadata?.annotations?.["pepr.dev/gateway"];
  if (gateway === undefined) {
    return null;
  }
  const virtualService = new VirtualService({
    metadata: {
      name: ingress.metadata.name,
      namespace: ingress.metadata.namespace,
    },
    spec: {
      gateways: [gateway],
      hosts: [],
      http: [],
    },
  });

  ingress.spec.rules.forEach(rule => {
    if (rule.host) virtualService.spec.hosts.push(rule.host);
    rule.http.paths.forEach(path => {
      virtualService.spec.http.push({
        route: [
          {
            destination: {
              host: path.backend?.service?.name,
              port: {
                number: path.backend?.service?.port.number,
              },
            },
          },
        ],
      });
    });
  });

  virtualService.validate();
  return virtualService;
}

// this will return a gateway object if neces
export function ingressToGateway(ingress: k8s.V1Ingress): Gateway {
  const gateway = ingress.metadata?.annotations?.["pepr.dev/gateway"];
  if (gateway === undefined) {
    return null;
  }

  // gateway is another namespace
  if (gateway.indexOf("/") > -1) {
    return null;
  }

  const selector = parseSelector(
    ingress.metadata?.annotations?.["pepr.dev/ingress-selector"]
  );

  if (!ingress.spec?.rules || !ingress.spec?.rules[0]?.host) {
    Log.warn(
      "Ingress object is missing host in rules, will not create a gateway"
    );
    return null;
  }

  const host = ingress.spec?.rules[0]?.host;
  if (host.includes("*")) {
    Log.warn(
      "Wildcard hosts are not supported in gateways, will not create a gateway"
    );
    return null;
  }

  const result = new Gateway({
    metadata: {
      name: gateway,
      namespace: ingress.metadata.namespace,
    },
    spec: {
      selector: selector,
      servers: [
        {
          port: {
            number: 443,
            name: "https",
            protocol: "HTTPS",
          },
          hosts: [host],
          tls: {
            mode: "PASSTHROUGH",
          },
        },
      ],
    },
  });
  result.validate();
  return result;
}

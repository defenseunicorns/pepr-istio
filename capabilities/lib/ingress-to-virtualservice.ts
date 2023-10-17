import { kind } from "pepr";
import { VirtualService } from "./virtualservice-type";

export function ingressToVirtualService(
  ingress: kind.Ingress,
  defaultGateway = "istio-system/tenant",
) {
  const gateway =
    ingress.metadata?.annotations?.["pepr.dev/gateway"] || defaultGateway;

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

  if (ingress.metadata?.uid) {
    const ownerReference = {
      apiVersion: ingress.apiVersion,
      uid: ingress.metadata.uid,
      kind: ingress.kind,
      name: ingress.metadata.name,
    };
    virtualService.metadata.ownerReferences = [ownerReference];
  }

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

  return virtualService;
}

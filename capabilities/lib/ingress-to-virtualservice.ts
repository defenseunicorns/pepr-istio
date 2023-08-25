import { k8s } from "pepr";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

export function ingressToVirtualService(
  ingress: k8s.V1Ingress,
  defaultGateway = "istio-system/tenant"
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

import { Capability, RegisterKind, a } from "pepr";
import { K8sAPI } from "./lib/kubernetes-api";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

export class IstioVirtualService extends a.GenericKind {
  spec: VirtualService["spec"];
  status?: VirtualService["status"];
  static apiVersion: VirtualService["apiVersion"];
  static kind: VirtualService["kind"];
}

RegisterKind(IstioVirtualService, {
  group: VirtualService.apiVersion.split("/")[0],
  version: VirtualService.apiVersion.split("/")[1],
  kind: VirtualService.kind,
});

// This capability will only create a gateway if:
// 1. the ingress class's format for namespace is not set (or set to the same namespace as the ingress)
// 2. the ingress class must not have wildcards in it. This will be SNI and needs to be a complete match
//
// If the ingress class's hostname does have a wildcard in it, and the namespace is the same as the ingress, this is an error
function parseIngressClass(
  mynamespace: string,
  input: string
): { createIngress: boolean; gateway: string } {
  const regex = /^pepr-(?:(?<namespace>.+?)\.)?(?<gatewayName>.+)$/;
  const match = input.match(regex);

  if (match) {
    const { namespace, gatewayName } = match.groups;
    if (namespace === undefined || namespace === mynamespace) {
      return {
        createIngress: true,
        gateway: gatewayName,
      };
    } else {
      return {
        createIngress: false,
        gateway: `${namespace}/${gatewayName}`,
      };
    }
  }

  return {
    createIngress: false,
    gateway: undefined,
  };
}

// ingress object will create a virtual service and maybe the gateway
When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    const ingressClass = parseIngressClass(
      ing.Raw.metadata.namespace,
      ing.Raw.spec.ingressClassName
    );
    if (ingressClass.gateway !== undefined) {
      const k8s = new K8sAPI();
      await k8s.labelNamespace(ing.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      // if this is an update, we have the uid already
      if (ing.Raw.metadata.uid !== undefined) {
        try {
          if (ingressClass.createIngress) {
            await k8s.upsertGateway(ing.Raw, ingressClass.gateway);
          }
          await k8s.upsertVirtualService(ing.Raw, ingressClass.gateway);
        } catch (e) {
          console.error("Failed to create or update VirtualService:", e);
        }
      } else {
        // The ingress needs to persist to the control plane so the uid becomes immutable.
        setImmediate(async () => {
          try {
            let counter = 0;
            while (counter++ < 60) {
              const ingress = await k8s.getIngress(
                ing.Raw.metadata.namespace,
                ing.Raw.metadata.name
              );
              if (ingress != undefined) {
                if (ingressClass.createIngress) {
                  await k8s.upsertGateway(ingress, ingressClass.gateway);
                }
                await k8s.upsertVirtualService(ingress, ingressClass.gateway);
                break;
              }
              await delay(1000);
            }
          } catch (e) {
            console.error("Failed to create or update VirtualService:", e);
          }
        });
      }
    }
  });

// temporary until we can have a post persisted builder
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

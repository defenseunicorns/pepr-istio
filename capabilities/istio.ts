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
): { createGateway: boolean; gateway: string } {
  const regex = /^pepr-(?:(?<namespace>.+?)\.)?(?<gatewayName>.+)$/;
  const match = input.match(regex);

  if (match) {
    const { namespace, gatewayName } = match.groups;
    if (namespace === undefined || namespace === mynamespace) {
      return {
        createGateway: true,
        gateway: gatewayName,
      };
    } else {
      return {
        createGateway: false,
        gateway: `${namespace}/${gatewayName}`,
      };
    }
  }

  return {
    createGateway: false,
    gateway: undefined,
  };
}

// TODO: do we want to create a custom resource for pepr for the "state store"

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    // if this object is set to deletion, ignore this
    if (ing.Raw.metadata?.deletionTimestamp !== undefined) {
      return;
    }
    const ingressClass = parseIngressClass(
      ing.Raw.metadata.namespace,
      ing.Raw.spec.ingressClassName
    );
    if (ingressClass.gateway === undefined) {
      return;
    }
    const k8s = new K8sAPI();
    await k8s.labelNamespace(ing.Raw.metadata.namespace, {
      "istio-injection": "enabled",
    });
    // TODO: if at this point in the deployment there are deployments and statefulsets created, they might need to be updated
    try {
      if (ingressClass.createGateway) {
        await k8s.upsertGateway(ing.Raw, ingressClass.gateway);
        ing.SetAnnotation("pepr.dev/istio-gateway", ingressClass.gateway);
      }
      await k8s.upsertVirtualService(ing.Raw, ingressClass.gateway);
      ing.SetAnnotation("pepr.dev/istio-virtualservice", ing.Raw.metadata.name);
    } catch (e) {
      console.error("Failed to create or update VirtualService:", e);
    }
  });

When(a.Ingress)
  .IsDeleted()
  .Then(async ing => {
    const ingress = ing.OldResource;
    const namespace = ingress.metadata.namespace;
    const name = ingress.metadata.name;

    const k8s = new K8sAPI();
    try {
      const ingress = ing.OldResource;
      const gatewayName =
        ingress.metadata?.annotations?.["pepr.dev/istio-gateway"];
      const virtualServiceName =
        ingress.metadata?.annotations?.["pepr.dev/istio-virtualservice"];
      // TODO: unlabel namespace?
      if (gatewayName !== undefined) {
        await k8s.deleteGateway(namespace, gatewayName);
      }
      if (virtualServiceName !== undefined) {
        await k8s.deleteVirtualService(namespace, name);
      }
    } catch (e) {
      console.error("Failed to create or update VirtualService:", e);
    }
  });

import { Capability, a } from "pepr";
import { K8sAPI } from "./lib/kubernetes-api";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});
import {
  ingressToGateway,
  ingressToVirtualService,
} from "./lib/ingress-conversion";

const { When } = Istio;

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    // if this object is set to deletion, ignore this
    if (ing.Raw.metadata?.deletionTimestamp !== undefined) {
      return;
    }
    if (ing.Raw.spec?.ingressClassName !== "pepr-istio") {
      return;
    }
    try {
      const gateway = ingressToGateway(ing.Raw);
      const virtualService = ingressToVirtualService(ing.Raw);

      const k8s = new K8sAPI();
      await k8s.labelNamespace(ing.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      if (gateway !== null) {
        await k8s.upsertGateway(gateway);
        ing.SetAnnotation("pepr.dev/istio-gateway", gateway.metadata.name);
      }

      await k8s.upsertVirtualService(virtualService);
      ing.SetAnnotation("pepr.dev/istio-virtualservice", ing.Raw.metadata.name);

      // TODO: if at this point in the deployment there are deployments and statefulsets created, they might need to be updated
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

    try {
      const k8s = new K8sAPI();
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

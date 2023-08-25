import { Capability, Log, a } from "pepr";
import { ingressToVirtualService } from "./lib/ingress-to-virtualservice";
import { serviceToVirtualService } from "./lib/service-to-virtualservice";
import { K8sAPI } from "./lib/kubernetes-api";
export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

// TODO:
// 1. add deployment rolling.
// 2. add ownerReferences to the VirtualService to manage the lifecycle.

const defaultTenantGateway = "istio-system/tenant";
const defaultDomain = "bigbang.dev";

// TODO: add code to roll deployment

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    if (ing.Raw.spec?.ingressClassName !== "pepr-istio") {
      return;
    }

    try {
      const k8s = new K8sAPI();
      await k8s.labelNamespace(ing.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      const vs = ingressToVirtualService(ing.Raw, defaultTenantGateway);
      if (vs !== undefined) {
        await k8s.upsertVirtualService(vs);
      }
      await k8s.restartAppsWithoutIstioSidecar(ing.Raw.metadata.namespace);
    } catch (err) {
      Log.error(
        `Failed to convert service to virtual service: ${err}`,
        "IngressToVirtualService"
      );
    }
  });

When(a.Service)
  .IsCreatedOrUpdated()
  .Then(async svc => {
    // TODO: update with ownerReferences in Validate and use ownerReferences to manage the lifecycle of the virtualservice
    try {
      const k8s = new K8sAPI();
      await k8s.labelNamespace(svc.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      const vs = serviceToVirtualService(
        svc.Raw,
        defaultTenantGateway,
        `${svc.Raw.metadata.name}.${defaultDomain}`
      );
      if (vs !== undefined) {
        await k8s.upsertVirtualService(vs);
      }

      await k8s.restartAppsWithoutIstioSidecar(svc.Raw.metadata.namespace);
    } catch (err) {
      Log.error(
        `Failed to convert service to virtual service: ${err}`,
        "ServiceToVirtualService"
      );
    }
  });

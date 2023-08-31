import { Capability, a } from "pepr";
import { ingressToVirtualService } from "./lib/ingress-to-virtualservice";
import { serviceToVirtualService } from "./lib/service-to-virtualservice";
import { K8sAPI } from "./lib/kubernetes-api";
export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

// TODO: figure out where to store these defaults
const defaultTenantGateway = "istio-system/tenant";
const defaultDomain = "bigbang.dev";

// TODO: when Watch() exists, use it instead so we know the object is persisted
//       before we try to make it an ownerReference of the children objects
When(a.Ingress)
  .IsCreatedOrUpdated()
  .Validate(async ing => {
    if (ing.Raw.spec?.ingressClassName !== "pepr-istio") {
      return ing.Approve();
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
      return ing.Deny(
        `IngressToVirtualService: Failed to convert service to virtual service: ${err}`,
      );
    }
    return ing.Approve();
  });

When(a.Service)
  .IsCreatedOrUpdated()
  .Validate(async svc => {
    try {
      const k8s = new K8sAPI();
      await k8s.labelNamespace(svc.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      const vs = serviceToVirtualService(
        svc.Raw,
        defaultTenantGateway,
        `${svc.Raw.metadata.name}.${defaultDomain}`,
      );
      if (vs !== undefined) {
        await k8s.upsertVirtualService(vs);
      }

      await k8s.restartAppsWithoutIstioSidecar(svc.Raw.metadata.namespace);
    } catch (err) {
      return svc.Deny(
        `ServiceToVirtualService: Failed to convert service to virtual service: ${err}`,
      );
    }
    return svc.Approve();
  });

import { Capability, a, Log, K8s } from "pepr";
import { ingressToVirtualService } from "./lib/ingress-to-virtualservice";
import { serviceToVirtualService } from "./lib/service-to-virtualservice";
import { K8sAPI } from "./lib/kubernetes-api";
import { VirtualService } from "./lib/types";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

// TODO: put these in the pepr store
// TODO: figure out where to store these defaults
const defaultTenantGateway = "istio-system/tenant";
const defaultDomain = "bigbang.dev";

When(a.Namespace)
  .IsCreated()
  .Watch(async ns => {
    Log.info(`Istio: Namespace ${ns.metadata.name} created`);
  });

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Watch(async ing => {
    if (ing.spec?.ingressClassName !== "pepr-istio") {
      return;
    }

    try {
      await K8sAPI.labelNamespaceForIstio(ing.metadata.namespace);
      const vs = ingressToVirtualService(ing, defaultTenantGateway);
      if (vs !== undefined) {
        await K8s(VirtualService).Create(vs);
      }
      await K8sAPI.restartAppsWithoutIstioSidecar(ing.metadata.namespace);
    } catch (err) {
      Log.error(
        `IngressToVirtualService: Failed to convert service to virtual service: ${err.response}`,
      );
    }
  });


// TODO: validate this even makes sense, possibly populate stuff from the pepr store to generate this properly.
When(a.Service)
  .IsCreatedOrUpdated()
  .WithLabel("pepr.dev/ingress", "true")
  .Watch(async svc => {
    try {
      await K8sAPI.labelNamespaceForIstio(svc.metadata.namespace);
      const vs = serviceToVirtualService(
        svc,
        defaultTenantGateway,
        `${svc.metadata.name}.${defaultDomain}`,
      );
      if (vs !== undefined) {
        await K8s(VirtualService).Apply(vs);
      }
      await K8sAPI.restartAppsWithoutIstioSidecar(svc.metadata.namespace);
    } catch (err) {
      Log.error(
        `ServiceToVirtualService: Failed to convert service to virtual service: ${err}`,
      );
    }
  });

import { Capability, a, Log, K8s } from "pepr";
import { ingressToVirtualService } from "./lib/ingress-to-virtualservice";
import { serviceToVirtualService } from "./lib/service-to-virtualservice";
import { K8sAPI } from "./lib/kubernetes-api";
import { VirtualService } from "./lib/virtualservice-type";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

// TODO: config should come from something external, not hardcoded, TODO:
const config = {
  tenantGateway: "istio-system/tenant",
  domain: "bigbang.dev",
};

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Watch(async ing => {
    if (ing.spec?.ingressClassName !== "pepr-istio") {
      return;
    }
    const logHeader = "pepr-istio:IngressToVirtualService";
    try {
      await K8sAPI.labelNamespaceForIstio(ing.metadata.namespace);
      const gateway = config["tenantGateway"];
      const vs = ingressToVirtualService(ing, gateway);
      if (vs !== undefined) {
        await K8s(VirtualService).Apply(vs);
      }
      await K8sAPI.restartAppsWithoutIstioSidecar(ing.metadata.namespace);
      Log.info(
        `Successfully converted ingress to virtual service: ${ing.metadata.name}`,
        logHeader,
      );
    } catch (err) {
      Log.error(
        `Failed to convert service to virtual service: ${err.data?.message}`,
        logHeader,
      );
    }
  });

// TODO: Validate if this service to VS makes sense.
When(a.Service)
  .IsCreatedOrUpdated()
  .WithLabel("pepr.dev/ingress", "true")
  .Watch(async svc => {
    const logHeader = "pepr-istio:ServiceToVirtualService";

    try {
      await K8sAPI.labelNamespaceForIstio(svc.metadata.namespace);

      const portToExpose = await K8sAPI.findPodContainerPort(svc);
      const vs = serviceToVirtualService(
        svc,
        portToExpose,
        config["tenantGateway"],
        `${svc.metadata.name}.${config["domain"]}`,
      );
      if (vs !== undefined) {
        await K8s(VirtualService).Apply(vs);
      }
      await K8sAPI.restartAppsWithoutIstioSidecar(svc.metadata.namespace);
      Log.info(
        `Successfully converted ingress to virtual service: ${svc.metadata.name}`,
        logHeader,
      );
    } catch (err) {
      Log.error(
        `Failed to convert service to virtual service: ${err.data?.message}`,
        logHeader,
      );
    }
  });

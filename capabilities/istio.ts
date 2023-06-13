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

// ingress object will create a virtual service
When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    const ingressClassName = ing.Raw.spec.ingressClassName;
    if (ingressClassName.startsWith("pepr-")) {
      const gatewayName = ingressClassName.split("-")[1];

      const k8s = new K8sAPI();
      await k8s.labelNamespace(ing.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      // if this is an update, we have the uid already
      if (ing.Raw.metadata.uid !== undefined) {
        try {
          await k8s.upsertVirtualService(ing.Raw, gatewayName);
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
                await k8s.upsertVirtualService(ingress, gatewayName);
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

/* We assume that any virtualService that is created with a populated value in 
vs.Raw.spec.tls[0].match[0].sniHosts requires a corresponding Gateway object for 
TLS passthrough

The relation is one passthrough gateway to one virtual service, meaning multiple hosts or gateways will not be listed in the VirtualService

Things we need from the virtual service in order to properly configure the Gateway 
If the sni is populated capture the 
* spec.gateway 
* spec.hosts

We still need to determine if the passthrough gateway is intended for the admin or tenant IngressGateway
*/

When(IstioVirtualService)
  .IsCreated()
  .Then(async vs => {
    let host;
    let gateway;
    const ns = vs.Raw.metadata.namespace;
    let isPassthrough = false;

    if (vs.Raw.spec.tls) {
      isPassthrough = vs?.Raw?.spec?.tls?.[0]?.match?.[0]?.sniHosts?.length > 0;
      if (isPassthrough) {
        host = vs.Raw.spec.tls[0].match[0].sniHosts[0];

        if (vs?.Raw?.spec?.gateways?.length > 0) {
          gateway = vs.Raw.spec.gateways[0];
        }
      } else {
        // If we get here, it's an invalid virtual service
        console.log("sniHosts is empty");
      }
    }

    if (isPassthrough) {
      // XXX: BDW: TODO: create the gateway object
    }
    console.log("host:" + host);
    console.log("gateway:" + gateway);
    console.log("namespace:" + ns);
    console.log("isPassthrough:" + isPassthrough);
  });

// temporary until we can have a post persisted builder
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

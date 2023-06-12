import { Capability, RegisterKind, a } from "pepr";

import { K8sAPI } from "./lib/kubernetes-api";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = Istio;

export class IstioVirtualService extends a.GenericKind {
  spec:  VirtualService["spec"];
  status?: VirtualService["status"];
  static apiVersion: VirtualService["apiVersion"];
  static kind: VirtualService["kind"];
}

RegisterKind(IstioVirtualService, {
  group: "networking.istio.io",
  version: "v1beta1",
  kind: "VirtualService",
});

// When(a.<Kind>).Is<Event>().Then(change => change.<changes>
When(a.Service)
  .IsCreated()
  .Then(svc => {
    console.log("Service created:", svc);
  });

// Ingress may not be the correct entrypoint for this, but for now it is ok!
When(a.Ingress)
  .IsCreatedOrUpdated()
  .InNamespace('podinfo')
  .Then(async ing => {
    const ingressClassName = ing.Raw.spec.ingressClassName;
    if (ingressClassName .startsWith('pepr-')) {
      const k8s = new K8sAPI();

      const gatewayName = ingressClassName.split('-')[1];

      await k8s.labelNamespace(ing.Raw.metadata.namespace, {
        "istio-injection": "enabled",
      });

      try {
        await k8s.createOrUpdateVirtualService(ing.Raw, gatewayName);
      } catch (e) {
        console.error("Failed to create or update VirtualService:", e);
      }
    }
  });
  
// - create a way to PATCH a virtual service with pepr's fast-json-patch ability
// What would be the right action (and on what resource) to fire off a patch action on an Istio Virtual Service? I have no idea.
When(IstioVirtualService)
  .IsCreated()
  .WithName("Some target VS name?")
  .ThenSet({
    metadata: {
      labels: {
        pepr: "patch it",
      },
      annotations: {
        "pepr.dev": "patched-virtual-service",
      },
    },
  });

// - create a way to delete a virtual service
When(a.Ingress)
  .IsDeleted()
  .InNamespace('podinfo')
  .Then(async ing => {
      try {
        // Can ing be parsed to find associated Istio Virtual Service?
        // Do the API need to be called via the node client in order to delete the VS - or is manipulating objects directly in this action enough?
        const k8s = new K8sAPI();
        k8s.deleteIstioVirtualService();
      } catch (e) {
        console.error("Failed to delete VirtualService:", e);
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
let gateway: string = '';
let host: string = '';
let ns: string = '';
let isPassthrough: boolean = false;
When(IstioVirtualService)
  .IsCreated()
  .Then(async vs => {
    vs.SetLabel("blah","blah")
    isPassthrough = false; 

    if (vs.Raw.spec.tls){
      if (vs.Raw.spec.tls[0].match[0].sniHosts && vs.Raw.spec.tls[0].match[0].sniHosts.length > 0) {

        isPassthrough = true;
        host = vs.Raw.spec.tls[0].match[0].sniHosts[0];
        ns = vs.Raw.metadata.namespace

        if( vs.Raw.spec.gateways && vs.Raw.spec.gateways.length > 0) {
            gateway = vs.Raw.spec.gateways[0];
        }
      } else {
        console.log("sniHosts is empty");
      }
    }
//        let domainX: string =   vs.Raw.spec.tls[0].match[0].sniHosts[0].
    console.log("host:" + host);
    console.log("gateway:" + gateway);
    console.log("namespace:" + ns);
    console.log("isPassthrough:" + isPassthrough);

  });

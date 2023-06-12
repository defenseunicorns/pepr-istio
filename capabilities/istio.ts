import { Capability, a } from "pepr";

import { K8sAPI } from "./vsing";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = Istio;

// When(a.<Kind>).Is<Event>().Then(change => change.<changes>
When(a.Service)
  .IsCreated()
  .Then(svc => {
    console.log("Service created:", svc);
  });

// Ingress may not be the correct entrypoint for this, but for now it is ok!

When(a.Ingress)
  .IsCreatedOrUpdated()
  .InNamespace("podinfo")
  .Then(async ing => {
    const ingressClassName = ing.Raw.spec.ingressClassName;
    if (ingressClassName.startsWith("pepr-")) {
      const k8s = new K8sAPI();

      const gatewayName = ingressClassName.split("-")[1];

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

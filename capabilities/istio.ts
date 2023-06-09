import {
  Capability,
  PeprRequest,
  RegisterKind,
  a,
  fetch,
  fetchStatus,
} from "pepr";

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
  .Then(svc => svc.SetLabel("pepr", "hi-istio"));

// convert ingress to virtual service 
When(a.Ingress)
.IsCreatedOrUpdated()
.InNamespace('pepr-demo')
.Then(async ing => {
  if (ing.Raw.spec.ingressClassName == 'pepr-demo') {
    const k8s = new K8sAPI();

    try {
      await k8s.createOrUpdateVirtualService(ing.Raw);
    } catch (e) {
      console.error("Failed to create or update VirtualService:", e);
    }
  }
});
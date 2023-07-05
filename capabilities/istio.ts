import { Capability, a } from "pepr";
import { createIngress, cleanupIngress } from "./lib/create-ingress";

export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

When(a.Ingress)
  .IsCreated()
  .Then(async ing => {
    if (ing.Raw.spec?.ingressClassName !== "pepr-istio") {
      return;
    }
    createIngress(ing);
  });

When(a.Ingress)
  .IsUpdated()
  .Then(async ing => {
    // if this object is set to deletion, ignore this
    if (ing.Raw.metadata?.deletionTimestamp !== undefined) {
      return;
    }
    // TODO: Once the store is out, we'll store this info in there, and be able to validate what could be
    // mutated and what will need to change
    cleanupIngress(ing.Raw);
    createIngress(ing);
  });

When(a.Ingress)
  .IsDeleted()
  .Then(async ing => {
    if (ing.OldResource.spec?.ingressClassName !== "pepr-istio") {
      return;
    }
    cleanupIngress(ing.OldResource);
  });

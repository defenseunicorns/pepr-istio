import { Capability, Log, a } from "pepr";
import { createIngress, cleanupIngress } from "./lib/create-ingress";
import { convertServiceToVirtualService } from "./lib/service-to-virtualservice";
import { K8sAPI } from "./lib/kubernetes-api";
export const Istio = new Capability({
  name: "istio",
  description: "Istio service mesh capability.",
  namespaces: [],
});

const { When } = Istio;

// TODO: might need to roll the deployment.

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

When(a.Service)
  .IsCreatedOrUpdated()
  .Then(async svc => {
    // XXX: BDW: which gateway to use? also how do we want to construct the hostname?

    // TODO: update with ownerReferences in Validate and use ownerReferences to manage the lifecycle of the virtualservice
    try {
      const vs = convertServiceToVirtualService(
        svc.Raw,
        "istio-system/tenant",
        `${svc.Raw.metadata.name}.bigbang.dev`
      );
      if (vs !== undefined) {
        const k8s = new K8sAPI();
        await k8s.upsertVirtualService(vs);
      }
    } catch (err) {
      Log.error(
        `Failed to convert service to virtual service: ${err}`,
        "ServiceToVirtualService"
      );
    }
  });

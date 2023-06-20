import { Capability, RegisterKind, a } from "pepr";
import { K8sAPI } from "./lib/kubernetes-api";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

// TODO: how do we do metrics with pepr? we can't initialize the webhook here, it will block everything
// TODO: figure out IIFE, also what should be in the core
import { Metrics } from "./lib/metrics";
const metrics = new Metrics();

// XXX: BDW: This creates the exporter. right now very hard coded
import { InstrumentationGRPC } from "./lib/traces";
new InstrumentationGRPC().start();

import { trace } from "@opentelemetry/api";
const tracer = trace.getTracer("pepr-istio-capability");

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

// This capability will only create a gateway if:
// 1. the ingress class's format for namespace is not set (or set to the same namespace as the ingress)
// 2. the ingress class must not have wildcards in it. This will be SNI and needs to be a complete match
//
// If the ingress class's hostname does have a wildcard in it, and the namespace is the same as the ingress, this is an error
function parseIngressClass(
  mynamespace: string,
  input: string
): { createGateway: boolean; gateway: string } {
  const regex = /^pepr-(?:(?<namespace>.+?)\.)?(?<gatewayName>.+)$/;
  const match = input.match(regex);

  if (match) {
    const { namespace, gatewayName } = match.groups;
    if (namespace === undefined || namespace === mynamespace) {
      return {
        createGateway: true,
        gateway: gatewayName,
      };
    } else {
      return {
        createGateway: false,
        gateway: `${namespace}/${gatewayName}`,
      };
    }
  }

  return {
    createGateway: false,
    gateway: undefined,
  };
}

// TODO: do we want to create a custom resource for pepr for the "state store"

const myThingy = metrics.addThingy(
  "create_or_update_ingress",
  "Number of ingress objects created or updated"
);

When(a.Ingress)
  .IsCreatedOrUpdated()
  .Then(async ing => {
    // if this object is set to deletion, ignore this
    if (ing.Raw.metadata?.deletionTimestamp !== undefined) {
      return;
    }
    const ingressClass = parseIngressClass(
      ing.Raw.metadata.namespace,
      ing.Raw.spec.ingressClassName
    );
    if (ingressClass.gateway === undefined) {
      return;
    }

    await metrics.incThingy(myThingy);
    //const span = tracer.startSpan("ingress.CreateOrUpdated");
    await tracer.startActiveSpan("ingress.CreateOrUpdated", async span => {
      span.setAttribute("namespace", ing.Raw.metadata.namespace);
      span.setAttribute("name", ing.Raw.metadata.name);
      span.setAttribute("labels", JSON.stringify(ingressClass));

      // TODO: if at this point in the deployment there are deployments and statefulsets created, they might need to be updated

      const k8s = new K8sAPI(tracer);
      try {
        await k8s.labelNamespace(ing.Raw.metadata.namespace, {
          "istio-injection": "enabled",
        });

        if (ingressClass.createGateway) {
          await k8s.upsertGateway(ing.Raw, ingressClass.gateway);
          ing.SetAnnotation("istio-gateway.pepr.dev", ingressClass.gateway);
        }
        await k8s.upsertVirtualService(ing.Raw, ing.Raw.metadata.name);
        ing.SetAnnotation(
          "istio-virtualservice.pepr.dev",
          ing.Raw.metadata.name
        );
        console.log(
          "annotations: ",
          JSON.stringify(ing.Raw.metadata.annotations, null, 2)
        );
      } catch (e) {
        console.error("Failed to create or update VirtualService:", e);
      } finally {
        span.end();
      }
    });
  });

const myThingyDeleted = metrics.addThingy(
  "delete_ingress",
  "number of times the delete ingress is called"
);

When(a.Ingress)
  .IsDeleted()
  .Then(async ing => {
    const ingress = ing.OldResource;
    const namespace = ingress.metadata.namespace;
    const name = ingress.metadata.name;

    metrics.incThingy(myThingyDeleted);

    await tracer.startActiveSpan("ingress.Deleted", async span => {
      span.setAttribute("namespace", ingress.metadata.namespace);
      span.setAttribute("name", ingress.metadata.name);

      const k8s = new K8sAPI(tracer);
      try {
        const ingress = ing.OldResource;
        const gatewayName =
          ingress.metadata?.annotations?.["istio-gateway.pepr.dev"];
        const virtualServiceName =
          ingress.metadata?.annotations?.["istio-virtualservice.pepr.dev"];
        // TODO: unlabel namespace?
        if (gatewayName !== undefined) {
          await k8s.deleteGateway(namespace, gatewayName);
        }
        if (virtualServiceName !== undefined) {
          await k8s.deleteVirtualService(namespace, name);
        }
      } catch (e) {
        console.error("Failed to create or update VirtualService:", e);
      } finally {
        span.end();
      }
    });
  });

import {
  AppsV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  V1Ingress,
  NetworkingV1Api,
  PatchUtils,
} from "@kubernetes/client-node";
import { PeprRequest } from "pepr";

import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";
import { createPatch } from "rfc6902";

export class K8sAPI {
  k8sApi: CoreV1Api;
  k8sAppsV1Api: AppsV1Api;
  k8sCustomObjectsApi: CustomObjectsApi;
  networkingV1Api: NetworkingV1Api; // or NetworkingV1beta1Api

  constructor() {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(CoreV1Api);
    this.k8sAppsV1Api = kc.makeApiClient(AppsV1Api);
    this.k8sCustomObjectsApi = kc.makeApiClient(CustomObjectsApi);
    this.networkingV1Api = kc.makeApiClient(NetworkingV1Api); // or NetworkingV1beta1Api
  }

  private ingressToVirtualService(
    peprRequest: PeprRequest<V1Ingress>,
    gateway: string
  ): VirtualService {
    const ingress = peprRequest.Raw;
    peprRequest.Request.uid;
    const ownerReference = {
      apiVersion: ingress.apiVersion,
      kind: ingress.kind,
      name: peprRequest.Request.name,
      // XXX: BDW: need the persisted uid, this is the uid of the request
      uid: peprRequest.Request.uid,
    };

    const virtualService = new VirtualService({
      metadata: {
        name: ingress.metadata.name,
        namespace: ingress.metadata.namespace,
        labels: ingress.metadata.labels,
        annotations: ingress.metadata.annotations,
        //ownerReferences: [ownerReference],
      },
      spec: {
        gateways: [gateway],
        hosts: [],
        http: [],
      },
    });

    ingress.spec.rules.forEach(rule => {
      if (rule.host) virtualService.spec.hosts.push(rule.host);
      rule.http.paths.forEach(path => {
        virtualService.spec.http.push({
          match: [
            {
              uri: {
                prefix: path.path,
              },
            },
          ],
          route: [
            {
              destination: {
                host: path.backend?.service?.name,
                port: {
                  number: path.backend?.service?.port.number,
                },
              },
            },
          ],
        });
      });
    });

    virtualService.validate();
    return virtualService;
  }

  async upsertVirtualService(
    peprRequest: PeprRequest<V1Ingress>,
    gateway: string
  ) {
    const virtualService = this.ingressToVirtualService(peprRequest, gateway);

    const group = virtualService.apiVersion.split("/")[0];
    const version = virtualService.apiVersion.split("/")[1];
    const plural = virtualService.kind.toLocaleLowerCase() + "s";

    try {
      const response = await this.k8sCustomObjectsApi.getNamespacedCustomObject(
        group,
        version,
        virtualService.metadata.namespace,
        plural,
        virtualService.metadata.name
      );

      // If the resource exists, update it
      if (response && response.body) {
        const existingObject = new VirtualService(response.body);
        // XXX: BDW: TODO: validate that the existing object's owner reference is me, otherwise throw an error

        let patch = createPatch(existingObject, virtualService);
        // XXX: BDW: only patching the spec. TODO: figure out exactly how to do it.
        patch = patch.filter(operation => operation.path.startsWith("/spec"));
        if (patch.length > 0) {
          await this.k8sCustomObjectsApi.patchNamespacedCustomObject(
            group,
            version,
            virtualService.metadata.namespace,
            plural,
            virtualService.metadata.name,
            patch,
            undefined,
            undefined,
            undefined,
            { headers: { "Content-Type": PatchUtils.PATCH_FORMAT_JSON_PATCH } }
          );
        }
      }
    } catch (error) {
      // If the resource doesn't exist, create it
      if (error.response && error.response.statusCode === 404) {
        await this.k8sCustomObjectsApi.createNamespacedCustomObject(
          group,
          version,
          virtualService.metadata.namespace,
          plural,
          virtualService
        );
      } else {
        throw error;
      }
    }
  }

  // store for notes, delete later: istio-injection=disabled
  async labelNamespace(namespace: string, labels: { [key: string]: string }) {
    const patch = Object.keys(labels).map(key => ({
      op: "add",
      path: `/metadata/labels/${key}`,
      value: labels[key],
    }));

    await this.k8sApi.patchNamespace(
      namespace,
      patch,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { "Content-Type": "application/json-patch+json" } }
    );
  }
}

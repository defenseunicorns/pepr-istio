import {
  AppsV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  V1Ingress,
  NetworkingV1Api,
} from "@kubernetes/client-node";

/*
  TODO: 
  MONDAY 
  - create a way to PATCH a virtual service with pepr's fast-json-patch ability
  - create a way to delete a virtual service  
*/

import { PeprModule, fetchStatus } from "pepr";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

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
    ingress: V1Ingress,
    gateway: string
  ): VirtualService {
    const virtualService = new VirtualService({
      metadata: {
        name: ingress.metadata.name,
        namespace: ingress.metadata.namespace,
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

  async createOrUpdateVirtualService(ingress: V1Ingress, gateway: string) {
    const virtualService = this.ingressToVirtualService(ingress, gateway);

    try {
      // ON MONDAY, lets continue to create a way to PATCH a virtual service with pepr's fast-json-patch ability
      await this.k8sCustomObjectsApi.createNamespacedCustomObject(
        // is there a better way to do this?
        VirtualService.apiVersion.split("/")[0],
        VirtualService.apiVersion.split("/")[1],
        virtualService.metadata.namespace,
        VirtualService.kind.toLocaleLowerCase() + "s",
        virtualService
      );
    } catch (e) {
      if (e.response.body.code === 409) {
        const existingVs =
          await this.k8sCustomObjectsApi.getNamespacedCustomObject(
            VirtualService.apiVersion.split("/")[0],
            VirtualService.apiVersion.split("/")[1],
            virtualService.metadata.namespace,
            VirtualService.kind.toLocaleLowerCase() + "s",
            virtualService.metadata.name
          );

        const temp = new VirtualService(existingVs.body);
      } else {
        console.error(`Failed to replace the custom object: ${e.body.message}`);
      }
      console.log(e);
      console.log(e.response.body.message);
      throw e;
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

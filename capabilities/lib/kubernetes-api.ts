import { k8s } from "pepr";

import {
  VirtualService,
  Gateway,
} from "@kubernetes-models/istio/networking.istio.io/v1beta1";

type K8sModel = {
  apiVersion: string;
  kind: string;
};

function getGroupVersionPlural(model: K8sModel) {
  const [group, version] = model.apiVersion.split("/");
  const plural = model.kind.toLocaleLowerCase() + "s";
  return { group, version, plural };
}

export class K8sAPI {
  k8sApi: k8s.CoreV1Api;
  k8sAppsV1Api: k8s.AppsV1Api;
  k8sCustomObjectsApi: k8s.CustomObjectsApi;
  networkingV1Api: k8s.NetworkingV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    this.k8sCustomObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
    this.networkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);
  }

  async upsertVirtualService(virtualService: VirtualService) {
    const { group, version, plural } = getGroupVersionPlural(VirtualService);
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
        const object = new VirtualService(response.body);
        object.spec = virtualService.spec;

        await this.k8sCustomObjectsApi.replaceNamespacedCustomObject(
          group,
          version,
          virtualService.metadata.namespace,
          plural,
          virtualService.metadata.name,
          object,
          undefined,
          undefined,
          undefined
        );
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

  async getIngress(
    namespace: string,
    name: string
  ): Promise<k8s.V1Ingress | undefined> {
    try {
      const response = await this.networkingV1Api.readNamespacedIngress(
        name,
        namespace
      );
      return response.body;
    } catch (error) {
      if (error.response && error.response.statusCode === 404) {
        return;
      } else {
        throw error;
      }
    }
  }

  async upsertGateway(gateway: Gateway) {
    const { group, version, plural } = getGroupVersionPlural(Gateway);
    try {
      const response = await this.k8sCustomObjectsApi.getNamespacedCustomObject(
        group,
        version,
        gateway.metadata.namespace,
        plural,
        gateway.metadata.name
      );

      // If the resource exists, update it
      if (response && response.body) {
        const existingGateway = new Gateway(response.body);
        existingGateway.spec = gateway.spec;
        await this.k8sCustomObjectsApi.replaceNamespacedCustomObject(
          group,
          version,
          existingGateway.metadata.namespace,
          plural,
          existingGateway.metadata.name,
          existingGateway,
          undefined,
          undefined,
          undefined
        );
      }
    } catch (error) {
      // If the resource doesn't exist, create it
      if (error.response && error.response.statusCode === 404) {
        await this.k8sCustomObjectsApi.createNamespacedCustomObject(
          group,
          version,
          gateway.metadata.namespace,
          plural,
          gateway
        );
      } else {
        throw error;
      }
    }
  }

  private async deleteCustomObject(
    model: K8sModel,
    namespace: string,
    name: string
  ) {
    const { group, version, plural } = getGroupVersionPlural(model);
    try {
      await this.k8sCustomObjectsApi.deleteNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name
      );
    } catch (error) {
      if (error.response && error.response.statusCode !== 404) {
        throw error;
      }
    }
  }

  async deleteVirtualService(namespace: string, name: string) {
    return await this.deleteCustomObject(VirtualService, namespace, name);
  }

  async deleteGateway(namespace: string, name: string) {
    return await this.deleteCustomObject(Gateway, namespace, name);
  }
}

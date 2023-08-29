import { k8s } from "pepr";

import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

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
        virtualService.metadata.name,
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
          undefined,
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
          virtualService,
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
      { headers: { "Content-Type": "application/json-patch+json" } },
    );
  }

  async getIngress(
    namespace: string,
    name: string,
  ): Promise<k8s.V1Ingress | undefined> {
    try {
      const response = await this.networkingV1Api.readNamespacedIngress(
        name,
        namespace,
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

  async checksumDeployment(name: string, namespace: string, checksum: string) {
    const patch = [
      {
        op: "add",
        path: "/spec/template/metadata/annotations/pepr.dev~1checksum",
        value: checksum,
      },
    ];

    await this.k8sAppsV1Api.patchNamespacedDeployment(
      name,
      namespace,
      patch,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { "content-type": "application/json-patch+json" } },
    );
  }

  async deleteVirtualService(namespace: string, name: string) {
    const { group, version, plural } = getGroupVersionPlural(VirtualService);
    try {
      await this.k8sCustomObjectsApi.deleteNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name,
      );
    } catch (error) {
      if (error.response && error.response.statusCode !== 404) {
        throw error;
      }
    }
  }

  async restartAppsWithoutIstioSidecar(namespace: string) {
    const { body: pods } = await this.k8sApi.listNamespacedPod(namespace);
    const restartedDeployments = new Set<string>();

    for (const pod of pods.items) {
      const hasIstioProxy = pod.spec?.containers?.some(
        container => container.name === "istio-proxy",
      );

      if (!hasIstioProxy) {
        const ownerReferences = pod.metadata?.ownerReferences || [];
        const deploymentOwner = ownerReferences.find(
          or => or.kind === "Deployment",
        );
        // For statefulsets, just delete the pod one at a time.
        const stsOwner = ownerReferences.find(or => or.kind === "StatefulSet");
        if (stsOwner?.name) {
          await this.k8sApi.deleteNamespacedPod(pod.metadata.name, namespace);
        } else if (
          deploymentOwner?.name &&
          !restartedDeployments.has(deploymentOwner.name)
        ) {
          await this.checksumDeployment(
            deploymentOwner.name,
            namespace,
            "checksum",
          );
          restartedDeployments.add(deploymentOwner.name);
        }
      }
    }
  }
}

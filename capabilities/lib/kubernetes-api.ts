import {
  AppsV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  V1Ingress,
  NetworkingV1Api,
} from "@kubernetes/client-node";

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
  k8sApi: CoreV1Api;
  k8sAppsV1Api: AppsV1Api;
  k8sCustomObjectsApi: CustomObjectsApi;
  networkingV1Api: NetworkingV1Api;

  constructor() {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(CoreV1Api);
    this.k8sAppsV1Api = kc.makeApiClient(AppsV1Api);
    this.k8sCustomObjectsApi = kc.makeApiClient(CustomObjectsApi);
    this.networkingV1Api = kc.makeApiClient(NetworkingV1Api);
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

  async upsertVirtualService(ingress: V1Ingress, gateway: string) {
    const modifiedVirtualService = this.ingressToVirtualService(
      ingress,
      gateway
    );

    const { group, version, plural } = getGroupVersionPlural(VirtualService);

    try {
      const response = await this.k8sCustomObjectsApi.getNamespacedCustomObject(
        group,
        version,
        modifiedVirtualService.metadata.namespace,
        plural,
        modifiedVirtualService.metadata.name
      );

      // If the resource exists, update it
      if (response && response.body) {
        const object = new VirtualService(response.body);
        object.spec = modifiedVirtualService.spec;

        await this.k8sCustomObjectsApi.replaceNamespacedCustomObject(
          group,
          version,
          modifiedVirtualService.metadata.namespace,
          plural,
          modifiedVirtualService.metadata.name,
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
          modifiedVirtualService.metadata.namespace,
          plural,
          modifiedVirtualService
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

  async getIngress(
    namespace: string,
    name: string
  ): Promise<V1Ingress | undefined> {
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

  async upsertGateway(ingress: V1Ingress, gatewayName: string) {
    if (!ingress.spec.rules || !ingress.spec.rules[0].host) {
      throw new Error("Ingress object is missing host in rules");
    }

    const host = ingress.spec.rules[0].host;
    if (host.includes("*")) {
      throw new Error("Wildcard hosts are not supported in gateways");
    }

    const modifiedGateway = new Gateway({
      metadata: {
        name: gatewayName,
        namespace: ingress.metadata.namespace,
      },
      spec: {
        selector: {
          istio: "ingressgateway",
        },
        servers: [
          {
            port: {
              number: 443,
              name: "https",
              protocol: "HTTPS",
            },
            hosts: [host],
            tls: {
              mode: "PASSTHROUGH",
            },
          },
        ],
      },
    });

    const { group, version, plural } = getGroupVersionPlural(Gateway);
    try {
      const response = await this.k8sCustomObjectsApi.getNamespacedCustomObject(
        group,
        version,
        ingress.metadata.namespace,
        plural,
        gatewayName
      );

      // If the resource exists, update it
      if (response && response.body) {
        const object = new Gateway(response.body);
        object.spec = modifiedGateway.spec;
        await this.k8sCustomObjectsApi.replaceNamespacedCustomObject(
          group,
          version,
          ingress.metadata.namespace,
          plural,
          gatewayName,
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
          ingress.metadata.namespace,
          plural,
          modifiedGateway
        );
      } else {
        throw error;
      }
    }
  }

  async deleteVirtualService(namespace: string, name: string) {
    const { group, version, plural } = getGroupVersionPlural(VirtualService);
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

  async deleteGateway(namespace: string, name: string) {
    const { group, version, plural } = getGroupVersionPlural(Gateway);
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
}

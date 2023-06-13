import {
  AppsV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  V1Ingress,
  NetworkingV1Api,
  PatchUtils,
} from "@kubernetes/client-node";

import {
  VirtualService,
  Gateway,
} from "@kubernetes-models/istio/networking.istio.io/v1beta1";
import { createPatch } from "rfc6902";

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
    const ownerReference = {
      apiVersion: ingress.apiVersion,
      kind: ingress.kind,
      name: ingress.metadata.name,
      uid: ingress.metadata.uid,
    };

    const virtualService = new VirtualService({
      metadata: {
        name: ingress.metadata.name,
        namespace: ingress.metadata.namespace,
        labels: ingress.metadata.labels,
        annotations: ingress.metadata.annotations,
        ownerReferences: [ownerReference],
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
    const virtualService = this.ingressToVirtualService(ingress, gateway);

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

        // TODO: need to figure out what to do with multiple owners, or no owners?
        if (
          existingObject.metadata.ownerReferences[0].uid != ingress.metadata.uid
        ) {
          throw new Error("Ingress already exists with a different owner");
        }

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

    const ownerReference = {
      apiVersion: ingress.apiVersion,
      kind: ingress.kind,
      name: ingress.metadata.name,
      uid: ingress.metadata.uid,
    };

    const gateway = new Gateway({
      metadata: {
        name: gatewayName,
        namespace: ingress.metadata.namespace,
        ownerReferences: [ownerReference],
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

    const apiGroup = gateway.apiVersion.split("/")[0];
    const apiVersion = gateway.apiVersion.split("/")[1];
    const plural = gateway.kind.toLocaleLowerCase() + "s";

    try {
      const response = await this.k8sCustomObjectsApi.getNamespacedCustomObject(
        apiGroup,
        apiVersion,
        ingress.metadata.namespace,
        plural,
        gatewayName
      );

      // If the resource exists, update it
      if (response && response.body) {
        let patch = createPatch(response.body, gateway);
        patch = patch.filter(operation => operation.path.startsWith("/spec"));
        if (patch.length > 0) {
          await this.k8sCustomObjectsApi.patchNamespacedCustomObject(
            apiGroup,
            apiVersion,
            ingress.metadata.namespace,
            plural,
            gatewayName,
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
          apiGroup,
          apiVersion,
          ingress.metadata.namespace,
          plural,
          gateway
        );
      } else {
        throw error;
      }
    }
  }
}

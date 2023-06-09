import {
    AppsV1Api,
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig,
    V1Ingress,
    V1ObjectMeta,
    NetworkingV1Api,
  } from "@kubernetes/client-node";
  
  import { fetchStatus } from "istio";
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
  
    private ingressToVirtualService(ingress: V1Ingress, gateway: string): VirtualService {
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
            match: [{
              uri: {
                prefix: path.path,
              },
            }],
            route: [{
              destination: {
                host: path.backend?.service?.name,
                port: {
                  number: path.backend?.service?.port.number,
                },
              },
            }],
          });
        });
      });
  
      
      return virtualService;
    }
  
  
    async createOrUpdateVirtualService(
      ingress: V1Ingress
    ) {
  
      const gateway = "istio-system/public"; // Replace with your Istio Gateway
      const virtualService = this.ingressToVirtualService(ingress, gateway);
  
      try {
        await this.k8sCustomObjectsApi.createNamespacedCustomObject(
          "networking.istio.io",
          virtualService.apiVersion,
          virtualService.metadata.namespace,
          "virtualservices",
          virtualService
        );
      } catch (e) {
          console.log(e);
          console.log(e.response.body.message)
          throw e;
        }
      }
  }
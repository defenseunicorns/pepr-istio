import { kind } from "pepr";
import { VirtualService } from "./virtualservice-type";
export { serviceToVirtualService };

/**
 * Convert a Kubernetes Service object into an Istio VirtualService object.
 *
 * This function takes a `kind.Service` object and returns a corresponding Istio
 * `VirtualService` object. The generated `VirtualService` will have the same name
 * and namespace as the provided service. Additionally, the gateway and hostname are
 * specified by the caller.
 *
 * TODO: add the ownerReferneces to the VirtualService to manage the lifecycle.
 *
 * @param {kind.Service} service - The Kubernetes Service object to convert.
 * @param {number} portToExpose - service port to expose
 * @param {string} gateway - The name of the Istio Gateway to which this VirtualService will be bound.
 * @param {string} hostname - The host that this VirtualService will manage.
 *
 * @returns {VirtualService} - The converted Istio VirtualService object.
 *
 * @throws {Error} Throws an error if the service does not have necessary metadata or spec.
 */
function serviceToVirtualService(
  service: kind.Service,
  portToExpose: number,
  gateway: string,
  hostname: string,
) {
  if (portToExpose === undefined) {
    throw new Error("Invalid V1Service provided");
  }
  const virtualService = new VirtualService({
    metadata: {
      name: service.metadata.name,
      namespace: service.metadata.namespace,
    },
    spec: {
      hosts: [hostname],
      gateways: [gateway],
      http: [
        {
          route: [
            {
              destination: {
                host: service.metadata.name,
                port: {
                  number: portToExpose,
                },
              },
            },
          ],
        },
      ],
    },
  });

  if (service.metadata?.uid) {
    const ownerReference = {
      apiVersion: service.apiVersion,
      uid: service.metadata.uid,
      kind: service.kind,
      name: service.metadata.name,
    };
    virtualService.metadata.ownerReferences = [ownerReference];
  }
  return virtualService;
}

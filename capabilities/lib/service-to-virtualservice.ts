import { k8s } from "pepr";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

export { serviceToVirtualService, extractPort };

/**
 * Extracts a valid port number from a given Kubernetes Service.
 *
 * This function filters the ports of the given service to only include TCP ports that are either 80 or 443.
 * It returns a single valid port number, or throws an error if more than one valid port is found.
 *
 * @param {k8s.V1Service} service - The Kubernetes Service object to extract the port from.
 * @returns {number | undefined} - Returns the valid port number if found, or `undefined` if no valid port exists.
 *
 * @throws {Error} - Throws an error if more than one valid port (TCP 80 or 443) is found in the service.
 *
 * @example
 * const k8sService = {
 *   spec: {
 *     ports: [
 *       { port: 80, protocol: 'TCP' },
 *       { port: 8080, protocol: 'TCP' }
 *     ]
 *   }
 * };
 * const port = extractPort(k8sService);
 */
function extractPort(service: k8s.V1Service): number | undefined {
  // Filter ports to only include TCP ports 80 or 443
  const filteredPorts = service.spec.ports.filter(
    (port: k8s.V1ServicePort) =>
      (port.port === 80 || port.port === 443) && port.protocol === "TCP",
  );
  if (filteredPorts.length === 0) {
    return undefined;
  }
  if (filteredPorts.length > 1) {
    throw new Error(
      "Ambiguous ports: More than one TCP port 80 or 443 is specified",
    );
  }
  return filteredPorts[0].port;
}

/**
 * Convert a Kubernetes Service object into an Istio VirtualService object.
 *
 * This function takes a `k8s.V1Service` object and returns a corresponding Istio
 * `VirtualService` object. The generated `VirtualService` will have the same name
 * and namespace as the provided service. Additionally, the gateway and hostname are
 * specified by the caller.
 *
 * TODO: add the ownerReferneces to the VirtualService to manage the lifecycle.
 *
 * @param {k8s.V1Service} service - The Kubernetes Service object to convert.
 * @param {string} gateway - The name of the Istio Gateway to which this VirtualService will be bound.
 * @param {string} hostname - The host that this VirtualService will manage.
 *
 * @returns {VirtualService} - The converted Istio VirtualService object.
 *
 * @throws {Error} Throws an error if the service does not have necessary metadata or spec.
 */
function serviceToVirtualService(
  service: k8s.V1Service,
  gateway: string,
  hostname: string,
): VirtualService | undefined {
  // Validate the provided Kubernetes Service object
  if (!service.metadata?.name || !service.spec?.ports) {
    throw new Error("Invalid V1Service provided");
  }

  const port = extractPort(service);
  if (port === undefined) {
    return undefined;
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
                  number: port,
                },
              },
            },
          ],
        },
      ],
    },
  });

  /* Not Guaranteed that the object is persisted yet. Watch() will fix this

  if (service.metadata?.uid) {
    const ownerReference: k8s.V1OwnerReference = {
      apiVersion: service.apiVersion,
      uid: service.metadata.uid,
      kind: service.kind,
      name: service.metadata.name,
    };
    virtualService.metadata.ownerReferences = [ownerReference];
  }
  */

  virtualService.validate();
  return virtualService;
}

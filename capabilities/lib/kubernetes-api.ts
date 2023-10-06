import { GenericClass } from "kubernetes-fluent-client";
import crypto from "crypto";
import { Log, kind, K8s } from "pepr";

export class K8sAPI {
  static async labelNamespaceForIstio(namespace: string) {
    return await K8s(kind.Namespace).Apply({
      metadata: { name: namespace, labels: { "istio-injection": "enabled" } },
    });
  }

  /**
   * checksumApp - A static asynchronous method that calculates and applies a checksum to a Kubernetes resource which
   *               will cause the pods to be recreated/restart.
   *
   * This method:
   * 1. Fetches the specified Kubernetes resource using the provided name, namespace, and model.
   * 2. Calculates a SHA-256 checksum of the fetched resource.
   * 3. Applies this checksum as an annotation to the resource's pod template metadata.
   * 4. Attempts to update the resource using the "apply" method.
   *    a. If the "apply" method fails, it resorts to a "patch" method to add the checksum annotation.
   * 5. Logs the success or failure of the checksum application.
   *
   * This checksum can be utilized to detect changes in the resource configuration, prompting possible
   * updates or actions in related Kubernetes components or tools.
   *
   * @param {string} name - The name of the Kubernetes resource.
   * @param {string} namespace - The namespace in which the resource resides.
   * @param {GenericClass} model - The Kubernetes model/class of the resource.
   * @param {string} appName - The human-friendly name of the app/resource for logging purposes.
   *
   *
   * @todo Consider replacing the try-catch for "apply" with a force apply when the fluentAPI supports it.
   */
  static async checksumApp(
    name: string,
    namespace: string,
    model: GenericClass,
    appName: string,
  ) {
    try {
      const app = await K8s(model).InNamespace(namespace).Get(name);
      const checksum = crypto
        .createHash("sha256")
        .update(JSON.stringify(app))
        .digest("hex");
      app.spec.template.metadata.annotations =
        app.spec.template.metadata.annotations || {};
      app.spec.template.metadata.annotations["pepr.dev/checksum"] = checksum;
      app.metadata.managedFields = undefined;
      // TODO: try apply first, if it fails, patch. When the fluentAPI supports force apply, we can simplify this
      try {
        await K8s(model, { name: name, namespace: namespace }).Apply(app);
      } catch (err) {
        await K8s(model, { name: name, namespace: namespace }).Patch([
          {
            op: "add",
            path: "/spec/template/metadata/annotations/pepr.dev~1checksum",
            value: checksum,
          },
        ]);
      }
      Log.info(`Successfully applied the checksum to ${appName}`, "pepr-istio");
    } catch (err) {
      Log.error(
        `Failed to apply the checksum to ${appName}: ${err.data?.message}`,
        "pepr-istio",
      );
    }
  }

  /**
   * Checks if the given pod needs to have an istio-proxy.
   *
   * This method determines if the specified Kubernetes pod contains a container named "istio-proxy",
   * which is indicative of the Istio sidecar being present.
   *
   * @param pod - The Kubernetes pod object to inspect.
   * @returns true if the pod needs an Istio proxy container, false otherwise.
   */
  private static needsIstioProxy(pod: kind.Pod) {
    // TODO: Not every pod will need this, we need to know how to filter those out.
    return !pod.spec?.containers?.some(
      container => container.name === "istio-proxy",
    );
  }

  /**
   * Retrieves the owner references for a given pod.
   *
   * This function:
   * 1. Initially checks the direct owner references of the pod.
   * 2. If the pod is owned by a ReplicaSet, the function will further fetch
   *    the owner references of the ReplicaSet. This is based on the understanding
   *    that ReplicaSets can be managed by higher-level constructs like Deployments.
   *
   * @param pod - The Kubernetes pod object for which owner references are to be fetched.
   *
   * @returns An array of `V1OwnerReference` objects. If the pod is owned by a ReplicaSet,
   *          it returns the owner references of the ReplicaSet instead of the direct
   *          owner references of the pod.
   */
  private static async getOwnerReferences(pod: kind.Pod) {
    const ownerReferences = pod.metadata?.ownerReferences || [];

    // Check to see if it's a replicaset, if so, we need to get it's parent
    const replicaSetOwner = ownerReferences.find(
      or => or.kind === "ReplicaSet",
    );
    if (replicaSetOwner?.name) {
      try {
        const replicaSet = await K8s(kind.ReplicaSet)
          .InNamespace(pod.metadata.namespace)
          .Get(replicaSetOwner.name);
        return replicaSet.metadata?.ownerReferences || [];
      } catch {
        Log.error(
          `Failed to get owner references for ReplicaSet ${replicaSetOwner.name}`,
          "pepr-istio",
        );
      }
    }
    return ownerReferences;
  }

  /**
   * Restarts all pods in the given namespace that do not have an Istio sidecar proxy.
   *
   * This function:
   * 1. Retrieves all pods in the given namespace.
   * 2. Iterates through the pods to identify those that do not have an Istio sidecar proxy (`istio-proxy`).
   * 3. Determines the owner (Deployment, DaemonSet or StatefulSet) of each pod without the Istio proxy.
   * 4. Restarts the pods based on their owning Deployment, StatefulSet or Daemonset (by setting a checksum)
   *
   * Note:
   * The function avoids restarting the same app (DemonSet/Deployment) multiple times by maintaining a set of already restarted deployments.
   *
   * @param namespace - The Kubernetes namespace in which to operate.
   */
  static async restartAppsWithoutIstioSidecar(namespace: string) {
    const allPods = await K8s(kind.Pod).InNamespace(namespace).Get();
    const restartablePods = allPods.items.filter(this.needsIstioProxy);
    Log.info(
      `In ${namespace} namespace, found ${restartablePods.length}/${allPods.items.length} pods without an istio-proxy sidecar`,
      "pepr-istio",
    );
    const restartApps = new Set<string>();
    const kindMap: { [key: string]: GenericClass } = {
      Deployment: kind.Deployment,
      DaemonSet: kind.DaemonSet,
      StatefulSet: kind.StatefulSet,
    };

    for (const pod of restartablePods) {
      const ownerReferences = await this.getOwnerReferences(pod);
      for (const ownerReference of ownerReferences) {
        if (kindMap[ownerReference.kind]) {
          restartApps.add(`${ownerReference.kind}/${ownerReference.name}`);
        }
      }
    }

    for (const app of restartApps) {
      const [thisKind, name] = app.split("/");
      await this.checksumApp(name, namespace, kindMap[thisKind], app);
    }
  }

  /**
   * findPodContainerPort - A static asynchronous method that attempts to determine the container port
   * of a pod based on a given Kubernetes service.
   *
   * Given a Kubernetes service, this method:
   * 1. Queries for all pods in the namespace of the service that match the service's label selector.
   * 2. Iterates through each pod and its containers.
   * 3. Attempts to find the port within a container whose name matches the target port of the service.
   * 4. If such a port is found, it returns the container port.
   * 5. If no matching port is found after checking all pods and their containers, it returns undefined.
   *
   * @param {kind.Service} service - The Kubernetes service based on which the container port needs to be determined.
   *
   * @returns {number | undefined} - The found container port or undefined if no matching port is found.
   */
  static async findPodContainerPort(service: kind.Service) {
    const pods = await K8s(kind.Pod, { labels: service.spec.selector })
      .InNamespace(service.metadata.namespace)
      .Get();

    for (const pod of pods.items) {
      for (const container of pod.spec?.containers || []) {
        const port = container.ports?.find(
          port => port.name === service.spec?.ports[0].targetPort?.toString(),
        );
        if (port) {
          return port.containerPort;
        }
      }
    }
    return undefined;
  }
}

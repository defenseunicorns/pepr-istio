import { GenericClass } from "kubernetes-fluent-client";
import crypto from "crypto";
import { Log, kind, K8s } from "pepr";

export class K8sAPI {
  static async labelNamespaceForIstio(namespace: string) {
    return await K8s(kind.Namespace).Apply({
      metadata: { name: namespace, labels: { "istio-injection": "enabled" } },
    });
  }

  static async checksumApp(
    name: string,
    namespace: string,
    model: GenericClass,
    appName: string
  ) {
    try {
      const app = await K8s(model).InNamespace(namespace).Get(name);
      const checksum = crypto
        .createHash("sha256")
        .update(JSON.stringify(app))
        .digest("hex");
      app.spec.template.metadata.annotations = app.spec.template.metadata.annotations || {};
      app.spec.template.metadata.annotations["pepr.dev/checksum"] = checksum;
      app.metadata.managedFields = undefined
      // TODO: try apply first,
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
      Log.info(
        `Failed successfully applied the checksum to ${appName}`,
        "pepr-istio",
      );
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
        // do not throw an error, this is called through Watch and it won't help identify the issue
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
   * 4. Restarts the pods based on their owning Deployment or StatefulSet:
   *    - For StatefulSets: Deletes the pods one at a time.
   *    - For Deployments/Daemonset: annotates the app with a checksum to force a restart
   *
   * Note:
   * The function avoids restarting the same app (DemonSet/Deployment) multiple times by maintaining a set of already restarted deployments.
   *
   * @param namespace - The Kubernetes namespace in which to operate.
   */
  static async restartAppsWithoutIstioSidecar(namespace: string) {
    const pods = await K8s(kind.Pod).InNamespace(namespace).Get();
    Log.debug(
      `Found ${pods.items.length} pods in namespace ${namespace}`,
      "pepr-istio",
    );
    const restartApps = new Set<string>();
    const kindMap: { [key: string]: GenericClass } = {
      Deployment: kind.Deployment,
      DaemonSet: kind.DaemonSet,
    };

    for (const pod of pods.items) {
      if (this.needsIstioProxy(pod)) {
        const ownerReferences = await this.getOwnerReferences(pod);
        for (const ownerReference of ownerReferences) {
          if (kindMap[ownerReference.kind]) {
            const app = `${ownerReference.kind}/${ownerReference.name}`;
            if (!restartApps.has(app)) {
              restartApps.add(app);
            }
          } else if (ownerReference.kind === "StatefulSet") {
            try {
              await K8s(kind.Pod)
                .InNamespace(pod.metadata.namespace)
                .Delete(pod.metadata.name);
            } catch (e) {
              Log.error(
                `Failed to delete pod in statefuleset ${pod.metadata.name}: ${e.data?.message}`,
                "pepr-istio",
              );
            }
          }
        }
      }
    }

    for (const app of restartApps) {
      const [thisKind, name] = app.split("/");
      await this.checksumApp(name, namespace, kindMap[thisKind], app);
    }
  }
}

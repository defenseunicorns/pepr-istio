import { K8s, kind } from "kubernetes-fluent-client";
import { VirtualService } from "./types";

export class K8sAPI {
  static async labelNamespaceForIstio(namespace: string) {
    return await K8s(kind.Namespace, {}).Apply({
      metadata: { name: namespace, labels: { "istio-injection": "enabled" } },
    });
  }

  static async checksumDeployment(
    name: string,
    namespace: string,
    checksum: string,
  ) {
    await K8s(kind.Deployment, { name: name, namespace: namespace }).Patch([
      {
        op: "add",
        path: "/spec/template/metadata/annotations/pepr.dev~1checksum",
        value: checksum,
      },
    ]);
  }

  static async deleteVirtualService(namespace: string, name: string) {
    return await K8s(VirtualService).InNamespace(namespace).Delete(name);
  }

  static async restartAppsWithoutIstioSidecar(namespace: string) {
    const pods = await K8s(kind.Pod).InNamespace(namespace).Get();
    const restartedDeployments = new Set<string>();

    for (const pod of pods.items) {
      const hasIstioProxy = pod.spec?.containers?.some(
        container => container.name === "istio-proxy",
      );

      if (!hasIstioProxy) {
        let ownerReferences = pod.metadata?.ownerReferences || [];
        const replicaSetOwner = ownerReferences.find(
          or => or.kind === "ReplicaSet",
        );

        if (replicaSetOwner?.name) {
          const replicaSet = await K8s(kind.ReplicaSet)
            .InNamespace(namespace)
            .Get(replicaSetOwner.name);
          ownerReferences = replicaSet.metadata?.ownerReferences || [];
        }

        const deploymentOwner = ownerReferences.find(
          or => or.kind === "Deployment",
        );
        // For statefulsets, just delete the pod one at a time.
        const stsOwner = ownerReferences.find(or => or.kind === "StatefulSet");
        if (stsOwner?.name) {
          await K8s(kind.Pod)
            .InNamespace(pod.metadata.namespace)
            .Delete(pod.metadata.name);
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

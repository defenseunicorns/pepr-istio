# Pepr Module for Istio (service mesh)

This is a Pepr Module to implement the modifications to an application to inject istio into an application. 
[Pepr](https://github.com/defenseunicorns/pepr) is a Kubernetes transformation system written in Typescript.

<br>

### The goal of this module/capability is to implement the changes to a deployed application needed:
1. Enable the istio (side car injection)
2. Create the virtual service for an applications via either a service or a ingress object

<br>

### The documentation that defines the work this pepr module is automating is kept here:
[BigBang Service Mesh]https://repo1.dso.mil/big-bang/bigbang/-/blob/master/docs/developer/package-integration/service-mesh.md

<br>

### The minimum requirements for this module are:
1. Istio must be deployed (This has been primarily tested with 1.17.2)
2. Kubernetes 1.19+ (for changes to the ingress API)
3. an object to drive this capability: (ingress or a service)

Example of ingress object:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: podinfo
  namespace: podinfo
  annotations:
    # OPTIONAL: the default is "istio-system/tenant"
    pepr.dev/gateway: istio-system/tenant
spec:
  ingressClassName: pepr-istio
  rules:
      # REQUIRED, this segment must be set to define the host, service, and port
    - host: "podinfo.bigbang.dev"
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: podinfo
                port:
                  number: 80
```
Example of a service:
```yaml
apiVersion: v1
kind: Service
metadata:
  # metadata.name will be the hostname
  # TBD: how to configure the domain (default in the istio.ts)
  name: myapp
  namespace: myapp
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      # TBD: how to configure which port to use, currently will always pick up 80/443
      port: 80
      targetPort: 9376
```
<br>


### File structure:
The `capability` here is pulled into a module with `pepr.ts` file as `import { Istio } from "./capabilities/istio";`.
```
Module Root
├── package.json
├── pepr.ts
└── capabilities
    ├── istio.ts
    └── lib
        ├── ingress-to-virtualservice.ts
        ├── kubernetes-api.ts
        └── service-to-virtualservice.ts
```

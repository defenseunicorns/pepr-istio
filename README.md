# Pepr Module for Istio (service mesh)

This is a Pepr Module to implement the modifications to an application to inject istio into an application. 
[Pepr](https://github.com/defenseunicorns/pepr) is a Kubernetes transformation system written in Typescript.

<br>

### The goal of this module/capability is to implement the changes to a deployed application needed:
1. Enable the istio (side car injection)
2. Create the virtual service for an applications
3. Create the Gateway (If the application requires TLS passthrough)

<br>

### The documentation that defines the work this pepr module is automating is kept here:
[BigBang Service Mesh]https://repo1.dso.mil/big-bang/bigbang/-/blob/master/docs/developer/package-integration/service-mesh.md

<br>

### The minimum requirements for this module are:
1. Istio must be deployed (This has been primarily tested with 1.17.2)
2. Kubernetes 1.19 The Ingress API changed significantly here, this work wasn't backported to the previous version.
3. A `dummy` ingress object must be created (see example below), we're configuring the pepr istio module with a fake ingress class name, and using annotations configure which gateway to use (or to create one) and which loadbalancer to use (only necessary if we're creating the gateway). 
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: podinfo
  namespace: podinfo
  annotations:
    pepr.dev/gateway: istio-system/public-ingressgateway
spec:
  ingressClassName: pepr-istio
  rules:
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

<br>

### How to configure the different options:
1. [tls passthrough (podinfo would terminate tls)] Create a new virtual service, gateway for podinfo as a passthrough, and use an existing load balancer:
```yaml
  annotations:
    pepr.dev/gateway: podinfo
    pepr.dev/ingress-selector: '{ "istio": "ingressgateway"}'

```
2. [tls termination in Envoy] Create a new virtual service, use an existing gateway (and existing loadbalancer):
```
  annotations:
    pepr.dev/gateway: istio-system/public-ingressgateway
```

<br>

### How to configure the `dummy` ingress with various deployment methods:
1. helm chart (helm charts may not follow this exact standard, but here's the values format to mirror the above raw manifest): 
```yaml
ingress
  enabled: true
ingress: 
  className: pepr-istio
ingress:
  annotations:
    pepr.dev/gateway: podinfo
    pepr.dev/ingress-selector: '{"istio": "ingressgateway"}'
```
2. kustomize, raw kubernetes manifest (see above yaml)

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
        └── kubernetes-api.ts

```

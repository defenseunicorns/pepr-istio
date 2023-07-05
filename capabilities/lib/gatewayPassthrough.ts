// Moved contents to Istio capability (istio.ts)

/*
// Examples: 
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: passthrough
  namespace: podinfo-too
spec:
  selector:
    app: tenant-ingressgateway
  servers:
  - hosts:
    - "podinfo-too.bigbang.dev"
    port:
      name: https
      number: 8443
      protocol: HTTPS
    tls:
      mode: PASSTHROUGH


apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: podinfo-too
  namespace: podinfo-too
spec:
  gateways:
  - istio-system/passthrough
  hosts:
  - podinfo-too.bigbang.dev
  tls:
  - match:
    - sniHosts: ["podinfo-too.bigbang.dev"]
    route:
    - destination:
        host: podinfo-too
        port:
          number: 9899
*/

/* We assume that any virtualService that is created with a populated value in 
vs.Raw.spec.tls[0].match[0].sniHosts requires a corresponding Gateway object for 
TLS passthrough

The relation is one passthrough gateway to one virtual service, meaning multiple hosts or gateways will not be listed in the VirtualService

Things we need from the virtual service in order to properly configure the Gateway 
If the sni is populated capture the 
* spec.gateway 
* spec.hosts

We still need to determine if the passthrough gateway is intended for the admin or tenant IngressGateway

*/

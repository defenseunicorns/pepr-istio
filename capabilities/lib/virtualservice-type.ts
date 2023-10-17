// TODO: Work in progress:
// 1. Get V1ObjectMeta from pepr's kind (should be exported from the fluent API)
// 2. Automate generation of this from a CRD, will work on this later, it's very useful.
// 3. the RegisterKind call should be automated as part of the auto-generation

import { V1ObjectMeta } from "@kubernetes/client-node";
import { RegisterKind } from "pepr";

export class VirtualService {
  /** @description APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion: string;
  /** @description Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind: string;
  metadata?: V1ObjectMeta;
  /** @description Configuration affecting label/content routing, sni routing, etc. See more details at: https://istio.io/docs/reference/config/networking/virtual-service.html */
  spec?: {
    /** @description A list of namespaces to which this virtual service is exported. */
    exportTo?: string[];
    /** @description The names of gateways and sidecars that should apply these routes. */
    gateways?: string[];
    /** @description The destination hosts to which traffic is being sent. */
    hosts?: string[];
    /** @description An ordered list of route rules for HTTP traffic. */
    http?: {
      /** @description Cross-Origin Resource Sharing policy (CORS). */
      corsPolicy?: {
        allowCredentials?: Record<string, never>;
        allowHeaders?: string[];
        /** @description List of HTTP methods allowed to access the resource. */
        allowMethods?: string[];
        /** @description The list of origins that are allowed to perform CORS requests. */
        allowOrigin?: string[];
        /** @description String patterns that match allowed origins. */
        allowOrigins?: {
          exact?: string;
          prefix?: string;
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          regex?: string;
        }[];
        exposeHeaders?: string[];
        maxAge?: string;
      };
      delegate?: {
        /** @description Name specifies the name of the delegate VirtualService. */
        name?: string;
        /** @description Namespace specifies the namespace where the delegate VirtualService resides. */
        namespace?: string;
      };
      /** @description A HTTP rule can either return a direct_response, redirect or forward (default) traffic. */
      directResponse?: {
        /** @description Specifies the content of the response body. */
        body?: {
          /**
           * Format: binary
           * @description response body as base64 encoded bytes.
           */
          bytes?: string;
          string?: string;
        };
        /** @description Specifies the HTTP response status to be returned. */
        status?: number;
      };
      /** @description Fault injection policy to apply on HTTP traffic at the client side. */
      fault?: {
        abort?: {
          /** @description GRPC status code to use to abort the request. */
          grpcStatus?: string;
          http2Error?: string;
          /**
           * Format: int32
           * @description HTTP status code to use to abort the Http request.
           */
          httpStatus?: number;
          /** @description Percentage of requests to be aborted with the error code provided. */
          percentage?: {
            /** Format: double */
            value?: number;
          };
        };
        delay?: {
          exponentialDelay?: string;
          /** @description Add a fixed delay before forwarding the request. */
          fixedDelay?: string;
          /**
           * Format: int32
           * @description Percentage of requests on which the delay will be injected (0-100).
           */
          percent?: number;
          /** @description Percentage of requests on which the delay will be injected. */
          percentage?: {
            /** Format: double */
            value?: number;
          };
        };
      };
      headers?: {
        request?: {
          add?: {
            [key: string]: string;
          };
          remove?: string[];
          set?: {
            [key: string]: string;
          };
        };
        response?: {
          add?: {
            [key: string]: string;
          };
          remove?: string[];
          set?: {
            [key: string]: string;
          };
        };
      };
      match?: {
        authority?: {
          exact?: string;
          prefix?: string;
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          regex?: string;
        };
        /** @description Names of gateways where the rule should be applied. */
        gateways?: string[];
        headers?: {
          [key: string]: {
            exact?: string;
            prefix?: string;
            /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
            regex?: string;
          };
        };
        /** @description Flag to specify whether the URI matching should be case-insensitive. */
        ignoreUriCase?: boolean;
        method?: {
          exact?: string;
          prefix?: string;
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          regex?: string;
        };
        /** @description The name assigned to a match. */
        name?: string;
        /** @description Specifies the ports on the host that is being addressed. */
        port?: number;
        /** @description Query parameters for matching. */
        queryParams?: {
          [key: string]: {
            exact?: string;
            prefix?: string;
            /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
            regex?: string;
          };
        };
        scheme?: {
          exact?: string;
          prefix?: string;
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          regex?: string;
        };
        sourceLabels?: {
          [key: string]: string;
        };
        /** @description Source namespace constraining the applicability of a rule to workloads in that namespace. */
        sourceNamespace?: string;
        /** @description The human readable prefix to use when emitting statistics for this route. */
        statPrefix?: string;
        uri?: {
          exact?: string;
          prefix?: string;
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          regex?: string;
        };
        /** @description withoutHeader has the same syntax with the header, but has opposite meaning. */
        withoutHeaders?: {
          [key: string]: {
            exact?: string;
            prefix?: string;
            /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
            regex?: string;
          };
        };
      }[];
      mirror?: {
        /** @description The name of a service from the service registry. */
        host?: string;
        /** @description Specifies the port on the host that is being addressed. */
        port?: {
          number?: number;
        };
        /** @description The name of a subset within the service. */
        subset?: string;
      };
      /** @description Percentage of the traffic to be mirrored by the `mirror` field. */
      mirrorPercent?: Record<string, never>;
      /** @description Percentage of the traffic to be mirrored by the `mirror` field. */
      mirrorPercentage?: {
        /** Format: double */
        value?: number;
      };
      /** @description Percentage of the traffic to be mirrored by the `mirror` field. */
      mirror_percent?: Record<string, never>;
      mirrors?: {
        destination?: {
          /** @description The name of a service from the service registry. */
          host?: string;
          /** @description Specifies the port on the host that is being addressed. */
          port?: {
            number?: number;
          };
          /** @description The name of a subset within the service. */
          subset?: string;
        };
        percentage?: {
          /** Format: double */
          value?: number;
        };
      }[];
      /** @description The name assigned to the route for debugging purposes. */
      name?: string;
      /** @description A HTTP rule can either return a direct_response, redirect or forward (default) traffic. */
      redirect?: {
        authority?: string;
        /** @enum {string} */
        derivePort?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
        /** @description On a redirect, overwrite the port portion of the URL with this value. */
        port?: number;
        redirectCode?: number;
        /** @description On a redirect, overwrite the scheme portion of the URL with this value. */
        scheme?: string;
        uri?: string;
      };
      /** @description Retry policy for HTTP requests. */
      retries?: {
        /**
         * Format: int32
         * @description Number of retries to be allowed for a given request.
         */
        attempts?: number;
        /** @description Timeout per attempt for a given request, including the initial call and any retries. */
        perTryTimeout?: string;
        /** @description Specifies the conditions under which retry takes place. */
        retryOn?: string;
        /** @description Flag to specify whether the retries should retry to other localities. */
        retryRemoteLocalities?: Record<string, never>;
      };
      /** @description Rewrite HTTP URIs and Authority headers. */
      rewrite?: {
        /** @description rewrite the Authority/Host header with this value. */
        authority?: string;
        uri?: string;
        /** @description rewrite the path portion of the URI with the specified regex. */
        uriRegexRewrite?: {
          /** @description RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax). */
          match?: string;
          /** @description The string that should replace into matching portions of original URI. */
          rewrite?: string;
        };
      };
      /** @description A HTTP rule can either return a direct_response, redirect or forward (default) traffic. */
      route?: {
        destination?: {
          /** @description The name of a service from the service registry. */
          host?: string;
          /** @description Specifies the port on the host that is being addressed. */
          port?: {
            number?: number;
          };
          /** @description The name of a subset within the service. */
          subset?: string;
        };
        headers?: {
          request?: {
            add?: {
              [key: string]: string;
            };
            remove?: string[];
            set?: {
              [key: string]: string;
            };
          };
          response?: {
            add?: {
              [key: string]: string;
            };
            remove?: string[];
            set?: {
              [key: string]: string;
            };
          };
        };
        /**
         * Format: int32
         * @description Weight specifies the relative proportion of traffic to be forwarded to the destination.
         */
        weight?: number;
      }[];
      /** @description Timeout for HTTP requests, default is disabled. */
      timeout?: string;
    }[];
    /** @description An ordered list of route rules for opaque TCP traffic. */
    tcp?: {
      match?: {
        /** @description IPv4 or IPv6 ip addresses of destination with optional subnet. */
        destinationSubnets?: string[];
        /** @description Names of gateways where the rule should be applied. */
        gateways?: string[];
        /** @description Specifies the port on the host that is being addressed. */
        port?: number;
        sourceLabels?: {
          [key: string]: string;
        };
        /** @description Source namespace constraining the applicability of a rule to workloads in that namespace. */
        sourceNamespace?: string;
        /** @description IPv4 or IPv6 ip address of source with optional subnet. */
        sourceSubnet?: string;
      }[];
      /** @description The destination to which the connection should be forwarded to. */
      route?: {
        destination?: {
          /** @description The name of a service from the service registry. */
          host?: string;
          /** @description Specifies the port on the host that is being addressed. */
          port?: {
            number?: number;
          };
          /** @description The name of a subset within the service. */
          subset?: string;
        };
        /**
         * Format: int32
         * @description Weight specifies the relative proportion of traffic to be forwarded to the destination.
         */
        weight?: number;
      }[];
    }[];
    tls?: {
      match?: {
        /** @description IPv4 or IPv6 ip addresses of destination with optional subnet. */
        destinationSubnets?: string[];
        /** @description Names of gateways where the rule should be applied. */
        gateways?: string[];
        /** @description Specifies the port on the host that is being addressed. */
        port?: number;
        /** @description SNI (server name indicator) to match on. */
        sniHosts?: string[];
        sourceLabels?: {
          [key: string]: string;
        };
        /** @description Source namespace constraining the applicability of a rule to workloads in that namespace. */
        sourceNamespace?: string;
      }[];
      /** @description The destination to which the connection should be forwarded to. */
      route?: {
        destination?: {
          /** @description The name of a service from the service registry. */
          host?: string;
          /** @description Specifies the port on the host that is being addressed. */
          port?: {
            number?: number;
          };
          /** @description The name of a subset within the service. */
          subset?: string;
        };
        /**
         * Format: int32
         * @description Weight specifies the relative proportion of traffic to be forwarded to the destination.
         */
        weight?: number;
      }[];
    }[];
  };
  status?: Record<string, never>;
  constructor(input?: Partial<VirtualService>) {
    this.apiVersion = input.apiVersion || "networking.istio.io/v1alpha3";
    this.kind = input.kind || "VirtualService";
    this.metadata = input?.metadata;
    this.spec = input?.spec;
    this.status = input?.status;
  }
}

RegisterKind(VirtualService, {
  kind: "VirtualService",
  version: "v1alpha3",
  group: "networking.istio.io",
});

import { Capability, a, RegisterKind } from "pepr";
import { VirtualService } from "@kubernetes-models/istio/networking.istio.io/v1beta1";

export const GatewayPassthrough = new Capability({
  name: "GatewayPassthrough",
  description: "Configure an Istio Gateway for TLS passthrough based on the creation of a corresponding VirtualService",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = GatewayPassthrough;

// How do we register an existing CRD(VirtualService) so we don't have to polute or module?
  class VirtualServiceKind  extends a.GenericKind {
        spec: {
        /**
         * A list of namespaces to which this virtual service is exported.
         */
        "exportTo"?: Array<string>;
        /**
         * The names of gateways and sidecars that should apply these routes.
         */
        "gateways"?: Array<string>;
        /**
         * The destination hosts to which traffic is being sent.
         */
        "hosts"?: Array<string>;
        /**
         * An ordered list of route rules for HTTP traffic.
         */
        "http"?: Array<{
            /**
             * Cross-Origin Resource Sharing policy (CORS).
             */
            "corsPolicy"?: {
                "allowCredentials"?: boolean;
                "allowHeaders"?: Array<string>;
                /**
                 * List of HTTP methods allowed to access the resource.
                 */
                "allowMethods"?: Array<string>;
                /**
                 * The list of origins that are allowed to perform CORS requests.
                 */
                "allowOrigin"?: Array<string>;
                /**
                 * String patterns that match allowed origins.
                 */
                "allowOrigins"?: Array<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & (Exclude<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                }, {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & ({
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })> | {
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })>;
                "exposeHeaders"?: Array<string>;
                "maxAge"?: string;
            };
            "delegate"?: {
                /**
                 * Name specifies the name of the delegate VirtualService.
                 */
                "name"?: string;
                /**
                 * Namespace specifies the namespace where the delegate VirtualService resides.
                 */
                "namespace"?: string;
            };
            /**
             * A HTTP rule can either return a direct_response, redirect or forward (default) traffic.
             */
            "directResponse"?: {
                /**
                 * Specifies the content of the response body.
                 */
                "body"?: {
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes"?: string;
                    "string"?: string;
                } & (Exclude<{
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes"?: string;
                    "string"?: string;
                }, {
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes"?: string;
                    "string"?: string;
                } & ({
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes"?: string;
                    "string": string;
                } | {
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes": string;
                    "string"?: string;
                })> | {
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes"?: string;
                    "string": string;
                } | {
                    /**
                     * response body as base64 encoded bytes.
                     */
                    "bytes": string;
                    "string"?: string;
                });
                /**
                 * Specifies the HTTP response status to be returned.
                 */
                "status"?: number;
            };
            /**
             * Fault injection policy to apply on HTTP traffic at the client side.
             */
            "fault"?: {
                "abort"?: {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } & (Exclude<{
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                }, {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } & ({
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus": number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus": string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error": string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                })> | {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus": number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus": string;
                    "http2Error"?: string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    /**
                     * GRPC status code to use to abort the request.
                     */
                    "grpcStatus"?: string;
                    "http2Error": string;
                    /**
                     * HTTP status code to use to abort the Http request.
                     */
                    "httpStatus"?: number;
                    /**
                     * Percentage of requests to be aborted with the error code provided.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                });
                "delay"?: {
                    "exponentialDelay"?: string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay"?: string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } & (Exclude<{
                    "exponentialDelay"?: string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay"?: string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                }, {
                    "exponentialDelay"?: string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay"?: string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } & ({
                    "exponentialDelay"?: string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay": string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    "exponentialDelay": string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay"?: string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                })> | {
                    "exponentialDelay"?: string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay": string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                } | {
                    "exponentialDelay": string;
                    /**
                     * Add a fixed delay before forwarding the request.
                     */
                    "fixedDelay"?: string;
                    /**
                     * Percentage of requests on which the delay will be injected (0-100).
                     */
                    "percent"?: number;
                    /**
                     * Percentage of requests on which the delay will be injected.
                     */
                    "percentage"?: {
                        "value"?: number;
                    };
                });
            };
            "headers"?: {
                "request"?: {
                    "add"?: {
                        [key: string]: string;
                    };
                    "remove"?: Array<string>;
                    "set"?: {
                        [key: string]: string;
                    };
                };
                "response"?: {
                    "add"?: {
                        [key: string]: string;
                    };
                    "remove"?: Array<string>;
                    "set"?: {
                        [key: string]: string;
                    };
                };
            };
            "match"?: Array<{
                "authority"?: {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & (Exclude<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                }, {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & ({
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })> | {
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                });
                /**
                 * Names of gateways where the rule should be applied.
                 */
                "gateways"?: Array<string>;
                "headers"?: {
                    [key: string]: {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & (Exclude<{
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    }, {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & ({
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    })> | {
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    });
                };
                /**
                 * Flag to specify whether the URI matching should be case-insensitive.
                 */
                "ignoreUriCase"?: boolean;
                "method"?: {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & (Exclude<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                }, {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & ({
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })> | {
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                });
                /**
                 * The name assigned to a match.
                 */
                "name"?: string;
                /**
                 * Specifies the ports on the host that is being addressed.
                 */
                "port"?: number;
                /**
                 * Query parameters for matching.
                 */
                "queryParams"?: {
                    [key: string]: {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & (Exclude<{
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    }, {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & ({
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    })> | {
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    });
                };
                "scheme"?: {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & (Exclude<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                }, {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & ({
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })> | {
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                });
                "sourceLabels"?: {
                    [key: string]: string;
                };
                /**
                 * Source namespace constraining the applicability of a rule to workloads in that namespace.
                 */
                "sourceNamespace"?: string;
                /**
                 * The human readable prefix to use when emitting statistics for this route.
                 */
                "statPrefix"?: string;
                "uri"?: {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & (Exclude<{
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                }, {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } & ({
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                })> | {
                    "exact": string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix": string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex"?: string;
                } | {
                    "exact"?: string;
                    "prefix"?: string;
                    /**
                     * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                     */
                    "regex": string;
                });
                /**
                 * withoutHeader has the same syntax with the header, but has opposite meaning.
                 */
                "withoutHeaders"?: {
                    [key: string]: {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & (Exclude<{
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    }, {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } & ({
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    })> | {
                        "exact": string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix": string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex"?: string;
                    } | {
                        "exact"?: string;
                        "prefix"?: string;
                        /**
                         * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
                         */
                        "regex": string;
                    });
                };
            }>;
            "mirror"?: {
                /**
                 * The name of a service from the service registry.
                 */
                "host"?: string;
                /**
                 * Specifies the port on the host that is being addressed.
                 */
                "port"?: {
                    "number"?: number;
                };
                /**
                 * The name of a subset within the service.
                 */
                "subset"?: string;
            };
            /**
             * Percentage of the traffic to be mirrored by the `mirror` field.
             */
            "mirror_percent"?: number;
            /**
             * Percentage of the traffic to be mirrored by the `mirror` field.
             */
            "mirrorPercent"?: number;
            /**
             * Percentage of the traffic to be mirrored by the `mirror` field.
             */
            "mirrorPercentage"?: {
                "value"?: number;
            };
            /**
             * The name assigned to the route for debugging purposes.
             */
            "name"?: string;
            /**
             * A HTTP rule can either return a direct_response, redirect or forward (default) traffic.
             */
            "redirect"?: {
                "authority"?: string;
                "derivePort"?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port"?: number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            } & (Exclude<{
                "authority"?: string;
                "derivePort"?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port"?: number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            }, {
                "authority"?: string;
                "derivePort"?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port"?: number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            } & ({
                "authority"?: string;
                "derivePort"?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port": number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            } | {
                "authority"?: string;
                "derivePort": "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port"?: number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            })> | {
                "authority"?: string;
                "derivePort"?: "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port": number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            } | {
                "authority"?: string;
                "derivePort": "FROM_PROTOCOL_DEFAULT" | "FROM_REQUEST_PORT";
                /**
                 * On a redirect, overwrite the port portion of the URL with this value.
                 */
                "port"?: number;
                "redirectCode"?: number;
                /**
                 * On a redirect, overwrite the scheme portion of the URL with this value.
                 */
                "scheme"?: string;
                "uri"?: string;
            });
            /**
             * Retry policy for HTTP requests.
             */
            "retries"?: {
                /**
                 * Number of retries to be allowed for a given request.
                 */
                "attempts"?: number;
                /**
                 * Timeout per attempt for a given request, including the initial call and any retries.
                 */
                "perTryTimeout"?: string;
                /**
                 * Specifies the conditions under which retry takes place.
                 */
                "retryOn"?: string;
                /**
                 * Flag to specify whether the retries should retry to other localities.
                 */
                "retryRemoteLocalities"?: boolean;
            };
            /**
             * Rewrite HTTP URIs and Authority headers.
             */
            "rewrite"?: {
                /**
                 * rewrite the Authority/Host header with this value.
                 */
                "authority"?: string;
                "uri"?: string;
            };
            /**
             * A HTTP rule can either return a direct_response, redirect or forward (default) traffic.
             */
            "route"?: Array<{
                "destination"?: {
                    /**
                     * The name of a service from the service registry.
                     */
                    "host"?: string;
                    /**
                     * Specifies the port on the host that is being addressed.
                     */
                    "port"?: {
                        "number"?: number;
                    };
                    /**
                     * The name of a subset within the service.
                     */
                    "subset"?: string;
                };
                "headers"?: {
                    "request"?: {
                        "add"?: {
                            [key: string]: string;
                        };
                        "remove"?: Array<string>;
                        "set"?: {
                            [key: string]: string;
                        };
                    };
                    "response"?: {
                        "add"?: {
                            [key: string]: string;
                        };
                        "remove"?: Array<string>;
                        "set"?: {
                            [key: string]: string;
                        };
                    };
                };
                /**
                 * Weight specifies the relative proportion of traffic to be forwarded to the destination.
                 */
                "weight"?: number;
            }>;
            /**
             * Timeout for HTTP requests, default is disabled.
             */
            "timeout"?: string;
        }>;
        /**
         * An ordered list of route rules for opaque TCP traffic.
         */
        "tcp"?: Array<{
            "match"?: Array<{
                /**
                 * IPv4 or IPv6 ip addresses of destination with optional subnet.
                 */
                "destinationSubnets"?: Array<string>;
                /**
                 * Names of gateways where the rule should be applied.
                 */
                "gateways"?: Array<string>;
                /**
                 * Specifies the port on the host that is being addressed.
                 */
                "port"?: number;
                "sourceLabels"?: {
                    [key: string]: string;
                };
                /**
                 * Source namespace constraining the applicability of a rule to workloads in that namespace.
                 */
                "sourceNamespace"?: string;
                /**
                 * IPv4 or IPv6 ip address of source with optional subnet.
                 */
                "sourceSubnet"?: string;
            }>;
            /**
             * The destination to which the connection should be forwarded to.
             */
            "route"?: Array<{
                "destination"?: {
                    /**
                     * The name of a service from the service registry.
                     */
                    "host"?: string;
                    /**
                     * Specifies the port on the host that is being addressed.
                     */
                    "port"?: {
                        "number"?: number;
                    };
                    /**
                     * The name of a subset within the service.
                     */
                    "subset"?: string;
                };
                /**
                 * Weight specifies the relative proportion of traffic to be forwarded to the destination.
                 */
                "weight"?: number;
            }>;
        }>;
        "tls"?: Array<{
            "match"?: Array<{
                /**
                 * IPv4 or IPv6 ip addresses of destination with optional subnet.
                 */
                "destinationSubnets"?: Array<string>;
                /**
                 * Names of gateways where the rule should be applied.
                 */
                "gateways"?: Array<string>;
                /**
                 * Specifies the port on the host that is being addressed.
                 */
                "port"?: number;
                /**
                 * SNI (server name indicator) to match on.
                 */
                "sniHosts"?: Array<string>;
                "sourceLabels"?: {
                    [key: string]: string;
                };
                /**
                 * Source namespace constraining the applicability of a rule to workloads in that namespace.
                 */
                "sourceNamespace"?: string;
            }>;
            /**
             * The destination to which the connection should be forwarded to.
             */
            "route"?: Array<{
                "destination"?: {
                    /**
                     * The name of a service from the service registry.
                     */
                    "host"?: string;
                    /**
                     * Specifies the port on the host that is being addressed.
                     */
                    "port"?: {
                        "number"?: number;
                    };
                    /**
                     * The name of a subset within the service.
                     */
                    "subset"?: string;
                };
                /**
                 * Weight specifies the relative proportion of traffic to be forwarded to the destination.
                 */
                "weight"?: number;
            }>;
        }>;
    };
    
  }
  
  
  RegisterKind(VirtualServiceKind  , {
    group: "networking.istio.io",
    version: "v1beta1",
    kind: "VirtualService",
  });
  


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

  When(VirtualServiceKind )
    .IsCreated()
    .WithName("example-2")
    .Then(async vs => {
        vs.SetLabel("blah","blah")
 //       vs.Raw.spec.tls[0].match[0].sniHosts

     });

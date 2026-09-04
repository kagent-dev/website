---
title: kagent
linkTitle: Helm Chart Configuration
description: kagent Helm chart configuration reference
weight: 2
author: kagent.dev
---

A Helm chart for kagent, built with Google ADK

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| `${SUBSTRATE_REPO}` | substrate | `${SUBSTRATE_VERSION}` |
| file://../tools/grafana-mcp | grafana-mcp |  |
| file://../tools/querydoc | querydoc |  |
| https://oauth2-proxy.github.io/manifests | oauth2-proxy | ~10.7.0 |
| oci://ghcr.io/kagent-dev/kmcp/helm | kmcp | `${KMCP_VERSION}` |
| oci://ghcr.io/kagent-dev/tools/helm | kagent-tools | 0.2.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| annotations | object | `{}` | Additional annotations to add to all Kubernetes deployment resources |
| controller.a2aBaseUrl | string | `http://<fullname>-controller.<namespace>.svc:<port>` | The base URL of the A2A Server endpoint, as advertised to clients. |
| controller.a2aClientTimeout | string | "" (no timeout) | HTTP client timeout for A2A requests from the controller to agent pods. 0 (the default) means no timeout, which is correct for SSE-based streaming agents that can run for an arbitrarily long time. The previous implicit default was 3m (inherited from the a2a-go SDK), which caused `context deadline exceeded` errors for agents that take longer than 3 minutes to complete. Set a positive Go duration string (e.g. "30m", "1h") only if you need a hard upper bound on individual A2A calls. |
| controller.a2aGatewayUrl | string | `http://<fullname>-controller.<namespace>.svc:<grpc-port>` | Public gRPC URL advertised by AgentInstance Agent Cards. |
| controller.affinity | object | `{}` | [Affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for the controller pod. |
| controller.agentImage.registry | string | `""` |  |
| controller.agentImage.repository | string | `"kagent-dev/kagent/app"` |  |
| controller.agentImage.tag | string | `""` |  |
| controller.annotations | object | `{}` | Additional annotations to add to the controller Deployment metadata |
| controller.auth.mode | string | `"unsecure"` |  |
| controller.auth.userIdClaim | string | `""` |  |
| controller.env | list | `[]` |  |
| controller.envFrom | list | `[]` |  |
| controller.goAgentImage | object | `{"registry":"","repository":"kagent-dev/kagent/golang-adk","tag":""}` | The image used for the Go (ADK) runtime agent. |
| controller.grpc | object | `{"bindAddress":":8084","maxMessageBytes":16777216,"reflection":false,"tlsCertFile":"","tlsKeyFile":""}` | Native gRPC application API settings. This port is internal unless a separate TLS-capable GRPCRoute or ingress is configured. |
| controller.image.pullPolicy | string | `""` |  |
| controller.image.registry | string | `""` |  |
| controller.image.repository | string | `"kagent-dev/kagent/controller"` |  |
| controller.image.tag | string | `""` |  |
| controller.loglevel | string | `"info"` |  |
| controller.mcpEgressPlaintext | bool | `false` | Rewrite RemoteMCPServer tool URLs and the controller's tool-discovery dial from `https://host[:port]` to `http://host:<port-or-443>` so MCP traffic egresses in plaintext to a proxy that originates TLS upstream off by default. |
| controller.metrics | object | disabled | Prometheus-style /metrics endpoint for the controller manager. When enabled, provisions a dedicated metrics Service plus the ClusterRoles required for authenticated scrapes. Bind `<fullname>-metrics-reader` to your Prometheus ServiceAccount to grant scrape access. Use `bindAddress` for any port change: the Service `targetPort` and the pod `containerPort` are derived from it at template time, so overriding `METRICS_BIND_ADDRESS` via `controller.env` shifts only the runtime listener and leaves the rendered Service pointing at the chart-time port. Setting `bindAddress: "0"` (or empty) is treated as a disable signal — equivalent to `enabled: false` — to keep faith with the controller binary's documented contract for `--metrics-bind-address`. |
| controller.nodeSelector | object | `{}` | Node labels to match for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| controller.pdb | object | `{"annotations":{},"enabled":false,"labels":{},"maxUnavailable":1,"minAvailable":null,"unhealthyPodEvictionPolicy":""}` | [PodDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) for the controller pods. Disabled by default: `controller.replicas` is 1, and a `minAvailable: 1` budget on a single-replica Deployment blocks every voluntary eviction, so node drains and cluster upgrades hang indefinitely. Raise `controller.replicas` before switching to `minAvailable`. |
| controller.pdb.annotations | object | `{}` | Annotations for the controller PodDisruptionBudget. |
| controller.pdb.enabled | bool | `false` | Set to true to create the PodDisruptionBudget. |
| controller.pdb.labels | object | `{}` | Additional labels for the controller PodDisruptionBudget. |
| controller.pdb.maxUnavailable | int | `1` | Maximum number of pods that may be unavailable. Int or percentage string (e.g. `1` or `"50%"`). Mutually exclusive with `minAvailable`. |
| controller.pdb.minAvailable | string | unset (`maxUnavailable` is used instead) | Minimum number of pods that must remain available. Int or percentage string (e.g. `1` or `"50%"`). Mutually exclusive with `maxUnavailable`. |
| controller.pdb.unhealthyPodEvictionPolicy | string | "" (defer to the Kubernetes default) | `spec.unhealthyPodEvictionPolicy`, one of `IfHealthyBudget` (the Kubernetes default) or `AlwaysAllow`. `AlwaysAllow` lets unhealthy pods be evicted even when the budget is exhausted, which avoids drains wedging on a crash-looping pod. Requires Kubernetes >= 1.27. Omitted from the manifest when empty. |
| controller.podAnnotations | object | `{}` |  |
| controller.podLabels | object | `{}` | Additional labels for the controller pod template, merged over the global `podLabels` (per-key; component keys win). Selector labels can never be overridden. |
| controller.readinessProbe | object | httpGet /health on port http, periodSeconds=30 | Custom readiness probe for the controller container. Setting a value replaces the default probe entirely — include a handler (httpGet / exec / tcpSocket / grpc) when overriding. |
| controller.replicas | int | `1` |  |
| controller.resources.limits.cpu | int | `2` |  |
| controller.resources.limits.memory | string | `"512Mi"` |  |
| controller.resources.requests.cpu | string | `"100m"` |  |
| controller.resources.requests.memory | string | `"128Mi"` |  |
| controller.service.annotations | object | `{}` |  |
| controller.service.ports.grpc | int | `8084` |  |
| controller.service.ports.port | int | `8083` |  |
| controller.service.ports.targetPort | int | `8083` |  |
| controller.service.type | string | `"ClusterIP"` |  |
| controller.serviceAccount | object | `{"annotations":{}}` | ServiceAccount settings for the controller pod |
| controller.serviceAccount.annotations | object | {} (no extra annotations) | Annotations to add to the controller ServiceAccount. Useful for GCP Workload Identity, AWS IRSA, or Azure Workload Identity. |
| controller.skillsInitImage | object | `{"registry":"","repository":"kagent-dev/kagent/skills-init","tag":""}` | The image used by the skills-init container to clone skills from Git and pull OCI skill images. |
| controller.startupProbe | object | httpGet /health on port http, periodSeconds=15, initialDelaySeconds=15 | Custom startup probe for the controller container. Setting a value replaces the default probe entirely — include a handler (httpGet / exec / tcpSocket / grpc) when overriding. |
| controller.streaming | string | `nil` | @deprecated Removed in 0.10.0. The A2A SDK now handles SSE buffering and timeouts internally. These values have no effect and will be removed in a future release. |
| controller.substrate.ateApiEndpoint | string | `""` |  |
| controller.substrate.ateApiServer.namespace | string | `"ate-system"` |  |
| controller.substrate.ateApiServer.serviceAccount | string | `"ate-api-server"` |  |
| controller.substrate.atenetRouterURL | string | `""` |  |
| controller.substrate.defaultWorkerPool.name | string | `""` |  |
| controller.substrate.defaultWorkerPool.namespace | string | `""` |  |
| controller.substrate.enabled | bool | `false` |  |
| controller.tolerations | list | `[]` | Node taints which will be tolerated for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| controller.topologySpreadConstraints | list | `[]` | [Topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#pod-topology-spread-constraints) for the controller pod. |
| controller.volumeMounts | list | `[]` |  |
| controller.volumes | list | `[]` |  |
| controller.watchNamespaces | list | [] (watches all available namespaces) | Namespaces the controller should watch. If empty, the controller will watch ALL available namespaces. |
| database.postgres.bundled | object | `{"enabled":true,"image":{"name":"postgres","pullPolicy":"IfNotPresent","registry":"docker.io","repository":"library","tag":"18.3-alpine"},"podSecurityContext":{"fsGroup":999,"runAsGroup":999,"runAsNonRoot":true,"runAsUser":999,"seccompProfile":{"type":"RuntimeDefault"}},"resources":{"limits":{"cpu":"500m","memory":"512Mi"},"requests":{"cpu":"250m","memory":"256Mi"}},"securityContext":{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}},"storage":"500Mi","storageClassName":""}` | Bundled PostgreSQL instance — for development and evaluation only. Not suitable for production. Deployed when enabled is true and url/urlFile are not set. |
| database.postgres.bundled.enabled | bool | `true` | Set to false to disable the bundled database and provide your own via url or urlFile. |
| database.postgres.bundled.image.name | string | `"postgres"` | Bundled PostgreSQL image name |
| database.postgres.bundled.image.pullPolicy | string | `"IfNotPresent"` | Bundled PostgreSQL image pull policy |
| database.postgres.bundled.image.registry | string | `"docker.io"` | Bundled PostgreSQL image registry |
| database.postgres.bundled.image.repository | string | `"library"` | Bundled PostgreSQL image repository (org/namespace) |
| database.postgres.bundled.image.tag | string | `"18.3-alpine"` | Bundled PostgreSQL image tag |
| database.postgres.bundled.podSecurityContext | object | `{"fsGroup":999,"runAsGroup":999,"runAsNonRoot":true,"runAsUser":999,"seccompProfile":{"type":"RuntimeDefault"}}` | Pod-level security context for the bundled PostgreSQL deployment. |
| database.postgres.bundled.resources | object | `{"limits":{"cpu":"500m","memory":"512Mi"},"requests":{"cpu":"250m","memory":"256Mi"}}` | Resource requests/limits for the demo PostgreSQL container |
| database.postgres.bundled.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}}` | Container-level security context for the bundled PostgreSQL container. |
| database.postgres.bundled.storage | string | `"500Mi"` | PersistentVolumeClaim size for demo PostgreSQL data |
| database.postgres.bundled.storageClassName | string | `""` | StorageClass for the PostgreSQL PVC. Defaults to the cluster default when empty. |
| database.postgres.pool | object | `{"maxConnIdleTime":"","maxConnLifetime":"","maxConns":null,"minConns":null}` | Optional pgxpool settings. Leave unset/null to keep pgx library defaults (MaxConns≈max(4,NumCPU), MinConns=0, MaxConnIdleTime=30m, MaxConnLifetime=1h). |
| database.postgres.sessionRetentionDays | int | `0` | Hard-delete idle sessions (and cascaded events/tasks/checkpoints/shares) after N days of no activity. Uses session.updated_at as a sliding idle clock (writes refresh it). 0 disables cleanup (default, existing installs unchanged). |
| database.postgres.skipMigrations | bool | `false` | Skip running database migrations at controller startup. The controller instead verifies the database is already migrated and fails if it is not. Migrations must be applied out-of-band (e.g. from a CI/CD pipeline) before install/upgrade. |
| database.postgres.url | string | `""` | External PostgreSQL connection string. Is always used if set regardless of the `.bundled.enabled` field. |
| database.postgres.urlFile | string | `""` | Path to a file containing the database URL. Takes precedence over url when set. Is always used if set regardless of the `.bundled.enabled` field. |
| database.postgres.vectorEnabled | bool | `false` | Enable the pgvector migration Required to use features that depend on database vector capability. (e.g. long-term memory) Set to true when using an external PostgreSQL that has the pgvector extension installed. |
| extraObjects | list | [] | Additional arbitrary Kubernetes manifests to deploy alongside the chart. Each list entry is rendered through `tpl`, so values may reference the release context (e.g. `{{ include "kagent.fullname" . }}`, `{{ .Release.Namespace }}`). Both map and multi-line string entries are supported. Use this to manage resources such as ExternalSecret, HTTPRoute, or NetworkPolicy within the same chart lifecycle without maintaining a separate chart.  To use, replace the empty list below with your manifests, e.g.:   extraObjects:     - apiVersion: external-secrets.io/v1       kind: ExternalSecret       metadata:         name: '`{{ include "kagent.fullname" . }}`-openai'         namespace: '`{{ .Release.Namespace }}`'       spec:         secretStoreRef:           name: aws-secretsmanager           kind: ClusterSecretStore         target:           name: kagent-openai         data:           - secretKey: OPENAI_API_KEY             remoteRef:               key: prod/kagent/openai               property: api_key |
| fullnameOverride | string | `""` |  |
| grafana-mcp.enabled | bool | `true` |  |
| grafana-mcp.grafana.serviceAccountToken | string | `""` |  |
| grafana-mcp.grafana.url | string | `"grafana.kagent:3000/api"` |  |
| grafana-mcp.resources.limits.cpu | string | `"500m"` |  |
| grafana-mcp.resources.limits.memory | string | `"512Mi"` |  |
| grafana-mcp.resources.requests.cpu | string | `"100m"` |  |
| grafana-mcp.resources.requests.memory | string | `"128Mi"` |  |
| imagePullPolicy | string | `"IfNotPresent"` |  |
| imagePullSecrets | list | `[]` |  |
| ipv6 | object | false | Enable IPv6/dual-stack support. When true, configures all components for dual-stack (IPv4+IPv6) networking:   - nginx listens on both IPv4 and IPv6 (adds `listen [::]:8080`)   - Next.js binds to `::` instead of `0.0.0.0`   - Agent pods bind to `::` for dual-stack reachability Leave disabled on clusters where IPv6 is disabled at the kernel level. |
| kagent-tools.enabled | bool | `true` |  |
| kagent-tools.nameOverride | string | `"tools"` |  |
| kagent-tools.nodeSelector | object | `{}` | Node labels to match for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| kagent-tools.podSecurityContext.runAsNonRoot | bool | `true` |  |
| kagent-tools.podSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` |  |
| kagent-tools.replicaCount | int | `1` |  |
| kagent-tools.resources.limits.memory | string | `"256Mi"` |  |
| kagent-tools.resources.requests.cpu | string | `"50m"` |  |
| kagent-tools.resources.requests.memory | string | `"128Mi"` |  |
| kagent-tools.securityContext.allowPrivilegeEscalation | bool | `false` |  |
| kagent-tools.securityContext.capabilities.drop[0] | string | `"ALL"` |  |
| kagent-tools.securityContext.readOnlyRootFilesystem | bool | `true` |  |
| kagent-tools.tolerations | list | `[]` | Node taints which will be tolerated for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| kagent-tools.tools.loglevel | string | `"debug"` |  |
| kagent-tools.tools.metrics.port | int | `8085` |  |
| kmcp.enabled | bool | `true` |  |
| kmcp.fullnameOverride | string | `""` |  |
| kmcp.nameOverride | string | `"kmcp"` |  |
| kmcp.namespaceOverride | string | `""` |  |
| labels | object | `{}` | Additional labels to add to all Kubernetes resources |
| nameOverride | string | `""` |  |
| namespaceOverride | string | `.Release.Namespace` | Override the namespace |
| nodeSelector | object | `{}` | Node labels to match for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| oauth2-proxy.config.clientID | string | `""` |  |
| oauth2-proxy.config.clientSecret | string | `""` |  |
| oauth2-proxy.config.cookieSecret | string | `""` |  |
| oauth2-proxy.config.existingSecret | string | `""` |  |
| oauth2-proxy.enabled | bool | `false` |  |
| oauth2-proxy.extraArgs.approval-prompt | string | `"auto"` |  |
| oauth2-proxy.extraArgs.cookie-samesite | string | `"lax"` |  |
| oauth2-proxy.extraArgs.cookie-secure | bool | `true` |  |
| oauth2-proxy.extraArgs.custom-templates-dir | string | `"/templates"` |  |
| oauth2-proxy.extraArgs.email-domain | string | `"*"` |  |
| oauth2-proxy.extraArgs.oidc-issuer-url | string | `"$(OIDC_ISSUER_URL)"` |  |
| oauth2-proxy.extraArgs.pass-authorization-header | bool | `true` |  |
| oauth2-proxy.extraArgs.provider | string | `"oidc"` |  |
| oauth2-proxy.extraArgs.redirect-url | string | `"$(OIDC_REDIRECT_URL)"` |  |
| oauth2-proxy.extraArgs.scope | string | `"openid profile email groups"` |  |
| oauth2-proxy.extraArgs.set-authorization-header | bool | `true` |  |
| oauth2-proxy.extraArgs.skip-auth-regex | string | `"^/(login|_next/static|_next/image|login-bg\\.(jpg|png|webp)|logo-.*\\.png|favicon\\.ico|api/agentharnesses/.*/gateway).*$"` |  |
| oauth2-proxy.extraArgs.skip-auth-route | string | `"^/(health|login)$"` |  |
| oauth2-proxy.extraArgs.skip-jwt-bearer-tokens | bool | `true` |  |
| oauth2-proxy.extraArgs.upstream | string | `"$(UPSTREAM_URL)"` |  |
| oauth2-proxy.extraEnv[0].name | string | `"OIDC_ISSUER_URL"` |  |
| oauth2-proxy.extraEnv[0].value | string | `""` |  |
| oauth2-proxy.extraEnv[1].name | string | `"OIDC_REDIRECT_URL"` |  |
| oauth2-proxy.extraEnv[1].value | string | `""` |  |
| oauth2-proxy.extraEnv[2].name | string | `"UPSTREAM_URL"` |  |
| oauth2-proxy.extraEnv[2].value | string | `"http://kagent-ui:8080"` |  |
| oauth2-proxy.extraVolumeMounts[0].mountPath | string | `"/templates"` |  |
| oauth2-proxy.extraVolumeMounts[0].name | string | `"custom-templates"` |  |
| oauth2-proxy.extraVolumeMounts[0].readOnly | bool | `true` |  |
| oauth2-proxy.extraVolumes[0].configMap.name | string | `"kagent-oauth2-proxy-templates"` |  |
| oauth2-proxy.extraVolumes[0].name | string | `"custom-templates"` |  |
| oauth2-proxy.service.portNumber | int | `4180` |  |
| oauth2-proxy.service.type | string | `"ClusterIP"` |  |
| oauth2-proxy.sessionStorage.type | string | `"cookie"` |  |
| otel.logging.enabled | bool | `false` |  |
| otel.logging.exporter.otlp.endpoint | string | `""` |  |
| otel.logging.exporter.otlp.insecure | bool | `true` |  |
| otel.logging.exporter.otlp.timeout | int | `15000` |  |
| otel.tracing.enabled | bool | `false` |  |
| otel.tracing.exporter.otlp.endpoint | string | `""` |  |
| otel.tracing.exporter.otlp.insecure | bool | `true` |  |
| otel.tracing.exporter.otlp.protocol | string | `"grpc"` |  |
| otel.tracing.exporter.otlp.timeout | int | `15000` |  |
| podAnnotations | object | `{}` |  |
| podLabels | object | `{}` | Additional labels to add to all pod templates (merged into pod labels of the controller and UI Deployments; can be overridden per component). Useful for admission policies that require specific labels on pods. |
| podSecurityContext | object | `{"runAsNonRoot":true,"seccompProfile":{"type":"RuntimeDefault"}}` | Security context for all pods |
| providers.annotations | object | `{}` | Annotations added to the metadata of the generated default ModelConfig (the one derived from `providers.default`). Omitted from the resource when empty. |
| providers.anthropic.apiKeySecretKey | string | `"ANTHROPIC_API_KEY"` |  |
| providers.anthropic.apiKeySecretRef | string | `"kagent-anthropic"` |  |
| providers.anthropic.model | string | `"claude-haiku-4-5"` |  |
| providers.anthropic.provider | string | `"Anthropic"` |  |
| providers.azureOpenAI.apiKeySecretKey | string | `"AZUREOPENAI_API_KEY"` |  |
| providers.azureOpenAI.apiKeySecretRef | string | `"kagent-azure-openai"` |  |
| providers.azureOpenAI.config.apiVersion | string | `"2023-05-15"` |  |
| providers.azureOpenAI.config.azureAdToken | string | `""` |  |
| providers.azureOpenAI.config.azureDeployment | string | `""` |  |
| providers.azureOpenAI.config.azureEndpoint | string | `""` |  |
| providers.azureOpenAI.model | string | `"gpt-4.1-mini"` |  |
| providers.azureOpenAI.provider | string | `"AzureOpenAI"` |  |
| providers.default | string | `"openAI"` |  |
| providers.gemini.apiKeySecretKey | string | `"GOOGLE_API_KEY"` |  |
| providers.gemini.apiKeySecretRef | string | `"kagent-gemini"` |  |
| providers.gemini.model | string | `"gemini-2.5-flash-lite"` |  |
| providers.gemini.provider | string | `"Gemini"` |  |
| providers.ollama.config.host | string | `"host.docker.internal:11434"` |  |
| providers.ollama.config.options.num_ctx | string | `"64000"` |  |
| providers.ollama.model | string | `"llama3.2"` |  |
| providers.ollama.provider | string | `"Ollama"` |  |
| providers.openAI.apiKeySecretKey | string | `"OPENAI_API_KEY"` |  |
| providers.openAI.apiKeySecretRef | string | `"kagent-openai"` |  |
| providers.openAI.model | string | `"gpt-4.1-mini"` |  |
| providers.openAI.provider | string | `"OpenAI"` |  |
| proxy.url | string | `""` |  |
| querydoc.enabled | bool | `true` |  |
| querydoc.image.pullPolicy | string | `"IfNotPresent"` |  |
| querydoc.image.registry | string | `"ghcr.io"` |  |
| querydoc.image.repository | string | `"kagent-dev/doc2vec/mcp"` |  |
| querydoc.image.tag | string | `"1.1.14"` |  |
| querydoc.openai.apiKey | string | `""` |  |
| querydoc.replicas | int | `1` |  |
| querydoc.resources.limits.cpu | string | `"500m"` |  |
| querydoc.resources.limits.memory | string | `"512Mi"` |  |
| querydoc.resources.requests.cpu | string | `"100m"` |  |
| querydoc.resources.requests.memory | string | `"128Mi"` |  |
| rbac.namespaces | list | `[]` | Namespaces in which to create Role and RoleBinding resources. If empty (default), the chart creates cluster-scoped ClusterRole and ClusterRoleBinding resources and the controller watches all namespaces. If set, the chart creates a Role + RoleBinding per listed namespace and the controller's WATCH_NAMESPACES is derived from this list (unless controller.watchNamespaces is set explicitly, which always takes precedence). |
| registry | string | `"ghcr.io"` |  |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true}` | Security context for all containers |
| substrate.enabled | bool | `false` |  |
| substrateWorkerPool | object | `{"ateomImage":"","create":false,"labels":{},"name":"kagent-default","replicas":1,"sandboxClass":"gvisor","template":{}}` | Optional Agent Substrate WorkerPool installed by this chart. This is platform capacity and is not owned by individual AgentHarness resources. |
| tag | string | `""` |  |
| tolerations | list | `[]` | Node taints which will be tolerated for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| ui.additionalForwardedHeaders | list | `[]` | Additional request headers (beyond Authorization) the UI proxy will forward to the backend. Names are case-insensitive. Hop-by-hop headers (Connection, Transfer-Encoding, etc.) are silently dropped. |
| ui.affinity | object | `{}` | [Affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) rules for the UI pod. |
| ui.annotations | object | `{}` | Additional annotations to add to the UI Deployment metadata |
| ui.auth.ssoRedirectPath | string | `"/oauth2/start"` |  |
| ui.backendGrpcUrl | string | `""` |  |
| ui.backendInternalUrl | string | `""` |  |
| ui.env | object | `{}` |  |
| ui.externalUrl | string | "" (share tools return paths only) | Public-facing base URL of the UI (e.g. https://kagent.example.com). When set, the controller injects KAGENT_UI_URL into agent pods so that share link tools return full clickable URLs instead of relative paths. |
| ui.httpRoute | object | `{"annotations":{},"enabled":false,"hostnames":[],"labels":{},"parentRefs":[],"rules":[]}` | Gateway API `HTTPRoute` for the UI. Requires the Gateway API CRDs (`gateway.networking.k8s.io/v1`) and an existing `Gateway` to attach to via `parentRefs`. Disabled by default; enable to front the UI with a Gateway API implementation (kgateway, Istio, Envoy Gateway, etc.) instead of the OpenShift Route or bundled oauth2-proxy. |
| ui.httpRoute.annotations | object | `{}` | Annotations to add to the `HTTPRoute`. |
| ui.httpRoute.hostnames | list | `[]` | Hostnames matched by the route. |
| ui.httpRoute.labels | object | `{}` | Extra labels to add to the `HTTPRoute` (merged with the chart labels). |
| ui.httpRoute.parentRefs | list | `[]` | Gateways this route attaches to. Required when `enabled` is `true`. |
| ui.httpRoute.rules | list | `[]` | Routing rules. When a rule omits `backendRefs`, it defaults to the UI `Service` on `ui.service.ports.port`. Each rule may also set `matches`, `filters`, and `timeouts`. |
| ui.image.pullPolicy | string | `""` |  |
| ui.image.registry | string | `""` |  |
| ui.image.repository | string | `"kagent-dev/kagent/ui"` |  |
| ui.image.tag | string | `""` |  |
| ui.nginx | object | `{"proxyReadTimeout":"1800s","proxySendTimeout":"1800s"}` | Nginx proxy timeout configuration for the UI sidecar (values are passed directly to the corresponding nginx directives, e.g. "1800s"). |
| ui.nginx.proxyReadTimeout | string | `"1800s"` | proxy_read_timeout: max time between two successive reads from the upstream. |
| ui.nginx.proxySendTimeout | string | `"1800s"` | proxy_send_timeout: max time between two successive writes to the upstream. |
| ui.nodeSelector | object | `{}` | Node labels to match for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| ui.openshiftRoute.annotations."haproxy.router.openshift.io/timeout" | string | `"120m"` |  |
| ui.pdb | object | `{"annotations":{},"enabled":false,"labels":{},"maxUnavailable":1,"minAvailable":null,"unhealthyPodEvictionPolicy":""}` | [PodDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) for the UI pods. Disabled by default: `ui.replicas` is 1, and a `minAvailable: 1` budget on a single-replica Deployment blocks every voluntary eviction, so node drains and cluster upgrades hang indefinitely. Raise `ui.replicas` before switching to `minAvailable`. |
| ui.pdb.annotations | object | `{}` | Annotations for the UI PodDisruptionBudget. |
| ui.pdb.enabled | bool | `false` | Set to true to create the PodDisruptionBudget. |
| ui.pdb.labels | object | `{}` | Additional labels for the UI PodDisruptionBudget. |
| ui.pdb.maxUnavailable | int | `1` | Maximum number of pods that may be unavailable. Int or percentage string (e.g. `1` or `"50%"`). Mutually exclusive with `minAvailable`. |
| ui.pdb.minAvailable | string | unset (`maxUnavailable` is used instead) | Minimum number of pods that must remain available. Int or percentage string (e.g. `1` or `"50%"`). Mutually exclusive with `maxUnavailable`. |
| ui.pdb.unhealthyPodEvictionPolicy | string | "" (defer to the Kubernetes default) | `spec.unhealthyPodEvictionPolicy`, one of `IfHealthyBudget` (the Kubernetes default) or `AlwaysAllow`. `AlwaysAllow` lets unhealthy pods be evicted even when the budget is exhausted, which avoids drains wedging on a crash-looping pod. Requires Kubernetes >= 1.27. Omitted from the manifest when empty. |
| ui.podAnnotations | object | `{}` |  |
| ui.podLabels | object | `{}` | Additional labels for the UI pod template, merged over the global `podLabels` (per-key; component keys win). Selector labels can never be overridden. |
| ui.podSecurityContext | object | (uses global podSecurityContext) | Pod-level security context for the UI pod. Overrides the global podSecurityContext. |
| ui.publicBackendUrl | string | `"/api"` |  |
| ui.readinessProbe | object | httpGet /health on port http, periodSeconds=30 | Custom readiness probe for the UI container. Override to adjust thresholds, use exec-based probes, or change the health path. |
| ui.replicas | int | `1` |  |
| ui.resources.limits.cpu | string | `"1000m"` |  |
| ui.resources.limits.memory | string | `"1Gi"` |  |
| ui.resources.requests.cpu | string | `"100m"` |  |
| ui.resources.requests.memory | string | `"256Mi"` |  |
| ui.route | object | `{"enabled":true}` | Gates the OpenShift `Route` for the UI. Additionally conditional on the `route.openshift.io/v1` API being present, so it is a no-op off-OpenShift. Set to `false` to front the UI with your own Route/ingress or the bundled oauth2-proxy instead of the chart's edge-terminated Route. |
| ui.securityContext | object | (uses global securityContext) | Container-level security context for the UI container. Overrides the global securityContext. |
| ui.service.annotations | object | `{}` |  |
| ui.service.ports.port | int | `8080` |  |
| ui.service.ports.targetPort | int | `8080` |  |
| ui.service.type | string | `"ClusterIP"` |  |
| ui.serviceAccount | object | `{"annotations":{}}` | ServiceAccount settings for the UI pod |
| ui.serviceAccount.annotations | object | {} (no extra annotations) | Annotations to add to the UI ServiceAccount. Useful for GCP Workload Identity, AWS IRSA, or Azure Workload Identity. |
| ui.startupProbe | object | httpGet /health on port http, periodSeconds=1, initialDelaySeconds=1 | Custom startup probe for the UI container. Override to adjust thresholds, use exec-based probes, or change the health path. |
| ui.streamTimeoutSeconds | int | `1800` | Client-side chat stream inactivity timeout (seconds). The browser aborts a streaming response if no event is received within this window. Should be >= ui.nginx.proxyReadTimeout so nginx isn't the silent limit. Default 1800 (30m). |
| ui.tolerations | list | `[]` | Node taints which will be tolerated for `Pod` [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). |
| ui.topologySpreadConstraints | list | `[]` | [Topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#pod-topology-spread-constraints) for the UI pod. |
| ui.volumes | object | `{"nextjsCache":"100Mi","tmp":"50Mi"}` | EmptyDir volume sizes for Next.js UI workload (typically used when enabling readOnlyRootFilesystem) |
| ui.volumes.nextjsCache | string | `"100Mi"` | Size limit for Next.js build cache (.next/cache). Default 100Mi is sufficient for typical Next.js apps with moderate caching needs. |
| ui.volumes.tmp | string | `"50Mi"` | Size limit for temporary files (/tmp). Default 50Mi provides ample space for Next.js runtime temporary data. |

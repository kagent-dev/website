---
title: Tools ecosystem
description: Look up the MCP server that a kagent installation ships with, the tools that it serves, and the community servers that you can add.
weight: 40
author: kagent.dev
---

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation ships with one {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server already registered, and you can register more of your own. This page lists what is installed, what the installed server serves, and how to narrow the set. For the schema that binds a server to an agent, see [About tools]({{< link path="skills-and-mcp/about-tools#mcp-tools" >}}).

## Server that a kagent installation registers

The kagent chart installs the tool server as a subchart, which the `kagent-tools.enabled` Helm value turns on. The subchart creates the [`kagent-tool-server`](#kagent-tool-server) {{< gloss "RemoteMCPServer" >}}RemoteMCPServer{{< /gloss >}} in the kagent namespace. The server serves tools for Kubernetes, Helm, Istio, Cilium, Argo Rollouts, Prometheus, and Kubescape. kagent does not bind the server to an agent, so an agent reaches the server's tools only through a {{< gloss "Tool binding" >}}tool binding{{< /gloss >}} that you add to its {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}.

The kagent release pins the `kagent-tool-server` version, which is currently {{< reuse "kagent-docs/versions/kagent-tools.md" >}}. For the full set of pinned component versions, see [Version support]({{< link path="reference/versions#what-a-kagent-release-includes" >}}).

## Read the tools that a server serves

The kagent controller connects to each RemoteMCPServer, asks the server which tools it serves, and records the answer in `status.discoveredTools`. That status reports the tools of the server that your cluster actually runs, so the status is more reliable than any list on this page.

```sh
kubectl get remotemcpserver kagent-tool-server -n kagent \
  -o jsonpath='{range .status.discoveredTools[*]}{.name}{"\t"}{.description}{"\n"}{end}'
```

For the same command as the first step of binding one of these tools to an agent, see [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool#bind-the-tool-to-your-agenttemplate" >}}).

> [!NOTE]
> `status.discoveredTools` stays empty until the controller completes a discovery pass. `status.observedGeneration` tells you whether the recorded set matches the current spec. A server whose `Accepted` condition is not `True` has not been reached at all. A server that opts out of discovery is the exception, because it is `Accepted` and its tool list stays empty permanently. To tell the two apart, read the `Accepted` condition's reason, as described in [Turn tool discovery off for a server](#turn-tool-discovery-off-for-a-server).

### Turn tool discovery off for a server

The controller lists a server's tools with the controller's own credentials. A server that authenticates every caller individually, such as one that expects each agent's own propagated token, does not accept any credential that the controller can present. Discovery against that server fails. Because the listing never succeeds, the RemoteMCPServer stays un-`Accepted` indefinitely, even though agents can reach the server at runtime.

To resolve this issue, label the server with `kagent.dev/discovery=disabled`. The controller accepts the server without listing its tools, and the agents that bind it resolve the tool list at runtime with their own credentials.

```sh
kubectl label remotemcpserver <name> -n <namespace> kagent.dev/discovery=disabled
```

The label has the following effects on the server:

- The `Accepted` condition becomes `True` with the reason `DiscoveryDisabled`, rather than reporting a discovery failure.
- `status.discoveredTools` stays empty, so the command in [Read the tools that a server serves](#read-the-tools-that-a-server-serves) does not return tools for this server. The server's own documentation becomes the only list of what it offers.
- The catalog keeps the server but records it as disconnected and without tools.

> [!NOTE]
> Use this label only when controller-side discovery cannot succeed. Binding specific tools by name in an AgentTemplate still works against a server that has discovery turned off. However, admission does not validate those names, so a typo surfaces as a failed tool call at runtime instead of a rejected binding.

## kagent-tool-server

One Go binary serves every tool in this section, grouped into providers. A provider's tools shell out to the matching command line tool inside the server's own container, so the Kubernetes, Helm, Istio, and Cilium providers act on your cluster with the server's ServiceAccount rather than with the caller's credentials.

Tools marked `*` perform write operations, and `--read-only` skips them at registration. The following sections list each provider's tools by the name that an agent sees.

### Kubernetes

Agents use the Kubernetes provider the most. The provider covers both inspection and modification of any resource that `kubectl` can reach.

| Tool | Description |
| ---- | ----------- |
| `k8s_get_resources` | Get Kubernetes resources using kubectl. |
| `k8s_describe_resource` | Describe a Kubernetes resource in detail. |
| `k8s_get_resource_yaml` | Get the YAML representation of a Kubernetes resource. |
| `k8s_get_pod_logs` | Get logs from a Kubernetes pod. |
| `k8s_get_events` | Get events from a Kubernetes namespace. |
| `k8s_get_available_api_resources` | Get available Kubernetes API resources. |
| `k8s_get_cluster_configuration` | Get cluster configuration details. |
| `k8s_generate_resource` | Generate a Kubernetes resource YAML from a description. |
| `k8s_wait` | Wait for a condition on Kubernetes resources (kubectl wait). Blocks until the condition is met or the timeout elapses. |
| `k8s_apply_manifest` * | Apply a YAML manifest to the Kubernetes cluster. |
| `k8s_create_resource` * | Create a Kubernetes resource from YAML content. |
| `k8s_create_resource_from_url` * | Create a Kubernetes resource from a URL that points to a YAML manifest. |
| `k8s_patch_resource` * | Patch a Kubernetes resource using a strategic merge patch. |
| `k8s_patch_status` * | Patch the status of a Kubernetes resource. |
| `k8s_delete_resource` * | Delete a Kubernetes resource. |
| `k8s_scale` * | Scale a Kubernetes deployment. |
| `k8s_rollout` * | Perform rollout operations on Kubernetes resources, including history, pause, restart, resume, status, and undo. |
| `k8s_label_resource` * | Add or update labels on a Kubernetes resource. |
| `k8s_remove_label` * | Remove a label from a Kubernetes resource. |
| `k8s_annotate_resource` * | Add or update annotations on a Kubernetes resource. |
| `k8s_remove_annotation` * | Remove an annotation from a Kubernetes resource. |
| `k8s_execute_command` * | Execute a command in a Kubernetes pod. |
| `k8s_check_service_connectivity` * | Check connectivity to a service using a temporary curl pod. |

### Helm

The Helm provider manages releases and chart repositories with the Helm configuration inside the server's container, so a repository that one tool adds is available to the others.

| Tool | Description |
| ---- | ----------- |
| `helm_list_releases` | List Helm releases in a namespace. |
| `helm_get_release` | Get extended information about a Helm release. |
| `helm_repo_update` | Update information about available charts locally from chart repositories. |
| `helm_upgrade` * | Upgrade or install a Helm release. |
| `helm_uninstall` * | Uninstall a Helm release. |
| `helm_repo_add` * | Add a Helm repository. |

### Istio

Istio's tools wrap `istioctl`, and most of them read mesh state rather than change it. Waypoint management is the exception, because generating a waypoint resource and applying it are separate tools.

| Tool | Description |
| ---- | ----------- |
| `istio_proxy_status` | Get Envoy proxy status for pods, which retrieves the last sent and acknowledged xDS sync from Istiod to each Envoy in the mesh. |
| `istio_proxy_config` | Get the proxy configuration for a single pod. |
| `istio_analyze_cluster_configuration` | Analyze Istio cluster configuration for issues. |
| `istio_version` | Get Istio version information. |
| `istio_remote_clusters` | List remote clusters that are registered with Istio. |
| `istio_generate_manifest` | Generate an Istio manifest for a given profile. |
| `istio_list_waypoints` | List all waypoints in the mesh. |
| `istio_generate_waypoint` | Generate a waypoint resource YAML. |
| `istio_waypoint_status` | Get the status of a waypoint resource. |
| `istio_ztunnel_config` | Get the ztunnel configuration for a namespace. |
| `istio_install_istio` * | Install Istio with a specified configuration profile. |
| `istio_apply_waypoint` * | Apply a waypoint resource to the cluster. |
| `istio_delete_waypoint` * | Delete a waypoint resource from the cluster. |

### Argo Rollouts

Argo Rollouts tools cover progressive delivery. A rollout tool fails confusingly when the controller or one of its plugins is missing, so several of the tools verify the installation instead of acting on a rollout.

| Tool | Description |
| ---- | ----------- |
| `argo_rollouts_list` | List rollouts or experiments. |
| `argo_verify_argo_rollouts_controller_install` | Verify that the Argo Rollouts controller is installed and running. |
| `argo_verify_kubectl_plugin_install` | Verify that the kubectl Argo Rollouts plugin is installed. |
| `argo_check_plugin_logs` | Check the logs of the Argo Rollouts Gateway API plugin. |
| `argo_promote_rollout` * | Promote a paused rollout to the next step. |
| `argo_pause_rollout` * | Pause a rollout. |
| `argo_set_rollout_image` * | Set the image of a rollout. |
| `argo_verify_gateway_plugin` * | Verify the installation status of the Argo Rollouts Gateway API plugin. |

### Cilium

Cilium is the largest provider, with tools ranging from installation to individual BPF maps. An agent that can see every tool spends its context on tool descriptions, so bind only the tools that an agent needs.

| Tool | Description |
| ---- | ----------- |
| `cilium_status_and_version` | Get the status and version of the Cilium installation. |
| `cilium_get_daemon_status` | Get the status of the Cilium daemon for the cluster. |
| `cilium_show_features_status` | Show Cilium features status. |
| `cilium_show_configuration_options` | Show Cilium configuration options. |
| `cilium_request_debugging_information` | Request debugging information for the cluster. |
| `cilium_get_endpoints_list` | Get the list of all endpoints in the cluster. |
| `cilium_get_endpoint_details` | List the details of an endpoint in the cluster. |
| `cilium_get_endpoint_logs` | Get the logs of an endpoint in the cluster. |
| `cilium_get_endpoint_health` | Get the health of an endpoint in the cluster. |
| `cilium_list_identities` | List all identities in the cluster. |
| `cilium_get_identity_details` | Get the details of an identity in the cluster. |
| `cilium_list_services` | List services for the cluster. |
| `cilium_get_service_information` | Get information about a service in the cluster. |
| `cilium_validate_cilium_network_policies` | Validate Cilium network policies for the cluster. |
| `cilium_display_policy_node_information` | Display policy node information for the cluster. |
| `cilium_display_selectors` | Display selectors for the cluster. |
| `cilium_list_local_redirect_policies` | List local redirect policies for the cluster. |
| `cilium_show_cluster_mesh_status` | Show cluster mesh status. |
| `cilium_list_bgp_peers` | List BGP peers. |
| `cilium_list_bgp_routes` | List BGP routes. |
| `cilium_list_cluster_nodes` | List cluster nodes for the cluster. |
| `cilium_list_node_ids` | List node IDs for the cluster. |
| `cilium_list_ip_addresses` | List the IP addresses for the cluster. |
| `cilium_show_ip_cache_information` | Show the IP cache information for the cluster. |
| `cilium_show_dns_names` | Show the DNS names for the cluster. |
| `cilium_fqdn_cache` | Manage the FQDN cache for the cluster. |
| `cilium_display_encryption_state` | Display the encryption state for the cluster. |
| `cilium_list_envoy_config` | List the Envoy configuration for a resource in the cluster. |
| `cilium_show_load_information` | Show load information for the cluster. |
| `cilium_list_metrics` | List metrics for the cluster. |
| `cilium_list_bpf_maps` | List BPF maps for the cluster. |
| `cilium_get_bpf_map` | Get a BPF map for the cluster. |
| `cilium_list_bpf_map_events` | List BPF map events for the cluster. |
| `cilium_list_xdp_cidr_filters` | List XDP CIDR filters for the cluster. |
| `cilium_get_kv_store_key` | Get a key from the kvstore for the cluster. |
| `cilium_list_pcap_recorders` | List PCAP recorders for the cluster. |
| `cilium_get_pcap_recorder` | Get a PCAP recorder for the cluster. |
| `cilium_install_cilium` * | Install Cilium on the cluster. |
| `cilium_upgrade_cilium` * | Upgrade Cilium on the cluster. |
| `cilium_uninstall_cilium` * | Uninstall Cilium from the cluster. |
| `cilium_toggle_configuration_option` * | Toggle a Cilium configuration option. |
| `cilium_toggle_hubble` * | Enable or disable Hubble. |
| `cilium_toggle_cluster_mesh` * | Enable or disable cluster mesh. |
| `cilium_connect_to_remote_cluster` * | Connect to a remote cluster for cluster mesh. |
| `cilium_disconnect_remote_cluster` * | Disconnect from a remote cluster. |
| `cilium_manage_endpoint_labels` * | Add or delete the labels of an endpoint in the cluster. |
| `cilium_manage_endpoint_config` * | Manage the configuration of an endpoint in the cluster. |
| `cilium_disconnect_endpoint` * | Disconnect an endpoint from the network. |
| `cilium_update_service` * | Update a service in the cluster. |
| `cilium_delete_service` * | Delete a service from the cluster. |
| `cilium_delete_policy_rules` * | Delete policy rules for the cluster. |
| `cilium_update_xdp_cidr_filters` * | Update XDP CIDR filters for the cluster. |
| `cilium_delete_xdp_cidr_filters` * | Delete XDP CIDR filters for the cluster. |
| `cilium_set_kv_store_key` * | Set a key in the kvstore for the cluster. |
| `cilium_delete_key_from_kv_store` * | Delete a key from the kvstore for the cluster. |
| `cilium_flush_ipsec_state` * | Flush the IPsec state for the cluster. |
| `cilium_update_pcap_recorder` * | Update a PCAP recorder for the cluster. |
| `cilium_delete_pcap_recorder` * | Delete a PCAP recorder for the cluster. |

### Prometheus

The Prometheus provider queries a Prometheus server directly. Each tool takes the server's URL as an argument, and that argument defaults to `http://localhost:9090`. The default address does not resolve from inside the tool server's container, so have the agent pass the in-cluster address.

| Tool | Description |
| ---- | ----------- |
| `prometheus_query_tool` | Execute a PromQL query against Prometheus. |
| `prometheus_query_range_tool` | Execute a PromQL range query against Prometheus. |
| `prometheus_label_names_tool` | Get all available labels from Prometheus. |
| `prometheus_targets_tool` | Get all Prometheus targets and their status. |
| `prometheus_promql_tool` | Generate a PromQL query. |

### Kubescape

Kubescape's tools read scan results that the Kubescape operator has already produced, so the tools do not return useful results until that operator is installed and has completed a scan. Start with `kubescape_check_health`, which reports whether the rest of the provider can work.

| Tool | Description |
| ---- | ----------- |
| `kubescape_check_health` | Check whether the Kubescape operator is installed and operational, by verifying the namespace, operator pods, storage pods, CRDs, and scan data availability. |
| `kubescape_list_vulnerability_manifests` | List vulnerability manifests from the Kubescape operator, at image or workload level. |
| `kubescape_list_vulnerabilities` | List all CVEs in a specific vulnerability manifest, with a severity summary. |
| `kubescape_get_vulnerability_details` | Get details about a specific CVE in a vulnerability manifest, including affected packages and fix information. |
| `kubescape_list_configuration_scans` | List configuration security scan results, which show the workloads that have been scanned for misconfigurations. |
| `kubescape_get_configuration_scan` | Get configuration security scan results for a specific workload, including failed controls and remediation guidance. |
| `kubescape_list_application_profiles` | List the ApplicationProfiles that capture the runtime behavior of workloads. |
| `kubescape_get_application_profile` | Get the runtime behavior profile for a specific workload, including the processes that run and the files that are accessed. |
| `kubescape_list_network_neighborhoods` | List the NetworkNeighborhoods that record the observed network communication patterns of workloads. |
| `kubescape_get_network_neighborhood` | Get the observed ingress and egress connections for a specific workload. |

### Utilities

The utility tools do not belong to any product. `shell` runs an arbitrary command in the server's container with the server's ServiceAccount, so treat it as the widest permission that this server grants.

| Tool | Description |
| ---- | ----------- |
| `datetime_get_current_time` | Return the current date and time in ISO 8601 format. |
| `mcp_inspect` | Echo input and return all HTTP headers received with the MCP request for debugging. |
| `shell` * | Execute shell commands. |

## Narrow what kagent-tool-server serves

Serving every tool costs an agent context on every turn, and the full tool set grants the server broad authority over your cluster. Independent settings narrow the server, and each one acts at a different layer.

```yaml
kagent-tools:
  tools:
    enabledTools:
      - k8s
      - helm
    args:
      - "--read-only"
  rbac:
    readOnly: true
    additionalRules:
      - apiGroups: ["networking.istio.io"]
        resources: ["virtualservices", "destinationrules", "gateways"]
        verbs: ["get", "list", "watch"]
```

| Field | Description |
| ----- | ----------- |
| `tools.enabledTools` | The providers to register, from `k8s`, `helm`, `istio`, `cilium`, `argo`, `prometheus`, `kubescape`, and `utils`. Omit or leave empty to register every provider. |
| `tools.args` | Extra command line arguments for the server. Add `--read-only` here to skip the write tools that this page marks with `*`. |
| `rbac.readOnly` | Binds the server's ServiceAccount to a read-only ClusterRole of `get`, `list`, and `watch` instead of `cluster-admin`. Defaults to `false`. |
| `rbac.allowSecrets` | Applies only where `rbac.readOnly` is `true`, and grants the read-only ClusterRole read access to Secrets. Defaults to `false`. |
| `rbac.additionalRules` | Applies only where `rbac.readOnly` is `true`. Extra rules to append to the read-only ClusterRole, for the CRDs that the Istio, Cilium, and Argo providers read. |

> [!IMPORTANT]
> `--read-only` and `rbac.readOnly` are separate controls, and setting only one leaves a gap. `--read-only` stops the write tools from being registered, so an agent cannot call them. `rbac.readOnly` removes the cluster permissions that back them. If you set only the flag, the ServiceAccount keeps `cluster-admin`, which anything else in the container can still use. If you set only the role-based access control (RBAC) value, the write tools stay in the catalog and fail at call time with permission errors that the agent then tries to work around.

Because the settings are per-installation, they change what every agent sees. To give one agent a smaller set while leaving the server intact, list the tools on the tool binding instead, as described in [About tools]({{< link path="skills-and-mcp/about-tools#mcp-tools" >}}).

The kagent and Codex harnesses both honor this tool list. On the Claude {{< gloss "Harness" >}}Harness{{< /gloss >}}, a tool binding's tool list does not narrow the server, so an agent on Claude reaches every tool that kagent-tool-server serves. Narrow the server with `tools.enabledTools` or `--read-only` instead. For more information about this behavior, see [Tool selection on the Claude harness]({{< link path="skills-and-mcp/about-tools#tool-selection-on-the-claude-harness" >}}).

## Reach kagent-tool-server from another namespace

The chart creates the `kagent-tool-server` RemoteMCPServer in the release namespace, and a RemoteMCPServer admits references only from its own namespace by default. An AgentTemplate in another namespace binds the server by setting `mcp.server.namespace` to the release namespace. Until the server admits that namespace, the controller cannot resolve the binding, and the Agent that runs that template does not become ready. To admit another namespace, set `allowedNamespaces` on the RemoteMCPServer that the chart creates.

```yaml
kagent-tools:
  remoteMCPServer:
    allowedNamespaces:
      from: Selector
      selector:
        matchLabels:
          kagent-tools: allowed
```

| Field | Description |
| ----- | ----------- |
| `allowedNamespaces.from` | Where a reference may originate, one of `All`, `Same`, or `Selector`. Defaults to `Same`. The default admits only the release namespace. |
| `allowedNamespaces.selector` | A label selector over namespaces. The server reads this field only where `from` is `Selector`, and the selector takes `matchLabels` and `matchExpressions`. |

The selector follows the Gateway API pattern for cross-namespace attachment, so the label belongs on the Namespace rather than on the AgentTemplate that binds the server.

```bash
kubectl label namespace my-agents kagent-tools=allowed
```

> [!NOTE]
> Admitting a namespace grants every agent in that namespace the server's full cluster authority, because all of the server's callers share one ServiceAccount. Narrow the server with `rbac.readOnly` before you widen `allowedNamespaces`.

## Community and contributed servers

kagent's repository contains example servers in [contrib/tools](https://github.com/kagent-dev/kagent/tree/main/contrib/tools). Each server is an unsupported starting point. The manifests target different kagent API versions, so check the `apiVersion` before you apply one.

| Server | Ready to apply | Description |
| ------ | -------------- | ----------- |
| [k8sgpt](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/k8sgpt-mcp-server) | Yes | K8sGPT integration, for diagnosing cluster problems. Declares `RemoteMCPServer` on `api.kagent.dev/v1alpha3`. |
| [server-everything](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/server-everything) | Yes | The MCP reference server, useful for testing a binding end to end. Declares `RemoteMCPServer` on `api.kagent.dev/v1alpha3`. |
| [GitHub MCP Server](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/github-mcp-server) | No | Tools for issues, pull requests, repositories, and actions. Its chart still declares the removed `ToolServer` kind. |
| [mcp-grafana](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/mcp-grafana) | No | Tools for Grafana dashboards, data sources, alerts, and Loki logs. Its chart still declares the removed `ToolServer` kind. |
| [context7](https://github.com/kagent-dev/kagent/blob/main/contrib/tools/context7.mcp.yaml) | No | Documentation lookup over stdio. Both the `ToolServer` kind and the stdio transport were removed. |

To register any other MCP server, write a RemoteMCPServer that points at its URL. For a complete example, see [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool#bind-your-own-mcp-server" >}}). To give agents Grafana tools, run Grafana's own server from the upstream [mcp-grafana](https://github.com/grafana/mcp-grafana) project, and register it in the same way.

> [!NOTE]
> A RemoteMCPServer takes a URL, so kagent connects only to servers that speak streamable HTTP or Server-Sent Events (SSE). To reach a server that runs over stdio, wrap it in a deployment that exposes an HTTP endpoint. To build and run such servers, use [kmcp](https://kagent.dev/docs/kmcp/).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools#mcp-tools" >}}` title="About tools" subtitle="Bind a server's tools to an AgentTemplate, and read the rules that a binding must satisfy." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop#require-approval-for-a-tool" >}}` title="Human in the loop" subtitle="Pause an agent for a person's approval before a tool runs." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Give your agent reusable instructions instead of another tool." >}}
{{< /cards >}}

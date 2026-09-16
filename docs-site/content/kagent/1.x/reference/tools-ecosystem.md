---
title: Tools ecosystem
description: Look up the MCP servers that a kagent installation ships with, the tools that each one serves, and the community servers that you can add.
weight: 40
author: kagent.dev
---

A kagent installation ships with two {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) servers already registered, and you can register more of your own. This page is the catalog: what is installed, what each server serves, and how to narrow the set. For the schema that binds a server to an agent, see [About tools]({{< link path="skills-and-mcp/about-tools#mcp-tools" >}}).

## Servers that a kagent installation registers

Both servers arrive as subcharts of the kagent chart, and each one creates its own {{< gloss "RemoteMCPServer" >}}RemoteMCPServer{{< /gloss >}} in the kagent namespace. Neither is bound to an agent for you, so an agent reaches a server's tools only through a {{< gloss "Tool binding" >}}tool binding{{< /gloss >}} that you add to its {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}.

| RemoteMCPServer | Helm value | Serves |
| --------------- | ---------- | ------ |
| [`kagent-tool-server`](#kagent-tool-server) | `kagent-tools.enabled` | 124 tools for Kubernetes, Helm, Istio, Cilium, Argo Rollouts, Prometheus, and Kubescape. |
| [`kagent-grafana-mcp`](#kagent-grafana-mcp) | `grafana-mcp.enabled` | Grafana's own MCP server, for dashboards, data sources, alerts, Loki logs, and incidents. |

The kagent release pins the `kagent-tool-server` version, which is currently {{< reuse "kagent-docs/versions/kagent-tools.md" >}}. For the full set of pinned component versions, see [Version support]({{< link path="reference/versions#what-a-kagent-release-includes" >}}).

## Read the tools that a server serves

The controller connects to each RemoteMCPServer, asks it what it serves, and records the answer in `status.discoveredTools`. That status reports the server that your cluster actually runs, so it is more reliable than any list on this page.

```sh
kubectl get remotemcpserver kagent-tool-server -n kagent \
  -o jsonpath='{range .status.discoveredTools[*]}{.name}{"\t"}{.description}{"\n"}{end}'
```

[Your first MCP tool]({{< link path="get-started/your-first-mcp-tool#bind-the-tool-to-your-agenttemplate" >}}) runs the same command as the first step of binding one of these tools to an agent.

> [!NOTE]
> `status.discoveredTools` stays empty until the controller completes a discovery pass, and `status.observedGeneration` tells you whether the recorded set matches the current spec. A server whose `Accepted` condition is not `True` has not been reached at all.

## kagent-tool-server

One Go binary serves every tool in this section, grouped into eight providers. A provider's tools shell out to the matching command line tool inside the server's own container, so the Kubernetes, Helm, Istio, and Cilium providers act on your cluster with the server's ServiceAccount rather than with the caller's credentials.

Tools marked `*` perform write operations, and `--read-only` skips them at registration. The following sections list each provider's tools by the name that an agent sees.

### Kubernetes

Agents use the Kubernetes provider the most, and it covers both inspection and modification of any resource that `kubectl` can reach.

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

Istio's tools wrap `istioctl`, and most of them read mesh state rather than change it. Waypoint management is the exception, as generating a waypoint resource and applying it are separate tools.

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

Argo Rollouts tools cover progressive delivery. A rollout tool fails confusingly when the controller or one of its plugins is missing, so four of the eight tools verify the installation instead of acting on a rollout.

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

Cilium is the largest provider, with 58 tools ranging from installation to individual BPF maps. An agent that can see every tool spends its context on tool descriptions, so bind only the handful that an agent needs rather than the whole provider.

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

The Prometheus provider queries a Prometheus server directly. Each tool takes the server's URL as an argument and defaults to `http://localhost:9090`, which does not resolve from inside the tool server's container, so have the agent pass the in-cluster address.

| Tool | Description |
| ---- | ----------- |
| `prometheus_query_tool` | Execute a PromQL query against Prometheus. |
| `prometheus_query_range_tool` | Execute a PromQL range query against Prometheus. |
| `prometheus_label_names_tool` | Get all available labels from Prometheus. |
| `prometheus_targets_tool` | Get all Prometheus targets and their status. |
| `prometheus_promql_tool` | Generate a PromQL query. |

### Kubescape

Kubescape's tools read scan results that the Kubescape operator has already produced, so they return nothing useful until that operator is installed and has completed a scan. Start with `kubescape_check_health`, which reports whether the rest of the provider can work.

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

Two tools sit outside any product. `shell` runs an arbitrary command in the server's container with the server's ServiceAccount, so treat it as the widest permission that this server grants.

| Tool | Description |
| ---- | ----------- |
| `datetime_get_current_time` | Return the current date and time in ISO 8601 format. |
| `shell` * | Execute shell commands. |

## Narrow what kagent-tool-server serves

Serving all 124 tools costs an agent context on every turn, and it grants the server broad authority over your cluster. Two independent settings narrow it, and each one acts at a different layer.

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
> `--read-only` and `rbac.readOnly` are separate controls, and setting only one leaves a gap. `--read-only` stops the write tools from being registered, so an agent cannot call them. `rbac.readOnly` removes the cluster permissions that back them. Set only the flag, and the ServiceAccount keeps `cluster-admin`, which anything else in the container can still use. Set only the RBAC value, and the write tools stay in the catalog and fail at call time with permission errors that the agent then tries to work around.

Because the settings are per-installation, they change what every agent sees. To give one agent a smaller set while leaving the server intact, list the tools on the tool binding instead, as described in [About tools]({{< link path="skills-and-mcp/about-tools#mcp-tools" >}}).

> [!WARNING]
> A tool binding's tool list does not narrow anything on the Claude {{< gloss "Harness" >}}Harness{{< /gloss >}}. The compiler exposes the whole server instead, and names the tools that you selected in a warning on the AgentTemplate's `status.harnesses[].warnings`. The kagent and Codex harnesses both honor the list. Where an agent runs on the Claude harness and must not reach a tool, narrow the server with `tools.enabledTools` or `--read-only` rather than with the binding.

## kagent-grafana-mcp

The `kagent-grafana-mcp` server runs [mcp-grafana](https://github.com/grafana/mcp-grafana), Grafana's own MCP server. The kagent chart packages it as a subchart. Its tools fall into four groups:

- Grafana dashboards, data sources, and alert rules.
- PromQL queries against Grafana's Prometheus data sources.
- LogQL queries against Loki.
- Grafana incidents and on-call schedules.

Set the Grafana instance that the server queries, along with its credentials, at install time.

```yaml
grafana-mcp:
  enabled: true
  grafana:
    url: "grafana.kagent:3000/api"
    serviceAccountToken: "<token>"
```

| Field | Description |
| ----- | ----------- |
| `grafana.url` | The Grafana API endpoint that the server queries. Defaults to `grafana.kagent:3000/api`, which matches the Grafana instance in `contrib/addons/grafana.yaml`. |
| `grafana.serviceAccountToken` | A Grafana service account token. Empty by default, so the server starts and answers discovery while every tool call fails until you supply a token. |
| `grafana.secretRef` | The name of an existing Secret that holds `GRAFANA_SERVICE_ACCOUNT_TOKEN`. Use this instead of `serviceAccountToken` to keep the token out of your Helm values. |

> [!NOTE]
> Upstream publishes no tag other than `latest`, so this subchart tracks the `mcp/grafana:latest` image on Docker Hub. A kagent release therefore does not pin which tools this server serves, and the set can change without a kagent upgrade. Read `status.discoveredTools` on `kagent-grafana-mcp` for the tools that your installation has, rather than relying on a published list.

## Community and contributed servers

kagent's repository carries example servers in [contrib/tools](https://github.com/kagent-dev/kagent/tree/main/contrib/tools). Each one is a starting point rather than a supported component, and their manifests were written against different kagent API versions, so check the `apiVersion` before you apply one.

| Server | Ready to apply | Description |
| ------ | -------------- | ----------- |
| [k8sgpt](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/k8sgpt-mcp-server) | Yes | K8sGPT integration, for diagnosing cluster problems. Declares `RemoteMCPServer` on `kagent.dev/v1alpha3`. |
| [server-everything](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/server-everything) | Yes | The MCP reference server, useful for testing a binding end to end. Declares `RemoteMCPServer` on `kagent.dev/v1alpha3`. |
| [GitHub MCP Server](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/github-mcp-server) | No | Tools for issues, pull requests, repositories, and actions. Its chart still declares the removed `ToolServer` kind. |
| [mcp-grafana](https://github.com/kagent-dev/kagent/tree/main/contrib/tools/mcp-grafana) | No | Superseded by the `grafana-mcp` subchart that a kagent installation already registers. Its chart still declares the removed `ToolServer` kind. |
| [context7](https://github.com/kagent-dev/kagent/blob/main/contrib/tools/context7.mcp.yaml) | No | Documentation lookup over stdio. Both the `ToolServer` kind and the stdio transport were removed. |

To register any other MCP server, write a RemoteMCPServer that points at its URL. [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool#bind-your-own-mcp-server" >}}) works through a complete example.

> [!NOTE]
> A RemoteMCPServer takes a URL, so kagent connects only to servers that speak streamable HTTP or Server-Sent Events (SSE). To reach a server that runs over stdio, wrap it in a deployment that exposes an HTTP endpoint. [kmcp](/docs/kmcp/) builds and runs such servers.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools#mcp-tools" >}}` title="About tools" subtitle="Bind a server's tools to an AgentTemplate, and read the rules that a binding must satisfy." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop#require-approval-for-a-tool" >}}` title="Human in the loop" subtitle="Pause an agent for a person's approval before a tool runs." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Give your agent reusable instructions instead of another tool." >}}
{{< /cards >}}

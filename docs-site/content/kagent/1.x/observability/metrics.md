---
title: Metrics
description: Scrape the kagent controller's Prometheus metrics, export Agent Substrate metrics over OpenTelemetry, and review what each metric measures.
weight: 40
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} and Agent Substrate report metrics in two different ways. The kagent controller serves a Prometheus `/metrics` endpoint that Prometheus scrapes. Agent Substrate pushes its metrics over the OpenTelemetry Protocol (OTLP) to a collector, which serves them for Prometheus to scrape. Both are off by default. The [OTel stack]({{< link path="observability/otel-stack" >}}) and [Lightweight OTel stack]({{< link path="observability/lightweight-otel-stack" >}}) guides turn both on and set up Prometheus to collect them.

## kagent controller metrics

### Enable the metrics endpoint

The controller serves its metrics over HTTPS, and accepts a scrape only from a ServiceAccount that holds the `<fullname>-metrics-reader` ClusterRole. Enabling the endpoint creates a dedicated metrics Service and that ClusterRole.

```yaml
controller:
  metrics:
    enabled: true
    bindAddress: ":8443"
    secureServing: true
```

Change the port through `bindAddress` rather than through `controller.env`, because the chart derives the Service `targetPort` and the pod `containerPort` from `bindAddress` at template time. Overriding `METRICS_BIND_ADDRESS` directly moves the listener and leaves the Service pointing at the old port.

Grant your Prometheus instance access in one of the following ways.

- **With the Prometheus Operator**: Set `controller.metrics.serviceMonitor.enabled` to `true`. The chart creates a ServiceMonitor for the metrics Service. Also set `controller.metrics.serviceMonitor.prometheusServiceAccount.name` and `.namespace` to the ServiceAccount that Prometheus runs as, and the chart binds the metrics reader ClusterRole to it. The chart renders the ServiceMonitor only when the cluster serves the `monitoring.coreos.com/v1` API. For an example, see [OTel stack]({{< link path="observability/otel-stack#send-kagent-telemetry-to-the-collector" >}}).
- **Without the Prometheus Operator**: Bind the `<fullname>-metrics-reader` ClusterRole to the Prometheus ServiceAccount yourself, and add a scrape job for the `<fullname>-controller-metrics` Service on port `8443`. The job must use HTTPS, send the ServiceAccount token, and skip verification of the controller's self-signed certificate. For an example, see [Lightweight OTel stack]({{< link path="observability/lightweight-otel-stack#install-prometheus" >}}).

### Metric reference

Besides the standard Go runtime and process metrics, the controller reports the following metrics.

| Metric | Type | Measures |
| ------ | ---- | -------- |
| `kagent_grpc_server_requests_total` | Counter | Requests to the controller's gRPC API, by `method`, `code`, and `rpc_type`. The `method` label names the full gRPC method, such as `/kagent.api.v1alpha1.AgentInstanceService/CreateAgentInstance`. |
| `kagent_grpc_server_request_duration_seconds` | Histogram | Latency of requests to the controller's gRPC API, with the same labels. |
| `controller_runtime_reconcile_total`, `controller_runtime_reconcile_errors_total`, `controller_runtime_reconcile_time_seconds` | Counter, counter, histogram | Reconciliations of kagent resources, by controller, and how long each one takes. A rising error count means that the controller cannot bring a resource to its desired state. |
| `workqueue_depth`, `workqueue_queue_duration_seconds`, `workqueue_retries_total` | Gauge, histogram, counter | Work waiting for a reconciler, how long it waits, and how often it is retried. |
| `leader_election_master_status` | Gauge | `1` on the controller replica that holds the leader lease. With several replicas, exactly one reports `1`. |
| `rest_client_requests_total` | Counter | Requests from the controller to the Kubernetes API server, by status code. |

The Agent Substrate `atecontroller` component reports the same `controller_runtime_*` and `workqueue_*` metrics for its own reconcilers. To keep the two apart in a query, filter by the scrape job, such as `job="kagent-controller-metrics"` in the OTel stack.

## Agent Substrate metrics

### Export the metrics

Agent Substrate exports metrics over OTLP when its Helm release has an OTLP endpoint. The same setting also turns on Agent Substrate traces and logs.

```bash
helm upgrade substrate \
  oci://ghcr.io/kagent-dev/substrate/helm/substrate \
  --version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} \
  --namespace ate-system \
  --reuse-values \
  --set otel.endpoint=http://otel-collector.telemetry.svc.cluster.local:4317
```

To send metrics somewhere other than traces and logs, set `otel.metrics.endpoint` instead. To stop exporting metrics while keeping the other signals, leave `otel.endpoint` empty, and set `otel.traces.endpoint` and `otel.logs.endpoint` instead. Setting `otel.metrics.enabled` to `false` is not enough in version {{< reuse "kagent-docs/versions/agent-substrate.md" >}}, because only the router's agentgateway reads it, and the other Agent Substrate components keep exporting. Agent Substrate exports a batch of metrics every 60 seconds, so a new installation shows its first values about a minute after you set the endpoint.

### Metric reference

The collector's Prometheus exporter converts each OpenTelemetry metric name to a Prometheus name. The exporter replaces dots with underscores, and adds a unit suffix, such as `_seconds` or `_bytes`, and a `_total` suffix for counters. The following table lists the Prometheus names. Every metric also carries a `service_name` label for the Agent Substrate component that reported it, when the collector copies resource attributes to labels, as both stack guides configure.

| Metric | Reported by | Type | Measures |
| ------ | ----------- | ---- | -------- |
| `ate_workerpool_desired_workers` | `atecontroller` | Gauge | Worker pods that a WorkerPool requests, from its `spec.replicas`. |
| `ate_workerpool_ready_workers` | `atecontroller` | Gauge | Worker pods that are ready in a WorkerPool. A value below `ate_workerpool_desired_workers` means that the pool cannot run as many Actors as it should. |
| `ate_workerpool_workers` | `ateapi` | Gauge | Live Workers per pool, split by the `ate_worker_state` label into `idle` and `assigned`. Few idle Workers means that new and resumed Actors are about to wait for capacity. |
| `ate_scheduler_assignment_duration_seconds` | `ateapi` | Histogram | Time to assign an Actor to a Worker, by the `ate_scheduler_outcome` label: `assigned`, `no_free_worker`, or `error`. |
| `ate_scheduler_eligible_workers` | `ateapi` | Histogram | Unassigned Workers that could take an Actor at scheduling time. |
| `ate_actor_lifecycle_operation_duration_seconds` | `ateapi` | Histogram | Time that each Actor operation takes, by the `ate_actor_operation_name` label, such as `create`, `resume`, and `suspend`. A failed operation carries an `error_type` label. |
| `ate_actor_restore_duration_seconds` | `atelet` | Histogram | Time for each phase of restoring an Actor from a snapshot on its Worker's node, by the `ate_snapshot_phase` label, such as `download`, `oci_unpack`, and `ateom_restore`. This is where most of the time to resume an Actor goes. |
| `ate_actor_checkpoint_duration_seconds` | `atelet` | Histogram | Time for each phase of writing a snapshot when an Actor suspends. |
| `atelet_snapshot_size_bytes` | `atelet` | Histogram | Uncompressed size of each snapshot. |
| `ate_imagecache_requests_total` | `atelet` | Counter | Lookups in the node-local image cache, by the `ate_imagecache_outcome` label. A cache miss pays for pulling and unpacking the image, so a low hit ratio predicts slow resumes. |
| `ate_actor_stats_cpu_time_seconds_total` | `atelet` | Counter | CPU time of the Actors that run on a node, by template. Use `rate()` to find the templates that use a node's CPU. |
| `ate_actor_stats_memory_usage_bytes` | `atelet` | Gauge | Memory of the Actors that run on a node, by template, including page cache that the node can reclaim. |
| `ate_actor_stats_memory_working_set_bytes` | `atelet` | Gauge | Working set memory of the Actors that run on a node, by template, without reclaimable page cache. Compare this value with a memory limit. |
| `ate_actor_stats_sampled_actors` | `atelet` | Gauge | Actors on a node that have a current resource measurement. Divide the other `ate_actor_stats_*` metrics by this value to get a per-Actor average for a template. |
| `ate_actor_crashes_total` | `ateapi` | Counter | Actors that moved to the terminal crashed state, by failure reason. The metric appears only after the first crash. |
| `rpc_server_call_duration_seconds`, `rpc_client_call_duration_seconds` | `ateapi`, `atelet` | Histogram | Latency, rate, and errors of the gRPC calls between Agent Substrate components. |

## Example queries

Run the following queries in Prometheus or Grafana.

- Ready Workers compared with desired Workers, per WorkerPool.
  ```text
  ate_workerpool_ready_workers / ate_workerpool_desired_workers
  ```

- The 95th percentile time to resume an Actor, per phase.
  ```text
  histogram_quantile(0.95, sum by (le, ate_snapshot_phase) (rate(ate_actor_restore_duration_seconds_bucket[5m])))
  ```

- The rate of requests to the kagent gRPC API, by method.
  ```text
  sum by (method) (rate(kagent_grpc_server_requests_total[5m]))
  ```

- The rate of failed reconciliations in the kagent controller, by reconciler. The query uses the job name from the OTel stack. In the lightweight stack, the job is `kagent-controller`.
  ```text
  sum by (controller) (rate(controller_runtime_reconcile_errors_total{job="kagent-controller-metrics"}[5m]))
  ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="observability/otel-stack" >}}` title="OTel stack" subtitle="Collect traces, logs, and metrics in Grafana." >}}
  {{< card link=`{{< link path="operations/tune-agent-substrate" >}}` title="Tune Agent Substrate" subtitle="Size WorkerPools and adjust the runtime settings that these metrics measure." >}}
{{< /cards >}}

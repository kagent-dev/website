---
title: Operational considerations
description: Replace the evaluation defaults for the database, controller replicas, and the node pools that host Substrate Workers before you run kagent in production.
weight: 10
author: kagent.dev
---

A default kagent installation is built for evaluation. It runs one controller replica against a bundled database, and places no constraints on the nodes that run agents. Production changes each of those.

## Choose a database

kagent stores conversations, {{< gloss "AgentInstance" >}}AgentInstances{{< /gloss >}}, and compiled {{< gloss "Revision" >}}revisions{{< /gloss >}} in PostgreSQL. A bundled instance ships with the chart so that an evaluation needs no external prerequisites, and production deployments supply their own.

Two independent settings determine what runs and what the controller talks to:

- `database.postgres.bundled.enabled` determines whether the chart deploys the bundled PostgreSQL pod and its PersistentVolumeClaim (PVC). This setting does not affect which database the controller connects to.
- `database.postgres.url` and `database.postgres.urlFile` determine what the controller connects to. When either is set, the controller uses it. When both are empty, the controller connects to the bundled instance.

The controller resolves its connection in the order `urlFile`, then `url`, then the bundled connection string. Because the two settings are independent, a bundled pod can keep running while the controller points at an external database, which gives you a window to migrate data across.

| `bundled.enabled` | `url` or `urlFile` | Bundled pod deployed | Controller connects to |
| ----------------- | ------------------ | -------------------- | ---------------------- |
| `true` | Omitted | Yes | The bundled instance |
| `false` | Set | No | The external instance |
| `true` | Set | Yes | The external instance |
| `false` | Omitted | No | Nothing. The chart fails to render. |

The last row fails at template time with `No database connection configured`, rather than installing a controller that cannot start.

The bundled instance claims its PersistentVolumeClaim from the cluster's default StorageClass. Set `database.postgres.bundled.storageClassName` to choose a different one.

### Use an external PostgreSQL instance

For production, run PostgreSQL outside the cluster's lifecycle so that a kagent uninstall cannot delete the data.

1. Set the connection in your Helm values file. To keep credentials out of Helm values, mount the connection string from a Kubernetes Secret and reference the mount path by using `urlFile`.

   ```yaml
   database:
     postgres:
       urlFile: /var/secrets/db-url
       vectorEnabled: true
       skipMigrations: false
       pool:
         maxConns: 20
         minConns: 2
       bundled:
         enabled: false
   controller:
     replicas: 3
     volumes:
       - name: db-secret
         secret:
           secretName: my-postgres-url-secret
     volumeMounts:
       - name: db-secret
         mountPath: /var/secrets
         readOnly: true
   ```

   | Setting | Description |
   | ------- | ----------- |
   | `database.postgres.url` or `database.postgres.urlFile` | The connection string, or the path to a file holding it. `urlFile` keeps the credentials out of Helm values. |
   | `database.postgres.vectorEnabled` | Set to `true` only when the instance has the `pgvector` extension installed. The setting enables the vector migration, and features that depend on it, such as [long-term memory]({{< link path="agents/agent-memory" >}}), fail without the extension. The bundled image does not include `pgvector`. |
   | `database.postgres.pool` | Connection pool sizing, through `maxConns`, `minConns`, `maxConnIdleTime`, and `maxConnLifetime`. Omit the fields to keep the pgx library defaults. |
   | `database.postgres.skipMigrations` | Set to `true` to stop the controller from running migrations at startup. The controller then verifies that the database is already migrated and fails if it is not. Apply the migrations from a pipeline before you install or upgrade. |

2. Apply the values to the kagent Helm release.

   ```bash
   helm upgrade --install kagent \
     oci://ghcr.io/kagent-dev/kagent/helm/kagent \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --values kagent.yaml
   ```

## Run multiple controller replica

To ensure that a controller failure does not stop reconciliation, set `controller.replicas` to a number higher than `1`.

```yaml
controller:
  replicas: 3
```

Leader election keeps the replicas from conflicting. One replica holds a Kubernetes lease and performs reconciliation, garbage collection, and scheduled runs; the other replicas stay ready and take over when the leader's lease expires.

> [!NOTE]
> Leader election is always on, including at a single replica, because a rolling update briefly runs two controllers at once. The chart grants the lease permissions unconditionally and exposes no setting to turn election off. `LEADER_ELECT=false` remains available for local testing.

PostgreSQL supports multiple controller replicas without further configuration. The bundled instance is still a single pod backed by one PVC, so an installation that runs several controllers for availability, against a bundled database, has only moved the single point of failure.

## Reserve node pools for Workers

{{< gloss "Worker" >}}Workers{{< /gloss >}} hold running {{< gloss "Actor" >}}Actors{{< /gloss >}}. An Actor that loses its node before it suspends loses its conversation, so the node pools that run Workers need stricter rules than the rest of the cluster.

> [!WARNING]
> Turn node auto-upgrade off on every node pool that runs Workers, and do not use spot or preemptible nodes for them. An Actor that is still awake when its node goes away moves to `ACTOR_STATE_CRASHED`. That state is terminal. Agent Substrate refuses both `resume` and `suspend` on a crashed Actor, offers no recovery verb, and cannot start it from the {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} that the Actor still holds. Deleting the Actor and creating a new one is the only available option, and the conversation does not survive.

A graceful pod deletion is safe. Kubernetes forwards `SIGTERM` into the Actor's containers, the Worker drains for up to 30 minutes inside a pod termination grace period of 3600 seconds, and an Actor that suspends inside that window keeps its state and stays resumable. Rolling a `workerImage` change through a pool therefore finishes any in-flight turns rather than cutting them off.

A reclaimed node is not a graceful deletion, and node auto-upgrade is the most likely way to hit one. Google Kubernetes Engine (GKE) enables auto-upgrade by default and runs it on Google's maintenance schedule, not yours. Disable it on every pool that runs Workers.

```bash
gcloud container node-pools update "${NODE_POOL}" \
  --cluster "${CLUSTER_NAME}" --location "${CLUSTER_LOCATION}" \
  --no-enable-autoupgrade
```

Scaling a serving WorkerPool down removes pods without suspending the Actors on them, so it strands conversations exactly as a reclaimed node does. For pool sizing and the rest of the Substrate runtime settings, see [Tune Agent Substrate]({{< link path="operations/tune-agent-substrate" >}}).

## How configuration changes reach agents

kagent watches the Secrets and ConfigMaps that a {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} reference, such as the API keys and TLS certificates in a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}}. An edit to one of them recompiles the pair into a new revision.

A new revision does not reach the AgentInstances that are already running. An AgentInstance is pinned to the revision that it was created from and keeps that revision for life, so a rotated API key applies to AgentInstances created after the rotation. To move an existing conversation onto new configuration, create a new AgentInstance.

This behavior differs from kagent 0.x, where an agent ran as a Deployment and a secret change restarted its pods.

## Route agent traffic through a proxy

When agents and MCP servers sit behind an API gateway or proxy, point kagent at the proxy endpoint so that agent-to-agent and agent-to-MCP traffic follows the same path as the rest of your cluster's egress.

```yaml
proxy:
  url: "http://proxy.kagent.svc.cluster.local:8080"
```

The controller rewrites internally built Kubernetes URLs to the proxy and sets the `x-kagent-host` header so that the proxy routes each request to the correct backend. The rewrite covers one agent invoking another as a tool, and an agent calling a RemoteMCPServer at an internal URL. An external URL, such as a RemoteMCPServer at `https://external.example.com`, is left alone.

## Scrape controller metrics

The controller serves a Prometheus-style `/metrics` endpoint, turned off by default. Enabling it provisions a dedicated metrics Service and the ClusterRoles that an authenticated scrape needs.

```yaml
controller:
  metrics:
    enabled: true
    bindAddress: ":8443"
    secureServing: true
```

Bind the `<fullname>-metrics-reader` ClusterRole to your Prometheus ServiceAccount to grant scrape access. Change the port through `bindAddress` rather than through `controller.env`, because the chart derives the Service `targetPort` and the pod `containerPort` from `bindAddress` at template time. Overriding `METRICS_BIND_ADDRESS` directly moves the listener and leaves the Service pointing at the old port.

## Isolate what an agent can do

kagent 0.x ran agents as Deployments and relied on a Kubernetes `securityContext` to constrain them. In 1.0, every agent runs as an Actor inside a gVisor sandbox, and the sandbox provides process, network, and filesystem isolation without per-agent security context configuration.

For what the sandbox blocks, how to configure egress, and how to select a sandbox class, see [Sandboxing]({{< link path="substrate-runtime/sandboxing" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="operations/tune-agent-substrate" >}}` title="Tune Agent Substrate" subtitle="Size the WorkerPool and configure snapshot storage." >}}
  {{< card link=`{{< link path="operations/debug" >}}` title="Debug" subtitle="Work back from a symptom to the resource that caused it." >}}
{{< /cards >}}

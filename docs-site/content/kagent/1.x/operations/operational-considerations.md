---
title: Operational considerations
description: Tune the database, controller replicas, and the node pools that host Substrate Workers before you run kagent in production.
weight: 10
author: kagent.dev
---

A default {{< reuse "kagent-docs/snippets/name-product.md" >}} installation runs one controller replica against a bundled database, and schedules agents onto any node in the cluster. Each of those defaults works for a trial installation, but all three need a decision before you run {{< reuse "kagent-docs/snippets/name-product.md" >}} in production. This page covers which database to run, how many controller replicas to keep, and how to treat the nodes that host Workers.

## Choose a database

kagent stores conversations, {{< gloss "Session" >}}Sessions{{< /gloss >}}, and compiled {{< gloss "Revision" >}}revisions{{< /gloss >}} in PostgreSQL. A bundled instance ships with the chart and runs by default, so an installation needs no external database to start. Run your own PostgreSQL instance for production, because the bundled one is a single pod backed by one PersistentVolumeClaim (PVC).

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
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --values kagent.yaml
   ```

## Run multiple controller replicas

To ensure that a controller failure does not stop reconciliation, set `controller.replicas` to a number higher than `1`.

```yaml
controller:
  replicas: 3
```

Leader election keeps the replicas from conflicting. One replica holds a Kubernetes lease and performs reconciliation, garbage collection, and scheduled runs. The other replicas stay ready and take over when the leader's lease expires.

> [!IMPORTANT]
> If an installation runs on the bundled database, extra controller replicas do not make the installation highly available. The bundled PostgreSQL instance is a single pod backed by one PVC, so losing it stops every replica at once. Run an external PostgreSQL instance before counting controller replicas toward availability.

## Node operations

A {{< gloss "Worker" >}}Worker{{< /gloss >}} is an ordinary Kubernetes pod, so every node event reaches the {{< gloss "Actor" >}}Actors{{< /gloss >}} that this Worker hosts. What the event costs depends on what each Actor was doing when the node went away.

* A suspended Actor costs nothing. Its state is already written to snapshot storage, and it occupies no Worker while it waits, so the next message resumes it onto whichever Worker in the pool has availability.
* An awake Actor does not survive. Its conversation lives in the memory of its sandbox on the Worker, and Agent Substrate writes nothing to snapshot storage until this Actor suspends.

A lost Actor moves to `ACTOR_STATE_CRASHED`, and Agent Substrate refuses `resume` and `suspend` on an Actor in this state. Through kagent, deleting the Actor and starting a new {{< gloss "Session" >}}Session{{< /gloss >}} is the only available option, so the conversation ends wherever the node ends.

<!-- REVIEW (runtime reviewer): Agent Substrate does have a recovery verb. RevertActor (cmd/ateapi/internal/controlapi/workflow_revert.go) accepts a CRASHED actor, returns it to SUSPENDED, leaves the external snapshot in place for a later resume, and needs no live worker. kagent never calls it, so a kagent user cannot reach it today and this section describes the kagent-level outcome only. Confirm whether kagent should expose revert before GA, and rewrite this paragraph if it does. -->

Many Actors on a node are suspended at any moment, so losing the node crashes only the ones that are mid-turn. Those Actors still lose their conversations, and a node pool that runs Workers therefore needs stricter rules than the rest of the cluster. A Worker pod that Kubernetes deletes gives its Actors time to suspend. Node auto-upgrade, a spot reclaim, and a pool scale-down do not.

### Graceful pod deletion

Deleting a Worker pod is safe. Kubernetes forwards `SIGTERM` into the Actor's containers, the Worker drains for up to 30 minutes inside a pod termination grace period of 3600 seconds, and an Actor that suspends inside this window keeps its state and stays resumable. Rolling a `workerImage` change through a pool therefore finishes any in-flight turns rather than cutting them off.

### Node auto-upgrade

A reclaimed node is not a graceful deletion, and node auto-upgrade is the most likely way to hit one. Google Kubernetes Engine (GKE) enables auto-upgrade by default and runs it on Google's maintenance schedule, not yours.

> [!IMPORTANT]
> Turn node auto-upgrade off on every node pool that runs Workers.

```bash
gcloud container node-pools update "${NODE_POOL}" \
  --cluster "${CLUSTER_NAME}" --location "${CLUSTER_LOCATION}" \
  --no-enable-autoupgrade
```

### Spot and preemptible nodes

A provider reclaims spot and preemptible nodes on its own schedule, and each reclaim crashes every Actor that was awake on the node. A pool on reclaimable capacity therefore trades a lower bill for conversations that end without warning. Use these nodes only where the agents on this pool can afford to lose a turn.

### WorkerPool scale-down

When you scale a serving WorkerPool down, it removes pods without suspending the Actors on them. This strands Sessions in the same way that a reclaimed node does. For pool sizing and the rest of the Substrate runtime settings, see [Tune Agent Substrate]({{< link path="operations/tune-agent-substrate" >}}).

## Expire idle Sessions

Every {{< gloss "Session" >}}Session{{< /gloss >}} holds database records and pins a runtime revision for as long as it exists, including a Session that is never opened again. The kagent controller deletes idle Sessions on a timer. Deleting idle sessions bounds the records that a kagent installation stores as well as the revisions that it holds open.

A leader-only worker sweeps Sessions once a minute and deletes every Session that has been idle past the limit, using the same deletion workflow that a client delete uses.

To choose how long a Session can be idle before the worker deletes it, set `controller.sessionIdleTTL` in your {{< reuse "kagent-docs/snippets/name-product.md" >}} Helm values. The value is a Go duration, and it defaults to `168h`, or seven days. Setting it to `0` turns the worker off, retries included, and a negative value is rejected.

```yaml
controller:
  sessionIdleTTL: "720h"
```

No per-agent override exists, so this one value governs every Session in the installation. No maximum exists either, so a longer value is accepted.

Idle time runs from whichever is later: the Session's creation, or its most recently stored A2A event. Reads, renames, lifecycle calls, and retried writes do not reset it, so a Session that is only ever listed still expires. A {{< gloss "Fork" >}}fork{{< /gloss >}} keeps its source's event timestamps. Its own creation time gives it a full lifetime, so it does not inherit an almost-expired one.

Work in progress is never deleted. A Session with a running task survives past the interval, and so does one with a turn waiting at `INPUT_REQUIRED` or `AUTH_REQUIRED`. A pending lifecycle operation or a checkpoint being captured also holds a Session open.

> [!IMPORTANT]
> **Expiry bounds Sessions, not history.** Deleting an idle Session removes the Session, its shares, its runtime row, and its creation receipt, so `GetSession` returns not-found afterward. The A2A context, its tasks, its event history, and any explicit {{< gloss "Checkpoint" >}}checkpoints{{< /gloss >}} stay in PostgreSQL, and a retained checkpoint can still be forked after the Session it was taken on has expired. kagent has no setting that bounds this retained history, so size a database for a long-running installation with the audit history planned separately.

An expired Session releases its creation request ID, unlike an explicit client deletion, which keeps a tombstone. The same caller can reuse that request ID to start a fresh Session.

<!-- REVIEW: the creation request ID behaviour belongs with the Session API rather than on an operations page. Move it when a Sessions reference page exists. -->

To watch the sweep, scrape `kagent_session_expired_total`, which counts the Sessions that it removed. Each removal also logs `expired idle session` at debug level with the Session's ID and how long it had been idle.

## How configuration changes reach agents

kagent watches the Secrets and ConfigMaps that a {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} reference, such as the API keys and TLS certificates in a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}}. An edit to one of them recompiles the pair into a new revision.

A new revision does not reach the Sessions that are already running. A Session is pinned to the revision that it was created from and keeps that revision for life. To move an existing conversation onto new configuration, create a new Session.

The model provider API key is the exception. Agents do not hold the key. Instead, the Agent Substrate egress gateway reads the key from the Secret and adds it to each model request, so a rotated key reaches running Sessions after you restart the egress gateway. See [Rotate the model provider API key](#rotate-the-model-provider-api-key).

This behavior differs from kagent 0.x, where an agent ran as a Deployment and a secret change restarted its pods.

### Rotate the model provider API key

To rotate the model provider API key, update the Secret that holds the key. Then you can restart the Agent Substrate egress gateway so that running Sessions use the new value.

Manage the Secret yourself in a production installation. You then rotate the key at its source, and kagent reads the current value.

1. Update the key.
   {{< tabs >}}
   {{% tab name="You manage the Secret" %}}
   When `providers.<provider>.apiKey` is empty and `apiKeySecretRef` names a Secret that you create, such as one that an ExternalSecret syncs, the chart does not render the Secret. Update the Secret wherever you manage it.
   {{% /tab %}}
   {{% tab name="Helm manages the Secret" %}}
   When you set `providers.<provider>.apiKey` in your Helm values, the chart creates the Secret and Helm owns it. Rotate the key through Helm rather than by editing the Secret, because a direct edit does not last. With Helm 3, the next `helm upgrade --reuse-values` writes the previous key back. With Helm 4, which applies changes on the server side, the next upgrade fails with a field ownership conflict on the Secret.

   Upgrade the kagent release with the new key. The following example uses OpenAI. For another provider, replace `openAI` with the provider's key in the `providers` values.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --reuse-values \
     --set-string providers.openAI.apiKey="${NEW_OPENAI_API_KEY}"
   ```
   {{% /tab %}}
   {{< /tabs >}}

2. Restart the Agent Substrate egress gateway. The egress gateway can keep sending the previous key after the Secret changes, and a restart makes it use the new key right away.
   ```bash
   kubectl rollout restart deployment/atenet-egress -n ate-system
   ```

## Route agent traffic through a proxy

A proxy puts agent-to-agent and agent-to-MCP calls on the same egress path as the rest of your cluster. Your existing inspection, logging, and policy then cover them too. When agents and MCP servers sit behind an API gateway or proxy, point kagent at the proxy endpoint.

```yaml
proxy:
  url: "http://proxy.kagent.svc.cluster.local:8080"
```

The controller rewrites internally built Kubernetes URLs to the proxy and sets the `x-kagent-host` header so that the proxy routes each request to the correct backend. The rewrite covers one agent invoking another as a tool, and an agent calling a RemoteMCPServer at an internal URL. An external URL, such as a RemoteMCPServer at `https://external.example.com`, is left alone.

## Scrape controller metrics

The controller serves a Prometheus `/metrics` endpoint, turned off by default. To enable the endpoint, grant Prometheus access to it, and review the metrics that the controller reports, see [Metrics]({{< link path="observability/metrics" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="operations/tune-agent-substrate" >}}` title="Tune Agent Substrate" subtitle="Size the WorkerPool and configure snapshot storage." >}}
  {{< card link=`{{< link path="operations/debug" >}}` title="Debug" subtitle="Work back from a symptom to the resource that caused it." >}}
{{< /cards >}}

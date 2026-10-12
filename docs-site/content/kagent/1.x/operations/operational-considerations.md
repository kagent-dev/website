---
title: Operational considerations
description: Replace the evaluation defaults for the database, controller replicas, and the node pools that host Substrate Workers before you run kagent in production.
weight: 10
author: kagent.dev
---

A default {{< reuse "kagent-docs/snippets/name-product.md" >}} installation is built for evaluation. It runs one controller replica against a development database that `kagent install` creates, and places no constraints on the nodes that run agents. Production changes each of those defaults.

## Choose a database

kagent stores conversations, {{< gloss "Session" >}}Sessions{{< /gloss >}}, and compiled {{< gloss "Revision" >}}revisions{{< /gloss >}} in PostgreSQL. The kagent chart no longer deploys or initializes PostgreSQL. The chart reads the connection string from a Kubernetes Secret that you create or that `kagent install` creates for its development database.

For production, run PostgreSQL outside the cluster's lifecycle so that a kagent uninstall cannot delete the data. Create a database role for kagent, or set `database.postgres.role` to an empty string so that kagent uses the login user directly. If you keep the default `kagent_owner` role, grant the role to the login user and give the role `USAGE, CREATE` on the `public` schema.

`kagent install` creates a development PostgreSQL deployment in the kagent namespace. That database authenticates kagent and Substrate with Pod Certificates, creates the Kagent and Substrate roles, and writes the connection Secrets for both charts. The certificate authorities that the CLI creates are valid for one year, are not renewed automatically, and are kept when you run `kagent install` again.

### Use an external PostgreSQL instance

1. Store the connection string in a Secret in the kagent namespace.

   ```bash
   kubectl create secret generic my-postgres-connection -n kagent \
     --from-literal=connectionString='postgres://<username>:<password>@<host>:5432/<database>?sslmode=require'
   ```

2. Set the connection Secret in your Helm values file.

   ```yaml
   database:
     postgres:
       connectionStringSecretRef:
         name: my-postgres-connection
         key: connectionString
       role: ""
       vectorEnabled: true
       skipMigrations: false
       pool:
         maxConns: 20
         minConns: 2
   controller:
     replicas: 3
   ```

   | Setting | Description |
   | ------- | ----------- |
   | `database.postgres.connectionStringSecretRef` | The Secret and key that hold the PostgreSQL connection string. Secret changes require a controller restart. |
   | `database.postgres.role` | The PostgreSQL role that kagent assumes on every connection. Set it to `""` to use the login user directly. |
   | `database.postgres.vectorEnabled` | Set to `true` only when the instance has the `pgvector` extension installed. The setting enables the vector migration, and features that depend on it, such as [long-term memory]({{< link path="agents/agent-memory" >}}), fail without the extension. The development database that `kagent install` creates does not include `pgvector`. |
   | `database.postgres.pool` | Connection pool sizing, through `maxConns`, `minConns`, `maxConnIdleTime`, and `maxConnLifetime`. Omit the fields to keep the pgx library defaults. |
   | `database.postgres.skipMigrations` | Set to `true` to stop the controller from running migrations at startup. The controller then verifies that the database is already migrated and fails if it is not. Apply the migrations from a pipeline before you install or upgrade. |

3. Apply the values to the kagent Helm release.

   ```bash
   helm upgrade --install kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --values kagent.yaml
   ```

If the connection string references client certificate files under `/run/postgres.podcert.ate.dev`, set `database.postgres.clientCertificate.enabled=true`. The controller rereads those files before it opens a new physical connection, so rotated Pod Certificates can take effect without a controller restart. `database.postgres.pool.maxConnLifetime` controls how long a connection that opened with an older certificate can stay in use.

## Run multiple controller replica

To ensure that a controller failure does not stop reconciliation, set `controller.replicas` to a number higher than `1`.

```yaml
controller:
  replicas: 3
```

Leader election keeps the replicas from conflicting. One replica holds a Kubernetes lease and performs reconciliation, garbage collection, and scheduled runs; the other replicas stay ready and take over when the leader's lease expires.

> [!NOTE]
> Leader election is always on, including at a single replica, because a rolling update briefly runs two controllers at once. The chart grants the lease permissions unconditionally and exposes no setting to turn election off. `KAGENT_LEADER_ELECT=false` remains available for local testing.

PostgreSQL supports multiple controller replicas without further configuration. A development database that `kagent install` creates is still a single pod backed by one PersistentVolumeClaim, so an installation that runs several controllers for availability against that database has only moved the single point of failure.

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

## Expire idle conversations

A conversation that nobody returns to still holds a row in your database and a pinned runtime revision. The kagent controller deletes idle {{< gloss "Session" >}}Sessions{{< /gloss >}} on a timer so that neither accumulates without a bound.

A leader-only worker sweeps once a minute and deletes every Session whose idle clock has run out, through the same deletion workflow that a client delete uses.

| Value | Default | Description |
| ----- | ------- | ----------- |
| `controller.sessionIdleTTL` | `168h` | How long a Session can be idle before the worker deletes it, as a Go duration. `0` turns the worker off, retries included. A negative value is rejected. |

The `168h` default is seven days. There is no per-agent override and no maximum, so this one value governs every conversation in the installation.

Idle time runs from whichever is later: the Session's creation, or its most recently stored A2A event. Reads, renames, lifecycle calls, and retried writes do not reset the clock, so a conversation that is only ever listed still expires.

Work in progress is never deleted. A Session with a running task survives past the interval, and so does one with a turn waiting at `INPUT_REQUIRED` or `AUTH_REQUIRED`. A pending lifecycle operation or a checkpoint being captured also holds a Session open.

> [!IMPORTANT]
> **Expiry bounds conversations, not history.** Deleting an idle Session removes the Session, its shares, its runtime row, and its creation receipt, and `GetSession` then returns not-found. The A2A context, its tasks, its event history, and any explicit {{< gloss "Checkpoint" >}}checkpoints{{< /gloss >}} stay in PostgreSQL. Sizing a database for a long-running installation means planning for that audit history separately, because no setting on this page bounds it.

Unlike an explicit client deletion, which keeps a tombstone, an expired Session releases its creation request ID. The same caller can reuse that request ID to start a fresh conversation.

To watch the sweep, scrape `kagent_session_expired_total`, which counts the Sessions that it removed. Each removal also logs `expired idle session` at debug level with the Session's ID and how long it had been idle.

## How configuration changes reach agents

kagent watches the Secrets and ConfigMaps that a {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} reference, such as the API keys and TLS certificates in a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}}. An edit to one of them recompiles the pair into a new revision.

A new revision does not reach the Sessions that are already running. A Session is pinned to the revision that it was created from and keeps that revision for life. To move an existing conversation onto new configuration, create a new Session.

The model provider API key is the exception. Agents do not hold the key. Instead, the Agent Substrate egress gateway reads the key from the Secret and adds it to each model request, so a rotated key reaches running Sessions after you restart the egress gateway. See [Rotate the model provider API key](#rotate-the-model-provider-api-key).

This behavior differs from kagent 0.x, where an agent ran as a Deployment and a secret change restarted its pods.

### Rotate the model provider API key

How you rotate the key depends on who owns the Secret. When you set `providers.<provider>.apiKey` in your Helm values, the kagent chart creates the Secret and Helm owns it. Rotate the key through Helm, not by editing the Secret, because a direct edit does not last. With Helm 3, the next `helm upgrade --reuse-values` writes the previous key back. With Helm 4, which applies changes on the server side, the next upgrade fails with a field ownership conflict on the Secret.

1. Update the key.
   {{< tabs >}}
   {{% tab name="Helm manages the Secret" %}}
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
   {{% tab name="You manage the Secret" %}}
   When `providers.<provider>.apiKey` is empty and `apiKeySecretRef` names a Secret that you create, such as one that an ExternalSecret syncs, the chart does not render the Secret. Update the Secret wherever you manage it.
   {{% /tab %}}
   {{< /tabs >}}

2. Restart the Agent Substrate egress gateway. The egress gateway can keep sending the previous key after the Secret changes, and a restart makes it use the new key right away.
   ```bash
   kubectl rollout restart deployment/atenet-egress -n ate-system
   ```

## Route agent traffic through a proxy

When agents and MCP servers sit behind an API gateway or proxy, point kagent at the proxy endpoint so that agent-to-agent and agent-to-MCP traffic follows the same path as the rest of your cluster's egress.

```yaml
proxy:
  url: "http://proxy.kagent.svc.cluster.local:8080"
```

The controller rewrites internally built Kubernetes URLs to the proxy and sets the `x-kagent-host` header so that the proxy routes each request to the correct backend. The rewrite covers one agent invoking another as a tool, and an agent calling a RemoteMCPServer at an internal URL. An external URL, such as a RemoteMCPServer at `https://external.example.com`, is left alone.

## Scrape controller metrics

The controller serves a Prometheus `/metrics` endpoint, turned off by default. To enable the endpoint, grant Prometheus access to it, and review the metrics that the controller reports, see [Metrics]({{< link path="observability/metrics" >}}).

## Isolate what an agent can do

kagent 0.x ran agents as Deployments and relied on a Kubernetes `securityContext` to constrain them. In 1.0, every agent runs as an Actor inside a gVisor sandbox, and the sandbox provides process, network, and filesystem isolation without per-agent security context configuration.

For what the sandbox blocks, how to configure egress, and how to select a sandbox class, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="operations/tune-agent-substrate" >}}` title="Tune Agent Substrate" subtitle="Size the WorkerPool and configure snapshot storage." >}}
  {{< card link=`{{< link path="operations/debug" >}}` title="Debug" subtitle="Work back from a symptom to the resource that caused it." >}}
{{< /cards >}}

---
title: Operational considerations
description: Tune the database, controller replicas, and the node pools that host Substrate Workers before you run kagent in production.
weight: 10
author: kagent.dev
---

A default {{< reuse "kagent-docs/snippets/name-product.md" >}} installation runs one controller replica against the development database that `kagent install` creates, and schedules agents onto any node in the cluster. Each default works for a trial installation, and each needs a decision before you run {{< reuse "kagent-docs/snippets/name-product.md" >}} in production: which database to run, how many controller replicas to keep, and how to treat the nodes that host Workers.

## Controller configuration

Controller configuration fields are set in the `config` section of the {{< reuse "kagent-docs/snippets/name-product.md" >}} Helm chart values. The chart renders these settings into a configuration file at `/etc/kagent/controller.yaml`, which the kagent controller reads.

Settings that describe how Kubernetes runs the controller stay in the Helm values outside of `config`. These include images, probes, volumes, Services, and Secret references. A Secret reference belongs to both groups. The chart projects the Secret into the controller pod, then writes the path of the projected file into the configuration file.

```yaml
config:
  logging:
    level: info
  server:
    grpcReflection: false
    auth:
      mode: insecure
  sessions:
    idleTtl: 604800s
  runtimeDefaults:
    logging:
      level: info
```

The controller enforces the following rules when it reads the settings at start time.

| Rule | What it means |
| ---- | ------------- |
| Durations are seconds | A duration takes protobuf JSON notation. The value is a number with an `s` suffix, as in `604800s` or `0.5s`, and a Go duration string such as `168h` fails validation. |
| The document is strict | The controller rejects an unknown field, a duplicate key, a null value, a YAML alias or merge, and a file with more than one document. |
| Settings load once | The controller validates the whole file at startup, passes the result to its owners, and reads nothing from the environment afterward. A change therefore needs a restart. The chart triggers that restart by checksumming the ConfigMap into the pod. |

An invalid setting stops the controller from starting rather than disabling one feature, so check the controller's logs after you change these values. To check a file before you apply it, run the CLI against the rendered document. The command does not connect to any service.

```bash
kagent config validate --component controller --config controller.yaml
```

Starting the controller with `--check-config` does the same from inside the image, and also confirms that the Secret files the document references are readable.

### Runtime defaults

`config.runtimeDefaults` is the one part of the block that the controller does not apply to itself. The controller compiles those settings into each agent runtime that it starts, so a setting such as the log level, the telemetry endpoints, or the content capture decision must appear in both `config` and `config.runtimeDefaults` to govern the controller and the agents together. A Harness overrides a few of them through its `spec.env` field, and owns none of the telemetry ones. For which variables a Harness may set, see [Controller-owned telemetry variables]({{< link path="agents/agent-harness#controller-owned-telemetry-variables" >}}).

## Choose a database

kagent stores {{< gloss "Session" >}}Sessions{{< /gloss >}} and compiled {{< gloss "Revision" >}}revisions{{< /gloss >}} in PostgreSQL. The kagent chart deploys no database of its own. It reads a connection string from a Kubernetes Secret, and `database.postgres.connectionStringSecretRef` names that Secret and the key inside it.

```yaml
database:
  postgres:
    connectionStringSecretRef:
      name: kagent-postgres
      key: connectionString
```

`kagent install` creates a development database in the cluster, so an installation does not need an external database to start. Run your own PostgreSQL instance for production, so that the data outlives the cluster that kagent runs on.

### The development database

`kagent install` creates a database for you unless you pass `--skip-database-setup`. It deploys a single-replica `kagent-postgresql` Deployment backed by a 500Mi PersistentVolumeClaim, creates the roles that kagent and Agent Substrate connect as, and writes the connection Secrets for both: `kagent-postgres` in the kagent namespace, and `substrate-postgres-readwrite` and `substrate-postgres-owner` in `ate-system`.

Connections to this database do not use a password. When `database.postgres.clientCertificate.enabled` is set to `true`, which `kagent install` does, each client authenticates with a Pod Certificate projected into its pod under `/run/postgres.podcert.ate.dev`. The connection string points its `sslcert` and `sslkey` parameters at those files.

> [!IMPORTANT]
> The development database is a single pod backed by one PersistentVolumeClaim, and `kagent install` sizes that claim at 500Mi. Losing the pod's volume loses every Session and every compiled revision, so move a production installation to a PostgreSQL instance that you manage.

### Use an external PostgreSQL instance

For production, run PostgreSQL outside the cluster's lifecycle so that a kagent uninstall cannot delete the data.

1. Create a Secret that holds the connection string.

   ```bash
   kubectl create secret generic my-postgres \
     --namespace kagent \
     --from-literal=connectionString="postgresql://user:password@postgres.example.com:5432/kagent?sslmode=verify-full"
   ```

2. Point the chart at your Secret in your Helm values file.

   ```yaml
   database:
     postgres:
       connectionStringSecretRef:
         name: my-postgres
         key: connectionString
       clientCertificate:
         enabled: false
   config:
     database:
       role: kagent_owner
       schema: kagent
       vectorEnabled: true
       skipMigrations: false
       pool:
         maxConns: 20
         minConns: 2
   controller:
     replicas: 3
   ```

   The two blocks divide along the same line as the rest of the chart. `database.postgres` covers the Kubernetes packaging, meaning the Secret reference and the client certificate. `config.database` sets what the controller reads from its configuration file. For that division, see [Controller configuration](#controller-configuration).

   | Setting | Description |
   | ------- | ----------- |
   | `database.postgres.connectionStringSecretRef` | The Secret and key that hold the connection string. Keeping the string in a Secret keeps the credentials out of Helm values. The controller restarts to pick up a changed Secret. |
   | `database.postgres.clientCertificate` | Set `enabled` to `true` only for a database that authenticates clients with Pod Certificates, such as the one that `kagent install` creates. The connection string must then point its `sslcert` and `sslkey` parameters at the files under `/run/postgres.podcert.ate.dev`. An external instance that authenticates with a password, such as the one in the preceding example, leaves `enabled` at `false`. |
   | `config.database.role` | The role that kagent assumes on each connection. Give each installation that shares one database a distinct role. |
   | `config.database.schema` | The schema that holds kagent's tables. `config.database.vectorSchema` names the schema that holds the shared `pgvector` extension, and kagent needs `USAGE` on it. |
   | `config.database.vectorEnabled` | Set to `true` only when the instance has the `pgvector` extension installed. The setting enables the vector migration, and features that depend on it, such as [long-term memory]({{< link path="agents/agent-memory" >}}), fail without the extension. The development database does not include `pgvector`. |
   | `config.database.pool` | Connection pool sizing, through `maxConns`, `minConns`, `maxConnIdleTime`, and `maxConnLifetime`. The two durations take protobuf seconds notation, as in `1800s`. Omit the fields to keep the pgx library defaults. |
   | `config.database.skipMigrations` | Set to `true` to stop the controller from running migrations at startup. The controller then verifies that the database is already migrated and fails if it is not. Apply the migrations from a pipeline before you install or upgrade. |

3. Apply the values to the kagent Helm release.

   ```bash
   helm upgrade --install kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --values kagent.yaml
   ```

## Run multiple controller replicas

So that a controller failure does not stop reconciliation, set `controller.replicas` to a number higher than `1`.

```yaml
controller:
  replicas: 3
```

Leader election keeps the replicas from conflicting. One replica takes a Kubernetes lease and performs reconciliation, garbage collection, and scheduled runs. The other replicas stay ready and take over when the leader's lease expires.

> [!IMPORTANT]
> If an installation runs on the development database, extra controller replicas do not make the installation highly available. That database is a single pod backed by one PersistentVolumeClaim, so losing it stops every replica at once. Run an external PostgreSQL instance before counting controller replicas toward availability.

## Sign push notification callbacks

Agent-to-Agent (A2A) push notifications are unsigned by default. A callback carries no `Authorization` header unless you supply an Ed25519 signing key, and the JSON Web Key Set (JWKS) endpoint returns `404`. Push notifications still work without a key, so sign them only where a receiver must verify that a callback came from your installation.

To sign callbacks, generate one unencrypted PKCS#8 Ed25519 key and store it in a Secret in the kagent namespace.

1. Generate the signing key.
   ```bash
   openssl genpkey -algorithm ED25519 -out private-key.pem
   ```

2. Store the key in a Secret. The Secret must hold the key under the `private-key.pem` key.
   ```bash
   kubectl create secret generic kagent-push-signing -n kagent \
     --from-file=private-key.pem
   ```

Then name that Secret in your {{< reuse "kagent-docs/snippets/name-product.md" >}} Helm values.

```yaml
controller:
  push:
    signing:
      secretName: kagent-push-signing
config:
  gateway:
    push:
      issuer: https://kagent.example.com
```

| Setting | Description |
| ------- | ----------- |
| `controller.push.signing.secretName` | The Secret that holds `private-key.pem`. Leave it empty to send push notifications without JSON Web Token (JWT) authentication. Helm references a Secret that you create, and neither generates nor rotates signing keys. An invalid key stops the controller from starting. Naming a Secret here projects it into the controller as the `config.gateway.push.signingPrivateKeyFile` setting. |
| `config.gateway.push.issuer` | The stable URL that webhook receivers trust as the JWT issuer. Omit the key, and the chart derives the issuer from `ui.externalUrl`, and then from the in-cluster A2A gateway URL. An empty string is rejected, because the controller requires an absolute `http://` or `https://` URL. |

With a signing key configured, each callback attempt carries a fresh five-minute Ed25519 JWT in an `Authorization: Bearer` header, and the `/.well-known/jwks.json` endpoint publishes the matching public key.

Every controller replica must load the same key. After you rotate the key, restart all controller pods together, because replicas that run on different keys publish different JSON Web Key Sets.

## Node operations

A {{< gloss "Worker" >}}Worker{{< /gloss >}} is an ordinary Kubernetes pod, so every node event reaches the {{< gloss "Actor" >}}Actors{{< /gloss >}} that this Worker hosts. What the event costs depends on what each Actor was doing when the node went away.

* A suspended Actor costs nothing. Its state is already written to snapshot storage, and it occupies no Worker while it waits, so the next message resumes it onto whichever Worker in the pool has availability.
* An awake Actor is lost. The Session's in-flight state lives in the memory of its sandbox on the Worker, and Agent Substrate writes nothing to snapshot storage until this Actor suspends.

A lost Actor moves to `ACTOR_STATE_CRASHED`, and Agent Substrate refuses `resume` and `suspend` on an Actor in this state. Through kagent, deleting the Actor and starting a new {{< gloss "Session" >}}Session{{< /gloss >}} is the only available option, so the Session ends with the node.

<!-- REVIEW (runtime reviewer): Agent Substrate does have a recovery verb. RevertActor (cmd/ateapi/internal/controlapi/workflow_revert.go) accepts a CRASHED actor, returns it to SUSPENDED, leaves the external snapshot in place for a later resume, and needs no live worker. kagent never calls it, so a kagent user cannot reach it today and this section describes the kagent-level outcome only. Confirm whether kagent should expose revert before GA, and rewrite this paragraph if it does. -->

Many Actors on a node are suspended at any moment, so losing the node crashes only the ones that are mid-turn. Those Actors still lose their Sessions, and a node pool that runs Workers therefore needs stricter rules than the rest of the cluster. A Worker pod that Kubernetes deletes gives its Actors time to suspend. Node auto-upgrade, a spot reclaim, and a pool scale-down do not.

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

A provider reclaims spot and preemptible nodes on its own schedule, and each reclaim crashes every Actor that was awake on the node. A pool on reclaimable capacity therefore trades a lower bill for Sessions that end without warning. Use these nodes only where the agents on this pool can afford to lose a turn.

### WorkerPool scale-down

When you scale a serving WorkerPool down, it removes pods without suspending the Actors on them. This strands Sessions in the same way that a reclaimed node does. For pool sizing and the rest of the Substrate runtime settings, see [Tune Agent Substrate]({{< link path="operations/tune-agent-substrate" >}}).

## Expire idle Sessions

Every {{< gloss "Session" >}}Session{{< /gloss >}} holds database records and pins a runtime revision for as long as it exists, including a Session that is never opened again. The kagent controller deletes idle Sessions on a timer. Deleting idle sessions bounds the records that a kagent installation stores as well as the revisions that it holds open.

A leader-only worker sweeps Sessions once a minute and deletes every Session that has been idle past the limit, using the same deletion workflow that a client delete uses. `config.sessions.expirationInterval` sets that sweep interval, and it must be positive.

To choose how long a Session can be idle before the worker deletes it, set `config.sessions.idleTtl` in your {{< reuse "kagent-docs/snippets/name-product.md" >}} Helm values. The value is a duration in seconds with an `s` suffix, and it defaults to `604800s`, or seven days. Setting it to `0s` turns the worker off, retries included, and a negative value is rejected.

```yaml
config:
  sessions:
    idleTtl: 2592000s
```

Durations in the `config` block follow protobuf JSON notation, so seconds are the only unit. A Go duration string such as `720h` fails validation and stops the controller from starting.

No per-agent override exists, so this one value governs every Session in the installation. No maximum exists either, so a longer value is accepted.

Idle time runs from whichever is later: the Session's creation, or its most recently stored A2A event. Reads, renames, lifecycle calls, and retried writes do not reset it, so a Session that is only ever listed still expires.

<!-- REVIEW (docs): forking a checkpoint is unavailable at kagent v1.0.0-alpha11, so the fork expiry behavior is removed from here rather than described as something a reader can reach. Restore it when ForkSession stops rejecting: a fork keeps its source's event timestamps, and its own creation time gives it a full lifetime rather than an almost-expired one. -->

Work in progress is never deleted. A Session with a running task survives past the interval, and so does one with a turn waiting at `INPUT_REQUIRED` or `AUTH_REQUIRED`. A pending lifecycle operation or a checkpoint being captured also holds a Session open.

> [!IMPORTANT]
> **Expiry deletes the Session, not its history.** Deleting an idle Session removes the Session, its shares, its runtime row, and its creation receipt, so `GetSession` returns not-found afterward. The A2A context, its tasks, its event history, and any explicit {{< gloss "Checkpoint" >}}checkpoints{{< /gloss >}} stay in PostgreSQL, and a retained checkpoint outlives the Session it was taken on. kagent has no setting that bounds this retained history, so size a database for a long-running installation with the audit history planned separately.

<!-- REVIEW: the creation request ID behaviour belongs with the Session API rather than on an operations page, so it is parked here until a Sessions reference page exists. The behaviour: an expired Session releases its creation request ID, unlike an explicit client deletion, which keeps a tombstone, so the same caller can reuse that request ID to start a fresh Session. -->

A Session share carries its own lifetime, separate from the Session's idle limit. A client sets `CreateSessionShareRequest.ttl` when it creates a share, and `config.sessions.shareMaxTtl` caps what a client may ask for. A positive cap rejects any request that exceeds it, and supplies the lifetime for a request that omits `ttl`. The default `0s` leaves a share unbounded unless the client sets `ttl`, and a negative value is rejected at startup.

```yaml
config:
  sessions:
    shareMaxTtl: 86400s
```

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

---
title: Tune Agent Substrate
description: Learn how to size a WorkerPool, configure snapshot storage, and move a pool to another sandbox class.
weight: 20
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} runs every agent on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}). An installation with `kagent install` creates one {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} named `kagent-default` with a single Worker on the `gvisor` sandbox class. The installation writes snapshots to the object store that the Agent Substrate chart bundles.

The single Worker reports capacity for 1000 Actors, so a default pool serves many concurrent {{< gloss "Session" >}}Sessions{{< /gloss >}} before it runs out of slots. Before the installation serves production traffic, tune the number of Workers, the snapshot storage location, and the Worker resource requests. You can also move a pool to the `microvm` sandbox class.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `config.server.grpcReflection=true`. Reflection lets a gRPC client discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. Confirm that you have administrative access to the cluster, because this guide scales WorkerPools and reads cluster-scoped resources.

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl) and [jq](https://jqlang.org/download/). The kagent controller reports the runtime state through its `SystemService` methods, and kubectl and the kagent CLI do not expose these methods.

## Inspect the runtime

Read the current state of the runtime before you change it. The rest of this guide uses values from this section, including the pool name and its `READY` count, the snapshot path that Actors are writing to, and the Worker image that the pool runs.

1. Check the WorkerPool's Worker counts. These counts show whether the pool is producing the Workers that you asked for.
   ```bash
   kubectl get workerpools -n kagent
   ```
   Example output:
   ```console
   NAME             DESIRED   REPLICAS   READY   SANDBOXCONFIG    RESOLVED   AGE
   kagent-default   1         1          1       gvisor-default   True       3h
   ```
   `DESIRED` is the replica count that you asked for, `REPLICAS` counts the Worker pods that exist, and `READY` counts the pods that are serving. A gap between `DESIRED` and `REPLICAS` means the controller is not creating pods. A gap between `REPLICAS` and `READY` means the pods exist but are not starting. Raising the replica count helps only when all three counts agree.

2. Port-forward the controller, and leave the command running in a second terminal.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

3. Read the runtime summary. `GetSubstrateSummary` returns each WorkerPool in the namespace and counts the {{< gloss "Actor" >}}Actors{{< /gloss >}} by state. The `jq` filter keeps the pool's name, Worker image, and ready count from the full WorkerPool resource.
   ```bash
   grpcurl -plaintext -d '{"namespace":"kagent","atespace":"kagent"}' \
     localhost:8083 kagent.api.v1.SystemService/GetSubstrateSummary \
     | jq '{workerPools: [.workerPools[].resource.value | {name: .metadata.name, workerImage: .spec.workerImage, readyReplicas: .status.readyReplicas}], actorCount, workerCount, actorStatusCounts}'
   ```
   Example output:
   ```json
   {
     "workerPools": [
       {
         "name": "kagent-default",
         "workerImage": "{{< reuse "kagent-docs/snippets/image-substrate.md" >}}/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}",
         "readyReplicas": 1
       }
     ],
     "actorCount": "3",
     "workerCount": "1",
     "actorStatusCounts": [
       {
         "count": "1",
         "state": "ACTOR_STATE_RUNNING"
       },
       {
         "count": "2",
         "state": "ACTOR_STATE_SUSPENDED"
       }
     ]
   }
   ```
   An Actor in `ACTOR_STATE_RUNNING` is running a turn on a Worker. A suspended Actor does not occupy a Worker.

4. List the Actors in an {{< gloss "Atespace" >}}atespace{{< /gloss >}} with their latest snapshot. The atespace is the namespace of the Agent. Each Actor runs one {{< gloss "Session" >}}Session{{< /gloss >}} and is named after it.
   ```bash
   grpcurl -plaintext -d '{"atespace":"kagent"}' \
     localhost:8083 kagent.api.v1.SystemService/ListSubstrateActors \
     | jq '.actors[] | {name: .metadata.name, uid: .metadata.uid, state: .status.state, snapshotUri: .status.snapshots[-1].durableSnapshot.object.snapshotUri}'
   ```
   Example output:
   ```json
   {
     "name": "session-01a18f1f-7d3a-7816-8f67-4eb5d6e0ed03",
     "uid": "496dbbad-a91d-43af-b963-725efab6556a",
     "state": "ACTOR_STATE_SUSPENDED",
     "snapshotUri": "s3://ate-snapshots/kagent/atespaces/kagent/actors/496dbbad-a91d-43af-b963-725efab6556a/snapshots/dc751a3f-b563-45e0-b244-e89523821d95"
   }
   ```

5. List the Workers and their capacity. A Worker hosts many Actors at once, and `capacity.actors` is the most that one Worker accepts.
   ```bash
   grpcurl -plaintext -d '{"namespace":"kagent"}' \
     localhost:8083 kagent.api.v1.SystemService/ListSubstrateWorkers \
     | jq '.workers[] | {workerPod, nodeName, state: .status.state, capacity: .status.capacity}'
   ```
   Example output:
   ```json
   {
     "workerPod": "kagent-default-5f4c588464-f7f9l",
     "nodeName": "worker-node-1",
     "state": "WORKER_STATE_ACTIVE",
     "capacity": {
       "cpuMillicores": "10000",
       "memoryBytes": "12470472704",
       "actors": 1000
     }
   }
   ```

   `ListSubstrateActors` and `ListSubstrateWorkers` return 50 entries per page by default. To request up to 100, set `page.limit`. If a response contains a `page.nextPageToken` value, pass it as `page.pageToken` in the next request, such as `{"atespace":"kagent","page":{"pageToken":"<token>"}}`.

## Size a WorkerPool

The replica count is the only capacity setting on a pool. To set it, first determine what consumes Worker capacity.

A {{< gloss "Worker" >}}Worker{{< /gloss >}} runs each Actor only while a turn is running. kagent suspends an Actor at every turn boundary and frees the Actor's share of the Worker, as described in [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume" >}}). An idle {{< gloss "Session" >}}Session{{< /gloss >}} therefore does not use Worker capacity.

Each Worker reports an Actor capacity when it starts. The Worker build fixes this capacity, and no WorkerPool field changes it. The `gvisor` and `microvm` Worker builds both report a capacity of 1000 Actors.

Agent Substrate checks this capacity on every placement. It weighs a Worker's spare CPU and memory only when the ActorTemplate states how much CPU and memory one Actor needs. An ActorTemplate that the kagent controller compiles does not state per-Actor CPU or memory, so a pool places a Session's Actor only on a Worker's free slots, regardless of how loaded the Worker's node already is. Worker resource limits still matter, because they govern how Kubernetes packs Workers onto nodes.

Size the pool for the number of turns that run at the same time, not for the number of Agents or Sessions that you have created. A cluster with hundreds of Sessions that are each used occasionally needs far fewer Workers than the number of Sessions suggests.

Because the WorkerPool exposes a scale subresource, you can scale a pool in place by using `kubectl scale`. Use the pool name that you read in [Inspect the runtime](#inspect-the-runtime).

```bash
kubectl scale workerpool kagent-default -n kagent --replicas=8
```

To set the replica count in your Helm values, set `substrateWorkerPool.replicas` and upgrade your kagent release.

```yaml
substrateWorkerPool:
  replicas: 8
```

### Recognize an undersized pool

Agent Substrate reports pool capacity through its metrics. Each Worker publishes a state of `idle`, `partial`, `at_capacity`, or `unschedulable`, which together show how much of a pool is in use. A placement that does not find a suitable Worker records a `no_capacity` outcome. Agent Substrate treats this outcome as a normal result. It does not set an error type, and it does not raise an alert on its own. To tell a pool that is merely busy from one that is too small, watch the share of Workers at `at_capacity` and the rate of `no_capacity` placements.

None of those signals reach the caller. A turn that cannot get a Worker waits for one, and a turn that waits too long fails with a generic timeout that does not mention capacity or the pool.

```console
ERROR:
  Code: Internal
  Message: actor "ai-01a087c0-1d72-775a-9a32-566acac7b685" request timed out
```

Because short turns release their capacity quickly, a pool under mild pressure absorbs the load and only sheds the requests that wait past the deadline. The result is intermittent timeouts under concurrency rather than a clean failure. The kagent controller log and the Agent Substrate API log do not record a capacity message for these timeouts. To confirm the diagnosis, check the `at_capacity` and `no_capacity` signals and the pool's `READY` count. If the pool is under pressure, raise the replica count.

### Set resource requests on Workers

Generated Worker pods do not set resource requests or limits unless you supply them.

A Worker with no limits reports its node's entire allocatable capacity as its own. Every Worker on that node reports the same figures, so Kubernetes cannot stop more Workers from being scheduled onto a node than the node can run. Set requests and limits on any pool that serves production traffic.

```yaml
substrateWorkerPool:
  template:
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: "2"
        memory: 4Gi
```

The same `template` block also accepts `nodeSelector`, `tolerations`, `priorityClassName`, and `nodeAffinity`, so you can keep Workers on nodes that you set aside for them.

<!-- REVIEW (WorkerPool owner): the CPU and memory figures above are illustrative rather than measured, and the chart ships no defaults to derive them from. Confirm a recommended request and limit per Worker for a pool that carries production traffic, and the scheduling guidance that goes with it, before this section presents either as a recommendation. -->

## Configure Worker identity and placement

Each Worker pool runs as its own ServiceAccount, and kagent places Actors on a pool by two labels. Both settings live in the `substrateWorkerPool` block of the kagent Helm values.

### Give Workers their own ServiceAccount

Worker pods run as a ServiceAccount that the chart creates, named after the pool. On a default installation that name is `kagent-default`. The chart does not bind a Role or ClusterRole to the account. Its purpose is to keep Workers off the namespace's `default` ServiceAccount, and to give you a Worker identity that you can attach your own policy to, such as an IAM role or an admission rule.

To run Workers as an account that you manage outside the chart, stop the chart from creating one and name your own account instead. That account must already exist in the release namespace, because neither the chart nor Kubernetes creates it on demand.

```yaml
substrateWorkerPool:
  serviceAccount:
    create: false
    name: my-worker-sa
```

| Field | Description |
| ----- | ----------- |
| `substrateWorkerPool.serviceAccount.create` | Whether the chart creates the Worker ServiceAccount. Defaults to `true`. An account that the chart creates gets the image pull secrets from `imagePullSecrets` and `global.imagePullSecrets`, with duplicate entries removed. Workers can then pull a `workerImage` from a private or mirrored registry. To use an account that you manage yourself, set the field to `false`. In that case, add the image pull secrets to your account, because the chart does not change an account that it does not create. |
| `substrateWorkerPool.serviceAccount.name` | The ServiceAccount that Worker pods run as. Omit it to use the pool name. The chart writes this value into the pool's pod template and overwrites any `serviceAccountName` under `substrateWorkerPool.template`. |

### Keep placement scoped to the pool's namespace {#workerpool-placement-labels}

kagent selects a WorkerPool by name and namespace when it compiles an ActorTemplate, and the generated ActorTemplate matches Workers on the `kagent.dev/worker-pool-name` and `kagent.dev/worker-pool-namespace` labels. Agent Substrate matches those labels across every pool and does not check the WorkerPool's namespace. A pool that sets only the name label can therefore be selected from another namespace.

The chart sets both labels from the pool's name and namespace, and applies them after `substrateWorkerPool.labels`. An extra label that reuses either key is overwritten. To add your own labels, set `substrateWorkerPool.labels`.

```yaml
substrateWorkerPool:
  name: kagent-default
  labels:
    environment: production
```

kagent does not label a pool that you manage outside the chart. Set both keys yourself, and match each value to the pool's name and namespace.

```yaml
apiVersion: ate.dev/v1
kind: WorkerPool
metadata:
  name: external-pool
  namespace: team-a
  labels:
    kagent.dev/worker-pool-name: external-pool
    kagent.dev/worker-pool-namespace: team-a
spec:
  replicas: 2
  sandboxClasses:
    - name: gvisor
  workerImage: "{{< reuse "kagent-docs/snippets/image-substrate.md" >}}/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}"
```

Earlier releases placed Actors with a single `kagent.dev/worker-pool` label, and the chart no longer sets it. A Session or Sandbox that is pinned to a revision from one of those releases still selects that key. Keep the old label on the pool until you recreate those Sessions and Sandboxes.

```yaml
substrateWorkerPool:
  labels:
    kagent.dev/worker-pool: kagent-default
```

## Configure snapshot storage

Agent Substrate writes every suspended Actor to an object store, so the bucket stores the Session state that a resume restores. The following settings decide where a snapshot lands.

- In the `substrate` release values, `atelet.storageBackend` selects the storage client of the `ate-api-server`. `rustfs.enabled` decides whether the chart supplies credentials for that client.
- In the `substrate-atelet` release values, `objectStore` selects the storage client of `atelet`, with its endpoint and credentials.
- In each {{< gloss "Harness" >}}Harness{{< /gloss >}}, `spec.substrate.snapshotPolicy.location` sets the bucket and prefix that the Harness's Actors write under. The field is required, and it must point into a bucket that the selected client can reach.

### The bundled object store

Because `rustfs.enabled` defaults to `true`, the `substrate` chart installs an in-cluster object store and configures the `ate-api-server` Deployment to use it. The [installation guide]({{< link path="setup/installation#install-agent-substrate" >}}) points the `substrate-atelet` release at the same store through its `objectStore` values. The store claims a 1Gi PersistentVolumeClaim, and it accepts an access key and secret key that the chart sets to published defaults.

> [!IMPORTANT]
> The bundled store is not durable, and every installation receives the same credentials for it. Before a production installation serves real traffic, [move its snapshots to your own bucket](#move-snapshots-to-an-external-bucket).

### Move snapshots to an external bucket

Replace the bundled store with a bucket in Google Cloud Storage, Amazon S3, or an S3-compatible store. The Agent Substrate backend and every Harness location must point at the same bucket.

1. Save an Agent Substrate values file that disables the bundled store and selects the storage backend. Both Agent Substrate releases read this file. Set `atelet.storageBackend` and `objectStore.backend` to `s3` for Amazon S3 or an S3-compatible store, or to `gcs` for Google Cloud Storage. The empty `objectStore` values clear the endpoint and the credentials of the bundled store from the `substrate-atelet` release.
   ```bash
   cat > substrate-storage.yaml <<EOF
   rustfs:
     enabled: false
   atelet:
     storageBackend: s3
   objectStore:
     backend: s3
     endpoint: ""
     region: ""
     pathStyle: false
     credentialsSecret: ""
   EOF
   ```

2. Supply the credentials that your backend needs. Setting `rustfs.enabled` to `false` stops the chart from setting the `AWS_*` variables, so neither component receives an endpoint or a key from Helm. Each storage client reads its credentials from the pod's own environment.

   - For Google Cloud Storage, the client uses application default credentials. Bind the components' ServiceAccounts by using [Workload Identity Federation for GKE](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/workload-identity). The chart does not render a Helm value for Google credentials, so no other value is needed.
   - For Amazon S3, the client reads the standard AWS environment and uses a role that the pod assumes. No static key is needed.
   - For an S3-compatible store, store the static credentials in a Secret in the `ate-system` namespace, and pass them with two more variables through `objectStorePlugin.extraEnv`. `AWS_ENDPOINT_URL` sets the store's API endpoint. Without this variable, the client resolves the endpoint to Amazon S3. `AWS_S3_USE_PATH_STYLE` puts the bucket name in the request path instead of the hostname. Most S3-compatible stores require path-style addressing. The chart applies this list to the storage client in both the `atelet` and `ate-api-server` pods. Do not set these variables through `atelet.extraEnv`, because that list reaches the `atelet` container, which no longer reads storage settings.
   ```bash
   kubectl create secret generic s3-credentials -n ate-system \
     --from-literal=access-key-id=<access-key-id> \
     --from-literal=secret-access-key=<secret-access-key>
   cat >> substrate-storage.yaml <<EOF
   objectStorePlugin:
     extraEnv:
       - name: AWS_ENDPOINT_URL
         value: https://objects.example.com
       - name: AWS_S3_USE_PATH_STYLE
         value: "true"
       - name: AWS_ACCESS_KEY_ID
         valueFrom:
           secretKeyRef:
             name: s3-credentials
             key: access-key-id
       - name: AWS_SECRET_ACCESS_KEY
         valueFrom:
           secretKeyRef:
             name: s3-credentials
             key: secret-access-key
   EOF
   ```

3. Upgrade both Agent Substrate releases by using the values file. Upgrade `substrate-atelet` first.
   ```bash
   helm upgrade substrate-atelet \
     {{< reuse "kagent-docs/snippets/helm-substrate-path.md" >}}/substrate-atelet \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system \
     --reuse-values \
     -f substrate-storage.yaml
   helm upgrade substrate \
     {{< reuse "kagent-docs/snippets/helm-substrate.md" >}} \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system \
     --reuse-values \
     -f substrate-storage.yaml
   ```

4. Set `spec.substrate.snapshotPolicy.location` on each Harness to the new bucket. Repeat the command for each Harness.
   ```bash
   kubectl patch harness <harness-name> -n kagent --type merge \
     -p '{"spec":{"substrate":{"snapshotPolicy":{"location":"s3://<your-bucket>/kagent/"}}}}'
   ```

5. Confirm that a new snapshot lands under the `location` that you set. Send a message to a Session, so that kagent suspends the Session's Actor when the turn ends. Then read the Actor's latest `snapshotUri`. Because the backend and the location are configured separately, a mismatch between them prevents the Actor from resuming from its snapshot.
   ```bash
   grpcurl -plaintext -d '{"atespace":"kagent"}' \
     localhost:8083 kagent.api.v1.SystemService/ListSubstrateActors \
     | jq '.actors[] | select(.metadata.name == "session-<session-id>") | {state: .status.state, snapshotUri: .status.snapshots[-1].durableSnapshot.object.snapshotUri}'
   ```
   Example output, with the `snapshotUri` value under the bucket and prefix that the Harness sets:
   ```json
   {
     "state": "ACTOR_STATE_SUSPENDED",
     "snapshotUri": "s3://<your-bucket>/kagent/atespaces/kagent/actors/b0a84d88-9eab-4fb1-97f0-9c93a6fc89a4/snapshots/82d37284-bb19-4351-90fb-b84c6f26595b"
   }
   ```

### Storage variables on the snapshot components

The `atelet` DaemonSet writes a snapshot. The `ate-api-server` Deployment manages the snapshot. Each pod reaches the bucket through an `objectstore-plugin` sidecar container, and only that container reads the storage variables. The chart renders `atelet.storageBackend` as the `ATE_STORAGE_BACKEND` variable on both sidecars, so one Helm value keeps the two in agreement. If `ATE_STORAGE_BACKEND` is set directly on the `atelet` or `ate-api-server` container, that container fails to start.

If a snapshot fails to write, read these variables from the `objectstore-plugin` container. Because the next Helm upgrade overwrites a direct edit to the pod environment, change these variables in the Helm values.

| Variable | Purpose |
| -------- | ------- |
| `ATE_STORAGE_BACKEND` | `s3` selects the S3 client. Any other value, including unset, selects Google Cloud Storage. |
| `AWS_REGION` | Region for the S3 client. |
| `AWS_ENDPOINT_URL` | Endpoint for an S3-compatible store that is not Amazon S3. |
| `AWS_S3_USE_PATH_STYLE` | `true` selects path-style addressing, which most S3-compatible stores need. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Static credentials for the S3 client. |

### Snapshot layout in the bucket

Agent Substrate builds a path per Actor under the Harness prefix, so one bucket serves many Harnesses without collision. The `<actor-uid>` segment is the Actor's `metadata.uid`, not the Session ID in the Actor's name. To find an Actor's snapshot, read the `snapshotUri` value from the Actor.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/actors/<actor-uid>/snapshots/<snapshot-uid>
```

A {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} uses a different path. kagent creates an Agent Substrate {{< gloss "Tag" >}}Tag{{< /gloss >}} for each checkpoint, and tagging copies the Actor's snapshot into the Tag's own prefix. A Tag references exactly one snapshot. Its objects sit directly under `tags/` without a `snapshots/` segment. The `<tag-uid>` segment is the Tag's `metadata.uid`, and the path does not contain the `checkpoint-<id>` name that kagent gave the Tag.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/tags/<tag-uid>
```

A backup or lifecycle policy must cover both prefixes, because one scoped to `actors/` omits every checkpoint and understates how much the bucket stores.

## Keep pools on the sandbox class that they serve

kagent sets the sandbox class on the pool that the chart creates. A default installation runs the `gvisor` class, and every {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}} that kagent generates inherits the class of the pool that hosts it. Change this setting only if you move a pool to the `microvm` class or change a pool's Worker build. For what each class isolates, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#sandbox-classes" >}}).

A pool's class, its Worker image, and the cluster's SandboxConfig must all name the same sandbox class. If the three settings disagree, Agent Substrate rejects the Actor.

### Set a pool's sandbox class

Set the pool's class, its Worker image, and its SandboxConfig together.

1. Save a kagent values file that sets the class and the matching Worker build.

   {{< tabs >}}
   {{% tab name="gvisor" %}}
   ```bash
   cat > kagent-sandbox-class.yaml <<EOF
   substrateWorkerPool:
     sandboxClass: gvisor
     workerImage: "{{< reuse "kagent-docs/snippets/image-substrate.md" >}}/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}"
   EOF
   ```
   {{% /tab %}}
   {{% tab name="microvm" %}}
   ```bash
   cat > kagent-sandbox-class.yaml <<EOF
   substrateWorkerPool:
     sandboxClass: microvm
     workerImage: "{{< reuse "kagent-docs/snippets/image-substrate.md" >}}/ateworker-microvm:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}"
   EOF
   ```
   {{% /tab %}}
   {{< /tabs >}}

   | Field | Description |
   | ----- | ----------- |
   | `sandboxClass` | The sandbox runtime family for this pool's Workers, and for every ActorTemplate that kagent generates for the pool. Omitting the field selects `gvisor`. |
   | `workerImage` | The Worker build that provides the runtime. `ateworker-gvisor` serves the `gvisor` class and `ateworker-microvm` serves `microvm`. A build that does not match its pool's class never registers a Worker. |

2. Confirm that the cluster has a SandboxConfig for this class. The chart sets the pool's `configRef` to a fixed SandboxConfig name for each class, `gvisor-default` for a `gvisor` pool and `microvm` for a `microvm` pool. To use another SandboxConfig, set `substrateWorkerPool.sandboxConfigRef`. A default installation creates only the `gvisor` class, because the Agent Substrate chart applies `sandboxconfig-gvisor.yaml` and kagent installs nothing for `microvm`.
   ```bash
   kubectl get sandboxconfigs
   ```
   Example output:
   ```console
   NAME             CLASS    AGE
   gvisor-default   gvisor   26h
   microvm          microvm  26h
   ```

   If the output does not list `microvm` and the pool uses that class, add it. Run the Agent Substrate `ate-setup` tool from a checkout of the [Agent Substrate repository](https://github.com/kagent-dev/substrate) at the release that matches your chart. The tool stages the runtime assets in the cluster's object store and applies the `microvm` SandboxConfig.
   ```bash
   go run ./cmd/ate-setup deploy sandboxconfig --sandbox-classes=microvm
   ```

3. Upgrade the kagent release by using the values file.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --reuse-values \
     -f kagent-sandbox-class.yaml
   ```

4. Confirm that the pool's `READY` count matches its `DESIRED` count.
   ```bash
   kubectl get workerpools -n kagent
   ```

### Diagnose a class mismatch

Each of the three settings fails differently when it disagrees with the others.

- A Worker whose pool class does not match an ActorTemplate's class reports `RevisionInvalid` with `unsupported sandbox class "<value>"`, and placement of the Actor fails with `WorkerPoolNotFound`.
- A missing SandboxConfig leaves the pool's class unresolved. The `Resolved` condition under the WorkerPool's `status.sandboxClasses` is `False`. The reason is `SandboxConfigNotFound` when the SandboxConfig that `configRef` references does not exist, or `DefaultConfigNotFound` when the pool does not set a `configRef` and the class does not have a default.
- A Worker image built for another class never registers, so the pool reports fewer ready Workers than its replica count.

### Considerations before changing a running pool

The following constraints apply to a pool that already serves traffic.

- **Snapshots do not move between sandbox classes.** An Actor cannot resume from a snapshot that a different class produced, so changing the class of a pool that hosts live Actors strands their state.
- **Nodes fetch `gvisor` runtime assets from a public Google Cloud Storage URL**, named in the SandboxConfig, independently of the storage backend that you configured for snapshots. A cluster with restricted egress needs a path to this URL, or a SandboxConfig that points at a copy that you host. The `microvm` assets come from the cluster's object store, where `ate-setup` stages them.
- **A Worker image change rolls every Worker pod.** The pods take a one-hour termination grace period, so an in-flight turn finishes. A rollout of a busy pool takes as long as its longest running turn.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Learn when an Actor releases its Worker and how it resumes from a snapshot." >}}
  {{< card link=`{{< link path="about/substrate-runtime/sandboxing" >}}` title="Sandboxing" subtitle="Compare what the gvisor and microvm sandbox classes isolate." >}}
  {{< card link=`{{< link path="operations/multiple-namespaces" >}}` title="Run agents in multiple namespaces" subtitle="Prepare a WorkerPool and a credential policy in each namespace that runs agents." >}}
{{< /cards >}}

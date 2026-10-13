---
title: Tune Agent Substrate
description: Learn how to size a WorkerPool, configure snapshot storage, and keep Workers on the sandbox class that kagent requires.
weight: 20
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} runs every agent on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}). A default installation creates one {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} named `kagent-default`, holding a single Worker on the `gvisor` sandbox class, and it writes snapshots to the object store that the Agent Substrate chart bundles.

This single Worker reports capacity for 1000 Actors, so a default pool serves many concurrent {{< gloss "Session" >}}Sessions{{< /gloss >}} before it runs out of slots. Three settings require tuning before the installation can carry real traffic: how many Workers to run, where snapshots are stored durably, and what resource requests the Worker pods carry. This page covers your options for tuning each setting, and steps for moving a pool to the `microvm` sandbox class.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `controller.grpc.reflection=true`. Reflection lets a gRPC client discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. Confirm that you have administrative access to the cluster, because this guide scales WorkerPools and reads cluster-scoped resources.

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl). `GetSubstrateStatus` has no kubectl or kagent command equivalent, so calling it directly is the only way to get the fuller view of the runtime.

## Inspect the runtime

Read the current state of the runtime before you change it. Three values from this section carry into the rest of this guide: the pool name and its `READY` count, the snapshot path that Actors are writing to, and the Worker image that the pool runs.

1. Check the WorkerPool's Worker counts. These counts are the only place that capacity trouble surfaces.
   ```bash
   kubectl get workerpools -n kagent
   ```
   Example output:
   ```console
   NAME             DESIRED   REPLICAS   READY   AGE
   kagent-default   8         8          8       3h
   ```
   `DESIRED` is the replica count that you asked for, `REPLICAS` counts the Worker pods that exist, and `READY` counts the pods that are serving. A gap between `DESIRED` and `REPLICAS` means the controller is not creating pods. A gap between `REPLICAS` and `READY` means the pods exist but are not starting. Raising the replica count helps only when all three counts agree.

2. Port-forward the controller, and leave the command running in a second terminal.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

3. Call `GetSubstrateStatus`, which joins the WorkerPools, {{< gloss "ActorTemplate" >}}ActorTemplates{{< /gloss >}}, {{< gloss "Actor" >}}Actors{{< /gloss >}}, and Workers that kagent knows about into one response.
   ```bash
   grpcurl -plaintext -d '{"namespace":"kagent"}' \
     localhost:8083 kagent.api.v1alpha1.SystemService/GetSubstrateStatus
   ```
   Example output, abbreviated to one Worker and one Actor:
   ```json
   {
     "enabled": true,
     "workerPools": [
       {
         "namespace": "kagent",
         "name": "kagent-default",
         "replicas": 8,
         "ateomImage": "ghcr.io/kagent-dev/substrate/ateom-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}"
       }
     ],
     "actors": [
       {
         "actorId": "792f8f90-72a9-49e8-b720-cb3b96fd9a8b",
         "atespace": "ate-golden",
         "status": "Suspended",
         "actorTemplateName": "assistant-kagent-2a786e2db23a",
         "latestSnapshot": "s3://ate-snapshots/kagent/atespaces/ate-golden/actors/2d921676-80ad-48d3-8c2a-4059ef74da33/snapshots/503a07e3-ec49-433c-abdf-b2bb3cb36d5d"
       }
     ],
     "workers": [
       {
         "workerNamespace": "kagent",
         "workerPool": "kagent-default",
         "workerPod": "kagent-default-787547df77-4kvqf",
         "ip": "10.244.0.104"
       }
     ]
   }
   ```

A Worker entry gains an `actorId` only while an Actor occupies it, so the Workers list doubles as a view of which capacity is busy.

## Size a WorkerPool

The replica count is the only capacity dial on a pool, and setting it well depends on knowing what actually consumes a Worker.

A {{< gloss "Worker" >}}Worker{{< /gloss >}} hosts many Actors at the same time, and it holds each one only while a turn is running. kagent suspends an Actor at every turn boundary and frees the Actor's share of its Worker, as described in [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume" >}}). An idle {{< gloss "Session" >}}Session{{< /gloss >}} therefore occupies no Worker capacity at all.

Each Worker reports an Actor capacity when it starts, fixed by the Worker build rather than by a field on the WorkerPool. The gVisor and micro-VM Workers that Agent Substrate ships both report a capacity of 1000 Actors, and no setting raises or lowers it.

Agent Substrate checks this capacity on every placement. It weighs a Worker's spare CPU and memory only when the ActorTemplate states how much CPU and memory one Actor needs. An ActorTemplate that the kagent controller compiles states no per-Actor CPU or memory, so a pool places a Session's Actor on a Worker's available slots alone, regardless of how loaded the Worker's node already is. Worker resource limits still matter, because they govern how Kubernetes packs Workers onto nodes.

Size the pool for the number of turns that run at the same time, not for the number of Agents or Sessions that you have created. A cluster with hundreds of Sessions that are each used occasionally needs far fewer Workers than the session count suggests.

Scale a pool in place with the standard Kubernetes scale command, because the WorkerPool exposes a scale subresource. Use the pool name that you read in [Inspect the runtime](#inspect-the-runtime).

```bash
kubectl scale workerpool kagent-default -n kagent --replicas=8
```

To change these settings in your Helm values instead, run an upgrade of your kagent installation with the following settings:

```yaml
substrateWorkerPool:
  replicas: 8
```

### Recognize an undersized pool

Agent Substrate reports pool capacity through its metrics rather than through an error that reaches the caller. Each Worker publishes a state of `idle`, `partial`, `at_capacity`, or `unschedulable`, which together show how much of a pool is in use. A placement that finds no suitable Worker records a `no_capacity` outcome. Agent Substrate treats this outcome as a normal result rather than a failure, so it carries no error type and raises no alert on its own. Watch the share of Workers at `at_capacity` and the rate of `no_capacity` placements to tell a pool that is merely busy from one that is too small.

None of those signals reach the caller. A turn that cannot get a Worker waits for one, and a turn that waits too long fails with a generic timeout that names neither capacity nor the pool.

```console
ERROR:
  Code: Internal
  Message: actor "ai-01a087c0-1d72-775a-9a32-566acac7b685" request timed out
```

Because short turns release their capacity quickly, a pool under mild pressure absorbs the load and only sheds the requests that wait past the deadline. The result is intermittent timeouts under concurrency rather than a clean failure. Neither the kagent controller log nor the Agent Substrate API log records a capacity message when this happens, so confirm the diagnosis from the `at_capacity` and `no_capacity` signals and from the pool's `READY` count. If the pool is under pressure, raise the replica count.

### Set resource requests on Workers

Generated Worker pods carry no resource requests or limits unless you supply them, and the effect on scheduling is easy to miss.

A Worker with no limits reports its node's entire allocatable capacity as its own. Every Worker on that node reports the same figures, so Agent Substrate cannot use resource capacity to place Actors, and Kubernetes cannot stop you from packing more Workers onto a node than it can carry. Set requests and limits on any pool that carries production traffic.

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

## Configure snapshot storage

Agent Substrate writes every suspended Actor to an object store, so the bucket holds the conversation state that a resume restores. Two places decide where a snapshot lands:

- In the Agent Substrate Helm values, `atelet.storageBackend` selects the storage client and `rustfs.enabled` decides whether the chart supplies credentials for it. These two values cover both the components that write snapshots and the ones that manage them.
- In each {{< gloss "Harness" >}}Harness{{< /gloss >}}, `spec.substrate.snapshotPolicy.location`, names the bucket and prefix that its Actors write under. The field is required, and it must point into a bucket that the selected client can reach.

### The bundled object store

Because `rustfs.enabled` defaults to `true`, the Agent Substrate chart installs an in-cluster object store and points the `atelet` DaemonSet and the `ate-api-server` Deployment at it. The store claims a 1Gi PersistentVolumeClaim, and it accepts an access key and secret key that the chart sets to published defaults.

> [!IMPORTANT]
> The bundled store is not durable. Its credentials are shared defaults that every installation receives. Snapshots hold agent conversation state, so [move a production installation to your own bucket](#move-snapshots-to-an-external-bucket) before it carries real traffic.

### Move snapshots to an external bucket

1. Turn the bundled store off and select the backend in your Agent Substrate Helm values. Setting `atelet.storageBackend` to `s3` selects the S3 client, and setting it to `gcs` selects Google Cloud Storage. Agent Substrate matches only the `s3` value, so every other value, an empty one included, selects Google Cloud Storage.

   ```yaml
   rustfs:
     enabled: false
   atelet:
     storageBackend: s3
   ```

2. Supply the credentials that your backend needs. Setting `rustfs.enabled` to `false` stops the chart from setting the `AWS_*` variables, so neither component receives an endpoint or a key from Helm. Each storage client reads its credentials from the pod's own environment instead.

   - For Google Cloud Storage, the client uses application default credentials. Bind the components' ServiceAccounts through [Workload Identity Federation for GKE](https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity). The chart renders no Helm value for Google credentials, so set nothing further.
   - For Amazon S3, the client reads the standard AWS environment and uses a role that the pod assumes. No static key is needed.
   - For an S3-compatible store, pass two variables and the static credentials through `atelet.extraEnv`. `AWS_ENDPOINT_URL` names the store's API endpoint, which the client otherwise resolves to Amazon S3. `AWS_S3_USE_PATH_STYLE` puts the bucket name in the request path instead of the hostname, which most S3-compatible stores require.

   ```yaml
   atelet:
     extraEnv:
       - name: AWS_ENDPOINT_URL
         value: https://objects.example.com
       - name: AWS_S3_USE_PATH_STYLE
         value: "true"
   ```

   <!-- REVIEW (storage and chart owners): with rustfs.enabled=false the chart renders no AWS_* variables for ate-api-server, and the Deployment has no extraEnv value to supply them, unlike atelet. An S3-compatible store that needs AWS_ENDPOINT_URL therefore has no documented Helm path for the API server half. Confirm the supported configuration before this procedure recommends one. -->

3. Point each Harness at the new bucket.

   ```yaml
   spec:
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         location: s3://ate-snapshots/kagent/
   ```

4. Run a turn on an agent, suspend its Actor, and compare the `latestSnapshot` path [in the response](#inspect-the-runtime) against the `location` that you set. Because the backend and the location are configured separately, a mismatch between them breaks resuming an Actor from its snapshot later.

### How the chart reaches the components

The `atelet` DaemonSet writes a snapshot, and the `ate-api-server` Deployment manages the snapshot. The chart renders `atelet.storageBackend` as the `ATE_STORAGE_BACKEND` variable on the DaemonSet and the Deployment alike, so one Helm value keeps the two in agreement.

Reading these variables off a running pod helps when a snapshot fails to write. Edit the Helm values rather than the pod environment because the next Helm upgrade overwrites a direct edit.

| Variable | Purpose |
| -------- | ------- |
| `ATE_STORAGE_BACKEND` | `s3` selects the S3 client. Any other value, including unset, selects Google Cloud Storage. |
| `AWS_REGION` | Region for the S3 client. |
| `AWS_ENDPOINT_URL` | Endpoint for an S3-compatible store that is not Amazon S3. |
| `AWS_S3_USE_PATH_STYLE` | `true` selects path-style addressing, which most S3-compatible stores need. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Static credentials for the S3 client. |

### Snapshot layout in the bucket

Agent Substrate builds a path per Actor under the Harness prefix, so one bucket serves many Harnesses without collision. The `<actor-uid>` segment is the Actor's `metadata.uid`, not the `actorId` that `GetSubstrateStatus` reports. Both values are UUIDs, so read `latestSnapshot` off the Actor rather than matching a path to an Actor by eye.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/actors/<actor-uid>/snapshots/<snapshot-uid>
```

A {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} takes a second shape. kagent creates an Agent Substrate {{< gloss "Tag" >}}Tag{{< /gloss >}} for each checkpoint, and tagging copies the Actor's snapshot into the Tag's own prefix. A Tag holds exactly one snapshot, so its objects sit directly under `tags/` with no `snapshots/` segment. The `<tag-uid>` segment is the Tag's `metadata.uid`, so nothing in the path records the `checkpoint-<id>` name that kagent gave the Tag.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/tags/<tag-uid>
```

A backup or lifecycle policy must cover both prefixes, because one scoped to `actors/` omits every checkpoint and understates how much the bucket holds.

## Keep pools on the sandbox class they serve

kagent configures the sandbox class for you. A default installation runs the `gvisor` class, and every {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}} that kagent generates inherits the class of the pool that hosts it. Edit this setting only to move a pool to the `microvm` class or to change a pool's Worker build. For what each class isolates, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#sandbox-classes" >}}).

One rule governs the change. A pool's class, its Worker image, and the cluster's SandboxConfig must all name the same sandbox class, and Agent Substrate rejects the Actor rather than falling back when they disagree.

### Set a pool's sandbox class

1. Set the class and the matching Worker build in your kagent Helm values.

   {{< tabs >}}
   {{% tab name="gvisor" %}}
   ```yaml
   substrateWorkerPool:
     sandboxClass: gvisor
     workerImage: "ghcr.io/kagent-dev/substrate/ateom-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}"
   ```
   {{% /tab %}}
   {{% tab name="microvm" %}}
   ```yaml
   substrateWorkerPool:
     sandboxClass: microvm
     workerImage: "ghcr.io/kagent-dev/substrate/ateom-microvm:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}"
   ```
   {{% /tab %}}
   {{< /tabs >}}

   | Field | Description |
   | ----- | ----------- |
   | `sandboxClass` | The sandbox runtime family for this pool's Workers, and for every ActorTemplate that kagent generates for the pool. Omitting the field selects `gvisor`. |
   | `workerImage` | The Worker build that provides the runtime. `ateom-gvisor` serves the `gvisor` class and `ateom-microvm` serves `microvm`. A build that does not match its pool's class never registers a Worker. |

2. Confirm that the cluster has a SandboxConfig for this class. kagent names the configuration directly rather than resolving a default, so a `gvisor` pool needs a config named `gvisor-default` and a `microvm` pool needs a config named `microvm`.

   ```bash
   kubectl get sandboxconfigs
   ```

   Example output:
   ```console
   NAME             CLASS    AGE
   gvisor-default   gvisor   26h
   microvm          microvm  26h
   ```

   A default installation creates only the `gvisor` class, because the Agent Substrate chart applies `sandboxconfig-gvisor.yaml` and kagent installs nothing for `microvm`. The `microvm` configuration and its runtime assets are staged out of band by the Agent Substrate installer, such as through `hack/install-microvm-deps.sh --install`.

3. Verify that the pool's Workers came up on the build that you set. The `ateomImage` field in the [runtime response](#inspect-the-runtime) reports the image that each Worker is running, which the WorkerPool resource calls `workerImage`. Compare the two, and confirm in the ouput that the pool reports its full replica count as ready.

   ```bash
   kubectl get workerpools -n kagent
   ```

### Diagnose a class mismatch

Each of the three settings fails differently when it disagrees with the others.

- A Worker whose pool class does not match an ActorTemplate's class reports `RevisionInvalid` with `unsupported sandbox class "<value>"`, and placement of this Actor fails with `WorkerPoolNotFound`.
- A missing SandboxConfig fails template preparation with `SandboxConfig "<name>" not found`.
- A Worker image built for another class never registers, so the pool reports fewer ready Workers than its replica count.

### Considerations before changing a running pool

Two constraints apply to a pool that already serves traffic.

- **Snapshots do not move between sandbox classes.** An Actor cannot resume from a snapshot that a different class produced, so changing the class of a pool that holds live Actors strands their state.
- **Nodes fetch sandbox runtime assets from a public Google Cloud Storage URL**, named in the SandboxConfig, independently of the storage backend that you configured for snapshots. A cluster with restricted egress needs a path to this URL, or a SandboxConfig that points at a copy you host.

Replacing `workerImage` rolls the Worker pods through the generated Deployment. The pods take a one-hour termination grace period, so an in-flight turn finishes rather than being cut off, and a rollout of a busy pool takes as long as its longest running turn.

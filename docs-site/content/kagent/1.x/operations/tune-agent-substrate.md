---
title: Tune Agent Substrate
description: Learn how to size a WorkerPool, configure snapshot storage, and keep Workers on the sandbox class that kagent requires.
weight: 20
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} runs every agent on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}), and a fresh installation is deliberately small: one {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} holding a single Worker, snapshots in whichever object storage the Agent Substrate installation was given, and the `gvisor` sandbox class.

When preparing for real traffic to your agents, you can size the pool and check where snapshots land. Leave the sandbox class on `gvisor`. A pool set to any other class sits idle while turns time out.

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

A {{< gloss "Worker" >}}Worker{{< /gloss >}} hosts at most one Actor at a time, and it holds that Actor only while a turn is running. kagent suspends an Actor at every turn boundary and frees its Worker, as described in [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume" >}}). An idle {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} therefore occupies no Worker at all.

Size the pool for the number of turns that run at the same time, not for the number of agents or AgentInstances that you have created. A cluster with hundreds of AgentInstances that are each used occasionally needs far fewer Workers than the instance count suggests.

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

A pool with too few Workers does not report a capacity error anywhere. Turns that cannot get a Worker wait for one, and a turn that waits too long fails with a generic timeout that names neither capacity nor the pool.

```console
ERROR:
  Code: Internal
  Message: actor "ai-01a087c0-1d72-775a-9a32-566acac7b685" request timed out
```

Because short turns release their Worker quickly, a pool under mild pressure absorbs the load and only sheds the requests that wait past the deadline. The result is intermittent timeouts under concurrency rather than a clean failure. Neither the kagent controller log nor the Agent Substrate API log records a capacity message when this happens, so diagnose it from the pool's `READY` count and raise the replica count.

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

## Configure snapshot storage

Snapshot storage is configured in two independent places, and a mismatch between them breaks resume rather than install.

The first place is the storage backend on the Agent Substrate components. Both the `atelet` DaemonSet and the `ate-api-server` Deployment read the same environment variables, and both must agree, because one writes snapshots and the other manages them.

The following variables select the backend. `ATE_STORAGE_BACKEND` chooses the client, and the rest configure it. Leaving `ATE_STORAGE_BACKEND` unset selects Google Cloud Storage through application default credentials rather than disabling snapshots.

| Variable | Purpose |
| -------- | ------- |
| `ATE_STORAGE_BACKEND` | `s3` selects the S3 client. Any other value, including unset, selects Google Cloud Storage. |
| `AWS_REGION` | Region for the S3 client. |
| `AWS_ENDPOINT_URL` | Endpoint for an S3-compatible store that is not Amazon S3. |
| `AWS_S3_USE_PATH_STYLE` | `true` selects path-style addressing, which most S3-compatible stores need. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Static credentials for the S3 client. |

The second place is the location on each {{< gloss "Harness" >}}Harness{{< /gloss >}}, which names the bucket and prefix that its Actors' snapshots are written under. The field is required, and it must point into a bucket that the configured backend can reach.

```yaml
spec:
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
```

Agent Substrate builds a path per Actor under that prefix, so one bucket serves many Harnesses without collision. The `<actor-uid>` segment is the Actor's `metadata.uid`, not the `actorId` that `GetSubstrateStatus` reports. Both values are UUIDs, so read `latestSnapshot` off the Actor rather than matching a path to an Actor by eye.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/actors/<actor-uid>/snapshots/<snapshot-uid>
```

A {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} takes a second shape. kagent creates an Agent Substrate {{< gloss "Tag" >}}Tag{{< /gloss >}} for each checkpoint, and tagging copies the Actor's snapshot into the Tag's own prefix. A Tag holds exactly one snapshot, so its objects sit directly under `tags/` with no `snapshots/` segment. The `<tag-uid>` segment is the Tag's `metadata.uid`, so nothing in the path records the `checkpoint-<id>` name that kagent gave the Tag.

```console
s3://ate-snapshots/kagent/atespaces/<atespace>/tags/<tag-uid>
```

A backup or lifecycle policy must cover both prefixes, because one scoped to `actors/` omits every checkpoint and understates how much the bucket holds.

Because the two places are configured independently, confirm the result rather than the intent. The `latestSnapshot` path in the [Inspect the runtime](#inspect-the-runtime) response is the bucket that an Actor last wrote to, so compare it against the `location` that you set.

> [!WARNING]
> A development installation points at an in-cluster object store with well-known credentials, and it is not durable. Snapshots hold agent conversation state, so a production installation needs a real bucket, credentials that are not shared defaults, and a backup policy that matches how much conversation history you are willing to lose.

## Keep pools on the gvisor class

A pool's sandbox class decides which sandbox runtime its Workers provide, and kagent constrains the choice more tightly than Agent Substrate does.

Agent Substrate supports the `gvisor` and `microvm` classes, as explained in [Sandboxing]({{< link path="substrate-runtime/sandboxing" >}}). kagent compiles every ActorTemplate to the `gvisor` class and to a SandboxConfig named exactly `gvisor-default`. Placement never relaxes the class constraint, so Workers in a `microvm` pool accept no kagent Actor, and the pool sits idle while turns time out.

Leave a pool that backs kagent Harnesses on `gvisor`, and keep the pool's image on the matching Worker build.

```yaml
substrateWorkerPool:
  sandboxClass: gvisor
  workerImage: "ghcr.io/kagent-dev/substrate/ateom-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}"
```

> [!NOTE]
> The `ateomImage` field in the [Inspect the runtime](#inspect-the-runtime) response reports this same setting, which the WorkerPool resource calls `workerImage`. To check which build a pool is running, compare the two names.

A cluster-scoped SandboxConfig named `gvisor-default` must also exist, because kagent names it directly rather than resolving a default. A missing one fails template preparation with `SandboxConfig "gvisor-default" not found`.

```bash
kubectl get sandboxconfigs
```
Example output:
```console
NAME             CLASS    AGE
gvisor-default   gvisor   26h
```

Two further constraints apply when you change any of this on a running cluster.

- **Snapshots do not move between sandbox classes.** An Actor cannot resume from a snapshot that a different class produced, so changing the class of a pool that holds live Actors strands their state.
- **Nodes fetch sandbox runtime assets from a public Google Cloud Storage URL**, named in the SandboxConfig, independently of the storage backend that you configured for snapshots. A cluster with restricted egress needs a path to that URL, or a SandboxConfig that points at a copy you host.

Replacing `workerImage` rolls the Worker pods through the generated Deployment. The pods take a one-hour termination grace period, so an in-flight turn finishes rather than being cut off, and a rollout of a busy pool takes as long as its longest running turn.

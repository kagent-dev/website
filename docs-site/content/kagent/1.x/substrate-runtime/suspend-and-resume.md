---
title: Suspend and resume
description: Learn how Agent Substrate suspends idle Actors to snapshots and resumes them on demand.
weight: 20
author: kagent.dev
---

An agent spends most of its life waiting. It waits on a person to reply, and it waits on a large language model (LLM) to answer. [Agent Substrate]({{< link path="about/agent-substrate" >}}) runs each agent inside an **Actor**, the unit that it suspends and resumes, and it treats that idle time as reclaimable: it suspends an idle Actor into a {{< gloss "Snapshot" >}}snapshot{{< /gloss >}}, frees the {{< gloss "Worker" >}}Worker{{< /gloss >}} that the Actor was running on, and restores the Actor when traffic arrives for it. This page explains what a snapshot captures, when kagent suspends an Actor, and what happens when a suspended Actor is addressed again.

## Actor lifecycle operations

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} provides three lifecycle operations, and each one moves an Actor between states that you can observe on the Actor record.

- **Suspend**: Writes the Actor's state to a durable snapshot in snapshot storage, then frees its Worker. A running Actor is snapshotted on its Worker. A paused Actor's node-local snapshot is uploaded instead.
- **Pause**: Takes a short-term snapshot whose files stay on the node. Pausing pins the Actor to that node, because the following resume is prioritized onto the node that holds the snapshot files.
- **Resume**: Restores a suspended or paused Actor onto a Worker, from its latest snapshot. The common path restores from a snapshot rather than cold-booting the workload.

The following diagram traces an Actor through those operations, and shows the further path that opens once a snapshot is [pinned by a tag](#checkpoints).
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

An Actor reports its position in that cycle through its state, which is one of `RESUMING`, `RUNNING`, `SUSPENDING`, `SUSPENDED`, `PAUSING`, `PAUSED`, `CRASHED`, or `DELETING`. Only a suspended Actor can be deleted.

> [!NOTE]
> Resume restores an Actor onto whichever Worker in the pool is free, which is not necessarily the Worker that the Actor ran on before. Suspend and resume let a {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} carry far more Actors than it has Workers at any one moment.

## What a snapshot captures

An {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}}'s snapshot configuration decides how much of an Actor a given snapshot holds. Two scopes exist.

- **`Full`**: Captures process memory, the root filesystem changes layered on top of the container image, and any attached durable volumes. A `Full` snapshot holds everything that is needed to resume the Actor hot, with its in-memory state intact.
- **`Data`**: Captures only the contents of attached durable volumes. Process memory and the rest of the root filesystem are discarded, which makes the snapshot much cheaper to write and store.

Scopes describe only what a snapshot captures, and they are configured per trigger. The `onPause` setting selects what a pause captures on the node, and `onCommit` selects what a suspend uploads to snapshot storage. What `onCommit` captures must be a subset of what `onPause` captures.

A **DurableDir volume** is the per-Actor application data surface. Its contents are preserved by the `Data` scope, so they survive a suspend and resume cycle independently of process memory. How many volumes an ActorTemplate can declare depends on its sandbox class. A `microvm` template can declare several, because they are subdirectories of a single shared filesystem. A `gvisor` template is limited to one, until {{< gloss "gVisor" >}}gVisor{{< /gloss >}} accepts more than a single durable mount.

When an Actor resumes from a `Data`-scope snapshot, the ActorTemplate's `onResume.fromData` setting decides where the rest of the guest state comes from. The default is `ColdBoot`, which starts the containers fresh from the container image with the durable volume contents restored over them.

> [!NOTE]
> These scopes describe what Agent Substrate supports, not choices that you make. kagent compiles every ActorTemplate with the same snapshot configuration: `Full` on pause, `Data` on commit, `ColdBoot` on resume, and a single DurableDir volume named `data`. The only snapshot setting that you author is the storage location, on the Harness.

## Golden and per-Actor snapshots

Two kinds of snapshot serve different purposes, and both appear in a normal installation.

- **Golden snapshot**: Captured once, when an ActorTemplate is created, from a temporary golden boot of the workload. Every Actor of that template is first restored from this one shared snapshot, so a new Actor starts from an already-booted image rather than a cold start. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} is not ready until its golden snapshot exists. Until then, the kagent controller reports `waiting for the ActorTemplate golden snapshot` while Agent Substrate captures it.
- **Last snapshot**: The most recent per-Actor snapshot, written on every suspend and used to restore that specific Actor on its next resume. Because it carries the Actor's own accumulated state, the conversation continues from where it stopped.

Snapshots are persisted to object storage, either Google Cloud Storage or Amazon Simple Storage Service (S3), so that Actor state is durable and portable across the cluster. A {{< gloss "Harness" >}}Harness{{< /gloss >}} names the location for its Actors' snapshots in its `substrate.snapshotPolicy` section.

```yaml
spec:
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      # The object storage location your cluster's Substrate installation uses
      location: gs://<your-bucket>/kagent/
```

## Suspension between turns

kagent does not wait for an Actor to go idle for a long stretch before suspending it. It suspends the Actor at every turn boundary, as soon as the conversation reaches a point where nothing is running.

A turn reaches such a boundary when its task enters a terminal state, or when the task stops to wait on a person, which is the `INPUT_REQUIRED` and `AUTH_REQUIRED` case. At that point kagent suspends the Actor durably and records the exact snapshot that the suspend produced.

The {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}}'s own state does not change while this happens. It stays `READY` throughout, because suspension is a property of the runtime underneath it rather than of the conversation. A caller that lists AgentInstances sees a ready agent whether or not an Actor is currently running for it.

> [!NOTE]
> Creating an AgentInstance does not start an Actor running. The Actor is created as suspended, and the first message addressed to the AgentInstance resumes it.

## Resuming on demand

Every Actor is reachable at a uniform address built from its {{< gloss "Atespace" >}}atespace{{< /gloss >}} and name, `<actor-name>.<atespace>.actors.resources.substrate.ate.dev`, resolved by Agent Substrate's own Domain Name System (DNS) server. Traffic sent to that name is routed to the right Worker, and an Actor that is currently suspended is resumed automatically to receive it. Nothing in the calling path needs to know whether the Actor was running beforehand.

Resume speed makes suspending at every turn boundary practical rather than costly. Agent Substrate's own target for this cycle is 100 milliseconds at the ninety-fifth percentile, measured from the moment traffic arrives for a suspended Actor to the moment that Actor can receive it.

## Checkpoints

A snapshot that Agent Substrate writes on suspend is transient. Agent Substrate is free to collect it once a newer snapshot supersedes it. A **checkpoint** makes one of those snapshots durable by pinning it.

Creating a checkpoint attaches an Agent Substrate {{< gloss "Tag" >}}Tag{{< /gloss >}} to the snapshot that the AgentInstance most recently suspended to. The tag names that one snapshot permanently and acts as a retention pin, such that Agent Substrate does not collect a snapshot while a tag still names it. Deleting the checkpoint removes the tag and releases the pin.

An AgentInstance must be a turn boundary to be checkpointed, because the turn boundary is captured. An AgentInstance with a turn still in progress has no quiescent boundary to capture, and the request fails until the turn finishes.

A checkpoint also records how far the conversation had advanced, and it lets you start a second AgentInstance from the state it pinned. That second AgentInstance, a {{< gloss "Fork" >}}fork{{< /gloss >}}, continues the conversation from the point that the checkpoint pinned, and new turns append only to the fork. To create a checkpoint and fork an AgentInstance from it, work through the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

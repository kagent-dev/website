---
title: Suspend and resume
description: Learn how Agent Substrate suspends idle Actors to snapshots and resumes them on demand.
weight: 20
author: kagent.dev
aliases:
  - /kagent/1.x/substrate-runtime/suspend-and-resume/
---

An agent spends most of its life waiting. It waits on a person to reply, and it waits on a large language model (LLM) to answer. [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}) runs each agent inside an **Actor**, the unit that Agent Substrate suspends and resumes. To free compute resources while an agent waits, Agent Substrate writes the idle Actor to a {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} and releases the capacity that the Actor held on its {{< gloss "Worker" >}}Worker{{< /gloss >}}. The next message to the agent restores the Actor. The {{< gloss "Session" >}}Session{{< /gloss >}} stays ready the whole time, so reclaiming this capacity costs the user nothing. This page explains what a snapshot captures, when kagent suspends an Actor, and what happens when a suspended Actor is addressed again.

## Actor lifecycle operations

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} provides three lifecycle operations, and each one moves an Actor between states that you can observe on the Actor record.

- **Suspend**: Writes the Actor's state to a durable snapshot in snapshot storage, then releases the capacity that it held on its Worker. A running Actor is snapshotted on its Worker. A paused Actor's node-local snapshot is uploaded instead.
- **Pause**: Takes a short-term snapshot whose files stay on the node. Pausing pins the Actor to that node, because the following resume is prioritized onto the node that holds the snapshot files.
- **Resume**: Restores a suspended or paused Actor onto a Worker, from its latest snapshot. The common path restores from a snapshot rather than cold-booting the workload.

The following diagram traces an Actor through those operations, and shows what happens once a snapshot is [pinned by a tag](#checkpoints).
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

An Actor reports its position in this cycle through its state, which is one of `RESUMING`, `RUNNING`, `SUSPENDING`, `SUSPENDED`, `PAUSING`, `PAUSED`, `CRASHED`, or `DELETING`. Only a suspended Actor can be deleted.

> [!NOTE]
> Resume restores an Actor onto whichever Worker in the pool has room, which is not necessarily the Worker that the Actor ran on before. Because a suspended Actor occupies no Worker, a {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} can serve far more Sessions than it could if every Actor stayed resident.

## What a snapshot captures

An {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}}'s snapshot configuration decides how much of an Actor a given snapshot holds. Two scopes exist.

- **`Full`**: Captures process memory, the root filesystem changes layered on top of the container image, and any attached durable volumes. A `Full` snapshot holds everything that is needed to resume the Actor hot, with its in-memory state intact.
- **`Data`**: Captures only the contents of attached durable volumes. Process memory and the rest of the root filesystem are discarded, which makes the snapshot much cheaper to write and store.

kagent sets the scope automatically on every ActorTemplate that it generates, and it sets `Full` so that process memory survives both a pause and a suspend. Each Actor also gets a single durable volume named `data`. The one snapshot setting that you author is the storage location, which you set on the {{< gloss "Harness" >}}Harness{{< /gloss >}}.

One scope governs both operations. The ActorTemplate's `onCommit` setting selects what a suspend uploads to snapshot storage, and a pause captures this same scope on the node.

### Durable volumes and resume

A **DurableDir volume** is the per-Actor application data surface. Its contents are preserved by the `Data` scope, so they survive a suspend and resume cycle independently of process memory. How many volumes an ActorTemplate can declare depends on its sandbox class. A `microvm` template can declare several, because they are subdirectories of a single shared filesystem. A `gvisor` template is limited to one, until {{< gloss "gVisor" >}}gVisor{{< /gloss >}} accepts more than a single durable mount.

## Golden and per-Actor snapshots

Two kinds of snapshot serve different purposes, and both appear in a normal installation.

- The **golden snapshot** is shared by every Actor of one ActorTemplate. Agent Substrate captures it once by booting the workload temporarily when the template is created. Every new Actor of this template starts from this snapshot rather than from a cold start. kagent waits for the golden snapshot before an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} becomes ready, and the controller reports `waiting for the ActorTemplate golden snapshot` while the capture runs.
- The **last snapshot** belongs to one Actor. Agent Substrate writes it on every suspend and restores this same Actor from it on the next resume. It keeps the files and memory that this one Session built up, so the Session continues from where it stopped.

Agent Substrate writes every snapshot to object storage, so Actor state is durable and portable across the cluster. The supported backends are Google Cloud Storage and Amazon Simple Storage Service (S3), and the S3 client also reaches S3-compatible stores that accept a custom endpoint and path-style addressing. For the settings that select and configure each client, see [Configure snapshot storage]({{< link path="operations/tune-agent-substrate#configure-snapshot-storage" >}}). A {{< gloss "Harness" >}}Harness{{< /gloss >}} names the location for its Actors' snapshots in its `substrate.snapshotPolicy` section.

```yaml
spec:
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      # The bucket that the Agent Substrate chart creates in its bundled object store.
      # If your Substrate installation uses your own object storage, use that location instead.
      location: s3://ate-snapshots/kagent/
```

## Suspension between turns

kagent does not wait for an Actor to go idle for a long stretch before suspending it. It suspends the Actor at every turn boundary, as soon as nothing in the Session is running.

A turn reaches such a boundary when its task enters a terminal state, or when the task stops to wait on a person, which is the `INPUT_REQUIRED` and `AUTH_REQUIRED` case. At that point kagent suspends the Actor durably and records the exact snapshot that the suspend produced.

The {{< gloss "Session" >}}Session{{< /gloss >}}'s own state does not change while this happens. It stays `READY` throughout, because suspension is a property of the runtime underneath the Session rather than of the Session itself. A caller that lists Sessions sees a ready Session whether or not an Actor is running for it.

> [!NOTE]
> Creating a Session does not start an Actor running. The Actor is created as suspended, and the first message addressed to the Session resumes it.

## Resuming on demand

A suspended Session resumes when the next message arrives for it. The kagent controller hands that message to Agent Substrate, which restores the Actor from its last snapshot onto a Worker with room, and then delivers the message. No caller needs to know whether the Actor was running beforehand, and nothing in kagent asks for the resume explicitly.

Agent Substrate resolves the Actor's address on every request, so the Actor stays reachable at one name no matter which Worker it is placed on. For more information, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#how-traffic-reaches-a-sandboxed-actor" >}}).

Because kagent suspends at every turn boundary, every message to a Session pays for one resume. An idle Session does not consume compute, and the next message waits for its Actor to come back.

<!-- REVIEW (performance reviewer): an earlier draft stated a 100 ms activation target at the ninety-fifth percentile. Its source is the "North Star Metrics" section of the Agent Substrate architecture document, which frames it as a goal the project is aiming at rather than measured behaviour, and lists a target of one billion agents per cluster beside it. Published here it would read as a performance characteristic a customer can expect. Removed pending a decision on whether any activation figure is publishable, and on what it would be measured against for kagent specifically. The same removal is on about/architecture/agent-substrate.md. -->

## Checkpoints

A **checkpoint** marks one point in a conversation and keeps it. You can create a checkpoint when a Session reaches a state worth returning to, such as a long investigation that is only partway through. Starting a second Session from that point is known as a {{< gloss "Fork" >}}fork{{< /gloss >}}. The fork replays the conversation through the pinned turn and then continues on its own, with its own conversation ID and its own task IDs. A fork needs the pinned snapshot to keep durable data without process memory. Agent Substrate writes that kind of snapshot on every suspend, so any checkpoint that reaches `CHECKPOINT_STATE_READY` can be forked. To create a checkpoint and fork it, follow the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

Create a checkpoint only after a turn finishes. The request names the task that the turn ended on, and it fails when a newer turn has already started or while that turn's snapshot is still being written.

Underneath, a checkpoint pins a snapshot that would otherwise be discarded. Agent Substrate treats the snapshot written on each suspend as transient and collects it once a newer one supersedes it. Creating a checkpoint attaches a {{< gloss "Tag" >}}Tag{{< /gloss >}} to the snapshot that the Session most recently suspended to, and Agent Substrate keeps any snapshot that a tag still names. Deleting the checkpoint removes the tag and releases the snapshot.

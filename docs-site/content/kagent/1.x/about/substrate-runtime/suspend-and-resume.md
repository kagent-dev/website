---
title: Suspend and resume
description: Learn how Agent Substrate suspends idle Actors to snapshots and resumes them on demand.
weight: 20
author: kagent.dev
aliases:
  - /kagent/1.x/substrate-runtime/suspend-and-resume/
---

An agent spends most of its life waiting. It waits on a person to reply, and it waits on a large language model (LLM) to answer. [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}) runs each agent inside an **Actor**, the unit that it suspends and resumes. Rather than hold compute open through that waiting, Agent Substrate writes the idle Actor to a {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} and releases the capacity that the Actor held on its {{< gloss "Worker" >}}Worker{{< /gloss >}}. The next message restores it. The {{< gloss "Session" >}}Session{{< /gloss >}} stays ready the whole time, so reclaiming that capacity costs the user nothing. This page explains what a snapshot captures, when kagent suspends an Actor, and what happens when a suspended Actor is addressed again.

## Actor lifecycle operations

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} provides three lifecycle operations, and each one moves an Actor between states that you can observe on the Actor record.

- **Suspend**: Writes the Actor's state to a durable snapshot in snapshot storage, then releases the capacity that it held on its Worker. A running Actor is snapshotted on its Worker. A paused Actor's node-local snapshot is uploaded instead.
- **Pause**: Takes a short-term snapshot whose files stay on the node. Pausing pins the Actor to that node, because the following resume is prioritized onto the node that holds the snapshot files.
- **Resume**: Restores a suspended or paused Actor onto a Worker, from its latest snapshot. The common path restores from a snapshot rather than cold-booting the workload.

The following diagram traces an Actor through those operations, and shows the further path that opens once a snapshot is [pinned by a tag](#checkpoints).
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

An Actor reports its position in that cycle through its state, which is one of `RESUMING`, `RUNNING`, `SUSPENDING`, `SUSPENDED`, `PAUSING`, `PAUSED`, `CRASHED`, or `DELETING`. Only a suspended Actor can be deleted.

> [!NOTE]
> Resume restores an Actor onto whichever Worker in the pool has room, which is not necessarily the Worker that the Actor ran on before. Because a suspended Actor occupies no Worker, a {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} can serve far more Sessions than it could if every Actor stayed resident.

## What a snapshot captures

An {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}}'s snapshot configuration decides how much of an Actor a given snapshot holds. Two scopes exist.

- **`Full`**: Captures process memory, the root filesystem changes layered on top of the container image, and any attached durable volumes. A `Full` snapshot holds everything that is needed to resume the Actor hot, with its in-memory state intact.
- **`Data`**: Captures only the contents of attached durable volumes. Process memory and the rest of the root filesystem are discarded, which makes the snapshot much cheaper to write and store.

kagent sets these scopes automatically on every ActorTemplate that it generates. A pause captures `Full`, a commit captures `Data`, a resume cold-boots, and each Actor gets a single durable volume named `data`. The one snapshot setting that you author is the storage location, which you set on the {{< gloss "Harness" >}}Harness{{< /gloss >}}.

A scope is set per trigger. The `onPause` setting selects what a pause captures on the node, and `onCommit` selects what a suspend uploads to snapshot storage. What `onCommit` captures must be a subset of what `onPause` captures.

### Durable volumes and resume

A **DurableDir volume** is the per-Actor application data surface. Its contents are preserved by the `Data` scope, so they survive a suspend and resume cycle independently of process memory. How many volumes an ActorTemplate can declare depends on its sandbox class. A `microvm` template can declare several, because they are subdirectories of a single shared filesystem. A `gvisor` template is limited to one, until {{< gloss "gVisor" >}}gVisor{{< /gloss >}} accepts more than a single durable mount.

When an Actor resumes from a `Data`-scope snapshot, the ActorTemplate's `onResume.fromData` setting decides where the rest of the guest state comes from. The default is `ColdBoot`, which starts the containers fresh from the container image with the durable volume contents restored over them.

## Golden and per-Actor snapshots

Two kinds of snapshot serve different purposes, and both appear in a normal installation.

- The **golden snapshot** is shared by every Actor of one ActorTemplate. Agent Substrate captures it once by booting the workload temporarily when the template is created. Every new Actor of that template starts from this snapshot rather than from a cold start. kagent waits for the golden snapshot before an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} becomes ready, and the controller reports `waiting for the ActorTemplate golden snapshot` while the capture runs.
- The **last snapshot** belongs to one Actor. Agent Substrate writes it on every suspend and restores that same Actor from it on the next resume. It holds the files and memory that this one conversation built up, which is how the conversation continues from where it stopped.

Snapshots are persisted to object storage so that Actor state is durable and portable across the cluster. Agent Substrate writes snapshots to Google Cloud Storage or to Amazon Simple Storage Service (S3). The S3 client also reaches S3-compatible stores that accept a custom endpoint and path-style addressing. For the settings that select and configure each client, see [Configure snapshot storage]({{< link path="operations/tune-agent-substrate#configure-snapshot-storage" >}}). A {{< gloss "Harness" >}}Harness{{< /gloss >}} names the location for its Actors' snapshots in its `substrate.snapshotPolicy` section.

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

kagent does not wait for an Actor to go idle for a long stretch before suspending it. It suspends the Actor at every turn boundary, as soon as the conversation reaches a point where nothing is running.

A turn reaches such a boundary when its task enters a terminal state, or when the task stops to wait on a person, which is the `INPUT_REQUIRED` and `AUTH_REQUIRED` case. At that point kagent suspends the Actor durably and records the exact snapshot that the suspend produced.

The {{< gloss "Session" >}}Session{{< /gloss >}}'s own state does not change while this happens. It stays `READY` throughout, because suspension is a property of the runtime underneath it rather than of the conversation. A caller that lists Sessions sees a ready conversation whether or not an Actor is currently running for it.

> [!NOTE]
> Creating a Session does not start an Actor running. The Actor is created as suspended, and the first message addressed to the Session resumes it.

## Resuming on demand

A suspended Session resumes when the next message arrives for it. The kagent controller hands that message to Agent Substrate, which restores the Actor from its last snapshot onto a Worker with room, and then delivers the message. No caller needs to know whether the Actor was running beforehand, and nothing in kagent asks for the resume explicitly.

Agent Substrate resolves the Actor's address on every request, so the Actor stays reachable at one name no matter which Worker it is placed on. For more information, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#how-traffic-reaches-a-sandboxed-actor" >}}).

Because kagent suspends at every turn boundary, every message to a Session pays for one resume. An idle Session costs no compute, and the next message waits for its Actor to come back.

<!-- REVIEW (performance reviewer): an earlier draft stated a 100 ms activation target at the ninety-fifth percentile. Its source is the "North Star Metrics" section of the Agent Substrate architecture document, which frames it as a goal the project is aiming at rather than measured behaviour, and lists a target of one billion agents per cluster beside it. Published here it would read as a performance characteristic a customer can expect. Removed pending a decision on whether any activation figure is publishable, and on what it would be measured against for kagent specifically. The same removal is on about/architecture/agent-substrate.md. -->

## Checkpoints

A **checkpoint** marks one point in a conversation and keeps it. You can create a checkpoint when a Session reaches a state worth returning to, such as a long investigation that is only partway through. You can then start a second Session from that point, which is known as a {{< gloss "Fork" >}}fork{{< /gloss >}}. The fork continues the conversation from where the checkpoint marked it, new turns append only to the fork, and the fork gets its own conversation and task identifiers rather than inheriting the source's. To create a checkpoint and fork a Session from it, follow the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

Checkpoint a Session only at a turn boundary, because the turn boundary is what gets captured. The request names the terminal task to pin, and it fails when a newer turn has already started or while that turn's snapshot is still being written.

Underneath, a checkpoint pins a snapshot that would otherwise be discarded. Agent Substrate treats the snapshot written on each suspend as transient and collects it once a newer one supersedes it. Creating a checkpoint attaches a {{< gloss "Tag" >}}Tag{{< /gloss >}} to the snapshot that the Session most recently suspended to, and Agent Substrate keeps any snapshot that a tag still names. Deleting the checkpoint removes the tag and releases the snapshot.

---
title: Agent Substrate architecture
description: See how Agent Substrate runs, suspends, and resumes the Actors behind every Session.
weight: 40
author: kagent.dev
aliases:
  - /kagent/1.x/about/agent-substrate/
---

{{< reuse "kagent-docs/snippets/about/agent-substrate-intro.md" >}}

## ActorTemplate

An **ActorTemplate** is the definition that Substrate creates an Actor from. It carries what Substrate needs in order to start that Actor: the agent's container image, the command that starts the agent, the agent's environment, the sandbox class to isolate it with, and the WorkerPool to schedule it onto. The kagent controller produces an ActorTemplate by compiling an {{< gloss "Agent" >}}Agent{{< /gloss >}} and the resources that it names, so an ActorTemplate is where kagent's configuration model becomes executable by Substrate.

Substrate rejects any change to an ActorTemplate's spec after it is created. This immutability ensures that a running conversation remains on a fixed definition. The controller creates a new ActorTemplate for every compiled {{< gloss "Revision" >}}revision{{< /gloss >}} instead of editing an existing one, and it reclaims an old ActorTemplate once nothing references its revision. An Agent holds a reference for as long as the revision is its desired or its latest successful one, and a Session holds one for as long as it runs on that revision.

## Workers and WorkerPools

An Actor needs somewhere to run. Each Actor runs on a **Worker**, a pre-started pod that waits to receive one. Instead of starting a new pod each time a Session needs an Actor, Substrate schedules that Actor onto a Worker that is already running. The sandbox boundary sits around the Actor, not around the Worker pod that hosts it.

<!-- REVIEW (runtime reviewer): a Worker hosts at most one Actor at a time today. Confirm whether multiple Actors per Worker ships in the target release before this paragraph describes that model. Confirm the autoscaling mechanism and the metrics that it requires; an HPA with a metrics adapter keyed on assigned-worker count is one proposal, and whether queue-depth scaling is supported is unconfirmed. A diagram of pods, Workers, pools, and Actor placement, with the sandbox boundaries marked, is wanted here once the model is settled. -->

Workers come from a **WorkerPool**, a Kubernetes custom resource that an operator provisions before any Agent can compile. A WorkerPool declares how many Workers to keep running and which sandbox technology those Workers use.

An operator never creates a Worker directly. Substrate manages them, keeping enough ready in each WorkerPool so that an Actor can start or resume on one immediately, without waiting on the Kubernetes scheduler to place a new Pod.

## Atespaces

An **atespace** is the isolation boundary that an Actor belongs to, and the first half of its identity. Agent Substrate addresses an Actor by its atespace and its name together, so the same Actor name can exist in two atespaces without colliding. Although an atespace resembles a Kubernetes namespace, it is not one. Agent Substrate defines it as its own cluster-wide resource, so no namespace contains it, a namespace's RBAC does not reach it, and deleting a Kubernetes namespace does not delete the atespace that kagent named after it. Actors and Workers sit differently against that boundary: an Actor belongs to exactly one atespace for its entire life, and a Worker belongs to none, because a Worker hosts whichever Actor Substrate places on it.

kagent names each atespace after the Kubernetes namespace of the Agent whose Actor it holds, and creates that atespace on demand the first time a Session in the namespace needs an Actor. The Actor's own name is `session-` followed by the Session's identifier. A Session on an Agent in the `kagent` namespace therefore runs on an Actor that Agent Substrate addresses within the `kagent` atespace. Both halves of that identity appear in the address that traffic uses to reach the Actor, which [Sandboxing]({{< link path="substrate-runtime/sandboxing#how-traffic-reaches-a-sandboxed-actor" >}}) covers.

## Sandboxing

Because an Actor often runs a model-directed agent that calls tools and executes commands, Substrate runs each Actor in an isolated sandbox rather than a plain container. A WorkerPool's `sandboxClass` field selects the sandbox technology for its Workers: [gVisor](https://gvisor.dev), or a micro-VM that runs the workload under [Cloud Hypervisor](https://www.cloudhypervisor.org) with a [Kata Containers](https://katacontainers.io) kernel and root image. Both technologies isolate an Actor from its Worker's host kernel, and both support suspend and resume operations.

kagent compiles every ActorTemplate to the `gvisor` class, so a kagent agent runs in a {{< gloss "gVisor" >}}gVisor{{< /gloss >}} sandbox today and the micro-VM class is a Substrate capability that kagent does not yet select. Keep a WorkerPool that backs kagent Harnesses on `gvisor`. For what each class isolates, see [Sandboxing]({{< link path="substrate-runtime/sandboxing" >}}).

## Suspend, snapshot, and resume

Substrate's density model rests on one fact about agent workloads: an Actor spends most of its time idle, waiting on a person or a large language model (LLM) to respond, not actively computing. Substrate exploits that by suspending idle Actors and reclaiming their Worker, then resuming them on demand when traffic arrives. Suspending and resuming allows a WorkerPool to run far more Actors than it has Workers for at any given moment.

The following diagram traces an Actor through one suspend-and-resume cycle, and shows the second path that opens up once the resulting snapshot is tagged.
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

A **WorkerPool** keeps **Workers** running and ready, and one Worker hosts the **Actor** while its conversation is active. Suspending that Actor writes its full state to an immutable **ActorSnapshot** and frees the Worker that it was running on.

The diagram forks at that snapshot, because a snapshot serves two purposes.

- **Resume** restores the same Actor onto **any free Worker in the pool**, which is not necessarily the Worker that it ran on before. Because the snapshot captures the Actor's full state, the conversation continues from where it left off. Every idle agent takes this path.
- A **{{< gloss "Tag" >}}Tag{{< /gloss >}}** pins that snapshot, and a **New Actor** can be seeded from the tag at the moment that it is created. Resuming an existing Actor never goes through a tag.

A tag gives a snapshot a stable, human-meaningful name, so callers do not need to track Substrate's internal snapshot identity. A tag names one snapshot permanently, and only its visibility scope can change afterward. A tag also acts as a retention pin, so Substrate does not delete a snapshot while a tag still names it.

For example, an agent partway through a long incident investigation reaches a state worth keeping. Creating a [checkpoint]({{< link path="substrate-runtime/suspend-and-resume#checkpoints" >}}) tags the snapshot that the agent most recently suspended to, which holds that one snapshot in place while the agent carries on and writes newer ones. Without the tag, Substrate collects that snapshot once a newer one supersedes it.

<!-- REVIEW (performance reviewer): an earlier draft stated a 100 ms target at the ninety-fifth percentile, measured from traffic arrival to the moment the Actor can receive it. Removed pending confirmation of the approved measurement and whether it applies to kagent. Do not restore it as a latency guarantee. -->

<!-- REVIEW (runtime/storage reviewers): expand this section with pause versus suspend, golden snapshots, where snapshots are stored, and what resume restores, and extend the snapshot-cycle diagram to show those distinctions. Do not equate a filesystem snapshot with full execution-state restoration without confirmation. -->

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

An **ActorTemplate** is the definition that Substrate creates an Actor from. It carries what Substrate needs in order to start this Actor: the agent's container image, the command that starts the agent, the agent's environment, the sandbox class to isolate it with, and the WorkerPool to schedule it onto. The kagent controller produces an ActorTemplate by compiling an {{< gloss "Agent" >}}Agent{{< /gloss >}} and the resources that it names, so an ActorTemplate is where kagent's configuration model becomes executable by Substrate.

Substrate rejects any change to an ActorTemplate's spec after it is created. This immutability ensures that a running conversation remains on a fixed definition. The controller creates a new ActorTemplate for every compiled {{< gloss "Revision" >}}revision{{< /gloss >}} instead of editing an existing one, and it reclaims an old ActorTemplate once nothing references its revision. An Agent holds a reference for as long as the revision is its desired or its latest successful one, and a Session holds one for as long as it runs on that revision.

## Workers and WorkerPools

An Actor needs somewhere to run. Each Actor runs on a **Worker**, a pre-started pod that Substrate places Actors onto. Instead of starting a new pod each time a Session needs an Actor, Substrate schedules this Actor onto a Worker that is already running. The sandbox boundary sits around the Actor, not around the Worker pod that hosts it.

### WorkerPools

Workers come from a **WorkerPool**, a Kubernetes custom resource that an operator provisions before any Agent can compile. A WorkerPool declares how many Workers to keep running and which sandbox technology those Workers use.

An operator never creates a Worker directly. Substrate manages them, keeping enough ready in each WorkerPool so that an Actor can start or resume on one immediately, without waiting on the Kubernetes scheduler to place a new Pod.

A WorkerPool exposes a Kubernetes scale subresource. A HorizontalPodAutoscaler can use it to size a pool from a metric instead of a fixed replica count. Agent Substrate publishes how many Workers in each pool have no free Actor slot. An autoscaler that watches this number adds Workers before the pool fills, rather than after placements start to fail.

<!-- REVIEW (runtime reviewer): queue-depth scaling is still unconfirmed and is deliberately not described here. Confirm whether it is supported before adding it. -->
<!-- REVIEW (runtime reviewer): the external metric that drives the autoscaler is named per deployment, so this paragraph describes the signal rather than naming the series. Confirm the supported name before documenting a worked HPA example. -->

### Worker capacity

One Worker hosts many Actors at the same time. When each Worker starts, it reports a maximum capacity of Actors that it can host. A Worker that reaches this capacity refuses any further Actors, and Substrate puts those Actors on another Worker in the pool. The Worker's Actor capacity is a property of the Worker build, not a setting on the pool. The gVisor and micro-VM Workers that Agent Substrate ships both report a capacity of 1000 Actors.

### Actor placement

Substrate checks two things before it places an Actor on a Worker:
* Whether the Worker has a free Actor slot. This check always runs.
* Whether the Worker has enough spare CPU and memory. This check runs only when the ActorTemplate declares what one Actor needs, and kagent declares nothing for a Session. The free Actor slot check is therefore the only one that decides where a Session's Actor lands. [Worker resource limits]({{< link path="operations/tune-agent-substrate#set-resource-requests-on-workers" >}}) still matter, because a Worker with no limits reports its whole node as its own capacity.

<!-- REVIEW (runtime reviewer): on a default installation neither side declares resources, so a Worker keeps accepting Actors up to its build capacity no matter how loaded its node is, and node pressure surfaces as eviction rather than as a placement failure. Confirm that this is intended for GA before this section describes it as the expected operating mode. -->

To determine where an Actor is placed, Substrate first narrows the Worker pool to the Workers that can take the Actor. It then picks two of those Workers at random and places the Actor on the less loaded of the two. Substrate determines a Worker's load by picking either the share of its Actor slots that are filled or the share of its CPU and memory that is committed, depending on which is higher. Sampling two Workers rather than ranking the whole pool keeps the decision cheap, and it avoids the pile-up that follows when every placement aims at whichever Worker looks emptiest at that moment.

<!-- REVIEW (runtime reviewer): a diagram of pods, Workers, pools, and Actor placement, with the sandbox boundaries marked, is wanted in this section. -->

## Atespaces

An **atespace** is the isolation boundary that an Actor belongs to, and the first half of its identity. Agent Substrate addresses an Actor by its atespace and its name together, so the same Actor name can exist in two atespaces without colliding.

An atespace resembles a Kubernetes namespace, but it is not one. Agent Substrate defines it as its own cluster-wide resource. No namespace contains it, a namespace's RBAC does not reach it, and deleting a Kubernetes namespace does not delete the atespace that kagent named after it.

Actors and Workers sit differently against this boundary. An Actor belongs to exactly one atespace for its entire life, whereas a Worker belongs to none. A Worker hosts whichever Actors Substrate places on it, and those Actors can come from different atespaces.

kagent names each atespace after the Kubernetes namespace of the Agent whose Actor it holds, and creates that atespace on demand the first time a Session in the namespace needs an Actor. The Actor's own name is `session-` followed by the Session's identifier. A Session on an Agent in the `kagent` namespace therefore runs on an Actor that Agent Substrate addresses within the `kagent` atespace. Both halves of this identity appear in the address that traffic uses to reach the Actor, which [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#how-traffic-reaches-a-sandboxed-actor" >}}) covers.

## Sandboxing

Because an Actor often runs a model-directed agent that calls tools and executes commands, Substrate runs each Actor in an isolated sandbox rather than a plain container. A WorkerPool's `sandboxClass` field selects the sandbox technology for its Workers: [gVisor](https://gvisor.dev), or a micro-VM that runs the workload under [Cloud Hypervisor](https://www.cloudhypervisor.org) with a [Kata Containers](https://katacontainers.io) kernel and root image. Both technologies isolate an Actor from its Worker's host kernel, and both support suspend and resume operations.

kagent compiles each ActorTemplate to the sandbox class of the WorkerPool that hosts it, so a default installation runs kagent agents in a {{< gloss "gVisor" >}}gVisor{{< /gloss >}} sandbox, and a pool on the `microvm` class runs them under the micro-VM. A WorkerPool that backs kagent Harnesses must run the Worker build that matches its class. For what each class isolates, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}).

## Suspend, snapshot, and resume

Substrate's density model rests on one fact about agent workloads: an Actor spends most of its time idle, waiting on a person or a large language model (LLM) to respond, not actively computing. Substrate exploits that by suspending idle Actors and reclaiming the capacity that they held, then resuming them on demand when traffic arrives. Suspending and resuming allows a WorkerPool to run far more Actors than it has Workers for at any given moment.

The following diagram traces an Actor through one suspend-and-resume cycle, and shows the second path that opens up once the resulting snapshot is tagged.
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

A **WorkerPool** keeps **Workers** running and ready, and a Worker hosts the **Actor** alongside other Actors while its conversation is active. Suspending this Actor writes its full state to an immutable **ActorSnapshot** and releases the capacity that it held on its Worker.

The diagram forks at this snapshot, because a snapshot serves two purposes.

- **Resume** restores the same Actor onto **any Worker in the pool with room**, which is not necessarily the Worker that it ran on before. Because the snapshot captures the Actor's full state, the conversation continues from where it left off. Every idle agent takes this path.
- A **{{< gloss "Tag" >}}Tag{{< /gloss >}}** pins this snapshot, and a **New Actor** can be seeded from the tag at the moment that it is created. Resuming an existing Actor never goes through a tag.

A tag gives a snapshot a stable, human-meaningful name, so callers do not need to track Substrate's internal snapshot identity. A tag names one snapshot permanently, and only its visibility scope can change afterward. A tag also acts as a retention pin, so Substrate does not delete a snapshot while a tag still names it.

For example, an agent partway through a long incident investigation reaches a state worth keeping. Creating a [checkpoint]({{< link path="about/substrate-runtime/suspend-and-resume#checkpoints" >}}) tags the snapshot that the agent most recently suspended to, which holds that one snapshot in place while the agent carries on and writes newer ones. Without the tag, Substrate collects this snapshot once a newer one supersedes it.

<!-- REVIEW (performance reviewer): an earlier draft stated a 100 ms target at the ninety-fifth percentile, measured from traffic arrival to the moment the Actor can receive it. Removed pending confirmation of the approved measurement and whether it applies to kagent. Do not restore it as a latency guarantee. -->

<!-- REVIEW (runtime/storage reviewers): expand this section with pause versus suspend, golden snapshots, where snapshots are stored, and what resume restores, and extend the snapshot-cycle diagram to show those distinctions. Do not equate a filesystem snapshot with full execution-state restoration without confirmation. -->

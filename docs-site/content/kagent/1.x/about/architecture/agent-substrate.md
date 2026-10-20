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

An **ActorTemplate** is the definition that Agent Substrate creates an Actor from. It states the agent's container image, the command that starts the agent, the agent's environment, the sandbox class to isolate it with, and the WorkerPool to schedule it onto. The kagent controller compiles an {{< gloss "Agent" >}}Agent{{< /gloss >}} and the resources that it names into an ActorTemplate.

Agent Substrate rejects any change to an ActorTemplate's spec after it is created, so a running Session stays on a fixed definition. The controller creates a new ActorTemplate for every compiled {{< gloss "Revision" >}}revision{{< /gloss >}} instead of editing an existing one, and it reclaims an old ActorTemplate once nothing references its revision. An Agent references one for as long as the revision is its desired or its latest successful one, and a Session references one for as long as it runs on that revision.

## Workers and WorkerPools

Each Actor runs on a **Worker**, a pod that Agent Substrate starts in advance. A Session that needs an Actor gets one on a Worker that is already running, so no Actor waits for a new pod. The sandbox boundary sits around the Actor, not around the Worker pod that hosts it.

### WorkerPools

Workers come from a **WorkerPool**, a Kubernetes custom resource that an operator provisions before any Agent can compile. A WorkerPool declares how many Workers to keep running and which sandbox technology those Workers use.

An operator never creates a Worker directly. Agent Substrate manages them and keeps enough ready in each WorkerPool for an Actor to start or resume immediately.

A WorkerPool exposes a Kubernetes scale subresource, so a HorizontalPodAutoscaler can size a pool from a metric instead of a fixed replica count. Agent Substrate publishes how many Workers in each pool have no free Actor slot. An autoscaler that watches this number adds Workers before the pool fills, instead of after placements fail.

<!-- REVIEW (runtime reviewer): queue-depth scaling is still unconfirmed and is deliberately not described here. Confirm whether it is supported before adding it. -->
<!-- REVIEW (runtime reviewer): ate-api-server publishes this signal as ate_workerpool_workers{state="at_capacity"}. Only the Kind-only demos/autoscaled-workerpool demo wires it into an HPA, through prometheus-adapter, and the chart ships no HPA. Confirm that this series is the supported autoscaling signal before documenting a worked HPA example. -->

### Worker capacity

One Worker hosts many Actors at the same time. Each Worker reports its maximum Actor capacity when it starts. A Worker at that capacity refuses further Actors, and Agent Substrate places them on another Worker in the pool. The Worker's Actor capacity is a property of the Worker build, not a setting on the pool. The gVisor and micro-VM Workers that Agent Substrate ships both report a capacity of 1000 Actors.

### Actor placement

Agent Substrate checks two things before it places an Actor on a Worker:
* Whether the Worker has a free Actor slot. This check always runs.
* Whether the Worker has enough spare CPU and memory. This check runs only when the ActorTemplate states how much CPU and memory one Actor needs.

Every ActorTemplate that the kagent controller compiles states a CPU and memory limit for one Actor, so both checks run for a Session's Actor. The `config.runtimeDefaults.cpu` and `config.runtimeDefaults.memory` Helm values set this limit for every agent, and default to `1` CPU and `1Gi` of memory.

The CPU and memory check compares that limit against the capacity that the Worker reports. A WorkerPool sets no resource limits on its Workers by default, and a Worker with no limits reports its whole node as its own capacity. The check then ignores every other pod on the node, so node pressure surfaces as eviction rather than as a placement failure. To make the check reflect the Worker, [set resource limits on Workers]({{< link path="operations/tune-agent-substrate#set-resource-requests-on-workers" >}}).

Agent Substrate first narrows the pool to the Workers that can take the Actor. It then picks two of those Workers at random and places the Actor on the less loaded of the two. A Worker's load is the higher of two shares: the share of its Actor slots that are filled, and the share of its CPU and memory that is committed. Sampling two Workers keeps the decision cheap, and it avoids the pile-up that follows when every placement aims at the Worker that looks emptiest.

<!-- REVIEW (runtime reviewer): a diagram of pods, Workers, pools, and Actor placement, with the sandbox boundaries marked, is wanted in this section. -->

## Atespaces

An **atespace** is the isolation boundary that an Actor belongs to, and the first half of its identity. Agent Substrate addresses an Actor by its atespace and its name together, so the same Actor name can exist in two atespaces without colliding.

An atespace resembles a Kubernetes namespace, but it is not one. Agent Substrate defines it as its own cluster-wide resource. No namespace contains it, a namespace's RBAC does not reach it, and deleting a Kubernetes namespace does not delete the atespace that kagent named after it.

Actors and Workers sit differently against this boundary. An Actor belongs to exactly one atespace for its entire life, whereas a Worker belongs to none. A Worker hosts whichever Actors Agent Substrate places on it, and those Actors can come from different atespaces.

kagent names each atespace after the Kubernetes namespace of the Agent that owns the Actor, and creates the atespace the first time a Session in that namespace needs an Actor. The Actor's own name is `session-` followed by the Session's identifier. A Session on an Agent in the `kagent` namespace therefore runs on an Actor in the `kagent` atespace. Both halves of this identity appear in the address that traffic uses to reach the Actor, which [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#how-traffic-reaches-a-sandboxed-actor" >}}) covers.

## Sandboxing

Because an Actor often runs a model-directed agent that calls tools and executes commands, Agent Substrate runs each Actor in an isolated sandbox rather than a plain container. A WorkerPool's `sandboxClass` field selects the sandbox technology for its Workers: [gVisor](https://gvisor.dev), or a micro-VM that runs the workload under [Cloud Hypervisor](https://www.cloudhypervisor.org) with a [Kata Containers](https://katacontainers.io) kernel and root image. Both technologies isolate an Actor from its Worker's host kernel, and both support suspend and resume operations.

kagent compiles each ActorTemplate to the sandbox class of the WorkerPool that hosts it, so a default installation runs kagent agents in a {{< gloss "gVisor" >}}gVisor{{< /gloss >}} sandbox, and a pool on the `microvm` class runs them under the micro-VM. A WorkerPool that backs kagent Harnesses must run the Worker build that matches its class. For what each class isolates, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}).

## Suspend, snapshot, and resume

An Actor spends most of its time idle, waiting on a person or a large language model (LLM) to respond. Agent Substrate suspends an idle Actor, reclaims the capacity that it held, and resumes the Actor when traffic arrives. A WorkerPool can therefore run far more Actors than it has room for at any one moment.

The following diagram traces an Actor through one suspend-and-resume cycle, and shows the second path that opens up once the resulting snapshot is tagged.
</br></br>

{{< reuse "kagent-docs/snippets/snapshot-cycle-diagram.md" >}}

A **WorkerPool** keeps **Workers** running and ready, and a Worker hosts the **Actor** alongside other Actors while its Session is active. Suspending this Actor writes its durable data to an immutable **ActorSnapshot** and releases the capacity that it held on its Worker.

The diagram forks at this snapshot, because a snapshot serves two purposes.

- **Resume** restores the same Actor onto **any Worker in the pool with room**, which is not necessarily the Worker that it ran on before. Agent Substrate starts new containers for the Actor and restores the durable data from the snapshot. The conversation continues from where it left off. Every idle agent takes this path.
- A **{{< gloss "Tag" >}}Tag{{< /gloss >}}** pins this snapshot so that Agent Substrate does not collect it. To fork a Session from a checkpoint, kagent seeds a **New Actor** from that tag. Resuming an existing Actor never goes through a tag.

A tag gives a snapshot a stable name, so callers do not track Agent Substrate's internal snapshot identity. The tag names one snapshot permanently, and only its visibility scope can change afterward. A tag is also a retention pin, so Agent Substrate does not delete a snapshot while a tag still names it.

For example, an agent partway through a long incident investigation reaches a state worth keeping. Creating a [checkpoint]({{< link path="about/substrate-runtime/suspend-and-resume#checkpoints" >}}) tags the snapshot that the agent most recently suspended to, which holds that one snapshot in place while the agent carries on and writes newer ones. Without the tag, Agent Substrate collects this snapshot once a newer one supersedes it.

<!-- REVIEW (performance reviewer): an earlier draft stated a 100 ms target at the ninety-fifth percentile, measured from traffic arrival to the moment the Actor can receive it. Removed pending confirmation of the approved measurement and whether it applies to kagent. Do not restore it as a latency guarantee. -->

<!-- REVIEW (runtime/storage reviewers): expand this section with pause versus suspend, golden snapshots, where snapshots are stored, and what resume restores, and extend the snapshot-cycle diagram to show those distinctions. Do not equate a filesystem snapshot with full execution-state restoration without confirmation. -->

---
title: kagent architecture
description: See how a Harness and AgentTemplate become a running conversation, across kagent's two authorization planes.
weight: 30
author: kagent.dev
---

The previous page defined the [core concepts]({{< link path="about/core-concepts" >}}) of Harness, AgentTemplate, Agent, Session, and Actor. This page connects them into one system: how applying those three custom resources leads to a running conversation, and which parts of that path Kubernetes governs versus which parts kagent governs itself.

## Two authorization planes

kagent 1.0 splits authorization across two planes:

- The **Kubernetes plane** governs the {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} custom resources. Kubernetes Role-Based Access Control (RBAC) decides who can create, read, or edit the resources with `kubectl`, exactly as it would for any other Custom Resource Definition (CRD).
- The **kagent plane** governs any interactions involving {{< gloss "Session" >}}Sessions{{< /gloss >}}, such as creating, suspending, resuming, sharing, deleting, and holding a conversation with a Session. kagent's own gRPC authentication and authorization decide who can complete these interactions, independent of Kubernetes RBAC.

Someone with Kubernetes RBAC access to apply an Agent and the resources it names does not automatically have access to create or talk to Sessions on it. The planes are not mirror images, though. kagent's gRPC API also writes those Kubernetes resources, so a caller on the kagent plane reaches both. For more information on that second path, see [Identity]({{< link path="substrate-runtime/identity#the-kubernetes-plane" >}}).

The following diagram shows where the boundary between the two planes falls.
</br></br>

```mermaid
flowchart TB

    subgraph k8s["Kubernetes plane (RBAC)"]
        operator["Operator<br>kubectl apply"]
        harness["Harness"]
        template["AgentTemplate"]
        agent["Agent"]
        controller["kagent controller"]
        operator --> harness
        operator --> template
        operator --> agent
        harness --> agent
        template --> agent
        agent --> controller
    end

    %% Declared outside both subgraphs on purpose. An ActorTemplate is a Substrate
    %% resource reached over gRPC, not a Kubernetes object, so it belongs to
    %% neither plane. A node joins whichever subgraph first references it, so both
    %% of its edges have to live out here too.
    actortemplate["ActorTemplate (Substrate)"]
    controller -->|compiles the Agent into| actortemplate

    subgraph kagentplane["kagent plane (gRPC auth)"]
        caller["Caller"]
        gateway["A2A gateway"]
        session["Session"]
        actor["Actor (Substrate)"]
        caller -->|A2A conversation| gateway
        caller -->|CreateSession| session
        gateway -->|routes to| actor
        session -->|runs on| actor
    end

    actortemplate -->|instantiated as| session
    %% Invisible link: forces the kagent plane to sit fully below the ActorTemplate,
    %% and the ActorTemplate below the Kubernetes plane. Without it the layout engine
    %% staggers the two planes diagonally, which both wastes width and scrambles the
    %% reading order. Anchor it to actortemplate, not controller: anchoring higher
    %% loses the stacking. Verified by rendering.
    actortemplate ~~~ caller

    classDef crd stroke:#a78bfa,stroke-width:2px
    class harness,template crd
```

Follow the **Kubernetes plane** first. An operator applies a Harness, an AgentTemplate, and an Agent that pairs them with `kubectl`, governed by Kubernetes RBAC. The diagram shows this path because RBAC governs it, and kagent's gRPC API reaches the same resources instead. The kagent controller watches each Agent, resolves the template and harness that it names, and compiles the result into an {{< gloss "ActorTemplate" >}}ActorTemplate{{< /gloss >}} on Substrate. The ActorTemplate sits outside both planes in the diagram because that is where it sits in reality: it is a Substrate resource that the controller creates over gRPC, not a Kubernetes object, so no Kubernetes role grants access to it.

The **kagent plane** starts once that ActorTemplate exists. A caller, who may or may not be the same person as the operator, calls `CreateSession` through kagent's gRPC API. This call is governed by kagent's own authentication and authorization, not by Kubernetes RBAC. kagent creates the Session from the Agent's latest successful revision, and that Session runs on an {{< gloss "Actor" >}}Actor{{< /gloss >}}.

From there, the caller holds a conversation over the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) protocol. A caller addresses the Agent, and names the conversation with the Session's ID as the A2A `contextId`. The A2A gateway routes each request to the Actor running behind that Session. This means that the caller only ever needs to know the Agent's name and the Session's ID, never which Actor or {{< gloss "Worker" >}}Worker{{< /gloss >}} is behind it.

## Why two planes

Kubernetes RBAC is designed to authorize configuration changes: who can create a Deployment, edit a ConfigMap, or in this case, apply a Harness, an AgentTemplate, or an Agent. It is not designed to authorize a running conversation, share access to it with another user, or scope who can suspend it. kagent's gRPC plane exists to authorize exactly those actions, at the granularity of a single Session rather than a namespace or a resource kind.

This split also keeps the two lifecycles independent. Editing an Agent, or either resource it names, does not affect Sessions already running against the ActorTemplate that they were created from. It only affects new Sessions, created after the edit is compiled.

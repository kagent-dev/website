---
title: Frequently asked questions
linkTitle: FAQs
description: Find answers to common questions about kagent, its core resources, and what changed in the 1.0 release.
weight: 50
author: kagent.dev
---

## How do I get started with kagent?

Install kagent first, with a {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} provisioned, by following [Install kagent]({{< link path="setup/installation" >}}). Then work through [Your first agent]({{< link path="get-started/your-first-agent" >}}), which applies a Harness and an AgentTemplate and holds a conversation with the AgentInstance that they produce. Those two resources and that conversation are the model that the rest of these docs assume. [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}) then gives that agent a tool.

## What makes kagent different from other agent frameworks?

kagent is declarative and Kubernetes-native. You author an agent's runtime and behavior as custom resources and let the controller reconcile them, rather than writing code that drives a model through each step. Those resources are then governed by the same role-based access control (RBAC), GitOps, and observability as your other workloads. [What is kagent?]({{< link path="about/what-is-kagent" >}}) covers the platform in full.

## What is the difference between a Harness and an AgentTemplate?

A {{< gloss "Harness" >}}Harness{{< /gloss >}} defines how an agent is allowed to run: its runtime, workload image, {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}}, snapshot storage, and which templates it accepts. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} defines what an agent does: its model, system prompt, tools, skills, and plugins. Separating the two lets a platform team own the runtime while an application team owns the behavior. Neither resource runs anything on its own, because an agent exists only once a Harness accepts a template. For the full definition of each resource and the fields that it carries, see [Core concepts]({{< link path="about/core-concepts#harness" >}}).

## Is a Harness the same as 0.x's AgentHarness?

No. The two share part of a name and nothing else. 0.x's `AgentHarness` provisions OpenClaw or Hermes coding-agent sandboxes, while 1.0's `Harness` governs how any agent is allowed to run. Read `Harness` as a new resource rather than a renamed one.

## What is an AgentInstance?

An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} is one running conversation between a Harness and an AgentTemplate. Unlike those two, it is not a Kubernetes custom resource: kagent's gRPC API creates it, kagent's database tracks it, and an {{< gloss "Actor" >}}Actor{{< /gloss >}} on {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} runs it. One template can back many concurrent instances, each with its own {{< gloss "Transcript" >}}transcript{{< /gloss >}}.

## How does suspend and resume work?

Agent conversations are mostly idle, so Agent Substrate does not hold a pod open between turns. When a turn ends, it writes the Actor's memory and filesystem to a {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} and releases the {{< gloss "Worker" >}}Worker{{< /gloss >}} that was hosting it. The next message restores that snapshot onto whichever Worker is free, and the conversation continues where it stopped. [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume" >}}) covers the lifecycle, what a snapshot captures, and how {{< gloss "Checkpoint" >}}checkpoints{{< /gloss >}} pin one.

## How is 1.0 different from 0.x?

1.0 changes how agents run and how you declare them. Agents no longer run as long-lived Deployments; each conversation runs as a sandboxed Actor on Agent Substrate that suspends between turns. The single 0.x `Agent` resource is replaced by the Harness and AgentTemplate pair, `ToolServer` is replaced by {{< gloss "RemoteMCPServer" >}}RemoteMCPServer{{< /gloss >}}, and the API group moves from `v1alpha2` to `v1alpha3`.

1.0 has no in-place upgrade path. An existing 0.10.x installation has no migration bridge to 1.0, so moving to 1.0 means standing up a new installation and recreating your resources on it. For the procedure, see [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x" >}}). [Version support]({{< link path="reference/versions#release-support-and-compatibility" >}}) records which upgrade paths are supported, and the [release notes]({{< link path="reference/release-notes/1.0#removed-and-replaced-resources" >}}) list the breaking changes.

## How do I report a bug or request a feature?

Open an issue on the [kagent GitHub repository](https://github.com/kagent-dev/kagent/issues). For a bug, include your kagent version, the resources that reproduce it, and the controller logs. [Debug]({{< link path="operations/debug#collect-logs" >}}) covers how to collect those.

## How do I contribute to kagent?

Start with the [contribution guide](https://github.com/kagent-dev/kagent/blob/main/CONTRIBUTING.md), then open a pull request. [Community and contributing]({{< link path="reference/community" >}}) collects the repository, the roadmap, and the project's Discord.

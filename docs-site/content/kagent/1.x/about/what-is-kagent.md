---
title: What is kagent?
description: Understand what the kagent platform is and its core purpose.
weight: 10
author: kagent.dev
---

kagent is an open-source, Kubernetes-native platform for running AI agents. It defines an agent's runtime and behavior as ordinary Kubernetes custom resources, governed by the same GitOps and observability that you already use for your other workloads, and runs each agent's conversation inside [Agent Substrate]({{< link path="about/agent-substrate" >}}), a sandboxed, suspend-and-resume compute layer built for bursty, mostly idle agent workloads. kagent works with every major large language model (LLM) provider. Agents run on kagent's own Go and Python engines, which build on Google's Agent Development Kit (ADK), on the Codex or Claude coding agents, or on an image of your own.

kagent was created at [Solo.io](https://www.solo.io) in 2025 and is a [Cloud Native Computing Foundation](https://www.cncf.io) sandbox project.

## How kagent works

Unlike a traditional chatbot, kagent uses advanced reasoning and iterative planning to autonomously handle multi-step problems in cloud-native environments. It turns AI insight into concrete action, helping teams tackle common operational challenges such as:

- Diagnosing connectivity issues across multiple service hops
- Troubleshooting application performance degradation
- Automating alert generation from Prometheus metrics
- Debugging Gateway and HTTPRoute configurations
- Managing progressive rollouts with Argo Rollouts

## Core model

kagent 1.0 separates an agent's capabilities from its runtime, then runs the two together as a conversation:

- A **Harness** and an **AgentTemplate** are the Kubernetes custom resources you author. Together they say how an agent is allowed to run and what it can do.
- An **AgentInstance** is the running conversation that those two resources produce, backed by an **Actor** on Agent Substrate.

[Core concepts]({{< link path="about/core-concepts" >}}) define each of these in detail, and the [architecture]({{< link path="about/architecture" >}}) walks through how they connect end to end.

Kubernetes role-based access control (RBAC) governs who can author these resources with `kubectl`. The kagent gRPC API reaches the same resources by a second path, and the open source build authorizes every caller that reaches that endpoint. For what each path establishes, see [Identity]({{< link path="substrate-runtime/identity#the-kagent-plane" >}}).

## Benefits

kagent addresses the growing complexity of cloud-native operations by:

- Automating routine troubleshooting and operational tasks.
- Reducing the need for specialist intervention in common scenarios.
- Enabling teams to formalize and share their operational expertise.
- Providing a platform for building and sharing custom AI agents.

## Platform features

Everything works with a single `helm install`, with one exception: long-term memory needs an external PostgreSQL database that has the `pgvector` extension.

{{< feature-cards >}}
{{< feature-card title="Agent lifecycle via CRDs" desc="Define, version, and roll out Harnesses and AgentTemplates with kubectl and GitOps, the same workflow as every other workload." >}}
{{< feature-card title="Sandboxed by default" desc="Every AgentInstance runs on a Substrate Actor, isolated from the host kernel by a gVisor sandbox. Run untrusted, model-directed code safely." >}}
{{< feature-card title="Suspend and resume" desc="Idle AgentInstances suspend and free their compute, then resume on demand. Run far more agents than you have capacity for at any one moment." >}}
{{< feature-card title="Checkpoint and fork" desc="Pin a snapshot of a conversation at a turn boundary, then branch a second AgentInstance from it that keeps the revision it started with." >}}
{{< feature-card title="Pluggable agent runtimes" desc="A Harness selects the engine behind an agent: kagent's own Go and Python engines, the Codex or Claude coding agents, or any image of your own that speaks kagent's A2A contract." >}}
{{< feature-card title="Tools over MCP" desc="Bind an agent to any Model Context Protocol (MCP) server with a RemoteMCPServer resource. An installation registers two servers already, including 124 tools for Kubernetes, Helm, Istio, and Argo Rollouts." >}}
{{< feature-card title="Agent tools" desc="Bind another AgentTemplate as a tool, so an agent can hand work to a specialist. A Shared binding nests that agent inside its parent's Actor, one level deep." >}}
{{< feature-card title="Long-term memory" desc="Persistent, vector-backed memory across sessions. Agents remember context, not just the last prompt." >}}
{{< feature-card title="Human-in-the-loop" desc="Tool approval gates and agent-initiated questions keep a person in control of consequential actions." >}}
{{< feature-card title="Agent-to-Agent (A2A)" desc="AgentInstances talk to callers, and to each other, over the A2A protocol." >}}
{{< feature-card title="Skills and plugins" desc="Load skills and capability packages from an Open Container Initiative (OCI) registry, Git, or S3 at startup." >}}
{{< feature-card title="Prompt templates" desc="Reusable prompt fragments stored as ConfigMaps. Keep system prompts consistent across agents." >}}
{{< feature-card title="Observability" desc="OpenTelemetry tracing, structured logs, and an optional Prometheus metrics endpoint, with control plane traces carrying the Actor that they belong to." >}}
{{< feature-card title="Postgres storage" desc="AgentInstances, conversations, and compiled revisions persist in PostgreSQL with reviewable migrations. Start on the bundled instance, then point kagent at your own database." >}}
{{< /feature-cards >}}

## Enterprise distributions

Check out [Solo Enterprise for kagent](https://www.solo.io/products/kagent-enterprise), a comprehensive agent management interface for creating, validating, debugging, deploying, and monitoring AI agents across federated Kubernetes clusters. Solo Enterprise for kagent adds enterprise-grade capabilities on top of the kagent open source project, including advanced management features, observability tools, and multicluster federation support.

## Getting started

To start using kagent, see [Your first agent]({{< link path="get-started/your-first-agent" >}}). For a deeper understanding of how the pieces fit together, see [kagent architecture]({{< link path="about/architecture" >}}).

Ready to contribute? Visit the [GitHub repository](https://github.com/kagent-dev) to learn how you can help expand the ecosystem of cloud-native AI agents.

## Community

Join the kagent community!

- Explore the repositories on [GitHub](https://github.com/kagent-dev).
- Join the discussion in the #kagent channel on CNCF Slack.
- Check the [FAQ]({{< link path="reference/faq" >}}) for common questions.
- Follow the [feature roadmap](https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap) for upcoming developments.

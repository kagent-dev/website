---
title: What is kagent?
description: Understand what the kagent platform is and its core purpose.
weight: 10
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/about/what-is-kagent-intro.md" >}}

## How kagent works

{{< reuse "kagent-docs/snippets/about/what-is-kagent-how-it-works.md" >}}

## Core model

kagent 1.0 separates an agent's capabilities from its runtime, then runs the two together as a conversation:

- A **Harness** and an **AgentTemplate** are the Kubernetes custom resources you author. Together they say how an agent is allowed to run and what it can do.
- An **Agent** pairs one of each, and a **Session** is a running conversation with that Agent, backed by an **Actor** on Agent Substrate.

[Core concepts]({{< link path="about/core-concepts" >}}) define each of these in detail, and the [architecture]({{< link path="about/architecture/kagent" >}}) walks through how they connect end to end.

{{< reuse "kagent-docs/snippets/about/what-is-kagent-authorization.md" >}}

## Benefits

{{< reuse "kagent-docs/snippets/about/what-is-kagent-benefits.md" >}}

## Platform features

{{< feature-cards >}}
{{< feature-card title="Agent lifecycle via CRDs" desc="Define, version, and roll out Harnesses and AgentTemplates with kubectl and GitOps, the same workflow as every other workload." >}}
{{< feature-card title="Sandboxed by default" desc="Every Session runs on a Substrate Actor, isolated from the host kernel by a gVisor sandbox. Run untrusted, model-directed code safely." >}}
{{< feature-card title="Suspend and resume" desc="Idle Sessions suspend and free their compute, then resume on demand. Run far more agents than you have capacity for at any one moment." >}}
{{< feature-card title="Checkpoint and fork" desc="Pin a snapshot of a conversation at a turn boundary, then branch a second Session from it that keeps the revision it started with." >}}
{{< feature-card title="Pluggable agent runtimes" desc="A Harness selects the engine behind an agent: kagent's own Go and Python engines, the Codex or Claude coding agents, or any image of your own that speaks kagent's A2A contract." >}}
{{< feature-card title="Tools over MCP" desc="Bind an agent to any Model Context Protocol (MCP) server with a RemoteMCPServer resource. An installation registers two servers already, including 124 tools for Kubernetes, Helm, Istio, and Argo Rollouts." >}}
{{< feature-card title="Agent tools" desc="Bind another AgentTemplate as a tool, so an agent can hand work to a specialist. A Shared binding nests that agent inside its parent's Actor, one level deep." >}}
{{< feature-card title="Long-term memory" desc="Persistent, vector-backed memory across sessions. Agents remember context, not just the last prompt." >}}
{{< feature-card title="Human-in-the-loop" desc="Tool approval gates and agent-initiated questions keep a person in control of consequential actions." >}}
{{< feature-card title="Agent-to-Agent (A2A)" desc="Agents talk to callers, and to each other, over the A2A protocol." >}}
{{< feature-card title="Skills and plugins" desc="Load skills and plugins from an Open Container Initiative (OCI) registry, Git, or S3 at startup." >}}
{{< feature-card title="Prompt templates" desc="Reusable prompt fragments stored as ConfigMaps. Keep system prompts consistent across agents." >}}
{{< feature-card title="Observability" desc="OpenTelemetry tracing, structured logs, and an optional Prometheus metrics endpoint, with control plane traces carrying the Actor that they belong to." >}}
{{< /feature-cards >}}

{{< reuse "kagent-docs/snippets/about/what-is-kagent-enterprise.md" >}}

{{< reuse "kagent-docs/snippets/about/what-is-kagent-community.md" >}}

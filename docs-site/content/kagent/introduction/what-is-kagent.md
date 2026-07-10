---
title: Introducing kagent
linkTitle: What is kagent
description: Understand what kagent is and its core purpose.
weight: 2
author: kagent.dev
---

kagent is an open-source programming framework that brings the power of agentic AI to cloud-native environments. Built specifically for DevOps and platform engineers, kagent enables AI agents to run directly in Kubernetes clusters to automate operations, troubleshoot issues, and solve complex cloud-native challenges.

kagent was created at [Solo.io](https://www.solo.io) in 2025 and is a [Cloud Native Computing Foundation](https://www.cncf.io) sandbox project.

## What is kagent?

Unlike traditional chatbots, kagent leverages advanced reasoning and iterative planning capabilities to autonomously handle multi-step problems in cloud-native environments. It transforms AI insights into concrete actions, helping teams tackle common operational challenges like:

- Diagnosing connectivity issues across multiple service hops
- Troubleshooting application performance degradation
- Automating alert generation from Prometheus metrics
- Debugging Gateway and HTTPRoute configurations
- Managing progressive rollouts with Argo Rollouts

## Core Components

kagent's architecture consists of three main components:

- **Tools**: Any MCP-style function that agents can leverage to interact with cloud-native systems. kagent comes with pre-built tools that include capabilities like displaying pod logs, querying Prometheus metrics, generating resources and more. You can check the available tools in the [tool registry](https://kagent.dev/tools).
- **Agents**: Autonomous systems that plan, execute, and analyze tasks using the available tools. These agents can chain multiple operations together to solve complex problems. Each agent can have access to one or more tools to accomplish its work. Agents can also be grouped into teams where a planning agent comes up with a plan and assigns tasks to individual agents in the team.
- **Framework**: A flexible interface that allows running agents either through a UI or declaratively. Built on Google's ADK framework, it provides extensive customization options.

## Why kagent?

kagent addresses the growing complexity of cloud-native operations by:

- Automating routine troubleshooting and operational tasks
- Reducing the need for specialist intervention in common scenarios
- Enabling teams to formalize and share their operational expertise
- Providing a platform for building and sharing custom AI agents

## Platform features

Everything works with a single `helm install`. No add-ons, no extra databases, no waiting for enterprise.

{{< feature-cards >}}
{{< feature-card title="Agent lifecycle via CRDs" desc="Define, version, and roll out agents with kubectl and GitOps — the same workflow as every other workload." >}}
{{< feature-card title="Multi-runtime support" desc="Go and Python ADK runtimes. Pick the language that fits, or mix both in the same cluster." >}}
{{< feature-card title="BYO frameworks" desc="LangGraph, CrewAI, Google ADK, or your own — bring any agent framework and kagent orchestrates it." >}}
{{< feature-card title="Long-term memory" desc="Persistent vector-backed memory across sessions. Agents remember context, not just the last prompt." >}}
{{< feature-card title="Human-in-the-loop" desc="Tool approval gates, agent-initiated questions, and cascading HITL — humans stay in control." >}}
{{< feature-card title="Agent-to-Agent (A2A)" desc="Agents discover and invoke each other. Compose multi-agent workflows with first-class delegation." >}}
{{< feature-card title="Skills from Git" desc="Load markdown knowledge from Git repos at startup. Agents learn your runbooks, ADRs, and internal docs." >}}
{{< feature-card title="Prompt templates" desc="Reusable prompt fragments stored as ConfigMaps. DRY your system prompts across agents." >}}
{{< feature-card title="Context compaction" desc="Auto-summarization of long conversation histories. Agents stay coherent without blowing token budgets." >}}
{{< feature-card title="Sandbox & security" desc="Agent sandboxing, RBAC, and security hardening out of the box. Run untrusted code safely." >}}
{{< feature-card title="Full observability" desc="OTel tracing, Prometheus metrics, structured logs. See every prompt, every tool call, every token." >}}
{{< feature-card title="Postgres storage" desc="Production-grade Postgres-backed storage with reviewable migrations. No proprietary database lock-in." >}}
{{< /feature-cards >}}

## Enterprise distributions

Check out [Solo Enterprise for kagent](https://www.solo.io/products/kagent-enterprise), a comprehensive agent management interface for creating, validating, debugging, deploying, and monitoring AI agents across federated Kubernetes clusters. Solo Enterprise for kagent adds enterprise-grade capabilities on top of the kagent open source project, including advanced management features, observability tools, and multicluster federation support.

## Getting Started

To start using kagent in your environment, check out the [Quick Start Guide](/docs/kagent/getting-started/quickstart) guide. For a deeper understanding of how kagent works, refer to the [kagent architecture](/docs/kagent/concepts/architecture).

Ready to contribute? Visit our [Github repository](https://github.com/kagent-dev) to learn how you can help expand the ecosystem of cloud-native AI agents.

## Community

Join the kagent community:
- Explore our repositories on [GitHub](https://github.com/kagent-dev)
- Join the discussion in the #kagent channel on CNCF Slack
- Check our [FAQ](/docs/kagent/resources/faq) for common questions
- Follow our [Feature Roadmap](https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap) for upcoming developments

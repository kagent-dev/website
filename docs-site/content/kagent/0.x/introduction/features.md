---
title: Features
description: A complete overview of kagent platform capabilities.
weight: 3
author: kagent.dev
---

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

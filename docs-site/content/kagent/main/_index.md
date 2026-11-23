---
title: kagent
linkTitle: "kagent main"
description: Explore concepts, guides, and reference docs for running declarative AI agents on Kubernetes with Agent Substrate, from install through day-two operations.
weight: 10
author: kagent.dev
# The landing page lays out its own cards, so skip the auto-generated child grid.
disableCards: true
---

{{< landing-hero title="Run AI agents on Kubernetes" >}}

{{< cards cols="3" >}}
  {{< card title="Install" path="/setup/" icon="download" >}}
  {{< card title="Tutorials" path="/get-started/" icon="academic-cap" >}}
  {{< card title="Documentation" path="/about/" icon="book-open" >}}
{{< /cards >}}

## What is Kagent?

{{< landing-split >}}
kagent gives platform teams one place to deploy, manage, and govern AI agents on Kubernetes. Orchestrated by kagent, Agent Substrate runs each agent in its own sandbox, puts it to sleep while it waits, and wakes it in sub-milliseconds.

[Learn more →]({{< link path="about/what-is-kagent" >}})
{{< /landing-split >}}

## Get Started

Build a working agent in the kagent UI. Start with Build an Agent, or pick a project that takes you from an empty installation to an agent that you can use.

{{< cards cols="3" >}}
  {{< card title="Build an Agent" subtitle="Start here. Create your first agent from one form." path="/get-started/build-an-agent/" icon="/icons/tutorial-agent.svg" >}}
  {{< card title="Build a personal AI assistant" subtitle="A personality, a weather tool, and a morning routine." path="/get-started/personal-assistant/" icon="/icons/tutorial-prompts.svg" >}}
  {{< card title="Build a K8s SRE" subtitle="Investigates your cluster and asks before it acts." path="/get-started/k8s-sre/" icon="/icons/tutorial-policy.svg" >}}
  {{< card title="Build a sandbox coding agent" subtitle="Writes code and runs it in an isolated Sandbox." path="/get-started/sandbox-coding-agent/" icon="/icons/tutorial-sandbox.svg" >}}
  {{< card title="Build a scheduled agent" subtitle="Reports on your cluster every day." path="/get-started/scheduled-agent/" icon="/icons/tutorial-schedule.svg" >}}
  {{< card title="Build a CVE agent" subtitle="Reports the newest exploited vulnerabilities from CISA." path="/get-started/cve-agent/" icon="/icons/tutorial-model.svg" >}}
  {{< card title="Add an MCP server" subtitle="Give any agent tools from a server." path="/get-started/add-an-mcp-server/" icon="/icons/tutorial-mcp.svg" >}}
  {{< card title="Human in the loop" subtitle="Make an agent ask before it runs a tool." path="/get-started/human-in-the-loop/" icon="/icons/tutorial-approval.svg" >}}
  {{< card title="All tutorials" subtitle="Every project and single-task tutorial." path="/get-started/" icon="/icons/tutorial-plugin.svg" >}}
{{< /cards >}}

## What's new in 1.0

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 moves the runtime from Kubernetes Deployments to [Agent Substrate](https://github.com/agent-substrate/substrate), introducing Harness, AgentTemplate, and Agent as the new API surface, with a Session for each running conversation. For a summary of what changed in 1.0, see the [Release notes]({{< link path="reference/release-notes/1.0#100" >}}).
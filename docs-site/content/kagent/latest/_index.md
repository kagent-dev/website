---
title: kagent
linkTitle: "kagent 1.0"
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

Follow a hands-on guide to install kagent and run your first agent.

{{< cards cols="2" >}}
  {{< card title="Build an Agent" subtitle="Create a personal assistant in the UI." path="/get-started/build-an-agent/" icon="sparkles" >}}
  {{< card title="Add an MCP server" subtitle="Give your agent a weather tool from the UI." path="/get-started/add-an-mcp-server/" icon="puzzle" >}}
  {{< card title="Your first agent" subtitle="Build an agent from YAML and the CLI." path="/get-started/your-first-agent/" icon="cube" >}}
  {{< card title="Your first MCP tool" subtitle="Bind a tool to an agent from YAML." path="/get-started/your-first-mcp-tool/" icon="chip" >}}
{{< /cards >}}

## What's new in 1.0

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 moves the runtime from Kubernetes Deployments to [Agent Substrate](https://github.com/agent-substrate/substrate), introducing Harness, AgentTemplate, and Agent as the new API surface, with a Session for each running conversation. For a summary of what changed in 1.0, see the [Release notes]({{< link path="reference/release-notes/1.0#100" >}}).
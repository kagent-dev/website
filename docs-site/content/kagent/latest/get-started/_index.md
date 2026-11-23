---
title: Tutorials
description: Build your first agent and give it tools, in the kagent UI or from YAML.
weight: 6
author: kagent.dev
# This page lays out its own path and cards, so skip the auto-generated child grid.
disableCards: true
---

{{< tutorial-banner title="Build a personal assistant, step by step" text="One story, five short tutorials, all in the kagent UI. Each one adds something to the same agent." cta="Start with Build an Agent" page="build-an-agent" >}}

## The personal assistant path

Follow the steps in order. You start with an empty installation and finish with an assistant that has a tool, shared prompt text, access to an outside API, and a daily job. Each tutorial takes a few minutes.

{{< story-path >}}
  {{< story-step title="Build an Agent" page="build-an-agent" image="img/kagent-tutorial-build-agent.png" text="Create the personal assistant from one form, then turn its behavior into a template that other agents can share." result="You end up with: two agents and a shared template." >}}
  {{< story-step title="Add an MCP server" page="add-an-mcp-server" image="img/kagent-tutorial-mcp-server.png" text="Register a weather server and give its tool to the assistant, so that it can do something beyond talking." result="You end up with: an assistant that can look up the weather." >}}
  {{< story-step title="Create a prompt library" page="prompt-library" image="img/kagent-tutorial-prompt-library.png" text="Keep the assistant's tone and safety rules as reusable fragments, in one place." result="You end up with: a prompt library with two fragments." >}}
  {{< story-step title="Allow an agent to reach a host" page="egress-policy" image="img/kagent-tutorial-egress-policy.png" text="Agents run in a sandbox. Open one door: let the assistant call the GitHub API." result="You end up with: an egress policy attached to the assistant." >}}
  {{< story-step title="Schedule an agent" page="schedule-an-agent" image="img/kagent-tutorial-schedule.png" text="Have the assistant write a plan for your day every morning, without being asked." result="You end up with: a daily schedule and its run history." >}}
{{< /story-path >}}

## Build with YAML

Prefer files and the command line? These tutorials build an agent and bind a tool as Kubernetes resources.

{{< cards cols="2" >}}
  {{< card title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then talk to it with the CLI." path="/get-started/your-first-agent/" icon="cube" >}}
  {{< card title="Your first MCP tool" subtitle="Bind a Model Context Protocol tool to an AgentTemplate." path="/get-started/your-first-mcp-tool/" icon="chip" >}}
{{< /cards >}}

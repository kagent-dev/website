---
title: Build a personal assistant
description: Follow four short tutorials in the kagent UI to build a personal assistant with a tool, shared prompts, and a daily job.
weight: 1
author: kagent.dev
# This page lays out its own path, so skip the auto-generated child grid.
disableCards: true
---

{{< tutorial-banner title="Build a personal assistant" text="Four short tutorials, one agent. Each step adds something to the same assistant." cta="Start with Build an Agent" page="build-an-agent" >}}

Follow the steps in order. You start with an empty installation and finish with an assistant that has a tool, shared prompt text, and a daily job. Each step takes a few minutes, and all of it happens in the kagent UI.

{{< story-path >}}
  {{< story-step title="Build an Agent" page="build-an-agent" image="img/kagent-tutorial-build-agent.png" text="Create the personal assistant from one form, then turn its behavior into a template that other agents can share." result="You end up with: two agents and a shared template." >}}
  {{< story-step title="Add an MCP server" page="add-an-mcp-server" image="img/kagent-tutorial-mcp-server.png" text="Register a weather server and give its tool to the assistant, so that it can do something beyond talking." result="You end up with: an assistant that can look up the weather." >}}
  {{< story-step title="Create a prompt library" page="prompt-library" image="img/kagent-tutorial-prompt-library.png" text="Keep the assistant's tone and safety rules as reusable fragments, in one place." result="You end up with: a prompt library with two fragments." >}}
  {{< story-step title="Schedule an agent" page="schedule-an-agent" image="img/kagent-tutorial-schedule.png" text="Have the assistant write a plan for your day every morning, without being asked." result="You end up with: a daily schedule and its run history." >}}
{{< /story-path >}}

---
title: Tutorials
description: Build agents in the kagent UI with four projects to follow from start to finish, and short tutorials for single tasks.
weight: 6
author: kagent.dev
# This page lays out its own path and cards, so skip the auto-generated child grid.
disableCards: true
# First entry under Tutorials in the left nav: a link back to this page.
sidebarLinks:
  - title: Get Started
---

{{< tutorial-banner title="Learn kagent by building" text="Pick a project and follow it from an empty installation to a working agent, or go straight to the one task that you need." cta="Start with a personal AI assistant" page="personal-assistant" >}}

## Build a project

Five agents, each built from start to finish in the kagent UI. Pick any one. If you are new to kagent, start with the personal AI assistant.

{{< tile-grid cols="3" >}}
  {{< tile title="Build a personal AI assistant" page="personal-assistant" image="img/kagent-tutorial-personal-assistant.png" text="An assistant with a personality of its own, a weather tool, and a morning routine that runs without you asking." note="Best first project" >}}
  {{< tile title="Build a K8s SRE" page="k8s-sre" image="img/kagent-tutorial-k8s-sre.png" text="An agent that reads the cluster on its own to find out what is wrong, and asks for your approval before it changes anything." note="You learn: tool selection and approval" >}}
  {{< tile title="Build a sandbox coding agent" page="sandbox-coding-agent" image="img/kagent-tutorial-code-runner.png" text="An agent that writes Python, runs it in an isolated Sandbox, reports the output, and cleans up after itself." note="You learn: sandbox templates and tools" >}}
  {{< tile title="Build a scheduled agent" page="scheduled-agent" image="img/kagent-tutorial-scheduled-agent.png" text="An agent that writes a cluster health report every day and leaves it for you to read." note="You learn: schedules and run history" >}}
  {{< tile title="Build a CVE agent" page="cve-agent" image="img/kagent-tutorial-cve-agent.png" text="An agent that reads the CISA catalog of exploited vulnerabilities and reports the newest entries." note="You learn: built-in tools and outside access" >}}
{{< /tile-grid >}}

## Tutorials

One task each, a few minutes long.

{{< cards cols="3" >}}
  {{< card title="Build an Agent" subtitle="Create an agent from one form, then a shared template." path="/get-started/build-an-agent/" icon="/icons/tutorial-agent.svg" >}}
  {{< card title="Add an MCP server" subtitle="Register a server and give its tools to an agent." path="/get-started/add-an-mcp-server/" icon="/icons/tutorial-mcp.svg" >}}
  {{< card title="Create a prompt library" subtitle="Keep reusable prompt text in one place." path="/get-started/prompt-library/" icon="/icons/tutorial-prompts.svg" >}}
  {{< card title="Create a policy" subtitle="Create an egress policy and attach it." path="/get-started/egress-policy/" icon="/icons/tutorial-policy.svg" >}}
  {{< card title="Schedule an agent" subtitle="Run an agent automatically." path="/get-started/schedule-an-agent/" icon="/icons/tutorial-schedule.svg" >}}
  {{< card title="Add a model" subtitle="Run an agent on a second provider." path="/get-started/add-a-model/" icon="/icons/tutorial-model.svg" >}}
  {{< card title="Add a skill" subtitle="Package know-how as a skill and attach it." path="/get-started/add-a-skill/" icon="/icons/tutorial-skill.svg" >}}
  {{< card title="Add a plugin" subtitle="Ship several skills together as one plugin." path="/get-started/add-a-plugin/" icon="/icons/tutorial-plugin.svg" >}}
  {{< card title="Set up a sandbox template" subtitle="Create a template and run a command in a Sandbox." path="/get-started/sandbox-template/" icon="/icons/tutorial-sandbox.svg" >}}
  {{< card title="Human in the loop" subtitle="Make an agent ask before it runs a tool." path="/get-started/human-in-the-loop/" icon="/icons/tutorial-approval.svg" >}}
{{< /cards >}}

## Build with YAML

Prefer files and the command line? These tutorials build an agent and bind a tool as Kubernetes resources.

{{< cards cols="2" >}}
  {{< card title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then talk to it with the CLI." path="/get-started/your-first-agent/" icon="cube" >}}
  {{< card title="Your first MCP tool" subtitle="Bind a Model Context Protocol tool to an AgentTemplate." path="/get-started/your-first-mcp-tool/" icon="chip" >}}
{{< /cards >}}

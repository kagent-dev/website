---
title: Sandboxes
description: Run commands and work with files in isolated scratch environments that people, applications, and agents create on demand.
weight: 55
author: kagent.dev
---

A kagent {{< gloss "Sandbox" >}}Sandbox{{< /gloss >}} is an isolated scratch environment that you create on demand, run commands in, and then delete or let expire. Each Sandbox runs on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}) behind the same isolation boundary as an agent, and it has no outbound network access unless you grant it.

Use a Sandbox when something other than an agent's own harness needs a place to run code. Examples include a model's generated script, a test that must not change the host, or a tool call that an agent sends from outside the cluster. A person reaches a Sandbox through the `kagent` CLI, an application through gRPC, and an agent through the kagent Model Context Protocol (MCP) server.
